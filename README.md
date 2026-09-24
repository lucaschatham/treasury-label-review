# Label Review

> **Release status:** this source carries a qualified local warning-heading weight check and no network dependency; it is not yet deployed. Production still runs the September 23 release with the cloud appearance path. See [requirement evidence](REQUIREMENTS.md) and the current-candidate notes below.

[Application](https://lucaschatham.com/alcohol-by-volume-automated-label-check) · [Assignment](ASSIGNMENT.md) · [Requirement evidence](REQUIREMENTS.md) · [Attempt history](REQUIREMENTS.md#attempt-history)

A standalone alcohol-label review prototype. Browser OCR compares artwork with application fields. The government-warning heading's weight is measured locally against the statement's own text. Uncertain findings remain for a person to inspect; this app does not grant regulatory approval.

## Try it

1. Select **Try a sample review**, then **Review labels**.
2. Inspect the findings, original artwork, extracted text, and analyzed heading crop.
3. Change an application field and review again to see a discrepancy. Save changed details to clear stale results; existing decisions require confirmation first.
4. For separate applications, use **Different details for each label?** in Step 1, download a CSV or XLSX template, add the matching images, then review.

Each image represents a complete application's label artwork. Combine front/back panels into one image. Without CSV, every image uses the form values. With CSV, filenames map each image to its own application. Images run sequentially; **Stop after current label** retains completed results. Reviewing again starts a new run.

## Local setup

Requires Node.js >=22.12 and npm. The lockfile pins dependencies.

```sh
npm ci
npm test
npm run dev
```

Vite serves the UI. OCR worker, English model, and WebAssembly files are copied from installed dependencies to `public/ocr`; they require no external browser domain. Every check, including the warning-heading weight measurement, runs in the browser: the application makes no network request after its own assets load, so it works behind an outbound firewall.

```sh
npm run build
npm run preview
```

`npm run preview` serves the built static site, which is the complete application. Any static host can serve `dist/`.

## Investigation record

Start with the [September 24 investigation handoff](docs/boldness-handoff.md) for current findings, rejected approaches, open hypotheses, qualification status and reproduction limits. The numbered ledger in REQUIREMENTS.md is authoritative.


The [Attempt history](REQUIREMENTS.md#attempt-history) tracks approaches tried, failed gates, root-cause evidence, open blockers, untested options, and conditions for revisiting a decision. Read it before another experiment and update it at closeout. It supersedes stale “next step” recommendations in older reports while preserving their results.

## Architecture and decisions

- **Vite 8, plain JavaScript, Tesseract.js 7:** a small interface with no user account or installation. OCR initializes while details are entered and reuses one worker.
- **Independent brand extraction:** OCR coordinates locate the first prominent text region and nearby aligned large lines before comparison. The expected brand never guides region selection. Equal prominent columns remain uncertain. Geometry reorders text only if every OCR word is preserved; plain text is the fallback.
- **Deterministic comparisons:** case/apostrophe/punctuation normalization for text fields, contextual ABV and proof consistency, numeric volume conversion, complete warning wording with internal and final punctuation. Warning body capitalization and whitespace are normalized; the heading must remain uppercase. This is an OCR wording check, not a byte-for-byte artwork comparison.
- **Automated appearance (weight contrast):** high-confidence OCR words locate one uppercase `GOVERNMENT WARNING:` heading and the first capital letter of the statement words According, Surgeon, General and Consumption. `src/weight.js` measures sub-pixel stroke thickness in both regions (the ink mass of each stroke crossing, thinner of the horizontal and vertical crossings, median over ink pixels) and normalizes each by its letter height. Polarity is decided once per statement from the pixels around the heading, so light-on-dark statements are measured on their strokes. The heading is Match only when its normalized thickness exceeds the statement capitals' by the frozen cutoff (ratio ≥ 1.1396, fixed from development data before any qualification). A heading that is not materially heavier than its own statement, including a statement set entirely in a heavy face, stays Review: the regulation requires the heading in bold type and the remainder not in bold type, so the reviewer's judgement is a contrast within the statement, not an absolute font-weight label. Headings or reference capitals under 20 pixels tall in the reviewed image, or fewer than three located capitals, abstain with a named reason. Approve, Send back, and Later record separate human decisions and never change automated findings.
- **Why not a font classifier or a vision model:** a heading crop alone does not carry the information. The R-016 contact sheet in `evidence/` shows Superclarendon Regular with stems as heavy as Georgia Bold; single-weight display faces are named Regular; and two cloud vision models plus a stroke guard approved heavy regular faces (R-002, R-005). The attempt history in REQUIREMENTS.md records 36 such attempts and the decision memo in `docs/` explains the change of target.
- **No persistence and no network:** the app does not save images, application fields, crops, or measurements, and sends nothing off the page. The full artwork and application stay in browser memory. Reloading clears results.

## Scope and limits

- Brand, class/type, and net contents are required form inputs. Missing producer/address stays unresolved. Imports require country. Blank ABV is an explicit exception-review item; the app does not invent beverage-specific exemptions or implement the full regulations.
- Decorative text, competing headings, unusual layouts, low resolution, glare, blur, textured or gradient backgrounds and curved bottles can defeat OCR or the weight measurement. Light-on-dark and coloured statements are handled by a per-statement polarity decision (R-041); low-contrast inks are not qualified. Missing evidence never becomes an all-clear. Low OCR confidence adds an attention item even when individual text matches exist.
- Matching producer/type/country text establishes that the expected phrase was read. It does not certify all other statements on the label or prove the absence of conflicting legal claims.
- Volumes support mL, cL, L, and **US** fluid ounces, including whole-mL conversion rounding (12 fl oz ≈355 mL). Plain `oz`, OCR-confused units, and conflicting declarations stay unresolved. Regulatory fill tolerances are not used to excuse application differences.
- Boldness is a measured contrast between the heading and the statement's capital letters, qualified on synthetic source-weight fixtures (see the evidence links below). It does not measure physical print size, required placement, or regulatory legibility. A heading in a heavy face over a light statement of a different family reads as bold by construction; a statement set entirely in one heavy face reads as not distinguishable and stays for a person. No real-world accuracy percentage or evaluator score is claimed.
- Upload limits: 300 images, 10 MB each, 200 MB total, PNG/JPEG/WebP. Images above 40 megapixels are rejected after decode; the longest side is reduced to 1800 pixels. The original remains available for inspection.
- Timing runs from Review click to findings, including unfinished initialization, preparation, OCR, and the local appearance measurement. Startup/downloads and device speed cause outliers. A 300-image batch is not expected to finish in five seconds.
- When the heading or the statement's capitals cannot be measured, the label keeps its text findings and a visible appearance exception naming the reason. The UI tells the user to inspect the artwork.
- The unlisted URL uses `noindex` and robots exclusions and is not linked from the main website. Anyone with the URL can access it. It is not an access-control mechanism.

## Verification and reproducibility

`npm test` covers comparisons, layout fallback, warning exactness, mapping, limits, heading location, the weight-contrast estimator and its abstentions, and the review flow's independence from any network service.

Additional scripts use ImageMagick and installed fonts:

- `node scripts/generate-corpus.js`: 300 synthetic full-label images, typography pairs, independent expected fields, CSV, and font/fixture hashes under ignored `test/fixtures/generated/`. Fonts are not redistributed.
- `node scripts/benchmark-corpus.js`: current layout-aware **Node-only** OCR diagnostic written to `evidence/ocr-layout-current-run.json`. Earlier evidence is preserved separately.
- `node scripts/verify-field-images.js`: actual-image negative field checks.
- `python3 scripts/experiments/render_full_labels.py` then `node scripts/experiments/run_weight_contrast.mjs`: full-label weight-contrast fixtures from pinned Google Fonts sources through the application's OCR configuration and measurement in Node (R-039/R-040). Requires Python with Pillow, numpy and fontTools.
- `scripts/prepare-appearance-probe.js`, `scripts/probe-appearance.py`, `scripts/generate-appearance-followup.py` and `scripts/verify-appearance-guard.js` are historical harnesses for the retired cloud-vision path; their evidence remains under `evidence/`.

See `evidence/appearance-method-decision.json`, raw vision files, and `REQUIREMENTS.md` for the retired cloud path's scope and observed limitations. Some fixtures informed changes and are regression evidence, not independent accuracy estimates. The older OLD TOM image, whose final period OCR dropped, is retained at `test/fixtures/regressions/old-tom-ocr-dropped-period.png`; the current sample uses the clearer existing corpus artwork.

## Release safety

The app origin is `https://github.com/lucaschatham/treasury-label-review.git`; the Vercel project is **treasury-label-review**. Verify both before deploying. No server environment variables are required. Deploy a preview and verify it using the configured access policy, then promote that tested source. Verify the custom domain anonymously. Do not disable preview authentication for testing. Do not deploy this repository to the main website project **site**. Verify the custom domain, source revision, `noindex`, and the separate main homepage after release.

[TTB warning guidance](https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning)

### Current release, September 24, 2026

This source replaces the cloud appearance path with the local weight-contrast measurement. Evidence on this branch: independent qualification on eight never-opened font families, 39/40 bold and 0/40 regular headings matched with all 32 bold-body controls left for review (`evidence/r040-result.json`); the same 112 fixtures uploaded as one batch in the built application, 78.8 s, no failures, verdicts identical to the offline run (`evidence/browser-batch-fixtures.json`); uncached sample click-to-result 1.35–1.78 s in headless Chromium including OCR initialization (`evidence/browser-timing-sample.json`). These are synthetic, source-weight fixtures at 20–40 px cap height; accuracy on photographed labels is not claimed.

Production now runs [source 5c1a0e6](https://github.com/lucaschatham/treasury-label-review/tree/5c1a0e66eded9d712ae1ba008600fe63ecd95ec5), deployment `dpl_DDuhxzHRhYV9gsNpUuiAHHszzHV9`, bundle `index-BFitTXDs.js`. Protected preview QA passed before promotion. Three anonymous uncached production sample runs took 1.57, 1.12 and 1.04 seconds, each with local appearance match and ratio 1.4359. HTTP 200, noindex and zero cloud appearance requests were verified; the main homepage was unchanged. The obsolete Vercel variables and treasury-warning-appearance Worker were removed. See [release evidence](evidence/path-a-production-2026-09-24.json). These timings describe this Mac/browser and sample; synthetic qualification does not establish photographed-label accuracy.

### Previous release, September 23, 2026

That historical release ran [source 2a46749](https://github.com/lucaschatham/treasury-label-review/tree/2a46749b0d240d7a63d1ab4d7cd94ad28a146e10) and bundle `index-DGAUEOgM.js`. The anonymous production sample completed all applicable checks in 2.4 seconds, without a cached appearance result. The same runtime completed a 300-image preview run in 195.3 seconds, retaining 300 unique results and correctly associating all 900 checked brand/type/producer fields. This verifies batch accounting, not classification accuracy.

A clean install, 77 tests, production build, and code review passed. The [neighbor-localization evaluation](evidence/appearance-neighbor-evaluation.md) documents the remaining failures: 37/40 bold Matches and three uncached regular false Matches. Duplicate Latin artwork and five cached results prevent that typography run from qualifying as independent, uncached latency evidence. The release proceeds with these documented limitations; it does not satisfy the internal boldness gate.

The [September 22 release evidence](evidence/partial-release-verification.json) and earlier experimental reports remain historical records. The [original assignment](ASSIGNMENT.md) specifies qualitative evaluation criteria and no numeric passing score. This prototype is ready to inspect and exercise, but automated warning-boldness verification remains a material incomplete requirement.

## Spreadsheet uploads

Step 1 accepts PNG, JPEG, and WebP artwork plus one CSV or XLSX application spreadsheet. Add files together or in separate selections. Spreadsheets supply expected values; they do not replace label images. The browser parses them locally and matches each row to an image by exact filename. Review stays disabled until every row and image matches. Clear files starts over; Remove spreadsheet keeps the images for manual entry.

Use `public/samples/applications.csv` or `public/samples/applications.xlsx`. Required columns: `filename`, `brand`, `type`, `abv`, `volume`. Optional: `producer`, `imported` (true/false), `country` (required for imports). ABV is percentage points (45, not 0.45); XLSX percentage-formatted numeric cells are converted (45% becomes 45). XLSX must have one nonempty worksheet, plain values rather than formulas, dates, or hyperlinks. Maximum: 300 rows and a 1 MB spreadsheet. Duplicate filenames, missing columns, invalid values, and corrupt workbooks are rejected.

`node --test test/spreadsheet.test.js` verifies real XLSX serialization and parsing, CSV parity, mapping, and invalid input. Open `/test/spreadsheet-browser.html` on the local Vite server and run the checks for real three-image OCR through both formats, picker/change and drag/drop handling, staged uploads, recovery, and removal. ExcelJS is lazy-loaded only when an XLSX is opened.
