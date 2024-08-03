export class EndDateUndefined extends Error {
    constructor(message?: string) {
        super(message || 'endDate is not defined');
        this.name = 'EndDateUndefined';
    }
}