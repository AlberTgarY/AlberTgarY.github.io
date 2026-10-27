/*******************************************************************************
 * Her cosy farm game on his computer: a day on the farm at a time, and never
 * the same day twice running (DAYS): a day of crops, a rainy day, a day down
 * the mine, a day with friends in town, a festival, a day with the animals and
 * a day at the beach, each opening its own way (the game loading, the morning
 * TV, or up out of bed) and played scene by scene through the four seasons;
 * and the side screen meanwhile (the clock, her gold, her energy).
 *
 * Drawn finely, 168 x 96 (as fine as the clips), in the game's own look: the
 * scenes are in stardew/farm.js and stardew/out.js, what they are drawn from
 * in stardew/art.js, the pen in stardew/kit.js.
 ******************************************************************************/

import { W, H, Bitmap, digits } from "./stardew/kit.js";
import { INK, hotbar } from "./stardew/art.js";
import { FARM, rightDigits } from "./stardew/farm.js";
import { OUT } from "./stardew/out.js";

export const STARDEW_SIZE = [W, H];
export const STARDEW_SIDE = [44, 100];

// The days she can have, scene by scene: [scene, seconds, what she makes of it (acts/pc.js), how far into
// the scene]. Each lasts DAY, and opens differently from the day before (ORDER).
const DAYS = {
  crops: [
    ["tv", 12, "note", 0.5],
    ["water", 16],
    ["harvest", 18, "sparkle", 0.3],
    ["ship", 14],
    ["evening", 20],
    ["sleep", 10],
  ],
  friends: [
    ["mail", 12, "heart", 0.6],
    ["town", 20, "heart", 0.65],
    ["heart", 24, "heart", 0.6],
    ["museum", 24, "star", 0.6],
    ["sleep", 10],
  ],
  rain: [
    ["title", 12],
    ["rainfarm", 20, "sparkle", 0.6],
    ["fish", 22, "star", 0.88],
    ["saloon", 26, "note", 0.4],
    ["sleep", 10],
  ],
  ranch: [
    ["wake", 10],
    ["animals", 20, "heart", 0.55],
    ["coop", 20, "heart", 0.5],
    ["cook", 20, "sparkle", 0.7],
    ["ship", 10],
    ["sleep", 10],
  ],
  mine: [
    ["tv", 10, "note", 0.5],
    ["mine", 20, "star", 0.82],
    ["slime", 22, "star", 0.85],
    ["geode", 28, "sparkle", 0.45],
    ["sleep", 10],
  ],
  beach: [
    ["title", 12],
    ["forage", 24, "sparkle", 0.5],
    ["fish", 22, "star", 0.88],
    ["cook", 22, "sparkle", 0.7],
    ["sleep", 10],
  ],
  festival: [
    ["mail", 12, "heart", 0.6],
    ["festival", 44, "star", 0.85],
    ["evening", 24, "note", 0.3],
    ["sleep", 10],
  ],
};
const DAY = 90;
export const FARM_DAY = DAY; // s she plays at a time: a day
// One after another (never the same kind of day twice running): the day's kind.
const ORDER = ["crops", "friends", "rain", "ranch", "mine", "beach", "festival"]; // (opening: TV, mail, title, bed, TV, title, mail)
const kindOf = (day) => ORDER[((day % ORDER.length) + ORDER.length) % ORDER.length];
export const dayKind = kindOf;

// Where she is, `e` seconds into playing `day` (her save loads on its morning): the scene, and how far into
// it (0-1).
function sceneAt(day, e) {
  const scenes = DAYS[kindOf(day)];
  let s = Math.max(0, Math.min(e, DAY - 0.01));
  for (const [i, [, secs]] of scenes.entries()) {
    if (s < secs) return [i, s / secs];
    s -= secs;
  }
  return [scenes.length - 1, 1];
}
const dayPart = (day, e) => Math.min(e, DAY - 0.01) / DAY; // how far through the day (the side screen's clock)

// What she has to be pleased about just now: `beat` counts the scenes on, `mood` comes at the scene's moment
// (the fish landed, a gift taken) and is null before it.
export function stardewMoment(e, day) {
  const [i, p] = sceneAt(day, e);
  const [, , mood = null, at = 0] = DAYS[kindOf(day)][i];
  return { beat: day * 10 + i, mood: mood && p >= at ? mood : null };
}

const seasonOf = (day) => Math.floor(day / 28) % 4; // spring, summer, autumn, winter
const SCENES = { ...FARM, ...OUT };

// One canvas's pixels, drawn into and put on it whole.
function screen(w, h) {
  const b = new Bitmap(w, h);
  return { b, image: new ImageData(new Uint8ClampedArray(b.data.buffer), w, h) };
}
let main = null;
let side = null;

