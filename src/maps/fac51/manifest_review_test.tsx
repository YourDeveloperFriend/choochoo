import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Fac51ManifestReview } from "./manifest_review";

it("shows the existing, incremental and total penalties when multiple cities are skipped", () => {
  const markup = renderToStaticMarkup(
    <Fac51ManifestReview currentLevel={2} skipped={2} />,
  );
  expect(markup).toContain("2 cities");
  expect(markup).toContain("Level 2/6 · −3 points");
  expect(markup).toContain("<td>−7 points</td>");
  expect(markup).toContain("Level 4/6 · −10 points");
});

it("shows the sixth-level maximum and final additional penalty", () => {
  const markup = renderToStaticMarkup(
    <Fac51ManifestReview currentLevel={5} skipped={1} />,
  );
  expect(markup).toContain("1 city");
  expect(markup).toContain("Level 5/6 · −15 points");
  expect(markup).toContain("<td>−6 points</td>");
  expect(markup).toContain("Level 6/6 · −21 points");
});

it("does not imply a charge when no eligible city is skipped", () => {
  const markup = renderToStaticMarkup(
    <Fac51ManifestReview currentLevel={3} skipped={0} />,
  );
  expect(markup).toContain("does not increase your Manifest");
  expect(markup).toContain("<td>−0 points</td>");
  expect(markup).toContain("Level 3/6 · −6 points");
});
