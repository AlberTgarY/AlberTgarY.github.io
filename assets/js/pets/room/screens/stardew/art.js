/*******************************************************************************
 * What her farm game is drawn from: the farmer and the villagers, the animals
 * and the crops as sprites; the ground (grass through the seasons, the farm's
 * bare earth, tilled soil, sand, water, cave floor), the fences, trees and
 * buildings; and the game's own bits on top (the hotbar, the dialogue box,
 * hearts and sparkles). Seen from above and in front, outlined dark, lit from
 * the upper left, as the game is.
 ******************************************************************************/

import { sprite, noise, lines, letters } from "./kit.js";

export const INK = "#3b2318"; // the dark outline everything has

/* ---------- people ---------- */

// The farmer from the front (11 x 17): straw hat with a red band, brown hair, pink shirt, blue dungarees.
const FRONT = [
  "...ooooo...",
  "..ohhhhho..",
  "..oHbbbHo..",
  ".oohhhhhoo.",
  "ohhhhhhhhho",
  "oHHHHHHHHHo",
  ".orRsssRro.",
  ".orsesesro.",
  ".orcsSscro.",
  "..ossssso..",
  ".oPpdpdpPo.",
  "opPdddddPpo",
  "opPddyddPpo",
  "osodddddoso",
  ".oodDdDdoo.",
  "..odDoDdo..",
  "..kko.okk..",
];
// From the side, facing right, standing and mid-step.
const SIDE = [
  "...ooooo...",
  "..ohhhhho..",
  "..oHbbbbo..",
  ".oohhhhhoo.",
  "ohhhhhhhhho",
  "oHHHHHHHHHo",
  ".orrrRssso.",
  ".orrrssseo.",
  ".orrRsssSo.",
  "..oorssso..",
  "...oPpppo..",
  "...oPdddo..",
  "...oPdddo..",
  "...osdDdo..",
  "...odDddo..",
  "...odoodo..",
  "...kko.kko.",
];
const STEP = [...SIDE.slice(0, 14), "...oddDo...", "....odo....", "....kko...."];
// From the front with both arms up, holding something over her head (drawn above the hat).
const LIFT = [
  "oo.........oo",
  "os..ooooo..so",
  "op.ohhhhho.po",
  "op.oHbbbHo.po",
  "opoohhhhhoopo",
  "ophhhhhhhhhpo",
  "opHHHHHHHHHpo",
  "oporRsssRropo",
  "oporsesesropo",
  "oporcsSscropo",
  "op.ossssso.po",
  "opoPpdpdpPopo",
  ".opPdddddPpo.",
  ".opPddyddPpo.",
  ".oPodddddoPo.",
  "..oodDdDdoo..",
  "...odDoDdo...",
  "...kko.okk...",
];
// From behind (walking up a row, at a counter): the hat, the hair under it, the dungarees' straps.
const BACK = [
  "...ooooo...",
  "..ohhhhho..",
  "..oHbbbHo..",
  ".oohhhhhoo.",
  "ohhhhhhhhho",
  "oHHHHHHHHHo",
  ".orrrrrrro.",
  ".orRrrrRro.",
  ".orrRrRrro.",
  "..orrrrro..",
  ".oPpdpdpPo.",
  "opPpdpdpPpo",
  "opPdddddPpo",
  "osodddddoso",
  ".oodDdDdoo.",
  "..odDoDdo..",
  "..kko.okk..",
];
const FARMER = { front: FRONT, side: SIDE, step: STEP, lift: LIFT, back: BACK };
const SHIRT = { p: "#f28aa8", P: "#c9607e", d: "#3e6fd6", D: "#2b4ea6", y: "#f6cf4a" };
const RAINCOAT = { p: "#f6cf4a", P: "#d39a22", d: "#f6cf4a", D: "#d39a22", y: "#fff1a8" };
const SKIN = { o: INK, s: "#f9d6bd", S: "#e2a98a", e: "#2b2522", c: "#f4a8a0", r: "#8a4a24", R: "#5e3018", k: "#6b3f22" };
const HAT = { h: "#f2d27a", H: "#c99a45", b: "#c0392b" };
const HOOD = { h: "#f6cf4a", H: "#d39a22", b: "#d39a22" };

// The farmer at (x, y), her feet's middle: `pose` front, side, step, lift or back, `flip` facing left
// (side poses), in her raincoat if `coat`.
export function farmer(b, x, y, pose = "front", { flip = false, coat = false } = {}) {
  const rows = FARMER[pose];
  const colours = { ...SKIN, ...(coat ? RAINCOAT : SHIRT), ...(coat ? HOOD : HAT) };
  const s = sprite(rows, colours);
  b.draw(s, x - Math.floor(s.w / 2), y - s.h, flip);
}

