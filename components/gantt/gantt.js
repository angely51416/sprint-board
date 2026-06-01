import { TODAY, TODAY_STR, RANGE_S_STR, RANGE_E_STR, toStr, weekStart, weekEnd, monthStart, monthEnd } from '../../js/utils.js';
import { projOrder } from '../../js/state.js';

let ganttInst = null;
let curView   = 'Day';
let taskMeta  = {};
let rowDragI  = null;

function tlStart(it) { return it.qa || it.barStart; }
function tlEnd(it)   { return it.testDone || it.barEnd || it.ship || it.live || it.prod || it.qa; }
function shortDate(ds) {
  if (!ds) return '--/--';
  const d = new Date(ds);
  return String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');
}

function renderGantt() {
  const tasks = projOrder.map((item, idx) => {
    const s = tlStart(item), e = tlEnd(item);
    if (!s || !e) return null;
    const launch = item.live || item.prod;
    return { id:`t${idx}`, name:item.name, start:s, end:e, progress:100,
      custom_class: item.kind === 'game' ? 'gantt-game' : 'gantt-tech',
      _color: item.color, _meta: { start:s, end:e, launch } };
  }).filter(Boolean);

  taskMeta = Object.fromEntries(tasks.map(t => [t.id, { start:t.start, end:t.end }]));
  buildLabelList();
  document.getElementById('gantt-chart').innerHTML = '';

  if (tasks.length === 0) {
    document.getElementById('gantt-label-list').innerHTML =
      '<li style="padding:16px 14px;font-family:var(--mono);font-size:.72rem;color:var(--ink-4);">— 無專案資料 —</li>';
    return;
  }

  ganttInst = new Gantt('#gantt-chart', tasks, {
    view_mode: curView, language: 'zh', date_format: 'YYYY-MM-DD',
    bar_height: 22, padding: 20,
    custom_popup_html: (task) => {
      const m = task._meta || {};
      return `<div style="padding:10px 13px;font-family:var(--sans);line-height:1.55;min-width:155px;font-size:.82rem"><b>${task.name}</b><br>QA進測：${m.start||'-'}<br>完成測試：${m.end||'-'}${m.launch?`<br>上線：${m.launch}`:''}</div>`;
    },
    on_date_change: (task, start, end) => {
      const idx  = parseInt(task.id.slice(1));
      const item = projOrder[idx];
      if (item) { item.qa = toStr(start); item.testDone = toStr(end); taskMeta[task.id] = { start:item.qa, end:item.testDone }; }
      requestAnimationFrame(() => { applyColors(); drawMilestones(); drawHighlights(); buildHeaders(); });
    },
  });

  const refresh = () => { syncRows(); decorateDay(); applyColors(); drawMilestones(); drawHighlights(); buildHeaders(); scrollToToday(); };
  requestAnimationFrame(refresh);
  setTimeout(refresh, 300);
  setTimeout(refresh, 800);
  setTimeout(syncRows, 1500);
}

function buildLabelList() {
  const ganttItems = projOrder.filter(item => tlStart(item) && tlEnd(item));
  document.getElementById('gantt-label-list').innerHTML = ganttItems.map(item => {
    const nm = item.kind === 'game' ? `${item.emoji} ${item.name}` : `${item.icon} ${item.name}`;
    const ri = projOrder.indexOf(item);
    return `<li class="gantt-label-item" title="${nm}" data-ri="${ri}" draggable="true"
      ondragstart="rowDS(event,${ri})" ondragover="rowDO(event,${ri})"
      ondragleave="rowDL(event)" ondrop="rowDrop(event,${ri})" ondragend="rowDE(event)">
      <span class="gantt-label-item__handle">⠿</span><span class="gantt-label-item__name">${nm}</span></li>`;
  }).join('');
}

function rowDS(e, i) {
  rowDragI = i;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { const el = document.querySelector(`[data-ri="${i}"]`); if (el) el.classList.add('gantt-label-item--dragging'); }, 0);
}
function rowDO(e, i) {
  e.preventDefault(); e.stopPropagation();
  document.querySelectorAll('.gantt-label-item').forEach(el => el.classList.remove('gantt-label-item--drag-over'));
  const el = document.querySelector(`[data-ri="${i}"]`); if (el) el.classList.add('gantt-label-item--drag-over');
}
function rowDL(e) { e.currentTarget.classList.remove('gantt-label-item--drag-over'); }
function rowDrop(e, toI) {
  e.preventDefault(); e.stopPropagation();
  document.querySelectorAll('.gantt-label-item').forEach(el => el.classList.remove('gantt-label-item--drag-over','gantt-label-item--dragging'));
  if (rowDragI === null || rowDragI === toI) { rowDragI = null; return; }
  const moved = projOrder.splice(rowDragI, 1)[0];
  projOrder.splice(toI, 0, moved);
  rowDragI = null;
  renderGantt();
  // notify cards to re-render
  window.dispatchEvent(new CustomEvent('projorder-changed'));
}
function rowDE() {
  document.querySelectorAll('.gantt-label-item').forEach(el => el.classList.remove('gantt-label-item--drag-over','gantt-label-item--dragging'));
  rowDragI = null;
}

