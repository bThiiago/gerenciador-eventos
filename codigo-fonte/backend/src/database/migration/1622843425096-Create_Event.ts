import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criar a tabela evento
 **/
export class CreateEvent1622843425096 implements MigrationInterface {
    name = 'CreateEvent1622843425096'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "event" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, "areaCurso" character varying NOT NULL, "statusVisible" boolean NOT NULL DEFAULT false, "statusActive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE TABLE "event_responsible_users_user" ("eventId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_fc4fbed41ed6a2db19964e1a21b" PRIMARY KEY ("eventId", "userId"))');
        await queryRunner.query('CREATE INDEX "IDX_71fcc3a7f85159c12a6172c9fb" ON "event_responsible_users_user" ("eventId") ');
        await queryRunner.query('CREATE INDEX "IDX_3276cdc95481d2f74d08a29e2e" ON "event_responsible_users_user" ("userId") ');
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" ADD CONSTRAINT "FK_71fcc3a7f85159c12a6172c9fb3" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" ADD CONSTRAINT "FK_3276cdc95481d2f74d08a29e2ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" DROP CONSTRAINT "FK_3276cdc95481d2f74d08a29e2ea"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" DROP CONSTRAINT "FK_71fcc3a7f85159c12a6172c9fb3"');
        await queryRunner.query('DROP INDEX "IDX_3276cdc95481d2f74d08a29e2e"');
        await queryRunner.query('DROP INDEX "IDX_71fcc3a7f85159c12a6172c9fb"');
        await queryRunner.query('DROP TABLE "event_responsible_users_user"');
        await queryRunner.query('DROP TABLE "event"');
    } 

}
