# Label Review

[Open the deployed application](https://label-review-7b3.lucaschatham.com) · [Original assignment](./ASSIGNMENT.md) · [Requirements and trade-offs](./REQUIREMENTS.md)

A standalone alcohol-label verification prototype. Tesseract.js reads the image in the browser; deterministic comparisons check the application fields. A reviewer inspects uncertain findings and confirms the warning's appearance.

## Try it

1. Open the deployed application and select **Try the sample label**.
2. Select **Review labels**. The sample's text should match. **Warning appearance** deliberately remains **Review** until a person inspects the artwork.
3. Open **View original label artwork**, inspect the warning, then use its confirmation checkbox.
4. Change an application value and run again to test a mismatch. Editing inputs clears old results.

For a batch, open **Different applications in one batch** and use the CSV template with the three synthetic labels in [`public/samples`](./public/samples). The template supplies expected data for each filename. The second label has the wrong ABV; the third has a title-case warning heading. Without a CSV, all selected images share the form's expected values.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

The development command prepares the OCR assets automatically. Open the URL printed by Vite. To verify and build:

```sh
npm test
npm run build
npm run preview
```

`dist/` is a complete static deployment. No backend, database, environment secrets, or cloud AI API is needed. Dependencies are pinned in the lockfile. Reinstalling dependencies requires package-registry access; the deployed app's runtime assets all come from its own origin.

## Approach and tools

- **Vite and plain JavaScript:** a small static application with no account or installation required for reviewers.
- **Tesseract.js 7:** browser OCR with the English model, worker, and WebAssembly core hosted alongside the app. The engine starts loading while the reviewer enters data and is reused across reviews.
- **Deterministic matching:** case and punctuation normalization for text fields, contextual numeric ABV extraction and proof consistency, equivalent metric and US fluid-ounce volumes, exact government warning wording, and a mandatory visual appearance check.
- **Batch queue:** up to 300 images, with optional per-image CSV application data. Processing is sequential to bound memory, results appear as each image finishes, and a stop control ends after the current image.
- **Node's test runner:** regression coverage for normalization, warning strictness, quantities, ABV, CSV mapping, and input limits.
- **Vercel:** static hosting on an unlisted custom subdomain. Deployments currently use the CLI; GitHub automatic deployments are not configured.

For updates, verify `.vercel/project.json` names `treasury-label-review`, then run `vercel deploy --prod`. This project is separate from the `site` project that hosts the main homepage.

## Scope, assumptions, and limitations

- Each image represents one complete application's label artwork. Combine front/back panels into one image. There is no COLA integration, application-document OCR, or automated government approval.
- Brand, class/type, and net contents are required application inputs. Producer/address is checked when supplied and otherwise flagged for review. Imports require a country. ABV can be blank for an applicable exception, which remains a human review item.
- Automatic brand matching requires a standalone OCR line so a matching producer name cannot hide a different brand. Other layouts remain for review.
- Warning text comparison preserves every word and internal punctuation, but tolerates a dropped final period in OCR.
- An OCR text match does **not** prove boldness or physical font size. Warning appearance remains a separate required review item with the original image available at full size. A checkbox records the reviewer's confirmation; the app never claims AI verified typography.
- OCR mistakes, glare, curvature, stylized fonts, and poor photos can obscure correct text. Missing or ambiguous evidence becomes **Review**; a clear quantity difference becomes **Mismatch**. Low OCR confidence creates a separate review finding.
- Net contents supports mL, cL, L, and US fluid ounces, including spelled-out units. Plain ounces are ambiguous and require review. Cross-unit conversion accepts rounding to a whole milliliter (for example, 12 US fl oz and 355 mL); differences within the same unit system still require an exact numeric match. Unsupported units require manual review. Regulatory product-specific tolerances are not used to excuse a discrepancy between the application and artwork.
- Images must be PNG, JPEG, or WebP, at most 10 MB each and 200 MB per batch. Images above 40 megapixels are rejected after decoding; OCR bounds the longest side to 1800 pixels. Reducing large images can lose tiny text, so the original remains available for visual review.
- The five-second target is measured from **Review labels** to the first result, including any unfinished engine setup and image preparation. This is shown separately from per-image reading time. Hardware, connection, model cache, and image complexity affect latency. A 300-image batch is not expected to finish in five seconds.
- Images and application data stay in browser memory and are cleared on reload. The browser may cache the OCR model. There is no application persistence or analytics.
- The URL uses `noindex` and robots exclusions and is not linked from the main website. It is publicly accessible to anyone with the URL; it is not an access-control mechanism.

Warning wording and appearance guidance: [TTB distilled spirits health warning](https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning). The original assignment is preserved verbatim from upstream commit `62bd63cd2f6b5af088b1d3c3b039c48cfcb012ef`.
