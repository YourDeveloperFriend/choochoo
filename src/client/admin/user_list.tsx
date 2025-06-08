import { UserRole } from "../../api/user";
import { LoginButton } from "../game/login_button";
import { useResendActivationCode } from "../services/me";
import { useUserList } from "../services/user";
import {Button, Icon, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from "semantic-ui-react";

export function UserList() {
  const { users, hasNextPage, nextPage, hasPrevPage, prevPage, isLoading } =
    useUserList();
  const { resend, isPending } = useResendActivationCode();

  return (
    <div>
      <Table celled compact>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Username</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div style={{marginTop: "1em"}}>
        {hasPrevPage && (
          <Button disabled={isLoading} onClick={prevPage}>
            <Icon name="angle left" />
            Prev
          </Button>
        )}
        {hasNextPage && (
            <Button disabled={isLoading} onClick={nextPage}>
              Next
              <Icon name="angle right" />
            </Button>
        )}
      </div>
    </div>
  );
}
