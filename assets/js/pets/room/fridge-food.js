/*******************************************************************************
 * What is in the playground's fridge (house.js): each time a door opens, its
 * shelves are stocked afresh from what they might hold, so it is never quite
 * the same twice; the vegetables brought in from the garden (veg.js) stay in
 * the crisper till they are cooked. On the shelves and in the freezer, every
 * food is drawn in half voxels (for the detail) into a part of its own; in the
 * crisper, in whole voxels like the garden's, its left end at x and its bottom
 * at y, standing between z = 3 and 6.
 ******************************************************************************/

import { box, ellipsoid, hash } from "../models/voxels.js";
import { VEG, STORED_W } from "./veg.js";

// The colours of the food, beside the ones it shares with the props (girl-props.js) and the house.
export const FOOD_COLORS = {
  frost: "#e6f6fb",
  lemon: "#f7e05a",
  cheese: "#f7d46b",
  cheeseHole: "#e0b54a",
  butter: "#fbe58a",
  rice: "#fbfbf6",
  nori: "#1f2a24",
  canRed: "#d9334a",
  canGreen: "#5fae4a",
  canTop: "#c3c9cf",
  pepperRed: "#e0402e",
  pepperYellow: "#f6c63c",
  broccoli: "#4f9a3a",
  broccoliLight: "#7cc05a",
  peas: "#5fae4a",
  peasLight: "#a3d15a",
  pizzaRed: "#d9473a",
  bagBlue: "#a9c7e8",
  dumpling: "#f7ecd6",
  fishBox: "#5f8fd6",
  label: "#fbfaf6",
  orangeSlice: "#f59a2a",
  jamGleam: "#f7c6cf",
  berryDeep: "#a8243a",
  eggTrayDark: "#b9a98c",
  eggLight: "#fff8ee",
  cheeseRind: "#e6b13f",
  butterShade: "#efd36e",
  water: "#cfe9f6",
  waterRidge: "#b3dcef",
  canPull: "#8d949b",
  icing: "#fdf8f2",
  melonFlesh: "#ef4f5c",
  grapeLight: "#b58ad8",
  punnet: "#eaf4f7",
  soupBroth: "#d98b3a",
  film: "#eef7fb",
  filmGleam: "#ffffff",
  lemonLight: "#fbef9a",
  lemonFlesh: "#f9e46a",
  lemonPith: "#fdf6cf",
  sesame: "#3a3026",
  lidPink: "#f39ab6",
  lidPinkDark: "#e07e9e",
  lollyGleam: "#ffe3c4",
  peasBag: "#3f8a3a",
  ice: "#eef8fc",
  pizzaBox: "#f4efe4",
  crust: "#e3ad5f",
  pepperoni: "#a8302a",
  fishFinger: "#f0a23a",
  yakult: "#f4f1ea",
  yakultRed: "#d8303a",
  tofu: "#fbf8ef",
  tofuWater: "#dcecf2",
  ham: "#f2a8a8",
  hamEdge: "#e38a8f",
  kimchi: "#d4472e",
  kimchiPale: "#f0b48a",
  sausage: "#c46a3a",
  sausageEnd: "#a8552c",
  mochiTray: "#f2e6d0",
  mochiPink: "#f6bfd0",
  mochiWhite: "#fbf8f3",
  mochiGreen: "#bfe0a6",
  mochiYellow: "#f7e2a0",
  blueberry: "#3d4f8f",
  blueberryDust: "#7e8fbf",
  ketchup: "#d62d22",
  soyMilk: "#efe3c6",
  soyGreen: "#4f9a4a",
  soyBean: "#e4c56e",
  tea: "#c98a3a",
  teaLight: "#e0a95a",
  vanillaTub: "#f3df9e",
  chocTub: "#7a4a2e",
  prawn: "#f49a7a",
};

/* ---------- the fridge ---------- */

// The food on the shelves is drawn in small voxels, so each thing can have its own little details:
// house/kitchen.js shows them FOOD_SCALE of a voxel across and high (a little over half, for a little more
// size) and half a voxel deep, lifted by FOOD_LIFT in the fridge and the freezer so that they stand on the
// shelves. In these small voxels, a food stands between z = 6 and 13 (13 its front, towards the room), its
// left end at x and its bottom at y.
export const FOOD_SCALE = 0.6;
export const FOOD_LIFT = [-2.2, -8.6];
const Z0 = 6;
const Z1 = 13;
const ZM = (Z0 + Z1) / 2;
// Something round standing upright: radius r(dy) at each height dy from 0 to h - 1 about (cx, cz),
// coloured c(dx, dy, dz, r) relative to its axis (dz > r - 1 is the front).
const round = (p, cx, cz, y, h, r, c) => {
  for (let dy = 0; dy < h; dy++) {
    const rr = typeof r === "function" ? r(dy) : r;
    ellipsoid(p, [cx, y + dy, cz], [rr, 0.5, rr], (x, vy, z) => c(x - cx, dy, z - cz, rr));
  }
};

