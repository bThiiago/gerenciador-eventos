import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description cria coluna "confirmed" na tabela people para marcar quando uma conta
 * confirmou o e-mail.
 * OBS: ESSE CAMPO FOI REMOVIDO NA MANUTENÇÃO FEITA NO 1º SEMESTRE DE 2024, 
 * PORQUE O SERVIDOR DE E-MAIL ERA INEFICIENTE. 
 **/
export class AddColumnConfirmedInPeople1635568440918 implements MigrationInterface {
    name = 'AddColumnConfirmedInPeople1635568440918'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" ADD "confirmed" boolean DEFAULT false');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" DROP COLUMN "confirmed"');
    }

}
