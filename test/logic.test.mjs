import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.mjs';
import { initialState, transition, validateStage } from '../src/logic.mjs';
import { solve } from '../src/solver.mjs';

const expected = [3, 6, 11, 8, 13, 15, 14, 24, 20, 18];
for (const [i, stage] of STAGES.entries()) {
  test(`Stage ${String(stage.id).padStart(3, '0')}: valid and BFS-solvable`, () => {
    assert.equal(validateStage(stage), true);
    const solution = solve(stage);
    assert.ok(solution);
    assert.equal(solution.moves, expected[i]);
    let state = initialState(stage);
    for (const dir of solution.path) state = transition(state, dir).state;
    assert.equal(state.complete, true);
    assert.equal(state.moves, solution.moves);
  });
}

test('a cargo drifts past an interior goal instead of stopping on it', () => {
  const state = { player:{x:0,y:0}, cargo:[{id:'A',x:1,y:0,moored:false}], goals:[{x:2,y:0}], moves:0,pushes:0,complete:false };
  const result = transition(state, 'R');
  assert.deepEqual([result.state.cargo[0].x,result.state.cargo[0].y], [4,0]);
  assert.equal(result.state.cargo[0].moored, false);
  assert.equal(result.distance, 3);
});

test('a second cargo brakes the moving cargo', () => {
  const state = {player:{x:0,y:0}, cargo:[{id:'A',x:1,y:0,moored:false},{id:'B',x:4,y:0,moored:false}], goals:[{x:3,y:0},{x:4,y:4}],moves:0,pushes:0,complete:false};
  const result = transition(state,'R');
  assert.equal(result.state.cargo[0].x,3);
  assert.equal(result.state.cargo[0].moored,true);
  assert.equal(result.event,'moor');
});

test('moored cargo cannot be pushed again', () => {
  const state = {player:{x:0,y:0}, cargo:[{id:'A',x:1,y:0,moored:true}], goals:[{x:1,y:0}], moves:2,pushes:1,complete:false};
  assert.equal(transition(state,'R').state,state);
});

test('cargo blocked by immediately adjacent cargo does not move', () => {
  const state = {player:{x:0,y:0}, cargo:[{id:'A',x:1,y:0,moored:false},{id:'B',x:2,y:0,moored:false}], goals:[{x:3,y:3},{x:4,y:4}],moves:0,pushes:0,complete:false};
  assert.equal(transition(state,'R').state,state);
});

test('undo-safe: transition does not mutate its previous state', () => {
  const start = initialState(STAGES[0]);
  const snapshot = JSON.stringify(start);
  transition(start,'D');
  assert.equal(JSON.stringify(start),snapshot);
});
