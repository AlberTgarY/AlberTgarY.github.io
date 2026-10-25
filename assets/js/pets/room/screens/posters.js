/*******************************************************************************
 * The posters in the picker of what she watches: key art for each drama (its
 * two leads from the chest up, in their setting, with the drama's things about
 * them), a poster for each episode (its key moment, found from the episode's
 * shots: an embrace under fireworks, tears in the rain, the rival looming, a
 * sword fight...), and one for her farm game. Pixel art 48 by 27, drawn a
 * rectangle at a time.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { seriesOf } from "./dramas.js";

export const POSTER = [48, 27]; // px; shown at twice the size
const [W, H] = POSTER;

const INK = "#2b2522";
const SKIN = "#f9d6bd";
const SKIN_SHADE = "#e9b294";
const LIP = "#c4503f";
const MOUTH = "#7a2a2a";
const BLUSH = "#f7a1b5";
const BLUSH_DEEP = "#f0708e";
const TEAR = "#8fd3ff";
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
const NIGHT = "#141a3c";

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

/* The cast. ---------------------------------------------------------------- */

// Each drama's three people as its posters draw them: hair and clothes as on the screen (DRAMA_LOOK in
// dramas.js), a hair style (HAIR), a collar (COLLAR), the trim or accent of their clothes, lashes for the
// heroines, and their eye colour where it is not brown.
const CAST = {
  palace: {
    a: { hair: "#2b2522", clothes: "#f7b8cc", style: "crown", collar: "robe", trim: GOLD },
    b: { hair: "#2b2522", clothes: "#b8a0e0", style: "bun", collar: "robe", trim: GOLD, lash: true },
    c: { hair: "#2b2522", clothes: "#d0a020", style: "bun", collar: "robe", trim: "#c0392b", lash: true },
  },
  rain: {
    a: { hair: "#2b2522", clothes: "#3e4f7a", style: "short", collar: "coat", trim: "#d8d8e0" },
    b: { hair: "#47281b", clothes: "#f2e3c4", style: "long", collar: "tee", trim: "#c8a878", lash: true },
    c: { hair: "#8a5a34", clothes: "#2a2a2a", style: "slick", collar: "coat", trim: "#8a2a2a" },
  },
  hospital: {
    a: { hair: "#2b2522", clothes: "#ffffff", style: "short", collar: "labcoat", trim: "#8fc0e8" },
    b: { hair: "#5e3624", clothes: "#8fc0e8", style: "pony", collar: "scrubs", trim: "#5e8fc0", lash: true },
    c: { hair: "#c0c0c0", clothes: "#8fc0e8", style: "slick", collar: "labcoat", trim: "#3e5f8a" },
  },
  detective: {
    a: { hair: "#3b3330", clothes: "#c9a878", style: "hat", collar: "trench", trim: "#5a4632", hat: "#4a3a2e" },
    b: { hair: "#47281b", clothes: "#8a6f9a", style: "bob", collar: "blouse", trim: WHITE, lash: true },
    c: { hair: "#1a1416", clothes: "#6a1a1a", style: "slick", collar: "coat", trim: "#1a1416", eye: "#c0392b" },
  },
  campus: {
    a: { hair: "#2b2522", clothes: "#3a4f8a", style: "short", collar: "blazer", trim: "#c0392b" },
    b: { hair: "#8a4a2a", clothes: "#3a4f8a", style: "twin", collar: "sailor", trim: "#e0605a", lash: true },
    c: { hair: "#f2c14e", clothes: "#3a4f8a", style: "long", collar: "sailor", trim: "#e0605a", lash: true },
  },
  wuxia: {
    a: { hair: "#1a1416", clothes: "#f2f2f2", style: "topknot", collar: "robe", trim: "#3e6f8a" },
    b: { hair: "#1a1416", clothes: "#4a4f5a", style: "long", collar: "robe", trim: "#c0392b", lash: true },
    c: { hair: "#8a8f97", clothes: "#6a1a1a", style: "topknot", collar: "robe", trim: "#1a1416", eye: "#8a2020" },
  },
  sitcom: {
    a: { hair: "#5e3624", clothes: "#3e6fd6", style: "short", collar: "tee", trim: "#2a4fa0" },
    b: { hair: "#f2c14e", clothes: "#e05aa0", style: "curly", collar: "tee", trim: "#b03a78", lash: true },
    c: { hair: "#c0c0c0", clothes: "#9b59d0", style: "bun", collar: "cardigan", trim: "#f2f2f2", lash: true, glasses: true },
  },
  cafe: {
    a: { hair: "#2b2522", clothes: "#3f7a5a", style: "short", collar: "apron", trim: "#f2e3c4" },
    b: { hair: "#47281b", clothes: "#f28aa8", style: "bob", collar: "tee", trim: "#c0587a", lash: true },
    c: { hair: "#5e3624", clothes: "#2a2a2a", style: "slick", collar: "coat", trim: "#d8d8e0" },
  },
  office: {
    a: { hair: "#2b2522", clothes: "#2f3b55", style: "slick", collar: "suit", trim: "#8a2a3a" },
    b: { hair: "#5e3624", clothes: "#f2f2f2", style: "pony", collar: "blouse", trim: "#3e5f8a", lash: true },
    c: { hair: "#8a8f97", clothes: "#4a4f5a", style: "slick", collar: "suit", trim: "#1a1416" },
  },
  idol: {
    a: { hair: "#f2c14e", clothes: "#e05aa0", style: "twin", collar: "idol", trim: "#8fd3ff", lash: true, eye: "#c0407a" },
    b: { hair: "#2b2522", clothes: "#f2f2f2", style: "spiky", collar: "coat", trim: "#2b2522" },
    c: { hair: "#2b2522", clothes: "#1a1a1a", style: "long", collar: "coat", trim: "#8a2a5a", lash: true },
  },
  immortal: {
    a: { hair: "#1a1416", clothes: "#f2f2f2", style: "crown", collar: "robe", trim: "#8fc0e8", eye: "#5a4a8a" },
    b: { hair: "#1a1416", clothes: "#c03a3a", style: "long", collar: "robe", trim: GOLD, lash: true },
    c: { hair: "#f2f2f2", clothes: "#3a1f4a", style: "long", collar: "robe", trim: "#9b59d0", eye: "#e0402e" },
  },
  seaside: {
    a: { hair: "#5e3624", clothes: "#f6cf4a", style: "short", collar: "hawaii", trim: "#e0605a" },
    b: { hair: "#2b2522", clothes: "#3e8fd6", style: "flower", collar: "straps", trim: "#f28aa8", lash: true },
    c: { hair: "#f2c14e", clothes: "#e05aa0", style: "pony", collar: "straps", trim: "#f6cf4a", lash: true },
  },
};

