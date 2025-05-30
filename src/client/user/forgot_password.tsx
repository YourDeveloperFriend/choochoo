import { FormEvent, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForgotPassword } from "../services/me";
import { useTextInputState } from "../utils/form_state";
import {Button, Form, FormField, FormInput} from "semantic-ui-react";

export function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useTextInputState("");
  const { forgotPassword, validationError, isSuccess, isPending } =
    useForgotPassword();

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      forgotPassword({ usernameOrEmail });
    },
    [usernameOrEmail, forgotPassword],
  );

  return (
    <>
      <h1>Forgot Password?</h1>
      {isSuccess && (
        <p>
          Success! Check your email for a link to help you update your password.
        </p>
      )}
      {!isSuccess && (
        <Form
          onSubmit={onSubmit}>
          <FormInput
              inline
              required
              label="Username or Email"
              value={usernameOrEmail}
              error={validationError?.usernameOrEmail}
              onChange={setUsernameOrEmail}
            />
          <div>
            <Button primary type="submit" disabled={isPending}>
              Request update password link
            </Button>
          </div>
          <p>
            <Link to="/app/users/login">Login</Link>
          </p>
        </Form>
      )}
    </>
  );
}
