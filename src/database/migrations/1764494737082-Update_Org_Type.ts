import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateOrgType1764494737082 implements MigrationInterface {
  name = 'UpdateOrgType1764494737082'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum" RENAME TO "organizations_org_type_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum" AS ENUM('PRODUCER', 'RETAILER', 'PROCESSOR', 'AUDITOR')`,
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
      `CREATE TYPE "public"."organizations_org_type_enum_old" AS ENUM('PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR')`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "org_type" TYPE "public"."organizations_org_type_enum_old" USING "org_type"::"text"::"public"."organizations_org_type_enum_old"`,
    )
    await queryRunner.query(`DROP TYPE "public"."organizations_org_type_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum_old" RENAME TO "organizations_org_type_enum"`,
    )
  }
}
