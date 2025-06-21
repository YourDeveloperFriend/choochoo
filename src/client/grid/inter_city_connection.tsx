import { useCallback, useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { InterCityConnection } from "../../engine/state/inter_city_connection";
import {
  coordinatesToCenter,
  movePointInDirection,
  Point,
} from "../../utils/point";
import { getPlayerColorCss } from "../components/player_color";
import { Rotate } from "../components/rotation";
import { ClickTarget } from "./click_target";
import * as gridStyles from "./hex_grid.module.css";
import * as styles from "./inter_city_connection.module.css";

interface InterCityConnectionRenderProps {
  connection: InterCityConnection;
  size: number;
  clickTargets: Set<ClickTarget>;
  highlighted?: boolean;
  rotation?: Rotation;
  onClick?: (id: string) => void;
}

export function InterCityConnectionRender({
  connection,
  size,
  rotation,
  clickTargets,
  highlighted,
  onClick,
}: InterCityConnectionRenderProps) {
  // For now, assume that the connection can only be rendered if it is between two cities.
  if (connection.connects.length !== 2) return <></>;

  const [first, second] = connection.connects;
  let connectionCenter: Point;
  if (connection.center !== undefined) {
    connectionCenter = coordinatesToCenter(connection.center, size);
  } else {
    connectionCenter = useMemo(() => {
      const center = coordinatesToCenter(first, size);
      return movePointInDirection(center, size, first.getDirection(second));
    }, [first, second, size]);
  }

  const clickable = clickTargets.has(ClickTarget.INTER_CITY_CONNECTION)
    ? gridStyles.clickable
    : "";

  const internalOnClick = useCallback(
    () => onClick && onClick(connection.id!),
    [...connection.connects],
  );

  return (
    <>
      <circle
        cx={connectionCenter.x}
        cy={connectionCenter.y}
        r={size / 3}
        fill="black"
      />
      <circle
        onClick={internalOnClick}
        cx={connectionCenter.x}
        cy={connectionCenter.y}
        r={size / 3}
        stroke={highlighted ? "yellow" : "black"}
        className={`${styles.interCityConnection} ${clickable} ${connection.owner ? getPlayerColorCss(connection.owner.color) : ""}`}
      />
      {connection.owner == null && (
        <Rotate rotation={rotation} reverse={true} center={connectionCenter}>
          <text
            fill="black"
            x={connectionCenter.x}
            y={connectionCenter.y}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            ${connection.cost}
          </text>
          ;
        </Rotate>
      )}
    </>
  );
}
