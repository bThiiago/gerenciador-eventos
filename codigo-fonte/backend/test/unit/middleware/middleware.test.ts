import { Application, NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import supertest from 'supertest';

import { Server } from 'src/server';

import { dataSource } from '@database/connection';

import { User } from '@models/User';
import { Room } from '@models/Room';
import { Activity } from '@models/Activity';
import { ActivityCategory } from '@models/ActivityCategory';
import { EventCategory } from '@models/EventCategory';
import { UserLevel } from '@models/UserLevel';
import { Event } from '@models/Event';

import { createMockUser } from 'test/utils/createMockUser';

import { requireAuthentication } from '@middlewares/requireAuthentication';
import { loadAuthentication } from '@middlewares/loadAuthentication';
import { expectAdmin } from '@middlewares/expectAdmin';
import { expectAdminOrEventOrganizer } from '@middlewares/expectAdminOrEventOrganizer';
import { expectSameUserOrAdmin } from '@middlewares/expectSameUserOrAdmin';
import { expectAdministratorOrganizerResponsibleUser } from '@middlewares/expectAdministratorOrganizerResponsibleUser';

import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockActivity } from 'test/utils/createMockActivity';


describe('Middlewares', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const nextFunction: NextFunction = jest.fn();

    let app: Application;
    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let eventCategoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let activityCategoryRepository: Repository<ActivityCategory>;
    let activityRepository: Repository<Activity>;

    beforeAll(() => {
        app = Server().getApp();
        userRepository = dataSource.getRepository(User);
        roomRepository = dataSource.getRepository(Room);
        eventCategoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        activityRepository = dataSource.getRepository(Activity);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);
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
        let adminUser: User;
        let nonAdminUser: User;

        beforeAll(async () => {
            adminUser = createMockUser(
                'middlewareExpectAdmin1@test.com',
                '71619161605',
                '22320459157'
            );
            adminUser.level = UserLevel.ADMIN;

            nonAdminUser = createMockUser(
                'middlewareExpectAdmin2@test.com',
                '10701512202',
                '55221045915'
            );

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

            expectAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            expectAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });

        test('Não deve prosseguir sem usuário', async () => {
            expectAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });

    describe('expectAdministratorOrganizerResponsibleUser', () => {
        let room: Room;
        let eventCategory: EventCategory;
        let event: Event;
        let activityCategory: ActivityCategory;
        let activity: Activity;

        let adminUser: User;
        let eventOrganizerUser: User;
        let activityResponsibleUser: User;
        let nonAdminUser: User;

        beforeAll(async () => {
            adminUser = createMockUser(
                'middlewareExpectAdmin1@test.com',
                '71619161605',
                '22320459157'
            );
            adminUser.level = UserLevel.ADMIN;

            eventOrganizerUser = createMockUser(
                'middlewareExpectAdmin2@test.com',
                '21632127008',
                '34235436543'
            );

            activityResponsibleUser = createMockUser(
                'middlewareExpectAdmin3@test.com',
                '70775423009',
                '65476765428'
            );

            nonAdminUser = createMockUser(
                'middlewareExpectAdmin4@test.com',
                '10701512202',
                '55221045915'
            );

            room = new Room('Sala 500 BCC COOL', 30);
            eventCategory = createMockEventCategory(
                'CAT BCC 123123',
                'catbcc123'
            );
            event = createMockEvent([eventOrganizerUser], eventCategory);
            activityCategory = new ActivityCategory('LS', 'nananana');
            activity = createMockActivity(event, room, [
                activityResponsibleUser,
            ], activityCategory);

            adminUser = await userRepository.save(adminUser);
            eventOrganizerUser = await userRepository.save(eventOrganizerUser);
            activityResponsibleUser = await userRepository.save(
                activityResponsibleUser
            );
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

            await expectAdministratorOrganizerResponsibleUser(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir com um organizador de evento', async () => {
            mockRequest.user = {
                id: eventOrganizerUser.id,
                level: eventOrganizerUser.level,
            };

            await expectAdministratorOrganizerResponsibleUser(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir com um responsável pela atividade', async () => {
            mockRequest.user = {
                id: activityResponsibleUser.id,
                level: activityResponsibleUser.level,
            };

            await expectAdministratorOrganizerResponsibleUser(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            await expectAdministratorOrganizerResponsibleUser(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });

        test('Não deve prosseguir sem usuário', async () => {
            await expectAdministratorOrganizerResponsibleUser(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });

    describe('expectAdminOrEventOrganizer', () => {
        let eventCategory: EventCategory;
        let event: Event;

        let adminUser: User;
        let eventOrganizerUser: User;
        let nonAdminUser: User;

        beforeAll(async () => {
            adminUser = createMockUser(
                'middlewareExpectAdmin1@test.com',
                '71619161605',
                '22320459157'
            );
            adminUser.level = UserLevel.ADMIN;

            eventOrganizerUser = createMockUser(
                'middlewareExpectAdmin2@test.com',
                '21632127008',
                '34235436543'
            );

            nonAdminUser = createMockUser(
                'middlewareExpectAdmin3@test.com',
                '10701512202',
                '55221045915'
            );

            eventCategory = createMockEventCategory(
                'CAT BCC 123123',
                'catbcc123'
            );
            event = createMockEvent([eventOrganizerUser], eventCategory);

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

            await expectAdminOrEventOrganizer(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir com um organizador de evento', async () => {
            mockRequest.user = {
                id: eventOrganizerUser.id,
                level: eventOrganizerUser.level,
            };

            await expectAdminOrEventOrganizer(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Não deve prosseguir com um usuário comum', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            await expectAdminOrEventOrganizer(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });

        test('Não deve prosseguir sem usuário', async () => {
            await expectAdminOrEventOrganizer(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });

    describe('expectSameUserOrAdmin', () => {
        let adminUser: User;
        let nonAdminUser: User;

        beforeAll(async () => {
            adminUser = createMockUser(
                'middlewareExpectAdmin1@test.com',
                '71619161605',
                '22320459157'
            );
            adminUser.level = UserLevel.ADMIN;

            nonAdminUser = createMockUser(
                'middlewareExpectAdmin2@test.com',
                '10701512202',
                '55221045915'
            );

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

            expectSameUserOrAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir como usuário comum se for o mesmo (utilizam param id)', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            mockRequest.params = {
                id : nonAdminUser.id.toString()
            };

            expectSameUserOrAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir como usuário comum se for o mesmo (utilizam param userId)', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            mockRequest.params = {
                userId : nonAdminUser.id.toString()
            };

            expectSameUserOrAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
        });

        test('Deve prosseguir como usuário comum se for diferente', async () => {
            mockRequest.user = {
                id: nonAdminUser.id,
                level: nonAdminUser.level,
            };

            mockRequest.params = {
                userId : (nonAdminUser.id + 1).toString()
            };

            expectSameUserOrAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(403);
        });

        test('Não deve prosseguir sem usuário', async () => {
            expectSameUserOrAdmin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.status).toBeCalledWith(401);
        });
    });

    describe('loadAuthentication', () => {
        let user: User;
        let token: string;

        beforeAll(async () => {
            const password = '123123123';
            user = createMockUser(
                'middlewareAuth@test.com',
                '75384366184',
                '4832045915'
            );
            user.password = password;
            await userRepository.save(user);
            const res = await supertest(app)
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

            loadAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).toBeDefined();
        });

        test('Deve continuar sem headers fornecido', async () => {
            mockRequest = {};

            loadAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });

        test('Deve continuar sem authentication fornecido', async () => {
            mockRequest = {
                headers: {},
            };

            loadAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });

        test('Deve continuar sem token válido', async () => {
            mockRequest = {
                headers: {
                    authorization: 'Bearer jfsdfn',
                },
            };

            loadAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).not.toBeDefined();
        });
    });

    describe('requireAuthentication', () => {
        let user: User;
        let token: string;

        beforeAll(async () => {
            const password = '123123123';
            user = createMockUser(
                'middlewareAuth@test.com',
                '75384366184',
                '4832045915'
            );
            user.password = password;
            await userRepository.save(user);
            const res = await supertest(app)
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

            requireAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toBeCalledTimes(1);
            expect(mockRequest.user).toBeDefined();
        });

        test('Deve falhar ao passar nenhum header', async () => {
            mockRequest = {};

            requireAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(400);
        });

        test('Deve falhar ao não passar o authorization no header', async () => {
            mockRequest = {
                headers: {},
            };

            requireAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(400);
        });

        test('Deve falhar ao passar uma authorization inválida', async () => {
            mockRequest = {
                headers: {
                    authorization: 'Bearer jfsdfn',
                },
            };

            requireAuthentication(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toBeCalled();
            expect(mockResponse.statusCode).toBe(401);
        });
    });
});