// The hair styles, on a grid from 3 px left of the face and 6 px above it (the face is 10 by 10): `front`
// over the face, `back` behind the head and neck. Letters: # hair, + its shine, - its shade, o the trim
// colour (a ribbon, a pin's bead), g gold, h a hat.
const HAIR = {
  short: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..#####.####-#..",
      "..##.#...#..##..",
      "..#..........#..",
    ],
  },
  slick: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      "..##++++######..",
      "..###########-..",
      "..###########-..",
      "..#########--#..",
      "..#.....####-#..",
      "..#..........#..",
    ],
  },
  spiky: {
    front: [
      "................",
      ".....#..#..#....",
      "....##.##.##....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..##.####.##-#..",
      "..#..#...#..##..",
      "..#..........#..",
    ],
  },
  long: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..############..",
      "..#.##.##.##.#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..##........##..",
      ".###........###.",
      ".##..........##.",
      ".#............#.",
    ],
    back: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..############..",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
      ".##############.",
    ],
  },
  flower: {
    front: [
      "................",
      "................",
      "....########.oo.",
      "...#########oyo.",
      "..###+++#####oo.",
      "..###########-..",
      "..###########-..",
      "..############..",
      "..#.##.##.##.#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..##........##..",
      ".###........###.",
      ".##..........##.",
      ".#............#.",
    ],
    back: "long",
  },
  bun: {
    front: [
      "......####......",
      ".....######g....",
      "...#########gg..",
      "..###+++####.o..",
      "..###########-..",
      "..###########-..",
      "..###########-..",
      "..####....####..",
      "..##........##..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..o..........o..",
    ],
  },
  crown: {
    front: [
      "......gggg......",
      "......g##g......",
      "....########....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..#####-#####-..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..##........##..",
    ],
    back: "long",
  },
  topknot: {
    front: [
      "......##........",
      "......##oo......",
      "....######.o....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..####-######-..",
      "..#.#........#..",
      "..#..#.......#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..#..........#..",
      "..##........##..",
    ],
    back: "long",
  },
  pony: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      "..###+++######o.",
      "..###########-##",
      "..###########-.#",
      "..#####.######.#",
      "..##.#...#..##.#",
      "..#..........#.#",
      "..#..........#.#",
      "..............##",
      "..............#.",
    ],
  },
  twin: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      ".o###+++######o.",
      "#############-##",
      "#.###########-.#",
      "#.############.#",
      "#.#.##.##.##.#.#",
      "#.#..........#.#",
      "##............##",
      "#..............#",
      "#..............#",
      "##............##",
      ".#............#.",
    ],
  },
  bob: {
    front: [
      "................",
      "................",
      "....########....",
      "...##########...",
      "..###+++######..",
      "..###########-..",
      "..###########-..",
      "..############..",
      "..############..",
      "..##........##..",
      "..##........##..",
      "..##........##..",
      "..##........-#..",
      ".###........-##.",
      ".-#..........#-.",
    ],
  },
  curly: {
    front: [
      "................",
      ".....#.##.#.....",
      "...##########...",
      "..############..",
      ".###++++######-.",
      ".#############-.",
      ".##############.",
      ".###.######.###.",
      ".##.#.#..#.#.##.",
      ".##..........##.",
      ".##..........##.",
      "..#..........#..",
      ".##..........##.",
      ".#-..........-#.",
    ],
  },
  hat: {
    front: [
      "................",
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....oooooooo....",
      ".hhhhhhhhhhhhhh.",
      "..##########-#..",
      "..#..........#..",
      "..#..........#..",
    ],
  },
};
for (const style of Object.values(HAIR)) if (typeof style.back === "string") style.back = HAIR[style.back].back;

// The eyes for each look: the left eye on a grid 3 px wide (its outer edge first) from the face's row 3 to its
// row 6; the right eye is the same, mirrored. Letters: k ink, l the heroines' lashes, w white, i iris, j the
// iris's light, b a tear welling up.
const EYES = {
  open: ["...", "lkk", ".wk", ".ij"],
  happy: ["...", "...", ".k.", "k.k"],
  glossy: ["...", "lkk", ".wk", ".bb"],
  half: ["...", "...", "lkk", ".ij"],
  wide: ["...", ".kk", ".wk", ".ww"],
  narrow: ["...", "...", "kkk", ".ik"],
  shut: ["...", "...", "...", "lkk"],
};

// The mouth for each look, on a grid 4 px wide from the face's row 7 to its row 9. Letters: m lip, s a dimple,
// M the open mouth, t tongue, w teeth, p a kiss.
const MOUTHS = {
  line: ["....", ".ss.", "...."],
  smile: ["s..s", ".mm.", "...."],
  open: [".MM.", "MttM", "...."],
  small: ["....", ".pp.", "...."],
  frown: ["....", ".mm.", "m..m"],
  o: ["....", ".MM.", ".MM."],
  grit: ["....", "MwwM", "...."],
  kiss: ["....", ".p..", "...."],
};

// A face (as dramas.js names them): its eyes, mouth, and brows, blush, tears, a drop of sweat or a cross vein.
const FACE = {
  none: { eyes: "open", mouth: "line" },
  smile: { eyes: "open", mouth: "smile" },
  blush: { eyes: "half", mouth: "small", blush: true },
  laugh: { eyes: "happy", mouth: "open" },
  tears: { eyes: "glossy", mouth: "frown", brows: "sad", tears: true },
  sad: { eyes: "half", mouth: "frown", brows: "sad" },
  shock: { eyes: "wide", mouth: "o", sweat: true },
  angry: { eyes: "narrow", mouth: "grit", brows: "angry", vein: true },
  kiss: { eyes: "shut", mouth: "kiss", blush: true },
};

// The collars, on a grid from the face's left edge at the neck (10 px under the face's top), 10 px wide.
// Letters: s skin, S its shade, c the clothes, d their shade, w a white shirt, x the trim, k ink.
const COLLAR = {
  robe: ["...SSSS...", "..xwSSwx..", "...xwSwx..", "....xwwx..", ".....xwx..", "......xx..", "......x..."],
  coat: ["...SSSS...", "..dwSSwd..", "..ddwwdd..", "...dwkd...", "....dkd...", "....ddd..."],
  suit: ["...SSSS...", "..dwSSwd..", "..ddwxdd..", "...dwxd...", "....dxd...", "....ddd..."],
  blazer: ["...SSSS...", "..dwSSwd..", "..ddwxdd..", "...dwxd...", "....dxd...", "....d.d..."],
  trench: ["...SSSS...", ".ddwSSwdd.", ".dddwwddd.", "..dd..dd..", "...d..d...", ".........."],
  labcoat: ["...SSSS...", "..dxSSxd..", "..dxxxxd..", "..kdxxdk..", "..k.dd.k..", "...k..k..."],
  scrubs: ["...SSSS...", "..dSSSSd..", "...dSSd...", "....dd....", "..........", ".........."],
  tee: ["...SSSS...", "...dSSd...", "....dd....", "..........", "..........", ".........."],
  cardigan: ["...SSSS...", "..dwSSwd..", "...dwwd...", "....dxd...", "....d.d...", "....dxd..."],
  blouse: ["...SSSS...", "..wwSSww..", "...wxxw...", "....xx....", "..........", ".........."],
  sailor: ["...SSSS...", ".wwdSSdww.", ".wddwwddw.", "..wdxxdw..", "....xx....", ".........."],
  apron: ["...SSSS...", "..xxSSxx..", "..xcxxcx..", "..xc..cx..", "..xccccx..", "..xccccx.."],
  idol: ["...SSSS...", "..xxSSxx..", "...xxxx...", "..w.dd.w..", "....w.....", ".w......w."],
  hawaii: ["...SSSS...", "..wdSSdw..", "..xddddx..", "...d.x.d..", "..x.d..x..", "....x.d..."],
  straps: ["..sSSSSs..", "..dssssd..", "..dssssd..", "..cccccc..", "..........", ".........."],
};

/* Drawing people. ----------------------------------------------------------- */

const shadeOf = (c) => mix(c, "#1a1430", 0.3);
const lightOf = (c) => mix(c, "#ffffff", 0.35);
const shineOf = (hair) => mix(hair, "#c8d4f0", 0.3);
const LONG_HAIR = ["long", "flower", "crown", "topknot"];

// A lead (or the third person) from the chest up, the face's top-left at (x, y): their hair, the face with a
// look (FACE), its features turned `turn` px to one side, and their clothes down past the bottom of the
// poster, outlined in `ink`; or seen from behind (`away`), the back of the head.
function bust(p, x, y, who, face = "none", turn = 0, ink = INK, away = false) {
  const look = FACE[face] || FACE.none;
  const hair = HAIR[who.style];
  const hairKey = { "#": who.hair, "+": shineOf(who.hair), "-": shadeOf(who.hair), o: who.trim, g: GOLD, h: who.hat, y: LIGHT };
  outlined(p, ink, (q) => {
    if (hair.back) sprite(q, x - 3, y - 6, hair.back, hairKey);
    torso(q, x, y, who);
    q.rect(x, y, 10, 8, SKIN);
    q.rect(x + 1, y + 8, 8, 1, SKIN);
    q.rect(x + 2, y + 9, 6, 1, SKIN);
    sprite(q, x - 3, y - 6, hair.front, hairKey);
    if (away) q.rect(x - 1, y - 1, 12, 10, who.hair);
  });
  if (away) return;
  // The face's shading and features, then the hair over them again.
  p.rect(x + 9, y + 2, 1, 6, SKIN_SHADE);
  p.px(x + 8, y + 8, SKIN_SHADE);
  p.px(x + 7, y + 9, SKIN_SHADE);
  p.rect(x, y + 2, 10, 1, SKIN_SHADE);
  features(p, x + turn, y, who, look);
  sprite(p, x - 3, y - 6, hair.front, hairKey);
  if (look.brows) brows(p, x + turn, y, who, look.brows);
  if (look.vein)
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ])
      p.px(x + 9 + dx, y - 3 + dy, "#e0402e");
  if (look.sweat) {
    p.px(x + 10, y + 1, "#cfeeff");
    p.rect(x + 10, y + 2, 1, 2, "#5fb0e8");
  }
}

