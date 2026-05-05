import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  BelongsTo,
  CreatedAt,
  DeletedAt,
  Index,
  NotNull,
  PrimaryKey,
  Table,
  UpdatedAt,
  Version,
} from "@sequelize/core/decorators-legacy";
import { GameStatus } from "../../api/game";
import { GameHistoryLiteApi } from "../../api/history";
import { SomeRequired } from "../../utils/types";
import { UserDao } from "../user/dao";
import { GameDao, toSummary } from "./dao";

const gameVersionIndex = "game-history-game-id";

@Table({ modelName: "GameHistory" })
export class GameHistoryDao extends Model<
  InferAttributes<GameHistoryDao>,
  InferCreationAttributes<GameHistoryDao>
> {
  @AutoIncrement
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  declare id: CreationOptional<number>;

  @Index(gameVersionIndex)
  @Attribute({ type: DataTypes.INTEGER, columnName: "gameVersion" })
  @NotNull
  declare previousGameVersion: number;

  @Attribute(DataTypes.TEXT)
  declare previousGameData: string | null;

  @Attribute(DataTypes.TEXT)
  declare patch: string | null;

  @Attribute(DataTypes.STRING)
  declare actionName: string | null;

  @Attribute(DataTypes.TEXT)
  declare actionData: string | null;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare reversible: boolean;

  @Attribute(DataTypes.STRING)
  declare seed: string | null;

  @Index(gameVersionIndex)
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare gameId: number;

  @BelongsTo(() => GameDao, "gameId")
  declare game: NonAttribute<GameDao>;

  @Attribute(DataTypes.INTEGER)
  declare userId: number | null;

  @BelongsTo(() => UserDao, "userId")
  declare user: NonAttribute<UserDao>;

  @Version
  @NotNull
  declare internalVersion: CreationOptional<number>;

  @CreatedAt
  @NotNull
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @NotNull
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  declare deletedAt?: Date | null;

  isActionHistory(): this is PerformActionGameHistoryDao {
    return this.previousGameVersion > 0;
  }

  static findHistory(gameId: number, historyId: number) {
    return GameHistoryDao.findOne({
      where: { gameId, previousGameVersion: historyId },
    });
  }

  toLiteApi(game: GameDao): GameHistoryLiteApi {
    const historyApi: GameHistoryLiteApi = {
      historyId: this.previousGameVersion,
      version: this.previousGameVersion,
      turnDuration: game.turnDuration,
      concedingPlayers: game.concedingPlayers,
      gameData: this.previousGameData ?? undefined,
      id: this.gameId,
      gameKey: game.gameKey,
      name: game.name,
      playerIds: game.playerIds,
      ownerId: game.ownerId,
      status: GameStatus.enum.ACTIVE,
      activePlayerId: this.userId ?? undefined,
      config: game.config,
      actionName: this.actionName!,
      variant: game.variant,
      unlisted: game.unlisted,
      degenerate: game.degenerate,
      minKarma: game.minKarma,
      undoPlayerId: undefined,
    };
    historyApi.summary = toSummary(historyApi);
    return historyApi;
  }
}

type PerformActionGameHistoryDao = SomeRequired<
  GameHistoryDao,
  "userId" | "previousGameData" | "actionName" | "actionData"
>;
