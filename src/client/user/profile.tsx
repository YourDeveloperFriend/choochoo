import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
} from "@mui/material";
import { FormEvent, MouseEvent, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ValidationError } from "../../api/error";
import { GameStatus, ListGamesApi } from "../../api/game";
import {
  DiscordWebHookSetting,
  isDirectWebHookSetting,
  isWebHookSetting,
  NotificationFrequency,
  NotificationMethod,
  NotificationPreferences,
  WebHookOption,
  WebHookSetting,
} from "../../api/notifications";
import { MyUserApi } from "../../api/user";
import { Loading } from "../components/loading";
import { GameList } from "../home/game_list";
import { useMe } from "../services/me";
import {
  useNotificationPreferences,
  useSendTestNotification,
  useSetNotificationPreferences,
} from "../services/notifications/preferences";
import { useUser } from "../services/user";
import { useCheckboxState, useTextInputState } from "../utils/form_state";
import { useTypedMemo } from "../utils/hooks";
import { DiscordNotificationSettings } from "./discord";
import { UpdatePassword } from "./update_password";

export function UserProfilePage() {
  const userId = Number(useParams()!.userId!);
  const me = useMe();
  return userId === me?.id ? (
    <MeProfile me={me} />
  ) : (
    <UserProfile userId={userId} />
  );
}

function MeProfile({ me }: { me: MyUserApi }) {
  return (
    <div>
      <h1>Profile Settings</h1>
      <p>Username: {me.username}</p>
      <p>Email: {me.email}</p>
      <UpdatePassword />
      <NotificationSettings />
      <UserGameList userId={me.id} />
    </div>
  );
}

const emailSettings = {
  method: NotificationMethod.EMAIL,
  frequency: NotificationFrequency.IMMEDIATELY,
} as const;

function findErrorInNotifications(
  settings: NotificationPreferences | undefined,
  method: NotificationMethod,
  option: WebHookOption | undefined,
  validationError: ValidationError | undefined,
  key: string,
): string | undefined {
  if (settings == null) return undefined;
  const index = settings.turnNotifications.findIndex(
    (not) =>
      not.method === method &&
      (option == null || (not as DiscordWebHookSetting).option === option),
  );
  if (index === -1) return undefined;
  return validationError?.[`preferences.turnNotifications.${index}.${key}`];
}

function buildNotificationSettings(
  marketing: boolean,
  email: boolean,
  enableWebHook: boolean,
  webHookUrl: string,
  webHookUserId: string,
  enableAosDiscord: boolean,
  enableEotDiscord: boolean,
) {
  const webHook: WebHookSetting = {
    method: NotificationMethod.WEBHOOK,
    frequency: NotificationFrequency.IMMEDIATELY,
    webHookUrl,
    webHookUserId,
  };
  const aosWebHook: DiscordWebHookSetting = {
    method: NotificationMethod.DISCORD,
    frequency: NotificationFrequency.IMMEDIATELY,
    option: WebHookOption.AOS,
  };
  const eotWebHook: DiscordWebHookSetting = {
    method: NotificationMethod.DISCORD,
    frequency: NotificationFrequency.IMMEDIATELY,
    option: WebHookOption.EOT,
  };
  return {
    marketing,
    turnNotifications: [
      ...(email ? [emailSettings] : []),
      ...(enableWebHook ? [webHook] : []),
      ...(enableAosDiscord ? [aosWebHook] : []),
      ...(enableEotDiscord ? [eotWebHook] : []),
    ],
  };
}

