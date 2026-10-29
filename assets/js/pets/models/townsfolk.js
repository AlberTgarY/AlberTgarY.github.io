/*******************************************************************************
 * People of the town who come by the flower shop: chibis on the girl's and the
 * boy's skeleton (chibi.js), drawn as finely as those two (big eyes with a
 * sparkle, hair in locks with a parting and a sheen), each put together by
 * rollLook() from parts: a child, a teenager, a grown-up or someone old; skin
 * from fair to deep brown; hair short, cropped, buzzed, balding, a bob, long,
 * in a ponytail, a bun, pigtails or curls, maybe a beard or a moustache;
 * glasses maybe; a T-shirt (plain, striped or with a little heart on it), a
 * jumper, a cardigan, a hoodie, a check shirt, a trench coat, a puffer or a
 * dress; trousers, jeans, shorts, a skirt or a long one; trainers, boots or
 * flats; maybe a beanie, a cap, a sun hat or a flat cap, a scarf, and a tote,
 * a backpack or a little bag across them. They blink, smile and wave when
 * hovered, talk, hold a phone up in the left hand when they want it
 * (customers.js), and what they buy in the right. redress() gives them new colours (the same
 * meshes, coloured afresh), so that no one looks quite the same twice.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, surfaceOf, paintEyes, approach, hash, recolor } from "./voxels.js";
import { limbs, poseLimbs } from "./chibi.js";

/* ---------------------------------------------------------------------------------------------------------- */
/* What a look is put together from. */

const SKINS = ["#fae0cc", "#f6d3b8", "#f0c4a3", "#e2ad86", "#cf956c", "#b57a55", "#94603f", "#74472d"];
const NATURAL = ["#1f1a1c", "#2b211d", "#3a2a20", "#5e3f2a", "#8a3f22", "#a8743e", "#d9b26a"];
const AGED = ["#9c9a96", "#c9c6bf", "#ece9e2"];
const DYED = ["#e98fb0", "#6f8fd6", "#9a7ad0"];
const EYES = ["#2e2420", "#3d2a1e", "#5b3a22", "#3f5f7a", "#4d6b45", "#6b5030"];
const TOPS = [
  "#c9a272",
  "#6f7a4a",
  "#e0a92e",
  "#a9c6e4",
  "#b39ad0",
  "#8fae8c",
  "#d9705f",
  "#f2efe6",
  "#2f3b55",
  "#c25a6a",
  "#4e74a3",
  "#e8c9a0",
  "#7d5a8c",
  "#3f6b5a",
  "#f0d36a",
  "#e07a9a",
  "#9a4a3a",
  "#5a6a7a",
];
const LIGHTS = ["#f6f3ec", "#f2e6c9", "#e8eef4", "#f4e1e1"]; // what shows under a cardigan or a coat; stripes
const LEGS = ["#2a2a2f", "#3a4f72", "#cdb99a", "#bdb39c", "#5a4a3a", "#8a8c92", "#2d3557", "#6b4a3a", "#e8e2d5", "#7a7f6a"];
const DENIM = ["#4a6a96", "#3c5a84", "#6a8ab4", "#2f3f5a"];
const SHOES = ["#1c1c20", "#f2f2ee", "#5a3b26", "#3a3d44", "#8a2a35", "#c9a272", "#e8e2d5"];
const ACCENTS = ["#c94f4f", "#e8c94a", "#4f7fc9", "#5e9e6e", "#e07a9a", "#f2efe6", "#3a3a40", "#d98b3a", "#8a6ab0", "#c9a272"];
const FRAMES = ["#1d1d22", "#6b4426", "#c9a24a", "#8a2a35"];

const dimmed = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;

