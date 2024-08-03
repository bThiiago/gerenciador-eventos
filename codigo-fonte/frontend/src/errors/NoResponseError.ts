import { GenericFrontError } from './GenericFrontError';

export class NoResponseError extends GenericFrontError {
    constructor(stack: string, message?: string) {
        super(
            stack,
            message
                ? message
                : 'Não houve respostas do servidor. Tente novamente mais tarde.'
        );
        this.name = 'NoResponseError';
    }
}
