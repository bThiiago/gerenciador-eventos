import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class NoVacancyOnActivity extends BusinessRuleError {
    constructor(message?: string) {
        super(message);
    }
}
