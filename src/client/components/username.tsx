import { Link } from "react-router-dom";
import { isNotNull } from "../../utils/functions";
import { useUsers, useUserUnsuspended } from "../services/user";
import * as styles from "./username.module.css";

interface UsernameProps {
  userId: number;
  useAt?: boolean;
  useLink?: boolean;
  suspense?: boolean;
}

export function Username({ userId, useAt, useLink }: UsernameProps) {
  const { data, isPending } = useUserUnsuspended(userId);

  return (
    <>
      {isPending ? (
        "<Loading>"
      ) : data?.body.user.username != null ? (
        <MaybeLink
          username={data.body.user.username}
          userId={userId}
          useAt={useAt}
          useLink={useLink}
        />
      ) : (
        "<Unknown>"
      )}
    </>
  );
}

interface MaybeLinkProps {
  username: string;
  userId: number;
  useAt?: boolean;
  useLink?: boolean;
}

function MaybeLink({ username, userId, useAt, useLink }: MaybeLinkProps) {
  const content = (useAt ? "@" : "") + username;
  if (!useLink) {
    return <>{content}</>;
  }
  return (
    <Link to={`/app/users/${userId}`} className={styles.link}>
      {content}
    </Link>
  );
}

interface UsernameListProps {
  userIds: number[];
  useLink?: boolean;
}

export function UsernameList({ userIds, useLink }: UsernameListProps) {
  const users = useUsers(userIds);

  return (
    <>
      {users.filter(isNotNull).map(({ id, username }, index) => (
        <span key={username}>
          {index !== 0 && ", "}
          <MaybeLink username={username} userId={id} useLink={useLink} />
        </span>
      ))}
    </>
  );
}
