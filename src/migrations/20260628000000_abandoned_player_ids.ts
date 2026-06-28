import { DataTypes, QueryTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

interface LogRow {
  gameId: number;
  message: string;
}

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("Games", "abandonedPlayerIds", {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: true,
  });

  await queryInterface.sequelize.query(
    `UPDATE "Games" SET "abandonedPlayerIds" = '{}'`,
  );

  const abandonLogs = await queryInterface.sequelize.query<LogRow>(
    `SELECT "gameId", message FROM "Logs"
     WHERE message LIKE '%abandoned the game%'
        OR message LIKE '%was kicked from the game%'`,
    { type: QueryTypes.SELECT },
  );

  const abandonsByGame = new Map<number, Set<number>>();
  for (const log of abandonLogs) {
    const match = log.message.match(/<@user-(\d+)>/);
    if (match != null) {
      const userId = Number(match[1]);
      if (!abandonsByGame.has(log.gameId)) {
        abandonsByGame.set(log.gameId, new Set());
      }
      abandonsByGame.get(log.gameId)!.add(userId);
    }
  }

  for (const [gameId, userIds] of abandonsByGame) {
    await queryInterface.sequelize.query(
      `UPDATE "Games" SET "abandonedPlayerIds" = ARRAY[${[...userIds].join(",")}]::integer[] WHERE id = :gameId`,
      { replacements: { gameId } },
    );
  }

  await queryInterface.changeColumn("Games", "abandonedPlayerIds", {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("Games", "abandonedPlayerIds");
};
