import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description apagar a tabela user
 **/
export class DeleteModelUser1623109391284 implements MigrationInterface {
    name = 'DeleteModelUser1623109391284'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "user"');
        await queryRunner.query('DROP TYPE "user_level_enum"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TYPE "user_level_enum" AS ENUM(\'0\', \'9\')');
        await queryRunner.query('CREATE TABLE "user" ("id" SERIAL NOT NULL, "level" "user_level_enum" NOT NULL DEFAULT \'0\', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))');
    }

}