// A look's shape (who they are, of `age` if given, and what they wear) and its colours (colorsFor()), from
// `rand`.
export function rollLook(rand, age = null) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const chance = (p) => rand() < p;
  const r = rand();
  age ??= r < 0.12 ? "kid" : r < 0.27 ? "teen" : r < 0.82 ? "adult" : "old";
  const fem = chance(0.5);
  const hair = {
    kid: fem ? ["pigtails", "bob", "ponytail", "long"] : ["short", "curly", "crop"],
    teen: fem ? ["long", "ponytail", "bob", "curly"] : ["short", "curly", "crop", "buzz"],
    adult: fem ? ["long", "bob", "ponytail", "bun", "curly", "short"] : ["short", "crop", "buzz", "curly", "short", "bald"],
    old: fem ? ["bun", "bob", "short", "curly"] : ["bald", "crop", "short"],
  }[age];
  const tops = {
    kid: ["tee", "hoodie", "jumper", "stripe", ...(fem ? ["dress"] : [])],
    teen: ["hoodie", "tee", "stripe", "jumper", "puffer", "check"],
    adult: ["coat", "tee", "stripe", "jumper", "cardigan", "check", "puffer", "hoodie", ...(fem ? ["dress", "dress"] : [])],
    old: ["cardigan", "jumper", "coat", "check"],
  }[age];
  const look = {
    age,
    fem,
    size: { kid: 0.72, teen: 0.9, adult: 0.96 + rand() * 0.08, old: 0.95 }[age],
    speed: { kid: 22, teen: 27, adult: 25 + rand() * 3, old: 20 }[age],
    hair: pick(hair),
    eyes: fem || age === "kid" ? "round" : pick(["narrow", "narrow", "round"]),
    lashes: fem,
    blush: age === "kid" || chance(0.5),
    beard: !fem && (age === "adult" || age === "old") && chance(0.4) ? pick(["full", "moustache", "stubble"]) : null,
    glasses: chance({ kid: 0.05, teen: 0.15, adult: 0.25, old: 0.6 }[age]) ? pick(["round", "square"]) : null,
    top: pick(tops),
    heart: chance(0.4), // (on a T-shirt)
  };
  look.legs =
    look.top === "dress"
      ? "bare"
      : pick(
          fem
            ? age === "old"
              ? ["longskirt", "trousers"]
              : ["trousers", "jeans", "skirt", "longskirt", "jeans", "shorts"]
            : ["trousers", "jeans", "jeans", ...(age === "kid" || age === "teen" ? ["shorts"] : [])]
        );
  look.shoes = pick(["trainers", "trainers", "boots", "flats"]);
  // A hat, not over a bun; a cap or a beanie on the young, a flat cap on an old man, a sun hat on a woman.
  const hats =
    look.hair === "bun"
      ? []
      : { kid: ["cap", "beanie"], teen: ["cap", "beanie"], adult: ["beanie", "cap", ...(fem ? ["sunhat"] : [])], old: [fem ? "sunhat" : "flatcap"] }[
          age
        ];
  look.hat = hats.length && chance(age === "old" && !fem ? 0.6 : 0.25) ? pick(hats) : null;
  look.scarf = look.top !== "puffer" && look.top !== "dress" && chance(0.15);
  // A bag: not a backpack over long hair or a hood.
  const bags = ["tote", "crossbody", ...(look.hair === "long" || look.top === "hoodie" ? [] : ["backpack"])];
  look.bag = age === "kid" ? (chance(0.3) && bags.includes("backpack") ? "backpack" : null) : chance(0.45) ? pick(bags) : null;
  Object.assign(look, colorsFor(look, rand));
  return look;
}

// The colours of a look's shape, from `rand`: anew each visit (redress()).
export function colorsFor(look, rand) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const top = pick(TOPS);
  let top2 = pick(TOPS.filter((c) => c !== top));
  if (look.top === "cardigan" || look.top === "coat" || look.top === "stripe") top2 = pick(LIGHTS);
  const hair = look.age === "old" ? pick(AGED) : (look.age === "teen" || look.age === "adult") && rand() < 0.07 ? pick(DYED) : pick(NATURAL);
  return {
    colors: {
      skin: pick(SKINS),
      hair,
      eye: pick(EYES),
      top,
      top2,
      leg: look.legs === "jeans" ? pick(DENIM) : pick(LEGS),
      socks: pick(["#f4f2ec", "#2a2a2f", ...LIGHTS]),
      shoe: pick(SHOES),
      hat: pick(ACCENTS),
      scarf: pick(ACCENTS.filter((c) => c !== top)),
      bag: pick([...ACCENTS, "#b98a5e", "#2a2a2f"]),
      frame: pick(FRAMES),
      tie: pick(ACCENTS),
    },
  };
}

// The named colours a person's voxels are painted in, from their look's colours.
function paletteFor({ colors: c }) {
  return {
    skin: c.skin,
    skinShade: dimmed(c.skin, 0.9),
    nose: dimmed(c.skin, 0.86),
    stubble: dimmed(c.skin, 0.78),
    hair: c.hair,
    hairShade: dimmed(c.hair, 0.78),
    hairShine: `#${new THREE.Color(c.hair).lerp(new THREE.Color("#ffffff"), 0.12).getHexString()}`,
    brow: dimmed(c.hair, 0.7),
    tie: c.tie,
    eye: c.eye,
    eyeLight: `#${new THREE.Color(c.eye).lerp(new THREE.Color("#ffffff"), 0.28).getHexString()}`,
    glint: "#ffffff",
    lash: "#2a1e1a",
    mouth: "#c45a64",
    mouthDark: "#6e2a32",
    teeth: "#ffffff",
    blush: "#f4a7a8",
    frame: c.frame,
    top: c.top,
    topShade: dimmed(c.top, 0.84),
    top2: c.top2,
    button: "#e9e2d2",
    buckle: "#c9a24a",
    string: "#f2efe6",
    leg: c.leg,
    legShade: dimmed(c.leg, 0.84),
    seam: `#${new THREE.Color(c.leg).lerp(new THREE.Color("#e8d29a"), 0.35).getHexString()}`,
    socks: c.socks,
    shoe: c.shoe,
    shoeShade: dimmed(c.shoe, 0.8),
    sole: "#e8e4dc",
    hat: c.hat,
    hatShade: dimmed(c.hat, 0.8),
    scarf: c.scarf,
    scarfShade: dimmed(c.scarf, 0.82),
    bag: c.bag,
    bagShade: dimmed(c.bag, 0.8),
    strap: dimmed(c.bag, 0.65),
    phone: "#1d1d22",
    screen: "#8fb8e8",
  };
}

