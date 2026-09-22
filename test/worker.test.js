import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {readFileSync} from 'node:fs';
const image='data:image/png;base64,'+readFileSync('public/samples/old-tom.png').toString('base64');
const env={PROXY_KEY:'test-only',RATE_LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>{throw Error('not expected');}}};
const request=(body,headers={})=>new Request('https://worker.example/',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-only',...headers},body});
test('worker rejects unauthenticated, oversized and non-crop requests before inference',async()=>{
 assert.equal((await worker.fetch(request('{}',{Authorization:'Bearer wrong'}),env)).status,401);
 assert.equal((await worker.fetch(request('A'.repeat(1400001)),env)).status,413);
 assert.equal((await worker.fetch(request(JSON.stringify({image})),env)).status,400);
 assert.equal((await worker.fetch(request('not json'),env)).status,400);
});
test('worker returns explicit 429 for rate limiting',async()=>{
 const response=await worker.fetch(request('{}'),{...env,RATE_LIMITER:{limit:async()=>({success:false})}});
 assert.equal(response.status,429);assert.equal((await response.json()).reason,'rate-limit');
});
