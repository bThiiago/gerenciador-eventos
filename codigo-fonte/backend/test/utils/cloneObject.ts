/**
 * Clona um objeto, recebendo os mesmos atributos.
 * Os métodos não são clonados.
 * 
 * @param {Object} object - O objeto a ser clonado.
 * @returns Um novo objeto com os mesmos atributos.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function cloneObject<T>(object : T) : T {
    return JSON.parse(JSON.stringify(object));
}