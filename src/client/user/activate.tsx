import { Button } from "@mui/material";
import { useNotifications } from "@toolpad/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserRole } from "../../api/user";
import {
  useActivateAccount,
  useMe,
  useResendActivationCode,
} from "../services/me";

export function ActivatePage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const me = useMe();
  const [searchParams] = useSearchParams();
  const activationCode = searchParams.get("activationCode");
  const { resendNoArgs, isPending: isPendingResend } =
    useResendActivationCode();
  const { activate, isPending, isError } = useActivateAccount();
  const [hasInitialized, setHasInitialized] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (me == null) {
      hasNavigated.current = true;
      notifications.show("Login to activate your account", {
        autoHideDuration: 2000,
        severity: "error",
      });
      navigate("/app/users/login?activationCode=" + activationCode);
      return;
    }
    if (me.role == UserRole.enum.USER) {
      navigate("/");
      return;
    }
    setHasInitialized(true);
    if (activationCode == null || activationCode == "") {
      return;
    }
    if (isPending || isError) return;

    activate(activationCode);
  }, [me, activate, activationCode, isPending, navigate]);

  if (!hasInitialized || isPending) {
    return <div>Activating account...</div>;
  }

  return (
    <div>
      Failed to activate your account. Please try again.
      <Button onClick={resendNoArgs} disabled={isPendingResend}>
        Resend activation code
      </Button>
    </div>
  );
}