// The clothes from the neck down: the shoulders (shaded away from the light), and the collar.
function torso(p, x, y, who) {
  const { clothes } = who;
  const dark = shadeOf(clothes);
  p.rect(x + 3, y + 10, 4, 2, SKIN);
  p.rect(x - 2, y + 12, 14, 1, clothes);
  p.rect(x - 4, y + 13, 18, H, clothes);
  p.rect(x + 10, y + 13, 4, H, dark);
  p.rect(x + 9, y + 12, 3, 1, dark);
  p.rect(x - 3, y + 14, 1, H, lightOf(clothes));
  const key = { s: SKIN, S: SKIN_SHADE, c: clothes, d: dark, w: WHITE, x: who.trim, k: INK };
  sprite(p, x, y + 10, COLLAR[who.collar], key);
}

// The eyes (with lashes for the heroines), glasses, blush, mouth and tears.
function features(p, x, y, who, look) {
  const iris = who.eye || "#6a4434";
  const key = { k: INK, l: who.lash ? INK : null, w: WHITE, i: iris, j: lightOf(iris), b: TEAR };
  sprite(p, x + 1, y + 3, EYES[look.eyes], key);
  sprite(p, x + 6, y + 3, EYES[look.eyes], key, true);
  if (who.glasses) {
    p.rect(x + 1, y + 3, 3, 1, "#8a8f97");
    p.rect(x + 6, y + 3, 3, 1, "#8a8f97");
  }
  for (const bx of [x + 1, x + 7]) p.rect(bx, y + 7, 2, 1, look.blush ? BLUSH_DEEP : BLUSH);
  if (look.blush) {
    p.px(x, y + 7, BLUSH);
    p.px(x + 9, y + 7, BLUSH);
  }
  sprite(p, x + 3, y + 7, MOUTHS[look.mouth], { m: LIP, s: SKIN_SHADE, M: MOUTH, t: "#e0605a", w: WHITE, p: BLUSH_DEEP });
  if (look.tears) {
    p.rect(x + 2, y + 7, 1, 2, TEAR);
    p.rect(x + 7, y + 7, 1, 2, TEAR);
    p.px(x + 1, y + 9, TEAR);
    p.px(x + 8, y + 9, TEAR);
  }
}

// Brows that say the look: up in the middle when sad, down in the middle when angry.
function brows(p, x, y, who, kind) {
  const c = mix(who.hair, INK, 0.6);
  const sad = kind === "sad";
  p.rect(x + 2, y + 2, 2, 1, c);
  p.rect(x + 6, y + 2, 2, 1, c);
  p.px(x + 1, sad ? y + 3 : y + 1, c);
  p.px(x + 8, sad ? y + 3 : y + 1, c);
}

// The bodies of the small whole people, on a grid from 1 px left of the head and 7 px under its top, 9 px
// wide: everyday clothes, or a long robe with wide sleeves in the old dramas. Letters: c the clothes, d
// their shade, x the trim, s a hand, l legs, k shoes.
const BODY = {
  modern: ["..ccxcd..", "cccccdddd", "c.cccdd.d", "c.cccdd.d", "s.cccdd.s", "..ll.ll..", "..ll.ll..", "..ll.ll..", "..kk.kk.."],
  robe: ["..ccxcd..", "cccxccddd", "cc.cxcd.d", "cc.ccxd.d", "s..cccx.s", "..cccdd..", ".ccccddd.", ".ccccdddd", "cccccdddd"],
};

// A small whole person for the wide shots, the head's left at x (7 px wide), feet on row `feet`: hair, a
// face, clothes (a robe in the old dramas); a sword held out towards `dir` (1 right, -1 left); or seen from
// the back (`away`).
function figure(p, x, feet, who, face = "none", { sword = false, dir = 1, robe = false, away = false, ink = INK } = {}) {
  const top = feet - 15;
  const look = FACE[face] || FACE.none;
  const { hair, clothes, style } = who;
  const body = [...BODY[robe ? "robe" : "modern"]];
  const key = { c: clothes, d: shadeOf(clothes), x: who.trim, s: SKIN, l: "#3a3a4a", k: INK };
  const hand = [dir > 0 ? x + 8 : x - 2, top + 9];
  if (sword) {
    // The sword arm held out: its hanging hand gone, a sleeve across, the hand on the hilt.
    for (const r of [2, 3, 4]) body[r] = dir > 0 ? body[r].slice(0, 7) + ".." : ".." + body[r].slice(2);
  }
  const blade = (q, c) => {
    for (let i = 2; i < 12; i++) q.px(hand[0] + dir * i, hand[1] - Math.floor((i * 2) / 3), c);
  };
  outlined(p, ink, (q) => {
    if (LONG_HAIR.includes(style) || away) q.rect(x, top + 2, 7, ["short", "slick", "spiky", "hat"].includes(style) ? 4 : 8, hair);
    if (style === "twin") for (const tx of [x - 1, x + 7]) q.rect(tx, top + 1, 1, 7, hair);
    if (style === "pony") q.rect(x + 7, top + 1, 1, 6, hair);
    sprite(q, x - 1, top + 7, body, key);
    if (sword) {
      q.rect(dir > 0 ? x + 6 : x - 1, top + 9, 2, 1, clothes);
      q.px(hand[0], hand[1], SKIN);
      blade(q, "#dfe8f2");
    }
    q.rect(x + 1, top + 2, 5, 5, SKIN);
    q.rect(x + 1, top - 1, 5, 1, hair);
    q.rect(x, top, 7, 3, hair);
    const side = style === "bob" || style === "curly" || LONG_HAIR.includes(style) ? 5 : 2;
    q.rect(x, top + 3, 1, side, hair);
    q.rect(x + 6, top + 3, 1, side, hair);
    if (style === "hat") {
      q.rect(x - 1, top, 9, 1, who.hat);
      q.rect(x + 1, top - 2, 5, 2, who.hat);
    } else if (style === "bun" || style === "topknot") q.rect(x + 2, top - 3, 3, 2, hair);
    else if (style === "crown") q.rect(x + 2, top - 3, 3, 2, GOLD);
    else if (style === "spiky" || style === "curly") for (const tx of [x + 1, x + 3, x + 5]) q.px(tx, top - 2, hair);
    if (away) q.rect(x + 1, top + 2, 5, 4, hair);
  });
  if (style === "hat") p.rect(x + 1, top - 1, 5, 1, who.trim);
  else p.rect(x + 2, top, 2, 1, shineOf(hair));
  if (sword) {
    blade(p, "#e8eef6");
    p.px(hand[0] + dir * 11, hand[1] - 7, WHITE);
    p.rect(hand[0] + dir, hand[1] - 1, 1, 3, GOLD);
  }
  if (away) return;
  p.rect(x + 1, top + 2, 5, 1, hair);
  p.px(x + 5, top + 3, SKIN_SHADE);
  p.rect(x + 5, top + 4, 1, 2, SKIN_SHADE);
  const closed = ["happy", "shut", "half", "narrow"].includes(look.eyes);
  for (const ex of [x + 2, x + 4]) p.rect(ex, closed ? top + 4 : top + 3, 1, closed ? 1 : 2, INK);
  if (look.eyes === "wide") for (const ex of [x + 2, x + 4]) p.px(ex, top + 3, WHITE);
  if (look.brows === "angry") for (const ex of [x + 2, x + 4]) p.px(ex, top + 2, mix(hair, INK, 0.6));
  p.px(x + 1, top + 5, look.blush ? BLUSH_DEEP : BLUSH);
  p.px(x + 5, top + 5, look.blush ? BLUSH_DEEP : BLUSH);
  if (look.tears) for (const ex of [x + 2, x + 4]) p.px(ex, top + 5, TEAR);
  p.px(x + 3, top + 6, ["open", "o", "grit"].includes(look.mouth) ? MOUTH : LIP);
}

