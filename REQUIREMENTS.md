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

| ID | Assignment source and outcome | Concrete work and evidence to finish | Current status |
| --- | --- | --- | --- |
| 1 | Sarah: compare artwork with application. Additional context lists brand, class/type, alcohol content, net contents, producer/address, import country. | Verify observed artwork against each submitted field. Exercise correct and incorrect values, missing information, domestic/imported cases, and explicitly identified alcohol-content exceptions. Show uncertainty honestly. Fix extraction/comparison failures demonstrated by those cases. | MET WITHIN TESTED SCOPE: image uploads, application fields and sample workflow have browser evidence. Field comparisons and targeted importer-address, company-name and unrelated-percentage decoys passed. OCR limitations remain. See evidence/appearance-neighbor-preview-regressions.json and recorded production verification; the changed live bundle has not been fully reverified. |
| 2 | Dave: STONE'S THROW and Stone's Throw mean the same brand. | Verify this exact capitalization example and a genuinely different brand through image review. Do not let normalization conceal an actual difference. | MET IN RECORDED CHECKS: capitalization normalization and genuinely different-brand checks passed, including the local two-image browser flow. See evidence/local-ui-followup.json. This is tested behavior, not a universal OCR accuracy claim. |
| 3 | Jenny: warning must be exact, with GOVERNMENT WARNING: uppercase and bold. | Verify correct, missing, altered-wording, title-case, and regular-weight warning artwork. Implement the missing boldness check. Keep unresolved readings visibly unresolved; human confirmation does not prove automated detection. Explain any OCR normalization in assumptions. | INCOMPLETE: exact warning wording and uppercase checks are implemented and tested, including missing/altered wording and title-case cases. Boldness remains unreliable: the recorded deployed-method evaluation had 37/40 bold Matches and three regular false Matches (before duplicate correction). No replacement qualified. The latest local R-011 frozen-encoder experiment failed even with perfect locations: 23/40 bold Matches and 2/40 regular false Matches. Its diagnosis found no simple input/label defect in five audited examples. Human observations remain separate; see RESOLUTIONS.md and the local-evidence note below. |
| 4 | Sample: OLD TOM DISTILLERY, Kentucky Straight Bourbon Whiskey, 45% Alc./Vol. (90 Proof), 750 mL, standard warning. | Run the supplied-style sample through the full implementation, including warning appearance. Confirm the artwork and submitted values agree. | MET IN RECORDED PRODUCTION TEST: the OLD TOM sample completed all applicable checks in 2.4 seconds with uncached appearance inference. See evidence/production-sample-2026-09-23.json. One successful sample does not qualify general boldness accuracy or the changed current deployment. |
| 5 | Sarah: results in about five seconds. | Time Review click through all required findings on clear representative artwork. Include startup conditions and report environment, actual timings, and limitations. Fix sustained delays. | PARTIALLY MET: recorded production sample 2.4 seconds; final-preview sample 5.237 seconds with an appearance timeout. Other runs exceeded five seconds or timed out. Representative uncached tail latency remains unproven. Local classifier replay and warm OCR timings do not establish browser performance. See evidence/appearance-neighbor-evaluation.md. |
| 6 | Sarah: batch uploads in the context of 200–300 applications. | Upload a batch with separate application values, complete processing, and verify correct association and retained results. Demonstrate the mentioned scale using actual image reviews. Report duration and size limits. | MET FOR PROCESSING AND ACCOUNTING: the tested runtime retained 300 unique results in final preview in 195.3 seconds, with zero processing failures and 900 correct application-field associations. Stop retained completed results; invalid CSV blocked processing. This establishes batch handling, not classification accuracy. See evidence/appearance-neighbor-preview-300.json. |
| 7 | Sarah: clean, obvious interface for mixed technical comfort. Evaluation: UX and error handling. | Verify sample, upload, entering details, finding a discrepancy, inspecting artwork, batch review, and recovering from invalid/unreadable input. Check narrow layout and keyboard operation as practical usability evidence. | PARTIALLY VERIFIED: recorded workflow, error handling, stale-result clearing, keyboard and 390-pixel layout checks passed. No representative-user usability study has been performed. The live page now has a changed interface and bundle; earlier browser evidence does not fully verify that version. See evidence/local-ui-followup.json and evidence/release-verification.json. |
| 8 | Marcus: standalone prototype, sensible security, firewall awareness. Technical requirements allow any stack. | Keep credentials out of client code, avoid sensitive-data storage, and verify/document runtime network dependencies. If cloud processing is added, explain it accurately and handle failure visibly. | MET IN TESTED IMPLEMENTATION: standalone prototype without COLA integration; same-origin OCR assets/proxy, bounded payloads, server-only secrets and visible service failures. Cloud boldness inference remains a network dependency. The changed live bundle needs source reconciliation before carrying all implementation assurances forward. |
| 9 | Deliverable 1: all source, README setup/run instructions, brief approach/tools/assumptions. Evaluation: code quality and appropriate scope. | Ensure submitted repository contains the final implementation. Reproduce setup/build/tests from clean source and verify documentation reflects actual behavior and trade-offs. Review changed code and resolve confirmed defects. | MET WITH RECONCILIATION NEEDED: GitHub repository visibility verified PUBLIC. Source, setup instructions, approach, assumptions and limitations are available. Recorded release source 2a46749 passed 77 tests and clean build/review; the later isolated experiment worktree passed 83 JavaScript tests, 13 Python tests, build and local browser smoke. Latest experiment/diagnosis artifacts remain local. Current live-source identity and documentation must be reconciled; these test counts describe different snapshots. |
| 10 | Deliverable 2: working deployed URL evaluators can access and test. | Deploy the tested implementation to the app project, verify anonymous access and correct/incorrect/batch flows, and confirm deployment corresponds to submitted source. Provide repository and application URLs. | ACCESSIBLE NOW; CURRENT FUNCTIONALITY PARTLY UNVERIFIED: public custom-domain page returned HTTP 200 without authentication. It serves index-BFX-QVJC.js, different from index-DGAUEOgM.js in the recorded release evidence. Do not claim the current page is verified source 2a46749. Fresh source/deployment mapping and functional checks remain pending. Automated boldness remains incomplete. |

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
