export function NwIndianaRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> Schererville and Valparaiso (the starting purple cities)
          start with 3 cubes. Every other city starts with 2 cubes.
        </li>
        <li>
          <b>Chicago:</b> is a terminus. Goods may be delivered to Chicago, but
          deliveries cannot pass through it. The three Chicago hexes are treated
          as a single large hex; goods in Chicago may be moved out of any hex
          and goods being delivered to Chicago can enter from any of the hexes.
        </li>
        <li>
          <b>La Porte and Knox:</b> cannot be built on. Can only be urbanized.
        </li>
        <li>
          <b>$8 links:</b> claimable links near Chesterton, La Porte, and Knox
          cannot be claimed until both ends are cities.
        </li>
        <li>
          <b>Shares:</b> the first 5 shares issued (including the 2 your start
          with) give you $5. Shares 6-10 give you $6 each, and 11-15 give you $7
          each. Additionally, you are able to issue a share at any time for $4.
          (Note that income/expenses is executed without interaction, so
          you&apos;ll need to issue any such shares before your last move goods
          action of the round.)
        </li>
        <li>
          <b>Construction (odd turns):</b> during the Move Goods phase, players
          have a temporary -1 Engine Level (so a player with an Engine Level of
          one cannot make a delivery that turn).
        </li>
        <li>
          <b>Winter (even turns):</b> players&apos; Engine Level expenses are
          doubled. Share expenses are not affected.
        </li>
      </ul>
    </div>
  );
}
