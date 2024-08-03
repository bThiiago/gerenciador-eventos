"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("@database/connection");
const typeorm_1 = require("typeorm");
const container_1 = require("@core/container");
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("@models/User");
const Room_1 = require("@models/Room");
const UserLevel_1 = require("@models/UserLevel");
const Event_1 = require("@models/Event");
const EventCategory_1 = require("@models/EventCategory");
const ActivityCategory_1 = require("@models/ActivityCategory");
const Activity_1 = require("@models/Activity");
const user_service_1 = require("@services/user.service");
const createMockEvent_1 = require("test/utils/createMockEvent");
const createMockUser_1 = require("test/utils/createMockUser");
const createFutureDate_1 = require("test/utils/createFutureDate");
const createMockEventCategory_1 = require("test/utils/createMockEventCategory");
const NotFoundError_1 = require("@errors/specialErrors/NotFoundError");
const CpfUndefined_1 = require("@errors/undefinedErrors/CpfUndefined");
const PasswordUndefined_1 = require("@errors/undefinedErrors/PasswordUndefined");
const createMockActivity_1 = require("test/utils/createMockActivity");
const InvalidCpf_1 = require("@errors/invalidErrors/InvalidCpf");
const AlreadyConfirmedError_1 = require("@errors/services/AlreadyConfirmedError");
const UserCannotBeDisabled_1 = require("@errors/specialErrors/UserCannotBeDisabled");
describe('Serviço do usuário', () => {
    let userRepository;
    let userService;
    beforeAll(() => {
        userRepository = connection_1.dataSource.getRepository(User_1.User);
        userService = container_1.container.get(user_service_1.UserService);
    });
    describe('Cadastro', () => {
        afterEach(async () => {
            await userRepository.createQueryBuilder('user').delete().execute();
        });
        test('Deve cadastrar um usuário com sucesso', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            const createdUser = await userService.create(user);
            const userFromDB = await userRepository.findOne(createdUser.id);
            expect(createdUser.id).toBeDefined();
            expect(userFromDB).toBeDefined();
            expect(createdUser.id).toBe(userFromDB?.id);
        });
        test('Deve cadastrar um usuário com sucesso, e confirmar sua conta', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '87113481000', '18993847201');
            user.confirmed = false;
            const createdUser = await userService.create(user);
            await userService.setConfirmedAccount(createdUser.id, true);
            const userFromDB = await userRepository.findOne(createdUser.id);
            expect(createdUser.id).toBeDefined();
            expect(userFromDB).toBeDefined();
            expect(createdUser.id).toBe(userFromDB?.id);
            expect(userFromDB.confirmed).toBeTruthy();
        });
        test('Deve falhar ao tentar confirmar a conta de um usuário, o qual já esta confirmado', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '68880335030', '18993847202');
            const createdUser = await userRepository.save(user);
            await expect(async () => {
                await userService.setConfirmedAccount(createdUser.id, true);
            }).rejects.toThrowError(AlreadyConfirmedError_1.AlreadyConfirmedError);
        });
        test('Deve falhar em cadastrar um usuário sem nome', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.name;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com nome com mais de 150 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.name = 'a'.repeat(151);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem email', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.email;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com email com mais de 120 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.email = 'teste@gmail.com' + 'a'.repeat(120);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar dois usuários com o mesmo email', async () => {
            const user1 = (0, createMockUser_1.createMockUser)('usuario1ServiceTest@test.com', '07568888088', '99993847201');
            const user2 = (0, createMockUser_1.createMockUser)('usuario2ServiceTest@test.com', '07568888088', '18993847201');
            await userService.create(user1);
            await expect(async () => {
                await userService.create(user2);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem CPF', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.cpf;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(CpfUndefined_1.CPFUndefined);
        });
        test('Deve falhar em cadastrar um usuário com CPF inválido', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '43242342342', '18993847201');
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(InvalidCpf_1.InvalidCpf);
        });
        test('Deve falhar em cadastrar dois usuários com o mesmo celular', async () => {
            const user1 = (0, createMockUser_1.createMockUser)('usuario1ServiceTest@test.com', '07568888088', '99993847201');
            const user2 = (0, createMockUser_1.createMockUser)('usuario2ServiceTest@test.com', '05615438010', '99993847201');
            await userService.create(user1);
            await expect(async () => {
                await userService.create(user2);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem celular', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.cellphone;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com celular com mais de 16 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.cellphone = '1'.repeat(17);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem data de nascimento', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.birthDate;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem CEP', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.cep;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com CEP com mais de 8 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.cep = '1'.repeat(9);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem UF', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.uf;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com UF com mais de 2 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.uf = 'ASD';
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem cidade', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.city;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com cidade com mais de 120 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.city = 'a'.repeat(121);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem endereço', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.address;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário com endereço com mais de 120 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.address = 'a'.repeat(121);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve cadastrar um usuário sem login com sucesso', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.login;
            const createdUser = await userService.create(user);
            expect(createdUser.id).toBeDefined();
        });
        test('Deve falhar em cadastrar um usuário com login com mais de 120 caracteres', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.login = 'a'.repeat(121);
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar dois usuários com o mesmo login', async () => {
            const user1 = (0, createMockUser_1.createMockUser)('usuario1ServiceTest@test.com', '07568888088', '99993847201');
            const user2 = (0, createMockUser_1.createMockUser)('usuario2ServiceTest@test.com', '05615438010', '95793247201');
            user1.login = 'loginUsuario1';
            user2.login = 'loginUsuario1';
            await userService.create(user1);
            await expect(async () => {
                await userService.create(user2);
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve falhar em cadastrar um usuário sem senha', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            delete user.password;
            await expect(async () => {
                await userService.create(user);
            }).rejects.toThrowError(PasswordUndefined_1.PasswordUndefined);
        });
        test('Deve cadastrar independente do nível, sendo por padrão DEFAULT', async () => {
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.level = UserLevel_1.UserLevel.ADMIN;
            const createdUser = await userService.create(user);
            const userFromDB = await userRepository.findOne(createdUser.id);
            expect(createdUser.level).toBe(UserLevel_1.UserLevel.DEFAULT);
            expect(userFromDB.level).toBe(UserLevel_1.UserLevel.DEFAULT);
        });
        test('Deve cadastrar um usuário e ter a sua senha encriptografada', async () => {
            const password = '12345678';
            const user = (0, createMockUser_1.createMockUser)('usuarioServiceTest@test.com', '07568888088', '18993847201');
            user.password = password;
            const createdUser = await userService.create(user);
            const userFromDB = await userRepository.findOne(createdUser.id, {
                select: ['password'],
            });
            await expect(bcrypt_1.default.compare(password, userFromDB.password)).resolves.toBeTruthy();
        });
    });
    describe('Consulta', () => {
        const users = [];
        beforeAll(async () => {
            users.push((0, createMockUser_1.createMockUser)('user1TestService@gmail.com', '96809575006', '11987484403'));
            users.push((0, createMockUser_1.createMockUser)('user2TestService@gmail.com', '02639755099', '12987484403'));
            users.push((0, createMockUser_1.createMockUser)('user3TestService@gmail.com', '08032866000', '13987484403'));
            users.push((0, createMockUser_1.createMockUser)('adminUser@gmail.com', '76147172603', '54353457754'));
            users.push((0, createMockUser_1.createMockUser)('disabledUser@gmail.com', '90425654036', '65474574573'));
            users[0].name = 'Carlos Alberto';
            users[1].name = 'Antônio Alberto';
            users[2].name = 'José Silva';
            users[3].name = 'Admin';
            users[4].name = 'Disabled';
            await userRepository.save(users[0]);
            await userRepository.save(users[1]);
            await userRepository.save(users[2]);
            await userRepository.save(users[3]);
            users[3].level = UserLevel_1.UserLevel.ADMIN;
            await userRepository.save(users[3]);
            users[4].active = false;
            await userRepository.save(users[4]);
        });
        afterAll(async () => {
            await userRepository.delete(users[0].id);
            await userRepository.delete(users[1].id);
            await userRepository.delete(users[2].id);
            await userRepository.delete(users[3].id);
            await userRepository.delete(users[4].id);
        });
        describe('Por ID', () => {
            test('Deve consultar os atributos necessários de um usuário', async () => {
                const foundUser = await userService.findById(users[0].id);
                expect(foundUser).toEqual({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                    email: expect.any(String),
                    cellphone: expect.any(String),
                    birthDate: expect.any(Date),
                    cep: expect.any(String),
                    city: expect.any(String),
                    uf: expect.any(String),
                    address: expect.any(String),
                    confirmed: expect.any(Boolean),
                });
            });
            test('Deve consultar o usuário 1 com sucesso', async () => {
                const foundUser = await userService.findById(users[0].id);
                expect(foundUser.cpf).toEqual(users[0].cpf);
            });
            test('Deve consultar o usuário 2 com sucesso', async () => {
                const foundUser = await userService.findById(users[1].id);
                expect(foundUser.cpf).toEqual(users[1].cpf);
            });
            test('Deve consultar o usuário 3 com sucesso', async () => {
                const foundUser = await userService.findById(users[2].id);
                expect(foundUser.cpf).toEqual(users[2].cpf);
            });
            test('Deve dar erro ao não encontrar um usuário inexistente', async () => {
                await expect(async () => {
                    await userService.findById(-40);
                }).rejects.toThrowError(NotFoundError_1.NotFoundError);
            });
        });
        describe('Consulta por email', () => {
            test('Busca por um usuário utilizando o seu email', async () => {
                const user = await userService.findUserByEmail(users[2].email);
                expect(user).toEqual({
                    id: expect.any(Number),
                    name: expect.any(String),
                    cpf: expect.any(String),
                    email: expect.any(String),
                    cellphone: expect.any(String),
                    birthDate: expect.any(Date),
                    cep: expect.any(String),
                    city: expect.any(String),
                    uf: expect.any(String),
                    address: expect.any(String),
                    confirmed: expect.any(Boolean),
                });
            });
        });
        describe('Multi consulta', () => {
            describe('Organizador ou responsável', () => {
                test('Deve consultar os atributos necessários de um usuário', async () => {
                    const findResult = await userService.findAsResponsible();
                    expect(findResult.items[0]).toEqual({
                        id: expect.any(Number),
                        name: expect.any(String),
                        cpf: expect.any(String),
                    });
                });
                test('Deve consultar todos os três usuários com sucesso, sem o admin', async () => {
                    const findResult = await userService.findAsResponsible();
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar apenas dois usuários por página com sucesso', async () => {
                    let findResult = await userService.findAsResponsible({
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await userService.findAsResponsible({
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await userService.findAsResponsible({
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar os usuários pelo CPF', async () => {
                    let findResult = await userService.findAsResponsible({
                        cpf: '00',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                    findResult = await userService.findAsResponsible({
                        cpf: '96809575006',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar um total de zero usuários com um CPF inexistente', async () => {
                    const findResult = await userService.findAsResponsible({
                        cpf: '123123123123',
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar os usuários pelo nome', async () => {
                    let findResult = await userService.findAsResponsible({
                        name: 'Alberto',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                    findResult = await userService.findAsResponsible({
                        name: 'osé',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar um total de zero usuários com um nome inexistente', async () => {
                    const findResult = await userService.findAsResponsible({
                        name: 'dsanjnfjsdknf',
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
            });
            describe('Admin', () => {
                test('Deve consultar os atributos necessários de um usuário', async () => {
                    const findResult = await userService.findAsAdmin();
                    expect(findResult.items[0]).toEqual({
                        id: expect.any(Number),
                        name: expect.any(String),
                        cpf: expect.any(String),
                        email: expect.any(String),
                        cellphone: expect.any(String),
                        birthDate: expect.any(Date),
                        cep: expect.any(String),
                        city: expect.any(String),
                        uf: expect.any(String),
                        address: expect.any(String),
                        confirmed: expect.any(Boolean),
                    });
                });
                test('Deve consultar os três usuários com sucesso, sem o admin', async () => {
                    const findResult = await userService.findAsAdmin();
                    expect(findResult.items.length).toBe(3);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar apenas os usuários com contas confirmadas', async (done) => {
                    const user = (0, createMockUser_1.createMockUser)('mock.email.unconfirmed@gmail.com', '57541747050', '18998994979', 'mocker12341', false);
                    const createdUser = await userRepository.save(user);
                    const findResult = await userService.findAsAdmin({
                        confirmed: true,
                    });
                    expect(findResult.totalCount).toEqual(3);
                    await userRepository.delete(createdUser.id);
                    done();
                });
                test('Deve consultar todos os usuários não confirmados', async (done) => {
                    const user = (0, createMockUser_1.createMockUser)('mock.email.unconfirmed@gmail.com', '57541747050', '18998994979', 'mocker12341', false);
                    const createdUser = await userRepository.save(user);
                    const findResult = await userService.findAsAdmin({
                        confirmed: false,
                    });
                    expect(findResult.totalCount).toEqual(1);
                    await userRepository.delete(createdUser.id);
                    done();
                });
                test('Deve consultar apenas dois usuários por página com sucesso', async () => {
                    let findResult = await userService.findAsAdmin({
                        limit: 2,
                        page: 1,
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await userService.findAsAdmin({
                        limit: 2,
                        page: 2,
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(3);
                    findResult = await userService.findAsAdmin({
                        limit: 2,
                        page: 3,
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(3);
                });
                test('Deve consultar os usuários pelo CPF', async () => {
                    let findResult = await userService.findAsAdmin({
                        cpf: '00',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                    findResult = await userService.findAsAdmin({
                        cpf: '96809575006',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar um total de zero usuários com um CPF inexistente', async () => {
                    const findResult = await userService.findAsAdmin({
                        cpf: '123123123123',
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
                test('Deve consultar os usuários pelo nome', async () => {
                    let findResult = await userService.findAsAdmin({
                        name: 'Alberto',
                    });
                    expect(findResult.items.length).toBe(2);
                    expect(findResult.totalCount).toBe(2);
                    findResult = await userService.findAsAdmin({
                        name: 'osé',
                    });
                    expect(findResult.items.length).toBe(1);
                    expect(findResult.totalCount).toBe(1);
                });
                test('Deve consultar um total de zero usuários com um nome inexistente', async () => {
                    const findResult = await userService.findAsAdmin({
                        name: 'dsanjnfjsdknf',
                    });
                    expect(findResult.items.length).toBe(0);
                    expect(findResult.totalCount).toBe(0);
                });
            });
        });
    });
    describe('Alteração', () => {
        let user1;
        let user2;
        beforeAll(async () => {
            user1 = await userRepository.save((0, createMockUser_1.createMockUser)('user1TestService@gmail.com', '96809575006', '11987484403'));
            user2 = await userRepository.save((0, createMockUser_1.createMockUser)('user2TestService@gmail.com', '45689787000', '33775433193'));
        });
        afterAll(async () => {
            await userRepository.delete(user1.id);
            await userRepository.delete(user2.id);
        });
        test('Não deve falhar ao passar o usuário com os mesmos atributos', async () => {
            await expect(userService.edit(user1.id, user1)).resolves.not.toThrow();
        });
        test('Deve alterar o nome do usuário com sucesso', async () => {
            const name = 'Carlos Alberto';
            const updatedUser = await userService.edit(user1.id, {
                name,
            });
            const selectedUser = await userRepository.findOne(user1.id);
            expect(updatedUser.name).toBe(name);
            expect(selectedUser.name).toBe(name);
        });
        test('Deve alterar o email do usuário com sucesso', async () => {
            const email = 'user1TestService2@gmail.com';
            const updatedUser = await userService.edit(user1.id, {
                email,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['email'],
            });
            expect(updatedUser.email).toBe(email);
            expect(selectedUser.email).toBe(email);
        });
        test('Deve falhar em alterar o email para um email já existente', async () => {
            const email = 'user2TestService@gmail.com';
            await expect(async () => {
                await userService.edit(user1.id, {
                    email,
                });
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve alterar o CPF do usuário com sucesso', async () => {
            const cpf = '33597853048';
            const updatedUser = await userService.edit(user1.id, {
                cpf,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['cpf'],
            });
            expect(updatedUser.cpf).toBe(cpf);
            expect(selectedUser.cpf).toBe(cpf);
        });
        test('Deve falhar em alterar o CPF para um CPF já existente', async () => {
            const cpf = '45689787000';
            await expect(async () => {
                await userService.edit(user1.id, {
                    cpf,
                });
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve alterar o celular do usuário com sucesso', async () => {
            const cellphone = '44837281910';
            const updatedUser = await userService.edit(user1.id, {
                cellphone,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['cellphone'],
            });
            expect(updatedUser.cellphone).toBe(cellphone);
            expect(selectedUser.cellphone).toBe(cellphone);
        });
        test('Deve falhar em alterar o celular para um celular já existente', async () => {
            const cellphone = '33775433193';
            await expect(async () => {
                await userService.edit(user1.id, {
                    cellphone,
                });
            }).rejects.toThrowError(typeorm_1.QueryFailedError);
        });
        test('Deve alterar a data de nascimento do usuário com sucesso', async () => {
            const birthDate = (0, createFutureDate_1.createFutureDate)(-980);
            const updatedUser = await userService.edit(user1.id, {
                birthDate,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['birthDate'],
            });
            expect(updatedUser.birthDate).toBe(birthDate);
            expect(selectedUser.birthDate).toStrictEqual(birthDate);
        });
        test('Deve alterar o CEP do usuário com sucesso', async () => {
            const cep = '19478392';
            const updatedUser = await userService.edit(user1.id, {
                cep,
            });
            const selectedUser = await userRepository.findOne(user1.id);
            expect(updatedUser.cep).toBe(cep);
            expect(selectedUser.cep).toBe(cep);
        });
        test('Deve alterar a cidade do usuário com sucesso', async () => {
            const city = 'Presidente Prudente';
            const updatedUser = await userService.edit(user1.id, {
                city,
            });
            const selectedUser = await userRepository.findOne(user1.id);
            expect(updatedUser.city).toBe(city);
            expect(selectedUser.city).toBe(city);
        });
        test('Deve alterar a UF do usuário com sucesso', async () => {
            const uf = 'RJ';
            const updatedUser = await userService.edit(user1.id, {
                uf,
            });
            const selectedUser = await userRepository.findOne(user1.id);
            expect(updatedUser.uf).toBe(uf);
            expect(selectedUser.uf).toBe(uf);
        });
        test('Deve alterar o endereço do usuário com sucesso', async () => {
            const address = 'Rua KKKKKKK';
            const updatedUser = await userService.edit(user1.id, {
                address,
            });
            const selectedUser = await userRepository.findOne(user1.id);
            expect(updatedUser.address).toBe(address);
            expect(selectedUser.address).toBe(address);
        });
        test('Deve alterar o login do usuário com sucesso', async () => {
            const login = 'testelogin';
            const updatedUser = await userService.edit(user1.id, {
                login,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['login'],
            });
            expect(updatedUser.login).toBe(login);
            expect(selectedUser.login).toBe(login);
        });
        test('Deve remover o login do usuário com sucesso', async () => {
            await userService.edit(user1.id, {
                login: null,
            });
            // selecionar apenas o campo vazio por algum motivo retorna null no usuario??
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['name', 'login'],
            });
            expect(selectedUser.login).toBeNull();
        });
        test('Deve alterar a senha do usuário com sucesso', async () => {
            const password = '123123';
            await userService.edit(user1.id, {
                password,
            });
            const selectedUser = await userRepository.findOne(user1.id, {
                select: ['password'],
            });
            await expect(bcrypt_1.default.compare(password, selectedUser.password)).resolves.toBeTruthy();
        });
        test('Deve falhar ao alterar um usuário inexistente', async () => {
            await expect(async () => {
                await userService.edit(-40, {
                    name: 'asdasd',
                });
            }).rejects.toThrowError(NotFoundError_1.NotFoundError);
        });
    });
    describe('Desativar', () => {
        let userToDisable, unrelatedUser;
        let associatedEvent;
        let associatedActivity;
        let room;
        let activityCategory;
        let eventCategory;
        beforeAll(async () => {
            room = await connection_1.dataSource
                .getRepository(Room_1.Room)
                .save(new Room_1.Room('ASD32323', 30));
            activityCategory = await connection_1.dataSource
                .getRepository(ActivityCategory_1.ActivityCategory)
                .save(new ActivityCategory_1.ActivityCategory('JF', 'fdsfgsdgdsg'));
            eventCategory = await connection_1.dataSource
                .getRepository(EventCategory_1.EventCategory)
                .save(new EventCategory_1.EventCategory('Categoria foda', 'aasdfgf'));
        });
        beforeEach(async () => {
            userToDisable = await userRepository.save((0, createMockUser_1.createMockUser)('userToDisable1@gmail.com', '34652044097', '43254364361'));
            unrelatedUser = await userRepository.save((0, createMockUser_1.createMockUser)('unrelatedUser4324@gmail.com', '03940963046', '65465464562'));
        });
        afterEach(async () => {
            if (associatedActivity && associatedActivity.id)
                await connection_1.dataSource
                    .getRepository(Activity_1.Activity)
                    .delete(associatedActivity.id);
            if (associatedEvent && associatedEvent.id)
                await connection_1.dataSource
                    .getRepository(Event_1.Event)
                    .delete(associatedEvent.id);
            await userRepository.delete(userToDisable.id);
            await userRepository.delete(unrelatedUser.id);
        });
        afterAll(async () => {
            await connection_1.dataSource.getRepository(Room_1.Room).delete(room.id);
            await connection_1.dataSource
                .getRepository(ActivityCategory_1.ActivityCategory)
                .delete(activityCategory.id);
            await connection_1.dataSource
                .getRepository(EventCategory_1.EventCategory)
                .delete(eventCategory.id);
        });
        test('Deve desativar o usuário com sucesso', async () => {
            const result = await userService.delete(userToDisable.id);
            const disabledUser = await userRepository.findOne(userToDisable.id);
            expect(result).toBe(1);
            expect(disabledUser.active).toBeFalsy();
        });
        test('Deve desativar o usuário com sucesso, mesmo de um evento passado', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([userToDisable], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(-20);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(-10);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            const result = await userService.delete(userToDisable.id);
            const disabledUser = await userRepository.findOne(userToDisable.id);
            expect(result).toBe(1);
            expect(disabledUser.active).toBeFalsy();
        });
        test('Deve falhar em desativar um usuário de um evento futuro', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([userToDisable], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(10);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(20);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            await expect(async () => {
                await userService.delete(userToDisable.id);
            }).rejects.toThrowError(UserCannotBeDisabled_1.UserCannotBeDisabled);
        });
        test('Deve falhar em desativar um usuário de um evento atual', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([userToDisable], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(-5);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(10);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            await expect(async () => {
                await userService.delete(userToDisable.id);
            }).rejects.toThrowError(UserCannotBeDisabled_1.UserCannotBeDisabled);
        });
        test('Deve desativar o usuário com sucesso, mesmo de uma atividade de um evento passado', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([unrelatedUser], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(-20);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(-10);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            associatedActivity = (0, createMockActivity_1.createMockActivity)(associatedEvent, room, [userToDisable], activityCategory);
            associatedActivity = await connection_1.dataSource
                .getRepository(Activity_1.Activity)
                .save(associatedActivity);
            const result = await userService.delete(userToDisable.id);
            const disabledUser = await userRepository.findOne(userToDisable.id);
            expect(result).toBe(1);
            expect(disabledUser.active).toBeFalsy();
        });
        test('Deve falhar em desativar um usuário de um uma atividade de um evento futuro', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([unrelatedUser], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(10);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(20);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            associatedActivity = (0, createMockActivity_1.createMockActivity)(associatedEvent, room, [userToDisable], activityCategory);
            associatedActivity = await connection_1.dataSource
                .getRepository(Activity_1.Activity)
                .save(associatedActivity);
            await expect(async () => {
                await userService.delete(userToDisable.id);
            }).rejects.toThrowError(UserCannotBeDisabled_1.UserCannotBeDisabled);
        });
        test('Deve falhar em desativar um usuário de um uma atividade de um evento atual', async () => {
            associatedEvent = (0, createMockEvent_1.createMockEvent)([unrelatedUser], eventCategory);
            associatedEvent.startDate = (0, createFutureDate_1.createFutureDate)(-5);
            associatedEvent.endDate = (0, createFutureDate_1.createFutureDate)(20);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            associatedEvent = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save(associatedEvent);
            associatedActivity = (0, createMockActivity_1.createMockActivity)(associatedEvent, room, [userToDisable], activityCategory);
            associatedActivity = await connection_1.dataSource
                .getRepository(Activity_1.Activity)
                .save(associatedActivity);
            await expect(async () => {
                await userService.delete(userToDisable.id);
            }).rejects.toThrowError(UserCannotBeDisabled_1.UserCannotBeDisabled);
        });
        test('Deve retornar zero ao excluir um usuário inexistente', async () => {
            const result = await userService.delete(userToDisable.id + 43242);
            expect(result).toBe(0);
        });
    });
    describe('Login', () => {
        let user;
        const email = 'user1TestService@gmail.com';
        const password = '12345678';
        beforeAll(async () => {
            user = (0, createMockUser_1.createMockUser)(email, '96809575006', '11987484403');
            user.password = password;
            await userRepository.save(user);
        });
        afterAll(async () => {
            await userRepository.delete(user.id);
        });
        test('Deve autenticar o usuário com sucesso', async () => {
            await expect(userService.login(email, password)).resolves.toBeDefined();
        });
        test('Deve falhar em autenticar o usuário com email incorreto', async () => {
            await expect(userService.login('asdasd', password)).resolves.toBeUndefined();
        });
        test('Deve falhar em autenticar o usuário com senha incorreta', async () => {
            await expect(userService.login(email, 'sadsdfsdf')).resolves.toBeUndefined();
        });
    });
    describe('Verificar se é organizador de evento', () => {
        let user1;
        let user2;
        let category;
        let event;
        beforeAll(async () => {
            user1 = await userRepository.save((0, createMockUser_1.createMockUser)('user1TestService@gmail.com', '96809575006', '11987484403'));
            user2 = await userRepository.save((0, createMockUser_1.createMockUser)('user2TestService@gmail.com', '45689787000', '33775433193'));
            category = await connection_1.dataSource
                .getRepository(EventCategory_1.EventCategory)
                .save((0, createMockEventCategory_1.createMockEventCategory)('Categoria 1 Teste Serviço User', 'c1tsu123'));
            event = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save((0, createMockEvent_1.createMockEvent)([user2], category));
        });
        afterAll(async () => {
            await connection_1.dataSource.getRepository(Event_1.Event).delete(event.id);
            await connection_1.dataSource.getRepository(EventCategory_1.EventCategory).delete(category.id);
            await userRepository.delete(user1.id);
            await userRepository.delete(user2.id);
        });
        test('Espera-se que o primeiro usuário não seja organizador do evento', async () => {
            const isOrganizer = await userService.isEventOrganizer(user1.id);
            expect(isOrganizer).toBeFalsy();
        });
        test('Espera-se que o segundo usuário seja organizador do evento', async () => {
            const isOrganizer = await userService.isEventOrganizer(user2.id);
            expect(isOrganizer).toBeTruthy();
        });
        test('Espera-se que o segundo usuário seja organizador do evento especificado', async () => {
            const isOrganizer = await userService.isEventOrganizer(user2.id, event.id);
            expect(isOrganizer).toBeTruthy();
        });
        test('Espera-se que o segundo usuário não seja organizador de outro evento', async () => {
            const isOrganizer = await userService.isEventOrganizer(user2.id, event.id + 1000);
            expect(isOrganizer).toBeFalsy();
        });
        test('Deve falhar ao tentar verificar um usuário inexistente', async () => {
            await expect(async () => {
                await userService.isEventOrganizer(-40);
            }).rejects.toThrowError(NotFoundError_1.NotFoundError);
        });
    });
    describe('Verificar se é responsável da atividade', () => {
        let user1;
        let user2;
        let room;
        let category;
        let event;
        let activityCategory;
        let activity;
        beforeAll(async () => {
            user1 = await userRepository.save((0, createMockUser_1.createMockUser)('user1TestService@gmail.com', '96809575006', '11987484403'));
            user2 = await userRepository.save((0, createMockUser_1.createMockUser)('user2TestService@gmail.com', '45689787000', '33775433193'));
            room = await connection_1.dataSource
                .getRepository(Room_1.Room)
                .save(new Room_1.Room('sala legal 213123', 30));
            category = await connection_1.dataSource
                .getRepository(EventCategory_1.EventCategory)
                .save((0, createMockEventCategory_1.createMockEventCategory)('Categoria 1 Teste Serviço User', 'c1tsu123'));
            event = await connection_1.dataSource
                .getRepository(Event_1.Event)
                .save((0, createMockEvent_1.createMockEvent)([user2], category));
            activityCategory = await connection_1.dataSource
                .getRepository(ActivityCategory_1.ActivityCategory)
                .save(new ActivityCategory_1.ActivityCategory('PX', 'nasjkdnasd'));
            activity = await connection_1.dataSource
                .getRepository(Activity_1.Activity)
                .save((0, createMockActivity_1.createMockActivity)(event, room, [user2], activityCategory));
        });
        afterAll(async () => {
            await connection_1.dataSource.getRepository(Activity_1.Activity).delete(activity.id);
            await connection_1.dataSource
                .getRepository(ActivityCategory_1.ActivityCategory)
                .delete(activityCategory.id);
            await connection_1.dataSource.getRepository(Event_1.Event).delete(event.id);
            await connection_1.dataSource.getRepository(EventCategory_1.EventCategory).delete(category.id);
            await connection_1.dataSource.getRepository(Room_1.Room).delete(room.id);
            await userRepository.delete(user1.id);
            await userRepository.delete(user2.id);
        });
        test('Espera-se que o primeiro usuário não seja responsável pela atividade', async () => {
            const isResponsible = await userService.isActivityResponsible(user1.id);
            expect(isResponsible).toBeFalsy();
        });
        test('Espera-se que o segundo usuário seja responsável pela atividade', async () => {
            const isResponsible = await userService.isActivityResponsible(user2.id);
            expect(isResponsible).toBeTruthy();
        });
        test('Deve falhar ao tentar verificar um usuário inexistente', async () => {
            await expect(async () => {
                await userService.isActivityResponsible(-40);
            }).rejects.toThrowError(NotFoundError_1.NotFoundError);
        });
    });
});
//# sourceMappingURL=user.test.js.map