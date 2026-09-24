# Boldness investigation handoff

Updated September 24, 2026. This document summarizes current context; [REQUIREMENTS.md](../REQUIREMENTS.md) remains the canonical attempt ledger. Original product scope is [ASSIGNMENT.md](../ASSIGNMENT.md). Do not recreate RESOLUTIONS.md or replace preserved historical outcomes.

## Current state

- The deployed triage UI, spreadsheet intake, readiness, decision safeguards and timing have recorded release evidence. Detector research has not produced a qualified replacement. Exact warning wording and uppercase checks are implemented; automated boldness and consistent full-check latency remain incomplete.
- Current investigation code/evidence through R-036 was pushed in `e08e537`. The last recorded live UI source is `a61f00a30b93aec2e0d0c0c232fc55cb3e73b8c5`, bundle `index-BPAZG5W4.js`. This is historical release evidence, not a fresh September 24 production check.
- Free-service limits remain binding. Never deploy to Vercel project `site`. The application project is `treasury-label-review`. Human decisions must remain separate from machine findings.
- The user lifted the original prohibition on detector changes. The original assignment remains the scope. Do not add unrelated features or require human annotation before using source-verified fixtures.

## Recent experiment conclusions

| Attempt | Intervention | Actual outcome | Consequence |
| --- | --- | --- | --- |
| R-028 | Freeze nonlinear head; train final projection | Exposed separation worsened | Capacity restriction insufficient |
| R-029 | Nine spatial phases averaged at inference | Same four second-set misses | No repeat shift-only pooling |
| R-030 | OR of frozen local detectors at existing cutoffs | Same four misses | Unchanged ensemble rejected |
| R-031 | Spatial augmentation during head training | Former qualification cohorts 37/40 and 35/40 bold | Augmentation insufficient |
| R-032 | Natural-width versus padded input audit | Maximum logit delta 0.0000266; no decision changes | Padding not a material cause in this test |
| R-033 | Anchor parameters to pretrained head | Drift reduced, separation still failed | Anchoring insufficient; pinned-cache replay reproduced exact head/results |
| R-034 | Train all exposed family counterexamples | Development passed; fresh qualification 38/40 bold, 3/40 regular falsely approved | New-family generalization failed; third set now exposed |
| R-035 | Expand to 22,144 training images across 346 families | Retained regular Superclarendon scored 0.9999913 | Broader corpus under fixed optimizer insufficient |
| R-036 | Same corpus, cosine learning-rate decay | Training BCE 0.001139; regular Superclarendon still 0.9996202 | Convergence alone insufficient; reserve unopened |

See per-image [R-034 qualification](../evidence/r034-qualification-result.json), [R-035](../evidence/r035-result.json), and [R-036](../evidence/r036-result.json). Published R-035/R-036 reports retain evaluation rows and the full local artifact hash; large training rows/features/model binaries are not all stored in Git.

## Evidence versus diagnosis

**Demonstrated:** improving training fit does not eliminate retained errors; unfamiliar heavy regular fonts cause false approvals; some adapted models regress examples their native head handled. Padding, fixed fallback and tested phase averaging did not resolve the observed failures. Cloud timeouts cannot explain offline model errors.

**Supported inference:** the current system does not generalize reliably across typography and rendering conditions. This is stronger than a learning-rate explanation but does not identify a single faulty module.

**Unresolved hypotheses:** relative font weight versus absolute visual thickness; source-label suitability; rendering distribution shift; preprocessing or feature compression discarding useful distinctions. A high sigmoid score is not a calibrated probability. Do not assert impossibility from these failures.

Datatype supplied a concrete label-validity defect: 32 regular/bold pairs had identical warning-letter outlines and pixels. All 64 contradictory new examples were quarantined before classifier fitting, with source and pixel evidence retained. This does not justify removing other hard negatives or concluding that every font pair is ambiguous.

## Evaluation discipline and next action

The internal gate requires at least 95% bold recall in each retained cohort and zero observed regular false approvals. Independent qualification requires at least 38/40 bold with zero/40 regular false approvals. These are explicit engineering criteria, not numbers stated by the assignment and not guarantees about the entire population. This update does not relax them.

Reserved families remain Sumana, Share, Gupter, Nevermind, Saira Stencil, Capriola, REM and Puritan. No reserved qualification images were opened in R-035/R-036. Failed earlier qualification sets remain regression/development data. Never relabel exposed data as independent.

The latest conversational recommendation was a paired regular/bold renderer trace. It has **not run** and is not R-037. Before registering it, inspect R-015/R-016/R-017, which already cover related questions. Reuse preserved images and hashes where possible. Only proceed if tracing the current FontDNA preprocessing/features answers an unresolved question those experiments did not test. Hold source font, text, cap height and compression fixed where feasible; explicitly document any unavoidable mismatch. Determine which boundary changes discrimination before changing a model or cutoff. Do not infer causality from feature distance alone.

## Preserved work and reproducibility limits

Research scripts live in `scripts/experiments/`. R-035 and R-036 use frozen FontDNA backbone features and the original two-layer head initialization. Cached inputs/features are hash-checked. R-035 manifest-link assertions were added after a separate matching sidecar verification; [that verification](../evidence/r035-provenance-verification.json) is preserved. Original result code hashes remain unchanged.

Local artifacts are sibling directories of the checkout: `treasury-label-review-r035-assets`, `treasury-label-review-r035`, `treasury-label-review-r036`, and earlier numbered experiments. Some scripts refer to these local caches. A clean clone alone cannot reproduce every historical run without reacquiring its pinned assets and matching cache bytes. Do not claim fully portable reproduction or silently replace missing artifacts. No credentials belong in evidence.

An experimental browser bicubic resize helper and five pixel-parity fixtures were prepared but are not imported by the app. They establish only resize parity against their fixture cases, not full preprocessing parity, browser inference, detector accuracy or latency. Their status is preparatory, not a completed detector integration.

Historical verification: 94 app tests and build passed before the experimental resize test was added. The intentionally failing R-012 Python regression still records three known errors. Individual helper tests passed where recorded. Do not convert these bounded historical results into a claim that every test or the detector passes today.

Claude review was attempted through the desktop app on September 24, but UI actions did not deliver a verified request or response. The root-cause assessment is Codex's interpretation of repository evidence, not Claude's independent endorsement. No new experiment, model training, runtime change or deployment occurred during this documentation reconciliation.
