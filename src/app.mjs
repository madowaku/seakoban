import './styles.css';
import { STAGES, SIZE } from './stages.mjs';
import { initialState, transition } from './logic.mjs';
import { solve } from './solver.mjs';

const storageKey = 'seakoban.v0.1';
let save = { unlocked: 1, cleared: {}, sound: false };
try { save = { ...save, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch { /* private browsing */ }
const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(save)); } catch { /* optional */ } };
const debug = new URLSearchParams(location.search).has('debug');
const app = document.querySelector('#app');
app.innerHTML = `
  <div class="shell">
    <header class="brand">
      <div class="eyebrow"><span class="eyebrow-line"></span>A LITTLE OCEAN PUZZLE<span class="eyebrow-line"></span></div>
      <h1>SEA<span>KO</span>BAN</h1>
      <p class="subtitle">ぷかばん <span aria-hidden="true">·</span> 荷物が、ブレーキになる。</p>
    </header>
    <section class="game-card" aria-label="パズルゲーム">
      <div class="info-bar">
        <button id="stage-button" class="stage-pill" type="button" aria-label="ステージを選ぶ">STAGE <span id="stage-number">001</span> <span aria-hidden="true">⌄</span></button>
        <div class="move-panel">MOVES <strong id="moves">00</strong><span class="mini-sep"></span>PUSHES <strong id="pushes">00</strong></div>
        <button id="sound-button" class="icon-button" type="button" aria-label="サウンド切り替え">♪</button>
      </div>
      <div class="board-shell">
        <div id="board" class="board" role="application" aria-label="5かける5の海。矢印キーかスワイプで船を動かす" tabindex="0"></div>
        <div id="clear-panel" class="clear-panel" hidden>
          <span class="clear-icon" aria-hidden="true">⚓</span>
          <p class="clear-kicker">ALL CARGO MOORED</p>
          <h2 id="clear-title">STAGE CLEAR!</h2>
          <p id="clear-detail"></p>
          <div class="clear-actions"><button id="next-button" class="primary" type="button">NEXT STAGE →</button><button id="again-button" class="secondary" type="button">もう一度</button></div>
        </div>
      </div>
      <div class="stage-description">
        <span class="stage-tag" id="stage-tag">01 / 10</span>
        <h2 id="stage-name">ぷかっ</h2>
        <p id="stage-tip"></p>
      </div>
      <div class="tool-bar">
        <button id="undo-button" class="tool-button" type="button">↶ <span>UNDO</span></button>
        <span class="tool-sep"></span>
        <button id="retry-button" class="tool-button" type="button">↻ <span>RETRY</span></button>
        <span class="tool-sep"></span>
        <button id="levels-button" class="tool-button" type="button">▦ <span>STAGES</span></button>
      </div>
    </section>
    <section class="controls" aria-label="移動ボタン">
      <div class="arrow-pad"><span></span><button data-dir="U" aria-label="上へ">↑</button><span></span><button data-dir="L" aria-label="左へ">←</button><button data-dir="D" aria-label="下へ">↓</button><button data-dir="R" aria-label="右へ">→</button></div>
      <p class="help">スワイプ / 矢印キー / WASD で移動<br>箱は端や別の箱にぶつかるまで漂う</p>
    </section>
    <footer>NO TIMER. JUST TIDES & THINKING. <span aria-hidden="true">✦</span></footer>
  </div>
  <dialog id="stage-dialog" class="stage-dialog" aria-label="ステージ選択">
    <div class="dialog-head"><div><span class="eyebrow small">SEA MAP</span><h2>STAGE SELECT</h2></div><button id="close-dialog" class="icon-button" aria-label="閉じる">✕</button></div>
    <p class="dialog-hint">クリアすると次の海域が開放されます。</p>
    <div id="level-grid" class="level-grid"></div>
  </dialog>
`;

