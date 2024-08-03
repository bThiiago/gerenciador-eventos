import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description criar tabela activity_registry para registrar inscrições nas atividades
 **/ 
export class CreateActivtyRegistry1631814122869 implements MigrationInterface {
    name = 'CreateActivtyRegistry1631814122869'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "activity_registry" ("userId" integer NOT NULL, "activityId" integer NOT NULL, CONSTRAINT "PK_8d7b84222e6ee7d8cbbe29865e7" PRIMARY KEY ("userId", "activityId"))');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6" FOREIGN KEY ("userId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6"');
        await queryRunner.query('DROP TABLE "activity_registry"');
    }

}
