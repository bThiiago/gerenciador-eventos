import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from '@errors/services/BusinessRuleError';

export class UserCannotBeDeleted extends BusinessRuleError {
    constructor() {
        super(ErrMessages.classes.userCannotBeDeleted);
    }
}
