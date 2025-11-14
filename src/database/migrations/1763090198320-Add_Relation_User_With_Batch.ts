import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRelationUserWithBatch1763090198320
  implements MigrationInterface
{
  name = 'AddRelationUserWithBatch1763090198320'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "batches" ADD "creator_user_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "batches" ADD CONSTRAINT "FK_be023fcaaacad8262662c0cd6d6" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batches" DROP CONSTRAINT "FK_be023fcaaacad8262662c0cd6d6"`,
    )
    await queryRunner.query(
      `ALTER TABLE "batches" DROP COLUMN "creator_user_id"`,
    )
  }
}
