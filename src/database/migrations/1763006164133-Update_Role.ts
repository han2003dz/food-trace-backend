import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateRole1763006164133 implements MigrationInterface {
  name = 'UpdateRole1763006164133'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" ADD "metadata" jsonb`)
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum" RENAME TO "organizations_org_type_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum" AS ENUM('PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR', 'ADMIN')`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "org_type" TYPE "public"."organizations_org_type_enum" USING "org_type"::"text"::"public"."organizations_org_type_enum"`,
    )
    await queryRunner.query(
      `DROP TYPE "public"."organizations_org_type_enum_old"`,
    )
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR', 'ADMIN', 'CONSUMER')`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CONSUMER'`,
    )
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum_old" AS ENUM('ADMIN', 'MANAGER', 'MEMBER')`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`,
    )
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum_old" AS ENUM('FARM', 'PROCESSOR', 'LOGISTICS', 'RETAILER', 'AUDITOR', 'ADMIN')`,
    )
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "org_type" TYPE "public"."organizations_org_type_enum_old" USING "org_type"::"text"::"public"."organizations_org_type_enum_old"`,
    )
    await queryRunner.query(`DROP TYPE "public"."organizations_org_type_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."organizations_org_type_enum_old" RENAME TO "organizations_org_type_enum"`,
    )
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "metadata"`)
  }
}
