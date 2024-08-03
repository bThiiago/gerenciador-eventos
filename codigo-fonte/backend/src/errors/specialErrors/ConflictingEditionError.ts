import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ConflictingEditionError extends BusinessRuleError {
    constructor() {
        super('Event edition conflicts with another in same category');
    }
}
