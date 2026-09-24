# R-018 proposed paired coverage intervention

Purpose: test whether one small change to exposed training coverage repairs heavy-regular confusion while retaining useful bold recall. R-017 shows feature association, not causality. No run has occurred yet.

## Frozen comparison

Two fresh models use the same pinned ImageNet initialization, seed 20260923, 12 epochs, AdamW lr 0.0001/weight decay 0.01, batch 32, last checkpoint, eval-mode inference. Both receive 1,028 examples in the same ordering and have identical class balance and optimizer step counts. The first 1,024 are the unchanged R-012 training tensors. Baseline adds four fixed original examples (first two regular and first two bold by stable ID); treatment instead adds the four R-016 Pillow 24px examples for Superclarendon and TI-Nspire, regular and bold. Only those four slots differ. A comparison against only the older R-012 checkpoint would confound data intervention with rerun effects.

Calibration remains the original untouched-in-training 256 examples and uses the original next-float-above-largest-regular policy once per model. Report raw scores as well as calibrated decisions; do not tune policy or epochs after seeing outcomes. Both seeds are controlled but MPS numerical nondeterminism must be disclosed; do not call a marginal difference definitive causal proof.

## Tests before training

Test disjoint evaluation tensors, equal training count and class balance, unchanged baseline prefix, exact four-slot intervention, and rejection of mismatched input/checkpoint hashes. Each new validator must fail for its intended missing behavior before implementation. Detect duplicate tensors by hash, not filename.

## Evaluation and stop

Original exposed challenge plus R-016 controls, excluding exact treatment training tensors from both arms' evaluation. Report exclusions and original challenge results separately. Same-font/similar-layout transfer remains correlated development evidence, not independent generalization. Keep calibration and training results separately labelled. Do not open release holdout.

No more than one paired run, 600 seconds per arm, local free resources. Keep both checkpoints/results. Stop on resource limit or preflight error. If treatment still has regular false approvals or less than 95% bold detection in any retained cohort, do not integrate or advance. If it passes, next step is a frozen independent-family and real-artwork qualification, not a production claim. Do not add more examples repeatedly until the exposed set passes.

## Causal reading

Treatment improves only injected examples: memorization, insufficient transfer. Treatment improves retained same-family cases but regresses other families: changed tradeoff, reject. Treatment improves all development gates: evidence supporting targeted coverage as a repair for these exposed errors; unseen-family capability remains unproven. No improvement: simple four-example coverage intervention rejected; do not conclude all possible training is impossible.
