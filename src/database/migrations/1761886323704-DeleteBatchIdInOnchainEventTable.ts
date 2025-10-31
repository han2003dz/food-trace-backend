import { MigrationInterface, QueryRunner } from 'typeorm'

export class DeleteBatchIdInOnchainEventTable1761886323704
  implements MigrationInterface
{
  name = 'DeleteBatchIdInOnchainEventTable1761886323704'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "tx_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid, "userId" uuid, CONSTRAINT "PK_ad37f6de95ac979cc3d3468f29f" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_product_logs_product_id" ON "product_logs" ("productId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_product_logs_user_id" ON "product_logs" ("userId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_product_logs_created_at" ON "product_logs" ("created_at") `,
    )
    await queryRunner.query(
      `ALTER TABLE "product_logs" ADD CONSTRAINT "FK_f3b89e9bd5c6cd9b1fdb5978a8c" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_logs" ADD CONSTRAINT "FK_932fbf3dd8c5e9f4863877f28e3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_logs" DROP CONSTRAINT "FK_932fbf3dd8c5e9f4863877f28e3"`,
    )
    await queryRunner.query(
      `ALTER TABLE "product_logs" DROP CONSTRAINT "FK_f3b89e9bd5c6cd9b1fdb5978a8c"`,
    )
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_created_at"`)
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_product_id"`)
    await queryRunner.query(`DROP TABLE "product_logs"`)
  }
}
