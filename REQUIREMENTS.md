# Assignment benchmark and execution checklist

> **Current partial release:** repair source `c3ebde8` is deployed with explicit user authorization to defer the boldness gate. Semantic and batch fixes are live; boldness remains unresolved at 34/40 local guard passes. See [release verification](evidence/partial-release-verification.json) and [repair checkpoint](evidence/repair-checkpoint.md).

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
| 1 | Sarah: compare artwork with application. Additional context lists brand, class/type, alcohol content, net contents, producer/address, import country. | Verify observed artwork against each submitted field. Exercise correct and incorrect values, missing information, domestic/imported cases, and explicitly identified alcohol-content exceptions. Show uncertainty honestly. Fix extraction/comparison failures demonstrated by those cases. | RELEASED IN `c3ebde8`: independent declaration extraction removed the known importer-address, company-name, and unrelated-percentage false approvals. The five-image production regression batch kept all three decoys at Review. Earlier 300-image evidence predates these fixes; two fluid-ounce OCR units remain unresolved. See evidence/partial-release-verification.json and evidence/repair-checkpoint.md. |
| 2 | Dave: STONE'S THROW and Stone's Throw mean the same brand. | Verify this exact capitalization example and a genuinely different brand through image review. Do not let normalization conceal an actual difference. | IMPLEMENTED: normalization and independent layout regressions pass; local two-image browser case-difference and different-brand checks pass (evidence/local-ui-followup.json). |
| 3 | Jenny: warning must be exact, with GOVERNMENT WARNING: uppercase and bold. | Verify correct, missing, altered-wording, title-case, and regular-weight warning artwork. Implement the missing boldness check. Keep unresolved readings visibly unresolved; human confirmation does not prove automated detection. Explain any OCR normalization in assumptions. | PARTIAL RELEASE: uppercase/text checks and conservative two-model plus local-stroke corroboration are live. The deployed guard passed 34/40 clear bold headings locally. A newer candidate passed 38/40 bold and 0/40 regular headings locally, then only 36/40 bold and 0/40 regular in its first real-service preview run. It failed the internal gate and was not promoted. Human confirmation remains separate. See evidence/partial-release-verification.json and evidence/appearance-multiglyph-preview-run1.json. |
| 4 | Sample: OLD TOM DISTILLERY, Kentucky Straight Bourbon Whiskey, 45% Alc./Vol. (90 Proof), 750 mL, standard warning. | Run the supplied-style sample through the full implementation, including warning appearance. Confirm the artwork and submitted values agree. | VERIFIED ON CURRENT PRODUCTION: anonymous OLD TOM sample completed every applicable check, including appearance, in 2.7 seconds. See evidence/partial-release-verification.json. |
| 5 | Sarah: results in about five seconds. | Time Review click through all required findings on clear representative artwork. Include startup conditions and report environment, actual timings, and limitations. Fix sustained delays. | OPEN: current production sample took 2.7 seconds. The candidate's first uncached 80-image preview run took 5.5 seconds at p95, including two appearance deadlines, and therefore failed the internal latency gate. An earlier 300-image batch measured p95 4.7 seconds but included 45 appearance deadlines and predates the repair. See evidence/appearance-multiglyph-preview-run1.json and evidence/browser-integrated-300.json. |
| 6 | Sarah: batch uploads in the context of 200–300 applications. | Upload a batch with separate application values, complete processing, and verify correct association and retained results. Demonstrate the mentioned scale using actual image reviews. Report duration and size limits. | PARTIAL RELEASE: strict one-to-one CSV/image reconciliation blocks incomplete jobs; production blocked a missing-image CSV and processed all six inputs after correction. A prior pipeline retained 300 unique results in a browser run, but a 300-image rerun of the final pipeline remains open. See evidence/partial-release-verification.json and evidence/browser-integrated-300.json. |
| 7 | Sarah: clean, obvious interface for mixed technical comfort. Evaluation: UX and error handling. | Verify sample, upload, entering details, finding a discrepancy, inspecting artwork, batch review, and recovering from invalid/unreadable input. Check narrow layout and keyboard operation as practical usability evidence. | IMPLEMENTED: selected interface preserved, original and crop evidence shown; blank/corrupt images, invalid CSV, stale-result clearing, stop behavior, keyboard order and 390-pixel layout checked locally (evidence/local-ui-followup.json). Deployed sample, mixed CSV batch, invalid warning and corrupt-image checks pass (evidence/release-verification.json). |
| 8 | Marcus: standalone prototype, sensible security, firewall awareness. Technical requirements allow any stack. | Keep credentials out of client code, avoid sensitive-data storage, and verify/document runtime network dependencies. If cloud processing is added, explain it accurately and handle failure visibly. | IMPLEMENTED: same-origin OCR assets and proxy, bounded payloads, server-only secrets, authenticated/rate-limited Worker, fixed inference/deadline, accurate crop disclosure. Unit tests cover rejected requests and provider failure. |
| 9 | Deliverable 1: all source, README setup/run instructions, brief approach/tools/assumptions. Evaluation: code quality and appropriate scope. | Ensure submitted repository contains the final implementation. Reproduce setup/build/tests from clean source and verify documentation reflects actual behavior and trade-offs. Review changed code and resolve confirmed defects. | PARTIAL RELEASE: current deployed source is `c3ebde8cd36065d917677787f195b1dab46929b9`. A clean install, build, and review were recorded for an earlier source; rerun reproduction and autoreview on the final candidate before promotion. See evidence/clean-reproduction.json and evidence/partial-release-verification.json. |
| 10 | Deliverable 2: working deployed URL evaluators can access and test. | Deploy the tested implementation to the app project, verify anonymous access and correct/incorrect/batch flows, and confirm deployment corresponds to submitted source. Provide repository and application URLs. | RELEASED WITH DOCUMENTED LIMIT: the public custom domain serves `c3ebde8` and its tested bundle; anonymous sample and five-image regression batch passed, with one explicit corrupt-image failure. Preview authentication stayed enabled. Boldness reliability remains below the internal release gate. See evidence/partial-release-verification.json. |

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
