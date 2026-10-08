import {LEVELS} from './levels.js';
import {createState,move} from './engine.js';
import {solveLevel} from './solver.js';
const $=id=>document.getElementById(id),board=$('board'),storage='seakoban-v01';
let progress={unlocked:1,cleared:[],best:{},sound:false};
try{progress={...progress,...JSON.parse(localStorage.getItem(storage)||'{}')};}catch{}
function save(){try{localStorage.setItem(storage,JSON.stringify(progress));}catch{}}
let idx=0,level=LEVELS[0],state=createState(level),history=[],busy=false,cargos=new Map(),boat,timeout,audio;
const boatSVG=`<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="52" rx="27" ry="6" fill="#035773" opacity=".3"/><path d="M8 38H56L49 53Q31 58 16 53Z" fill="#ef8b52" stroke="#9d4a37" stroke-width="2"/><path d="M21 20H43L47 38H18Z" fill="#fff0d8" stroke="#435b69" stroke-width="2"/><rect x="25" y="25" width="14" height="10" rx="2" fill="#59c9dd" stroke="#48616c"/><path d="M32 20V13" stroke="#364d58" stroke-width="3"/><path d="M14 43H50" stroke="#ffe2b5" stroke-width="3"/></svg>`;
function position(el,p,time=0){el.style.setProperty('--x',p.x);el.style.setProperty('--y',p.y);el.style.setProperty('--travel',time+'ms');}
function rebuild(){
 board.replaceChildren();cargos=new Map();
 for(let y=0;y<5;y++)for(let x=0;x<5;x++){let cell=document.createElement('div');cell.className='cell';position(cell,{x,y});board.append(cell);}
 for(const p of level.goals){let el=document.createElement('div');el.className='entity goal';el.innerHTML='<span class="buoy"></span>';position(el,p);board.append(el);}
 state.cargos.forEach((c,i)=>{let el=document.createElement('div');el.className='entity cargo';el.innerHTML=`<div class="crate-wrap"><div class="crate"><b>${String(i+1).padStart(2,'0')}</b></div></div>`;position(el,c);board.append(el);cargos.set(c.id,el);});
 boat=document.createElement('div');boat.className='entity player';boat.innerHTML=boatSVG;position(boat,state.player);board.append(boat);
}
function announce(s){$('live').textContent=s;}
function draw(time=0,event=null){
 $('moves').textContent=String(state.moves).padStart(2,'0');
 const done=state.cargos.filter(c=>c.moored).length;
 $('bar-fill').style.width=(100*done/state.cargos.length)+'%';$('count').textContent=`${done} / ${state.cargos.length}`;
 $('undo').disabled=busy||!history.length;
 if(event){boat.style.setProperty('--heading',{up:'0deg',right:'90deg',down:'180deg',left:'270deg'}[event.direction]);}
 position(boat,state.player,time?105:0);
 for(const c of state.cargos){const el=cargos.get(c.id);el.classList.toggle('moored',c.moored);position(el,c,event?.cargoId===c.id?time:0);}
}
function setStage(i){
 if(i<0||i>=LEVELS.length||i+1>progress.unlocked)return;
 clearTimeout(timeout);idx=i;level=LEVELS[i];state=createState(level);history=[];busy=false;
 $('victory').hidden=true;$('selector').hidden=true;
 $('voyage').textContent=`${String(level.id).padStart(2,'0')} / 10`;
 $('title').textContent=level.title;$('lesson').textContent=level.lesson;
 rebuild();draw();announce(`ステージ${level.id}、${level.title}`);
}
function sound(freq=350,dur=.1){
 if(!progress.sound)return;
 try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;audio ||=new A();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}
}
function ripple(p){let e=document.createElement('div');e.className='entity splash';position(e,p);board.append(e);setTimeout(()=>e.remove(),600);}
function step(direction){
 if(busy||!$('victory').hidden||!$('selector').hidden)return;
 const r=move(state,level,direction);if(!r){sound(140,.05);return;}
 history.push(state);state=r.state;const event=r.event;
 const time=event.type==='push'?Math.min(490,145+72*event.distance):110;
 busy=true;draw(time,event);sound(event.type==='push'?230:400,.09);
 timeout=setTimeout(()=>{
  busy=false;$('undo').disabled=!history.length;
  if(event.type==='push'){ripple(event.to);sound(event.moored?660:320,.17);announce(event.moored?'係留成功！':event.brake==='cargo'?'荷物でブレーキ！':'海の端で停止');}
  if(state.solved)complete();
 },time+30);
}
function complete(){
 progress.cleared=[...new Set([...progress.cleared,level.id])];progress.best[level.id]=Math.min(progress.best[level.id]||Infinity,state.moves);
 progress.unlocked=Math.max(progress.unlocked,Math.min(10,level.id+1));save();
 $('finished-moves').textContent=String(state.moves).padStart(2,'0');
 $('victory-title').textContent=level.id===10?'ALL CLEAR!':'係留完了！';
 $('next').textContent=level.id===10?'STAGESへ戻る →':'NEXT VOYAGE →';
 $('victory').hidden=false;$('next').focus();sound(780,.3);
}
function undo(){if(busy||!history.length)return;$('victory').hidden=true;state=history.pop();draw();announce('一手戻しました');}
function choose(){
 const list=$('level-list');list.replaceChildren();
 LEVELS.forEach((l,i)=>{
  const el=document.createElement('button');const unlocked=l.id<=progress.unlocked;
  el.className=(progress.cleared.includes(l.id)?'done ':'')+(idx===i?'now':'');
  el.disabled=!unlocked;el.innerHTML=`<strong>${String(l.id).padStart(2,'0')}</strong><small>${unlocked?l.title:'LOCKED'}</small>`;
  el.addEventListener('click',()=>setStage(i));list.append(el);
 });
 $('selector').hidden=false;$('close').focus();
}
$('undo').onclick=undo;$('retry').onclick=()=>setStage(idx);$('again').onclick=()=>setStage(idx);
$('stages').onclick=choose;$('close').onclick=()=>{$('selector').hidden=true;};
$('next').onclick=()=>{if(idx===9){$('victory').hidden=true;choose();}else setStage(idx+1);};
$('sound').onclick=()=>{progress.sound=!progress.sound;$('sound').textContent=progress.sound?'♪ ON':'♪ OFF';save();sound(640,.1);};
$('sound').textContent=progress.sound?'♪ ON':'♪ OFF';
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>step(b.dataset.dir)));
document.addEventListener('keydown',e=>{
 const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'}[e.key];
 if(dir){e.preventDefault();step(dir);}
 else if(e.key==='Backspace'||e.key.toLowerCase()==='z'){e.preventDefault();undo();}
 else if(e.key.toLowerCase()==='r'){setStage(idx);}
 else if(e.key==='Escape'){$('selector').hidden=true;}
});
let touch=null;
board.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};});
board.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;step(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
board.addEventListener('pointercancel',()=>touch=null);
$('selector').addEventListener('click',e=>{if(e.target===$('selector'))$('selector').hidden=true;});
if(new URLSearchParams(location.search).has('debug')){window.SEAKOBAN_DEBUG={LEVELS,solveLevel,getState:()=>state,setStage};console.table(LEVELS.map(l=>({stage:l.id,...solveLevel(l)})).map(({stage,solved,moves,pushes,brakes})=>({stage,solved,moves,pushes,brakes})));}
setStage(0);