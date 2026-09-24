# Assignment benchmark and execution checklist

> **Current release:** the working triage UI is deployed and source identity is reconciled below. Automated boldness remains incomplete; the latest production sample timed out on appearance. Consistent full-check five-second performance remains unproven.

## UI release verification, September 23, 2026

This update supersedes the earlier live-source uncertainty, not the recorded detector limitations. The working application is now deployed from source `a61f00a30b93aec2e0d0c0c232fc55cb3e73b8c5` to the **treasury-label-review** project, deployment `dpl_2j1z7TP5wBSwDk6e6tTMGuXMKF34`, bundle `index-BPAZG5W4.js`. [Production evidence](evidence/pile-ui-production.json) and [browser checks](evidence/pile-ui-release.md) record the scope.

- **1, 2:** comparison and normalization logic are unchanged from `2a46749`. Current CSV and XLSX browser tests verify real artwork and correct per-file expected values. Prior field/normalization evidence still has its stated scope.
- **3: INCOMPLETE.** Detector unchanged. Current public sample's appearance check timed out; it remained Needs review. No human decision is counted as automated verification.
- **4: NOT REVERIFIED IN FULL on this release.** The OLD TOM text flow works, but the current appearance timeout prevents claiming all required checks passed.
- **5: PARTIAL.** Current production click-to-result was 5.198 seconds, including a 4.542-second appearance request that timed out. Consistent full-check five-second performance is not established.
- **6:** current CSV/XLSX real three-image flows and 300-row UI accounting passed. Earlier actual 300-image pipeline evidence remains historical; the detector/OCR pipeline is unchanged.
- **7:** current real upload, sample, details, evidence, decisions, cancel/reset protection, batch errors, keyboard fixture and reload checks passed. The permanent light board and requested pile layout remain.
- **8:** same-origin dependencies, server secrets and Worker/API are unchanged. Unavailable checks now have a clear notice. README describes crop transmission and session-only data.
- **9:** published source was reproduced in a clean directory: npm ci, 94 tests and build passed. README now matches spreadsheet intake and human decisions.
- **10:** anonymous main-domain application returned 200 with the expected bundle and was exercised in a browser. Main homepage portrait and primary links remain present. This is an accessible partial prototype, not completion of requirements 3–5.

## Source and objective

Use only [the original assignment](ASSIGNMENT.md), preserved from
`treasurytakehome-rgb/instructions` revision
`62bd63cd2f6b5af088b1d3c3b039c48cfcb012ef`, as the product rubric.

Deliver a working, standalone AI-powered prototype that compares alcohol-label
artwork with application details, gives useful findings in about five seconds,
handles batch uploads, and is simple for nontechnical reviewers. Provide source,
setup instructions, documented assumptions, and an accessible deployed URL.

The following acceptance examples operationalize the assignment. They are our
verification choices, not additional requirements or a claim about a hidden grader.

## Execute in this order

For each item: inspect the implementation, reproduce the gap, fix it, test the
complete user flow, and record evidence before marking it passed. Keep the live
prototype available while preparing the replacement.

