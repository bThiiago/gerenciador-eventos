import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePhone1713728135709 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "people" DROP COLUMN phone');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "people" ADD COLUMN phone text NULL');
    }

}
