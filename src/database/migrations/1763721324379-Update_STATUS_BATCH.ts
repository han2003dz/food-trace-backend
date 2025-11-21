import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateSTATUSBATCH1763721324379 implements MigrationInterface {
  name = 'UpdateSTATUSBATCH1763721324379'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."batch_events_event_type_enum" RENAME TO "batch_events_event_type_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batch_events_event_type_enum" AS ENUM('CREATED', 'PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED', 'SOLD', 'RECALLED', 'CUSTOM')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" ALTER COLUMN "event_type" TYPE "public"."batch_events_event_type_enum" USING "event_type"::"text"::"public"."batch_events_event_type_enum"`,
    )
    await queryRunner.query(
      `DROP TYPE "public"."batch_events_event_type_enum_old"`,
    )
    await queryRunner.query(
      `ALTER TYPE "public"."batches_status_enum" RENAME TO "batches_status_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batches_status_enum" AS ENUM('HARVESTED', 'PROCESSED', 'IN_TRANSIT', 'WAREHOUSE', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" TYPE "public"."batches_status_enum" USING "status"::"text"::"public"."batches_status_enum"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'HARVESTED'`,
    )
    await queryRunner.query(`DROP TYPE "public"."batches_status_enum_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."batches_status_enum_old" AS ENUM('CREATED', 'PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" TYPE "public"."batches_status_enum_old" USING "status"::"text"::"public"."batches_status_enum_old"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'CREATED'`,
    )
    await queryRunner.query(`DROP TYPE "public"."batches_status_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."batches_status_enum_old" RENAME TO "batches_status_enum"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batch_events_event_type_enum_old" AS ENUM('CREATED', 'PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" ALTER COLUMN "event_type" TYPE "public"."batch_events_event_type_enum_old" USING "event_type"::"text"::"public"."batch_events_event_type_enum_old"`,
    )
    await queryRunner.query(`DROP TYPE "public"."batch_events_event_type_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."batch_events_event_type_enum_old" RENAME TO "batch_events_event_type_enum"`,
    )
  }
}
