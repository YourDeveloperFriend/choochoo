import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUnsubscribe } from "../services/notifications";
import { Button } from "semantic-ui-react";

export function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const { unsubscribe, isPending, isSuccess } = useUnsubscribe();
  const navigate = useNavigate();

  useEffect(() => {
    if (code == null) {
      navigate("/");
    }
  }, [code]);

  const onClick = useCallback(() => {
    unsubscribe(code!);
  }, [unsubscribe, code]);

  return (
    <div>
      <h1>Unsubscribe</h1>
      <p>Sorry to see you go!</p>
      <p>
        Click below to unsubscribe from all turn notifications and marketing
        emails.
      </p>
      <p>
        You will still be emailed for transactional purposes like forget
        password emails.
      </p>
      <p>
        {!isSuccess && (
          <Button primary onClick={onClick} disabled={isPending}>
            Unsubscribe
          </Button>
        )}
        {isSuccess && <Button primary>Success!</Button>}
      </p>
    </div>
  );
}
