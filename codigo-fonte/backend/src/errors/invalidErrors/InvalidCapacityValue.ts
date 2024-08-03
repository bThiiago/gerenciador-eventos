export class InvalidCapacityValue extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidCapacityValue';
    }
}
