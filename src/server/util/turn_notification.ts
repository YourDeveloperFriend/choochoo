import { Op } from "@sequelize/core";
import {
  NotificationFrequency,
  NotificationMethod,
  NotificationPreferences,
  TurnNotificationSetting,
} from "../../api/notifications";
import { assert, assertNever } from "../../utils/validate";
import { GameDao } from "../game/dao";
import { UserDao } from "../user/dao";
import { emailService } from "./email";
import { TurnNotifyService } from "./notify";
import { webHookNotifier } from "./webhook";

export async function notifyTurn(game: GameDao): Promise<void> {
  if (game.activePlayerId === null) {
    return notifyEndGame(game);
  }

  const user = await UserDao.findByPk(game.activePlayerId!, {
    transaction: null,
  });
  if (user == null) {
    return;
  }
  const settings = user.getTurnNotificationSettings(
    NotificationFrequency.IMMEDIATELY,
  );

  await Promise.all(
    settings.map((setting) =>
      getNotifier(setting).sendTurnReminder({
        user: user.toMyApi(),
        notificationPreferences: user.notificationPreferences,
        turnNotificationSetting: setting,
        game: game.toApi(),
      }),
    ),
  );
}

async function notifyEndGame(game: GameDao): Promise<void> {
  const users = await UserDao.findAll({
    where: { id: { [Op.in]: game.playerIds } },
    transaction: null,
  });
  await Promise.all(
    users.map(async (user) => {
      const settings = user.getTurnNotificationSettings(
        NotificationFrequency.IMMEDIATELY,
      );

      await Promise.all(
        settings.map((setting) =>
          getNotifier(setting).sendGameEndNotification({
            user: user.toMyApi(),
            notificationPreferences: user.notificationPreferences,
            turnNotificationSetting: setting,
            game: game.toApi(),
          }),
        ),
      );
    }),
  );
}

export async function sendTestMessage(
  userId: number,
  preferences: NotificationPreferences,
): Promise<void> {
  const user = await UserDao.getUser(userId);
  assert(user != null);
  await Promise.all(
    preferences.turnNotifications.map((setting) =>
      getNotifier(setting).sendTestNotification({
        user,
        notificationPreferences: preferences,
        turnNotificationSetting: setting,
      }),
    ),
  );
}

export function getNotifier<T extends TurnNotificationSetting>(
  setting: T,
): TurnNotifyService<T> {
  switch (setting.method) {
    case NotificationMethod.EMAIL:
      return emailService as TurnNotifyService<T>;
    case NotificationMethod.WEBHOOK:
    case NotificationMethod.CUSTOM_DISCORD:
    case NotificationMethod.DISCORD:
      return webHookNotifier as TurnNotifyService<T>;
    default:
      assertNever(setting);
  }
}