// The game on his monitor (STARDEW_SIZE): the scene `e` seconds into her playing `day` (DAYS), the hotbar
// along the bottom while a tool is out.
export function drawStardew(g, t, e, day) {
  main ??= screen(W, H);
  const [i, p] = sceneAt(day, e);
  const kind = kindOf(day);
  const tool = SCENES[DAYS[kind][i][0]]({ b: main.b, p, t, day, season: seasonOf(day), rainy: kind === "rain", festival: kind === "festival" });
  if (tool >= 0) hotbar(main.b, tool, H);
  g.putImageData(main.image, 0, 0);
}

// The side screen while she plays (STARDEW_SIDE, on end), as the game's corner: the date and the dial of the
// day (the sun going over, the moon after dark), the weather and the season, the time; her gold; her energy
// running down till she sleeps.
const SEASON_COLOURS = ["#f28aa8", "#f6cf4a", "#e0802e", "#8fd3ff"];
export function drawFarmSide(g, e, day) {
  const [w, h] = STARDEW_SIDE;
  side ??= screen(w, h);
  const b = side.b;
  const part = dayPart(day, e);
  b.rect(0, 0, w, h, "#2a1e1a");
  // The clock: a wooden frame, the date at the top.
  b.rect(1, 1, w - 2, 46, INK);
  b.rect(2, 2, w - 4, 44, "#d8843a");
  b.rect(4, 4, w - 8, 12, "#fbe3b0");
  rightDigits(b, (day % 28) + 1, 38, 7, "#5c3a26");
  for (let k = 0; k < 7; k++) b.rect(6 + k * 3, 12, 2, 2, k === day % 7 ? "#c0392b" : "#d8b88a");
  // The dial: the sky's half circle, the sun or moon riding over it with the hour.
  const [cx, cy, r] = [22, 32, 12];
  for (let j = -r; j <= 0; j++)
    for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j);
      if (d > r) continue;
      b.px(cx + i, cy + j, d > r - 1.5 ? INK : part < 0.65 ? (j < -6 ? "#7cc8f5" : "#bfe6fb") : j < -6 ? "#2a3070" : "#4a4090");
    }
  b.rect(cx - r, cy + 1, 2 * r + 1, 1, INK);
  const a = Math.PI * (1 - part);
  const [sx, sy] = [cx + Math.cos(a) * (r - 4), cy - Math.sin(a) * (r - 4)];
  b.rect(sx - 1, sy - 1, 3, 3, part < 0.65 ? "#f6cf4a" : "#fff1a8");
  b.rect(cx, cy - 1, 1, 1, INK);
  // The weather and the season, small, beside the dial.
  const wet = kindOf(day) === "rain";
  b.rect(4, 19, 5, 4, wet ? "#8aa0c0" : "#f6cf4a");
  b.rect(w - 9, 19, 5, 4, SEASON_COLOURS[seasonOf(day)]);
  // The time, in steps of ten minutes from six in the morning.
  const minutes = 360 + Math.floor((part * 1200) / 10) * 10;
  const hh = Math.floor(minutes / 60) % 24;
  const time = `${hh}${String(minutes % 60).padStart(2, "0")}`;
  b.rect(4, 36, w - 8, 9, "#fbe3b0");
  digits(b, time.slice(0, -2), 22 - (time.length - 2) * 4, 38, "#5c3a26");
  b.px(22, 39, "#5c3a26");
  b.px(22, 41, "#5c3a26");
  digits(b, time.slice(-2), 24, 38, "#5c3a26");
  // Her gold.
  b.rect(1, 49, w - 2, 11, INK);
  b.rect(2, 50, w - 4, 9, "#d8843a");
  b.rect(4, 51, w - 8, 7, "#5c3a26");
  b.rect(6, 53, 3, 3, "#f6cf4a");
  rightDigits(b, 500 + ((day * 37) % 4000) + Math.floor(part * 300), 38, 52, "#f6cf4a");
  // Her energy: the bar on end, green going yellow, then red, as the day wears on.
  const full = 1 - part * 0.85;
  b.rect(28, 63, 12, 36, INK);
  b.rect(29, 64, 10, 34, "#d8843a");
  b.rect(31, 69, 6, 27, "#3a2a2a");
  const n = Math.round(full * 27);
  b.rect(31, 96 - n, 6, n, full > 0.5 ? "#7fe07a" : full > 0.25 ? "#f6cf4a" : "#e0402e");
  b.rect(31, 96 - n, 2, n, full > 0.5 ? "#b8f8a8" : "#fff1a8");
  b.rect(31, 65, 1, 3, "#5c3a26"); // an "E" over it
  b.rect(31, 65, 3, 1, "#5c3a26");
  b.rect(31, 66, 2, 1, "#5c3a26");
  b.rect(31, 67, 3, 1, "#5c3a26");
  g.putImageData(side.image, 0, 0);
}