function NotificationSettings() {
  const preferences = useNotificationPreferences();
  const {
    validationError: validationErrorSet,
    setPreferences,
    attempted,
    isPending,
  } = useSetNotificationPreferences();
  const {
    validationError: validationErrorSend,
    test,
    isPending: isTestPending,
  } = useSendTestNotification();

  const validationError = {
    ...validationErrorSet,
    ...validationErrorSend,
  };

  const marketing = preferences.marketing;

  const [email, setEmail] = useCheckboxState(
    preferences.turnNotifications.some(
      ({ method }) => method === NotificationMethod.EMAIL,
    ),
  );

  const initialWebHook = preferences.turnNotifications.find(isWebHookSetting);
  const [enableWebHook, setEnableWebHook] = useCheckboxState(
    initialWebHook != null,
  );
  const [webHookUrl, setWebHookUrl] = useTextInputState(
    initialWebHook?.webHookUrl ?? "",
  );
  const [webHookUserId, setWebHookUserId] = useTextInputState(
    initialWebHook?.webHookUserId ?? "",
  );

  const aosDiscordWebHook = preferences.turnNotifications.find((not) =>
    isDirectWebHookSetting(not, WebHookOption.AOS),
  );
  const [enableAosDiscord, setEnableAosDiscord] = useCheckboxState(
    aosDiscordWebHook != null,
  );

  const eotDiscordWebHook = preferences.turnNotifications.find((not) =>
    isDirectWebHookSetting(not, WebHookOption.EOT),
  );
  const [enableEotDiscord, setEnableEotDiscord] = useCheckboxState(
    eotDiscordWebHook != null,
  );

  const newNotificationSettings = useTypedMemo(buildNotificationSettings, [
    marketing,
    email,
    enableWebHook,
    webHookUrl,
    webHookUserId,
    enableAosDiscord,
    enableEotDiscord,
  ]);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setPreferences(newNotificationSettings);
    },
    [setPreferences, newNotificationSettings],
  );

  const sendTestNotification = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      test(newNotificationSettings);
    },
    [test, newNotificationSettings],
  );

  const webHookUrlError = findErrorInNotifications(
    attempted,
    NotificationMethod.WEBHOOK,
    undefined,
    validationError,
    "webHookUrl",
  );
  const webHookUserIdError = findErrorInNotifications(
    attempted,
    NotificationMethod.WEBHOOK,
    undefined,
    validationError,
    "webHookUserId",
  );

  return (
    <>
      <h2>Notification Preferences</h2>
      <DiscordNotificationSettings preferences={preferences} />
      <Box
        component="form"
        sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
        noValidate
        autoComplete="off"
        onSubmit={onSubmit}
      >
        <div>
          <FormControl>
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label="AoS Discord"
              control={
                <Checkbox
                  checked={enableAosDiscord}
                  disabled={isPending || preferences.discordId == null}
                  onChange={setEnableAosDiscord}
                />
              }
            />
          </FormControl>
        </div>
        <div>
          <FormControl>
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label="EoT Discord"
              control={
                <Checkbox
                  checked={enableEotDiscord}
                  disabled={isPending || preferences.discordId == null}
                  onChange={setEnableEotDiscord}
                />
              }
            />
          </FormControl>
        </div>
        <div>
          <FormControl>
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label="Custom Webhook"
              control={
                <Checkbox
                  checked={enableWebHook}
                  disabled={isPending}
                  onChange={setEnableWebHook}
                />
              }
            />
          </FormControl>
          <FormControl>
            <TextField
              required
              label="Webhook URL"
              value={webHookUrl}
              disabled={!enableWebHook}
              error={webHookUrlError != null}
              helperText={webHookUrlError}
              onChange={setWebHookUrl}
            />
          </FormControl>
          <FormControl>
            <TextField
              required
              label="Webhook User ID"
              disabled={!enableWebHook}
              value={webHookUserId}
              error={webHookUserIdError != null}
              helperText={webHookUserIdError}
              onChange={setWebHookUserId}
            />
          </FormControl>
        </div>
        <FormControl error={email}>
          <FormControlLabel
            sx={{ m: 1, minWidth: 80 }}
            label="Email notifications"
            control={
              <Checkbox
                checked={email}
                disabled={isPending}
                onChange={setEmail}
              />
            }
          />
          {email && (
            <FormHelperText>
              Email notifications are significantly more expensive than webooks.
              Please consider setting up a webhook instead to support the site.
            </FormHelperText>
          )}
        </FormControl>
        <div>
          <Button type="submit" disabled={isPending}>
            Save Preferences
          </Button>
          <Button onClick={sendTestNotification} disabled={isTestPending}>
            Test
          </Button>
        </div>
      </Box>
    </>
  );
}

function UserProfile({ userId }: { userId: number }) {
  const user = useUser(userId);
  if (user == null) return <Loading />;
  return (
    <div>
      Username: {user.username}
      <UserGameList userId={userId} />
    </div>
  );
}

function UserGameList({ userId }: { userId: number }) {
  const query: ListGamesApi = useMemo(
    () => ({
      status: [GameStatus.Enum.ENDED],
      userId: userId,
      order: ["id", "DESC"],
    }),
    [userId],
  );
  return <GameList title="Finished Games" query={query} hideStatus />;
}
