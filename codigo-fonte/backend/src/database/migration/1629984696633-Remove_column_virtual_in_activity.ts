import {MigrationInterface, QueryRunner} from 'typeorm';
/**
 * @description remove coluna "virtual" da tabela activity
 **/ 
export class RemoveColumnVirtualInActivity1629984696633 implements MigrationInterface {
    name = 'RemoveColumnVirtualInActivity1629984696633'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" DROP COLUMN "virtual"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ADD "virtual" boolean NOT NULL');
    }

}
