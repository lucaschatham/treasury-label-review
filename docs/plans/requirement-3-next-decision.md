# Next decision after R-016

Recommendation: one frozen-model training-coverage audit, before another training run. Apply systematic-debugging to identify a specific missing distinction; TDD to prevent a reject-all or font-specific workaround; verification-before-completion to keep exploratory evidence separate from a qualified solution.

## Fresh checks supporting the choice

Read all 158 historical challenge source image headers from the frozen manifest: 80 RGB, 78 RGBA, none I;16. The newly found grayscale-conversion bug therefore does not explain this particular historical input-mode path. This does not establish that every earlier renderer/preprocessor was correct.

Inspect saved R-012 training scores: Bitter, Merriweather, Source Serif 4 and Alegreya each have 32 regular examples and zero false Matches. Maximum regular scores are respectively 0.000241, 0.008111, 0.000901 and 0.000344. These are exposed training results, not generalization evidence. They refute the simplistic claim that regular serif training examples were absent; they do not prove coverage of heavy regular faces.

R-016 still falsely approves Superclarendon regular in both rendering paths at both sizes. Renderer substitution alone is insufficient. The remaining question is what distinction the learned representation fails to preserve across families.

## Bounded next action

1. Freeze existing R-012 checkpoint, input manifest and preprocessing. Use only exposed training examples and R-016 controls. No reserved fonts, inference services, new model or fitting.
2. Extract the classifier's penultimate features for the four failing Superclarendon regular controls and their matched bold controls. Compare against existing training examples. Define the representation layer and cosine-distance rule before results; record feature normalization and source hashes.
3. For each query, report its five nearest regular and five nearest bold training examples, distances and margins. Produce a contact sheet with actual source weight labels and family IDs. Include passing Arial controls to expose a uniformly broken extraction or distance calculation. Deduplicate identical tensors before ranking; ties use stable IDs.
4. Inspect whether failures cluster with bold training examples, whether close regular examples exist, and whether regular/bold paired features separate. Do not mistake model-space proximity for human visual similarity or causal proof.

Hypothesis: the learned features place heavy regular Superclarendon closer to bold examples than to available regular examples. If supported, inspect those exact examples and formulate a coverage or representation intervention. If close regular neighbors already exist, a simple missing-examples claim is weakened; inspect the decision head and margins. Neither outcome automatically authorizes retraining or proves the unique cause.

## Test-first and stop rules

Before implementing ranking, write behavioral tests for known cosine ordering, zero-norm rejection, identical-tensor deduplication and stable ties. Watch them fail, then implement minimally. Use genuine model features for the audit, not mocked embeddings as proof of detector behavior. Existing wrong-verdict tests remain RED and the passing bold control remains required; do not modify inference to make them green during this audit.

One extraction/ranking pass, eight Superclarendon controls plus passing Arial controls, no threshold tuning. Deliver one per-query table, contact sheet and decision. If the evidence does not distinguish an actionable mechanism, report that result rather than launch another candidate. Nine harness tests or nearest-neighbor separation cannot qualify detector accuracy. Independent real-artwork labels and browser latency remain separate requirements.

## Completion boundary

This turn performed the source-mode and saved-score checks above and wrote this specification. Feature extraction and the proposed ranking tests are not executed. The next turn should execute this bounded audit rather than generate another plan. No runtime code, training or production changes.
