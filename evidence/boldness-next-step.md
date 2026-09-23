# Boldness follow-up after partial release

Fresh OCR diagnosis of the six held-out local failures is recorded in `boldness-next-diagnosis.json`. No runtime changed after deployment.

Five failures recognize GOVERNMENT and WARNING at 95 to 96 percent confidence, but WARNING does not include the colon in its OCR word token. The locator currently requires the exact token WARNING:. This is a punctuation/region localization dependency, not demonstrated evidence that the heading is non-bold. The sixth, AvantGarde Demi, measures 0.1667 against the retained 0.17 threshold. Georgia 28 from the known set still has merged glyph components.

Recommended next bounded experiment: separate heading localization from punctuation validation. Locate confident uppercase GOVERNMENT and WARNING words in one region, independently inspect any colon evidence, and keep the full-warning wording/punctuation result separate. Retain the current stroke threshold and both models. Freeze a new untouched held-out set before calibrating this change; the old set is now diagnostic data. Verify regular Century remains non-Match and inspect the one regular Gill Sans local pass before any wider release claim. Do not lower the threshold to recover the AvantGarde case.

This is an investigation result and proposed experiment, not a claim that the accuracy gate has passed.
