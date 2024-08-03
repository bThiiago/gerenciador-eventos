export class OutOfDateRange extends Error {
    constructor(message ?: string) {
        super(message);
        this.name = 'OutOfDateRange';
    }
}