/*******************************************************************************
 * The girl's other day clothes, for the playground's dressing corner: besides
 * her grey sweater and pink gingham shorts (girl.js), a cream top and shorts
 * embroidered with red flowers and trimmed with lace; a long brown coat over a
 * pink hoodie, with a patterned cream scarf, wide dark trousers and high-top
 * trainers; a long white linen shirt dress with a straw hat; a long cream dress
 * printed with roses; a white blouse embroidered in blue over a long skirt
 * printed with blue flowers like old china; and a lilac satin T-shirt over a
 * satin midi skirt with a draped panel, white socks and white trainers. Each
 * look is built on her skeleton (chibi.js) the way girl.js builds hers, and
 * drawn flat on its hanger for the rail in the dressing corner.
 *
 * The profile page never loads this file, so her looks there are unchanged.
 ******************************************************************************/

import { part, ellipsoid, box, hash } from "./voxels.js";

export const OUTFIT_PALETTE = {
  skin: "#ffdcc2",
  // Her sweater and shorts (as in girl.js), for the rail.
  sweater: "#bdb6ac",
  rib: "#a69f95",
  check: "#e0738f",
  checkMid: "#f2b0c0",
  checkLight: "#fdf0f2",
  emb: "#f7f0e0",
  embShade: "#e3d8c1",
  lace: "#fffbf3",
  embRed: "#c8323c",
  embLeaf: "#5f8f4e",
  tie: "#ffffff",
  coat: "#5b4a40",
  coatDark: "#47392f",
  hoodie: "#f4d6cf",
  trouser: "#262833",
  scarf: "#c9b99d",
  scarfCream: "#f4eee2",
  scarfTaupe: "#a89a84",
  fringe: "#ebe2d0",
  trainerGrey: "#a9a5a3",
  trainerCream: "#f1ece3",
  dressCream: "#f6efe2",
  rosePink: "#eaa1a3",
  roseRed: "#d4555b",
  roseLeaf: "#8fa58a",
  dressButton: "#fffaf2",
  blouseWhite: "#fbfbfd",
  blouseBlue: "#9db4e0",
  porcelainBlue: "#3f68a8",
  porcelainNavy: "#284778",
  skirtWhite: "#f9fafc",
  flatSilver: "#c9ccd2",
  satin: "#d6cdda",
  satinLight: "#ebe5ee",
  satinShade: "#b8adc0",
  sneaker: "#f3f1ec",
  sneakerStripe: "#2a2a30",
  sandal: "#6f5644",
  sock: "#fbfbf8",
  linen: "#fcfbf6",
  linenShade: "#e6e2d6",
  button: "#cfc7b4",
  hatStraw: "#dcb97a",
  hatStrawDark: "#c39b5b",
  hatBand: "#2b2b30",
};

