/*******************************************************************************
 * Her farm game's scenes away from the farm: fishing off the dock, the mine
 * and its slimes, geodes at the blacksmith's, town, a heart event, the museum,
 * the saloon, the season's festival and foraging on the beach.
 *
 * Each scene draws itself `p` (0-1) into it on `b` (kit.js's Bitmap) and says
 * which tool is out on the hotbar (-1: the hotbar hidden).
 ******************************************************************************/

import { W, H, backdrop, noise, digits, sprite } from "./kit.js";
import {
  INK,
  farmer,
  villager,
  slime,
  fish,
  gem,
  heart,
  star,
  sparkle,
  lawn,
  sand,
  water,
  cobbles,
  caveFloor,
  boards,
  wallpaper,
  tree,
  pine,
  flowers,
  sky,
  dialogue,
  rain,
} from "./art.js";
import { walking } from "./farm.js";

const GEMS = ["#c79bf2", "#5fe0a0", "#5fc8f0", "#f0605a", "#f6cf4a"];
// The villagers she sees, each their hair and clothes.
const FOLK = [
  { hair: "#5e3624", top: "#e05a8a", long: true },
  { hair: "#e0602e", top: "#3e8fd6" },
  { hair: "#2b2522", top: "#5fb03a", long: true },
  { hair: "#9b59d0", top: "#f2c14e", long: true },
  { hair: "#f2c14e", top: "#c0392b" },
];

// A box with a number in it, top left (the mine's floor, the festival's count).
function counter(b, n, colour = "#5c3a26") {
  b.rect(3, 3, 22, 11, INK);
  b.rect(4, 4, 20, 9, "#fbe3b0");
  digits(b, n, 7, 6, colour);
}

/* ---------- the backdrops ---------- */

// The pond's far bank (grass, trees, reeds), the water drawn over the rest each frame, the dock from the left.
function pond(b, season, wet) {
  sky(b, 14, wet ? "#7a8aa8" : "#5ab0f0", wet ? "#a8b4c8" : "#bfe6fb", 0, 0);
  lawn(b, 0, 14, W, 14, season, 21);
  tree(b, 24, 28, season, 5, 0.6);
  pine(b, 120, 28, season);
  tree(b, 150, 28, season, 6, 0.55);
  for (let i = 4; i < W; i += 11) b.rect(i, 24, 1, 5, "#3a7a2a");
}
function dock(b) {
  b.rect(0, 50, 58, 13, INK);
  for (let j = 0; j < 11; j++) b.rect(0, 51 + j, 57, 1, j % 4 === 3 ? "#8a5228" : j % 4 === 0 ? "#d29152" : "#b5763c");
  for (let i = 9; i < 57; i += 12) b.rect(i, 51, 1, 11, "#8a5228");
  for (const x of [4, 50]) {
    b.rect(x, 63, 4, 10, "#6b3f22");
    b.rect(x, 63, 4, 1, INK);
  }
}

// The mine: the rock face along the top, the floor below, both different on each floor.
function cave(b, seed) {
  caveFloor(b, 0, 0, W, H, seed);
  for (let x = 0; x < W; x++) {
    const top = 20 + Math.round(4 * Math.sin(x * 0.2 + seed) + 3 * noise(x, seed, 2));
    b.rect(x, 0, 1, top, "#4a3a32");
    for (let y = 0; y < top; y++) if (noise(x, y, seed) < 0.1) b.px(x, y, noise(y, x, seed) < 0.5 ? "#5e4a3e" : "#3a2c26");
    b.px(x, top, INK);
    b.px(x, top - 1, "#6a5446");
  }
  for (let k = 0; k < 6; k++) b.px(Math.floor(noise(k, seed, 4) * W), 4 + Math.floor(noise(seed, k, 4) * 12), GEMS[k % GEMS.length]);
  // The timber props holding the roof up, a lantern hung from each crossbeam, its warm light.
  for (const x of [18, 128]) {
    for (const px of [x, x + 22]) {
      b.rect(px - 1, 0, 5, 32, INK);
      b.rect(px, 0, 3, 31, "#8a5a34");
      b.rect(px, 0, 1, 31, "#b07a44");
    }
    b.rect(x - 2, 3, 29, 5, INK);
    b.rect(x - 1, 4, 27, 3, "#9a6a3a");
    b.rect(x - 1, 4, 27, 1, "#c08a50");
    glow(b, x + 12, 16, 16, "#ffb050", 0.22);
    b.rect(x + 12, 7, 1, 4, INK);
    b.rect(x + 10, 11, 5, 6, INK);
    b.rect(x + 11, 12, 3, 4, "#fff1a8");
  }
  // Pebbles, little stones and cave weeds about the floor.
  for (let k = 0; k < 26; k++) {
    const [x, y] = [Math.floor(noise(k, seed, 11) * W), 30 + Math.floor(noise(seed, k, 12) * 60)];
    if (k % 3 === 0) {
      b.rect(x - 2, y - 2, 5, 3, INK);
      b.rect(x - 1, y - 2, 3, 2, "#9a9aa4");
      b.px(x - 1, y - 2, "#c8c8d0");
    } else if (k % 3 === 1) b.rect(x, y, 2, 1, "#5e4636");
    else for (const dx of [-1, 0, 1]) b.rect(x + dx, y - 2 + Math.abs(dx), 1, 2 - Math.abs(dx), "#5a8a4a");
  }
}

