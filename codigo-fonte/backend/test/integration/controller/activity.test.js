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
const ActivityRegistry_1 = require("@models/ActivityRegistry");
const Presence_1 = require("@models/Presence");
const Schedule_1 = require("@models/Schedule");
const ActivityCategory_1 = require("@models/ActivityCategory");
const activity_registry_service_1 = require("@services/activity_registry.service");
const createMockUser_1 = require("test/utils/createMockUser");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockActivity_1 = require("test/utils/createMockActivity");
const cloneObject_1 = require("test/utils/cloneObject");
const createFutureDate_1 = require("test/utils/createFutureDate");
const container_1 = require("@core/container");
describe('Controle da atividade - /activity', () => {
    const baseUrl = '/api/v1/activity';
    const baseEventUrl = '/api/v1/sge';
    let app;
    let commonUser, adminUser, eventOrganizerUser, activityResponsibleUser;
    let room;
    let eventCategory;
    let event;
    let activityCategory;
    let activity;
    let activityRegistryService;
    let commonUserToken, adminUserToken, eventOrganizerUserToken, activityResponsibleUserToken;
    let userRepository;
    let roomRepository;
    let eventCategoryRepository;
    let eventRepository;
    let activityRepository;
    let activityCategoryRepository;
    let activityRegistryRepository;
    let presenceRepository;
    beforeAll(async () => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        activityRegistryRepository = connection_1.dataSource.getRepository(ActivityRegistry_1.ActivityRegistry);
        presenceRepository = connection_1.dataSource.getRepository(Presence_1.Presence);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        activityRegistryService = container_1.container.get(activity_registry_service_1.ActivityRegistryService);
        commonUser = (0, createMockUser_1.createMockUser)('userCommonTestController_activityController@gmail.com', '48636892090', '22559291111');
        activityResponsibleUser = (0, createMockUser_1.createMockUser)('userActivityTestController_activityController@gmail.com', '66346856065', '22553819572');
        eventOrganizerUser = (0, createMockUser_1.createMockUser)('userEventTestController_activityController@gmail.com', '70908637004', '22557498294');
        adminUser = (0, createMockUser_1.createMockUser)('userAdminTestController_activityController@gmail.com', '86638417010', '22558291111');
        adminUser.level = UserLevel_1.UserLevel.ADMIN;
        room = new Room_1.Room('teste controle atividade 34 23232', 30);
        eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('eventos legais ifsp teste controle', 'elitc438');
        event = (0, createMockEvent_1.createMockEvent)([eventOrganizerUser], eventCategory);
        activityCategory = new ActivityCategory_1.ActivityCategory('AD', 'Mesa Redonda');
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
            .send({ email: activityResponsibleUser.email, password });
        activityResponsibleUserToken = `Bearer ${res.body.token}`;
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
        const activities = [];
        let otherEvent;
        let temporaryTeachingUser;
        const expectedActivityRegistryBody = {
            id: expect.any(Number),
            readyForCertificate: expect.any(Boolean),
            registryDate: expect.any(String),
            presences: expect.any(Array),
            user: expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                cpf: expect.any(String),
            }),
            activity: expect.objectContaining({
                id: expect.any(Number),
                title: expect.any(String),
            }),
        };
        beforeAll(async () => {
            temporaryTeachingUser = (0, createMockUser_1.createMockUser)('usuarioMinistranteControleAtividade@gmail.com', '82815839083', '38293829545');
            temporaryTeachingUser = await userRepository.save(temporaryTeachingUser);
            event.statusVisible = true;
            await eventRepository.save(event);
            otherEvent = (0, createMockEvent_1.createMockEvent)([adminUser], eventCategory);
            otherEvent.edition = 25;
            otherEvent = await eventRepository.save(otherEvent);
            activities.push((0, createMockActivity_1.createMockActivity)(event, room, [activityResponsibleUser], activityCategory));
            activities.push((0, createMockActivity_1.createMockActivity)(otherEvent, room, [adminUser], activityCategory));
            activities[0].teachingUsers = [temporaryTeachingUser];
            await activityRepository.save(activities[0]);
            await activityRepository.save(activities[1]);
            await activityRegistryRepository.save(new ActivityRegistry_1.ActivityRegistry(activities[0], commonUser));
            await activityRegistryRepository.save(new ActivityRegistry_1.ActivityRegistry(activities[0], adminUser));
            await activityRegistryRepository.save(new ActivityRegistry_1.ActivityRegistry(activities[1], eventOrganizerUser));
        });
        afterAll(async () => {
            await activityRegistryRepository
                .createQueryBuilder('a')
                .delete()
                .execute();
            await activityRepository.delete(activities[0].id);
            await activityRepository.delete(activities[1].id);
            await eventRepository.delete(otherEvent.id);
            await userRepository.delete(temporaryTeachingUser.id);
        });
        describe('/:activityId', () => {
            let expectedCommonUserActivityBody;
            let expectedAdminActivityBody;
            beforeAll(async () => {
                expectedCommonUserActivityBody = {
                    id: expect.any(Number),
                    title: expect.any(String),
                    description: expect.any(String),
                    vacancy: expect.any(Number),
                    workloadInMinutes: expect.any(Number),
                    indexInCategory: expect.any(Number),
                    event: expect.objectContaining({
                        id: expect.any(Number),
                        edition: expect.any(Number),
                        startDate: expect.any(String),
                        endDate: expect.any(String),
                    }),
                    schedules: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            startDate: expect.any(String),
                            durationInMinutes: expect.any(Number),
                            room: expect.toBeTypeOrNull(Object),
                            url: expect.toBeTypeOrNull(String),
                        }),
                    ]),
                    teachingUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            name: expect.any(String),
                        }),
                    ]),
                    activityCategory: expect.objectContaining({
                        id: expect.any(Number),
                        code: expect.any(String),
                        description: expect.any(String),
                    }),
                };
                expectedAdminActivityBody = {
                    id: expect.any(Number),
                    title: expect.any(String),
                    description: expect.any(String),
                    vacancy: expect.any(Number),
                    workloadInMinutes: expect.any(Number),
                    readyForCertificateEmission: expect.any(Boolean),
                    indexInCategory: expect.any(Number),
                    event: expect.objectContaining({
                        id: expect.any(Number),
                        edition: expect.any(Number),
                        startDate: expect.any(String),
                        endDate: expect.any(String),
                    }),
                    schedules: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            startDate: expect.any(String),
                            durationInMinutes: expect.any(Number),
                            room: expect.toBeTypeOrNull(Object),
                            url: expect.toBeTypeOrNull(String),
                        }),
                    ]),
                    teachingUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            name: expect.any(String),
                            cpf: expect.any(String),
                        }),
                    ]),
                    responsibleUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            name: expect.any(String),
                            cpf: expect.any(String),
                        }),
                    ]),
                    activityCategory: expect.objectContaining({
                        id: expect.any(Number),
                        code: expect.any(String),
                        description: expect.any(String),
                    }),
                };
            });
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${activities[0].id}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });
            test('Deve consultar os atributos corretos das atividades como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${activities[0].id}`);
                const body = response.body;
                expect(body).toEqual(expectedCommonUserActivityBody);
            });
            test('Deve consultar os atributos corretos das atividades como responsável de atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const body = response.body;
                expect(body).toEqual(expectedAdminActivityBody);
            });
            test('Deve consultar os atributos corretos das atividades como organizador do evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const body = response.body;
                expect(body).toEqual(expectedAdminActivityBody);
            });
            test('Deve consultar os atributos corretos das atividades como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const body = response.body;
                expect(body).toEqual(expectedAdminActivityBody);
            });
            test('Deve falhar ao consultar uma atividade inexistente', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${activities[0].id + 4324}`);
                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(404);
                expect(body.id).not.toBeDefined();
            });
        });
        describe('/:activityId/registry', () => {
            test('Deve conseguir acessar a rota como organizador do evento da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.length).toBe(2);
            });
            test('Deve conseguir acessar a rota como responsável da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: activityResponsibleUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.length).toBe(2);
            });
            test('Deve falhar em acessar a rota como organizador do evento de outra atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[1].id}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota como responsável de outra atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[1].id}/registry`)
                    .set({ authorization: activityResponsibleUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: adminUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: commonUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/${activities[0].id}/registry`);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve consultar os atributos corretos da matrícula', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body[0]).toEqual(expectedActivityRegistryBody);
            });
            test('Deve consultar as duas matrículas da atividade 1', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.length).toEqual(2);
            });
            test('Deve consultar a única matrícula da atividade 2', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[1].id}/registry`)
                    .set({ authorization: adminUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.length).toEqual(1);
            });
            test('Deve consultar nenhuma matrícula de uma atividade sem matrícula', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activity.id}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.length).toEqual(0);
            });
            test('Deve falhar em consultar uma atividade inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activity.id + 483294}/registry`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                expect(status).toBe(404);
            });
            test('Deve consultar uma matrícula por página', async () => {
                let response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry?page=1&limit=1`)
                    .set({ authorization: eventOrganizerUserToken });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
                response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry?page=2&limit=1`)
                    .set({ authorization: eventOrganizerUserToken });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
                response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/${activities[0].id}/registry?page=3&limit=1`)
                    .set({ authorization: eventOrganizerUserToken });
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
        });
        describe('/registry/:activityId/:userId', () => {
            test('Deve conseguir acessar a rota como organizador do evento da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.user).toBeDefined();
            });
            test('Deve conseguir acessar a rota como responsável da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`)
                    .set({ authorization: activityResponsibleUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.user).toBeDefined();
            });
            test('Deve falhar em acessar a rota como organizador do evento de outra atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[1].id}/${commonUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota como responsável de outra atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[1].id}/${commonUser.id}`)
                    .set({ authorization: activityResponsibleUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`)
                    .set({ authorization: adminUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota se não for o mesmo usuário', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[1].id}/${eventOrganizerUser.id}`)
                    .set({ authorization: commonUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });
            test('Deve consultar os atributos corretos da matrícula', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body).toEqual(expectedActivityRegistryBody);
            });
            test('Deve consultar os detalhes corretos da matrícula 1 da atividade 1', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body).toEqual(expect.objectContaining({
                    user: expect.objectContaining({
                        id: commonUser.id,
                    }),
                    activity: expect.objectContaining({
                        id: activities[0].id,
                    }),
                }));
            });
            test('Deve consultar os detalhes corretos da matrícula 2 da atividade 1', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${adminUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body).toEqual(expect.objectContaining({
                    user: expect.objectContaining({
                        id: adminUser.id,
                    }),
                    activity: expect.objectContaining({
                        id: activities[0].id,
                    }),
                }));
            });
            test('Deve consultar os detalhes corretos da matrícula 1 da atividade 2', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[1].id}/${eventOrganizerUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body).toEqual(expect.objectContaining({
                    user: expect.objectContaining({
                        id: eventOrganizerUser.id,
                    }),
                    activity: expect.objectContaining({
                        id: activities[1].id,
                    }),
                }));
            });
            test('Deve falhar em consultar uma atividade inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id + 483294}/${commonUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                expect(status).toBe(404);
            });
            test('Deve falhar em consultar um usuário inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/registry/${activities[0].id}/${commonUser.id + 423423}`)
                    .set({ authorization: eventOrganizerUserToken });
                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });
    describe('POST', () => {
        let activityData;
        beforeAll(() => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [
                activityResponsibleUser,
            ], activityCategory);
            activityData = {
                title: activity.title,
                description: activity.description,
                vacancy: activity.vacancy,
                workloadInMinutes: activity.workloadInMinutes,
                schedules: [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(3),
                        durationInMinutes: 30,
                        room: {
                            id: room.id,
                        },
                        url: 'http://testurl.com',
                    },
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(4),
                        durationInMinutes: 30,
                        url: 'http://testurl.com',
                    },
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(2),
                        durationInMinutes: 30,
                        room: {
                            id: room.id,
                        },
                    },
                ],
                responsibleUsers: [
                    {
                        id: activityResponsibleUser.id,
                    },
                ],
                teachingUsers: [
                    {
                        id: commonUser.id,
                    },
                ],
                activityCategory: {
                    id: activityCategory.id,
                }
            };
        });
        describe('/:eventId/activity', () => {
            test('Deve submeter e cadastrar uma atividade com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                const body = response.body;
                await activityRepository.delete(body.id);
                expect(status).toBe(201);
                expect(body).toEqual({
                    id: expect.any(Number),
                    title: activityData.title,
                    description: activityData.description,
                    vacancy: activityData.vacancy,
                    workloadInMinutes: activityData.workloadInMinutes,
                    readyForCertificateEmission: false,
                    schedules: expect.arrayContaining([
                        expect.objectContaining({
                            startDate: activityData.schedules[0].startDate.toISOString(),
                            durationInMinutes: activityData.schedules[0].durationInMinutes,
                            room: activityData.schedules[0].room,
                            url: activityData.schedules[0].url,
                        }),
                        expect.objectContaining({
                            startDate: activityData.schedules[1].startDate.toISOString(),
                            durationInMinutes: activityData.schedules[1].durationInMinutes,
                            url: activityData.schedules[1].url,
                        }),
                        expect.objectContaining({
                            startDate: activityData.schedules[2].startDate.toISOString(),
                            durationInMinutes: activityData.schedules[2].durationInMinutes,
                            room: activityData.schedules[2].room,
                        }),
                    ]),
                    responsibleUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: activityResponsibleUser.id,
                        }),
                    ]),
                    teachingUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: commonUser.id,
                        }),
                    ]),
                    event: expect.objectContaining({
                        id: event.id,
                    }),
                    activityCategory: expect.objectContaining({
                        id: activityCategory.id,
                    }),
                    indexInCategory: expect.any(Number),
                });
            });
            test('Deve falhar em acessar a rota como admin', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como responsável da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: activityResponsibleUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: commonUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma atividade sem título', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.title;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade com título vazio', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.title = '';
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade com título com mais de 100 caracteres', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.title = 'a'.repeat(101);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade sem descrição', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.description;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade com descrição vazia', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.description = '';
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade com descrição com mais de 1500 caracteres', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.description = 'a'.repeat(1501);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade sem vagas', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.vacancy;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"vacancy"');
            });
            test('Deve falhar em submeter uma atividade com vagas menor que 1', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.vacancy = 0;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"vacancy"');
            });
            test('Deve falhar em submeter uma atividade sem carga horária', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.workloadInMinutes;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"workloadInMinutes"');
            });
            test('Deve falhar em submeter uma atividade com carga horária menor que 1', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.workloadInMinutes = 0;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"workloadInMinutes"');
            });
            test('Deve falhar em submeter uma atividade sem horários', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.schedules;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules"');
            });
            test('Deve falhar em submeter uma atividade com horários vazio', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules"');
            });
            test('Deve falhar em submeter uma atividade sem data de início', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        durationInMinutes: 90,
                        room: {
                            id: room.id,
                        },
                        url: 'http://linktest.com',
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem duração', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(5),
                        room: {
                            id: room.id,
                        },
                        url: 'http://linktest.com',
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem sala e link', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(5),
                        durationInMinutes: 90,
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem URL com mais de 300 caracteres', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(5),
                        durationInMinutes: 90,
                        url: 'https://www.google.com/' + 'a'.repeat(300),
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário em uma sala inexistente', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 90,
                        room: {
                            id: room.id + 53453,
                        },
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma atividade sem responsáveis', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.responsibleUsers;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"responsibleUsers"');
            });
            test('Deve falhar em submeter uma atividade com responsáveis vazio', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.responsibleUsers = [];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"responsibleUsers"');
            });
            test('Deve falhar em submeter uma atividade com responsáveis inexistentes', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.responsibleUsers = [
                    {
                        id: activityResponsibleUser.id + 48324,
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve conseguir submeter uma atividade sem ministrantes', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.teachingUsers;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(201);
                expect(body.id).toBeDefined();
                await activityRepository.delete(body.id);
            });
            test('Deve conseguir submeter uma atividade com ministrantes vazio', async () => {
                const alternateActivityData = (0, cloneObject_1.cloneObject)(activityData);
                alternateActivityData.teachingUsers = [];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(alternateActivityData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(201);
                expect(body.id).toBeDefined();
                await activityRepository.delete(body.id);
            });
            test('Deve falhar em submeter uma atividade com ministrantes inexistentes', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.teachingUsers = [
                    {
                        id: commonUser.id + 65467,
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma atividade com conflito nos seus próprios horários', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 90,
                        room: {
                            id: room.id,
                        },
                    },
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 90,
                        room: {
                            id: room.id,
                        },
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(409);
                expect(body).toEqual({
                    message: expect.any(String),
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            activityName: expect.any(String),
                            eventName: expect.any(String),
                            index: 0,
                        }),
                        expect.objectContaining({
                            activityName: expect.any(String),
                            eventName: expect.any(String),
                            index: 1,
                        })
                    ])
                });
            });
            test('Deve falhar em submeter uma atividade com conflito com outras atividades, se for na mesma sala', async () => {
                let realActivity = (0, createMockActivity_1.createMockActivity)(event, room, [activityResponsibleUser], activityCategory);
                realActivity.schedules = [
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(10), 90, room),
                ];
                realActivity = await activityRepository.save(realActivity);
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 90,
                        room: {
                            id: room.id,
                        },
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                await activityRepository.delete(realActivity.id);
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(409);
                expect(body).toEqual({
                    message: expect.any(String),
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            activityName: realActivity.title,
                            eventName: expect.any(String),
                            index: 0,
                        })
                    ])
                });
            });
            test('Deve conseguir submeter uma atividade com horário igual de outra atividade, se for em sala diferente', async () => {
                let newRoom = new Room_1.Room('lilil38247982374', 30);
                newRoom = await roomRepository.save(newRoom);
                let realActivity = (0, createMockActivity_1.createMockActivity)(event, newRoom, [activityResponsibleUser], activityCategory);
                realActivity.schedules = [
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(10), 90, newRoom),
                ];
                realActivity = await activityRepository.save(realActivity);
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.schedules = [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 90,
                        room: {
                            id: room.id,
                        },
                    },
                ];
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                await activityRepository.delete(realActivity.id);
                await roomRepository.delete(newRoom.id);
                const status = response.statusCode;
                const body = response.body;
                if (body.id)
                    await activityRepository.delete(body.id);
                expect(status).toBe(201);
            });
            test('Deve falhar em submeter uma atividade sem categoria', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                delete wrongActivityData.activityCategory;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation;
                expect(validation.body.message).toContain('"activityCategory"');
            });
            test('Deve falhar em submeter uma atividade com categoria inexistente', async () => {
                const wrongActivityData = (0, cloneObject_1.cloneObject)(activityData);
                wrongActivityData.activityCategory.id = activityCategory.id + 4324;
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseEventUrl}/${event.id}/activity`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(wrongActivityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
        });
        describe('/registry/:activityId/:userId', () => {
            let otherActivity;
            beforeAll(async () => {
                event.statusVisible = true;
                await eventRepository.save(event);
                otherActivity = (0, createMockActivity_1.createMockActivity)(event, room, [
                    activityResponsibleUser,
                ], activityCategory);
                otherActivity.schedules = [
                    new Schedule_1.Schedule(activity.schedules[0].startDate, 30, undefined, 'http://www.lmao.com')
                ];
                otherActivity = await activityRepository.save(otherActivity);
            });
            afterEach(async () => {
                await activityRegistryRepository
                    .createQueryBuilder('a')
                    .delete()
                    .execute();
            });
            afterAll(async () => {
                await activityRepository.delete(otherActivity.id);
            });
            test('Deve se cadastrar na atividade com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(201);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como organizador do evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como responsável da atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em se cadastrar em uma atividade com evento invisível', async () => {
                event.statusVisible = false;
                await eventRepository.save(event);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(404);
                event.statusVisible = true;
                await eventRepository.save(event);
            });
            test('Deve falhar em se cadastrar em uma atividade já cadastrada', async () => {
                let response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                let status = response.statusCode;
                expect(status).toBe(201);
                response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em se cadastrar em uma atividade de um evento fora da data de inscrição', async () => {
                event.registryStartDate = (0, createFutureDate_1.createFutureDate)(-20);
                event.registryEndDate = (0, createFutureDate_1.createFutureDate)(-10);
                await eventRepository.save(event);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                event.registryStartDate = (0, createFutureDate_1.createFutureDate)(-5);
                event.registryEndDate = (0, createFutureDate_1.createFutureDate)(20);
                await eventRepository.save(event);
            });
            test('Deve falhar em se cadastrar na atividade que é responsável por', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${activityResponsibleUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em se cadastrar em uma atividade inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id + 2007}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(404);
            });
            test('Deve falhar em cadastrar se houver conflito de horário com outras atividades', async () => {
                await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/registry/${otherActivity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(409);
                expect(body).toEqual({
                    message: expect.any(String),
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            eventName: expect.any(String),
                            activityName: activity.title,
                            index: 0,
                        })
                    ])
                });
            });
        });
        describe('/presence/schedule/:scheduleId/user/:userId', () => {
            let presence;
            let registry;
            beforeAll(async () => {
                event.statusVisible = true;
                await eventRepository.save(event);
                registry = await activityRegistryService.registry(activity.id, commonUser.id);
                presence = registry.presences[0];
            });
            beforeEach(async () => {
                if (presence) {
                    presence.isPresent = false;
                    await presenceRepository.save(presence);
                }
            });
            afterAll(async () => {
                await activityRegistryRepository.delete(registry.id);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em acessar a rota como organizador do evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve conseguir acessar a rota como responsável daquela atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve falhar em acessar a rota como responsável de outra atividade', async () => {
                let otherActivity = (0, createMockActivity_1.createMockActivity)(event, room, [adminUser], activityCategory);
                otherActivity = await activityRepository.save(otherActivity);
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                await activityRepository.delete(otherActivity.id);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve marcar o usuário como presente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .post(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                const targetPresence = await presenceRepository.findOne(presence.id);
                expect(status).toBe(204);
                expect(targetPresence.isPresent).toBeTruthy();
            });
        });
    });
    describe('PUT', () => {
        let newActivityData;
        beforeAll(async () => {
            newActivityData = {
                title: 'Apresentação sobre arroz',
                description: 'Arroz é mt bom!',
                vacancy: 200,
                workloadInMinutes: 300,
                schedules: [
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(10),
                        durationInMinutes: 70,
                        room: {
                            id: room.id,
                        },
                        url: 'http://testurl.com',
                    },
                    {
                        startDate: (0, createFutureDate_1.createFutureDate)(12),
                        durationInMinutes: 70,
                        room: {
                            id: room.id,
                        },
                    },
                ],
                teachingUsers: [{ id: adminUser.id }],
                responsibleUsers: [
                    { id: activityResponsibleUser.id },
                    { id: commonUser.id },
                ],
                activityCategory: {
                    id: activityCategory.id
                }
            };
        });
        describe('/:activityId', () => {
            test('Deve falhar em acessar a rota como administrador', async () => {
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: adminUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve conseguir acessar a rota como organizador do evento da atividade', async () => {
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(200);
            });
            test('Deve falhar em acessar a rota como organizador de outro evento', async () => {
                let otherEvent = (0, createMockEvent_1.createMockEvent)([commonUser], eventCategory);
                otherEvent.edition = 543;
                otherEvent = await eventRepository.save(otherEvent);
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: commonUserToken,
                })
                    .send(activityData);
                await eventRepository.delete(otherEvent.id);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve conseguir acessar a rota como responsável da atividade', async () => {
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(200);
            });
            test('Deve falhar em acessar a rota sem ser responsável da atividade', async () => {
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: commonUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota se a atividade que organiza não é a mesma', async () => {
                let tempNewActivity = (0, createMockActivity_1.createMockActivity)(event, room, [
                    commonUser,
                ], activityCategory);
                tempNewActivity = await activityRepository.save(tempNewActivity);
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: commonUserToken,
                })
                    .send(activityData);
                await activityRepository.delete(tempNewActivity.id);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const activityData = {
                    title: activity.title,
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .send(activityData);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve alterar os atributos da atividade com sucesso', async () => {
                const activityData = (0, cloneObject_1.cloneObject)(newActivityData);
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                const modifiedActivity = await activityRepository.findOne(activity.id, {
                    relations: [
                        'schedules',
                        'schedules.room',
                        'responsibleUsers',
                        'teachingUsers',
                        'activityCategory',
                    ],
                });
                expect(status).toBe(200);
                expect(modifiedActivity).toEqual({
                    id: activity.id,
                    title: newActivityData.title,
                    description: newActivityData.description,
                    vacancy: newActivityData.vacancy,
                    workloadInMinutes: newActivityData.workloadInMinutes,
                    schedules: expect.arrayContaining([
                        expect.objectContaining({
                            startDate: newActivityData.schedules[0].startDate,
                            durationInMinutes: newActivityData.schedules[0].durationInMinutes,
                            room: expect.objectContaining({
                                id: newActivityData.schedules[0].room.id,
                            }),
                            url: newActivityData.schedules[0].url,
                        }),
                        expect.objectContaining({
                            startDate: newActivityData.schedules[1].startDate,
                            durationInMinutes: newActivityData.schedules[1].durationInMinutes,
                            room: expect.objectContaining({
                                id: newActivityData.schedules[1].room.id,
                            }),
                        }),
                    ]),
                    responsibleUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: newActivityData.responsibleUsers[0].id,
                        }),
                        expect.objectContaining({
                            id: newActivityData.responsibleUsers[1].id,
                        }),
                    ]),
                    teachingUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: newActivityData.teachingUsers[0].id,
                        }),
                    ]),
                    activityCategory: expect.objectContaining({
                        id: newActivityData.activityCategory.id,
                    }),
                    indexInCategory: expect.any(Number),
                });
            });
            test('Deve remover um usuário responsável com sucesso', async () => {
                const activityData = {
                    responsibleUsers: [{ id: activityResponsibleUser.id }],
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                const modifiedActivity = await activityRepository.findOne(activity.id, {
                    relations: ['responsibleUsers'],
                });
                expect(status).toBe(200);
                expect(modifiedActivity.responsibleUsers.length).toBe(1);
                expect(modifiedActivity.responsibleUsers[0].id).toBe(activityResponsibleUser.id);
            });
            test('Deve remover um usuário ministrante com sucesso', async () => {
                const activityData = {
                    teachingUsers: [],
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                const modifiedActivity = await activityRepository.findOne(activity.id, {
                    relations: ['teachingUsers'],
                });
                expect(status).toBe(200);
                expect(modifiedActivity.teachingUsers.length).toBe(0);
            });
            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send();
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Um responsável pela atividade não deve conseguir alterar a lista de responsáveis', async () => {
                const activityData = {
                    responsibleUsers: [
                        { id: activityResponsibleUser.id },
                        { id: commonUser.id },
                    ],
                };
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                })
                    .send(activityData);
                const status = response.statusCode;
                const modifiedActivity = await activityRepository.findOne(activity.id, {
                    relations: ['responsibleUsers'],
                });
                expect(status).toBe(200);
                expect(modifiedActivity.responsibleUsers.length).toBe(1);
                expect(modifiedActivity.responsibleUsers[0].id).toBe(activityResponsibleUser.id);
            });
            test('Deve falhar em submeter uma atividade com título null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    title: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade com título vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    title: '',
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade com título com mais de 100 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    title: 'a'.repeat(101),
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"title"');
            });
            test('Deve falhar em submeter uma atividade com descrição null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    description: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade com descrição vazia', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    description: '',
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade com descrição com mais de 1500 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    description: 'a'.repeat(1501),
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });
            test('Deve falhar em submeter uma atividade com vagas null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    vacancy: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"vacancy"');
            });
            test('Deve falhar em submeter uma atividade com vagas menor que 1', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    vacancy: 0,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"vacancy"');
            });
            test('Deve falhar em submeter uma atividade com carga horária null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    workloadInMinutes: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"workloadInMinutes"');
            });
            test('Deve falhar em submeter uma atividade com carga horária menor que 1', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    workloadInMinutes: 0,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"workloadInMinutes"');
            });
            test('Deve falhar em submeter uma atividade com horários vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules"');
            });
            test('Deve falhar em submeter uma atividade com horário sem data de início', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [
                        {
                            durationInMinutes: 90,
                            room: {
                                id: room.id,
                            },
                            url: 'http://linktest.com',
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem duração', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [
                        {
                            startDate: (0, createFutureDate_1.createFutureDate)(5),
                            room: {
                                id: room.id,
                            },
                            url: 'http://linktest.com',
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem sala e link', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [
                        {
                            startDate: (0, createFutureDate_1.createFutureDate)(5),
                            durationInMinutes: 90,
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário sem URL com mais de 300 caracteres', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [
                        {
                            startDate: (0, createFutureDate_1.createFutureDate)(5),
                            durationInMinutes: 90,
                            url: 'https://www.google.com/' + 'a'.repeat(300),
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"schedules[0]');
            });
            test('Deve falhar em submeter uma atividade com horário em uma sala inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    schedules: [
                        {
                            startDate: (0, createFutureDate_1.createFutureDate)(5),
                            durationInMinutes: 90,
                            room: {
                                id: room.id + 53453,
                            },
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em submeter uma atividade com responsáveis vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    responsibleUsers: [],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"responsibleUsers"');
            });
            test('Deve falhar em submeter uma atividade com responsáveis inexistentes', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    responsibleUsers: [
                        {
                            id: activityResponsibleUser.id + 48324,
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve conseguir submeter uma atividade com ministrantes vazio', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    teachingUsers: [],
                });
                const status = response.statusCode;
                const body = response.body;
                expect(status).toBe(200);
                expect(body.id).toBeDefined();
            });
            test('Deve falhar em submeter uma atividade com ministrantes inexistentes', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    teachingUsers: [
                        {
                            id: commonUser.id + 65467,
                        },
                    ],
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve alterar a atividade como pronta para submissão de certificado', async () => {
                const schedules = activity.schedules.map((schedule, index) => ({ ...schedule, startDate: (0, createFutureDate_1.createFutureDate)(-10 - index) }));
                await activityRepository.save({
                    id: activity.id,
                    schedules,
                });
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    readyForCertificateEmission: true,
                });
                const status = response.statusCode;
                const modifiedActivity = await activityRepository.findOne(activity.id, { select: ['readyForCertificateEmission'] });
                await activityRepository.save({
                    id: activity.id,
                    readyForCertificateEmission: false,
                });
                expect(status).toBe(200);
                expect(modifiedActivity.readyForCertificateEmission).toBeTruthy();
            });
            test('Deve falhar em submeter uma atividade com categoria null', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    activityCategory: null,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                const validation = response.body.validation.body;
                expect(validation.message).toContain('"activityCategory"');
            });
            test('Deve falhar em submeter uma atividade com categoria inexistente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .put(`${baseUrl}/${activity.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                })
                    .send({
                    activityCategory: {
                        id: activityCategory.id + 4324
                    },
                });
                const status = response.statusCode;
                expect(status).toBe(400);
            });
        });
    });
    describe('DELETE', () => {
        describe('/registry/:activityId/:userId', () => {
            beforeAll(async () => {
                event.statusVisible = true;
                await eventRepository.save(event);
            });
            afterAll(async () => {
                event.statusVisible = false;
                await eventRepository.save(event);
            });
            beforeEach(async () => {
                await activityRegistryRepository.save(new ActivityRegistry_1.ActivityRegistry(activity, commonUser));
            });
            afterEach(async () => {
                await activityRegistryRepository
                    .createQueryBuilder('a')
                    .delete()
                    .execute();
            });
            test('Deve remover a sua inscrição na atividade com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve remover a inscrição de um usuário como organizador do evento com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve remover a inscrição de um usuário como responsável da atividade com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em remover a inscrição de uma atividade que não se cadastrou', async () => {
                let response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                let status = response.statusCode;
                expect(status).toBe(204);
                response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                status = response.statusCode;
                expect(status).toBe(404);
            });
            test('Deve falhar em remover a inscrição de uma atividade de um evento invisível', async () => {
                event.statusVisible = false;
                await eventRepository.save(event);
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                event.statusVisible = true;
                await eventRepository.save(event);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em remover a inscrição de uma atividade de um evento que já ocorreu', async () => {
                event.startDate = (0, createFutureDate_1.createFutureDate)(-20);
                event.endDate = (0, createFutureDate_1.createFutureDate)(-10);
                await eventRepository.save(event);
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/registry/${activity.id}/${commonUser.id}`)
                    .set({
                    authorization: commonUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(400);
                event.startDate = (0, createFutureDate_1.createFutureDate)(10);
                event.endDate = (0, createFutureDate_1.createFutureDate)(20);
                await eventRepository.save(event);
            });
        });
        describe('/presence/schedule/:scheduleId/user/:userId', () => {
            let presence;
            let registry;
            beforeAll(async () => {
                event.statusVisible = true;
                await eventRepository.save(event);
                registry = await activityRegistryService.registry(activity.id, commonUser.id);
                presence = registry.presences[0];
            });
            beforeEach(async () => {
                presence.isPresent = true;
                await presenceRepository.save(presence);
            });
            afterAll(async () => {
                await activityRegistryRepository.delete(registry.id);
            });
            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await (0, supertest_1.default)(app).delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`);
                const status = response.statusCode;
                expect(status).toBe(400);
            });
            test('Deve falhar em acessar a rota como organizador do evento', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: eventOrganizerUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve falhar em acessar a rota como administrador', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve conseguir acessar a rota como responsável daquela atividade', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                expect(status).toBe(204);
            });
            test('Deve falhar em acessar a rota como responsável de outra atividade', async () => {
                let otherActivity = (0, createMockActivity_1.createMockActivity)(event, room, [adminUser], activityCategory);
                otherActivity = await activityRepository.save(otherActivity);
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: adminUserToken,
                });
                await activityRepository.delete(otherActivity.id);
                const status = response.statusCode;
                expect(status).toBe(403);
            });
            test('Deve marcar o usuário como não presente', async () => {
                const response = await (0, supertest_1.default)(app)
                    .delete(`${baseUrl}/presence/schedule/${presence.schedule.id}/user/${commonUser.id}`)
                    .set({
                    authorization: activityResponsibleUserToken,
                });
                const status = response.statusCode;
                const targetPresence = await presenceRepository.findOne(presence.id);
                expect(status).toBe(204);
                expect(targetPresence.isPresent).toBeFalsy();
            });
        });
    });
});
//# sourceMappingURL=activity.test.js.map