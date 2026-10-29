/*******************************************************************************
 * The flower shop's house plants (grounds.js builds them where PLANTED says),
 * after the plant stalls at the Melbourne markets: on the plinth's rack, tall
 * ones in cream ceramic up top (peace lilies, snake plants, rubber plants,
 * birds of paradise) with pothos and string of pearls trailing over the edge,
 * orchids, ferns, calatheas and anthuriums below; on the plinth in front,
 * cacti and succulents in terracotta, a block of each kind (columns and old
 * man cacti, bunny ears, golden barrels, grafted moon cacti, flowering balls,
 * echeverias, haworthias, aloes, jades, kalanchoes); on the pavement, a tray
 * of each of the rest in black nursery pots; a stack of empty terracotta pots
 * for sale at the end. A chalk card for each block and tray, on its front.
 * Built in half voxels: a pot's foot at (x, y, z), the plant on it.
 ******************************************************************************/

import { hash, ellipsoid } from "../models/voxels.js";
import { PLINTH, TRAYS } from "./layout.js";

export const PLANT_COLORS = {
  terracotta: "#c4673f",
  terracottaRim: "#d8825a",
  potInside: "#7a3e24",
  ceramic: "#eeeae2",
  ceramicRim: "#f9f7f2",
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
  silver: "#b9c6bd",
  silverVein: "#4f6a4a",
  peperGreen: "#5f8a55",
  rosso: "#34452f",
  rossoEdge: "#8a2a35",
  anthLeaf: "#2c5a2c",
  anthRed: "#c8202f",
  anthSpadix: "#e8d26a",
  cactus: "#4f7f45",
  cactusDark: "#3e6a37",
  spine: "#efeee6",
  cactusBloom: "#e85a9a",
  goldSpine: "#e7c34e",
  zz: "#2e5d2c",
  zzLight: "#4c8a45",
  dracEdge: "#4f8a3a",
  dracStripe: "#c9d86a",
  echeveria: "#8db4a6",
  echevLight: "#b5d2c6",
  echevTip: "#d77f97",
  peachEchev: "#dcae9c",
  peachLight: "#ecc9b8",
  peachTip: "#b0566a",
  jade: "#4f8f3f",
  jadeEdge: "#b34a3f",
  jadeTrunk: "#7a6a48",
  aloe: "#7fa86a",
  aloeLight: "#9cc086",
  aloeSpot: "#dfe9d2",
  haworthia: "#2f5a35",
  hawStripe: "#e8efe2",
  opuntia: "#6f9d48",
  opuntiaDark: "#5a8538",
  glochid: "#f3e9b8",
  moonRed: "#e0413c",
  moonRedDark: "#b8302d",
  moonYellow: "#f2c230",
  moonYellowDark: "#d3a21c",
  moonPink: "#ec6fa8",
  moonPinkDark: "#cc4f88",
  kalLeaf: "#3f7a3a",
  kalLeafLight: "#5a9a4a",
  kalRed: "#d8323a",
  kalOrange: "#f08a2c",
  kalYellow: "#f4cf3a",
  snake: "#3f6b3a",
  snakeBand: "#6f9a5a",
  snakeEdge: "#d9cf5a",
  pothos: "#4f9a3c",
  pothosDark: "#3d7f2e",
  pothosVar: "#e3e07a",
  pothosStem: "#5c8a3a",
  pearl: "#8bbd62",
  pearlStem: "#5c7a3a",
  orchidLeaf: "#3f6e36",
  orchidRib: "#335a2c",
  orchidWhite: "#faf7f4",
  orchidPink: "#e88cb8",
  orchidLip: "#e8b93a",
  stake: "#a88a5a",
  fern: "#4f8a34",
  fernLight: "#669e42",
  fernDark: "#3a6e28",
  strelitzia: "#3f7a46",
  strelLight: "#5a9560",
  strelRib: "#9ab88a",
  strelStem: "#4a6e3a",
};

/* ---------------------------------------------------------------------------------------------------------- */
/* Pots and leaves. */

