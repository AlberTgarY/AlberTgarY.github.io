/*******************************************************************************
 * The kitchen: the fridge, the counter, the stove with its oven and sink, the
 * cupboards and the pets' bowls.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, foodBowl, cells } from "../../models/voxels.js";
import { DISHES, FRUIT_DISHES, buildDish, tossAt } from "../props.js";
import { stockFridge, stockCrisper, shopCrisper, stockFreezer, FOOD_SCALE, FOOD_LIFT } from "../fridge-food.js";
import { melonStripes } from "../veg.js";
import { BACK } from "./layout.js";
import { COLORS, pixelTexture, solid, glowing, place, turned } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildKitchen(shared) {
  const { house, mesh, updates, clickables, footprint, turnedFootprint, water } = shared;

  // A rounded retro fridge in mint, no taller than they can reach: the fridge below and the freezer above,
  // each door swinging open towards the front on its own and the inside lit up. In the fridge, two glass
  // shelves over the crisper drawer, and sauces in the door; in the freezer, a shelf. What is on the shelves
  // changes each time a door opens (fridge-food.js), but for the garden's vegetables in the crisper, which
  // stay till they are cooked. Magnets and a photo on the door.
  const FRIDGE = [-132, -97];
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(FRIDGE[0], 0, FRIDGE[1]);
  house.add(fridgeGroup);
  const SPLIT = 40; // the band between the fridge and the freezer
  const TOP = 61;
  const inBox = (x0, x1, y0, y1) => ({ has: (x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= 2 });
  const body = part();
  box(body, [-15, 14], [2, TOP], [-12, 9], (x, y) => (y === SPLIT || y === TOP || Math.abs(x + 0.5) === 14.5 ? "fridgeShade" : "fridge"), [
    inBox(-13, 12, 3, SPLIT - 2),
    inBox(-13, 12, SPLIT + 2, TOP - 2),
  ]);
  for (const x of [-14, 12]) for (const z of [-10, 7]) box(body, [x, x + 1], [0, 1], [z, z + 1], "fridgeFeet");
  fridgeGroup.add(mesh(body));

  const insideOf = [
    (p, food) => {
      box(p, [-13, 12], [3, SPLIT - 2], [1, 1], "inside");
      for (const y of [15, 27]) box(p, [-13, 12], [y, y], [2, 7], "insideShelf");
      // The crisper drawer: frosted sides and front, low enough for what is in it to show over the top, a
      // finger hold in the middle, and the glass shelf over it.
      box(p, [-13, 12], [3, 3], [2, 7], "crisperRim");
      for (const x of [-13, 12]) box(p, [x, x], [4, 6], [2, 7], "crisper");
      box(p, [-13, 12], [4, 6], [7, 7], (x, y) => (y === 6 ? "crisperRim" : Math.abs(x + 0.5) <= 1.5 && y === 5 ? "crisperHandle" : "crisper"));
      box(p, [-13, 12], [9, 9], [2, 7], "insideShelf");
      stockFridge(food);
    },
    (p, food) => {
      box(p, [-13, 12], [SPLIT + 2, TOP - 2], [1, 1], "inside");
      box(p, [-13, 12], [50, 50], [2, 7], "insideShelf");
      stockFreezer(p, food);
    },
  ];
  // Each inside, and the food in it in small voxels (fridge-food.js).
  const insides = insideOf.map((_, i) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), glowing); // lit from within
    const food = new THREE.Mesh(new THREE.BufferGeometry(), glowing);
    food.scale.set(FOOD_SCALE, FOOD_SCALE, 0.5);
    food.position.set(0, FOOD_LIFT[i], -0.25);
    m.visible = false;
    m.add(food);
    fridgeGroup.add(m);
    return m;
  });
  // The crisper drawer, drawn apart so that vegetables can go in while the door is open: the garden's
  // (`store`, kinds, the oldest first), then as much of what was bought as there is room for.
  const store = [];
  let bought = [];
  const crisper = new THREE.Mesh(new THREE.BufferGeometry(), glowing);
  fridgeGroup.add(crisper);
  function restockCrisper() {
    const p = part();
    stockCrisper(p, store, bought);
    crisper.geometry.dispose();
    crisper.geometry = solid(p).geometry;
  }
  function restock(i) {
    const [p, food] = [part(), part()];
    insideOf[i](p, food);
    insides[i].geometry.dispose();
    insides[i].geometry = solid(p).geometry;
    insides[i].children[0].geometry.dispose();
    insides[i].children[0].geometry = solid(food).geometry;
    if (i === 0) {
      bought = shopCrisper();
      restockCrisper();
    }
  }
  insides.forEach((_, i) => restock(i));

  // The magnets on the doors, little pictures in voxels, each row of `rows` a row down from (x, y) at depth z:
  // a photo of the two of them and a heart, and the cat on the freezer.
  const MAGNET = {
    r: "magnetRed",
    y: "magnetYellow",
    o: "magnetOrange",
    g: "magnetGreen",
    p: "magnetPink",
    b: "magnetBlue",
    k: "magnetDark",
    w: "note",
    l: "noteLine",
    f: "photo",
    s: "photoSky",
    h: "photoHerHair",
    H: "photoHisHair",
    e: "photoSkin",
    G: "photoGrass",
  };
  const stick = (p, x, y, rows, z) =>
    rows.forEach((row, j) => [...row].forEach((c, i) => c !== "." && p.add(x + i, y - j, z, c === "W" ? "white" : MAGNET[c])));
  const MAG_PHOTO = ["ffffffff", "fssssssf", "fshhsHHf", "fseeseef", "fsppsbbf", "fGppGbbf", "fGGGGGGf", "ffffffff"];
  const MAG_HEART = ["rW.rr", "rrrrr", ".rrr.", "..r.."];
  const MAG_CAT = ["o...o", "ooooo", "okoko", "oopoo", ".ooo."];

  // The doors, both hinged on the left. Sauces stand in the fridge door's racks.
  const doors = [
    [2, SPLIT - 1],
    [SPLIT + 1, TOP],
  ].map(([y0, y1], i) => {
    const pivot = pivotGroup(fridgeGroup, [-15.5, 0, 11.5]);
    const p = part();
    box(p, [-15, 14], [y0, y1], [10, 11], (x, y) => (y === y0 || y === y1 || Math.abs(x + 0.5) === 14.5 ? "fridgeShade" : "fridge"));
    box(p, [11, 12], i ? [y0 + 2, y0 + 9] : [y1 - 13, y1 - 3], [12, 12], "chrome"); // the handle
    if (!i) {
      for (const y of [12, 24, 31]) {
        box(p, [-12, 10], [y, y], [8, 9], "insideShelf"); // the racks, each with a lip
        if (y < 31) box(p, [-12, 10], [y + 1, y + 2], [7, 7], "insideShelf");
      }
      for (const x of [-11, -9, -7, -5, -3]) p.add(x, 32, 8, "egg"); // eggs along the top one
      box(p, [-10, -9], [13, 17], [8, 8], "berry");
      p.add(-10, 18, 8, "frame");
      box(p, [-6, -5], [13, 16], [8, 8], "soy");
      box(p, [5, 6], [25, 28], [8, 8], "yolk");
      stick(p, -9, 33, MAG_PHOTO, 12);
      stick(p, -6, 34, ["rr"], 13); // holding the photo up
      stick(p, 2, 30, MAG_HEART, 12);
    } else stick(p, -3, 56, MAG_CAT, 12);
    const m = mesh(p);
    pivot.inner.add(m);
    return Object.assign(pivot.outer, { part: m });
  });
  // The light inside each, out of its open door: the fridge's a bright warm white, the freezer's a dimmer
  // icy blue.
  const doorLights = [
    [0xfff1dc, 0.9, 50, 24],
    [0xbcd8ff, 0.55, 34, 52],
  ].map(([color, most, reach, y]) => {
    const l = Object.assign(new THREE.PointLight(color, 0, reach, 0), { most });
    l.position.set(0, y, 14);
    fridgeGroup.add(l);
    return l;
  });
  footprint(FRIDGE[0] - 16, FRIDGE[0] + 15, BACK, FRIDGE[1] + 12);
  // `openers` stand at the fridge with its door open, `freezers` at the freezer; `clicked` opens a door
  // too (a click on the fridge opens or shuts its door, on the freezer the freezer's), and whoever is at it
  // keeps it open till they are done.
  const fridge = { openers: 0, freezers: 0, k: [0, 0], clicked: [false, false] };
  // Its body, doors and what shows inside them when open (so a click on the open fridge shuts it).
  clickables.push({
    parts: [fridgeGroup.children[0], doors[0].part, insides[0], insides[0].children[0], crisper],
    toggle: () => (fridge.clicked[0] = !fridge.clicked[0]),
  });
  clickables.push({ parts: [doors[1].part, insides[1], insides[1].children[0]], toggle: () => (fridge.clicked[1] = !fridge.clicked[1]) });
  updates.push((t, dt) => {
    [fridge.openers, fridge.freezers].forEach((n, i) => {
      const open = n > 0 || fridge.clicked[i];
      if (open && fridge.k[i] < 0.02) restock(i); // opening from shut
      fridge.k[i] += ((open ? 1 : 0) - fridge.k[i]) * (1 - Math.exp(-5 * dt));
      doors[i].rotation.y = -1.6 * fridge.k[i];
      insides[i].visible = fridge.k[i] > 0.02;
    });
    crisper.visible = insides[0].visible;
    doorLights.forEach((l, i) => (l.intensity = l.most * fridge.k[i]));
  });

  // The counter: cupboards under a walnut top (the pets' food in one of them; in the middle one, behind its
  // door, the bowls and plates, and in the drawer over it the chopsticks and spoons: `cupboard`), and on it,
  // along the back, what they cook with: Lee Kum Kee's light soy sauce and oyster sauce, a black pepper and
  // a pink salt grinder, a pouch of garlic chilli sauce and a jar of chilli oil; the house keys in front
  // (`keys`). A shelf of mugs on the wall above.
  const COUNTER = [-95, -100];
  const counter = part();
  const CUP = { x: [-7, 6], y: [3, 27] }; // the middle cupboard's door
  const DRAWER = { x: [-7, 6], y: [29, 33] }; // the drawer's front
  const within = (x, y, z, [x0, x1], [y0, y1], [z0, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
  const hollowCup = (x, y, z) => within(x, y, z, [-6, 5], [3, 27], [-8, 8]) || within(x, y, z, [-6, 5], [29, 32], [-8, 8]);
  const cupFront = (x, y, z) => z === 8 && (within(x, y, z, CUP.x, CUP.y, [8, 8]) || within(x, y, z, DRAWER.x, DRAWER.y, [8, 8]));
  box(
    counter,
    [-21, 20],
    [0, 33],
    [-10, 8],
    (x, y, z) => {
      if (z < 8 && within(x, y, z, [-7, 6], [2, 33], [-9, 7])) return "cupboardInside";
      if (y <= 2) return "cabinetLine";
      if (z === 8 && (x === -8 || x === 7 || y === 28)) return "cabinetLine";
      return "cabinet";
    },
    [{ has: (x, y, z) => hollowCup(x, y, z) || cupFront(x, y, z) }]
  );
  for (const x of [-11, 10]) counter.add(x, 24, 9, "brass");
  box(counter, [-6, 5], [15, 15], [-8, 6], "cupboardInside"); // its shelf
  box(counter, [-22, 21], [34, 35], [-11, 10], "counterTop");
  // What they cook with, along the back of the worktop, in half voxels for the detail (shown at half size,
  // half voxel u covering u / 2 - 1/2 to u / 2, so that they stand on it). Something round standing on it at
  // (cx, cz) is `h` half voxels tall, of radius r(dy) at each height dy, coloured c(dx, dy, dz, r) about its
  // axis, where dz > r - 1.5 is its front, towards the room.
  const sauces = part();
  const WORKTOP = 72; // the top of the worktop, in half voxels
  const ROW = -9.5; // and the row along its back
  const upright = (cx, cz, h, r, c, power = 2) => {
    for (let dy = 0; dy < h; dy++)
      ellipsoid(sauces, [cx, WORKTOP + dy, cz], [r(dy), 0.5, r(dy)], (x, y, z) => c(x - cx, dy, z - cz, r(dy)), [], power);
  };
  const front = (dz, r) => dz > r - 1.5;
  const ridged = (dx, dz, a, b) => (Math.floor(((Math.atan2(dz, dx) + Math.PI) * 8) / Math.PI) % 2 ? a : b);
  // Lee Kum Kee's light soy sauce: a tall dark glass bottle under a ridged gold cap; its label gold above
  // with the red LKK badge, and red below with the name in gold and a white line of English, edged in gold.
  upright(
    -33.5,
    ROW,
    34,
    (dy) => (dy <= 22 ? 3.4 : [3, 2.4, 1.8, 1.2, 1.2, 1.2, 1.2, 1.5, 1.5, 1.5, 1.5][dy - 23]),
    (dx, dy, dz, r) => {
      const face = front(dz, r);
      if (dy >= 30) return dy === 30 || dy === 33 ? "lkkCapDark" : ridged(dx, dz, "lkkCap", "lkkCapDark");
      if (dy === 3 || dy === 20) return "lkkGoldDark";
      if (dy >= 4 && dy <= 11) {
        if (face && dy === 5 && Math.abs(dx) <= 2) return "pouchLabel";
        if (face && Math.abs(dx) <= 0.6 && dy >= 7 && dy % 2) return "lkkGold";
        return "lkkRed";
      }
      if (dy >= 12 && dy <= 19) {
        if (face && Math.abs(dx) <= 1.2 && dy >= 14 && dy <= 17) return Math.abs(dx) < 0.6 && dy === 15 ? "lkkGold" : "lkkRed";
        return "lkkGold";
      }
      return dx < -1.8 && dz > 0.5 && dy < 25 ? "soyGleam" : "soyBottle";
    }
  );
  // Lee Kum Kee's oyster sauce: a squat dark bottle under a red cap, the round portrait of the lady on its
  // shoulder in a red and gold ring, and low down its label: the sea and the sky, a green boat with two
  // people, between red bands edged in gold with the name in gold.
  upright(
    -21.5,
    ROW,
    26,
    (dy) => (dy <= 15 ? 4.2 : [3.8, 3.1, 2.3, 1.6, 1.5, 1.5, 2, 2, 2, 2][dy - 16]),
    (dx, dy, dz, r) => {
      const face = front(dz, r);
      if (dy >= 22) return dy === 22 ? "lkkRedDark" : ridged(dx, dz, "lkkRed", "lkkRedDark");
      if (dy === 1 || dy === 12) return "lkkGold";
      if (dy === 2 || dy === 3 || dy === 11) return face && dy !== 2 && Math.round(dx * 2) % 2 ? "lkkGold" : "lkkRed";
      if (dy >= 4 && dy <= 10) {
        if (face && dy >= 5 && dy <= 6 && Math.abs(dx) <= 1.5) return dy === 5 ? "soyBottle" : "pouchGreen"; // the boat
        if (face && dy >= 6 && dy <= 8 && Math.abs(dx + 2.2) < 0.6) return "lkkRed"; // and the two in it
        if (face && dy >= 6 && dy <= 8 && Math.abs(dx - 2.2) < 0.6) return "lkkBlue";
        if (dy >= 9) return "lkkSky";
        return hash(dx, dy, dz) < 0.3 ? "lkkTealDark" : "lkkTeal";
      }
      if (face && dy >= 13 && dy <= 19) {
        const d = Math.hypot(dx, dy - 16);
        if (d <= 1.2) return dy >= 16 ? "soyBottle" : "lkkSkin"; // her hair and face
        if (d <= 2) return dy < 15 ? "lkkRed" : "lkkCream";
        if (d <= 2.7) return ridged(dx, dy - 16, "lkkGold", "lkkRed");
      }
      return dx < -2.5 && dz > 0.5 && dy < 16 ? "soyGleam" : "soyBottle";
    }
  );
  // The grinders: glass bodies narrowing a little at the waist, full of peppercorns or pink salt, a gleam
  // down the glass, under brushed steel tops with a chrome band and a rounded knob.
  [
    [-9.5, ["pepperCorn", "pepperCornLight", "pepperCorn"]],
    [-1.5, ["pinkSalt", "pinkSaltLight", "pinkSaltDeep"]],
  ].forEach(([cx, [c0, c1, c2]]) =>
    upright(
      cx,
      ROW - 2,
      34,
      (dy) => (dy <= 19 ? 3.6 - 0.9 * Math.sin((Math.PI * dy) / 19) : dy <= 30 ? 3.6 : 2.6),
      (dx, dy, dz, r) => {
        if (dy >= 20) return dy <= 21 ? "chrome" : dy === 26 ? "steelDark" : dx < -1 && front(dz, r) ? "chrome" : "steel";
        if (front(dz, r) && dx > -2 && dx < -0.8 && dy > 2 && dy < 17) return "glasswareRim"; // the gleam on the glass
        const h = hash(dx, dy, dz + cx);
        return h < 0.25 ? c1 : h < 0.4 ? c2 : c0;
      }
    )
  );
  // Limin's garlic chilli sauce: a red stand-up pouch, the brand up in the corner, the name down the right
  // in big white-edged letters, chillies, green peppers, garlic and spring onions below, pink rings here and
  // there, the maker along the foot; its spout up top with a ridged red cap.
  const POUCH = [
    ".RRRRRRRRRR.",
    "RRRRRRRRRRRR",
    "RWWRRRRPPRRR",
    "RWWRRRRPPRRR",
    "RRRRRRRRRWWW",
    "RRPPRRRRWDDW",
    "RPRRPRRRWDDW",
    "RPRRPRRRWWWW",
    "RRPPRRRRWDDW",
    "RRRRRRRRWDDW",
    "RRRRRRRRWWWW",
    "RRRRRRRRWDDW",
    "RRRRRRRRWDDW",
    "RRRRRRRRWWWW",
    "RrrRRgRRRRRR",
    "rrrrRggRRGcR",
    "RrrRgggRGccR",
    "RRrRRgRRGccR",
    "RrrrRRrrGRRR",
    "rrrrrRrrrGRR",
    "RrrRRgggRGRR",
    "RWRWRWRWRWRR",
    "DDDDDDDDDDDD",
    "DDDDDDDDDDDD",
  ];
  const PRINT = { R: "pouchRed", D: "pouchDeep", W: "pouchLabel", P: "pouchPink", r: "pepperRed", g: "pouchGreen", G: "onionGreen", c: "garlic" };
  const at = (u, v) => POUCH[POUCH.length - 1 - v][u];
  box(
    sauces,
    [6, 17],
    [WORKTOP, WORKTOP + 23],
    [-12, -9],
    (x, y, z) => (z === -9 ? PRINT[at(x - 6, y - WORKTOP)] : y - WORKTOP <= 1 ? "pouchDeep" : "pouchRed"),
    [{ has: (x, y) => at(x - 6, y - WORKTOP) === "." }]
  );
  box(sauces, [10, 11], [WORKTOP + 24, WORKTOP + 25], [-11, -10], "white"); // the spout
  box(sauces, [10, 11], [WORKTOP + 26, WORKTOP + 29], [-11, -10], (x, y) => (y % 2 ? "chiliLid" : "pouchDeep"));
  // Chuannan's chilli oil: a squat glass jar of red oil thick with chilli flakes, under a yellow lid with a
  // red ribbon over it, the ribbon running down the front of the yellow label, the name in yellow on a red
  // panel in its middle, and the round logo beside the ribbon.
  upright(
    26.5,
    ROW,
    20,
    (dy) => (dy === 0 ? 4.8 : dy <= 15 ? 5.2 : dy === 19 ? 5 : 5.4),
    (dx, dy, dz, r) => {
      if (dy >= 16) return Math.abs(dx) <= 1 && dz > 0 ? "chiliLid" : dy === 16 ? "chiliLabelDark" : "chiliLabel";
      if (dy >= 3 && dy <= 14 && dz > -1) {
        if (Math.abs(dx) <= 1 && dy >= 11) return dx === 0 && dy % 2 ? "chiliLabel" : "chiliLid"; // the ribbon, its words
        if (front(dz, r) && Math.abs(dx) <= 3.5 && dy >= 4 && dy <= 10) {
          return Math.abs(dx) <= 2.5 && dy >= 5 && dy <= 9 && hash(dx, dy, 5) < 0.4 ? "chiliLabel" : "chiliLid";
        }
        if (front(dz, r) && Math.hypot(dx + 3.5, dy - 12.5) <= 1.2) return Math.hypot(dx + 3.5, dy - 12.5) < 0.6 ? "chiliLabel" : "chiliLid";
        return "chiliLabel";
      }
      if (dx < -3.5 && dz > 1 && dy >= 2 && dy <= 13) return "chiliGleam";
      const h = hash(dx, dy, dz);
      return h < 0.3 ? "chiliFlake" : h < 0.45 ? "chiliBright" : "chiliOil";
    },
    3
  );
  const saucesMesh = mesh(sauces);
  saucesMesh.scale.setScalar(0.5);
  place(house, saucesMesh, [COUNTER[0] - 0.25, -0.25, COUNTER[1] - 0.25]);
  place(house, mesh(counter), [COUNTER[0], 0, COUNTER[1]]);
  // The middle cupboard's door, hinged on its right, opening out into the room; the drawer over it, sliding
  // out with what is in it.
  const counterGroup = place(house, new THREE.Group(), [COUNTER[0], 0, COUNTER[1]]);
  const cupDoor = pivotGroup(counterGroup, [CUP.x[1] + 0.5, 0, 8.5]);
  const cupDoorPart = part();
  box(cupDoorPart, CUP.x, CUP.y, [8, 8], (x, y) => (y === CUP.y[0] || y === CUP.y[1] ? "cabinetLine" : "cabinet"));
  cupDoorPart.add(CUP.x[0] + 3, 24, 9, "brass"); // its knob
  const cupDoorMesh = mesh(cupDoorPart);
  cupDoor.inner.add(cupDoorMesh);
  const drawer = place(counterGroup, new THREE.Group(), [0, 0, 0]);
  const drawerPart = part();
  box(drawerPart, DRAWER.x, DRAWER.y, [8, 8], "cabinet");
  drawerPart.add(0, 31, 9, "brass"); // its knob
  box(drawerPart, [-6, 5], [29, 29], [-7, 7], "cupboardInside"); // the drawer's bottom, sides and back
  for (const x of [-6, 5]) box(drawerPart, [x, x], [30, 31], [-7, 7], "cupboardInside");
  box(drawerPart, [-5, 4], [30, 31], [-7, -7], "cupboardInside");
  const drawerMesh = mesh(drawerPart);
  drawer.add(drawerMesh);

  // What is in the cupboard and the drawer, in quarter voxels for the detail (shown at a quarter size, quarter
  // voxel u covering u / 4 - 1/4 to u / 4). A stack of `n` round things at (cx, cz), from height y0 up, each
  // `h` high and nested `step` above the last; at each height dy of one, a ring from r0(dy) to r1(dy) about its
  // axis (r0 0: a disc), coloured c(dy, d, r1, angle) by how far out it is.
  const quarter = (m, parent) => {
    m.scale.setScalar(0.25);
    m.position.set(-0.125, -0.125, -0.125);
    parent.add(m);
  };
  const stack = (q, cx, y0, cz, n, h, r0, r1, c, step = 2) => {
    for (let k = 0; k < n; k++)
      for (let dy = 0; dy < h; dy++) {
        const [lo, hi] = [r0(dy), r1(dy)];
        for (let x = Math.floor(cx - hi); x <= Math.ceil(cx + hi); x++)
          for (let z = Math.floor(cz - hi); z <= Math.ceil(cz + hi); z++) {
            const d = Math.hypot(x - cx, z - cz);
            if (d <= hi && d >= lo) q.add(x, y0 + step * k + dy, z, c(dy, d, hi, Math.atan2(z - cz, x - cx), k === n - 1));
          }
      }
  };
  // A bowl `h` high and `r` across the rim: a foot ring, the bottom, then its wall flaring out to the rim.
  const wall = (r, h) => (dy) => (dy < 2 ? r * 0.45 : r * (0.5 + 0.5 * ((dy - 1) / (h - 2)) ** 0.6));
  const bowlIn = (r, h) => (dy) => (dy === 0 ? r * 0.45 - 1.2 : dy === 1 ? 0 : wall(r, h)(dy) - 1.3);
  const crockery = part();
  // White china with a blue rim, a blue band by the foot, blue sprigs round the side (`sprigs`) and, in the
  // top one of a stack, a blue ring in the bottom.
  const blueWhite = (h, r0, sprigs) => (dy, d, r, a, top) => {
    if (dy === 1) return top && Math.abs(d - r0 * 0.22) < 0.6 ? "chinaBlue" : "china";
    if (dy === h - 1 || dy === 2) return "chinaBlue";
    if (!sprigs || d <= r - 0.8) return "china";
    return dy === 5 && Math.floor(((a + Math.PI) * 5) / Math.PI) % 2 && hash(Math.round(a * 9), dy, 3) < 0.5 ? "chinaInk" : "china";
  };
  // On the shelf (its top at 15.5), at the front where they show: their rice bowls and the bigger celadon
  // noodle bowls; behind them two stacks of little bowls.
  const RICE = { r: 8, h: 9 };
  stack(crockery, -12, 63, 12, 5, RICE.h, bowlIn(RICE.r, RICE.h), wall(RICE.r, RICE.h), blueWhite(RICE.h, RICE.r, true), 3);
  const NOODLE = { r: 9, h: 11 };
  stack(crockery, 11, 63, 12, 4, NOODLE.h, bowlIn(NOODLE.r, NOODLE.h), wall(NOODLE.r, NOODLE.h), (dy, d, r) =>
    dy === NOODLE.h - 1 || (d > r - 0.8 && dy === 2) ? "celadonDark" : "celadon"
  );
  const SMALL = { r: 6, h: 7 };
  for (const x of [-14, 8])
    stack(crockery, x, 63, -20, 5, SMALL.h, bowlIn(SMALL.r, SMALL.h), wall(SMALL.r, SMALL.h), blueWhite(SMALL.h, SMALL.r, false), 3);
  // On its floor (2.5), at the front: plates, a blue line round the rim and another round the well, and little
  // sauce dishes; at the back the pans: a steel stock pot with its lid on and a handle each side, and a
  // saucepan, its long black handle out to the front.
  const PLATE = 13;
  stack(
    crockery,
    -9,
    11,
    12,
    6,
    2,
    (dy) => (dy === 0 ? 0 : PLATE * 0.62),
    (dy) => (dy === 0 ? PLATE * 0.66 : PLATE),
    (dy, d) => (dy === 1 && d > PLATE - 1 ? "chinaBlue" : Math.abs(d - PLATE * 0.64) < 0.5 ? "chinaBlue" : "china")
  );
  stack(
    crockery,
    15,
    11,
    15,
    4,
    2,
    (dy) => (dy === 0 ? 0 : 3.2),
    (dy) => (dy === 0 ? 3.4 : 4.6),
    (dy) => (dy === 1 ? "celadonDark" : "celadon")
  );
  // A pan stored at (cx, cz) on the floor, `r` round and `h` high: its steel side catching the light down one edge,
  // the rim and base darker; with a lid on (a little domed, a knob on top) if `lid`.
  const stored = (cx, cz, r, h, lid) => {
    stack(
      crockery,
      cx,
      11,
      cz,
      1,
      h,
      (dy) => (dy === 0 ? 0 : r - 1.3),
      () => r,
      (dy, d, rr, a) => (dy === 0 || dy === h - 1 ? "steelDark" : Math.abs(a - 2.2) < 0.35 ? "chrome" : "steel")
    );
    if (!lid) return;
    stack(
      crockery,
      cx,
      11 + h,
      cz,
      1,
      2,
      () => 0,
      (dy) => (dy === 0 ? r + 0.4 : r * 0.55),
      (dy) => (dy === 0 ? "steel" : "chrome")
    );
    box(crockery, [cx - 1, cx + 1], [11 + h + 2, 11 + h + 3], [cz - 1, cz + 1], "hob"); // the knob
  };
  stored(-11, -19, 11, 28, true);
  for (const side of [-1, 1])
    box(
      crockery,
      [-11 + side * 12, -11 + side * 13].sort((m, n) => m - n),
      [33, 35],
      [-21, -17],
      "steelDark"
    ); // its handles
  stored(12, -19, 7, 15, false);
  for (let z = -12; z <= 1; z++)
    box(crockery, [11, 13], [22 + Math.round((z + 12) / 5), 23 + Math.round((z + 12) / 5)], [z, z], z > -7 ? "hob" : "steelDark"); // its handle
  quarter(mesh(crockery), counterGroup);

  // In the drawer (its bottom at 29.5), a bamboo tray: their light wooden chopsticks in pairs, white china soup
  // spoons with a blue rim and a blue flower in the bowl, steel spoons and a fork, and dark wooden chopsticks
  // with brass ends.
  const tray = part();
  box(tray, [-21, 18], [119, 119], [-25, 30], "bamboo");
  box(tray, [-21, 18], [120, 122], [-25, 30], "bambooDark", [{ has: (x, y, z) => x > -21 && x < 18 && z > -25 && z < 30 }]);
  for (const x of [-11, -1, 8]) box(tray, [x, x], [120, 121], [-24, 29], "bambooDark");
  const chopsticks = (x, body, end) => {
    box(tray, [x, x], [120, 120], [-23, 28], (vx, vy, z) => (z < -16 ? end : body));
    box(tray, [x, x], [121, 121], [-23, -17], end); // (square and thicker at the top)
  };
  for (const x of [-20, -19, -17, -16, -14, -13]) chopsticks(x, "woodDark", "woodDark");
  for (const x of [10, 11, 13, 14, 16, 17]) chopsticks(x, "chopDark", "brass");
  // A soup spoon at z0: a deep oval bowl, its rim raised, and the flat handle rising behind it.
  const soupSpoon = (cx, z0) => {
    for (let x = cx - 4; x <= cx + 4; x++)
      for (let z = z0 - 6; z <= z0 + 6; z++) {
        const e = ((x - cx) / 3.6) ** 2 + ((z - z0) / 5.6) ** 2;
        if (e > 1) continue;
        tray.add(x, 120, z, e < 0.12 ? "chinaInk" : "china");
        if (e > 0.55) tray.add(x, 121, z, e > 0.8 ? "chinaBlue" : "china");
      }
    for (let z = z0 + 6; z <= z0 + 20; z++)
      box(
        tray,
        [cx - 1, cx + (z < z0 + 12 ? 1 : 0)],
        [z < z0 + 13 ? 121 : 122, z < z0 + 13 ? 121 : 122],
        [z, z],
        z === z0 + 20 ? "chinaBlue" : "china"
      );
  };
  soupSpoon(-6, -17);
  soupSpoon(-6, 9);
  // A steel spoon (oval head, thin handle) and a fork (three tines).
  for (let x = 0; x <= 4; x++) for (let z = -23; z <= -17; z++) if (((x - 2) / 1.8) ** 2 + ((z + 20) / 3.2) ** 2 <= 1) tray.add(x, 120, z, "chrome");
  box(tray, [2, 2], [120, 120], [-16, 26], "chrome");
  for (const x of [5, 6, 7]) box(tray, [x, x], [120, 120], [-23, -19], x === 6 ? "steel" : "chrome");
  box(tray, [5, 7], [120, 120], [-18, -17], "chrome");
  box(tray, [6, 6], [120, 120], [-16, 26], "chrome");
  quarter(mesh(tray), drawer);
  // Opened by someone getting the bowls out (acts/kitchen.js: `using`, who it is), or clicked open or shut by
  // a visitor (`clicked`) while nobody is using it: the drawer and the door, each easing open or shut.
  const cupboard = { door: false, drawer: false, kd: 0, kr: 0, clicked: { door: false, drawer: false }, using: null };
  for (const [key, m] of [
    ["door", cupDoorMesh],
    ["drawer", drawerMesh],
  ])
    clickables.push({ parts: [m], toggle: () => !cupboard.using && (cupboard.clicked[key] = !cupboard.clicked[key]) });
  updates.push((t, dt) => {
    cupboard.kd += ((cupboard.door || cupboard.clicked.door ? 1 : 0) - cupboard.kd) * (1 - Math.exp(-6 * dt));
    cupboard.kr += ((cupboard.drawer || cupboard.clicked.drawer ? 1 : 0) - cupboard.kr) * (1 - Math.exp(-7 * dt));
    cupDoor.outer.rotation.y = 2.3 * cupboard.kd; // (well back, not to hide what is inside)
    drawer.position.z = 13 * cupboard.kr; // (all but its back out, what is in it in full view)
  });
  // The house keys lying in front: a pink heart fob, a brass ring and two keys. Whoever leads a walk takes
  // them (acts.js), and they are back after.
  const keysPart = part();
  [
    [13, 3, "magnetPink"],
    [14, 3, "magnetPink"],
    [13, 4, "magnetPink"],
    [15, 4, "brass"],
    [16, 4, "chrome"],
    [17, 4, "chrome"],
    [18, 4, "steelDark"],
    [16, 5, "chrome"],
    [17, 6, "chrome"],
  ].forEach(([x, z, c]) => keysPart.add(x, 36, z, c));
  const keysOnCounter = place(house, mesh(keysPart), [COUNTER[0], 0, COUNTER[1]]);
  const keys = {
    get home() {
      return keysOnCounter.visible;
    },
    set home(on) {
      keysOnCounter.visible = on;
    },
  };
  footprint(COUNTER[0] - 22, COUNTER[0] + 21, BACK, COUNTER[1] + 10);
  const shelfOnWall = part();
  box(shelfOnWall, [-20, 20], [60, 61], [BACK + 1, BACK + 6], "woodMid");
  for (const x of [-16, 16]) box(shelfOnWall, [x, x], [56, 59], [BACK + 1, BACK + 3], "woodDeep");
  [-12, -5, 2].forEach((x, i) => {
    for (let y = 62; y <= 65; y++) ellipsoid(shelfOnWall, [x, y, BACK + 3.5], [1.8, 0.5, 1.8], i === 1 ? "mugBlue" : y === 64 ? "magnetRed" : "mug");
  });
  ellipsoid(shelfOnWall, [12, 63, BACK + 3.5], [2.2, 1.8, 2], "pot");
  ellipsoid(shelfOnWall, [12, 67, BACK + 3.5], [3, 2.6, 2.4], (x, y, z) => (hash(x, y, z) < 0.3 ? "plantLight" : "plant"));
  for (let y = 58; y <= 62; y++) shelfOnWall.add(14, y, BACK + 5, "plant"); // a trailing stem
  place(house, mesh(shelfOnWall), [COUNTER[0], 0, 0]);
  // A light strip hidden under the front of the shelf, lit at night: a soft warm light down over the worktop
  // and what stands on it.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(34, 0.3, 0.6), new THREE.MeshBasicMaterial());
  strip.position.set(COUNTER[0], 59.8, BACK + 5);
  const stripSpot = new THREE.SpotLight(0xffd6a6, 0, 70, 1.25, 1, 1);
  stripSpot.position.set(COUNTER[0], 59.5, BACK + 5);
  stripSpot.target.position.set(COUNTER[0], 35, BACK + 9);
  house.add(strip, stripSpot, stripSpot.target);
  const underShelf = {
    set(on) {
      stripSpot.intensity = on ? 22 : 0;
      strip.material.color.set(on ? 0xffe2b8 : 0xd8ccb8);
    },
  };

  // An umbrella rack on the wall between the door and the foot of the stairs, out of everyone's way: a
  // little wooden board with two brass hooks, her pink umbrella and his navy one hanging from them by their
  // hooked handles. Each goes when it is taken.
  const BROLLY_RACK = [-35, BACK + 1];
  const rack = part();
  box(rack, [-5, 5], [33, 35], [0, 0], (x, y) => (y === 33 ? "woodDeep" : "woodMid"));
  for (const x of [-3, 3]) {
    rack.add(x, 34, 1, "brass");
    rack.add(x, 33, 2, "brass");
  }
  place(house, mesh(rack), [BROLLY_RACK[0], 0, BROLLY_RACK[1]]);
  const UMBRELLA_COLORS = { girl: ["umbrellaPink", "white"], boy: ["umbrellaNavy", "umbrellaNavyDark"] };
  const standUmbrellas = Object.fromEntries(
    Object.entries(UMBRELLA_COLORS).map(([who, [c1, c2]], i) => {
      const p = part();
      box(p, [0, 0], [-17, 0], [0, 0], "woodDeep");
      for (let y = -14; y <= -4; y++) {
        const r = y < -12 || y > -6 ? 0 : 1;
        box(p, [-r, r], [y, y], [-r, r], (x, yy, z) => ((x + yy + z) % 4 === 0 ? c2 : c1));
      }
      for (const [x, y] of [
        [0, 1],
        [1, 2],
        [2, 1],
      ])
        p.add(x, y, 0, "woodDeep"); // the hooked handle, over the hook
      return [who, place(house, mesh(p), [BROLLY_RACK[0] + (i ? 3 : -3) - 1, 31, BROLLY_RACK[1] + 2])];
    })
  );

  // The pedal bin between the counter and the door: a steel can whose lid flips up when something goes in.
  const BIN = [-69, -104];
  const binPart = part();
  for (let y = 0; y <= 15; y++)
    ellipsoid(binPart, [0, y, 0], [4.2, 0.5, 4.2], (x, yy, z) =>
      y === 15 && Math.hypot(x, z) < 3 ? "binInside" : y === 0 || y === 15 ? "steelDark" : y >= 13 ? "chrome" : "steel"
    );
  box(binPart, [-2, 1], [0, 1], [4, 5], "steelDark"); // the pedal
  place(house, mesh(binPart), [BIN[0], 0, BIN[1]]);
  const binLid = pivotGroup(house, [BIN[0], 16, BIN[1] - 4.5]);
  const lidPart = part();
  ellipsoid(lidPart, [BIN[0], 16, BIN[1]], [4.4, 0.5, 4.4], "chrome");
  lidPart.add(BIN[0], 17, BIN[1] + 3, "steelDark"); // a lip to lift it by
  binLid.inner.add(mesh(lidPart));
  footprint(BIN[0] - 5, BIN[0] + 5, BACK, BIN[1] + 5);
  const bin = { open: false, k: 0 };
  updates.push((t, dt) => {
    bin.k += ((bin.open ? 1 : 0) - bin.k) * (1 - Math.exp(-8 * dt));
    binLid.outer.rotation.x = -1.3 * bin.k;
  });

  // The stove against the left wall: an oven under a four-burner gas hob with a pot and a frying pan on it,
  // a sink sunk into the worktop with a tap and a sponge, a dishwasher under it (`dishwasher`), and wall
  // cupboards with green glass doors above. Built facing +z, then turned to face the room.
  const STOVE = [-140, -30];
  const STOVE_YAW = Math.PI / 2;
  const stoveGroup = place(house, new THREE.Group(), [STOVE[0], 0, STOVE[1]], STOVE_YAW);
  const stovePart = part();
  // Left hollow: the oven's inside (behind its door) and the sink's basin. The oven is under the hob.
  const OVEN = { x: [-29, -14], y: [6, 27] };
  const OVEN_MID = (OVEN.x[0] + OVEN.x[1]) / 2;
  const hollow = part();
  box(hollow, [OVEN.x[0] + 2, OVEN.x[1] - 2], [8, 24], [-1, 8], "hob");
  box(hollow, [5, 16], [30, 35], [-5, 4], "hob");
  const inOven = (x, y, z) => x >= OVEN.x[0] + 1 && x <= OVEN.x[1] - 1 && y >= 7 && y <= 25 && z >= -2;
  const inSink = (x, y, z) => x >= 4 && x <= 17 && y >= 29 && z >= -6 && z <= 5;
  const WASHER = { x: [3, 18], y: OVEN.y }; // the dishwasher's door: as big as the oven's, a little way along from it
  const inTub = (x, y, z) => x >= 4 && x <= 17 && y >= WASHER.y[0] + 1 && y <= WASHER.y[1] - 1 && z >= -8 && z <= 8;
  const washerFront = (x, y, z) => z === 8 && x >= WASHER.x[0] && x <= WASHER.x[1] && y >= WASHER.y[0] && y <= WASHER.y[1];
  box(
    stovePart,
    [-39, 21],
    [0, 33],
    [-10, 8],
    (x, y, z) => {
      if (inOven(x, y, z)) return "ovenInside";
      if (inSink(x, y, z)) return y === 29 && Math.abs(x - 10.5) <= 1 && Math.abs(z + 0.5) <= 1 ? "chrome" : y === 29 ? "steelDark" : "steel";
      if (z < 8 && x >= 3 && x <= 18 && y >= WASHER.y[0] && y <= WASHER.y[1]) return "steel"; // the dishwasher's tub
      if (y <= 2) return "cabinetLine";
      if (z === 8 && x >= OVEN.x[0] && x <= OVEN.x[1] && y >= OVEN.y[0] && y <= OVEN.y[1]) return "steel"; // behind the door
      if (z === 8 && (x === OVEN.x[0] - 2 || x === OVEN.x[1] + 2 || x === 1 || y === 28)) return "cabinetLine"; // the doors and the drawer line
      if (z === 8 && y === 18 && (x === OVEN.x[0] - 4 || x === OVEN.x[1] + 4)) return "brass"; // their knobs
      return "cabinet";
    },
    [hollow, { has: (x, y, z) => inTub(x, y, z) || washerFront(x, y, z) }]
  );
  for (let x = OVEN.x[0] + 3; x <= OVEN.x[1] - 3; x += 3) box(stovePart, [x, x], [14, 14], [0, 7], "chrome"); // the shelf in the oven
  // The dishwasher's upper rack, with two cups upside down in it.
  for (let x = 5; x <= 16; x++) for (let z = -6; z <= 6; z++) if (x % 3 === 0 || z % 3 === 0) stovePart.add(x, 18, z, "chrome");
  for (const cx of [6, 12]) box(stovePart, [cx, cx + 2], [19, 21], [-1, 1], (x, y) => (y === 21 ? "mugBlue" : "china"));
  box(stovePart, [-40, 22], [34, 35], [-11, 9], (x, y, z) => (inSink(x, y, z) ? "steel" : "counterTop"), [hollow]);
  box(stovePart, [15, 16], [36, 36], [-5, -4], (x) => (x === 15 ? "sponge" : "spongeGreen")); // a sponge on the rim
  // The hob: a brushed steel plate, four gas burners (a black cap in a dark ring), two cast iron grates over
  // them, and the four knobs down its right side. The pot stands on the front left burner, the frying pan
  // (its own, `pan`, below) on the front right one.
  const HOB = { x: [-37, -6], z: [-8, 7] };
  const BURNERS = { pot: [-29, 3], pan: [-16, 3], backLeft: [-29, -4], backRight: [-16, -4] };
  box(stovePart, HOB.x, [36, 36], HOB.z, (x, y, z) =>
    x === HOB.x[0] || x === HOB.x[1] || z === HOB.z[0] || z === HOB.z[1] ? "hobEdge" : "hobSteel"
  );
  for (const [bx, bz] of Object.values(BURNERS))
    ellipsoid(stovePart, [bx, 37, bz], [2.3, 0.5, 2.3], (x, y, z) => ((x - bx) ** 2 + (z - bz) ** 2 > 2.2 ? "steelDark" : "burnerCap"));
  for (const [x0, x1] of [
    [-35, -23],
    [-22, -10],
  ]) {
    const cx = (x0 + x1) / 2;
    const bar = (x, z) => x === x0 || x === x1 || z === -7 || z === 6 || z === 0 || x === cx;
    box(stovePart, [x0, x1], [38, 38], [-7, 6], "grate", [{ has: (x, y, z) => !bar(x, z) }]);
    for (const x of [x0, x1]) for (const z of [-7, 6]) stovePart.add(x, 37, z, "grate"); // its feet
  }
  for (const z of [-6, -2, 2, 6]) {
    stovePart.add(-8, 37, z, "knob");
    stovePart.add(-8, 38, z, "knobTop");
  }
  // The pot, with its lid and a handle either side.
  const [potX, potZ] = BURNERS.pot;
  for (let y = 39; y <= 44; y++) ellipsoid(stovePart, [potX, y, potZ], [3.6, 0.5, 3.6], y === 44 ? "steelDark" : "steel");
  stovePart.add(potX, 45, potZ, "hand");
  for (const side of [-1, 1]) box(stovePart, [potX + side * 4, potX + side * 4], [42, 42], [potZ, potZ], "hand");
  // The tap, arching over the sink.
  box(stovePart, [10, 11], [36, 41], [-8, -8], "chrome");
  box(stovePart, [10, 11], [41, 41], [-7, -4], "chrome");
  // Water running from the tap while something is rinsed: a clear column, narrowing as it falls faster,
  // lighter streaks running down it, splashing where it lands in the sink; and the fruit in the sink being washed.
  const streaks = pixelTexture(8, 32, (g, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        g.fillStyle = hash(x, Math.floor(y / 11), 71) < 0.3 ? "#ffffff" : hash(x, Math.floor(y / 5), 72) < 0.5 ? "#cdeefa" : "#a9dcf2";
        g.fillRect(x, y, 1, 1);
      }
  });
  streaks.tex.wrapT = THREE.RepeatWrapping;
  const stream = place(
    stoveGroup,
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.4, 10, 8, 1, true),
      new THREE.MeshBasicMaterial({ map: streaks.tex, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide })
    ),
    [10.5, 35.5, -4]
  );
  stream.visible = false;
  const splashAt = new THREE.Vector3();
  const inSinkFruit = place(stoveGroup, new THREE.Group(), [10.5, 30.5, -0.5]);
  const sinkFruit = Object.fromEntries(
    FRUIT_DISHES.map((kind) => {
      const p = part();
      if (kind === "watermelon") ellipsoid(p, [0, 2, 0], [3.4, 2.3, 2.6], melonStripes(2, 0));
      else
        for (const [x, z] of [
          [-2, -1],
          [0, 1],
          [2, -2],
          [-1, 2],
          [1, -1],
          [3, 1],
        ])
          box(p, [x, x + 1], [1, 2], [z, z + 1], (vx, vy, vz) => ((vx + vy + vz) % 3 === 0 ? "strawSeed" : "strawberry"));
      const m = mesh(p);
      m.visible = false;
      inSinkFruit.add(m);
      return [kind, m];
    })
  );
  // The washing-up liquid behind the sink, left of the tap: a green Fairy bottle shaped like a pear (round
  // and wide low down, narrowing to the neck), a white neck and a red cap, a white oval label with the red
  // name on its front and a red flash higher up. Tipped over the sink for a squeeze while `soap`.
  const fairy = place(stoveGroup, new THREE.Group(), [2, 36, -8]);
  const fairyPart = part();
  const PEAR = [1.7, 2.1, 2.1, 1.9, 1.5, 1.2, 1, 0.6, 0.7, 0.7];
  for (let y = 0; y <= 9; y++) {
    const r = PEAR[y];
    ellipsoid(fairyPart, [0, y, 0], [r, 0.5, r], (x, vy, z) => {
      if (vy >= 8) return "fairyCap";
      if (vy === 7) return "white";
      const face = z > r - 1;
      if (face && vy >= 1 && vy <= 3 && Math.abs(x) <= 1) return vy === 2 && Math.abs(x) < 0.5 ? "fairyCap" : "fairyLabel";
      if (face && vy === 5) return "fairyCap";
      return hash(x, vy, z) < 0.3 ? "fairyGreenDark" : "fairyGreen";
    });
  }
  fairy.add(mesh(fairyPart));
  const sink = { running: false, fruit: null, soap: false, tip: 0 };
  updates.push((t, dt) => {
    sink.tip += ((sink.soap ? 1 : 0) - sink.tip) * (1 - Math.exp(-8 * dt));
    fairy.rotation.z = -1.1 * sink.tip; // its top over towards the sink
    fairy.position.y = 36 + 3 * sink.tip; // lifted off the worktop
    stream.visible = sink.running;
    if (sink.running) {
      streaks.tex.offset.y = (t * 3) % 1; // (running down)
      stream.scale.x = stream.scale.z = 0.92 + 0.08 * Math.sin(t * 37);
      // A few drops thrown up where it lands, gone before they fall back (the sink's floor is not the ground).
      stream.localToWorld(splashAt.set(0, -5, 0));
      for (let k = Math.random() * 90 * dt; k > 0; k--) {
        const a = Math.random() * Math.PI * 2;
        water.emit("splash", splashAt.x, splashAt.y + 0.3, splashAt.z, Math.cos(a) * 9, 14 + Math.random() * 10, Math.sin(a) * 9, 0.2);
      }
    }
    Object.entries(sinkFruit).forEach(([kind, m]) => (m.visible = sink.fruit === kind));
  });
  // Wall cupboards with green doors glazed in clear glass, four side by side, each with a shelf: through the
  // glass, tumblers and wine glasses, jars of rice, pasta, beans and lentils, oil, and a stack of bowls.
  const doorU = (x) => (((x + 22) % 11) + 11) % 11;
  const pane = (x, y) => y >= 59 && y <= 73 && y !== 66 && doorU(x) >= 2 && doorU(x) <= 9;
  const inCupboard = { has: (x, y, z) => doorU(x) !== 0 && y > 56 && y < 76 && z > -10 && z < -4 };
  box(
    stovePart,
    [-22, 21],
    [56, 76],
    [-10, -4],
    (x, y, z) => (z < -4 || y === 56 || y === 76 ? "cabinet" : doorU(x) === 0 ? "cabinetLine" : "cabinetGreen"),
    [inCupboard, { has: (x, y, z) => z === -4 && pane(x, y) }]
  );
  box(stovePart, [-21, 20], [57, 75], [-9, -9], (x) => (doorU(x) === 0 ? "cabinetLine" : "cupboardInside")); // the back inside
  box(stovePart, [-21, 20], [66, 66], [-9, -5], (x) => (doorU(x) === 0 ? "cabinetLine" : "cabinet")); // the shelves
  const tumbler = (x, y, z) => box(stovePart, [x, x + 1], [y, y + 2], [z, z + 1], (vx, vy) => (vy === y + 2 ? "glasswareRim" : "glassware"));
  const wine = (x, y, z) => {
    stovePart.add(x, y, z, "glassware");
    stovePart.add(x, y + 1, z, "glassware");
    box(stovePart, [x, x + 1], [y + 2, y + 3], [z, z], (vx, vy) => (vy === y + 3 ? "glasswareRim" : "glassware"));
  };
  const jar = (x, y, z, food) => {
    box(stovePart, [x, x + 2], [y, y + 3], [z, z + 1], food);
    box(stovePart, [x, x + 2], [y + 4, y + 4], [z, z + 1], "jarLid");
  };
  // The bottom shelves, from the left: glasses; a stack of bowls; jars; oil and more glasses. Then the top.
  for (const x of [-20, -17, -14]) tumbler(x, 57, -7);
  for (let y = 57; y <= 61; y += 2) box(stovePart, [-9, -4], [y, y + 1], [-8, -6], (vx, vy) => (vy === y + 1 ? "bowlRim" : "white"));
  jar(1, 57, -8, "rice");
  jar(5, 57, -8, "pasta");
  for (let y = 57; y <= 63; y++) stovePart.add(13, y, -7, y >= 62 ? (y === 63 ? "jarLid" : "glassware") : "oliveOil");
  tumbler(16, 57, -7);
  for (const x of [-20, -17, -14]) wine(x, 67, -7);
  jar(-9, 67, -8, "beans");
  jar(-5, 67, -8, "lentils");
  for (const x of [2, 5, 8]) tumbler(x, 67, -7);
  jar(13, 67, -8, "rice");
  jar(17, 67, -8, "pasta");
  stoveGroup.add(mesh(stovePart));
  // The glass: barely tinted, with a gleam across each pane.
  const glassTex = pixelTexture(16, 16, (g, w, h) => {
    g.fillStyle = "rgba(220, 240, 236, 0.16)";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (let k = 0; k < w; k++) g.fillRect(k, h - 1 - k - 6, 2, 1);
  });
  const glassMat = new THREE.MeshBasicMaterial({ map: glassTex.tex, transparent: true, depthWrite: false });
  for (let x0 = -22; x0 < 21; x0 += 11)
    for (const [y0, y1] of [
      [59, 65],
      [67, 73],
    ])
      place(stoveGroup, new THREE.Mesh(new THREE.PlaneGeometry(8, y1 - y0 + 1), glassMat), [x0 + 5.5, (y0 + y1) / 2, -3.6]);
  turnedFootprint(STOVE, STOVE_YAW, [-40, 22, -11, 9]);
  // The oven's door, hinged along the bottom: a window in it, dark, or lit warm while it bakes, and the
  // handle along the top. Inside, the glow of the heating element and what is baking on the shelf.
  const ovenDoor = pivotGroup(stoveGroup, [0, OVEN.y[0] - 0.5, 8.5]);
  const ovenDoorPart = part();
  const PANE = { x: [OVEN.x[0] + 3, OVEN.x[1] - 3], y: [12, 22] };
  const inPane = (x, y) => x >= PANE.x[0] && x <= PANE.x[1] && y >= PANE.y[0] && y <= PANE.y[1];
  box(ovenDoorPart, OVEN.x, OVEN.y, [9, 9], (x, y) => (inPane(x, y) ? "hob" : "steel"));
  box(ovenDoorPart, [OVEN.x[0] + 2, OVEN.x[1] - 2], [25, 25], [10, 10], "steelDark"); // the handle
  ovenDoor.inner.add(mesh(ovenDoorPart));
  const ovenPane = place(
    ovenDoor.inner,
    new THREE.Mesh(
      new THREE.PlaneGeometry(PANE.x[1] - PANE.x[0] + 1, PANE.y[1] - PANE.y[0] + 1),
      new THREE.MeshBasicMaterial({ color: COLORS.ovenGlow, transparent: true, opacity: 0.6 })
    ),
    [(PANE.x[0] + PANE.x[1]) / 2, (PANE.y[0] + PANE.y[1]) / 2, 9.55]
  );
  const element = place(stoveGroup, new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 7), new THREE.MeshBasicMaterial({ color: COLORS.ovenGlow })), [
    OVEN_MID,
    24.2,
    3,
  ]);
  const ovenDish = place(stoveGroup, new THREE.Group(), [OVEN_MID, 15, 3.5]);
  const ovenDishes = Object.fromEntries(DISHES.map((kind) => [kind, place(ovenDish, buildDish(kind), [0, 0, 0])]));
  const ovenLight = new THREE.PointLight(0xffb060, 0, 40, 0);
  ovenLight.position.set(OVEN_MID, 16, 14);
  stoveGroup.add(ovenLight);
  // `on` while baking, `open` while someone has the door down, `dish` what is in it (props.js's DISHES) and
  // `baked` how far it is done (0 to 1: it browns as it bakes).
  const oven = { on: false, open: false, dish: null, baked: 0, k: 0 };
  const BAKE_SECS = 15;
  updates.push((t, dt) => {
    if (oven.on) oven.baked = Math.min(1, oven.baked + dt / BAKE_SECS);
    if (oven.dish) ovenDishes[oven.dish].userData.bake(oven.baked);
    oven.k += ((oven.open ? 1 : 0) - oven.k) * (1 - Math.exp(-7 * dt));
    ovenDoor.outer.rotation.x = 1.35 * oven.k;
    ovenPane.visible = element.visible = oven.on;
    ovenLight.intensity = oven.on ? 0.5 + 0.08 * Math.sin(t * 9) : 0;
    Object.entries(ovenDishes).forEach(([kind, m]) => (m.visible = oven.dish === kind));
  });
  // The dishwasher: a white door hinged along the bottom, dropping down into the room, with a big window in
  // it onto the racks inside, and along its top a dark panel of keys and a little teal display that lights
  // up while it washes; the lower rack rolling out once the door is down, with whatever has been put in it
  // standing in a row (`load` of them), and back in before it shuts.
  const WINDOW = { x: [5, 16], y: [WASHER.y[0] + 3, WASHER.y[1] - 6] };
  const inWindow = (x, y) => x >= WINDOW.x[0] && x <= WINDOW.x[1] && y >= WINDOW.y[0] && y <= WINDOW.y[1];
  const washerDoor = pivotGroup(stoveGroup, [0, WASHER.y[0] - 0.5, 8.5]);
  const washerDoorPart = part();
  box(
    washerDoorPart,
    WASHER.x,
    WASHER.y,
    [8, 8],
    (x, y) => (y >= WASHER.y[1] - 3 ? "washerPanel" : x === WASHER.x[0] || x === WASHER.x[1] || y === WASHER.y[0] ? "washerShade" : "washerWhite"),
    [{ has: (x, y) => inWindow(x, y) }]
  );
  for (const x of [5, 7, 13, 15]) washerDoorPart.add(x, WASHER.y[1] - 1, 8.4, "washerKey"); // the keys
  washerDoor.inner.add(mesh(washerDoorPart));
  const washerGlass = place(
    washerDoor.inner,
    new THREE.Mesh(
      new THREE.PlaneGeometry(WINDOW.x[1] - WINDOW.x[0] + 1, WINDOW.y[1] - WINDOW.y[0] + 1),
      new THREE.MeshBasicMaterial({ color: "#d9ecf2", transparent: true, opacity: 0.18, depthWrite: false })
    ),
    [(WINDOW.x[0] + WINDOW.x[1]) / 2, (WINDOW.y[0] + WINDOW.y[1]) / 2, 8.3]
  );
  washerGlass.renderOrder = 1;
  const washerLight = place(washerDoor.inner, new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), new THREE.MeshBasicMaterial({ color: "#24474a" })), [
    10.5,
    WASHER.y[1] - 1.5,
    8.55,
  ]);
  const washerRack = place(stoveGroup, new THREE.Group(), [0, 0, 0]);
  const rackPart = part();
  const RACK_Y = WASHER.y[0] + 2;
  for (let x = 5; x <= 16; x++)
    for (let z = -6; z <= 6; z++) {
      if (x % 3 === 0 || z % 3 === 0) rackPart.add(x, RACK_Y, z, "chrome");
      if (x === 5 || x === 16 || Math.abs(z) === 6) rackPart.add(x, RACK_Y + 1, z, "chrome");
    }
  washerRack.add(mesh(rackPart));
  const RACK_SLOTS = 6;
  const racked = Array.from({ length: RACK_SLOTS }, (_, k) => {
    const p = part();
    const x = 5.5 + k * 2;
    for (let dy = -4; dy <= 4; dy++)
      for (let dz = -4; dz <= 4; dz++) {
        const d = dy * dy + dz * dz;
        if (d <= 13) p.add(Math.round(x), RACK_Y + 5 + dy, dz, d > 8 ? "chinaBlue" : "china");
      }
    const m = mesh(p);
    m.visible = false;
    washerRack.add(m);
    return m;
  });
  // `open` while someone loads it, `load` what is in it (up to `slots`), `start(t)` washing it for a while
  // (it empties itself when done: put away, clean).
  const WASH_SECS = 60;
  const dishwasher = {
    open: false,
    load: 0,
    slots: RACK_SLOTS,
    running: false,
    k: 0, // how far the door is down
    out: 0, // how far the rack is out
    until: 0,
    start(t) {
      dishwasher.running = true;
      dishwasher.until = t + WASH_SECS;
    },
  };
  updates.push((t, dt) => {
    // The door down first, then the rack out; the rack back in first, then the door up.
    const rackGoal = dishwasher.open && dishwasher.k > 0.85 ? 1 : 0;
    dishwasher.out += (rackGoal - dishwasher.out) * (1 - Math.exp(-6 * dt));
    const doorGoal = dishwasher.open || dishwasher.out > 0.08 ? 1 : 0;
    dishwasher.k += (doorGoal - dishwasher.k) * (1 - Math.exp(-6 * dt));
    washerDoor.outer.rotation.x = 1.45 * dishwasher.k;
    washerRack.position.z = 11 * dishwasher.out;
    racked.forEach((m, k) => (m.visible = k < dishwasher.load));
    if (dishwasher.running && t > dishwasher.until) {
      dishwasher.running = false;
      dishwasher.load = 0;
    }
    washerLight.material.color.set(dishwasher.running ? (Math.sin(t * 2) > -0.6 ? "#5ff0e2" : "#3cc4b8") : "#24474a");
  });

  // While someone cooks: a ring of blue gas flames flickering under the pot or the pan; steam rising off
  // the pot; in the pan, what is frying (`frying`) sizzling, sparks of oil spitting and wisps of smoke, all
  // of it flying up and falling back in as the pan is tossed (`tossing`: props.js's tossAt, in time with
  // the cook's arm).
  const flames = Object.fromEntries(
    ["pot", "pan"].map((key) => {
      const [bx, bz] = BURNERS[key];
      const ring = cells(
        [...Array(20)].map((_, a) => [
          bx + Math.round(3 * Math.cos((a * Math.PI) / 10)),
          37.6,
          bz + Math.round(3 * Math.sin((a * Math.PI) / 10)),
          a % 2 ? "flame" : "flameCore",
        ]),
        COLORS
      );
      ring.material = new THREE.MeshBasicMaterial({ vertexColors: true });
      ring.visible = false;
      stoveGroup.add(ring);
      return [key, ring];
    })
  );
  const puff = (parent, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    m.visible = false;
    parent.add(m);
    return m;
  };
  const potTop = turned(STOVE, STOVE_YAW, BURNERS.pot);
  const puffs = [0, 1, 2, 3, 4].map(() => puff(house, "#dfe7ee"));
  const pan = place(stoveGroup, new THREE.Group(), [BURNERS.pan[0], 39, BURNERS.pan[1]]);
  // A beige ceramic pan, standing out against the black grates: a darker beige inside, a pale lip, and a
  // wooden handle out to the front on a black collar.
  const panPart = part();
  ellipsoid(panPart, [0, 0, 0], [3.4, 0.5, 3.4], (x, y, z) => (x * x + z * z > 8 ? "panSide" : "panBlack"));
  for (let a = 0; a < 24; a++)
    panPart.add(Math.round(3.4 * Math.cos((a * Math.PI) / 12)), 1, Math.round(3.4 * Math.sin((a * Math.PI) / 12)), "panLip");
  box(panPart, [0, 0], [1, 1], [4, 9], (x, y, z) => (z <= 5 ? "panCollar" : "panHandle")); // the handle, out to the front
  pan.add(mesh(panPart));
  const FRY = [
    [-1.6, -1.2, "fryGreen"],
    [0, -1.8, "fryRed"],
    [1.6, -0.8, "fryGreen"],
    [-1.4, 0.8, "fryYellow"],
    [0.3, 0.3, "fryMeat"],
    [1.5, 1.4, "fryGreen"],
    [-0.3, 1.9, "fryMeat"],
  ];
  const bits = FRY.map(([x, z, color]) => {
    const m = cells([[0, 0, 0, color]], COLORS);
    m.visible = false;
    pan.add(m);
    return { m, x, z };
  });
  const sparks = [0, 1, 2, 3].map(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: COLORS.spark }));
    m.visible = false;
    pan.add(m);
    return m;
  });
  const smoke = [0, 1, 2].map(() => puff(pan, "#d3d6d9"));
  const panTop = turned(STOVE, STOVE_YAW, BURNERS.pan);
  const stove = {
    pot: [potTop[0], 44, potTop[1]],
    pan: [panTop[0], 40, panTop[1]],
    potOn: false,
    panOn: false,
    frying: false,
    tossing: false,
  };
  updates.push((t) => {
    flames.pot.visible = stove.potOn;
    flames.pan.visible = stove.panOn;
    Object.values(flames).forEach((ring, i) => (ring.position.y = 0.15 * Math.sin(t * 23 + i * 2)));
    puffs.forEach((m, i) => {
      const k = (t * 0.5 + i / 5) % 1;
      m.visible = stove.potOn;
      m.position.set(potTop[0] + 2 * Math.sin(t * 2 + i * 2) * k, 47 + 18 * k, potTop[1] + 2 * Math.cos(t * 1.7 + i) * k);
      m.material.opacity = 0.95 * (1 - k * k);
      m.scale.setScalar(0.8 + 0.9 * k);
    });
    // The pan: drawn back and flicked forward, its front lifting, while it is tossed.
    const toss = stove.tossing ? tossAt(t) : null;
    pan.position.z = BURNERS.pan[1] + (toss ? toss.slide : 0);
    pan.rotation.x = toss ? -0.2 * toss.lift : 0;
    bits.forEach(({ m, x, z }, i) => {
      const hop = toss ? toss.hop(i) : 0;
      m.visible = stove.frying;
      m.position.set(x, 1 + 6 * hop + (stove.panOn ? 0.15 * Math.max(0, Math.sin(t * 19 + i * 1.7)) : 0), z - 1.5 * hop);
      m.rotation.set(hop * 5, hop * 3, 0);
    });
    sparks.forEach((m, i) => {
      const k = (t * 1.7 + i * 0.37) % 1;
      const a = i * 1.9 + Math.floor(t * 1.7 + i * 0.37) * 2.3; // a new place each time
      m.visible = stove.frying && stove.panOn && k < 0.5;
      m.position.set(1.8 * Math.cos(a), 1.5 + 6 * Math.sin(Math.PI * 2 * k), 1.8 * Math.sin(a));
    });
    smoke.forEach((m, i) => {
      const k = (t * 0.4 + i / 3) % 1;
      m.visible = stove.frying && stove.panOn;
      m.position.set(1.5 * Math.sin(t * 1.5 + i * 2) * k, 2 + 14 * k, 1.5 * Math.cos(t * 1.2 + i) * k);
      m.material.opacity = 0.45 * Math.sin(Math.PI * k);
      m.scale.setScalar(0.6 + 1.2 * k);
    });
  });

  // The pets' bowls by the kitchen: the collie's blue, the cat's pink, as on the profile page. While a pet
  // eats, its own bowl (with the food in it) stands in exactly the same place.
  const BOWLS = { collie: [-92, -44], cat: [-68, -44] };
  const bowls = {};
  for (const [name, [x, z], radius, colors] of [
    ["collie", BOWLS.collie, 5, ["bowlBlue", "bowlBlueRim"]],
    ["cat", BOWLS.cat, 4, ["bowlPink", "bowlPinkRim"]],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    house.add(g);
    foodBowl(g, { ...COLORS, bowl: COLORS[colors[0]], bowlRim: COLORS[colors[1]] }, 0, radius)({ state: "eat", elapsed: 0, progress: 1 }); // just the empty bowl
    bowls[name] = g;
  }

  return {
    underShelf,
    FRIDGE,
    store,
    restockCrisper,
    fridge,
    COUNTER,
    cupboard,
    front,
    keys,
    BROLLY_RACK,
    standUmbrellas,
    BIN,
    bin,
    STOVE,
    STOVE_YAW,
    sink,
    dishwasher,
    oven,
    OVEN,
    potTop,
    panTop,
    stove,
    BOWLS,
    bowls,
  };
}
