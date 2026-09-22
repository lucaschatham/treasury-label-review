import test from "node:test";
import assert from "node:assert/strict";
import { parseManifest, buildJobs, validateFiles } from "../src/batch.js";

const csv =
  'filename,brand,type,abv,volume,producer,imported,country\r\na.png,Old Tom,Bourbon,45,750mL,"Example, Inc.",false,\r\nb.png,Other,Wine,12,0.75L,Paris,true,France';
const files = ["a.png", "b.png"].map((name) => ({
  name,
  size: 1000,
  type: "image/png",
}));

test("maps each batch image to its own application, including quoted CSV fields", () => {
  const jobs = buildJobs(files, {}, parseManifest(csv));
  assert.equal(jobs[0].application.producer, "Example, Inc.");
  assert.equal(jobs[1].application.abv, "12");
  assert.equal(jobs[1].application.imported, true);
});

test("rejects ambiguous, missing, and duplicate batch mappings", () => {
  assert.throws(
    () => parseManifest(csv + "\na.png,Other,Wine,12,750mL,X,false,"),
    /duplicate/i,
  );
  assert.throws(
    () => buildJobs([...files, { name: "c.png" }], {}, parseManifest(csv)),
    /c.png/,
  );
  assert.throws(
    () => buildJobs([files[0], files[0]], {}, parseManifest(csv)),
    /duplicate/i,
  );
  assert.throws(() => parseManifest("filename,brand\na.png,X"), /header/i);
});

test("validates numeric values and imported-country requirement", () => {
  assert.throws(
    () => parseManifest(csv.replace("45,750mL", "150,750mL")),
    /ABV/i,
  );
  assert.throws(
    () => parseManifest(csv.replace("true,France", "true,")),
    /country/i,
  );
});

test("batch capacity supports the brief while bounding total upload size", () => {
  assert.doesNotThrow(() =>
    validateFiles(
      Array.from({ length: 300 }, (_, i) => ({
        ...files[0],
        name: `${i}.png`,
      })),
    ),
  );
  assert.throws(() => validateFiles(Array(301).fill(files[0])), /300/);
  assert.throws(
    () => validateFiles([{ ...files[0], size: 11 * 1024 * 1024 }]),
    /10 MB/,
  );
  assert.throws(
    () => validateFiles(Array(30).fill({ ...files[0], size: 9 * 1024 * 1024 })),
    /200 MB/,
  );
});
