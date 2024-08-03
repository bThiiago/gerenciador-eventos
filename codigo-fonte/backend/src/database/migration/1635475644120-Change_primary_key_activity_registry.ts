import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * @description alterando a tabela "activity_registry" ao adicionar uma nova coluna chamada "id" 
 * como um tipo serial e não nula. Em seguida, ela modifica a restrição de chave primária ao 
 * descartar a existente, criar uma nova restrição de chave primária nas colunas "userId," 
 * "activityId," e "id," e define isso como a chave primária. 
 **/
export class ChangePrimaryKeyActivityRegistry1635475644120 implements MigrationInterface {
    name = 'ChangePrimaryKeyActivityRegistry1635475644120'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" ADD "id" SERIAL NOT NULL');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_8d7b84222e6ee7d8cbbe29865e7"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_b1e958dcdc236b28474e2fdb1da" PRIMARY KEY ("userId", "activityId", "id")');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_b1e958dcdc236b28474e2fdb1da"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_02df8b1f14b74f7c0883be3b4a0" PRIMARY KEY ("activityId", "id")');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_02df8b1f14b74f7c0883be3b4a0"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_8f27d41e9a876d7d28b261fc50f" PRIMARY KEY ("id")');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "UQ_8d7b84222e6ee7d8cbbe29865e7" UNIQUE ("userId", "activityId")');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6" FOREIGN KEY ("userId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "UQ_8d7b84222e6ee7d8cbbe29865e7"');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_8f27d41e9a876d7d28b261fc50f"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_02df8b1f14b74f7c0883be3b4a0" PRIMARY KEY ("activityId", "id")');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_02df8b1f14b74f7c0883be3b4a0"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_b1e958dcdc236b28474e2fdb1da" PRIMARY KEY ("userId", "activityId", "id")');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_bae3e0abdf0149ad7a3a8121830" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "FK_b5ee2c4805b46e584e870dcdbf6" FOREIGN KEY ("userId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP CONSTRAINT "PK_b1e958dcdc236b28474e2fdb1da"');
        await queryRunner.query('ALTER TABLE "activity_registry" ADD CONSTRAINT "PK_8d7b84222e6ee7d8cbbe29865e7" PRIMARY KEY ("userId", "activityId")');
        await queryRunner.query('ALTER TABLE "activity_registry" DROP COLUMN "id"');
    }

}
