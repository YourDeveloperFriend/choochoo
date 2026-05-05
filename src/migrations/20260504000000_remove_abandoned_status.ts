import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.sequelize.query(
      `UPDATE "Games" SET "status" = 'ENDED' WHERE "status" = 'ABANDONED';`,
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Games_status" RENAME TO "enum_Games_status_old";`,
    );
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Games_status" AS ENUM ('LOBBY', 'ACTIVE', 'ENDED');`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Games" ALTER COLUMN "status" TYPE "enum_Games_status" USING "status"::text::"enum_Games_status";`,
    );
    await queryInterface.sequelize.query(`DROP TYPE "enum_Games_status_old";`);
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Games_status" RENAME TO "enum_Games_status_old";`,
    );
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Games_status" AS ENUM ('LOBBY', 'ACTIVE', 'ENDED', 'ABANDONED');`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Games" ALTER COLUMN "status" TYPE "enum_Games_status" USING "status"::text::"enum_Games_status";`,
    );
    await queryInterface.sequelize.query(`DROP TYPE "enum_Games_status_old";`);
  });
};
