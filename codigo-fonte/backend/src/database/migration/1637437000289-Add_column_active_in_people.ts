import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adiciona coluna "active"
 * na tabela people
 **/
export class AddColumnActiveInPeople1637437000289 implements MigrationInterface {
    name = 'AddColumnActiveInPeople1637437000289'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" ADD "active" boolean DEFAULT true');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" DROP COLUMN "active"');
    }

}
