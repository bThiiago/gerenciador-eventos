import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description adiciona coluna icon na tabela event
 **/ 
export class AddColumnIconInEvent1650464079642 implements MigrationInterface {
    name = 'AddColumnIconInEvent1650464079642'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "event" ADD COLUMN icon text NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "event" DROP COLUMN icon');
    }

}