/* Settings. ----------------------------------------------------------------- */

// Bands of colour down the poster from row `y0`, each `step` rows, with a row of checks between bands.
function bands(p, y0, step, colours) {
  colours.forEach((c, k) => {
    const y = y0 + k * step;
    p.rect(0, y, W, k === colours.length - 1 ? H - y : step, c);
    if (k) for (let x = k % 2; x < W; x += 2) p.px(x, y, colours[k - 1]);
  });
}

function lantern(p, lit, x, y, night, big = false) {
  const [w, h] = big ? [7, 7] : [5, 4];
  p.rect(x + (w >> 1), 0, 1, y, "#5a3a2a");
  outlined(p, "#5a1a1a", (q) => {
    q.rect(x + 1, y, w - 2, 1, GOLD);
    q.rect(x, y + 1, w, h, "#d8382e");
    q.rect(x + 1, y + h + 1, w - 2, 1, GOLD);
  });
  lit.rect(x + 1, y + 2, w - 3, h - 2, night ? "#ffe58a" : "#f0605a");
  lit.px(x + 1, y + 1, night ? LIGHT : "#f88a7a");
  p.rect(x + w - 1, y + 1, 1, h, "#a02020");
  if (big) for (const rx of [x + 2, x + 4]) p.rect(rx, y + 1, 1, h, night ? "#f0a040" : "#b82820");
  p.rect(x + (w >> 1), y + h + 2, 1, 2, "#c0392b");
}

