import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProducerNameToProductTable1762746239461
  implements MigrationInterface
{
  name = 'AddProducerNameToProductTable1762746239461'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "producer_name" character varying(255)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "producer_name"`,
    )
  }
}
