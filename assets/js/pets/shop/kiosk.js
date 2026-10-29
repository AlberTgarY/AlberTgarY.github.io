/*******************************************************************************
 * The flower shop's kiosk (layout.js KIOSK): a market florist's stall of dark
 * green steel and glass, as in the photos. Steel-framed glass in a grid of
 * slim bars, frosted panels below the sill, painted sunflowers, daisies and
 * gerberas on some of the panes; a wide doorway, its folding glass doors
 * folded back inside against the windows either side; "flowers for every
 * moment" in white neon script hanging behind the beam over it, the number 90
 * on the post; a flat roof, seen cut open like a dolls' house, and the curved
 * glass awning out over the pavement on slim steel ribs, two tube lights
 * under it.
 *
 * Inside, seen through the doorway and the glass: grey damask wallpaper, the
 * wire shelving of vases, pots and boxed roses, the cool room's door (it
 * swings open on a cold blue room of buckets), the air conditioner, the notice
 * board, the wrapping bench along the left wall (the till at its front end,
 * the kraft paper roll, ribbons on a rod, scissors, the radio), a tall stool,
 * the dog's bed, a few buckets of stock waiting by the back wall.
 *
 * Things to click: the radio (music), the till (it rings), the neon sign (the
 * lights), the OPEN / CLOSED sign, the wind chime in the doorway (it chimes as
 * anyone passes under it too) and the cool room's door.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { pixelTexture } from "../room/house/kit.js";
import { part, meshOf, paletteOf } from "./kit.js";
import { KIOSK, FLOOR, DOOR, SILL, LINTEL, AWNING, BENCH, SHELF, COOL, BOARD, DOG_BED, STOOL } from "./layout.js";

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
  potSageRib: "#a5b794",
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
});

// Where things stand inside (the bench's top, the stool's seat), in voxels.
const TOP = FLOOR + BENCH.h; // the bench's worktop
const SEAT = FLOOR + 12; // the stool's seat
const ROOF_Y = KIOSK.h; // the roof's underside (its rim, cut open)
const MULLIONS_Z = [-97, -84, -71, -57, -44]; // the bars between the panes of the side walls
const RAILS = [SILL, 44, LINTEL]; // and across them, as on the front
const WALL = 2; // how thick the back and side walls are

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

// How high the awning's glass is over z: level off the roof's front edge, curving up to its front edge.
export const awningY = (z) => {
  const u = Math.min(1, Math.max(0, (z - AWNING.z0) / (AWNING.z1 - AWNING.z0)));
  return AWNING.y0 - (AWNING.y0 - AWNING.y1) * (1 - Math.cos((u * Math.PI) / 2));
};

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
  // (the clear glass is a sheet of its own).
  function glazed(alongZ, at, t, [a0, a1], bars, frosted) {
    const put = (a, b, [y0, y1], color) =>
      alongZ ? shell.box([at, at + t], [y0, y1], [a, b], color) : shell.box([a, b], [y0, y1], [at, at + t], color);
    put(a0, a1, [0, 2], "steel"); // the base rail
    put(a0, a1, [2, SILL], (x, y) => (y === 2 ? "frostedShade" : "frosted"));
    RAILS.forEach((y) => put(a0, a1, [y, y + 1], "steel"));
    put(a0, a1, [ROOF_Y - 1, ROOF_Y], "steel"); // the rail along the top
    for (const b of bars) put(b, b + 1, [SILL, ROOF_Y], "steel");
    if (frosted) put(a0, a1, [SILL + 1, ROOF_Y - 1], (x, y, z) => ((alongZ ? z : x) === a0 ? "steel" : y % 9 === 0 ? "frostedShade" : "frostGlass"));
  }
  glazed(true, X0, WALL, [Z0, Z1], MULLIONS_Z, true); // the left wall
  glazed(true, X1 - WALL, WALL, [Z0, Z1], MULLIONS_Z, false); // the right wall
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
  // and the right (the sides seen) only a thin steel edge, to see in over it.
  const rim = (xs, zs) => shell.box(xs, [ROOF_Y, ROOF_Y + KIOSK.roof - 1], zs, (x, y) => (y === ROOF_Y + KIOSK.roof - 2 ? "roof" : "steel"));
  rim([X0, X1], [Z0, Z0 + 4]);
  rim([X0, X0 + 4], [Z0, Z1]);
  shell.box([X0, X1], [ROOF_Y, ROOF_Y + 1], [Z1 - 2, Z1], "steel");
  shell.box([X1 - 2, X1], [ROOF_Y, ROOF_Y + 1], [Z0, Z1], "steel");
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
    sheet([Z0 + 2, Z1 - 2], [SILL + 1, ROOF_Y - 1], X1 - 1, glass, true),
  ];
  panes.forEach((m) => add(m, false, false));

  // The flowers painted on the glass: on the side windows outside (seen from the pavement), and on the left
  // wall's frosted panes inside.
  const decals = { sunflower: flowerDecal("sunflower"), daisy: flowerDecal("daisy"), gerbera: flowerDecal("gerbera") };
  const decalMat = Object.fromEntries(
    Object.entries(decals).map(([k, tex]) => [k, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide })])
  );
  const decal = (kind, [a, y], size, at, alongZ) =>
    add(sheet([a - size / 2, a + size / 2], [y - size / 2, y + size / 2], at, decalMat[kind], alongZ), false, false);
  decal("sunflower", [-90.5, 53], 17, X1 + 0.05, true);
  decal("gerbera", [-77.5, 36], 14, X1 + 0.05, true);
  decal("daisy", [-63.5, 53], 13, X1 + 0.05, true);
  decal("sunflower", [-50.5, 36], 14, X1 + 0.05, true);
  decal("gerbera", [-25.5, 53], 13, Z1 + 0.05, false);
  decal("daisy", [-9.5, 36], 12, Z1 + 0.05, false);
  decal("sunflower", [-102.5, 53], 16, X0 + WALL + 0.05, true);
  decal("gerbera", [-77.5, 53], 14, X0 + WALL + 0.05, true);
  decal("daisy", [-63.5, 36], 12, X0 + WALL + 0.05, true);
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
  /* ----- the neon sign behind the beam, hung on two wires ----- */

  const signTex = neonTexture();
  const SIGN_W = 56;
  const SIGN_C = [(DOOR.x0 + DOOR.x1) / 2, 54.5, Z1 - 4];
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, depthWrite: false, color: 0xd8d8d4 });
  const sign = sheet([SIGN_C[0] - SIGN_W / 2, SIGN_C[0] + SIGN_W / 2], [SIGN_C[1] - 6, SIGN_C[1] + 6], SIGN_C[2], signMat);
  group.add(sign);
  const haloMat = new THREE.MeshBasicMaterial({
    map: signTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
    color: 0xfff4e6,
  });
  const halo = sheet([SIGN_C[0] - SIGN_W / 2 - 3, SIGN_C[0] + SIGN_W / 2 + 3], [SIGN_C[1] - 8, SIGN_C[1] + 8], SIGN_C[2] - 0.1, haloMat);
  group.add(halo);
  for (const x of [SIGN_C[0] - 20, SIGN_C[0] + 20]) fine.box([x, x + 0.5], [SIGN_C[1] + 3.5, LINTEL], [SIGN_C[2], SIGN_C[2] + 0.5], "chromeDark");

  yield;
  /* ----- the awning: curved tinted glass on steel ribs, a post at its far end, two tube lights under it ----- */

  const frame = grid(0.5);
  const AW = AWNING;
  for (let x = AW.x0; x <= AW.x1; x += 30) {
    const rx = Math.min(x, AW.x1 - 1);
    for (let z = AW.z0; z < AW.z1 + 0.5; z += 0.5) frame.box([rx, rx + 1], [awningY(z) - 1, awningY(z) + 0.5], [z, z + 0.5], "steel");
  }
  frame.box([AW.x0, AW.x1], [AW.y1 - 0.5, AW.y1 + 0.5], [AW.z1 - 0.5, AW.z1 + 0.5], "steel"); // its front edge
  frame.box([X1, AW.x1], [AW.y0 - 1, AW.y0 + 0.5], [AW.z0, AW.z0 + 1], "steel"); // the beam along its back, past the kiosk
  frame.box([AW.x1 - 1, AW.x1], [0, AW.y0], [AW.z0 - 0.5, AW.z0 + 0.5], "steelDark"); // and the post holding it up
  // The tube lights, hung under the ribs on two short rods each.
  const TUBES = [
    [-128, -100, -17],
    [-14, 18, -17],
  ];
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xd9dfde });
  const tubes = TUBES.map(([x0, x1, z]) => {
    const y = awningY(z) - 4;
    frame.box([x0 - 1, x1 + 1], [y + 0.5, y + 1.5], [z - 1, z + 1], "steelDark");
    for (const x of [x0 + 4, x1 - 4]) frame.box([x, x + 0.5], [y + 1.5, awningY(z) - 1], [z, z + 0.5], "chromeDark");
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 1, 1), tubeMat);
    m.position.set((x0 + x1) / 2, y, z);
    group.add(m);
    return m;
  });
  const frameMesh = add(frame.mesh(), true, false);
  // The glass itself: one curved sheet over the whole width.
  const ROWS = 24;
  const pos = [];
  const index = [];
  for (let r = 0; r <= ROWS; r++) {
    const z = AW.z0 + ((AW.z1 - AW.z0) * r) / ROWS;
    pos.push(AW.x0, awningY(z) + 0.6, z, AW.x1, awningY(z) + 0.6, z);
    if (r) index.push(2 * r - 2, 2 * r - 1, 2 * r, 2 * r - 1, 2 * r + 1, 2 * r);
  }
  const awningGeo = new THREE.BufferGeometry();
  awningGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  awningGeo.setIndex(index);
  add(
    new THREE.Mesh(
      awningGeo,
      new THREE.MeshBasicMaterial({
        color: 0x7fae9b,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
        forceSinglePass: true,
      })
    ),
    false,
    false
  );

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
  const ribbed = (cx, cz, r, y, h, color, rib) =>
    fine.cyl(cx, cz, r, [y, y + h], (x, yy, z) => (Math.round(Math.atan2(z - cz, x - cx) * 3) % 2 ? rib : color));
  const SZ = (SZ0 + SZ1) / 2;
  // Bottom deck: black nursery pots stacked, a cream pot.
  for (const [x, n] of [
    [SX0 + 4, 3],
    [SX0 + 11, 2],
  ])
    for (let k = 0; k < n; k++) fine.cyl(x, SZ, 3 - k * 0.2, [DECKS[0] + k * 2, DECKS[0] + k * 2 + 2.5], k % 2 ? "potBlack" : "bucketBlackRim");
  ribbed(SX1 - 7, SZ, 3.5, DECKS[0], 7, "potCream", "potCreamRib");
  // Second: tall ribbed pink pots and a sage one.
  [SX0 + 4, SX0 + 11, SX0 + 18].forEach((x) => ribbed(x, SZ, 2.8, DECKS[1], 9, "potPink", "potPinkRib"));
  ribbed(SX1 - 5, SZ, 3, DECKS[1], 7, "potSage", "potSageRib");
  // Third: small pots, cream and sage and pink.
  [
    [SX0 + 4, "potCream", "potCreamRib"],
    [SX0 + 10, "potSage", "potSageRib"],
    [SX0 + 16, "potPink", "potPinkRib"],
    [SX0 + 22, "potCream", "potCreamRib"],
  ].forEach(([x, c, r]) => ribbed(x, SZ, 2.3, DECKS[2], 5, c, r));
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
  // The glass: vases on the fourth deck, the clear boxes round the roses on top.
  const clear = grid(0.5);
  [
    [SX0 + 4, 2.2, 9],
    [SX0 + 10, 1.6, 7],
    [SX0 + 16, 2.6, 6],
    [SX0 + 22, 1.8, 10],
    [SX0 + 27, 1.5, 7],
  ].forEach(([x, r, h]) => clear.cyl(x, SZ, r, [DECKS[3], DECKS[3] + h], "#cfe6e8", r - 0.6));
  for (const [cx] of ROSE_BOXES) clear.box([cx - 4, cx + 4], [DECKS[4], DECKS[4] + 6.5], [SZ - 3, SZ + 3], "#e8f1f2");
  const clearMesh = clear.mesh();
  clearMesh.material = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false });
  add(clearMesh, false, false);

  // The notice board: cork in an oak frame, notes pinned on it.
  const bz = Z0 + WALL;
  fine.box([BOARD.x0, BOARD.x1], [BOARD.y0, BOARD.y1], [bz, bz + 0.5], (x, y) =>
    x < BOARD.x0 + 1 || x >= BOARD.x1 - 1 || y < BOARD.y0 + 1 || y >= BOARD.y1 - 1 ? "oak" : (x + y) % 3 ? "cork" : "corkDark"
  );
  [
    [BOARD.x0 + 2, BOARD.y1 - 9, 6, 7, "paperWhite", "pinRed"],
    [BOARD.x0 + 9.5, BOARD.y1 - 7, 5, 5, "paperYellow", "pinBlue"],
    [BOARD.x0 + 15.5, BOARD.y1 - 10, 4.5, 8, "paperPink", "pinRed"],
    [BOARD.x0 + 3, BOARD.y0 + 2, 7, 6, "paperBlue", "pinBlue"],
    [BOARD.x0 + 12, BOARD.y0 + 2.5, 7, 5, "paperWhite", "pinRed"],
  ].forEach(([x, y, w, h, c, pin]) => {
    fine.box([x, x + w], [y, y + h], [bz + 0.5, bz + 1], (xx, yy) =>
      yy < y + h - 1.5 && yy > y + 0.5 && xx > x + 0.5 && xx < x + w - 1 && (yy * 2) % 2 === 0 ? "paperLine" : c
    );
    fine.box([x + w / 2 - 0.5, x + w / 2], [y + h - 1, y + h - 0.5], [bz + 1, bz + 1.5], pin);
  });

  // The air conditioner, high on the back wall: white, its louvre along the bottom, a green light.
  fine.box([-38, -14], [56, 63], [bz, bz + 5], (x, y) => (y < 57.5 ? ((x * 2) % 2 ? "acShade" : "acWhite") : y === 62.5 ? "acShade" : "acWhite"));
  fine.box([-17, -16.5], [61, 61.5], [bz + 5, bz + 5.5], "acLed");

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

  // The stool: a round oak seat on four splayed black legs, a footrest ring.
  const STOOL_R = 3.5;
  fine.cyl(STOOL.x, STOOL.z, STOOL_R, [SEAT - 1.5, SEAT], (x, y, z, d) => (y >= SEAT - 0.5 ? (d > STOOL_R - 0.8 ? "oakDark" : "oak") : "oakDark"));
  for (const [dx, dz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ])
    for (let y = FLOOR; y < SEAT - 1.5; y += 0.5) {
      const k = 1.2 + ((SEAT - 1.5 - y) / (SEAT - 1.5 - FLOOR)) * 2; // splaying out towards the floor
      const [x, z] = [STOOL.x + dx * k, STOOL.z + dz * k];
      fine.box([x, x + 0.5], [y, y + 0.5], [z, z + 0.5], "steelDark");
    }
  fine.cyl(STOOL.x, STOOL.z, 2.6, [FLOOR + 4, FLOOR + 4.5], "steelDark", 2);

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
  chimeTop.ball([0.12, -5, 0.12], 0.6, "oak");
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

  // Music notes over the radio, a sparkle over the till or the chime: a few sprites, each used again.
  const noteTex = [glyphTexture("♪", "#5a7fd6"), glyphTexture("♫", "#d65a8f"), glyphTexture("♪", "#3f9a6b")];
  const sparkTex = glyphTexture("✦", "#f2b632");
  const floaters = Array.from({ length: 8 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex[0], transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false;
    group.add(s);
    return { s, born: -1, life: 1, from: new THREE.Vector3(), drift: 0, kind: "note" };
  });
  function float(kind, at, life) {
    const f = floaters.reduce((a, b) => (a.born < b.born ? a : b)); // the oldest
    Object.assign(f, { born: clock.t, life, kind, drift: Math.random() * 2 - 1 });
    f.from.copy(at);
    f.s.material.map = kind === "note" ? noteTex[Math.floor(Math.random() * noteTex.length)] : sparkTex;
    f.s.visible = true;
  }

  yield;
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
  const chimeState = { rangAt: -Infinity, strength: 0 };
  const chimeBell = {
    ring(t = clock.t, strength = 1) {
      chimeState.rangAt = t;
      chimeState.strength = strength;
      float("spark", new THREE.Vector3(CH[0], CH[1] - 12, CH[2]), 0.7);
    },
  };
  const cool = {
    k: 0,
    open: false,
    toggle: () => cool.set(!cool.open),
    set: (open) => (cool.open = open),
  };

  // The lights' look: the sign white and glowing (a halo round it), the tubes bright, the lamps on; off, the
  // sign's tubes grey-white, the tubes pale.
  function look() {
    const on = lights.on;
    signMat.color.set(on ? 0xffffff : 0xd8d8d4);
    haloMat.opacity = on ? 0.55 : 0;
    tubeMat.color.set(on ? 0xf4fbff : 0xd9dfde);
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
        if (before !== undefined && before > Z1 - 1 !== a.z > Z1 - 1 && a.x > DOOR.x0 && a.x < DOOR.x1) chimeBell.ring(t, a.human ? 0.7 : 0.4);
        was.set(a, a.z);
      }
    const c = t - chimeState.rangAt;
    const swing = c < 4 ? chimeState.strength * Math.exp(-1.4 * c) : 0;
    chime.rotation.z = 0.12 * swing * Math.sin(c * 4.2);
    chime.rotation.x = 0.08 * swing * Math.sin(c * 3.3 + 1);
    chimeTubes.forEach((g, k) => {
      g.rotation.z = 0.35 * swing * Math.sin(c * (8 + k * 1.3) + k);
      g.rotation.x = 0.3 * swing * Math.sin(c * (7 + k) + 2 * k);
    });
    // The tube lights flickering on.
    if (lights.on) {
      const s = t - lights.at;
      tubeMat.color.set(s < 0.8 && Math.sin(s * 47) * Math.sin(s * 23) > 0.1 ? 0xb9c0c2 : 0xf4fbff);
    }
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
    [AWNING.x1 - 2.5, AWNING.x1 + 0.5, AWNING.z0 - 1.5, AWNING.z0 + 1.5], // the awning's post
  ];

  const clickables = [
    { key: "radio", parts: [radioMesh], toggle: () => radio.set(!radio.on) },
    { key: "register", parts: [tillMesh, drawer], toggle: () => register.ring(clock.t) },
    { key: "lights", parts: [sign, ...tubes], toggle: () => lights.set(!lights.on) },
    { key: "openSign", parts: [signGroup], toggle: () => openSign.flip() },
    { key: "chime", parts: [chimeBox], toggle: () => chimeBell.ring(clock.t) },
    { key: "cool", parts: [coolDoor, curtain], toggle: () => cool.toggle() },
  ];

  return {
    group,
    obstacles,
    hides: [backMesh, sidesMesh, shellMesh, benchMesh, frameMesh],
    clickables,
    spots,
    radio,
    register,
    lights,
    openSign,
    chime: chimeBell,
    cool,
    // Night: the lights on and the sign turned to CLOSED; morning, off and OPEN.
    dress(night) {
      lights.set(night);
      openSign.set(!night);
    },
    daylight() {},
    update,
    shadowsDirty: () => false,
  };
}
