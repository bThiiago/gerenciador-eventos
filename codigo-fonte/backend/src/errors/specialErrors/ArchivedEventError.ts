import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ArchivedEventError extends BusinessRuleError {
    constructor(message?: string) {
        super(message);
    }
}
