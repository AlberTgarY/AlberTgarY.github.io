/*******************************************************************************
 * The pen for her farm game's finer screen (168 x 96 texels, as fine as the
 * clips): a buffer of pixels drawn into directly and put on the canvas once a
 * frame, sprites written out as rows of letters, and the backdrops of the
 * scenes, drawn once and kept.
 ******************************************************************************/

import { hash } from "../../../models/voxels.js";

export const W = 168;
export const H = 96;

// "#rrggbb" as one 32-bit pixel (the canvas's byte order: red first), each colour worked out once.
const PIXEL = new Map();
export function pixel(hex) {
  let v = PIXEL.get(hex);
  if (v === undefined) {
    const n = parseInt(hex.slice(1), 16);
    v = (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
    PIXEL.set(hex, v);
  }
  return v;
}

// A noise value 0-1 for the texel (x, y) and a seed, for scattering tufts, speckles and stars.
export const noise = (x, y, seed = 0) => hash(x, y, seed + 17);

// w x h pixels: drawn with rectangles, single pixels, colours laid over at a strength, and sprites.
export class Bitmap {
  constructor(w = W, h = H) {
    this.w = w;
    this.h = h;
    this.data = new Uint32Array(w * h);
  }
  px(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = pixel(c);
  }
  rect(x, y, w, h, c) {
    const v = pixel(c);
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x) + w);
    const y1 = Math.min(this.h, Math.round(y) + h);
    for (let j = y0; j < y1; j++) this.data.fill(v, j * this.w + x0, j * this.w + Math.max(x0, x1));
  }
  // `c` laid over the rectangle at strength `a` (0-1): light, shade, the night. Pixels never drawn on stay
  // clear (a layer to lay over another).
  tint(x, y, w, h, c, a) {
    const v = pixel(c);
    const [r, g, b] = [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff];
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x) + w);
    const y1 = Math.min(this.h, Math.round(y) + h);
    for (let j = y0; j < y1; j++)
      for (let i = x0; i < x1; i++) {
        const o = j * this.w + i;
        const d = this.data[o];
        if (!d) continue;
        const dr = d & 0xff;
        const dg = (d >> 8) & 0xff;
        const db = (d >> 16) & 0xff;
        this.data[o] = (0xff000000 | ((db + (b - db) * a) << 16) | ((dg + (g - dg) * a) << 8) | (dr + (r - dr) * a)) >>> 0;
      }
  }
  // A sprite (sprite()) with its top left at (x, y), facing the other way if `flip`.
  draw(s, x, y, flip = false) {
    x = Math.round(x);
    y = Math.round(y);
    for (let j = 0; j < s.h; j++) {
      const ty = y + j;
      if (ty < 0 || ty >= this.h) continue;
      for (let i = 0; i < s.w; i++) {
        const v = s.data[j * s.w + (flip ? s.w - 1 - i : i)];
        const tx = x + i;
        if (v && tx >= 0 && tx < this.w) this.data[ty * this.w + tx] = v;
      }
    }
  }
  copy(from) {
    this.data.set(from.data);
  }
}

// A sprite from its rows of letters and what colour each letter is ("." is clear), made once per rows and
// colours.
const SPRITES = new WeakMap();
export function sprite(rows, colours) {
  let made = SPRITES.get(rows);
  if (!made) SPRITES.set(rows, (made = new Map()));
  const key = Object.entries(colours).join();
  let s = made.get(key);
  if (!s) {
    const w = Math.max(...rows.map((r) => r.length));
    s = { w, h: rows.length, data: new Uint32Array(w * rows.length) };
    rows.forEach((row, j) => [...row].forEach((ch, i) => ch !== "." && (s.data[j * w + i] = pixel(colours[ch]))));
    made.set(key, s);
  }
  return s;
}

// The scenes' backdrops (what does not move), drawn the first time a scene needs one and kept; the few
// last ones only.
const BACKDROPS = new Map();
export function backdrop(key, build) {
  let b = BACKDROPS.get(key);
  if (!b) {
    b = new Bitmap();
    build(b);
    BACKDROPS.set(key, b);
    if (BACKDROPS.size > 6) BACKDROPS.delete(BACKDROPS.keys().next().value);
  }
  return b;
}

// Digits three texels wide and five high, each with a dark texel to its lower right so it reads on anything.
const DIGITS = [
  "111101101101111",
  "010110010010111",
  "111001111100111",
  "111001111001111",
  "101101111001001",
  "111100111001111",
  "111100111101111",
  "111001010010010",
  "111101111101111",
  "111101111001111",
];
export function digits(b, n, x, y, c, shadow = null) {
  const at = [...String(n)].flatMap((d, k) => [...DIGITS[+d]].flatMap((on, i) => (on === "1" ? [[x + k * 4 + (i % 3), y + Math.floor(i / 3)]] : [])));
  if (shadow) for (const [dx, dy] of at) b.px(dx + 1, dy + 1, shadow);
  for (const [dx, dy] of at) b.px(dx, dy, c);
}

// Capital letters three texels wide and five high (the stops one wide), for the game's words: letters,
// what people say, the TV.
const GLYPHS = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101110011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "?": "110001010000010",
  "-": "000000111000000",
  " ": "000000000000000",
  ...Object.fromEntries(DIGITS.map((d, k) => [k, d])),
};
const STOPS = { "!": "11101", ".": "00001", ",": "00011", "'": "11000", ":": "01010" };
export const textWidth = (s) => [...s].reduce((n, ch) => n + (STOPS[ch] ? 2 : 4), -1);
// `s` from (x, y), in `c`, a shadow below and right if `shadow`.
export function text(b, s, x, y, c, shadow = null) {
  for (const [colour, dx] of shadow
    ? [
        [shadow, 1],
        [c, 0],
      ]
    : [[c, 0]]) {
    let at = x + dx;
    for (const ch of s.toUpperCase()) {
      const stop = STOPS[ch];
      const bits = stop || GLYPHS[ch] || GLYPHS[" "];
      const cols = stop ? 1 : 3;
      for (let i = 0; i < bits.length; i++) if (bits[i] === "1") b.px(at + (i % cols), y + dx + Math.floor(i / cols), colour);
      at += cols + 1;
    }
  }
}
// Lines of words written out up to `shown` letters in all (as they come up in the game), from (x, y), `gap` apart.
export function lines(b, said, shown, x, y, c, shadow = null, gap = 7) {
  let left = Math.floor(shown);
  said.forEach((line, k) => {
    if (left > 0) text(b, line.slice(0, left), x, y + k * gap, c, shadow);
    left -= line.length;
  });
}
export const letters = (said) => said.reduce((n, line) => n + line.length, 0);
