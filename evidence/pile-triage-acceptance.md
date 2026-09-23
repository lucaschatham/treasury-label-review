# Pile triage acceptance

Source: branch `pile-triage`, based on production source `2a46749`.

Preview: https://treasury-label-review-2mio59qga-chathamworks-6954s-projects.vercel.app
Deployment: `dpl_5F39ZWff9UBtGkM82HVNXgkJCjnG`, Vercel project `treasury-label-review`, target `preview`, status `READY`.

The requested separate handoff page was not supplied or found. This checklist covers the requirements in the implementation request, rather than claiming verification of an unseen page.

- [x] Largest number shows Needs review labels. Machine and human tallies update independently.
- [x] Three colored, full-width pile buttons; default Needs review.
- [x] Four stages show counts and progress meters. The small and large buttons use one factory and share selection. Curved SVG wires update on resize.
- [x] Selected pile has a colored top edge, count, search, and empty state. Passed and Failed offer bulk decisions for undecided rows; sending back requires a reason chip.
- [x] Button rows open a native modal. Opening a New row marks it Seen. Later and completed decisions survive reopening.
- [x] Dialog shows reason, available evidence crop (otherwise original artwork), Label says/Form says, note, all checks, and decision actions. No appearance confirmation checkbox.
- [x] Rule precedence: processing error, mismatch, review/low confidence, pass. OCR confidence of 70 passes the confidence threshold.
- [x] Human decisions are separate from findings; frozen-finding tests prove immutability. Completed decisions show a person marker. Reload clears session state.
- [x] Keyboard Enter opens rows, Escape closes the dialog, and focus returns. Native radios support keyboard reason selection.
- [x] 400px dark layout has no horizontal overflow. System fonts and reduced-motion styling retained.
- [x] `npm test`: 82 passed. `npm run build`: passed. `git diff --check`: passed.
- [x] Deployed sample: real OCR, 1 reviewed/0 failed/0 remaining, timing/appearance attributes, modal approval, person marker, and reload reset passed with no browser page errors.
- [x] `src/appearance.js`, `src/review.js`, `src/batch.js`, `src/timing.js`, Worker, and API unchanged from base. Stop and batch accounting code retained.
- [x] Protected preview verified using authorized Vercel access. Production was not promoted. No deployment to `site`.

## Reproduce browser checks

Use an installed Playwright Core runtime and Chromium. Set `PLAYWRIGHT_MODULE` to its module entry point if it is not installed in node_modules.

1. Start `npm run dev -- --host 127.0.0.1 --port 5184`.
2. Run `node scripts/qa/pile-browser.mjs` for mixed-pile fixture interaction checks.
3. Run `node scripts/qa/pile-sample.mjs` for real OCR, decisions, and reload reset.

For a protected deployment, set `PILE_URL` and optionally `PILE_COOKIE_FILE` to a temporary Netscape-format cookie jar obtained through authorized Vercel access. Keep cookies outside the repository. Fixture checks import the development module and therefore run against the development server; the sample check runs against the built preview.

Screenshots: `pile-triage-400-dark.png` (fixture interaction state), `pile-triage-preview.png` (deployed sample).

The UI checks do not establish detector accuracy; detector behavior is unchanged.
