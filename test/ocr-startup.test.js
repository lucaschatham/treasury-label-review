import test from 'node:test';
import assert from 'node:assert/strict';
import {createOcrLoader} from '../src/ocr-startup.js';

test('a language-load callback failure rejects startup and does not spawn retry workers',async()=>{
  let calls=0;
  const load=createOcrLoader((_language,_mode,options)=>{
    calls++;queueMicrotask(()=>options.errorHandler('language HTTP 503'));
    return new Promise(()=>{});
  },{}, {timeoutMs:1000});
  await assert.rejects(load(),/Reload.*try again/);
  await assert.rejects(load(),/Reload.*try again/);
  assert.equal(calls,1);
});

test('successful startup configures sparse text once and reuses the worker',async()=>{
  let calls=0;const parameters=[];
  const worker={setParameters:async p=>parameters.push(p),terminate:async()=>{}};
  const load=createOcrLoader(async()=>{calls++;return worker;});
  assert.equal(await load(),worker);assert.equal(await load(),worker);
  assert.equal(calls,1);assert.deepEqual(parameters,[{tessedit_pageseg_mode:'11'}]);
});

test('timed-out startup rejects and terminates a worker that arrives late',async()=>{
  let resolveWorker,terminated=0,configured=0;
  const load=createOcrLoader(()=>new Promise(resolve=>{resolveWorker=resolve;}),{}, {timeoutMs:10});
  await assert.rejects(load(),/timed out/);
  resolveWorker({setParameters:async()=>{configured++;},terminate:async()=>{terminated++;}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(terminated,1);assert.equal(configured,0);
});

test('configuration failures release a worker and report an actionable error',async()=>{
  let terminated=0;
  const load=createOcrLoader(async()=>({setParameters:async()=>{throw new Error('broken core');},terminate:async()=>{terminated++;}}));
  await assert.rejects(load(),/Reload.*try again/);assert.equal(terminated,1);
});
