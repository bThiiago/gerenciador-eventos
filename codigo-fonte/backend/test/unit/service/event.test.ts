import { container } from '@core/container';
import { dataSource } from '@database/connection';
import { Event } from '@models/Event';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { ActivityCategory } from '@models/ActivityCategory';
import { Activity } from '@models/Activity';

import { User } from '@models/User';
import { ActivityService } from '@services/activity.service';
import { EventService } from '@services/event.service';
import { RoomService } from '@services/room.service';

import { createFutureDate } from 'test/utils/createFutureDate';
import { createMockActivity } from 'test/utils/createMockActivity';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockUser } from 'test/utils/createMockUser';
import { QueryFailedError, Repository } from 'typeorm';

import { EndDateBeforeStartDateError } from '@errors/specialErrors/EndDateBeforeStartDateError';
import { StartDateUndefined } from '@errors/undefinedErrors/StartDateUndefined';
import { EndDateUndefined } from '@errors/undefinedErrors/EndDateUndefined';
import { ResponsibleUsersUndefined } from '@errors/undefinedErrors/ResponsibleUsersUndefined';
import { NotFoundError } from '@errors/specialErrors/NotFoundError';
import { EventChangeRestriction } from '@errors/specialErrors/EventChangeRestriction';
import { EventDeleteRestriction } from '@errors/services/EventDeleteRestriction';
import { EndDateBeforeStartDateRegistryError } from '@errors/specialErrors/EndDateBeforeStartDateErrorRegistry';
import { ConflictingEditionError } from '@errors/specialErrors/ConflictingEditionError';