// A warm (or any) light round (x, y), `r` across, fading out, laid over what is there.
function glow(b, x, y, r, colour, strength) {
  for (let j = -r; j <= r; j++) {
    const half = Math.round(Math.sqrt(r * r - j * j));
    for (let ring = 3; ring >= 1; ring--) b.tint(x - (half * ring) / 3, y + j, (2 * half * ring) / 3, 1, colour, strength / 2);
  }
}

function rock(b, x, y, ore) {
  b.rect(x - 6, y - 8, 13, 9, INK);
  b.rect(x - 7, y - 6, 15, 6, INK);
  b.rect(x - 5, y - 7, 11, 7, "#8a8f97");
  b.rect(x - 6, y - 5, 13, 4, "#8a8f97");
  b.rect(x - 4, y - 7, 6, 2, "#b8bec6");
  b.rect(x - 6, y - 1, 13, 1, "#5a5f68");
  for (const [dx, dy] of [
    [-2, -4],
    [2, -3],
    [0, -6],
  ])
    b.rect(x + dx, y + dy, 2, 1, ore);
}

// The blacksmith's: stone walls, the furnace glowing (drawn each frame), the counter, the anvil on it.
function smithy(b) {
  b.rect(0, 0, W, 44, "#6a6a72");
  for (let j = 0; j < 44; j += 5)
    for (let i = (j / 5) % 2 ? -5 : 0; i < W; i += 10) {
      b.rect(i + 1, j + 1, 8, 3, noise(i, j, 31) < 0.5 ? "#7a7a84" : "#727280");
      b.rect(i + 1, j + 4, 9, 1, "#4a4a52");
    }
  cobbles(b, 0, 44, W, H - 44, 32);
  b.rect(8, 10, 34, 34, INK);
  b.rect(9, 11, 32, 33, "#4a4a52");
  b.rect(15, 22, 20, 16, "#1b1416");
  b.rect(0, 50, W, 16, INK);
  b.rect(0, 51, W, 3, "#c8823f");
  b.rect(0, 54, W, 11, "#8a5228");
  for (let i = 6; i < W; i += 14) b.rect(i, 55, 1, 10, "#6b3f22");
  b.rect(104, 42, 24, 9, INK);
  b.rect(105, 43, 22, 4, "#5a5a6a");
  b.rect(110, 47, 12, 4, "#4a4a55");
}

// Town: the shop, the clinic and a cottage along the top, the square's cobbles, trees, a lamp and flowers.
function town(b, season) {
  lawn(b, 0, 0, W, H, season, 41);
  cobbles(b, 0, 46, W, 50, 42);
  [
    [4, 50, "#f2e3c4", "#5a7a3a", true],
    [62, 44, "#e8eef4", "#3e6fd6", false],
    [116, 48, "#f6d79a", "#9a3a5a", false],
  ].forEach(([x, w, wall, roof, shop]) => {
    for (let j = 0; j < 12; j++) {
      const inset = Math.max(0, 5 - j);
      b.rect(x - 2 + inset, 4 + j, w + 4 - 2 * inset, 1, j % 3 === 2 ? INK : roof);
    }
    b.rect(x - 2, 16, w + 4, 1, INK);
    b.rect(x, 17, w, 26, wall);
    b.rect(x - 1, 17, 1, 26, INK);
    b.rect(x + w, 17, 1, 26, INK);
    b.rect(x, 42, w, 1, INK);
    const door = x + Math.floor(w / 2) - 4;
    b.rect(door - 1, 26, 10, 16, INK);
    b.rect(door, 27, 8, 15, "#8a5228");
    b.px(door + 6, 34, "#f6cf4a");
    for (const wx of [x + 4, x + w - 14]) {
      b.rect(wx - 1, 23, 12, 10, INK);
      b.rect(wx, 24, 10, 8, "#8fd0f5");
      b.rect(wx + 5, 24, 1, 8, "#e8e0d0");
      b.rect(wx + 1, 25, 2, 2, "#d8f0ff");
    }
    if (shop) for (let i = x; i < x + w; i += 4) b.rect(i, 18, 2, 4, i % 8 ? "#5fb03a" : "#ffffff");
  });
  // A lamp post, trees either side, flowers in a bed.
  b.rect(58, 50, 2, 22, "#2b2b33");
  b.rect(55, 46, 8, 5, INK);
  b.rect(56, 47, 6, 3, "#f6d77a");
  tree(b, 112, 70, season, 7, 0.7);
  b.rect(130, 76, 34, 8, INK);
  b.rect(131, 77, 32, 6, "#6b4a32");
  flowers(b, 134, 81, 7, 4);
}

