/*******************************************************************************
 * What is in the playground's fridge (house.js): each time a door opens, its
 * shelves are stocked afresh from what they might hold, so it is never quite
 * the same twice; the vegetables brought in from the garden (veg.js) stay in
 * the crisper till they are cooked. Every food is drawn into a voxel part with
 * its left end at x and its bottom at y, standing between z = 3 and 6 (the
 * shelves are 6 deep).
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
};

/* ---------- the fridge ---------- */

// A carton with a gable top and a cap: milk with a blue band, or orange juice.
const carton = (body, band, cap) => ({
  w: 3,
  h: 6,
  draw(p, x, y) {
    box(p, [x, x + 2], [y, y + 3], [4, 6], (vx, vy) => (vy === y + 1 ? band : body));
    box(p, [x, x + 2], [y + 4, y + 4], [5, 5], body);
    p.add(x + 1, y + 5, 5, cap);
  },
});
const ON_SHELF = [
  carton("milk", "milkBlue", "milkBlue"),
  carton("juice", "label", "leaf"),
  // A jar of strawberry jam with a gold lid and a label.
  {
    w: 3,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 2], [y, y + 2], [4, 6], (vx, vy, vz) => (vz === 6 && vx === x + 1 && vy === y + 1 ? "label" : "berry"));
      box(p, [x, x + 2], [y + 3, y + 3], [4, 6], "tin");
    },
  },
  // A tray of eggs.
  {
    w: 8,
    h: 2,
    draw(p, x, y) {
      box(p, [x, x + 7], [y, y], [3, 6], "eggTray");
      for (let ex = x; ex <= x + 6; ex += 2)
        for (const z of [3, 5]) box(p, [ex, ex + 1], [y + 1, y + 1], [z, z + 1], hash(ex, z, 3) < 0.2 ? "eggTray" : "egg");
    },
  },
  // Two pots of yoghurt, strawberry and plain, with foil lids.
  {
    w: 5,
    h: 3,
    draw(p, x, y) {
      for (const [dx, c] of [
        [0, "cake"],
        [3, "cream"],
      ]) {
        box(p, [x + dx, x + dx + 1], [y, y + 1], [4, 5], c);
        box(p, [x + dx, x + dx + 1], [y + 2, y + 2], [4, 5], "canTop");
      }
    },
  },
  // A wedge of cheese with holes.
  {
    w: 5,
    h: 3,
    draw(p, x, y) {
      for (let dy = 0; dy < 3; dy++)
        box(p, [x, x + 4 - dy * 2], [y + dy, y + dy], [4, 6], (vx, vy, vz) => (hash(vx, vy, vz) < 0.18 ? "cheeseHole" : "cheese"));
    },
  },
  // Butter on a dish.
  {
    w: 5,
    h: 2,
    draw(p, x, y) {
      box(p, [x, x + 4], [y, y], [3, 6], "china");
      box(p, [x + 1, x + 3], [y + 1, y + 1], [4, 5], "butter");
    },
  },
];
const ON_SHELF_TALL = [
  // A bottle of water with a blue label and cap.
  {
    w: 2,
    h: 9,
    draw(p, x, y) {
      box(p, [x, x + 1], [y, y + 6], [4, 5], (vx, vy) => (vy === y + 3 || vy === y + 4 ? "milkBlue" : "glass"));
      p.add(x, y + 7, 4, "glass");
      p.add(x, y + 8, 4, "milkBlue");
    },
  },
  // Two cans of fizzy drink.
  {
    w: 4,
    h: 4,
    draw(p, x, y) {
      for (const [dx, c] of [
        [0, "canRed"],
        [2, "canGreen"],
      ]) {
        box(p, [x + dx, x + dx + 1], [y, y + 2], [4, 5], (vx, vy) => (vy === y + 1 && vx === x + dx ? "label" : c));
        box(p, [x + dx, x + dx + 1], [y + 3, y + 3], [4, 5], "canTop");
      }
    },
  },
  // A slice of layer cake with a strawberry on top.
  {
    w: 6,
    h: 6,
    draw(p, x, y) {
      box(p, [x, x + 5], [y, y + 3], [3, 6], (vx, vy) => ((vy - y) % 2 ? "cream" : "cake"));
      p.add(x + 2, y + 4, 5, "berry");
      p.add(x + 2, y + 5, 5, "leaf");
    },
  },
  // A slice of watermelon, its seeds showing.
  {
    w: 8,
    h: 5,
    draw(p, x, y) {
      for (let dy = 0; dy <= 4; dy++) {
        const half = dy <= 1 ? 4 : dy === 4 ? 1 : 3 - (dy - 2);
        box(p, [x + 4 - half, x + 3 + half], [y + dy, y + dy], [4, 5], dy === 0 ? "rind" : dy === 1 ? "rindLight" : "berry");
      }
      for (const [dx, dy] of [
        [2, 2],
        [5, 2],
        [4, 3],
      ])
        p.add(x + dx, y + dy, 6, "seed");
    },
  },
  // A bunch of grapes.
  {
    w: 5,
    h: 6,
    draw(p, x, y) {
      ellipsoid(p, [x + 2, y + 2, 4.5], [2, 2.5, 1.6], (vx, vy, vz) => ((vx + vy + vz) % 2 ? "grape" : "grapeDeep"));
      p.add(x + 2, y + 5, 4, "stem");
    },
  },
  // A punnet of strawberries.
  {
    w: 5,
    h: 3,
    draw(p, x, y) {
      box(p, [x, x + 4], [y, y + 1], [3, 6], "label");
      for (let sx = x; sx <= x + 4; sx++) for (const z of [3, 5]) p.add(sx, y + 2, z + (sx % 2), hash(sx, z, 8) < 0.25 ? "leaf" : "berry");
    },
  },
  // A bowl covered in cling film.
  {
    w: 7,
    h: 4,
    draw(p, x, y) {
      ellipsoid(p, [x + 3, y + 1, 4.5], [3.5, 1.6, 2.5], (vx, vy) => (vy === y + 1 ? "chinaBlue" : "china"));
      box(p, [x + 1, x + 5], [y + 3, y + 3], [3, 6], "glass");
    },
  },
  // Two caramel puddings.
  {
    w: 7,
    h: 3,
    draw(p, x, y) {
      for (const dx of [0, 4]) {
        box(p, [x + dx, x + dx + 2], [y, y + 1], [4, 6], "pudding");
        box(p, [x + dx, x + dx + 2], [y + 2, y + 2], [4, 6], "caramel");
      }
    },
  },
  // Two lemons.
  {
    w: 6,
    h: 3,
    draw(p, x, y) {
      for (const dx of [1, 4]) ellipsoid(p, [x + dx, y + 1, 4.5], [1.5, 1.2, 1.2], "lemon");
      p.add(x + 1, y + 2, 4, "leaf");
    },
  },
  // Last night's leftovers in a box with a blue lid.
  {
    w: 6,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 5], [y, y + 2], [3, 6], (vx, vy, vz) => (vz === 6 && vy < y + 2 ? (hash(vx, vy, 5) < 0.5 ? "carrot" : "leaf") : "glass"));
      box(p, [x, x + 5], [y + 3, y + 3], [3, 6], "milkBlue");
    },
  },
  // A rice ball wrapped in nori.
  {
    w: 5,
    h: 4,
    draw(p, x, y) {
      for (let dy = 0; dy < 4; dy++) box(p, [x + Math.ceil(dy / 2), x + 4 - Math.ceil(dy / 2)], [y + dy, y + dy], [4, 5], "rice");
      box(p, [x + 1, x + 3], [y, y + 1], [6, 6], "nori");
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

// Fill a shelf from x0 to x1, standing on y, with a random few of `foods` no taller than `room`, a gap or
// two between them; none that is in `used` already (what is on the other shelves), and each one put there
// added to it.
function stock(p, foods, x0, x1, y, room, used) {
  let x = x0 + Math.floor(Math.random() * 2);
  const left = foods.filter((f) => (!f.h || f.h <= room) && !used.has(f));
  while (left.length) {
    const food = left.splice(Math.floor(Math.random() * left.length), 1)[0];
    if (x + food.w - 1 > x1) continue;
    food.draw(p, x, y);
    used.add(food);
    x += food.w + 1 + Math.floor(Math.random() * 3);
  }
}

// The fridge, below: three shelves, on y 9, 16 and 28 (the crisper drawer under them is stocked apart).
export function stockFridge(p) {
  const used = new Set();
  stock(p, ON_SHELF, -12, 12, 9, 6, used);
  stock(p, ON_SHELF_TALL, -12, 12, 16, 11, used);
  stock(p, [...ON_SHELF, ...ON_SHELF_TALL], -12, 12, 28, 11, used);
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

const IN_FREEZER = [
  // A tub of strawberry ice cream: a label with a strawberry on it, and a white lid.
  {
    w: 8,
    h: 5,
    draw(p, x, y) {
      box(p, [x, x + 7], [y, y + 3], [3, 7], (vx, vy, vz) =>
        vz === 7 && vy >= y + 1 && vy <= y + 2 ? (vx === x + 3 || vx === x + 4 ? "berry" : "label") : "icecream"
      );
      box(p, [x, x + 7], [y + 4, y + 4], [3, 7], "frame");
    },
  },
  // Two ice lollies on sticks, orange and strawberry, one with a bite out of it.
  {
    w: 5,
    h: 6,
    draw(p, x, y) {
      for (const [dx, c] of [
        [0, "juice"],
        [3, "berry"],
      ]) {
        box(p, [x + dx, x + dx + 1], [y + 1, y + 4], [4, 5], c);
        box(p, [x + dx, x + dx + (dx ? 0 : 1)], [y + 5, y + 5], [4, 5], c); // the second one bitten
        p.add(x + dx, y, 4, "woodLight");
      }
    },
  },
  // A bag of peas, crimped along the top, with peas on the label.
  {
    w: 6,
    h: 5,
    draw(p, x, y) {
      box(p, [x, x + 5], [y, y + 3], [3, 6], (vx, vy, vz) =>
        vz === 6 && vy >= y + 1 && vy <= y + 2 && vx > x && vx < x + 5 ? ((vx + vy) % 2 ? "peasLight" : "label") : "peas"
      );
      for (let cx = x; cx <= x + 5; cx += 2) p.add(cx, y + 4, 4, "frameShade");
    },
  },
  // An ice tray of cubes.
  {
    w: 9,
    h: 2,
    draw(p, x, y) {
      box(p, [x, x + 8], [y, y], [3, 7], "iceBlue");
      for (let cx = x + 1; cx <= x + 7; cx += 2) for (const z of [4, 6]) p.add(cx, y + 1, z, "frame");
    },
  },
  // A frozen pizza in its box, a picture of it on the front.
  {
    w: 10,
    h: 2,
    draw(p, x, y) {
      box(p, [x, x + 9], [y, y + 1], [3, 7], (vx, vy, vz) =>
        vz === 7 && vx >= x + 2 && vx <= x + 7 ? (hash(vx, vy, 6) < 0.3 ? "cheese" : "pizzaRed") : "label"
      );
    },
  },
  // A bag of dumplings.
  {
    w: 6,
    h: 4,
    draw(p, x, y) {
      box(p, [x, x + 5], [y, y + 2], [3, 6], (vx, vy, vz) => (vz === 6 && vy === y + 1 && vx % 2 === 0 ? "dumpling" : "bagBlue"));
      for (let cx = x; cx <= x + 5; cx += 2) p.add(cx, y + 3, 4, "frameShade");
    },
  },
  // A box of fish fingers.
  {
    w: 7,
    h: 3,
    draw(p, x, y) {
      box(p, [x, x + 6], [y, y + 2], [3, 6], (vx, vy, vz) => (vy === y + 1 ? "juice" : "fishBox"));
    },
  },
];

// The freezer, above: frost here and there on its back wall (the part's "inside"), and two shelves, on y 42
// and 51.
export function stockFreezer(p) {
  for (const [x, y, z, c] of p.list()) if (c === "inside" && hash(x, y, 13) < 0.22) p.add(x, y, z, "frost");
  const used = new Set();
  stock(p, IN_FREEZER, -12, 12, 42, 7, used);
  stock(p, IN_FREEZER, -12, 12, 51, 7, used);
}
