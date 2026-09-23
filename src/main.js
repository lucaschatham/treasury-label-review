import { timeStage, finishTiming } from './timing.js';
import { reviewAppearance } from "./appearance.js";
import { readLayout, comparisonText } from "./layout.js";
import { createWorker } from "tesseract.js";
import { createTriage } from "./triage.js";
import { reviewLabel } from "./review.js";
import { validateFiles, parseManifest, buildJobs } from "./batch.js";

const form = document.querySelector("#review-form");
const inputs = document.querySelector("#inputs");
const fileInput = document.querySelector("#images");
const manifestInput = document.querySelector("#manifest");
const fileList = document.querySelector("#file-list");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const triage = createTriage(results);
const sampleButton = document.querySelector("#sample-button");
const stopButton = document.querySelector("#stop-button");
results.before(stopButton);
const engineStatus = document.querySelector("#engine-status");
const dropZone = document.querySelector("#drop-zone");
const inputPanel = document.querySelector('.input-panel');
const appSummary = document.querySelector('#application-summary');
const editApplication = document.querySelector('#edit-application');
function collapseApplication(collapsed) {
  document.body.classList.toggle('reviewing', collapsed);
  inputPanel.classList.toggle('collapsed', collapsed);
  appSummary.hidden = !collapsed;
}
editApplication.addEventListener('click', () => {collapseApplication(false); form.elements.namedItem('brand').focus();});
let selected = [];
let workerPromise = null;
let active = false;
let stopRequested = false;
let progressLabel = "";
let previewUrls = [];

function setStatus(message, kind = "") {
  status.hidden = !results.hidden && (kind !== 'error' || /^(Finished|Stopped):/.test(message));
  status.className = `status ${kind}`;
  status.textContent = message;
}

function clearResults() {
  triage.clear();
  collapseApplication(false);
  status.hidden = false; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  previewUrls.forEach((url) => URL.revokeObjectURL(url));
  previewUrls = [];
}

function invalidateResults() {
  if (active) return;
  clearResults();
  setStatus(
    "Details changed. Run a review to compare the current application and images.",
  );
}

function showFiles() {
  const size = selected.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
  fileList.textContent = selected.length
    ? `${selected.length} image(s), ${size.toFixed(1)} MB: ${selected
        .slice(0, 5)
        .map((file) => file.name)
        .join(", ")}${selected.length > 5 ? "…" : ""}`
    : "";
}

fileInput.addEventListener("change", () => {
  selected = [...fileInput.files];
  showFiles();
});
form.addEventListener("input", invalidateResults);
form.addEventListener("change", invalidateResults);
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
  if (active) return;
  selected = [...event.dataTransfer.files];
  fileInput.value = "";
  showFiles();
  invalidateResults();
});
stopButton.addEventListener("click", () => {
  stopRequested = true;
  stopButton.disabled = true;
  stopButton.textContent = "Stopping after the current label…";
});

function getWorker() {
  if (!workerPromise) {
    engineStatus.textContent = "Preparing local OCR…";
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
        engineStatus.textContent =
          "Local OCR ready. Warning heading crops use cloud verification.";
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        engineStatus.textContent =
          "OCR setup failed. Review labels will retry.";
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
  inputs.disabled = true;
  try {
    const response = await fetch("/samples/old-tom.png");
    if (!response.ok) throw new Error("Sample label could not load.");
    selected = [
      new File([await response.blob()], "old-tom.png", { type: "image/png" }),
    ];
    form.reset();
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
    setStatus(
      "Sample artwork and application loaded. Select Review labels to run OCR.",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    inputs.disabled = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (active) return;
  const clickedAt = performance.now();
  active = true;
  stopRequested = false;
  const application = Object.fromEntries(new FormData(form).entries());
  application.imported = form.elements.namedItem("imported").checked;
  const files = [...selected];
  const manifest = manifestInput.files[0];
  inputs.disabled = true;
  clearResults();
  let completed = 0,
    failed = 0,
    firstResultSeconds = null;
  try {
    validateFiles(files);
    if (manifest && manifest.size > 1024 * 1024)
      throw new Error("Application CSV must be under 1 MB.");
    const applications = manifest ? parseManifest(await manifest.text()) : null;
    const jobs = buildJobs(files, application, applications);
    appSummary.querySelector('span').textContent = `${manifest ? 'CSV applications' : application.brand || 'Application'} · ${jobs.length} image${jobs.length === 1 ? '' : 's'}`;
    collapseApplication(true);
    triage.start(jobs.length);
    status.removeAttribute('role'); status.setAttribute('aria-live','off');
    inputPanel.scrollIntoView({block:'start'});
    const appearanceCache = new Map();
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
        findings[findings.findIndex(item => item.field === "Warning appearance")] = await timeStage(timings, "appearance", () => reviewAppearance(canvas, data.blocks, appearanceCache));
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
        resultCard.dataset.appearance = JSON.stringify({status:appearance.status,reason:appearance.reason || "corroborated",cached:!!appearance.cached});
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
  } finally {
    active = false;
    inputs.disabled = false;
    stopButton.hidden = true;
  }
});
