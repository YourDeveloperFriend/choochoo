export function OahuRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> there are no dice. Every city starts with 2 cubes and
          every town starts with 1 cube. Each new city tile starts with 1 cube
          on top of it, which comes out as soon as the tile is urbanized. The
          new cities portion of the goods display is left empty; the rest fills
          as normal.
        </li>
        <li>
          The two hexes &quot;Pearl City&quot; and &quot;Waipahu&quot; are
          considered a single large city; goods can be moved out of either hex,
          be delivered to either hex, and can be moved in from one hex and out
          the other. The two Honolulu hexes are the same.
        </li>
        <li>
          <b>Goods growth:</b> skipped. The goods display is never refilled, so
          the only way cubes reach the map is the Production action.
        </li>
        <li>
          <b>Production:</b> at the end of the round, you must choose a column
          of the goods display that still has cubes. Every cube in that column
          moves immediately into that column&apos;s city.
        </li>
        <li>
          <b>Tourist Trap:</b> a new special action. Immediately, every other
          player gives you $1. You receive nothing from players who have no cash
          on hand.
        </li>
        <li>
          <b>Turn Order Pass:</b> not available.
        </li>
        <li>
          <b>Locomotive (3 players only):</b> instead of a permanent increase,
          your engine level is temporarily plus one during the Move Goods phase.
          In a 4 or 5 player game, locomotive works normally.
        </li>
        <li>
          <b>Track building:</b> plains cost $2, mountains cost $3, and water
          hexes cost $6. You may not place complex track on a water hex as its
          first tile.
        </li>
      </ul>
    </div>
  );
}