const $ = (id) => document.getElementById(id);
const board = $('board');
const levelGrid = $('level-grid');
const stageDialog = $('stage-dialog');
let stageIndex = 0;
let stage = STAGES[stageIndex];
let state = initialState(stage);
let history = [];
let locked = false;
let releaseTimer = null;
let cargoElements = new Map();
let boatElement = null;
let audioContext = null;
let clearTimer = null;

function sound(frequency, ms = 65, type = 'sine') {
  if (!save.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.72), now + ms / 1000);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + ms / 1000);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now); osc.stop(now + ms / 1000);
  } catch { /* audio is enhancement only */ }
}
function place(el, x, y, duration = 0) {
  el.style.setProperty('--x', x);
  el.style.setProperty('--y', y);
  el.style.setProperty('--duration', `${duration}ms`);
}
function boatSprite() {
  const el = document.createElement('div');
  el.className = 'sprite boat';
  el.innerHTML = '<span class="boat-icon" aria-hidden="true">🚤</span>';
  el.setAttribute('aria-label', '小型船');
  return el;
}
function cargoSprite(c) {
  const el = document.createElement('div');
  el.className = 'sprite cargo';
  el.dataset.cargo = c.id;
  el.innerHTML = '<span class="float-shadow"></span><span class="crate"><span class="crate-stripe"></span></span><span class="moored-mark" aria-hidden="true">✓</span>';
  el.setAttribute('aria-label', `荷物${c.id}`);
  return el;
}
function renderBoard() {
  board.replaceChildren();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const cell = document.createElement('div');
    cell.className = 'sea-cell';
    if ((x * 7 + y * 11) % 4 === 0) cell.classList.add('ripple-cell');
    if (state.goals.some((g) => g.x === x && g.y === y)) {
      cell.classList.add('goal-cell');
      cell.innerHTML = '<span class="buoy" aria-hidden="true"><span></span></span>';
    }
    board.append(cell);
  }
  cargoElements = new Map();
  state.cargo.forEach((c) => {
    const el = cargoSprite(c);
    place(el, c.x, c.y);
    board.append(el);
    cargoElements.set(c.id, el);
  });
  boatElement = boatSprite();
  place(boatElement, state.player.x, state.player.y);
  board.append(boatElement);
}
function renderPositions(movedId, distance = 0) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const c of state.cargo) {
    const el = cargoElements.get(c.id);
    el.classList.toggle('is-moored', c.moored);
    place(el, c.x, c.y, !reducedMotion && movedId === c.id ? Math.min(510, 130 + distance * 85) : 0);
  }
  place(boatElement, state.player.x, state.player.y, reducedMotion ? 0 : 95);
  $('moves').textContent = String(state.moves).padStart(2, '0');
  $('pushes').textContent = String(state.pushes).padStart(2, '0');
  $('undo-button').disabled = history.length === 0 || locked;
}
function loadStage(index) {
  if (index < 0 || index >= STAGES.length || (!debug && index + 1 > save.unlocked)) return;
  clearTimeout(releaseTimer); clearTimeout(clearTimer);
  locked = false;
  stageIndex = index;
  stage = STAGES[index];
  state = initialState(stage);
  history = [];
  $('clear-panel').hidden = true;
  $('stage-number').textContent = String(stage.id).padStart(3, '0');
  $('stage-tag').textContent = `${String(stage.id).padStart(2, '0')} / ${STAGES.length}`;
  $('stage-name').textContent = stage.name;
  $('stage-tip').textContent = stage.tip;
  renderBoard(); renderPositions();
  if (stageDialog.open) stageDialog.close();
}
function markComplete() {
  const previousBest = save.cleared[stage.id];
  if (previousBest === undefined || state.moves < previousBest) save.cleared[stage.id] = state.moves;
  save.unlocked = Math.max(save.unlocked, Math.min(STAGES.length, stage.id + 1));
  persist();
  clearTimer = setTimeout(() => {
    $('clear-title').textContent = stage.id === STAGES.length ? 'ALL CLEAR!' : 'STAGE CLEAR!';
    $('clear-detail').textContent = `${state.moves} MOVES · ${state.pushes} PUSHES`;
    $('next-button').hidden = stage.id === STAGES.length;
    $('clear-panel').hidden = false;
    sound(740, 220, 'triangle');
  }, 440);
}
function move(dir) {
  if (locked || !$('clear-panel').hidden || stageDialog.open) return;
  const result = transition(state, dir);
  if (result.event === 'blocked') { sound(130, 35, 'square'); return; }
  history.push(state);
  state = result.state;
  const duration = result.cargoId ? Math.min(510, 130 + result.distance * 85) : 95;
  locked = result.event !== 'move';
  renderPositions(result.cargoId, result.distance);
  if (result.event === 'move') sound(260, 32);
  else sound(result.event === 'moor' || result.event === 'clear' ? 520 : 350, 85, 'triangle');
  if (result.event === 'clear') markComplete();
  if (locked) releaseTimer = setTimeout(() => { locked = false; renderPositions(); }, duration + 40);
}
function undo() {
  if (locked || !history.length) return;
  clearTimeout(clearTimer);
  $('clear-panel').hidden = true;
  state = history.pop();
  renderPositions();
  sound(380, 35);
}
function buildStageButtons() {
  levelGrid.replaceChildren();
  for (const [index, item] of STAGES.entries()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level-button';
    const unlocked = debug || item.id <= save.unlocked;
    const cleared = Object.hasOwn(save.cleared, item.id);
    btn.disabled = !unlocked;
    btn.classList.toggle('level-active', index === stageIndex);
    btn.classList.toggle('level-cleared', cleared);
    btn.innerHTML = `<span>${String(item.id).padStart(3, '0')}</span><small>${!unlocked ? 'LOCKED' : cleared ? `✓ ${save.cleared[item.id]} moves` : 'OPEN'}</small>`;
    btn.addEventListener('click', () => loadStage(index));
    levelGrid.append(btn);
  }
}
function showStages() { buildStageButtons(); stageDialog.showModal(); }
$('stage-button').addEventListener('click', showStages);
$('levels-button').addEventListener('click', showStages);
$('close-dialog').addEventListener('click', () => stageDialog.close());
stageDialog.addEventListener('click', (event) => { if (event.target === stageDialog) stageDialog.close(); });
$('undo-button').addEventListener('click', undo);
$('retry-button').addEventListener('click', () => loadStage(stageIndex));
$('again-button').addEventListener('click', () => loadStage(stageIndex));
$('next-button').addEventListener('click', () => loadStage(stageIndex + 1));
$('sound-button').addEventListener('click', () => { save.sound = !save.sound; persist(); $('sound-button').classList.toggle('sound-on', save.sound); $('sound-button').setAttribute('aria-label', save.sound ? '音をオフにする' : '音をオンにする'); sound(680); });
$('sound-button').classList.toggle('sound-on', save.sound);
for (const btn of document.querySelectorAll('[data-dir]')) btn.addEventListener('click', () => move(btn.dataset.dir));
const keyboard = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R', w:'U', s:'D', a:'L', d:'R' };
window.addEventListener('keydown', (event) => {
  if (stageDialog.open || event.target instanceof HTMLInputElement) return;
  const dir = keyboard[event.key] || keyboard[event.key.toLowerCase()];
  if (dir) { event.preventDefault(); if (!event.repeat) move(dir); }
  if (event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); loadStage(stageIndex); }
});
let touchStart = null;
board.addEventListener('touchstart', (event) => {
  if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
board.addEventListener('touchend', (event) => {
  if (!touchStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
}, { passive: true });
if (debug) {
  window.seakobanDebug = { solveCurrent: () => solve(stage), loadStage: (id) => loadStage(id - 1), getState: () => structuredClone(state) };
  console.info('[SEAKOBAN] debug mode: seakobanDebug.solveCurrent(), loadStage(id), getState()');
}
loadStage(0);
