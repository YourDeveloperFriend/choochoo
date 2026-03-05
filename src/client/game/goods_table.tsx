import { useCallback, useMemo } from "react";
import { Button, Icon } from "semantic-ui-react";
import { PHASE } from "../../engine/game/phase";
import { GameStarter } from "../../engine/game/starter";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { PassAction } from "../../engine/goods_growth/pass";
import { ProductionAction } from "../../engine/goods_growth/production";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { City } from "../../engine/map/city";
import { CityGroup } from "../../engine/state/city_group";
import { Good, goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { OnRoll } from "../../engine/state/roll";
import { MutableAvailableCity } from "../../engine/state/available_city";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { iterate } from "../../utils/functions";
import { ImmutableMap } from "../../utils/immutable";
import { assert } from "../../utils/validate";
import { Username } from "../components/username";
import { goodStyle } from "../grid/good";
import { readGoodColor } from "../grid/read_good_color";
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

// Constants for goods table layout
const TOTAL_COLUMNS = 12;
const WHITE_COLUMNS = 6;
const LETTER_START_INDEX = 2; // First letter column (A)
const LETTER_END_INDEX = 10;  // Last letter column before end
const GAP_AFTER_COLUMN = WHITE_COLUMNS - 1; // Add gap after last white column

// Default color for colorless cities - should match --colorless-default CSS variable
const COLORLESS_DEFAULT = "#e69074";

/**
 * Parse a color string (hex or rgb) into RGB tuple
 */
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

/**
 * Calculate relative luminance using standard formula
 */
function luminance([r, g, b]: [number, number, number]): number {
  const srgb = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculate WCAG 2.1 contrast ratio between two colors
 */
function contrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = luminance(color1);
  const lum2 = luminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Choose text color (white or black) that provides better WCAG contrast
 */
function chooseBestTextColor(bgColor: [number, number, number]): string {
  const whiteContrast = contrastRatio(bgColor, [255, 255, 255]);
  const blackContrast = contrastRatio(bgColor, [34, 34, 34]); // #222222
  return whiteContrast > blackContrast ? "#ffffff" : "#222222";
}

/**
 * Generate a single column for the goods table
 */
function createGoodsColumn({
  columnIndex,
  cities,
  availableCities,
  maxRegularGoods,
  maxUrbanizedGoods,
  hasUrbanizedCities,
  canEmit,
  onClick,
}: {
  columnIndex: number;
  cities: {
    regularCities: ImmutableMap<CityGroup, (Good | undefined | null)[][]>;
    urbanizedCities: ImmutableMap<CityGroup, (Good | undefined | null)[][]>;
    cityObjects: Map<string, City>;
  };
  availableCities: readonly MutableAvailableCity[];
  maxRegularGoods: number;
  maxUrbanizedGoods: number;
  hasUrbanizedCities: boolean;
  canEmit: boolean;
  onClick: (urbanized: boolean, cityGroup: CityGroup, onRoll: OnRoll, row: number) => void;
}) {
  const i = columnIndex;
  const cityGroup = i < WHITE_COLUMNS ? CityGroup.WHITE : CityGroup.BLACK;
  const onRoll = OnRoll.parse((i % WHITE_COLUMNS) + 1);
  const city = cities.regularCities.get(cityGroup)?.[onRoll];
  const urbanizedCity = cities.urbanizedCities.get(cityGroup)?.[onRoll];
  const letter = i < LETTER_START_INDEX || i >= LETTER_END_INDEX ? "" : numberToLetter(i - LETTER_START_INDEX);
  
  // Get the primary good color from the cached city object
  let primaryGood: Good | undefined = undefined;
  const cityKey = `${cityGroup}-${onRoll}`;
  const mapCity = cities.cityObjects.get(cityKey);
  if (mapCity != null) primaryGood = mapCity.goodColors()[0];

  // For the letter headers (A..H) use the availableCities' color so they match the Available Cities display
  const letterIndex = i - LETTER_START_INDEX;
  let letterGood: Good | undefined = undefined;
  if (letter !== "" && Array.isArray(availableCities) && letterIndex >= 0 && letterIndex < availableCities.length) {
    const avail = availableCities[letterIndex] as MutableAvailableCity;
    const colorVal = avail.color;
    letterGood = Array.isArray(colorVal) ? colorVal[0] : colorVal;
  }
  // if no specific letter good from availableCities, fall back to using the primary good from the map
  if (letterGood == null) {
    letterGood = primaryGood;
  }

  // Whether this column has a valid urbanized city letter (A-H)
  const hasLetter = letter !== "";

  return (
    <div
      className={`${styles.column} ${i === GAP_AFTER_COLUMN ? styles.gapRight : ""}`}
      key={i}
    >
      <div className={styles.headerCell}>
        <HeaderHex onRoll={onRoll} primaryGood={primaryGood} cityGroup={cityGroup} />
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
      {hasUrbanizedCities && hasLetter && (
        <div className={styles.letterCell}>
          {urbanizedCity ? (
            <HeaderHex primaryGood={letterGood} letter={letter} cityGroup={cityGroup} />
          ) : (
            <div className={`${styles.headerPlaceholder} ${styles.headerPlaceholderHidden}`} />
          )}
        </div>
      )}
      {hasUrbanizedCities && hasLetter &&
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
    const cityObjects = new Map<string, City>();
    for (const city of cities) {
      const map = city.isUrbanized() ? urbanizedCities : regularCities;
      for (const onRoll of city.onRoll().values()) {
        map.get(onRoll.group)![onRoll.onRoll] = onRoll.goods;
        // Store city object by key for color lookups
        const key = `${onRoll.group}-${onRoll.onRoll}`;
        cityObjects.set(key, city);
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
      cityObjects,
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
  const columns = useMemo(
    () =>
      iterate(TOTAL_COLUMNS, (i) =>
        createGoodsColumn({
          columnIndex: i,
          cities,
          availableCities,
          maxRegularGoods,
          maxUrbanizedGoods,
          hasUrbanizedCities,
          canEmit,
          onClick,
        })
      ),
    [cities, availableCities, maxRegularGoods, maxUrbanizedGoods, hasUrbanizedCities, canEmit, onClick]
  );

  return (
    <div>
      <h2>Goods Growth Table</h2>
      <PlaceGood good={good} toggleSelectedGood={toggleSelectedGood} />
      <div className={styles.goodsContainer}>
        <div className={styles.groupsGrid}>
          <section className={styles.group}>
            <div className={styles.leftColumns} role="list">
              {columns.slice(0, WHITE_COLUMNS)}
            </div>
          </section>
          <section className={styles.group}>
            <div className={styles.rightColumns} role="list">
              {columns.slice(WHITE_COLUMNS)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function HeaderHex({ 
  onRoll, 
  primaryGood, 
  letter,
  cityGroup 
}: { 
  onRoll?: OnRoll; 
  primaryGood?: Good; 
  letter?: string;
  cityGroup?: CityGroup;
}) {
  const label = onRoll != null ? String(onRoll) : letter ?? "";
  
  // Determine if this is a number header (has onRoll but no letter content)
  const isNumberHeader = onRoll != null && (letter == null || letter === "");
  
  if (isNumberHeader) {
    // Render plain text for number headers with WCAG-compliant colors
    const textColor = cityGroup === CityGroup.BLACK ? "#ffffff" : "#222222";
    return (
      <div 
        className={styles.plainNumberHeader}
        style={{ color: textColor }}
        aria-label={`Roll number ${onRoll}`}
      >
        {label}
      </div>
    );
  }
  
  // Render rounded rectangle for letter headers
  const fillColor = primaryGood != null ? readGoodColor(primaryGood) : COLORLESS_DEFAULT;
  
  // Use WCAG-compliant text color selection for letter headers
  const rgb = parseHexOrRgb(fillColor);
  const textColor = chooseBestTextColor(rgb);

  return (
    <div
      className={styles.letterHeader}
      style={{ backgroundColor: fillColor, color: textColor }}
      aria-label={`City ${label}`}
    >
      {label}
    </div>
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
