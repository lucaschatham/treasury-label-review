// Locate only a single, confidently read uppercase heading. Never use application
// values or synthetic fixture coordinates to select pixels for visual inference.
import { weightContrast } from './weight.js';

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

const unresolved = (found,detail,reason='uncertain') => ({field:'Warning appearance',status:'review',found,detail,reason});

// Map a local weight-contrast measurement to a finding. Every outcome other than a
// measured contrast above the frozen cutoff stays with a person.
export function appearanceFinding(contrast) {
  const ratio = Number.isFinite(contrast?.ratio) ? ` Measured contrast ${contrast.ratio.toFixed(2)}.` : '';
  switch (contrast?.reason) {
    case 'contrast':
      return {field:'Warning appearance',status:'match',found:'Heading heavier than statement text',detail:`The GOVERNMENT WARNING: strokes are materially heavier than the statement's capital letters, relative to letter height.${ratio} This checks weight contrast within the statement, not physical print size or overall compliance.`,reason:'contrast',ratio:contrast.ratio};
    case 'not-distinguishable':
      return {...unresolved('Heading not distinguishable from statement text',`The heading strokes are not materially heavier than the statement's capital letters.${ratio} The heading may be regular weight, or the whole statement may be bold. Inspect the crop and original artwork.`,'not-distinguishable'),ratio:contrast.ratio};
    case 'missing-heading':
      return unresolved('Heading crop unavailable','A single clear uppercase GOVERNMENT WARNING: heading was not located. Inspect the original artwork.','missing-heading');
    case 'heading-too-small':
      return unresolved('Heading too small to measure','The heading is under 20 pixels tall in the reviewed image. Provide larger artwork or inspect the original.','heading-too-small');
    case 'reference-not-located':
      return unresolved('Statement text not measured','The capital letters of the warning statement (According, Surgeon, General, Consumption) were not read clearly enough at 20 pixels or more to compare weights. Inspect the artwork.','reference-not-located');
    default:
      return unresolved('Bold heading not confidently verified','The heading weight could not be measured reliably. Inspect the crop and original artwork.',contrast?.reason||'uncertain');
  }
}

// Measure the heading against the statement locally and keep an evidence crop for the reviewer.
export async function reviewAppearance(canvas, blocks) {
  const box=headingBox(blocks,canvas.width,canvas.height);
  if(!box)return appearanceFinding({reason:'missing-heading'});
  const context=canvas.getContext('2d');
  const contrast=weightContrast(blocks,box,context.getImageData(0,0,canvas.width,canvas.height));
  const finding=appearanceFinding(contrast);
  const width=box.x1-box.x0,height=box.y1-box.y0;
  const crop=document.createElement('canvas');
  crop.width=1200;crop.height=Math.round((height+60)*1200/(width+60));
  if(crop.height>500)return finding;
  const draw=crop.getContext('2d'),scale=1200/(width+60);
  draw.fillStyle='white';draw.fillRect(0,0,crop.width,crop.height);
  draw.drawImage(canvas,box.x0,box.y0,width,height,30*scale,30*scale,width*scale,height*scale);
  return {...finding,crop:crop.toDataURL('image/png')};
}
