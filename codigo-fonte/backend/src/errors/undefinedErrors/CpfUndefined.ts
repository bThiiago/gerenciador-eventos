export class CPFUndefined extends Error {
    constructor(message?: string) {
        super(message || 'CPF is not defined');
        this.name = 'CPF is not defined';
    }
}