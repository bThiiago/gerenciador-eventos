import { container } from '@core/container';
import { dataSource } from '@database/connection';
import { InvalidSchedule } from '@errors/invalidErrors/InvalidSchedule';
import { InvalidVacancyValue } from '@errors/invalidErrors/InvalidVacancyValue';
import { InvalidWorkloadMinutesValue } from '@errors/invalidErrors/InvalidWorkloadMinutesValue';
import { MultipleAccountsNotConfirmed } from '@errors/services/MultipleAccountsNotConfirmed';
import { ActivityDeleteHasHappened } from '@errors/specialErrors/ActivityDeleteHasHappened';
import { ActivityDeleteHasRegistry } from '@errors/specialErrors/ActivityDeleteHasRegistry';
import { ActivityDeleteIsHappening } from '@errors/specialErrors/ActivityDeleteIsHappening';
import { DateConflictError } from '@errors/specialErrors/DateConflictError';
import { EventChangeRestriction } from '@errors/specialErrors/EventChangeRestriction';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { ResponsibleUsersUndefined } from '@errors/undefinedErrors/ResponsibleUsersUndefined';
import { SchedulesUndefined } from '@errors/undefinedErrors/SchedulesUndefined';
import { Activity } from '@models/Activity';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { Event } from '@models/Event';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { Schedule } from '@models/Schedule';
import { User } from '@models/User';
import { ActivityCategory } from '@models/ActivityCategory';

import { ActivityService } from '@services/activity.service';
import { ActivityRegistryService } from '@services/activity_registry.service';
import { createFutureDate } from 'test/utils/createFutureDate';
import { createMockActivity } from 'test/utils/createMockActivity';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockUser } from 'test/utils/createMockUser';
import { QueryFailedError, Repository } from 'typeorm';

