"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("@core/container");
const inversify_config_1 = require("../src/inversify.config");
const connection_1 = require("../src/database/connection");
const server_1 = require("../src/server");
const Activity_1 = require("@models/Activity");
const ActivityRegistry_1 = require("@models/ActivityRegistry");
const Event_1 = require("@models/Event");
const EventCategory_1 = require("@models/EventCategory");
const Room_1 = require("@models/Room");
const Schedule_1 = require("@models/Schedule");
const User_1 = require("@models/User");
const Presence_1 = require("@models/Presence");
beforeAll(async () => {
    expect.extend({
        toBeTypeOrNull(received, classTypeOrNull) {
            try {
                expect(received).toEqual(expect.any(classTypeOrNull));
                return {
                    message: () => 'Ok',
                    pass: true
                };
            }
            catch (error) {
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
    await container_1.container.loadAsync((0, inversify_config_1.getBindings)('test'));
    (0, server_1.Server)().createApp();
});
afterAll(async () => {
    async function showCleanupResult() {
        let message = '\nVERIFICANDO CLEANUP DA BASE DE DADOS - OS ITENS DEVEM APRESENTAR CONTAGEM 0\n';
        message += `        Activity : ${await connection_1.dataSource.getRepository(Activity_1.Activity).count()}\n`;
        message += `ActivityRegistry : ${await connection_1.dataSource.getRepository(ActivityRegistry_1.ActivityRegistry).count()}\n`;
        message += `           Event : ${await connection_1.dataSource.getRepository(Event_1.Event).count()}\n`;
        message += `   EventCategory : ${await connection_1.dataSource.getRepository(EventCategory_1.EventCategory).count()}\n`;
        message += `            Room : ${await connection_1.dataSource.getRepository(Room_1.Room).count()}\n`;
        message += `        Schedule : ${await connection_1.dataSource.getRepository(Schedule_1.Schedule).count()}\n`;
        message += `            User : ${await connection_1.dataSource.getRepository(User_1.User).count()}\n`;
        message += `        Presence : ${await connection_1.dataSource.getRepository(Presence_1.Presence).count()}\n`;
        console.log(message);
    }
    //await showCleanupResult();
    await connection_1.DB.close();
});
//# sourceMappingURL=test-setup.js.map