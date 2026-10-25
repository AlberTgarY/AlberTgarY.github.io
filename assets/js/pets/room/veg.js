/*******************************************************************************
 * The vegetables in the playground's garden (house.js), nine kinds, each at
 * three stages: just planted, growing, and ready to pick. No two plants are
 * quite alike: a builder is given the plant's own random numbers (`seeded`),
 * so one tomato vine is a little taller than the next, its fruit bigger or
 * redder, and when a bed is sown again its plants come up different.
 *
 * A kind's `draw(p, s, r, fruit)` fills a part (voxels.js) with one plant at
 * stage `s`, standing on y = 0 round (0, 0), its front (where the fruit hangs)
 * towards +z. What is picked goes into a part of its own, `fruit()` (the plant
 * itself before it is ripe), so that each one can come off the plant, into a
 * hand and the basket, and the rest of the plant stays: the vine, the bush, the
 * outer leaves. A carrot's root is drawn under the soil, out of sight till it
 * is pulled.
 *
 * Each kind also says how it is harvested (`how`: "pick" one by one, "pull"
 * out of the ground with both hands, or "lift" in both arms), whether they
 * kneel to it (`low`), the two colours painted on its marker and seed packet
 * (`sign`), and how some of it lies in the fridge's crisper (`stored`, at most
 * STORED_W wide, from x and standing on y, between z = 3 and 6).
 ******************************************************************************/

import { ellipsoid, box, hash } from "../models/voxels.js";

export const VEG_COLORS = {
  tomLeaf: "#4f9a3a",
  tomGreen: "#a3d15a",
  tomato: "#e0402e",
  tomatoShine: "#ff9a8a",
  tomatoDeep: "#c8321f",
  tomatoOrange: "#f0663a",
  eggLeaf: "#5f9a49",
  eggStem: "#6b3f73",
  eggplant: "#5b2a6e",
  eggplantShine: "#9a62b5",
  eggplantDeep: "#45205a",
  eggCap: "#4f8a3e",
  napaGreen: "#8cc265",
  napaLeaf: "#6fae52",
  napaWhite: "#eef3d9",
  napaPale: "#d6e8a8",
  cabbage: "#a8d38a",
  cabbageLight: "#bfe3a0",
  cabbageLeaf: "#6fae52",
  cabbageVein: "#cfe8b4",
  carrot: "#f08a2c",
  carrotDark: "#d4701c",
  carrotTop: "#5fae3a",
  carrotTopDark: "#3f8a2a",
  strawLeaf: "#4f9e3c",
  strawLeafDark: "#3a7d2c",
  strawberry: "#e3364a",
  strawberryDeep: "#c22238",
  strawSeed: "#f7e08a",
  strawUnripe: "#f2f0c8",
  punnet: "#8fc0e8",
  pepperLeaf: "#4a8f38",
  pepperRed: "#e0402e",
  pepperYellow: "#f6c63c",
  pepperOrange: "#f2852c",
  pepperGreen: "#5fae3a",
  pepperStem: "#3f6f2a",
  pepperShine: "#fbe7c4",
  pumpkinLeaf: "#5a9e3e",
  pumpkinLeafLight: "#7dbb55",
  pumpkin: "#f08a24",
  pumpkinDark: "#d06a14",
  pumpkinCream: "#f4ead0",
  pumpkinCreamDark: "#ddd0ae",
  pumpkinStem: "#7a6a3a",
  vegFlower: "#fbfaf2",
  melonLeaf: "#4e9a3a",
  melonVine: "#3d7a2c",
  melonLight: "#9acb68",
  melonDark: "#2f6e2a",
  melonRed: "#ef4f5a",
  melonRind: "#d9efb8",
  melonSeed: "#2a2522",
  wicker: "#c08d58",
  wickerDark: "#9e6f40",
  packet: "#fbf6ea",
};

export const STORED_W = 5; // the widest any kind lies in the crisper

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
// A watermelon lying along x with its middle at height `cy`, depth `cz`: dark and light green stripes running
// from end to end, a little wavy.
export const melonStripes = (cy, cz) => (x, y, z) =>
  Math.floor((Math.atan2(y - cy, z - cz) + 0.35 * Math.sin(x * 1.3) + 4 * Math.PI) / (Math.PI / 5)) % 2 ? "melonLight" : "melonDark";

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

// A little white flower with a yellow eye, facing the front.
const flower = (p, x, y, z) => {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    p.add(x + dx, y + dy, z, "vegFlower");
  p.add(x, y, z, "yellow");
};

