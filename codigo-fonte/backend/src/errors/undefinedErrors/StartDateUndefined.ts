export class StartDateUndefined extends Error {
    constructor(message?: string) {
        super(message || 'startDate is not defined');
        this.name = 'StartDateUndefined';
    }
}