export function HollandRules() {
  return (
    <div>
      <h1>Setup</h1>
      <p>
        The yellow new city is not available. In a three player game, one of
        Urbanization and Engineer starts as unavailable. Which of these two
        actions is unavailable switches at the beginning of each round.
      </p>
      <h1>Building</h1>
      <p>
        The bluish-green hexes are polder spaces, which cannot be built on at
        the start of the game. These spaces become available to build on
        starting in round 5 of a three player game, and round 4 of a four player
        game. The base price to build on polder spaces is $3.
      </p>
      <h1>2015 Windmill Variant</h1>
      <p>
        In the 2015 windmill variant, the five windmill spaces have a random
        cube placed on them at the beginning of the game. These spaces have a $5
        base cost to build on. Once track has ben built on the space, the cube
        can be delivered over that track.
      </p>
    </div>
  );
}
