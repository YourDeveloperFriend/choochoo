import { useCallback, useMemo } from "react";
import { Button, Icon } from "semantic-ui-react";
import { PHASE } from "../../engine/game/phase";
import { GameStarter } from "../../engine/game/starter";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { PassAction } from "../../engine/goods_growth/pass";
import { ProductionAction } from "../../engine/goods_growth/production";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { CityGroup } from "../../engine/state/city_group";
import { Good, goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { OnRoll } from "../../engine/state/roll";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { iterate } from "../../utils/functions";
import { ImmutableMap } from "../../utils/immutable";
import { assert } from "../../utils/validate";
import { Username } from "../components/username";
import { goodStyle } from "../grid/good";
import { readGoodColor } from "../grid/readGoodColor";
import * as hexStyles from "../grid/hex.module.css";
import { getCorners, polygon } from "../../utils/point";
import { useAction, useEmptyAction } from "../services/action";
import { useGame, useGameVersionState } from "../services/game";
import {
  useGrid,
  useInjected,
  useInjectedState,
  usePhaseState,
} from "../utils/injection_context";
import * as styles from "./goods_table.module.css";

function getMaxGoods(
  goodsMap: ImmutableMap<CityGroup, (Good | undefined | null)[][]>,
): number {
  const goodArrays: (Good | undefined | null)[][] = [
    ...goodsMap.values(),
  ].flatMap((i) => i);

  return Math.max(...goodArrays.map((goods) => goods.length));
}

export function GoodsTable() {
  const gameKey = useGame().gameKey;
  const [manuallySelectedGood, setSelectedGood] = useGameVersionState<
    Good | undefined
  >(undefined);
  const grid = useGrid();
  const phase = useInjectedState(PHASE);
  const starter = useInjected(GameStarter);
  const availableCities = useInjectedState(AVAILABLE_CITIES);
  const cities = useMemo(() => {
    const cities = grid.cities();
    const regularCities = new Map<CityGroup, (Good | undefined | null)[][]>([
      [CityGroup.WHITE, []],
      [CityGroup.BLACK, []],
    ]);
    const urbanizedCities = new Map<CityGroup, (Good | undefined | null)[][]>([
      [CityGroup.WHITE, []],
      [CityGroup.BLACK, []],
    ]);
    for (const city of cities) {
      const map = city.isUrbanized() ? urbanizedCities : regularCities;
      for (const onRoll of city.onRoll().values()) {
        map.get(onRoll.group)![onRoll.onRoll] = onRoll.goods;
      }
    }
    for (const availableCity of availableCities) {
      for (const { group, onRoll, goods } of availableCity.onRoll) {
        urbanizedCities.get(group)![onRoll] = goods;
      }
    }
    return {
      regularCities: ImmutableMap(regularCities),
      urbanizedCities: ImmutableMap(urbanizedCities),
    };
  }, [grid, availableCities]);

  const maxRegularGoods = useMemo(
    () => Math.max(3, getMaxGoods(cities.regularCities)),
    [cities],
  );
  const maxUrbanizedGoods = useMemo(
    () => Math.max(2, getMaxGoods(cities.urbanizedCities)),
    [cities],
  );

  const { emit, canEmit } = useAction(ProductionAction);
  const productionState = usePhaseState(Phase.GOODS_GROWTH, GOODS_GROWTH_STATE);

  const good = manuallySelectedGood ?? productionState?.goods[0];

  const onClick = useCallback(
    (urbanized: boolean, cityGroup: CityGroup, onRoll: OnRoll, row: number) => {
      if (!canEmit) return;
      assert(good != null);
      emit({ urbanized, onRoll, cityGroup, good, row });
    },
    [canEmit, emit, good],
  );

  const toggleSelectedGood = useCallback(() => {
    assert(productionState != null);
    assert(good != null);
    setSelectedGood(
      productionState.goods[
        (productionState.goods.indexOf(good) + 1) % productionState.goods.length
      ],
    );
  }, [good, productionState]);

  const hasUrbanizedCities =
    cities.urbanizedCities.get(CityGroup.WHITE)!.length +
      cities.urbanizedCities.get(CityGroup.BLACK)!.length >
    0;

  if (gameKey === SwedenRecyclingMapSettings.key) {
    if (phase !== Phase.MOVING) {
      // Only render the goods table during the moving phase, where it is used as
      // a display of what goods were recycled that round.
      return <></>;
    }
  } else if (!starter.isGoodsGrowthEnabled()) {
    return <></>;
  }
  // build the 12 column elements, then render them grouped (white on left, black on right)
  const columns = iterate(12, (i) => {
    const cityGroup = i < 6 ? CityGroup.WHITE : CityGroup.BLACK;
    const onRoll = OnRoll.parse((i % 6) + 1);
    const city = cities.regularCities.get(cityGroup)?.[onRoll];
    const urbanizedCity =
      cities.urbanizedCities.get(cityGroup)?.[onRoll];
    const letter = i < 2 || i >= 10 ? "" : numberToLetter(i - 2);
    // determine a primary good color for this onRoll column
    let primaryGood: Good | undefined = undefined;
    // first try to find the actual City on the map with this onRoll/group so color matches the map hex
    const mapCity = grid.cities().find((c) =>
      c.onRoll().some((r) => r.group === cityGroup && r.onRoll === onRoll),
    );
    if (mapCity != null) primaryGood = mapCity.goodColors()[0];
    // next try availableCities (new urbanized city options)
    if (primaryGood == null && Array.isArray(availableCities)) {
      const avail = (availableCities as any[]).find((a) =>
        a.onRoll.some((r: any) => r.group === cityGroup && r.onRoll === onRoll),
      );
      if (avail) {
        primaryGood = Array.isArray(avail.color) ? avail.color[0] : avail.color;
      }
    }
    // final fallback: use the goods currently in the city/urbanized city if present
    if (primaryGood == null && city != null) {
      for (const g of city) {
        if (g != null) {
          primaryGood = g as Good;
          break;
        }
      }
    }
    if (primaryGood == null && urbanizedCity != null) {
      for (const g of urbanizedCity) {
        if (g != null) {
          primaryGood = g as Good;
          break;
        }
      }
    }
    // For the letter headers (A..H) use the availableCities list order so they match the Available Cities
    const letterIndex = i - 2;
    let letterGood: Good | undefined = primaryGood;
    if (letter !== "" && Array.isArray(availableCities) && availableCities[letterIndex]) {
      const avail = (availableCities as any[])[letterIndex];
      const colorVal = avail.color;
      letterGood = Array.isArray(colorVal) ? colorVal[0] : colorVal;
    }

    return (
      <div
        className={`${styles.column} ${
          cityGroup === CityGroup.BLACK ? styles.blackColumn : ""
        } ${i === 5 ? styles.gapRight : ""}`}
        key={i}
      >
        <div className={styles.headerCell}>
          <HeaderHex onRoll={onRoll} primaryGood={primaryGood} letter={letter} />
        </div>
        {iterate(maxRegularGoods, (goodIndex) => (
          <GoodBlock
            key={goodIndex}
            good={city?.[maxRegularGoods - 1 - goodIndex] ?? undefined}
            canSelect={canEmit}
            onClick={() =>
              onClick(
                false,
                cityGroup,
                onRoll,
                maxRegularGoods - 1 - goodIndex,
              )
            }
          />
        ))}
        {hasUrbanizedCities && (
          <div className={styles.letterCell}>
            {letter === "" ? (
              <div className={`${styles.headerPlaceholder} ${styles.headerPlaceholderHidden}`} />
            ) : (
              urbanizedCity && <HeaderHex primaryGood={letterGood} letter={letter} />
            )}
          </div>
        )}
        {hasUrbanizedCities &&
          iterate(maxUrbanizedGoods, (goodIndex) => (
            <GoodBlock
              key={goodIndex}
              good={
                urbanizedCity?.[maxUrbanizedGoods - 1 - goodIndex] ??
                undefined
              }
              canSelect={canEmit}
              emptySpace={urbanizedCity == null}
              onClick={() =>
                onClick(
                  true,
                  cityGroup,
                  onRoll,
                  maxUrbanizedGoods - 1 - goodIndex,
                )
              }
            />
          ))}
      </div>
    );
  });

  return (
    <div>
      <h2>Goods Growth Table</h2>
      <PlaceGood good={good} toggleSelectedGood={toggleSelectedGood} />
      <div className={styles.goodsContainer}>
        <div className={styles.groupsGrid}>
          <section className={styles.group} aria-labelledby="goods-white">
            <h3 id="goods-white" className={styles.groupHeader}>White</h3>
            <div className={styles.leftColumns} role="list">
              {columns.slice(0, 6)}
            </div>
          </section>
          <section className={styles.group} aria-labelledby="goods-black">
            <h3 id="goods-black" className={styles.groupHeader + ' ' + styles.blackHeader}>Black</h3>
            <div className={styles.rightColumns} role="list">
              {columns.slice(6)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function HeaderHex({ onRoll, primaryGood, letter }: { onRoll?: OnRoll; primaryGood?: Good; letter?: string }) {
  // Use the goods CSS class and read the --good-color CSS variable at runtime so
  // CSS remains the single source of truth. Fall back to a neutral color if
  // DOM or the variable isn't available.
  const defaultColor = "#e69074";

  const fillColor = primaryGood != null ? readGoodColor(primaryGood) : defaultColor;
  const goodClass = primaryGood != null ? goodStyle(primaryGood) : "";

  function parseHexOrRgb(color: string): [number, number, number] {
    if (color.startsWith("#")) {
      const hex = color.substring(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    }
    if (color.startsWith("rgb")) {
      const parts = color.replace(/rgba?\(|\)/g, "").split(",").map((s) => parseInt(s.trim(), 10));
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    }
    // default
    return [230, 144, 116];
  }

  function luminance([r, g, b]: [number, number, number]) {
    // standard relative luminance
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  const label = onRoll != null ? String(onRoll) : letter ?? "";

  const rgb = parseHexOrRgb(fillColor);
  const lum = luminance(rgb);
  const textFill = lum > 0.6 ? "#222222" : "#ffffff";

  const labelStyle = { fill: textFill, fontSize: 14, fontWeight: 700 } as const;

  // Render an SVG hex so stroke and orientation match map hexes.
  // We'll compute a 6-point polygon centered in an SVG viewbox of width W and height H
  const W = 32;
  const H = Math.round(W * 0.9);
  const cx = W / 2;
  const cy = H / 2;
  // size is distance from center to corner. Choose size so polygon fits inside viewbox with stroke.
  const size = Math.min(W, H) / 2 - 3; // leave room for stroke
  // compute corners using floats (no rounding) so the SVG polygon is symmetric
  const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
  const corners = angles.map((rad) => ({ x: cx + Math.cos(rad) * size, y: cy + Math.sin(rad) * size }));
  const points = polygon(corners);

  return (
    <svg
      className={goodClass}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points={points} fill={fillColor} stroke="#222" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={labelStyle}>
        {label}
      </text>
    </svg>
  );
}

function PlaceGood({
  good,
  toggleSelectedGood,
}: {
  good?: Good;
  toggleSelectedGood(): void;
}) {
  const { canEmit, canEmitUserId } = useAction(ProductionAction);
  const { emit: emitPass } = useEmptyAction(PassAction);
  const state = usePhaseState(Phase.GOODS_GROWTH, GOODS_GROWTH_STATE);
  if (canEmitUserId == null) {
    return <></>;
  }

  return (
    <div>
      <p>
        {canEmit ? "You" : <Username userId={canEmitUserId} />} drew{" "}
        {state!.goods.map(goodToString).join(", ")}
      </p>
      {canEmit && (
        <div>
          <p>Select where to place {goodToString(good!)}.</p>
          {state!.goods.length > 1 && (
            <Button
              icon
              labelPosition="left"
              color="teal"
              onClick={toggleSelectedGood}
            >
              <Icon name="arrows alternate horizontal" />
              Switch selected good
            </Button>
          )}
          <Button negative onClick={emitPass}>
            Pass
          </Button>
        </div>
      )}
    </div>
  );
}

interface GoodBlockProps {
  onClick?: () => void;
  good?: Good;
  canSelect?: boolean;
  emptySpace?: boolean;
  className?: string;
}

export function GoodBlock({
  onClick,
  good,
  canSelect,
  emptySpace,
  className,
}: GoodBlockProps) {
  const classNames = [
    styles.goodPlace,
    !emptySpace ? styles.good : "",
    good != null ? goodStyle(good) : styles.empty,
    canSelect && !emptySpace && good == null ? styles.clickableGood : "",
    className ?? "",
  ];
  return (
    <div
      onClick={canSelect ? onClick : undefined}
      className={classNames.join(" ")}
    />
  );
}

function numberToLetter(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}