const POTS = {
  terracotta: ["terracotta", "terracottaRim"],
  ceramic: ["ceramic", "ceramicRim"],
  nursery: ["potBlack", "potRim"],
  pink: ["potPink", "pinkRim"],
};
// A pot of radius r at its rim and height h: under a lip (a band of the rim's colour; a nursery pot's thin
// plastic only a line), tapering a little to its foot; soil (or white pebbles) on top, sunk a little.
function pot(p, cx, cy, cz, r, h, style, top = "soil") {
  const [body, rim] = POTS[style];
  const lip = style === "nursery" ? 1 : 2;
  for (let y = 0; y < h; y++) {
    const rr = y >= h - lip ? r : r - 0.5 - (style === "nursery" ? 0 : (1 - y / (h - lip)) * 1.2);
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        const d = dx * dx + dz * dz;
        if (d > rr * rr + 0.6) continue;
        if (y === h - 1 && d <= (r - 1.5) ** 2 + 0.6) p.add(cx + dx, cy + y - 1, cz + dz, top);
        else p.add(cx + dx, cy + y, cz + dz, y >= h - lip ? rim : body);
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

// Strands from the pot's front rim (at height `top`, the pot's middle at x, z) out over the edge it stands
// at and down `len`: each `bead(k)` along it ([dx, dy, dz, color] added beside the strand at step k).
function trail(p, x, top, z, s, len, stem, bead) {
  for (let v = 0; v < 4; v++) {
    const n = Math.round(len * (0.6 + hash(s, v, 2) * 0.5));
    const x0 = x - 4 + v * 2.7 + (hash(s, v, 1) - 0.5) * 1.5;
    for (let k = 0; k < n; k++) {
      const [cx, cy, cz] = [Math.round(x0 + Math.sin(k * 0.7 + v) * 0.8), k < 3 ? top : top - (k - 2), z + 5 + Math.min(k, 3)];
      p.add(cx, cy, cz, stem);
      for (const [dx, dy, dz, c] of bead(k, v)) p.add(cx + dx, cy + dy, cz + dz, c);
    }
  }
}

/* ---------------------------------------------------------------------------------------------------------- */
/* The plants: each (p, x, y, z, seed, options), options.pot to put it in another kind of pot. */

export const PLANTS = {
  // Peace lily: dark lance leaves arching out, white spathes on tall stalks.
  lily(p, x, y, z, s, o) {
    pot(p, x, y, z, 6, 8, o.pot ?? "ceramic");
    const top = y + 7;
    around(6, s, 0.45).forEach((d, i) =>
      leaf(p, [x, top, z], d, 12 + Math.round(hash(s, i, 1) * 3), 1.6, (_, k) => (k === 0 ? "lilyRib" : "lilyLeaf"))
    );
    for (let i = 0; i < 3; i++) {
      const a = hash(s, i, 7) * 6.28;
      const [ex, ez] = [x + Math.round(Math.cos(a) * 3), z + Math.round(Math.sin(a) * 3)];
      const h = top + 16 + Math.round(hash(s, i, 8) * 5);
      stalk(p, [x, top, z], [ex, h, ez], "stalk");
      ellipsoid(p, [ex, h + 3, ez], [1.6, 3.2, 1.1], "spathe");
      p.add(ex, h + 2, ez + 1, "spadix");
    }
  },
  // Rubber plant: an upright stem with big glossy burgundy leaves, alternating.
  rubber(p, x, y, z, s, o) {
    pot(p, x, y, z, 6, 8, o.pot ?? "ceramic");
    const top = y + 7;
    const h = 22 + (s % 3) * 2;
    stalk(p, [x, top, z], [x, top + h, z], "rubberStem");
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4 + s;
      const at = top + 5 + k * 4;
      leaf(p, [x, at, z], [Math.cos(a), 0.55, Math.sin(a)], 7, 2.0, (q, w) => (w === 0 ? "rubberRib" : q > 3 && w < 0 ? "rubberLight" : "rubber"));
    }
    ellipsoid(p, [x, top + h + 1, z], [0.8, 2, 0.8], "rossoEdge"); // (the new leaf's red sheath)
  },
  // Snake plant: stiff upright swords, banded, edged yellow.
  snake(p, x, y, z, s, o) {
    pot(p, x, y, z, 6, 8, o.pot ?? "ceramic");
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4 + s;
      const [bx, bz] = [x + Math.round(Math.cos(a) * 2.5), z + Math.round(Math.sin(a) * 2.5)];
      const len = 16 + Math.round(hash(s, i, 2) * 8);
      leaf(p, [bx, y + 7, bz], [Math.cos(a) * 0.12, 1, Math.sin(a) * 0.12], len, 1.5, (q, k) =>
        Math.abs(k) >= 2 ? "snakeEdge" : q % 4 === 1 ? "snakeBand" : "snake"
      );
    }
  },
  // Bird of paradise: big paddle leaves held up on long stalks.
  strelitzia(p, x, y, z, s, o) {
    pot(p, x, y, z, 6, 8, o.pot ?? "ceramic");
    const top = y + 8;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26 + s;
      const h = 9 + (i % 3) * 3;
      const out = 0.18 + (i % 2) * 0.12;
      const [ex, ez] = [x + Math.round(Math.cos(a) * out * h), z + Math.round(Math.sin(a) * out * h)];
      stalk(p, [x, top, z], [ex, top + h, ez], "strelStem");
      leaf(p, [ex, top + h, ez], [Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35], 10, 2.6, (q, k) =>
        k === 0 ? "strelRib" : Math.abs(k) >= 2 && hash(q, k, i) < 0.3 ? "strelLight" : "strelitzia"
      );
    }
  },
  // Pothos: a mound of heart leaves, some splashed yellow, its vines trailing over the edge.
  pothos(p, x, y, z, s, o) {
    pot(p, x, y, z, 6, 7, o.pot ?? "ceramic");
    const top = y + 7;
    const shade = (vx, vy, vz) => (hash(vx, vy, vz) < 0.25 ? "pothosVar" : hash(vx, vy, vz) < 0.5 ? "pothosDark" : "pothos");
    ellipsoid(p, [x, top + 2, z], [5, 3, 5], shade);
    trail(p, x, top, z, s, o.trail ?? 12, "pothosStem", (k, v) =>
      k % 3 === 1
        ? [
            [k % 2 ? 1 : -2, 0, 1, shade(k, v, s)],
            [k % 2 ? 2 : -1, 0, 1, shade(v, k, s)],
            [k % 2 ? 1 : -2, -1, 1, shade(s, k, v)],
            [k % 2 ? 2 : -1, -1, 1, "pothosDark"],
          ]
        : []
    );
  },
  // String of pearls: a low cushion of beads, its strands hanging down.
  pearls(p, x, y, z, s, o) {
    pot(p, x, y, z, 5, 6, o.pot ?? "ceramic");
    const top = y + 6;
    ellipsoid(p, [x, top + 1, z], [4, 1.6, 4], (vx, vy, vz) => (hash(vx, vy, vz) < 0.5 ? "pearl" : "pearlStem"));
    trail(p, x, top, z, s, o.trail ?? 12, "pearlStem", (k) => (k % 2 ? [[1, 0, 0, "pearl"]] : [[-1, 0, 0, "pearl"]]));
  },
  // Phalaenopsis orchid: broad leaves low down, a spike up a cane arching over the front, in flower.
  orchid(p, x, y, z, s, o) {
    pot(p, x, y, z, 5, 7, o.pot ?? "ceramic");
    const top = y + 7;
    around(3, s, 0.85).forEach((d) => leaf(p, [x, top, z], d, 6, 2, (_, k) => (k === 0 ? "orchidRib" : "orchidLeaf")));
    stalk(p, [x - 1, top, z - 1], [x - 1, top + 20, z - 1], "stake");
    const flower = o.pink ? "orchidPink" : "orchidWhite";
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const [fx, fy, fz] = [x - 1 + Math.round(t * 5), top + 19 - Math.round(t * t * 6), z + Math.round(t * 4)];
      ellipsoid(p, [fx, fy, fz], [1.6, 1.6, 0.5], flower);
      p.add(fx, fy, fz + 1, "orchidLip");
    }
  },
  // Boston fern: many fine fronds arching out all round.
  fern(p, x, y, z, s, o) {
    const r = o.r ?? 5;
    pot(p, x, y, z, r, r + 2, o.pot ?? "ceramic");
    around(11, s, 0.7, 0.2).forEach((d, i) =>
      leaf(p, [x, y + r + 2, z], d, 8 + (i % 3), 1.3, (q, k) => (k === 0 ? "fernDark" : (q + Math.abs(k)) % 2 ? "fern" : "fernLight"))
    );
  },
  // Monstera adansonii: bright heart leaves with holes along the midrib.
  monstera(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "nursery");
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
  calathea(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "nursery");
    around(6, s, 0.4).forEach((d) => leaf(p, [x, y + 5, z], d, 8, 1.8, (q, k) => (q % 3 === 1 && k !== 0 ? "calLight" : "calDark")));
  },
  // Peperomia: a low rosette of round leaves, striped silver and green (or the dark red-edged kind).
  peperomia(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "nursery");
    around(8, s, 0.8).forEach((d) =>
      leaf(p, [x, y + 6, z], d, 4, 1.3, (q, k) =>
        o.rosso ? (Math.abs(k) >= 1 && q > 1 ? "rossoEdge" : "rosso") : k === 0 ? "silverVein" : q % 2 ? "silver" : "peperGreen"
      )
    );
    ellipsoid(p, [x, y + 7, z], [1, 1, 1], o.rosso ? "rosso" : "silver");
  },
  // Anthurium: dark glossy hearts and red spathes, a yellow spadix standing out of each.
  anthurium(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "ceramic");
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
  // ZZ plant: stiff stalks of paired glossy leaflets.
  zz(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "nursery");
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
  dracaena(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "nursery");
    around(6, s, 0.55).forEach((d) => leaf(p, [x, y + 5, z], d, 9, 1.2, (_, k) => (k === 0 ? "dracStripe" : "dracEdge")));
  },

  // The cacti and succulents, in small terracotta pots (r 4) on white pebbles.
  // A column cactus, ribbed, with an arm; or an old man cactus in white hair.
  column(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "terracotta", "pebble");
    const h = 14 + (s % 3) * 3;
    ellipsoid(p, [x, y + 5 + h / 2, z], [2.6, h / 2, 2.6], (vx, vy, vz) =>
      o.hairy ? (hash(vx >> 1, vy >> 1, vz) < 0.75 ? "spine" : "cactus") : hash(vx, vy, vz) < 0.08 ? "spine" : rib(vx - x, vz - z)
    );
    if (!o.hairy && s % 2) ellipsoid(p, [x + 2.5, y + 7 + h / 3, z], [1.4, 2.6, 1.4], "cactus"); // (an arm)
  },
  // A ball cactus in a pink pot, spined, some in flower.
  ball(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "pink", "pebble");
    ellipsoid(p, [x, y + 9, z], [3.5, 3.7, 3.5], (vx, vy, vz) => (hash(vx, vy, vz) < 0.1 ? "spine" : rib(vx - x, vz - z)));
    if (s % 3 !== 0)
      for (const [dx, dz] of [
        [0, 0],
        [2, 1],
        [-1, -2],
      ])
        p.add(x + dx, y + 13, z + dz, "cactusBloom");
  },
  // A golden barrel: a squat ball, its ribs thick with yellow spines, a woolly crown.
  barrel(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 5, o.pot ?? "terracotta", "pebble");
    ellipsoid(p, [x, y + 8, z], [3.8, 3.4, 3.8], (vx, vy, vz) =>
      rib(vx - x, vz - z) === "cactus" && hash(vx, vy, vz) < 0.45 ? "goldSpine" : rib(vx - x, vz - z)
    );
    ellipsoid(p, [x, y + 11, z], [1.2, 0.6, 1.2], "goldSpine");
  },
  // Bunny ears: a flat pad with two smaller ones up on it, dotted with tufts.
  opuntia(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "terracotta", "pebble");
    const pad = (cx, cy, rx, ry, tilt) => {
      const [c, sn] = [Math.cos(tilt), Math.sin(tilt)];
      for (let dx = -5; dx <= 5; dx++)
        for (let dy = -5; dy <= 5; dy++) {
          const [u, v] = [dx * c + dy * sn, -dx * sn + dy * c];
          const e = (u / rx) ** 2 + (v / ry) ** 2;
          if (e > 1) continue;
          for (const dz of [0, 1])
            p.add(cx + dx, cy + dy, z + dz, hash(cx + dx, cy + dy, dz + s) < 0.12 ? "glochid" : e > 0.6 ? "opuntiaDark" : "opuntia");
        }
    };
    pad(x, y + 10, 2.6, 4.2, 0);
    pad(x - 2, y + 16, 1.8, 2.8, 0.5);
    pad(x + 2, y + 16, 1.8, 2.8, -0.5);
  },
  // A moon cactus: a ball of red, yellow or pink grafted on a short green column.
  moon(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 5, o.pot ?? "terracotta", "pebble");
    ellipsoid(p, [x, y + 7, z], [1.3, 2.5, 1.3], (vx, vy, vz) => rib(vx - x, vz - z));
    const top = ["moonRed", "moonYellow", "moonPink"][s % 3];
    ellipsoid(p, [x, y + 11, z], [2.6, 2.2, 2.6], (vx, vy, vz) => (rib(vx - x, vz - z) === "cactus" ? top : `${top}Dark`));
  },
  // Echeveria: a tight rosette of fleshy leaves, blue-green with pink tips (or peach, tipped plum).
  echeveria(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 5, o.pot ?? "terracotta", "pebble");
    const [body, light, tip] = o.peach ? ["peachEchev", "peachLight", "peachTip"] : ["echeveria", "echevLight", "echevTip"];
    for (let ring = 0; ring < 3; ring++) {
      const n = 9 - ring * 2;
      const out = 0.85 - ring * 0.25;
      const len = 4 - ring;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.5 + s;
        leaf(p, [x, y + 5 + ring, z], [Math.cos(a) * out, 1 - out * 0.7, Math.sin(a) * out], len, 1.1, (q, k) =>
          q >= len ? tip : k === 0 ? light : body
        );
      }
    }
    p.add(x, y + 8, z, light);
  },
  // Haworthia: a small rosette of pointed dark leaves banded white.
  haworthia(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 5, o.pot ?? "terracotta", "pebble");
    around(10, s, 0.3).forEach((d) => leaf(p, [x, y + 5, z], d, 6, 0.7, (q) => (q % 2 ? "hawStripe" : "haworthia")));
  },
  // Aloe: fleshy spears fanning up, flecked pale.
  aloe(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "terracotta", "pebble");
    around(7, s, 0.4, 0.15).forEach((d, i) =>
      leaf(p, [x, y + 6, z], d, 8 + (i % 3), 1.1, (q, k) => (hash(q, k, i + s) < 0.18 ? "aloeSpot" : k === 0 ? "aloeLight" : "aloe"))
    );
  },
  // Jade: a little woody tree, clusters of fat leaves edged red at its branch tips.
  jade(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 6, o.pot ?? "terracotta");
    const top = y + 6;
    const tips = [
      [0, 7, 0],
      [-3, 5, 1],
      [3, 6, -1],
      [1, 5, 3],
    ].map(([dx, dy, dz]) => [x + dx, top + dy, z + dz]);
    for (const tip of tips) stalk(p, [x, top, z], tip, "jadeTrunk");
    for (const [tx, ty, tz] of tips)
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + s;
        const [lx, lz] = [tx + Math.round(Math.cos(a) * 1.6), tz + Math.round(Math.sin(a) * 1.6)];
        ellipsoid(p, [lx, ty + (i % 2), lz], [1.2, 0.8, 1.2], (vx, vy, vz) => (hash(vx, vy, vz) < 0.2 ? "jadeEdge" : "jade"));
      }
  },
  // Kalanchoe: a mound of round leaves under clusters of little flowers.
  kalanchoe(p, x, y, z, s, o) {
    pot(p, x, y, z, 4, 5, o.pot ?? "terracotta");
    const bloom = o.bloom ?? "kalRed";
    ellipsoid(p, [x, y + 7, z], [3.6, 2.6, 3.6], (vx, vy, vz) =>
      vy >= y + 8 && hash(vx, vy, vz) < 0.55 ? bloom : hash(vx, vy, vz) < 0.3 ? "kalLeafLight" : "kalLeaf"
    );
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + s;
      p.add(x + Math.round(Math.cos(a) * 2), y + 10, z + Math.round(Math.sin(a) * 2), bloom);
    }
  },
};

