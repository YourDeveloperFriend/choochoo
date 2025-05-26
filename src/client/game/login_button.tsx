import { ReactNode } from "react";
import { useLoginBypass } from "../services/me";
import { Button, Icon } from "semantic-ui-react";

export function LoginButton({
  playerId,
  children,
}: {
  playerId: number;
  children: ReactNode;
}) {
  const { login, isPending, canUseLoginBypass } = useLoginBypass(playerId);
  if (!canUseLoginBypass) return <></>;

  return (
    <Button
      icon
      labelPosition="left"
      basic
      color="violet"
      onClick={login}
      disabled={isPending}
    >
      <Icon name="user" />
      {children}
    </Button>
  );
}
