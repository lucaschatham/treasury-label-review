// Local heading-versus-statement weight contrast. Pure functions over RGBA
// ImageData-like objects ({width,height,data}) and Tesseract block trees.
// Ported from scripts/experiments/subpixel_weight_diagnostic.py (R-038).
export const INK = 128;
// Operating floor: a nominal 20 px cap height. OCR boxes under-measure 20 px capitals by up to
// 1 px (R-039), so the measured-box floor is 19 px. At 16 px, one pixel of box error consumed the margin.
export const MIN_CAP_HEIGHT = 19;
export const MIN_REFERENCE_CAPITALS = 3;
export const MIN_INK_PIXELS = 20;
// Frozen before R-039 from R-038 rows whose body capitals were at least 16 px:
// bold minimum 1.19536, regular maximum 1.08378, logit-free midpoint.
export const CONTRAST_CUTOFF = 1.1395677;
// The required statement's capitalised body words; their first symbol is the reference glyph.
const REFERENCE_WORDS = new Set(['according', 'surgeon', 'general', 'consumption']);

const luminanceAt = (image, x, y) => {
  const o = (y * image.width + x) * 4;
  return .2126 * image.data[o] + .7152 * image.data[o + 1] + .0722 * image.data[o + 2];
};

// Background luminance of a region: the median of a one-pixel ring two pixels outside the box.
// Text boxes are mostly background along their edges, so the median is robust to glyph pixels.
export function backgroundLuminance(image, box) {
  const x0 = Math.max(0, box.x0 - 2), y0 = Math.max(0, box.y0 - 2), x1 = Math.min(image.width, box.x1 + 2), y1 = Math.min(image.height, box.y1 + 2);
  const values = [];
  for (let x = x0; x < x1; x++) { values.push(luminanceAt(image, x, y0)); values.push(luminanceAt(image, x, y1 - 1)); }
  for (let y = y0 + 1; y < y1 - 1; y++) { values.push(luminanceAt(image, x0, y)); values.push(luminanceAt(image, x1 - 1, y)); }
  return median(values);
}

// Ink profile in 0..1. Dark ink on a light background keeps the original 1 - luminance/255 scale
// (bit-identical to the qualified R-040 behaviour); a dark background flips it so light strokes
// are ink. R-041 stage 1 showed the unflipped profile measures letter gaps on inverted statements.
function inkProfile(image, box, darkBackground = backgroundLuminance(image, box) < INK) {
  const {x0, y0, x1, y1} = box, w = x1 - x0, h = y1 - y0;
  const profile = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = ((y0 + y) * image.width + x0 + x) * 4;
    const luminance = luminanceAt(image, x0 + x, y0 + y);
    profile[y * w + x] = image.data[o + 3] > 200 ? (darkBackground ? luminance / 255 : 1 - luminance / 255) : 0;
  }
  return {profile, w, h};
}

// Sub-pixel crossing width along one axis: for each binary ink run, the ink mass of the
// run plus one antialiased edge pixel on each side, assigned to every pixel of the run.
function crossingMass(profile, w, h, horizontal, out) {
  const length = horizontal ? w : h, lines = horizontal ? h : w;
  const at = horizontal ? (line, i) => line * w + i : (line, i) => i * w + line;
  for (let line = 0; line < lines; line++) {
    let i = 0;
    while (i < length) {
      if (profile[at(line, i)] <= .5) { i++; continue; }
      const start = i;
      while (i < length && profile[at(line, i)] > .5) i++;
      let mass = 0;
      for (let k = Math.max(0, start - 1); k < Math.min(length, i + 1); k++) mass += profile[at(line, k)];
      for (let k = start; k < i; k++) out[at(line, k)] = mass;
    }
  }
  return out;
}

// Per-pixel local thickness values (thinner of the two crossings) for every ink pixel in the box.
export function localThickness(image, box, darkBackground) {
  const {profile, w, h} = inkProfile(image, box, darkBackground);
  const horizontal = crossingMass(profile, w, h, true, new Float32Array(w * h));
  const vertical = crossingMass(profile, w, h, false, new Float32Array(w * h));
  const values = [];
  for (let i = 0; i < profile.length; i++) if (profile[i] > .5) values.push(Math.min(horizontal[i], vertical[i]));
  return values;
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const validBox = (box, image) => box && ['x0', 'y0', 'x1', 'y1'].every(key => Number.isInteger(box[key])) &&
  box.x0 >= 0 && box.y0 >= 0 && box.x1 <= image.width && box.y1 <= image.height && box.x1 > box.x0 && box.y1 > box.y0;

// Reference glyphs: the first symbol of each capitalised statement word located below the heading.
export function referenceCapitals(blocks, heading, image) {
  const words = (blocks || []).flatMap(block => (block?.paragraphs || [])
    .flatMap(paragraph => (paragraph?.lines || []).flatMap(line => line?.words || [])));
  const capitals = [];
  for (const word of words) {
    const key = String(word?.text || '').replace(/[^A-Za-z]/g, '').toLowerCase();
    if (!REFERENCE_WORDS.has(key) || !(word.confidence >= 80) || !validBox(word.bbox, image) || word.bbox.y0 < heading.y1) continue;
    const symbol = word.symbols?.[0];
    if (!symbol || !/^[A-Z]$/.test(symbol.text) || !(symbol.confidence >= 80) || !validBox(symbol.bbox, image)) continue;
    const b = symbol.bbox;
    if (b.x0 < word.bbox.x0 || b.x1 > word.bbox.x1 || b.y0 < word.bbox.y0 || b.y1 > word.bbox.y1) continue;
    capitals.push({text: symbol.text, box: b});
  }
  return capitals;
}

// Ratio of normalized heading thickness to normalized reference-capital thickness.
export function weightContrast(blocks, heading, image) {
  const unresolved = reason => ({supportsBold: false, ratio: null, reason});
  if (!heading || !validBox(heading, image)) return unresolved('missing-heading');
  const headingCap = heading.y1 - heading.y0;
  if (headingCap < MIN_CAP_HEIGHT) return unresolved('heading-too-small');
  const capitals = referenceCapitals(blocks, heading, image).filter(c => c.box.y1 - c.box.y0 >= MIN_CAP_HEIGHT);
  if (capitals.length < MIN_REFERENCE_CAPITALS) return unresolved('reference-not-located');
  // One polarity decision per statement, taken from the heading's surroundings and applied to
  // the reference capitals too, so heading and reference are always measured on the same scale.
  const darkBackground = backgroundLuminance(image, heading) < INK;
  const headingValues = localThickness(image, heading, darkBackground);
  const referenceValues = capitals.flatMap(c => localThickness(image, c.box, darkBackground));
  if (headingValues.length < MIN_INK_PIXELS || referenceValues.length < MIN_INK_PIXELS) return unresolved('insufficient-ink');
  const referenceCap = median(capitals.map(c => c.box.y1 - c.box.y0));
  const headingThickness = median(headingValues), referenceThickness = median(referenceValues);
  const ratio = (headingThickness / headingCap) / (referenceThickness / referenceCap);
  return {supportsBold: ratio >= CONTRAST_CUTOFF, ratio, headingThickness, referenceThickness, headingCap, referenceCap,
          capitals: capitals.map(c => c.text).join(''), polarity: darkBackground ? 'light-on-dark' : 'dark-on-light',
          reason: ratio >= CONTRAST_CUTOFF ? 'contrast' : 'not-distinguishable'};
}
