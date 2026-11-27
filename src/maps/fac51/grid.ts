import { SpaceData } from "../../engine/state/space";
import { city, PLAIN, startsLowerGrid, town, UNPASSABLE } from "../factory";

// Delivery spaces use city endpoints so track can connect but cannot be built on them.
function delivery(name: string): SpaceData {
  return { ...city(name, [], undefined, 0), mapSpecific: { delivery: true } };
}

const P = PLAIN;
const X = UNPASSABLE;

// Imported from fac51.svg. Printed rows run bottom to top; display counter-clockwise.
// Unlabelled assembly stations and cranes receive identifiers for move selection and logs.
export const map = startsLowerGrid<SpaceData>([
  [
    X,
    X,
    X,
    delivery("Deliveries 1"),
    P,
    X,
    X,
    X,
    X,
    P,
    delivery("Deliveries 2"),
  ],
  [X, X, X, P, P, P, P, town("Crane 1"), P, P, P, P],
  [X, X, X, P, P, P, P, P, P, P, P],
  [
    X,
    X,
    X,
    P,
    P,
    city("Station 2", [], undefined, 0),
    P,
    P,
    P,
    city("Station 1", [], undefined, 0),
    P,
    P,
  ],
  [X, X, town("Crane 3"), P, P, P, P, P, P, P, P, town("Crane 2")],
  [X, X, P, P, P, P, town("Crane 5"), P, town("Crane 4"), P, P, P, P],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [
    delivery("Deliveries 4"),
    P,
    P,
    city("Station 5", [], undefined, 0),
    P,
    town("Crane 7"),
    P,
    city("Station 3", [], undefined, 0),
    P,
    town("Crane 6"),
    P,
    city("Station 4", [], undefined, 0),
    P,
    P,
    delivery("Deliveries 3"),
  ],
  [P, P, P, P, P, P, P, P, P, P, P, P, P, P],
  [X, X, P, P, P, P, town("Crane 8"), P, town("Crane 9"), P, P, P, P],
  [X, X, town("Crane 11"), P, P, P, P, P, P, P, P, town("Crane 10")],
  [
    X,
    X,
    X,
    P,
    P,
    city("Station 7", [], undefined, 0),
    P,
    P,
    P,
    city("Station 6", [], undefined, 0),
    P,
    P,
  ],
  [X, X, X, P, P, P, P, P, P, P, P],
  [X, X, X, P, P, P, P, town("Crane 12"), P, P, P, P],
  [
    X,
    X,
    X,
    delivery("Deliveries 6"),
    P,
    X,
    X,
    X,
    X,
    P,
    delivery("Deliveries 5"),
  ],
]);
