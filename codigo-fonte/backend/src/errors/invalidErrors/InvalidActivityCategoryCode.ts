export class InvalidActivityCategoryCode extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidActivityCategoryCode';
    }
}
