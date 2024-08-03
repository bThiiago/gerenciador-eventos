export class InvalidVacancyValue extends Error {
    constructor(message : string) {
        super(message);
        this.name = 'InvalidVacancyValue';
    }
}