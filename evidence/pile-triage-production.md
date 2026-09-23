# Pile triage production release

User explicitly requested production promotion on September 23, 2026.

- Runtime source: `167f3fe`; branch `pile-triage` published to origin.
- Verified preview: `dpl_EDJW66VQDQQX6DzyiXM14wesf7gt`.
- Production deployment created by Vercel promotion: `dpl_EYcKdGpSrh29MsJb4bga2u5k2wwj`.
- Project: `treasury-label-review`; target production; status Ready.
- URL: https://label-review-7b3.lucaschatham.com/
- Previous deployment for rollback reference: `dpl_6iYhiTKSpANanZGER1ayUMKgknKz`.

Anonymous HTTP checks confirmed noindex and byte-identical JavaScript/CSS assets against the reviewed local build (`index-Bq1lQ0-F.js`, `index-B-s6LiTS.css`). The separate main homepage still serves the Lucas portrait and primary navigation. No deployment was made to `site`.

Anonymous browser verification loaded the sample, collapsed setup, updated all stage counts, opened the decision dialog, and returned to the row with Seen status. The sample completed in 5.1 seconds on this run. The unchanged appearance service timed out (data-appearance reason timeout, status review), correctly leaving the label in Needs review. This is not a detector accuracy or latency improvement claim.
