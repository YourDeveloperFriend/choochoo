import { useNotifications } from "@toolpad/core";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateInviteApi, CreateUserApi, LoginUserApi, MyUserApi } from "../../api/user";
import { assert } from "../../utils/validate";
import { tsr } from "./client";
import { handleError } from "./network";

const ME_KEY = ['users', 'me'];

export function useMe(): MyUserApi | undefined {
  const { data, isFetching, error } = tsr.users.getMe.useSuspenseQuery({ queryKey: ME_KEY });

  if (error && !isFetching) {
    throw error;
  }

  assert(data.status === 200);
  return data.body.user;
}

export function useCreateInvitation() {
  const me = useMe();
  const notifications = useNotifications();
  const { mutate, error, isPending } = tsr.users.createInvite.useMutation();
  handleError(isPending, error);

  const createInvite = useCallback((body: CreateInviteApi) => mutate({ params: { userId: me!.id }, body }, {
    onSuccess: (_) => {
      notifications.show('Code Created', { autoHideDuration: 2000 });
    },
  }), [me]);
  return { createInvite, isPending };
}

export function useSubscribe() {
  const { mutate, error, isPending } = tsr.users.subscribe.useMutation();
  const validationError = handleError(isPending, error);
  const [isSuccess, setIsSuccess] = useState(false);

  const subscribe = useCallback((email: string) => mutate({ body: { email } }, {
    onSuccess: (data) => {
      setIsSuccess(true);
    },
  }), []);
  return { subscribe, isSuccess, validationError, isPending };
}

export function useLogin() {
  const notifications = useNotifications();
  const tsrQueryClient = tsr.useQueryClient();
  const navigate = useNavigate();
  const { mutate, error, isPending } = tsr.users.login.useMutation();
  const validationError = handleError(isPending, error);

  const login = useCallback((body: LoginUserApi) => mutate({ body }, {
    onSuccess: (data) => {
      tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({ ...r!, status: 200, body: { user: data.body.user } }));
      if (body.activationCode) {
        notifications.show('Welcome! CCMF!', { autoHideDuration: 2000 });
      }
      navigate('/');
    },
  }), []);
  return { login, validationError, isPending };
}

export function useLoginBypass() {
  const tsrQueryClient = tsr.useQueryClient();
  const { mutate, error, isPending } = tsr.users.loginBypass.useMutation();
  handleError(isPending, error);

  const login = useCallback((userId: number) => mutate({ params: { userId } }, {
    onSuccess: (data) => {
      tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({ ...r!, status: 200, body: { user: data.body.user } }));
    },
  }), []);
  return { login, isPending, error };
}

export function useRegister() {
  const tsrQueryClient = tsr.useQueryClient();
  const navigate = useNavigate();
  const { mutate, error, isPending } = tsr.users.create.useMutation();
  const validationError = handleError(isPending, error);

  const register = useCallback((body: CreateUserApi) => mutate({ body }, {
    onSuccess: (data) => {
      tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({ ...r!, status: 200, body: { user: data.body.user } }));
      navigate('/');
    },
  }), []);

  return { register, validationError, isPending };
}

export function useLogout() {
  const tsrQueryClient = tsr.useQueryClient();
  const { mutate, error, isPending } = tsr.users.logout.useMutation();
  handleError(isPending, error);
  const notifications = useNotifications();

  const logout = useCallback(() => {
    mutate({}, {
      onSuccess({ status, body }) {
        assert(status === 200 && body.success);
        tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({ ...r!, status: 200, body: { user: undefined } }));
        notifications.show('Logout successful', { autoHideDuration: 2000 });
      },
    });
  }, []);
  return { logout, isPending };
}

export function useResendActivationCode() {
  const tsrQueryClient = tsr.useQueryClient();
  const { mutate, error, isPending } = tsr.users.resendActivationCode.useMutation();
  handleError(isPending, error);
  const notifications = useNotifications();

  const resend = useCallback(() => {
    mutate({}, {
      onSuccess({ status, body }) {
        assert(status === 200 && body.success);
        notifications.show('Activation code sent', { autoHideDuration: 2000 });
      },
    });
  }, []);
  return { resend, isPending };
}

export function useActivateAccount() {
  const tsrQueryClient = tsr.useQueryClient();
  const { mutate, error, isError, isPending } = tsr.users.activateAccount.useMutation();
  handleError(isPending, error);
  const notifications = useNotifications();
  const navigate = useNavigate();

  const activate = useCallback((activationCode: string) => {
    mutate({ body: { activationCode } }, {
      onSuccess({ status, body }) {
        assert(status === 200);
        tsrQueryClient.users.getMe.setQueryData(ME_KEY, (r) => ({ ...r!, status: 200, body: { user: body.user } }));
        notifications.show('Success! CCMF!', { autoHideDuration: 2000 });
        navigate('/');
      },
    });
  }, []);
  return { activate, isPending, isError };
}