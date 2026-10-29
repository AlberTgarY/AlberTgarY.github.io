/*******************************************************************************
 * The flower shop's flowers (shop.js): each kind's bloom painted in fine
 * voxels with its own character (a rose's cup with its dark spiral heart, a
 * gerbera's flat daisy with a dark eye, a lily's six-pointed star, a stock's
 * packed spike, an iris's falls with a yellow beard ...), and what is made of
 * them: a bucketful of sleeved bunches (display.js), a bunch gathered in the
 * hand, and the kraft paper and ribbon it is wrapped in (the girl's bouquets,
 * life.js). Blooms are painted in half voxels: the bunches are meshes at
 * scale 0.5.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, meshOf, solidMaterial } from "./kit.js";

const FINE = 0.5; // a bloom's voxels, in voxels

// A random number generator from a seed (the same bunch each time for the same seed).
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A colour darker (k < 1) or towards white (tint), as "#rrggbb".
const shades = new Map();
const c = new THREE.Color();
const white = new THREE.Color(1, 1, 1);
function tone(hex, k) {
  const key = `${hex}*${k}`;
  if (!shades.has(key)) shades.set(key, `#${c.set(hex).multiplyScalar(k).getHexString()}`);
  return shades.get(key);
}
function tint(hex, k) {
  const key = `${hex}+${k}`;
  if (!shades.has(key)) shades.set(key, `#${c.set(hex).lerp(white, k).getHexString()}`);
  return shades.get(key);
}

const GREEN = ["#5f8a3c", "#4f7a32", "#6e9d45", "#46692c"];
const STEM = "#5a8538";

/* ----- one bloom of each kind, at (x, y, z): the bottom of its head, centred on (x, z) ----- */

// A rose: a cup four wide, its outer petals a little lighter, its heart dark and turned.
function rose(p, x, y, z, rand, col) {
  const [dark, light] = [tone(col, 0.68), tint(col, 0.22)];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (Math.abs(dx) + Math.abs(dz) < 2) p.add(x + dx, y, z + dz, col);
  for (let dx = -2; dx <= 1; dx++)
    for (let dz = -2; dz <= 1; dz++) {
      if ((dx === -2 || dx === 1) && (dz === -2 || dz === 1)) continue;
      const inner = dx >= -1 && dx <= 0 && dz >= -1 && dz <= 0;
      p.add(x + dx, y + 1, z + dz, inner ? dark : col);
      if (!inner) p.add(x + dx, y + 2, z + dz, rand() < 0.35 ? light : col);
    }
  // The spiral at the heart: one petal of the inner four still curled up.
  const [sx, sz] = [
    [-1, -1],
    [0, -1],
    [0, 0],
    [-1, 0],
  ][Math.floor(rand() * 4)];
  p.add(x + sx, y + 2, z + sz, col);
}

// A gerbera: a flat daisy seven wide, its petals in alternate shades round a dark eye with a ring round it.
function gerbera(p, x, y, z, rand, col) {
  const r = 3.2;
  const alt = tone(col, 0.86);
  for (let dx = -3; dx <= 3; dx++)
    for (let dz = -3; dz <= 3; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > r * r) continue;
      const sector = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * 14) % 2;
      p.add(x + dx, y, z + dz, d2 <= 1 ? "#3b2b1c" : d2 <= 2 ? "#a08a32" : sector ? col : alt);
    }
  p.add(x, y + 1, z, "#2e2116");
  for (const [dx, dz] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    p.add(x + dx, y - 1, z + dz, GREEN[1]);
}

// A sunflower: a ring of golden petals, notched at the tips, round a broad brown seed head domed in the middle.
function sunflower(p, x, y, z, rand, col) {
  for (let dx = -4; dx <= 4; dx++)
    for (let dz = -4; dz <= 4; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > 17) continue;
      const sector = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * 16) % 2;
      if (d2 > 12 && sector) continue; // (the notches between the petals' tips)
      p.add(x + dx, y, z + dz, d2 <= 5 ? ((dx + dz) & 1 ? "#5b3a1e" : "#4a2e17") : sector ? tone(col, 0.9) : col);
    }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx * dx + dz * dz <= 1) p.add(x + dx, y + 1, z + dz, "#3d2613");
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx * dx + dz * dz <= 4) p.add(x + dx, y - 1, z + dz, GREEN[0]);
}

