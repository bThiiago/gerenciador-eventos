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
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockEvent_1 = require("test/utils/createMockEvent");
const cloneObject_1 = require("test/utils/cloneObject");
describe('Controle da categoria do evento - /event_category', () => {
    const baseUrl = '/api/v1/event_category';
    let app;
    let commonUser, adminUser;
    let eventCategory;
    let event;
    let commonUserToken, adminUserToken;
    let userRepository;
    let eventCategoryRepository;
    let eventRepository;
    beforeAll(async () => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        commonUser = (0, createMockUser_1.createMockUser)('userCommonTestController@gmail.com', '48163430834', '30999291111');
        adminUser = (0, createMockUser_1.createMockUser)('userAdminTestController@gmail.com', '57868324228', '15988291111');
        adminUser.level = UserLevel_1.UserLevel.ADMIN;
        eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('eventos legais ifsp teste controle', 'elitc438');
        event = (0, createMockEvent_1.createMockEvent)([adminUser], eventCategory);
        const password = commonUser.password;
        await userRepository.save(commonUser);
        await userRepository.save(adminUser);
        await eventCategoryRepository.save(eventCategory);
        await eventRepository.save(event);
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
        await eventRepository.delete(event.id);
        await eventCategoryRepository.delete(eventCategory.id);
        await userRepository.delete(commonUser.id);
        await userRepository.delete(adminUser.id);
    });
    describe('GET', () => {
        const categories = [];
        const expectedCategoryBodyGetOne = {
            id: expect.any(Number),
            category: expect.any(String),
            url_src: expect.any(String),
        };
        const expectedCategoryBodyGetAll = {
            ...expectedCategoryBodyGetOne,
            canExclude: expect.any(Boolean),
        };
        beforeAll(async () => {
            categories.push(await eventCategoryRepository.save((0, createMockEventCategory_1.createMockEventCategory)('Categoria 1', 'ctg123')));
            categories.push(await eventCategoryRepository.save((0, createMockEventCategory_1.createMockEventCategory)('Categoria 2', 'ctg13232')));
            categories.push(await eventCategoryRepository.save((0, createMockEventCategory_1.createMockEventCategory)('Categoria 3', 'categoria123')));
        });
        afterAll(async () => {
            await eventCategoryRepository.delete(categories[0].id);
            await eventCategoryRepository.delete(categories[1].id);
            await eventCategoryRepository.delete(categories[2].id);
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
            test('Deve consultar as categorias com "ctg" na URL', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}?url=ctg`);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
            test('Espera-se que a categoria consultada não seja exclusível', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}?url=${eventCategory.url_src}`)
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
                    .get(`${baseUrl}?url=${categories[0].url_src}`)
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
                    category: categories[0].category,
                    url_src: categories[0].url_src,
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
        let eventCategoryData;
        beforeAll(() => {
            eventCategoryData = {
                category: 'Uma categoria interessante',
                url_src: 'semana_legal123',
            };
        });
        describe('/', () => {
            test('Deve submeter e cadastrar uma nova categoria como admin com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(eventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(201);
                const body = response.body;
                expect(body).toEqual({
                    id: expect.any(Number),
                    category: eventCategoryData.category,
                    url_src: eventCategoryData.url_src,
                });
                await eventCategoryRepository.delete(body.id);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .send(eventCategoryData);
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
                    .send(eventCategoryData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });
            test('Deve falhar em submeter uma categoria sem categoria', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                delete wrongEventCategoryData.category;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria com categoria vazia', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.category = '';
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria com categoria com mais de 80 caracteres', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.category = 'a'.repeat(81);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria sem URL', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                delete wrongEventCategoryData.url_src;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL com menos de 2 caractere', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.url_src = '1';
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL com mais de 20 caracteres', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.url_src = 'a'.repeat(21);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL com caracteres especiais ou espaço', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.url_src = ' dsfjn jk 2@@ lol';
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL conflitante', async () => {
                const wrongEventCategoryData = (0, cloneObject_1.cloneObject)(eventCategoryData);
                wrongEventCategoryData.url_src = eventCategory.url_src;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(409);
            });
        });
    });
    describe('PUT', () => {
        let newEventCategoryData;
        beforeAll(() => {
            newEventCategoryData = {
                category: 'uma nova categoria legal eba',
                url_src: 'snct_cool',
            };
        });
        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    category: eventCategory.category,
                });
                const status = response.statusCode;
                expect(status).toBe(200);
            });
            test('Deve falhar em acessar sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .send({
                    category: eventCategory.category,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em acessar como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: commonUserToken,
                })
                    .send({
                    category: eventCategory.category,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve alterar os atributos da categoria com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(newEventCategoryData);
                const status = response.statusCode;
                const modifiedCategory = await eventCategoryRepository.findOne(eventCategory.id);
                expect(status).toBe(200);
                expect(modifiedCategory).toEqual({
                    id: eventCategory.id,
                    category: newEventCategoryData.category,
                    url_src: newEventCategoryData.url_src
                });
            });
            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send();
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma categoria com categoria null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    category: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria com categoria vazia', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    category: ''
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria com categoria maior que 80 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    category: 'a'.repeat(81),
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"category"');
            });
            test('Deve falhar em submeter uma categoria com URL null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    url_src: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL menor que 2 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    url_src: 'a'
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL maior que 20 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    url_src: 'a'.repeat(21),
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"url_src"');
            });
            test('Deve falhar em submeter uma categoria com URL conflitante', async () => {
                let dummyCategory = (0, createMockEventCategory_1.createMockEventCategory)('asdasdas g34234 ', 'dummy_category123');
                dummyCategory = await eventCategoryRepository.save(dummyCategory);
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send({
                    url_src: dummyCategory.url_src
                });
                const status = response.statusCode;
                expect(status).toBe(409);
                await eventCategoryRepository.delete(dummyCategory.id);
            });
            test('Deve falhar em alterar uma categoria inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${eventCategory.id + 23445}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(newEventCategoryData);
                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });
    describe('DELETE', () => {
        let categoryToBeDeleted;
        beforeEach(async () => {
            categoryToBeDeleted = await eventCategoryRepository.save((0, createMockEventCategory_1.createMockEventCategory)('lol sei la vibgs', 'asd_123'));
        });
        afterEach(async () => {
            await eventCategoryRepository.delete(categoryToBeDeleted.id);
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
            test('Deve falhar em excluir uma categoria associada a um evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${eventCategory.id}`)
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
//# sourceMappingURL=eventCategory.test.js.map