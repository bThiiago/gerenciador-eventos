import { DB } from '../src/database/connection';

require('ts-node/register');
require('tsconfig-paths/register');

const setup = async (): Promise<void> => {
    await DB.connect('test');
    await DB.clear();
    await DB.close();
};
  
export default setup;