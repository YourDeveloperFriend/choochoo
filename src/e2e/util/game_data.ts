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

interface CoordinatesData {
  q: number;
  r: number;
}

function serialize({ q, r }: CoordinatesData): string {
  return `${q}|${r}`;
}

/**
 * Normalizes player IDs in game data to canonical values (1, 2, 3, etc.)
 * to make snapshots portable across different database states.
 * Maps actual IDs to their ordinal position in the playerIds array.
 */
function normalizePlayerIds(gameData: any): void {
  const actualPlayerIds = gameData.playerIds || [];

  // Build mapping from actual IDs to canonical IDs (1, 2, 3, ...)
  const idMap = new Map<number, number>();
  actualPlayerIds.forEach((id: number, index: number) => {
    idMap.set(id, index + 1);
  });

  // Normalize the playerIds array itself
  gameData.playerIds = Array.from(
    { length: actualPlayerIds.length },
    (_, i) => i + 1,
  );

  // Normalize activePlayerId
  if (
    gameData.activePlayerId !== undefined &&
    idMap.has(gameData.activePlayerId)
  ) {
    gameData.activePlayerId = idMap.get(gameData.activePlayerId);
  }

  // Normalize game data internal references
  const gd = gameData.gameData?.gameData;
  if (gd) {
    // Normalize players array - map each player's playerId and all references to player metadata
    if (gd.players && Array.isArray(gd.players)) {
      gd.players.forEach((player: any) => {
        if (player.playerId !== undefined && idMap.has(player.playerId)) {
          player.playerId = idMap.get(player.playerId);
        }
      });
    }

    // Normalize turn order - color references stay the same, but ensure consistency
    // (turn order uses colors, not IDs, so no direct normalization needed)

    // Normalize any other ID references that might exist in the game state
    // (This is recursive to handle nested structures)
    const normalizeNestedIds = (obj: any): void => {
      if (obj === null || typeof obj !== "object") return;

      for (const key in obj) {
        if (
          key === "playerId" &&
          typeof obj[key] === "number" &&
          idMap.has(obj[key])
        ) {
          obj[key] = idMap.get(obj[key]);
        } else if (typeof obj[key] === "object") {
          normalizeNestedIds(obj[key]);
        }
      }
    };
    normalizeNestedIds(gd);
  }
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

  actualGameDataValue.gameData?.["gameData"].grid.sort(
    (a: CoordinatesData[], b: CoordinatesData[]) =>
      serialize(a[0]) < serialize(b[0]) ? -1 : 1,
  );

  // Remove undefined values
  const actualGameData = JSON.parse(JSON.stringify(actualGameDataValue));

  // Normalize player IDs to canonical values for portable comparison
  normalizePlayerIds(actualGameData);

  if (process.env.WRITE === "true") {
    await writeFile(
      resolve(__dirname, `../goldens/${gameDataFile}.json`),
      JSON.stringify(actualGameData, null, 2),
      "utf-8",
    );
  } else {
    const expectedGameData = await parseFile(gameDataFile);
    // Also normalize expected data to handle any legacy golden files
    normalizePlayerIds(expectedGameData);
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
  const currentUsers = await UserDao.findAll({
    limit: 6,
    order: [["id", "ASC"]],
  });
  if (currentUsers.length < 6) {
    const newUsers = await fakeUsers(
      new Set(currentUsers.map((u) => u.username)),
    );
    return currentUsers.concat(newUsers);
  }
  return currentUsers;
}

function fakeUsers(existingUsers: Set<string>): Promise<UserDao[]> {
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

async function parseGameData(
  gameDataFile: string,
): Promise<SerializedGameData> {
  return SerializedGameData.parse(await parseFile(gameDataFile));
}

async function parseFile(gameDataFile: string): Promise<object> {
  const contents = await readFile(
    resolve(__dirname, `../goldens/${gameDataFile}.json`),
    "utf-8",
  );
  return JSON.parse(contents);
}