// A lily: six petals out from a pale throat, their tips curling up, freckled; the stamens standing up out of it.
function lily(p, x, y, z, rand, col) {
  const spot = tone(col === "#f8f3ee" ? "#e7a3b8" : col, 0.62);
  const turn = rand() * 0.5;
  p.add(x, y, z, tint(col, 0.35));
  for (let k = 0; k < 6; k++) {
    const a = turn + (k * Math.PI) / 3;
    for (let d = 1; d <= 3; d++) {
      const [px, pz] = [x + Math.round(Math.cos(a) * d), z + Math.round(Math.sin(a) * d)];
      p.add(px, y + (d === 3 ? 1 : 0), pz, d === 1 ? tint(col, 0.25) : d === 2 && rand() < 0.45 ? spot : col);
    }
  }
  p.add(x, y + 1, z, "#9fbf6a");
  p.add(x + 1, y + 2, z, "#c4651a");
  p.add(x - 1, y + 2, z + 1, "#d9781e");
  p.add(x, y + 2, z - 1, "#c4651a");
}
// A lily bud: a long green bud blushing at the tip.
function lilyBud(p, x, y, z, rand, col) {
  for (let k = 0; k < 5; k++) p.add(x, y + k, z, k < 2 ? GREEN[0] : k < 4 ? "#b9cf8a" : tint(col, 0.1));
}

// A pompom chrysanthemum (a button mum): a small dense ball; the white ones sometimes a daisy with a yellow eye.
function pompom(p, x, y, z, rand, col) {
  if (col === "#f7f4ea" && rand() < 0.45) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) p.add(x + dx, y + 1, z + dz, dx || dz ? col : "#f2c230");
    p.add(x, y, z, GREEN[0]);
    return;
  }
  const dark = tone(col, 0.86);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      p.add(x + dx, y, z + dz, (dx + dz) & 1 ? dark : col);
      if (Math.abs(dx) + Math.abs(dz) < 2) p.add(x + dx, y + 1, z + dz, col);
    }
  p.add(x, y + 2, z, tint(col, 0.2));
}

// A stock: a thick spike packed with florets, bumpy all the way up, narrowing at the top.
function stock(p, x, y, z, rand, col) {
  const [light, dark] = [tint(col, 0.28), tone(col, 0.84)];
  const sides = [
    [-1, 0],
    [2, 0],
    [0, -1],
    [0, 2],
    [1, -1],
    [-1, 1],
    [2, 1],
    [1, 2],
  ];
  for (let h = 0; h < 7; h++) {
    const w = h < 5 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < w; dz++) p.add(x + dx, y + h, z + dz, (h + dx + dz) % 3 === 0 ? light : h % 2 ? col : dark);
    if (h < 5 && rand() < 0.75) {
      const [sx, sz] = sides[Math.floor(rand() * sides.length)];
      p.add(x + sx, y + h, z + sz, light);
    }
  }
}

// A snapdragon: a taller, slimmer spike, its florets jutting out in turn with paler lips, a green bud on top.
function snapdragon(p, x, y, z, rand, col) {
  const lip = tint(col, 0.4);
  for (let h = 0; h < 8; h++) {
    const w = h < 3 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < w; dz++) p.add(x + dx, y + h, z + dz, h >= 7 ? "#9ab563" : col);
    if (h < 6) {
      const [sx, sz] = h % 2 ? [w, 0] : [-1, w - 1];
      p.add(x + sx, y + h, z + sz, lip);
    }
  }
}

// Alstroemeria: a head of three small lily-like flowers, each flecked dark and yellow at its heart.
function alstroemeria(p, x, y, z, rand, col) {
  for (const [ox, oy, oz] of [
    [0, 0, 0],
    [2, 0, 1],
    [-1, 1, -2],
  ]) {
    const [fx, fy, fz] = [x + ox, y + oy, z + oz];
    for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) p.add(fx + dx, fy, fz + dz, col);
    p.add(fx, fy, fz, "#f2d24a");
    p.add(fx + 1, fy, fz + 1, tone(col, 0.55));
    p.add(fx + (rand() < 0.5 ? -1 : 2), fy, fz + (rand() < 0.5 ? 0 : 1), tint(col, 0.2));
  }
}

