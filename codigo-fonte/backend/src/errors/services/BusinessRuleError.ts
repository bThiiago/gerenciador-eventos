export class BusinessRuleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BusinessRuleError';
    }
}