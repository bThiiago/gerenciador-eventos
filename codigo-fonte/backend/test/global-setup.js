"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../src/database/connection");
require('ts-node/register');
require('tsconfig-paths/register');
const setup = async () => {
    await connection_1.DB.connect('test');
    await connection_1.DB.clear();
    await connection_1.DB.close();
};
exports.default = setup;
//# sourceMappingURL=global-setup.js.map