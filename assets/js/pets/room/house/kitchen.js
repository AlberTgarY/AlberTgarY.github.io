/*******************************************************************************
 * The kitchen: the fridge, the counter, the stove with its oven and sink, the
 * cupboards and the pets' bowls.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, foodBowl, cells } from "../../models/voxels.js";
import { DISHES, FRUIT_DISHES, buildDish } from "../props.js";
import { stockFridge, stockCrisper, shopCrisper, stockFreezer } from "../fridge-food.js";
import { melonStripes } from "../veg.js";
import { BACK } from "./layout.js";
import { COLORS, pixelTexture, solid, glowing, place, turned } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildKitchen(shared) {
  const { house, mesh, updates, clickables, footprint, turnedFootprint } = shared;

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
    (p) => {
      box(p, [-13, 12], [3, SPLIT - 2], [1, 1], "inside");
      for (const y of [15, 27]) box(p, [-13, 12], [y, y], [2, 7], "insideShelf");
      // The crisper drawer: frosted sides and front, low enough for what is in it to show over the top, a
      // finger hold in the middle, and the glass shelf over it.
      box(p, [-13, 12], [3, 3], [2, 7], "crisperRim");
      for (const x of [-13, 12]) box(p, [x, x], [4, 6], [2, 7], "crisper");
      box(p, [-13, 12], [4, 6], [7, 7], (x, y) => (y === 6 ? "crisperRim" : Math.abs(x + 0.5) <= 1.5 && y === 5 ? "crisperHandle" : "crisper"));
      box(p, [-13, 12], [9, 9], [2, 7], "insideShelf");
      stockFridge(p);
    },
    (p) => {
      box(p, [-13, 12], [SPLIT + 2, TOP - 2], [1, 1], "inside");
      box(p, [-13, 12], [50, 50], [2, 7], "insideShelf");
      stockFreezer(p);
    },
  ];
  const insides = insideOf.map(() => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), glowing); // lit from within
    m.visible = false;
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
    const p = part();
    insideOf[i](p);
    insides[i].geometry.dispose();
    insides[i].geometry = solid(p).geometry;
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
  const fridgeLight = new THREE.PointLight(0xeaf6ff, 0, 50, 0);
  fridgeLight.position.set(0, 30, 14);
  fridgeGroup.add(fridgeLight);
  footprint(FRIDGE[0] - 16, FRIDGE[0] + 15, BACK, FRIDGE[1] + 12);
  // `openers` stand at the fridge with its door open, `freezers` at the freezer; `clicked` opens a door
  // too (a click on the fridge opens or shuts its door, on the freezer the freezer's), and whoever is at it
  // keeps it open till they are done.
  const fridge = { openers: 0, freezers: 0, k: [0, 0], clicked: [false, false] };
  // Its body, doors and what shows inside them when open (so a click on the open fridge shuts it).
  clickables.push({ parts: [fridgeGroup.children[0], doors[0].part, insides[0], crisper], toggle: () => (fridge.clicked[0] = !fridge.clicked[0]) });
  clickables.push({ parts: [doors[1].part, insides[1]], toggle: () => (fridge.clicked[1] = !fridge.clicked[1]) });
  updates.push((t, dt) => {
    [fridge.openers, fridge.freezers].forEach((n, i) => {
      const open = n > 0 || fridge.clicked[i];
      if (open && fridge.k[i] < 0.02) restock(i); // opening from shut
      fridge.k[i] += ((open ? 1 : 0) - fridge.k[i]) * (1 - Math.exp(-5 * dt));
      doors[i].rotation.y = -1.6 * fridge.k[i];
      insides[i].visible = fridge.k[i] > 0.02;
    });
    crisper.visible = insides[0].visible;
    fridgeLight.intensity = 0.8 * Math.max(...fridge.k);
  });

  // The counter: cupboards under a walnut top (the pets' food in one of them), and on it, along the back,
  // what they cook with: Lee Kum Kee's light soy sauce and oyster sauce, a black pepper and a pink salt
  // grinder, a pouch of garlic chilli sauce and a jar of chilli oil; the house keys in front (`keys`). A
  // shelf of mugs on the wall above.
  const COUNTER = [-95, -100];
  const counter = part();
  box(counter, [-21, 20], [0, 33], [-10, 8], (x, y, z) => {
    if (y <= 2) return "cabinetLine";
    if (z === 8 && (x === -8 || x === 7 || y === 28)) return "cabinetLine";
    return "cabinet";
  });
  for (const x of [-11, -4, 10]) counter.add(x, 24, 9, "brass");
  box(counter, [-22, 21], [34, 35], [-11, 10], "counterTop");
  // Something round standing on the counter at (cx, cz): radius `r(y)` from y0 to y1, coloured `c(x, y, z)`,
  // where z - cz > r - 1 is its front, towards the room.
  const upright = (cx, cz, y0, y1, r, c, power = 2) => {
    for (let y = y0; y <= y1; y++) ellipsoid(counter, [cx, y, cz], [r(y), 0.5, r(y)], (x, vy, z) => c(x - cx, vy, z - cz, r(y)), [], power);
  };
  const front = (z, r) => z > r - 1.2;
  const back = -5;
  // The soy sauce: a tall dark bottle, its red label banded in gold with a white panel, a red cap.
  upright(
    -17,
    back,
    36,
    52,
    (y) => (y <= 47 ? 1.7 : y === 48 ? 1.2 : 0.6),
    (x, y, z, r) =>
      y >= 51
        ? "lkkRed"
        : y >= 39 && y <= 45
          ? y === 42
            ? "lkkGold"
            : front(z, r) && y === 44 && Math.abs(x) <= 0.5
              ? "pouchLabel"
              : "lkkRed"
          : "soyBottle"
  );
  // The oyster sauce: a squat bottle, its label red with a teal band and gold edges and a little gold sign.
  upright(
    -11,
    back,
    36,
    48,
    (y) => (y <= 44 ? 2.2 : y === 45 ? 1.6 : y === 46 ? 0.8 : 1.3),
    (x, y, z, r) =>
      y >= 47
        ? "lkkRed"
        : y >= 37 && y <= 43
          ? y === 37 || y === 43
            ? "lkkGold"
            : y === 40
              ? "lkkTeal"
              : front(z, r) && y === 42 && x === 0
                ? "lkkGold"
                : "lkkRed"
          : "soyBottle"
  );
  // The grinders: glass bodies narrowing a little at the waist, full of peppercorns or pink salt, under
  // brushed steel tops.
  [
    [-5, ["pepperCorn", "pepperCornLight", "pepperCorn"]],
    [-1, ["pinkSalt", "pinkSaltLight", "pinkSaltDeep"]],
  ].forEach(([cx, [c0, c1, c2]]) =>
    upright(
      cx,
      back - 1,
      36,
      52,
      (y) => (y <= 45 ? 1.8 - 0.45 * Math.sin((Math.PI * (y - 36)) / 9) : y <= 50 ? 1.8 : 1.3),
      (x, y, z, r) => {
        if (y >= 46) return y === 46 || y === 51 ? "chrome" : y === 48 ? "steelDark" : x < 0 && front(z, r) ? "chrome" : "steel";
        if (front(z, r) && x === -1 && y > 37 && y < 44) return "glasswareRim"; // the gleam on the glass
        const h = hash(x, y, z + cx);
        return h < 0.25 ? c1 : h < 0.4 ? c2 : c0;
      }
    )
  );
  // The garlic chilli sauce: a red stand-up pouch, its label a cream panel with the green of the garlic and
  // the red of the chillies, its spout up at the corner with a red cap.
  box(
    counter,
    [3, 8],
    [36, 47],
    [back - 1, back],
    (x, y, z) => {
      if (z === back && x >= 4 && x <= 7 && y >= 39 && y <= 44)
        return y === 44 ? "pouchRed" : y === 40 && x <= 5 ? "pouchGreen" : y === 41 && x >= 6 ? "chiliOil" : "pouchLabel";
      return "pouchRed";
    },
    [{ has: (x, y) => y === 47 && (x === 3 || x === 8) }] // its rounded top corners
  );
  counter.add(7, 48, back, "white");
  counter.add(7, 49, back, "chiliLid");
  // The chilli oil: a squat glass jar of red oil thick with chilli flakes, a yellow label round it with a
  // red band, and a red lid edged in yellow.
  upright(
    13,
    back,
    36,
    45,
    (y) => (y <= 43 ? 2.6 : 2.4),
    (x, y, z, r) =>
      y >= 44
        ? y === 45 && Math.hypot(x, z) > 1.6
          ? "chiliLabel"
          : "chiliLid"
        : y >= 38 && y <= 42
          ? y === 40
            ? "chiliLid"
            : "chiliLabel"
          : hash(x, y, z) < 0.35
            ? "chiliFlake"
            : "chiliOil",
    3
  );
  place(house, mesh(counter), [COUNTER[0], 0, COUNTER[1]]);
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

  // The stove against the left wall: an oven under a hob with a pot on it, a sink sunk into the worktop
  // with a tap and a sponge, cupboards, and wall cupboards with green glass doors above. Built facing +z,
  // then turned to face the room.
  const STOVE = [-140, -30];
  const STOVE_YAW = Math.PI / 2;
  const stoveGroup = place(house, new THREE.Group(), [STOVE[0], 0, STOVE[1]], STOVE_YAW);
  const stovePart = part();
  // Left hollow: the oven's inside (behind its door) and the sink's basin.
  const OVEN = { x: [-18, -3], y: [6, 27] };
  const hollow = part();
  box(hollow, [-16, -5], [8, 24], [-1, 8], "hob");
  box(hollow, [5, 16], [30, 35], [-5, 4], "hob");
  const inOven = (x, y, z) => x >= -17 && x <= -4 && y >= 7 && y <= 25 && z >= -2;
  const inSink = (x, y, z) => x >= 4 && x <= 17 && y >= 29 && z >= -6 && z <= 5;
  box(
    stovePart,
    [-22, 21],
    [0, 33],
    [-10, 8],
    (x, y, z) => {
      if (inOven(x, y, z)) return "ovenInside";
      if (inSink(x, y, z)) return y === 29 && Math.abs(x - 10.5) <= 1 && Math.abs(z + 0.5) <= 1 ? "chrome" : y === 29 ? "steelDark" : "steel";
      if (y <= 2) return "cabinetLine";
      if (z === 8 && x >= OVEN.x[0] && x <= OVEN.x[1] && y >= OVEN.y[0] && y <= OVEN.y[1]) return "steel"; // behind the door
      if (z === 8 && (x === -20 || x === -1 || x === 10 || y === 28)) return "cabinetLine";
      return "cabinet";
    },
    [hollow]
  );
  for (let x = -15; x <= -6; x += 3) box(stovePart, [x, x], [14, 14], [0, 7], "chrome"); // the shelf in the oven
  for (const x of [5, 15]) stovePart.add(x, 24, 9, "brass");
  box(stovePart, [-23, 22], [34, 35], [-11, 9], (x, y, z) => (inSink(x, y, z) ? "steel" : "counterTop"), [hollow]);
  box(stovePart, [15, 16], [36, 36], [-5, -4], (x) => (x === 15 ? "sponge" : "spongeGreen")); // a sponge on the rim
  box(stovePart, [-19, -3], [36, 36], [-6, 6], "hob");
  for (const [bx, bz] of [
    [-15, -3],
    [-7, 2],
  ])
    for (let a = 0; a < 16; a++)
      stovePart.add(bx + Math.round(2.5 * Math.cos((a * Math.PI) / 8)), 36.4, bz + Math.round(2.5 * Math.sin((a * Math.PI) / 8)), "steelDark");
  // The pot, on the front burner, with its lid.
  for (let y = 37; y <= 42; y++) ellipsoid(stovePart, [-7, y, 2], [3.6, 0.5, 3.6], y === 42 ? "steelDark" : "steel");
  stovePart.add(-7, 43, 2, "hand");
  box(stovePart, [-11, -11], [40, 40], [2, 2], "hand"); // a handle
  // The tap, arching over the sink.
  box(stovePart, [10, 11], [36, 41], [-8, -8], "chrome");
  box(stovePart, [10, 11], [41, 41], [-7, -4], "chrome");
  // Water running from the tap while something is rinsed, and the fruit in the sink being washed.
  const stream = place(
    stoveGroup,
    new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), new THREE.MeshBasicMaterial({ color: "#bfe6f6", transparent: true, opacity: 0.7 })),
    [10.5, 35.5, -4]
  );
  stream.visible = false;
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
  const sink = { running: false, fruit: null };
  updates.push((t) => {
    stream.visible = sink.running;
    stream.scale.x = stream.scale.z = 0.85 + 0.15 * Math.sin(t * 40);
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
  turnedFootprint(STOVE, STOVE_YAW, [-23, 22, -11, 9]);
  // The oven's door, hinged along the bottom: a window in it, dark, or lit warm while it bakes, and the
  // handle along the top. Inside, the glow of the heating element and what is baking on the shelf.
  const ovenDoor = pivotGroup(stoveGroup, [0, OVEN.y[0] - 0.5, 8.5]);
  const ovenDoorPart = part();
  const PANE = { x: [-15, -6], y: [12, 22] };
  const inPane = (x, y) => x >= PANE.x[0] && x <= PANE.x[1] && y >= PANE.y[0] && y <= PANE.y[1];
  box(ovenDoorPart, OVEN.x, OVEN.y, [9, 9], (x, y) => (inPane(x, y) ? "hob" : "steel"));
  box(ovenDoorPart, [-16, -5], [25, 25], [10, 10], "steelDark"); // the handle
  ovenDoor.inner.add(mesh(ovenDoorPart));
  const ovenPane = place(
    ovenDoor.inner,
    new THREE.Mesh(
      new THREE.PlaneGeometry(PANE.x[1] - PANE.x[0] + 1, PANE.y[1] - PANE.y[0] + 1),
      new THREE.MeshBasicMaterial({ color: COLORS.ovenGlow, transparent: true, opacity: 0.6 })
    ),
    [(PANE.x[0] + PANE.x[1]) / 2, (PANE.y[0] + PANE.y[1]) / 2, 9.55]
  );
  const element = place(
    stoveGroup,
    new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 7), new THREE.MeshBasicMaterial({ color: COLORS.ovenGlow })),
    [-10.5, 24.2, 3]
  );
  const ovenDish = place(stoveGroup, new THREE.Group(), [-10.5, 15, 3.5]);
  const ovenDishes = Object.fromEntries(DISHES.map((kind) => [kind, place(ovenDish, buildDish(kind), [0, 0, 0])]));
  const ovenLight = new THREE.PointLight(0xffb060, 0, 40, 0);
  ovenLight.position.set(-10.5, 16, 14);
  stoveGroup.add(ovenLight);
  // `on` while baking, `open` while someone has the door down, `dish` what is in it (props.js's DISHES).
  const oven = { on: false, open: false, dish: null, k: 0 };
  updates.push((t, dt) => {
    oven.k += ((oven.open ? 1 : 0) - oven.k) * (1 - Math.exp(-7 * dt));
    ovenDoor.outer.rotation.x = 1.35 * oven.k;
    ovenPane.visible = element.visible = oven.on;
    ovenLight.intensity = oven.on ? 0.5 + 0.08 * Math.sin(t * 9) : 0;
    Object.entries(ovenDishes).forEach(([kind, m]) => (m.visible = oven.dish === kind));
  });
  // While someone cooks: the burner glows under the pot and steam rises off it.
  const glow = cells(
    [...Array(24)].map((_, a) => [
      -7 + Math.round(4.6 * Math.cos((a * Math.PI) / 12)),
      36.5,
      2 + Math.round(4.6 * Math.sin((a * Math.PI) / 12)),
      "kettle",
    ]),
    COLORS
  );
  glow.material = new THREE.MeshBasicMaterial();
  glow.visible = false;
  stoveGroup.add(glow);
  const potTop = turned(STOVE, STOVE_YAW, [-7, 2]);
  const puffs = [0, 1, 2, 3, 4].map(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: "#dfe7ee", transparent: true, depthWrite: false }));
    m.visible = false;
    house.add(m);
    return m;
  });
  const stove = { on: false, pot: [potTop[0], 42, potTop[1]] };
  updates.push((t) => {
    glow.visible = stove.on;
    puffs.forEach((m, i) => {
      const k = (t * 0.5 + i / 5) % 1;
      m.visible = stove.on;
      m.position.set(potTop[0] + 2 * Math.sin(t * 2 + i * 2) * k, 45 + 18 * k, potTop[1] + 2 * Math.cos(t * 1.7 + i) * k);
      m.material.opacity = 0.95 * (1 - k * k);
      m.scale.setScalar(0.8 + 0.9 * k);
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
    FRIDGE,
    store,
    restockCrisper,
    fridge,
    COUNTER,
    front,
    keys,
    BROLLY_RACK,
    standUmbrellas,
    BIN,
    bin,
    STOVE,
    STOVE_YAW,
    sink,
    oven,
    potTop,
    stove,
    BOWLS,
    bowls,
  };
}
