import test from 'node:test';
import assert from 'node:assert/strict';
import { headingBox } from '../src/appearance.js';
const word = (text, x0, x1) => ({text, confidence:96, bbox:{x0,y0:20,x1,y1:40}});
const blocks = words => [{paragraphs:[{lines:[{words}]}]}];
test('isolates the heading words without including the warning body', () => {
 assert.deepEqual(headingBox(blocks([word('GOVERNMENT',10,100),word('WARNING:',110,190),word('(1)',200,230)]),300,200),{x0:10,y0:20,x1:190,y1:40});
});
test('missing, duplicate, low-confidence or out-of-bounds headings remain uncertain', () => {
 const valid=blocks([word('GOVERNMENT',10,100),word('WARNING:',110,190)]);
 for(const input of [null,[],[...valid,...valid],blocks([word('Government',10,100),word('Warning:',110,190)]),blocks([{...word('GOVERNMENT',10,100),confidence:40},word('WARNING:',110,190)]),blocks([word('GOVERNMENT',-10,100),word('WARNING:',110,190)])]) assert.equal(headingBox(input,300,200),null);
});
import { strokeEvidence } from '../src/appearance.js';
test('stroke corroboration measures stem thickness and rejects ambiguous glyph geometry', () => {
 const input=blocks([word('GOVERNMENT',10,100),{...word('WARNING:',110,190),symbols:[{text:'I',bbox:{x0:120,y0:20,x1:125,y1:40}}]}]);
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 for(let y=20;y<40;y++) for(let x=121;x<125;x++) for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 assert.equal(strokeEvidence(null,{data:pixels,width:300,height:200}).supportsBold,false);
});
import { appearanceFinding } from '../src/appearance.js';
test('provider failures are reported as service failures, never font judgments', () => {
 const failed=appearanceFinding({verdict:'UNCERTAIN',reason:'provider'},true);
 assert.equal(failed.status,'review');
 assert.equal(failed.found,'Automated appearance unavailable');
 assert.match(failed.detail,/quota|capacity/);
 assert.equal(appearanceFinding({verdict:'BOLD',reason:'corroborated'},true).status,'match');
 assert.equal(appearanceFinding({verdict:'BOLD',reason:'corroborated'},false).status,'review');
 assert.equal(appearanceFinding({verdict:'BOLD',reason:'invalid'},true).status,'review');
});
