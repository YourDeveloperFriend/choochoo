import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserRole } from "../../api/user";
import {
  useActivateAccount,
  useMe,
  useResendActivationCode,
} from "../services/me";
import { Button } from "semantic-ui-react";

export function ActivatePage() {
  const navigate = useNavigate();
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
      toast.error("Login to activate your account");
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
      <Button primary onClick={resendNoArgs} disabled={isPendingResend}>
        Resend activation code
      </Button>
    </div>
  );
}
