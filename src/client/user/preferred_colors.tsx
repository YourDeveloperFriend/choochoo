import { Reorder } from "framer-motion";
import { useCallback, useState } from "react";
import {
  CheckboxProps,
  Form,
  FormCheckbox,
  Header,
  Segment,
} from "semantic-ui-react";
import {
  eligiblePlayerColors,
  PlayerColor,
  playerColorToString,
} from "../../engine/state/player";
import { useMe, useUpdateMe } from "../services/me";

export function PreferredColors() {
  const me = useMe()!;
  const [preferredColors, setPreferredColorsState] = useState(
    me.preferredColors,
  );
  const { isPending, updateMe } = useUpdateMe();

  const setPreferredColors = useCallback(
    (preferredColors?: PlayerColor[]) => {
      setPreferredColorsState(preferredColors);
      updateMe({
        ...me,
        preferredColors,
      });
    },
    [setPreferredColorsState],
  );

  const setEnablePreferredColors = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setPreferredColors(
        data.checked ? (preferredColors ?? eligiblePlayerColors) : undefined,
      );
    },
    [preferredColors, setPreferredColors],
  );

  return (
    <Segment>
      <Header as="h2">Preferred Color</Header>
      <Form>
        <FormCheckbox
          toggle
          label="Set preferred colors"
          checked={preferredColors != null}
          disabled={isPending}
          onChange={setEnablePreferredColors}
        />
        {preferredColors != null && (
          <Reorder.Group
            values={preferredColors}
            onReorder={setPreferredColors}
            as="ol"
          >
            {preferredColors.map((color) => (
              <Reorder.Item key={color} value={color}>
                {playerColorToString(color)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </Form>
    </Segment>
  );
}
