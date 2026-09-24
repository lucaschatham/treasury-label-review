# Requirement 3: test-driven solution plan

Status: planned, not implemented. Applies the globally installed test-driven-development skill and its writing-good-tests reference. Builds on R-001–R-014 in REQUIREMENTS.md. No new detector candidate is selected, trained, or qualified by this plan.

## Objective and constraints

Verify exact warning wording, uppercase heading and bold weight from supported artwork. Preserve existing wording/case behavior, UI, session decisions and batch accounting. Free resources only. A human decision cannot satisfy automated verification. Generalization remains unresolved; TDD catches regressions but does not invent a reliable classifier or prove performance on unseen fonts.

## Execution path

Existing failures + verified font/image provenance → RED regression tests → controlled 32-image diagnosis → one justified mechanism change → GREEN retained regressions → independent qualification → integration and browser timing → release decision.

The first executable step is a regression test against the real frozen local classifier, not a new training run. The R-014 replay asserts reproducibility of existing behavior, so it passes while the detector is wrong. Replace that purpose with separate expected-behavior assertions; do not alter the saved reproduction evidence.

## RED: specify behavior before implementation

Use `test/heading_weight_regression_test.py` for the future local candidate suite. Load the real checkpoint and verified tensors, not saved scores as the classifier. Expected labels come from verified source font weights, independently of inference. Test artifact availability as setup; missing files/import errors do not count as RED.

| Separate test | Input and expected behavior | Bug it catches | Current evidence, not a new test run |
| --- | --- | --- | --- |
| Regular Superclarendon cannot pass | `Superclarendon-cap-9-regular`: verdict must not be MATCH | Heavy regular strokes treated as bold | R-014 reproduces MATCH |
| Regular Georgia cannot pass | `Georgia-cap-9-regular`: verdict must not be MATCH | Small regular text falsely approved | R-014 reproduces MATCH |
| Clear TI-Nspire bold is detected | `TI-Nspire-4-bold`: verdict must be MATCH | Narrow bold incorrectly left unresolved | R-014 reproduces REVIEW; inspect original artwork/provenance before adopting as a clear-label expectation |
| Clear Arial bold remains detected | `Arial-same-family-bold`: verdict must be MATCH | Reject-all workaround | R-014 reproduces MATCH; existing passing control, not proof of RED |
| Heading weight does not depend on body weight | Same heading pixels with regular versus bold bodies: same heading decision | Reintroduction of R-010 body coupling | Existing invariant evidence; preserve as regression |

Run each new failing regression and capture the expected assertion failure before modifying classifier behavior. Do not assert exact floating-point scores: they are implementation outputs, not the requirement. Do not hardcode font IDs, filenames, or image hashes into inference to satisfy tests. Use hashes only for fixture integrity. Keep the complete exposed challenge set, including all failures, in the development evaluation.

## Diagnose before selecting GREEN implementation

Execute the already specified 32-image comparison: four exposed families × regular/bold × two renderers × matched 12px/24px cap heights. Freeze font files, preprocessing, original checkpoint and cutoff. Inspect pairs before inference. Analyze one factor at a time while holding the other factors fixed. Use no reserved holdout fonts.

- If changing renderer alone changes correct to incorrect decisions, trace rasterization/preprocessing differences before choosing a patch. A verdict flip establishes sensitivity, not automatically the full root cause.
- If both renderers fail at 24px, renderer matching alone is insufficient. Investigate representation and training coverage; do not assume another training run will fix them.
- If only 12px fails, establish what information survives rasterization. Do not silently exclude clear small text or redefine the accepted image contract.
- If no actionable cause emerges, record the unresolved hypothesis and stop candidate implementation. Do not tune the threshold against these examples.

This diagnosis is not a fix attempt and is not independent qualification. Register its exact protocol and stop rule in REQUIREMENTS.md before running.

## GREEN and REFACTOR

