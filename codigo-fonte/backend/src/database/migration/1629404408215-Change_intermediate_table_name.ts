import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description alterando nome da tabela 'event_responsible_users_user' para 'organizer_event'
 **/ 
export class ChangeIntermediateTableName1629404408215 implements MigrationInterface {
    name = 'ChangeIntermediateTableName1629404408215' 
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "event_responsible_users_user"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" RENAME TO "organizer_event"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "organizer_event" RENAME TO "event_responsible_users_people"');
    }

}
