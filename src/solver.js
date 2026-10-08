import {createState,move} from './engine.js';
const directions=['up','down','left','right'];
const key=s=>`${s.player.y*5+s.player.x}|${s.cargos.map(c=>`${c.y*5+c.x}${c.moored?'m':'f'}`).sort().join(',')}`;
export function solveLevel(level,maxStates=150000){
  const first=createState(level),q=[first],parents=new Map([[key(first),null]]);
  let cursor=0,win=null;
  while(cursor<q.length&&parents.size<=maxStates){
    const s=q[cursor++];if(s.solved){win=s;break;}
    for(const direction of directions){
      const result=move(s,level,direction);if(!result)continue;
      const k=key(result.state);if(parents.has(k))continue;
      parents.set(k,{from:key(s),direction});q.push(result.state);
    }
  }
  if(!win)return {solved:false,explored:parents.size};
  const path=[];let k=key(win);
  while(parents.get(k)){const p=parents.get(k);path.push(p.direction);k=p.from;}
  path.reverse();let state=first,brakes=0;
  for(const d of path){const r=move(state,level,d);if(r.event.brake==='cargo')brakes++;state=r.state;}
  return {solved:true,moves:path.length,pushes:state.pushes,brakes,path,explored:parents.size};
}