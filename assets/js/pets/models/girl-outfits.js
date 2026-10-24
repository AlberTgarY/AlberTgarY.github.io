/*******************************************************************************
 * The girl's other day clothes, for the playground's dressing corner: besides
 * her grey sweater and pink gingham shorts (girl.js), a cream top and shorts
 * embroidered with red flowers and trimmed with lace; a white open-knit poncho
 * over a long khaki skirt, with white socks and sandals; and a long white
 * linen shirt dress with a straw hat. Each look is built on her skeleton
 * (chibi.js) the way girl.js builds hers, and drawn flat on its hanger for the
 * rail in the dressing corner.
 *
 * The profile page never loads this file, so her looks there are unchanged.
 ******************************************************************************/

import { part, ellipsoid, box } from "./voxels.js";

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
  knit: "#f6f2e7",
  knitHole: "#cdbfa6",
  khaki: "#c9b07e",
  khakiDark: "#b0975f",
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
const knit = (x, y, z) => ((((x + y + z) % 3) + 3) % 3 === 0 ? "knitHole" : "knit"); // an open stitch
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
// White socks in sandals under a long hem.
function socks(side, x0, hem) {
  const p = part();
  box(p, skirtX(side), [hem, 4], [-3, 2], (x, y) => (y === hem ? "khakiDark" : "khaki"));
  box(p, [x0, x0 + 1], [0, hem - 1], [-1, 0], "sock");
  box(p, [x0, x0 + 1], [0, 0], [-1, 2], (x, y, z) => (z === 2 ? "sock" : "sandal"));
  return p;
}
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
    name: "Knit and khaki",
    // A loose open-knit poncho in white, falling over the arms, over a long khaki skirt; white socks in
    // sandals.
    torso: () =>
      torso(
        (x, y, z) => (y <= 10 ? "khaki" : knit(x, y, z)),
        (y) => (y <= 10 ? 5 : y <= 17 ? 6 : y === 18 ? 5.5 : 4.5)
      ),
    thigh(side) {
      const p = part();
      box(p, skirtX(side), [5, 8], [-3, 2], "khaki");
      return p;
    },
    shin: (side, x0) => socks(side, x0, 1),
    upper(side, x0) {
      const p = part();
      box(p, [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)], [14, 19], [-2, 1], knit); // the poncho over the arm
      return p;
    },
    fore(side, x0) {
      const p = bareFore(side, x0);
      box(p, [x0, x0 + 2], [12, 13], [-2, 1], knit);
      return p;
    },
    hang(p, x) {
      for (let y = -3; y >= -12; y--) {
        const half = Math.min(4, 2 + Math.floor((-3 - y) / 2));
        box(p, [x - half, x + half], [y, y], [0, 0], (vx, vy, vz) => knit(vx, vy, vz));
      }
      box(p, [x - 3, x + 3], [-25, -13], [0, 0], (vx, y) => (y === -25 ? "khakiDark" : y === -13 ? "khakiDark" : "khaki"));
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
    thigh(side) {
      const p = part();
      box(p, skirtX(side), [5, 8], [-3, 2], (x, y, z) => (x === 0 && z === 2 ? "linenShade" : "linen"));
      return p;
    },
    shin(side, x0) {
      const p = part();
      box(p, skirtX(side), [3, 4], [-3, 2], (x, y) => (y === 3 ? "linenShade" : "linen"));
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
];

// Her looks, ready to put on: each built on her rig's joints and hidden; `wear(k)` puts on the k-th by day
// (the first is the one she was built in), and her pyjamas still come out at night.
export function dressGirl(rig) {
  const palette = { ...rig.palette, ...OUTFIT_PALETTE };
  const { limbs, pose, head, headPart, outfits } = rig;
  const looks = LOOKS.map((look, k) => {
    if (k === 0) return outfits[0];
    const meshes = [];
    const add = (parent, p) => {
      const m = p.mesh(palette);
      m.visible = false;
      parent.add(m);
      meshes.push(m);
    };
    add(pose, look.torso());
    limbs.legs.forEach(({ hip, knee }, i) => {
      const side = i ? 1 : -1;
      const x0 = side > 0 ? 1 : -2;
      add(hip.inner, look.thigh(side, x0));
      add(knee.inner, look.shin(side, x0));
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
  const show = () => looks.forEach((meshes, k) => meshes.forEach((m) => (m.visible = !night && k === current)));
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
