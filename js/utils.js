export const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
export const TODAY_STR = TODAY.getFullYear() + '-' + String(TODAY.getMonth()+1).padStart(2,'0') + '-' + String(TODAY.getDate()).padStart(2,'0');

export function isoWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const y1 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt - y1) / 86400000) + 1) / 7);
}
export function weekStart(d) { const w = d.getDay() || 7; const m = new Date(d); m.setDate(d.getDate() - w + 1); return m; }
export function weekEnd(d)   { const f = new Date(weekStart(d)); f.setDate(f.getDate() + 6); return f; }
export function monthStart(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
export function monthEnd(d)  { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
export function fmtMD(d)     { return String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0'); }
export function toStr(d)     { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }

export function toISODate(val) {
  if (!val || val === '' || val === '0' || val === '待確認') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const m = val.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const yr = new Date().getFullYear();
    return `${yr}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
  }
  return null;
}
export function toBool(val) {
  if (!val || val === '') return false;
  const s = String(val).trim().toLowerCase();
  return s === '有' || s === '是' || s === 'true' || s === '✓' || s === 'yes' || s === '1';
}
export function toProgress(val) {
  if (!val || val === '') return 0;
  const n = parseFloat(String(val).replace('%', ''));
  if (isNaN(n)) return 0;
  return n > 1 ? n / 100 : n;
}
export const RANGE_S = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
export const RANGE_E = new Date(TODAY.getFullYear(), TODAY.getMonth() + 4, 0);
export const RANGE_S_STR = toStr(RANGE_S);
export const RANGE_E_STR = toStr(RANGE_E);

export function normalizeColor(c) {
  if (!c) return '#888888';
  c = c.trim();
  if (!c.startsWith('#')) c = '#' + c;
  if (c.length === 9) c = c.slice(0, 7);
  return c;
}
