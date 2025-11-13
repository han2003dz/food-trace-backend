import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateEmailFieldInUser1763006768215 implements MigrationInterface {
  name = 'UpdateEmailFieldInUser1763006768215'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying(255)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    )
  }
}
