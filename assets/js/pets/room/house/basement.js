/*******************************************************************************
 * The basement, under the house (layout.js's BASE_Y): a dolls'-house floor of
 * its own, walled at the back and on the left, open at the front and on the
 * right, on a slab cut like the house's, and finished like the house over it:
 * the same honey oak boards, the same cream wallpaper over panelling (over
 * cream metro tiles in the bathroom, its floor big stone-look tiles), oak
 * trims, chrome taps, soft sage, blush and terracotta; its plants all slim
 * trees in woven baskets.
 *
 * - The lounge (x 0..176, the front): a long daybed on a wool rug, a side
 *   table with water, a floor lamp, a console, a low oak tea table on a tatami
 *   rug with a floor chair either side, a tree in the corner; on the right, the stairs come down along the
 *   house's side (house/stairs.js), a cupboard under them.
 * - The gym (x 0..208, the back, behind oak-framed glass): a mirror across the
 *   back wall in an oak frame (a real reflection: mirror.js, given
 *   `gymGlass`); in front of it the strength corner (a three-tier dumbbell rack, kettlebells), the
 *   punching bag in the corner, a mat strip, oak wall bars, and along the
 *   glass the treadmill, the spin bike and a water rower.
 * - The bathroom (x -150..0, behind reeded glass in oak frames, a fish tank
 *   built into it and seen from both sides, its weed swaying and its fish
 *   wandering): a sage vanity with an oak top, a zellige splashback, sconces
 *   and two round mirrors along the back (his and her cups and brushes), a
 *   towel radiator, the toilet in its own tiled nook behind a curtain (a print,
 *   a sconce, spare rolls), a big round bath sunk in a stone deck, always full,
 *   with a curtain on a rail round it, towels on an oak ladder beside it, a
 *   bench on the rug, and a quadrant shower cabin in the front corner.
 *
 * Built in its own group; `update` runs it each frame (only while shown), the
 * acts (acts/basement.js) driving its state: the curtains (`goal` 0 open .. 1
 * drawn), the bath (`hot`, `foam`), the basins' taps, the toilet's flush, the
 * shower (`running`, its cabin's doors), the treadmill's `speed`, the rower's
 * stroke (`set(k)`), the dumbbells taken off the rack and put back, the bike,
 * the bag hit, the fish fed; and `mosaic`, a patch of soft pastel tiles kept
 * over anyone who should not be seen.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, hash } from "../../models/voxels.js";
import { X0, SIDE, BACK, FRONT, WALL_T, BASE_Y } from "./layout.js";
import { COLORS, pixelTexture, solid, solidMaterial, glowing, wallpaper, oakBoards, basinWater } from "./kit.js";
import { VIEW_YAW } from "../view.js";
import { GRAVITY } from "../water.js";

const FLOOR = BASE_Y - 0.5; // the floor's top (feet rest here)
const TOP = -9.5 - FLOOR; // the walls' height, up to the underside of the house's floor
const PITCH = (40 * Math.PI) / 180; // (view.js's)
const GLASS_TOP = 46; // how high the glass walls go
// The rooms: the bathroom left of the reeded glass at x 0, the gym behind clear glass at z -26 (its door at
// x 110..140), the lounge in front of it, the stairs coming down on the right.
const SPLIT = { x: 0, door: [60, 90] };
const GYM = { z: -26, door: [110, 140] };
// The round bath sunk in its deck: the tub's inside radius `r`, the deck's top `deck` and its curve `deckR`
// round the same middle, the tub's floor and the water's surface (always full), above the room's floor.
const TUB = { x: -124, z: 10, r: 19, deck: 9, deckR: 25, floor: 0.5, level: 7.5 };
const NICHE = { x1: -93, z0: -22, z1: 42 }; // the bath's corner of the room, out to x1 from the left wall
const TANK = { x0: -4, x1: 4, z0: -8, z1: 28, y0: 17, y1: 40 }; // the fish tank's water, in the glass at x 0
const VANITY = { x0: -100, x1: -40, basins: [-85, -55], top: 22 };
const MIRROR = { x0: 16, x1: 134, y0: 2, y1: 48 }; // the gym's
const RACK = { x0: 34, x1: 74 };
const MILL = { x0: 6, x1: 22, z0: -78, z1: -34, deck: 4 }; // the treadmill, the runner facing the room
const ROWER = { z: -41, x0: 56, x1: 106, seat: 9, catchX: 86, finishX: 70 }; // along x, the flywheel at the +x end
const LAT = { x: 114, z: -92, posts: 128, top: 49, rest: 41, pull: 25 }; // the lat pulldown: the seat (facing +x), the posts, the bar's heights
const BIKE = { x: 46, z0: -58, z1: -34, seat: 19 };
const BAG = { x: 156, z: -66 };
const POUF = [13, 6];
const DAYBED = { x0: 112, x1: 130, z0: 14, z1: 72, seat: 10 };
const NEAR = 120; // from here on (x), what can be seen down the stairwell from the house

// Its own colours (added to the house's, only here).
const PAL = {
  ...COLORS,
  stone: "#f1ece3",
  stoneShade: "#e4ddd1",
  travertine: "#e7dac6",
  travertineDark: "#d6c6ae",
  tile: "#f7f3ea",
  tileB: "#f2ede2",
  tileC: "#faf7f0",
  tileShade: "#e9e3d7",
  grout: "#e2dccf",
  cabinBack: "#9fb2c2",
  cabinBackDark: "#7f94a6",
  cabinColumn: "#c9d6e0",
  ledBlue: "#8fd8ff",
  screenBlue: "#6fd0ff",
  zellige: "#9fb79a",
  zelligeB: "#8daa8a",
  zelligeC: "#b2c7aa",
  brass: "#d4a95a",
  printPaper: "#f6f0e2",
  printLeaf: "#8fae86",
  printStem: "#6f8f6a",
  wickerLight: "#ddbb84",
  sageTrim: "#a9bb9c",
  sageCab: "#b3c4a5",
  sageCabDark: "#93a886",
  fitting: "#d3d9de", // chrome, as the taps upstairs
  fittingDark: "#aab2b9",
  oak: "#c99d6c",
  oakDark: "#a87d50",
  oakLight: "#dcb68a",
  porcelain: "#fbfbf9",
  porcelainShade: "#e5e8ea",
  tubIn: "#eef5f7",
  tubRim: "#ffffff",
  towelPink: "#f5b7c4",
  towelPinkDark: "#e597a8",
  towelBlue: "#a3c4e8",
  towelBlueDark: "#7fa5d3",
  towelWhite: "#f8f5ee",
  cupPink: "#f7a9be",
  cupBlue: "#93bfeb",
  brushPink: "#f07ea0",
  brushBlue: "#4f86d6",
  bristle: "#ffffff",
  paste: "#f6f8f9",
  pasteRed: "#e5504f",
  pasteCap: "#3fb0a3",
  amber: "#c7883f",
  orchid: "#f3a6d0",
  orchidHeart: "#fff1a8",
  leafGreen: "#5f9e57",
  leafDark: "#447f41",
  leafLight: "#7fbf68",
  olive: "#8fa36b",
  bark: "#5a4033",
  potWhite: "#efebe3",
  soilDark: "#56391f",
  wicker: "#c9a36a",
  wickerDark: "#a8834a",
  velvet: "#d99aac",
  velvetDark: "#c27f93",
  linen: "#efe7da",
  linenShade: "#ddd2c1",
  wool: "#f3ede2",
  woolDark: "#ddd3c3",
  sage: "#a9bb9c",
  rust: "#c9825a",
  duck: "#ffd43f",
  duckShade: "#f3b92a",
  beak: "#ff8a2a",
  ink: "#2a2522",
  fishOrange: "#ff8a3d",
  fishBlue: "#3f7fe0",
  fishNeon: "#3fd6e0",
  fishRed: "#e8434f",
  gravelA: "#efe3c8",
  gravelB: "#cfbd99",
  gravelC: "#ab977a",
  rock: "#8f969c",
  rockDark: "#6f767c",
  weed: "#3ea64e",
  weedLight: "#71c75c",
  coral: "#f4907f",
  coralLight: "#ffb4a3",
  chest: "#9a6a3a",
  gold: "#ffd34d",
  bathMat: "#bccbb0",
  bathMatDark: "#a6b799",
  slipper: "#f8c9d4",
  candle: "#fbf3e3",
  flameGlow: "#ffd27a",
  black: "#4a4542",
  blackSoft: "#6a635d",
  steelLite: "#d3d9de",
  mat: "#b9c9a8",
  matDark: "#9fb38e",
  cork: "#d6b27c",
  foam: "#7fb6e8",
  dbPink: "#f4a3b8",
  dbMint: "#9fdcc4",
  dbLilac: "#c3aef0",
  dbSky: "#9cc8f0",
  dbHex: "#5b5550",
  chromeBar: "#e3e8eb",
  gymBlack: "#2b2b2f",
  gymGrey: "#4a4c52",
  gymSteel: "#a3a9b0",
  gymRed: "#d43c3c",
  gymOrange: "#f39237",
  saddle: "#1e1e21",
  bottle: "#c7e6f4",
  bottleCap: "#4f86d6",
  sconce: "#ffe6b0",
  silver: "#dde7ea",
  silverGleam: "#f7fbfc",
  tankLight: "#e6f6ff",
  clockFace: "#fbfaf6",
  monitor: "#1f2a33",
  speakerCone: "#4a4d54",
  teapot: "#f4efe6",
  tea: "#b5793a",
  book1: "#c98f8f",
  book2: "#8fa8c9",
  book3: "#e2d2a6",
  pampas: "#efe2c6",
  soilMid: "#6b4a2c",
  carpet: "#5fae3e",
  carpetLight: "#8fd25e",
  drift: "#4b3526",
  driftLight: "#6e5039",
  moss: "#4f8a3a",
  ember: "#ff7a36",
  emberDark: "#e2552a",
  emberFin: "#ff9a5a",
  pampasLight: "#f7efdc",
  pampasStem: "#cdb48c",
  linenDark: "#b8a993",
  boucle: "#f1ebe1",
  boucleShade: "#e2d9cb",
  sageDeep: "#8ea381",
  rustShade: "#b06e4a",
  knit: "#f4efe6",
  knitShade: "#e1d8c9",
  brassDark: "#b08a45",
  skyPhoto: "#a9cde6",
  meadowPhoto: "#9cc48a",
  woolRib: "#ebe4d7",
  teak: "#b27a4b",
  teakLight: "#c48c5a",
  teakDark: "#8f5f37",
  jarGlass: "#e6f0f0",
  evianGlass: "#e2eff6",
  evianShade: "#c6dbe8",
  evianPink: "#f2bfcc",
  evianRed: "#d72630",
  evianBlue: "#4e8fd8",
  evianCap: "#d21f2a",
  evianCapTop: "#ef5058",
  saltPink: "#f3b9c6",
  saltLight: "#fbe0e6",
  eucalyptus: "#9fb8a8",
  slipperSole: "#e3dbcf",
  slipperInside: "#f2d2da",
  paper: "#fbfaf5",
  paperShade: "#e9e5db",
  core: "#c9a475",
  dbLabel: "#e9ebec",
  tatami: "#ddd6c4",
  tatamiB: "#d6cfbb",
  tatamiEdge: "#8f897a",
  tatamiSeam: "#c9c1ab",
  walnut: "#7a5538",
  walnutDark: "#5e3f29",
  teapotLid: "#e9e2d4",
  cushionWhite: "#f6f2ea",
  bamboo: "#e2c595",
  bambooDark: "#c4a370",
};

// `shared`: what the house so far has to share (house.js).
export function buildBasement(shared) {
  const { scene, updates, water: drops } = shared; // (drops: water.js)
  const group = new THREE.Group();
  group.name = "basement";
  scene.add(group);
  // All but what shows down the stairwell from the house: hidden from up there (`seenFromAbove`).
  const rest = new THREE.Group();
  group.add(rest);
  const obstacles = [];
  const block = (x0, x1, z0, z1) => obstacles.push([x0, x1, z0, z1]);

  /* ---------- building in cells: whole voxels, halves and quarters ---------- */

  // Static parts by cell size (1, 1/2, 1/4 of a voxel), lit and glowing, each drawn as one mesh at the end;
  // what is near the stairs (x >= NEAR) apart, as it shows down the stairwell from the house.
  const grids = new Map();
  const grid = (n, glow = false) => {
    const key = `${n}${glow ? "g" : ""}`;
    if (!grids.has(key)) {
      const [far, near] = [part(), part()];
      grids.set(key, { n, glow, far, near, add: (i, j, k, c) => ((i + 0.5) / n >= NEAR ? near : far).add(i, j, k, c) });
    }
    return grids.get(key);
  };
  // Cells 1/n across over [x0, x1] x [y0, y1] x [z0, z1] (edges, in voxels; y up from the basement floor),
  // each painted `paint` (a colour, or a function of the cell's middle giving one or nothing).
  function fill(n, [x0, x1], [y0, y1], [z0, z1], paint, p = grid(n)) {
    const lo = (v) => Math.round(v * n * 1000) / 1000;
    for (let i = Math.floor(lo(x0)); i < Math.ceil(lo(x1)); i++)
      for (let j = Math.floor(lo(y0)); j < Math.ceil(lo(y1)); j++)
        for (let k = Math.floor(lo(z0)); k < Math.ceil(lo(z1)); k++) {
          const c = typeof paint === "function" ? paint((i + 0.5) / n, (j + 0.5) / n, (k + 0.5) / n) : paint;
          if (c) p.add(i, j, k, c);
        }
  }
  // A part of cells 1/n across as a mesh placed so cell i spans i / n .. (i + 1) / n from `origin`.
  function meshOf(p, n, material = solidMaterial, origin = [0, FLOOR, 0]) {
    const m = solid(p, PAL, material);
    m.scale.setScalar(1 / n);
    m.position.set(origin[0] + 0.5 / n, origin[1] + 0.5 / n, origin[2] + 0.5 / n);
    return m;
  }
  // A thing that moves: its own part (cells 1/n across, about its own origin) in a group of its own.
  function movable(n, build) {
    const p = part();
    build((box, paint) => fill(n, box[0], box[1], box[2], paint, p));
    const g = new THREE.Group();
    g.add(meshOf(p, n, solidMaterial, [0, 0, 0]));
    rest.add(g);
    return g;
  }
  const inEllipse = (x, z, cx, cz, rx, rz, power = 2) => Math.abs((x - cx) / rx) ** power + Math.abs((z - cz) / rz) ** power <= 1;
  const W = (y) => FLOOR + y; // a height above the floor, in the world
  const lerp = (a, b, k) => a + (b - a) * k;
  // Metro tiles in cells (half voxels) on a wall, `u` along it: 4 x 2, every other row shifted half a tile,
  // each its own shade of glazed cream, a little darker along its lower edge; a sage row along the floor.
  const tiles = (u, y) => {
    const row = Math.floor(y / 2);
    const shifted = u + (row % 2) * 2;
    const along = ((shifted % 4) + 4) % 4;
    if (y < 1) return "sageTrim";
    if (y - row * 2 < 0.5 || along < 0.5) return "grout";
    if (y - row * 2 < 1) return "tileShade";
    const h = hash(Math.floor(shifted / 4), row, 77);
    return h < 0.3 ? "tileB" : h > 0.8 ? "tileC" : "tile";
  };

  /* ---------- textures ---------- */

  const texel = (g, x, y, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, 1, 1);
  };
  const tiled = (t) => ((t.tex.wrapS = t.tex.wrapT = THREE.RepeatWrapping), t);
  // The bathroom's floor: big matt stone tiles, 16 voxels square (2 texels a voxel), each its own shade of
  // warm cream, soft veins drifting across it and a fine speckle, catching the light along one edge and
  // shaded along the other, in pale grout.
  const stoneFloor = tiled(
    pixelTexture(128, 128, (g, w, h) => {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const [i, j, u, v] = [Math.floor(x / 32), Math.floor(y / 32), x % 32, y % 32];
          if (u === 0 || v === 0) {
            texel(g, x, y, "#d8d0c2");
            continue;
          }
          const tone = (hash(i, j, 71) - 0.5) * 9;
          const a = hash(i, j, 72) * Math.PI; // each tile's veins at their own angle, wandering
          const s = u * Math.cos(a) + v * Math.sin(a) + 2.5 * Math.sin(v * 0.17 + hash(i, j, 75) * 6) + 1.5 * Math.sin(u * 0.29);
          const vein = Math.max(0, 1 - Math.abs(Math.sin(s * 0.1 + hash(i, j, 73) * 6)) * 7) * (0.4 + 0.6 * hash(i, j, 76));
          const fleck = (hash(x, y, 74) - 0.5) * 5;
          const edge = u === 1 || v === 1 ? 5 : u === 31 || v === 31 ? -6 : 0;
          const k = 241 + tone + fleck + edge - vein * 9;
          texel(g, x, y, `rgb(${Math.round(k)},${Math.round(k - 5)},${Math.round(k - 13)})`);
        }
    })
  );
  // Reeded glass: fine upright ribs, clearer and frostier by turns.
  const reeds = tiled(
    pixelTexture(8, 2, (g) => {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = `rgba(240,246,244,${[0.34, 0.5, 0.58, 0.5, 0.34, 0.24, 0.2, 0.24][x]})`;
        g.fillRect(x, 0, 1, 2);
      }
    })
  );
  // A soft round glow, for light thrown on walls and floors (added on).
  const blob = pixelTexture(16, 16, (g) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const r = Math.hypot(x - 7.5, y - 7.5) / 8;
        const v = Math.round(255 * Math.max(0, 1 - r) ** 2);
        texel(g, x, y, `rgb(${v},${v},${v})`);
      }
  });
  blob.tex.magFilter = blob.tex.minFilter = THREE.LinearFilter;

  // A flat rectangle of `material`, its texture laid at `per` voxels a repeat in world coordinates (or as it
  // comes, `per` null): on the floor (`axis` "y"), or a wall facing +z or +x (for +x, `a` runs along -z), its
  // texture's bottom at height `from`.
  function sheet(material, [a0, a1], [b0, b1], at, axis, per, from = 0) {
    const g = new THREE.PlaneGeometry(a1 - a0, b1 - b0);
    const [ca, cb] = [(a0 + a1) / 2, (b0 + b1) / 2];
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) {
      const [pa, pb] = [ca + position.getX(i), cb + position.getY(i)];
      if (per) uv.setXY(i, pa / per[0], (axis === "y" ? 2 * cb - pb : pb - from) / per[1]);
    }
    const m = new THREE.Mesh(g, material);
    if (axis === "y") {
      m.rotation.x = -Math.PI / 2;
      m.position.set(ca, at, cb);
    } else if (axis === "z") m.position.set(ca, cb, at);
    else {
      m.rotation.y = Math.PI / 2;
      m.position.set(at, cb, -ca);
    }
    rest.add(m);
    return m;
  }
  const lit = (tex) => new THREE.MeshLambertMaterial({ map: tex });
  // Light thrown on a wall or the floor: a soft warm glow added on (`axis` as sheet()'s).
  const washMat = new THREE.MeshBasicMaterial({
    map: blob.tex,
    color: "#7a5a33",
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const wash = (a, b, at, axis) => (sheet(washMat, a, b, at, axis, null).renderOrder = 1);

  /* ---------- the shell: floors, walls, the slab ---------- */

  // The bathroom tiled, everywhere else the house's oak boards.
  const floors = [
    sheet(lit(stoneFloor.tex), [X0, SPLIT.x], [BACK, FRONT], FLOOR, "y", [64, 64]),
    sheet(lit(oakBoards().tex), [SPLIT.x, SIDE], [BACK, FRONT], FLOOR, "y", [256, 48]),
  ];
  group.add(...floors);
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(SIDE - X0 + WALL_T, 8, FRONT - BACK + WALL_T),
    new THREE.MeshLambertMaterial({ color: "#8a5a34" })
  );
  slab.position.set((X0 - WALL_T + SIDE) / 2, FLOOR - 4.1, (BACK - WALL_T + FRONT) / 2);
  group.add(slab);
  // The walls papered like the house's, over metro tiles round the bathroom and over panelling elsewhere; a
  // block behind each face and a cap on top, like the house's.
  const wallTop = TOP - 1;
  const tiledMat = lit(wallpaper(wallTop, true).tex);
  sheet(tiledMat, [X0 - WALL_T, SPLIT.x], [FLOOR, FLOOR + wallTop], BACK, "z", [64, wallTop], FLOOR);
  sheet(lit(wallpaper(wallTop).tex), [SPLIT.x, SIDE], [FLOOR, FLOOR + wallTop], BACK, "z", [64, wallTop], FLOOR);
  sheet(tiledMat, [-FRONT, -BACK], [FLOOR, FLOOR + wallTop], X0, "x", [64, wallTop], FLOOR);
  const backing = new THREE.MeshLambertMaterial({ color: "#e9e2d6" });
  const capMat = new THREE.MeshLambertMaterial({ color: "#c9ae8a" });
  const box3 = (mat, [x0, x1], [y0, y1], [z0, z1]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    rest.add(m);
    return m;
  };
  box3(backing, [X0 - WALL_T, SIDE], [FLOOR, FLOOR + wallTop], [BACK - WALL_T - 0.05, BACK - 0.05]);
  box3(backing, [X0 - WALL_T - 0.05, X0 - 0.05], [FLOOR, FLOOR + wallTop], [BACK, FRONT]);
  box3(capMat, [X0 - WALL_T, SIDE], [FLOOR + TOP - 1, FLOOR + TOP], [BACK - WALL_T, BACK + 1]);
  box3(capMat, [X0 - WALL_T, X0 + 1], [FLOOR + TOP - 1, FLOOR + TOP], [BACK, FRONT]);

  // Glass walls in oak frames, like the house's windows: a sill along the floor, a head along the top, a post
  // at either end (`ends`: not where it meets the fish tank, whose sides are its posts).
  const clearMat = new THREE.MeshLambertMaterial({ color: "#e6f4f6", transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  const reedMat = new THREE.MeshLambertMaterial({ map: reeds.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  function glassAlongZ(x, [z0, z1], mat, per = null, ends = [true, true]) {
    sheet(mat, [-z1, -z0], [W(1), W(GLASS_TOP)], x, "x", per).renderOrder = 2;
    fill(2, [x - 1, x + 1], [0, 1], [z0, z1], "woodMid");
    fill(2, [x - 1, x + 1], [GLASS_TOP, GLASS_TOP + 1.5], [z0, z1], "woodMid");
    [z0, z1 - 1].forEach((z, k) => ends[k] && fill(2, [x - 1, x + 1], [1, GLASS_TOP], [z, z + 1], "woodMid"));
    block(x - 1.5, x + 1.5, z0, z1);
  }
  function glassAlongX([x0, x1], z, mat) {
    sheet(mat, [x0, x1], [W(1), W(GLASS_TOP)], z, "z", null).renderOrder = 2;
    fill(2, [x0, x1], [0, 1], [z - 1, z + 1], "woodMid");
    fill(2, [x0, x1], [GLASS_TOP, GLASS_TOP + 1.5], [z - 1, z + 1], "woodMid");
    for (const x of [x0, x1 - 1]) fill(2, [x, x + 1], [1, GLASS_TOP], [z - 1, z + 1], "woodMid");
    block(x0, x1, z - 1.5, z + 1.5);
  }
  // Between the bathroom and the rest, one screen of reeded glass (the fish tank set in it), its oak head
  // running unbroken from the back wall to the front, and near the front an arched doorway: oak jambs up to
  // the spring of a round arch whose crown meets the head, reeded glass in the corners over it.
  const [doorZ0, doorZ1] = SPLIT.door;
  const ARCH = { z: (doorZ0 + doorZ1) / 2, r: (doorZ1 - doorZ0) / 2, band: 1.5 }; // (the arch's inner radius: the doorway's half width)
  ARCH.spring = GLASS_TOP - ARCH.r; // (the crown inside at the glass's top, outside at the head's)
  const outer = ARCH.r + ARCH.band;
  glassAlongZ(SPLIT.x, [BACK, TANK.z0 - 2], reedMat, [1, 1], [true, false]);
  glassAlongZ(SPLIT.x, [TANK.z1 + 2, doorZ0 - ARCH.band], reedMat, [1, 1], [false, false]);
  glassAlongZ(SPLIT.x, [doorZ1 + ARCH.band, FRONT], reedMat, [1, 1], [false, true]);
  fill(2, [SPLIT.x - 1, SPLIT.x + 1], [GLASS_TOP, GLASS_TOP + 1.5], [doorZ0 - ARCH.band, doorZ1 + ARCH.band], "woodMid");
  fill(4, [SPLIT.x - 1.5, SPLIT.x + 1.5], [0, GLASS_TOP + 1.5], [doorZ0 - ARCH.band, doorZ1 + ARCH.band], (x, y, z) => {
    if (y < ARCH.spring) return z < doorZ0 || z >= doorZ1 ? "woodMid" : null; // (the jambs)
    const r = Math.hypot(z + 0.125 - ARCH.z, y + 0.125 - ARCH.spring);
    return r >= ARCH.r && r < outer ? "woodMid" : null;
  });
  // The glass in the corners: from the jamb's outer face up to the head and along it to the arch, round it
  // back down to the spring.
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    const edge = ARCH.z + side * outer; // (along the screen, -z is the sheet's +a: as sheet())
    const meet = Math.sqrt(outer ** 2 - ARCH.r ** 2); // (where the arch's outside meets the glass's top)
    shape.moveTo(-edge, W(ARCH.spring));
    shape.lineTo(-edge, W(GLASS_TOP));
    shape.lineTo(-(ARCH.z + side * meet), W(GLASS_TOP));
    for (let k = 1; k <= 12; k++) {
      const u = Math.asin(meet / outer) + (k / 12) * (Math.PI / 2 - Math.asin(meet / outer)); // (from the crown's side down to the spring)
      shape.lineTo(-(ARCH.z + side * outer * Math.sin(u)), W(ARCH.spring + outer * Math.cos(u)));
    }
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(shape), reedMat); // (its uv the shape's own a and y: as sheet()'s, per 1)
    glass.rotation.y = Math.PI / 2;
    glass.position.x = SPLIT.x;
    glass.renderOrder = 2;
    rest.add(glass);
  }
  block(SPLIT.x - 1.5, SPLIT.x + 1.5, doorZ0 - ARCH.band, doorZ0);
  block(SPLIT.x - 1.5, SPLIT.x + 1.5, doorZ1, doorZ1 + ARCH.band);
  // The gym's front, clear (its door between the bike and the bag).
  glassAlongX([SPLIT.x + 1.5, GYM.door[0]], GYM.z, clearMat);
  glassAlongX([GYM.door[1], SIDE - 2], GYM.z, clearMat);

  /* ---------- the bathroom ---------- */

  // The toilet's nook in the back left corner: a tiled side wall, an oak panel hiding the cistern with an
  // oak shelf on it (a reed diffuser, a candle, a folded towel) and a chrome flush plate; the toilet
  // hung on it, its lid up; the paper on the side wall, the brush in the corner. Across the front, a tiled wall
  // like the side one, an oak cap running round both, and in it a door in an oak casing: cream, two panels, a
  // brass knob each side, hung on the right and opening in (`nookDoor`: below).
  const NOOK = { x0: X0, x1: -120, z1: -75 };
  const DOOR = { x0: -140, x1: -128, h: 31 }; // the doorway, and how high
  fill(2, [NOOK.x1, NOOK.x1 + 2], [0, 42], [BACK, NOOK.z1], (x, y, z) => tiles(z, y));
  fill(2, [X0, NOOK.x1 + 2], [0, 42], [NOOK.z1 - 2, NOOK.z1], (x, y) => (x > DOOR.x0 && x < DOOR.x1 && y < DOOR.h ? null : tiles(x, y)));
  fill(2, [NOOK.x1 - 0.5, NOOK.x1 + 2.5], [42, 43], [BACK, NOOK.z1 + 0.5], "woodLight");
  fill(2, [X0, NOOK.x1 - 0.5], [42, 43], [NOOK.z1 - 2.5, NOOK.z1 + 0.5], "woodLight");
  fill(4, [DOOR.x0 - 1, DOOR.x1 + 1], [0, DOOR.h + 1], [NOOK.z1, NOOK.z1 + 0.5], (x, y) =>
    x > DOOR.x0 && x < DOOR.x1 && y < DOOR.h ? null : "woodLight"
  ); // (the casing)
  const leaf = movable(4, (box) => {
    const wide = DOOR.x1 - DOOR.x0;
    box(
      [
        [-wide + 0.25, 0],
        [0.25, DOOR.h - 0.25],
        [-0.5, 0.5],
      ],
      (x, y) => {
        // Two raised panels in the stiles and rails, bevelled round their edges.
        const panel = [
          [2.5, 13],
          [15, DOOR.h - 2.5],
        ].find(([y0, y1]) => y > y0 && y < y1 && x > -wide + 2 && x < -1.75);
        if (!panel) return "porcelain";
        const edge = Math.min(y - panel[0], panel[1] - y, x + wide - 2, -1.75 - x);
        return edge < 0.5 ? "porcelainShade" : "porcelain";
      }
    );
    for (const z of [
      [0.5, 1.25],
      [-1.25, -0.5],
    ])
      box([[-wide + 1, -wide + 2], [14.5, 15.5], z], "brass");
  });
  leaf.position.set(DOOR.x1, FLOOR, NOOK.z1 - 1);
  // The door: `set(k)` shuts it (0 standing open, turned in along the side wall's way, 1 shut); `goal` where
  // it is going (swung over a second: update()).
  const OPEN = 1.6;
  const nookDoor = { k: -1, goal: 0 };
  nookDoor.set = (k) => {
    if (Math.abs(k - nookDoor.k) < 1e-4) return;
    nookDoor.k = k;
    leaf.rotation.y = -(1 - k * k * (3 - 2 * k)) * OPEN;
  };
  nookDoor.set(0);
  fill(1, [X0, NOOK.x1], [0, 26], [BACK, BACK + 4], (x, y) => (y === 13.5 ? "woodDeep" : "woodMid"));
  fill(2, [X0, NOOK.x1], [26, 27], [BACK, BACK + 5], "woodLight");
  const TOILET = { x: -135, z0: BACK + 4, z1: -92 };
  fill(4, [TOILET.x - 3, TOILET.x + 3], [17, 22], [BACK + 4, BACK + 4.25], (x, y) => (y > 19.5 && y < 19.75 ? "fittingDark" : "fitting"));
  fill(2, [TOILET.x - 7, TOILET.x + 7], [5, 13], [TOILET.z0, TOILET.z1], (x, y, z) => {
    const u = (z - TOILET.z0) / (TOILET.z1 - TOILET.z0); // 0 at the wall, 1 at the front of the bowl
    const half = 7 * Math.sqrt(Math.max(0, 1 - Math.max(0, (u - 0.35) / 0.65) ** 2)) * (y < 7 ? 0.8 : 1);
    const dx = Math.abs(x - TOILET.x);
    if (dx > half) return null;
    if (dx < half - 1.6 && u > 0.12 && u < 0.92 && y > 9) return null; // the bowl
    return y < 6.5 ? "porcelainShade" : "porcelain";
  });
  fill(2, [TOILET.x - 6.5, TOILET.x + 6.5], [12.5, 25], [TOILET.z0, TOILET.z0 + 1], (x, y) =>
    Math.abs(x - TOILET.x) < 6.5 - Math.max(0, y - 22) ? "porcelain" : null
  ); // the lid, up
  // The paper on the side wall: a chrome holder (a round plate, an arm out, a bar along the wall), the roll on
  // the bar with its cardboard core showing at the ends, quilted, a sheet hanging down off the front of it
  // (perforated across, a little ragged where it was torn).
  const ROLL = { x: NOOK.x1 - 3.25, y: 16, z: -97, r: 2.2, half: 2 };
  fill(4, [NOOK.x1 - 0.5, NOOK.x1], [ROLL.y - 1.25, ROLL.y + 1.25], [ROLL.z + ROLL.half - 0.5, ROLL.z + ROLL.half + 2], (x, y, z) =>
    Math.hypot(y - ROLL.y, z - ROLL.z - ROLL.half - 0.75) < 1.25 ? "fitting" : null
  );
  fill(4, [ROLL.x, NOOK.x1 - 0.5], [ROLL.y - 0.25, ROLL.y + 0.25], [ROLL.z + ROLL.half + 0.5, ROLL.z + ROLL.half + 1], "fitting");
  fill(4, [ROLL.x - 0.25, ROLL.x + 0.25], [ROLL.y - 0.25, ROLL.y + 0.25], [ROLL.z - ROLL.half - 0.5, ROLL.z + ROLL.half + 1], "fittingDark");
  fill(4, [ROLL.x - ROLL.r, ROLL.x + ROLL.r], [ROLL.y - ROLL.r, ROLL.y + ROLL.r], [ROLL.z - ROLL.half, ROLL.z + ROLL.half], (x, y, z) => {
    const r = Math.hypot(x - ROLL.x, y - ROLL.y);
    if (r > ROLL.r) return null;
    const end = Math.abs(z - ROLL.z) > ROLL.half - 0.25;
    if (r < 0.75) return end ? null : "paperShade"; // (the hole, round the bar)
    if (r < 1) return "core";
    if (end) return r > ROLL.r - 0.3 || Math.floor(r * 4) % 2 ? "paperShade" : "paper"; // the layers wound on
    return (Math.floor(z * 4) + Math.floor(Math.atan2(y - ROLL.y, x - ROLL.x) * 6)) % 3 === 0 ? "paperShade" : "paper"; // quilted
  });
  fill(4, [ROLL.x - ROLL.r - 0.25, ROLL.x - ROLL.r], [ROLL.y - 5.5, ROLL.y], [ROLL.z - ROLL.half + 0.25, ROLL.z + ROLL.half - 0.25], (x, y, z) => {
    if (y < ROLL.y - 5 + hash(Math.floor(z * 4), 1, 91) * 0.5) return null; // (torn)
    return Math.abs(y - ROLL.y + 3) < 0.13 ? "paperShade" : "paper";
  });
  fill(4, [X0 + 1, X0 + 4], [0, 6], [BACK + 5, BACK + 8], (x, y, z) => (Math.hypot(x - X0 - 2.5, z - BACK - 6.5) < 1.5 ? "fitting" : null));
  fill(4, [X0 + 2.25, X0 + 2.75], [6, 11], [BACK + 6.25, BACK + 6.75], "black");
  fill(4, [-147, -144], [27, 31], [BACK + 1, BACK + 4], "amber");
  for (const [dx, dz] of [
    [0, 0],
    [0.75, 0.5],
    [-0.5, 0.75],
  ])
    fill(4, [-145.75 + dx, -145.5 + dx], [31, 37 + dx], [BACK + 2.25 + dz, BACK + 2.5 + dz], "woodDeep");
  fill(4, [-126, -123], [27, 29], [BACK + 1, BACK + 4], "candle");
  fill(4, [-124.75, -124.25], [29, 30], [BACK + 2.25, BACK + 2.75], "flameGlow", grid(4, true));
  fill(2, [-140, -131], [27, 29], [BACK + 1, BACK + 4.5], (x, y) => (y > 28 ? "towelWhite" : "towelPink"));
  // Over the shelf a botanical print in a thin oak frame: a sprig of sage leaves on cream paper.
  const PRINT = { x0: -142, x1: -128, y0: 31, y1: 42 };
  fill(4, [PRINT.x0, PRINT.x1], [PRINT.y0, PRINT.y1], [BACK, BACK + 0.75], (x, y) => {
    if (x < PRINT.x0 + 0.75 || x > PRINT.x1 - 0.75 || y < PRINT.y0 + 0.75 || y > PRINT.y1 - 0.75) return "woodMid";
    if (x < PRINT.x0 + 2 || x > PRINT.x1 - 2 || y < PRINT.y0 + 2 || y > PRINT.y1 - 2) return "porcelain"; // the mount
    const [u, v] = [x - (PRINT.x0 + PRINT.x1) / 2, y - PRINT.y0 - 2.5];
    const stem = Math.abs(u - Math.sin(v * 0.35) * 0.6) < 0.3 && v < 7;
    const leaf = [1.5, 3, 4.5, 6].some((ly, k) => {
      const s = k % 2 ? 1 : -1;
      return Math.hypot((u - s * 1.4 - Math.sin(ly * 0.35) * 0.6) / 1.5, (v - ly - Math.abs(u) * 0.3) / 0.6) < 1;
    });
    return stem ? "printStem" : leaf ? "printLeaf" : "printPaper";
  });
  // On the left wall a little oak shelf with spare rolls stood on end and a brass sconce over it, its light on the wall; a
  // round blush rug before the toilet and a slim chrome bin by the wall.
  fill(2, [X0, X0 + 5], [24, 25], [-104, -92], "woodLight");
  for (const [z, y] of [
    [-101.25, 25],
    [-96.75, 25],
    [-99, 29.25],
  ])
    fill(4, [X0 + 0.5, X0 + 4.5], [y, y + 4.25], [z - 2.25, z + 2.25], (x, yy, zz) => {
      const r = Math.hypot(x - X0 - 2.5, zz - z);
      if (r > 2.1) return null;
      if (r < 0.6) return null; // (the hole through the core)
      if (r < 0.85) return "core";
      if (yy > y + 4) return r > 1.85 ? "paperShade" : "paper";
      const a = Math.atan2(zz - z, x - X0 - 2.5);
      return (Math.floor(yy * 4) + Math.floor(a * 6)) % 4 === 0 ? "paperShade" : "paper"; // quilted
    });
  fill(4, [X0, X0 + 0.5], [34, 38], [-87, -85], "brass");
  fill(4, [X0 + 0.5, X0 + 3], [36, 36.5], [-86.25, -85.75], "brass");
  fill(
    4,
    [X0 + 1.5, X0 + 4.5],
    [35, 38.5],
    [-87.5, -84.5],
    (x, y, z) => (Math.hypot(x - X0 - 3, z + 86) < 1.5 + (38.5 - y) * 0.15 ? "sconce" : null),
    grid(4, true)
  );
  wash([86 - 10, 86 + 10], [W(26), W(46)], X0 + 0.1, "x");
  fill(2, [TOILET.x - 7, TOILET.x + 7], [0, 0.5], [-91, -81], (x, y, z) => {
    const r = Math.hypot((x - TOILET.x) / 7, (z + 86) / 5);
    return r < 1 ? (r > 0.8 ? "towelPinkDark" : "towelPink") : null;
  });
  fill(4, [NOOK.x1 - 6, NOOK.x1 - 1], [0, 8], [-84, -79], (x, y, z) => {
    const r = Math.hypot(x - NOOK.x1 + 3.5, z + 81.5);
    return r < 2.3 ? (y > 7.5 ? "fittingDark" : Math.abs(y - 6.5) < 0.3 ? "fittingDark" : "fitting") : null;
  });
  // (On the plan its wall, the panel and the toilet, not the floor in front: they step in.)
  block(NOOK.x1 - 1, NOOK.x1 + 2, BACK, NOOK.z1);
  block(X0, DOOR.x0, NOOK.z1 - 2.5, NOOK.z1 + 0.5);
  block(DOOR.x1, NOOK.x1 + 2, NOOK.z1 - 2.5, NOOK.z1 + 0.5);
  block(X0, NOOK.x1, BACK, BACK + 5);
  block(TOILET.x - 7, TOILET.x + 7, TOILET.z0, TOILET.z1);
  // A wicker laundry basket beside the nook, a sleeve hanging out.
  const BASKET = [-111, -101];
  fill(2, [BASKET[0] - 5, BASKET[0] + 5], [0, 13], [BASKET[1] - 5, BASKET[1] + 5], (x, y, z) => {
    const r = Math.hypot(x - BASKET[0], z - BASKET[1]);
    if (r > 4.8) return null;
    if (y > 12) return "wickerDark";
    if (r < 3.8) return null;
    return Math.floor(y) % 3 ? "wicker" : "wickerDark";
  });
  fill(2, [BASKET[0] + 3, BASKET[0] + 6], [6, 13], [BASKET[1] + 1, BASKET[1] + 3], (x, y) =>
    x > BASKET[0] + 4.5 - (13 - y) * 0.2 ? "towelBlue" : null
  );
  block(BASKET[0] - 5, BASKET[0] + 5, BASKET[1] - 5, BASKET[1] + 5);
  block(NOOK.x1 - 6, NOOK.x1, -84, -79); // (the bin)
  // A chrome towel radiator on the wall over the basket, a white towel folded over its top rails.
  const RAD = { x0: -117, x1: -104, y0: 16, y1: 42 };
  for (const x of [RAD.x0, RAD.x1 - 1]) fill(4, [x, x + 1], [RAD.y0, RAD.y1], [BACK + 1, BACK + 2], "fitting");
  for (let y = RAD.y0 + 1; y < RAD.y1; y += 2.5) fill(4, [RAD.x0 + 1, RAD.x1 - 1], [y, y + 0.75], [BACK + 1.25, BACK + 1.75], "fitting");
  for (const x of [RAD.x0 + 0.5, RAD.x1 - 0.5]) fill(4, [x - 0.5, x + 0.5], [RAD.y0 + 3, RAD.y0 + 4], [BACK, BACK + 1], "fittingDark");
  fill(2, [RAD.x0 + 2, RAD.x1 - 2], [RAD.y1 - 13, RAD.y1 - 2], [BACK + 0.5, BACK + 3], (x, y, z) => {
    if (z > BACK + 2.5 && y < RAD.y1 - 6) return null; // (folded over: longer at the back)
    return Math.abs(y - (RAD.y1 - 10)) < 0.5 ? "porcelainShade" : "towelWhite";
  });

  // The grooming wall: a sage vanity on the wall (two drawers, chrome pulls), an oak top, two round basins
  // and chrome spouts from the wall, a round mirror in an oak frame over each, his and her towel rings either
  // side.
  // Each half a shaker drawer: a frame round a panel set back in it, its pull across the panel.
  fill(2, [VANITY.x0, VANITY.x1], [8, 20], [BACK, BACK + 13], (x, y, z) => {
    const half = x < (VANITY.x0 + VANITY.x1) / 2 ? VANITY.basins[0] : VANITY.basins[1];
    const panel = Math.abs(x - half) < 12.5 && y > 10 && y < 18.5;
    if (panel && z > BACK + 12.5) return null;
    if (y < 8.5) return "sageCabDark";
    if (panel) return Math.abs(x - half) > 12 || y < 10.5 ? "sageCabDark" : "sageCab";
    return Math.abs(x - (VANITY.x0 + VANITY.x1) / 2) < 0.5 ? "sageCabDark" : "sageCab";
  });
  for (const bx of VANITY.basins) {
    fill(4, [bx - 4, bx + 4], [15.5, 16.25], [BACK + 13, BACK + 13.75], "brass");
    for (const s of [-1, 1]) fill(4, [bx + s * 3.5 - 0.25, bx + s * 3.5 + 0.25], [15.5, 16.25], [BACK + 12.5, BACK + 13], "brass");
  }
  fill(2, [VANITY.x0 - 1, VANITY.x1 + 1], [20, VANITY.top], [BACK, BACK + 15], (x, y, z) => (z > BACK + 14.5 && y < 21 ? "woodMid" : "woodLight"));
  // The splashback: glazed sage zellige, each tile its own shade, in a band up to the mirrors.
  fill(2, [VANITY.x0 - 1, VANITY.x1 + 1], [VANITY.top, 29], [BACK, BACK + 0.5], (x, y) => {
    const [i, j] = [Math.floor((x - VANITY.x0) / 2.5), Math.floor((y - VANITY.top) / 2.5)];
    if ((x - VANITY.x0 + 1) % 2.5 < 0.5 || (y - VANITY.top) % 2.5 < 0.5) return "grout";
    const h = hash(i, j, 78);
    return h < 0.35 ? "zelligeB" : h > 0.75 ? "zelligeC" : "zellige";
  });
  fill(4, [VANITY.x0 - 1, VANITY.x1 + 1], [29, 29.5], [BACK, BACK + 1], "woodLight");
  // Brass sconces between the mirrors and at either end, their glass shades lit, a glow on the wall round
  // each.
  for (const sx of [VANITY.x0 + 2, (VANITY.x0 + VANITY.x1) / 2, VANITY.x1 - 2]) {
    fill(4, [sx - 0.75, sx + 0.75], [37, 41], [BACK, BACK + 0.5], "brass");
    fill(4, [sx - 0.25, sx + 0.25], [39, 39.5], [BACK + 0.5, BACK + 2.5], "brass");
    fill(
      4,
      [sx - 1.75, sx + 1.75],
      [39.5, 43.5],
      [BACK + 1.25, BACK + 4.75],
      (x, y, z) => (Math.hypot(x - sx, z - BACK - 3) < 1.2 + (y - 39.5) * 0.12 ? "sconce" : null),
      grid(4, true)
    );
    fill(4, [sx - 1, sx + 1], [43.5, 44], [BACK + 2, BACK + 4], "brass");
    wash([sx - 9, sx + 9], [W(33), W(52)], BACK + 0.6, "z");
  }
  // Woven baskets on the floor under it.
  for (const bx of VANITY.basins)
    fill(2, [bx - 6, bx + 6], [0, 6], [BACK + 2, BACK + 11], (x, y, z) => {
      if (Math.abs(x - bx) > 5.5 || Math.abs(z - BACK - 6.5) > 4) return null;
      if (Math.abs(x - bx) < 5 && Math.abs(z - BACK - 6.5) < 3.5 && y > 1) return y < 5 ? null : "towelWhite"; // rolled towels
      return y > 5.5 ? "wickerDark" : (Math.floor(y * 2) + Math.floor((x + z) * 1.5)) % 2 ? "wicker" : "wickerLight";
    });
  for (const bx of VANITY.basins) {
    fill(2, [bx - 6, bx + 6], [VANITY.top, VANITY.top + 4.5], [BACK + 3, BACK + 14], (x, y, z) => {
      const r = Math.hypot((x - bx) / 6, (z - BACK - 8.5) / 5.2);
      if (r > 1 - Math.max(0, VANITY.top + 1 - y) * 0.2) return null;
      return r < 0.78 && y > VANITY.top + 1 ? null : y > VANITY.top + 4 ? "tubRim" : "porcelain";
    });
    fill(4, [bx - 0.5, bx + 0.5], [VANITY.top + 0.75, VANITY.top + 1], [BACK + 8, BACK + 9], "steelDark");
    fill(4, [bx - 0.5, bx + 0.5], [30.5, 31.5], [BACK, BACK + 6], "fitting");
    fill(4, [bx - 0.5, bx + 0.5], [29.75, 31.5], [BACK + 5.5, BACK + 6.5], "fitting");
    for (const s of [-1, 1]) fill(4, [bx + s * 3 - 0.75, bx + s * 3 + 0.75], [31, 32.5], [BACK, BACK + 1.25], "fitting");
    fill(2, [bx - 7, bx + 7], [31, 47], [BACK, BACK + 0.5], (x, y) => {
      const r = Math.hypot(x - bx, y - 39);
      if (r > 6.6) return null;
      return Math.abs(x - bx + (y - 39) - 2) < 0.8 || Math.abs(x - bx + (y - 39) + 1.5) < 0.5 ? "silverGleam" : "silver";
    });
    fill(4, [bx - 8, bx + 8], [31, 47], [BACK, BACK + 1], (x, y) => {
      const r = Math.hypot(x - bx, y - 39);
      return r > 6.6 && r < 7.8 ? "woodMid" : null;
    });
  }
  // His and her cups (pink at the left end, blue at the right), a toothbrush in each, the toothpaste lying
  // between, an amber soap pump and a little orchid at the back. Each mug and brush its own mesh (`cups`),
  // hidden while it is in a hand (acts/basement.js teeth).
  const CUPS = [
    { x: VANITY.x0 + 4.5, z: BACK + 10, cup: "cupPink", brush: "brushPink", lean: 0.6 },
    { x: VANITY.x1 - 4.5, z: BACK + 10, cup: "cupBlue", brush: "brushBlue", lean: -0.6 },
  ];
  const cups = CUPS.map(({ x: cx, z: cz, cup, brush, lean }) => {
    const mug = movable(4, (box) =>
      box(
        [
          [-2.25, 2.25],
          [0, 5],
          [-2.25, 2.25],
        ],
        (x, y, z) => {
          const r = Math.hypot(x, z);
          return r < 2.2 && (r > 1.6 || y < 0.5) ? (y > 4.75 ? "porcelain" : cup) : null;
        }
      )
    );
    const stick = movable(4, (box) => {
      for (let k = 0; k < 44; k++) {
        const y = 0.5 + k * 0.25;
        const x = lean * (k / 44) * 2.4;
        const along = [
          [x - 0.375, x + 0.375],
          [y, y + 0.25],
        ];
        box([...along, [-0.375, 0.375]], k > 36 ? "bristle" : brush);
        if (k > 36) box([...along, [0.375, 1.25]], "bristle");
      }
    });
    for (const m of [mug, stick]) m.position.set(cx, W(VANITY.top), cz);
    return { mug, stick };
  });
  const mid = (VANITY.x0 + VANITY.x1) / 2;
  fill(4, [mid - 6, mid + 3], [VANITY.top, VANITY.top + 2], [BACK + 8.5, BACK + 12], (x) =>
    Math.abs(x - mid + 1) < 0.75 || Math.abs(x - mid + 3) < 0.5 ? "pasteRed" : "paste"
  );
  fill(4, [mid - 7, mid - 6], [VANITY.top, VANITY.top + 0.75], [BACK + 8.5, BACK + 12], "paste");
  fill(4, [mid + 3, mid + 5], [VANITY.top, VANITY.top + 2], [BACK + 9.25, BACK + 11.25], "pasteCap");
  fill(4, [mid - 7, mid - 5], [VANITY.top, VANITY.top + 4], [BACK + 3, BACK + 5], "amber");
  fill(4, [mid - 6.25, mid - 5.75], [VANITY.top + 4, VANITY.top + 5.5], [BACK + 3.75, BACK + 4.25], "fitting");
  fill(4, [mid - 7, mid - 5.75], [VANITY.top + 5.25, VANITY.top + 5.75], [BACK + 3.75, BACK + 4.25], "fitting");
  fill(4, [mid - 1.5, mid + 1.5], [VANITY.top, VANITY.top + 2], [BACK + 2.5, BACK + 5.5], "potWhite");
  for (let k = 0; k < 9; k++)
    fill(
      4,
      [mid - 0.25 + k * 0.08, mid + k * 0.08],
      [VANITY.top + 2 + k * 0.75, VANITY.top + 2.75 + k * 0.75],
      [BACK + 3.75, BACK + 4.25],
      "leafDark"
    );
  for (const [dx, dy] of [
    [0.5, 7.5],
    [1.75, 6.5],
    [-0.75, 6],
  ]) {
    fill(4, [mid + dx - 0.75, mid + dx + 0.75], [VANITY.top + dy, VANITY.top + dy + 1.25], [BACK + 3.5, BACK + 4.75], "orchid");
    fill(4, [mid + dx - 0.25, mid + dx + 0.25], [VANITY.top + dy + 0.5, VANITY.top + dy + 0.75], [BACK + 4.75, BACK + 5], "orchidHeart");
  }
  block(VANITY.x0 - 1, VANITY.x1 + 1, BACK, BACK + 15);
  const RINGS = [VANITY.x0 - 5, VANITY.x1 + 5.5];
  for (const [rx, a, b] of [
    [RINGS[0], "towelPink", "towelPinkDark"],
    [RINGS[1], "towelBlue", "towelBlueDark"],
  ]) {
    fill(4, [rx - 3, rx + 3], [30, 36], [BACK, BACK + 0.75], (x, y) => (Math.abs(Math.hypot(x - rx, y - 33) - 2.4) < 0.4 ? "fitting" : null));
    fill(2, [rx - 2.5, rx + 2.5], [18, 31], [BACK + 0.5, BACK + 2], (x, y) => (y < 19.5 || y > 29.5 ? b : a));
  }

  // An open oak tower of fresh towels by the vanity (shelves(), below): a pair of shaker doors at the foot,
  // folded stacks over them, rolled ones above, and at the top a lidded wicker basket and eucalyptus in a
  // little white pot.
  const TOWER = { x0: -30, x1: -16, z0: BACK, z1: BACK + 10 };
  shelves(TOWER, 44, [14, 25, 35], 14);
  folded(TOWER.x0 + 1.25, TOWER.x0 + 6.75, 14.75, TOWER, ["towelWhite", "towelPink", "towelWhite"]);
  folded(TOWER.x0 + 7.25, TOWER.x1 - 1.25, 14.75, TOWER, ["towelBlue", "towelWhite", "towelBlue"]);
  [
    [TOWER.x0 + 3.25, 27.6, "towelWhite"],
    [TOWER.x0 + 7, 27.6, "towelPink"],
    [TOWER.x0 + 10.75, 27.6, "towelWhite"],
    [TOWER.x0 + 5.1, 30.8, "towelBlue"],
    [TOWER.x0 + 8.9, 30.8, "towelWhite"],
  ].forEach(([cx, cy, c]) => rolled(cx, cy, 1.85, TOWER, c));
  fill(4, [TOWER.x0 + 1.5, TOWER.x0 + 8.5], [35.75, 41], [TOWER.z0 + 1.5, TOWER.z1 - 1], (x, y, z) => {
    if (y >= 40.5) return x >= TOWER.x0 + 4.25 && x < TOWER.x0 + 5.75 && z >= TOWER.z0 + 4 && z < TOWER.z0 + 6 ? "wickerDark" : null; // (the lid's knob)
    if (y >= 39.5) return "wickerDark"; // the lid
    return (Math.floor(y * 2) + Math.floor((x + z) * 2)) % 2 ? "wicker" : "wickerLight";
  });
  fill(4, [TOWER.x1 - 4.75, TOWER.x1 - 2], [35.75, 38.25], [TOWER.z0 + 3.5, TOWER.z0 + 6.25], (x, y) => (y > 38 ? "soilDark" : "potWhite"));
  for (let k = 0; k < 9; k++) {
    const [lx, ly, lz] = [TOWER.x1 - 3.4 + 1.6 * Math.sin(k * 2.3), 38.5 + k * 0.55, TOWER.z0 + 4.9 + 1.2 * Math.cos(k * 2.3)];
    fill(4, [lx - 0.5, lx + 0.5], [ly, ly + 0.5], [lz - 0.375, lz + 0.375], k % 3 ? "eucalyptus" : "olive");
  }
  block(TOWER.x0, TOWER.x1, TOWER.z0, TOWER.z1);
  // Open oak shelves against the back wall over `box` (x0..x1, from the wall z0 out to z1), `h` high: a
  // plinth set back at the foot, a cap over the top standing out a little, the sides' and shelves' fronts
  // lipped in a lighter oak, a darker back panel; shelves at `levels`; under the first, if `doors` (its
  // height), a pair of shaker doors meeting in the middle with brass knobs.
  function shelves({ x0, x1, z0, z1 }, h, levels, doors = 0) {
    const mid = (x0 + x1) / 2;
    fill(4, [x0 - 0.5, x1 + 0.5], [0, h + 0.75], [z0, z1 + 0.5], (x, y, z) => {
      const [side, front] = [x < x0 + 1 || x >= x1 - 1, z >= z1 - 0.5];
      if (y < 2) return x >= x0 + 0.5 && x < x1 - 0.5 && z < z1 - 0.5 ? "oakDark" : null; // the plinth
      if (y >= h) return x >= x0 - 0.5 && x < x1 + 0.5 ? (z >= z1 + 0.25 || y >= h + 0.5 ? "woodLight" : "woodMid") : null; // the cap
      if (x < x0 || x >= x1 || z >= z1) return null;
      if (side) return front ? "woodLight" : "woodMid";
      if (z < z0 + 0.5) return "oakDark"; // the back
      const shelf = levels.some((l) => y >= l && y < l + 0.75);
      if (shelf) return front ? "woodLight" : "woodMid";
      if (y < 2.75) return front ? "woodLight" : "woodMid"; // the bottom
      if (y < doors && front) {
        // A door each side: stiles and rails round a panel set back, a knob by the middle.
        const [dx0, dx1] = x < mid ? [x0 + 1, mid] : [mid, x1 - 1];
        const rail = x < dx0 + 1 || x >= dx1 - 1 || y < 3.75 || y >= doors - 1;
        const seam = Math.abs(x + 0.125 - mid) < 0.2;
        if (!rail && !seam && z >= z1 - 0.25) return null; // (the panel set back)
        return seam ? "oakDark" : rail ? "woodMid" : "oak";
      }
      return null;
    });
    if (doors)
      for (const s of [-1, 1]) fill(4, [mid + s * 1.25 - 0.375, mid + s * 1.25 + 0.375], [doors - 4.5, doors - 3.75], [z1, z1 + 0.5], "brass");
  }
  // A stack of folded towels from x0 to x1 standing on `y`, filling the shelf's depth: each a soft fold to
  // the front with a woven band across it in its own darker shade (a sage one on white), a crease of shade
  // between each and the next; `colors` from the bottom up.
  function folded(x0, x1, y, { z0, z1 }, colors) {
    const band = { towelWhite: "linenShade", towelPink: "towelPinkDark", towelBlue: "towelBlueDark" };
    colors.forEach((c, j) => {
      const [b, t] = [y + j * 2.75, y + j * 2.75 + 2.75];
      const sway = j % 2 ? 0.25 : 0; // (not quite square on one another)
      fill(4, [x0 + sway, x1 + sway - 0.25], [b, t], [z0 + 1, z1 - 0.75], (x, yy, z) => {
        const front = z >= z1 - 1.25;
        const edge = yy < b + 0.25 || yy >= t - 0.25;
        if (front && edge && (x < x0 + sway + 0.25 || x >= x1 + sway - 0.5)) return null; // (the fold's rounded corners)
        if (front && yy < b + 0.25) return "porcelainShade"; // the crease under it
        if (front && Math.abs(yy - (b + 1.5)) < 0.3) return c === "towelWhite" ? "sage" : band[c];
        return c;
      });
    });
  }
  // A towel rolled up, lying along the shelf from the back to the front: round, `r` across about (cx, cy),
  // the roll's end showing its turns spiralling in, a band near the end in a darker shade.
  function rolled(cx, cy, r, { z0, z1 }, c) {
    const shade = { towelWhite: "porcelainShade", towelPink: "towelPinkDark", towelBlue: "towelBlueDark" }[c];
    fill(4, [cx - r, cx + r], [cy - r, cy + r], [z0 + 1.5, z1 - 0.75], (x, y, z) => {
      const [dx, dy] = [x + 0.125 - cx, y + 0.125 - cy];
      const d = Math.hypot(dx, dy);
      if (d > r) return null;
      if (z < z1 - 1) return Math.abs(z - (z1 - 2.5)) < 0.3 ? shade : c;
      const turn = (((d + (Math.atan2(dy, dx) / (2 * Math.PI)) * 0.7) % 0.7) + 0.7) % 0.7; // (an Archimedean spiral, 0.7 a turn)
      return turn < 0.25 || d < 0.3 ? shade : c;
    });
  }
  // A ribbed cotton rug in the middle of the bathroom, its corners rounded, a sage stripe inside its border,
  // a fringe of tassels along each short end.
  const RUG_B = { x0: -76, x1: -44, z0: -4, z1: 22 };
  fill(2, [RUG_B.x0, RUG_B.x1], [0, 0.5], [RUG_B.z0, RUG_B.z1], (x, y, z) => {
    const [ex, ez] = [Math.min(x - RUG_B.x0, RUG_B.x1 - x), Math.min(z - RUG_B.z0, RUG_B.z1 - z)];
    if (ex < 3 && ez < 3 && Math.hypot(3 - ex, 3 - ez) > 3) return null; // (the rounded corners)
    const e = Math.min(ex, ez);
    if (e < 1) return "woolDark";
    if (e > 2 && e < 2.5) return "sage";
    return Math.floor(z) % 2 ? "wool" : "woolRib";
  });
  for (const x of [RUG_B.x0 - 1.5, RUG_B.x1])
    fill(4, [x, x + 1.5], [0, 0.25], [RUG_B.z0 + 3, RUG_B.z1 - 3], (xx, y, z) => (Math.floor(z * 4) % 4 < 2 ? "woolDark" : null));
  // On it a teak bench of slats (gaps between them) on square legs, a slatted shelf low down with a woven
  // basket of rolled towels; on top, folded bath towels with a stitched blush band at one end, and at the other
  // a rattan tray: a glass jar of pink bath salts with an oak lid, a candle in an amber glass, a sprig of
  // eucalyptus in a bud vase.
  const BENCH = { x0: -71, x1: -49, z0: 5, z1: 12, seat: 9 };
  fill(4, [BENCH.x0, BENCH.x1], [0, BENCH.seat], [BENCH.z0, BENCH.z1], (x, y, z) => {
    const legX = x < BENCH.x0 + 1.5 || x > BENCH.x1 - 1.5;
    const legZ = z < BENCH.z0 + 1.5 || z > BENCH.z1 - 1.5;
    const slat = (z - BENCH.z0 + 0.2) % 1.4 < 1; // (each slat 1 wide, a gap of 0.4)
    if (y > BENCH.seat - 1) return slat ? (y > BENCH.seat - 0.25 ? "teakLight" : "teak") : null;
    if (y > BENCH.seat - 2 && (legZ || legX)) return "teakDark"; // the rails under the top
    if (y > 2.5 && y < 3.25 && !legX) return slat ? "teak" : null; // the shelf
    return legX && legZ ? (x - BENCH.x0 < 0.5 || BENCH.x1 - x < 0.5 ? "teakDark" : "teak") : null;
  });
  block(BENCH.x0, BENCH.x1, BENCH.z0, BENCH.z1);
  const HAMPER = { x0: -64, x1: -56, z0: 5.75, z1: 11.25 };
  fill(4, [HAMPER.x0, HAMPER.x1], [3.25, 7], [HAMPER.z0, HAMPER.z1], (x, y, z) => {
    const inside = x > HAMPER.x0 + 0.5 && x < HAMPER.x1 - 0.5 && z > HAMPER.z0 + 0.5 && z < HAMPER.z1 - 0.5 && y > 3.75;
    if (inside) return null;
    return (Math.floor(y * 4) + Math.floor((x + z) * 2)) % 2 ? "wicker" : "wickerDark";
  });
  for (const [x, c] of [
    [-62, "towelWhite"],
    [-58, "towelBlue"],
  ])
    fill(4, [x - 1.75, x + 1.75], [3.75, 8.5], [HAMPER.z0 + 0.5, HAMPER.z1 - 0.5], (xx, y, z) => {
      const r = Math.hypot(xx - x, y - 6.75);
      return r < 1.75 ? (z > HAMPER.z1 - 0.75 ? (Math.floor(r * 3) % 2 ? c : "porcelainShade") : c) : null;
    });
  const onBench = BENCH.seat;
  fill(4, [BENCH.x0 + 1.5, BENCH.x0 + 9.5], [onBench, onBench + 3], [BENCH.z0 + 0.75, BENCH.z1 - 0.75], (x, y, z) => {
    const layer = Math.floor((y - onBench) / 1.5); // two folded, one on the other
    const [e, top] = [x - BENCH.x0 - 1.5 - layer * 0.5, BENCH.x0 + 9.5 - x];
    if (e < 0 || top < 0) return null;
    if (x > BENCH.x0 + 7.5 && x < BENCH.x0 + 8.25) return "towelPink"; // the band
    return (y - onBench) % 1.5 < 0.25 || e < 0.25 ? "porcelainShade" : "towelWhite"; // (the folds)
  });
  const TRAY = { x0: BENCH.x1 - 9, x1: BENCH.x1 - 1.5, z0: BENCH.z0 + 1, z1: BENCH.z1 - 1 };
  fill(4, [TRAY.x0, TRAY.x1], [onBench, onBench + 1], [TRAY.z0, TRAY.z1], (x, y, z) => {
    const e = Math.min(x - TRAY.x0, TRAY.x1 - x, z - TRAY.z0, TRAY.z1 - z);
    return e < 0.5 || y < onBench + 0.25 ? ((Math.floor(x * 2) + Math.floor(y * 4)) % 2 ? "wicker" : "wickerDark") : null;
  });
  const JAR = [TRAY.x0 + 2.25, TRAY.z0 + 2.5];
  fill(4, [JAR[0] - 1.5, JAR[0] + 1.5], [onBench + 0.25, onBench + 4.75], [JAR[1] - 1.5, JAR[1] + 1.5], (x, y, z) => {
    const r = Math.hypot(x - JAR[0], z - JAR[1]);
    if (r > 1.5) return null;
    if (y > onBench + 4) return r < 1.25 ? "oakLight" : null; // the lid
    if (r > 1.25) return "jarGlass";
    return y < onBench + 3 ? (hash(Math.floor(x * 4), Math.floor(y * 4), Math.floor(z * 4)) < 0.4 ? "saltLight" : "saltPink") : null;
  });
  const GLASS = [TRAY.x1 - 2, TRAY.z0 + 2];
  fill(4, [GLASS[0] - 1.25, GLASS[0] + 1.25], [onBench + 0.25, onBench + 3], [GLASS[1] - 1.25, GLASS[1] + 1.25], (x, y, z) => {
    const r = Math.hypot(x - GLASS[0], z - GLASS[1]);
    if (r > 1.25) return null;
    return r > 1 ? "amber" : y < onBench + 2 ? "candle" : null;
  });
  fill(4, [GLASS[0] - 0.25, GLASS[0] + 0.25], [onBench + 2, onBench + 2.75], [GLASS[1] - 0.25, GLASS[1] + 0.25], "flameGlow", grid(4, true));
  const BUD = [TRAY.x1 - 2.25, TRAY.z1 - 1.5];
  fill(4, [BUD[0] - 0.75, BUD[0] + 0.75], [onBench + 0.25, onBench + 2.5], [BUD[1] - 0.75, BUD[1] + 0.75], (x, y, z) =>
    Math.hypot(x - BUD[0], z - BUD[1]) < 0.75 - (y > onBench + 1.75 ? 0.35 : 0) ? "zelligeC" : null
  );
  fill(4, [BUD[0] - 0.125, BUD[0] + 0.125], [onBench + 2.5, onBench + 7], [BUD[1] - 0.125, BUD[1] + 0.125], "printStem");
  for (let k = 0; k < 6; k++) {
    const s = k % 2 ? 1 : -1;
    const [lx, ly] = [BUD[0] + s * 0.5, onBench + 3 + k * 0.7];
    fill(4, [lx - 0.375, lx + 0.375], [ly, ly + 0.5], [BUD[1] - 0.375, BUD[1] + 0.375], "eucalyptus");
  }
  // The bath, a big round one sunk in a cream stone deck against the left wall (its front curved out into the
  // room, a shadow gap along the floor), a white lip round the tub; on the deck behind it a chrome spout
  // arching over the water, two pairs of handles and a hand shower on its holder; a mat and slippers beside it.
  const inDeck = (x, z) => (x < TUB.x ? Math.abs(z - TUB.z) <= TUB.deckR : Math.hypot(x - TUB.x, z - TUB.z) <= TUB.deckR);
  fill(2, [X0, TUB.x + TUB.deckR], [0, TUB.deck + 1], [TUB.z - TUB.deckR, TUB.z + TUB.deckR], (x, y, z) => {
    const r = Math.hypot(x - TUB.x, z - TUB.z);
    if (r < TUB.r) return y < TUB.floor ? "tubIn" : null; // its inside, open over its floor
    if (r < TUB.r + 2.5) return y > TUB.deck ? (r < TUB.r + 2 ? "tubRim" : null) : y > TUB.deck - 1.5 || r < TUB.r + 0.5 ? "porcelain" : "travertine";
    if (y > TUB.deck || !inDeck(x, z)) return null;
    const edge = !inDeck(x + 1.5, z) || !inDeck(x, z + 1.5) || !inDeck(x, z - 1.5);
    if (y < 1 && edge) return null; // (the deck stands back a little at the floor)
    if (y > TUB.deck - 0.5) return edge ? "stoneShade" : "stone";
    return y > TUB.deck - 1.5 && edge ? "stoneShade" : "travertine";
  });
  const deckY = TUB.deck;
  const TAPS = { x: TUB.x - TUB.r - 3.5, z: TUB.z };
  fill(4, [TAPS.x - 1, TAPS.x + 1], [deckY, deckY + 0.5], [TAPS.z - 1, TAPS.z + 1], "fitting");
  fill(4, [TAPS.x - 0.5, TAPS.x + 0.5], [deckY + 0.5, deckY + 5], [TAPS.z - 0.5, TAPS.z + 0.5], "fitting");
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * (Math.PI / 2); // the arch over to the spout
    const [x, y] = [TAPS.x + 7 * Math.sin(a), deckY + 5 + 2.5 * Math.sin(Math.PI / 2 + a) - 0.5];
    fill(4, [x - 0.5, x + 0.5], [y - 0.5, y + 0.5], [TAPS.z - 0.5, TAPS.z + 0.5], "fitting");
  }
  fill(4, [TAPS.x + 6.75, TAPS.x + 7.75], [deckY + 3, deckY + 4], [TAPS.z - 0.5, TAPS.z + 0.5], "fittingDark");
  for (const dz of [-7, -4, 4, 7]) {
    fill(4, [TAPS.x - 0.75, TAPS.x + 0.75], [deckY, deckY + 2], [TAPS.z + dz - 0.75, TAPS.z + dz + 0.75], "fitting");
    if (Math.abs(dz) > 5) fill(4, [TAPS.x - 0.25, TAPS.x + 1.5], [deckY + 1.75, deckY + 2.25], [TAPS.z + dz - 0.25, TAPS.z + dz + 0.25], "fitting");
  }
  // The bath's own pair, by the spout: levers turned out as it runs (runTap()).
  const levers = [-4, 4].map((dz) => {
    const g = movable(4, (box) =>
      box(
        [
          [-0.25, 1.5],
          [-0.25, 0.25],
          [-0.25, 0.25],
        ],
        "fitting"
      )
    );
    g.position.set(TAPS.x, W(deckY + 2), TAPS.z + dz);
    return g;
  });
  // The drain in the middle of the tub's floor: a chrome ring round the dark waste, and its pop-up plug, down
  // (shut) while the bath is run or full, up while it is let out or empty (update()).
  fill(4, [TUB.x - 1.75, TUB.x + 1.75], [TUB.floor, TUB.floor + 0.25], [TUB.z - 1.75, TUB.z + 1.75], (x, y, z) => {
    const r = Math.hypot(x - TUB.x, z - TUB.z);
    return r < 1.25 ? "fittingDark" : r < 1.75 ? "fitting" : null;
  });
  const plug = movable(4, (box) =>
    box(
      [
        [-1.1, 1.1],
        [0, 0.25],
        [-1.1, 1.1],
      ],
      (x, y, z) => (Math.hypot(x, z) < 1.1 ? (Math.hypot(x, z) < 0.4 ? "steelLite" : "fitting") : null)
    )
  );
  plug.position.set(TUB.x, W(TUB.floor + 0.25), TUB.z);
  fill(4, [TAPS.x - 1, TAPS.x + 1], [deckY, deckY + 1.5], [TAPS.z + 10, TAPS.z + 12], "fitting");
  for (let k = 0; k < 14; k++) {
    const [x, y] = [TAPS.x - 0.25 + k * 0.32, deckY + 1.5 + k * 0.25];
    fill(4, [x - 0.4, x + 0.4], [y, y + 0.5], [TAPS.z + 10.6, TAPS.z + 11.4], k > 10 ? "steelLite" : "fitting");
  }
  block(X0, NICHE.x1, NICHE.z0, NICHE.z1);
  // Before the bath a deep-pile sage mat (tufted, its corners rounded, a stitched edge), and a pair of terry
  // slippers left by it, toes out.
  const BATHMAT = { x0: NICHE.x1 + 1.5, x1: NICHE.x1 + 10.5, z0: TUB.z - 9, z1: TUB.z + 9 };
  fill(4, [BATHMAT.x0, BATHMAT.x1], [0, 0.75], [BATHMAT.z0, BATHMAT.z1], (x, y, z) => {
    const [ex, ez] = [Math.min(x - BATHMAT.x0, BATHMAT.x1 - x), Math.min(z - BATHMAT.z0, BATHMAT.z1 - z)];
    if (ex < 1.5 && ez < 1.5 && Math.hypot(1.5 - ex, 1.5 - ez) > 1.5) return null;
    const e = Math.min(ex, ez);
    if (e < 0.25) return y < 0.5 ? "bathMatDark" : null;
    if (e < 0.75) return "bathMatDark"; // (the stitched edge)
    if (y > 0.5) return hash(Math.floor(x * 4), Math.floor(z * 4), 93) < 0.55 ? "bathMat" : null; // the tufts
    return "bathMatDark";
  });
  for (const [cx, cz, a] of [
    [NICHE.x1 + 13, TUB.z + 4, 0.15],
    [NICHE.x1 + 13.5, TUB.z + 7.75, -0.1],
  ])
    fill(4, [cx - 3.5, cx + 3.5], [0, 1.75], [cz - 2, cz + 2], (x, y, z) => {
      const [u, w] = [(x - cx) * Math.cos(a) + (z - cz) * Math.sin(a), -(x - cx) * Math.sin(a) + (z - cz) * Math.cos(a)]; // along, across
      if ((u / 3) ** 2 + (w / 1.35) ** 2 > 1) return null; // the sole's outline
      if (y < 0.5) return "slipperSole";
      const toe = u > 0;
      if (!toe) return y < 0.75 ? (Math.abs(w) > 1 || u < -2.5 ? "slipper" : "slipperInside") : null;
      return y < 0.5 + 1.25 * Math.sqrt(Math.max(0, 1 - (u / 3) ** 2 - (w / 1.35) ** 2)) ? "slipper" : null; // the puffy toe
    });
  // The water, always in it: a round sheet over the tub's inside, drawn a few times a second: clear, the white
  // tub showing through it (bluer where it is deeper, in the middle), a net of light rippling across it as on
  // the floor of a pool, a soft glint of the lamps drifting on it, a bright line where it meets the tub;
  // frothing with bubbles in a bubble bath.
  const RW = 48;
  const ripple = pixelTexture(RW, RW, () => {});
  ripple.tex.magFilter = ripple.tex.minFilter = THREE.LinearFilter;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(TUB.r - 0.25, 40),
    new THREE.MeshLambertMaterial({ map: ripple.tex, transparent: true, opacity: 0.8, depthWrite: false })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(TUB.x, W(TUB.level), TUB.z);
  water.renderOrder = 2;
  rest.add(water);
  const image = ripple.g.createImageData(RW, RW);
  // Where the spout's water lands, in the texture (its x along the world's x, its rows down the world's z).
  const SPOUT = { x: TAPS.x + 7.25, y: TUB.deck + 3.25 };
  const landing = [((SPOUT.x - TUB.x) / (2 * TUB.r) + 0.5) * RW, 0.5 * RW];
  // `drain` 0..1: swirling down the plug in the middle (a spiral, a dimple); `pouring` 0..1, how hard the
  // spout's water falls into it: churned white where it lands, bubbles drifting off it, rings spreading.
  const splashes = []; // (bath.splash(): each { t, u, v, a } in the texture, for 2.5 s, `a` how big)
  // The net of light: the bright lines between neighbouring cells round points strewn one to a cell, each
  // wandering a little on its own (texture px of a cell `size`, `seed` for its points); 1 on a line, fading
  // off over a px or so. Two of them, of sizes that never line up, so that the net is uneven and never repeats.
  // (The points worked out once a drawing, for the cells from -3 on: `net.points(t)` before `net.at(x, y)`.)
  function makeNet(size, seed) {
    const N = Math.ceil((RW + 30) / size) + 6; // cells a side, enough for the texture shifted and wavering
    const points = new Float32Array(2 * N * N);
    return {
      points(t) {
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const [cx, cy] = [i - 3, j - 3];
            const a = hash(cx, cy, seed) * 6.28;
            points[2 * (j * N + i)] = cx + 0.2 + 0.6 * hash(cx, cy, seed + 3) + 0.18 * Math.sin(t * (0.6 + 0.5 * hash(cx, cy, seed + 1)) + a);
            points[2 * (j * N + i) + 1] = cy + 0.2 + 0.6 * hash(cx, cy, seed + 4) + 0.18 * Math.cos(t * (0.5 + 0.5 * hash(cx, cy, seed + 2)) + 2 * a);
          }
      },
      at(x, y) {
        const [gx, gy] = [x / size, y / size];
        const [ix, iy] = [Math.floor(gx) + 3, Math.floor(gy) + 3];
        let [f1, f2] = [9, 9]; // the nearest point's distance, and the next nearest's
        for (let j = iy - 1; j <= iy + 1; j++)
          for (let i = ix - 1; i <= ix + 1; i++) {
            const k = 2 * (j * N + i);
            const d = Math.hypot(gx - points[k], gy - points[k + 1]);
            if (d < f1) [f1, f2] = [d, f1];
            else if (d < f2) f2 = d;
          }
        return Math.max(0, 1 - ((f2 - f1) * size) / 2);
      },
    };
  }
  const nets = [makeNet(8.6, 41), makeNet(5.3, 47)];
  function drawWater(t, foam, drain = 0, pouring = 0) {
    const { data } = image;
    while (splashes.length && t - splashes[0].t > 2.5) splashes.shift();
    const live = splashes.filter((s) => t >= s.t);
    nets[0].points(t);
    nets[1].points(t * 1.3);
    for (let y = 0; y < RW; y++)
      for (let x = 0; x < RW; x++) {
        const [mx, my] = [x - RW / 2 + 0.5, y - RW / 2 + 0.5];
        const rm = Math.hypot(mx, my) / (RW / 2);
        // How far the water is stirred here: the drain's spiral, rings from where the spout's water lands and
        // from splashes. They show by bending the net of light, a little lighter on their crests.
        let c = 0;
        if (drain) c += 2.2 * drain * Math.sin(3 * Math.atan2(my, mx) + 5 * Math.log(rm + 0.05) - t * 7) * Math.max(0, 1 - rm * 1.6);
        const rl = pouring ? Math.hypot(x - landing[0], y - landing[1]) : Infinity;
        if (pouring) c += 2 * pouring * Math.sin(rl * 1.3 - t * 9) * Math.max(0, 1 - rl / 16);
        for (const s of live) {
          const [age, rs] = [t - s.t, Math.hypot(x - s.u, y - s.v)];
          c += 2.2 * s.a * Math.sin(rs * 1.1 - age * 12) * Math.max(0, 1 - Math.abs(rs - age * 11) / 5) * Math.max(0, 1 - age / 2.5);
        }
        // Gently swelling: the net's lines bowed into rounded cells and wavering (more where it is stirred),
        // brighter in some patches than others, drifting.
        const bend = Math.max(-3, Math.min(3, c));
        const wx = x + 2.4 * Math.sin(y * 0.16 + t * 0.55) + 1.4 * Math.sin((x + y) * 0.09 - t * 0.35) + 1.2 * bend;
        const wy = y + 2.4 * Math.sin(x * 0.14 - t * 0.5) + 1.4 * Math.sin((x - y) * 0.1 + t * 0.4) - 1.2 * bend;
        const patch = 0.6 + 0.4 * Math.sin(x * 0.11 + t * 0.3) * Math.sin(y * 0.09 - t * 0.23);
        const caustic = patch * Math.max(nets[0].at(wx, wy), 0.55 * nets[1].at(wx + 17, wy + 5)) ** 2;
        const deep = Math.min(1, (1 - rm) * 2.2); // (0 at the rim, 1 a little way in)
        let [r, g, b] = [196 - 64 * deep + 6 * c, 234 - 32 * deep + 4 * c, 240 - 22 * deep + 3 * c];
        r += 58 * caustic;
        g += 36 * caustic;
        b += 22 * caustic;
        const glint = Math.exp(-((Math.hypot(x / RW - 0.66, y / RW - 0.3) / 0.13) ** 2)) * (0.6 + 0.4 * caustic);
        [r, g, b] = [r + (255 - r) * 0.6 * glint, g + (255 - g) * 0.6 * glint, b + (255 - b) * 0.6 * glint];
        if (rm > 0.94) [r, g, b] = [r + 30, g + 18, b + 12]; // (the meniscus)
        const edge = Math.max(0, (1 - rm) * (RW / 2)) / 6;
        const froth = foam * (0.25 + Math.max(0, 1 - edge) * 0.9) * (0.55 + 0.45 * Math.sin(y * 1.7 + x * 2.3 + t * 2));
        if (froth > 0.45) [r, g, b] = [250, 252, 252];
        else if (froth > 0.3) [r, g, b] = [r * 0.4 + 150, g * 0.4 + 152, b * 0.4 + 153];
        if (pouring) {
          const churn = pouring * Math.max(0, 1 - rl / 6) * (0.9 + 0.3 * Math.sin(rl * 2.6 - t * 15 + x));
          const bubble = rl < 10 && hash(x, y, Math.floor(t * 10)) < 0.12 * pouring * (1 - rl / 10);
          const k = churn > 0.5 ? 1 : bubble ? 0.75 : churn > 0.25 ? 0.55 : 0;
          [r, g, b] = [r + (248 - r) * k, g + (252 - g) * k, b + (253 - b) * k];
        }
        if (Math.hypot(mx, my) < 1.6) [r, g, b] = [r * 0.88, g * 0.9, b * 0.92]; // (the plug, under it)
        if (drain) {
          // Streaks of foam drawn round and in along three arms, closer and quicker towards the plug; the
          // dimple over it.
          const arm = Math.sin(3 * Math.atan2(my, mx) + 9 * Math.log(rm + 0.04) - t * 8);
          const near = Math.max(0, 1 - rm / (0.25 + 0.4 * drain));
          if (arm > 0.55 - 0.3 * near && near > 0.05) {
            const k = Math.min(1, near * 1.8) * drain;
            [r, g, b] = [r + (245 - r) * k, g + (250 - g) * k, b + (252 - b) * k];
          }
          if (rm < 0.1 * drain) [r, g, b] = [r * 0.5, g * 0.58, b * 0.68];
        }
        const k = 4 * (y * RW + x);
        data[k] = Math.min(255, r);
        data[k + 1] = Math.min(255, g);
        data[k + 2] = Math.min(255, b);
        data[k + 3] = 255;
      }
    ripple.g.putImageData(image, 0, 0);
    ripple.tex.needsUpdate = true;
  }
  const foamHeap = movable(2, (box) =>
    box(
      [
        [-5.5, 5.5],
        [0, 2.5],
        [-6, 6],
      ],
      (x, y, z) => {
        const r = Math.hypot(x / 5.5, z / 6) + y * 0.3 + Math.sin(x * 2.1 + z * 1.7) * 0.12;
        return r < 1 ? (hash(Math.floor(x * 2), Math.floor(y * 2), Math.floor(z * 2)) < 0.3 ? "porcelainShade" : "tubRim") : null;
      }
    )
  );
  foamHeap.position.set(TUB.x + 9, W(TUB.level) - 0.6, TUB.z + 5);
  // Steam: soft wisps rising off hot water (added together, so a dimmer one is fainter).
  const STEAM = 9;
  const steam = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blob.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    STEAM
  );
  steam.renderOrder = 4;
  for (let i = 0; i < STEAM; i++) steam.setColorAt(i, new THREE.Color(0, 0, 0)); // (coloured from the start: no new shader later)
  rest.add(steam);
  // Tiny bubbles coming up all the while (the water is alive): each comes up somewhere new, sits a moment on
  // the surface, swelling a little, and pops.
  const FIZZ = 14;
  const fizz = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.4, 0.2, 0.4),
    new THREE.MeshBasicMaterial({ color: "#f4fbff", transparent: true, opacity: 0.85, depthWrite: false }),
    FIZZ
  );
  fizz.renderOrder = 3;
  fizz.frustumCulled = false;
  rest.add(fizz);
  const fizzes = Array.from({ length: FIZZ }, () => ({ at: -Infinity, life: 0, x: 0, z: 0, size: 1 }));
  // A rubber duck, bobbing about on the water.
  const duck = movable(4, (box) => {
    box(
      [
        [-1.75, 1.75],
        [0, 2.5],
        [-2.5, 2.5],
      ],
      (x, y, z) => (inEllipse(x, z, 0, 0, 1.75, 2.5) && y < 2.5 - Math.abs(z) * 0.15 ? (y < 0.75 ? "duckShade" : "duck") : null)
    );
    box(
      [
        [-1.25, 1.25],
        [2, 4.5],
        [0.25, 2.75],
      ],
      (x, y, z) => (Math.hypot(x, y - 3.25, z - 1.5) < 1.3 ? "duck" : null)
    );
    box(
      [
        [-0.5, 0.5],
        [2.75, 3.5],
        [2.5, 3.75],
      ],
      "beak"
    );
    box(
      [
        [-1.25, 1.25],
        [3.5, 4],
        [2.25, 2.5],
      ],
      (x) => (Math.abs(x) > 0.5 && Math.abs(x) < 1 ? "ink" : null)
    );
    box(
      [
        [-0.5, 0.5],
        [2, 3],
        [-3, -2.25],
      ],
      "duck"
    );
  });
  duck.scale.setScalar(1.25);
  // The curtain round it on a chrome rail hung from the ceiling, on the three open sides (gathered by the
  // wall at the back when open).
  const BATH_TRACK = [
    [X0 + 1, NICHE.z0 + 3],
    [NICHE.x1 - 4, NICHE.z0 + 3],
    [NICHE.x1 - 4, NICHE.z1 - 3],
    [X0 + 1, NICHE.z1 - 3],
  ];
  function track(points, y) {
    for (let k = 0; k + 1 < points.length; k++) {
      const [[ax, az], [bx, bz]] = [points[k], points[k + 1]];
      fill(4, [Math.min(ax, bx) - 0.25, Math.max(ax, bx) + 0.25], [y, y + 0.5], [Math.min(az, bz) - 0.25, Math.max(az, bz) + 0.25], "fitting");
    }
    for (const [x, z] of points) fill(4, [x - 0.25, x + 0.25], [y, TOP], [z - 0.25, z + 0.25], "fitting");
  }
  track(BATH_TRACK, 49);
  // A curtain of `count` pleats along `points` from `top` down to `hem`: `set(k)` draws it (0 gathered at the
  // start, 1 all the way along), the pleats folding to and fro, tighter when gathered.
  function makeCurtain(points, count, top, hem, colours) {
    const lengths = [0];
    for (let k = 1; k < points.length; k++)
      lengths.push(lengths[k - 1] + Math.hypot(points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1]));
    const total = lengths[lengths.length - 1];
    const at = (s) => {
      let k = 1;
      while (k < points.length - 1 && lengths[k] < s) k++;
      const u = (s - lengths[k - 1]) / (lengths[k] - lengths[k - 1] || 1);
      const [[ax, az], [bx, bz]] = [points[k - 1], points[k]];
      return [ax + (bx - ax) * u, az + (bz - az) * u, Math.atan2(bz - az, bx - ax)];
    };
    const height = top - hem;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, height, 0.3), new THREE.MeshLambertMaterial(), count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) mesh.setColorAt(i, c.set(colours[i % colours.length]));
    rest.add(mesh);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const curtain = { k: -1, goal: 0 };
    curtain.set = (k) => {
      if (Math.abs(k - curtain.k) < 1e-4) return;
      curtain.k = k;
      const span = 1.3 * count + (total - 1.3 * count) * k; // how far along it reaches
      const step = span / count;
      const fold = 1.15 - 0.75 * k; // how steeply the pleats turn to and fro
      for (let i = 0; i < count; i++) {
        const [x, z, dir] = at(step * (i + 0.5));
        e.set(0, -dir + (i % 2 ? 1 : -1) * fold, 0);
        q.setFromEuler(e);
        s.set(step / Math.cos(fold) + 0.2, 1, 1);
        p.set(x, W(hem + height / 2), z);
        mesh.setMatrixAt(i, m.compose(p, q, s));
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    curtain.set(0);
    return curtain;
  }
  const bathCurtain = makeCurtain(BATH_TRACK, 34, 48.75, 5, ["#fbf7ee", "#dfe8d6", "#fbf7ee", "#d3dfc8"]); // (cream and sage stripes)
  // The water in the toilet's bowl. Flushed (FLUSH s), it starts to turn, then spirals down, faster and
  // faster round a hole opening in its middle, foam streaking along the arms as it sinks, and fills again
  // still and clear; drawn afresh each frame of it.
  const FLUSH = 8;
  const SW = 24;
  const swirl = pixelTexture(SW, SW, () => {});
  swirl.tex.magFilter = swirl.tex.minFilter = THREE.LinearFilter;
  const swirlImage = swirl.g.createImageData(SW, SW);
  // `spin` how far round it has turned, `pull` 0 still .. 1 swirling hardest, `hole` the dark core's size.
  function drawBowl(spin, pull, hole) {
    const { data } = swirlImage;
    for (let y = 0; y < SW; y++)
      for (let x = 0; x < SW; x++) {
        const [u, v] = [(x + 0.5) / SW - 0.5, (y + 0.5) / SW - 0.5];
        const r = Math.hypot(u, v) * 2; // 0 in the middle, 1 at the rim
        const arm = Math.sin(3 * Math.atan2(v, u) + 11 * pull * Math.log(r + 0.08) - spin);
        const foam = Math.min(1, pull * Math.max(0, arm - 0.35) * 1.6 * (1 - r * 0.6));
        const deep = hole > 0.02 ? Math.max(0, 1 - r / hole) : 0;
        const [r0, g0, b0] = [152 + 30 * r, 212 + 14 * r, 232 + 6 * r];
        const k = 4 * (y * SW + x);
        data[k] = (r0 + (250 - r0) * foam) * (1 - 0.75 * deep);
        data[k + 1] = (g0 + (252 - g0) * foam) * (1 - 0.7 * deep);
        data[k + 2] = (b0 + (252 - b0) * foam) * (1 - 0.6 * deep);
        data[k + 3] = 255;
      }
    swirl.g.putImageData(swirlImage, 0, 0);
    swirl.tex.needsUpdate = true;
  }
  drawBowl(0, 0, 0);
  const bowlWater = new THREE.Mesh(new THREE.CircleGeometry(4.2, 20), new THREE.MeshLambertMaterial({ map: swirl.tex }));
  bowlWater.rotation.x = -Math.PI / 2;
  const BOWL = { y: W(9.6), z: (TOILET.z0 + TOILET.z1) / 2 + 1 };
  bowlWater.scale.set(1, 1.35, 1);
  bowlWater.position.set(TOILET.x, BOWL.y, BOWL.z);
  rest.add(bowlWater);
  const toilet = { flushedAt: -1e9, door: nookDoor, spin: 0 };
  toilet.flush = (t) => (toilet.flushedAt = t);
  toilet.flushing = (t) => t - toilet.flushedAt < FLUSH;
  // The bowl's water `since` s into a flush: turning, going down round its hole (sinking only a little, or the
  // bowl's sides would hide it), still again.
  function flushing(since, dt) {
    if (since > FLUSH + 0.2) return;
    const k = since / FLUSH;
    const pull = since < 0.8 ? since / 0.8 : k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.25);
    const low = k < 0.15 ? 0 : k < 0.5 ? (k - 0.15) / 0.35 : k < 0.62 ? 1 : Math.max(0, 1 - (k - 0.62) / 0.38);
    toilet.spin += dt * (2 + 10 * pull + 8 * low);
    drawBowl(toilet.spin, pull, 0.6 * low * pull);
    const s = 1 - 0.15 * low;
    bowlWater.scale.set(s, 1.35 * s, 1);
    bowlWater.position.set(TOILET.x, BOWL.y - 0.4 * low, BOWL.z - 0.2 * low);
  }
  // The towels on an oak ladder leant on the wall beside the bath: hers pink, his blue.
  const LADDER = { z0: 46, z1: 62 };
  for (const z of [LADDER.z0, LADDER.z1 - 1]) fill(4, [X0 + 1.5, X0 + 2.5], [0, 47], [z, z + 1], "woodMid");
  for (let y = 10; y <= 44; y += 6) fill(4, [X0 + 1.75, X0 + 2.5], [y, y + 0.75], [LADDER.z0, LADDER.z1], "woodLight");
  for (const [z0, z1, a, b] of [
    [LADDER.z0 + 1, LADDER.z0 + 7.5, "towelPink", "towelPinkDark"],
    [LADDER.z0 + 8.5, LADDER.z1 - 1, "towelBlue", "towelBlueDark"],
  ]) {
    fill(2, [X0 + 3, X0 + 4], [24, 45], [z0, z1], (x, y) => (y < 26 || (y > 27 && y < 28) ? b : a));
    fill(2, [X0 + 0.5, X0 + 1.5], [30, 45], [z0, z1], a);
    fill(2, [X0 + 1, X0 + 3.5], [44.5, 45.5], [z0, z1], a);
  }
  block(X0, X0 + 5, LADDER.z0, LADDER.z1);

  // Water running from a spout (thin, streaked, scrolling, narrowing as it falls).
  const streak = tiled(
    pixelTexture(2, 16, (g) => {
      for (let y = 0; y < 16; y++) {
        g.fillStyle = `rgba(225,246,255,${y % 5 < 2 ? 0.95 : 0.6})`;
        g.fillRect(0, y, 2, 1);
      }
    })
  );
  const streamMat = new THREE.MeshBasicMaterial({ map: streak.tex, transparent: true, depthWrite: false });
  const stream = (r) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.75, 1, 8, 1, true), streamMat);
    m.visible = false;
    rest.add(m);
    return m;
  };
  const sinkStreams = VANITY.basins.map(() => stream(0.35));
  // The water collecting in each basin while its tap runs (off by itself once it is nearly full: kit.js).
  const basinPools = VANITY.basins.map((bx) => {
    const pool = basinWater({ w: 9, d: 7.8, round: true, y0: W(VANITY.top + 1.1), y1: W(VANITY.top + 4.2), spout: W(30), land: [0.5, 0.18], drops });
    pool.mesh.position.set(bx, 0, BACK + 8.5);
    rest.add(pool.mesh);
    return pool;
  });
  const tubStream = stream(0.9);
  const pour = (m, x, y0, y1, z) => {
    m.visible = true;
    m.scale.y = Math.max(0.1, y0 - y1);
    m.position.set(x, W((y0 + y1) / 2), z);
  };

  // The shower, an enclosed quadrant cabin in the front corner against the tiled wall: a raised white tray, a
  // curved front of blue-tinted glass in a black frame (two fixed panels and two doors sliding round behind
  // them, chrome edges and handles), blue-grey glass behind, a black roof with a round blue light in it round
  // the rain head; a column on the back with a little screen, three dials and body jets, a hand shower on a
  // rail on the side, a white stool inside, a mat outside. It rains while `shower.running`; `cabin.goal`
  // opens the doors.
  fill(2, [X0, -110], [0, 44], [72, 74], (x, y) => (y > 43 ? "woodLight" : tiles(x, y)));
  const CABIN = { z: 74, r: 30, tray: 4, top: 48 }; // round the corner at (X0, z)
  const onArc = (r, deg) => [X0 + r * Math.cos((deg * Math.PI) / 180), CABIN.z + r * Math.sin((deg * Math.PI) / 180)];
  const inCabin = (x, z, r = CABIN.r) => x >= X0 && z >= CABIN.z && Math.hypot(x - X0, z - CABIN.z) <= r;
  fill(2, [X0, X0 + CABIN.r + 1], [0, CABIN.tray], [CABIN.z, CABIN.z + CABIN.r + 1], (x, y, z) => {
    if (!inCabin(x, z, CABIN.r + 0.5)) return null;
    const rr = Math.hypot(x - X0, z - CABIN.z);
    if (y > CABIN.tray - 0.5) return rr > CABIN.r - 1 ? "tubRim" : Math.hypot(x - X0 - 12, z - CABIN.z - 12) < 1.2 ? "fittingDark" : "porcelain";
    return y < 0.5 ? "porcelainShade" : "porcelain";
  });
  // The glass behind, on the wall and on the tiles: blue-grey, joined at the corner, the column on it.
  fill(2, [X0, X0 + 1], [CABIN.tray, CABIN.top], [CABIN.z, CABIN.z + CABIN.r], (x, y, z) =>
    Math.abs(z - CABIN.z - 15) < 0.5 ? "cabinBackDark" : "cabinBack"
  );
  fill(2, [X0, X0 + CABIN.r], [CABIN.tray, CABIN.top], [CABIN.z, CABIN.z + 1], (x) => (Math.abs(x - X0 - 15) < 0.5 ? "cabinBackDark" : "cabinBack"));
  const COL = { x: X0 + 18, w: 4 };
  fill(4, [COL.x - COL.w, COL.x + COL.w], [CABIN.tray, CABIN.top], [CABIN.z + 1, CABIN.z + 2.5], (x) =>
    Math.abs(x - COL.x) > COL.w - 0.5 ? "fitting" : "cabinColumn"
  );
  fill(4, [COL.x - 1.75, COL.x + 1.75], [34, 38.5], [CABIN.z + 2.5, CABIN.z + 2.75], "monitor");
  fill(
    4,
    [COL.x - 1.25, COL.x + 1.25],
    [35, 37.75],
    [CABIN.z + 2.75, CABIN.z + 3],
    (x, y) => ((Math.floor(x * 4) + Math.floor(y * 4)) % 3 ? "screenBlue" : null),
    grid(4, true)
  );
  for (const y of [25.5, 28.5, 31.5])
    fill(4, [COL.x - 1.25, COL.x + 1.25], [y - 1.25, y + 1.25], [CABIN.z + 2.5, CABIN.z + 3.5], (x, yy, z) =>
      Math.hypot(x - COL.x, yy - y) < 1.2 ? (z > CABIN.z + 3.25 ? "steelLite" : "fitting") : null
    );
  for (const y of [11, 15, 19])
    for (const s of [-1, 1]) fill(4, [COL.x + s * 2.5 - 0.5, COL.x + s * 2.5 + 0.5], [y, y + 1], [CABIN.z + 2.5, CABIN.z + 3], "fittingDark");
  // The hand shower on its rail on the wall side, the hose looping down from it.
  const RAIL_Z = CABIN.z + 20;
  fill(4, [X0 + 1, X0 + 1.75], [14, 42], [RAIL_Z - 0.4, RAIL_Z + 0.4], "fitting");
  fill(4, [X0 + 1, X0 + 2.5], [33, 34.5], [RAIL_Z - 0.75, RAIL_Z + 0.75], "fittingDark");
  for (let k = 0; k <= 10; k++)
    fill(
      4,
      [X0 + 2.25 + k * 0.06, X0 + 3 + k * 0.06],
      [34.5 + k * 0.55, 35.05 + k * 0.55],
      [RAIL_Z - 0.4, RAIL_Z + 0.4],
      k > 7 ? "steelLite" : "fitting"
    );
  for (let k = 0; k <= 40; k++) {
    const u = k / 40;
    const [y, z] = [lerp(33, 14, u), RAIL_Z - 2.5 * Math.sin(Math.PI * u)];
    fill(4, [X0 + 1.75, X0 + 2.25], [y, y + 0.5], [z - 0.25, z + 0.25], "steelDark");
  }
  // A white stool inside, on chrome legs.
  const [sx, sz] = onArc(18, 78);
  fill(4, [sx - 3, sx + 3], [CABIN.tray, CABIN.tray + 9], [sz - 2.5, sz + 2.5], (x, y, z) => {
    if (y > CABIN.tray + 8) return "porcelain";
    return Math.abs(Math.abs(x - sx) - 2.25) < 0.3 && Math.abs(Math.abs(z - sz) - 1.75) < 0.3 ? "fitting" : null;
  });
  // The roof: a black rim round smoked glass, a ring of blue light under it round the rain head.
  const HEAD = [...onArc(13, 45)];
  fill(2, [X0, X0 + CABIN.r + 1], [CABIN.top, CABIN.top + 1.5], [CABIN.z, CABIN.z + CABIN.r + 1], (x, y, z) =>
    inCabin(x, z, CABIN.r + 0.5) && (!inCabin(x, z, CABIN.r - 2) || x < X0 + 2 || z < CABIN.z + 2) ? "gymBlack" : null
  );
  const smoked = new THREE.Mesh(
    new THREE.CircleGeometry(CABIN.r - 1.5, 16, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: "#2f343c", transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide })
  );
  smoked.rotation.x = Math.PI / 2; // (flat, round towards +x and +z)
  smoked.position.set(X0, W(CABIN.top + 1), CABIN.z);
  smoked.renderOrder = 3;
  rest.add(smoked);
  fill(
    4,
    [HEAD[0] - 7, HEAD[0] + 7],
    [CABIN.top - 0.25, CABIN.top],
    [HEAD[1] - 7, HEAD[1] + 7],
    (x, y, z) => {
      const r = Math.hypot(x - HEAD[0], z - HEAD[1]);
      return r > 5 && r < 6.5 ? "ledBlue" : null;
    },
    grid(4, true)
  );
  fill(4, [HEAD[0] - 4, HEAD[0] + 4], [CABIN.top - 1, CABIN.top - 0.25], [HEAD[1] - 4, HEAD[1] + 4], (x, y, z) => {
    const r = Math.hypot(x - HEAD[0], z - HEAD[1]);
    return r < 3.9 ? (r < 3.2 && (Math.round(x * 2) + Math.round(z * 2)) % 3 === 0 ? "fittingDark" : "steelLite") : null;
  });
  // The curved front: the frame (black posts at its ends, black tracks along its foot and top), two fixed
  // panels at the ends and the doors in their own groups, turning round the corner to slide open.
  const glassMat = new THREE.MeshLambertMaterial({ color: "#a9cbe6", transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const arcGlass = (r, d0, d1) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, CABIN.top - CABIN.tray, 16, 1, true, Math.PI / 2 - (d1 * Math.PI) / 180, ((d1 - d0) * Math.PI) / 180),
      glassMat
    );
    m.position.y = (CABIN.tray + CABIN.top) / 2;
    m.renderOrder = 2;
    return m;
  };
  const cabinFront = new THREE.Group();
  cabinFront.position.set(X0, FLOOR, CABIN.z); // (the doors' cells and the glass in heights over the floor)
  cabinFront.add(arcGlass(CABIN.r, 0, 30), arcGlass(CABIN.r, 60, 90));
  rest.add(cabinFront);
  for (let d = 0; d <= 90; d += 1.5)
    for (const [y0, y1] of [
      [CABIN.tray, CABIN.tray + 1],
      [CABIN.top - 1, CABIN.top],
    ]) {
      const [x, z] = onArc(CABIN.r, d);
      fill(4, [x - 0.5, x + 0.5], [y0, y1], [z - 0.5, z + 0.5], "gymBlack");
    }
  for (const d of [0, 90]) {
    const [x, z] = onArc(CABIN.r, d);
    fill(4, [x - 0.75, x + 0.75], [CABIN.tray, CABIN.top], [z - 0.75, z + 0.75], "gymBlack");
  }
  // A door: curved glass over `d0..d1` at radius r, a white seal along its edge at `edge`, a long chrome
  // handle at `grip`.
  const door = (r, d0, d1, edge, grip) => {
    const g = movable(4, (box) => {
      const a = (edge * Math.PI) / 180;
      const [x, z] = [r * Math.cos(a), r * Math.sin(a)];
      box(
        [
          [x - 0.25, x + 0.25],
          [CABIN.tray + 1, CABIN.top - 1],
          [z - 0.25, z + 0.25],
        ],
        "porcelain"
      );
      const b = (grip * Math.PI) / 180;
      const [hx, hz] = [(r + 1.2) * Math.cos(b), (r + 1.2) * Math.sin(b)];
      box(
        [
          [hx - 0.25, hx + 0.25],
          [21, 31],
          [hz - 0.25, hz + 0.25],
        ],
        "steelLite"
      );
    });
    g.add(arcGlass(r, d0, d1));
    cabinFront.add(g); // (out of `rest`, into the front's group: turning round the corner)
    return g;
  };
  // Shut, they meet in the middle (45 degrees), seal to seal; they open sliding round behind the fixed panels.
  const doors = [door(CABIN.r - 1.2, 28, 45, 44.5, 42), door(CABIN.r - 1.2, 45, 62, 45.5, 48)];
  const cabin = { k: 0, goal: 0 };
  // A mat outside the doors.
  const [mx0, mz0] = onArc(CABIN.r + 6, 45);
  fill(2, [mx0 - 6, mx0 + 6], [0, 0.5], [mz0 - 4, mz0 + 4], (x, y, z) => {
    const [u, v] = [(x - mx0 + (z - mz0)) / Math.SQRT2, (z - mz0 - (x - mx0)) / Math.SQRT2];
    if (Math.abs(u) > 3.5 || Math.abs(v) > 6) return null;
    return Math.abs(Math.abs(v) - 5) < 0.6 ? "bathMatDark" : "bathMat";
  });
  // On the plan: the curved front but for the doorway (they step in through it, up onto the tray).
  for (let d = 0; d <= 90; d += 5) {
    if (d > 27 && d < 63) continue;
    const [x, z] = onArc(CABIN.r, d);
    block(x - 2, x + 2, z - 2, z + 2);
  }
  block(X0, -110, 71, 74.5);
  const SHOWER = { head: [HEAD[0], CABIN.top - 1, HEAD[1]], tray: CABIN.tray };
  const RAIN = 40;
  const rain = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 2.2, 0.2),
    new THREE.MeshBasicMaterial({ color: "#d7f1ff", transparent: true, opacity: 0.7, depthWrite: false }),
    RAIN
  );
  rain.visible = false;
  rest.add(rain);
  const shower = { running: false, cabin };

  // A slim tree in a round woven basket, the one kind of plant down here: the basket bellied, its weave
  // in two shades under a darker rim; a thin trunk kinking up out of it, a few fine branches off its top half
  // and small leaves in loose, airy sprays along them. Standing on `y0`, `size` times the usual.
  function basketTree(cx, cz, y0, size, seed) {
    const [R, H] = [4.5 * size, 8 * size];
    fill(2, [cx - R, cx + R], [y0, y0 + H], [cz - R, cz + R], (x, y, z) => {
      const h = (y - y0) / H;
      const r = Math.hypot(x - cx, z - cz);
      const rim = R * (0.84 + 0.16 * Math.sin(Math.PI * Math.min(1, h * 0.9 + 0.1)));
      if (r > rim) return null;
      if (r < rim - 1) return h > 0.85 ? "soilDark" : null;
      if (h > 0.9) return "wickerDark";
      return (Math.floor(y * 2) + Math.floor(Math.atan2(z - cz, x - cx) * R * 0.9)) % 2 ? "wicker" : "wickerLight";
    });
    const T = 30 * size;
    const trunk = (h) => [cx + Math.sin(h * 0.16 + seed) * 1.2 * size, cz + Math.sin(h * 0.11 + seed * 2) * 1.2 * size];
    for (let h = 0; h < T; h += 0.5) {
      const [x, z] = trunk(h);
      const w = 0.75 - (h / T) * 0.3;
      fill(4, [x - w, x + w], [y0 + H - 1 + h, y0 + H - 0.5 + h], [z - w, z + w], "bark");
    }
    const LEAVES = ["leafGreen", "leafDark", "leafDark", "olive", "leafLight"];
    const spray = (px, py, pz, r, k0) => {
      for (let k = 0; k < 5; k++) {
        const [dx, dy, dz] = [hash(k0, k, 81) - 0.5, hash(k0, k, 82) - 0.4, hash(k0, k, 83) - 0.5].map((v) => v * 2 * r);
        const c = LEAVES[Math.floor(hash(k0, k, 84) * LEAVES.length)];
        fill(2, [px + dx - 0.5, px + dx + 0.5], [py + dy, py + dy + 0.5], [pz + dz - 0.25, pz + dz + 0.25], c);
      }
    };
    for (let b = 0; b < 6; b++) {
      const from = T * (0.45 + 0.1 * b);
      const a = seed * 3 + b * 2.4;
      const L = (7 + 6 * hash(b, seed, 85)) * size;
      const [tx, tz] = trunk(from);
      for (let s = 0; s <= 1; s += 0.5 / L) {
        const [x, y, z] = [tx + Math.cos(a) * L * s, y0 + H + from + L * s * (0.55 + 0.3 * s), tz + Math.sin(a) * L * s];
        fill(4, [x - 0.25, x + 0.25], [y, y + 0.5], [z - 0.25, z + 0.25], "bark");
        if (s > 0.3 && Math.round(s * L) !== Math.round((s - 0.5 / L) * L)) spray(x, y, z, 1.8 * size, b * 97 + Math.round(s * L) + seed * 13);
      }
    }
    const [tx, tz] = trunk(T);
    for (let k = 0; k < 7; k++)
      spray(tx + Math.cos(k * 2.4) * 2 * size, y0 + H + T + (k % 3) * 1.5, tz + Math.sin(k * 2.4) * 2 * size, 2 * size, 500 + k + seed * 7);
    block(cx - R, cx + R, cz - R, cz + R);
  }
  basketTree(-144, TUB.z + 20, TUB.deck, 0.75, 1.3); // on the bath's deck, behind the tub

  // The fish tank in the glass, seen from both sides, planted as a nature aquarium: a cabinet under it, its
  // sides and a hood over it (its light under it) all in the glass wall's oak, the hood's top level with the
  // wall's head and the sides standing as its posts, so that the frame runs on round the tank unbroken; dark aquasoil rising towards one end under a carpet
  // of bright grass, a branching driftwood reaching up and over with moss on its arms, grey stones at its
  // foot, ribbons of eel grass swaying behind (below, `swayWeeds`), glass on both faces.
  fill(2, [TANK.x0 - 2, TANK.x1 + 2], [0, 16], [TANK.z0 - 2, TANK.z1 + 2], "woodMid");
  fill(2, [TANK.x0 - 2, TANK.x1 + 2], [TANK.y1 + 0.5, GLASS_TOP + 1.5], [TANK.z0 - 2, TANK.z1 + 2], "woodMid");
  for (const z of [TANK.z0 - 2, TANK.z1]) fill(2, [TANK.x0 - 2, TANK.x1 + 2], [16, TANK.y1 + 0.5], [z, z + 2], "woodMid");
  fill(4, [TANK.x0, TANK.x1], [TANK.y1, TANK.y1 + 0.5], [TANK.z0 + 0.5, TANK.z1 - 0.5], "tankLight", grid(4, true));
  const soilTop = (z) => TANK.y0 + 1.5 - ((z - TANK.z0) / (TANK.z1 - TANK.z0)) * 1.25; // (higher at the -z end)
  fill(4, [TANK.x0, TANK.x1], [16, TANK.y0 + 1.5], [TANK.z0, TANK.z1], (x, y, z) => {
    if (y > soilTop(z)) return null;
    return hash(Math.floor(x * 4), Math.floor(y * 4), Math.floor(z * 4)) < 0.25 ? "soilMid" : "soilDark";
  });
  // The carpet: tufts of different heights, light at their tips.
  fill(4, [TANK.x0, TANK.x1], [TANK.y0 - 0.25, TANK.y0 + 3], [TANK.z0, TANK.z1], (x, y, z) => {
    const base = soilTop(z);
    const tall = 0.5 + hash(Math.floor(x * 2), Math.floor(z * 2), 61) * 1.1;
    if (y < base || y > base + tall) return null;
    return y > base + tall - 0.3 ? "carpetLight" : "carpet";
  });
  // The driftwood: a trunk from a root at the -z end up and over, arms off it, twigs, tapering; moss here and
  // there on it.
  const branch = ([z0, y0], [z1, y1], w0, w1, x = 0) => {
    const n = Math.ceil(Math.hypot(z1 - z0, y1 - y0) * 4);
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const [z, y, w] = [lerp(z0, z1, k), lerp(y0, y1, k), lerp(w0, w1, k)];
      const xx = x + Math.sin(k * 3 + z0) * 0.6;
      fill(4, [xx - w / 2, xx + w / 2], [y - w / 2, y + w / 2], [z - w / 2, z + w / 2], (cx, cy, cz) =>
        hash(Math.floor(cx * 4), Math.floor(cy * 4), Math.floor(cz * 4)) < 0.3 ? "driftLight" : "drift"
      );
    }
  };
  const Y0 = TANK.y0 + 1;
  branch([-5, Y0], [0, Y0 + 7], 2, 1.5, -0.5);
  branch([0, Y0 + 7], [7, Y0 + 14], 1.5, 1, 0.3);
  branch([7, Y0 + 14], [18, Y0 + 19], 1, 0.5, -0.4);
  branch([0, Y0 + 7], [-4, Y0 + 15], 1, 0.5, 0.8);
  branch([-4, Y0 + 15], [-6, Y0 + 20], 0.5, 0.25, 0.4);
  branch([7, Y0 + 14], [10, Y0 + 20], 0.75, 0.25, 1);
  branch([3, Y0 + 10], [12, Y0 + 9], 0.75, 0.25, -1.2);
  branch([-5, Y0], [4, Y0 - 0.5], 1.25, 0.5, 1.2); // a root along the floor
  branch([12, Y0 + 16], [24, Y0 + 17.5], 0.5, 0.25, 0.6);
  for (const [z, y] of [
    [0, Y0 + 7.5],
    [6, Y0 + 14.5],
    [-3.5, Y0 + 13.5],
    [11, Y0 + 9.5],
    [15, Y0 + 18],
  ])
    fill(4, [-1.5, 1.5], [y - 0.5, y + 1.25], [z - 1.25, z + 1.25], (x, yy, zz) =>
      Math.hypot(x / 1.4, (yy - y - 0.2) / 0.9, (zz - z) / 1.2) < 1 && hash(Math.floor(x * 4), Math.floor(yy * 4), Math.floor(zz * 4)) < 0.75
        ? "moss"
        : null
    );
  for (const [z, x, r, h] of [
    [17, 1.2, 2.2, 2.5],
    [21, -1.4, 1.6, 1.8],
    [24.5, 1.6, 1.2, 1.2],
  ])
    fill(4, [x - r, x + r], [TANK.y0, TANK.y0 + h + 1], [z - r, z + r], (xx, y, zz) => {
      const d = Math.hypot((xx - x) / r, (zz - z) / r, (y - soilTop(z)) / h);
      return d < 1 ? (y > soilTop(z) + h * 0.55 ? "rock" : "rockDark") : null;
    });
  // Eel grass in clumps, long ribbons swaying in the current, each blade a stack of little segments (one
  // instanced mesh, moved each frame: `swayWeeds`), darker at the root, lighter towards the tip.
  const BLADES = [];
  for (const [cx, cz, tall, seed] of [
    [-2, 3.5, 17, 1],
    [1.8, 6, 13, 2],
    [-1.8, 15.5, 15, 3],
    [1.2, 17.5, 18, 4],
    [0.6, 26, 14, 5],
    [2, -6, 12, 6],
  ])
    for (let b = 0; b < 3; b++)
      BLADES.push({
        x: cx + (hash(seed, b, 86) - 0.5) * 1.4,
        z: cz + (b - 1) * 0.8,
        h: tall * (0.7 + 0.3 * hash(seed, b, 87)),
        phase: seed * 1.7 + b * 0.9,
      });
  const SEG = 0.55;
  const weedCount = BLADES.reduce((n, b) => n + Math.ceil(b.h / SEG), 0);
  const weeds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, SEG + 0.05, 0.9), new THREE.MeshLambertMaterial(), weedCount);
  {
    const c = new THREE.Color();
    let i = 0;
    for (const b of BLADES)
      for (let y = 0; y < b.h; y += SEG) weeds.setColorAt(i++, c.set(PAL[y / b.h < 0.35 ? "leafDark" : y / b.h < 0.8 ? "weed" : "weedLight"]));
  }
  rest.add(weeds);
  const weedPos = new THREE.Vector3();
  const weedTurn = new THREE.Quaternion();
  const weedEuler = new THREE.Euler();
  const weedOne = new THREE.Vector3(1, 1, 1);
  const weedM = new THREE.Matrix4();
  function swayWeeds(t) {
    let i = 0;
    for (const b of BLADES)
      for (let y = 0; y < b.h; y += SEG) {
        const u = y / b.h;
        const sway = u ** 1.6 * (1.6 * Math.sin(t * 0.9 + b.phase - y * 0.18) + 0.5 * Math.sin(t * 1.7 + b.phase * 2));
        const x = Math.max(TANK.x0 + 0.4, Math.min(TANK.x1 - 0.4, b.x + 0.4 * u * u * Math.sin(t * 0.7 + b.phase * 1.3)));
        weedPos.set(x, W(TANK.y0 + y + SEG / 2), b.z + Math.sin(y * 0.3 + b.phase) * 0.4 + sway);
        weedEuler.set(-0.35 * u * Math.cos(t * 0.9 + b.phase - y * 0.18), 0, 0);
        weeds.setMatrixAt(i++, weedM.compose(weedPos, weedTurn.setFromEuler(weedEuler), weedOne));
      }
    weeds.instanceMatrix.needsUpdate = true;
  }
  const tankGlass = new THREE.MeshLambertMaterial({ color: "#c4e6d6", transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  for (const x of [TANK.x0 - 0.05, TANK.x1 + 0.05]) sheet(tankGlass, [-TANK.z1, -TANK.z0], [W(16), W(TANK.y1)], x, "x", null).renderOrder = 3;
  block(TANK.x0 - 2, TANK.x1 + 2, TANK.z0 - 2, TANK.z1 + 2);
  // The fish: a shoal of little ember tetras, glowing orange, keeping together round the first of them (each
  // its own place in the shoal, `off`, drifting); each its body and its tail apart, the tail beating faster
  // the faster it swims.
  const EMBER = { body: (x, y) => (y > 0.6 ? "emberDark" : "ember"), fin: "emberFin" };
  const FISH = Array.from({ length: 13 }, (_, i) => ({
    ...EMBER,
    size: 0.42 + hash(i, 1, 99) * 0.1,
    follows: i ? 0 : undefined,
    off: i ? [(hash(i, 2, 99) - 0.5) * 3, (hash(i, 3, 99) - 0.5) * 6, 2 + hash(i, 4, 99) * 7] : null,
  }));
  const fish = FISH.map(({ size, body, fin, follows, off }, i) => {
    const g = movable(4, (box) => {
      box(
        [
          [-0.75, 0.75],
          [-1, 1],
          [-1.75, 1.75],
        ],
        (x, y, z) => (inEllipse(y, z, 0, 0, 1, 1.75) && Math.abs(x) < 0.75 - Math.abs(z) * 0.15 ? body(x, y, z) : null)
      );
      box(
        [
          [-0.25, 0.25],
          [0.75, 1.5],
          [-0.75, 0.75],
        ],
        (x, y, z) => (y - 0.75 < 0.75 - Math.abs(z) ? fin : null)
      );
      box(
        [
          [-0.8, 0.8],
          [0.25, 0.5],
          [0.75, 1],
        ],
        (x) => (Math.abs(x) > 0.5 ? "ink" : null)
      );
    });
    // The tail, hinged at the back of the body.
    const tail = movable(4, (box) =>
      box(
        [
          [-0.25, 0.25],
          [-1.25, 1.25],
          [-1.25, 0],
        ],
        (x, y, z) => (Math.abs(y) < (0.1 - z) * 0.9 ? fin : null)
      )
    );
    g.add(tail);
    tail.position.z = -1.5;
    g.scale.setScalar(size * 1.6);
    const start = new THREE.Vector3(0, W(TANK.y0 + 6 + (i % 5) * 2.5), TANK.z0 + 4 + (i % 7) * 4);
    g.position.copy(start);
    return { g, tail, size, follows, off, pos: start.clone(), vel: new THREE.Vector3(), target: start.clone(), next: 0, dart: false, yaw: 0, wag: i };
  });
  const bubbles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshBasicMaterial({ color: "#f2fbff", transparent: true, opacity: 0.75 }),
    8
  );
  const flakes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), new THREE.MeshLambertMaterial({ color: "#d9893f" }), 12);
  rest.add(bubbles, flakes);
  const tank = { fedAt: -1e9, scaredAt: -1e9, mid: [(TANK.x0 + TANK.x1) / 2, W((TANK.y0 + TANK.y1) / 2), (TANK.z0 + TANK.z1) / 2] };
  tank.feed = (t) => (tank.fedAt = t);

  /* ---------- the lounge ---------- */

  // A blush velvet pouf by the tank on the lounge side, for the cat to sit on and watch.
  fill(2, [POUF[0] - 6, POUF[0] + 6], [0, 10], [POUF[1] - 6, POUF[1] + 6], (x, y, z) => {
    const r = Math.hypot(x - POUF[0], z - POUF[1]);
    if (r > 5.8 - (y < 1 ? 0.6 : 0) - (y > 9 ? 0.6 : 0)) return null;
    if (y > 9 && r < 0.9) return "velvetDark";
    return (Math.atan2(z - POUF[1], x - POUF[0]) * 6) % 1 < 0.15 && y < 9 ? "velvetDark" : "velvet";
  });
  block(POUF[0] - 6, POUF[0] + 6, POUF[1] - 6, POUF[1] + 6);
  // A rug of thick cream wool under the daybed: a border, a fine line inside it, a lattice of small diamonds
  // over the middle in a deeper cream.
  const RUG = { x0: 66, x1: 142, z0: 4, z1: 84 };
  fill(2, [RUG.x0, RUG.x1], [0, 0.5], [RUG.z0, RUG.z1], (x, y, z) => {
    const e = Math.min(x - RUG.x0, RUG.x1 - x, z - RUG.z0, RUG.z1 - z);
    if (e < 2 || (e > 4 && e < 4.6)) return "woolDark";
    if (e < 7) return "wool";
    const [u, v] = [(((x - RUG.x0) % 8) + 8) % 8, (((z - RUG.z0) % 8) + 8) % 8];
    return Math.abs(Math.abs(u - 4) + Math.abs(v - 4) - 3) < 0.4 ? "woolRib" : "wool";
  });
  // Tea things, in quarter voxels: a little cup at (cx, cz) standing at y0 (on a saucer if `saucer`), tea in
  // it; a round teapot standing at P, its spout to +x, its handle opposite, a knobbed lid.
  const cup = (cx, cz, y0, saucer = false) => {
    if (saucer)
      fill(4, [cx - 1.25, cx + 1.25], [y0, y0 + 0.25], [cz - 1.25, cz + 1.25], (x, y, z) => (Math.hypot(x - cx, z - cz) < 1.2 ? "teapot" : null));
    const y1 = y0 + (saucer ? 0.25 : 0);
    fill(4, [cx - 0.75, cx + 0.75], [y1, y1 + 1.25], [cz - 0.75, cz + 0.75], (x, y, z) => {
      const r = Math.hypot(x - cx, z - cz);
      if (r > 0.75 - (y < y1 + 0.25 ? 0.25 : 0)) return null;
      return y > y1 + 1 && r < 0.5 ? "tea" : "teapot";
    });
  };
  const teapot = (P) =>
    fill(4, [P[0] - 2, P[0] + 3.5], [P[1], P[1] + 3.25], [P[2] - 1.75, P[2] + 1.75], (x, y, z) => {
      const [dx, dy, dz] = [x - P[0], y - P[1], z - P[2]];
      if (Math.hypot(dx, (dy - 1.1) * 1.15, dz) < 1.6) return dy > 2.1 && Math.hypot(dx, dz) < 0.9 ? "teapotLid" : "teapot";
      if (dy > 2.1 && dy < 2.85 && Math.hypot(dx, dz) < 0.35) return "teapotLid"; // the knob
      if (Math.abs(dz) < 0.3 && dx > 1.3 && dx < 2.9 && Math.abs(dy - 0.9 - (dx - 1.3) * 0.7) < 0.3) return "teapot"; // the spout
      if (Math.abs(dz) < 0.25 && dx < -1.2 && dx > -2.1 && Math.abs(Math.hypot(dx + 1.2, dy - 1.2) - 0.75) < 0.25) return "teapot"; // the handle
      return null;
    });
  // The daybed, long and low, facing the stairs: an oak frame on tapered legs; a deep oatmeal mattress, piped
  // round its top edge and buttoned in rows; a boucle bolster along its back with buttoned ends; cushions
  // leant on it (sage velvet, rust boucle, cream knit); a chunky cable-knit throw over its foot, hanging over
  // the front in folds with a fringe.
  const D = DAYBED;
  fill(4, [D.x0, D.x1], [0, 3.5], [D.z0, D.z1], (x, y, z) => {
    const [ex, ez] = [Math.min(x - D.x0, D.x1 - x), Math.min(z - D.z0, D.z1 - z)];
    if (y > 2) return ex < 0.25 || ez < 0.25 ? "oakDark" : "oak"; // the rails
    const leg = ex < 1.5 - y * 0.15 && ez < 1.5 - y * 0.15;
    return leg ? "oakDark" : null;
  });
  fill(2, [D.x0 + 0.5, D.x1 - 0.5], [3.5, D.seat], [D.z0 + 0.5, D.z1 - 0.5], (x, y, z) => {
    const e = Math.min(x - D.x0 - 0.5, D.x1 - 0.5 - x, z - D.z0 - 0.5, D.z1 - 0.5 - z);
    if (y > D.seat - 0.5) {
      if (e < 0.5) return "linenShade"; // the piping
      const [u, v] = [(x - D.x0 - 3) / 5, (z - D.z0 - 3) / 6];
      const button = Math.abs(u - Math.round(u)) < 0.12 && Math.abs(v - Math.round(v)) < 0.1 && u > 0.5;
      return button ? "linenDark" : "linen";
    }
    return Math.abs(y - 6.75) < 0.25 && e < 0.5 ? "linenShade" : "linen";
  });
  const BOL = { x: D.x0 + 2.75, y: D.seat + 2.25, r: 2.25 };
  fill(4, [BOL.x - BOL.r, BOL.x + BOL.r], [BOL.y - BOL.r, BOL.y + BOL.r], [D.z0 + 1, D.z1 - 1], (x, y, z) => {
    const r = Math.hypot(x - BOL.x, y - BOL.y);
    if (r > BOL.r) return null;
    if (Math.min(z - D.z0 - 1, D.z1 - 1 - z) < 0.25) return r < 0.5 ? "linenDark" : r > BOL.r - 0.3 ? "boucleShade" : "boucle"; // the ends, buttoned
    return r > BOL.r - 0.3 && y < BOL.y ? "boucleShade" : "boucle";
  });
  // A plump square cushion at zc, `size` across, stood on the mattress and leant back (LEAN from upright) so
  // that its back rests on the bolster: full in the middle, thinning to its piped edge, a dent across its top;
  // its bottom pressed flat on the mattress. Its face painted by paint(u, v, edge) (u, v -1..1 over it, v up;
  // edge: the piping).
  const LEAN = 0.42;
  const [lx, ly] = [Math.sin(LEAN), Math.cos(LEAN)]; // up the cushion (towards the back, -x)
  const pillow = (zc, size, paint) => {
    const half = size / 2;
    const foot = D.x0 + 8.9; // (where its middle meets the mattress)
    fill(4, [D.x0 + 2, D.x0 + 13], [D.seat, D.seat + size + 1], [zc - half - 0.5, zc + half + 0.5], (x, y, z) => {
      const [dx, dy] = [x - foot, y - D.seat];
      const [s, w] = [-dx * lx + dy * ly, dx * ly + dy * lx]; // up it, out of it (to the front)
      const [u, v] = [(z - zc) / half, (s - half) / half];
      const round = Math.abs(u) ** 4 + Math.abs(v) ** 4;
      if (round > 1) return null;
      const dent = v > 0.5 ? 0.9 * ((v - 0.5) / 0.5) * Math.max(0, 1 - Math.abs(u) * 2) : 0;
      const puff = 0.6 + 1.9 * (1 - round) ** 0.6 - dent;
      if (Math.abs(w) > puff) return null;
      return paint(u, v, round > 0.82);
    });
  };
  pillow(D.z0 + 9, 9.5, (u, v, edge) => (edge ? "sageDeep" : "sage"));
  pillow(D.z0 + 19, 8.5, (u, v, edge) => (edge || hash(Math.floor(u * 12), Math.floor(v * 12), 7) < 0.2 ? "rustShade" : "rust"));
  pillow(D.z1 - 21, 9, (u, v, edge) => (edge ? "knitShade" : Math.abs(Math.sin(u * 7 + Math.sin(v * 9) * 0.8)) < 0.3 ? "knitShade" : "knit"));
  const THROW = { z0: D.z1 - 13, z1: D.z1 - 1 };
  fill(4, [D.x0 + 2, D.x1 + 0.75], [D.seat - 6.5, D.seat + 1], [THROW.z0, THROW.z1], (x, y, z) => {
    const fold = 0.45 * Math.sin((z - THROW.z0) * 0.9); // (it sags between the folds)
    const cable = Math.abs(Math.sin((z - THROW.z0) * 1.4 + Math.sin((x + y) * 1.3) * 0.9)) < 0.3;
    const knit = cable ? "knitShade" : "knit";
    if (x < D.x1 - 0.5) return y > D.seat && y < D.seat + 0.75 + fold * 0.5 ? knit : null; // over the top
    if (y > D.seat + 0.75 || x > D.x1 + 0.25 + Math.max(0, fold)) return null; // down the front
    if (y < D.seat - 6) return Math.floor(z * 4) % 2 ? "knitShade" : null; // the fringe
    return knit;
  });
  block(D.x0, D.x1, D.z0, D.z1);
  // Its side table: a round marble top with a brass edge on a turned walnut stem and foot; two bottles of
  // Evian on it.
  const SIDE_TABLE = [D.x0 + 9, D.z1 + 8];
  const [STX, STZ] = SIDE_TABLE;
  fill(4, [STX - 5.5, STX + 5.5], [0, 13], [STZ - 5.5, STZ + 5.5], (x, y, z) => {
    const r = Math.hypot(x - STX, z - STZ);
    if (y > 12) {
      if (r > 5.5) return null;
      if (r > 5.2) return "brass";
      return Math.abs(Math.sin((x - STX) * 0.6 + Math.sin(z * 0.9) * 1.4)) < 0.07 ? "stoneShade" : "stone";
    }
    if (y < 1) return r < 3.5 - y * 0.8 ? "walnut" : null; // the foot
    const stem = 0.8 + 0.35 * Math.max(0, Math.sin((y - 1) * 0.75)) + (y > 10.5 ? (y - 10.5) * 1.2 : 0);
    return r < stem ? (Math.floor(y * 2) % 3 ? "walnut" : "walnutDark") : null;
  });
  // A bottle of Evian with its sports cap, standing at (bx, bz) on y0: clear plastic, a little waisted, its
  // shoulders sloping in to the neck; round its middle the white label, a pink band along its foot, the red
  // name on its front (to the room) under the three blue peaks; the red cap, its spout on top. Into the part
  // `into`, if given (a bottle of its own, to be turned about), else with the rest.
  const evian = (bx, bz, y0, into) =>
    fill(
      4,
      [bx - 1, bx + 1],
      [y0, y0 + 5.5],
      [bz - 1, bz + 1],
      (x, y, z) => {
        const [dx, dz, h] = [x - bx, z - bz, y - y0];
        const r = Math.hypot(dx, dz);
        if (h > 4.5) return r < 0.25 && h < 5.25 ? "evianCapTop" : null; // the spout
        if (h > 4) return r < 0.5 ? "evianCap" : null;
        const R = h < 3.25 ? 0.85 - (Math.abs(h - 1.25) < 0.3 ? 0.1 : 0) : 0.85 - (h - 3.25) * 0.65; // (waist, shoulders)
        if (r > R) return null;
        if (h < 1.75 || h > 3) return h < 0.25 ? "evianShade" : "evianGlass";
        const a = Math.atan2(dx, dz) - VIEW_YAW; // round from its front
        const front = Math.cos(a) > 0.55;
        if (h < 2) return "evianPink"; // the band
        if (front && h < 2.5) return Math.floor((a + 1) * 9) % 3 ? "evianRed" : "white"; // the name
        if (front && h > 2.5 && h < 2.75) return Math.abs(Math.sin(a * 9)) > 0.5 ? "evianBlue" : "white"; // the peaks
        return "white";
      },
      into
    );
  evian(STX - 1.5, STZ + 0.5, 13);
  evian(STX + 1.75, STZ - 1.5, 13);
  block(STX - 5.5, STX + 5.5, STZ - 5.5, STZ + 5.5);
  // A tripod floor lamp at the head of the daybed: three splayed oak legs, a brass collar where they meet, a
  // brass stem up to the bulb, and over it a tall linen drum shade open at the top and the bottom (a brass
  // spider across its top), so that the light falls in a wide pool all round and the linen glows warm. Its
  // light: below (`loungeLight`). Its frame casts no shadow of its own (a real bulb is big and soft: the shadows
  // of the legs and the stem right under it are faint, not the hard spokes a point of light would throw).
  const LAMP = { x: 103, z: 16, feet: 5.5, hub: 25, bulb: 29.5, shade: [27.5, 40], r: 7 };
  const framePart = part();
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3 + 0.4;
    const [fx, fz] = [LAMP.x + LAMP.feet * Math.cos(a), LAMP.z + LAMP.feet * Math.sin(a)];
    for (let s = 0; s <= 1.08; s += 0.02) {
      const [x, y, z] = [lerp(fx, LAMP.x, s), LAMP.hub * s, lerp(fz, LAMP.z, s)];
      fill(4, [x - 0.375, x + 0.375], [y, y + 0.5], [z - 0.375, z + 0.375], s < 0.03 ? "oakDark" : "oak", framePart);
    }
  }
  const round = (r, paint) => (x, y, z) => (Math.hypot(x - LAMP.x, z - LAMP.z) < r ? paint : null);
  fill(4, [LAMP.x - 1, LAMP.x + 1], [LAMP.hub - 1.25, LAMP.hub + 0.5], [LAMP.z - 1, LAMP.z + 1], round(1, "brass"), framePart);
  fill(4, [LAMP.x - 0.25, LAMP.x + 0.25], [LAMP.hub, LAMP.bulb - 1.5], [LAMP.z - 0.25, LAMP.z + 0.25], "brass", framePart);
  fill(4, [LAMP.x - 0.75, LAMP.x + 0.75], [LAMP.bulb - 2, LAMP.bulb - 0.75], [LAMP.z - 0.75, LAMP.z + 0.75], round(0.75, "brassDark"), framePart);
  // The spider: a ring round the shade's top, three spokes in to a finial, a rod down to the bulb.
  const TOPY = LAMP.shade[1] - 0.25;
  fill(
    4,
    [LAMP.x - LAMP.r, LAMP.x + LAMP.r],
    [TOPY, TOPY + 0.25],
    [LAMP.z - LAMP.r, LAMP.z + LAMP.r],
    (x, y, z) => {
      const [dx, dz] = [x - LAMP.x, z - LAMP.z];
      const r = Math.hypot(dx, dz);
      if (r > LAMP.r - 0.4) return null;
      if (r > LAMP.r - 0.7) return "brass";
      const spoke = (b) => Math.abs(dx * Math.sin(b) - dz * Math.cos(b)) < 0.2 && dx * Math.cos(b) + dz * Math.sin(b) > 0;
      return [0, 1, 2].some((k) => spoke(0.4 + (k * 2 * Math.PI) / 3)) ? "brass" : null;
    },
    framePart
  );
  fill(4, [LAMP.x - 0.25, LAMP.x + 0.25], [LAMP.bulb + 1, TOPY + 0.75], [LAMP.z - 0.25, LAMP.z + 0.25], "brassDark", framePart);
  // The shade and the bulb, of their own (they glow as the lamp comes on, and cast no shadow of their own).
  const shadeMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffc27a, emissiveIntensity: 0 });
  const bulbMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const shadePart = part();
  fill(
    4,
    [LAMP.x - LAMP.r, LAMP.x + LAMP.r],
    [LAMP.shade[0], LAMP.shade[1]],
    [LAMP.z - LAMP.r, LAMP.z + LAMP.r],
    (x, y, z) => {
      const r = Math.hypot(x - LAMP.x, z - LAMP.z);
      if (r > LAMP.r || r < LAMP.r - 0.4) return null;
      return y < LAMP.shade[0] + 0.5 || y > LAMP.shade[1] - 0.5 ? "linenShade" : "linen"; // (bound at its edges)
    },
    shadePart
  );
  const bulbPart = part();
  fill(
    4,
    [LAMP.x - 1.25, LAMP.x + 1.25],
    [LAMP.bulb - 0.75, LAMP.bulb + 1.75],
    [LAMP.z - 1.25, LAMP.z + 1.25],
    (x, y, z) => (Math.hypot(x - LAMP.x, (y - LAMP.bulb - 0.5) * 0.9, z - LAMP.z) < 1.25 ? "sconce" : null),
    bulbPart
  );
  rest.add(meshOf(framePart, 4), meshOf(shadePart, 4, shadeMat), meshOf(bulbPart, 4, bulbMat));
  block(LAMP.x - LAMP.feet, LAMP.x + LAMP.feet, LAMP.z - LAMP.feet, LAMP.z + LAMP.feet);
  // The console behind the daybed, in oak: a top with a rounded edge, two drawers with brass knobs, a shelf
  // low down; on top, books stacked with a brass trinket on them, a framed photo, a sage jug of pampas
  // plumes, a candle in a brass stick; on the shelf a woven basket and books lying flat.
  const CONSOLE = { x0: D.x0 - 12, x1: D.x0 - 5, z0: D.z0 + 12, z1: D.z1 };
  const C = CONSOLE;
  const CX = (C.x0 + C.x1) / 2;
  fill(4, [C.x0, C.x1], [0, 16], [C.z0, C.z1], (x, y, z) => {
    const [ex, ez] = [Math.min(x - C.x0, C.x1 - x), Math.min(z - C.z0, C.z1 - z)];
    if (y > 14.5) return y > 15.75 && (ex < 0.25 || ez < 0.25) ? null : y > 15.5 ? "oakLight" : "oak"; // the top, its edge rounded
    if (y > 11) {
      if (ex < 0.5 && ez > 1)
        return Math.abs(z - (C.z0 + C.z1) / 2) < 0.25 || y < 11.25
          ? "oakDark"
          : Math.abs(y - 12.75) < 0.25 && Math.abs(Math.abs(z - (C.z0 + C.z1) / 2) - (C.z1 - C.z0) / 4) < 0.4
            ? "brass"
            : "oak";
      return ex < 0.5 || ez < 1 ? "oak" : null;
    }
    if (ex < 1 && ez < 1) return "oakDark"; // the legs
    if (y > 4.5 && y < 5.5 && ex > 0.25 && ez > 0.25) return "oak"; // the shelf
    return null;
  });
  // On the shelf: a woven basket, and books stood up beside it.
  fill(4, [C.x0 + 1, C.x1 - 1], [5.5, 9], [C.z0 + 3, C.z0 + 10], (x, y, z) =>
    (Math.floor(y * 4) + Math.floor(x * 2)) % 2 ? "wicker" : "wickerDark"
  );
  for (const [z, c, h] of [
    [C.z0 + 13, "book1", 3.5],
    [C.z0 + 14.25, "book2", 3],
    [C.z0 + 15.5, "book3", 4],
  ])
    fill(4, [C.x0 + 1.5, C.x1 - 1.5], [5.5, 5.5 + h], [z, z + 1], (x, y) => (Math.abs(y - 5.5 - h + 0.75) < 0.13 ? "gold" : c));
  for (const [k, c, w] of [
    [0, "book2", 5],
    [1, "book1", 4.5],
    [2, "book3", 4],
  ])
    fill(4, [CX - 2.5, CX + 2.5], [16 + k * 0.75, 16.75 + k * 0.75], [C.z0 + 4, C.z0 + 4 + w], (x, y, z) => (z > C.z0 + 3.75 + w ? "porcelain" : c));
  fill(4, [CX - 0.75, CX + 0.75], [18.25, 19.25], [C.z0 + 5.25, C.z0 + 6.75], (x, y, z) =>
    Math.hypot(x - CX, z - C.z0 - 6) < 0.75 ? "brass" : null
  );
  fill(4, [CX - 0.5, CX + 0.25], [16, 21], [C.z0 + 12, C.z0 + 16], (x, y, z) => {
    if (x < CX - 0.25) return null;
    return y < 16.5 || y > 20.5 || z < C.z0 + 12.5 || z > C.z0 + 15.5 ? "walnut" : y > 18 ? "skyPhoto" : "meadowPhoto";
  });
  const JUG = [CX, C.z1 - 12];
  fill(4, [JUG[0] - 2.5, JUG[0] + 2.5], [16, 24], [JUG[1] - 2.5, JUG[1] + 2.5], (x, y, z) => {
    const r = Math.hypot(x - JUG[0], z - JUG[1]);
    const R = y < 21 ? 1.6 + Math.sin(((y - 16) / 5) * Math.PI) * 0.8 : 1.3 - (y - 21) * 0.15;
    return r < R && (r > R - 0.4 || y < 16.5) ? (Math.floor(y * 2) % 4 ? "sageCab" : "sageCabDark") : null;
  });
  for (let k = 0; k < 7; k++) {
    const a = k * 2.4;
    const [tx, tz, ty] = [JUG[0] + Math.sin(a) * 3.5, JUG[1] + Math.cos(a) * 3, 31 + (k % 3) * 2];
    for (let s = 0; s <= 1; s += 0.05) {
      const [x, y, z] = [lerp(JUG[0], tx, s), lerp(23, ty, s), lerp(JUG[1], tz, s)];
      fill(4, [x - 0.125, x + 0.125], [y, y + 0.25], [z - 0.125, z + 0.125], "pampasStem");
    }
    fill(4, [tx - 1, tx + 1], [ty - 1, ty + 4.5], [tz - 1, tz + 1], (x, y, z) =>
      Math.hypot((x - tx) / 0.9, (y - ty - 1.75) / 2.75, (z - tz) / 0.9) < 1 && hash(Math.floor(x * 4), Math.floor(y * 4), Math.floor(z * 4)) < 0.7
        ? hash(Math.floor(x * 4), Math.floor(y * 4), 3) < 0.5
          ? "pampas"
          : "pampasLight"
        : null
    );
  }
  const STICK = [CX, C.z1 - 4];
  fill(4, [STICK[0] - 1, STICK[0] + 1], [16, 22], [STICK[1] - 1, STICK[1] + 1], (x, y, z) => {
    const r = Math.hypot(x - STICK[0], z - STICK[1]);
    if (y < 16.5) return r < 1 ? "brass" : null;
    if (y < 18) return r < 0.35 ? "brass" : null;
    if (y < 18.5) return r < 0.7 ? "brass" : null;
    return r < 0.45 ? "candle" : null;
  });
  fill(4, [STICK[0] - 0.125, STICK[0] + 0.125], [22, 22.75], [STICK[1] - 0.125, STICK[1] + 0.125], "flameGlow", grid(4, true));
  block(C.x0, C.x1, C.z0, C.z1);
  // The tea corner, a low oak tea table on a tatami-woven rug: a thick top round a pale stone panel, solid
  // end boards each with a round lattice window, a long walnut tray of little cups along the top, a teapot
  // and cups on a square tray at one end, a sprig in a celadon vase at the other; a floor chair either side
  // (a bamboo frame, a slatted back leant back, cream cushions).
  const TEA = [42, 78];
  const TT = { x0: 26, x1: 58, z0: 70, z1: 86, top: 8 };
  const RUG2 = { x0: 18, x1: 66, z0: 56, z1: 99 };
  fill(2, [RUG2.x0, RUG2.x1], [0, 0.5], [RUG2.z0, RUG2.z1], (x, y, z) => {
    const e = Math.min(x - RUG2.x0, RUG2.x1 - x, z - RUG2.z0, RUG2.z1 - z);
    if (e < 1.5) return "tatamiEdge";
    if (Math.abs(((x - RUG2.x0 - 1.5) % 15) - 7.5) > 7.2) return "tatamiSeam"; // (the mats' joins)
    return Math.floor(z) % 2 ? "tatami" : "tatamiB";
  });
  // The end boards (a round window of lattice through each), the top with its stone panel and a fine groove
  // round it, an apron under it along both sides.
  const [TZ, TY] = [(TT.z0 + TT.z1) / 2, 3.6];
  for (const x0 of [TT.x0 + 1, TT.x1 - 3])
    fill(4, [x0, x0 + 2], [0, TT.top - 1.5], [TT.z0 + 0.5, TT.z1 - 0.5], (x, y, z) => {
      const r = Math.hypot(z - TZ, y - TY);
      if (r < 2.2) return Math.abs(((z - TZ + 10) % 1.1) - 0.55) > 0.42 || Math.abs(((y - TY + 10) % 1.1) - 0.55) > 0.42 ? "oakDark" : null;
      if (r < 2.7) return "oakDark";
      return z < TT.z0 + 0.75 || z > TT.z1 - 0.75 ? "oakDark" : "oak";
    });
  fill(4, [TT.x0, TT.x1], [TT.top - 1.5, TT.top], [TT.z0, TT.z1], (x, y, z) => {
    const e = Math.min(x - TT.x0, TT.x1 - x, z - TT.z0, TT.z1 - z);
    if (y < TT.top - 1.25) return "oakDark";
    if (y < TT.top - 0.25 || e < 2) return e < 0.25 ? "oakDark" : "oak";
    if (e < 2.25) return "oakDark";
    const vein = Math.abs(Math.sin((x - TT.x0) * 0.45 + Math.sin(z * 0.7) * 1.6)) < 0.08;
    return vein || hash(Math.floor(x * 4), Math.floor(z * 4), 81) < 0.06 ? "stoneShade" : "stone";
  });
  for (const z of [TT.z0 + 1, TT.z1 - 1.5]) fill(4, [TT.x0 + 3, TT.x1 - 3], [TT.top - 3, TT.top - 1.5], [z, z + 0.5], "oakDark");
  block(TT.x0, TT.x1, TT.z0, TT.z1);
  // On the top: the long tray (walnut, slatted) with five little cups along it; the square one with the
  // teapot (a round body, its spout, handle and knobbed lid) and three cups; the vase with its sprig.
  const onTop = TT.top;
  fill(4, [31, 47], [onTop, onTop + 0.75], [75.5, 80.5], (x, y, z) => {
    const e = Math.min(x - 31, 47 - x, z - 75.5, 80.5 - z);
    if (e < 0.25) return "walnutDark";
    return y < onTop + 0.5 ? (Math.floor((z - 75.5) * 4) % 3 === 0 ? "walnutDark" : "walnut") : null;
  });
  for (const x of [33, 35.5, 38, 40.5, 43]) cup(x, 78, onTop + 0.5);
  fill(4, [48.5, 55.5], [onTop, onTop + 0.5], [73.5, 80.5], (x, y, z) =>
    Math.min(x - 48.5, 55.5 - x, z - 73.5, 80.5 - z) < 0.25 ? "walnutDark" : "walnut"
  );
  teapot([51.5, onTop + 0.5, 77]);
  for (const [x, z] of [
    [54.25, 74.75],
    [54.25, 79.25],
    [49.75, 79.25],
  ])
    cup(x, z, onTop + 0.5);
  fill(4, [28.25, 29.75], [onTop, onTop + 3], [72.25, 73.75], (x, y, z) =>
    Math.hypot(x - 29, z - 73) < 0.75 - (y > onTop + 2.25 ? 0.3 : 0) ? "zelligeC" : null
  );
  for (let k = 0; k < 7; k++) {
    const [lx, ly, lz] = [29 + Math.sin(k * 2.3) * 0.9, onTop + 3.25 + k * 0.6, 73 + Math.cos(k * 2.3) * 0.9];
    fill(4, [lx - 0.375, lx + 0.375], [ly, ly + 0.5], [lz - 0.375, lz + 0.375], k % 2 ? "leafLight" : "leafGreen");
  }
  fill(4, [28.875, 29.125], [onTop + 3, onTop + 6.5], [72.875, 73.125], "printStem");
  // A floor chair either side: low bamboo frame, a thick cream seat cushion, a back of upright slats leant
  // back under a top rail, a cushion leant on it. `f`: which way it faces (+1 towards +z).
  function floorChair(cx, cz, f) {
    const zBack = (y) => cz - f * (4.25 + (y - 1.25) * 0.32);
    fill(
      4,
      [cx - 5, cx + 5],
      [0, 9.5],
      [cz - 8.5, cz + 5.5].map((v) => (f > 0 ? v : 2 * cz - v)).sort((p, q) => p - q),
      (x, y, z) => {
        const [u, w] = [x - cx, (z - cz) * f]; // across, and forward from the middle
        if (y < 1.25) return Math.abs(u) > 4.25 || w > 4.25 || w < -4.25 ? (y < 0.5 ? "bambooDark" : "bamboo") : null;
        if (y < 3.25 && Math.abs(u) < 4.5 && w > -4.5 && w < 4.5) {
          const corner = Math.max(Math.abs(u) - 3.75, 0) ** 2 + Math.max(Math.abs(w) - 3.75, 0) ** 2 > 0.6;
          if (corner && y > 2.75) return null;
          return Math.abs(u) > 4.25 || Math.abs(w) > 4.25 ? "linenShade" : "cushionWhite";
        }
        const zb = zBack(y);
        if (Math.abs(z - zb) < 0.3 && y < 9.25) {
          if (y > 8.5 || Math.abs(u) > 4.5) return "bambooDark";
          return Math.abs(((u + 10) % 1.25) - 0.62) < 0.25 ? "bamboo" : null;
        }
        const zc = zb + f * 1.1; // the back cushion, leant on the slats
        if (Math.abs(z - zc) < 0.75 && y > 3.25 && y < 7.75 && Math.abs(u) < 4 - Math.max(0, y - 7) * 1.5)
          return Math.abs(z - zc) > 0.5 ? "linenShade" : "cushionWhite";
        return null;
      }
    );
    block(cx - 5, cx + 5, Math.min(cz - 8.5 * f, cz + 5.5 * f), Math.max(cz - 8.5 * f, cz + 5.5 * f));
  }
  floorChair(48, TT.z0 - 6, 1);
  floorChair(35, TT.z1 + 6, -1);
  // A tree in its basket in the back corner by the fish tank (clear of the arched doorway), and another under
  // the living room beside the stairs.
  basketTree(22, -10, 0, 1, 0.4);
  basketTree(163, 40, 0, 1.1, 2.2);

  /* ---------- the gym ---------- */

  // The mirror across the back wall in an oak frame (its glass shows the room: mirror.js, given `gymGlass`).
  fill(4, [MIRROR.x0 - 0.5, MIRROR.x1 + 0.5], [MIRROR.y0 - 0.5, MIRROR.y1 + 0.5], [BACK, BACK + 0.5], (x, y) =>
    x < MIRROR.x0 || x > MIRROR.x1 || y < MIRROR.y0 || y > MIRROR.y1 ? "woodMid" : null
  );
  const gymGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(MIRROR.x1 - MIRROR.x0, MIRROR.y1 - MIRROR.y0),
    new THREE.MeshBasicMaterial({ color: COLORS.mirror })
  );
  gymGlass.position.set((MIRROR.x0 + MIRROR.x1) / 2, W((MIRROR.y0 + MIRROR.y1) / 2), BACK + 0.35);
  rest.add(gymGlass);
  // An oak cubby in the back left corner (as the towel tower: shelves()): rolled white towels, bottles of
  // water, yoga blocks at the foot, two folded towels on top and a towel on a chrome hook on its side.
  const CUBBY = { x0: SPLIT.x + 3, x1: SPLIT.x + 13, z0: BACK, z1: BACK + 9 };
  shelves(CUBBY, 30, [10.5, 20.5]);
  [
    [CUBBY.x0 + 2.6, 22.45],
    [CUBBY.x0 + 5, 22.45],
    [CUBBY.x0 + 7.4, 22.45],
    [CUBBY.x0 + 3.8, 24.55],
    [CUBBY.x0 + 6.2, 24.55],
  ].forEach(([cx, cy]) => rolled(cx, cy, 1.2, CUBBY, "towelWhite"));
  // Bottles of Evian on the middle shelf, set out afresh each time the house is built: three to five, each
  // standing where there is room and turned its own way, and now and then one more lying along the front.
  const SHELF_Y = 11.25;
  const [bx0, bx1, bz0, bz1] = [CUBBY.x0 + 2, CUBBY.x1 - 2, BACK + 2.25, BACK + 6.5];
  const lying = Math.random() < 0.35;
  const stood = [];
  for (let tries = 0, n = 3 + Math.floor(Math.random() * 3); stood.length < n && tries < 60; tries++) {
    const [x, z] = [bx0 + Math.random() * (bx1 - bx0), bz0 + Math.random() * ((lying ? bz1 - 2 : bz1) - bz0)];
    if (stood.every(([sx, sz]) => Math.hypot(x - sx, z - sz) > 2.1)) stood.push([x, z]);
  }
  const bottle = () => {
    const p = part();
    evian(0, 0, 0, p);
    const g = new THREE.Group();
    g.add(meshOf(p, 4, solidMaterial, [0, 0, 0]));
    rest.add(g);
    return g;
  };
  for (const [x, z] of stood) {
    const b = bottle();
    b.position.set(x, W(SHELF_Y), z);
    b.rotation.y = Math.random() * Math.PI * 2;
  }
  if (lying) {
    const b = bottle();
    const s = Math.random() < 0.5 ? 1 : -1; // (its cap to the left or the right)
    b.position.set((CUBBY.x0 + CUBBY.x1) / 2 - s * 2.75, W(SHELF_Y + 0.85), BACK + 7.25);
    b.rotation.set(0, Math.random() * Math.PI * 2, -s * (Math.PI / 2), "ZXY"); // (rolled round its own length, then laid down)
  }
  for (const [y0, c] of [
    [2.75, "dbLilac"],
    [6.25, "dbMint"],
  ])
    fill(4, [CUBBY.x0 + 1.5, CUBBY.x1 - 1.5], [y0, y0 + 3.5], [BACK + 2, BACK + 8], (x, y, z) => {
      const [ex, ey] = [Math.min(x - CUBBY.x0 - 1.5, CUBBY.x1 - 1.75 - x), Math.min(y - y0, y0 + 3.25 - y)];
      return ex < 0.25 && ey < 0.25 && z > BACK + 7.5 ? null : ey < 0.25 ? "porcelainShade" : c; // (rounded edges, a line between)
    });
  folded(CUBBY.x0 + 2, CUBBY.x1 - 2.5, 30.75, { z0: BACK + 1.5, z1: BACK + 7 }, ["towelWhite", "towelBlue"]);
  fill(4, [CUBBY.x1, CUBBY.x1 + 0.75], [26, 27], [BACK + 7, BACK + 7.75], "fitting"); // (the hook)
  fill(2, [CUBBY.x1, CUBBY.x1 + 1.5], [10, 26], [BACK + 6, BACK + 8.5], (x, y) =>
    y > 24.5 ? "towelBlue" : Math.abs(y - 13) < 0.5 ? "towelBlueDark" : y < 11 ? "towelBlueDark" : "towelBlue"
  );
  block(SPLIT.x, SPLIT.x + 15, BACK, BACK + 9);
  // The strength corner under the mirror: a three-tier rack of round black dumbbells, the lightest on the top
  // tier at the back, the heaviest at the front along the bottom, each lying across its tier on two rails
  // (front and back of its heads), in a silver frame of square tube leaning back at the front.
  const TIERS = [
    { y: 2.5, z: BACK + 9, r: [2.4, 2.45, 2.5, 2.55, 2.6] },
    { y: 8.5, z: BACK + 6.5, r: [2.15, 2.2, 2.25, 2.3, 2.35] },
    { y: 14, z: BACK + 4.5, r: [1.85, 1.85, 1.95, 1.95, 2.05, 2.05] },
  ];
  const [IN0, IN1] = [RACK.x0 + 1.25, RACK.x1 - 1.25]; // between the frame's ends
  const slots = ({ r }) => {
    const big = Math.max(...r);
    const gap = (IN1 - IN0 - 2 * big * r.length) / (r.length + 1);
    return r.map((_, k) => IN0 + gap + big + k * (2 * big + gap));
  };
  // A dumbbell lying front to back: the handle (knurled chrome) between two round rubber heads, each end
  // with a white ring of lettering (a red mark at its start), a plate with the weight in the middle, a steel
  // cap; `box` as movable()'s. Each lies turned its own way round its handle (`roll`, any way round, picked
  // afresh each time the page loads), so their lettering and plates are never lined up.
  const dumbbell = (box, [cx, cy, cz], r, roll = Math.random() * Math.PI * 2) =>
    box(
      [
        [cx - r, cx + r],
        [cy - r, cy + r],
        [cz - 3, cz + 3],
      ],
      (x, y, z) => {
        const [ox, oy, dz] = [x - cx, y - cy, Math.abs(z - cz)];
        const [dx, dy] = [ox * Math.cos(roll) + oy * Math.sin(roll), oy * Math.cos(roll) - ox * Math.sin(roll)];
        const d = Math.hypot(dx, dy);
        if (dz < 1.25) return d < 0.5 ? (Math.floor(z * 4) % 2 ? "chromeBar" : "gymSteel") : null;
        if (d > r - (dz > 2.75 ? 0.2 : 0)) return null;
        if (dz < 2.75) return d > r - 0.3 ? "gymGrey" : "gymBlack";
        if (Math.abs(dx) < 0.42 * r && Math.abs(dy) < 0.2 * r) return "dbLabel";
        if (d < 0.18 * r) return "gymSteel";
        const a = Math.atan2(dy, dx);
        if (Math.abs(d - 0.7 * r) < 0.09 * r + 0.06) {
          if (Math.abs(a - 2.6) < 0.14) return "gymRed";
          return Math.abs(Math.sin(a)) > 0.45 && Math.floor(a * 7 * (r / 2)) % 3 ? "dbLabel" : "gymBlack";
        }
        return d > r - 0.3 ? "gymGrey" : "gymBlack";
      }
    );
  const fixed4 = (box, paint) => fill(4, ...box, paint);
  const steel = (y, top) => (y > top - 0.25 ? "silverGleam" : y < top - 0.75 ? "gymSteel" : "silver");
  // The frame: at each end a front post leaning back and an upright back one on a foot rail, a side bar under
  // each tier; along it, the tiers' rails and a rail at the foot, front and back.
  const frontZ = (y) => BACK + 12.5 - y * 0.22;
  const backZ = (y) => BACK + 1.5 + y * 0.04;
  for (const x0 of [RACK.x0, RACK.x1 - 1.25])
    fill(4, [x0, x0 + 1.25], [0, TIERS[2].y], [BACK + 1, BACK + 13.25], (x, y, z) => {
      if (y < 0.75) return y < 0.25 && (z < BACK + 2 || z > BACK + 12.5) ? "gymBlack" : steel(y, 0.75);
      if (Math.abs(z - frontZ(y) - 0.5) < 0.6 || Math.abs(z - backZ(y) - 0.5) < 0.6) return x - x0 < 0.25 ? "gymSteel" : "silver";
      for (const t of TIERS) if (y > t.y - 0.75 && y < t.y && z > backZ(y) && z < frontZ(y)) return steel(y, t.y);
      return null;
    });
  for (const t of TIERS) {
    const big = Math.max(...t.r);
    for (const z of [t.z - 2.1, t.z + 2.1]) fill(4, [RACK.x0, RACK.x1], [t.y - 0.75, t.y], [z - 0.4, z + 0.4], (x, y) => steel(y, t.y));
    slots(t).forEach((x, k) => {
      if (t === TIERS[2] && k < 2) return; // (the pair that is taken: below)
      dumbbell(fixed4, [x, t.y + t.r[k], t.z], t.r[k]);
    });
  }
  for (const z of [BACK + 1.25, BACK + 12.25]) fill(4, [RACK.x0, RACK.x1], [0, 0.75], [z, z + 1], (x, y) => steel(y, 0.75));
  // The pair taken off the top tier, at its left end (a group of its own: hidden while in use).
  const top = TIERS[2];
  const [pairA, pairB] = slots(top);
  const DB_AT = [(pairA + pairB) / 2, top.y + top.r[0], top.z];
  const pair = movable(4, (box) => {
    for (const x of [pairA, pairB]) dumbbell(box, [x - DB_AT[0], 0, 0], top.r[0]);
  });
  pair.position.set(DB_AT[0], W(DB_AT[1]), DB_AT[2]);
  const dumbbells = {
    held: false,
    at: [DB_AT[0], W(DB_AT[1]), DB_AT[2]],
    take: () => ((dumbbells.held = true), (pair.visible = false)),
    put: () => ((dumbbells.held = false), (pair.visible = true)),
  };
  block(RACK.x0, RACK.x1, BACK, BACK + 13.5);
  for (const [x, c] of [
    [RACK.x0 - 4, "gymBlack"],
    [RACK.x1 + 4, "gymBlack"],
  ])
    fill(2, [x - 2.5, x + 2.5], [0, 7], [BACK + 3, BACK + 8], (xx, y, z) => {
      if (y < 4.5) return Math.hypot(xx - x, z - BACK - 5.5, (y - 2.25) * 1.1) < 2.6 ? c : null;
      return Math.abs(Math.hypot(xx - x, y - 4.8) - 1.6) < 0.45 && Math.abs(z - BACK - 5.5) < 0.5 ? "silver" : null;
    });
  block(RACK.x0 - 7, RACK.x1 + 7, BACK, BACK + 9);
  // A rod from a to b (`w` across) in cells 1/n across: a frame's tubes.
  const rod = (n, [ax, ay, az], [bx, by, bz], w, c) => {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) * n);
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      const [x, y, z] = [ax + (bx - ax) * k, ay + (by - ay) * k, az + (bz - az) * k];
      fill(n, [x - w / 2, x + w / 2], [y - w / 2, y + w / 2], [z - w / 2, z + w / 2], c);
    }
  };
  // The lat pulldown tower by the mirror, side on (black, red trim): two posts on a long base, a beam out from
  // their tops over the seat with a pulley at its end, the weight carriage on its guides between the posts
  // (rising as the bar comes down), the seat facing the posts with the knee rollers before it, the bar on
  // its cable.
  const { x: LX, z: LZ, posts: PX } = LAT;
  for (const z of [LZ - 9, LZ + 9]) {
    fill(2, [LX - 6, PX + 2], [0, 1.5], [z - 1, z + 1], "gymBlack"); // the base
    fill(4, [LX - 6.5, LX - 5.5], [0, 1.75], [z - 1.25, z + 1.25], "gymRed"); // (its end caps)
    fill(2, [PX, PX + 2], [1.5, LAT.top], [z - 1, z + 1], "gymBlack"); // the posts
  }
  fill(2, [PX, PX + 2], [0, 1.5], [LZ - 9, LZ + 9], "gymBlack");
  fill(2, [PX, PX + 2], [LAT.top - 2, LAT.top], [LZ - 10, LZ + 10], "gymBlack");
  fill(2, [LX - 1, PX], [LAT.top - 2, LAT.top], [LZ - 1, LZ + 1], "gymBlack"); // the beam
  for (const x of [PX + 1, LX + 1])
    fill(4, [x - 1.5, x + 1.5], [LAT.top - 4.5, LAT.top - 1.5], [LZ - 0.5, LZ + 0.5], (xx, y) =>
      Math.hypot(y - LAT.top + 3, xx - x) < 1.4 ? "gymSteel" : null
    );
  for (const z of [LZ - 4, LZ + 4]) fill(4, [PX + 0.75, PX + 1.25], [1.5, LAT.top - 2], [z - 0.25, z + 0.25], "gymSteel"); // the guides
  fill(4, [PX + 2, PX + 2.25], [LAT.top - 1.5, LAT.top - 0.5], [LZ - 2, LZ + 2], "gymRed"); // (the maker's badge)
  fill(2, [LX - 1, LX + 1], [0, 10], [LZ - 1, LZ + 1], "gymBlack"); // the seat on its post, its pad
  fill(2, [LX - 5, LX + 4], [10, 12], [LZ - 4, LZ + 4], (x, y) => (y > 11.5 ? "saddle" : "gymBlack"));
  fill(2, [LX + 5.5, LX + 7], [10, 18], [LZ - 0.75, LZ + 0.75], "gymBlack"); // the knee rollers on their post
  fill(2, [LX + 4.5, LX + 8.5], [16.5, 20], [LZ - 6, LZ + 6], (x, y, z) =>
    Math.abs(z - LZ) < 1 ? "gymBlack" : Math.hypot(y - 18.25, x - LX - 6.5) < 1.7 ? "saddle" : null
  );
  fill(2, [LX + 5.5, LX + 7], [0, 1.5], [LZ - 9, LZ + 9], "gymBlack"); // (a foot across under them)
  const stack = movable(2, (box) =>
    box(
      [
        [-0.5, 2.5],
        [0, 7],
        [-3.5, 3.5],
      ],
      (x, y) => (y > 6.5 ? "gymRed" : Math.floor(y) % 2 ? "gymBlack" : "gymGrey")
    )
  );
  const latBar = movable(4, (box) => {
    box(
      [
        [-0.4, 0.4],
        [-0.4, 0.4],
        [-8, 8],
      ],
      (x, y, z) => (Math.abs(z) > 4.5 ? "saddle" : "gymSteel")
    );
    for (const s of [-1, 1])
      box(
        [
          [-0.4, 0.4],
          [-1.6, 0.4],
          [Math.min(s * 8, s * 10), Math.max(s * 8, s * 10)],
        ],
        (x, y, z) => (Math.abs(y + (Math.abs(z) - 8) * 0.8) < 0.45 ? "saddle" : null)
      );
    box(
      [
        [-0.5, 0.5],
        [0, 1.5],
        [-0.5, 0.5],
      ],
      "gymSteel"
    );
  });
  const cable = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshLambertMaterial({ color: "#1e1e21" }));
  rest.add(cable);
  const lat = { k: 0 };
  // `k`: 0 the bar up, 1 pulled down to the chest.
  lat.set = (k) => {
    lat.k = k;
    const y = W(lerp(LAT.rest, LAT.pull, k));
    latBar.position.set(LX + 1, y, LZ);
    stack.position.set(PX - 2.5, W(1.5 + 9 * k), LZ);
    const top = W(LAT.top - 4.5);
    cable.position.set(LX + 1, (y + 1.5 + top) / 2, LZ);
    cable.scale.y = top - y - 1.5;
  };
  lat.set(0);
  block(LX - 6, PX + 2, LZ - 10, LZ + 10);
  // On the wall: a clock in an oak rim.
  const CLOCK = [8, 40];
  fill(2, [CLOCK[0] - 4.5, CLOCK[0] + 4.5], [CLOCK[1] - 4.5, CLOCK[1] + 4.5], [BACK, BACK + 1], (x, y) => {
    const r = Math.hypot(x - CLOCK[0], y - CLOCK[1]);
    if (r > 4.3) return null;
    if (r > 3.7) return "woodMid";
    const a = Math.atan2(y - CLOCK[1], x - CLOCK[0]);
    return r > 3 && Math.abs(((((a / (Math.PI / 6)) % 1) + 1) % 1) - 0.5) > 0.42 ? "black" : "clockFace";
  });
  const hand = (len, w) => {
    const g = new THREE.BoxGeometry(w, len, 0.2);
    g.translate(0, len / 2 - 0.4, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: "#26272b" }));
    m.position.set(CLOCK[0], W(CLOCK[1]), BACK + 1.15);
    rest.add(m);
    return m;
  };
  const hands = [hand(2.4, 0.55), hand(3.4, 0.35)];
  // A tall speaker in the corner.
  fill(2, [140, 148], [0, 26], [BACK + 1, BACK + 8], (x, y, z) => {
    if (z > BACK + 7.5)
      for (const [cy, r] of [
        [7, 2.6],
        [15, 1.8],
        [21.5, 1],
      ])
        if (Math.hypot(x - 144, y - cy) < r) return Math.hypot(x - 144, y - cy) < r * 0.45 ? "black" : "speakerCone";
    return y > 25.5 ? "woodMid" : "black";
  });
  block(139, 150, BACK, BACK + 9);
  // The punching bag on a chain from its stand: blush leather, black bands, a white heart; it swings when hit.
  // The stand: a black steel post behind it on a T of feet weighted with a plate at each end, a braced arm
  // reaching out over the bag.
  const POST = { x: BAG.x, z: BAG.z - 12, arm: 47 };
  fill(4, [POST.x - 0.75, POST.x + 0.75], [0, POST.arm + 1], [POST.z - 0.75, POST.z + 0.75], "gymBlack");
  fill(4, [POST.x - 0.5, POST.x + 0.5], [POST.arm, POST.arm + 1], [POST.z, BAG.z + 1], "gymBlack");
  for (let k = 0; k <= 12; k++) {
    const z = POST.z + 0.5 + k * 0.5; // (the brace: from the post up to the arm)
    fill(4, [POST.x - 0.25, POST.x + 0.25], [POST.arm - 6.5 + k * 0.5, POST.arm - 6 + k * 0.5], [z - 0.25, z + 0.25], "gymBlack");
  }
  fill(4, [POST.x - 8, POST.x + 8], [0, 1], [POST.z - 0.75, POST.z + 0.75], "gymBlack");
  fill(4, [POST.x - 0.75, POST.x + 0.75], [0, 1], [POST.z - 6, BAG.z + 5], "gymBlack");
  for (const s of [-1, 1])
    fill(4, [POST.x + s * 7 - 0.75, POST.x + s * 7 + 0.75], [0, 5], [POST.z - 2.5, POST.z + 2.5], (x, y, z) => {
      const r = Math.hypot(y - 2.5, z - POST.z);
      return r < 2.5 ? (r < 0.6 ? "fitting" : "black") : null;
    });
  block(POST.x - 8.5, POST.x + 8.5, POST.z - 6, POST.z + 3);
  fill(4, [BAG.x - 0.25, BAG.x + 0.25], [44, POST.arm], [BAG.z - 0.25, BAG.z + 0.25], "black");
  const bag = movable(2, (box) => {
    box(
      [
        [-4.5, 4.5],
        [-30, -2],
        [-4.5, 4.5],
      ],
      (x, y, z) => {
        const r = Math.hypot(x, z);
        if (r > 4.4 - (y < -29 || y > -3 ? 0.6 : 0)) return null;
        if (y > -5 || y < -27) return "black";
        const [u, v] = [(Math.atan2(x, z) - VIEW_YAW) * 4, (y + 16) / 2.2];
        return Math.abs(u) < 2 && (u * u + v * v - 1) ** 3 - u * u * v * v * v < 0 && r > 4 ? "porcelain" : "dbPink";
      }
    );
    box(
      [
        [-0.5, 0.5],
        [-2, 0],
        [-0.5, 0.5],
      ],
      "fitting"
    );
  });
  bag.position.set(BAG.x, W(44), BAG.z);
  const punch = { at: -1e9, dir: 0 };
  punch.hit = (t, dir = 0) => Object.assign(punch, { at: t, dir });
  block(BAG.x - 6, BAG.x + 6, BAG.z - 6, BAG.z + 6);
  // The mat strip: a sage mat, cork blocks and a foam roller at its end.
  const MAT = { x0: 30, x1: 90, z0: -76, z1: -64 };
  fill(2, [MAT.x0, MAT.x1], [0, 0.5], [MAT.z0, MAT.z1], (x, y, z) =>
    x < MAT.x0 + 1 || x > MAT.x1 - 1 || z < MAT.z0 + 1 || z > MAT.z1 - 1 ? "matDark" : "mat"
  );
  for (const z of [MAT.z0 + 1, MAT.z0 + 6]) fill(2, [MAT.x1 + 2, MAT.x1 + 6], [0, 2.5], [z, z + 3.5], "cork");
  fill(2, [MAT.x1 + 8, MAT.x1 + 12], [0, 4], [MAT.z0 + 1, MAT.z1 - 1], (x, y) => (Math.hypot(x - MAT.x1 - 10, y - 2) < 2 ? "foam" : null));
  // Along the glass, facing the room: the treadmill, the spin bike, the rower.
  // The treadmill, a slim folding one: a charcoal deck, the belt running between grey side rails, the motor
  // hood at the front rising to it with an orange line, two slim uprights leaning back to short grips (a
  // button on each) and a console bar with a tablet rest, lit while it runs.
  const M = MILL;
  const millMid = (M.x0 + M.x1) / 2;
  fill(2, [M.x0, M.x1], [0.5, M.deck], [M.z0, M.z1 - 7], (x, y) =>
    x < M.x0 + 1.5 || x > M.x1 - 1.5 ? (y > M.deck - 0.5 ? "gymSteel" : "gymGrey") : y < M.deck - 1 ? "gymBlack" : null
  );
  fill(2, [M.x0, M.x1], [0, M.deck + 0.5], [M.z0 - 1, M.z0], "gymGrey");
  for (const x of [M.x0 + 1, M.x1 - 2]) fill(2, [x, x + 1], [0, 0.5], [M.z0, M.z0 + 2], "gymBlack");
  fill(2, [M.x0, M.x1], [0, 10], [M.z1 - 7, M.z1], (x, y, z) => {
    const top = M.deck + 1 + (z - M.z1 + 7) * 0.45;
    if (y > top) return null;
    return y > top - 0.5 ? (Math.abs(x - millMid) < 4 && z > M.z1 - 3.5 && z < M.z1 - 2.5 ? "gymOrange" : "gymGrey") : "gymBlack";
  });
  const upright = (y) => M.z1 - 3 - (y - 7) * 0.2; // (leaning back towards the runner)
  for (const x of [M.x0 + 0.5, M.x1 - 1.5]) {
    for (let y = 6; y < 34; y += 0.5) fill(2, [x, x + 1], [y, y + 0.5], [upright(y) - 0.75, upright(y) + 0.75], "gymGrey");
    fill(2, [x, x + 1], [32, 33.5], [upright(33) - 7, upright(33)], "gymBlack");
    fill(4, [x, x + 1], [33.5, 33.75], [upright(33) - 2.5, upright(33) - 1.5], "gymOrange");
  }
  fill(2, [M.x0 + 0.5, M.x1 - 0.5], [33, 35], [upright(34) - 1, upright(34) + 1], "gymBlack");
  fill(2, [millMid - 5, millMid + 5], [35, 41], [upright(38), upright(38) + 1], "gymBlack"); // the tablet rest
  const belt = tiled(
    pixelTexture(4, 16, (g) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 4; x++) texel(g, x, y, y % 8 === 0 ? "#45474c" : hash(x, y, 52) < 0.2 ? "#26272a" : "#2e2f33");
    })
  );
  belt.tex.repeat.set(1, 3);
  sheet(lit(belt.tex), [M.x0 + 1.5, M.x1 - 1.5], [M.z0, M.z1 - 7], W(M.deck) - 0.45, "y", null);
  const screen = pixelTexture(24, 12, () => {});
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.25), new THREE.MeshBasicMaterial({ map: screen.tex }));
  screenMesh.position.set(millMid, W(38.25), upright(38) - 0.1);
  screenMesh.rotation.set(0, Math.PI, 0); // facing the runner
  rest.add(screenMesh);
  const ledOff = new THREE.Color("#3b3d43");
  const ledOn = new THREE.Color("#ffa45a");
  const consoleLed = new THREE.Mesh(new THREE.PlaneGeometry(M.x1 - M.x0 - 4, 0.5), new THREE.MeshBasicMaterial({ color: ledOff }));
  consoleLed.position.set(millMid, W(34), upright(34) - 1.05);
  consoleLed.rotation.y = Math.PI;
  rest.add(consoleLed);
  function drawScreen(t, on) {
    const g = screen.g;
    g.fillStyle = on ? "#141a20" : "#101214";
    g.fillRect(0, 0, 24, 12);
    consoleLed.material.color.copy(on ? ledOn : ledOff);
    if (on) {
      g.fillStyle = "#f2f2f2";
      for (let x = 0; x < 24; x++) {
        const beat = ((x + Math.floor(t * 8)) % 12) - 6;
        g.fillRect(x, beat === 0 ? 1 : beat === 1 ? 6 : beat === -1 ? 3 : 4, 1, 1);
      }
      const done = Math.floor(((t * 0.4) % 1) * 21);
      g.fillStyle = "#ffa45a";
      g.fillRect(1, 9, 1 + done, 2);
      g.fillStyle = "#3a3d42";
      g.fillRect(2 + done, 9, 22, 2);
    }
    screen.tex.needsUpdate = true;
  }
  drawScreen(0, false);
  block(M.x0 - 1, M.x1 + 1, M.z0 - 1, M.z1);
  const treadmill = { speed: 0, on: false, left: false, idle: 0 }; // (left on by a visitor, its belt `idle` speed)

  // The spin bike, black with red trim: a foot across at either end (red caps), a beam between, the frame
  // rising from it in a broad black body over the flywheel with a red flash, the seat post (a red knob on it)
  // up to the saddle, the stem up to bull-horn bars with a little screen, and the flywheel at the front, a red
  // ring round it, turning with the pedals (`bike.speed`).
  const BK = BIKE;
  for (const z of [BK.z0, BK.z1 - 2]) fill(2, [BK.x - 6, BK.x + 6], [0, 1.5], [z, z + 2], (x) => (Math.abs(x - BK.x) > 5 ? "gymRed" : "gymBlack"));
  fill(2, [BK.x - 0.75, BK.x + 0.75], [0, 1.5], [BK.z0, BK.z1], "gymBlack");
  rod(2, [BK.x, 1.5, BK.z0 + 4], [BK.x, 8.5, BK.z0 + 12], 2, "gymBlack");
  fill(2, [BK.x - 1.5, BK.x + 1.5], [6.5, 10.5], [BK.z0 + 11, BK.z0 + 15], "gymBlack"); // round the crank
  rod(2, [BK.x, 9, BK.z0 + 10], [BK.x, BK.seat - 1, BK.z0 + 6.5], 1.5, "gymBlack"); // the seat post
  fill(4, [BK.x + 0.75, BK.x + 1.75], [13.5, 15], [BK.z0 + 7.5, BK.z0 + 9], "gymRed");
  fill(2, [BK.x - 2.5, BK.x + 2.5], [BK.seat - 1, BK.seat + 0.5], [BK.z0 + 3.5, BK.z0 + 10], (x, y, z) =>
    Math.abs(x - BK.x) < 2.5 - Math.max(0, z - BK.z0 - 6) * 0.45 ? "saddle" : null
  );
  fill(2, [BK.x - 1.25, BK.x + 1.25], [8, 16], [BK.z0 + 12, BK.z1 - 4], (x, y, z) => {
    const u = z - BK.z0 - 12;
    if (y > 10.5 + u * 0.45) return null;
    return Math.abs(y - 9.5 - u * 0.5) < 0.6 && u > 2 && u < 7 ? "gymRed" : "gymBlack";
  });
  rod(2, [BK.x, 13, BK.z1 - 8], [BK.x, 24, BK.z1 - 9], 1.5, "gymBlack"); // the stem
  fill(2, [BK.x - 4, BK.x + 4], [24, 25], [BK.z1 - 9.5, BK.z1 - 8.5], "gymBlack");
  for (const sx of [-1, 1]) rod(2, [BK.x + sx * 4, 24.5, BK.z1 - 9], [BK.x + sx * 3, 28, BK.z1 - 4], 1, "saddle");
  fill(4, [BK.x - 1.5, BK.x + 1.5], [25, 27.5], [BK.z1 - 8.5, BK.z1 - 8], "monitor");
  const flywheel = movable(4, (box) =>
    box(
      [
        [-0.6, 0.6],
        [-5.5, 5.5],
        [-5.5, 5.5],
      ],
      (x, y, z) => {
        const r = Math.hypot(y, z);
        return r < 5.4 ? (r > 4.6 ? "gymRed" : r < 0.9 ? "gymSteel" : Math.abs(y) < 0.45 && z > 0 ? "gymRed" : "gymBlack") : null;
      }
    )
  );
  flywheel.position.set(BK.x, W(7), BK.z1 - 4.5);
  // The crank: the axle across, an arm out each side opposite the other, a pedal on each.
  const crank = movable(4, (box) => {
    box(
      [
        [-2.5, 2.5],
        [-0.5, 0.5],
        [-0.5, 0.5],
      ],
      "gymSteel"
    );
    for (const sx of [-1, 1]) {
      box([[Math.min(sx * 2.5, sx * 3.25), Math.max(sx * 2.5, sx * 3.25)], sx > 0 ? [-0.4, 3.4] : [-3.4, 0.4], [-0.4, 0.4]], "gymBlack");
      box([[Math.min(sx * 3.25, sx * 5), Math.max(sx * 3.25, sx * 5)], sx > 0 ? [2.6, 3.4] : [-3.4, -2.6], [-1.2, 1.2]], "gymRed");
    }
  });
  crank.position.set(BK.x, W(8.5), BK.z0 + 13);
  const bike = { speed: 0, at: BIKE, crank, tried: 0 };
  block(BK.x - 6, BK.x + 6, BK.z0, BK.z1);

  // The rower, magnetic: a rear foot, a long rail on it, the seat sliding along; at the front the big black
  // flywheel housing (its vented cover turning as it is pulled, a red badge), the foot plates angled before
  // it with red straps, a monitor on an arm, the handle on its strap.
  const R = ROWER;
  fill(2, [R.x0, R.x0 + 4], [0, 1.5], [R.z - 5, R.z + 5], "gymBlack");
  fill(2, [R.x0 + 1, R.x0 + 3], [1.5, 4], [R.z - 1, R.z + 1], "gymBlack");
  fill(2, [R.x0 + 2, 95], [4, 6], [R.z - 1.5, R.z + 1.5], (x, y) => (y > 5.5 ? "gymSteel" : "gymGrey"));
  fill(2, [99, R.x1], [0, 1.5], [R.z - 6, R.z + 6], "gymBlack");
  rod(2, [95, 5, R.z], [101, 1.5, R.z], 2, "gymBlack");
  const HUB = [101, 11];
  fill(2, [HUB[0] - 9, HUB[0] + 9], [HUB[1] - 9, HUB[1] + 9], [R.z - 2.5, R.z + 2.5], (x, y, z) => {
    const r = Math.hypot(x - HUB[0], y - HUB[1]);
    if (r > 8.6) return null;
    if (r > 7.9) return "gymGrey";
    return Math.hypot(x - HUB[0] - 3, y - HUB[1] + 5) < 0.8 && z > R.z ? "gymRed" : "gymBlack";
  });
  for (const sz of [-1, 1]) {
    for (let y = 5; y < 11; y += 0.5)
      fill(
        2,
        [92 - (y - 5) * 0.35, 93.5 - (y - 5) * 0.35],
        [y, y + 0.5],
        [R.z + sz * 1.5 - (sz < 0 ? 3.5 : 0), R.z + sz * 1.5 + (sz > 0 ? 3.5 : 0)],
        "gymBlack"
      );
    fill(4, [89.5, 92], [8, 9], [R.z + sz * 1.5 - (sz < 0 ? 3.5 : 0), R.z + sz * 1.5 + (sz > 0 ? 3.5 : 0)], "gymRed");
  }
  rod(2, [98, 19, R.z], [94, 26, R.z], 1, "gymBlack"); // the monitor's arm, the monitor
  fill(2, [93, 94], [25, 30], [R.z - 3, R.z + 3], (x, y, z) =>
    x < 93.5 && Math.abs(z - R.z) < 2.5 && y > 25.5 && y < 29.5 ? "monitor" : "gymBlack"
  );
  const rowFan = movable(4, (box) =>
    box(
      [
        [-6.5, 6.5],
        [-6.5, 6.5],
        [0, 0.5],
      ],
      (x, y) => {
        const r = Math.hypot(x, y);
        if (r > 6.4) return null;
        return r < 1.2 ? "gymSteel" : Math.sin(Math.atan2(y, x) * 6) > 0.55 ? "gymGrey" : "gymBlack";
      }
    )
  );
  rowFan.position.set(HUB[0], W(HUB[1]), R.z + 2.5);
  const seat = movable(2, (box) =>
    box(
      [
        [-3, 3],
        [0, 3],
        [-3.5, 3.5],
      ],
      (x, y, z) => (y > 2.5 ? "saddle" : y < 1 && Math.abs(z) < 2 ? "gymSteel" : "gymBlack")
    )
  );
  const handle = movable(4, (box) =>
    box(
      [
        [-0.5, 0.5],
        [-0.5, 0.5],
        [-5, 5],
      ],
      (x, y, z) => (Math.abs(z) > 2.5 ? "saddle" : "gymSteel")
    )
  );
  const strap = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.8), new THREE.MeshLambertMaterial({ color: "#1e1e21" }));
  rest.add(strap);
  const rower = { k: 0, churn: 0 };
  rower.seatAt = (k) => [lerp(R.catchX, R.finishX, k), W(R.seat), R.z];
  rower.handleAt = (k) => [lerp(93, R.finishX + 6, k), W(lerp(12, 15, k)), R.z];
  // `k`: 0 at the catch (forward, knees bent, arms out), 1 at the finish (legs straight, handle at the chest).
  rower.set = (k) => {
    rower.churn = Math.max(rower.churn, Math.abs(k - rower.k) * 20);
    rower.k = k;
    const [sx, sy, sz] = rower.seatAt(k);
    seat.position.set(sx, sy - 3, sz);
    const [hx, hy, hz] = rower.handleAt(k);
    handle.position.set(hx, hy, hz);
    const [ax, ay] = [94, W(12)];
    strap.position.set((hx + ax) / 2, (hy + ay) / 2, hz);
    strap.scale.x = Math.hypot(ax - hx, hy - ay);
    strap.rotation.z = Math.atan2(hy - ay, hx - ax);
  };
  rower.set(0);
  block(R.x0, R.x1, R.z - 6, R.z + 6);
  // Oak wall bars on the back wall past the bag.
  const BARS = { x0: 164, x1: 192 };
  for (const x of [BARS.x0, BARS.x1 - 2]) fill(2, [x, x + 2], [0, 46], [BACK, BACK + 3], "woodMid");
  for (let y = 4; y < 46; y += 4)
    fill(4, [BARS.x0 + 2, BARS.x1 - 2], [y, y + 1], [BACK + 1, BACK + 2], (x, yy, z) => (Math.abs(z - BACK - 1.5) < 0.5 ? "woodLight" : null));
  block(BARS.x0, BARS.x1, BACK, BACK + 4);

  /* ---------- lights ---------- */

  // An invisible box over a thing a visitor can click (`clickables`): what the ray finds.
  const hitMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true });
  function hitBox([x0, x1], [y0, y1], [z0, z1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), hitMat);
    m.position.set((x0 + x1) / 2, W((y0 + y1) / 2), (z0 + z1) / 2);
    rest.add(m);
    return m;
  }
  // A light switched on or off fading up or down over `secs` (`k` 0..1, run on by `step(dt)`), `show(e)` setting
  // all that goes with it at the eased level `e`; its shadows drawn again as it comes on (`dirty`: room.js).
  function fader(secs, show) {
    const f = {
      on: false,
      k: 0,
      dirty: false,
      set(on) {
        if (on && !f.on) f.dirty = true;
        f.on = on;
      },
      step(dt) {
        const k = Math.min(1, Math.max(0, f.k + (f.on ? dt : -dt) / secs));
        if (k === f.k) return;
        f.k = k;
        show(k * k * (3 - 2 * k));
      },
    };
    show(0);
    return f;
  }
  // The floor lamp's light, from its bulb: out of the open bottom of the shade a wide spot, as wide as the
  // shade's rim lets it (past that the linen is in the way), falling off with distance, with the shadows of
  // the daybed, the console, the lamp's own legs and all; and the softer light through the linen and out of
  // the top, all round. On at night (house.js dress()), and as a visitor switches it, warming up and dying
  // down in a moment as a bulb does.
  const RIM = Math.atan(LAMP.r / (LAMP.bulb - LAMP.shade[0]));
  const lampSpot = new THREE.SpotLight(0xffd6a0, 0, 400, RIM, 0.55, 0.5); // (falling off slowly: it reaches right across the room)
  lampSpot.position.set(LAMP.x, W(LAMP.bulb), LAMP.z);
  lampSpot.target.position.set(LAMP.x, FLOOR, LAMP.z);
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(1024, 1024);
  lampSpot.shadow.camera.near = 1;
  lampSpot.shadow.bias = -0.0005;
  lampSpot.shadow.normalBias = 0.3;
  const lampGlow = new THREE.PointLight(0xffc98a, 0, 400, 0.5);
  lampGlow.position.set(LAMP.x, W(LAMP.bulb + 3), LAMP.z);
  group.add(lampSpot, lampSpot.target, lampGlow);
  const loungeLight = fader(0.35, (e) => {
    lampSpot.intensity = 11.5 * e; // (half as much again as the room's own light 30 below it, half of that 120 off)
    lampGlow.intensity = 3.3 * e;
    shadeMat.emissiveIntensity = 0.75 * e;
    bulbMat.color.setScalar(0.45 + 0.55 * e);
  });
  // Two spotlights clamped onto the bath curtain's track (BATH_TRACK), one on its side and one on its front,
  // each a white can with a chrome rim angled down at the water, throwing a narrow cone of warm light in
  // aslant, its beam just seen in the steamy air; lit, its lens glows and a soft halo shows round it.
  // Switched together, at the switch on the wall by the bath (or on either can), and on at night.
  const shaft = pixelTexture(1, 32, (g) => {
    for (let y = 0; y < 32; y++) {
      const v = (y + 0.5) / 32;
      const k = Math.sin(Math.PI * v) ** 0.8 * (0.45 + 0.55 * v);
      g.fillStyle = `rgb(${Math.round(255 * k)},${Math.round(220 * k)},${Math.round(170 * k)})`;
      g.fillRect(0, y, 1, 1);
    }
  });
  shaft.tex.magFilter = shaft.tex.minFilter = THREE.LinearFilter;
  const shaftMat = new THREE.MeshBasicMaterial({
    map: shaft.tex,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const haloMat = new THREE.MeshBasicMaterial({
    map: blob.tex,
    color: "#ffd9a0",
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const RAIL_Y = 49; // (the track's height: track() above)
  const CAN = { h: 3.5, r: 1.75 }; // how long, how wide
  const SPOT_ANGLE = 0.42;
  // The can along +y from its lens (at 0) to its back, and the lens (lit: its own mesh).
  const canPart = part();
  const lensPart = part();
  fill(
    4,
    [-CAN.r, CAN.r],
    [0, CAN.h],
    [-CAN.r, CAN.r],
    (x, y, z) => {
      const r = Math.hypot(x, z);
      if (r > CAN.r || (y < 0.25 && r < CAN.r - 0.5)) return null;
      if (y < 0.75) return "fitting"; // the rim
      return y > CAN.h - 0.5 && r < 0.75 ? "fitting" : r > CAN.r - 0.3 && y < 1.25 ? "porcelainShade" : "porcelain";
    },
    canPart
  );
  fill(4, [-CAN.r, CAN.r], [0, 0.25], [-CAN.r, CAN.r], (x, y, z) => (Math.hypot(x, z) < CAN.r - 0.5 ? "sconce" : null), lensPart);
  const UP = new THREE.Vector3(0, 1, 0);
  const downlights = [
    [
      [NICHE.x1 - 4, -4],
      [TUB.x + 5, TUB.z - 4],
    ],
    [
      [TUB.x + 6, NICHE.z1 - 3],
      [TUB.x - 3, TUB.z + 5],
    ],
  ].map(([[x, z], [tx, tz]]) => {
    // A clamp on the track; the can hanging from it, its back at the clamp, pointing at (tx, tz) on the water.
    fill(4, [x - 0.5, x + 0.5], [RAIL_Y - 1.25, RAIL_Y + 0.75], [z - 0.5, z + 0.5], "fitting");
    const aim = new THREE.Vector3(tx, W(TUB.level), tz);
    const back = new THREE.Vector3(x, W(RAIL_Y - 1.25), z);
    const dir = aim.clone().sub(back).normalize();
    const lens = back.clone().addScaledVector(dir, CAN.h);
    const can = new THREE.Group();
    const lit = meshOf(lensPart, 4, glowing, [0, 0, 0]);
    can.add(meshOf(canPart, 4, solidMaterial, [0, 0, 0]), lit);
    can.position.copy(lens);
    const backwards = dir.clone().negate();
    can.quaternion.setFromUnitVectors(UP, backwards); // (its +y back up the way it points)
    rest.add(can);
    const spot = new THREE.SpotLight(0xffe0b0, 0, 110, SPOT_ANGLE, 0.55, 1);
    spot.position.copy(lens);
    spot.target.position.copy(aim);
    group.add(spot, spot.target);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), haloMat);
    halo.position.copy(lens);
    halo.rotation.set(-PITCH, VIEW_YAW, 0, "YXZ"); // square on to the camera
    halo.renderOrder = 5;
    rest.add(halo);
    const h = lens.distanceTo(aim);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(h * Math.tan(SPOT_ANGLE) * 0.8, h, 20, 1, true), shaftMat);
    beam.position.copy(lens).lerp(aim, 0.5);
    beam.quaternion.setFromUnitVectors(UP, backwards); // (its tip at the lens)
    beam.renderOrder = 5;
    rest.add(beam);
    return { spot, beam, halo, lit, can };
  });
  const SWITCH = { z: NICHE.z0 - 4, y: 22 };
  fill(4, [X0, X0 + 0.5], [SWITCH.y, SWITCH.y + 3], [SWITCH.z - 1, SWITCH.z + 1], "porcelain");
  fill(4, [X0 + 0.5, X0 + 0.75], [SWITCH.y + 1, SWITCH.y + 2], [SWITCH.z - 0.25, SWITCH.z + 0.25], "brass");
  const bathLights = {
    on: false,
    set(on) {
      for (const d of downlights) {
        d.spot.intensity = on ? 30 : 0;
        d.beam.visible = d.halo.visible = d.lit.visible = on;
      }
      this.on = on;
    },
  };
  // Over the gym's mirror, four black barn lights on gooseneck arms from the wall, each throwing a cone of
  // light down past the mirror and out over the floor in front of it, with the shadows of what stands there;
  // lit, its bulb glows in the mouth of the shade. A sensor switches them on as anyone comes in, fading up,
  // and off a little while after the gym is empty, fading down. A visitor may switch them by clicking one:
  // switched off with someone in, they stay off till the gym is empty; switched on, on till switched off.
  const SCONCE = { y: 50.75, out: 4.5, tilt: 0.3, r: 3, depth: 2.5 };
  const domePart = part();
  fill(
    4,
    [-SCONCE.r, SCONCE.r],
    [-SCONCE.depth, 0.75],
    [-SCONCE.r, SCONCE.r],
    (x, y, z) => {
      if (y > 0) return Math.hypot(x, z) < 0.5 ? "gymBlack" : null; // the neck
      const outer = (x * x + z * z) / SCONCE.r ** 2 + ((y + SCONCE.depth) / SCONCE.depth) ** 2;
      const inner = (x * x + z * z) / (SCONCE.r - 0.35) ** 2 + ((y + SCONCE.depth) / (SCONCE.depth - 0.35)) ** 2;
      return outer <= 1 && inner > 1 ? "gymBlack" : null;
    },
    domePart
  );
  const bulbInPart = part();
  fill(4, [-1, 1], [-1.5, -0.5], [-1, 1], (x, y, z) => (Math.hypot(x, y + 1, z) < 1 ? "sconce" : null), bulbInPart);
  const sconceBulbMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const DOWN = new THREE.Vector3(0, -1, 0);
  const sconces = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const x = 75 + k * 29;
    // The round plate on the wall, the arm out from it and curving down to the shade.
    fill(4, [x - 1, x + 1], [SCONCE.y - 1, SCONCE.y + 1], [BACK, BACK + 0.5], (xx, y) => (Math.hypot(xx - x, y - SCONCE.y) < 1 ? "gymBlack" : null));
    const bend = 1.75;
    fill(4, [x - 0.25, x + 0.25], [SCONCE.y - 0.25, SCONCE.y + 0.25], [BACK + 0.5, BACK + SCONCE.out - bend], "gymBlack");
    for (let a = 0; a <= Math.PI / 2; a += 0.08) {
      const [y, z] = [SCONCE.y - bend + bend * Math.cos(a), BACK + SCONCE.out - bend + bend * Math.sin(a)];
      fill(4, [x - 0.25, x + 0.25], [y - 0.25, y + 0.25], [z - 0.25, z + 0.25], "gymBlack");
    }
    const shade = new THREE.Group();
    shade.add(meshOf(domePart, 4, solidMaterial, [0, 0, 0]), meshOf(bulbInPart, 4, sconceBulbMat, [0, 0, 0]));
    shade.position.set(x, W(SCONCE.y - bend - 0.75), BACK + SCONCE.out);
    shade.rotation.x = -SCONCE.tilt; // (its mouth turned a little out from the wall)
    shade.updateMatrixWorld();
    rest.add(shade);
    const spot = new THREE.SpotLight(0xfff0dc, 0, 200, 0.7, 0.5, 2);
    spot.position.copy(shade.localToWorld(new THREE.Vector3(0, -1, 0)));
    spot.target.position.copy(spot.position).addScaledVector(DOWN.clone().applyEuler(shade.rotation), 50);
    spot.castShadow = true;
    spot.shadow.mapSize.set(512, 512);
    spot.shadow.camera.near = 1;
    spot.shadow.bias = -0.0005;
    spot.shadow.normalBias = 0.3;
    group.add(spot, spot.target);
    return { shade, spot };
  });
  const gymLights = fader(1.2, (e) => {
    for (const s of sconces) {
      s.spot.intensity = 3400 * e; // (about half as much again as the room's own light on the floor under it)
    }
    sconceBulbMat.color.setScalar(0.35 + 0.65 * e);
  });
  Object.assign(gymLights, { by: null, held: false, seenAt: -Infinity }); // (on by the sensor or by hand; held off by hand)
  const SENSOR_HOLD = 8; // s on after the gym is empty
  const presence = { actors: () => [] }; // (room.js: who there is)
  const inGym = () => presence.actors().some((a) => a.human && a.below && a.x > SPLIT.x && a.z < GYM.z);
  function sense(t) {
    const g = gymLights;
    if (inGym()) {
      g.seenAt = t;
      if (!g.on && !g.held) {
        g.set(true);
        g.by = "sensor";
      }
    } else {
      g.held = false;
      if (g.on && g.by === "sensor" && t - g.seenAt > SENSOR_HOLD) g.set(false);
    }
  }
  shared.lamps.push(loungeLight, bathLights);
  shared.clickables.push(
    {
      parts: [hitBox([LAMP.x - LAMP.r, LAMP.x + LAMP.r], [0, LAMP.shade[1]], [LAMP.z - LAMP.r, LAMP.z + LAMP.r])],
      toggle: () => loungeLight.set(!loungeLight.on),
    },
    {
      parts: sconces.map((s) => s.shade),
      toggle() {
        const g = gymLights;
        if (g.on) g.held = true;
        else g.by = "hand";
        g.set(!g.on);
      },
    },
    {
      parts: [
        hitBox([X0, X0 + 2], [SWITCH.y - 1, SWITCH.y + 4], [SWITCH.z - 2, SWITCH.z + 2]),
        ...downlights.map((d) => d.can), // (the lamps themselves, nothing round them)
      ],
      toggle: () => bathLights.set(!bathLights.on),
    }
  );

  /* ---------- the patch over whoever should not be seen ---------- */

  // Soft pastel tiles, 6 by 8, each lit along its top and left edges and shaded along the others, the corner
  // tiles left off (rounded); now and then a few of them change colour, fading across.
  const [MW, MH, CELL] = [6, 8, 5];
  const TONES = [
    [247, 214, 208],
    [243, 196, 191],
    [251, 230, 220],
    [232, 201, 222],
    [249, 220, 192],
    [241, 208, 228],
    [253, 238, 228],
  ];
  const blocks = pixelTexture(MW * CELL, MH * CELL, () => {});
  const tilesNow = Array.from({ length: MW * MH }, (_, i) => ({ from: TONES[i % TONES.length], to: TONES[(i * 3) % TONES.length], at: -1 }));
  const blockImage = blocks.g.createImageData(MW * CELL, MH * CELL);
  function paintBlocks(t) {
    const { data } = blockImage;
    tilesNow.forEach((c, i) => {
      const [ci, cj] = [i % MW, Math.floor(i / MW)];
      const corner = (ci === 0 || ci === MW - 1) && (cj === 0 || cj === MH - 1);
      const k = Math.min(1, Math.max(0, (t - c.at) / 0.6));
      const rgb = c.from.map((v, n) => v + (c.to[n] - v) * k);
      for (let y = 0; y < CELL; y++)
        for (let x = 0; x < CELL; x++) {
          const shade = x === 0 || y === 0 ? 14 : x === CELL - 1 || y === CELL - 1 ? -22 : 0;
          const p = 4 * ((cj * CELL + y) * MW * CELL + ci * CELL + x);
          for (let n = 0; n < 3; n++) data[p + n] = Math.max(0, Math.min(255, rgb[n] + shade));
          data[p + 3] = corner ? 0 : 255;
        }
    });
    blocks.g.putImageData(blockImage, 0, 0);
    blocks.tex.needsUpdate = true;
  }
  paintBlocks(0);
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blocks.tex, transparent: true }));
  patch.rotation.set(-PITCH, VIEW_YAW, 0, "YXZ"); // square on to the camera
  patch.renderOrder = 5;
  patch.visible = false;
  rest.add(patch);
  let paintedAt = -1;
  // A few tiles on to a new colour every so often, each fading across (drawn while any is changing).
  function shimmer(t) {
    if (t - paintedAt < 0.1) return;
    paintedAt = t;
    for (const c of tilesNow)
      if (t - c.at > 0.6 && Math.random() < 0.035) Object.assign(c, { from: c.to, to: TONES[Math.floor(Math.random() * TONES.length)], at: t });
    if (tilesNow.some((c) => t - c.at < 0.7)) paintBlocks(t);
  }
  // Show it `w` x `h` with its middle at (x, y, z) (world), a little towards the camera; or hide it.
  const mosaic = {
    mesh: patch,
    show(x, y, z, w, h) {
      patch.position.set(x + 4 * Math.sin(VIEW_YAW), y + 3, z + 4 * Math.cos(VIEW_YAW));
      patch.scale.set(w, h, 1);
      patch.visible = true;
    },
    hide: () => (patch.visible = false),
  };

  // The static parts, one mesh each.
  // (All of it casting the arc lamp's shadows, and the floors and all of it taking them: room.js draws them.)
  const still = []; // (only what the gym's mirror shows of them drawn in it: mirror.js)
  for (const { n, glow, far, near } of grids.values())
    for (const [p, into] of [
      [far, rest],
      [near, group],
    ]) {
      if (!p.list().length) continue;
      const m = meshOf(p, n, glow ? glowing : solidMaterial);
      m.castShadow = m.receiveShadow = !glow;
      into.add(m);
      still.push(m);
    }
  floors.forEach((m) => (m.receiveShadow = true));

  /* ---------- each frame ---------- */

  // The bath: `fill` how full (0 empty .. 1 full), `flow` +1 the tap running, -1 the plug out, 0 neither (each
  // stops by itself at full or at empty). A visitor's click lets it out or runs it, or turns it round half way,
  // but only while nobody is using it (`claims`, set by room.js: whoever is having a bath, or running it).
  const bath = { hot: false, foam: false, steam: 0, curtain: bathCurtain, fill: 1, flow: 0 };
  const FILL_SECS = 16;
  const DRAIN_SECS = 13;
  const claims = { held: () => false }; // (room.js: whether anyone has claimed something)
  bath.free = () => !claims.held("bath");
  bath.toggle = () => {
    if (!bath.free()) return;
    bath.flow = bath.flow > 0 ? -1 : bath.flow < 0 ? 1 : bath.fill > 0.5 ? -1 : 1;
  };
  function runBath(dt) {
    if (!bath.flow) return;
    bath.fill = Math.min(1, Math.max(0, bath.fill + (bath.flow > 0 ? dt / FILL_SECS : -dt / DRAIN_SECS)));
    if (bath.fill === (bath.flow > 0 ? 1 : 0)) bath.flow = 0;
  }
  // The bath's tap: its levers turned out over half a second as it is run, back as it is turned off. The
  // water's front falls from the spout as it opens, a trickle at first; turned off, the last of it falls
  // away from the spout, and a few drips after (each a little ring where it lands). Where it lands it churns
  // the water (`pouring`, for drawWater()) and throws up drops.
  const tap = { k: 0, from: -Infinity, to: -Infinity, drips: [], pouring: 0 };
  const fallen = (secs) => 0.5 * GRAVITY * secs * secs; // how far water falls in `secs`
  function runTap(t, dt, level) {
    const on = bath.flow > 0;
    if (on && tap.from <= tap.to) [tap.from, tap.drips] = [t, []];
    if (!on && tap.to < tap.from) [tap.to, tap.drips] = [t, [0.5, 1.2, 2.3].map((s) => t + s)];
    tap.k = Math.min(1, Math.max(0, tap.k + (on ? dt : -dt) / 0.5));
    const turned = tap.k * tap.k * (3 - 2 * tap.k);
    levers[0].rotation.y = 1.1 * turned;
    levers[1].rotation.y = -1.1 * turned;
    const drop = SPOUT.y - level;
    const top = on ? 0 : fallen(t - tap.to); // (below the spout)
    const bottom = Math.min(drop, fallen(t - tap.from) + 0.5);
    tap.pouring = top < drop && bottom >= drop ? Math.max(0.3, turned) : 0;
    if (top < drop) {
      pour(tubStream, SPOUT.x, SPOUT.y - top, SPOUT.y - bottom, TUB.z);
      tubStream.scale.x = tubStream.scale.z = 0.35 + 0.65 * turned;
    } else tubStream.visible = false;
    if (Math.random() < dt * 30 * tap.pouring) {
      const [a, s] = [Math.random() * Math.PI * 2, 5 + Math.random() * 7];
      drops.emit("splash", SPOUT.x, W(level) + 0.3, TUB.z, Math.cos(a) * s, 18 + Math.random() * 16, Math.sin(a) * s, 0.6);
    }
    while (tap.drips.length && t >= tap.drips[0]) {
      tap.drips.shift();
      drops.emit("drip", SPOUT.x, W(SPOUT.y) - 0.3, TUB.z, 0, -2, 0, 2);
      bath.splash(SPOUT.x, TUB.z, 0.35, Math.sqrt((2 * drop) / GRAVITY));
    }
  }
  // (Its side, and its floor seen while it is empty; open at the top, so the duck can be clicked on its own.)
  const bathHit = new THREE.Mesh(new THREE.CylinderGeometry(TUB.r + 2.5, TUB.r + 2.5, TUB.deck + 1, 24, 1, true), hitMat);
  bathHit.position.set(TUB.x, W((TUB.deck + 1) / 2), TUB.z);
  const tubFloor = new THREE.Mesh(new THREE.CircleGeometry(TUB.r, 24), hitMat);
  tubFloor.rotation.x = -Math.PI / 2;
  tubFloor.position.set(TUB.x, W(TUB.floor + 0.2), TUB.z);
  rest.add(bathHit, tubFloor);
  shared.clickables.push({ parts: [bathHit, tubFloor, water], toggle: bath.toggle, can: bath.free });
  const sinks = { running: [false, false] };
  const m4 = new THREE.Matrix4();
  const v3 = new THREE.Vector3();
  const q4 = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const size = new THREE.Vector3();
  const facing = new THREE.Quaternion().setFromEuler(new THREE.Euler(-PITCH, VIEW_YAW, 0, "YXZ"));
  const col = new THREE.Color();
  let rippledAt = -1;
  let screenAt = -1;
  let duckAngle = 0;
  let duckSpin = 0; // (radians a second, dying away)
  let duckR = 14.5; // how far out from the plug it floats
  let puddleAt = 0; // (x from the middle the water spreads from, or shrinks to)
  let duckTurn = 0;
  let clockNow = 0;
  function update(t, dt) {
    runBath(dt); // (seen or not: someone may be waiting for it)
    sense(t);
    loungeLight.step(dt);
    gymLights.step(dt);
    VANITY.basins.forEach((x, i) => (sinks.running[i] = basinPools[i].step(t, dt, sinks.running[i])));
    clockNow = t;
    if (!group.visible || !rest.visible) return;
    for (const c of [bathCurtain, nookDoor]) c.set(Math.max(0, c.k) + Math.sign(c.goal - c.k) * Math.min(Math.abs(c.goal - c.k), dt / 1.1));
    // The water as high as it is filled, and gone when it is empty; swirling down the plug while it is let
    // out (most as the last of it goes), churned by the spout's stream while it runs. The plug up while it
    // is let out or empty.
    const level = TUB.floor + 0.1 + (TUB.level - TUB.floor - 0.1) * bath.fill;
    runTap(t, dt, level);
    // Run from empty, a shallow puddle where the spout's water lands, spreading over the tub's floor (let
    // out, shrinking to the plug in the middle): as kit.js's basinWater().
    water.visible = bath.fill > 0.003;
    const spread = Math.min(1, bath.fill / 0.08);
    puddleAt += ((bath.flow > 0 ? SPOUT.x - TUB.x : 0) - puddleAt) * Math.min(1, dt * 3);
    const s = 0.12 + 0.88 * spread * (2 - spread);
    water.scale.set(s, s, 1);
    water.position.set(TUB.x + puddleAt * (1 - s), W(level), TUB.z);
    water.material.opacity = 0.45 + 0.35 * spread;
    if (water.visible && t - rippledAt > 0.1) {
      rippledAt = t;
      drawWater(t, bath.foam && bath.fill > 0.4 ? 1 : 0, bath.flow < 0 ? 0.5 + 0.5 * (1 - bath.fill) : 0, tap.pouring);
    }
    const open = bath.flow < 0 || (!bath.flow && bath.fill < 0.01);
    plug.position.y += (W(TUB.floor + (open ? 0.9 : 0.25)) - plug.position.y) * Math.min(1, dt * 6);
    foamHeap.visible = bath.foam && bath.fill > 0.4;
    foamHeap.position.y = W(level) - 0.6;
    foamHeap.scale.y = 0.6 + 0.4 * Math.sin(t * 0.7) ** 2;
    VANITY.basins.forEach((x, i) => {
      const flow = basinPools[i].stream(t); // [top, bottom, thickness]
      sinkStreams[i].visible = !!flow;
      if (!flow) return;
      pour(sinkStreams[i], x, flow[0] - FLOOR, flow[1] - FLOOR, BACK + 6);
      sinkStreams[i].scale.x = sinkStreams[i].scale.z = flow[2];
    });
    streak.tex.offset.y = (t * 3) % 1;
    // Steam off hot water (rising as it warms, dying away as it cools), each wisp rising and spreading as it
    // fades.
    bath.steam += ((bath.hot && bath.fill > 0.3 ? 1 : 0) - bath.steam) * Math.min(1, dt / 3);
    steam.visible = bath.steam > 0.02;
    if (steam.visible) {
      for (let i = 0; i < STEAM; i++) {
        const life = (t / 4.5 + i / STEAM) % 1;
        const seed = Math.floor(t / 4.5 + i / STEAM) * 7 + i;
        v3.set(TUB.x + (hash(seed, 1, 53) - 0.5) * 26 + Math.sin(t + i) * 1.5, W(level + 2 + life * 16), TUB.z + (hash(seed, 2, 53) - 0.5) * 26);
        const s = 3 + life * 6;
        steam.setMatrixAt(i, m4.compose(v3, facing, size.set(s, s, s)));
        steam.setColorAt(i, col.setScalar(0.13 * bath.steam * Math.sin(Math.PI * life)));
      }
      steam.instanceMatrix.needsUpdate = true;
      steam.instanceColor.needsUpdate = true;
    }
    fizz.visible = bath.fill > 0.1;
    if (fizz.visible) {
      for (const [i, f] of fizzes.entries()) {
        if (t > f.at + f.life) {
          const [a, r] = [Math.random() * Math.PI * 2, (TUB.r - 2) * Math.sqrt(Math.random())];
          Object.assign(f, { at: t + Math.random() * 1.5, life: 0.4 + Math.random() * 1.2, x: TUB.x + r * Math.cos(a), z: TUB.z + r * Math.sin(a) });
          f.size = 0.6 + Math.random() * 0.8;
        }
        const k = Math.max(0, (t - f.at) / f.life);
        const s = k > 0 ? f.size * (0.6 + 0.4 * k) : 1e-3; // (swelling, then gone)
        fizz.setMatrixAt(i, m4.compose(v3.set(f.x, W(level) + 0.1, f.z), q4, size.set(s, s, s)));
      }
      fizz.instanceMatrix.needsUpdate = true;
    }
    // The duck, drifting slowly round the tub (in and out a little), bobbing and rocking. As the bath is let
    // out the whirlpool draws it in, round and round the plug the way the water turns, quicker the nearer it
    // gets (as a skater pulls in their arms); let down onto the tub's floor as the water goes, where it sits
    // still until it floats again and drifts back out (round clear of whoever is lying in it).
    const afloat = Math.min(1, bath.fill * 4);
    const pull = bath.flow < 0 ? 0.5 + 0.5 * (1 - bath.fill) : 0; // (as drawWater()'s drain)
    duckR = pull ? Math.max(3.5, duckR - dt * 1.6 * pull * afloat) : duckR + (14.5 - duckR) * Math.min(1, dt * 0.15 * afloat);
    duckAngle += dt * (0.07 * afloat + duckSpin * 0.05 + (pull * afloat * 9) / duckR);
    duckSpin *= Math.max(0, 1 - dt * 0.8);
    const da = duckAngle;
    const dr = duckR + Math.sin(t * 0.13) * afloat * (1 - pull);
    duck.position.set(
      TUB.x + dr * Math.cos(da),
      Math.max(W(level) - 0.9, W(TUB.floor)) + 0.25 * Math.sin(t * 2.1) * afloat,
      TUB.z + dr * Math.sin(da)
    );
    duck.rotation.set(
      0.06 * Math.sin(t * 1.7) * afloat,
      Math.atan2(-Math.sin(da), Math.cos(da)) + 0.25 * Math.sin(t * 0.3) * afloat + (duckTurn += dt * duckSpin),
      0.05 * Math.sin(t * 2.3) * afloat
    );
    flushing(t - toilet.flushedAt, dt);
    // The cabin's doors sliding round open or shut; its rain, each streak falling from the head and starting
    // again.
    cabin.k += Math.sign(cabin.goal - cabin.k) * Math.min(Math.abs(cabin.goal - cabin.k), dt / 0.7);
    const slide = 0.36 * (cabin.k * cabin.k * (3 - 2 * cabin.k));
    doors[0].rotation.y = slide;
    doors[1].rotation.y = -slide;
    rain.visible = shower.running;
    if (shower.running) {
      const [hx, hy, hz] = SHOWER.head;
      for (let i = 0; i < RAIN; i++) {
        const life = (t * 1.6 + hash(i, 3, 62)) % 1;
        v3.set(
          hx + (hash(i, 1, 62) - 0.5) * 7 * (1 + life * 0.4),
          W(hy - 1 - life * (hy - 2 - SHOWER.tray)),
          hz + (hash(i, 2, 62) - 0.5) * 7 * (1 + life * 0.4)
        );
        rain.setMatrixAt(i, m4.compose(v3, q4, one));
      }
      rain.instanceMatrix.needsUpdate = true;
    }
    // The weed sways; the fish wander the tank: each off to somewhere new every few seconds (or on getting
    // there), now and then with a quick dart, easing round as it turns, the tail beating with its speed. For a
    // while after feeding they are up at the top, nosing after the flakes; the second tetra keeps behind the
    // first.
    swayWeeds(t);
    const fed = t - tank.fedAt < 9;
    const [mx, , mz] = tank.mid;
    for (const f of fish) {
      const lead = f.follows !== undefined ? fish[f.follows] : null;
      // (in the shoal: behind the first, a little to one side, above or below, drifting about its place)
      if (lead && t - tank.scaredAt > 2)
        f.target.set(
          lead.pos.x + f.off[0],
          lead.pos.y + f.off[1] + 0.6 * Math.sin(t * 0.8 + f.wag),
          lead.pos.z - f.off[2] * Math.cos(lead.yaw) + Math.sin(t * 0.5 + f.wag)
        );
      else if (t > f.next || f.pos.distanceTo(f.target) < 1.5 || (lead && t - tank.scaredAt < 0.1)) {
        f.next = t + 2.5 + Math.random() * 4;
        f.dart = (!fed && Math.random() < 0.15) || t - tank.scaredAt < 1; // (startled by a tap on the glass)
        f.target.set(
          lerp(TANK.x0 + 1.5, TANK.x1 - 1.5, Math.random()),
          fed ? W(TANK.y1 - 2.5 - Math.random() * 3) : W(lerp(TANK.y0 + 2.5, TANK.y1 - 3, Math.random())),
          fed ? mz - 8 + Math.random() * 12 : lerp(TANK.z0 + 3, TANK.z1 - 3, Math.random())
        );
      }
      v3.subVectors(f.target, f.pos);
      const far = v3.length();
      const cruise = (f.dart ? 11 : fed ? 6 : 3.2) * (0.7 + 0.3 * f.size) * Math.min(1, far / 4);
      v3.multiplyScalar(far > 0.01 ? cruise / far : 0);
      f.vel.lerp(v3, 1 - Math.exp(-dt * (f.dart ? 4 : 1.8)));
      f.pos.addScaledVector(f.vel, dt);
      f.pos.x = Math.max(TANK.x0 + 1, Math.min(TANK.x1 - 1, f.pos.x));
      f.pos.y = Math.max(W(TANK.y0 + 1.5), Math.min(W(TANK.y1 - 1.5), f.pos.y));
      f.pos.z = Math.max(TANK.z0 + 2, Math.min(TANK.z1 - 2, f.pos.z));
      const speed = Math.hypot(f.vel.x, f.vel.z);
      if (speed > 0.3) {
        let turn = Math.atan2(f.vel.x, f.vel.z) - f.yaw;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        f.yaw += turn * Math.min(1, dt * 4);
      }
      f.wag += dt * (4 + speed * 2.4);
      f.g.position.copy(f.pos);
      f.g.rotation.set(
        -Math.atan2(f.vel.y, Math.max(0.5, speed)) * 0.5,
        f.yaw + 0.07 * Math.sin(f.wag + 1),
        0.06 * Math.sin(t * 1.3 + f.wag * 0.1),
        "YXZ"
      );
      f.tail.rotation.y = (0.3 + Math.min(0.25, speed * 0.03)) * Math.sin(f.wag);
    }
    for (let i = 0; i < 8; i++) {
      const life = (t * 0.28 + i / 8) % 1;
      v3.set(mx + 0.4 * Math.sin(t * 4 + i * 2), W(TANK.y0 + 1 + life * (TANK.y1 - TANK.y0 - 1.5)), TANK.z0 + 4 + 0.5 * Math.cos(t * 3 + i));
      bubbles.setMatrixAt(i, m4.compose(v3, q4, one));
    }
    bubbles.instanceMatrix.needsUpdate = true;
    flakes.visible = fed;
    if (fed) {
      for (let i = 0; i < 12; i++) {
        const s = Math.min(1, (t - tank.fedAt) / (5 + (i % 4)));
        v3.set(
          mx + (hash(i, 1, 54) - 0.5) * 5,
          W(TANK.y1 - 0.5 - s * (TANK.y1 - TANK.y0 - 1)),
          mz - 8 + (hash(i, 2, 54) - 0.5) * 12 + Math.sin(t + i) * 0.5
        );
        flakes.setMatrixAt(i, m4.compose(v3, q4, one));
      }
      flakes.instanceMatrix.needsUpdate = true;
    }
    // The treadmill's belt runs back under the runner; its console lit while on. Switched on by a visitor
    // with nobody on it (`left`: off at the next click, or as someone gets on), the belt speeds up over a
    // second and runs down again. (A visitor's spin of the bike's pedals dies away by itself: `tried`, s
    // left of it.)
    if (claims.held("treadmill")) treadmill.left = false;
    treadmill.idle += Math.max(-dt / 2, Math.min(dt / 2, (treadmill.left ? 0.5 : 0) - treadmill.idle));
    bike.tried = Math.max(0, bike.tried - dt);
    const beltSpeed = treadmill.speed || treadmill.idle;
    const on = treadmill.on || treadmill.left || beltSpeed > 0;
    belt.tex.offset.y = (belt.tex.offset.y - (dt * beltSpeed * 9) / 3) % 1;
    if (on !== screenAt >= 0 || (on && t - screenAt > 0.12)) {
      screenAt = on ? t : -1;
      drawScreen(t, on);
    }
    rower.churn = Math.max(0, rower.churn - dt * 2);
    rowFan.rotation.z -= dt * rower.churn * 3;
    const pedals = bike.speed || 0.8 * Math.min(1, bike.tried / 2);
    flywheel.rotation.x -= dt * pedals * 9;
    crank.rotation.x -= dt * pedals * 4;
    const swing = t - punch.at;
    const sway = swing < 6 ? 0.22 * Math.exp(-0.9 * swing) * Math.sin(swing * 3.2) : 0;
    bag.rotation.set(sway * Math.cos(punch.dir), 0, -sway * Math.sin(punch.dir));
    hands[0].rotation.z = -(shared.hour % 12) * (Math.PI / 6); // (the time of day: daytime.js)
    hands[1].rotation.z = -((shared.hour * 60) % 60) * (Math.PI / 30);
    if (patch.visible) shimmer(t);
  }
  updates.push(update);

  /* ---------- where they go down here ---------- */

  const toward = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const fishAt = [22, 38];
  const spots = {
    foot: [193, 97], // the stair foot, where they arrive
    // In the toilet's nook: in front of the curtain, and sat on it, facing out.
    toilet: { front: [TOILET.x, -64], inside: [TOILET.x, -90], seat: { x: TOILET.x, z: -97, yaw: 0, y: W(12.5) } }, // (inside: clear of the door's swing)
    // At each basin (hers the left, his the right), facing it; the cup and where the tap pours.
    vanity: VANITY.basins.map((bx, i) => ({
      at: [bx, BACK + 26],
      yaw: Math.PI,
      basin: [bx, W(VANITY.top + 2), BACK + 8.5],
      cup: [CUPS[i].x, W(VANITY.top + 2), CUPS[i].z],
      towel: [RINGS[i], W(26), BACK + 1.5],
    })),
    towels: {
      at: [X0 + 20, (LADDER.z0 + LADDER.z1) / 2],
      yaw: -Math.PI / 2,
      pink: [X0 + 3.5, W(35), LADDER.z0 + 4],
      blue: [X0 + 3.5, W(35), LADDER.z1 - 4],
    },
    // The bath: before its deck, facing it, and lying back in it, the head towards the wall, facing out into
    // the room; the water's surface height is bath.level().
    bath: {
      front: [NICHE.x1 + 9, TUB.z],
      yaw: -Math.PI / 2,
      in: { x: TUB.x - 4, z: TUB.z, yaw: Math.PI / 2, y: W(TUB.floor) },
      // Getting in and out: stood on the deck, sat on the tub's lip, stood up in the water.
      deck: [TUB.x + 23, TUB.z],
      deckY: W(TUB.deck),
      rim: { x: TUB.x + 20, z: TUB.z, y: W(TUB.deck + 1) },
      stand: [TUB.x + 9, TUB.z],
      standY: W(TUB.floor),
    },
    // The shower: outside its doors, and stood on the tray under the head (`tray` up), facing out.
    shower: {
      door: onArc(CABIN.r + 8, 45),
      in: onArc(11, 45),
      tray: SHOWER.tray,
      yaw: Math.PI / 4,
      head: [SHOWER.head[0], W(SHOWER.head[1]), SHOWER.head[2]],
    },
    // A pet bathed in the shower cabin: the pet waiting outside on the room's side, in at that half of the
    // doors, stood on the tray side on to the room just inside them; whoever bathes it opening the doors from
    // in front of them (`side`), then kneeling outside by their other half, reaching in to it.
    petBath: {
      wait: onArc(CABIN.r + 9, 28),
      door: onArc(CABIN.r + 7, 36),
      pet: onArc(22, 40),
      petYaw: -(40 * Math.PI) / 180, // (along the curve there)
      side: onArc(CABIN.r + 8, 45),
      kneel: onArc(CABIN.r + 4, 58),
      tray: SHOWER.tray,
    },
    // The fish tank, from the lounge side (the food on its hood); the cat on her pouf by it.
    fish: { at: fishAt, yaw: toward(fishAt, [TANK.x1, (TANK.z0 + TANK.z1) / 2]), tank: tank.mid, food: [0, W(45.5), TANK.z0 + 3] },
    catFish: { at: [POUF[0] + 15, POUF[1]], on: [POUF[0], W(10), POUF[1]], yaw: -Math.PI / 2 },
    // The lounge: the daybed facing the stairs (to sit, or lie along it), and the cat curled at its foot.
    daybed: {
      front: [D.x1 + 9, (D.z0 + D.z1) / 2],
      seat: { x: (D.x0 + D.x1) / 2 + 2, z: (D.z0 + D.z1) / 2, yaw: Math.PI / 2, y: W(D.seat) },
      lie: { x: (D.x0 + D.x1) / 2, z: D.z0 + 18, yaw: Math.PI, y: W(D.seat) },
      cat: { at: [D.x1 + 9, D.z1 - 6], on: [(D.x0 + D.x1) / 2 + 2, W(D.seat + 1), D.z1 - 6], yaw: VIEW_YAW },
    },
    tea: { at: [TEA[0] + 16, TEA[1] - 10], yaw: toward([TEA[0] + 16, TEA[1] - 10], TEA), table: [TEA[0], W(9), TEA[1]] },
    // The gym.
    treadmill: { front: [MILL.x1 + 11, -60], on: { x: (MILL.x0 + MILL.x1) / 2, z: -58, yaw: 0, y: W(MILL.deck) } },
    rower: { front: [R.catchX, R.z - 14], seat: { x: R.catchX, z: R.z, yaw: Math.PI / 2, y: W(R.seat) } },
    weights: { at: [DB_AT[0] + 4, BACK + 22], yaw: 0.35, rack: dumbbells.at, rackYaw: Math.PI },
    lat: { front: [LAT.x - 14, LAT.z], seat: { x: LAT.x - 1, z: LAT.z, yaw: Math.PI / 2, y: W(12) } },
    mat: { at: [(MAT.x0 + MAT.x1) / 2, (MAT.z0 + MAT.z1) / 2], yaw: VIEW_YAW },
    water: { at: [SPLIT.x + 12, BACK + 22], yaw: Math.PI, bottle: [SPLIT.x + 8, W(14), BACK + 5] },
    bike: {
      front: [BIKE.x - 13, BIKE.z0 + 7],
      seat: { x: BIKE.x, z: BIKE.z0 + 6.5, yaw: 0, y: W(BIKE.seat) },
      pedals: [BIKE.x, W(8.5), BIKE.z0 + 13],
      bars: [BIKE.x, W(25), BIKE.z1 - 8.5],
    },
    bag: { at: [BAG.x - 13, BAG.z], yaw: Math.PI / 2, bag: [BAG.x, W(28), BAG.z] },
    dogWatch: [70, -86],
    catWatch: [138, 92],
  };
  bath.level = () => W(TUB.floor + 0.1 + (TUB.level - TUB.floor - 0.1) * bath.fill);
  bath.full = () => bath.fill > 0.98;
  // What else a visitor can click down here: each does its thing only while nobody is using it (and is not
  // even offered then: `can`), and never changes what someone is doing. The bag swings; the treadmill runs
  // (stops at the next click); the bike's pedals spin a moment; the rower's fan whirls; the toilet flushes;
  // the fish dart off; the duck spins away; the shower's doors slide open or shut; a basin's tap runs (off
  // at the next click).
  const free =
    (...keys) =>
    () =>
      keys.every((k) => !claims.held(k));
  shared.clickables.push(
    {
      parts: [bag],
      toggle: () => Object.assign(punch, { at: clockNow, dir: Math.random() * Math.PI * 2 }),
      can: free("bag"),
    },
    {
      parts: [hitBox([MILL.x0, MILL.x1], [0, 30], [MILL.z0, MILL.z1])],
      toggle: () => (treadmill.left = !treadmill.left),
      can: free("treadmill"),
    },
    {
      parts: [hitBox([BIKE.x - 4, BIKE.x + 4], [0, 26], [BIKE.z0, BIKE.z1])],
      toggle: () => (bike.tried = 4),
      can: free("bike"),
    },
    {
      parts: [hitBox([ROWER.x0, ROWER.x1], [0, 12], [ROWER.z - 4, ROWER.z + 4])],
      toggle: () => (rower.churn = Math.max(rower.churn, 3)),
      can: free("rower"),
    },
    {
      parts: [hitBox([TOILET.x - 7, TOILET.x + 7], [0, 25], [TOILET.z0, TOILET.z1])],
      toggle: () => !toilet.flushing(clockNow) && toilet.flush(clockNow),
      can: free("loo", "privacy"),
    },
    {
      parts: [hitBox([TANK.x0 - 2, TANK.x1 + 2], [TANK.y0, TANK.y1], [TANK.z0, TANK.z1])],
      toggle: () => ((tank.scaredAt = clockNow), fish.forEach((f) => (f.next = 0))),
      can: free("fish"),
    },
    { parts: [duck], toggle: () => bath.nudge() },
    {
      parts: [cabinFront], // (the whole curved front: the doors and the fixed panels either side of them)
      toggle: () => (cabin.goal = cabin.goal ? 0 : 1),
      can: free("shower"),
    },
    ...VANITY.basins.map((x, i) => ({
      parts: [hitBox([x - 6, x + 6], [VANITY.top, VANITY.top + 6], [BACK + 2, BACK + 14])],
      toggle: () => (sinks.running[i] = !sinks.running[i]),
      can: free(`vanity${i}`),
    }))
  );
  // Suds on a pet being bathed: white blobs over its back and head, on its pose (so they move with it), the
  // first `k` (0..1) of them shown, each growing in as it comes.
  const sudsMat = new THREE.MeshLambertMaterial({ color: "#fbfcfd" });
  const sudsGeo = new THREE.BoxGeometry(1, 1, 1);
  const sudsOf = new Map();
  const sudsAt = new THREE.Vector3();
  const sudsSize = new THREE.Vector3();
  const sudsTurn = new THREE.Quaternion();
  function suds(pet, k) {
    let s = sudsOf.get(pet);
    if (!s) {
      const big = pet.name === "collie";
      // Its body's and its head's middles and radii (models/collie.js, models/cat.js).
      const parts = big
        ? [
            [
              [0, 17, 0],
              [10, 9, 15],
            ],
            [
              [0, 32, 8],
              [12, 11, 10],
            ],
          ]
        : [
            [
              [0, 13, 0],
              [7, 6.5, 11],
            ],
            [
              [0, 25, 9],
              [9, 8, 7.5],
            ],
          ];
      const n = big ? 48 : 30;
      const mesh = new THREE.InstancedMesh(sudsGeo, sudsMat, n);
      mesh.frustumCulled = false; // (its instances are all over the pet, far from its own middle)
      const blobs = [];
      for (let i = 0; i < n; i++) {
        const [c, r] = parts[i % 5 === 4 ? 1 : 0];
        const d = new THREE.Vector3(hash(i, 1, 97) - 0.5, 0.15 + hash(i, 2, 97), hash(i, 3, 97) - 0.5).normalize(); // (the upper part)
        blobs.push({
          at: new THREE.Vector3(c[0] + d.x * r[0], c[1] + d.y * r[1], c[2] + d.z * r[2]),
          size: (big ? 3.2 : 2.2) + hash(i, 4, 97) * 2.4,
          spin: hash(i, 5, 97) * 3,
        });
      }
      pet.rig.pose.add(mesh);
      s = { mesh, blobs, k: -1 };
      sudsOf.set(pet, s);
    }
    if (Math.abs(k - s.k) < 0.01) return;
    s.k = k;
    s.mesh.visible = k > 0;
    s.blobs.forEach((b, i) => {
      const grown = Math.min(1, Math.max(0, k * s.blobs.length - i));
      sudsTurn.setFromAxisAngle(sudsAt.set(0, 1, 0), b.spin);
      s.mesh.setMatrixAt(i, m4.compose(b.at, sudsTurn, sudsSize.setScalar(b.size * grown + 1e-3)));
    });
    s.mesh.instanceMatrix.needsUpdate = true;
  }
  // Rings spreading over the water from (x, z), `a` as big as someone getting in or out (a drip's, smaller,
  // starting `after` s from now as it lands), drops thrown up with them; the duck nudged, spinning off.
  bath.splash = (x, z, a = 1, after = 0) => {
    splashes.push({ t: clockNow + after, u: ((x - TUB.x) / (2 * TUB.r) + 0.5) * RW, v: ((z - TUB.z) / (2 * TUB.r) + 0.5) * RW, a });
    if (a === 1) for (let k = 0; k < 6; k++) drops.splash(x + (Math.random() - 0.5) * 6, bath.level(), z + (Math.random() - 0.5) * 6, 1);
  };
  bath.nudge = () => (duckSpin = 6);
  bath.spout = [SPOUT.x, W(SPOUT.y), TUB.z];

  // Where a drop lands down here: in the bath (its water, or its floor let out), on the deck round it, or on
  // the floor; nowhere off the edge.
  const groundAt = (x, z) => {
    if (x < X0 || x > SIDE || z < BACK || z > FRONT) return -Infinity;
    if (Math.hypot(x - TUB.x, z - TUB.z) < TUB.r) return bath.fill > 0.01 ? bath.level() : W(TUB.floor);
    return inDeck(x, z) ? W(TUB.deck) : FLOOR;
  };

  return {
    basement: {
      claims,
      groundAt,
      suds,
      shadowLights: [loungeLight, gymLights], // (room.js)
      presence,
      group,
      obstacles,
      bounds: [X0 + 4, SIDE - 4, BACK + 4, FRONT - 4],
      spots,
      update,
      dress() {}, // (lit the same by day and by night: there are no windows down here)
      gymGlass,
      still,
      // Seen from the house (true), only what shows down the stairwell; else all of it.
      seenFromAbove: (only) => (rest.visible = !only),
      mosaic,
      bath,
      sinks,
      toilet,
      cups,
      tank,
      treadmill,
      rower,
      lat,
      dumbbells,
      bike,
      punch,
      shower,
    },
  };
}
