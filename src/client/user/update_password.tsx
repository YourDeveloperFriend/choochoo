import { FormEvent, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Form,
  FormGroup,
  FormInput,
  Header,
  Segment,
} from "semantic-ui-react";
import { useMe, useUpdatePassword } from "../services/me";
import { useTextInputState } from "../utils/form_state";

export function UpdatePasswordWithCode() {
  const [searchParams] = useSearchParams();
  const updateCode = searchParams.get("code") ?? undefined;
  const navigate = useNavigate();

  const onSuccess = useCallback(() => {
    navigate("/app/users/login");
  }, []);

  return <UpdatePassword updateCode={updateCode} onSuccess={onSuccess} />;
}

interface UpdatePasswordProps {
  updateCode?: string;
  onSuccess?: () => void;
}

export function UpdatePassword({ updateCode, onSuccess }: UpdatePasswordProps) {
  const me = useMe();
  const { updatePassword, validationError, isPending } = useUpdatePassword();
  const [oldPassword, setOldPassword, setOldPasswordRaw] = useTextInputState();
  const [newPassword, setNewPassword, setNewPasswordRaw] = useTextInputState();
  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      updatePassword({ oldPassword, newPassword, updateCode }, () => {
        setOldPasswordRaw("");
        setNewPasswordRaw("");
        onSuccess?.();
      });
    },
    [newPassword, updateCode, updatePassword],
  );

  const isInvalid = me == null && updateCode == null;

  return (
    <Segment>
      <Header as="h2">Update password</Header>
      {isInvalid && (
        <p>
          Must provide an update code. Are you trying to{" "}
          <Link to="/app/users/forgot-password">update your password?</Link>
        </p>
      )}
      {!isInvalid && (
        <Form onSubmit={onSubmit}>
          <FormGroup>
            {!updateCode && (
              <FormInput
                required
                type="password"
                label="Old Password"
                value={oldPassword}
                error={validationError?.oldPassword}
                onChange={setOldPassword}
              />
            )}
            <FormInput
              required
              type="password"
              label="New Password"
              value={newPassword}
              error={validationError?.newPassword}
              onChange={setNewPassword}
            />
          </FormGroup>

          <div>
            <Button primary type="submit" disabled={isPending}>
              Update password
            </Button>
          </div>
          {updateCode && (
            <p>
              <Link to="/app/users/login">Login</Link>
            </p>
          )}
        </Form>
      )}
    </Segment>
  );
}
