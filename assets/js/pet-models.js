/*******************************************************************************
 * Voxel models for the pets on the profile photo (driven by assets/js/pets.js).
 *
 * Units are voxels: y up, the animal faces +z (towards the viewer) and its paws
 * rest on y = -0.5. Each model returns the same rig, so one runtime animates both:
 *   group, pose              turned to face the walking direction / bobbed and lowered to lie
 *   legs[4]                  pivots at the hips: front left, front right, hind left, hind right
 *   head, headPivotY         pivot at the neck
 *   ears[2]                  pivots at the ear bases, left then right
 *   eyelids, hat             meshes shown to blink or sleep / in dark mode
 *   hipY, lieDrop            how far the body sinks to lie down, keeping the paws planted
 *   headAt, hit, shadow      [height, forward] of the face; hit ellipse [height, rx, ry]; shadow radii
 *   speed, gaitHz            walking speed in px/s and steps per second
 *   mood({ happy, sleeping }), tail(dt, { happy, walking, lying, sleeping })
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

/* ---------- voxel helpers ---------- */

const cube = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial();

// A rigid part: a set of voxels keyed by position, so overlapping shapes merge (later wins).
function part() {
  const voxels = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  return {
    add(x, y, z, color) {
      voxels.set(key(x, y, z), [x, y, z, color]);
    },
    has: (x, y, z) => voxels.has(key(x, y, z)),
    // Frontmost voxel (largest z) in the column (x, y); used to paint the face onto the head.
    front(x, y) {
      let best = null;
      for (const v of voxels.values()) if (v[0] === x && v[1] === y && (!best || v[2] > best[2])) best = v;
      return best;
    },
    mesh(palette) {
      // Skip voxels buried inside the part: a rigid part never exposes them, and they are most of the volume.
      const exposed = ([x, y, z]) =>
        !voxels.has(key(x + 1, y, z)) ||
        !voxels.has(key(x - 1, y, z)) ||
        !voxels.has(key(x, y + 1, z)) ||
        !voxels.has(key(x, y - 1, z)) ||
        !voxels.has(key(x, y, z + 1)) ||
        !voxels.has(key(x, y, z - 1));
      const list = [...voxels.values()].filter(exposed);
      const mesh = new THREE.InstancedMesh(cube, material, list.length);
      const m = new THREE.Matrix4();
      const c = new THREE.Color();
      list.forEach(([x, y, z, color], i) => {
        mesh.setMatrixAt(i, m.makeTranslation(x, y, z));
        mesh.setColorAt(i, c.set(palette[color]));
      });
      return mesh;
    },
  };
}

// Fill an ellipsoid; `color` may be a function of (x, y, z); `skip` parts are left untouched.
function ellipsoid(p, [cx, cy, cz], [rx, ry, rz], color, skip = []) {
  for (let x = Math.ceil(cx - rx); x <= cx + rx; x++)
    for (let y = Math.ceil(cy - ry); y <= cy + ry; y++)
      for (let z = Math.ceil(cz - rz); z <= cz + rz; z++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 > 1) continue;
        if (skip.some((s) => s.has(x, y, z))) continue;
        p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
      }
}

function box(p, [x0, x1], [y0, y1], [z0, z1], color, skip = []) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) {
        if (skip.some((s) => s.has(x, y, z))) continue;
        p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
      }
}

// A group whose children rotate about `pivot` in the parent's space.
function pivotGroup(parent, pivot) {
  const outer = new THREE.Group();
  outer.position.set(...pivot);
  const inner = new THREE.Group();
  inner.position.set(-pivot[0], -pivot[1], -pivot[2]);
  outer.add(inner);
  parent.add(outer);
  return { outer, inner };
}

// Painted details sit a little proud of the frontmost voxel of `headPart`, so they follow its curve.
const surfaceOf = (headPart) => (x, y, lift) => {
  const v = headPart.front(x, y);
  return [v[0], v[1], v[2] + lift];
};