describe('Serviço da atividade', () => {
    let activityRepository: Repository<Activity>;
    let activityRegistryRepository: Repository<ActivityRegistry>;
    let categoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let scheduleRepository: Repository<Schedule>;
    let activityCategoryRepository: Repository<ActivityCategory>;

    let activityService: ActivityService;
    let activityRegistryService: ActivityRegistryService;

    let user: User;
    let notConfirmedUser: User;
    let category: EventCategory;
    let event: Event, otherEvent: Event;
    let room: Room;
    let activityCategory: ActivityCategory;

    beforeAll(async () => {
        activityRepository = dataSource.getRepository(Activity);
        activityRegistryRepository = dataSource.getRepository(ActivityRegistry);
        categoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        userRepository = dataSource.getRepository(User);
        roomRepository = dataSource.getRepository(Room);
        scheduleRepository = dataSource.getRepository(Schedule);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        user = createMockUser(
            'carlos123@testatividade.com',
            '29731779019',
            '182254369493',
            'carlosatividade123'
        );
        category = createMockEventCategory(
            'Categoria Teste Atividade Controller',
            'ctac332'
        );
        event = createMockEvent([user], category);
        otherEvent = createMockEvent([user], category);
        room = new Room('TEST-ACTIVITY 203', 30);
        activityCategory = new ActivityCategory('MD', 'meu deus');

        await userRepository.save(user);
        await categoryRepository.save(category);
        await eventRepository.save(event);
        event.statusVisible = true;
        event.statusActive = true;
        await eventRepository.save(event);
        await roomRepository.save(room);
        await eventRepository.save(otherEvent);
        await activityCategoryRepository.save(activityCategory);

        activityService = container.get(ActivityService);
        activityRegistryService = container.get(ActivityRegistryService);

        notConfirmedUser = createMockUser(
            'usuarionaoconfirmado@gmail.com',
            '64393160010',
            '18988005076'
        );
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
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();

            const activityFromDB = await activityRepository.findOne(
                createdActivity.id
            );
            expect(activityFromDB).toBeDefined();
        });

        test('Deve falhar em cadastrar uma atividade sem título', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.title;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade com título com mais de 100 caracteres', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.title = 'a'.repeat(101);

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade sem descrição', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.description;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade com descrição com mais de 1500 caracteres', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.description = 'a'.repeat(1501);

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade sem vagas', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.vacancy;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade com vagas negativa', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.vacancy = -1;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidVacancyValue);
        });

        test('Deve falhar em cadastrar uma atividade com vagas igual a zero', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.vacancy = 0;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidVacancyValue);
        });

        test('Deve falhar em cadastrar uma atividade sem carga horária', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.workloadInMinutes;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade com carga horária negativa', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.workloadInMinutes = -1;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidWorkloadMinutesValue);
        });

        test('Deve falhar em cadastrar uma atividade com carga horária igual a zero', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.workloadInMinutes = 0;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidWorkloadMinutesValue);
        });

        test('Deve falhar em cadastrar uma atividade sem evento', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.event;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade em um evento inexistente', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.event = createMockEvent([user], category);

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade sem horários', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.schedules;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(SchedulesUndefined);
        });

        test('Deve falhar em cadastrar uma atividade com horários vazio', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.schedules = [];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(SchedulesUndefined);
        });

        test('Deve falhar em cadastrar uma atividade com pelo menos um horário sem sala e sem link', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.schedules = [new Schedule(createFutureDate(5), 90)];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(InvalidSchedule);
        });

        test('Deve falhar em cadastrar uma atividade com pelo menos um horário com URL com mais de 300 caracteres', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.schedules = [
                new Schedule(
                    createFutureDate(5),
                    90,
                    undefined,
                    'https://test.com/' + 'a'.repeat(300)
                ),
            ];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar uma atividade com os próprios horários se sobrepondo', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.schedules = [
                new Schedule(
                    createFutureDate(5),
                    90,
                    undefined,
                    'https://test.com/'
                ),
                new Schedule(
                    createFutureDate(5),
                    90,
                    undefined,
                    'https://test.com/'
                ),
            ];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(DateConflictError);
        });

        test('Deve falhar em cadastrar uma atividade com horários e sala de outra atividade se sobrepondo, mesmo de outro evento', async () => {
            let activity1 = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity1.schedules = [
                new Schedule(
                    createFutureDate(5),
                    90,
                    room,
                    'https://test.com/'
                ),
                new Schedule(
                    createFutureDate(6),
                    90,
                    room,
                    'https://test.com/'
                ),
            ];
            activity1 = await activityService.create(activity1);

            let activity2 = createMockActivity(
                otherEvent,
                room,
                [user],
                activityCategory
            );
            activity2.schedules = [
                new Schedule(
                    createFutureDate(7),
                    90,
                    room,
                    'https://test.com/'
                ),
                new Schedule(
                    createFutureDate(8),
                    90,
                    room,
                    'https://test.com/'
                ),
            ];
            activity2 = await activityService.create(activity2);

            const conflictingActivity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            conflictingActivity.schedules = [
                new Schedule(createFutureDate(5), 90, room, undefined),
            ];
            await expect(async () => {
                await activityService.create(conflictingActivity);
            }).rejects.toThrowError(DateConflictError);
        });

        test('Deve falhar em cadastrar uma atividade sem usuários responsáveis', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.responsibleUsers;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(ResponsibleUsersUndefined);
        });

        test('Deve falhar em cadastrar uma atividade com usuários responsáveis vazio', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.responsibleUsers = [];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(ResponsibleUsersUndefined);
        });

        test('Deve falhar em cadastrar uma atividade com usuários responsáveis não confirmados', async () => {
            const activity = createMockActivity(
                event,
                room,
                [notConfirmedUser],
                activityCategory
            );

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(MultipleAccountsNotConfirmed);
        });

        test('Deve cadastrar uma atividade com ministrantes vazio', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.teachingUsers = [notConfirmedUser];

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(MultipleAccountsNotConfirmed);
        });

        test('Deve cadastrar uma atividade sem ministrantes', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.teachingUsers;

            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();
        });

        test('Deve cadastrar uma atividade com ministrantes vazio', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.teachingUsers = [];

            const createdActivity = await activityService.create(activity);
            expect(createdActivity.id).toBeDefined();
        });

        test('Deve falhar em cadastrar uma atividade sem categoria', async () => {
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            delete activity.activityCategory;

            await expect(async () => {
                await activityService.create(activity);
            }).rejects.toThrowError(QueryFailedError);
        });

        describe('Geração do índice por evento e categoria', () => {
            const activityCategories: ActivityCategory[] = [];

            beforeAll(async () => {
                activityCategories.push(
                    await activityCategoryRepository.save(
                        new ActivityCategory('AA', '123123')
                    )
                );
                activityCategories.push(
                    await activityCategoryRepository.save(
                        new ActivityCategory('BB', '123123')
                    )
                );
                activityCategories.push(
                    await activityCategoryRepository.save(
                        new ActivityCategory('CC', '123123')
                    )
                );
            });

            afterAll(async () => {
                await activityCategoryRepository.delete(
                    activityCategories[0].id
                );
                await activityCategoryRepository.delete(
                    activityCategories[1].id
                );
                await activityCategoryRepository.delete(
                    activityCategories[2].id
                );
            });

            test('A atividade cadastrada deve ter o índice na categoria incremental, POR evento e categoria', async () => {
                const activity = createMockActivity(
                    event,
                    room,
                    [user],
                    activityCategories[0]
                );
                let createdActivity = await activityService.create(activity);
                expect(createdActivity.indexInCategory).toBe(1);

                const activity2 = createMockActivity(
                    event,
                    room,
                    [user],
                    activityCategories[0]
                );
                activity2.schedules = [
                    new Schedule(
                        createFutureDate(-5),
                        45,
                        undefined,
                        'https://www.google.com'
                    ),
                ];
                createdActivity = await activityService.create(activity2);
                expect(createdActivity.indexInCategory).toBe(2);

                const activity3 = createMockActivity(
                    event,
                    room,
                    [user],
                    activityCategories[1]
                );
                activity3.schedules = [
                    new Schedule(
                        createFutureDate(-5),
                        45,
                        undefined,
                        'https://www.google.com'
                    ),
                ];
                createdActivity = await activityService.create(activity3);
                expect(createdActivity.indexInCategory).toBe(1);

                const activity4 = createMockActivity(
                    event,
                    room,
                    [user],
                    activityCategories[2]
                );
                activity4.schedules = [
                    new Schedule(
                        createFutureDate(-5),
                        45,
                        undefined,
                        'https://www.google.com'
                    ),
                ];
                createdActivity = await activityService.create(activity4);
                expect(createdActivity.indexInCategory).toBe(1);
            });
        });
    });

    describe('Consulta', () => {
        const activities: Activity[] = [];

        let otherUser: User;
        let otherEvent: Event;

        beforeAll(async () => {
            otherUser = createMockUser(
                'userActTest2342@gmail.com',
                '15389236025',
                '44398948877',
                'useracttest23323'
            );
            otherUser = await userRepository.save(otherUser);

            event.statusVisible = true;
            await eventRepository.save(event);

            let activity: Activity;
            activity = createMockActivity(
                event,
                room,
                [user, otherUser],
                activityCategory
            );
            activity.title = 'Introdução à Python';
            activity.description = 'Descrição sobre Python';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule(createFutureDate(6), 30, room, undefined),
                new Schedule(createFutureDate(7), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));

            activity = createMockActivity(
                event,
                room,
                [user, otherUser],
                activityCategory
            );
            activity.title = 'Falando sobre o SCRUM';
            activity.description = 'Descrição sobre SCRUM';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule(createFutureDate(8), 30, room, undefined),
                new Schedule(createFutureDate(9), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));

            activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.title =
                'Falando sobre agronegócio: uma forma de se aprender';
            activity.description = 'Descrição sobre Agronegócio';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule(createFutureDate(10), 30, room, undefined),
                new Schedule(createFutureDate(11), 30, room, undefined),
            ];
            activities.push(await activityRepository.save(activity));

            otherEvent = createMockEvent([user], category);
            otherEvent.startDate = createFutureDate(-16);
            otherEvent.endDate = createFutureDate(-10);
            otherEvent = await eventRepository.save(otherEvent);

            activity = createMockActivity(
                otherEvent,
                room,
                [user],
                activityCategory
            );
            activity.title = 'Como será que funciona compiladores?';
            activity.description = 'Descrição sobre Compiladores';
            activity.teachingUsers = [user];
            activity.schedules = [
                new Schedule(createFutureDate(6), 30, room, undefined),
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

        const expectActivyAsCommonUser = (activity: Activity) => {
            expect(activity).toEqual({
                id: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                vacancy: expect.any(Number),
                workloadInMinutes: expect.any(Number),
                indexInCategory: expect.any(Number),

                event: expect.any(Event),

                schedules: expect.arrayContaining([expect.any(Schedule)]),

                teachingUsers: expect.arrayContaining([expect.any(User)]),

                activityCategory: expect.any(ActivityCategory),
            });

            expect(activity.event).toEqual({
                id: expect.any(Number),
                edition: expect.any(Number),
                startDate: expect.any(Date),
                endDate: expect.any(Date),
                registryStartDate: expect.any(Date),
                registryEndDate: expect.any(Date),
                eventCategory : expect.any(EventCategory),
            });

            expect(activity.schedules[0]).toEqual({
                id: expect.any(Number),
                startDate: expect.any(Date),
                durationInMinutes: expect.any(Number),
                room: expect.toBeTypeOrNull(Room),
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

        const expectActivyAsAdmin = (activity: Activity) => {
            expect(activity).toEqual({
                id: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                vacancy: expect.any(Number),
                workloadInMinutes: expect.any(Number),
                readyForCertificateEmission: expect.any(Boolean),
                indexInCategory: expect.any(Number),

                event: expect.any(Event),

                schedules: expect.arrayContaining([expect.any(Schedule)]),

                teachingUsers: expect.arrayContaining([expect.any(User)]),

                responsibleUsers: expect.arrayContaining([expect.any(User)]),

                activityCategory: expect.any(ActivityCategory),
            });

            expect(activity.event).toEqual({
                id: expect.any(Number),
                edition: expect.any(Number),
                startDate: expect.any(Date),
                endDate: expect.any(Date),
                statusVisible: expect.any(Boolean),
                registryStartDate: expect.any(Date),
                registryEndDate: expect.any(Date),
                eventCategory : expect.any(EventCategory),
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
                    const foundActivity =
                        await activityService.findByIdAsCommonUser(
                            activities[0].id
                        );

                    expectActivyAsCommonUser(foundActivity);
                });

                test('Deve consultar a atividade sobre Python com sucesso', async () => {
                    const foundActivity =
                        await activityService.findByIdAsCommonUser(
                            activities[0].id
                        );
                    expect(foundActivity.title).toBe(activities[0].title);
                });

                test('Deve consultar a atividade sobre SCRUM com sucesso', async () => {
                    const foundActivity =
                        await activityService.findByIdAsCommonUser(
                            activities[1].id
                        );
                    expect(foundActivity.title).toBe(activities[1].title);
                });

                test('Deve consultar a atividade sobre Agronegócio com sucesso', async () => {
                    const foundActivity =
                        await activityService.findByIdAsCommonUser(
                            activities[2].id
                        );
                    expect(foundActivity.title).toBe(activities[2].title);
                });

                test('Deve falhar em consultar a atividade sobre Compiladores, pois não é de um evento visível', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsCommonUser(
                            activities[3].id
                        );
                    }).rejects.toThrowError(NotFoundError);
                });

                test('Deve dar erro ao consultar uma sala inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsCommonUser(-40);
                    }).rejects.toThrowError(NotFoundError);
                });
            });

            describe('Admin, organizador do evento ou responsável pela atividade', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(
                        activities[0].id
                    );

                    expectActivyAsAdmin(foundActivity);
                });

                test('Deve consultar a atividade sobre Python com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(
                        activities[0].id
                    );
                    expect(foundActivity.title).toBe(activities[0].title);
                });

                test('Deve consultar a atividade sobre SCRUM com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(
                        activities[1].id
                    );
                    expect(foundActivity.title).toBe(activities[1].title);
                });

                test('Deve consultar a atividade sobre Agronegócio com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(
                        activities[2].id
                    );
                    expect(foundActivity.title).toBe(activities[2].title);
                });

                test('Deve consultar a atividade sobre Compiladores com sucesso', async () => {
                    const foundActivity = await activityService.findByIdAsAdmin(
                        activities[3].id
                    );
                    expect(foundActivity.title).toBe(activities[3].title);
                });

                test('Deve dar erro ao consultar uma sala inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByIdAsAdmin(-40);
                    }).rejects.toThrowError(NotFoundError);
                });
            });
        });

        describe('Por evento', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const findResult =
                        await activityService.findByEventAsCommonUser(event.id);

                    expectActivyAsCommonUser(findResult.items[0]);
                });

                test('Deve consultar as três atividades do evento 1', async () => {
                    const findResult =
                        await activityService.findByEventAsCommonUser(event.id);
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve falhar em consultar as atividades do evento 2, pois não é visível', async () => {
                    otherEvent.startDate = createFutureDate(14);
                    otherEvent.endDate = createFutureDate(18);
                    await eventRepository.save(otherEvent);
                    const findResult =
                        await activityService.findByEventAsCommonUser(
                            otherEvent.id
                        );
                    
                    otherEvent.startDate = createFutureDate(-17);
                    otherEvent.endDate = createFutureDate(-10);
                    await eventRepository.save(otherEvent);

                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });

                test('Deve consultar nenhuma atividade de um evento inexistente', async () => {
                    const findResult =
                        await activityService.findByEventAsCommonUser(-40);
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });

                test('Deve consultar as duas atividades com título "Falando sobre"', async () => {
                    const findResult =
                        await activityService.findByEventAsCommonUser(
                            event.id,
                            {
                                title: 'Falando sobre',
                            }
                        );
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                });

                test('Deve consultar duas atividades por página com sucesso', async () => {
                    let findResult =
                        await activityService.findByEventAsCommonUser(
                            event.id,
                            {
                                limit: 2,
                                page: 1,
                            }
                        );

                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByEventAsCommonUser(
                        event.id,
                        {
                            limit: 2,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByEventAsCommonUser(
                        event.id,
                        {
                            limit: 2,
                            page: 3,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
            });

            describe('Admin, organizador do evento ou responsável pela atividade', () => {
                test('Deve consultar os atributos corretos de uma atividade', async () => {
                    const findResult = await activityService.findByEventAsAdmin(
                        event.id
                    );

                    expectActivyAsAdmin(findResult.items[0]);
                });

                test('Deve consultar as três atividades do evento 1', async () => {
                    const findResult = await activityService.findByEventAsAdmin(
                        event.id
                    );
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve consultar a única atividade do evento 2', async () => {
                    const findResult = await activityService.findByEventAsAdmin(
                        otherEvent.id
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });

                test('Deve consultar nenhuma atividade de um evento inexistente', async () => {
                    const findResult = await activityService.findByEventAsAdmin(
                        -40
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });

                test('Deve consultar as duas atividades com título "Falando sobre"', async () => {
                    const findResult = await activityService.findByEventAsAdmin(
                        event.id,
                        {
                            title: 'Falando sobre',
                        }
                    );
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                });

                test('Deve consultar duas atividades por página com sucesso', async () => {
                    let findResult = await activityService.findByEventAsAdmin(
                        event.id,
                        {
                            limit: 2,
                            page: 1,
                        }
                    );
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByEventAsAdmin(
                        event.id,
                        {
                            limit: 2,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByEventAsAdmin(
                        event.id,
                        {
                            limit: 2,
                            page: 3,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
            });
        });

        describe('Por usuário responsável', () => {
            describe('Atividades de eventos atuais e futuros', () => {
                test('Deve consultar os atributos corretos das atividades', async () => {
                    const findResult =
                        await activityService.findByResponsibleUser(user.id);

                    expectActivyAsAdmin(findResult.items[0]);
                });

                test('Deve consultar as três atividades do usuário 1', async () => {
                    const findResult =
                        await activityService.findByResponsibleUser(user.id);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve consultar as duas atividades do usuário 2', async () => {
                    const findResult =
                        await activityService.findByResponsibleUser(
                            otherUser.id
                        );
                    expect(findResult.totalCount).toBe(2);
                });

                test('Deve consultar duas atividades por página do usuário 1', async () => {
                    let findResult =
                        await activityService.findByResponsibleUser(user.id, {
                            limit: 2,
                            page: 1,
                        });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByResponsibleUser(
                        user.id,
                        {
                            limit: 2,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await activityService.findByResponsibleUser(
                        user.id,
                        {
                            limit: 2,
                            page: 3,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve consultar as atividades com "Falando sobre" no título', async () => {
                    let findResult =
                        await activityService.findByResponsibleUser(user.id, {
                            title: 'Falando sobre',
                        });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);

                    findResult = await activityService.findByResponsibleUser(
                        otherUser.id,
                        {
                            title: 'Falando sobre',
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });

                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await activityService.findByResponsibleUser(
                            otherUser.id + 5432423
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });

            describe('Atividades de eventos passados', () => {
                test('Deve consultar os atributos corretos das atividades', async () => {
                    const findResult =
                        await activityService.findOldByResponsibleUser(user.id);

                    expectActivyAsAdmin(findResult.items[0]);
                });

                test('Deve consultar a única atividade do usuário 1', async () => {
                    const findResult =
                        await activityService.findOldByResponsibleUser(user.id);
                    expect(findResult.totalCount).toBe(1);
                });

                test('Deve consultar nenhuma atividade do usuário 2', async () => {
                    const findResult =
                        await activityService.findOldByResponsibleUser(
                            otherUser.id
                        );
                    expect(findResult.totalCount).toBe(0);
                });

                test('Deve consultar uma atividade por página do usuário 1', async () => {
                    let findResult =
                        await activityService.findOldByResponsibleUser(
                            user.id,
                            {
                                limit: 1,
                                page: 1,
                            }
                        );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);

                    findResult = await activityService.findOldByResponsibleUser(
                        user.id,
                        {
                            limit: 1,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(1);
                });

                test('Deve consultar as atividades com "compiladores" no título, mas não com "complidor"', async () => {
                    let findResult =
                        await activityService.findOldByResponsibleUser(
                            user.id,
                            {
                                title: 'compiladores',
                            }
                        );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);

                    findResult = await activityService.findOldByResponsibleUser(
                        user.id,
                        {
                            title: 'complidor',
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });

                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await activityService.findOldByResponsibleUser(
                            otherUser.id + 5432423
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });
        });
    });

    describe('Alteração', () => {
        let activity: Activity;

        beforeAll(async () => {
            activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            activity.schedules = [
                new Schedule(
                    createFutureDate(-10),
                    40,
                    undefined,
                    'http://test2.com'
                ),
                new Schedule(
                    createFutureDate(-13),
                    30,
                    undefined,
                    'http://test3.com'
                ),
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
            const selectedActivity = await activityRepository.findOne(
                activity.id
            );

            expect(updatedActivity.title).toBe(title);
            expect(selectedActivity.title).toBe(title);
        });

        test('Deve alterar a descrição da atividade com sucesso', async () => {
            const description = 'Nova descrição';
            const updatedActivity = await activityService.edit(activity.id, {
                description,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id
            );

            expect(updatedActivity.description).toBe(description);
            expect(selectedActivity.description).toBe(description);
        });

        test('Deve alterar a vaga da atividade com sucesso', async () => {
            const vacancy = 10;
            const updatedActivity = await activityService.edit(activity.id, {
                vacancy,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id
            );

            expect(updatedActivity.vacancy).toBe(vacancy);
            expect(selectedActivity.vacancy).toBe(vacancy);
        });

        test('Deve alterar a carga horária da atividade com sucesso', async () => {
            const workloadInMinutes = 45;
            const updatedActivity = await activityService.edit(activity.id, {
                workloadInMinutes,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id
            );

            expect(updatedActivity.workloadInMinutes).toBe(workloadInMinutes);
            expect(selectedActivity.workloadInMinutes).toBe(workloadInMinutes);
        });

        test('Deve alterar os horários da atividade com sucesso, esperando-se que horários orfãos tenham sido apagados', async () => {
            const oldSchedules = activity.schedules;
            const schedules = [
                new Schedule(
                    createFutureDate(-20),
                    40,
                    undefined,
                    'http://test2.com'
                ),
                new Schedule(
                    createFutureDate(-19),
                    30,
                    undefined,
                    'http://test3.com'
                ),
            ];
            const updatedActivity = await activityService.edit(activity.id, {
                schedules,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id,
                {
                    relations: ['schedules'],
                }
            );

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

            expect(
                await scheduleRepository.findOne(oldSchedules[0].id)
            ).not.toBeDefined();
        });

        test('Deve ter as matrículas removidas ao realizar qualquer mudança no horário ou duração do horário', async () => {
            let otherUser = createMockUser(
                'usuarioDeMatriculaTeste54352@gmail.com',
                '21511444371',
                '14326543763'
            );
            otherUser = await userRepository.save(otherUser);
            const registry = await activityRegistryService.registry(
                activity.id,
                otherUser.id
            );

            let selectedActivity = await activityRepository.findOne(
                activity.id,
                { relations: ['schedules'] }
            );
            const oldSchedulesLength = selectedActivity.schedules.length;

            await activityService.edit(activity.id, {
                schedules: [
                    ...selectedActivity.schedules,
                    new Schedule(
                        createFutureDate(-5),
                        40,
                        undefined,
                        'http://test2.com'
                    ),
                    new Schedule(
                        createFutureDate(-8),
                        30,
                        undefined,
                        'http://test3.com'
                    ),
                ],
            });

            selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['schedules'],
            });
            const selectedRegistry = await activityRegistryRepository.findOne(
                registry.id
            );

            await activityRegistryRepository.delete(registry.id);
            await userRepository.delete(otherUser.id);

            expect(selectedActivity.schedules.length).toBe(
                oldSchedulesLength + 2
            );
            expect(selectedRegistry).toBeUndefined();
        });

        test('Não deve ter as matrículas removidas se os horários enviados forem os mesmos', async () => {
            let otherUser = createMockUser(
                'usuarioDeMatriculaTeste54352@gmail.com',
                '21511444371',
                '14326543763'
            );
            otherUser = await userRepository.save(otherUser);
            const registry = await activityRegistryService.registry(
                activity.id,
                otherUser.id
            );

            let selectedActivity = await activityRepository.findOne(
                activity.id,
                { relations: ['schedules'] }
            );
            const oldSchedulesLength = selectedActivity.schedules.length;

            await activityService.edit(activity.id, {
                schedules: [...selectedActivity.schedules],
            });

            selectedActivity = await activityRepository.findOne(activity.id, {
                relations: ['schedules'],
            });
            const selectedRegistry = await activityRegistryRepository.findOne(
                registry.id
            );

            await activityRegistryRepository.delete(registry.id);
            await userRepository.delete(otherUser.id);

            expect(selectedActivity.schedules.length).toBe(oldSchedulesLength);
            expect(selectedRegistry).toBeDefined();
        });

        test('Deve alterar os responsáveis da atividade com sucesso', async () => {
            const oldResponsibleUsers = activity.responsibleUsers;

            const responsibleUsers = [
                createMockUser(
                    'userAlteracao1@ggg.com',
                    '59452784083',
                    '00987657485'
                ),
                createMockUser(
                    'userAlteracao2@ggg.com',
                    '94304105043',
                    '11987657485'
                ),
            ];
            await userRepository.save(responsibleUsers[0]);
            await userRepository.save(responsibleUsers[1]);
            const updatedActivity = await activityService.edit(activity.id, {
                responsibleUsers,
            });

            const selectedActivity = await activityRepository.findOne(
                activity.id,
                {
                    relations: ['responsibleUsers'],
                }
            );

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
                createMockUser(
                    'userAlteracao1@ggg.com',
                    '59452784083',
                    '00987657485'
                ),
                createMockUser(
                    'userAlteracao2@ggg.com',
                    '94304105043',
                    '11987657485'
                ),
            ];
            await userRepository.save(teachingUsers[0]);
            await userRepository.save(teachingUsers[1]);
            const updatedActivity = await activityService.edit(activity.id, {
                teachingUsers,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id,
                {
                    relations: ['teachingUsers'],
                }
            );

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
            }).rejects.toThrowError(InvalidVacancyValue);
        });

        test('Deve falhar em alterar as vagas para zero', async () => {
            const vacancy = 0;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    vacancy,
                });
            }).rejects.toThrowError(InvalidVacancyValue);
        });

        test('Deve falhar em alterar a carga horária para negativo', async () => {
            const workloadInMinutes = -10;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    workloadInMinutes,
                });
            }).rejects.toThrowError(InvalidWorkloadMinutesValue);
        });

        test('Deve falhar em alterar a carga horária para zero', async () => {
            const workloadInMinutes = 0;
            await expect(async () => {
                await activityService.edit(activity.id, {
                    workloadInMinutes,
                });
            }).rejects.toThrowError(InvalidWorkloadMinutesValue);
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
                new Schedule(
                    createFutureDate(7),
                    40,
                    undefined,
                    'http://test2.com'
                ),
                new Schedule(
                    createFutureDate(8),
                    30,
                    undefined,
                    'http://test3.com'
                ),
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
            const event = createMockEvent([user], category);
            await eventRepository.save(event);
            await expect(async () => {
                await activityService.edit(activity.id, {
                    event,
                });
            }).rejects.toThrowError(EventChangeRestriction);

            await eventRepository.delete(event.id);
        });

        test('Deve falhar em remover os horários', async () => {
            await expect(async () => {
                await activityService.edit(activity.id, {
                    schedules: [],
                });
            }).rejects.toThrowError(SchedulesUndefined);
        });

        test('Deve falhar em remover os responsáveis', async () => {
            await expect(async () => {
                await activityService.edit(activity.id, {
                    responsibleUsers: [],
                });
            }).rejects.toThrowError(ResponsibleUsersUndefined);
        });

        test('Deve conseguir remover os responsáveis', async () => {
            const oldTeachingUsers = activity.teachingUsers;

            const teachingUsers = [];
            const updatedActivity = await activityService.edit(activity.id, {
                teachingUsers,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id,
                {
                    relations: ['teachingUsers'],
                }
            );
            expect(updatedActivity.teachingUsers.length).toBe(0);
            expect(selectedActivity.teachingUsers.length).toBe(0);

            await activityService.edit(activity.id, {
                teachingUsers: oldTeachingUsers,
            });
        });

        test('Deve alterar a categoria da atividade com sucesso', async () => {
            let newCategory = new ActivityCategory('JU', 'jujubas hell yea');
            newCategory = await activityCategoryRepository.save(newCategory);
            const updatedActivity = await activityService.edit(activity.id, {
                activityCategory: newCategory,
            });
            const selectedActivity = await activityRepository.findOne(
                activity.id,
                {
                    relations: ['activityCategory'],
                }
            );

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
            const selectedActivity = await activityRepository.findOne(
                activity.id
            );

            expect(updatedActivity.indexInCategory).toBe(
                activity.indexInCategory
            );
            expect(selectedActivity.indexInCategory).toBe(
                activity.indexInCategory
            );
            expect(selectedActivity.indexInCategory).not.toBe(indexInCategory);
        });
    });

    describe('Exclusão', () => {
        let activityId: number;

        beforeEach(async () => {
            try {
                const activity = await activityRepository.save(
                    createMockActivity(event, room, [user], activityCategory)
                );
                activityId = activity.id;
            } catch (err) {
                return;
            }
        });

        afterEach(async () => {
            await activityRepository.delete(activityId);
        });

        test('Deve falhar em excluir uma atividade de um evento o qual já começou', async () => {
            const startedEvent = createMockEvent([user], category);
            startedEvent.startDate = createFutureDate(-1);

            await eventRepository.save(startedEvent);

            const startedActivity = await activityRepository.save(
                createMockActivity(startedEvent, room, [user], activityCategory)
            );

            await expect(async () => { 
                await activityService.delete(startedActivity.id);
            }).rejects.toThrowError(ActivityDeleteIsHappening);

            await activityRepository.delete(startedActivity.id);
            await eventRepository.delete(startedEvent.id);
        });

        test('Deve falhar em excluir uma atividade com registros', async (done) => {
            let otherUser = createMockUser(
                'usuarioDeMatriculaTeste54353@gmail.com',
                '77596515037',
                '14326543765'
            );
            otherUser = await userRepository.save(otherUser);

            await activityRegistryService.registry(
                activityId,
                otherUser.id
            );

            await expect(async () => { 
                await activityService.delete(activityId);
            }).rejects.toThrowError(ActivityDeleteHasRegistry)
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
            const event = createMockEvent([user], category);
            event.startDate = createFutureDate(-5);
            event.endDate = createFutureDate(-2);
            await eventRepository.save(event);

            const otherActivity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            await activityRepository.save(otherActivity);

            await expect(async () => {
                await activityService.delete(otherActivity.id);
            }).rejects.toThrowError(ActivityDeleteHasHappened);

            await eventRepository.delete(event.id);
        });

        test('Deve retornar zero alterações ao excluir uma atividade inexistente', async () => {
            const deleteCount = await activityService.delete(-20);
            expect(deleteCount).toBe(0);
        });
    });
});