export const REQUIRED_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

const normalize = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
const compact = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
const entry = (field, status, found, detail, expected = "") => ({
  field,
  status,
  found,
  detail,
  expected,
});
const unique = (values) => [...new Set(values)];
const volumePattern =
  /\b(\d+(?:\.\d+)?)\s*(millilit(?:er|re)s?|ml|centilit(?:er|re)s?|cl|lit(?:er|re)s?|l)\b/gi;
const toMilliliters = (number, unit) =>
  Number(number) *
  (/^(ml|milli)/i.test(unit) ? 1 : /^(cl|centi)/i.test(unit) ? 10 : 1000);

export function parseVolume(value) {
  const match = String(value)
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(millilit(?:er|re)s?|ml|centilit(?:er|re)s?|cl|lit(?:er|re)s?|l)$/i,
    );
  return match ? toMilliliters(match[1], match[2]) : null;
}

function textFinding(text, field, expected) {
  const phrase = normalize(expected);
  // Whole tokens prevent matching STONE inside MILESTONE or 750 inside 1750.
  const found = phrase && ` ${normalize(text)} `.includes(` ${phrase} `);
  return entry(
    field,
    found ? "match" : "review",
    found ? compact(expected) : "Not confidently located",
    found
      ? "Text found after case and punctuation normalization."
      : expected
        ? "Inspect the artwork and extracted text; this may be an OCR error or a different value."
        : "No application value supplied. Confirm whether this field is required.",
    expected,
  );
}

function alcoholFinding(rawText, expected) {
  const text = compact(rawText);
  const candidates = [];
  for (const match of text.matchAll(/\b(\d{1,3}(?:\.\d+)?)\s*%/g)) {
    const before = text.slice(Math.max(0, match.index - 15), match.index);
    const after = text.slice(match.index + match[0].length);
    const context =
      /\balc(?:ohol)?\.?\s*$/i.test(before) ||
      /^\s*(?:alc(?:ohol)?\b|abv\b|(?:by\s+)?vol\b)/i.test(after);
    const standalone = rawText
      .split(/\r?\n/)
      .some((line) => line.trim() === match[0]);
    if (context || standalone) candidates.push(Number(match[1]));
  }
  const values = unique(candidates);
  const proofs = unique(
    [...text.matchAll(/\b(\d{1,3}(?:\.\d+)?)\s*proof\b/gi)].map((match) =>
      Number(match[1]),
    ),
  );
  let status = "review";
  let detail = "Confirm alcohol content visually. No unambiguous ABV was read.";
  if (String(expected ?? "").trim() === "") {
    detail =
      "ABV was not supplied. Confirm the beverage-specific exception before proceeding.";
  } else if (values.length === 1 && values[0] <= 100) {
    status =
      Math.abs(values[0] - Number(expected)) < 0.001 ? "match" : "mismatch";
    detail =
      status === "match"
        ? "Numeric ABV matches the application."
        : `Application says ${expected}%.`;
    if (proofs.some((proof) => Math.abs(proof - 2 * values[0]) > 0.001)) {
      status = "review";
      detail =
        "Proof conflicts with ABV. Inspect both values on the original artwork.";
    }
  } else if (values.length > 1) {
    detail =
      "Multiple different ABVs were read. Inspect the artwork; one matching value is insufficient.";
  }
  return entry(
    "Alcohol content",
    status,
    values.length ? values.map((value) => `${value}%`).join(", ") : "Not found",
    detail,
    expected === "" ? "Not supplied" : `${expected}%`,
  );
}

export function reviewLabel(rawText, application) {
  const text = compact(rawText);
  // A producer's name can contain the expected brand even when the actual brand differs.
  // Require a standalone OCR line for an automatic brand match; other layouts get review.
  const brandLine = rawText
    .split(/\r?\n/)
    .find((line) => normalize(line) === normalize(application.brand));
  const results = [
    textFinding(brandLine || "", "Brand name", application.brand),
    textFinding(text, "Class / type", application.type),
    alcoholFinding(rawText, application.abv),
  ];
  const volumeValues = unique(
    [...text.matchAll(volumePattern)].map((match) =>
      toMilliliters(match[1], match[2]),
    ),
  );
  const expectedVolume = parseVolume(application.volume);
  const volumeStatus =
    volumeValues.length !== 1 || expectedVolume === null
      ? "review"
      : Math.abs(volumeValues[0] - expectedVolume) < 0.01
        ? "match"
        : "mismatch";
  results.push(
    entry(
      "Net contents",
      volumeStatus,
      volumeValues.length
        ? volumeValues.map((value) => `${value} mL`).join(", ")
        : "Not found",
      volumeStatus === "match"
        ? "Equivalent metric quantity matches."
        : volumeStatus === "mismatch"
          ? "The quantity differs from the application."
          : "Confirm quantity and units visually; the text is missing, ambiguous, or uses unsupported units.",
      application.volume,
    ),
  );
  results.push(textFinding(text, "Producer / address", application.producer));
  results.push(
    application.imported
      ? textFinding(text, "Country of origin", application.country)
      : entry(
          "Country of origin",
          "skip",
          "Domestic product",
          "Not checked because the application is marked domestic.",
        ),
  );

  const heading = "GOVERNMENT WARNING:";
  const warningIndex = text.indexOf(heading);
  // OCR can drop the final full stop. Preserve every word and internal punctuation.
  const body = REQUIRED_WARNING.slice(heading.length)
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
  const observedBody = text
    .slice(warningIndex + heading.length)
    .trimStart()
    .toLowerCase();
  const warningFound =
    warningIndex >= 0 &&
    observedBody.startsWith(body) &&
    !/[\p{L}\p{N}]/u.test(observedBody.charAt(body.length));
  results.push(
    entry(
      "Government warning",
      warningFound ? "match" : "review",
      warningFound
        ? "Exact wording and uppercase heading detected"
        : "Exact wording or uppercase heading not detected",
      warningFound
        ? "Text check only. The separate appearance check is still required."
        : "Compare the full reference warning below with the artwork. OCR errors can obscure correct wording.",
      REQUIRED_WARNING,
    ),
  );
  // OCR text does not prove bold font weight. Keep this as an explicit human check.
  results.push(
    entry(
      "Warning appearance",
      "review",
      "Visual confirmation required",
      "Confirm that GOVERNMENT WARNING: is bold and uppercase. Check legibility, size, contrast, and placement against the original artwork.",
    ),
  );
  return results;
}
