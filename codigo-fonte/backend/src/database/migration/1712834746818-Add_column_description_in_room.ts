import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * @description alterar tabela Room para seguir o novo padrão de nome das salas
 * Exemplo: Code: A210, Description: Laboratório de Informática, Capacity: 20
 * a coluna "code" passa a ter 4 caracteres e a coluna description é criada.
 * não há alteração na coluna capacity
 **/
export class AddColumnDescriptionInRoom1712834746818 implements MigrationInterface {
    name = 'AddColumnDescriptionInRoom1712834746818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "room" ADD COLUMN description varchar(50) NOT NULL');
        queryRunner.query('ALTER TABLE "room" ALTER COLUMN code TYPE varchar(4)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query('ALTER TABLE "room" DROP COLUMN description');
        queryRunner.query('ALTER TABLE "room" ALTER COLUMN code TYPE varchar(100)');
    }

}
