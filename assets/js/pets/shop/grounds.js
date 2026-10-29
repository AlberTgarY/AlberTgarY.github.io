/*******************************************************************************
 * The flower shop's grounds (layout.js): the pavement of big bluestone pavers,
 * the painted hoarding along the back (big daisies, sunflowers and pink
 * dahlias on deep green, a market banner and a speech bubble), the house
 * plants on their concrete plinth and wire rack with trays in front (peace
 * lilies, rubber plants, monstera, calathea, peperomia, anthurium, cacti, ZZ,
 * dracaena, with price picks), the plane tree in its iron grate, the empty
 * buckets stacked by the left, the chalkboard A-frame, the tap on the kiosk's
 * wall with the watering can by it, the dog's water bowl, petals and leaves
 * on the ground (petals), and the pigeons and the sparrow pecking about out
 * front (birds).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { hash, ellipsoid } from "../models/voxels.js";
import { pixelTexture } from "../room/house/kit.js";
import { VIEW_YAW } from "../room/view.js";
import { rnd, pick } from "../stage.js";
import { part, box, meshOf, voxels, paletteOf } from "./kit.js";
import { GROUND, MURAL, KIOSK, FLOOR, PLINTH, TRAYS, TREE, TAP, BUCKET_STACKS, SIGN, BOWL, MIDDLE, RIGHT, LEFT, DOOR } from "./layout.js";

const HALF = 0.5; // the fine parts are built in half voxels
const SLAB = 6; // the pavement's depth under its top (y = 0)
const BACK_Z = MURAL.z + 2; // the mural's painted face (z = -110)

// The colours of the grounds' own things.
const PALETTE = paletteOf({
  potRim: "#3a3a3d",
  pinkRim: "#f6d6d2",
  pebble: "#ece8df",
  lilyLeaf: "#2f5f2a",
  lilyRib: "#244a20",
  spathe: "#f6f6ef",
  spadix: "#efe3b0",
  stalk: "#5a8a3a",
  rubber: "#3b1f2a",
  rubberLight: "#5d3343",
  rubberRib: "#7a3c46",
  rubberStem: "#5a4a32",
  monstera: "#7fb24a",
  monsteraRib: "#5d8f35",
  calDark: "#3d6a35",
  calLight: "#a8c878",
  silver: "#c3cbc6",
  silverVein: "#55635b",
  rosso: "#34452f",
  rossoEdge: "#8a2a35",
  anthLeaf: "#2c5a2c",
  anthRed: "#c8202f",
  anthSpadix: "#e8d26a",
  cactus: "#4f7f45",
  cactusDark: "#3e6a37",
  spine: "#efeee6",
  cactusBloom: "#e85a9a",
  zz: "#2e5d2c",
  zzLight: "#4c8a45",
  dracEdge: "#4f8a3a",
  dracStripe: "#c9d86a",
  stick: "#f1efe8",
  stickGreen: "#2d9a5c",
  stickYellow: "#e3cf3e",
  rack: "#b4bcbf",
  rackDark: "#959ea2",
  tray: "#1f2022",
  grate: "#3a3b3d",
  grateDark: "#2a2b2d",
  rail: "#9aa1a4",
  railDark: "#81888b",
  brass: "#c8a24a",
  brassDark: "#9c7a30",
  pipe: "#a8743e",
  steelBowl: "#c9cfd2",
  steelBowlDark: "#a3abaf",
  galv: "#b9c0c2",
  galvDark: "#9aa3a6",
  galvLight: "#d3d9da",
  boardFrame: "#8f6440",
  boardFrameDark: "#71502f",
});

// The trays on the pavement and the plants on the plinth and its rack: each plant's kind, place (world x,
// z) and the height its pot stands on.
const RACK = { x0: PLINTH.x0 + 6, x1: PLINTH.x1 - 6, low: { z0: -97, z1: -90, y: 22 }, high: { z0: -104, z1: -97, y: 30 } };

/* ---------------------------------------------------------------------------------------------------------- */
/* The plants, in half voxels (h): a pot at (cx, cy, cz), the plant on it. */

// A round pot of radius r and height h, its rim lighter, soil (or pebbles) on top, sunk a little.
function pot(p, cx, cy, cz, r, h, color, rim, top = "soil") {
  for (let y = 0; y < h; y++) {
    const rr = r;
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        const d = dx * dx + dz * dz;
        if (d > rr * rr + 0.6) continue;
        const inner = d <= (rr - 1) * (rr - 1) + 0.6;
        if (y === h - 1 && inner) p.add(cx + dx, cy + y - 1, cz + dz, top); // (the top, sunk a little)
        else if (y === h - 1 || !inner || y < h - 2) p.add(cx + dx, cy + y, cz + dz, y === h - 1 ? rim : color);
      }
  }
}

// A flat leaf: from `from` along `dir` (unit steps) for `len`, `width` at its widest (a lens shape), across
// the horizontal at right angles; `color(s, k)` for a voxel `s` along and `k` across (0 the midrib).
function leaf(p, [fx, fy, fz], dir, len, width, color, holes = null) {
  const n = Math.hypot(...dir);
  const [dx, dy, dz] = dir.map((v) => v / n);
  let [px, pz] = [-dz, dx];
  const pn = Math.hypot(px, pz) || 1;
  [px, pz] = [px / pn, pz / pn];
  for (let s = 0; s <= len; s++) {
    const w = Math.max(0.5, width * Math.sin((Math.PI * (s + 0.6)) / (len + 1.2)));
    for (let k = -Math.round(w); k <= Math.round(w); k++) {
      if (holes && holes(s, k)) continue;
      p.add(Math.round(fx + dx * s + px * k), Math.round(fy + dy * s), Math.round(fz + dz * s + pz * k), color(s, k));
    }
  }
}

// A thin stalk from `from` up to `to`.
function stalk(p, [ax, ay, az], [bx, by, bz], color) {
  const n = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az)));
  for (let k = 0; k <= n; k++)
    p.add(Math.round(ax + ((bx - ax) * k) / n), Math.round(ay + ((by - ay) * k) / n), Math.round(az + ((bz - az) * k) / n), color);
}

// Leaves spread round from (cx, cy, cz): `n` of them, leaning out by `out` (0 straight up, 1 level).
const around = (n, seed, out, upFirst = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + hash(seed, i, 3) * 0.7;
    const lean = out + upFirst * (i % 2) + (hash(seed, i, 5) - 0.5) * 0.25;
    return [Math.cos(a) * lean, 1 - lean * 0.6, Math.sin(a) * lean];
  });

// A cactus's ribs: dark and light bands round its axis.
const rib = (dx, dz) => (Math.floor((Math.atan2(dz, dx) + Math.PI) / 0.79) % 2 ? "cactusDark" : "cactus");

