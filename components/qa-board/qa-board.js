const QA_ITEMS = [
  { id:'qa1', text:'DAL 測試', done:false },
  { id:'qa2', text:'狂野霸盜 最終測試', done:false },
  { id:'qa3', text:'錦標賽 測試案例', done:false },
];

let qaState = QA_ITEMS.map(x => ({ ...x }));
let dragId   = null;
let editId   = null;
let idSeq    = QA_ITEMS.length + 1;

function renderQA() {
  const todo = qaState.filter(x => !x.done);
  const done = qaState.filter(x =>  x.done);
  document.getElementById('todo-count').textContent = todo.length;
  document.getElementById('done-count').textContent = done.length;

  function chip(item) {
    return `<div class="qa-chip ${item.done ? 'qa-chip--done' : ''}" draggable="true" data-id="${item.id}"
      ondragstart="onDragStart(event,'${item.id}')" ondragend="onDragEnd(event)">
      <span class="qa-chip__handle">⠿</span><span class="qa-chip__text">${item.text}</span>
      <div class="qa-chip__actions">
        <button class="qa-chip__btn qa-chip__btn--edit" onclick="openModal('${item.id}');event.stopPropagation();">✎</button>
        <button class="qa-chip__btn qa-chip__btn--del"  onclick="deleteItem('${item.id}');event.stopPropagation();">✕</button>
      </div></div>`;
  }

  document.getElementById('qa-todo').innerHTML = todo.map(chip).join('')
    || '<div style="padding:8px 10px;font-size:.75rem;color:var(--ink-4);font-family:var(--mono)">— 沒有待處理項目 —</div>';
  document.getElementById('qa-done').innerHTML = done.map(chip).join('')
    || '<div style="padding:8px 10px;font-size:.75rem;color:var(--ink-4);font-family:var(--mono)">— 拖曳到此標記完成 —</div>';
}

function onDragStart(e, id) {
  dragId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { const el = document.querySelector(`[data-id="${id}"]`); if (el) el.classList.add('qa-chip--dragging'); }, 0);
}
function onDragEnd() {
  document.querySelectorAll('.qa-chip').forEach(el => el.classList.remove('qa-chip--dragging'));
  document.querySelectorAll('.qa-list').forEach(el => el.classList.remove('qa-list--drag-over'));
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('qa-list--drag-over');
}
function onDragLeave(e) { e.currentTarget.classList.remove('qa-list--drag-over'); }
function onDrop(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('qa-list--drag-over');
  if (!dragId) return;
  const it = qaState.find(x => x.id === dragId);
  if (it) it.done = (col === 'done');
  dragId = null;
  renderQA();
}

function openModal(id) {
  editId = id || null;
  const titleEl = document.getElementById('modal-title');
  const inp     = document.getElementById('modal-text');
  if (editId) {
    titleEl.textContent = '編輯項目';
    inp.value = qaState.find(x => x.id === editId)?.text || '';
  } else {
    titleEl.textContent = '新增關注項目';
    inp.value = '';
  }
  document.getElementById('qa-modal').classList.add('modal-backdrop--open');
  setTimeout(() => inp.focus(), 80);
}
function closeModal() {
  document.getElementById('qa-modal').classList.remove('modal-backdrop--open');
  editId = null;
}
function onBackdropClick(e) { if (e.target === e.currentTarget) closeModal(); }
function saveModal() {
  const text = document.getElementById('modal-text').value.trim();
  if (!text) return;
  if (editId) {
    const it = qaState.find(x => x.id === editId);
    if (it) it.text = text;
  } else {
    qaState.push({ id: `qa${++idSeq}`, text, done: false });
  }
  closeModal();
  renderQA();
}
function deleteItem(id) {
  if (!confirm('確定要刪除此項目？')) return;
  qaState = qaState.filter(x => x.id !== id);
  renderQA();
}

/* expose to global scope for inline handlers */
window.onDragStart    = onDragStart;
window.onDragEnd      = onDragEnd;
window.onDragOver     = onDragOver;
window.onDragLeave    = onDragLeave;
window.onDrop         = onDrop;
window.openModal      = openModal;
window.closeModal     = closeModal;
window.onBackdropClick = onBackdropClick;
window.saveModal      = saveModal;
window.deleteItem     = deleteItem;

export { renderQA };
