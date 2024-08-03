import { container } from '@core/container';
import { getBindings } from '../src/inversify.config';
import { DB, dataSource } from '../src/database/connection';
import { Server } from '../src/server';

import { Activity } from '@models/Activity';
import { ActivityRegistry } from '@models/ActivityRegistry';
import { Event } from '@models/Event';
import { EventCategory } from '@models/EventCategory';
import { Room } from '@models/Room';
import { Schedule } from '@models/Schedule';
import { User } from '@models/User';
import { Presence } from '@models/Presence';

beforeAll(async () => {
    expect.extend({
        toBeTypeOrNull(received, classTypeOrNull) {
            try {
                expect(received).toEqual(expect.any(classTypeOrNull));
                return {
                    message: () => 'Ok',
                    pass: true
                };
            } catch (error) {
                return received === null 
                    ? {
                        message: () => 'Ok',
                        pass: true
                    }
                    : {
                        message: () => `expected ${received} to be ${classTypeOrNull} type or null`,
                        pass: false
                    };
            }
        }
    });
    await container.loadAsync(getBindings('test'));
    Server().createApp();
});

afterAll(async () => {
    async function showCleanupResult() {
        let message = '\nVERIFICANDO CLEANUP DA BASE DE DADOS - OS ITENS DEVEM APRESENTAR CONTAGEM 0\n';
        message += `        Activity : ${await dataSource.getRepository(Activity).count()}\n`;
        message += `ActivityRegistry : ${await dataSource.getRepository(ActivityRegistry).count()}\n`;
        message += `           Event : ${await dataSource.getRepository(Event).count()}\n`;
        message += `   EventCategory : ${await dataSource.getRepository(EventCategory).count()}\n`;
        message += `            Room : ${await dataSource.getRepository(Room).count()}\n`;
        message += `        Schedule : ${await dataSource.getRepository(Schedule).count()}\n`;
        message += `            User : ${await dataSource.getRepository(User).count()}\n`;
        message += `        Presence : ${await dataSource.getRepository(Presence).count()}\n`;
        console.log(message);
    }
    //await showCleanupResult();

    await DB.close();
});