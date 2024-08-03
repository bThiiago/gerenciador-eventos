import { dataSource } from '@database/connection';
import { User } from '../model/User';
import { UserLevel } from '../model/UserLevel';

const verifyForAdmin = async () : Promise<void> => {
    const userRepository = dataSource.getRepository(User);

    const userList = await userRepository.find({where : { level : UserLevel.ADMIN}});
    if(userList.length == 0) {
        console.log('\nTHIS LOG WILL DISPLAY ONCE\n');
        console.log('No administrator user found. Creating default administrator.');

        const administrator = new User();
        administrator.name = 'ADMIN';
        administrator.cpf = '65124283076';
        administrator.cellphone = '18999998888';
        administrator.birthDate = new Date();
        administrator.cep = '65081270';
        administrator.city = 'São Paulo';
        administrator.uf = 'SP';
        administrator.address = 'Rua ADMIN';
        administrator.email = 'admin@admin.com';
        administrator.password = 'administrator';
        administrator.level = UserLevel.ADMIN;

        await userRepository.save(administrator);

        console.log('\nDefault administrator user created:');
        console.log('   Login: admin@admin.com\nPassword: administrator\n');
        console.log('Please, make sure to change the default password to prevent security issues.');
        console.log('\nTHIS LOG WILL DISPLAY ONCE\n');
    }
};

export default verifyForAdmin;