Once a cause is supported, document the changed mechanism against its parent attempt ID. Implement one change sufficient to address the failing behavior. Run the individual RED test, then every retained regression and the full exposed development evaluation. A fix for one negative must not turn clear positives into Review. Do not replace failed examples or change expected labels to obtain green.

For new helper/adapter code, write and observe its own failing behavior test before implementation. Refactor only after green. Retain existing legacy implementations as historical evidence; this plan does not authorize deleting preserved models or rewriting production wholesale.

## Preserve requirement 3 integration behavior

Existing `test/review.test.js`, `test/appearance.test.js`, and `test/vision.test.js` cover exact wording, punctuation, uppercase, separate typography findings, geometry, provider failure and disagreement. Preserve those tests instead of duplicating them. Before changing any integration behavior, add its missing failing case at the real consumer boundary.

- Exact warning text must not automatically mark typography passed.
- Missing or altered warning and title-case heading remain findings even if a weight classifier reports bold.
- Service failure, timeout, or malformed response stays unresolved, never an automatic pass.
- Human Approve/Send back remains separate from machine findings.

Mock only external provider calls for deterministic error/deadline tests. Those tests establish routing, not model accuracy or service speed. Classifier regression tests must run real inference. Software tests and statistical evaluation remain distinct.

## Qualification and completion

After development passes, freeze the candidate and evaluate the untouched font-family holdout and independently annotated real artwork. Preserve the existing internal zero-false-approval and 38/40-bold gate as an engineering criterion, not an employer requirement. Report uncertainty, all errors and abstention coverage. A failed holdout becomes exposed development data; do not tune against it and rerun it as independent proof.

Only then integrate and run npm test, npm run build, full warning/image regressions, sample and batch checks, and uncached click-to-result browser timing including OCR. The five-second target concerns completed required findings; a quick timeout or fast local replay does not meet it. Deploy only a qualified candidate to treasury-label-review, never site.

## Deliverables and current boundary

Planned outputs: failing assertion logs, frozen diagnostic inputs/protocol, per-image results, one evidence-backed implementation diff if justified, passing regression logs, independent evaluation and browser evidence. Today only this plan was written. No RED/GREEN cycle, diagnostic generation, model training, runtime change, or deployment has been performed for this plan.

## Executable next step: isolate the existing rendering paths

This section refines the next diagnostic after applying systematic-debugging, test-driven-development and verification-before-completion together. It supersedes any interpretation of “two renderers” as Pillow versus AppKit. Source inspection of `prepare_mobilenet.py` shows training uses Pillow/FreeType and historical challenge reconstruction uses ImageMagick. The separate `render_headings.swift` is not that historical path. Comparing against it first would introduce another variable.

**Decision:** build and run one bounded, offline diagnostic of the frozen R-012 candidate. Do not select another model or train again. This is an experiment specification, not a claim that renderer mismatch caused the failure.

### Inputs and preflight

- Use exposed Arial, Georgia, Superclarendon and TI-Nspire regular/bold faces only. Resolve the exact font file and face index used by the historical fixture; compare hashes and face metadata across both renderers. A shared filename is insufficient for a font collection. Reject font fallback or synthetic weight substitution.
- Use Pillow and ImageMagick, record their versions and underlying font-library information when available. These are rendering paths, not necessarily independent rasterization engines.
- Render GOVERNMENT and WARNING: separately at fixed integer origins on white RGB backgrounds with identical black foreground. Use identical text and word-padding rules. This deliberately removes spacing/shaping and crop-policy differences from the first comparison; results do not isolate every difference in the original end-to-end generators.
- Target 12 and 24 pixel cap heights, measured on rendered H with the same fixed ink threshold (128) in both paths. Record actual heights and selected font sizes. Require exact height agreement within each renderer pair; if unattainable without resampling, mark the pair invalid rather than resizing to conceal the mismatch. Preserve antialiased pixels for model input; the threshold is for measurement only.
- Use each word's observed ink bounds plus two pixels padding in both paths, then the unchanged `prepare_words` packing. Save original words, boxes, packed RGB and normalized tensor hashes. Assert neither crop clips foreground. Do not claim to measure renderer-only effects if those controls fail.
- Verify R-012 checkpoint SHA-256 `62044f837c91a6cd55d223a9f85f540cdac3fe1ceab9ddb1906761a750e2a831`; keep cutoff `0.5397067666053773`. No calibration step.

