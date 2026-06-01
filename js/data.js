import { toISODate, toBool, toProgress, normalizeColor } from './utils.js';
import { setGames, setTech, initOrder } from './state.js';

const STATUS_MAP = {
  '基本測試完成':'survey','基本測試中':'survey',
  'COCOS串接':'fe',
  'GS開發中':'audio','數學製作中':'audio','美術製作中':'art',
  '已上線':'final','問卷demo會議':'survey','待開發':'tech',
  'GS/CS/COCOS實作中':'tech','已出測':'tech',
};

const DATA_URL = (() => {
  const loc  = window.location.href.split('?')[0].split('#')[0];
  const base = loc.endsWith('/') ? loc : loc.substring(0, loc.lastIndexOf('/') + 1);
  return base + 'data.json';
})();

function rowToGame(r) {
  const stCls = STATUS_MAP[r.status || ''] || 'survey';
  return {
    kind:'game', id:r.id||'', emoji:r.emoji||'🎰',
    name:r.name||r.nameEn||'', en:r.nameEn||'',
    color:normalizeColor(r.color),
    status:stCls, statusLabel:r.status||'',
    progress:toProgress(r.progress),
    qa:toISODate(r.qaTest), testDone:toISODate(r.doneTest),
    ship:null, live:toISODate(r.releaseDate),
    team:{
      ...(r.gp    ? { GP:r.gp }     : {}),
      ...(r.fe    ? { FE:r.fe }     : {}),
      ...(r.info  ? { Info:r.info } : {}),
      ...(r.his   ? { HIS:r.his }   : {}),
      ...(r.gs    ? { GS:r.gs }     : {}),
      ...(r.audio ? { 音效:r.audio } : {}),
    },
    done:['—'], wip:[r.status||''],
    mechs:{
      extraBet:  toBool(r.extrabet),
      blitz:     toBool(r.blitzmode),
      frb:       toBool(r.FreeRoundBonus),
      fra:       toBool(r.FreeRoundApi),
      tournament:toBool(r.Tournament),
      guarantee: false,
      scPayout:  false,
      maxwin:    (r.MAXWIN && r.MAXWIN !== '' && r.MAXWIN !== '待確認') ? r.MAXWIN : '',
    },
  };
}

function rowToTech(r) {
  const stCls = STATUS_MAP[r.status || ''] || 'tech';
  return {
    kind:'tech', icon:r.icon||'🔧',
    name:r.name||'', en:r.nameEn||'',
    color:normalizeColor(r.color),
    status:stCls, statusLabel:r.status||'',
    qa:toISODate(r.qaTest), testDone:toISODate(r.doneTest),
    ship:null, prod:toISODate(r.prodDate),
    team:{},
    rows:[
      ...(r.uatDate  ? [{ k:'UAT/Stage', v:r.uatDate,  cls:'' }] : []),
      ...(r.prodDate ? [{ k:'Prod',      v:r.prodDate, cls:'' }] : []),
    ],
    mechs:null,
  };
}

export async function loadData() {
  const res  = await fetch(DATA_URL + '?t=' + Date.now());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  setGames((data.gameProjects || []).map(rowToGame));
  setTech((data.techProjects  || []).map(rowToTech));
  initOrder();
  return data;
}
