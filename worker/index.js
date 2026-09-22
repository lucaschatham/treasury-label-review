import {inferAppearance,validateImage,MAX_BODY} from './vision.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env) {
  if (request.method!=='POST') return reply({error:'Use POST'},405);
  if (!env.PROXY_KEY || request.headers.get('Authorization')!==`Bearer ${env.PROXY_KEY}`) return reply({error:'Unauthorized'},401);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({error:'Use JSON'},415);
  const limit=await env.RATE_LIMITER.limit({key:request.headers.get('X-Client-IP') || 'unknown'});
  if(!limit.success) return reply({verdict:'UNCERTAIN',reason:'rate-limit'},429);
  let body='';
  try {
   const reader=request.body?.getReader();
   if(!reader)return reply({error:'Missing image'},400);
   const decoder=new TextDecoder();let size=0;
   while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();return reply({error:'Image too large'},413);}body+=decoder.decode(value,{stream:true});}
   const {image}=JSON.parse(body);
   if(!validateImage(image))return reply({error:'Use a PNG heading crop no larger than 1200 by 500 pixels'},400);
   return reply(await inferAppearance(env.AI,image));
  } catch {return reply({verdict:'UNCERTAIN',reason:'invalid-request'},400);}
 }
};
