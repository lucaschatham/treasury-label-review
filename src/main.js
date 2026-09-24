import { resetMessage } from './session.js';
import { classifyUploads, mergeImages, readSpreadsheet } from './spreadsheet.js';
import { timeStage, finishTiming } from './timing.js';
import { reviewAppearance } from "./appearance.js";
import { readLayout, comparisonText } from "./layout.js";
import { createWorker } from "tesseract.js";
import { createTriage } from "./triage.js";
import { reviewLabel } from "./review.js";
import { validateFiles, buildJobs, validateApplication } from "./batch.js";

const form = document.querySelector("#review-form");
const inputs = document.querySelector("#inputs");
const fileInput = document.querySelector("#images");
let manifestFile = null, manifestApplications = null, uploadError = false, uploadBusy = false;
const manifestSummary = document.querySelector('#manifest-summary');
const removeManifest = document.querySelector('#remove-manifest');
const clearFiles = document.querySelector('#clear-files');
const fileList = document.querySelector("#file-list");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const triage = createTriage(results, {intake:document.querySelector('#label-intake')});
const sampleButton = document.querySelector("#sample-button");
const stopButton = document.querySelector("#stop-button");

const dropZone = document.querySelector("#drop-zone");
const appSummary = document.querySelector('#application-summary');
const applicationDialog = document.querySelector('#application-dialog');
const runButton = document.querySelector('#run-button');
let filesValid = false;
let detailsSnapshot = null, runAfterDetails = false;
const editDetails = document.querySelector('#edit-details');
function applicationValues() {return Object.fromEntries([...inputs.querySelectorAll('[name]')].map(input=>[input.name,input.type==='checkbox'?input.checked:input.value]));}
function detailsReady() {try {validateApplication(applicationValues()); return true;} catch {return false;}}
function openApplication(run=false) {
  runAfterDetails=run; detailsSnapshot=applicationValues();
  document.querySelector('#application-error').hidden=true;
  applicationDialog.showModal();
}
function restoreDetails() {if(detailsSnapshot) for(const [key,value] of Object.entries(detailsSnapshot)) {const input=form.elements.namedItem(key); if(input.type==='checkbox') input.checked=value; else input.value=value;} detailsSnapshot=null;}
editDetails.onclick=()=>openApplication();
applicationDialog.addEventListener('cancel',()=>{restoreDetails(); updateApplicationSummary();});
const resetDialog=document.querySelector('#reset-dialog');
async function allowReset() {
 const count=triage.decisionCount(); if(!count) return true;
 document.querySelector('#reset-message').textContent=resetMessage(count);
 return new Promise(resolve=>{
   resetDialog.returnValue='cancel';
   document.querySelector('#keep-reviewing').onclick=()=>resetDialog.close('cancel');
   document.querySelector('#confirm-reset').onclick=()=>resetDialog.close('confirm');
   resetDialog.addEventListener('close',()=>resolve(resetDialog.returnValue==='confirm'),{once:true});
   resetDialog.showModal(); document.querySelector('#keep-reviewing').focus();
 });
}
window.addEventListener('beforeunload',event=>{if(triage.decisionCount()) {event.preventDefault(); event.returnValue='';}});
function updateApplicationSummary() {
  const ready = manifestFile || detailsReady();
  document.querySelector('#details-readiness').textContent = manifestFile ? `Spreadsheet ready · ${manifestApplications?.size || 0} applications` : ready ? 'Application details ready' : 'Application details needed';
  editDetails.hidden=!!manifestFile; editDetails.textContent=ready?'Edit application details':'Add application details';
  document.querySelector('#intake-guidance').textContent = !selected.length ? 'Add images to begin.' : ready ? 'Ready to review.' : 'Choose Review labels to enter the application details.';
  appSummary.textContent = manifestFile ? `${manifestFile.name} · ${manifestApplications?.size || 0} rows` : form.elements.namedItem('brand').value.trim() || 'No application details yet';
}
function closeApplication() {restoreDetails(); applicationDialog.close(); updateApplicationSummary(); runButton.focus();}
document.querySelector('#close-application').addEventListener('click', closeApplication);
document.querySelector('#save-application').addEventListener('click', async () => {
 try {validateApplication(applicationValues());} catch(error) {const message=document.querySelector('#application-error'); message.textContent=error.message; message.hidden=false; return;}
 const changed=JSON.stringify(applicationValues())!==JSON.stringify(detailsSnapshot);
 if(changed && !await allowReset()) return;
 if(changed) clearResults();
 detailsSnapshot=null; applicationDialog.close(); updateApplicationSummary();
 if(runAfterDetails) form.requestSubmit(); else runButton.focus();
});
function setBusy(busy) {
  inputs.disabled = busy;
  editDetails.disabled=busy;
  fileInput.disabled = busy;
  removeManifest.disabled = busy;
  clearFiles.disabled = busy;
  sampleButton.disabled = busy;
  runButton.disabled = busy || !filesValid;
  dropZone.classList.toggle('disabled',busy);
}
let selected = [];
let workerPromise = null;
let active = false;
let stopRequested = false;
let progressLabel = "";
let previewUrls = [];

