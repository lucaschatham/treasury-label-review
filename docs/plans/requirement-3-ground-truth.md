# Next decision: establish real-label ground truth before another detector

## Decision and evidence

Apply systematic debugging, test-driven development and verification-before-completion. No new detector is justified by the latest findings alone. R-020 still falsely approves 10/40 perfect-location regular headings. R-019 establishes correct ordering within the exposed regular/bold pairs, not a usable decision boundary across fonts. Ground truth will not repair these failures; it will make the next architecture decision accountable to actual label images.

On September 23, the existing local output-blinded HTML packet was checked: all ten embedded source hashes match its manifest entries. Provisional agent observations contain four clear bold headings, two degraded bold headings, two ambiguous headings and two absent headings. There are zero regular observations and no independent human annotations established by this audit. These observations are not answer keys. The packet is exposed development data, never a fresh holdout.

## Smallest useful next action

1. Have an independent reviewer assess the existing ten-image packet without detector outputs. Record bold, regular, ambiguous or absent; readability; heading rectangle; rationale; reviewer identity; and source hash. Keep disagreements unresolved rather than forcing binary labels.
2. Acquire clear regular-heading negatives with defensible provenance. Existing commercial labels cannot be assumed regular or bold because they were approved. Prefer source artwork with confirmed heading face/weight plus visual review. If genuine negatives cannot be obtained, make explicitly labeled controlled derivatives with preserved originals and known font metadata. Such derivatives are synthetic controls, not real-world accuracy evidence.
3. Freeze a small balanced development set, initially ten clear bold and ten clear regular headings from varied families/layouts. This is a diagnostic starting point, not a statistically sufficient release gate. Keep ambiguous, degraded and absent cases in separate coverage counts. Preserve all exposed hard controls and do not alter the original supported input contract.
4. Evaluate the unchanged production method once on that set with stage timings and failure categories. Separate localization, OCR, typography classification, provider error and timeout. Compare clear, correctly localized failures with existing synthetic failures before selecting one changed mechanism. Do not begin another training run merely because more data exists.

## TDD boundary for the resulting implementation

Before implementing an annotation importer/evaluator, write failing tests for source-hash mismatch, duplicate IDs, missing assessments, invalid boxes, and exclusion of ambiguous/degraded cases from clear-case denominators. Test the real parser and metric calculation, not a mock detector. Preserve separate absent-heading handling.

Before implementing any detector change, add real-inference regression tests for at least one demonstrated clear regular false approval, one clear bold miss, and a passing bold control. Verify that the negative and positive failures reproduce for the expected reasons. Keep known historical regressions. A reject-all implementation must fail. Select the smallest mechanism supported by these traces and preregister its changed variable and stop rule.

## Verification and stop rules

No claim that requirement 3 is complete from annotations, software tests, synthetic accuracy, or one sample. A candidate must first pass the exposed development gate, then a separately frozen independent qualification set, then uncached integrated browser accuracy/timing and batch checks. The existing internal numerical release gate remains unchanged. Do not use development annotations as independent qualification.

Stop acquisition after the initial balanced diagnostic set; do not expand into an open-ended dataset project. If a clear class cannot be independently labeled, report the evidence limitation and revisit feasibility explicitly. Do not count an agent's visual judgment as independent human ground truth. No paid service, new product feature, production change, or repeated rejected method is part of this step.

## Status

Specification complete. Existing packet integrity verified. Independent annotations, clear regular negatives, balanced benchmark and baseline run remain pending. Requirement 3 remains incomplete. No model training, runtime edit or deployment occurred.

## Annotation intake verification

The [packet integrity audit](../../evidence/real-label-packet-integrity.json) preserves ten IDs, expected/observed hashes, the local packet path and packet digest. Original packet bytes remain local, so repository-only readers can inspect this audit but cannot independently reproduce it without those bytes.

`python3 test/annotation_audit_test.py` passes six tests. The original five failed against the initial empty implementation; the coverage and rationale corrections also failed before implementation. `scripts/experiments/annotation_audit.py` accepts the existing packet JSON and downloaded export; it checks identity, complete unique assessments, source links and heading boxes, and separates clear binary cases from excluded coverage cases. It neither authenticates reviewer independence nor establishes annotation truth. Human assessments are still pending.
