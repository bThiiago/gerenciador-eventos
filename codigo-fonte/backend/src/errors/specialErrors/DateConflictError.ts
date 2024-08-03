import { BusinessRuleError } from '@errors/services/BusinessRuleError';

interface ConflictData {
    activityName : string; // nome da atividade que deu conflito
    eventName : string; // nome do evento que contém a atividade
    roomName ?: string; // nome da sala que deu conflito (se for cadastro de atividade)
    index ?: number; // o campo que teve erro de conflito (se for cadastro de atividade)
}

export class DateConflictError extends BusinessRuleError {
    constructor(message : string, data : ConflictData[]) {
        super(message);
        this.data = data;
    }

    public data : ConflictData[];
}
