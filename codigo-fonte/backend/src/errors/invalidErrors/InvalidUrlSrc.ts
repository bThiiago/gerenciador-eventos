export class InvalidUrlSrc extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidCapacityValue';
    }
}
