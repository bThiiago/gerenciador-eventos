export class GenericFrontError extends Error {
    constructor(stack : string, message ?: string) {
        super(message);
        this.stack = stack;
        this.name = 'GenericFrontError';
    }
}