export const VEG = {
  // Tomatoes on a vine up a cane: green ones among yellow flowers, then ripe ones, red or deep red or still
  // a little orange, big and small, a shine on the big ones; the odd green one stays on the vine.
  tomato: {
    how: "pick",
    low: false,
    sign: ["tomato", "tomLeaf"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "tomLeaf", r);
      const top = Math.round(s === 1 ? between(r, 10, 12) : between(r, 15, 17));
      box(p, [0, 0], [0, top], [-2, -2], "woodLight");
      const side = r() < 0.5 ? 1 : -1;
      for (let y = 3; y <= top - 2; y += 3)
        ellipsoid(p, [(y % 2 ? 1.5 : -1.5) * side + between(r, -0.4, 0.4), y, 0], [between(r, 2.2, 2.9), 1.8, 2.2], leafy("tomLeaf", "plant"));
      const fruits = spread(s === 1 ? 2 + Math.floor(r() * 2) : 4 + Math.floor(r() * 2), 2.6, () => [
        Math.round(between(r, -3, 3)),
        Math.round(between(r, 5, top - 3)),
        Math.round(between(r, 1, 2.4)),
      ]);
      for (const [x, y, z] of fruits) {
        const size = s === 1 ? between(r, 0.9, 1.2) : between(r, 1.05, 1.6);
        const roll = r();
        const color = s === 1 ? "tomGreen" : roll < 0.55 ? "tomato" : roll < 0.8 ? "tomatoDeep" : roll < 0.93 ? "tomatoOrange" : "tomGreen";
        const q = color === "tomGreen" ? p : fruit();
        ellipsoid(q, [x, y, z], [size, size * between(r, 0.85, 1), size], color);
        q.add(x, y + Math.ceil(size), z, "stem");
        if (s === 2 && size > 1.3) q.add(x - 1, y, z + 1, "tomatoShine");
      }
      if (s === 1)
        for (let k = 0; k < 2 + Math.floor(r() * 2); k++) p.add(Math.round(between(r, -2, 2)), Math.round(between(r, 4, top - 2)), 3, "yellow");
    },
    stored: (p, x, y) => {
      for (const dx of [1, 3.5]) ellipsoid(p, [x + dx, y + 1, 4.5], [1.3, 1.2, 1.3], dx > 2 ? "tomatoDeep" : "tomato");
      p.add(x + 1, y + 2, 4, "tomLeaf");
    },
  },
  // Eggplants: a leafy bush on purple stems, a lilac flower or two, then glossy fruit hanging under it,
  // long or short, plump or slim, some a deeper purple.
  eggplant: {
    how: "pick",
    low: true,
    sign: ["eggplant", "eggCap"],
    draw(p, s, r, fruit) {
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
      const fruits = spread(2 + Math.floor(r() * 3), 2.8, () => [between(r, -3, 3), between(r, 2, 4.5), between(r, 3.6, 4.4)]);
      for (const [x, y, z] of fruits) {
        const q = fruit();
        const long = between(r, 2.1, 3.0);
        ellipsoid(q, [x, y, z], [between(r, 1.1, 1.5), long, between(r, 1.1, 1.4)], r() < 0.3 ? "eggplantDeep" : "eggplant");
        q.add(Math.round(x), Math.round(y + long) + 1, Math.round(z), "eggCap");
        q.add(Math.round(x) - 1, Math.round(y) + 1, Math.round(z) + 1, "eggplantShine");
      }
    },
    stored: (p, x, y) => {
      ellipsoid(p, [x + 2, y + 1, 4.5], [2, 1.2, 1.3], "eggplant");
      p.add(x + 4, y + 1, 4, "eggCap");
      p.add(x + 1, y + 2, 5, "eggplantShine");
    },
  },
  // Napa cabbage: a loose rosette, then a tall head, white at the base and frilly green on top, some
  // taller, some leaning a little. The head is cut; the outer leaves stay.
  napa: {
    how: "lift",
    low: true,
    sign: ["napaWhite", "napaGreen"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "napaGreen", r);
      const base = s === 1 ? between(r, 3.2, 3.8) : between(r, 4.6, 5.4);
      ellipsoid(p, [0, 1, 0], [base, 1.2, base * between(r, 0.9, 1.05)], leafy("napaLeaf", "napaGreen"));
      if (s === 1) return ellipsoid(p, [0, 3, 0], [2.4, between(r, 2.2, 2.6), 2.4], leafy("napaGreen", "napaLeaf"));
      const tall = between(r, 5.8, 7);
      const lean = between(r, -0.6, 0.6);
      const white = Math.round(between(r, 5, 7));
      ellipsoid(fruit(), [lean, tall + 0.5, 0], [between(r, 3.1, 3.7), tall, 3.4], (x, y, z) =>
        y <= white ? (hash(x, y, z) < 0.2 ? "napaPale" : "napaWhite") : y <= white + 2 ? "napaPale" : leafy("napaGreen", "napaLeaf")(x, y, z)
      );
    },
    stored: (p, x, y) =>
      ellipsoid(p, [x + 2, y + 1.5, 4.5], [2.4, 1.5, 1.6], (vx) => (vx < x + 2 ? "napaWhite" : vx < x + 3 ? "napaPale" : "napaGreen")),
  },
  // Cabbage: a rosette of broad outer leaves, then a round firm head in the middle, big or small, darker
  // or paler. The head is cut; the outer leaves stay.
  cabbage: {
    how: "lift",
    low: true,
    sign: ["cabbage", "cabbageLeaf"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "cabbageLeaf", r);
      const spreadOut = s === 1 ? between(r, 3.7, 4.3) : between(r, 5.1, 5.9);
      ellipsoid(p, [0, 1.5, 0], [spreadOut, 1.5, spreadOut * between(r, 0.9, 1.05)], (x, y, z) =>
        (x === 0 || z === 0) && y === 2 ? "cabbageVein" : "cabbageLeaf"
      );
      if (s < 2) return;
      const head = between(r, 3.3, 4.2);
      const color = r() < 0.4 ? "cabbageLight" : "cabbage";
      const veins = Math.floor(r() * 4);
      ellipsoid(fruit(), [0, 1.6 + head, 0], [head, head * between(r, 0.88, 1), head], (x, y) => ((x + y + veins) % 4 === 0 ? "cabbageVein" : color));
    },
    stored: (p, x, y) => ellipsoid(p, [x + 2, y + 1.5, 4.5], [2.2, 1.6, 1.6], (vx, vy, vz) => ((vx + vz) % 3 ? "cabbage" : "cabbageVein")),
  },
  // Carrots, two or three to a clump: feathery tops, then the orange shoulders just showing at the soil,
  // each root long or stubby, straight or a little crooked, under the ground till it is pulled.
  carrot: {
    how: "pull",
    low: true,
    sign: ["carrot", "carrotTop"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "carrotTop", r);
      const roots = spread(2 + Math.floor(r() * 2), 3, () => [Math.round(between(r, -3, 3)), 0, Math.round(between(r, -1.5, 1.5))]);
      for (const [x, , z] of roots) {
        const q = fruit();
        const tall = s === 2 ? between(r, 6, 8) : between(r, 3.5, 4.5);
        // The tops: thin stems fanning out from the crown, leaning further the lower they are, each with
        // leaflets in pairs along it and a feathery tip.
        const stems = s === 2 ? 5 : 3;
        for (let n = 0; n < stems; n++) {
          const ang = (n / stems) * Math.PI * 2 + between(r, -0.4, 0.4);
          const out = between(r, 0.25, 0.5);
          const h = tall * between(r, 0.75, 1);
          for (let y = 1; y <= h; y++) {
            const d = out * y;
            const [sx, sz] = [Math.round(x + Math.cos(ang) * d), Math.round(z + Math.sin(ang) * d * 0.7)];
            q.add(sx, y, sz, "carrotTopDark");
            if (y > 2 && y % 2 === 0) for (const side of [-1, 1]) q.add(sx + side, y, sz, "carrotTop");
          }
          q.add(Math.round(x + Math.cos(ang) * out * (h + 1)), Math.round(h) + 1, Math.round(z + Math.sin(ang) * out * (h + 1) * 0.7), "carrotTop");
        }
        if (s < 2) continue;
        // The root, under the soil but for its shoulders.
        const long = Math.round(between(r, 5, 8));
        const bend = between(r, -0.12, 0.12);
        for (let y = 0; y >= -long; y--) {
          const w = y >= 0 ? 1 : 1.2 * (1 + y / (long + 1)) + 0.3;
          ellipsoid(q, [x + bend * y, y, z], [w, 0.5, w], (vx, vy) => (vy % 3 === 0 ? "carrotDark" : "carrot"));
        }
      }
    },
    stored: (p, x, y) => {
      for (const dx of [0, 2, 4]) {
        box(p, [x + dx, x + dx], [y, y], [3, 6], "carrot");
        p.add(x + dx, y + 1, 3, "carrotTop");
      }
    },
  },
  // Strawberries: a low rosette of leaves in threes and white flowers, then berries hanging over its edge,
  // big and small, red or deep red with yellow seeds; one or two still white stay to ripen.
  strawberry: {
    how: "pick",
    low: true,
    fruit: true, // washed and eaten together at the table, not put in the fridge
    taste: true, // one goes in the mouth, not the basket
    sign: ["strawberry", "strawLeaf"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "strawLeaf", r);
      const rad = s === 1 ? between(r, 2.4, 2.9) : between(r, 3.3, 3.9);
      const leaves = 5 + Math.floor(r() * 3);
      box(p, [0, 0], [0, 1], [0, 0], "strawLeafDark");
      for (let k = 0; k < leaves; k++) {
        const ang = (k / leaves) * Math.PI * 2 + between(r, -0.3, 0.3);
        const [lx, lz] = [Math.cos(ang) * rad * 0.7, Math.sin(ang) * rad * 0.7];
        ellipsoid(p, [lx, between(r, 1.6, 2.6), lz], [1.6, 0.7, 1.6], leafy("strawLeaf", "strawLeafDark"));
      }
      if (s === 1) {
        for (let k = 0; k < 2 + Math.floor(r() * 2); k++) flower(p, Math.round(between(r, -2, 2)), 3, Math.round(between(r, 1, 3)));
        return;
      }
      // Each berry a little cone, the point down, its green cap on top.
      const berries = spread(3 + Math.floor(r() * 3), 2.6, () => {
        const ang = between(r, 0.15, Math.PI - 0.15); // towards the front
        return [Math.round(Math.cos(ang) * (rad + 0.4)), Math.round(between(r, 0, 1)), Math.round(Math.sin(ang) * (rad + 0.4))];
      });
      berries.forEach(([x, y, z], k) => {
        const unripe = k === berries.length - 1 && r() < 0.6;
        const q = unripe ? p : fruit();
        const big = r() < 0.4;
        const red = unripe ? "strawUnripe" : r() < 0.3 ? "strawberryDeep" : "strawberry";
        const seed = (vx, vy, vz) => (!unripe && (vx + vy + vz) % 3 === 0 && hash(vx, vy, vz) < 0.5 ? "strawSeed" : red);
        box(q, [x, x + (big ? 1 : 0)], [y + 1, y + 1], [z, z + (big ? 1 : 0)], seed);
        q.add(x, y, z, red);
        if (big) q.add(x + 1, y, z + 1, red);
        q.add(x, y + 2, z, "strawLeaf");
      });
    },
    stored: (p, x, y) => {
      box(p, [x, x + 4], [y, y + 1], [3, 6], (vx, vy) => (vy === y + 1 && (vx + y) % 2 ? "white" : "punnet"));
      for (const [dx, dz] of [
        [1, 4],
        [3, 4],
        [2, 5],
        [1, 6],
        [3, 6],
      ])
        p.add(x + dx, y + 2, dz, (dx + dz) % 3 ? "strawberry" : "strawberryDeep");
    },
  },
  // Bell peppers: a bushy plant with white flowers and a small green pepper or two, then blocky peppers
  // hanging at the front, red, yellow, orange or still green, each a little different in size.
  pepper: {
    how: "pick",
    low: true,
    sign: ["pepperRed", "pepperYellow"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "pepperLeaf", r);
      const rad = s === 1 ? between(r, 2.8, 3.3) : between(r, 3.7, 4.3);
      box(p, [0, 0], [0, 3], [0, 0], "pepperStem");
      ellipsoid(p, [between(r, -0.4, 0.4), 3 + rad, 0], [rad, rad * 0.95, rad * 0.8], leafy("pepperLeaf", "plant"));
      if (s === 1) {
        for (let k = 0; k < 2; k++) flower(p, Math.round(between(r, -2, 2)), Math.round(3 + rad + between(r, -1, 1)), 3);
        ellipsoid(p, [between(r, -1, 1), 3, 2.5], [0.8, 1.1, 0.8], "pepperGreen");
        return;
      }
      const colors = ["pepperRed", "pepperRed", "pepperYellow", "pepperOrange", "pepperGreen"];
      const fruits = spread(2 + Math.floor(r() * 3), 3, () => [between(r, -2.6, 2.6), between(r, 2.6, 4.6), between(r, 3, 3.8)]);
      for (const [x, y, z] of fruits) {
        const q = fruit();
        const w = between(r, 1.05, 1.35);
        const color = colors[Math.floor(r() * colors.length)];
        ellipsoid(q, [x, y, z], [w, w * between(r, 1.1, 1.35), w], color, [], 2.4);
        const [cx, cz] = [Math.round(x), Math.round(z)];
        const top = Math.round(y + w * 1.2);
        q.add(cx, top + 1, cz, "pepperStem");
        q.add(cx - 1, Math.round(y), cz + 1, "pepperShine");
      }
    },
    stored: (p, x, y) => {
      for (const [dx, c] of [
        [0, "pepperRed"],
        [3, "pepperYellow"],
      ]) {
        box(p, [x + dx, x + dx + 1], [y, y + 1], [4, 5], c);
        p.add(x + dx, y + 2, 4, "pepperStem");
      }
    },
  },
  // Pumpkins: a vine of big leaves with a curly tendril and a yellow flower, then one round ribbed pumpkin
  // at the front, big or small, orange or deep orange, now and then a pale cream one. Lifted in both arms.
  pumpkin: {
    how: "lift",
    low: true,
    heavy: true,
    sign: ["pumpkin", "pumpkinLeaf"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "pumpkinLeaf", r);
      const reach = s === 1 ? 2.6 : 3.6;
      const leaves = s === 1 ? 3 : 4 + Math.floor(r() * 2);
      for (let k = 0; k < leaves; k++) {
        const ang = Math.PI + (k / (leaves - 1)) * Math.PI + between(r, -0.25, 0.25); // round the back
        const [lx, lz] = [Math.cos(ang) * reach, Math.sin(ang) * reach * 0.8];
        box(p, [Math.round(lx / 2), Math.round(lx / 2)], [0, 1], [Math.round(lz / 2), Math.round(lz / 2)], "pumpkinLeaf");
        ellipsoid(p, [lx, between(r, 2, 3.2), lz], [2.3, 0.6, 2.1], leafy("pumpkinLeaf", "pumpkinLeafLight"));
      }
      for (let k = 0; k < 4; k++) p.add(Math.round(reach) + (k % 2), 1 + (k >> 1), 1 + (k % 2), "pumpkinLeafLight"); // the tendril
      if (s === 1) {
        flower(p, Math.round(between(r, -1, 1)), 3, 2);
        p.add(0, 3, 2, "pumpkinDark");
        ellipsoid(p, [between(r, -1.5, 1.5), 1, 3], [1, 0.9, 1], "pumpkinLeafLight");
        return;
      }
      const q = fruit();
      const [w, h] = [between(r, 2.6, 3.3), between(r, 2, 2.5)];
      const cream = r() < 0.15;
      const [light, dark] = cream ? ["pumpkinCream", "pumpkinCreamDark"] : r() < 0.4 ? ["pumpkinDark", "pumpkin"] : ["pumpkin", "pumpkinDark"];
      const cx = between(r, -1, 1);
      ellipsoid(q, [cx, h, 3.2], [w, h, w * 0.9], (x, y, z) => (Math.round(Math.atan2(z - 3.2, x - cx) * 2.5) % 2 ? dark : light));
      box(q, [Math.round(cx), Math.round(cx)], [Math.round(2 * h), Math.round(2 * h) + 1], [3, 3], "pumpkinStem");
    },
    stored: (p, x, y) => {
      ellipsoid(p, [x + 2, y + 1.3, 4.5], [2.2, 1.4, 1.6], (vx) => ((vx - x) % 2 ? "pumpkinDark" : "pumpkin"));
      p.add(x + 2, y + 3, 4, "pumpkinStem");
    },
  },
  // Watermelons: a trailing vine of deep-cut leaves with a curly tendril and a yellow flower, then one long
  // round melon lying at the front, striped dark and light green, big or small. Lifted in both arms, and a
  // fruit: washed, cut into slices and eaten together.
  watermelon: {
    how: "lift",
    low: true,
    heavy: true,
    fruit: true,
    sign: ["melonRed", "melonDark"],
    draw(p, s, r, fruit) {
      if (!s) return sprout(p, "melonLeaf", r);
      const reach = s === 1 ? 2.8 : 3.8;
      const leaves = s === 1 ? 3 : 5;
      for (let k = 0; k < leaves; k++) {
        const ang = Math.PI + (k / (leaves - 1)) * Math.PI + between(r, -0.3, 0.3);
        const [lx, lz] = [Math.cos(ang) * reach, Math.sin(ang) * reach * 0.8];
        box(p, [Math.round(lx / 2), Math.round(lx / 2)], [0, 1], [Math.round(lz / 2), Math.round(lz / 2)], "melonVine");
        ellipsoid(p, [lx, between(r, 1.6, 2.6), lz], [1.9, 0.5, 1.7], (x, y, z) => (hash(x, y, z) < 0.25 ? "melonVine" : "melonLeaf"));
      }
      for (let k = 0; k < 4; k++) p.add(-Math.round(reach) - (k % 2), 1 + (k >> 1), 1 + (k % 2), "melonVine"); // the tendril
      if (s === 1) {
        flower(p, Math.round(between(r, -1, 1)), 3, 2);
        p.add(0, 3, 2, "yellow");
        ellipsoid(p, [between(r, -1.5, 1.5), 1, 3], [1.2, 0.9, 0.9], "melonLight");
        return;
      }
      const q = fruit();
      const [w, h] = [between(r, 3.1, 3.8), between(r, 2.1, 2.5)];
      const cx = between(r, -1, 1);
      ellipsoid(q, [cx, h, 3.2], [w, h, w * 0.75], melonStripes(h, 3.2));
      q.add(Math.round(cx - w), Math.round(h), 3, "melonVine"); // the stalk
    },
    stored: (p, x, y) => {
      ellipsoid(p, [x + 2, y + 1.4, 4.5], [2.4, 1.4, 1.5], melonStripes(y + 1.4, 4.5));
    },
  },
};
export const KINDS = Object.keys(VEG);

