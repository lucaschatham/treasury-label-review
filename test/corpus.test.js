import test from "node:test";
import assert from "node:assert/strict";
import { buildCorpus } from "../scripts/lib/corpus.js";

test("corpus separates design families before tuning and covers each beverage", () => {
  const corpus = buildCorpus();
  const base = corpus.labels.filter((x) => x.variant === "valid");
  assert.equal(base.length, 30);
  for (const beverage of ["spirits", "wine", "beer"]) {
    assert.equal(base.filter((x) => x.beverage === beverage).length, 10);
  }
  for (const design of new Set(corpus.labels.map((x) => x.design))) {
    assert.equal(
      new Set(
        corpus.labels.filter((x) => x.design === design).map((x) => x.split),
      ).size,
      1,
    );
  }
  assert.equal(base.filter((x) => x.split === "holdout").length, 15);
  for (const variant of [
    "brand",
    "abv",
    "volume",
    "warning-word",
    "warning-case",
    "warning-weight",
    "missing-warning",
    "blur",
    "glare",
  ]) {
    assert.ok(
      corpus.labels.some((x) => x.variant === variant),
      variant,
    );
  }
});

test("typography includes matched bold/regular pairs with no family crossing splits", () => {
  const { typography } = buildCorpus();
  assert.equal(typography.length, 40);
  for (const font of new Set(typography.map((x) => x.family))) {
    const cases = typography.filter((x) => x.family === font);
    assert.equal(new Set(cases.map((x) => x.split)).size, 1);
    for (const size of [24, 32, 40, 48]) {
      assert.deepEqual(
        cases
          .filter((x) => x.size === size)
          .map((x) => x.expected)
          .sort(),
        ["bold", "not_bold"],
      );
    }
  }
});

test("ground truth records actual altered artwork independently of submitted values", () => {
  const { labels } = buildCorpus();
  for (const label of labels) {
    if (label.variant === "brand")
      assert.notEqual(label.observed.brand, label.application.brand);
    if (label.variant === "abv")
      assert.notEqual(label.observed.abv, label.application.abv);
    if (label.variant === "volume")
      assert.notEqual(label.observed.volume, label.application.volume);
    assert.ok(label.provenance.includes("Synthetic"));
    if (label.quality === "difficult") {
      assert.equal(label.expectedDefect, null);
      assert.deepEqual(label.observed, label.application);
    }
  }
});
