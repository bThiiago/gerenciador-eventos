import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description removendo valor padrão (default) para a coluna description na tabela event
 **/
export class RemoveDefaultValueFromDescriptionInEvent1629403149715 implements MigrationInterface {
    name = 'RemoveDefaultValueFromDescriptionInEvent1629403149715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "description" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "description" SET DEFAULT ''`);
    }

}