export const PLANTS = {
  // Peace lily: dark lance leaves arching out, white spathes on tall stalks.
  lily(p, x, y, z, s) {
    pot(p, x, y, z, 5, 8, "potBlack", "potRim");
    const top = y + 7;
    around(5, s, 0.45).forEach((d, i) =>
      leaf(p, [x, top, z], d, 12 + Math.round(hash(s, i, 1) * 3), 1.6, (_, k) => (k === 0 ? "lilyRib" : "lilyLeaf"))
    );
    for (let i = 0; i < 2 + (s % 2); i++) {
      const a = hash(s, i, 7) * 6.28;
      const [ex, ez] = [x + Math.round(Math.cos(a) * 3), z + Math.round(Math.sin(a) * 3)];
      const h = top + 18 + Math.round(hash(s, i, 8) * 5);
      stalk(p, [x, top, z], [ex, h, ez], "stalk");
      ellipsoid(p, [ex, h + 3, ez], [1.6, 3.2, 1.1], "spathe");
      p.add(ex, h + 2, ez + 1, "spadix");
    }
  },
  // Rubber plant: an upright stem with big glossy burgundy leaves, alternating.
  rubber(p, x, y, z, s) {
    pot(p, x, y, z, 5, 8, "potBlack", "potRim");
    const top = y + 7;
    const h = 30 + (s % 3) * 3;
    stalk(p, [x, top, z], [x, top + h, z], "rubberStem");
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4 + s;
      const at = top + 7 + k * 4.2;
      leaf(p, [x, at, z], [Math.cos(a), 0.55, Math.sin(a)], 7, 2.0, (q, w) => (w === 0 ? "rubberRib" : q > 3 && w < 0 ? "rubberLight" : "rubber"));
    }
    ellipsoid(p, [x, top + h + 1, z], [0.8, 2, 0.8], "rossoEdge"); // (the new leaf's red sheath)
  },
  // Monstera adansonii: bright heart leaves with holes along the midrib.
  monstera(p, x, y, z, s) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(6, s, 0.75).forEach((d, i) =>
      leaf(
        p,
        [x, y + 5, z],
        d,
        6,
        2.2,
        (_, k) => (k === 0 ? "monsteraRib" : "monstera"),
        (q, k) => q >= 2 && q <= 5 && Math.abs(k) === 1 && (q + i) % 2 === 0
      )
    );
  },
  // Calathea: upright ovals, feathered pale and dark.
  calathea(p, x, y, z, s) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(5, s, 0.4).forEach((d) => leaf(p, [x, y + 5, z], d, 8, 1.8, (q, k) => (q % 3 === 1 && k !== 0 ? "calLight" : "calDark")));
  },
  // Peperomia: a low rosette of round leaves, silver with dark veins (or the dark red-edged kind).
  peperomia(p, x, y, z, s, rosso = false) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(8, s, 0.8).forEach((d) =>
      leaf(p, [x, y + 6, z], d, 4, 1.3, (q, k) => (rosso ? (Math.abs(k) >= 1 && q > 1 ? "rossoEdge" : "rosso") : k === 0 ? "silverVein" : "silver"))
    );
    ellipsoid(p, [x, y + 7, z], [1, 1, 1], rosso ? "rosso" : "silver");
  },
  // Anthurium: dark glossy hearts and red spathes, a yellow spadix standing out of each.
  anthurium(p, x, y, z, s) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(4, s, 0.5).forEach((d) => leaf(p, [x, y + 5, z], d, 6, 1.9, () => "anthLeaf"));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + s;
      const [ex, ez] = [x + Math.round(Math.cos(a) * 3), z + Math.round(Math.sin(a) * 3)];
      const h = y + 13 + i * 2;
      stalk(p, [x, y + 5, z], [ex, h, ez], "stalk");
      ellipsoid(p, [ex, h + 1, ez], [2.2, 2.2, 0.6], "anthRed");
      p.add(ex, h + 2, ez + 1, "anthSpadix");
      p.add(ex, h + 3, ez + 1, "anthSpadix");
    }
  },
  // A ball cactus in a pink pot on white pebbles, spined, some in flower.
  ball(p, x, y, z, s) {
    pot(p, x, y, z, 5, 7, "potPink", "pinkRim", "pebble");
    ellipsoid(p, [x, y + 10, z], [4, 4.2, 4], (vx, vy, vz) => (hash(vx, vy, vz) < 0.1 ? "spine" : rib(vx - x, vz - z)));
    if (s % 3 !== 0)
      for (const [dx, dz] of [
        [0, 0],
        [2, 1],
        [-1, -2],
      ])
        p.add(x + dx, y + 15, z + dz, "cactusBloom");
  },
  // A column cactus, ribbed, or an old man cactus in white hair.
  column(p, x, y, z, s, hairy = false) {
    pot(p, x, y, z, 5, 7, "potPink", "pinkRim", "pebble");
    const h = 16 + (s % 3) * 3;
    ellipsoid(p, [x, y + 6 + h / 2, z], [3, h / 2, 3], (vx, vy, vz) =>
      hairy ? (hash(vx >> 1, vy >> 1, vz) < 0.75 ? "spine" : "cactus") : hash(vx, vy, vz) < 0.08 ? "spine" : rib(vx - x, vz - z)
    );
    if (!hairy) ellipsoid(p, [x + 3, y + 8 + h / 3, z], [1.6, 3, 1.6], "cactus"); // (an arm)
  },
  // ZZ plant: stiff stalks of paired glossy leaflets.
  zz(p, x, y, z, s) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(5, s, 0.3).forEach(([dx, dy, dz], i) => {
      const n = 9 + (i % 3) * 2;
      for (let k = 0; k <= n; k++) {
        const [px, py, pz] = [x + Math.round(dx * k), y + 5 + Math.round(dy * k), z + Math.round(dz * k)];
        p.add(px, py, pz, "zz");
        if (k > 2 && k % 2 === 0) {
          p.add(px + 1, py, pz, "zzLight");
          p.add(px - 1, py, pz, "zz");
        }
      }
    });
  },
  // Dracaena: long arching leaves, green edged with a yellow-green stripe.
  dracaena(p, x, y, z, s) {
    pot(p, x, y, z, 4, 6, "potBlack", "potRim");
    around(6, s, 0.55).forEach((d) => leaf(p, [x, y + 5, z], d, 9, 1.2, (_, k) => (k === 0 ? "dracStripe" : "dracEdge")));
  },
};

/* ---------------------------------------------------------------------------------------------------------- */
/* Canvas pictures: the pavement, the mural, the A-frame's chalkboards, the price picks. */

// The pavement: big bluestone pavers in running bond, each its own shade, speckled; a slot drain.
function pavingTexture() {
  const S = 2; // texels a voxel
  const [w, d] = [(GROUND.x1 - GROUND.x0) * S, (GROUND.z1 - (BACK_Z - 4)) * S];
  return pixelTexture(w, d, (g) => {
    const [PW, PD] = [30 * S, 15 * S];
    for (let row = 0; row * PD < d; row++)
      for (let col = -1; col * PW < w; col++) {
        const x = col * PW + (row % 2) * (PW / 2);
        const t = hash(row, col, 11);
        const base = 90 + Math.round(t * 12);
        g.fillStyle = `rgb(${base},${base + 3},${base + 6})`;
        g.fillRect(x, row * PD, PW, PD);
        for (let k = 0; k < 40; k++) {
          const [sx, sy] = [x + hash(row, col, k) * PW, row * PD + hash(col, row, k + 50) * PD];
          const v = base + (hash(k, row, col) < 0.5 ? -8 : 7);
          g.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
          g.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
        }
        g.fillStyle = "#4a4c4f";
        g.fillRect(x, row * PD, PW, 1);
        g.fillRect(x, row * PD, 1, PD);
      }
    // A slot drain along the front right.
    const [x0, x1, z] = [(116 - GROUND.x0) * S, (176 - GROUND.x0) * S, (GROUND.z1 - 6 - (BACK_Z - 4)) * S];
    g.fillStyle = "#3d3f42";
    g.fillRect(x0, z, x1 - x0, 3 * S);
    g.fillStyle = "#26282a";
    for (let x = x0 + 2; x < x1 - 2; x += 3) g.fillRect(x, z + 1, 2, 3 * S - 2);
  });
}

