import { Activity } from '@models/Activity';
import { ActivityCategory } from '@models/ActivityCategory';
import { Event } from '@models/Event';
import { Room } from '@models/Room';
import { Schedule } from '@models/Schedule';
import { User } from '@models/User';
import { createFutureDate } from './createFutureDate';

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
export function createMockActivity(
    event: Event,
    room: Room,
    responsibleUsers: User[],
    activityCategory: ActivityCategory,
): Activity {
    if (responsibleUsers.length == 0)
        throw new Error('responsibleUsers is empty');
    return new Activity(
        'Atividade Teste',
        'Uma atividade criada no mock',
        20,
        90,
        event,
        [
            new Schedule(createFutureDate(5), 30, room, undefined),
            new Schedule(createFutureDate(6), 30, undefined, 'http://test.com'),
            new Schedule(createFutureDate(7), 30, room, 'http://test.com'),
        ],
        responsibleUsers,
        [],
        activityCategory
    );
}
