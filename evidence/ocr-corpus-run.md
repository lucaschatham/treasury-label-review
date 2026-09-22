# Sequential OCR corpus diagnostic

Date: 2026-09-22. Baseline comparison commit: `a98b1ba`.
Command: `node scripts/benchmark-corpus.js`.
Environment and manifest hash are in `ocr-corpus-run.json`.

- 300 distinct synthetic full-label images processed sequentially, no processing errors.
- Total including worker setup/termination: 150.533 seconds.
- Per-image OCR/comparison: 175–939 milliseconds.
- All 210 deliberately defective target fields remained non-match. This includes unresolved findings, not necessarily correctly classified defects. Boldness is always unresolved, so this is not evidence of boldness detection.
- On 30 clear valid labels: brand matched 21; class/type 30; ABV 30; quantity 20; producer/address 27; imported country 15/15; warning wording/caps 30. All 30 appearance findings remained unresolved.

The run used Node, local language data, OEM 1 and PSM 11. It did not exercise browser upload, CSV association, previews, browser memory, stopping, cloud services, or complete automated review. No overall requirement is marked passed from this diagnostic alone. Synthetic artwork is not a real-label accuracy benchmark. Designs examined here are now regression inputs.

## Quantity fix follow-up

A failing unit regression established that US fluid ounces were unsupported. Added numeric US fluid-ounce comparison, leaving plain weight ounces unresolved and conflicting values unresolved. All 26 unit tests and the production build passed. Autoreview identified whole-milliliter conversion rounding as necessary; the fix and dual-unit/conflicting-value regressions passed. The final `autoreview --mode local` run returned clean with no actionable findings.

Reapplying the changed comparison to the saved OCR text resolved 8 of the 10 valid beer quantities. Two remain unresolved because their OCR evidence is insufficient. `quantity-recomparison.json` preserves all beer quantity results. This follow-up reuses OCR text and is not a fresh independent accuracy test.

Browser verification on localhost: loaded OLD TOM sample, changed application quantity to `12 fl oz`, and ran review. Result displayed `Net contents MISMATCH`, application `12 fl oz`, observed `750 mL`, in 0.6 seconds. Warning appearance remained REVIEW. This verifies the quantity flow and does not establish complete automated five-second reviews.

Outstanding: multiline brand extraction, remaining producer/quantity OCR uncertainty, automated boldness, full browser batch proof and final release validation.

After the rounding fix, the unmodified OLD TOM sample again matched every automated text field in the browser in 0.6 seconds. Appearance remained unresolved.