// The mural: deep green, big leaves, and over them big painted daisies, sunflowers and pink dahlias; at the
// left of what shows past the kiosk a cream market banner, and a yellow speech bubble under it.
function muralTexture() {
  const S = 6; // texels a voxel (sharp close up: the view zooms in to 12 px a voxel)
  const K = S / 2; // (the sizes below were set in texels at 2 a voxel)
  const W = (GROUND.x1 - GROUND.x0) * S;
  const H = MURAL.h * S;
  const u = (x) => (x - GROUND.x0) * S;
  const v = (y) => (MURAL.h - y) * S;
  const mural = pixelTexture(W, H, (g) => {
    g.fillStyle = "#1d5a33";
    g.fillRect(0, 0, W, H);
    // Big leaves, two greens.
    for (let k = 0; k < 46; k++) {
      const [x, y] = [GROUND.x0 + hash(k, 1, 2) * (GROUND.x1 - GROUND.x0), hash(k, 3, 4) * MURAL.h];
      g.save();
      g.translate(u(x), v(y));
      g.rotate(hash(k, 5, 6) * 6.28);
      g.fillStyle = k % 3 ? "#2f7a3e" : "#164a29";
      g.beginPath();
      g.ellipse(0, 0, (26 + hash(k, 7, 8) * 16) * K, 9 * K, 0, 0, 6.29);
      g.fill();
      g.strokeStyle = "#5f9e4a";
      g.lineWidth = K;
      g.beginPath();
      g.moveTo(-24 * K, 0);
      g.lineTo(24 * K, 0);
      g.stroke();
      g.restore();
    }
    const petals = (x, y, r, n, len, wid, color, edge, turn = 0) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + turn;
        g.save();
        g.translate(u(x) + Math.cos(a) * r * S * 0.52, v(y) - Math.sin(a) * r * S * 0.52);
        g.rotate(-a);
        g.fillStyle = color;
        g.beginPath();
        g.ellipse(0, 0, len * r * S, wid * r * S, 0, 0, 6.29);
        g.fill();
        if (edge) {
          g.strokeStyle = edge;
          g.lineWidth = 1.5 * K;
          g.stroke();
        }
        g.restore();
      }
    };
    const disc = (x, y, r, color) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(u(x), v(y), r * S, 0, 6.29);
      g.fill();
    };
    const dots = (x, y, r, color) => {
      g.fillStyle = color;
      for (let k = 0; k < r * 6; k++) {
        const [a, d] = [hash(k, x, 1) * 6.28, Math.sqrt(hash(k, y, 2)) * r * S * 0.85];
        g.fillRect(Math.round(u(x) + Math.cos(a) * d), Math.round(v(y) + Math.sin(a) * d), 2 * K, 2 * K);
      }
    };
    const FLOWERS = {
      daisy(x, y, r) {
        petals(x, y, r, 18, 0.5, 0.13, "#fbfbf6", "#d9ddd8");
        disc(x, y, r * 0.3, "#f2c230");
        dots(x, y, r * 0.3, "#d99a1e");
      },
      sunflower(x, y, r) {
        petals(x, y, r, 22, 0.5, 0.12, "#f0a51c", null, 0.14);
        petals(x, y, r * 0.92, 22, 0.47, 0.12, "#f8cc2a", "#e8a018");
        disc(x, y, r * 0.38, "#3b2414");
        dots(x, y, r * 0.38, "#6a4424");
        disc(x, y, r * 0.15, "#2a170c");
      },
      dahlia(x, y, r) {
        petals(x, y, r, 16, 0.5, 0.17, "#ec3f8a", "#c92a6f");
        petals(x, y, r * 0.75, 14, 0.45, 0.17, "#f36aa6", "#d84a8a", 0.2);
        petals(x, y, r * 0.5, 12, 0.42, 0.18, "#f8a0c4", null, 0.1);
        disc(x, y, r * 0.17, "#f4c53a");
        dots(x, y, r * 0.17, "#e0902a");
      },
    };
    // (Those over the kiosk only show above its roof; the most to the right of it.)
    for (const [kind, x, y, r] of [
      ["daisy", -128, 82, 14],
      ["dahlia", -82, 84, 13],
      ["sunflower", -40, 83, 13],
      ["daisy", 6, 86, 12],
      ["dahlia", 44, 66, 18],
      ["daisy", 76, 74, 21],
      ["sunflower", 116, 50, 25],
      ["daisy", 92, 22, 15],
      ["dahlia", 166, 50, 17],
      ["daisy", 156, 18, 22],
      ["sunflower", 178, 82, 16],
      ["daisy", 128, 86, 12],
      ["dahlia", 60, 34, 12],
    ])
      FLOWERS[kind](x, y, r);
    // The banner and the bubble, between the kiosk and the plants.
    g.fillStyle = "#f4ead2";
    g.fillRect(u(2), v(84), 58 * S, 14 * S);
    g.fillStyle = "#1d5a33";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `bold ${7 * S}px "Trebuchet MS", "Segoe UI", sans-serif`;
    g.fillText("FLOWER MARKET", u(31), v(79.5));
    g.font = `${3.6 * S}px "Trebuchet MS", "Segoe UI", sans-serif`;
    g.fillText("fresh every morning · since 1878", u(31), v(73.6));
    g.fillStyle = "#f6d23a";
    g.beginPath();
    g.ellipse(u(16), v(46), 15 * S, 11 * S, 0, 0, 6.29);
    g.fill();
    g.beginPath();
    g.moveTo(u(8), v(37));
    g.lineTo(u(4), v(30));
    g.lineTo(u(14), v(36));
    g.fill();
    g.fillStyle = "#1b1b1b";
    g.font = `bold ${4.4 * S}px "Segoe Print", "Comic Sans MS", cursive`;
    ["Go on,", "have a", "sniff!"].forEach((line, i) => g.fillText(line, u(16), v(51.5 - i * 5.6)));
  });
  // Smooth, not pixelated: painted, and seen small as often as close up.
  Object.assign(mural.tex, { magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true, anisotropy: 4 });
  return mural;
}

// A chalkboard: "Pick your own bunch", with a tulip, a daisy and a heart doodled round it.
function chalkTexture(back = false) {
  const { tex, g } = pixelTexture(96, 144, (g, w, h) => {
    g.fillStyle = "#2a2d2b";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let k = 0; k < 30; k++) g.fillRect(hash(k, 1, 9) * w, hash(k, 2, 9) * h, 14, 3);
    g.fillStyle = "#f2f0e8";
    g.strokeStyle = "#f2f0e8";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const lines = back ? ["Fresh", "flowers", "today"] : ["Pick", "your own", "bunch"];
    g.font = 'bold 21px "Segoe Print", "Comic Sans MS", cursive';
    lines.forEach((t, i) => g.fillText(t, w / 2, 26 + i * 24));
    // The doodles: a tulip, a daisy, a heart.
    g.lineWidth = 2;
    g.fillStyle = "#f28aa8";
    g.beginPath();
    g.moveTo(22, 112);
    g.lineTo(16, 100);
    g.lineTo(22, 104);
    g.lineTo(28, 98);
    g.lineTo(34, 104);
    g.lineTo(40, 100);
    g.lineTo(34, 112);
    g.closePath();
    g.fill();
    g.strokeStyle = "#8fd18a";
    g.beginPath();
    g.moveTo(28, 112);
    g.lineTo(28, 132);
    g.stroke();
    g.fillStyle = "#f2f0e8";
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.28;
      g.beginPath();
      g.ellipse(66 + Math.cos(a) * 7, 116 + Math.sin(a) * 7, 4, 2, a, 0, 6.29);
      g.fill();
    }
    g.fillStyle = "#f6d23a";
    g.beginPath();
    g.arc(66, 116, 3.5, 0, 6.29);
    g.fill();
    g.fillStyle = "#f5a3b8";
    g.font = "bold 16px sans-serif";
    g.fillText("♥", 48, 134);
  });
  tex.magFilter = tex.minFilter = THREE.LinearFilter; // (the writing smooth, not blocky)
  return tex;
}

// A price pick's card: chalkboard, green or yellow, the price written on it.
function priceTexture(price, kind) {
  const [bg, ink] = { chalk: ["#2a2d2b", "#f2f0e8"], green: ["#1f9a6a", "#ffffff"], yellow: ["#e8d84a", "#222"] }[kind];
  const { tex } = pixelTexture(64, 40, (g, w, h) => {
    g.fillStyle = kind === "chalk" ? "#d8d4ca" : bg;
    g.beginPath();
    g.roundRect(0, 0, w, h, 9);
    g.fill();
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(3, 3, w - 6, h - 6, 7);
    g.fill();
    g.fillStyle = ink;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = kind === "chalk" ? 'bold 24px "Segoe Print", "Comic Sans MS", cursive' : "bold 24px sans-serif";
    g.fillText(price, w / 2, h / 2 + 1);
  });
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  return tex;
}