// A villager from the front (no hat): hair `hair` (long if `long`), clothes `top` and `legs`.
const VILLAGER = [
  "...ooooo...",
  "..orrrrro..",
  ".orrrrrrro.",
  ".orrRrRrro.",
  ".orsssssro.",
  ".orsesesro.",
  ".oscsSscso.",
  "..ossssso..",
  ".oPpppppPo.",
  "opPpppppPpo",
  "opPpppppPpo",
  "osPpppppPso",
  ".oPpppppPo.",
  ".odddddddo.",
  "..odDoDdo..",
  "..odo.odo..",
  "..kko.okk..",
];
const LONG_HAIR = VILLAGER.map((row, j) => (j >= 4 && j <= 10 ? "or" + row.slice(2, 9) + "ro" : row));
export function villager(b, x, y, { hair, top, legs = "#4a4f6a", long = false }) {
  const shade = (hex, k) =>
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
  const s = sprite(long ? LONG_HAIR : VILLAGER, {
    ...SKIN,
    r: hair,
    R: shade(hair, 0.7),
    p: top,
    P: shade(top, 0.75),
    d: legs,
    D: shade(legs, 0.75),
  });
  b.draw(s, x - 5, y - s.h);
}

/* ---------- animals and things ---------- */

const HEN = ["......rr..", ".....owwo.", ".oo..oweoy", "owwoowwwo.", "owwwwwwwo.", "oWwwwwwo..", ".oWWWWo...", "..y..y...."];
export const hen = (b, x, y, flip = false, brown = false) =>
  b.draw(
    sprite(HEN, { o: INK, r: "#e0402e", y: "#f39a33", e: "#2b2522", w: brown ? "#c8844a" : "#fbf6ec", W: brown ? "#9a5e30" : "#d8cfc0" }),
    x - 5,
    y - 8,
    flip
  );

const COW = [
  "............o..o..",
  "...........obooboo",
  ".ooooooooo.obwwwbo",
  "owwbbwwwwwoowewwbo",
  "owbbbwwwwbbwwwwwwo",
  "owwbwwwwbbbwwwpppo",
  "owwwwwwwwbwwwopnpo",
  ".owwwwwwwwwwwoooo.",
  ".oWWWWWWWWWWWo....",
  ".oko.oko..oko.oko.",
  ".oko.oko..oko.oko.",
];
export const cow = (b, x, y, flip = false) =>
  b.draw(
    sprite(COW, { o: INK, w: "#fbf6ec", W: "#d8cfc0", b: "#5e3a2a", e: "#2b2522", p: "#f7b1c0", n: "#c9607e", k: "#3b2a22" }),
    x - 9,
    y - 11,
    flip
  );

const SLIME = ["...ooo...", ".oogggoo.", "ogwggggGo", "oggegegGo", "ogggggggo", "oGGGGGGGo", ".ooooooo."];
export function slime(b, x, y, colour, squash = 0) {
  const shade = { "#6ee06a": "#3fa83c", "#6ac8f0": "#3a8ac0", "#c79bf2": "#8a5ac0" }[colour];
  const s = sprite(SLIME, { o: INK, g: colour, G: shade, w: "#ffffff", e: "#1b1b22" });
  b.draw(s, x - 4, y - 7 + squash);
}

const FROG = [".o.o.", "ogogo", "ogggo", ".ooo."];
export const frog = (b, x, y) => b.draw(sprite(FROG, { o: INK, g: "#5fb03a" }), x - 2, y - 4);

const FISH = ["..ooo....", ".offfoo.o", "ofefffoofo", ".offFFoo.o", "..ooo...."];
export const fish = (b, x, y, colour = "#f39a33") => b.draw(sprite(FISH, { o: INK, f: colour, F: "#b05a20", e: "#1b1b22" }), x - 4, y - 5);

const GEM = ["..o..", ".ogo.", "ogwgo", "ogGGo", ".oGo.", "..o.."];
export const gem = (b, x, y, colour) => b.draw(sprite(GEM, { o: INK, g: colour, G: colour, w: "#ffffff" }), x - 2, y - 6);

const EGG = [".oo.", "owwo", "owwo", ".oo."];
export const egg = (b, x, y, brown = false) => b.draw(sprite(EGG, { o: INK, w: brown ? "#e8c08a" : "#fbf6ec" }), x - 2, y - 4);

const HEART = [".oo.oo.", "orroeeo", "orrrrro", ".orrro.", "..oro..", "...o..."];
export const heart = (b, x, y) => b.draw(sprite(HEART, { o: "#7a1f35", r: "#ff5a8a", e: "#ffb8cc" }), x - 3, y);

// A five-pointed star, r across from its middle (x, y) to a point, outlined, lit at the top.
export function star(b, x, y, r, colour = "#f6cf4a", light = "#fff1a8") {
  const inside = (i, j) => {
    const a = (Math.atan2(i, -j) + Math.PI * 2) % ((Math.PI * 2) / 5);
    const u = Math.abs(a / (Math.PI / 5) - 1); // 1 at a point, 0 between two
    return Math.hypot(i, j) <= r * (0.45 + 0.55 * u ** 1.5);
  };
  for (let j = -r - 1; j <= r + 1; j++)
    for (let i = -r - 1; i <= r + 1; i++) {
      if (inside(i, j)) b.px(x + i, y + j, j < -r * 0.2 && i < r * 0.2 ? light : colour);
      else if (inside(i + 1, j) || inside(i - 1, j) || inside(i, j + 1) || inside(i, j - 1)) b.px(x + i, y + j, INK);
    }
}

