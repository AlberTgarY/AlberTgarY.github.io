/*******************************************************************************
 * The wonton stall that comes to the corner under the plane tree every
 * afternoon (layout.js STALL; stall-life.js brings it and works it): a cargo
 * tricycle, its frame painted red, with a steel cabinet on its back. On the
 * counter the big pot of water on the boil sits down in its burner (a ring of
 * flame showing round it), and beside it his board (a stack of wrappers, a
 * bowl of pork and the bamboo blade he dabs it on with), the enamel tray the
 * wontons go on as he makes them, a row of tubs (spring onion, dried shrimp,
 * laver) and a stack of bowls (stall-pot.js cooks it all). Over it
 * a striped awning on four slim poles, arched a little and over the
 * customers' half (he is seen under it, and it clears his head going up and
 * down: it is wound down flat over the counter while the tricycle rolls, up
 * once it is parked), a scalloped red valance along its front with a string
 * of warm bulbs under it, a green enamel lamp hung over the pot, a red paper
 * lantern at the end; four orange cloths hang along the
 * counter's front, brushed in black, 泡 泡 馄 饨 ("bubble wontons"); the menu
 * on a little blackboard on one pole, the code to pay by on the other; more
 * bulbs strung up into the tree. Before it, a low folding table and red
 * plastic stools, the chilli oil and the vinegar on it.
 *
 * Built about its own middle (the cabinet's, on the ground: its width along x,
 * the customers' side +x; its length along z, the front, the handlebars, to
 * +z), as a whole that rolls up the lane on its wheels and turns into its
 * place (PARKED: its front then to the left, the customers' side to the
 * street). Things to click: the pot (the water swirls, the wontons bob), the
 * tray (another wonton made),
 * the bell on the handlebars (stall-life.js: he looks up at it), the code to
 * pay by (a beep), the lantern and the bulbs (they swing), the cloths, the
 * stack of bowls, the chilli oil and the vinegar, a free stool (they rock).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { pixelTexture, turned } from "../room/house/kit.js";
import { part, box, meshOf, paletteOf, swinging, knock } from "./kit.js";
import { ellipsoid } from "../models/voxels.js";
import { makeCooking, WATER_R } from "./stall-pot.js";
import { STALL, PARKED, TREE } from "./layout.js";

export const PARK_YAW = -Math.PI / 2; // (its front to the left, -x; its customers' side to the street, +z)
const HALF = 0.5;
const CAB = { x: [-8, 7], y: [5, 13], z: [-17, 16] }; // the cabinet's voxels (about its middle)
const TOP = 14; // the counter's slab (its voxels); its top at TOP + 0.5
const POT = { x: -1, z: -10.5, r: 7.2, bottom: 8.3, rim: 16.8 }; // the pot, sat well down in the burner (his arms, his ladle, clear over its rim)
const WATER_Y = 15.7; // the water's surface
// The awning (about the cabinet's middle): across x from its back edge to its front (out over the customers),
// along z end to end; its height at the back and the front, raised, and how much higher along its middle (it
// arches a little); wound down, it lies flat this high over the counter (clear of the pot's lid, under the
// rider's head). Its poles stand on the counter's corners, the back two clear of the pot's handles.
const ROOF = { x0: -1.5, x1: 10, z0: -19.5, z1: 18.5, back: 59, front: 55.5, crown: 1.2, down: 19.6 };
const POLES = [
  [2, -18],
  [2, 17],
  [8, -18],
  [8, 17],
];
const roofAt = (x, z, k = 1) => {
  const u = (x - ROOF.x0) / (ROOF.x1 - ROOF.x0);
  const along = Math.cos((Math.PI * (z - (ROOF.z0 + ROOF.z1) / 2)) / (ROOF.z1 - ROOF.z0));
  const up = ROOF.back + (ROOF.front - ROOF.back) * u + ROOF.crown * along;
  return ROOF.down + (up - ROOF.down) * k;
};
const WHEEL_R = 4.5;
// Behind him on the ground (in the world): the crate of clean bowls (its top bowl `top` up, its sides `h`),
// the used ones beside it.
export const CRATE = { x: 145, z: -102.5, top: 4.5, h: 4 };
const USED = { x: 137.5, z: -102.5 };
// Where world point {x, z} is about the cart's middle, parked.
const fromParked = ({ x, z }) => {
  const [dx, dz, c, s] = [x - PARKED.x, z - PARKED.z, Math.cos(PARK_YAW), Math.sin(PARK_YAW)];
  return [dx * c - dz * s, dx * s + dz * c];
};
// Where its things are, about its middle. All he works with is on his side (-x), along its edge, for his arms
// are short and he cannot lean far over it (his head would be in the things on it): beside the pot the place
// a bowl is filled; his board (the stack of wrappers), the bowl of pork at its far corner; the tray the
// wontons go on as he makes them (its first place, and its places across and along), the tubs (each with
// what is in it) a row in front of it. On the far side, out of his reach, a stack of spare bowls (the ones he
// fills come from under the counter).
export const COUNTER = {
  fill: [-6, 15, 0],
  board: [-7.4, 15, 6.5],
  wrappers: [-7.4, 15, 5.2],
  filling: [-4.4, 15, 7.8],
  tray: { x: -8.4, z: 10.2, cols: 2, rows: 5, step: 1.6 }, // (`cols` across, along x; `rows` along z)
  stack: [3.2, 15, 14],
  tubs: [
    ["onion", "#6fae3e"],
    ["shrimp", "#f2a08a"],
    ["laver", "#2f3a2c"],
  ].map(([name, color], i) => ({ name, color, at: [-4.4, 15, 11 + i * 2.5] })),
  lamp: [0, 47, -10],
  lantern: [-1.2, 44, 18.2], // (at the canopy's back corner: out of the way of the customers' heads)
};
export const STALL_POT = POT;

// The colours of the stall's own things.
const PALETTE = paletteOf({
  frame: "#c0392b",
  frameDark: "#922b21",
  tyre: "#232325",
  rim: "#c9ced1",
  hub: "#8c9396",
  steel: "#c9cfd2",
  steelLight: "#e1e6e8",
  steelDark: "#9aa2a6",
  steelEdge: "#b2babd",
  pole: "#8a9296",
  saddle: "#2b2526",
  grip: "#1e1e20",
  pot: "#d7dbdc",
  potDark: "#a9afb1",
  potRim: "#eef1f1",
  burner: "#2a2b2d",
  board: "#d7b27c",
  boardDark: "#b88f58",
  wrapper: "#f3e3b4",
  wrapperEdge: "#e2cf98",
  pork: "#e79f95",
  porkLight: "#f2bdb3",
  bamboo: "#d8c27a",
  enamel: "#f4f3ee",
  enamelRim: "#3f63b8",
  tub: "#f0f3f4",
  tubRim: "#d8dee0",
  laver: "#2f3a2c",
  shrimp: "#f2a08a",
  onion: "#6fae3e",
  bowl: "#f7f5ef",
  bowlBand: "#3f63b8",
  plastic: "#d9352b",
  plasticDark: "#b52a22",
  plasticLight: "#ee5a4c",
  tableTop: "#e8d9b8",
  tableEdge: "#c8b890",
  tableLeg: "#7b8286",
  basket: "#b8874f",
  basketDark: "#93683a",
  thermos: "#3f8a6a",
  thermosCap: "#e9e4d8",
  chili: "#b2261b",
  chiliJar: "#f1e9e0",
  vinegar: "#3b2a22",
  napkin: "#f9f9f6",
  napkinBox: "#e05a6a",
  crate: "#2f7fc1",
  crateDark: "#23649a",
  basin: "#a7b0b4",
  basinWater: "#cfe1e6",
  shade: "#2f6b4f",
  shadeIn: "#f2efe0",
  lanternRed: "#d42a20",
  lanternDark: "#a91d16",
  gold: "#e2b13c",
  tassel: "#c9221a",
  cloth: "#ee7a2b",
  rag: "#9ec3e0",
});

/* ---------------------------------------------------------------------------------------------------------- */
/* Brushed characters (STKaiti, thickened): 32 x 32, a hex digit of ink a texel, row by row. */

