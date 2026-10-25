/*******************************************************************************
 * What the parts of the house are made with: the palette, little painted
 * textures, voxel parts turned into lit meshes, and putting things in place.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { PROP_COLORS } from "../../models/girl-props.js";
import { OUTFIT_PALETTE } from "../../models/girl-outfits.js";
import { BOOKS } from "../props.js";
import { FOOD_COLORS } from "../fridge-food.js";
import { VEG_COLORS } from "../veg.js";

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
  chiliOil: "#b5301a",
  chiliFlake: "#6e170b",
  chiliLabel: "#f2c230",
  chiliLid: "#d6332a",
  pouchRed: "#d42a2a",
  pouchLabel: "#f4efe0",
  pouchGreen: "#4f9a4a",
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
  ...Object.fromEntries(BOOKS.map((c, i) => [`read${i}`, c])),
  bookBand: "#f3e9cf",
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
export const solidMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
export function solid(p, palette = COLORS, material = solidMaterial) {
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
