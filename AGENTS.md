# Project working instructions

## Requirement and attempt history

Before proposing, planning, or running a boldness experiment or revisiting an existing failure, read [REQUIREMENTS.md attempt history](REQUIREMENTS.md#attempt-history) and the relevant evidence. It is the current decision index; older reports' proposed “next steps” may already have been tried.

- Do not repeat a failed approach because its result is absent from conversation context. Search the list first.
- Reopening requires a specific changed mechanism, an explanation of how it addresses the recorded failure, a smallest disconfirming test, and a stop rule. Reference the prior approach ID. A renamed method, routine prompt variation, or threshold tweak alone is insufficient.
- Record the proposed attempt before running it. At closeout, update its result, status, root-cause confidence, evidence availability, and reopening condition. Append decision history and include the update in the experiment's commit when possible.
- Preserve earlier results and difficult examples. Exposed holdouts become development data. Keep missing or ambiguous evidence unresolved.
- Distinguish local eligibility from final Matches, development calibration from independent proof, software tests from detector accuracy, and API timing from browser click-to-result timing.
- Mark a problem resolved only when its stated criterion is verified. A new hypothesis or a passing subcomponent is not assignment completion.
- This registry is not authorization for new spending, scope expansion, deployment, or a fresh experiment after a stop decision. Follow the user's current instructions and constraints.

## Deployment separation

This repository is `lucaschatham/treasury-label-review`. Its intended Vercel project is `treasury-label-review`. Never deploy it to the separate main website project `site`. Follow the release checks in [README.md](README.md#release-safety). A documentation publication does not qualify a detector or authorize promotion.
