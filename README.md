# Label Review

A standalone prototype for the [Treasury alcohol label verification take-home](./ASSIGNMENT.md). Reviewers enter application fields, upload one or more label images, and receive a field-by-field first pass with extracted OCR text. The reviewer makes the final decision.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Run `npm test` for comparison tests or `npm run build` for a static production build in `dist/`.

## Approach

- Tesseract.js reads images in the browser. Its worker, WebAssembly core, and English language model are served from this app, without a cloud OCR API.
- Deterministic comparisons check brand, class/type, ABV, net contents, and the full government warning text. Case and punctuation differences in brand/type are accepted; numeric ABV must match.
- Missing or uncertain OCR evidence is marked **Review**, not treated as a conclusive regulatory failure. A clear numeric ABV difference is marked **Mismatch**.
- A reviewer can inspect OCR text and compare it with the original label. Nothing is uploaded or stored by this application.

## Assumptions and limitations

- This is a first-pass aid, not a legal compliance decision or an official TTB system. It is not connected to COLA.
- OCR quality depends on the artwork. Small, curved, angled, or low-contrast text can fail. Initial OCR model load and large batches may exceed the stakeholder's five-second target; processing times are shown per image.
- OCR text cannot establish bold type, minimum font size, contrast, warning placement, or whether multiple label panels together satisfy the rule. The interface explicitly asks for visual review.
- Ten images can be selected at once; each must be PNG, JPEG, or WebP and under 10 MB. They are processed sequentially in one browser worker.
- Expected brand, type, ABV, and net contents are entered manually. Other TTB fields are outside this prototype's core checks.
- This public prototype is unlisted through an obscure URL and `noindex` metadata, but anyone with the URL can access it. Do not upload sensitive applications.

The required warning wording and formatting guidance come from [TTB's distilled spirits health warning page](https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning).
