import { MyUserApi } from "../../api/user";
import { redisClient } from "../redis";

class UserCache {
  async get(id: number): Promise<MyUserApi | undefined> {
    if (redisClient == null) {
      return;
    }
    const result = await redisClient.get(`users:${id}`);
    if (result == null) {
      return undefined;
    }
    return JSON.parse(result);
  }

  async set(user: MyUserApi | undefined): Promise<void> {
    if (user == null) {
      return;
    }
    if (redisClient == null) {
      return;
    }
    await redisClient.set(
      `users:${user.id}`,
      JSON.stringify(user),
      "PX",
      360000,
    );
  }
}

export const userCache = new UserCache();
