# R-020: normalization-statistics refresh rejected

One CPU pass recomputed BatchNorm running statistics from the original 1,024 training images only. Learned parameter bytes remained identical; only stored buffers changed. Dropout remained disabled and final inference used eval mode. Refresh helper tests went RED then GREEN. Original calibration policy and cohort evaluation remained fixed. Elapsed 54.73 seconds; no holdout or cloud usage.

| Cohort | R-012 bold / regular false Matches | Refreshed bold / regular false Matches |
| --- | --- | --- |
| Calibration | 128/128, 0/128 | 128/128, 0/128 |
| Century | 4/4, 0/4 | 4/4, 0/4 |
| Historical | 31/35, 1/35 | 32/35, 1/35 |
| Perfect location | 40/40, 10/40 | 40/40, 10/40 |

The frozen-policy cutoff changed from 0.539707 to 0.046431. Score scale changed substantially, but the retained false approvals did not disappear. All five body invariants passed. Decision STOP. Training-only BatchNorm refresh is insufficient; this experiment does not prove all normalization designs irrelevant.

Cumulative exclusions: R-013 global cutoff repair, R-016 renderer substitution, R-018 four-example coverage intervention, R-019 missing within-family ordering, and R-020 stored-statistics refresh do not resolve the retained failures. We have not identified a qualified replacement. The original input-only contract does not provide matched regular/bold reference twins; those cannot be introduced as an inference shortcut.

Protocol and per-image outputs are in r020-protocol.json and r020-result.json. Producing source is commit 88d4ef3, and code/input/model hashes are retained. Final metrics were independently recomputed from stored per-image rows, parameter/buffer invariant flags checked and elapsed budget verified. This remains exposed development evidence. No runtime edit or deployment.

Autoreview: `autoreview --mode commit --commit HEAD` at 88d4ef3 exited 0, no accepted/actionable findings. R-019 review at 6cd4373 also exited 0 cleanly. Additional source audit: all 78 historical RGBA challenge sources have alpha extrema (255,255), so dropping nonopaque alpha does not explain those retained errors. This is a bounded source check, not a universal claim about uploaded images.
