import { Link } from "react-router-dom";
import { UserRole } from "../../api/user";
import { useLogout, useMe, useResendActivationCode } from "../services/me";
import * as styles from "./login_required.module.css";
import { Button } from "semantic-ui-react";

interface LoginRequiredParams {
  children: React.ReactNode;
}

export function LoginRequired({ children }: LoginRequiredParams) {
  const me = useMe();

  if (me == null) return <LoginRequiredPage />;
  if (me.role === UserRole.enum.ACTIVATE_EMAIL) return <ActivateEmailPage />;
  return children;
}

function ActivateEmailPage() {
  const { logout, isPending } = useLogout();
  const { resendNoArgs, isPending: isPendingResend } =
    useResendActivationCode();
  return (
    <div>
      <p>
        You must activate your email. Please check your inbox (and spam folder).
      </p>
      <Button primary onClick={resendNoArgs} disabled={isPendingResend}>
        Resend Activation Code
      </Button>
      <Button negative onClick={logout} disabled={isPending}>
        Logout
      </Button>
    </div>
  );
}

function LoginRequiredPage() {
  return (
    <div className={styles.loginRequired}>
      <h1>Welcome!</h1>
      <p>
        This is a hobby project dedicated to playing a game that involves
        building track on geographic maps with the intent of delivering goods
        cubes. This application is in Beta, and we are prioritizing
        functionality over stability, meaning that you may experience bugs as
        you engage with the platform, and some level of patience with those bugs
        will be necessary.
      </p>
      <p>
        Please provide feedback as we will certainly prioritize things people
        ask for over things in our backlog. If the amount of bugs becomes
        intolerable, let us know! There are things we can do to improve the
        stability, it&apos;s just not a priority right now.
      </p>
      <div className={styles.links}>
        <Button primary as={Link} to="/app/users/register">
          Create account
        </Button>
      </div>
    </div>
  );
}
