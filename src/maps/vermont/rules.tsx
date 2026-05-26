export function VermontRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Action Selection:</b> Immediately following action selection, add
          $1 per player to each action that isn&apos;t chosen (for example, if
          playing with 4 players add $4 to each unused action space). The player
          to choose that action on a subsequent turn receives all the money on
          that action.
        </li>
        <li>
          <b>Building</b>: On every odd-numbered round, all track costs $1
          extra, and each delivery results in $1 income extra for the player who
          owns the link used last (adjacent to the recipient city).
        </li>
      </ul>
    </div>
  );
}
