export function MinasGeraesRules() {
  return (
    <div>
      <h1>Setup</h1>
      <p>
        The 2 hex sized city in the middle of the map is Ouro Preto (OP), the
        capital of the state. It&apos;s a colorless city that counts as a stop
        and provides cubes, but will never accept cubes as a final destination.
      </p>
      <p>
        In this map black cities are mines and start with yellow cubes (gold).
        Each non-black city starts with 2 random non-yellow cubes; their goods
        growth chart are also set up with non-yellow cubes. Black cities start
        with 2 yellow cubes and their goods growth chart starts with 2 random
        cubes, but can include yellow cubes. The goods growth chart for the new,
        non-black cities are also setup without yellow cubes while the goods
        growth chart for new black cities are setup with random cubes that can
        include yellow. Ouro Preto starts with a number of cubes equal to the
        number of players; this can also include yellow cubes.
      </p>
      <p>
        $1 is placed in the following action spaces: Locomotive, Urbanization
        and Goldsmith. Each player starts at 2 on the mining expertise track.
      </p>

      <h1>Mining expertise</h1>
      <p>
        All players start with 2 points on the mining expertise track. When you
        deliver a black cube, it abstractly represents you gaining expertise on
        the mining business. Each black cube delivered will give you 1 point on
        the mining expertise track. Players can use points from this track in 2
        ways: you must spend a point to deliver each gold cube or you can spend
        a point to obtain $1 at any moment on your turn. Leftover points on this
        track are also a tiebreaker at the end of the game.
      </p>

      <h1>Action Selection</h1>
      <p>
        If there are no coins on an action space selected by a player, simply
        add a coin from the bank to the action chosen. Whenever a player selects
        an action with at least 1 coin, the player pays $1 to the bank for each
        coin on the action and adds $1 from the bank to the action for future
        turns. At the end of the action selection phase, actions not taken in
        each turn will clear any coins on that action space.
      </p>
      <h1>New or Modified Actions</h1>
      <p>
        <b>Goldsmith:</b> Immediately when this action is chosen, the player
        must select either a) you deliver gold this turn without spending mining
        expertise or b) increase income of yellow cubes by another $1 on both
        deliveries, making gold deliveries +2 income for the player this turn.
      </p>
      <p>
        <b>Urbanization:</b> Provided there are gold cubes in the bag, new black
        cities start with 1 gold cube. New black cities can only be placed in
        mine towns (black circle towns). New non black cities will go on the
        regular, white circle towns, except the new yellow city. The new yellow
        city can only be urbanized on top of a non-black, non-yellow, single hex
        city. Cubes on the city replaced stay on the new yellow city; the cubes
        on the growth chart of the city replaced are removed from the game.
      </p>
      <p>
        <b>Production:</b> Only black cities can receive gold on the goods
        growth chart. If a player draws a gold cube and does not want it, he is
        allowed to redraw.
      </p>

      <h1>Building Phase</h1>
      <p>
        Building costs are $2 for plains, $3 for rivers and $5 for mountains.
        The two lakes are impassable.
      </p>

      <h1>Moving Cubes</h1>
      <p>
        Gold cubes have bonus +1 income. To deliver each gold cube, you must
        spend a point in the mining expertise track. If you don&apos;t have any
        mining expertise points left, you can’t deliver gold, unless you took
        the goldsmith special action and chose option a) to deliver gold without
        paying mining expertise.
      </p>

      <h1>Goods Growth</h1>
      <p>
        Just before the goods growth phase, 1 cube is returned from OP back to
        the bag. OP preferentially will consume a gold cube from it, if
        available; otherwise, remove from OP the rarest type of good in the
        whole map. If tied, remove a random cube from OP among the rarest. Only
        black cities or OP can have gold cubes. In the goods growth phase, when
        OP is empty of cubes, draw X cubes (X = number of players) and then add
        $1 to OP. Picking up a cube from OP or moving a cube through OP costs
        the value of coins on it.
      </p>

      <h1>End Game</h1>
      <p>
        The game is 1 turn shorter than usual. If players are tied for highest
        score, whoever has most points on the mining expertise track wins.
        Otherwise, they share victory as usual.
      </p>
    </div>
  );
}
