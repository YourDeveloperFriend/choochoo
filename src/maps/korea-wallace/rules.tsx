export function KoreaWallaceRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Inter-city connections:</b> can be claimed for one of your builds,
          costing $2.
        </li>
        <li>
          <b>Hills and Mountains:</b> cost $3.
        </li>
        <li>
          <b>Urbanize:</b> automatically pulls in the two cubes from the Goods
          Growth chart when placed. Then, two new cubes are pulled from the bag
          and placed on the Goods Growth chart for the city.
        </li>
        <li>
          <b>Cities:</b> are colorless. Instead, goods must be delivered to a
          city that has a cube of the same color.
        </li>
        <li>
          <b>Goods:</b> cannot move through a city that has a good of the same
          color.
        </li>
      </ul>
    </div>
  );
}
