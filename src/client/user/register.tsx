import { FormEvent, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMe, useRegister } from "../services/me";
import { useTextInputState } from "../utils/form_state";
import { Button, Form, FormGroup, FormInput } from "semantic-ui-react";

export function RegisterPage() {
  const [email, setEmail] = useTextInputState("");
  const [username, setUsername] = useTextInputState("");
  const [password, setPassword] = useTextInputState("");
  const { register, validationError, isPending } = useRegister();
  const navigate = useNavigate();
  const me = useMe();
  useEffect(() => {
    if (me != null) {
      navigate("/");
    }
  }, [me]);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      register({ username, email, password });
    },
    [register, username, email, password],
  );

  return (
    <Form onSubmit={onSubmit}>
      <h1>Register</h1>
      <FormGroup>
        <FormInput
          required
          label="Username"
          value={username}
          error={validationError?.username}
          onChange={setUsername}
        />
        <FormInput
          required
          label="Email"
          value={email}
          error={validationError?.email}
          onChange={setEmail}
        />
        <FormInput
          required
          label="Password"
          type="password"
          value={password}
          error={validationError?.password}
          onChange={setPassword}
        />
      </FormGroup>
      <div>
        <Button primary type="submit" disabled={isPending}>
          Register
        </Button>
      </div>
      <p>
        By registering, you are agreeing to the{" "}
        <a href="/terms.html" target="_blank">
          Terms of Service
        </a>
        .
      </p>
      <p>
        <Link to="/app/users/login">Login</Link>
      </p>
    </Form>
  );
}
