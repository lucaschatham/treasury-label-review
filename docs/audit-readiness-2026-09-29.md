# Audit readiness: alcohol-label review prototype

## Conclusion

Core reviewer workflows have fresh browser evidence. Automated warning-boldness accuracy on real artwork remains incomplete. This audit found and repaired an independent availability defect: an OCR language download failure could leave review permanently busy. Do not describe the project as satisfying every assignment requirement.

This report covers the standalone take-home prototype, not a regulatory compliance certification or a production government-system security assessment. The rubric is `ASSIGNMENT.md`. The requirement ledger is `REQUIREMENTS.md`.

## Fresh verification

| Area | Evidence | Scope and result |
| --- | --- | --- |
| Reproducible installation | `evidence/audit-clean-build-2026-09-29.json` | Source-only export, fresh npm installation, 87 tests and production build pass. Runtime asset hashes recorded. |
| Candidate browser workflows | `evidence/audit-clean-workflows-2026-09-29.json` | Nine scenarios pass in Chromium 145 on macOS ARM64, including model-download failure and reload recovery. |
| Existing production workflows | `evidence/audit-production-workflows-2026-09-29.json` | Eight normal workflows pass anonymously against the public app. This run predates the startup fix release. |
| Existing production/source parity | `evidence/audit-production-parity-2026-09-29.json` | HTTP 200, noindex, production JS/CSS exactly match the clean pre-fix build. |
| Dependency advisories | `evidence/audit-dependencies-baseline-2026-09-29.json` | npm registry audit reports zero known vulnerabilities for the baseline. Candidate installation also reports zero. This does not prove absence of vulnerabilities. |
| Credential signatures | `evidence/audit-credential-signatures-2026-09-29.json` | No matches for four credential/private-key signatures in 497 tracked text files on investigation source `4e17fe2`. Limited scan; excludes Git history and unrecognized secret formats. |
| Failure reproduction | `evidence/audit-startup-before-fix-2026-09-29.json` | Identical model-503 browser scenario fails on the pre-fix build. |

### Browser scenarios

1. Sample upload, real OCR, findings, human approval, unchanged automated findings, protected reset, and clearing results on reload.
2. CR-only CSV with reversed image order, different expected ABVs, correct per-file findings, and a hostile-looking filename rendered as literal text.
3. Real XLSX workbook intake and correct expected values.
4. Corrupt PNG fails individually while a valid second image completes.
5. Missing spreadsheet/image association and 301-image intake are rejected before review.
6. Stop after the current label retains completed rows and accounts for remaining work.
7. Warm offline review completes using the existing worker and selected image. A cold offline visit is not supported.
8. Narrow viewport, decision dialog fit, Escape behavior and cancelled application edits preserve findings.
9. HTTP 503 for the English OCR model produces an actionable error, restores controls, and succeeds after connectivity is restored and the page reloads.

All scenarios check unhandled page errors and observed request destinations/methods. The controlled workflows request only same-origin assets with GET. This is a behavior check, not a general network-security proof. It exercises Chromium with a mobile-sized viewport, not an actual phone or a Safari/Firefox compatibility matrix.

## Defect repaired

Tesseract 7's initialization chain can report a language-load error via `errorHandler` while its returned `createWorker` promise remains unresolved. The old application awaited that promise indefinitely. Its ordinary `.catch()` did not restore the interface in that case.

`src/ocr-startup.js` bridges that error callback, sets a 60-second initialization deadline, preserves sparse-text configuration, and releases a worker if it arrives after failure. Failed initialization remains cached until reload to avoid accumulating retry workers that the dependency has not exposed for termination. Reloading clears this session's selections and decisions, as documented by the existing session model. The timeout is an availability bound, not a five-second performance claim.

Four unit regressions cover callback failure, successful reuse/configuration, timeout with late cleanup, and configuration failure. The browser test verifies the real dependency's 503 behavior before and after the repair. No appearance threshold, typography decision, OCR model or segmentation setting changed.

## Assignment coverage

| Requirement | Audit status |
| --- | --- |
| 1. Compare artwork/application fields | Recorded field tests remain; fresh CSV/XLSX and correct/incorrect ABV browser cases pass. No universal OCR accuracy claim. |
| 2. Harmless capitalization differences | Normalization and different-brand unit regressions pass. The exact two-image capitalization workflow was not independently rerun in this audit. |
| 3. Exact warning, uppercase and bold | Wording/case regressions pass. Real-artwork boldness remains incomplete. Existing measured coverage is 7/33 human-bold headings (`evidence/audit-real-label-baseline-2026-09-29.json`, copied unchanged from R-044); no qualified real regular-heading negative cohort. |
| 4. OLD TOM sample | Fresh real OCR and appearance Match pass locally and in production. |
| 5. About five seconds | Sample timings are recorded in browser results. They cover these machines/runs, not every device or label. |
| 6. Batch 200–300 | Fresh small batches, stop accounting and 301-image rejection pass. Earlier 300-image evidence remains historical; a full 300-image OCR run was not repeated here. |
| 7. Simple reviewer workflow | Fresh intake, dialog, decision, cancellation, reset and narrow-viewport checks pass. Full screen-reader and cross-browser audits remain unperformed. |
| 8. Standalone/privacy/network assumptions | Observed image review is local; sampled requests are same-origin GETs. Browser caches may retain OCR assets. Application images/results are session-only. |
| 9. Source/setup/documentation | Clean install, tests and build pass. Repeatable audit command and CI workflow added. Historical Python experiments are outside the app's npm test suite. |
| 10. Accessible deployed URL | Existing public URL responds and passes anonymous browser workflows. Post-release evidence must identify the startup-fix deployment separately. |

## Remaining material limitations

- **Boldness correctness:** relative heading/body thickness does not establish font style in all cases. Human approval remains separate from automated findings. No failed experimental classifier is integrated.
- **Resource exhaustion:** image dimensions are checked after browser decoding; XLSX row limits are checked after workbook decompression. Compressed upload limits do not fully bound decoded memory. Prior full-repository review reported these issues; this audit does not claim they are fixed.
- **Recovery scope:** startup has a deadline; individual OCR recognition has no separate deadline. A pathological recognition hang is not covered by the startup fix.
- **Durability:** reload clears images, results and decisions. This prototype has no durable decision history, reviewer identity, access control or regulated record-retention system. If the audit requires those capabilities, the current prototype does not meet them.
- **Reproducibility of historical experiments:** several real-image assets and font fixture sets are preserved locally or excluded from Git. They cannot all be rerun from an arbitrary clean clone. The new workflow audit uses committed sample artwork.

## Reproduce the workflow audit

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run audit:e2e
```

The final command starts a local preview on an available port, runs the browser scenarios, closes the server and writes `evidence/audit-latest.json`. On Linux, browser system libraries may require `npx playwright install --with-deps chromium`. CI uses that command and retains the JSON artifact. A failed scenario exits nonzero. CI status is evidence only after a run completes successfully.

The initial audit harness checked reset completion before the asynchronous dialog handler finished. It was corrected to wait for row removal; the failed first run is preserved in `evidence/audit-local-workflows-2026-09-29.json`. A later result-format repair prevents the stop-status text from overriding the scenario PASS field. The clean final run uses both repairs. Neither repair changes application behavior.

## Release record

At report creation the repair is a verified local candidate. Publish the source, verify CI and a protected preview, then record the exact production deployment and anonymous post-release run before claiming it is live. Keep the existing real-label limitation visible during release.
