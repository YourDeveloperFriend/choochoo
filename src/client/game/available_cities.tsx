import { useMemo } from "react";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { MutableAvailableCity } from "../../engine/state/available_city";
import { SpaceType } from "../../engine/state/location_type";
import { MapRegistry } from "../../maps/registry";
import { Coordinates } from "../../utils/coordinates";
import { HexGrid } from "../grid/hex_grid";
import { useGameKey, useInjectedState } from "../utils/injection_context";
import * as styles from "./available_cities.module.css";

export function AvailableCities() {
  const cities = useInjectedState(AVAILABLE_CITIES);

  if (cities.length === 0) return <></>;

  return (
    <div>
      <h2>Available Cities</h2>
      <div className={styles.availableCityList}>
        {cities.map((city, idx) => (
          <AvailableCity
            key={idx}
            city={city}
          />
        ))}
      </div>
    </div>
  );
}

function AvailableCity({ city }: { city: MutableAvailableCity }) {
  const mapSettings = MapRegistry.singleton.get(useGameKey());
  const grid = useMemo(() => {
    const newCity = new City(Coordinates.from({ q: 0, r: 0 }), {
      type: SpaceType.CITY,
      name: "",
      color: city.color,
      goods: city.goods,
      urbanized: true,
      onRoll: city.onRoll,
    });
    return Grid.fromSpaces(mapSettings, [newCity], []);
  }, [city]);

  return (
    <div>
      <HexGrid grid={grid} />
    </div>
  );
}
