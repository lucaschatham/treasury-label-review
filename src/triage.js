import { REQUIRED_WARNING } from './review.js';
import { pileOf, tallies, transition, rowStatus, rowReason, primaryFinding, reasonChoices } from './piles.js';
const piles = {passed:['Passed','✓'], failed:['Failed','✕'], review:['Needs review','?']};
function el(parent, tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  parent.append(node);
  return node;
}
export function createTriage(root) {
  let rows = [], selected = 'review', query = '', stages = [0,0,0,0], total = 0, finishSeconds = null, firstSeconds = null, stopped = false, running = false, activeStage = -1, limit = 50;
  root.hidden = true;
  const north = el(root, 'div', '', 'north-star');
  const announcements = el(root,'p','','sr-only'); announcements.setAttribute('role','status');
  let announceTimer;
  function announce(message) { clearTimeout(announceTimer); announceTimer = setTimeout(() => {announcements.textContent = message;}, 1000); }
  const number = el(north, 'strong', '0');
  const caption = el(north, 'h2', 'labels need review');
  const secondary = el(north, 'p');
  const map = el(root, 'div', '', 'pile-map');
  const large = el(map, 'div', '', 'pile-buttons');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pile-wires'); svg.setAttribute('aria-hidden','true'); map.append(svg);
  const flow = el(map, 'div', '', 'triage-flow');
  const meters = [], small = [];
  ['Drop labels','Read the words','Compare to form','Sort into piles'].forEach((name, i) => {
    const step = el(flow, 'div', '', 'flow-step');
    el(step, 'strong', `${['↑','≡','⇄','▤'][i]} ${i + 1}. ${name}`);
    const count = el(step, 'span');
    const meter = el(step, 'progress'); meter.max = 1; meter.value = 0;
    meter.setAttribute('aria-label', name);
    meters.push({count,meter,step});
    if (i === 3) small.push(el(step, 'div', '', 'pile-buttons small-piles'));
  });
  const buttons = [];
  function pileButton(parent, key, size) {
    const button = el(parent, 'button', '', `pile-button ${key} ${size}`);
    button.type = 'button'; button.dataset.pile = key;
    button.addEventListener('click', () => { selected = key; query = ''; limit = 50; search.value = ''; render(); });
    el(button,'span',piles[key][1],'pile-symbol');
    el(button,'span',piles[key][0],'pile-name');
    el(button,'span','0','pile-count');
    el(button,'span','›','pile-chevron').setAttribute('aria-hidden','true');
    buttons.push(button);
  }
  for (const key of Object.keys(piles)) { pileButton(large,key,'large'); pileButton(small[0],key,'small'); }
  const list = el(root, 'section', '', 'pile-list review');
  const heading = el(list, 'h3'); heading.tabIndex = -1;
  const legend = el(list,'p','● New · ◐ Seen · ⏸ Later','list-legend');
  const tools = el(list,'div','','list-tools');
  const searchLabel = el(tools,'label','Search this pile');
  const search = el(searchLabel,'input'); search.type = 'search';
  search.addEventListener('input', () => { query = search.value.toLowerCase(); limit = 50; renderRows(); });
  const bulk = el(tools,'button','', 'secondary'); bulk.type = 'button';
  const rowList = el(list,'div');
  const more = el(list,'button','Show more','secondary'); more.onclick = () => {limit += 50; renderRows();};
  const footer = el(list,'p','','list-footer');
  const dialog = el(document.body,'dialog','', 'decision-dialog');
  dialog.setAttribute('aria-label','Label decision');
  let returnFocus;
  dialog.addEventListener('click', event => {if(event.target === dialog) {const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();}});
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
    const header = el(dialog,'div','','dialog-heading');
    el(header,'span',[...piles[isBulk ? selected : pileOf(targets[0])]].reverse().join(' '),`pile-chip ${isBulk ? selected : pileOf(targets[0])}`);
    const close = el(header,'button','✕','secondary'); close.setAttribute('aria-label','Close'); close.onclick = () => dialog.close();
    el(header,'h2',isBulk ? `${selected === 'passed' ? 'Approve' : 'Send back'} all ${targets.length}` : targets[0].name);
    header.append(close);
    const row = targets[0];
    if (!isBulk) {
      const finding = primaryFinding(row);
      el(dialog,'p',rowReason(row),'dialog-reason');
      const crop = finding?.crop;
      el(dialog,'h3',crop ? 'Evidence crop' : 'Label artwork');
      if (crop || row.imageUrl) { const link = el(dialog,'a'); link.href = row.imageUrl || crop; link.target = '_blank'; link.rel = 'noopener'; const image = el(link,'img'); image.src = crop || row.imageUrl; image.alt = crop ? 'Analyzed warning heading crop' : `Original artwork for ${row.name}`; }
      else el(dialog,'p','Evidence image unavailable. Request a readable label.');
      const comparison = el(dialog,'div','', 'comparison');
      for (const [label,value] of [['Label says',(finding?.field === 'Warning appearance' ? row.text?.match(/GOVERNMENT\s+WARNING:?/i)?.[0] : finding?.found) || 'See all checks'],['Form says',finding?.expected || (finding?.field === 'Warning appearance' ? 'Bold, uppercase GOVERNMENT WARNING heading' : 'See all checks for application values')]]) {
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
    if(isBulk) el(dialog,'p','This records you as the decider for these labels.');
    const noteLabel = el(dialog,'label','Note (optional)'); noteLabel.hidden = isBulk;
    const note = el(noteLabel,'input'); note.type = 'text'; note.value = isBulk ? '' : row.human?.note || '';
    if (!isBulk) {const checks = dialog.querySelector('details'); if(checks) dialog.insertBefore(noteLabel,checks);}
    const chips = el(dialog,'fieldset','', 'reason-chips'); chips.hidden = true;
    el(chips,'legend','Choose a reason to send back');
    const actions = el(dialog,'div','', 'decision-actions');
    function commit(kind, reason = '') {
      targets.forEach(target => act(target,kind,{reason,note:note.value})); render(); dialog.close();
    }
    function action(label, callback, className = '') {
      const button = el(actions,'button',label,className); button.type = 'button'; button.onclick = callback; return button;
    }
    const approve = (!isBulk || selected === 'passed') ? action(isBulk ? `Approve all ${targets.length}` : '✓ Approve', () => commit('approve'),'approve-action') : null;
    function showReasons() {chips.hidden = false; chips.querySelector('button')?.focus();}
    const send = (!isBulk || selected === 'failed') ? action(isBulk ? `Send back all ${targets.length}` : '✕ Send back…', showReasons,'send-action') : null;
    if (send) for (const value of reasonChoices(targets)) {
      const chip = el(chips,'button',value,'secondary'); chip.type = 'button'; chip.onclick = () => commit('send-back',value);
    }
    const later = !isBulk ? action('⏸ Later',() => commit('later'),'secondary') : null;
    if (!isBulk) for (const [button,key] of [[approve,'A'],[send,'S'],[later,'L']]) {if(button) {el(button,'kbd',key).setAttribute('aria-hidden','true'); button.setAttribute('aria-keyshortcuts',key);}}
    const cancel = isBulk ? action('Cancel',() => dialog.close(),'secondary') : null;
    dialog.onkeydown = event => {
      if (isBulk) return;
      if(event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input,textarea,[contenteditable]')) return;
      const button = {a:approve,s:send,l:later}[event.key.toLowerCase()];
      if(button) {event.preventDefault(); button.click();}
    };
    dialog.showModal();
    cancel?.focus();
  }
  bulk.onclick = () => decision(rows.filter(row => pileOf(row) === selected && !['Approved','Sent back'].includes(row.human?.status)), true);
  function renderRows() {
    const inPile = rows.filter(row => pileOf(row) === selected);
    heading.textContent = `${piles[selected][0]} · ${inPile.length}`;
    list.className = `pile-list ${selected}`;
    const undecided = inPile.filter(row => !['Approved','Sent back'].includes(row.human?.status));
    bulk.hidden = selected === 'review' || undecided.length === 0;
    bulk.textContent = `${selected === 'passed' ? 'Approve' : 'Send back'} all ${undecided.length}`;
    legend.textContent = selected === 'review' ? '● New · ◐ Seen · ⏸ Later' : 'Machine · 👤 You';
    const matches = inPile.filter(row => `${row.name} ${rowStatus(row)} ${rowReason(row)}`.toLowerCase().includes(query));
    const shown = selected === 'review' ? matches : matches.slice(0,limit);
    // Keep all result nodes mounted for timing/appearance instrumentation.
    for (const row of rows) {
      row.node.hidden = !shown.includes(row);
      const signature = `${rowStatus(row)}|${row.human?.reason || ''}`;
      if (row.node.dataset.presentation === signature) continue;
      row.node.dataset.presentation = signature;
      row.node.replaceChildren();
      const finding = primaryFinding(row);
      if (finding?.crop || row.imageUrl) {const thumb = el(row.node,'img'); thumb.src = finding?.crop || row.imageUrl; thumb.alt = ''; thumb.loading = 'lazy';}
      else el(row.node,'span','▤','row-thumbnail');
      const copy = el(row.node,'span','','row-copy'); el(copy,'strong',row.name); el(copy,'span',rowReason(row));
      el(row.node,'span',['Approved','Sent back'].includes(row.human?.status) ? '👤 You' : rowStatus(row),'row-status');
      el(row.node,'span','›','row-chevron').setAttribute('aria-hidden','true');
      row.node.classList.toggle('new-row',rowStatus(row) === 'New');
      row.node.setAttribute('aria-label',`Open ${row.name}`);
    }
    rowList.querySelector('.empty-pile')?.remove();
    if (!shown.length) el(rowList,'p',query ? 'No matching labels.' : selected === 'review' ? running ? 'Nothing needs review so far. Labels are still being checked.' : 'All done. Nothing is waiting on you.' : 'No labels in this pile.', 'empty-pile');
    more.hidden = shown.length === matches.length;
    footer.textContent = shown.length < matches.length ? `Showing ${shown.length} of ${matches.length}. Click a row to see its checks or change the decision.` : shown.length ? 'Click a row to decide.' : '';
  }

  function wires() {
    const bounds = map.getBoundingClientRect();
    svg.setAttribute('width',bounds.width); svg.setAttribute('height',bounds.height); svg.replaceChildren();
    for (const key of Object.keys(piles)) {
      const a = meters[3].step.getBoundingClientRect();
      const b = buttons.find(b => b.dataset.pile === key && b.classList.contains('large')).getBoundingClientRect();
      const x1 = a.x+a.width*({passed:.2,failed:.5,review:.8}[key])-bounds.x, y1 = a.y-bounds.y, x2 = b.x+b.width/2-bounds.x, y2 = b.bottom-bounds.y;
      const path = document.createElementNS(svg.namespaceURI,'path');
      path.setAttribute('d',`M${x1},${y1} C${x1},${y2+({passed:55,failed:35,review:15}[key])} ${x2},${y2+({passed:55,failed:35,review:15}[key])} ${x2},${y2}`);
      path.setAttribute('class',key); svg.append(path);
    }
  }
  function render() {
    const counts = tallies(rows); number.textContent = counts.review;
    caption.textContent = running ? 'need review so far' : counts.review === 1 ? 'label needs review' : 'labels need review';
    secondary.textContent = running ? `Label ${Math.min(stages[3]+1,total)} of ${total}` : `${stopped ? `Stopped at label ${stages[3]} of ${total}. ` : ''}${counts.machine} sorted by machine · ${counts.human} by you${finishSeconds === null ? '' : ` · ${finishSeconds.toFixed(1)} s total`}${total > 1 && firstSeconds !== null ? ` · first result ${firstSeconds.toFixed(1)} s` : ''}`;
    for (const button of buttons) {
      const key = button.dataset.pile;
      button.querySelector('.pile-count').textContent = counts[key];
      button.querySelector('.pile-chevron').textContent = selected === key ? '⌄' : '›';
      button.setAttribute('aria-pressed',String(selected === key));
    }
    meters.forEach(({count,meter,step},i) => {
      const missed = i === 1 || i === 2 ? Math.max(0,stages[3] - stages[i]) : 0;
      count.textContent = `${stages[i]} ${['in','read','checked','sorted'][i]}${missed ? ` · ${missed} incomplete` : ''}`;
      meter.max = total || 1; meter.value = stages[i]; step.classList.toggle('active',running && i === activeStage);
    });
    announce(`${counts.review} ${counts.review === 1 ? 'label needs' : 'labels need'} review${running ? ' so far' : ''}. ${stages[1]} read, ${stages[2]} checked, ${stages[3]} sorted out of ${total}.`);
    renderRows(); requestAnimationFrame(wires);
  }
  new ResizeObserver(wires).observe(map);
  render();
  return {
    clear() { root.hidden = true; running = false; dialog.close(); rows = []; selected = 'review'; query = ''; search.value = ''; stages = [0,0,0,0]; total = 0; rowList.replaceChildren(); render(); },
    start(count) {root.hidden = false; finishSeconds = null; firstSeconds = null; stopped = false; running = true; activeStage = 1; total = count; stages = [count,0,0,0]; render();},
    progress(stage) {stages[stage]++; activeStage = Math.min(stage+1,3); render();},
    stage(stage) {activeStage = stage; render();},
    finish(wasStopped = false, seconds = null, first = null) {finishSeconds = seconds; firstSeconds = first; stopped = wasStopped; running = false; activeStage = -1; render();},
    add(record) {
      const node = el(rowList,'button','', 'result-card triage-row'); node.type = 'button';
      const row = {...record, node}; rows.push(row);
      node.onclick = () => decision([rows.find(item => item.node === node)]);
      stages[3]++; render(); return node;
    },
  };
}
