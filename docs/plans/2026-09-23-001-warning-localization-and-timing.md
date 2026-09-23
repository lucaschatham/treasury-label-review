# Bounded warning localization and timing experiment

Decision recorded before classifier edits or v4 evaluation. Source baseline: 984fc42.

The v3 set is now development data. Its Bodoni failure has an OCR I box spanning
three letters and touching serifs; this is localization failure, not measured
regular weight. Test a neighbor-bounded I recovery only when the exact WARNING
symbol sequence, high confidence, aligned adjacent Ns, and a single stable stem
establish usable geometry. Keep 17% and existing multi-glyph thresholds, models,
prompt, crop dimensions, and deadlines fixed. Do not force the Iowan miss to pass.

Freeze eight unused font families with five new paired layouts before edits.
Require at least 38/40 local bold eligibility before spending cloud quota; local
eligibility is not final Match. Do not tune after opening v4 outcomes. A local
failure stops this experiment and promotion. Preserve all historical evidence.

Add in-memory stage measurements for preparation, OCR, comparison, appearance,
and rendering, including failed attempts. Separate run setup and per-label time;
record page visibility and raw elapsed time. Use measurements to test a bounded
browser latency repair, without extending deadlines or dropping failed attempts.
Preserve model-disagreement and proxy failure classifications end to end.
No image/application persistence or new telemetry network endpoint.

Validation: regression tests before runtime edits, all unit tests/build, v1-v3
local development check and Century/known positives, frozen v4 local check, then
three real uncached browser runs if local ceiling passes. Final release requires
the original zero false-Match, 38/40 each run, five-second all-attempt p95, workflow,
300-image association, clean reproduction and review gates. Failed gates retain
production. Never deploy to Vercel project site.

## Outcome

Completed and rejected for promotion. See
[the evaluation](../../evidence/appearance-neighbor-evaluation.md). Final source
`2a46749` has 77 passing tests, clean structured review and a complete final-preview
300-image accounting audit. The typography experiment returned three regular
false Matches and only 37/40 bold Matches; named positives also had two deadlines.
Duplicate rendered Latin glyphs caused five cache hits, invalidating the proposed
uncached/diversity interpretation. No further classifier tuning, qualification
runs or promotion followed. Production stayed unchanged.
