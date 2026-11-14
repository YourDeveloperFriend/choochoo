import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useRef,
} from "react";
import { City } from "../../engine/map/city";
import { canonicalCity, WaggleAction, WaggleData } from "./waggle";
import { useAction } from "../../client/services/action";
import { useGame } from "../../client/services/game";
import { useGrid } from "../../client/utils/injection_context";
import { Grid } from "../../engine/map/grid";
import { Good } from "../../engine/state/good";
import { Coordinates } from "../../utils/coordinates";

const WAGGLE_FLIGHT_MS = 2400;
export const waggleMoveKey = (move: WaggleData["moves"][number]) =>
  `${move.from.serialize()}>${move.to.serialize()}`;
interface WagglePreview {
  moves: WaggleData["moves"];
  landed: string[];
  source?: City["coordinates"];
  selectedBee?: number;
  selectBee?: (city: City, index: number) => void;
}
export const WagglePreviewContext = createContext<WagglePreview>({
  moves: [],
  landed: [],
});

/** Never mutate the original board or treat staged arrivals as eligible sources. */
export function waggleBeeCount(
  members: City[],
  original: number,
  preview: WagglePreview,
): number {
  const contains = (coordinates: City["coordinates"]) =>
    members.some((city) => city.coordinates.equals(coordinates));
  return (
    original -
    preview.moves.filter((move) => contains(move.from)).length +
    preview.moves.filter(
      (move) =>
        contains(move.to) && preview.landed.includes(waggleMoveKey(move)),
    ).length
  );
}

type Draft = Partial<WaggleData> & {
  source?: Coordinates;
  selectedBee?: number;
  gameId?: number;
  version?: number;
};

/** Count original swarms only: staged arrivals are never eligible sources. */
export function waggleSourcesRemaining(
  grid: Grid,
  city: City,
  moves: WaggleData["moves"],
): number {
  return (
    grid
      .getSameCities(city)
      .reduce(
        (n, half) =>
          n + half.getGoods().filter((g) => g === Good.YELLOW).length,
        0,
      ) -
    moves.filter((move) => (grid.get(move.from) as City).isSameCity(city))
      .length
  );
}

function useWaggleState() {
  const action = useAction(WaggleAction);
  const game = useGame();
  const saved = action.data as Draft | undefined;
  const draft = scopedWaggleDraft(saved, game.id, game.version);
  const moves = draft.moves ?? [];
  const setDraft = (next: Draft) => {
    if (!action.canEmit || action.isPending) {
      return;
    }
    action.setData({
      ...next,
      gameId: game.id,
      version: game.version,
    } as Draft);
  };
  return { ...action, draft, moves, setDraft };
}

/** Keep drafts from another table or an older server state out of this preview. */
export function scopedWaggleDraft(
  saved: Draft | undefined,
  gameId: number,
  version: number,
): Draft {
  return saved?.gameId === gameId && saved.version === version ? saved : {};
}

const WaggleActionContext = createContext<
  ReturnType<typeof useWaggleState> | undefined
>(undefined);

/** All map controls read the same mutation's pending state. */
export function useWaggleDraft() {
  const state = useContext(WaggleActionContext);
  if (!state) {
    throw new Error("Waggle controls require WagglePreviewProvider");
  }
  return state;
}

export function WagglePreviewProvider({ children }: { children: ReactNode }) {
  const game = useGame();
  return <WagglePreviewSession key={game.id}>{children}</WagglePreviewSession>;
}

/** Preview departures immediately and arrivals once their individual flights land. */
function WagglePreviewSession({ children }: { children: ReactNode }) {
  const state = useWaggleState();
  const { canEmit, isPending, draft, moves, setDraft } = state;
  const grid = useGrid();
  const activeMoves = canEmit ? moves : [];
  // Coordinates themselves contain |, so preserve move keys as a JSON array.
  const signature = JSON.stringify(activeMoves.map(waggleMoveKey));
  const started = useRef(new Map<string, number>());
  const [landed, setLanded] = useState<string[]>([]);
  useEffect(() => {
    const keys: string[] = JSON.parse(signature);
    const now = Date.now();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    for (const key of started.current.keys()) {
      if (!keys.includes(key)) {
        started.current.delete(key);
      }
    }
    const timers = keys.map((key) => {
      if (!started.current.has(key)) {
        started.current.set(key, now);
      }
      const remaining = reduced
        ? 0
        : Math.max(0, WAGGLE_FLIGHT_MS - (now - started.current.get(key)!));
      return window.setTimeout(
        () =>
          setLanded((previous) =>
            previous.includes(key) ? previous : [...previous, key],
          ),
        remaining,
      );
    });
    setLanded((previous) => previous.filter((key) => keys.includes(key)));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [signature]);
  return (
    <WaggleActionContext.Provider value={state}>
      <WagglePreviewContext.Provider
        value={{
          moves: activeMoves,
          landed,
          source: draft.source,
          selectedBee: draft.selectedBee,
          selectBee:
            canEmit && !isPending && moves.length < 3
              ? (city, index) => {
                  const primary = canonicalCity(grid, city);
                  if (waggleSourcesRemaining(grid, primary, moves) <= 0) {
                    return;
                  }
                  setDraft(
                    draft.source?.equals(primary.coordinates) &&
                      draft.selectedBee === index
                      ? { moves }
                      : {
                          moves,
                          source: primary.coordinates,
                          selectedBee: index,
                        },
                  );
                }
              : undefined,
        }}
      >
        {children}
      </WagglePreviewContext.Provider>
    </WaggleActionContext.Provider>
  );
}
