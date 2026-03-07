import { Button } from "semantic-ui-react";
import {
  getAllMessageTypes,
  MESSAGE_TYPE_LABELS,
  MessageType,
} from "../../utils/message_types";
import * as styles from "./filter_controls.module.css";

interface FilterControlsProps {
  activeFilters: Set<MessageType>;
  onToggle: (type: MessageType) => void;
}

/**
 * Filter controls for toggling message type visibility in the game log.
 * Displays a button for each message type with an icon and label.
 */
export function FilterControls({
  activeFilters,
  onToggle,
}: FilterControlsProps) {
  const messageTypes = getAllMessageTypes();

  return (
    <div
      className={styles.filterControls}
      role="group"
      aria-label="Message type filters"
    >
      {messageTypes.map((type) => {
        const isActive = activeFilters.has(type);
        const label = MESSAGE_TYPE_LABELS[type];

        return (
          <Button
            key={type}
            size="tiny"
            toggle
            active={isActive}
            onClick={() => onToggle(type)}
            aria-label={`Toggle ${label} messages`}
            aria-pressed={isActive}
            className={`${styles.filterButton} ${styles[`filterButton${MessageType[type]}`]} ${isActive ? styles.active : ""}`}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