function setStatus(message, kind = "") {
  status.hidden = kind === 'busy' || kind === 'done' || /^(Finished|Stopped):/.test(message);
  status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  status.className = `status ${kind}`;
  status.textContent = message;
}

function clearResults() {
  triage.clear();
  triage.queue(filesValid ? selected.length : 0);
  status.hidden = true;
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
}

function showFiles() {
  filesValid = false;
  try {if(selected.length) {validateFiles(selected); if(manifestApplications) buildJobs(selected,{},manifestApplications); filesValid = !uploadError;}} catch(error) {setStatus(error.message.replaceAll('CSV','spreadsheet'),'error');}
  runButton.disabled = active || uploadBusy || !filesValid;
  manifestSummary.textContent = manifestFile ? `${manifestFile.name} · ${manifestApplications.size} rows${selected.length ? "" : ". Add the matching label images."}` : "";
  removeManifest.hidden = !manifestFile;
  clearFiles.hidden = !selected.length && !manifestFile && !uploadError;
  triage.queue(filesValid ? selected.length : 0);
  const size = selected.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
  fileList.textContent = selected.length
    ? `${selected.length} image(s), ${size.toFixed(1)} MB: ${selected
        .slice(0, 5)
        .map((file) => file.name)
        .join(", ")}${selected.length > 5 ? "…" : ""}`
    : "";
}

async function addUploads(files) {
  if (active || uploadBusy || !files.length) return;
  if (!await allowReset()) {fileInput.value=""; return;}
  uploadBusy = true; setBusy(true); clearResults();
  try {
    const incoming = classifyUploads(files);
    const applications = incoming.spreadsheet ? await readSpreadsheet(incoming.spreadsheet) : manifestApplications;
    const images = mergeImages(selected,incoming.images);
    selected = images;
    if (incoming.spreadsheet) {manifestFile = incoming.spreadsheet; manifestApplications = applications;}
    uploadError = false;
  } catch(error) {
    uploadError = true;
    setStatus(error.message,'error');
  } finally {
    uploadBusy = false;
    showFiles(); updateApplicationSummary(); setBusy(false);
    fileInput.value = '';
  }
}
fileInput.addEventListener('change', () => addUploads([...fileInput.files]));
removeManifest.addEventListener('click', async () => {
  if(active || uploadBusy || !await allowReset()) return;
  manifestFile = null; manifestApplications = null; uploadError = false;
  clearResults(); showFiles(); updateApplicationSummary();
});
clearFiles.addEventListener('click', async () => {
  if(active || uploadBusy || !await allowReset()) return;
  selected = []; manifestFile = null; manifestApplications = null; uploadError = false;
  clearResults(); showFiles(); updateApplicationSummary();
});

for (const event of ["dragenter", "dragover"]) {
  dropZone.addEventListener(event, (e) => {
    e.preventDefault();
    if (!active) dropZone.classList.add("dragging");
  });
}
for (const event of ["dragleave", "drop"]) {
  dropZone.addEventListener(event, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
  });
}
dropZone.addEventListener("drop", (event) => {
  if (active || sampleButton.disabled) return;
  addUploads([...event.dataTransfer.files]);
});
stopButton.addEventListener("click", () => {
  stopRequested = true;
  stopButton.disabled = true;
  stopButton.textContent = "Stopping after the current label…";
});

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      workerPath: `${location.origin}/ocr/worker.min.js`,
      corePath: `${location.origin}/ocr`,
      langPath: `${location.origin}/ocr`,
      logger: (message) => {
        if (active && message.status === "recognizing text")
          setStatus(
            `${progressLabel}: ${Math.round(message.progress * 100)}%`,
            "busy",
          );
      },
    })
      .then(async (worker) => {
        // Sparse-text segmentation retains large brand headings alongside small warning text.
        await worker.setParameters({ tessedit_pageseg_mode: "11" });
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        setStatus("OCR setup failed. Review labels will retry.", "error");
        throw error;
      });
  }
  return workerPromise;
}

// Start the same-origin model download while the reviewer enters application data.
getWorker().catch(() => {});

function renderResult(file, text, findings, seconds, confidence) {
  const imageUrl = URL.createObjectURL(file);
  previewUrls.push(imageUrl);
  return triage.add({name:file.name, text, findings, seconds, confidence, imageUrl});
}

async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new Error(
        "Image exceeds 40 megapixels. Export a smaller label image.",
      );
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

