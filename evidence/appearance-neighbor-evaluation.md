# Neighbor-bounded warning recovery: release rejected

The bounded experiment improved localization but did not establish reliable boldness.
Production remains on source `c3ebde8`, deployment
`dpl_5oguVG5be6SRt89W9gb3YGwbm9ze`. No replacement was promoted or source pushed.

## Tested candidate

- Source: `2a46749b0d240d7a63d1ab4d7cd94ad28a146e10`.
- Protected preview: https://treasury-label-review-jvh43qs0w-chathamworks-6954s-projects.vercel.app
- Deployment: `dpl_2Z6otJZvGydg6ztrpkHH9gXS6BxE`.
- Bundle: `index-DGAUEOgM.js`.
- Worker: `treasury-warning-c3ebde8`, version `2d252cac-77c6-4bc2-8958-218df1a074fd`, unchanged.
- Vercel repository metadata and explicit preview Worker binding were checked.

The recovery uses the adjacent N glyphs only for an oversized OCR I box. It
requires exact symbol order, confidence, aligned geometry, containment inside
the word and I box, and one stable central stroke. Existing weight thresholds,
model pair, prompt, crop, and deadlines remain unchanged. The interface and field
comparison logic are unchanged. Human confirmation remains separate.

## Findings

| Evidence | Bold locally eligible | Regular locally eligible |
| --- | ---: | ---: |
| Development v1 | 40/40 | 1/40 |
| Development v2 | 40/40 | 6/40 |
| Development v3 | 39/40 | 0/40 |
| New v4 | 39/40 | 5/40 |

V3 gained the Bodoni 72 localization regression without lowering the 17% stem
threshold; Iowan remains unresolved. Local eligibility is not a final Match.

The [preview run](appearance-neighbor-preview-run1.json) returned **37/40 bold
Matches and three regular false Matches**. The false Matches were uncached
Superclarendon regular layouts 0, 2 and 3. Both models and the local guard agreed
incorrectly. PT Serif layout 2 lacked usable local geometry; Hoefler Text layouts
2 and 4 timed out. All 80 files retained results, with zero processing failures.

The run took 92.2 seconds. All-attempt processing p95 was 4.3111 seconds, but
**this is not qualifying uncached latency evidence**: five bold crops reused the
run-local success cache. Kohinoor Bangla and Devanagari have duplicate Latin
artwork in these layouts despite distinct family names and font files. The set
contains only 70 unique full-image hashes out of 80 and therefore overstates
independent typography diversity. Future holdouts must
reject duplicate rendered artwork/crops before freezing, not just family names.
The uncached regular false Matches independently reject this candidate.

No further qualification runs or classifier tuning followed the failure. A
review-driven containment restriction after initial v4 evaluation changed none
of its 80 local evidence records. Earlier development failures and superseded
uninspected executions remain preserved; see the rule-freeze provenance JSON.

## Latency attribution

The candidate records preparation, OCR, comparison, appearance, rendering,
processing, setup, queue wait and click-to-result in ephemeral DOM data. Failed
attempts receive timing records too. Server-Timing measures the proxy's Worker
round trip, including body handling. It does not separate provider queueing from
individual model inference or Worker transit. Nothing sends diagnostic telemetry
or persists application images.

A foreground local regular-label diagnostic took 0.495 seconds, including 0.473
seconds OCR and 0.014 seconds canvas encoding. The earlier 3.3-second regular
outliers were not reproduced; the attempted headless tab-switch probe remained
`visible`, so it did not test real background throttling.

The final-preview OLD TOM sample timed out at 5.237 seconds, including 0.644
seconds OCR and 4.568 seconds appearance. Local development's warm 1.504-second
Match used the legacy Worker, so it is not release-tuple evidence. Earlier and
current latency results differ in fixtures, browser environment and cache use.
**No comparable, accuracy-qualified latency improvement is established.**

## Workflow and review

The [fresh final-preview 300-image audit](appearance-neighbor-preview-300.json)
completed in 195.3 seconds: 300 unique files, zero missing/duplicate results, zero
processing failures, and 900 verified brand/type/producer application
associations. Eight appearance timeouts remained Review. Stop/restart retained
completed results and explicit remaining counts. This establishes accounting,
not appearance accuracy or uncached latency.

The [33 named regressions](appearance-neighbor-preview-regressions.json) yielded
31 expected outcomes. All targeted semantic decoys/conflicts remained non-Match;
Century regular and title case remained Review, and a corrupt image failed
explicitly. Six of eight named bold cases matched, including Georgia 28. Georgia
44 and Trebuchet 44 timed out, so the named-positive gate also failed. Mismatch
is an appropriate non-Match for a different declaration, not a regression failure.
[Human confirmation](appearance-neighbor-human-confirmation.json) left the Review
badge and pending count unchanged. [Input edits](appearance-neighbor-stale-clearing.json)
cleared all 33 stale cards. [Invalid CSV](appearance-neighbor-preview-invalid-csv.json)
blocked processing before any result was created.

77 tests pass. A clean temporary install passed tests and build; its reviewed
runtime/test bytes matched the candidate checkout. The autoreview helper ran
against the complete incremental runtime/test changes in a slim checkout based
on 984fc42, with historical source/evidence available in the original repository.
The final structured review found no actionable defects. Accepted findings fixed
recovery containment, HTTP/error attribution, Worker-response timing and
setup/queue timing. Review is not correctness proof for typography.

## Decision

Retain production. Do not submit this candidate as satisfying the boldness or
five-second gates. Recovering glyphs cannot resolve the overlap between heavy
regular and bold faces, and two-model agreement does not eliminate that overlap.
Another threshold adjustment or font-specific exclusion would tune against the
failed holdout. A future experiment needs a different source of weight evidence,
a genuinely disjoint rendered-glyph holdout, and per-submission cache isolation
for uncached timing. This experiment is complete; assignment completion remains
unestablished.

The temporary Vercel automation credential generated for this test was revoked
without replacement. Preview authentication remains enabled. Production's
deployment and `index-y4-KV3KF.js` bundle were checked again after testing.
