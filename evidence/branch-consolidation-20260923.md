# Branch consolidation, September 23, 2026

The user authorized release of the latest pile-triage application, including spreadsheet intake, followed by branch consolidation. A concurrent task published and promoted the identical runtime while this task verified an isolated candidate. We retained that production release.

Production source: `a61f00a30b93aec2e0d0c0c232fc55cb3e73b8c5`. Deployment: `dpl_2j1z7TP5wBSwDk6e6tTMGuXMKF34`, project `treasury-label-review`. JavaScript, CSS, and lazy ExcelJS assets were byte-identical to the locally tested build. The separate homepage retains its portrait and primary links.

Fresh verification: 94 tests and build passed. Local browser entry, CSV/XLSX actual OCR, and 300-row UI checks passed. Protected preview sample took 6.8 seconds with appearance timeout; anonymous production sample took 2.4 seconds with uncached appearance Match. Production three-image XLSX batch took 2.6 seconds, with expected ABV 45 correctly associated with wrong-abv.png in Failed. Narrow-screen check passed without page errors. These samples do not qualify general boldness accuracy or consistent five-second performance. See consolidation-preview-20260923.json and consolidation-production-20260923.json.

Seven superseded local branches are retained as local archive/20260923/* tags. Failed experiments were not merged into the application or uploaded. All original worktree directories remain at their recorded commits, detached from deleted branch names. Original research uncommitted files were verified byte-for-byte unchanged.

Local recovery bundle and uncommitted archives: `/Users/HQ/Projects/lucaschatham.com/treasury-branch-archive-20260923`. The directory contains inventory.json, archived-branches.json, verified Git bundles, uncommitted file archives and SHA256SUMS. These backups and experiment tags are local only. The main branch is the active development branch in treasury-label-review-release. Remote pile-triage and requirement-gates were verified as ancestors of main before deletion.
