export const MODELS = ['@cf/qwen/qwen3.8-27b', '@cf/google/gemma-4-26b-a4b-it'];
export const PROMPT = 'Is the GOVERNMENT WARNING heading printed in bold or regular font weight? Do not confuse capital letters or larger size with bold strokes. Return only BOLD, REGULAR, or UNCERTAIN.';
export const MAX_BODY = 1400000;
export function validateImage(image) {
  if (typeof image !== 'string' || image.length > MAX_BODY-100 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) return false;
  try {
    const bytes = Uint8Array.from(atob(image.slice(22)), c=>c.charCodeAt(0));
    if (bytes.length < 33 || [137,80,78,71,13,10,26,10].some((n,i)=>bytes[i]!==n) || String.fromCharCode(...bytes.slice(12,16))!=='IHDR') return false;
    const view = new DataView(bytes.buffer), width=view.getUint32(16), height=view.getUint32(20);
    return width>0 && width<=1200 && height>0 && height<=500;
  } catch { return false; }
}
export function parseAnswer(result) {
  const value=result?.choices?.[0]?.message?.content;
  return typeof value==='string' && ['BOLD','REGULAR','UNCERTAIN'].includes(value.trim()) ? value.trim() : 'UNCERTAIN';
}
export async function inferAppearance(ai, image, deadline=4000) {
  let timer;
  const work=Promise.all(MODELS.map(async model=> {
    try {
      const result=await ai.run(model,{messages:[{role:'user',content:[{type:'text',text:PROMPT},{type:'image_url',image_url:{url:image}}]}],temperature:0,max_completion_tokens:32,chat_template_kwargs:{enable_thinking:false}}, {rejectIfBusy:true});
      return parseAnswer(result);
    } catch { return 'ERROR'; }
  })).then(answers=>({verdict:answers.every(a=>a==='BOLD')?'BOLD':'UNCERTAIN',reason:answers.includes('ERROR')?'provider':answers.includes('REGULAR')?'weight-not-confirmed':answers.every(a=>a==='BOLD')?'corroborated':'uncertain'}));
  try { return await Promise.race([work,new Promise(resolve=>{timer=setTimeout(()=>resolve({verdict:'UNCERTAIN',reason:'timeout'}),deadline);})]); }
  finally {clearTimeout(timer);}
}
