import { TODAY } from '../../js/utils.js';
import { projOrder } from '../../js/state.js';

const FILTER_OPTS = ['全部','COCOS串接','基本測試完成','基本測試中','GS開發中','數學製作中','美術製作中','已上線'];
let curFilter = '';

const PILL_CLASS = {
  final:'pill--final', qa:'pill--qa', survey:'pill--survey',
  audio:'pill--audio', fe:'pill--fe', art:'pill--art', tech:'pill--tech',
};

const MECH_DEFS = [
  { key:'extraBet',    label:'Extra Bet' },
  { key:'blitz',       label:'Blitz Mode' },
  { key:'frb',         label:'FRB' },
  { key:'fra',         label:'FRA' },
  { key:'tournament',  label:'錦標賽' },
];

function daysLeft(ds) { return Math.round((new Date(ds) - TODAY) / 86400000); }

function dateCell(label, ds, hot) {
  if (!ds) return `<div class="card-date card-date--empty"><div class="card-date__label">${label}</div><div class="card-date__value" style="color:var(--ink-4)">—</div></div>`;
  const dl = daysLeft(ds);
  const cnt = dl < 0 ? '已完成' : dl === 0 ? '今天' : `剩 ${dl} 天`;
  const hotCls = (hot && dl >= 0 && dl <= 7) ? ' card-date__countdown--hot' : '';
  return `<div class="card-date"><div class="card-date__label">${label}</div><div class="card-date__value">${ds.slice(5)}</div><div class="card-date__countdown${hotCls}">${cnt}</div></div>`;
}

function teamBack(item) {
  const ent = Object.entries(item.team || {});
  const teamHtml = ent.length
    ? `<div class="card-back__team">${ent.map(([r, n]) => `<div class="card-back__member"><span class="card-back__role">${r}</span><span class="card-back__member-name">${n}</span></div>`).join('')}</div>`
    : '<div class="card-back__no-team">— 負責人資料待補 —</div>';
  const sub = item.kind === 'game' ? `${item.en} · #${item.id}` : item.en;
  return `<div class="flip-card__back"><div class="card-back__hint">團隊成員</div><div class="card-back__name">${item.name}</div><div class="card-back__sub">${sub}</div>${teamHtml}</div>`;
}

function mechSection(mechs) {
  if (!mechs) return '';
  const tags = MECH_DEFS.map(d => {
    const cls = mechs[d.key] ? 'mech-tag--yes' : 'mech-tag--no';
    return `<span class="mech-tag ${cls}">${mechs[d.key] ? '✓' : '✕'} ${d.label}</span>`;
  }).join('');
  const maxwin = mechs.maxwin ? `<span class="mech-maxwin">頂倍 ${mechs.maxwin}</span>` : '';
  return `<div class="mech-section"><div class="mech-section__row">${tags}${maxwin}</div></div>`;
}

function gameFront(g) {
  const done = g.done.map(t => `<div class="card-update"><div class="card-update__dot" style="background:var(--green)"></div><span>${t}</span></div>`).join('');
  const wip  = g.wip.map(t  => `<div class="card-update"><div class="card-update__dot" style="background:var(--amber)"></div><span>${t}</span></div>`).join('');
  return `<div class="flip-card__front" style="--pc-color:${g.color}">
    <div class="card-top"><span class="card-top__icon">${g.emoji}</span><span class="card-top__pill ${PILL_CLASS[g.status]}">${g.statusLabel}</span></div>
    <div class="card__name">${g.name}</div><div class="card__sub">${g.en}${g.id ? ' · #'+g.id : ''}</div>
    <div class="card-progress__row"><span class="card-progress__label">進度</span><span class="card-progress__pct" style="color:${g.color}">${Math.round(g.progress*100)}%</span></div>
    <div class="card-progress__track"><div class="card-progress__fill" style="width:${g.progress*100}%;background:${g.color}"></div></div>
    <div class="card-dates">${dateCell('QA 進測',g.qa,true)}${dateCell('出貨',g.ship,true)}${dateCell('上線',g.live,false)}</div>
    ${mechSection(g.mechs)}
    <div class="card-updates">${done}${wip}</div>
    <span class="card-flip-hint">▷ 滑入翻轉查看負責人</span></div>`;
}

function techFront(t) {
  const rows = t.rows.map(r => `<div class="card-tech-row"><span class="card-tech-row__key">${r.k}</span><span class="card-tech-row__val ${r.cls}">${r.v}</span></div>`).join('');
  return `<div class="flip-card__front" style="--pc-color:${t.color}">
    <div class="card-top"><span class="card-top__icon">${t.icon}</span><span class="card-top__pill pill--tech">${t.statusLabel}</span></div>
    <div class="card__name">${t.name}</div><div class="card__sub">${t.en}</div>
    <div class="card-dates">${dateCell('QA 進測',t.qa,true)}${dateCell('出貨',t.ship,true)}${dateCell('正式上線',t.prod,false)}</div>
    <div class="card-tech-rows">${rows}</div>
    <span class="card-flip-hint">▷ 滑入翻轉查看負責人</span></div>`;
}

function renderFilterBar() {
  document.getElementById('filter-bar').innerHTML = FILTER_OPTS.map(l => {
    const isActive = (l === '全部' && curFilter === '') || (curFilter === l);
    return `<button class="filter-btn${isActive ? ' filter-btn--active' : ''}" onclick="setFilter('${l}')">${l}</button>`;
  }).join('');
}

function setFilter(l) {
  curFilter = l === '全部' ? '' : l;
  renderFilterBar();
  renderCards();
}

function renderCards() {
  const filtered = curFilter ? projOrder.filter(it => (it.statusLabel || '').includes(curFilter)) : projOrder;
  document.getElementById('all-cards').innerHTML = filtered.map((item, i) => {
    const front = item.kind === 'game' ? gameFront(item) : techFront(item);
    return `<div class="flip-card" style="animation-delay:${i*0.05}s"><div class="flip-card__inner">${front}${teamBack(item)}</div></div>`;
  }).join('') || '<div style="padding:24px;color:var(--ink-4);font-family:var(--mono);font-size:.8rem;text-align:center;grid-column:1/-1">— 無符合條件的專案 —</div>';
}

window.setFilter = setFilter;

export { renderFilterBar, renderCards };
