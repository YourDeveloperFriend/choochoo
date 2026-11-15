export function MauiRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> there are 18 shares worth $8 each, so players start the
          game with $16. New City A (the red urbanization) is removed from the
          game. Each remaining New City tile starts with 2 cubes on it, which
          are available for delivery as soon as it is urbanized. ʻĪao Valley and
          Haleakalā start with no cubes, every other city starts with 2 cubes,
          and every town starts with 1 cube. A cube is placed above spots 2, 3,
          and 4 of the turn track.
        </li>
        <li>
          <b>Track building:</b> beaches cost $13, plains $4, forests $5, and
          mountains $6. Towns cost $2 per exit (initial placement or upgrade),
          and a player may only build a maximum of two exits per town per turn.
        </li>
        <li>
          The five hexes with a written price cannot initially have complex
          track placed on them. The hexes between ʻĪao Valley and Wailuku and
          between Wailuku and Kahului cost the higher amount ($12/$14) if you
          build a straight track connecting the two cities; otherwise any tight
          or gentle curve is the lower amount ($7/$8). The other three next to
          Kahului cost $8.
        </li>
        <li>
          <b>Turns 1-2:</b> during your build, you may only build into or out of
          each city once per turn.
        </li>
        <li>
          <b>Urbanization:</b> urbanization must be done first during the build
          phase. It is enforced that no track has been built yet this turn.
        </li>
        <li>
          <b>Move goods:</b> Hāna accepts deliveries of the colors of the cubes
          currently in its hex. Cubes in Hāna may be moved out like in any other
          city. When making a delivery of five or six links to Hāna, the active
          player receives an additional two income.
        </li>
        <li>
          <b>Turns 3+:</b> every delivery must use at least one link which you
          do not own.
        </li>
        <li>
          <b>Special actions:</b> Production is not available. Engineer is
          replaced by two new actions:
          <ul>
            <li>
              <b>Coastal Engineer:</b> build up to four track, or build up to
              three track and beaches only cost $3. If you build a fourth track,
              you pay full price for the beaches you built.
            </li>
            <li>
              <b>National Parkway Engineer:</b> build up to four track.
              Mountains only cost $4.
            </li>
          </ul>
        </li>
        <li>
          <b>Goods growth:</b> draw one cube from the bag and place it in ʻĪao
          Valley and in Haleakalā. Roll one fewer die than the number of
          players. On turns 2, 3, and 4, place the cube above the current turn
          on the turn track into Hāna.
        </li>
        <li>
          <b>Final scoring:</b> income is worth +2VP each and shares are worth
          -2VP each, so multiply (income minus shares) times 2 instead of 3.
          Count track as normal.
        </li>
      </ul>
    </div>
  );
}
