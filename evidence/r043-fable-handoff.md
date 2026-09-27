R-043 is unused on `main` (zero occurrences), and the association rule is exactly the one quoted (`src/weight.js:90`). No dollar cap or budget telemetry exists in this environment; I used one read-only tool call and no agents, so spend is well under the limit, but I cannot guarantee a number.

## 1. Decision and confidence

**Yes, inline-body association is the right next intervention, with moderate confidence.** It is the only failure class in the real set that the evidence pins on a code rule rather than on source information: the `y0 < heading.y1` gate structurally discards A, S and G whenever the statement starts on the heading's line, and five of seven reference failures have that layout. It is single-pass, touches one function, and leaves the estimator, floor, cutoff and polarity untouched, so R-040/R-041 regressions can be required to be bit-identical.

**Strongest reason it may fail:** the trace may show the inline words never reach the association step at all. Three OCR-level outcomes would sink it: Tesseract merges `WARNING:(1)` into one word so the heading is not located (that is `missing-heading`, not `reference-not-located`, but it would explain why some inline layouts produce no candidates); the bold heading and regular inline body are emitted as separate lines whose word confidences fall under 80; or symbol boxes for A/S/G are absent or under 19 px. None of these is fixable by association, so the trace runs first and gates implementation.

I reject the alternative of deleting the vertical condition or gathering matching words page-wide: it converts the theoretical decoy risk (fact 6) into a real one.

## 2. Design

**Principle.** The statement body is the chain of words that continues from the heading's last word: first along its own row, then down consecutive wrapped rows. Membership is by contiguity with the heading, not by word content. Content (the four target words) is consulted only inside the chain. Anything not reachable by the chain is not the statement, whatever it says.

**Rules (all tolerances provisional, expressed in heading height H, to be checked against the R-043 trace, not tuned to it):**

1. *Row 0 (inline).* Candidates are words vertically overlapping the heading by at least 50% of the shorter height and starting at or right of `heading.x1 − 0.1H`. Walk them left to right from the heading's right edge; accept while the horizontal gap from the previous accepted edge is at most 1.5H. The first gap larger than that ends the row. This admits "(1) According to the Surgeon General," and stops at a column gutter.
2. *Rows 1…n (wrapped).* From words not yet accepted and lying below the previous row (`y0 ≥ prevRow.y0 + 0.5·prevH`), form the next row: words whose vertical overlap with each other is ≥50%. Accept the row only if its top is within 1.25·prevH of the previous row's bottom and its horizontal span overlaps the previous row's span by at least 50% of the narrower span. Within the row, walk from its leftmost word with the same 1.5×rowHeight gap rule. Stop at the first rejected row, at 12 rows, or at 90 accepted words (the statement is about 60).
3. *Reference selection inside the chain, in chain order.* A word whose letters-only key is a target word contributes its first symbol, under the unchanged gates (word and symbol confidence ≥80, valid boxes, symbol inside word, uppercase A–Z, measured height ≥19). *Physical split:* if a word's key is not a target and, after stripping a trailing hyphen, key + next word's key equals a target, accept the pair, using the first fragment's first symbol, and skip the second fragment. Evidence required: both fragments present and adjacent in the chain; no fragment is invented. The wording check stays on observed text and will still report the split as review, which is honest.
4. *Ambiguity.* Require the targets to occur in the order A, S, G, C by chain index (missing ones allowed) and each at most once. A repeated target within the chain, or an out-of-order sequence, abstains with a new reason `ambiguous-reference`. Missing heading and multiple headings keep their existing outcomes.
5. *Unchanged:* at least three references, 19 px floor on heading and references, one polarity decision from the heading ring, cutoff 1.1395677, estimator.

**Why the measurement stays valid.** The estimator's inputs are unchanged: uppercase first-symbol boxes of the same four words, the same gates, the same cap-height normalization. Inline capitals usually share the heading's point size, which makes the ratio a pure thickness contrast, the case R-038 tested best. The polarity ring sits two pixels outside the heading box; the word space before "(1)" exceeds that, so an inline body does not enter the ring. (Unverified assumption: OCR heading boxes on real art are tight enough that the 2 px ring stays in background; the trace records ring luminance.)

