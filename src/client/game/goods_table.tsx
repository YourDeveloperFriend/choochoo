import { useMemo } from "react";
import { PHASE } from "../../engine/game/phase";
import { GameStarter } from "../../engine/game/starter";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { OnRoll } from "../../engine/state/roll";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { iterate } from "../../utils/functions";
import { ImmutableMap } from "../../utils/immutable";
import { goodStyle } from "../grid/good";
import { useGame } from "../services/game";
import {
  useGrid,
  useInjected,
  useInjectedState,
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

/** One slot of the goods display. */
export interface GoodsSlot {
  urbanized: boolean;
  cityGroup: CityGroup;
  onRoll: OnRoll;
  row: number;
}

interface GoodsTableProps {
  /** Called when a clickable slot is clicked. Absent means display only. */
  onClickSlot?(slot: GoodsSlot): void;
  /**
   * Which slots respond to a click, given what is currently in them. Absent
   * means none of them do. Placing a drawn good targets empty slots; an action
   * that takes goods off the display targets full ones.
   */
  isSlotClickable?(slot: GoodsSlot, good: Good | undefined): boolean;
}

export function GoodsTable({
  onClickSlot,
  isSlotClickable,
}: GoodsTableProps = {}) {
  const gameKey = useGame().gameKey;
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

  function slotProps(slot: GoodsSlot, good: Good | undefined) {
    const clickable = isSlotClickable?.(slot, good) ?? false;
    return {
      good,
      clickable,
      onClick: clickable ? () => onClickSlot?.(slot) : undefined,
    };
  }

  return (
    <div>
      <h2>Goods Growth Table</h2>
      <div className={styles.goodsContainer}>
        <div className={styles.row}>
          <div>White</div>
          <div>Black</div>
        </div>
        <div className={styles.row}>
          {iterate(12, (i) => {
            const cityGroup = i < 6 ? CityGroup.WHITE : CityGroup.BLACK;
            const onRoll = OnRoll.parse((i % 6) + 1);
            const city = cities.regularCities.get(cityGroup)?.[onRoll];
            const urbanizedCity =
              cities.urbanizedCities.get(cityGroup)?.[onRoll];
            const letter = i < 2 || i >= 10 ? "" : numberToLetter(i - 2);
            return (
              <div
                className={`${styles.column} ${i === 5 ? styles.gapRight : ""}`}
                key={i}
              >
                <div>{onRoll}</div>
                {iterate(maxRegularGoods, (goodIndex) => {
                  const row = maxRegularGoods - 1 - goodIndex;
                  return (
                    <GoodBlock
                      key={goodIndex}
                      {...slotProps(
                        { urbanized: false, cityGroup, onRoll, row },
                        city?.[row] ?? undefined,
                      )}
                    />
                  );
                })}
                {hasUrbanizedCities && <div>{urbanizedCity && letter}</div>}
                {hasUrbanizedCities &&
                  iterate(maxUrbanizedGoods, (goodIndex) => {
                    const row = maxUrbanizedGoods - 1 - goodIndex;
                    return (
                      <GoodBlock
                        key={goodIndex}
                        emptySpace={urbanizedCity == null}
                        {...slotProps(
                          { urbanized: true, cityGroup, onRoll, row },
                          urbanizedCity?.[row] ?? undefined,
                        )}
                      />
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface GoodBlockProps {
  onClick?: () => void;
  good?: Good;
  clickable?: boolean;
  emptySpace?: boolean;
  className?: string;
}

export function GoodBlock({
  onClick,
  good,
  clickable,
  emptySpace,
  className,
}: GoodBlockProps) {
  const showAsClickable = clickable && !emptySpace;
  const classNames = [
    styles.goodPlace,
    !emptySpace ? styles.good : "",
    good != null ? goodStyle(good) : styles.empty,
    showAsClickable ? styles.clickableGood : "",
    className ?? "",
  ];
  return (
    <div
      onClick={showAsClickable ? onClick : undefined}
      className={classNames.join(" ")}
    />
  );
}

function numberToLetter(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}
