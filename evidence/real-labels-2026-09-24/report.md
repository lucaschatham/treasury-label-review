# First real-label measurement, September 25, 2026

## Scope and provenance

Lucas Chatham reviewed 72 source images before app runs: 43 `yes` for heading bold, 7 `ambiguous`, and 22 `skip`. The source screen selected 34 images with an independently detected warning heading, comprising 33 `yes` and 1 `ambiguous`. Each source image, URL, COLA ID, SHA-256, dimensions and human judgment is in [manifest.json](manifest.json); the unchanged human export is [human-boldness-annotations.csv](human-boldness-annotations.csv). [selected-annotation-sheet.csv](selected-annotation-sheet.csv) froze test annotations before the browser runs. `yes` means the heading appears bold, not that the entire required warning complies. One selected `yes` also has a human `warning_body_bold=yes` finding.

The selected sources are actual COLA artwork, including five earlier commercial COLA assets. They are not bottle photographs. The warning screen used independent command-line OCR solely to select likely warning-bearing images, never to set boldness ground truth. Other annotations are OCR-assisted visual estimates. Exact wording was left `unreadable` because it was not independently resolved from each source image. Human readability for every abstention was not separately recorded. Source artwork and derived screenshots are retained locally and ignored by Git because redistribution rights are unclear; results and hashes are committed.

The target mix was not achieved: 8 of 34 are marked light-on-dark, no clear regular-heading negative was judged, and the packet does not establish five serif, five visibly heavier-heading, three whole-statement-bold, or curved/glare photo cohorts. The five Great Notion keg designs are correlated, as are multiple wines. No generated labels were used. These gaps limit generalization.

## Browser protocol

The upstream main branch gained R-041/R-042 robustness work during this measurement; its REQUIREMENTS.md stated that R-041 still required deployment. This report measures the live URL on September 25 only; the deployed script hash was not independently fingerprinted. The frozen application inputs are in [application-values.csv](application-values.csv). Each image was uploaded to the deployed URL in a fresh Playwright Chromium context, then reviewed once. The app processed all 34 individual images. The capture script saved complete findings and a result dialog screenshot for 32; it lost the result card for `cola-26216001000317-02` and `cola-26218001000008-02` after the app had processed them. Those two were not rerun. The later single batch contains their appearance results but not their individual finding details or crop screenshots. The five earlier assets initially lacked file extensions, causing an intake rejection before Review; adding `.jpg` to the local filenames allowed their first app runs. Source bytes and hashes stayed unchanged.

COLA search responses did not supply ABV or net contents for every panel. Artwork-derived values were entered for 25 ABV and 8 volume rows. One ABV input (`cola-26228001000039-01`) appears to have mistaken 80 proof for 80% ABV and is excluded from ABV assessment; unknown volume was entered literally as `unknown` where the app required a nonblank value. These rows cannot establish volume accuracy. The supplied producer is COLA metadata. `imported=false` was set uniformly because source country metadata was incomplete; country-of-origin results are excluded. Brand and class/type are from COLA records, which can differ from exact artwork phrasing. No application value was changed based on the app result.

## Boldness result

| Human heading judgment | App Match | App Review | App failed |
|---|---:|---:|---:|

| yes | 3 | 30 | 0 |

| no | 0 | 0 | 0 |


The one human `ambiguous` image was Review. The app matched 3/33 human-bold headings in the batch and reviewed 30/33. This measures coverage on these artwork files, not specificity: there are zero clear human-regular headings, so the false approval rate is unknown. A Review is an abstention rather than a claim that the heading is regular. No false Match is established by this sample. The body-bold control `cola-26237001000144-01` returned Review (`not-distinguishable`, ratio 1.032).

## Abstentions and readability

| App reason | Count / 34 | Human readability assessment |
|---|---:|---|

| `heading-too-small` | 11 (32%) | Not individually adjudicated; the independent warning-heading OCR screen found candidate text, but that does not prove a person could read the heading at app scale. |

| `missing-heading` | 8 (24%) | Not individually adjudicated; the independent warning-heading OCR screen found candidate text, but that does not prove a person could read the heading at app scale. |

| `reference-not-located` | 7 (21%) | Not individually adjudicated; the independent warning-heading OCR screen found candidate text, but that does not prove a person could read the heading at app scale. |

| `not-distinguishable` | 5 (15%) | Not individually adjudicated; the independent warning-heading OCR screen found candidate text, but that does not prove a person could read the heading at app scale. |


The three Matches had contrast ratios from 1.482 to 1.554. `not-distinguishable` supplied below-cutoff ratios from 0.672 to 1.032. Ratios below the frozen 1.1396 cutoff were Review. The appearance detector abstained on 31/34.

## Per-image result

| Image ID | Human | Body bold | Polarity | Cap px estimate | App | Reason | Ratio | Individual click s | Evidence |
|---|---|---|---|---:|---|---|---:|---:|---|

| `cola-22339001000194-01` | yes | no/unspecified | light-on-dark | 31 | review | `not-distinguishable` | 0.672 | 3.32 | local `screenshots/cola-22339001000194-01-dialog.png` |

