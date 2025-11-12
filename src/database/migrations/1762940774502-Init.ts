import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1762940774502 implements MigrationInterface {
  name = 'Init1762940774502'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "image_url" character varying(500), "category" character varying(100), "storage_conditions" character varying(255), "nutritional_info" jsonb, "metadata_uri" character varying, "metadata_hash" character varying(66), "onchain_product_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid, "currentOwnerId" uuid, CONSTRAINT "UQ_ac1b6ddbdc0731c5941b6dea2ef" UNIQUE ("onchain_product_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_product_name" ON "products" ("name") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_products_onchain_id" ON "products" ("onchain_product_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_products_owner" ON "products" ("currentOwnerId") `,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batch_events_event_type_enum" AS ENUM('CREATED', 'PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "batch_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" "public"."batch_events_event_type_enum" NOT NULL, "metadata_uri" character varying, "data_hash" character varying, "tx_hash" character varying, "block_number" bigint, "timestamp" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid, "actor_org_id" uuid, CONSTRAINT "PK_43754047a56220bd40ed3e8a658" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "batch_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_code" character varying NOT NULL, "batch_code_hash" character varying NOT NULL, "qr_image_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid, CONSTRAINT "UQ_22785cc674a0563de89d7b5ee36" UNIQUE ("batch_code"), CONSTRAINT "UQ_bb6eb7abedca6a3966989349d8d" UNIQUE ("batch_code_hash"), CONSTRAINT "REL_cb491108297886b9528de74157" UNIQUE ("batch_id"), CONSTRAINT "PK_d56df97bc9b3c6eea040fc91aff" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "merkle_roots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merkle_root" character varying NOT NULL, "tx_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid, "committed_by_org_id" uuid, CONSTRAINT "REL_7d7e5287fd1872deb413db8885" UNIQUE ("batch_id"), CONSTRAINT "PK_a29d46c118f1293bf533e30833e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject" character varying NOT NULL, "metadata_uri" character varying, "metadata_hash" character varying, "expire_at" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "issuer_org_id" uuid, CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "batch_certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid, "certification_id" uuid, CONSTRAINT "PK_c5c83b70d34c904e4a0e121b75d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."batches_status_enum" AS ENUM('HARVESTED', 'PROCESSED', 'IN_TRANSIT', 'WAREHOUSE', 'SOLD', 'RECALLED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "onchain_batch_id" bigint, "initial_data_hash" character varying NOT NULL, "metadata_uri" character varying, "status" "public"."batches_status_enum" NOT NULL DEFAULT 'HARVESTED', "closed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "product_id" uuid, "creator_org_id" uuid, "current_owner_id" uuid, CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_org_type_enum" AS ENUM('FARM', 'PROCESSOR', 'LOGISTICS', 'RETAILER', 'AUDITOR', 'ADMIN')`,
    )
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "org_type" "public"."organizations_org_type_enum" NOT NULL, "wallet_address" character varying NOT NULL, "metadata_cid" character varying, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_21931ba367a66b08617d131e30b" UNIQUE ("wallet_address"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'MANAGER', 'MEMBER')`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "wallet_address" character varying NOT NULL, "username" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER', "avatar" character varying, "organization_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_196ef3e52525d3cd9e203bdb1de" UNIQUE ("wallet_address"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "qr_scan_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_code" character varying NOT NULL, "user_ip" character varying, "user_agent" character varying, "scanned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_98c31b5c6e322ae601c012d0b4d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."onchain_events_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'FAILED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "onchain_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_name" character varying NOT NULL, "args" jsonb NOT NULL, "tx_hash" character varying(255) NOT NULL, "block_number" integer NOT NULL, "contract_address" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP, "status" "public"."onchain_events_status_enum" NOT NULL DEFAULT 'CONFIRMED', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_334196a0f9bbb367609c7c4114b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e68b29ff3cad42af2da7f3a34f" ON "onchain_events" ("event_name") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_event_tx_hash" ON "onchain_events" ("tx_hash", "event_name") `,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_2d404aa7aa4a0404eafd1840915" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" ADD CONSTRAINT "FK_cbb450d618f7e411490b4eb1960" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" ADD CONSTRAINT "FK_661bd5fce8f49185821da385699" FOREIGN KEY ("actor_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_codes" ADD CONSTRAINT "FK_cb491108297886b9528de74157f" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" ADD CONSTRAINT "FK_7d7e5287fd1872deb413db8885e" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" ADD CONSTRAINT "FK_75137efb16e2ba02ddd7ac3ee4f" FOREIGN KEY ("committed_by_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD CONSTRAINT "FK_03c5f7459050009d22debf0d733" FOREIGN KEY ("issuer_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_certifications" ADD CONSTRAINT "FK_d682b1480232c05ed2b7e919225" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_certifications" ADD CONSTRAINT "FK_aa4c8147e31846052e8cb7479f5" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_07ad38527d0d87601f3b05a6a22" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_ca4b2a1482468ed671ac21b703d" FOREIGN KEY ("creator_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_cbcd785a58af5c69e8ea4bd71a1" FOREIGN KEY ("current_owner_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_21a659804ed7bf61eb91688dea7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_cbcd785a58af5c69e8ea4bd71a1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_ca4b2a1482468ed671ac21b703d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_07ad38527d0d87601f3b05a6a22"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_certifications" DROP CONSTRAINT "FK_aa4c8147e31846052e8cb7479f5"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_certifications" DROP CONSTRAINT "FK_d682b1480232c05ed2b7e919225"`,
    )
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP CONSTRAINT "FK_03c5f7459050009d22debf0d733"`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" DROP CONSTRAINT "FK_75137efb16e2ba02ddd7ac3ee4f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" DROP CONSTRAINT "FK_7d7e5287fd1872deb413db8885e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_codes" DROP CONSTRAINT "FK_cb491108297886b9528de74157f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" DROP CONSTRAINT "FK_661bd5fce8f49185821da385699"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batch_events" DROP CONSTRAINT "FK_cbb450d618f7e411490b4eb1960"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_81fa20f5a30dfce70b9d5b75e59"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_2d404aa7aa4a0404eafd1840915"`,
    )
    await queryRunner.query(`DROP INDEX "public"."uq_event_tx_hash"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e68b29ff3cad42af2da7f3a34f"`,
    )
    await queryRunner.query(`DROP TABLE "onchain_events"`)
    await queryRunner.query(`DROP TYPE "public"."onchain_events_status_enum"`)
    await queryRunner.query(`DROP TABLE "qr_scan_logs"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
    await queryRunner.query(`DROP TABLE "organizations"`)
    await queryRunner.query(`DROP TYPE "public"."organizations_org_type_enum"`)
    await queryRunner.query(`DROP TABLE "batches"`)
    await queryRunner.query(`DROP TYPE "public"."batches_status_enum"`)
    await queryRunner.query(`DROP TABLE "batch_certifications"`)
    await queryRunner.query(`DROP TABLE "certifications"`)
    await queryRunner.query(`DROP TABLE "merkle_roots"`)
    await queryRunner.query(`DROP TABLE "batch_codes"`)
    await queryRunner.query(`DROP TABLE "batch_events"`)
    await queryRunner.query(`DROP TYPE "public"."batch_events_event_type_enum"`)
    await queryRunner.query(`DROP INDEX "public"."idx_products_owner"`)
    await queryRunner.query(`DROP INDEX "public"."idx_products_onchain_id"`)
    await queryRunner.query(`DROP INDEX "public"."idx_product_name"`)
    await queryRunner.query(`DROP TABLE "products"`)
  }
}
