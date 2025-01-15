import { useCallback, useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { InterCityConnection } from "../../engine/state/inter_city_connection";
import { Coordinates } from "../../utils/coordinates";
import { getPlayerColorCss } from "../components/player_color";
import { Rotate } from "../components/rotation";
import { ClickTarget } from "./click_target";
import * as gridStyles from "./hex_grid.module.css";
import * as styles from "./inter_city_connection.module.css";
import { coordinatesToCenter, movePointInDirection } from "./point";

interface InterCityConnectionRenderProps {
  connection: InterCityConnection;
  size: number;
  clickTargets: Set<ClickTarget>;
  highlighted?: boolean;
  rotation?: Rotation;
  onClick?: (connects: Coordinates[]) => void;
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
  const connectionCenter = useMemo(() => {
    const center = coordinatesToCenter(first, size);
    return movePointInDirection(center, size, first.getDirection(second));
  }, [first, second, size]);

  const clickable = clickTargets.has(ClickTarget.INTER_CITY_CONNECTION)
    ? gridStyles.clickable
    : "";

  const internalOnClick = useCallback(
    () => onClick && onClick(connection.connects),
    [...connection.connects],
  );

  return (
    <>
      <circle
        onClick={internalOnClick}
        cx={connectionCenter.x}
        cy={connectionCenter.y}
        r={size / 3}
        stroke={highlighted ? "yellow" : "black"}
        className={`${styles.interCityConnection} ${clickable} ${connection.owner ? getPlayerColorCss(connection.owner.color) : ""}`}
      />
      {connection.cost !== 2 && (
        <Rotate rotation={rotation} reverse={true} center={connectionCenter}>
          <text
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
