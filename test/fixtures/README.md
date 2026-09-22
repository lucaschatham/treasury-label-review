# Gate 0 corpus and experiment protocol

## Reproduce

Requires Node.js and ImageMagick 7 with Helvetica, Times, Courier, Palatino and New Century Schoolbook regular/bold faces available. These are test-only dependencies; the shipped application does not require ImageMagick. `renderer.json` records each resolved glyph file, metric file (when present), font collection face index and SHA-256. Reproducing the same pixels requires matching these font artifacts, not merely their alias names. Font files are not redistributed. If artifact hashes differ, treat the result as a new corpus environment and repeat validation.

```sh
npm test
node scripts/generate-corpus.js
```

The generator writes PNG images, `manifest.json` and `renderer.json` to the ignored `test/fixtures/generated/` directory. The manifest records application values, actual artwork values, warning text, font weight, intended defect, layout, source, byte size and SHA-256. The generator itself is the reproducible source; it does not use production comparison code for ground truth.

- 30 base labels: 10 each for spirits, wine and beer.
- 10 variants per design: valid, changed brand, changed ABV, changed volume, changed warning wording, title-case heading, regular-weight heading, missing warning, severe blur and simulated glare.
- 300 full-label images total. These are a diagnostic corpus, not a demonstrated successful 300-image batch.
- Blur and glare alter inspectability, not content ground truth: their `expectedDefect` is null and `quality` is difficult. Correct extraction or explicit uncertainty is acceptable; inventing a content discrepancy is not.
- 40 warning crops: 5 font families × 4 sizes × 2 weights.
- Design indices 1–5 are development and 6–10 held out; variants never cross splits.
- Typography fonts Helvetica/Times/Courier are development; Palatino/Century are held out.
- All artwork is synthetic and authored for this project. It is not a real-label accuracy benchmark.

## Run the OCR diagnostic

```sh
node scripts/benchmark-corpus.js
```

This runs sequential real OCR on all 300 full-label images, validates input hashes,
and applies the production text comparison function. Results include extracted
text, findings, confidence, per-image duration, environment and source revision in
`evidence/ocr-corpus-run.json`. This is a Node pipeline diagnostic. It does not
prove browser batch uploads, cloud capacity, automated typography or complete
five-second application reviews. Once results inform changes, these designs are
regression inputs rather than unseen validation inputs.

## Cloud typography experiment

The initial Cloudflare model experiment failed its simple bold/regular pair.
See [the recorded findings](../../evidence/vision-feasibility.md) and raw responses
in `evidence/vision-initial-probe.json`. Authentication and the user's explicit
model-terms acceptance are complete. Workers Free was verified in the dashboard.
Full quota consumption and 300-call capacity have not been demonstrated.

The unvalidated model has not been integrated into the application. The earlier
multi-run font matrix was an internal experiment proposal, not an assignment
requirement. Product acceptance follows [REQUIREMENTS.md](../../REQUIREMENTS.md).

Reference: [model API and license requirement](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/).
