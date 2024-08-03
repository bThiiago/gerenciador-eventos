import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import ErrMessages from '../messages/messages';

export class EventDeleteRestriction extends BusinessRuleError {
    constructor(message?: string) {
        super(message ?? ErrMessages.classes.eventDeleteRestriction);
    }
}
