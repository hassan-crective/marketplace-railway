import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1744029018223 implements MigrationInterface {
    name = 'UsersSchemaChanges1744029018223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "otp"`);
        await queryRunner.query(`ALTER TABLE "User" ADD "otp" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "otp"`);
        await queryRunner.query(`ALTER TABLE "User" ADD "otp" integer`);
    }

}
