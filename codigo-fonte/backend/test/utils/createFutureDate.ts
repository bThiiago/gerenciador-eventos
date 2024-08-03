/**
 * Cria uma data futura em n dias.
 * Dado um número, a data atual será somada com n dias
 * 
 * @param {number} days - Quantidade de dias para somar na data de hoje
 * @returns Uma data futura
 */
export function createFutureDate(days : number) : Date {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate;
}