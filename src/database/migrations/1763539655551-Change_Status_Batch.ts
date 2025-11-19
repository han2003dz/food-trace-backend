import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeStatusBatch1763539655551 implements MigrationInterface {
  name = 'ChangeStatusBatch1763539655551'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."batches_status_enum" RENAME TO "batches_status_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batches_status_enum" AS ENUM('CREATED', 'PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" TYPE "public"."batches_status_enum" USING "status"::"text"::"public"."batches_status_enum"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'CREATED'`,
    )
    await queryRunner.query(`DROP TYPE "public"."batches_status_enum_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."batches_status_enum_old" AS ENUM('HARVESTED', 'PROCESSED', 'IN_TRANSIT', 'WAREHOUSE', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" TYPE "public"."batches_status_enum_old" USING "status"::"text"::"public"."batches_status_enum_old"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'HARVESTED'`,
    )
    await queryRunner.query(`DROP TYPE "public"."batches_status_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."batches_status_enum_old" RENAME TO "batches_status_enum"`,
    )
  }
}
