import { GameApi } from "../../api/game";
import {
  NotificationPreferences,
  TurnNotificationSetting,
} from "../../api/notifications";
import { MyUserApi } from "../../api/user";

export interface GamelessTurnNotifySetting<T extends TurnNotificationSetting> {
  user: MyUserApi;
  notificationPreferences: NotificationPreferences;
  turnNotificationSetting: T;
}

export interface TurnNotifySetting<T extends TurnNotificationSetting>
  extends GamelessTurnNotifySetting<T> {
  game: GameApi;
}

export interface MaybeGameTurnNotifySetting<T extends TurnNotificationSetting>
  extends GamelessTurnNotifySetting<T> {
  game?: GameApi;
}

export interface TurnNotifyService<T extends TurnNotificationSetting> {
  sendTurnReminder(setting: TurnNotifySetting<T>): Promise<void>;

  sendGameEndNotification(setting: TurnNotifySetting<T>): Promise<void>;

  sendTestNotification(setting: GamelessTurnNotifySetting<T>): Promise<void>;

  sendChatMention(setting: MaybeGameTurnNotifySetting<T>): Promise<void>;
}