// Empty terracotta pots nested in a stack: the bottom one whole, then each one's lip over the one below.
export function potStack(p, cx, cy, cz, r, n) {
  pot(p, cx, cy, cz, r, 6, "terracotta", "potInside");
  for (let k = 1; k <= n; k++) {
    const y = cy + 4 + k * 2;
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        const d = dx * dx + dz * dz;
        if (d > r * r + 0.6 || d <= (r - 1.5) ** 2 + 0.6) continue;
        p.add(cx + dx, y, cz + dz, "terracotta");
        p.add(cx + dx, y + 1, cz + dz, "terracottaRim");
      }
  }
}

/* ---------------------------------------------------------------------------------------------------------- */
/* Where they all go (world voxels). */

// The rack on the plinth: two stepped shelves of wire.
export const RACK = { x0: PLINTH.x0 + 6, x1: PLINTH.x1 - 6, low: { z0: -97, z1: -90, y: 22 }, high: { z0: -104, z1: -97, y: 30 } };
// The trays on the pavement in front, side by side with a gap between; the stacks of empty pots past them.
export const TRAY_W = 15;
export const TRAY_COUNT = 7;
export const POT_STACKS = { x0: PLINTH.x1 + 5, x1: PLINTH.x1 + 19, z0: TRAYS.z0, z1: TRAYS.z1 - 2 }; // (clear of the tarp's end)

