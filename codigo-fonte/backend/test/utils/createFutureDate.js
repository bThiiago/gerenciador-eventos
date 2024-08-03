"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFutureDate = void 0;
/**
 * Cria uma data futura em n dias.
 * Dado um número, a data atual será somada com n dias
 *
 * @param {number} days - Quantidade de dias para somar na data de hoje
 * @returns Uma data futura
 */
function createFutureDate(days) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate;
}
exports.createFutureDate = createFutureDate;
//# sourceMappingURL=createFutureDate.js.map