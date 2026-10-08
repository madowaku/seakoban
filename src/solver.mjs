import { initialState, stateKey, transition } from './logic.mjs';

/** Breadth-first search over individual boat moves (not just pushes). */
export function solve(stage, maxStates = 250_000) {
  const start = initialState(stage);
  const seen = new Set([stateKey(start)]);
  const queue = [{ state: start, path: '' }];
  let head = 0;
  while (head < queue.length) {
    const { state, path } = queue[head++];
    if (state.complete) return { path, moves: path.length, pushes: state.pushes, visited: seen.size };
    for (const dir of 'UDLR') {
      const { state: next } = transition(state, dir);
      if (next === state) continue;
      const key = stateKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size > maxStates) throw new Error('BFS state limit exceeded');
      queue.push({ state: next, path: path + dir });
    }
  }
  return null;
}
