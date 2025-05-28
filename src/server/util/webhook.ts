import axios from "axios";
import {
  CustomDiscordWebHookSetting,
  DiscordWebHookSetting,
  NotificationMethod,
  NotificationPreferences,
  WebHookOption,
  WebHookSetting,
} from "../../api/notifications";
import { MapRegistry } from "../../maps/registry";
import { log } from "../../utils/functions";
import { assertNever } from "../../utils/validate";
import { environment } from "./environment";
import {
  GamelessTurnNotifySetting,
  MaybeGameTurnNotifySetting,
  TurnNotifyService,
  TurnNotifySetting,
} from "./notify";

type AnyWebHookSetting =
  | WebHookSetting
  | CustomDiscordWebHookSetting
  | DiscordWebHookSetting;

abstract class BaseWebHookNotifier
  implements TurnNotifyService<AnyWebHookSetting>
{
  sendTurnReminder(
    setting: TurnNotifySetting<AnyWebHookSetting>,
  ): Promise<void> {
    const { game } = setting;
    const mapName = MapRegistry.singleton.get(game.gameKey).name;
    const message = `Your turn in [${game.name} (${mapName}): ${game.summary!}](https://www.choochoo.games/app/games/${game.id})`;
    return this.callWebhook(
      message,
      setting.notificationPreferences,
      setting.turnNotificationSetting,
    );
  }

  sendChatMention(
    setting: MaybeGameTurnNotifySetting<AnyWebHookSetting>,
  ): Promise<void> {
    return this.callWebhook(
      this.getChatMentionMessage(setting),
      setting.notificationPreferences,
      setting.turnNotificationSetting,
    );
  }

  private getChatMentionMessage(
    setting: MaybeGameTurnNotifySetting<AnyWebHookSetting>,
  ): string {
    const { game } = setting;
    if (game != null) {
      const mapName = MapRegistry.singleton.get(game.gameKey).name;
      return `You were pinged in [${game.name} (${mapName}): ${game.summary!}](https://www.choochoo.games/app/games/${game.id})`;
    }
    return `You were pinged in the main chat of [ChooChoo.games](https://www.choochoo.games/).`;
  }

  sendGameEndNotification(
    setting: TurnNotifySetting<AnyWebHookSetting>,
  ): Promise<void> {
    const mapName = MapRegistry.singleton.get(setting.game.gameKey).name;
    const message = `The game [${setting.game.name} (${mapName})](https://www.choochoo.games/app/games/${setting.game.id}) has ended.`;
    return this.callWebhook(
      message,
      setting.notificationPreferences,
      setting.turnNotificationSetting,
    );
  }

  sendTestNotification(
    setting: GamelessTurnNotifySetting<AnyWebHookSetting>,
  ): Promise<void> {
    const message = `Test Message from Choo Choo Games.`;
    return this.callWebhook(
      message,
      setting.notificationPreferences,
      setting.turnNotificationSetting,
    );
  }

  private async callWebhook(
    message: string,
    preferences: NotificationPreferences,
    setting: AnyWebHookSetting,
  ): Promise<void> {
    const webHookUrl = toUrl(setting);
    if (webHookUrl == null) {
      return;
    }
    const webHookUserId = toUserId(preferences, setting);
    const encodedMessage = `<${getNotifyPrefix(webHookUrl)}${webHookUserId}> ${message}`;

    await this.post(webHookUrl, getPayload(webHookUrl, encodedMessage));
  }

  protected abstract post(url: string, payload: object): Promise<void>;
}

class NoopWebHookNotifier extends BaseWebHookNotifier {
  protected async post(url: string, payload: object): Promise<void> {
    log(`submitting webhook (${url}), ${JSON.stringify(payload)}`);
  }
}

class AxiosWebHookNotifier extends BaseWebHookNotifier {
  protected async post(url: string, payload: object): Promise<void> {
    await axios.post(url, payload);
  }
}

export const webHookNotifier =
  environment.stage !== "production"
    ? new NoopWebHookNotifier()
    : new AxiosWebHookNotifier();

function toUserId(
  preferences: NotificationPreferences,
  setting: AnyWebHookSetting,
) {
  switch (setting.method) {
    case NotificationMethod.DISCORD:
    case NotificationMethod.CUSTOM_DISCORD:
      return preferences.discordId!;
    case NotificationMethod.WEBHOOK:
      return setting.webHookUserId;
    default:
      assertNever(setting);
  }
}

function toUrl(setting: AnyWebHookSetting): string | undefined {
  if (
    setting.method === NotificationMethod.WEBHOOK ||
    setting.method === NotificationMethod.CUSTOM_DISCORD
  ) {
    return setting.webHookUrl;
  }
  switch (setting.option) {
    case WebHookOption.AOS:
      return environment.aosDiscordWebhookUrl;
    case WebHookOption.EOT:
      return environment.eotDiscordWebhookUrl;
    default:
      assertNever(setting.option);
  }
}

function getNotifyPrefix(urlStr: string): string {
  const url = new URL(urlStr);
  switch (url.host) {
    case "chat.googleapis.com":
      return "users/";
    default:
      return "@";
  }
}

function getPayload(urlStr: string, message: string): object {
  const url = new URL(urlStr);
  switch (url.host) {
    case "discord.com":
    case "discordapp.com":
      return {
        content: message,
        allowed_mentions: { parse: ["users"] },
      };
    default:
      return { text: message };
  }
}
