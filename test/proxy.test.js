import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/warning-appearance.js';
const bytes=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.write('IHDR',12);bytes.writeUInt32BE(100,16);bytes.writeUInt32BE(40,20);
const image='data:image/png;base64,'+bytes.toString('base64');
test('proxy preserves disagreement and deadline attribution without exposing secrets',async()=>{
 const oldFetch=globalThis.fetch,oldUrl=process.env.WARNING_WORKER_URL,oldKey=process.env.WARNING_WORKER_KEY;
 process.env.WARNING_WORKER_URL='https://worker.example';process.env.WARNING_WORKER_KEY='test-secret';
 const call=async()=>{let value;const headers={};const res={setHeader:(key,v)=>headers[key]=v,end:body=>value=JSON.parse(body)};await handler({method:'POST',headers:{'content-type':'application/json'},body:{image}},res);return {value,headers,status:res.statusCode};};
 try {
  globalThis.fetch=async()=>({ok:true,json:async()=>({verdict:'UNCERTAIN',reason:'disagreement'})});
  const disagreement=await call();assert.equal(disagreement.value.reason,'disagreement');
  assert.match(disagreement.headers['Server-Timing'],/worker;dur=/);
  assert.equal(JSON.stringify(disagreement).includes('test-secret'),false);
  for(const status of [401,403,404]){
   globalThis.fetch=async()=>({ok:false,status});
   assert.equal((await call()).value.reason,'service');
  }
  globalThis.fetch=async()=>{throw new DOMException('deadline','TimeoutError');};
  assert.equal((await call()).value.reason,'timeout');
 }finally{globalThis.fetch=oldFetch;for(const [key,value] of [['WARNING_WORKER_URL',oldUrl],['WARNING_WORKER_KEY',oldKey]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});

test('malformed worker bodies remain invalid-response and body time is included',async()=>{
 const oldFetch=globalThis.fetch,oldUrl=process.env.WARNING_WORKER_URL,oldKey=process.env.WARNING_WORKER_KEY;
 process.env.WARNING_WORKER_URL='https://worker.example';process.env.WARNING_WORKER_KEY='test-secret';
 const call=async()=>{let value;const headers={};const res={setHeader:(k,v)=>headers[k]=v,end:b=>value=JSON.parse(b)};await handler({method:'POST',headers:{'content-type':'application/json'},body:{image}},res);return {value,headers,status:res.statusCode};};
 try {
  for(const body of [null,{},'unexpected']){
   globalThis.fetch=async()=>({ok:true,json:async()=>body});
   const result=await call();assert.equal(result.status,502);assert.equal(result.value.reason,'invalid-response');
  }
  globalThis.fetch=async()=>({ok:true,json:async()=>{await new Promise(r=>setTimeout(r,25));throw new SyntaxError('bad JSON');}});
  const result=await call();assert.equal(result.value.reason,'invalid-response');
  assert.ok(Number(result.headers['Server-Timing'].split('=')[1])>=20);
 }finally{globalThis.fetch=oldFetch;for(const [key,value] of [['WARNING_WORKER_URL',oldUrl],['WARNING_WORKER_KEY',oldKey]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
