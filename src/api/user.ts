import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { PlayerColorZod } from "../engine/state/player";

export const UserRole = z.enum(["ACTIVATE_EMAIL", "USER", "ADMIN", "BLOCKED"]);
export type UserRole = z.infer<typeof UserRole>;

const UsernameOrEmail = z.string().trim().min(1);
const Password = z.string().min(8);

export const CreateUserApi = z.object({
  email: z.string().trim().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(16)
    .regex(
      /^[a-z0-9_]*$/,
      "Can only use numbers, lowercase letters, and underscores",
    ),
  password: Password,
});
export type CreateUserApi = z.infer<typeof CreateUserApi>;

export const LoginUserApi = z.object({
  usernameOrEmail: UsernameOrEmail,
  activationCode: z.string().optional(),
  password: Password,
});
export type LoginUserApi = z.infer<typeof LoginUserApi>;

export const UserApi = z.object({
  id: z.number(),
  username: z.string(),
  abandons: z.number(),
});
export type UserApi = z.infer<typeof UserApi>;

export const MyUserApi = UserApi.extend({
  email: z.string(),
  role: UserRole,
  preferredColors: PlayerColorZod.array().optional(),
});
export type MyUserApi = z.infer<typeof MyUserApi>;

export const UserPageCursor = z.string();
export type UserPageCursor = z.infer<typeof UserPageCursor>;

export const ListUsersApi = z.object({
  pageSize: z.coerce.number().optional(),
  pageCursor: UserPageCursor.optional(),
  search: z.string().optional(),
});
export type ListUsersApi = z.infer<typeof ListUsersApi>;

const UserParams = z.object({ userId: z.coerce.number() });
type UserParams = z.infer<typeof UserParams>;

export const ResendActivationCodeRequest = z.object({
  userId: z.number().optional(),
});
export type ResendActivationCodeRequest = z.infer<
  typeof ResendActivationCodeRequest
>;

export const ForgotPasswordRequest = z.object({
  usernameOrEmail: UsernameOrEmail,
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
    method: "POST",
    path: "/users/",
  },
  forgotPassword: {
    body: ForgotPasswordRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: "POST",
    path: "/users/forgot-password",
  },
  updateMe: {
    body: z.object({ user: MyUserApi }),
    responses: {
      200: z.object({ user: MyUserApi }),
    },
    method: "PUT",
    path: "/users/me",
  },
  updatePassword: {
    body: UpdatePasswordRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: "POST",
    path: "/users/update-password",
  },
  makeAdmin: {
    body: z.object({}),
    pathParams: UserParams,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: "POST",
    path: "/users/:userId/adminize",
  },
  login: {
    body: LoginUserApi,
    responses: {
      200: z.object({ user: MyUserApi }),
      401: z.object({}),
    },
    method: "POST",
    path: "/users/login",
  },
  resendActivationCode: {
    body: ResendActivationCodeRequest,
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: "POST",
    path: "/users/resend-activation-code",
  },
  activateAccount: {
    body: z.object({ activationCode: z.string() }),
    responses: {
      200: z.object({ user: MyUserApi }),
    },
    method: "POST",
    path: "/users/activate",
  },
  loginBypass: {
    body: z.object({}),
    pathParams: UserParams,
    responses: {
      200: z.object({ user: MyUserApi, adminUser: MyUserApi }),
    },
    method: "POST",
    path: "/users/:userId/login",
  },
  subscribe: {
    body: z.object({ email: z.string().email() }),
    responses: {
      200: z.object({ success: z.literal(true) }),
    },
    method: "POST",
    path: "/users/subscribe",
  },
  logout: {
    body: z.object({}),
    responses: {
      200: z.object({ success: z.boolean() }),
    },
    method: "POST",
    path: "/users/logout",
  },
  getMe: {
    responses: {
      200: z.object({
        adminUser: MyUserApi.optional(),
        user: MyUserApi.optional(),
      }),
    },
    method: "GET",
    path: "/users/me",
  },
  get: {
    pathParams: UserParams,
    responses: {
      200: z.object({ user: UserApi }),
    },
    method: "GET",
    path: "/users/:userId",
  },
  list: {
    responses: {
      200: z.object({
        users: z.array(MyUserApi),
        nextPageCursor: UserPageCursor.optional(),
      }),
    },
    query: ListUsersApi,
    method: "GET",
    path: "/users/",
  },
});
