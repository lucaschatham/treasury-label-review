# Active goal: complete requirement 3

Deliver automated exact warning wording, uppercase heading and boldness checks from supported label images. Human decisions remain separate. Free resources only; preserve original findings, UI, batch accounting and production availability. Completion is unproven until independent accuracy evidence and integrated browser checks pass.

## Execution stages

1. Preserve evidence and audit the complete current attempt history. R-036 is the latest completed experiment and failed development. Read the September 24 handoff in REQUIREMENTS.md and docs/boldness-handoff.md before selecting a subsequent mechanism. Human annotation is not a prerequisite for automated experiments with verified source weights.
2. For each diagnostic, preregister one hypothesis, controlled inputs, failure conditions and stop rule. Test its harness first. Record counterexamples as well as successes. Reapply systematic debugging when the prediction is contradicted; do not loop by renaming old approaches.
3. Implement only a mechanism supported by evidence. Retain heavy-regular negatives, narrow-bold positives and invariance checks. A new candidate must pass the full exposed development gate without changing answer keys or excluding difficult but in-scope fonts. Use RED/GREEN tests for changed behavior.
4. Freeze a development-passing candidate and qualify once against independent font families with verified source weights. Report errors, abstentions, ambiguity and provenance. Exercise real label images operationally; score their typography only where ground truth is defensible. Independently annotated real labels remain a useful evaluation extension, not a blocker to source-verified qualification. Do not convert exposed data back into a holdout or claim unmeasured real-world accuracy.
5. Integrate a qualified candidate only. Verify exact wording/case regressions, correct/incorrect sample flows, unavailable-provider behavior where applicable, batch accounting and human-decision separation. Measure uncached full browser completion including initialization and OCR. Keep the approximately-five-second requirement visible.
6. Run test/build, review actual diff with autoreview, resolve verified actionable findings and rerun affected checks/review. Verify correct app-project preview and source identity before any qualified production change. Never deploy site.
7. Audit REQUIREMENTS.md line by line. Mark goal complete only when requirement 3 is proven and no explicit goal deliverable remains. Otherwise continue with the next evidence-supported action.

## Progressive reporting

Each update states new evidence, what it rules out, remaining uncertainty, and the next discriminating action. Keep REQUIREMENTS.md current on GitHub. Distinguish process completion, harness correctness, diagnostic results, classifier qualification and production release. No repeated planning or unchanged replay counts as substantive goal progress.
