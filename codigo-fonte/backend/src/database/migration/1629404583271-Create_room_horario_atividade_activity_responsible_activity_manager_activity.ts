import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criar tabelas room, horario_atividade, activity, responsible_activity e manager_activity
 **/ 
export class CreateRoomHorarioAtividadeActivityResponsibleActivityManagerActivity1629404583271 implements MigrationInterface {
    name = 'CreateRoomHorarioAtividadeActivityResponsibleActivityManagerActivity1629404583271'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_46f01df0760ac2857515289752a"');
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_be88e91bcf2909acc71e749591f"');
        await queryRunner.query('DROP INDEX "IDX_46f01df0760ac2857515289752"');
        await queryRunner.query('DROP INDEX "IDX_be88e91bcf2909acc71e749591"');
        await queryRunner.query('CREATE TABLE "room" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "capacity" integer NOT NULL, "schedulesId" integer, CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE TABLE "horario_atividade" ("id" SERIAL NOT NULL, "startDate" TIMESTAMP NOT NULL, "durationInMinutes" integer NOT NULL, "url" character varying, "activityId" integer, CONSTRAINT "PK_f16f49abb5c0fa5433d1812d146" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE TABLE "activity" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "vacancy" integer NOT NULL, "virtual" boolean NOT NULL, "workloadInMinutes" integer NOT NULL, "eventId" integer, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE TABLE "responsible_activity" ("peopleId" integer NOT NULL, "activityId" integer NOT NULL, CONSTRAINT "PK_6f679a89e8f93b088d137e9161c" PRIMARY KEY ("peopleId", "activityId"))');
        await queryRunner.query('CREATE INDEX "IDX_727e2255e1000160b90a903ff4" ON "responsible_activity" ("peopleId") ');
        await queryRunner.query('CREATE INDEX "IDX_09d4b8b352c95323c0f6ec03f5" ON "responsible_activity" ("activityId") ');
        await queryRunner.query('CREATE TABLE "manager_activity" ("peopleId" integer NOT NULL, "activityId" integer NOT NULL, CONSTRAINT "PK_b44890857257150a3a46d7a9665" PRIMARY KEY ("peopleId", "activityId"))');
        await queryRunner.query('CREATE INDEX "IDX_7474d0c7f542dec2448f1d0ddd" ON "manager_activity" ("peopleId") ');
        await queryRunner.query('CREATE INDEX "IDX_de22992189308e4aeffcf6d70f" ON "manager_activity" ("activityId") ');
        await queryRunner.query('CREATE INDEX "IDX_535ce4d3dbe30c46e4f1a7af01" ON "organizer_event" ("peopleId") ');
        await queryRunner.query('CREATE INDEX "IDX_09f29adda9f394a1e18b4c2c12" ON "organizer_event" ("eventId") ');
        await queryRunner.query('ALTER TABLE "room" ADD CONSTRAINT "FK_6d047f307c061d2e8efa5242375" FOREIGN KEY ("schedulesId") REFERENCES "horario_atividade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "horario_atividade" ADD CONSTRAINT "FK_b2f5e4f5034049934271e725fc8" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity" ADD CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_09f29adda9f394a1e18b4c2c123" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_727e2255e1000160b90a903ff4d" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "responsible_activity" ADD CONSTRAINT "FK_09d4b8b352c95323c0f6ec03f5b" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "manager_activity" ADD CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "manager_activity" ADD CONSTRAINT "FK_de22992189308e4aeffcf6d70f6" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "manager_activity" DROP CONSTRAINT "FK_de22992189308e4aeffcf6d70f6"');
        await queryRunner.query('ALTER TABLE "manager_activity" DROP CONSTRAINT "FK_7474d0c7f542dec2448f1d0ddde"');
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_09d4b8b352c95323c0f6ec03f5b"');
        await queryRunner.query('ALTER TABLE "responsible_activity" DROP CONSTRAINT "FK_727e2255e1000160b90a903ff4d"');
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_09f29adda9f394a1e18b4c2c123"');
        await queryRunner.query('ALTER TABLE "organizer_event" DROP CONSTRAINT "FK_535ce4d3dbe30c46e4f1a7af01d"');
        await queryRunner.query('ALTER TABLE "activity" DROP CONSTRAINT "FK_12c101cb84aae626b8f4cd30f5b"');
        await queryRunner.query('ALTER TABLE "horario_atividade" DROP CONSTRAINT "FK_b2f5e4f5034049934271e725fc8"');
        await queryRunner.query('ALTER TABLE "room" DROP CONSTRAINT "FK_6d047f307c061d2e8efa5242375"');
        await queryRunner.query('DROP INDEX "IDX_09f29adda9f394a1e18b4c2c12"');
        await queryRunner.query('DROP INDEX "IDX_535ce4d3dbe30c46e4f1a7af01"');
        await queryRunner.query('DROP INDEX "IDX_de22992189308e4aeffcf6d70f"');
        await queryRunner.query('DROP INDEX "IDX_7474d0c7f542dec2448f1d0ddd"');
        await queryRunner.query('DROP TABLE "manager_activity"');
        await queryRunner.query('DROP INDEX "IDX_09d4b8b352c95323c0f6ec03f5"');
        await queryRunner.query('DROP INDEX "IDX_727e2255e1000160b90a903ff4"');
        await queryRunner.query('DROP TABLE "responsible_activity"');
        await queryRunner.query('DROP TABLE "activity"');
        await queryRunner.query('DROP TABLE "horario_atividade"');
        await queryRunner.query('DROP TABLE "room"');
        await queryRunner.query('CREATE INDEX "IDX_be88e91bcf2909acc71e749591" ON "organizer_event" ("peopleId") ');
        await queryRunner.query('CREATE INDEX "IDX_46f01df0760ac2857515289752" ON "organizer_event" ("eventId") ');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_be88e91bcf2909acc71e749591f" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE');
        await queryRunner.query('ALTER TABLE "organizer_event" ADD CONSTRAINT "FK_46f01df0760ac2857515289752a" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE');
    }

}
