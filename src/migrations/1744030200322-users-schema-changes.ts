import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1744030200322 implements MigrationInterface {
    name = 'UsersSchemaChanges1744030200322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "otp"`);
        await queryRunner.query(`ALTER TABLE "User" ADD "otp" character varying(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "otp"`);
        await queryRunner.query(`ALTER TABLE "User" ADD "otp" integer`);
    }

}
