import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExportHistory1781232000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "export_history" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "materialIds" text NOT NULL,
        "sizes" text NOT NULL,
        "format" character varying NOT NULL,
        "quality" integer NOT NULL,
        "totalFiles" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'completed',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_export_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_export_history_userId" ON "export_history" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_export_history_createdAt" ON "export_history" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_export_history_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_export_history_userId"`);
    await queryRunner.query(`DROP TABLE "export_history"`);
  }
}
