import { QueryTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

// SpaceStyle used to be a numeric enum stored directly in the grid. It is now
// a plain string, with LIGHT_PLAIN/LIGHT_RIVER moved to be London-specific
// keys instead of shared enum values.
const NUMBER_TO_STRING: Record<number, string> = {
  1: "light_plain",
  2: "light_river",
  3: "fjord",
  4: "canyon",
  5: "mountain",
  6: "water",
};

const STRING_TO_NUMBER: Record<string, number> = Object.fromEntries(
  Object.entries(NUMBER_TO_STRING).map(([num, str]) => [str, Number(num)]),
);

function convertGrid(
  gameData: unknown,
  styleMap: Record<string | number, string | number>,
): boolean {
  if (
    gameData == null ||
    typeof gameData !== "object" ||
    !("gameData" in gameData)
  ) {
    return false;
  }
  const inner = (gameData as { gameData: unknown }).gameData;
  if (inner == null || typeof inner !== "object" || !("grid" in inner)) {
    return false;
  }
  const grid = (inner as { grid: unknown }).grid;
  if (!Array.isArray(grid)) {
    return false;
  }
  let dirty = false;
  for (const entry of grid) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      continue;
    }
    const spaceData = entry[1];
    if (
      spaceData &&
      typeof spaceData === "object" &&
      "style" in spaceData &&
      spaceData.style in styleMap
    ) {
      spaceData.style = styleMap[spaceData.style];
      dirty = true;
    }
  }
  return dirty;
}

async function migrateColumn(
  queryInterface: Parameters<Migration>[0]["context"],
  table: string,
  column: string,
  styleMap: Record<string | number, string | number>,
): Promise<void> {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT "id","${column}" FROM "${table}" WHERE "${column}" IS NOT NULL`,
  );
  for (const rowObj of rows) {
    const row = rowObj as { id: string; [key: string]: string };
    const id = row["id"];
    const gameData = JSON.parse(row[column]);
    if (convertGrid(gameData, styleMap)) {
      await queryInterface.sequelize.query(
        `UPDATE "${table}" SET "${column}"=? WHERE "id"=?`,
        {
          replacements: [JSON.stringify(gameData), id],
          type: QueryTypes.UPDATE,
        },
      );
    }
  }
}

export const up: Migration = async ({ context: queryInterface }) => {
  await migrateColumn(queryInterface, "Games", "gameData", NUMBER_TO_STRING);
  await migrateColumn(
    queryInterface,
    "GameHistories",
    "previousGameData",
    NUMBER_TO_STRING,
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await migrateColumn(queryInterface, "Games", "gameData", STRING_TO_NUMBER);
  await migrateColumn(
    queryInterface,
    "GameHistories",
    "previousGameData",
    STRING_TO_NUMBER,
  );
};
