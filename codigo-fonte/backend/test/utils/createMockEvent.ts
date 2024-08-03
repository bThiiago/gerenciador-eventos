import { EventCategory } from '@models/EventCategory';
import { Event } from '@models/Event';
import { User } from '@models/User';
import { createFutureDate } from './createFutureDate';

/**
 * Instancia um novo evento dado uma lista de usuários responsáveis
 * Função utilizada apenas nos testes para gerar um novo evento com facilidade.
 *
 * @param responsibleUsers - Uma lista com pelo menos um usuário responsável
 * @param eventCategory - Categoria na qual o evento pertencerá
 * @returns Um novo evento instanciado
 */
export function createMockEvent(
    responsibleUsers: User[],
    eventCategory: EventCategory
): Event {
    if (responsibleUsers.length == 0)
        throw new Error('responsibleUsers is empty');
    return new Event(
        1,
        'Evento Teste',
        createFutureDate(2),
        createFutureDate(9),
        'BCC',
        responsibleUsers,
        eventCategory,
        createFutureDate(-5),
        createFutureDate(4),
        0,
        0,
    );
}
