import test from "node:test";
import assert from "node:assert/strict";
import { reviewLabel, REQUIRED_WARNING } from "../src/review.js";

const application = {
  brand: "Stone's Throw",
  type: "Kentucky Straight Bourbon Whiskey",
  abv: "45",
  volume: "750 mL",
};

test("matches a label with case and punctuation differences in the brand", () => {
  const text = `STONES THROW\nKentucky Straight Bourbon Whiskey\n45% ALC./VOL. (90 PROOF)\n750 mL\n${REQUIRED_WARNING}`;
  const result = reviewLabel(text, application);
  assert.equal(result.find((x) => x.field === "Brand name").status, "match");
  assert.equal(
    result.find((x) => x.field === "Alcohol content").status,
    "match",
  );
  assert.equal(
    result.find((x) => x.field === "Government warning").status,
    "match",
  );
});

test("flags a wrong ABV and a missing warning", () => {
  const result = reviewLabel(
    "STONES THROW\n40% Alc./Vol.\n750 mL",
    application,
  );
  assert.equal(
    result.find((x) => x.field === "Alcohol content").status,
    "mismatch",
  );
  assert.equal(
    result.find((x) => x.field === "Government warning").status,
    "review",
  );
});

test("warning requires exact words and uppercase heading", () => {
  const text = REQUIRED_WARNING.replace(
    "GOVERNMENT WARNING:",
    "Government Warning:",
  );
  assert.equal(
    reviewLabel(text, application).find((x) => x.field === "Government warning")
      .status,
    "review",
  );
  assert.equal(
    reviewLabel(REQUIRED_WARNING.toUpperCase(), application).find(
      (x) => x.field === "Government warning",
    ).status,
    "match",
  );
});

test("does not accept an application brand hidden inside another word", () => {
  assert.equal(
    reviewLabel("MILESTONE WHISKEY", { ...application, brand: "STONE" })[0]
      .status,
    "review",
  );
});

test("a producer reference alone is not evidence that the brand matches", () => {
  assert.equal(
    reviewLabel(
      "DIFFERENT BRAND\nBottled by Stone's Throw, Kentucky",
      application,
    )[0].status,
    "review",
  );
});

test("compares net contents numerically with equivalent metric units", () => {
  for (const label of ["750mL", "0.75 L", "75 cl"]) {
    assert.equal(
      reviewLabel(label, application).find((x) => x.field === "Net contents")
        .status,
      "match",
    );
  }
  assert.equal(
    reviewLabel("1750 mL", application).find((x) => x.field === "Net contents")
      .status,
    "mismatch",
  );
});

test("handles 100 percent without dropping its leading digit", () => {
  assert.equal(
    reviewLabel("100% ALC/VOL", { ...application, abv: "100" }).find(
      (x) => x.field === "Alcohol content",
    ).status,
    "match",
  );
});

test("conflicting ABVs or proof do not silently pass", () => {
  for (const label of ["45% ABV\n40% ALC/VOL", "45% ALC/VOL (80 PROOF)"]) {
    assert.notEqual(
      reviewLabel(label, application).find((x) => x.field === "Alcohol content")
        .status,
      "match",
    );
  }
});

test("recognizes common alcohol phrasing, excluding unrelated percentages", () => {
  assert.equal(
    reviewLabel("ALC. 45% BY VOL.\n100% GRAIN", application).find(
      (x) => x.field === "Alcohol content",
    ).status,
    "match",
  );
  assert.equal(
    reviewLabel("45% RECYCLED MATERIAL", application).find(
      (x) => x.field === "Alcohol content",
    ).status,
    "review",
  );
});

test("warning wording never implies typography has passed", () => {
  const findings = reviewLabel(REQUIRED_WARNING, application);
  assert.equal(
    findings.find((x) => x.field === "Warning appearance").status,
    "review",
  );
  assert.equal(
    reviewLabel(
      REQUIRED_WARNING.replace("birth defects", "health problems"),
      application,
    ).find((x) => x.field === "Government warning").status,
    "review",
  );
});

test("checks producer and imported country when provided", () => {
  const findings = reviewLabel("Bottled by Example Co, Paris, France", {
    ...application,
    producer: "Example Co, Paris, France",
    imported: true,
    country: "France",
  });
  assert.equal(
    findings.find((x) => x.field === "Producer / address").status,
    "match",
  );
  assert.equal(
    findings.find((x) => x.field === "Country of origin").status,
    "match",
  );
});

 test("warning tolerates a dropped final OCR period but never a changed final word", () => {
 const warning = text => reviewLabel(text, application).find(x => x.field === "Government warning").status;
 assert.equal(warning(REQUIRED_WARNING.slice(0,-1)), "match");
 assert.equal(warning(REQUIRED_WARNING.replace("problems.", "problem.")), "review");
 assert.equal(warning(REQUIRED_WARNING.replace("problems.", "problemsome.")), "review");
 });
