import { DB } from '@database/connection';
import { SERVER_CONFIG } from './config/server.config';
import { Server } from './server';

async function init() {
    const app = Server();

    await DB.connect().then(() => {
        console.log('Conectado com a base de dados');
    });

    const server = await app.start('default');
    server.listen(SERVER_CONFIG.PORT, () => {
        console.log(`Server is running on port ${SERVER_CONFIG.PORT}`);
    });
}

init();