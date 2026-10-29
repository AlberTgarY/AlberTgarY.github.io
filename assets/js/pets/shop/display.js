/*******************************************************************************
 * The flower shop's flowers out front (layout.js): tall grey-blue bins on a
 * green-painted timber step before the kiosk's left window and more in front
 * of it, low buckets tiered on a riser before the doorway, and rows of black
 * buckets along to the right (the back row up on a bench, an aisle between
 * it and the two rows in front); every bucket packed with cellophane-sleeved
 * bunches (flowers.js), many with a chalkboard price on a stick; and by the
 * door, the bucket of bouquets she has made up.
 *
 * Drawn cheaply: the buckets of each kind are one instanced mesh, the
 * cellophane one more, the tags one (their words on one canvas), the timber
 * one; each bucketful of blooms is a mesh of its own, so that it can be
 * thinned out as she picks from it (pick()), sway in the breeze and shake when
 * clicked (and, while the shop is open, she makes up a bouquet of it).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { VIEW_YAW } from "../room/view.js";
import { COLORS, voxels } from "./kit.js";
import { FLOWERS, bucketBlooms, bouquet, rng } from "./flowers.js";
import { GROUND, KIOSK, DOOR, STEP, LEFT, MIDDLE, RIGHT, MADE, PLINTH, TRAYS, TREE, TAP, BUCKET_STACKS, SIGN, BOWL } from "./layout.js";

// The buckets: the tall grey-blue bins, the smaller grey-blue pails and the black buckets; how wide and how
// tall (voxels), how far the bunches in them flare out over the rim (`spread`, the radius of their top) and
// how tall they stand (`tall`, times the kind's own).
const KINDS = {
  bin: { r: 7.2, h: 16, spread: 9.5, tall: 1, body: "binBlue", seam: "binBlueShade", rim: "binBlueRim" },
  pail: { r: 5.8, h: 12, spread: 8, tall: 0.95, body: "binBlue", seam: "binBlueShade", rim: "binBlueRim" },
  black: { r: 5.6, h: 10, spread: 8.5, tall: 0.85, body: "bucketBlack", seam: "#202225", rim: "bucketBlackRim" },
};
const RISER = 5; // the riser under the middle's back row
const BENCH = 7; // the bench under the right's back row

// Every bucket: [kind of bucket, x, z, standing on (y), flowers, their colours, its price tag].
const STEP_Y = STEP.h;
const PLAN = [
  // On the step before the left window.
  ["bin", -141, -17, STEP_Y, "pompom", ["#f6d23c", "#f7f4ea", "#f3a03a", "#e9a3c5"], "BUTTON DAISY $18.00"],
  ["bin", -125, -17, STEP_Y, "sunflower", ["#f4c20d"], "SUNFLOWER $20"],
  ["bin", -109, -17, STEP_Y, "lily", ["#f3a9c4", "#f8f3ee"], "LILIUM $30"],
  // In front of it: bins, then black buckets.
  ["bin", -141, 3, 0, "gerbera", ["#e8245a", "#f06a9a", "#f6a3bd"], "GERBERA $30"],
  ["bin", -125, 3, 0, "pompom", ["#e9a3c5", "#c9a0dc", "#b9d77a", "#f7f4ea"], null],
  ["bin", -109, 3, 0, "gerbera", ["#e8452c", "#f59a2a", "#e8245a"], null],
  ["black", -144, 25, 0, "stock", ["#d8a6e8", "#f2a7c8"], null],
  ["black", -132, 25, 0, "carnation", ["#f6f2ec", "#f07aa8"], null],
  ["black", -120, 25, 0, "orchid", ["#3f6fd8", "#6a4fd0", "#2f8fc8"], "ORCHID $15"],
  ["black", -108, 25, 0, "sprayCarnation", ["#f39ac0", "#d8346e", "#f7f0f2"], null],
  // Before the doorway: pails up on the riser, black buckets in front.
  ["pail", -86, 13, RISER, "stock", ["#f2a7c8", "#e877b0"], "STOCKS $18"],
  ["pail", -73, 13, RISER, "stock", ["#9b59b6", "#d8a6e8"], null],
  ["pail", -60, 13, RISER, "snapdragon", ["#f39ab5", "#f6c08a", "#f7e27a", "#f6f2ea"], "SNAP DRAGON $12"],
  ["pail", -47, 13, RISER, "alstroemeria", ["#f28aa0", "#f6a35b", "#f7d34a"], "ALSTROEMERIA $12"],
  ["pail", -34, 13, RISER, "stock", ["#f6f0f5", "#f2a7c8"], null],
  ["black", -86, 37, 0, "sprayCarnation", ["#f39ac0", "#c9a0dc", "#d8346e"], "SPRAY CARNATION $15"],
  ["black", -73, 37, 0, "carnation", ["#f07aa8", "#e53950"], null],
  ["black", -60, 37, 0, "orchid", ["#3f6fd8", "#6a4fd0"], null],
  ["black", -47, 37, 0, "alstroemeria", ["#f4e9e4", "#e05a7a", "#f28aa0"], null],
  ["black", -34, 37, 0, "snapdragon", ["#d9467a", "#f6f2ea"], null],
  // Along to the right, a walkway through the middle: the back row up on the bench ...
  ["pail", 0, 0, BENCH, "gypsophila", ["#fbfaf4"], "GYPSOPHILA $16"],
  ["pail", 11.6, 0, BENCH, "statice", ["#7a4fb0", "#9b6fd0"], "STATICE $14"],
  ["pail", 23.2, 0, BENCH, "protea", ["#d9707e", "#e88a9a"], "PROTEA $14"],
  ["pail", 34.8, 0, BENCH, "lisianthus", ["#f4f0f6", "#8e5bc0"], "LISIANTHUS $22"],
  ["pail", 46.4, 0, BENCH, "eryngium", ["#6c86b8"], null],
  ["pail", 58, 0, BENCH, "waxflower", ["#f3b6c8", "#f7eef2"], null],
  ["pail", 94, 0, BENCH, "freesia", ["#f6d23c", "#f7f2ea"], null],
  ["pail", 105.6, 0, BENCH, "iris", ["#4b3fa8", "#5b4fc0"], "IRIS $20"],
  ["pail", 117.2, 0, BENCH, "gypsophila", ["#fbfaf4"], null],
  ["pail", 128.8, 0, BENCH, "lily", ["#f8f3ee", "#f3a9c4"], null],
  ["pail", 140.4, 0, BENCH, "protea", ["#e88a9a"], null],
  // ... and, across the aisle, two rows on the pavement.
  ["black", 0, 33, 0, "rose", ["#c8102e"], "RED ROSES $45"],
  ["black", 11.2, 33, 0, "rose", ["#e8507a", "#e23a74"], null],
  ["black", 22.4, 33, 0, "rose", ["#f5c542"], null],
  ["black", 33.6, 33, 0, "rose", ["#f6ad84"], null],
  ["black", 44.8, 33, 0, "peony", ["#f39ab8", "#f7d7df"], "PEONY $35"],
  ["black", 56, 33, 0, "peony", ["#f4746e", "#e2507a"], null],
  ["black", 94, 33, 0, "tulip", ["#e23a3a", "#f5c542", "#f39ab5"], "TULIPS $25"],
  ["black", 105.2, 33, 0, "carnation", ["#e53950", "#f07aa8"], "CARNATION $15"],
  ["black", 116.4, 33, 0, "lisianthus", ["#8e5bc0", "#f2b5cf"], null],
  ["black", 127.6, 33, 0, "gerbera", ["#f59a2a", "#e8452c"], "GERBERA $12"],
  ["black", 138.8, 33, 0, "tulip", ["#8e4fb0", "#f6f2ea"], null],
  ["black", 0, 45, 0, "rose", ["#f6f0e6"], null],
  ["black", 11.2, 45, 0, "tulip", ["#f39ab5", "#f6f2ea"], null],
  ["black", 22.4, 45, 0, "freesia", ["#b27ad6", "#f28aa0"], "FREESIA $18.00"],
  ["black", 33.6, 45, 0, "iris", ["#4b3fa8"], null],
  ["black", 44.8, 45, 0, "sprayCarnation", ["#f7f0f2", "#c9a0dc"], null],
  ["black", 56, 45, 0, "alstroemeria", ["#f6a35b", "#f7d34a"], null],
  ["black", 94, 45, 0, "waxflower", ["#e78fb0", "#f3b6c8"], null],
  ["black", 105.2, 45, 0, "carnation", ["#f6b3a0", "#f6f2ec"], null],
  ["black", 116.4, 45, 0, "rose", ["#e23a74", "#e8507a"], "ROSES $40"],
  ["black", 127.6, 45, 0, "pompom", ["#f6d23c", "#f7f4ea"], null],
  ["black", 138.8, 45, 0, "stock", ["#f6f0f5", "#d8a6e8"], null],
];

// What stands on the pavement, as boxes [x0, x1, z0, z1]: the step and the left's buckets, the middle's, the
// right's bench row and its two rows across the aisle (either side of the walkway through them), and the
// bucket of bouquets made up (left of the doorway: right of it, it would block the way along the kiosk's
// front to the lock-up).
const MADE_AT = [MADE.x, MADE.z];
const OBSTACLES = [
  [STEP.x0, STEP.x1, STEP.z0, LEFT.z1 - 3],
  [MIDDLE.x0, MIDDLE.x1, 7, 43],
  [-8, 65, -6, 6],
  [87, 148, -6, 6],
  [-6, 62, 27, 51],
  [88, 145, 27, 51],
  [MADE_AT[0] - 6, MADE_AT[0] + 6, MADE_AT[1] - 6, MADE_AT[1] + 6],
];
// And what the other builders put there (layout.js), roughly: where to stand is kept clear of all of it.
const OTHERS = [
  [KIOSK.x0, DOOR.x0, KIOSK.z1 - 2, KIOSK.z1 + 2], // the kiosk's front, either side of the doorway
  [DOOR.x1, KIOSK.x1, KIOSK.z1 - 2, KIOSK.z1 + 2],
  [KIOSK.x1 - 2, KIOSK.x1 + 2, KIOSK.z0, KIOSK.z1], // its right wall
  [TAP.x - 2, TAP.x + 9, TAP.z - 6, TAP.z + 6],
  [PLINTH.x0, PLINTH.x1, PLINTH.z0, PLINTH.z1],
  [TRAYS.x0, TRAYS.x1, TRAYS.z0, TRAYS.z1],
  [TREE.x - 8, TREE.x + 8, TREE.z - 8, TREE.z + 8],
  [BUCKET_STACKS.x0, BUCKET_STACKS.x1, BUCKET_STACKS.z0, BUCKET_STACKS.z1],
  [SIGN.x - 8, SIGN.x + 8, SIGN.z - 6, SIGN.z + 6],
  [BOWL.x - 4, BOWL.x + 4, BOWL.z - 4, BOWL.z + 4],
];
const CLEAR = 8; // where she stands is this far from anything

// Where to stand to reach into the bucket at (x, z): the nearest place out on the pavement (on the walking
// grid of room/nav.js) at least CLEAR from everything; with how far that is from the bucket.
function standFor(x, z) {
  const boxes = [...OBSTACLES, ...OTHERS];
  const free = (sx, sz) =>
    sx > GROUND.x0 + 6 &&
    sx < GROUND.x1 - 6 &&
    sz > GROUND.z0 + 6 &&
    sz < GROUND.z1 - 6 &&
    !(sx < KIOSK.x1 && sz < KIOSK.z1) && // (out of the kiosk)
    boxes.every(([x0, x1, z0, z1]) => sx <= x0 - CLEAR || sx >= x1 + CLEAR || sz <= z0 - CLEAR || sz >= z1 + CLEAR);
  let best = null;
  for (let sx = GROUND.x0 + 6; sx < GROUND.x1; sx += 4)
    for (let sz = GROUND.z0 + 6; sz < GROUND.z1; sz += 4) {
      if (!free(sx, sz)) continue;
      const d = Math.hypot(sx - x, sz - z);
      if (!best || d < best.reach) best = { stand: [sx, sz], reach: d };
    }
  return best;
}

// A bucket (its base at y = 0), faceted round like the rest: a little narrower at the foot, ribs round it and a
// lip at the top (the grey-blue ones with a second rib), dark water just under the rim. Each face coloured
// flat (its panels in alternate shades), drawn from both sides.
const SIDES = 14;
const bucketMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
function bucketGeometry({ r, h, body, seam, rim }, ribbed) {
  const at = (y) => r * (0.86 + (0.14 * y) / h); // the wall's radius at height y
  const profile = [
    [0, 0.2],
    [at(0), 0],
  ];
  const bands = [];
  // The ribs: out a little and back, over a band of the wall.
  for (const [y0, y1] of ribbed
    ? [
        [0.1 * h, 0.16 * h],
        [0.6 * h, 0.66 * h],
      ]
    : [[0.08 * h, 0.14 * h]]) {
    profile.push([at(y0), y0], [at(y0) + 0.35, y0], [at(y1) + 0.35, y1], [at(y1), y1]);
    bands.push([y0, y1]);
  }
  // The lip, rolled over at the top; the inside down to the water.
  profile.push([at(h - 1.2), h - 1.2], [at(h - 1.2) + 0.5, h - 1.2], [at(h) + 0.5, h], [at(h) - 0.6, h], [at(h) - 0.6, h - 2], [0, h - 2]);
  bands.push([h - 1.2, h + 0.1]);
  const g = new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    SIDES
  ).toNonIndexed();
  // Each face's colour: the water, a rib or the lip, or a panel of the wall.
  const pos = g.attributes.position;
  const colors = [];
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    let [x, y, z] = [0, 0, 0];
    for (let k = 0; k < 3; k++) [x, y, z] = [x + pos.getX(i + k) / 3, y + pos.getY(i + k) / 3, z + pos.getZ(i + k) / 3];
    const panel = Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * SIDES) % 2;
    if (y > h - 2.1 && Math.hypot(x, z) < at(h) - 0.7) col.set("#1f2b2c");
    else if (bands.some(([y0, y1]) => y > y0 - 0.01 && y < y1 + 0.01)) col.set(COLORS[rim] ?? rim);
    else col.set(COLORS[panel ? body : seam] ?? (panel ? body : seam)).multiplyScalar(panel ? 1 : 1.04);
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return g;
}

// The timber: the step (green-painted boards, dark gaps between them), the riser before the doorway and the
// bench along the right (a slatted top on square legs).
function timber() {
  const GREEN = "#3f6b4c";
  const GAP = "#2c4d37";
  const EDGE = "#4b7d5a";
  return voxels((p) => {
    // The step: only its outside (nothing inside it shows).
    const step = (x0, x1, y1, z0, z1) => {
      for (let x = x0; x <= x1; x++)
        for (let y = 0; y <= y1; y++)
          for (let z = z0; z <= z1; z++) {
            if (x > x0 && x < x1 && y < y1 && z > z0 && z < z1) continue;
            const top = y === y1;
            const gap = top ? (z - z0) % 5 === 4 : y % 4 === 3;
            p.add(x, y, z, gap ? GAP : top && (z - z0) % 5 === 0 ? EDGE : GREEN);
          }
    };
    step(STEP.x0, STEP.x1 - 1, STEP.h - 1, STEP.z0, STEP.z1 - 1);
    step(MIDDLE.x0, MIDDLE.x1 - 1, RISER - 1, 7, 19);
    // The benches, either side of the walkway: a slatted top on legs, a rail along the front near the foot.
    for (const [x0, x1] of [
      [-8, 64],
      [88, 147],
    ]) {
      for (let x = x0; x <= x1; x++)
        for (let z = -6; z <= 5; z++) {
          p.add(x, BENCH - 1, z, z % 3 === 2 ? GAP : GREEN);
          if (z === 5 || z === -6) p.add(x, BENCH - 2, z, EDGE);
        }
      for (const lx of [x0, Math.round((x0 + x1) / 2), x1 - 1])
        for (const lz of [-6, 4])
          for (let y = 0; y < BENCH - 2; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) p.add(lx + dx, y, lz + dz, GAP);
      for (let x = x0; x <= x1; x++) p.add(x, 1, 5, GAP);
    }
  });
}

// The price tags: little chalkboards in wooden frames, their words in chalk, all drawn on one canvas.
const TAG = { w: 8.5, h: 5.2, cols: 8, rows: 7, cw: 220, ch: 132 }; // (a slot on the canvas for every bucket)
// What a bunch of each costs, on the tags of the buckets the plan gives no words for.
const PRICE = {
  rose: 40,
  gerbera: 30,
  sunflower: 20,
  lily: 30,
  pompom: 18,
  stock: 18,
  snapdragon: 12,
  alstroemeria: 12,
  carnation: 15,
  sprayCarnation: 15,
  orchid: 15,
  iris: 20,
  peony: 35,
  tulip: 25,
  gypsophila: 16,
  waxflower: 14,
  eryngium: 16,
  statice: 14,
  protea: 14,
  lisianthus: 22,
  freesia: 18,
};
function tagBoard() {
  const canvas = document.createElement("canvas");
  canvas.width = TAG.cols * TAG.cw;
  canvas.height = TAG.rows * TAG.ch;
  const g = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
  // Tag `i`'s words: the name on one line and the price, bigger, under it (split before the "$").
  function write(i, text) {
    const [x, y] = [(i % TAG.cols) * TAG.cw, Math.floor(i / TAG.cols) * TAG.ch];
    g.fillStyle = "#7a5233";
    g.fillRect(x, y, TAG.cw, TAG.ch);
    g.fillStyle = "#2a2d2b";
    g.fillRect(x + 9, y + 9, TAG.cw - 18, TAG.ch - 18);
    // Chalk dust, smudged.
    const rand = rng(i * 97 + 13);
    for (let k = 0; k < 26; k++) {
      g.fillStyle = `rgba(240,238,230,${0.03 + rand() * 0.05})`;
      g.beginPath();
      g.ellipse(x + 15 + rand() * (TAG.cw - 30), y + 15 + rand() * (TAG.ch - 30), 6 + rand() * 20, 2 + rand() * 6, rand() * 3, 0, Math.PI * 2);
      g.fill();
    }
    const cut = text.indexOf("$");
    const [name, price] = cut > 0 ? [text.slice(0, cut).trim(), text.slice(cut)] : [text, ""];
    g.fillStyle = "#f2f0e8";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const fit = (words, size, cy) => {
      let s = size;
      do g.font = `bold ${s--}px ${HAND}`;
      while (g.measureText(words).width > TAG.cw - 30 && s > 10);
      g.fillText(words, x + TAG.cw / 2, y + cy);
    };
    fit(name, 30, price ? 42 : TAG.ch / 2);
    if (price) fit(price, 46, 88);
    texture.needsUpdate = true;
  }
  return { texture, write };
}

// Built a bucket at a time (a yield after each: shop.js spreads the work over frames); returns the display.
export function* buildingDisplay(shared) {
  const group = new THREE.Group();
  const selling = { on: true }; // (a bucket clicked asks for a bouquet only while the shop is open)
  const forward = new THREE.Vector3(Math.sin(VIEW_YAW), 0, Math.cos(VIEW_YAW)); // towards the viewer

  // The timber under it all.
  const wood = timber();
  wood.castShadow = wood.receiveShadow = true;
  group.add(wood);

  // The buckets of each kind as one instanced mesh.
  const templates = Object.fromEntries(Object.entries(KINDS).map(([name, k]) => [name, bucketGeometry(k, name !== "black")]));
  const counts = {};
  PLAN.forEach(([kind]) => (counts[kind] = (counts[kind] ?? 0) + 1));
  counts.pail = (counts.pail ?? 0) + 1; // (the bucket of bouquets made up)
  const instanced = Object.fromEntries(
    Object.keys(KINDS).map((name) => {
      const m = new THREE.InstancedMesh(templates[name], bucketMaterial, counts[name] ?? 0);
      m.castShadow = m.receiveShadow = true;
      m.count = 0;
      group.add(m);
      return [name, m];
    })
  );
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  // A bucket of `kind` standing at (x, y, z), turned `yaw`: its place in the kind's instanced mesh.
  function stand(kind, x, y, z, yaw) {
    const mesh = instanced[kind];
    mesh.setMatrixAt(mesh.count, m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, yaw), one));
    return mesh.count++;
  }

  // The tags, one a bucket, and the bamboo sticks they are on, pushed down into the bucket among the stems.
  const board = tagBoard();
  const tagPositions = [];
  const tagUvs = [];
  const tagIndex = [];
  const stickAt = []; // each stick's middle and length, at home
  const sticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 1, 0.45), new THREE.MeshLambertMaterial({ color: 0xc9a46a }), PLAN.length);
  sticks.count = 0;
  group.add(sticks);
  const tilt = new THREE.Euler(-0.3, VIEW_YAW, 0, "YXZ"); // (turned to the viewer, leaning back a little)
  // Tag `i` at (x, y, z), its stick from under it down to `foot` (inside the bucket), a little behind it.
  function addTag(i, [x, y, z], foot) {
    const base = tagPositions.length / 3;
    const [u0, v0] = [(i % TAG.cols) / TAG.cols, 1 - Math.floor(i / TAG.cols) / TAG.rows];
    const [u1, v1] = [u0 + 1 / TAG.cols, v0 - 1 / TAG.rows];
    for (const [sx, sy, u, v] of [
      [-1, -1, u0, v1],
      [1, -1, u1, v1],
      [1, 1, u1, v0],
      [-1, 1, u0, v0],
    ]) {
      const p = new THREE.Vector3((sx * TAG.w) / 2, (sy * TAG.h) / 2, 0).applyEuler(tilt);
      tagPositions.push(x + p.x, y + p.y, z + p.z);
      tagUvs.push(u, v);
    }
    tagIndex.push(base, base + 1, base + 2, base, base + 2, base + 3);
    const top = y - TAG.h / 2 + 0.5;
    const at = new THREE.Vector3(x, (top + foot) / 2, z).addScaledVector(forward, -0.4);
    sticks.setMatrixAt(sticks.count++, m4.compose(at, q.identity(), new THREE.Vector3(1, top - foot, 1)));
    stickAt.push([at.clone(), top - foot]);
  }

  // Each bucket: the bucket, its blooms (a mesh each), its cellophane, its tag; and what clicking it does.
  const buckets = [];
  const clickables = [];
  const swaying = [];
  const shake = new Map(); // blooms -> when they were last clicked (a shake dying away)
  const clickMaterial = new THREE.MeshBasicMaterial({ visible: false }); // (hit by a click, never drawn)
  let tags = 0;
  for (const [i, [kind, x, z, y, flower, colors, text]] of PLAN.entries()) {
    const k = KINDS[kind];
    const rand = rng(i * 131 + 7);
    const yaw = rand() * Math.PI * 2;
    const slot = stand(kind, x, y, z, yaw);
    const rim = y + k.h;
    const H = FLOWERS[flower].tall * k.tall;
    const blooms = bucketBlooms(flower, colors, k.spread, H, i * 977 + 31);
    blooms.position.set(x, rim - 0.5, z); // (unturned: only the faces turned to the viewer are in it)
    group.add(blooms);
    if (["sunflower", "lily", "gypsophila", "protea", "orchid", "snapdragon", "gerbera", "stock"].includes(flower))
      swaying.push({ mesh: blooms, phase: rand() * 6, amp: 0.025 + 0.02 * rand() });
    // Its tag, stuck in among the front bunches (inside the rim, its stick down into the bucket), standing a
    // little over the blooms in front, where the viewer reads it.
    const n = tags++;
    const at = new THREE.Vector3(x, rim + H * 0.85 + TAG.h / 2 - 0.8, z).addScaledVector(forward, k.r * 0.7);
    addTag(n, at.toArray(), rim - 1.5);
    const words = text ?? `${FLOWERS[flower].name.toUpperCase()} $${PRICE[flower]}`;
    board.write(n, words);
    const tag = { mesh: null, at: at.toArray(), text: words, set: (w) => board.write(n, (tag.text = w)) };
    const { stand: spot, reach } = standFor(x, z);
    const bucket = {
      kind: flower,
      colors,
      x,
      z,
      rim,
      top: [x, rim + H * 0.8, z],
      stand: spot,
      reach, // (how far the bucket is from there: the back ones a long lean)
      yaw: Math.atan2(x - spot[0], z - spot[1]),
      water: 0.6 + 0.4 * rand(),
      tag,
      level: 3,
      mesh: blooms,
      // Where it stands by day (the foot of the bucket), and where it is now (moved(): carried in at night).
      home: [x, y, z],
      where: [x, y, z],
      shown: true,
      bucketKind: kind,
      slot,
      turn: yaw,
      tagIndex: n,
      height: rim + H - y, // from its foot to the top of its blooms
      radius: k.r,
      // (each part's place when it is at home)
      parts: { blooms: blooms.position.clone(), stick: null, box: null },
      // A few stems taken out (thinner, down to the last third); filled up again.
      pick() {
        bucket.level = Math.max(1, bucket.level - 1);
        blooms.userData.level(bucket.level);
      },
      restock() {
        bucket.level = 3;
        blooms.userData.level(3);
      },
    };
    buckets.push(bucket);
    // Clicked anywhere on the bucket or its flowers: its flowers shake, and (open) she makes up a bouquet of them.
    const box = new THREE.Mesh(new THREE.BoxGeometry(2 * k.r + 2, rim + H - y, 2 * k.r + 2), clickMaterial);
    box.position.set(x, (y + rim + H) / 2, z);
    group.add(box);
    bucket.parts.box = box.position.clone();
    bucket.box = box;
    clickables.push({
      key: "bucket",
      bucket,
      can: () => !bucket.away,
      parts: [box, blooms],
      toggle(home) {
        shake.set(blooms, shared.clock.t);
        if (selling.on) home.life?.want?.({ bouquet: bucket.kind });
      },
    });
    yield;
  }
  // The tags as one mesh, drawn with the canvas.
  const tagGeometry = new THREE.BufferGeometry();
  tagGeometry.setAttribute("position", new THREE.Float32BufferAttribute(tagPositions, 3));
  tagGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(tagUvs, 2));
  tagGeometry.setIndex(tagIndex);
  tagGeometry.computeVertexNormals();
  const tagMesh = new THREE.Mesh(tagGeometry, new THREE.MeshLambertMaterial({ map: board.texture, side: THREE.DoubleSide }));
  group.add(tagMesh);
  buckets.forEach((b) => b.tag && (b.tag.mesh = tagMesh));

  // Moving a bucket (carried in for the night, out in the morning: life.js): the bucket, its blooms, its tag
  // and stick and the box clicked, all shifted together from where they are by day; or out of sight (put in
  // a cool room). Anything moved has the sun's shadows drawn again.
  const tagPos = tagGeometry.attributes.position;
  const tagHome = tagPos.array.slice();
  const nowhere = new THREE.Matrix4().makeScale(0, 0, 0);
  const v = new THREE.Vector3();
  const shift = new THREE.Vector3();
  const size = new THREE.Vector3();
  let moved = false;
  for (const b of buckets) {
    b.parts.stick = stickAt[b.tagIndex];
    // Its foot to (x, y, z), shown or not.
    b.place = (x, y, z, shown = true) => {
      const [dx, dy, dz] = [x - b.home[0], y - b.home[1], z - b.home[2]];
      shift.set(dx, dy, dz);
      b.where = [x, y, z];
      b.shown = shown;
      b.away = dx !== 0 || dy !== 0 || dz !== 0 || !shown;
      const mesh = instanced[b.bucketKind];
      mesh.setMatrixAt(b.slot, shown ? m4.compose(v.set(x, y, z), q.setFromAxisAngle(up, b.turn), one) : nowhere);
      mesh.instanceMatrix.needsUpdate = true;
      b.mesh.position.copy(b.parts.blooms).add(shift);
      b.mesh.visible = shown;
      const [mid, len] = b.parts.stick;
      sticks.setMatrixAt(b.tagIndex, shown ? m4.compose(v.copy(mid).add(shift), q.identity(), size.set(1, len, 1)) : nowhere);
      sticks.instanceMatrix.needsUpdate = true;
      const at = b.tagIndex * 12;
      for (let k = 0; k < 12; k += 3) {
        tagPos.array[at + k] = shown ? tagHome[at + k] + dx : tagHome[at];
        tagPos.array[at + k + 1] = shown ? tagHome[at + k + 1] + dy : tagHome[at + 1];
        tagPos.array[at + k + 2] = shown ? tagHome[at + k + 2] + dz : tagHome[at + 2];
      }
      tagPos.needsUpdate = true;
      b.box.position.copy(b.parts.box).add(shift);
      b.box.visible = shown;
      moved = true;
    };
    b.away = false;
  }

  // The bucket of bouquets made up, by the door: wrapped bouquets stood in it round the middle, leaning out.
  const MADE_RIM = KINDS.pail.h;
  const madeSlot = stand("pail", MADE_AT[0], 0, MADE_AT[1], 0.4);
  const madeGroup = new THREE.Group();
  madeGroup.position.set(MADE_AT[0], MADE_RIM - 7, MADE_AT[1]);
  group.add(madeGroup);
  const SLOTS = 6;
  const slots = Array(SLOTS).fill(null);
  const madeStand = standFor(...MADE_AT).stand;
  const made = {
    at: madeStand,
    yaw: Math.atan2(MADE_AT[0] - madeStand[0], MADE_AT[1] - madeStand[1]),
    top: [MADE_AT[0], MADE_RIM + 8, MADE_AT[1]],
    get count() {
      return slots.filter(Boolean).length;
    },
    // A finished bouquet stood in it (the oldest sold to make room, if full).
    add(bouquetGroup) {
      let k = slots.indexOf(null);
      if (k < 0) {
        made.take();
        k = slots.indexOf(null);
      }
      const a = (k / SLOTS) * Math.PI * 2 + 0.3;
      bouquetGroup.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4);
      bouquetGroup.rotation.set(0, 0, 0);
      bouquetGroup.rotateY(-a); // (its +x out from the middle)
      bouquetGroup.rotateZ(-0.2); // (leaning out that way)
      madeGroup.add(bouquetGroup);
      slots[k] = { group: bouquetGroup, at: shared.clock.t };
    },
    // One sold: the one in longest, taken out (its group), if there was one.
    take() {
      let oldest = -1;
      slots.forEach((s, k) => s && (oldest < 0 || s.at < slots[oldest].at) && (oldest = k));
      if (oldest < 0) return null;
      const { group } = slots[oldest];
      madeGroup.remove(group);
      slots[oldest] = null;
      return group;
    },
  };
  // Moved like the others (its foot at (x, y, z)), with the bouquets in it.
  Object.assign(made, {
    home: [MADE_AT[0], 0, MADE_AT[1]],
    where: [MADE_AT[0], 0, MADE_AT[1]],
    shown: true,
    away: false,
    height: MADE_RIM + 16,
    radius: KINDS.pail.r,
    place(x, y, z, shown = true) {
      made.where = [x, y, z];
      made.shown = shown;
      made.away = x !== made.home[0] || y !== made.home[1] || z !== made.home[2] || !shown;
      instanced.pail.setMatrixAt(madeSlot, shown ? m4.compose(v.set(x, y, z), q.setFromAxisAngle(up, 0.4), one) : nowhere);
      instanced.pail.instanceMatrix.needsUpdate = true;
      madeGroup.position.set(x, y + MADE_RIM - 7, z);
      madeGroup.visible = shown;
      moved = true;
    },
  });
  made.add(bouquet(["rose", "gypsophila"], 11));
  made.add(bouquet(["gerbera", "pompom", "waxflower"], 23));

  Object.values(instanced).forEach((m) => (m.instanceMatrix.needsUpdate = true));
  sticks.instanceMatrix.needsUpdate = true;

  return {
    group,
    obstacles: OBSTACLES,
    hides: [wood, ...Object.values(instanced)],
    clickables,
    buckets,
    made,
    selling,
    // Something moved: its shadow drawn again.
    shadowsDirty() {
      const was = moved;
      moved = false;
      return was;
    },
    dress() {},
    daylight() {},
    // The breeze: the tall bunches nodding, now and then in a gust; a bucket clicked, its flowers shaken.
    update(t) {
      const gust = 0.55 + 0.45 * Math.sin(t * 0.31) * Math.sin(t * 0.17 + 1);
      for (const { mesh, phase, amp } of swaying) {
        mesh.rotation.x = amp * gust * Math.sin(t * 1.6 + phase);
        mesh.rotation.z = amp * 0.7 * gust * Math.sin(t * 1.2 + phase * 1.7);
      }
      for (const [mesh, at] of shake) {
        const s = t - at;
        if (!swaying.some((w) => w.mesh === mesh)) mesh.rotation.set(0, 0, 0); // (no breeze in it to add to)
        if (s > 1.6) {
          shake.delete(mesh);
          continue;
        }
        const k = 0.14 * Math.exp(-3 * s);
        mesh.rotation.z += k * Math.sin(s * 19);
        mesh.rotation.x += 0.6 * k * Math.sin(s * 15 + 1);
      }
    },
  };
}
