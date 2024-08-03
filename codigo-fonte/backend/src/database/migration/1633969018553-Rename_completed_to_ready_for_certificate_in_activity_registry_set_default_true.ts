import {MigrationInterface, QueryRunner} from "typeorm";

export class RenameCompletedToReadyForCertificateInActivityRegistrySetDefaultTrue1633969018553 implements MigrationInterface {
    name = 'RenameCompletedToReadyForCertificateInActivityRegistrySetDefaultTrue1633969018553'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_registry" RENAME COLUMN "completed" TO "readyForCertificate"`);
        await queryRunner.query(`ALTER TABLE "activity_registry" ALTER COLUMN "readyForCertificate" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_registry" ALTER COLUMN "readyForCertificate" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "activity_registry" RENAME COLUMN "readyForCertificate" TO "completed"`);
    }

}