// A twinkle: a four-pointed star at (x, y), turning with `t`.
export function sparkle(b, x, y, t, colour = "#fff6c9") {
  const k = Math.floor(t * 8) % 3;
  b.px(x, y, "#ffffff");
  for (let r = 1; r <= 1 + (k === 1 ? 1 : 0); r++)
    for (const [dx, dy] of [
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
    ])
      b.px(x + dx, y + dy, colour);
}

// The crops, as the plants grow: a sprout, then the plant (a leafy clump, a staked vine, a tall stalk, a
// vine low along the ground), and ripe with what it bears on it. o the outline, g l G the leaves (mid, lit,
// shaded), S the stake, f F w the fruit (its colour, shade, glint).
const PLANTS = {
  sprout: [".oo..oo.", "ollooglo", ".olllgo.", "..oGGo..", "...oo..."],
  leafy: ["..oo...oo..", ".ollo.oggo.", ".olllogggo.", "..ollggGo..", ".oolllgGGoo", "olllgggGGgo", "oollggGGgoo", "..ooGGGGo..", "....oooo..."],
  staked: [
    "....oSo....",
    "...ooSoo...",
    "..ollSgo...",
    ".ollgSggo..",
    "..oolSgGo..",
    "...ogSloo..",
    "..ollSlgo..",
    ".ollgSggGo.",
    "..oogSGGo..",
    "...olSgo...",
    "..ollSggo..",
    ".olggSgGGo.",
    "..ooGSGoo..",
    "....oSo....",
  ],
  tall: [
    "....o....",
    "...olo...",
    "...olgo..",
    "oo.olgo..",
    "ollolgo.o",
    ".ololgoGo",
    "..oolgoGo",
    "...olgGo.",
    "..oolgo..",
    ".ollogoo.",
    "olloogGGo",
    ".o.olgoGo",
    "...olgo.o",
    "..ooGGo..",
    "...oooo..",
  ],
  vine: ["..oo.....oo..", ".ollo...oggo.", "olllgo.ogggGo", "oollggoggGGoo", ".ooGGgggGGoo.", "...oooGGoo...", "......oo....."],
};
const FRUITS = {
  berry: [".ooo.", "owffo", "offfo", "offFo", ".ooo."],
  small: [".oo.", "owfo", "offo", ".oo."],
  bloom: ["o.o.o", "ofofo", "owfFo", "offFo", ".ooo."],
  head: ["..ooooo..", ".owwfwfo.", "owffwfffo", "offffwffo", ".offfFFo.", "..ooooo.."],
  pumpkin: ["....oGo....", "..oooGooo..", ".offwofffo.", "offwfofffFo", "offffoffFFo", "offffofFFFo", ".offFoFFFo.", "..ooooooo.."],
  cob: [".oo.", "owfo", "offo", "ofFo", "ofFo", "oGGo", ".oo."],
  eggplant: [".oGo.", "ooGoo", "owffo", "offfo", "offFo", "offFo", ".ooo."],
};
// Each crop: its plant, its fruit and colours, and where the fruit hangs on the plant (from its foot).
const CROP = {
  tulip: {
    plant: "leafy",
    fruit: "bloom",
    f: "#f28aa8",
    F: "#c9607e",
    at: [
      [-3, -11],
      [3, -13],
    ],
  },
  cauliflower: { plant: "leafy", fruit: "head", f: "#f6efd8", F: "#d8c8a0", at: [[0, -7]] },
  strawberry: {
    plant: "leafy",
    fruit: "berry",
    f: "#e0402e",
    F: "#a82a20",
    at: [
      [-4, -3],
      [3, -5],
      [0, -1],
    ],
  },
  tomato: {
    plant: "staked",
    fruit: "berry",
    f: "#e0402e",
    F: "#a82a20",
    at: [
      [-3, -10],
      [3, -6],
      [-2, -3],
    ],
  },
  corn: { plant: "tall", fruit: "cob", f: "#f6cf4a", F: "#d8a02a", at: [[3, -10]] },
  blueberry: {
    plant: "leafy",
    fruit: "small",
    f: "#4a6ae0",
    F: "#2a3aa0",
    at: [
      [-4, -4],
      [2, -6],
      [-1, -2],
      [4, -2],
    ],
  },
  pumpkin: { plant: "vine", fruit: "pumpkin", f: "#f39a33", F: "#c0601a", at: [[0, -4]] },
  eggplant: {
    plant: "staked",
    fruit: "eggplant",
    f: "#7a4ab0",
    F: "#4a2a7a",
    at: [
      [3, -8],
      [-3, -4],
    ],
  },
  cranberry: {
    plant: "leafy",
    fruit: "small",
    f: "#c0283a",
    F: "#7a1a2a",
    at: [
      [-4, -5],
      [3, -6],
      [-1, -2],
      [4, -2],
    ],
  },
};
const LEAF = { o: INK, g: "#4fae3a", l: "#8ad85a", G: "#2f7a2a", S: "#a8662f" };
const drawFrom = (b, s, x, y) => b.draw(s, x - Math.floor(s.w / 2), y - s.h);
// A crop at (x, y), the foot of the plant: `name` (CROP), `stage` 0 seed, 1 sprout, 2 growing, 3 ripe.
export function crop(b, x, y, name, stage) {
  if (stage === 0) {
    for (const dx of [-3, 0, 3]) b.px(x + dx, y - 2 - (dx === 0 ? 1 : 0), "#5e3820");
    return;
  }
  const { plant, fruit, at, ...colours } = CROP[name];
  drawFrom(b, sprite(PLANTS[stage === 1 ? "sprout" : plant], LEAF), x, y + 1);
  if (stage < 3) return;
  const s = sprite(FRUITS[fruit], { ...LEAF, ...colours, w: "#ffffff" });
  for (const [dx, dy] of at) b.draw(s, x + dx - Math.floor(s.w / 2), y + dy - Math.floor(s.h / 2));
}
// What the crop bears, picked, its foot at (x, y): held up, tossed in the bin.
export function produce(b, x, y, name) {
  const { fruit, ...colours } = CROP[name];
  drawFrom(b, sprite(FRUITS[fruit], { ...LEAF, ...colours, w: "#ffffff" }), x, y);
}

