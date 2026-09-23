import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { readSpreadsheet, classifyUploads, mergeImages } from '../src/spreadsheet.js';
import { parseManifest, buildJobs } from '../src/batch.js';
const headers = ['filename','brand','type','abv','volume','producer','imported','country'];
const values = ['label.png','Test, Inc.','Whiskey',45,'750 mL','Producer',false,''];
async function xlsx(rows=[headers,values], configure=()=>{}) {
 const book=new ExcelJS.Workbook(), sheet=book.addWorksheet('Applications'); sheet.addRows(rows); configure(sheet,book);
 return new File([await book.xlsx.writeBuffer()],'application.XLSX');
}
const csv='filename,brand,type,abv,volume,producer,imported,country\nlabel.png,"Test, Inc.",Whiskey,45,750 mL,Producer,false,\n';
test('real XLSX and CSV produce identical validated applications and correct jobs',async()=>{
 const excel=await readSpreadsheet(await xlsx());
 const text=await readSpreadsheet(new File([csv],'application.csv'));
 assert.deepEqual(excel,text); assert.deepEqual(text,parseManifest(csv));
 assert.equal(buildJobs([{name:'label.png'}],{},excel)[0].application.brand,'Test, Inc.');
 assert.throws(()=>buildJobs([{name:'other.png'}],{},excel),/Missing images/);
});
test('numeric Excel percentage ABV becomes percentage points',async()=>{
 const result=await readSpreadsheet(await xlsx([headers,[...values.slice(0,3),0.45,...values.slice(4)]],s=>{s.getCell('D2').numFmt='0%';}));
 assert.equal(result.get('label.png').abv,'45');
});
test('reject corrupt, renamed, empty, oversized and unsupported files',async()=>{
 for (const file of [new File(['not a workbook'],'bad.xlsx'),new File([csv],'fake.xlsx'),new File([],'empty.csv'),new File(['x'.repeat(1024*1024+1)],'big.csv'),new File([csv],'old.xls')]) await assert.rejects(()=>readSpreadsheet(file));
});
test('reject missing columns, duplicate filenames, invalid applications, formulas, and ambiguous workbooks',async()=>{
 for(const file of [await xlsx([['brand'],['x']]),await xlsx([headers,values,values]),await xlsx([headers,[...values.slice(0,3),101,...values.slice(4)]]),await xlsx([headers,values],s=>{s.getCell('B2').value={formula:'"Test"',result:'Test'};}),await xlsx([headers,values],(_,b)=>{b.addWorksheet('More').addRows([headers,values]);})]) await assert.rejects(()=>readSpreadsheet(file));
});
test('reject more than 300 rows in either format',async()=>{
 const rows=Array.from({length:301},(_,i)=>[`${i}.png`,...values.slice(1)]);
 await assert.rejects(async()=>readSpreadsheet(await xlsx([headers,...rows])),/300/);
 await assert.rejects(()=>readSpreadsheet(new File([[headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')],'large.csv')),/300/);
});
test('mixed file selection separates spreadsheets and images, rejects multiple spreadsheets and unknown files',()=>{
 const png=new File(['image'],'label.png',{type:'image/png'}), sheet=new File([csv],'app.csv');
 assert.deepEqual(classifyUploads([png,sheet]),{images:[png],spreadsheet:sheet});
 assert.throws(()=>classifyUploads([sheet,new File([csv],'app.xlsx')]),/one spreadsheet/);
 assert.throws(()=>classifyUploads([new File(['pdf'],'a.pdf')]),/PNG/);
 assert.deepEqual(mergeImages([png],[new File(['new'],'second.png',{type:'image/png'})]).map(f=>f.name),['label.png','second.png']);
 assert.throws(()=>mergeImages([],[png,png]),/Duplicate/);
});
test('different application rows map by exact filename independent of upload order',async()=>{
 const file=await xlsx([headers,['a.png','A','Gin',40,'750 mL','',false,''],['b.png','B','Rum',50,'1 L','',true,'Jamaica']]);
 const map=await readSpreadsheet(file);
 const snapshot=JSON.stringify([...map]);
 const jobs=buildJobs([{name:'b.png'},{name:'a.png'}],{},map);
 assert.deepEqual(jobs.map(job=>[job.file.name,job.application.brand,job.application.abv]),[['b.png','B','50'],['a.png','A','40']]);
 assert.equal(jobs[0].application.imported,true);
 jobs[0].application.brand='Changed';assert.equal(JSON.stringify([...map]),snapshot);
});
