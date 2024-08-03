import {MigrationInterface, QueryRunner} from "typeorm";

/**
 * @description ajustando as constraints de chave estrangeira na tabela "activity", 
 * para garantir que as alterações nas chaves estrangeiras sejam refletidas corretamente em cascata nas 
 * tabelas relacionadas durante as operações de atualização e exclusão (se deletar o evento, deleta a atividade)
 **/
export class CorrectionMakingCascadeInActivity1633540945761 implements MigrationInterface {
    name = 'CorrectionMakingCascadeInActivity1633540945761'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b"`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b"`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
