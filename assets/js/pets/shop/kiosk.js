/*******************************************************************************
 * The flower shop's kiosk (layout.js KIOSK): a market florist's stall of dark
 * green steel and glass, as in the photos. Steel-framed glass in a grid of
 * slim bars, frosted panels below the sill, painted sunflowers, daisies and
 * gerberas on some of the panes; a wide doorway, its folding glass doors
 * folded back inside against the windows either side; the number 90 on the
 * post; a flat roof and the right wall (the sides seen) cut open like a
 * dolls' house's; a flat glass awning out over the pavement on four ribs over
 * the posts, the shop's name and hours on its fascia, downlights under it.
 *
 * Inside, seen through the doorway and the glass: grey damask wallpaper,
 * "flowers for every moment" in pink neon script on the left wall over the
 * wrapping bench, the wire shelving of vases, pots, succulents and boxed
 * roses, dried flowers hung from a branch and a bucket of pampas grass in the
 * corner, the cool room's door (it swings open on a cold blue room of
 * buckets) with the clock over it and its thermometer by it, the air
 * conditioner, the notice board, the bench along the left wall (the till at
 * its front end, the kraft paper roll, ribbons on a rod, scissors, the
 * radio), a tall stool, the dog's bed, a few buckets of stock waiting by the
 * back wall.
 *
 * Things to click: the radio (music), the till (it rings), the neon sign or
 * the downlights (the lights), the OPEN / CLOSED sign, the wind chime in the
 * doorway (it chimes as anyone passes under it too), the cool room's door,
 * the air conditioner (it blows: a note on the board lifts in the draught),
 * the clock (wound round, it chimes), the dried flowers (they swing, bits
 * falling off) and the stool (it spins).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { pixelTexture } from "../room/house/kit.js";
import { part, meshOf, paletteOf, swinging, knock } from "./kit.js";
import { KIOSK, FLOOR, DOOR, SILL, LINTEL, AWNING, BENCH, SHELF, COOL, BOARD, DOG_BED, STOOL, SHUTTER, LOCKUP } from "./layout.js";

const PALETTE = paletteOf({
  roof: "#262d2a",
  frostGlass: "#dfe8e5",
  cabinet: "#ece4d4",
  cabinetShade: "#d6cbb5",
  brass: "#c9a253",
  oak: "#c99a64",
  oakDark: "#a87c4c",
  oakLight: "#ddb684",
  cork: "#c49a6c",
  corkDark: "#b08657",
  paperWhite: "#f8f6f0",
  paperYellow: "#f6e7a1",
  paperPink: "#f5cfd3",
  paperBlue: "#cfe0f0",
  paperLine: "#a9a6a0",
  pinRed: "#d9434f",
  pinBlue: "#3f6fb5",
  acWhite: "#eef0ee",
  acShade: "#cfd3d0",
  acLed: "#5bd17a",
  potPinkRib: "#e0aca8",
  potCreamRib: "#ddd2bf",
  terracotta: "#c8734f",
  terracottaDark: "#a95a3b",
  terracottaLight: "#d98d68",
  charcoal: "#3a3b3d",
  charcoalLight: "#55585c",
  glazeBlue: "#3f6fa3",
  glazeWhite: "#f3f0e8",
  sageGlaze: "#a9bf9c",
  sageGlazeDark: "#8ea883",
  ochre: "#d5a24a",
  ochreDark: "#b5832f",
  stoneware: "#e8e1d3",
  speck: "#8d8478",
  basket: "#c49a5c",
  basketDark: "#a37a42",
  eucalyptus: "#9db5a6",
  eucalyptusDark: "#7d9888",
  roseRed: "#c8283c",
  roseRedDark: "#9e1a2c",
  rosePink: "#f08fae",
  rosePinkDark: "#d56b8f",
  roseWhite: "#f4efe6",
  roseWhiteDark: "#ddd5c7",
  boomBlack: "#2a2b2e",
  boomGrey: "#64686e",
  grille: "#18191b",
  regBody: "#e9e6df",
  regShade: "#c9c5bd",
  regDark: "#3b3d42",
  keyRed: "#d9534f",
  keyGreen: "#5aa469",
  keyGrey: "#b4b8be",
  screen: "#9fd8c9",
  bedRim: "#9cae8c",
  bedRimDark: "#869a76",
  bedCushion: "#f1e8d8",
  bedCushionDot: "#e2d3ba",
  toyRed: "#d9434f",
  toyCream: "#f1e6cf",
  stockPurple: "#9b6bc4",
  stockPurpleDark: "#7e52a8",
  stockPink: "#ef9cc0",
  stockWhite: "#f5f1f6",
  ribRed: "#d23a4a",
  ribPink: "#f2a7bd",
  ribCream: "#f1e6cf",
  ribSage: "#a9bf99",
  ribGold: "#d9b04a",
  ribLilac: "#b9a3d9",
  blade: "#cfd5d8",
  handleRed: "#d9434f",
  pothos: "#5e9e48",
  pothosLight: "#86bf5c",
  plate: "#f4f2ec",
  digit: "#22392f",
  doorWindow: "#c3d6dc",
  clockFace: "#f6f1e4",
  clockHand: "#262d2a",
  lavender: "#9a86c0",
  lavenderDark: "#76639f",
  driedRose: "#c98c8f",
  driedRoseDark: "#a96f74",
  yarrow: "#dcb44e",
  yarrowDark: "#b9902f",
  gyp: "#f1ece0",
  gypDark: "#d9d1bf",
  driedStem: "#8c7a52",
  twine: "#bf9f6c",
  pampas: "#eadcc0",
  pampasDark: "#d2bf9b",
  zinc: "#aab3b7",
  zincDark: "#8b9599",
  succulent: "#86ad91",
  succulentLight: "#b0cdb2",
  succulentTip: "#d4919a",
  tag: "#fbfaf5",
  photoSky: "#bcd6e8",
  photoGrass: "#7fae6b",
  dogCream: "#f0e2c4",
  dogBrown: "#9a6a3e",
});

// Where things stand inside (the bench's top, the stool's seat), in voxels.
const TOP = FLOOR + BENCH.h; // the bench's worktop
const SEAT = FLOOR + 12; // the stool's seat
const ROOF_Y = KIOSK.h; // the roof's underside (its rim, cut open)
const MULLIONS_Z = [-97, -84, -71, -57, -44]; // the bars between the panes of the side walls
const RAILS = [SILL, 44, LINTEL]; // and across them, as on the front
const WALL = 2; // how thick the back and side walls are
const OFF = { sign: 0xeab8c6, lights: 0x9fa9a6 }; // the neon's tubes and the downlights, switched off

// Voxels at `s` voxels a voxel (1, 0.5 or 0.25), each filling [i s, (i + 1) s) along each axis, put in by the
// world ranges they fill (half open: [x0, x1) and so on).
function grid(s) {
  const p = part();
  const at = (v) => Math.round(v / s);
  const put = (i, j, k, color, ...more) => {
    const c = typeof color === "function" ? color(i * s, j * s, k * s, ...more) : color;
    if (c) p.add(i, j, k, c); // (a function giving nothing leaves the voxel out)
  };
  const g = {
    s,
    p,
    // A box filling [x0, x1) x [y0, y1) x [z0, z1); `color` a name, or a function of the voxel's corner.
    box([x0, x1], [y0, y1], [z0, z1], color) {
      for (let i = at(x0); i < at(x1); i++) for (let j = at(y0); j < at(y1); j++) for (let k = at(z0); k < at(z1); k++) put(i, j, k, color);
    },
    // A cylinder standing up round (cx, cz), radius r, from y0 to y1 (hollow inside `inner` if given).
    cyl(cx, cz, r, [y0, y1], color, inner = -1) {
      for (let i = at(cx - r); i <= at(cx + r); i++)
        for (let k = at(cz - r); k <= at(cz + r); k++) {
          const d = Math.hypot((i + 0.5) * s - cx, (k + 0.5) * s - cz);
          if (d > r || d < inner) continue;
          for (let j = at(y0); j < at(y1); j++) put(i, j, k, color, d);
        }
    },
    // A ball round (cx, cy, cz), radii r (one, or [rx, ry, rz]).
    ball([cx, cy, cz], r, color) {
      const [rx, ry, rz] = Array.isArray(r) ? r : [r, r, r];
      for (let i = at(cx - rx); i <= at(cx + rx); i++)
        for (let j = at(cy - ry); j <= at(cy + ry); j++)
          for (let k = at(cz - rz); k <= at(cz + rz); k++) {
            const [dx, dy, dz] = [((i + 0.5) * s - cx) / rx, ((j + 0.5) * s - cy) / ry, ((k + 0.5) * s - cz) / rz];
            if (dx * dx + dy * dy + dz * dz <= 1) put(i, j, k, color);
          }
    },
    // A cylinder lying along z round (cx, cy), radius r, from z0 to z1.
    rod(cx, cy, r, [z0, z1], color) {
      for (let i = at(cx - r); i <= at(cx + r); i++)
        for (let j = at(cy - r); j <= at(cy + r); j++) {
          const d = Math.hypot((i + 0.5) * s - cx, (j + 0.5) * s - cy);
          if (d > r) continue;
          for (let k = at(z0); k < at(z1); k++) put(i, j, k, color, d);
        }
    },
    // The mesh, in place; `lit` false: glowing.
    mesh(lit = true) {
      const m = meshOf(p, s, PALETTE, lit);
      m.position.set(s / 2, s / 2, s / 2);
      return m;
    },
  };
  return g;
}

// `mesh` turning about the world point `pivot` (the group to turn).
function pivoted(mesh, [px, py, pz]) {
  const g = new THREE.Group();
  g.position.set(px, py, pz);
  mesh.position.x -= px;
  mesh.position.y -= py;
  mesh.position.z -= pz;
  g.add(mesh);
  return g;
}

// A flat sheet x0..x1 by y0..y1 facing +z at z (or, `alongZ`, z0..z1 by y0..y1 facing +x at x), its texture's
// corners at the sheet's (or, `uv`, only the part [u0, u1, v0, v1] of it).
function sheet([a0, a1], [y0, y1], at, material, alongZ = false, uv = [0, 1, 0, 1]) {
  const g = new THREE.PlaneGeometry(a1 - a0, y1 - y0);
  const t = g.attributes.uv;
  for (let i = 0; i < t.count; i++) t.setXY(i, uv[0] + t.getX(i) * (uv[1] - uv[0]), uv[2] + t.getY(i) * (uv[3] - uv[2]));
  const m = new THREE.Mesh(g, material);
  if (alongZ) {
    m.rotation.y = Math.PI / 2;
    m.position.set(at, (y0 + y1) / 2, (a0 + a1) / 2);
  } else m.position.set((a0 + a1) / 2, (y0 + y1) / 2, at);
  return m;
}

// Painted flowers for the glass, pixel art (2 px a voxel), on a clear ground: a sunflower with a leaf, a
// daisy, a pink gerbera.
function flowerDecal(kind) {
  const N = 40;
  return pixelTexture(N, N, (g) => {
    const c = N / 2;
    const px = (x, y, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    };
    if (kind === "sunflower")
      for (let y = 24; y < N; y++)
        for (let x = 4; x < 22; x++) {
          const u = (x - 13) / 9;
          const v = (y - 31) / 5;
          if (Math.abs(v) < 1 - u * u && x + y > 30) px(x, y, (x + y) % 5 ? "#5f9a3a" : "#4c8030");
        }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const [dx, dy] = [x + 0.5 - c, y + 0.5 - c];
        const r = Math.hypot(dx, dy);
        const th = Math.atan2(dy, dx);
        if (kind === "sunflower") {
          const edge = 11 + 6 * Math.abs(Math.cos(th * 7)) ** 0.6;
          if (r < 6.5) px(x, y, (x * 7 + y * 3) % 4 === 0 ? "#8a5a26" : r < 3 ? "#4a2c14" : "#5c3818");
          else if (r < 8) px(x, y, "#e08a1c");
          else if (r < edge) px(x, y, r > edge - 2 ? "#f3c623" : "#f7d33a");
        } else if (kind === "daisy") {
          const edge = 9 + 8 * Math.abs(Math.cos(th * 6)) ** 0.8;
          if (r < 4.5) px(x, y, r < 2.5 ? "#e8a31c" : "#f4c430");
          else if (r < edge) px(x, y, Math.abs(Math.cos(th * 6)) < 0.25 ? "#e4e8e6" : "#ffffff");
        } else {
          const edge = 12 + 5 * Math.abs(Math.cos(th * 11)) ** 0.5;
          if (r < 3.5) px(x, y, "#5a2a1e");
          else if (r < 5.5) px(x, y, "#f6d36b");
          else if (r < edge) px(x, y, r < 8 ? "#d63e78" : Math.abs(Math.cos(th * 11)) < 0.3 ? "#e85d92" : "#f27aa6");
        }
      }
  }).tex;
}

// The back wall's wallpaper: grey damask, medallions in a half-drop, over a dark green skirting.
function damask(w, h) {
  return pixelTexture(w * 2, h * 2, (g, W, H) => {
    g.fillStyle = PALETTE.damask;
    g.fillRect(0, 0, W, H);
    g.fillStyle = PALETTE.damaskLine;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const row = Math.floor(y / 26);
        const tx = (((x + (row % 2) * 11) % 22) + 22) % 22;
        const ty = y % 26;
        const [dx, dy] = [(tx - 11) / 7, (ty - 13) / 10];
        const ring = dx * dx + dy * dy;
        const inner = Math.abs(dx) * 1.6 + Math.abs(dy) * 1.2;
        if ((ring > 0.78 && ring < 1) || (inner < 0.55 && inner > 0.35) || (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.15)) g.fillRect(x, y, 1, 1);
      }
    g.fillStyle = PALETTE.steel;
    g.fillRect(0, H - 6, W, 6); // the skirting
    g.fillStyle = PALETTE.steelLight;
    g.fillRect(0, H - 6, W, 1);
  }).tex;
}

// The floor: terrazzo, pale with chips of grey, rust, green and white.
function terrazzo(w, d) {
  let seed = 7;
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  return pixelTexture(w * 2, d * 2, (g, W, H) => {
    g.fillStyle = PALETTE.terrazzo;
    g.fillRect(0, 0, W, H);
    const chips = ["#bdb5a6", "#a89f90", "#b98a6e", "#9fae98", "#f2eee6", "#8f8a82"];
    for (let k = 0; k < W * H * 0.07; k++) {
      g.fillStyle = chips[Math.floor(rnd() * chips.length)];
      g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), 1 + (rnd() < 0.2), 1);
    }
  }).tex;
}

// The neon sign: "flowers for every moment" in a white script, a soft glow round it.
function neonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 224;
  const g = canvas.getContext("2d");
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = 150;
  const font = () => `italic 600 ${size}px "Segoe Script", "Brush Script MT", "Lucida Handwriting", "Snell Roundhand", cursive`;
  g.font = font();
  while (g.measureText("flowers for every moment").width > 960 && size > 40) {
    size -= 4;
    g.font = font();
  }
  g.shadowColor = "rgba(255, 250, 240, 0.9)";
  g.shadowBlur = 18;
  g.fillStyle = "#ffffff";
  g.fillText("flowers for every moment", 512, 112);
  g.shadowBlur = 0;
  g.fillText("flowers for every moment", 512, 112);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// The sign hung in the window: OPEN on one side, CLOSED on the other, on a kraft board.
function boardTexture(word, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 96;
  const g = canvas.getContext("2d");
  g.fillStyle = "#d9b98c";
  g.fillRect(0, 0, 160, 96);
  g.strokeStyle = "#8f6440";
  g.lineWidth = 8;
  g.strokeRect(4, 4, 152, 88);
  g.fillStyle = color;
  g.font = `bold ${word.length > 4 ? 34 : 44}px "Trebuchet MS", Arial, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(word, 80, 52);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A little picture for the floating bits: a music note, or a sparkle.
function glyphTexture(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d");
  g.font = 'bold 50px "Segoe UI Symbol", "Apple Symbols", sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 6;
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.strokeText(text, 32, 34);
  g.fillStyle = color;
  g.fillText(text, 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// One slat of the roller shutter, top to bottom (repeated up the curtain): galvanised steel, a bright edge
// where it rolls over, a groove where it hooks into the next.
function slatTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 16;
  const g = canvas.getContext("2d");
  [
    [0, 2, "#7c8588"],
    [2, 4, "#d2d8da"],
    [4, 11, "#b3bbbe"],
    [11, 14, "#9ea7aa"],
    [14, 16, "#6f777a"],
  ].forEach(([y0, y1, c]) => {
    g.fillStyle = c;
    g.fillRect(0, y0, 4, y1 - y0);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// The awning's fascia board, painted the kiosk's green, the shop's name and hours on it in cream.
function fasciaTexture(w, h) {
  const S = 8; // texels a voxel
  const canvas = document.createElement("canvas");
  canvas.width = w * S;
  canvas.height = h * S;
  const g = canvas.getContext("2d");
  g.fillStyle = "#2e4a3d";
  g.fillRect(0, 0, w * S, h * S);
  g.fillStyle = "#3d5d4d";
  g.fillRect(0, 0, w * S, S * 0.6);
  g.fillStyle = "#22392f";
  g.fillRect(0, h * S - S * 0.6, w * S, S * 0.6);
  g.fillStyle = "#efe6cf";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `bold ${3.4 * S}px "Trebuchet MS", "Segoe UI", sans-serif`;
  g.fillText("FLOWER MARKET", (w * S) / 2 - 36 * S, (h * S) / 2 + S * 0.2);
  g.font = `${3 * S}px "Trebuchet MS", "Segoe UI", sans-serif`;
  g.fillText("open every day  10am – 10pm", (w * S) / 2 + 34 * S, (h * S) / 2 + S * 0.2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Built a part at a time (a yield after each: shop.js spreads the work over frames); returns the kiosk.
export function* buildingKiosk(shared) {
  const { clock } = shared;
  const group = new THREE.Group();
  const add = (o, cast = true, receive = true) => {
    o.castShadow = cast;
    o.receiveShadow = receive;
    group.add(o);
    return o;
  };

  /* ----- the shell: floor slab, walls of steel and frosted glass, the roof's rim ----- */

  let shell = grid(1); // (meshed in three parts, a frame's work each)
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = KIOSK;
  // The floor slab: only its edges (the terrazzo sheet lies over the rest), a steel nosing at the step.
  shell.box([X0, X1], [0, FLOOR], [Z1 - 1, Z1], "steel");
  shell.box([X0, X1], [0, FLOOR], [Z0, Z0 + WALL], "concreteDark");
  for (const x of [X0, X1 - WALL]) shell.box([x, x + WALL], [0, FLOOR], [Z0, Z1 - 1], "concreteDark");
  // The back wall (an opening for the cool room's door), its top capped in steel: plain blocks under the
  // capping (the wallpaper covers their face: voxels there would only be work to make).
  shell.box([X0, X1], [ROOF_Y - 1, ROOF_Y], [Z0, Z0 + WALL], "steel");
  const wallMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.damask });
  for (const [x0, x1, y0] of [
    [X0, COOL.x0, 0],
    [COOL.x1, X1, 0],
    [COOL.x0, COOL.x1, 49],
  ]) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, ROOF_Y - 1 - y0, WALL), wallMaterial);
    block.position.set((x0 + x1) / 2, (y0 + ROOF_Y - 1) / 2, Z0 + WALL / 2);
    add(block);
  }
  // The cool room door's steel frame, standing a little proud of the wall.
  shell.box([COOL.x0 - 2, COOL.x0], [0, 51], [Z0 + WALL, Z0 + WALL + 1], "steel");
  shell.box([COOL.x1, COOL.x1 + 2], [0, 51], [Z0 + WALL, Z0 + WALL + 1], "steel");
  shell.box([COOL.x0 - 2, COOL.x1 + 2], [49, 51], [Z0 + WALL, Z0 + WALL + 1], "steel");
  const backMesh = add(shell.mesh());
  yield;
  shell = grid(1);
  // A wall of steel-framed glass along one side (`alongZ`: the left or the right wall, at x from a0 to a1 in z,
  // `t` its thickness at `at`), or the front: bars `bars` between the panes up to the roof, rails across them
  // (as in the photos, no deep band at the top: it would hide the bench behind the front); below the sill
  // frosted panels; above it frosted glass (`frosted`: the left wall, seen from inside, all milky) or nothing
  // (the clear glass is a sheet of its own). `low`: cut off at the sill, as a dolls' house's near wall is.
  function glazed(alongZ, at, t, [a0, a1], bars, frosted, low = false) {
    const put = (a, b, [y0, y1], color) =>
      alongZ ? shell.box([at, at + t], [y0, y1], [a, b], color) : shell.box([a, b], [y0, y1], [at, at + t], color);
    put(a0, a1, [0, 2], "steel"); // the base rail
    put(a0, a1, [2, SILL], (x, y) => (y === 2 ? "frostedShade" : "frosted"));
    if (low) return put(a0, a1, [SILL, SILL + 1], "steel");
    RAILS.forEach((y) => put(a0, a1, [y, y + 1], "steel"));
    put(a0, a1, [ROOF_Y - 1, ROOF_Y], "steel"); // the rail along the top
    for (const b of bars) put(b, b + 1, [SILL, ROOF_Y], "steel");
    if (frosted) put(a0, a1, [SILL + 1, ROOF_Y - 1], (x, y, z) => ((alongZ ? z : x) === a0 ? "steel" : y % 9 === 0 ? "frostedShade" : "frostGlass"));
  }
  glazed(true, X0, WALL, [Z0, Z1], MULLIONS_Z, true); // the left wall
  glazed(true, X1 - WALL, WALL, [Z0, Z1], MULLIONS_Z, false, true); // the right wall, cut down to see in
  const sidesMesh = add(shell.mesh());
  yield;
  shell = grid(1);
  glazed(false, Z1 - 1, 1, [X0, DOOR.x0], [-135, -122, -109], false); // the front: the window bay left of the door
  glazed(false, Z1 - 1, 1, [DOOR.x1, X1], [-18], false); // and the narrow one right of it
  // Over the doorway: its head, a glazed transom over it (two bars), the rail along the top.
  shell.box([DOOR.x0, DOOR.x1], [LINTEL, LINTEL + 1], [Z1 - 1, Z1], "steel");
  shell.box([DOOR.x0, DOOR.x1], [ROOF_Y - 1, ROOF_Y], [Z1 - 1, Z1], "steel");
  for (const x of [-75, -55]) shell.box([x, x + 1], [LINTEL, ROOF_Y], [Z1 - 1, Z1], "steel");
  // The posts, full height and a little proud: the corners, and either side of the doorway.
  for (const x of [X0, DOOR.x0 - 2, DOOR.x1, X1 - 2]) shell.box([x, x + 2], [0, ROOF_Y], [Z1 - 1, Z1 + 1], "steelDark");
  for (const z of [Z0, Z1 - 2]) shell.box([X1 - 2, X1], [0, ROOF_Y], [z, z + 2], "steelDark");
  // The flat roof, cut open over the shop: its rim along the back and the left, dark on top; along the front
  // only a thin steel edge, to see in over it (and none along the right, cut down).
  const rim = (xs, zs) => shell.box(xs, [ROOF_Y, ROOF_Y + KIOSK.roof - 1], zs, (x, y) => (y === ROOF_Y + KIOSK.roof - 2 ? "roof" : "steel"));
  rim([X0, X1], [Z0, Z0 + 4]);
  rim([X0, X0 + 4], [Z0, Z1]);
  shell.box([X0, X1], [ROOF_Y, ROOF_Y + 1], [Z1 - 2, Z1], "steel");
  const shellMesh = add(shell.mesh());

  // The wallpaper on the back wall (round the cool room's door) and the floor's terrazzo, as textures.
  const [WX0, WX1, WY0, WY1] = [X0 + WALL, X1 - WALL, FLOOR, ROOF_Y - 1];
  const paper = new THREE.MeshLambertMaterial({ map: damask(WX1 - WX0, WY1 - WY0) });
  const uvOf = (x0, x1, y0, y1) => [(x0 - WX0) / (WX1 - WX0), (x1 - WX0) / (WX1 - WX0), (y0 - WY0) / (WY1 - WY0), (y1 - WY0) / (WY1 - WY0)];
  const wallAt = Z0 + WALL + 0.02;
  for (const [x0, x1, y0, y1] of [
    [WX0, COOL.x0 - 2, WY0, WY1],
    [COOL.x1 + 2, WX1, WY0, WY1],
    [COOL.x0 - 2, COOL.x1 + 2, 51, WY1],
  ])
    add(sheet([x0, x1], [y0, y1], wallAt, paper, false, uvOf(x0, x1, y0, y1)), false, true);
  const floor = sheet(
    [X0 + WALL, X1 - WALL],
    [Z0 + WALL, Z1 - 1],
    0,
    new THREE.MeshLambertMaterial({ map: terrazzo(X1 - X0 - 2 * WALL, Z1 - 1 - Z0 - WALL) })
  );
  floor.rotation.set(-Math.PI / 2, 0, 0);
  floor.position.set((X0 + X1) / 2, FLOOR + 0.03, (Z0 + WALL + Z1 - 1) / 2);
  add(floor, false, true);

  yield;
  /* ----- glass: one plain, faintly green tinted sheet for every clear pane ----- */
  // (Sheets drawn in one pass, which they look the same in: three.js's two for what is see-through and
  // two-sided find it a shader afresh twice a draw. So the awning's glass and the cool room's curtain too.)

  const glass = new THREE.MeshBasicMaterial({
    color: 0xbfe0d6,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true,
  });
  const panes = [
    sheet([X0 + 2, DOOR.x0 - 2], [SILL + 1, ROOF_Y - 1], Z1 - 0.5, glass),
    sheet([DOOR.x1 + 2, X1 - 2], [SILL + 1, ROOF_Y - 1], Z1 - 0.5, glass),
    sheet([DOOR.x0, DOOR.x1], [LINTEL + 1, ROOF_Y - 1], Z1 - 0.5, glass), // (the transom)
  ];
  panes.forEach((m) => add(m, false, false));

  // The flowers painted on the glass: on the front windows outside (seen from the pavement), and on the left
  // wall's frosted panes inside, clear of the neon.
  const decals = { sunflower: flowerDecal("sunflower"), daisy: flowerDecal("daisy"), gerbera: flowerDecal("gerbera") };
  const decalMat = Object.fromEntries(
    Object.entries(decals).map(([k, tex]) => [k, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide })])
  );
  const decal = (kind, [a, y], size, at, alongZ) =>
    add(sheet([a - size / 2, a + size / 2], [y - size / 2, y + size / 2], at, decalMat[kind], alongZ), false, false);
  decal("sunflower", [-141.5, 53], 14, Z1 + 0.05, false);
  decal("gerbera", [-25.5, 53], 13, Z1 + 0.05, false);
  decal("daisy", [-9.5, 36], 12, Z1 + 0.05, false);
  decal("daisy", [-63.5, 36], 12, X0 + WALL + 0.05, true);
  decal("gerbera", [-49, 35], 13, X0 + WALL + 0.05, true);
  decal("sunflower", [-37.5, 52], 15, X0 + WALL + 0.05, true);

  yield;
  /* ----- the folding glass doors, folded back inside against the windows either side of the doorway ----- */

  let fine = grid(0.5); // the small things, in half voxels (in two meshes, a frame's work each)
  const doorPanes = [];
  for (const [x0, x1] of [
    [DOOR.x0 - 13, DOOR.x0],
    [DOOR.x1, DOOR.x1 + 13],
  ])
    [Z1 - 3, Z1 - 4.5].forEach((z, k) => {
      const [a, b] = k ? [x0 + 0.5, x1 - 0.5] : [x0, x1];
      fine.box([a, b], [FLOOR, FLOOR + 1], [z, z + 0.5], "steel");
      fine.box([a, b], [LINTEL - 2, LINTEL - 1], [z, z + 0.5], "steel");
      fine.box([a, b], [SILL, SILL + 1], [z, z + 0.5], "steel");
      fine.box([a, a + 1], [FLOOR, LINTEL - 1], [z, z + 0.5], "steel");
      fine.box([b - 1, b], [FLOOR, LINTEL - 1], [z, z + 0.5], "steel");
      fine.box([b - 2, b - 1.5], [30, 36], [z + 0.5, z + 1], "chrome"); // the handle
      doorPanes.push(sheet([a + 1, b - 1], [FLOOR + 1, LINTEL - 2], z + 0.25, glass));
    });
  doorPanes.forEach((m) => add(m, false, false));

  // The number 90 on the post left of the doorway.
  const plate = grid(0.25);
  const PX = DOOR.x0 - 3.5;
  plate.box([PX, PX + 5], [53, 57], [Z1 + 1, Z1 + 1.25], "plate");
  const DIGITS = { 9: ["###", "#.#", "###", "..#", "###"], 0: ["###", "#.#", "#.#", "#.#", "###"] };
  ["9", "0"].forEach((d, n) =>
    DIGITS[d].forEach((row, r) =>
      [...row].forEach((c, k) => {
        if (c === "#")
          plate.box([PX + 0.75 + n * 2 + k * 0.5, PX + 1.25 + n * 2 + k * 0.5], [56 - (r + 1) * 0.5, 56 - r * 0.5], [Z1 + 1.25, Z1 + 1.5], "digit");
      })
    )
  );
  add(plate.mesh(), false);

  yield;
  yield;
  /* ----- the neon sign on the left wall over the bench, hung a little off it on two wires ----- */
  // (Pink: white on the milky glass would hardly show by day.)

  const signTex = neonTexture();
  const SIGN_W = 54;
  const SIGN_C = [X0 + WALL + 1.5, 53, -73]; // (off the wall, its middle's height, its middle along the wall)
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, depthWrite: false, color: OFF.sign });
  const sign = sheet([SIGN_C[2] - SIGN_W / 2, SIGN_C[2] + SIGN_W / 2], [SIGN_C[1] - 6, SIGN_C[1] + 6], SIGN_C[0], signMat, true);
  group.add(sign);
  const haloMat = new THREE.MeshBasicMaterial({
    map: signTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
    color: 0xff9cc2,
  });
  const halo = sheet([SIGN_C[2] - SIGN_W / 2 - 3, SIGN_C[2] + SIGN_W / 2 + 3], [SIGN_C[1] - 8, SIGN_C[1] + 8], SIGN_C[0] - 0.1, haloMat, true);
  group.add(halo);
  for (const z of [SIGN_C[2] - 20, SIGN_C[2] + 20]) fine.box([SIGN_C[0], SIGN_C[0] + 0.5], [SIGN_C[1] + 3.5, ROOF_Y - 1], [z, z + 0.5], "chromeDark");

  yield;
  /* ----- the awning: flat tinted glass on four steel ribs over the posts, a fascia board along its front
     edge (the shop's name and hours on it), downlights let into its underside ----- */
  // (Flat and only as wide as the kiosk, its ribs over the posts and no lamps hung below it: from above it
  // lies over the front's own bars, not across them.)

  const steelSide = new THREE.MeshLambertMaterial({ color: PALETTE.steel });
  const frame = grid(0.5);
  const AW = AWNING;
  const FASCIA = [AW.y - 5.5, AW.y + 0.5]; // the fascia board's bottom and top
  for (const x of [X0, DOOR.x0 - 2, DOOR.x1, X1 - 2]) frame.box([x, x + 2], [AW.y - 1.5, AW.y], [Z1 + 1, AW.z1 - 1], "steelDark");
  frame.box([AW.x0, AW.x1], [AW.y - 1, AW.y], [Z1 + 1, Z1 + 2], "steelDark"); // the beam along its back, on the posts
  const frameMesh = add(frame.mesh(), true, false);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(AW.x1 - AW.x0, FASCIA[1] - FASCIA[0], 1), [
    ...Array(4).fill(steelSide),
    new THREE.MeshLambertMaterial({ map: fasciaTexture(AW.x1 - AW.x0, FASCIA[1] - FASCIA[0]) }),
    steelSide,
  ]);
  fascia.position.set((AW.x0 + AW.x1) / 2, (FASCIA[0] + FASCIA[1]) / 2, AW.z1 - 0.5);
  add(fascia, true, false);
  // The downlights, a row of them along the middle of its underside.
  const tubeMat = new THREE.MeshBasicMaterial({ color: OFF.lights });
  const dots = grid(0.5);
  for (let x = AW.x0 + 10; x < AW.x1 - 4; x += 16)
    dots.box([x - 0.75, x + 0.75], [AW.y - 0.5, AW.y], [(Z1 + AW.z1) / 2 - 0.75, (Z1 + AW.z1) / 2 + 0.75], "chrome");
  const downlights = dots.mesh(false);
  downlights.material = tubeMat;
  group.add(downlights);
  // The glass itself: one flat sheet over the ribs.
  const awningGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(AW.x1 - AW.x0, AW.z1 - 1 - AW.z0),
    new THREE.MeshBasicMaterial({
      color: 0x9cc4b4,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      forceSinglePass: true,
    })
  );
  awningGlass.rotation.x = -Math.PI / 2;
  awningGlass.position.set((AW.x0 + AW.x1) / 2, AW.y + 0.2, (AW.z0 + AW.z1 - 1) / 2);
  add(awningGlass, false, false);

  yield;
  /* ----- inside: the shelving, the board, the air conditioner, the bench and what is on it ----- */

  // The wire shelving: chrome posts, five wire decks, and on them pots, vases and boxes of preserved roses.
  const { x0: SX0, x1: SX1, z0: SZ0, z1: SZ1 } = SHELF;
  const DECKS = [3, 16, 29, 42, 55].map((y) => FLOOR + y);
  for (const x of [SX0, SX1 - 0.5]) for (const z of [SZ0, SZ1 - 0.5]) fine.box([x, x + 0.5], [FLOOR, FLOOR + SHELF.h], [z, z + 0.5], "chrome");
  for (const y of DECKS) {
    fine.box([SX0, SX1], [y - 0.5, y], [SZ0, SZ1], (x, yy, z) => ((x * 2) % 3 === 0 ? "chrome" : "chromeDark"));
    fine.box([SX0, SX1], [y, y + 0.5], [SZ1 - 0.5, SZ1], "chrome"); // the deck's front lip
  }
  const SZ = (SZ0 + SZ1) / 2;
  // A vessel turned round (cx, SZ) in grid `g`, from y up `h`: its radius `r(u)` from the foot (u = 0) to the
  // lip (u = 1), hollow from the top `open` down; `color(x, y, z, u)`.
  function turned(g, cx, y, h, r, color, open = 1.5) {
    for (let k = 0; k < h / g.s; k++) {
      const [y0, u] = [y + k * g.s, ((k + 0.5) * g.s) / h];
      const R = r(u);
      g.cyl(cx, SZ, R, [y0, y0 + g.s], (x, yy, z) => color(x, y0, z, u), y0 >= y + h - open ? R - 0.7 : -1);
    }
  }
  // Their shapes, a radius at u: a big-bellied urn with a flared lip, a round bubble, a bottle with a long neck,
  // a column, a trumpet, a low bowl, a flowerpot with its rim.
  const SHAPES = {
    urn: (u) => (u < 0.72 ? 1.5 + 2 * Math.sin(Math.PI * (0.12 + (0.88 * u) / 0.72)) ** 0.8 : u < 0.9 ? 1.3 : 1.3 + (u - 0.9) * 9),
    bubble: (u) => (u < 0.8 ? 0.9 + 2.3 * Math.sin(Math.PI * (0.1 + (0.9 * u) / 0.8)) ** 0.6 : 1.1),
    bottle: (u) => (u < 0.5 ? 1 + 1.4 * Math.sin(Math.PI * (0.15 + (0.85 * u) / 0.5)) ** 0.5 : u < 0.92 ? 0.7 : 1),
    column: (u) => 1.5 + 0.3 * u,
    trumpet: (u) => 0.9 + 2.3 * u * u,
    bowl: (u) => 1.6 + 2 * Math.sqrt(u),
    pot: (u) => (u > 0.8 ? 2.5 : 1.9 + 0.5 * u),
  };
  // And their finishes: a glaze with its lip a shade darker, speckled stoneware, bands, flutes.
  const glaze = (c, lip) => (x, y, z, u) => (u > 0.88 ? lip : c);
  const speckled = (c) => (x, y, z) =>
    (Math.imul(Math.round(x * 2) * 73 + Math.round(y * 2) * 151 + Math.round(z * 2) * 37, 2654435761) >>> 0) % 9 ? c : "speck";
  const banded = (a, b, n) => (x, y, z, u) => (Math.floor(u * n) % 2 ? a : b);
  const fluted = (cx, a, b) => (x, y, z) => (Math.round(Math.atan2(z + 0.25 - SZ, x + 0.25 - cx) * 4) % 2 ? a : b);
  // Stems in them: eucalyptus (round leaves in pairs up thin stems), bunny tails, a single flower.
  function eucalyptus(x, y, h, n = 3) {
    for (let k = 0; k < n; k++) {
      const lean = (k - (n - 1) / 2) * 0.3;
      for (let j = 0; j < (h - (k % 2)) * 2; j++) {
        const [xx, yy] = [x + lean * j * 0.5, y + j * 0.5];
        fine.box([xx, xx + 0.5], [yy, yy + 0.5], [SZ, SZ + 0.5], "stemGreen");
        if (j % 3 === 2) {
          fine.box([xx - 1, xx], [yy, yy + 0.5], [SZ - 0.25, SZ + 0.75], "eucalyptus");
          fine.box([xx + 0.5, xx + 1.5], [yy + 0.5, yy + 1], [SZ - 0.25, SZ + 0.75], "eucalyptusDark");
        }
      }
    }
  }
  function tails(x, y, h, n = 4) {
    for (let k = 0; k < n; k++) {
      const [dx, top] = [(k - (n - 1) / 2) * 0.9, y + h - (k % 2) * 1.5];
      fine.box([x + dx, x + dx + 0.5], [y, top], [SZ, SZ + 0.5], "driedStem");
      fine.ball([x + dx + 0.25, top + 0.6, SZ + 0.25], [0.6, 1, 0.6], "gyp");
    }
  }
  function bloom(x, y, h, c, d) {
    fine.box([x, x + 0.5], [y, y + h], [SZ, SZ + 0.5], "stemGreen");
    fine.box([x + 0.5, x + 1.5], [y + h * 0.5, y + h * 0.5 + 0.5], [SZ, SZ + 0.5], "stemGreen"); // a leaf
    fine.ball([x + 0.25, y + h + 0.8, SZ + 0.25], [1.5, 1.2, 1.5], (xx, yy) => (yy > y + h + 1 ? c : d));
  }
  const D = DECKS;
  // Bottom deck: a woven basket of kraft paper sheets, a stack of terracotta pots, a big charcoal urn.
  const BK = SX0 + 5;
  turned(
    fine,
    BK,
    D[0],
    6,
    () => 3.6,
    (x, y, z) => ((Math.round(y * 2) + Math.round(Math.atan2(z - SZ, x - BK) * 5)) % 2 ? "basket" : "basketDark"),
    5
  );
  fine.box([BK - 2, BK + 1.5], [D[0] + 1, D[0] + 9], [SZ - 0.5, SZ], "kraft");
  fine.box([BK - 1, BK + 2.5], [D[0] + 1, D[0] + 8], [SZ + 0.5, SZ + 1], "kraftDark");
  for (let k = 0; k < 3; k++) turned(fine, SX0 + 13.5, D[0] + k * 1.5, 4, SHAPES.pot, glaze("terracotta", "terracottaDark"), k === 2 ? 1.5 : 0);
  turned(fine, SX0 + 23.5, D[0], 11.5, SHAPES.urn, glaze("charcoal", "charcoalLight"));
  // Second: a blue and white striped bottle with a protea, a cream fluted column of eucalyptus, a terracotta
  // urn, a sage bubble of bunny tails.
  turned(fine, SX0 + 4, D[1], 8, SHAPES.bottle, banded("glazeBlue", "glazeWhite", 6));
  bloom(SX0 + 3.75, D[1] + 7, 2.5, "rosePink", "rosePinkDark");
  turned(fine, SX0 + 10.5, D[1], 6, SHAPES.column, fluted(SX0 + 10.5, "potCream", "potCreamRib"));
  eucalyptus(SX0 + 10.25, D[1] + 5, 6);
  turned(fine, SX0 + 17.5, D[1], 9.5, SHAPES.urn, glaze("terracottaLight", "terracotta"));
  turned(fine, SX0 + 25, D[1], 6.5, SHAPES.bubble, glaze("sageGlaze", "sageGlazeDark"));
  tails(SX0 + 24.75, D[1] + 6, 4.5);
  // Third: succulents (a rosette of fat leaves, pink at the tips) in a speckled bowl, an ochre pot, a little
  // charcoal column, a fluted blush pot.
  const succulent = (x, y) =>
    fine.ball([x, y + 0.5, SZ], [2, 1.2, 2], (xx, yy, z) =>
      Math.hypot(xx + 0.25 - x, z + 0.25 - SZ) > 1.6 ? "succulentTip" : (xx + z) % 1 ? "succulent" : "succulentLight"
    );
  turned(fine, SX0 + 5, D[2], 3.5, SHAPES.bowl, speckled("stoneware"), 3);
  succulent(SX0 + 3.5, D[2] + 3);
  succulent(SX0 + 6.5, D[2] + 3.2);
  turned(fine, SX0 + 13, D[2], 5, SHAPES.pot, glaze("ochre", "ochreDark"));
  succulent(SX0 + 13, D[2] + 5);
  turned(fine, SX0 + 19, D[2], 4, SHAPES.column, glaze("charcoalLight", "charcoal"));
  succulent(SX0 + 19, D[2] + 4);
  turned(fine, SX0 + 25, D[2], 4.5, (u) => 1.8 + 0.6 * u, fluted(SX0 + 25, "potPink", "potPinkRib"));
  succulent(SX0 + 25, D[2] + 4.5);
  // Price tags on the decks' lips, under what is for sale.
  for (const [x, d] of [
    [SX0 + 3, 1],
    [SX0 + 17, 1],
    [SX0 + 12, 2],
    [SX0 + 24, 2],
    [SX0 + 15, 3],
  ])
    fine.box([x, x + 2], [D[d] - 1.5, D[d]], [SZ1, SZ1 + 0.5], "tag");
  // Top: clear boxes of preserved rose heads, pink, red and white; a trail of pothos down the front.
  const ROSE_BOXES = [
    [SX0 + 5, "rosePink", "rosePinkDark"],
    [SX0 + 15, "roseRed", "roseRedDark"],
    [SX0 + 25, "roseWhite", "roseWhiteDark"],
  ];
  for (const [cx, c, d] of ROSE_BOXES)
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 2; k++)
        for (let j = 0; j < 2; j++)
          fine.ball([cx - 2.5 + i * 2.5, DECKS[4] + 1.5 + j * 2.4, SZ - 1.2 + k * 2.4], 1.2, (x, y, z) => (((x + y + z) * 2) % 2 ? d : c));
  for (let k = 0; k < 9; k++) {
    const x = SX0 + 1 + k * 1.1;
    const y = DECKS[4] - 1 - k * 1.6 - (k % 3) * 0.5;
    fine.box([x, x + 1], [y, y + 1], [SZ1, SZ1 + 0.5], k % 2 ? "pothos" : "pothosLight");
  }
  // The glass on the fourth deck, each its own shape and tint: an amber bubble, a sea green bottle with a stem in
  // it, a rose trumpet, a clear column of tulips (their stems seen through it), a smoky bud vase; the clear
  // boxes round the roses on top.
  const clear = grid(0.5);
  const hollow = (h) => h - 0.5; // (open all the way down to the foot)
  [
    [SX0 + 4, 6.5, SHAPES.bubble, "#e2b56a"],
    [SX0 + 10, 9, SHAPES.bottle, "#8fc7b8"],
    [SX0 + 16, 7, SHAPES.trumpet, "#e6a3b4"],
    [SX0 + 22, 8.5, SHAPES.column, "#cfe6e8"],
    [SX0 + 27, 5, (u) => 1.3 - 0.4 * u, "#a9b4bd"],
  ].forEach(([x, h, r, tint]) => turned(clear, x, D[3], h, r, () => tint, hollow(h)));
  fine.box([SX0 + 10, SX0 + 10.5], [D[3] + 3, D[3] + 11], [SZ, SZ + 0.5], "stemGreen");
  for (const [dx, c, d] of [
    [-0.75, "rosePink", "rosePinkDark"],
    [0.75, "roseWhite", "roseWhiteDark"],
  ]) {
    fine.box([SX0 + 22 + dx, SX0 + 22.5 + dx], [D[3] + 0.5, D[3] + 10], [SZ, SZ + 0.5], "stemGreen");
    fine.ball([SX0 + 22.25 + dx, D[3] + 10.8, SZ + 0.25], [0.9, 1.3, 0.9], (x, y) => (y > D[3] + 11 ? c : d));
  }
  for (const [cx] of ROSE_BOXES) clear.box([cx - 4, cx + 4], [DECKS[4], DECKS[4] + 6.5], [SZ - 3, SZ + 3], "#e8f1f2");
  const clearMesh = clear.mesh();
  clearMesh.material = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false });
  add(clearMesh, false, false);

  // The notice board: cork in an oak frame, notes pinned on it, a photo of the dog; the pink note pinned by
  // its top only (it lifts in the air conditioner's draught).
  const bz = Z0 + WALL;
  fine.box([BOARD.x0, BOARD.x1], [BOARD.y0, BOARD.y1], [bz, bz + 0.5], (x, y) =>
    x < BOARD.x0 + 1 || x >= BOARD.x1 - 1 || y < BOARD.y0 + 1 || y >= BOARD.y1 - 1 ? "oak" : (x + y) % 3 ? "cork" : "corkDark"
  );
  const note = (g, [x, y, w, h, c, pin]) => {
    g.box([x, x + w], [y, y + h], [bz + 0.5, bz + 1], (xx, yy) =>
      yy < y + h - 1.5 && yy > y + 0.5 && xx > x + 0.5 && xx < x + w - 1 && (yy * 2) % 2 === 0 ? "paperLine" : c
    );
    g.box([x + w / 2 - 0.5, x + w / 2], [y + h - 1, y + h - 0.5], [bz + 1, bz + 1.5], pin);
  };
  [
    [BOARD.x0 + 2, BOARD.y1 - 9, 6, 7, "paperWhite", "pinRed"],
    [BOARD.x0 + 9.5, BOARD.y1 - 7, 5, 5, "paperYellow", "pinBlue"],
    [BOARD.x0 + 3, BOARD.y0 + 2, 7, 6, "paperBlue", "pinBlue"],
  ].forEach((n) => note(fine, n));
  const [PX0, PY0] = [BOARD.x0 + 12.5, BOARD.y0 + 2]; // the photo: the dog lying on the grass
  fine.box([PX0, PX0 + 6], [PY0, PY0 + 7], [bz + 0.5, bz + 1], (x, y) => {
    const [u, v] = [x - PX0, y - PY0];
    if (u < 0.5 || u >= 5.5 || v < 1.5 || v >= 6.5) return "tag";
    if (Math.hypot((u - 3) / 1.8, (v - 3.2) / 1.1) < 1) return u > 4 && v > 3 ? "dogBrown" : "dogCream";
    return v < 3.5 ? "photoGrass" : "photoSky";
  });
  fine.box([PX0 + 2.5, PX0 + 3.5], [PY0 + 6.5, PY0 + 7.5], [bz + 1, bz + 1.25], "#e8e4d6"); // tape
  const loose = grid(0.5);
  note(loose, [BOARD.x0 + 15.5, BOARD.y1 - 10, 4.5, 8, "paperPink", "pinRed"]);
  const looseNote = pivoted(loose.mesh(), [BOARD.x0 + 17.5, BOARD.y1 - 2.5, bz + 0.5]);
  group.add(looseNote);

  // The air conditioner, high on the back wall: white, its flap along the bottom (open while it runs), its
  // light; its drain pipe along the wall and down to the floor past the board.
  const AC = { x0: -38, x1: -14, y0: 56, y1: 63 };
  fine.box([AC.x0, AC.x1], [AC.y0 + 0.5, AC.y1], [bz, bz + 5], (x, y) =>
    y < AC.y0 + 1.5 ? ((x * 2) % 2 ? "acShade" : "acWhite") : y === AC.y1 - 0.5 ? "acShade" : "acWhite"
  );
  fine.box([AC.x1, -5], [AC.y0 + 1, AC.y0 + 2], [bz, bz + 1], "acShade");
  fine.box([-5, -4], [FLOOR, AC.y0 + 2], [bz, bz + 1], "acShade");
  const flapG = grid(0.5);
  flapG.box([AC.x0 + 0.5, AC.x1 - 0.5], [AC.y0, AC.y0 + 0.5], [bz + 1, bz + 5], "acShade");
  const flap = pivoted(flapG.mesh(), [0, AC.y0 + 0.5, bz + 1]);
  group.add(flap);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x4a5a50 });
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), ledMat);
  led.position.set(AC.x1 - 2.75, AC.y1 - 1.75, bz + 5.25);
  group.add(led);
  const acBox = new THREE.Mesh(new THREE.BoxGeometry(AC.x1 - AC.x0, AC.y1 - AC.y0, 5), new THREE.MeshBasicMaterial({ visible: false }));
  acBox.position.set((AC.x0 + AC.x1) / 2, (AC.y0 + AC.y1) / 2, bz + 2.5);
  group.add(acBox);
  const acMouth = new THREE.Vector3((AC.x0 + AC.x1) / 2, AC.y0 - 1, bz + 6);

  // The clock over the cool room's door: a cream face in a green rim, its hands at the shop's time.
  const CLOCK = [(COOL.x0 + COOL.x1) / 2, 60, bz];
  const dial = grid(0.25);
  dial.rod(CLOCK[0], CLOCK[1], 4.5, [bz, bz + 1], (x, y, z, d) => (d > 3.8 ? "steel" : "clockFace"));
  for (let k = 0; k < 12; k++) {
    const [r, w] = k % 3 ? [3.25, 0.25] : [3, 0.5];
    const [x, y] = [CLOCK[0] + Math.sin((k / 6) * Math.PI) * r, CLOCK[1] + Math.cos((k / 6) * Math.PI) * r];
    dial.box([x - w, x + w], [y - w, y + w], [bz + 1, bz + 1.25], "clockHand");
  }
  dial.box([CLOCK[0] - 0.5, CLOCK[0] + 0.5], [CLOCK[1] - 0.5, CLOCK[1] + 0.5], [bz + 1, bz + 2.25], "pinRed"); // (its face clear of the hands')
  const dialMesh = add(dial.mesh(), false, true);
  const hand = (len, z) => {
    const g = grid(0.25);
    g.box([-0.25, 0.25], [-0.75, len], [0, 0.25], "clockHand");
    const h = new THREE.Group();
    h.position.set(CLOCK[0] - 0.125, CLOCK[1] - 0.125, z);
    h.add(g.mesh());
    group.add(h);
    return h;
  };
  const hourHand = hand(2, bz + 1.25);
  const minuteHand = hand(3, bz + 1.5);
  const clockTop = new THREE.Vector3(CLOCK[0], CLOCK[1] + 5, bz + 2);

  // The cool room's thermometer by its door: a dark box, its reading lit.
  fine.box([COOL.x1 + 3, COOL.x1 + 7], [38, 41], [bz, bz + 0.5], "regDark");
  fine.box([COOL.x1 + 4, COOL.x1 + 6], [39, 40], [bz + 0.5, bz + 0.75], "screen");

  // Dried flowers hung upside down from a branch on the wall between the bench and the shelving (lavender,
  // roses, yarrow, gypsophila), each bunch on a string; a zinc bucket of pampas grass in the corner below.
  const DRY_Y = 64;
  const DZ0 = bz + 2.5; // (out from the wall)
  for (const x of [-123, -108.5]) fine.box([x, x + 0.5], [DRY_Y - 0.5, DRY_Y + 1], [bz, DZ0 + 0.5], "steelDark");
  fine.box([-125, -106], [DRY_Y, DRY_Y + 1], [DZ0 - 0.5, DZ0 + 0.5], (x) => ((x * 2) % 7 ? "oakDark" : "oak"));
  const bunches = [
    [-121, "lavender", "lavenderDark", [0.8, 2.2, 0.8]],
    [-117, "driedRose", "driedRoseDark", 1.5],
    [-113, "yarrow", "yarrowDark", [1.8, 1, 1.8]],
    [-109.5, "gyp", "gypDark", 1.4],
  ].map(([x, c, d, r]) => {
    const g = grid(0.5);
    g.box([x - 0.25, x + 0.25], [DRY_Y - 2.5, DRY_Y], [DZ0, DZ0 + 0.5], "twine"); // the string
    g.box([x - 1.5, x + 1.5], [DRY_Y - 4, DRY_Y - 3], [DZ0 - 1, DZ0 + 1.5], "twine"); // tied round the stems
    for (let j = 0; j < 7; j++) {
      const [sx, sz] = [x - 1.5 + ((j * 3) % 4), DZ0 - 1 + ((j * 5) % 3)];
      const end = DRY_Y - 7 - (j % 3);
      g.box([sx, sx + 0.5], [end, DRY_Y - 2.5], [sz, sz + 0.5], "driedStem");
      g.ball([sx + 0.25, end - 1, sz + 0.25], r, (xx, y) => ((y * 2) % 2 ? c : d));
    }
    const m = pivoted(g.mesh(), [x, DRY_Y, DZ0]);
    group.add(m);
    return m;
  });
  const PB = [-108.5, bz + 5]; // the pampas's bucket
  fine.cyl(PB[0], PB[1], 3, [FLOOR, FLOOR + 9], (x, y) => (y >= FLOOR + 8.5 ? "zincDark" : (y * 2) % 6 === 0 ? "zincDark" : "zinc"));
  const plumes = grid(0.5);
  [
    [-0.24, 0.05, 30],
    [-0.1, 0.12, 34],
    [0.02, 0.02, 31],
    [0.12, 0.1, 27],
  ].forEach(([lx, lz, top]) => {
    for (let y = FLOOR + 9; y < FLOOR + top - 4; y += 0.5) {
      const u = y - FLOOR - 9;
      plumes.box([PB[0] + lx * u, PB[0] + lx * u + 0.5], [y, y + 0.5], [PB[1] + lz * u, PB[1] + lz * u + 0.5], "driedStem");
    }
    const u = top - 13;
    plumes.ball([PB[0] + lx * u + 0.25, FLOOR + top - 1, PB[1] + lz * u + 0.25], [1.6, 5, 1.6], (x, y) => ((x + y) % 1.5 ? "pampas" : "pampasDark"));
  });
  const pampas = pivoted(plumes.mesh(), [PB[0], FLOOR + 9, PB[1]]);
  group.add(pampas);

  add(fine.mesh());
  yield;
  fine = grid(0.5);
  // The wrapping bench: cream cupboards with shaker doors and brass knobs, an oak top.
  const bench = grid(1);
  const { x0: BX0, x1: BX1, z0: BZ0, z1: BZ1 } = BENCH;
  bench.box([BX0, BX1 - 1], [FLOOR, FLOOR + 1], [BZ0, BZ1], "steelDark"); // the plinth
  bench.box([BX0, BX1], [FLOOR + 1, TOP - 3], [BZ0, BZ1], (x, y, z) => {
    if (x !== BX1 - 1) return "cabinet";
    const k = (z - BZ0) % 14; // a door every 14
    return k === 0 ||
      k === 13 ||
      y === FLOOR + 1 ||
      y === TOP - 4 ||
      ((k === 2 || k === 11) && y > FLOOR + 3 && y < TOP - 6) ||
      ((y === FLOOR + 4 || y === TOP - 7) && k > 1 && k < 12)
      ? "cabinetShade"
      : "cabinet";
  });
  bench.box([BX0, BX1 + 1], [TOP - 3, TOP], [BZ0 - 1, BZ1 + 1], (x, y) => (y === TOP - 3 ? "oakDark" : "oak"));
  const benchMesh = add(bench.mesh());
  yield;
  for (let z = BZ0 + 7; z < BZ1; z += 14) fine.box([BX1, BX1 + 0.5], [TOP - 9, TOP - 8], [z - 0.5, z + 0.5], "brass");

  // On the bench, from the back: the kraft paper roll on its stand (a sheet pulled out over the top), a pot
  // of pens, the ribbons on a rod on the wall above, the scissors by the work space, the radio, the till.
  const RZ = [BZ0 + 1, BZ0 + 8];
  for (const z of RZ) fine.box([BX0 + 1, BX0 + 7], [TOP, TOP + 7], [z, z + 1], "oakDark");
  fine.rod(BX0 + 4, TOP + 4.5, 2.5, [RZ[0] + 1, RZ[1]], (x, y, z, d) => (d > 2 ? "kraftDark" : "kraft"));
  fine.box([BX0 + 4, BX0 + 10], [TOP, TOP + 0.5], [RZ[0] + 1.5, RZ[1] - 0.5], "kraft"); // the sheet pulled out
  fine.box([BX0 + 6.5, BX0 + 7], [TOP + 2, TOP + 6.5], [RZ[0] + 1, RZ[1]], "chromeDark"); // the cutter bar
  fine.cyl(BX0 + 3, BZ0 + 12, 1.3, [TOP, TOP + 3], "potSage", 0.7);
  [
    ["pinRed", 0.4, 0],
    ["pinBlue", -0.3, 0.4],
    ["boomBlack", 0.2, -0.4],
  ].forEach(([c, dx, dz]) => fine.box([BX0 + 3 + dx, BX0 + 3.5 + dx], [TOP + 2, TOP + 5], [BZ0 + 12 + dz, BZ0 + 12.5 + dz], c));
  // Ribbons: spools along a chrome rod on brackets, their ends hanging down.
  const RIB_Y = TOP + 11;
  for (const z of [BZ0 + 2, BZ0 + 22]) fine.box([X0 + WALL, X0 + WALL + 4], [RIB_Y - 0.5, RIB_Y + 0.5], [z, z + 0.5], "steel");
  fine.box([X0 + WALL + 3, X0 + WALL + 3.5], [RIB_Y, RIB_Y + 0.5], [BZ0 + 2, BZ0 + 22.5], "chrome");
  ["ribRed", "ribPink", "ribCream", "ribSage", "ribGold", "ribLilac"].forEach((c, k) => {
    const z = BZ0 + 3.5 + k * 3;
    fine.rod(X0 + WALL + 3.25, RIB_Y + 0.25, 1.6, [z, z + 2], (x, y, zz, d) => (d < 0.8 ? "cabinetShade" : c));
    fine.box([X0 + WALL + 4.5, X0 + WALL + 5], [RIB_Y - 2 - (k % 3) * 1.5, RIB_Y], [z + 0.5, z + 1.5], c);
  });
  // The scissors, open a little, by where the bouquets are wrapped.
  const SC = [BX0 + 9, BZ0 + 25];
  for (let k = 0; k < 8; k++) {
    fine.box([SC[0] + k * 0.5, SC[0] + k * 0.5 + 0.5], [TOP, TOP + 0.5], [SC[1] - k * 0.25, SC[1] - k * 0.25 + 0.5], "blade");
    fine.box([SC[0] + k * 0.5, SC[0] + k * 0.5 + 0.5], [TOP, TOP + 0.5], [SC[1] + k * 0.25 + 1, SC[1] + k * 0.25 + 1.5], "blade");
  }
  fine.box([SC[0] - 2, SC[0]], [TOP, TOP + 0.5], [SC[1] - 1, SC[1] + 0.5], "handleRed");
  fine.box([SC[0] - 2, SC[0]], [TOP, TOP + 0.5], [SC[1] + 1, SC[1] + 2.5], "handleRed");
  // A bud vase with a pink rose, between the radio and the till.
  fine.cyl(BX0 + 3, BZ1 - 15, 1, [TOP, TOP + 4], "#cfe6e8");
  fine.box([BX0 + 3, BX0 + 3.5], [TOP + 4, TOP + 8], [BZ1 - 15, BZ1 - 14.5], "stemGreen");
  fine.ball([BX0 + 3.25, TOP + 9, BZ1 - 14.75], 1.3, "rosePink");

  // The radio: a boombox, its two speakers and the tape deck turned to the room, a handle on top.
  const radioG = grid(0.5);
  const RD = { x0: BX0 + 1, x1: BX0 + 8, z0: BZ1 - 30, z1: BZ1 - 20 };
  radioG.box([RD.x0, RD.x1], [TOP, TOP + 6], [RD.z0, RD.z1], (x, y, z) => (y === TOP ? "grille" : "boomBlack"));
  for (const zc of [RD.z0 + 2.25, RD.z1 - 2.25])
    radioG.box([RD.x1, RD.x1 + 0.5], [TOP + 0.5, TOP + 5.5], [zc - 2.25, zc + 2.25], (x, y, z) => {
      const d = Math.hypot(y + 0.25 - (TOP + 3), z + 0.25 - zc);
      return d > 2.3 ? "boomBlack" : d > 1.9 ? "boomGrey" : d < 0.6 ? "boomGrey" : "grille";
    });
  radioG.box([RD.x1, RD.x1 + 0.5], [TOP + 1.5, TOP + 4.5], [RD.z0 + 4.5, RD.z1 - 4.5], (x, y) => (y > TOP + 3.5 ? "chrome" : "boomGrey"));
  radioG.box([RD.x0 + 3, RD.x0 + 3.5], [TOP + 6, TOP + 8], [RD.z0 + 1, RD.z0 + 1.5], "chromeDark");
  radioG.box([RD.x0 + 3, RD.x0 + 3.5], [TOP + 6, TOP + 8], [RD.z1 - 1.5, RD.z1 - 1], "chromeDark");
  radioG.box([RD.x0 + 3, RD.x0 + 3.5], [TOP + 7.5, TOP + 8], [RD.z0 + 1, RD.z1 - 1], "chromeDark");
  radioG.box([RD.x0 + 1, RD.x0 + 1.5], [TOP + 6, TOP + 14], [RD.z0 + 0.5, RD.z0 + 1], "chrome"); // the aerial
  const radioMesh = add(radioG.mesh(), true, true);
  const radioTop = new THREE.Vector3((RD.x0 + RD.x1) / 2, TOP + 8, (RD.z0 + RD.z1) / 2);

  // The till: a cream base (its drawer slides out towards her), the keys, a little screen on a stalk.
  const till = grid(0.5);
  const TL = { x0: BX0 + 1, x1: BX0 + 12, z0: BZ1 - 11, z1: BZ1 - 1 };
  till.box([TL.x0, TL.x1 - 1], [TOP, TOP + 3], [TL.z0, TL.z1], "regShade");
  till.box([TL.x0, TL.x1 - 3], [TOP + 3, TOP + 6], [TL.z0, TL.z1], (x, y) => (y === TOP + 5.5 ? "regShade" : "regBody"));
  for (let k = 0; k < 4; k++)
    for (let j = 0; j < 4; j++)
      till.box(
        [TL.x1 - 6 + k * 0.5, TL.x1 - 5.5 + k * 0.5],
        [TOP + 6, TOP + 6.5],
        [TL.z0 + 2 + j * 1.5, TL.z0 + 3 + j * 1.5],
        k === 3 && j === 0 ? "keyRed" : k === 3 && j === 3 ? "keyGreen" : "keyGrey"
      );
  till.box([TL.x0 + 1.5, TL.x0 + 2.5], [TOP + 6, TOP + 10], [TL.z0 + 4.5, TL.z0 + 5.5], "regDark");
  till.box([TL.x0 + 1, TL.x0 + 3], [TOP + 10, TOP + 12.5], [TL.z0 + 2.5, TL.z0 + 7.5], (x, y, z) =>
    x >= TL.x0 + 2.5 && y > TOP + 10 && y < TOP + 12 && z > TL.z0 + 2.5 && z < TL.z0 + 7 ? "screen" : "regDark"
  );
  till.box([TL.x0 + 0.5, TL.x0 + 2], [TOP + 6, TOP + 8], [TL.z1 - 3, TL.z1 - 1], "paperWhite"); // the receipt roll
  const tillMesh = add(till.mesh());
  const drawerG = grid(0.5);
  drawerG.box([TL.x1 - 1, TL.x1 + 0.5], [TOP + 0.5, TOP + 2.5], [TL.z0 + 0.5, TL.z1 - 0.5], (x, y) =>
    y >= TOP + 1.5 && y < TOP + 2 ? "regDark" : "regBody"
  );
  const drawer = add(drawerG.mesh());
  const drawerAt = drawer.position.x;

  // The stool: a round oak seat on four splayed black legs, a footrest ring (a mesh of its own: it spins).
  const STOOL_R = 3.5;
  const stoolG = grid(0.5);
  stoolG.cyl(STOOL.x, STOOL.z, STOOL_R, [SEAT - 1.5, SEAT], (x, y, z, d) =>
    y >= SEAT - 0.5 ? (d > STOOL_R - 0.8 ? "oakDark" : x % 2 ? "oakLight" : "oak") : "oakDark"
  );
  for (const [dx, dz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ])
    for (let y = FLOOR; y < SEAT - 1.5; y += 0.5) {
      const k = 1.2 + ((SEAT - 1.5 - y) / (SEAT - 1.5 - FLOOR)) * 2; // splaying out towards the floor
      const [x, z] = [STOOL.x + dx * k, STOOL.z + dz * k];
      stoolG.box([x, x + 0.5], [y, y + 0.5], [z, z + 0.5], "steelDark");
    }
  stoolG.cyl(STOOL.x, STOOL.z, 2.6, [FLOOR + 4, FLOOR + 4.5], "steelDark", 2);
  const stool = pivoted(stoolG.mesh(), [STOOL.x + 0.25, 0, STOOL.z + 0.25]);
  stool.children[0].castShadow = stool.children[0].receiveShadow = true;
  group.add(stool);

  // The dog's bed: a round cushion in a sage rim, lower at the front, a rope toy beside it.
  const { x: DX, z: DZ, r: DR } = DOG_BED;
  fine.cyl(DX, DZ, DR, [FLOOR, FLOOR + 5], (x, y, z, d) => {
    if (d < DR - 1.6) return y < FLOOR + 2.5 ? ((Math.round(x * 2) + Math.round(z * 2)) % 7 ? "bedCushion" : "bedCushionDot") : null;
    if (z > DZ + 2 && y >= FLOOR + 3) return null; // (lower at the front, the dog seen lying in it)
    return y === FLOOR + 4.5 || y === FLOOR + 2.5 ? "bedRimDark" : "bedRim";
  });
  for (let k = 0; k < 7; k++)
    fine.box([DX + DR + 1 + k * 0.5, DX + DR + 1.5 + k * 0.5], [FLOOR, FLOOR + 1], [DZ + 4, DZ + 5], k % 2 ? "toyRed" : "toyCream");
  fine.ball([DX + DR + 1, FLOOR + 0.6, DZ + 4.5], 0.9, "toyRed");
  fine.ball([DX + DR + 4.5, FLOOR + 0.6, DZ + 4.5], 0.9, "toyCream");

  // Buckets of stock waiting by the back wall, out of the cool room's way.
  const STOCK = [
    [-31, "stockPurple", "stockPurpleDark"],
    [-23, "stockPink", "rosePinkDark"],
    [-15, "stockWhite", "roseWhiteDark"],
  ];
  for (const [x, c, d] of STOCK) {
    const z = Z0 + WALL + 5;
    fine.cyl(
      x,
      z,
      3.5,
      [FLOOR, FLOOR + 8],
      (xx, y, zz, dd) => (y >= FLOOR + 7.5 ? "bucketBlackRim" : dd > 3 ? "bucketBlack" : y >= FLOOR + 7 ? "stemDark" : "bucketBlack"),
      -1
    );
    for (let k = 0; k < 7; k++) {
      const [sx, sz] = [x - 2 + ((k * 7) % 5), z - 2 + ((k * 3) % 5)];
      const top = FLOOR + 14 + (k % 3) * 1.5;
      fine.box([sx, sx + 0.5], [FLOOR + 8, top], [sz, sz + 0.5], "stemGreen");
      fine.ball([sx + 0.25, top + 1.2, sz + 0.25], [1.1, 1.8, 1.1], (xx, y) => ((y * 2) % 2 ? c : d));
    }
  }
  add(fine.mesh());
  yield;

  yield;
  /* ----- the cool room's door, and the cold room behind it ----- */

  // The cool room behind it, seen only through the doorway (the mural is not painted behind the kiosk:
  // grounds.js): white panelled walls, a checker plate floor, a wire shelf of buckets along the back and two
  // more buckets by the door, a strip light, clear strips hanging in the doorway; lit cold while it is open.
  const CR = { x0: COOL.x0 - 6, x1: COOL.x1 + 6, z0: Z0 - 22, h: 54 };
  const room = grid(1);
  const panel = (seam) => (seam % 8 === 0 ? "#b9c4ca" : "#d8e1e6");
  room.box([CR.x0, CR.x1], [0, FLOOR], [CR.z0, Z0], (x, y, z) => ((x + z) % 4 === 0 ? "#8b9499" : "#a2abb0"));
  room.box([CR.x0 - 1, CR.x0], [0, CR.h], [CR.z0, Z0], (x, y, z) => panel(z));
  room.box([CR.x1, CR.x1 + 1], [0, CR.h], [CR.z0, Z0], (x, y, z) => panel(z));
  room.box([CR.x0 - 1, CR.x1 + 1], [0, CR.h], [CR.z0 - 1, CR.z0], (x) => panel(x));
  room.box([CR.x0 - 1, CR.x1 + 1], [CR.h, CR.h + 1], [CR.z0 - 1, Z0], "#c3cdd2");
  const cold = grid(0.5);
  const DECKS_Y = [FLOOR + 14, FLOOR + 30];
  const [CZ0, CZ1] = [CR.z0, CR.z0 + 8]; // (the shelf, deep)
  for (const y of DECKS_Y) cold.box([CR.x0 + 1, CR.x1 - 1], [y, y + 0.5], [CZ0, CZ1], (x) => ((x * 2) % 2 ? "chromeDark" : "chrome"));
  for (const x of [CR.x0 + 1, CR.x1 - 1.5]) for (const z of [CZ0, CZ1 - 0.5]) cold.box([x, x + 0.5], [FLOOR, DECKS_Y[1] + 6], [z, z + 0.5], "chrome");
  const COLD_BLOOMS = ["#f08fae", "#f7d33a", "#f6f2ec", "#c8283c", "#9b6bc4", "#f39a4a", "#e8507a"];
  let colds = 0;
  const coldBucket = (x, y, z) => {
    cold.cyl(x, z, 3, [y, y + 7], (xx, yy) => (yy >= y + 6.5 ? "bucketBlackRim" : "bucketBlack"));
    const c = COLD_BLOOMS[colds++ % COLD_BLOOMS.length];
    for (let k = 0; k < 6; k++) {
      const [bx, bz, top] = [x - 2 + ((k * 7) % 5), z - 2 + ((k * 3) % 5), y + 11 + (k % 3)];
      cold.box([bx, bx + 0.5], [y + 7, top], [bz, bz + 0.5], "stemGreen");
      cold.ball([bx + 0.25, top + 1, bz + 0.25], 1.3, c);
    }
  };
  for (const y of DECKS_Y) for (let x = CR.x0 + 5; x < CR.x1 - 3; x += 8) coldBucket(x, y + 0.5, CR.z0 + 4);
  for (const x of [CR.x0 + 6, CR.x1 - 7]) coldBucket(x, FLOOR, Z0 - 8);
  add(room.mesh());
  add(cold.mesh());
  const stripLight = grid(0.5);
  stripLight.box([CR.x0 + 4, CR.x1 - 4], [CR.h - 3, CR.h - 2], [CR.z0, CR.z0 + 1.5], "#eef8ff");
  group.add(stripLight.mesh(false));
  // The clear strips in the doorway, a little apart, each a narrow sheet.
  const strips = [];
  for (let x = COOL.x0 + 0.5; x < COOL.x1 - 1; x += 2.6)
    strips.push(sheet([x, x + 2.4], [FLOOR, 49], Z0 - 0.5, null).geometry.translate(x + 1.2, (FLOOR + 49) / 2, Z0 - 0.5));
  const curtainGeo = new THREE.BufferGeometry();
  const [stripPos, stripIndex] = [[], []];
  strips.forEach((g) => {
    const base = stripPos.length / 3;
    stripPos.push(...g.attributes.position.array);
    stripIndex.push(...[...g.index.array].map((i) => i + base));
  });
  curtainGeo.setAttribute("position", new THREE.Float32BufferAttribute(stripPos, 3));
  curtainGeo.setIndex(stripIndex);
  curtainGeo.computeVertexNormals();
  const curtain = new THREE.Mesh(
    curtainGeo,
    new THREE.MeshLambertMaterial({
      color: 0xe6f3f8,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
      forceSinglePass: true,
    })
  );
  group.add(curtain);
  const coldLight = new THREE.PointLight(0xd6ecff, 0, 60, 1);
  coldLight.position.set((COOL.x0 + COOL.x1) / 2, CR.h - 8, CR.z0 + 10);
  // (The lamps in the scene itself, the kiosk's group being where it stands, unmoved: in the group, three.js's
  // compiling of it (shop.js warm()) counted them twice, and what it left hidden then was made for twice the
  // lamps, needing a shader of its own the first time it showed.)
  shared.scene.add(coldLight);
  const doorG = grid(0.5);
  const DW = COOL.x1 - COOL.x0;
  doorG.box([COOL.x0 + 0.5, COOL.x1 - 0.5], [FLOOR, 48.5], [Z0 + 1, Z0 + 1.5], (x, y) => {
    const u = x - COOL.x0;
    if (y < FLOOR + 5) return "chrome"; // the kick plate
    if (u > 6 && u < DW - 6 && y > 31 && y < 42) return "doorWindow";
    return u < 2 || u > DW - 2.5 || y > 46.5 || (y > 20 && y < 21) ? "steelDark" : "steel";
  });
  doorG.box([COOL.x1 - 3, COOL.x1 - 2], [22, 28], [Z0 + 1.5, Z0 + 2.5], "chrome"); // the handle
  const coolDoor = pivoted(doorG.mesh(), [COOL.x0 + 0.5, 0, Z0 + 1.25]);
  coolDoor.children[0].castShadow = true;
  group.add(coolDoor);
  // Cold light spilling out over the floor while it is open.
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(DW, 24),
    new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  spill.rotation.x = -Math.PI / 2;
  spill.position.set((COOL.x0 + COOL.x1) / 2, FLOOR + 0.06, Z0 + WALL + 12);
  group.add(spill);

  yield;
  /* ----- the OPEN / CLOSED sign in the window, and the wind chime in the doorway ----- */

  const signGroup = new THREE.Group();
  signGroup.position.set(-9, 35, Z1 - 2.2);
  const board = (word, color, yaw) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ map: boardTexture(word, color) }));
    m.rotation.y = yaw;
    m.position.z = yaw ? -0.05 : 0.05;
    return signGroup.add(m).children.at(-1);
  };
  board("OPEN", "#2e6b4f", 0);
  board("CLOSED", "#a33a3a", Math.PI);
  const cord = grid(0.25);
  for (let k = 0; k < 16; k++) {
    const u = k / 15;
    cord.box([-4 + u * 4, -3.75 + u * 4], [3 + u * 4, 3.25 + u * 4], [0, 0.25], "chromeDark");
    cord.box([4 - u * 4, 4.25 - u * 4], [3 + u * 4, 3.25 + u * 4], [0, 0.25], "chromeDark");
  }
  signGroup.add(cord.mesh());
  group.add(signGroup);

  const chime = new THREE.Group();
  const CH = [DOOR.x1 - 7, LINTEL - 0.5, Z1 - 2];
  chime.position.set(...CH);
  const chimeTop = grid(0.25);
  chimeTop.cyl(0, 0, 1.4, [-1.5, -1], "oak");
  chimeTop.box([0, 0.25], [-1, 0], [0, 0.25], "chromeDark");
  chimeTop.box([0, 0.25], [-7, -1.5], [0, 0.25], "chromeDark"); // the striker's string
  chimeTop.ball([0.12, -5, 0.12], 0.5, "oak");
  chimeTop.box([-0.75, 1], [-9.5, -7], [0, 0.25], "ribPink"); // the sail
  chime.add(chimeTop.mesh());
  const chimeTubes = [4.5, 5.5, 6.5, 5, 6].map((len, k) => {
    const th = (k / 5) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(th) * 1.1, -1.5, Math.sin(th) * 1.1);
    const t = grid(0.25);
    t.box([0, 0.5], [-len, 0], [0, 0.5], "chrome");
    g.add(t.mesh());
    chime.add(g);
    return g;
  });
  const chimeBox = new THREE.Mesh(new THREE.BoxGeometry(5, 11, 5), new THREE.MeshBasicMaterial({ visible: false }));
  chimeBox.position.y = -5;
  chime.add(chimeBox);
  group.add(chime);

  yield;
  /* ----- lights: inside, warm; under the awning, cool (only by night, or switched on) ----- */

  const inside = new THREE.PointLight(0xffd9a6, 0, 170, 0);
  inside.position.set(-75, 58, -70);
  const under = new THREE.PointLight(0xeef6ff, 0, 140, 0);
  under.position.set(-40, 56, 0);
  shared.scene.add(inside, under); // (in the scene itself: coldLight)

  // Music notes over the radio or the clock, a sparkle over the till or the chime, the air conditioner's
  // draught, bits of the dried flowers falling: a few sprites, each used again.
  const noteTex = [glyphTexture("♪", "#5a7fd6"), glyphTexture("♫", "#d65a8f"), glyphTexture("♪", "#3f9a6b")];
  const TEX = { spark: glyphTexture("✦", "#f2b632"), air: glyphTexture("≈", "#8fc3e0"), bit: glyphTexture("•", "#b58aa0") };
  const floaters = Array.from({ length: 14 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex[0], transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false;
    group.add(s);
    return { s, born: -1, life: 1, from: new THREE.Vector3(), drift: 0, kind: "note" };
  });
  function float(kind, at, life) {
    const f = floaters.reduce((a, b) => (a.born < b.born ? a : b)); // the oldest
    Object.assign(f, { born: clock.t, life, kind, drift: Math.random() * 2 - 1 });
    f.from.copy(at);
    f.s.material.map = kind === "note" ? noteTex[Math.floor(Math.random() * noteTex.length)] : TEX[kind];
    f.s.visible = true;
  }

  yield;
  /* ----- the roller shutter over the front ----- */
  // Its housing under the awning (plain: the shop's name and hours are on the fascia), a guide rail down each corner
  // post, and the curtain of slats from the housing down to its bottom bar: rolled up inside by day, down to
  // the pavement at night, just in front of the posts (behind the step), a padlock through the hasp at the
  // middle of the bottom bar.
  const SH = SHUTTER;
  const HOUSING = [SH.top, ROOF_Y]; // its bottom and top
  const housing = new THREE.Mesh(new THREE.BoxGeometry(SH.x1 - SH.x0, HOUSING[1] - HOUSING[0], 3), steelSide);
  housing.position.set((SH.x0 + SH.x1) / 2, (HOUSING[0] + HOUSING[1]) / 2, SH.z + 0.4);
  add(housing, true, false);
  const rails = grid(0.5);
  for (const x of [SH.x0, SH.x1 - 1.5]) rails.box([x, x + 1.5], [0, HOUSING[0]], [Z1 + 1, SH.z + 0.5], "steelDark");
  add(rails.mesh(), false);
  const slats = slatTexture();
  const SLAT = 2; // a slat's height (voxels)
  const rolled = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: slats }));
  rolled.scale.x = SH.x1 - SH.x0 - 2;
  rolled.position.set((SH.x0 + SH.x1) / 2, 0, SH.z);
  rolled.receiveShadow = true;
  group.add(rolled);
  const barG = grid(0.25);
  const MID = (DOOR.x0 + DOOR.x1) / 2;
  barG.box([SH.x0 + 1, SH.x1 - 1], [0, 1.5], [SH.z - 0.5, SH.z + 0.75], (x, y) => (y >= 1.25 ? "steelLight" : "steel"));
  barG.box([MID - 4, MID + 4], [1.5, 2.5], [SH.z + 0.75, SH.z + 1.25], "chromeDark"); // the handle
  barG.box([MID - 0.75, MID + 0.75], [0, 1.5], [SH.z + 0.75, SH.z + 1.5], "chrome"); // the hasp
  const bar = barG.mesh();
  group.add(bar);
  const lockG = grid(0.25);
  lockG.box([MID - 0.75, MID + 0.75], [-1.75, 0.25], [SH.z + 1.5, SH.z + 2], "brass");
  lockG.box([MID - 0.5, MID - 0.25], [0.25, 1.25], [SH.z + 1.5, SH.z + 2], "chrome");
  lockG.box([MID + 0.25, MID + 0.5], [0.25, 1.25], [SH.z + 1.5, SH.z + 2], "chrome");
  lockG.box([MID - 0.5, MID + 0.5], [1, 1.25], [SH.z + 1.5, SH.z + 2], "chrome");
  const padlock = lockG.mesh();
  padlock.position.sub(bar.position); // (in the bar's frame)
  bar.add(padlock);
  const barAt = bar.position.y;
  // `k` how far down: 0 rolled up in the housing, 1 down on the pavement.
  const shutter = {
    k: 0,
    locked: false,
    bottom: () => (1 - shutter.k) * (HOUSING[0] + 1),
    set(k) {
      shutter.k = Math.min(1, Math.max(0, k));
      const b = shutter.bottom();
      const h = Math.max(0.01, HOUSING[0] + 1 - b);
      rolled.scale.y = h;
      rolled.position.y = b + h / 2;
      rolled.visible = b < HOUSING[0] - 0.5;
      slats.repeat.set(1, h / SLAT);
      bar.position.y = barAt + b;
      padlock.visible = shutter.locked && shutter.k > 0.99;
    },
    lock(on) {
      shutter.locked = on;
      shutter.set(shutter.k);
    },
    handle: [MID, SH.z + 7], // where to stand to pull it down or push it up (on the pavement, before the hasp)
  };
  shutter.set(0);

  yield;
  /* ----- the lock-up cool room against the right wall ----- */
  // White insulated panels in steel trim, a compressor on the roof with its fan, a sliding door on the front
  // (to the right: it slides to the left over the wall), a cold light inside, shelves of buckets at the back.
  const LU = LOCKUP;
  const [DX0, DX1] = LU.door;
  const panelC = (u) => (u % 9 === 0 ? "#c9d1d4" : "#e9eef0");
  const lu = grid(1);
  lu.box([LU.x0, LU.x1], [0, 1], [LU.z0, LU.z1], (x, y, z) => ((x + z) % 4 === 0 ? "#8b9499" : "#a2abb0"));
  lu.box([LU.x0, LU.x0 + 1], [0, LU.h], [LU.z0, LU.z1], (x, y, z) => panelC(z)); // the side against the kiosk
  lu.box([LU.x1 - 1, LU.x1], [0, LU.h], [LU.z0, LU.z1], (x, y, z) => (y < 3 ? "steelDark" : panelC(z - LU.z0)));
  lu.box([LU.x0, LU.x1], [0, LU.h], [LU.z0, LU.z0 + 1], (x) => panelC(x));
  lu.box([LU.x0, DX0], [0, LU.h], [LU.z1 - 1, LU.z1], (x, y) => (y < 3 ? "steelDark" : panelC(x - LU.x0)));
  lu.box([DX1, LU.x1], [0, LU.h], [LU.z1 - 1, LU.z1], (x, y) => (y < 3 ? "steelDark" : "#e9eef0"));
  lu.box([DX0, DX1], [LU.h - 6, LU.h], [LU.z1 - 1, LU.z1], "#e9eef0");
  lu.box([LU.x0, LU.x1], [LU.h, LU.h + 1], [LU.z0, LU.z1], (x, y, z) => ((x + z) % 7 === 0 ? "#b7c0c4" : "#cfd7da")); // the roof
  for (const x of [LU.x0, LU.x1 - 1]) lu.box([x, x + 1], [0, LU.h + 1], [LU.z1 - 1, LU.z1], "steelLight"); // the corner trim
  lu.box([LU.x0, LU.x1], [LU.h, LU.h + 1], [LU.z1 - 1, LU.z1], "steelLight");
  lu.box([LU.x1 - 1, LU.x1], [LU.h, LU.h + 1], [LU.z0, LU.z1], "steelLight");
  // The compressor: a grey cabinet on the roof, pipes from it down into the roof.
  const CX = (LU.x0 + LU.x1) / 2;
  lu.box([CX - 8, CX + 8], [LU.h + 1, LU.h + 9], [LU.z0 + 6, LU.z0 + 18], (x, y) => (y === LU.h + 8 ? "#9aa2a6" : "#b7bec1"));
  lu.box([CX - 3, CX - 1], [LU.h + 1, LU.h + 3], [LU.z0 + 18, LU.z0 + 21], "chromeDark");
  // Inside: two shelves along the back, seen through the door.
  for (const y of [14, 28]) lu.box([LU.x0 + 1, LU.x1 - 1], [y, y + 1], [LU.z0 + 1, LU.z0 + 9], "chrome");
  const lockupMesh = add(lu.mesh());
  const lfine = grid(0.5);
  // The compressor's round fan grille, on its front.
  const FAN = [CX, LU.h + 5, LU.z0 + 18];
  for (let x = -3.5; x <= 3.5; x += 0.5)
    for (let y = -3.5; y <= 3.5; y += 0.5) {
      const d = Math.hypot(x + 0.25, y + 0.25);
      if (d <= 3.5)
        lfine.box(
          [FAN[0] + x, FAN[0] + x + 0.5],
          [FAN[1] + y, FAN[1] + y + 0.5],
          [FAN[2], FAN[2] + 0.5],
          Math.round(d * 2) % 2 ? "grille" : "boomGrey"
        );
    }
  // Buckets of flowers on the shelves.
  let shelved = 0;
  for (const y of [15, 29])
    for (let x = LU.x0 + 5; x < LU.x1 - 3; x += 7) {
      const c = ["#f08fae", "#f7d33a", "#f6f2ec", "#c8283c", "#9b6bc4", "#f39a4a"][shelved++ % 6];
      lfine.cyl(x, LU.z0 + 5, 3, [y, y + 6], (xx, yy) => (yy >= y + 5.5 ? "bucketBlackRim" : "bucketBlack"));
      for (let k = 0; k < 5; k++) lfine.ball([x - 1.5 + ((k * 7) % 4), y + 9 + (k % 3), LU.z0 + 3.5 + ((k * 3) % 4)], 1.3, c);
    }
  // The door's track over it.
  lfine.box([LU.x0, LU.x1], [LU.h - 6, LU.h - 4.5], [LU.z1, LU.z1 + 2], "steelDark");
  add(lfine.mesh(), false);
  // The door: a white insulated slab, a dark seal round it, a long chrome handle bar, a padlock through it.
  const doorL = grid(0.5);
  doorL.box([DX0, DX1], [1, LU.h - 6], [LU.z1, LU.z1 + 1.5], (x, y) =>
    x < DX0 + 0.5 || x >= DX1 - 0.5 || y >= LU.h - 6.5 ? "#2a2b2e" : y < 4 ? "chrome" : "#f3f6f7"
  );
  doorL.box([DX0 + 1.5, DX0 + 2.5], [14, 30], [LU.z1 + 1.5, LU.z1 + 2.5], "chrome");
  const lockupDoor = doorL.mesh();
  add(lockupDoor);
  const padL = grid(0.25);
  padL.box([DX0 + 0.25, DX0 + 1.75], [17, 19], [LU.z1 + 2.5, LU.z1 + 3], "brass");
  padL.box([DX0 + 0.5, DX0 + 1.5], [19, 20], [LU.z1 + 2.5, LU.z1 + 3], "chrome");
  const lockupPad = padL.mesh();
  lockupPad.position.sub(lockupDoor.position);
  lockupDoor.add(lockupPad);
  const sticker = sheet([LU.x0 + 2, DX0 - 1], [31, 36], LU.z1 + 0.05, new THREE.MeshLambertMaterial({ map: boardTexture("COOL ROOM", "#2e6b9a") }));
  add(sticker, false);
  const lockupLight = new THREE.PointLight(0xd6ecff, 0, 50, 1);
  lockupLight.position.set(CX, LU.h - 8, (LU.z0 + LU.z1) / 2);
  shared.scene.add(lockupLight); // (in the scene itself: coldLight)
  const doorAt = lockupDoor.position.x;
  const lockup = {
    k: 0,
    open: false,
    locked: false,
    set: (open) => (lockup.open = open),
    lock(on) {
      lockup.locked = on;
      lockupPad.visible = on;
    },
    // Where to stand outside its door, and just inside it.
    at: [(DX0 + DX1) / 2, LU.z1 + 10],
    inside: [(DX0 + DX1) / 2, LU.z1 - 10],
  };
  lockup.lock(false);

  /* ----- what they do ----- */

  const radio = {
    on: false,
    next: 0,
    set(on) {
      radio.on = on;
      radio.next = clock.t;
    },
  };
  const register = {
    rangAt: -Infinity,
    ring(t = clock.t) {
      register.rangAt = t;
      float("spark", new THREE.Vector3(TL.x0 + 4, TOP + 14, (TL.z0 + TL.z1) / 2), 0.9);
    },
  };
  const lights = {
    on: false,
    at: -Infinity,
    set(on) {
      if (on && !lights.on) lights.at = clock.t;
      lights.on = on;
      look();
    },
  };
  const openSign = {
    open: true,
    k: 0, // 0 OPEN to the street, 1 CLOSED
    flip: () => (openSign.open = !openSign.open),
    set: (open) => (openSign.open = open),
  };
  // The chime swinging on its string, its tubes on theirs (knocked by its swing): rung harder, the more.
  // (The tubes swing together, each only a little its own way: apart, they would swing through each other
  // and the striker.)
  const chimeSwing = swinging(0.67, 1.4, [0.1, 0.15]);
  const tubesSwing = swinging(1.3, 1.6, [0.05, 0.05]);
  const tubeSwings = chimeTubes.map((g, k) => swinging(1.6 + 0.2 * k, 2, [0.015, 0.015]));
  const chimeBell = {
    ring(strength = 1) {
      knock(chimeSwing, 0.08 * strength, 0.12 * strength);
      knock(tubesSwing, 0.04 * strength, 0.05 * strength);
      tubeSwings.forEach((s) => knock(s, 0.012 * strength, 0.015 * strength));
      float("spark", new THREE.Vector3(CH[0], CH[1] - 12, CH[2]), 0.7);
    },
  };
  const cool = {
    k: 0,
    open: false,
    toggle: () => cool.set(!cool.open),
    set: (open) => (cool.open = open),
  };
  // The air conditioner: on, its flap swings open and it blows (the pink note on the board lifts in it).
  const aircon = { on: false, k: 0, next: 0, set: (on) => (aircon.on = on) };
  // The clock: wound on a click, its minute hand going round once, and then it chimes.
  const wallClock = { at: -Infinity, notes: 0, next: 0, wind: (t) => Object.assign(wallClock, { at: t, notes: 3, next: t + 1.4 }) };
  // The dried flowers and the pampas: set swinging (a few dry bits dropping off), the bunches with their
  // branch, each only a little its own way (apart, they would swing into each other; and only a little to and
  // from the wall).
  const branchSwing = swinging(0.55, 1.1, [0.07, 0.2]);
  const sways = bunches.map(() => swinging(0.7 + 0.2 * Math.random(), 1.5, [0.02, 0.04]));
  const pampasSwing = swinging(0.6, 1.1, [0.04, 0.06]);
  const dried = {
    shake() {
      knock(branchSwing, 0.06, 0.18);
      sways.forEach((s) => knock(s, 0.02, 0.04));
      knock(pampasSwing, 0.04, 0.06);
    },
  };
  // The stool's seat: set spinning, slowing to a stop (not while someone sits on it).
  const spin = { speed: 0, taken: false, give: () => (spin.speed = spin.taken ? 0 : 9 + Math.random() * 4) };

  // The lights' look: the sign white and glowing (a halo round it), the downlights bright, the lamps on; off,
  // the sign's tubes grey-white, the downlights pale.
  function look() {
    const on = lights.on;
    signMat.color.set(on ? 0xff86b0 : OFF.sign);
    haloMat.opacity = on ? 0.55 : 0;
    tubeMat.color.set(on ? 0xf4fbff : OFF.lights);
    inside.intensity = on ? 1.25 : 0;
    under.intensity = on ? 0.9 : 0;
  }
  look();

  const was = new Map(); // where each was last frame (to hear the chime as anyone passes under it)
  function update(t, dt, home) {
    // The cool room's door swinging open or shut, the cold light with it.
    cool.k += Math.sign((cool.open ? 1 : 0) - cool.k) * Math.min(Math.abs((cool.open ? 1 : 0) - cool.k), dt / 0.9);
    const e = cool.k * cool.k * (3 - 2 * cool.k);
    coolDoor.rotation.y = -1.75 * e;
    spill.material.opacity = 0.32 * e;
    coldLight.intensity = 24 * e;
    // The lock-up's door sliding open or shut, its light with it.
    lockup.k += Math.sign((lockup.open ? 1 : 0) - lockup.k) * Math.min(Math.abs((lockup.open ? 1 : 0) - lockup.k), dt / 0.8);
    const slide = lockup.k * lockup.k * (3 - 2 * lockup.k);
    lockupDoor.position.x = doorAt - (DX1 - DX0 - 1.5) * slide;
    lockupLight.intensity = 16 * slide;
    // The till's drawer: out with a ring, back after a moment.
    const r = t - register.rangAt;
    const out = r < 0.25 ? r / 0.25 : r < 1.6 ? 1 : r < 1.9 ? 1 - (r - 1.6) / 0.3 : 0;
    drawer.position.x = drawerAt + 3.5 * out;
    // The sign turning round to show its other side.
    openSign.k += Math.sign((openSign.open ? 0 : 1) - openSign.k) * Math.min(Math.abs((openSign.open ? 0 : 1) - openSign.k), dt / 0.6);
    const f = openSign.k * openSign.k * (3 - 2 * openSign.k);
    signGroup.rotation.y = Math.PI * f;
    signGroup.rotation.z = 0.06 * Math.sin(Math.PI * f) * Math.sin(t * 9);
    // The chime: rung by a click, or nudged by anyone passing through the doorway.
    if (home)
      for (const a of home.actors) {
        const before = was.get(a);
        if (before !== undefined && before > Z1 - 1 !== a.z > Z1 - 1 && a.x > DOOR.x0 && a.x < DOOR.x1) chimeBell.ring(a.human ? 0.7 : 0.4);
        was.set(a, a.z);
      }
    chimeSwing.step(dt);
    chime.rotation.set(chimeSwing.x, 0, chimeSwing.z);
    tubesSwing.step(dt);
    chimeTubes.forEach((g, k) => {
      tubeSwings[k].step(dt);
      g.rotation.set(tubesSwing.x + tubeSwings[k].x, 0, tubesSwing.z + tubeSwings[k].z);
    });
    // The downlights flickering on.
    if (lights.on) {
      const s = t - lights.at;
      tubeMat.color.set(s < 0.8 && Math.sin(s * 47) * Math.sin(s * 23) > 0.1 ? 0xb9c0c2 : 0xf4fbff);
    }
    // The air conditioner's flap, its light, its draught; off once the shutter is down.
    if (shutter.k > 0.99) aircon.on = false;
    aircon.k += Math.sign((aircon.on ? 1 : 0) - aircon.k) * Math.min(Math.abs((aircon.on ? 1 : 0) - aircon.k), dt / 0.7);
    flap.rotation.x = 0.8 * aircon.k * aircon.k * (3 - 2 * aircon.k);
    ledMat.color.set(aircon.on ? 0x5bd17a : 0x4a5a50);
    looseNote.rotation.x = -aircon.k * (0.25 + 0.12 * Math.sin(t * 9) + 0.06 * Math.sin(t * 23));
    if (aircon.on && aircon.k > 0.9 && t >= aircon.next) {
      aircon.next = t + 0.45 + Math.random() * 0.3;
      float("air", acMouth, 1.6);
    }
    // The clock's hands at the shop's time (a turn round ahead while it is wound), its chime after.
    const hour = home ? home.hour() : 12;
    const w = Math.min(1, (t - wallClock.at) / 1.4);
    const turn = w < 1 ? w * w * (3 - 2 * w) : 0;
    minuteHand.rotation.z = -((hour % 1) + turn) * Math.PI * 2;
    hourHand.rotation.z = -(((hour % 12) + turn) / 12) * Math.PI * 2;
    if (wallClock.notes && t >= wallClock.next) {
      wallClock.notes--;
      wallClock.next = t + 0.3;
      float("note", clockTop, 2);
    }
    // The dried flowers swinging with their branch (each a little its own way), and the pampas, dying down.
    branchSwing.step(dt);
    bunches.forEach((m, k) => {
      sways[k].step(dt);
      m.rotation.set(branchSwing.x + sways[k].x, 0, branchSwing.z + sways[k].z);
    });
    pampasSwing.step(dt);
    pampas.rotation.set(pampasSwing.x, 0, pampasSwing.z);
    // The stool's seat spinning down.
    spin.taken = !!home && home.actors.some((a) => a.seated && Math.hypot(a.x - STOOL.x, a.z - STOOL.z) < 4);
    if (spin.taken) spin.speed = 0;
    stool.rotation.y += spin.speed * dt;
    spin.speed = Math.max(0, spin.speed - 4 * dt);
    // Music notes rising off the radio while it plays.
    if (radio.on && t >= radio.next) {
      radio.next = t + 0.5 + Math.random() * 0.35;
      float("note", radioTop, 2.6);
    }
    for (const fl of floaters) {
      if (!fl.s.visible) continue;
      const u = (t - fl.born) / fl.life;
      if (u >= 1 || u < 0) {
        fl.s.visible = false;
        continue;
      }
      if (fl.kind === "note") {
        fl.s.position.set(fl.from.x + 3 * u + fl.drift * 2 * Math.sin(u * 6), fl.from.y + 12 * u, fl.from.z + fl.drift * 3 * u);
        fl.s.scale.setScalar(3.2);
        fl.s.material.opacity = Math.min(1, u * 5) * (1 - u);
      } else if (fl.kind === "air") {
        // (down and out into the room from under the air conditioner)
        fl.s.position.set(fl.from.x + fl.drift * 8, fl.from.y - 7 * u, fl.from.z + 9 * u);
        fl.s.scale.setScalar(2.4 + 1.5 * u);
        fl.s.material.opacity = 0.8 * Math.min(1, u * 4) * (1 - u);
      } else if (fl.kind === "bit") {
        // (fluttering down to the floor)
        fl.s.position.set(fl.from.x + fl.drift * 1.5 * Math.sin(u * 9), fl.from.y - (fl.from.y - FLOOR - 0.5) * u, fl.from.z + 2 * u);
        fl.s.scale.setScalar(1.3);
        fl.s.material.opacity = u < 0.85 ? 1 : (1 - u) / 0.15;
      } else {
        fl.s.position.set(fl.from.x, fl.from.y + 3 * u, fl.from.z);
        fl.s.scale.setScalar(2 + 3 * Math.sin(Math.PI * Math.min(1, u * 1.5)));
        fl.s.material.opacity = 1 - u * u;
      }
    }
  }

  // Where she stands to use things (on the floor, clear of the furniture), the way she faces then.
  const spots = {
    // (at the bench's far end, on the kraft paper pulled out: further forward the beam over the front hides it)
    bench: { at: [BX1 + 9, BZ0 + 7], yaw: -1.1, top: [BX0 + 13, TOP, BZ0 + 10] },
    register: { at: [BX1 + 9, BZ1 - 5], yaw: -Math.PI / 2 },
    radio: { at: [BX1 + 9, BZ1 - 30], yaw: Math.atan2(RD.x1 - (BX1 + 9), (RD.z0 + RD.z1) / 2 - (BZ1 - 30)) },
    cool: { at: [(COOL.x0 + COOL.x1) / 2 + 3, Z0 + WALL + 16], yaw: Math.PI },
    shelf: { at: [(SX0 + SX1) / 2, SZ1 + 11], yaw: Math.PI },
    stool: {
      at: [STOOL.x + 10 * Math.sin(0.6), STOOL.z + 10 * Math.cos(0.6)],
      yaw: 0.6,
      seat: [STOOL.x, SEAT, STOOL.z],
      // (as room/steps.js sitOn takes a seat)
      front: [STOOL.x + 10 * Math.sin(0.6), STOOL.z + 10 * Math.cos(0.6)],
      x: STOOL.x,
      z: STOOL.z,
    },
    dogBed: { at: [DX, DZ], y: FLOOR + 2.5 },
    door: { at: [(DOOR.x0 + DOOR.x1) / 2, Z1 + 10] },
  };

  const obstacles = [
    [X0 - 1, DOOR.x0, Z1 - 5, Z1 + 1], // the front, either side of the doorway (the folded doors inside it)
    [DOOR.x1, X1 + 1, Z1 - 5, Z1 + 1],
    [X0 - 1, X1 + 1, Z0 - 1, Z0 + WALL], // the back wall
    [X0 - 1, X0 + WALL, Z0 - 1, Z1 + 1], // the left wall
    [X1 - WALL, X1 + 1, Z0 - 1, Z1 + 1], // the right wall
    [BX0 - 1, BX1 + 1, BZ0 - 1, BZ1 + 1], // the bench
    [SX0 - 1, SX1 + 1, SZ0 - 1, SZ1 + 1], // the shelving
    [STOOL.x - 3, STOOL.x + 3, STOOL.z - 3, STOOL.z + 3], // the stool
    [-36, -10, Z0, Z0 + WALL + 10], // the buckets of stock
    [LOCKUP.x0 - 2, LOCKUP.x1 + 1, LOCKUP.z0 - 2, LOCKUP.z1 + 3], // the lock-up
  ];

  // (None of them while the shutter is down: the shop is shut.)
  const up = () => shutter.k < 0.5;
  const clickables = [
    { key: "radio", parts: [radioMesh], toggle: () => radio.set(!radio.on) },
    { key: "register", parts: [tillMesh, drawer], toggle: () => register.ring(clock.t) },
    { key: "lights", parts: [sign, downlights], toggle: () => lights.set(!lights.on) },
    { key: "openSign", parts: [signGroup], toggle: () => openSign.flip() },
    { key: "chime", parts: [chimeBox], toggle: () => chimeBell.ring() },
    { key: "cool", parts: [coolDoor, curtain], toggle: () => cool.toggle() },
    { key: "aircon", parts: [acBox, flap], toggle: () => aircon.set(!aircon.on) },
    { key: "clock", parts: [dialMesh, hourHand, minuteHand], toggle: () => wallClock.wind(clock.t) },
    {
      key: "dried",
      parts: [...bunches, pampas],
      toggle() {
        dried.shake();
        for (let k = 0; k < 3; k++) {
          const m = bunches[Math.floor(Math.random() * bunches.length)];
          float("bit", new THREE.Vector3(m.position.x, DRY_Y - 11, m.position.z + 1), 1.6 + Math.random() * 0.8);
        }
      },
    },
    { key: "stool", parts: [stool], toggle: () => spin.give() },
  ].map((c) => ({ ...c, can: up }));

  return {
    group,
    obstacles,
    hides: [backMesh, sidesMesh, shellMesh, benchMesh, frameMesh, fascia, housing, rolled, lockupMesh],
    clickables,
    spots,
    radio,
    register,
    lights,
    openSign,
    chime: chimeBell,
    cool,
    aircon,
    shutter,
    lockup,
    // Night: the lights on, unless it is shut up for the night (the sign is turned by hand: life.js).
    dress(night) {
      lights.set(night && shutter.k < 0.99);
    },
    daylight() {},
    update,
    shadowsDirty: () => false,
  };
}