/* ---------- the ground ---------- */

// Grass for each season (in winter, snow): the ground, its darker blades and its light.
export const GRASS = [
  { base: "#6dbb3c", dark: "#4a9a2c", light: "#9adc5e" },
  { base: "#57ab34", dark: "#3c8826", light: "#82c94c" },
  { base: "#c2a548", dark: "#9a7e30", light: "#e2c464" },
  { base: "#e8f0f6", dark: "#c4d4e6", light: "#ffffff" },
];
export function lawn(b, x, y, w, h, season, seed = 1) {
  const { base, dark, light } = GRASS[season];
  b.rect(x, y, w, h, base);
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      if (n < 0.035) {
        // a tuft: two dark blades with a light one between
        b.px(i, j, dark);
        b.px(i + 2, j, dark);
        b.px(i + 1, j - 1, dark);
        b.px(i + 1, j, light);
      } else if (n > 0.985) b.px(i, j, light);
      else if (season < 3 && n > 0.975) b.px(i, j, dark);
    }
}

// The farm's bare earth (the paths, round the house): sandy orange, speckled, the odd pebble.
export function earth(b, x, y, w, h, seed = 2) {
  b.rect(x, y, w, h, "#e3a65a");
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      if (n < 0.04) b.px(i, j, "#c98a42");
      else if (n > 0.97) b.px(i, j, "#f2c27c");
      else if (n > 0.9985) {
        b.rect(i, j, 2, 1, "#a8a0a0");
        b.px(i, j + 1, "#7a6a60");
      }
    }
}

// Tilled soil, w x h tiles of `size` from (x, y), each its own clod with rounded corners and furrows;
// darker where watered.
export function tilled(b, x, y, w, h, wet = () => false, size = 8) {
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const [tx, ty] = [x + c * size, y + r * size];
      const dry = !wet(c, r);
      const [mid, light, dark] = dry ? ["#8a5530", "#a56a3c", "#5e3820"] : ["#55361f", "#6c4428", "#3a2414"];
      b.rect(tx + 1, ty, size - 2, size, mid);
      b.rect(tx, ty + 1, size, size - 2, mid);
      b.rect(tx + 1, ty, size - 2, 1, light);
      b.rect(tx + 1, ty + size - 1, size - 2, 1, dark);
      b.rect(tx + size - 1, ty + 1, 1, size - 2, dark);
      for (let j = ty + 3; j < ty + size - 2; j += 3) b.rect(tx + 2, j, size - 4, 1, dark); // the furrows
      for (let k = 0; k < size / 3; k++) {
        const [cx, cy] = [tx + 1 + Math.floor(noise(tx + k, ty, 5) * (size - 3)), ty + 1 + Math.floor(noise(tx, ty + k, 6) * (size - 3))];
        b.rect(cx, cy, 2, 1, light);
        b.px(cx + 1, cy + 1, dark);
      }
    }
}

export function sand(b, x, y, w, h, seed = 3) {
  b.rect(x, y, w, h, "#f2da94");
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      if (n < 0.05) b.px(i, j, "#dcbc72");
      else if (n > 0.97) b.px(i, j, "#fff2c0");
    }
}

// Water, moving: deep blue, lighter ripples drifting across, glints. Drawn each frame.
export function water(b, x, y, w, h, t, { deep = "#2f7fd0", ripple = "#5aaaf0", glint = "#d8f0ff" } = {}) {
  b.rect(x, y, w, h, deep);
  for (let j = y + 1; j < y + h; j += 3)
    for (let i = x; i < x + w; i++) {
      const u = Math.sin(i * 0.35 + j * 1.7 + t * 2) + Math.sin(i * 0.11 - t * 1.3 + j);
      if (u > 1.3) b.px(i, j, ripple);
      if (u > 1.85 && noise(i, j, Math.floor(t * 3)) < 0.3) b.px(i, j - 1, glint);
    }
}

