# Handoff prompt: finish the Treasury label-review prototype

Snapshot: September 22, 2026. This document was written after rechecking the working tree, running the current unit tests, reading the interrupted browser test, and polling the pending review and vision experiment to completion.

## 1. Your task

Continue the existing project. Complete and deploy the alcohol-label verification prototype against the original assignment, with evidence for every stated requirement. Preserve existing work and finish the product. Do not restart the project or substitute documentation of missing functionality for implementation.

The original assignment is the product rubric:

- https://github.com/treasurytakehome-rgb/instructions
- Local preserved copy: `ASSIGNMENT.md`
- Preserved upstream revision: `62bd63cd2f6b5af088b1d3c3b039c48cfcb012ef`
- Execution checklist: `REQUIREMENTS.md`

Read `ASSIGNMENT.md`, `REQUIREMENTS.md`, the applicable parent `AGENTS.md`, and the actual code before acting. The checklist is behind the latest evidence, particularly for browser batch processing. This handoff does not replace checking the files.

**The product is not complete. Automated warning boldness is still missing from the application. The latest code also has an unresolved autoreview finding. Nothing in the latest local work should be represented as a completed release.**

The desktop goal currently reports **paused**. Do not treat this handoff as permission to resume a paused goal automatically. When the user asks you to resume or starts a new implementation task with this prompt, pursue the full objective below.

## 2. Objective, boundaries, and user constraints

Deliver a working standalone prototype that:

1. Compares uploaded artwork with submitted application fields.
2. Handles harmless brand capitalization differences.
3. Checks exact government warning wording, uppercase heading, and boldness.
4. Handles the assignment's OLD TOM example.
5. Produces useful complete findings in approximately five seconds on representative clear artwork.
6. Handles batch uploads at the described 200–300 application scale.
7. Has a simple interface and useful error handling.
8. Uses sensible prototype security and accounts for restrictive outbound networks.
9. Provides accessible complete source, reproducible setup/run instructions, and approach/tools/assumptions documentation.
10. Provides a working deployed URL corresponding to the submitted source.

User constraints:

- Free services only. No paid upgrade or alternative paid provider is authorized.
- Preserve the selected Apple-inspired direction A: white/silver workspace, system typography, restrained blue actions, obvious controls.
- Preserve the existing unlisted custom-domain application and the separate main website.
- Carry work through implementation, tests, browser verification, review, and deployment. Do not repeatedly ask permission for routine authorized work.
- Do not claim an unpublished evaluator score or universal accuracy.
- Manual confirmation must remain distinct from automated verification.
- Do not deploy an unvalidated vision implementation simply to make the UI appear complete.

Out of scope unless the user changes scope:

- Azure/.NET requirements, COLA integration, FedRAMP, government production infrastructure, or a complete alcohol-regulation engine.
- Robust restoration of badly photographed, heavily blurred, or glare-obscured labels. These may produce actionable uncertainty.
- External usability recruitment, a mandated font matrix, fixed cold/warm trial counts, or a mandated percentile.

An earlier plan invented stricter numerical gates. They were superseded. See `evidence/superseded-acceptance-plan.md` for historical context only. Our 30 designs, 40 font cases, and timing experiments are engineering evidence choices, not additional assignment requirements. Multiline brands and US fluid ounces are useful supported cases, not separately enumerated assignment requirements.

## 3. Repository, branch, and deployment targets

Working repository:

`/Users/HQ/Projects/lucaschatham.com/treasury-label-review`

- Branch: `requirement-gates`
- Origin: `https://github.com/lucaschatham/treasury-label-review.git`
- Upstream: `https://github.com/treasurytakehome-rgb/instructions.git`
- Public repository URL: https://github.com/lucaschatham/treasury-label-review
- Existing app URL: https://label-review-7b3.lucaschatham.com/
- Vercel project: `treasury-label-review`
- Project ID: `prj_mq5AO5hMT2MhzRFyTKgtm1RrWeRC`
- Vercel org ID: `team_fHPmcH1Kbh7YKJhhHt2cNE2L`
- Vercel scope previously used: `chathamworks-6954s-projects`

