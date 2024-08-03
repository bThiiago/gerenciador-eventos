import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description tornar campo code na tabela room UNIQUE
 **/ 
export class SetCodeInRoomAsUnique1632422869010 implements MigrationInterface {
    name = 'SetCodeInRoomAsUnique1632422869010'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "room" ADD CONSTRAINT "UQ_0ab3536ee398cffd79acd2803cb" UNIQUE ("code")');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "room" DROP CONSTRAINT "UQ_0ab3536ee398cffd79acd2803cb"');
    }

}
