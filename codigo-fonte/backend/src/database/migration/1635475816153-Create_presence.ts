import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description cria a tabela presença e adiciona as chaves estrangeiras das tabelas
 * "activity_registry" e "horario_atividade"
 **/
export class CreatePresence1635475816153 implements MigrationInterface {
    name = 'CreatePresence1635475816153'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "presence" ("id" SERIAL NOT NULL, "isPresent" boolean NOT NULL DEFAULT true, "activityRegistryId" integer, "scheduleId" integer NOT NULL, CONSTRAINT "UQ_72806cf3d387f4137e7cd49f39c" UNIQUE ("activityRegistryId", "scheduleId"), CONSTRAINT "PK_cdcc974562552583493dbd64c0c" PRIMARY KEY ("id", "scheduleId"))');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_34018add316b7af63c4a7e17b2e" FOREIGN KEY ("activityRegistryId") REFERENCES "activity_registry"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579" FOREIGN KEY ("scheduleId") REFERENCES "horario_atividade"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579"');
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_34018add316b7af63c4a7e17b2e"');
        await queryRunner.query('DROP TABLE "presence"');
    }

}
