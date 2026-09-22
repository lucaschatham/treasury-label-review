import test from 'node:test';
import assert from 'node:assert/strict';
import { inferAppearance, parseAnswer, validateImage } from '../worker/vision.js';
test('only exact allowed model outputs are accepted',()=>{
 for(const content of ['BOLD.','Probably BOLD','<think>BOLD</think>','',null]) assert.equal(parseAnswer({choices:[{message:{content}}]}),'UNCERTAIN');
 assert.equal(parseAnswer({choices:[{message:{content:' BOLD\n'}}]}),'BOLD');
});
test('both models must agree before appearance is corroborated',async()=>{
 const run=async answer=>({choices:[{message:{content:answer}}]});
 for (const answers of [['BOLD','BOLD'],['BOLD','REGULAR'],['BOLD','UNCERTAIN']]) {
  let i=0;const result=await inferAppearance({run:()=>run(answers[i++])},'data:image/png;base64,unused');
  assert.equal(result.verdict,answers.every(x=>x==='BOLD')?'BOLD':'UNCERTAIN');
 }
});
test('provider failures and a bounded timeout cannot produce a bold pass',async()=>{
 assert.equal((await inferAppearance({run:async()=>{throw Error('quota');}},'unused')).verdict,'UNCERTAIN');
 assert.equal((await inferAppearance({run:()=>new Promise(()=>{})},'unused',10)).reason,'timeout');
});
test('rejects unsupported, malformed and oversized payloads',()=>{
 for(const value of [null,'https://example.com/image.png','data:image/jpeg;base64,AAAA','data:image/png;base64,not base64','data:image/png;base64,'+'A'.repeat(1400000)]) assert.equal(validateImage(value),false);
});
