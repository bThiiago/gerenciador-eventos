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
const Activity_1 = require("@models/Activity");
const EventCategory_1 = require("@models/EventCategory");
const Room_1 = require("@models/Room");
const ActivityCategory_1 = require("@models/ActivityCategory");
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockActivity_1 = require("test/utils/createMockActivity");
const cloneObject_1 = require("test/utils/cloneObject");
describe('Controle da sala - /room', () => {
    const baseUrl = '/api/v1/room';
    let app;
    let commonUser, adminUser, eventOrganizerUser, activityResponsibleUser;
    let room;
    let eventCategory;
    let event;
    let activityCategory;
    let activity;
    let commonUserToken, adminUserToken, eventOrganizerUserToken;
    let userRepository;
    let roomRepository;
    let eventCategoryRepository;
    let eventRepository;
    let activityCategoryRepository;
    let activityRepository;
    beforeAll(async () => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        commonUser = (0, createMockUser_1.createMockUser)('userCommonTestController@gmail.com', '48163430834', '30999291111');
        activityResponsibleUser = (0, createMockUser_1.createMockUser)('userActivityTestController@gmail.com', '53317621079', '88473819572');
        eventOrganizerUser = (0, createMockUser_1.createMockUser)('userEventTestController@gmail.com', '71286494095', '66857498294');
        adminUser = (0, createMockUser_1.createMockUser)('userAdminTestController@gmail.com', '57868324228', '15988291111');
        adminUser.level = UserLevel_1.UserLevel.ADMIN;
        room = new Room_1.Room('teste controle 23232', 30);
        eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('eventos legais ifsp teste controle', 'elitc438');
        event = (0, createMockEvent_1.createMockEvent)([eventOrganizerUser], eventCategory);
        activityCategory = new ActivityCategory_1.ActivityCategory('LF', 'eaeaeeafdsfsd');
        activity = (0, createMockActivity_1.createMockActivity)(event, room, [activityResponsibleUser], activityCategory);
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
        let res = await (0, supertest_1.default)(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;
        res = await (0, supertest_1.default)(app)
            .post('/api/v1/sessions')
            .send({ email: eventOrganizerUser.email, password });
        eventOrganizerUserToken = `Bearer ${res.body.token}`;
        res = await (0, supertest_1.default)(app)
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
        const rooms = [];
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
            rooms.push(await roomRepository.save(new Room_1.Room('sala qualquer sei la 3024', 50)));
            rooms.push(await roomRepository.save(new Room_1.Room('Sala 23 - Laboratório', 50)));
        });
        afterAll(async () => {
            await roomRepository.delete(rooms[0].id);
            await roomRepository.delete(rooms[1].id);
        });
        describe('/', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app).get(baseUrl).set({
                    authorization: adminUserToken,
                });
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });
            test('Deve conseguir acessar a rota como organizador de evento', async () => {
                const response = await (0, supertest_1.default)(app).get(baseUrl).set({
                    authorization: eventOrganizerUserToken,
                });
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });
            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app).get(baseUrl).set({
                    authorization: commonUserToken,
                });
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).get(baseUrl);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve consultar os atributos corretos das salas', async () => {
                const response = await (0, supertest_1.default)(app).get(baseUrl).set({
                    authorization: adminUserToken,
                });
                const body = response.body;
                expect(body[0]).toEqual(expectedRoomBodyGetAll);
            });
            test('Deve consultar duas salas por página', async () => {
                let response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}?page=1&limit=2`)
                    .set({
                    authorization: adminUserToken,
                });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
                response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}?page=2&limit=2`)
                    .set({
                    authorization: adminUserToken,
                });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
                response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}?page=3&limit=2`)
                    .set({
                    authorization: adminUserToken,
                });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });
            test('Deve consultar as salas com "23" no código', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}?code=23`)
                    .set({
                    authorization: adminUserToken,
                });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
            test('Espera-se que a sala consultada não seja exclusível', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${room.id}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(400);
                expect(body.id).toBeUndefined();
            });
            test('Deve consultar os atributos corretos da sala', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${room.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expect.objectContaining({
                    id: room.id,
                    code: room.code,
                    capacity: room.capacity,
                    description: room.description
                }));
            });
            test('Deve falhar em consultar uma sala inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
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
        let roomData;
        beforeAll(() => {
            roomData = {
                code: 'E230',
                capacity: 25,
                description: 'Sala de aula'
            };
        });
        describe('/', () => {
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .send(roomData);
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
                    .send(roomData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body.id).toBeUndefined();
            });
            test('Deve falhar em acessar a rota como organizador de evento', async () => {
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                    description: roomData.description
                });
                await roomRepository.delete(body.id);
            });
            test('Deve falhar em submeter uma sala sem código', async () => {
                const wrongRoomData = (0, cloneObject_1.cloneObject)(roomData);
                delete wrongRoomData.code;
                const response = await (0, supertest_1.default)(app)
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
                const wrongRoomData = (0, cloneObject_1.cloneObject)(roomData);
                wrongRoomData.code = 'a'.repeat(101);
                const response = await (0, supertest_1.default)(app)
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
                const wrongRoomData = (0, cloneObject_1.cloneObject)(roomData);
                wrongRoomData.code = room.code;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(wrongRoomData);
                const status = response.statusCode;
                expect(status).toBe(409);
            });
            test('Deve falhar em submeter uma sala sem capacidade', async () => {
                const wrongRoomData = (0, cloneObject_1.cloneObject)(roomData);
                delete wrongRoomData.capacity;
                const response = await (0, supertest_1.default)(app)
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
                const wrongRoomData = (0, cloneObject_1.cloneObject)(roomData);
                wrongRoomData.capacity = 0;
                const response = await (0, supertest_1.default)(app)
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
        let newRoomData;
        beforeAll(() => {
            newRoomData = {
                code: 'E225',
                capacity: 37,
                description: 'Sala de aula'
            };
        });
        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const roomData = {
                    code: room.code,
                };
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${room.id}`)
                    .send(roomData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em acessar como usuário comum', async () => {
                const roomData = {
                    code: room.code,
                };
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                    description: newRoomData.description
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(roomData);
                const status = response.statusCode;
                const modifiedRoom = await roomRepository.findOne(room.id);
                expect(status).toBe(200);
                expect(modifiedRoom).toEqual({
                    id: room.id,
                    code: newRoomData.code,
                    capacity: newRoomData.capacity,
                    description: newRoomData.description
                });
            });
            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${room.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send();
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma sala com código null', async () => {
                const response = await (0, supertest_1.default)(app)
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
                let temporaryRoom = new Room_1.Room('Codigo p conflito 213', 33);
                temporaryRoom = await roomRepository.save(temporaryRoom);
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
                const response = await (0, supertest_1.default)(app)
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
        let roomToBeDeleted;
        beforeEach(async () => {
            roomToBeDeleted = await roomRepository.save(new Room_1.Room('Sala para exclusão 5435', 27));
        });
        afterEach(async () => {
            await roomRepository.delete(roomToBeDeleted.id);
        });
        describe('/:id', () => {
            test('Deve conseguir excluir a sala como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve falhar em excluir a sala como organizador do evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em excluir a sala como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${roomToBeDeleted.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em excluir a sala sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).delete(`${baseUrl}/${roomToBeDeleted.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em excluir uma sala associada a uma atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/${room.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em excluir uma sala inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
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
//# sourceMappingURL=room.test.js.map