import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewSummary } from '../src/summary.js';

test('manual confirmation never clears an unresolved automated finding', () => {
  const findings = [{status:'match'}, {status:'review', humanConfirmed:true}];
  assert.deepEqual(reviewSummary(findings), {pending:1, complete:false});
});
test('mismatches remain attention items and inapplicable checks do not', () => {
  assert.deepEqual(reviewSummary([{status:'mismatch'}, {status:'skip'}]), {pending:1, complete:false});
  assert.deepEqual(reviewSummary([{status:'match'}, {status:'skip'}]), {pending:0, complete:true});
});
