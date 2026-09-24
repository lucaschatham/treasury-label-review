# R-019: pair ordering already works

Validated saved-score pairs by family, cohort and weight-marked identifier, rejecting duplicate or incomplete pairs and mismatched label identifiers. Four tests went RED then GREEN. No fresh model inference or tuning.

- R-012: 79/79 matched challenge pairs strictly ordered, minimum score margin 0.008697.
- R-018 baseline: 93/93, minimum margin 0.006777.
- R-018 treatment: 93/93, minimum margin 0.002324.

The R-018 count includes 79 original pairs and 14 R-016 transfer pairs. These correlated exposed pairs are not independent evidence. Ordering alone does not show that differences are large enough or that one threshold generalizes. However, a proposal whose sole purpose is to teach bold-above-regular ordering does not address a demonstrated missing behavior here. Reject ranking-only retraining as the next fix. The app has no matched regular reference, so using the answer-key twin at inference would change the input contract.

The remaining issue is cross-family/condition calibration and representation. R-018 changed learned weights and BatchNorm buffers together. Before another architecture/training run, a fixed-weight BatchNorm-statistics refresh on training inputs alone can isolate whether the buffer estimates account for some global score displacement. This is a new component intervention, not a threshold change or another weight-training run. It must preserve parameter hashes, exclude calibration/challenge from adaptation, retain original calibration policy and stop on any failed cohort. It is not yet executed by this report.
