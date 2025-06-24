import {
  useGameKey,
  useGrid,
  useInjectedState,
} from "../../client/utils/injection_context";
import {
  INSTANT_PRODUCTION_STATE,
  InstantProductionAction,
} from "./instant_production";
import { MoveGoods } from "../../client/game/move_goods_action_summary";
import { useAction } from "../../client/services/action";
import { GenericMessage } from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import {
  Button,
  Header,
  Modal,
  ModalActions,
  ModalContent,
} from "semantic-ui-react";
import { assert } from "../../utils/validate";
import { Good, goodToString } from "../../engine/state/good";
import * as styles from "./instant_production_view.module.css";
import { ReactNode, useMemo, useState } from "react";
import { City } from "../../engine/map/city";
import { Coordinates } from "../../utils/coordinates";
import { Grid } from "../../engine/map/grid";
import { HexGrid } from "../../client/grid/hex_grid";
import { MapRegistry } from "../../maps/registry";

export function InstantProductionMoveGoodsActionSummary() {
  const state = useInjectedState(INSTANT_PRODUCTION_STATE);
  const grid = useGrid();
  const [open, setOpen] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<Coordinates | undefined>(
    undefined,
  );
  const { canEmit, canEmitUserId, isPending, emit } = useAction(
    InstantProductionAction,
  );

  if (state.startCity && state.endCity) {
    if (canEmitUserId == null) {
      return null;
    }

    if (!canEmit) {
      return (
        <GenericMessage>
          <Username userId={canEmitUserId} /> must perform instant production.
        </GenericMessage>
      );
    }

    const start = grid.get(state.startCity);
    assert(start instanceof City);
    const end = grid.get(state.endCity);
    assert(end instanceof City);

    let content: ReactNode;
    if (state.drawnCube !== undefined) {
      content = (
        <>
          <p>
            Pick the city for which the drawn {goodToString(state.drawnCube)}{" "}
            cube should be added to Goods Growth.
          </p>
          <div>
            {[start, end].map((option, idx) => {
              return (
                <div
                  key={idx}
                  className={`${styles.cityOption} ${selectedCity && option.coordinates.equals(selectedCity) ? styles.selected : ""}`}
                  onClick={() => setSelectedCity(option.coordinates)}
                >
                  <div>{option.name()}</div>
                  <CityInfo city={option} />
                </div>
              );
            })}
          </div>
        </>
      );
    } else {
      content = (
        <>
          <p>
            Select a city to which a good should be added for instant
            production.
          </p>
          <p>
            The top good from the goods display will be moved to the city. If
            there are no goods left, a random cube will be drawn from the bag
            and added to the goods display.
          </p>
          <div>
            {[start, end].map((option, idx) => {
              const onRoll = option.onRoll();
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
                  key={idx}
                  className={`${styles.cityOption} ${selectedCity && option.coordinates.equals(selectedCity) ? styles.selected : ""}`}
                  onClick={() => setSelectedCity(option.coordinates)}
                >
                  <div>{option.name()}</div>
                  <CityInfo city={option} />
                  <div>
                    {goodToAdd !== undefined
                      ? `Add a ${goodToString(goodToAdd)} good`
                      : "Add a random good to goods growth"}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    return (
      <div>
        <Modal closeIcon open={open} onClose={() => setOpen(false)}>
          <Header>Perform Instant Production</Header>
          <ModalContent>{content}</ModalContent>
          <ModalActions>
            <Button
              negative
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              primary
              onClick={() => emit({ city: selectedCity as Coordinates })}
              disabled={isPending || selectedCity === undefined}
            >
              Select City
            </Button>
          </ModalActions>
        </Modal>

        <Button primary onClick={() => setOpen(true)}>
          Perform instant production
        </Button>
      </div>
    );
  }

  return <MoveGoods />;
}

function CityInfo({ city }: { city: City }) {
  const mapSettings = MapRegistry.singleton.get(useGameKey());
  const grid = useMemo(() => {
    return Grid.fromSpaces(mapSettings, [city], []);
  }, [mapSettings]);

  return <HexGrid grid={grid} />;
}
