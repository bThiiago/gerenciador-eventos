import { User } from '@models/User';
import { UserLevel } from '@models/UserLevel';

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
export function createMockUser(
    email: string,
    cpf: string,
    cellphone: string,
    login?: string,
): User {
    return new User(
        'Test User',
        email,
        cpf,
        cellphone,
        new Date('1999-01-01T00:00:00'),
        '19470000',
        'Presidente Epitácio',
        'SP',
        'Rua Tal',
        login,
        'senha123',
        UserLevel.DEFAULT
    );
}
