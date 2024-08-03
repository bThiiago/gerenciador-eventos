import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import ErrMessages from '../messages/messages';

export class EndDateBeforeStartDateError extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.endDateBeforeStartDateError);
    }
}