// A carton with a gable top and a cap at the corner: milk (a blue band and a blue drop on the front) or
// orange juice (an orange slice on a white band).
const carton = (body, band, cap, mark) => ({
  w: 6,
  h: 10,
  draw(p, x, y) {
    box(p, [x, x + 5], [y, y + 7], [7, 12], (vx, vy, vz) => {
      const front = vz === 12;
      if (vy === y + 2 || vy === y + 3) return band;
      if (front && vy >= y + 4 && vy <= y + 6 && vx >= x + 2 && vx <= x + 3) return vy === y + 6 && vx === x + 3 ? body : mark;
      return body;
    });
    box(p, [x, x + 5], [y + 8, y + 8], [8, 11], body); // the gable
    box(p, [x, x + 5], [y + 9, y + 9], [9, 10], body);
    p.add(x + 4, y + 9, 11, cap); // the cap
    p.add(x + 4, y + 10, 11, cap);
  },
});
const ON_SHELF = [
  carton("milk", "milkBlue", "milkBlue", "milkBlue"),
  carton("juice", "label", "leaf", "orangeSlice"),
  // A jar of strawberry jam, the fruit showing through the glass, a red and white gingham lid and a label.
  {
    w: 6,
    h: 8,
    draw(p, x, y) {
      round(p, x + 2.5, ZM, y, 6, 2.6, (dx, dy, dz, r) => {
        if (dz > r - 1 && dy >= 2 && dy <= 3 && Math.abs(dx) <= 1.5) return dy === 3 && Math.abs(dx) < 1 ? "berry" : "label";
        if (dx < -1.5 && dz > 0) return "jamGleam";
        return hash(dx, dy, dz) < 0.3 ? "berryDeep" : "berry";
      });
      round(p, x + 2.5, ZM, y + 6, 2, 2.8, (dx, dy, dz) => ((Math.floor(dx + 10) + Math.floor(dz + 10) + dy) % 2 ? "label" : "berry"));
    },
  },
  // A tray of eggs, two rows of four sitting in the cups of a cardboard tray.
  {
    w: 16,
    h: 5,
    draw(p, x, y) {
      box(p, [x, x + 15], [y, y + 1], [6, 13], (vx, vy, vz) => (vy === y + 1 && (vx - x) % 4 === 0 ? "eggTrayDark" : "eggTray"));
      for (let k = 0; k < 4; k++)
        for (const ez of [8, 11]) {
          const ex = x + 2 + k * 4;
          ellipsoid(p, [ex, y + 2.5, ez], [1.5, 1.8, 1.5], (vx, vy, vz) => (vy >= y + 3 && vx <= ex && vz >= ez ? "eggLight" : "egg"));
        }
    },
  },
  // Two pots of yoghurt, strawberry and plain, narrower at the foot, with a fruit on a band round them and
  // foil lids.
  {
    w: 10,
    h: 6,
    draw(p, x, y) {
      for (const [dx, c] of [
        [2, "cake"],
        [7.5, "cream"],
      ]) {
        round(
          p,
          x + dx,
          ZM,
          y,
          5,
          (dy) => 1.7 + dy * 0.2,
          (vx, dy, vz, r) => (dy === 2 ? (vz > r - 1 && Math.abs(vx) < 0.6 ? "berry" : "label") : c)
        );
        round(p, x + dx, ZM, y + 5, 1, 2.6, () => "canTop");
      }
    },
  },
  // A wedge of cheese, its rind along the back and the top, round holes in its cut face.
  {
    w: 10,
    h: 6,
    draw(p, x, y) {
      for (let dy = 0; dy < 6; dy++)
        box(p, [x, x + 9 - dy * 1.5], [y + dy, y + dy], [7, 12], (vx, vy, vz) => {
          if (vz === 7 || vy === y + 5) return "cheeseRind";
          const hole = [
            [x + 2, y + 1],
            [x + 5, y + 2],
            [x + 3, y + 3],
            [x + 1, y + 4],
          ].some(([hx, hy]) => Math.abs(vx - hx) + Math.abs(vy - hy) <= 0.5);
          return vz === 12 && hole ? "cheeseHole" : "cheese";
        });
    },
  },
  // A block of butter on a dish with a blue rim, a corner cut off it and a curl of butter beside.
  {
    w: 10,
    h: 5,
    draw(p, x, y) {
      ellipsoid(p, [x + 4.5, y, ZM], [5, 0.5, 3.5], (vx, vy, vz) =>
        (vx - x - 4.5) ** 2 / 25 + (vz - ZM) ** 2 / 12.25 > 0.6 ? "chinaBlue" : "china"
      );
      box(p, [x + 2, x + 7], [y + 1, y + 3], [8, 11], "butter", [{ has: (vx, vy, vz) => vx >= x + 6 && vy === y + 3 && vz >= 10 }]);
      box(p, [x + 2, x + 7], [y + 1, y + 1], [8, 11], "butterShade");
      p.add(x + 8, y + 1, 11, "butter");
      p.add(x + 8, y + 2, 11, "butterShade");
    },
  },

  // A row of five little Yakult bottles, waisted, with red foil tops.
  {
    w: 11,
    h: 7,
    draw(p, x, y) {
      for (let k = 0; k < 5; k++)
        round(
          p,
          x + 1 + k * 2.2,
          10,
          y,
          7,
          (dy) => (dy === 6 ? 0.9 : dy === 3 ? 0.8 : 1.1),
          (dx, dy) => (dy === 6 ? "yakultRed" : dy === 2 ? "yakultRed" : "yakult")
        );
    },
  },
  // A block of silken tofu in water in its clear tray, under a film with a green label.
  {
    w: 9,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 8], [y, y + 2], [7, 12], (vx, vy, vz) => (vx > x && vx < x + 8 && vz > 7 && vz < 12 && vy < y + 2 ? "tofu" : "tofuWater"));
      box(p, [x, x + 8], [y + 3, y + 3], [7, 12], (vx, vy, vz) => (vz >= 10 && vx >= x + 2 && vx <= x + 6 ? "peasLight" : "film"));
    },
  },
  // A pack of ham, the round pink slices overlapping under clear plastic, a blue label at one end.
  {
    w: 10,
    h: 3,
    draw(p, x, y) {
      box(p, [x, x + 9], [y, y], [7, 12], "film");
      for (const cx of [2.5, 5, 7.5])
        ellipsoid(p, [x + cx, y + 1, 9.5], [2.2, 0.5, 2.2], (vx, vy, vz) => ((vx - x - cx) ** 2 + (vz - 9.5) ** 2 > 3 ? "hamEdge" : "ham"));
      box(p, [x, x + 1], [y + 1, y + 2], [7, 12], "milkBlue");
    },
  },
  // A jar of kimchi: red cabbage pressed in the glass, a white lid.
  {
    w: 7,
    h: 9,
    draw(p, x, y) {
      round(p, x + 3, ZM, y, 7, 3, (dx, dy, dz, r) =>
        dz > r - 1 && dy >= 2 && dy <= 4 && Math.abs(dx) <= 1.5 ? "label" : hash(dx, dy, dz) < 0.35 ? "kimchiPale" : "kimchi"
      );
      round(p, x + 3, ZM, y + 7, 2, 3.2, () => "label");
    },
  },
  // Three sausages on a plate.
  {
    w: 10,
    h: 4,
    draw(p, x, y) {
      ellipsoid(p, [x + 4.5, y, ZM], [5, 0.5, 3.5], "china");
      for (const z of [8, 10, 12]) box(p, [x + 1, x + 8], [y + 1, y + 1], [z, z], (vx) => (vx === x + 1 || vx === x + 8 ? "sausageEnd" : "sausage"));
      box(p, [x + 2, x + 7], [y + 2, y + 2], [9, 9], "sausage");
    },
  },
  // A tray of four daifuku, pink, white, green and yellow, dusted.
  {
    w: 10,
    h: 5,
    draw(p, x, y) {
      box(p, [x, x + 9], [y, y], [7, 12], "mochiTray");
      ["mochiPink", "mochiWhite", "mochiGreen", "mochiYellow"].forEach((c, k) =>
        ellipsoid(p, [x + 2 + (k % 2) * 5, y + 2, 8.5 + Math.floor(k / 2) * 3], [1.8, 1.6, 1.4], (vx, vy) => (vy === y + 3 ? "mochiWhite" : c))
      );
    },
  },
  // A punnet of blueberries.
  {
    w: 8,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 7], [y, y + 2], [7, 12], "punnet", [{ has: (vx, vy, vz) => vx > x && vx < x + 7 && vy > y && vz > 7 && vz < 12 }]);
      for (let bx = x + 1; bx <= x + 6; bx++)
        for (let bz = 8; bz <= 11; bz++) p.add(bx, y + 2 + ((bx + bz) % 2), bz, hash(bx, bz, 2) < 0.3 ? "blueberryDust" : "blueberry");
    },
  },
];
const ON_SHELF_TALL = [
  // A bottle of water: ridged clear plastic, a blue label with a white wave, a neck and a blue cap.
  {
    w: 5,
    h: 18,
    draw(p, x, y) {
      round(
        p,
        x + 2,
        ZM,
        y,
        16,
        (dy) => (dy < 12 ? 2 : dy === 12 ? 1.5 : 1),
        (dx, dy, dz, r) => {
          if (dy >= 5 && dy <= 8) return dz > r - 1 && dy === 7 && Math.abs(dx) <= 1 ? "label" : "milkBlue";
          if (dy % 3 === 0 && dy < 12) return "waterRidge";
          return dx < -0.5 && dz > 0 ? "jamGleam" : "water";
        }
      );
      round(p, x + 2, ZM, y + 16, 2, 1.1, () => "milkBlue");
    },
  },
  // Two cans of fizzy drink, a white swoosh round each, the ring pulls on top.
  {
    w: 9,
    h: 9,
    draw(p, x, y) {
      for (const [dx, c] of [
        [2, "canRed"],
        [6.5, "canGreen"],
      ]) {
        round(
          p,
          x + dx,
          ZM,
          y,
          8,
          (dy) => (dy === 0 || dy === 7 ? 1.6 : 2),
          (vx, dy, vz, r) => (dy === 0 || dy === 7 ? "canTop" : dy === 3 + Math.round(vx * 0.5) || dy === 4 + Math.round(vx * 0.5) ? "label" : c)
        );
        p.add(Math.round(x + dx), y + 8, Math.round(ZM), "canPull");
      }
    },
  },
  // A slice of layer cake on a little plate: sponge and cream in layers, white icing on top with a
  // strawberry on it.
  {
    w: 11,
    h: 12,
    draw(p, x, y) {
      ellipsoid(p, [x + 5, y, ZM], [5.5, 0.5, 3.5], "china");
      for (let dy = 1; dy <= 8; dy++) {
        const layer = dy === 8 ? "icing" : dy % 3 === 0 ? "cream" : "cake";
        box(p, [x + 1, x + 9], [y + dy, y + dy], [8, 12], layer, [{ has: (vx, vy, vz) => vz < 8 + (vx - x - 1) * 0.55 }]); // a wedge, its point to the back
      }
      ellipsoid(p, [x + 7, y + 10, 11], [1.3, 1.4, 1.3], (vx, vy) => (vy >= y + 11 ? "leaf" : "berry"));
    },
  },
  // A slice of watermelon: dark and light green rind, red flesh, black seeds.
  {
    w: 16,
    h: 9,
    draw(p, x, y) {
      for (let dy = 0; dy < 9; dy++) {
        const half = Math.round(Math.sqrt(64 - (dy - 0) ** 2 * 0.8));
        box(p, [x + 8 - half, x + 7 + half], [y + dy, y + dy], [9, 11], (vx) => {
          const d = Math.hypot((vx - x - 7.5) / 8, dy / 9);
          return d > 0.9 ? "rind" : d > 0.78 ? "rindLight" : "melonFlesh";
        });
      }
      for (const [dx, dy] of [
        [4, 2],
        [7, 4],
        [10, 2],
        [6, 1],
        [9, 6],
        [12, 4],
      ])
        p.add(x + dx, y + dy, 12, "seed");
    },
  },
  // A bunch of grapes, each grape round with a gleam, on a stalk with a leaf.
  {
    w: 10,
    h: 13,
    draw(p, x, y) {
      const rows = [4, 4, 3, 3, 2, 1];
      rows.forEach((n, j) => {
        for (let k = 0; k < n; k++) {
          const gx = x + 5 - n + 0.5 + k * 2 + (j % 2) * 0.5;
          const gy = y + 10 - j * 2;
          const gz = ZM + (k % 2 ? -1 : 1);
          ellipsoid(p, [gx, gy, gz], [1.2, 1.2, 1.2], (vx, vy, vz) => (vx < gx && vy > gy ? "grapeLight" : (j + k) % 2 ? "grape" : "grapeDeep"));
        }
      });
      box(p, [x + 5, x + 5], [y + 11, y + 12], [10, 10], "stem");
      box(p, [x + 6, x + 8], [y + 12, y + 12], [9, 11], "leaf");
    },
  },
  // A punnet of strawberries: a clear tub, the berries heaped in it, seeds and green tops.
  {
    w: 10,
    h: 7,
    draw(p, x, y) {
      box(p, [x, x + 9], [y, y + 3], [6, 13], "punnet", [{ has: (vx, vy, vz) => vx > x && vx < x + 9 && vy > y && vz > 6 && vz < 13 }]);
      for (const [bx, by, bz] of [
        [2, 3, 8],
        [5, 3, 9],
        [8, 3, 8],
        [3, 4, 11],
        [6, 5, 11],
        [4, 5, 8],
      ]) {
        ellipsoid(p, [x + bx, y + by, bz], [1.4, 1.5, 1.4], (vx, vy, vz) =>
          vy >= y + by + 1 ? "leaf" : hash(vx, vy, vz) < 0.2 ? "strawSeed" : "berry"
        );
      }
    },
  },
  // A bowl of soup kept for later under cling film: a white bowl with a blue band, the film stretched over.
  {
    w: 12,
    h: 7,
    draw(p, x, y) {
      for (let dy = 0; dy < 5; dy++) ellipsoid(p, [x + 5.5, y + dy, ZM], [3.5 + dy * 0.5, 0.5, 2.5 + dy * 0.25], dy === 3 ? "chinaBlue" : "china");
      ellipsoid(p, [x + 5.5, y + 4, ZM], [4.5, 0.5, 3], (vx, vy, vz) => (hash(vx, vy, vz) < 0.2 ? "leaf" : "soupBroth"));
      ellipsoid(p, [x + 5.5, y + 5, ZM], [5.6, 0.5, 3.4], (vx) => ((vx - x) % 3 === 0 ? "filmGleam" : "film"));
    },
  },
  // Two crème caramels on saucers, the caramel running down from the top.
  {
    w: 14,
    h: 6,
    draw(p, x, y) {
      for (const dx of [3, 10]) {
        ellipsoid(p, [x + dx, y, ZM], [3.3, 0.5, 3], "china");
        round(
          p,
          x + dx,
          ZM,
          y + 1,
          4,
          (dy) => 2.4 - dy * 0.25,
          (vx, dy, vz) => (dy === 3 || (dy === 2 && hash(vx, dy, vz) < 0.5) ? "caramel" : "pudding")
        );
      }
    },
  },
  // Two lemons, pointed at the ends, one cut in half to show its segments.
  {
    w: 12,
    h: 5,
    draw(p, x, y) {
      ellipsoid(p, [x + 3, y + 2, ZM], [3, 2, 2], (vx, vy, vz) => (vx <= x + 1 && vy >= y + 2 ? "lemonLight" : "lemon"));
      p.add(x, y + 2, 10, "lemon"); // its pointed ends
      p.add(x + 6, y + 2, 10, "lemon");
      // The half, its cut face to the front.
      ellipsoid(p, [x + 9.5, y + 2, 9], [2.2, 2, 2.5], "lemon");
      box(p, [x + 8, x + 11], [y + 1, y + 3], [11, 11], (vx, vy) => ((vx + vy) % 2 ? "lemonFlesh" : "lemonPith"));
    },
  },
  // Leftovers in a glass box with a blue clip-on lid: rice, carrot and greens showing through.
  {
    w: 12,
    h: 7,
    draw(p, x, y) {
      box(p, [x, x + 11], [y, y + 4], [6, 13], (vx, vy, vz) => {
        if (vz < 13) return vy === y ? "glass" : vy <= y + 2 ? "rice" : hash(vx, vy, vz) < 0.4 ? "carrot" : "leaf";
        return vy === y + 4 ? "glass" : vy <= y + 1 ? "rice" : hash(vx, vy, 1) < 0.5 ? "carrot" : "leaf";
      });
      box(p, [x, x + 11], [y + 5, y + 5], [6, 13], "milkBlue");
      for (const cx of [x + 2, x + 9]) p.add(cx, y + 4, 14, "milkBlue"); // the clips
    },
  },
  // A rice ball: a white triangle with a band of nori round the foot and sesame seeds.
  {
    w: 9,
    h: 9,
    draw(p, x, y) {
      for (let dy = 0; dy < 9; dy++) {
        const half = 4.5 - dy * 0.5;
        box(p, [x + 4 - half, x + 4 + half], [y + dy, y + dy], [8, 11], (vx, vy, vz) => {
          if (dy <= 2 && Math.abs(vx - x - 4) <= 2) return "nori";
          return vz === 11 && hash(vx, vy, 7) < 0.1 ? "sesame" : "rice";
        });
      }
    },
  },
  // A squeezy bottle of ketchup standing on its white cap.
  {
    w: 5,
    h: 13,
    draw(p, x, y) {
      round(
        p,
        x + 2,
        ZM,
        y,
        3,
        (dy) => 1.4 + dy * 0.3,
        () => "label"
      );
      round(
        p,
        x + 2,
        ZM,
        y + 3,
        10,
        (dy) => (dy === 9 ? 1.8 : 2.2),
        (dx, dy, dz, r) => (dz > r - 1 && dy >= 3 && dy <= 6 && Math.abs(dx) <= 1 ? (dy === 5 ? "leaf" : "label") : "ketchup")
      );
    },
  },
  // A tall carton of soy milk, beige, a green band and a soybean on the front.
  {
    w: 6,
    h: 16,
    draw(p, x, y) {
      box(p, [x, x + 5], [y, y + 13], [7, 12], (vx, vy, vz) => {
        if (vy >= y + 3 && vy <= y + 4) return "soyGreen";
        if (vz === 12 && vy >= y + 7 && vy <= y + 9 && vx >= x + 2 && vx <= x + 3) return "soyBean";
        return "soyMilk";
      });
      box(p, [x, x + 5], [y + 14, y + 14], [9, 10], "soyMilk");
      p.add(x + 4, y + 15, 10, "soyGreen");
    },
  },
  // A jug of iced lemon tea, slices of lemon floating in it.
  {
    w: 7,
    h: 14,
    draw(p, x, y) {
      round(
        p,
        x + 3,
        ZM,
        y,
        12,
        (dy) => (dy >= 10 ? 2.6 : 3),
        (dx, dy, dz) => (dy >= 11 ? "glass" : hash(dx, dy, dz) < 0.08 ? "lemon" : dy === 10 ? "teaLight" : "tea")
      );
      box(p, [x + 6, x + 7], [y + 4, y + 10], [10, 10], "glass", [{ has: (vx, vy) => vx === x + 6 && vy > y + 4 && vy < y + 10 }]); // its handle
    },
  },
];

