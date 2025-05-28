export function ScandinaviaRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Sea Routes:</b> can be claimed for $6 and counts as a build. They
          can only be claimed if both ends have a city (i.e. have been
          urbanized).
        </li>
        <li>
          <b>Game ends:</b> one turn earlier.
        </li>
        <li>
          <b>Ferry action:</b> lets you teleport one good from one coastal city
          to another coastal city. You can do it from one of the two deliveries
          and it can only teleport once. It does not use a locomotive step and
          it produces no income. The teleport is represented visually by
          highlighting the two cities involved.
        </li>
      </ul>
    </div>
  );
}