The project linkage and Git remotes were rechecked for this handoff. The public deployment was not re-audited during handoff preparation.

Previously recorded live baseline:

- Source commit: `a79989d8aee671edfd2e16c462ed82c0f382b0fe`
- Deployment: `dpl_GvwYBVY4rxKmeME8WFQYWNx3YVfR`
- Deployment hostname: `treasury-label-review-1j7e843ib-chathamworks-6954s-projects.vercel.app`

These live details need fresh verification before release. The current branch work has not been pushed or deployed during this workstream. Do not assume GitHub auto-deploy is configured.

### Main website safety

The main website is a different repository and Vercel project:

- Checkout: `/Users/HQ/Projects/lucaschatham.com/site`
- Required origin: `https://github.com/lucaschatham/lucaschatham.git`
- Vercel project: `site`

Never deploy the separate `lucaschatham.com` repository to `site`. Before any main-site production deployment, verify the origin and known-good deployment metadata `githubCommitRepo === lucaschatham`. Follow the parent AGENTS.md exactly. This assignment should deploy to `treasury-label-review`, not `site`. Verify the main homepage portrait and primary links remain intact after final app release.

## 4. Exact current Git state

HEAD: `f2bb95f`, a generated-evidence commit. Recent commits:

- `f2bb95f`: browser batch completion and broader vision feasibility evidence.
- `f810019`: US fluid-ounce comparisons and OCR capacity documentation.
- `82dd797`: 300-image Node OCR diagnostic and quantity recomparison data.
- `a98b1ba`: manual confirmation no longer clears automated review status.
- `62ddacf`: unsuccessful initial cloud typography feasibility results.

**There are intentional, important uncommitted changes. Do not reset or overwrite them.** At handoff:

Modified:

- `README.md`
- `evidence/vision-feasibility.md`
- `src/main.js`
- `src/review.js`
- `test/review.test.js`

Untracked before this handoff document:

- `src/layout.js`
- `test/layout.test.js`
- `evidence/layout-valid-followup.json`
- `evidence/vision-consensus-unseen.json`
- `evidence/vision-consensus-capacity-followup.json`

The layout implementation is therefore not represented by HEAD alone. The generated evidence commits also sometimes precede the associated implementation commit. Read each evidence file's scope rather than assuming a green result describes all current code.

## 5. Current implementation

Stack:

- Vite `8.3.0`
- Tesseract.js `7.0.0`
- `@tesseract.js-data/eng` `1.0.0`
- Plain JavaScript, HTML, CSS
- Node requirement `>=22.12.0`; current local test runtime was Node `26.5.0`
- No production cloud backend or warning-appearance endpoint has been integrated.

Commands:

