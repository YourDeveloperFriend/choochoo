import { MyUserApi } from "../../api/user";
import { redisClient } from "../redis";
import { environment, Stage } from "../util/environment";

class UserCache {
  async get(id: number): Promise<MyUserApi | undefined> {
    if (environment.stage != Stage.enum.production) return;
    const result = await redisClient.get(`users:${id}`);
    if (result == null) return undefined;
    return JSON.parse(result);
  }

  async set(user: MyUserApi | undefined): Promise<void> {
    if (user == null) return;
    if (environment.stage != Stage.enum.production) return;
    await redisClient.set(
      `users:${user.id}`,
      JSON.stringify(user),
      "PX",
      360000,
    );
  }
}

export const userCache = new UserCache();
