# Resolutions List

The running record of approaches tried, results, root-cause findings, and decisions for this project. Read this before proposing or running another experiment. Update it when an experiment ends or new evidence changes a diagnosis.

**Current state (2026-09-23): automated warning boldness remains unresolved. No tested replacement has qualified for release.** A failed implementation stays failed until a materially different hypothesis produces new evidence. A different name, another prompt, or another cutoff does not make an old experiment new.

This list is the current decision index. Earlier reports remain historical evidence; their “next step” recommendations may have been tried since they were written. The latest explicit user instructions take precedence over this document.

## How to use and maintain this list

1. Find the closest existing approach ID before starting work. Read its result, root-cause confidence, and reopening condition.
2. For a new attempt, record the parent ID, the specific mechanism being changed, why that change addresses the recorded failure, the smallest disconfirming test, and the stop rule **before** running it. If none of those changed, do not repeat the experiment.
3. Preserve failed examples and original results. Do not change answer keys, exclude inconvenient fonts, or call previously inspected data an unseen holdout.
4. At closeout, record the dataset, denominators, false approvals, bold detection, Review count where available, failures/timeouts, timing scope, evidence location, and decision. Separate observed failures from inferred causes.
5. Update this list in the same commit as new experimental evidence when possible. Append a dated decision-history entry. Supersede old conclusions explicitly; do not erase them.
6. Mark **RESOLVED** only for the specific problem actually verified. A fixed locator, passing unit tests, or successful batch accounting does not resolve boldness classification or release readiness.

**Statuses:** `FAILED` = measured implementation missed its gate; `PARTIAL` = a subproblem improved but the requirement remains incomplete; `OPEN` = diagnosed, not fixed; `UNTESTED` = hypothesis only; `EXCLUDED` = outside current scope or constraints; `RESOLVED` = bounded fix verified with evidence. “Root cause unknown” is an acceptable finding.

## Approaches tried

These are different cohorts, not a comparable model leaderboard. “Match” below refers to the automated boldness decision, not approval of the whole label. A local guard pass only permits inference; it is not a final Match.

