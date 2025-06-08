import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { useAction } from "../../client/services/action";
import { LondonMoveAction } from "./move_good";
import { useCallback, useMemo, useState } from "react";
import { useGameKey, useGrid } from "../../client/utils/injection_context";
import {
  Button,
  Header,
  Modal,
  ModalActions,
  ModalContent,
} from "semantic-ui-react";
import { City } from "../../engine/map/city";
import { Coordinates } from "../../utils/coordinates";
import * as styles from "./move_interceptor_modal.module.css";
import { MapRegistry } from "../registry";
import { Grid } from "../../engine/map/grid";
import { HexGrid } from "../../client/grid/hex_grid";
import { assert } from "../../utils/validate";
import { Good, goodToString } from "../../engine/state/good";

export function LondonMoveInterceptorModal({
  cityName,
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  const grid = useGrid();
  const { emit: emitMoveAction, isPending: isPending } =
    useAction(LondonMoveAction);
  const [selectedCity, setSelectedCity] = useState<Coordinates | undefined>(
    undefined,
  );

  const clearMoveData = useCallback(() => {
    clearMoveDataExternal();
    setSelectedCity(undefined);
  }, [clearMoveDataExternal, setSelectedCity]);

  const options = useMemo(() => {
    if (moveData == null) return [];

    const result: Array<{ label: string; city: City }> = [];

    const start = grid.get(moveData.startingCity);
    if (start && start instanceof City) {
      result.push({
        label: "Source",
        city: start,
      });
    }
    const end = grid.get(moveData.path[moveData.path.length - 1].endingStop);
    if (end && end instanceof City) {
      result.push({
        label: "Destination",
        city: end,
      });
    }

    return result;
  }, [grid, moveData]);

  const completeMove = useCallback(() => {
    if (!selectedCity) {
      return;
    }
    emitMoveAction({
      city: selectedCity,
      ...moveData!,
    });
    clearMoveData();
    setSelectedCity(undefined);
  }, [emitMoveAction, clearMoveData, moveData, selectedCity]);

  return (
    <Modal closeIcon open={moveData != null} onClose={clearMoveData}>
      <Header content={`Deliver to ${cityName}?`} />
      <ModalContent>
        <p>
          Select a city to which a good should be added for instant production.
        </p>
        <p>
          The top good from the goods display will be moved to the city. If
          there are no goods left, a random cube will be drawn from the bag and
          added to the goods display.
        </p>
        <div>
          {options.map((option) => {
            const onRoll = option.city.onRoll();
            assert(onRoll.length === 1);
            const goods = onRoll[0].goods;
            let goodToAdd: Good | undefined;
            for (let i = goods.length - 1; i >= 0; i--) {
              const g = goods[i];
              if (g !== null && g !== undefined) {
                goodToAdd = g;
                break;
              }
            }

            return (
              <div
                key={option.label}
                className={`${styles.cityOption} ${selectedCity && option.city.coordinates.equals(selectedCity) ? styles.selected : ""}`}
                onClick={() => setSelectedCity(option.city.coordinates)}
              >
                <div>{option.label}</div>
                <CityInfo city={option.city} />
                <div>
                  {goodToAdd !== undefined
                    ? `Add a ${goodToString(goodToAdd)} good`
                    : "Add a random good to goods growth"}
                </div>
              </div>
            );
          })}
        </div>
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={completeMove}
          disabled={isPending || selectedCity === undefined}
        >
          Select City
        </Button>
      </ModalActions>
    </Modal>
  );
}

function CityInfo({ city }: { city: City }) {
  const mapSettings = MapRegistry.singleton.get(useGameKey());
  const grid = useMemo(() => {
    return Grid.fromSpaces(mapSettings, [city], []);
  }, [mapSettings]);

  return <HexGrid grid={grid} />;
}
