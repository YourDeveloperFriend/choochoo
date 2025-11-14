export function BelgiumRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          The game lasts 8 turns. The first player is decided randomly on the
          first round and switches on each subsequent round. There is no turn
          order auction phase.
        </li>
        <li>
          <b>Engineer:</b> The Engineer action allows the player to place town
          tiles as part of their track build, but they still may only build
          three tiles total. Even though no towns are shown on the Belgium map,
          every hex may hold a town tile. Note that only town tiles (towns with
          an odd number of exits) may be built.
        </li>
        <li>
          <b>Urbanization:</b> The Urbanization action allows a player to place
          a New City tile on an existing City hex or to replace an existing New
          City tile. When a City or New City is eliminated by this process, the
          Goods cubes already on the hex are retained and placed onto the newly
          placed New City tile. All Good cubes on the Goods Display for the
          eliminated City/New City are returned to the bag. If a New City tile
          was eliminated, it is removed from the game. Additionally, the player
          placing the New City may only build two Track tiles this turn. New
          City tiles may not be placed on town tiles.
        </li>
      </ul>
    </div>
  );
}
