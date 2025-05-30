import { useLocation } from "react-router-dom";
import { NotificationPreferences } from "../../api/notifications";
import { useUnlink } from "../services/notifications/unlink";
import { Button } from "semantic-ui-react";

export function DiscordNotificationSettings({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const unlink = useUnlink();

  const location = useLocation();

  return (
    <form method="GET" action="https://discord.com/oauth2/authorize">
      <input type="hidden" name="client_id" value="1336123312228794368" />
      <input
        type="hidden"
        name="redirect_uri"
        value={window.location.origin + "/app/users/link-discord"}
      />
      <input type="hidden" name="state" value={location.pathname} />
      <input type="hidden" name="response_type" value="token" />
      <input type="hidden" name="scope" value="identify email" />
      <Button primary type="submit">
        {preferences.discordId != null ? "Update discord id" : "Link Discord"}
      </Button>
      {preferences.discordId != null && (
        <Button negative onClick={(event, data) => {
            event.preventDefault();
            unlink();
        }}>Unlink discord</Button>
      )}
    </form>
  );
}
