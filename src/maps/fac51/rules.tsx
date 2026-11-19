import * as styles from "./factory.module.css";

export function Fac51Rules() {
  return (
    <div className={styles.rulesClipboard}>
      <div className={styles.rulesSheetHeader}>
        <div>
          <span className={styles.rulesSheetCode}>FAC51</span>
          <strong className={styles.rulesSheetTitle}>Factory rule sheet</strong>
        </div>
        <a href="https://www.ageofsteamuk.com" aria-label="Age of Steam UK">
          <img
            className={styles.rulesLogo}
            src="/static/fac51-aosuk.jpg"
            alt="Age of Steam UK"
            width="908"
            height="627"
          />
        </a>
      </div>
      <p>
        This map plays over seven rounds using base Age of Steam rules with the
        following changes:
      </p>
      <ul>
        <li>
          The six Deliveries spaces around the outside are unbuildable supply
          endpoints. Each holds a reusable colour marker (cube): one of each of
          the five colours plus one random duplicate, randomly distributed at
          setup.
        </li>
        <li>All assembly stations (Cities) start empty and have no colour.</li>
        <li>All cranes (towns) act as per base game rules</li>
        <li>
          The round marker blocks one action each round moving from left to
          right starting with First Move, and ending, in the final round, with
          Turn Order.
        </li>
      </ul>
      <h4>Building</h4>
      <ul>
        <li>Track has a £3 terrain base, plus normal complex-track charges.</li>
        <li>Towns cost £1 plus £1 per exit. Base upgrade costs apply.</li>
        <li>Urbanised cities are colourless and start empty.</li>
      </ul>
      <h4>Delivering</h4>
      <ul>
        <li>
          Every delivery must start at a Deliveries marker hex. A matching cube
          from the supply travels along connected links; the marker is not
          removed and multiple deliveries can be made from each delivery hex.
          Moved cubes stay in place at the destination city and cannot become
          another delivery.
        </li>
        <li>
          A cube must stop at the first assembly station missing its colour.
          Stations already holding that colour must be passed through. Each
          station or town counts as a link, and normal locomotive limits and
          link-owner income apply.
        </li>
        <li>
          You may skip a city missing that colour by advancing one level on your
          Manifest chart for each such station. The six penalties are −1, −3,
          −6, −10, −15, and −21 points. You may never exceed six skips in the
          game. Choosing a route through an eligible station automatically
          records the skip.
        </li>
        <li>
          Delivered cubes remain at the destination. A station can never hold
          duplicate colours. After income is paid for the fifth different
          colour, clear the station immediately.
        </li>
      </ul>
      <h4>Goods growth/Production</h4>
      <ul>
        <li>
          There is no goods growth or dice rolling. The production action
          optionally replaces one of the two duplicated delivery markers with
          any different colour. After that, all six markers rotate one space
          clockwise, every round, even if nobody selected Production.
        </li>
        <li>
          After round seven, use normal scoring and subtract each player’s
          current Manifest penalty from final total
        </li>
      </ul>
    </div>
  );
}
