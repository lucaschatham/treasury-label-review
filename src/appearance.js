// Locate only a single, confidently read uppercase heading. Never use application
// values or synthetic fixture coordinates to select pixels for visual inference.
function locateHeading(blocks, width, height) {
  const words = (blocks || []).flatMap(block => (block?.paragraphs || [])
    .flatMap(paragraph => (paragraph?.lines || []).flatMap(line => line?.words || [])));
  const matches = [];
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (a.text !== 'GOVERNMENT' || !['WARNING:', 'WARNING'].includes(b.text) || a.confidence < 80 || b.confidence < 80) continue;
    const valid = box => box && ['x0','y0','x1','y1'].every(key => Number.isFinite(box[key])) && box.x0 >= 0 && box.y0 >= 0 && box.x1 <= width && box.y1 <= height && box.x1 > box.x0 && box.y1 > box.y0;
    if (!valid(a.bbox) || !valid(b.bbox)) continue;
    const h = Math.max(a.bbox.y1-a.bbox.y0,b.bbox.y1-b.bbox.y0);
    if (Math.abs(a.bbox.y0-b.bbox.y0) > h/2 || b.bbox.x0 < a.bbox.x1 || b.bbox.x0-a.bbox.x1 > 2*h) continue;
    let end = b.bbox;
    // Punctuation OCR is unreliable at small sizes. Use a nearby colon when
    // confidently located, but leave exact warning text to the text finding.
    if (b.text === 'WARNING') {
      const colon = words[i + 2];
      if (colon?.text === ':' && colon.confidence >= 60 && valid(colon.bbox)) {
        const c = colon.bbox;
        if (c.x0 >= b.bbox.x1 && c.x0-b.bbox.x1 <= h*.6 && c.x1-c.x0 <= h*.4 &&
            c.y0 >= b.bbox.y0 && c.y1 <= b.bbox.y1 && c.y0 >= b.bbox.y0+h*.35 && c.y1 >= b.bbox.y0+h*.65) end = c;
      }
    }
    matches.push({box:{x0:a.bbox.x0,y0:Math.min(a.bbox.y0,b.bbox.y0),x1:end.x1,y1:Math.max(a.bbox.y1,b.bbox.y1)},warning:b});
  }
  return matches.length === 1 ? matches[0] : null;
}

export function headingBox(blocks, width, height) {
  return locateHeading(blocks, width, height)?.box || null;
}

// Segment the crop independently of OCR symbol boxes. Ordinal selection is safe
// only when all seven capitals form separate, plausible connected components.
function rasterI(word, image) {
  const b=word?.bbox;
  if (!b || !Object.values(b).every(Number.isInteger)) return null;
  const width=b.x1-b.x0,height=b.y1-b.y0;
  const ink=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const o=((b.y0+y)*image.width+b.x0+x)*4;
    ink[y*width+x]=Number(.2126*image.data[o]+.7152*image.data[o+1]+.0722*image.data[o+2]<128 && image.data[o+3]>200);
  }
  const components=[];
  for(let start=0;start<ink.length;start++) {
    if(!ink[start])continue;
    const stack=[start],component={x0:width,y0:height,x1:0,y1:0};ink[start]=0;
    while(stack.length) {
      const p=stack.pop(),x=p%width,y=Math.floor(p/width);
      component.x0=Math.min(component.x0,x);component.x1=Math.max(component.x1,x+1);
      component.y0=Math.min(component.y0,y);component.y1=Math.max(component.y1,y+1);
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const n=ny*width+nx;if(ink[n]){ink[n]=0;stack.push(n);}
      }
    }
    components.push(component);
  }
  components.sort((a,b)=>a.x0-b.x0);
  const capitals=components.filter(r=>r.y1-r.y0>=height*.8);
  const punctuation=components.filter(r=>r.y1-r.y0<height*.8);
  const expectedPunctuation=word.text==='WARNING:';
  if(capitals.length!==7 || (expectedPunctuation ? punctuation.length<1 || punctuation.length>2 : punctuation.length!==0))return null;
  if(capitals.some(r=>r.x1-r.x0>height*1.8) || punctuation.some(r=>r.x0<capitals[6].x1 || r.x1-r.x0>height*.4))return null;
  const i=capitals[4];
  return {x0:b.x0+i.x0,x1:b.x0+i.x1,y0:b.y0+i.y0,y1:b.y0+i.y1};
}

