"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../src/database/connection");
const Activity_1 = require("@models/Activity");
const ActivityRegistry_1 = require("@models/ActivityRegistry");
const Event_1 = require("@models/Event");
const EventCategory_1 = require("@models/EventCategory");
const Room_1 = require("@models/Room");
const Schedule_1 = require("@models/Schedule");
const User_1 = require("@models/User");
const Presence_1 = require("@models/Presence");
const ActivityCategory_1 = require("@models/ActivityCategory");
require('ts-node/register');
require('tsconfig-paths/register');
async function showCleanupResult() {
    let message = '\nVERIFICANDO CLEANUP DA BASE DE DADOS - OS ITENS DEVEM APRESENTAR CONTAGEM 0\n';
    message += `        Activity : ${await connection_1.connection.getRepository(Activity_1.Activity).count()}\n`;
    message += `ActivityRegistry : ${await connection_1.connection.getRepository(ActivityRegistry_1.ActivityRegistry).count()}\n`;
    message += `           Event : ${await connection_1.connection.getRepository(Event_1.Event).count()}\n`;
    message += `   EventCategory : ${await connection_1.connection.getRepository(EventCategory_1.EventCategory).count()}\n`;
    message += `            Room : ${await connection_1.connection.getRepository(Room_1.Room).count()}\n`;
    message += `        Schedule : ${await connection_1.connection.getRepository(Schedule_1.Schedule).count()}\n`;
    message += `            User : ${await connection_1.connection.getRepository(User_1.User).count()}\n`;
    message += `        Presence : ${await connection_1.connection.getRepository(Presence_1.Presence).count()}\n`;
    message += `ActivityCategory : ${await connection_1.connection.getRepository(ActivityCategory_1.ActivityCategory).count()}\n`;
    console.log(message);
}
const teardown = async () => {
    await connection_1.DB.connect('test');
    await showCleanupResult();
    await connection_1.DB.clear();
    await connection_1.DB.close();
};
exports.default = teardown;
//# sourceMappingURL=global-teardown.js.map