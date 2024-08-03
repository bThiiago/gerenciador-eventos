"use strict";
require('dotenv').config();
module.exports = [
    {
        name: 'default',
        type: 'postgres',
        url: process.env.DATABASE_URL,
        synchronize: process.env.SYNCHRONIZE_DB === 'true' ? true : false,
        logging: false,
        entities: ['src/model/**/*.ts'],
        migrations: ['src/database/migration/**/*.ts'],
        subscribers: ['src/database/subscriber/**/*.ts'],
        cli: {
            entitiesDir: 'src/model',
            migrationsDir: 'src/database/migration',
            subscribersDir: 'src/database/subscriber',
        },
    },
    {
        name: 'test',
        type: 'postgres',
        url: process.env.TEST_DATABASE_URL,
        synchronize: true,
        logging: false,
        entities: ['src/model/**/*.ts'],
        migrations: ['src/database/migration/**/*.ts'],
        subscribers: ['src/database/subscriber/**/*.ts'],
        cli: {
            entitiesDir: 'src/model',
            migrationsDir: 'src/database/migration',
            subscribersDir: 'src/database/subscriber',
        },
    },
];
//# sourceMappingURL=ormconfig.js.map