// A carnation: a frilled cup, its ragged edge broken here and there, paler and darker petals mixed in it.
function carnation(p, x, y, z, rand, col) {
  const [light, dark] = [tint(col, 0.3), tone(col, 0.78)];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (Math.abs(dx) + Math.abs(dz) < 2) p.add(x + dx, y, z + dz, col);
  for (let dx = -2; dx <= 1; dx++)
    for (let dz = -2; dz <= 1; dz++) {
      if ((dx === -2 || dx === 1) && (dz === -2 || dz === 1)) continue;
      const r = rand();
      if (r < 0.18) continue; // (the frill)
      p.add(x + dx, y + 1, z + dz, r < 0.45 ? light : r < 0.62 ? dark : col);
    }
  for (let dx = -1; dx <= 0; dx++) for (let dz = -1; dz <= 0; dz++) if (rand() < 0.6) p.add(x + dx, y + 2, z + dz, rand() < 0.5 ? light : col);
}

// A spray carnation: three small frilled heads on the one stem.
function sprayCarnation(p, x, y, z, rand, col) {
  const light = tint(col, 0.32);
  for (const [ox, oy, oz] of [
    [0, 0, 0],
    [2, -1, 1],
    [-2, -1, 0],
  ]) {
    for (const [dx, dz] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      p.add(x + ox + dx, y + oy, z + oz + dz, rand() < 0.3 ? light : col);
    p.add(x + ox, y + oy + 1, z + oz, light);
  }
}

// A dyed orchid spray: florets along an arching stem, each a flat five-point star, the dye running from one
// colour to the next along it.
function orchid(p, x, y, z, rand, col) {
  const a = rand() * Math.PI * 2;
  const ramp = [col, tone(col, 0.8), "#2fa3b8", "#7a4fd0"];
  for (let i = 0; i < 4; i++) {
    const [fx, fy, fz] = [x + Math.round(Math.cos(a) * i * 2), y + i - (i > 2 ? 1 : 0), z + Math.round(Math.sin(a) * i * 2)];
    const tone_ = ramp[(i + Math.floor(rand() * 2)) % ramp.length];
    for (const [dx, dz] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      p.add(fx + dx, fy, fz + dz, dx || dz ? tone_ : "#f1e9f7");
  }
}

// An iris: three standards upright in the middle, three falls drooping outwards, a yellow beard on each.
function iris(p, x, y, z, rand, col) {
  const light = tint(col, 0.25);
  p.add(x, y, z, col);
  p.add(x, y + 1, z, col);
  p.add(x, y + 2, z, light);
  p.add(x + 1, y + 1, z, light);
  const turn = rand() * 2;
  for (let k = 0; k < 3; k++) {
    const a = turn + (k * 2 * Math.PI) / 3;
    const [cx, sz] = [Math.cos(a), Math.sin(a)];
    p.add(x + Math.round(cx), y, z + Math.round(sz), "#f2c230");
    p.add(x + Math.round(cx * 2), y, z + Math.round(sz * 2), col);
    p.add(x + Math.round(cx * 3), y - 1, z + Math.round(sz * 3), tone(col, 0.82));
  }
}

// A peony: a big, slightly flattened ball of ruffled petals, paler on top.
function peony(p, x, y, z, rand, col) {
  const [light, dark] = [tint(col, 0.3), tone(col, 0.85)];
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      for (let dy = 0; dy <= 3; dy++) {
        if ((dx * dx + dz * dz) / 6.2 + ((dy - 1.4) * (dy - 1.4)) / 3.2 > 1) continue;
        p.add(x + dx, y + dy, z + dz, dy === 3 ? (rand() < 0.5 ? light : col) : rand() < 0.25 ? dark : col);
      }
  p.add(x, y + 4, z, light);
}

// A tulip: a closed cup, its rim a little open at the top, dark inside.
function tulip(p, x, y, z, rand, col) {
  for (let dx = -1; dx <= 0; dx++) for (let dz = -1; dz <= 0; dz++) p.add(x + dx, y, z + dz, tone(col, 0.88));
  for (let dy = 1; dy <= 2; dy++)
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) + Math.abs(dz) === 2) continue;
        if (dy === 2 && !dx && !dz) continue; // (open at the top)
        p.add(x + dx, y + dy, z + dz, dy === 1 && !dx && !dz ? tone(col, 0.5) : (dx + dz + dy) & 1 ? col : tint(col, 0.15));
      }
}

