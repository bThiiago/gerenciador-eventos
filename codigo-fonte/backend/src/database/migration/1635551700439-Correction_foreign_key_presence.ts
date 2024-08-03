import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description ajustando as constraints de chave estrangeira na tabela "presence", 
 * (NÃO ESTÁ FAZENDO CASCADE, alterações nas tabelas das chaves estrangeiras não afetam a tabela presence)
 **/
export class CorrectionForeignKeyPresence1635551700439 implements MigrationInterface {
    name = 'CorrectionForeignKeyPresence1635551700439'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579"');
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "UQ_72806cf3d387f4137e7cd49f39c"');
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "PK_cdcc974562552583493dbd64c0c"');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "PK_e0088b38d7cf2dc6ad815d33e7d" PRIMARY KEY ("id")');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "UQ_72806cf3d387f4137e7cd49f39c" UNIQUE ("activityRegistryId", "scheduleId")');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579" FOREIGN KEY ("scheduleId") REFERENCES "horario_atividade"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579"');
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "UQ_72806cf3d387f4137e7cd49f39c"');
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "PK_e0088b38d7cf2dc6ad815d33e7d"');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "PK_cdcc974562552583493dbd64c0c" PRIMARY KEY ("id", "scheduleId")');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "UQ_72806cf3d387f4137e7cd49f39c" UNIQUE ("activityRegistryId", "scheduleId")');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579" FOREIGN KEY ("scheduleId") REFERENCES "horario_atividade"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

}
