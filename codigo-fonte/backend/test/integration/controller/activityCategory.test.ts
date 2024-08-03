import { Application } from 'express';
import supertest from 'supertest';
import { Repository } from 'typeorm';
import { dataSource } from '@database/connection';

import { Server } from 'src/server';

import { User } from '@models/User';
import { UserLevel } from '@models/UserLevel';
import { Event } from '@models/Event';
import { EventCategory } from '@models/EventCategory';
import { ActivityCategory } from '@models/ActivityCategory';
import { Room } from '@models/Room';
import { Activity } from '@models/Activity';

import { createMockUser } from 'test/utils/createMockUser';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockEvent } from 'test/utils/createMockEvent';
import { cloneObject } from 'test/utils/cloneObject';
import { createMockActivity } from 'test/utils/createMockActivity';

describe('Controle da categoria da atividade - /activity_category', () => {
    const baseUrl = '/api/v1/activity_category';

    let app: Application;

    let commonUser: User, adminUser: User;

    let eventCategory: EventCategory;
    let event: Event;
    let room: Room;
    let activityCategory: ActivityCategory;
    let activity: Activity;

    let commonUserToken: string, adminUserToken: string;

    let userRepository: Repository<User>;
    let eventCategoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let roomRepository: Repository<Room>;
    let activityCategoryRepository: Repository<ActivityCategory>;
    let activityRepository: Repository<Activity>;


    beforeAll(async () => {
        app = Server().getApp();
        userRepository = dataSource.getRepository(User);
        eventCategoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        roomRepository = dataSource.getRepository(Room);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);
        activityRepository = dataSource.getRepository(Activity);

        commonUser = createMockUser(
            'userCommonTestController@gmail.com',
            '48163430834',
            '30999291111'
        );
        adminUser = createMockUser(
            'userAdminTestController@gmail.com',
            '57868324228',
            '15988291111'
        );
        adminUser.level = UserLevel.ADMIN;

        eventCategory = createMockEventCategory(
            'eventos legais ifsp teste controle',
            'elitc438'
        );
        event = createMockEvent([adminUser], eventCategory);
        room = new Room('Sala aleatoria4324', 32);
        activityCategory = new ActivityCategory('TS', 'Teste');
        activity = createMockActivity(event, room, [commonUser], activityCategory);

        const password = commonUser.password;

        await userRepository.save(commonUser);
        await userRepository.save(adminUser);
        await eventCategoryRepository.save(eventCategory);
        await eventRepository.save(event);
        await roomRepository.save(room);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);

        let res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: adminUser.email, password });
        adminUserToken = `Bearer ${res.body.token}`;
    });

    afterAll(async () => {
        await activityRepository.delete(activity.id);
        await activityCategoryRepository.delete(activityCategory.id);
        await roomRepository.delete(room.id);
        await eventRepository.delete(event.id);
        await eventCategoryRepository.delete(eventCategory.id);
        await userRepository.delete(commonUser.id);
        await userRepository.delete(adminUser.id);
    });

    describe('GET', () => {
        const categories: ActivityCategory[] = [];

        const expectedCategoryBodyGetOne = {
            id: expect.any(Number),
            code: expect.any(String),
            description: expect.any(String),
        };
        const expectedCategoryBodyGetAll = {
            ...expectedCategoryBodyGetOne,
            canExclude: expect.any(Boolean),
        };

        beforeAll(async () => {
            categories.push(
                await activityCategoryRepository.save(new ActivityCategory('MR', 'Mesa Redonda'))
            );
            categories.push(
                await activityCategoryRepository.save(new ActivityCategory('MC', 'Mini-curso'))
            );
            categories.push(
                await activityCategoryRepository.save(new ActivityCategory('PA', 'Palestra'))
            );
        });

        afterAll(async () => {
            await activityCategoryRepository.delete(categories[0].id);
            await activityCategoryRepository.delete(categories[1].id);
            await activityCategoryRepository.delete(categories[2].id);
        });

        describe('/', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}`);

                const body = response.body;
                const status = response.statusCode;

                expect(status).toBe(200);
                expect(body.length).toBe(4);
            });

            test('Deve consultar os atributos corretos das categorias', async () => {
                const response = await supertest(app).get(`${baseUrl}`);

                const body = response.body;
                expect(body[0]).toEqual(expectedCategoryBodyGetAll);
            });

            test('Deve consultar três categorias por página', async () => {
                let response = await supertest(app).get(
                    `${baseUrl}?page=1&limit=3`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(3);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);

                response = await supertest(app).get(
                    `${baseUrl}?page=2&limit=3`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);

                response = await supertest(app).get(
                    `${baseUrl}?page=3&limit=3`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);
            });

            test('Deve consultar as categorias com "M" no código', async () => {
                const response = await supertest(app).get(`${baseUrl}?code=M`);

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });

            test('Espera-se que a categoria consultada não seja exclusível', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?code=${activityCategory.code}`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(1);
                expect(response.body[0].canExclude).toBeFalsy();
            });

            test('Espera-se que a categoria consultada seja exclusível', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?code=${categories[0].code}`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(1);
                expect(response.body[0].canExclude).toBeTruthy();
            });
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${categories[0].id}`
                );

                const body = response.body;
                const status = response.statusCode;

                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });

            test('Deve consultar os atributos corretos da categoria', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${categories[0].id}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expectedCategoryBodyGetOne);
            });

            test('Deve consultar a categoria existente corretamente', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${categories[0].id}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(
                    expect.objectContaining({
                        id: categories[0].id,
                        code: categories[0].code,
                        description: categories[0].description,
                    })
                );
            });

            test('Deve falhar em consultar uma categoria inexistente', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${categories[0].id + 543543}`
                );

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });

    describe('POST', () => {
        let activityCategoryData: Partial<ActivityCategory>;

        beforeAll(() => {
            activityCategoryData = {
                code: 'AR',
                description: 'Adventure Rank',
            };
        });

        describe('/', () => {
            test('Deve submeter e cadastrar uma nova categoria como admin com sucesso', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(activityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(201);

                const body = response.body;

                expect(body).toEqual({
                    id: expect.any(Number),
                    code: activityCategoryData.code,
                    description: activityCategoryData.description,
                });

                await activityCategoryRepository.delete(body.id);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(activityCategoryData);

                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(400);
                expect(body.id).toBeUndefined();
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send(activityCategoryData);

                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });

            test('Deve falhar em submeter uma categoria sem código', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                delete wrongActivityCategoryData.code;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código vazio', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = '';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com mais de 3 caracteres', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = 'a'.repeat(3);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com números', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = '1A';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com espaço', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = ' A';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com caracteres especiais', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = 'A!';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código conflitante', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.code = activityCategory.code;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter uma categoria sem descrição', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                delete wrongActivityCategoryData.description;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter uma categoria com descrição vazia', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.description = '';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter uma categoria com URL com mais de 200 caracteres', async () => {
                const wrongActivityCategoryData = cloneObject(activityCategoryData);
                wrongActivityCategoryData.description = 'a'.repeat(201);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });
        });
    });

    describe('PUT', () => {
        let newActivityCategoryData: Partial<ActivityCategory>;

        beforeAll(() => {
            newActivityCategoryData = {
                code: 'BR',
                description: 'Brasil',
            };
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: activityCategory.code,
                    });

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em acessar sem autenticação', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .send({
                        code: activityCategory.code,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em acessar como usuário comum', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send({
                        code: activityCategory.code,
                    });

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve alterar os atributos da categoria com sucesso', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(newActivityCategoryData);

                const status = response.statusCode;
                const modifiedCategory = await activityCategoryRepository.findOne(activityCategory.id);

                expect(status).toBe(200);

                expect(modifiedCategory).toEqual({
                    id : activityCategory.id,
                    code: newActivityCategoryData.code,
                    description: newActivityCategoryData.description
                });
            });

            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send();

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter uma categoria com código null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: ''
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com mais de 3 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: 'a'.repeat(3),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código conflitante', async () => {
                let dummyCategory = new ActivityCategory('LO', 'aas as fsdf ');
                dummyCategory = await activityCategoryRepository.save(dummyCategory);

                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: dummyCategory.code
                    });

                await activityCategoryRepository.delete(dummyCategory.id);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter uma categoria com código com números', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: 'K3',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com espaço', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: 'K ',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com código com caracteres especiais', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: 'J$',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma categoria com desrição null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        description: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter uma categoria com descrição vazia', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        description: ''
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter uma categoria com descrição com mais de 200 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        description: 'a'.repeat(201),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em alterar uma categoria inexistente', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${activityCategory.id + 23445}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(newActivityCategoryData);

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });

    describe('DELETE', () => {
        let categoryToBeDeleted: ActivityCategory;
        beforeEach(async () => {
            categoryToBeDeleted = await activityCategoryRepository.save(
                new ActivityCategory('HE', 'Alguma categoria nsdjfs')
            );
        });

        afterEach(async () => {
            await activityCategoryRepository.delete(categoryToBeDeleted.id);
        });

        describe('/:id', () => {
            test('Deve conseguir excluir a categoria como administrador', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${categoryToBeDeleted.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;
                expect(status).toBe(204);
            });

            test('Deve falhar em excluir a categoria como usuário comum', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${categoryToBeDeleted.id}`)
                    .set({
                        authorization: commonUserToken,
                    });

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em excluir a categoria sem autenticação', async () => {
                const response = await supertest(app).delete(
                    `${baseUrl}/${categoryToBeDeleted.id}`
                );

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em excluir uma categoria associada a uma atividade', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${activityCategory.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em excluir uma categoria inexistente', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${categoryToBeDeleted.id + 1000}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });
});