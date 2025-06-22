import { QueryTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  const [rows, _] = await queryInterface.sequelize.query(
    `SELECT "id","gameData" FROM "Games"`,
  );
  for (const rowObj of rows) {
    const row = rowObj as { id: string; gameData: string };
    const id: string = row["id"];
    const gameData = JSON.parse(row["gameData"]);
    let dirty = false;
    if (
      gameData &&
      gameData.gameData &&
      gameData.gameData.interCityConnections
    ) {
      const connections = gameData.gameData.interCityConnections;
      for (let i = 0; i < connections.length; i++) {
        connections[i]["id"] = "" + (i + 1);
        dirty = true;
      }
    }

    if (dirty) {
      await queryInterface.sequelize.query(
        `UPDATE "Games" SET "gameData"=? WHERE "id"=?`,
        {
          replacements: [JSON.stringify(gameData), id],
          type: QueryTypes.UPDATE,
        },
      );
    }
  }
};

export const down: Migration = async ({ context: queryInterface }) => {
  const [rows, _] = await queryInterface.sequelize.query(
    `SELECT "id","gameData" FROM "Games"`,
  );
  for (const rowObj of rows) {
    const row = rowObj as { id: string; gameData: string };
    const id: string = row["id"];
    const gameData = JSON.parse(row["gameData"]);
    let dirty = false;
    if (
      gameData &&
      gameData.gameData &&
      gameData.gameData.interCityConnections
    ) {
      const connections = gameData.gameData.interCityConnections;
      for (let i = 0; i < connections.length; i++) {
        if (connections[i]["id"]) {
          delete connections[i]["id"];
          dirty = true;
        }
      }
    }

    if (dirty) {
      await queryInterface.sequelize.query(
        `UPDATE "Games" SET "gameData"=? WHERE "id"=?`,
        {
          replacements: [JSON.stringify(gameData), id],
          type: QueryTypes.UPDATE,
        },
      );
    }
  }
};
