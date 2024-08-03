import { GenericFrontError } from './GenericFrontError';

export class UnexpectedError extends GenericFrontError {
    constructor(stack: string, message?: string) {
        if (!message) {
            console.error(stack);
            message = 'Erro inesperado de aplicação não tratado';
        }
        super(stack, message);
        this.name = 'UnexpectedError';
    }
}
