import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  CreatedAt,
  DeletedAt,
  NotNull,
  PrimaryKey,
  Table,
  UpdatedAt,
  Version,
} from "@sequelize/core/decorators-legacy";
import { GameApi, GameLiteApi, GameStatus, MapConfig } from "../../api/game";
import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { EngineDelegator } from "../../engine/framework/engine";
import { LimitedGame, toLimitedGame } from "../../engine/game/game_memory";
import { AutoAction } from "../../engine/state/auto_action";
import { assertNever } from "../../utils/validate";

@Table({ modelName: "Game" })
export class GameDao extends Model<
  InferAttributes<GameDao>,
  InferCreationAttributes<GameDao>
> {
  @AutoIncrement
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare version: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare gameKey: GameKey;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare name: string;

  @Attribute(DataTypes.TEXT)
  declare gameData: string | null;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare status: GameStatus;

  @Attribute(DataTypes.JSONB)
  declare autoAction: { users: { [userId: number]: AutoAction } } | null;

  @Attribute(DataTypes.ARRAY(DataTypes.INTEGER))
  @NotNull
  declare playerIds: number[];

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare unlisted: boolean;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare autoStart: boolean;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare turnDuration: number;

  @Attribute({ type: DataTypes.DATE, allowNull: true })
  declare turnStartTime?: CreationOptional<Date | null>;

  @Attribute(DataTypes.ARRAY(DataTypes.INTEGER))
  @NotNull
  declare concedingPlayers: number[];

  @Attribute(DataTypes.JSONB)
  declare config: MapConfig;

  @Attribute(DataTypes.JSONB)
  @NotNull
  declare variant: VariantConfig;

  @Attribute({ type: DataTypes.INTEGER, allowNull: true })
  declare activePlayerId: number | null;

  @Attribute({ type: DataTypes.INTEGER, allowNull: true })
  declare undoPlayerId: number | null;

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
  declare deletedAt: Date | null;

  toLiteApi(): GameLiteApi {
    return toLiteApi(this);
  }

  toApi(): GameApi {
    return toApi(this);
  }

  toLimitedGame(): LimitedGame {
    return toLimitedGame(this);
  }

  getSummary(): string | undefined {
    return toSummary(this);
  }

  getAutoActionForUser(userId: number): AutoAction {
    return this.autoAction?.users?.[userId] ?? {};
  }

  setAutoActionForUser(userId: number, autoAction: AutoAction): void {
    this.autoAction = this.autoAction ?? { users: {} };
    this.autoAction.users[userId] = autoAction;
    this.changed("autoAction", true);
  }
}

export function toApi(game: InferAttributes<GameDao> | GameApi): GameApi {
  return {
    ...toLiteApi(game),
    version: game.version,
    concedingPlayers: game.concedingPlayers,
    turnStartTime: game.turnStartTime?.toString() ?? undefined,
    gameData: game.gameData ?? undefined,
    undoPlayerId: game.undoPlayerId ?? undefined,
  };
}

function toLiteApi(game: GameApi | InferAttributes<GameDao>): GameLiteApi {
  return {
    id: game.id,
    gameKey: game.gameKey,
    variant: game.variant,
    name: game.name,
    status: game.status,
    turnDuration: game.turnDuration,
    playerIds: [...game.playerIds],
    activePlayerId: game.activePlayerId ?? undefined,
    config: game.config,
    summary: toSummary(game),
    unlisted: game.unlisted,
  };
}

export function toSummary(
  game: GameApi | InferAttributes<GameDao>,
): string | undefined {
  if ("summary" in game) {
    return game.summary;
  }
  switch (game.status) {
    case GameStatus.enum.LOBBY:
      return undefined;
    case GameStatus.enum.ACTIVE:
      return EngineDelegator.singleton.readSummary(toLimitedGame(game));
    case GameStatus.enum.ENDED:
      return "Ended";
    case GameStatus.enum.ABANDONED:
      return "Abandoned";
    default:
      assertNever(game.status);
  }
}
