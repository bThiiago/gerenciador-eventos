export class InvalidWorkloadMinutesValue extends Error {
    constructor(message : string) {
        super(message);
        this.name = 'InvalidWorkloadMinutesValue';
    }
}