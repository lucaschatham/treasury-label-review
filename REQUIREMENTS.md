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
| 1 | Sarah: compare artwork with application. Additional context lists brand, class/type, alcohol content, net contents, producer/address, import country. | Verify observed artwork against each submitted field. Exercise correct and incorrect values, missing information, domestic/imported cases, and explicitly identified alcohol-content exceptions. Show uncertainty honestly. Fix extraction/comparison failures demonstrated by those cases. | PARTIAL: fields exist; broader correctness remains unverified. |
| 2 | Dave: STONE'S THROW and Stone's Throw mean the same brand. | Verify this exact capitalization example and a genuinely different brand through image review. Do not let normalization conceal an actual difference. | PARTIAL: deterministic regression passes; record end-to-end evidence. |
| 3 | Jenny: warning must be exact, with GOVERNMENT WARNING: uppercase and bold. | Verify correct, missing, altered-wording, title-case, and regular-weight warning artwork. Implement the missing boldness check. Keep unresolved readings visibly unresolved; human confirmation does not prove automated detection. Explain any OCR normalization in assumptions. | INCOMPLETE: boldness remains manual. |
| 4 | Sample: OLD TOM DISTILLERY, Kentucky Straight Bourbon Whiskey, 45% Alc./Vol. (90 Proof), 750 mL, standard warning. | Run the supplied-style sample through the full implementation, including warning appearance. Confirm the artwork and submitted values agree. | PARTIAL: sample OCR works; complete warning check missing. |
| 5 | Sarah: results in about five seconds. | Time Review click through all required findings on clear representative artwork. Include startup conditions and report environment, actual timings, and limitations. Fix sustained delays. | UNVERIFIED: observed fast sample excludes automated boldness. |
| 6 | Sarah: batch uploads in the context of 200–300 applications. | Upload a batch with separate application values, complete processing, and verify correct association and retained results. Demonstrate the mentioned scale using actual image reviews. Report duration and size limits. | PARTIAL: queue and CSV mapping exist; full-scale operation unverified. |
| 7 | Sarah: clean, obvious interface for mixed technical comfort. Evaluation: UX and error handling. | Verify sample, upload, entering details, finding a discrepancy, inspecting artwork, batch review, and recovering from invalid/unreadable input. Check narrow layout and keyboard operation as practical usability evidence. | PARTIAL: focused local UI checks pass; final integrated flow remains. |
| 8 | Marcus: standalone prototype, sensible security, firewall awareness. Technical requirements allow any stack. | Keep credentials out of client code, avoid sensitive-data storage, and verify/document runtime network dependencies. If cloud processing is added, explain it accurately and handle failure visibly. | PARTIAL: local OCR currently uses same-origin assets; recheck final architecture. |
| 9 | Deliverable 1: all source, README setup/run instructions, brief approach/tools/assumptions. Evaluation: code quality and appropriate scope. | Ensure submitted repository contains the final implementation. Reproduce setup/build/tests from clean source and verify documentation reflects actual behavior and trade-offs. Review changed code and resolve confirmed defects. | PARTIAL: repository/docs exist; final source and reproduction pending. |
| 10 | Deliverable 2: working deployed URL evaluators can access and test. | Deploy the tested implementation to the app project, verify anonymous access and correct/incorrect/batch flows, and confirm deployment corresponds to submitted source. Provide repository and application URLs. | PARTIAL: baseline deployed; latest UI and remaining fixes are not released. |

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
