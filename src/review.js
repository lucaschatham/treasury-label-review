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
  /\b(\d+(?:\.\d+)?)\s*(millilit(?:er|re)s?|ml|centilit(?:er|re)s?|cl|lit(?:er|re)s?|l|fl\.?\s*oz|fluid\s+ounces?)\b/gi;
const toMilliliters = (number, unit) =>
  Number(number) *
  (/^fl/i.test(unit) ? 29.5735295625 : /^(ml|milli)/i.test(unit) ? 1 : /^(cl|centi)/i.test(unit) ? 10 : 1000);

export function parseVolume(value) {
  const match = String(value)
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(millilit(?:er|re)s?|ml|centilit(?:er|re)s?|cl|lit(?:er|re)s?|l|fl\.?\s*oz|fluid\s+ounces?)\.?$/i,
    );
  return match ? toMilliliters(match[1], match[2]) : null;
}

// Preserve the exact OCR substring supporting a normalized match. Application
// spelling is comparison input, never the evidence displayed to the reviewer.
function observedPhrase(text, expected) {
  const tokens = [...String(text).matchAll(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)];
  const wanted = normalize(expected).split(" ").filter(Boolean);
  if (!wanted.length) return null;
  for (let i = 0; i <= tokens.length - wanted.length; i++) {
    if (wanted.every((word, j) => normalize(tokens[i + j][0]) === word)) {
      const last = tokens[i + wanted.length - 1];
      return String(text).slice(tokens[i].index, last.index + last[0].length);
    }
  }
  return null;
}

function textFinding(text, field, expected) {
  const observed = observedPhrase(text, expected);
  const found = observed !== null;
  return entry(
    field,
    found ? "match" : "review",
    found ? compact(observed) : "Not confidently located",
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
      /\b(?:alc(?:ohol)?\.?|abv)\s*:?\s*$/i.test(before) ||
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

export function reviewLabel(rawText, application, layout = null) {
  rawText = typeof rawText === "string" ? rawText : "";
  const text = compact(rawText);
  // Browser OCR supplies an independently extracted prominent brand region.
  // Text-only callers can establish a match only at the start of the artwork.
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const wantedBrand = normalize(application.brand);
  let brandLine = layout?.brandText || "";
  if (!layout) {
    let candidate = "";
    for (const line of lines) {
      candidate = compact(`${candidate} ${line}`);
      if (normalize(candidate) === wantedBrand) { brandLine = candidate; break; }
      if (!wantedBrand.startsWith(`${normalize(candidate)} `)) break;
    }
  }
  const results = [
    entry(
      "Brand name",
      brandLine && normalize(brandLine) === wantedBrand ? "match" : "review",
      brandLine || "Not confidently located",
      brandLine && normalize(brandLine) === wantedBrand
        ? "Observed brand matches after case and punctuation normalization."
        : "The prominent brand region differs or is unclear. Inspect the artwork and application.",
      application.brand,
    ),
    textFinding(text, "Class / type", application.type),
    alcoholFinding(rawText, application.abv),
  ];
  const quantities = [...text.matchAll(volumePattern)].map((match) => ({
    ml: toMilliliters(match[1], match[2]),
    fluidOunces: /^fl/i.test(match[2]),
  }));
  const expectedVolume = parseVolume(application.volume);
  const expectedQuantity = {
    ml: expectedVolume,
    fluidOunces: /(?:fl\.?\s*oz|fluid\s+ounces?)/i.test(application.volume),
  };
  const sameQuantity = (a, b) => {
    if (Math.abs(a.ml - b.ml) < 0.01) return true;
    if (a.fluidOunces === b.fluidOunces) return false;
    // Allow conversion rounded to a whole mL, not regulatory fill tolerances.
    const metric = a.fluidOunces ? b.ml : a.ml;
    const converted = a.fluidOunces ? a.ml : b.ml;
    return Number.isInteger(metric) && Math.round(converted) === metric;
  };
  const conflicting = quantities.some((a) => quantities.some((b) => !sameQuantity(a, b)));
  const volumeValues = unique(quantities.map((quantity) => quantity.ml));
  const volumeStatus =
    !quantities.length || conflicting || expectedVolume === null
      ? "review"
      : quantities.every((quantity) => sameQuantity(quantity, expectedQuantity))
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
        ? "Equivalent quantity matches (fluid ounces are US units)."
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
  // Preserve every word and punctuation mark, including the final period.
  const body = REQUIRED_WARNING.slice(heading.length)
    .trim()
    .toLowerCase();
  const observedBody = text
    .slice(warningIndex + heading.length)
    .trimStart()
    .toLowerCase();
  const warningFound =
    warningIndex >= 0 &&
    observedBody.startsWith(body) &&
    /^(?:\s|$)/.test(observedBody.slice(body.length));
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
