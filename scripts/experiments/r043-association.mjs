// Isolated R-043 candidate. Not imported by the application.
// Frozen geometry from Fable's proposal; split rows into runs BEFORE comparing spans,
// reject competing continuations, enforce bounds inside each append, and keep the
// existing measurement/constants. This is not production code or qualification.
import {MIN_CAP_HEIGHT, MIN_REFERENCE_CAPITALS, MIN_INK_PIXELS, CONTRAST_CUTOFF,
  localThickness, median, backgroundLuminance, INK} from '../../src/weight.js';
const ORDER=['according','surgeon','general','consumption'];
const key=w=>String(w?.text||'').replace(/[^A-Za-z]/g,'').toLowerCase();
const height=b=>b.y1-b.y0;
const union=(a,b)=>({x0:Math.min(a.x0,b.x0),y0:Math.min(a.y0,b.y0),x1:Math.max(a.x1,b.x1),y1:Math.max(a.y1,b.y1)});
const overlap=(a,b)=>Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>=.5*Math.min(height(a),height(b));
const horizontal=(a,b)=>Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>=.5*Math.min(a.x1-a.x0,b.x1-b.x0);
const valid=(b,image)=>b&&['x0','x1','y0','y1'].every(k=>Number.isInteger(b[k]))&&b.x0>=0&&b.y0>=0&&b.x1<=image.width&&b.y1<=image.height&&b.x1>b.x0&&b.y1>b.y0;
const inside=(b,w)=>b.x0>=w.x0&&b.x1<=w.x1&&b.y0>=w.y0&&b.y1<=w.y1;
const flatten=blocks=>(blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[])));

export function statementChain(words, heading, image) {
  const chain=[],used=new Set(),rows=[];
  if(!valid(heading,image))return {chain,rows,reason:'missing-heading'};
  const pool=words.filter(w=>valid(w.bbox,image));
  let previous={...heading};
  const append=row=>{
    for(const w of row){
      if(chain.length>=90)return false;
      chain.push(w);used.add(w);
    }
    rows.push(row);
    return true;
  };
  const inline=pool.filter(w=>overlap(w.bbox,heading)&&w.bbox.x0>=heading.x1-.1*height(heading)).sort((a,b)=>a.bbox.x0-b.bbox.x0);
  let edge=heading.x1;const first=[];
  for(const w of inline){
    if(w.bbox.x0-edge>1.5*height(heading))break;
    if(w.bbox.x0<edge-.1*height(heading))return {chain,rows,reason:'ambiguous-reference'};
    first.push(w);edge=w.bbox.x1;
  }
  if(first.length){
    if(!append(first))return {chain,rows,reason:'ambiguous-reference'};
    previous=first.reduce((b,w)=>union(b,w.bbox),previous);
  }
  for(let count=1;count<12;count++){
    const below=pool.filter(w=>!used.has(w)&&w.bbox.y0>=previous.y0+.5*height(previous)&&w.bbox.y0-previous.y1<=1.25*height(previous))
      .sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0);
    if(!below.length)return {chain,rows,reason:null};
    const top=below[0];
    const band=below.filter(w=>overlap(w.bbox,top.bbox)).sort((a,b)=>a.bbox.x0-b.bbox.x0);
    const runs=[];let current=[];
    for(const w of band){
      const last=current.at(-1);
      if(last&&w.bbox.x0-last.bbox.x1>1.5*height(top.bbox)){runs.push(current);current=[];}
      if(current.length&&w.bbox.x0<current.at(-1).bbox.x1-.1*height(top.bbox))return {chain,rows,reason:'ambiguous-reference'};
      current.push(w);
    }
    if(current.length)runs.push(current);
    const choices=runs.map(run=>({run,span:run.map(w=>w.bbox).reduce(union)})).filter(c=>horizontal(c.span,previous));
    if(choices.length>1)return {chain,rows,reason:'ambiguous-reference'};
    if(!choices.length)return {chain,rows,reason:null};
    if(!append(choices[0].run))return {chain,rows,reason:'ambiguous-reference'};
    previous=choices[0].span;
  }
  // Reaching the row bound is uncertainty, never silently truncate to convenient targets.
  return {chain,rows,reason:'ambiguous-reference'};
}

export function referenceSelection(blocks,heading,image){
  const result=statementChain(flatten(blocks),heading,image);
  if(result.reason)return {...result,capitals:[]};
  const capitals=[],targets=[];
  for(let i=0;i<result.chain.length;i++){
    const word=result.chain[i];let target=key(word),split=null;
    if(!ORDER.includes(target)){
      const next=result.chain[i+1];
      if(next&&/-$/.test(String(word.text).trim())&&ORDER.includes(target+key(next))){target+=key(next);split=next;i++;}
      else continue;
    }
    targets.push(target);
    // Ambiguity is checked on all observed target tokens, not only high-confidence survivors.
    const s=word.symbols?.[0];
    if(!(word.confidence>=80)||(split&&!(split.confidence>=80))||!s||!/^[A-Z]$/.test(s.text)||!(s.confidence>=80)||!valid(s.bbox,image)||!inside(s.bbox,word.bbox))continue;
    capitals.push({text:s.text,box:s.bbox,target,word:word.text,split:split?.text||null});
  }
  const sequence=targets.map(x=>ORDER.indexOf(x));
  if(new Set(sequence).size!==sequence.length||sequence.some((n,i)=>i>0&&n<sequence[i-1]))return {...result,capitals:[],reason:'ambiguous-reference'};
  return {...result,capitals,reason:null};
}

// Formula copied unchanged from weightContrast; only reference association is replaced.
export function candidateContrast(blocks,heading,image){
  const unresolved=reason=>({supportsBold:false,ratio:null,reason});
  if(!heading||!valid(heading,image))return unresolved('missing-heading');
  const headingCap=height(heading);
  if(headingCap<MIN_CAP_HEIGHT)return unresolved('heading-too-small');
  const selection=referenceSelection(blocks,heading,image);
  if(selection.reason)return unresolved(selection.reason);
  const capitals=selection.capitals.filter(c=>height(c.box)>=MIN_CAP_HEIGHT);
  if(capitals.length<MIN_REFERENCE_CAPITALS)return unresolved('reference-not-located');
  const darkBackground=backgroundLuminance(image,heading)<INK;
  const headingValues=localThickness(image,heading,darkBackground);
  const referenceValues=capitals.flatMap(c=>localThickness(image,c.box,darkBackground));
  if(headingValues.length<MIN_INK_PIXELS||referenceValues.length<MIN_INK_PIXELS)return unresolved('insufficient-ink');
  const referenceCap=median(capitals.map(c=>height(c.box)));
  const headingThickness=median(headingValues),referenceThickness=median(referenceValues);
  const ratio=(headingThickness/headingCap)/(referenceThickness/referenceCap);
  return {supportsBold:ratio>=CONTRAST_CUTOFF,ratio,headingThickness,referenceThickness,headingCap,referenceCap,
    capitals:capitals.map(c=>c.text).join(''),polarity:darkBackground?'light-on-dark':'dark-on-light',reason:ratio>=CONTRAST_CUTOFF?'contrast':'not-distinguishable'};
}
