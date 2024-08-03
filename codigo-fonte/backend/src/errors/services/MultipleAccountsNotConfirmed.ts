import { BusinessRuleError } from './BusinessRuleError';

export class MultipleAccountsNotConfirmed extends BusinessRuleError {
    constructor(userName: string[]) {
        super(`As contas do(s) usuário(s) ${userName.join(', ')} não estão confirmadas`);
    }
}
