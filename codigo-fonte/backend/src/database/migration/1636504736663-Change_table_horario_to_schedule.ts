import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description mudando nome da tabela horario para shedule
 **/
export class ChangeTableHorarioToSchedule1636504736663 implements MigrationInterface {
    name = 'ChangeTableHorarioToSchedule1636504736663'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579"');
        await queryRunner.query('CREATE TABLE "schedule" ("id" SERIAL NOT NULL, "startDate" TIMESTAMP NOT NULL, "durationInMinutes" integer NOT NULL, "url" character varying(300), "roomId" integer, "activityId" integer, CONSTRAINT "PK_1c05e42aec7371641193e180046" PRIMARY KEY ("id"))');
        await queryRunner.query('ALTER TABLE "schedule" ADD CONSTRAINT "FK_d2fd722dce1cb2d6f458f0fe446" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "schedule" ADD CONSTRAINT "FK_f108274ba8c03c91a17a971b8ed" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    
        await queryRunner.query('DROP TABLE "horario_atividade"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "presence" DROP CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579"');
        await queryRunner.query('ALTER TABLE "schedule" DROP CONSTRAINT "FK_f108274ba8c03c91a17a971b8ed"');
        await queryRunner.query('ALTER TABLE "schedule" DROP CONSTRAINT "FK_d2fd722dce1cb2d6f458f0fe446"');
        await queryRunner.query('DROP TABLE "schedule"');
        await queryRunner.query('ALTER TABLE "presence" ADD CONSTRAINT "FK_e59fcb8d1428dd5930dfc15f579" FOREIGN KEY ("scheduleId") REFERENCES "horario_atividade"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

}
