export function MoonRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Black Cities</b>: are removed from the game.
        </li>
        <li>
          <b>Builds</b>: are limited to 2 (3 w/ engineer).
        </li>
        <li>
          <b>Craters</b>: cost $3 and mountains cost $4. Towns cost $2 +
          $1/exit.
        </li>
        <li>
          <b>Connections</b>: must either be off the Moon Base, or traced back
          to the Moon Base (through any player).
        </li>
        <li>
          <b>Spherical map</b>: builds off one edge of the map can be routed off
          the other end (double check the numbers to see where it loops around).
        </li>
        <li>
          <b>Cities</b>: switch to black cities on every other turn.
        </li>
        <li>
          <b>Low gravitation</b>: lets you use one link as if it were your own.
          You can use this ability for both moves.
        </li>
        <li>
          <b>Goods Growth</b>: roll 2 dice per player once (not separately per
          white/grey chart); the same results apply to every day city, including
          urbanized New Cities. Only replenishes non-black cities that have a
          connection with a player.
        </li>
      </ul>
    </div>
  );
}
