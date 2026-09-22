import test from 'node:test';
import assert from 'node:assert/strict';
import { readLayout } from '../src/layout.js';
const line = (text, x0, y0, x1, y1) => ({text,bbox:{x0,y0,x1,y1},confidence:96});
const blocks = (lines) => [{paragraphs:[{lines}]}];
test('rejoins split same-row OCR fragments in physical reading order', () => {
 const result=readLayout(blocks([line('France',729,534,828,550),line('Produced by RIVER BEND, Bordeaux,',151,532,705,555)]));
 assert.equal(result.text,'Produced by RIVER BEND, Bordeaux, France');
});
test('extracts the prominent multiline brand independently of submitted values', () => {
 const result=readLayout(blocks([line('RIVER',152,105,330,140),line('BEND',152,166,292,202),line('Kentucky Straight Bourbon Whiskey',151,283,941,318),line('Produced by OTHER BRAND',151,532,705,555)]));
 assert.equal(result.brandText,'RIVER BEND');
});
test('keeps separate columns and distant text out of the brand', () => {
 const result=readLayout(blocks([line('FIRST BRAND',50,50,250,90),line('OTHER BRAND',650,50,850,90),line('GOVERNMENT WARNING:',50,600,450,630)]));
 assert.equal(result.brandText,'');
});
test('separates a similarly tall class designation from the brand paragraph', () => {
 const result=readLayout(blocks([line('STONE’S',153,96,431,141),line('THROW',151,154,399,199),line('Kentucky Straight Bourbon Whiskey',151,280,830,319)]));
 assert.equal(result.brandText,'STONE’S THROW');
});

test('absent and invalid OCR geometry produces an empty layout', () => {
 for (const value of [null, undefined, [], blocks([line('bad',0,0,0,10),line('bad',0,NaN,20,10)]), [null, {paragraphs:null}]]) {
  assert.deepEqual(readLayout(value), {text:'',brandText:'',lines:[]});
 }
});
import { comparisonText } from '../src/layout.js';
test('partial geometry never discards plain OCR evidence', () => {
 assert.equal(comparisonText({text:'BRAND\n45% ABV'},readLayout(blocks([line('BRAND',0,0,100,20),line('45% ABV',0,30,0,50)]))) ,'BRAND\n45% ABV');
 assert.equal(comparisonText({text:'France\nProduced in'}, {text:'Produced in France'}),'Produced in France');
 assert.equal(comparisonText({text:null},{text:''}),'');
});
