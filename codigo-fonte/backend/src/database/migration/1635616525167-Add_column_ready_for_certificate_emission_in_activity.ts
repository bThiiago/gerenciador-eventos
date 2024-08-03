import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adiciona coluna "readyForCertificateEmission" na tabela
 * activity
 **/
export class AddColumnReadyForCertificateEmissionInActivity1635616525167 implements MigrationInterface {
    name = 'AddColumnReadyForCertificateEmissionInActivity1635616525167'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ADD "readyForCertificateEmission" boolean NOT NULL DEFAULT false');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" DROP COLUMN "readyForCertificateEmission"');
    }

}