// Gypsophila: a cloud of tiny white flowers on a mist of fine grey-green twigs.
function gypsophila(p, x, y, z, rand, col) {
  for (let i = 0; i < 16; i++) {
    const [dx, dy, dz] = [Math.round((rand() * 2 - 1) * 3), Math.round(rand() * 3), Math.round((rand() * 2 - 1) * 3)];
    if (dx * dx + dz * dz > 10) continue;
    p.add(x + dx, y + dy, z + dz, rand() < 0.7 ? col : "#ece9df");
  }
  for (let i = 0; i < 5; i++) p.add(x + Math.round((rand() * 2 - 1) * 2), y - 1, z + Math.round((rand() * 2 - 1) * 2), "#a7b896");
}

// Waxflower: small round clusters of tiny waxy flowers, a dark eye in some.
function waxflower(p, x, y, z, rand, col) {
  for (let i = 0; i < 10; i++) {
    const [dx, dy, dz] = [Math.round((rand() * 2 - 1) * 2), Math.round(rand() * 2), Math.round((rand() * 2 - 1) * 2)];
    p.add(x + dx, y + dy, z + dz, i < 2 ? "#a83d5c" : rand() < 0.6 ? col : tint(col, 0.5));
  }
  p.add(x, y - 1, z, GREEN[2]);
}

// Eryngium: a steel-blue thistle cone on a ruff of spiky silver-blue bracts.
function eryngium(p, x, y, z, rand, col) {
  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) p.add(x + dx, y + dy, z + dz, (dx + dz + dy) & 1 ? col : tone(col, 0.82));
  p.add(x, y + 2, z, tint(col, 0.2));
  for (const [dx, dz] of [
    [-1, 0],
    [2, 1],
    [1, -1],
    [0, 2],
    [-1, 2],
    [2, -1],
  ])
    p.add(x + dx, y - 1, z + dz, "#9fb3d1");
}

// Statice: a flat-topped head of papery purple bracts, flecked with tiny white flowers.
function statice(p, x, y, z, rand, col) {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      if (dx * dx + dz * dz > 5 || rand() > 0.8) continue;
      const r = rand();
      p.add(x + dx, y + (rand() < 0.3 ? 1 : 0), z + dz, r < 0.2 ? "#f3eef9" : r < 0.6 ? col : tone(col, 0.84));
    }
}

// A king protea: a broad cup of pointed pink bracts, their tips paler, round a silvery cream dome.
function protea(p, x, y, z, rand, col) {
  const tip = tint(col, 0.45);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) p.add(x + dx, y, z + dz, tone(col, 0.85));
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const edge = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      p.add(x + dx, y + 1, z + dz, edge ? col : "#efe4d0");
      if (edge && (dx + dz) % 2 === 0) p.add(x + dx, y + 2, z + dz, tip);
    }
  for (let dx = -1; dx <= 0; dx++) for (let dz = -1; dz <= 0; dz++) p.add(x + dx, y + 2, z + dz, "#e3d6bf");
  p.add(x, y + 3, z, "#d9cbb2");
}

// Lisianthus: an open ruffled cup, its edge darker (purple on the white ones).
function lisianthus(p, x, y, z, rand, col) {
  const edge = col === "#f4f0f6" ? "#8a5bb5" : tone(col, 0.72);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (Math.abs(dx) + Math.abs(dz) < 2) p.add(x + dx, y, z + dz, col);
  for (let dx = -2; dx <= 1; dx++)
    for (let dz = -2; dz <= 1; dz++) {
      if ((dx === -2 || dx === 1) && (dz === -2 || dz === 1)) continue;
      const rim = dx === -2 || dx === 1 || dz === -2 || dz === 1;
      p.add(x + dx, y + 1, z + dz, rim ? (rand() < 0.6 ? edge : col) : "#d8c7e8");
      if (rim && rand() < 0.4) p.add(x + dx, y + 2, z + dz, edge);
    }
}

// Freesia: a stem turned out sideways, its trumpets in a row along it, yellow in the throat, green buds at the end.
function freesia(p, x, y, z, rand, col) {
  const [ax, az] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ][Math.floor(rand() * 4)];
  for (let i = 0; i < 4; i++) {
    const [fx, fz] = [x + ax * i * 2, z + az * i * 2];
    if (i === 3) {
      p.add(fx, y - 1, fz, "#9ab563");
      continue;
    }
    p.add(fx, y, fz, "#f2d24a");
    p.add(fx, y + 1, fz, col);
    p.add(fx + az, y, fz + ax, col);
    p.add(fx - az, y, fz - ax, tint(col, 0.2));
  }
}