function setGanttView(mode, evt) {
  curView = mode;
  ['Day','Week','Month'].forEach(k => {
    const b = document.getElementById('vt-' + k);
    if (b) b.classList.toggle('view-toggle__btn--active', k === mode);
  });
  if (ganttInst) {
    ganttInst.change_view_mode(mode);
    const refresh = () => { syncRows(); decorateDay(); applyColors(); drawMilestones(); drawHighlights(); buildHeaders(); };
    requestAnimationFrame(refresh);
    setTimeout(refresh, 500);
  } else {
    renderGantt();
  }
  if (evt && evt.currentTarget) evt.currentTarget.blur();
}

function applyColors() {
  const svg = document.getElementById('gantt-chart'); if (!svg) return;
  let pi = 0;
  svg.querySelectorAll('.bar-wrapper').forEach(w => {
    if (w.getAttribute('data-id') === '_ph') return;
    const item = projOrder[pi++]; if (!item) return;
    const bar  = w.querySelector('.bar'), prog = w.querySelector('.bar-progress');
    if (bar)  { bar.setAttribute('fill', item.color+'28'); bar.setAttribute('stroke', item.color+'80'); }
    if (prog)   prog.setAttribute('fill', item.color+'40');
  });
}

function syncRows() {
  const svgEl = document.getElementById('gantt-chart'); if (!svgEl) return;
  const labels = [...document.querySelectorAll('.gantt-label-item')]; if (!labels.length) return;
  const gridRows = [...svgEl.querySelectorAll('rect.grid-row')];      if (!gridRows.length) return;
  const svgRect  = svgEl.getBoundingClientRect();
  const vb       = svgEl.viewBox?.baseVal;
  const scaleY   = (vb && vb.height > 0) ? (svgRect.height / vb.height) : 1;
  const gridHeader = svgEl.querySelector('.grid-header');
  const headerHeight = parseFloat(gridHeader?.getAttribute('height') || 0) * scaleY;
  const leftHd = document.getElementById('gantt-left-hd');
  if (leftHd) leftHd.style.height = `${headerHeight}px`;
  const labelList = document.getElementById('gantt-label-list');
  const firstRowY = parseFloat(gridRows[0].getAttribute('y')) * scaleY;
  labelList.style.paddingTop = `${Math.max(0, firstRowY - headerHeight)}px`;
  labels.forEach((label, i) => {
    const row = gridRows[i]; if (!row) return;
    const rowH = parseFloat(row.getAttribute('height')) * scaleY;
    label.style.height     = `${rowH}px`;
    label.style.lineHeight = `${rowH}px`;
    label.style.transform  = '';
  });
  const ganttLeft = document.querySelector('.gantt-left');
  if (ganttLeft) ganttLeft.style.height = `${svgRect.height}px`;
}

function scrollToToday() {
  const gr = document.getElementById('gantt-right');
  if (!gr || !ganttInst?.gantt_start) return;
  const svg  = document.getElementById('gantt-chart'); if (!svg) return;
  const tr   = svg.querySelector('.today-highlight');          if (!tr)  return;
  const svgEl = document.getElementById('gantt-chart');
  const vb    = svgEl.viewBox?.baseVal;
  const scaleX = (vb && vb.width > 0) ? (svgEl.getBoundingClientRect().width / vb.width) : 1;
  const tx = parseFloat(tr.getAttribute('x') || 0);
  gr.scrollLeft = Math.max(0, tx * scaleX - 160);
}

