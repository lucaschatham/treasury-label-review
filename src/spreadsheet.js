import { parseManifest, validateFiles } from './batch.js';

export function classifyUploads(files) {
  const images = [], sheets = [];
  for (const file of files) {
    if (/\.(csv|xlsx)$/i.test(file.name)) sheets.push(file);
    else images.push(file);
  }
  if (sheets.length > 1) throw new Error('Add one spreadsheet per batch, CSV or XLSX.');
  if (images.length) validateFiles(images);
  return {images, spreadsheet:sheets[0] || null};
}

export function mergeImages(current, incoming) {
  const names = new Set();
  for (const file of incoming) {
    if (names.has(file.name)) throw new Error(`Duplicate image filename: ${file.name}.`);
    names.add(file.name);
  }
  const merged = new Map(current.map(file => [file.name,file]));
  incoming.forEach(file => merged.set(file.name,file));
  const images = [...merged.values()];
  if (images.length) validateFiles(images);
  return images;
}

export async function readSpreadsheet(file) {
  if (!file.size || file.size > 1024 * 1024) throw new Error('Use a nonempty CSV or XLSX spreadsheet under 1 MB.');
  const extension = file.name.split('.').pop().toLowerCase();
  let text;
  if (extension === 'csv') text = await file.text();
  else if (extension === 'xlsx') {
    const {default:ExcelJS} = await import('exceljs');
    const book = new ExcelJS.Workbook();
    try {await book.xlsx.load(new Uint8Array(await file.arrayBuffer()));}
    catch {throw new Error('Could not read this XLSX file. Save it as an Excel workbook and try again.');}
    const sheets = book.worksheets.filter(sheet => sheet.actualRowCount > 0);
    if (sheets.length !== 1) throw new Error('Use one nonempty worksheet with application rows.');
    const sheet = sheets[0];
    if (sheet.rowCount > 301) throw new Error('Use up to 300 spreadsheet rows.');
    if (sheet.columnCount > 32) throw new Error('Too many columns. Use the spreadsheet template.');
    const width = sheet.columnCount;
    const rows = [];
    sheet.eachRow({includeEmpty:true}, row => {
      const values = [];
      for (let i=1; i<=width; i++) {
        const cell = row.getCell(i); let value = cell.value;
        if (value !== null && typeof value === 'object') {
          if (value.richText) value = value.richText.map(part=>part.text).join('');
          else throw new Error(`Cell ${cell.address}: use plain values, not formulas, dates, or links.`);
        }
        if (row.number > 1 && sheet.getRow(1).getCell(i).text.trim() === 'abv' && typeof value === 'number' && /%/.test(cell.numFmt)) value = Number((value * 100).toFixed(8));
        values.push(`"${String(value ?? '').replaceAll('"','""')}"`);
      }
      rows.push(values.join(','));
    });
    text = rows.join('\n');
  } else throw new Error('Use CSV or XLSX. Older XLS files are not supported.');
  let applications;
  try {applications = parseManifest(text);}
  catch(error) {throw new Error(error.message.replaceAll('CSV','Spreadsheet'));}
  if (applications.size > 300) throw new Error('Use up to 300 spreadsheet rows.');
  return applications;
}
