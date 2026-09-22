import { createWorker } from 'tesseract.js';
import { reviewLabel } from './review.js';

const form = document.querySelector('#review-form');
const fileInput = document.querySelector('#images');
const fileList = document.querySelector('#file-list');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const button = document.querySelector('#run-button');
const dropZone = document.querySelector('#drop-zone');
let droppedFiles = null;

function selectedFiles() { return droppedFiles || [...fileInput.files]; }
function showFiles() { fileList.textContent = selectedFiles().map(file => file.name).join(' · '); }
fileInput.addEventListener('change', () => { droppedFiles = null; showFiles(); });
for (const event of ['dragenter', 'dragover']) dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', e => { droppedFiles = [...e.dataTransfer.files]; showFiles(); });

function setStatus(message, kind = '') { status.className = `status ${kind}`; status.textContent = message; }
function addText(parent, tag, value, className = '') { const el = document.createElement(tag); el.textContent = value; if (className) el.className = className; parent.append(el); return el; }

function renderResult(file, text, findings, seconds) {
  const card = document.createElement('article'); card.className = 'result-card';
  const head = addText(card, 'div', '', 'result-head');
  addText(head, 'h3', file.name);
  addText(head, 'span', `${seconds.toFixed(1)} s`, 'time');
  const issues = findings.filter(item => item.status !== 'match').length;
  addText(card, 'p', issues ? `${issues} field${issues === 1 ? '' : 's'} need attention` : 'All checked text matched', issues ? 'summary attention' : 'summary clear');
  for (const finding of findings) {
    const row = addText(card, 'div', '', 'finding');
    const upper = addText(row, 'div', '', 'finding-upper');
    addText(upper, 'strong', finding.field);
    addText(upper, 'span', finding.status === 'match' ? 'MATCH' : finding.status === 'mismatch' ? 'MISMATCH' : 'REVIEW', `badge ${finding.status}`);
    addText(row, 'span', finding.found, 'found');
    addText(row, 'small', finding.detail);
  }
  const disclosure = addText(card, 'details', '');
  addText(disclosure, 'summary', 'Inspect extracted text');
  addText(disclosure, 'pre', text || 'No text extracted. Try a clearer image.');
  results.append(card);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const files = selectedFiles();
  if (!files.length) { setStatus('Choose at least one label image.', 'error'); return; }
  if (files.length > 10 || files.some(file => file.size > 10 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
    setStatus('Use up to 10 PNG, JPEG, or WebP images, each under 10 MB.', 'error'); return;
  }
  const application = Object.fromEntries(new FormData(form).entries());
  results.replaceChildren(); button.disabled = true;
  setStatus('Loading local OCR engine…', 'busy');
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      workerPath: `${location.origin}/ocr/worker.min.js`,
      corePath: `${location.origin}/ocr`,
      langPath: `${location.origin}/ocr`,
      logger: message => { if (message.status === 'recognizing text') setStatus(`Reading label… ${Math.round(message.progress * 100)}%`, 'busy'); }
    });
    for (const [index, file] of files.entries()) {
      setStatus(`Reading image ${index + 1} of ${files.length}: ${file.name}`, 'busy');
      const started = performance.now();
      try {
        const { data } = await worker.recognize(file);
        renderResult(file, data.text, reviewLabel(data.text, application), (performance.now() - started) / 1000);
      } catch (error) {
        const card = addText(results, 'article', '', 'result-card');
        addText(card, 'h3', file.name);
        addText(card, 'p', `Could not read this image: ${error.message}`, 'summary attention');
      }
    }
    setStatus(`Finished ${files.length} label${files.length === 1 ? '' : 's'}. Review every exception and the original artwork.`, 'done');
  } catch (error) {
    setStatus(`OCR could not start: ${error.message}. Reload and try again.`, 'error');
  } finally {
    if (worker) await worker.terminate();
    button.disabled = false;
  }
});
