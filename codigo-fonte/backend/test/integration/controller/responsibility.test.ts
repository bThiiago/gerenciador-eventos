import { Application } from 'express';
import supertest from 'supertest';
import { Repository } from 'typeorm';
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
import { createFutureDate } from 'test/utils/createFutureDate';

describe('Controle da responsibilidade - /user/responsibility', () => {
    const baseUrl = '/api/v1/user/responsibility';

    let app: Application;

    let commonUser: User,
        adminUser: User,
        eventOrganizerUser: User,
        activityResponsibleUser: User;

    let room: Room;
    let eventCategory: EventCategory;
    let event: Event;
    let activity: Activity;
    let activityCategory: ActivityCategory;

    let commonUserToken: string,
        adminUserToken: string,
        eventOrganizerUserToken: string,
        activityResponsibleUserToken: string;

    let userRepository: Repository<User>;
    let roomRepository: Repository<Room>;
    let eventCategoryRepository: Repository<EventCategory>;
    let eventRepository: Repository<Event>;
    let activityCategoryRepository: Repository<ActivityCategory>;
    let activityRepository: Repository<Activity>;

    beforeAll(async () => {
        app = Server().getApp();
        userRepository = dataSource.getRepository(User);
        eventCategoryRepository = dataSource.getRepository(EventCategory);
        eventRepository = dataSource.getRepository(Event);
        activityRepository = dataSource.getRepository(Activity);
        roomRepository = dataSource.getRepository(Room);
        activityCategoryRepository = dataSource.getRepository(ActivityCategory);

        commonUser = createMockUser(
            'userCommonTestController@gmail.com',
            '48163430834',
            '30999291111'
        );
        activityResponsibleUser = createMockUser(
            'userActivityTestController@gmail.com',
            '53317621079',
            '88473819572'
        );
        eventOrganizerUser = createMockUser(
            'userEventTestController@gmail.com',
            '71286494095',
            '66857498294'
        );
        adminUser = createMockUser(
            'userAdminTestController@gmail.com',
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
        activityCategory = new ActivityCategory('IR', '83912ansdna');
        activity = createMockActivity(event, room, [activityResponsibleUser], activityCategory);

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

        let res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: commonUser.email, password });
        commonUserToken = `Bearer ${res.body.token}`;

        res = await supertest(app)
            .post('/api/v1/sessions')
            .send({ email: activityResponsibleUser.email, password });
        activityResponsibleUserToken = `Bearer ${res.body.token}`;

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
        let userWithResponsibilities: User;
        let userWithResponsibilitiesToken: string;
        const events : Event[] = [];
        const activities : Activity[] = [];

        const expectedActivityBody = {
            id: expect.any(Number),
            title: expect.any(String),
            description: expect.any(String),
            vacancy: expect.any(Number),
            workloadInMinutes: expect.any(Number),
            schedules: expect.any(Array),
            teachingUsers: expect.any(Array),
            readyForCertificateEmission: expect.any(Boolean),
        };
        const expectedEventBody = {
            id: expect.any(Number),
            edition: expect.any(Number),
            startDate: expect.any(String),
            endDate: expect.any(String),
            area: expect.any(String),
            statusVisible: expect.any(Boolean),
            statusActive: expect.any(Boolean),
            readyForCertificate: expect.any(Boolean),
            display: expect.any(Number),
            editionDisplay: expect.any(Number),
        };
        const expectedAllResponsibilityBody = {
            activities: expect.arrayContaining([
                expect.objectContaining(expectedActivityBody),
            ]),
            events: expect.arrayContaining([
                expect.objectContaining(expectedEventBody),
            ]),
        };

        beforeAll(async () => {
            userWithResponsibilities = createMockUser(
                'userResponsibilityTesta123@gmail.com',
                '49418926075',
                '48328743284'
            );
            const password = userWithResponsibilities.password;
            
            await userRepository.save(userWithResponsibilities);

            const res = await supertest(app)
                .post('/api/v1/sessions')
                .send({ email: userWithResponsibilities.email, password });
            userWithResponsibilitiesToken = `Bearer ${res.body.token}`;

            events.push(createMockEvent([userWithResponsibilities], eventCategory));
            events.push(createMockEvent([userWithResponsibilities], eventCategory));
            events.push(createMockEvent([userWithResponsibilities], eventCategory));
            events.push(createMockEvent([userWithResponsibilities], eventCategory));
            events[3].startDate = createFutureDate(-20);
            events[3].endDate = createFutureDate(-10);

            await eventRepository.save(events[0]);
            await eventRepository.save(events[1]);
            await eventRepository.save(events[2]);
            await eventRepository.save(events[3]);

            activities.push(await activityRepository.save(createMockActivity(events[0], room, [userWithResponsibilities], activityCategory)));
            activities.push(await activityRepository.save(createMockActivity(events[3], room, [userWithResponsibilities], activityCategory)));
            activities.push(await activityRepository.save(createMockActivity(events[3], room, [userWithResponsibilities], activityCategory)));
        });

        afterAll(async () => {
            await activityRepository.delete(activities[0].id);
            await activityRepository.delete(activities[1].id);
            await activityRepository.delete(activities[2].id);
            await eventRepository.delete(events[0].id);
            await eventRepository.delete(events[1].id);
            await eventRepository.delete(events[2].id);
            await eventRepository.delete(events[3].id);
            await userRepository.delete(userWithResponsibilities.id);
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.activities).toBeDefined();
                expect(body.events).toBeDefined();
            });

            test('Deve conseguir acessar a rota como o próprio usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.activities).toBeDefined();
                expect(body.events).toBeDefined();
            });

            test('Deve falhar em acessar a rota como outro usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(403);
                expect(body.activities).not.toBeDefined();
                expect(body.events).not.toBeDefined();
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}/${userWithResponsibilities.id}`);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(400);
                expect(body.activities).not.toBeDefined();
                expect(body.events).not.toBeDefined();
            });

            test('Deve consultar os atributos corretos das atividades e eventos', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toEqual(expectedAllResponsibilityBody);
            });

            test('Deve consultar do usuário com responsabilidades os três eventos e uma atividade', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.events.length).toBe(3);
                expect(body.activities.length).toBe(1);
            });

            test('Deve consultar do usuário com responsabilidades um evento e duas atividade passadas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}?old=true`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.events.length).toBe(1);
                expect(body.activities.length).toBe(2);
            });

            test('Deve consultar do usuário organizador de um evento apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventOrganizerUser.id}`)
                    .set({ authorization: eventOrganizerUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.activities.length).toBe(0);
                expect(body.events.length).toBe(1);
            });

            test('Deve consultar do usuário responsável de atividade apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${activityResponsibleUser.id}`)
                    .set({ authorization: activityResponsibleUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.activities.length).toBe(1);
                expect(body.events.length).toBe(0);
            });

            test('Deve consultar do usuário comum, que não organiza nada', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.activities.length).toBe(0);
                expect(body.events.length).toBe(0);
            });

            test('Deve falhar em consultar um usuário inexistente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id + 4324324}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;

                expect(status).toBe(404);
            });
        });

        describe('/:id/event', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve conseguir acessar a rota como o próprio usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota como outro usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}/event`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}/${userWithResponsibilities.id}/event`);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos dos eventos', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toEqual(expect.arrayContaining([
                    expect.objectContaining(expectedEventBody)
                ]));
            });

            test('Deve consultar do usuário com responsabilidades os três eventos', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });

            test('Deve consultar do usuário com responsabilidades um evento passado', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event?old=true`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(1);
            });

            test('Deve consultar dois evento por página do usuário', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event?page=1&limit=2`)
                    .set({ authorization: userWithResponsibilitiesToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event?page=2&limit=2`)
                    .set({ authorization: userWithResponsibilitiesToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/event?page=3&limit=3`)
                    .set({ authorization: userWithResponsibilitiesToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });

            test('Deve consultar do usuário organizador de um evento apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventOrganizerUser.id}/event`)
                    .set({ authorization: eventOrganizerUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(1);
            });

            test('Deve consultar do usuário responsável de atividade apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${activityResponsibleUser.id}/event`)
                    .set({ authorization: activityResponsibleUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(0);
            });

            test('Deve consultar do usuário comum, que não organiza nada', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}/event`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(0);
            });

            test('Deve falhar em consultar um usuário inexistente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id + 4324324}/event`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;

                expect(status).toBe(404);
            });
        });

        describe('/:id/activity', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve conseguir acessar a rota como o próprio usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota como outro usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}/activity`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(`${baseUrl}/${userWithResponsibilities.id}/activity`);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos das atividades', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body).toEqual(expect.arrayContaining([
                    expect.objectContaining(expectedActivityBody)
                ]));
            });
            
            test('Deve consultar do usuário com responsabilidades uma atividade atual', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(1);
            });

            test('Deve consultar do usuário com responsabilidades duas atividades passada', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity?old=true`)
                    .set({ authorization: userWithResponsibilitiesToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(2);
            });

            test('Deve consultar uma atividade por página do usuário', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity?page=1&limit=1`)
                    .set({ authorization: userWithResponsibilitiesToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(1);

                response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id}/activity?page=2&limit=1`)
                    .set({ authorization: userWithResponsibilitiesToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(1);
            });

            test('Deve consultar do usuário organizador de um evento apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventOrganizerUser.id}/activity`)
                    .set({ authorization: eventOrganizerUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(0);
            });

            test('Deve consultar do usuário responsável de atividade apenas', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${activityResponsibleUser.id}/activity`)
                    .set({ authorization: activityResponsibleUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(1);
            });

            test('Deve consultar do usuário comum, que não organiza nada', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}/activity`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(0);
            });

            test('Deve falhar em consultar um usuário inexistente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${userWithResponsibilities.id + 4324324}/activity`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;

                expect(status).toBe(404);
            });
        });
    });
});