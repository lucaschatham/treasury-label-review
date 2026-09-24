import test from 'node:test';
import assert from 'node:assert/strict';
import { localThickness, median, referenceCapitals, weightContrast, backgroundLuminance, CONTRAST_CUTOFF, MIN_CAP_HEIGHT } from '../src/weight.js';

function canvas(width, height) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const ink = (x0, x1, y0, y1, value = 0) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) for (let c = 0; c < 3; c++) data[(y * width + x) * 4 + c] = value; };
  return { image: { width, height, data }, ink };
}
const word = (text, x0, y0, x1, y1, symbols = []) => ({ text, confidence: 96, bbox: { x0, y0, x1, y1 }, symbols });
const symbol = (text, x0, y0, x1, y1) => ({ text, confidence: 96, bbox: { x0, y0, x1, y1 } });
const blocks = words => [{ paragraphs: [{ lines: [{ words }] }] }];

test('local thickness is sub-pixel and takes the thinner crossing', () => {
  const { image, ink } = canvas(40, 40);
  ink(10, 13, 5, 35);          // 3 px stem, 30 px tall
  ink(13, 14, 5, 35, 128);     // half-covered antialiased edge column
  const values = localThickness(image, { x0: 0, y0: 0, x1: 40, y1: 40 });
  assert.equal(values.length, 90);
  assert.ok(Math.abs(median(values) - (3 + (1 - 128 / 255))) < 1e-4);
  assert.equal(median([]), null);
  assert.equal(median([1, 3, 2, 4]), 2.5);
});

test('reference capitals are the first symbols of capitalised statement words below the heading', () => {
  const { image } = canvas(400, 200);
  const heading = { x0: 10, y0: 10, x1: 200, y1: 30 };
  const good = word('According', 10, 60, 120, 80, [symbol('A', 10, 60, 24, 80)]);
  const above = word('Surgeon', 10, 5, 120, 25, [symbol('S', 10, 5, 24, 25)]);
  const lowConfidence = { ...word('General,', 130, 60, 220, 80, [symbol('G', 130, 60, 146, 80)]), confidence: 50 };
  const notReference = word('Beverages', 10, 100, 120, 120, [symbol('B', 10, 100, 24, 120)]);
  const outside = word('Consumption', 10, 140, 120, 160, [symbol('C', 5, 140, 24, 160)]);
  assert.deepEqual(referenceCapitals(blocks([good, above, lowConfidence, notReference, outside]), heading, image).map(c => c.text), ['A']);
});

function statement(headingStem, bodyStem) {
  // Heading: four 24 px-tall stems of the given width; body capitals: three 24 px-tall stems.
  const { image, ink } = canvas(600, 200);
  const heading = { x0: 10, y0: 10, x1: 300, y1: 34 };
  for (let i = 0; i < 4; i++) ink(20 + i * 60, 20 + i * 60 + headingStem, 10, 34);
  const words = [word('GOVERNMENT', 10, 10, 150, 34), word('WARNING:', 160, 10, 300, 34)];
  for (const [i, text] of ['According', 'Surgeon', 'Consumption'].entries()) {
    const x = 20 + i * 100;
    ink(x, x + bodyStem, 100, 124);
    words.push(word(text, x, 100, x + 80, 124, [symbol(text[0], x, 100, x + bodyStem + 4, 124)]));
  }
  return { image, heading, blocks: blocks(words) };
}

test('a heading materially heavier than the statement capitals is bold; equal weight is not', () => {
  const bold = statement(6, 4);
  const result = weightContrast(bold.blocks, bold.heading, bold.image);
  assert.equal(result.supportsBold, true);
  assert.ok(Math.abs(result.ratio - 1.5) < 1e-6);
  assert.equal(result.capitals, 'ASC');
  const same = statement(4, 4);
  const equal = weightContrast(same.blocks, same.heading, same.image);
  assert.equal(equal.supportsBold, false);
  assert.equal(equal.reason, 'not-distinguishable');
  assert.ok(Math.abs(equal.ratio - 1) < 1e-6);
  assert.ok(CONTRAST_CUTOFF > 1.08 && CONTRAST_CUTOFF < 1.2);
});

test('missing, small, or unlocated references abstain instead of guessing', () => {
  const { image, heading, blocks: input } = statement(6, 4);
  assert.equal(weightContrast(input, null, image).reason, 'missing-heading');
  assert.equal(weightContrast(input, { ...heading, y1: heading.y0 + MIN_CAP_HEIGHT - 1 }, image).reason, 'heading-too-small');
  const twoCapitals = blocks(input[0].paragraphs[0].lines[0].words.slice(0, 4));
  assert.equal(weightContrast(twoCapitals, heading, image).reason, 'reference-not-located');
  const small = statement(6, 4);
  for (const w of small.blocks[0].paragraphs[0].lines[0].words.slice(2)) w.symbols[0].bbox.y1 = w.symbols[0].bbox.y0 + 12;
  assert.equal(weightContrast(small.blocks, small.heading, small.image).reason, 'reference-not-located');
});

test('a light-on-dark statement is measured on its strokes, not the gaps, and scores like its dark-on-light twin', () => {
  const dark = statement(6, 4), light = statement(6, 4);
  for (let i = 0; i < light.image.data.length; i += 4) for (let c = 0; c < 3; c++) light.image.data[i + c] = 255 - light.image.data[i + c];
  assert.ok(backgroundLuminance(dark.image, dark.heading) > 200);
  assert.ok(backgroundLuminance(light.image, light.heading) < 50);
  const a = weightContrast(dark.blocks, dark.heading, dark.image), b = weightContrast(light.blocks, light.heading, light.image);
  assert.equal(a.polarity, 'dark-on-light'); assert.equal(b.polarity, 'light-on-dark');
  assert.ok(Math.abs(a.ratio - b.ratio) < 1e-9);
  assert.equal(b.supportsBold, true);
  const regular = statement(4, 4);
  for (let i = 0; i < regular.image.data.length; i += 4) for (let c = 0; c < 3; c++) regular.image.data[i + c] = 255 - regular.image.data[i + c];
  assert.equal(weightContrast(regular.blocks, regular.heading, regular.image).supportsBold, false);
});
