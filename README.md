# Label Review

> **Current partial release:** repair source `c3ebde8` is deployed with explicit user authorization to defer the boldness gate. Semantic and batch fixes are live; boldness remains unresolved at 34/40 local guard passes. See [release verification](evidence/partial-release-verification.json) and [repair checkpoint](evidence/repair-checkpoint.md).

[Application](https://label-review-7b3.lucaschatham.com) · [Assignment](ASSIGNMENT.md) · [Requirement evidence](REQUIREMENTS.md)

A standalone alcohol-label review prototype. Browser OCR compares artwork with application fields. A cropped government-warning heading receives conservative automated boldness verification. Uncertain findings remain for a person to inspect; this app does not grant regulatory approval.

## Try it

1. Select **Try a sample review**, then **Review labels**.
2. Inspect the findings, original artwork, extracted text, and analyzed heading crop.
3. Change an application field and review again to see a discrepancy. Editing inputs clears stale results.
4. For separate applications, open **Different applications in one batch**, upload its CSV template and the three linked test images, then review.

Each image represents a complete application's label artwork. Combine front/back panels into one image. Without CSV, every image uses the form values. With CSV, filenames map each image to its own application. Images run sequentially; **Stop after current label** retains completed results. Reviewing again starts a new run.

## Local setup

Requires Node.js >=22.12 and npm. The lockfile pins dependencies.

```sh
npm ci
npm test
npm run dev
```

Vite serves the UI and the same-origin `/api/warning-appearance` development route. OCR worker, English model, and WebAssembly files are copied from installed dependencies to `public/ocr`; they require no external browser domain. Missing cloud configuration leaves appearance explicitly unresolved while local text checks work.

For the complete automated appearance path:

1. Use a Cloudflare Workers **Free** account with Workers AI access. Do not upgrade billing. The free daily allocation is shared with other account usage; exhaustion makes checks unavailable.
2. Set your account ID and a unique Worker name in `worker/wrangler.jsonc`.
3. Run `npx wrangler@4.90.0 deploy --config worker/wrangler.jsonc`.
4. Generate a random secret and install it with `npx wrangler@4.90.0 secret put PROXY_KEY --config worker/wrangler.jsonc`.
5. Copy `.env.example` to `.env.local`; set the deployed Worker URL and the same secret as `WARNING_WORKER_KEY`. Restart Vite. These server-only values are never prefixed `VITE_` or committed.

```sh
npm run build
npm run preview
```

`npm run preview` previews static assets only; it does not serve the API. Use `npm run dev` for the complete local workflow or deploy the root project to Vercel, where `api/warning-appearance.js` serves the API. A static-only host cannot run automated cloud appearance checks.

## Architecture and decisions

- **Vite 8, plain JavaScript, Tesseract.js 7:** a small interface with no user account or installation. OCR initializes while details are entered and reuses one worker.
- **Independent brand extraction:** OCR coordinates locate the first prominent text region and nearby aligned large lines before comparison. The expected brand never guides region selection. Equal prominent columns remain uncertain. Geometry reorders text only if every OCR word is preserved; plain text is the fallback.
- **Deterministic comparisons:** case/apostrophe/punctuation normalization for text fields, contextual ABV and proof consistency, numeric volume conversion, complete warning wording with internal and final punctuation. Warning body capitalization and whitespace are normalized; the heading must remain uppercase. This is an OCR wording check, not a byte-for-byte artwork comparison.
- **Automated appearance:** high-confidence OCR words locate one uppercase heading. Only that crop is sent to Qwen 3.8 27B and Gemma 4 26B A4B IT concurrently, with a fixed prompt and strict output parsing. Both must say BOLD, and a local stroke guard must corroborate weight, before Match. Every other outcome is Review. A reviewer checkbox records a separate human observation and never changes the automated status.
- **Conservative stroke guard:** the OCR-isolated `I` in `WARNING:` must have usable geometry, a cap height of at least 16 pixels, and a middle-stem width at least 17% of cap height. The guard was added after both vision models falsely approved a regular Century heading. It intentionally leaves some true bold fonts unresolved. It is not a universal font classifier.
- **Vercel proxy and Cloudflare Worker:** the browser contacts only its own origin. A server-only shared secret protects the dedicated Worker; an AI binding avoids browser API keys. Fixed models, bounded PNG dimensions/payload, a four-second inference deadline, and a 60-request/minute per-client rate limiter bound prototype use. No automatic retries. A timed-out model call can still consume quota.
- **No persistence:** the app does not save images, application fields, crops, or inference responses. No image bodies are logged by application code; Worker observability is disabled. Vercel and Cloudflare may retain normal service metadata under their own policies. Cloudflare processes the heading crop; the full artwork and application stay in browser memory. Reloading clears results.

## Scope and limits

- Brand, class/type, and net contents are required form inputs. Missing producer/address stays unresolved. Imports require country. Blank ABV is an explicit exception-review item; the app does not invent beverage-specific exemptions or implement the full regulations.
- Decorative text, competing headings, unusual layouts, low resolution, glare, blur, and curved bottles can defeat OCR or the stroke guard. Missing evidence never becomes an all-clear. Low OCR confidence adds an attention item even when individual text matches exist.
- Matching producer/type/country text establishes that the expected phrase was read. It does not certify all other statements on the label or prove the absence of conflicting legal claims.
- Volumes support mL, cL, L, and **US** fluid ounces, including whole-mL conversion rounding (12 fl oz ≈355 mL). Plain `oz`, OCR-confused units, and conflicting declarations stay unresolved. Regulatory fill tolerances are not used to excuse application differences.
- Boldness is a conservative inference with documented false negatives and unresolved cases. It does not measure physical print size, required placement, or regulatory legibility. Model agreement is not ground truth. No real-world accuracy percentage or evaluator score is claimed.
- Upload limits: 300 images, 10 MB each, 200 MB total, PNG/JPEG/WebP. Images above 40 megapixels are rejected after decode; the longest side is reduced to 1800 pixels. The original remains available for inspection.
- Timing runs from Review click to findings, including unfinished initialization, preparation, OCR, and appearance. Per-label times also include cloud inference. Startup/downloads, device speed, network, queueing, quota, and model availability cause outliers. A 300-image batch is not expected to finish in five seconds.
- Free quota and rate limits can prevent full automatic verification. Those labels still retain text findings and a visible appearance exception. The UI tells the user to retry or inspect the artwork.
- The unlisted URL uses `noindex` and robots exclusions and is not linked from the main website. Anyone with the URL can access it. It is not an access-control mechanism.

## Verification and reproducibility

`npm test` covers comparisons, layout fallback, warning exactness, mapping, limits, crop selection, stroke safeguards, model parsing/deadline failures, and Worker request rejection. These tests use no cloud quota.

Additional scripts use ImageMagick and installed fonts:

- `node scripts/generate-corpus.js`: 300 synthetic full-label images, typography pairs, independent expected fields, CSV, and font/fixture hashes under ignored `test/fixtures/generated/`. Fonts are not redistributed.
- `node scripts/benchmark-corpus.js`: current layout-aware **Node-only** OCR diagnostic written to `evidence/ocr-layout-current-run.json`. Earlier evidence is preserved separately.
- `node scripts/verify-field-images.js`: actual-image negative field checks.
- `node scripts/prepare-appearance-probe.js`, then `python3 scripts/probe-appearance.py`: bounded synthetic full-label crop experiment. The Python harness reads `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`, or the local Wrangler OAuth file on macOS. It never prints credentials. Set `PROBE_OUTPUT` to a fresh evidence filename to preserve earlier runs.
- `python3 scripts/generate-appearance-followup.py`, then `PROBE_DIRECTORY=/tmp/treasury-fresh-labels node scripts/prepare-appearance-probe.js`: fresh full-label font cases.

See `evidence/appearance-method-decision.json`, raw vision files, and `REQUIREMENTS.md` for scope and observed limitations. The earlier two-model rule had a regular-to-bold false pass and was not released. Some fixtures informed changes and are regression evidence, not independent accuracy estimates. The older OLD TOM image, whose final period OCR dropped, is retained at `test/fixtures/regressions/old-tom-ocr-dropped-period.png`; the current sample uses the clearer existing corpus artwork.

## Release safety

The app origin is `https://github.com/lucaschatham/treasury-label-review.git`; the Vercel project is **treasury-label-review**. Verify both before deploying. Configure the two `WARNING_WORKER_*` server environment variables for preview and production. Deploy a preview and verify it using the configured access policy, then promote that tested source. Verify the custom domain anonymously. Do not disable preview authentication for testing. Do not deploy this repository to the main website project **site**. Verify the custom domain, source revision, `noindex`, and the separate main homepage after release.

[Cloudflare Free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [TTB warning guidance](https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning)

### Verified release, September 22, 2026

Production runs [57ff3b5](https://github.com/lucaschatham/treasury-label-review/tree/57ff3b58b3a408c3c52a77287bcf627df4ef3f70). Later documentation-only commits record its release evidence. The anonymous sample completed all applicable checks in 2.3 seconds; a three-image CSV batch completed in 7.3 seconds with the expected discrepancies and one visible appearance timeout. The first authenticated preview sample took 6.6 seconds. These are observations, not a five-second guarantee. See [release evidence](evidence/release-verification.json) and [300-image integrated results](evidence/browser-integrated-300.json).
