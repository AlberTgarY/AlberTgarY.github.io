/*******************************************************************************
 * Voxel models for the pets on the profile photo (driven by assets/js/pets.js).
 *
 * Units are voxels: y up, the model faces +z (towards the viewer) and its feet
 * rest on y = -0.5. Each model returns the same rig, so one runtime animates all:
 *   group, pose              turned to face the walking direction / bobbed and lowered to lie
 *   head, headPivotY         pivot at the neck
 *   ears[]                   pivots at the ear bases, left then right
 *   eyelids, hat             meshes shown to blink or sleep / in dark mode
 *   lieDrop, headDrop        how far the body and the head sink to lie down (or sit)
 *   headAt, hit, shadow      [height, forward] of the face; hit ellipse [height, rx, ry]; shadow radii
 *   speed, gaitHz            walking speed in px/s and steps per second
 *   lane                     px further back than the front path, for models that walk past the pets
 *   trickTime                seconds of the model's own idle trick, if it has one
 *   feeds, eats              whether it feeds other pets / eats from a bowl when fed
 *   label, hint              accessible name and tooltip
 *   animate(dt, { happy, walking, lying, sleeping, stride, gait, state, elapsed, progress })
 *                            poses the limbs, tail and face; `elapsed` is the seconds spent in `state`
 *                            (idle, walk, lap, sleep, trick, feed, serve or eat) and `progress` the
 *                            fraction done of a timed one
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

// Fill an ellipsoid; `color` may be a function of (x, y, z); `skip` parts are left untouched. A
// `power` above 2 gives a squarer, rounded-box shape.
function ellipsoid(p, [cx, cy, cz], [rx, ry, rz], color, skip = [], power = 2) {
  for (let x = Math.ceil(cx - rx); x <= cx + rx; x++)
    for (let y = Math.ceil(cy - ry); y <= cy + ry; y++)
      for (let z = Math.ceil(cz - rz); z <= cz + rz; z++) {
        if (Math.abs((x - cx) / rx) ** power + Math.abs((y - cy) / ry) ** power + Math.abs((z - cz) / rz) ** power > 1) continue;
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

// A round eye (5 x 5 unless `rows` says otherwise): `color(col, row)` names each cell, row 0 at the
// top. Returns the cell positions.
const EYE_ROWS = [".XXX.", "XXXXX", "XXXXX", "XXXXX", ".XXX."];
function paintEyes(eyePart, surface, lefts, top, color, rows = EYE_ROWS) {
  const cells = [];
  for (const x0 of lefts)
    rows.forEach((row, j) =>
      [...row].forEach((cell, i) => {
        if (cell !== "X") return;
        const p = surface(x0 + i, top - j, 0.4);
        eyePart.add(...p, color(i, j));
        cells.push({ p, row: j, col: i });
      })
    );
  return cells;
}

// Four legs walk with diagonal pairs in opposite phase, and fold away as the body sinks to lie down.
function walkLegs(legs, { stride, gait, lying }, fold) {
  legs.forEach((leg, i) => {
    leg.outer.rotation.x = 0.42 * stride * Math.sin(gait + (i % 3 === 0 ? 0 : Math.PI));
    leg.outer.scale.y = 1 - fold * lying;
  });
}

// Exponential ease towards a target, independent of the frame rate.
const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));

// A fixed per-voxel random number in [0, 1), for speckled fur and hair that never shimmers.
function hash(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
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
    bowl: "#4f86d6",
    bowlRim: "#7ba7ea",
    kibble: "#a8662f",
    kibbleDark: "#7d4520",
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
  // Muzzle: a broad base tapering into a slimmer snout, with the lower jaw set back under it.
  ellipsoid(headPart, [0, 28, 16], [6.5, 5, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 28, 22], [4.3, 3.8, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 24.5, 16], [4.3, 3.5, 8], "white", [bodyPart]);
  for (let x = -2; x <= 2; x++) for (let y = 28; y <= 30; y++) headPart.front(x, y)[3] = "nose";
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
    [-2, 27],
    [-1, 26],
    [0, 27],
    [1, 26],
    [2, 27],
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
    const z = headPart.front(x, 26)[2] + 0.45;
    tonguePart.add(x, 26, z, "mouth");
    tonguePart.add(x, 25, z, "tongue");
    tonguePart.add(x, 24, z - 0.5, "tongue");
    if (x === 0) tonguePart.add(x, 23, z - 1, "tongue");
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

  // A bowl at her front paws while she is fed: it fills as the kibble is poured in, then empties as
  // she eats, the heap first. To eat she lowers and stretches her neck and nods into the bowl.
  const BOWL_Z = 24;
  const CHOW = { drop: 9, reach: 5, nod: 0.7 };
  const bowlPart = part();
  const kibbleParts = [part(), part(), part()]; // bottom layer, top layer, heap
  for (let x = -5; x <= 5; x++)
    for (let z = -5; z <= 5; z++) {
      const r = Math.hypot(x, z);
      if (r > 5.2) continue;
      bowlPart.add(x, 0, BOWL_Z + z, "bowl");
      if (r > 3.8) {
        bowlPart.add(x, 1, BOWL_Z + z, "bowl");
        bowlPart.add(x, 2, BOWL_Z + z, "bowlRim");
        continue;
      }
      const kibble = (y) => (hash(x, y, z) < 0.35 ? "kibbleDark" : "kibble");
      kibbleParts[0].add(x, 1, BOWL_Z + z, kibble(1));
      kibbleParts[1].add(x, 2, BOWL_Z + z, kibble(2));
      if (r < 2.6) kibbleParts[2].add(x, 3, BOWL_Z + z, kibble(3));
    }
  const kibble = kibbleParts.map((p) => p.mesh(palette));
  const bowl = new THREE.Group();
  bowl.add(bowlPart.mesh(palette), ...kibble);
  bowl.visible = false;
  group.add(bowl);

  // Tail: slow idle wag, brisk when walking or happy, resting low when asleep.
  let wagPhase = 0;
  let wagAmp = 0.25;
  let chow = 0; // 0 head up, 1 head in the bowl
  const lieDrop = 8;
  return {
    label: "Voxel border collie, click to pet",
    hint: "pet me",
    group,
    pose,
    head,
    headPivotY,
    ears,
    eyelids,
    hat,
    lieDrop,
    headDrop: 3,
    headAt: [32, 10],
    hit: [24, 22, 27],
    shadow: [13, 19],
    speed: 40,
    gaitHz: 2.4,
    eats: true,
    animate(dt, s) {
      const { happy, walking, lying, sleeping, state, elapsed, progress } = s;
      walkLegs(legs, s, lieDrop / 10.5); // the hips are 10.5 voxels above the ground
      tongue.visible = happy && !sleeping; // panting

      const eating = state === "eat";
      bowl.visible = eating;
      kibble.forEach((m, i) => (m.visible = elapsed > 0.3 + 0.4 * i && progress < 0.85 - 0.25 * i));
      chow = approach(chow, eating && elapsed > 1.5 && progress < 0.92 ? 1 : 0, 6, dt);
      head.outer.position.y -= CHOW.drop * chow;
      head.outer.position.z = 6 + CHOW.reach * chow;
      head.outer.rotation.x += chow * (CHOW.nod + 0.12 * Math.sin(elapsed * 12)) + (eating ? 0.3 * (1 - chow) : 0); // watching it fill
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
  // sines gives the patches; a hash adds the fine speckle.
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
  tailSegs[0].outer.rotation.order = "YXZ"; // the base turns about the world's up after lowering the tail
  const TAIL_REST = [-1.1, 0.45, 0.45, 0.6]; // each relative to the last: back from the rump, rising, curling at the tip
  // Asleep, each segment turns further towards the near side: the base leaves the rump on a slant, and
  // the rest bends forward along her side.
  const TAIL_WRAP = [0.9, 1.2, 0.6, 0.2];

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
  const lieDrop = 6;
  return {
    label: "Voxel tortoiseshell cat, click to pet",
    hint: "pet me",
    group,
    pose,
    head,
    headPivotY,
    ears,
    eyelids,
    hat,
    lieDrop,
    headDrop: 3,
    headAt: [25, 9],
    hit: [19, 16, 21],
    shadow: [9, 14],
    speed: 34,
    gaitHz: 2.1,
    animate(dt, s) {
      const { happy, walking, lying, sleeping } = s;
      walkLegs(legs, s, lieDrop / 8.5); // the hips are 8.5 voxels above the ground
      halfLids.visible = happy && !sleeping;
      lift += ((happy || walking ? 1 : 0) - lift) * (1 - Math.exp(-3 * dt));
      swayPhase += Math.PI * 2 * (happy ? 1.2 : sleeping ? 0.15 : 0.45) * dt;
      tailSegs.forEach((seg, i) => {
        const sway = (sleeping ? 0.05 : 0.22) * Math.sin(swayPhase - i * 0.7);
        // Lying, the base lowers the tail to lie flat behind; once it does, each later segment's local z is
        // the world's up, so turning about z curls the tail round the body's near side.
        const up = TAIL_REST[i] + lift * (i === 0 ? 0.45 : i === 3 ? 0.3 : 0);
        const down = i === 0 ? -1.85 : 0; // just past flat, so the wrapped tail settles on the ground
        seg.outer.rotation.x = up + (down - up) * lying;
        if (i === 0) seg.outer.rotation.y = -lying * TAIL_WRAP[0];
        seg.outer.rotation.z = sway - (i === 0 ? 0 : lying * TAIL_WRAP[i]);
      });

      // Asleep she sits as a loaf rather than lying flat like the collie: legs tucked away, head held up
      // and only nodding a little, and the tail wrapped round her side.
      const r = head.outer.rotation;
      r.x = r.x * (1 - 0.8 * lying) + 0.05 * lying;
    },
  };
}

/* ---------- girl ---------- */

