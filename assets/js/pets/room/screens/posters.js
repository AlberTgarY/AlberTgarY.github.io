/*******************************************************************************
 * Her farm game's poster in the picker of what she watches on his computer
 * (the dramas' are frames of the clips themselves: clipshows.js). Pixel art 48
 * by 27, drawn a rectangle at a time.
 ******************************************************************************/

export const POSTER = [48, 27]; // px; shown at twice the size
const [W, H] = POSTER;

const INK = "#2b2522";
const SKIN = "#f9d6bd";
const SKIN_SHADE = "#e9b294";
const LIP = "#c4503f";
const BLUSH = "#f7a1b5";
const WHITE = "#fffaf2";
const GOLD = "#f2c14e";
const LIGHT = "#fff1a8";

// Colours: `a` moved a fraction `t` of the way to `b`.
const rgbOf = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function mix(a, b, t) {
  const to = rgbOf(b);
  return (
    "#" +
    rgbOf(a)
      .map((v, i) =>
        Math.round(v + (to[i] - v) * t)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

// A pen on the poster: rectangles and pixels, each colour first passed through `tone` (night dims it).
function penOf(g, tone = (c) => c) {
  const rect = (x, y, w, h, c) => {
    g.fillStyle = tone(c);
    g.fillRect(x, y, w, h);
  };
  return { rect, px: (x, y, c) => rect(x, y, 1, 1, c) };
}

// A small picture given as rows of letters, its top-left at (x, y): each letter's colour from `key`, and
// letters not in it (".") left clear. `flip` mirrors it left to right.
function sprite(p, x, y, rows, key, flip = false) {
  rows.forEach((row, j) => {
    const line = flip ? [...row].reverse().join("") : row;
    for (let i = 0; i < line.length; ) {
      let n = 1;
      while (line[i + n] === line[i]) n++;
      if (key[line[i]]) p.rect(x + i, y + j, n, 1, key[line[i]]);
      i += n;
    }
  });
}

// Draws `draw(pen)` with a 1-px outline all round in `ink`: the shape four times, shifted, in the ink, then
// itself on top.
function outlined(p, ink, draw) {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const rect = (x, y, w, h) => p.rect(x + dx, y + dy, w, h, ink);
    draw({ rect, px: (x, y) => rect(x, y, 1, 1) });
  }
  draw(p);
}

// Bands of colour down the poster from row `y0`, each `step` rows, with a row of checks between bands.
function bands(p, y0, step, colours) {
  colours.forEach((c, k) => {
    const y = y0 + k * step;
    p.rect(0, y, W, k === colours.length - 1 ? H - y : step, c);
    if (k) for (let x = k % 2; x < W; x += 2) p.px(x, y, colours[k - 1]);
  });
}

function sparkle(p, x, y, c = "#fff6c9") {
  p.px(x, y, WHITE);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    p.px(x + dx, y + dy, c);
}

function sun(p, x, y) {
  sprite(p, x - 3, y - 3, ["...y...", ".y...y.", "..###..", "y#####y", "..###..", ".y...y.", "...y..."], { "#": LIGHT, y: "#ffe58a" });
}

function cloud(p, x, y, c = "#ffffff", w = 9) {
  p.rect(x + 2, y, w - 5, 1, c);
  p.rect(x, y + 1, w, 2, c);
  p.rect(x + 1, y + 3, w - 2, 1, mix(c, "#a8b8d0", 0.35));
}

// A thin frame in the drama's colour, its corners picked out.
function frame(p, c) {
  const dark = mix(c, INK, 0.5);
  p.rect(0, 0, W, 1, c);
  p.rect(0, H - 1, W, 1, c);
  p.rect(0, 0, 1, H, c);
  p.rect(W - 1, 0, 1, H, c);
  for (const [x, y] of [
    [1, 1],
    [W - 2, 1],
    [1, H - 2],
    [W - 2, H - 2],
  ])
    p.px(x, y, dark);
}

// The farm on a summer morning: hills and trees, the farmhouse with its chimney smoking, three rows of ripe
// crops, two chickens, and the farmer (straw hat, pink shirt, blue dungarees, as in stardew.js) holding up a
// parsnip she has just pulled, in a wooden frame like the game's.
function stardewPoster(g) {
  const p = penOf(g);
  bands(p, 0, 3, ["#6cc0f0", "#84ccf4", "#9cd8f6", "#b8e4f6"]);
  sun(p, 6, 5);
  cloud(p, 17, 2);
  cloud(p, 29, 5, WHITE, 7);
  sprite(
    p,
    0,
    9,
    ["....######..............########.........", "..###########.......##############.......", "################..##################...."],
    { "#": "#4f9a3a" }
  );
  p.rect(0, 12, W, H, "#5fb03a");
  for (const [x, y] of [
    [3, 7],
    [12, 9],
    [24, 8],
  ]) {
    p.rect(x + 2, y + 4, 1, 3, "#6b4429");
    outlined(p, "#2f6a2a", (q) => q.rect(x, y, 5, 4, "#3f8a32"));
    p.rect(x + 1, y, 2, 1, "#5fb04a");
  }
  // The farmhouse.
  outlined(p, "#4a2a1a", (q) => {
    q.rect(31, 9, 13, 8, "#d8a060");
    for (let k = 0; k < 4; k++) q.rect(30 + k, 8 - k, 15 - k * 2, 1, "#c0392b");
    q.rect(30, 8, 15, 2, "#c0392b");
    q.rect(40, 2, 2, 4, "#8a5a44");
  });
  for (let y = 11; y < 17; y += 2) p.rect(31, y, 13, 1, "#c48a4a");
  p.rect(30, 9, 15, 1, "#8a2a20");
  p.rect(33, 11, 3, 3, "#ffe58a");
  p.px(34, 11, "#8a5a34");
  p.rect(38, 12, 3, 5, "#6b4429");
  p.px(40, 14, GOLD);
  for (const [x, y] of [
    [41, 0],
    [43, 1],
  ])
    p.rect(x, y, 2, 1, "#e8eef4");
  // The fence and the field: three tilled rows, ripe parsnips, cauliflowers and melons.
  for (let x = 0; x < 30; x += 4) p.rect(x, 12, 1, 3, "#8a5a34");
  p.rect(0, 13, 30, 1, "#c48a4a");
  [
    ["#f2e3a0", "#7fc84a"],
    ["#fff8ec", "#5fa83a"],
    ["#e0402e", "#4f9a3a"],
  ].forEach(([crop, leaf], r) => {
    const y = 17 + r * 3;
    p.rect(1, y, 26, 2, "#8a5a34");
    p.rect(1, y + 1, 26, 1, "#6b4429");
    for (let x = 2; x < 26; x += 4) {
      if (x > 12 && x < 22 && r === 0) continue; // where she stands
      p.px(x, y - 2, leaf);
      p.px(x + 2, y - 2, leaf);
      p.px(x + 1, y - 1, leaf);
      p.rect(x, y - 1, 2, 2, crop);
      p.px(x, y - 1, mix(crop, WHITE, 0.5));
    }
  });
  // Two chickens pecking by the house.
  for (const [x, flip] of [
    [33, false],
    [40, true],
  ]) {
    sprite(p, x, 20, [".r....", "kww...", ".wwwww", ".wwwwd", "..o.o."], { r: "#e0402e", k: "#f6cf4a", w: WHITE, d: "#d8d8e0", o: "#f39a33" }, flip);
    p.px(flip ? x + 4 : x + 1, 21, INK);
  }
  farmer(p, 15, 7);
  for (const [x, y] of [
    [23, 3],
    [27, 6],
    [20, 1],
  ])
    sparkle(p, x, y);
  frame(p, "#8a5a34");
}

// The farmer, the top of her hat at (x, y), a parsnip held up in her right hand.
function farmer(p, x, y) {
  outlined(p, "#3a2418", (q) => {
    q.rect(x + 9, y - 3, 2, 4, "#f2e3a0");
    q.rect(x + 9, y + 1, 1, 6, "#f28aa8");
    q.rect(x + 2, y, 5, 2, "#f2d27a");
    q.rect(x, y + 2, 9, 1, "#f2d27a");
    q.rect(x + 1, y + 3, 7, 5, SKIN);
    q.rect(x + 1, y + 8, 7, 4, "#f28aa8");
    q.rect(x, y + 9, 1, 3, "#f28aa8");
    q.rect(x + 2, y + 10, 5, 4, "#3e6fd6");
    q.rect(x + 2, y + 14, 2, 2, "#3e6fd6");
    q.rect(x + 5, y + 14, 2, 2, "#3e6fd6");
    q.rect(x + 2, y + 16, 2, 1, "#6b4429");
    q.rect(x + 5, y + 16, 2, 1, "#6b4429");
  });
  p.rect(x + 2, y + 1, 5, 1, "#e0605a");
  p.rect(x + 3, y, 2, 1, "#fff0b8");
  p.rect(x + 1, y + 3, 7, 1, "#8a5a34");
  p.px(x + 1, y + 4, "#8a5a34");
  p.px(x + 7, y + 4, "#8a5a34");
  p.rect(x + 7, y + 5, 1, 2, SKIN_SHADE);
  p.rect(x + 3, y + 4, 1, 2, INK);
  p.rect(x + 5, y + 4, 1, 2, INK);
  p.px(x + 2, y + 6, BLUSH);
  p.px(x + 6, y + 6, BLUSH);
  p.px(x + 4, y + 7, LIP);
  p.rect(x + 2, y + 8, 1, 2, "#3e6fd6");
  p.rect(x + 6, y + 8, 1, 2, "#3e6fd6");
  p.px(x, y + 12, SKIN);
  p.px(x + 9, y + 1, SKIN);
  p.rect(x + 9, y - 5, 1, 2, "#5fb03a");
  p.px(x + 10, y - 4, "#7fc84a");
  p.px(x + 9, y - 3, WHITE);
  p.rect(x + 5, y + 10, 2, 4, "#2f58b0");
}

// The poster, `g` POSTER px.
export function drawPoster(g) {
  g.clearRect(0, 0, W, H);
  stardewPoster(g);
}
