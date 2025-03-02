export function SoulTrainRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Players:</b> start with $20.
        </li>
        <li>
          <b>Fire:</b> costs $3 to build.
        </li>
        <li>
          <b>Heaven:</b> costs $1 to build.
        </li>
        <li>
          <b>Building:</b> must build complete links, but you get 6 builds per
          turn.
        </li>
        <li>
          <b>Engineering:</b> cuts the total cost of your build in half (rounded
          up).
        </li>
        <li>
          <b>Hills:</b> cost $4.
        </li>
        <li>
          <b>Production and Goods Growth:</b> are skipped.
        </li>
        <li>
          <b>Hell to Earth:</b> no goods can be delivered to Hell cities or pass
          through Hell cities of the same color.
        </li>
        <li>
          <b>Earth to Heaven:</b> begins once there are 10 or less goods in
          Hell, at which point no goods can be delivered to Earth cities or pass
          through Earth cities of the same color.
        </li>
        <li>
          <b>Game ends:</b> two turns after the Earth to Heaven phase begins.
        </li>
      </ul>
    </div>
  );
}
