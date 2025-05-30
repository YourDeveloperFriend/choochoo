export function HeavyCardboardRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Heavy Cardboard</b>: is a large city that takes up 7 spaces. It
          starts with one of each cube, and if it is ever empty at the start of
          the Goods Growth phase, it will refill again with one of each cube.
        </li>
        <li>
          <b>Madeira</b>: is surrounded by ferries, which can only be claimed
          once the corresponding city has been urbanized, or if you have built a
          track on that town. Madeira accepts both red and blue goods.
        </li>
        <li>
          <b>Production</b>: is not available.
        </li>
        <li>
          <b>Heavy Lifting</b>: is a new action that lets you transport a good
          as one of your move actions. The good is transported over open terrain
          (not track), blocked by cities and track, to a city up to 6 spaces
          away. Mountain spaces count as 2 spaces for this movement. Moving a
          good this way is worth 2 income in turn 1, and increases by 1 for each
          turn to a maximum of 6. You must have built a complete link attached
          to the good you want to move.
        </li>
      </ul>
    </div>
  );
}
