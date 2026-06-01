/* Shared mutable state — populated by data.js, read by gantt.js and cards.js */
export const projOrder = [];
export let GAMES = [];
export let TECH  = [];

export function setGames(arr) { GAMES = arr; }
export function setTech(arr)  { TECH  = arr; }

export function shipDate(it) {
  const s = it.ship || it.prod;
  return s ? +new Date(s) : +new Date(tlEnd(it));
}
function tlEnd(it) { return it.testDone || it.barEnd || it.ship || it.live || it.prod || it.qa; }

export function initOrder() {
  projOrder.length = 0;
  const sorted = [
    ...[...GAMES].sort((a, b) => shipDate(a) - shipDate(b)),
    ...[...TECH].sort((a, b)  => shipDate(a) - shipDate(b)),
  ];
  projOrder.push(...sorted);
}