/* ---------------------------------------------------------------------------------------------------------- */
/* A person built after a look. */

export function buildTownsfolk(look) {
  const palette = paletteFor(look);
  const meshes = []; // (every mesh, to colour afresh)
  const meshOf = (p) => {
    const m = p.mesh(palette, true);
    meshes.push(m);
    return m;
  };
  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);
  const wear = (parent, build) => parent.add(meshOf(build()));

  // Fabric with a little texture: knit (a jumper's, a cardigan's), stripes, a check, quilting (a puffer's).
  const knit = (x, y, z) => (hash(x, y, z) < 0.18 ? "topShade" : "top");
  const fabric =
    {
      stripe: (x, y) => (y % 2 === 0 ? "top2" : "top"),
      check: (x, y, z) => {
        const [a, b] = [Math.floor((x + z + 20) / 2) & 1, Math.floor(y / 2) & 1];
        return a && b ? "topShade" : a || b ? "top2" : "top";
      },
      puffer: (x, y) => (y % 3 === 0 ? "topShade" : "top"),
    }[look.top] ?? knit;
  const long = look.top === "coat";
  const short = ["tee", "stripe", "dress"].includes(look.top); // sleeves

  /* ----- the body ----- */
  const paint = (p, x, y, color) => {
    const v = p.front(x, y);
    if (v) v[3] = color;
  };
  const bodyPart = part();
  {
    const p = bodyPart;
    const bulk = look.top === "puffer" ? 0.5 : 0;
    for (let y = long ? 6 : 9; y <= 19; y++) {
      const rx = (y <= 17 ? (long && y < 9 ? 5.5 : 5) : y === 18 ? 4.5 : 4) + bulk;
      ellipsoid(p, [0, y, -0.5], [rx, 0.5, (long && y < 9 ? 4 : 3.5) + bulk], y === (long ? 6 : 9) ? "topShade" : fabric, [], 3);
    }
    ellipsoid(p, [0, 20, -0.5], [3 + bulk, 0.5, 2.5 + bulk], look.top === "puffer" || look.top === "jumper" ? "topShade" : "top");
    switch (look.top) {
      case "tee":
      case "stripe":
        if (look.heart && look.top === "tee")
          for (const [x, y] of [
            [2, 16],
            [4, 16],
            [1, 15],
            [2, 15],
            [3, 15],
            [4, 15],
            [5, 15],
            [2, 14],
            [3, 14],
            [4, 14],
            [3, 13],
          ])
            paint(p, x - 1, y, "top2");
        break;
      case "jumper":
        for (let x = -4; x <= 4; x++) paint(p, x, 19, "topShade"); // the neck's rib
        break;
      case "cardigan": // open down the front over a light top, buttoned below the V
        for (let y = 10; y <= 19; y++) {
          const v = y >= 16 ? y - 15 : 0;
          for (let x = -v; x <= v; x++) paint(p, x, y, "top2");
          if (y < 16) paint(p, 0, y, y % 2 ? "button" : "topShade");
        }
        break;
      case "hoodie": // the hood lying on the back, its drawstrings, a pocket across the front
        ellipsoid(p, [0, 19, -5], [4, 2.5, 2.2], "topShade", [{ has: (x, y, z) => z > -4 }]);
        for (const x of [-2, 2]) for (let y = 15; y <= 18; y++) paint(p, x, y, "string");
        for (let x = -3; x <= 3; x++) for (const y of [10, 13]) paint(p, x, y, "topShade");
        for (const x of [-3, 3]) for (let y = 11; y <= 12; y++) paint(p, x, y, "topShade");
        break;
      case "check": // a collar, buttons down the front
        for (let y = 10; y <= 18; y++) paint(p, 0, y, y % 3 === 0 ? "button" : "topShade");
        for (const x of [-2, -1, 1, 2]) paint(p, x, 19, "top");
        break;
      case "coat": // a V of shirt under the lapels, a belt with a buckle, two rows of buttons
        for (let y = 14; y <= 19; y++) {
          const v = Math.round((y - 13) * 0.6);
          for (let x = -v; x <= v; x++) paint(p, x, y, "top2");
          for (const x of [-v - 1, v + 1]) paint(p, x, y, "topShade");
        }
        for (let x = -5; x <= 5; x++) paint(p, x, 11, x === 0 ? "buckle" : "topShade");
        for (const x of [-2, 2]) for (const y of [8, 13]) paint(p, x, y, "button");
        break;
      case "puffer": // a high collar
        ellipsoid(p, [0, 21, -0.5], [3.5, 0.5, 3], "top");
        break;
      case "dress": // a sash at the waist
        for (let x = -5; x <= 5; x++) paint(p, x, 10, "topShade");
        break;
    }
  }
  pose.add(meshOf(bodyPart));
  // A skirt flaring from the waist to the knee, or down to the ankle; a dress's skirt in the dress's fabric.
  const skirt = look.legs === "skirt" || look.legs === "longskirt" || look.top === "dress";
  if (skirt) {
    const p = part();
    const y0 = look.legs === "longskirt" ? 1 : 4;
    for (let y = y0; y <= 9; y++) {
      const k = (9 - y) * (y0 === 1 ? 0.2 : 0.25);
      const color =
        look.top === "dress" ? (y === y0 ? "topShade" : (x, yy, z) => ((x + z + 2 * yy) % 5 === 0 ? "top2" : "top")) : y % 2 ? "leg" : "legShade";
      ellipsoid(p, [0, y, -0.5], [4.5 + k, 0.5, 3.4 + k * 0.8], color, [], 3);
    }
    pose.add(meshOf(p));
  }

  // A scarf round the neck, an end hanging down the front; a bag: a tote at the right hip on a strap over
  // that shoulder, a backpack, or a little bag at the left hip on a strap across the chest.
  if (look.scarf || look.bag) {
    const p = part();
    if (look.scarf) {
      ellipsoid(p, [0, 20, -0.5], [5, 1.4, 4.2], (x, y, z) => ((x + z) % 3 === 0 ? "scarfShade" : "scarf"), [bodyPart]);
      for (let y = 13; y <= 18; y++) for (const x of [2, 3]) p.add(x, y, 4, y === 13 ? "scarfShade" : "scarf");
    }
    if (look.bag === "tote") {
      box(p, [-10, -8], [7, 13], [-2, 2], (x, y) => (y === 7 ? "bagShade" : "bag"));
      for (let y = 14; y <= 19; y++) p.add(-9, y, 0, "strap");
      for (let x = -8; x <= -4; x++) p.add(x, 20, 0, "strap");
    } else if (look.bag === "backpack") {
      box(p, [-4, 4], [10, 18], [-8, -5], (x, y, z) => (y >= 16 && z === -8 ? "bagShade" : y === 10 ? "bagShade" : "bag"));
      for (const x of [-3, 3]) for (let y = 15; y <= 19; y++) p.add(x, y, (bodyPart.front(x, y)?.[2] ?? 2) + 1, "strap");
    } else if (look.bag === "crossbody") {
      for (let k = 0; k <= 9; k++) {
        const [x, y] = [Math.round(-4 + k * 0.75), 19 - k];
        p.add(x, y, (bodyPart.front(x, y)?.[2] ?? 2) + 1, "strap");
      }
      box(p, [2, 5], [8, 11], [3, 4], (x, y) => (y === 11 ? "bagShade" : "bag"));
    }
    pose.add(meshOf(p));
  }

  // Legs and arms (chibi.js has the joints): trousers or jeans (a seam down the outside) to the shoe, shorts
  // to above the knee, bare under a skirt with socks; trainers, boots or flats. Sleeves short or long.
  const legX = (side) => (side > 0 ? [1, 3] : [-3, -1]);
  const skinX = (side, x0) => (side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2]);
  const bare = skirt || look.legs === "bare";
  const shorts = look.legs === "shorts";
  const body = limbs(pose, wear, {
    thigh(side) {
      const p = part();
      box(p, legX(side), [5, 8], [-2, 1], (x, y) =>
        bare ? "skin" : shorts ? (y === 5 ? "skin" : "leg") : look.legs === "jeans" && x === side * 3 ? "seam" : "leg"
      );
      return p;
    },
    shin(side) {
      const p = part();
      box(p, legX(side), [2, 4], [-2, 1], (x, y) => {
        if (look.shoes === "boots" && y <= 3) return "shoe";
        if (bare || shorts) return y <= 2 ? "socks" : "skin";
        if (look.legs === "jeans") return y === 2 ? "legShade" : x === side * 3 ? "seam" : "leg";
        return y === 2 ? "legShade" : "leg";
      });
      box(p, legX(side), [0, 1], [-2, 2], (x, y, z) => {
        if (look.shoes === "trainers") return y === 0 ? "sole" : z === 2 ? "sole" : "shoe";
        if (look.shoes === "flats") return y === 0 ? "shoeShade" : z === 2 || z === -2 ? "shoe" : bare ? "skin" : "socks";
        return y === 0 ? "shoeShade" : "shoe";
      });
      return p;
    },
    upper(side, x0) {
      const p = part();
      if (short) {
        box(p, [x0, x0 + 2], [15, 19], [-2, 1], (x, y, z) => (y === 15 ? "topShade" : fabric(x, y, z)));
        box(p, skinX(side, x0), [14, 14], [-1, 0], "skin");
      } else box(p, [x0, x0 + 2], [14, 19], [-2, 1], fabric);
      return p;
    },
    fore(side, x0) {
      const p = part();
      if (short) box(p, skinX(side, x0), [10, 13], [-1, 0], "skin");
      else box(p, [x0, x0 + 2], [10, 13], [-2, 1], (x, y, z) => (y === 10 ? "topShade" : fabric(x, y, z)));
      box(p, skinX(side, x0), [8, 9], [-1, 0], "skin");
      return p;
    },
  });

  /* ----- the head ----- */
  // The hair: its outline over the face (the fringe: how low it comes at each x), how far down it comes at
  // the back and the sides (low(x, z)), its size, a parting; long hair, a ponytail, pigtails, a bun hang or
  // sit off the back of the head (below).
  const style = look.hair;
  const forehead = (k) => (x) => 38 - k * x * x; // hair swept back from the face (a parting in the middle)
  const HAIR = {
    short: {
      fringe: (x) => 37 + 0.2 * x - ((x + 9) % 3 === 0 ? 1 : 0),
      low: (x, z) => (z < -2 ? 26 : x <= -7 ? 27 : x >= 7 ? 31 : 34),
      r: [10.6, 10.8, 9.8],
      part: 4,
      ears: [1],
    },
    crop: { fringe: () => 39, low: (x, z) => (z < -2 ? 27 : Math.abs(x) >= 8 ? 31 : 34), r: [10.3, 10.4, 9.5], ears: [-1, 1] },
    buzz: { fringe: () => 40, low: (x, z) => (z < -2 ? 27 : Math.abs(x) >= 8 ? 31 : 34), r: [10.1, 10.2, 9.3], ears: [-1, 1], stubbly: true },
    bald: { fringe: () => 44, low: (x, z) => (z < -2 ? 26 : Math.abs(x) >= 8 ? 30 : 99), r: [10.1, 10.2, 9.3], ears: [-1, 1], crown: 34 },
    bob: {
      fringe: (x) => 36 - ((x + 20) % 3 === 0 ? 1 : 0),
      low: (x, z) => (z < -1 ? 24 : Math.abs(x) >= 7 ? 25 : 34),
      r: [10.8, 10.6, 9.8],
      sides: 25,
    },
    long: { fringe: forehead(0.11), low: (x, z) => (z < -1 ? 24 : Math.abs(x) >= 7 ? 22 : 34), r: [10.5, 10.5, 9.5], part: 0, sides: 19, back: true },
    ponytail: {
      fringe: forehead(0.09),
      low: (x, z) => (z < -2 ? 26 : Math.abs(x) >= 7 ? 30 : 34),
      r: [10.4, 10.5, 9.5],
      part: 0,
      ears: [-1, 1],
      tail: [[0, 35, -10]],
    },
    pigtails: {
      fringe: (x) => 36 - ((x + 20) % 3 === 0 ? 1 : 0),
      low: (x, z) => (z < -2 ? 26 : Math.abs(x) >= 7 ? 30 : 34),
      r: [10.5, 10.5, 9.6],
      part: 0,
      tail: [
        [-10, 33, -2],
        [10, 33, -2],
      ],
    },
    bun: {
      fringe: forehead(0.09),
      low: (x, z) => (z < -2 ? 27 : Math.abs(x) >= 7 ? 30 : 34),
      r: [10.4, 10.5, 9.5],
      part: 0,
      ears: [-1, 1],
      bun: true,
    },
    curly: {
      fringe: (x) => 36 + (hash(x, 3, 1) < 0.5 ? 0 : 1),
      low: (x, z) => (z < -1 ? 24 : Math.abs(x) >= 7 ? 26 : 34),
      r: [11.6, 11.2, 10.6],
      curls: true,
    },
  }[style];
  const hairAt = (x, y, z) => {
    if (HAIR.stubbly) return hash(x, y, z) < 0.3 ? "skinShade" : "hair";
    if (HAIR.curls) return hash(x >> 1, y >> 1, z >> 1) < 0.35 ? "hairShade" : hash(x, y, z) < 0.08 ? "hairShine" : "hair";
    if (y === 40 && z > -3 && (x + 3) % 3 === 0) return "hairShine"; // (a broken band of sheen round the crown)
    return Math.sin(x * 1.2 + 1.5 * Math.sin(y * 0.5)) > 0.85 ? "hairShade" : "hair";
  };
  const headPart = part();
  const inFace = (x, y, z) => z >= 1 && Math.abs(x) <= 7 && y <= 40 - 0.06 * x * x && y <= HAIR.fringe(x);
  const inHair = (x, y, z) => (x / HAIR.r[0]) ** 2 + ((y - 33.3) / HAIR.r[1]) ** 2 + ((z + 0.5) / HAIR.r[2]) ** 2 <= 1;
  const under = { has: (x, y, z) => inFace(x, y, z) || y < HAIR.low(x, z) || (HAIR.crown && y > HAIR.crown) };
  ellipsoid(headPart, [0, 33.3, -0.5], HAIR.r, hairAt, [bodyPart, under]);
  if (HAIR.curls)
    // a few curls standing proud of the rest
    ellipsoid(headPart, [0, 33.6, -0.5], [HAIR.r[0] + 0.8, HAIR.r[1] + 0.8, HAIR.r[2] + 0.8], hairAt, [
      bodyPart,
      headPart,
      under,
      { has: (x, y, z) => hash(x, y, z) < 0.6 },
    ]);
  if (style === "short") ellipsoid(headPart, [-1, 39, 2.5], [9, 3.5, 7.5], hairAt, [headPart, { has: (x, y) => y < HAIR.fringe(x) }]);
  const outside = { has: (x, y, z) => !inFace(x, y, z) && !inHair(x, y, z) };
  ellipsoid(headPart, [0, 32, 0.5], [9.5, 9.5, 8.5], "skin", [bodyPart, headPart, outside], 3);
  ellipsoid(headPart, [0, 27.5, 1.5], [9, 4.5, 7.5], "skin", [bodyPart, headPart, outside]); // the cheeks
  if (HAIR.crown) ellipsoid(headPart, [0, 33.3, -0.5], [10.1, 10.2, 9.3], "skin", [bodyPart, headPart]); // the bald crown
  if (HAIR.part !== undefined) for (let y = 39; y <= 43; y++) paint(headPart, HAIR.part, y, "hairShade"); // the parting
  if (HAIR.sides)
    for (const side of [-1, 1])
      for (let y = HAIR.sides; y <= 36; y++) {
        const out = 10 + Math.round(Math.sin(y * 0.8));
        for (let x = 8; x <= out; x++)
          for (let z = -3; z <= 5; z++) {
            if (y < HAIR.sides + ((x + z) & 1)) continue; // ragged ends
            if (!inFace(side * x, y, z)) headPart.add(side * x, y, z, hairAt(side * x, y, z));
          }
      }
  for (const side of HAIR.ears ?? [])
    for (let y = 28; y <= 30; y++)
      for (let z = -1; z <= 0; z++) if (!headPart.has(side * 10, y, z)) headPart.add(side * 10, y, z, y === 29 && z === 0 ? "skinShade" : "skin");
  if (HAIR.bun) {
    ellipsoid(headPart, [0, 43, -5], [4, 3.5, 4], hairAt, [headPart]);
    ellipsoid(headPart, [0, 41, -4], [3.2, 0.6, 3.2], "tie", [{ has: (x, y, z) => !headPart.has(x, y, z) && Math.hypot(x, z + 4) < 2.6 }]);
  }

  // A beard round the jaw and the chin, a moustache, or stubble.
  if (look.beard === "full")
    ellipsoid(headPart, [0, 25, 0.8], [9.8, 5.5, 8.6], (x, y, z) => (hash(x, y, z) < 0.25 ? "hairShade" : "hair"), [
      headPart,
      { has: (x, y, z) => y > 26 || z < -2 },
    ]);

  // A hat over it all (big enough for the hair under it): a beanie (a turned-up band, a bobble), a cap (its
  // peak to the front), a sun hat (a wide brim, a band), a tweed flat cap.
  const hr = HAIR.r[0] + (HAIR.curls ? 1.6 : 0.8);
  if (look.hat === "beanie") {
    ellipsoid(headPart, [0, 34, -0.5], [hr, hr - 0.2, hr - 1], (x, y) => (y <= 37 ? "hatShade" : (x & 1) === 0 ? "hatShade" : "hat"), [
      { has: (x, y) => y < 36 },
    ]);
    ellipsoid(headPart, [0, 46, -1], [2.2, 2, 2.2], "hatShade");
  } else if (look.hat === "cap") {
    ellipsoid(headPart, [0, 34.5, -0.5], [hr, hr - 1, hr - 1], "hat", [{ has: (x, y) => y < 37 }]);
    box(headPart, [-6, 6], [37, 37], [8, 13], "hatShade");
    headPart.add(0, 45, -0.5, "hatShade");
  } else if (look.hat === "sunhat") {
    ellipsoid(headPart, [0, 35, -0.5], [hr, hr - 2, hr - 1], "hat", [{ has: (x, y) => y < 38 }]);
    for (let x = -13; x <= 13; x++)
      for (let z = -13; z <= 12; z++) {
        const d = Math.hypot(x, z + 0.5);
        if (d <= 13 && d > 9) headPart.add(x, 38, z, d > 12 ? "hatShade" : "hat");
      }
    for (let x = -11; x <= 11; x++) for (let z = -11; z <= 10; z++) if (Math.abs(Math.hypot(x, z + 0.5) - 10.6) < 0.7) headPart.add(x, 39, z, "tie");
  } else if (look.hat === "flatcap") {
    ellipsoid(headPart, [0, 38, -0.5], [11, 6.5, 10], (x, y) => (y <= 37 ? "hatShade" : "hat"), [{ has: (x, y) => y < 37 }]);
    box(headPart, [-7, 7], [37, 37], [8, 11], "hatShade");
  }

  const headPivotY = 21;
  const head = pivotGroup(pose, [0, headPivotY, 0]);
  head.inner.add(meshOf(headPart));

  // Hair that hangs: long down the back, a ponytail, pigtails; each from where it is tied, swaying.
  const hanging = [];
  if (HAIR.back) {
    const p = part();
    for (let y = 13; y <= 30; y++) {
      const half = Math.round(10 + 0.6 * Math.sin(y * 0.7) + (30 - y) * 0.04);
      for (let x = -half; x <= half; x++) {
        if (y < 14 + 1.5 * (1 + Math.sin(x * 1.1))) continue;
        for (let z = -9 + Math.round(Math.abs(x) * 0.25); z <= (y >= 21 ? -4 : -5); z++) if (!headPart.has(x, y, z)) p.add(x, y, z, hairAt(x, y, z));
      }
    }
    const g = pivotGroup(head.inner, [0, 32, -6]);
    g.inner.add(meshOf(p));
    hanging.push(g);
  }
  for (const [tx, ty, tz] of HAIR.tail ?? []) {
    const p = part();
    const pig = tx !== 0;
    const len = pig ? 9 : 13;
    for (let k = 0; k <= len; k++) {
      const r = (pig ? 1.9 : 2.4) * (1 - (k / len) * 0.45);
      const [cx, cy, cz] = [tx + (pig ? Math.sign(tx) * Math.min(k, 2) * 0.5 : 0), ty - k, tz - (pig ? 0 : Math.min(k, 3) * 0.6)];
      ellipsoid(p, [cx, cy, cz], [r, 0.6, r], k === 0 ? "tie" : hairAt, [headPart]);
    }
    const g = pivotGroup(head.inner, [tx, ty, tz]);
    g.inner.add(meshOf(p));
    hanging.push(g);
  }

  // The face: big eyes with a sparkle (round, with lashes, or narrow), brows, a hint of a nose, maybe rosy
  // cheeks, a small smile (open to laugh and talk); a moustache or stubble; glasses.
  const surface = surfaceOf(headPart);
  const facePart = part();
  const dab = (x, y, lift, color) => headPart.front(x, y) && facePart.add(...surface(x, y, lift), color); // (where the head is)
  const round = look.eyes === "round";
  const GLINTS = new Set(["1,1", "2,1", "1,2"]);
  const eyeColor = round
    ? (i, j) => (GLINTS.has(`${i},${j}`) ? "glint" : j === 4 ? "eyeLight" : "eye")
    : (i, j) => (i === 1 && j === 0 ? "glint" : "eye");
  const [lefts, top, rows] = round ? [[-7, 4], 32, [".XX.", "XXXX", "XXXX", "XXXX", ".XX."]] : [[-5, 3], 30, ["XXX", "XXX"]];
  const eyeCells = paintEyes(facePart, surface, lefts, top, eyeColor, rows);
  const lashCells = round && look.lashes ? [surface(-7, 32, 0.4), surface(7, 32, 0.4)] : [];
  lashCells.forEach((p) => facePart.add(...p, "lash"));
  const browY = round ? 34 : 32;
  for (const x of round ? [-6, -5, -4, 4, 5, 6] : [-5, -4, -3, 3, 4, 5]) if (browY <= HAIR.fringe(x) - 1) dab(x, browY, 0.4, "brow");
  dab(0, 27, 0.4, "nose");
  if (look.blush) for (const x of [-7, -6, 6, 7]) dab(x, round ? 27 : 26, 0.4, "blush");
  if (look.beard === "moustache") for (const x of [-3, -2, -1, 1, 2, 3]) dab(x, 26, 0.45, "hair");
  if (look.beard === "stubble") for (let y = 21; y <= 25; y++) for (let x = -7; x <= 7; x++) if (hash(x, y, 5) < 0.45) dab(x, y, 0.35, "stubble");
  if (look.glasses) {
    const [y0, y1] = round ? [27, 33] : [27, 32];
    for (const [x0, x1] of round
      ? [
          [-8, -3],
          [3, 8],
        ]
      : [
          [-7, -1],
          [1, 7],
        ]) {
      for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) if (look.glasses === "square" || (x !== x0 && x !== x1)) dab(x, y, 0.55, "frame");
      for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1]) dab(x, y, 0.55, "frame");
    }
    dab(0, y1 - 1, 0.55, "frame"); // the bridge
  }
  head.inner.add(meshOf(facePart));
  const painted = (cells, lift = 0.45) => {
    const p = part();
    cells.forEach(([x, y, c]) => p.add(...surface(x, y, lift), c));
    const m = meshOf(p);
    head.inner.add(m);
    return m;
  };
  const my = look.beard === "full" || look.beard === "moustache" ? 24 : 25; // (under a moustache)
  const smile = painted([
    [-2, my + 1, "mouth"],
    [-1, my, "mouth"],
    [0, my, "mouth"],
    [1, my, "mouth"],
    [2, my + 1, "mouth"],
  ]);
  const open = painted(
    [-1, 0, 1].flatMap((x) => [
      [x, my + 1, "mouthDark"],
      [x, my, "mouth"],
    ])
  );
  open.visible = false;
  // Lids over the eyes to blink, and happy eyes (^).
  const lids = (lashed) => {
    const p = part();
    eyeCells.forEach(({ p: [x, y, z], row, col }) => p.add(x, y, z + 0.1, lashed(col, row) ? "lash" : "skin"));
    lashCells.forEach(([x, y, z]) => p.add(x, y, z + 0.1, "skin"));
    const m = meshOf(p);
    m.visible = false;
    head.inner.add(m);
    return m;
  };
  const eyelids = lids((col, row) => row === (round ? 2 : 1));
  const happyEyes = lids(
    round
      ? (col, row) => (row === 1 && (col === 0 || col === 3)) || (row === 0 && (col === 1 || col === 2))
      : (col, row) => (row === 1 && col !== 1) || (row === 0 && col === 1)
  );
  // (The actor puts a nightcap on at night: none here.)
  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  hat.visible = false;
  head.inner.add(hat);

  // A phone in the left hand (the one nearer the viewer; the right holds what they buy), when wanted (shown
  // by customers.js): dark, its screen turned to them.
  const hands = body.arms.map(({ hand }) => hand);
  const phonePart = part();
  box(phonePart, [-1, 1], [-2, 2], [0, 0], (x, y) => (Math.abs(x) < 1 && Math.abs(y) < 2 ? "screen" : "phone"));
  const phone = meshOf(phonePart);
  phone.scale.setScalar(0.6);
  phone.position.set(0, -1.2, 1.1);
  phone.rotation.x = -0.5;
  phone.visible = false;
  hands[1].add(phone);

  const amount = {};
  const ease = (name, on, rate, dt) => (amount[name] = approach(amount[name] || 0, on ? 1 : 0, rate, dt));
  const phase = { wave: 0, munch: 0, clap: 0, pat: 0 };
  return {
    label: "Someone come to buy flowers, click to say hi",
    hint: "say hi",
    group,
    pose,
    head,
    headPivotY,
    ears: [],
    eyelids,
    hat,
    phone,
    look,
    lieDrop: 4,
    headDrop: 0,
    headAt: [32, 9],
    hit: [22, 12, 23],
    shadow: [8, 5],
    speed: look.speed,
    gaitHz: look.age === "kid" ? 2.6 : 2.1,
    hands,
    // New colours for the same person (between visits).
    redress(rand) {
      Object.assign(look, colorsFor(look, rand));
      const p = paletteFor(look);
      meshes.forEach((m) => recolor(m, p));
    },
    animate(dt, { happy, lying, stride, gait, elapsed, hold, legHold, talk }) {
      const wave = ease("wave", happy && !hold, 8, dt);
      phase.wave += Math.PI * 2 * 2.2 * dt;
      phase.pat += Math.PI * 2 * 1.2 * dt;
      poseLimbs(body, { kneel: lying, stride, gait, elapsed, phase, wave, hold, legHold });
      pose.position.z = 0; // (actor.js adds the lean about the hips to it, each frame)
      const laughing = happy || (talk && Math.sin(elapsed * 30) > 0);
      open.visible = laughing;
      smile.visible = !laughing;
      happyEyes.visible = happy;
      for (const g of hanging)
        g.outer.rotation.set(-head.outer.rotation.x + 0.12 * stride, -0.5 * head.outer.rotation.y, 0.05 * stride * Math.sin(gait), "YXZ");
    },
  };
}
