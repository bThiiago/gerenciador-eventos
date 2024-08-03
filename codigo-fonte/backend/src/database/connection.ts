import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: ['error'],
    entities: [path.join(__dirname, '..', 'model', '*{.ts,.js}')],
    migrations: [path.join(__dirname,'..', 'database', 'migration', '*{.ts,.js}')]
});

export const DB = {
    async connect(databaseToUse = 'default'): Promise<void> {
        if (databaseToUse !== 'default') {
            dataSource.setOptions({
                database: 'eventos_test'
            });
        }

        if (!dataSource.isInitialized)
            await dataSource.initialize();
    },

    async close(): Promise<void> {
        if(dataSource.isInitialized) 
            await dataSource.destroy();
    },

    async clear(): Promise<void> {
        const entities = dataSource.entityMetadatas;

        for (const entity of entities) {
            const repository = dataSource.getRepository(entity.name);
            //await repository.clear();
            await repository.query(`TRUNCATE "${entity.tableName}" CASCADE`);
        }
    }
};