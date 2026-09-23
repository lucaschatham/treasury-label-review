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

test('visible return time distinguishes waiting, running, completed, and stopped batches', async()=>{
 const {returnTimeText}=await import('../src/timing.js');
 assert.equal(returnTimeText({}), 'Return time: —');
 assert.equal(returnTimeText({running:true,elapsed:1.26}), 'Checking labels · 1.3 seconds elapsed');
 assert.equal(returnTimeText({seconds:4.82}), 'Results returned in 4.8 seconds');
 assert.equal(returnTimeText({seconds:12.34,first:2.15,total:3}), 'Batch results returned in 12.3 seconds · First result in 2.1 seconds');
 assert.equal(returnTimeText({seconds:3.2,stopped:true}), 'Stopped after 3.2 seconds');
});
