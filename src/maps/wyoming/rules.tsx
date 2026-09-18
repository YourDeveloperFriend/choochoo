export function WyomingRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          The game lasts 9 rounds with 2 players, or 6 rounds with 3 players.
        </li>
        <li>
          Build Track: plains cost $2, mountains cost $4, and high mountains
          cost $6.
        </li>
        <li>
          Goods Growth: roll 4 dice on each side with 2 players, or 6 dice on
          each side with 3 players.
        </li>
        <li>Turn Order Pass is not available.</li>
        <li>
          First Move &amp; Issue Last: the player who selects First Move also
          issues shares last in the following turn&apos;s Issue Shares phase, no
          matter their turn order.
        </li>
        <li>
          (Two players only) Locomotive: instead of permanently increasing your
          engine level, this action costs $2 and grants a loco disc.
        </li>
        <li>
          (Two players only) Loco discs may be spent to temporarily extend a
          delivery by one link each; this happens automatically whenever a
          delivery exceeds your locomotive value, as long as you have enough
          loco discs to cover the difference. Loco discs cannot be used for
          anything else.
        </li>
        <li>
          (Two players only) The winner of each turn order auction immediately
          gains a free loco disc.
        </li>
        <li>
          (Two players only) In the turn order auction, first place pays full
          price and second place pays nothing.
        </li>
      </ul>
    </div>
  );
}
