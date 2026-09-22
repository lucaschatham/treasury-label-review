export const REQUIRED_WARNING = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';

const normalize = value => String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const compact = value => String(value || '').replace(/\s+/g, ' ').trim();

function entry(field, status, found, detail) { return { field, status, found, detail }; }

export function reviewLabel(rawText, application) {
  const text = compact(rawText);
  const comparable = normalize(text);
  const results = [];

  for (const [field, key] of [['Brand name', 'brand'], ['Class / type', 'type']]) {
    const expected = normalize(application[key]);
    const found = expected && comparable.includes(expected);
    results.push(entry(field, found ? 'match' : 'review', found ? application[key] : 'Not confidently located', found ? 'Matches application after case and punctuation normalization.' : 'Inspect the artwork and OCR text before deciding.'));
  }

  const expectedAbv = Number(String(application.abv).replace('%', ''));
  const abvMatches = [...text.matchAll(/\b(\d{1,2}(?:\.\d+)?)\s*%\s*(?:alc\.?\s*\/?\s*vol\.?|abv)?/gi)].map(match => Number(match[1]));
  const abvStatus = !abvMatches.length ? 'review' : abvMatches.some(value => Math.abs(value - expectedAbv) < 0.01) ? 'match' : 'mismatch';
  results.push(entry('Alcohol content', abvStatus, abvMatches.length ? abvMatches.map(v => `${v}%`).join(', ') : 'Not found', abvStatus === 'mismatch' ? `Application says ${expectedAbv}%.` : abvStatus === 'review' ? 'Confirm ABV visually.' : 'Numeric ABV matches.'));

  const expectedVolume = normalize(application.volume);
  const volumeFound = expectedVolume && comparable.includes(expectedVolume);
  results.push(entry('Net contents', volumeFound ? 'match' : 'review', volumeFound ? application.volume : 'Not confidently located', volumeFound ? 'Matches application.' : 'Confirm units and quantity visually.'));

  const warningFound = text.includes(REQUIRED_WARNING);
  results.push(entry('Government warning', warningFound ? 'match' : 'review', warningFound ? 'Exact text detected' : 'Exact text not detected', warningFound ? 'Check bold heading, size, contrast, and placement visually. OCR cannot verify typography.' : 'Compare the full wording and uppercase heading visually. OCR errors can obscure a correct warning.'));

  return results;
}
