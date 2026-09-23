# Step 1 spreadsheet upload acceptance

Local verification, September 23, 2026. Production unchanged.

- `npm test`: 92 passed. Real XLSX write/read fixtures, CSV parity, exact filename mapping independent of upload order, percentage ABV, imported boolean/country, immutable source rows, corrupt/empty/oversized files, duplicate filenames, missing columns, invalid applications, formulas, multiple populated worksheets, 300-row limit, mixed selections.
- `npm run build`: passed. ExcelJS is a separate lazy-loaded chunk (~256 KB gzip), loaded on XLSX import only.
- Chrome `/test/spreadsheet-browser.html`: PASS for CSV and XLSX actual files; input change and drag/drop; spreadsheets before images; staged image uploads; missing-image blocking; actual three-image OCR reviews with wrong-abv.png correctly in Failed and expected ABV 45 in the decision dialog; corrupt-file recovery; mixed uploads; removing spreadsheet while retaining images; clear files.
- The browser test caught a cross-realm ArrayBuffer incompatibility in XLSX loading. Normalizing input to Uint8Array fixed it; both formats passed the complete browser run afterwards.
- The warning-heading fixture remained Needs review in this local run. This verification establishes spreadsheet wiring and ABV comparison, not new boldness-detector accuracy.
- Dependency audit after a compatible UUID override: zero reported vulnerabilities.

Spreadsheets contain expected application values, not label artwork. Every row needs a matching uploaded image. CSV and XLSX templates are available in Step 1. No OCR, semantic review, appearance detector, Worker/API, or batch matching rules were changed.