// Pink gingham, as on her shorts in girl.js.
const gingham = (x, y, z) => {
  const a = Math.floor((x + z) / 2) & 1;
  const b = Math.floor(y / 2) & 1;
  return a && b ? "check" : a || b ? "checkMid" : "checkLight";
};
// The scarf's pattern: little cream flowers and taupe stars in rows on the sand-coloured wool.
const scarf = (x, y) => {
  const k = (((x + 2 * y) % 4) + 4) % 4;
  return k === 0 ? "scarfCream" : k === 2 && y % 2 ? "scarfTaupe" : "scarf";
};
// Prints, on cloth seen from any side (x + z runs round it): roses of red and pink with sage leaves on
// cream; blue flowers and leaves on white, like old china; and the blouse's fine blue stitching in a
// diamond lattice with a little blue flower here and there.
// Little flowers strewn over the cloth: the cloth is cut into `cell`-wide squares, and with odds `odds` a
// square holds one flower somewhere in it, so they never line up. Returns which part of a flower the voxel
// is on ("heart", "petal" or "leaf": one leaf at a slant, or `leaves` 2 for a pair), or nothing.
const strewn = (seed, cell, odds, leaves) => (x, y, z) => {
  const [u, v] = [x + z + 60, y + 60];
  const [i0, j0] = [Math.floor(u / cell), Math.floor(v / cell)];
  for (let i = i0 - 1; i <= i0 + 1; i++)
    for (let j = j0 - 1; j <= j0 + 1; j++) {
      if (hash(i, j, seed) >= odds) continue;
      const du = u - i * cell - Math.floor(hash(i, j, seed + 1) * cell);
      const dv = v - j * cell - Math.floor(hash(i, j, seed + 2) * cell);
      const d = Math.abs(du) + Math.abs(dv);
      if (d === 0) return "heart";
      if (d === 1) return "petal";
      const slant = hash(i, j, seed + 3) < 0.5 ? 1 : -1;
      if (Math.abs(du) === 1 && du === slant * dv && (leaves === 2 || dv < 0)) return "leaf";
    }
};
const rose = strewn(7, 4, 0.55, 1);
const roses = (x, y, z) => ({ heart: "roseRed", petal: "rosePink", leaf: "roseLeaf" })[rose(x, y, z)] || "dressCream";
const smock = (x, y) => ((x + y) % 2 ? "dressCream" : "rosePink"); // the smocked waist
const blueFlower = strewn(9, 5, 0.7, 2);
const china = (x, y, z) => ({ heart: "porcelainNavy", petal: "porcelainBlue", leaf: "blouseBlue" })[blueFlower(x, y, z)] || "skirtWhite";
const stitch = (x, y, z) => {
  const [u, v] = [x + z + 60, y + 60];
  if (u % 4 === 1 && v % 4 === 1 && hash(Math.floor(u / 4), Math.floor(v / 4), 11) < 0.15) return "porcelainBlue";
  return (u + v) % 6 === 0 || (u - v + 600) % 6 === 0 ? "blouseBlue" : "blouseWhite";
};
// Satin catching the light in soft folds; and the draped panel of the satin skirt, falling from her right
// hip down across the front to the hem on her left, lit along its edge with the shadow of the fold beside.
const sheen = (x, z, n = 4) => (folds(x, z, n) > 0.75 ? "satinLight" : folds(x, z, n) < -0.8 ? "satinShade" : "satin");
const cascade = (x, y, z) => {
  if (z <= 0) return sheen(x, z, 5);
  const d = x - (1.5 - (10 - y) * 0.35);
  return Math.abs(d) < 0.8 ? "satinLight" : d >= 0.8 && d < 1.8 ? "satinShade" : sheen(x, z, 5);
};
const lace = (x) => (((x % 2) + 2) % 2 ? "lace" : "embShade");
const skinX = (side, x0) => (side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2]); // the inner two columns of an arm
const skirtX = (side) => (side > 0 ? [0, 5] : [-5, -1]); // the two legs' halves of a skirt, meeting in the middle

