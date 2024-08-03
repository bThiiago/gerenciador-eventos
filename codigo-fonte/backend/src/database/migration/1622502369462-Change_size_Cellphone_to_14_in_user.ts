import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description altera tamanho da coluna cellphone para 14 caracteres
 **/
export class ChangeCellphoneSizeTo14InUser1622502369462 implements MigrationInterface {
    name = 'ChangeCellphoneSizeTo14InUser1622502369462'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_65964723c91566b00580a6cf222"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cellphone"');
        await queryRunner.query('ALTER TABLE "user" ADD "cellphone" character varying(14) NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_65964723c91566b00580a6cf222" UNIQUE ("cellphone")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_65964723c91566b00580a6cf222"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cellphone"');
        await queryRunner.query('ALTER TABLE "user" ADD "cellphone" character varying(13) NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_65964723c91566b00580a6cf222" UNIQUE ("cellphone")');
    }

}