// The garden basket: wicker, oval, open at the top, its handle arching over; its bottom on y = 0. What is
// in it sits on y = 2, in rows (`fillBasket`).
export function basketPart(p) {
  for (let y = 0; y <= 3; y++)
    ellipsoid(p, [0, y, 0], [4.6 + y * 0.15, 0.5, 3.4 + y * 0.12], (x, yy, z) => ((x + y + z) % 2 ? "wicker" : "wickerDark"), [
      { has: (x, yy, z) => y > 0 && (x / (3.8 + y * 0.15)) ** 2 + (z / (2.6 + y * 0.12)) ** 2 < 1 },
    ]);
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI;
    p.add(Math.round(4.4 * Math.cos(a)), 4 + Math.round(4.2 * Math.sin(a)), 0, "wickerDark");
  }
  return p;
}
// Where the pieces go in the basket: two rows across it, then a second layer on top.
const SLOTS = [-1, 1].flatMap((layer) => [-1.6, 1.6].flatMap((z) => [-2.6, 0, 2.6].map((x) => [x + layer * 0.6, layer > 0 ? 3.6 : 2, z])));
// Fill basket `group` with `pieces` (parts, from the plants), each made into an object by `build(part)`,
// shrunk to fit and laid in the next slot; anything beyond the slots heaps on top of the last.
export function fillBasket(group, pieces, build) {
  empty(group);
  pieces.forEach((piece, k) => {
    const { mid, bottom, size } = extent(piece);
    const m = build(piece);
    const s = Math.min(1, 3.4 / size);
    m.scale.setScalar(s);
    const [x, y, z] = SLOTS[Math.min(k, SLOTS.length - 1)];
    const heap = Math.max(0, k - SLOTS.length + 1) * 0.8;
    m.position.set(x - mid[0] * s, y + heap - bottom * s, z - mid[2] * s);
    group.add(m);
  });
}
// Take everything out of `group`, freeing what was built for it (an instanced mesh shares its cube).
export function empty(group) {
  for (const m of [...group.children]) {
    group.remove(m);
    if (m.isInstancedMesh) m.dispose();
    else m.geometry.dispose();
  }
}
// The middle of a piece, its bottom, and its size (its longest side), in voxels.
export function extent(piece) {
  const list = piece.list();
  const lo = [0, 1, 2].map((i) => Math.min(...list.map((v) => v[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...list.map((v) => v[i])));
  return { mid: lo.map((l, i) => (l + hi[i]) / 2), bottom: lo[1], size: Math.max(...hi.map((h, i) => h - lo[i] + 1)) };
}
