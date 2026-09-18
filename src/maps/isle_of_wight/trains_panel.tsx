import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Icon,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { getPlayerColorCss } from "../../client/components/player_color";
import { Username } from "../../client/components/username";
import { GoodBlock } from "../../client/game/goods_table";
import {
  useInject,
  useInjectedState,
} from "../../client/utils/injection_context";
import { injectAllPlayersUnsafe, TURN_ORDER } from "../../engine/game/state";
import { PlayerColor } from "../../engine/state/player";
import { HIGHEST_TIER_BOUGHT, PLAYER_TRAINS, TRAIN_DECK } from "./state";
import {
  cardBoxes,
  TrainCard,
  TRAIN_TIERS,
  TRAIN_TIER_NOTES,
} from "./train_data";
import * as styles from "./trains_panel.module.css";

export function TrainsPanel() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const playerData = useInject(() => injectAllPlayersUnsafe()(), []);
  const turnOrder = useInjectedState(TURN_ORDER);
  const outOfGameColors = playerData
    .filter((player) => player.outOfGame)
    .map((player) => player.color);
  const colors = [...turnOrder, ...outOfGameColors];

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Trains"
        />
        <AccordionContent active={expanded}>
          <Table celled compact unstackable size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Player</TableHeaderCell>
                <TableHeaderCell>Trains</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map((color) => {
                const cards = playerTrains.get(color) ?? [];
                return (
                  <TableRow key={color}>
                    <TableCell>
                      <PlayerBlock color={color} />
                      <Username
                        userId={
                          playerData.find((player) => player.color === color)!
                            .playerId
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {cards.length === 0 ? (
                        "—"
                      ) : (
                        <div className={styles.cardList}>
                          {cards.map((card, index) => (
                            <TrainCardView key={index} card={card} />
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TrainDeckTable />
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

export function TrainDeckTable() {
  const deck = useInjectedState(TRAIN_DECK);
  const highestTierBought = useInjectedState(HIGHEST_TIER_BOUGHT);

  const lowestAvailable = TRAIN_TIERS.map(({ tier }) => tier).find(
    (tier) => (deck.get(tier) ?? 0) > 0,
  );

  return (
    <Table celled compact unstackable size="small">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Layer</TableHeaderCell>
          <TableHeaderCell>Cost</TableHeaderCell>
          <TableHeaderCell>Boxes</TableHeaderCell>
          <TableHeaderCell>Remaining</TableHeaderCell>
          <TableHeaderCell>Broken</TableHeaderCell>
          <TableHeaderCell>Notes</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TRAIN_TIERS.map(({ tier, cost, boxes }) => (
          <TableRow key={tier} positive={tier === lowestAvailable}>
            <TableCell textAlign="center">{tier}-train</TableCell>
            <TableCell textAlign="center">${cost}</TableCell>
            <TableCell textAlign="center">{boxes.join("/")}</TableCell>
            <TableCell textAlign="center">{deck.get(tier) ?? 0}</TableCell>
            <TableCell textAlign="center">
              {highestTierBought >= tier && <Icon name="checkmark" />}
            </TableCell>
            <TableCell>{TRAIN_TIER_NOTES[tier - 1]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface TrainCardViewProps {
  card: TrainCard;
  /** How many repair removals are currently selected for this train (0-2). */
  highlightCount?: number;
  onClick?: () => void;
}

export function TrainCardView({
  card,
  highlightCount,
  onClick,
}: TrainCardViewProps) {
  const highlightClass =
    highlightCount === 2
      ? styles.highlightedTwice
      : highlightCount === 1
        ? styles.highlightedOnce
        : "";
  return (
    <div
      className={`${styles.card} ${card.used ? styles.used : ""} ${highlightClass}`}
      onClick={onClick}
    >
      <div style={{ marginBottom: "1em" }}>
        {card.tier}-train{card.used ? " (used)" : ""}
      </div>
      <div className={styles.boxes}>
        {cardBoxes(card).map(({ range, good }, index) => (
          <div key={index} className={styles.box}>
            {good != null ? (
              <GoodBlock good={good} className={styles.goodBlock} />
            ) : (
              range
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerBlock({ color }: { color: PlayerColor }) {
  return (
    <div className={`${styles.playerBlock} ${getPlayerColorCss(color)}`} />
  );
}
