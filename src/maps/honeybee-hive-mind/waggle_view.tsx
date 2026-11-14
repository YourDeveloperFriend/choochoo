import { Button } from "semantic-ui-react";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { Rotate } from "../../client/components/rotation";
import { useGrid } from "../../client/utils/injection_context";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Coordinates } from "../../utils/coordinates";
import { polygon, Point } from "../../utils/point";
import { TexturesProps } from "../view_settings";
import {
  cityCenter,
  cityMembers,
  cityOutline,
  uprightPoint,
} from "./city_geometry";
import { HONEYBEE_GOOD_IMAGE } from "./identity";
import { canonicalCity, WaggleData } from "./waggle";
import { useWaggleDraft, waggleSourcesRemaining } from "./waggle_preview";
import * as styles from "./waggle.module.css";

export function waggleDestinations(
  grid: Grid,
  source: City,
  moves: WaggleData["moves"],
): City[] {
  if (moves.length >= 3 || waggleSourcesRemaining(grid, source, moves) <= 0) {
    return [];
  }
  return grid
    .cities()
    .filter(
      (city) =>
        canonicalCity(grid, city).coordinates.equals(city.coordinates) &&
        !city.isSameCity(source) &&
        !moves.some((move) => (grid.get(move.to) as City).isSameCity(city)),
    );
}

export function useWaggleMapClick(on: OnClickRegister): boolean {
  const grid = useGrid();
  const { canEmit, isPending, draft, moves, setDraft } = useWaggleDraft();
  if (canEmit && !isPending && draft.source) {
    on(ClickTarget.CITY, (city) => {
      const clicked = canonicalCity(grid, city);
      const source = grid.get(draft.source!);
      if (
        source instanceof City &&
        waggleDestinations(grid, source, moves).some((dest) =>
          dest.isSameCity(clicked),
        )
      ) {
        setDraft({
          moves: [
            ...moves,
            { from: source.coordinates, to: clicked.coordinates },
          ],
        });
      }
    });
  }
  return isPending;
}

export function WaggleControls() {
  const { canEmit, isPending, draft, moves, setDraft, emit, getErrorMessage } =
    useWaggleDraft();
  if (!canEmit) {
    return null;
  }
  const error = getErrorMessage({ moves });
  return (
    <div className={styles.controls} aria-label="Waggle Dance map controls">
      <p role="status">
        {draft.source
          ? "Choose a highlighted destination City, or click the selected bee to cancel."
          : moves.length === 3
            ? "Three swarms selected. Confirm to finish."
            : "Click a bee on the map, then its destination City."}{" "}
        {moves.length}/3 selected.
      </p>
      <Button
        disabled={isPending || (!moves.length && !draft.source)}
        onClick={() =>
          setDraft({ moves: draft.source ? moves : moves.slice(0, -1) })
        }
      >
        Undo
      </Button>
      <Button
        positive
        loading={isPending}
        disabled={isPending || !moves.length || !!draft.source || !!error}
        onClick={() => emit({ moves })}
      >
        Confirm Waggle Dance
      </Button>
      <Button disabled={isPending} onClick={() => emit({ moves: [] })}>
        Decline Waggle Dance
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

/** A short lateral waggle along the flight, without rotating the bee artwork. */
function waggleFlightPath(from: Point, to: Point, size: number): string {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const waggle =
      Math.sin(t * Math.PI * 12) * Math.sin(t * Math.PI) * size * 0.3;
    return `${i ? "L" : "M"}${from.x + dx * t - (dy / length) * waggle},${from.y + dy * t + (dx / length) * waggle}`;
  }).join(" ");
}

export function WaggleOverlay({ grid, size, rotation }: TexturesProps) {
  const { canEmit, draft, moves } = useWaggleDraft();
  if (!canEmit) {
    return null;
  }
  const source = draft.source && grid.get(draft.source);
  const beeExtent = (size / 3) * 1.25 * 1.3;
  const destinations =
    source instanceof City ? waggleDestinations(grid, source, moves) : [];
  const marked = destinations;
  const center = (coordinates: Coordinates) =>
    uprightPoint(
      cityCenter(cityMembers(grid.get(coordinates) as City, grid), size),
      rotation,
    );
  return (
    <g
      pointerEvents="none"
      aria-label="Waggle Dance destinations and planned moves"
    >
      {marked.map((city) => (
        <polygon
          key={city.coordinates.serialize()}
          points={polygon(cityOutline(cityMembers(city, grid), size))}
          fill="#fff17630"
          stroke="#ffeb3b"
          strokeWidth={size * 0.055}
        />
      ))}
      <Rotate rotation={rotation} reverse>
        {moves.map((move, index) => {
          const from = center(move.from),
            to = center(move.to);
          return (
            <g key={`${index}-${move.from.serialize()}-${move.to.serialize()}`}>
              <path
                d={`M${from.x},${from.y} L${to.x},${to.y}`}
                fill="none"
                stroke="#ffda45"
                strokeWidth={size * 0.025}
                strokeDasharray={`${size * 0.06} ${size * 0.05}`}
                opacity={0.7}
              />
              <image
                href={HONEYBEE_GOOD_IMAGE}
                x={-beeExtent / 2}
                y={-beeExtent / 2}
                width={beeExtent}
                height={beeExtent}
                className={styles.flight}
                style={{
                  offsetPath: `path("${waggleFlightPath(from, to, size)}")`,
                }}
              />
              <circle
                cx={to.x + size * 0.24}
                cy={to.y - size * 0.24}
                r={size * 0.13}
                fill="#fff5cf"
                stroke="#49331a"
              />
              <text
                x={to.x + size * 0.24}
                y={to.y - size * 0.24}
                fontSize={size * 0.2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#49331a"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </Rotate>
    </g>
  );
}

export function WaggleSummary() {
  return <p>Relocate up to three bee swarms using the map below.</p>;
}
