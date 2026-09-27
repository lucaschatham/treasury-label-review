// Isolated synthetic logic tests, no accuracy or rendering claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceSelection,statementChain,candidateContrast} from './r043-association.mjs';
import {weightContrast} from '../../src/weight.js';
const image={width:1600,height:900};
const h={x0:20,y0:20,x1:300,y1:44};
const word=(text,x,y,width=70)=>({text,confidence:96,bbox:{x0:x,y0:y,x1:x+width,y1:y+24},symbols:[{text:text[0],confidence:96,bbox:{x0:x,y0:y,x1:x+12,y1:y+24}}]});
const blocks=words=>[{paragraphs:[{lines:[{words}]}]}];
const references=(words,heading=h)=>referenceSelection(blocks(words),heading,image);
const standard=y=>['According','Surgeon','General','Consumption'].map((w,i)=>word(w,(y===20?320:20)+i*85,y));
test('inline and below-heading reference identities agree',()=>{
  assert.deepEqual(references(standard(20)).capitals.map(c=>c.text),['A','S','G','C']);
  assert.deepEqual(references(standard(60)).capitals.map(c=>c.text),['A','S','G','C']);
});
test('distant words and words across a row gutter are excluded',()=>{
  assert.equal(references(['According','Surgeon','General'].map((w,i)=>word(w,1000+i*85,700))).capitals.length,0);
  assert.equal(references(['According','Surgeon','General'].map((w,i)=>word(w,700+i*85,20))).capitals.length,0);
});
test('competing continuation columns abstain before spanning their gutter',()=>{
  const heading={x0:20,y0:20,x1:1000,y1:44};
  assert.equal(references([word('According',30,60),word('Surgeon',700,60)],heading).reason,'ambiguous-reference');
});
test('duplicates and out-of-order references abstain even when one is low confidence',()=>{
  const duplicate=standard(20);duplicate.push({...word('General',660,20),confidence:20});
  assert.equal(references(duplicate).reason,'ambiguous-reference');
  assert.equal(references([word('General',320,20),word('According',405,20)]).reason,'ambiguous-reference');
});
test('physical split requires two observed adjacent fragments and their confidence',()=>{
  const words=[word('Consump-',320,20),word('tion',405,20)];
  assert.equal(references(words).capitals[0]?.text,'C');
  words[1].confidence=20;
  assert.equal(references(words).capitals.length,0);
  words[0].text='Consump';words[1].confidence=96;
  assert.equal(references(words).capitals.length,0);
});
test('hard word bound is enforced during append',()=>{
  const words=Array.from({length:100},(_,i)=>word('x',301+i*10,20,9));
  const r=statementChain(words,h,image);
  assert.equal(r.reason,'ambiguous-reference');assert.equal(r.chain.length,90);
});
test('unchanged floor, estimator and polarity on paired synthetic pixels',()=>{
  function fixture(inline,heavyBody=false,inverted=false){
    const data=new Uint8ClampedArray(1600*900*4).fill(255);
    const img={...image,data};
    const ink=(x,y,w)=>{for(let yy=y;yy<y+24;yy++)for(let xx=x;xx<x+w;xx++)for(let c=0;c<3;c++)data[(yy*1600+xx)*4+c]=0;};
    for(let i=0;i<4;i++)ink(30+i*50,20,6);
    const words=standard(inline?20:60);
    words.forEach(w=>ink(w.bbox.x0,w.bbox.y0,heavyBody?6:4));
    if(inverted)for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)data[i+c]=255-data[i+c];
    return {img,words};
  }
  for(const heavyBody of [false,true])for(const inverted of [false,true]){
    const a=fixture(false,heavyBody,inverted),b=fixture(true,heavyBody,inverted);
    const expected=weightContrast(blocks(a.words),h,a.img);
    const actual=candidateContrast(blocks(b.words),h,b.img);
    assert.equal(actual.supportsBold,!heavyBody);assert.equal(actual.ratio,expected.ratio);
    b.words.forEach(w=>{w.symbols[0].bbox.y1=w.symbols[0].bbox.y0+18;});
    assert.equal(candidateContrast(blocks(b.words),h,b.img).reason,'reference-not-located');
  }
});
