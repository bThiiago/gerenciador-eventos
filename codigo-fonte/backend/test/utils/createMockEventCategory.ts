import { EventCategory } from '@models/EventCategory';

/**
 * Instancia uma nova categoria de evento dado sua categoria e url
 * Função utilizada apenas nos testes para gerar uma nova categoria com facilidade.
 *
 * @param category - Descrição da categoria, o seu nome
 * @param url_src - O identificador da categoria que ficará como URL
 * @returns Uma nova categoria de evento instanciada
 */
export function createMockEventCategory(
    category: string,
    url_src: string
): EventCategory {
    const event_category = new EventCategory(category, url_src);
    return event_category;
}
