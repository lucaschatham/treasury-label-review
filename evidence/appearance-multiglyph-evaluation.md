# Multi-glyph warning check, September 22, 2026

The candidate adds a narrow-font fallback to the existing `I`-stem guard. It
requires a separately segmented `WARNING` word, an `I` stem at least 13% of cap
height, at least 43% ink coverage in the word box, and a median horizontal
midline ink run at least 16% of the word's eight-character pitch. The existing
17% `I` threshold still passes directly. Every local pass still requires both
fixed cloud models to corroborate bold weight before the final finding is Match.

The cutoffs were selected using the already-seen v1/v2 families, including
narrow bold and heavy regular pairs. The v3 manifest was frozen before the rule
changed, with eight new font families, five paired layouts per family, resolved
font metadata, image hashes, and an ImageMagick renderer version. Regenerate it
with `python3 scripts/freeze-appearance-holdout-v3.py`. This is synthetic
evidence, not a representative sample of submitted artwork.

| Set | Bold passing local check | Regular passing local check | Evidence |
| --- | ---: | ---: | --- |
| Seen development v1 | 40/40 | 1/40 | `appearance-multiglyph-dev-v1.json` |
| Seen development v2 | 40/40 | 6/40 | `appearance-multiglyph-dev-v2.json` |
| Known Century pair | 1/1 | 0/1 | `appearance-multiglyph-century.json` |
| New held-out v3 | 38/40 | 0/40 | `appearance-multiglyph-heldout-v3.json` |

The held-out bold failures are `Bodoni-72-2-bold` (unusable glyph geometry)
and `Iowan-Old-Style-0-bold` (insufficient word-stroke evidence). The local
result establishes only that 38 images can reach cloud inference. It does not
establish 38 final Matches, zero cloud false Matches, three-run stability, or
five-second end-to-end latency. All 70 unit tests and the Vite build passed
after the rule change. Keep the current deployment until those integrated gates
pass.
