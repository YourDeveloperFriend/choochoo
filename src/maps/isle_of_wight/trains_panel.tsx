import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
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
import { GoodBlock } from "../../client/game/goods_table";
import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { HAGGLE_COUPONS, PLAYER_TRAINS, TRAIN_DECK } from "./state";
import { cardBoxes, TrainCard, TRAIN_TIERS } from "./train_data";
import * as styles from "./trains_panel.module.css";

export function TrainsPanel() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const coupons = useInjectedState(HAGGLE_COUPONS);
  const deck = useInjectedState(TRAIN_DECK);

  const lowestAvailable = TRAIN_TIERS.map(({ tier }) => tier).find(
    (tier) => (deck.get(tier) ?? 0) > 0,
  );

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
                <TableHeaderCell>Coupons</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...playerTrains].map(([color, cards]) => (
                <TableRow key={color}>
                  <TableCell>
                    <PlayerBlock color={color} />
                    {playerColorToString(color)}
                  </TableCell>
                  <TableCell>
                    {cards.length === 0
                      ? "—"
                      : cards.map((card, index) => (
                          <TrainCardView key={index} card={card} />
                        ))}
                  </TableCell>
                  <TableCell textAlign="center">
                    {coupons.get(color) ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Table celled compact unstackable size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Layer</TableHeaderCell>
                <TableHeaderCell>Cost</TableHeaderCell>
                <TableHeaderCell>Boxes</TableHeaderCell>
                <TableHeaderCell>Left</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRAIN_TIERS.map(({ tier, cost, boxes }) => (
                <TableRow key={tier} positive={tier === lowestAvailable}>
                  <TableCell textAlign="center">{tier}-train</TableCell>
                  <TableCell textAlign="center">${cost}</TableCell>
                  <TableCell textAlign="center">{boxes.join("/")}</TableCell>
                  <TableCell textAlign="center">
                    {deck.get(tier) ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

export function TrainCardView({ card }: { card: TrainCard }) {
  return (
    <div className={`${styles.card} ${card.used ? styles.used : ""}`}>
      <div>
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
