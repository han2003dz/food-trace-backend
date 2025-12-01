import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLocation1764608532512 implements MigrationInterface {
  name = 'AddLocation1764608532512'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "location" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "location"`,
    )
  }
}
