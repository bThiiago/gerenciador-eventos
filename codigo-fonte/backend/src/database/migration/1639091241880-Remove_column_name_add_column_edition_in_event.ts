import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description remove a coluna "name" e adiciona a coluna "edition"
 * na tabela event
 **/ 
export class RemoveColumnNameAddColumnEditionInEvent1639091241880 implements MigrationInterface {
    name = 'RemoveColumnNameAddColumnEditionInEvent1639091241880'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "name"');
        await queryRunner.query('ALTER TABLE "event" ADD "edition" integer NOT NULL');
        await queryRunner.query('CREATE TYPE "event_display_enum" AS ENUM(\'0\', \'1\', \'2\', \'9\')');
        await queryRunner.query('ALTER TABLE "event" ADD "display" "event_display_enum" NOT NULL');
        await queryRunner.query('CREATE TYPE "event_editiondisplay_enum" AS ENUM(\'0\', \'1\', \'2\')');
        await queryRunner.query('ALTER TABLE "event" ADD "editionDisplay" "event_editiondisplay_enum" NOT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "editionDisplay"');
        await queryRunner.query('DROP TYPE "event_editiondisplay_enum"');
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "display"');
        await queryRunner.query('DROP TYPE "event_display_enum"');
        await queryRunner.query('ALTER TABLE "event" DROP COLUMN "edition"');
        await queryRunner.query('ALTER TABLE "event" ADD "name" character varying(100) NOT NULL');
    }

}
