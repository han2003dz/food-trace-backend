import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateRelationBatchesAndUser1762338965303
  implements MigrationInterface
{
  name = 'UpdateRelationBatchesAndUser1762338965303'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_7b1ba5e79c27dbc3a3a687dbbb1"`,
    )
    await queryRunner.query(`ALTER TABLE "batches" ADD "created_by_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_f974a4ff77f041c9be43ff026b4" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_f974a4ff77f041c9be43ff026b4"`,
    )
    await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "created_by_id"`)
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_7b1ba5e79c27dbc3a3a687dbbb1" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }
}