| `cola-23054001000947-01` | yes | no/unspecified | light-on-dark | 28 | review | `missing-heading` | — | 2.06 | local `screenshots/cola-23054001000947-01-dialog.png` |

| `cola-23054001000950-01` | yes | no/unspecified | light-on-dark | 31 | review | `not-distinguishable` | 0.672 | 2.26 | local `screenshots/cola-23054001000950-01-dialog.png` |

| `cola-23296001000347-01` | yes | no/unspecified | light-on-dark | 31 | review | `not-distinguishable` | 0.672 | 2.47 | local `screenshots/cola-23296001000347-01-dialog.png` |

| `cola-23296001000366-01` | yes | no/unspecified | light-on-dark | 31 | review | `not-distinguishable` | 0.672 | 2.88 | local `screenshots/cola-23296001000366-01-dialog.png` |

| `cola-26199001000065-02` | yes | no/unspecified | dark-on-light | 15 | review | `heading-too-small` | — | 1.57 | local `screenshots/cola-26199001000065-02-dialog.png` |

| `cola-26202001000840-01` | yes | no/unspecified | dark-on-light | 27 | review | `reference-not-located` | — | 2.05 | local `screenshots/cola-26202001000840-01-dialog.png` |

| `cola-26205001000390-01` | yes | no/unspecified | dark-on-light | 22 | review | `reference-not-located` | — | 2.39 | local `screenshots/cola-26205001000390-01-dialog.png` |

| `cola-26216001000317-02` | yes | no/unspecified | dark-on-light | 20 | review | `reference-not-located` | — | capture lost | none |

| `cola-26218001000008-02` | yes | no/unspecified | dark-on-light | 39 | review | `reference-not-located` | — | capture lost | none |

| `cola-26222001000694-01` | ambiguous | no/unspecified | dark-on-light | 27 | review | `reference-not-located` | — | 2.11 | local `screenshots/cola-26222001000694-01-dialog.png` |

| `cola-26226001000481-01` | yes | no/unspecified | dark-on-light | 14 | review | `heading-too-small` | — | 1.37 | local `screenshots/cola-26226001000481-01-dialog.png` |

| `cola-26228001000039-01` | yes | no/unspecified | dark-on-light | 13 | review | `heading-too-small` | — | 1.37 | local `screenshots/cola-26228001000039-01-dialog.png` |

| `cola-26232001000090-02` | yes | no/unspecified | dark-on-light | 19 | match | `contrast` | 1.540 | 1.42 | local `screenshots/cola-26232001000090-02-dialog.png` |

| `cola-26233001000025-01` | yes | no/unspecified | dark-on-light | 13 | review | `heading-too-small` | — | 1.58 | local `screenshots/cola-26233001000025-01-dialog.png` |

| `cola-26233001000026-02` | yes | no/unspecified | dark-on-light | 14 | review | `heading-too-small` | — | 1.56 | local `screenshots/cola-26233001000026-02-dialog.png` |

| `cola-26233001000352-02` | yes | no/unspecified | light-on-dark | 30 | review | `reference-not-located` | — | 2.19 | local `screenshots/cola-26233001000352-02-dialog.png` |

| `cola-26233001000600-02` | yes | no/unspecified | dark-on-light | 9 | review | `missing-heading` | — | 1.06 | local `screenshots/cola-26233001000600-02-dialog.png` |

| `cola-26233001000603-02` | yes | no/unspecified | dark-on-light | 9 | review | `missing-heading` | — | 0.99 | local `screenshots/cola-26233001000603-02-dialog.png` |

| `cola-26237001000144-01` | yes | yes | dark-on-light | 31 | review | `not-distinguishable` | 1.032 | 1.63 | local `screenshots/cola-26237001000144-01-dialog.png` |

| `cola-26237001000168-02` | yes | no/unspecified | dark-on-light | 19 | match | `contrast` | 1.482 | 1.08 | local `screenshots/cola-26237001000168-02-dialog.png` |

| `cola-26237001000210-02` | yes | no/unspecified | dark-on-light | 19 | match | `contrast` | 1.554 | 1.30 | local `screenshots/cola-26237001000210-02-dialog.png` |

| `cola-26238001000141-01` | yes | no/unspecified | light-on-dark | 11 | review | `heading-too-small` | — | 1.69 | local `screenshots/cola-26238001000141-01-dialog.png` |

| `cola-26238001000296-01` | yes | no/unspecified | dark-on-light | 21 | review | `missing-heading` | — | 1.71 | local `screenshots/cola-26238001000296-01-dialog.png` |

| `cola-26238001000333-01` | yes | no/unspecified | light-on-dark | 18 | review | `heading-too-small` | — | 3.48 | local `screenshots/cola-26238001000333-01-dialog.png` |

| `cola-26239001000576-01` | yes | no/unspecified | dark-on-light | 17 | review | `heading-too-small` | — | 2.67 | local `screenshots/cola-26239001000576-01-dialog.png` |

