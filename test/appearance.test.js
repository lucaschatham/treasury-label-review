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
  globalThis.fetch=async()=>({ok:false,status:503,json:async()=>({verdict:'UNCERTAIN',reason:'timeout'})});
  assert.equal((await reviewAppearance(canvas,input,cache)).reason,'timeout');
  for(const [status,reason] of [[503,'not-configured'],[400,'invalid-request'],[502,'invalid-response']]){
   globalThis.fetch=async()=>({ok:false,status,json:async()=>({verdict:'UNCERTAIN',reason})});
   assert.equal((await reviewAppearance(canvas,input,cache)).reason,reason);
  }
  for(const status of [401,403,404]){
   globalThis.fetch=async()=>({ok:false,status,json:async()=>({})});
   assert.equal((await reviewAppearance(canvas,input,cache)).reason,'service');
  }
  globalThis.fetch=async()=>{throw new DOMException('deadline','TimeoutError');};
  assert.equal((await reviewAppearance(canvas,input,cache)).reason,'timeout');
  assert.equal(cache.size,0);
 } finally {globalThis.fetch=savedFetch;globalThis.document=savedDocument;}
});
test('a separate, nearby colon expands the heading crop without borrowing body text',()=>{
 const a=word('GOVERNMENT',10,100),b=word('WARNING',110,185),colon={...word(':',189,192),confidence:72,bbox:{x0:189,y0:29,x1:192,y1:40}};
 assert.deepEqual(headingBox(blocks([a,b,colon]),300,200),{x0:10,y0:20,x1:192,y1:40});
 for(const bad of [null,{...colon,confidence:40},{...colon,bbox:{x0:230,y0:29,x1:233,y1:40}},{...colon,bbox:{x0:189,y0:100,x1:192,y1:110}}])assert.deepEqual(headingBox(blocks([a,b,...(bad?[bad]:[])]),300,200),{x0:10,y0:20,x1:185,y1:40});
 assert.equal(headingBox(blocks([a,word('Warning',110,185),colon]),300,200),null);
});
test('separate-colon headings can use the same local stroke check',()=>{
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1,y0=20,y1=40)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 for(let i=0;i<7;i++)ink(110+i*10,110+i*10+(i===4?4:7));ink(189,192,29,40);
 const input=blocks([word('GOVERNMENT',10,100),word('WARNING',110,177),{...word(':',189,192),confidence:72,bbox:{x0:189,y0:29,x1:192,y1:40}}]);
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
});
test('unrecognized or absent punctuation does not hide a confidently read uppercase heading',()=>{
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1)=>{for(let y=20;y<40;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 for(let i=0;i<7;i++)ink(110+i*10,110+i*10+(i===4?4:7));
 const a=word('GOVERNMENT',10,100),b=word('WARNING',110,177);
 for(const trailing of [[],[{...word('H',189,192),confidence:61}], [{...word('.',189,192),confidence:0}]]) {
  const input=blocks([a,b,...trailing]);
  assert.deepEqual(headingBox(input,300,200),{x0:10,y0:20,x1:177,y1:40});
  assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 }
});
test('a tightly bounded OCR I can recover a kerned serif stem without accepting regular weight',()=>{
 const input=blocks([word('GOVERNMENT',10,100),{...word('WARNING:',110,190),symbols:[{text:'I',bbox:{x0:140,y0:20,x1:157,y1:40}}]}]);
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1)=>{for(let y=20;y<40;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 for(let i=0;i<7;i++)ink(110+i*10,110+i*10+(i===4?4:7));
 ink(117,121); // Connected W and A make ordinal segmentation unusable.
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 for(let y=20;y<40;y++)for(let x=153;x<154;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=255;
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,false);
});

test('word-wide stroke evidence rescues a narrow bold heading without approving its regular pair',()=>{
 const warning=word('WARNING:',110,190);
 const input=blocks([word('GOVERNMENT',10,100),warning]);
 const render=(strokeWidth,iWidth=3)=>{
  const pixels=new Uint8ClampedArray(300*200*4).fill(255);
  const ink=(x0,x1,y0=20,y1=40)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
  for(let i=0;i<7;i++)ink(110+i*10,110+i*10+(i===4?iWidth:strokeWidth));
  ink(185,188,30,40);
  return {width:300,height:200,data:pixels};
 };
 const bold=strokeEvidence(input,render(7));
 assert.equal(bold.supportsBold,true);
 assert.equal(bold.method,'word-strokes');
 const regular=strokeEvidence(input,render(3));
 assert.equal(regular.supportsBold,false);
 const mixed=strokeEvidence(input,render(7,2));
 assert.equal(mixed.supportsBold,false);
});

test('neighbor-bounded recovery isolates I despite touching serifs and an oversized OCR box',()=>{
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1,y0=20,y1=40)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 const symbols=[...'WARNING:'].map((text,i)=>({text,confidence:99,bbox:{x0:110+i*10,y0:20,x1:117+i*10,y1:40}}));
 symbols[4].bbox={x0:130,y0:20,x1:180,y1:40};
 for(let i=0;i<7;i++)ink(110+i*10,110+i*10+(i===4?4:7));
 ink(117,141,20,21); // Touching top serifs defeat connected components.
 const warning={...word('WARNING:',110,190),symbols};
 const input=blocks([word('GOVERNMENT',10,100),warning]);
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
 const oversized=symbols[4].bbox;
 for(const invalid of [{x0:0,y0:20,x1:50,y1:40},{x0:153,y0:20,x1:180,y1:40},{x0:130,y0:20,x1:180,y1:400}]){
  symbols[4].bbox=invalid;
  assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,false);
 }
 symbols[4].bbox=oversized;
 symbols[3].confidence=50;
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,false);
 symbols[3].confidence=99;
 for(let y=20;y<40;y++)for(let x=152;x<154;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=255;
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,false);
});

test('neighbor recovery cannot replace an already usable OCR I box',()=>{
 const pixels=new Uint8ClampedArray(300*200*4).fill(255);
 const ink=(x0,x1)=>{for(let y=20;y<40;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*300+x)*4+c]=0;};
 ink(151,152);ink(175,179);
 const symbols=[...'WARNING:'].map((text,i)=>({text,confidence:99,bbox:{x0:110+i*10,y0:20,x1:117+i*10,y1:40}}));
 symbols[4].bbox={x0:175,y0:20,x1:179,y1:40};
 const input=blocks([word('GOVERNMENT',10,100),{...word('WARNING:',110,190),symbols}]);
 assert.equal(strokeEvidence(input,{data:pixels,width:300,height:200}).supportsBold,true);
});
