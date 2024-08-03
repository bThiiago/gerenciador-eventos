import ErrMessages from '@errors/messages/messages';
import { BusinessRuleError } from './BusinessRuleError';

export class NotAuthenticatedError extends BusinessRuleError {
    constructor() {
        super(ErrMessages.unauthenticated);
    }
}