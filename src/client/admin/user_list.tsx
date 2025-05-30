import { UserRole } from "../../api/user";
import { LoginButton } from "../game/login_button";
import { useResendActivationCode } from "../services/me";
import { useUserList } from "../services/user";
import {Button} from "semantic-ui-react";

export function UserList() {
  const { users, hasNextPage, nextPage, hasPrevPage, prevPage, isLoading } =
    useUserList();
  const { resend, isPending } = useResendActivationCode();

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.role == UserRole.enum.ACTIVATE_EMAIL && (
                  <Button
                    primary
                    disabled={isPending}
                    onClick={() => resend({ userId: user.id })}
                  >
                    Resend activation code
                  </Button>
                )}
                <LoginButton playerId={user.id}>Act as</LoginButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasNextPage && (
        <Button disabled={isLoading} onClick={nextPage}>
          Next
        </Button>
      )}
      {hasPrevPage && (
        <Button disabled={isLoading} onClick={prevPage}>
          Prev
        </Button>
      )}
    </div>
  );
}
