# R-012: trainable heading features

Authorized September 23, 2026 by the user to fix detector and latency within free limits. Parent R-011 (frozen encoder), R-005 (cloud consensus failure). One bounded development experiment, not a replacement release.

Changed mechanism: fine-tune all MobileNetV3Small visual features on heading weight instead of freezing ImageNet features and fitting a linear head. Use heading-only inputs to preserve the identical-heading/different-body invariant. A qualifying browser-local model would remove cloud inference queueing; local training speed is not browser evidence.

Reuse the preserved R-011 synthetic development inputs without modifying pixels, labels, split or metadata. Prior calibration/challenge is exposed development, not holdout. Keep eight reserved families unrendered. Retain Superclarendon heavy regular, TI-Nspire narrow bold, Century, renderer changes, inversion and small sizes. No family exception or new font-layout restriction.

Fixed method: pinned R-011 MobileNetV3Small checkpoint, replace final classifier with one logit, train all parameters using AdamW (learning rate 0.0001, weight decay 0.01), binary cross entropy, batch size 32, seed 20260923, 12 epochs, no augmentation or checkpoint selection. MPS local GPU when available, otherwise CPU. Maximum wall time 10 minutes; timeout rejects the attempt. No external inference or paid resources.

Calibrate once after training at the next float above the largest regular development-calibration score. Require at least 95% bold on calibration and each retained challenge category, zero regular false Matches, and identical scores/verdicts for identical-heading body pairs. Stop before holdout/export/integration if any fails. No tuning after seeing challenge results. If development passes, separately freeze browser preprocessing, evaluate untouched families and reviewed real examples, then measure complete browser review timing. No claims of accuracy or performance from training loss.

Input/checkpoint hashes and code hash will be captured before training. Preserve each per-image score and the final checkpoint; never overwrite previous experiments.
