import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateTableProductAndBatches1762245914381
  implements MigrationInterface
{
  name = 'UpdateTableProductAndBatches1762245914381'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59"`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "tx_hash"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "owner_wallet" character varying(42)`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD "image_url" character varying(500)`,
    )
    await queryRunner.query(`ALTER TABLE "products" ADD "description" text`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "leaf_hash" character varying(66)`,
    )
    await queryRunner.query(`ALTER TABLE "products" ADD "metadata" jsonb`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "name" character varying(255) NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "origin"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "origin" character varying(255)`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_product_name" ON "products" ("name") `,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59"`,
    )
    await queryRunner.query(`DROP INDEX "public"."idx_product_name"`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "origin"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "origin" character varying`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "name" character varying NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "metadata"`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "leaf_hash"`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "description"`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`)
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "owner_wallet"`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "tx_hash" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
