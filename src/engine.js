export const SIZE=5;
export const DIRECTIONS={up:{dx:0,dy:-1},down:{dx:0,dy:1},left:{dx:-1,dy:0},right:{dx:1,dy:0}};
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const inside=p=>p.x>=0&&p.x<5&&p.y>=0&&p.y<5;
const add=(p,d)=>({x:p.x+d.dx,y:p.y+d.dy});
const goal=(p,l)=>l.goals.some(g=>same(g,p));
export function createState(level){
  const cargos=level.cargos.map(c=>({...c,moored:goal(c,level)}));
  return {player:{...level.player},cargos,moves:0,pushes:0,solved:cargos.every(c=>c.moored)};
}
export function move(state,level,direction){
  const d=DIRECTIONS[direction];if(!d||state.solved)return null;
  const adjacent=add(state.player,d);if(!inside(adjacent))return null;
  const cargo=state.cargos.find(c=>same(c,adjacent));
  if(!cargo)return {state:{...state,player:adjacent,moves:state.moves+1},event:{type:'walk',direction}};
  if(cargo.moored)return null;
  let dest={x:cargo.x,y:cargo.y};let probe=add(dest,d);
  while(inside(probe)&&!state.cargos.some(c=>same(c,probe))){dest=probe;probe=add(dest,d);}
  if(same(dest,cargo))return null;
  const moored=goal(dest,level);
  const cargos=state.cargos.map(c=>c.id===cargo.id?{...c,...dest,moored}:c);
  return {state:{player:{x:cargo.x,y:cargo.y},cargos,moves:state.moves+1,pushes:state.pushes+1,solved:cargos.every(c=>c.moored)},
    event:{type:'push',direction,cargoId:cargo.id,from:{x:cargo.x,y:cargo.y},to:dest,
      distance:Math.abs(dest.x-cargo.x)+Math.abs(dest.y-cargo.y),
      brake:inside(probe)?'cargo':'edge',moored}};
}