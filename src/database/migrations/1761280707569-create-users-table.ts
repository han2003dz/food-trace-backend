import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUsersTable1761280707569 implements MigrationInterface {
  name = 'CreateUsersTable1761280707569'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_address" character varying NOT NULL, "username" character varying, "role" integer NOT NULL DEFAULT '3', "avatar" character varying, CONSTRAINT "UQ_196ef3e52525d3cd9e203bdb1de" UNIQUE ("wallet_address"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "origin" character varying, "manufacture_date" date, "expiry_date" date, "onchain_id" bigint, "tx_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "currentOwnerId" uuid, CONSTRAINT "UQ_80954e6d1e4a8f0dfff09a488cb" UNIQUE ("onchain_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_products_owner" ON "products" ("currentOwnerId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_products_onchain_id" ON "products" ("onchain_id") `,
    )
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
      `ALTER TABLE "products" ADD CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59"`,
    )
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_created_at"`)
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_user_id"`)
    await queryRunner.query(`DROP INDEX "public"."idx_product_logs_product_id"`)
    await queryRunner.query(`DROP TABLE "product_logs"`)
    await queryRunner.query(`DROP INDEX "public"."idx_products_onchain_id"`)
    await queryRunner.query(`DROP INDEX "public"."idx_products_owner"`)
    await queryRunner.query(`DROP TABLE "products"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
