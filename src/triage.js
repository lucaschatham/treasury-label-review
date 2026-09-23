import { REQUIRED_WARNING } from './review.js';
import { pileOf, tallies, transition } from './piles.js';
const piles = {passed:['Passed','✓'], failed:['Failed','✕'], review:['Needs review','?']};
const reasons = ['Wrong value', 'Missing information', 'Unreadable label', 'Warning issue', 'Other'];
function el(parent, tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  parent.append(node);
  return node;
}
export function createTriage(root) {
  let rows = [], selected = 'review', query = '', stages = [0,0,0,0], total = 0;
  const north = el(root, 'div', '', 'north-star');
  north.setAttribute('role','status');
  const number = el(north, 'strong', '0');
  el(north, 'h2', 'labels still need a person');
  const secondary = el(north, 'p');
  const map = el(root, 'div', '', 'pile-map');
  const large = el(map, 'div', '', 'pile-buttons');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pile-wires'); svg.setAttribute('aria-hidden','true'); map.append(svg);
  const flow = el(map, 'div', '', 'triage-flow');
  const meters = [], small = [];
  ['Drop labels','Read the words','Compare to form','Sort into piles'].forEach((name, i) => {
    const step = el(flow, 'div', '', 'flow-step');
    el(step, 'strong', `${i + 1} ${name}${i < 3 ? ' →' : ''}`);
    const count = el(step, 'span');
    const meter = el(step, 'progress'); meter.max = 1; meter.value = 0;
    meter.setAttribute('aria-label', name);
    meters.push({count,meter});
    if (i === 3) small.push(el(step, 'div', '', 'pile-buttons small-piles'));
  });
  const buttons = [];
  function pileButton(parent, key, size) {
    const button = el(parent, 'button', '', `pile-button ${key} ${size}`);
    button.type = 'button'; button.dataset.pile = key;
    button.addEventListener('click', () => { selected = key; query = ''; search.value = ''; render(); });
    buttons.push(button);
  }
  for (const key of Object.keys(piles)) { pileButton(large,key,'large'); pileButton(small[0],key,'small'); }
  const list = el(root, 'section', '', 'pile-list review');
  const heading = el(list, 'h3'); heading.tabIndex = -1;
  const searchLabel = el(list,'label','Search this pile');
  const search = el(searchLabel,'input'); search.type = 'search';
  search.addEventListener('input', () => { query = search.value.toLowerCase(); renderRows(); });
  const bulk = el(list,'button','', 'secondary'); bulk.type = 'button';
  const rowList = el(list,'div');
  const dialog = el(document.body,'dialog','', 'decision-dialog');
  dialog.setAttribute('aria-label','Label decision');
  let returnFocus;
  dialog.addEventListener('close', () => {
    if (returnFocus?.isConnected && !returnFocus.hidden) returnFocus.focus();
    else heading.focus();
  });
  function act(row, action, details) {
    const index = rows.indexOf(row);
    rows[index] = {...transition(row,action,details), node:row.node};
  }
  function decision(targets, isBulk = false) {
    returnFocus = document.activeElement;
    if (!isBulk) { act(targets[0], 'seen'); targets = [rows.find(row => row.node === targets[0].node)]; render(); }
    dialog.replaceChildren();
    const close = el(dialog,'button','Close','secondary'); close.onclick = () => dialog.close();
    el(dialog,'h2',isBulk ? `${selected === 'passed' ? 'Approve' : 'Send back'} all ${targets.length}` : targets[0].name);
    const row = targets[0];
    if (!isBulk) {
      const finding = row.findings.find(f => f.status === 'mismatch') || row.findings.find(f => f.status === 'review') || row.findings[0];
      el(dialog,'p',row.error || (row.confidence < 70 ? 'Low OCR confidence. Inspect every value.' : finding?.detail) || 'All machine checks passed. Inspect the evidence before deciding.');
      const crop = finding?.crop;
      el(dialog,'h3',crop ? 'Evidence crop' : 'Label artwork');
      if (crop || row.imageUrl) { const image = el(dialog,'img'); image.src = crop || row.imageUrl; image.alt = crop ? 'Analyzed warning heading crop' : `Original artwork for ${row.name}`; }
      else el(dialog,'p','Evidence image unavailable. Request a readable label.');
      const comparison = el(dialog,'div','', 'comparison');
      for (const [label,value] of [['Label says',finding?.found || row.text || 'No text extracted'],['Form says',finding?.expected || 'See all checks for application values']]) {
        const column = el(comparison,'div'); el(column,'strong',label); el(column,'p',value);
      }
      const checks = el(dialog,'details'); el(checks,'summary','See all checks');
      for (const f of row.findings) {
        const check = el(checks,'div','', 'finding');
        el(check,'strong',`${f.field}: ${f.status}`); el(check,'p',`Label says: ${f.found || 'Unavailable'}`);
        if (f.expected) el(check,'p',`Form says: ${f.expected}`);
        el(check,'small',f.detail || '');
      }
      el(checks,'h3','Required warning'); el(checks,'p',REQUIRED_WARNING);
      el(checks,'h3','Extracted text'); el(checks,'p',row.text || 'No text extracted.');
      if (row.imageUrl) { const link = el(checks,'a','Open original label artwork'); link.href = row.imageUrl; link.target = '_blank'; link.rel = 'noopener'; }
      if (row.seconds != null) el(checks,'p',`${row.seconds.toFixed(1)} s to review · OCR confidence ${Math.round(row.confidence)}%`);
    }
    const noteLabel = el(dialog,'label','Note');
    const note = el(noteLabel,'textarea'); note.value = isBulk ? '' : row.human?.note || '';
    const chips = el(dialog,'fieldset','', 'reason-chips'); el(chips,'legend','Reason (required to send back)');
    let reason = '';
    for (const value of reasons) {
      const label = el(chips,'label'); const radio = el(label,'input'); radio.type = 'radio'; radio.name = 'reason'; radio.value = value;
      label.append(document.createTextNode(value)); radio.onchange = () => {reason = value; send.disabled = false;};
    }
    const actions = el(dialog,'div','', 'decision-actions');
    function action(label, kind) {
      const button = el(actions,'button',label); button.type = 'button';
      button.onclick = () => { targets.forEach(target => act(target,kind,{reason,note:note.value})); render(); dialog.close(); };
      return button;
    }
    if (!isBulk || selected === 'passed') action(isBulk ? `Approve all ${targets.length}` : 'Approve','approve');
    const send = (!isBulk || selected === 'failed') ? action(isBulk ? `Send back all ${targets.length}` : 'Send back','send-back') : {disabled:true};
    send.disabled = true;
    if (!isBulk) action('Later','later');
    dialog.showModal();
  }
  bulk.onclick = () => decision(rows.filter(row => pileOf(row) === selected && !['Approved','Sent back'].includes(row.human?.status)), true);
  function renderRows() {
    const inPile = rows.filter(row => pileOf(row) === selected);
    heading.textContent = `${piles[selected][0]} · ${inPile.length}`;
    list.className = `pile-list ${selected}`;
    const undecided = inPile.filter(row => !['Approved','Sent back'].includes(row.human?.status));
    bulk.hidden = selected === 'review' || undecided.length === 0;
    bulk.textContent = `${selected === 'passed' ? 'Approve' : 'Send back'} all ${undecided.length}`;
    // Keep every result node mounted so timing/appearance instrumentation remains available.
    for (const row of rows) {
      const visible = pileOf(row) === selected && `${row.name} ${row.human?.status || 'New'}`.toLowerCase().includes(query);
      row.node.hidden = !visible;
      row.node.textContent = `${row.name} · ${row.human?.status || 'New'}${['Approved','Sent back'].includes(row.human?.status) ? ' · 👤 Person' : ''}`;
    }
    rowList.querySelector('.empty-pile')?.remove();
    if (!rows.some(row => !row.node.hidden)) el(rowList,'p',query ? 'No matching labels.' : 'No labels in this pile.', 'empty-pile');
  }
  function wires() {
    const bounds = map.getBoundingClientRect();
    svg.setAttribute('width',bounds.width); svg.setAttribute('height',bounds.height); svg.replaceChildren();
    for (const key of Object.keys(piles)) {
      const a = buttons.find(b => b.dataset.pile === key && b.classList.contains('small')).getBoundingClientRect();
      const b = buttons.find(b => b.dataset.pile === key && b.classList.contains('large')).getBoundingClientRect();
      const x1 = a.x+a.width/2-bounds.x, y1 = a.y-bounds.y, x2 = b.x+b.width/2-bounds.x, y2 = b.bottom-bounds.y;
      const path = document.createElementNS(svg.namespaceURI,'path');
      path.setAttribute('d',`M${x1},${y1} C${x1},${y2+20} ${x2},${y1-20} ${x2},${y2}`);
      path.setAttribute('class',key); svg.append(path);
    }
  }
  function render() {
    const counts = tallies(rows); number.textContent = counts.review;
    secondary.textContent = `${counts.machine} sorted by machine · ${counts.human} by you`;
    for (const button of buttons) { const key = button.dataset.pile; button.textContent = `${piles[key][1]} ${piles[key][0]} ${counts[key]}`; button.setAttribute('aria-pressed',String(selected === key)); }
    meters.forEach(({count,meter},i) => {count.textContent = `${stages[i]} / ${total}`; meter.max = total || 1; meter.value = stages[i];});
    renderRows(); requestAnimationFrame(wires);
  }
  new ResizeObserver(wires).observe(map);
  render();
  return {
    clear() { dialog.close(); rows = []; selected = 'review'; query = ''; search.value = ''; stages = [0,0,0,0]; total = 0; rowList.replaceChildren(); render(); },
    start(count) {total = count; stages = [count,0,0,0]; render();},
    progress(stage) {stages[stage]++; render();},
    add(record) {
      const node = el(rowList,'button','', 'result-card triage-row'); node.type = 'button';
      const row = {...record, node}; rows.push(row);
      node.onclick = () => decision([rows.find(item => item.node === node)]);
      stages[3]++; render(); return node;
    },
  };
}
