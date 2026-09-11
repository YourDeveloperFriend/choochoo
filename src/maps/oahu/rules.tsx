export function OahuRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          The game lasts 8 turns with 3 or 4 players, or 7 turns with 5 players.
        </li>
        <li>
          <p>
            <b>Setup:</b> there are no dice. Honolulu starts with 3 cubes. Every
            other city starts with 2 cubes. Every Starting City&apos;s goods
            display column starts with 2 waiting cubes of different colors; New
            City columns start empty. Every town starts with one random cube.
          </p>
          <p>
            In 4 and 5 player games, also place a cube on top of every New City
            tile; this cube gets added to the city when it is urbanized.
          </p>
        </li>
        <li>
          The two hexes &quot;Pearl City&quot; and &quot;Waipahu&quot; are
          considered a single large city; goods can be moved out of either hex,
          be delivered to either hex, and can be moved in from one hex and out
          the other. The two Honolulu hexes are the same.
        </li>
        <li>
          <b>Select Actions:</b> The player last in turn order must select
          Production if it has not been chosen yet.
        </li>
        <li>
          <b>Goods growth:</b> skipped. The only way cubes reach the map is the
          Production action.
        </li>
        <li>
          <b>Production:</b> when selecting this action you immediately select
          one of the columns in the goods display that still has cubes in it.
          You select one of the cubes from that column to move to the Starting
          City of that column; the other cube in the column moves to its
          matching New City. If the New City has not been placed yet, put the
          cube on top of the New City; it will be available for delivery when it
          is urbanized.
        </li>
        <li>
          <b>Tourist Trap:</b> a new special action. Immediately, every other
          player gives you $1. You receive nothing from players who have no cash
          on hand.
        </li>
        <li>
          <b>Locomotive (3 players only):</b> instead of a permanent increase,
          your engine level is temporarily plus one during the Move Goods phase.
          In a 4 or 5 player game, locomotive works normally.
        </li>
        <li>
          <b>Track building:</b> plains cost $2, mountains cost $4, and water
          hexes cost $6. Initially placing a complex track costs $3 over the
          base price of the terrain. In a three player game, players may build
          up to 4 track and the Engineer special action is not available.
        </li>
      </ul>
    </div>
  );
}
