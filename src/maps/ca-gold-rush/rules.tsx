export function CaliforniaGoldRushRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> 20 of the mountain hexes will start with Gold (yellow
          cubes) placed on them. The yellow new city is removed from the game.
        </li>
        <li>
          <b>Building Track to Gold and Mining Gold:</b> To access the Gold
          cubes, track (partial or completed) must be built on the hex that
          contains a Gold cube, and on the player&apos;s turn who owns the
          track, they may mine (pick up) a Gold cube instead of making another
          goods delivery/bumping their locomotive. Click on a yellow cube during
          the move phase to do this.
        </li>
        <li>
          <b>Scoring:</b> Each Gold cube that is mined does not contribute to
          income, but is worth 15 points at the end of the game.
        </li>
      </ul>
    </div>
  );
}
