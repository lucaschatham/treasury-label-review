# Initial warning typography feasibility

2026-09-22. Model: @cf/meta/llama-3.2-11b-vision-instruct.
Workers Free verified active in account dashboard. User explicitly approved
Meta license and Acceptable Use Policy acceptance. The endpoint acknowledged acceptance.

## Observations

- Numeric byte-array PNG input: HTTP 500 on both images.
- Base64 PNG input: HTTP 200, approximately 1.0–1.2 seconds; classified both
  Helvetica 40px bold and regular headings as bold. Requested JSON was not returned.
- Base64 with chat messages: HTTP 200, approximately 5.7–6.2 seconds; described
  both headings as not bold, emitted long prose, and truncated before valid JSON.
- Text-only diagnostic succeeded; it did not test typography.

Raw responses, input hashes where recorded, timings and provider-reported usage:
[vision-initial-probe.json](vision-initial-probe.json).

## Decision

This implementation is not suitable for automatic warning approval. Do not
integrate it into production or count its output as passing evidence. The tests
show wrong classifications on a simple matched pair, not merely a transport error.
No paid upgrade or alternative provider was used. No claim about all vision
models follows from this small test.

The assignment's boldness requirement remains incomplete. A different validated
implementation is required. Other assignment work can continue independently.

## Image-input control and RGB follow-up

A fresh RGB image containing only `COPPER BRIDGE 729` was transcribed exactly by
the same model in 1.4 seconds. This establishes that the image-input route works
for the tested request. See `vision-image-control.json`.

Converting the heading pair to RGB and requesting only BOLD or REGULAR with eight
output tokens still returned BOLD for both images (0.953 and 0.854 seconds).
See `vision-rgb-pair.json`. The regular heading is a false positive. Shorter
responses and RGB input did not resolve the typography failure. No endpoint
integration is justified by these results.


## September 22 integrated-method follow-up

The unguarded two-model rule failed on a real OCR-derived full-label crop: both
models called the regular Century heading bold (`vision-full-label-probe.json`).
It was not released. A fixed local I-stem safeguard was then added: usable isolated
glyph geometry, at least 16 pixels cap height, stem/cap ratio >=0.17. This vetoes
the observed false pass. The threshold is an engineering heuristic, not a
regulatory definition or universal font classifier.

Sixteen fresh full-label Arial, Georgia, Trebuchet MS, and Verdana cases tested
the guard without changing the model prompt. No regular heading received a bold
pass. Four of eight true bold headings remained unresolved by the final rule:
three failed the local guard, and one received REGULAR from Gemma while Qwen timed
out. Production deliberately maps every non-corroborated result to Review, not a
definitive regular classification. See `vision-stroke-fresh-followup.json` and
`appearance-method-decision.json`. These are small synthetic experiments, not a
real-world accuracy estimate.

The implementation now crops from OCR word coordinates, applies the stroke guard,
and calls a same-origin Vercel API backed by a secret-protected Cloudflare Worker.
The browser sample completed all required findings in 1.9 seconds locally; an
earlier call timed out and remained Review at 5.0 seconds. Final browser capacity
and release evidence belongs in the requirement checklist, not these experiments.
