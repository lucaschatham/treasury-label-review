# Pile UI release verification, September 23, 2026

Scope: working UI integration, CSV/XLSX uploads, input readiness, formatting instructions, decision protection and return timing. This is not a new detector qualification.

- 94 Node tests pass, including actual XLSX parsing, CSV equivalence, filename mapping, pile transitions, finding immutability and protected decision counts.
- Production build passes. ExcelJS is lazy-loaded; Vite reports its existing large chunk warning.
- Local browser entry checks pass: permanent zero board, drag/drop, format errors, details dialog and reload.
- Local browser spreadsheet checks pass for CSV and XLSX: real three-image OCR, picker/change and drop, staged and mixed uploads, missing-image gate, application associations, corrupt-file recovery, removal and clearing.
- Local 300-row synthetic UI fixture passes counts, pagination, twin selection, Seen, reason gate, keyboard decisions, bulk decisions, immutable findings, and timing/appearance attributes. This does not replace actual 300-image pipeline evidence.
- Real local OLD TOM sample returned in 0.7 seconds with its heading crop. Local appearance service was unavailable; result remained Needs review with an explicit service notice. This is not evidence of full five-second cloud verification.
- Real local sample approval was preserved when Clear files was cancelled. Changed application details prompted before clearing; cancelling and closing restored original values and retained the decision.
- Preview dpl_HVz8SAECkSQjf9jfXomSE4Nwtx37 reached READY. Authenticated HTTP verification confirmed real-app formatting help, readiness controls and reset dialog.
- OCR, comparison, appearance detector, Worker and API code have no diff against production source 2a46749.

Requirements 3 (boldness reliability) and 5 (representative five-second latency) remain incomplete as stated on main. Prior detector experiments are not repeated. The design-preview page is a local proposal and is not included in Vite's production entry.

Clean reproduction from committed source a61f00a passed npm ci (0 audit vulnerabilities), all 94 tests, and build. Its asset hashes match the preview and production. See pile-ui-production.json for deployment identity and current anonymous sample outcome.
