"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockEventCategory = void 0;
const EventCategory_1 = require("@models/EventCategory");
/**
 * Instancia uma nova categoria de evento dado sua categoria e url
 * Função utilizada apenas nos testes para gerar uma nova categoria com facilidade.
 *
 * @param category - Descrição da categoria, o seu nome
 * @param url_src - O identificador da categoria que ficará como URL
 * @returns Uma nova categoria de evento instanciada
 */
function createMockEventCategory(category, url_src) {
    const event_category = new EventCategory_1.EventCategory(category, url_src);
    return event_category;
}
exports.createMockEventCategory = createMockEventCategory;
//# sourceMappingURL=createMockEventCategory.js.map