| ID | Assignment source and outcome | Concrete work and evidence to finish | Methods attempted (numbered) | Current status |
| --- | --- | --- | --- | --- |
| 1 | Sarah: compare artwork with application. Additional context lists brand, class/type, alcohol content, net contents, producer/address, import country. | Verify observed artwork against each submitted field. Exercise correct and incorrect values, missing information, domestic/imported cases, and explicitly identified alcohol-content exceptions. Show uncertainty honestly. Fix extraction/comparison failures demonstrated by those cases. | 1. Field comparison and semantic-decoy regression checks.<br>2. Real image uploads with CSV/XLSX per-file application values. See [release checks](evidence/pile-ui-release.md). No separate R-series detector method resolves field extraction. | MET WITHIN TESTED SCOPE: image uploads, application fields and sample workflow have browser evidence. Field comparisons and targeted importer-address, company-name and unrelated-percentage decoys passed. OCR limitations remain. See evidence/appearance-neighbor-preview-regressions.json and recorded production verification; the changed live bundle has not been fully reverified. |
| 2 | Dave: STONE'S THROW and Stone's Throw mean the same brand. | Verify this exact capitalization example and a genuinely different brand through image review. Do not let normalization conceal an actual difference. | 1. Case/punctuation normalization tested with matching and different brands. See [browser evidence](evidence/local-ui-followup.json). No separate R-series experiment. | MET IN RECORDED CHECKS: capitalization normalization and genuinely different-brand checks passed, including the local two-image browser flow. See evidence/local-ui-followup.json. This is tested behavior, not a universal OCR accuracy claim. |
| 3 | Jenny: warning must be exact, with GOVERNMENT WARNING: uppercase and bold. | Verify correct, missing, altered-wording, title-case, and regular-weight warning artwork. Implement the missing boldness check. Keep unresolved readings visibly unresolved; human confirmation does not prove automated detection. Explain any OCR normalization in assumptions. | 1. R-001: Llama vision prompts, failed.<br>2. R-002: Qwen/Gemma consensus, false approvals.<br>3. R-003: single-I glyph guard and localization repairs, partial.<br>4. R-004: multi-glyph fallback, accuracy/latency failed.<br>5. R-005: neighbor-bounded glyph recovery, false approvals.<br>6. R-006: contextual single-model inference, failed.<br>7. R-007: rendered-reference pixel matching, failed.<br>8. R-008: legacy Tesseract font attributes, failed.<br>9. R-009: FontDNA style model, failed diagnostic.<br>10. R-010: relative ink/skeleton thickness, failed.<br>11. R-011: frozen MobileNet encoder with trained head, failed.<br>12. R-012: all-feature MobileNet fine-tuning, failed.<br>13. R-013: saved-score audit, cutoff repair ruled out.<br>14. R-014: systematic boundary replay, local wrong decisions reproduced; timeout routing verified.<br>15. R-015: exact-height diagnostic stopped at input controls.<br>16. R-016: renderer substitution insufficient.<br>17. R-017: heavy regular maps near bold training features.<br>18. R-018: four-example coverage intervention failed.<br>19. R-019: matched-pair ordering already correct; ranking-only repair unsupported.<br>20. R-020: training-only normalization refresh failed; false approvals persisted. See [full results and next decisions](#attempt-history). | INCOMPLETE: exact warning wording and uppercase checks are implemented and tested, including missing/altered wording and title-case cases. Boldness remains unreliable: the recorded deployed-method evaluation had 37/40 bold Matches and three regular false Matches (before duplicate correction). No replacement qualified. The latest local R-011 frozen-encoder experiment failed even with perfect locations: 23/40 bold Matches and 2/40 regular false Matches. Its diagnosis found no simple input/label defect in five audited examples. Human observations remain separate; see [attempt history](#attempt-history) and the local-evidence note below. |
| 4 | Sample: OLD TOM DISTILLERY, Kentucky Straight Bourbon Whiskey, 45% Alc./Vol. (90 Proof), 750 mL, standard warning. | Run the supplied-style sample through the full implementation, including warning appearance. Confirm the artwork and submitted values agree. | 1. Complete OLD TOM production sample, 2.4 s in recorded run.<br>2. Current-release sample, 5.198 s with appearance timeout. See [production evidence](evidence/pile-ui-production.json). Sample success does not resolve R-001–R-013 failures. | MET IN RECORDED PRODUCTION TEST: the OLD TOM sample completed all applicable checks in 2.4 seconds with uncached appearance inference. See evidence/production-sample-2026-09-23.json. One successful sample does not qualify general boldness accuracy or the changed current deployment. |
| 5 | Sarah: results in about five seconds. | Time Review click through all required findings on clear representative artwork. Include startup conditions and report environment, actual timings, and limitations. Fix sustained delays. | 1. R-004: multi-glyph/cloud path, browser p95 5.5 s.<br>2. R-005: neighbor recovery, timeouts persisted.<br>3. R-006: single-model path, misses/timeouts; API timings exclude browser work.<br>4. R-007–R-012: local alternatives rejected on accuracy before browser qualification.<br>5. Current sample: 5.198 s with timeout. [Timing blocker D-005](#root-cause-and-blocker-register). | PARTIALLY MET: recorded production sample 2.4 seconds; final-preview sample 5.237 seconds with an appearance timeout. Other runs exceeded five seconds or timed out. Representative uncached tail latency remains unproven. Local classifier replay and warm OCR timings do not establish browser performance. See evidence/appearance-neighbor-evaluation.md. |
| 6 | Sarah: batch uploads in the context of 200–300 applications. | Upload a batch with separate application values, complete processing, and verify correct association and retained results. Demonstrate the mentioned scale using actual image reviews. Report duration and size limits. | 1. Actual 300-image preview, 195.3 s and 900 correct field associations.<br>2. Stop and invalid-CSV checks.<br>3. Current CSV/XLSX three-image flows and 300-row UI accounting. These are processing tests, not detector qualification. | MET FOR PROCESSING AND ACCOUNTING: the tested runtime retained 300 unique results in final preview in 195.3 seconds, with zero processing failures and 900 correct application-field associations. Stop retained completed results; invalid CSV blocked processing. This establishes batch handling, not classification accuracy. See evidence/appearance-neighbor-preview-300.json. |
| 7 | Sarah: clean, obvious interface for mixed technical comfort. Evaluation: UX and error handling. | Verify sample, upload, entering details, finding a discrepancy, inspecting artwork, batch review, and recovering from invalid/unreadable input. Check narrow layout and keyboard operation as practical usability evidence. | 1. Browser workflow, keyboard and narrow-layout checks.<br>2. Permanent light pile-triage UI, upload instructions, decision dialog and reset/cancel protection.<br>3. Current release browser checks. See [UI evidence](evidence/pile-ui-release.md). | PARTIALLY VERIFIED: recorded workflow, error handling, stale-result clearing, keyboard and 390-pixel layout checks passed. No representative-user usability study has been performed. The live page now has a changed interface and bundle; earlier browser evidence does not fully verify that version. See evidence/local-ui-followup.json and evidence/release-verification.json. |
| 8 | Marcus: standalone prototype, sensible security, firewall awareness. Technical requirements allow any stack. | Keep credentials out of client code, avoid sensitive-data storage, and verify/document runtime network dependencies. If cloud processing is added, explain it accurately and handle failure visibly. | 1. Same-origin OCR/proxy, bounded requests and server-only secrets.<br>2. Visible unavailable-service handling and session-only decisions.<br>3. R-006 exposed provider availability failure; [D-006](#root-cause-and-blocker-register) retains that limitation. | MET IN TESTED IMPLEMENTATION: standalone prototype without COLA integration; same-origin OCR assets/proxy, bounded payloads, server-only secrets and visible service failures. Cloud boldness inference remains a network dependency. The changed live bundle needs source reconciliation before carrying all implementation assurances forward. |
| 9 | Deliverable 1: all source, README setup/run instructions, brief approach/tools/assumptions. Evaluation: code quality and appropriate scope. | Ensure submitted repository contains the final implementation. Reproduce setup/build/tests from clean source and verify documentation reflects actual behavior and trade-offs. Review changed code and resolve confirmed defects. | 1. Clean install, tests and build on recorded source snapshots.<br>2. Current UI source reproduction: 94 tests and build passed.<br>3. Numbered R-001–R-013 history consolidated here; unpublished research artifacts remain explicitly identified. | MET WITH RECONCILIATION NEEDED: GitHub repository visibility verified PUBLIC. Source, setup instructions, approach, assumptions and limitations are available. Recorded release source 2a46749 passed 77 tests and clean build/review; the later isolated experiment worktree passed 83 JavaScript tests, 13 Python tests, build and local browser smoke. Latest experiment/diagnosis artifacts remain local. Current live-source identity and documentation must be reconciled; these test counts describe different snapshots. |
| 10 | Deliverable 2: working deployed URL evaluators can access and test. | Deploy the tested implementation to the app project, verify anonymous access and correct/incorrect/batch flows, and confirm deployment corresponds to submitted source. Provide repository and application URLs. | 1. App-project preview and anonymous production checks.<br>2. Current UI source/bundle reconciliation and main-domain browser verification. See [production evidence](evidence/pile-ui-production.json). Detector experiments R-011–R-013 were not deployed. | ACCESSIBLE NOW; CURRENT FUNCTIONALITY PARTLY UNVERIFIED: public custom-domain page returned HTTP 200 without authentication. It serves index-BFX-QVJC.js, different from index-DGAUEOgM.js in the recorded release evidence. Do not claim the current page is verified source 2a46749. Fresh source/deployment mapping and functional checks remain pending. Automated boldness remains incomplete. |

## Authorized detector follow-up: R-012 rejected

The user lifted the earlier detector restriction. One preregistered local all-feature fine-tuning experiment was executed within free resources. It failed on retained heavy-regular examples despite passing calibration. [Results](evidence/appearance-finetune-evaluation.md) preserve the exact errors and stop decision. No runtime replacement was made. Requirements 3 and 5 remain unresolved; the current sample's required appearance check remains unverified. Further UI changes do not close these gaps.

## Latest local evidence and publication scope

The existing ten-row table groups the eleven plain-language requirements: image intake is included in row 1, wording and heading appearance share row 3, and the supplied sample has its own row 4. No assignment requirement was removed.

R-011 and the representation diagnosis are preserved locally on `codex/heading-classifier-probe` in the `treasury-label-review-mobilenet` worktree, commits `ed1be61` and `58ca8c9`. Local reports are `evidence/appearance-mobilenet-evaluation.md` and `evidence/appearance-diagnosis.md`; they are not published GitHub links in this documentation update. The fresh native replay reproduced all 1,438 decisions exactly, which establishes reproducibility, not accuracy. Provisional agent review of ten real assets found six bold, two ambiguous and two absent headings, with no clear regular negative. User manual annotations and independent real-label qualification remain pending.

Decision: no further detector experiment under the current rapid-implementation scope without an explicit scope change. Preserve unresolved findings as Review. No candidate integration or application deployment was performed as part of these experiments or this status update. Later sections below preserve historical evidence; this dated status table takes precedence for current claims.

## Scope boundaries from the assignment

- Azure, .NET, COLA integration, FedRAMP, government production retention, and
  enterprise procurement are background context, not prototype deliverables.
- Recovery of badly angled, poorly lit, or glare-obscured photographs is explicitly
  described as potentially outside scope. A useful unreadable-image response is
  sufficient without promising image restoration.
- The common-field list is reference context. Address it in the prototype and
  explain assumptions; do not build a complete beverage-regulation engine.
- Additional label fixtures and TTB research are encouraged. No particular fixture
  count, font matrix, external usability recruitment, percentile, or cold/warm trial
  count is prescribed.
- Multiline brands, ABV prefix notation, and US fluid ounces are useful test cases,
  not separately enumerated assignment requirements. Fix them when necessary for
  the supported label workflow; do not represent them as explicit rubric items.
- Cloudflare, a particular vision model, a 1 MB crop limit, 10-second timeout,
  200 MB aggregate batch threshold, and cloud quota experiments are implementation
  decisions. They must not become independent product requirements.

## Existing user constraints, separate from the assignment rubric

Continue using free services only. Preserve the chosen native white/silver UI,
the unlisted app/custom-domain arrangement, and the main website deployment safety
rules. These constraints govern execution without adding assignment scoring items.

## Evidence and completion rule

Record the implementation commit, tested environment, inputs, observed results,
and material limits beside each completed item. Tests count only for the behavior
they actually exercise. Code review is not evidence of full assignment completion.
Documenting a missing core behavior does not turn it into a pass.

Stop adding features once items 1–10 have passing, relevant evidence and the
repository and deployed app match. Report any remaining uncertainty explicitly.
Do not promise an unpublished evaluator score.

## Existing evidence and historical notes

- [UI verification](evidence/ui-native-workspace.md): focused local browser checks.
- [Fixture preparation](evidence/gate-0-preparation.json): preparation, not model performance.
- [Superseded internal gates](evidence/superseded-acceptance-plan.md): historical only.
- Cloudflare main MCP authentication succeeded after the historical auth failure;
  this does not establish vision correctness, speed, or capacity.

- [300-image OCR diagnostic](evidence/ocr-corpus-run.md): all images processed without errors in 150.533 seconds. This establishes Node pipeline execution only. Browser batch proof, automated typography, and unresolved extraction cases remain open. US fluid-ounce comparison now has unit and browser regression evidence.

## Current integrated evidence (September 22)

- [Full browser capacity and findings](evidence/browser-integrated-300.json): includes actual cloud calls and all uncertainties.
- [Additional field images](evidence/field-image-followup.json): actual negative and exception cases.
- [Complete sample timing](evidence/local-integrated-sample.json): successful full review and the preceding deadline failure.
- [Clean reproduction and code review](evidence/clean-reproduction.json).
- [Appearance decision](evidence/appearance-method-decision.json): why unguarded consensus was rejected and the conservative guard retained.

Prototype limitations remain material: typography sometimes stays unresolved on
clear bold labels, provider queueing causes deadlines, and two corpus fluid-ounce
units remain unreadable. They are visible review items, not hidden passes.

The unreleased multi-glyph candidate is documented in
[local evaluation](evidence/appearance-multiglyph-evaluation.md) and its
[first real-service preview run](evidence/appearance-multiglyph-preview-run1.json).
That run failed the internal accuracy and latency gates. The requirement that
each of three uncached runs pass makes further runs unable to qualify this
candidate. The current production deployment remains unchanged.

## Published release

[Public app](https://label-review-7b3.lucaschatham.com/) and [source](https://github.com/lucaschatham/treasury-label-review/tree/c3ebde8cd36065d917677787f195b1dab46929b9) were verified September 22. [Current release evidence](evidence/partial-release-verification.json) records production deployment `dpl_5oguVG5be6SRt89W9gb3YGwbm9ze`, Worker version `2d252cac-77c6-4bc2-8958-218df1a074fd`, source and bundle identity, preview testing, anonymous production testing, crawler exclusions, and preservation of the separate homepage. [Earlier release evidence](evidence/release-verification.json) is historical, not the current deployment.

## September 23 follow-up: replacement rejected

[Evaluation and release decision](evidence/appearance-neighbor-evaluation.md):
local v3 bold eligibility improved from 38/40 to 39/40 without lowering weight
thresholds. The next preview returned 37/40 bold Matches and three regular false
Matches; two named bold regressions also timed out. These fail the retained
engineering release requirements. No promotion occurred.

The [fresh 300-image preview audit](evidence/appearance-neighbor-preview-300.json)
verified every filename and 900 application-field associations on final source
`2a46749`, with zero processing failures or missing/duplicate results. This closes
the candidate accounting check, not appearance accuracy, uncached latency, or
assignment completion. Human confirmation, stale-result clearing, invalid CSV
rejection, semantic decoys/conflicts and corrupt-image handling have current
preview evidence in the linked evaluation.

# Attempt history

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
| **N-002** | One task-specific heading-only classifier; **TRIED in R-011 and R-012, both failed** | Uses features beyond R-010’s scalar ratio. Off-the-shelf R-009 does not establish whether task-specific training works. | Establish free local training/inference feasibility; retain hard regular/bold pairs, separate font families across splits, and test original-resolution/renderer changes before a full holdout. No accuracy or runtime promise. |
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

### R-012 preregistration, September 23

User lifted the detector restriction and authorized fixes within free services and the original requirements. R-011 local diagnosis was read: no simple pixel/label plumbing error was found; frozen features did not generalize heavy regular versus narrow bold. **R-012 is PLANNED:** one bounded all-feature fine-tuning run, using the existing exposed development partitions, fixed optimizer/epochs and unchanged strict challenge gates. See [protocol](evidence/appearance-finetune-plan.md). This is not a rerun of the frozen encoder, another prompt, or a threshold change. No runtime change is authorized by a failed result.

### R-012 closeout, September 23

**FAILED development gate.** All-feature fine-tuning passed calibration (128/128 bold, 0/128 regular false Matches), but retained stroke controls had 40/40 bold and **10/40 regular false Matches**; historical renderer controls had 31/35 bold and 1/35 regular false Match. Century controls passed 4/4 bold, 0/4 regular false Matches. Heading/body invariance passed. The fixed training run took 52.267 seconds locally, not browser latency. See [evaluation](evidence/appearance-finetune-evaluation.md), [frozen protocol](evidence/appearance-finetune-protocol.json), and [per-image results](evidence/appearance-finetune-development.json). No cutoff tuning, independent holdout, integration or deployment followed. Generalization remains unresolved; training success did not establish task success.

## R-013: retrospective score-separability audit (completed diagnostic)

- Mechanism: analyze saved R-011/R-012 scores and frozen input identities, without retraining or tuning. Preregistered in `evidence/appearance-score-audit-plan.md`.
- Result: R-012 original cutoff detects75/79 bold but falsely approves11/79 regular. A hindsight zero-false-positive global cutoff retains at most55/79 bold (51/74 unique tensors). Raising confidence cannot meet the internal target on this exposed set.
- Error transitions:25 bold rescued,10 new false approvals,1 false approval fixed,1 retained. Failures concentrate in Superclarendon, Georgia, and TI-Nspire; within-family overlap remains in Superclarendon and TI-Nspire.
- Root cause boundary: localization alone and global threshold adjustment cannot resolve perfect-location score overlap. Renderer versus family causality remains unproven.
- Evidence: `evidence/appearance-score-audit.md`, `evidence/appearance-score-audit.json`, `scripts/experiments/audit_scores.py`, `test/score_audit_test.py`.
- Next reopening condition: a32-image matched font/renderer/resolution diagnostic using exposed families, frozen checkpoint and original cutoff. Register and verify pairs before inference. No retraining, holdout access, cloud usage or production changes in this audit.


### R-011 frozen-encoder closeout (consolidated record)

Frozen MobileNet features plus a trained logistic head: calibration 104/128 bold, 0/128 regular false Matches; challenge 50/79 bold, 2/79 regular false Matches. Perfect-location subset: 23/40 bold, 2/40 regular false Matches. Five audited examples showed no simple pixel/label plumbing defect. Failed generalization led to R-012 all-feature fine-tuning, which also failed. Original local source and publication limits are recorded above under Latest local evidence and publication scope. R-013 preserves the saved-score comparison; no candidate was integrated.

## R-014: systematic debugging, boundary isolation

Preregistered diagnostic: trace production appearance routing separately from the rejected R-012 classifier. Hypothesis A: a production timeout is mapped to Review independently of typography correctness. Test the existing Worker and finding functions with controlled provider completion/deadline inputs, without cloud calls or changing deadlines. Hypothesis B: retained R-012 wrong decisions reproduce from hash-verified saved tensors and checkpoint on CPU, placing the failure before UI/API mapping. Replay four exposed challenge examples (two regular false approvals, one missed bold, one passing bold control) at the original cutoff. No fitting, holdout, production inference, or runtime edits. Stop after reporting the boundary reached; do not infer renderer causality from this replay. These are diagnostic reproductions, not new model candidates or accuracy qualification.

R-014 closeout: four hash-verified CPU replays retained all four decisions (two false approvals, one missed bold, one correct bold). Three mocked boundary assertions passed. This isolates local classification failures from production service timeouts, without establishing a unique model root cause. See [systematic-debugging findings](evidence/appearance-systematic-debugging.md) and [replay results](evidence/appearance-systematic-replay.json). No fix, training, deployment or cloud use occurred.

## Requirement 3: TDD implementation plan

[Planned RED/GREEN sequence](docs/plans/requirement-3-tdd.md) applies the test-driven-development skill to R-014's reproduced failures. First assert desired decisions using real inference, rather than merely asserting that wrong decisions reproduce. Preserve passing positive controls so reject-all cannot satisfy the suite. The 32-image diagnosis precedes choosing a mechanism change; independent qualification remains separate from regression tests. Planning only: no new attempt number, model result or completion claim.

## Fresh completion verification, September 23

Applied verification-before-completion: [claim-by-claim results](evidence/requirement-3-verification.md). Fresh npm test: 94 passed; build: passed with chunk-size warning. Real local candidate replay still falsely approves two regular examples and misses one bold example, with a correct positive control. Requirement 3 remains incomplete. The TDD plan and 32-image diagnostic are not executed; successful software checks do not qualify detector accuracy. No runtime change or deployment.

The [executable next-step specification](docs/plans/requirement-3-tdd.md#executable-next-step-isolate-the-existing-rendering-paths) now identifies the actual Pillow/ImageMagick paths and controls font face identity, measured cap height, word placement and crop policy. It combines all three skills: investigate a causal hypothesis, test harness behavior before implementation, and require fresh evidence before claiming diagnostic or product completion. This is planning, not another attempted detector or a passing result.

## R-015 preregistration: controlled Pillow/ImageMagick diagnostic

Execute the previously specified 32-input experiment on exposed Arial, Georgia, Superclarendon and TI-Nspire faces, regular/bold, 12/24 measured cap pixels. Parent R-014. Freeze R-012 checkpoint/cutoff; no training or threshold selection. Verify source font hashes and explicitly extract collection faces to avoid fallback. Match ink measurement, word placement and padding. Stop before scoring on invalid pairs. Score once only after visual inspection. This isolates rendering-path sensitivity, not independent generalization. Preserve all outcomes and record unresolved causes.

R-015 closeout: **STOPPED before diagnostic inference, input-control failure.** Five harness validation tests went RED then GREEN. Four real-inference expected-behavior tests produced three expected failures and one passing control. Exact 12px Georgia regular was unattainable in the tested ImageMagick size search, including fractional sizes; observed cap height jumps from 11 to 13 pixels. No valid full 32-case manifest, new-input scores, training or deployment. [Execution evidence and proposed protocol correction](evidence/r015-controlled-diagnostic.md). Reopen with a preregistered common-attainable-height selection rule before scoring; do not resize or silently relax matching.

## R-016 preregistration: common attainable cap heights

Parent R-015. Change only the impossible exact-height requirement: for each family, intersect measured H heights across regular/bold and Pillow/ImageMagick at integer point sizes 7–64. Select the nearest shared height to 12 within 10–14 and to 24 within 22–26, lower height wins ties. Stop if either intersection is empty. Freeze selections before classification. Keep font hashes, packing, checkpoint and cutoff unchanged. One 32-input CPU inference pass after visual inspection, no training, cloud or holdout use. This tests controlled rendering-path sensitivity, not general accuracy.

R-016 pre-inference amendment: visual inspection rejected the initial prepared inputs. ImageMagick sometimes emits I;16 PNG; direct Pillow RGB conversion clipped grayscale antialiasing to two levels. A real-renderer test failed (2 levels), then passed with explicit 8-bit RGB PNG output (191 levels for the retained Georgia control). Corrected inputs will be regenerated separately before the sole inference pass. Initial inputs remain unscored. This is a newly demonstrated diagnostic-adapter defect, not an established cause of historical model or production failures.

R-016 closeout: **completed diagnostic; detector remains unqualified.** Corrected 8-bit PNG inputs passed visual inspection and were scored once. Both paths detect 16/16 bold, but falsely approve all four Superclarendon regular examples, including both 24px cases; zero paired verdict flips. Renderer substitution alone cannot fix this controlled failure. Nine harness tests pass. Original expected-behavior detector regressions remain unresolved. [Results, limits and next decision](evidence/r016-common-height-results.md). No training, runtime change or deployment.

## Next decision after R-016: inspect learned training coverage

Applied systematic-debugging, TDD and verification-before-completion to select a [bounded frozen-feature coverage audit](docs/plans/requirement-3-next-decision.md). Fresh source-header check: historical challenge inputs are 80 RGB and 78 RGBA, not I;16. Existing regular serif training examples already classify correctly; missing heavy-regular coverage remains a hypothesis, not a finding. Next: inspect nearest regular/bold training examples in frozen feature space for failed Superclarendon and passing controls, without training or holdout access. Planning only; no R-017 result claimed.

## R-017 preregistration: frozen-feature neighbors

Parent R-016. Active goal and execution stages: [requirement 3 goal](docs/plans/requirement-3-goal.md). Hypothesis: retained heavy-regular controls map closer to bold than regular training examples in R-012's penultimate features. Extract classifier-input vectors in eval mode on CPU, L2-normalize, rank cosine distance by class with stable ID ties and identical tensor deduplication. Queries: eight Superclarendon and eight Arial R-016 controls. Gallery: exposed training only. Verify hashes, fixed checkpoint, and no fitting/holdout/cloud. Neighbors are descriptive evidence, not causal proof. Stop after one extraction pass and interpretation. Autoreview runs against committed diagnostic code separately.

R-017 closeout: frozen-feature extraction completed on 1,024 training inputs and 16 controls. All four regular Superclarendon controls are nearer bold training examples (Merriweather); all eight Arial controls are nearest the correct class. This supports representation/coverage investigation but is not causal proof. [Findings, cumulative exclusions and next intervention](evidence/r017-feature-findings.md). Three ranking tests went RED then GREEN. Autoreview found two harness defects, corrected without changing detector behavior. No classifier training, runtime change or deployment.

## R-018 preregistration: paired training-coverage intervention

Parent R-017. Execute [frozen paired protocol](docs/plans/r018-coverage-intervention.md): original 1,024 training inputs plus four equal-class slots in both arms. Baseline slots duplicate fixed original examples; treatment slots use exposed R-016 Pillow 24px Superclarendon/TI-Nspire regular/bold. Same initialization, seed, architecture, optimizer, batch size, epochs and step count. Original calibration policy, no retuning. Exclude exact treatment tensors from transfer evaluation in both arms; preserve original challenge cohort metrics. Stop on any remaining cohort failure. This is local development, not independent qualification.

R-018 closeout: **FAILED; no integration.** Four targeted training examples reduced false approvals but harmed recall: historical bold 26/35 baseline → 15/35 treatment; perfect-location bold 40/40 → 26/40, regular false Matches 5/40 → 1/40. Original challenge hindsight zero-FP ceiling fell 43/79 → 37/79. Both frozen-policy runs returned STOP. [Paired results and limitations](evidence/r018-coverage-results.md). Keep the goal active; requirement 3 remains incomplete. Autoreview defects in diagnostic reproducibility and resource accounting were fixed, with original result provenance retained.

Goal milestone: R-017 and R-018 completed with preserved evidence; requirement 3 remains **INCOMPLETE**. Autoreview corrections verified; final budget follow-up review at `56af286` exited 0 with no actionable findings. Detailed evidence scopes are in the R-018 report. The next goal phase is an evidence-backed architectural assessment of within-family weight learning; repeating the rejected four-example intervention is not permitted. No production changes.

## R-019: within-family ranking diagnostic

Initial read-only saved-score inspection found all matched bold/regular challenge pairs ordered correctly in R-012 and both R-018 arms. Validate pair identity, complete pairing and strict ordering with a tested report before using this observation to select another architecture. No training or thresholds changed. Parent R-018. Hypothesis under examination: missing within-family ranking is the remaining cause. If ordering is already correct, reject ranking-only retraining as unsupported; do not feed a ground-truth regular/bold twin to inference because the real input contract supplies no such reference.

R-019 closeout: **ranking-only repair unsupported.** Validated R-012 79/79 and R-018 baseline/treatment 93/93 matched pairs have bold scores above regular scores. [Pair-ordering evidence](evidence/r019-pair-ordering.md). Four harness tests pass. This does not qualify global decisions; source-family/condition score offsets remain. No reference twin is available in real inference. Next discriminating intervention: training-only BatchNorm statistics refresh with learned parameters frozen, before another architecture change.

## R-020 preregistration: isolate BatchNorm running statistics

Parent R-019. Test whether estimated normalization buffers, rather than learned parameters, explain score displacement in R-012. One training-only statistics refresh, no gradient/optimizer steps, same frozen checkpoint and original inputs. Put dropout and all non-BatchNorm layers in eval mode; reset/update only BatchNorm running statistics, weighting update momentum by batch size. Verify parameter bytes unchanged. Recalibrate once using the original policy, evaluate every original cohort and body invariant. Fixed batch32, original order, CPU, 600-second budget. Stop on any failed cohort; no repeated refresh/size search, no holdout, cloud or deployment.

R-020 closeout: **FAILED; no integration.** Training-only BatchNorm refresh preserved learned parameter bytes and changed buffers, but retained 10/40 perfect-location regular false approvals and 1/35 historical false approval. Historical bold improved only 31/35 → 32/35. [Results and provenance](evidence/r020-normalization-results.md). Thus stored-statistics refresh is insufficient; no repeat refresh or cutoff adjustment is justified. Goal remains active and requirement 3 incomplete.

Verification milestone: R-019 and R-020 autoreviews both exited 0 with no actionable findings. R-020 metrics were recomputed from per-image outputs, invariant flags and producing source hashes verified. All 78 historical RGBA source images are fully opaque, excluding alpha-discard as the explanation for those errors. The active goal is not complete; independent accuracy and integrated performance remain unqualified.

## Next decision after R-020: secure real-label ground truth

Applied all three requested skills to the remaining evidence gap. Fresh audit verified the ten existing packet images against their embedded source hashes. Provisional agent observations include four clear bold, two degraded bold, two ambiguous and two absent headings, with zero regular observations. They are not independent human answer keys. The [bounded next-step specification](docs/plans/requirement-3-ground-truth.md) prioritizes independent annotation, defensible regular negatives, a small balanced development set and one unchanged-baseline failure trace before selecting another mechanism. This is planning and packet-integrity verification, not a new detector attempt or accuracy result. R-020 remains rejected; requirement 3 remains incomplete.

Annotation intake follow-up: preserved the [local packet integrity audit](evidence/real-label-packet-integrity.json), including evidence availability, after autoreview identified missing provenance. Five annotation-validation tests went RED then GREEN. This guards future dataset counts; it is not a detector improvement. Independent human annotations and regular negatives remain pending.

Annotation intake closeout: autoreview accepted and resolved missing audit provenance, separate absent-heading coverage, and required rationale validation. Six focused tests pass after expected RED failures. Final review `autoreview --mode commit --commit HEAD` at `de243ec` exited 0 with no actionable findings. The packet was made available and independent assessment requested; no human answers or new accuracy result are implied.

## R-021 preregistration: broad training-family coverage

The user explicitly resumed automated engineering. The human-annotation gap does not block experiments with known source weights. Test [a matched-budget 16-versus-64-family intervention](docs/plans/r021-family-coverage.md), preserving original challenge/calibration and reserved families. R-018's four-image addition did not test this mechanism. Record both arms and stop on failed development gates; no production claim follows from training or harness tests.

R-021 closeout: **FAILED development gate.** Both matched-budget runs found 79/79 challenge bold. Baseline falsely approved 14/79 regular; expanded 64-family training falsely approved 12/79. Perfect-location false approvals stayed 10/40; historical fell 4/35 to 2/35. All body invariants passed. Runs took 223.98 and 224.00 seconds locally. Preserved per-image results and protocols: `evidence/r021-{baseline,expanded}-{protocol,result}.json`; expanded input/font provenance: `evidence/r021-expanded-inputs.json`. Asset preparation took 115.50 seconds. Original assets/baseline source is b380316; expanded training includes resource-reporting corrections at 6022a41. Follow-up autoreview at 4c51d99 exited 0 cleanly. No candidate qualified; no deployment.

## R-022 preregistration: cover known failing styles across conditions

R-021 broader unrelated-family coverage did not resolve the heavy-regular and small-serif errors. R-018's four clean 24px additions provided neither size/polarity coverage nor representative frequency. Add full balanced regular/bold examples for Superclarendon, Georgia and TI-Nspire across the same eight training heights, two polarities and PNG/JPEG, using verified existing source font faces. Preserve all original evaluation outputs and explicitly identify/remove exact training pixel overlap from the transfer gate. Exposed-family transfer is not family generalization; reserved font families remain untouched for subsequent qualification. Start from the same ImageNet checkpoint, 64-family data plus up to192 targeted examples, seed/optimizer/batch/1536 steps unchanged, one fixed final checkpoint and original calibration policy. Stop if any non-overlap cohort fails. No cutoff tuning, repeated seeds or new UI. This is an explicitly broader condition-coverage repair of R-018, not another four-example injection.

R-022 closeout: **FAILED, substantially improved.** 77/79 bold detected and 1/79 regular falsely approved, versus R-021 expanded 79/79 and 12/79. Remaining errors: Superclarendon inverted regular (0.975075), historical bold variants 1 (0.204383) and 2 (0.186116), cutoff0.286639. Calibration's maximum regular is Vollkorn 12px inverted JPEG. All body invariants pass; no exact training/evaluation pixel overlap. Training/evaluation219.62s. Preserved `evidence/r022-{protocol,result,targeted-inputs}.json`. Autoreview5576e2c clean. No independent qualification or integration.

## R-023 preregistration: canonicalize background polarity

R-022's remaining false approval is light-on-dark; its calibration maximum is also inverted. Weight should be invariant under exact pixel inversion. The existing input pipeline preserves polarity. Test a single deterministic transform: invert RGB values when median border luminance is below127.5, leaving light-background inputs unchanged. Verify exact-inverse pair equality and non-mutation first. Freeze R-022 weights; apply canonicalization to every calibration/challenge image, recalibrate once with unchanged policy, and evaluate all original cohorts and body invariants. No training, cutoff search, font conditions, holdout access or deployment. Stop on any failed cohort. This tests preprocessing polarity sensitivity, not another confidence adjustment.

R-023 closeout: **FAILED gate; polarity mechanism supported.** Canonicalization removes the inverted regular error and recovers both historical bold misses:79/79 bold. Original-policy recalibration yields cutoff0.048876 and two false approvals sharing identical heading pixels (Superclarendon same-family/bold-body regular, score0.095077). These previously stayed below R-022's cutoff. All invariants pass. Eight-second CPU evaluation, fixed weights, evidence `evidence/r023-result.json`. No challenge-derived threshold selection or independent qualification.

## R-024 preregistration: train in canonical polarity

R-023 demonstrates that normalization changes the input distribution and removes the inverted error, while its model was trained on mixed polarity. Train the same R-022 data from the original initialization with the same seed, optimizer, batch and1536 steps, applying the tested polarity normalization consistently to training/calibration/challenge. Same source images/labels; no added examples, threshold search or checkpoint selection. Recalibrate once by the original rule; stop on any failed cohort. This isolates training/preprocessing alignment after the frozen-weight intervention, not another unrelated architecture. Resource budget remains900s. Reserved qualification images remain unopened.

R-024 closeout: **FAILED original calibration gate; new representation is separable on exposed development.** 79/79 challenge bold,12/79 regular false approvals at original-policy cutoff0.001438. Challenge regular maximum0.866022; bold minimum0.996088. Unlike R-013's overlapping scores, an interval now separates all known classes. This does not justify calling exposed-data threshold fitting independent validation. Preserved `evidence/r024-{protocol,result}.json`; all invariants pass;221.41s. Autoreview976bb0a clean.

## R-025 preregistration: full exposed-development margin calibration, then untouched qualification

Reopen R-013 only because R-021/R-022/R-024 materially changed training coverage and input normalization and now produce nonoverlapping exposed challenge scores. The original R-012 cutoff impossibility remains true. Replace the four-family negative-only threshold with one deterministic threshold halfway in logit space between the largest regular and smallest bold score across all exposed calibration and challenge rows. Require strict separation; STOP if the interval is empty. Use all rows with unchanged labels; no exceptions or searched thresholds. Record the complete calibration cohort and both endpoints. Original challenge rows now contribute to threshold fitting and cannot be called independent evidence. Freeze checkpoint, preprocessing and threshold, then run the already frozen80-image independent-family protocol once. Its unchanged38/40-bold,zero-regular-false-approval gate decides qualification. No production claim follows from calibration.

R-025 closeout: **FAILED independent qualification.** Frozen cutoff0.9759449504262997 yielded31/40 bold,zero/40 regular false approvals. Nine misses span Domine and Karla; no cutoff was changed after seeing these outcomes. These80 images are now exposed development data. `evidence/r025-qualification-{manifest,result}.json` preserves the inputs and outcome. Preparation/inference used canonical polarity, but initial manifest omitted that field; preserve original artifacts and acknowledge that provenance limitation. Autoreview prompted a deterministic calibration CLI and explicit preprocessing freeze/verification for future runs. The CLI reproduces the exact original cutoff and model hash. No rerun, integration or deployment.

## R-026 preregistration: adapt font-domain features

R-025 failed family generalization. R-009 used FontDNA's unchanged style head; task-specific adaptation was not attempted. Freeze the verified FontDNA-V2 backbone and train only its existing320-to-160 GELU-to-bold head on the same67-family R-022 examples. Classify words separately; require both above the cutoff. Canonicalize polarity, trim packed word tiles to ink plus2px, aspect-preserving fit within40x320, align width to8, and apply documented per-crop mean/std normalization. Verify original head-logit parity against ONNX before training.

Pinned FP32 ONNX SHA256: 5f1feeb2f48346a08d0d7a0f26dbc4658347f6f5efe28fa21fb2200c361cc174. Expose its pooled320-vector without changing weights. Initialize the head from the original weights; AdamW .001, weight decay .01, batch128,50epochs, seed20260923, final checkpoint only,600s training and900s feature-extraction limits. Evaluate original calibration/challenge plus the failed independent80, which remain outside training but are now exposed development. Apply the predeclared margin rule only if all exposed heading scores strictly separate; STOP otherwise. No font lookup table, paid service, production change or independent qualification claim.