### Test-first harness work

1. Write separate behavior tests for mismatched font face, unequal measured cap heights, clipped crops, duplicate/missing matrix entries and attempted output overwrite. Observe each fail for its intended missing validation before implementing that validation. A missing dependency is setup failure, not RED.
2. Implement only the manifest validation and renderer adapters needed for 4 families × 2 weights × 2 rendering paths × 2 sizes = 32 classifier inputs. Archive both word images per input. Inspect a contact sheet before inference. Stop if preflight fails; do not silently replace fonts or expand the set.
3. Write the desired-behavior classifier tests described above, backed by actual inference, and capture the original incorrect verdict assertions. Keep those failures in a separately invoked experimental suite, clearly labeled as unresolved. Do not introduce knowingly failing research checks into the normal application test command and then describe that suite as passing.
4. Score the 32 valid inputs once on CPU. Persist every score and decision, including errors, before analysis. No reruns with adjusted thresholds or font sizes after viewing scores.

### Decision table

| Observation | Supported conclusion | Next action and stop rule |
| --- | --- | --- |
| Same face/weight/size changes correctness across paths | Sensitivity to controlled rendering path | Inspect pixel/packing differences in that pair; propose one mechanism only after locating the difference. No training yet. |
| Both paths misclassify at 24px | Rendering-path substitution alone is insufficient on those cases | Record rejection of that proposed remedy. Do not automatically prescribe more training; representation/coverage remains unresolved. |
| Errors occur only at 12px | Size sensitivity in this controlled set | Inspect retained information and original clear-artwork failures. Do not silently narrow supported inputs. |
| All controlled examples pass | Original failures require conditions absent from this set | Return to original failing input and vary one original condition, such as polarity or crop policy. Do not call the detector fixed. |
| Preflight cannot establish matched inputs | Experiment cannot support a causal comparison | Fix the experimental control or report setup blocked; no inference conclusion. |

A decision flip is not the only signal: retain paired score deltas and regular/bold ordering. A large score shift without a flip still indicates sensitivity, but no delta threshold will be selected post hoc to declare success. Mixed outcomes receive per-pair explanations, not a forced single cause.

### Verification and deliverable

The diagnostic delivers a frozen manifest, renderer/adapter source hashes, RED logs, validated 32-case outputs, visual inspection record, per-pair comparison and one recorded decision in REQUIREMENTS.md. It does not deliver a production fix. Limit work to existing local tools and exposed fonts, one inference pass, no cloud quota or new dependencies unless necessary and explicitly documented. Reassess any setup problem lasting more than five minutes before broadening the harness.

Before reporting completion, rerun harness tests, verify all expected rows and hashes, inspect actual command exit codes, and distinguish expected detector failures from harness failures. Before any subsequent implementation, record the evidence-supported mechanism and its failing regression. Generalization and browser timing gates remain separate and unchanged.

### Verification of this specification

Source inspection confirmed: training `render_words` draws separate words with Pillow and computes metric-based padded boxes; historical `renderer_boxes` reconstructs the full ImageMagick heading and verifies its pixels before locating words; `prepare_words` applies shared aspect-preserving bicubic packing into 224×224. Therefore the earlier broad renderer comparison would confound rasterization, word placement and crop construction unless these controls were specified. No new experimental result is claimed.

Planning deliverable complete; diagnostic not executed. Further planning should stop here. The next action is test-first harness implementation and the controlled diagnostic above.
