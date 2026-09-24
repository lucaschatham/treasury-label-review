# R-017 frozen feature audit

One CPU feature extraction pass completed on the 1,024 exposed training examples and 16 R-016 controls, with input/checkpoint hashes verified. Representation: classifier input in eval mode. L2-normalized cosine distance; stable ID ties; exact tensor duplicates removed per class. Three ranking tests failed before implementation and pass afterward.

All four regular Superclarendon controls have a nearer bold training example than regular example. Nearest bold neighbors are Merriweather bold. Regular/bold nearest distances respectively: Pillow 11px 0.39251/0.31884; ImageMagick 11px 0.73609/0.08543; Pillow 24px 0.49689/0.27575; ImageMagick 24px 0.83862/0.07985. All eight Arial controls have a nearest neighbor of the correct class. All four Superclarendon bold controls have nearer bold neighbors.

The 24px ImageMagick contact sheet was inspected: query and neighboring words are visible and source weights distinguish the regular and bold gallery rows. Visual similarity is not independent typography ground truth. These classifier features were trained for the same decision; correlation between their neighbors and the classifier output does not prove training-data absence or causality. The result supports investigating the learned representation's cross-family weight distinction. It does not establish a qualified classifier.

## Accretive findings

R-013 ruled out global cutoff repair on existing score overlap. R-014 reproduced wrong answers before UI/cloud processing. R-016 ruled out renderer substitution as a sufficient repair under matched controls. R-017 places the retained regular errors near learned bold examples, with passing controls functioning normally. These observations narrow the next intervention to learned coverage/representation; none authorizes changing labels or using the release holdout for diagnosis.

## Next causal experiment

A preregistered paired training intervention should test whether adding exposed hard-family regular/bold development examples repairs retained errors without regressing untouched development families. Keep model architecture, initialization, optimizer, epochs, seed and original evaluation/cutoff policy fixed across baseline and treatment; change only added training coverage. Separate renderer/size examples within exposed families for a transfer diagnostic, and disclose that same-family transfer is not independent font generalization. A baseline control is needed because retraining alone can change outcomes. No experimental run has been performed or claimed in this note. Stop on regular false approvals or inadequate bold coverage before any release holdout. Independent real-label annotation remains unresolved.

## Autoreview corrections

Review of a1b9ba3 found two valid harness issues: unpublished font dependency in the PNG regression and automatic rewriting of tracked replay evidence. The PNG regression now generates a grayscale gradient rather than relying on a private font file. Replay defaults to stdout; writing evidence requires explicit --write-evidence. Focused verification is recorded in goal progress; the detector's expected-behavior suite remains RED by design.

Autoreview follow-up: feature audit now requires an explicit fresh `--output` directory, since committed evidence must never be overwritten. Reproduce with the preserved environment using `python scripts/experiments/audit_features.py --output /tmp/r017-fresh-<unique-id>`. Model/data dependencies remain local as documented.
