import { TODAY, isoWeek, weekStart, weekEnd, fmtMD } from './utils.js';
import { loadData } from './data.js';
import { initOrder } from './state.js';
import { renderQA } from '../components/qa-board/qa-board.js';
import { renderGantt, refreshGanttLayout } from '../components/gantt/gantt.js';
import { renderFilterBar, renderCards } from '../components/cards/cards.js';

function updateHeader() {
  const wn = isoWeek(TODAY), ws = weekStart(TODAY), we = weekEnd(TODAY);
  const mn = TODAY.getMonth() + 1, yr = TODAY.getFullYear(), mw = Math.ceil(TODAY.getDate() / 7);
  document.getElementById('pg-meta').innerHTML =
    `第 ${wn} 週 &nbsp;·&nbsp; ${yr}.${fmtMD(ws)} – ${fmtMD(we)} &nbsp;·&nbsp; Slot Studio`;
  document.getElementById('pg-badge').textContent = `${mn}月 第${mw}週 · ${yr}`;
  document.title = `進度儀錶板 · ${yr} 第${wn}週`;
  const mNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const rS = new Date(yr, mn-2, 1), rE = new Date(yr, mn+3, 0);
  document.getElementById('gantt-note').textContent =
    `${mNames[rS.getMonth()]} – ${mNames[rE.getMonth()]} ｜ 可拖曳長條調整時程`;
}

async function loadAndRender() {
  document.getElementById('loading-state').style.display = 'flex';
  try {
    const data = await loadData();
    if (data.lastUpdated) {
      const d = new Date(data.lastUpdated);
      const fmt = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      document.getElementById('last-updated').textContent = '資料更新：' + fmt;
    }
    document.getElementById('loading-state').style.display = 'none';
    renderFilterBar(); renderGantt(); renderCards();
  } catch (err) {
    console.error('data.json 載入失敗：', err);
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('load-error').style.display = 'flex';
    initOrder(); renderFilterBar(); renderGantt(); renderCards();
  }
}

updateHeader();
renderQA();
loadAndRender();

const ganttRight = document.getElementById('gantt-right');
if (ganttRight) ganttRight.addEventListener('scroll', () => requestAnimationFrame(refreshGanttLayout));
window.addEventListener('resize', () => requestAnimationFrame(refreshGanttLayout));
window.addEventListener('projorder-changed', () => renderCards());
