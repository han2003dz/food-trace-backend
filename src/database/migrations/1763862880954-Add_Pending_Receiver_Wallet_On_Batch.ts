import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPendingReceiverWalletOnBatch1763862880954
  implements MigrationInterface
{
  name = 'AddPendingReceiverWalletOnBatch1763862880954'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" ADD "pending_receiver_wallet" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" DROP COLUMN "pending_receiver_wallet"`,
    )
  }
}
