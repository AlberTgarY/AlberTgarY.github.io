/*******************************************************************************
 * What the parts of the house are made with: the palette, little painted
 * textures, voxel parts turned into lit meshes, and putting things in place.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { FACES, hash } from "../../models/voxels.js";
import { PROP_COLORS } from "../../models/girl-props.js";
import { OUTFIT_PALETTE } from "../../models/girl-outfits.js";
import { BOOKS } from "../props.js";
import { FOOD_COLORS } from "../fridge-food.js";
import { VEG_COLORS } from "../veg.js";
import { GRAVITY } from "../water.js";

export const COLORS = {
  ...OUTFIT_PALETTE,
  ...PROP_COLORS,
  ...FOOD_COLORS,
  ...VEG_COLORS,
  umbrellaPink: "#f28aa8",
  umbrellaNavy: "#3f5a8a",
  umbrellaNavyDark: "#2f4670",
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
  washerWhite: "#f1f2ef",
  washerShade: "#dcdedb",
  washerPanel: "#2b2e33",
  washerKey: "#9aa1a8",
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
  magnetOrange: "#f2a541",
  magnetGreen: "#6cbf5a",
  magnetPink: "#f4a3b8",
  magnetBlue: "#5aa0e0",
  magnetDark: "#2a2522",
  note: "#fbf8ef",
  noteLine: "#8fb3dd",
  photoHerHair: "#4a2c1d",
  photoHisHair: "#1b1b20",
  photoSkin: "#f6d2b8",
  photoGrass: "#86c46a",
  crisper: "#dcefe9",
  crisperRim: "#c4ded6",
  crisperHandle: "#a9cbc0",
  egg: "#f6ead6",
  soyBottle: "#3a1c10",
  lkkRed: "#c8242b",
  lkkGold: "#e8b84a",
  lkkTeal: "#2f8c84",
  lkkCap: "#c9a04e",
  lkkCream: "#f3e3c0",
  lkkCapDark: "#a8823a",
  lkkGoldDark: "#c99a36",
  lkkRedDark: "#a51c22",
  lkkSky: "#9fd3e0",
  lkkTealDark: "#22706a",
  lkkSkin: "#f1c7a4",
  lkkBlue: "#3c6fb8",
  soyGleam: "#5a3424",
  chiliOil: "#b5301a",
  chiliFlake: "#6e170b",
  chiliBright: "#d8481c",
  chiliGleam: "#e9764a",
  chiliLabelDark: "#d9a522",
  chiliLabel: "#f2c230",
  chiliLid: "#d6332a",
  pouchRed: "#d42a2a",
  pouchLabel: "#f4efe0",
  pouchGreen: "#4f9a4a",
  pouchDeep: "#a81c22",
  pouchPink: "#f07a86",
  pepperRed: "#f2402e",
  onionGreen: "#9ccf6a",
  garlic: "#f3ead6",
  hobSteel: "#cdd2d6",
  hobEdge: "#a9afb4",
  burnerCap: "#1e1f22",
  grate: "#2a2b2e",
  knob: "#26272a",
  knobTop: "#8d9399",
  flame: "#4f8dff",
  flameCore: "#a9d0ff",
  panBlack: "#c8b596",
  panSide: "#dcc6a2",
  panLip: "#f0e2c6",
  panCollar: "#1c1c1f",
  panHandle: "#a9713f",
  fryGreen: "#5fae4a",
  fryRed: "#e0533a",
  fryYellow: "#f0c24a",
  fryMeat: "#a8653a",
  spark: "#ffb347",
  fairyGreen: "#2f9a3a",
  fairyGreenDark: "#22802e",
  fairyCap: "#d8262c",
  fairyLabel: "#f4f6f2",
  cupboardInside: "#e6dac2",
  pepperCorn: "#3a2a20",
  pepperCornLight: "#6b5240",
  pinkSalt: "#f2a593",
  pinkSaltLight: "#fbd6cb",
  pinkSaltDeep: "#e07a6a",
  glassware: "#dcecf2",
  glasswareRim: "#f7fbfd",
  jarLid: "#c9a25e",
  rice: "#f4f0e4",
  pasta: "#efc75e",
  beans: "#8a4f32",
  lentils: "#d9733f",
  oliveOil: "#c9b23a",
  bowlRim: "#5f8fd6",
  photo: "#fbfaf6",
  photoSky: "#9fd0f2",
  cabinet: "#efe4cf",
  cabinetLine: "#d6c6a8",
  cabinetGreen: "#5f8f6c",
  celadon: "#bcd9c8",
  celadonDark: "#8fb8a2",
  chinaInk: "#3f62a8",
  bamboo: "#e0c48e",
  bambooDark: "#c4a065",
  chopDark: "#4a3027",
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
  dsWhite: "#f4f5f7", // the PlayStation and the controllers' stand
  dsShade: "#dcdfe5",
  dsBlack: "#25262b",
  dsLight: "#5bb4ff",
  magazine: "#e88f6f",
  magazine2: "#7fb3d5",
  ...Object.fromEntries(BOOKS.map((c, i) => [`read${i}`, c])),
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
  pcCase: "#26272e",
  pcEdge: "#3b3d47",
  chairBlack: "#2b2c33",
  chairWhite: "#f2f2f4",
  chairGreen: "#a3d13c",
  chairGreenDark: "#86b82a",
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
  logChar: "#4a3226",
  ash: "#8e8680",
  fireRed: "#e0452c",
  fireOrange: "#f58a2c",
  fireYellow: "#ffd75a",
  fireCore: "#fff4c8",
  ember: "#ff7a2a",
  emberDeep: "#d2401c",
  wallCap: "#c9ae8a",
  plushFur: "#c6c5c2", // the plush moth by the bed
  plushFurLight: "#d9d8d5",
  plushSpeck: "#adaca8",
  plushBlack: "#242328",
  plushShag: "#3a393f",
  plushRib: "#3b3b42",
  plushWing: "#8f8e90",
  plushVein: "#2a292e",
  plushFelt: "#9c9b9b",
  plushEye: "#0d0d10",
  soil: "#6b4a32",
  soilWet: "#3f2a1c",
};

// A canvas texture drawn texel by texel, one texel per voxel, kept crisp.
export function pixelTexture(w, h, draw) {
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

// The water held in a basin or a sink, `w` by `d` across (an oval if `round`), between heights y0 (empty)
// and y1 (brimful) in its parent, under a tap whose mouth is at height `spout`. Turned on, the tap's water
// comes as a thin trickle at first, its front falling from the mouth, thickening; only once it reaches the
// bottom does water gather, a shallow puddle where it lands spreading over the floor of it, then rising
// (`fill` s to the brim); the tap turns itself off once it is up to `full`, the last of its water falling
// away. Then it drains away slowly (`drain` s), down to a puddle shrinking to the plug in the middle. Clear
// pale blue with light rippling over it, and where the tap's water lands (`land`, 0..1 along its x and its
// z) churned white, rings spreading out. `step(t, dt, running)` moves it on and returns whether the tap
// still runs; `stream(t)` is the tap's water just now, [top, bottom, thickness 0..1] (heights in the
// parent), or null; `mesh` is to be placed by its parent (at its middle).
export function basinWater({ w, d, round = false, y0, y1, spout, land = [0.5, 0.5], fill = 7, drain = 16, full = 0.85, drops = null }) {
  const N = 24;
  const ripple = pixelTexture(N, N, () => {});
  ripple.tex.magFilter = ripple.tex.minFilter = THREE.LinearFilter;
  const image = ripple.g.createImageData(N, N);
  const sheet = new THREE.Mesh(
    round ? new THREE.CircleGeometry(0.5, 24).scale(w, d, 1) : new THREE.PlaneGeometry(w, d),
    new THREE.MeshLambertMaterial({ map: ripple.tex, transparent: true, opacity: 0.85, depthWrite: false })
  );
  sheet.rotation.x = -Math.PI / 2;
  sheet.renderOrder = 2;
  const mesh = new THREE.Group();
  mesh.add(sheet);
  mesh.visible = false;
  const landAt = [(land[0] - 0.5) * w, (land[1] - 0.5) * d]; // (from its middle)
  // Where the stream lands: a broken ring of white froth round it, turned and swelling afresh each frame, and
  // drops thrown up and out in a little crown (`drops`: water.js), each gone as it falls back to the surface
  // (or, still dry, the floor).
  const froth = pixelTexture(16, 16, (g) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const r = Math.hypot(x + 0.5 - 8, y + 0.5 - 8) / 8;
        const ring = Math.exp(-(((r - 0.5) / 0.2) ** 2));
        if (hash(x, y, 31) < ring * 0.85) {
          g.fillStyle = `rgba(246,252,255,${(0.5 + 0.5 * ring).toFixed(2)})`;
          g.fillRect(x, y, 1, 1);
        }
      }
  });
  froth.tex.magFilter = froth.tex.minFilter = THREE.LinearFilter;
  const crown = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: froth.tex, transparent: true, depthWrite: false })
  );
  crown.position.set(landAt[0], 0.05, landAt[1]);
  crown.renderOrder = 3;
  mesh.add(crown);
  const splashFrom = new THREE.Vector3();
  function splash(t, dt) {
    const j = 0.85 + 0.3 * Math.random();
    crown.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
    crown.scale.set(j, j, 1);
    if (!drops) return;
    mesh.localToWorld(splashFrom.set(landAt[0], 0.2, landAt[1]));
    for (let n = Math.random() * 120 * dt; n > 0; n--) {
      const a = Math.random() * Math.PI * 2;
      const [out, up] = [3 + Math.random() * 6, 9 + Math.random() * 13];
      drops.emit("splash", splashFrom.x, splashFrom.y, splashFrom.z, Math.cos(a) * out, up, Math.sin(a) * out, (2 * up) / GRAVITY);
    }
  }
  let drawnAt = -1;
  function draw(t, pouring) {
    const { data } = image;
    const [lx, ly] = [land[0] * N, land[1] * N]; // (its rows run along z, from its back)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let c = Math.sin(y * 0.8 + t * 1.6 + Math.sin(x * 0.6 + t)) + Math.sin(x * 0.9 - t * 1.3 + Math.sin(y * 0.4 - t * 0.5));
        const rl = Math.hypot(x + 0.5 - lx, y + 0.5 - ly);
        if (pouring) c += 2 * Math.sin(rl * 1.6 - t * 10) * Math.max(0, 1 - rl / 12);
        const caustic = Math.max(0, 1 - Math.abs(c) * 1.6) ** 3;
        let [r, g, b] = [158 + 80 * caustic, 214 + 36 * caustic, 236 + 16 * caustic];
        const churn = pouring && rl < 3.5 && hash(x, y, Math.floor(t * 12)) < 1 - rl / 3.5;
        if (churn) [r, g, b] = [246, 251, 253];
        const k = 4 * (y * N + x);
        [data[k], data[k + 1], data[k + 2], data[k + 3]] = [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
      }
    ripple.g.putImageData(image, 0, 0);
    ripple.tex.needsUpdate = true;
  }
  const fallen = (secs) => 0.5 * GRAVITY * secs * secs; // how far water falls in `secs`
  const SPREAD = 0.15; // (as full as it is once it covers the floor)
  let [on, from, to] = [false, -Infinity, -Infinity]; // the tap, when it was turned on and off
  const pivot = [0, 0]; // where the puddle spreads from (as it fills) or shrinks to (as it drains)
  const pool = {
    mesh,
    level: 0,
    top: () => y0 + (y1 - y0) * pool.level,
    // On by dt with the tap `running` (and the plug in, `plugged`: it does not drain); whether the tap runs on.
    step(t, dt, running, plugged = false) {
      if (running !== on) [on, from, to] = running ? [true, t, to] : [false, from, t];
      const landed = running && fallen(t - from) >= spout - pool.top();
      pool.level = Math.min(1, Math.max(0, pool.level + (landed ? dt / fill : running || plugged ? 0 : -dt / drain)));
      if (pool.level >= full) running = false;
      // A puddle as big as it has spread, round the point it spreads from.
      const spread = Math.min(1, pool.level / SPREAD);
      const goal = running ? landAt : [0, 0];
      for (const k of [0, 1]) pivot[k] += (goal[k] - pivot[k]) * Math.min(1, dt * 3);
      const s = 0.12 + 0.88 * spread * (2 - spread);
      sheet.scale.set(s, s, 1);
      sheet.position.set(pivot[0] * (1 - s), 0, pivot[1] * (1 - s));
      sheet.material.opacity = 0.45 + 0.4 * spread;
      mesh.visible = pool.level > 0.003 || landed;
      sheet.visible = pool.level > 0.003;
      crown.visible = landed;
      mesh.position.y = pool.top();
      if (landed) splash(t, dt);
      if (mesh.visible && t - drawnAt > 0.1) {
        drawnAt = t;
        draw(t, landed);
      }
      return running;
    },
    stream(t) {
      const drop = spout - pool.top();
      const top = on ? 0 : fallen(t - to);
      if (top >= drop) return null;
      const bottom = Math.min(drop, fallen(t - from) + 0.3);
      const thick = on ? Math.min(1, 0.3 + (t - from) / 0.5) : Math.max(0.3, 1 - (t - to) / 0.3);
      return [spout - top, spout - bottom, thick];
    },
  };
  return pool;
}

// Honey oak boards, 6 voxels deep, of random lengths with darker seams (256 x 48 voxels a repeat, a texel a
// voxel): the house's floors.
export function oakBoards() {
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
  return planks;
}

// The house's wallpaper, `h` voxels high and 64 across (a texel a voxel): warm cream with fine stripes and
// little flowers over white panelling, a wooden rail between them and a skirting board below, a cornice at
// the top; or, `tiled`, over cream metro tiles edged in sage (the basement's bathroom: basement.js).
export function wallpaper(h, tiled = false) {
  const paper = pixelTexture(64, h, (g, w) => {
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
    if (tiled) {
      g.fillStyle = "#e2dccf"; // the grout
      g.fillRect(0, at(31), w, 30);
      for (let y = 2; y < 30; y += 2)
        for (let x = (y / 2) % 2 ? -2 : 0; x < w; x += 4) {
          g.fillStyle = "#f7f3ea";
          g.fillRect(x, at(y + 1), 3, 1);
          g.fillStyle = "#fbf9f4"; // (a glint along each tile's top)
          g.fillRect(x, at(y + 1), 2, 1);
          g.fillStyle = "#f2ede2";
          g.fillRect(x, at(y), 3, 1);
        }
      g.fillStyle = "#a9bb9c"; // a sage trim along the top, and along the floor
      g.fillRect(0, at(31), w, 2);
      g.fillStyle = "#8fa682";
      g.fillRect(0, at(1), w, 2);
    } else {
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
    }
    g.fillStyle = "#e9d6b6"; // the cornice
    g.fillRect(0, 0, w, 3);
  });
  paper.tex.wrapS = THREE.RepeatWrapping;
  return paper;
}

// A part (voxels.js) as one mesh of just the voxel faces that show, coloured per face, and faces of a
// colour side by side merged: for a part that never changes shape, a small fraction of the triangles of a
// cube per voxel, and it looks the same.
export const solidMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
const AXES = FACES.map((face) => face.map((e) => e.findIndex((k) => k !== 0))); // each face's normal's axis and its edges'
// Each a hair bigger all round: where a corner of one rectangle sits on the edge of a bigger one, the two
// would leave pinholes between them.
const SEAM = 0.02;
export function solid(p, palette = COLORS, material = solidMaterial) {
  // The faces that show, gathered by direction, plane and colour: each at (a, b) along its two edges.
  const planes = FACES.map(() => new Map()); // depth -> colour -> [a, b, a, b, ...]
  for (const voxel of p.list()) {
    const [x, y, z, name] = voxel;
    for (let f = 0; f < 6; f++) {
      const [n] = FACES[f];
      if (p.has(x + n[0], y + n[1], z + n[2])) continue;
      const [na, ua, va] = AXES[f];
      const depth = voxel[na];
      if (!planes[f].has(depth)) planes[f].set(depth, new Map());
      const colours = planes[f].get(depth);
      const colour = palette[name];
      if (!colours.has(colour)) colours.set(colour, []);
      colours.get(colour).push(voxel[ua], voxel[va]);
    }
  }
  // Each plane's faces merged into as few rectangles as it takes (far fewer triangles; it looks the same):
  // over a grid of the plane, from each face left, a run along the first edge, then on along the second as
  // far as the whole run goes. (A face off the whole-voxel grid from the plane's lowest corner stays single.)
  const position = [];
  const normal = [];
  const color = [];
  const index = [];
  const c = new THREE.Color();
  const corner = [0, 0, 0];
  planes.forEach((depths, f) => {
    const [n] = FACES[f];
    const [na, ua, va] = AXES[f];
    const rectangle = (depth, a0, a1, b0, b1) => {
      const base = position.length / 3;
      for (const [su, sv] of [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5],
      ]) {
        corner[na] = depth + n[na] / 2;
        corner[ua] = (a0 + a1) / 2 + su * (a1 - a0 + 1 + SEAM);
        corner[va] = (b0 + b1) / 2 + sv * (b1 - b0 + 1 + SEAM);
        position.push(...corner);
        normal.push(...n);
        color.push(c.r, c.g, c.b);
      }
      index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    for (const [depth, colours] of depths)
      for (const [colour, cells] of colours) {
        c.set(colour);
        let [a0, b0, a1, b1] = [Infinity, Infinity, -Infinity, -Infinity];
        for (let k = 0; k < cells.length; k += 2) {
          [a0, a1] = [Math.min(a0, cells[k]), Math.max(a1, cells[k])];
          [b0, b1] = [Math.min(b0, cells[k + 1]), Math.max(b1, cells[k + 1])];
        }
        const [w, h] = [a1 - a0 + 1, b1 - b0 + 1];
        const grid = new Uint8Array(Number.isInteger(w) && Number.isInteger(h) ? w * h : 0);
        for (let k = 0; k < cells.length; k += 2) {
          const [i, j] = [cells[k] - a0, cells[k + 1] - b0];
          if (Number.isInteger(i) && Number.isInteger(j) && grid.length) grid[j * w + i] = 1;
          else rectangle(depth, cells[k], cells[k], cells[k + 1], cells[k + 1]);
        }
        for (let j = 0; j < h && grid.length; j++)
          for (let i = 0; i < w; i++) {
            if (!grid[j * w + i]) continue;
            let i1 = i;
            while (i1 + 1 < w && grid[j * w + i1 + 1]) i1++;
            let j1 = j;
            while (j1 + 1 < h && grid.subarray((j1 + 1) * w + i, (j1 + 1) * w + i1 + 1).every(Boolean)) j1++;
            for (let jj = j; jj <= j1; jj++) grid.fill(0, jj * w + i, jj * w + i1 + 1);
            rectangle(depth, a0 + i, a0 + i1, b0 + j, b0 + j1);
          }
      }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  g.setIndex(index);
  return new THREE.Mesh(g, material);
}
export const glowing = new THREE.MeshBasicMaterial({ vertexColors: true }); // unlit: lit from within, or a light

// A mesh or group placed at `at`, turned by `rotY`, added to `parent`.
export function place(parent, object, [x, y, z], rotY = 0) {
  object.position.set(x, y, z);
  object.rotation.y = rotY;
  parent.add(object);
  return object;
}

// Where a point (lx, lz) of something standing at `at`, turned by `yaw`, is in the room.
export const turned = ([x, z], yaw, [lx, lz]) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
