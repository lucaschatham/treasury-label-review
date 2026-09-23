# Appearance repair follow-up: local evidence

The production release remains the verified partial release recorded in `partial-release-verification.json`. The changes in this checkout have **not** been deployed.

The candidate accepts a confidently read uppercase `GOVERNMENT WARNING` heading when OCR separates, mislabels, or omits the colon token. Exact punctuation remains part of the independent warning-text finding. A tightly bounded OCR `I` box can recover a kerned serif stem when connected-component ordinal selection fails. The 0.17 stroke threshold and both cloud models remain unchanged.

| Fixture set | Deployed method: bold local passes | Candidate: bold local passes | Candidate: regular local passes |
| --- | ---: | ---: | ---: |
| Known fresh labels, 8 paired fonts/sizes | 7/8 before this repair | 8/8 | 0/8 |
| Previously inspected holdout, 40 pairs | 34/40 before this repair | 39/40 | 1/40 |
| New frozen holdout, 40 pairs | 25/40 | 33/40 | 6/40 |

The new holdout was generated and hashed before inspecting the candidate's results. Its eight font families and five layouts are recorded in `appearance-holdout-v2-frozen.json`. `appearance-heading-holdout-v2-local.json` records every result and the deployed-method comparison. The seven candidate bold misses are Helvetica Narrow and Arial Narrow headings. The six regular examples that pass the local guard include five Copperplate and one Futura. These require model judgment before any automated Match; a local pass is not a false Match by itself.

The local upper bound of 33/40 on the untouched holdout is below the release gate of 38/40 final bold Matches. Cloud calls cannot recover locally vetoed headings, so three real-service runs, latency measurement, full-runtime autoreview, and a new deployment were not performed. The known regular Century 24 and 32 crops remain locally vetoed; the paired bold crops pass. `npm test` passed 68 tests and `npm run build` succeeded.

Next design decision: investigate narrow fonts without lowering the existing stroke safeguard. A replacement should distinguish narrow bold stems from regular headings using new independent evidence, then be frozen and tested against an additional untouched family/layout holdout before promotion.
