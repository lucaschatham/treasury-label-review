# Opus 5.5 design review

Requested by Lucas on September 23, 2026. Conducted in Claude Desktop with the model selector visibly set to Opus 5.5, in the existing Treasury label verification prototype review task.

Source of truth recovered from that task: [Pile Triage Handoff](https://claude.ai/artifact/8j1XxdE8WotEtQa7zCsv4m).

## Review and corrections

The first review rejected commit 46b7562 as visually and behaviorally incomplete. It confirmed the pile rules, separate human decisions, and tallies, but found the uncollapsed form, duplicate result headings/status text, plain-text buttons and rows, missing contextual reasons, and cramped mobile layout.

Corrections:

- Collapse setup to one line plus Edit application. Remove the hero and duplicate results heading during review.
- One delayed live announcement; the north star is the primary status. Running counts say “so far”. Completion timing stays on the secondary line.
- Structured twin buttons with tint, circle, label, count, chevron, shared selection, and separated curved connections.
- Active-step outlines, readable stage counts, and explicit incomplete counts for processing failures.
- Thumbnail, filename, reason, and one status/owner pill per row. Search covers reason text. Passed and Failed paginate at 50 rows while all instrumentation nodes remain mounted.
- Contextual send-back chips revealed on demand; keyboard A/S/L for individual decisions only. Bulk confirmation starts with focus on Cancel and disables shortcuts.
- Human reason remains visible after sending back; findings remain unchanged.
- Keep the optional one-line note because the user explicitly requested a note.
- Stack piles and flow below 720px; hide wires; retain system fonts, dark colors, readable text, and reduced-motion handling.

The second review described the revision as close to the handoff. Its two must-fix findings were bulk approval on the A key and hidden human reasons. Both were corrected and regression-tested.

## Verification boundaries

Claude inspected source and screenshots. It did not itself run the browser or test suite. Codex separately ran 84 unit tests and the build, exercised real sample OCR and decisions through the browser, and ran the 300-record synthetic UI harness. The latter verifies rendering, counts, pagination, and decisions; it is not a new 300-image OCR accuracy/performance run.

The real app has one `.pile-list`; apparent repetition in an older full-page screenshot was capture stitching. New real-app screenshots use viewport capture rather than stitching. Light-theme screenshots use the same stylesheet with its dark media block disabled in the development-only fixture. No user system appearance preference was changed.

The detector, Worker/API, OCR, review logic, and batch accounting modules remain unchanged. Only the preview project treasury-label-review is authorized here.

## Final review

Opus 5.5 returned: “no must-fix design or behavior issues.” It confirmed the earlier findings were fixed after reviewing source, real-app screenshots, and light-theme fixture screenshots. The dependency symlink remains untracked and is excluded by explicit staging. Optional chip-order and duplicate finish-call cleanups were also applied.
