import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Button,
  Menu,
  MenuItem,
} from "semantic-ui-react";
import { useEmptyAction } from "../../client/services/action";
import { MiningExpertise, MiningToMoneyAction } from "./mining";
import { RowProps } from "../../client/game/final_overview_row";
import { useInjectedState } from "../../client/utils/injection_context";
import * as styles from "../../client/game/final_overview.module.css";

export function SpendMiningExpertise() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { emit, canEmit, isPending } = useEmptyAction(MiningToMoneyAction);
  if (!canEmit) {
    return <></>;
  }

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Mining Expertise"
        />
        <AccordionContent active={expanded}>
          <div>
            <Button primary onClick={emit} disabled={isPending}>
              Spend Mining Expertise
            </Button>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

export function MiningExpertiseScoringRow({ players }: RowProps) {
  const miningExpertise = useInjectedState(MiningExpertise);
  return (
    <tr>
      <th className={styles.label}>Mining Expertise</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{miningExpertise.get(player.color)!}</td>
      ))}
    </tr>
  );
}
