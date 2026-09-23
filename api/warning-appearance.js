import {validateImage,MAX_BODY} from '../worker/vision.js';
export default async function handler(req,res) {
 let workerStarted;
 const send=(status,body)=>{if(workerStarted!==undefined)res.setHeader('Server-Timing',`worker;dur=${(performance.now()-workerStarted).toFixed(1)}`);res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
 if(req.method!=='POST')return send(405,{error:'Use POST'});
 if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Use JSON'});
 if(!process.env.WARNING_WORKER_URL || !process.env.WARNING_WORKER_KEY)return send(503,{verdict:'UNCERTAIN',reason:'not-configured'});
 try {
  let body=req.body;
  if(body===undefined){let text='';let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)return send(413,{error:'Image too large'});text+=chunk;}body=JSON.parse(text);}
  if(typeof body==='string')body=JSON.parse(body);
  if(!validateImage(body?.image))return send(400,{error:'Invalid heading crop'});
  workerStarted=performance.now();
  const response=await fetch(process.env.WARNING_WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.WARNING_WORKER_KEY}`,'X-Client-IP':String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0]},body:JSON.stringify({image:body.image}),signal:AbortSignal.timeout(4500)});
  if(!response.ok)return send(response.status===429?429:503,{verdict:'UNCERTAIN',reason:response.status===429?'rate-limit':[400,405,413,415].includes(response.status)?'invalid-request':response.status>=400 && response.status<500?'service':'provider'});
  const result=await response.json().catch(error=>{if(error instanceof SyntaxError)return null;throw error;});
  if(!['BOLD','UNCERTAIN'].includes(result?.verdict))return send(502,{verdict:'UNCERTAIN',reason:'invalid-response'});
  return send(200,{verdict:result.verdict,reason:['corroborated','provider','timeout','disagreement','weight-not-confirmed','uncertain'].includes(result.reason)?result.reason:'uncertain'});
 }catch(error){
  return send(workerStarted===undefined?400:503,{verdict:'UNCERTAIN',reason:workerStarted===undefined?'invalid-request':error.name==='TimeoutError'?'timeout':'provider'});
 }
}