**Counterexamples the rules handle.** Right column on the heading's row: excluded by the 1.5H gap. "General Store" ten lines below: unreachable once the chain ends. Two stacked statements: second statement's targets are duplicates in the chain, so abstain. Centered text: overlap rule uses spans, not left edges. Body above the heading: never a candidate. Statement in a smaller size than the heading: normalization handles it; the 19 px floor still applies to the capitals.

**Pseudocode (diff to `src/weight.js`, replacing `referenceCapitals`):**

```js
const INLINE_GAP = 1.5, ROW_GAP = 1.25, MAX_ROWS = 12, MAX_WORDS = 90; // provisional
const h = b => b.y1 - b.y0, vOverlap = (a, b) => Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
const union = (a, b) => ({x0: Math.min(a.x0,b.x0), y0: Math.min(a.y0,b.y0), x1: Math.max(a.x1,b.x1), y1: Math.max(a.y1,b.y1)});

export function statementChain(words, heading, image) {
  const H = h(heading), used = new Set(), chain = [];
  let row = {...heading}, cursor = heading.x1;
  const same = w => vOverlap(w.bbox, row) >= 0.5 * Math.min(h(row), h(w.bbox));
  // row 0: continue the heading's own row to the right
  for (const w of words.filter(w => validBox(w.bbox, image) && same(w) && w.bbox.x0 >= heading.x1 - 0.1 * H).sort((a, b) => a.bbox.x0 - b.bbox.x0)) {
    if (w.bbox.x0 - cursor > INLINE_GAP * H) break;
    chain.push(w); used.add(w); cursor = w.bbox.x1; row = union(row, w.bbox);
  }
  for (let rows = 1; rows < MAX_ROWS && chain.length < MAX_WORDS; rows++) {
    const below = words.filter(w => !used.has(w) && validBox(w.bbox, image) && w.bbox.y0 >= row.y0 + 0.5 * h(row) && w.bbox.y0 - row.y1 <= ROW_GAP * h(row)).sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
    if (!below.length) break;
    const top = below[0], members = below.filter(w => vOverlap(w.bbox, top.bbox) >= 0.5 * Math.min(h(top.bbox), h(w.bbox))).sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const span = members.reduce((s, w) => union(s, w.bbox), members[0].bbox);
    const overlap = Math.min(span.x1, row.x1) - Math.max(span.x0, row.x0);
    if (overlap < 0.5 * Math.min(span.x1 - span.x0, row.x1 - row.x0)) break;
    let next = null, edge = members[0].bbox.x0;
    for (const w of members) { if (w.bbox.x0 - edge > INLINE_GAP * h(span)) break; chain.push(w); used.add(w); edge = w.bbox.x1; next = union(next || w.bbox, w.bbox); }
    row = next;
  }
  return chain;
}

export function referenceCapitals(blocks, heading, image) {
  const words = flatten(blocks), chain = statementChain(words, heading, image);
  const key = w => String(w?.text || '').replace(/[^A-Za-z]/g, '').toLowerCase();
  const found = []; // {text, box, order}
  for (let i = 0; i < chain.length; i++) {
    let w = chain[i], k = key(w), target = REFERENCE_WORDS.has(k) ? k : null;
    if (!target && chain[i + 1] && /-$/.test(String(w.text).trim()) && REFERENCE_WORDS.has(k + key(chain[i + 1]))) { target = k + key(chain[i + 1]); i++; } // physical split, first fragment carries the glyph
    if (!target) continue;
    const s = w.symbols?.[0];
    if (!(w.confidence >= 80) || !s || !/^[A-Z]$/.test(s.text) || !(s.confidence >= 80) || !validBox(s.bbox, image) || !inside(s.bbox, w.bbox)) continue;
    found.push({text: s.text, box: s.bbox, target});
  }
  const order = ['according', 'surgeon', 'general', 'consumption'];
  const seq = found.map(f => order.indexOf(f.target));
  if (new Set(seq).size !== seq.length || seq.some((v, i) => i && v < seq[i - 1])) return {capitals: [], reason: 'ambiguous-reference'};
  return {capitals: found};
}
```

`weightContrast` gains one branch: an `ambiguous-reference` result abstains with that reason; otherwise behaviour is as today. `appearance.js` maps the new reason to a review finding ("Statement text ambiguous: more than one statement or out-of-order wording near the heading").

