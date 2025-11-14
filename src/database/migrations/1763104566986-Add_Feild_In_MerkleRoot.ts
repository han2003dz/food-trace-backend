import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFeildInMerkleRoot1763104566986 implements MigrationInterface {
  name = 'AddFeildInMerkleRoot1763104566986'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" ADD "root_hash" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" ADD "block_number" integer`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" DROP COLUMN "block_number"`,
    )
    await queryRunner.query(
      `ALTER TABLE "merkle_roots" DROP COLUMN "root_hash"`,
    )
  }
}