| `cola-26239001000582-01` | yes | no/unspecified | dark-on-light | 17 | review | `heading-too-small` | — | 1.63 | local `screenshots/cola-26239001000582-01-dialog.png` |

| `cola-26239001000600-01` | yes | no/unspecified | dark-on-light | 17 | review | `heading-too-small` | — | 1.68 | local `screenshots/cola-26239001000600-01-dialog.png` |

| `cola-26239001000677-01` | yes | no/unspecified | dark-on-light | 28 | review | `missing-heading` | — | 1.15 | local `screenshots/cola-26239001000677-01-dialog.png` |

| `prior-bruery-back-1` | yes | no/unspecified | dark-on-light | 47 | review | `reference-not-located` | — | 1.70 | local `screenshots/prior-bruery-back-1-dialog.png` |

| `prior-lote-maestro-back-2` | yes | no/unspecified | dark-on-light | — | review | `missing-heading` | — | 1.18 | local `screenshots/prior-lote-maestro-back-2-dialog.png` |

| `prior-ontanon-back-0` | yes | no/unspecified | dark-on-light | 11 | review | `heading-too-small` | — | 1.27 | local `screenshots/prior-ontanon-back-0-dialog.png` |

| `prior-vadio-back-0` | yes | no/unspecified | dark-on-light | 10 | review | `missing-heading` | — | 1.61 | local `screenshots/prior-vadio-back-0-dialog.png` |

| `prior-buffalo-trace-back` | yes | no/unspecified | dark-on-light | — | review | `missing-heading` | — | 2.57 | local `screenshots/prior-buffalo-trace-back-dialog.png` |


The result dialog screenshot includes the evidence crop when the app provided one. The source files and screenshots are local evidence; the committed [individual-results.jsonl](individual-results.jsonl) preserves every available finding text, status, reason, ratio and timing. [batch-results.json](batch-results.json) preserves all 34 batch appearance results and timings.

## Field checks

| Field | Eligible individual captures | Match | Review | Mismatch | Interpretation |
|---|---:|---:|---:|---:|---|

| Brand name | 27 | 1 | 26 | 0 | COLA brand can differ from prominent artwork text. |

| Class / type | 27 | 0 | 18 | 9 | COLA category often differs from printed class phrasing. |

| Alcohol content | 23 | 13 | 7 | 3 | Only rows with independently transcribed artwork ABV. |

| Net contents | 7 | 4 | 2 | 1 | Only rows with independently transcribed artwork volume. |

| Producer / address | 27 | 0 | 23 | 4 | COLA producer may differ from the bottler/importer declaration. |

| Government warning | 32 | 6 | 26 | 0 | OCR wording result; exact source wording was not independently scored. |


These are app statuses against entered values, not validated accuracy rates. The source pane is often only a back label, or a keg collar with multiple unchecked sizes. Several mismatches therefore reflect a category or source-value mismatch rather than a proven detector error. Country of origin is unmeasured. Small text, decorative fonts, and multi-panel layout appear in the source images; these are hypotheses for OCR abstentions, not verified causal diagnoses.

## Timing and batch accounting

The 32 captured individual click-to-result times on this Mac and headless Playwright Chromium were min 0.99 s, median 1.65 s, and empirical p95 3.32 s (nearest-rank method), max 3.48 s. The two lost captures are excluded from this distribution, though their batch timings remain saved. These runs reused the machine/network cache across fresh browser contexts and do not establish an uncached first-use p95 or slower-device performance.

The one batch status was: `Finished: 34 reviewed, 0 failed, 0 remaining. Total: 31.2 s. First result: 2.3 s from click. Inspect exceptions and make your final decision.`. The batch had 34 result cards for 34 distinct filenames, with zero app processing failures. Every captured individual appearance decision matched its batch counterpart. This is one batch, not a repeatability study.

## Proposed fixes, ranked by observed reach

1. Investigate localization and the 20 px floor on real artwork. `heading-too-small` affected 11 images, including `cola-26238001000141-01` and three `cola-262390...` wines. Preserve abstention until a separately qualified fix improves recovery.

2. Investigate heading OCR and reference-body localization. `missing-heading` affected 8 and `reference-not-located` affected 7, including `prior-buffalo-trace-back` and `cola-26233001000352-02`. Record whether a person can read each heading before changing the gate.

3. Build a verified real negative/control cohort and a human readability pass. Zero clear regular headings and no photo subset prevent a false Match estimate; the current apparent safety of three Matches is insufficient. Include body-bold controls beyond `cola-26237001000144-01`.

4. Improve source-to-application mapping for multi-panel labels before interpreting field mismatches. `cola-22339001000194-01` has multiple keg size boxes; `cola-26238001000141-01` has a complete 375 mL panel. Record imported status and exact artwork declarations independently.


No detector code, cutoff, fixture, test, deployment, or previous evidence file changed in this measurement. D-004 now has human-scored real artwork and measured app outputs, but remains open for specificity, photographs, category balance, and independently verified field and wording truth.
