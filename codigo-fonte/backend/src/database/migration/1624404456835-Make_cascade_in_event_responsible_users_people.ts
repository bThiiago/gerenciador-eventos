import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description ajustando as constraints de chave estrangeira na tabela "event_responsible_users_people", 
 * para garantir que as alterações nas chaves estrangeiras sejam refletidas corretamente em cascata nas 
 * tabelas relacionadas durante as operações de atualização e exclusão
 **/
export class MakeCascadeInEventResponsibleUsersPeople1624404456835 implements MigrationInterface {
    name = 'MakeCascadeInEventResponsibleUsersPeople1624404456835'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_46f01df0760ac2857515289752a"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_be88e91bcf2909acc71e749591f"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_46f01df0760ac2857515289752a" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_be88e91bcf2909acc71e749591f" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_be88e91bcf2909acc71e749591f"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_46f01df0760ac2857515289752a"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_be88e91bcf2909acc71e749591f" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_46f01df0760ac2857515289752a" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

}
