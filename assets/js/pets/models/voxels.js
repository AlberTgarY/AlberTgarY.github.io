/*******************************************************************************
 * Building voxel models for the pets (assets/js/pets/models/*.js): rigid parts
 * filled with shapes, pivots to animate them about, and pieces the models share.
 * Units are voxels: y up, a model faces +z and its feet rest on y = -0.5.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const cube = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial();

// A rigid part: a set of voxels keyed by position, so overlapping shapes merge (later wins).
export function part() {
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
export function ellipsoid(p, [cx, cy, cz], [rx, ry, rz], color, skip = [], power = 2) {
  for (let x = Math.ceil(cx - rx); x <= cx + rx; x++)
    for (let y = Math.ceil(cy - ry); y <= cy + ry; y++)
      for (let z = Math.ceil(cz - rz); z <= cz + rz; z++) {
        if (Math.abs((x - cx) / rx) ** power + Math.abs((y - cy) / ry) ** power + Math.abs((z - cz) / rz) ** power > 1) continue;
        if (skip.some((s) => s.has(x, y, z))) continue;
        p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
      }
}

export function box(p, [x0, x1], [y0, y1], [z0, z1], color, skip = []) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) {
        if (skip.some((s) => s.has(x, y, z))) continue;
        p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
      }
}

// A group whose children rotate about `pivot` in the parent's space.
export function pivotGroup(parent, pivot) {
  const outer = new THREE.Group();
  outer.position.set(...pivot);
  const inner = new THREE.Group();
  inner.position.set(-pivot[0], -pivot[1], -pivot[2]);
  outer.add(inner);
  parent.add(outer);
  return { outer, inner };
}

// Painted details sit a little proud of the frontmost voxel of `headPart`, so they follow its curve.
export const surfaceOf = (headPart) => (x, y, lift) => {
  const v = headPart.front(x, y);
  return [v[0], v[1], v[2] + lift];
};

// A round eye (5 x 5 unless `rows` says otherwise): `color(col, row)` names each cell, row 0 at the
// top. Returns the cell positions.
export const EYE_ROWS = [".XXX.", "XXXXX", "XXXXX", "XXXXX", ".XXX."];
export function paintEyes(eyePart, surface, lefts, top, color, rows = EYE_ROWS) {
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
export function walkLegs(legs, { stride, gait, lying }, fold) {
  legs.forEach((leg, i) => {
    leg.outer.rotation.x = 0.42 * stride * Math.sin(gait + (i % 3 === 0 ? 0 : Math.PI));
    leg.outer.scale.y = 1 - fold * lying;
  });
}

// Exponential ease towards a target, independent of the frame rate.
export const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));

// A fixed per-voxel random number in [0, 1), for speckled fur and hair that never shimmers.
export function hash(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// A food bowl on the ground `z` voxels in front of a pet, shown while it eats. Its three layers of food
// fill as they are poured in, then empty as the pet eats, the heap first. Returns the update.
export function foodBowl(group, palette, z0, radius) {
  const bowlPart = part();
  const foodParts = [part(), part(), part()]; // bottom layer, top layer, heap
  for (let x = -radius; x <= radius; x++)
    for (let z = -radius; z <= radius; z++) {
      const r = Math.hypot(x, z);
      if (r > radius + 0.2) continue;
      bowlPart.add(x, 0, z0 + z, "bowl");
      if (r > radius - 1.4) {
        bowlPart.add(x, 1, z0 + z, "bowl");
        bowlPart.add(x, 2, z0 + z, "bowlRim");
        continue;
      }
      const food = (y) => (hash(x, y, z) < 0.35 ? "foodDark" : "food");
      foodParts[0].add(x, 1, z0 + z, food(1));
      foodParts[1].add(x, 2, z0 + z, food(2));
      if (r < radius - 2.4) foodParts[2].add(x, 3, z0 + z, food(3));
    }
  const food = foodParts.map((p) => p.mesh(palette));
  const bowl = new THREE.Group();
  bowl.add(bowlPart.mesh(palette), ...food);
  bowl.visible = false;
  group.add(bowl);
  return ({ state, elapsed, progress }) => {
    bowl.visible = state === "eat";
    food.forEach((m, i) => (m.visible = elapsed > 0.3 + 0.4 * i && progress < 0.85 - 0.25 * i));
  };
}

// Eating from the bowl: the pet watches it fill, then lowers and stretches its neck and nods into it,
// bobbing as it eats. `chow` eases from 0 (head up) to 1 (head in the bowl); returns its new value.
export function chowPose(head, restZ, chow, { drop, reach, nod }, dt, { state, elapsed, progress }) {
  const eating = state === "eat";
  chow = approach(chow, eating && elapsed > 1.5 && progress < 0.92 ? 1 : 0, 6, dt);
  head.outer.position.y -= drop * chow;
  head.outer.position.z = restZ + reach * chow;
  head.outer.rotation.x += chow * (nod + 0.12 * Math.sin(elapsed * 12)) + (eating ? 0.3 * (1 - chow) : 0);
  return chow;
}

// Knitted nightcap on the head: ribbed cuff, alternating knit rows, white stars and a pompom. Stars are
// pixel bitmaps wrapped onto the cone, rows by height and columns by arc length around its axis.
export const BIG_STAR = ["..X..", "..X..", "XXXXX", ".XXX.", ".X.X."];
export const SMALL_STAR = [".X.", "XXX", "X.X"];
export function nightcap(skip, { y0, z0, radius, height }) {
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

export const CAP_COLORS = { trim: "#f2eadb", trimRib: "#e0d6c3", star: "#fbf8f1" };

// A harness worn for walks on a lead: a band two voxels wide round the body at `z0`, hugging its surface,
// with a gold ring on top where the lead clips on. Returns the mesh (hidden) and the clip point.
export function harness(pose, bodyPart, palette, { cy, z0 }) {
  const p = part();
  let top = cy;
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    let r = 0;
    const at = () => [Math.round(Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)];
    while (bodyPart.has(...at(), z0) || bodyPart.has(...at(), z0 + 1)) r += 0.25;
    const [x, y] = at();
    for (const z of [z0, z0 + 1]) p.add(x, y, z, "harness");
    if (x === 0) top = Math.max(top, y);
  }
  p.add(0, top + 1, z0, "ring");
  p.add(0, top + 1, z0 + 1, "ring");
  const mesh = p.mesh({ ...palette, ring: "#f2c14e" });
  mesh.visible = false;
  const clip = new THREE.Object3D();
  clip.position.set(0, top + 1.5, z0 + 0.5);
  pose.add(mesh, clip);
  return { mesh, clip };
}

export const easeOutBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
export const smoothstep = (a, b, v) => {
  const p = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return p * p * (3 - 2 * p);
};

// A mesh of a few voxels given one by one as [x, y, z, colour].
export function cells(list, palette) {
  const p = part();
  list.forEach(([x, y, z, color]) => p.add(x, y, z, color));
  return p.mesh(palette);
}