/* ---------------------------------------------------------------------------------------------------------- */

// Built a part at a time (a yield after each: shop.js spreads the work over frames); returns the grounds.
export function* buildingGrounds(shared) {
  const group = new THREE.Group();
  const shadowy = (m, cast = true) => Object.assign(m, { castShadow: cast, receiveShadow: true });

  /* ----- the pavement: one slab, its top painted, its edges plain ----- */
  const paving = pavingTexture();
  yield;
  const [slabW, slabD] = [GROUND.x1 - GROUND.x0, GROUND.z1 - (BACK_Z - 4)];
  const edge = new THREE.MeshLambertMaterial({ color: "#55585b" });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(slabW, SLAB, slabD), [
    edge,
    edge,
    new THREE.MeshLambertMaterial({ map: paving.tex }),
    edge,
    edge,
    edge,
  ]);
  ground.position.set((GROUND.x0 + GROUND.x1) / 2, -SLAB / 2, (GROUND.z1 + BACK_Z - 4) / 2);
  ground.receiveShadow = true;
  group.add(ground);

  yield;
  /* ----- the mural on its hoarding: the painted face, the steel posts, rail and cap in front of it ----- */
  // In two parts: past the kiosk all of it; over the kiosk only the strip above its roof (behind the kiosk
  // none of it shows, and the cool room is there: kiosk.js).
  const muralMaterial = new THREE.MeshLambertMaterial({ map: muralTexture().tex });
  for (const [x0, x1, y0] of [
    [KIOSK.x1, GROUND.x1, 0],
    [GROUND.x0, KIOSK.x1, KIOSK.h],
  ]) {
    const g = new THREE.PlaneGeometry(x1 - x0, MURAL.h - y0);
    const uv = g.attributes.uv;
    const [u0, u1] = [(x0 - GROUND.x0) / (GROUND.x1 - GROUND.x0), (x1 - GROUND.x0) / (GROUND.x1 - GROUND.x0)];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), y0 / MURAL.h + uv.getY(i) * (1 - y0 / MURAL.h));
    const mural = new THREE.Mesh(g, muralMaterial);
    mural.position.set((x0 + x1) / 2, (y0 + MURAL.h) / 2, BACK_Z);
    mural.receiveShadow = true;
    group.add(mural);
  }

  // Everything built in whole voxels: the hoarding's steel, the plinth and its rack, the tree's grate and
  // trunk, the A-frame's frame.
  const whole = part();
  const back = BACK_Z + 1; // (the posts stand just in front of the face)
  // (The posts and the rail only past the kiosk, which stands against the hoarding to its left.)
  for (const x of [KIOSK.x1 + 3, 60, 120, GROUND.x1 - 1])
    box(whole, [x - 1, x], [0, MURAL.h], [back, back], (vx) => (vx === x ? "railDark" : "rail"));
  box(whole, [KIOSK.x1 + 2, GROUND.x1 - 1], [56, 57], [back, back], (vx, vy) => (vy === 56 ? "railDark" : "rail"));
  box(whole, [GROUND.x0, GROUND.x1 - 1], [MURAL.h, MURAL.h + 1], [back - 2, back], (vx, vy, vz) => (vy === MURAL.h + 1 ? "rail" : "railDark"));

  // The plinth: rough concrete, its top edge chamfered (a lighter band), a darker foot; hollow (only its outer
  // voxels: the inside never shows).
  const P = PLINTH;
  const inside = (x, y, z) => x > P.x0 && x < P.x1 - 1 && y < P.h - 1 && z > P.z0 && z < P.z1 - 1;
  const hollow = { has: inside };
  box(
    whole,
    [P.x0, P.x1 - 1],
    [0, P.h - 1],
    [P.z0, P.z1 - 1],
    (x, y, z) => {
      if (y === P.h - 1 && (z === P.z1 - 1 || x === P.x0 || x === P.x1 - 1)) return "concreteLight";
      if (y === 0) return "concreteDark";
      const t = hash(x >> 1, y >> 1, z);
      return t < 0.18 ? "concreteDark" : t > 0.86 ? "concreteLight" : "concrete";
    },
    [hollow]
  );
  // The rack on it: two stepped shelves of galvanised wire on square legs.
  const legs = [RACK.x0, (RACK.x0 + RACK.x1) / 2, RACK.x1].map(Math.round);
  for (const x of legs)
    for (const z of [RACK.high.z0, RACK.low.z1 - 1])
      box(whole, [x, x], [P.h, (z === RACK.high.z0 ? RACK.high.y : RACK.low.y) + 1], [z, z], "rackDark");
  for (const { z0, z1, y } of [RACK.low, RACK.high])
    box(whole, [RACK.x0, RACK.x1], [y, y], [z0, z1 - 1], (x, _, z) => (z === z0 || z === z1 - 1 || x % 3 === 0 ? "rack" : "rackDark"));
  // The trays on the pavement.
  const T = TRAYS;
  box(whole, [T.x0, T.x1 - 1], [0, 1], [T.z0, T.z1 - 1], (x, y, z) =>
    y === 1 && x > T.x0 && x < T.x1 - 1 && z > T.z0 && z < T.z1 - 1 ? "potBlack" : "tray"
  );

  // The tree's iron grate: a square of radiating bars round the trunk.
  const G = { x0: TREE.x - 10, x1: TREE.x + 10, z0: TREE.z - 10, z1: TREE.z + 10 };
  box(whole, [G.x0, G.x1 - 1], [0, 0], [G.z0, G.z1 - 1], (x, _, z) => {
    const [dx, dz] = [x - TREE.x + 0.5, z - TREE.z + 0.5];
    const ring = Math.max(Math.abs(dx), Math.abs(dz));
    return ring > 9 || Math.round(ring) % 3 === 0 ? "grate" : "grateDark";
  });
  // The trunk: mottled cream, grey and olive (a plane tree's bark), leaning a little, forking at the top.
  const barkAt = (x, y, z) => {
    const t = hash(Math.floor(x / 3), Math.floor(y / 5), Math.floor(z / 3));
    return t < 0.3 ? "barkLight" : t < 0.45 ? "barkDark" : t < 0.6 ? "#b8a679" : "bark";
  };
  const trunk = part();
  for (let y = 0; y <= 84; y++) {
    const lean = -y * 0.06;
    const r = y < 4 ? 5.2 : 4.2 - y * 0.012;
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) if (dx * dx + dz * dz <= r * r) trunk.add(Math.round(TREE.x + lean) + dx, y, TREE.z + dz, barkAt(dx, y, dz));
  }
  for (const [dx, dz, len] of [
    [-1, 0.3, 26],
    [0.6, 0.8, 18],
    [0.2, -1, 14],
  ]) {
    const [x0, z0] = [TREE.x - 5, TREE.z];
    for (let k = 0; k < len; k++) {
      const [x, y, z] = [Math.round(x0 + dx * k), Math.round(80 + k * 0.7), Math.round(z0 + dz * k)];
      box(trunk, [x - 1, x + 1], [y - 1, y + 1], [z - 1, z + 1], barkAt);
    }
  }

  // The A-frame: its oak frame (the chalkboards are pictures on it, below).
  const signGroup = new THREE.Group();
  signGroup.position.set(SIGN.x, 0, SIGN.z);
  signGroup.rotation.y = VIEW_YAW;
  const frame = part();
  const SIGN_TIP = 0.24; // how far each side leans from upright
  for (const side of [1, -1]) {
    const leanZ = (y) => side * (1 + (22 - y) * SIGN_TIP);
    for (let y = 0; y <= 22; y++) {
      const z = Math.round(leanZ(y));
      for (const x of [-7, 7]) frame.add(x, y, z, "boardFrame");
      if (y === 22 || y === 2) for (let x = -6; x <= 6; x++) frame.add(x, y, z, "boardFrameDark");
    }
  }
  signGroup.add(shadowy(meshOf(frame, 1, PALETTE)));
  for (const side of [1, -1]) {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(13, 19.5), new THREE.MeshLambertMaterial({ map: chalkTexture(side < 0) }));
    board.position.set(0, 12.3, side * (1 + 10 * SIGN_TIP) + side * 0.55);
    board.rotation.set(-side * Math.atan(SIGN_TIP), side < 0 ? Math.PI : 0, 0);
    signGroup.add(board);
  }
  group.add(signGroup);

  const wholeMesh = shadowy(meshOf(whole, 1, PALETTE));
  const trunkMesh = shadowy(meshOf(trunk, 1, PALETTE));
  group.add(wholeMesh, trunkMesh);

  yield;
  /* ----- in half voxels: the plants, the stacked buckets, the tap, the bowl ----- */
  const fine = part();
  const H = (v) => Math.round(v / HALF);
  const picks = []; // [x, y, z, price, kind] of each price card
  const plant = (kind, x, y, z, seed, ...more) => PLANTS[kind](fine, H(x), H(y), H(z), seed, ...more);
  yield;
  // Trays on the pavement: six kinds, two columns of each, two rows (as in the market: a tray of each).
  const TRAY_KINDS = [["dracaena"], ["calathea"], ["peperomia", true], ["peperomia"], ["monstera"], ["zz"]];
  const TRAY_COLUMNS = [0, 1, 2, 3, 4, 5];
  for (let c = 0; c < TRAY_COLUMNS.length; c++)
    for (const [r, z] of [
      [0, -67.5],
      [1, -60.5],
    ]) {
      const [kind, more] = TRAY_KINDS[TRAY_COLUMNS[c]];
      const x = T.x0 + 6 + c * ((T.x1 - T.x0 - 12) / (TRAY_COLUMNS.length - 1));
      plant(kind, x, 2, z + (c % 2 ? 0.5 : 0), c * 7 + r * 31, more);
    }
  // On the plinth's front: anthuriums, two column cacti (one hairy), ball cacti in pink pots, calatheas,
  // peperomias.
  const FRONT_KINDS = ["column", "anthurium", "ball", "calathea", "column", "peperomia"];
  FRONT_KINDS.forEach((kind, c) => {
    const x = P.x0 + 8 + c * ((P.x1 - P.x0 - 16) / (FRONT_KINDS.length - 1));
    for (const [r, z] of [
      [0, -86],
      [1, -79],
    ]) {
      if (kind === "column" && r === 1) plant("ball", x, P.h, z, c * 13 + r);
      else plant(kind, x, P.h, z, c * 13 + r, kind === "column" ? c === 0 : kind === "peperomia" && r === 1);
    }
  });
  // On the rack: rubber plants and peace lilies high up, calatheas, anthuriums and a ZZ below.
  ["lily", "rubber", "lily", "rubber"].forEach((kind, i) =>
    plant(kind, RACK.x0 + 12 + i * ((RACK.x1 - RACK.x0 - 24) / 3), RACK.high.y + 1, (RACK.high.z0 + RACK.high.z1) / 2, 50 + i)
  );
  ["calathea", "zz", "anthurium", "zz"].forEach((kind, i) =>
    plant(kind, RACK.x0 + 26 + i * ((RACK.x1 - RACK.x0 - 52) / 3), RACK.low.y + 1, (RACK.low.z0 + RACK.low.z1) / 2, 70 + i)
  );
  // The price picks, on sticks among them.
  for (const [x, z, y, price, kind] of [
    [P.x0 + 20, -82, P.h, "$40", "green"],
    [P.x0 + 60, -82, P.h, "$45", "chalk"],
    [P.x0 + 96, -82, P.h, "$10", "green"],
    [T.x0 + 22, -64, 2, "$25", "chalk"],
    [T.x0 + 58, -64, 2, "$20", "yellow"],
    [T.x0 + 96, -64, 2, "$25", "chalk"],
    [RACK.x0 + 30, -100, RACK.high.y, "$55", "chalk"],
  ]) {
    const top = y + 14;
    stalk(fine, [H(x), H(y), H(z)], [H(x), H(top), H(z)], kind === "green" ? "stickGreen" : kind === "yellow" ? "stickYellow" : "stick");
    picks.push([x, top + 1.6, z, price, kind]);
  }

  const plantsMesh = shadowy(meshOf(fine, HALF, PALETTE));
  group.add(plantsMesh);

  yield;
  // The empty buckets, nested in three stacks: only each one's rim band shows, the top one whole.
  const stacks = part();
  const S = BUCKET_STACKS;
  const ring = (cx, cz, y, r, color, open = false) => {
    for (let dx = -5; dx <= 5; dx++)
      for (let dz = -5; dz <= 5; dz++) {
        const d = dx * dx + dz * dz;
        if (d <= r * r + 0.5) stacks.add(cx + dx, y, cz + dz, open && d < (r - 1) * (r - 1) ? "potBlack" : color);
      }
  };
  [
    [S.x0 + 5, S.z0 + 5, 9],
    [S.x0 + 5, S.z1 - 5, 7],
    [S.x1 - 5, (S.z0 + S.z1) / 2, 10],
  ].forEach(([x, z, n], i) => {
    // The bottom one standing, tapering to its foot; then each nested one's rim band, a little askew.
    for (let y = 0; y < 6; y++) ring(x, z, y, y < 2 ? 3.4 : 4, "bucketBlack");
    for (let k = 0; k < n; k++) {
      const [ox, oz] = [Math.round(Math.sin(k * 1.7 + i) * 0.6), Math.round(Math.cos(k * 2.3 + i) * 0.6)];
      const y = 6 + k * 2;
      ring(x + ox, z + oz, y, 4, "bucketBlack");
      ring(x + ox, z + oz, y + 1, 4.3, "bucketBlackRim", k === n - 1);
    }
  });

  // The tap: a copper pipe up the kiosk's wall, a brass bib tap on it with a cross handle.
  const tapPart = part();
  const [tx, tz] = [H(TAP.x - 1.5), H(TAP.z)];
  box(tapPart, [tx, tx + 1], [0, 30], [tz, tz + 1], "pipe");
  box(tapPart, [tx + 2, tx + 7], [27, 29], [tz - 1, tz + 2], (x) => (x === tx + 7 ? "brassDark" : "brass"));
  box(tapPart, [tx + 6, tx + 7], [24, 27], [tz, tz + 1], "brass");
  box(tapPart, [tx + 3, tx + 4], [30, 32], [tz, tz + 1], "brass");
  box(tapPart, [tx + 1, tx + 6], [33, 33], [tz, tz + 1], "brassDark");
  box(tapPart, [tx + 3, tx + 4], [33, 33], [tz - 2, tz + 3], "brassDark");
  const spout = [TAP.x - 1.5 + 3.25, 12, TAP.z + 0.25]; // where its water comes out (world)

  // The dog's steel bowl.
  const bowlPart = part();
  const [bx, bz] = [H(BOWL.x), H(BOWL.z)];
  for (let y = 0; y < 3; y++)
    for (let dx = -7; dx <= 7; dx++)
      for (let dz = -7; dz <= 7; dz++) {
        const d = dx * dx + dz * dz;
        const r = 5.5 + y * 0.7;
        if (d <= r * r + 0.5 && (y === 0 || d >= (r - 1.3) * (r - 1.3))) bowlPart.add(bx + dx, y, bz + dz, y === 2 ? "steelBowl" : "steelBowlDark");
      }

  const fineMesh = shadowy(meshOf(stacks, 1, PALETTE));
  const tapMesh = shadowy(meshOf(tapPart, HALF, PALETTE));
  const bowlMesh = shadowy(meshOf(bowlPart, HALF, PALETTE), false);
  group.add(fineMesh, tapMesh, bowlMesh);

  yield;
  // The price cards, turned to the viewer.
  for (const [x, y, z, price, kind] of picks) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.5), new THREE.MeshLambertMaterial({ map: priceTexture(price, kind) }));
    card.position.set(x, y, z);
    card.rotation.y = VIEW_YAW;
    group.add(card);
  }

  yield;
  /* ----- the tree's crown: leaf blocks (as a voxel game's), a few hanging lower at its edges ----- */
  const crownGroup = new THREE.Group(); // (turns about the top of the trunk when shaken)
  const PIVOT = [TREE.x - 5, 84, TREE.z];
  crownGroup.position.set(...PIVOT);
  const crown = part();
  const B = 5; // a leaf block's size
  const leafAt = (i, j, k) => {
    const t = hash(i, j, k);
    return t < 0.3 ? "leafDark" : t > 0.75 ? "leafLight" : "leaf";
  };
  for (let j = 0; j < 7; j++)
    for (let i = -7; i <= 6; i++)
      for (let k = -4; k <= 6; k++) {
        const [cx, cy, cz] = [i * B, j * B, k * B];
        const rx = j < 2 ? 4.2 + j : j > 4 ? 6 - (j - 4) * 1.6 : 6.4;
        const d = ((i + 0.5) / rx) ** 2 + ((k - 1) / (rx * 0.62)) ** 2;
        if (d > 1 || hash(i, j, k + 40) < 0.12) continue;
        // (Nothing out past the right edge of the pavement, or in front of the plants below.)
        const [wx, wz] = [PIVOT[0] + cx, PIVOT[2] + cz];
        if (wx > GROUND.x1 + 6 || wz > TREE.z + 28 || wz < MURAL.z - 6) continue;
        const color = leafAt(i, j, k);
        box(crown, [cx, cx + B - 1], [cy, cy + B - 1], [cz, cz + B - 1], color);
      }
  // A few blocks hanging lower at the edge, and leaf blocks along the branches.
  for (const [i, k, drop] of [
    [-7, 1, 2],
    [-6, 3, 1],
    [-5, -1, 2],
    [-3, 4, 1],
  ])
    box(crown, [i * B, i * B + B - 1], [-drop * B, -1], [k * B, k * B + B - 1], leafAt(i, 9, k));
  const crownMesh = shadowy(meshOf(crown, 1, PALETTE));
  crownMesh.position.set(0, 0, 0);
  crownGroup.add(crownMesh);
  group.add(crownGroup);

  yield;
  /* ----- the watering can, parked by the tap ----- */
  const CAN_AT = [TAP.x + 6, 0, TAP.z - 16];
  const can = voxels(
    (p) => {
      // The body: a galvanised drum with two seams; the spout from low at the front up to a rose; the handle.
      for (let y = 0; y <= 12; y++)
        for (let dx = -6; dx <= 6; dx++)
          for (let dz = -6; dz <= 6; dz++) {
            const d = dx * dx + dz * dz;
            if (d > 36.5 || (y > 0 && y < 12 && d < 20)) continue;
            p.add(dx, y, dz, y === 3 || y === 9 ? "galvDark" : y === 12 ? "galvLight" : "galv");
          }
      for (let k = 0; k <= 11; k++) p.add(0, 3 + k, 6 + Math.round(k * 0.8), "galv");
      box(p, [-2, 2], [14, 17], [15, 16], "galvDark");
      for (let k = 0; k <= 12; k++) p.add(0, 12 + Math.round(Math.sin((k / 12) * Math.PI) * 6), -6 + k, "galvDark");
      box(p, [-1, 1], [2, 10], [-8, -7], "galv");
    },
    HALF,
    PALETTE
  );
  can.position.set(...CAN_AT);
  can.rotation.y = 0.5;
  group.add(shadowy(can));

  yield;
  /* ----- the bowl's water, and the tap's stream (and the little puddle it makes) ----- */
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.9, 2.9, 0.2, 18),
    new THREE.MeshLambertMaterial({ color: "#8fc6e0", transparent: true, opacity: 0.75, depthWrite: false })
  );
  water.position.set(BOWL.x, 0.4, BOWL.z);
  group.add(water);
  const streak = pixelTexture(4, 16, (g) => {
    for (let y = 0; y < 16; y++) {
      g.fillStyle = y % 5 < 2 ? "rgba(255,255,255,0.95)" : "rgba(170,215,240,0.75)";
      g.fillRect(0, y, 4, 1);
    }
  }).tex;
  streak.wrapS = streak.wrapT = THREE.RepeatWrapping;
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.3, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({ map: streak, transparent: true, depthWrite: false })
  );
  stream.visible = false;
  group.add(stream);
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(1, 16),
    new THREE.MeshLambertMaterial({ color: "#3e4246", transparent: true, opacity: 0, depthWrite: false })
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(spout[0], 0.06, spout[2]);
  group.add(puddle);

  yield;
  /* ----- petals and leaves on the ground ----- */
  const petals = makePetals(group);

  yield;
  /* ----- birds ----- */
  const birds = makeBirds(group);

  yield;
  /* ----- the contract ----- */
  const tap = {
    running: false,
    spout,
    bottom: 0, // where its water lands (the ground, or the top of the can held under it)
    set(on, bottom = 0) {
      tap.running = on;
      tap.bottom = bottom;
      tap.until = Infinity;
    },
    until: Infinity, // (turned on by a click: off again by itself)
  };
  const bowl = {
    level: 1,
    drink(dt) {
      bowl.level = Math.max(0, bowl.level - dt * 0.03);
    },
    fill() {
      bowl.level = 1;
    },
  };
  let parked = true;
  const canThing = {
    mesh: can,
    get parked() {
      return parked;
    },
    park(on) {
      parked = can.visible = on;
    },
  };
  let shook = -Infinity; // when the tree was last shaken
  let shaking = false;

  const clickables = [
    {
      key: "tap",
      parts: [tapMesh],
      toggle() {
        tap.set(!tap.running);
        if (tap.running) tap.until = shared.clock.t + 20;
      },
    },
    {
      key: "tree",
      parts: [crownMesh, trunkMesh],
      toggle() {
        shook = shared.clock.t;
        petals.leaves(4 + Math.floor(Math.random() * 4), shared.clock.t);
      },
    },
    { key: "birds", parts: birds.meshes, toggle: () => birds.scare(shared.clock.t) },
  ];

  // Where she (and the dog) stand to do things here.
  const sideOn = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const signAt = [SIGN.x + Math.sin(VIEW_YAW) * 13, SIGN.z + Math.cos(VIEW_YAW) * 13];
  const treeAt = [163, -64];
  const spots = {
    tap: { at: [TAP.x + 12, TAP.z], yaw: -Math.PI / 2 },
    can: { at: CAN_AT },
    bowl: { at: [BOWL.x, BOWL.z - 9], yaw: 0 },
    sign: { at: signAt, yaw: VIEW_YAW + Math.PI },
    plants: [45, 68, 90, 112, 135].map((x) => ({ at: [x, -46], yaw: Math.PI, top: [x, 8, -64] })),
    tree: { at: treeAt, yaw: sideOn(treeAt, [TREE.x, TREE.z]) },
  };

  return {
    group,
    obstacles: [
      [P.x0, P.x1, MURAL.z, P.z1], // the plinth, back to the mural
      [T.x0, T.x1, T.z0, T.z1],
      [G.x0 + 3, G.x1 - 3, MURAL.z, G.z1 - 3], // the tree's trunk in its grate
      [S.x0, S.x1, S.z0, S.z1],
      [SIGN.x - 7, SIGN.x + 7, SIGN.z - 6, SIGN.z + 6],
      [TAP.x - 2, TAP.x + 3, TAP.z - 3, TAP.z + 3],
      [CAN_AT[0] - 4, CAN_AT[0] + 4, CAN_AT[2] - 4, CAN_AT[2] + 4],
    ],
    hides: [crownMesh, trunkMesh, wholeMesh, plantsMesh, fineMesh],
    clickables,
    spots,
    can: canThing,
    tap,
    bowl,
    petals,
    birds,
    // The tree shaken: its shadow drawn again while it moves.
    shadowsDirty: () => {
      const now = shared.clock.t - shook < 2.5;
      const dirty = now || shaking;
      shaking = now;
      return dirty;
    },
    dress(night) {
      birds.night(night, shared.clock.t);
    },
    daylight() {},
    update(t, dt, home) {
      // The tap's water: falling from the spout to where it lands, streaming; a puddle spreading under it.
      if (tap.running && t > tap.until) tap.set(false);
      stream.visible = tap.running;
      if (tap.running) {
        const len = spout[1] - tap.bottom;
        stream.scale.y = len;
        stream.position.set(spout[0], tap.bottom + len / 2, spout[2]);
        streak.offset.y = (t * 3) % 1;
        streak.repeat.y = len / 4;
      }
      const wet = tap.running && tap.bottom < 0.5;
      puddle.material.opacity = Math.min(0.55, Math.max(0, puddle.material.opacity + (wet ? dt * 0.2 : -dt * 0.03)));
      puddle.scale.setScalar(1.5 + puddle.material.opacity * 6);
      puddle.visible = puddle.material.opacity > 0.01;
      // The bowl's water down as it is drunk.
      water.position.y = 0.3 + bowl.level * 0.95;
      water.visible = bowl.level > 0.02;
      // The crown shaken: a sway dying away.
      const s = t - shook;
      crownGroup.rotation.z = s < 2.5 ? 0.025 * Math.exp(-2 * s) * Math.sin(16 * s) : 0;
      crownGroup.rotation.x = s < 2.5 ? 0.015 * Math.exp(-2 * s) * Math.sin(13 * s + 1) : 0;
      petals.update(t, dt);
      birds.update(t, dt, home);
    },
  };
}

