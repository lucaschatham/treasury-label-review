import test from 'node:test';
import assert from 'node:assert/strict';
import {timeStage,finishTiming} from '../src/timing.js';
test('stage measurements include failures and preserve values/errors',async()=>{
 const timings={};let now=0;const clock=()=>now;
 assert.equal(await timeStage(timings,'ocr',async()=>{now=12;return 'text';},clock),'text');
 assert.equal(timings.ocr,12);
 const error=new Error('decode');
 await assert.rejects(timeStage(timings,'prepare',async()=>{now=19;throw error;},clock),e=>e===error);
 assert.equal(timings.prepare,7);
});

test('final timing separates per-label processing from click-to-result and queue time',()=>{
 const first=finishTiming({setup:100},1000,1100,1400);
 assert.equal(first.total,300);assert.equal(first.clickToResult,400);assert.equal(first.queue,0);
 const later=finishTiming({setup:100},1000,1400,1650);
 assert.equal(later.total,250);assert.equal(later.clickToResult,650);assert.equal(later.queue,300);
});