const GLYPHS = {
  泡: "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001bd710000000000000000000000000003fffb0000000000000000000015410005ffff10000000000000000000bffd500bfff613000000000000000000affff14fffd9efc400000000000000001dfff4dfffffffff400000000000000003dfccffffffffff70000000000000120025cffebd83cffd10000000000002dfc608fffabec5bff900000000000002ffff6affffffffeff8000000000000009fefc2affffffeeff6000000000000001cffedfffffffffff40000000000000001acefffffffffffe1000000000000000005ffdeffffdfff8008900000000000001eff7efe9618e9003ff30000000000009ffc2ffc000020007ff5000000000017fff61ffe00000000cff600000000008fffe10dff71000249fff900000000008fffa009fffdccdefffffc00000000003fff5003fffffffffffff700000000000bff20005efffffffffd70000000000001a70000016abcba86310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  馄: "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000adb50000000003100000000000000001ffff30000259dfe81000000000000000cfff13cbcfffffffb000000000000001eff72bfffffeeffff100000000000005fffbeffffffedfff800000000000000afffffffffffffffe000000000000002efffffffffffffffa000000000000008ffecffe9efffffff500000000000001efffefd30cffffffe300000000000008fffffe1159ffeffedfc400000000003fff9ffc0cffb27ffeefff2000000000bff82ffc0bffdacffffffd1000000003ffb03ffb03fffffffffd71000000000198004ffa26ffffeffe6104c40000000000005ffeffffedeffb000bfa0000000000009ffffffffffffb000cfc000000000003ffffefffffaefd448fff200000000006fefc6ffff50dffffffff600000000002ffd13fff4006ffffffff3000000000005a2008c400004adeec930000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  饨: "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000189500000000000000000000164000004fffa00000000000000000009ffc20001efff2000000000000000000afef70000bffc0000000000000000000afff200009ffa0000000000000000000dff8120009ff94640000000000000003fffbeea208ffffff7000000000000008fffffffd8effffff800000000000001efffffffffffffff9000000000000006ffffeff8befff79feb1000000000001dffffffa783aff27fff6000000000008ffefff65ff98ffbdffe200000000003efe4eff13ffedffffff700000000000bff50efe17fffffffffe1000000000005b401dfe0cffffff58e505a10000000000001efe6effddff20100cf70000000000002fffffe809ff30001efa0000000000008ffffd2009ff60018ffd100000000002ffffb10107fffcceffff300000000001effb000002effffffffd1000000000007fb10000004dffffffb20000000000000200000000015799730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  福: "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004310000000011000000000000000000affe7000026bdec20000000000000000bffff509dffffff700000000000000001cfff82ffffffea10000000000000000019ee406bdeefd500000000000000000006c71a99deffffb10000000000012358cfffeffffffffff200000000002dffffffffddffffffff6000000000003ffffffffe28fffffff900000000000006efbbfff502fffffffdb5000000000000221dfffab8dfffffffffa0000000000000bffffffffffffffffff3000000000009fffffffffeffffbeffd100000000008fffffecfffdffffffff700000000008fffbefb0dfffffffefff50000000009fff83ffb0cffceffa8fff4000000000cfd505ffb0bffceffeffff2000000000241008ffc0affffffffffd000000000000000bffb08ffecb8afffa0000000000000009ff903ff50001fff40000000000000003ef40045000009e70000000000000000023000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
};
// Character `ch` drawn on `g` in a `size` px square at (x, y), in `color`.
function drawGlyph(g, ch, x, y, size, color) {
  const ink = GLYPHS[ch];
  const c = Object.assign(document.createElement("canvas"), { width: 32, height: 32 });
  const cg = c.getContext("2d");
  const img = cg.createImageData(32, 32);
  const rgb = new THREE.Color(color);
  for (let i = 0; i < 1024; i++) {
    img.data.set([rgb.r * 255, rgb.g * 255, rgb.b * 255, parseInt(ink[i], 16) * 17], i * 4);
  }
  cg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(c, x, y, size, size);
}

/* ---------------------------------------------------------------------------------------------------------- */
/* Pictures: the cloths, the valance, the menu, the code to pay by, the lantern's character, the awning's canvas. */

const textures = {
  // An orange cloth, its hem a little frayed, a character brushed on it.
  cloth: (ch) =>
    pixelTexture(64, 72, (g, w, h) => {
      g.fillStyle = PALETTE.cloth;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,0.07)";
      for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
      g.fillStyle = "#c95d1a";
      g.fillRect(0, 0, w, 5); // (folded over the rail)
      for (let x = 0; x < w; x += 3) g.fillRect(x, h - 2 - ((x * 7) % 3), 2, 3);
      drawGlyph(g, ch, 6, 12, 52, "#1d1712");
    }),
  // The valance: red, its name in cream and gold, a cream piping, scallops along its foot (cut out: alpha).
  valance: () =>
    pixelTexture(256, 38, (g, w) => {
      const band = 28;
      g.clearRect(0, 0, w, 38);
      g.fillStyle = "#b8231c";
      g.fillRect(0, 0, w, band);
      for (let x = 0; x < w; x += 16) {
        g.beginPath();
        g.arc(x + 8, band, 8, 0, Math.PI);
        g.fill();
      }
      g.fillStyle = "#f3e2b8";
      g.fillRect(0, 1, w, 2);
      g.fillRect(0, band - 3, w, 1);
      g.fillStyle = "#f6e7c1";
      g.font = "bold 15px 'Trebuchet MS', 'Segoe UI', sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("BUBBLE  WONTONS", w / 2, band / 2 + 1);
      for (const [x, ch] of [
        [8, "泡"],
        [28, "泡"],
        [w - 48, "馄"],
        [w - 28, "饨"],
      ])
        drawGlyph(g, ch, x, 4, 20, "#f2c94c");
    }),
  // The canvas: red and cream stripes (`n` of each) running from the back to the front.
  canvas: (n) =>
    pixelTexture(2 * n, 2, (g) => {
      for (let i = 0; i < 2 * n; i++) {
        g.fillStyle = i % 2 ? "#f3e9d2" : "#c8352b";
        g.fillRect(i, 0, 1, 2);
      }
    }),
  // The ends' little valances: the stripes, scalloped at the foot.
  ends: (n) =>
    pixelTexture(16 * n, 14, (g, w) => {
      g.clearRect(0, 0, w, 14);
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? "#f3e9d2" : "#c8352b";
        g.fillRect(i * 16, 0, 16, 7);
        g.beginPath();
        g.arc(i * 16 + 8, 7, 8, 0, Math.PI);
        g.fill();
      }
    }),
  menu: () =>
    pixelTexture(64, 80, (g, w, h) => {
      g.fillStyle = "#7a5233";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#26302b";
      g.fillRect(4, 4, w - 8, h - 8);
      ["泡", "泡", "馄", "饨"].forEach((ch, i) => drawGlyph(g, ch, 7 + i * 13, 8, 14, "#f4f1e6"));
      g.fillStyle = "#f4f1e6";
      g.textAlign = "center";
      const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
      g.font = `bold 9px ${HAND}`;
      g.fillText("bubble wontons", w / 2, 33);
      g.font = `bold 17px ${HAND}`;
      g.fillStyle = "#f6d36a";
      g.fillText("$9", w / 2, 52);
      g.font = `bold 8px ${HAND}`;
      g.fillStyle = "#f4f1e6";
      g.fillText("+ egg $2", w / 2, 66);
    }),
  qr: () =>
    pixelTexture(32, 40, (g, w, h) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#2fae5f";
      g.fillRect(0, 0, w, 7);
      g.fillStyle = "#1b1b1b";
      let seed = 11;
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let y = 0; y < 21; y++)
        for (let x = 0; x < 21; x++) {
          const finder = (cx, cy) => Math.max(Math.abs(x - cx), Math.abs(y - cy));
          const f = [finder(3, 3), finder(17, 3), finder(3, 17)].find((d) => d <= 3);
          const on = f !== undefined ? f !== 2 : rand() < 0.48;
          if (on) g.fillRect(5 + x, 11 + y, 1, 1);
        }
    }),
  fu: () =>
    pixelTexture(32, 32, (g) => {
      g.clearRect(0, 0, 32, 32);
      g.fillStyle = PALETTE.gold;
      g.translate(16, 16);
      g.rotate(Math.PI / 4);
      g.fillRect(-10, -10, 20, 20);
      g.setTransform(1, 0, 0, 1, 0, 0);
      drawGlyph(g, "福", 4, 4, 24, "#b3150f");
    }),
};

