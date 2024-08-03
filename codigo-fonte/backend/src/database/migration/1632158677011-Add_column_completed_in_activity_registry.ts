import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description adicionar coluna completed na tabela activity_registry 
 * (define se a atividade já ocorreu)
 **/ 
export class AddColumnCompletedInActivityRegistry1632158677011 implements MigrationInterface {
    name = 'AddColumnCompletedInActivityRegistry1632158677011'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" ADD "completed" boolean NOT NULL DEFAULT false');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" DROP COLUMN "completed"');
    }

}
