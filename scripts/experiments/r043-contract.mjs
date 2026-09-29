// Explicit diagnostic contract, outside automatic app test discovery. Baseline failures are expected.
// Run: node --test scripts/experiments/r043-contract.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceCapitals} from '../../src/weight.js';
const image={width:1600,height:900};
const heading={x0:20,y0:20,x1:400,y1:44};
const word=(text,x,y)=>({text,confidence:96,bbox:{x0:x,y0:y,x1:x+90,y1:y+24},symbols:[{text:text[0],confidence:96,bbox:{x0:x,y0:y,x1:x+15,y1:y+24}}]});
const blocks=words=>[{paragraphs:[{lines:[{words}]}]}];
test('R043 desired behavior: inline A/S/G remain eligible references',()=>{
  const refs=referenceCapitals(blocks([word('According',450,20),word('Surgeon',560,20),word('General',670,20)]),heading,image);
  assert.deepEqual(refs.map(x=>x.text),['A','S','G']);
});
test('R043 desired behavior: distant unrelated reference words cannot supply a warning reference',()=>{
  const refs=referenceCapitals(blocks([word('According',1000,700),word('Surgeon',1110,700),word('General',1220,700)]),heading,image);
  assert.equal(refs.length,0);
});
