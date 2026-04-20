export function NorthernCaliforniaRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Bridges:</b> An inter-city connection between San Francisco and
          Oakland can be built for $10. If Hayward and Foster City are both
          urbanized, an inter-city connection between them can be built for $6.
        </li>
        <li>
          <b>Santa Cruz port:</b> Santa Cruz starts with 2 cubes on the city and
          a queue of 10 &ldquo;ship&rdquo; cubes drawn from the bag. When a
          delivery empties the Santa Cruz&apos;s cubes, the next ship cube from
          the queue moves onto the city (replacing the depleted supply).
          Effectively only the closest ship cube may be shipped at any time and
          only after the initial 2 cubes on the city has been delivered.
        </li>
        <li>
          <b>Sacramento:</b> The &ldquo;to Sacramento&rdquo; city accepts cubes
          of the color of the most recent ship cube in the Santa Cruz ship queue
          that has been moved into Santa Cruz. Sacramento starts by accepting
          the color of the first cube in the queue even before it has been moved
          into Santa Cruz. In this implementation, the color of Sacramento will
          be automatically updated. Once Santa Cruz is empty of cubes and the
          queue is empty, Sacramento will accept no cubes.
        </li>
        <li>
          <b>San Jose:</b> unlike many other maps, the three adjacent San Jose
          hexes are not treated as a single city. However, a cube may be moved
          from one San Jose hex to another without using track and without this
          movement contributing to your loco limit. As a result, a red cube may
          be moved from one San Jose hex to another for a 0-delivery move.
          Similarly, a red cube can move out of San Jose, through a network, and
          ultimately be delivered to a different San Jose hex. Non-red cubes can
          move from one San Jose hex to another before continuing their delivery
          out of San Jose.
        </li>
        <li>
          <b>New cities:</b> The &ldquo;A&rdquo; (red) new city is removed from
          the game.
        </li>
      </ul>
    </div>
  );
}
