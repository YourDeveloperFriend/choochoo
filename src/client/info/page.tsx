import { Container, Header } from "semantic-ui-react";

export function InfoPage() {
  return (
    <Container>
      <Header as="h1">Rule Clarifications</Header>
      <p>
        Unless specified by map-specific rules, these are rules that apply by
        default. Whether or not this is consistent with rules written elsewhere,
        this is an explanation of the rules as has been implemented here.
      </p>
      <ul>
        <li>
          <b>Towns:</b> Unless indicated otherwise by map-specific rules, the
          cost to build on town hexes is not impacted by the terrain of the hex
          nor the presence of a river; both of these are strictly aesthetic.
        </li>
        <li>
          <b>Urbanization:</b> Urbanization can be performed at any time during
          the build phase. This is technically not consistent with rules as
          written, but almost never matters and greatly simplifies things. Some
          maps where this is more likely to matter have a different behavior and
          this is indicated in the map-specific rules.
        </li>
        <li>
          <b>Income Reduction:</b> Income reduction maxes out at -10 and starts
          at 50 income.
        </li>
      </ul>
    </Container>
  );
}
