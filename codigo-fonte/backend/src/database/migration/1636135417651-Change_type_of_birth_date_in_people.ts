import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description muda o tipo da coluna birthdate para timestamp na tabela
 * people
 **/
export class ChangeTypeOfBirthDateInPeople1636135417651 implements MigrationInterface {
    name = 'ChangeTypeOfBirthDateInPeople1636135417651'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" DROP COLUMN "birthDate"');
        await queryRunner.query('ALTER TABLE "people" ADD "birthDate" TIMESTAMP WITH TIME ZONE NOT NULL');
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" DROP COLUMN "birthDate"');
    }

}
