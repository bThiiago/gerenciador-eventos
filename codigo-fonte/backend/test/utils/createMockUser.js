"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockUser = void 0;
const User_1 = require("@models/User");
const UserLevel_1 = require("@models/UserLevel");
/**
 * Instancia um novo usuário com os atributos únicos especificados nos parâmetros.
 * Função utilizada apenas nos testes para gerar um novo usuário com facilidade.
 *
 * @param email - O email único do usuário
 * @param cpf - O CPF único do usuário
 * @param cellphone - O número de celular único do usuário
 * @param [login] - O login único do usuário
 * @returns Um novo usuário instanciado
 */
function createMockUser(email, cpf, cellphone, login, confirmed = true) {
    return new User_1.User('Test User', email, cpf, cellphone, new Date('1999-01-01T00:00:00'), '19470000', 'Presidente Epitácio', 'SP', 'Rua Tal', login, 'senha123', UserLevel_1.UserLevel.DEFAULT, confirmed);
}
exports.createMockUser = createMockUser;
//# sourceMappingURL=createMockUser.js.map