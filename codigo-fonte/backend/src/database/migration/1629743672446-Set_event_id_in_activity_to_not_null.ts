import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description define a coluna eventId da tabela activity como NOT NULL
 **/ 
export class SetEventIdInActivityToNotNull1629743672446 implements MigrationInterface {
    name = 'SetEventIdInActivityToNotNull1629743672446'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "room" DROP CONSTRAINT "FK_6d047f307c061d2e8efa5242375"');
        await queryRunner.query('ALTER TABLE "horario_atividade" DROP CONSTRAINT "FK_b2f5e4f5034049934271e725fc8"');
        await queryRunner.query('ALTER TABLE "room" DROP COLUMN "schedulesId"');
        await queryRunner.query('ALTER TABLE "horario_atividade" ADD "roomId" integer');
        await queryRunner.query('ALTER TABLE "activity" DROP CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b"');
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "eventId" SET NOT NULL');
        await queryRunner.query('ALTER TABLE "horario_atividade" ADD CONSTRAINT "FK_f97ab05f5708092318a599b8546" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "horario_atividade" ADD CONSTRAINT "FK_b2f5e4f5034049934271e725fc8" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity" ADD CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" DROP CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b"');
        await queryRunner.query('ALTER TABLE "horario_atividade" DROP CONSTRAINT "FK_b2f5e4f5034049934271e725fc8"');
        await queryRunner.query('ALTER TABLE "horario_atividade" DROP CONSTRAINT "FK_f97ab05f5708092318a599b8546"');
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "eventId" DROP NOT NULL');
        await queryRunner.query('ALTER TABLE "activity" ADD CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "horario_atividade" DROP COLUMN "roomId"');
        await queryRunner.query('ALTER TABLE "room" ADD "schedulesId" integer');
        await queryRunner.query('ALTER TABLE "horario_atividade" ADD CONSTRAINT "FK_b2f5e4f5034049934271e725fc8" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "room" ADD CONSTRAINT "FK_6d047f307c061d2e8efa5242375" FOREIGN KEY ("schedulesId") REFERENCES "horario_atividade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

}