// The museum: dark panelling with bookcases, the floor, display tables (filled each frame), the desk.
function museum(b) {
  b.rect(0, 0, W, 34, "#5a3a2a");
  for (let x = 4; x < W; x += 36) {
    b.rect(x, 4, 28, 28, INK);
    b.rect(x + 1, 5, 26, 26, "#7a4a2a");
    for (let s = 0; s < 3; s++) {
      b.rect(x + 1, 12 + s * 9, 26, 1, "#4a2a1a");
      for (let k = 0; k < 8; k++) b.rect(x + 2 + k * 3, 6 + s * 9, 2, 6, ["#c0392b", "#3e6fd6", "#5fb03a", "#f6cf4a", "#9b59d0"][(k + s + x) % 5]);
    }
  }
  b.rect(0, 33, W, 1, INK);
  boards(b, 0, 34, W, H - 34, { plank: "#8a5a3a", light: "#a06a42", dark: "#6a4028" });
  for (let k = 0; k < 6; k++) {
    const [x, y] = [14 + (k % 3) * 34, 44 + Math.floor(k / 3) * 20];
    b.rect(x - 1, y - 1, 26, 10, INK);
    b.rect(x, y, 24, 6, "#d8b88a");
    b.rect(x, y + 6, 24, 2, "#8a5a34");
  }
  b.rect(124, 52, 40, 14, INK);
  b.rect(125, 53, 38, 4, "#c8823f");
  b.rect(125, 57, 38, 8, "#8a5228");
}

// The saloon: panelled walls with lamps, the bar and its bottles, the jukebox and the arcade machine (their
// lights drawn each frame), a table.
function saloon(b) {
  wallpaper(b, 0, 0, W, 34, "#7a3a2a", "#6a3022");
  boards(b, 0, 34, W, H - 34, { plank: "#8a5228", light: "#a8683a", dark: "#5e3820" });
  for (const x of [30, 90]) {
    b.rect(x, 6, 6, 4, "#f6d77a");
    b.rect(x + 1, 4, 4, 2, INK);
  }
  b.rect(0, 22, 66, 18, INK);
  b.rect(0, 23, 65, 4, "#c8823f");
  b.rect(0, 27, 65, 12, "#6b3f22");
  for (let k = 0; k < 8; k++) {
    b.rect(4 + k * 7, 8, 3, 8, INK);
    b.rect(5 + k * 7, 9, 1, 7, ["#5fb03a", "#c0392b", "#f6cf4a", "#8fd3ff"][k % 4]);
  }
  b.rect(0, 16, 60, 2, "#8a5228");
  b.rect(76, 18, 18, 24, INK);
  b.rect(77, 19, 16, 22, "#c0603a");
  b.rect(130, 14, 22, 32, INK);
  b.rect(131, 15, 20, 30, "#2b2b44");
  b.rect(133, 17, 16, 12, "#101018");
  b.rect(133, 32, 16, 4, "#3a3a58");
  b.rect(42, 64, 30, 14, INK);
  b.rect(43, 65, 28, 8, "#a8662f");
  b.rect(43, 65, 28, 1, "#c8823f");
}

/* ---------- the scenes ---------- */