// Stone underfoot: the cobbles of the town (`cobbles`), or the cave's floor.
export function cobbles(b, x, y, w, h, seed = 4) {
  b.rect(x, y, w, h, "#b8a88a");
  for (let j = y; j < y + h; j += 4) {
    const shift = ((j - y) / 4) % 2 ? 3 : 0;
    for (let i = x - shift; i < x + w; i += 6) {
      const tone = noise(i, j, seed) < 0.5 ? "#cdbf9e" : "#c2b290";
      b.rect(i + 1, j + 1, 4, 2, tone);
      b.rect(i + 1, j + 3, 5, 1, "#8f8068");
      b.px(i + 1, j + 1, "#e2d6b8");
    }
  }
}
export function caveFloor(b, x, y, w, h, seed) {
  b.rect(x, y, w, h, "#7a5f4a");
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      if (n < 0.05) b.px(i, j, "#5e4636");
      else if (n > 0.975) b.px(i, j, "#94785e");
    }
}

// The floorboards of a room, running across, the joins staggered.
export function boards(b, x, y, w, h, { plank = "#b9773e", light = "#cf8d50", dark = "#8a5228" } = {}) {
  b.rect(x, y, w, h, plank);
  for (let j = y; j < y + h; j += 5) {
    b.rect(x, j, w, 1, light);
    b.rect(x, j + 4, w, 1, dark);
    for (let i = x + (((j - y) / 5) % 2 ? 9 : 0); i < x + w; i += 18) b.rect(i, j, 1, 5, dark);
  }
}
// A wall papered in stripes (`paper`, `stripe`), dark along the top, a skirting board along the bottom.
export function wallpaper(b, x, y, w, h, paper = "#efd9a8", stripe = "#e2c58c") {
  b.rect(x, y, w, h, paper);
  for (let i = x + 2; i < x + w; i += 6) b.rect(i, y, 2, h, stripe);
  b.rect(x, y, w, 2, "#6b3f22");
  b.rect(x, y + h - 3, w, 3, "#8a5228");
  b.rect(x, y + h - 3, w, 1, "#a8683a");
}

/* ---------- on the ground ---------- */

// A wooden fence along y (its posts' feet) from x0 to x1.
export function fence(b, x0, x1, y) {
  for (const ry of [y - 7, y - 4]) {
    b.rect(x0, ry, x1 - x0, 2, "#c8823f");
    b.rect(x0, ry, x1 - x0, 1, "#e0a35a");
    b.rect(x0, ry + 2, x1 - x0, 1, INK);
  }
  for (let x = x0; x < x1; x += 8) {
    b.rect(x, y - 10, 3, 10, "#a8662f");
    b.rect(x, y - 10, 3, 1, "#e0a35a");
    b.px(x, y - 9, "#c8823f");
    b.rect(x + 3, y - 10, 1, 10, INK);
    b.rect(x - 1, y - 10, 1, 10, INK);
  }
}

// A leafy tree, its trunk's foot at (x, y): clumps of leaves lit from the upper left, each clump's lower
// edge darker, the whole outlined; the season's colours (bare and snowy in winter). `size` 1 is about 30 high.
const LEAVES = [
  ["#7ec84a", "#4f9a2e", "#2f6a24", "#b2e66a"],
  ["#5aae3a", "#3a8a2a", "#22601e", "#8ad25a"],
  ["#e8962e", "#c0601e", "#8a3a16", "#f6c050"],
  ["#dfe8ee", "#a8b8c8", "#6a7a8a", "#ffffff"],
];
export function tree(b, x, y, season, seed = 0, size = 1) {
  const r = 8 * size;
  const cy = y - 12 * size - r;
  b.rect(x - 2, y - 14 * size, 5, 14 * size, "#7a4a26");
  b.rect(x - 2, y - 14 * size, 2, 14 * size, "#9a6a3a");
  b.rect(x + 2, y - 14 * size, 1, 14 * size, INK);
  b.rect(x - 3, y - 14 * size, 1, 14 * size, INK);
  b.rect(x - 4, y - 1, 9, 1, "#2a4a1a");
  if (season === 3 && seed % 2) {
    // bare branches with snow along them
    for (const [dx, dy, len] of [
      [-1, -4, 7],
      [1, -7, 6],
      [-1, -10, 5],
    ])
      for (let k = 0; k < len; k++) {
        const side = dx < 0 ? -k : k;
        b.px(x + side, y - 14 * size + dy - Math.floor(k / 2), "#5e3a20");
        b.px(x + side, y - 14 * size + dy - Math.floor(k / 2) - 1, "#ffffff");
      }
    return;
  }
  const [mid, low, deep, hi] = LEAVES[season];
  const blobs = [
    [0, 2, r],
    [-r * 0.7, 3, r * 0.65],
    [r * 0.7, 3, r * 0.65],
    [-r * 0.35, -r * 0.55, r * 0.6],
    [r * 0.4, -r * 0.5, r * 0.6],
  ].map(([dx, dy, rr], k) => [x + dx + (noise(seed, k, 9) - 0.5) * 2, cy + dy, rr]);
  const inside = (i, j) => {
    for (let k = blobs.length - 1; k >= 0; k--) {
      const [bx, by, br] = blobs[k];
      if ((i - bx) ** 2 + (j - by) ** 2 <= br * br) return k;
    }
    return -1;
  };
  const x0 = Math.floor(x - 2 * r);
  const y0 = Math.floor(cy - 1.6 * r);
  for (let j = y0; j < cy + 1.6 * r; j++)
    for (let i = x0; i < x + 2 * r; i++) {
      const k = inside(i + 0.5, j + 0.5);
      if (k < 0) {
        if (inside(i + 1.5, j + 0.5) >= 0 || inside(i - 0.5, j + 0.5) >= 0 || inside(i + 0.5, j + 1.5) >= 0 || inside(i + 0.5, j - 0.5) >= 0)
          b.px(i, j, INK);
        continue;
      }
      const [bx, by, br] = blobs[k];
      const [nx, ny] = [(i + 0.5 - bx) / br, (j + 0.5 - by) / br];
      const lit = -0.6 * nx - 0.8 * ny + (noise(i, j, seed) - 0.5) * 0.5;
      const edge = nx * nx + ny * ny > 0.72 && ny > 0.1;
      b.px(i, j, edge ? deep : lit > 0.55 ? hi : lit > -0.1 ? mid : low);
    }
  if (season === 3) for (const [bx, by, br] of blobs) b.rect(bx - br * 0.6, by - br + 1, br * 1.2, 2, "#ffffff"); // snow on top
}

