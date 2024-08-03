import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adiciona colunas "registryStartDate" e "registryEndDate"
 * na tabela event
 **/
export class AddColumnsRegistryStartDateAndRegistryEndDateInEvent1636156282219 implements MigrationInterface {
    name = 'AddColumnsRegistryStartDateAndRegistryEndDateInEvent1636156282219'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" ADD "registryStartDate" TIMESTAMP WITH TIME ZONE NOT NULL');
        await queryRunner.query('ALTER TABLE "event" ADD "registryEndDate" TIMESTAMP WITH TIME ZONE NOT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "registryEndDate"');
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "registryStartDate"');
    }

}
