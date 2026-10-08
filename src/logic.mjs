import { DIRECTIONS, SIZE, unpack } from './stages.mjs';

const same = (a, b) => a.x === b.x && a.y === b.y;
const inside = ({ x, y }) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;
const add = (pos, dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y });

export function initialState(stage) {
  const { player, cargo, goals } = unpack(stage);
  return {
    player, cargo, goals,
    moves: 0, pushes: 0,
    complete: cargo.length > 0 && cargo.every((c) => goals.some((g) => same(c, g))),
  };
}

export function transition(state, arrow) {
  const dir = DIRECTIONS[arrow];
  if (!dir || state.complete) return { state, event: 'blocked', distance: 0 };
  const adjacent = add(state.player, dir);
  if (!inside(adjacent)) return { state, event: 'blocked', distance: 0 };
  const target = state.cargo.find((c) => same(c, adjacent));
  if (!target) {
    return {
      state: { ...state, player: adjacent, moves: state.moves + 1 },
      event: 'move', distance: 1,
    };
  }
  if (target.moored) return { state, event: 'blocked', distance: 0 };

  let landing = adjacent;
  let distance = 0;
  while (true) {
    const ahead = add(landing, dir);
    if (!inside(ahead) || state.cargo.some((c) => same(c, ahead))) break;
    landing = ahead;
    distance++;
  }
  if (!distance) return { state, event: 'blocked', distance: 0 };

  const moored = state.goals.some((g) => same(g, landing));
  const cargo = state.cargo.map((c) => c.id === target.id ? { ...c, ...landing, moored } : c);
  const complete = cargo.every((c) => c.moored);
  return {
    state: {
      ...state,
      player: adjacent, cargo,
      moves: state.moves + 1, pushes: state.pushes + 1,
      complete,
    },
    event: complete ? 'clear' : moored ? 'moor' : 'push',
    cargoId: target.id,
    distance,
  };
}

export function stateKey(state) {
  return [state.player.x, state.player.y,
    ...state.cargo.flatMap((c) => [c.x, c.y, c.moored ? 1 : 0])].join(',');
}

export function validateStage(stage) {
  if (stage.rows.length !== SIZE || stage.rows.some((r) => r.length !== SIZE || /[^.PoA-C]/.test(r))) return false;
  const p = stage.rows.join('');
  const { player, cargo, goals } = unpack(stage);
  return p.split('P').length === 2 && !!player && cargo.length > 0 && cargo.length === goals.length
    && new Set(cargo.map((c) => c.id)).size === cargo.length;
}
