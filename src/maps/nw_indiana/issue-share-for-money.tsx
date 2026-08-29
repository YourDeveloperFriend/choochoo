import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Button,
  Menu,
  MenuItem,
} from "semantic-ui-react";
import { useEmptyAction } from "../../client/services/action";
import { NwIndianaIssueShareForMoneyAction } from "./shares";
import { useState } from "react";

export function IssueShareForMoney() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { emit, canEmit, isPending } = useEmptyAction(
    NwIndianaIssueShareForMoneyAction,
  );
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
          content="Emergency Shares"
        />
        <AccordionContent active={expanded}>
          <div>
            <Button primary onClick={emit} disabled={isPending}>
              Issue Share for $4
            </Button>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
