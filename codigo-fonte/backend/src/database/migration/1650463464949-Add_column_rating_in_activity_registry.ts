import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description adiciona coluna rating na tabela activity_registry
 **/ 
export class AddColumnRatingInActivityRegistry1650463464949 implements MigrationInterface {
    name = 'AddColumnRatingInActivityRegistry1650463464949'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "activity_registry" ADD COLUMN rating INT NOT NULL DEFAULT 0');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "activity_registry" DROP COLUMN rating');
    }

}
