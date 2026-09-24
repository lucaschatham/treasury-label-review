# Independent source-weight qualification, frozen before inference

Run only after a candidate passes its development transfer gate. Freeze its checkpoint digest, preprocessing and calibration cutoff before generating/scoring this set. No training or cutoff selection on qualification data.

Use eight previously unrendered families: Domine, Exo 2, Karla, Lora, Mulish, Work Sans, Sora and Trirong. Source from the same pinned Google Fonts revision as the development assets; verify normal style, 400/700 source weight, Latin glyph coverage, OFL text and hashes. Crimson Text and IBM Plex Sans remain unused because R-021 introduced related Crimson Pro and IBM Plex Serif. This source-group exclusion is made before any qualification images or scores exist.

For each family/weight, render five conditions with the frozen preparation path: 12px normal PNG; 16px normal PNG; 24px normal PNG; 24px inverted PNG; 24px normal JPEG75. This yields 40 bold and 40 regular images. Source font metadata supplies independently known weight; no AI annotations or human guessing are needed. These are correlated synthetic font-family qualification examples, not an estimate of all real-label accuracy.

Before scoring, verify zero family/source/pixel overlap with training and calibration, inspect a contact sheet for preparation defects, and freeze all image hashes. Stop on preparation errors before inference. Then score once at the candidate's frozen cutoff. Require at least38/40 bold detected and zero regular false approvals, keeping ambiguous runtime inputs unresolved. A failed set becomes development evidence; never rerun a tuned candidate and call it the original independent qualification.

A pass permits runtime integration work, not production promotion. Verify exported-model parity, actual OCR-selected crops, warning-wording/case regressions, uncached browser completion and batch/human-decision invariants. Real artwork smoke tests establish operational behavior; unannotated images do not enter accuracy denominators. Preserve the five-second goal and correct treasury-label-review project separation.
