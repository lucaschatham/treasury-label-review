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

test("warning requires the final period and rejects a changed final word", () => {
  const warning = (text) =>
    reviewLabel(text, application).find((x) => x.field === "Government warning")
      .status;
  assert.equal(warning(REQUIRED_WARNING.slice(0, -1)), "review");
  assert.equal(
    warning(REQUIRED_WARNING.replace("problems.", "problem.")),
    "review",
  );
  assert.equal(
    warning(REQUIRED_WARNING.replace("problems.", "problemsome.")),
    "review",
  );
});

test("warning rejects changed final punctuation and joined text", () => {
  for (const ending of [
    "problems!",
    "problems,",
    "problems;",
    "problems.Next",
  ]) {
    const result = reviewLabel(
      REQUIRED_WARNING.replace("problems.", ending),
      application,
    );
    assert.equal(
      result.find((x) => x.field === "Government warning").status,
      "review",
      ending,
    );
  }
});

test("recognizes ABV prefix notation and retains conflicting values", () => {
  const alcohol = (text) => reviewLabel(text, application).find(x => x.field === 'Alcohol content');
  assert.equal(alcohol('ABV: 45%').status, 'match');
  assert.equal(alcohol('ABV: 40%').status, 'mismatch');
  assert.equal(alcohol('ABV: 40%\n45% ABV').status, 'review');
});

test("text evidence shows artwork spelling rather than application spelling", () => {
  const result = reviewLabel("STONE’S THROW\nKENTUCKY STRAIGHT BOURBON WHISKEY", application);
  assert.equal(result[0].found, 'STONE’S THROW');
  assert.equal(result[1].found, 'KENTUCKY STRAIGHT BOURBON WHISKEY');
});

test("compares US fluid ounces and rejects weight ounces", () => {
  const quantity = (text, volume = '12 fl oz') => reviewLabel(text, { ...application, volume }).find(x => x.field === 'Net contents');
  assert.equal(quantity('12 FL. OZ.').status, 'match');
  assert.equal(quantity('16 fluid ounces').status, 'mismatch');
  assert.equal(quantity('12 oz').status, 'review');
  assert.equal(quantity('12 fl oz\n16 fl oz').status, 'review');
  assert.equal(quantity('12 fl oz', '354.88235475 mL').status, 'match');
});

test("allows whole-milliliter conversion rounding but not different quantities", () => {
  const quantity = (text, volume) => reviewLabel(text, { ...application, volume }).find(x => x.field === 'Net contents').status;
  assert.equal(quantity('12 fl oz', '355 mL'), 'match');
  assert.equal(quantity('355 mL', '12 fl oz'), 'match');
  assert.equal(quantity('12 fl oz / 355 mL', '355 mL'), 'match');
  assert.equal(quantity('12 fl oz', '356 mL'), 'mismatch');
  assert.equal(quantity('354 mL', '355 mL'), 'mismatch');
  assert.equal(quantity('12 fl oz / 356 mL', '355 mL'), 'review');
});

test("matches complete adjacent brand lines while preserving OCR spelling", () => {
  const result = reviewLabel("STONE’S\n\nTHROW\n\nKentucky Straight Bourbon Whiskey", application);
  assert.equal(result[0].status, 'match');
  assert.equal(result[0].found, 'STONE’S THROW');
});

test("does not match split producer references or incomplete brand lines", () => {
  for (const text of [
    "OTHER BRAND\nProduced by\nSTONE’S\nTHROW\nKentucky",
    "OTHER BRAND\nProduced for\nSTONE’S\nTHROW",
    "OTHER BRAND\n750 mL Bottled by\nSTONE’S\nTHROW",
    "OTHER BRAND\nVinted and bottled by\nSTONE’S\nTHROW",
    "OTHER BRAND\nCellared and bottled by\nSTONE’S\nTHROW",
    "OTHER BRAND\nDistilled, blended and bottled for\nSTONE’S\nTHROW",
    "OTHER BRAND\nProduced and bottled for\nSTONE’S\nTHROW",
    "OTHER BRAND\nBottled by STONE’S\nTHROW, Kentucky",
    "MILESTONE’S\nTHROW",
    "STONE’S\nSPECIAL\nTHROW",
  ]) assert.equal(reviewLabel(text, application)[0].status, 'review', text);
});

test("keeps occupational brand words and blocks generic by/for declarations", () => {
  for (const brand of ['THE BOTTLER', 'IMPORTER NO. 5']) {
    assert.equal(reviewLabel(brand, { ...application, brand })[0].status, 'match');
  }
  for (const declaration of ['Made by', 'Marketed by', 'Crafted for:', 'Crafted by Example Co', 'Producer:']) {
    assert.equal(reviewLabel(`OTHER BRAND\n${declaration}\nSTONE’S\nTHROW`, application)[0].status, 'review');
  }
});

test('shows independently observed brand evidence when it differs', () => {
 const finding=reviewLabel("DIFFERENT BRAND\nProduced by STONE’S THROW",application,{brandText:'DIFFERENT BRAND'})[0];
 assert.equal(finding.status,'review');
 assert.equal(finding.found,'DIFFERENT BRAND');
 assert.equal(reviewLabel("STONE’S THROW",application,{brandText:''})[0].status,'review');
});

test('blank or absent OCR text yields findings without accidental exceptions', () => {
 for (const text of [null, undefined, '', '   \n']) {
  const result = reviewLabel(text, application);
  assert.equal(result.length, 8);
  assert.ok(result.every(item => item.status === 'review' || item.status === 'skip'));
 }
});
