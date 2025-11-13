import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateProductTable1763022551124 implements MigrationInterface {
  name = 'UpdateProductTable1763022551124'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "origin" character varying(255)`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD "producer_name" character varying(255)`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD "manufacture_date" date`,
    )
    await queryRunner.query(`ALTER TABLE "products" ADD "expiry_date" date`)
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum" RENAME TO "organizations_org_type_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum" AS ENUM('PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR')`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "org_type" TYPE "public"."organizations_org_type_enum" USING "org_type"::"text"::"public"."organizations_org_type_enum"`,
    )
    await queryRunner.query(
      `DROP TYPE "public"."organizations_org_type_enum_old"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum_old" AS ENUM('PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR', 'ADMIN')`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "org_type" TYPE "public"."organizations_org_type_enum_old" USING "org_type"::"text"::"public"."organizations_org_type_enum_old"`,
    )
    await queryRunner.query(`DROP TYPE "public"."organizations_org_type_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum_old" RENAME TO "organizations_org_type_enum"`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "expiry_date"`)
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "manufacture_date"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "producer_name"`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "origin"`)
  }
}