| ID | Approach and status | Measured result | Root-cause finding and confidence | Decision / condition for reopening |
|---|---|---|---|---|
| **R-001** | Llama 3.2 11B vision, direct and chat prompts; **FAILED** | Simple Helvetica regular/bold pair: direct base64 requests called both bold; chat requests described both as not bold and failed the JSON contract. RGB plus short BOLD/REGULAR output still called both bold. | **Observed:** style errors on a matched pair. A separate transcription control confirmed image input worked. Input encoding and verbosity were not sufficient fixes. Internal model cause is unisolated. | Do not repeat RGB conversion, short-output prompting, or transport repair as if those solve the style error. A new adapter/model needs a concrete mechanism and the original pair as an immediate regression. [Evidence](evidence/vision-feasibility.md). |
| **R-002** | Unguarded Qwen + Gemma agreement; **FAILED** | Both models approved a regular Century heading from an OCR-derived full-label crop. | **Confirmed failure:** correlated false agreement. Agreement is not ground truth. Why both models confuse this face is unisolated. | Do not reintroduce consensus alone or add another model as a substitute for validation. A changed source of evidence must reject Century and retained heavy-regular cases. [Evidence](evidence/vision-feasibility.md), [raw crop probe](evidence/vision-full-label-probe.json). |
| **R-003** | Single-letter I guard with colon/glyph localization repairs; **PARTIAL, accuracy gate FAILED** | Early fresh pairs: 4/8 bold final passes, no regular false passes. Later colon/kern recovery: 33/40 bold locally eligible and 6/40 regular locally eligible on new v2 artwork. Final bold Matches could not exceed 33/40, below 38/40. | **Confirmed:** punctuation/segmentation can prevent locating a readable heading; local weight/geometry gates veto narrow bold cases before models run. Regular local eligibility alone is not a final false approval. | Keep useful localization separate from weight inference. Do not lower the 0.17 cutoff to recover narrow fonts or rerun cloud inference to rescue cases already vetoed locally. Narrow-font evidence led to R-004, already tried. [Local repair report](evidence/appearance-followup-local-2026-09-22.md). |
| **R-004** | Multi-glyph narrow-font fallback; **FAILED** | New v3: 38/40 bold and 0/40 regular locally eligible. Real preview: 36/40 bold Matches, 0/40 regular false Matches; displayed per-label p95 5.5 s; 9/80 exceeded 5 s. | **Observed:** two local geometry/weight misses plus two additional bold timeouts. A passing local gate did not establish end-to-end accuracy or latency. | Stop threshold refinement against v3. R-005 already tested a geometry recovery follow-up. Any new attempt must explain new evidence and meet both accuracy and uncached browser timing gates. [Report](evidence/appearance-multiglyph-evaluation.md). |
| **R-005** | Neighbour-bounded I recovery + multi-glyph guard + two models; **PARTIAL, classification gate FAILED** | Original v4 preview: 37/40 bold Matches, 3/40 regular false Matches. After removing 10 duplicate renders: **32/35 bold, 3/35 regular false Matches**. False approvals were three layouts of Superclarendon regular. | **Confirmed:** recovery improves localization but all decision components can still approve heavy regular text. Duplicate artwork and five cached crops weakened the original evaluation. The font-confusion mechanism inside the models remains unisolated. | Existing runtime has documented limits; do not call it a qualified boldness solution. No family exception or another I-width tweak. Later contextual and local replacements are R-006 through R-010. [Report](evidence/appearance-neighbor-evaluation.md), [historical production verification](evidence/production-release-2026-09-23.json). |
| **R-006** | Contextual single-model Qwen or Gemma, without I gate; **FAILED, run incomplete** | 41 completed pairs: baseline 19/20 bold, 3/21 regular false Matches; Qwen **16/20, 4/21**; Gemma **15/20, 0/21**. Authentication failure stopped the planned 70-image run. Even perfect remaining results cap Qwen at 31/35 bold and Gemma at 30/35, below baseline 32/35. | **Observed:** Qwen false approvals and Gemma bold misses/timeouts defeat the frozen improvement rule. Provider authentication interrupted collection but did not cause the already-observed classification failures. Changing crop, guard, and model count together was not a clean component ablation. | Fixing authentication alone cannot reverse the rejection bound. Do not repeat this frozen crop/prompt/model setup or treat the partial run as complete. See [R-006 evidence note](#r-006-contextual-single-model-evidence). |
| **R-007** | Whole-heading pixel matching against rendered regular/bold references; **FAILED** | Six supported families, 96 evaluation crops: **1/48 bold detected**, 0/48 regular false approvals, 1/48 regular correctly detected, one bold called regular, 93/96 Review. All 80 unknown-font crops stayed Review. | **Supported diagnosis:** renderer and registration sensitivity. Same font files produce different ink bounds; normalization amplifies a one-pixel height difference across a long heading. This is not proof of a unique implementation bug. | Do not repeat whole-heading overlap threshold tuning. Glyph-level alignment is a different, untested hypothesis requiring a scope decision and new frozen evidence. See [R-007 evidence note](#r-007-rendered-reference-evidence). |
| **R-008** | Native legacy Tesseract font attributes; **FAILED** | OEM 0 / PSM 7: **13/21 bold detected**, **1/21 regular falsely approved**, 10/42 uncertain; three bold headings classified regular. | **Observed:** Superclarendon regular at 64 points was assigned Century Schoolbook L Bold for both words. Exposing a font attribute does not establish its correctness. Browser compatibility was not proven. | Do not repeat “Tesseract exposes bold” as an untested solution. Any materially changed engine, traineddata, or adapter must first reject this exact negative without discarding it. See [R-008 evidence note](#r-008-legacy-tesseract-evidence). |
| **R-009** | FontDNA-V2 pretrained word-style model; **FAILED DIAGNOSTIC, weaker provenance** | Reported adapter diagnostic: **33/35 bold, 4/35 regular false approvals** on contextual development; separate calibration crops gave **20/21 bold, 16/21 regular false approvals**. | **Observed in prior review:** wrong weight predictions under the tested preprocessing. Long-word fitting, domain mismatch, and underlying model limitations were not isolated. No frozen per-image result artifact is preserved in the repository. | Do not promote these numbers to an independent benchmark, or repeat the unchanged 0.5/both-words adapter as a new idea. A justified adapter change or task-specific training is a different hypothesis. Restoring the original diagnostic would be labelled reproduction, not new proof. See [R-009 evidence note](#r-009-fontdna-evidence). |
| **R-010** | Original-pixel grayscale ink/skeleton thickness, normalized by text height and divided by body thickness; **FAILED** | **47/75 bold Matches**, 0/75 regular false Matches at a cutoff selected on those same negatives; needed 72/75. Perfect-location diagnostic: 28/40 bold at the frozen cutoff; at most 32/40 can exceed every regular score, below 38/40. | **Confirmed causal mismatch:** identical bold heading pixels change verdict when only body weight changes. **Confirmed overlap:** a regular score exceeds a bold score even with perfect locations and same-family regular bodies. OCR losses are additional, not the main complete explanation. | Stop this scalar upper-cutoff approach. No cutoff tweaks, font exclusions, or answer-key changes. Reopen only with a representation that addresses the counterexamples; test invariants before another full harness. See [R-010 evidence and counterexamples](#r-010-stroke-comparison-evidence). |

## Root-cause and blocker register

| ID | Finding / status | Evidence and implication | Resolution criterion |
|---|---|---|---|
| **D-001** | Relative contrast is not heading-only weight; **OPEN** | R-010: all five identical-heading pairs flip from Match to Review when the body becomes bold. A bold body may create a separate compliance finding; it cannot change the heading’s source weight. | A new heading classifier preserves its answer when identical heading pixels are paired with different bodies, and still separates heavy regular from narrow bold. |
| **D-002** | OCR segmentation/region coupling; **OPEN, earlier colon repair PARTIAL** | R-003 repaired some colon/glyph cases. R-010’s stricter body locator rejects Bruery’s normalized `consump` + `tion` tokens. Six of 75 bold cases fail localization, while another 22 produce below-cutoff measurements. | Recover supported region failures while keeping exact warning-text validation separate. Semantic decoys must remain non-Match. This does not by itself resolve R-010’s 22 measured misses. |
| **D-003** | Benchmark duplication and limited independence; **PARTIAL** | Original v4 has 80 rows but 70 unique images. The later stroke set has 160 unique image hashes. Repeated layouts within one font remain correlated, even after deduplication. | Verify actual font files and pixel hashes; keep families/source groups separate across development and holdout; disclose correlation. A new holdout is still needed for any future candidate. |
| **D-004** | Real-label expected results absent; **OPEN** | Ten real assets remain unscored; two are fronts with no warning. The existing inspected packet is development material. OCR readability or COLA approval is not independent weight ground truth. | Independent reviewed annotations, with ambiguity/readability recorded. Keep ambiguous cases in coverage reporting but outside clear-bold/regular accuracy denominators. |
| **D-005** | Mixed timing scopes and cached results; **OPEN** | Local matcher milliseconds, API-only timings, warm samples, cached preview results, and 300-image accounting measure different things. None establishes replacement click-to-result p95. | Three uncached browser runs on the qualified clear set, including initialization, failures and timeouts; p95 ≤5 s; report first-use loading separately. |
| **D-006** | Provider availability interrupted R-006; **OPEN for future service use** | HTTP 401 / code 10000 stopped the context comparison; quota and deadline failures must remain unresolved. These are distinct from typography errors already measured. | Verify access before any newly authorized service experiment. Do not spend quota rerunning R-006 solely because access was restored. |
| **D-007** | Stale recommendations cause repeated work; **RESOLVED as documentation process, 2026-09-23** | Earlier `boldness-next-step.md` points to work later covered by R-003; the detector audit proposes legacy OCR already rejected by R-008. | This current index and repository instructions supersede stale “next step” prose. Future experiments must keep this list current; this is a process safeguard, not a detector fix. |

## Evidence notes for experiments not yet archived on GitHub

The numerical record above is intentionally self-contained. The following artifacts were inspected in the local research checkout when creating this list, but their experiment commits or uncommitted files are **not part of this documentation-only publication**. Paths below identify local files, not working GitHub download links. Preserve and publish a reviewed experiment bundle separately before claiming a fresh-clone reproduction. The existing published reports linked above remain available on GitHub.

### R-006 contextual single-model evidence

Local source: `evidence/appearance-context-evaluation.md`, with `appearance-context-development-frozen.json`, `appearance-context-development-run.json`, and `appearance-context-development-summary.json`; recorded in local commit `7e91f69`.

Frozen input: one 1200×500 image containing a heading panel and warning-body context. Each model ran alone with BOLD/REGULAR/UNCERTAIN parsing and a four-second deadline. Eight Qwen and three Gemma requests exceeded the deadline. Completed-subset API p95 values were 4.142 and 4.120 seconds; these exclude browser initialization, OCR, proxy, and rendering. A partial 42nd case is excluded from the paired comparison and rejection bounds.

### R-007 rendered-reference evidence

Local source: `evidence/appearance-template-feasibility.md` and the associated protocol, input manifest, calibration and evaluation JSON; recorded in local commit `38a3408`.

ImageMagick/FreeType references and AppKit/CoreText queries used verified identical font files. Soft ink Dice compared whole headings after normalization to 40-pixel ink height and translations up to two pixels. Calibration froze similarity 0.80 and opposing-weight margin 0.18 before evaluation. Matching plus loading/normalization p95 was 7.296 ms locally, excluding OCR and browser execution. Fast classification with almost no useful coverage did not qualify.

### R-008 legacy Tesseract evidence

Local sources: `evidence/appearance-legacy-evaluation.md`, `appearance-legacy-protocol.json`, and `appearance-legacy-development.json`.

Native Tesseract 5.5.1, legacy OEM 0, PSM 7, full English traineddata. Both exact heading words needed confidence ≥80 and available bold attributes. Missing or mixed evidence became uncertain. Parser tests establish handling of attributes, not their real-world accuracy.

### R-009 FontDNA evidence

Source: prior project review and diagnostic output, without a frozen per-image result artifact. The [model card](https://huggingface.co/ClosedBrain/FontDNA-V2) describes word-local style predictions and declares MIT licensing; it does not substantiate our diagnostic outcomes or universal accuracy.

The FP32 ONNX adapter used grayscale word crops with aspect-preserving fit and padding, normalized input, and a fixed sigmoid threshold of 0.5 requiring both words to agree. Treat this as weaker evidence than the preserved experiments. A model card, license, and exposed boldness output are capability evidence only.

### R-010 stroke-comparison evidence

Local sources: `evidence/appearance-stroke-evaluation.md`, `appearance-stroke-root-cause.md`, `appearance-stroke-development.json`, `appearance-stroke-inputs-frozen.json`, frozen protocols, OCR evidence, and replay harness.

Threshold: **1.2000337970907018**, the next float above the largest measured regular development score. The zero-false-Match result is calibration by construction, not independent validation. The 150 known examples yielded 47 Matches and 103 Reviews. Eleven known examples lacked measurements. Ten additional real assets stayed unscored and unresolved. No new holdout, integration or deployment followed the failed gate.

Controlled renderer-location diagnosis, with identical heading crop dimensions and SHA-256 hashes within each pair:

| Font | Bold heading / regular body score | Identical bold heading / bold body score | Frozen decision change |
|---|---:|---:|---|
| Arial | 1.557853 | 1.131235 | Match → Review |
| Georgia | 1.381456 | 0.920694 | Match → Review |
| Superclarendon | 1.412571 | 1.069522 | Match → Review |
| PT Mono | 1.628957 | 1.084464 | Match → Review |
| TI-Nspire | 1.347046 | 0.883574 | Match → Review |

Perfect-location counterexample: regular `PT-Mono-cap-14-regular` scores **1.1213281481812258**; bold `TI-Nspire-cap-12-bold` scores **1.0454919242085374**. An upper cutoff cannot approve the latter while rejecting the former. Excluding bold-body examples still leaves only 31/35 bold scores above every regular score; 95% would require 34/35. The four overlapping positives are correlated TI-Nspire variants.

Provenance for later reconciliation with the original local files:

- Protocol SHA-256: `91f73f480bd5583569da4c3fae96f3436e95903dab4274d2f82912ae4ba12295`.
- Input manifest SHA-256: `c104735a9784e5b78b6e54973d36ea1b61b566333f2e21406144bab1c25c0284`.
- Development result SHA-256: `592f1b524680d656408291907d39bf4c47d3aa034fc7d8352dedf087d15f59bb`.

## Untested or excluded directions

Listing an option is not authorization to start it. Keep the current strictly free constraint, single bounded experiment, no additional model ensemble, and no mandatory human-confirmation substitute. A font-identification system was excluded earlier. Scope changes require a separate decision.

| ID | Direction / status | Relationship to prior failures | Smallest useful test or prerequisite |
|---|---|---|---|
| **N-001** | Tolerant warning-region alignment; **UNTESTED supporting fix** | Addresses D-002, not score overlap. Earlier colon recovery already exists under R-003. | Recover split-token and six bold localization failures; preserve semantic-negative wording checks. Do not treat guessed text as verified wording. |
| **N-002** | One task-specific heading-only classifier; **UNTESTED** | Uses features beyond R-010’s scalar ratio. Off-the-shelf R-009 does not establish whether task-specific training works. | Establish free local training/inference feasibility; retain hard regular/bold pairs, separate font families across splits, and test original-resolution/renderer changes before a full holdout. No accuracy or runtime promise. |
| **N-003** | Glyph-level reference alignment; **UNTESTED, scope decision needed** | Materially different from R-007’s whole-heading overlap, but requires reference coverage and potentially the excluded font system. | Cross-renderer same-font pairs plus unknown heavy regular negatives; verify font licensing. No catalogue expansion before separation is demonstrated. |
| **N-004** | Source PDF/SVG typography metadata; **UNTESTED, input-contract change** | Adds evidence unavailable in flattened image uploads. | Test embedded fonts, synthetic bold, outlined letters, and raster-only documents. Optional richer-input path, not a complete answer for arbitrary images. |
| **N-005** | Managed OCR font-style features; **NOT TESTED, EXCLUDED by strictly free constraint** | Purpose-built capability, not established accuracy on our labels. | Only reconsider if the cost constraint changes, then evaluate on the same hard negatives and independent gates. No guarantee follows from an API field named font weight. |
| **N-006** | `gaborcselle/font-identifier`; **REVIEWED ONLY, not integrated** | Its known-font classification is not open-world boldness. Prior audit found 48 output faces, incomplete regular/bold pairing and no unknown class. | New unknown rejection and external validation would expand scope. Do not describe model-card accuracy as our result. [Model card](https://huggingface.co/gaborcselle/font-identifier). |
| **N-007** | CONSENT context ensemble; **REVIEWED ONLY, EXCLUDED under current scope** | Relevant prior art; prior audit did not verify a usable checkpoint or code license. Training/reimplementation and another ensemble exceed the bounded plan. | Resolve artifact/license availability and scope before considering a probe. [Paper](https://arxiv.org/abs/2205.07683). |
| **N-008** | Mandatory human boldness confirmation; **EXCLUDED as completion strategy** | Reduces automatic approvals by handing the decision to a person. It does not deliver automated boldness. | Preserve separate human observations for Review cases; do not change the automatic verdict or call the requirement complete. |

Public take-home implementations were also reviewed, not validated as solutions: [qpher](https://github.com/qpher/ttb-label-verify) used paid vision with no regular-heading negative in the inspected eight-case evaluation; [Lord-Gusarov](https://github.com/Lord-Gusarov/ttb-label-check) supplied the stroke-comparison idea with six thickness tests in one font; [christensenca](https://github.com/christensenca/ttb-label-verification) allowed unknown style to pass in the inspected comparison logic. These are historical source-review findings; upstream may change. Do not reclassify source inspection as a successful benchmark.

## Gates that remain in force

- Freeze method, prompt if any, preprocessing, quality rules and acceptance rules before independent evaluation.
- At least 40 clear bold and 40 regular examples from font families excluded from development; verify font-file provenance and rendered-image uniqueness. Require zero regular false Matches and at least 38/40 bold Matches. Report per-category errors and Review rates.
- Include heavy regular, narrow bold, mixed fonts, different sizes, small capitals, inversion, JPEG degradation, and bold bodies. Bold-body stress cases test heading classification, not overall warning compliance.
- Add independently reviewed real-label cases; keep ambiguous/unreadable cases visibly unresolved and outside clear-label accuracy counts.
- Preserve text, uppercase, numeric and semantic regressions. Require the uncached browser timing evidence in D-005.
- Only after a pass: integrate once, run the suite/build and sample/semantic/300-image checks on the final preview, verify exact source and anonymous access, and follow Treasury deployment safety. A failed development gate stops before holdout or release.
- These are engineering criteria, not employer-specified numeric thresholds or proof of 100% accuracy on arbitrary images.

## Template for the next entry

```text
ID / parent ID:
Date / owner:
Status:
Hypothesis and changed mechanism:
Related prior failure and why this is not a repeat:
Smallest disconfirming test / stop rule:
Frozen code, model, prompt, preprocessing and input identifiers:
Dataset and exposure status (development / independent / unscored):
Results: bold matched / total; regular false Matches / total; Review; errors/timeouts:
Timing scope and initialization/cache handling:
Root cause: confirmed / supported / unknown; supporting counterexample:
Evidence location and availability:
Decision and concrete reopening condition:
Runtime / deployment impact:
```

## Decision history

- **2026-09-23:** Created the canonical Resolutions List from existing reports, measurements, and prior review. Recorded R-001 through R-010, D-001 through D-007, and N-001 through N-008. Added the read-before-experiment/update-at-closeout rule. No new detector experiment, runtime change, or release qualification is implied by this documentation update.
