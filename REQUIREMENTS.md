# Assignment benchmark and execution checklist

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
| 1 | Sarah: compare artwork with application. Additional context lists brand, class/type, alcohol content, net contents, producer/address, import country. | Verify observed artwork against each submitted field. Exercise correct and incorrect values, missing information, domestic/imported cases, and explicitly identified alcohol-content exceptions. Show uncertainty honestly. Fix extraction/comparison failures demonstrated by those cases. | IMPLEMENTED: integrated 300-image browser audit; valid fields match except two unresolved fluid-ounce OCR units. Eleven additional field-image cases pass. See evidence/browser-integrated-300.json and evidence/field-image-followup.json. |
| 2 | Dave: STONE'S THROW and Stone's Throw mean the same brand. | Verify this exact capitalization example and a genuinely different brand through image review. Do not let normalization conceal an actual difference. | IMPLEMENTED: normalization and independent layout regressions pass; local two-image browser case-difference and different-brand checks pass (evidence/local-ui-followup.json). |
| 3 | Jenny: warning must be exact, with GOVERNMENT WARNING: uppercase and bold. | Verify correct, missing, altered-wording, title-case, and regular-weight warning artwork. Implement the missing boldness check. Keep unresolved readings visibly unresolved; human confirmation does not prove automated detection. Explain any OCR normalization in assumptions. | IMPLEMENTED WITH LIMITS: OCR warning punctuation/caps plus two-model and stroke corroboration. 30 regular headings produced zero false matches; 19/30 valid bold headings matched, 11 remained unresolved. Manual confirmation stays separate. |
| 4 | Sample: OLD TOM DISTILLERY, Kentucky Straight Bourbon Whiskey, 45% Alc./Vol. (90 Proof), 750 mL, standard warning. | Run the supplied-style sample through the full implementation, including warning appearance. Confirm the artwork and submitted values agree. | VERIFIED LIVE: anonymous production OLD TOM sample completed every applicable check, including automated appearance, in 2.3 seconds. Authenticated preview first run took 6.6 seconds. See evidence/release-verification.json and evidence/local-integrated-sample.json. |
| 5 | Sarah: results in about five seconds. | Time Review click through all required findings on clear representative artwork. Include startup conditions and report environment, actual timings, and limitations. Fix sustained delays. | MEASURED: integrated batch median 1.3 s, p95 4.7 s, maximum 5.2 s per label; first result 1.4 s. These include 45 visible appearance deadlines, not 300 successful typography verifications. |
| 6 | Sarah: batch uploads in the context of 200–300 applications. | Upload a batch with separate application values, complete processing, and verify correct association and retained results. Demonstrate the mentioned scale using actual image reviews. Report duration and size limits. | VERIFIED LOCALLY: 300 real browser uploads, 86.4 MB, per-file CSV, 300 retained unique results, zero processing/association errors in 485.2 seconds. All eligible cloud calls used the actual service. |
| 7 | Sarah: clean, obvious interface for mixed technical comfort. Evaluation: UX and error handling. | Verify sample, upload, entering details, finding a discrepancy, inspecting artwork, batch review, and recovering from invalid/unreadable input. Check narrow layout and keyboard operation as practical usability evidence. | IMPLEMENTED: selected interface preserved, original and crop evidence shown; blank/corrupt images, invalid CSV, stale-result clearing, stop behavior, keyboard order and 390-pixel layout checked locally (evidence/local-ui-followup.json). Deployed sample, mixed CSV batch, invalid warning and corrupt-image checks pass (evidence/release-verification.json). |
| 8 | Marcus: standalone prototype, sensible security, firewall awareness. Technical requirements allow any stack. | Keep credentials out of client code, avoid sensitive-data storage, and verify/document runtime network dependencies. If cloud processing is added, explain it accurately and handle failure visibly. | IMPLEMENTED: same-origin OCR assets and proxy, bounded payloads, server-only secrets, authenticated/rate-limited Worker, fixed inference/deadline, accurate crop disclosure. Unit tests cover rejected requests and provider failure. |
| 9 | Deliverable 1: all source, README setup/run instructions, brief approach/tools/assumptions. Evaluation: code quality and appropriate scope. | Ensure submitted repository contains the final implementation. Reproduce setup/build/tests from clean source and verify documentation reflects actual behavior and trade-offs. Review changed code and resolve confirmed defects. | VERIFIED LOCALLY: clean source install, 47 tests and production build pass; autoreview clean. See evidence/clean-reproduction.json. Implementation and provider-error correction published; production source is 57ff3b58b3a408c3c52a77287bcf627df4ef3f70. Subsequent documentation-only commits record release evidence. |
| 10 | Deliverable 2: working deployed URL evaluators can access and test. | Deploy the tested implementation to the app project, verify anonymous access and correct/incorrect/batch flows, and confirm deployment corresponds to submitted source. Provide repository and application URLs. | RELEASED: authenticated preview smoke passed; its promotion created a production deployment with the same source and browser bundle. Custom domain works anonymously; sample and mixed CSV batch verified. Preview authentication stayed enabled. See evidence/release-verification.json. |

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

## Published release

[Public app](https://label-review-7b3.lucaschatham.com/) and [source](https://github.com/lucaschatham/treasury-label-review/tree/57ff3b58b3a408c3c52a77287bcf627df4ef3f70) verified September 22. [Release evidence](evidence/release-verification.json) records authenticated preview testing, anonymous production testing, source metadata, timing outliers, unchanged authentication settings, crawler exclusions, and preservation of the separate homepage. Anonymous preview testing was not performed because the preview requires Vercel authentication; the user signed in for preview testing.
