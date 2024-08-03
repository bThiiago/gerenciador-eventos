import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import ErrMessages from '../messages/messages';

export class EndDateBeforeStartDateRegistryError extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.endDateBeforeStartDateRegistryError);
    }
}
