import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from './BusinessRuleError';

export class InsufficientPermissionsError extends BusinessRuleError {
    constructor() {
        super(ErrMessages.insufficientPermissions);
    }
}