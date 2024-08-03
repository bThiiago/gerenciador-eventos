import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class RegistredUser extends BusinessRuleError {
    constructor() {
        super('This user is already registred');
    }
}