function heart(p, x, y, c = "#ff6f9a", big = false) {
  if (big) sprite(p, x, y, [".##.##.", "#+#####", "#######", ".#####.", "..###..", "...#..."], { "#": c, "+": "#ffd0dc" });
  else sprite(p, x, y, ["##.##", "#####", ".###.", "..#.."], { "#": c });
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

function moon(p, x, y) {
  sprite(p, x, y, [".###.", "##+##", "#+###", "####-", ".##-."], { "#": "#f3ecc8", "+": "#fffbe8", "-": "#d8d0a8" });
}

function sun(p, x, y) {
  sprite(p, x - 3, y - 3, ["...y...", ".y...y.", "..###..", "y#####y", "..###..", ".y...y.", "...y..."], { "#": LIGHT, y: "#ffe58a" });
}

function cloud(p, x, y, c = "#ffffff", w = 9) {
  p.rect(x + 2, y, w - 5, 1, c);
  p.rect(x, y + 1, w, 2, c);
  p.rect(x + 1, y + 3, w - 2, 1, mix(c, "#a8b8d0", 0.35));
}

const BACKDROP = {
  palace(p, lit, s) {
    bands(p, 5, 7, ["#e9b8b0", "#e2a8a0", "#d89890"]);
    for (let x = 12; x < 36; x += 4) p.rect(x, 9, 1, 13, "#d49a92");
    p.rect(11, 8, 26, 1, "#c88880");
    p.rect(11, 22, 26, 1, "#c88880");
    for (const x of [0, 44]) {
      p.rect(x, 5, 4, H, "#b8302a");
      p.rect(x + 3, 5, 1, H, "#8a2020");
      p.rect(x, 5, 1, H, "#d8504a");
    }
    p.rect(0, 0, W, 3, "#5a2a32");
    for (let x = 1; x < W; x += 3) p.rect(x, 0, 1, 3, "#43202a");
    p.rect(0, 3, W, 1, GOLD);
    p.rect(0, 4, W, 1, "#2f6a6a");
    for (let x = 2; x < W; x += 4) p.px(x, 4, GOLD);
    for (const x of [0, 46]) p.rect(x, 1, 2, 1, GOLD);
    p.px(2, 2, GOLD);
    p.px(45, 2, GOLD);
    for (const x of [5, 38]) lantern(p, lit, x, 6, s.has("night"));
  },
  rain(p, lit, s) {
    const night = s.has("night");
    bands(p, 0, 5, ["#6a7ca0", "#7a8cb0", "#8a9cc0", "#98aacc"]);
    for (const [x, w, h] of [
      [0, 8, 12],
      [9, 6, 9],
      [16, 9, 14],
      [27, 6, 10],
      [34, 7, 13],
      [42, 6, 8],
    ]) {
      p.rect(x, H - h - 6, w, h + 6, "#6f7f9f");
      p.rect(x + w - 1, H - h - 6, 1, h + 6, "#62728f");
      for (let k = 0; k < 3; k++) if (hash(x, k, 5) > 0.35) lit.px(x + 1 + ((k * 3) % (w - 2)), H - h - 4 + k * 2, night ? "#ffe58a" : "#b8c6e2");
    }
    p.rect(0, 23, W, H, "#5a6a88");
    for (let x = 0; x < W; x += 5) p.rect(x, 24 + (x % 2), 3, 1, "#7a8aac");
    p.rect(43, 4, 1, 20, "#2a2e40");
    p.rect(41, 3, 4, 1, "#2a2e40");
    lit.rect(41, 4, 3, 1, "#ffe58a");
    lit.rect(40, 5, 5, 1, mix("#ffe58a", "#8a9cc0", 0.6));
    lit.rect(41, 24, 3, 1, mix("#ffe58a", "#5a6a88", 0.5));
  },
  hospital(p, lit, s) {
    bands(p, 0, 7, ["#e8f6f0", "#dcefe8", "#d0e6de"]);
    p.rect(0, 21, W, H, "#bfd4cc");
    p.rect(0, 21, W, 1, "#a8c0b8");
    p.rect(2, 2, 11, 10, "#a8c8d8");
    p.rect(3, 3, 9, 8, s.has("night") ? "#2a3a6a" : "#cdeafa");
    p.rect(7, 3, 1, 8, "#a8c8d8");
    p.rect(3, 7, 9, 1, "#a8c8d8");
    if (!s.has("night")) cloud(p, 3, 4, WHITE, 5);
    lit.rect(21, 1, 7, 7, WHITE);
    lit.rect(23, 2, 3, 5, "#e0605a");
    lit.rect(22, 3, 5, 3, "#e0605a");
    ecg(lit, 14, s.has("alarm") ? "#e0402e" : "#3fb070");
  },
  detective(p, lit, s) {
    bands(p, 0, 6, ["#1f2440", "#2a3050", "#3a4060", "#454a68"]);
    for (let k = 0; k < 8; k++) lit.px(Math.floor(hash(k, 3, 1) * W), Math.floor(hash(k, 4, 1) * 10), "#c8c8e0");
    for (const [x, y, w] of [
      [0, 15, 10],
      [10, 17, 8],
      [18, 13, 9],
      [27, 16, 8],
      [35, 14, 13],
    ]) {
      p.rect(x, y, w, H, "#1a1c30");
      p.rect(x + w - 3, y - 2, 2, 2, "#1a1c30");
      lit.px(x + 2, y + 3, "#ffe58a");
      if (w > 9) lit.px(x + 6, y + 6, "#ffe58a");
    }
    for (const y of [19, 22]) for (let x = 0; x < W; x++) if ((x + y * 3) % 7 < 5) p.px(x, y + (x % 9 < 4 ? 0 : 1), "#5a5e78");
  },
  campus(p, lit, s) {
    bands(p, 0, 5, s.has("night") ? ["#1a2050", "#262c62", "#323a72"] : ["#a8d8f5", "#bfe2f8", "#cdeafa"]);
    if (!s.has("night")) cloud(p, 32, 2);
    p.rect(13, 9, 22, H, "#f2ead8");
    p.rect(12, 9, 24, 1, "#c8a888");
    p.rect(33, 10, 2, H, "#e0d4bc");
    for (let x = 15; x < 33; x += 4) for (let y = 12; y < H; y += 4) lit.rect(x, y, 2, 2, s.has("night") ? "#ffe58a" : "#8ab8d8");
    p.rect(20, 3, 8, 6, "#f2ead8");
    p.rect(19, 2, 10, 1, "#c8a888");
    p.rect(22, 0, 4, 2, "#c86a5a");
    lit.rect(22, 4, 4, 4, WHITE);
    lit.rect(24, 5, 1, 2, INK);
    lit.px(25, 6, INK);
    const tree = ["############", "#++###+++###", "####-#######", "##+#######-.", "#-####-##...", "####-##.....", ".#.##.......", "..#........."];
    for (const [cx, flip] of [
      [0, false],
      [36, true],
    ]) {
      p.rect(flip ? cx + 10 : cx + 1, 6, 1, H, "#8a5a44");
      sprite(p, cx, 0, tree, { "#": "#f7c6d6", "+": "#fde4ec", "-": "#e898b0" }, flip);
    }
  },
  wuxia(p, lit, s) {
    bands(p, 0, 5, ["#eef6e8", "#e2f0da", "#d8ecd0", "#cde4c4"]);
    if (!s.has("storm")) lit.rect(30, 3, 5, 5, s.has("night") ? "#e8e4c8" : "#f0b8a0");
    sprite(
      p,
      0,
      8,
      [
        "........##........................###..........",
        "......######.....##.............#######........",
        "....##########.#######........###########......",
        "..##############################################",
      ],
      { "#": "#b8d4b0" }
    );
    p.rect(0, 12, W, H, "#b8d4b0");
    p.rect(0, 22, W, H, "#9cc08c");
    for (const [x, c] of [
      [3, "#5f9f52"],
      [8, "#7cb86a"],
      [39, "#7cb86a"],
      [44, "#5f9f52"],
      [16, "#a8cc98"],
      [30, "#a8cc98"],
    ]) {
      p.rect(x, 0, 2, H, c);
      p.rect(x, 0, 1, H, mix(c, "#ffffff", 0.25));
      for (let y = 3 + (x % 5); y < H; y += 6) {
        p.rect(x, y, 2, 1, mix(c, "#1a3a1a", 0.35));
        p.rect(x + 2, y - 1, 2, 1, c);
        p.px(x + 4, y - 2, c);
      }
    }
  },
  sitcom(p, lit, s) {
    p.rect(0, 0, W, H, "#f6e3a0");
    for (let x = 1; x < W; x += 4) p.rect(x, 0, 1, H, "#eed690");
    p.rect(2, 2, 12, 10, "#c8a070");
    p.rect(3, 3, 10, 8, s.has("night") ? "#2a3a6a" : "#cdeafa");
    p.rect(7, 3, 1, 8, "#c8a070");
    p.rect(1, 1, 2, 13, "#e08a6a");
    p.rect(13, 1, 2, 13, "#e08a6a");
    p.rect(1, 1, 14, 1, "#b06a4a");
    for (const [x, c] of [
      [33, "#7cb86a"],
      [40, "#f28aa8"],
    ]) {
      p.rect(x, 3, 5, 6, "#8a5a34");
      p.rect(x + 1, 4, 3, 4, c);
      p.px(x + 2, 5, WHITE);
    }
    p.rect(0, 18, W, H, "#e08a6a");
    p.rect(0, 18, W, 1, "#f0a888");
    for (let x = 6; x < W; x += 12) p.rect(x, 19, 1, 9, "#c87050");
  },
  cafe(p, lit, s) {
    p.rect(0, 0, W, H, "#d9b896");
    for (let y = 2; y < 18; y += 3) for (let x = (y % 2) * 3; x < 26; x += 6) p.rect(x, y, 5, 1, "#d0ac88");
    p.rect(0, 18, W, H, "#a8805f");
    p.rect(0, 18, W, 1, "#8a6040");
    const out = s.has("night") ? "#2a3460" : s.has("rain") ? "#8a9cc0" : "#cdeafa";
    p.rect(28, 2, 18, 15, "#8a6040");
    p.rect(29, 3, 16, 13, out);
    if (!s.has("night") && !s.has("rain")) cloud(p, 31, 5, WHITE, 6);
    p.rect(37, 3, 1, 13, "#8a6040");
    p.rect(29, 9, 16, 1, "#8a6040");
    p.rect(27, 16, 20, 1, "#6a4a30");
    p.rect(0, 8, 24, 1, "#7a5030");
    for (let x = 2; x < 22; x += 5) {
      p.rect(x + 1, 5, 2, 3, ["#f2e3c4", "#3f7a5a", "#f28aa8", WHITE][(x / 5) | 0]);
      p.px(x + 1, 5, WHITE);
    }
    for (const x of [12, 21]) {
      p.rect(x + 1, 0, 1, 3, "#3a2a20");
      p.rect(x, 3, 3, 1, "#3a2a20");
      lit.px(x + 1, 4, LIGHT);
    }
  },
  office(p, lit, s) {
    const night = s.has("night");
    bands(p, 0, 7, night ? ["#1a2048", "#262c5a", "#323a6a"] : ["#9cc4e4", "#b0d0ea", "#c4dcef"]);
    for (const [x, y, w] of [
      [0, 9, 6],
      [6, 5, 5],
      [12, 12, 7],
      [19, 7, 6],
      [25, 3, 6],
      [31, 10, 7],
      [38, 6, 5],
      [43, 11, 5],
    ]) {
      p.rect(x, y, w, H, night ? "#141838" : "#8a9cb4");
      p.rect(x + w - 1, y, 1, H, night ? "#10132c" : "#7a8ca4");
      for (let wy = y + 2; wy < H; wy += 2)
        for (let wx = x + 1; wx < x + w - 1; wx += 2) if (hash(wx, wy, 7) > (night ? 0.6 : 0.5)) lit.px(wx, wy, night ? "#ffe58a" : "#c4dcef");
    }
    for (let x = 0; x < W; x += 16) p.rect(x, 0, 1, H, "#dfe6ee");
    p.rect(0, 12, W, 1, "#dfe6ee");
  },
  idol(p, lit, s) {
    bands(p, 0, 7, ["#1a1236", "#2a1f4a", "#33265a"]);
    p.rect(0, 0, W, 2, "#4a3a7a");
    for (let x = 2; x < W; x += 6) lit.px(x, 1, ["#f6cf4a", "#f28aa8", "#8fd3ff"][(x / 6) % 3 | 0]);
    for (const [x, c] of [
      [8, "#f6cf4a"],
      [24, "#f28aa8"],
      [40, "#8fd3ff"],
    ])
      for (let y = 2; y < H; y++) {
        const half = 1 + Math.floor((y - 2) / 3);
        lit.rect(x - half, y, half * 2 + 1, 1, mix("#2a1f4a", c, s.has("spot") ? 0.3 : 0.12));
      }
    for (let k = 0; k < 10; k++) lit.px(Math.floor(hash(k, 9, 2) * W), 3 + Math.floor(hash(k, 8, 2) * 12), "#fff6c9");
  },
  immortal(p, lit, s) {
    bands(p, 0, 6, ["#b8d0f0", "#cfe0f6", "#e0ecfa", "#f4f4f8"]);
    const peak = (x, y, w) => {
      outlined(p, "#7a88a8", (q) => {
        q.rect(x + 1, y, w - 2, 2, "#a8b8d0");
        q.rect(x, y + 2, w, 6, "#a8b8d0");
        q.rect(x + 1, y + 8, w - 2, 2, "#a8b8d0");
        q.rect(x + 2, y + 10, w - 4, 2, "#a8b8d0");
      });
      p.rect(x + w - 2, y + 2, 1, 6, "#8a9ab8");
      p.rect(x + 1, y + 2, 1, 5, "#c4d0e4");
      p.rect(x + 1, y - 1, 3, 1, "#5f9f6a");
      p.px(x + 2, y - 2, "#5f9f6a");
    };
    peak(1, 6, 8);
    peak(40, 4, 7);
    peak(10, 13, 5);
    for (const [x, y] of [
      [0, 18],
      [30, 15],
      [14, 22],
      [38, 21],
    ])
      cloud(p, x, y);
  },
  seaside(p, lit, s) {
    const night = s.has("night");
    bands(p, 0, 4, night ? ["#141a3c", "#1e2650", "#2a3466"] : ["#7fcff2", "#9fdcf5", "#bfe8f8"]);
    if (night) moon(lit, 38, 2);
    else sun(lit, 40, 5);
    p.rect(0, 12, W, 8, "#3e8fd6");
    p.rect(0, 12, W, 1, "#7fbff0");
    for (let k = 0; k < 10; k++) p.rect(Math.floor(hash(k, 1, 6) * 44), 14 + (k % 3) * 2, 3, 1, "#8fc8f0");
    p.rect(0, 20, W, H, "#f2dca0");
    p.rect(0, 20, W, 1, WHITE);
    for (let k = 0; k < 6; k++) p.px(Math.floor(hash(k, 2, 6) * W), 22 + (k % 4), "#e0c488");
  },
};

// The heart monitor's line across the ward, a beat every 16 px.
function ecg(p, y, c) {
  for (let x = 0; x < W; x++) {
    const k = x % 16;
    if (k === 6) p.rect(x, y - 4, 1, 4, c);
    else if (k === 7) p.rect(x, y, 1, 3, c);
    else p.px(x, y, c);
  }
}

/* Props for the key art. ---------------------------------------------------- */

function umbrella(p, l, r, y, c = "#f28aa8") {
  const mid = Math.round((l + r) / 2);
  outlined(p, mix(c, "#2a1020", 0.55), (q) => {
    q.rect(l + 5, y, r - l - 10, 1, c);
    q.rect(l + 2, y + 1, r - l - 4, 1, c);
    q.rect(l, y + 2, r - l, 2, c);
  });
  for (let x = l + 4; x < r - 2; x += 6) p.rect(x, y + 2, 1, 2, mix(c, "#000000", 0.15));
  p.rect(l + 5, y, 4, 1, mix(c, "#ffffff", 0.4));
  p.px(mid, y - 1, "#5c4a4a");
}

function magnifier(p, x, y) {
  outlined(p, INK, (q) => {
    q.rect(x + 1, y, 4, 6, "#c9a040");
    q.rect(x, y + 1, 6, 4, "#c9a040");
    for (let k = 0; k < 4; k++) q.rect(x + 5 + k, y + 5 + k, 2, 1, "#5a3a2a");
  });
  p.rect(x + 1, y + 1, 4, 4, "#a8d8f0");
  p.px(x + 1, y + 1, WHITE);
  p.px(x + 2, y + 1, "#e8f6ff");
}

function swords(p, cx, y) {
  for (const d of [1, -1])
    outlined(p, "#2a2a3a", (q) => {
      for (let i = 0; i < 13; i++) q.px(cx - d * 6 + d * i, y + 12 - i, i < 3 ? "#5a3a2a" : "#dfe8f2");
      q.rect(cx - d * 4 - 1, y + 9, 3, 1, GOLD);
    });
}

function latte(p, x, y) {
  for (const [k, dx] of [
    [0, 2],
    [1, 4],
  ])
    for (let j = 0; j < 4; j++) p.px(x + dx + ((j + k) % 2), y - 5 + j, mix(WHITE, "#d9b896", 0.3));
  outlined(p, "#5a3a2a", (q) => {
    q.rect(x, y, 8, 5, WHITE);
    q.rect(x + 8, y + 1, 2, 2, WHITE);
    q.rect(x - 2, y + 5, 12, 1, WHITE);
  });
  p.rect(x + 1, y, 6, 1, "#a8683a");
  p.px(x + 3, y, WHITE);
  p.px(x + 4, y, WHITE);
  p.rect(x + 7, y + 1, 1, 4, "#e8dcd0");
}

function mic(p, x, y) {
  outlined(p, INK, (q) => {
    q.rect(x, y, 3, 3, "#8a8f97");
    q.rect(x + 1, y + 3, 1, 5, "#2a2a30");
  });
  p.px(x, y, "#d8dce4");
}

function parasol(p, x, y) {
  p.rect(x, y + 3, 1, H, "#8a5a34");
  outlined(p, "#7a2a2a", (q) => {
    q.rect(x - 3, y, 7, 1, "#e0402e");
    q.rect(x - 6, y + 1, 13, 1, "#e0402e");
    q.rect(x - 8, y + 2, 17, 1, "#e0402e");
  });
  for (let dx = -8; dx <= 8; dx++) if (Math.floor((dx + 8) / 3) % 2) p.px(x + dx, y + 2, WHITE);
  for (let dx = -6; dx <= 6; dx++) if (Math.floor((dx + 8) / 3) % 2) p.px(x + dx, y + 1, WHITE);
}

function sigil(p, cx, cy, r) {
  for (let a = 0; a < 64; a++) {
    const t = (a / 64) * Math.PI * 2;
    p.px(Math.round(cx + Math.cos(t) * r * 1.2), Math.round(cy + Math.sin(t) * r), a % 8 === 0 ? WHITE : GOLD);
    if (a % 2 === 0) p.px(Math.round(cx + Math.cos(t) * (r - 2) * 1.2), Math.round(cy + Math.sin(t) * (r - 2)), "#f8e8a8");
  }
}

/* The weather and the rest. ------------------------------------------------- */

function rain(p, seed, c, n) {
  for (let k = 0; k < n; k++) {
    const x = Math.floor(hash(k, seed, 11) * (W + 4));
    const y = Math.floor(hash(seed, k, 12) * H);
    p.px(x, y, c);
    p.px(x - 1, y + 1, c);
  }
}

function petals(p, seed, n = 10) {
  for (let k = 0; k < n; k++) {
    const x = Math.floor(hash(k, seed, 13) * W);
    const y = Math.floor(hash(seed, k, 14) * H);
    p.px(x, y, "#f7a1b5");
    if (k % 3 === 0) p.px(x + 1, y, "#fde4ec");
  }
}

function firework(p, x, y, c, r = 3) {
  for (let a = 0; a < 8; a++) {
    const [dx, dy] = [Math.cos((a * Math.PI) / 4), Math.sin((a * Math.PI) / 4)];
    p.px(x + Math.round(dx * r), y + Math.round(dy * r), c);
    p.px(x + Math.round(dx * (r - 1.5)), y + Math.round(dy * (r - 1.5)), mix(c, "#ffffff", 0.5));
  }
  p.px(x, y, WHITE);
}

function lightning(p, x) {
  sprite(p, x, 0, ["..##", ".##.", "##..", ".###", "..##", ".##.", "##..", "#..."], { "#": "#f4f4ff" });
}

// What a shot's words put over the picture behind the people: rain, a storm, petals, sparks, fireworks, the
// alarm.
function weather(lit, s, seed) {
  if (s.has("rain") || s.has("storm")) rain(lit, seed, s.has("night") ? "#7a8cc0" : "#e6eefc", s.has("storm") ? 34 : 24);
  if (s.has("storm")) lightning(lit, 6 + Math.floor(hash(seed, 2, 3) * 30));
  if (s.has("petals")) petals(lit, seed);
  if (s.has("spark")) for (let k = 0; k < 4; k++) sparkle(lit, 3 + Math.floor(hash(k, seed, 5) * 42), 2 + Math.floor(hash(seed, k, 6) * 10));
  if (s.has("fireworks")) {
    firework(lit, 7, 5, "#ff6f9a", 3);
    firework(lit, 40, 4, "#f6cf4a", 3);
    firework(lit, 24, 3, "#8fd3ff", 2);
  }
  if (s.has("alarm")) {
    lit.rect(0, 0, W, 1, "#e0402e");
    lit.rect(0, H - 1, W, 1, "#e0402e");
  }
}

// The corners darkened a little, to hold the eye in the middle.
const VIGNETTE = [];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5 - W / 2) / (W / 2), (y + 0.5 - H / 2) / (H / 2));
    if (d > 1.05) VIGNETTE.push([x, y, Math.min(0.35, (d - 1.05) * 0.9)]);
  }