describe('Serviço do evento', () => {
    let categoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let roomRepository: Repository<Room>;
    let activityRepository: Repository<Activity>;
    let userRepository: Repository<User>;
    let activityCategoryRepository: Repository<ActivityCategory>;

    const users: User[] = [];
    const categories: EventCategory[] = [];

    let roomService: RoomService;
    let eventService: EventService;
    let activityService: ActivityService;

    beforeAll(async () => {
        userRepository = dataSource.getRepository(User);
        eventRepository = dataSource.getRepository(Event);
        categoryRepository = dataSource.getRepository(EventCategory);
        roomRepository = dataSource.getRepository(Room);
        activityRepository = dataSource.getRepository(Activity);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        users.push(
            createMockUser(
                'carlos123@testevento.com',
                '76298780017',
                '182342169493'
            )
        );
        users.push(
            createMockUser(
                'antonio123@testevento.com',
                '78778283060',
                '232342143441'
            )
        );

        categories.push(
            createMockEventCategory('Categoria 1 Test Event Service', 'c1tes11')
        );
        categories.push(
            createMockEventCategory('Categoria 2 Test Event Service', 'c2tes22')
        );

        await userRepository.save(users[0]);
        await userRepository.save(users[1]);
        await categoryRepository.save(categories[0]);
        await categoryRepository.save(categories[1]);

        roomService = container.get(RoomService);
        eventService = container.get(EventService);
        activityService = container.get(ActivityService);
    });

    afterAll(async () => {
        await userRepository.delete(users[0].id);
        await userRepository.delete(users[1].id);
        await categoryRepository.delete(categories[0].id);
        await categoryRepository.delete(categories[1].id);
    });

    describe('Cadastro', () => {
        afterEach(async () => {
            await eventRepository
                .createQueryBuilder('event')
                .delete()
                .execute();
        });

        test('Deve cadastrar um evento com sucesso', async () => {
            const event = createMockEvent(users, categories[0]);
            const createdEvent = await eventService.create(event);
            expect(createdEvent.id).toBeDefined();

            const activityFromDB = await eventRepository.findOne(
                createdEvent.id
            );
            expect(activityFromDB).toBeDefined();
        });

        test('Deve falhar em cadastrar um evento sem edição', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.edition;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar um evento com edição conflitante na mesma "categoria"', async () => {
            const event = createMockEvent(users, categories[0]);
            const anotherEvent = createMockEvent(users, categories[0]);

            await eventService.create(event);

            await expect(async () => {
                await eventService.create(anotherEvent);
            }).rejects.toThrowError(ConflictingEditionError);
        });

        test('Deve falhar em cadastrar um evento sem descrição', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.description;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar um evento com descrição com mais de 5000 caracteres', async () => {
            const event = createMockEvent(users, categories[0]);
            event.description = 'a'.repeat(5001);

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar um evento sem data inicial', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.startDate;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(StartDateUndefined);
        });

        test('Deve falhar em cadastrar um evento sem data final', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.endDate;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(EndDateUndefined);
        });

        test('Deve falhar em cadastrar um evento com a data final anterior à data inicial', async () => {
            const event = createMockEvent(users, categories[0]);
            event.endDate = createFutureDate(1);
            event.startDate = createFutureDate(4);

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(EndDateBeforeStartDateError);
        });

        test('Deve conseguir cadastrar um evento de um dia (data final igual à inicial)', async () => {
            const event = createMockEvent(users, categories[0]);
            event.endDate = event.startDate;

            const createdEvent = await eventService.create(event);
            expect(createdEvent.endDate.getTime()).toBe(
                event.startDate.getTime()
            );
        });

        test('Deve falhar em cadastrar um evento sem área', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.area;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve sempre cadastrar o estado visível do evento como falso', async () => {
            const event = createMockEvent(users, categories[0]);
            event.statusVisible = true;

            const createdEvent = await eventService.create(event);
            expect(createdEvent.statusVisible).toBeFalsy();
        });

        test('Deve sempre cadastrar o estado ativo do evento como falso', async () => {
            const event = createMockEvent(users, categories[0]);
            event.statusActive = true;

            const createdEvent = await eventService.create(event);
            expect(createdEvent.statusVisible).toBeFalsy();
        });

        test('Deve falhar em cadastrar um evento sem usuários responsáveis', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.responsibleUsers;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(ResponsibleUsersUndefined);

            event.responsibleUsers = [];

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(ResponsibleUsersUndefined);
        });

        test('Deve falhar em cadastrar um evento sem categoria', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.eventCategory;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(QueryFailedError);
        });

        test('Deve falhar em cadastrar um evento sem data inicial de inscrição', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.registryStartDate;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(StartDateUndefined);
        });

        test('Deve falhar em cadastrar um evento sem data final de inscrição', async () => {
            const event = createMockEvent(users, categories[0]);
            delete event.registryEndDate;

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(EndDateUndefined);
        });

        test('Deve falhar em cadastrar um evento com a data final de inscrição anterior à data inicial', async () => {
            const event = createMockEvent(users, categories[0]);
            event.registryEndDate = createFutureDate(1);
            event.registryStartDate = createFutureDate(4);

            await expect(async () => {
                await eventService.create(event);
            }).rejects.toThrowError(EndDateBeforeStartDateRegistryError);
        });
    });

    describe('Consulta', () => {
        const events: Event[] = [];
        const oldEvents: Event[] = [];

        beforeAll(async () => {
            // Evento visível ocorrendo agora
            events.push(createMockEvent([users[0]], categories[0]));
            events[0].startDate = createFutureDate(-1);
            events[0].edition = 1;
            events[0].endDate = createFutureDate(5);

            // Evento visível ocorrendo agora
            events.push(createMockEvent([users[0]], categories[0]));
            events[1].startDate = createFutureDate(-2);
            events[1].edition = 2;
            events[1].endDate = createFutureDate(4);

            // Evento futuro
            events.push(createMockEvent([users[1]], categories[0]));
            events[2].startDate = createFutureDate(3);
            events[2].edition = 3;
            events[2].endDate = createFutureDate(7);

            // Evento futuro visível
            events.push(createMockEvent([users[1]], categories[0]));
            events[3].startDate = createFutureDate(6);
            events[3].edition = 4;
            events[3].endDate = createFutureDate(8);

            // Evento futuro
            events.push(createMockEvent([users[1]], categories[0]));
            events[4].startDate = createFutureDate(4);
            events[4].edition = 6;
            events[4].endDate = createFutureDate(8);

            oldEvents.push(createMockEvent([users[0]], categories[0]));
            oldEvents[0].startDate = createFutureDate(-10);
            oldEvents[0].edition = 7;
            oldEvents[0].endDate = createFutureDate(-5);

            oldEvents.push(createMockEvent([users[0]], categories[0]));
            oldEvents[1].startDate = createFutureDate(-4);
            oldEvents[1].edition = 8;
            oldEvents[1].endDate = createFutureDate(-2);

            oldEvents.push(createMockEvent([users[1]], categories[1]));
            oldEvents[2].startDate = createFutureDate(-12);
            oldEvents[2].edition = 9;
            oldEvents[2].endDate = createFutureDate(-7);

            oldEvents.push(createMockEvent([users[1]], categories[1]));
            oldEvents[3].startDate = createFutureDate(-20);
            oldEvents[3].edition = 10;
            oldEvents[3].endDate = createFutureDate(-13);

            oldEvents.push(createMockEvent([users[1]], categories[0]));
            oldEvents[4].startDate = createFutureDate(-18);
            oldEvents[4].edition = 11;
            oldEvents[4].endDate = createFutureDate(-4);

            await eventRepository.save(events[0]);
            events[0].statusVisible = true;
            await eventRepository.save(events[0]);

            await eventRepository.save(events[1]);
            events[1].statusVisible = true;
            await eventRepository.save(events[1]);

            await eventRepository.save(events[2]);

            await eventRepository.save(events[3]);
            events[3].statusVisible = true;
            await eventRepository.save(events[3]);

            await eventRepository.save(events[4]);

            await eventRepository.save(oldEvents[0]);
            await eventRepository.save(oldEvents[1]);
            await eventRepository.save(oldEvents[2]);
            await eventRepository.save(oldEvents[3]);
            await eventRepository.save(oldEvents[4]);
        });

        afterAll(async () => {
            await eventRepository.delete(events[0].id);
            await eventRepository.delete(events[1].id);
            await eventRepository.delete(events[2].id);
            await eventRepository.delete(events[3].id);
            await eventRepository.delete(events[4].id);

            await eventRepository.delete(oldEvents[0].id);
            await eventRepository.delete(oldEvents[1].id);
            await eventRepository.delete(oldEvents[2].id);
            await eventRepository.delete(oldEvents[3].id);
            await eventRepository.delete(oldEvents[4].id);
        });

        const expectedCommonUserBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            description: expect.any(String),
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            area: expect.any(String),
            statusActive: expect.any(Boolean),
            eventCategory: expect.any(EventCategory),
            registryStartDate: expect.any(Date),
            registryEndDate: expect.any(Date),
            display: expect.any(Number),
            editionDisplay: expect.any(Number),
        };

        const expectedAdminBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            description: expect.any(String),
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            area: expect.any(String),
            statusActive: expect.any(Boolean),
            statusVisible: expect.any(Boolean),
            eventCategory: expect.any(EventCategory),
            registryStartDate: expect.any(Date),
            registryEndDate: expect.any(Date),
            display: expect.any(Number),
            editionDisplay: expect.any(Number),

            responsibleUsers: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                }),
            ]),
        };

        const expectedOrganizerUserBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            description: expect.any(String),
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            area: expect.any(String),
            statusActive: expect.any(Boolean),
            statusVisible: expect.any(Boolean),
            eventCategory: expect.any(EventCategory),
            registryStartDate: expect.any(Date),
            registryEndDate: expect.any(Date),
            display: expect.any(Number),
            editionDisplay: expect.any(Number),

            responsibleUsers: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                }),
            ]),
        };

        describe('Por ID', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const foundEvent = await eventService.findByIdAsCommonUser(
                        events[0].id
                    );

                    expect(foundEvent).toEqual(expectedCommonUserBody);
                });

                test('Deve consultar o evento 1 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsCommonUser(
                        events[0].id
                    );
                    expect(foundEvent.id).toBe(events[0].id);
                });

                test('Deve consultar o evento 2 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsCommonUser(
                        events[1].id
                    );
                    expect(foundEvent.id).toBe(events[1].id);
                });

                test('Deve falhar em consultar o evento 3, pois não é visível', async () => {
                    await expect(async () => {
                        await eventService.findByIdAsCommonUser(events[2].id);
                    }).rejects.toThrowError(NotFoundError);
                });

                test('Deve consultar o evento 4 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsCommonUser(
                        events[3].id
                    );
                    expect(foundEvent.id).toBe(events[3].id);
                });

                test('Deve falhar em consultar o evento 5, pois não é visível', async () => {
                    await expect(async () => {
                        await eventService.findByIdAsCommonUser(events[4].id);
                    }).rejects.toThrowError(NotFoundError);
                });

                test('Deve falhar em consultar um evento inexistente', async () => {
                    await expect(async () => {
                        await eventService.findByIdAsCommonUser(-40);
                    }).rejects.toThrowError(NotFoundError);
                });
            });

            describe('Admin ou organizador do evento', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[0].id
                    );

                    expect(foundEvent).toEqual(expectedAdminBody);
                });

                test('Deve consultar o evento 1 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[0].id
                    );
                    expect(foundEvent.edition).toBe(events[0].edition);
                });

                test('Deve consultar o evento 2 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[1].id
                    );
                    expect(foundEvent.edition).toBe(events[1].edition);
                });

                test('Deve consultar o evento 2 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[2].id
                    );
                    expect(foundEvent.edition).toBe(events[2].edition);
                });

                test('Deve consultar o evento 4 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[3].id
                    );
                    expect(foundEvent.edition).toBe(events[3].edition);
                });

                test('Deve consultar o evento 5 com sucesso', async () => {
                    const foundEvent = await eventService.findByIdAsAdmin(
                        events[4].id
                    );
                    expect(foundEvent.edition).toBe(events[4].edition);
                });

                test('Deve falhar em consultar um evento inexistente', async () => {
                    await expect(async () => {
                        await eventService.findByIdAsAdmin(-40);
                    }).rejects.toThrowError(NotFoundError);
                });
            });
        });

        describe('Por ID e Categoria', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsCommonUser(
                            categories[0].url_src,
                            events[0].id
                        );

                    expect(foundEvent).toEqual(expectedCommonUserBody);
                });

                test('Deve consultar o evento 1 da categoria 1 com sucesso', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsCommonUser(
                            categories[0].url_src,
                            events[0].id
                        );
                    expect(foundEvent.edition).toBe(events[0].edition);
                });

                test('Deve consultar o evento 2 da categoria 1 com sucesso', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsCommonUser(
                            categories[0].url_src,
                            events[1].id
                        );
                    expect(foundEvent.edition).toBe(events[1].edition);
                });

                test('Deve falhar em consultar um evento com categoria inexistente', async () => {
                    await expect(async () => {
                        await eventService.findEventsByCategoryAndIdAsCommonUser(
                            'fnadjfdsbnjfbndsfbsad',
                            events[0].id
                        );
                    }).rejects.toThrowError(NotFoundError);
                });

                test('Deve falhar em consultar um evento inexistente', async () => {
                    await expect(async () => {
                        await eventService.findEventsByCategoryAndIdAsCommonUser(
                            categories[0].url_src,
                            -40
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });

            describe('Admin ou organizador do evento', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsAdmin(
                            categories[0].url_src,
                            events[0].id
                        );

                    expect(foundEvent).toEqual(expectedAdminBody);
                });

                test('Deve consultar o evento 1 da categoria 1 com sucesso', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsAdmin(
                            categories[0].url_src,
                            events[0].id
                        );
                    expect(foundEvent.edition).toBe(events[0].edition);
                });

                test('Deve consultar o evento 2 da categoria 1 com sucesso', async () => {
                    const foundEvent =
                        await eventService.findEventsByCategoryAndIdAsAdmin(
                            categories[0].url_src,
                            events[1].id
                        );
                    expect(foundEvent.edition).toBe(events[1].edition);
                });

                test('Deve falhar em consultar um evento com categoria inexistente', async () => {
                    await expect(async () => {
                        await eventService.findEventsByCategoryAndIdAsAdmin(
                            'fnadjfdsbnjfbndsfbsad',
                            events[0].id
                        );
                    }).rejects.toThrowError(NotFoundError);
                });

                test('Deve falhar em consultar um evento inexistente', async () => {
                    await expect(async () => {
                        await eventService.findEventsByCategoryAndIdAsAdmin(
                            categories[0].url_src,
                            -40
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });
        });

        describe('Por usuário responsável', () => {
            describe('Eventos atuais e futuros', () => {
                test('Deve consultar os atributos necessários de um evento', async () => {
                    const findResult = await eventService.findByResponsibleUser(
                        users[0].id
                    );

                    expect(findResult.items[0]).toEqual(
                        expectedOrganizerUserBody
                    );
                });

                test('Deve consultar os dois eventos do usuário 1', async () => {
                    const findResult = await eventService.findByResponsibleUser(
                        users[0].id
                    );
                    expect(findResult.totalCount).toBe(2);
                    expect(
                        findResult.items.every(
                            (event) => event.endDate > new Date()
                        )
                    ).toBeTruthy();
                });

                test('Deve consultar os três eventos do usuário 2', async () => {
                    const findResult = await eventService.findByResponsibleUser(
                        users[1].id
                    );
                    expect(findResult.totalCount).toBe(3);
                    expect(
                        findResult.items.every(
                            (event) => event.endDate > new Date()
                        )
                    ).toBeTruthy();
                });

                test('Deve consultar dois eventos por página do usuário 2', async () => {
                    let findResult = await eventService.findByResponsibleUser(
                        users[1].id,
                        {
                            limit: 2,
                            page: 1,
                        }
                    );
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findByResponsibleUser(
                        users[1].id,
                        {
                            limit: 2,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findByResponsibleUser(
                        users[1].id,
                        {
                            limit: 2,
                            page: 3,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await eventService.findByResponsibleUser(
                            users[0].id + 5432423
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });

            describe('Eventos anteriores', () => {
                test('Deve consultar os atributos necessários de um evento', async () => {
                    const findResult =
                        await eventService.findOldByResponsibleUser(
                            users[0].id
                        );

                    expect(findResult.items[0]).toEqual(
                        expectedOrganizerUserBody
                    );
                });

                test('Deve consultar os dois eventos do usuário 1', async () => {
                    const findResult =
                        await eventService.findOldByResponsibleUser(
                            users[0].id
                        );
                    expect(findResult.totalCount).toBe(2);
                    expect(
                        findResult.items.every(
                            (event) => event.endDate < new Date()
                        )
                    ).toBeTruthy();
                });

                test('Deve consultar os três eventos do usuário 2', async () => {
                    const findResult =
                        await eventService.findOldByResponsibleUser(
                            users[1].id
                        );
                    expect(findResult.totalCount).toBe(3);
                    expect(
                        findResult.items.every(
                            (event) => event.endDate < new Date()
                        )
                    ).toBeTruthy();
                });

                test('Deve consultar dois eventos por página do usuário 2', async () => {
                    let findResult =
                        await eventService.findOldByResponsibleUser(
                            users[1].id,
                            {
                                limit: 2,
                                page: 1,
                            }
                        );
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findOldByResponsibleUser(
                        users[1].id,
                        {
                            limit: 2,
                            page: 2,
                        }
                    );
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findOldByResponsibleUser(
                        users[1].id,
                        {
                            limit: 2,
                            page: 3,
                        }
                    );
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });

                test('Deve dar erro ao consultar de um usuário inexistente', async () => {
                    await expect(async () => {
                        await eventService.findByResponsibleUser(
                            users[0].id + 5432423
                        );
                    }).rejects.toThrowError(NotFoundError);
                });
            });
        });

        describe('Apenas eventos futuros e ocorrendo agora', () => {
            describe('Usuário comum ou sem autenticação', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const findResult = await eventService.findAsCommonUser();

                    expect(findResult.items[0]).toEqual(expectedCommonUserBody);
                });

                test('Deve consultar apenas os eventos visíveis, em ordem', async () => {
                    // Ordem
                    // Evento 2, Evento 1, Evento 4

                    const findResult = await eventService.findAsCommonUser();
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                    expect(findResult.items[0].id).toBe(events[1].id);
                    expect(findResult.items[1].id).toBe(events[0].id);
                    expect(findResult.items[2].id).toBe(events[3].id);
                });

                test('Deve consultar dois eventos por página (2 na primeira, 1 na segunda, 0 na terceira)', async () => {
                    let findResult = await eventService.findAsCommonUser({
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findAsCommonUser({
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);

                    findResult = await eventService.findAsCommonUser({
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
            });

            describe('Admin ou organizador do evento', () => {
                test('Deve consultar os atributos corretos de um evento', async () => {
                    const findResult = await eventService.findAsAdmin();

                    expect(findResult.items[0]).toEqual(expectedAdminBody);
                });

                test('Deve consultar todos os eventos, em ordem', async () => {
                    // Ordem
                    // Evento 2, Evento 1, Evento 3, Evento 5, Evento 4

                    const findResult = await eventService.findAsAdmin();
                    expect(findResult.items.length).toBe(5);
                    expect(findResult.totalCount).toBe(5);
                    expect(findResult.items[0].id).toBe(events[1].id);
                    expect(findResult.items[1].id).toBe(events[0].id);
                    expect(findResult.items[2].id).toBe(events[2].id);
                    expect(findResult.items[3].id).toBe(events[4].id);
                    expect(findResult.items[4].id).toBe(events[3].id);
                });

                test('Deve consultar três eventos por página (3 na primeira, 2 na segunda, 0 na terceira)', async () => {
                    let findResult = await eventService.findAsAdmin({
                        limit: 3,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(5);

                    findResult = await eventService.findAsAdmin({
                        limit: 3,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(5);

                    findResult = await eventService.findAsAdmin({
                        limit: 3,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(5);
                });
            });
        });

        describe('Apenas eventos anteriores', () => {
            describe('Todos os anteriores', () => {
                describe('Usuário comum ou sem autenticação', () => {
                    test('Deve consultar os atributos corretos de um evento', async () => {
                        const findResult =
                            await eventService.findOldEventsAsCommonUser();

                        expect(findResult.items[0]).toEqual(
                            expectedCommonUserBody
                        );
                    });

                    test('Deve consultar apenas os eventos realizados, em ordem', async () => {
                        // Ordem
                        // Evento 2, 5, 1, 3, 4

                        const findResult =
                            await eventService.findOldEventsAsCommonUser();
                        expect(findResult.items.length).toBe(5);
                        expect(findResult.totalCount).toBe(5);

                        expect(findResult.items[0].id).toBe(oldEvents[1].id);
                        expect(findResult.items[1].id).toBe(oldEvents[4].id);
                        expect(findResult.items[2].id).toBe(oldEvents[0].id);
                        expect(findResult.items[3].id).toBe(oldEvents[2].id);
                        expect(findResult.items[4].id).toBe(oldEvents[3].id);
                    });

                    test('Deve consultar três eventos por página (3 na primeira, 2 na segunda, 0 na terceira)', async () => {
                        let findResult =
                            await eventService.findOldEventsAsCommonUser({
                                limit: 3,
                                page: 1,
                            });
                        expect(findResult.items.length).toBe(3);
                        expect(findResult.totalCount).toBe(5);

                        findResult =
                            await eventService.findOldEventsAsCommonUser({
                                limit: 3,
                                page: 2,
                            });
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(5);

                        findResult =
                            await eventService.findOldEventsAsCommonUser({
                                limit: 3,
                                page: 3,
                            });
                        expect(findResult.items.length).toBe(0);
                        expect(findResult.totalCount).toBe(5);
                    });
                });

                describe('Admin ou organizador do evento', () => {
                    test('Deve consultar os atributos corretos de um evento', async () => {
                        const findResult =
                            await eventService.findOldEventsAsAdmin();

                        expect(findResult.items[0]).toEqual(expectedAdminBody);
                    });

                    test('Deve consultar apenas os eventos realizados, em ordem', async () => {
                        // Ordem
                        // Evento 2, 5, 1, 3, 4

                        const findResult =
                            await eventService.findOldEventsAsAdmin();
                        expect(findResult.items.length).toBe(5);
                        expect(findResult.totalCount).toBe(5);

                        expect(findResult.items[0].id).toBe(oldEvents[1].id);
                        expect(findResult.items[1].id).toBe(oldEvents[4].id);
                        expect(findResult.items[2].id).toBe(oldEvents[0].id);
                        expect(findResult.items[3].id).toBe(oldEvents[2].id);
                        expect(findResult.items[4].id).toBe(oldEvents[3].id);
                    });

                    test('Deve consultar três eventos por página (3 na primeira, 2 na segunda, 0 na terceira)', async () => {
                        let findResult =
                            await eventService.findOldEventsAsAdmin({
                                limit: 3,
                                page: 1,
                            });
                        expect(findResult.items.length).toBe(3);
                        expect(findResult.totalCount).toBe(5);

                        findResult = await eventService.findOldEventsAsAdmin({
                            limit: 3,
                            page: 2,
                        });
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(5);

                        findResult = await eventService.findOldEventsAsAdmin({
                            limit: 3,
                            page: 3,
                        });
                        expect(findResult.items.length).toBe(0);
                        expect(findResult.totalCount).toBe(5);
                    });
                });
            });

            describe('Anteriores por categoria', () => {
                describe('Usuário comum ou sem autenticação', () => {
                    test('Deve consultar os atributos corretos de um evento', async () => {
                        const findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[0].url_src
                            );

                        expect(findResult.items[0]).toEqual(
                            expectedCommonUserBody
                        );
                    });

                    test('Deve consultar apenas os eventos realizados da categoria 1, em ordem', async () => {
                        // Ordem
                        // Evento 2, 5, 1

                        const findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[0].url_src
                            );
                        expect(findResult.items.length).toBe(3);
                        expect(findResult.totalCount).toBe(3);

                        expect(findResult.items[0].id).toBe(oldEvents[1].id);
                        expect(findResult.items[1].id).toBe(oldEvents[4].id);
                        expect(findResult.items[2].id).toBe(oldEvents[0].id);
                    });

                    test('Deve consultar apenas os eventos realizados da categoria 2, em ordem', async () => {
                        // Ordem
                        // Evento 3, 4

                        const findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[1].url_src
                            );
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(2);

                        expect(findResult.items[0].id).toBe(oldEvents[2].id);
                        expect(findResult.items[1].id).toBe(oldEvents[3].id);
                    });

                    test('Deve consultar dois eventos por página (2 na primeira, 1 na segunda, 0 na terceira)', async () => {
                        let findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[0].url_src,
                                {
                                    limit: 2,
                                    page: 1,
                                }
                            );
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(3);

                        findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[0].url_src,
                                {
                                    limit: 2,
                                    page: 2,
                                }
                            );
                        expect(findResult.items.length).toBe(1);
                        expect(findResult.totalCount).toBe(3);

                        findResult =
                            await eventService.findOldEventsByCategoryAsCommonUser(
                                categories[0].url_src,
                                {
                                    limit: 2,
                                    page: 3,
                                }
                            );
                        expect(findResult.items.length).toBe(0);
                        expect(findResult.totalCount).toBe(3);
                    });
                });

                describe('Admin ou organizador do evento', () => {
                    test('Deve consultar os atributos corretos de um evento', async () => {
                        const findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[0].url_src
                            );

                        expect(findResult.items[0]).toEqual(expectedAdminBody);
                    });

                    test('Deve consultar apenas os eventos realizados da categoria 1, em ordem', async () => {
                        // Ordem
                        // Evento 2, 5, 1

                        const findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[0].url_src
                            );
                        expect(findResult.items.length).toBe(3);
                        expect(findResult.totalCount).toBe(3);

                        expect(findResult.items[0].id).toBe(oldEvents[1].id);
                        expect(findResult.items[1].id).toBe(oldEvents[4].id);
                        expect(findResult.items[2].id).toBe(oldEvents[0].id);
                    });

                    test('Deve consultar apenas os eventos realizados da categoria 2, em ordem', async () => {
                        // Ordem
                        // Evento 3, 4

                        const findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[1].url_src
                            );
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(2);

                        expect(findResult.items[0].id).toBe(oldEvents[2].id);
                        expect(findResult.items[1].id).toBe(oldEvents[3].id);
                    });

                    test('Deve consultar dois eventos por página (2 na primeira, 1 na segunda, 0 na terceira)', async () => {
                        let findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[0].url_src,
                                {
                                    limit: 2,
                                    page: 1,
                                }
                            );
                        expect(findResult.items.length).toBe(2);
                        expect(findResult.totalCount).toBe(3);

                        findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[0].url_src,
                                {
                                    limit: 2,
                                    page: 2,
                                }
                            );
                        expect(findResult.items.length).toBe(1);
                        expect(findResult.totalCount).toBe(3);

                        findResult =
                            await eventService.findOldEventsByCategoryAsAdmin(
                                categories[0].url_src,
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
        });
    });

    describe('Alterar', () => {
        let event: Event;
        let midEvent: Event;
        let oldEvent: Event;

        let conflictingEvent : Event;

        beforeAll(async () => {
            event = createMockEvent(users, categories[0]);
            event.edition = 1;
            midEvent = createMockEvent(users, categories[0]);
            midEvent.edition = 2;
            oldEvent = createMockEvent(users, categories[0]);
            oldEvent.edition = 3;

            midEvent.startDate = createFutureDate(-10);
            midEvent.endDate = createFutureDate(3);

            oldEvent.startDate = createFutureDate(-10);
            oldEvent.endDate = createFutureDate(-3);

            event = await eventRepository.save(event);
            midEvent = await eventRepository.save(midEvent);
            oldEvent = await eventRepository.save(oldEvent);
        });

        beforeEach(async () => {
            await activityRepository.createQueryBuilder('a').delete().execute();
            await roomRepository.createQueryBuilder('a').delete().execute();
            await activityCategoryRepository
                .createQueryBuilder('a')
                .delete()
                .execute();
        });

        afterAll(async () => {
            await eventRepository.delete(event.id);
            await eventRepository.delete(midEvent.id);
            await eventRepository.delete(oldEvent.id);
        });

        describe('Evento futuro', () => {
            afterAll(async () => {
                if (conflictingEvent && conflictingEvent.id) {
                    await eventRepository.delete(conflictingEvent.id);
                }
            });

            test('Não deve falhar ao passar o evento com os mesmos atributos', async () => {
                await expect(
                    eventService.edit(event.id, event)
                ).resolves.not.toThrow();
            });

            test('Deve alterar a edição do evento futuro com sucesso', async () => {
                const edition = 5;
                const updatedEvent = await eventService.edit(event.id, {
                    edition,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.edition).toBe(edition);
                expect(selectedEvent.edition).toBe(edition);
            });

            test('Deve falhar em alterar para uma edição conflitante de um mesmo evento', async () => {
                conflictingEvent = createMockEvent(users, categories[0]);
                conflictingEvent.edition = 4;
                conflictingEvent = await eventRepository.save(conflictingEvent);

                const edition = 4;
                await expect(async () => {
                    await eventService.edit(event.id, {
                        edition,
                    });
                }).rejects.toThrowError(ConflictingEditionError);
            });

            test('Deve alterar a descrição do evento futuro com sucesso', async () => {
                const description = 'Nova descrição';
                const updatedEvent = await eventService.edit(event.id, {
                    description,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.description).toBe(description);
                expect(selectedEvent.description).toBe(description);
            });

            test('Deve alterar a data inicial e data final do evento futuro com sucesso', async () => {
                const startDate = createFutureDate(4);
                const endDate = createFutureDate(10);

                const updatedEvent = await eventService.edit(event.id, {
                    startDate,
                    endDate,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.startDate.getTime()).toBe(
                    startDate.getTime()
                );
                expect(updatedEvent.endDate.getTime()).toBe(endDate.getTime());
                expect(selectedEvent.startDate.getTime()).toBe(
                    startDate.getTime()
                );
                expect(selectedEvent.endDate.getTime()).toBe(endDate.getTime());
            });

            test('Deve falhar em alterar a data se ter ao menos uma atividade', async () => {
                const startDate = createFutureDate(3);
                const endDate = createFutureDate(7);

                const activityCategory = new ActivityCategory('HX', 'nananana');
                const room = new Room('4y8chsad8f', 30);
                const activity = createMockActivity(
                    event,
                    room,
                    [users[0]],
                    activityCategory
                );

                await roomRepository.save(room);
                await activityCategoryRepository.save(activityCategory);
                await activityRepository.save(activity);

                await expect(async () => {
                    await eventService.edit(event.id, {
                        startDate,
                        endDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a data final anterior à data inicial', async () => {
                const endDate = createFutureDate(3);
                const startDate = createFutureDate(10);

                await expect(async () => {
                    await eventService.edit(event.id, {
                        startDate,
                        endDate,
                    });
                }).rejects.toThrowError(EndDateBeforeStartDateError);
            });

            test('Deve alterar a área do evento futuro com sucesso', async () => {
                const area = 'ENGENHARIA ELÉTRICA';
                const updatedEvent = await eventService.edit(event.id, {
                    area,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.area).toBe(area);
                expect(selectedEvent.area).toBe(area);
            });

            test('Deve alterar a estado visível do evento futuro com sucesso', async () => {
                const statusVisible = true;
                const updatedEvent = await eventService.edit(event.id, {
                    statusVisible,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.statusVisible).toBe(statusVisible);
                expect(selectedEvent.statusVisible).toBe(statusVisible);
            });

            test('Deve alterar a estado ativo do evento futuro com sucesso', async () => {
                const statusActive = true;
                const updatedEvent = await eventService.edit(event.id, {
                    statusActive,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.statusActive).toBe(statusActive);
                expect(selectedEvent.statusActive).toBe(statusActive);
            });

            test('Deve alterar a lista de responsáveis com sucesso', async () => {
                const responsibleUsers = [users[0]];
                const updatedEvent = await eventService.edit(event.id, {
                    responsibleUsers,
                });
                const selectedEvent = await eventRepository.findOne(event.id, {
                    relations: ['responsibleUsers'],
                });

                expect(updatedEvent.responsibleUsers.length).toBe(1);
                expect(updatedEvent.responsibleUsers[0].id).toEqual(
                    responsibleUsers[0].id
                );

                expect(selectedEvent.responsibleUsers.length).toBe(1);
                expect(selectedEvent.responsibleUsers[0].id).toEqual(
                    responsibleUsers[0].id
                );
            });

            test('Deve falhar em alterar a lista de responsáveis para vazio', async () => {
                const responsibleUsers = [];

                await expect(async () => {
                    await eventService.edit(event.id, {
                        responsibleUsers,
                    });
                }).rejects.toThrowError(ResponsibleUsersUndefined);
            });

            test('Deve alterar a categoria com sucesso', async () => {
                const eventCategory = categories[1];
                const updatedEvent = await eventService.edit(event.id, {
                    eventCategory,
                });
                const selectedEvent = await eventRepository.findOne(event.id, {
                    relations: ['eventCategory'],
                });

                expect(updatedEvent.eventCategory.id).toEqual(eventCategory.id);
                expect(selectedEvent.eventCategory.id).toEqual(
                    eventCategory.id
                );
            });

            test('Deve alterar a data inicial de inscrição e data final de inscrição do evento futuro com sucesso', async () => {
                const registryStartDate = createFutureDate(4);
                const registryEndDate = createFutureDate(10);

                const updatedEvent = await eventService.edit(event.id, {
                    registryStartDate,
                    registryEndDate,
                });
                const selectedEvent = await eventRepository.findOne(event.id);

                expect(updatedEvent.registryStartDate.getTime()).toBe(
                    registryStartDate.getTime()
                );
                expect(updatedEvent.registryEndDate.getTime()).toBe(
                    registryEndDate.getTime()
                );
                expect(selectedEvent.registryStartDate.getTime()).toBe(
                    registryStartDate.getTime()
                );
                expect(selectedEvent.registryEndDate.getTime()).toBe(
                    registryEndDate.getTime()
                );
            });

            test('Deve falhar em alterar a data final de inscrição anterior à data inicial', async () => {
                const registryEndDate = createFutureDate(3);
                const registryStartDate = createFutureDate(10);

                await expect(async () => {
                    await eventService.edit(event.id, {
                        registryStartDate,
                        registryEndDate,
                    });
                }).rejects.toThrowError(EndDateBeforeStartDateRegistryError);
            });
        });

        describe('Evento ocorrendo agora', () => {
            afterAll(async () => {
                if (conflictingEvent && conflictingEvent.id) {
                    await eventRepository.delete(conflictingEvent.id);
                }
            });

            test('Não deve falhar ao passar o evento com os mesmos atributos', async () => {
                await expect(
                    eventService.edit(midEvent.id, midEvent)
                ).resolves.not.toThrow();
            });

            test('Deve alterar a edição do evento atual com sucesso', async () => {
                const edition = 8;
                const updatedEvent = await eventService.edit(midEvent.id, {
                    edition,
                });
                const selectedEvent = await eventRepository.findOne(midEvent.id);

                expect(updatedEvent.edition).toBe(edition);
                expect(selectedEvent.edition).toBe(edition);
            });

            test('Deve falhar em alterar para uma edição conflitante de um mesmo evento', async () => {
                conflictingEvent = createMockEvent(users, categories[0]);
                conflictingEvent.edition = 4;

                conflictingEvent = await eventRepository.save(conflictingEvent);

                const edition = 4;

                await expect(async () => {
                    await eventService.edit(midEvent.id, {
                        edition,
                    });
                }).rejects.toThrowError(ConflictingEditionError);
            });

            test('Deve alterar a descrição do evento atual com sucesso', async () => {
                const description = 'Nova descrição';
                const updatedEvent = await eventService.edit(midEvent.id, {
                    description,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id
                );

                expect(updatedEvent.description).toBe(description);
                expect(selectedEvent.description).toBe(description);
            });

            test('Deve falhar em alterar a data do evento atual', async () => {
                const startDate = createFutureDate(17);
                const endDate = createFutureDate(25);

                await expect(async () => {
                    await eventService.edit(midEvent.id, {
                        startDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);

                await expect(async () => {
                    await eventService.edit(midEvent.id, {
                        endDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve alterar a área do evento atual com sucesso', async () => {
                const area = 'ENGENHARIA ELÉTRICA';
                const updatedEvent = await eventService.edit(midEvent.id, {
                    area,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id
                );

                expect(updatedEvent.area).toBe(area);
                expect(selectedEvent.area).toBe(area);
            });

            test('Deve alterar o estado visível do evento atual com sucesso', async () => {
                const statusVisible = true;

                const updatedEvent = await eventService.edit(midEvent.id, {
                    statusVisible,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id
                );

                expect(updatedEvent.statusVisible).toBe(statusVisible);
                expect(selectedEvent.statusVisible).toBe(statusVisible);
            });

            test('Deve alterar o estado ativo do evento atual', async () => {
                const statusActive = true;

                const updatedEvent = await eventService.edit(midEvent.id, {
                    statusActive,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id
                );

                expect(updatedEvent.statusActive).toBe(statusActive);
                expect(selectedEvent.statusActive).toBe(statusActive);
            });

            test('Deve alterar a lista de responsáveis do evento atual com sucesso', async () => {
                const responsibleUsers = [users[0]];
                const updatedEvent = await eventService.edit(midEvent.id, {
                    responsibleUsers,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id,
                    {
                        relations: ['responsibleUsers'],
                    }
                );

                expect(updatedEvent.responsibleUsers[0].id).toEqual(
                    responsibleUsers[0].id
                );
                expect(selectedEvent.responsibleUsers[0].id).toEqual(
                    responsibleUsers[0].id
                );
            });

            test('Deve falhar em alterar a categoria', async () => {
                const eventCategory = categories[1];
                await expect(async () => {
                    await eventService.edit(midEvent.id, {
                        eventCategory,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve alterar a data inicial de inscrição e data final de inscrição do evento atual com sucesso', async () => {
                const registryStartDate = createFutureDate(4);
                const registryEndDate = createFutureDate(10);

                const updatedEvent = await eventService.edit(midEvent.id, {
                    registryStartDate,
                    registryEndDate,
                });
                const selectedEvent = await eventRepository.findOne(
                    midEvent.id
                );

                expect(updatedEvent.registryStartDate.getTime()).toBe(
                    registryStartDate.getTime()
                );
                expect(updatedEvent.registryEndDate.getTime()).toBe(
                    registryEndDate.getTime()
                );
                expect(selectedEvent.registryStartDate.getTime()).toBe(
                    registryStartDate.getTime()
                );
                expect(selectedEvent.registryEndDate.getTime()).toBe(
                    registryEndDate.getTime()
                );
            });
        });

        describe('Evento passado', () => {
            test('Não deve falhar ao passar o evento com os mesmos atributos', async () => {
                await expect(
                    eventService.edit(oldEvent.id, oldEvent)
                ).resolves.not.toThrow();
            });

            test('Deve falhar em alterar a edição do evento passado', async () => {
                const edition = 8;
                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        edition,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a descrição do evento passado', async () => {
                const description = 'Nova descrição';
                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        description,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a data do evento passado', async () => {
                const startDate = createFutureDate(10);
                const endDate = createFutureDate(3);

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        startDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        endDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve alterar a área do evento passado com sucesso', async () => {
                const area = 'ENGENHARIA ELÉTRICA';
                const updatedEvent = await eventService.edit(oldEvent.id, {
                    area,
                });
                const selectedEvent = await eventRepository.findOne(
                    oldEvent.id
                );

                expect(updatedEvent.area).toBe(area);
                expect(selectedEvent.area).toBe(area);
            });

            test('Deve falhar em alterar o estado visível do evento passado', async () => {
                const statusVisible = true;

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        statusVisible,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar o estado ativo do evento passado', async () => {
                const statusActive = true;

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        statusActive,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a lista de responsáveis do evento passado', async () => {
                const responsibleUsers = [users[0]];

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        responsibleUsers,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a categoria do evento passado', async () => {
                const eventCategory = categories[1];
                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        eventCategory,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });

            test('Deve falhar em alterar a data inicial de inscrição e data final de inscrição do evento passado', async () => {
                const registryStartDate = createFutureDate(7);
                const registryEndDate = createFutureDate(22);

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        registryStartDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);

                await expect(async () => {
                    await eventService.edit(oldEvent.id, {
                        registryEndDate,
                    });
                }).rejects.toThrowError(EventChangeRestriction);
            });
        });
    });

    describe('Exclusão', () => {
        let eventId: number;
        let event: Event;

        beforeEach(async () => {
            try {
                event = await eventRepository.save(
                    createMockEvent(users, categories[0])
                );
                eventId = event.id;
            } catch (err) {
                return;
            }
        });

        afterEach(async () => {
            await eventRepository.delete(eventId);
        });

        test('Deve falhar em excluir o evento que possui atividades', async () => {
            const user = createMockUser(
                'email.seila@gmail.com',
                '72950562035',
                '18988085032'
            );
            user.confirmed = true;
            await userRepository.save(user);
            const activityCategory = new ActivityCategory('OD', '123123');
            await activityCategoryRepository.save(activityCategory);
            const room = new Room('aa', 30);
            await roomService.create(room);
            const activity = createMockActivity(
                event,
                room,
                [user],
                activityCategory
            );
            await activityService.create(activity);
            await expect(async () => {
                await eventService.delete(eventId);
            })
                .rejects.toThrow(EventDeleteRestriction)
                .finally(async () => {
                    await activityService.delete(activity.id);
                    await roomService.delete(room.id);
                    await activityCategoryRepository.delete(activityCategory.id);
                    await userRepository.delete(user.id);
                });
        });

        test('Deve excluir o evento cadastrado com sucesso', async () => {
            const deleteCount = await eventService.delete(eventId);
            expect(deleteCount).toBe(1);
        });

        test('Deve falhar em excluir um evento já ocorrido', async () => {
            await eventRepository.save({
                id: eventId,
                startDate: createFutureDate(-10),
                endDate: createFutureDate(-3),
            });
            await expect(async () => {
                await eventService.delete(eventId);
            }).rejects.toThrowError(EventDeleteRestriction);
        });

        test('Deve falhar em excluir um evento ativo', async () => {
            await eventRepository.save({
                id: eventId,
                statusActive: true,
            });
            await expect(async () => {
                await eventService.delete(eventId);
            }).rejects.toThrowError(EventDeleteRestriction);
        });

        test('Deve retornar zero alterações ao excluir um evento inexistente', async () => {
            const deleteCount = await eventService.delete(-20);
            expect(deleteCount).toBe(0);
        });
    });
});