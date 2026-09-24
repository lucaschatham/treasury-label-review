# Requirement 3: systematic-debugging findings

September 23, 2026. R-014 diagnostic, following R-001 through R-013. Applied the installed systematic-debugging skill: trace failures, compare a working control, state separate hypotheses, and test boundaries before proposing fixes.

## Findings

1. **Production and the rejected local model are different systems.** Source traces `main.js` → `reviewAppearance` → local glyph/stroke guard → Vercel API → Worker → two cloud models → `appearanceFinding`. R-012 is an offline MobileNet experiment, not the production detector. Its accuracy numbers cannot explain the production timeout.
2. **Local wrong decisions reproduce before UI or cloud processing.** Verified checkpoint, input-file and normalized-tensor hashes. CPU replay reproduced both regular false approvals (Superclarendon 0.991295; Georgia 0.978909), the missed TI-Nspire bold (0.220724), and passing Arial bold control (0.999984). Original cutoff: 0.5397067666053773. All verdicts match saved results; maximum numerical difference is about 0.0000026. This rules out UI mapping, cloud behavior, or a changed saved tensor as explanations for these replayed errors. It does not rule out flaws in the original preprocessing design.
3. **Timeout handling is distinct and behaves as written.** Three controlled assertions verified: timely unanimous BOLD plus stroke support yields Match; a provider deadline yields Review; unanimous BOLD without stroke support remains Review. These mocks verify routing, not provider reliability or actual latency.
4. **The production deadline budget is tight.** Source sets Worker inference deadline 4,000 ms, API fetch timeout 4,500 ms, browser request timeout 5,000 ms. OCR precedes appearance. The recorded production sample spent 637.1 ms on OCR and 4,542.1 ms on appearance, completing at 5,198.2 ms with timeout. That record does not identify which cloud model delayed, whether provider queueing dominated, or whether the Worker or proxy deadline fired. Per-model timing is absent from the returned result. Extending timeouts cannot be represented as solving the five-second objective.
5. **Underlying model failure remains partly unidentified.** R-013 established score overlap even with perfect locations. R-014 establishes reproducibility. Neither separates font coverage, renderer shift, resolution, or representation loss. The proposed 32-image crossed diagnostic remains unexecuted; it is not evidence that renderer mismatch is the cause.

## Architectural assessment

The production design requires a local heuristic and both general-purpose models to agree within a small remaining time budget. That adds several ways to return Review without proving that agreement reliably rejects heavy regular text. The alternative local model removes cloud dependence but its measured score is not a reliable general weight discriminator. More threshold tuning, timeout extensions, or another unmotivated training run would revisit recorded failures.

The skill says: “If ≥ 3: STOP and question the architecture” and “Discuss with your human partner before attempting more fixes.” Applied here as an architectural review, not proof that a particular replacement architecture is necessary. No additional fix was attempted. The smallest pending investigation is still the controlled font/renderer/resolution comparison; it must establish a mechanism before another candidate is trained. Real-artwork independent ground truth remains a separate qualification gap. The internal numeric gate is an engineering choice, not a new employer requirement.

## Reproduction and scope

- `node scripts/experiments/debug_boundaries.mjs`: three assertions passed, no network calls.
- Run `scripts/experiments/replay_systematic_debug.py` with the preserved local PyTorch/timm environment. Requires sibling research inputs and retained R-012 checkpoint, deliberately not fetched or silently replaced. Four verdicts reproduced. See `appearance-systematic-replay.json`.
- This is a diagnostic reproduction on exposed examples, not new accuracy validation. No reserved holdout, training, paid service, runtime edit, or deployment.
- Requirement 3 remains incomplete. Exact wording and uppercase behavior were not changed or newly qualified by this diagnostic.
