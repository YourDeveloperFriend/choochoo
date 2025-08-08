import { Reorder } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Header,
  Modal,
  ModalActions,
  ModalContent,
} from "semantic-ui-react";
import { GoodBlock } from "../../client/game/goods_table";
import { useAction } from "../../client/services/action";
import { useInject } from "../../client/utils/injection_context";
import { injectGrid } from "../../engine/game/state";
import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { Good, goodToString } from "../../engine/state/good";
import { remove } from "../../utils/functions";
import { DCMoveAction } from "./move";
import * as styles from "./move_intercept_modal.module.css";

interface GoodContainer {
  id: number;
  good: Good;
}

export function DCMetroMoveInterceptorModal({
  cityName,
  moveData,
  clearMoveData,
}: InterceptMoveModalProps) {
  const { emit, isPending } = useAction(DCMoveAction);

  const initialOptions = useInject(() => {
    if (moveData?.startingCity == null) return;
    const grid = injectGrid()();
    const goods = [...grid.get(moveData.startingCity)!.getGoods()];
    return remove(goods, moveData.good);
  }, [moveData]);

  const [goods, setGoods] = useState<GoodContainer[] | undefined>(undefined);

  useEffect(() => {
    if (moveData?.startingCity == null) return;
    setGoods(
      initialOptions?.map((good, index) => ({
        id: index,
        good,
      })),
    );
  }, [initialOptions?.join(",")]);

  const completeMove = useCallback(() => {
    if (moveData == null || goods == null) return;
    emit({
      ...moveData,
      goods: goods.map(({ good }) => good).slice(0, moveData.path.length - 1),
    });
    clearMoveData();
  }, [moveData, goods, emit]);

  const cities = useInject(() => {
    const grid = injectGrid()();
    return (
      moveData?.path
        .map(({ endingStop }) => grid.displayName(endingStop))
        .slice(0, -1) ?? []
    );
  }, [moveData]);

  return (
    <Modal closeIcon open={moveData != null} onClose={clearMoveData}>
      <Header content={`Deliver to ${cityName}?`} />
      <ModalContent>
        <p>Select where to place the goods.</p>
        {goods && (
          <div className={styles.goodsContainer}>
            <div>
              <ul>
                {cities.map((city) => (
                  <li key={city}>{city}</li>
                ))}
                <li>Rest</li>
              </ul>
            </div>
            <div>
              <Reorder.Group
                values={goods}
                onReorder={setGoods}
                as="ul"
                className={styles.reorderList}
              >
                {goods.map((good) => (
                  <Reorder.Item
                    key={good.id}
                    value={good}
                    className={styles.reorderItem}
                  >
                    <GoodBlock good={good.good} className={styles.goodsBlock} />
                    {goodToString(good.good)}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>
        )}
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={completeMove} disabled={isPending}>
          Move goods
        </Button>
      </ModalActions>
    </Modal>
  );
}