function vignette(g) {
  for (const [x, y, a] of VIGNETTE) {
    g.fillStyle = `rgba(12,8,24,${a.toFixed(2)})`;
    g.fillRect(x, y, 1, 1);
  }
}

/* The posters. -------------------------------------------------------------- */

// Night: the setting dims to blue; people a little less, so their faces still read.
const nightTone = (k) => (c) => mix(c, NIGHT, k);

// The pens for a poster with the scene's words `s` (night dims the setting and, less, the people; lights
// stay bright), its setting drawn.
function stage(g, drama, s) {
  const night = s.has("night");
  const back = penOf(g, night ? nightTone(0.5) : undefined);
  const lit = penOf(g);
  const people = penOf(g, night ? nightTone(0.2) : undefined);
  BACKDROP[drama](back, lit, s);
  return { g, back, lit, people, cast: CAST[drama], ink: night ? "#120e24" : INK, s };
}

// The key art for each drama: its leads and its things, its words for the setting and its frame's colour.
const KEY_ART = {
  palace: {
    s: ["petals"],
    frame: GOLD,
    draw({ back, lit, people, cast, ink }) {
      lantern(back, lit, 20, 5, false, true);
      bust(people, 6, 10, cast.a, "smile", 1, ink);
      bust(people, 32, 10, cast.b, "blush", -1, ink);
    },
  },
  rain: {
    s: ["rain"],
    frame: "#f28aa8",
    draw({ lit, people, cast, ink }) {
      bust(people, 11, 11, cast.a, "smile", 1, ink);
      bust(people, 26, 12, cast.b, "blush", -1, ink);
      umbrella(lit, 5, 42, 3);
      lit.rect(23, 7, 1, 3, "#5c4a4a");
    },
  },
  hospital: {
    s: [],
    frame: "#e0605a",
    draw({ lit, people, cast, ink }) {
      bust(people, 6, 10, cast.a, "smile", 1, ink);
      bust(people, 32, 10, cast.b, "smile", -1, ink);
      heart(lit, 21, 11, "#e0605a");
    },
  },
  detective: {
    s: ["night"],
    frame: "#c9a878",
    draw({ back, lit, people, cast, ink }) {
      moon(lit, 9, 2);
      bust(people, 7, 11, cast.a, "none", 1, ink);
      bust(people, 30, 12, cast.b, "shock", -1, ink);
      magnifier(lit, 22, 15);
    },
  },
  campus: {
    s: ["petals"],
    frame: "#f28aa8",
    draw({ people, cast, ink }) {
      bust(people, 7, 11, cast.a, "laugh", 1, ink);
      bust(people, 31, 11, cast.b, "blush", -1, ink);
    },
  },
  wuxia: {
    s: [],
    frame: "#3e6f8a",
    draw({ lit, people, cast, ink }) {
      swords(lit, 24, 6);
      bust(people, 6, 10, cast.a, "none", 1, ink);
      bust(people, 32, 10, cast.b, "angry", -1, ink);
    },
  },
  sitcom: {
    s: [],
    frame: "#3e6fd6",
    draw({ people, cast, ink }) {
      bust(people, 19, 6, cast.c, "smile", 0, ink);
      bust(people, 5, 11, cast.a, "laugh", 1, ink);
      bust(people, 33, 11, cast.b, "laugh", -1, ink);
    },
  },
  cafe: {
    s: [],
    frame: "#8a6040",
    draw({ lit, people, cast, ink }) {
      bust(people, 6, 10, cast.a, "smile", 1, ink);
      bust(people, 32, 10, cast.b, "blush", -1, ink);
      latte(lit, 20, 20);
    },
  },
  office: {
    s: ["night"],
    frame: "#8fb0d8",
    draw({ lit, people, cast, ink }) {
      bust(people, 6, 10, cast.a, "none", 1, ink);
      bust(people, 32, 10, cast.b, "smile", -1, ink);
      outlined(lit, INK, (q) => {
        q.rect(19, 17, 10, 7, "#3a3f4a");
        q.rect(17, 24, 14, 2, "#8a8f97");
      });
      lit.rect(20, 18, 8, 5, "#bfe0ff");
      lit.rect(20, 18, 8, 1, WHITE);
      lit.rect(21, 20, 4, 1, "#7fa8d8");
      lit.rect(21, 22, 5, 1, "#7fa8d8");
    },
  },
  idol: {
    s: ["spot"],
    frame: "#f28aa8",
    draw({ lit, people, cast, ink }) {
      bust(people, 30, 12, cast.b, "smile", -1, ink);
      bust(people, 10, 9, cast.a, "laugh", 1, ink);
      mic(lit, 22, 19);
      for (let x = 1; x < W; x += 3) lit.px(x, H - 2 - (x % 2), ["#f6cf4a", "#f28aa8", "#8fd3ff"][x % 3]);
    },
  },
  immortal: {
    s: ["spark"],
    frame: GOLD,
    draw({ lit, people, cast, ink }) {
      sigil(lit, 24, 12, 9);
      bust(people, 6, 10, cast.a, "none", 1, ink);
      bust(people, 32, 10, cast.b, "smile", -1, ink);
      for (const [x, y] of [
        [-2, 23],
        [16, 24],
        [34, 23],
      ])
        cloud(lit, x, y, WHITE, 14);
    },
  },
  seaside: {
    s: [],
    frame: "#f6cf4a",
    draw({ lit, people, cast, ink }) {
      parasol(lit, 24, 7);
      bust(people, 6, 10, cast.a, "laugh", 1, ink);
      bust(people, 32, 10, cast.b, "smile", -1, ink);
    },
  },
};

