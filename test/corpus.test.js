import test from "node:test";
import assert from "node:assert/strict";
import { buildCorpus } from "../scripts/lib/corpus.js";

test("corpus separates design families before tuning and covers each beverage", () => {
  const corpus = buildCorpus();
  const base = corpus.labels.filter((x) => x.variant === "valid");
  assert.equal(base.length, 30);
  for (const beverage of ["spirits", "wine", "beer"]) {
    assert.equal(base.filter((x) => x.beverage === beverage).length, 10);
  }
  for (const design of new Set(corpus.labels.map((x) => x.design))) {
    assert.equal(
      new Set(
        corpus.labels.filter((x) => x.design === design).map((x) => x.split),
      ).size,
      1,
    );
  }
  assert.equal(base.filter((x) => x.split === "holdout").length, 15);
  for (const variant of [
    "brand",
    "abv",
    "volume",
    "warning-word",
    "warning-case",
    "warning-weight",
    "missing-warning",
    "blur",
    "glare",
  ]) {
    assert.ok(
      corpus.labels.some((x) => x.variant === variant),
      variant,
    );
  }
});

test("typography includes matched bold/regular pairs with no family crossing splits", () => {
  const { typography } = buildCorpus();
  assert.equal(typography.length, 40);
  for (const font of new Set(typography.map((x) => x.family))) {
    const cases = typography.filter((x) => x.family === font);
    assert.equal(new Set(cases.map((x) => x.split)).size, 1);
    for (const size of [24, 32, 40, 48]) {
      assert.deepEqual(
        cases
          .filter((x) => x.size === size)
          .map((x) => x.expected)
          .sort(),
        ["bold", "not_bold"],
      );
    }
  }
});

test("ground truth records actual altered artwork independently of submitted values", () => {
  const { labels } = buildCorpus();
  for (const label of labels) {
    if (label.variant === "brand")
      assert.notEqual(label.observed.brand, label.application.brand);
    if (label.variant === "abv")
      assert.notEqual(label.observed.abv, label.application.abv);
    if (label.variant === "volume")
      assert.notEqual(label.observed.volume, label.application.volume);
    assert.ok(label.provenance.includes("Synthetic"));
    if (label.quality === "difficult") {
      assert.equal(label.expectedDefect, null);
      assert.deepEqual(label.observed, label.application);
    }
  }
});

import {readFileSync} from 'node:fs';
test('repair holdout is frozen at 40 paired bold and regular images',()=>{
 const {labels}=JSON.parse(readFileSync(new URL('../evidence/appearance-holdout-frozen.json',import.meta.url)));
 assert.equal(labels.length,80);
 assert.equal(labels.filter(x=>x.headingBold).length,40);
 assert.equal(new Set(labels.map(x=>x.sha256)).size,80);
 for(const family of new Set(labels.map(x=>x.family)))for(let layout=0;layout<5;layout++){
  const pair=labels.filter(x=>x.family===family&&x.layout===layout);
  assert.equal(pair.length,2);
  assert.deepEqual(pair.map(x=>x.headingBold).sort(),[false,true]);
 }
});

test('next appearance holdout has independent paired faces and font provenance',()=>{
 const {labels}=JSON.parse(readFileSync(new URL('../evidence/appearance-holdout-v3-frozen.json',import.meta.url)));
 const prior=[
  ...JSON.parse(readFileSync(new URL('../evidence/appearance-holdout-frozen.json',import.meta.url))).labels,
  ...JSON.parse(readFileSync(new URL('../evidence/appearance-holdout-v2-frozen.json',import.meta.url))).labels,
 ];
 const seen=new Set([...prior.map(x=>x.family),...buildCorpus().typography.map(x=>x.family),
  'Arial','Georgia','Trebuchet-MS','Verdana']);
 assert.equal(labels.length,80);
 assert.equal(new Set(labels.map(x=>x.family)).size,8);
 assert.equal(new Set(labels.map(x=>x.sha256)).size,80);
 for(const item of labels){
  assert.equal(seen.has(item.family),false,item.family);
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.match(item.fontSha256,/^[a-f0-9]{64}$/);
  assert.ok(Number.isInteger(item.fontIndex));
  assert.ok(item.fontFamily && item.fontStyle);
 }
 for(const family of new Set(labels.map(x=>x.family)))for(let layout=0;layout<5;layout++){
  const pair=labels.filter(x=>x.family===family&&x.layout===layout);
  assert.equal(pair.length,2,`${family} layout ${layout}`);
  assert.deepEqual(pair.map(x=>x.headingBold).sort(),[false,true]);
  assert.equal(pair[0].size,pair[1].size);
  assert.equal(pair[0].x,pair[1].x);
  assert.equal(pair[0].y,pair[1].y);
  assert.notEqual(pair[0].font,pair[1].font);
 }
});
