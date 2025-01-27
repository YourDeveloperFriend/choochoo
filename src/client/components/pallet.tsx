import { useMemo } from "react";
import { GameKey } from "../../api/game_key";
import { Land } from "../../engine/map/location";
import { SpaceType } from "../../engine/state/location_type";
import { allPlayerColors } from "../../engine/state/player";
import {
  Direction,
  SimpleTileType,
  TownTileType,
} from "../../engine/state/tile";
import { ViewRegistry } from "../../maps/view_registry";
import { Coordinates } from "../../utils/coordinates";
import { PlayerCircle } from "../game/bidding_info";
import { PlayerColorIndicator } from "../game/player_stats";
import { ModifiedSpace } from "../grid/building_dialog";
import * as styles from "./pallet.module.css";

export function Pallet() {
  const plain = new Land(Coordinates.from({ q: 0, r: 0 }), {
    type: SpaceType.PLAIN,
    townName: "Foo bar",
  });
  const river = new Land(Coordinates.from({ q: 0, r: 0 }), {
    type: SpaceType.RIVER,
    townName: "Foo bar",
  });
  const mountain = new Land(Coordinates.from({ q: 0, r: 0 }), {
    type: SpaceType.MOUNTAIN,
    townName: "Foo bar",
  });
  const desert = new Land(Coordinates.from({ q: 0, r: 0 }), {
    type: SpaceType.DESERT,
    townName: "Foo bar",
  });

  const allColors = useMemo(() => [undefined, ...allPlayerColors], []);
  return (
    <div className={styles.row}>
      {[true, false].map((darkMode) => (
        <>
          {allColors.map((playerColor) => (
            <div
              className={`${darkMode ? "dark-mode" : ""} ${styles.column}`}
              key={playerColor}
            >
              <PlayerCircle color={playerColor} bid={5} />
              <PlayerColorIndicator
                playerColor={playerColor}
                currentTurn={true}
              />
              {[SimpleTileType.CURVE, TownTileType.STRAIGHT].map((tileType) => (
                <>
                  {[plain, river, mountain, desert].map((space, index) => (
                    <ModifiedSpace
                      key={index}
                      space={space}
                      settings={ViewRegistry.singleton.get(GameKey.REVERSTEAM)}
                      tile={{
                        tileType,
                        orientation: Direction.TOP,
                        owners: [playerColor, playerColor],
                      }}
                    />
                  ))}
                </>
              ))}
            </div>
          ))}
        </>
      ))}
    </div>
  );
}
