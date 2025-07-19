export function PolandRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> Warsaw, Wrocław, and Gdańsk starts with 3 goods.
        </li>
        <li>
          <b>Build tracks:</b> The dark mountain hexes at the bottom of the map
          cost $6. The swampy water hexes at the upper right of the map cost $4.
          If a Town has no Track and a player builds Track into that Town, that
          player’s Railroad’s income immediately increases by $1.
        </li>
        <li>
          <b>Production Action:</b> . The player choosing the Production action
          may pull a Goods cube from the bag and place it in any Town.
        </li>
        <li>
          <b>Goods Growth</b> Before the die rolls, if a Black cube is in the
          bag it will be placed in Warsaw.
        </li>
      </ul>
    </div>
  );
}
