import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "@sequelize/core";
import { Attribute, AutoIncrement, BelongsTo, CreatedAt, DeletedAt, Index, NotNull, PrimaryKey, Table, UpdatedAt, Version } from "@sequelize/core/decorators-legacy";
import { SomeRequired } from "../../utils/types";
import { UserDao } from "../user/dao";
import { GameDao } from "./dao";

const gameVersionIndex = 'game-history-game-id';

@Table({ modelName: 'GameHistory' })
export class GameHistoryDao extends Model<InferAttributes<GameHistoryDao>, InferCreationAttributes<GameHistoryDao>> {
  @AutoIncrement
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  declare id: CreationOptional<number>;

  @Index(gameVersionIndex)
  @Attribute({ type: DataTypes.INTEGER, columnName: 'gameVersion' })
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

  @BelongsTo(() => GameDao, 'gameId')
  declare game: NonAttribute<GameDao>;

  @Attribute(DataTypes.INTEGER)
  declare userId: number | null;

  @BelongsTo(() => UserDao, 'userId')
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
}

type PerformActionGameHistoryDao = SomeRequired<GameHistoryDao, 'userId' | 'previousGameData' | 'actionName' | 'actionData'>;