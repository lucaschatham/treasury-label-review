# R-015 execution: stopped at input controls

## Result

The test-first harness was implemented. The 32-image diagnostic stopped before inference because the frozen exact 12px cap-height condition could not be met for Georgia regular using the ImageMagick path. No new classification result or renderer-causality conclusion is available.

## Fresh verification

- Five harness tests initially failed with assertions against stub behavior, then passed after implementation. They cover font mismatch, height mismatch, clipping, missing/duplicate rows, and overwrite protection.
- Four real-inference desired-behavior regressions ran against the hash-verified R-012 checkpoint: three FAILED as expected (Georgia regular false Match, Superclarendon regular false Match, TI-Nspire bold Review); Arial bold control passed. `r015-red-tests.txt` preserves output. These are expected-label regressions on historical synthetic fixtures, not independent human qualification of clear real artwork.
- Original integer-size preparation stopped on Georgia regular at 12px. A setup-only fractional-size search, before any diagnostic scoring, also found no exact 12px output over 7.0–64.9 points in 0.1 increments. This was a control feasibility check, not a detector rerun.
- Narrow follow-up measurement: 16.5 points produced 11px; 17 points produced 13px. See `r015-georgia-height-control.json`. No post-render resizing or tolerance relaxation occurred.
- `python3 test/render_controls_test.py`: 5 passed on final rerun. `git diff --check`: passed.

## Decision

The earlier specification assumed exact 12/24px heights were attainable in both rendering paths. That assumption failed before the scoring gate. This is an experimental-design failure, not evidence of a classifier root cause. Partial inputs and extracted faces remain locally in `evidence/render-diagnostic` and `evidence/render-diagnostic-v2`; neither has a complete validated manifest. Do not use them as a completed 32-case set or publish the extracted font files casually.

Next protocol revision: choose a shared attainable measured cap height nearest each prespecified target within a frozen window (for example 10–14 and 22–26), using both weights and both rendering paths for each family. Break equal-distance ties consistently before any inference. If no common height exists, stop rather than resize. Freeze the selected heights and input manifest before scoring. This preserves pairwise size control while avoiding an impossible exact target. Cross-family size comparisons must then disclose actual heights. This revision is proposed, not executed.

Requirement 3 remains incomplete. No model training, diagnostic model scores, runtime changes, cloud calls or deployment occurred. The retained-model regression replay is distinct from the unexecuted new-input diagnostic. The implementation and evidence are local, uncommitted work.
