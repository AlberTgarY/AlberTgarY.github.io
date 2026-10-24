/*******************************************************************************
 * The vegetables in the playground's garden (house.js), each at three stages:
 * just planted, growing, and ready to pick. No two plants are quite alike: a
 * builder is given the plant's own random numbers (`seeded`), so one tomato
 * vine is a little taller than the next, its fruit bigger or redder, and when
 * a bed is sown again its plants come up different.
 *
 * A builder fills a part (voxels.js) with one plant at stage `s`, standing on
 * y = 0 round (0, 0), its front (where the fruit hangs) towards +z.
 ******************************************************************************/

import { ellipsoid, box, hash } from "../models/voxels.js";

export const VEG_COLORS = {
  tomatoDeep: "#c8321f",
  tomatoOrange: "#f0663a",
  eggplantDeep: "#45205a",
  cabbageLight: "#bfe3a0",
};

// A fixed sequence of random numbers in [0, 1) from a seed (mulberry32): the same plant every time it is
// drawn, at every stage.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r, lo, hi) => lo + (hi - lo) * r();
const leafy = (light, dark) => (x, y, z) => (hash(x, y, z) < 0.3 ? dark : light);

// Up to `n` points from `make()`, none closer than `gap` to another.
function spread(n, gap, make) {
  const out = [];
  for (let k = 0; k < n * 6 && out.length < n; k++) {
    const p = make();
    if (out.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= gap)) out.push(p);
  }
  return out;
}

// Just planted: a stem with a pair of leaves, some a little taller.
function sprout(p, leaf, r) {
  const h = r() < 0.5 ? 2 : 3;
  box(p, [0, 0], [0, h], [0, 0], "stem");
  for (const x of [-1, 1]) p.add(x, h + (x > 0 ? 1 : 0) - (r() < 0.3 ? 1 : 0), 0, leaf);
}

