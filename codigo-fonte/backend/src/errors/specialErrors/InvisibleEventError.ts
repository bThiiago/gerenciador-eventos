import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class InvisibleEventError extends BusinessRuleError {
    constructor(message?: string) {
        super(message);
    }
}
