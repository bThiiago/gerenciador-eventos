"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const connection_1 = require("@database/connection");
const server_1 = require("src/server");
const User_1 = require("@models/User");
const UserLevel_1 = require("@models/UserLevel");
const Event_1 = require("@models/Event");
const EventCategory_1 = require("@models/EventCategory");
const ActivityCategory_1 = require("@models/ActivityCategory");
const Room_1 = require("@models/Room");
const Activity_1 = require("@models/Activity");
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockEvent_1 = require("test/utils/createMockEvent");
const cloneObject_1 = require("test/utils/cloneObject");
const createMockActivity_1 = require("test/utils/createMockActivity");
describe('Controle da categoria da atividade - /activity_category', () => {
    const baseUrl = '/api/v1/activity_category';
    let app;
    let commonUser, adminUser;
    let eventCategory;
    let event;
    let room;
    let activityCategory;
    let activity;
    let commonUserToken, adminUserToken;
    let userRepository;
    let eventCategoryRepository;
    let eventRepository;
    let roomRepository;
    let activityCategoryRepository;
    let activityRepository;
    beforeAll(async () => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        commonUser = (0, createMockUser_1.createMockUser)('userCommonTestController@gmail.com', '48163430834', '30999291111');
        adminUser = (0, createMockUser_1.createMockUser)('userAdminTestController@gmail.com', '57868324228', '15988291111');
        adminUser.level = UserLevel_1.UserLevel.ADMIN;
        eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('eventos legais ifsp teste controle', 'elitc438');
        event = (0, createMockEvent_1.createMockEvent)([adminUser], eventCategory);
        room = new Room_1.Room('Sala aleatoria4324', 32);
        activityCategory = new ActivityCategory_1.ActivityCategory('TS', 'Teste');
        activity = (0, createMockActivity_1.createMockActivity)(event, room, [commonUser], activityCategory);
        const password = commonUser.password;
        await userRepository.save(commonUser);
        await userRepository.save(adminUser);
        await eventCategoryRepository.save(eventCategory);
        await eventRepository.save(event);
        await roomRepository.save(room);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);
        let res = await (0, supertest_1.default)(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;
        res = await (0, supertest_1.default)(app)
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
        const categories = [];
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
            categories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('MR', 'Mesa Redonda')));
            categories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('MC', 'Mini-curso')));
            categories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('PA', 'Palestra')));
        });
        afterAll(async () => {
            await activityCategoryRepository.delete(categories[0].id);
            await activityCategoryRepository.delete(categories[1].id);
            await activityCategoryRepository.delete(categories[2].id);
        });
        describe('/', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.length).toBe(4);
            });
            test('Deve consultar os atributos corretos das categorias', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}`);
                const body = response.body;
                expect(body[0]).toEqual(expectedCategoryBodyGetAll);
            });
            test('Deve consultar três categorias por página', async () => {
                let response = await (0, supertest_1.default)(app).get(`${baseUrl}?page=1&limit=3`);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(3);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);
                response = await (0, supertest_1.default)(app).get(`${baseUrl}?page=2&limit=3`);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);
                response = await (0, supertest_1.default)(app).get(`${baseUrl}?page=3&limit=3`);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(4);
            });
            test('Deve consultar as categorias com "M" no código', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}?code=M`);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
            test('Espera-se que a categoria consultada não seja exclusível', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${categories[0].id}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });
            test('Deve consultar os atributos corretos da categoria', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${categories[0].id}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expectedCategoryBodyGetOne);
            });
            test('Deve consultar a categoria existente corretamente', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${categories[0].id}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expect.objectContaining({
                    id: categories[0].id,
                    code: categories[0].code,
                    description: categories[0].description,
                }));
            });
            test('Deve falhar em consultar uma categoria inexistente', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${categories[0].id + 543543}`);
                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });
    describe('POST', () => {
        let activityCategoryData;
        beforeAll(() => {
            activityCategoryData = {
                code: 'AR',
                description: 'Adventure Rank',
            };
        });
        describe('/', () => {
            test('Deve submeter e cadastrar uma nova categoria como admin com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .send(activityCategoryData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(400);
                expect(body.id).toBeUndefined();
            });
            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                delete wrongActivityCategoryData.code;
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = '';
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = 'a'.repeat(3);
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = '1A';
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = ' A';
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = 'A!';
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.code = activityCategory.code;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongActivityCategoryData);
                const status = response.statusCode;
                expect(status).toBe(409);
            });
            test('Deve falhar em submeter uma categoria sem descrição', async () => {
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                delete wrongActivityCategoryData.description;
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.description = '';
                const response = await (0, supertest_1.default)(app)
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
                const wrongActivityCategoryData = (0, cloneObject_1.cloneObject)(activityCategoryData);
                wrongActivityCategoryData.description = 'a'.repeat(201);
                const response = await (0, supertest_1.default)(app)
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
        let newActivityCategoryData;
        beforeAll(() => {
            newActivityCategoryData = {
                code: 'BR',
                description: 'Brasil',
            };
        });
        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .send({
                    code: activityCategory.code,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em acessar como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(newActivityCategoryData);
                const status = response.statusCode;
                const modifiedCategory = await activityCategoryRepository.findOne(activityCategory.id);
                expect(status).toBe(200);
                expect(modifiedCategory).toEqual({
                    id: activityCategory.id,
                    code: newActivityCategoryData.code,
                    description: newActivityCategoryData.description
                });
            });
            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activityCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send();
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma categoria com código null', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                let dummyCategory = new ActivityCategory_1.ActivityCategory('LO', 'aas as fsdf ');
                dummyCategory = await activityCategoryRepository.save(dummyCategory);
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
        let categoryToBeDeleted;
        beforeEach(async () => {
            categoryToBeDeleted = await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('HE', 'Alguma categoria nsdjfs'));
        });
        afterEach(async () => {
            await activityCategoryRepository.delete(categoryToBeDeleted.id);
        });
        describe('/:id', () => {
            test('Deve conseguir excluir a categoria como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${categoryToBeDeleted.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve falhar em excluir a categoria como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${categoryToBeDeleted.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em excluir a categoria sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).delete(`${baseUrl}/${categoryToBeDeleted.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em excluir uma categoria associada a uma atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${activityCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em excluir uma categoria inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
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
//# sourceMappingURL=activityCategory.test.js.map