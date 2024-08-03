import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class UserCannotBeDisabled extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.userCannotBeDisabled);
    }
}
