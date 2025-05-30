import { Link } from "react-router-dom";
import { NotificationPreferences } from "../../api/notifications";
import { UserRole } from "../../api/user";
import { useMe } from "../services/me";
import { useNotificationPreferences } from "../services/notifications/preferences";
import { DiscordNotificationSettings } from "../user/discord";
import * as styles from "./banner.module.css";
import { Button } from "semantic-ui-react";

export function Banner() {
  const me = useMe();
  if (me == null) {
    return <></>;
  }
  return <NotificationPreferencesBanner />;
}

function NotificationPreferencesBanner() {
  const me = useMe();
  if (!me || me.role !== UserRole.enum.USER) return <></>;

  return <InternalNotificationPreferencesBanner />;
}

function InternalNotificationPreferencesBanner() {
  const preferences = useNotificationPreferences();

  if (preferences.turnNotifications.length === 0) {
    return <SetNotificationPreferencesBanner />;
  }

  return <FixNotificationPreferencesBanner preferences={preferences} />;
}

function SetNotificationPreferencesBanner() {
  const me = useMe()!;

  return (
    <div className={styles.banner}>
      <div className={styles.message}>
        Set up notification settings so you don&apos;t miss your turn.
      </div>
      <div>
        <Button primary as={Link} to={`/app/users/${me.id}`}>
          Update
        </Button>
      </div>
    </div>
  );
}

function FixNotificationPreferencesBanner({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  if (
    preferences.discordId == null ||
    !preferences.discordId.match(/[a-zA-Z]/)
  ) {
    return <></>;
  }
  return (
    <div className={styles.banner}>
      <div className={styles.message}>
        We detected an issue with your discord notification settings. Link your
        discord account to fix.
      </div>
      <div>
        <DiscordNotificationSettings preferences={preferences} />
      </div>
    </div>
  );
}