/* ---------------------------------------------------------------------------------------------------------- */
/* Petals and leaves on the ground: instanced flecks, some fluttering down first. */

const MAX_PETALS = 300;
const PETAL_COLORS = ["#f28aa8", "#e8384f", "#f6d23a", "#f7f5f0", "#c9a0e0", "#f5a25a", "#ffb6c8", "#d9435f"];
const LEAF_COLORS = ["#a8b04a", "#c9a24a", "#8a9a3a", "#b07a3a", "#7f9c3e"];
// Where petals blow about (by the flower buckets, the doorway and the walk along the front), and where the
// tree's leaves come down.
const BLOWN = [
  [MIDDLE.x0, MIDDLE.x1, MIDDLE.z1 + 2, MIDDLE.z1 + 12],
  [RIGHT.x0, RIGHT.x1, RIGHT.z1 + 2, RIGHT.z1 + 12],
  [DOOR.x0, RIGHT.x1, -28, -10],
  [LEFT.x1 + 2, MIDDLE.x0 - 2, -4, 30],
];
const UNDER_TREE = [118, 176, -54, -12];

function makePetals(group) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.25, 1), new THREE.MeshLambertMaterial(), MAX_PETALS);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  const list = []; // { x, y, z, turn, tip, fall: { vx, vz, spin } | null, color }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  const c = new THREE.Color();
  let dirty = true;
  const floor = (x, z) => (x > KIOSK.x0 && x < KIOSK.x1 && z > KIOSK.z0 && z < KIOSK.z1 ? FLOOR : 0);
  function add(x, z, color, from = 0) {
    if (list.length >= MAX_PETALS) list.shift();
    const petal = { x, z, y: Math.max(from, floor(x, z) + 0.15), turn: Math.random() * 6.28, tip: 0, color };
    if (from > 0.5) petal.fall = { vx: rnd(-2, 2), vz: rnd(-2, 2), spin: rnd(3, 7), speed: rnd(5, 8) };
    list.push(petal);
    dirty = true;
  }
  const inRect = ([x0, x1, z0, z1]) => [rnd(x0, x1), rnd(z0, z1)];
  // A few on the ground from the start.
  for (let k = 0; k < 24; k++) add(...inRect(pick(BLOWN)), pick(PETAL_COLORS));
  for (let k = 0; k < 8; k++) add(...inRect(UNDER_TREE), pick(LEAF_COLORS));
  let nextPetal = 4;
  let nextLeaf = 9;
  return {
    // A petal dropped at (x, z) (from height `from`: fluttering down).
    drop: (x, z, color = pick(PETAL_COLORS), from = 0) => add(x, z, color, from),
    // Those within r of (x, z) swept up: how many.
    sweep(x, z, r) {
      const before = list.length;
      for (let k = list.length - 1; k >= 0; k--) if (!list[k].fall && Math.hypot(list[k].x - x, list[k].z - z) < r) list.splice(k, 1);
      dirty ||= list.length !== before;
      return before - list.length;
    },
    count: () => list.length,
    // Where they lie thickest just now (for her broom): the one with the most others within r, if any.
    thickest(r = 14) {
      let best = null;
      let most = 2;
      for (const p of list) {
        if (p.fall) continue;
        const n = list.reduce((s, o) => s + (Math.hypot(o.x - p.x, o.z - p.z) < r ? 1 : 0), 0);
        if (n > most) [best, most] = [[p.x, p.z], n];
      }
      return best;
    },
    // `n` leaves let go from the crown at once (shaken).
    leaves(n) {
      for (let k = 0; k < n; k++) add(rnd(TREE.x - 34, TREE.x + 8), rnd(TREE.z + 26, TREE.z + 70), pick(LEAF_COLORS), rnd(70, 95));
    },
    update(t, dt) {
      // Now and then one blows in by the buckets, or a leaf comes down from the tree (fewer once the ground is
      // well strewn: someone has to sweep).
      if (t > nextPetal) {
        nextPetal = t + rnd(3, 8);
        if (list.length < 90) add(...inRect(pick(BLOWN)), pick(PETAL_COLORS), rnd(10, 20));
      }
      if (t > nextLeaf) {
        nextLeaf = t + rnd(9, 18);
        if (list.length < 110) add(...inRect(UNDER_TREE), pick(LEAF_COLORS), rnd(70, 90));
      }
      for (const p of list) {
        if (!p.fall) continue;
        const f = p.fall;
        p.y -= f.speed * dt;
        p.x += (f.vx + Math.sin(t * 2 + p.turn) * 3) * dt;
        p.z += f.vz * dt;
        p.turn += f.spin * dt;
        p.tip = Math.sin(t * 4 + p.turn) * 0.8;
        const ground = floor(p.x, p.z) + 0.15;
        if (p.y <= ground) Object.assign(p, { y: ground, tip: 0, fall: null });
        dirty = true;
      }
      if (!dirty) return;
      dirty = false;
      list.forEach((p, i) => {
        q.setFromEuler(e.set(p.tip, p.turn, 0));
        m4.compose(pos.set(p.x, p.y, p.z), q, one);
        mesh.setMatrixAt(i, m4);
        mesh.setColorAt(i, c.set(p.color));
      });
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
}

/* ---------------------------------------------------------------------------------------------------------- */
/* Two pigeons and a sparrow pecking about on the pavement out front, flying off from anyone who comes near
   (or a click), landing again further off, or away for a while; roosting away all night. */

const PAVEMENT = { x0: -110, x1: 170, z0: 56, z1: GROUND.z1 - 6 }; // where they come down
const SCARE = 25; // how near someone may come

function birdModel(kind) {
  const pigeon = kind === "pigeon";
  const col = pigeon
    ? {
        body: "#8f97a3",
        belly: "#a7aeb8",
        wing: "#7a8290",
        bar: "#3b3f47",
        neck: "#4f7a6a",
        neck2: "#7b5a8a",
        beak: "#d9c7b0",
        eye: "#e07a2a",
        foot: "#d98a8a",
      }
    : {
        body: "#8a6a4a",
        belly: "#e2d6c2",
        wing: "#6e5236",
        bar: "#3e2c1c",
        neck: "#9a7a58",
        neck2: "#b9a58a",
        beak: "#4a4038",
        eye: "#1a1a1a",
        foot: "#c9a07a",
      };
  const pal = paletteOf(col);
  const g = new THREE.Group();
  const body = voxels(
    (p) => {
      ellipsoid(p, [0, 4, 0], [2.6, 2.4, 4], (x, y) => (y < 3 ? "belly" : "body"));
      ellipsoid(p, [0, 7, 3.2], [2, 2, 2], (x, y, z) => (y < 7 && z > 2 ? (x > 0 ? "neck" : "neck2") : "body"));
      p.add(0, 7, 5, "beak");
      p.add(0, 7, 6, "beak");
      p.add(2, 8, 4, "eye");
      p.add(-2, 8, 4, "eye");
      box(p, [-1, 1], [4, 5], [-6, -4], "bar"); // the tail
      p.add(1, 1, 0, "foot");
      p.add(-1, 1, 0, "foot");
      p.add(1, 0, 1, "foot");
      p.add(-1, 0, 1, "foot");
    },
    0.42,
    pal
  );
  g.add(body);
  const wings = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 1.1, 2.2, 0);
    pivot.add(
      voxels(
        (p) => {
          for (let x = 0; x <= 4; x++) for (let z = -3; z <= 2 - Math.floor(x / 2); z++) p.add(side * x, 0, z, z < -1 ? "bar" : "wing");
        },
        0.42,
        pal
      )
    );
    g.add(pivot);
    return pivot;
  });
  g.scale.setScalar(pigeon ? 1 : 0.72);
  return { group: g, body, wings };
}

