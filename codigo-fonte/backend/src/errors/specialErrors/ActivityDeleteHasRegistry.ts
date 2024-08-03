import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class ActivityDeleteHasRegistry extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.activityDeleteRestriction.hasRegistrys);
    }
}