export const VEG = {
  // Tomatoes on a vine up a cane: green ones among yellow flowers, then ripe ones, red or deep red or still
  // a little orange (and the odd green one), big and small, a shine on the big ones.
  tomato(p, s, r) {
    if (!s) return sprout(p, "tomLeaf", r);
    const top = Math.round(s === 1 ? between(r, 10, 12) : between(r, 15, 17));
    box(p, [0, 0], [0, top], [-2, -2], "woodLight");
    const side = r() < 0.5 ? 1 : -1;
    for (let y = 3; y <= top - 2; y += 3)
      ellipsoid(p, [(y % 2 ? 1.5 : -1.5) * side + between(r, -0.4, 0.4), y, 0], [between(r, 2.2, 2.9), 1.8, 2.2], leafy("tomLeaf", "plant"));
    const fruit = spread(s === 1 ? 2 + Math.floor(r() * 2) : 4 + Math.floor(r() * 3), 2.6, () => [
      Math.round(between(r, -3, 3)),
      Math.round(between(r, 5, top - 3)),
      Math.round(between(r, 1, 2.4)),
    ]);
    for (const [x, y, z] of fruit) {
      const size = s === 1 ? between(r, 0.9, 1.2) : between(r, 1.05, 1.6);
      const roll = r();
      const color = s === 1 ? "tomGreen" : roll < 0.55 ? "tomato" : roll < 0.8 ? "tomatoDeep" : roll < 0.93 ? "tomatoOrange" : "tomGreen";
      ellipsoid(p, [x, y, z], [size, size * between(r, 0.85, 1), size], color);
      p.add(x, y + Math.ceil(size), z, "stem");
      if (s === 2 && size > 1.3) p.add(x - 1, y, z + 1, "tomatoShine");
    }
    if (s === 1)
      for (let k = 0; k < 2 + Math.floor(r() * 2); k++) p.add(Math.round(between(r, -2, 2)), Math.round(between(r, 4, top - 2)), 3, "yellow");
  },
  // Eggplants: a leafy bush on purple stems, a lilac flower or two, then glossy fruit hanging under it,
  // long or short, plump or slim, some a deeper purple.
  eggplant(p, s, r) {
    if (!s) return sprout(p, "eggLeaf", r);
    const rad = s === 1 ? between(r, 3.3, 3.9) : between(r, 4.5, 5.1);
    box(p, [0, 0], [0, 3], [0, 0], "eggStem");
    ellipsoid(p, [between(r, -0.4, 0.4), 3 + rad, 0], [rad, rad * between(r, 0.85, 0.95), rad * 0.85], leafy("eggLeaf", "plant"));
    for (const [x, y] of [
      [-2, 3],
      [2, 4],
    ])
      p.add(x, y, 1, "eggStem");
    if (s === 1) {
      for (let k = 0; k < 1 + Math.floor(r() * 2); k++) p.add(Math.round(between(r, -2, 2)), Math.round(3 + rad + between(r, 0, 1.5)), 3, "lilac");
      return;
    }
    const fruit = spread(2 + Math.floor(r() * 3), 2.8, () => [between(r, -3, 3), between(r, 2, 4.5), between(r, 3.6, 4.4)]);
    for (const [x, y, z] of fruit) {
      const long = between(r, 2.1, 3.0);
      ellipsoid(p, [x, y, z], [between(r, 1.1, 1.5), long, between(r, 1.1, 1.4)], r() < 0.3 ? "eggplantDeep" : "eggplant");
      p.add(Math.round(x), Math.round(y + long) + 1, Math.round(z), "eggCap");
      p.add(Math.round(x) - 1, Math.round(y) + 1, Math.round(z) + 1, "eggplantShine");
    }
  },
  // Napa cabbage: a loose rosette, then a tall head, white at the base and frilly green on top, some
  // taller, some leaning a little.
  napa(p, s, r) {
    if (!s) return sprout(p, "napaGreen", r);
    const base = s === 1 ? between(r, 3.2, 3.8) : between(r, 4.6, 5.4);
    ellipsoid(p, [0, 1, 0], [base, 1.2, base * between(r, 0.9, 1.05)], leafy("napaLeaf", "napaGreen"));
    if (s === 1) return ellipsoid(p, [0, 3, 0], [2.4, between(r, 2.2, 2.6), 2.4], leafy("napaGreen", "napaLeaf"));
    const tall = between(r, 5.8, 7);
    const lean = between(r, -0.6, 0.6);
    const white = Math.round(between(r, 5, 7));
    ellipsoid(p, [lean, tall + 0.5, 0], [between(r, 3.1, 3.7), tall, 3.4], (x, y, z) =>
      y <= white ? (hash(x, y, z) < 0.2 ? "napaPale" : "napaWhite") : y <= white + 2 ? "napaPale" : leafy("napaGreen", "napaLeaf")(x, y, z)
    );
  },
  // Cabbage: a rosette of broad outer leaves, then a round firm head in the middle, big or small, darker
  // or paler.
  cabbage(p, s, r) {
    if (!s) return sprout(p, "cabbageLeaf", r);
    const spreadOut = s === 1 ? between(r, 3.7, 4.3) : between(r, 5.1, 5.9);
    ellipsoid(p, [0, 1.5, 0], [spreadOut, 1.5, spreadOut * between(r, 0.9, 1.05)], (x, y, z) =>
      (x === 0 || z === 0) && y === 2 ? "cabbageVein" : "cabbageLeaf"
    );
    if (s < 2) return;
    const head = between(r, 3.3, 4.2);
    const color = r() < 0.4 ? "cabbageLight" : "cabbage";
    const veins = Math.floor(r() * 4);
    ellipsoid(p, [0, 1.6 + head, 0], [head, head * between(r, 0.88, 1), head], (x, y) => ((x + y + veins) % 4 === 0 ? "cabbageVein" : color));
  },
};