// The crisper drawer: vegetables, the ones from the garden among them (house.js's beds).
const IN_CRISPER = [
  { w: 8, draw: (p, x, y) => ellipsoid(p, [x + 3.5, y + 1.5, 4.5], [4, 2.2, 2.4], (vx, vy, vz) => (hash(vx, vy, vz) < 0.35 ? "leaf" : "lettuce")) },
  {
    w: 7,
    draw(p, x, y) {
      for (const dx of [0, 3, 6]) {
        box(p, [x + dx, x + dx], [y, y + 1], [3, 6], "carrot");
        p.add(x + dx, y + 2, 3, "leaf");
      }
    },
  },
  {
    w: 7,
    draw(p, x, y) {
      for (const dx of [1, 5]) {
        ellipsoid(p, [x + dx, y + 1, 4.5], [1.6, 1.3, 1.6], "tomato");
        p.add(x + dx, y + 3, 4, "tomLeaf");
      }
    },
  },
  {
    w: 8,
    draw(p, x, y) {
      ellipsoid(p, [x + 3, y + 1, 4.5], [3.2, 1.3, 1.4], "eggplant");
      box(p, [x + 6, x + 7], [y + 1, y + 1], [4, 5], "eggCap");
    },
  },
  {
    w: 8,
    draw(p, x, y) {
      ellipsoid(p, [x + 3.5, y + 1.5, 4.5], [4, 1.8, 2], (vx) => (vx < x + 3 ? "napaWhite" : vx < x + 5 ? "napaPale" : "napaGreen"));
    },
  },
  {
    w: 6,
    draw(p, x, y) {
      ellipsoid(p, [x + 2.5, y + 1.5, 4.5], [2.6, 2, 2.2], (vx, vy, vz) => ((vx + vz) % 3 ? "cabbage" : "cabbageVein"));
    },
  },
  {
    w: 6,
    draw(p, x, y) {
      for (const [dx, c] of [
        [1, "pepperRed"],
        [4, "pepperYellow"],
      ]) {
        box(p, [x + dx - 1, x + dx + 1], [y, y + 1], [4, 5], c);
        p.add(x + dx, y + 2, 4, "stem");
      }
    },
  },
  {
    w: 5,
    draw(p, x, y) {
      box(p, [x + 2, x + 2], [y, y + 1], [4, 5], "broccoliLight");
      ellipsoid(p, [x + 2, y + 2.5, 4.5], [2.2, 1.4, 1.8], (vx, vy, vz) => (hash(vx, vy, vz) < 0.4 ? "broccoliLight" : "broccoli"));
    },
  },
];

