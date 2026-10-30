export function MadagascarRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Bad special actions:</b> all of the actions are worse versions of
          the base game (Last move, last build, etc.).
        </li>
        <li>
          <b>Disabled actions:</b> each round, actions are randomly disabled so
          that only (number of players + 1) remain available to choose from.
        </li>
        <li>
          <b>Hills (brown hexes):</b> cost $3.
        </li>
      </ul>
    </div>
  );
}
