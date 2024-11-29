import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export const UserRole = z.enum(['ACTIVATE_EMAIL', 'USER', 'ADMIN', 'BLOCKED']);
export type UserRole = z.infer<typeof UserRole>;

export const NotificationSettings = z.object({
  turnNotifications: z.boolean().optional(),
  unsubscribedFromAll: z.boolean().optional(),
});
export type NotificationSettings = z.infer<typeof NotificationSettings>;

const Password = z.string().min(8).max(32);

export const CreateUserApi = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z.string().toLowerCase().trim().min(3).max(16).regex(/^[a-z0-9_]*$/, 'Can only use numbers, lowercase letters, and underscores'),
  password: Password,
  invitationCode: z.string(),
});
export type CreateUserApi = z.infer<typeof CreateUserApi>;

export const LoginUserApi = z.object({
  usernameOrEmail: z.string().trim().toLowerCase().min(1),
  activationCode: z.string().optional(),
  password: Password,
});
export type LoginUserApi = z.infer<typeof LoginUserApi>;

export const UserApi = z.object({
  id: z.number(),
  username: z.string(),
});
export type UserApi = z.infer<typeof UserApi>;

export const MyUserApi = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  notificationSettings: NotificationSettings,
  role: UserRole,
});
export type MyUserApi = z.infer<typeof MyUserApi>;

export const UserPageCursor = z.array(z.coerce.number());
export type UserPageCursor = z.infer<typeof UserPageCursor>;

export const ListUsersApi = z.object({
  pageSize: z.coerce.number().optional(),
  pageCursor: UserPageCursor.optional(),
});
export type ListUsersApi = z.infer<typeof ListUsersApi>;

export const InviteApi = z.object({
  code: z.string().min(1),
});
export type InviteApi = z.infer<typeof InviteApi>;

export const CreateInviteApi = z.object({
  code: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores and dashes are allowed'),
  count: z.number().gte(1),
});
export type CreateInviteApi = z.infer<typeof CreateInviteApi>;

export const UserParams = z.object({ userId: z.coerce.number() });
export type UserParams = z.infer<typeof UserParams>;

export const ResendActivationCodeRequest = z.object({
  userId: z.number().optional(),
});
export type ResendActivationCodeRequest = z.infer<typeof ResendActivationCodeRequest>;

export const ForgotPasswordRequest = z.object({
  usernameOrEmail: z.string(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;

export const UpdatePasswordRequest = z.object({
  oldPassword: z.string().optional(),
  newPassword: Password,
  updateCode: z.string().optional(),
});
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequest>;



const c = initContract();

export const userContract = c.router({
  create: {
    body: CreateUserApi,
    responses: {
      200: z.object({ user: MyUserApi }),
    },
    method: 'POST',
    path: '/users/',
  },
  forgotPassword: {
    body: ForgotPasswordRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/forgot-password',
  },
  updatePassword: {
    body: UpdatePasswordRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/update-password',
  },
  createInvite: {
    body: CreateInviteApi,
    pathParams: UserParams,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/:userId/invite',
  },
  makeAdmin: {
    body: z.object({}),
    pathParams: UserParams,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/:userId/adminize',
  },
  login: {
    body: LoginUserApi,
    responses: {
      200: z.object({ user: MyUserApi }),
      401: z.object({}),
    },
    method: 'POST',
    path: '/users/login',
  },
  resendActivationCode: {
    body: ResendActivationCodeRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/resend-activation-code',
  },
  activateAccount: {
    body: z.object({ activationCode: z.string() }),
    responses: {
      200: z.object({ user: MyUserApi }),
    },
    method: 'POST',
    path: '/users/activate',
  },
  loginBypass: {
    body: z.object({}),
    pathParams: UserParams,
    responses: {
      200: z.object({ user: MyUserApi }),
    },
    method: 'POST',
    path: '/users/:userId/login',
  },
  subscribe: {
    body: z.object({ email: z.string().email() }),
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: 'POST',
    path: '/users/subscribe',
  },
  logout: {
    body: z.object({}),
    responses: {
      200: z.object({ success: z.boolean() }),
    },
    method: 'POST',
    path: '/users/logout',
  },
  getMe: {
    responses: {
      200: z.object({ user: MyUserApi.optional() }),
    },
    method: 'GET',
    path: '/users/me',
  },
  get: {
    pathParams: UserParams,
    responses: {
      200: z.object({ user: UserApi }),
    },
    method: 'GET',
    path: '/users/:userId',
  },
  list: {
    responses: {
      200: z.object({ users: z.array(MyUserApi), nextPageCursor: UserPageCursor.optional() }),
    },
    query: ListUsersApi,
    method: 'GET',
    path: '/users/',
  }
});