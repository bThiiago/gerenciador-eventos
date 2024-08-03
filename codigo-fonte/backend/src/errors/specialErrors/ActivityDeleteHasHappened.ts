import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ActivityDeleteHasHappened extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.activityDeleteRestriction.eventHasHappened);
    }
}
