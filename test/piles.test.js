import test from 'node:test';
import assert from 'node:assert/strict';
import { machinePile, transition, pileOf, tallies } from '../src/piles.js';
const row = (statuses = [], confidence = 90) => ({ findings: statuses.map(status => ({status})), confidence });
test('first matching rule wins', () => {
  assert.equal(machinePile({...row(['mismatch']), error:'broken'}), 'review');
  assert.equal(machinePile(row(['review','mismatch'], 20)), 'failed');
  assert.equal(machinePile(row(['review'])), 'review');
  assert.equal(machinePile(row(['match'], 69.99)), 'review');
  assert.equal(machinePile(row(['match','skip'], 70)), 'passed');
});
test('opening marks New Seen, preserves Later and decisions', () => {
  const original = row(['review']);
  assert.equal(transition(original, 'seen').human.status, 'Seen');
  const later = transition(original, 'later');
  assert.equal(transition(later, 'seen').human.status, 'Later');
  assert.equal(pileOf(later), 'review');
  const approved = transition(original, 'approve', {note:'Checked'});
  assert.equal(pileOf(approved), 'passed');
  assert.equal(transition(approved, 'seen').human.status, 'Approved');
});
test('send back requires a reason and decisions can be revised', () => {
  assert.throws(() => transition(row(), 'send-back'), /reason/i);
  const sent = transition(row(), 'send-back', {reason:'Wrong value', note:'ABV'});
  assert.equal(pileOf(sent), 'failed');
  assert.equal(sent.human.reason, 'Wrong value');
  assert.equal(pileOf(transition(sent, 'later')), 'review');
  assert.throws(() => transition(sent, 'invalid'), /action/i);
});
test('tallies distinguish unresolved labels, machine sorting, and people', () => {
  const rows = [row(['match']), row(['mismatch']), row(['review']), transition(row(['review']), 'seen'), transition(row(), 'later'), transition(row(['review']), 'approve'), transition(row(), 'send-back', {reason:'Wrong value'})];
  assert.deepEqual(tallies(rows), {passed:2, failed:2, review:3, machine:2, human:2});
  assert.deepEqual(tallies([]), {passed:0, failed:0, review:0, machine:0, human:0});
});
test('all transitions preserve frozen findings and original records', () => {
  const findings = Object.freeze([Object.freeze({status:'review', found:'Original'})]);
  const original = Object.freeze({findings, confidence:80});
  for (const action of ['seen','approve','send-back','later']) {
    const next = transition(original, action, {reason:'Wrong value', note:'Note'});
    assert.equal(next.findings, findings);
    assert.equal(original.human, undefined);
    assert.deepEqual(findings, [{status:'review',found:'Original'}]);
  }
});
