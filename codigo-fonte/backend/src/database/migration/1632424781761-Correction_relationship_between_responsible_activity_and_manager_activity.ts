import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description corrigir relacionamento entre as tabelas responsible_activity e manager_activity
 **/ 
export class CorrectionRelationshipBetweenResponsibleActivityAndManagerActivity1632424781761 implements MigrationInterface {
    name = 'CorrectionRelationshipBetweenResponsibleActivityAndManagerActivity1632424781761'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_727e2255e1000160b90a903ff4d"');
        await queryRunner.query('ALTER TABLE "manager_activity" DROP CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde"');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_727e2255e1000160b90a903ff4d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "manager_activity" ADD CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "manager_activity" DROP CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde"');
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_727e2255e1000160b90a903ff4d"');
        await queryRunner.query('ALTER TABLE "manager_activity" ADD CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_727e2255e1000160b90a903ff4d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

}
  