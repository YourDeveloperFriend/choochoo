import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { GameStatus } from "../../api/game";
import { UserRole } from "../../api/user";
import { VariantConfig } from "../../api/variant_config";
import { SerializedGameData } from "../../engine/framework/state";
import { MutablePlayerData, PlayerColor } from "../../engine/state/player";
import { GameDao } from "../../server/game/dao";
import { UserDao } from "../../server/user/dao";
import { log, removeKeys } from "../../utils/functions";

interface GameEnvironment {
  game: GameDao;
  players: Map<PlayerColor, UserDao>;
  activePlayer: UserDao;
}

export function setUpGameEnvironment(
  variantConfig: VariantConfig,
  gameDataFile: string,
): GameEnvironment {
  const gameEnvironment = {} as GameEnvironment;

  beforeEach(async function setUpGameData() {
    log("start game data set up");
    const gameData = await parseGameData(gameDataFile);
    const users = await initializeUsers();

    const playerData = gameData.gameData["players"] as MutablePlayerData[];
    const players = (gameEnvironment.players = new Map<PlayerColor, UserDao>());
    const currentPlayerColor = gameData.gameData[
      "currentPlayer"
    ] as PlayerColor;
    for (const player of playerData) {
      const user = users.pop()!;
      player.playerId = user.id;
      players.set(player.color, user);
      if (player.color === currentPlayerColor) {
        gameEnvironment.activePlayer = user;
      }
    }

    gameEnvironment.game = await initializeGame(
      variantConfig,
      gameData,
      gameEnvironment.activePlayer,
      [...players.values()],
    );
    log("end game data set up");
  });

  afterEach(async function cleanUpGameData() {
    log("start game data cleanup");
    if (gameEnvironment.game != null) {
      await GameDao.destroy({
        where: { id: gameEnvironment.game.id },
        force: true,
      });
    }
    log("end game data cleanup");
  });

  return gameEnvironment;
}

export async function compareGameData(game: GameDao, gameDataFile: string) {
  await game.reload();
  const actualGameDataValue = removeKeys(
    {
      ...game.toApi(),
      gameData: JSON.parse(game.gameData!),
    },
    "id",
    "turnStartTime",
  );

  // Remove undefined values
  const actualGameData = JSON.parse(JSON.stringify(actualGameDataValue));

  if (process.env.WRITE === "true") {
    await writeFile(
      resolve(__dirname, `../goldens/${gameDataFile}.json`),
      JSON.stringify(actualGameData, null, 2),
      "utf-8",
    );
  } else {
    const expectedGameData = await parseFile(gameDataFile);
    expect(actualGameData).toEqual(expectedGameData);
  }
}

async function initializeGame(
  variantConfig: VariantConfig,
  gameData: SerializedGameData,
  currentPlayer: UserDao,
  players: UserDao[],
): Promise<GameDao> {
  return GameDao.create({
    version: 1,
    gameKey: variantConfig.gameKey,
    gameData: JSON.stringify(gameData),
    name: "Test game",
    status: GameStatus.enum.ACTIVE,
    turnDuration: 1000,
    concedingPlayers: [],
    activePlayerId: currentPlayer.id,
    playerIds: players.map((u) => u.id),
    variant: variantConfig,
    config: {
      minPlayers: players.length,
      maxPlayers: players.length,
    },
    unlisted: false,
    autoStart: false,
  });
}

export async function initializeUsers(): Promise<UserDao[]> {
  const currentUsers = await UserDao.findAll({ limit: 6 });
  if (currentUsers.length < 6) {
    const newUsers = await fakeUsers(
      new Set(currentUsers.map((u) => u.username)),
    );
    return currentUsers.concat(newUsers);
  }
  return currentUsers;
}

export function fakeUsers(existingUsers: Set<string>): Promise<UserDao[]> {
  return UserDao.bulkCreate(
    ["bob", "jenny", "hurley", "nathan", "gustav", "penelope"]
      .filter((username) => !existingUsers.has(username))
      .map((username) => ({
        username,
        email: `${username}@gmail.com`,
        role: UserRole.enum.USER,
        notificationPreferences: { turnNotifications: [], marketing: false },
        password: "",
        preferredColors: [],
        abandons: 0,
      })),
  );
}

export async function parseGameData(
  gameDataFile: string,
): Promise<SerializedGameData> {
  return SerializedGameData.parse(await parseFile(gameDataFile));
}

export async function parseFile(gameDataFile: string): Promise<object> {
  const contents = await readFile(
    resolve(__dirname, `../goldens/${gameDataFile}.json`),
    "utf-8",
  );
  return JSON.parse(contents);
}
