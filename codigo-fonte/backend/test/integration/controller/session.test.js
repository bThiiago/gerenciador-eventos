"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("@database/connection");
const server_config_1 = require("src/config/server.config");
const server_1 = require("src/server");
const User_1 = require("@models/User");
const createMockUser_1 = require("test/utils/createMockUser");
const messages_1 = __importDefault(require("@errors/messages/messages"));
describe('Controle da sessão - /sessions', () => {
    const baseUrl = '/api/v1/sessions';
    let app;
    let user;
    let userPassword;
    let userRepository;
    beforeAll(async () => {
        app = (0, server_1.Server)().getApp();
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        user = (0, createMockUser_1.createMockUser)('userSessionTestController@gmail.com', '48163430834', '30999291111');
        userPassword = user.password;
        await userRepository.save(user);
    });
    afterAll(async () => {
        await userRepository.delete(user.id);
    });
    describe('POST', () => {
        describe('/', () => {
            test('Deve autenticar o usuário com sucesso', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: user.email,
                    password: userPassword,
                });
                const token = response.body.token;
                const status = response.statusCode;
                expect(status).toBe(200);
                expect(token).toBeDefined();
                expect(() => {
                    jsonwebtoken_1.default.verify(token, server_config_1.SERVER_CONFIG.JWT_CONFIG.SECRET);
                }).not.toThrow();
            });
            test('Deve falhar em acessar a rota com um email inválido', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: 'asdfdsf',
                    password: userPassword,
                });
                const status = response.statusCode;
                const message = response.body.validation.body.message;
                expect(status).toBe(400);
                expect(message).toContain('"email"');
            });
            test('Deve falhar em autenticar o usuário com um email incorreto', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: 'aaaa@aaa.com',
                    password: userPassword,
                });
                const status = response.statusCode;
                const message = response.body.message;
                expect(status).toBe(400);
                expect(message).toBe(messages_1.default.sessionRoute.wrongCredentials);
            });
            test('Deve falhar em autenticar o usuário com uma senha incorreta', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: user.email,
                    password: 'asdasfdsfdsf',
                });
                const status = response.statusCode;
                const message = response.body.message;
                expect(status).toBe(400);
                expect(message).toBe(messages_1.default.sessionRoute.wrongCredentials);
            });
            test('Deve falhar em autenticar o usuário com um email e senha incorreta', async () => {
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: 'dasdin@fdnsfk.com',
                    password: 'asdasfdsfdsf',
                });
                const status = response.statusCode;
                const message = response.body.message;
                expect(status).toBe(400);
                expect(message).toBe(messages_1.default.sessionRoute.wrongCredentials);
            });
            test('Deve falhar em autenticar o usuário que não teve a conta confirmada', async () => {
                let unconfirmedUser = (0, createMockUser_1.createMockUser)('notConfirmed@email.com', '65827159093', '4423523523');
                const password = unconfirmedUser.password;
                await userRepository.save(unconfirmedUser);
                delete unconfirmedUser.password;
                unconfirmedUser.confirmed = false;
                unconfirmedUser = await userRepository.save(unconfirmedUser);
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: unconfirmedUser.email,
                    password,
                });
                const status = response.statusCode;
                const message = response.body.message;
                await userRepository.delete(unconfirmedUser.id);
                expect(status).toBe(412);
                expect(message).toBe(messages_1.default.sessionRoute.notConfirmed);
            });
            test('Deve falhar em autenticar o usuário que foi desativado', async () => {
                let unconfirmedUser = (0, createMockUser_1.createMockUser)('notConfirmed@email.com', '65827159093', '4423523523');
                const password = unconfirmedUser.password;
                await userRepository.save(unconfirmedUser);
                delete unconfirmedUser.password;
                unconfirmedUser.active = false;
                unconfirmedUser.confirmed = true;
                unconfirmedUser = await userRepository.save(unconfirmedUser);
                const response = await (0, supertest_1.default)(app).post(`${baseUrl}`).send({
                    email: unconfirmedUser.email,
                    password,
                });
                const status = response.statusCode;
                const message = response.body.message;
                await userRepository.delete(unconfirmedUser.id);
                expect(status).toBe(403);
                expect(message).toBe(messages_1.default.sessionRoute.disabled);
            });
        });
    });
    describe('GET', () => {
        let validToken, invalidToken, nonToken;
        beforeAll(async () => {
            const data = {
                id: user.id,
                level: user.level,
            };
            validToken = jsonwebtoken_1.default.sign(data, server_config_1.SERVER_CONFIG.JWT_CONFIG.SECRET, {
                expiresIn: '10 minutes',
            });
            invalidToken = jsonwebtoken_1.default.sign(data, server_config_1.SERVER_CONFIG.JWT_CONFIG.SECRET, {
                expiresIn: '0 seconds',
            });
            nonToken = 'asdasd';
        });
        describe('/validate', () => {
            test('Deve verificar o token válido com sucesso', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/validate`)
                    .set({
                    authorization: `Bearer ${validToken}`,
                });
                const status = response.statusCode;
                expect(status).toBe(200);
            });
            test('Deve verificar o token inválido e retornar erro', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/validate`)
                    .set({
                    authorization: `Bearer ${invalidToken}`,
                });
                const status = response.statusCode;
                expect(status).toBe(401);
            });
            test('Deve verificar o token malformado e retornar erro', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/validate`)
                    .set({
                    authorization: `Bearer ${nonToken}`,
                });
                const status = response.statusCode;
                expect(status).toBe(401);
            });
            test('Deve verificar o token malformado sem bearer e retornar erro', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/validate`)
                    .set({
                    authorization: `${nonToken}`,
                });
                const status = response.statusCode;
                expect(status).toBe(401);
            });
            test('Deve falhar ao verificar nenhuma autorização', async () => {
                const response = await (0, supertest_1.default)(app)
                    .get(`${baseUrl}/validate`)
                    .set({});
                const status = response.statusCode;
                expect(status).toBe(400);
            });
        });
    });
});
// describe('Teste de integração para rota /sessions', () => {
//     it('deve criar um usuário e logar com este', async (done) => {
//         const { email } = user;
//         const res = await supertest(app)
//             .post('/api/v1/sessions')
//             .send({ email, password });
//         expect(res.status).toBe(200);
//         expect(res.body.token).toBeTruthy();
//         expect(res.body.user).toEqual({
//             id: user.id,
//             level: user.level,
//             name: user.name,
//         });
//         return done();
//     });
//     it('deve tentar logar com um usuário inválido e receber um erro', async () => {
//         const { email } = user;
//         const res = await supertest(app)
//             .post('/api/v1/sessions')
//             .send({ email, password: 'asdfjlasdfj' });
//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(ErrMessages.sessionRoute.wrongCredentials);
//     });
//     it('deve tentar logar com um usuário que não existe', async () => {
//         const res = await supertest(app)
//             .post('/api/v1/sessions')
//             .send({ email: 'random@gmail.com', password: 'asdfjlasdfj' });
//         expect(res.status).toBe(400);
//         expect(res.body.message).toBe(ErrMessages.sessionRoute.wrongCredentials);
//     });
// });
//# sourceMappingURL=session.test.js.map