function drawHighlights() {
  const gr = document.getElementById('gantt-right'); if (!gr) return;
  gr.querySelectorAll('.now-line,.week-band,.month-band').forEach(n => n.remove());
  const svg = document.getElementById('gantt-chart'); if (!svg || !ganttInst?.gantt_start) return;
  const tr  = svg.querySelector('.today-highlight');          if (!tr) return;
  const svgEl = document.getElementById('gantt-chart');
  const vb    = svgEl.viewBox?.baseVal;
  const scaleX = (vb && vb.width > 0) ? (svgEl.getBoundingClientRect().width / vb.width) : 1;
  const grR = gr.getBoundingClientRect(), svgR = svgEl.getBoundingClientRect();
  const offsetX = svgR.left - grR.left;
  const tx = parseFloat(tr.getAttribute('x') || 0), tw = parseFloat(tr.getAttribute('width') || 0);
  const pxDay = tw * scaleX, todayCenterX = tx * scaleX + pxDay / 2 + offsetX;

  const addLine = () => {
    const l = document.createElement('div'); l.className = 'now-line';
    l.style.left = '0'; l.style.transform = `translateX(${todayCenterX}px)`;
    gr.appendChild(l);
  };

  if (curView === 'Day') {
    addLine();
  } else if (curView === 'Week') {
    const ws = weekStart(TODAY), we = weekEnd(TODAY);
    const msOff = (ws - TODAY) / 86400000, meOff = (we - TODAY) / 86400000;
    const b = document.createElement('div'); b.className = 'week-band';
    const bx = todayCenterX + msOff * pxDay;
    b.style.left = '0'; b.style.transform = `translateX(${bx}px)`;
    b.style.width = Math.max(0, (meOff - msOff + 1) * pxDay) + 'px';
    gr.appendChild(b); addLine();
  } else if (curView === 'Month') {
    const ms = monthStart(TODAY), me = monthEnd(TODAY);
    const msOff = (ms - TODAY) / 86400000, meOff = (me - TODAY) / 86400000;
    const b = document.createElement('div'); b.className = 'month-band';
    const bx = todayCenterX + msOff * pxDay;
    b.style.left = '0'; b.style.transform = `translateX(${bx}px)`;
    b.style.width = Math.max(0, (meOff - msOff + 1) * pxDay) + 'px';
    gr.appendChild(b); addLine();
  }
}

function drawMilestones() {
  const svg = document.getElementById('gantt-chart'); if (!svg) return;
  svg.querySelectorAll('.gantt-ms-tag').forEach(n => n.remove());
  const placed = [];
  function overlaps(a, b, g = 4) { return !(a.x+a.w+g < b.x || b.x+b.w+g < a.x || a.y+a.h+g < b.y || b.y+b.h+g < a.y); }
  function mkTag(x, y, kind, text, align, place = 'top') {
    const g    = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'gantt-ms-tag');
    const tri  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); tri.setAttribute('class', `gantt-tag-tri ${kind}`);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');    rect.setAttribute('class', 'gantt-tag-bg');
    const txt  = document.createElementNS('http://www.w3.org/2000/svg', 'text');    txt.setAttribute('class', 'gantt-tag-text'); txt.textContent = text;
    const w = Math.max(74, text.length * 6.6 + 12), h = 18, tW = 6, tH = 7;
    const by = place === 'top' ? (y - h - tH - 4) : (y + tH + 4);
    const bx = align === 'right' ? x - w : x;
    rect.setAttribute('x', bx); rect.setAttribute('y', by); rect.setAttribute('width', w); rect.setAttribute('height', h);
    txt.setAttribute('x', bx + 6); txt.setAttribute('y', by + 12);
    tri.setAttribute('points', place === 'top'
      ? (align === 'right' ? `${x},${y} ${x-tW},${y-tH} ${x-tW*2},${y-tH}` : `${x},${y} ${x+tW},${y-tH} ${x+tW*2},${y-tH}`)
      : (align === 'right' ? `${x},${y} ${x-tW},${y+tH} ${x-tW*2},${y+tH}` : `${x},${y} ${x+tW},${y+tH} ${x+tW*2},${y+tH}`));
    g.appendChild(rect); g.appendChild(tri); g.appendChild(txt);
    return { g, r:{ x:bx, y:by, w, h } };
  }
  function placeTag(x, y, kind, text, align) {
    for (const [pl, yo] of [['top',0],['bottom',0],['top',-12],['bottom',12]]) {
      const c = mkTag(x, y + yo, kind, text, align, pl);
      if (!placed.some(r => overlaps(c.r, r))) { placed.push(c.r); return c.g; }
    }
    const fb = mkTag(x, y - 18, kind, text, align, 'top'); placed.push(fb.r); return fb.g;
  }
  svg.querySelectorAll('.bar-wrapper').forEach(w => {
    const id   = w.getAttribute('data-id'); if (id === '_ph') return;
    const meta = taskMeta[id];               if (!meta) return;
    const bar  = w.querySelector('.bar');    if (!bar) return;
    const x  = parseFloat(bar.getAttribute('x')     || 0);
    const y  = parseFloat(bar.getAttribute('y')     || 0);
    const bw = parseFloat(bar.getAttribute('width') || 0);
    if (bw <= 0) return;
    svg.appendChild(placeTag(x,      y + 1, 'qa',   `QA ${shortDate(meta.start)}`,    'left'));
    svg.appendChild(placeTag(x + bw, y + 1, 'done', `完成 ${shortDate(meta.end)}`, 'right'));
  });
}

