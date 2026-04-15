export function JapanRules() {
  return (
    <div>
      <p>
        Building:
        <ul>
          <li>
            Track may be built on the bay south-east of Tokyo; this hex is
            treated as a regular river hex ($3).
          </li>
          <li>
            Track may be built on blue water hexes. A simple, straight, or
            gentle curve may be used for building. The track must connect to
            land at both ends. No complex track or tight curves may be used.
            Cost for building on a water hex is $6. (Building across water
            indicates a bridge, tunnel, or ferry connection.)
          </li>
          <li>
            Half Water/Half land hexes: These hexes are subject to special
            rules. If the track is built so that it occupies only the land half
            of the hex, it is treated as a land hex with a river (for a cost of
            $3). If the track is built so that it crosses the water portion of
            the hex, it is considered a water hex and subject to all rules above
            (for a cost of $6). A complex tile may be placed in a half-and-half
            hex if one route is a land route and the other is a water route.
            Upgrading to a complex tile in order to add a land route costs $3
            and a water route costs $6. Rerouting track or direct build of
            complex track on the half-and-half hexes is not allowed.
          </li>
        </ul>
      </p>
      <p>
        Locomotive (Bullet Trains): Locomotive special action is modified as
        follows. Locomotive now only allows a <i>temporary</i> increase in
        Engine level. Do not advance the player’s token on the Engine Track when
        selecting Locomotive. A player who selects Locomotive may ship good
        cubes one additional link over their current engine link level for both
        shipments of this turn. They do not have to pay additional expenses for
        this temporary link. Locomotive player may still forego a shipment in
        order to permanently upgrade their Engine level. This action allows
        shipping up to 7 links, subject to all other normal shipping rules.
      </p>
      <p>
        Urbanization: When placing a city tile using this special action, it
        counts as one of your 3 allowed tile builds for this turn. You may
        build/upgrade 2 regular tiles and urbanize a town or elect to not use
        the special action and build/upgrade 3 regular tiles.
      </p>
    </div>
  );
}