function makeBirds(parent) {
  const flock = ["pigeon", "pigeon", "sparrow"].map((kind) => {
    const m = birdModel(kind);
    parent.add(m.group);
    const b = {
      ...m,
      kind,
      x: rnd(PAVEMENT.x0 + 30, PAVEMENT.x1 - 30),
      z: rnd(PAVEMENT.z0, PAVEMENT.z1),
      y: 0,
      yaw: Math.random() * 6.28,
      state: "ground", // ground | fly | away
      goal: null,
      hop: 0,
      pecking: 0,
      nextMove: rnd(0.5, 2),
      flight: null,
      back: 0,
    };
    m.group.position.set(b.x, 0, b.z);
    return b;
  });
  let dark = false;
  const OFF = () => [pick([-260, 300]), 110, rnd(-60, 120)];
  // A place to land, well away from everyone (and from the A-frame).
  const landing = (home) => {
    for (let k = 0; k < 20; k++) {
      const [x, z] = [rnd(PAVEMENT.x0, PAVEMENT.x1), rnd(PAVEMENT.z0, PAVEMENT.z1)];
      if (Math.hypot(x - SIGN.x, z - SIGN.z) < 14) continue;
      if (!home || home.actors.every((a) => Math.hypot(a.x - x, a.z - z) > 60)) return [x, z];
    }
    return null;
  };
  function takeOff(b, t, to) {
    const from = [b.x, b.y, b.z];
    const d = Math.hypot(to[0] - from[0], to[2] - from[2]);
    b.flight = { from, to, start: t, secs: 0.6 + d / 70, peak: Math.max(to[1], from[1]) + 14 + d * 0.12 };
    b.state = "fly";
    b.yaw = Math.atan2(to[0] - from[0], to[2] - from[2]);
  }
  function flee(b, t, home) {
    const spot = !dark && Math.random() < 0.65 && landing(home);
    takeOff(b, t, spot ? [spot[0], 0, spot[1]] : OFF());
  }
  return {
    meshes: flock.map((b) => b.body),
    scare(t) {
      flock.forEach((b) => b.state === "ground" && flee(b, t, null));
    },
    night(on, t) {
      dark = on;
      if (on) flock.forEach((b) => b.state === "ground" && takeOff(b, t + Math.random(), OFF()));
    },
    update(t, dt, home) {
      for (const b of flock) {
        if (b.state === "away") {
          if (!dark && t > b.back) {
            const spot = landing(home);
            if (spot) {
              [b.x, b.y, b.z] = OFF();
              b.group.visible = true;
              takeOff(b, t, [spot[0], 0, spot[1]]);
            }
          }
          continue;
        }
        if (b.state === "fly") {
          const f = b.flight;
          const u = Math.min(1, (t - f.start) / f.secs);
          const e = u * u * (3 - 2 * u);
          b.x = f.from[0] + (f.to[0] - f.from[0]) * e;
          b.z = f.from[2] + (f.to[2] - f.from[2]) * e;
          b.y = f.from[1] + (f.to[1] - f.from[1]) * e + 4 * (f.peak - Math.max(f.from[1], f.to[1])) * u * (1 - u);
          const flap = Math.sin(t * 34) * 1.1;
          b.wings[0].rotation.z = flap;
          b.wings[1].rotation.z = -flap;
          b.body.rotation.x = -0.2;
          if (u >= 1) {
            b.wings.forEach((w) => (w.rotation.z = 0));
            b.body.rotation.x = 0;
            if (f.to[1] > 50) {
              b.state = "away";
              b.group.visible = false;
              b.back = t + rnd(20, 45);
            } else {
              b.state = "ground";
              b.y = 0;
              b.nextMove = t + rnd(0.5, 1.5);
            }
          }
        } else {
          // On the ground: off if anyone comes near; else little runs and hops, pecking in between.
          if (home.actors.some((a) => Math.hypot(a.x - b.x, a.z - b.z) < SCARE)) {
            flee(b, t, home);
            continue;
          }
          if (b.goal) {
            const [gx, gz] = b.goal;
            const d = Math.hypot(gx - b.x, gz - b.z);
            const step = (b.kind === "pigeon" ? 9 : 14) * dt;
            if (d <= step) b.goal = null;
            else {
              b.x += ((gx - b.x) / d) * step;
              b.z += ((gz - b.z) / d) * step;
            }
            b.hop += dt * (b.kind === "pigeon" ? 9 : 12);
            b.y = b.kind === "pigeon" ? 0 : Math.abs(Math.sin(b.hop)) * 0.9;
            b.body.position.z = b.kind === "pigeon" ? Math.sin(b.hop * 2) * 0.4 : 0; // (a pigeon's head bob)
          } else {
            b.y = 0;
            if (t > b.nextMove) {
              b.nextMove = t + rnd(1, 4);
              if (Math.random() < 0.55) {
                const a = Math.random() * 6.28;
                const r = rnd(4, 14);
                const gx = Math.min(PAVEMENT.x1, Math.max(PAVEMENT.x0, b.x + Math.cos(a) * r));
                const gz = Math.min(PAVEMENT.z1, Math.max(PAVEMENT.z0, b.z + Math.sin(a) * r));
                if (Math.hypot(gx - SIGN.x, gz - SIGN.z) > 12) {
                  b.goal = [gx, gz];
                  b.yaw = Math.atan2(gx - b.x, gz - b.z);
                }
              } else b.pecking = t;
            }
          }
          const p = t - b.pecking; // a peck or two at the ground
          b.body.rotation.x = p < 0.6 ? 0.5 * Math.abs(Math.sin(p * 10)) : 0;
        }
        b.group.position.set(b.x, b.y, b.z);
        b.group.rotation.y = b.yaw;
      }
    },
  };
}