// A round 5 x 5 eye: `color(col, row)` names each cell, row 0 at the top. Returns the cell positions.
const EYE_ROWS = [".XXX.", "XXXXX", "XXXXX", "XXXXX", ".XXX."];
function paintEyes(eyePart, surface, lefts, top, color) {
  const cells = [];
  for (const x0 of lefts)
    EYE_ROWS.forEach((row, j) =>
      [...row].forEach((cell, i) => {
        if (cell !== "X") return;
        const p = surface(x0 + i, top - j, 0.4);
        eyePart.add(...p, color(i, j));
        cells.push({ p, row: j });
      })
    );
  return cells;
}

// Knitted nightcap on the head: ribbed cuff, alternating knit rows, white stars and a pompom. Stars are
// pixel bitmaps wrapped onto the cone, rows by height and columns by arc length around its axis.
const BIG_STAR = ["..X..", "..X..", "XXXXX", ".XXX.", ".X.X."];
const SMALL_STAR = [".X.", "XXX", "X.X"];
function nightcap(skip, { y0, z0, radius, height }) {
  const coneY = y0 + 2;
  const ring = (y, count, offset) => [...Array(count)].map((_, i) => [y, ((i + offset) / count) * Math.PI * 2]);
  const coneR = (y) => radius * (1 - (y - coneY) / height) ** 0.9 + 0.6;
  const bigY = coneY + Math.round(height * 0.38);
  const smallY = coneY + Math.round(height * 0.69);
  const stars = [
    ...ring(bigY, Math.max(3, Math.round((Math.PI * 2 * coneR(bigY)) / 9)), 0).map((s) => [...s, BIG_STAR]),
    ...ring(smallY, Math.max(3, Math.round((Math.PI * 2 * coneR(smallY)) / 7)), 0.5).map((s) => [...s, SMALL_STAR]),
  ]; // [top row height, angle, bitmap]
  const knit = (x, y, z, cx, cz, r) => {
    const a = Math.atan2(z - cz, x - cx);
    const onStar = stars.some(([top, sa, rows]) => {
      const row = rows[top - y];
      if (!row) return false;
      const col = Math.round(Math.atan2(Math.sin(a - sa), Math.cos(a - sa)) * r) + (row.length >> 1);
      return row[col] === "X";
    });
    return onStar ? "star" : y % 2 ? "cap" : "capRow";
  };
  const p = part();
  for (let y = y0; y <= y0 + 1; y++) ellipsoid(p, [0, y, z0], [radius + 1, 0.5, radius + 1], (x) => (((x % 2) + 2) % 2 ? "trimRib" : "trim"), [skip]);
  let tip = [0, coneY, z0];
  for (let y = coneY; y <= coneY + height; y++) {
    const cx = (y - coneY) * 0.45;
    const cz = z0 - (y - coneY) * 0.25;
    const r = coneR(y);
    ellipsoid(p, [cx, y, cz], [r, 0.5, r], (x, _, z) => knit(x, y, z, cx, cz, r), [skip]);
    tip = [cx, y, cz];
  }
  ellipsoid(p, [tip[0] + 1.5, tip[1] + 1.5, tip[2]], [2.6, 2.6, 2.6], "trim");
  return p;
}

const CAP_COLORS = { trim: "#f2eadb", trimRib: "#e0d6c3", star: "#fbf8f1" };

/* ---------- border collie ---------- */