function seriesPoster(g, drama) {
  const art = KEY_ART[drama];
  const s = new Set(art.s);
  const st = stage(g, drama, s);
  weather(st.lit, s, 1);
  art.draw(st);
  frame(st.lit, art.frame);
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

/* Episode posters: their key moment. ---------------------------------------- */

// The ways an episode's poster can go, each found in its shots and scored: an embrace, a sword fight, the
// family laughing, tears, someone alone in the rain, the rival, a shock, the two of them close.
function moments(beats) {
  const found = [];
  const fin = beats.some((b) => b.shot === "end" && b.has.has("fin"));
  const faceNear = (i, who, fallback) => {
    for (let d = 1; d < 4; d++)
      for (const j of [i + d, i - d]) {
        const b = beats[j];
        if (b && b.shot === "close" && (b.who[0] || "a") === who && b.face) return b.face;
      }
    return fallback;
  };
  const sceneNear = (i) => {
    for (let d = 0; d < 4; d++) for (const j of [i - d, i + d]) if (beats[j]?.shot === "scene") return beats[j];
    return null;
  };
  const left = beats.some((b) => b.has.has("leave") && b.who.length !== 1);
  beats.forEach((b, i) => {
    const who = b.who[0] || "a";
    const scene = b.shot === "scene";
    const s = scene ? b.has : sceneNear(i)?.has || new Set();
    if (scene && b.has.has("hug"))
      found.push({ kind: "embrace", score: fin ? 12 : 8, s, faces: { a: faceNear(i, "a", "smile"), b: faceNear(i, "b", "blush") } });
    if (scene && b.has.has("clash")) found.push({ kind: "clash", score: 8, s, pair: b.who.length === 2 ? b.who : ["a", "b"] });
    if (scene && b.has.has("laugh") && b.has.has("three")) found.push({ kind: "laugh", score: 7, s });
    if (b.shot === "close" && b.face === "tears") found.push({ kind: "tears", score: 7 + (b.secs > 6 ? 1 : 0), who, s, left });
    if (scene && b.who.length === 1 && who !== "c" && (b.face === "sad" || b.has.has("rain") || b.has.has("storm")))
      found.push({ kind: "alone", score: 5 + (b.has.has("rain") || b.has.has("storm") ? 1 : 0) + (b.has.has("night") ? 1 : 0), who, s });
    if (b.shot === "close" && who === "c" && ["angry", "smile", "laugh"].includes(b.face))
      found.push({ kind: "rival", score: 4.5 + (beats[i + 1]?.shot === "end" ? 0.5 : 0), face: b.face, s });
    if (b.shot === "close" && who !== "c" && b.face === "shock") found.push({ kind: "shock", score: 4, who, s });
    if (scene && b.has.has("near") && !b.who.includes("c")) {
      const faces = { a: faceNear(i, "a", "smile"), b: faceNear(i, "b", "blush") };
      const love = ["blush", "kiss"].includes(faces.a) || ["blush", "kiss"].includes(faces.b);
      found.push({ kind: "meet", score: 4 + (b.has.has("heart") ? 2 : 0) + (b.has.has("umbrella") ? 1 : 0) + (love ? 1 : 0), s, faces });
    }
  });
  return found;
}

// Each drama's four episode posters, worked out once: the strongest moments first, each kind used once.
const PICKS = new Map();
function picksOf(drama) {
  if (PICKS.has(drama)) return PICKS.get(drama);
  const { episodes } = seriesOf(drama);
  const all = episodes.flatMap(({ beats }, ep) => moments(beats).map((m) => ({ ...m, ep })));
  all.sort((m, n) => n.score - m.score || n.ep - m.ep);
  const picks = [];
  const used = new Set();
  for (const m of all) {
    if (picks[m.ep] || used.has(m.kind)) continue;
    picks[m.ep] = m;
    used.add(m.kind);
  }
  episodes.forEach((e, ep) => (picks[ep] ||= { kind: "meet", s: new Set(), faces: { a: "smile", b: "smile" } }));
  PICKS.set(drama, picks);
  return picks;
}

const ROBES = ["palace", "wuxia", "immortal"];

// Each kind of episode poster, given the pens (stage) and the moment.
const EPISODE = {
  // The two of them cheek to cheek, a heart over them, under the episode's fireworks or petals.
  embrace(st, m) {
    const { lit, people, cast, ink, s } = st;
    weather(lit, s, 5);
    bust(people, 12, 8, cast.a, m.faces.a, 1, ink);
    bust(people, 23, 10, cast.b, m.faces.b, -1, ink);
    if (s.has("heart")) heart(lit, 21, 0, "#ff6f9a", true);
  },
  // Facing each other, a heart between them; under an umbrella if they share one.
  meet(st, m) {
    const { lit, people, cast, ink, s } = st;
    weather(lit, s, 7);
    const strong = ["kiss", "blush", "laugh", "smile"];
    const [front, back] = strong.indexOf(m.faces.a) >= 0 && strong.indexOf(m.faces.a) < strong.indexOf(m.faces.b) ? ["a", "b"] : ["b", "a"];
    const flip = st.flip;
    if (s.has("umbrella")) umbrella(lit, 3, 45, 2);
    bust(people, flip ? 13 : 25, 9, cast[front], m.faces[front], flip ? 1 : -1, ink);
    bust(people, flip ? 31 : 7, 15, cast[back], "none", 0, ink, true);
    if (s.has("heart")) heart(lit, flip ? 27 : 17, 6);
  },
  // A face in tears in the rain, blue; the other walking off in the distance if someone left.
  tears(st, m) {
    const { g, lit, people, cast, ink, s } = st;
    rain(lit, 9, "#c8d8f8", 30);
    g.fillStyle = "rgba(30,50,120,0.28)";
    g.fillRect(0, 0, W, H);
    const other = cast[m.who === "a" ? "b" : "a"];
    if (m.left) figure(penOf(g, nightTone(0.45)), st.flip ? 5 : 36, 22, other, "none", { away: true, robe: ROBES.includes(st.drama), ink });
    bust(people, st.flip ? 28 : 10, 10, cast[m.who], "tears", st.flip ? -1 : 1, ink);
    rain(lit, 10, "#e6eefc", 6);
  },
  // One of them small and alone in the setting, in the rain or the night.
  alone(st, m) {
    const { g, lit, people, cast, ink, s } = st;
    weather(lit, s, 11);
    // A cone of light from above onto them, and its pool on the ground.
    const cx = st.flip ? 14 : 33;
    for (let y = 0; y < 25; y++) {
      const half = 2 + Math.floor(y / 3);
      g.fillStyle = "rgba(255,244,214,0.13)";
      g.fillRect(cx - half, y, half * 2 + 1, 1);
    }
    g.fillStyle = "rgba(255,244,214,0.25)";
    g.fillRect(cx - 8, 25, 17, 1);
    g.fillRect(cx - 6, 26, 13, 1);
    figure(people, cx - 3, 25, cast[m.who], "sad", { robe: ROBES.includes(st.drama), ink });
  },
  // The rival looming over the two of them, dark, the leads small and shocked.
  rival(st, m) {
    const { g, lit, people, cast, s } = st;
    weather(lit, s, 13);
    const f = st.flip;
    bust(penOf(g, nightTone(0.42)), f ? 9 : 29, 6, cast.c, m.face, f ? 1 : -1, "#0a0816");
    const robe = ROBES.includes(st.drama);
    figure(people, f ? 27 : 5, 26, cast.a, "shock", { robe, ink: "#0a0816" });
    figure(people, f ? 36 : 14, 26, cast.b, "shock", { robe, ink: "#0a0816" });
  },
  // Two of them with swords crossed, sparks where the blades meet.
  clash(st, m) {
    const { lit, people, cast, ink, s } = st;
    weather(lit, s, 15);
    const [l, r] = m.pair;
    const robe = ROBES.includes(st.drama);
    figure(people, 8, 25, cast[l], "angry", { sword: true, dir: 1, robe, ink });
    figure(people, 33, 25, cast[r], "angry", { sword: true, dir: -1, robe, ink });
    sparkle(lit, 24, 14, "#fff6c9");
    for (const [dx, dy] of [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ])
      lit.px(24 + dx, 14 + dy, "#ffe58a");
  },
  // The family all laughing at once.
  laugh(st, m) {
    const { lit, people, cast, ink, s } = st;
    weather(lit, s, 17);
    bust(people, 19, 6, cast.c, "laugh", 0, ink);
    bust(people, 5, 10, cast.a, "laugh", 1, ink);
    bust(people, 33, 10, cast.b, "laugh", -1, ink);
  },
  // A face in shock, the picture gone dark behind it and lines rushing in.
  shock(st, m) {
    const { g, lit, people, cast, ink, s } = st;
    weather(lit, s, 19);
    g.fillStyle = "rgba(20,10,40,0.55)";
    g.fillRect(0, 0, W, H);
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2 + 0.1;
      const r0 = 13 + (k % 3) * 2;
      for (let r = r0; r < 34; r++) lit.px(Math.round(24 + Math.cos(a) * r * 1.6), Math.round(14 + Math.sin(a) * r), "#d8d0f0");
    }
    bust(people, 19, 9, cast[m.who], "shock", 0, ink);
  },
};

/* Her farm game. ------------------------------------------------------------ */

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

/* The way in. --------------------------------------------------------------- */

// A poster: `show` a drama (DRAMAS) or "stardew"; `ep` null for the series' key art, or an episode (0-3).
export function drawPoster(g, show, ep) {
  g.clearRect(0, 0, W, H);
  if (show === "stardew") return stardewPoster(g);
  const drama = CAST[show] ? show : "cafe";
  if (ep === null || ep === undefined) return seriesPoster(g, drama);
  const m = picksOf(drama)[ep] || picksOf(drama)[0];
  const st = stage(g, drama, new Set(m.kind === "rival" ? [...m.s, "night"] : m.s));
  EPISODE[m.kind]({ ...st, drama, flip: ep % 2 === 1 }, m);
  vignette(g);
}
