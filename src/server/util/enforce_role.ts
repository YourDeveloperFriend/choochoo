import { NextFunction, Request, Response } from "express";
import { SessionData } from "express-session";
import { MyUserApi, UserRole } from "../../api/user";
import { UnauthorizedError } from "../../utils/error";
import { assert } from "../../utils/validate";
import { UserDao } from "../user/dao";

interface BaseRequest {
  url: string;
  session: SessionData;
}

const rolesInOrder = [
  UserRole.enum.BLOCKED,
  UserRole.enum.ACTIVATE_EMAIL,
  UserRole.enum.USER,
  UserRole.enum.ADMIN,
];

export async function assertRole(req: BaseRequest, requiredRole: UserRole = UserRole.Values.USER): Promise<MyUserApi> {
  const userId = req.session.adminUserId ?? req.session.userId;
  if (userId == null) {
    throw new UnauthorizedError('please log in');
  }

  const user = await UserDao.getUser(userId);

  if (user == null) {
    throw new UnauthorizedError('please log in');
  }

  assert(rolesInOrder.indexOf(user.role) >= rolesInOrder.indexOf(requiredRole), { permissionDenied: true });
  return user;
}

export function enforceRoleMiddleware() {
  return (req: Request, _: Response, next: NextFunction) => {
    if (!req.url.startsWith('/api') || req.url.startsWith('/api/users')) return next();
    assertRole(req).then(() => next(), next);
  };
}