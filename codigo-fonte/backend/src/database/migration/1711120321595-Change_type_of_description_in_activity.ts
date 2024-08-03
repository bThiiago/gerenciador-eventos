import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * @description muda o tipo da coluna description para text na tabela
 * activity. Foi feito isso para aumentar o número de caracteres
 * que pode ser escrito na descrição. 
 * (Era 1.500, agora é 5.000)
 **/
export class ChangeTypeOfDescriptionInActivity1711120321595 implements MigrationInterface {
    name = 'ChangeTypeOfDescriptionInActivity1711120321595'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "description" TYPE text');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity" ALTER COLUMN "description" TYPE character varying(1500)');
    }

}
