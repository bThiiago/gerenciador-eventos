import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description ajustando as constraints de chave estrangeira na tabela "organizer_event", 
 * para garantir que as alterações nas chaves estrangeiras sejam refletidas corretamente em cascata nas 
 * tabelas relacionadas durante as operações de atualização e exclusão 
 **/
export class CorrectionMakingCascadeInOrganizerEvent1635471639356 implements MigrationInterface {
    name = 'CorrectionMakingCascadeInOrganizerEvent1635471639356'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d"');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d"');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

}
