export function MexicoRules() {
  return (
    <div>
      <p>
        State versus Cartel. One player plays the role of the State, the other
        player plays the role of the Cartel.
      </p>
      <p>
        Other than the differences listed here, all rules of the base game still
        apply.
      </p>
      <h1>Setup</h1>
      <ul>
        <li>One player plays as the State; the other, the Cartel.</li>
        <li>Remove the 16 black goods and 20 red goods from the bag.</li>
        <li>
          Remove 4 red goods from the game (put them in the box), leaving 16.
        </li>
        <li>Place 1 black good in each blue city.</li>
        <li>Place 1 red good in each yellow city.</li>
        <li>
          Fill the Starting Cities and the first row of New Cities in the Goods
          Display with random yellow goods, blue goods, and purple goods from
          the bag. Leave the second row of New Cities empty.
        </li>
        <li>
          Put the rest of the yellow, blue, and purple from the bag on the map
          so each city has 2 goods:
          <ul>
            <li>Mexico City has 2 random yellow/blue/purple.</li>
            <li>Each purple city has 2 random yellow/blue/purple.</li>
            <li>Each blue city has 1 black and 1 random y/b/p.</li>
            <li>Each yellow city has 1 red and 1 random y/b/p.</li>
          </ul>
        </li>
        <li>
          Put the remaining 11 black goods and 11 red goods in the now-empty
          bag.
        </li>
        <li>
          Cover the following Special Actions with face-down track tiles:
          Production, Turn Order. They cannot be selected.
        </li>
      </ul>
      <h1>Winning the Game</h1>
      <p>
        Each player has their own goal:
        <ul>
          <li>The State must remove all black goods from the map.</li>
          <li>The Cartel must remove all red goods from the map.</li>
        </ul>
      </p>
      <p>
        If neither of you succeeds, you both lose. If only one of you succeeds,
        that player wins. If both of you succeed, the player with more victory
        points wins.
      </p>
      <h1>Play</h1>
      <p>The game lasts 9 rounds.</p>
      <h1>Player Order</h1>
      <p>
        In addition to the 2 unavailable Special Actions covered with face-down
        track tiles, randomly select 2 other Special Actions to be unavailable
        for this round. Cover them with face-up track tiles.
      </p>
      <p>
        As usual, the first player to drop out of the bidding takes the last
        player space on the Player Order track and pays nothing.
      </p>
      <p>
        If the State player wins the auction, they pay 100% of the winning bid.
        If the Cartel player wins the auction, they pay 50% of the winning bid,
        rounded down.
      </p>
      <h1>Build Track</h1>
      <p>The State can build 0-3 track; the Cartel can build 0-2.</p>
      <h1>Building Costs</h1>
      <ul>
        <li>Building simple track in the plains (white): $2.</li>
        <li>Building simple track in the mountains (brown): $3.</li>
      </ul>
      <h1>Special Action: Engineer</h1>
      <p>
        As usual, you can build +1 track. That means State can build 0-4; Cartel
        can build 0-3.
      </p>
      <h1>Special Action: Urbanization</h1>
      <p>
        The State cannot urbanize the red New City; the Cartel cannot urbanize
        the black New City.
      </p>
      <h1>Move Goods</h1>
      <p>
        The State cannot move red goods; the Cartel cannot move black goods. As
        usual, delivered goods return to the bag!
      </p>
      <h1>Goods Growth</h1>
      <p>Skip this phase in Round 9.</p>
      <h1>Special Action: Production (automatic)</h1>
      <p>
        Although the Production special action is not available for selection,
        it triggers automatically for the Cartel, but does nothing for the
        State:
      </p>
      <p>
        The Cartel may (it&apos;s optional) draw 2 goods from the bag, place 1
        of them on a city, then return the other to the bag.
      </p>
      <p>
        Note: If the Cartel chooses to draw 2 goods from the bag, they must
        place 1 of them.
      </p>
      <h1>Advance Turn Marker</h1>
      <p>
        Remove the 2 face-up track tiles from the Special Actions they are
        covering.
      </p>
      <h1>End of the Game</h1>
      <ul>
        <li>
          If both red goods and black goods remain on the map, both players have
          lost.
        </li>
        <li>
          If red goods, but no black goods remain on the map, the State has won.
        </li>
        <li>
          If black goods, but no red goods remain on the map, the Cartel has
          won.
        </li>
        <li>
          If neither red goods nor black goods remain on the map, use the base
          game victory point computations to see who won.
        </li>
      </ul>
    </div>
  );
}
