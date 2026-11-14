import { CityGoodsProps } from "../view_settings";
import * as gridStyles from "../../client/grid/hex_grid.module.css";
import { WagglePreviewContext, waggleBeeCount } from "./waggle_preview";
import { honeybeeInterurbanCircles } from "./interurban_layout";
import { boardCoordinates as c } from "./grid";
import { useContext, useId, useMemo } from "react";
import { BeeCube } from "./bee_cube";
import { FloatingGoodBlock } from "../../client/grid/good_block";
import { Rotate } from "../../client/components/rotation";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import {
  cityCenter,
  cityMembers,
  cityOutline,
  uprightPoint,
} from "./city_geometry";
import { coordinatesToCenter, polygon } from "../../utils/point";
import { honeybeeCityGoodsLayout } from "./city_goods_layout";

type Props = CityGoodsProps;

export function HoneybeeCityGoods(props: Props) {
  const members = useMemo(
    () => cityMembers(props.city, props.grid),
    [props.city, props.grid],
  );
  if (!props.city.coordinates.equals(members[0].coordinates)) {
    return null;
  }
  return <PrimaryCityGoods {...props} members={members} />;
}

function PrimaryCityGoods({
  grid,
  city,
  size,
  rotation,
  selectedGood,
  clickable,
  members,
}: Props & { members: City[] }) {
  const clipId = `bee-city-${useId().replace(/:/g, "")}`;
  const center = cityCenter(members, size);
  const goods = members.flatMap((half) =>
    half
      .getGoods()
      .filter((good) => good !== Good.YELLOW)
      .map((good) => ({ good, coordinates: half.coordinates })),
  );
  const preview = useContext(WagglePreviewContext);
  const originalBeeCount = members.reduce(
    (sum, half) =>
      sum + half.getGoods().filter((good) => good === Good.YELLOW).length,
    0,
  );
  const beeCount = waggleBeeCount(members, originalBeeCount, preview);
  const movableCount =
    originalBeeCount -
    preview.moves.filter((move) =>
      members.some((half) => half.coordinates.equals(move.from)),
    ).length;
  const layout = useMemo(() => {
    const centers = members.map((half) => {
      const point = coordinatesToCenter(half.coordinates, size);
      return uprightPoint(
        { x: point.x - center.x, y: point.y - center.y },
        rotation,
      );
    });
    return honeybeeCityGoodsLayout(
      size,
      goods.length,
      beeCount,
      centers,
      members[0].goodColors()[0],
      honeybeeInterurbanCircles(grid.connections, size).map((circle) => ({
        ...uprightPoint(
          { x: circle.x - center.x, y: circle.y - center.y },
          rotation,
        ),
        radius: circle.radius,
      })),
      city.coordinates.equals(c(6, 6)),
    );
  }, [
    members,
    size,
    rotation,
    goods.length,
    beeCount,
    grid.connections,
    city.coordinates,
  ]);
  const selectedIndex = goods.findIndex(
    (entry) =>
      selectedGood?.coordinates.equals(entry.coordinates) &&
      selectedGood.good === entry.good,
  );
  const corners = cityOutline(members, size).map((point) =>
    uprightPoint({ x: point.x - center.x, y: point.y - center.y }, rotation),
  );
  return (
    <Rotate rotation={rotation} center={center} reverse>
      {goods.map((entry, index) => (
        <FloatingGoodBlock
          key={index}
          good={entry.good}
          size={layout.goodsSize}
          center={{
            x: center.x + layout.goods[index].x,
            y: center.y + layout.goods[index].y,
          }}
          coordinates={entry.coordinates}
          clickable={clickable}
          highlighted={selectedIndex === index}
        />
      ))}
      <g transform={`translate(${center.x} ${center.y})`} pointerEvents="none">
        <defs>
          <clipPath id={clipId}>
            <polygon points={polygon(corners)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {layout.bees.map((bee, index) => {
            const firstSwarm = layout.bees
              .slice(0, index)
              .reduce((n, group) => n + group.count, 0);
            const selectable = !!preview.selectBee && firstSwarm < movableCount;
            const selected =
              preview.source?.equals(members[0].coordinates) &&
              preview.selectedBee === index;
            return (
              <g
                key={index}
                aria-label={`${bee.count} bee swarm${bee.count === 1 ? "" : "s"}`}
              >
                <BeeCube
                  x={bee.x}
                  y={bee.y}
                  size={layout.beeSize}
                  stroke={selected ? "#ffeb3b" : "black"}
                  strokeWidth={selected ? size * 0.045 : 1}
                />
                {bee.count > 1 && (
                  <g
                    transform={`translate(${bee.x + layout.beeExtent - size * 0.14} ${bee.y + layout.beeExtent - size * 0.12})`}
                  >
                    <rect
                      x={-size * 0.14}
                      y={-size * 0.12}
                      width={size * 0.28}
                      height={size * 0.24}
                      rx={size * 0.04}
                      fill="#fff5cf"
                      stroke="#49331a"
                      strokeWidth={0.8}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={size * 0.2}
                      fontWeight="bold"
                      fill="#49331a"
                    >
                      {bee.count}
                    </text>
                  </g>
                )}
                {selectable && (
                  <rect
                    x={bee.x}
                    y={bee.y}
                    width={layout.beeExtent}
                    height={layout.beeExtent}
                    fill="transparent"
                    style={{ pointerEvents: "all" }}
                    className={gridStyles.clickable}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select a movable bee swarm${bee.count > 1 ? " from this group" : ""}`}
                    aria-pressed={selected}
                    onClick={(event) => {
                      event.stopPropagation();
                      preview.selectBee!(members[0], index);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        preview.selectBee!(members[0], index);
                      }
                    }}
                  />
                )}
              </g>
            );
          })}
        </g>
      </g>
    </Rotate>
  );
}
