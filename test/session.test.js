import test from 'node:test';
import assert from 'node:assert/strict';
import { decisionCount, resetMessage } from '../src/session.js';
test('protects approved, sent back and parked decisions, but not merely seen rows',()=>{
 const rows=[{human:{status:'Approved'}},{human:{status:'Sent back'}},{human:{status:'Later'}},{human:{status:'Seen'}},{}];
 assert.equal(decisionCount(rows),3);
 assert.equal(resetMessage(3),'Start a new batch? This clears 3 decisions and the current results.');
 assert.equal(resetMessage(1),'Start a new batch? This clears 1 decision and the current results.');
});
