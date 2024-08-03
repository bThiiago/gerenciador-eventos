export class SchedulesUndefined extends Error {
    constructor(message?: string) {
        super(message || 'schedules is not defined');
        this.name = 'SchedulesUndefined';
    }
}