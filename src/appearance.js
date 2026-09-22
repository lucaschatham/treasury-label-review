// Locate only a single, confidently read uppercase heading. Never use application
// values or synthetic fixture coordinates to select pixels for visual inference.
export function headingBox(blocks, width, height) {
  const words = (blocks || []).flatMap(block => (block?.paragraphs || [])
    .flatMap(paragraph => (paragraph?.lines || []).flatMap(line => line?.words || [])));
  const matches = [];
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (a.text !== 'GOVERNMENT' || b.text !== 'WARNING:' || a.confidence < 80 || b.confidence < 80) continue;
    const valid = box => box && ['x0','y0','x1','y1'].every(key => Number.isFinite(box[key])) && box.x0 >= 0 && box.y0 >= 0 && box.x1 <= width && box.y1 <= height && box.x1 > box.x0 && box.y1 > box.y0;
    if (!valid(a.bbox) || !valid(b.bbox)) continue;
    const h = Math.max(a.bbox.y1-a.bbox.y0,b.bbox.y1-b.bbox.y0);
    if (Math.abs(a.bbox.y0-b.bbox.y0) > h/2 || b.bbox.x0 < a.bbox.x1 || b.bbox.x0-a.bbox.x1 > 2*h) continue;
    matches.push({x0:a.bbox.x0,y0:Math.min(a.bbox.y0,b.bbox.y0),x1:b.bbox.x1,y1:Math.max(a.bbox.y1,b.bbox.y1)});
  }
  return matches.length === 1 ? matches[0] : null;
}

// A conservative corroboration guard, not a font classifier. Require a narrow,
// high-confidence I with a stem at least 17% of cap height; thinner or ambiguous
// glyphs cannot receive an automated bold pass, even if vision models agree.
export function strokeEvidence(blocks, image) {
  const box = headingBox(blocks, image.width, image.height);
  const uncertain = { supportsBold:false, ratio:null };
  if (!box) return uncertain;
  const words = blocks.flatMap(block => (block?.paragraphs || []).flatMap(p => (p?.lines || []).flatMap(l => l?.words || [])));
  const warning = words.find(word => word.text === 'WARNING:' && word.bbox?.x1 === box.x1 && word.bbox?.y0 >= box.y0);
  const symbols = warning?.symbols?.filter(symbol => symbol.text === 'I') || [];
  if (symbols.length !== 1) return uncertain;
  const b = symbols[0].bbox;
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
  return {supportsBold:ratio>=.17,ratio};
}

export async function reviewAppearance(canvas, blocks) {
  const unresolved = (found,detail) => ({field:'Warning appearance',status:'review',found,detail});
  const box=headingBox(blocks,canvas.width,canvas.height);
  if(!box)return unresolved('Heading crop unavailable','A single clear uppercase GOVERNMENT WARNING: heading was not located. Inspect the original artwork.');
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
  let finding;
  try {
    const response=await fetch('/api/warning-appearance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image}),signal:AbortSignal.timeout(5000)});
    if(!response.ok)finding=unresolved('Automated appearance unavailable',response.status===429?'Service rate limit reached. Wait a minute and review this label again.':'The appearance service could not finish. Try again, or inspect the artwork; text findings remain available.');
    else {
      const result=await response.json();
      if(result.verdict==='BOLD' && result.reason==='corroborated' && stroke.supportsBold)finding={field:'Warning appearance',status:'match',found:'Bold heading corroborated',detail:'Two vision models and a stroke-width check agree. This prototype checks heading weight, not physical print size or overall regulatory compliance.'};
      else finding=unresolved('Bold heading not confidently verified',result.reason==='timeout'?'The appearance check reached its time limit. Try again or inspect the artwork.':'The visual checks did not all support bold weight. The heading may be regular, too small, or an unfamiliar style. Inspect the crop and original artwork.');
    }
  } catch {finding=unresolved('Automated appearance unavailable','The appearance request failed or timed out. Text findings remain available. Try again or inspect the artwork.');}
  return {...finding,crop:image};
}
