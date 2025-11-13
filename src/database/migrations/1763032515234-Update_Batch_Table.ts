import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateBatchTable1763032515234 implements MigrationInterface {
  name = 'UpdateBatchTable1763032515234'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" ADD "tx_hash_pending" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ADD "onchain_synced" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" DROP COLUMN "onchain_synced"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" DROP COLUMN "tx_hash_pending"`,
    )
  }
}
