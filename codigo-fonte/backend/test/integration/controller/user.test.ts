import { Application } from 'express';
import supertest from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
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

describe('Controle do usuário - /user', () => {
    const baseUrl = '/api/v1/user';

    let app: Application;

    let commonUser: User,
        adminUser: User,
        eventOrganizerUser: User,
        activityResponsibleUser: User;

    let room: Room;
    let eventCategory: EventCategory;
    let event: Event;
    let activityCategory: ActivityCategory;
    let activity: Activity;

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
        activityCategory = new ActivityCategory('ID', 'amajajajjaa');
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
        const expectedAdminUserBody = {
            id: expect.any(Number),
            name: expect.any(String),
            cpf: expect.any(String),
            email: expect.any(String),
            cellphone: expect.any(String),
            birthDate: expect.any(String),
            cep: expect.any(String),
            city: expect.any(String),
            uf: expect.any(String),
            address: expect.any(String),
            confirmed: expect.any(Boolean),
        };
        const expectedOrganizerUserBody = {
            id: expect.any(Number),
            name: expect.any(String),
            cpf: expect.any(String),
        };
        
        describe('/', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });

            test('Deve conseguir acessar apenas usuários confirmados', async () => {
                const user = createMockUser('mock.email.seila@test.com', '19194486085', '18988005047');
                user.confirmed = false;

                await userRepository.save(user);

                const response = await supertest(app)
                    .get(baseUrl)
                    .query({ confirmed: true })
                    .set({ authorization: adminUserToken });

                await userRepository.delete(user.id);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });

            test('Deve conseguir acessar apenas usuários não confirmados', async () => {
                const user = createMockUser('mock.email.seila@test.com', '19194486085', '18988005047');
                user.confirmed = false;

                await userRepository.save(user);

                const response = await supertest(app)
                    .get(baseUrl)
                    .query({ confirmed: false })
                    .set({ authorization: adminUserToken });

                await userRepository.delete(user.id);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(1);
            });

            test('Deve conseguir acessar a rota como organizador de evento', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: eventOrganizerUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });

            test('Deve conseguir acessar a rota como responsável da atividade', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: activityResponsibleUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body.length).toBe(3);
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(403);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(baseUrl);

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(400);
                expect(body).not.toBeInstanceOf(Array);
            });

            test('Deve consultar os atributos corretos dos usuários como admin', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body[0]).toEqual(expectedAdminUserBody);
            });

            test('Deve consultar os atributos corretos dos usuários como organizador', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: eventOrganizerUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body[0]).toEqual(expectedOrganizerUserBody);
            });

            test('Deve consultar os atributos corretos dos usuários como responsável', async () => {
                const response = await supertest(app)
                    .get(baseUrl)
                    .set({ authorization: activityResponsibleUserToken });

                const status = response.statusCode;
                const body = response.body;

                expect(status).toBe(200);
                expect(body[0]).toEqual(expectedOrganizerUserBody);
            });

            test('Deve consultar dois usuários por página', async () => {
                let response = await supertest(app)
                    .get(`${baseUrl}?page=1&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(2);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}?page=2&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(1);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);

                response = await supertest(app)
                    .get(`${baseUrl}?page=3&limit=2`)
                    .set({ authorization: adminUserToken });

                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(0);
                expect(parseInt(response.headers['x-total-count'])).toBe(3);
            });
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota em qualquer usuário como administrador', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve conseguir acessar a rota se for o mesmo usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em acessar a rota de outro usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventOrganizerUser.id}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app).get(
                    `${baseUrl}/${eventOrganizerUser.id}`
                );

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve consultar os atributos corretos de um usuário', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${eventOrganizerUser.id}`)
                    .set({ authorization: adminUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual(expectedAdminUserBody);
            });

            test('Deve consultar com sucesso os próprios dados', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken });

                const body = response.body;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(body).toEqual({
                    id: commonUser.id,
                    name: commonUser.name,
                    cpf: commonUser.cpf,
                    email: commonUser.email,
                    cellphone: commonUser.cellphone,
                    birthDate: commonUser.birthDate.toISOString(),
                    cep: commonUser.cep,
                    city: commonUser.city,
                    uf: commonUser.uf,
                    address: commonUser.address,
                    confirmed: true,
                });
            });

            test('Deve falhar em consultar um usuário inexistente', async () => {
                const response = await supertest(app)
                    .get(`${baseUrl}/${commonUser.id + 5353}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(404);
            });
        });
    });

    describe('POST', () => {
        let user: User;
        let userData: Partial<User>;

        beforeAll(() => {
            user = createMockUser(
                'usuarioTestPost@gmail.com',
                '82331457000',
                '73289472334'
            );
            userData = {
                name: user.name,
                email: user.email,
                password: user.password,
                cpf: user.cpf,
                cellphone: user.cellphone,
                birthDate: user.birthDate,
                cep: user.cep,
                city: user.city,
                uf: user.uf,
                address: user.address,
            };
        });

        describe('/', () => {
            test('Deve submeter e cadastrar um usuário com sucesso', async () => {
                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(userData);

                const status = response.statusCode;
                expect(status).toBe(201);

                const body = response.body;

                expect(body).toEqual({
                    id: expect.any(Number),
                    level: UserLevel.DEFAULT,
                    login: null,
                    name: userData.name,
                    cpf: userData.cpf,
                    email: userData.email,
                    cellphone: userData.cellphone,
                    birthDate: userData.birthDate.toISOString(),
                    cep: userData.cep,
                    city: userData.city,
                    uf: userData.uf,
                    address: userData.address,
                    confirmed: false
                });

                await userRepository.delete(body.id);
            });

            test('Deve falhar em submeter um usuário sem nome', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.name;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"name"');
            });

            test('Deve falhar em submeter um usuário com nome com mais de 150 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.name = 'a'.repeat(151);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"name"');
            });

            test('Deve falhar em submeter um usuário sem email', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.email;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário com email com mais de 120 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.email = 'a'.repeat(120) + '@gmail.com';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário com email conflitante', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.email = commonUser.email;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário com email inválido', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.email = '478932yhcsdbfhsd';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário sem senha', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.password;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"password"');
            });

            test('Deve falhar em submeter um usuário com senha de menos de 6 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.password = '213';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;

                expect(validation.message).toContain('"password"');
            });

            test('Deve conseguir submeter o usuário com um CPF mascarado', async () => {
                const modifiedUserData = cloneObject(userData);
                modifiedUserData.cpf = '754.495.750-09';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(modifiedUserData);

                const status = response.statusCode;
                expect(status).toBe(201);

                const body = response.body;

                await userRepository.delete(body.id);
            });

            test('Deve falhar em submeter um usuário sem CPF', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.cpf;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cpf"');
            });

            test('Deve falhar em submeter um usuário com CPF inválido', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cpf = '44444444444';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                expect(response.body.message).toContain('CPF');
            });

            test('Deve falhar em submeter um usuário com CPF de tamanho incorreto', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cpf = '12121212';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cpf"');
            });

            test('Deve falhar em submeter um usuário com CPF conflitante', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cpf = commonUser.cpf;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário sem telefone celular', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.cellphone;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com telefone celular com menos de 9 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cellphone = '12312323';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com telefone celular com mais de 16 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cellphone = '1'.repeat(17);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com celular conflitante', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cellphone = commonUser.cellphone;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário sem data de nascimento', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.birthDate;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"birthDate"');
            });

            test('Deve falhar em submeter um usuário que tenha até quatro anos de idade', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.birthDate = createFutureDate(365 * -3);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"birthDate"');
            });

            test('Deve conseguir submeter um usuário com CEP mascarado', async () => {
                const modifiedUserData = cloneObject(userData);
                modifiedUserData.cep = '19470-000';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(modifiedUserData);

                const status = response.statusCode;
                expect(status).toBe(201);

                const body = response.body;

                await userRepository.delete(body.id);
            });

            test('Deve falhar em submeter um usuário sem CEP', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.cep;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cep"');
            });

            test('Deve falhar em submeter um usuário com CEP de tamanho incorreto', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.cep = '1231231';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cep"');
            });

            test('Deve falhar em submeter um usuário sem cidade', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.city;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"city"');
            });

            test('Deve falhar em submeter um usuário com cidade com mais de 120 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.city = '1'.repeat(121);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"city"');
            });

            test('Deve falhar em submeter um usuário sem UF', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.uf;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"uf"');
            });

            test('Deve falhar em submeter um usuário com UF de tamanho incorreto', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.uf = 'asdasd';

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"uf"');
            });

            test('Deve falhar em submeter um usuário sem endereço', async () => {
                const wrongUserData = cloneObject(userData);
                delete wrongUserData.address;

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"address"');
            });

            test('Deve falhar em submeter um usuário com endereço com mais de 120 caracteres', async () => {
                const wrongUserData = cloneObject(userData);
                wrongUserData.address = '1'.repeat(121);

                const response = await supertest(app)
                    .post(`${baseUrl}`)
                    .send(wrongUserData);

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"address"');
            });
        });
    });

    describe('PUT', () => {
        let newUserData: Partial<User>;

        beforeAll(() => {
            newUserData = {
                name: 'Carlos Antônio',
                email: 'newCommonUserMail@gmail.com',
                password: 'carlinhosjk123123',
                cpf: '38447358011',
                cellphone: '113849278921',
                birthDate: createFutureDate(365 * -18),
                cep: '19483000',
                city: 'Cidade Marrocos',
                uf: 'BH',
                address: 'Rua santinho 200',
            };
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota em qualquer usuário como administrador', async () => {
                const userData = {
                    name: commonUser.name,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: adminUserToken })
                    .send(userData);

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve conseguir acessar a rota se for o mesmo usuário', async () => {
                const userData = {
                    name: commonUser.name,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send(userData);

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em acessar a rota de outro usuário', async () => {
                const userData = {
                    name: commonUser.name,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${eventOrganizerUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send(userData);

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const userData = {
                    name: commonUser.name,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .send(userData);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve alterar os atributos do usuário com sucesso', async () => {
                const userData = {
                    name: newUserData.name,
                    email: newUserData.email,
                    password: newUserData.password,
                    cpf: newUserData.cpf,
                    cellphone: newUserData.cellphone,
                    birthDate: newUserData.birthDate,
                    cep: newUserData.cep,
                    city: newUserData.city,
                    uf: newUserData.uf,
                    address: newUserData.address,
                };

                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send(userData);

                const status = response.statusCode;
                const modifiedUser = await userRepository.findOne(
                    commonUser.id,
                    {
                        select: [
                            'id',
                            'name',
                            'email',
                            'password',
                            'cpf',
                            'cellphone',
                            'birthDate',
                            'cep',
                            'city',
                            'uf',
                            'address',
                        ],
                    }
                );

                expect(status).toBe(200);
                expect(modifiedUser.id).toBe(commonUser.id);
                delete modifiedUser.id;

                expect(
                    await bcrypt.compare(
                        newUserData.password,
                        modifiedUser.password
                    )
                ).toBeTruthy();
                delete modifiedUser.password;

                expect(modifiedUser).toEqual({
                    name: newUserData.name,
                    email: newUserData.email,
                    cpf: newUserData.cpf,
                    cellphone: newUserData.cellphone,
                    birthDate: newUserData.birthDate,
                    cep: newUserData.cep,
                    city: newUserData.city,
                    uf: newUserData.uf,
                    address: newUserData.address,
                });
            });

            test('Deve falhar em submeter um objeto vazio', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send();

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve falhar em submeter um usuário com nome null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        name: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"name"');
            });

            test('Deve falhar em submeter um usuário com nome com mais de 150 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        name: 'a'.repeat(151),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"name"');
            });

            test('Deve falhar em submeter um usuário com email null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        email: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário com email com mais de 120 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        email: 'a'.repeat(120) + '@gmail.com',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário com email inválido', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        email: 'asdasfdsfsd',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"email"');
            });

            test('Deve falhar em submeter um usuário com email conflitante', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        email: eventOrganizerUser.email,
                    });

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário com senha null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        password: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"password"');
            });

            test('Deve falhar em submeter um usuário com senha com menos de 6 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        password: '123',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"password"');
            });

            test('Deve conseguir submeter um usuário com CPF mascarado', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cpf: '670.517.360-27',
                    });

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em submeter um usuário com CPF null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cpf: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cpf"');
            });

            test('Deve falhar em submeter um usuário com CPF de tamanho incorreto', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cpf: '123123',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cpf"');
            });

            test('Deve falhar em submeter um usuário com CPF inválido', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cpf: '12312312312',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);
                expect(response.body.message).toContain('CPF');
            });

            test('Deve falhar em submeter um usuário com CPF conflitante', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cpf: eventOrganizerUser.cpf,
                    });

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário com telefone celular null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cellphone: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com telefone celular com menos que 9 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cellphone: '123123',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com telefone celular com mais que 16 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cellphone: '1'.repeat(17),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cellphone"');
            });

            test('Deve falhar em submeter um usuário com celular conflitante', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cellphone: eventOrganizerUser.cellphone,
                    });

                const status = response.statusCode;
                expect(status).toBe(409);
            });

            test('Deve falhar em submeter um usuário com data de nascimento null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        birthDate: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"birthDate"');
            });

            test('Deve falhar em submeter um usuário que tenha até quatro anos de idade', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        birthDate: createFutureDate(365 * -3),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"birthDate"');
            });

            test('Deve conseguir submeter um usuário com CEP mascarado', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cep: '18470-322',
                    });

                const status = response.statusCode;
                expect(status).toBe(200);
            });

            test('Deve falhar em submeter um usuário com CEP null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cep: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cep"');
            });

            test('Deve falhar em submeter um usuário com CEP de tamanho incorreto', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        cep: '123123',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"cep"');
            });

            test('Deve falhar em submeter um usuário com cidade null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        city: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"city"');
            });

            test('Deve falhar em submeter um usuário com cidade com mais de 120 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        city: '1'.repeat(121),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"city"');
            });

            test('Deve falhar em submeter um usuário com UF null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        uf: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"uf"');
            });

            test('Deve falhar em submeter um usuário com UF de tamanho incorreto', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        uf: 'ADS',
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"uf"');
            });

            test('Deve falhar em submeter um usuário com endereço null', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        address: null,
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"address"');
            });

            test('Deve falhar em submeter um usuário com endereço com mais de 120 caracteres', async () => {
                const response = await supertest(app)
                    .put(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken })
                    .send({
                        address: '1'.repeat(121),
                    });

                const status = response.statusCode;
                expect(status).toBe(400);

                const validation = response.body.validation.body;
                expect(validation.message).toContain('"address"');
            });
        });
    });

    describe('DELETE', () => {
        beforeEach(async () => {
            commonUser.active = true;
            await userRepository.save(commonUser);
        });

        describe('/:id', () => {
            test('Deve conseguir acessar a rota como administrador', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                expect(status).toBe(201);
            });

            test('Deve falhar em acessar a rota como usuário comum', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: commonUserToken });

                const status = response.statusCode;
                expect(status).toBe(403);
            });

            test('Deve falhar em acessar a rota sem autenticação', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${commonUser.id}`);

                const status = response.statusCode;
                expect(status).toBe(400);
            });

            test('Deve desativar o usuário com sucesso', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${commonUser.id}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const modifiedUser = await userRepository.findOne(
                    commonUser.id,
                    {
                        select: [
                            'id',
                            'active',
                        ],
                    }
                );

                expect(status).toBe(201);
                expect(modifiedUser.active).toBe(false);
            });

            test('Deve falhar em desativar o usuário de um evento futuro ou atual', async () => {
                const response = await supertest(app)
                    .delete(`${baseUrl}/${eventOrganizerUser.id}`)
                    .set({ authorization: adminUserToken });

                const status = response.statusCode;
                const modifiedUser = await userRepository.findOne(
                    commonUser.id,
                    {
                        select: [
                            'id',
                            'active',
                        ],
                    }
                );

                expect(status).toBe(409);
                expect(modifiedUser.active).toBe(true);
            });
        });
    });
});