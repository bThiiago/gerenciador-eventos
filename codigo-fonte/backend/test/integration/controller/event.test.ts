import { Application } from 'express';
import supertest from 'supertest';
import { DeepPartial, Repository } from 'typeorm';
import { dataSource } from '@database/connection';

import { Server } from 'src/server';

import { User } from '@models/User';
import { UserLevel } from '@models/UserLevel';
import { Event } from '@models/Event';
import { Activity } from '@models/Activity';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { ActivityCategory } from '@models/ActivityCategory';

import { createMockUser } from 'test/utils/createMockUser';
import { createMockEventCategory } from 'test/utils/createMockEventCategory';
import { createMockEvent } from 'test/utils/createMockEvent';
import { createMockActivity } from 'test/utils/createMockActivity';
import { cloneObject } from 'test/utils/cloneObject';
import { createFutureDate } from 'test/utils/createFutureDate';
import { ActivityRegistry } from '@models/ActivityRegistry';

describe('Controle do evento - /sge', () => {
    const baseUrl = '/api/v1/sge';

    let app: Application;

    let commonUser: User, adminUser: User, eventOrganizerUser: User;

    let room: Room;
    let eventCategory: EventCategory;
    let event: Event;
    let activityCategory: ActivityCategory;

    let commonUserToken: string,
        adminUserToken: string,
        eventOrganizerUserToken: string;

    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let eventCategoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let activityRepository: Repository<Activity>;
    let activityRegistryRepository: Repository<ActivityRegistry>;
    let activityCategoryRepository: Repository<ActivityCategory>;

    beforeAll(async () => {
        app = Server().getApp();
        userRepository = dataSource.getRepository(User);
        eventCategoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        activityRepository = dataSource.getRepository(Activity);
        roomRepository = dataSource.getRepository(Room);
        activityRegistryRepository = dataSource.getRepository(ActivityRegistry);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        commonUser = createMockUser(
            'userCommonEventTestController@gmail.com',
            '48163430834',
            '30999291111'
        );
        eventOrganizerUser = createMockUser(
            'userEventEventTestController@gmail.com',
            '71286494095',
            '66857498294'
        );
        adminUser = createMockUser(
            'userAdminEventTestController@gmail.com',
            '57868324228',
            '15988291111'
        );
        adminUser.level = UserLevel.ADMIN;

        room = new Room('teste controle 23232', 30);
        eventCategory = createMockEventCategory(
            'eventos legais ifsp teste controle',
            'elitc438'
        );
        event = createMockEvent([eventOrganizerUser], eventCategory);

        activityCategory = new ActivityCategory('JF', 'adsnjasd');

        const password = commonUser.password;

        await userRepository.save(commonUser);
        await userRepository.save(eventOrganizerUser);
        await userRepository.save(adminUser);
        await roomRepository.save(room);
        await eventCategoryRepository.save(eventCategory);
        await eventRepository.save(event);
        await activityCategoryRepository.save(activityCategory);

        let res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: eventOrganizerUser.email, password });
        eventOrganizerUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: adminUser.email, password });
        adminUserToken = `Bearer ${res.body.token}`;
    });

    afterAll(async () => {
        await activityCategoryRepository.delete(activityCategory.id);
        await eventRepository.delete(event.id);
        await eventCategoryRepository.delete(eventCategory.id);
        await roomRepository.delete(room.id);
        await userRepository.delete(commonUser.id);
        await userRepository.delete(eventOrganizerUser.id);
        await userRepository.delete(adminUser.id);
    });

    describe('GET', () => {
        let eventCategory2: EventCategory;
        const visibleEvents: Event[] = [];
        const invisibleEvents: Event[] = [];
        const oldEvents: Event[] = [];

        const expectedCommonUserEventBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            editionDisplay: expect.any(Number),
            display: expect.any(Number),
            description: expect.any(String),
            startDate: expect.any(String),
            endDate: expect.any(String),
            area: expect.any(String),
            statusActive: expect.any(Boolean),
            eventCategory: expect.objectContaining({
                id: expect.any(Number),
                category: expect.any(String),
                url_src: expect.any(String),
            }),
            registryStartDate: expect.any(String),
            registryEndDate: expect.any(String),
        };

        const expectedAdminEventBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            editionDisplay: expect.any(Number),
            display: expect.any(Number),
            description: expect.any(String),
            startDate: expect.any(String),
            endDate: expect.any(String),
            area: expect.any(String),
            statusActive: expect.any(Boolean),
            statusVisible: expect.any(Boolean),
            readyForCertificate: expect.any(Boolean),
            registryStartDate: expect.any(String),
            registryEndDate: expect.any(String),
            canExclude: expect.any(Boolean),
            canEditTime: expect.any(Boolean),

            eventCategory: expect.objectContaining({
                id: expect.any(Number),
                category: expect.any(String),
                url_src: expect.any(String),
            }),

            responsibleUsers: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                }),
            ]),
        };

        beforeAll(async () => {
            eventCategory2 = createMockEventCategory(
                'eventos legais ifsp teste controle',
                'elitc2384'
            );

            visibleEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory)
            );
            visibleEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory2)
            );
            visibleEvents[0].edition = 1;
            visibleEvents[1].edition = 1;

            invisibleEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory)
            );
            invisibleEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory2)
            );
            invisibleEvents[0].edition = 3;
            invisibleEvents[1].edition = 4;

            oldEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory)
            );
            oldEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory)
            );
            oldEvents.push(
                createMockEvent([eventOrganizerUser], eventCategory2)
            );
            oldEvents[0].edition = 5;
            oldEvents[1].edition = 6;
            oldEvents[2].edition = 7;

            await eventCategoryRepository.save(eventCategory2);

            await eventRepository.save(visibleEvents[0]);
            await eventRepository.save(visibleEvents[1]);
            visibleEvents[0].statusVisible = true;
            visibleEvents[1].statusVisible = true;
            await eventRepository.save(visibleEvents[0]);
            await eventRepository.save(visibleEvents[1]);

            await eventRepository.save(invisibleEvents[0]);
            await eventRepository.save(invisibleEvents[1]);

            oldEvents[0].startDate = createFutureDate(-20);
            oldEvents[0].endDate = createFutureDate(-10);
            oldEvents[1].startDate = createFutureDate(-25);
            oldEvents[1].endDate = createFutureDate(-12);
            oldEvents[2].startDate = createFutureDate(-30);
            oldEvents[2].endDate = createFutureDate(-26);

            await eventRepository.save(oldEvents[0]);
            await eventRepository.save(oldEvents[1]);
            await eventRepository.save(oldEvents[2]);
        });

        afterAll(async () => {
            await eventRepository.delete(visibleEvents[0].id);
            await eventRepository.delete(visibleEvents[1].id);
            await eventRepository.delete(invisibleEvents[0].id);
            await eventRepository.delete(invisibleEvents[1].id);
            await eventRepository.delete(oldEvents[0].id);
            await eventRepository.delete(oldEvents[1].id);
            await eventRepository.delete(oldEvents[2].id);
            await eventCategoryRepository.delete(eventCategory2.id);
        });

        describe('/', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}`);

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos dos eventos sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}`);

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento se não passar a query all', async () => {
                const response = await supertest(app).get(`${baseUrl}`).set({
                    authorization: eventOrganizerUserToken,
                });

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento com query all', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?all=true`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });
                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?all=true`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar apenas os dois eventos visíveis como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(2);
            });

            test('Deve consultar todos os eventos como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}?all=true`)
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(5);
            });

            test('Deve consultar três eventos por página, como administrador', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=1&limit=3`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(3);
                expect(parseInt(response.headers['x-total-count'])).toBe(5);

                response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=2&limit=3`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(5);

                response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=3&limit=3`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(5);
            });

            test('Deve consultar um evento por página, como usuário comum', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=1&limit=1`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=2&limit=1`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(`${baseUrl}?all=true&page=3&limit=1`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${visibleEvents[0].id}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(visibleEvents[0].id);
            });

            test('Deve consultar os atributos corretos do evento sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${visibleEvents[0].id}`
                );

                const body = response.body;

                expect(body).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos do evento como organizador do evento', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${visibleEvents[0].id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os atributos corretos do evento como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${visibleEvents[0].id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar o evento visível como usuário comum com sucesso', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${visibleEvents[0].id}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(visibleEvents[0].id);
            });

            test('Deve falhar em consultar o evento invisível como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${invisibleEvents[0].id}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve consultar o evento invisível como organizador do próprio evento com sucesso', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${invisibleEvents[0].id}`)
                    .set({ authorization: eventOrganizerUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(invisibleEvents[0].id);
            });

            test('Deve consultar o evento invisível como administrador com sucesso', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${invisibleEvents[0].id}`)
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(invisibleEvents[0].id);
            });

            test('Deve consultar um evento anterior como usuário comum com sucesso', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${oldEvents[0].id}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(oldEvents[0].id);
            });

            test('Deve falhar em consultar um evento inexistente como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${oldEvents[0].id + 52532}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve falhar em consultar um evento inexistente como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${oldEvents[0].id + 52532}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });

        describe('/:id/activities', () => {
            let eventWithActivities: Event;
            const activities: Activity[] = [];
            const registries: ActivityRegistry[] = [];

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

                    totalRegistry: expect.any(Number),
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

                    totalRegistry: expect.any(Number),
                };

                eventWithActivities = createMockEvent(
                    [eventOrganizerUser],
                    eventCategory
                );
                activities.push(
                    createMockActivity(
                        eventWithActivities,
                        room,
                        [eventOrganizerUser],
                        activityCategory
                    )
                );
                activities.push(
                    createMockActivity(
                        eventWithActivities,
                        room,
                        [eventOrganizerUser],
                        activityCategory
                    )
                );
                activities.push(
                    createMockActivity(
                        eventWithActivities,
                        room,
                        [eventOrganizerUser],
                        activityCategory
                    )
                );

                activities[0].teachingUsers = [adminUser];
                activities[1].teachingUsers = [adminUser];
                activities[2].teachingUsers = [adminUser];

                await eventRepository.save(eventWithActivities);
                eventWithActivities.statusVisible = true;
                await eventRepository.save(eventWithActivities);
                await activityRepository.save(activities[0]);
                await activityRepository.save(activities[1]);
                await activityRepository.save(activities[2]);

                registries.push(
                    await activityRegistryRepository.save(
                        new ActivityRegistry(activities[0], commonUser)
                    )
                );
                registries.push(
                    await activityRegistryRepository.save(
                        new ActivityRegistry(activities[0], adminUser)
                    )
                );
                registries.push(
                    await activityRegistryRepository.save(
                        new ActivityRegistry(activities[1], commonUser)
                    )
                );
            });

            afterAll(async () => {
                await activityRegistryRepository.delete(registries[0].id);
                await activityRegistryRepository.delete(registries[1].id);
                await activityRegistryRepository.delete(registries[2].id);

                await activityRepository.delete(activities[0].id);
                await activityRepository.delete(activities[1].id);
                await activityRepository.delete(activities[2].id);
                await eventRepository.delete(eventWithActivities.id);
            });

            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos das atividades como usuário comum', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities`
                );

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserActivityBody);
            });

            test('Deve consultar os atributos corretos das atividades como responsável de atividade', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities`
                );

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserActivityBody);
            });

            test('Deve consultar os atributos corretos das atividades como organizador do evento', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventWithActivities.id}/activities`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminActivityBody);
            });

            test('Deve consultar os atributos corretos das atividades como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventWithActivities.id}/activities`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminActivityBody);
            });

            test('Deve consultar duas matrículas na atividade 1', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventWithActivities.id}/activities`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[0].totalRegistry).toEqual(2);
            });

            test('Deve consultar uma matrícula na atividade 2', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventWithActivities.id}/activities`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[1].totalRegistry).toEqual(1);
            });

            test('Deve consultar nenhuma matrícula na atividade 3', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventWithActivities.id}/activities`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[2].totalRegistry).toEqual(0);
            });

            test('Deve consultar duas atividades do evento por página', async () => {
                let response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities?page=1&limit=2`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities?page=2&limit=2`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id}/activities?page=3&limit=2`
                );

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });

            test('Deve consultar nenhuma atividade de um evento inexistente', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${eventWithActivities.id + 4324}/activities`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.length).toBe(0);
            });
        });

        describe('/:url_src/:id', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${visibleEvents[0].id}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(visibleEvents[0].id);
            });

            test('Deve consultar os atributos corretos do evento sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${visibleEvents[0].id}`
                );

                const body = response.body;

                expect(body).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos do evento como organizador do evento', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${visibleEvents[0].id}?all=true`
                    )
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os atributos corretos do evento como administrador', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${visibleEvents[0].id}?all=true`
                    )
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar o evento visível como usuário comum com sucesso', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${visibleEvents[0].id}`
                    )
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(visibleEvents[0].id);
            });

            test('Deve falhar em consultar o evento invisível como usuário comum', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${invisibleEvents[0].eventCategory.url_src}/${invisibleEvents[0].id}`
                    )
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve consultar o evento invisível como organizador do próprio evento com sucesso', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${invisibleEvents[0].eventCategory.url_src}/${invisibleEvents[0].id}?all=true`
                    )
                    .set({ authorization: eventOrganizerUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(invisibleEvents[0].id);
            });

            test('Deve consultar o evento invisível como administrador com sucesso', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${invisibleEvents[0].eventCategory.url_src}/${invisibleEvents[0].id}?all=true`
                    )
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(invisibleEvents[0].id);
            });

            test('Deve consultar um evento anterior como usuário comum com sucesso', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${oldEvents[0].eventCategory.url_src}/${oldEvents[0].id}`
                    )
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body.id).toBe(oldEvents[0].id);
            });

            test('Deve falhar em consultar um evento inexistente como usuário comum', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${
                            oldEvents[0].id + 5435
                        }`
                    )
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve falhar em consultar um evento inexistente como administrador', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/${visibleEvents[0].eventCategory.url_src}/${
                            oldEvents[0].id + 5435
                        }?all=true`
                    )
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve falhar em consultar um evento com categoria inexistente como usuário comum', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/categoria_inexistente/${visibleEvents[0].id}?all=true`
                    )
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });

            test('Deve falhar em consultar um evento com categoria inexistente como administrador', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/categoria_inexistente/${visibleEvents[0].id}`
                    )
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });

        describe('/old/category/:url_src', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/old/category/${eventCategory.url_src}`
                );

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos dos eventos sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/old/category/${eventCategory.url_src}`
                );

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento se não passar a query all', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old/category/${eventCategory.url_src}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento com query all', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true`
                    )
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como administrador', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true`
                    )
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os dois eventos antigos da categoria 1 como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old/category/${eventCategory.url_src}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(2);
            });

            test('Deve consultar os dois eventos antigos da categoria 1 como admin', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true`
                    )
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(2);
            });

            test('Deve consultar um evento antigo da categoria 2 como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old/category/${eventCategory2.url_src}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(1);
            });

            test('Deve consultar um evento antigo da categoria 2 como admin', async () => {
                const response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory2.url_src}?all=true`
                    )
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(1);
            });

            test('Deve consultar um evento por página, como administrador', async () => {
                let response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true&page=1&limit=1`
                    )
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true&page=2&limit=1`
                    )
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?all=true&page=3&limit=1`
                    )
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });

            test('Deve consultar um evento por página, como usuário comum', async () => {
                let response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?page=1&limit=1`
                    )
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?page=2&limit=1`
                    )
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);

                response = await supertest(app)
                    .get(
                        `${baseUrl}/old/category/${eventCategory.url_src}?page=3&limit=1`
                    )
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(2);
            });
        });

        describe('/old', () => {
            test('Deve conseguir acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}/old`);

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos dos eventos sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}/old`);

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento se não passar a query all', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedCommonUserEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como organizador do evento com query all', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old?all=true`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os atributos corretos dos eventos como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old?all=true`)
                    .set({
                        authorization: adminUserToken,
                    });

                const body = response.body;

                expect(body[0]).toEqual(expectedAdminEventBody);
            });

            test('Deve consultar os três eventos antigos como usuário comum', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(3);
            });

            test('Deve consultar os três eventos antigos como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/old?all=true`)
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBe(3);
            });

            test('Deve consultar dois eventos por página, como administrador', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}/old?all=true&page=1&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/old?all=true&page=2&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/old?all=true&page=3&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });

            test('Deve consultar dois eventos por página, como usuário comum', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}/old?page=1&limit=2`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/old?page=2&limit=2`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/old?page=3&limit=2`)
                    .set({ authorization: commonUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });
        });
    });

    describe('POST', () => {
        let event: Event;
        let eventData: DeepPartial<Event>;

        beforeAll(async () => {
            event = createMockEvent([eventOrganizerUser], eventCategory);
            event.edition = 35;
            eventData = {
                edition: event.edition,
                description: event.description,
                area: event.area,
                eventCategory: { id: event.eventCategory.id },
                startDate: event.startDate,
                endDate: event.endDate,
                responsibleUsers: [{ id: event.responsibleUsers[0].id }],
                registryStartDate: event.registryStartDate,
                registryEndDate: event.registryEndDate,
                display : event.display,
                editionDisplay : event.editionDisplay,
            };
        });

        describe('/', () => {
            test('Deve submeter e cadastrar um evento com sucesso', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;

                expect(status).toBe(201);

                const body = response.body;

                event.endDate.setHours(23, 59, 59, 999);
                event.registryEndDate.setHours(23, 59, 59, 999);
                expect(body).toEqual({
                    id: expect.any(Number),
                    statusVisible: false,
                    statusActive: false,
                    edition: eventData.edition,
                    description: eventData.description,
                    area: eventData.area,
                    eventCategory: expect.objectContaining({
                        id: eventData.eventCategory.id,
                    }),
                    startDate: event.startDate.toISOString(),
                    endDate: event.endDate.toISOString(),
                    responsibleUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: eventData.responsibleUsers[0].id,
                        }),
                    ]),
                    registryStartDate: event.registryStartDate.toISOString(),
                    registryEndDate: event.registryEndDate.toISOString(),
                    display : eventData.display,
                    editionDisplay : eventData.editionDisplay,
                });

                await eventRepository.delete(body.id);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em submeter um evento sem edição', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.edition;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"edition"');
            });

            test('Deve falhar em submeter um evento sem descrição', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.description;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter um evento com descrição vazia', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.description = '';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter um evento com descrição com mais de 5000 caracteres', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.description = 'a'.repeat(5001);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter um evento sem data inicial', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.startDate;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"startDate"');
            });

            test('Deve falhar em submeter um evento sem data final', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.endDate;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"endDate"');
            });

            test('Deve falhar em submeter um evento com data final anterior a inicial', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.startDate = createFutureDate(5);
                wrongEventData.endDate = createFutureDate(3);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento sem área', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.area;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"area"');
            });

            test('Deve falhar em submeter um evento sem usuários responsáveis', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.responsibleUsers;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"responsibleUsers"');
            });

            test('Deve falhar em submeter um evento com usuários responsáveis vazio', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.responsibleUsers = [];

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento com usuários responsáveis inexistentes', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.responsibleUsers = [
                    { id: commonUser.id + 534534 },
                ];

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento sem categoria', async () => {
                const wrongEventData = cloneObject(eventData);
                delete wrongEventData.eventCategory;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"eventCategory"');
            });

            test('Deve falhar em submeter um evento com categoria inexistente', async () => {
                const wrongEventData = cloneObject(eventData);
                wrongEventData.eventCategory = { id: eventCategory.id + 5435 };

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(wrongEventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });
        });
    });

    describe('PUT', () => {
        let newEventData: DeepPartial<Event>;
        let newEventCategory: EventCategory;

        beforeAll(async () => {
            newEventCategory = createMockEventCategory(
                'aaa categoria sei la bnsdfjsnf',
                'ctfggf123'
            );
            newEventCategory = await eventCategoryRepository.save(
                newEventCategory
            );
            newEventData = {
                edition: 20,
                description: 'A semana é bem legal :)',
                area: 'ENGENHARIA ELETRICA',
                eventCategory: { id: newEventCategory.id },
                startDate: createFutureDate(30),
                endDate: createFutureDate(50),
                responsibleUsers: [
                    { id: eventOrganizerUser.id },
                    { id: commonUser.id },
                ],
                registryStartDate: createFutureDate(20),
                registryEndDate: createFutureDate(40),
                display: 1,
                editionDisplay: 1,
            };
        });

        afterAll(async () => {
            await eventRepository.save({
                id: event.id,
                eventCategory: eventCategory,
            });
            await eventCategoryRepository.delete(newEventCategory.id);
        });

        describe('/:eventId', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const eventData = {
                    edition: event.edition,
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve conseguir acessar a rota como organizador do evento', async () => {
                const eventData = {
                    edition: event.edition,
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em acessar a rota sem ser organizador do evento', async () => {
                const eventData = {
                    edition: event.edition,
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em acessar a rota se o evento que organiza não é o mesmo', async () => {
                let tempNewEvent = createMockEvent([commonUser], eventCategory);
                tempNewEvent = await eventRepository.save(tempNewEvent);

                const eventData = {
                    edition: event.edition,
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: commonUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(403);

                await eventRepository.delete(tempNewEvent.id);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const eventData = {
                    edition: event.edition,
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .send(eventData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve alterar os atributos do evento com sucesso', async () => {
                const eventData = cloneObject(newEventData);
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                const modifiedEvent = await eventRepository.findOne(event.id, {
                    relations: ['eventCategory', 'responsibleUsers'],
                });

                const updatedEndDate = newEventData.endDate as unknown as Date;
                updatedEndDate.setHours(23, 59, 59, 999);
                const updatedRegistryEndDate =
                    newEventData.registryEndDate as unknown as Date;
                updatedRegistryEndDate.setHours(23, 59, 59, 999);

                expect(status).toBe(200);
                expect(modifiedEvent).toEqual({
                    id: event.id,
                    edition: newEventData.edition,
                    description: newEventData.description,
                    area: newEventData.area,
                    eventCategory: expect.objectContaining({
                        id: newEventData.eventCategory.id,
                    }),
                    startDate: newEventData.startDate,
                    endDate: updatedEndDate,
                    responsibleUsers: expect.arrayContaining([
                        expect.objectContaining({
                            id: newEventData.responsibleUsers[0].id,
                        }),
                        expect.objectContaining({
                            id: newEventData.responsibleUsers[1].id,
                        }),
                    ]),
                    statusActive: false,
                    statusVisible: false,
                    registryStartDate: newEventData.registryStartDate,
                    registryEndDate: updatedRegistryEndDate,
                    display: newEventData.display,
                    editionDisplay: newEventData.editionDisplay,
                });
            });

            test('Deve remover um usuário responsável com sucesso', async () => {
                const eventData = {
                    responsibleUsers: [{ id: eventOrganizerUser.id }],
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                const modifiedEvent = await eventRepository.findOne(event.id, {
                    relations: ['responsibleUsers'],
                });

                expect(status).toBe(200);
                expect(modifiedEvent.responsibleUsers.length).toBe(1);
                expect(modifiedEvent.responsibleUsers[0].id).toBe(
                    eventOrganizerUser.id
                );
            });

            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send();

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Um responsável pelo evento não deve conseguir alterar a lista de responsáveis', async () => {
                const eventData = {
                    responsibleUsers: [
                        { id: eventOrganizerUser.id },
                        { id: commonUser.id },
                    ],
                };
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    })
                    .send(eventData);

                const status = response.statusCode;
                const modifiedEvent = await eventRepository.findOne(event.id, {
                    relations: ['responsibleUsers'],
                });

                expect(status).toBe(200);
                expect(modifiedEvent.responsibleUsers.length).toBe(1);
                expect(modifiedEvent.responsibleUsers[0].id).toBe(
                    eventOrganizerUser.id
                );
            });

            test('Deve falhar em submeter um evento com edição null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        edition: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"edition"');
            });

            test('Deve falhar em submeter um evento com descrição null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
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

            test('Deve falhar em submeter um evento com descrição maior que 5000 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        description: 'a'.repeat(5001),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"description"');
            });

            test('Deve falhar em submeter um evento com data de início null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        startDate: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"startDate"');
            });

            test('Deve falhar em submeter um evento com data de início maior que a final', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        startDate: createFutureDate(200),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento com data final null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        endDate: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"endDate"');
            });

            test('Deve falhar em submeter um evento com data final menor que a inicial', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        endDate: createFutureDate(1),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento com area null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        area: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"area"');
            });

            test('Deve falhar em submeter um evento com responsáveis null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        responsibleUsers: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"responsibleUsers"');
            });

            test('Deve falhar em submeter um evento com responsáveis vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        responsibleUsers: [],
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"responsibleUsers"');
            });

            test('Deve falhar em submeter um evento com responsável inexistente', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        responsibleUsers: [{ id: commonUser.id + 100000 }],
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um evento com categoria null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        eventCategory: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"eventCategory"');
            });

            test('Deve falhar em submeter um evento com categoria inexistente', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${event.id}`)
                    .set({
                        authorization: adminUserToken,
                    })
                    .send({
                        eventCategory: { id: eventCategory.id + 100000 },
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
            });
        });
    });

    describe('DELETE', () => {
        let eventToBeDeleted: Event;
        beforeEach(async () => {
            eventToBeDeleted = await eventRepository.save(
                createMockEvent([eventOrganizerUser], eventCategory)
            );
        });

        afterEach(async () => {
            await eventRepository.delete(eventToBeDeleted.id);
        });

        describe('/:id', () => {
            test('Deve conseguir excluir o evento como administrador', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventToBeDeleted.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(204);
            });

            test('Deve falhar em excluir o evento como organizador do evento', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventToBeDeleted.id}`)
                    .set({
                        authorization: eventOrganizerUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(403);
            });

            test('Deve falhar em excluir o evento como usuário comum', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventToBeDeleted.id}`)
                    .set({
                        authorization: commonUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(403);
            });

            test('Deve falhar em excluir o evento sem autenticação', async () => {
                const response = await supertest(app).delete(
                    `${baseUrl}/${eventToBeDeleted.id}`
                );

                const status = response.statusCode;

                expect(status).toBe(400);
            });

            test('Deve falhar em excluir um evento antigo', async () => {
                await eventRepository.save({
                    id: eventToBeDeleted.id,
                    startDate: createFutureDate(-20),
                    endDate: createFutureDate(-10),
                });

                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventToBeDeleted.id}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(400);
            });

            test('Deve falhar em excluir um evento inexistente', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventToBeDeleted.id + 1000}`)
                    .set({
                        authorization: adminUserToken,
                    });

                const status = response.statusCode;

                expect(status).toBe(404);
            });
        });
    });
});