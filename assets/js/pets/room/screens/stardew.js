/*******************************************************************************
 * Her cosy farm game on his computer: a day on the farm at a time, and never
 * the same day twice running (DAYS): a day of crops, a rainy day, a day down
 * the mine, a day with friends in town, a festival, a day with the animals and
 * a day at the beach, each opening its own way (the game loading, the morning
 * TV, or up out of bed) and played scene by scene through the four seasons;
 * and the side screen meanwhile (the date, the clock, her energy).
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number } from "./pen.js";

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

// Spring, summer, autumn and winter: the grass, the sky, and the three rows' crops when ripe (none in winter).
const SEASONS = [
  { grass: "#7ec85a", sky: "#8fd0f5", crops: ["#f28aa8", "#fff1c9", "#e0402e"] },
  { grass: "#5fb03a", sky: "#7cc8f5", crops: ["#e0402e", "#f6cf4a", "#9b59d0"] },
  { grass: "#c8a050", sky: "#a8c8e0", crops: ["#f39a33", "#e0c03a", "#c0392b"] },
  { grass: "#e8f0f4", sky: "#c8d8e8", crops: null },
];
const seasonOf = (day) => Math.floor(day / 28) % 4;
const TOOLS = ["#3e8fd6", "#8a8f97", "#c79bf2", "#e0402e", "#8a5a34", "#f6cf4a", "#e05aa0", "#7fe07a"]; // the hotbar
const VILLAGERS = ["#5e3624", "#e0602e", "#2b2522", "#9b59d0", "#f2c14e"];
const GEMS = ["#c79bf2", "#5fe0a0", "#5fc8f0", "#f0605a", "#f6cf4a"];

// Her farmer (straw hat, pink shirt, blue dungarees; a yellow raincoat in the rain), feet on row y; anything
// held up over her head.
function farmer(rect, x, y, held = null, coat = false) {
  rect(x - 1, y - 4, 4, 1, coat ? "#f6cf4a" : "#f2d27a");
  rect(x, y - 3, 2, 1, "#f9d6bd");
  rect(x, y - 2, 2, 1, coat ? "#f6cf4a" : "#f28aa8");
  rect(x, y - 1, 2, 1, coat ? "#e0b030" : "#3e6fd6");
  if (held) rect(x, y - 6, 2, 2, held);
}
// A villager: hair `hair`, feet on row y.
function villager(rect, x, y, hair, clothes = "#7a8a9a") {
  rect(x, y - 4, 2, 1, hair);
  rect(x, y - 3, 2, 1, "#f9d6bd");
  rect(x, y - 2, 2, 2, clothes);
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

function rainOver(px, t, n = 14) {
  for (let k = 0; k < n; k++) px((k * 7 + 3) % 26, Math.floor((k * 5 + t * 18) % 14), "#cdd8f0");
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

// Inside the farmhouse: the wall, the floor, the window, the calendar, the door, the bed.
function farmhouse(rect, px, night, sky) {
  rect(0, 0, 26, 9, night ? "#5a4a62" : "#e8c89a");
  rect(0, 9, 26, 5, night ? "#4a3a3a" : "#b07a4a");
  for (let x = 2; x < 26; x += 6) rect(x, 9, 1, 5, night ? "#3e3030" : "#9a6a3a");
  rect(11, 2, 5, 4, sky);
  rect(13, 2, 1, 4, "#8a5a34");
  rect(5, 2, 3, 3, "#fff8ef");
  px(6, 3, "#e0402e");
  rect(22, 4, 3, 5, "#8a5a34");
  rect(2, 8, 7, 3, "#c0392b");
  rect(2, 8, 2, 1, "#fff8ef");
}

// Each scene, `p` into it: what is on the screen, and the tool out on the hotbar (-1: the hotbar hidden).
const SCENES = {
  // Up at sunrise and off out of the door.
  wake({ rect, px, p, season }) {
    farmhouse(rect, px, false, p < 0.5 ? "#f6b26b" : season.sky);
    if (p < 0.35) rect(2, 7, 2, 1, "#f9d6bd"); // her head on the pillow
    else farmer(rect, Math.round(9 + ((p - 0.35) / 0.65) * 12), 13);
    return -1;
  },
  // In bed at night, Zzz, and then the day's takings.
  sleep({ rect, px, p, t, day }) {
    farmhouse(rect, px, true, "#1f2a4a");
    rect(2, 7, 2, 1, "#f9d6bd");
    for (let k = 0; k < 3; k++) px(5 + k * 2, Math.round(5 - ((t * 1.5 + k) % 3)), "#fff8ef");
    if (p > 0.6) {
      rect(0, 0, 26, 15, "#141018");
      for (let k = 0; k < 3; k++) rect(5, 3 + k * 3, 6 + ((day + k) % 3) * 3, 1, "#f2f2f2");
      number(px, 100 + ((day * 37) % 900), 14, 9, "#f6cf4a");
    }
    return -1;
  },
  // The game loading: the title over the valley (clouds drifting, a hen), then the load bar filling.
  title({ rect, px, p, t, day }) {
    ["#8fd0f5", "#a8dcf8", "#c4e8fa"].forEach((c, k) => rect(0, k * 3, 26, 3, c));
    for (let k = 0; k < 3; k++) rect(Math.round((k * 11 + t * 2) % 34) - 6, 1 + k * 3, 6, 1, "#ffffff");
    rect(0, 9, 26, 6, "#7ec85a");
    rect(0, 9, 26, 1, "#5fb03a");
    rect(5, 2, 16, 5, "#8a5a34");
    rect(6, 3, 14, 3, "#f2d27a");
    for (let k = 0; k < 6; k++) rect(7 + k * 2, 4, 1, 1 + ((k + 1) % 2), "#5c3a26");
    farmer(rect, 4, 13);
    rect(20, 12, 2, 1, "#ffffff");
    px(21, 11 + (Math.sin(t * 5) > 0.6 ? 1 : 0), "#e0402e");
    if (p > 0.45) {
      rect(8, 10, 10, 3, "#5c3a26");
      rect(9, 11, Math.round(Math.min(1, (p - 0.45) / 0.45) * 8), 1, "#7fe07a");
    }
    if (p > 0.92) rect(0, 0, 26, 15, "#000000");
    return -1;
  },
  // Out to the mailbox, its flag up: a letter (from a friend, or the festival's invitation), opened and read.
  mail({ rect, px, p, t, season }) {
    rect(0, 0, 26, 14, season.grass);
    rect(0, 0, 12, 7, "#c48a4a");
    rect(0, 0, 13, 2, "#7a2a1f");
    rect(4, 3, 3, 4, "#8a5a34");
    rect(16, 6, 1, 6, "#6b4429");
    rect(14, 4, 5, 3, "#5a7ab0");
    if (p < 0.35) rect(19, 3, 1, 2, "#e0402e");
    farmer(rect, Math.round(Math.min(12, 6 + (p / 0.3) * 6)), 13);
    if (p > 0.35) {
      rect(5, 1, 16, 12, "#fff8ef");
      rect(5, 1, 16, 1, "#d8c8b0");
      const lines = Math.floor(Math.min(1, (p - 0.4) / 0.4) * 4);
      for (let k = 0; k < lines; k++) rect(7, 3 + k * 2, 9 + ((k * 5) % 4), 1, "#9aa0b8");
      if (p > 0.6) heart(rect, px, 16, 10);
    }
    return -1;
  },
  // The morning TV: the weather (sun, rain or snow for tomorrow) or the fortune teller, from the chair.
  tv({ rect, px, p, t, day, season }) {
    farmhouse(rect, px, false, season.sky);
    rect(15, 5, 7, 5, "#3a3a40");
    rect(16, 6, 5, 3, "#1b1b22");
    rect(17, 10, 3, 1, "#5c3a26");
    if (p > 0.15) {
      if (day % 2) {
        rect(16, 6, 5, 3, "#4a2a6a");
        rect(18, 6, 1, 1, "#9b59d0");
        rect(17, 7, 3, 2, "#c79bf2");
        if (Math.sin(t * 6) > 0) px(16, 6, "#fff6c9");
      } else {
        rect(16, 6, 5, 3, "#8fd0f5");
        const sky = seasonOf(day) === 3 ? "#ffffff" : (day >> 1) % 3 === 0 ? "#3e6fd6" : "#f6cf4a";
        rect(17, 7, 2, 1, sky);
        if (sky !== "#f6cf4a") px(18 + Math.round(Math.sin(t * 4)), 8, sky);
        else rect(17, 6, 2, 2, sky);
      }
    }
    farmer(rect, 10, 13);
    rect(8, 12, 6, 2, "#9a6a3a");
    return -1;
  },
  // Along each row in turn: watering (the soil dark behind her; the plants a stage up from yesterday), or
  // picking every ripe one (held up now and then, with a sparkle).
  water({ rect, px, p, t, day, season }) {
    return rows(rect, px, p, t, day, season, true);
  },
  harvest({ rect, px, p, t, day, season }) {
    return rows(rect, px, p, t, day, season, false);
  },
  // The rain does the watering: she goes along checking the crops in her raincoat, and picks the first
  // ripe one; a frog in a puddle.
  rainfarm({ rect, px, p, t, day, season }) {
    field(rect, "#4f8a3a");
    for (const y of ROW_Y) rect(2, y, 22, 2, "#4a2e1c");
    const crops = season.crops || ["#c8d8e8", "#c8d8e8", "#c8d8e8"];
    ROW_Y.forEach((y, r) => PLANT_X.forEach((x) => (px(x, y - 1, "#3f8a3a"), px(x, y, crops[r]))));
    rect(1, 12, 3, 1, "#6a8ab0");
    px(2, 11 + (Math.sin(t * 3) > 0.7 ? 0 : 1), "#5fb03a");
    const x = Math.round(2 + p * 20);
    farmer(rect, x, 13, p > 0.6 && p < 0.85 ? crops[2] : null, true);
    if (p > 0.6 && p < 0.85) sparkle(px, x, 6, t);
    rainOver(px, t);
    return 3;
  },
  // The barn, the chickens pecking about; over to the cow for a pat, and a heart.
  animals({ rect, px, p, t, season }) {
    rect(0, 0, 26, 14, season.grass);
    rect(0, 3, 26, 1, "#c48a4a");
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
    return 4;
  },
  // In the coop: the hens on their nests, an egg under each as she goes along, into her basket (the count).
  coop({ rect, px, p, t }) {
    rect(0, 0, 26, 14, "#c89a6a");
    for (let x = 0; x < 26; x += 5) rect(x, 0, 1, 14, "#a87a4a");
    rect(0, 10, 26, 4, "#e8c870");
    for (let k = 0; k < 8; k++) px(Math.floor(hash(k, 3, 5) * 26), 10 + (k % 4), "#c8a050");
    const along = 2 + p * 20;
    [3, 9, 15, 21].forEach((x, k) => {
      rect(x, 6, 4, 2, "#a0703a");
      const egg = x + 2 > along;
      rect(x + 1, 4, 2, 2, "#ffffff");
      px(x + 2, 3 + (Math.sin(t * 4 + k) > 0.8 ? 1 : 0), "#e0402e");
      if (!egg) return;
      px(x + 1, 6, k % 2 ? "#f6e8c8" : "#ffffff");
    });
    farmer(rect, Math.round(along), 13, (p * 4) % 1 < 0.3 ? "#ffffff" : null);
    number(px, Math.min(4, Math.floor(p * 4.5)), 22, 0, "#5c3a26");
    if (p > 0.5) heart(rect, px, 12, Math.round(2 - (p - 0.5) * 4));
    return -1;
  },
  // Out on the dock, the line out to the bobber; a bite ("!"), the fishing bar, and the fish held up.
  fish({ rect, px, p, t, season, rain }) {
    rect(0, 0, 26, 7, rain ? "#8a9cc0" : season.sky);
    rect(0, 5, 26, 2, season.grass);
    rect(0, 7, 26, 7, "#3e8fd6");
    for (let k = 0; k < 6; k++) rect((k * 5 + t * 3) % 26, 9 + (k % 3) * 2, 2, 1, "#8fc8f0");
    rect(0, 8, 9, 1, "#8a5a34");
    for (const x of [1, 7]) rect(x, 9, 1, 3, "#6b4429");
    const bite = p > 0.55;
    const bob = bite ? Math.round(Math.sin(t * 14)) : Math.round(Math.sin(t * 2) * 0.6);
    for (let k = 0; k <= 8; k++) px(7 + k, 4 + Math.round((k * k) / 14), "#d8d8e0");
    px(16, 9 + bob, "#e0402e");
    px(16, 8 + bob, "#ffffff");
    farmer(rect, 5, 8, p >= 0.88 ? (rain ? "#5fc8f0" : "#f39a33") : null, rain);
    if (bite && p < 0.62 && Math.sin(t * 10) > -0.5) rect(5, 0, 1, 2, "#f6cf4a");
    if (p > 0.62 && p < 0.88) {
      rect(22, 1, 3, 12, "#5c3a26");
      rect(23, 2, 1, 10, "#3e8fd6");
      rect(23, 2 + Math.round(3.5 + 3.5 * Math.sin(t * 3)), 1, 3, "#7fe07a");
      px(23, 2 + Math.round(4.5 + 4.5 * Math.sin(t * 4.3 + 1)), "#f39a33");
    }
    if (p >= 0.88) sparkle(px, 5, 2, t);
    if (rain) rainOver(px, t, 10);
    return 1;
  },
  // Down the mine (the floor number in the corner): rocks broken one by one, a ladder down, and a gem.
  mine({ rect, px, p, t, day }) {
    cave(rect, px, day);
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
    farmer(rect, rx - 3, ry + 2, gem ? GEMS[day % GEMS.length] : null);
    if (!gem && Math.sin(t * 10) > 0) px(rx - 1, ry - 1, "#c8ccd4"); // the pickaxe coming down
    if (gem) sparkle(px, rx - 3, ry - 4, t);
    return 2;
  },
  // Deeper down: slimes hopping in at her, one after another, the sword swung at each and it bursts; her
  // health bar, and the floor cleared.
  slime({ rect, px, p, t, day }) {
    cave(rect, px, day + 7);
    rect(1, 1, 8, 2, "#3a2a2a");
    rect(2, 1, Math.round(6 - p * 2), 1, "#e0402e");
    const colours = ["#5fe07a", "#5fc8f0", "#c79bf2"];
    const gone = Math.floor(Math.min(1, p / 0.8) * 3);
    for (let k = gone; k < 3; k++) {
      const x = 22 - k * 4 - Math.round(((p * 3) % 1) * (k === gone ? 6 : 1));
      const y = 11 - (Math.sin(t * 6 + k) > 0.3 ? 1 : 0);
      rect(x, y, 3, 2, colours[k]);
      px(x, y, "#2b2522");
      px(x + 2, y, "#2b2522");
    }
    if (gone > 0 && (p * 3) % 1 < 0.25) for (let k = 0; k < 4; k++) px(18 - gone * 3 + [0, 2, 1, 3][k], 9 + [0, 1, 2, 0][k], colours[gone - 1]);
    farmer(rect, 7, 13);
    const swing = Math.sin(t * 9) > 0.2;
    for (let k = 0; k < 3; k++) px(9 + k, swing ? 9 + k : 11 - k, "#d8dde6");
    if (p > 0.85) sparkle(px, 8, 5, t);
    return 2;
  },
  // At the blacksmith's: geodes on the counter, the hammer comes down on each, and it cracks open on a gem.
  geode({ rect, px, p, t, day }) {
    rect(0, 0, 26, 14, "#6a4a3a");
    rect(0, 0, 26, 2, "#4a3226");
    rect(2, 3, 5, 4, "#2b2522");
    rect(3, 4, 3, 2, Math.sin(t * 7) > 0 ? "#f39a33" : "#e0402e");
    rect(0, 9, 26, 5, "#8a5a34");
    rect(0, 9, 26, 1, "#a87a4a");
    villager(rect, 20, 9, "#2b2522", "#5a5a6a");
    const k = Math.min(2, Math.floor(p * 3)); // the geode she is on
    const q = (p * 3) % 1;
    for (let j = 0; j < 3; j++) {
      const x = 7 + j * 4;
      if (j < k || (j === k && q > 0.5)) {
        rect(x, 7, 3, 2, "#5a5a6a");
        px(x + 1, 7, GEMS[(day + j) % GEMS.length]);
        if (j === k) sparkle(px, x + 1, 5, t);
      } else rect(x, 7, 3, 2, "#9a9aa4");
    }
    const hx = 7 + k * 4;
    const down = q > 0.35 && q < 0.5;
    rect(hx + 1, down ? 4 : 2, 1, 3, "#8a5a34");
    rect(hx, down ? 4 : 2, 3, 1, "#5a5a6a");
    farmer(rect, 12, 14);
    return 2;
  },
  // Into town: the houses, the square; a gift for a villager, a heart, and one more on their row of hearts.
  town({ rect, px, p, t, day, season }) {
    rect(0, 0, 26, 7, season.sky);
    [
      [1, "#f2e3c4", "#c0392b"],
      [9, "#cdeafa", "#3e6fd6"],
      [17, "#f6d79a", "#5fb03a"],
    ].forEach(([x, wall, roof]) => {
      rect(x, 3, 7, 5, wall);
      rect(x - 1, 2, 9, 2, roof);
      rect(x + 3, 5, 2, 3, "#8a5a34");
    });
    rect(0, 8, 26, 6, "#cdb894");
    for (let x = 0; x < 26; x += 3) px(x, 10 + (x % 2), "#b8a07a");
    villager(rect, 18, 12, VILLAGERS[day % VILLAGERS.length]);
    const fx = Math.round(Math.min(14, 2 + (p / 0.6) * 12));
    farmer(rect, fx, 12);
    if (p > 0.6 && p < 0.68) {
      rect(fx + 2, 9, 2, 2, "#e05aa0");
      px(fx + 2, 9, "#f6cf4a");
    }
    const hearts = 1 + (day % 5) + (p > 0.65 ? 1 : 0);
    for (let k = 0; k < 6; k++) px(1 + k * 2, 13, k < hearts ? "#ff6f9a" : "#8a7a6a");
    if (p > 0.65) heart(rect, px, 18, Math.round(6 - (p - 0.65) * 12));
    return 6;
  },
  // A heart event: the two of them somewhere of their own (the beach at sunset, or the hilltop under the
  // stars), the words coming up in the box with the villager's portrait, then hearts.
  heart({ rect, px, p, t, day }) {
    const who = VILLAGERS[day % VILLAGERS.length];
    if (day % 2) {
      ["#f39a33", "#f28aa8", "#9b6bc0"].forEach((c, k) => rect(0, k * 2, 26, 2, c));
      rect(0, 6, 26, 2, "#3e8fd6");
      rect(0, 8, 26, 6, "#f2dca0");
      px(19, 5, "#fff1a8");
    } else {
      rect(0, 0, 26, 8, "#1f2650");
      for (let k = 0; k < 8; k++) if (Math.sin(t * 2 + k) > -0.5) px(Math.floor(hash(k, 1, 6) * 26), Math.floor(hash(k, 2, 6) * 6), "#fff6c9");
      rect(0, 8, 26, 6, "#3f6a3a");
    }
    farmer(rect, 9, 9);
    villager(rect, 14, 9, who, "#e05aa0");
    if (p > 0.6) heart(rect, px, 11, Math.round(3 - (p - 0.6) * 5));
    rect(1, 9, 24, 5, "#8a5a34");
    rect(2, 10, 22, 3, "#f6e3c4");
    rect(3, 10, 3, 3, "#d8b88a");
    rect(4, 10, 1, 1, who);
    px(4, 11, "#f9d6bd");
    const said = Math.floor(Math.min(1, p / 0.55) * 30);
    for (let k = 0; k < 2; k++) rect(7, 10 + k * 2, Math.max(0, Math.min(16, said - k * 15)), 1, "#5c3a26");
    return -1;
  },
  // The museum: her find carried in and set in its place on the display, the shelves filling up.
  museum({ rect, px, p, t, day }) {
    rect(0, 0, 26, 14, "#c8a878");
    rect(0, 0, 26, 2, "#8a5a34");
    for (let x = 1; x < 26; x += 8) rect(x, 2, 1, 8, "#a87a4a");
    rect(0, 10, 26, 4, "#9a6a3a");
    const placed = 4 + (day % 3) + (p > 0.6 ? 1 : 0);
    for (let k = 0; k < 9; k++) {
      const [x, y] = [3 + (k % 3) * 7, 3 + Math.floor(k / 3) * 3];
      rect(x, y + 1, 5, 1, "#6b4429");
      if (k < placed) rect(x + 1 + (k % 2), y, 2, 1, GEMS[(k + day) % GEMS.length]);
    }
    villager(rect, 22, 13, "#9a9aa4", "#3a3a48");
    const x = Math.round(Math.min(16, 2 + (p / 0.55) * 14));
    farmer(rect, x, 13, p < 0.6 ? GEMS[(placed - 1 + day) % GEMS.length] : null);
    if (p > 0.6) sparkle(px, 18, 8, t);
    return -1;
  },
  // The saloon of an evening: the bar, the jukebox's lights, friends at a table; she plays the arcade game.
  saloon({ rect, px, p, t, day }) {
    rect(0, 0, 26, 14, "#6a3a2a");
    rect(0, 10, 26, 4, "#4a2a1a");
    rect(0, 6, 9, 4, "#8a5a34");
    for (let x = 1; x < 9; x += 2) px(x, 5, ["#e0402e", "#5fc8f0", "#f6cf4a"][x % 3]);
    rect(11, 4, 3, 6, "#3a3a48");
    for (let y = 5; y < 9; y++) px(12, y, ["#ff6f9a", "#f6cf4a", "#5fe0a0", "#8fd3ff"][(y + Math.floor(t * 6)) % 4]);
    villager(rect, 2, 13, VILLAGERS[(day + 1) % 5]);
    villager(rect, 5, 13, VILLAGERS[(day + 2) % 5], "#5fb03a");
    rect(19, 3, 5, 7, "#2b2b33");
    rect(20, 4, 3, 3, "#f2d27a");
    px(20 + Math.floor((t * 3) % 3), 5, "#c0392b");
    farmer(rect, 17, 13);
    if (p > 0.4) for (let k = 0; k < 3; k++) px(15 + k * 2, Math.round(3 - ((t * 2 + k) % 3)), "#fff6c9");
    return -1;
  },
  // The season's festival: an egg hunt in the spring, the luau on the beach in the summer, the fair in the
  // autumn, ice fishing in the winter; her count going up, and the prize.
  festival({ rect, px, p, t, day }) {
    const season = seasonOf(day);
    if (season === 0) {
      rect(0, 0, 26, 14, "#7ec85a");
      for (let k = 0; k < 6; k++) rect(Math.floor(hash(k, 1, 4) * 24), Math.floor(hash(k, 2, 4) * 6), 3, 1, "#f7b8cc");
      const found = Math.floor(Math.min(1, p / 0.8) * 7);
      for (let k = found; k < 7; k++) rect(2 + k * 3, 9 + (k % 3), 1, 2, ["#f28aa8", "#8fd3ff", "#f6cf4a", "#c79bf2"][k % 4]);
      farmer(rect, Math.round(2 + Math.min(1, p / 0.8) * 20), 13);
      number(px, found, 1, 1, "#ffffff");
    } else if (season === 1) {
      rect(0, 0, 26, 6, "#7cc8f5");
      rect(0, 6, 26, 2, "#3e8fd6");
      rect(0, 8, 26, 6, "#f2dca0");
      rect(10, 7, 6, 4, "#3a3a40");
      rect(11, 6, 4, 1, "#c89a5a");
      for (let k = 0; k < 3; k++) rect(12 + k, Math.round(5 - ((t * 2 + k) % 4)), 1, 1, "#e8e8f0");
      [3, 6, 19, 22].forEach((x, k) => villager(rect, x, 12, VILLAGERS[(day + k) % 5]));
      farmer(rect, Math.round(Math.min(8, 2 + p * 12)), 13, p < 0.5 ? "#f39a33" : null);
    } else if (season === 2) {
      rect(0, 0, 26, 14, "#c8a050");
      for (const [x, c] of [
        [1, "#e0402e"],
        [9, "#3e6fd6"],
        [17, "#5fb03a"],
      ]) {
        for (let k = 0; k < 8; k += 2) rect(x + k, 2, 2, 2, k % 4 ? "#ffffff" : c);
        rect(x, 4, 8, 4, "#8a5a34");
        px(x + 3, 3, "#f6cf4a");
      }
      farmer(rect, Math.round(2 + p * 9), 13);
      rect(14, 11, 1, 1, "#f6cf4a");
      number(px, Math.floor(p * 200), 16, 9, "#f6cf4a");
    } else {
      rect(0, 0, 26, 14, "#e8f0f4");
      for (let k = 0; k < 10; k++) px(Math.floor(hash(k, 5, 2) * 26), Math.floor((hash(k, 6, 2) * 14 + t * 2) % 14), "#ffffff");
      for (const x of [4, 12, 20]) rect(x, 9, 4, 2, "#5fa8e0");
      farmer(rect, 13, 9, p > 0.55 ? "#5fc8f0" : null);
      for (let k = 0; k < 4; k++) rect(5 + (k % 2) * 16, 2 + k * 2, 1, 1, "#c0392b");
      number(px, Math.floor(Math.min(1, p / 0.85) * 5), 1, 1, "#3e6fd6");
    }
    if (p > 0.85) {
      rect(9, 1, 8, 5, "#f6cf4a");
      rect(11, 2, 4, 3, "#ffffff");
      sparkle(px, 12, 2, t);
    }
    return -1;
  },
  // In the kitchen: what she grew or caught into the pot, the steam, and the dish come out of it.
  cook({ rect, px, p, t, day }) {
    rect(0, 0, 26, 14, "#e8c89a");
    for (let x = 0; x < 26; x += 3) for (let y = 0; y < 7; y += 3) px(x, y, "#d8b88a");
    rect(0, 8, 26, 6, "#b07a4a");
    rect(4, 5, 10, 4, "#5a5a6a");
    rect(6, 3, 6, 3, "#3a3a40");
    for (let k = 0; k < 3; k++) px(7 + k * 2, Math.round(2 - ((t * 2 + k) % 3)), "#ffffff");
    const n = Math.floor(Math.min(1, p / 0.6) * 3);
    for (let k = n; k < 3; k++) rect(16 + k * 3, 6, 2, 2, ["#e0402e", "#f6cf4a", "#5fb03a"][(k + day) % 3]);
    if (p < 0.6) {
      const q = (p / 0.2) % 1;
      px(Math.round(16 + n * 3 - q * 8), Math.round(5 - Math.sin(q * Math.PI) * 3), ["#e0402e", "#f6cf4a", "#5fb03a"][(n + day) % 3]);
    }
    farmer(rect, 15, 13);
    if (p > 0.7) {
      rect(19, 9, 5, 2, "#ffffff");
      rect(20, 8, 3, 1, ["#f39a33", "#e0402e", "#c79bf2"][day % 3]);
      sparkle(px, 21, 7, t);
    }
    return 5;
  },
  // The beach: shells, coral and a sea urchin along the sand, each picked up (held up) as she goes by.
  forage({ rect, px, p, t, day }) {
    rect(0, 0, 26, 5, "#8fd0f5");
    rect(0, 5, 26, 4, "#3e8fd6");
    for (let k = 0; k < 5; k++) rect((k * 6 + Math.round(t * 2)) % 26, 6 + (k % 3), 3, 1, "#8fc8f0");
    rect(0, 9, 26, 5, "#f2dca0");
    rect(0, 9, 26, 1, "#ffffff");
    const things = ["#f7b8cc", "#e0605a", "#9b59d0", "#fff1c9", "#f39a33"];
    const x = 2 + p * 21;
    things.forEach((c, k) => {
      const tx = 4 + k * 4;
      if (tx > x) rect(tx, 11 + (k % 2), 2, 1, c);
    });
    const held = things.findLastIndex((_, k) => 4 + k * 4 <= x && x - (4 + k * 4) < 1.5);
    farmer(rect, Math.round(x), 13, held >= 0 ? things[held] : null);
    if (held >= 0) sparkle(px, Math.round(x), 6, t);
    rect(21, 1, 3, 3, "#fff1a8");
    return -1;
  },
  // The day's crops into the shipping bin by the house, and the gold counting up.
  ship({ rect, px, p, day, season }) {
    rect(0, 0, 26, 14, season.grass);
    rect(0, 2, 9, 8, "#c48a4a");
    rect(0, 1, 10, 2, "#7a2a1f");
    rect(12, 9, 6, 3, "#8a5a34");
    rect(12, 8, 6, 1, "#6b4429");
    farmer(rect, 9, 12);
    const toss = (p * 4) % 1;
    const crops = season.crops || GEMS;
    px(Math.round(11 + toss * 3), Math.round(7 - Math.sin(toss * Math.PI) * 4), crops[Math.floor(p * 4) % 3]);
    number(px, 100 + ((day * 37) % 800) + Math.floor(p * 90), 14, 1, "#f6cf4a");
    px(12, 3, "#f6cf4a");
    return 7;
  },
  // Sunset over the farm; after a festival lanterns rise and fireworks go up, else the fireflies come out.
  evening({ rect, px, p, t, day }) {
    ["#f39a33", "#f28aa8", "#9b6bc0", "#4a3a7a"].forEach((c, k) => rect(0, k * 2, 26, 2, c));
    px(19, Math.round(3 + p * 4), "#fff1a8");
    rect(0, 8, 26, 6, "#2f4a3a");
    rect(3, 5, 6, 4, "#3a2e2a");
    rect(2, 4, 8, 1, "#2a2020");
    px(5, 7, "#f6cf4a");
    farmer(rect, 14, 12);
    if (kindOf(day) === "festival") {
      for (let k = 0; k < 5; k++) px((k * 5 + 2) % 26, Math.round(12 - ((t * 2 + k * 3) % 12)), "#f39a33");
      const burst = Math.floor(t * 1.2);
      const [bx, by] = [4 + Math.floor(hash(burst, 1, 8) * 18), 2 + Math.floor(hash(burst, 2, 8) * 2)];
      const r = 1 + ((t * 1.2) % 1) * 2;
      for (let a = 0; a < 6; a++)
        px(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), ["#ff6f9a", "#f6cf4a", "#8fd3ff"][burst % 3]);
    } else for (let k = 0; k < 5; k++) if (Math.sin(t * 3 + k * 2) > 0.3) px((k * 6 + 3) % 26, 9 + (k % 3), "#e8f07a");
    return -1;
  },
};

// The rock walls of the mine (different on each floor).
function cave(rect, px, seed) {
  rect(0, 0, 26, 14, "#3a2e2a");
  for (let k = 0; k < 14; k++) px(Math.floor(hash(k, seed, 3) * 26), Math.floor(hash(seed, k, 4) * 13), "#4a3c36");
}

// Watering along the rows (`water`), or picking.
function rows(rect, px, p, t, day, season, water) {
  const crops = season.crops;
  const row = Math.min(2, Math.floor(p * 3));
  const along = 2 + ((p * 3) % 1) * 21;
  const done = (r, x) => r < row || (r === row && x < along);
  field(rect, season.grass);
  if (water) {
    ROW_Y.forEach((y, r) => rect(2, y, r < row ? 22 : r === row ? along - 2 : 0, 2, "#6b4429"));
    const stage = ["#d9b98a", "#9fe07a", "#5bb046"][day % 3];
    if (crops) for (const y of ROW_Y) for (const x of PLANT_X) px(x, y, stage);
    if (Math.sin(t * 8) > 0) px(Math.round(along) + 2, ROW_Y[row] + 1, "#8fd3ff");
    farmer(rect, Math.round(along), ROW_Y[row] + 1);
    return 0;
  }
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
  return 3;
}

// The game on his monitor, `w` by `h`: the scene `e` seconds into her playing `day` (DAYS).
export function drawStardew(g, w, h, t, e, day) {
  const { rect, px } = pen(g);
  const [i, p] = sceneAt(day, e);
  const scene = DAYS[kindOf(day)][i][0];
  rect(0, 0, w, h, "#1b1b22"); // the scenes fill all but the bottom row, the hotbar's when a tool is out
  const season = SEASONS[seasonOf(day)];
  const tool = SCENES[scene]({ rect, px, p, t, day, season, rain: kindOf(day) === "rain" });
  if (tool >= 0) {
    rect(4, 14, 18, 1, "#5c3a26");
    TOOLS.forEach((c, k) => px(5 + k * 2, 14, c));
    px(5 + tool * 2, 13, "#ffffff");
  }
}

// The side screen while she plays, `w` by `h` on end: the day of the season (on the season's colour), the
// time of day, and her energy running down till she sleeps.
export function drawFarmSide(g, w, h, e, day) {
  const { rect, px } = pen(g);
  const hour = dayPart(day, e);
  rect(0, 0, w, h, SEASONS[seasonOf(day)].grass);
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