// Every kind: its name, its colours, how tall its stems stand out of a bucket (voxels), how far apart its
// blooms are packed and how tall each is (half voxels), whether it is a spike (painted up from its base),
// and how to paint a bloom.
export const FLOWERS = {
  rose: { name: "Roses", colors: ["#c8102e", "#e8507a", "#f5c542", "#f6ad84", "#f6f0e6", "#e23a74"], tall: 10, size: 4.1, head: 3, bloom: rose },
  gerbera: { name: "Gerbera", colors: ["#e8245a", "#f06a9a", "#f6a3bd", "#e8452c", "#f59a2a"], tall: 11, size: 6.4, head: 1, bloom: gerbera },
  sunflower: { name: "Sunflowers", colors: ["#f4c20d"], tall: 15, size: 8.4, head: 1, bloom: sunflower },
  lily: { name: "Lilium", colors: ["#f3a9c4", "#f8f3ee", "#f0c2d6"], tall: 15, size: 6.2, head: 2, bloom: lily },
  pompom: {
    name: "Button daisies",
    colors: ["#f6d23c", "#f7f4ea", "#e9a3c5", "#f3a03a", "#c9a0dc", "#b9d77a"],
    tall: 11,
    size: 3.3,
    head: 2,
    bloom: pompom,
  },
  stock: { name: "Stocks", colors: ["#f2a7c8", "#9b59b6", "#f6f0f5", "#d8a6e8", "#e877b0"], tall: 12, size: 3.4, head: 7, spike: true, bloom: stock },
  snapdragon: {
    name: "Snapdragons",
    colors: ["#f39ab5", "#f6c08a", "#f7e27a", "#f6f2ea", "#d9467a"],
    tall: 13,
    size: 3.2,
    head: 8,
    spike: true,
    bloom: snapdragon,
  },
  alstroemeria: {
    name: "Alstroemeria",
    colors: ["#f28aa0", "#f6a35b", "#f7d34a", "#f4e9e4", "#e05a7a"],
    tall: 10,
    size: 4.8,
    head: 2,
    bloom: alstroemeria,
  },
  carnation: { name: "Carnations", colors: ["#f07aa8", "#c2185b", "#f6f2ec", "#e53950", "#f6b3a0"], tall: 9, size: 4, head: 3, bloom: carnation },
  sprayCarnation: {
    name: "Spray carnations",
    colors: ["#f39ac0", "#d8346e", "#f7f0f2", "#c9a0dc"],
    tall: 9,
    size: 4.4,
    head: 2,
    bloom: sprayCarnation,
  },
  orchid: { name: "Orchids", colors: ["#3f6fd8", "#6a4fd0", "#2f8fc8"], tall: 12, size: 5.6, head: 3, bloom: orchid },
  iris: { name: "Iris", colors: ["#4b3fa8", "#5b4fc0"], tall: 12, size: 4.6, head: 3, bloom: iris },
  peony: { name: "Peonies", colors: ["#f39ab8", "#f4746e", "#f7d7df", "#e2507a"], tall: 10, size: 5, head: 4, bloom: peony },
  tulip: { name: "Tulips", colors: ["#e23a3a", "#f5c542", "#f39ab5", "#f6f2ea", "#f58a3a", "#8e4fb0"], tall: 10, size: 3.5, head: 3, bloom: tulip },
  gypsophila: { name: "Gypsophila", colors: ["#fbfaf4"], tall: 12, size: 4.6, head: 3, bloom: gypsophila },
  waxflower: { name: "Waxflower", colors: ["#f3b6c8", "#f7eef2", "#e78fb0"], tall: 11, size: 4.2, head: 2, bloom: waxflower },
  eryngium: { name: "Eryngium", colors: ["#6c86b8"], tall: 11, size: 3.8, head: 3, bloom: eryngium },
  statice: { name: "Statice", colors: ["#7a4fb0", "#9b6fd0"], tall: 10, size: 4.6, head: 1, bloom: statice },
  protea: { name: "Protea", colors: ["#d9707e", "#e88a9a"], tall: 12, size: 6.2, head: 3, bloom: protea },
  lisianthus: { name: "Lisianthus", colors: ["#f4f0f6", "#8e5bc0", "#f2b5cf"], tall: 11, size: 4.3, head: 2, bloom: lisianthus },
  freesia: { name: "Freesia", colors: ["#f6d23c", "#f7f2ea", "#b27ad6", "#f28aa0"], tall: 11, size: 5, head: 2, bloom: freesia },
};

