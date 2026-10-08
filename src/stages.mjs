// Five-column boards: P = tugboat, A-C = cargo, o = mooring buoy, . = sea.
export const STAGES = [
  { id: 1, name: 'ぷかっ', tip: '荷物は端まで漂う。右へ押してみよう。', rows: ['.....', '.....', '.P...', '.....', '..A.o'] },
  { id: 2, name: 'かどまがり', tip: '端で止めてから、別の方向へ。', rows: ['....o', '.....', '.....', '...A.', '...P.'] },
  { id: 3, name: 'うけとめて', tip: '先に係留した荷物が、次の荷物のブレーキになる。', rows: ['...Ao', '....o', '....B', 'P....', '.....'] },
  { id: 4, name: 'まんなか', tip: '別の荷物で止めると、海の途中でも曲がれる。', rows: ['.....', '..P..', 'oA.B.', '.....', '..o..'] },
  { id: 5, name: '先に置く', tip: '先にゴールした荷物を、後から利用しよう。', rows: ['..ooP', '...A.', '.B...', '.....', '.....'] },
  { id: 6, name: '三段係留', tip: '一つの荷物が、別の荷物の停止位置を作る。', rows: ['oo...', '.o...', 'ABC..', '.....', '...P.'] },
  { id: 7, name: '役割交代', tip: 'ブレーキだった荷物も、あとで運ぶ。', rows: ['..o..', '.A...', 'Po...', '.B.C.', '...o.'] },
  { id: 8, name: '二重ブレーキ', tip: '止めた荷物を使って、さらに別の荷物を止めよう。', rows: ['P..Ao', 'oB...', '.....', '...C.', '..o..'] },
  { id: 9, name: '仮置き場', tip: 'ゴール以外の場所にも、意味のある停止位置がある。', rows: ['o....', '.AB.o', '....P', '.C...', '...o.'] },
  { id: 10, name: 'FLOAT PLAN', tip: '最後に止めたい場所から、ブレーキの位置を逆算。', rows: ['.P...', '.A.B.', '....o', '..C..', 'o..o.'] },
];

export const SIZE = 5;
export const DIRECTIONS = Object.freeze({
  U: { x: 0, y: -1 }, D: { x: 0, y: 1 },
  L: { x: -1, y: 0 }, R: { x: 1, y: 0 },
});

export function unpack(stage) {
  const goals = [];
  const cargo = [];
  let player = null;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const token = stage.rows[y]?.[x];
      if (token === 'P') player = { x, y };
      if (token === 'o') goals.push({ x, y });
      if (token && /^[A-C]$/.test(token)) cargo.push({ id: token, x, y, moored: false });
    }
  }
  return { goals, cargo, player };
}
