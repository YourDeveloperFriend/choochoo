export function DetroitRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Limited goods:</b> only 1 cube on the goods display for each city
          and no production action.
        </li>
        <li>
          <b>In debt:</b> Every player starts with 5/25 shares and no cash.
        </li>
        <li>
          <b>Engineer:</b> in addition to 4 builds, lets you build the cheapest
          build for free.
        </li>
        <li>
          <b>Moving goods:</b> when moving goods, at least half of the links
          must belong to the current player.
        </li>
        <li>
          <b>Extra expenses:</b> expenses include shares + loco + current round
          number.
        </li>
        <li>
          <b>Infinite game:</b> game only ends when everyone but one player goes
          bankrupt.
        </li>
        <li>
          <b>Income reduction:</b> lose 1 income for every 5 (instead of 2 for
          every 10).
        </li>
        <li>
          <b>Winner:</b> last one remaining, or, if multiple go bankrupt in one
          round, whoever has the highest income.
        </li>
        <li>
          <b>Solo:</b> In solo mode, actions have a special cost that goes down
          each time it&apos;s selected. After being selected 3 times, the action
          will no longer be available. Goods growth rolls 2 dice per side, and
          income reduction has no maximum. The goal is to last longer than 6
          rounds.
        </li>
      </ul>
    </div>
  );
}
