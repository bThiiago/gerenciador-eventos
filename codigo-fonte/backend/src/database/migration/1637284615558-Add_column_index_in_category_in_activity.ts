import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adiciona coluna "indexInCategory"
 * na tabela activity
 **/
export class AddColumnIndexInCategoryInActivity1637284615558 implements MigrationInterface {
    name = 'AddColumnIndexInCategoryInActivity1637284615558'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ADD "indexInCategory" integer NOT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" DROP COLUMN "indexInCategory"');
    }

}