**Unverified assumptions, marked:** Tesseract PSM 11 emits inline body words as separate `words` with `symbols` (fact 2 says blocks are requested, so symbols should exist); the 1.5H and 1.25H gaps; that no real label places a second statement within 1.25 line heights of the first.

## 3. R-043 protocol (proposed, not registered)

*Question.* Does the association change, alone, recover correctly located A/S/G/C glyphs on the inline real sources, without altering any other outcome?

*Baseline.* `main` at `fed3b3d` (`src/weight.js` unchanged). *Candidate.* The same commit plus only the `referenceCapitals` change above. Record both file hashes and the bundle hash if a browser run is used.

*Frozen slice (hashes from `selected-annotation-sheet.csv`).* Primary: La Spinona, SIX, Base Camp, Bruery (clear-heading inline). Abstention case: `cola-26222001000694-01` (ambiguous, must stay Review). Discriminators: Rimfire, Concejo. Control: the human-flagged bold-body image (must stay Review). Regression: the three existing real Matches (identical ratio), R-040 112 fixtures and R-041 three arms (identical verdicts and ratios).

*Trace, per image, per arm, written by a Node runner that uses the app's exact OCR configuration on the prepared canvas:* every OCR word with text, confidence, box, and first-symbol text/confidence/box; the heading box or the locator's rejection; for each of the four targets, whether it was found, and the first gate that rejected it (`not-in-chain`, `word-confidence`, `no-symbol`, `symbol-not-uppercase`, `symbol-confidence`, `symbol-outside-word`, `height-below-19`, `duplicate/out-of-order`); the chain's row count and word count; selected glyph identities and coordinates; heading and reference cap heights; polarity ring luminance; thickness values, ratio, verdict, and Node OCR and measurement times. Codex overlays selected glyph boxes on the image and records whether each lands on the intended letter.

*Analysis.* Classify each failure image by first rejection reason on the baseline and on the candidate. The mechanism is supported only where the baseline reason is `not-in-chain` (the vertical rule) and the candidate reason clears.

## 4. Test matrix (synthetic, logic only)

| Case | Expected |
|---|---|
| Same statement below vs inline | Same four glyphs, ratio within 1e-9 |
| `CONSUMP-` / `TION` split | C taken from the first fragment; three-plus references |
| Right column on the heading row beyond 1.5H | Excluded; if that leaves fewer than three, `reference-not-located` |
| "General Store" fifteen lines down | Excluded |
| Two stacked statements | `ambiguous-reference` |
| Missing or duplicate heading | Unchanged existing outcomes |
| Capitals under 19 px or confidence under 80 | `reference-not-located` |
| Regular heading, inline body | `not-distinguishable` |
| Bold body, inline | `not-distinguishable` |
| Light-on-dark, inline | Same verdict as its dark-on-light twin |

Add an `--inline` layout to `render_full_labels.py` so the 14 exposed families can run through real OCR both ways; that arm must reproduce the below-layout verdicts. R-040 and R-041 fixtures remain regressions, not proof.

## 5. Pass and stop

Pass: usable, correctly located reference sets on at least two of La Spinona, SIX, Base Camp and Bruery; the ambiguous inline case and the bold-body control stay Review; the three real Matches, R-040 and R-041 outcomes identical; cutoff and floor untouched; browser click-to-result still around five seconds on the fresh baseline machine. This is an engineering screen, not an accuracy claim.

Stop if: any control or regular case matches; any selected glyph lands off its letter; the trace shows the inline words fail at OCR (no words, confidence, symbols or height) on three or more of the four primaries; or ambiguity cannot be resolved by the order rule. Do not loosen 80, 19 or the cutoff. If OCR evidence is absent, the next smallest diagnostic is a bounded second OCR pass on the heading row and the rows the chain would have covered, at native resolution, located purely from the heading box (no application text), with a strict added-time budget measured in the browser; that is a separate registration.

## 6. Handoff and what remains unproven

Codex next: register R-043 with the wording above, write the trace runner and the synthetic tests first, run the baseline trace before touching `weight.js`, then implement the change only if the trace supports it. Preserve the two lost individual captures as missing.

Unproven after a pass: real specificity (no judged regular-heading negatives exist), any of the `heading-too-small` and `missing-heading` groups, the 1.5H and 1.25H tolerances beyond the slice, and the assumption that a Match on an inline layout implies the remainder is not bold. Lucas's 72 judgments stand as recorded.