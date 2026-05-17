import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  InstanceUpdateOptions,
  Model,
  Transaction,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  CreatedAt,
  DeletedAt,
  Index,
  NotNull,
  PrimaryKey,
  Table,
  UpdatedAt,
  Version,
} from "@sequelize/core/decorators-legacy";
import { compare, hash } from "bcrypt";
import {
  NotificationFrequency,
  NotificationMethod,
  NotificationPreferences,
  SetNotificationPreferences,
  TurnNotificationSetting,
} from "../../api/notifications";
import { CreateUserApi, MyUserApi, UserApi, UserRole } from "../../api/user";
import { PlayerColor } from "../../engine/state/player";
import { afterTransaction } from "../../utils/transaction";
import { assert, isPositiveInteger } from "../../utils/validate";
import { emailService } from "../util/email";
import { Lifecycle } from "../util/lifecycle";
import { userCache } from "./cache";

const saltRounds = 10;

@Table({ modelName: "User" })
export class UserDao extends Model<
  InferAttributes<UserDao>,
  InferCreationAttributes<UserDao>
> {
  @AutoIncrement
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  declare id: CreationOptional<number>;

  @Index({ unique: true })
  @Attribute(DataTypes.STRING)
  declare username: string;

  @Index({ unique: true })
  @Attribute(DataTypes.STRING)
  declare email: string;

  @Attribute(DataTypes.STRING)
  declare password: string;

  @Attribute(DataTypes.STRING)
  declare role: UserRole;

  @Attribute(DataTypes.JSONB)
  declare notificationPreferences: NotificationPreferences;

  @Attribute(DataTypes.ARRAY(DataTypes.SMALLINT))
  declare preferredColors: PlayerColor[] | null;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare abandons: number;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare karma: number;

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

  // Helper methods

  static async getUser(pk: number): Promise<MyUserApi | undefined> {
    assert(isPositiveInteger(pk));
    const result = await userCache.get(pk);
    if (result != null) return result;

    const user = await UserDao.findByPk(pk);
    if (!user) return undefined;
    const asApi = user.toMyApi();
    await userCache.set(asApi);
    return asApi;
  }

  getTurnNotificationSettings(
    frequency: NotificationFrequency,
  ): TurnNotificationSetting[] {
    return this.notificationPreferences.turnNotifications.filter(
      (preference) => preference.frequency === frequency,
    );
  }

  updateCache() {
    userCache.set(this.toMyApi());
  }

  static toApi(user: MyUserApi | UserDao): UserApi {
    return {
      id: user.id,
      username: user.username,
      abandons: user.abandons,
      karma: user.karma,
    };
  }

  toApi(): UserApi {
    return UserDao.toApi(this);
  }

  toMyApi(): MyUserApi {
    return {
      ...this.toApi(),
      email: this.email,
      role: this.role,
      preferredColors: this.preferredColors ?? undefined,
    };
  }

  comparePassword(password: string): Promise<boolean> {
    return compare(password, this.password);
  }

  static findById(id: number): Promise<UserDao | null> {
    return UserDao.findByPk(id);
  }

  static hashPassword(password: string): Promise<string> {
    return hash(password, saltRounds);
  }

  static async findByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<UserDao | null> {
    if (usernameOrEmail.indexOf("@") != -1) {
      return UserDao.findOne({ where: { email: usernameOrEmail } });
    }
    return UserDao.findByUsername(usernameOrEmail);
  }

  static async findByUsername(username: string): Promise<UserDao | null> {
    return UserDao.findOne({ where: { username } });
  }

  static async login(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserDao | null> {
    const user = await this.findByUsernameOrEmail(usernameOrEmail);
    if (user == null) {
      return null;
    }
    if (!(await user.comparePassword(password))) {
      return null;
    }
    return user;
  }

  static async register(
    user: CreateUserApi,
    transaction?: Transaction,
  ): Promise<UserDao> {
    const password = await UserDao.hashPassword(user.password);
    const newUser = await UserDao.create(
      {
        username: user.username,
        email: user.email,
        abandons: 0,
        karma: 75,
        password,
        role: UserRole.enum.ACTIVATE_EMAIL,
        notificationPreferences: {
          turnNotifications: [],
          marketing: true,
        },
      },
      { transaction },
    );
    return newUser;
  }

  static async unsubscribe(email: string) {
    const user = await UserDao.findByUsernameOrEmail(email);
    assert(user != null, { invalidInput: true });
    await user.setNotificationPreferences({
      turnNotifications: user.notificationPreferences.turnNotifications.filter(
        (not) => not.method !== NotificationMethod.EMAIL,
      ),
      marketing: false,
    });
  }

  async setNotificationPreferences(
    preferences: SetNotificationPreferences,
  ): Promise<void> {
    this.notificationPreferences = {
      ...preferences,
      discordId: this.notificationPreferences.discordId,
    };
    await Promise.all([
      emailService.setIsExcludedFromCampaigns(
        this.email,
        preferences.marketing,
      ),
      this.save(),
    ]);
  }
}

Lifecycle.singleton.onStart(() => {
  function updateUserCache(user: UserDao, options: InstanceUpdateOptions) {
    afterTransaction(options, () => {
      userCache.set(user.toMyApi());
    });
  }
  return UserDao.hooks.addListener("afterSave", updateUserCache);
});