// Fill a shelf (small voxels, x from -20 to 20), standing on y, with a random few of `foods` no taller than
// `room`, a gap or two between them; none that is in `used` already (what is on the other shelves), and each
// one put there added to it.
function stock(p, foods, y, room, used) {
  let x = -20 + Math.floor(Math.random() * 3);
  const left = foods.filter((f) => f.h <= room && !used.has(f));
  while (left.length) {
    const food = left.splice(Math.floor(Math.random() * left.length), 1)[0];
    if (x + food.w - 1 > 20) continue;
    food.draw(p, x, y);
    used.add(food);
    x += food.w + 2 + Math.floor(Math.random() * 4);
  }
}

// The fridge's three shelves, the food on them into `food` (small voxels: the tops of the shelves on y 9, 15
// and 27 are at 20, 30 and 50, with 8, 18 and 18 small voxels of room over them).
export function stockFridge(food) {
  const used = new Set();
  stock(food, ON_SHELF, 20, 8, used);
  stock(food, [...ON_SHELF_TALL, ...ON_SHELF], 30, 18, used);
  stock(food, [...ON_SHELF, ...ON_SHELF_TALL], 50, 18, used);
}

// The crisper, on the fridge's floor (y 4 to 7): the garden's vegetables (`produce`, kinds) from the left,
// the oldest first, then as much of `bought` (from shopCrisper) as there is room for.
export function stockCrisper(p, produce, bought) {
  let x = -13;
  for (const kind of produce) {
    VEG[kind].stored(p, x, 4);
    x += STORED_W + 1;
  }
  for (const food of bought) {
    if (x + food.w - 1 > 12) break;
    food.draw(p, x, 4);
    x += food.w + 1;
  }
}
// What was bought for the crisper this time: a random few, in a random order.
export const shopCrisper = () => IN_CRISPER.filter(() => Math.random() < 0.7).sort(() => Math.random() - 0.5);

