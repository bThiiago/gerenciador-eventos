"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("src/server");
const connection_1 = require("@database/connection");
const User_1 = require("@models/User");
const Room_1 = require("@models/Room");
const Activity_1 = require("@models/Activity");
const ActivityCategory_1 = require("@models/ActivityCategory");
const EventCategory_1 = require("@models/EventCategory");
const UserLevel_1 = require("@models/UserLevel");
const Event_1 = require("@models/Event");
const createMockUser_1 = require("test/utils/createMockUser");
const requireAuthentication_1 = require("@middlewares/requireAuthentication");
const loadAuthentication_1 = require("@middlewares/loadAuthentication");
const expectAdmin_1 = require("@middlewares/expectAdmin");
const expectAdminOrEventOrganizer_1 = require("@middlewares/expectAdminOrEventOrganizer");
const expectSameUserOrAdmin_1 = require("@middlewares/expectSameUserOrAdmin");
const expectAdministratorOrganizerResponsibleUser_1 = require("@middlewares/expectAdministratorOrganizerResponsibleUser");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockActivity_1 = require("test/utils/createMockActivity");
describe('Middlewares', () => {
    let mockRequest;
    let mockResponse;
    const nextFunction = jest.fn();
    let app;
    let userRepository;
    let roomRepository;
    let eventCategoryRepository;
    let eventRepository;
    let activityCategoryRepository;
    let activityRepository;
    beforeAll(() => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        eventCategoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
    });
    beforeEach(() => {
        const mockStatusFunction = jest.fn();
        const mockJsonFunction = jest.fn();
        mockStatusFunction.mockImplementation((statusCode) => mockResponse);
        mockJsonFunction.mockImplementation(() => mockResponse);
        mockRequest = {};
        mockResponse = {
            json: mockStatusFunction,
            status: mockJsonFunction,
        };
    });
    describe('expectAdmin', () => {
        let adminUser;
        let nonAdminUser;
        beforeAll(async () => {
            adminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin1@test.com', '71619161605', '22320459157');
            adminUser.level = UserLevel_1.UserLevel.ADMIN;
            nonAdminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin2@test.com', '10701512202', '55221045915');
            adminUser = await userRepository.save(adminUser);
            nonAdminUser = await userRepository.save(nonAdminUser);
        });
        afterAll(async () => {
            await userRepository.delete(adminUser.id);
            await userRepository.delete(nonAdminUser.id);
        });
        test('Deve prosseguir com um usuário admin', async () => {
            mockRequest.user = {
                id: adminUser.id,
                level: adminUser.level,
            };
            (0, expectAdmin_1.expectAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            (0, expectAdmin_1.expectAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });
        test('Não deve prosseguir sem usuário', async () => {
            (0, expectAdmin_1.expectAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });
    describe('expectAdministratorOrganizerResponsibleUser', () => {
        let room;
        let eventCategory;
        let event;
        let activityCategory;
        let activity;
        let adminUser;
        let eventOrganizerUser;
        let activityResponsibleUser;
        let nonAdminUser;
        beforeAll(async () => {
            adminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin1@test.com', '71619161605', '22320459157');
            adminUser.level = UserLevel_1.UserLevel.ADMIN;
            eventOrganizerUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin2@test.com', '21632127008', '34235436543');
            activityResponsibleUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin3@test.com', '70775423009', '65476765428');
            nonAdminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin4@test.com', '10701512202', '55221045915');
            room = new Room_1.Room('Sala 500 BCC COOL', 30);
            eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('CAT BCC 123123', 'catbcc123');
            event = (0, createMockEvent_1.createMockEvent)([eventOrganizerUser], eventCategory);
            activityCategory = new ActivityCategory_1.ActivityCategory('LS', 'nananana');
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [
                activityResponsibleUser,
            ], activityCategory);
            adminUser = await userRepository.save(adminUser);
            eventOrganizerUser = await userRepository.save(eventOrganizerUser);
            activityResponsibleUser = await userRepository.save(activityResponsibleUser);
            nonAdminUser = await userRepository.save(nonAdminUser);
            room = await roomRepository.save(room);
            eventCategory = await eventCategoryRepository.save(eventCategory);
            event = await eventRepository.save(event);
            activityCategory = await activityCategoryRepository.save(activityCategory);
            activity = await activityRepository.save(activity);
        });
        afterAll(async () => {
            await activityRepository.delete(activity.id);
            await eventRepository.delete(event.id);
            await roomRepository.delete(room.id);
            await activityCategoryRepository.delete(activityCategory.id);
            await eventCategoryRepository.delete(eventCategory.id);
            await userRepository.delete(adminUser.id);
            await userRepository.delete(eventOrganizerUser.id);
            await userRepository.delete(activityResponsibleUser.id);
            await userRepository.delete(nonAdminUser.id);
        });
        test('Deve prosseguir com um usuário admin', async () => {
            mockRequest.user = {
                id: adminUser.id,
                level: adminUser.level,
            };
            await (0, expectAdministratorOrganizerResponsibleUser_1.expectAdministratorOrganizerResponsibleUser)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir com um organizador de evento', async () => {
            mockRequest.user = {
                id: eventOrganizerUser.id,
                level: eventOrganizerUser.level,
            };
            await (0, expectAdministratorOrganizerResponsibleUser_1.expectAdministratorOrganizerResponsibleUser)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir com um responsável pela atividade', async () => {
            mockRequest.user = {
                id: activityResponsibleUser.id,
                level: activityResponsibleUser.level,
            };
            await (0, expectAdministratorOrganizerResponsibleUser_1.expectAdministratorOrganizerResponsibleUser)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            await (0, expectAdministratorOrganizerResponsibleUser_1.expectAdministratorOrganizerResponsibleUser)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });
        test('Não deve prosseguir sem usuário', async () => {
            await (0, expectAdministratorOrganizerResponsibleUser_1.expectAdministratorOrganizerResponsibleUser)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });
    describe('expectAdminOrEventOrganizer', () => {
        let eventCategory;
        let event;
        let adminUser;
        let eventOrganizerUser;
        let nonAdminUser;
        beforeAll(async () => {
            adminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin1@test.com', '71619161605', '22320459157');
            adminUser.level = UserLevel_1.UserLevel.ADMIN;
            eventOrganizerUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin2@test.com', '21632127008', '34235436543');
            nonAdminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin3@test.com', '10701512202', '55221045915');
            eventCategory = (0, createMockEventCategory_1.createMockEventCategory)('CAT BCC 123123', 'catbcc123');
            event = (0, createMockEvent_1.createMockEvent)([eventOrganizerUser], eventCategory);
            adminUser = await userRepository.save(adminUser);
            eventOrganizerUser = await userRepository.save(eventOrganizerUser);
            nonAdminUser = await userRepository.save(nonAdminUser);
            eventCategory = await eventCategoryRepository.save(eventCategory);
            event = await eventRepository.save(event);
        });
        afterAll(async () => {
            await eventRepository.delete(event.id);
            await eventCategoryRepository.delete(eventCategory.id);
            await userRepository.delete(adminUser.id);
            await userRepository.delete(eventOrganizerUser.id);
            await userRepository.delete(nonAdminUser.id);
        });
        test('Deve prosseguir com um usuário admin', async () => {
            mockRequest.user = {
                id: adminUser.id,
                level: adminUser.level,
            };
            await (0, expectAdminOrEventOrganizer_1.expectAdminOrEventOrganizer)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir com um organizador de evento', async () => {
            mockRequest.user = {
                id: eventOrganizerUser.id,
                level: eventOrganizerUser.level,
            };
            await (0, expectAdminOrEventOrganizer_1.expectAdminOrEventOrganizer)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            await (0, expectAdminOrEventOrganizer_1.expectAdminOrEventOrganizer)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });
        test('Não deve prosseguir sem usuário', async () => {
            await (0, expectAdminOrEventOrganizer_1.expectAdminOrEventOrganizer)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });
    describe('expectSameUserOrAdmin', () => {
        let adminUser;
        let nonAdminUser;
        beforeAll(async () => {
            adminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin1@test.com', '71619161605', '22320459157');
            adminUser.level = UserLevel_1.UserLevel.ADMIN;
            nonAdminUser = (0, createMockUser_1.createMockUser)('middlewareExpectAdmin2@test.com', '10701512202', '55221045915');
            adminUser = await userRepository.save(adminUser);
            nonAdminUser = await userRepository.save(nonAdminUser);
        });
        afterAll(async () => {
            await userRepository.delete(adminUser.id);
            await userRepository.delete(nonAdminUser.id);
        });
        test('Deve prosseguir com um usuário admin', async () => {
            mockRequest.user = {
                id: adminUser.id,
                level: adminUser.level,
            };
            (0, expectSameUserOrAdmin_1.expectSameUserOrAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir como usuário comum se for o mesmo (utilizam param id)', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            mockRequest.params = {
                id: nonAdminUser.id.toString()
            };
            (0, expectSameUserOrAdmin_1.expectSameUserOrAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir como usuário comum se for o mesmo (utilizam param userId)', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            mockRequest.params = {
                userId: nonAdminUser.id.toString()
            };
            (0, expectSameUserOrAdmin_1.expectSameUserOrAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
        });
        test('Deve prosseguir como usuário comum se for diferente', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };
            mockRequest.params = {
                userId: (nonAdminUser.id + 1).toString()
            };
            (0, expectSameUserOrAdmin_1.expectSameUserOrAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });
        test('Não deve prosseguir sem usuário', async () => {
            (0, expectSameUserOrAdmin_1.expectSameUserOrAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });
    describe('loadAuthentication', () => {
        let user;
        let token;
        beforeAll(async () => {
            const password = '123123123';
            user = (0, createMockUser_1.createMockUser)('middlewareAuth@test.com', '75384366184', '4832045915');
            user.password = password;
            await userRepository.save(user);
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/sessions')
                .send({ email: user.email, password });
            token = res.body.token;
        });
        afterAll(async () => {
            await userRepository.delete(user.id);
        });
        test('Deve ser reconhecido como um usuário autenticado', async () => {
            mockRequest = {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            };
            (0, loadAuthentication_1.loadAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).toBeDefined();
        });
        test('Deve continuar sem headers fornecido', async () => {
            mockRequest = {};
            (0, loadAuthentication_1.loadAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });
        test('Deve continuar sem authentication fornecido', async () => {
            mockRequest = {
                headers: {},
            };
            (0, loadAuthentication_1.loadAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });
        test('Deve continuar sem token válido', async () => {
            mockRequest = {
                headers: {
                    authorization: 'Bearer jfsdfn',
                },
            };
            (0, loadAuthentication_1.loadAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });
    });
    describe('requireAuthentication', () => {
        let user;
        let token;
        beforeAll(async () => {
            const password = '123123123';
            user = (0, createMockUser_1.createMockUser)('middlewareAuth@test.com', '75384366184', '4832045915');
            user.password = password;
            await userRepository.save(user);
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/sessions')
                .send({ email: user.email, password });
            token = res.body.token;
        });
        afterAll(async () => {
            await userRepository.delete(user.id);
        });
        test('Deve ser reconhecido como um usuário autenticado', async () => {
            mockRequest = {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            };
            (0, requireAuthentication_1.requireAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).toBeDefined();
        });
        test('Deve falhar ao passar nenhum header', async () => {
            mockRequest = {};
            (0, requireAuthentication_1.requireAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(400);
        });
        test('Deve falhar ao não passar o authorization no header', async () => {
            mockRequest = {
                headers: {},
            };
            (0, requireAuthentication_1.requireAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(400);
        });
        test('Deve falhar ao passar uma authorization inválida', async () => {
            mockRequest = {
                headers: {
                    authorization: 'Bearer jfsdfn',
                },
            };
            (0, requireAuthentication_1.requireAuthentication)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(401);
        });
    });
});
//# sourceMappingURL=middleware.test.js.map