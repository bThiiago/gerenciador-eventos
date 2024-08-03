import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ResponsibleRegistryError extends BusinessRuleError {
    constructor() {
        super('The user can\'t registry in the activity that he offers');
    }
}
