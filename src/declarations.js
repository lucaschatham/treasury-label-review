// Evidence ownership is determined before application values are compared.
const role = /^(?:(?:produced|bottled|distilled|brewed|vinted|cellared|blended|imported|distributed|marketed|crafted|made)(?:\s*,?\s*(?:and|&)\s*(?:produced|bottled|distilled|brewed|vinted|cellared|blended|imported|distributed|marketed|crafted|made))*\s+(?:by|for)\b|producer\s*:)/i;
const production = /^(?:(?:produced|bottled|distilled|brewed|vinted|cellared|blended)(?:\s*,?\s*(?:and|&)\s*(?:produced|bottled|distilled|brewed|vinted|cellared|blended))*\s+by\s*|producer\s*:\s*)/i;
const origin = /^(?:product\s+of|made\s+in|produced\s+in|country\s+of\s+origin\s*:?)\s*/i;
const explicitType = /^(?:class\s*\/\s*type|class|type|designation)\s*:\s*/i;
const typeEnd = /\b(?:whisk(?:e)?y|bourbon|gin|vodka|rum|tequila|mezcal|brandy|cognac|liqueur|schnapps|beer|ale|lager|stout|porter|wine|cabernet sauvignon|sauvignon blanc|pinot noir|pinot grigio|chardonnay|merlot|riesling|syrah|shiraz|zinfandel|champagne|cider|sake)\s*$/i;
const qualifier = /^(?:(?:kentucky|straight|london|dry|irish|scotch|american|single|malt|blended|distilled|red|white|sparkling|india|pale|imperial|barrel|aged)\s*)+$/i;
const marker = /^(?:abv\s*:?|alc(?:ohol)?\.?\s*(?:\/|by)?\s*vol(?:ume)?\.?)\s*$/i;
const boundary = text => role.test(text) || origin.test(text) || explicitType.test(text) || /GOVERNMENT WARNING|^\(?[12]\)|\b\d+(?:\.\d+)?\s*(?:%|mL|cL|L|fl\.?\s*oz)\b/i.test(text);
const typeLine = text => typeEnd.test(text) && !role.test(text) && !origin.test(text) && !/\b(?:by|for|inspired|contains|enjoy|our|with)\b/i.test(text);

function adjacent(a, b) {
  if (!a || !b) return false;
  if (!a.bbox && !b.bbox) return true;
  if (!a.bbox || !b.bbox) return false;
  const h = Math.max(a.bbox.y1-a.bbox.y0,b.bbox.y1-b.bbox.y0);
  const gap = b.bbox.y0-a.bbox.y1;
  return gap >= -h*.15 && gap <= h*1.5 && Math.abs(a.bbox.x0-b.bbox.x0) <= h;
}

export function extractDeclarations(rawText, layout) {
  const tokens = text => text.trim().split(/\s+/).sort().join(' ');
  const completeGeometry = layout?.lines?.length && tokens(layout.lines.map(line=>line.text).join(' '))===tokens(rawText);
  const lines = (completeGeometry ? layout.lines : rawText.split(/\r?\n/).map(text=>({text})))
    .filter(line=>typeof line.text==='string' && line.text.trim())
    .map(line=>({...line,text:line.text.trim()}));
  const types=[], producers=[], countries=[], alcohol=[];
  for (let i=0;i<lines.length;i++) {
    const line=lines[i], text=line.text, next=lines[i+1];
    const linked=adjacent(line,next);
    // A wrap is accepted only when its syntax establishes a declaration.
    if (marker.test(text) && linked && /^\d+(?:\.\d+)?\s*%/.test(next.text)) alcohol.push(`${text} ${next.text}`);
    else if (/^\d+(?:\.\d+)?\s*%$/.test(text) && linked && marker.test(next.text)) alcohol.push(`${text} ${next.text}`);
    else alcohol.push(text);
    for (const [pattern, values, kind] of [[origin,countries,'origin'],[production,producers,'producer'],[explicitType,types,'type']]) {
      if (!pattern.test(text)) continue;
      let value=text.replace(pattern,'').trim();
      // Inline secondary roles belong to another declaration, not this value.
      value=value.split(/\s+(?=(?:imported|distributed|marketed|produced|bottled|distilled|brewed)\s+by\b)/i)[0].replace(/[;|]+\s*$/,'').trim();
      if (!value && linked && !boundary(next.text)) value=next.text;
      else if (kind==='type' && value && qualifier.test(value) && linked && typeLine(next.text)) value+=` ${next.text}`;
      else if (kind==='origin' && value && /^(?:United|South|New|Costa|Sri|Saudi|Czech|Dominican|North|Papua New)$/i.test(value) && linked && /^[A-Za-z]+(?: [A-Za-z]+)?$/.test(next.text) && !boundary(next.text)) value+=` ${next.text}`;
      else if (kind==='producer' && value) {
        for(let j=i+1;j<=i+2 && adjacent(lines[j-1],lines[j]);j++) {
          const continuation=lines[j].text;
          if(boundary(continuation) || typeLine(continuation) || !/[,\d]/.test(continuation)) break;
          value+=` ${continuation}`;
        }
      }
      if(value) values.push(value);
    }
    if (!boundary(text) && typeLine(text)) {
      const previous=lines[i-1];
      if (previous && explicitType.test(previous.text) && adjacent(previous,line)) continue;
      types.push(previous && adjacent(previous,line) && qualifier.test(previous.text) ? `${previous.text} ${text}` : text);
    }
  }
  return {types,producers,countries,alcohol};
}