export const OUT = {
  // Out on the dock, the line out to the bobber; a bite ("!"), the fishing bar, and the fish held up.
  fish({ b, p, t, season, rainy }) {
    b.copy(backdrop(`pond${season}${rainy}`, (bb) => pond(bb, season, rainy)));
    water(b, 0, 28, W, H - 28, t);
    for (let i = 0; i < W; i++) b.px(i, 28, "#a8d8f8");
    dock(b);
    const bite = p > 0.55;
    const bob = bite ? Math.round(Math.sin(t * 14)) : Math.round(Math.sin(t * 2) * 0.6);
    const caught = p >= 0.88;
    if (!caught) {
      // The rod held out, the line curving down to the bobber.
      for (let k = 0; k <= 10; k++) b.px(48 + k, 40 - k * 0.6, "#8a5228");
      const [x0, y0, x1, y1] = [58, 34, 112, 70 + bob];
      for (let k = 0; k <= 60; k++) {
        const u = k / 60;
        b.px(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u * u, "#e8e8f0");
      }
      b.rect(111, 68 + bob, 3, 2, "#e0402e");
      b.rect(111, 67 + bob, 3, 1, "#ffffff");
      if (bite) for (let k = 0; k < 3; k++) b.px(106 + k * 4, 72 + ((k + Math.floor(t * 6)) % 2), "#d8f0ff");
      farmer(b, 46, 58, "side", { coat: rainy });
    } else {
      farmer(b, 46, 58, "lift", { coat: rainy });
      fish(b, 46, 42, rainy ? "#5fc8f0" : "#f39a33");
      sparkle(b, 54, 34, t);
    }
    if (bite && p < 0.62 && Math.sin(t * 10) > -0.5) {
      b.rect(43, 28, 7, 10, INK);
      b.rect(44, 29, 5, 8, "#f6cf4a");
      b.rect(46, 30, 1, 4, INK);
      b.px(46, 35, INK);
    }
    if (p > 0.62 && !caught) {
      // The bar: the green catch zone she keeps on the fish, the meter filling beside it.
      const q = (p - 0.62) / 0.26;
      b.rect(136, 6, 22, 76, INK);
      b.rect(137, 7, 20, 74, "#c8823f");
      b.rect(140, 10, 9, 68, "#2f6fb0");
      const zone = 10 + Math.round(24 + 18 * Math.sin(t * 2.4));
      b.rect(140, zone, 9, 20, "#7fe07a");
      fish(b, 145, 10 + Math.round(30 + 26 * Math.sin(t * 3.1 + 1)) + 5, "#f39a33");
      b.rect(151, 10, 4, 68, "#5c3a26");
      b.rect(151, 78 - Math.round(q * 68), 4, Math.round(q * 68), q > 0.6 ? "#7fe07a" : "#f6cf4a");
    }
    if (rainy) {
      b.tint(0, 0, W, H, "#3a4a6a", 0.25);
      rain(b, t, 40);
    }
    return 1;
  },
  // Down the mine (the floor number in the corner): rocks broken one by one, a ladder down, and a gem.
  mine({ b, p, t, day }) {
    b.copy(backdrop(`cave${day % 9}`, (bb) => cave(bb, day % 9)));
    const ROCKS = [
      [36, 70],
      [62, 46],
      [92, 74],
      [118, 50],
      [146, 72],
    ];
    const broken = Math.floor(Math.min(1, p / 0.8) * ROCKS.length);
    ROCKS.forEach(([x, y], k) => k >= broken && rock(b, x, y, k % 2 ? "#f39a33" : "#5fe0e0"));
    if (p > 0.6) {
      b.rect(76, 26, 14, 12, INK);
      b.rect(77, 27, 12, 10, "#1b1416");
      for (let y = 27; y < 37; y += 3) b.rect(79, y, 8, 1, "#c8823f");
      b.rect(79, 27, 1, 10, "#a8662f");
      b.rect(86, 27, 1, 10, "#a8662f");
    }
    const [rx, ry] = ROCKS[Math.min(broken, ROCKS.length - 1)];
    const found = p > 0.82;
    if (found) {
      farmer(b, rx - 12, ry, "lift");
      gem(b, rx - 12, ry - 17, GEMS[day % GEMS.length]);
      sparkle(b, rx - 6, ry - 24, t);
    } else {
      farmer(b, rx - 12, ry, "side");
      // The pickaxe, raised and coming down.
      const down = Math.sin(t * 10) > 0;
      const [hx, hy] = down ? [rx - 4, ry - 7] : [rx - 9, ry - 20];
      b.rect(rx - 8, ry - 12, 1, 1, "#8a5228");
      for (let k = 0; k < 6; k++) b.px(rx - 8 + ((hx - rx + 8) * k) / 6, ry - 11 + ((hy - ry + 11) * k) / 6, "#8a5228");
      b.rect(hx - 2, hy, 5, 2, "#c8ccd4");
      b.px(hx - 2, hy + 2, "#c8ccd4");
      if (down) for (let k = 0; k < 3; k++) b.px(rx - 3 + k * 2, ry - 10 - k, "#d8d8e0");
    }
    counter(b, 1 + ((day * 3) % 119), "#5c3a26");
    return 2;
  },
  // Deeper down: slimes hopping in at her one after another, the sword swung at each and it bursts; her
  // health going down a little.
  slime({ b, p, t, day }) {
    b.copy(backdrop(`cave${(day + 4) % 9}`, (bb) => cave(bb, (day + 4) % 9)));
    const colours = ["#6ee06a", "#6ac8f0", "#c79bf2"];
    const gone = Math.floor(Math.min(1, p / 0.8) * 3);
    for (let k = gone; k < 3; k++) {
      const x = 130 - (k - gone) * 22 - Math.round(((p * 3.75) % 1) * (k === gone ? 60 : 8));
      const hop = Math.abs(Math.sin(t * 5 + k)) * 6;
      slime(b, x, 70 - hop, colours[k], hop < 1 ? 1 : 0);
    }
    if (gone > 0 && (p * 3.75) % 1 < 0.25)
      for (let k = 0; k < 8; k++) b.px(70 + Math.cos(k) * 8 * (1 + ((p * 3.75) % 1) * 3), 64 + Math.sin(k) * 5, colours[gone - 1]);
    farmer(b, 50, 72, "side");
    // The sword: swung down in an arc in front of her.
    const swing = (t * 3) % 1;
    const a = -1.4 + swing * 2.4;
    for (let r = 3; r < 13; r++) b.px(56 + Math.cos(a) * r, 62 + Math.sin(a) * r, r < 5 ? "#8a5228" : "#d8dde6");
    if (swing > 0.3 && swing < 0.7) for (let k = 0; k < 8; k++) b.px(56 + Math.cos(a - k * 0.12) * 12, 62 + Math.sin(a - k * 0.12) * 12, "#ffffff");
    // Health, bottom right.
    b.rect(152, 40, 10, 42, INK);
    b.rect(153, 41, 8, 40, "#c8823f");
    b.rect(155, 44, 4, 35, "#3a2a2a");
    const hp = Math.round(35 * (1 - p * 0.3));
    b.rect(155, 79 - hp, 4, hp, hp > 20 ? "#7fe07a" : "#f6cf4a");
    if (p > 0.85) sparkle(b, 50, 46, t);
    return 8;
  },
  // At the blacksmith's: geodes on the counter, the hammer comes down on each, and it cracks open on a gem.
  geode({ b, p, t, day }) {
    b.copy(backdrop("smithy", smithy));
    const fire = Math.sin(t * 7) > 0 ? "#f39a33" : "#e0602e";
    b.rect(17, 28, 16, 10, fire);
    b.rect(20, 32, 10, 6, "#fff1a8");
    villager(b, 82, 52, { hair: "#2b2522", top: "#6a5a4a", legs: "#3a3a44" });
    const k = Math.min(2, Math.floor(p * 3));
    const q = (p * 3) % 1;
    for (let j = 0; j < 3; j++) {
      const x = 110 + j * 8;
      const open = j < k || (j === k && q > 0.5);
      b.rect(x - 3, 37, 7, 6, INK);
      b.rect(x - 2, 38, 5, 5, open ? "#5a5a6a" : "#9a9aa4");
      if (open) b.rect(x - 1, 39, 3, 2, GEMS[(day + j) % GEMS.length]);
      if (j === k && open) sparkle(b, x, 32, t);
    }
    const hx = 110 + k * 8;
    const down = q > 0.35 && q < 0.5;
    b.rect(hx, down ? 26 : 16, 1, 10, "#8a5228");
    b.rect(hx - 3, down ? 24 : 14, 7, 3, "#5a5a6a");
    farmer(b, 118, 79, "back");
    return 2;
  },
  // Into town: a gift for a villager, a heart, and one more on their row of hearts.
  town({ b, p, t, day, season }) {
    b.copy(backdrop(`town${season}`, (bb) => town(bb, season)));
    const who = FOLK[day % FOLK.length];
    villager(b, 96, 78, who);
    const x = Math.round(Math.min(84, 14 + (p / 0.6) * 70));
    farmer(b, x, 80, p < 0.6 ? walking(t) : "side");
    if (p > 0.6 && p < 0.7) {
      b.rect(x + 5, 64, 7, 6, "#e05aa0");
      b.rect(x + 8, 63, 1, 7, "#f6cf4a");
    }
    // Their friendship: a row of hearts in a box.
    const hearts = 1 + (day % 5) + (p > 0.65 ? 1 : 0);
    b.rect(3, 3, 64, 10, INK);
    b.rect(4, 4, 62, 8, "#fbe3b0");
    for (let k = 0; k < 10; k++) {
      const c = k < hearts ? "#ff5a8a" : "#c8a888";
      b.rect(6 + k * 6, 6, 2, 1, c);
      b.rect(9 + k * 6, 6, 2, 1, c);
      b.rect(6 + k * 6, 7, 5, 2, c);
      b.px(8 + k * 6, 9, c);
    }
    if (p > 0.65) heart(b, 93, Math.round(52 - (p - 0.65) * 30));
    return 6;
  },
  // A heart event: the two of them somewhere of their own (the beach at sunset, or the hilltop under the
  // stars), the words coming up in the box with the villager's portrait, then hearts.
  heart({ b, p, t, day }) {
    const who = FOLK[day % FOLK.length];
    if (day % 2) {
      sky(b, 30, "#9b6bc0", "#f6a06a", 0, 0);
      b.rect(96, 16, 16, 14, "#fff1a8");
      water(b, 0, 30, W, 16, t, { deep: "#c06a7a", ripple: "#f0a080", glint: "#fff1a8" });
      sand(b, 0, 46, W, H - 46, 51);
      b.tint(0, 46, W, H - 46, "#f6a06a", 0.25);
    } else {
      b.rect(0, 0, W, 50, "#1a2050");
      for (let k = 0; k < 30; k++) if (Math.sin(t * 2 + k) > -0.6) b.px(Math.floor(noise(k, 1, 6) * W), Math.floor(noise(k, 2, 6) * 46), "#fff6c9");
      b.rect(130, 8, 8, 8, "#fff1a8");
      lawn(b, 0, 46, W, H - 46, 1, 52);
      b.tint(0, 46, W, H - 46, "#1a2050", 0.5);
    }
    farmer(b, 72, 64, "side");
    villager(b, 92, 64, who);
    if (p > 0.6) heart(b, 82, Math.round(38 - (p - 0.6) * 20));
    const words =
      day % 2
        ? ["THE SEA LOOKS LIKE GOLD", "TONIGHT. I'M GLAD YOU", "CAME OUT HERE WITH ME."]
        : ["LOOK, A SHOOTING STAR!", "DID YOU MAKE A WISH?", "... ME TOO."];
    dialogue(b, Math.min(1, p / 0.55), words, who, H);
    return -1;
  },
  // The museum: her find carried in and set in its place on the display, the tables filling up.
  museum({ b, p, t, day }) {
    b.copy(backdrop("museum", museum));
    const placed = 7 + (day % 4) + (p > 0.6 ? 1 : 0);
    for (let k = 0; k < Math.min(placed, 18); k++) {
      const table = Math.floor(k / 3);
      const [x, y] = [14 + (table % 3) * 34 + 3 + (k % 3) * 8, 44 + Math.floor(table / 3) * 20 + 5];
      gem(b, x + 2, y, GEMS[(k + day) % GEMS.length]);
    }
    villager(b, 144, 56, { hair: "#9a9aa4", top: "#3a3a48" });
    const x = Math.round(Math.min(96, 10 + (p / 0.55) * 86));
    if (p < 0.6) {
      farmer(b, x, 88, "lift");
      gem(b, x, 71, GEMS[(placed - 1 + day) % GEMS.length]);
    } else {
      farmer(b, x, 88, "back");
      sparkle(b, 86, 60, t);
    }
    return -1;
  },
  // The saloon of an evening: friends at a table, the jukebox's lights; she plays the arcade machine.
  saloon({ b, p, t, day }) {
    b.copy(backdrop("saloon", saloon));
    for (let k = 0; k < 4; k++) b.rect(79 + k * 4, 22, 2, 3, ["#ff6f9a", "#f6cf4a", "#5fe0a0", "#8fd3ff"][(k + Math.floor(t * 6)) % 4]);
    // The arcade game: a little ship dodging.
    b.rect(133, 17, 16, 12, "#101018");
    b.px(134 + ((t * 9) % 14), 18 + ((t * 13) % 10), "#f6cf4a");
    b.rect(139 + Math.round(Math.sin(t * 3) * 5), 26, 3, 2, "#5fe0a0");
    villager(b, 30, 46, { hair: "#c8a050", top: "#8a5a34" });
    villager(b, 48, 76, FOLK[(day + 1) % FOLK.length]);
    villager(b, 66, 76, FOLK[(day + 2) % FOLK.length]);
    farmer(b, 140, 64, "back");
    if (p > 0.4)
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.7 + k / 3) % 1;
        b.rect(118 + k * 6, 40 - u * 20, 2, 2, "#fff6c9");
        b.rect(119 + k * 6, 36 - u * 20, 1, 4, "#fff6c9");
      }
    return -1;
  },
  // The season's festival: the egg hunt in the spring, the luau on the beach in the summer, the fair in the
  // autumn, ice fishing in the winter; her count going up, and the prize.
  festival({ b, p, t, day, season }) {
    if (season === 0) {
      b.copy(backdrop("eggs", eggHunt));
      const found = Math.floor(Math.min(1, p / 0.8) * 9);
      for (let k = found; k < 9; k++) paintedEgg(b, 18 + k * 16, 62 + (k % 3) * 9, ["#ff6f9a", "#8fd3ff", "#f6cf4a", "#c79bf2"][k % 4]);
      farmer(b, Math.round(14 + Math.min(1, p / 0.8) * 128), 86, walking(t));
      counter(b, found);
    } else if (season === 1) {
      b.copy(backdrop("luau", luau));
      for (let k = 0; k < 4; k++) {
        const u = (t * 0.6 + k / 4) % 1;
        b.rect(78 + k * 4 + Math.sin(u * 6) * 2, 34 - u * 18, 2, 2, "#ffffff");
      }
      const x = Math.round(Math.min(68, 20 + p * 70));
      farmer(b, x, 80, p < 0.55 ? walking(t) : "side");
      if (p < 0.55) fish(b, x + 6, 66, "#f39a33");
    } else if (season === 2) {
      b.copy(backdrop("fair", fair));
      farmer(b, Math.round(20 + p * 50), 86, p < 0.9 ? walking(t) : "front");
      b.rect(124, 66, 4, 4, "#f6cf4a");
      counter(b, Math.floor(p * 200), "#c0392b");
    } else {
      b.copy(backdrop("ice", ice));
      farmer(b, 84, 66, p > 0.55 ? "lift" : "side");
      if (p > 0.55) fish(b, 84, 50, "#5fc8f0");
      else for (let k = 0; k < 8; k++) b.px(88 + k, 56 + k * 0.4, "#e8e8f0");
      for (let k = 0; k < 14; k++) b.px(Math.floor(noise(k, 5, 2) * W), Math.floor((noise(k, 6, 2) * H + t * 8) % H), "#ffffff");
      counter(b, Math.floor(Math.min(1, p / 0.85) * 5), "#3e6fd6");
    }
    if (p > 0.85) {
      // The prize: a gold star.
      b.rect(66, 14, 36, 34, INK);
      b.rect(67, 15, 34, 32, "#fbe3b0");
      star(b, 84, 32, 13);
      sparkle(b, 96, 20, t);
    }
    return -1;
  },
  // The beach: shells, coral and a sea urchin along the sand, each picked up and held up as she goes by.
  forage({ b, p, t }) {
    b.copy(backdrop("beach", beach));
    water(b, 0, 0, W, 30, t, { deep: "#2f8fd8", ripple: "#6ac0f0", glint: "#e8f8ff" });
    const foam = 30 + Math.round(Math.sin(t * 1.2) * 2);
    for (let i = 0; i < W; i++) b.px(i, foam + (Math.sin(i * 0.3 + t * 2) > 0.5 ? 1 : 0), "#ffffff");
    // Gulls wheeling over the water, a crab scuttling sideways along the sand.
    for (let k = 0; k < 3; k++) {
      const [gx, gy] = [((t * (8 + k * 3) + k * 60) % (W + 20)) - 10, 8 + k * 6 + Math.round(Math.sin(t * 2 + k) * 2)];
      const up = Math.sin(t * 8 + k * 2) > 0;
      b.px(gx - 2, gy + (up ? -1 : 1), "#ffffff");
      b.rect(gx - 1, gy, 3, 1, "#ffffff");
      b.px(gx + 2, gy + (up ? -1 : 1), "#ffffff");
    }
    const cx = 70 + Math.round(Math.sin(t * 0.6) * 24);
    b.draw(sprite(CRAB, { o: INK, r: "#e0503a", R: "#a83020", e: "#1b1b22" }), cx - 4, 74 - (Math.floor(t * 8) % 2));
    const THINGS = ["#f7b8cc", "#e0605a", "#9b59d0", "#fff1c9", "#f39a33"];
    const x = 8 + p * 150;
    let held = -1;
    THINGS.forEach((c, k) => {
      const tx = 22 + k * 30;
      if (tx > x) shell(b, tx, 62 + (k % 2) * 10, c);
      else if (x - tx < 8) held = k;
    });
    if (held >= 0) {
      farmer(b, Math.round(x), 84, "lift");
      shell(b, Math.round(x), 66, THINGS[held]);
      sparkle(b, Math.round(x) + 6, 60, t);
    } else farmer(b, Math.round(x), 84, walking(t));
    return -1;
  },
};

