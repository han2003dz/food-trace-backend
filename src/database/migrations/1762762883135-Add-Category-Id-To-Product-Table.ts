import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCategoryIdToProductTable1762762883135
  implements MigrationInterface
{
  name = 'AddCategoryIdToProductTable1762762883135'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "category_id" character varying(10)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`)
  }
}
