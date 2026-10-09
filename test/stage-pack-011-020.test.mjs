import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { createState, move } from '../src/engine.js';
import { solveLevel } from '../src/solver.js';

test('Stage Pack 001–020 keeps all original stages and adds ten valid voyages', () => {
  assert.equal(LEVELS.length, 20);
  assert.deepEqual(LEVELS.map(l => l.id), Array.from({ length: 20 }, (_, i) => i + 1));
  for (const level of LEVELS) {
    assert.equal(level.cargos.length, level.goals.length, 'cargo/goal mismatch: ' + level.id);
    const key = p => p.x + ',' + p.y;
    const positions = [level.player, ...level.cargos].map(key);
    assert.equal(new Set(positions).size, positions.length, 'overlapping actors: ' + level.id);
    assert.equal(new Set(level.goals.map(key)).size, level.goals.length, 'duplicate goal: ' + level.id);
    for (const p of [...level.cargos, level.player, ...level.goals]) {
      assert.ok(p.x >= 0 && p.x < 5 && p.y >= 0 && p.y < 5, 'out of board: ' + level.id);
    }
  }
  assert.deepEqual(LEVELS.slice(0, 10).map(l => l.title), [
    'ぷかっ', 'かどまがり', 'うけとめて', 'ブレーキ',
    'まわり道', '二度受け', '役目を終えたら', '海の連鎖',
    '仮置き場', 'FLOAT PLAN'
  ]);
});

for (const level of LEVELS.slice(10)) {
  test('Stage ' + String(level.id).padStart(3, '0') + ' is solvable through cargo brakes', () => {
    const result = solveLevel(level);
    assert.ok(result.solved, 'unsolved stage ' + level.id);
    assert.ok(result.brakes >= 2, 'not enough cargo brakes: ' + level.id);
    assert.ok(result.pushes >= 4, 'not enough cargo pushes: ' + level.id);
    assert.ok(result.moves >= 16, 'short-circuit solution: ' + level.id);
    assert.equal(level.cargos.length, level.id >= 16 ? 4 : 3);
    let state = createState(level), brakeCount = 0;
    for (const direction of result.path) {
      const step = move(state, level, direction);
      assert.ok(step, 'solver returned an invalid move: ' + level.id);
      if (step.event.brake === 'cargo') brakeCount++;
      state = step.state;
    }
    assert.equal(state.solved, true);
    assert.equal(state.moves, result.moves);
    assert.equal(brakeCount, result.brakes);
  });
}