/* ---------- the freezer ---------- */

// In small voxels too.
const IN_FREEZER = [
  // A tub of strawberry ice cream: a cream tub with a pink lid, a strawberry on its label.
  {
    w: 14,
    h: 9,
    draw(p, x, y) {
      box(p, [x, x + 13], [y, y + 6], [6, 13], (vx, vy, vz) => {
        if (vz === 13 && vy >= y + 2 && vy <= y + 4) {
          const berry = Math.abs(vx - x - 6.5) <= 1.5;
          return berry ? (vy === y + 4 ? "leaf" : "berry") : "label";
        }
        return "icecream";
      });
      box(p, [x, x + 13], [y + 7, y + 8], [6, 13], (vx, vy) => (vy === y + 8 ? "lidPink" : "lidPinkDark"));
    },
  },
  // Two ice lollies on sticks, orange and strawberry, rounded at the top, one with a bite out of it.
  {
    w: 9,
    h: 14,
    draw(p, x, y) {
      for (const [dx, c, bitten] of [
        [1, "juice", false],
        [6, "berry", true],
      ]) {
        box(p, [x + dx, x + dx], [y, y + 3], [9, 10], "woodLight");
        box(p, [x + dx - 1, x + dx + 1], [y + 4, y + 12], [8, 11], (vx, vy, vz) => (vz === 11 && vx === x + dx - 1 ? "lollyGleam" : c), [
          { has: (vx, vy) => vy === y + 12 && vx !== x + dx },
          { has: (vx, vy) => bitten && vy >= y + 10 && vx === x + dx + 1 },
        ]);
      }
    },
  },
  // A bag of frozen peas, crimped along the top, a bowl of peas pictured on the front.
  {
    w: 12,
    h: 10,
    draw(p, x, y) {
      box(p, [x, x + 11], [y, y + 7], [7, 12], (vx, vy, vz) => {
        if (vz !== 12) return "peas";
        if (vy >= y + 1 && vy <= y + 4 && vx >= x + 2 && vx <= x + 9) return vy === y + 1 ? "label" : (vx + vy) % 2 ? "peasLight" : "peas";
        if (vy === y + 6 && vx >= x + 3 && vx <= x + 8) return "label"; // the name
        return "peasBag";
      });
      for (let cx = x; cx <= x + 11; cx++) p.add(cx, y + 8, 9 + (cx % 2), "frameShade"); // the crimp
    },
  },
  // An ice cube tray, the cubes frosted white.
  {
    w: 18,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 17], [y, y + 1], [6, 13], "iceBlue");
      for (let cx = x + 1; cx <= x + 15; cx += 3)
        for (const z of [7, 10]) box(p, [cx, cx + 1], [y + 2, y + 3], [z, z + 1], (vx, vy) => (vy === y + 3 ? "frame" : "ice"));
    },
  },
  // A frozen pizza in its box, a pepperoni pizza pictured on the lid.
  {
    w: 20,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 19], [y, y + 3], [6, 13], (vx, vy, vz) => {
        if (vy !== y + 3 && vz !== 13) return "label";
        const [u, v] = vy === y + 3 ? [vx - x - 9.5, vz - 9.5] : [vx - x - 9.5, (vy - y - 1.5) * 2];
        const d = Math.hypot(u / 1.6, v);
        if (d > 3.6) return "pizzaBox";
        if (d > 3) return "crust";
        return hash(Math.round(u), Math.round(v), 3) < 0.25 ? "pepperoni" : hash(Math.round(u), Math.round(v), 4) < 0.3 ? "cheese" : "pizzaRed";
      });
    },
  },
  // A bag of dumplings, a row of them pictured on the front.
  {
    w: 12,
    h: 8,
    draw(p, x, y) {
      box(p, [x, x + 11], [y, y + 5], [7, 12], (vx, vy, vz) => {
        if (vz === 12 && vy >= y + 1 && vy <= y + 3) {
          const k = (vx - x - 1) % 4;
          if (vx > x && vx < x + 11 && (vy === y + 1 ? k <= 2 : vy === y + 2 ? k <= 2 && k >= 0 : k === 1)) return "dumpling";
        }
        return "bagBlue";
      });
      for (let cx = x; cx <= x + 11; cx++) p.add(cx, y + 6, 9 + (cx % 2), "frameShade"); // the crimp
    },
  },
  // A box of fish fingers: blue, a wave along it and the golden fingers pictured.
  {
    w: 14,
    h: 6,
    draw(p, x, y) {
      box(p, [x, x + 13], [y, y + 5], [7, 12], (vx, vy, vz) => {
        if (vz === 12 && vy >= y + 1 && vy <= y + 2 && vx >= x + 2 && vx <= x + 11 && (vx - x) % 3 !== 1) return "fishFinger";
        if (vy === y + 4 && (vx + (vz === 12 ? 0 : 1)) % 2) return "label"; // the wave
        return "fishBox";
      });
    },
  },
  // Two little tubs of ice cream, vanilla and chocolate, their lids in the flavour's colour.
  {
    w: 10,
    h: 8,
    draw(p, x, y) {
      for (const [dx, c] of [
        [2.5, "vanillaTub"],
        [7.5, "chocTub"],
      ]) {
        round(p, x + dx, ZM, y, 6, 2.3, (vx, dy, vz, r) => (dy >= 2 && dy <= 3 && vz > r - 1 ? "label" : "icecream"));
        round(p, x + dx, ZM, y + 6, 2, 2.5, () => c);
      }
    },
  },
  // A bag of frozen prawns, pink prawns pictured on a blue bag.
  {
    w: 12,
    h: 7,
    draw(p, x, y) {
      box(p, [x, x + 11], [y, y + 4], [7, 12], (vx, vy, vz) => {
        if (vz === 12 && vy >= y + 1 && vy <= y + 3 && vx >= x + 2 && vx <= x + 9) return (vx + vy) % 3 ? "prawn" : "label";
        return "bagBlue";
      });
      for (let cx = x; cx <= x + 11; cx++) p.add(cx, y + 5, 9 + (cx % 2), "frameShade"); // the crimp
    },
  },
];

// The freezer, above: frost here and there on its back wall (the part's "inside"), and two shelves (small
// voxels, like the fridge's: the floor's top at 84 with 13 of room, the shelf's at 99 with 15).
export function stockFreezer(p, food) {
  for (const [x, y, z, c] of p.list()) if (c === "inside" && hash(x, y, 13) < 0.22) p.add(x, y, z, "frost");
  const used = new Set();
  stock(food, IN_FREEZER, 84, 13, used);
  stock(food, IN_FREEZER, 99, 15, used);
}
