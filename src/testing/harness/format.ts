import { GameSnapshot, SpaceSnapshot } from "./snapshot";

function pad(value: string, width: number): string {
  return value.length >= width
    ? value
    : value + " ".repeat(width - value.length);
}

function formatSpace(space: SpaceSnapshot): string {
  const parts: string[] = [pad(space.label, 5), pad(space.kind, 5)];
  parts.push(pad(space.name ?? "", 18));
  const detail: string[] = [];
  if (space.urbanized) detail.push("urbanized");
  if (space.goods != null && space.goods.length > 0) {
    detail.push(`goods=${space.goods.join(",")}`);
  }
  if (space.onRoll != null && space.onRoll.length > 0) {
    detail.push(`onRoll=${space.onRoll.join(",")}`);
  }
  if (space.track != null && space.track.length > 0) {
    detail.push(`track=${space.track.join(" ")}`);
  }
  return (parts.join(" ") + " " + detail.join(" ")).trimEnd();
}

/**
 * Renders a snapshot as stable, readable text.
 *
 * This is the form used for corpus transcripts, so it is optimised for `git diff`
 * legibility: one fact per line, fixed column widths, no JSON punctuation.
 */
export function formatSnapshot(snapshot: GameSnapshot): string {
  const lines: string[] = [];

  lines.push(
    `round=${snapshot.round ?? "-"} phase=${snapshot.phase ?? "-"} current=${snapshot.currentPlayer ?? "-"}`,
  );
  if (snapshot.turnOrder.length > 0) {
    lines.push(`turnOrder=${snapshot.turnOrder.join(",")}`);
  }

  lines.push("players:");
  for (const player of snapshot.players) {
    const flags: string[] = [];
    if (player.selectedAction != null)
      flags.push(`action=${player.selectedAction}`);
    if (player.outOfGame) flags.push("OUT");
    lines.push(
      "  " +
        [
          pad(player.color, 7),
          pad(`$${player.money}`, 5),
          pad(`income=${player.income}`, 10),
          pad(`shares=${player.shares}`, 9),
          pad(`loco=${player.locomotive}`, 7),
          pad(`track=${player.trackMarkers}`, 9),
          pad(`score=${player.score}`, 12),
          flags.join(" "),
        ]
          .join(" ")
          .trimEnd(),
    );
  }

  lines.push("board:");
  for (const space of snapshot.spaces) {
    lines.push("  " + formatSpace(space));
  }

  const bagEntries = Object.entries(snapshot.bag);
  if (bagEntries.length > 0) {
    lines.push(
      "bag: " + bagEntries.map(([good, count]) => `${good}=${count}`).join(" "),
    );
  }

  return lines.join("\n");
}
