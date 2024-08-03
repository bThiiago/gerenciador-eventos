import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description adiciona coluna banner na tabela event
 **/ 
export class AddColumnBannerInEvent1650907604264 implements MigrationInterface {
    name = 'AddColumnBannerInEvent1650907604264'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "event" ADD COLUMN banner text NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "event" DROP COLUMN banner');
    }

}