// Her body from the hips to the neck, as girl.js shapes it, coloured by `color(x, y, z)` and `rx(y)` wide.
function torso(color, rx = (y) => (y <= 17 ? 5 : y === 18 ? 4.5 : 4)) {
  const p = part();
  for (let y = 9; y <= 19; y++) ellipsoid(p, [0, y, -0.5], [rx(y), 0.5, 3.5], color, [], 3);
  ellipsoid(p, [0, 20, -0.5], [3, 0.5, 2.5], color);
  return p;
}
// Bare legs from the knee down in her white slides, as in girl.js.
function slides(side, x0) {
  const p = part();
  box(p, [x0, x0 + 1], [1, 4], [-1, 0], "skin");
  box(p, [x0, x0 + 1], [0, 0], [-1, 2], "sole");
  box(p, [x0, x0 + 1], [1, 1], [0, 1], "strap");
  box(p, [x0, x0 + 1], [1, 1], [2, 2], "skin"); // toes
  return p;
}
// A skirt from the waist (`top`, tucked under the top) down to the hem, round and flaring out by `flare`
// voxels at the hem, coloured by `color(x, y, z)`; `hem(x, z)` is the height of the hem all round, to let it
// dip on one side. It hangs from her body, not her legs, so it stays one skirt as she walks, her feet stepping
// out under the hem; when she sits or kneels it gives way to her lap (`lap` and `drape`, dressGirl).
function skirt(color, { top = 10, flare = 2.5, hem = () => 1 } = {}) {
  const p = part();
  const below = { has: (x, y, z) => y < hem(x, z) };
  for (let y = 0; y <= top; y++) {
    const k = ((top - y) / top) ** 1.4; // flaring out more towards the hem
    ellipsoid(p, [0, y, -0.5], [5 + flare * k, 0.5, 3.6 + 0.8 * flare * k], color, [below], 3);
  }
  return p;
}
// Soft folds running down a skirt: -1 to 1 round it, `n` folds to a half turn.
const folds = (x, z, n) => Math.sin(Math.atan2(x, z + 0.5) * n);
// A print laid round a skirt by the distance round it, so its flowers keep their shape on the curve.
const round = (print) => (x, y, z) => print(Math.round(Math.atan2(x, z + 0.5) * 6), y, 0);
// Sitting or kneeling in a skirt: the skirt over each thigh (inside the skirt as she stands), and its hem
// falling from her knee down to `low`.
const lap = (color) => (side) => {
  const p = part();
  box(p, side > 0 ? [0, 4] : [-4, -1], [5, 8], [-2, 1], color);
  return p;
};
const drape = (color, low) => (side) => {
  const p = part();
  box(p, side > 0 ? [0, 4] : [-4, -1], [low, 4], [1, 2], color);
  return p;
};
// A big puffed sleeve in `print`, gathered in at the shoulder; and the sleeve on down the forearm to a cuff
// of `cuff` at the wrist.
const puffSleeve = (print) => (side, x0) => {
  const p = part();
  box(p, [x0 - 1, x0 + 3], [14, 18], [-3, 2], print);
  box(p, [x0, x0 + 2], [19, 19], [-2, 1], print);
  return p;
};
const cuffSleeve = (print, cuff) => (side, x0) => {
  const p = part();
  box(p, [x0, x0 + 2], [10, 13], [-2, 1], print);
  box(p, skinX(side, x0), [9, 9], [-1, 0], cuff);
  box(p, skinX(side, x0), [8, 8], [-1, 0], "skin");
  return p;
};
// A bare forearm and hand under a short sleeve.
function bareFore(side, x0) {
  const p = part();
  box(p, skinX(side, x0), [8, 13], [-1, 0], "skin");
  return p;
}

