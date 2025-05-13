import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1744023864845 implements MigrationInterface {
    name = 'UsersSchemaChanges1744023864845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "User" ADD "postalCode" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "postalCode"`);
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "city"`);
    }

}
