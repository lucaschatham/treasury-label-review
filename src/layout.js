// Reconstruct sparse OCR lines using their geometry, without application values.
export function readLayout(blocks = []) {
  const lines = (Array.isArray(blocks) ? blocks : []).flatMap(block => (block?.paragraphs || []).flatMap(paragraph => paragraph?.lines || []))
    .filter(line => line?.text?.trim() && line.bbox && Object.values(line.bbox).every(Number.isFinite) && line.bbox.y1 > line.bbox.y0 && line.bbox.x1 > line.bbox.x0)
    .map(line => ({ text: line.text.trim(), bbox: { ...line.bbox } }))
    .sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const height = line => line.bbox.y1 - line.bbox.y0;
  const overlap = (a, b) => Math.min(a.bbox.y1, b.bbox.y1) - Math.max(a.bbox.y0, b.bbox.y0);
  const rows = [];
  for (const line of lines) {
    const row = rows.find(row => overlap(row[0], line) >= 0.5 * Math.min(height(row[0]), height(line)));
    if (row) row.push(line); else rows.push([line]);
  }
  const ordered = rows.flatMap(row => {
    row.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const segments = [];
    for (const line of row) {
      const previous = segments.at(-1);
      if (previous && line.bbox.x0 - previous.bbox.x1 <= 3 * Math.max(height(previous), height(line))) {
        previous.text += ` ${line.text}`;
        previous.bbox = { x0: previous.bbox.x0, y0: Math.min(previous.bbox.y0, line.bbox.y0), x1: Math.max(previous.bbox.x1, line.bbox.x1), y1: Math.max(previous.bbox.y1, line.bbox.y1) };
      } else segments.push({ text: line.text, bbox: { ...line.bbox } });
    }
    return segments;
  });
  const maximumHeight = Math.max(0, ...ordered.map(height));
  const prominent = ordered.filter(line => height(line) >= maximumHeight * 0.85);
  const anchor = prominent[0];
  let brandText = '';
  if (anchor && !prominent.slice(1).some(line => overlap(anchor, line) > 0)) {
    const brand = [anchor];
    for (const line of prominent.slice(1)) {
      const previous = brand.at(-1);
      const gap = line.bbox.y0 - previous.bbox.y1;
      const aligned = Math.abs(line.bbox.x0 - anchor.bbox.x0) <= maximumHeight;
      if (gap < 0 || gap > 1.25 * maximumHeight || !aligned) break;
      brand.push(line);
    }
    brandText = brand.map(line => line.text).join(' ');
  }
  return { text: ordered.map(line => line.text).join('\n'), brandText, lines: ordered };
}

export function comparisonText(data, layout) {
  const plain = typeof data?.text === 'string' ? data.text : '';
  const spatial = layout?.text || '';
  const tokens = value => value.trim().split(/\s+/).sort().join(' ');
  // Only reorder complete evidence. Invalid/partial geometry must not erase words.
  return !plain.trim() || tokens(plain) === tokens(spatial) ? spatial : plain;
}
