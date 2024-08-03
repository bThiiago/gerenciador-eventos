export class InvalidCep extends Error {
    constructor(message?: string) {
        super(message || 'Invalid CEP');
        this.name = 'InvalidCep';
    }
}
