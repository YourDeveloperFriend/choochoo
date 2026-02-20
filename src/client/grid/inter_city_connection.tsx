import { ReactNode, useCallback, useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { InterCityConnection, OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import {
  coordinatesToCenter,
  directionToRad,
  movePointInDirection,
  movePointInRadDirection,
  Point,
} from "../../utils/point";
import { getPlayerColorCss } from "../components/player_color";
import { Rotate } from "../components/rotation";
import { ClickTarget } from "./click_target";
import * as gridStyles from "./hex_grid.module.css";
import * as styles from "./inter_city_connection.module.css";
import { arrayEqualsIgnoreOrder } from "../../utils/functions";

interface InterCityConnectionsRenderProps {
  connections: InterCityConnection[];
  size: number;
  clickTargets: Set<ClickTarget>;
  highlightedConnections?: OwnedInterCityConnection[];
  rotation?: Rotation;
  onClick?: (id: string) => void;
}

export function InterCityConnectionsRender({
  connections,
  size,
  rotation,
  clickTargets,
  highlightedConnections,
  onClick,
}: InterCityConnectionsRenderProps) {

  // Group connections by common location
  const processed = new Set<string>();
  const result: ReactNode[] = [];
  for (const connection of connections) {
    if (processed.has(connection.id)) {
      continue;
    }

    const colocated = [connection];
    for (const other of connections) {
      if (other.id !== connection.id && arrayEqualsIgnoreOrder(other.connects, connection.connects)) {
        colocated.push(other);
      }
    }
    for (const [index, connection] of colocated.entries()) {
      result.push(<InterCityConnectionRender
          key={connection.id}
          connection={connection}
          highlighted={highlightedConnections?.some(c => connection.id === c.id)}
          clickTargets={clickTargets}
          onClick={onClick}
          size={size}
          rotation={rotation}
          stackPosition={index}
          stackSize={colocated.length}
        />);
      processed.add(connection.id);
    }
  }
  return result;
}

interface InterCityConnectionRenderProps {
  connection: InterCityConnection;
  size: number;
  clickTargets: Set<ClickTarget>;
  highlighted?: boolean;
  rotation?: Rotation;
  onClick?: (id: string) => void;
  stackPosition: number;
  stackSize: number;
}

function InterCityConnectionRender({
  connection,
  size,
  rotation,
  clickTargets,
  highlighted,
  onClick,
  stackPosition,
  stackSize,
}: InterCityConnectionRenderProps) {
  // For now, assume that the connection can only be rendered if it is between two cities.
  if (connection.connects.length !== 2) return <></>;

  const [first, second] = connection.connects;
  const connectionCenter: Point = useMemo(() => {
    if (connection.center !== undefined) {
      if (connection.offset !== undefined) {
        const offsetDistance = (connection.offset.distance ?? 1) * size;
        return movePointInDirection(
          coordinatesToCenter(connection.center, size),
          offsetDistance,
          connection.offset.direction,
        );
      }
      return coordinatesToCenter(connection.center, size);
    } else {
      const center = coordinatesToCenter(first, size);
      const centerOnEdge = movePointInDirection(center, size, first.getDirection(second));
      const stackLength = (stackSize-1) * size / 6;
      const positionOnEdge = stackPosition * size/6 - stackLength/2;
      return movePointInRadDirection(centerOnEdge, positionOnEdge, directionToRad(first.getDirection(second)) + Math.PI / 2)
    }
  }, [first, second, size, connection.center, stackPosition, stackSize]);

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
