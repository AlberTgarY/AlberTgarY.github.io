/*******************************************************************************
 * Her cosy farm game on his computer: a whole day on the farm, scene by scene
 * (up in the farmhouse, watering, the harvest, the animals, fishing, the mine,
 * a gift in town, the shipping bin, the evening, and to bed), through the four
 * seasons; and the side screen meanwhile (the date, the clock, her energy).
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number } from "./pen.js";

// The day, scene by scene: [name, seconds, what she makes of it (acts/pc.js), how far into the scene].
const SCENES = [
  ["wake", 8],
  ["water", 14],
  ["harvest", 14, "sparkle", 0.3],
  ["animals", 12, "heart", 0.55],
  ["fish", 16, "star", 0.88],
  ["mine", 14, "star", 0.82],
  ["town", 13, "heart", 0.65],
  ["ship", 9],
  ["evening", 12, "note", 0.3],
  ["sleep", 8],
];
const DAY = SCENES.reduce((sum, [, secs]) => sum + secs, 0);

// The day she is on, `e` seconds into playing: her save loads on the morning of a day picked by `seed` (the
// same when she comes back to it after being called away, so she plays on from where she was).
export const farmDay = (e, seed) => Math.floor(hash(seed, 7, 23) * 56) + e / DAY;

// The scene `clock` (farmDay) is in, and how far through it (0-1).
function sceneAt(clock) {
  let s = (clock % 1) * DAY;
  for (const [i, [, secs]] of SCENES.entries()) {
    if (s < secs) return [i, s / secs];
    s -= secs;
  }
  return [SCENES.length - 1, 1];
}

const festival = (day) => day % 7 === 3; // an evening of lanterns and fireworks

// What she has to be pleased about just now: `beat` counts the scenes on, `mood` comes at the scene's moment
// (the fish landed, a gift taken) and is null before it.
export function stardewMoment(e, seed) {
  const clock = farmDay(e, seed);
  const [i, p] = sceneAt(clock);
  const [name, , mood = null, at = 0] = SCENES[i];
  const due = mood && p >= at && (name !== "evening" || festival(Math.floor(clock)));
  return { beat: Math.floor(clock) * SCENES.length + i, mood: due ? mood : null };
}

// Spring, summer, autumn and winter: the grass, the sky, and the three rows' crops when ripe (none in winter).
const SEASONS = [
  { grass: "#7ec85a", sky: "#8fd0f5", crops: ["#f28aa8", "#fff1c9", "#e0402e"] },
  { grass: "#5fb03a", sky: "#7cc8f5", crops: ["#e0402e", "#f6cf4a", "#9b59d0"] },
  { grass: "#c8a050", sky: "#a8c8e0", crops: ["#f39a33", "#e0c03a", "#c0392b"] },
  { grass: "#e8f0f4", sky: "#c8d8e8", crops: null },
];
const TOOLS = ["#3e8fd6", "#8a8f97", "#c79bf2", "#e0402e", "#8a5a34", "#f6cf4a", "#e05aa0", "#7fe07a"]; // the hotbar
const VILLAGERS = ["#5e3624", "#e0602e", "#2b2522", "#9b59d0", "#f2c14e"];

// Her farmer (straw hat, pink shirt, blue dungarees), feet on row y; anything held up over her head.
function farmer(rect, x, y, held = null) {
  rect(x - 1, y - 4, 4, 1, "#f2d27a");
  rect(x, y - 3, 2, 1, "#f9d6bd");
  rect(x, y - 2, 2, 1, "#f28aa8");
  rect(x, y - 1, 2, 1, "#3e6fd6");
  if (held) rect(x, y - 6, 2, 2, held);
}

function sparkle(px, x, y, t) {
  for (let k = 0; k < 4; k++) if (Math.sin(t * 9 + k * 1.7) > 0.2) px(x + [-2, 3, -1, 2][k], y + [-1, 0, 2, 1][k], "#fff6c9");
}

function heart(rect, px, x, y) {
  px(x, y, "#ff6f9a");
  px(x + 2, y, "#ff6f9a");
  rect(x, y + 1, 3, 1, "#ff6f9a");
  px(x + 1, y + 2, "#ff6f9a");
}

// The field: a fence along the top and three tilled rows of seven plants each.
const ROW_Y = [5, 8, 11];
const PLANT_X = [3, 6, 9, 12, 15, 18, 21];
function field(rect, grass) {
  rect(0, 0, 26, 14, grass);
  rect(0, 1, 26, 1, "#c48a4a");
  for (let x = 1; x < 26; x += 4) rect(x, 0, 1, 3, "#9a6a3a");
  for (const y of ROW_Y) rect(2, y, 22, 2, "#8a5a34");
}

// The game on his monitor, `w` by `h`: the scene of the day `e` seconds into her playing (farmDay).
export function drawStardew(g, w, h, t, e, seed) {
  const { rect, px } = pen(g);
  const clock = farmDay(e, seed);
  const day = Math.floor(clock);
  const season = SEASONS[Math.floor(day / 28) % 4];
  const [i, p] = sceneAt(clock);
  const scene = SCENES[i][0];
  let tool = -1;
  rect(0, 0, w, h, "#1b1b22"); // the scenes fill all but the bottom row, the hotbar's when a tool is out
  if (scene === "wake" || scene === "sleep") {
    // The farmhouse: the bed, the window, the calendar, the door; up at sunrise and off out of the door, or in
    // bed at night, Zzz, and then the day's takings.
    const night = scene === "sleep";
    rect(0, 0, w, 9, night ? "#5a4a62" : "#e8c89a");
    rect(0, 9, w, 5, night ? "#4a3a3a" : "#b07a4a");
    for (let x = 2; x < w; x += 6) rect(x, 9, 1, 5, night ? "#3e3030" : "#9a6a3a");
    rect(11, 2, 5, 4, night ? "#1f2a4a" : p < 0.5 ? "#f6b26b" : season.sky);
    rect(13, 2, 1, 4, "#8a5a34");
    rect(5, 2, 3, 3, "#fff8ef");
    px(6, 3, "#e0402e");
    rect(22, 4, 3, 5, "#8a5a34");
    rect(2, 8, 7, 3, "#c0392b");
    rect(2, 8, 2, 1, "#fff8ef");
    if (night || p < 0.35) {
      rect(2, 7, 2, 1, "#f9d6bd"); // her head on the pillow
      if (night) for (let k = 0; k < 3; k++) px(5 + k * 2, Math.round(5 - ((t * 1.5 + k) % 3)), "#fff8ef");
    } else farmer(rect, Math.round(9 + ((p - 0.35) / 0.65) * 12), 13);
    if (night && p > 0.6) {
      rect(0, 0, w, h, "#141018");
      for (let k = 0; k < 3; k++) rect(5, 3 + k * 3, 6 + ((day + k) % 3) * 3, 1, "#f2f2f2");
      number(px, 100 + ((day * 37) % 900), 14, 9, "#f6cf4a");
      return;
    }
  } else if (scene === "water" || scene === "harvest") {
    // Along each row in turn: watering (the soil dark behind her; the plants a stage up from yesterday), or
    // picking every ripe one (held up now and then, with a sparkle).
    const crops = season.crops;
    const row = Math.min(2, Math.floor(p * 3));
    const along = 2 + ((p * 3) % 1) * 21;
    const done = (r, x) => r < row || (r === row && x < along);
    field(rect, season.grass);
    if (scene === "water") {
      tool = 0;
      ROW_Y.forEach((y, r) => rect(2, y, r < row ? 22 : r === row ? along - 2 : 0, 2, "#6b4429"));
      const stage = ["#d9b98a", "#9fe07a", "#5bb046"][day % 3];
      if (crops) for (const y of ROW_Y) for (const x of PLANT_X) px(x, y, stage);
      if (Math.sin(t * 8) > 0) px(Math.round(along) + 2, ROW_Y[row] + 1, "#8fd3ff");
      farmer(rect, Math.round(along), ROW_Y[row] + 1);
    } else {
      tool = 3;
      if (crops)
        ROW_Y.forEach((y, r) => {
          for (const x of PLANT_X)
            if (!done(r, x)) {
              px(x, y - 1, "#5bb046");
              px(x, y, crops[r]);
            }
        });
      const showing = crops && (p * 7) % 1 < 0.35;
      farmer(rect, Math.round(along), ROW_Y[row] + 1, showing ? crops[row] : null);
      if (showing) sparkle(px, Math.round(along), ROW_Y[row] - 5, t);
    }
  } else if (scene === "animals") {
    // The barn, the chickens pecking about; over to the cow for a pat, and a heart.
    tool = 4;
    rect(0, 0, w, 14, season.grass);
    rect(0, 3, w, 1, "#c48a4a");
    rect(18, 3, 7, 7, "#c0392b");
    rect(17, 2, 9, 2, "#7a2a1f");
    rect(20, 6, 3, 4, "#5c3a26");
    for (let k = 0; k < 3; k++) {
      const cx = 2 + k * 5 + Math.round(2 * Math.sin(t * 0.7 + k * 2));
      const peck = Math.sin(t * 5 + k) > 0.6 ? 1 : 0;
      rect(cx, 12, 2, 1, "#ffffff");
      px(cx + 1, 11 + peck, "#e0402e");
    }
    rect(7, 7, 5, 3, "#ffffff");
    px(8, 8, "#2b2522");
    px(10, 7, "#2b2522");
    rect(12, 7, 2, 2, "#ffffff");
    px(13, 8, "#f7a1b5");
    for (const x of [7, 11]) px(x, 10, "#2b2522");
    farmer(rect, Math.round(Math.min(14, 1 + (p / 0.5) * 13)), 11);
    if (p > 0.55) heart(rect, px, 9, Math.round(5 - (p - 0.55) * 8));
  } else if (scene === "fish") {
    // Out on the dock, the line out to the bobber; a bite ("!"), the fishing bar, and the fish held up.
    tool = 1;
    rect(0, 0, w, 7, season.sky);
    rect(0, 5, w, 2, season.grass);
    rect(0, 7, w, 7, "#3e8fd6");
    for (let k = 0; k < 6; k++) rect((k * 5 + t * 3) % w, 9 + (k % 3) * 2, 2, 1, "#8fc8f0");
    rect(0, 8, 9, 1, "#8a5a34");
    for (const x of [1, 7]) rect(x, 9, 1, 3, "#6b4429");
    const bite = p > 0.55;
    const bob = bite ? Math.round(Math.sin(t * 14)) : Math.round(Math.sin(t * 2) * 0.6);
    for (let k = 0; k <= 8; k++) px(7 + k, 4 + Math.round((k * k) / 14), "#d8d8e0");
    px(16, 9 + bob, "#e0402e");
    px(16, 8 + bob, "#ffffff");
    farmer(rect, 5, 8, p >= 0.88 ? "#f39a33" : null);
    if (bite && p < 0.62 && Math.sin(t * 10) > -0.5) rect(5, 0, 1, 2, "#f6cf4a");
    if (p > 0.62 && p < 0.88) {
      rect(22, 1, 3, 12, "#5c3a26");
      rect(23, 2, 1, 10, "#3e8fd6");
      rect(23, 2 + Math.round(3.5 + 3.5 * Math.sin(t * 3)), 1, 3, "#7fe07a");
      px(23, 2 + Math.round(4.5 + 4.5 * Math.sin(t * 4.3 + 1)), "#f39a33");
    }
    if (p >= 0.88) sparkle(px, 5, 2, t);
  } else if (scene === "mine") {
    // Down the mine (the floor number in the corner): rocks broken one by one, a ladder down, and a gem.
    tool = 2;
    rect(0, 0, w, 14, "#3a2e2a");
    for (let k = 0; k < 14; k++) px(Math.floor(hash(k, day, 3) * w), Math.floor(hash(day, k, 4) * 13), "#4a3c36");
    number(px, 1 + ((day * 3) % 119), 1, 1, "#f2d27a");
    const ROCKS = [
      [6, 11],
      [10, 8],
      [15, 12],
      [19, 8],
      [22, 11],
    ];
    const broken = Math.floor(Math.min(1, p / 0.8) * ROCKS.length);
    ROCKS.forEach(([x, y], k) => {
      if (k < broken) return;
      rect(x, y, 3, 2, "#8a8f97");
      px(x + 1, y, k % 2 ? "#f39a33" : "#5fe0e0");
    });
    if (p > 0.6) {
      rect(13, 2, 2, 4, "#8a5a34");
      px(13, 3, "#c48a4a");
      px(13, 5, "#c48a4a");
    }
    const [rx, ry] = ROCKS[Math.min(broken, ROCKS.length - 1)];
    const gem = p > 0.82;
    farmer(rect, rx - 3, ry + 2, gem ? "#c79bf2" : null);
    if (!gem && Math.sin(t * 10) > 0) px(rx - 1, ry - 1, "#c8ccd4"); // the pickaxe coming down
    if (gem) sparkle(px, rx - 3, ry - 4, t);
  } else if (scene === "town") {
    // Into town: the houses, the square; a gift for a villager, a heart, and one more on their row of hearts.
    tool = 6;
    rect(0, 0, w, 7, season.sky);
    [
      [1, "#f2e3c4", "#c0392b"],
      [9, "#cdeafa", "#3e6fd6"],
      [17, "#f6d79a", "#5fb03a"],
    ].forEach(([x, wall, roof]) => {
      rect(x, 3, 7, 5, wall);
      rect(x - 1, 2, 9, 2, roof);
      rect(x + 3, 5, 2, 3, "#8a5a34");
    });
    rect(0, 8, w, 6, "#cdb894");
    for (let x = 0; x < w; x += 3) px(x, 10 + (x % 2), "#b8a07a");
    const friend = VILLAGERS[day % VILLAGERS.length];
    rect(18, 8, 2, 1, friend);
    rect(18, 9, 2, 1, "#f9d6bd");
    rect(18, 10, 2, 2, "#7a8a9a");
    const fx = Math.round(Math.min(14, 2 + (p / 0.6) * 12));
    farmer(rect, fx, 12);
    if (p > 0.6 && p < 0.68) {
      rect(fx + 2, 9, 2, 2, "#e05aa0");
      px(fx + 2, 9, "#f6cf4a");
    }
    const hearts = 1 + (day % 5) + (p > 0.65 ? 1 : 0);
    for (let k = 0; k < 6; k++) px(1 + k * 2, 13, k < hearts ? "#ff6f9a" : "#8a7a6a");
    if (p > 0.65) heart(rect, px, 18, Math.round(6 - (p - 0.65) * 12));
  } else if (scene === "ship") {
    // The day's crops into the shipping bin by the house, and the gold counting up.
    tool = 7;
    rect(0, 0, w, 14, season.grass);
    rect(0, 2, 9, 8, "#c48a4a");
    rect(0, 1, 10, 2, "#7a2a1f");
    rect(12, 9, 6, 3, "#8a5a34");
    rect(12, 8, 6, 1, "#6b4429");
    farmer(rect, 9, 12);
    const toss = (p * 4) % 1;
    if (season.crops) px(Math.round(11 + toss * 3), Math.round(7 - Math.sin(toss * Math.PI) * 4), season.crops[Math.floor(p * 4) % 3]);
    number(px, 100 + ((day * 37) % 800) + Math.floor(p * 90), 14, 1, "#f6cf4a");
    px(12, 3, "#f6cf4a");
  } else if (scene === "evening") {
    // Sunset over the farm; on festival nights lanterns rise and fireworks go up, else the fireflies come out.
    ["#f39a33", "#f28aa8", "#9b6bc0", "#4a3a7a"].forEach((c, k) => rect(0, k * 2, w, 2, c));
    px(19, Math.round(3 + p * 4), "#fff1a8");
    rect(0, 8, w, 6, "#2f4a3a");
    rect(3, 5, 6, 4, "#3a2e2a");
    rect(2, 4, 8, 1, "#2a2020");
    px(5, 7, "#f6cf4a");
    farmer(rect, 14, 12);
    if (festival(day)) {
      for (let k = 0; k < 5; k++) px((k * 5 + 2) % w, Math.round(12 - ((t * 2 + k * 3) % 12)), "#f39a33");
      const burst = Math.floor(t * 1.2);
      const [bx, by] = [4 + Math.floor(hash(burst, 1, 8) * 18), 2 + Math.floor(hash(burst, 2, 8) * 2)];
      const r = 1 + ((t * 1.2) % 1) * 2;
      for (let a = 0; a < 6; a++)
        px(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), ["#ff6f9a", "#f6cf4a", "#8fd3ff"][burst % 3]);
    } else for (let k = 0; k < 5; k++) if (Math.sin(t * 3 + k * 2) > 0.3) px((k * 6 + 3) % w, 9 + (k % 3), "#e8f07a");
  }
  if (tool >= 0) {
    rect(4, 14, 18, 1, "#5c3a26");
    TOOLS.forEach((c, k) => px(5 + k * 2, 14, c));
    px(5 + tool * 2, 13, "#ffffff");
  }
}

// The side screen while she plays, `w` by `h` on end: the day of the season (on the season's colour), the
// time of day, and her energy running down till she sleeps.
export function drawFarmSide(g, w, h, e, seed) {
  const { rect, px } = pen(g);
  const clock = farmDay(e, seed);
  const day = Math.floor(clock);
  const hour = clock % 1;
  rect(0, 0, w, h, SEASONS[Math.floor(day / 28) % 4].grass);
  rect(0, 0, w, 10, "#8a5a34");
  rect(1, 1, w - 2, 8, "#f6d79a");
  const date = (day % 28) + 1;
  number(px, date, date < 10 ? 4 : 2, 2, "#5c3a26");
  rect(2, 8, 7, 1, "#e8c27a");
  rect(2, 8, Math.round(hour * 7), 1, "#e0905a");
  const full = Math.round((1 - hour * 0.8) * 9);
  rect(3, 13, 5, 11, "#8a5a34");
  rect(4, 14, 3, 9, "#3b3330");
  rect(4, 23 - full, 3, full, full > 4 ? "#7fe07a" : "#f6cf4a");
}