export const LOOKS = [
  {
    name: "Cosy sweater",
    // Worn: her own clothes in girl.js. On the hanger: the sweater, the shorts clipped under it.
    hang(p, x) {
      box(p, [x - 4, x + 4], [-11, -3], [0, 0], (vx, y) => (y === -11 || y === -3 ? "rib" : "sweater"));
      box(p, [x - 3, x + 3], [-16, -12], [0, 0], gingham);
    },
  },
  {
    name: "Embroidered set",
    // A cropped cream top with fluttering lace sleeves, tied at the front with white ribbons, and red
    // flowers embroidered on the chest; shorts to match, smocked at the waist and edged with lace.
    torso: () => {
      const p = torso((x, y, z) => (y <= 10 ? (x % 2 ? "embShade" : "emb") : y === 11 ? "skin" : y === 12 ? lace(x) : "emb"));
      for (let y = 17; y <= 20; y++) for (let x = -(y - 16); x <= y - 16; x++) if (y < 20 || Math.abs(x) <= 1) p.front(x, y)[3] = "skin"; // the V of the neck
      for (const [x, y] of [
        [-3, 15],
        [3, 16],
      ]) {
        p.front(x, y)[3] = "embRed";
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, 1],
          [0, -1],
        ])
          p.front(x + dx, y + dy)[3] = dy ? "embLeaf" : "embRed";
      }
      const [, , zf] = p.front(0, 14);
      for (const [x, y] of [
        [0, 16],
        [-1, 15],
        [1, 15],
        [-1, 14],
        [1, 13],
        [0, 13],
      ])
        p.add(x, y, zf + 1, "tie"); // the bow and its ribbons
      return p;
    },
    thigh(side, x0) {
      const p = part();
      box(p, [x0, x0 + 1], [5, 8], [-1, 0], "skin");
      box(p, side > 0 ? [1, 4] : [-4, -1], [6, 8], [-2, 1], (x, y) => (y === 6 ? lace(x) : "emb"));
      if (side < 0) {
        p.add(-3, 7, 2, "embRed");
        p.add(-2, 8, 2, "embLeaf");
      }
      return p;
    },
    shin: slides,
    upper(side, x0) {
      const p = part();
      box(p, [x0, x0 + 2], [16, 19], [-2, 1], "emb");
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)], [15, 15], [-2, 1], lace); // the frill flares out
      box(p, skinX(side, x0), [14, 14], [-1, 0], "skin");
      return p;
    },
    fore: bareFore,
    hang(p, x) {
      box(p, [x - 3, x + 3], [-9, -3], [0, 0], (vx, y) => (y === -9 ? lace(vx) : Math.abs(vx - x) <= y + 5 ? "embShade" : "emb")); // the V of the neck
      for (const dx of [-4, 4]) box(p, [x + dx, x + dx], [-6, -3], [0, 0], (vx, y) => (y === -6 ? "lace" : "emb"));
      p.add(x - 2, -6, 1, "embRed");
      p.add(x + 2, -7, 1, "embRed");
      box(p, [x, x], [-8, -5], [1, 1], "tie");
      box(p, [x - 3, x + 3], [-15, -11], [0, 0], (vx, y) => (y === -15 ? lace(vx) : y === -11 ? "embShade" : "emb"));
      p.add(x - 2, -13, 1, "embRed");
    },
  },
  {
    name: "Coat and scarf",
    // A long brown wool coat worn open over a pale pink zip-up hoodie, the hood at the back of the neck; a
    // wide cream scarf with a pattern of little flowers and stars round the neck, its fringed ends hanging
    // down the front; wide dark trousers, and grey and cream high-top trainers.
    torso: () => {
      const p = torso(
        (x, y) => (Math.abs(x) <= 2 && y >= 11 ? "hoodie" : "coat"),
        (y) => (y <= 17 ? 5.5 : y === 18 ? 5 : 4.5)
      );
      for (let y = 9; y <= 10; y++) for (let x = -1; x <= 1; x++) p.front(x, y)[3] = "trouser"; // the coat open below the hoodie
      // The hood, gathered at the back of the neck.
      ellipsoid(p, [0, 20, -4], [3, 1.4, 1.2], "hoodie");
      // The scarf: once round the neck, then its two ends down the front over the coat, fringed.
      ellipsoid(p, [0, 20, -0.5], [4, 1, 3.6], scarf, [{ has: (x, y, z) => Math.abs(x) < 3 && z < 2 && z > -3 }]);
      for (const side of [-1, 1])
        for (let y = 8; y <= 19; y++)
          for (const x of side < 0 ? [-4, -3, -2] : [2, 3, 4]) {
            const [, , zf] = p.front(x, Math.max(y, 9));
            p.add(x, y, zf + 1, y <= 9 ? (x % 2 ? "scarfCream" : "fringe") : scarf(x, y));
          }
      return p;
    },
    thigh(side) {
      const p = part();
      box(p, skirtX(side), [5, 8], [-3, 2], (x, y, z) => (z === 2 && Math.abs(x) <= 1 ? "trouser" : "coat")); // open at the front
      return p;
    },
    shin(side, x0) {
      const p = part();
      box(p, skirtX(side), [3, 4], [-3, 2], (x, y, z) => (y === 3 ? "coatDark" : z === 2 && Math.abs(x) <= 1 ? "trouser" : "coat"));
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 1 + (side > 0 ? 1 : 0)], [1, 2], [-2, 1], "trouser"); // wide legs
      box(p, [x0, x0 + 1], [0, 1], [-1, 2], (x, y, z) =>
        y === 0 ? "sole" : z === 2 ? "trainerCream" : (x + z) % 2 ? "trainerGrey" : "trainerCream"
      );
      return p;
    },
    upper(side, x0) {
      const p = part();
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)], [14, 19], [-2, 1], "coat");
      return p;
    },
    fore(side, x0) {
      const p = part();
      box(p, [x0, x0 + 2], [10, 13], [-2, 1], (x, y) => (y === 10 ? "coatDark" : "coat"));
      box(p, skinX(side, x0), [9, 9], [-1, 0], "hoodie"); // the cuff of the hoodie
      box(p, skinX(side, x0), [8, 8], [-1, 0], "skin");
      return p;
    },
    hang(p, x) {
      box(p, [x - 4, x + 4], [-24, -3], [0, 0], (vx, y) => (Math.abs(vx - x) <= 1 && y >= -12 ? "hoodie" : y === -24 ? "coatDark" : "coat"));
      for (const dx of [-3, -2, 2, 3])
        box(p, [x + dx, x + dx], [-14, -4], [1, 1], (vx, y) => (y <= -13 ? (vx % 2 ? "scarfCream" : "fringe") : scarf(vx, y)));
    },
  },
  {
    name: "Linen shirt dress",
    // A long white shirt dress: a collar, a button placket down the front and short loose sleeves; white
    // socks in sandals, and a wide straw hat with a black band.
    torso: () => {
      const p = torso((x, y) => (x === 0 && y >= 9 ? (y % 3 === 2 ? "button" : "linenShade") : "linen"));
      for (const x of [-3, -2, 2, 3]) p.front(x, 19)[3] = "linenShade"; // the collar
      p.front(0, 20)[3] = "skin";
      return p;
    },
    skirt: () =>
      skirt((x, y, z) => (x === 0 && z >= 2 ? (y % 3 === 2 ? "button" : "linenShade") : folds(x, z, 5) > 0.7 ? "linenShade" : "linen"), {
        top: 9,
        flare: 1.6,
        hem: () => 2,
      }),
    thigh: lap("linen"),
    drape: drape("linen", 2),
    shin(side, x0) {
      const p = part();
      box(p, [x0, x0 + 1], [1, 2], [-1, 0], (x, y) => (y === 1 ? "sock" : "skin"));
      box(p, [x0, x0 + 1], [0, 0], [-1, 2], (x, y, z) => (z === 2 ? "sock" : "sandal"));
      return p;
    },
    upper(side, x0) {
      const p = part();
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)], [14, 19], [-2, 1], (x, y) => (y === 14 ? "linenShade" : "linen"));
      return p;
    },
    fore: bareFore,
    // A wide straw brim over the hair and a round crown, banded in black.
    hat(headPart) {
      const p = part();
      const weave = (x, y, z) => ((x + z + y) % 3 ? "hatStraw" : "hatStrawDark");
      for (let x = -14; x <= 14; x++)
        for (let z = -14; z <= 13; z++) {
          const r = (x / 14) ** 2 + ((z + 0.5) / 13.5) ** 2;
          if (r <= 1 && !headPart.has(x, 40, z)) p.add(x, 40, z, r > 0.8 ? "hatStrawDark" : weave(x, 40, z));
        }
      ellipsoid(p, [0, 43, -0.5], [9, 3.5, 8.5], (x, y, z) => (y <= 41 ? "hatBand" : weave(x, y, z)), [headPart, { has: (x, y) => y < 41 }]);
      return p;
    },
    hang(p, x) {
      box(p, [x - 4, x + 4], [-6, -3], [0, 0], (vx, y) => (Math.abs(vx - x) === 4 && y === -6 ? "linenShade" : "linen")); // the shoulders and sleeves
      box(p, [x - 3, x + 3], [-24, -7], [0, 0], (vx, y) => (vx === x ? (y % 3 === 0 ? "button" : "linenShade") : y === -24 ? "linenShade" : "linen"));
      for (const dx of [-1, 1]) p.add(x + dx, -3, 1, "linenShade"); // the collar
    },
  },
  {
    name: "Rose maxi dress",
    // A long cream dress printed all over with pink and red roses and sage leaves: a deep V neck, a smocked
    // waist, cream buttons all down the front, and long puffed sleeves gathered at the wrist; white slides.
    torso: () => {
      const p = torso((x, y, z) => (y === 12 || y === 13 ? smock(x, y) : roses(x, y, z)));
      for (let y = 15; y <= 20; y++) for (let x = -(y - 14) + 1; x <= y - 15; x++) if (p.front(x, y)) p.front(x, y)[3] = "skin"; // the V of the neck
      for (let y = 9; y <= 14; y += 2) p.front(0, y)[3] = "dressButton";
      return p;
    },
    skirt: () => skirt((x, y, z) => (x === 0 && z >= 2 && y % 3 === 0 ? "dressButton" : round(roses)(x, y, z)), { top: 10, flare: 2.5 }),
    thigh: lap(roses),
    drape: drape(roses, 1),
    shin(side, x0) {
      const p = part();
      box(p, [x0, x0 + 1], [0, 0], [-1, 2], (x, y, z) => (z === 2 ? "skin" : "sole")); // slides, the toes showing
      return p;
    },
    upper: puffSleeve(roses),
    fore: cuffSleeve(roses, "dressCream"),
    hang(p, x) {
      for (let vx = x - 4; vx <= x + 4; vx++)
        for (let y = -24; y <= -3; y++)
          if (Math.abs(vx - x) >= y + 6) p.add(vx, y, 0, vx === x && y % 2 ? "dressButton" : y === -9 ? "rosePink" : roses(vx, y, 0));
    },
  },
  {
    name: "Blue and white",
    // A white blouse embroidered all over in blue, with a little V neck tied at the front, a frilled peplum
    // and big puffed sleeves gathered at the wrist, over a long full white skirt printed with blue flowers
    // and leaves like old china; silver ballet flats.
    torso: () => {
      const p = torso(
        (x, y, z) => (y <= 10 ? china(x, y, z) : stitch(x, y, z)),
        (y) => (y <= 10 ? 5 : y <= 12 ? 6 : y <= 17 ? 5 : y === 18 ? 4.5 : 4) // the peplum flares out
      );
      for (let y = 18; y <= 20; y++) for (let x = -(y - 17); x <= y - 18; x++) if (p.front(x, y)) p.front(x, y)[3] = "skin";
      const [, , zf] = p.front(0, 17);
      for (const [x, y] of [
        [0, 17],
        [-1, 16],
        [1, 15],
      ])
        p.add(x, y, zf + 1, "porcelainNavy"); // the tie
      return p;
    },
    skirt: () => skirt(round(china), { top: 10, flare: 3.5 }), // full, gathered at the waist
    thigh: lap(china),
    drape: drape(china, 1),
    shin(side, x0) {
      const p = part();
      box(p, [x0, x0 + 1], [0, 0], [-1, 2], "flatSilver");
      p.add(x0, 0, 2, "flatSilver");
      return p;
    },
    upper: puffSleeve(stitch),
    fore: cuffSleeve(stitch, "blouseWhite"),
    hang(p, x) {
      for (let vx = x - 4; vx <= x + 4; vx++)
        for (let y = -10; y <= -3; y++) if (Math.abs(vx - x) >= y + 5) p.add(vx, y, 0, y === -10 ? "blouseWhite" : stitch(vx, y, 0));
      for (let y = -25; y <= -11; y++) {
        const half = 3 + Math.floor((-11 - y) / 6); // the skirt widening to the hem
        box(p, [x - half, x + half], [y, y], [0, 0], (vx) => china(vx, y, 0));
      }
    },
  },
  {
    name: "Lilac satin",
    // A pale lilac satin T-shirt, loose and boxy with wide short sleeves, worn over a satin midi skirt to
    // match, whose draped panel falls in a cascade down the front, the hem dipping where it ends; white socks
    // and white trainers with black stripes.
    torso: () =>
      torso(
        (x, y, z) => (y <= 10 ? "satinShade" : sheen(x, z)), // the skirt's waist in the shadow of the T-shirt
        (y) => (y <= 10 ? 5 : y <= 12 ? 5.6 : y <= 17 ? 5.3 : y === 18 ? 4.8 : 4.2)
      ),
    skirt: () => skirt(cascade, { top: 10, flare: 2.2, hem: (x, z) => (z > 0 && x < -1 ? 2 : 3) }),
    thigh: lap(cascade),
    drape: drape(cascade, 2),
    shin(side, x0) {
      const p = part();
      const out = side > 0 ? x0 + 1 : x0; // the outer side of the foot
      box(p, [x0, x0 + 1], [1, 2], [-1, 0], "sock");
      box(p, [x0, x0 + 1], [0, 0], [-1, 2], (x, y, z) => (x === out && (z === 0 || z === 1) ? "sneakerStripe" : "sneaker"));
      box(p, [x0, x0 + 1], [1, 1], [1, 2], (x, y, z) => (x === out && z === 1 ? "sneakerStripe" : "sneaker"));
      return p;
    },
    upper(side, x0) {
      const p = part();
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)], [14, 19], [-2, 1], (x, y, z) => (y === 14 ? "satinShade" : sheen(x * 3, z)));
      return p;
    },
    fore: bareFore,
    hang(p, x) {
      box(p, [x - 5, x + 5], [-6, -3], [0, 0], (vx, y) => (Math.abs(vx - x) === 5 && y === -6 ? "satinShade" : sheen(vx - x, 0))); // shoulders and sleeves
      box(p, [x - 4, x + 4], [-11, -7], [0, 0], (vx, y) => (y === -11 ? "satinShade" : sheen(vx - x, 0)));
      for (let y = -22; y <= -12; y++) {
        const half = 3 + Math.floor((-12 - y) / 5); // the skirt widening to the hem
        box(p, [x - half, x + half], [y, y], [0, 0], (vx) => cascade(vx - x, y + 22, 1));
      }
    },
  },
];

