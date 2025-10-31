import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateOnchainEventTable1761884777071
  implements MigrationInterface
{
  name = 'UpdateOnchainEventTable1761884777071'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_event_tx_hash" ON "onchain_events" ("tx_hash", "event_name") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_event_tx_hash"`)
  }
}
