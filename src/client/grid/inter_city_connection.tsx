import { ReactNode, useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import {
  InterCityConnection,
  OwnedInterCityConnection,
} from "../../engine/state/inter_city_connection";
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
  getPosition?(
    connection: InterCityConnection,
    size: number,
    connections?: InterCityConnection[],
  ): Point | undefined;
  markerScale?: number;
  fillOpacity?: number;
  connections: InterCityConnection[];
  size: number;
  clickTargets: Set<ClickTarget>;
  highlightedConnections?: OwnedInterCityConnection[];
  rotation?: Rotation;
  onClick?: (id: string) => void;
}

export function InterCityConnectionsRender({
  connections,
  markerScale = 1,
  fillOpacity = 1,
  getPosition,
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
      if (
        other.id !== connection.id &&
        arrayEqualsIgnoreOrder(other.connects, connection.connects)
      ) {
        colocated.push(other);
      }
    }
    for (const [index, connection] of colocated.entries()) {
      result.push(
        <InterCityConnectionRender
          key={connection.id}
          markerScale={markerScale}
          fillOpacity={fillOpacity}
          getPosition={getPosition}
          connections={connections}
          connection={connection}
          highlighted={highlightedConnections?.some(
            (c) => connection.id === c.id,
          )}
          clickTargets={clickTargets}
          onClick={onClick}
          size={size}
          rotation={rotation}
          stackPosition={index}
          stackSize={colocated.length}
        />,
      );
      processed.add(connection.id);
    }
  }
  return result;
}

interface InterCityConnectionRenderProps {
  getPosition?(
    connection: InterCityConnection,
    size: number,
    connections?: InterCityConnection[],
  ): Point | undefined;
  connections: InterCityConnection[];
  markerScale: number;
  fillOpacity: number;
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
  connections,
  connection,
  markerScale,
  fillOpacity,
  getPosition,
  size,
  rotation,
  clickTargets,
  highlighted,
  onClick,
  stackPosition,
  stackSize,
}: InterCityConnectionRenderProps) {
  // For now, assume that the connection can only be rendered if it is between two cities.
  if (connection.connects.length !== 2) {
    return <></>;
  }

  const [first, second] = connection.connects;
  const connectionCenter: Point = useMemo(() => {
    const position = getPosition?.(connection, size, connections);
    if (position) {
      return position;
    }
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
      const centerOnEdge = movePointInDirection(
        center,
        size,
        first.getDirection(second),
      );
      const spacing = markerScale === 1 ? size / 6 : size * markerScale * 0.75;
      const stackLength = (stackSize - 1) * spacing;
      const positionOnEdge = stackPosition * spacing - stackLength / 2;
      return movePointInRadDirection(
        centerOnEdge,
        positionOnEdge,
        directionToRad(first.getDirection(second)) + Math.PI / 2,
      );
    }
  }, [
    first,
    second,
    size,
    connection.center,
    stackPosition,
    stackSize,
    markerScale,
    getPosition,
    connection,
    connections,
  ]);

  // Owned markers must remain recognizable over any City color. Keep only
  // unclaimed slots translucent, and let delivery clicks reach the City below.
  const markerOpacity = connection.owner == null ? fillOpacity : 1;
  const clickable =
    connection.owner == null &&
    clickTargets.has(ClickTarget.INTER_CITY_CONNECTION);

  return (
    <>
      {fillOpacity === 1 && (
        <circle
          cx={connectionCenter.x}
          cy={connectionCenter.y}
          r={(size / 3) * markerScale}
          fill="black"
        />
      )}
      {/* The data attributes are for the map specs: several maps build their own
          rules on these connections, and the circle is otherwise an SVG shape
          with a hashed class and nothing stable to select. */}
      <circle
        onClick={
          clickable && onClick ? () => onClick(connection.id) : undefined
        }
        data-inter-city-connection={connection.id}
        data-connection-owned={connection.owner != null ? "" : undefined}
        cx={connectionCenter.x}
        cy={connectionCenter.y}
        r={(size / 3) * markerScale}
        fillOpacity={markerOpacity}
        strokeOpacity={markerOpacity === 1 || highlighted ? 1 : 0.65}
        stroke={highlighted ? "yellow" : "black"}
        className={`${styles.interCityConnection} ${clickable ? gridStyles.clickable : ""} ${connection.owner ? getPlayerColorCss(connection.owner.color) : ""}`}
      />
      {connection.owner == null && (
        <Rotate rotation={rotation} reverse={true} center={connectionCenter}>
          <text
            fill="black"
            fontSize={markerScale === 1 ? undefined : size * 0.25 * markerScale}
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
