import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class UserCannotBeReenabled extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.userCannotBeReEnabled);
    }
}
