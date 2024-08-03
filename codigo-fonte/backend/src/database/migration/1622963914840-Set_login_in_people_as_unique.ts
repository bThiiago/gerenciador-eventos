import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description definindo que o login é UNIQUE
 **/
export class SetLoginInPeopleAsUnique1622963914840 implements MigrationInterface {
    name = 'SetLoginInPeopleAsUnique1622963914840'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" ADD CONSTRAINT "UQ_bc532b202e80f7235d925e79b47" UNIQUE ("login")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "people" DROP CONSTRAINT "UQ_bc532b202e80f7235d925e79b47"');
    }

}
