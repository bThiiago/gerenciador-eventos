export class InvalidSchedule extends Error {
    constructor(message : string) {
        super(message);
        this.name = 'InvalidSchedule';
    }
}