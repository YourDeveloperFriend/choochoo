export function ChicagoSpeakeasyRules() {
  return (
    <div>
      <ul>
        <li>
          <p>
            <b>Setup:</b> Black New City tiles are not used. Black goods are
            removed from the bag. 3 dice are rolled for white numbered Cities
            and 3 dice for black numbered Cities. 1 black good is added to each
            corresponding City on the map. If a number is rolled multiple times,
            the die is rerolled. The maximum number of black goods per City
            during setup is 1.
          </p>
          <p>
            All cities are then filled with random goods from the bag until each
            contains a total of 3 goods (including the black goods already
            placed).
          </p>
        </li>
        <li>
          <p>
            <b>Move Goods:</b> Goods cannot be delivered to a City with any
            black goods. Goods cannot pass through the Bureau of Prohibition.
          </p>
          <p>
            Goods may start on or pass through Cities containing a black good by
            paying a $1 bribe to the bank for each black good in the starting
            City and in Cities along the route.
          </p>
          <p>
            Black goods may only be delivered to the Bureau of Prohibition;
            these deliveries receive 1 less income. If multiple players&apos;
            links are used for deliveries to the Bureau of Prohibition, then the
            active player receives the reduced income. No bribes are paid for
            delivering black goods. Return delivered black goods to the black
            good supply.
          </p>
        </li>
        <li>
          <p>
            <b>Bump Off an Agent:</b> This map adds a new &quot;Bump Off an
            Agent&quot; special action. This allows the player to remove 1 black
            good from the map and return it to the supply before 1 of their
            deliveries.
          </p>
          <p>
            To use this action, select a black cube as if you were starting a
            delivery with it, and then press the Bump Off an Agent button.
          </p>
        </li>
        <li>
          <b>Goods Growth:</b> After the normal Goods Growth phase, 1 additional
          die is rolled for the white Cities and 1 die for the black Cities. 1
          black good is added to each corresponding City and New City on the
          map. There may be more than 1 black good on a City as a result of
          Goods Growth.
        </li>
      </ul>
    </div>
  );
}
