export class NotFoundError extends Error {
    constructor(whatIsNotFound?: string) {
        super(whatIsNotFound ? `${whatIsNotFound} not found` : 'Not found');
        this.name = 'NotFoundError';
    }
}
