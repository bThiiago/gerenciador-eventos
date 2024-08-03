import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description remove as colunas "firstname" e "lastname" da tabela usuário. Adiciona as 
 * colunas "name", "nickname", "email", "cpf", e "cellphone"
 **/
export class MultipleChanges implements MigrationInterface {
    name = 'ChangeFirstnameLastnameToName-AddNicknameEmailCpfCellphone1620076880519'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "firstName"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "lastName"');
        await queryRunner.query('ALTER TABLE "user" ADD "name" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD "nickname" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD "email" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")');
        await queryRunner.query('ALTER TABLE "user" ADD "cpf" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_a6235b5ef0939d8deaad755fc87" UNIQUE ("cpf")');
        await queryRunner.query('ALTER TABLE "user" ADD "cellphone" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_65964723c91566b00580a6cf222" UNIQUE ("cellphone")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_65964723c91566b00580a6cf222"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cellphone"');
        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_a6235b5ef0939d8deaad755fc87"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cpf"');
        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "email"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "nickname"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "name"');
        await queryRunner.query('ALTER TABLE "user" ADD "lastName" text NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD "firstName" text NOT NULL');
    }

}
