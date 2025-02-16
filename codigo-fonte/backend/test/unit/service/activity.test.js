"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("@core/container");
const connection_1 = require("@database/connection");
const InvalidSchedule_1 = require("@errors/invalidErrors/InvalidSchedule");
const InvalidVacancyValue_1 = require("@errors/invalidErrors/InvalidVacancyValue");
const InvalidWorkloadMinutesValue_1 = require("@errors/invalidErrors/InvalidWorkloadMinutesValue");
const MultipleAccountsNotConfirmed_1 = require("@errors/services/MultipleAccountsNotConfirmed");
const ActivityDeleteHasHappened_1 = require("@errors/specialErrors/ActivityDeleteHasHappened");
const ActivityDeleteHasRegistry_1 = require("@errors/specialErrors/ActivityDeleteHasRegistry");
const ActivityDeleteIsHappening_1 = require("@errors/specialErrors/ActivityDeleteIsHappening");
const DateConflictError_1 = require("@errors/specialErrors/DateConflictError");
const EventChangeRestriction_1 = require("@errors/specialErrors/EventChangeRestriction");
const NotFoundError_1 = require("@errors/specialErrors/NotFoundError");
const ResponsibleUsersUndefined_1 = require("@errors/undefinedErrors/ResponsibleUsersUndefined");
const SchedulesUndefined_1 = require("@errors/undefinedErrors/SchedulesUndefined");
const Activity_1 = require("@models/Activity");
const ActivityRegistry_1 = require("@models/ActivityRegistry");
const Event_1 = require("@models/Event");
const EventCategory_1 = require("@models/EventCategory");
const Room_1 = require("@models/Room");
const Schedule_1 = require("@models/Schedule");
const User_1 = require("@models/User");
const ActivityCategory_1 = require("@models/ActivityCategory");
const activity_service_1 = require("@services/activity.service");
const activity_registry_service_1 = require("@services/activity_registry.service");
const createFutureDate_1 = require("test/utils/createFutureDate");
const createMockActivity_1 = require("test/utils/createMockActivity");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const createMockUser_1 = require("test/utils/createMockUser");
const typeorm_1 = require("typeorm");
describe('Serviço da atividade', () => {
    let activityRepository;
    let activityRegistryRepository;
    let categoryRepository;
    let eventRepository;
    let userRepository;
    let roomRepository;
    let scheduleRepository;
    let activityCategoryRepository;
    let activityService;
    let activityRegistryService;
    let user;
    let notConfirmedUser;
    let category;
    let event, otherEvent;
    let room;
    let activityCategory;
    beforeAll(async () => {
        activityRepository = connection_1.dataSource.getRepository(Activity_1.Activity);
        activityRegistryRepository = connection_1.dataSource.getRepository(ActivityRegistry_1.ActivityRegistry);
        categoryRepository = connection_1.dataSource.getRepository(EventCategory_1.EventCategory);
        eventRepository = connection_1.dataSource.getRepository(Event_1.Event);
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        roomRepository = connection_1.dataSource.getRepository(Room_1.Room);
        scheduleRepository = connection_1.dataSource.getRepository(Schedule_1.Schedule);
        activityCategoryRepository = connection_1.dataSource.getRepository(ActivityCategory_1.ActivityCategory);
        user = (0, createMockUser_1.createMockUser)('carlos123@testatividade.com', '29731779019', '182254369493', 'carlosatividade123');
        category = (0, createMockEventCategory_1.createMockEventCategory)('Categoria Teste Atividade Controller', 'ctac332');
        event = (0, createMockEvent_1.createMockEvent)([user], category);
        otherEvent = (0, createMockEvent_1.createMockEvent)([user], category);
        room = new Room_1.Room('TEST-ACTIVITY 203', 30);
        activityCategory = new ActivityCategory_1.ActivityCategory('MD', 'meu deus');
        await userRepository.save(user);
        await categoryRepository.save(category);
        await eventRepository.save(event);
        event.statusVisible = true;
        event.statusActive = true;
        await eventRepository.save(event);
        await roomRepository.save(room);
        await eventRepository.save(otherEvent);
        await activityCategoryRepository.save(activityCategory);
        activityService = container_1.container.get(activity_service_1.ActivityService);
        activityRegistryService = container_1.container.get(activity_registry_service_1.ActivityRegistryService);
        notConfirmedUser = (0, createMockUser_1.createMockUser)('usuarionaoconfirmado@gmail.com', '64393160010', '18988005076');
        notConfirmedUser.confirmed = false;
        await userRepository.save(notConfirmedUser);
    });
    afterAll(async () => {
        await roomRepository.delete(room.id);
        await eventRepository.delete(event.id);
        await eventRepository.delete(otherEvent.id);
        await categoryRepository.delete(category.id);
        await activityCategoryRepository.delete(activityCategory.id);
        await userRepository.delete(user.id);
        await userRepository.delete(notConfirmedUser.id);
    });
    describe('Cadastro', () => {
        afterEach(async () => {
            await activityRepository
                .createQueryBuilder('activity')
                .delete()
                .execute();
        });
        test('Deve cadastrar uma atividade com sucesso', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();
            const activityFromDB = await activityRepository.findOne(createdActivity.id);
            expect(activityFromDB).toBeDefined();
        });
        test('Deve falhar em cadastrar uma atividade sem título', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.title;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade com título com mais de 100 caracteres', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.title = 'a'.repeat(101);
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade sem descrição', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.description;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade com descrição com mais de 1500 caracteres', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.description = 'a'.repeat(1501);
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade sem vagas', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.vacancy;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade com vagas negativa', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.vacancy = -1;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidVacancyValue_1.InvalidVacancyValue);
        });
        test('Deve falhar em cadastrar uma atividade com vagas igual a zero', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.vacancy = 0;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidVacancyValue_1.InvalidVacancyValue);
        });
        test('Deve falhar em cadastrar uma atividade sem carga horária', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.workloadInMinutes;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade com carga horária negativa', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.workloadInMinutes = -1;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidWorkloadMinutesValue_1.InvalidWorkloadMinutesValue);
        });
        test('Deve falhar em cadastrar uma atividade com carga horária igual a zero', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.workloadInMinutes = 0;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidWorkloadMinutesValue_1.InvalidWorkloadMinutesValue);
        });
        test('Deve falhar em cadastrar uma atividade sem evento', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.event;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade em um evento inexistente', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.event = (0, createMockEvent_1.createMockEvent)([user], category);
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade sem horários', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.schedules;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(SchedulesUndefined_1.SchedulesUndefined);
        });
        test('Deve falhar em cadastrar uma atividade com horários vazio', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.schedules = [];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(SchedulesUndefined_1.SchedulesUndefined);
        });
        test('Deve falhar em cadastrar uma atividade com pelo menos um horário sem sala e sem link', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.schedules = [new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90)];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidSchedule_1.InvalidSchedule);
        });
        test('Deve falhar em cadastrar uma atividade com pelo menos um horário com URL com mais de 300 caracteres', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90, undefined, 'https://test.com/' + 'a'.repeat(300)),
            ];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar uma atividade com os próprios horários se sobrepondo', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90, undefined, 'https://test.com/'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90, undefined, 'https://test.com/'),
            ];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(DateConflictError_1.DateConflictError);
        });
        test('Deve falhar em cadastrar uma atividade com horários e sala de outra atividade se sobrepondo, mesmo de outro evento', async () => {
            let activity1 = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity1.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90, room, 'https://test.com/'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(6), 90, room, 'https://test.com/'),
            ];
            activity1 = await activityService.create(activity1);
            let activity2 = (0, createMockActivity_1.createMockActivity)(otherEvent, room, [user], activityCategory);
            activity2.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(7), 90, room, 'https://test.com/'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(8), 90, room, 'https://test.com/'),
            ];
            activity2 = await activityService.create(activity2);
            const conflictingActivity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            conflictingActivity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 90, room, undefined),
            ];
            await expect(async () => {
                await activityService.create(conflictingActivity);
            }).rejects.toThrowError(DateConflictError_1.DateConflictError);
        });
        test('Deve falhar em cadastrar uma atividade sem usuários responsáveis', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.responsibleUsers;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(ResponsibleUsersUndefined_1.ResponsibleUsersUndefined);
        });
        test('Deve falhar em cadastrar uma atividade com usuários responsáveis vazio', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.responsibleUsers = [];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(ResponsibleUsersUndefined_1.ResponsibleUsersUndefined);
        });
        test('Deve falhar em cadastrar uma atividade com usuários responsáveis não confirmados', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [notConfirmedUser], activityCategory);
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(MultipleAccountsNotConfirmed_1.MultipleAccountsNotConfirmed);
        });
        test('Deve cadastrar uma atividade com ministrantes vazio', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.teachingUsers = [notConfirmedUser];
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(MultipleAccountsNotConfirmed_1.MultipleAccountsNotConfirmed);
        });
        test('Deve cadastrar uma atividade sem ministrantes', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.teachingUsers;
            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();
        });
        test('Deve cadastrar uma atividade com ministrantes vazio', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.teachingUsers = [];
            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();
        });
        test('Deve falhar em cadastrar uma atividade sem categoria', async () => {
            const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            delete activity.activityCategory;
            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        describe('Geração do índice por evento e categoria', () => {
            const activityCategories = [];
            beforeAll(async () => {
                activityCategories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('AA', '123123')));
                activityCategories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('BB', '123123')));
                activityCategories.push(await activityCategoryRepository.save(new ActivityCategory_1.ActivityCategory('CC', '123123')));
            });
            afterAll(async () => {
                await activityCategoryRepository.delete(activityCategories[0].id);
                await activityCategoryRepository.delete(activityCategories[1].id);
                await activityCategoryRepository.delete(activityCategories[2].id);
            });
            test('A atividade cadastrada deve ter o índice na categoria incremental, POR evento e categoria', async () => {
                const activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategories[0]);
                let createdActivity = await activityService.create(activity);
                expect(createdActivity.indexInCategory).toBe(1);
                const activity2 = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategories[0]);
                activity2.schedules = [
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-5), 45, undefined, 'https://www.google.com'),
                ];
                createdActivity = await activityService.create(activity2);
                expect(createdActivity.indexInCategory).toBe(2);
                const activity3 = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategories[1]);
                activity3.schedules = [
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-5), 45, undefined, 'https://www.google.com'),
                ];
                createdActivity = await activityService.create(activity3);
                expect(createdActivity.indexInCategory).toBe(1);
                const activity4 = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategories[2]);
                activity4.schedules = [
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-5), 45, undefined, 'https://www.google.com'),
                ];
                createdActivity = await activityService.create(activity4);
                expect(createdActivity.indexInCategory).toBe(1);
            });
        });
    });
    describe('Consulta', () => {
        const activities = [];
        let otherUser;
        let otherEvent;
        beforeAll(async () => {
            otherUser = (0, createMockUser_1.createMockUser)('userActTest2342@gmail.com', '15389236025', '44398948877', 'useracttest23323');
            otherUser = await userRepository.save(otherUser);
            event.statusVisible = true;
            await eventRepository.save(event);
            let activity;
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [user, otherUser], activityCategory);
            activity.title = 'Introdução à Python';
            activity.description = 'Descrição sobre Python';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(6), 30, room, undefined),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(7), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [user, otherUser], activityCategory);
            activity.title = 'Falando sobre o SCRUM';
            activity.description = 'Descrição sobre SCRUM';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(8), 30, room, undefined),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(9), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.title =
                'Falando sobre agronegócio: uma forma de se aprender';
            activity.description = 'Descrição sobre Agronegócio';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(10), 30, room, undefined),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(11), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));
            otherEvent = (0, createMockEvent_1.createMockEvent)([user], category);
            otherEvent.startDate = (0, createFutureDate_1.createFutureDate)(-16);
            otherEvent.endDate = (0, createFutureDate_1.createFutureDate)(-10);
            otherEvent = await eventRepository.save(otherEvent);
            activity = (0, createMockActivity_1.createMockActivity)(otherEvent, room, [user], activityCategory);
            activity.title = 'Como será que funciona compiladores?';
            activity.description = 'Descrição sobre Compiladores';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(6), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));
        });
        afterAll(async () => {
            await activityRepository.delete(activities[0].id);
            await activityRepository.delete(activities[1].id);
            await activityRepository.delete(activities[2].id);
            await activityRepository.delete(activities[3].id);
            await eventRepository.delete(otherEvent.id);
            await userRepository.delete(otherUser.id);
        });
        const expectActivyAsCommonUser = (activity) => {
            expect(activity).toEqual({
                id: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                vacancy: expect.any(Number),
                workloadInMinutes: expect.any(Number),
                indexInCategory: expect.any(Number),
                event: expect.any(Event_1.Event),
                schedules: expect.arrayContaining([expect.any(Schedule_1.Schedule)]),
                teachingUsers: expect.arrayContaining([expect.any(User_1.User)]),
                activityCategory: expect.any(ActivityCategory_1.ActivityCategory),
            });
            expect(activity.event).toEqual({
                id: expect.any(Number),
                edition: expect.any(Number),
                startDate: expect.any(Date),
                endDate: expect.any(Date),
                registryStartDate: expect.any(Date),
                registryEndDate: expect.any(Date),
                eventCategory: expect.any(EventCategory_1.EventCategory),
            });
            expect(activity.schedules[0]).toEqual({
                id: expect.any(Number),
                startDate: expect.any(Date),
                durationInMinutes: expect.any(Number),
                room: expect.toBeTypeOrNull(Room_1.Room),
                url: expect.toBeTypeOrNull(String),
            });
            expect(activity.teachingUsers[0]).toEqual({
                id: expect.any(Number),
                name: expect.any(String),
            });
            expect(activity.activityCategory).toEqual({
                id: expect.any(Number),
                code: expect.any(String),
                description: expect.any(String),
            });
        };
        const expectActivyAsAdmin = (activity) => {
            expect(activity).toEqual({
                id: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                vacancy: expect.any(Number),
                workloadInMinutes: expect.any(Number),
                readyForCertificateEmission: expect.any(Boolean),
                indexInCategory: expect.any(Number),
                event: expect.any(Event_1.Event),
                schedules: expect.arrayContaining([expect.any(Schedule_1.Schedule)]),
                teachingUsers: expect.arrayContaining([expect.any(User_1.User)]),
                responsibleUsers: expect.arrayContaining([expect.any(User_1.User)]),
                activityCategory: expect.any(ActivityCategory_1.ActivityCategory),
            });
            expect(activity.event).toEqual({
                id: expect.any(Number),
                edition: expect.any(Number),
                startDate: expect.any(Date),
                endDate: expect.any(Date),
                statusVisible: expect.any(Boolean),
                registryStartDate: expect.any(Date),
                registryEndDate: expect.any(Date),
                eventCategory: expect.any(EventCategory_1.EventCategory),
            });
            expect(activity.teachingUsers[0]).toEqual({
                id: expect.any(Number),
                name: expect.any(String),
                cpf: expect.any(String),
            });
            expect(activity.responsibleUsers[0]).toEqual({
                id: expect.any(Number),
                name: expect.any(String),
                cpf: expect.any(String),
            });
            expect(activity.activityCategory).toEqual({
                id: expect.any(Number),
                code: expect.any(String),
                description: expect.any(String),
            });
        };
        describe('Por ID', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const foundActivity = await activityService.findByIdAsCommonUser(activities[0].id);
                    expectActivyAsCommonUser(foundActivity);
                });
                test('Deve consultar a atividade sobre Python com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsCommonUser(activities[0].id);
                    expect(foundActivity.title).toBe(activities[0].title);
                });
                test('Deve consultar a atividade sobre SCRUM com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsCommonUser(activities[1].id);
                    expect(foundActivity.title).toBe(activities[1].title);
                });
                test('Deve consultar a atividade sobre Agronegócio com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsCommonUser(activities[2].id);
                    expect(foundActivity.title).toBe(activities[2].title);
                });
                test('Deve falhar em consultar a atividade sobre Compiladores, pois não é de um evento visível', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsCommonUser(activities[3].id);
                    }).rejects.toThrowError(NotFoundError_1.NotFoundError);
                });
                test('Deve dar erro ao consultar uma sala inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsCommonUser(-40);
                    }).rejects.toThrowError(NotFoundError_1.NotFoundError);
                });
            });
            describe('Admin, organizador do evento ou responsável pela atividade', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(activities[0].id);
                    expectActivyAsAdmin(foundActivity);
                });
                test('Deve consultar a atividade sobre Python com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(activities[0].id);
                    expect(foundActivity.title).toBe(activities[0].title);
                });
                test('Deve consultar a atividade sobre SCRUM com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(activities[1].id);
                    expect(foundActivity.title).toBe(activities[1].title);
                });
                test('Deve consultar a atividade sobre Agronegócio com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(activities[2].id);
                    expect(foundActivity.title).toBe(activities[2].title);
                });
                test('Deve consultar a atividade sobre Compiladores com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(activities[3].id);
                    expect(foundActivity.title).toBe(activities[3].title);
                });
                test('Deve dar erro ao consultar uma sala inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsAdmin(-40);
                    }).rejects.toThrowError(NotFoundError_1.NotFoundError);
                });
            });
        });
        describe('Por evento', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const findResult = await activityService.findByEventAsCommonUser(event.id);
                    expectActivyAsCommonUser(findResult.items[0]);
                });
                test('Deve consultar as três atividades do evento 1', async () => {
                    const findResult = await activityService.findByEventAsCommonUser(event.id);
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve falhar em consultar as atividades do evento 2, pois não é visível', async () => {
                    otherEvent.startDate = (0, createFutureDate_1.createFutureDate)(14);
                    otherEvent.endDate = (0, createFutureDate_1.createFutureDate)(18);
                    await eventRepository.save(otherEvent);
                    const findResult = await activityService.findByEventAsCommonUser(otherEvent.id);
                    otherEvent.startDate = (0, createFutureDate_1.createFutureDate)(-17);
                    otherEvent.endDate = (0, createFutureDate_1.createFutureDate)(-10);
                    await eventRepository.save(otherEvent);
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar nenhuma atividade de um evento inexistente', async () => {
                    const findResult = await activityService.findByEventAsCommonUser(-40);
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar as duas atividades com título "Falando sobre"', async () => {
                    const findResult = await activityService.findByEventAsCommonUser(event.id, {
                        title: 'Falando sobre',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                });
                test('Deve consultar duas atividades por página com sucesso', async () => {
                    let findResult = await activityService.findByEventAsCommonUser(event.id, {
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByEventAsCommonUser(event.id, {
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByEventAsCommonUser(event.id, {
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
            });
            describe('Admin, organizador do evento ou responsável pela atividade', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const findResult = await activityService.findByEventAsAdmin(event.id);
                    expectActivyAsAdmin(findResult.items[0]);
                });
                test('Deve consultar as três atividades do evento 1', async () => {
                    const findResult = await activityService.findByEventAsAdmin(event.id);
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar a única atividade do evento 2', async () => {
                    const findResult = await activityService.findByEventAsAdmin(otherEvent.id);
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar nenhuma atividade de um evento inexistente', async () => {
                    const findResult = await activityService.findByEventAsAdmin(-40);
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar as duas atividades com título "Falando sobre"', async () => {
                    const findResult = await activityService.findByEventAsAdmin(event.id, {
                        title: 'Falando sobre',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                });
                test('Deve consultar duas atividades por página com sucesso', async () => {
                    let findResult = await activityService.findByEventAsAdmin(event.id, {
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByEventAsAdmin(event.id, {
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByEventAsAdmin(event.id, {
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
            });
        });
        describe('Por usuário responsável', () => {
            describe('Atividades de eventos atuais e futuros', () => {
                test('Deve consultar os atributos corretos das atividades', async () => {
                    const findResult = await activityService.findByResponsibleUser(user.id);
                    expectActivyAsAdmin(findResult.items[0]);
                });
                test('Deve consultar as três atividades do usuário 1', async () => {
                    const findResult = await activityService.findByResponsibleUser(user.id);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar as duas atividades do usuário 2', async () => {
                    const findResult = await activityService.findByResponsibleUser(otherUser.id);
                    expect(findResult.totalCount).toBe(2);
                });
                test('Deve consultar duas atividades por página do usuário 1', async () => {
                    let findResult = await activityService.findByResponsibleUser(user.id, {
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByResponsibleUser(user.id, {
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await activityService.findByResponsibleUser(user.id, {
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar as atividades com "Falando sobre" no título', async () => {
                    let findResult = await activityService.findByResponsibleUser(user.id, {
                        title: 'Falando sobre',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                    findResult = await activityService.findByResponsibleUser(otherUser.id, {
                        title: 'Falando sobre',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByResponsibleUser(otherUser.id + 5432423);
                    }).rejects.toThrowError(NotFoundError_1.NotFoundError);
                });
            });
            describe('Atividades de eventos passados', () => {
                test('Deve consultar os atributos corretos das atividades', async () => {
                    const findResult = await activityService.findOldByResponsibleUser(user.id);
                    expectActivyAsAdmin(findResult.items[0]);
                });
                test('Deve consultar a única atividade do usuário 1', async () => {
                    const findResult = await activityService.findOldByResponsibleUser(user.id);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar nenhuma atividade do usuário 2', async () => {
                    const findResult = await activityService.findOldByResponsibleUser(otherUser.id);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar uma atividade por página do usuário 1', async () => {
                    let findResult = await activityService.findOldByResponsibleUser(user.id, {
                        limit: 1,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                    findResult = await activityService.findOldByResponsibleUser(user.id, {
                        limit: 1,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar as atividades com "compiladores" no título, mas não com "complidor"', async () => {
                    let findResult = await activityService.findOldByResponsibleUser(user.id, {
                        title: 'compiladores',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                    findResult = await activityService.findOldByResponsibleUser(user.id, {
                        title: 'complidor',
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await activityService.findOldByResponsibleUser(otherUser.id + 5432423);
                    }).rejects.toThrowError(NotFoundError_1.NotFoundError);
                });
            });
        });
    });
    describe('Alteração', () => {
        let activity;
        beforeAll(async () => {
            activity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            activity.schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-10), 40, undefined, 'http://test2.com'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-13), 30, undefined, 'http://test3.com'),
            ];
            activity = await activityRepository.save(activity);
        });
        afterAll(async () => {
            await activityRepository.delete(activity.id);
        });
        test('Deve alterar o título da atividade com sucesso', async () => {
            const title = 'Novo título';
            const updatedActivity = await activityService.edit(activity.id, {
                title,
            });
            const selectedActivity = await activityRepository.findOne(activity.id);
            expect(updatedActivity.title).toBe(title);
            expect(selectedActivity.title).toBe(title);
        });
        test('Deve alterar a descrição da atividade com sucesso', async () => {
            const description = 'Nova descrição';
            const updatedActivity = await activityService.edit(activity.id, {
                description,
            });
            const selectedActivity = await activityRepository.findOne(activity.id);
            expect(updatedActivity.description).toBe(description);
            expect(selectedActivity.description).toBe(description);
        });
        test('Deve alterar a vaga da atividade com sucesso', async () => {
            const vacancy = 10;
            const updatedActivity = await activityService.edit(activity.id, {
                vacancy,
            });
            const selectedActivity = await activityRepository.findOne(activity.id);
            expect(updatedActivity.vacancy).toBe(vacancy);
            expect(selectedActivity.vacancy).toBe(vacancy);
        });
        test('Deve alterar a carga horária da atividade com sucesso', async () => {
            const workloadInMinutes = 45;
            const updatedActivity = await activityService.edit(activity.id, {
                workloadInMinutes,
            });
            const selectedActivity = await activityRepository.findOne(activity.id);
            expect(updatedActivity.workloadInMinutes).toBe(workloadInMinutes);
            expect(selectedActivity.workloadInMinutes).toBe(workloadInMinutes);
        });
        test('Deve alterar os horários da atividade com sucesso, esperando-se que horários orfãos tenham sido apagados', async () => {
            const oldSchedules = activity.schedules;
            const schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-20), 40, undefined, 'http://test2.com'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-19), 30, undefined, 'http://test3.com'),
            ];
            const updatedActivity = await activityService.edit(activity.id, {
                schedules,
            });
            const selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['schedules'],
            });
            expect(updatedActivity.schedules.length).toBe(2);
            expect(updatedActivity.schedules[0].id).toBeDefined();
            expect(updatedActivity.schedules[0].url).toBe(schedules[0].url);
            expect(updatedActivity.schedules[1].id).toBeDefined();
            expect(updatedActivity.schedules[1].url).toBe(schedules[1].url);
            expect(selectedActivity.schedules.length).toBe(2);
            expect(selectedActivity.schedules[0].id).toBeDefined();
            expect(selectedActivity.schedules[0].url).toBe(schedules[0].url);
            expect(selectedActivity.schedules[1].id).toBeDefined();
            expect(selectedActivity.schedules[1].url).toBe(schedules[1].url);
            expect(await scheduleRepository.findOne(oldSchedules[0].id)).not.toBeDefined();
        });
        test('Deve ter as matrículas removidas ao realizar qualquer mudança no horário ou duração do horário', async () => {
            let otherUser = (0, createMockUser_1.createMockUser)('usuarioDeMatriculaTeste54352@gmail.com', '21511444371', '14326543763');
            otherUser = await userRepository.save(otherUser);
            const registry = await activityRegistryService.registry(activity.id, otherUser.id);
            let selectedActivity = await activityRepository.findOne(activity.id, { relations: ['schedules'] });
            const oldSchedulesLength = selectedActivity.schedules.length;
            await activityService.edit(activity.id, {
                schedules: [
                    ...selectedActivity.schedules,
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-5), 40, undefined, 'http://test2.com'),
                    new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(-8), 30, undefined, 'http://test3.com'),
                ],
            });
            selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['schedules'],
            });
            const selectedRegistry = await activityRegistryRepository.findOne(registry.id);
            await activityRegistryRepository.delete(registry.id);
            await userRepository.delete(otherUser.id);
            expect(selectedActivity.schedules.length).toBe(oldSchedulesLength + 2);
            expect(selectedRegistry).toBeUndefined();
        });
        test('Não deve ter as matrículas removidas se os horários enviados forem os mesmos', async () => {
            let otherUser = (0, createMockUser_1.createMockUser)('usuarioDeMatriculaTeste54352@gmail.com', '21511444371', '14326543763');
            otherUser = await userRepository.save(otherUser);
            const registry = await activityRegistryService.registry(activity.id, otherUser.id);
            let selectedActivity = await activityRepository.findOne(activity.id, { relations: ['schedules'] });
            const oldSchedulesLength = selectedActivity.schedules.length;
            await activityService.edit(activity.id, {
                schedules: [...selectedActivity.schedules],
            });
            selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['schedules'],
            });
            const selectedRegistry = await activityRegistryRepository.findOne(registry.id);
            await activityRegistryRepository.delete(registry.id);
            await userRepository.delete(otherUser.id);
            expect(selectedActivity.schedules.length).toBe(oldSchedulesLength);
            expect(selectedRegistry).toBeDefined();
        });
        test('Deve alterar os responsáveis da atividade com sucesso', async () => {
            const oldResponsibleUsers = activity.responsibleUsers;
            const responsibleUsers = [
                (0, createMockUser_1.createMockUser)('userAlteracao1@ggg.com', '59452784083', '00987657485'),
                (0, createMockUser_1.createMockUser)('userAlteracao2@ggg.com', '94304105043', '11987657485'),
            ];
            await userRepository.save(responsibleUsers[0]);
            await userRepository.save(responsibleUsers[1]);
            const updatedActivity = await activityService.edit(activity.id, {
                responsibleUsers,
            });
            const selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['responsibleUsers'],
            });
            expect(updatedActivity.responsibleUsers.length).toBe(2);
            expect(updatedActivity.responsibleUsers[0].id).toBeDefined();
            expect(updatedActivity.responsibleUsers[1].id).toBeDefined();
            expect(selectedActivity.responsibleUsers.length).toBe(2);
            expect(selectedActivity.responsibleUsers[0].id).toBeDefined();
            expect(selectedActivity.responsibleUsers[1].id).toBeDefined();
            await activityService.edit(activity.id, {
                responsibleUsers: oldResponsibleUsers,
            });
            await userRepository.delete(responsibleUsers[0].id);
            await userRepository.delete(responsibleUsers[1].id);
        });
        test('Deve alterar os ministrantes da atividade com sucesso', async () => {
            const oldTeachingUsers = activity.teachingUsers;
            const teachingUsers = [
                (0, createMockUser_1.createMockUser)('userAlteracao1@ggg.com', '59452784083', '00987657485'),
                (0, createMockUser_1.createMockUser)('userAlteracao2@ggg.com', '94304105043', '11987657485'),
            ];
            await userRepository.save(teachingUsers[0]);
            await userRepository.save(teachingUsers[1]);
            const updatedActivity = await activityService.edit(activity.id, {
                teachingUsers,
            });
            const selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['teachingUsers'],
            });
            expect(updatedActivity.teachingUsers.length).toBe(2);
            expect(updatedActivity.teachingUsers[0].id).toBeDefined();
            expect(updatedActivity.teachingUsers[1].id).toBeDefined();
            expect(selectedActivity.teachingUsers.length).toBe(2);
            expect(selectedActivity.teachingUsers[0].id).toBeDefined();
            expect(selectedActivity.teachingUsers[1].id).toBeDefined();
            await activityService.edit(activity.id, {
                teachingUsers: oldTeachingUsers,
            });
            await userRepository.delete(teachingUsers[0].id);
            await userRepository.delete(teachingUsers[1].id);
        });
        test('Deve falhar em alterar as vagas para negativo', async () => {
            const vacancy = -10;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    vacancy,
                });
            }).rejects.toThrowError(InvalidVacancyValue_1.InvalidVacancyValue);
        });
        test('Deve falhar em alterar as vagas para zero', async () => {
            const vacancy = 0;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    vacancy,
                });
            }).rejects.toThrowError(InvalidVacancyValue_1.InvalidVacancyValue);
        });
        test('Deve falhar em alterar a carga horária para negativo', async () => {
            const workloadInMinutes = -10;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    workloadInMinutes,
                });
            }).rejects.toThrowError(InvalidWorkloadMinutesValue_1.InvalidWorkloadMinutesValue);
        });
        test('Deve falhar em alterar a carga horária para zero', async () => {
            const workloadInMinutes = 0;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    workloadInMinutes,
                });
            }).rejects.toThrowError(InvalidWorkloadMinutesValue_1.InvalidWorkloadMinutesValue);
        });
        test('Não deve conseguir alterar a prontidão para certificado se já estiver verdadeiro', async () => {
            let updatedActivity = await activityService.edit(activity.id, {
                readyForCertificateEmission: true,
            });
            expect(updatedActivity.readyForCertificateEmission).toBeTruthy();
            updatedActivity = await activityService.edit(activity.id, {
                readyForCertificateEmission: false,
            });
            expect(updatedActivity.readyForCertificateEmission).toBeTruthy();
            updatedActivity.readyForCertificateEmission = false;
            await activityRepository.save(updatedActivity);
        });
        test('Não deve conseguir marcar como pronto para certificado se nem todos os horários passaram da data final', async () => {
            const schedules = [
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(7), 40, undefined, 'http://test2.com'),
                new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(8), 30, undefined, 'http://test3.com'),
            ];
            await activityService.edit(activity.id, {
                schedules,
            });
            await expect(async () => {
                await activityService.edit(activity.id, {
                    readyForCertificateEmission: true,
                });
            }).rejects.toThrowError();
        });
        test('Não deve permitir a alteração do evento em que a atividade pertence', async () => {
            const event = (0, createMockEvent_1.createMockEvent)([user], category);
            await eventRepository.save(event);
            await expect(async () => {
                await activityService.edit(activity.id, {
                    event,
                });
            }).rejects.toThrowError(EventChangeRestriction_1.EventChangeRestriction);
            await eventRepository.delete(event.id);
        });
        test('Deve falhar em remover os horários', async () => {
            await expect(async () => {
                await activityService.edit(activity.id, {
                    schedules: [],
                });
            }).rejects.toThrowError(SchedulesUndefined_1.SchedulesUndefined);
        });
        test('Deve falhar em remover os responsáveis', async () => {
            await expect(async () => {
                await activityService.edit(activity.id, {
                    responsibleUsers: [],
                });
            }).rejects.toThrowError(ResponsibleUsersUndefined_1.ResponsibleUsersUndefined);
        });
        test('Deve conseguir remover os responsáveis', async () => {
            const oldTeachingUsers = activity.teachingUsers;
            const teachingUsers = [];
            const updatedActivity = await activityService.edit(activity.id, {
                teachingUsers,
            });
            const selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['teachingUsers'],
            });
            expect(updatedActivity.teachingUsers.length).toBe(0);
            expect(selectedActivity.teachingUsers.length).toBe(0);
            await activityService.edit(activity.id, {
                teachingUsers: oldTeachingUsers,
            });
        });
        test('Deve alterar a categoria da atividade com sucesso', async () => {
            let newCategory = new ActivityCategory_1.ActivityCategory('JU', 'jujubas hell yea');
            newCategory = await activityCategoryRepository.save(newCategory);
            const updatedActivity = await activityService.edit(activity.id, {
                activityCategory: newCategory,
            });
            const selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['activityCategory'],
            });
            expect(updatedActivity.activityCategory.id).toBe(newCategory.id);
            expect(selectedActivity.activityCategory.id).toBe(newCategory.id);
            await activityService.edit(activity.id, {
                activityCategory: activityCategory,
            });
            await activityCategoryRepository.delete(newCategory.id);
        });
        test('Tentar alterar o índice na categoria da atividade não produz efeito', async () => {
            const indexInCategory = 4324;
            const updatedActivity = await activityService.edit(activity.id, {
                indexInCategory,
            });
            const selectedActivity = await activityRepository.findOne(activity.id);
            expect(updatedActivity.indexInCategory).toBe(activity.indexInCategory);
            expect(selectedActivity.indexInCategory).toBe(activity.indexInCategory);
            expect(selectedActivity.indexInCategory).not.toBe(indexInCategory);
        });
    });
    describe('Exclusão', () => {
        let activityId;
        beforeEach(async () => {
            try {
                const activity = await activityRepository.save((0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory));
                activityId = activity.id;
            }
            catch (err) {
                return;
            }
        });
        afterEach(async () => {
            await activityRepository.delete(activityId);
        });
        test('Deve falhar em excluir uma atividade de um evento o qual já começou', async () => {
            const startedEvent = (0, createMockEvent_1.createMockEvent)([user], category);
            startedEvent.startDate = (0, createFutureDate_1.createFutureDate)(-1);
            await eventRepository.save(startedEvent);
            const startedActivity = await activityRepository.save((0, createMockActivity_1.createMockActivity)(startedEvent, room, [user], activityCategory));
            await expect(async () => {
                await activityService.delete(startedActivity.id);
            }).rejects.toThrowError(ActivityDeleteIsHappening_1.ActivityDeleteIsHappening);
            await activityRepository.delete(startedActivity.id);
            await eventRepository.delete(startedEvent.id);
        });
        test('Deve falhar em excluir uma atividade com registros', async (done) => {
            let otherUser = (0, createMockUser_1.createMockUser)('usuarioDeMatriculaTeste54353@gmail.com', '77596515037', '14326543765');
            otherUser = await userRepository.save(otherUser);
            await activityRegistryService.registry(activityId, otherUser.id);
            await expect(async () => {
                await activityService.delete(activityId);
            }).rejects.toThrowError(ActivityDeleteHasRegistry_1.ActivityDeleteHasRegistry)
                .finally(async () => {
                await activityRegistryService.delete(activityId, otherUser.id);
                await userRepository.delete(otherUser.id);
            });
            done();
        });
        test('Deve excluir a atividade cadastrada com sucesso', async () => {
            await eventRepository.update(event.id, { statusActive: false });
            const deleteCount = await activityService.delete(activityId);
            await eventRepository.update(event.id, { statusActive: true });
            expect(deleteCount).toBe(1);
        });
        test('Deve falhar em excluir uma atividade de um evento já ocorrido', async () => {
            const event = (0, createMockEvent_1.createMockEvent)([user], category);
            event.startDate = (0, createFutureDate_1.createFutureDate)(-5);
            event.endDate = (0, createFutureDate_1.createFutureDate)(-2);
            await eventRepository.save(event);
            const otherActivity = (0, createMockActivity_1.createMockActivity)(event, room, [user], activityCategory);
            await activityRepository.save(otherActivity);
            await expect(async () => {
                await activityService.delete(otherActivity.id);
            }).rejects.toThrowError(ActivityDeleteHasHappened_1.ActivityDeleteHasHappened);
            await eventRepository.delete(event.id);
        });
        test('Deve retornar zero alterações ao excluir uma atividade inexistente', async () => {
            const deleteCount = await activityService.delete(-20);
            expect(deleteCount).toBe(0);
        });
    });
});
//# sourceMappingURL=activity.test.js.map