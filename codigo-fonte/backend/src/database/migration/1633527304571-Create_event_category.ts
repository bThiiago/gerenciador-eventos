import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criar tabela event_category
 **/ 
export class CreateEventCategory1633527304571 implements MigrationInterface {
    name = 'CreateEventCategory1633527304571'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_727e2255e1000160b90a903ff4d"');
        await queryRunner.query('CREATE TABLE "event_category" ("id" SERIAL NOT NULL, "category" character varying NOT NULL, "url_src" character varying NOT NULL, CONSTRAINT "UQ_d68a573701d4288f3e75455097b" UNIQUE ("url_src"), CONSTRAINT "PK_697909a55bde1b28a90560f3ae2" PRIMARY KEY ("id"))');
        await queryRunner.query('ALTER TABLE "event" ADD "event_category_id" integer NOT NULL');
        await queryRunner.query('ALTER TABLE "event" ADD CONSTRAINT "FK_1e84f18012ead322f32a7213c77" FOREIGN KEY ("event_category_id") REFERENCES "event_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_727e2255e1000160b90a903ff4d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_727e2255e1000160b90a903ff4d"');
        await queryRunner.query('ALTER TABLE "event" DROP CONSTRAINT "FK_1e84f18012ead322f32a7213c77"');
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "event_category_id"');
        await queryRunner.query('DROP TABLE "event_category"');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_727e2255e1000160b90a903ff4d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

}
