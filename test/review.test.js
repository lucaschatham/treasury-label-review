import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewLabel, REQUIRED_WARNING } from '../src/review.js';

const application = { brand: "Stone's Throw", type: 'Kentucky Straight Bourbon Whiskey', abv: '45', volume: '750 mL' };

test('matches a label with case and punctuation differences in the brand', () => {
  const text = `STONES THROW\nKentucky Straight Bourbon Whiskey\n45% ALC./VOL. (90 PROOF)\n750 mL\n${REQUIRED_WARNING}`;
  const result = reviewLabel(text, application);
  assert.equal(result.find(x => x.field === 'Brand name').status, 'match');
  assert.equal(result.find(x => x.field === 'Alcohol content').status, 'match');
  assert.equal(result.find(x => x.field === 'Government warning').status, 'match');
});

test('flags a wrong ABV and a missing warning', () => {
  const result = reviewLabel('STONES THROW\n40% Alc./Vol.\n750 mL', application);
  assert.equal(result.find(x => x.field === 'Alcohol content').status, 'mismatch');
  assert.equal(result.find(x => x.field === 'Government warning').status, 'review');
});

test('warning requires exact words and uppercase heading', () => {
  const text = REQUIRED_WARNING.replace('GOVERNMENT WARNING:', 'Government Warning:');
  assert.equal(reviewLabel(text, application).find(x => x.field === 'Government warning').status, 'review');
  assert.equal(reviewLabel(REQUIRED_WARNING.toUpperCase(), application).find(x => x.field === 'Government warning').status, 'match');
});