// A soft round glow, for the bulbs and the lamp at night.
function glowTexture() {
  const c = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------------------------------------------------------------------------------------------------- */

// A wheel in the y-z plane about its own axle (x), `w` voxels wide at x0: tyre, rim, spokes, hub; in half
// voxels.
function wheel(x0, w = 2) {
  const p = part();
  const R = WHEEL_R / HALF;
  for (let x = 0; x < w / HALF; x++)
    for (let y = -R; y <= R; y++)
      for (let z = -R; z <= R; z++) {
        const d = Math.hypot(y, z);
        if (d > R + 0.3) continue;
        const a = Math.atan2(y, z);
        const spoke = Math.abs(Math.sin(a * 3)) < 0.18;
        const color = d > R - 1.6 ? "tyre" : d > R - 2.6 ? "rim" : d < 1.6 ? "hub" : spoke && (x === 0 || x === w / HALF - 1) ? "rim" : null;
        if (color) p.add(x0 / HALF + x, y, z, color);
      }
  return meshOf(p, HALF, PALETTE);
}

// The stall, a part at a time (a yield after each, as the other builders); returns it.
export function* buildingStall(shared) {
  const { clock } = shared;
  const group = new THREE.Group(); // (the builder's: the furniture and the strings of bulbs are in the world)
  const cart = new THREE.Group(); // everything that goes with the tricycle
  group.add(cart);
  const shadowy = (m, cast = true) => Object.assign(m, { castShadow: cast, receiveShadow: true });
  const H = (v) => Math.round(v / HALF);

  /* ----- the tricycle and its cabinet, in whole voxels ----- */
  const body = part();
  // The chassis under the cabinet (the back wheels are in under it).
  box(body, [-7, 6], [4, 4], [-17, 16], "frameDark");
  // The cabinet: brushed steel, panelled; the counter's slab over it, a lip round its edge.
  box(body, CAB.x, CAB.y, CAB.z, (x, y, z) => {
    if (y === CAB.y[0]) return "steelDark";
    if (x === CAB.x[1] && (z === CAB.z[0] || z === CAB.z[1] || z === 0)) return "steelEdge";
    if (x === CAB.x[1] && y === 9) return "steelEdge";
    return (z + y) % 5 === 0 ? "steelLight" : "steel";
  });
  const burner = { has: (x, y, z) => Math.hypot(x - POT.x, z - POT.z) < POT.r + 0.6 }; // (the hole the pot sits down in)
  box(body, [-9, 8], [TOP, TOP], [-18, 17], (x, y, z) => (x === 8 || x === -9 || z === 17 || z === -18 ? "steelEdge" : "steelLight"), [burner]);
  // The front: a tube from the cabinet's front up to the head, the fork down to the front wheel, the seat
  // post and its saddle, the handlebars, the cranks' bracket; a basket on the front with a flask in it.
  for (let k = 0; k <= 10; k++) {
    const [z, y] = [17 + k, 6 + Math.round(k * 0.7)];
    box(body, [-1, 0], [y, y + 1], [z, z], "frame");
  }
  for (let y = 5; y <= 14; y++) body.add(0, y, 21, "frame"); // the seat post
  box(body, [-2, 1], [15, 15], [19, 22], "saddle");
  box(body, [-1, 0], [16, 16], [19, 21], "saddle");
  for (let y = 13; y <= 20; y++) body.add(0, y, 27, "frameDark"); // the head and the stem
  box(body, [-6, 5], [20, 20], [26, 26], "frameDark");
  for (const x of [-7, -6, 5, 6]) body.add(x, 20, 26, "grip");
  for (let k = 0; k <= 8; k++) body.add(0, 13 - k, 27 + Math.round(k * 0.25), "frameDark"); // the fork
  box(body, [-1, 0], [5, 5], [21, 23], "frameDark");
  box(body, [-3, 2], [17, 21], [28, 31], (x, y, z) => (y === 21 || (x + y + z) % 2 ? "basket" : "basketDark"));
  box(body, [-1, 0], [20, 24], [29, 30], (x, y) => (y === 24 ? "thermosCap" : "thermos"));
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * 0.15 + Math.PI * 0.7 * (k / 10);
    body.add(0, Math.round(4.5 + 5.6 * Math.sin(a)), Math.round(29 + 5.6 * Math.cos(a)), "frame"); // its mudguard
  }
  // A rag over the cabinet's end.
  box(body, [-3, 2], [9, 13], [-18, -18], (x, y) => ((x + y) % 3 ? "rag" : "#b6d4ea"));
  const bodyMesh = shadowy(meshOf(body, 1, PALETTE));
  cart.add(bodyMesh);

  // The wheels, turning as it rolls (about x); the cranks, as he pedals.
  const backWheels = [-8, 5].map((x0) => {
    const m = shadowy(wheel(x0));
    m.position.set(0, WHEEL_R, -9);
    cart.add(m);
    return m;
  });
  const frontWheel = shadowy(wheel(-1));
  frontWheel.position.set(0, WHEEL_R, 29);
  cart.add(frontWheel);
  const cranks = shadowy(
    meshOf(
      (() => {
        const p = part();
        box(p, [-4, -3], [0, 0], [-5, 0], "frameDark");
        box(p, [2, 3], [0, 0], [0, 5], "frameDark");
        box(p, [-6, -4], [0, 0], [-6, -5], "grip");
        box(p, [4, 6], [0, 0], [5, 6], "grip");
        return p;
      })(),
      HALF,
      PALETTE
    )
  );
  cranks.position.set(0, 5, 22);
  cart.add(cranks);
  yield;

  /* ----- on the counter, in half voxels: the pot, the board, the tray, the tubs, the bowls' stack ----- */
  // The pot: spun aluminium, a rolled rim, smooth (as the water in it); its two handles; the burner's dark
  // mouth round it.
  const potMesh = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, POT.bottom],
        [POT.r - 0.3, POT.bottom],
        [POT.r, POT.bottom + 0.5],
        [POT.r, POT.rim - 0.4],
        [POT.r + 0.3, POT.rim],
        [POT.r + 0.05, POT.rim + 0.3],
        [POT.r - 0.45, POT.rim + 0.1],
        [WATER_R + 0.2, POT.rim - 0.5],
        [WATER_R + 0.2, POT.bottom + 2],
        [0, POT.bottom + 2],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      40
    ),
    new THREE.MeshPhongMaterial({ color: 0xb9bfc2, shininess: 80, specular: 0x8a8a8a })
  );
  potMesh.position.set(POT.x, 0, POT.z);
  cart.add(shadowy(potMesh));
  const handles = part();
  for (const s of [-1, 1]) box(handles, [-1, 1], [H(POT.rim) - 3, H(POT.rim) - 2], [s * (H(POT.r) + 1), s * (H(POT.r) + 2)], "potDark");
  const handleMesh = meshOf(handles, HALF, PALETTE);
  handleMesh.position.set(POT.x, 0, POT.z);
  cart.add(handleMesh);
  const mouth = new THREE.Mesh(
    new THREE.RingGeometry(POT.r - 0.1, POT.r + 0.9, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x1c1c1e })
  );
  mouth.position.set(POT.x, TOP + 0.53, POT.z);
  cart.add(mouth);
  const fine = part();
  // The board, the wrappers on it in a stack, the bowl of pork with the blade in it.
  const b = COUNTER.board.map(H);
  box(fine, [b[0] - 3, b[0] + 3], [b[1], b[1]], [b[2] - 5, b[2] + 5], (x, y, z) => ((x + z) % 9 === 0 ? "boardDark" : "board"));
  const w = COUNTER.wrappers.map(H);
  box(fine, [w[0] - 2, w[0] + 2], [w[1] + 1, w[1] + 1], [w[2] - 2, w[2] + 2], "wrapper");
  const f = COUNTER.filling.map(H);
  for (let y = 0; y <= 3; y++)
    for (let dx = -4; dx <= 4; dx++)
      for (let dz = -4; dz <= 4; dz++) {
        const d = Math.hypot(dx, dz);
        const r = 2.6 + y * 0.45;
        if (d > r + 0.3) continue;
        fine.add(f[0] + dx, f[1] + 1 + y, f[2] + dz, y === 3 ? (d < r - 1 ? (Math.random() < 0.3 ? "porkLight" : "pork") : "bowlBand") : "bowl");
      }
  box(fine, [f[0] + 2, f[0] + 2], [f[1] + 4, f[1] + 9], [f[2] + 1, f[2] + 1], "bamboo");
  // The tray the wontons go on: white enamel, a blue rim.
  const T = COUNTER.tray;
  const [tx0, tz0, tx1, tz1] = [H(T.x - 0.8), H(T.z - 0.8), H(T.x + (T.cols - 1) * T.step + 0.8), H(T.z + (T.rows - 1) * T.step + 0.8)];
  box(fine, [tx0, tx1], [H(15), H(15) + 1], [tz0, tz1], (x, y, z) =>
    y === H(15) + 1 && (x === tx0 || x === tx1 || z === tz0 || z === tz1) ? "enamelRim" : y === H(15) + 1 ? null : "enamel"
  );
  // The tubs along the front, each with what goes in a bowl first.
  for (const { name, at } of COUNTER.tubs) {
    const [x, y, z] = at.map(H);
    box(fine, [x - 2, x + 2], [y + 1, y + 4], [z - 2, z + 2], (vx, vy, vz) =>
      vy === y + 4 ? (Math.abs(vx - x) < 2 && Math.abs(vz - z) < 2 ? name : "tubRim") : "tub"
    );
  }
  // On the trays's own voxels, a few nulls fall out (the tray's inside is its bottom): drop them.
  const kept = part();
  for (const [x, y, z, c] of fine.list()) if (c) kept.add(x, y, z, c);
  const counterMesh = shadowy(meshOf(kept, HALF, PALETTE));
  cart.add(counterMesh);
  // A stack of clean bowls, upside down (on its own, to wobble when knocked).
  const stackPart = part();
  for (let k = 0; k < 4; k++)
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) {
        const d = Math.hypot(dx, dz);
        const r = 6.2 - (k === 3 ? 1.5 : 0);
        if (d <= r) stackPart.add(dx, 1 + k * 2, dz, d > r - 0.8 && k % 2 ? "bowlBand" : "bowl");
      }
  const stackMesh = shadowy(meshOf(stackPart, HALF, PALETTE));
  stackMesh.position.set(...COUNTER.stack);
  cart.add(stackMesh);
  const stackSwing = swinging(2.2, 2.5, [0.06, 0.06]);
  yield;

  /* ----- the canopy: the awning on its poles, the valance and its bulbs, the lamp, the lantern; the cloths ----- */
  // The awning: striped canvas over a frame of rails, its shape (raised, or wound down flat) set by raise().
  const awning = new THREE.Group();
  cart.add(awning);
  const [AW, AL] = [ROOF.x1 - ROOF.x0, ROOF.z1 - ROOF.z0];
  const canvasTex = textures.canvas(8).tex;
  const roofGeometry = new THREE.PlaneGeometry(AW, AL, 10, 24).rotateX(-Math.PI / 2).translate((ROOF.x0 + ROOF.x1) / 2, 0, (ROOF.z0 + ROOF.z1) / 2);
  // (the stripes run along x, from the back to the front: the texture's across, along z)
  {
    const uv = roofGeometry.attributes.uv;
    const pos = roofGeometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getZ(i) - ROOF.z0) / AL, 0.5);
  }
  const roof = shadowy(new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ map: canvasTex, side: THREE.DoubleSide })));
  awning.add(roof);
  const roofFlat = roofGeometry.attributes.position.array.slice(); // (x, z kept; y set by raise())
  // The valance along the front, and the little ones at the ends; the rails under the canvas's edges.
  const valanceTex = textures.valance().tex;
  valanceTex.magFilter = valanceTex.minFilter = THREE.LinearFilter;
  const valance = new THREE.Mesh(
    new THREE.PlaneGeometry(AL, 5.6).translate(0, -2.8, 0),
    new THREE.MeshLambertMaterial({ map: valanceTex, side: THREE.DoubleSide, alphaTest: 0.5 })
  );
  valance.rotation.y = Math.PI / 2;
  awning.add(shadowy(valance, false));
  const endsTex = textures.ends(9).tex;
  const ends = [ROOF.z0, ROOF.z1].map((z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(AW, 1.8).translate(0, -0.9, 0), new THREE.MeshLambertMaterial({ map: endsTex, side: THREE.DoubleSide, alphaTest: 0.5 }));
    m.userData.z = z;
    awning.add(shadowy(m, false));
    return m;
  });
  const railMat = new THREE.MeshLambertMaterial({ color: 0x4a4f53 });
  const rails = [2, 8].map((x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 35.6), railMat);
    m.userData.x = x;
    awning.add(m);
    return m;
  });
  // The poles: from the counter's corners up to the rails, slim and dark, drawn out as it is wound up.
  const poles = POLES.map(([x, z]) => {
    const m = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 6).translate(0, 0.5, 0), railMat));
    m.position.set(x, TOP + 0.5, z);
    cart.add(m);
    return m;
  });
  // (what hangs from it, put up with it: the lamp, the lantern, the bulbs, the menu on its pole)
  const hung = [];
  let canopyK = 1;
  function raise(k) {
    canopyK = k;
    const p = roofGeometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, roofAt(roofFlat[i * 3], roofFlat[i * 3 + 2], k) + 0.25);
    p.needsUpdate = true;
    roofGeometry.computeVertexNormals();
    valance.position.set(ROOF.x1, roofAt(ROOF.x1, 0, k) - 0.1, (ROOF.z0 + ROOF.z1) / 2);
    valance.scale.y = 0.25 + 0.75 * k; // (folded up under it, wound down)
    for (const m of ends) {
      m.position.set((ROOF.x0 + ROOF.x1) / 2, roofAt((ROOF.x0 + ROOF.x1) / 2, m.userData.z, k), m.userData.z);
      m.rotation.z = Math.atan2(roofAt(ROOF.x1, m.userData.z, k) - roofAt(ROOF.x0, m.userData.z, k), AW);
      m.visible = k > 0.3;
    }
    for (const m of rails) m.position.set(m.userData.x, roofAt(m.userData.x, ROOF.z1, k) - 0.3, (ROOF.z0 + ROOF.z1) / 2);
    for (const m of poles) m.scale.y = Math.max(0.1, roofAt(m.position.x, ROOF.z1, k) - 0.55 - m.position.y);
    for (const m of hung) m.visible = k > 0.97;
    moved = true;
  }
  // The bulbs under the valance and up into the tree: warm, lit at dusk (their glow, as the lamp's).
  const glow = glowTexture();
  const bulbGeometry = new THREE.SphereGeometry(0.55, 8, 6);
  const bulbOn = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
  const bulbOff = new THREE.MeshLambertMaterial({ color: 0xf2eee0 });
  const haloMat = new THREE.MeshBasicMaterial({
    map: glow,
    color: 0xffc677,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.55,
  });
  const bulbs = []; // { mesh, halo }
  const haloGeometry = new THREE.PlaneGeometry(7, 7);
  function bulb(parent, x, y, z) {
    const m = new THREE.Mesh(bulbGeometry, bulbOff);
    m.position.set(x, y, z);
    const h = new THREE.Mesh(haloGeometry, haloMat);
    h.position.set(x, y, z);
    h.visible = false;
    h.userData.face = true; // (turned to the camera: update())
    parent.add(m, h);
    bulbs.push({ mesh: m, halo: h });
  }
  const string = new THREE.Group(); // the valance's string, which swings when clicked
  string.position.set(ROOF.x1 - 0.4, roofAt(ROOF.x1, 0) - 6.4, 0);
  cart.add(string);
  for (let k = 0; k < 9; k++) {
    const z = -16 + k * 4;
    bulb(string, 0, -0.6 - 0.9 * Math.sin((Math.PI * (k + 0.5)) / 9) * 0.6, z);
  }
  const wire = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 36), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
  string.add(wire);

  // The lamp over the pot: a green enamel shade on its flex, the bulb in it.
  const lamp = new THREE.Group();
  lamp.position.set(...COUNTER.lamp);
  const lampPart = part();
  for (let y = 0; y <= 3; y++)
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) {
        const d = Math.hypot(dx, dz);
        const r = 1.5 + y * 1.4;
        if (d <= r && d > r - 1.3) lampPart.add(dx, -y, dz, y === 3 ? "shadeIn" : "shade");
      }
  box(lampPart, [0, 0], [1, 26], [0, 0], "grip");
  const lampMesh = shadowy(meshOf(lampPart, HALF, PALETTE));
  lamp.add(lampMesh);
  const lampBulb = new THREE.Mesh(bulbGeometry, bulbOff);
  lampBulb.position.y = -1.2;
  lamp.add(lampBulb);
  const lampHalo = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), haloMat.clone());
  lampHalo.material.opacity = 0.42;
  lampHalo.position.y = -1.4;
  lampHalo.visible = false;
  lampHalo.userData.face = true;
  lamp.add(lampHalo);
  cart.add(lamp);
  const lampSwing = swinging(0.9, 1.4, [0.25, 0.25]);

  // The red paper lantern at the end, 福 on it, a gold top and foot and a tassel.
  const lantern = new THREE.Group();
  lantern.position.set(...COUNTER.lantern);
  const lp = part();
  ellipsoid(lp, [0, -7, 0], [5, 4.4, 5], (x, y, z) => (Math.abs(Math.atan2(z, x) * 3) % 1 < 0.18 ? "lanternDark" : "lanternRed"));
  box(lp, [-2, 2], [-2, -1], [-2, 2], "gold");
  box(lp, [-2, 2], [-13, -12], [-2, 2], "gold");
  box(lp, [0, 0], [-19, -14], [0, 0], "tassel");
  box(lp, [0, 0], [0, 22], [0, 0], "grip");
  const lanternMesh = shadowy(meshOf(lp, HALF, PALETTE));
  lantern.add(lanternMesh);
  const fuTex = textures.fu().tex;
  fuTex.magFilter = fuTex.minFilter = THREE.LinearFilter;
  const fu = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: fuTex, transparent: true }));
  fu.position.set(2.55, -3.5, 0);
  fu.rotation.y = Math.PI / 2;
  lantern.add(fu);
  const lanternGlow = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), haloMat.clone());
  lanternGlow.material.color.set(0xff5a3a);
  lanternGlow.material.opacity = 0.5;
  lanternGlow.position.y = -3.5;
  lanternGlow.visible = false;
  lanternGlow.userData.face = true;
  lantern.add(lanternGlow);
  cart.add(lantern);
  const lanternSwing = swinging(0.75, 0.9, [0.35, 0.35]);
  const stringSwing = swinging(1.1, 1.2, [0.2, 0.2]);

  // The four cloths along the counter's front, each hung from the counter's lip, swaying.
  const cloths = ["泡", "泡", "馄", "饨"].map((ch, i) => {
    const tex = textures.cloth(ch).tex;
    tex.magFilter = tex.minFilter = THREE.LinearFilter;
    const pivot = new THREE.Group();
    pivot.position.set(8.75, TOP + 0.4, 13 - i * 7.6); // (read from the left, as seen: from the front end)
    pivot.rotation.y = Math.PI / 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 7.8), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    m.position.y = -3.9;
    pivot.add(shadowy(m, false));
    cart.add(pivot);
    return { pivot, mesh: m, swing: swinging(0.8 + i * 0.07, 1.6, [0.3, 0.15]) };
  });

  // The menu on the front pole; the code to pay by on its stand on the counter.
  const menuTex = textures.menu().tex;
  menuTex.magFilter = menuTex.minFilter = THREE.LinearFilter;
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(6, 7.5), new THREE.MeshLambertMaterial({ map: menuTex }));
  menu.position.set(8.7, 27, 19.6); // (hung on the pole's outer side: clear of the heads of those fetching a bowl)
  menu.rotation.y = Math.PI / 2;
  menu.rotation.z = 0.04;
  cart.add(shadowy(menu, false));
  hung.push(menu, lamp, lantern, string);
  const qrTex = textures.qr().tex;
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), new THREE.MeshLambertMaterial({ map: qrTex }));
  qr.position.set(8, 16.2, -6); // (on a little stand on the counter's front edge, as they are: low, under their heads)
  qr.rotation.y = Math.PI / 2;
  cart.add(shadowy(qr, false));
  const qrStand = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 2.8).translate(0, 1.6, 0), new THREE.MeshLambertMaterial({ color: 0xf4f4f0 })));
  qrStand.position.set(7.7, TOP + 0.5, -6);
  cart.add(qrStand);

  // The pot's lid (on while it travels, or the flame is off), and the flame's glow round its foot.
  const lidPart = part();
  for (let dx = -15; dx <= 15; dx++)
    for (let dz = -15; dz <= 15; dz++) {
      const d = Math.hypot(dx, dz);
      if (d <= H(POT.r) + 0.4) lidPart.add(dx, Math.round(2 - (d / 15) * 2), dz, d > 13 ? "potRim" : "pot");
    }
  box(lidPart, [-2, 2], [3, 4], [-1, 1], "grip");
  const lid = shadowy(meshOf(lidPart, HALF, PALETTE));
  lid.position.set(POT.x, POT.rim + 0.3, POT.z);
  cart.add(lid);
  const flameGeometry = new THREE.RingGeometry(POT.r + 0.1, POT.r + 1.4, 40, 1).rotateX(-Math.PI / 2);
  // The lamp's light, after dark: a warm pool on the counter under it, and on the pavement before the stall.
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(15, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: glow, color: 0xffc27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  );
  pool.position.set(-1, TOP + 0.56, -1);
  pool.scale.set(0.75, 1, 1.25);
  pool.renderOrder = 2;
  cart.add(pool);
  const groundPool = new THREE.Mesh(
    new THREE.CircleGeometry(30, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: glow, color: 0xffb46a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  );
  groundPool.position.set(16, 0.08, 0);
  groundPool.scale.set(0.9, 1, 1.4);
  cart.add(groundPool);
  const flame = new THREE.Mesh(
    flameGeometry,
    new THREE.MeshBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  flame.position.set(POT.x, TOP + 0.62, POT.z);
  cart.add(flame);
  yield;

  /* ----- before it: the folding table and the stools (in the world); behind it, the bowls ----- */
  const furniture = new THREE.Group();
  group.add(furniture);
  const TB = STALL.table;
  const tablePart = part();
  {
    const [x0, x1, z0, z1, h] = [TB.x0, TB.x1, TB.z0, TB.z1, TB.h];
    box(tablePart, [x0, x1 - 1], [h, h], [z0, z1 - 1], (x, y, z) =>
      x === x0 || x === x1 - 1 || z === z0 || z === z1 - 1 ? "tableEdge" : "tableTop"
    );
    for (const x of [x0 + 1, x1 - 2]) for (let y = 0; y < h; y++) for (const z of [z0 + 1, z1 - 2]) tablePart.add(x, y, z, "tableLeg");
    box(tablePart, [x0 + 1, x1 - 2], [2, 2], [z0 + 1, z0 + 1], "tableLeg");
    box(tablePart, [x0 + 1, x1 - 2], [2, 2], [z1 - 2, z1 - 2], "tableLeg");
  }
  const tableMesh = shadowy(meshOf(tablePart, 1, PALETTE));
  furniture.add(tableMesh);
  // On it, along its far side out of the way of the bowls: a pot of spoons and chopsticks, a box of tissues
  // (the chilli oil and the vinegar below).
  const onTable = part();
  {
    const [x, z, y] = [H(TB.x0 + 6.5), H(TB.z0 + 1), H(TB.h + 0.5)];
    box(onTable, [x - 1, x + 1], [y, y + 4], [z - 1, z + 1], "bamboo");
    for (const [dx, dz, c] of [
      [0, 0, "napkin"],
      [1, -1, "bamboo"],
      [-1, 1, "napkin"],
    ])
      box(onTable, [x + dx, x + dx], [y + 5, y + 8], [z + dz, z + dz], c);
    box(onTable, [x + 3, x + 8], [y, y + 3], [z - 2, z + 2], (vx, vy) => (vy === y + 3 && Math.abs(vx - x - 5) < 2 ? "napkin" : "napkinBox"));
  }
  furniture.add(shadowy(meshOf(onTable, HALF, PALETTE)));
  // The chilli oil and the vinegar, each on its own (to rock on its foot when knocked).
  const bottle = (at, make) => {
    const p = part();
    make(p);
    const m = shadowy(meshOf(p, HALF, PALETTE));
    m.position.set(...at);
    furniture.add(m);
    return { mesh: m, swing: swinging(3, 3.5, [0.22, 0.22]) };
  };
  const bottles = [
    bottle([TB.x0 + 12, TB.h + 0.5, TB.z0 + 1.2], (p) =>
      box(p, [-1, 1], [0, 3], [-1, 1], (vx, vy) => (vy === 3 ? "chiliJar" : vy > 0 ? "chili" : "chiliJar"))
    ),
    bottle([TB.x0 + 14, TB.h + 0.5, TB.z0 + 0.7], (p) => box(p, [0, 1], [0, 5], [0, 1], (vx, vy) => (vy >= 4 ? "grip" : "vinegar"))),
  ];
  // The stools: red plastic, a round hole in the seat, the legs flaring out.
  // (at the table's two ends, side on, and on its far side facing the street)
  const STOOLS = [
    { x: TB.x0 - 6, z: -48, yaw: Math.PI / 2 }, // (back from the table's ends, the hands in their laps clear of
    { x: TB.x1 + 6, z: -48, yaw: -Math.PI / 2 }, // its edge; towards the street: a head turned, clear of the poles)
    { x: (TB.x0 + TB.x1) / 2, z: -41, yaw: Math.PI }, // (on the street side, facing the stall: clear of the tricycle's front)
  ];
  const stoolPart = part();
  for (let y = 0; y <= 14; y++) {
    const top = y >= 13;
    const r = top ? 6 : 6.4 - y * 0.12;
    for (let dx = -7; dx <= 7; dx++)
      for (let dz = -7; dz <= 7; dz++) {
        const [ax, az] = [Math.abs(dx), Math.abs(dz)];
        if (Math.max(ax, az) > r) continue;
        if (top) {
          if (Math.hypot(dx, dz) < 1.6 && y === 14) continue; // (the hole)
          stoolPart.add(dx, y, dz, y === 14 ? "plasticLight" : "plastic");
        } else if (ax >= r - 1.2 && az >= r - 1.2) stoolPart.add(dx, y, dz, "plasticDark"); // (the legs, at the corners)
        else if ((ax >= r - 0.8 || az >= r - 0.8) && y >= 10) stoolPart.add(dx, y, dz, "plastic"); // (the skirt under the seat)
      }
  }
  const stoolGeometry = meshOf(stoolPart, HALF, PALETTE);
  const stools = STOOLS.map(({ x, z, yaw }) => {
    const m = shadowy(stoolGeometry.clone());
    m.position.set(x, 0, z);
    m.rotation.order = "YXZ"; // (rocking about its own feet, turned as it stands)
    m.rotation.y = yaw;
    furniture.add(m);
    return { mesh: m, swing: swinging(2.6, 3, [0.08, 0.08]) };
  });
  furniture.visible = false;
  // The table folded flat and the stools stacked, in someone's arms (hours.js: the boy, out of the lock-up and
  // back in): drawn before their hands, a size smaller (the stack nests).
  const bundle = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const m = stoolGeometry.clone();
    m.position.y = k * 1.4;
    bundle.add(m);
  }
  const board = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1, 11, 16), new THREE.MeshLambertMaterial({ color: 0xe8d9b8 })));
  board.position.set(-4.4, 5, 0); // (on its edge, beside the stack)
  bundle.add(board);
  bundle.scale.setScalar(0.62);
  bundle.visible = false;
  group.add(bundle);
  let bundleBy = null;
  // The crate of clean bowls (blue plastic, a stack of bowls in it): on the counter where a bowl is filled while
  // it rolls (low, under his chin), on the ground behind him while he works (stall-life.js carries it there
  // and back); the used bowls he takes back, upside down on a cloth on the ground beside it.
  const crate = (() => {
    const p = part();
    box(p, [-6, 6], [0, 7], [-6, 6], (x, y, z) => {
      const side = Math.abs(x) === 6 || Math.abs(z) === 6;
      if (!side && y > 0) return null;
      return y === 7 || y === 0 ? "crateDark" : y % 3 === 1 && (x + z) % 3 !== 0 ? null : "crate";
    });
    for (let k = 0; k < 3; k++)
      for (let dx = -5; dx <= 5; dx++)
        for (let dz = -5; dz <= 5; dz++) {
          const d = Math.hypot(dx, dz);
          if (d <= 5.2 && d > 3.4) p.add(dx, 3 + k * 2, dz, d > 4.6 && k === 2 ? "bowlBand" : "bowl");
          else if (d <= 3.4 && k === 0) p.add(dx, 2, dz, "bowl");
        }
    const m = shadowy(meshOf(p, HALF, PALETTE));
    cart.add(m);
    return m;
  })();
  const used = [0, 1, 2].map((k) => {
    const p = part();
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) {
        const d = Math.hypot(dx, dz);
        if (k === 0 && Math.max(Math.abs(dx), Math.abs(dz)) <= 6) p.add(dx, 0, dz, (dx + dz) % 4 ? "rag" : "#b6d4ea"); // (the cloth)
        if (d <= 6.2) p.add(dx, 1 + k * 2, dz, d > 5.4 && k % 2 === 0 ? "bowlBand" : "bowl"); // (upside down: its rim
        if (d <= 4.6) p.add(dx, 2 + k * 2, dz, "bowl"); // below, its foot on top)
      }
    const m = shadowy(meshOf(p, HALF, PALETTE));
    const [lx, lz] = fromParked(USED);
    m.position.set(lx, 0, lz);
    m.visible = false;
    cart.add(m);
    return m;
  });
  yield;

  /* ----- the bulbs strung up into the tree ----- */
  const treeString = new THREE.Group();
  group.add(treeString);
  {
    const from = new THREE.Vector3(...turnedAt([ROOF.x1 - 0.4, roofAt(ROOF.x1, ROOF.z0) - 1.5, ROOF.z0 + 1]));
    const to = new THREE.Vector3(TREE.x - 8, 74, TREE.z + 6);
    const points = [];
    for (let k = 0; k <= 24; k++) {
      const u = k / 24;
      points.push(new THREE.Vector3().lerpVectors(from, to, u).add(new THREE.Vector3(0, -7 * Math.sin(Math.PI * u), 0)));
    }
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 30, 0.12, 4),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
    );
    treeString.add(line);
    for (let k = 1; k <= 7; k++) {
      const p = points[Math.round((k * 24) / 8)];
      bulb(treeString, p.x, p.y - 0.7, p.z);
    }
  }
  treeString.visible = false;
  yield;

  /* ----- the cooking ----- */
  const cooking = makeCooking(group, clock);
  yield;

  /* ----- the contract ----- */
  // Where a point about its middle is in the world, parked.
  function turnedAt([x, y, z]) {
    const [wx, wz] = turned([PARKED.x, PARKED.z], PARK_YAW, [x, z]);
    return [wx, y, wz];
  }
  const C = COUNTER;
  const stall = {
    group,
    cart,
    cooking,
    stools: STOOLS,
    // Where it is and which way it faces, and how far its wheels have rolled (and its cranks turned).
    at: { x: PARKED.x, z: PARKED.z, yaw: PARK_YAW },
    rolled: 0,
    place(x, z, yaw) {
      Object.assign(stall.at, { x, z, yaw });
      cart.position.set(x, 0, z);
      cart.rotation.y = yaw;
      moved = true;
    },
    roll(d) {
      stall.rolled += d;
      const a = stall.rolled / WHEEL_R;
      backWheels.forEach((m) => (m.rotation.x = a));
      frontWheel.rotation.x = a;
      cranks.rotation.x = a * 0.55;
    },
    // In the scene or not; and how it is set out: the lid on or off, the flame lit, the canopy up (1) or wound
    // down (0, or on its way), the table and the stools put out, the bulbs on (at dusk).
    shown(on) {
      cart.visible = on;
      if (!on) stall.set({ lid: true, flame: false, furniture: false, canopy: 0 });
    },
    state: { lid: true, flame: false, furniture: false, lights: false, canopy: 0 },
    set(o) {
      Object.assign(stall.state, o);
      const st = stall.state;
      if (canopyK !== st.canopy) raise(st.canopy);
      lid.visible = st.lid;
      cooking.water.visible = !st.lid;
      cooking.boil(st.flame ? 1 : 0);
      furniture.visible = st.furniture;
      treeString.visible = st.furniture; // (strung up with the table put out, taken down with it)
      moved = true;
    },
    // Its places in the world (parked): the pot's middle (the water's surface), the tray's places, his board,
    // where a bowl is filled, each tub, the bowls' stack; where he stands at each (along STALL.boss).
    spot: {
      pot: () => turnedAt([POT.x, WATER_Y, POT.z]),
      tray: (k) => turnedAt([C.tray.x + (k % C.tray.cols) * C.tray.step, 15.6, C.tray.z + Math.floor(k / C.tray.cols) * C.tray.step]),
      trayFull: C.tray.cols * C.tray.rows,
      board: () => turnedAt(C.board),
      wrappers: () => turnedAt(C.wrappers),
      filling: () => turnedAt(C.filling),
      fill: () => turnedAt(C.fill),
      tub: (name) => turnedAt(C.tubs.find((t) => t.name === name).at),
      stack: () => turnedAt(C.stack),
      bell: () => turnedAt([5, 20.5, 26]),
      roof: () => turnedAt([4, roofAt(4, 0), 0]),
      menu: () => turnedAt([8.7, 27, 19.6]),
      // Where a bowl pushed across stops at the front, for them to fetch (in line with where it is filled).
      pickup: () => [PARKED.x - 2.5, COUNTER.fill[1], PARKED.z + 5.4], // (its near rim over the counter's edge: they reach it, arms clear)
      crate: () => [CRATE.x, 0, CRATE.z], // (on the ground; its top bowl CRATE.top up)
      used: () => [USED.x, 0, USED.z],
      qr: () => turnedAt([8, 16.2, -6]),
      lamp: () => turnedAt(C.lamp),
      // Where he stands to reach `at` (world) from behind the counter.
      behind: ([x]) => [Math.min(STALL.boss.x1, Math.max(STALL.boss.x0, x)), STALL.boss.z],
      // The table's places for a bowl, before each stool; each stool's seat.
      seat: (k) => STOOLS[k],
      // (a bowl's width in from the table's edge before the stool: their arms, low as they sit, come over the
      // edge near their hands)
      place: (k) => {
        const { x, z, yaw } = STOOLS[k];
        const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
        const edge = Math.abs(fx) > 0.5 ? (fx > 0 ? TB.x0 - 0.5 : TB.x1 - 0.5) - x : (fz > 0 ? TB.z0 - 0.5 : TB.z1 - 0.5) - z;
        const d = Math.abs(edge) + 3.8;
        const inside = (v, lo, hi) => Math.min(hi - 4.1, Math.max(lo + 3.1, v)); // (a bowl's width in from every edge)
        return [inside(x + fx * d, TB.x0, TB.x1), TB.h + 0.5, inside(z + fz * d, TB.z0, TB.z1)];
      },
    },
    clickables: [],
    hides: [bodyMesh, counterMesh, potMesh, valance, lanternMesh, tableMesh, ...cloths.map((c) => c.mesh)],
    obstacles: [], // (none for good: what it stands on is its own, shop.js's floor plans)
    // The ground it takes, parked and set out (boxes [x0, x1, z0, z1]): behind it, its own, the cart, the
    // table and the stools.
    ground: [
      [113, 177, -112, -61],
      [TB.x0 - 8, TB.x1 + 8, -68, -40],
    ],
  };
  let moved = true;
  // Knocked: the lantern, the bulbs, the lamp, a cloth.
  stall.clickables.push(
    { key: "lantern", parts: [lanternMesh], can: () => cart.visible, toggle: () => knock(lanternSwing, 0.18, 0.12) },
    {
      key: "bulbs",
      parts: [string, treeString],
      can: () => cart.visible,
      toggle: () => {
        knock(stringSwing, 0.12, 0.05);
        knock(lampSwing, 0.1, 0.1);
      },
    },
    ...cloths.map((c) => ({ key: "cloth", parts: [c.mesh], can: () => cart.visible, toggle: () => knock(c.swing, 0.25, 0.08) })),
    // (the bell: he looks up at it, stall-life.js `poked`)
    { key: "bell", parts: [frontWheel], can: () => cart.visible, toggle: () => stall.poked?.("bell") },
    // The code to pay by: a beep, its screen lit up a moment.
    { key: "qr", parts: [qr, qrStand], can: () => cart.visible, toggle: () => ((beeped = clock.t), stall.poked?.("qr")) },
    { key: "bowls", parts: [stackMesh], can: () => cart.visible, toggle: () => knock(stackSwing, 0.04, 0.04) },
    ...bottles.map((b) => ({ key: "bottle", parts: [b.mesh], can: () => cart.visible && furniture.visible, toggle: () => knock(b.swing, 0.15, 0.15) })),
    // A stool no one is sat on.
    ...stools.map((st, k) => ({
      key: "stool",
      parts: [st.mesh],
      can: () => cart.visible && furniture.visible && !stall.taken?.(k),
      toggle: () => knock(st.swing, 0.06, 0.06),
    })),
    // The pot: the water swirls, the wontons in it bob and jostle; the tray: he makes another.
    { key: "pot", parts: [lid, potMesh, cooking.water], can: () => cart.visible && !stall.state.lid, toggle: () => cooking.poke() },
    { key: "tray", parts: [counterMesh], can: () => cart.visible, toggle: () => stall.poked?.("tray") }
  );
  let beeped = -Infinity;

  const v = new THREE.Vector3();
  const buffer = new THREE.Vector2();
  const sunDir = new THREE.Vector3(120, 380, 160).normalize();
  const lightNow = { sky: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color(), sunDir, lamp: new THREE.Color(), lampAt: [0, 0, 0] };
  let nightK = 0;
  Object.assign(stall, {
    // The time of day: the bulbs, the lamp and the lantern lit after dusk (and while it is set out).
    dress(night) {
      stall.night = night;
    },
    daylight(L) {
      lightNow.sky.copy(L.sky).multiplyScalar(L.skyK * 0.45);
      lightNow.ground.copy(L.ground).multiplyScalar(L.skyK * 0.3);
      lightNow.sun.copy(L.sun).multiplyScalar(L.sunK);
    },
    update(t, dt, home) {
      const lit = !!stall.night && stall.state.furniture && cart.visible;
      nightK += Math.sign((lit ? 1 : 0) - nightK) * Math.min(Math.abs((lit ? 1 : 0) - nightK), dt / 0.6);
      for (const { mesh, halo } of bulbs) {
        mesh.material = nightK > 0.5 ? bulbOn : bulbOff;
        halo.visible = nightK > 0.01;
      }
      haloMat.opacity = 0.55 * nightK;
      lampBulb.material = nightK > 0.5 ? bulbOn : bulbOff;
      lampHalo.visible = lanternGlow.visible = nightK > 0.01;
      lampHalo.material.opacity = 0.42 * nightK;
      lanternGlow.material.opacity = 0.5 * nightK * (0.92 + 0.08 * Math.sin(t * 7));
      // (the halos turned to face the camera)
      const cam = home.view.camera;
      for (const h of [...bulbs.map((b) => b.halo), lampHalo, lanternGlow]) if (h.visible) h.quaternion.copy(cam.quaternion);
      // The swings.
      for (const s of [lanternSwing, stringSwing, lampSwing]) s.step(dt);
      lantern.rotation.set(lanternSwing.x + 0.02 * Math.sin(t * 0.9), 0, lanternSwing.z);
      string.rotation.set(stringSwing.x, 0, stringSwing.z);
      lamp.rotation.set(lampSwing.x, 0, lampSwing.z);
      for (const c of cloths) {
        c.swing.step(dt);
        c.pivot.rotation.set(0, Math.PI / 2, 0);
        c.pivot.rotateX(c.swing.x + 0.03 * Math.sin(t * 1.3 + c.pivot.position.z));
      }
      if (bundleBy) {
        const [h0, h1] = bundleBy.rig.hands.map((h) => h.getWorldPosition(new THREE.Vector3()));
        const yaw = bundleBy.yaw;
        bundle.position.set((h0.x + h1.x) / 2 + 3 * Math.sin(yaw), Math.min(h0.y, h1.y) - 4.5, (h0.z + h1.z) / 2 + 3 * Math.cos(yaw));
        bundle.rotation.y = yaw;
        moved = true;
      }
      for (const b of [{ mesh: stackMesh, swing: stackSwing }, ...bottles, ...stools]) {
        b.swing.step(dt);
        b.mesh.rotation.x = b.swing.x;
        b.mesh.rotation.z = b.swing.z;
      }
      qr.material.emissive.setScalar(0.6 * Math.max(0, 1 - (t - beeped) / 0.35));
      // The flame flickering under the pot, blue at its foot.
      const fl = stall.state.flame && cart.visible ? (0.06 + 0.12 * nightK) * (1 + 0.3 * Math.sin(t * 23) + 0.2 * Math.sin(t * 37)) : 0;
      flame.material.opacity = fl;
      pool.material.opacity = 0.35 * nightK;
      pool.visible = groundPool.visible = nightK > 0.01;
      groundPool.material.opacity = 0.22 * nightK;
      // The cooking, lit by the sky and the lamp (where they are now).
      lamp.getWorldPosition(v);
      lightNow.lamp.setRGB(1, 0.82, 0.55).multiplyScalar(0.25 + 1.1 * nightK);
      lightNow.lampAt = [v.x, v.y - 1.5, v.z];
      const pos = stall.spot.pot();
      cooking.water.position.set(...pos);
      cooking.light(lightNow);
      cooking.size(home.view.renderer.getDrawingBufferSize(buffer).y);
      cooking.vent("pot", !stall.state.lid && cart.visible ? pos : null, WATER_R * 0.85, stall.state.flame ? 9 : 2);
      cooking.update(dt, { wind: 0.8, steam: 1 });
    },
    // The crate: on the counter where a bowl is filled (where it rides), or at world point p (its foot's middle)
    // turned to world `yaw`; the used bowls beside it, `n` (up to 3 shown).
    crate(p = null, yaw = 0) {
      if (!p) {
        crate.position.set(COUNTER.fill[0], TOP + 0.5, COUNTER.fill[2]);
        crate.rotation.y = 0;
      } else {
        cart.updateMatrixWorld();
        crate.position.copy(cart.worldToLocal(v.set(...p)));
        crate.rotation.y = yaw - stall.at.yaw;
      }
      moved = true;
    },
    // Who has the folded table and the stools in their arms, if anyone.
    carryTable(a) {
      bundleBy = a;
      bundle.visible = !!a;
    },
    used(n) {
      used.forEach((m, i) => (m.visible = i < n));
      moved = true;
    },
    // The lid lifted `k` of the way off the pot (0: on it), its near edge first, in his hand.
    lift(k) {
      lid.position.y = POT.rim + 0.3 + 0.8 * k;
      lid.rotation.z = -0.06 * k;
      moved = true;
    },
    // Everything shown, or as it was (shop.js warm(): its shaders compiled with the rest).
    preview(on) {
      if (on) {
        stall.was = { visible: cart.visible, state: { ...stall.state } };
        cart.visible = true;
        stall.set({ lid: false, flame: true, furniture: true, canopy: 1 });
        cooking.bowls[0].place(...turnedAt(COUNTER.fill));
        cooking.bowls[0].set({ bits: true, level: 1, onion: true });
        cooking.bowls[0].fill(3);
        bulbs.forEach((b) => (b.halo.visible = true));
        lampHalo.visible = lanternGlow.visible = pool.visible = groundPool.visible = true;
      } else {
        cart.visible = stall.was.visible;
        stall.set(stall.was.state);
        cooking.clear();
      }
    },
    shadowsDirty() {
      const m = moved || !lanternSwing.still() || !stringSwing.still() || [stackSwing, ...bottles, ...stools].some((b) => !(b.swing ?? b).still());
      moved = false;
      return m;
    },
  });
  stall.place(PARKED.x, PARKED.z, PARK_YAW);
  stall.shown(false);
  return stall;
}
