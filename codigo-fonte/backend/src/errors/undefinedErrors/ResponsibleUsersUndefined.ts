export class ResponsibleUsersUndefined extends Error {
    constructor(message?: string) {
        super(message || 'responsibleUsers is not defined');
        this.name = 'ResponsibleUsersUndefined';
    }
}