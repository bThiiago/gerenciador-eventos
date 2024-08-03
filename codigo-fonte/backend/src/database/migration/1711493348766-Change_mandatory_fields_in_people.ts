import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * @description alterar campos obrigatórios da tabela people
 **/
export class ChangeMandatoryFieldsInPeople1711493348766 implements MigrationInterface {
    name = 'ChangeMandatoryFieldsInPeople1711493348766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remover a obrigatoriedade dos campos não mais obrigatórios
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cep DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN city DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN uf DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN address DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cellphone DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN level DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN type DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN active DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN phone DROP NOT NULL");
        // Alterar a obrigatoriedade dos campos
        await queryRunner.query("ALTER TABLE people ALTER COLUMN name SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN email SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cpf SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN password SET NOT NULL");
        // Remover o campo confirmed
        await queryRunner.query("ALTER TABLE people DROP COLUMN confirmed");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Inverter as alterações no método down se necessário
        await queryRunner.query("ALTER TABLE people ADD COLUMN confirmed BOOLEAN NOT NULL DEFAULT false");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN name DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN email DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cpf DROP NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN password DROP NOT NULL");
        // Adicionar novamente a obrigatoriedade dos campos não mais obrigatórios
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cep SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN city SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN uf SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN address SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN cellphone SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN level SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN type SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN active SET NOT NULL");
        await queryRunner.query("ALTER TABLE people ALTER COLUMN phone SET NOT NULL");
    }

}