```sh
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

OCR assets are copied locally by `scripts/copy-ocr-assets.js`. The browser loads OCR assets from its own origin. The app currently truthfully says images stay in the browser. If cloud processing is added, change that disclosure before transmitting user artwork.

Key files:

- `src/main.js`: UI, worker initialization, sequential image processing, CSV/upload flow, result rendering, stopping, input invalidation.
- `src/review.js`: field comparisons, warning text checks, volume parsing.
- `src/layout.js`: new, uncommitted coordinate-based reading order and brand extraction.
- `src/batch.js`: file limits, CSV parsing, application validation, filename mapping.
- `src/summary.js`: automated summary semantics.
- `src/style.css`, `index.html`: selected native-style UI.
- `test/`: unit/regression tests.
- `scripts/generate-corpus.js`, `scripts/lib/corpus.js`: synthetic fixtures and ground truth.
- `scripts/benchmark-corpus.js`: older Node OCR diagnostic runner. It does not yet exercise the new layout path. Update it before using it as evidence of the final pipeline, and preserve earlier results rather than silently overwriting their provenance.

### Implemented comparison behavior

- Brand normalization handles case and apostrophes; evidence displays observed OCR spelling.
- ABV supports prefix and suffix notation, including `ABV: 45%`, `45% ABV`, and alcohol/proof notation. Conflicting ABVs or proof remain unresolved.
- Metric quantities and US fluid ounces are compared numerically. Cross-system whole-milliliter rounding allows `12 fl oz` and `355 mL`; plain `oz` remains ambiguous. Conflicting declarations remain unresolved.
- Producer/address and applicable import country are compared against OCR evidence.
- Blank ABV produces an explicit exception-review finding, not an invented regulatory exemption.
- Warning wording and uppercase heading are checked. Body case is normalized, whitespace is compacted, and a missing final period is currently tolerated. This exactness trade-off must be reviewed and documented honestly. Do not silently describe every punctuation-normalized result as character-exact.
- **Warning appearance is always REVIEW. There is no automated boldness implementation in the app.**
- Checking the manual appearance checkbox does not change automated status or remove the pending finding.
- Input changes clear stale results.
- Images are processed sequentially, maximum 300 images, 10 MB per image, 200 MB aggregate, 40 megapixels per image. Images are resized to maximum dimension 1800 pixels for OCR.

### New layout implementation

The previous text-only approach repeatedly confused producer references with brands. Adding declaration-word regexes was not sufficient. That approach has been replaced in the dirty working tree.

`readLayout()`:

- Uses OCR bounding boxes, independently of expected application values.
- Orders fragments spatially and joins nearby fragments on the same row.
- Chooses the first prominent text region and nearby aligned large-text lines as the brand.
- Uses 85% of maximum line height for prominence and a maximum vertical gap of 1.25 times maximum line height for joining brand lines.
- Returns uncertainty for competing prominent columns.
- Repaired a real sparse-OCR issue where `France` was emitted before its producer/address line despite being to its right.

These are prototype layout assumptions. Unusual typography or decorative text can still confuse region selection. Do not claim universal brand extraction accuracy.

`reviewLabel(rawText, application, layout)` compares the complete independently extracted brand against the application and shows differing observed brand text. Text-only fallback callers only attempt the initial brand region, rather than searching arbitrary later producer text.

## 6. Success rubric and verified status

Use PASS only when the evidence matches the requirement's actual scope. Distinguish implemented behavior, local evidence, deployed evidence, and unresolved behavior.

| Requirement | Relevant success evidence | Current state |
| --- | --- | --- |
| Listed application fields | Correct/incorrect artwork cases for brand, type, ABV/proof, quantity, producer/address, country; missing/conflicting readings explicit; actual OCR evidence shown | Substantial local coverage. New layout code needs its review finding fixed and final verification. Additional invalid type/producer/country image cases should be checked. |
| Brand capitalization | Image test of STONE'S THROW versus Stone's Throw, plus a truly different brand | Unit coverage passes. Multiline STONE’S THROW browser regression passes. Final exact case-difference acceptance example should be recorded with final source. |
| Warning wording, uppercase, bold | Valid warning passes all required automated checks; altered/missing/title-case/non-bold examples fail the corresponding check; uncertainty never becomes all-clear | Wording/caps implemented. **Boldness not integrated. This requirement is incomplete.** |
| OLD TOM sample | Full image review of supplied-style fields, including automated appearance | Local text checks pass around 0.6 seconds. Full sample requirement remains incomplete without boldness. |
| About five seconds | Review click to completion of all required automated findings on representative clear images; report startup and network conditions and outliers | Fast local OCR verified. Complete automated timing unproven. Cloud queueing remains a serious concern. |
| Batch 200–300 | Actual browser upload, per-file applications, retained unique results, no association errors; rerun final integrated path | **300-image browser queue/mapping completed successfully** on earlier local state. Latest layout and future cloud integration need appropriate regression checks. |
| Simple UI/error handling | Sample, upload, correction, mismatch, evidence inspection, mixed batch, keyboard and narrow layouts, no stale results | Selected UI implemented and several flows checked. Final integrated errors and accessibility smoke checks remain. |
| Standalone/security/network | Same-origin browser requests where practical; no exposed credentials; accurate data disclosure; bounded inputs; explicit provider failures | Local-only prototype currently exists. Any cloud architecture needs implementation and verification. |
| Source/docs | Final code published; clean install/tests/build; accurate tools, setup, assumptions and trade-offs | Repo exists. Latest work is local/dirty. Clean-checkout reproduction and final documentation remain. |
| Deployed URL | Anonymous access to final tested source, correct domain/commit, valid/invalid/batch smoke tests | Old baseline live. Latest implementation not deployed. |

### Fresh local verification

- `npm test`: **34/34 passed**, rerun during handoff preparation.
- Latest `npm run build`: passed before handoff; no implementation edits were made during handoff preparation.
- Latest autoreview: **NOT CLEAN**, one actionable finding below.

### Accuracy evidence and limitations

Fresh OCR on 30 previously examined valid synthetic labels with the new layout path:

- Brand: 30/30 match.
- Class/type: 30/30 match.
- ABV: 30/30 match.
- Net contents: 28/30 match; 2 unresolved.
- Producer/address: 30/30 match.
- Import country: 15/15 match; 15 domestic skips.
- Warning wording/caps: 30/30 match.
- Warning appearance: 30/30 unresolved.

These are regression results on synthetic labels, not independent real-world accuracy estimates. Earlier 60-image layout testing rejected all 30 altered brands; the follow-up adjusted paragraph spacing to fix two valid-brand joins. Maintain the negative regressions after further changes.

The two unresolved beer quantities involve OCR unit readings such as `f1 oz`. Inspect the actual evidence before deciding whether a safe normalization is justified. Do not let expected values determine the observed value.

### Capacity and timing evidence

1. Node OCR diagnostic:
   - 300 actual synthetic full-label images.
   - Zero processing errors.
   - 150.533 seconds total.
   - 175–939 milliseconds per image.
   - This was the older text-comparison path, not the current complete application.

2. Actual browser batch:
   - 300 images, 86.4 MB, 300 CSV application rows.
   - 300 reviewed, zero failed, zero remaining.
   - 275.0 seconds total; first result 0.7 seconds from click.
   - DOM audit: 300 result cards, 300 unique filenames, zero application-association errors across the displayed fields.
   - All 300 warning-appearance findings remained unresolved.
   - This run preceded the final layout redesign. It proves queue/mapping capacity for that state, not completed cloud verification or current release readiness.

3. Latest layout-aware browser regression, read back during handoff:
   - `spirits-08-valid.png`: RIVER BEND and full producer/address matched.
   - `spirits-05-valid.png`: multiline STONE’S THROW matched; its class was not merged into the brand.
   - `spirits-05-brand.png`: displayed DIFFERENT BRAND and REVIEW; did not approve the producer reference as the brand.
   - Three reviewed, zero failed, 1.9 seconds total, first result 0.8 seconds.
   - Warning appearance remained REVIEW in every result.

## 7. Immediate known bug: fix this first

Latest review command:

```sh
/Users/HQ/.agents/skills/autoreview/scripts/autoreview \
  --mode local \
  --output /tmp/treasury-layout-review.md \
  --json-output /tmp/treasury-layout-review.json
