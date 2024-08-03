import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description cria uma tabela chamada "user" no banco de dados com as colunas id, 
 * firstName, lastName, birthDate e level, onde level é um enum que pode ter os valores 
 * '0' ou '9'. Além disso, define um tipo enum "user_level_enum" para o campo level.
 **/
export class CreateUser1620060054792 implements MigrationInterface {
    name = 'CreateUser1620060054792' 
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TYPE "user_level_enum" AS ENUM(\'0\', \'9\')');
        await queryRunner.query('CREATE TABLE "user" ("id" SERIAL NOT NULL, "firstName" text NOT NULL, "lastName" text NOT NULL, "birthDate" date NOT NULL, "level" "user_level_enum" NOT NULL DEFAULT \'0\', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "user"');
        await queryRunner.query('DROP TYPE "user_level_enum"');
    }

}
