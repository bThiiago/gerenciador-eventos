import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * @description ajustando tamanhos das colunas que são varchar
 **/

export class ChangeLimitsOfVarcharColumns1635367001988 implements MigrationInterface {
    name = 'ChangeLimitsOfVarcharColumns1635367001988'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event_category" ALTER COLUMN "category" type character varying(80)');
        await queryRunner.query('ALTER TABLE "event_category" ALTER COLUMN "url_src" type character varying(20)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "name" type character varying(150)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "email" type character varying(120)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "cellphone" type character varying(16)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "city" type character varying(120)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "address" type character varying(120)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "login" type character varying(120)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "password" type character varying(60)');
        await queryRunner.query('ALTER TABLE "event" ALTER COLUMN "name" type character varying(100)');
        await queryRunner.query('ALTER TABLE "event" ALTER COLUMN "description" type character varying(5000)');
        await queryRunner.query('ALTER TABLE "room" ALTER COLUMN "code" type character varying(100)');
        await queryRunner.query('ALTER TABLE "horario_atividade" ALTER COLUMN "url" type character varying(300)');
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "title" type character varying(100)');
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "description" type character varying(1500)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "description" type character varying');
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "title" type character varying');
        await queryRunner.query('ALTER TABLE "horario_atividade" ALTER COLUMN "url" type character varying');
        await queryRunner.query('ALTER TABLE "room" ALTER COLUMN "code" type character varying');
        await queryRunner.query('ALTER TABLE "event" ALTER COLUMN "description" type text');
        await queryRunner.query('ALTER TABLE "event" ALTER COLUMN "name" type character varying');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "password" type character varying');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "login" type character varying');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "address" type character varying(100)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "city" type character varying(100)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "city" type character varying(100)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "cellphone" type character varying(14)');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "email" type character varying');
        await queryRunner.query('ALTER TABLE "people" ALTER COLUMN "name" type character varying');
        await queryRunner.query('ALTER TABLE "event_category" ALTER COLUMN "url_src" type character varying');
        await queryRunner.query('ALTER TABLE "event_category" ALTER COLUMN "category" type character varying');
    }
}