// A pine, its foot at (x, y): three tiers, snow on them in winter.
export function pine(b, x, y, season) {
  b.rect(x - 1, y - 6, 3, 6, "#6b3f22");
  for (let tier = 0; tier < 3; tier++) {
    const base = y - 5 - tier * 8;
    const half = 10 - tier * 3;
    for (let j = 0; j < 12; j++) {
      const w = Math.round((half * (j + 1)) / 12);
      const yy = base - 12 + j;
      b.rect(x - w - 1, yy, 1, 1, INK);
      b.rect(x + w + 1, yy, 1, 1, INK);
      b.rect(x - w, yy, w, 1, season === 3 && j < 3 ? "#ffffff" : "#3f8a4a");
      b.rect(x, yy, w + 1, 1, season === 3 && j < 3 ? "#dfe8ee" : "#2a6a3a");
    }
    b.rect(x - half - 1, base, 2 * half + 3, 1, INK);
  }
}

// A round bush at (x, y), its foot; berries (`berries` their colour) on it.
export function bush(b, x, y, season, berries = null) {
  const [mid, low, deep, hi] = LEAVES[Math.min(season, 2)];
  for (let j = -9; j <= 0; j++)
    for (let i = -7; i <= 7; i++) {
      const d = (i / 7) ** 2 + ((j + 4.5) / 5) ** 2;
      if (d > 1.15) continue;
      const lit = -0.6 * (i / 7) - 0.8 * ((j + 4.5) / 5) + (noise(x + i, y + j, 8) - 0.5) * 0.6;
      b.px(x + i, y + j, d > 0.85 ? (j > -4 ? deep : INK) : lit > 0.45 ? hi : lit > -0.2 ? mid : low);
    }
  if (season === 3) b.rect(x - 4, y - 9, 9, 2, "#ffffff");
  if (berries)
    for (const [i, j] of [
      [-3, -6],
      [2, -5],
      [-1, -3],
      [4, -2],
      [-5, -2],
    ])
      b.px(x + i, y + j, berries);
}

// Flowers along a bed, `n` of them from (x, y) every 4.
export function flowers(b, x, y, n, seed = 0) {
  const colours = ["#ff6f9a", "#f6cf4a", "#ffffff", "#c79bf2", "#e0402e"];
  for (let k = 0; k < n; k++) {
    const fx = x + k * 4 + Math.floor(noise(k, seed, 2) * 2);
    b.rect(fx, y - 2, 1, 2, "#3a8a2a");
    const c = colours[Math.floor(noise(k, seed, 3) * colours.length)];
    b.px(fx - 1, y - 3, c);
    b.px(fx + 1, y - 3, c);
    b.px(fx, y - 4, c);
    b.px(fx, y - 3, "#fff1a8");
  }
}

