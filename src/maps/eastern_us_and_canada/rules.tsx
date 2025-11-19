export function EasternUsAndCanadaRules() {
  return (
    <div>
      <ul>
        <li>Each player starts with a single share issued and $5.</li>
        <li>
          The usual goods growth display is not used. Instead, a single cube is
          drawn and added to Pittsburgh during each Goods Growth phase.
        </li>
        <li>
          <b>Engineer:</b> is not available as a special action.
        </li>
        <li>
          <b>Marketing:</b> is a new special action which allows the player to
          pass through a single city matching the color of the goods cube on
          each of the player&apos;s deliveries.
        </li>
        <li>
          <b>Production:</b> instead of the usual behavior, the player selecting
          this action immediately draws two cubes from the bag. The player must
          then place them on two different cities.
        </li>
        <li>
          <b>Urbanization:</b> after a town is urbanized, two cubes are drawn
          from the bag and placed on the new city. If the new city is
          immediately adjacent to other cities and there was already track
          connecting the town to the city, this track is replaced with an
          intercity connection between the new city and the adjacent city.
        </li>
        <li>
          <p>
            <b>Building:</b> Railroads must start in one of the 12 eastern
            cities: Quebec, Boston, New Haven, New York, Trenton, Philadelphia,
            Baltimore, Washington, Richmond, Wilmington, Charleston, and
            Savannah. Until at least one railroad reaches Pittsburgh, Wheeling,
            or Toronto, all players must have continuous tracks.
          </p>
          <p>
            On the players&apos; first turn, they may place one railroad track.
            On the second turn, they may place between one and two, on the third
            between one and three, and so on until the eighth turn. On the
            eighth to tenth turns, players may place up to eight railroad tracks
            on their turn.
          </p>
        </li>
        <li>
          Interurban connections can be built between adjacent cities for $2.
          Other players are welcome to build the same InterUrban track. It also
          costs $2 plus an additional $1 for each track that already exists
          between the two cities.
        </li>
        <li>
          The terrain and rivers on town hexes does not impact their cost; it is
          just aesthetic. The <i>dismal swamp</i> hex south of Chesapeake can be
          built on and is treated as a river hex.
        </li>
      </ul>
    </div>
  );
}
