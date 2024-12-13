import { useMemo } from "react";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { MutableAvailableCity } from "../../engine/state/available_city";
import { LocationType } from "../../engine/state/location_type";
import { Coordinates } from "../../utils/coordinates";
import { HexGrid } from "../grid/hex_grid";
import { useInjectedState } from "../utils/injection_context";
import * as styles from './available_cities.module.css';

export function AvailableCities() {
  const cities = useInjectedState(AVAILABLE_CITIES);

  if (cities.length === 0) return <></>;

  return <div>
    <h2>Available Cities</h2>
    <div className={styles.availableCityList}>
      {cities.map((city) => <AvailableCity key={city.onRoll[0].group * 10 + city.onRoll[0].onRoll} city={city} />)}
    </div>
  </div>;
}

export function AvailableCity({ city }: { city: MutableAvailableCity }) {
  const grid = useMemo(() => {
    const newCity = new City(Coordinates.from({ q: 0, r: 0 }), {
      type: LocationType.CITY,
      name: '',
      color: city.color,
      goods: [],
      urbanized: true,
      onRoll: city.onRoll,
    });
    return Grid.fromSpaces([newCity]);
  }, [city]);

  return <div><HexGrid grid={grid} /></div>;
}