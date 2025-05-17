import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
} from "@mui/material";
import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { Container, Header, Segment } from "semantic-ui-react";
import { ValidationError } from "../../api/error";
import { GameStatus, ListGamesApi } from "../../api/game";
import {
  CustomDiscordWebHookSetting,
  DiscordWebHookSetting,
  isCustomDiscordWebHookSetting,
  isDiscordWebHookSetting,
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
import { useNotificationPreferences } from "../services/notifications/preferences";
import { useSetNotificationPreferences } from "../services/notifications/set";
import { useSendTestNotification } from "../services/notifications/test_notification";
import { useUser } from "../services/user";
import { useCheckboxState, useTextInputState } from "../utils/form_state";
import { useTypedMemo } from "../utils/hooks";
import { DiscordNotificationSettings } from "./discord";
import { PreferredColors } from "./preferred_colors";
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
    <Container>
      <Header as="h1">Profile Settings</Header>
      <Segment>
        <p>Username: {me.username}</p>
        <p>Email: {me.email}</p>
        <p># Abandons: {me.abandons}</p>
      </Segment>
      <UpdatePassword />
      <PreferredColors />
      <NotificationSettings />
      <UserGameList userId={me.id} />
    </Container>
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
  enableCustomDiscord: boolean,
  customDiscordWebHook: string,
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
  const customDiscord: CustomDiscordWebHookSetting = {
    method: NotificationMethod.CUSTOM_DISCORD,
    frequency: NotificationFrequency.IMMEDIATELY,
    webHookUrl: customDiscordWebHook,
  };
  return {
    marketing,
    turnNotifications: [
      ...(email ? [emailSettings] : []),
      ...(enableWebHook ? [webHook] : []),
      ...(enableAosDiscord ? [aosWebHook] : []),
      ...(enableEotDiscord ? [eotWebHook] : []),
      ...(enableCustomDiscord ? [customDiscord] : []),
    ],
  };
}

function NotificationSettings() {
  const preferences = useNotificationPreferences();
  const [key, setKey] = useState(Date.now());

  useEffect(() => {
    setKey(Date.now());
  }, [preferences]);

  return (
    <div key={key}>
      <InternalNotificationSettings preferences={preferences} />
    </div>
  );
}

function InternalNotificationSettings({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
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
    isDiscordWebHookSetting(not, WebHookOption.AOS),
  );
  const [enableAosDiscord, setEnableAosDiscord] = useCheckboxState(
    aosDiscordWebHook != null,
  );

  const eotDiscordWebHook = preferences.turnNotifications.find((not) =>
    isDiscordWebHookSetting(not, WebHookOption.EOT),
  );
  const [enableEotDiscord, setEnableEotDiscord] = useCheckboxState(
    eotDiscordWebHook != null,
  );

  const customDiscordWebHook = preferences.turnNotifications.find((not) =>
    isCustomDiscordWebHookSetting(not),
  );
  const [enableCustomDiscord, setEnableCustomDiscord] = useCheckboxState(
    customDiscordWebHook != null,
  );
  const [discordWebHookUrl, setDiscordWebHookUrl] = useTextInputState(
    customDiscordWebHook?.webHookUrl ?? "",
  );

  const newNotificationSettings = useTypedMemo(buildNotificationSettings, [
    marketing,
    email,
    enableWebHook,
    webHookUrl,
    webHookUserId,
    enableAosDiscord,
    enableEotDiscord,
    enableCustomDiscord,
    discordWebHookUrl,
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
      test({ ...newNotificationSettings, discordId: preferences.discordId });
    },
    [test, newNotificationSettings, preferences.discordId],
  );

  const discordWebHookUrlError = findErrorInNotifications(
    attempted,
    NotificationMethod.CUSTOM_DISCORD,
    undefined,
    validationError,
    "webHookUrl",
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
    <Segment>
      <Header as="h2">Notification Preferences</Header>
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
              label="Discord Webhook"
              control={
                <Checkbox
                  checked={enableCustomDiscord}
                  disabled={isPending || preferences.discordId == null}
                  onChange={setEnableCustomDiscord}
                />
              }
            />
          </FormControl>
          <FormControl>
            <TextField
              required
              label="Discord Webhook URL"
              value={discordWebHookUrl}
              disabled={!enableCustomDiscord}
              error={discordWebHookUrlError != null}
              helperText={discordWebHookUrlError}
              onChange={setDiscordWebHookUrl}
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
    </Segment>
  );
}

function UserProfile({ userId }: { userId: number }) {
  const user = useUser(userId);
  if (user == null) return <Loading />;

  return (
    <Container>
      <Header as="h1">Profile Settings</Header>
      <Segment>
        <p>Username: {user.username}</p>
        <p># Abandons: {user.abandons}</p>
      </Segment>
      <UserGameList userId={userId} />
    </Container>
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
