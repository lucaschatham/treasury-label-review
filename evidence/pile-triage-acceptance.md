# Pile triage acceptance

Source: branch `pile-triage`, based on production source `2a46749`.

Preview: https://treasury-label-review-2mio59qga-chathamworks-6954s-projects.vercel.app
Deployment: `dpl_5F39ZWff9UBtGkM82HVNXgkJCjnG`, Vercel project `treasury-label-review`, target `preview`, status `READY`.

The original [Pile Triage Handoff](https://claude.ai/artifact/8j1XxdE8WotEtQa7zCsv4m) was recovered in Claude Desktop during the follow-up. Opus 5.5 reviewed the implementation three times; its final verdict was no must-fix design or behavior issues. See `pile-triage-opus-review.md` for findings, fixes, and verification boundaries.

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
- [x] `npm test`: 84 passed. `npm run build`: passed. `git diff --check`: passed.
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

## Follow-up verification

- [x] Original handoff recovered and reviewed with Opus 5.5.
- [x] Collapsed setup, one primary results heading, structured twin buttons, row evidence/reasons, contextual dialog, and responsive stacking implemented.
- [x] Bulk shortcuts disabled; Cancel receives focus. Human reason and single owner pill remain visible.
- [x] 300 synthetic records: unique rows, totals, pagination, individual/bulk decisions, immutable findings, and instrumentation verified in the development-only browser harness.
- [x] Real sample OCR: running, completed, and dialog states captured. Exactly one list in real DOM; width 400 CSS px with no horizontal overflow.
- [x] Light and dark CSS inspected. Light evidence comes from the shared stylesheet in the fixture; dark real-app evidence includes collapsed form and dialog.
- [ ] A fresh full 300-image OCR run was not performed during this design audit. Synthetic UI evidence must not be presented as OCR performance or accuracy evidence.

Current screenshots use `pile-triage-v2-*`. The original screenshots are retained as historical evidence.
