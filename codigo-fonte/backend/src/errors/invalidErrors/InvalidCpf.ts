export class InvalidCpf extends Error {
    constructor(message?: string) {
        super(message || 'Invalid CPF');
        this.name = 'InvalidCpf';
    }
}
