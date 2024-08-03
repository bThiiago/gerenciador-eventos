import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description adicionando coluna description na tabela event
 **/
export class AddColumnDescriptionInEvent1629403081420 implements MigrationInterface {
    name = 'AddColumnDescriptionInEvent1629403081420'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ADD "description" text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "description"`);
    }

}
