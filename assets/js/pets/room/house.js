/*******************************************************************************
 * The playground's home (assets/js/playground.js): one room of a dolls' house,
 * open at the front and on the right, built from voxels like the pets, with a
 * little vegetable garden beside it. Along the back wall: the kitchen (the
 * fridge, the counter and the bin), the front door, and the stairs up to a
 * loft with the boy's computer desk, the bed under the window and, past a low
 * shoe cabinet, the girl's dressing corner. Along the left wall: the stove, a
 * low bookshelf under the window, and the fireplace with the TV over it. In
 * the middle, the girl's sofa (girl-props.js), the coffee table on a rug and
 * an armchair; at the front right, the dining table for two, the collie's
 * bed and the cat's tree, and the garden door out to the vegetable beds.
 *
 * Some things move: the fridge's two doors, the bin's lid and the front door,
 * the TV and the two computer screens (screens.js draws what is on them), the
 * computer's power light, the gaming chair, the little Kirby on the desk
 * (rocking while the sun is up), steam off the stove, the oven's door and its
 * glow while it bakes, a dish on the dining table, the fire, the
 * quilt when someone gets into bed, the vegetables as they grow, a butterfly
 * over the garden, the clock, the clouds, a bird going by and the string
 * lights; the lamps and the lights come on at night.
 *
 * World units are voxels: x to the right, y up, z towards the front. The floor
 * is at y = 0 (feet rest on y = -0.5, as on the models), the loft at LOFT.y,
 * and floorY(x, z) says how high the floor is anywhere.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, foodBowl, cells, smoothstep } from "../models/voxels.js";
import { PROP_COLORS, sofaCorner } from "../models/girl-props.js";
import { LOOKS, OUTFIT_PALETTE } from "../models/girl-outfits.js";
import { pick } from "../stage.js";
import { CHANNELS, GAMES, drawChannel, drawTvGame, drawPcGame } from "./screens.js";
import { DISHES, buildDish } from "./props.js";

export const X0 = -150; // the left wall
export const X1 = 150; // the open right side downstairs, where the garden begins
export const SIDE = 210; // the open right side of the loft, and the garden's fence
export const BACK = -110; // the back wall
export const FRONT = 110; // the open front
export const WALL_H = 96;
const WALL_T = 4;
export const LOFT = { x0: 0, z1: -28, y: 18 }; // the raised floor: x >= x0, z <= z1, at height y
const STAIRS = { x0: -30, z1: -84, run: 5, rise: 3 }; // six steps up along the back wall, from x0 to the loft
export const DOOR = { x: -50, half: 12, height: 58 };
const GARDEN_DOOR = { z: 40, half: 15 }; // the gap in the low wall between the living room and the garden

// How high the floor is at (x, z): the loft, a step of the stairs, or the ground.
export function floorY(x, z) {
  if (z > LOFT.z1) return 0;
  if (x >= LOFT.x0) return LOFT.y;
  if (x <= STAIRS.x0 || z >= STAIRS.z1) return 0;
  const u = (x - STAIRS.x0) / STAIRS.run;
  const k = Math.floor(u);
  return STAIRS.rise * (k + smoothstep(0, 0.4, u - k)); // up onto each step near its edge
}

const COLORS = {
  ...OUTFIT_PALETTE,
  ...PROP_COLORS,
  frame: "#f7f3ea",
  frameShade: "#e3dccd",
  curtain: "#a5bf98",
  curtainFold: "#8eab82",
  curtainTie: "#e3b04b",
  woodLight: "#d9b083",
  woodMid: "#b98a5e",
  woodDeep: "#8f6440",
  panel: "#f3eee4",
  panelLine: "#ddd2bf",
  fridge: "#bfe2d4",
  fridgeShade: "#a7cfc0",
  fridgeFeet: "#5d6d68",
  chrome: "#e8eef0",
  steel: "#c3c9cf",
  steelDark: "#8b939b",
  hob: "#2e3036",
  inside: "#f7fbfa",
  insideShelf: "#d3e4e0",
  milk: "#fdfdfb",
  milkBlue: "#5f8fd6",
  juice: "#f6a33c",
  cake: "#f6b8c8",
  cream: "#fff8ef",
  berry: "#d9334a",
  melon: "#7fc463",
  magnetRed: "#e5504f",
  magnetYellow: "#f6cf4a",
  photo: "#fbfaf6",
  photoSky: "#9fd0f2",
  cabinet: "#efe4cf",
  cabinetLine: "#d6c6a8",
  cabinetGreen: "#5f8f6c",
  glass: "#bfe0ee",
  counterTop: "#9c7b5b",
  kettle: "#e8695a",
  kettleDark: "#c4503f",
  ovenInside: "#3d3532",
  ovenGlow: "#ffb24a",
  sponge: "#f4d35e",
  spongeGreen: "#6fae52",
  apple: "#d93d3d",
  orange: "#f39a33",
  pear: "#a9cf54",
  tin: "#f2c14e",
  paw: "#7a4a2a",
  mug: "#fbf8f1",
  mugBlue: "#7ea6d9",
  tvBody: "#30323a",
  tvEdge: "#454852",
  console: "#f2f2f4",
  pad: "#4a4f5c",
  padRed: "#e0605a",
  remote: "#3a3d45",
  magazine: "#e88f6f",
  magazine2: "#7fb3d5",
  bookA: "#c94f4f",
  bookB: "#4f7fc9",
  bookC: "#e8b84a",
  bookD: "#5e9e6e",
  bookE: "#9c6fc2",
  bookF: "#e7e1d3",
  bookG: "#d9784a",
  carpet: "#ddcdb5",
  carpetDark: "#c9b79b",
  sisal: "#c9a877",
  sisalDark: "#b38f5c",
  mouse: "#9b9ca3",
  bedBlue: "#86a5c9",
  bedBlueLight: "#a2bcdb",
  bedCream: "#f4e9d6",
  clockFace: "#fbf7ee",
  hand: "#3a3330",
  bulbWire: "#5c4a3a",
  canvasFrame: "#a8794e",
  bowlBlue: "#4f86d6",
  bowlBlueRim: "#7ba7ea",
  bowlPink: "#e27a9c",
  bowlPinkRim: "#f2a6be",
  succulent: "#7cb98a",
  food: "#a8662f",
  foodDark: "#7d4520",
  coffee: "#6b4430",
  earPink: "#e8a3a6",
  treeCushion: "#f0a6b8",
  door: "#fbf9f4",
  doorShade: "#e6e0d3",
  mat: "#c98d5a",
  matLight: "#e0ad7a",
  desk: "#f4efe6",
  deskShade: "#ddd5c6",
  keyboard: "#3a3d45",
  keyLight: "#8fd3ff",
  pcCase: "#26272e",
  pcEdge: "#3b3d47",
  chairBlack: "#2b2c33",
  chairWhite: "#f2f2f4",
  phoneCup: "#f6f6f3",
  phonePad: "#2c2c33",
  phoneCushion: "#1f1f24",
  kirbyBase: "#cdbdea",
  kirbyBaseTop: "#b9a6e0",
  cloud: "#fbfbff",
  skyStar: "#8fd3ff",
  solar: "#2b2c33",
  solarLine: "#4a4f5c",
  starYellow: "#f7d83b",
  kirbyPink: "#f7a6c0",
  kirbyFeet: "#e0405a",
  kirbyEye: "#1d2240",
  kirbyEyeBlue: "#3e6fd6",
  kirbyBlush: "#f27a9a",
  kirbyMouth: "#c73f55",
  binInside: "#3a3d45",
  lettuce: "#8fd16a",
  carrot: "#f08a2c",
  eggTray: "#c9a477",
  rind: "#3f8f3a",
  rindLight: "#d8f0c0",
  seed: "#2b2522",
  pudding: "#f6d36b",
  caramel: "#a8662f",
  icecream: "#f7a8c4",
  iceBlue: "#cfeefc",
  soy: "#5a3a28",
  mirror: "#cfe6ee",
  mirrorGleam: "#f4fbfd",
  boxPink: "#f4c7d3",
  boxBlue: "#a9c7e8",
  boxLid: "#fbf8f2",
  screenCloth: "#f7efe2",
  shoe: "#26262b",
  brick: "#c46a52",
  brickDark: "#a9563f",
  mortar: "#eadfcf",
  soot: "#2e2a2a",
  stone: "#c9c1b3",
  stoneDark: "#aaa192",
  log: "#8a5a34",
  logEnd: "#e0bd8f",
  wicker: "#c08d58",
  wickerDark: "#9e6f40",
  fireRed: "#e0452c",
  fireOrange: "#f58a2c",
  fireYellow: "#ffd75a",
  wallCap: "#c9ae8a",
  soil: "#6b4a32",
  soilWet: "#3f2a1c",
  tomLeaf: "#4f9a3a",
  tomGreen: "#a3d15a",
  tomato: "#e0402e",
  tomatoShine: "#ff9a8a",
  eggLeaf: "#5f9a49",
  eggStem: "#6b3f73",
  eggplant: "#5b2a6e",
  eggplantShine: "#9a62b5",
  eggCap: "#4f8a3e",
  napaGreen: "#8cc265",
  napaLeaf: "#6fae52",
  napaWhite: "#eef3d9",
  napaPale: "#d6e8a8",
  cabbage: "#a8d38a",
  cabbageLeaf: "#6fae52",
  cabbageVein: "#cfe8b4",
};

// A canvas texture drawn texel by texel, one texel per voxel, kept crisp.
function pixelTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, g, canvas };
}

// A part (voxels.js) as one mesh of just the voxel faces that show, coloured per face: for a part that
// never changes shape, a fraction of the triangles of a cube per voxel, and it looks the same.
const FACES = [
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  [
    [-1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
  ],
  [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ],
  [
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 0],
  ],
  [
    [0, 0, -1],
    [0, 1, 0],
    [1, 0, 0],
  ],
]; // each face's normal and two edges, the edges' cross product the normal (so it winds outwards)
const solidMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
function solid(p, palette = COLORS, material = solidMaterial) {
  const position = [];
  const normal = [];
  const color = [];
  const index = [];
  const c = new THREE.Color();
  for (const [x, y, z, name] of p.list()) {
    c.set(palette[name]);
    for (const [n, u, v] of FACES) {
      if (p.has(x + n[0], y + n[1], z + n[2])) continue;
      const base = position.length / 3;
      for (const [su, sv] of [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5],
      ]) {
        for (let k = 0; k < 3; k++) position.push([x, y, z][k] + n[k] / 2 + su * u[k] + sv * v[k]);
        normal.push(...n);
        color.push(c.r, c.g, c.b);
      }
      index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  g.setIndex(index);
  return new THREE.Mesh(g, material);
}
const glowing = new THREE.MeshBasicMaterial({ vertexColors: true }); // unlit: lit from within, or a light

// A mesh or group placed at `at`, turned by `rotY`, added to `parent`.
function place(parent, object, [x, y, z], rotY = 0) {
  object.position.set(x, y, z);
  object.rotation.y = rotY;
  parent.add(object);
  return object;
}

// Where a point (lx, lz) of something standing at `at`, turned by `yaw`, is in the room.
const turned = ([x, z], yaw, [lx, lz]) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];

export function buildHouse(scene) {
  const house = new THREE.Group();
  scene.add(house);
  const mesh = (p) => solid(p);
  const obstacles = []; // [x0, x1, z0, z1] footprints on the floor, for finding the way round
  const updates = []; // (t, dt) each frame
  let night = false;

  // A soft shadow on the floor (or the loft) under a piece of furniture.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3a2412, transparent: true, opacity: 0.16, depthWrite: false });
  function floorShadow(x0, x1, z0, z1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 4, z1 - z0 + 4), shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, floorY((x0 + x1) / 2, (z0 + z1) / 2) - 0.44, (z0 + z1) / 2);
    house.add(m);
  }
  function footprint(x0, x1, z0, z1, shade = true) {
    obstacles.push([x0, x1, z0, z1]);
    if (shade) floorShadow(x0, x1, z0, z1);
  }
  // The footprint of a box [lx0, lx1] x [lz0, lz1] of something at `at` turned by `yaw`.
  function turnedFootprint(at, yaw, [lx0, lx1, lz0, lz1], shade = true) {
    const corners = [
      [lx0, lz0],
      [lx1, lz0],
      [lx0, lz1],
      [lx1, lz1],
    ].map((c) => turned(at, yaw, c));
    const xs = corners.map((c) => c[0]);
    const zs = corners.map((c) => c[1]);
    footprint(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), shade);
  }

  /* ---------- the floor, the walls and the loft ---------- */

  // Honey oak boards, 6 voxels deep, of random lengths with darker seams.
  const planks = pixelTexture(256, 48, (g) => {
    const tones = ["#cf9d6b", "#c69161", "#d6a677", "#c08a5a"];
    for (let row = 0; row < 8; row++) {
      let x = -Math.floor(hash(row, 1, 7) * 40);
      while (x < 256) {
        const len = 34 + Math.floor(hash(row, x, 3) * 50);
        g.fillStyle = tones[Math.floor(hash(x, row, 5) * tones.length)];
        g.fillRect(x, row * 6, len, 6);
        for (let k = 0; k < 6; k++) {
          // a few grain streaks
          const gx = x + Math.floor(hash(x, row, k) * len);
          g.fillStyle = "rgba(120,72,36,0.16)";
          g.fillRect(gx, row * 6 + 1 + (k % 4), 5, 1);
        }
        g.fillStyle = "#a8743f";
        g.fillRect(x, row * 6, 1, 6);
        x += len;
      }
      g.fillStyle = "#b07c4a";
      g.fillRect(0, row * 6 + 5, 256, 1);
    }
  });
  planks.tex.wrapS = planks.tex.wrapT = THREE.RepeatWrapping;
  const floorMat = new THREE.MeshLambertMaterial({ map: planks.tex });
  // Boards over [x0, x1] x [z0, z1] at height y, lined up with all the others.
  function boards(x0, x1, z0, z1, y) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) uv.setXY(i, (cx + position.getX(i)) / 256, (position.getY(i) - cz) / 48);
    const m = new THREE.Mesh(g, floorMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, y, cz);
    house.add(m);
  }
  boards(X0, X1, BACK, FRONT, -0.5);
  // The cut edge of the floor all round, like a dolls' house, the garden's included.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(SIDE - X0 + WALL_T, 8, FRONT - BACK + WALL_T),
    new THREE.MeshLambertMaterial({ color: "#8a5a34" })
  );
  slab.position.set((X0 - WALL_T + SIDE) / 2, -4.6, (BACK - WALL_T + FRONT) / 2);
  house.add(slab);

  // Warm cream wallpaper with fine stripes and little flowers over white panelling, a wooden rail between
  // them and a skirting board below.
  const paper = pixelTexture(64, WALL_H, (g, w, h) => {
    const at = (y) => h - 1 - y; // canvas rows run down, wall heights up
    g.fillStyle = "#f6e8cf";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = "#f1e0c4";
      g.fillRect(x, 0, 1, h);
    }
    for (let y = 38; y < h - 6; y += 12)
      for (let x = (y / 12) % 2 ? 4 : 0; x < w; x += 8) {
        g.fillStyle = "#e8a99a";
        g.fillRect(x + 4, at(y), 1, 1);
        g.fillStyle = "#c9d9a8";
        g.fillRect(x + 4, at(y - 1), 1, 1);
      }
    g.fillStyle = "#f3eee4"; // panelling
    g.fillRect(0, at(30), w, 27);
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = "#e2d9c8";
      g.fillRect(x, at(28), 1, 22);
      g.fillRect(x, at(28), 12, 1);
      g.fillStyle = "#fbf8f2";
      g.fillRect(x + 1, at(7), 12, 1);
    }
    g.fillStyle = "#b58457"; // the rail
    g.fillRect(0, at(32), w, 2);
    g.fillStyle = "#9a6a40"; // the skirting
    g.fillRect(0, at(4), w, 5);
    g.fillStyle = "#e9d6b6"; // the cornice
    g.fillRect(0, 0, w, 3);
  });
  paper.tex.wrapS = THREE.RepeatWrapping;
  const paperMat = new THREE.MeshLambertMaterial({ map: paper.tex });
  const wallMat = new THREE.MeshLambertMaterial({ color: "#e9dcc4" });
  const capMat = new THREE.MeshLambertMaterial({ color: "#c9ae8a" });
  // A wall from u0 to u1 along it, papered on the inside, WALL_T thick, cut round its `holes` ([u0, u1,
  // v0, v1]: along it and up it), and capped on top. `alongX`: the back wall (u is x) or the left (u is z).
  function wall([u0, u1], holes, alongX) {
    const [floor, top] = [-0.5, WALL_H - 0.5];
    const rects = [];
    let u = u0;
    for (const [a, b, lo, hi] of holes) {
      if (a > u) rects.push([u, a, floor, top]);
      if (lo > floor) rects.push([a, b, floor, lo]);
      if (hi < top) rects.push([a, b, hi, top]);
      u = b;
    }
    if (u < u1) rects.push([u, u1, floor, top]);
    for (const [a, b, lo, hi] of rects) {
      const [w, h, cu, cv] = [b - a, hi - lo, (a + b) / 2, (lo + hi) / 2];
      const g = new THREE.PlaneGeometry(w, h);
      const { position, uv } = g.attributes;
      for (let i = 0; i < position.count; i++) uv.setXY(i, (cu + (alongX ? 1 : -1) * position.getX(i)) / 64, (cv + 0.5 + position.getY(i)) / WALL_H);
      const face = new THREE.Mesh(g, paperMat);
      const block = new THREE.Mesh(alongX ? new THREE.BoxGeometry(w, h, WALL_T) : new THREE.BoxGeometry(WALL_T, h, w), wallMat);
      if (alongX) {
        face.position.set(cu, cv, BACK);
        block.position.set(cu, cv, BACK - WALL_T / 2 - 0.05);
      } else {
        face.rotation.y = Math.PI / 2;
        face.position.set(X0, cv, cu);
        block.position.set(X0 - WALL_T / 2 - 0.05, cv, cu);
      }
      house.add(face, block);
    }
    const cap = new THREE.Mesh(alongX ? new THREE.BoxGeometry(u1 - u0, 2, WALL_T + 1) : new THREE.BoxGeometry(WALL_T + 1, 2, u1 - u0), capMat);
    if (alongX) cap.position.set((u0 + u1) / 2, top + 1, BACK - WALL_T / 2 + 0.5);
    else cap.position.set(X0 - WALL_T / 2 + 0.5, top + 1, (u0 + u1) / 2);
    house.add(cap);
  }
  // Holes are given in voxel cells, the walls cut along their edges.
  const hole = ([a, b], [lo, hi]) => [a - 0.5, b + 0.5, lo - 0.5, hi + 0.5];
  const WIN_BACK = { x: [111, 151], y: [54, 91] }; // over the bed
  const WIN_LEFT = { z: [-4, 33], y: [40, 84] }; // the kitchen window, between the stove and the fireplace
  const DOOR_X = [DOOR.x - DOOR.half, DOOR.x + DOOR.half - 1];
  wall([X0 - WALL_T, SIDE], [hole(DOOR_X, [0, DOOR.height - 1]), hole(WIN_BACK.x, WIN_BACK.y)], true);
  wall([BACK, FRONT], [hole(WIN_LEFT.z, WIN_LEFT.y)], false);

  // The loft: boards on top, its front and both sides panelled, a railing along the front and the open
  // right side, and the stairs up to it along the back wall with a banister.
  boards(LOFT.x0, SIDE, BACK, LOFT.z1, LOFT.y - 0.5);
  const loft = part();
  const panel = (u, y) => (y === LOFT.y - 1 ? "woodMid" : y <= 1 ? "woodDeep" : u % 8 === 0 ? "panelLine" : "panel");
  for (let x = LOFT.x0; x < SIDE; x++) for (let y = 0; y < LOFT.y; y++) loft.add(x, y, LOFT.z1 - 1, panel(x, y));
  for (let z = STAIRS.z1; z < LOFT.z1; z++) for (let y = 0; y < LOFT.y; y++) loft.add(LOFT.x0, y, z, panel(z, y));
  for (let z = BACK; z < LOFT.z1; z++) for (let y = 0; y < LOFT.y; y++) loft.add(SIDE - 1, y, z, panel(z, y));
  const RAIL = 13; // the railing's height
  const railZ = LOFT.z1 - 2;
  const railX = SIDE - 2;
  for (let x = LOFT.x0 + 1; x <= railX; x++) {
    loft.add(x, LOFT.y + RAIL, railZ, "woodMid");
    if (x % 4 === 1 || x === railX)
      for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(x, y, railZ, x % 24 === 1 || x === railX ? "woodDeep" : "frame");
  }
  for (let z = BACK + 1; z < railZ; z++) {
    loft.add(railX, LOFT.y + RAIL, z, "woodMid");
    if (z % 4 === 0) for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(railX, y, z, "frame");
  }
  for (let z = STAIRS.z1; z <= railZ; z++) {
    loft.add(LOFT.x0 + 1, LOFT.y + RAIL, z, "woodMid");
    if (z % 4 === 0 || z === railZ) for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(LOFT.x0 + 1, y, z, z === railZ ? "woodDeep" : "frame");
  }
  for (let k = 0; k < 6; k++) {
    const x0 = STAIRS.x0 + STAIRS.run * k;
    const top = STAIRS.rise * (k + 1) - 1;
    box(loft, [x0, x0 + STAIRS.run - 1], [0, top], [BACK, STAIRS.z1 - 1], (x, y, z) =>
      y === top ? "woodLight" : x === x0 ? "woodMid" : z === STAIRS.z1 - 1 ? "panel" : "woodMid"
    );
    for (let y = top + 1; y <= top + RAIL; y++) loft.add(x0 + 2, y, STAIRS.z1 - 1, "frame"); // a baluster on each step
  }
  for (let x = STAIRS.x0 - 1; x <= LOFT.x0; x++)
    loft.add(x, Math.round(RAIL + 1 + ((LOFT.y - 1) * (x - STAIRS.x0 + 1)) / (LOFT.x0 - STAIRS.x0 + 1)), STAIRS.z1 - 1, "woodMid"); // the handrail
  box(loft, [STAIRS.x0 - 2, STAIRS.x0 - 1], [0, RAIL + 2], [STAIRS.z1 - 1, STAIRS.z1 - 1], "woodDeep"); // the newel post
  house.add(mesh(loft));
  footprint(LOFT.x0, SIDE, LOFT.z1 - 3, LOFT.z1, false); // the railing, and the edge
  footprint(LOFT.x0 - 1, LOFT.x0 + 2, STAIRS.z1, LOFT.z1, false);
  footprint(railX - 1, SIDE, BACK, LOFT.z1, false);
  footprint(STAIRS.x0 - 2, LOFT.x0, STAIRS.z1 - 2, STAIRS.z1, false); // the banister

  /* ---------- the windows and the front door ---------- */

  // The sky outside: blue with drifting clouds and the odd bird by day, deep blue with stars and the moon
  // by night. Both windows show it.
  const SKY = [44, 46];
  const sky = pixelTexture(...SKY, () => {});
  const skyMat = new THREE.MeshBasicMaterial({ map: sky.tex });
  const clouds = pixelTexture(SKY[0] * 2, SKY[1], () => {});
  clouds.tex.wrapS = THREE.RepeatWrapping;
  clouds.tex.repeat.set(0.5, 1);
  const cloudMat = new THREE.MeshBasicMaterial({ map: clouds.tex, transparent: true, depthWrite: false });
  // A pane of sky `w` x `h` voxels, showing that much of it.
  function skyPane(w, h, at, rotY) {
    for (const [mat, lift] of [
      [skyMat, 0],
      [cloudMat, 0.1],
    ]) {
      const g = new THREE.PlaneGeometry(w, h);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / SKY[0], 1 - ((1 - uv.getY(i)) * h) / SKY[1]);
      const m = place(house, new THREE.Mesh(g, mat), at, rotY);
      m.translateZ(lift);
    }
  }
  skyPane(WIN_BACK.x[1] - WIN_BACK.x[0] + 1, WIN_BACK.y[1] - WIN_BACK.y[0] + 1, [
    (WIN_BACK.x[0] + WIN_BACK.x[1]) / 2,
    (WIN_BACK.y[0] + WIN_BACK.y[1]) / 2,
    BACK - 2,
  ]);
  skyPane(
    WIN_LEFT.z[1] - WIN_LEFT.z[0] + 1,
    WIN_LEFT.y[1] - WIN_LEFT.y[0] + 1,
    [X0 - 2, (WIN_LEFT.y[0] + WIN_LEFT.y[1]) / 2, (WIN_LEFT.z[0] + WIN_LEFT.z[1]) / 2],
    Math.PI / 2
  );
  function drawSky() {
    const { g } = sky;
    const grad = g.createLinearGradient(0, 0, 0, SKY[1]);
    grad.addColorStop(0, night ? "#18234a" : "#7fc0ec");
    grad.addColorStop(1, night ? "#33447a" : "#d4ecfb");
    g.fillStyle = grad;
    g.fillRect(0, 0, ...SKY);
    if (night) {
      for (let i = 0; i < 22; i++) {
        g.fillStyle = i % 5 ? "#e9ecff" : "#ffe9a8";
        g.fillRect(Math.floor(hash(i, 3, 1) * SKY[0]), Math.floor(hash(i, 5, 2) * SKY[1] * 0.8), 1, 1);
      }
      g.fillStyle = "#fff4c2"; // a crescent moon
      for (let y = -5; y <= 5; y++)
        for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25 && (x + 3) ** 2 + (y - 1) ** 2 > 18) g.fillRect(30 + x, 9 + y, 1, 1);
    } else {
      g.fillStyle = "#fff6c9"; // the sun peeking in at the corner
      for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) g.fillRect(34 + x, 6 + y, 1, 1);
    }
    sky.tex.needsUpdate = true;
  }
  function drawClouds() {
    const { g, canvas } = clouds;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = night ? "rgba(150,165,210,0.35)" : "#ffffff";
    [
      [10, 22, 8],
      [40, 13, 6],
      [62, 28, 9],
      [78, 10, 5],
    ].forEach(([cx, cy, r]) => {
      for (let y = -r; y <= r; y++)
        for (let x = -2 * r; x <= 2 * r; x++) {
          const puff = (x / (2 * r)) ** 2 + (y / r) ** 2 <= 1 && y <= r / 2;
          const bump = (x - r / 2) ** 2 + (y + r / 3) ** 2 <= (r * 0.7) ** 2;
          if (puff || bump) g.fillRect((cx + x + canvas.width) % canvas.width, cy + y, 1, 1);
        }
    });
    clouds.tex.needsUpdate = true;
  }
  // A bird now and then, flapping across the window over the bed by day.
  const birdPart = part();
  [
    [-2, 1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [2, 1],
  ].forEach(([x, y]) => birdPart.add(x, y, 0, "tvBody"));
  const bird = place(house, mesh(birdPart), [0, 0, BACK - 1.5]);
  bird.visible = false;
  const winMid = (WIN_BACK.x[0] + WIN_BACK.x[1]) / 2;
  const winHalf = (WIN_BACK.x[1] - WIN_BACK.x[0]) / 2 - 2;
  const flight = { at: 6, x: 0, y: 0, dir: 1 };
  updates.push((t, dt) => {
    cloudMat.map.offset.x = (t * 0.004) % 1;
    if (!night && t > flight.at && !bird.visible) {
      Object.assign(flight, { dir: Math.random() < 0.5 ? 1 : -1, y: WIN_BACK.y[0] + 18 + Math.random() * 14 });
      flight.x = -flight.dir * winHalf;
      bird.visible = true;
    }
    if (bird.visible) {
      flight.x += flight.dir * 12 * dt;
      bird.position.set(winMid + flight.x, flight.y + Math.sin(t * 3) * 1.5, BACK - 1.5);
      bird.scale.y = Math.sin(t * 14) > 0 ? 1 : -1; // flapping
      if (Math.abs(flight.x) > winHalf || night) {
        bird.visible = false;
        flight.at = t + 12 + Math.random() * 20;
      }
    }
  });

  // The window frames: white, with glazing bars and a sill; sage curtains tied back either side of the one
  // over the bed, and a succulent on its sill (where the cat likes to sit).
  const win = part();
  const frameAround = ([a, b], [lo, hi], at) => {
    for (let u = a - 2; u <= b + 2; u++)
      for (let y = lo - 2; y <= hi + 2; y++) if (u < a || u > b || y < lo || y > hi) win.add(...at(u, y, 0), "frame");
    for (let y = lo; y <= hi; y++) win.add(...at(Math.round((a + b) / 2), y, -1), "frame");
    for (let u = a; u <= b; u++) win.add(...at(u, Math.round((lo + hi) / 2), -1), "frame");
    for (let u = a - 3; u <= b + 3; u++) for (let d = 0; d <= 4; d++) win.add(...at(u, lo - 3, d), d === 4 ? "frameShade" : "frame");
  };
  frameAround(WIN_BACK.x, WIN_BACK.y, (u, y, d) => [u, y, BACK + d]);
  frameAround(WIN_LEFT.z, WIN_LEFT.y, (u, y, d) => [X0 + d, y, u]);
  for (const side of [-1, 1])
    for (let y = WIN_BACK.y[0] - 2; y <= WIN_BACK.y[1] + 4; y++) {
      const tie = Math.abs(y - 70) <= 1;
      const width = 6 - Math.round(2 * Math.exp(-(((y - 70) / 7) ** 2)));
      for (let k = 0; k < width; k++) {
        const x = side < 0 ? WIN_BACK.x[0] - 8 + k : WIN_BACK.x[1] + 8 - k;
        win.add(x, y, BACK + 2, tie ? "curtainTie" : (x + 99) % 3 ? "curtain" : "curtainFold");
      }
    }
  box(win, [WIN_BACK.x[0] - 10, WIN_BACK.x[1] + 10], [WIN_BACK.y[1] + 6, WIN_BACK.y[1] + 6], [BACK + 1, BACK + 2], "brass"); // the rod
  ellipsoid(win, [WIN_BACK.x[1] - 3, WIN_BACK.y[0] - 1.5, BACK + 2], [1.8, 1.4, 1.4], "pot");
  ellipsoid(win, [WIN_BACK.x[1] - 3, WIN_BACK.y[0] + 0.5, BACK + 2], [1.6, 1.4, 1.3], "succulent");
  house.add(mesh(win));

  // The front door: white, with two panes of glass, opening into the room. Through it, a path and a hedge
  // under the sky; on the floor inside, a doormat.
  const door = pivotGroup(house, [DOOR_X[0] - 0.5, 0, BACK - 2]);
  const doorPart = part();
  box(doorPart, DOOR_X, [0, DOOR.height - 1], [BACK - 2, BACK - 2], (x, y) => {
    const u = x - DOOR_X[0];
    if (u === 0 || u === 2 * DOOR.half - 1 || y === DOOR.height - 1 || y === 0) return "doorShade";
    if (y >= 32 && y <= 52 && ((u >= 3 && u <= 10) || (u >= 13 && u <= 20))) return "glass";
    if (y >= 6 && y <= 26 && (u === 3 || u === 20 || u === 10 || u === 13 || y === 6 || y === 26)) return "doorShade";
    return "door";
  });
  doorPart.add(DOOR.x + 8, 28, BACK - 1, "brass"); // the knob
  door.inner.add(mesh(doorPart));
  const doorFrame = part();
  box(doorFrame, [DOOR_X[0] - 2, DOOR_X[1] + 2], [0, DOOR.height + 1], [BACK, BACK], "frame", [
    { has: (x, y) => x >= DOOR_X[0] && x <= DOOR_X[1] && y < DOOR.height },
  ]);
  house.add(mesh(doorFrame));
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), new THREE.MeshLambertMaterial({ color: COLORS.mat }));
  mat.rotation.x = -Math.PI / 2;
  place(house, mat, [DOOR.x, -0.45, BACK + 8]);
  const outside = pixelTexture(60, 70, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#8ccbf0");
    grad.addColorStop(1, "#dff1fb");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const top = 34 + Math.round(2 * Math.sin(x * 0.7) + hash(x, 1, 1) * 2); // a hedge
      g.fillStyle = x % 5 ? "#5e9e4a" : "#4f8a3e";
      g.fillRect(x, top, 1, h - top);
      if (hash(x, 2, 3) < 0.15) {
        g.fillStyle = hash(x, 4, 4) < 0.5 ? "#f6a5c0" : "#fbe28a";
        g.fillRect(x, top + 3 + Math.floor(hash(x, 5, 5) * 8), 1, 1);
      }
    }
  });
  // The hedge is close behind the door, so whoever goes out walks off behind it.
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(60, 70), new THREE.MeshBasicMaterial({ map: outside.tex })), [DOOR.x, 34.5, BACK - 18]);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2 * DOOR.half + 6, 16), new THREE.MeshLambertMaterial({ color: "#d9cbb0" }));
  path.rotation.x = -Math.PI / 2;
  place(house, path, [DOOR.x, -0.5, BACK - 10]);
  const frontDoor = { open: false, k: 0 };
  updates.push((t, dt) => {
    frontDoor.k += ((frontDoor.open ? 1 : 0) - frontDoor.k) * (1 - Math.exp(-4 * dt));
    door.outer.rotation.y = -1.45 * frontDoor.k;
  });

  /* ---------- the kitchen: the fridge, the counter, the stove, the bowls ---------- */

  // A rounded retro fridge in mint, no taller than they can reach: the fridge below and the freezer above,
  // each door swinging open towards the front on its own and the inside lit up. In the fridge, two glass
  // shelves over the crisper drawer (a lettuce and carrots): milk, juice, jam and a tray of eggs; a slice of
  // cake, watermelon and grapes; puddings, a covered bowl and water; and sauces in the door. In the
  // freezer, a tub of ice cream, ice lollies, peas and an ice tray. Magnets and a photo on the door.
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

  const lower = part();
  box(lower, [-13, 12], [3, SPLIT - 2], [1, 1], "inside");
  for (const y of [15, 27]) box(lower, [-13, 12], [y, y], [2, 7], "insideShelf");
  // The crisper drawer: a rail along the top and bottom of its front, the vegetables showing between.
  for (const y of [3, 8]) box(lower, [-13, 12], [y, y], [2, 7], "insideShelf");
  ellipsoid(lower, [-6, 5.5, 4], [4, 2.2, 2.4], (x, y, z) => (hash(x, y, z) < 0.35 ? "leaf" : "lettuce"));
  for (const x of [3, 6, 9]) {
    box(lower, [x, x + 1], [4, 5], [3, 6], "carrot");
    lower.add(x, 6, 3, "leaf");
  }
  // On the drawer: milk with a blue cap, a carton of orange juice, strawberry jam and a tray of eggs.
  box(lower, [-12, -10], [9, 12], [3, 5], "milk");
  lower.add(-11, 13, 4, "milk");
  lower.add(-11, 14, 4, "milkBlue");
  box(lower, [-8, -6], [9, 13], [3, 5], (x, y) => (y === 11 ? "milk" : "juice"));
  box(lower, [-8, -6], [14, 14], [4, 4], "juice");
  box(lower, [-3, -1], [9, 11], [4, 6], "berry");
  box(lower, [-3, -1], [12, 12], [4, 6], "frame");
  box(lower, [2, 11], [9, 9], [3, 6], "eggTray");
  for (let x = 2; x <= 11; x += 2) for (const z of [3, 5]) box(lower, [x, x + 1], [10, 10], [z, z + 1], "egg");
  // On the middle shelf: a slice of layer cake with a strawberry, a slice of watermelon and grapes.
  box(lower, [-12, -7], [16, 19], [3, 6], (x, y) => (y % 2 ? "cream" : "cake"));
  lower.add(-10, 20, 5, "berry");
  lower.add(-10, 21, 5, "leaf");
  for (let y = 16; y <= 20; y++) {
    const half = y <= 17 ? 4 : y === 20 ? 1 : 3 - (y - 18);
    box(lower, [-half, half - 1], [y, y], [4, 5], y === 16 ? "rind" : y === 17 ? "rindLight" : "berry");
  }
  for (const [x, y] of [
    [-2, 18],
    [1, 18],
    [0, 19],
  ])
    lower.add(x, y, 6, "seed");
  ellipsoid(lower, [8.5, 18, 4.5], [2, 2.5, 1.6], (x, y, z) => ((x + y + z) % 2 ? "grape" : "grapeDeep"));
  lower.add(8, 21, 4, "stem");
  // On the top shelf: two puddings, a covered bowl and a bottle of water.
  for (const x of [-12, -8]) {
    box(lower, [x, x + 2], [28, 29], [4, 6], "pudding");
    box(lower, [x, x + 2], [30, 30], [4, 6], "caramel");
  }
  ellipsoid(lower, [0, 29, 4.5], [3.5, 1.6, 2.5], "china");
  box(lower, [-2, 2], [31, 31], [4, 5], "cake");
  box(lower, [7, 9], [28, 35], [4, 5], "glass");
  lower.add(8, 36, 4, "milkBlue");

  const upper = part();
  box(upper, [-13, 12], [SPLIT + 2, TOP - 2], [1, 1], "inside");
  box(upper, [-13, 12], [50, 50], [2, 7], "insideShelf");
  // A tub of strawberry ice cream with a white lid, two ice lollies on sticks, a bag of peas, an ice tray.
  box(upper, [-12, -5], [42, 45], [3, 7], "icecream");
  box(upper, [-12, -5], [46, 46], [3, 7], "frame");
  for (const [x, c] of [
    [-1, "juice"],
    [2, "berry"],
  ]) {
    box(upper, [x, x + 1], [43, 47], [4, 5], c);
    upper.add(x, 42, 4, "woodLight");
  }
  box(upper, [-12, -6], [51, 54], [3, 6], (x, y) => (y === 54 ? "frameShade" : "melon"));
  box(upper, [3, 11], [51, 51], [3, 7], "iceBlue");
  for (let x = 4; x <= 10; x += 2) box(upper, [x, x], [52, 52], [4, 6], "frame");
  const insides = [lower, upper].map((p) => {
    const m = solid(p, COLORS, glowing); // lit from within
    m.visible = false;
    fridgeGroup.add(m);
    return m;
  });

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
      for (const y of [12, 24]) box(p, [-12, 10], [y, y], [8, 9], "insideShelf"); // the racks
      box(p, [-10, -9], [13, 17], [8, 8], "berry");
      p.add(-10, 18, 8, "frame");
      box(p, [-6, -5], [13, 16], [8, 8], "soy");
      box(p, [5, 6], [25, 28], [8, 8], "yolk");
      // Magnets: a heart and a star, and a photo held up by one.
      [
        [-9, 34],
        [-10, 33],
        [-8, 33],
        [-9, 32],
      ].forEach(([x, y]) => p.add(x, y, 12, "magnetRed"));
      [
        [3, 35],
        [2, 34],
        [3, 34],
        [4, 34],
        [3, 33],
      ].forEach(([x, y]) => p.add(x, y, 12, "magnetYellow"));
      box(p, [-9, -1], [17, 26], [12, 12], (x, y) => (y >= 20 && y <= 25 && x >= -8 && x <= -2 ? (y <= 21 ? "melon" : "photoSky") : "photo"));
      p.add(-5, 26, 13, "magnetRed");
    }
    pivot.inner.add(mesh(p));
    return pivot.outer;
  });
  const fridgeLight = new THREE.PointLight(0xeaf6ff, 0, 50, 0);
  fridgeLight.position.set(0, 30, 14);
  fridgeGroup.add(fridgeLight);
  footprint(FRIDGE[0] - 16, FRIDGE[0] + 15, BACK, FRIDGE[1] + 12);
  // `openers` stand at the fridge with its door open, `freezers` at the freezer.
  const fridge = { openers: 0, freezers: 0, k: [0, 0] };
  updates.push((t, dt) => {
    [fridge.openers, fridge.freezers].forEach((n, i) => {
      fridge.k[i] += ((n > 0 ? 1 : 0) - fridge.k[i]) * (1 - Math.exp(-5 * dt));
      doors[i].rotation.y = -1.6 * fridge.k[i];
      insides[i].visible = fridge.k[i] > 0.02;
    });
    fridgeLight.intensity = 0.8 * Math.max(...fridge.k);
  });

  // The counter: cupboards under a walnut top with the kettle, a bowl of fruit and the pets' food tin, and
  // a shelf of mugs on the wall above.
  const COUNTER = [-95, -100];
  const counter = part();
  box(counter, [-21, 20], [0, 33], [-10, 8], (x, y, z) => {
    if (y <= 2) return "cabinetLine";
    if (z === 8 && (x === -8 || x === 7 || y === 28)) return "cabinetLine";
    return "cabinet";
  });
  for (const x of [-11, -4, 10]) counter.add(x, 24, 9, "brass");
  box(counter, [-22, 21], [34, 35], [-11, 10], "counterTop");
  for (let y = 36; y <= 42; y++)
    ellipsoid(counter, [-13, y, -2], [4 - Math.abs(y - 39) * 0.45, 0.5, 4 - Math.abs(y - 39) * 0.45], y === 36 ? "kettleDark" : "kettle");
  box(counter, [-17, -16], [40, 41], [-2, -2], "kettleDark");
  box(counter, [-10, -8], [39, 40], [-2, -2], "kettle"); // the spout
  counter.add(-13, 43, -2, "kettleDark");
  ellipsoid(counter, [1, 37, 0], [5, 1.4, 4], (x, y) => (y >= 38 ? "mugBlue" : "mug"));
  [
    [-1, 39, 0, "apple"],
    [2, 39, -1, "orange"],
    [1, 40, 1, "pear"],
    [3, 39, 2, "apple"],
  ].forEach(([x, y, z, c]) => ellipsoid(counter, [x, y, z], [1.4, 1.4, 1.4], c));
  for (let y = 36; y <= 45; y++) ellipsoid(counter, [14, y, -2], [3.4, 0.5, 3.4], y >= 44 ? "woodMid" : y >= 39 && y <= 42 ? "bone" : "tin");
  [
    [13, 41],
    [15, 41],
    [14, 40],
  ].forEach(([x, y]) => counter.add(x, y, 2, "paw"));
  place(house, mesh(counter), [COUNTER[0], 0, COUNTER[1]]);
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
  // Wall cupboards with green glass doors.
  box(stovePart, [-22, 21], [56, 76], [-10, -4], (x, y, z) => {
    if (z < -4 || y === 56 || y === 76) return "cabinet";
    const u = (((x + 22) % 11) + 11) % 11;
    if (u === 0) return "cabinetLine";
    return y >= 59 && y <= 73 && u >= 2 && u <= 9 ? (y === 66 ? "cabinetGreen" : "glass") : "cabinetGreen";
  });
  stoveGroup.add(mesh(stovePart));
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

  /* ---------- the loft: the computer desk, the bed and the dressing corner ---------- */

  const Y = LOFT.y;
  // The boy's desk: a white top on a drawer unit and legs; his monitor on its stand with a second one on
  // its left stood on end, a keyboard with a glow under its keys, a mouse on its pad and a mug; in front of
  // the screen on end, his white headphones on their stand while he is not wearing them, and a little Kirby
  // on a Warp Star just behind them. The right end is clear (the cat lies there to watch him play). His computer stands on the floor beside the desk, its fans glowing in colours that
  // slowly change, and the white power light on its top lit only while it is on.
  const DESK = [54, -100]; // clear of the top of the stairs, to walk past
  const desk = part();
  box(desk, [-27, 26], [14, 15], [-9, 9], (x, y, z) => (y === 14 || z === 9 ? "deskShade" : "desk"));
  box(desk, [-26, -15], [0, 13], [-8, 8], (x, y, z) => (z === 8 && (y === 4 || y === 9) ? "deskShade" : "desk"));
  for (const z of [-8, 7]) box(desk, [24, 25], [0, 13], [z, z + 1], "deskShade");
  for (const y of [6, 11]) box(desk, [-22, -19], [y, y], [9, 9], "steelDark");
  box(desk, [-25, -17], [16, 16], [-7, -3], "tvEdge"); // the monitor on end, on its stand
  box(desk, [-21, -21], [17, 19], [-6, -6], "tvEdge");
  box(desk, [-26, -16], [20, 46], [-5, -5], "tvBody");
  box(desk, [-2, 5], [16, 16], [-7, -3], "tvEdge"); // the main monitor's stand, and the monitor
  box(desk, [1, 2], [17, 21], [-6, -6], "tvEdge");
  box(desk, [-12, 15], [22, 38], [-5, -5], "tvBody");
  box(desk, [-5, 8], [16, 16], [5, 8], (x, y, z) => (z === 8 || (x + z) % 3 ? "keyboard" : "keyLight"));
  box(desk, [9, 14], [16, 16], [5, 9], "keyboard"); // the mouse pad
  box(desk, [11, 12], [17, 17], [7, 8], "chairWhite"); // the mouse
  for (let y = 16; y <= 19; y++) ellipsoid(desk, [-11, y, 5], [1.7, 0.5, 1.7], y === 19 ? "coffee" : "mugBlue");
  box(desk, [-23, -19], [16, 16], [2, 6], "pcCase"); // the headphone stand: a foot, a post and a hook
  box(desk, [-21, -21], [17, 30], [4, 4], "pcCase");
  const tower = [
    [29, 37],
    [0, 23],
    [-8, 4],
  ];
  box(desk, ...tower, (x, y, z) => (z === 4 && (x === 29 || x === 37 || y === 0 || y === 23) ? "pcEdge" : "pcCase"));
  place(house, mesh(desk), [DESK[0], Y, DESK[1]]);
  const rgbPart = part();
  for (const fy of [6, 13, 20])
    for (let a = 0; a < 12; a++)
      rgbPart.add(33 + Math.round(2.4 * Math.cos((a * Math.PI) / 6)), fy + Math.round(2.4 * Math.sin((a * Math.PI) / 6)), 5, "white");
  const rgb = place(house, solid(rgbPart, COLORS, new THREE.MeshBasicMaterial({ vertexColors: true })), [DESK[0], Y, DESK[1]]);
  const power = place(house, new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 2), new THREE.MeshBasicMaterial()), [DESK[0] + 35, Y + 23.8, DESK[1] + 1]);
  footprint(DESK[0] - 27, DESK[0] + 38, BACK, DESK[1] + 10);

  // His white headphones on their stand, the band over the hook and a cup hanging either side, their
  // black cushions turned in.
  const phonesPart = part();
  for (let a = 0.2; a <= Math.PI - 0.2; a += 0.05) {
    const [x, y] = [Math.round(-21 + 5.5 * Math.cos(a)), Math.round(26 + 5.5 * Math.sin(a))];
    phonesPart.add(x, y, 4, Math.abs(x + 21) <= 2 ? "phonePad" : "phoneCup");
  }
  for (const side of [-1, 1]) {
    box(phonesPart, [-21 + side * 6, -21 + side * 6], [20, 26], [3, 5], "phoneCup");
    box(phonesPart, [-21 + side * 5, -21 + side * 5], [20, 26], [3, 5], "phoneCushion");
  }
  const phonesOnStand = place(house, mesh(phonesPart), [DESK[0], Y, DESK[1]]);

  // The little Kirby: on a yellow Warp Star over a cloud with a solar panel, on a lilac base. Built at half
  // a voxel to the voxel; while the sun is up the star and Kirby rock from side to side.
  const kirby = place(house, new THREE.Group(), [DESK[0] - 21, Y + 15.5, DESK[1] - 0.5], 0.35);
  kirby.scale.setScalar(0.5);
  const kirbyBase = part();
  for (let y = 0; y <= 3; y++) ellipsoid(kirbyBase, [0, y, 0], [6.5, 0.5, 5], y === 3 ? "kirbyBaseTop" : "kirbyBase");
  box(kirbyBase, [-3, 3], [1, 2], [5, 5], "brass"); // the name plate
  ellipsoid(kirbyBase, [0, 7, 0], [7.5, 3.5, 5], (x, y, z) =>
    hash(x, y, z) < 0.06 ? ["tin", "pink", "skyStar", "melon"][Math.floor(hash(z, x, y) * 4)] : "cloud"
  );
  for (let x = -3; x <= 3; x++) for (let y = 6; y <= 8; y++) kirbyBase.front(x, y)[3] = y === 7 && x % 2 === 0 ? "solarLine" : "solar"; // the solar panel
  kirby.add(mesh(kirbyBase));
  const rocker = pivotGroup(kirby, [0, 10, 0]);
  const kirbyTop = part();
  // The star: five points, its radius going from 7.5 at a point to 3 between two.
  for (let x = -8; x <= 8; x++)
    for (let y = 6; y <= 22; y++) {
      const u = ((Math.atan2(x, y - 14) + Math.PI * 2) % ((Math.PI * 2) / 5)) / (Math.PI / 5) - 1; // -1 to 1, 0 between points
      if (Math.hypot(x, y - 14) <= 3 + 4.5 * Math.abs(u)) box(kirbyTop, [x, x], [y, y], [-2, 2], "starYellow");
    }
  ellipsoid(kirbyTop, [0, 23, 1], [5, 4.6, 4.6], "kirbyPink");
  for (const side of [-1, 1]) {
    ellipsoid(kirbyTop, [side * 3, 18.5, 2.5], [2.4, 1.3, 2.4], "kirbyFeet");
    ellipsoid(kirbyTop, [side * 5, 23, 1.5], [1.5, 1.5, 1.5], "kirbyPink"); // its stubby arms
  }
  // Its face, on the front of the ball: tall eyes, dark with a glint at the top and blue at the bottom,
  // pink cheeks and a little open mouth.
  const paint = (x, y, color) => (kirbyTop.front(x, y)[3] = color);
  for (const x0 of [-2, 1])
    for (let y = 23; y <= 25; y++) for (const x of [x0, x0 + 1]) paint(x, y, y === 23 ? "kirbyEyeBlue" : y === 25 && x === x0 ? "white" : "kirbyEye");
  for (const x of [-4, -3, 3, 4]) paint(x, 22, "kirbyBlush");
  paint(0, 21, "kirbyMouth");
  rocker.inner.add(mesh(kirbyTop));
  // The two screens, and their glow on him at night. The one on end shows his team's voice chat while he
  // plays, his own name lit up green while he talks, and the chat scrolling up below.
  const MON = [26, 15];
  const monitor = pixelTexture(...MON, () => {});
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(...MON), new THREE.MeshBasicMaterial({ map: monitor.tex })), [
    DESK[0] + 1.5,
    Y + 30,
    DESK[1] - 4.4,
  ]);
  const SIDE_MON = [11, 25];
  const sideMonitor = pixelTexture(...SIDE_MON, () => {});
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(...SIDE_MON), new THREE.MeshBasicMaterial({ map: sideMonitor.tex })), [
    DESK[0] - 21,
    Y + 33,
    DESK[1] - 4.4,
  ]);
  const monLight = new THREE.PointLight(0xa8c8ff, 0, 60, 0);
  monLight.position.set(DESK[0], Y + 30, DESK[1] + 14);
  house.add(monLight);

  // The gaming chair: black with white panels, on a five-star base. Its seat and back turn with whoever
  // sits in it.
  const CHAIR = [DESK[0], -84];
  const chairBase = part();
  box(chairBase, [-1, 0], [1, 5], [-1, 0], "steelDark");
  for (let a = 0; a < 5; a++) {
    const [dx, dz] = [Math.cos((a * 2 * Math.PI) / 5 + 0.3), Math.sin((a * 2 * Math.PI) / 5 + 0.3)];
    for (let r = 1; r <= 6; r++) chairBase.add(Math.round(dx * r - 0.5), 1, Math.round(dz * r - 0.5), "chairBlack");
    chairBase.add(Math.round(dx * 6 - 0.5), 0, Math.round(dz * 6 - 0.5), "steelDark");
  }
  place(house, mesh(chairBase), [CHAIR[0], Y, CHAIR[1]]);
  const chairTop = part();
  box(chairTop, [-6, 6], [6, 8], [-5, 5], (x, y) => (y === 8 && Math.abs(x) <= 2 ? "chairWhite" : "chairBlack"));
  box(chairTop, [-6, 6], [9, 21], [6, 7], (x, y) => (Math.abs(x) === 4 && y < 20 ? "chairWhite" : "chairBlack"));
  for (const side of [-1, 1]) {
    box(chairTop, [side * 7, side * 7], [9, 10], [0, 0], "steelDark");
    box(chairTop, [side * 7, side * 7], [11, 11], [-4, 3], "chairBlack");
  }
  const chair = place(house, new THREE.Group(), [CHAIR[0], Y, CHAIR[1]]);
  chair.add(mesh(chairTop));
  footprint(CHAIR[0] - 7, CHAIR[0] + 7, CHAIR[1] - 6, CHAIR[1] + 8);
  const pc = { mode: "off", game: GAMES[0], since: 0, sitter: null, talking: false };
  const rectOn = (g) => (x, y, rw, rh, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), rw, rh);
  };
  function drawMonitor(t) {
    drawPcGame(monitor.g, ...MON, pc.mode, pc.game, t, t - pc.since);
    monitor.tex.needsUpdate = true;
  }
  const TEAM = ["#f28aa8", "#8fd3ff", "#f6cf4a", "#9fe0a8"]; // his, then his three teammates'
  function drawSideMonitor(t) {
    const rect = rectOn(sideMonitor.g);
    const [w, h] = SIDE_MON;
    if (pc.mode === "off") rect(0, 0, w, h, "#060608");
    else {
      rect(0, 0, w, h, "#262a3a");
      rect(0, 0, w, 2, "#5b6ee1");
      // The voice channel: a little face for each of them, ringed in green while they talk.
      TEAM.forEach((c, i) => {
        const y = 3 + i * 3;
        const talking = i === 0 ? pc.talking : Math.sin(t * (1.3 + i) + i * 2) > 0.7;
        rect(1, y, 3, 2, talking ? "#3fd47a" : "#262a3a");
        rect(2, y, 1, 2, c);
        rect(5, y + 1, 3 + ((i * 2) % 4), 1, "#9aa3c0");
      });
      // The chat, scrolling up a line every second.
      const first = Math.floor(t);
      for (let k = 0; k < 6; k++) {
        const line = first + k;
        rect(1, 16 + k * 1.5, 1, 1, TEAM[line % 4]);
        rect(3, 16 + k * 1.5, 2 + Math.floor(hash(line, 1, 2) * 7), 1, "#c9cfe3");
      }
      if (pc.mode !== "game") rect(1, 15, w - 2, 1, pc.mode === "win" ? "#f6cf4a" : "#e0605a");
    }
    sideMonitor.tex.needsUpdate = true;
  }
  let monitorAt = -1;
  let kirbySway = 0;
  const hue = new THREE.Color();
  updates.push((t, dt) => {
    if (pc.mode !== "off" && t - monitorAt > 0.08) {
      drawMonitor(t);
      drawSideMonitor(t);
      monitorAt = t;
    }
    monLight.intensity = pc.mode === "off" ? 0 : night ? 0.6 : 0.25;
    rgb.material.color.copy(hue.setHSL((t * 0.08) % 1, 0.8, 0.6));
    power.material.color.set(pc.mode === "off" ? "#3b3d47" : "#ffffff");
    // The chair turns with whoever sits in it, and back to the desk after.
    const target = pc.sitter && pc.sitter.seated ? pc.sitter.yaw - Math.PI : 0;
    chair.rotation.y += Math.atan2(Math.sin(target - chair.rotation.y), Math.cos(target - chair.rotation.y)) * (1 - Math.exp(-8 * dt));
    // The Kirby rocks in the sunlight, and comes to rest in the dark.
    kirbySway += ((night ? 0 : 1) - kirbySway) * (1 - Math.exp(-2 * dt));
    rocker.outer.rotation.z = 0.28 * kirbySway * Math.sin(t * 2.6);
  });

  // A low bookshelf under the side window: books of all colours and heights on three shelves, a plant and
  // a photo on top. One red book is the one the girl and the boy take down to read.
  const SHELF = [-144, 15];
  const SHELF_YAW = Math.PI / 2;
  const shelf = part();
  box(shelf, [-14, 13], [0, 33], [-5, 5], "woodMid", [{ has: (x, y, z) => x >= -12 && x <= 11 && y >= 2 && y <= 31 && z >= -4 }]);
  box(shelf, [-12, 11], [2, 31], [-5, -5], "woodDeep");
  for (const y of [11, 22]) box(shelf, [-12, 11], [y, y], [-4, 5], "woodMid");
  const BOOK_COLORS = ["bookA", "bookB", "bookC", "bookD", "bookE", "bookF", "bookG"];
  for (const [base, seed] of [
    [2, 1],
    [12, 2],
    [23, 3],
  ]) {
    let x = -12;
    let n = 0;
    while (x <= 9) {
      const width = 2 + Math.floor(hash(x, seed, 9) * 2);
      const height = 5 + Math.floor(hash(seed, x, 4) * 3);
      const color = BOOK_COLORS[Math.floor(hash(x, seed, 2) * BOOK_COLORS.length)];
      const gap = hash(seed, x, n) < 0.12;
      if (seed === 2 && x + width > -2 && x < 2) {
        x = 2; // the reading book's place
        continue;
      }
      if (!gap)
        box(shelf, [x, Math.min(x + width - 1, 11)], [base, base + height], [-3, 3], (bx, by) => (by === base + height - 2 ? "frame" : color));
      x += width + (gap ? 2 : 0);
      n++;
    }
  }
  ellipsoid(shelf, [8, 36, 0], [2.4, 2.4, 2.4], "pot");
  ellipsoid(shelf, [8, 39, 0], [3.2, 2.4, 2.8], (x, y, z) => (hash(x, y, z) < 0.3 ? "plantLight" : "plant"));
  box(shelf, [-10, -5], [34, 39], [-1, -1], (x, y) =>
    x === -10 || x === -5 || y === 34 || y === 39 ? "canvasFrame" : y < 37 ? "melon" : "photoSky"
  );
  const readingBook = part();
  box(readingBook, [-1, 1], [12, 19], [-3, 3], (x, y) => (y === 17 ? "frame" : "bookA"));
  const shelfGroup = place(house, new THREE.Group(), [SHELF[0], 0, SHELF[1]], SHELF_YAW);
  shelfGroup.add(mesh(shelf));
  const bookOnShelf = mesh(readingBook);
  shelfGroup.add(bookOnShelf);
  turnedFootprint(SHELF, SHELF_YAW, [-15, 14, -6, 6]);

  // The bed under the window, for two: a honey-wood frame with a heart on the headboard, two pillows, and
  // the quilt from the girl's bed on the profile page (girl-props.js): white and pale pink squares with a
  // little bear on each white one, the sheet turned down over its top. It rises over whoever is tucked in
  // on each side.
  const BED = [129, -85];
  const bed = part();
  box(bed, [-25, 25], [0, 4], [-24, 25], (x, y) => (y === 4 ? "woodDark" : "wood"));
  box(bed, [-24, 24], [5, 8], [-21, 24], "sheet");
  for (let z = -25; z <= -22; z++)
    for (let x = -25; x <= 25; x++) {
      const top = 26 - Math.round((x * x) / 120); // a rounded top
      for (let y = 0; y <= top; y++) bed.add(x, y, z, y === top || Math.abs(x) === 25 ? "woodDark" : "wood");
    }
  const HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
  HEART.forEach((row, j) => [...row].forEach((c, i) => c === "X" && bed.add(i - 3, 22 - j, -21, "heart")));
  for (const side of [-1, 1])
    ellipsoid(bed, [side * 12.5, 10, -15], [10, 2.5, 5.5], (x) => (Math.abs(x - side * 12.5) > 8.5 ? "pillowTrim" : "sheet"), [], 3);
  const BEAR = ["X...X", "XXXXX", "XEXEX", "XMNMX", ".XXX."];
  const BEAR_COLORS = { X: "bear", E: "bearDark", N: "bearDark", M: "bearMuzzle" };
  const quiltColor = (x, z) => {
    if (z <= 3) return "sheet"; // turned down over the top
    const [tx, tz] = [Math.floor((x + 24) / 7), Math.floor((z - 4) / 7)];
    if ((tx + tz) & 1) return "quiltPink";
    const [i, j] = [x + 24 - 7 * tx, z - 4 - 7 * tz];
    const cell = i >= 1 && i <= 5 && j >= 1 && j <= 5 ? BEAR[j - 1][i - 1] : "."; // its ears towards the pillows
    return cell === "." ? "quiltWhite" : BEAR_COLORS[cell];
  };
  box(bed, [-24, 24], [9, 9], [1, 24], (x, y, z) => quiltColor(x, z));
  box(bed, [-24, 24], [5, 9], [25, 25], (x, y) => (y === 9 ? quiltColor(x, 25) : "quiltPink")); // hanging over the foot
  place(house, mesh(bed), [BED[0], Y, BED[1]]);
  footprint(BED[0] - 25, BED[0] + 25, BACK, BED[1] + 25);
  const MATTRESS = Y + 9.5; // the top of the quilt, made
  const ON_BED = MATTRESS + 0.5; // where a pet on it stands
  const QUILT_H = 12;
  const quilts = [-1, 1].map((side) => {
    const p = part();
    for (let x = 1; x <= 24; x++)
      for (let z = 1; z <= 24; z++) {
        const top = Math.round(QUILT_H * Math.min(1, Math.sin((Math.PI * x) / 25) * 1.6) * Math.min(1, (25 - z) / 3, z / 2));
        for (let y = 0; y <= top; y++) p.add(side * x, y, z, quiltColor(side * x, z));
      }
    const m = place(house, mesh(p), [BED[0], MATTRESS - 0.5, BED[1]]);
    m.scale.y = 0.01;
    m.visible = false;
    return m;
  });
  const beds = { slots: [false, false], k: [0, 0] };
  updates.push((t, dt) => {
    quilts.forEach((m, i) => {
      beds.k[i] += ((beds.slots[i] ? 1 : 0) - beds.k[i]) * (1 - Math.exp(-4 * dt));
      m.visible = beds.k[i] > 0.02;
      m.scale.y = Math.max(0.01, beds.k[i]);
    });
  });

  // A nightstand by the bed with a little lamp on it, lit at night: a second warm light to the floor lamp's.
  const STAND = [98, -103];
  const stand = part();
  box(stand, [-4, 4], [0, 12], [-5, 5], (x, y, z) => (z === 5 && (y === 6 || y === 12 || Math.abs(x) === 4) ? "woodDark" : "wood"));
  stand.add(0, 9, 6, "brass"); // the drawer's knob
  box(stand, [-2, 2], [13, 13], [-2, 2], "woodDark");
  box(stand, [0, 0], [14, 17], [0, 0], "brass");
  place(house, mesh(stand), [STAND[0], Y, STAND[1]]);
  const lampShade = part();
  for (let y = 18; y <= 23; y++)
    ellipsoid(lampShade, [0, y, 0], [4.6 - (y - 18) * 0.4, 0.5, 4.6 - (y - 18) * 0.4], y === 18 || y === 23 ? "shadeTrim" : "shade");
  const shadeDay = place(house, mesh(lampShade), [STAND[0], Y, STAND[1]]);
  const shadeLit = place(house, solid(lampShade, COLORS, glowing), [STAND[0], Y, STAND[1]]);
  const bedLamp = new THREE.PointLight(0xffd29a, 0, 95, 0);
  bedLamp.position.set(STAND[0] + 4, Y + 21, STAND[1] + 8);
  house.add(bedLamp);
  footprint(STAND[0] - 5, STAND[0] + 5, BACK, STAND[1] + 6);

  // The girl's dressing corner, past a low shoe cabinet: her outfits on a rail along the wall (the one she
  // has on missing from its hanger), a shelf over it with her straw hat and boxes, a long mirror leaning on
  // the cabinet, a round rug, and a folding screen to change behind. Clicking it lets you choose what she
  // wears (playground.js).
  const closetParts = []; // what a click on the dressing corner can land on
  const CABINET = [157, 160, BACK, -72];
  const cabinet = part();
  box(cabinet, CABINET.slice(0, 2), [0, 15], CABINET.slice(2), (x, y, z) =>
    y === 15 ? "woodDark" : x === 160 && (z % 9 === 0 || y === 0) ? "woodDark" : "wood"
  );
  for (const [z, c] of [
    [-104, "chairWhite"],
    [-100, "chairWhite"],
    [-90, "shoe"],
    [-86, "shoe"],
  ])
    box(cabinet, [158, 159], [16, 16], [z, z + 2], c); // her slides, his shoes
  place(house, mesh(cabinet), [0, Y, 0]);
  footprint(CABINET[0], CABINET[1] + 2, CABINET[2], CABINET[3]);
  const mirror = part();
  box(mirror, [161, 162], [0, 44], [-97, -79], (x, y, z) =>
    x === 161 || y === 0 || y === 44 || z === -97 || z === -79 ? "woodDark" : (y + z) % 11 === 0 || (y + z) % 11 === 1 ? "mirrorGleam" : "mirror"
  );
  closetParts.push(place(house, mesh(mirror), [0, Y, 0]));

  const RAIL_Y = Y + 50;
  const rail = part();
  for (const x of [164, 204]) box(rail, [x, x], [0, 50], [-104, -104], "brass");
  box(rail, [164, 204], [50, 50], [-104, -104], "brass");
  box(rail, [162, 206], [56, 57], [BACK, -101], "woodMid"); // the shelf
  for (const x of [166, 202]) box(rail, [x, x], [52, 55], [BACK, -108], "woodDeep");
  box(rail, [182, 191], [58, 61], [BACK + 1, -103], (x, y) => (y === 61 ? "boxLid" : "boxPink"));
  box(rail, [194, 201], [58, 60], [BACK + 1, -103], (x, y) => (y === 60 ? "boxLid" : "boxBlue"));
  closetParts.push(place(house, mesh(rail), [0, Y, 0]));
  const strawHat = part();
  for (let x = -7; x <= 7; x++)
    for (let z = -6; z <= 6; z++) if (x * x + z * z <= 42) strawHat.add(x, 0, z, (x + z) % 3 ? "hatStraw" : "hatStrawDark");
  ellipsoid(strawHat, [0, 2, 0], [4.2, 2, 4.2], (x, y) => (y === 1 ? "hatBand" : (x + y) % 3 ? "hatStraw" : "hatStrawDark"), [
    { has: (x, y) => y < 1 },
  ]);
  const hatOnShelf = place(house, mesh(strawHat), [173, RAIL_Y + 8, -105]);
  closetParts.push(hatOnShelf);
  // The outfits on their hangers, each the clothes of one of her looks (girl-outfits.js), seen from the front.
  const hanging = LOOKS.map((look, k) => {
    const p = part();
    const x0 = 170 + 9 * k;
    p.add(x0, -1, 0, "woodDark");
    box(p, [x0 - 3, x0 + 3], [-2, -2], [0, 0], "woodDark");
    const garment = part();
    look.hang(garment, x0);
    const g = new THREE.Group();
    g.add(mesh(p));
    const clothes = mesh(garment);
    g.add(clothes);
    g.position.set(0, RAIL_Y, -104);
    house.add(g);
    closetParts.push(g);
    return clothes;
  });
  const rug2 = new THREE.Mesh(new THREE.CircleGeometry(15, 24), new THREE.MeshLambertMaterial({ color: COLORS.boxPink }));
  rug2.rotation.x = -Math.PI / 2;
  place(house, rug2, [184, Y - 0.47, -78]);
  footprint(162, 206, BACK, -100);
  // The folding screen: three panels zigzagging, a cloth with little flowers in a wooden frame.
  const screenPart = part();
  [
    [178, 186, -46],
    [187, 195, -48],
    [196, 204, -46],
  ].forEach(([xa, xb, z]) =>
    box(screenPart, [xa, xb], [0, 47], [z, z], (x, y) =>
      x === xa || x === xb || y <= 1 || y === 47 ? "woodDark" : hash(x, y, 5) < 0.06 ? "heart" : "screenCloth"
    )
  );
  closetParts.push(place(house, mesh(screenPart), [0, Y, 0]));
  footprint(177, 205, -49, -45);
  const closet = {
    parts: closetParts,
    // The looks whose clothes are off their hangers (and the hat off the shelf): the one she has on, and
    // while she changes, the one she is changing into.
    hang(missing) {
      hanging.forEach((m, i) => (m.visible = !missing.includes(i)));
      hatOnShelf.visible = !missing.some((k) => LOOKS[k].hat);
    },
  };
  closet.hang([0]);

  /* ---------- the living room: the sofa, the coffee table on its rug, the armchair, the TV ---------- */

  // The sofa corner (the girl's): the sofa, a floor lamp at one end and a plant at the other.
  const SOFA = [-45, 30];
  const sofaHolder = place(house, new THREE.Group(), [SOFA[0], 0, SOFA[1]]);
  const corner = sofaCorner(sofaHolder, COLORS);
  corner.update(1);
  const lamp = corner.lamp;
  const shadeColor = lamp.shade.material.color.clone();
  footprint(SOFA[0] - 31, SOFA[0] + 31, SOFA[1] - 9, SOFA[1] + 10);
  footprint(SOFA[0] - 41, SOFA[0] - 35, SOFA[1] - 9, SOFA[1] - 3, false);
  footprint(SOFA[0] + 35, SOFA[0] + 43, SOFA[1] - 9, SOFA[1] - 1, false);

  const ARMCHAIR = [40, 50];
  const armchair = part();
  for (const x of [-11, 10]) for (const z of [-8, 8]) box(armchair, [x, x + 1], [0, 1], [z, z], "sofaLeg");
  box(armchair, [-12, 12], [2, 5], [-9, 9], (x, y) => (y === 2 ? "sofaShade" : "sofa"));
  ellipsoid(armchair, [0, 14, -7.5], [12.5, 9, 1.8], "sofa", [], 6);
  for (const side of [-1, 1]) ellipsoid(armchair, [side * 12, 10, 0], [2.8, 5, 9.2], "sofa", [], 4);
  box(armchair, [-9, 9], [6, 9], [-5, 9], (x, y, z) => (z === 9 || y === 6 ? "sofaShade" : "cushion"));
  ellipsoid(armchair, [0, 15, -4.5], [8.5, 5, 1.6], "cushion", [], 4);
  ellipsoid(armchair, [6, 13, -2], [3.5, 3.5, 1.4], (x, y) => ((x + y) % 2 ? "throw" : "throwRow"), [], 3); // a knitted cushion
  place(house, mesh(armchair), [ARMCHAIR[0], 0, ARMCHAIR[1]]);
  footprint(ARMCHAIR[0] - 14, ARMCHAIR[0] + 14, ARMCHAIR[1] - 10, ARMCHAIR[1] + 10);

  const TABLE = [-45, 72];
  const rug = pixelTexture(124, 54, (g, w, h) => {
    g.fillStyle = "#f2e4c9";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#c9765a";
    g.fillRect(2, 2, w - 4, h - 4);
    g.fillStyle = "#f2e4c9";
    g.fillRect(5, 5, w - 10, h - 10);
    g.fillStyle = "#e0b04f";
    g.fillRect(7, 7, w - 14, 1);
    g.fillRect(7, h - 8, w - 14, 1);
    g.fillRect(7, 7, 1, h - 14);
    g.fillRect(w - 8, 7, 1, h - 14);
    for (let cx = 18; cx < w - 10; cx += 22)
      for (let y = -6; y <= 6; y++)
        for (let x = -6; x <= 6; x++) {
          const d = Math.abs(x) + Math.abs(y);
          if (d === 6 || d === 3) {
            g.fillStyle = d === 6 ? "#d99a7a" : "#c9765a";
            g.fillRect(cx + x, h / 2 + y, 1, 1);
          }
        }
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = "#e6d3b0"; // the fringe
      g.fillRect(x, 0, 1, 1);
      g.fillRect(x, h - 1, 1, 1);
    }
  });
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(124, 54), new THREE.MeshLambertMaterial({ map: rug.tex }));
  rugMesh.rotation.x = -Math.PI / 2;
  place(house, rugMesh, [TABLE[0], -0.47, TABLE[1] - 2]);

  const table = part();
  box(table, [-22, 21], [10, 11], [-10, 9], (x, y, z) => (y === 10 || z === 9 || Math.abs(x + 0.5) > 21 ? "woodMid" : "woodLight"));
  for (const x of [-21, 19]) for (const z of [-9, 7]) box(table, [x, x + 1], [0, 9], [z, z + 1], "woodMid");
  box(table, [-20, 19], [3, 3], [-8, 7], "woodMid"); // the shelf underneath, with magazines
  box(table, [-16, -6], [4, 4], [-5, 3], "magazine");
  box(table, [-13, -3], [5, 5], [-4, 4], "magazine2");
  // A mug and the remote on top.
  for (let y = 12; y <= 15; y++) ellipsoid(table, [-14, y, -3], [1.7, 0.5, 1.7], y === 15 ? "coffee" : y === 13 ? "mugBlue" : "mug");
  table.add(-12, 14, -3, "mug");
  box(table, [-6, -2], [12, 12], [3, 4], "remote");
  place(house, mesh(table), [TABLE[0], 0, TABLE[1]]);
  footprint(TABLE[0] - 22, TABLE[0] + 22, TABLE[1] - 10, TABLE[1] + 10);

  // The fireplace on the left wall, built facing +z and turned to face the room: a red brick surround round
  // a sooty firebox with logs on a grate, a wooden mantel with the games console, the two controllers, a
  // photo and two candles on it, and a stone hearth in front; a basket of logs beside it. The TV hangs on
  // the wall over the mantel.
  const TV = { at: [-150, 70], turn: Math.PI / 2 };
  const tvGroup = place(house, new THREE.Group(), [TV.at[0], 0, TV.at[1]], TV.turn);
  const hearth = part();
  const brick = (x, y) => {
    const row = Math.floor(y / 3);
    const u = x + 22 + (row % 2) * 3;
    if (y % 3 === 2 || u % 6 === 0) return "mortar";
    return hash(Math.floor(u / 6), row, 3) < 0.35 ? "brickDark" : "brick";
  };
  const FIREBOX = { has: (x, y, z) => x >= -11 && x <= 10 && y >= 2 && y <= 21 && z >= 2 };
  box(hearth, [-22, 21], [0, 35], [0, 7], (x, y) => (x >= -11 && x <= 10 && y >= 2 && y <= 21 ? "soot" : brick(x, y)), [FIREBOX]);
  for (let x = -12; x <= 11; x++) hearth.add(x, 22, 7, "brickDark"); // the lintel's edge
  box(hearth, [-24, 23], [36, 37], [-1, 9], (x, y) => (y === 36 ? "woodDeep" : "woodMid")); // the mantel
  box(hearth, [-24, 23], [0, 1], [8, 17], (x, y, z) => ((x + z) % 7 === 0 ? "stoneDark" : "stone")); // the hearth stone
  for (const x of [-8, 7]) box(hearth, [x, x], [2, 3], [3, 6], "steelDark"); // the grate
  box(hearth, [-9, 8], [3, 3], [3, 6], "steelDark");
  for (const [z, y] of [
    [4, 5],
    [5.5, 7],
  ])
    for (let x = -7; x <= 6; x++) ellipsoid(hearth, [x, y, z], [0.5, 1.4, 1.4], x === -7 || x === 6 ? "logEnd" : "log");
  // On the mantel: the games console, a photo of the two of them, and two candles.
  box(hearth, [-5, 4], [38, 39], [1, 6], "console");
  box(hearth, [-4, 3], [39, 39], [7, 7], "steelDark");
  box(hearth, [-20, -13], [38, 45], [2, 2], (x, y) =>
    x === -20 || x === -13 || y === 38 || y === 45 ? "canvasFrame" : y < 41 ? "melon" : "photoSky"
  );
  for (const x of [14, 18]) box(hearth, [x, x + 1], [38, 41 + (x % 3)], [4, 5], "cream");
  tvGroup.add(mesh(hearth));
  // The candle flames and the fire: lit (unlit material) and flickering.
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const candles = cells(
    [
      [14.5, 44, 4.5, "tin"],
      [18.5, 42, 4.5, "tin"],
    ],
    COLORS
  );
  candles.material = new THREE.MeshBasicMaterial();
  tvGroup.add(candles);
  const flames = [0, 1, 2].map((frame) => {
    const p = part();
    for (let k = 0; k < 5; k++) {
      const x = -8 + k * 4 + (frame === k % 3 ? 1 : 0);
      const tall = 7 + Math.round(5 * hash(k, frame, 7)) - (k === 0 || k === 4 ? 3 : 0);
      for (let y = 0; y < tall; y++) {
        const w = Math.max(0, Math.round(2.2 * (1 - y / tall)));
        for (let dx = -w; dx <= w; dx++)
          p.add(x + dx, 7 + y, 4 + (y % 2), y < tall * 0.35 ? (dx ? "fireRed" : "fireOrange") : y < tall * 0.75 ? "fireOrange" : "fireYellow");
      }
    }
    const m = solid(p, COLORS, flameMat);
    m.visible = false;
    tvGroup.add(m);
    return m;
  });
  const fireLight = new THREE.PointLight(0xff9a4a, 0, 120, 0);
  fireLight.position.set(0, 14, 22);
  tvGroup.add(fireLight);
  turnedFootprint(TV.at, TV.turn, [-24, 23, 0, 17]);
  const basket = part();
  for (let y = 0; y <= 7; y++)
    ellipsoid(basket, [0, y, 0], [5.5, 0.5, 4.5], (x, yy, z) => ((x + y + z) % 2 ? "wicker" : "wickerDark"), [
      { has: (x, yy, z) => y >= 2 && (x / 4.2) ** 2 + (z / 3.2) ** 2 < 1 },
    ]);
  for (const [z, y] of [
    [-1.5, 4],
    [1.5, 4],
    [0, 6],
  ])
    for (let x = -5; x <= 5; x++) ellipsoid(basket, [x, y, z], [0.5, 1.3, 1.3], Math.abs(x) === 5 ? "logEnd" : "log");
  place(house, mesh(basket), [X0 + 8, 0, 103], Math.PI / 2);
  footprint(X0, X0 + 15, 96, 110);
  // The fire, once lit, burns for a while, then dies down.
  const fire = { lit: false, until: 0, k: 0 };
  let flameAt = 0;
  let frame = 0;
  updates.push((t, dt) => {
    if (fire.lit && t > fire.until) fire.lit = false;
    fire.k += ((fire.lit ? 1 : 0) - fire.k) * (1 - Math.exp(-1.5 * dt));
    if (t > flameAt) {
      frame = (frame + 1 + Math.floor(Math.random() * 2)) % 3;
      flameAt = t + 0.1 + Math.random() * 0.08;
    }
    flames.forEach((m, i) => {
      m.visible = fire.k > 0.05 && i === frame;
      m.scale.y = Math.max(0.2, fire.k);
    });
    fireLight.intensity = fire.k * (0.9 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3));
    candles.visible = night;
  });

  // The TV on the wall over the mantel.
  const tvBody = part();
  box(tvBody, [-23, 22], [44, 70], [0, 1], (x, y) => (Math.abs(x + 0.5) > 21.5 || y === 44 || y === 70 ? "tvEdge" : "tvBody"));
  tvGroup.add(mesh(tvBody));
  const SCREEN = [42, 24];
  const screen = pixelTexture(...SCREEN, () => {});
  place(tvGroup, new THREE.Mesh(new THREE.PlaneGeometry(...SCREEN), new THREE.MeshBasicMaterial({ map: screen.tex })), [-0.5, 57, 1.6]);
  const tvLight = new THREE.PointLight(0x9fc8ff, 0, 110, 0);
  tvLight.position.set(0, 57, 18);
  tvGroup.add(tvLight);
  // The controllers rest on the mantel until someone picks them up.
  const padsOnStand = [-1, 1].map((side) => {
    const p = cells(
      [
        [-2, 0, 0, "pad"],
        [-1, 0, 0, "pad"],
        [0, 0, 0, "pad"],
        [1, 0, 0, "pad"],
        [2, 0, 0, "pad"],
        [-2, 0, 1, "pad"],
        [2, 0, 1, "pad"],
        [1, 1, 0, "padRed"],
      ],
      COLORS
    );
    return place(tvGroup, p, [side * 9, 38, 6]);
  });
  const tvFace = (lx, ly, lz) => {
    const [x, z] = turned(TV.at, TV.turn, [lx, lz]);
    return [x, ly, z];
  };

  // What is on (screens.js): the channels, one after another as they flick through, or the game the two of
  // them play; or it is off, with a gleam on the glass.
  const tv = { mode: "off", channel: "nature", since: 0 };
  function drawScreen(t) {
    const { g } = screen;
    const [w, h] = SCREEN;
    if (tv.mode === "off") {
      g.fillStyle = "#20232a";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#3b3f4a";
      for (let k = 0; k < 7; k++) g.fillRect(26 + k, 3 + k, 1, 1);
      for (let k = 0; k < 4; k++) g.fillRect(31 + k, 3 + k, 1, 1);
    } else if (tv.mode === "game") drawTvGame(g, w, h, t);
    else drawChannel(g, w, h, tv.channel, t, t - tv.since);
    screen.tex.needsUpdate = true;
  }
  let screenAt = -1;
  updates.push((t) => {
    // Redraw at about 12 frames a second: plenty for pixel art on a small screen.
    if (tv.mode !== "off" && t - screenAt > 0.08) {
      if (tv.mode === "show" && t - tv.since > 12) {
        tv.channel = pick(CHANNELS.filter((c) => c !== tv.channel));
        tv.since = t;
      }
      drawScreen(t);
      screenAt = t;
      tvLight.intensity = 0.35 + 0.1 * Math.sin(t * 5) * Math.sin(t * 1.7);
    }
  });

  /* ---------- the dining table ---------- */

  // A table for two with a cloth runner, a jug of flowers at one end and two places laid, and two chairs on
  // the far side, so the two of them sit facing the room. A dish from the oven goes in the middle.
  const DINING = [62, 92];
  const dining = part();
  box(dining, [-25, 24], [12, 13], [-9, 8], (x, y, z) =>
    y === 13 && Math.abs(z + 0.5) <= 4.5 ? (x % 4 === 0 ? "frameShade" : "frame") : y === 12 || z === 8 ? "woodMid" : "woodLight"
  );
  for (const x of [-24, 22]) for (const z of [-8, 6]) box(dining, [x, x + 1], [0, 11], [z, z + 1], "woodMid");
  for (const x of [-13, 13])
    ellipsoid(dining, [x, 14, -4], [3, 0.5, 2.5], (vx, vy, vz) => ((vx - x) ** 2 + (vz + 4) ** 2 > 3 ? "chinaBlue" : "china"));
  for (let y = 14; y <= 18; y++) ellipsoid(dining, [-20, y, 3], [1.6, 0.5, 1.6], y === 18 ? "glass" : "mugBlue");
  [
    [-21, 20, 3, "red"],
    [-19, 21, 3, "yellow"],
    [-20, 22, 4, "pink"],
    [-20, 20, 2, "leaf"],
  ].forEach(([x, y, z, c]) => ellipsoid(dining, [x, y, z], [1.2, 1.2, 1.2], c));
  place(house, mesh(dining), [DINING[0], 0, DINING[1]]);
  footprint(DINING[0] - 25, DINING[0] + 25, DINING[1] - 9, DINING[1] + 9);
  const tableDish = place(house, new THREE.Group(), [DINING[0], 14.5, DINING[1] + 1]);
  const tableDishes = Object.fromEntries(DISHES.map((kind) => [kind, place(tableDish, buildDish(kind), [0, 0, 0])]));
  const dinner = { dish: null }; // what is on the table (props.js's DISHES), or nothing
  updates.push(() => Object.entries(tableDishes).forEach(([kind, m]) => (m.visible = dinner.dish === kind)));
  const DINE_Z = DINING[1] - 17;
  const diningChair = part();
  box(diningChair, [-5, 5], [7, 8], [-4, 4], (x, y) => (y === 8 ? "woodLight" : "woodMid"));
  for (const x of [-5, 4]) for (const z of [-4, 3]) box(diningChair, [x, x + 1], [0, 6], [z, z + 1], "woodMid");
  box(diningChair, [-5, 5], [9, 19], [-5, -5], (x, y) => (y === 19 || Math.abs(x) === 5 || y === 14 ? "woodMid" : "woodLight"));
  for (const x of [-13, 13]) {
    place(house, mesh(diningChair), [DINING[0] + x, 0, DINE_Z]);
    footprint(DINING[0] + x - 6, DINING[0] + x + 6, DINE_Z - 6, DINE_Z + 5);
  }

  /* ---------- the pets' corner: the cat tree and the collie's bed ---------- */

  // A cat tree: a base, a sisal post, two carpeted platforms and a round bed on top, and a toy mouse
  // swinging on a string.
  const TREE = [122, 82];
  const tree = part();
  box(tree, [-14, 13], [0, 1], [-13, 12], "carpetDark");
  const sisal = (x, y) => (y % 2 ? "sisal" : "sisalDark");
  for (let y = 2; y <= 43; y++) ellipsoid(tree, [-1, y, -3], [2.2, 0.5, 2.2], sisal);
  for (let y = 2; y <= 13; y++) ellipsoid(tree, [6, y, 5], [1.6, 0.5, 1.6], sisal);
  ellipsoid(tree, [5, 14.5, 5], [8, 1, 7], "carpet");
  ellipsoid(tree, [-6, 29.5, 1], [7, 1, 6], "carpet");
  ellipsoid(tree, [0, 44.5, -4], [8.5, 1, 7.5], "carpet");
  for (let y = 46; y <= 47; y++)
    for (let x = -9; x <= 9; x++)
      for (let z = -12; z <= 4; z++) {
        const r = (x / 8.5) ** 2 + ((z + 4) / 7.5) ** 2;
        if (r <= 1 && r > 0.55) tree.add(x, y, z, "carpetDark");
      }
  ellipsoid(tree, [0, 45.5, -4], [5.5, 0.5, 4.5], "treeCushion");
  const treeGroup = place(house, new THREE.Group(), [TREE[0], 0, TREE[1]]);
  treeGroup.add(mesh(tree));
  const toy = pivotGroup(treeGroup, [-12, 29, 1]);
  const toyPart = part();
  for (let y = 21; y <= 28; y++) toyPart.add(-12, y, 1, "bulbWire");
  ellipsoid(toyPart, [-12, 19, 1], [1.5, 1.4, 2.2], "mouse");
  toyPart.add(-12, 20, 3, "earPink");
  toy.inner.add(mesh(toyPart));
  updates.push((t) => (toy.outer.rotation.z = 0.25 * Math.sin(t * 1.6) * Math.sin(t * 0.37)));
  footprint(TREE[0] - 14, TREE[0] + 14, TREE[1] - 13, TREE[1] + 13);

  // The collie's bed: a round blue cushion with a raised rim, and her bone beside it.
  const DOGBED = [100, 4];
  const dogBed = part();
  for (let y = 0; y <= 5; y++)
    for (let x = -17; x <= 17; x++)
      for (let z = -12; z <= 12; z++) {
        const out = (x / 17) ** 2 + (z / 12) ** 2;
        const rim = out <= 1 && (x / 12.5) ** 2 + (z / 8) ** 2 > 1;
        if (rim && y <= 5 - Math.max(0, z / 4)) dogBed.add(x, y, z, y >= 4 ? "bedBlueLight" : "bedBlue"); // lower at the front
        else if (out <= 1 && y <= 2) dogBed.add(x, y, z, "bedCream");
      }
  [
    [19, 9],
    [20, 9],
    [21, 9],
    [18, 8],
    [18, 10],
    [22, 8],
    [22, 10],
  ].forEach(([x, z]) => dogBed.add(x, 0, z, "bone"));
  place(house, mesh(dogBed), [DOGBED[0], 0, DOGBED[1]]);
  footprint(DOGBED[0] - 17, DOGBED[0] + 17, DOGBED[1] - 12, DOGBED[1] + 12);

  /* ---------- the garden: four raised beds of vegetables inside a picket fence ---------- */

  // Downstairs, the right side of the house is a wall cut low, like a dolls' house, with a gap for the garden
  // door; past it, grass with stepping stones, the beds, and a white picket fence along the front and side.
  const lawn = pixelTexture(60, 138, (g, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const r = hash(x, y, 11);
        g.fillStyle = r < 0.08 ? "#6fae52" : r < 0.4 ? "#86c062" : "#94ca6c";
        g.fillRect(x, y, 1, 1);
        if (r > 0.995) {
          g.fillStyle = hash(x, y, 12) < 0.5 ? "#fff6c9" : "#ffffff"; // a daisy now and then
          g.fillRect(x, y, 1, 1);
        }
      }
  });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(SIDE - X1, FRONT - LOFT.z1), new THREE.MeshLambertMaterial({ map: lawn.tex }));
  grass.rotation.x = -Math.PI / 2;
  place(house, grass, [(X1 + SIDE) / 2, -0.48, (LOFT.z1 + FRONT) / 2]);
  const cutWall = part();
  for (let z = LOFT.z1; z < FRONT; z++) {
    if (Math.abs(z - GARDEN_DOOR.z) < GARDEN_DOOR.half) continue;
    for (let x = X1 - 3; x <= X1; x++) for (let y = 0; y <= 5; y++) cutWall.add(x, y, z, y === 5 ? "wallCap" : y <= 1 ? "woodDeep" : "panel");
  }
  for (let z = GARDEN_DOOR.z - GARDEN_DOOR.half + 1; z < GARDEN_DOOR.z + GARDEN_DOOR.half; z++)
    for (let x = X1 - 3; x <= X1; x++) cutWall.add(x, -0.3, z, "stone"); // the step
  house.add(mesh(cutWall));
  footprint(X1 - 4, X1 + 1, LOFT.z1, GARDEN_DOOR.z - GARDEN_DOOR.half, false);
  footprint(X1 - 4, X1 + 1, GARDEN_DOOR.z + GARDEN_DOOR.half, FRONT, false);
  const fence = part();
  const picket = (at) => (k, y) => {
    if (k % 3 === 0 && y <= 9 + ((k / 3) % 2)) fence.add(...at(k, y), y >= 9 ? "frameShade" : "frame");
    else if (y === 3 || y === 7) fence.add(...at(k, y), "frame");
  };
  for (let k = 0; k < SIDE - X1; k++) for (let y = 0; y <= 10; y++) picket((kk, yy) => [X1 + 1 + kk, yy, FRONT - 1])(k, y);
  for (let k = 0; k < FRONT - LOFT.z1 - 1; k++) for (let y = 0; y <= 10; y++) picket((kk, yy) => [SIDE - 1, yy, LOFT.z1 + kk])(k, y);
  house.add(mesh(fence));
  const stones = part();
  const stone = (cx, cz) => {
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 1; z++) if (x * x + z * z < 6) stones.add(cx + x, -0.2, cz + z, (x + z) % 3 ? "stone" : "stoneDark");
  };
  for (const x of [156, 163]) stone(x, GARDEN_DOOR.z);
  for (let z = -20; z <= 104; z += 8) if (Math.abs(z - GARDEN_DOOR.z) > 4) stone(161, z);
  house.add(mesh(stones));

  // The vegetables, each at three stages: just planted, growing, and ready to pick. A builder fills a part
  // with one plant at stage `s`, standing on y = 0 round (0, 0).
  const sprout = (p, leaf) => {
    box(p, [0, 0], [0, 2], [0, 0], "stem");
    for (const x of [-1, 1]) p.add(x, 2 + (x > 0 ? 1 : 0), 0, leaf);
  };
  const leafy = (light, dark) => (x, y, z) => (hash(x, y, z) < 0.3 ? dark : light);
  const VEG = {
    // Tomatoes on a vine up a cane: green ones among yellow flowers, then red and shining.
    tomato(p, s) {
      if (!s) return sprout(p, "tomLeaf");
      const top = s === 1 ? 11 : 16;
      box(p, [0, 0], [0, top], [-2, -2], "woodLight");
      for (let y = 3; y <= top - 2; y += 3) ellipsoid(p, [y % 2 ? 1.5 : -1.5, y, 0], [2.6, 1.8, 2.2], leafy("tomLeaf", "plant"));
      const fruit =
        s === 1
          ? [
              [1, 6, 2],
              [-2, 9, 2],
            ]
          : [
              [2, 5, 2],
              [-2, 8, 2],
              [1, 11, 2],
              [-1, 13, 1],
              [3, 9, 1],
            ];
      for (const [x, y, z] of fruit) {
        ellipsoid(p, [x, y, z], [1.3, 1.3, 1.3], s === 1 ? "tomGreen" : "tomato");
        p.add(x, y + 1, z, "stem");
        if (s === 2) p.add(x - 1, y, z + 1, "tomatoShine");
      }
      if (s === 1)
        for (const [x, y] of [
          [-1, 5],
          [2, 9],
        ])
          p.add(x, y, 3, "yellow");
    },
    // Eggplants: a leafy bush on purple stems, a lilac flower, then glossy purple fruit hanging under it.
    eggplant(p, s) {
      if (!s) return sprout(p, "eggLeaf");
      const r = s === 1 ? 3.6 : 4.8;
      box(p, [0, 0], [0, 3], [0, 0], "eggStem");
      ellipsoid(p, [0, 3 + r, 0], [r, r * 0.9, r * 0.85], leafy("eggLeaf", "plant"));
      for (const [x, y] of [
        [-2, 3],
        [2, 4],
      ])
        p.add(x, y, 1, "eggStem");
      if (s === 1) p.add(1, 4 + r, 3, "lilac");
      else
        for (const [x, y] of [
          [-3, 3],
          [2.5, 4],
          [0, 2],
        ]) {
          ellipsoid(p, [x, y, 4], [1.3, 2.6, 1.3], "eggplant");
          p.add(Math.round(x), Math.round(y) + 3, 4, "eggCap");
          p.add(Math.round(x) - 1, Math.round(y) + 1, 5, "eggplantShine");
        }
    },
    // Napa cabbage: a loose rosette, then a tall head, white at the base and frilly green on top.
    napa(p, s) {
      if (!s) return sprout(p, "napaGreen");
      ellipsoid(p, [0, 1, 0], [s === 1 ? 3.5 : 5, 1.2, s === 1 ? 3.5 : 5], leafy("napaLeaf", "napaGreen"));
      if (s === 1) ellipsoid(p, [0, 3, 0], [2.4, 2.4, 2.4], leafy("napaGreen", "napaLeaf"));
      else
        ellipsoid(p, [0, 7, 0], [3.4, 6.5, 3.4], (x, y, z) =>
          y <= 6 ? (hash(x, y, z) < 0.2 ? "napaPale" : "napaWhite") : y <= 8 ? "napaPale" : leafy("napaGreen", "napaLeaf")(x, y, z)
        );
    },
    // Cabbage: a rosette of broad outer leaves, then a round firm head in the middle.
    cabbage(p, s) {
      if (!s) return sprout(p, "cabbageLeaf");
      ellipsoid(p, [0, 1.5, 0], [s === 1 ? 4 : 5.5, 1.5, s === 1 ? 4 : 5.5], (x, y, z) =>
        (x === 0 || z === 0) && y === 2 ? "cabbageVein" : "cabbageLeaf"
      );
      if (s === 2) ellipsoid(p, [0, 5, 0], [3.8, 3.6, 3.8], (x, y, z) => ((x + y) % 4 === 0 ? "cabbageVein" : "cabbage"));
    },
  };
  const BEDS = [
    { kind: "tomato", z: [-20, -3] },
    { kind: "eggplant", z: [7, 24] },
    { kind: "napa", z: [56, 73] },
    { kind: "cabbage", z: [85, 102] },
  ];
  const PLANT_X = [176, 186, 196];
  const garden = {
    beds: BEDS.map(({ kind, z: [z0, z1] }, i) => {
      const zc = (z0 + z1) / 2;
      const frame = part();
      box(frame, [169, 203], [0, 3], [z0, z1], (x, y, z) => (y === 3 ? "woodDeep" : (x + z) % 9 === 0 ? "woodDeep" : "woodMid"), [
        { has: (x, y, z) => x > 169 && x < 203 && z > z0 && z < z1 },
      ]);
      house.add(mesh(frame));
      footprint(169, 204, z0, z1 + 1);
      const soil = place(house, new THREE.Mesh(new THREE.BoxGeometry(33, 1, z1 - z0 - 1), new THREE.MeshLambertMaterial({ color: COLORS.soil })), [
        186,
        2.5,
        zc,
      ]);
      const stages = [0, 1, 2].map((s) => {
        const p = part();
        VEG[kind](p, s);
        const g = new THREE.Group();
        for (const x of PLANT_X) {
          const m = place(g, mesh(p), [x, 3, zc]);
          m.rotation.y = hash(x, i, s) * 0.8 - 0.4;
        }
        g.visible = false;
        house.add(g);
        return g;
      });
      return {
        kind,
        stage: [2, 1, 0, 1][i],
        growth: Math.random() * 0.6,
        wet: 0,
        soil,
        stages,
        at: [161, zc],
        plants: PLANT_X.map((x) => [x, 8, zc]),
      };
    }),
    // Water bed `i`: the soil darkens, and it grows faster while it is wet.
    water(i) {
      garden.beds[i].wet = 1;
    },
    // Pick bed `i` and sow it again; what was picked.
    harvest(i) {
      const bed = garden.beds[i];
      Object.assign(bed, { stage: 0, growth: 0 });
      return bed.kind;
    },
    ripe: (i) => garden.beds[i].stage === 2,
    thirsty: (i) => garden.beds[i].stage < 2 && garden.beds[i].wet < 0.3,
    picked: 0, // vegetables brought in and kept in the fridge, for cooking
  };
  const dry = new THREE.Color(COLORS.soil);
  const wet = new THREE.Color(COLORS.soilWet);
  updates.push((t, dt) => {
    for (const bed of garden.beds) {
      bed.wet = Math.max(0, bed.wet - dt / 150);
      if (bed.stage < 2) {
        bed.growth += dt / (bed.wet > 0 ? 70 : 260);
        if (bed.growth >= 1) Object.assign(bed, { stage: bed.stage + 1, growth: 0 });
      }
      bed.stages.forEach((g, s) => (g.visible = s === bed.stage));
      bed.soil.material.color.lerpColors(dry, wet, Math.min(1, bed.wet * 1.5));
    }
  });
  // The garden's watering can, by the door when nobody has it.
  const gardenCan = part();
  box(gardenCan, [-2, 2], [0, 3], [-1, 1], (x, y) => (y === 0 ? "canDark" : "can"));
  for (const x of [-1, 0, 1]) gardenCan.add(x, 4, 0, "can");
  for (const [y, z] of [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
  ])
    gardenCan.add(0, y, z, "canDark");
  garden.can = place(house, mesh(gardenCan), [156, 0, 60], -0.6);

  // A white butterfly over the beds by day, and fireflies over the garden at night.
  const wingPart = part();
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, -1],
  ].forEach(([x, z]) => wingPart.add(x, 0, z, "white"));
  const butterfly = new THREE.Group();
  const wings = [1, -1].map((side) => {
    const w = mesh(wingPart);
    w.scale.set(side * 0.7, 0.7, 0.7);
    butterfly.add(w);
    return w;
  });
  butterfly.add(
    cells(
      [
        [0, 0, 0, "hand"],
        [0, 0, 1, "hand"],
      ],
      COLORS
    )
  );
  house.add(butterfly);
  const fireflies = [0, 1, 2, 3, 4].map(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: "#e9ff8a" }));
    house.add(m);
    return m;
  });
  updates.push((t) => {
    butterfly.visible = !night;
    if (!night) {
      butterfly.position.set(186 + 14 * Math.sin(t * 0.31) + 4 * Math.sin(t * 1.7), 13 + 4 * Math.sin(t * 1.1), 40 + 58 * Math.sin(t * 0.19 + 1));
      butterfly.rotation.y = Math.atan2(Math.cos(t * 0.31), Math.cos(t * 0.19 + 1));
      const flap = 0.9 * Math.abs(Math.sin(t * 16));
      wings.forEach((w, i) => (w.rotation.z = (i ? 1 : -1) * flap));
    }
    fireflies.forEach((m, i) => {
      m.visible = night && Math.sin(t * (1.1 + i * 0.3) + i * 2) > 0.2;
      m.position.set(180 + 22 * Math.sin(t * 0.21 + i * 1.3), 8 + 6 * Math.sin(t * 0.5 + i), 40 + 60 * Math.sin(t * 0.13 + i * 2.1));
    });
  });
  garden.butterfly = butterfly;

  /* ---------- on the walls: a clock, a picture and string lights ---------- */

  // A round clock over the front door that keeps the real time.
  const clockGroup = place(house, new THREE.Group(), [DOOR.x, 72, BACK + 0.6]);
  const clockPart = part();
  for (let x = -7; x <= 7; x++)
    for (let y = -7; y <= 7; y++) {
      const r = Math.hypot(x, y);
      if (r <= 7.4) clockPart.add(x, y, 0, r > 6 ? "woodMid" : "clockFace");
    }
  [
    [0, 5],
    [5, 0],
    [0, -5],
    [-5, 0],
  ].forEach(([x, y]) => clockPart.add(x, y, 0.3, "hand"));
  clockGroup.add(mesh(clockPart));
  const clockHands = [3.2, 4.8].map((len) => {
    const p = part();
    for (let y = 0; y <= Math.round(len); y++) p.add(0, y, 0, "hand");
    const m = place(clockGroup, mesh(p), [0, 0, 0.6]);
    m.scale.set(0.8, 1, 0.5);
    return m;
  });
  updates.push(() => {
    const d = new Date();
    const minutes = d.getMinutes() + d.getSeconds() / 60;
    clockHands[0].rotation.z = -((d.getHours() % 12) + minutes / 60) * (Math.PI / 6);
    clockHands[1].rotation.z = -minutes * (Math.PI / 30);
  });

  // A picture over the stairs: hills, a sun, and a little house.
  const picture = part();
  for (let x = -12; x <= 12; x++)
    for (let y = -9; y <= 9; y++) {
      let c;
      if (Math.abs(x) === 12 || Math.abs(y) === 9) c = "canvasFrame";
      else if (y < -3 + Math.round(2 * Math.sin(x * 0.4))) c = (x + y) % 4 ? "melon" : "plant";
      else if ((x - 6) ** 2 + (y - 4) ** 2 <= 5) c = "tin";
      else c = "photoSky";
      picture.add(x, y, 0, c);
    }
  box(picture, [-6, -2], [-4, -1], [0.4, 0.4], "photo");
  box(picture, [-7, -1], [0, 0], [0.4, 0.4], "kettle");
  place(house, mesh(picture), [-15, 66, BACK + 0.6]);

  // Fairy lights on a fine wire, hung in loose swags from tacks near the tops of both walls (clear of the
  // windows and the clock), glowing at night.
  const wireSpots = [];
  const bulbList = [];
  const swags = (tacks, at) => {
    for (let s = 0; s + 1 < tacks.length; s++) {
      const [a, b] = [tacks[s], tacks[s + 1]];
      const y = (u) => WALL_H - 4 - 8 * Math.sin((Math.PI * (u - a)) / (b - a));
      for (let u = a; u <= b; u += 0.5) wireSpots.push(at(u, y(u)));
      for (let u = a + 4; u < b - 2; u += 8) bulbList.push(at(u, y(u) - 1));
    }
  };
  swags([X0 + 4, -50, 30, 106], (u, y) => [u, y, BACK + 0.8]);
  swags([BACK + 6, -45, 15, 75, FRONT - 4], (u, y) => [X0 + 0.8, y, u]);
  const tmp = new THREE.Matrix4();
  const wire = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshLambertMaterial({ color: COLORS.bulbWire }),
    wireSpots.length
  );
  wireSpots.forEach((p, i) => wire.setMatrixAt(i, tmp.makeTranslation(...p)));
  house.add(wire);
  const bulbs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 2, 1.4), new THREE.MeshBasicMaterial(), bulbList.length);
  const BULB_COLORS = ["#ffd27a", "#ff9e8a", "#a8e6a0", "#9fd3ff"].map((c) => new THREE.Color(c));
  bulbList.forEach((p, i) => bulbs.setMatrixAt(i, tmp.makeTranslation(...p)));
  house.add(bulbs);
  const lit = new THREE.Color();
  updates.push((t) => {
    bulbList.forEach((_, i) => {
      const glowing = night ? 0.75 + 0.25 * Math.sin(t * 2 + i * 1.7) : 0.45;
      bulbs.setColorAt(i, lit.copy(BULB_COLORS[i % 4]).multiplyScalar(glowing));
    });
    bulbs.instanceColor.needsUpdate = true;
  });

  /* ---------- where things are, for the people and the pets ---------- */

  const facing = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const ovenSide = turned(STOVE, STOVE_YAW, [5, 20]);
  const ovenMid = turned(STOVE, STOVE_YAW, [-10.5, 9]);
  const sinkMid = turned(STOVE, STOVE_YAW, [10.5, -0.5]);
  // Seats: where to sit (x, z) facing `yaw`, the spot in front to sit down from, and for a pet where to
  // lie on it and which way.
  const seat = (key, [x, z], yaw, front, pet, petYaw = yaw) => ({ key, x, z, yaw, front: turned([x, z], yaw, [0, front]), pet, petYaw });
  const seats = {
    ...Object.fromEntries(
      [-17, 0, 19].map((dx, i) => [
        `sofa${i}`,
        seat(`sofa${i}`, [SOFA[0] + dx, SOFA[1]], 0, 19, [SOFA[0] + dx, 9.5, SOFA[1] + 2], Math.sign(dx) * 0.45),
      ])
    ),
    armchair: seat("armchair", ARMCHAIR, 0, 19, [ARMCHAIR[0], 9.5, ARMCHAIR[1] + 2]),
    chair: seat("chair", CHAIR, Math.PI, -16, null), // sat down into from behind, rolled in to the desk
    dine0: seat("dine0", [DINING[0] - 13, DINE_Z], 0, -16, null), // the same, at the table
    dine1: seat("dine1", [DINING[0] + 13, DINE_Z], 0, -16, null),
    // In bed, lying back with the head on the pillow; the spot at the foot of the bed to get in from.
    ...Object.fromEntries(
      [-1, 1].map((side, i) => [
        `bed${i}`,
        { key: `bed${i}`, x: BED[0] + side * 13, z: -63, y: MATTRESS + 7.5, yaw: 0, front: [BED[0] + side * 13, -48], slot: i },
      ])
    ),
  };
  const spots = {
    seats,
    fridge: { at: [-119, -70], yaw: facing([-119, -70], FRIDGE) },
    tin: { at: [COUNTER[0] + 14, -78], yaw: Math.PI },
    stove: { at: [-126, potTop[1]], yaw: -Math.PI / 2, pot: stove.pot },
    // The oven: beside its door (which comes down in front of it), and the middle of it.
    oven: { at: ovenSide, yaw: facing(ovenSide, ovenMid), door: [ovenMid[0], 14, ovenMid[1]] },
    sink: { at: turned(STOVE, STOVE_YAW, [10.5, 17]), yaw: -Math.PI / 2, basin: [sinkMid[0], 34, sinkMid[1]] },
    bowls: Object.fromEntries(Object.entries(BOWLS).map(([name, bowl]) => [name, { bowl }])),
    shelf: { at: [SHELF[0] + 20, SHELF[1]], yaw: -Math.PI / 2 },
    laptop: { at: [TABLE[0] + 8, TABLE[1] + 22], yaw: Math.PI },
    laptopHome: [TABLE[0] + 8, 12, TABLE[1] - 1],
    plant: { at: [SOFA[0] + 53, SOFA[1] - 8], yaw: -Math.PI / 2, pot: [SOFA[0] + 39, 6, SOFA[1] - 5] },
    tree: {
      at: [TREE[0] + 5, TREE[1] + 23],
      hops: [
        [TREE[0] + 5, 15.5, TREE[1] + 5],
        [TREE[0] - 6, 30.5, TREE[1] + 1],
        [TREE[0], 45.5, TREE[1] - 4],
      ],
    },
    dogBed: { at: [DOGBED[0], DOGBED[1] + 22], bed: [DOGBED[0], 2.5, DOGBED[1] + 1] },
    // On the bed (between the two of them, at their feet) and up on the window sill over it.
    bedFoot: { at: [BED[0], -48], on: [BED[0], ON_BED, -68] },
    sill: { at: [BED[0], -48], bed: [BED[0], ON_BED, -72], on: [BED[0] + 4, WIN_BACK.y[0] - 2, BACK + 3], yaw: Math.PI / 2 },
    // The cat's place on the desk, at its right end, lying facing out with her head by the edge.
    desk: { at: [DESK[0] + 20, -78], on: [DESK[0] + 20, Y + 16, DESK[1] + 3], yaw: -0.3 },
    phones: [DESK[0] - 21, Y + 26, DESK[1] + 4], // the headphones on their stand
    phonesAt: { at: [DESK[0] - 16, -80], yaw: Math.PI }, // where to reach them from
    bin: { at: [BIN[0], -86], yaw: Math.PI, lid: [BIN[0], 17, BIN[1]] },
    // The fireplace: the log basket, where to kneel to light the fire, and where the pets lie by it.
    logs: { at: [-124, 100], yaw: -Math.PI / 2 },
    hearth: { at: [-122, TV.at[1]], yaw: -Math.PI / 2, fire: tvFace(0, 12, 6) },
    fireside: [
      [-106, 54],
      [-108, 84],
    ],
    // The dressing corner: the rail, the mirror, and behind the screen.
    closet: { at: [184, -88], yaw: Math.PI, rail: [184, RAIL_Y - 12, -104] },
    mirror: { at: [176, -86], yaw: -Math.PI / 2, glass: [161, Y + 30, -88] },
    change: { at: [191, -60] },
    // The garden: through the door, the can by it, and each bed (from the path, facing it).
    gardenDoor: { inside: [134, GARDEN_DOOR.z], outside: [158, GARDEN_DOOR.z] },
    can: { at: [158, 50], yaw: 0 },
    beds: garden.beds.map((bed) => ({ at: bed.at, yaw: Math.PI / 2, plants: bed.plants })),
    sunny: [186, GARDEN_DOOR.z], // a patch of grass between the beds
    watchPc: { at: [CHAIR[0] - 30, CHAIR[1] + 16] }, // beside his chair, not in front of him or the headphones
    dining: { beg: [DINING[0] - 40, DINE_Z + 2], dish: [DINING[0], 16, DINING[1] + 1] }, // where the dog sits hoping for a bite, and the dish
    rug: [
      [TABLE[0] - 50, TABLE[1] - 14],
      [TABLE[0] + 50, TABLE[1] - 14],
      [TABLE[0] - 40, TABLE[1] + 24],
      [TABLE[0] + 40, TABLE[1] + 24],
    ],
    ballHome: [DOGBED[0] - 26, DOGBED[1] + 2],
    tv: tvFace(0, 57, 0),
    monitor: [DESK[0] + 1.5, Y + 30, DESK[1] - 4],
    window: [BED[0], (WIN_BACK.y[0] + WIN_BACK.y[1]) / 2, BACK],
    // The front door: where to wait inside it, and out on the path.
    door: { x: DOOR.x, inside: BACK + 14, outside: BACK - 30 },
  };

  // Paths keep to the house and the garden.
  const bounds = [X0 + 4, SIDE - 4, BACK + 4, FRONT - 4];

  function dress(isNight) {
    night = isNight;
    drawSky();
    drawClouds();
    lamp.light.visible = night;
    lamp.light.distance = 130;
    lamp.light.intensity = 1.3;
    lamp.shade.material.color.copy(shadeColor).multiplyScalar(night ? 1 : 0.85);
    shadeLit.visible = night;
    shadeDay.visible = !night;
    bedLamp.intensity = night ? 1 : 0;
    if (night) bird.visible = false;
  }
  drawScreen(0);
  drawMonitor(0);
  drawSideMonitor(0);

  return {
    group: house,
    obstacles,
    bounds,
    spots,
    floorY,
    dress,
    update: (t, dt) => updates.forEach((u) => u(t, dt)),
    tv: {
      // `mode`: "off", "show" or "game".
      set(mode, t) {
        if (mode === tv.mode) return;
        if (mode === "show") tv.channel = pick(CHANNELS); // whatever happens to be on
        tv.mode = mode;
        tv.since = t;
        tvLight.intensity = mode === "off" ? 0 : 0.35;
        tvLight.color.set(mode === "game" ? 0xd8b0ff : 0x9fc8ff);
        drawScreen(t);
      },
      get mode() {
        return tv.mode;
      },
      pads: padsOnStand,
    },
    pc: {
      // `mode`: "off", "game", "win" or "lose"; `game` (screens.js's GAMES) the one he starts playing.
      // `sitter`: who the chair turns with.
      set(mode, t, game = pc.game) {
        if (mode === pc.mode && game === pc.game) return;
        pc.mode = mode;
        pc.game = game;
        pc.since = t;
        drawMonitor(t);
        drawSideMonitor(t);
      },
      get mode() {
        return pc.mode;
      },
      set sitter(a) {
        pc.sitter = a;
      },
      set talking(on) {
        pc.talking = on;
      },
      phones: phonesOnStand, // shown while he is not wearing them
    },
    fridge,
    oven,
    dinner,
    door: frontDoor,
    bin,
    stove,
    fire,
    beds,
    bird,
    book: bookOnShelf,
    bowls,
    closet,
    garden,
  };
}
