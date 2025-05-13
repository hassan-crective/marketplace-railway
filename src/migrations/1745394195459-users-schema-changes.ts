import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1745394195459 implements MigrationInterface {
    name = 'UsersSchemaChanges1745394195459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Product" ADD "approvedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Product" DROP COLUMN "approvedAt"`);
    }

}
