import test from 'node:test';
import assert from 'node:assert/strict';
import { headingBox, appearanceFinding, reviewAppearance } from '../src/appearance.js';
import { CONTRAST_CUTOFF } from '../src/weight.js';
const word = (text, x0, x1, y0 = 20, y1 = 40) => ({text, confidence:96, bbox:{x0,y0,x1,y1}});
const blocks = words => [{paragraphs:[{lines:[{words}]}]}];

test('isolates the heading words without including the warning body', () => {
 assert.deepEqual(headingBox(blocks([word('GOVERNMENT',10,100),word('WARNING:',110,190),word('(1)',200,230)]),300,200),{x0:10,y0:20,x1:190,y1:40});
});
test('missing, duplicate, low-confidence or out-of-bounds headings remain uncertain', () => {
 const valid=blocks([word('GOVERNMENT',10,100),word('WARNING:',110,190)]);
 for(const input of [null,[],[...valid,...valid],blocks([word('Government',10,100),word('Warning:',110,190)]),blocks([{...word('GOVERNMENT',10,100),confidence:40},word('WARNING:',110,190)]),blocks([word('GOVERNMENT',-10,100),word('WARNING:',110,190)])]) assert.equal(headingBox(input,300,200),null);
});
test('a separate, nearby colon expands the heading crop without borrowing body text',()=>{
 const a=word('GOVERNMENT',10,100),b=word('WARNING',110,185),colon={...word(':',189,192),confidence:72,bbox:{x0:189,y0:29,x1:192,y1:40}};
 assert.deepEqual(headingBox(blocks([a,b,colon]),300,200),{x0:10,y0:20,x1:192,y1:40});
 for(const bad of [null,{...colon,confidence:40},{...colon,bbox:{x0:230,y0:29,x1:233,y1:40}},{...colon,bbox:{x0:189,y0:100,x1:192,y1:110}}])assert.deepEqual(headingBox(blocks([a,b,...(bad?[bad]:[])]),300,200),{x0:10,y0:20,x1:185,y1:40});
 assert.equal(headingBox(blocks([a,word('Warning',110,185),colon]),300,200),null);
});
test('unrecognized or absent punctuation does not hide a confidently read uppercase heading',()=>{
 const a=word('GOVERNMENT',10,100),b=word('WARNING',110,177);
 for(const trailing of [[],[{...word('H',189,192),confidence:61}],[{...word('.',189,192),confidence:0}]]) assert.deepEqual(headingBox(blocks([a,b,...trailing]),300,200),{x0:10,y0:20,x1:177,y1:40});
});

test('only a measured contrast above the frozen cutoff is a match; every abstention names its reason', () => {
 const match=appearanceFinding({reason:'contrast',ratio:1.42});
 assert.equal(match.status,'match'); assert.match(match.detail,/1\.42/); assert.match(match.detail,/not physical print size/);
 const weak=appearanceFinding({reason:'not-distinguishable',ratio:1.03});
 assert.equal(weak.status,'review'); assert.match(weak.detail,/whole statement may be bold/); assert.equal(weak.ratio,1.03);
 for(const reason of ['missing-heading','heading-too-small','reference-not-located','insufficient-ink',undefined]) {
  const finding=appearanceFinding({reason});
  assert.equal(finding.status,'review'); assert.equal(finding.field,'Warning appearance'); assert.equal(finding.reason,reason||'uncertain');
 }
 assert.match(appearanceFinding({reason:'reference-not-located'}).detail,/According, Surgeon, General, Consumption/);
});

// A synthetic statement: heading stems of one width above three capitalised body words.
function statement(headingStem, bodyStem) {
 const width=600,height=200,pixels=new Uint8ClampedArray(width*height*4).fill(255);
 const ink=(x0,x1,y0,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let c=0;c<3;c++)pixels[(y*width+x)*4+c]=0;};
 for(let i=0;i<4;i++)ink(20+i*60,20+i*60+headingStem,10,34);
 const words=[word('GOVERNMENT',10,150,10,34),word('WARNING:',160,300,10,34)];
 for(const [i,text] of ['According','Surgeon','Consumption'].entries()){const x=20+i*100;ink(x,x+bodyStem,100,124);words.push({...word(text,x,x+80,100,124),symbols:[{text:text[0],confidence:96,bbox:{x0:x,y0:100,x1:x+bodyStem+4,y1:124}}]});}
 const canvas={width,height,getContext:()=>({getImageData:()=>({width,height,data:pixels})})};
 return {canvas,blocks:blocks(words)};
}
test('review runs locally, keeps an evidence crop, and never contacts a network service', async () => {
 const savedFetch=globalThis.fetch,savedDocument=globalThis.document;
 let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('no network expected');};
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>'data:image/png;base64,crop'})};
 try {
  const bold=statement(6,4);
  const finding=await reviewAppearance(bold.canvas,bold.blocks);
  assert.equal(finding.status,'match'); assert.ok(finding.ratio>CONTRAST_CUTOFF); assert.equal(finding.crop,'data:image/png;base64,crop');
  const regular=statement(4,4);
  const weak=await reviewAppearance(regular.canvas,regular.blocks);
  assert.equal(weak.status,'review'); assert.equal(weak.reason,'not-distinguishable');
  const missing=await reviewAppearance(bold.canvas,blocks([word('Government',10,150,10,34)]));
  assert.equal(missing.reason,'missing-heading'); assert.equal(missing.crop,undefined);
  assert.equal(calls,0);
 } finally {globalThis.fetch=savedFetch;globalThis.document=savedDocument;}
});