// A sky going paler to the horizon `h` high, and clouds drifting across with `t`.
export function sky(b, h, top, bottom, t = 0, clouds = 3) {
  for (let j = 0; j < h; j++) {
    const k = j / h;
    b.rect(0, j, b.w, 1, mixHex(top, bottom, k));
  }
  for (let c = 0; c < clouds; c++) {
    const cx = ((c * 67 + t * (3 + c)) % (b.w + 50)) - 25;
    const cy = 5 + c * 9;
    cloud(b, cx, cy, 10 + (c % 2) * 6);
  }
}
export function cloud(b, x, y, r) {
  for (const [dx, dy, rr] of [
    [0, 0, r],
    [-r * 0.9, 2, r * 0.6],
    [r * 0.9, 2, r * 0.7],
    [r * 0.3, -r * 0.4, r * 0.6],
  ])
    for (let j = -rr; j <= rr; j++) {
      const half = Math.sqrt(Math.max(0, rr * rr - j * j)) * 1.4;
      if (y + dy + j > y + r * 0.5) continue; // flat underneath
      b.rect(x + dx - half, y + dy + j, 2 * half, 1, j < -rr * 0.3 ? "#ffffff" : "#eef6fc");
    }
  b.rect(x - r * 1.6, y + r * 0.5, r * 3.4, 1, "#d6e6f2");
}

export function mixHex(a, c, k) {
  const pa = parseInt(a.slice(1), 16);
  const pc = parseInt(c.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pc >> s) & 255) - ((pa >> s) & 255)) * k);
  return "#" + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0");
}

/* ---------- buildings ---------- */

// Where the farmhouse at (x, y) has its window's panes (8 x 9).
export const houseWindow = (x, y) => [x - 20, y - 21];

// The farmhouse from the front, its doorstep's middle at (x, y): a red shingled roof, log walls, the
// window with green shutters, the door with its mat, the porch, the woodpile to the left.
export function farmhouse(b, x, y) {
  const left = x - 30;
  const top = y - 44;
  // Roof: rows of shingles, each row's edge dark, lighter at the eaves.
  for (let j = 0; j < 18; j++) {
    const inset = Math.max(0, 6 - j);
    const c = j % 3 === 2 ? "#7e2a1c" : j % 3 === 0 ? "#d2553a" : "#b8432c";
    b.rect(left - 2 + inset, top + j, 64 - 2 * inset, 1, c);
    if (j % 3 === 1) for (let i = left + inset + ((j / 3) % 2 ? 2 : 0); i < left + 62 - inset; i += 5) b.px(i, top + j, "#7e2a1c");
  }
  b.rect(left - 2, top + 18, 64, 1, INK);
  // Walls: logs.
  for (let j = 0; j < 20; j++) b.rect(left, top + 19 + j, 60, 1, j % 4 === 3 ? "#6b3f22" : j % 4 === 0 ? "#d29152" : "#b5763c");
  b.rect(left - 1, top + 19, 1, 20, INK);
  b.rect(left + 60, top + 19, 1, 20, INK);
  // Window with shutters.
  const [wx] = houseWindow(x, y);
  b.rect(wx - 4, top + 23, 3, 9, "#3f7a4a");
  b.rect(wx + 9, top + 23, 3, 9, "#3f7a4a");
  b.rect(wx - 1, top + 22, 10, 11, INK);
  b.rect(wx, top + 23, 8, 9, "#7cc8f5");
  b.rect(wx + 3, top + 23, 1, 9, "#e8e0d0");
  b.rect(wx, top + 27, 8, 1, "#e8e0d0");
  b.rect(wx + 1, top + 24, 2, 2, "#d8f0ff");
  // Door.
  b.rect(x - 5, top + 22, 11, 17, INK);
  b.rect(x - 4, top + 23, 9, 16, "#a8662f");
  b.rect(x - 3, top + 24, 3, 6, "#8a5228");
  b.rect(x + 1, top + 24, 3, 6, "#8a5228");
  b.px(x + 3, top + 31, "#f6cf4a");
  // Porch and step, the red mat.
  b.rect(left - 2, y - 5, 64, 4, "#c8823f");
  b.rect(left - 2, y - 5, 64, 1, "#e0a35a");
  b.rect(left - 2, y - 1, 64, 1, INK);
  b.rect(x - 4, y - 4, 9, 2, "#c0392b");
  // Woodpile: log ends.
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4 - r; c++) {
      const [lx, ly] = [left - 14 + c * 5 + r * 2, y - 9 - r * 5];
      b.rect(lx, ly, 5, 5, INK);
      b.rect(lx + 1, ly + 1, 3, 3, "#d8a868");
      b.px(lx + 2, ly + 2, "#a8662f");
    }
}

// A shipping bin at (x, y), its foot: a wooden chest, its lid open if `open`.
export function shippingBin(b, x, y, open = false) {
  b.rect(x - 1, y - 9, 18, 10, INK);
  b.rect(x, y - 8, 16, 8, "#a8662f");
  for (let i = x + 3; i < x + 16; i += 4) b.rect(i, y - 8, 1, 8, "#8a5228");
  b.rect(x, y - 8, 16, 1, "#c8823f");
  if (open) {
    b.rect(x - 1, y - 15, 18, 6, INK);
    b.rect(x, y - 14, 16, 4, "#c8823f");
    b.rect(x, y - 9, 16, 1, "#2a1a10");
  } else b.rect(x - 1, y - 11, 18, 3, "#c8823f");
}

