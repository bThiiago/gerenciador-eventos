import { connection, DB } from '../src/database/connection';

import { Activity } from '@models/Activity';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { Event } from '@models/Event';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { Schedule } from '@models/Schedule';
import { User } from '@models/User';
import { Presence } from '@models/Presence';
import { ActivityCategory } from '@models/ActivityCategory';

require('ts-node/register');
require('tsconfig-paths/register');

async function showCleanupResult() {
    let message = '\nVERIFICANDO CLEANUP DA BASE DE DADOS - OS ITENS DEVEM APRESENTAR CONTAGEM 0\n';
    message += `        Activity : ${await connection.getRepository(Activity).count()}\n`;
    message += `ActivityRegistry : ${await connection.getRepository(ActivityRegistry).count()}\n`;
    message += `           Event : ${await connection.getRepository(Event).count()}\n`;
    message += `   EventCategory : ${await connection.getRepository(EventCategory).count()}\n`;
    message += `            Room : ${await connection.getRepository(Room).count()}\n`;
    message += `        Schedule : ${await connection.getRepository(Schedule).count()}\n`;
    message += `            User : ${await connection.getRepository(User).count()}\n`;
    message += `        Presence : ${await connection.getRepository(Presence).count()}\n`;
    message += `ActivityCategory : ${await connection.getRepository(ActivityCategory).count()}\n`;
    console.log(message);
}

const teardown = async (): Promise<void> => {
    await DB.connect('test');

    await showCleanupResult();

    await DB.clear();
    await DB.close();
};
  
export default teardown;