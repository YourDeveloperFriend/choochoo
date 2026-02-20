import { useEmptyAction } from "../services/action";
import { DoneAction } from "../../engine/build/done";
import { useConfirm } from "../components/confirm";
import { useInject } from "../utils/injection_context";
import { inject } from "../../engine/framework/execution_context";
import { BuilderHelper } from "../../engine/build/helper";
import { useCallback } from "react";
import { Username } from "../components/username";
import { Button, Icon } from "semantic-ui-react";
import { GenericMessage } from "./action_summary";

export function Build() {
  const { emit: emitPass, canEmit, canEmitUserId } = useEmptyAction(DoneAction);
  const confirm = useConfirm();
  const [buildsRemaining, canUrbanize] = useInject(() => {
    const helper = inject(BuilderHelper);
    if (!canEmit) return [undefined, undefined];
    return [helper.buildsRemaining(), helper.canUrbanize()];
  }, [canEmit]);

  const emitPassClick = useCallback(() => {
    if (!canUrbanize) {
      emitPass();
      return;
    }
    confirm(
      "You still have an urbanize available, are you sure you are done building?",
    ).then((stillPass) => {
      if (stillPass) {
        emitPass();
      }
    });
  }, [emitPass, canUrbanize]);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must build.
      </GenericMessage>
    );
  }

  return (
    <div>
      <p>
        You can build {buildsRemaining} more track tile{buildsRemaining == 1 ? '' : 's'}
        {canUrbanize && " and urbanize"}.
      </p>
      <Button icon labelPosition="left" color="green" onClick={emitPassClick}>
        <Icon name="check" />
        Done Building
      </Button>
    </div>
  );
}
