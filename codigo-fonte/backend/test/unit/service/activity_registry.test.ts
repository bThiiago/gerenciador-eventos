import { dataSource } from '@database/connection';
import { Repository } from 'typeorm';
import { container } from '@core/container';

import { Activity } from '@models/Activity';
import { Room } from '@models/Room';
import { User } from '@models/User';
import { EventCategory } from '@models/EventCategory';
import { Event } from '@models/Event';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { Presence } from '@models/Presence';
import { Schedule } from '@models/Schedule';
import { ActivityCategory } from '@models/ActivityCategory';

import { ActivityRegistryService } from '@services/activity_registry.service';
import { UserService } from '@services/user.service';

import { createMockActivity } from 'test/utils/createMockActivity';
import { createMockUser } from 'test/utils/createMockUser';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';

import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { InvisibleEventError } from '@errors/specialErrors/InvisibleEventError';
import { createFutureDate } from 'test/utils/createFutureDate';
import { ArchivedEventError } from '@errors/specialErrors/ArchivedEventError';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import { DateConflictError } from '@errors/specialErrors/DateConflictError';
import { OutsideOfRegistryDate } from '@errors/specialErrors/OutsideOfRegistryDate';

describe('Serviço da matrícula', () => {
    let presenceRepository: Repository<Presence>;
    let activityRegistryRepository: Repository<ActivityRegistry>;
    let categoryRepository: Repository<EventCategory>;
    let roomRepository: Repository<Room>;
    let activityRepository: Repository<Activity>;
    let eventRepository: Repository<Event>;
    let userRepository: Repository<User>;
    let activityCategoryRepository : Repository<ActivityCategory>;

    let activityRegistryService: ActivityRegistryService;
    let userService: UserService;

    let userResponsible: User;
    let userNotResponsible: User;
    let category: EventCategory;
    let event: Event;
    let room: Room;
    let activityCategory: ActivityCategory;
    let activity: Activity;

    const expectedUserRegistred = {
        id: expect.any(Number),
        name: expect.any(String),
        cpf: expect.any(String),
    };

    beforeAll(async () => {
        activityRegistryRepository = dataSource.getRepository(ActivityRegistry);
        presenceRepository = dataSource.getRepository(Presence);
        activityRepository = dataSource.getRepository(Activity);
        categoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        userRepository = dataSource.getRepository(User);
        roomRepository = dataSource.getRepository(Room);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        userResponsible = createMockUser(
            'carlos123@testinscricao.com',
            '72815076233',
            '662254369493'
        );
        userNotResponsible = createMockUser(
            'antonio123@testinscricao.com',
            '07906924223',
            '554443569493'
        );
        category = createMockEventCategory(
            'Categoria Teste Atividade Inscricao Controller',
            'ctaic1723'
        );
        event = createMockEvent([userResponsible], category);
        activityCategory = new ActivityCategory('WT', 'asdfsdg');
        room = new Room('TEST-REGISTRY 532', 30);

        activity = createMockActivity(event, room, [userResponsible], activityCategory);

        await userRepository.save(userResponsible);
        await userRepository.save(userNotResponsible);
        await categoryRepository.save(category);
        await eventRepository.save(event);
        event.statusVisible = true;
        await eventRepository.save(event);
        await roomRepository.save(room);
        await activityCategoryRepository.save(activityCategory);
        await activityRepository.save(activity);

        activityRegistryService = container.get(ActivityRegistryService);
        userService = container.get(UserService);
    });

    afterAll(async () => {
        await activityRepository.delete(activity.id);
        await activityCategoryRepository.delete(activityCategory.id);
        await roomRepository.delete(room.id);
        await eventRepository.delete(event.id);
        await categoryRepository.delete(category.id);
        await userRepository.delete(userResponsible.id);
        await userRepository.delete(userNotResponsible.id);
    });

    describe('Inscrição', () => {
        let otherActivity: Activity;
        let otherRoom: Room;
        beforeAll(async () => {
            event.registryStartDate = createFutureDate(-5);
            event.registryEndDate = createFutureDate(7);
            await eventRepository.save(event);
            otherRoom = new Room('hahah48392743289', 30);
            otherRoom = await roomRepository.save(otherRoom);
            otherActivity = createMockActivity(event, otherRoom, [
                userResponsible,
            ], activityCategory);
            otherActivity.schedules = [
                new Schedule(activity.schedules[0].startDate, 30, otherRoom)
            ];

            otherActivity = await activityRepository.save(otherActivity);
        });

        afterAll(async () => {
            await activityRepository.delete(otherActivity.id);
            await roomRepository.delete(otherRoom.id);
        });

        afterEach(async () => {
            await activityRegistryRepository
                .createQueryBuilder('activityRegistry')
                .delete()
                .execute();
        });

        test('Deve inscrever um usuário não inscrito', async () => {
            const registry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
            expect(registry).toBeDefined();
        });

        test('Espera-se que a matrícula seja marcada por padrão como true', async () => {
            const registry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
            expect(registry.readyForCertificate).toBeTruthy();
        });

        test('Um usuário deve ter suas presenças geradas ao se matricular', async () => {
            const expectedPresenceLength = activity.schedules.length;

            const registry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );

            const presences = (
                await activityRegistryRepository.findOne(registry.id, {
                    relations: ['presences'],
                })
            ).presences;
            await activityRegistryRepository.delete(registry.id);

            expect(presences).toBeDefined();
            expect(presences.length).toBe(expectedPresenceLength);
        });

        test('Um usuário deve ter suas presenças marcadas como presente por padrão', async () => {
            const registry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
            const presences = (
                await activityRegistryRepository.findOne(registry.id, {
                    relations: ['presences'],
                })
            ).presences;
            await activityRegistryRepository.delete(registry.id);

            expect(
                presences.every((presence) => presence.isPresent)
            ).toBeTruthy();
        });

        test('Deve falhar em inscrever o usuário duas vezes', async () => {
            await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrow(BusinessRuleError);
        });

        test('Deve falhar em inscrever o responsável pela atividade', async () => {
            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userResponsible.id
                );
            }).rejects.toThrow(BusinessRuleError);
        });

        test('Deve falhar em inscrever o ministrante da atividade', async () => {
            activity.teachingUsers = [userNotResponsible];
            await activityRepository.save(activity);

            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userResponsible.id
                );
            }).rejects.toThrow(BusinessRuleError);

            activity.teachingUsers = [];
            await activityRepository.save(activity);
        });

        test('Deve falhar em inscrever o usuário em um evento que não está visível', async () => {
            event.statusVisible = false;
            await eventRepository.save(event);
            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrow(NotFoundError);
            event.statusVisible = true;
            await eventRepository.save(event);
        });

        test('Deve falhar em inscrever o usuário se o período de inscrição do evento não começou ou já passou', async () => {
            event.registryStartDate = createFutureDate(-30);
            event.registryEndDate = createFutureDate(-25);
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrow(OutsideOfRegistryDate);

            event.registryStartDate = createFutureDate(10);
            event.registryEndDate = createFutureDate(20);
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.registry(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrow(OutsideOfRegistryDate);

            event.registryStartDate = createFutureDate(-5);
            event.registryEndDate = createFutureDate(7);
            await eventRepository.save(event);
        });

        test('Deve falhar em inscrever o usuário se ele estiver em uma atividade que ocorre no mesmo momento', async () => {
            await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
            await expect(async () => {
                await activityRegistryService.registry(
                    otherActivity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrow(DateConflictError);
        });
    });

    describe('Consulta', () => {
        const users: User[] = [];
        const activities: Activity[] = [];

        beforeAll(async () => {
            activities.push(createMockActivity(event, room, [userResponsible], activityCategory));
            activities.push(createMockActivity(event, room, [userResponsible], activityCategory));
            users.push(
                createMockUser(
                    'userTestRegistry1@asd.com',
                    '39002202040',
                    '18372748195'
                )
            );
            users.push(
                createMockUser(
                    'userTestRegistry2@asd.com',
                    '68809637062',
                    '99432748195'
                )
            );

            await activityRepository.save(activities[0]);
            await activityRepository.save(activities[1]);
            await userRepository.save(users[0]);
            await userRepository.save(users[1]);

            await activityRegistryRepository.save(
                new ActivityRegistry(activities[0], users[0])
            );
            await activityRegistryRepository.save(
                new ActivityRegistry(activities[0], users[1])
            );
            await activityRegistryRepository.save(
                new ActivityRegistry(activities[1], users[0])
            );
        });

        afterAll(async () => {
            await activityRegistryRepository
                .createQueryBuilder('activityRegistry')
                .delete()
                .execute();
            await activityRepository.delete(activities[0].id);
            await activityRepository.delete(activities[1].id);
            await userRepository.delete(users[0].id);
            await userRepository.delete(users[1].id);
        });

        describe('Por atividade', () => {
            test('Deve consultar os atributos corretos de uma matrícula', async () => {
                const findResult = await activityRegistryService.findByActivity(
                    activities[0].id
                );

                expect(findResult.items[0]).toEqual({
                    id: expect.any(Number),
                    readyForCertificate: expect.any(Boolean),
                    registryDate: expect.any(Date),
                    presences: expect.any(Array),
                    user: expect.any(User),
                    activity: expect.any(Activity),
                });

                expect(findResult.items[0].user).toEqual({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                });

                expect(findResult.items[0].activity).toEqual({
                    id: expect.any(Number),
                    title: expect.any(String),
                    schedules: expect.any(Array),
                    vacancy: expect.any(Number),
                });
            });

            test('Deve consultar todas as matrículas da atividade 1', async () => {
                const findResult = await activityRegistryService.findByActivity(
                    activities[0].id
                );

                expect(findResult.totalCount).toBe(2);
                expect(findResult.items.length).toBe(2);
            });

            test('Deve consultar todas as matrículas da atividade 2', async () => {
                const findResult = await activityRegistryService.findByActivity(
                    activities[1].id
                );

                expect(findResult.totalCount).toBe(1);
                expect(findResult.items.length).toBe(1);
            });

            test('Deve consultar uma matrícula por página', async () => {
                let findResult = await activityRegistryService.findByActivity(
                    activities[0].id,
                    {
                        page: 1,
                        limit: 1,
                    }
                );

                expect(findResult.items.length).toBe(1);
                expect(findResult.totalCount).toBe(2);

                findResult = await activityRegistryService.findByActivity(
                    activities[0].id,
                    {
                        page: 2,
                        limit: 1,
                    }
                );

                expect(findResult.items.length).toBe(1);
                expect(findResult.totalCount).toBe(2);

                findResult = await activityRegistryService.findByActivity(
                    activities[0].id,
                    {
                        page: 3,
                        limit: 1,
                    }
                );

                expect(findResult.items.length).toBe(0);
                expect(findResult.totalCount).toBe(2);
            });

            test('Deve consultar nenhuma matrícula de uma atividade inexistente', async () => {
                const findResult = await activityRegistryService.findByActivity(
                    -40
                );

                expect(findResult.totalCount).toBe(0);
                expect(findResult.items.length).toBe(0);
            });
        });

        describe('Por usuário e atividade', () => {
            test('Deve consultar os atributos corretos de uma matrícula', async () => {
                const registry =
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[0].id,
                        users[0].id
                    );

                expect(registry).toEqual({
                    id: expect.any(Number),
                    readyForCertificate: expect.any(Boolean),
                    registryDate: expect.any(Date),
                    presences: expect.any(Array),
                    user: expect.any(User),
                    activity: expect.any(Activity),
                });

                expect(registry.user).toEqual({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                });

                expect(registry.activity).toEqual({
                    id: expect.any(Number),
                    title: expect.any(String),
                    schedules: expect.any(Array),
                    vacancy: expect.any(Number),
                });
            });

            test('Deve consultar a matrícula do usuário 1 e atividade 1 com sucesso', async () => {
                const registry =
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[0].id,
                        users[0].id
                    );
                expect(registry).toBeDefined();
                expect(registry.user.id).toBe(users[0].id);
                expect(registry.activity.id).toBe(activities[0].id);
            });

            test('Deve consultar a matrícula do usuário 2 e atividade 1 com sucesso', async () => {
                const registry =
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[0].id,
                        users[1].id
                    );
                expect(registry).toBeDefined();
                expect(registry.user.id).toBe(users[1].id);
                expect(registry.activity.id).toBe(activities[0].id);
            });

            test('Deve consultar a matrícula do usuário 1 e atividade 2 com sucesso', async () => {
                const registry =
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[1].id,
                        users[0].id
                    );
                expect(registry).toBeDefined();
                expect(registry.user.id).toBe(users[0].id);
                expect(registry.activity.id).toBe(activities[1].id);
            });

            test('Deve falhar em consultar uma matrícula não existente', async () => {
                await expect(async () => {
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[1].id,
                        users[1].id
                    );
                }).rejects.toThrowError(NotFoundError);
            });

            test('Deve falhar em consultar a matrícula de um usuário inexistente', async () => {
                await expect(async () => {
                    await activityRegistryService.findByActivityIdAndUserId(
                        activities[0].id,
                        -40
                    );
                }).rejects.toThrowError(NotFoundError);
            });

            test('Deve falhar em consultar a matrícula de uma atividade inexistente', async () => {
                await expect(async () => {
                    await activityRegistryService.findByActivityIdAndUserId(
                        -40,
                        users[0].id
                    );
                }).rejects.toThrowError(NotFoundError);
            });
        });

        describe('Por atividade', () => {
            test('Deve consultar os usuários matriculados em uma atividade', async () => {
                const users = await userService.usersFromActivity(
                    activities[0].id
                );

                expect(users.items).toHaveLength(2);

                for (const user of users.items) {
                    expect(user).toEqual(expectedUserRegistred);
                }
            });
        });
    });

    describe('Remover inscrição', () => {
        let activityRegistry: ActivityRegistry;

        beforeEach(async () => {
            activityRegistry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
        });

        afterEach(async () => {
            await activityRegistryRepository
                .createQueryBuilder('activityRegistry')
                .delete()
                .execute();
        });

        test('Deve remover a inscrição do usuário com sucesso', async () => {
            const affected = await activityRegistryService.delete(
                activity.id,
                userNotResponsible.id
            );
            expect(affected).toBe(1);
        });

        test('As presenças devem ser apagadas ao se apagar uma matrícula', async () => {
            const presences = activityRegistry.presences;

            await activityRegistryService.delete(
                activity.id,
                userNotResponsible.id
            );

            const promises = presences.map(async (presence) => {
                const targetPresence = await presenceRepository.findOne(
                    presence.id
                );
                expect(targetPresence).toBeUndefined();
            });

            await Promise.all(promises);
        });

        test('Deve dar erro ao informar uma atividade inexistente', async () => {
            await expect(async () => {
                await activityRegistryService.delete(
                    -40,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(NotFoundError);
        });

        test('Deve remover nenhuma matrícula ao informar um usuário inexistente', async () => {
            const affected = await activityRegistryService.delete(
                activity.id,
                -40
            );
            expect(affected).toBe(0);
        });

        test('Deve falhar em remover a inscrição de um evento invisível', async () => {
            event.statusVisible = false;
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.delete(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(InvisibleEventError);

            event.statusVisible = true;
            await eventRepository.save(event);
        });

        test('Deve falhar em remover a inscrição de um evento que já ocorreu', async () => {
            event.startDate = createFutureDate(-20);
            event.endDate = createFutureDate(-10);
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.delete(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(ArchivedEventError);

            event.startDate = createFutureDate(10);
            event.endDate = createFutureDate(20);
            await eventRepository.save(event);
        });
    });

    describe('Apagar todas inscrições por atividade', () => {
        let activityRegistry: ActivityRegistry;

        beforeEach(async () => {
            activityRegistry = await activityRegistryService.registry(
                activity.id,
                userNotResponsible.id
            );
        });

        afterEach(async () => {
            await activityRegistryRepository
                .createQueryBuilder('activityRegistry')
                .delete()
                .execute();
        });

        test('Deve remover a inscrição do usuário com sucesso', async () => {
            const affected = await activityRegistryService.delete(
                activity.id,
                userNotResponsible.id
            );
            expect(affected).toBe(1);
        });

        test('As presenças devem ser apagadas ao se apagar uma matrícula', async () => {
            const presences = activityRegistry.presences;

            await activityRegistryService.delete(
                activity.id,
                userNotResponsible.id
            );

            const promises = presences.map(async (presence) => {
                const targetPresence = await presenceRepository.findOne(
                    presence.id
                );
                expect(targetPresence).toBeUndefined();
            });

            await Promise.all(promises);
        });

        test('Deve dar erro ao informar uma atividade inexistente', async () => {
            await expect(async () => {
                await activityRegistryService.delete(
                    -40,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(NotFoundError);
        });

        test('Deve remover nenhuma matrícula ao informar um usuário inexistente', async () => {
            const affected = await activityRegistryService.delete(
                activity.id,
                -40
            );
            expect(affected).toBe(0);
        });

        test('Deve falhar em remover a inscrição de um evento invisível', async () => {
            event.statusVisible = false;
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.delete(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(InvisibleEventError);

            event.statusVisible = true;
            await eventRepository.save(event);
        });

        test('Deve falhar em remover a inscrição de um evento que já ocorreu', async () => {
            event.startDate = createFutureDate(-20);
            event.endDate = createFutureDate(-10);
            await eventRepository.save(event);

            await expect(async () => {
                await activityRegistryService.delete(
                    activity.id,
                    userNotResponsible.id
                );
            }).rejects.toThrowError(ArchivedEventError);

            event.startDate = createFutureDate(10);
            event.endDate = createFutureDate(20);
            await eventRepository.save(event);
        });
    });
});