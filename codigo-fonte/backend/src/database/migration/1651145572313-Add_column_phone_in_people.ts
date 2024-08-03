import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description adiciona coluna phone na tabela people 
 * (salvar telefone residencial)
 **/ 
export class AddColumnPhoneInPeople1651145572313 implements MigrationInterface {
    name = 'AddColumnPhoneInPeople1651145572313'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "people" ADD COLUMN phone text NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "people" DROP COLUMN phone');
    }

}