// The bunches of a bucketful (in half voxels, round (0, 0) with the rim at y = 0), `R` across the top and `H`
// high, as at the market: a few sleeved bunches, each of one colour (in turn from `colors`), one in the
// middle standing tallest and the rest round it leaning out over the rim, a little lower; each a dome of
// blooms packed `size` apart. Returned as the bunches ({ x, z, r, top: where its dome is, base: where its
// stems gather at the rim }) and the blooms in three parts: the whole bucket thinned out by one, then by
// two, picks (pick()) leaves only the first, then the first two.
function bucketParts(kind, colors, R, H, seed) {
  const f = FLOWERS[kind];
  const rand = rng(seed);
  const parts = [part(), part(), part()];
  const n = R >= 17 ? 5 : R >= 14 ? 4 : 3;
  const turn = rand() * Math.PI * 2;
  const bunches = [];
  if (n > 3) bunches.push({ x: 0, z: 0, r: R * 0.5, top: H, base: [0, 0] });
  for (let k = bunches.length; k < n; k++) {
    const a = turn + (k * 2 * Math.PI) / (n - (n > 3 ? 1 : 0));
    const d = R * (n > 3 ? 0.52 : 0.44);
    const [x, z] = [Math.cos(a) * d, Math.sin(a) * d];
    bunches.push({ x, z, r: R * (n > 3 ? 0.48 : 0.56), top: H * (0.84 + 0.1 * rand()), base: [x * 0.35, z * 0.35] });
  }
  // The blooms: in each bunch's dome, as far apart as the kind needs (a few tries each), the outer ones lower.
  const spots = [];
  bunches.forEach((b, k) => {
    const col = colors[k % colors.length];
    for (let tries = 0, got = 0; tries < 160 && got < Math.ceil(36 / n); tries++) {
      const [a, d] = [rand() * Math.PI * 2, Math.sqrt(rand()) * b.r];
      const [x, z] = [Math.round(b.x + Math.cos(a) * d), Math.round(b.z + Math.sin(a) * d)];
      if (spots.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < f.size)) continue;
      spots.push([x, z, Math.round(b.top - 0.45 * b.r * (d / b.r) ** 2 + (rand() - 0.5) * 2), col]);
      got++;
    }
  });
  spots.forEach(([x, z, top, col], i) => {
    const p = parts[i % 5 < 3 ? 0 : i % 5 === 3 ? 1 : 2];
    const base = top - f.head;
    if (kind === "lily" && rand() < 0.35) lilyBud(p, x, base - 1, z, rand, col);
    else f.bloom(p, x, base, z, rand, col);
  });
  return { parts, bunches, head: f.head };
}

