"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockActivity = void 0;
const Activity_1 = require("@models/Activity");
const Schedule_1 = require("@models/Schedule");
const createFutureDate_1 = require("./createFutureDate");
/**
 * Instancia uma nova atividade dado um evento, sala e lista de usuários responsáveis
 * Função utilizada apenas nos testes para gerar uma nova atividade com facilidade.
 *
 * @param event - Um evento na qual a atividade pertence
 * @param room - Uma sala para ter um horário
 * @param responsibleUsers - Uma lista com pelo menos um usuário responsável
 * @param activityCategory - Uma categoria na qual a atividade pertence
 * @returns Uma nova atividade instanciada
 */
function createMockActivity(event, room, responsibleUsers, activityCategory) {
    if (responsibleUsers.length == 0)
        throw new Error('responsibleUsers is empty');
    return new Activity_1.Activity('Atividade Teste', 'Uma atividade criada no mock', 20, 90, event, [
        new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(5), 30, room, undefined),
        new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(6), 30, undefined, 'http://test.com'),
        new Schedule_1.Schedule((0, createFutureDate_1.createFutureDate)(7), 30, room, 'http://test.com'),
    ], responsibleUsers, [], activityCategory);
}
exports.createMockActivity = createMockActivity;
//# sourceMappingURL=createMockActivity.js.map