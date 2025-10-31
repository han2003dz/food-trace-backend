import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateEventOnchainTable1761894646405
  implements MigrationInterface
{
  name = 'UpdateEventOnchainTable1761894646405'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "onchain_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_name" character varying NOT NULL, "args" jsonb NOT NULL, "tx_hash" character varying(255) NOT NULL, "block_number" integer NOT NULL, "contract_address" character varying(66) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid, CONSTRAINT "PK_334196a0f9bbb367609c7c4114b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e68b29ff3cad42af2da7f3a34f" ON "onchain_events" ("event_name") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_event_tx_hash" ON "onchain_events" ("tx_hash", "event_name") `,
    )
    await queryRunner.query(
      `ALTER TABLE "onchain_events" ADD CONSTRAINT "FK_aa6bfd7e9ca38ccfdabd1d9ccfa" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "onchain_events" DROP CONSTRAINT "FK_aa6bfd7e9ca38ccfdabd1d9ccfa"`,
    )
    await queryRunner.query(`DROP INDEX "public"."uq_event_tx_hash"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e68b29ff3cad42af2da7f3a34f"`,
    )
    await queryRunner.query(`DROP TABLE "onchain_events"`)
  }
}
