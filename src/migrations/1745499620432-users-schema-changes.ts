import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1745499620432 implements MigrationInterface {
    name = 'UsersSchemaChanges1745499620432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Order" ADD "paymentType" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Order" DROP COLUMN "paymentType"`);
    }

}
