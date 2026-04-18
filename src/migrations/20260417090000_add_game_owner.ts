import { DataTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("Games", "ownerId", {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await queryInterface.sequelize.query(
    `UPDATE "Games" SET "ownerId" = "playerIds"[1];`,
  );

  await queryInterface.changeColumn("Games", "ownerId", {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("Games", "ownerId");
};