// OCR may bound a serif I together with ink from a kerned neighbor. Only
// recover a separate right-hand stem inside a modestly oversized I box.
function kernedI(symbol, image) {
  const b=symbol?.bbox;
  if(!b || !Object.values(b).every(Number.isInteger))return null;
  const height=b.y1-b.y0,width=b.x1-b.x0;
  if(height<16 || width<=height*.8 || width>height*1.1)return null;
  const y0=Math.floor(b.y0+height*.3),y1=Math.ceil(b.y0+height*.7),rows=y1-y0;
  const stable=[];
  for(let x=b.x0;x<b.x1;x++){
    let count=0;
    for(let y=y0;y<y1;y++){
      const o=(y*image.width+x)*4;
      if(.2126*image.data[o]+.7152*image.data[o+1]+.0722*image.data[o+2]<128 && image.data[o+3]>200)count++;
    }
    stable.push(count>=rows*.8);
  }
  const runs=[];
  for(let x=0;x<stable.length;){
    if(!stable[x]){x++;continue;}
    const start=x;while(x<stable.length&&stable[x])x++;
    runs.push({x0:start,x1:x});
  }
  if(runs.length!==2)return null;
  const [left,right]=runs;
  if(right.x0-left.x1<2 || right.x1-right.x0>height*.4 ||
      right.x0<width*.45 || Math.abs((right.x0+right.x1)/2-width/2)>height*.25)return null;
  return {x0:b.x0+right.x0,x1:b.x0+right.x1,y0:b.y0,y1:b.y1};
}

// A narrow face can have a bold I below the single-stem threshold. In that
// case, require dense strokes across the independently segmented whole word.
// The density and run width cutoffs were fixed on the earlier font/layout set;
// the third font-family holdout is reserved for one final evaluation.
function wordStrokeEvidence(word, image) {
  const b=word?.bbox;
  if(!b || !Object.values(b).every(Number.isInteger) || b.x0<0 || b.y0<0 || b.x1>image.width || b.y1>image.height)return false;
  const width=b.x1-b.x0,height=b.y1-b.y0;
  if(height<16 || width<height*3 || width>height*16)return false;
  let ink=0;
  const runs=[];
  for(let y=b.y0;y<b.y1;y++){
    let run=0;
    for(let x=b.x0;x<b.x1;x++){
      const o=(y*image.width+x)*4;
      const dark=image.data[o+3]>200 && .2126*image.data[o]+.7152*image.data[o+1]+.0722*image.data[o+2]<128;
      if(dark)ink++;
      if(y>=b.y0+height*.3 && y<b.y0+height*.7){
        if(dark)run++;
        else if(run){runs.push(run);run=0;}
      }
    }
    if(run)runs.push(run);
  }
  if(runs.length<14)return false;
  runs.sort((a,b)=>a-b);
  const median=runs[Math.floor(runs.length/2)];
  return ink/(width*height)>=.43 && median/(width/8)>=.16;
}

// A conservative corroboration guard, not a font classifier. Require a narrow,
// high-confidence I with a stem at least 17% of cap height, or independently
// segmented and dense strokes across the heading word. Ambiguous glyphs cannot
// receive an automated bold pass, even if vision models agree.
export function strokeEvidence(blocks, image) {
  const heading = locateHeading(blocks, image.width, image.height);
  const uncertain = { supportsBold:false, ratio:null, reason:'glyph-geometry' };
  if (!heading) return {...uncertain,reason:'missing-heading'};
  const {box,warning} = heading;
  const symbols = warning?.symbols?.filter(symbol => symbol.text === 'I') || [];
  const raster = rasterI(warning,image);
  const b = raster || (symbols.length===1 ? kernedI(symbols[0],image) || symbols[0].bbox : null);
  if (!b || !Object.values(b).every(Number.isInteger) || b.x0 < box.x0 || b.y0 < box.y0 || b.x1 > box.x1 || b.y1 > box.y1) return uncertain;
  const height=b.y1-b.y0, width=b.x1-b.x0;
  if (height < 16 || width <= 0 || width/height > .8) return uncertain;
  const rows=[];
  for(let y=Math.floor(b.y0+height*.3); y< b.y0+height*.7; y++) {
    let count=0;
    for(let x=b.x0;x<b.x1;x++) {
      const offset=(y*image.width+x)*4;
      const luminance=.2126*image.data[offset]+.7152*image.data[offset+1]+.0722*image.data[offset+2];
      if (luminance<128 && image.data[offset+3]>200) count++;
    }
    rows.push(count/height);
  }
  const ratio=rows.reduce((sum,value)=>sum+value,0)/rows.length;
  if(ratio>=.13 && ratio<.17 && raster && wordStrokeEvidence(warning,image))return {supportsBold:true,ratio,reason:'supported',method:'word-strokes'};
  return {supportsBold:ratio>=.17,ratio,reason:ratio>=.17?'supported':'stroke-evidence'};
}