```

It completed with exit 1. Finding:

> `src/main.js` requests `{ blocks: true }` as Tesseract's third `recognize` argument. This replaces the default output object, so `data.text` can be null. When block geometry is absent or rejected, `layout.text || data.text` can be null and `reviewLabel` throws at `rawText.split(...)`. Also, `readLayout(blocks = [])` does not protect against an explicit null argument.

Next actions:

1. Inspect Tesseract's actual installed implementation/types to verify the output contract.
2. Add meaningful failing coverage for null/empty blocks, invalid geometry, blank images, and plain-text fallback.
3. Request both text and block outputs, and normalize absent text/blocks defensively.
4. Ensure a blank/unreadable valid image yields explicit review findings or an appropriate actionable unreadable result, rather than an accidental JavaScript exception.
5. Rerun focused tests, the full unit suite, build, relevant browser cases, and autoreview.

Do not call the current implementation review-clean because its unit suite is green.

## 8. Cloudflare and typography research state

### Access and authorization

- Wrangler authentication previously succeeded for the user's intended Cloudflare account.
- Workers Free was verified active in the dashboard.
- The user explicitly approved Meta Llama 3.2 license and AUP acceptance, and the endpoint acknowledged acceptance. Do not ask again for those same terms.
- Main Cloudflare MCP OAuth succeeded with the newer bundled Codex CLI. Other optional Cloudflare MCP connections were not all authenticated. They are not required to finish the app.
- Never print tokens or full credential files. Experiments read Wrangler credentials locally and sent them only to the Cloudflare API.
- No paid plan change, paid provider, or production vision endpoint was introduced.

### What was tested

All requests used synthetic images. Raw results are in `evidence/`.

1. `@cf/meta/llama-3.2-11b-vision-instruct`:
   - Initial byte-array requests failed.
   - Base64 requests worked but confused bold and regular headings.
   - A fresh RGB control image reading COPPER BRIDGE 729 was transcribed correctly. Image transmission works.
   - RGB conversion and a shorter prompt still classified both heading weights as bold.
   - **Not suitable as tested.**

2. `@cf/qwen/qwen3.8-27b`:
   - Wide crops produced uncertainty.
   - Tight heading crops substantially improved performance.
   - Fixed 40-case font/size test: 33 correct, 3 incorrect regular-to-bold classifications, 4 timeouts. Six calls exceeded five seconds.
   - Wrong classifications: Times 48 regular, Courier 24 regular, Century 48 regular.
   - **Not suitable alone.**

3. `@cf/google/gemma-4-26b-a4b-it`:
   - Same tight-crop approach: 38/40 correct.
   - One timeout: Helvetica 24 bold.
   - One false positive: Courier 48 regular classified bold.
   - **Not suitable alone.**

4. Fixed corroboration rule, tested on 16 new cases from Arial, Georgia, Trebuchet MS, and Verdana at sizes 28/44:
   - Run Qwen and Gemma concurrently.
   - BOLD only if both say BOLD.
   - REGULAR if either says REGULAR.
   - Otherwise UNCERTAIN.
   - 14/16 correct definitive results; two bold cases unresolved due to Qwen timeouts; no incorrect definitive classifications in this small set.
   - Five total trials lasted around ten seconds because the experiment waited for both requests even when one had already returned REGULAR. A real implementation could return a definitive non-bold result early, but that optimization has not been implemented or validated.
   - This is a promising experiment, **not a validated production integration or a general accuracy guarantee**.

5. `rejectIfBusy` follow-up on the two unresolved Trebuchet cases:
   - 28 bold: both BOLD, 1.133 seconds.
   - 44 bold: still UNCERTAIN after 10.126 seconds because Qwen timed out.
   - This follow-up does not erase the original failures or prove the five-second requirement.

### Fixed crop and request details

The 40-case experiments cropped the synthetic image's top 110 pixels, trimmed background, added a 30-pixel white border, resized to 1200 pixels wide, and encoded RGB PNG. The production app does not yet derive or send such crops from OCR coordinates. That is essential remaining work if this method is selected.

Prompt:

> Is the GOVERNMENT WARNING heading printed in bold or regular font weight? Do not confuse capital letters or larger size with bold strokes. Return only BOLD, REGULAR, or UNCERTAIN.

Settings: temperature 0; `max_completion_tokens: 32`; `chat_template_kwargs: { enable_thinking: false }`; multimodal `messages` with a base64 image data URL. Expected answers, filenames, fonts, and splits were not transmitted to the models.

Official Cloudflare documentation checked:

- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- https://developers.cloudflare.com/workers-ai/features/reject-if-busy/

At the time checked, Workers Free had a 10,000-neuron daily allocation and hard failure beyond it without a paid upgrade. These tested models were not listed among models requiring a paid billing method. Recheck volatile details before deployment. Estimated usage or published allowance does not establish capacity for a real integrated 300-label run. Timeouts may consume quota even when a usage response is unavailable.

For native REST, the documented queue option is top-level `options: { rejectIfBusy: true }`. For the Workers AI binding, it is the third argument to `env.AI.run()`, not inside model inputs. Capacity rejection should be HTTP 429/code 3040. The tested option did not eliminate all timeouts.

Experiment scripts currently live in `/tmp/treasury-*.py`, notably:

- `/tmp/treasury-qwen-corpus.py`
- `/tmp/treasury-gemma-corpus.py`
- `/tmp/treasury-vision-consensus.py`
- `/tmp/treasury-vision-capacity.py`

They are exploratory, contain local account/config assumptions, and are not a portable final test harness. If retaining the method, create a reproducible repository harness with safe credential handling, fixed model/prompt/crop provenance, and preserved raw results. Do not dump credentials into the repository or handoff.

## 9. Evidence map

Read the scope notes in these files:

- `evidence/ui-native-workspace.md`: local UI verification.
- `evidence/ocr-corpus-run.json` and `.md`: baseline 300-image Node diagnostic.
- `evidence/quantity-recomparison.json`: saved-text recomparison after quantity support.
- `evidence/browser-batch-300.json`: actual 300-image browser queue and association evidence.
- `evidence/brand-recomparison.json`: historical text-only brand recomparison, superseded by layout extraction.
- `evidence/layout-ocr-regression.json`: first fresh 60-image layout test, including the two valid-brand joins that subsequently needed repair.
- `evidence/layout-valid-followup.json`: 30 valid-label follow-up after paragraph-gap correction.
- `evidence/vision-initial-probe.json`, `vision-image-control.json`, `vision-rgb-pair.json`: Llama results and input control.
- `evidence/vision-qwen-pair.json`, `vision-qwen-tight-pair.json`, `vision-qwen-corpus.json`: Qwen experiments.
- `evidence/vision-gemma-control.json`, `vision-gemma-corpus.json`: Gemma experiments.
- `evidence/vision-consensus-unseen.json`: fresh-font corroboration experiment.
- `evidence/vision-consensus-capacity-followup.json`: latest queue-option follow-up.
- `evidence/vision-feasibility.md`: partly updated narrative; it does not yet summarize all newer experiments.

Generated fixtures are ignored under `test/fixtures/generated/`. They contain 300 full-label images, 40 typography crops, `manifest.json`, `renderer.json`, and a generated `batch.csv`. Generation requires ImageMagick and the recorded local font artifacts. Fonts are not redistributed. The corpus is synthetic. Designs that informed fixes are regression fixtures, not unseen test data.

## 10. Remaining implementation and test sequence

### A. Stabilize the current layout change

Fix the OCR fallback finding, test blank/null/invalid geometry and normal labels, rerun autoreview until no accepted actionable findings remain. Preserve layout's independence from expected application values. Verify valid and wrong brands, mixed columns, unusual prominence, and producer/address ordering. Do not resume the abandoned declaration-regex patch cycle.

### B. Finish automated warning verification

Choose and validate a bounded implementation that actually distinguishes bold and regular headings. The current two-model experiment is promising but still has timeout and validation gaps. Do not equate a model's confident answer with ground truth. Avoid endless open-ended model/prompt experimentation; each experiment must resolve a specific remaining decision.

If retaining the cloud approach:

- Derive the heading crop from actual OCR coordinates; include enough context without overwhelming the heading.
- Test ordinary uploaded full labels, not only prepared standalone typography crops.
- Preserve deterministic wording and capitalization checks.
- Define strict output parsing and fail to uncertainty on malformed, missing, timed-out or provider-error responses.
- Test regular headings that fooled either individual model, genuinely bold headings, missing/title-case/altered warning examples, unfamiliar fonts, and unreadable crops.
- Verify repeated behavior on fresh cases. Report incorrect and unresolved results separately.
- Implement and test practical latency handling. Any retries must be bounded and counted in both timing and quota evidence.
- Keep manual observations separate and never turn unresolved appearance into an automated all-clear.
- Audit the final-period normalization against the exact-warning requirement and document the decision.

### C. Build the cloud boundary only after the method is justified

The earlier architectural direction was a same-origin Vercel `/api/warning-appearance` proxy backed by a dedicated Cloudflare Worker with an AI binding. No such route/Worker is currently implemented.

If used, finish and test:

- Server-side credentials/bindings only; no browser secrets.
- Bounded image body, supported encodings, fixed model/prompt/output, request deadline.
- No arbitrary URL fetching, no image contents in logs, no image persistence.
- Rate limiting and Free-plan behavior; do not silently enable paid billing.
- Accurate disclosure before cloud processing; remove false browser-only privacy text.
- Same-origin browser networking; verify it through the actual app.
- Clear 429/quota/timeout/malformed-output behavior with no false pass.

A different implementation is acceptable if it meets the original rubric and user constraints. Cloudflare itself is not an assignment requirement.

### D. Close remaining field and failure cases

Verify correct, different, absent, conflicting, and unsupported values in actual images for every listed field. Add missing negative image evidence for type, producer/address, and country. Inspect the two unresolved fluid-ounce OCR cases. Explicitly represent beverage-specific ABV exceptions without inventing a regulatory engine. Test corrupt images, invalid CSV, duplicate/missing filenames, stop/retry, and input changes after results.

### E. Verify the final integrated performance and capacity

- Measure Review click to all required automated findings, including typography.
- Use representative clear labels, startup conditions, and a documented browser/machine/network. Report outliers honestly. Do not substitute OCR-only timings for complete review timings.
- Run the final 300-image browser path with independent per-file mappings and actual required inference calls if cloud checks exist.
- Confirm no lost results, duplicate processing, cross-file application mixing, crash, or hidden quota failure.
- Existing 86.4 MB batch success is useful evidence. A batch exceeding 200 MB is not an explicit assignment requirement; the current limit must be documented rather than silently misrepresented.
- Verify keyboard use, narrow layout, clear findings, supporting artwork/crops, and actionable failures.

### F. Review, reproduce, and release

1. Update `REQUIREMENTS.md` with current evidence and honest statuses.
2. Update README/setup/privacy/assumptions and the evidence narrative to match actual behavior.
3. Run the explicitly requested autoreview skill and resolve verified actionable findings. A clean code review does not prove product completion.
4. Reproduce install, tests, and production build from clean source.
5. Commit and publish the final source to the existing repository.
6. Deploy a preview to `treasury-label-review` and test it anonymously.
7. Verify valid/invalid warning cases, sample, fields, failure handling, and batch operation against that release candidate.
8. Promote the same tested source to the custom domain, then recheck production and deployment commit metadata.
9. Verify the app remains unlisted and the main website portrait/links are intact. Roll back if production verification fails.
10. Give the repository URL, application URL, requirement-by-requirement status, measured results, and remaining limitations.

Only claim complete implemented coverage when all stated requirements and deliverables have relevant passing evidence. Do not claim 100% evaluator scoring.

## 11. Tool and session notes

- All interrupted processes inspected for this handoff are terminal. The latest autoreview finished with the one OCR-fallback finding. The queue-option experiment finished with one pass and one unresolved timeout.
- The local browser remains on `http://127.0.0.1:5173/` and was marked for handoff. Reuse it if available, but inspect current state first.
- Current browser test results were read back during handoff preparation; there is no still-running three-image test to restart.
- CUA bindings in this session included `liveDesign` for IAB tab 2, `designTab` for its AX interface, and browser ID `3`. New sessions may need to reacquire handles. Use CUA documentation rather than shell-based UI automation.
- A dev server was running locally. Check whether it remains live before starting another.
- Use the autoreview helper at `/Users/HQ/.agents/skills/autoreview/scripts/autoreview` or its installed equivalent. Default engine only; do not override it without authorization. Let healthy reviews finish.
- Do not spawn additional agents unless the user or an applicable skill explicitly authorizes them.
- Keep progress updates concise and timely. Distinguish completed work from prepared code, experimental evidence, and deployed behavior.

Start by fixing the known OCR fallback bug, then continue toward the full requirement checklist. The largest remaining product risk is reliable, timely automated boldness verification.