// Her looks, ready to put on: each built on her rig's joints and hidden; `wear(k)` puts on the k-th by day
// (the first is the one she was built in), and her pyjamas still come out at night.
export function dressGirl(rig) {
  const palette = { ...rig.palette, ...OUTFIT_PALETTE };
  const { limbs, pose, head, headPart, outfits } = rig;
  // Each look's meshes, and when each shows: always, or for a skirt only as she stands ("standing") or only as
  // she sits or kneels ("folded").
  const looks = LOOKS.map((look, k) => {
    if (k === 0) return outfits[0].map((m) => ({ m }));
    const meshes = [];
    const add = (parent, p, when) => {
      const m = p.mesh(palette);
      m.visible = false;
      parent.add(m);
      meshes.push({ m, when });
    };
    add(pose, look.torso());
    if (look.skirt) add(pose, look.skirt(), "standing");
    limbs.legs.forEach(({ hip, knee }, i) => {
      const side = i ? 1 : -1;
      const x0 = side > 0 ? 1 : -2;
      add(hip.inner, look.thigh(side, x0));
      add(knee.inner, look.shin(side, x0));
      if (look.drape) add(knee.inner, look.drape(side, x0), "folded");
    });
    limbs.arms.forEach(({ shoulder, elbow }, i) => {
      const side = i ? 1 : -1;
      const x0 = side > 0 ? 5 : -7;
      add(shoulder.inner, look.upper(side, x0));
      add(elbow.inner, look.fore(side, x0));
    });
    if (look.hat) add(head.inner, look.hat(headPart));
    return meshes;
  });
  let current = 0;
  let night = false;
  let folded = false; // her legs folded up under her, sitting or kneeling
  const show = () =>
    looks.forEach((meshes, k) => meshes.forEach(({ m, when }) => (m.visible = !night && k === current && (!when || (when === "folded") === folded))));
  const animate = rig.animate;
  rig.animate = (dt, state) => {
    animate(dt, state);
    // Past any stride (0.42 rad) or stamp, her thighs are coming up to sit or kneel.
    if (limbs.legs[0].hip.outer.rotation.x < -1 !== folded) {
      folded = !folded;
      show();
    }
  };
  rig.nightwear = (on) => {
    night = on;
    outfits[1].forEach((m) => (m.visible = on));
    show();
  };
  return {
    get current() {
      return current;
    },
    wear(k) {
      current = k;
      show();
    },
  };
}
