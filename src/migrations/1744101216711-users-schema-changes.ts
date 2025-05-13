import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1744101216711 implements MigrationInterface {
    name = 'UsersSchemaChanges1744101216711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."OrderInvoice_orderinvoice_enum" RENAME TO "OrderInvoice_orderinvoice_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."OrderInvoice_orderinvoice_enum" AS ENUM('pending', 'approved', 'rejected', 'submitted')`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" TYPE "public"."OrderInvoice_orderinvoice_enum" USING "orderInvoice"::"text"::"public"."OrderInvoice_orderinvoice_enum"`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."OrderInvoice_orderinvoice_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."OrderInvoice_orderinvoice_enum_old" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" TYPE "public"."OrderInvoice_orderinvoice_enum_old" USING "orderInvoice"::"text"::"public"."OrderInvoice_orderinvoice_enum_old"`);
        await queryRunner.query(`ALTER TABLE "OrderInvoice" ALTER COLUMN "orderInvoice" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."OrderInvoice_orderinvoice_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."OrderInvoice_orderinvoice_enum_old" RENAME TO "OrderInvoice_orderinvoice_enum"`);
    }

}