// A chibi after a Stardew-style portrait: long wavy brown hair parted in the middle, an oversized grey
// sweater, pink gingham shorts and white slides. She smiles and waves when hovered, kneels to doze,
// now and then nibbles a cucumber held in both hands, and feeds the collie from a bag of kibble.
export function buildGirl() {
  const palette = {
    skin: "#ffdcc2",
    hair: "#5e3624",
    hairShine: "#8f5e40",
    hairDark: "#47281b",
    eye: "#3b2219",
    eyeLight: "#80503a",
    lash: "#24140e",
    glint: "#ffffff",
    blush: "#ffa0a6",
    mouth: "#d0606c",
    mouthDark: "#7e2c38",
    sweater: "#bdb6ac",
    rib: "#a69f95",
    check: "#e0738f",
    checkMid: "#f2b0c0",
    checkLight: "#fdf0f2",
    strap: "#ffffff",
    sole: "#b07a52",
    cucumber: "#4f8c35",
    cucumberLight: "#7cb257",
    cucumberCut: "#d9ebb2",
    bag: "#d9b27c",
    bagFold: "#c49a62",
    bone: "#fff8ec",
    cap: "#b9a2e8",
    capRow: "#a68cd9",
    ...CAP_COLORS,
  };
  // Pink gingham: stripes two voxels wide each way, deepest where they cross.
  const gingham = (x, y, z) => {
    const a = Math.floor((x + z) / 2) & 1;
    const b = Math.floor(y / 2) & 1;
    return a && b ? "check" : a || b ? "checkMid" : "checkLight";
  };
  // Hair: soft brown with a few darker waves, and a broken band of shine round the crown.
  const hairColor = (x, y, z) => {
    if (y >= 39 && y <= 40 && z > -3 && (x + y) % 3 !== 0) return "hairShine";
    return Math.sin(x * 1.2 + 1.5 * Math.sin(y * 0.5)) > 0.85 ? "hairDark" : "hair";
  };

  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Body: a short, soft sweater with a ribbed hem and collar; the head is about half her height.
  const bodyPart = part();
  for (let y = 9; y <= 19; y++) {
    const rx = y <= 17 ? 5 : y === 18 ? 4.5 : 4; // round shoulders
    ellipsoid(bodyPart, [0, y, -0.5], [rx, 0.5, 3.5], y <= 10 ? "rib" : "sweater", [], 3);
  }
  ellipsoid(bodyPart, [0, 20, -0.5], [3, 0.5, 2.5], "rib");
  pose.add(bodyPart.mesh(palette));

  // Legs: short and bare, in loose shorts and white slides. They swing from the hips; to sit, the
  // thighs turn forward and the shins fold back under them (the knee hinges at the back of the leg).
  const legs = [-1, 1].map((side) => {
    const x0 = side > 0 ? 1 : -2;
    const thigh = part();
    box(thigh, [x0, x0 + 1], [5, 8], [-1, 0], "skin");
    box(thigh, side > 0 ? [1, 4] : [-4, -1], [6, 8], [-2, 1], gingham);
    const hip = pivotGroup(pose, [x0 + 0.5, 8.5, -0.5]);
    hip.inner.add(thigh.mesh(palette));
    const shin = part();
    box(shin, [x0, x0 + 1], [1, 4], [-1, 0], "skin");
    box(shin, [x0, x0 + 1], [0, 0], [-1, 2], "sole");
    box(shin, [x0, x0 + 1], [1, 1], [0, 1], "strap");
    box(shin, [x0, x0 + 1], [1, 1], [2, 2], "skin"); // toes
    const knee = pivotGroup(hip.inner, [x0 + 0.5, 4.5, -1.5]);
    knee.inner.add(shin.mesh(palette));
    return { hip, knee };
  });

  // Arms in baggy sleeves that half cover the hands: the upper arm pivots at the shoulder, the
  // forearm at the elbow.
  const arms = [-1, 1].map((side) => {
    const x0 = side > 0 ? 5 : -7;
    const upper = part();
    box(upper, [x0, x0 + 2], [14, 19], [-2, 1], "sweater");
    const shoulder = pivotGroup(pose, [side * 6, 18.5, -0.5]);
    shoulder.outer.rotation.order = "YXZ"; // turning about y swings a raised arm in towards the middle
    shoulder.inner.add(upper.mesh(palette));
    const fore = part();
    box(fore, [x0, x0 + 2], [10, 13], [-2, 1], (x, y) => (y <= 10 ? "rib" : "sweater"));
    box(fore, side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2], [8, 9], [-1, 0], "skin");
    const elbow = pivotGroup(shoulder.inner, [side * 6, 13.5, -0.5]);
    elbow.inner.add(fore.mesh(palette));
    return { shoulder, elbow };
  });

  // Head: big and round with chubby cheeks, framed by hair parted in the middle that sweeps away from
  // the forehead and falls past the cheeks.
  const headPart = part();
  const inFace = (x, y, z) => z >= 1 && Math.abs(x) <= 7 && y <= 38 - 0.11 * x * x;
  const inHair = (x, y, z) => (x / 10.5) ** 2 + ((y - 33) / 10.5) ** 2 + ((z + 0.5) / 9.5) ** 2 <= 1;
  ellipsoid(headPart, [0, 33, -0.5], [10.5, 10.5, 9.5], hairColor, [bodyPart, { has: inFace }]);
  // The face is squarer than the hair, so keep it from poking out through the hair.
  const outside = { has: (x, y, z) => !inFace(x, y, z) && !inHair(x, y, z) };
  ellipsoid(headPart, [0, 32, 0.5], [9.5, 9.5, 8.5], "skin", [bodyPart, headPart, outside], 3);
  ellipsoid(headPart, [0, 27.5, 1.5], [9, 4.5, 7.5], "skin", [bodyPart, headPart, outside]); // cheeks
  for (let y = 39; y <= 43; y++) headPart.front(0, y)[3] = "hairDark"; // the parting
  for (const side of [-1, 1])
    for (let y = 19; y <= 36; y++) {
      const out = 10 + Math.round(Math.sin(y * 0.8)); // wavy
      for (let x = 8; x <= out; x++)
        for (let z = -3; z <= 5; z++) {
          if (y < 19 + ((x + z) & 1)) continue; // ragged ends
          if (!inFace(side * x, y, z)) headPart.add(side * x, y, z, hairColor(side * x, y, z)); // over the sides of the cheeks
        }
    }
  const headPivotY = 21;
  const head = pivotGroup(pose, [0, headPivotY, 0]);
  head.inner.add(headPart.mesh(palette));

  // The long hair down her back hangs from the back of the head, so it can stay hanging when she
  // nods or turns her head, and sway as she walks.
  const backPart = part();
  for (let y = 12; y <= 30; y++) {
    const half = Math.round(10.5 + 0.8 * Math.sin(y * 0.7) + (30 - y) * 0.05);
    for (let x = -half; x <= half; x++) {
      if (y < 13 + 1.5 * (1 + Math.sin(x * 1.1))) continue; // wavy ends
      const front = y >= 21 ? -4 : -5; // behind the head, then behind the sweater
      for (let z = -10 + Math.round(Math.abs(x) * 0.25); z <= front; z++) if (!headPart.has(x, y, z)) backPart.add(x, y, z, hairColor(x, y, z));
    }
  }
  const backHair = pivotGroup(head.inner, [0, 32, -6]);
  backHair.inner.add(backPart.mesh(palette));

  // Face: wide-set dark eyes with a sparkle and a flick of lashes, rosy cheeks and a tiny smile.
  const surface = surfaceOf(headPart);
  const facePart = part();
  const GLINTS = new Set(["1,1", "2,1", "1,2", "2,3"]);
  const eyeColor = (i, j) => (GLINTS.has(`${i},${j}`) ? "glint" : j === 4 ? "eyeLight" : "eye");
  const eyeCells = paintEyes(facePart, surface, [-7, 4], 32, eyeColor, [".XX.", "XXXX", "XXXX", "XXXX", ".XX."]);
  const lashCells = [surface(-7, 32, 0.4), surface(7, 32, 0.4)]; // the outer corners
  lashCells.forEach((p) => facePart.add(...p, "lash"));
  for (const x of [-7, -6, 6, 7]) facePart.add(...surface(x, 27, 0.4), "blush");
  head.inner.add(facePart.mesh(palette));

  // Mouth: a tiny closed smile, or open to laugh and munch.
  const smilePart = part();
  [
    [-2, 26],
    [-1, 25],
    [0, 25],
    [1, 25],
    [2, 26],
  ].forEach(([x, y]) => smilePart.add(...surface(x, y, 0.4), "mouth"));
  const smile = smilePart.mesh(palette);
  const openPart = part();
  for (let x = -1; x <= 1; x++) {
    openPart.add(...surface(x, 26, 0.4), "mouthDark");
    openPart.add(...surface(x, 25, 0.4), "mouth");
  }
  const open = openPart.mesh(palette);
  open.visible = false;
  head.inner.add(smile, open);

  // Lids cover the eyes and lashes with skin and draw them shut: curved down to blink or sleep (︶),
  // or up in a happy smile (^).
  const lids = (arc, lift) => {
    const p = part();
    eyeCells.forEach(({ p: [x, y, z], row, col }) => p.add(x, y, z + lift, arc.has(`${col},${row}`) ? "lash" : "skin"));
    lashCells.forEach(([x, y, z]) => p.add(x, y, z + lift, "skin"));
    const mesh = p.mesh(palette);
    mesh.visible = false;
    head.inner.add(mesh);
    return mesh;
  };
  const eyelids = lids(new Set(["0,2", "1,3", "2,3", "3,2"]), 0.1);
  const happyEyes = lids(new Set(["0,3", "1,2", "2,2", "3,3"]), 0.15);

  const hat = nightcap(headPart, { y0: 41, z0: -0.5, radius: 9.5, height: 11 }).mesh(palette);
  head.inner.add(hat);

  // A cucumber held across the fingertips of both hands, shown while she nibbles it. It rides on
  // her right hand (on the -x side, as she faces +z); the left one meets it at the other end.
  const cucumberPart = part();
  for (let x = -8; x <= 8; x++)
    for (let y = 6; y <= 7; y++)
      for (let z = -1; z <= 0; z++) cucumberPart.add(x, y, z, x === 8 ? "cucumberCut" : hash(x, y, z) < 0.3 ? "cucumberLight" : "cucumber");
  const cucumber = cucumberPart.mesh(palette);
  cucumber.visible = false;
  arms[0].elbow.inner.add(cucumber);

  // A paper bag of kibble with a bone on it, held out in both hands the same way.
  const bagPart = part();
  box(bagPart, [-4, 4], [3, 7], [-1, 1], (x, y) => (y === 7 ? "bagFold" : "bag"));
  [
    [-2, 6],
    [2, 6],
    [-2, 5],
    [-1, 5],
    [0, 5],
    [1, 5],
    [2, 5],
    [-2, 4],
    [2, 4],
  ].forEach(([x, y]) => bagPart.add(x, y, 2, "bone"));
  const bag = bagPart.mesh(palette);
  bag.visible = false;
  arms[0].elbow.inner.add(bag);

  // Arm poses: [shoulder, elbow] turns about x (forward is negative). Nibbling, she nods a little and
  // holds the cucumber up just under her lips; kneeling, her hands rest on her thighs; feeding, she
  // holds the bag out towards the bowl, then claps.
  const EAT = [-1.47, -0.68];
  const EAT_NOD = 0.25;
  const SIT = [-0.35, -0.45];
  const OFFER = [-1.2, -0.2];
  const CLAP = [-1.1, -0.5];
  const POUR_TIME = 1.6; // s shaking the kibble out once the collie has come
  let eat = 0;
  let offer = 0;
  let clap = 0;
  let wave = 0;
  let wavePhase = 0;
  let munchPhase = 0;
  let clapPhase = 0;
  const lieDrop = 4; // kneeling
  return {
    label: "Voxel girl in a grey sweater, click to say hi",
    hint: "say hi",
    group,
    pose,
    head,
    headPivotY,
    ears: [],
    eyelids,
    hat,
    lieDrop,
    headDrop: 0,
    headAt: [32, 9],
    hit: [22, 12, 23],
    shadow: [8, 5],
    speed: 28,
    gaitHz: 2.2,
    lane: 14,
    trickTime: 5,
    feeds: true,
    animate(dt, { happy, walking, lying, sleeping, stride, gait, state, elapsed, progress }) {
      const pouring = state === "serve" && elapsed < POUR_TIME;
      const cheering = state === "serve" && !pouring;
      eat = approach(eat, state === "trick" && progress < 0.85 ? 1 : 0, 6, dt);
      offer = approach(offer, state === "feed" || pouring ? 1 : 0, 6, dt);
      clap = approach(clap, cheering && elapsed < POUR_TIME + 2 ? 1 : 0, 6, dt);
      wave = approach(wave, happy && !sleeping ? 1 : 0, 8, dt);
      wavePhase += Math.PI * 2 * 2.2 * dt;
      munchPhase += Math.PI * 2 * 3 * dt;
      clapPhase += Math.PI * 2 * 2.5 * dt;
      const munch = eat > 0.9 ? Math.sin(munchPhase) : 0;
      const shake = pouring ? Math.sin(elapsed * 16) : 0;

      // Legs swing in opposite phase, the knee bending as each one swings back; to sit, she kneels.
      const upright = 1 - lying;
      legs.forEach(({ hip, knee }, i) => {
        const swing = Math.sin(gait + (i ? Math.PI : 0));
        hip.outer.rotation.x = upright * 0.42 * stride * swing - (Math.PI / 2) * lying;
        knee.outer.rotation.x = upright * 0.5 * stride * Math.max(0, swing) + Math.PI * lying;
      });

      // Arms swing against the legs; both hold the cucumber or the bag, or clap, and the left one (nearer
      // the camera) lets go to wave.
      arms.forEach(({ shoulder, elbow }, i) => {
        const keep = i ? 1 - wave : 1;
        const [e, o, c] = [eat * keep, offer * keep, clap * keep];
        const posed = Math.min(1, e + o + c + (i ? wave : 0));
        const free = upright * (1 - posed);
        const swing = 0.42 * stride * Math.sin(gait + (i ? 0 : Math.PI));
        shoulder.outer.rotation.x = free * swing + lying * (1 - posed) * SIT[0] + e * EAT[0] + o * OFFER[0] + c * CLAP[0];
        elbow.outer.rotation.x = -0.25 * stride * free + lying * (1 - posed) * SIT[1] + e * EAT[1] + o * (OFFER[1] + 0.15 * shake) + c * CLAP[1];
        shoulder.outer.rotation.z = 0.08 * munch * e + (i ? 1.2 * wave : 0); // nibbling along it
        shoulder.outer.rotation.y = (i ? -1 : 1) * c * (0.42 + 0.14 * Math.sin(clapPhase)); // the hands meet
        if (i) elbow.outer.rotation.z = wave * (1.1 + 0.45 * Math.sin(wavePhase));
      });
      cucumber.visible = eat > 0.05;
      bag.visible = offer > 0.05;
      happyEyes.visible = (happy && !sleeping) || eat > 0.9 || cheering;
      const laughing = (happy && !sleeping) || munch > 0.3 || cheering;
      open.visible = laughing;
      smile.visible = !laughing;

      // Asleep, her head only droops a little, unlike a pet's, which rests its chin on the ground;
      // nibbling, she looks down at the cucumber.
      const r = head.outer.rotation;
      r.x = r.x * (1 - 0.6 * lying) + EAT_NOD * eat;

      // The long hair keeps hanging when the head nods, half follows it when it turns, and swings back
      // as she walks.
      backHair.outer.rotation.set(-r.x + 0.12 * stride, -0.5 * r.y, -0.6 * r.z + 0.05 * stride * Math.sin(gait), "YXZ");
    },
  };
}
