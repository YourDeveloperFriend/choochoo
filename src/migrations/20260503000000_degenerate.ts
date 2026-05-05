import { DataTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("Games", "degenerate", {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
  await queryInterface.sequelize.query(
    `UPDATE "Games" SET "degenerate" = false WHERE "degenerate" IS NULL;`,
  );
  await queryInterface.changeColumn("Games", "degenerate", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("Games", "degenerate");
};
