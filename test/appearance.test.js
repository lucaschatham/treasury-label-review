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

test('raster fallback locates the fifth of eight separated WARNING glyphs', () => {
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1,y0=20,y1=40)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 for(let i=0;i<8;i++)ink(110+i*10,110+i*10+(i===4?4:7),i===7?25:20);
 const input=blocks([word('GOVERNMENT',10,100),word('WARNING:',110,190)]);
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 input[0].paragraphs[0].lines[0].words[1].symbols=[{text:'I',bbox:{x0:135,y0:20,x1:170,y1:40}}];
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 ink(117,121); // Merge W and A: ordinal segmentation is no longer safe.
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,false);
});

import {reviewAppearance} from '../src/appearance.js';
test('local guard vetoes requests and a per-run cache stores only corroborated success', async () => {
 const savedFetch=globalThis.fetch,savedDocument=globalThis.document;
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const canvas={width:300,height:200,getContext:()=>({getImageData:()=>({width:300,height:200,data:pixels})})};
 const input=blocks([word('GOVERNMENT',10,100),{...word('WARNING:',110,190),symbols:[{text:'I',bbox:{x0:120,y0:20,x1:125,y1:40}}]}]);
 let calls=0;
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/png;base64,same'})};
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({verdict:'BOLD',reason:'corroborated'})};};
 const cache=new Map();
 try {
  assert.equal((await reviewAppearance(canvas,input,cache)).reason,'stroke-evidence');
  assert.equal(calls,0);
  for(let y=20;y<40;y++)for(let x=121;x<125;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;
  assert.equal((await reviewAppearance(canvas,input,cache)).status,'match');
  assert.equal((await reviewAppearance(canvas,input,cache)).status,'match');
  assert.equal(calls,1);
  pixels.fill(255);
  assert.equal((await reviewAppearance(canvas,input,cache)).status,'review');
  assert.equal(calls,1);
 } finally {globalThis.fetch=savedFetch;globalThis.document=savedDocument;}
});
test('failed and malformed cloud responses never populate the cache',async()=>{
 const savedFetch=globalThis.fetch,savedDocument=globalThis.document;
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 for(let y=20;y<40;y++)for(let x=121;x<125;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;
 const canvas={width:300,height:200,getContext:()=>({getImageData:()=>({width:300,height:200,data:pixels})})};
 const input=blocks([word('GOVERNMENT',10,100),{...word('WARNING:',110,190),symbols:[{text:'I',bbox:{x0:120,y0:20,x1:125,y1:40}}]}]);
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/png;base64,same'})};
 const cache=new Map();
 try {
  for(const result of [{verdict:'BOLD',reason:'invalid'},{verdict:'UNCERTAIN',reason:'provider'},{verdict:'UNCERTAIN',reason:'timeout'},null]){
   globalThis.fetch=async()=>({ok:true,json:async()=>result});
   assert.equal((await reviewAppearance(canvas,input,cache)).status,'review');
   assert.equal(cache.size,0);
  }
  globalThis.fetch=async()=>{throw new DOMException('deadline','TimeoutError');};
  assert.equal((await reviewAppearance(canvas,input,cache)).reason,'timeout');
  assert.equal(cache.size,0);
 } finally {globalThis.fetch=savedFetch;globalThis.document=savedDocument;}
});
