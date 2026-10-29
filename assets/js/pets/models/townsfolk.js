/*******************************************************************************
 * People of the town who come by the flower shop: chibis on the girl's and the
 * boy's skeleton (chibi.js), each dressed after a `look` (TOWNSFOLK): their skin,
 * their hair (short, a bob, long down the back, or up in a bun, a flat cap on
 * it maybe; glasses maybe), a top (a T-shirt, a jumper, a cardigan, or a coat
 * down over the hips), trousers or a skirt, and shoes. They blink, smile and
 * wave when hovered, talk, and hold what they buy in the right hand.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, surfaceOf, paintEyes, approach, hash } from "./voxels.js";
import { limbs, poseLimbs } from "./chibi.js";

// Who comes by.
export const TOWNSFOLK = [
  // An office worker on her way home: a sleek dark bob, a camel trench coat, black trousers.
  { name: "trench", skin: "#f6d3b8", hair: ["bob", "#2b211d"], top: ["coat", "#c9a272", "#a9844f"], legs: ["trousers", "#2a2a2f"], shoes: "#1c1c20" },
  // A retired gentleman: white hair under a tweed flat cap, glasses, an olive cardigan, fawn trousers.
  {
    name: "gent",
    skin: "#f1c9a8",
    hair: ["short", "#e8e6e0"],
    cap: "#7d6a52",
    glasses: true,
    top: ["cardigan", "#6f7a4a", "#59633a"],
    legs: ["trousers", "#cdb99a"],
    shoes: "#5a3b26",
    speed: 22,
  },
  // A student: auburn hair cut short, a mustard hoodie, jeans, white trainers.
  {
    name: "hoodie",
    skin: "#eec4a2",
    hair: ["short", "#8a3f22"],
    top: ["jumper", "#e0a92e", "#c48e1d"],
    legs: ["trousers", "#4a6a96"],
    shoes: "#f2f2ee",
  },
  // A girl from the college: long black hair, a pale blue cardigan, a pleated navy skirt, white socks.
  {
    name: "skirt",
    skin: "#f8dcc6",
    hair: ["long", "#1d1a1c"],
    top: ["cardigan", "#a9c6e4", "#8eaed2"],
    legs: ["skirt", "#2d3557"],
    socks: "#f4f2ec",
    shoes: "#3a2a24",
  },
  // A grandmother: white hair up in a bun, a lilac jumper, a long grey skirt.
  {
    name: "granny",
    skin: "#f3d0b6",
    hair: ["bun", "#efede8"],
    glasses: true,
    top: ["jumper", "#b39ad0", "#9a80bb"],
    legs: ["skirt", "#8a8c92"],
    socks: "#d9c7b0",
    shoes: "#4b3a33",
    speed: 20,
  },
  // A young dad: a dark brown crop, a sage T-shirt, stone chinos.
  { name: "dad", skin: "#d9a582", hair: ["short", "#3a2a20"], top: ["tee", "#8fae8c", "#7a9a77"], legs: ["trousers", "#bdb39c"], shoes: "#3a3d44" },
];

export function buildTownsfolk(look) {
  const [hairStyle, hairColor] = look.hair;
  const [topStyle, topColor, topShade] = look.top;
  const [legStyle, legColor] = look.legs;
  const palette = {
    skin: look.skin,
    skinShade: `#${new THREE.Color(look.skin).multiplyScalar(0.92).getHexString()}`,
    hair: hairColor,
    hairShade: `#${new THREE.Color(hairColor).multiplyScalar(0.82).getHexString()}`,
    eye: "#2e2420",
    glint: "#ffffff",
    lash: "#2a1e1a",
    mouth: "#c45a64",
    mouthDark: "#6e2a32",
    blush: "#f4a7a8",
    top: topColor,
    topShade,
    button: "#e9e2d2",
    leg: legColor,
    legShade: `#${new THREE.Color(legColor).multiplyScalar(0.85).getHexString()}`,
    socks: look.socks ?? legColor,
    shoe: look.shoes,
    sole: "#d8d2c8",
    cap: look.cap ?? "#7d6a52",
    capShade: `#${new THREE.Color(look.cap ?? "#7d6a52").multiplyScalar(0.8).getHexString()}`,
    frame: "#1d1d22",
  };
  const fabric = (x, y, z) => (hash(x, y, z) < 0.18 ? "topShade" : "top"); // (a little texture in the knit)
  const hairAt = (x, y, z) => (Math.sin(x * 1.3 + y * 0.7) > 0.8 ? "hairShade" : "hair");

  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);
  const wear = (parent, build) => parent.add(build().mesh(palette));

  // The body: the top (a coat longer, down over the hips; a cardigan buttoned down the front).
  const long = topStyle === "coat";
  const paint = (p, x, y, color) => {
    const v = p.front(x, y);
    if (v) v[3] = color;
  };
  const torso = () => {
    const p = part();
    for (let y = long ? 6 : 9; y <= 19; y++) {
      const rx = y <= 17 ? (long && y < 9 ? 5.5 : 5) : y === 18 ? 4.5 : 4;
      ellipsoid(p, [0, y, -0.5], [rx, 0.5, long && y < 9 ? 4 : 3.5], y === (long ? 6 : 9) ? "topShade" : fabric, [], 3);
    }
    ellipsoid(p, [0, 20, -0.5], [3, 0.5, 2.5], topStyle === "tee" ? "topShade" : "top");
    if (topStyle === "cardigan" || long) for (let y = long ? 7 : 10; y <= 18; y++) paint(p, 0, y, y % 3 === 0 ? "button" : "topShade");
    if (topStyle === "jumper") for (let x = -4; x <= 4; x++) paint(p, x, 19, "topShade"); // the neck's rib
    return p;
  };
  const bodyPart = torso();
  pose.add(bodyPart.mesh(palette));
  // A skirt, flaring a little from the waist to the knee.
  if (legStyle === "skirt")
    pose.add(
      (() => {
        const p = part();
        for (let y = 4; y <= 9; y++) ellipsoid(p, [0, y, -0.5], [4.5 + (9 - y) * 0.25, 0.5, 3.4 + (9 - y) * 0.2], y % 2 ? "leg" : "legShade", [], 3);
        return p.mesh(palette);
      })()
    );

  // Legs and arms (chibi.js has the joints): trousers to the shoe, or bare under the skirt with socks; sleeves
  // short (a T-shirt) or long.
  const legX = (side) => (side > 0 ? [1, 3] : [-3, -1]);
  const skinX = (side, x0) => (side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2]);
  const skirted = legStyle === "skirt";
  const body = limbs(pose, wear, {
    thigh(side) {
      const p = part();
      box(p, legX(side), [5, 8], [-2, 1], skirted ? "skin" : "leg");
      return p;
    },
    shin(side) {
      const p = part();
      box(p, legX(side), [2, 4], [-2, 1], (x, y) => (skirted ? (y <= 3 ? "socks" : "skin") : y === 2 ? "legShade" : "leg"));
      box(p, legX(side), [0, 1], [-2, 2], (x, y) => (y === 0 ? "sole" : "shoe"));
      return p;
    },
    upper(side, x0) {
      const p = part();
      if (topStyle === "tee") {
        box(p, [x0, x0 + 2], [15, 19], [-2, 1], (x, y) => (y === 15 ? "topShade" : "top"));
        box(p, skinX(side, x0), [14, 14], [-1, 0], "skin");
      } else box(p, [x0, x0 + 2], [14, 19], [-2, 1], fabric);
      return p;
    },
    fore(side, x0) {
      const p = part();
      if (topStyle === "tee") box(p, skinX(side, x0), [10, 13], [-1, 0], "skin");
      else box(p, [x0, x0 + 2], [10, 13], [-2, 1], (x, y) => (y === 10 ? "topShade" : "top"));
      box(p, skinX(side, x0), [8, 9], [-1, 0], "skin");
      return p;
    },
  });

  // The head: round, under the hair; the face cut in under a fringe.
  const headPart = part();
  const fringe = hairStyle === "bob" ? 36 : hairStyle === "long" ? 37 : 38;
  const inFace = (x, y, z) => z >= 1 && Math.abs(x) <= 7 && y <= fringe - 0.08 * x * x;
  const inHair = (x, y, z) => (x / 10.5) ** 2 + ((y - 33) / 10.5) ** 2 + ((z + 0.5) / 9.5) ** 2 <= 1;
  // How far down the hair comes, at the back and over the ears: a short cut above the ears; a bob to the jaw.
  const hairLow = (x, z) => {
    if (hairStyle === "bob") return z < -1 ? 24 : Math.abs(x) >= 7 ? 25 : 34;
    if (hairStyle === "long") return z < -1 ? 24 : Math.abs(x) >= 7 ? 22 : 34;
    return z < -2 ? 27 : Math.abs(x) >= 8 ? 30 : 34;
  };
  ellipsoid(headPart, [0, 33, -0.5], [10.5, 10.5, 9.5], hairAt, [bodyPart, { has: (x, y, z) => inFace(x, y, z) || y < hairLow(x, z) }]);
  const outside = { has: (x, y, z) => !inFace(x, y, z) && !inHair(x, y, z) };
  ellipsoid(headPart, [0, 32, 0.5], [9.5, 9.5, 8.5], "skin", [bodyPart, headPart, outside], 3);
  ellipsoid(headPart, [0, 27.5, 1.5], [9, 4.5, 7.5], "skin", [bodyPart, headPart, outside]);
  if (hairStyle !== "bob" && hairStyle !== "long")
    for (const side of [-1, 1]) for (let y = 28; y <= 30; y++) headPart.add(side * 10, y, 0, "skinShade"); // the ears
  if (hairStyle === "bun") ellipsoid(headPart, [0, 42, -5], [4, 3.5, 4], hairAt);
  if (look.cap) {
    ellipsoid(headPart, [0, 38, -0.5], [11, 6.5, 10], (x, y) => (y <= 37 ? "capShade" : "cap"), [{ has: (x, y) => y < 37 }]);
    box(headPart, [-7, 7], [37, 37], [8, 11], "capShade"); // the peak
  }
  const headPivotY = 21;
  const head = pivotGroup(pose, [0, headPivotY, 0]);
  head.inner.add(headPart.mesh(palette));

  // Long hair hangs down the back from the head, and sways.
  let backHair = null;
  if (hairStyle === "long") {
    const p = part();
    for (let y = 13; y <= 30; y++) {
      const half = Math.round(9.5 + (30 - y) * 0.04);
      for (let x = -half; x <= half; x++) {
        if (y < 14 + (1 + Math.sin(x * 1.3))) continue;
        for (let z = -9 + Math.round(Math.abs(x) * 0.25); z <= (y >= 21 ? -4 : -5); z++) if (!headPart.has(x, y, z)) p.add(x, y, z, hairAt(x, y, z));
      }
    }
    backHair = pivotGroup(head.inner, [0, 32, -6]);
    backHair.inner.add(p.mesh(palette));
  }

  // The face: dark eyes with a glint, rosy cheeks, a small smile (open to laugh and talk); glasses maybe.
  const surface = surfaceOf(headPart);
  const facePart = part();
  const eyeCells = paintEyes(facePart, surface, [-6, 4], 31, (i, j) => (i === 0 && j === 0 ? "glint" : "eye"), ["XX", "XX", "XX"]);
  for (const x of [-7, -6, 6, 7]) facePart.add(...surface(x, 27, 0.4), "blush");
  if (look.glasses)
    for (const x0 of [-7, 3]) {
      // A thin frame round each eye (the eyes are two wide, three high), a bridge between them.
      for (let x = x0; x <= x0 + 3; x++) for (const y of [28, 32]) facePart.add(...surface(x, y, 0.6), "frame");
      for (let y = 29; y <= 31; y++) for (const x of [x0, x0 + 3]) facePart.add(...surface(x, y, 0.6), "frame");
    }
  if (look.glasses) for (let x = -3; x <= 2; x++) facePart.add(...surface(x, 31, 0.6), "frame");
  head.inner.add(facePart.mesh(palette));
  const painted = (cells, lift = 0.45) => {
    const p = part();
    cells.forEach(([x, y, c]) => p.add(...surface(x, y, lift), c));
    const m = p.mesh(palette);
    head.inner.add(m);
    return m;
  };
  const smile = painted(
    [-1, 0, 1]
      .map((x) => [x, 25, "mouth"])
      .concat([
        [-2, 26, "mouth"],
        [2, 26, "mouth"],
      ])
  );
  const open = painted(
    [-1, 0, 1].flatMap((x) => [
      [x, 26, "mouthDark"],
      [x, 25, "mouth"],
    ])
  );
  open.visible = false;
  // Lids over the eyes to blink (skin, a line of lashes), and happy eyes (^).
  const lids = (lashed) =>
    painted(
      eyeCells.map(({ p: [x, y], row, col }) => [x, y, lashed(col, row) ? "lash" : "skin"]),
      0.5
    );
  const eyelids = lids((col, row) => row === 2);
  eyelids.visible = false;
  const happyEyes = lids((col, row) => row === 1);
  happyEyes.visible = false;
  // (The actor puts a nightcap on at night: none here.)
  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  hat.visible = false;
  head.inner.add(hat);

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
    lieDrop: 4,
    headDrop: 0,
    headAt: [32, 9],
    hit: [22, 12, 23],
    shadow: [8, 5],
    speed: look.speed ?? 26,
    gaitHz: 2.1,
    hands: body.arms.map(({ hand }) => hand),
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
      if (backHair)
        backHair.outer.rotation.set(-head.outer.rotation.x + 0.12 * stride, -0.5 * head.outer.rotation.y, 0.05 * stride * Math.sin(gait), "YXZ");
    },
  };
}
