/*******************************************************************************
 * Things the girl holds, and things that pop up around her (her model is in
 * girl.js). Each builder makes its meshes, hidden, attaches them where they
 * belong, and returns what her animation needs to show and move them.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, easeOutBack, smoothstep, cells } from "./voxels.js";

export const PROP_COLORS = {
  cucumber: "#4f8c35",
  cucumberLight: "#7cb257",
  cucumberCut: "#d9ebb2",
  china: "#f4f1ea",
  chinaBlue: "#5a7fc4",
  rice: "#fdfbf4",
  pork: "#7a3f22",
  porkGlaze: "#a65a30",
  egg: "#fff4e0",
  yolk: "#f2b233",
  greens: "#5aa43c",
  chopstick: "#c99a5b",
  bag: "#d9b27c",
  bagFold: "#c49a62",
  bone: "#fff8ec",
  grape: "#8434c4",
  grapeDeep: "#5a2489",
  grapeLight: "#a35fe0",
  foam: "#fbf4ff",
  plastic: "#eee8f8",
  straw: "#f7f4fb",
  can: "#9cc9ec",
  canDark: "#6fa6d6",
  water: "#8ecdf5",
  pot: "#c66f45",
  potRim: "#dc8a5f",
  soil: "#5a3b28",
  stem: "#4f9a3a",
  leaf: "#6fbf4f",
  // Petals: saturated and far apart in hue, so they still read apart when the flower is a few px across.
  red: "#d8262c",
  yellow: "#ffe85a",
  lilac: "#a47cec",
  white: "#ffffff",
  pink: "#ff6fb4",
  flowerEye: "#f2b233",
  flowerEyeDeep: "#d9822b",
  sofa: "#c8774e",
  sofaShade: "#b0653f",
  cushion: "#e09a6e",
  sofaLeg: "#6b4630",
  throw: "#e3b04b",
  throwRow: "#cf9a38",
  brass: "#b88a4a",
  shade: "#ffe7b0",
  shadeTrim: "#f4c983",
  plant: "#4f9a3a",
  plantLight: "#74b957",
  wood: "#ecc89c",
  woodDark: "#cf9f6f",
  heart: "#f28aa8",
  sheet: "#fbf8f2",
  pillowTrim: "#d9c8f5",
  quiltPink: "#f9cfdc",
  quiltWhite: "#fffdfb",
  bear: "#c99a6b",
  bearMuzzle: "#f1dcc0",
  bearDark: "#5a3a28",
};

const hidden = (mesh) => {
  mesh.visible = false;
  return mesh;
};

// A cucumber held across the fingertips of both hands. It rides on her right hand; the left one meets it
// at the other end.
export function cucumber(hand, palette) {
  const p = part();
  for (let x = -8; x <= 8; x++)
    for (let y = 6; y <= 7; y++)
      for (let z = -1; z <= 0; z++) p.add(x, y, z, x === 8 ? "cucumberCut" : hash(x, y, z) < 0.3 ? "cucumberLight" : "cucumber");
  const mesh = hidden(p.mesh(palette));
  hand.add(mesh);
  return mesh;
}

// A paper bag of pet food with a bone on it, held out in both hands the same way.
export function foodBag(hand, palette) {
  const p = part();
  box(p, [-4, 4], [3, 7], [-1, 1], (x, y) => (y === 7 ? "bagFold" : "bag"));
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
  ].forEach(([x, y]) => p.add(x, y, 2, "bone"));
  const mesh = hidden(p.mesh(palette));
  hand.add(mesh);
  return mesh;
}

// A bowl of pork trotter rice held against her chest: white china with a blue rim, heaped rice, and
// braised trotter, half a braised egg and greens on top, which go one by one as she eats. Chopsticks in
// her right hand, with a mouthful on them on the way up.
export function riceBowl(pose, hand, palette) {
  const CENTRE = [-0.5, 7.5]; // x, z
  const china = part();
  for (let x = -5; x <= 4; x++)
    for (let z = 3; z <= 12; z++) {
      const r = Math.hypot(x - CENTRE[0], z - CENTRE[1]);
      if (r <= 2.2) china.add(x, 11, z, "china");
      if (r <= 3) china.add(x, 12, z, "china");
      if (r <= 3.7) china.add(x, 13, z, r > 2.7 ? "china" : "rice");
      if (r <= 3.9) china.add(x, 14, z, r > 3 ? "chinaBlue" : "rice");
      if (r <= 2.6) china.add(x, 15, z, "rice");
    }
  const toppings = [
    [
      [-2, 16, 6, "pork"],
      [-1, 16, 6, "porkGlaze"],
      [-2, 16, 7, "porkGlaze"],
      [-1, 16, 7, "pork"],
      [-2, 17, 6, "pork"],
    ],
    [
      [1, 16, 7, "egg"],
      [1, 16, 8, "egg"],
      [2, 16, 7, "egg"],
      [1, 17, 7, "yolk"],
    ],
    [
      [-1, 16, 9, "greens"],
      [0, 16, 9, "greens"],
      [-1, 16, 10, "greens"],
    ],
  ].map((list) => cells(list, palette));
  const bowl = new THREE.Group();
  bowl.add(china.mesh(palette), ...toppings);
  pose.add(hidden(bowl));
  const sticks = part();
  for (let y = 5; y <= 7; y++) for (const x of [-6, -5]) sticks.add(x, y, 0, "chopstick");
  const chopsticks = hidden(sticks.mesh(palette));
  const morsel = hidden(
    cells(
      [
        [-6, 4, 0, "rice"],
        [-5, 4, 0, "porkGlaze"],
      ],
      palette
    )
  );
  hand.add(chopsticks, morsel);
  // `eaten`: how far through the meal she is (0 before it starts).
  return (held, lifting, eaten) => {
    bowl.visible = chopsticks.visible = held > 0.05;
    morsel.visible = lifting;
    toppings.forEach((m, i) => (m.visible = eaten < 0.35 + 0.2 * i));
  };
}

// A cup of grape tea held in both hands under her chin: purple tea, darker grape pulp and a cap of cheese
// foam in a clear cup with a domed lid. It is sipped through a thick straw, which turns purple with each
// sip, and the tea goes down as she drinks.
export function teaCup(pose, palette) {
  const ROWS = 7; // rows of tea, from y = 13 up
  const onStraw = (x, z) => x === 0 && z === 7;
  const inCup = (x, z) => Math.hypot(x, z - 7) <= 1.7;
  const cupPart = part();
  const rows = [...Array(ROWS)].map(() => part());
  const foamPart = part();
  for (let x = -3; x <= 3; x++)
    for (let z = 4; z <= 10; z++) {
      if (Math.hypot(x, z - 7) > 2.7) continue;
      if (!inCup(x, z)) {
        for (let y = 12; y <= 21; y++) cupPart.add(x, y, z, "plastic");
        continue;
      }
      if (!onStraw(x, z)) {
        cupPart.add(x, 12, z, "plastic");
        cupPart.add(x, 22, z, "plastic"); // the dome
        rows.forEach((row, i) => row.add(x, 13 + i, z, hash(x, i, z) < 0.25 ? "grapeDeep" : i >= 5 ? "grapeLight" : "grape"));
        for (let y = 0; y <= 1; y++) foamPart.add(x, y, z, "foam");
      }
    }
  const cup = cupPart.mesh(palette);
  cup.material = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false });
  const tea = rows.map((p) => p.mesh(palette));
  const foam = foamPart.mesh(palette);
  const strawCells = [];
  for (let y = 13; y <= 23; y++) strawCells.push([0, y, 7]);
  strawCells.push([0, 23, 8], [0, 24, 8]); // bent towards her lips
  const straws = ["straw", "grape"].map((color) =>
    cells(
      strawCells.map((c) => [...c, color]),
      palette
    )
  );
  const group = new THREE.Group();
  group.add(cup, ...tea, foam, ...straws);
  pose.add(hidden(group));
  // `drunk`: how far through the cup she is.
  return (held, drunk, sipping) => {
    group.visible = held > 0.05;
    const left = Math.ceil(ROWS * (1 - 0.9 * Math.min(1, drunk / 0.85)));
    tea.forEach((m, i) => (m.visible = i < left));
    foam.position.y = 13 + left;
    straws[0].visible = !sipping;
    straws[1].visible = sipping;
  };
}

// Watering a flower: a pot pops up at her side and she tips a watering can over it; drops fall, the
// stem grows and a flower opens, its colour picked for each watering.
export const FLOWERS = ["red", "yellow", "lilac", "white", "pink"];
export function garden(pose, palette) {
  const canPart = part();
  box(canPart, [7, 11], [9, 12], [6, 8], (x, y) => (y === 9 ? "canDark" : "can"));
  [
    [7, 13],
    [8, 14],
    [9, 14],
    [10, 14],
    [11, 13],
    [12, 10],
    [13, 11],
    [14, 12],
    [15, 13],
  ].forEach(([x, y]) => canPart.add(x, y, 7, "can")); // handle and spout
  box(canPart, [16, 16], [13, 14], [6, 8], "canDark"); // the rose
  const can = pivotGroup(pose, [9, 14.5, 7]); // tips about the handle, where she holds it
  can.inner.add(canPart.mesh(palette));
  const POUR = -0.6; // tilt to pour, rose down over the pot
  const SPOUT = [14.2, 9.2, 7.5]; // the rose, tipped
  const POT = [15.5, 9]; // x, z of the pot's middle
  const STEM = [17, 10]; // x, z of the stem, just in front of where the water falls
  const potPart = part();
  for (let y = 0; y <= 4; y++) ellipsoid(potPart, [POT[0], y, POT[1]], [2.2 + 0.15 * y, 0.5, 2.2 + 0.15 * y], y === 4 ? "potRim" : "pot");
  ellipsoid(potPart, [POT[0], 4, POT[1]], [2, 0.5, 2], "soil");
  const pot = pivotGroup(pose, [POT[0], 0, POT[1]]); // pops up from the ground
  pot.inner.add(potPart.mesh(palette));
  const stemPart = part();
  for (let y = 5; y <= 9; y++) stemPart.add(STEM[0], y, STEM[1], "stem");
  stemPart.add(STEM[0] - 1, 6, STEM[1], "leaf");
  stemPart.add(STEM[0] + 1, 7, STEM[1], "leaf");
  const stem = pivotGroup(pot.inner, [STEM[0], 4.5, STEM[1]]); // grows up out of the soil
  stem.inner.add(stemPart.mesh(palette));
  const BLOOM = ["..X..", ".XXX.", "XXOXX", ".XXX.", "..X.."];
  const blooms = FLOWERS.map((petal) => {
    const p = part();
    BLOOM.forEach((row, j) =>
      [...row].forEach((cell, i) => {
        if (cell === ".") return;
        const at = [STEM[0] + i - 2, 12 - j, STEM[1]];
        p.add(...at, cell === "O" ? (petal === "yellow" ? "flowerEyeDeep" : "flowerEye") : petal);
        if (cell === "O") p.add(at[0], at[1], at[2] + 1, "flowerEyeDeep");
        else if (Math.abs(i - 2) + Math.abs(j - 2) === 1) p.add(at[0], at[1], at[2] - 1, petal); // fuller in the middle
      })
    );
    return hidden(p.mesh(palette));
  });
  const bloom = pivotGroup(stem.inner, [STEM[0], 10, STEM[1]]); // opens from its middle
  bloom.inner.add(...blooms);
  const drops = [0, 1, 2].map(() => cells([[0, 0, 0, "water"]], palette));
  const watering = new THREE.Group();
  watering.add(...drops);
  pose.add(watering);
  can.outer.visible = pot.outer.visible = false;
  return {
    plant: (flower) => blooms.forEach((m, i) => (m.visible = FLOWERS[i] === flower)),
    update(held, pour, progress, elapsed) {
      can.outer.visible = pot.outer.visible = held > 0.05;
      can.outer.rotation.z = POUR * pour;
      pot.outer.scale.setScalar(easeOutBack(held));
      stem.outer.scale.y = 0.25 + 0.75 * smoothstep(0.1, 0.5, progress);
      bloom.outer.scale.setScalar(Math.max(0.001, easeOutBack(smoothstep(0.45, 0.6, progress))));
      // Three drops falling in turn from the rose into the pot.
      watering.visible = pour > 0.8;
      drops.forEach((d, i) => {
        const fall = (elapsed * 2.2 + i / 3) % 1;
        d.position.set(SPOUT[0], SPOUT[1] - fall * (SPOUT[1] - 5), SPOUT[2]);
      });
    },
  };
}

// A cosy corner that pops up for her to sit in: a caramel sofa with cushions and a mustard knitted throw
// over one arm, a floor lamp with a warm glowing shade at one end (`lampSide`: -1 the left, 1 the right)
// and a potted plant at the other. The pets sit on either side of her, at `seats` (cat then dog, as the
// runtime fills them).
export function sofaCorner(group, palette, lampSide = -1) {
  const m = -lampSide; // (the lamp and the plant are laid out for the lamp on the left, and mirrored)
  const span = (a, b) => [Math.min(m * a, m * b), Math.max(m * a, m * b)];
  const seats = [
    [-17, 9.5, 2],
    [19, 9.5, 2],
  ];
  const sofaPart = part();
  for (const x of [-29, 28]) for (const z of [-8, 8]) box(sofaPart, [x, x + 1], [0, 1], [z, z], "sofaLeg");
  box(sofaPart, [-30, 30], [2, 5], [-9, 9], (x, y) => (y === 2 ? "sofaShade" : "sofa")); // the base
  ellipsoid(sofaPart, [0, 14, -7.5], [30.5, 9, 1.8], "sofa", [], 6); // the back
  for (const side of [-1, 1]) ellipsoid(sofaPart, [side * 27.5, 10, 0], [2.8, 5, 9.2], "sofa", [], 4); // the arms
  for (const side of [-1, 1]) {
    box(sofaPart, side < 0 ? [-24, -1] : [1, 24], [6, 9], [-5, 9], (x, y, z) => (z === 9 || y === 6 ? "sofaShade" : "cushion")); // seat cushions
    ellipsoid(sofaPart, [side * 12.5, 15, -4.5], [11, 5, 1.6], "cushion", [], 4); // back cushions
  }
  // The throw, folded over the left arm and hanging down its outside.
  box(sofaPart, [-31, -24], [15, 15], [-3, 6], (x) => (x % 2 ? "throw" : "throwRow"));
  box(sofaPart, [-31, -31], [7, 14], [-3, 6], (x, y) => (y % 2 ? "throw" : "throwRow"));
  const lampPart = part();
  box(lampPart, span(-40, -36), [0, 0], [-8, -4], "brass");
  box(lampPart, span(-38, -38), [1, 24], [-6, -6], "brass");
  const shadePart = part();
  for (let y = 23; y <= 30; y++)
    ellipsoid(shadePart, [m * -38, y, -6], [5 - (y - 23) * 0.35, 0.5, 5 - (y - 23) * 0.35], y === 23 || y === 30 ? "shadeTrim" : "shade");
  const plantPart = part();
  ellipsoid(plantPart, [m * 39, 3, -5], [3, 3.5, 3], "pot", [{ has: (x, y) => y < 0 }], 3);
  ellipsoid(plantPart, [m * 39, 6, -5], [2.6, 0.5, 2.6], "soil");
  [
    [36, 10, -4, 3, 1.2, 2.5],
    [42, 12, -5, 3, 1.2, 2.5],
    [37, 15, -6, 2.8, 1.2, 2.4],
    [41, 17, -4, 2.6, 1.2, 2.2],
    [39, 20, -5, 2.2, 1.2, 2],
  ].forEach(([x, y, z, rx, ry, rz]) =>
    ellipsoid(plantPart, [m * x, y, z], [rx, ry, rz], (vx, vy, vz) => (hash(vx, vy, vz) < 0.3 ? "plantLight" : "plant"))
  );
  for (let y = 7; y <= 19; y++) plantPart.add(m * 39, y, -5, "plant"); // the stem
  const shade = shadePart.mesh(palette);
  shade.material = new THREE.MeshBasicMaterial({ vertexColors: true }); // it glows: unlit
  const lampLight = new THREE.PointLight(0xffc27a, 1.1, 70, 0); // warms the sofa and her
  lampLight.position.set(m * -36, 22, 0);
  const sofa = pivotGroup(group, [0, 0, 0]);
  sofa.inner.add(sofaPart.mesh(palette), lampPart.mesh(palette), shade, plantPart.mesh(palette), lampLight);
  sofa.outer.visible = false;
  return {
    seats,
    lamp: { light: lampLight, shade }, // for the playground to switch on and off
    // `up`: 0 gone, 1 there; it pops up through the first half.
    update(up) {
      sofa.outer.visible = up > 0.01;
      sofa.outer.scale.setScalar(easeOutBack(Math.min(1, up / 0.5)));
    },
  };
}

// A bed that pops up under her when she dozes off, with hearts on its honey-wood head- and footboards, a
// white sheet and pillow, and a quilt of white and pale pink squares with a little bear on each white one,
// which she pulls up to her shoulders. She lies in it on her side, facing out, her head on the pillow at
// the -x end, her feet at `feet`.
export function bed(group, palette) {
  const feet = [24, 19]; // x, y
  const HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
  const bedPart = part();
  box(bedPart, [-28, 30], [2, 3], [-11, 11], "woodDark"); // the frame
  for (const x of [-28, 29]) for (const z of [-11, 10]) box(bedPart, [x, x + 1], [0, 1], [z, z + 1], "woodDark"); // legs
  box(bedPart, [-25, 27], [4, 6], [-10, 10], "sheet"); // the mattress
  const board = ([x0, x1], height, heartX, heartTop) => {
    for (let z = -11; z <= 11; z++) {
      const top = height - Math.round((z * z) / 30); // a rounded top
      box(bedPart, [x0, x1], [0, top], [z, z], (x, y) => (y === top ? "woodDark" : "wood"));
    }
    HEART.forEach((row, j) => [...row].forEach((cell, i) => cell === "X" && bedPart.add(heartX, heartTop - j, i - 3, "heart")));
  };
  board([-28, -26], 24, -25, 19); // the headboard, its heart on the inside
  board([28, 30], 14, 31, 12); // the footboard, its heart on the outside
  ellipsoid(bedPart, [-11, 9, -2], [12.5, 2.5, 8.5], (x) => (Math.abs(x + 11) > 11 ? "pillowTrim" : "sheet"), [], 3); // the pillow, under her head
  const frame = new THREE.Group();
  frame.add(bedPart.mesh(palette));
  group.add(hidden(frame));

  // The quilt: squares 7 voxels across, the sheet turned down over its top edge. Seen mostly from the
  // front, so the squares and bears are laid out on its front face; elsewhere the squares just alternate.
  const TILE = 7;
  const BEAR = ["X...X", "XXXXX", "XEXEX", "XMNMX", ".XXX."];
  const BEAR_COLORS = { X: "bear", E: "bearDark", N: "bearDark", M: "bearMuzzle" };
  const tile = (a, b) => (Math.floor((a - 4) / TILE) + Math.floor((b - 5) / TILE)) & 1;
  const quiltPart = part();
  ellipsoid(
    quiltPart,
    [14.5, 13, 0],
    [13, 14, 11.5],
    (x, y, z) => (x <= 3 ? "sheet" : tile(x, y) ^ tile(z + 15, 0) ? "quiltPink" : "quiltWhite"),
    [{ has: (x, y) => y < 5 }],
    4
  );
  for (let x = 4; x <= 28; x++)
    for (let y = 5; y <= 28; y++) {
      const v = quiltPart.front(x, y);
      if (!v) continue;
      v[3] = tile(x, y) ? "quiltPink" : "quiltWhite";
      // A bear in the middle of each white square.
      const [i, j] = [(x - 4) % TILE, (y - 5) % TILE];
      const cell = !tile(x, y) && i >= 1 && i <= 5 && j >= 1 && j <= 5 ? BEAR[5 - j][i - 1] : ".";
      if (cell !== ".") v[3] = BEAR_COLORS[cell];
    }
  const quilt = pivotGroup(group, [27.5, 0, 0]); // slides up from the foot of the bed
  quilt.inner.add(quiltPart.mesh(palette));
  quilt.outer.visible = false;
  return {
    feet,
    // `inBed`: 0 up, 1 tucked in. The bed pops up, then she rolls in, then the quilt comes up.
    update(inBed) {
      frame.visible = inBed > 0.01;
      frame.scale.setScalar(easeOutBack(Math.min(1, inBed / 0.35)));
      quilt.outer.scale.x = smoothstep(0.8, 1, inBed);
      quilt.outer.visible = quilt.outer.scale.x > 0.01;
    },
  };
}
