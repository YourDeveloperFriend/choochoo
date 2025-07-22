import { useCallback, useMemo, useState } from "react";
import { ListUsersApi, UserApi, UserPageCursor } from "../../api/user";
import { ImmutableMap } from "../../utils/immutable";
import { tsr } from "./client";
import { handleError } from "./network";

function getQueryKey(userId: number) {
  return ["users", userId];
}

function userQuery(userId: number) {
  return {
    queryKey: getQueryKey(userId),
    queryData: { params: { userId } },
  };
}

export function useUserUnsuspended(userId: number) {
  return tsr.users.get.useQuery(userQuery(userId));
}

export function useUser(userId: number): UserApi {
  const { data } = tsr.users.get.useSuspenseQuery(userQuery(userId));

  return data.body.user;
}

export function useUsers(userIds: number[]): Array<UserApi | undefined> {
  const deduplicate = useMemo(() => [...new Set(userIds)], [userIds]);
  const { data } = tsr.users.get.useQueries({
    queries: deduplicate.map(userQuery),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        pending: results.some((result) => result.isPending),
      };
    },
  });
  return useMemo(() => {
    const users = data.map((d) => d?.body.user);
    return userIds.map((userId) => users.find((user) => user?.id === userId));
  }, [userIds, data]);
}

export function useUserList(query: ListUsersApi) {
  const queryWithLimit: ListUsersApi = { pageSize: 20, ...query };
  const queryKeyFromFilter = Object.entries(queryWithLimit)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
  const queryKey = ["userList", queryKeyFromFilter];
  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    tsr.users.list.useInfiniteQuery({
      queryKey,
      queryData: ({ pageParam }) => ({
        query: { ...queryWithLimit, pageCursor: pageParam },
      }),
      initialPageParam: undefined as UserPageCursor | undefined,
      getNextPageParam: ({ status, body }): UserPageCursor | undefined => {
        if (status !== 200) return undefined;
        return body.nextPageCursor;
      },
    });

  handleError(isLoading, error);

  const [pageN, setPageN] = useState(ImmutableMap<string, number>());

  const page = useMemo(
    () => pageN.get(queryKeyFromFilter) ?? 0,
    [pageN, queryKeyFromFilter],
  );
  const setPage = useCallback(
    (page: number) => {
      setPageN((prev) => prev.set(queryKeyFromFilter, page));
    },
    [queryKeyFromFilter, setPageN],
  );

  const users = data?.pages[page]?.body.users;

  const isOnLastPage =
    data != null && !hasNextPage && data.pages.length - 1 === page;
  const nextPage = useCallback(() => {
    if (isLoading || isOnLastPage) return;
    setPage(page + 1);
    if (data != null && hasNextPage && data.pages.length - 1 === page) {
      fetchNextPage();
    }
  }, [isLoading, setPage, page, hasNextPage, data]);

  const hasPrevPage = page > 0;
  const prevPage = useCallback(() => {
    if (!hasPrevPage) return;
    setPage(page - 1);
  }, [page, setPage, page]);

  return {
    users,
    hasNextPage: !isOnLastPage,
    nextPage,
    hasPrevPage,
    prevPage,
    isLoading,
  };
}