sampleButton.addEventListener("click", async () => {
  if(active || uploadBusy || !await allowReset()) return;
  setBusy(true);
  try {
    const response = await fetch("/samples/old-tom.png");
    if (!response.ok) throw new Error("Sample label could not load.");
    selected = [
      new File([await response.blob()], "old-tom.png", { type: "image/png" }),
    ];
    form.reset();
    manifestFile = null; manifestApplications = null; uploadError = false;
    const example = {
      brand: "OLD TOM DISTILLERY",
      type: "Kentucky Straight Bourbon Whiskey",
      abv: "45",
      volume: "750 mL",
      producer: "Old Tom Distillery, Bardstown, KY",
    };
    for (const [key, value] of Object.entries(example))
      form.elements.namedItem(key).value = value;
    clearResults();
    showFiles();
    updateApplicationSummary();
    setStatus(
      "Sample artwork and application loaded. Select Review labels to run OCR.",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (active || uploadBusy || !filesValid) return;
  if (!manifestApplications && !detailsReady()) {openApplication(true); return;}
  if (!await allowReset()) return;
  const clickedAt = performance.now();
  active = true;
  stopRequested = false;
  const application = Object.fromEntries(new FormData(form).entries());
  application.imported = form.elements.namedItem("imported").checked;
  const files = [...selected];
  const applications = manifestApplications;
  setBusy(true);
  clearResults();
  let completed = 0,
    failed = 0,
    firstResultSeconds = null;
  try {
    validateFiles(files);

    const jobs = buildJobs(files, application, applications);
    updateApplicationSummary();
    applicationDialog.close();
    triage.start(jobs.length, clickedAt);
    status.removeAttribute('role'); status.setAttribute('aria-live','off');
    results.scrollIntoView({block:'start'});
    stopButton.hidden = false;
    stopButton.disabled = false;
    stopButton.textContent = "Stop after current label";
    setStatus("Preparing to read the labels…", "busy");
    const worker = await getWorker();
    const setupMs = performance.now() - clickedAt;
    for (const [index, job] of jobs.entries()) {
      if (stopRequested) break;
      const { file, application: expected } = job;
      triage.stage(1);
      progressLabel = `Reading ${index + 1} of ${jobs.length}: ${file.name}`;
      setStatus(progressLabel, "busy");
      const started = performance.now();
      const timings = { setup: setupMs };
      const visibility = document.visibilityState;
      let resultCard;
      try {
        const canvas = await timeStage(timings, "prepare", () => prepareImage(file));
        const { data } = await timeStage(timings, "ocr", () => worker.recognize(canvas, {}, { text: true, blocks: true }));
        triage.progress(1);
        const comparisonStarted = performance.now();
        const layout = readLayout(data.blocks);
        const text = comparisonText(data, layout);
        const findings = reviewLabel(text, expected, layout.lines.length ? layout : null);
        timings.comparison = performance.now() - comparisonStarted;
        setStatus(`Checking warning appearance: ${file.name}`, "busy");
        findings[findings.findIndex(item => item.field === "Warning appearance")] = await timeStage(timings, "appearance", () => reviewAppearance(canvas, data.blocks));
        triage.progress(2);
        const appearance = findings.find(item => item.field === "Warning appearance");
        const renderStarted = performance.now();
        resultCard = renderResult(
          file,
          text,
          findings,
          (performance.now() - started) / 1000,
          data.confidence,
        );
        timings.render = performance.now() - renderStarted;
        resultCard.dataset.appearance = JSON.stringify({status:appearance.status,reason:appearance.reason || "uncertain",ratio:appearance.ratio ?? null});
        resultCard.dataset.findings = JSON.stringify(findings.map(item => ({field:item.field,status:item.status})));
        completed++;
        firstResultSeconds ??= (performance.now() - clickedAt) / 1000;
      } catch (error) {
        failed++;
        resultCard = triage.add({name:file.name, findings:[], error:`Could not read this image: ${error.message || String(error)}. Try a clear, valid image.`});
        resultCard.dataset.appearance = JSON.stringify({status:"failed",reason:"processing"});
      } finally {
        if (resultCard) resultCard.dataset.timings = JSON.stringify({...finishTiming(timings,clickedAt,started,performance.now()),visibility,visibilityEnd:document.visibilityState});
      }
    }
    const total = (performance.now() - clickedAt) / 1000;
    triage.finish(stopRequested,total,firstResultSeconds);
    const timing =
      firstResultSeconds === null
        ? ""
        : ` First result: ${firstResultSeconds.toFixed(1)} s from click.`;
    setStatus(
      `${stopRequested ? "Stopped" : "Finished"}: ${completed} reviewed, ${failed} failed, ${files.length - completed - failed} remaining. Total: ${total.toFixed(1)} s.${timing} Inspect exceptions and make your final decision.`,
      failed ? "error" : "done",
    );
  } catch (error) {
    if (!results.hidden) triage.finish(stopRequested,(performance.now()-clickedAt)/1000,firstResultSeconds);
    setStatus(error.message || String(error), "error");
    if (applicationDialog.open) {
      const message = document.querySelector('#application-error');
      message.textContent = error.message || String(error);
      message.hidden = false;
    }
  } finally {
    active = false;
    setBusy(false);
    stopButton.hidden = true;
  }
});

updateApplicationSummary();
