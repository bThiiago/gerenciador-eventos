import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ActivityHasPresencesArchived extends BusinessRuleError {
    constructor(message?: string) {
        super(message);
    }
}