// Every plant as [kind, x, y, z, seed, options], in three groups (on the rack, on the plinth, in the trays:
// none reaching into another), and every card as [name, price, x, y, z] (its middle, on a front facing the
// street).
export function planted() {
  const [rack, plinth, trays] = [[], [], []];
  const cards = [];
  // On the rack: tall ones up top, mid-sized below, a trailing one here and there; the trails up top short
  // (the shelf below is close under), those below longer, over the plinth's back.
  const HIGH = ["lily", "snake", "pothos", "strelitzia", "rubber", "pearls", "lily", "snake", "strelitzia", "pothos", "rubber", "snake"];
  const LOW = ["orchid", "fern", "calathea", "anthurium", "orchid", "pothos", "fern", "orchid", "calathea", "anthurium", "pearls", "orchid"];
  for (const [row, kinds, trail] of [
    [RACK.high, HIGH, 10],
    [RACK.low, LOW, 16],
  ]) {
    const step = (RACK.x1 - RACK.x0) / kinds.length;
    kinds.forEach((kind, i) =>
      rack.push([kind, RACK.x0 + step * (i + 0.5), row.y + 1, (row.z0 + row.z1) / 2, 50 + i * 7 + row.y, { trail, pink: i % 2 === 0 }])
    );
  }
  // On the plinth in front, a block of each cactus or succulent two pots wide and three deep, the tall
  // kinds between low ones; its card on the plinth's face below.
  const BLOCKS = [
    ["column", "Cactus", "$12"],
    ["echeveria", "Echeveria", "$8"],
    ["opuntia", "Bunny ears", "$14"],
    ["ball", "Ball cactus", "$10"],
    ["aloe", "Aloe", "$12"],
    ["haworthia", "Haworthia", "$8"],
    ["jade", "Jade", "$15"],
    ["moon", "Moon cactus", "$9"],
    ["barrel", "Golden barrel", "$16"],
    ["column", "Old man", "$18", { hairy: true }],
    ["kalanchoe", "Kalanchoe", "$10"],
    ["echeveria", "Echeveria", "$8", { peach: true }],
  ];
  const col = (PLINTH.x1 - PLINTH.x0 - 4) / (BLOCKS.length * 2);
  const BLOOMS = ["kalRed", "kalOrange", "kalYellow"];
  BLOCKS.forEach(([kind, name, price, o = {}], b) => {
    for (let c = 0; c < 2; c++)
      [-86, -81, -76].forEach((z, r) =>
        plinth.push([kind, PLINTH.x0 + 2 + col * (b * 2 + c + 0.5), PLINTH.h, z, b * 31 + c * 7 + r, { ...o, bloom: BLOOMS[r] }])
      );
    cards.push([name, price, PLINTH.x0 + 2 + col * (b * 2 + 1), PLINTH.h - 4.5, PLINTH.z1]);
  });
  // A tray of each of the rest, three by three; its card on the tray's front.
  const TRAY_KINDS = [
    ["peperomia", "Peperomia", "$15"],
    ["calathea", "Calathea", "$22"],
    ["fern", "Fern", "$18", { r: 4 }],
    ["zz", "ZZ plant", "$25"],
    ["peperomia", "Peperomia", "$15", { rosso: true }],
    ["monstera", "Monstera", "$20"],
    ["dracaena", "Dracaena", "$22"],
  ];
  TRAY_KINDS.forEach(([kind, name, price, o = {}], t) => {
    const x0 = trayX(t);
    for (let c = 0; c < 3; c++)
      [-68.5, -64, -59.5].forEach((z, r) => trays.push([kind, x0 + 2.5 + c * 5, 2, z, t * 17 + c * 5 + r, { pot: "nursery", ...o }]));
    cards.push([name, price, x0 + TRAY_W / 2, 3.2, TRAYS.z1]);
  });
  return { groups: [rack, plinth, trays], cards };
}
// The left edge of tray `t`.
export const trayX = (t) => TRAYS.x0 + t * ((TRAYS.x1 - TRAYS.x0 - TRAY_W) / (TRAY_COUNT - 1));
