import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class IncompleteActivity extends BusinessRuleError {
    constructor(message ?: string) {
        super(message);
    }
}
