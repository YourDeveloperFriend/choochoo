import { GameApi, GameLiteApi } from "./game";
import { MessageApi } from "./message";

export const HOME_ROOM = 'homeroom';

export interface ServerToClientEvents {
  // The game room
  gameUpdate(game: GameApi): void;
  gameDestroy(gameId: number): void;
  newLog(log: MessageApi): void;
  destroyLog(logId: number): void;

  // The home room
  newGame(game: GameLiteApi): void;
  gameUpdateLite(game: GameLiteApi): void;
}

export interface ClientToServerEvents {
  joinHomeRoom(): void;
  leaveHomeRoom(): void;
  joinGameRoom(gameId: number): void;
  leaveGameRoom(gameId: number): void;
  emitAction(actionName: string, actionData: {}): void;
  submitMessage(message: string): void;
}

