import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ActivityDeleteIsHappening extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.activityDeleteRestriction.eventIsHappening);
    }
}
