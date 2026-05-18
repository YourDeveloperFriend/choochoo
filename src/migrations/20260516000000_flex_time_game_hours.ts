import { DataTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.addColumn("Games", "gameHoursStart", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE "Games" SET "gameHoursStart" = 0`,
    );
    await queryInterface.changeColumn("Games", "gameHoursStart", {
      type: DataTypes.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn("Games", "gameHoursDuration", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE "Games" SET "gameHoursDuration" = 24`,
    );
    await queryInterface.changeColumn("Games", "gameHoursDuration", {
      type: DataTypes.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn("Games", "playerFlexTime", {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.removeColumn("Games", "gameHoursStart");
    await queryInterface.removeColumn("Games", "gameHoursDuration");
    await queryInterface.removeColumn("Games", "playerFlexTime");
  });
};
