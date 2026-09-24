# R-018 coverage intervention: rejected

Two paired local runs completed, 51.23 seconds baseline and 47.08 seconds treatment. Identical original 1,024 examples, initialization, seed, optimizer, epochs, batch count and class balance. Four slots differ as preregistered. Each arm calibrates once using the same frozen policy. Both decisions are STOP.

| Cohort | Baseline bold / regular false Matches | Treatment bold / regular false Matches |
| --- | --- | --- |
| Calibration | 128/128, 0/128 | 128/128, 0/128 |
| Century | 4/4, 0/4 | 1/4, 0/4 |
| Historical | 26/35, 0/35 | 15/35, 0/35 |
| Perfect locations | 40/40, 5/40 | 26/40, 1/40 |
| R-016 transfer, four exact training tensors excluded | 14/14, 3/14 | 7/14, 0/14 |

Calibration cutoff shifts from 0.564715 to 0.961419. The highest regular calibration score in both arms belongs to Vollkorn 12px inverted PNG. This is the unchanged frozen calibration policy, not a hand-selected new threshold. A retrospective zero-false-positive threshold ceiling on the original 79-bold/79-regular challenge is 43/79 baseline versus 37/79 treatment. Thus the deterioration cannot be dismissed solely as the selected cutoff. This ceiling is a diagnostic, not threshold tuning.

R-017's neighbor association did not establish a successful coverage repair. R-018's four-example intervention changes the tradeoff in the wrong direction. Do not keep adding examples against these same test outcomes. No architecture replacement, independent holdout, integration or deployment followed.

## Provenance and limits

Protocols and per-image results for both arms are published alongside this report. The source used for both runs is `scripts/experiments/train_coverage.py` at commit `29df0ae`; its hash is recorded in each protocol. Checkpoints remain local in sibling R-018 artifact directories. MPS nondeterminism and single-seed scope limit causal precision. Same-family transfer is exposed development, not independent generalization.

Autoreview found that resource checks did not cover post-training evaluation. The harness now checks the resource budget during input processing, after training batches, throughout evaluation and before final results. Both recorded runs finished far below the 600-second budget, so this fix does not invalidate their measured outcomes or justify rerunning them. Original source provenance is retained explicitly.

## Next investigation

Return to the architectural distinction: source font weight is relative to a font family, while the fitted binary representation appears to use thickness patterns that confuse heavy regular with other families' bold. That mechanism remains a hypothesis, not proof of impossibility. Before any new training, assess whether a model can learn a within-family regular/bold relationship on exposed pairs without relying on family identity or body weight. Any proposed objective must preserve the original image-only inference contract, specify the missing information, and face the retained negatives. Another unmotivated model swap is not justified.

## Verification and review closeout

Recomputed every published cohort summary from per-image rows, verified both training counts (1,028; 514 per class), identical seed/optimizer/epoch settings, shared exclusions, original source hashes, STOP outcomes and sub-600-second elapsed times. Feature ranking (3), PNG boundary (1), slot selection (2), and budget (2) focused tests pass. No classifier correctness claim follows from these harness tests.

Autoreview used the Codex helper. Reviews against the earlier diagnostic commit and branch identified actionable fixture, evidence-write, output-path, provenance and budget issues; each was inspected and corrected. The full final branch bundle exceeded the helper size limit due to raw per-image results, so source/report review was narrowed to a review-only commit and the large result tables were checked programmatically. Final command: `autoreview --mode commit --commit HEAD` at `56af286` with the budget context prompt. Exit 0, no accepted/actionable findings. This final clean result covers the budget follow-up; it is not a new detector qualification or claim that the large raw matrices received line-by-line model review.
