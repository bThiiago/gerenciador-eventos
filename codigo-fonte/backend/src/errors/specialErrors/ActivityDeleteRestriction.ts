import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import ErrMessages from '../messages/messages';

export class ActivityDeleteRestriction extends BusinessRuleError {
    constructor(message?: string) {
        super(message ?? ErrMessages.classes.activityDeleteRestriction.eventIsHappening);
    }
}
