import { useCallback, useMemo } from "react";
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
import { useAction, useEmptyAction } from "../services/action";
import { useGame, useGameVersionState } from "../services/game";
import {
  useGrid,
  useInjected,
  useInjectedState,
  usePhaseState,
} from "../utils/injection_context";
import * as styles from "./goods_table.module.css";
import { Button, Icon } from "semantic-ui-react";

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
  } else if (!starter.isProductionEnabled()) {
    return <></>;
  }

  return (
    <div>
      <h2>Goods Growth Table</h2>
      <PlaceGood good={good} toggleSelectedGood={toggleSelectedGood} />
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
                {hasUrbanizedCities && <div>{urbanizedCity && letter}</div>}
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
          })}
        </div>
      </div>
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
  onClick(): void;
  good?: Good;
  canSelect?: boolean;
  emptySpace?: boolean;
}

function GoodBlock({ onClick, good, canSelect, emptySpace }: GoodBlockProps) {
  const classNames = [
    styles.goodPlace,
    !emptySpace ? styles.good : "",
    good != null ? goodStyle(good) : styles.empty,
    canSelect && !emptySpace && good == null ? styles.clickableGood : "",
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
