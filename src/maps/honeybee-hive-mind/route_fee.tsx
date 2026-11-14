import { DOMINANT_WORKER_BEE } from "./actions";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { Rotate } from "../../client/components/rotation";
import { City } from "../../engine/map/city";
import { coordinatesToCenter } from "../../utils/point";
import { MoveRouteOverlayProps } from "../view_settings";
import { cityCenter, uprightPoint } from "./city_geometry";
import { boardCoordinates as c } from "./grid";
import { beeFee } from "./move";
import { HONEYBEE_GOOD_IMAGE } from "./identity";

/** Live route annotation only; it never handles clicks or changes game state. */
export function HoneybeeRouteFee({
  grid,
  size,
  rotation,
  move,
  player,
  incomeGain,
}: MoveRouteOverlayProps) {
  if (!move.path.length || player.selectedAction === DOMINANT_WORKER_BEE) {
    return null;
  }
  const fee = beeFee(grid, player, move);
  if (fee < 1) {
    return null;
  }
  const endpoint = grid.get(move.path[move.path.length - 1].endingStop);
  if (!endpoint) {
    return null;
  }
  const members = endpoint instanceof City ? grid.getSameCities(endpoint) : [];
  const world = members.length
    ? cityCenter(members, size)
    : coordinatesToCenter(endpoint.coordinates, size);
  const origin = uprightPoint(world, rotation);
  const hub = uprightPoint(coordinatesToCenter(c(6, 6), size), rotation);
  let dx = origin.x - hub.x,
    dy = origin.y - hub.y;
  let length = Math.hypot(dx, dy);
  if (length < size * 0.1) {
    dx = 1;
    dy = -0.6;
    length = Math.hypot(dx, dy);
  }
  const expenses =
    new ProfitHelper().getExpenses(player) - player.income - incomeGain;
  const cashText = `Payment/New Expenses: $${player.money} - $${fee} `;
  const expenseText =
    expenses > 0
      ? `(-$${expenses})`
      : expenses < 0
        ? `(+$${-expenses})`
        : "($0)";
  const width =
      size * Math.max(3.8, (cashText.length + expenseText.length) * 0.11 + 0.3),
    height = size * 0.95;
  const desired = {
    x: origin.x + (dx / length) * size * 2.9,
    y: origin.y + (dy / length) * size * 2.9,
  };
  const centers = [...grid.values()].map((space) =>
    uprightPoint(coordinatesToCenter(space.coordinates, size), rotation),
  );
  // Stay within existing board bounds so the annotation cannot change zoom/layout.
  const x = Math.max(
    Math.min(...centers.map((p) => p.x)) - size * 0.6 + width / 2,
    Math.min(
      desired.x,
      Math.max(...centers.map((p) => p.x)) + size * 0.6 - width / 2,
    ),
  );
  const y = Math.max(
    Math.min(...centers.map((p) => p.y)) - size * 0.6 + height / 2,
    Math.min(
      desired.y,
      Math.max(...centers.map((p) => p.y)) + size * 0.6 - height / 2,
    ),
  );
  const distance = Math.hypot(x - origin.x, y - origin.y) || 1;
  const startDistance = Math.min(
    distance,
    size * (members.length > 1 ? 1.2 : 0.9),
  );
  const start = {
    x: origin.x + ((x - origin.x) / distance) * startDistance,
    y: origin.y + ((y - origin.y) / distance) * startDistance,
  };
  return (
    <Rotate rotation={rotation} reverse>
      <g
        pointerEvents="none"
        role="img"
        aria-label={`Running swarm fee: $${fee}. ${cashText}${expenseText}`}
        data-honeybee-route-fee={fee}
      >
        <title>{`Swarm fee so far: $${fee}. Origin swarms are excluded.`}</title>
        <line
          x1={start.x}
          y1={start.y}
          x2={x}
          y2={y}
          stroke="#8a6228"
          strokeWidth={size * 0.025}
          strokeDasharray={`${size * 0.06} ${size * 0.04}`}
        />
        <rect
          x={x - width / 2}
          y={y - height / 2}
          width={width}
          height={height}
          rx={size * 0.12}
          fill="#fff1b8"
          stroke="#735020"
          strokeWidth={size * 0.025}
        />
        <image
          href={HONEYBEE_GOOD_IMAGE}
          x={x - size * 1.02}
          y={y - size * 0.42}
          width={size * 0.44}
          height={size * 0.44}
        />
        <text
          x={x + size * 0.17}
          y={y - size * 0.19}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Arial, sans-serif"
          fontSize={size * 0.23}
          fontWeight="bold"
          fill="#3c2910"
        >
          Swarm fee: ${fee}
        </text>
        <text
          x={x}
          y={y + size * 0.23}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Arial, sans-serif"
          fontSize={size * 0.19}
          fill="#3c2910"
        >
          {cashText}
          <tspan
            fill={
              expenses > 0 ? "#b42318" : expenses < 0 ? "#187238" : "#3c2910"
            }
            fontWeight="bold"
          >
            {expenseText}
          </tspan>
        </text>
      </g>
    </Rotate>
  );
}
