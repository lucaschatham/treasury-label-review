import { reviewAppearance } from "./appearance.js";
import { readLayout, comparisonText } from "./layout.js";
import { createWorker } from "tesseract.js";
import { reviewSummary } from "./summary.js";
import { reviewLabel, REQUIRED_WARNING } from "./review.js";
import { validateFiles, parseManifest, buildJobs } from "./batch.js";

const form = document.querySelector("#review-form");
const inputs = document.querySelector("#inputs");
const fileInput = document.querySelector("#images");
const manifestInput = document.querySelector("#manifest");
const fileList = document.querySelector("#file-list");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const sampleButton = document.querySelector("#sample-button");
const stopButton = document.querySelector("#stop-button");
const engineStatus = document.querySelector("#engine-status");
const dropZone = document.querySelector("#drop-zone");
let selected = [];
let workerPromise = null;
let active = false;
let stopRequested = false;
let progressLabel = "";
let previewUrls = [];

function setStatus(message, kind = "") {
  status.className = `status ${kind}`;
  status.textContent = message;
}

function addText(parent, tag, value, className = "") {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function clearResults() {
  results.replaceChildren();
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
  if (confidence < 70)
    findings.push({
      field: "Image legibility",
      status: "review",
      found: "Low OCR confidence",
      detail:
        "Compare every extracted value with the artwork or request a clearer image.",
    });
  const card = addText(results, "article", "", "result-card");
  const head = addText(card, "div", "", "result-head");
  addText(head, "h3", file.name);
  addText(head, "span", `${seconds.toFixed(1)} s to review`, "time");
  const summary = addText(card, "p", "", "summary attention");
  const updateSummary = () => {
    const { pending: count } = reviewSummary(findings);
    summary.textContent = count
      ? `${count} check${count === 1 ? " needs" : "s need"} attention`
      : "Checks complete. Ready for your final decision.";
    summary.className = `summary ${count ? "attention" : "clear"}`;
  };
  updateSummary();
  if (confidence < 70)
    addText(
      card,
      "p",
      "Low OCR confidence. Inspect all values on the original artwork, including those marked Match.",
      "status error",
    );
  const artwork = addText(card, "details", "", "artwork");
  addText(artwork, "summary", "View original label artwork");
  const imageUrl = URL.createObjectURL(file);
  previewUrls.push(imageUrl);
  const link = addText(artwork, "a", "");
  link.href = imageUrl;
  link.target = "_blank";
  link.rel = "noopener";
  const image = addText(link, "img", "");
  image.src = imageUrl;
  image.loading = "lazy";
  image.alt = `Original label: ${file.name}. Open at full size.`;
  addText(artwork, "small", "Select the image to open it at full size.");

  for (const finding of findings) {
    const row = addText(card, "div", "", "finding");
    const upper = addText(row, "div", "", "finding-upper");
    addText(upper, "strong", finding.field);
    const badge = addText(
      upper,
      "span",
      finding.status === "skip" ? "N/A" : finding.status.toUpperCase(),
      `badge ${finding.status}`,
    );
    if (finding.expected && finding.field !== "Government warning")
      addText(row, "small", `Application: ${finding.expected}`, "expected");
    const found = addText(row, "span", finding.found, "found");
    addText(row, "small", finding.detail);
    if (finding.crop) {
      const cropDetails = addText(row, "details", "");
      addText(cropDetails, "summary", "Inspect analyzed heading crop");
      const cropImage = addText(cropDetails, "img", "");
      cropImage.src = finding.crop;
      cropImage.alt = "Warning heading sent for automated weight verification";
      cropImage.style.maxWidth = "100%";
    }
    if (finding.field === "Warning appearance") {
      const label = addText(row, "label", "", "check-label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      label.append(
        checkbox,
        document.createTextNode(
          "I checked the original artwork and confirm the warning appearance.",
        ),
      );
      checkbox.addEventListener("change", () => {
        // Human observations are useful, but cannot establish automated compliance.
        finding.humanConfirmed = checkbox.checked;
        found.textContent = checkbox.checked
          ? `${finding.found}. Reviewer also confirmed appearance; automated status is unchanged.`
          : finding.found;
        updateSummary();
      });
    }
  }
  const disclosure = addText(card, "details", "");
  addText(
    disclosure,
    "summary",
    "Inspect extracted text and reference warning",
  );
  addText(disclosure, "h4", "Extracted from this image");
  addText(disclosure, "pre", text || "No text extracted. Try a clearer image.");
  addText(disclosure, "h4", "Required warning");
  addText(disclosure, "p", REQUIRED_WARNING, "reference-warning");
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
    const appearanceCache = new Map();
    stopButton.hidden = false;
    stopButton.disabled = false;
    stopButton.textContent = "Stop after current label";
    setStatus("Preparing to read the labels…", "busy");
    const worker = await getWorker();
    for (const [index, job] of jobs.entries()) {
      if (stopRequested) break;
      const { file, application: expected } = job;
      progressLabel = `Reading ${index + 1} of ${jobs.length}: ${file.name}`;
      setStatus(progressLabel, "busy");
      const started = performance.now();
      try {
        const canvas = await prepareImage(file);
        const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
        const layout = readLayout(data.blocks);
        const text = comparisonText(data, layout);
        const findings = reviewLabel(text, expected, layout.lines.length ? layout : null);
        setStatus(`Checking warning appearance: ${file.name}`, "busy");
        findings[findings.findIndex(item => item.field === "Warning appearance")] = await reviewAppearance(canvas, data.blocks, appearanceCache);
        renderResult(
          file,
          text,
          findings,
          (performance.now() - started) / 1000,
          data.confidence,
        );
        completed++;
        firstResultSeconds ??= (performance.now() - clickedAt) / 1000;
      } catch (error) {
        failed++;
        const card = addText(results, "article", "", "result-card");
        addText(card, "h3", file.name);
        addText(
          card,
          "p",
          `Could not read this image: ${error.message || String(error)}. Try a clear, valid image.`,
          "summary attention",
        );
      }
    }
    const total = (performance.now() - clickedAt) / 1000;
    const timing =
      firstResultSeconds === null
        ? ""
        : ` First result: ${firstResultSeconds.toFixed(1)} s from click.`;
    setStatus(
      `${stopRequested ? "Stopped" : "Finished"}: ${completed} reviewed, ${failed} failed, ${files.length - completed - failed} remaining. Total: ${total.toFixed(1)} s.${timing} Inspect exceptions and make your final decision.`,
      failed ? "error" : "done",
    );
  } catch (error) {
    setStatus(error.message || String(error), "error");
  } finally {
    active = false;
    inputs.disabled = false;
    stopButton.hidden = true;
  }
});
