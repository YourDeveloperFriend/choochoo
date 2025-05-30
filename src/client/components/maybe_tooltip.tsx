import { ReactElement } from "react";
import {Popup} from "semantic-ui-react";

interface MaybeTooltipProps {
  hide?: boolean;
  tooltip?: string;
  children: ReactElement;
}

export function MaybeTooltip(props: MaybeTooltipProps) {
  if (props.hide || props.tooltip == null) {
    return <>{props.children}</>;
  }
  return (
    <Popup content={props.tooltip} position="bottom center" trigger={props.children} />
  );
}
