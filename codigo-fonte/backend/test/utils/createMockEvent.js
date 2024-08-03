"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockEvent = void 0;
const Event_1 = require("@models/Event");
const createFutureDate_1 = require("./createFutureDate");
/**
 * Instancia um novo evento dado uma lista de usuários responsáveis
 * Função utilizada apenas nos testes para gerar um novo evento com facilidade.
 *
 * @param responsibleUsers - Uma lista com pelo menos um usuário responsável
 * @param eventCategory - Categoria na qual o evento pertencerá
 * @returns Um novo evento instanciado
 */
function createMockEvent(responsibleUsers, eventCategory) {
    if (responsibleUsers.length == 0)
        throw new Error('responsibleUsers is empty');
    return new Event_1.Event(1, 'Evento Teste', (0, createFutureDate_1.createFutureDate)(2), (0, createFutureDate_1.createFutureDate)(9), 'BCC', responsibleUsers, eventCategory, (0, createFutureDate_1.createFutureDate)(-5), (0, createFutureDate_1.createFutureDate)(4), 0, 0);
}
exports.createMockEvent = createMockEvent;
//# sourceMappingURL=createMockEvent.js.map