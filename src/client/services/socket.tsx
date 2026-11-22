import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../../api/socket";
import { assert } from "../../utils/validate";
import { environment } from "./environment";

type ChooChooSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SocketContext = createContext<ChooChooSocket | undefined>(undefined);

class RoomManager {
  private inHomeRoom = 0;
  private readonly gameRooms = new Map<number, number>();

  constructor(private readonly socket: ChooChooSocket) {
    this.socket.on("connect", () => {
      this.syncRooms();
    });
  }

  joinHomeRoom(): () => void {
    this.inHomeRoom++;
    this.syncRooms();
    return () => {
      this.inHomeRoom--;
      this.syncRooms();
    };
  }

  joinGameRoom(gameId: number): () => void {
    let called = false;
    this.gameRooms.set(gameId, (this.gameRooms.get(gameId) ?? 0) + 1);
    this.syncRooms();
    return () => {
      assert(!called, "cannot call joinGameRoom cb multiple times");
      called = true;
      const count = this.gameRooms.get(gameId);
      assert(count != null && count > 0);
      if (count === 1) {
        this.gameRooms.delete(gameId);
      } else {
        this.gameRooms.set(gameId, count - 1);
      }
      this.syncRooms();
    };
  }

  private syncRooms(): void {
    this.socket.emit("roomSync", {
      connectToHome: this.inHomeRoom > 0,
      games: [...this.gameRooms.keys()],
    });
  }
}

const RoomManagerContext = createContext<RoomManager | undefined>(undefined);

export function useSocket() {
  return useContext(SocketContext)!;
}

export function SocketContextProvider({ children }: { children: ReactNode }) {
  const socket: ChooChooSocket = useMemo(() => io(environment.socketHost), []);
  const manager: RoomManager = useMemo(() => new RoomManager(socket), [socket]);

  return (
    <SocketContext.Provider value={socket}>
      <RoomManagerContext.Provider value={manager}>
        {children}
      </RoomManagerContext.Provider>
    </SocketContext.Provider>
  );
}

export function useJoinRoom(gameId?: number) {
  const manager = useContext(RoomManagerContext)!;
  useEffect(() => {
    if (gameId == null) {
      return manager.joinHomeRoom();
    } else {
      return manager.joinGameRoom(gameId);
    }
  }, [gameId, manager]);
}
