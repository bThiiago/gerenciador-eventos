import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criar tabela activity_category
 **/ 
export class CreateActivityCategory1637194259222 implements MigrationInterface {
    name = 'CreateActivityCategory1637194259222'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "activity_category" ("id" SERIAL NOT NULL, "code" character varying(2) NOT NULL, "description" character varying(200) NOT NULL, CONSTRAINT "UQ_1d5fe47d8b5eafee8c497a0ac14" UNIQUE ("code"), CONSTRAINT "PK_5d3d888450207667a286922f945" PRIMARY KEY ("id"))');
        await queryRunner.query('ALTER TABLE "activity" ADD "activity_category_id" integer NOT NULL');
        await queryRunner.query('ALTER TABLE "activity_registry" ALTER COLUMN "registryDate" SET DEFAULT (\'now\'::text)::date');
        await queryRunner.query('ALTER TABLE "activity" ADD CONSTRAINT "FK_de8b2720ffe6f44335d8dcf0df2" FOREIGN KEY ("activity_category_id") REFERENCES "activity_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" DROP CONSTRAINT "FK_de8b2720ffe6f44335d8dcf0df2"');
        await queryRunner.query('ALTER TABLE "activity_registry" ALTER COLUMN "registryDate" SET DEFAULT \'2021-11-16 19:57:47.162924\'');
        await queryRunner.query('ALTER TABLE "activity" DROP COLUMN "activity_category_id"');
        await queryRunner.query('DROP TABLE "activity_category"');
    }

}