export function buildCollie() {
  const palette = {
    black: "#32323a", // charcoal rather than pure black, so the glossy eyes stand out
    fold: "#4b4b56",
    white: "#f3efe6",
    eye: "#050506",
    glint: "#ffffff",
    nose: "#15151a",
    mouth: "#4a1f26",
    tongue: "#f08a9c",
    cap: "#cc3a41",
    capRow: "#b4323a",
    ...CAP_COLORS,
  };
  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Body: black back and sides, white chest and belly.
  const bodyPart = part();
  ellipsoid(bodyPart, [0, 17, 0], [10, 9, 15], (x, y, z) => (y <= 10 || (z >= 9 && y <= 23) ? "white" : "black"));
  pose.add(bodyPart.mesh(palette));

  // Legs hang from hips at y = 10; the hind legs have black thighs.
  const legs = [
    [-5, 8, false],
    [5, 8, false],
    [-5, -9, true],
    [5, -9, true],
  ].map(([cx, cz, hind]) => {
    const p = part();
    box(p, [cx - 2, cx + 1], [0, 9], [cz - 2, cz + 1], "white");
    box(p, [cx - 2, cx + 1], [0, 0], [cz + 2, cz + 2], "white"); // toes
    if (hind) box(p, [cx - 3, cx + 2], [5, 9], [cz - 3, cz + 2], "black");
    const g = pivotGroup(pose, [cx, 10, cz]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  // Tail: bushy, carried low and back with an upward sweep at the white tip.
  const tailPart = part();
  const TAIL_PATH = [
    [21, -14],
    [19, -17],
    [17, -19.5],
    [16, -22],
    [16, -24.5],
    [17.5, -26.5],
    [19.5, -27.5],
    [21.5, -28],
  ];
  TAIL_PATH.forEach(([cy, cz], i) => ellipsoid(tailPart, [0, cy, cz], [2, 2.2, 2.2], i >= 6 ? "white" : "black"));
  const tailPivot = pivotGroup(pose, [0, 21, -14]);
  tailPivot.inner.add(tailPart.mesh(palette));

  // Head: black with a narrow blaze that widens into the white muzzle and chin.
  const headPart = part();
  const blazeHalf = (y) => (y >= 40 ? 1 : y >= 35 ? 1.5 : 1.5 + (35 - y) * 0.45);
  ellipsoid(headPart, [0, 32, 8], [12, 11, 10], (x, y, z) => (z >= 0 && Math.abs(x) <= blazeHalf(y) ? "white" : "black"), [bodyPart]);
  ellipsoid(headPart, [0, 28, 16], [6.5, 5, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 24, 11], [5, 4, 6], "white", [bodyPart]);
  for (let x = -2; x <= 2; x++) for (let y = 29; y <= 31; y++) headPart.front(x, y)[3] = "nose";
  const headPivotY = 26; // the neck
  const head = pivotGroup(pose, [0, headPivotY, 6]);
  head.inner.add(headPart.mesh(palette));
  const surface = surfaceOf(headPart);

  // Eyes: big, round, glossy black, with a large sparkle at the upper left and a small one at the
  // lower right, on the same side for both eyes as if lit by one light.
  const GLINTS = new Set(["1,1", "2,1", "1,2", "3,3"]);
  const eyePart = part();
  const eyeCells = paintEyes(eyePart, surface, [-9, 5], 36, (i, j) => (GLINTS.has(`${i},${j}`) ? "glint" : "eye"));
  head.inner.add(eyePart.mesh(palette));

  // A small ω mouth under the nose.
  const mouthPart = part();
  [
    [-2, 28],
    [-1, 27],
    [0, 28],
    [1, 27],
    [2, 28],
  ].forEach(([x, y]) => mouthPart.add(...surface(x, y, 0.4), "mouth"));
  head.inner.add(mouthPart.mesh(palette));

  // Eyelids sit a hair in front of the eyes and are shown to blink or sleep.
  const lidPart = part();
  eyeCells.forEach(({ p: [x, y, z] }) => lidPart.add(x, y, z + 0.1, "black"));
  const eyelids = lidPart.mesh(palette);
  eyelids.visible = false;
  head.inner.add(eyelids);

  // Open mouth with the tongue out, shown while panting.
  const tonguePart = part();
  for (let x = -1; x <= 1; x++) {
    const front = headPart.front(x, 27);
    const z = front ? front[2] + 0.45 : 21;
    tonguePart.add(x, 27, z, "mouth");
    tonguePart.add(x, 26, z, "tongue");
    tonguePart.add(x, 25, z - 0.5, "tongue");
    if (x === 0) tonguePart.add(x, 24, z - 1, "tongue");
  }
  const tongue = tonguePart.mesh(palette);
  tongue.visible = false;
  head.inner.add(tongue);

  // Ears: tapered and upright, splaying outwards, with the tip folded over and down.
  const ears = [-1, 1].map((side) => {
    const base = side * 7;
    const p = part();
    let top = [base, 38];
    for (let k = 0; k <= 8; k++) {
      const half = 4 - k * 0.38;
      const cx = base + side * k * 0.5;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++)
        for (let z = 2; z <= 5; z++) if (!headPart.has(x, 37 + k, z)) p.add(x, 37 + k, z, "black");
      top = [Math.round(cx), 37 + k];
    }
    // The folded tip: a small flap hanging forward and outward from the top of the ear.
    for (let k = 0; k <= 3; k++)
      for (let w = -1; w <= 1; w++) p.add(top[0] + side * (1 + k) + w, top[1] - k, 6, k === 0 && w !== 0 ? "black" : "fold");
    const g = pivotGroup(head.inner, [base, 38, 3.5]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  const hat = nightcap(headPart, { y0: 42, z0: 7, radius: 8.5, height: 13 }).mesh(palette);
  head.inner.add(hat);

  // Tail: slow idle wag, brisk when walking or happy, resting low when asleep.
  let wagPhase = 0;
  let wagAmp = 0.25;
  return {
    label: "Voxel border collie, click to pet",
    group,
    pose,
    legs,
    head,
    headPivotY,
    ears,
    eyelids,
    hat,
    hipY: 10,
    lieDrop: 8,
    headAt: [32, 10],
    hit: [24, 22, 27],
    shadow: [13, 19],
    speed: 40,
    gaitHz: 2.4,
    mood({ happy, sleeping }) {
      tongue.visible = happy && !sleeping; // panting
    },
    tail(dt, { happy, walking, lying, sleeping }) {
      wagAmp += ((sleeping ? 0.04 : happy ? 0.55 : walking ? 0.4 : 0.25) - wagAmp) * (1 - Math.exp(-4 * dt));
      wagPhase += Math.PI * 2 * (sleeping ? 0.4 : happy ? 3 : walking ? 2 : 1.1) * dt;
      tailPivot.outer.rotation.y = wagAmp * Math.sin(wagPhase);
      tailPivot.outer.rotation.x = -0.7 * lying;
    },
  };
}

/* ---------- tortoiseshell cat ---------- */

export function buildCat() {
  const palette = {
    dark: "#2b2522",
    brown: "#4d372b",
    ginger: "#c7843f",
    gingerLight: "#e2a964",
    cream: "#eccfa1",
    iris: "#d6ad48",
    eye: "#050506",
    glint: "#ffffff",
    nose: "#e39a9c",
    mouth: "#3a2420",
    earPink: "#d6948f",
    whisker: "#f4f1ea",
    cap: "#2f4a8a",
    capRow: "#283f78",
    ...CAP_COLORS,
  };

  // Tortoiseshell: soft-edged ginger patches over dark fur, brindled with brown. A sum of slow
  // sines gives the patches; a hash adds the fine speckle. Both are fixed, so the coat never shimmers.
  const hash = (x, y, z) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // Mostly dark, like the real cat: ginger only in the strongest patches, with mottled brown edges.
  const tortie = (x, y, z) => {
    const n = Math.sin(x * 0.55 + 1.3) * Math.sin(y * 0.47 + 0.4) + 0.8 * Math.sin(z * 0.6 + y * 0.3) + 0.6 * Math.sin((x + z) * 0.35 + 2);
    const h = hash(x, y, z);
    if (n > 1.2) return h < 0.25 ? "gingerLight" : "ginger";
    if (n > 0.8) return h < 0.4 ? "ginger" : "brown";
    return h < 0.2 ? "brown" : "dark";
  };

  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Body: slim, with a ginger patch on the chest.
  const bodyPart = part();
  const chestPatch = (x, y, z) => z >= 7 && y >= 12 && y <= 17 && Math.abs(x + 1) <= 3 - (17 - y) * 0.4;
  ellipsoid(bodyPart, [0, 13, 0], [7, 6.5, 11], (x, y, z) => (chestPatch(x, y, z) ? "ginger" : tortie(x, y, z)));
  pose.add(bodyPart.mesh(palette));

  // Slender legs from hips at y = 8.
  const legs = [
    [-3.5, 7],
    [3.5, 7],
    [-3.5, -7],
    [3.5, -7],
  ].map(([cx, cz]) => {
    const p = part();
    const x0 = Math.round(cx - 1);
    const z0 = Math.round(cz - 1);
    box(p, [x0, x0 + 2], [0, 7], [z0, z0 + 2], (x, y, z) => tortie(x, y, z));
    box(p, [x0, x0 + 2], [0, 0], [z0 + 3, z0 + 3], "dark"); // toes
    const g = pivotGroup(pose, [cx, 8, cz]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  // Tail: a chain of four segments, so it can sway in a wave and curl at the tip.
  const SEG = 4.5;
  const tailBase = [0, 15, -10];
  const tailSegs = [];
  let parent = pose;
  for (let i = 0; i < 4; i++) {
    const py = tailBase[1] + i * SEG;
    const g = pivotGroup(parent, [0, py, tailBase[2]]);
    const p = part();
    ellipsoid(p, [0, py + SEG / 2, tailBase[2]], [1.7 - i * 0.12, SEG / 2 + 0.9, 1.7 - i * 0.12], (x, y, z) => (i === 3 ? "dark" : tortie(x, y, z)));
    g.inner.add(p.mesh(palette));
    tailSegs.push(g);
    parent = g.inner;
  }
  const TAIL_REST = [-1.1, 0.45, 0.45, 0.6]; // each relative to the last: back from the rump, rising, curling at the tip

  // Head: mostly dark, with a thin ginger blaze just left of centre, ginger mottling round the left
  // eye and cheek, and the right side of the face dark.
  const headPart = part();
  const face = (x, y, z) => {
    if (z < 6) return tortie(x, y, z);
    if (y >= 27 && x >= -1 && x <= 0) return "ginger"; // the blaze
    if (x <= -2 && y >= 20 && y <= 26) return hash(x, y, z) < 0.3 ? "brown" : "ginger"; // left cheek
    if (x >= 2) return hash(x, y, z) < 0.15 ? "brown" : "dark"; // right side
    return tortie(x, y, z);
  };
  ellipsoid(headPart, [0, 25, 9], [9, 8, 7.5], face, [bodyPart]);
  // Muzzle: ginger on the left, dark on the right, with a little cream at the chin.
  ellipsoid(headPart, [0, 21.5, 14], [4, 3, 3], (x, y) => (y <= 19 && Math.abs(x) <= 2 ? "cream" : x <= 0 ? "gingerLight" : "dark"), [bodyPart]);
  const headPivotY = 17;
  const head = pivotGroup(pose, [0, headPivotY, 7]);
  const surface = surfaceOf(headPart);

  // Pink nose and an ω mouth on the muzzle.
  [
    [-1, 23],
    [0, 23],
    [1, 23],
    [0, 22],
  ].forEach(([x, y]) => (headPart.front(x, y)[3] = "nose"));
  head.inner.add(headPart.mesh(palette));
  const facePart = part();
  [
    [0, 21],
    [-1, 20],
    [1, 20],
    [-2, 21],
    [2, 21],
  ].forEach(([x, y]) => facePart.add(...surface(x, y, 0.4), "mouth"));

  // Whiskers: two fine white lines per side, sweeping out and back from the muzzle.
  for (const side of [-1, 1])
    for (const [dy, rise] of [
      [1, 0.25],
      [-1, -0.25],
    ])
      for (let k = 0; k <= 6; k++) facePart.add(side * (4 + k), Math.round(21.5 + dy + rise * k), Math.round(15 - k * 0.45), "whisker");
  head.inner.add(facePart.mesh(palette));

  // Eyes: big round amber eyes with wide black pupils and a sparkle at the upper left and lower right.
  const eyePart = part();
  const eyeCells = paintEyes(eyePart, surface, [-7, 3], 28, (i, j) => {
    if (i === 0 || i === 4 || j === 0 || j === 4) return "iris";
    return (i === 1 && j === 1) || (i === 3 && j === 3) ? "glint" : "eye";
  });
  head.inner.add(eyePart.mesh(palette));

  // Lids: full ones to blink or sleep, and upper ones for a contented half-closed look when petted.
  const lidPart = part();
  const halfLidPart = part();
  eyeCells.forEach(({ p: [x, y, z], row }) => {
    lidPart.add(x, y, z + 0.1, "dark");
    if (row <= 1) halfLidPart.add(x, y, z + 0.1, "dark");
  });
  const eyelids = lidPart.mesh(palette);
  const halfLids = halfLidPart.mesh(palette);
  eyelids.visible = false;
  halfLids.visible = false;
  head.inner.add(eyelids, halfLids);

  // Ears: tall, pointed and upright, pink inside.
  const ears = [-1, 1].map((side) => {
    const base = side * 5.5;
    const p = part();
    for (let k = 0; k <= 7; k++) {
      const half = 3.2 - k * 0.42;
      const cx = base + side * k * 0.3;
      const x0 = Math.round(cx - half);
      const x1 = Math.round(cx + half);
      for (let x = x0; x <= x1; x++)
        for (let z = 6; z <= 8; z++) {
          if (headPart.has(x, 30 + k, z)) continue;
          const inner = z === 8 && k <= 5 && x > x0 && x < x1;
          p.add(x, 30 + k, z, inner ? "earPink" : hash(x, k, z) < 0.2 ? "brown" : "dark");
        }
    }
    const g = pivotGroup(head.inner, [base, 30, 7]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  const hat = nightcap(headPart, { y0: 32, z0: 8, radius: 5, height: 10 }).mesh(palette);
  head.inner.add(hat);

  // Tail: a slow travelling sway; carried high with a curled tip when walking or happy; wrapped
  // round to the side and low when asleep.
  let swayPhase = 0;
  let lift = 0;
  return {
    label: "Voxel tortoiseshell cat, click to pet",
    group,
    pose,
    legs,
    head,
    headPivotY,
    ears,
    eyelids,
    hat,
    hipY: 8,
    lieDrop: 6,
    headAt: [25, 9],
    hit: [19, 16, 21],
    shadow: [9, 14],
    speed: 34,
    gaitHz: 2.1,
    mood({ happy, sleeping }) {
      halfLids.visible = happy && !sleeping;
    },
    tail(dt, { happy, walking, lying, sleeping }) {
      lift += ((happy || walking ? 1 : 0) - lift) * (1 - Math.exp(-3 * dt));
      swayPhase += Math.PI * 2 * (happy ? 1.2 : sleeping ? 0.15 : 0.45) * dt;
      tailSegs.forEach((seg, i) => {
        const sway = (sleeping ? 0.05 : 0.22) * Math.sin(swayPhase - i * 0.7);
        // Lying, the base lowers the tail to lie flat behind; once it does, each later segment's local z is
        // the world's up, so turning about z curls the tail round the body's near side.
        const up = TAIL_REST[i] + lift * (i === 0 ? 0.45 : i === 3 ? 0.3 : 0);
        const down = i === 0 ? -1.55 : 0;
        seg.outer.rotation.x = up + (down - up) * lying;
        seg.outer.rotation.z = sway - lying * (i === 0 ? 0 : 0.75);
      });
    },
  };
}
