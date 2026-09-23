# R-012 development closeout

September 23, 2026. **FAILED. No integration or detector deployment.**

The user authorized detector and latency fixes within free services and the assignment scope. This one preregistered run changed R-011's frozen encoder into an all-feature fine-tune. Training used the existing 1,024 heading-only inputs across 16 font families, 12 fixed epochs, seed 20260923, AdamW learning rate 0.0001, and binary cross entropy. All data are exposed development material, not independent qualification.

Training and evaluation finished on the local Apple GPU in 52.267 seconds. This measures local experiment execution, not browser review latency. Zero cloud inference calls or paid resources were used. Checkpoint/input/source hashes are in appearance-finetune-protocol.json and appearance-finetune-development.json.

| Cohort | Bold Matches | Regular false Matches | Decision |
|---|---:|---:|---|
| Calibration | 128/128 | 0/128 | Pass by frozen rule; cutoff calibrated on these negatives |
| Century renderer | 4/4 | 0/4 | Pass |
| Historical renderer | 31/35 | 1/35 | Fail |
| Perfect-location stroke controls | 40/40 | 10/40 | Fail |

Frozen cutoff: 0.5397067666053773. It was selected once above the largest calibration regular score. It was not changed after challenge scoring. All five identical-heading/different-body pairs retained the same score and verdict within the declared floating tolerance.

False approvals include heavy regular Superclarendon, low-resolution/inverted Georgia, and low-resolution TI-Nspire. Four historical TI-Nspire bold headings were missed. This supports a remaining cross-family/renderer generalization failure; it does not isolate one unique cause. Perfect-location failures establish that OCR localization alone cannot explain the errors. Training loss and clean calibration do not establish reliable open-family boldness.

The final checkpoint is preserved locally at /Users/HQ/Projects/lucaschatham.com/treasury-label-review-r012-artifacts/model.pt. Original inputs and manifest remain unchanged in the treasury-label-review-mobilenet worktree (appearance-mobilenet-inputs-frozen.json and its 16 MB input archive). This report does not claim that the training artifacts are independently reproducible from GitHub alone.

Reproduce the contract tests using Python 3 and unittest. Reproduce training only deliberately, in the preserved pinned environment, with the script's --inputs-root and a new --output directory. No automatic rerun or hyperparameter search is authorized by this report.

**Stop rule enforced:** no holdout exposure, export, browser integration, changed threshold, cloud rerun, or production replacement. R-012 does not close requirement 3 or prove latency for a replacement. Production remains the UI release a61f00a with its documented detector limitation. A materially different approach must first explain these failures and preregister another decisive test; further training is not an established quick fix.
