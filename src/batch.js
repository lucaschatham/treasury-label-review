export function validateFiles(files) {
  if (!files.length) throw new Error("Choose at least one label image.");
  if (files.length > 300)
    throw new Error("Choose up to 300 label images per batch.");
  if (
    files.some(
      (file) =>
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024 ||
        file.size === 0,
    )
  ) {
    throw new Error(
      "Use nonempty PNG, JPEG, or WebP images, each under 10 MB.",
    );
  }
  if (files.reduce((total, file) => total + file.size, 0) > 200 * 1024 * 1024)
    throw new Error("Keep the complete batch under 200 MB.");
}

export function validateApplication(application, label = "Application") {
  for (const key of ["brand", "type", "volume"]) {
    if (!String(application[key] ?? "").trim())
      throw new Error(`${label}: ${key} is required.`);
  }
  const abv = String(application.abv ?? "").trim();
  if (abv && (!/^\d+(?:\.\d+)?$/.test(abv) || Number(abv) > 100))
    throw new Error(
      `${label}: ABV must be a number from 0 to 100, or blank for an applicable exception.`,
    );
  if (application.imported && !String(application.country ?? "").trim())
    throw new Error(`${label}: country is required for an imported product.`);
}

// A small CSV reader supports quoted commas, escaped quotes, and line breaks.
export function parseManifest(text) {
  if (text.length > 1024 * 1024)
    throw new Error("Application CSV must be under 1 MB.");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (char === "," || char === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (char === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += char;
  }
  if (quoted)
    throw new Error("Application CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  rows.push(row);
  const nonempty = rows.filter((values) => values.some(Boolean));
  const headers = nonempty.shift() || [];
  for (const key of ["filename", "brand", "type", "abv", "volume"]) {
    if (!headers.includes(key))
      throw new Error(`CSV header must include ${key}. Download the template.`);
  }
  if (new Set(headers).size !== headers.length)
    throw new Error("CSV contains duplicate headers.");
  const applications = new Map();
  for (const [index, values] of nonempty.entries()) {
    if (values.length !== headers.length)
      throw new Error(`CSV row ${index + 2} has the wrong number of columns.`);
    const application = Object.fromEntries(
      headers.map((key, i) => [key, values[i]]),
    );
    if (!application.filename)
      throw new Error(`CSV row ${index + 2} needs a filename.`);
    if (applications.has(application.filename))
      throw new Error(`Duplicate CSV filename: ${application.filename}.`);
    if (
      !["", "true", "false"].includes(
        (application.imported || "").toLowerCase(),
      )
    )
      throw new Error(`CSV row ${index + 2}: imported must be true or false.`);
    application.imported =
      (application.imported || "").toLowerCase() === "true";
    validateApplication(application, application.filename);
    applications.set(application.filename, application);
  }
  if (!applications.size) throw new Error("Application CSV has no data rows.");
  return applications;
}

export function buildJobs(files, fallback, applications = null) {
  if (!applications) validateApplication(fallback);
  const names = new Set();
  for (const file of files) {
    if (applications && names.has(file.name)) throw new Error(`Duplicate image filename: ${file.name}. Rename duplicate files for CSV matching.`);
    names.add(file.name);
  }
  if (applications) {
    const missingImages = [...applications.keys()].filter(name => !names.has(name));
    const missingRows = [...names].filter(name => !applications.has(name));
    if (missingImages.length || missingRows.length) throw new Error(
      `Batch does not match. Missing images (${missingImages.length}): ${missingImages.join(", ") || "none"}. Missing CSV rows (${missingRows.length}): ${missingRows.join(", ") || "none"}. Upload missing images or correct the CSV before reviewing.`);
  }
  return files.map(file => ({file, application: {...(applications ? applications.get(file.name) : fallback)}}));
}
