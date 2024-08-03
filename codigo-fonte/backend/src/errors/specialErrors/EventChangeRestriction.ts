import { BusinessRuleError } from '@errors/services/BusinessRuleError';
import ErrMessages from '../messages/messages';

export class EventChangeRestriction extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.eventChangeRestriction);
    }
}
