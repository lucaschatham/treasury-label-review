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