// A festival egg at (x, y), its foot: `c` with a white band round it.
function paintedEgg(b, x, y, c) {
  b.rect(x - 2, y - 8, 5, 1, INK);
  b.rect(x - 3, y - 7, 7, 6, INK);
  b.rect(x - 2, y - 1, 5, 1, INK);
  b.rect(x - 2, y - 7, 5, 6, c);
  b.rect(x - 2, y - 4, 5, 1, "#ffffff");
  b.px(x - 1, y - 6, "#ffffff");
}

const CRAB = ["o.o..o.o", "oro..oro", ".oeooeo.", "orrrrrro", "oRrrrrRo", ".o.oo.o."];

// A shell (or coral, or an urchin: the colour) on the sand at (x, y).
function shell(b, x, y, c) {
  b.rect(x - 3, y - 4, 7, 5, INK);
  b.rect(x - 2, y - 5, 5, 1, INK);
  b.rect(x - 2, y - 4, 5, 4, c);
  b.px(x - 1, y - 3, "#ffffff");
  b.px(x + 1, y - 2, INK);
}

// The beach: the sand, wet and darker at the water's edge; driftwood, a rock pool among boulders, seaweed
// washed up, a palm leaning over at the right, footprints.
function beach(b) {
  sand(b, 0, 30, W, H - 30, 61);
  b.tint(0, 31, W, 6, "#a88850", 0.35);
  for (let i = 0; i < W; i += 1) b.px(i, 31 + (noise(i, 1, 62) < 0.4 ? 1 : 0), "#d8bc70");
  b.rect(98, 86, 22, 4, INK);
  b.rect(99, 86, 20, 3, "#a8845a");
  b.rect(99, 86, 20, 1, "#c8a47a");
  // The rock pool.
  const BOULDERS = [
    [18, 52, 6],
    [30, 48, 5],
    [8, 60, 5],
    [34, 58, 4],
  ];
  for (const pass of [0, 1])
    for (const [x, y, r] of BOULDERS)
      for (let j = -r; j <= 0; j++) {
        const half = Math.round(Math.sqrt(r * r - j * j) * 1.3);
        if (pass === 0) b.rect(x - half - 1, y + j - 1, 2 * half + 2, 3, INK);
        else b.rect(x - half, y + j, 2 * half, 1, j < -r * 0.6 ? "#c8c8d0" : j < -r * 0.25 ? "#a8a8b4" : "#7a7a86");
      }
  b.rect(14, 54, 18, 6, INK);
  b.rect(15, 55, 16, 4, "#4a9ad8");
  b.rect(16, 55, 5, 1, "#a8dcf8");
  b.px(26, 57, "#f39a33"); // a starfish in it
  b.px(25, 57, "#f39a33");
  b.px(26, 56, "#f39a33");
  // Seaweed along the tideline.
  for (let k = 0; k < 7; k++) {
    const x = 50 + k * 15 + Math.floor(noise(k, 2, 63) * 8);
    b.rect(x, 39, 4, 1, "#3a7a4a");
    b.rect(x + 1, 38, 2, 1, "#5a9a5a");
  }
  // The palm.
  for (let k = 0; k < 40; k++) {
    const x = 150 - Math.round((k / 40) ** 2 * 14);
    b.rect(x - 2, H - k * 1.6, 5, 2, INK);
    b.rect(x - 1, H - k * 1.6, 3, 2, k % 4 < 2 ? "#a8743a" : "#8a5a34");
  }
  // Its fronds, arching out and drooping at the tips: all their outlines first, then the leaves over them.
  const [px, py] = [136, 30];
  const along = (a, r) => {
    const ang = -Math.PI + (a / 6) * Math.PI;
    return [px + Math.cos(ang) * r * 1.1, py + Math.sin(ang) * r * 0.55 + (r * r) / 28];
  };
  for (const pass of [0, 1])
    for (let a = 0; a < 7; a++)
      for (let r = 2; r < 19; r++) {
        const [x, y] = along(a, r);
        const wide = r < 15 ? 2 : 1;
        if (pass === 0) b.rect(x - 1, y - 1, wide + 2, 3, INK);
        else {
          b.rect(x, y, wide, 1, r % 3 === 0 ? "#2f7a2a" : "#4fae3a");
          if (r % 2 === 0) b.px(x, y - 1, "#8ad85a");
        }
      }
  for (const [x, y] of [
    [134, 31],
    [138, 32],
  ]) {
    b.rect(x - 1, y - 1, 4, 4, INK);
    b.rect(x, y, 2, 2, "#6a4a2a");
  }
  // Footprints along the sand.
  for (let k = 0; k < 9; k++) b.rect(6 + k * 9, 88 + (k % 2) * 3, 2, 1, "#d8bc70");
}

