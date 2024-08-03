import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * @description criar tabela event_area e remover a coluna "area"
 * na tabela evento. Agora a área do evento é definida pela coluna
 * event_area_id, com chave estrangeira da tabela area
 **/ 
export class CreateEventArea1693363906650 implements MigrationInterface {
    name = 'CreateEventArea1693363906650'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" RENAME COLUMN "area" TO "event_area_id"`);
        await queryRunner.query(`CREATE TABLE "event_area" ("id" SERIAL NOT NULL, "name" character varying(80) NOT NULL, "sigla" character varying(20) NOT NULL, CONSTRAINT "UQ_921898c89d14169cbd60b71aa11" UNIQUE ("sigla"), CONSTRAINT "PK_6ac6576bdc1e84548ba71c5f2f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "people" ADD "phone" character varying(15)`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "event_area_id"`);
        await queryRunner.query(`ALTER TABLE "event" ADD "event_area_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_29a8ac6284590f16bebb25db97e" FOREIGN KEY ("event_area_id") REFERENCES "event_area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_29a8ac6284590f16bebb25db97e"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "event_area_id"`);
        await queryRunner.query(`ALTER TABLE "event" ADD "event_area_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "people" ADD "phone" text`);
        await queryRunner.query(`DROP TABLE "event_area"`);
        await queryRunner.query(`ALTER TABLE "event" RENAME COLUMN "event_area_id" TO "area"`);
    }

}
