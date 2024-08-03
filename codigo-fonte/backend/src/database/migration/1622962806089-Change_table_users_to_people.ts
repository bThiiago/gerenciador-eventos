import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criando tabela people que substitui a tabela users
 **/
export class ChangeTableUsersToPeople1622962806089 implements MigrationInterface {
    name = 'ChangeTableUsersToPeople1622962806089'
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Index da tabela antiga de usuários
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" DROP CONSTRAINT "FK_3276cdc95481d2f74d08a29e2ea"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" DROP CONSTRAINT "FK_71fcc3a7f85159c12a6172c9fb3"');
        await queryRunner.query('DROP INDEX "IDX_3276cdc95481d2f74d08a29e2e"');
        await queryRunner.query('DROP INDEX "IDX_71fcc3a7f85159c12a6172c9fb"');

        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "name"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "birthDate"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "nickname"');

        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "email"');

        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_a6235b5ef0939d8deaad755fc87"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cpf"');

        await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "UQ_65964723c91566b00580a6cf222"');
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "cellphone"');

        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "password"');

        //---

        await queryRunner.query('CREATE TYPE "people_level_enum" AS ENUM(\'0\', \'9\')');
        await queryRunner.query('CREATE TABLE "people" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "cpf" character varying(11) NOT NULL, "cellphone" character varying(14) NOT NULL, "birthDate" date NOT NULL, "cep" character varying(8) NOT NULL, "city" character varying(100) NOT NULL, "uf" character varying(2) NOT NULL, "address" character varying(100) NOT NULL, "login" character varying, "password" character varying, "level" "people_level_enum" DEFAULT \'0\', "type" character varying NOT NULL, CONSTRAINT "UQ_c77e8752faa45901af2b245dff2" UNIQUE ("email"), CONSTRAINT "UQ_051da4f26641e2e7986ffc91497" UNIQUE ("cpf"), CONSTRAINT "UQ_500438b7d5acfdfa0a6dcd31626" UNIQUE ("cellphone"), CONSTRAINT "PK_aa866e71353ee94c6cc51059c5b" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE INDEX "IDX_5078849849a24c93fd73b3b698" ON "people" ("type") ');
        await queryRunner.query('CREATE TABLE "event_responsible_users_people" ("eventId" integer NOT NULL, "peopleId" integer NOT NULL, CONSTRAINT "PK_a3d0d33a117727e6ab344364811" PRIMARY KEY ("eventId", "peopleId"))');
        await queryRunner.query('CREATE INDEX "IDX_46f01df0760ac2857515289752" ON "event_responsible_users_people" ("eventId") ');
        await queryRunner.query('CREATE INDEX "IDX_be88e91bcf2909acc71e749591" ON "event_responsible_users_people" ("peopleId") ');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_46f01df0760ac2857515289752a" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" ADD CONSTRAINT "FK_be88e91bcf2909acc71e749591f" FOREIGN KEY ("peopleId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" ADD "birthDate" date NOT NULL');

        await queryRunner.query('ALTER TABLE "user" ADD "name" character varying NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD "nickname" character varying NOT NULL');

        await queryRunner.query('ALTER TABLE "user" ADD "email" character varying NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")');

        await queryRunner.query('ALTER TABLE "user" ADD "password" character varying NOT NULL');

        await queryRunner.query('ALTER TABLE "user" ADD "cpf" character varying(11) NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_a6235b5ef0939d8deaad755fc87" UNIQUE ("cpf")');

        await queryRunner.query('ALTER TABLE "user" ADD "cellphone" character varying(13) NOT NULL');
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_65964723c91566b00580a6cf222" UNIQUE ("cellphone")');

        //----
        await queryRunner.query('CREATE INDEX "IDX_71fcc3a7f85159c12a6172c9fb" ON "event_responsible_users_user" ("eventId") ');
        await queryRunner.query('CREATE INDEX "IDX_3276cdc95481d2f74d08a29e2e" ON "event_responsible_users_user" ("userId") ');

        await queryRunner.query('ALTER TABLE "event_responsible_users_user" ADD CONSTRAINT "FK_71fcc3a7f85159c12a6172c9fb3" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "event_responsible_users_user" ADD CONSTRAINT "FK_3276cdc95481d2f74d08a29e2ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_be88e91bcf2909acc71e749591f"');
        await queryRunner.query('ALTER TABLE "event_responsible_users_people" DROP CONSTRAINT "FK_46f01df0760ac2857515289752a"');
        await queryRunner.query('DROP INDEX "IDX_be88e91bcf2909acc71e749591"');
        await queryRunner.query('DROP INDEX "IDX_46f01df0760ac2857515289752"');
        await queryRunner.query('DROP TABLE "event_responsible_users_people"');
        await queryRunner.query('DROP INDEX "IDX_5078849849a24c93fd73b3b698"');
        await queryRunner.query('DROP TABLE "people"');
        await queryRunner.query('DROP TYPE "people_level_enum"');
    }

}
