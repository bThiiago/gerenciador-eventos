import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description renomear coluna areaCurso para area na tabela event
 **/
export class RenameColumnAreaCourseToAreaInEvent1623194627070 implements MigrationInterface {
    name = 'RenameColumnAreaCourseToAreaInEvent1623194627070'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" RENAME COLUMN "areaCurso" TO "area"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event" RENAME COLUMN "area" TO "areaCurso"');
    }

}
