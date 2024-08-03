export class PasswordUndefined extends Error {
    constructor(message?: string) {
        super(message || 'Password is not defined');
        this.name = 'PasswordUndefined';
    }
}