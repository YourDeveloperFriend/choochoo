import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateUserApi,
  ForgotPasswordRequest,
  LoginUserApi,
  MyUserApi,
  ResendActivationCodeRequest,
  UpdatePasswordRequest,
  UserRole,
} from "../../api/user";
import { assert } from "../../utils/validate";
import { emitSuccess } from "../utils/notify";
import { tsr } from "./client";
import { handleError } from "./network";

const ME_KEY = ["users", "me"];

function useAllOfMe() {
  const { data, isFetching, error } = tsr.users.getMe.useSuspenseQuery({
    queryKey: ME_KEY,
  });

  if (error && !isFetching) {
    throw error;
  }

  assert(data.status === 200);
  return data.body;
}

export function useMe(): MyUserApi | undefined {
  return useAllOfMe().user;
}

function useUpdateMeCache() {
  const tsrQueryClient = tsr.useQueryClient();
  return useCallback(
    (user: MyUserApi | undefined, adminUser: MyUserApi | undefined) => {
      tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({
        ...r!,
        status: 200,
        body: { user, adminUser },
      }));
    },
    [],
  );
}

export function useUpdateMe() {
  const { mutate, error, isPending } = tsr.users.updateMe.useMutation();
  const validationError = handleError(isPending, error);
  const updateCache = useUpdateMeCache();

  const updateMe = useCallback(
    (user: MyUserApi) => {
      mutate(
        { body: { user } },
        {
          onSuccess: ({ body }) => {
            updateCache(body.user, undefined);
          },
        },
      );
    },
    [mutate],
  );

  return { validationError, updateMe, isPending };
}

const AdminModeEnabled = createContext<
  [boolean, (newAdminMode: boolean) => void]
>([false, () => {}] as const);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { adminUser, user } = useAllOfMe();
  const defaultAdminMode = adminUser != null && adminUser.id !== user?.id;
  const [adminMode, setAdminMode] = useState(defaultAdminMode);
  const { login } = useLoginBypass(adminUser?.id);
  const externalSetAdminMode = useCallback(
    (newAdminMode: boolean) => {
      if (!newAdminMode && adminUser != null && adminUser.id !== user!.id) {
        login();
      }
      setAdminMode(newAdminMode);
    },
    [adminUser, user, setAdminMode],
  );
  return (
    <AdminModeEnabled.Provider value={[adminMode, externalSetAdminMode]}>
      {children}
    </AdminModeEnabled.Provider>
  );
}

export function useEnableAdminMode() {
  return useContext(AdminModeEnabled);
}

export function useIsAdmin(ignoreAdminMode = false): boolean {
  const { user, adminUser } = useAllOfMe();
  const [adminModeEnabled] = useEnableAdminMode();

  if (!adminModeEnabled && !ignoreAdminMode) return false;

  return adminUser != null || user?.role === UserRole.enum.ADMIN;
}

export function useLogin() {
  const navigate = useNavigate();
  const { mutate, error, isPending } = tsr.users.login.useMutation();
  const validationError = handleError(isPending, error);
  const updateCache = useUpdateMeCache();

  const login = useCallback(
    (body: LoginUserApi) =>
      mutate(
        { body },
        {
          onSuccess: (data) => {
            updateCache(data.body.user, undefined);
            if (body.activationCode) {
              emitSuccess("Welcome! CCMF!");
            }
            navigate("/");
          },
        },
      ),
    [],
  );
  return { login, validationError, isPending };
}

export function useLoginBypass(userId?: number) {
  const isAdmin = useIsAdmin();
  const me = useMe();
  const { mutate, error, isPending } = tsr.users.loginBypass.useMutation();
  handleError(isPending, error);
  const updateCache = useUpdateMeCache();

  const login = useCallback(
    () =>
      mutate(
        { params: { userId: userId! } },
        {
          onSuccess: (data) => {
            updateCache(data.body.user, data.body.adminUser);
          },
        },
      ),
    [userId],
  );

  const canUseLoginBypass = userId != null && me?.id !== userId && isAdmin;
  return { login, isPending, error, canUseLoginBypass };
}

export function useRegister() {
  const navigate = useNavigate();
  const { mutate, error, isPending } = tsr.users.create.useMutation();
  const validationError = handleError(isPending, error);
  const updateCache = useUpdateMeCache();

  const register = useCallback(
    (body: CreateUserApi) =>
      mutate(
        { body },
        {
          onSuccess: (data) => {
            updateCache(data.body.user, undefined);
            navigate("/");
          },
        },
      ),
    [],
  );

  return { register, validationError, isPending };
}

export function useForgotPassword() {
  const { mutate, error, isSuccess, isPending } =
    tsr.users.forgotPassword.useMutation();
  const validationError = handleError(isPending, error);

  const forgotPassword = useCallback(
    (body: ForgotPasswordRequest) => mutate({ body }),
    [],
  );

  return { forgotPassword, validationError, isSuccess, isPending };
}

export function useUpdatePassword() {
  const { mutate, error, isPending } = tsr.users.updatePassword.useMutation();
  const validationError = handleError(isPending, error);

  const updatePassword = useCallback(
    (body: UpdatePasswordRequest, onSuccess?: () => void) =>
      mutate(
        { body },
        {
          onSuccess: (_) => {
            emitSuccess("Update succeeded!");
            onSuccess?.();
          },
        },
      ),
    [],
  );

  return { updatePassword, validationError, isPending };
}

export function useLogout() {
  const { mutate, error, isPending } = tsr.users.logout.useMutation();
  handleError(isPending, error);
  const updateCache = useUpdateMeCache();

  const logout = useCallback(() => {
    mutate(
      {},
      {
        onSuccess({ status, body }) {
          assert(status === 200 && body.success);
          updateCache(undefined, undefined);
          emitSuccess("Logout successful");
        },
      },
    );
  }, []);
  return { logout, isPending };
}

export function useResendActivationCode() {
  const { mutate, error, isPending } =
    tsr.users.resendActivationCode.useMutation();
  handleError(isPending, error);

  const resend = useCallback((body: ResendActivationCodeRequest = {}) => {
    mutate(
      { body },
      {
        onSuccess({ status, body }) {
          assert(status === 200 && body.success);
          emitSuccess("Activation code sent");
        },
      },
    );
  }, []);
  const resendNoArgs = useCallback(() => resend(), [resend]);
  return { resend, resendNoArgs, isPending };
}

export function useActivateAccount() {
  const { mutate, error, isError, isPending } =
    tsr.users.activateAccount.useMutation();
  handleError(isPending, error);
  const navigate = useNavigate();
  const updateCache = useUpdateMeCache();

  const activate = useCallback((activationCode: string) => {
    mutate(
      { body: { activationCode } },
      {
        onSuccess({ status, body }) {
          assert(status === 200);
          updateCache(body.user, undefined);
          emitSuccess("Success! CCMF!");
          navigate("/");
        },
      },
    );
  }, []);
  return { activate, isPending, isError };
}
