"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneObject = void 0;
/**
 * Clona um objeto, recebendo os mesmos atributos.
 * Os métodos não são clonados.
 *
 * @param {Object} object - O objeto a ser clonado.
 * @returns Um novo objeto com os mesmos atributos.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
}
exports.cloneObject = cloneObject;
//# sourceMappingURL=cloneObject.js.map