// The mailbox on its post at (x, y), the flag up if `flag`.
export function mailbox(b, x, y, flag) {
  b.rect(x, y - 8, 2, 8, "#6b3f22");
  b.rect(x - 4, y - 14, 10, 7, INK);
  b.rect(x - 3, y - 13, 8, 5, "#5a7ab0");
  b.rect(x - 3, y - 13, 8, 1, "#8aa8d8");
  if (flag) b.rect(x + 6, y - 16, 1, 6, "#e0402e");
}

/* ---------- the game's own bits ---------- */

// The hotbar along the bottom: ten slots, the tool in use (TOOL_ICONS' index) boxed in red.
const ICONS = [
  // watering can, fishing rod, pickaxe, scythe, milk pail, frying pan, a gift, a parsnip, sword, hoe
  ["......", ".oooo.", "obbbbo", "obbbbo", ".oooo."],
  ["....o.", "...o..", "..o...", ".o....", "o....."],
  [".ooo..", "o..ko.", "...k..", "...k..", "...k.."],
  ["oooo..", "....o.", "...k..", "..k...", ".k...."],
  [".ooo..", "owwwo.", "owwwo.", "ossso.", ".ooo.."],
  ["......", ".oooo.", "ossssok", ".oooo.", "......"],
  ["..r...", "rrrrr.", "pprpp.", "pprpp.", "......"],
  ["..g...", ".ggg..", ".www..", "..w...", "..w..."],
  ["....s.", "...s..", "..s...", "ok....", "o....."],
  ["oooo..", "...k..", "...k..", "...k..", "...k.."],
];
const ICON_COLOURS = { o: "#5a5a6a", b: "#3e8fd6", k: "#8a5228", w: "#ffffff", s: "#8a8f97", r: "#e0402e", p: "#e05aa0", g: "#5fb03a" };
export function hotbar(b, tool, H) {
  const [n, size] = [10, 9];
  const x0 = Math.round((b.w - n * (size + 1) - 3) / 2);
  const y0 = H - size - 4;
  b.rect(x0 - 2, y0 - 2, n * (size + 1) + 5, size + 5, INK);
  b.rect(x0 - 1, y0 - 1, n * (size + 1) + 3, size + 3, "#d8843a");
  for (let k = 0; k < n; k++) {
    const sx = x0 + 1 + k * (size + 1);
    b.rect(sx, y0 + 1, size - 1, size - 1, "#f6d7a0");
    b.rect(sx, y0 + 1, size - 1, 1, "#c89058");
    if (k < ICONS.length) b.draw(sprite(ICONS[k], ICON_COLOURS), sx + 1, y0 + 2);
  }
  if (tool >= 0) {
    const sx = x0 + 1 + tool * (size + 1);
    b.rect(sx - 1, y0, size + 1, 1, "#e0302a");
    b.rect(sx - 1, y0 + size, size + 1, 1, "#e0302a");
    b.rect(sx - 1, y0, 1, size + 1, "#e0302a");
    b.rect(sx + size - 1, y0, 1, size + 1, "#e0302a");
  }
}

// The dialogue box across the bottom: `words` (up to three lines of thirty letters) written out as far as
// `said` (0-1), and the speaker's portrait on the right (their `hair` and `top`).
export function dialogue(b, said, words, { hair, top }, H) {
  const [x, y, w, h] = [6, H - 30, b.w - 12, 27];
  b.rect(x - 1, y - 1, w + 2, h + 2, INK);
  b.rect(x, y, w, h, "#d8843a");
  b.rect(x + 2, y + 2, w - 4, h - 4, "#fbe3b0");
  b.rect(x + 2, y + 2, w - 4, 1, "#f0c888");
  const [px, py] = [x + w - 30, y + 3];
  b.rect(px - 1, py, 1, h - 6, "#d8843a");
  b.rect(px + 2, py + 1, 24, 20, "#e8c890");
  // The portrait: a face, big.
  b.rect(px + 7, py + 3, 14, 14, hair);
  b.rect(px + 9, py + 6, 10, 10, "#f9d6bd");
  b.rect(px + 9, py + 6, 10, 2, hair);
  b.rect(px + 11, py + 10, 2, 2, "#2b2522");
  b.rect(px + 16, py + 10, 2, 2, "#2b2522");
  b.rect(px + 10, py + 13, 2, 1, "#f4a8a0");
  b.rect(px + 17, py + 13, 2, 1, "#f4a8a0");
  b.rect(px + 13, py + 14, 3, 1, "#c4503f");
  b.rect(px + 6, py + 18, 16, 3, top);
  lines(b, words, said * letters(words), x + 6, y + 5, "#5c3a26", "#e8c890");
}

// Rain falling over everything, the streaks moving with `t`.
export function rain(b, t, n = 60) {
  for (let k = 0; k < n; k++) {
    const x = Math.floor(noise(k, 1, 7) * (b.w + 20)) - Math.floor((t * 40) % 20);
    const y = Math.floor((noise(k, 2, 7) * b.h + t * 120) % (b.h + 8)) - 4;
    for (let s = 0; s < 4; s++) b.px(x - Math.floor(s / 2), y + s, "#c8d8f0");
  }
}
