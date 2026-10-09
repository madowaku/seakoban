import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../src/levels.js';
import {createState,move} from '../src/engine.js';
import {solveLevel} from '../src/solver.js';
test('glides past a goal until the sea edge',()=>{
 const l={player:{x:0,y:2},cargos:[{id:'a',x:1,y:2}],goals:[{x:2,y:2}]};
 const r=move(createState(l),l,'right');
 assert.equal(r.state.cargos[0].x,4);assert.equal(r.state.cargos[0].moored,false);
});
test('brakes on other cargo; moored cargo is immovable',()=>{
 const l={player:{x:0,y:2},cargos:[{id:'a',x:1,y:2},{id:'b',x:3,y:2}],goals:[{x:2,y:2},{x:3,y:4}]};
 const r=move(createState(l),l,'right');
 assert.equal(r.event.brake,'cargo');assert.equal(r.state.cargos[0].moored,true);
 assert.equal(move(r.state,l,'right'),null);
});
test('all stages are solvable and stage 003+ use cargo brakes',()=>{
 const expected=[1,6,5,8,12,13,14,16,20,23,16,18,20,22,22,22,24,26,30,41];
 for(const [i,l] of LEVELS.entries()){
  const r=solveLevel(l);
  assert.equal(r.solved,true,`stage ${l.id}`);
  assert.equal(r.moves,expected[i],`stage ${l.id} min moves`);
  if(i>=2)assert.ok(r.brakes>=1,`stage ${l.id} brake`);
  let state=createState(l);
  for(const d of r.path){const res=move(state,l,d);assert.ok(res);state=res.state;}
  assert.ok(state.solved);
 }
});