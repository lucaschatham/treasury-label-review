# R-011/R-012 saved-score audit

Decision: keep R-012 out of production. A higher global score cutoff cannot recover both strong bold detection and zero false approvals on the existing challenge. Diagnose controlled font/rendering differences before another training run.

## Evidence

Source hashes, all error IDs, family/cohort breakdowns, and transitions are in `appearance-score-audit.json`. The script verifies prediction identities against the frozen manifest. This is retrospective analysis of exposed development data, not independent validation. Scores are model outputs, not calibrated probabilities.

| Existing challenge (79 bold, 79 regular) | R-011 | R-012 |
| --- | ---: | ---: |
| Bold detected at original cutoff | 50 | 75 |
| Regular incorrectly approved | 2 | 11 |
| Highest regular score | 0.99555 | 0.99130 |
| Bold above every regular score | 40 | 55 |

The last row is an optimistic, hindsight-only ceiling for a single increasing score threshold with zero false positives on this exact dataset. It is not a selected threshold. R-012's ceiling is 69.6%, below the project's internal 95% target. Removing identical input tensors yields 51/74 bold above every regular score, so duplicate inputs do not explain the conclusion. Original acceptance denominators remain unchanged.

Relative to R-011, R-012 rescues 25 missed bold examples, introduces 10 false approvals, fixes one false approval, and retains one false approval. Four bold examples remain missed. This is a changed error tradeoff, not a solved detector.

R-012's 11 false approvals occur in Superclarendon (8), Georgia (2), and TI-Nspire (1). Its four missed bold examples are TI-Nspire. Georgia's bold scores all exceed its regular scores, but Superclarendon and TI-Nspire still overlap even within their families. Font-specific thresholds therefore cannot fully repair the measured failures either, and would violate the intended open-font scope if used as an allowlist.

Errors include low-resolution, inverted, JPEG, and ordinary same-family examples. Ten false approvals occur in the perfect-location cohort. Better OCR localization alone cannot solve those examples. Family and renderer differ across cohorts, so these results do not establish renderer as the cause. Synthetic font labels also do not establish performance on independently annotated real label artwork.

## Smallest next diagnostic

Freeze a crossed set using only already-exposed families: Superclarendon, TI-Nspire, Georgia, and Arial as a passing control. Use the same font files, heading text, regular/bold weights, foreground/background, cap height, and heading-only crop contract. Render each through both the training renderer and the historical challenge renderer at matched 12px and 24px cap heights. This gives 4 families × 2 weights × 2 renderers × 2 sizes = 32 images. Verify font file hashes and inspect the rendered pairs before scoring. Do not train, tune thresholds, use reserved families, or add degradation variants in this diagnostic.

Score the frozen R-012 checkpoint once using its original cutoff and preprocessing. Compare paired score changes by renderer and resolution. If renderer changes flip verdicts within an otherwise identical pair, investigate rasterization/preprocessing mismatch. If regular/bold overlap persists across both renderers at 24px, the representation is inadequate on those families; another threshold change is ruled out. If only 12px fails, quantify the information loss before deciding whether the optional difficult-image scope covers those cases. No outcome alone proves readiness for production.

Stop after this controlled comparison. Any subsequent candidate requires a changed mechanism tied to the observed failure and independent real-artwork validation. Do not spend the reserved holdout on diagnosis. Do not claim the approximately-five-second requirement is solved by local training speed or saved-score analysis.

## Verification

Three unit tests cover strict score ties, missing regular controls, and conflicting duplicate labels. Both saved prediction sets align with the frozen manifest. No model inference, training, runtime code change, cloud usage, or deployment occurred.
