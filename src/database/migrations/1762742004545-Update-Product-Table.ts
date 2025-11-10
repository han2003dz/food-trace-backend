import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateProductTable1762742004545 implements MigrationInterface {
  name = 'UpdateProductTable1762742004545'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "certifications" jsonb`)
    await queryRunner.query(
      `ALTER TABLE "products" ADD "storage_conditions" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" ADD "nutritional_info" jsonb`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "nutritional_info"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "storage_conditions"`,
    )
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "certifications"`,
    )
  }
}
