import { DataTypes, QueryTypes } from "@sequelize/core";
import type { Migration } from "../scripts/migrations";

interface UserRow {
  id: number;
}

interface GameRow {
  id: number;
  playerIds: number[];
  updatedAt: Date;
}

interface LogRow {
  gameId: number;
  message: string;
  createdAt: Date;
}

type KarmaEvent =
  | { type: "abandon"; userId: number; timestamp: Date }
  | { type: "complete"; playerIds: number[]; timestamp: Date };

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.addColumn("Users", "karma", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // Build karma map starting at 75 for all users.
    const users = await queryInterface.sequelize.query<UserRow>(
      `SELECT id FROM "Users"`,
      { type: QueryTypes.SELECT },
    );
    const karmaMap = new Map<number, number>(users.map((u) => [u.id, 75]));

    // Find all historical abandon/kick log entries.
    const abandonLogs = await queryInterface.sequelize.query<LogRow>(
      `SELECT "gameId", message, "createdAt" FROM "Logs"
       WHERE message LIKE '%abandoned the game%'
          OR message LIKE '%was kicked from the game%'`,
      { type: QueryTypes.SELECT },
    );
    const abandonedGameIds = new Set(abandonLogs.map((l) => l.gameId));

    // Ended multiplayer games that were NOT abandoned are normal completions.
    const endedGames = await queryInterface.sequelize.query<GameRow>(
      `SELECT id, "playerIds", "updatedAt" FROM "Games"
       WHERE status = 'ENDED' AND array_length("playerIds", 1) > 1`,
      { type: QueryTypes.SELECT },
    );

    // Combine into a single chronological event stream.
    const events: KarmaEvent[] = [];

    for (const log of abandonLogs) {
      const match = log.message.match(/<@user-(\d+)>/);
      if (match != null) {
        events.push({
          type: "abandon",
          userId: Number(match[1]),
          timestamp: new Date(log.createdAt),
        });
      }
    }

    for (const game of endedGames) {
      if (!abandonedGameIds.has(game.id)) {
        events.push({
          type: "complete",
          playerIds: game.playerIds,
          timestamp: new Date(game.updatedAt),
        });
      }
    }

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const event of events) {
      if (event.type === "abandon") {
        const current = karmaMap.get(event.userId);
        if (current != null) {
          karmaMap.set(event.userId, Math.max(0, current - 10));
        }
      } else {
        for (const playerId of event.playerIds) {
          const current = karmaMap.get(playerId);
          if (current != null) {
            karmaMap.set(playerId, Math.min(100, current + 1));
          }
        }
      }
    }

    for (const [userId, karma] of karmaMap) {
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET "karma" = :karma WHERE "id" = :userId`,
        { replacements: { karma, userId } },
      );
    }

    await queryInterface.changeColumn("Users", "karma", {
      type: DataTypes.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn("Games", "minKarma", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.transaction(async () => {
    await queryInterface.removeColumn("Users", "karma");
    await queryInterface.removeColumn("Games", "minKarma");
  });
};
