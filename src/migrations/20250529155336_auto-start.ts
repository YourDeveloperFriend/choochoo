import { DataTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("Games", "autoStart", {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("Games", "autoStart");
};
