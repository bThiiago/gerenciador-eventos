import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adiciona coluna "registryDate" na tabela activity_registry
 **/
export class AddColumnRegistryDateInActivityRegistry1635776625816 implements MigrationInterface {
    name = 'AddColumnRegistryDateInActivityRegistry1635776625816'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" ADD "registryDate" TIMESTAMP NOT NULL DEFAULT \'NOW()\'');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" DROP COLUMN "registryDate"');
    }

}
