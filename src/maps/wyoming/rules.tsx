export function WyomingRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          The game lasts 8 rounds with 2 players, or 6 rounds with 3 players.
        </li>
        <li>
          <p>
            Select Actions: After the first player selects their action, they
            may spend additional money to select a separate action that every
            other player may not select this turn:
          </p>
          <p>(2p) - This costs $2, or $4 if you&apos;re blocking Locomotive.</p>
          <p>(3p) - This costs $3, or $6 if you&apos;re blocking Locomotive.</p>
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
          Engineer: place up to four track <i>or</i> place up to three track and
          your most expensive track is free.
        </li>
        <li>
          (Two players only) Locomotive: your engine level is only temporarily
          increased by one, for the Move Goods phase of the turn it&apos;s
          selected.
        </li>
        <li>
          (Two players only) In the turn order auction, first place pays full
          price and second place pays nothing.
        </li>
      </ul>
    </div>
  );
}