const unresolved = (found,detail,reason='uncertain') => ({field:'Warning appearance',status:'review',found,detail,reason});

export function appearanceFinding(result, supportsBold) {
  if (result?.reason === 'provider') return unresolved('Automated appearance unavailable','The provider could not complete the check (capacity, quota, or service failure). Retry later or inspect the artwork; this is not a font-weight judgment.','provider');
  if (result?.verdict === 'BOLD' && result.reason === 'corroborated' && supportsBold) return {field:'Warning appearance',status:'match',found:'Bold heading corroborated',detail:'Two vision models and a stroke-width check agree. This prototype checks heading weight, not physical print size or overall regulatory compliance.'};
  return unresolved('Bold heading not confidently verified',result?.reason==='timeout'?'The appearance check reached its time limit. Try again or inspect the artwork.':'The visual checks did not all support bold weight. The heading may be regular, too small, or an unfamiliar style. Inspect the crop and original artwork.',result?.reason||'uncertain');
}

export async function reviewAppearance(canvas, blocks, cache=new Map()) {
  const box=headingBox(blocks,canvas.width,canvas.height);
  if(!box)return unresolved('Heading crop unavailable','A single clear uppercase GOVERNMENT WARNING: heading was not located. Inspect the original artwork.','missing-heading');
  const context=canvas.getContext('2d');
  const stroke=strokeEvidence(blocks,context.getImageData(0,0,canvas.width,canvas.height));
  const width=box.x1-box.x0,height=box.y1-box.y0;
  const crop=document.createElement('canvas');
  crop.width=1200;crop.height=Math.round((height+60)*1200/(width+60));
  if(crop.height>500)return unresolved('Heading crop unclear','The heading region has an unusual shape. Inspect the original artwork.');
  const draw=crop.getContext('2d'),scale=1200/(width+60);
  draw.fillStyle='white';draw.fillRect(0,0,crop.width,crop.height);
  draw.drawImage(canvas,box.x0,box.y0,width,height,30*scale,30*scale,width*scale,height*scale);
  const image=crop.toDataURL('image/png');
  if(!stroke.supportsBold)return {...unresolved('Bold heading not confidently verified',stroke.reason==='glyph-geometry'?'The heading glyph could not be isolated reliably. Inspect the crop.':'The measured heading strokes do not meet the bold corroboration threshold. Inspect the crop.',stroke.reason),crop:image};
  if(cache.has(image))return {...appearanceFinding(cache.get(image),stroke.supportsBold),crop:image,cached:true};
  let finding;
  try {
    const response=await fetch('/api/warning-appearance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image}),signal:AbortSignal.timeout(5000)});
    if(!response.ok)finding=unresolved('Automated appearance unavailable',response.status===429?'Service rate limit reached. Wait a minute and review this label again.':'The appearance service could not finish. Try again, or inspect the artwork; text findings remain available.');
    else {
      const result=await response.json();
      finding=appearanceFinding(result,stroke.supportsBold);
      if(result?.verdict==='BOLD' && result.reason==='corroborated')cache.set(image,result);
    }
  } catch(error) {finding=unresolved('Automated appearance unavailable','The appearance request failed or timed out. Text findings remain available. Try again or inspect the artwork.',error.name==='TimeoutError'?'timeout':'provider');}
  return {...finding,crop:image};
}
