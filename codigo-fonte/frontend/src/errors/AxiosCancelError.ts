export class AxiosCancelError extends Error {
    constructor() {
        super('Operação cancelada pelo usuário');
        this.name = 'AxiosCancelError';
    }
}