import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class OutsideOfRegistryDate extends BusinessRuleError {
    constructor(message?: string) {
        super(message);
    }
}
