import { Application } from 'express';
import supertest from 'supertest';
import { Repository } from 'typeorm';
import { dataSource } from '@database/connection';

import { Server } from 'src/server';

import { User } from '@models/User';
import { UserLevel } from '@models/UserLevel';
import { Event } from '@models/Event';
import { Activity } from '@models/Activity';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { ActivityCategory } from '@models/ActivityCategory';

import { createMockUser } from 'test/utils/createMockUser';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockActivity } from 'test/utils/createMockActivity';
import { cloneObject } from 'test/utils/cloneObject';

describe('Controle da sala - /room', () => {
    const baseUrl = '/api/v1/room';

    let app: Application;

    let commonUser: User,
        adminUser: User,
        eventOrganizerUser: User,
        activityResponsibleUser: User;

    let room: Room;
    let eventCategory: EventCategory;
    let event: Event;
    let activityCategory: ActivityCategory;
    let activity: Activity;

    let commonUserToken: string,
        adminUserToken: string,
        eventOrganizerUserToken: string;

    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let eventCategoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let activityCategoryRepository: Repository<ActivityCategory>;
    let activityRepository: Repository<Activity>;

    beforeAll(async () => {
        app = Server().getApp();
        userRepository = dataSource.getRepository(User);
        eventCategoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        activityRepository = dataSource.getRepository(Activity);
        roomRepository = dataSource.getRepository(Room);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        commonUser = createMockUser(
            'userCommonTestController@gmail.com',
            '48163430834',
            '30999291111'
        );
        activityResponsibleUser = createMockUser(
            'userActivityTestController@gmail.com',
            '53317621079',
            '88473819572'
        );
        eventOrganizerUser = createMockUser(
            'userEventTestController@gmail.com',
            '71286494095',
            '66857498294'
        );
        adminUser = createMockUser(
            'userAdminTestController@gmail.com',
            '57868324228',
            '15988291111'
        );
        adminUser.level = UserLevel.ADMIN;

        room = new Room('teste controle 23232', 30);
        eventCategory = createMockEventCategory(
            'eventos legais ifsp teste controle',
            'elitc438'
        );
        event = createMockEvent([eventOrganizerUser], eventCategory);
        activityCategory = new ActivityCategory('LF', 'eaeaeeafdsfsd');
        activity = createMockActivity(event, room, [activityResponsibleUser], activityCategory);

        const password = commonUser.password;

        await userRepository.save(commonUser);
        await userRepository.save(activityResponsibleUser);
        await userRepository.save(eventOrganizerUser);
        await userRepository.save(adminUser);
        await roomRepository.save(room);
        await eventCategoryRepository.save(eventCategory);
        await eventRepository.save(event);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);

        let res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: eventOrganizerUser.email, password });
        eventOrganizerUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: adminUser.email, password });
        adminUserToken = `Bearer ${res.body.token}`;
    });

    afterAll(async () => {
        await activityRepository.delete(activity.id);
        await activityCategoryRepository.delete(activityCategory.id);
        await eventRepository.delete(event.id);
        await eventCategoryRepository.delete(eventCategory.id);
        await roomRepository.delete(room.id);
        await userRepository.delete(commonUser.id);
        await userRepository.delete(activityResponsibleUser.id);
        await userRepository.delete(eventOrganizerUser.id);
        await userRepository.delete(adminUser.id);
    });

    describe('GET', () => {
        const rooms: Room[] = [];
        const expectedRoomBodyGetAll = {
            id: expect.any(Number),
            code: expect.any(String),
            capacity: expect.any(Number),
            description: expect.any(String),
            canExclude: expect.any(Boolean),
        };
        const expectedRoomBodyGetOne = {
            id: expect.any(Number),
            code: expect.any(String),
            capacity: expect.any(Number),
            description: expect.any(String),
        };

        beforeAll(async () => {
            rooms.push(
                await roomRepository.save(
                    new Room('sala qualquer sei la 3024', 50)
                )
            );
            rooms.push(
                await roomRepository.save(new Room('Sala 23 - Laboratório', 50))
            );
        });

        afterAll(async () => {
            await roomRepository.delete(rooms[0].id);
            await roomRepository.delete(rooms[1].id);
        });

        describe('/', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app).get(baseUrl).set({
                    authorization: adminUserToken,
                });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);

                expect(body.length).toBe(3);
            });

            test('Deve conseguir acessar a rota como organizador de evento', async () => {
                const response = await supertest(app).get(baseUrl).set({
                    authorization: eventOrganizerUserToken,
                });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);

                expect(body.length).toBe(3);
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app).get(baseUrl).set({
                    authorization: commonUserToken,
                });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(403);

                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(baseUrl);

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(400);

                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos das salas', async () => {
                const response = await supertest(app).get(baseUrl).set({
                    authorization: adminUserToken,
                });

                const body = response.body;

                expect(body[0]).toEqual(expectedRoomBodyGetAll);
            });

            test('Deve consultar duas salas por página', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}?page=1&limit=2`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}?page=2&limit=2`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}?page=3&limit=2`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });

            test('Deve consultar as salas com "23" no código', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?code=23`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });

            test('Espera-se que a sala consultada não seja exclusível', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?code=${room.code}`)
                    .set({
                        authorization: adminUserToken,
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(1);
                expect(response.body[0].canExclude).toBeFalsy();
            });

            test('Espera-se que a sala consultada seja exclusível', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?code=${rooms[0].code}`)
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
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });

            test('Deve conseguir acessar a rota como organizador de evento', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: commonUserToken,
                    });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${room.id}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(400);
                expect(body.id).toBeUndefined();
            });

            test('Deve consultar os atributos corretos da sala', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expectedRoomBodyGetOne);
            });

            test('Deve consultar a sala existente corretamente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(
                    expect.objectContaining({
                        id: room.id,
                        code: room.code,
                        capacity: room.capacity,
                        description: room.description,
                    })
                );
            });

            test('Deve falhar em consultar uma sala inexistente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${room.id + 45324}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });

    describe('POST', () => {
        let roomData: Partial<Room>;

        beforeAll(() => {
            roomData = {
                code: 'E222',
                capacity: 25,
                description: 'Sala de aula'
            };
        });

        describe('/', () => {
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(roomData);

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
                    .send(roomData);

                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });

            test('Deve falhar em acessar a rota como organizador de evento', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });

            test('Deve submeter e cadastrar uma nova sala como admin com sucesso', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                expect(status).toBe(201);

                const body = response.body;

                expect(body).toEqual({
                    id: expect.any(Number),
                    code: roomData.code,
                    capacity: roomData.capacity,
                    description: roomData.description,
                });

                await roomRepository.delete(body.id);
            });

            test('Deve falhar em submeter uma sala sem código', async () => {
                const wrongRoomData = cloneObject(roomData);
                delete wrongRoomData.code;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongRoomData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma sala com código com mais de 100 caracteres', async () => {
                const wrongRoomData = cloneObject(roomData);
                wrongRoomData.code = 'a'.repeat(101);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongRoomData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma sala com código conflitante', async () => {
                const wrongRoomData = cloneObject(roomData);
                wrongRoomData.code = room.code;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongRoomData);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter uma sala sem capacidade', async () => {
                const wrongRoomData = cloneObject(roomData);
                delete wrongRoomData.capacity;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongRoomData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"capacity"');
            });

            test('Deve falhar em submeter uma sala com capacidade menor que 1', async () => {
                const wrongRoomData = cloneObject(roomData);
                wrongRoomData.capacity = 0;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongRoomData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"capacity"');
            });
        });
    });

    describe('PUT', () => {
        let newRoomData: Partial<Room>;

        beforeAll(() => {
            newRoomData = {
                code: 'E225',
                capacity: 37,
                description: 'Sala de aula',
            };
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const roomData = {
                    code: room.code,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em acessar sem autenticação', async () => {
                const roomData = {
                    code: room.code,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .send(roomData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em acessar como usuário comum', async () => {
                const roomData = {
                    code: room.code,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em acessar como organizador de evento', async () => {
                const roomData = {
                    code: room.code,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve alterar os atributos da sala com sucesso', async () => {
                const roomData = {
                    code: newRoomData.code,
                    capacity: newRoomData.capacity,
                    description: newRoomData.description,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(roomData);

                const status = response.statusCode;
                const modifiedRoom = await roomRepository.findOne(room.id);

                expect(status).toBe(200);

                expect(modifiedRoom).toEqual({
                    id : room.id,
                    code : newRoomData.code,
                    capacity : newRoomData.capacity,
                    description: newRoomData.description,
                });
            });

            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send();

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter uma sala com código null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
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

            test('Deve falhar em submeter uma sala com código conflitante', async () => {
                let temporaryRoom = new Room('Codigo p conflito 213', 33);
                temporaryRoom = await roomRepository.save(temporaryRoom);
                
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: temporaryRoom.code,
                    });

                const status = response.statusCode;
                expect(status).toBe(409);

                await roomRepository.delete(temporaryRoom.id);
            });

            test('Deve falhar em submeter uma sala com código maior que 100 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        code: 'a'.repeat(101),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"code"');
            });

            test('Deve falhar em submeter uma sala com capacidade null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        capacity: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"capacity"');
            });

            test('Deve falhar em submeter uma sala com capacidade menor que 1', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        capacity: 0,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"capacity"');
            });

            test('Deve falhar em alterar uma sala inexistente', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${room.id + 23445}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(newRoomData);

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });

    describe('DELETE', () => {
        let roomToBeDeleted: Room;
        beforeEach(async () => {
            roomToBeDeleted = await roomRepository.save(
                new Room('Sala para exclusão 5435', 27)
            );
        });

        afterEach(async () => {
            await roomRepository.delete(roomToBeDeleted.id);
        });

        describe('/:id', () => {
            test('Deve conseguir excluir a sala como administrador', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(204);
            });

            test('Deve falhar em excluir a sala como organizador do evento', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(403);
            });

            test('Deve falhar em excluir a sala como usuário comum', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                        authorization: commonUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(403);
            });

            test('Deve falhar em excluir a sala sem autenticação', async () => {
                const response = await supertest(app).delete(
                    `${baseUrl}/${roomToBeDeleted.id}`
                );

                const status = response.statusCode;

                expect(status).toBe(400);
            });

            test('Deve falhar em excluir uma sala associada a uma atividade', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${room.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(400);
            });

            test('Deve falhar em excluir uma sala inexistente', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id + 1000}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(404);
            });
        });
    });
});