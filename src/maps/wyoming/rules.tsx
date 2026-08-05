export function WyomingRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          The game lasts 8 rounds with 2 players, or 6 rounds with 3 players.
        </li>
        <li>
          Build Track: plains cost $2, mountains cost $4, and high mountains
          cost $6.
        </li>
        <li>
          If Laramie is urbanized and a player currently owns the direct town
          connection between Laramie and Cheyenne, that player immediately
          claims an intercity link between the two cities. If nobody built that
          town connection, any player may instead build the intercity link for
          $2. Only one intercity link may ever be built there.
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
          Engineer: place up to four track. Your least expensive track is free.
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
        <li>
          (Three players only) At the start of the game, Urbanization or
          Engineer is randomly chosen to be unavailable on turn 1. Each
          subsequent turn, the disabled special action alternates between
          Urbanization and Engineer.
        </li>
      </ul>
    </div>
  );
}
