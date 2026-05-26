export function CentralNewEnglandRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Action Selection:</b> Immediately following action selection, add
          $1 per player to each action that isn&apos;t chosen (for example, if
          playing with 6 players add $6 to each unused action space). The player
          to choose that action on a subsequent turn receives all the money on
          that action.
        </li>
        <li>
          <b>Building</b>: On every odd-numbered round, all track costs $1
          extra, and each delivery results in $1 income extra for the player who
          owns the link used last (adjacent to the recipient city).
        </li>
        <li>
          <b>Anti-competition:</b> Direct track links may not be duplicated;
          track between any two cities, two towns, or a city and a town may not
          be built if a track between the two already exists. An urbanization is
          also disallowed if it results in duplicate links between two
          locations.
        </li>
        <li>
          <b>Anti-Revenue Sharing:</b> Players must use only their own links to
          deliver goods.
        </li>
        <li>
          <b>Crossing State Lines:</b> Track may be built so that links cross
          state lines. Deliveries must originate in one state and be delivered
          to a city in the other state, unless the player has the Smuggle action
          (below).
        </li>
        <li>
          <b>Smuggle:</b> There is a new Smuggle special action. The player with
          this action may make both deliveries within the same state.
        </li>
        <li>
          <b>Production &amp; Goods Growth:</b> No goods are placed on the goods
          growth chart during set up. During the Goods Growth phase, the player
          with the Production action draws two cubes from the bag and places
          them on any city.
        </li>
        <li>
          <b>7 &amp; 8 players:</b> the game is 6 turns long (the same as for 6
          players).
        </li>
      </ul>
    </div>
  );
}