// The leaves under each bunch's blooms (a low dome, its faces in different greens), in half voxels as the
// blooms are: one geometry for the bucket, its faces flat.
const LEAF_GREENS = ["#5f8a3c", "#4f7a32", "#6e9d45", "#46692c", "#587f36"].map((h) => new THREE.Color(h));
function leavesGeometry(bunches, head, rand) {
  const [position, color] = [[], []];
  const SIDES = 7;
  for (const b of bunches) {
    const top = b.top - head - 0.5;
    const ring = (k) => [b.r * 1.02 * (k / 3), top - 0.45 * b.r * (k / 3) ** 2];
    const profile = [0, 1, 2, 3].map(ring);
    profile.push([b.r * 0.55, top - 0.45 * b.r - 5]); // (tucked into the sleeve below)
    for (let j = 0; j < profile.length - 1; j++)
      for (let s = 0; s < SIDES; s++) {
        const [a0, a1] = [(s / SIDES) * Math.PI * 2, ((s + 1) / SIDES) * Math.PI * 2];
        const [[r0, y0], [r1, y1]] = [profile[j], profile[j + 1]];
        const at = (r, y, a) => [b.x + Math.cos(a) * r, y, b.z + Math.sin(a) * r];
        const quad = [at(r0, y0, a0), at(r1, y1, a0), at(r1, y1, a1), at(r0, y0, a1)];
        for (const v of [0, 2, 1, 0, 3, 2]) position.push(...quad[v]);
        const c = LEAF_GREENS[Math.floor(rand() * LEAF_GREENS.length)];
        for (let v = 0; v < 6; v++) color.push(c.r, c.g, c.b);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  g.computeVertexNormals();
  g.setIndex([...Array(position.length / 3).keys()]);
  return g;
}

// The cellophane round each bunch: a sleeve from where its stems gather, a little under the rim, flaring up
// round the blooms to the edge of their dome, its top edge crinkled; one geometry for the bucket.
function sleevesGeometry(bunches, head, rand) {
  const [position, index] = [[], []];
  const SIDES = 12;
  for (const b of bunches) {
    const first = position.length / 3;
    const rings = [
      [b.base, b.r * 0.42, -6],
      [[(b.base[0] + b.x) / 2, (b.base[1] + b.z) / 2], b.r * 0.78, (b.top - head) * 0.5],
      [[b.x, b.z], b.r * 1.12, b.top - 0.45 * b.r - head * 0.5],
    ];
    rings.forEach(([[cx, cz], r, y], j) => {
      for (let s = 0; s < SIDES; s++) {
        const a = (s / SIDES) * Math.PI * 2;
        const crinkle = j === 2 ? (s % 2 ? 1.6 : -0.6) + (rand() - 0.5) * 1.5 : 0;
        position.push(cx + Math.cos(a) * r, y + crinkle, cz + Math.sin(a) * r);
      }
    });
    for (let j = 0; j < 2; j++)
      for (let s = 0; s < SIDES; s++) {
        const [p, q] = [first + j * SIDES + s, first + j * SIDES + ((s + 1) % SIDES)];
        index.push(p, q, q + SIDES, p, q + SIDES, p + SIDES);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}
const sleeveMaterial = new THREE.MeshLambertMaterial({
  color: 0xf2f8fa,
  emissive: 0x1c2224,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
  side: THREE.DoubleSide,
});

// Geometries joined end to end (indexed, with normals and colours: solid() meshes' and the leaves'), and
// where each ends in the joined index: drawing up to an end draws only those before it.
function joined(geometries) {
  const [position, normal, color, index] = [[], [], [], []];
  const ends = [];
  for (const g of geometries) {
    const base = position.length / 3;
    for (const v of g.attributes.position.array) position.push(v);
    for (const v of g.attributes.normal.array) normal.push(v);
    for (const v of g.attributes.color.array) color.push(v);
    for (const i of g.index.array) index.push(base + i);
    ends.push(index.length);
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  g.setIndex(index);
  return { geometry: g, ends };
}

// Of a geometry of voxel faces, only those that can face the shop's camera: it never turns (from the front
// right and above: view.js), so a face turned to -x, -y or -z is never seen. (Set unturned in the shop.)
function seenFaces(g) {
  const [n, index] = [g.attributes.normal, g.index.array];
  const kept = [];
  for (let i = 0; i < index.length; i += 3) {
    const v = index[i];
    if (n.getX(v) > -0.5 && n.getY(v) > -0.5 && n.getZ(v) > -0.5) kept.push(index[i], index[i + 1], index[i + 2]);
  }
  g.setIndex(kept);
  return g;
}
// Drawn into the sun's shadow map by their front faces (the back ones are gone: seenFaces()).
const bloomMaterial = solidMaterial.clone();
bloomMaterial.shadowSide = THREE.FrontSide;

// A bucketful of `kind` (display.js): a mesh with its base at the rim, `R` voxels across the top (the
// bunches flaring out over the rim) and `H` voxels high, in `colors`, the bunches' leaves in it and their
// cellophane a mesh of its own on it. `level(n)` shows it full (3) or thinned out by picking (2, then 1).
export function bucketBlooms(kind, colors, R, H, seed) {
  const { parts, bunches, head } = bucketParts(kind, colors, Math.round(R / FINE), Math.round(H / FINE), seed);
  const rand = rng(seed + 1);
  const { geometry, ends } = joined([leavesGeometry(bunches, head, rand), ...parts.map((p) => seenFaces(meshOf(p).geometry))]);
  const mesh = new THREE.Mesh(geometry, bloomMaterial);
  mesh.scale.setScalar(FINE);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.add(new THREE.Mesh(sleevesGeometry(bunches, head, rand), sleeveMaterial));
  mesh.userData.level = (n) => geometry.setDrawRange(0, ends[Math.max(1, Math.min(3, n))]);
  return mesh;
}

// A line of voxels from a to b (a stem).
function line(p, [ax, ay, az], [bx, by, bz], col) {
  const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az), 1);
  for (let k = 0; k <= n; k++)
    p.add(Math.round(ax + ((bx - ax) * k) / n), Math.round(ay + ((by - ay) * k) / n), Math.round(az + ((bz - az) * k) / n), col);
}

// A bunch gathered in the hand: `stems` blooms of `kinds` (mixed, each its own colour) on stems that come
// together at the grip (y = 0) and fan out above it; about 14 voxels tall and 8 across.
export function bunchMesh(kinds, seed, stems = 7) {
  const rand = rng(seed);
  const p = part();
  const R = 7; // (half voxels)
  const spots = [];
  for (let tries = 0; tries < 300 && spots.length < stems; tries++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * R;
    const [x, z] = [Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d)];
    if (spots.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 3.6)) continue;
    spots.push([x, z, d]);
  }
  spots.forEach(([x, z, d], i) => {
    const kind = kinds[i % kinds.length];
    const f = FLOWERS[kind];
    const col = f.colors[Math.floor(rand() * f.colors.length)];
    const top = Math.round(27 - 0.12 * d * d + (rand() - 0.5) * 2);
    const base = Math.min(top - f.head, f.spike ? 19 : 24);
    line(p, [Math.round(x * 0.15), 0, Math.round(z * 0.15)], [x, base - 1, z], STEM);
    if (rand() < 0.6) p.add(x + (x > 0 ? 1 : -1), Math.round(base * 0.6), z, GREEN[2]);
    if (kind === "lily" && rand() < 0.3) lilyBud(p, x, base, z, rand, col);
    else f.bloom(p, x, base, z, rand, col);
  });
  const group = new THREE.Group();
  group.add(meshOf(p, FINE));
  return group;
}

// The kraft paper a bunch is wrapped in (a cone round its stems from the grip up, a zigzag edge, a white tissue
// lining showing at the top, a cellophane frill over it) and the ribbon tied round the grip in a bow, one of a
// few colours. `paper` scales in from 0 (just picked up) to 1 (wrapped); `ribbon` is shown once it is tied.
const RIBBONS = ["#e8507a", "#c8102e", "#f6efe2", "#9b59b6", "#e9b44c"];
export function wrapMesh(seed) {
  const rand = rng(seed);
  const p = part();
  const H = 22;
  const turn = rand() * Math.PI;
  for (let y = 0; y <= H; y++) {
    const r = 2.6 + (y / H) * 8.2;
    for (let x = -12; x <= 12; x++)
      for (let z = -12; z <= 12; z++) {
        const d = Math.hypot(x, z);
        if (d > r || d < r - 1.3) continue;
        const a = Math.atan2(z, x) + turn;
        const saw = Math.abs((((a / (2 * Math.PI)) * 9) % 1) - 0.5) * 2; // (the zigzag edge)
        if (y > H - 4 + 4 * saw) continue;
        const fold = Math.floor(((a / (2 * Math.PI)) * 6 + 6) % 6) !== Math.floor((((a + 0.12) / (2 * Math.PI)) * 6 + 6) % 6);
        p.add(x, y, z, y > H - 6 && d < r - 0.6 ? "#f4efe6" : fold ? "kraftDark" : "kraft");
      }
  }
  // The cellophane frill: pale and glassy round the top edge.
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    const r = 11.4;
    p.add(Math.round(Math.cos(a) * r), H - 3 + (k % 3), Math.round(Math.sin(a) * r), "cellophane");
  }
  const paper = new THREE.Group();
  const paperMesh = meshOf(p, FINE);
  paperMesh.castShadow = true;
  paper.add(paperMesh);
  // The ribbon: a band round the grip, a bow at the front, its two tails hanging.
  const col = RIBBONS[Math.floor(rand() * RIBBONS.length)];
  const q = part();
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    q.add(Math.round(Math.cos(a) * 3.6), 4, Math.round(Math.sin(a) * 3.6), col);
  }
  for (const side of [-1, 1]) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      q.add(side * 3 + Math.round(Math.cos(a) * 2.2), 5 + Math.round(Math.sin(a) * 1.6), 4, col);
    }
    line(q, [side, 3, 4], [side * 3, -3, 5], tone(col, 0.85));
  }
  q.add(0, 4, 4, tone(col, 0.8));
  q.add(0, 5, 4, tone(col, 0.8));
  const ribbon = meshOf(q, FINE);
  const group = new THREE.Group();
  group.add(paper, ribbon);
  return { group, paper, ribbon };
}

// A finished bouquet: a bunch of `kinds` wrapped and tied.
export function bouquet(kinds, seed) {
  const group = new THREE.Group();
  group.add(bunchMesh(kinds, seed));
  group.add(wrapMesh(seed + 7).group);
  return group;
}
