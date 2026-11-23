import { ReactNode } from "react";
import { HexName } from "../../client/grid/hex_name";
import { goodStyle } from "../../client/grid/good";
import {
  useHasInjectionContext,
  useInject,
} from "../../client/utils/injection_context";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { Land } from "../../engine/map/location";
import { TexturesProps } from "../view_settings";
import { coordinatesToCenter, getCorners, polygon } from "../../utils/point";
import * as styles from "./textures.module.css";
import { PittsburghMetroMapData } from "./grid";
import { MUNICIPAL_DEVELOPMENTS } from "./municipal_development";

function PendingDevelopments(props: TexturesProps) {
  const { pending, currentRound } = useInject(() => {
    const developments = injectState(MUNICIPAL_DEVELOPMENTS);
    const round = injectState(ROUND);
    return {
      pending: developments.isInitialized() ? developments() : [],
      // Not initialized once the game is over.
      currentRound: round.isInitialized() ? round() : undefined,
    };
  }, []);
  if (currentRound == null) {
    return <></>;
  }
  const result: ReactNode[] = [];
  for (const [index, { coordinates, city }] of pending.entries()) {
    const round = currentRound + index + 1;
    // The available-city previews share this layer but don't contain the town.
    const space = props.grid.get(coordinates);
    if (!(space instanceof Land) || !space.hasTown()) {
      continue;
    }
    const center = coordinatesToCenter(coordinates, props.size);
    const color = Array.isArray(city.color) ? city.color[0] : city.color;
    result.push(
      <g key={coordinates.serialize()} className={goodStyle(color)}>
        <polygon
          className={styles.pendingHex}
          points={polygon(getCorners(center, props.size * 0.3))}
        />
        <text
          className={styles.pendingText}
          x={center.x}
          y={center.y}
          fontSize={props.size * 0.3}
        >
          {round}
        </text>
      </g>,
    );
  }
  return <>{result}</>;
}

function ParkNames({ grid, size, rotation }: TexturesProps) {
  const result: ReactNode[] = [];
  for (const [coordinates, space] of grid.entries()) {
    const parkName = space.getMapSpecific(
      PittsburghMetroMapData.parse,
    )?.parkName;
    if (parkName != null) {
      result.push(
        <HexName
          key={coordinates.serialize()}
          name={parkName}
          center={coordinatesToCenter(coordinates, size)}
          size={size}
          rotation={rotation}
        />,
      );
    }
  }
  return <>{result}</>;
}

function Streets() {
  return (
    <>
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M -52.500002,1182 -3.9333334e-6,1212.5 v 121 L 314.99998,1151.5 l 420,243 105,-61 210.41892,121.85"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="m 314.99998,970 v 788"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M -52.500002,1849 314.99998,1636.5"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M 314.99998,1515.5 1260.4248,2061.35 1522.5,1909.5"
      />
      <path
        stroke="grey"
        strokeWidth={24}
        fill="none"
        d="M 944.99997,1879.5 V 2182"
      />
    </>
  );
}

export function PittsburghMetroTextures(props: TexturesProps) {
  return (
    <>
      <Streets />
      <ParkNames {...props} />
    </>
  );
}

export function PittsburghMetroOverlayLayer(props: TexturesProps) {
  // In a preview (e.g. while creating a game) there is no game to read from.
  const hasGame = useHasInjectionContext();
  return hasGame ? <PendingDevelopments {...props} /> : <></>;
}
