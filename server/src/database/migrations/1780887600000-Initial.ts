import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1780887600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "credits" integer NOT NULL DEFAULT 100,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "material" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "name" character varying NOT NULL,
        "url" character varying NOT NULL,
        "size" integer NOT NULL,
        "type" character varying NOT NULL DEFAULT 'image',
        "category" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_379311a2477039c68e4c61f02f8" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_555d157ca1025d04c01efc69cc" ON "material" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_c0b3b24ec1400c7164191409da" ON "material" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_555d157ca1025d04c01efc69cd" ON "material" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE TABLE "template" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "name" character varying NOT NULL,
        "prompt" text NOT NULL,
        "category" character varying NOT NULL,
        "params" jsonb,
        "isPublic" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fbae1400684d7c2b2f1c6899984" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_3d6d0eb1374f86c6878d9d507a" ON "template" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_a2837e631071115b15c21b540c" ON "template" ("category")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_1115b15c21b540c3d6d0eb1374" ON "template" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_6878d9d507a3d6d0eb1374f86c" ON "template" ("userId", "isPublic", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_1b540c3d6d0eb1374f86c6878d9" ON "template" ("category", "isPublic", "createdAt")
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."ai_model_tasktypes_enum" AS ENUM('generate', 'remove-bg', 'image-edit')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."ai_model_callmode_enum" AS ENUM('sync', 'async', 'both')
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_model" (
        "id" SERIAL NOT NULL,
        "modelId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "provider" character varying NOT NULL,
        "model" character varying NOT NULL,
        "taskTypes" "public"."ai_model_tasktypes_enum" array NOT NULL,
        "callMode" "public"."ai_model_callmode_enum" NOT NULL DEFAULT 'async',
        "cost" integer NOT NULL DEFAULT 1,
        "quality" integer NOT NULL DEFAULT 50,
        "enabled" boolean NOT NULL DEFAULT true,
        "successCount" integer NOT NULL DEFAULT 0,
        "failureCount" integer NOT NULL DEFAULT 0,
        "config" jsonb,
        "supportedSizes" jsonb,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_347a4f310b2f573f421b46597e9" UNIQUE ("modelId"),
        CONSTRAINT "PK_d187426b9295ef1c7e832374373" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_347a4f310b2f573f421b46597e" ON "ai_model" ("modelId")
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_task" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "type" character varying NOT NULL,
        "params" jsonb NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "progress" integer NOT NULL DEFAULT 0,
        "result" jsonb,
        "error" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_13198603788f916033464878522" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_900c2c85b537c69392c6b4915d" ON "ai_task" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_96f0b0c976a871c17f5c76f981" ON "ai_task" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_17f5c76f98196f0b0c976a871c" ON "ai_task" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE TABLE "generate_preset" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "name" character varying NOT NULL,
        "prompt" text NOT NULL,
        "modelId" character varying,
        "size" character varying,
        "style" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_49b7f9c90343b849901091207b3" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_549b7f9c90343b849901091207" ON "generate_preset" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_49b7f9c90343b849901091207c" ON "generate_preset" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_9c90343b849901091207b3549b" ON "generate_preset" ("userId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_9c90343b849901091207b3549b"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_49b7f9c90343b849901091207c"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_549b7f9c90343b849901091207"
    `);
    await queryRunner.query(`
      DROP TABLE "generate_preset"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_17f5c76f98196f0b0c976a871c"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_96f0b0c976a871c17f5c76f981"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_900c2c85b537c69392c6b4915d"
    `);
    await queryRunner.query(`
      DROP TABLE "ai_task"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_347a4f310b2f573f421b46597e"
    `);
    await queryRunner.query(`
      DROP TABLE "ai_model"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."ai_model_callmode_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."ai_model_tasktypes_enum"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_1b540c3d6d0eb1374f86c6878d9"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_6878d9d507a3d6d0eb1374f86c"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_1115b15c21b540c3d6d0eb1374"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_a2837e631071115b15c21b540c"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_3d6d0eb1374f86c6878d9d507a"
    `);
    await queryRunner.query(`
      DROP TABLE "template"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_555d157ca1025d04c01efc69cd"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_c0b3b24ec1400c7164191409da"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_555d157ca1025d04c01efc69cc"
    `);
    await queryRunner.query(`
      DROP TABLE "material"
    `);

    await queryRunner.query(`
      DROP TABLE "user"
    `);
  }
}
