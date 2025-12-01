import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransferTable1764626230674 implements MigrationInterface {
  name = 'AddTransferTable1764626230674'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."batch_transfers_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "batch_transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."batch_transfers_status_enum" NOT NULL DEFAULT 'PENDING', "note" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid, "from_org_id" uuid, "to_org_id" uuid, "initiator_user_id" uuid, CONSTRAINT "PK_146294ed493732a71c8e05ddbd1" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" ADD CONSTRAINT "FK_04ea8490b5e516af15fc8a98980" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" ADD CONSTRAINT "FK_144ac87d61c99f75716aa25777b" FOREIGN KEY ("from_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" ADD CONSTRAINT "FK_e9cbbf72681d5b9d19ef3606700" FOREIGN KEY ("to_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" ADD CONSTRAINT "FK_efa6890d68e826e4421ef583c52" FOREIGN KEY ("initiator_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" DROP CONSTRAINT "FK_efa6890d68e826e4421ef583c52"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" DROP CONSTRAINT "FK_e9cbbf72681d5b9d19ef3606700"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" DROP CONSTRAINT "FK_144ac87d61c99f75716aa25777b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_transfers" DROP CONSTRAINT "FK_04ea8490b5e516af15fc8a98980"`,
    )
    await queryRunner.query(`DROP TABLE "batch_transfers"`)
    await queryRunner.query(`DROP TYPE "public"."batch_transfers_status_enum"`)
  }
}
