import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "@sequelize/core";
import { Attribute, AutoIncrement, BelongsTo, CreatedAt, DeletedAt, Index, NotNull, PrimaryKey, Table, UpdatedAt, Version } from "@sequelize/core/decorators-legacy";
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
  @NotNull
  declare previousGameData: string;

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare patch: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare actionName: string;

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare actionData: string;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare reversible: boolean;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare seed: string | undefined;

  @Index(gameVersionIndex)
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare gameId: number;

  @BelongsTo(() => GameDao, 'gameId')
  declare game: NonAttribute<GameDao>;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare userId: number;

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
}