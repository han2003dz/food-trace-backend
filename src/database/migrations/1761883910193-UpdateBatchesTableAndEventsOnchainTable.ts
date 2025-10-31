import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateBatchesTableAndEventsOnchainTable1761883910193
  implements MigrationInterface
{
  name = 'UpdateBatchesTableAndEventsOnchainTable1761883910193'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "onchain_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_name" character varying NOT NULL, "args" jsonb NOT NULL, "tx_hash" character varying(255) NOT NULL, "block_number" integer NOT NULL, "contract_address" character varying(66) NOT NULL, "batch_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_334196a0f9bbb367609c7c4114b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e68b29ff3cad42af2da7f3a34f" ON "onchain_events" ("event_name") `,
    )
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "product_type"`)
    await queryRunner.query(`COMMENT ON COLUMN "batches"."status" IS NULL`)
    await queryRunner.query(
      `ALTER TABLE "onchain_events" ADD CONSTRAINT "FK_aa6bfd7e9ca38ccfdabd1d9ccfa" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "onchain_events" DROP CONSTRAINT "FK_aa6bfd7e9ca38ccfdabd1d9ccfa"`,
    )
    await queryRunner.query(
      `COMMENT ON COLUMN "batches"."status" IS 'pending | verified | distributed | delivered'`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ADD "product_type" character varying(255)`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e68b29ff3cad42af2da7f3a34f"`,
    )
    await queryRunner.query(`DROP TABLE "onchain_events"`)
  }
}