// Spring: the meadow with blossom trees, bunting across, the eggs hidden about (drawn each frame).
function eggHunt(b) {
  lawn(b, 0, 0, W, H, 0, 71);
  for (const x of [20, 84, 148]) {
    b.rect(x - 2, 26, 4, 14, "#7a4a26");
    for (let k = 0; k < 40; k++) {
      const a = noise(k, x, 3) * Math.PI * 2;
      const r = noise(x, k, 4) * 13;
      b.rect(x + Math.cos(a) * r * 1.3 - 1, 16 + Math.sin(a) * r * 0.8, 3, 2, k % 3 ? "#f7b8cc" : "#ffffff");
    }
  }
  for (let i = 0; i < W; i++) {
    const y = 4 + Math.round(4 * Math.sin(((i % 56) / 56) * Math.PI));
    b.px(i, y, "#6b3f22");
    if (i % 7 === 0) {
      const c = ["#ff6f9a", "#f6cf4a", "#8fd3ff", "#c79bf2"][(i / 7) % 4];
      b.rect(i, y + 1, 4, 2, c);
      b.rect(i + 1, y + 3, 2, 1, c);
    }
  }
  flowers(b, 6, 90, 40, 8);
}
// Summer: the luau on the beach, the big pot over the fire, villagers about it.
function luau(b) {
  sky(b, 16, "#5ab0f0", "#bfe6fb", 0, 1);
  b.rect(0, 16, W, 14, "#2f8fd8");
  for (let i = 0; i < W; i += 5) b.rect(i, 20 + ((i / 5) % 3) * 3, 3, 1, "#6ac0f0");
  sand(b, 0, 30, W, H - 30, 72);
  for (let i = 0; i < W; i++) b.px(i, 30, "#ffffff");
  for (const x of [10, 150]) {
    b.rect(x, 30, 3, 40, "#8a5a34");
    for (let k = -3; k <= 3; k++) b.rect(x + 1 + k * 3, 28 + Math.abs(k), 3, 2, "#3a8a2a");
  }
  b.rect(70, 50, 28, 20, INK);
  b.rect(71, 51, 26, 18, "#3a3a44");
  b.rect(73, 48, 22, 4, "#c89a5a");
  b.rect(74, 70, 20, 3, "#e0602e");
  [
    [110, 74],
    [128, 70],
    [40, 66],
  ].forEach(([x, y], k) => villager(b, x, y, FOLK[k + 1]));
}
// Autumn: the fair's stalls with striped awnings, the grange display, the strength game.
function fair(b) {
  lawn(b, 0, 0, W, H, 2, 81);
  [
    [6, "#e0402e"],
    [60, "#3e6fd6"],
    [114, "#5fb03a"],
  ].forEach(([x, c]) => {
    b.rect(x - 1, 9, 48, 34, INK);
    for (let i = 0; i < 46; i += 6) b.rect(x + i, 10, 3, 9, c);
    for (let i = 3; i < 46; i += 6) b.rect(x + i, 10, 3, 9, "#ffffff");
    b.rect(x, 19, 46, 2, INK);
    b.rect(x, 21, 46, 20, "#c8823f");
    b.rect(x, 21, 46, 1, "#e0a35a");
    for (let k = 0; k < 5; k++) b.rect(x + 4 + k * 8, 24, 5, 4, ["#f39a33", "#e0402e", "#f6cf4a", "#9b59d0", "#5fb03a"][(k + x) % 5]);
  });
  villager(b, 30, 58, FOLK[3]);
  villager(b, 140, 60, FOLK[1]);
  // The strength game: the tower and its bell.
  b.rect(120, 46, 6, 24, INK);
  b.rect(121, 47, 4, 22, "#fbf6ec");
  b.rect(119, 42, 8, 5, "#f6cf4a");
  b.rect(116, 70, 14, 4, "#8a5228");
}
// Winter: snow, the frozen lake with its fishing holes, villagers at theirs.
function ice(b) {
  lawn(b, 0, 0, W, H, 3, 91);
  b.rect(10, 30, 148, 50, "#a8d0e8");
  b.rect(14, 34, 140, 42, "#c4e2f2");
  for (let k = 0; k < 20; k++) b.px(16 + Math.floor(noise(k, 1, 92) * 136), 36 + Math.floor(noise(k, 2, 92) * 38), "#ffffff");
  for (const [x, y] of [
    [40, 50],
    [96, 60],
    [130, 46],
  ]) {
    b.rect(x - 4, y - 2, 9, 5, INK);
    b.rect(x - 3, y - 1, 7, 3, "#2f6fb0");
  }
  villager(b, 32, 48, FOLK[0]);
  villager(b, 122, 44, FOLK[4]);
  pine(b, 6, 40, 3);
  pine(b, 160, 90, 3);
}
