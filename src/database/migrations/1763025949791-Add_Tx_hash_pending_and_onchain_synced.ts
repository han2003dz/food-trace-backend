import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTxHashPendingAndOnchainSynced1763025949791
  implements MigrationInterface
{
  name = 'AddTxHashPendingAndOnchainSynced1763025949791'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "tx_hash_pending" character varying(255)`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD "onchain_synced" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "onchain_synced"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "tx_hash_pending"`,
    )
  }
}
