# R-016: matched rendering comparison

Decision: rendering-path substitution alone does not repair the retained heavy-regular failure. Do not retrain or tune a threshold on these results.

## Execution and controls

Preregistered nearest common cap-height rule, within two pixels of 12/24, lower tie wins, intersecting both weights and rendering paths per family. Actual heights: Arial 12/24; Georgia, Superclarendon and TI-Nspire 11/24. Exact font files were hash checked against historical metadata and collection faces extracted explicitly; font weight metadata checked. Fixed black text on white, separate words, observed ink bounds with two pixels padding, unchanged 224×224 packing and original R-012 checkpoint/cutoff. Integer sizes 7–64 were searched before any classification.

Initial contact-sheet inspection found broken ImageMagick edges: some default PNG output is I;16 and Pillow's direct RGB conversion clips rather than scales its gray values. The retained Georgia word had only two levels after conversion, versus 191 with explicit 8-bit output. The regression test failed first, then passed with explicit 8-bit RGB PNG output. Initial inputs were rejected without scoring. The corrected contact sheet was inspected before the one CPU inference pass: words and punctuation visible, no obvious clipping or broken edges. This is visual input QA, not independent weight annotation.

## Results

| Family | Bold detected | Regular falsely approved | Cross-path decision flips |
| --- | ---: | ---: | ---: |
| Arial | 4/4 | 0/4 | 0 |
| Georgia | 4/4 | 0/4 | 0 |
| Superclarendon | 4/4 | 4/4 | 0 |
| TI-Nspire | 4/4 | 0/4 | 0 |

Superclarendon regular scores at the original 0.539707 cutoff: Pillow 0.622886 (11px), 0.737515 (24px); ImageMagick 0.977426 (11px), 0.986715 (24px). The rendering path changes scores substantially but neither path fixes those decisions. False approvals at 24px rule out small size as a sufficient explanation for this controlled failure. This does not rule out renderer sensitivity in other conditions.

These 32 correlated, exposed synthetic cases are a diagnostic, not independent accuracy qualification. Original R-012 failures remain retained. Passing TI-Nspire here does not erase its historical misses: original packing, context, polarity and image conditions differ. No candidate was changed or qualified.

## Next decision

Stop rendering-path substitution as the proposed sole remedy. Before another training run, inspect the existing training distribution and representation on matched heavy-regular versus narrow-bold examples. State a specific hypothesis that can distinguish family coverage from representation failure without opening the holdout. Another generic training run is not justified by this diagnostic. The separate production timeout remains unresolved.

## Evidence and reproduction limits

Corrected manifest, frozen heights, per-image scores and contact sheet are published under `render-diagnostic-r016-corrected/`. Full local word images, tensors, and extracted proprietary font files are retained locally, not published. Source font provenance is in the manifest. Replay requires those local fonts, the sibling research `heading_classifier.py` and preserved model/environment; this is not fresh-clone portable training evidence.

Scripts: `render_common_diagnostic.py`, `score_common_diagnostic.py`; validation in `render_controls.py`. Nine harness tests pass (five validation, three height-selection, one real PNG-conversion regression). The separate four-example detector regression suite remains three expected failures and one pass. No application code change, cloud calls, training, holdout access or deployment.