function buildHeaders() {
  const svg = document.getElementById('gantt-chart');
  const mC  = document.getElementById('g-hd-m-cells');
  const qC  = document.getElementById('g-hd-q-cells');
  if (!svg || !mC || !qC) return;

  // Derive px-per-day from the today-highlight rect (1 day wide in Day view, 7 in Week, ~month in Month)
  const todayHl = svg.querySelector('.today-highlight');
  if (!todayHl) return;
  const hlWidth = parseFloat(todayHl.getAttribute('width') || 0);
  if (hlWidth <= 0) return;

  let pxPerDay;
  if (curView === 'Week') {
    pxPerDay = hlWidth / 7;
  } else if (curView === 'Month') {
    pxPerDay = hlWidth / new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate();
  } else {
    pxPerDay = hlWidth; // Day view: highlight is exactly 1 day
  }

  // Anchor: viewport left of today's cell start, relative to mC container
  const mCRect = mC.getBoundingClientRect();
  const todayViewportLeft = todayHl.getBoundingClientRect().left;
  const todayInMC = todayViewportLeft - mCRect.left;

  function dateToCellX(date) {
    return todayInMC + ((date - TODAY) / 86400000) * pxPerDay;
  }

  const W = mCRect.width;
  const nowM = TODAY.getMonth() + 1;

  // Build month segments spanning enough range to cover any scroll position
  const months = [];
  for (let mo = -4; mo <= 8; mo++) {
    const start = new Date(TODAY.getFullYear(), TODAY.getMonth() + mo,     1);
    const end   = new Date(TODAY.getFullYear(), TODAY.getMonth() + mo + 1, 1);
    months.push({ m: start.getMonth() + 1, x: dateToCellX(start), xe: dateToCellX(end) });
  }

  mC.innerHTML = '';
  months.forEach(({ m, x, xe }) => {
    if (xe < 0 || x > W) return;
    const cell = document.createElement('div');
    cell.className = 'gantt-hd-month__cell' + (m === nowM ? ' gantt-hd-month__cell--current' : '');
    // Clamp left to 0 so the label stays inside the visible container when a month starts off-screen
    const cx = Math.max(0, x), cw = Math.max(0, Math.min(W, xe) - cx);
    cell.style.cssText = `left:${cx}px;width:${cw}px;`;
    cell.textContent = m + '月';
    mC.appendChild(cell);
  });

  function toQ(m) { if (m<=3) return '第一季'; if (m<=6) return '第二季'; if (m<=9) return '第三季'; return '第四季'; }
  qC.innerHTML = '';
  const qG = [];
  months.forEach(({ m, x, xe }) => {
    const q = toQ(m);
    if (!qG.length || qG[qG.length-1].q !== q) qG.push({ q, x, ex: xe });
    else qG[qG.length-1].ex = xe;
  });
  qG.forEach(({ q, x, ex }) => {
    if (ex < 0 || x > W) return;
    const cx = Math.max(0, x), cw = Math.max(0, Math.min(W, ex) - cx);
    const cell = document.createElement('div');
    cell.className = 'gantt-hd-quarter__cell';
    cell.style.cssText = `left:${cx}px;width:${cw}px;`;
    cell.textContent = q;
    qC.appendChild(cell);
  });
}

function decorateDay() {
  if (curView !== 'Day' || !ganttInst) return;
  const wd = ['日','一','二','三','四','五','六'];
  document.querySelectorAll('#gantt-chart .lower-text').forEach((el, i) => {
    const d = new Date(ganttInst.gantt_start); d.setDate(d.getDate() + i);
    el.textContent = `${d.getDate()}(${wd[d.getDay()]})`;
    const isToday = d.toDateString() === TODAY.toDateString();
    el.setAttribute('fill', isToday ? '#FF8F59' : '');
    el.style.fontWeight = isToday ? '700' : '';
  });
}

function refreshGanttLayout() { syncRows(); drawHighlights(); buildHeaders(); }

/* expose to global scope for inline handlers */
window.setGanttView = setGanttView;
window.rowDS   = rowDS;
window.rowDO   = rowDO;
window.rowDL   = rowDL;
window.rowDrop = rowDrop;
window.rowDE   = rowDE;

export { renderGantt, refreshGanttLayout };
