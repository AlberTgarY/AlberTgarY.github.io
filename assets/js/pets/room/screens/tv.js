/*******************************************************************************
 * The TV's channels (a nature programme, a cartoon, a cooking show, the news,
 * the weather forecast with today's real sky, adverts, football, a concert,
 * crafts, baking, travel, the ocean, a pop video, a quiz, gardening, tennis, an
 * anime drama, a late-night film) and the game the two of them play on it.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number2, person2, shade } from "./pen.js";
import { drawXinwen } from "./xinwen.js";

export const CHANNELS = [
  "nature",
  "cartoon",
  "cooking",
  "news",
  "weather",
  "advert",
  "football",
  "concert",
  "crafts",
  "baking",
  "travel",
  "ocean",
  "dance",
  "quiz",
  "garden",
  "tennis",
  "anime",
  "film",
  "xinwen",
];

// v wrapped into 0 to n, for things that go round and come back in from the other side.
const wrap = (v, n) => ((v % n) + n) % n;

// A round disc of radius r about (cx, cy): suns, the moon, a globe.
function disc(rect, cx, cy, r, c) {
  for (let dy = -r; dy < r; dy++) {
    const half = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2));
    rect(cx - half, cy + dy, 2 * half, 1, c);
  }
}

// A fluffy cloud 16 texels wide, its underside in shadow.
function cloud(rect, x, y, c) {
  rect(x, y + 2, 16, 3, c);
  rect(x + 3, y, 6, 2, c);
  rect(x + 9, y + 1, 4, 1, c);
  rect(x + 1, y + 5, 14, 1, shade(c, -0.12));
}

// A little heart five texels wide.
function heart(rect, x, y, c) {
  rect(x, y, 2, 1, c);
  rect(x + 3, y, 2, 1, c);
  rect(x, y + 1, 5, 1, c);
  rect(x + 1, y + 2, 3, 1, c);
  rect(x + 2, y + 3, 1, 1, c);
}

// Big letters for the goal banner, five texels wide and seven high.
const GOAL = {
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "!": ["1", "1", "1", "1", "1", "0", "1"],
};

// The TV: `channel` (CHANNELS), `t` the clock, `e` how long it has been on this channel, `sky` the weather
// outside ("sunny", "cloudy" or "rain"), which the forecast shows for home. The screen is w x h texels (84 x 48).
export function drawChannel(g, w, h, channel, t, e, sky = "sunny") {
  if (channel === "xinwen") return drawXinwen(g, w, h, t, e);
  const { rect, px } = pen(g);
  if (channel === "nature" && Math.floor(e / 6) % 2) {
    // ...then a pond: a duck and her ducklings paddling across, and a frog hopping from lily pad to lily pad.
    rect(0, 0, w, h, "#a8dcf2");
    rect(0, 16, w, 6, "#6aae4f");
    rect(0, 16, w, 1, "#86c46a");
    for (let x = 3; x < w; x += 7) rect(x, 12 + (x % 3), 1, 6, "#4f8f3a"); // reeds along the bank, a bulrush now and then
    for (let x = 10; x < w; x += 21) rect(x, 11 + (x % 3), 1, 3, "#8a5a34");
    rect(0, 22, w, h - 22, "#4f9fd0");
    rect(0, 22, w, 1, "#3f8fc0");
    for (let k = 0; k < 9; k++) rect(((k * 13 + t * 4) % (w + 8)) - 8, 26 + (k % 4) * 5, 4 + (k % 2) * 2, 1, "#7fc0e6");
    for (const [x, y] of [
      [6, 38],
      [54, 30],
    ]) {
      rect(x, y, 12, 3, "#5bb046");
      rect(x + 1, y - 1, 10, 1, "#5bb046");
      rect(x + 1, y + 3, 10, 1, "#479a37");
      rect(x + 5, y - 1, 2, 2, "#4f9fd0");
    }
    rect(8, 35, 3, 2, "#f7a1b5"); // a water lily on the first
    px(9, 34, "#fbd3de");
    const dx = ((t * 6) % (w + 40)) - 12;
    rect(dx - 2, 26, 3, 2, "#ffffff"); // her tail up, her body, her wing
    rect(dx, 27, 10, 4, "#ffffff");
    rect(dx + 1, 31, 8, 1, "#d6dde8");
    rect(dx + 2, 28, 5, 2, "#e3e1dc");
    rect(dx + 7, 25, 3, 2, "#ffffff"); // her neck and head
    rect(dx + 7, 21, 4, 4, "#ffffff");
    px(dx + 9, 22, "#2b2522");
    rect(dx + 11, 23, 2, 1, "#f39a33");
    px(dx + 11, 24, "#d97f20");
    for (let k = 1; k < 4; k++) {
      const x = dx - 8 * k;
      const bob = Math.sin(t * 6 + k) > 0 ? 1 : 0;
      rect(x, 29 + bob, 4, 2, "#f6cf4a");
      rect(x + 2, 27 + bob, 2, 2, "#f6cf4a");
      px(x + 3, 27 + bob, "#2b2522");
      px(x + 4, 28 + bob, "#f39a33");
      rect(x - 2, 31, 3, 1, "#7fc0e6");
    }
    const hop = (t * 0.5) % 2;
    const [from, to] =
      hop < 1
        ? [
            [9, 34],
            [57, 26],
          ]
        : [
            [57, 26],
            [9, 34],
          ];
    const j = Math.max(0, ((hop % 1) - 0.7) / 0.3); // 0 sitting, then 0 to 1 through the jump
    const fx = from[0] + (to[0] - from[0]) * j;
    const fy = from[1] + (to[1] - from[1]) * j - Math.sin(j * Math.PI) * 12;
    if (j > 0 && j < 1) {
      rect(fx - 3, fy + 2, 3, 1, "#3fae4f"); // legs out behind in the jump
      rect(fx + 8, fy + 2, 3, 1, "#3fae4f");
    }
    rect(fx, fy, 8, 4, "#3fae4f");
    rect(fx + 2, fy + 2, 4, 2, "#8fd16a");
    rect(fx, fy - 2, 3, 2, "#3fae4f");
    rect(fx + 5, fy - 2, 3, 2, "#3fae4f");
    px(fx + 1, fy - 2, "#2b2522");
    px(fx + 6, fy - 2, "#2b2522");
  } else if (channel === "nature") {
    // Hills under a sky, a cloud going by and a sheep hopping along...
    rect(0, 0, w, h, "#8fd0f5");
    rect(0, 0, w, 6, "#7fc6f0");
    disc(rect, 65, 11, 5, "#ffe58a");
    rect(63, 8, 2, 2, "#fff4c2");
    cloud(rect, ((t * 8) % (w + 24)) - 16, 8, "#ffffff");
    for (let x = 0; x < w; x++) {
      const far = Math.round(22 + 4 * Math.sin(x * 0.07 + 3));
      rect(x, far, 1, h - far, "#a3d68a");
    }
    const hill = (x) => Math.round(28 + 6 * Math.sin(x * 0.125 + 1));
    for (let x = 0; x < w; x++) {
      const top = hill(x);
      rect(x, top, 1, h - top, x % 14 ? "#79c25c" : "#6aae4f");
      px(x, top, "#8fd16a");
      if (hash(x, 1, 31) < 0.12) px(x, top + 3 + Math.floor(hash(x, 2, 31) * 12), hash(x, 3, 31) < 0.5 ? "#ffffff" : "#f6cf4a");
    }
    const sx = ((t * 12) % (w + 16)) - 8;
    const sy = hill(sx + 4) - 7 - Math.abs(Math.sin(t * 5)) * 4;
    rect(sx + 1, sy + 6, 1, 2, "#3b3330");
    rect(sx + 5, sy + 6, 1, 2, "#3b3330");
    rect(sx, sy + 1, 8, 5, "#ffffff");
    rect(sx + 1, sy, 6, 1, "#ffffff");
    px(sx + 2, sy + 2, "#e3e1dc");
    px(sx + 5, sy + 3, "#e3e1dc");
    rect(sx + 7, sy + 1, 3, 4, "#3b3330");
    px(sx + 7, sy, "#3b3330");
    px(sx + 9, sy + 2, "#ffffff");
  } else if (channel === "cartoon" && Math.floor(e / 6) % 2) {
    // ...then a bunny bouncing across the meadow, the carrots vanishing as she gets to them.
    rect(0, 0, w, h, "#cdeefd");
    cloud(rect, 8, 4, "#ffffff");
    cloud(rect, 58, 9, "#ffffff");
    rect(0, 34, w, h - 34, "#8fd16a");
    rect(0, 34, w, 1, "#a6dd82");
    for (let x = 4; x < w; x += 11) rect(x, 38 + (x % 5), 1, 2, "#6fb64f");
    const bx = ((t * 12) % (w + 16)) - 8;
    for (let x = 16; x < w; x += 20)
      if (x > bx + 6) {
        rect(x, 31, 4, 3, "#f39a33");
        px(x + 1, 32, "#d97f20");
        rect(x, 28, 1, 3, "#5bb046");
        rect(x + 2, 27, 1, 4, "#5bb046");
        rect(x + 3, 29, 1, 2, "#4f9a3a");
      }
    const lift = Math.abs(Math.sin(t * 6)) * 8;
    const y = 24 - lift;
    rect(bx + 1 + lift / 4, 35, 10 - lift / 2, 1, "#73b553"); // her shadow, smaller the higher she is
    rect(bx - 2, y + 4, 3, 3, "#ffffff");
    rect(bx, y + 4, 10, 6, "#ffffff");
    rect(bx + 1, y + 3, 7, 1, "#ffffff");
    rect(bx + 1, y + 9, 8, 1, "#e3e1dc");
    rect(bx + 8, y, 6, 6, "#ffffff");
    rect(bx + 8, y - 6, 2, 6, "#ffffff");
    rect(bx + 12, y - 6, 2, 6, "#ffffff");
    rect(bx + 9, y - 5, 1, 4, "#f7a1b5");
    rect(bx + 13, y - 5, 1, 4, "#f7a1b5");
    px(bx + 12, y + 2, "#2b2522");
    px(bx + 13, y + 4, "#f7a1b5");
  } else if (channel === "cartoon") {
    // A cartoon cat waving on a pink stage...
    rect(0, 0, w, h, "#f7c6d6");
    for (let x = 3; x < w; x += 12) for (let y = 3 + (x % 2) * 6; y < 34; y += 12) px(x, y, "#fbdce6");
    rect(0, 0, 6, 36, "#d9334a"); // the curtains
    rect(w - 6, 0, 6, 36, "#d9334a");
    rect(2, 0, 1, 36, "#b52238");
    rect(w - 3, 0, 1, 36, "#b52238");
    rect(0, 36, w, h - 36, "#e88fae");
    rect(0, 36, w, 1, "#f2a8c0");
    for (let x = 10; x < w; x += 16) rect(x, 37, 1, h - 37, "#d9799a");
    const b = Math.round(Math.sin(t * 4) * 2);
    const fur = "#f6a33c";
    const dark = shade(fur, -0.2);
    rect(26, 28 + b, 6, 2, fur); // the tail
    rect(24, 23 + b, 2, 6, fur);
    rect(32, 26 + b, 20, 10 - b, fur);
    rect(37, 28 + b, 10, 8 - b, "#ffd59a");
    rect(56, 15 + b + Math.round(Math.sin(t * 8) * 2), 4, 12, fur); // the waving paw
    rect(56, 15 + b + Math.round(Math.sin(t * 8) * 2), 4, 2, "#ffd59a");
    rect(29, 10 + b, 26, 16, fur);
    rect(28, 12 + b, 28, 12, fur);
    for (let r = 0; r < 6; r++) {
      rect(30, 4 + b + r, 1 + r, 1, fur);
      rect(54 - r, 4 + b + r, 1 + r, 1, fur);
    }
    rect(31, 7 + b, 2, 3, "#f7a1b5");
    rect(51, 7 + b, 2, 3, "#f7a1b5");
    [40, 42, 44].forEach((x, k) => rect(x, 10 + b, 1, 3 + (k % 2), dark));
    for (const ex of [34, 47]) {
      if (t % 3 < 0.15) rect(ex, 17 + b, 3, 1, "#2b2522");
      else {
        rect(ex, 15 + b, 3, 4, "#2b2522");
        px(ex + 1, 15 + b, "#ffffff");
      }
    }
    rect(31, 20 + b, 2, 1, "#f7a1b5");
    rect(51, 20 + b, 2, 1, "#f7a1b5");
    rect(41, 20 + b, 2, 1, "#e0607a");
    px(40, 21 + b, dark);
    px(43, 21 + b, dark);
    rect(41, 22 + b, 2, Math.sin(t * 6) > 0 ? 2 : 1, "#c4503f");
    for (const y of [19, 21]) {
      rect(23, y + b, 5, 1, "#fff4e0");
      rect(56, y + b, 5, 1, "#fff4e0");
    }
  } else if (channel === "cooking") {
    // A cooking show: the chef at a pot on the hob, stirring, steam rising.
    rect(0, 0, w, h, "#fbe7c4");
    for (let x = 0; x < w; x += 8) rect(x, 0, 1, 34, "#f2d9ae");
    for (let y = 7; y < 34; y += 8) rect(0, y, w, 1, "#f2d9ae");
    rect(64, 4, 16, 5, "#e8695a"); // the show's name
    rect(66, 6, 9, 1, "#ffffff");
    rect(0, 34, w, h - 34, "#c9a07a");
    rect(0, 34, w, 2, "#ddb892");
    for (let x = 5; x < w; x += 17) rect(x, 40 + (x % 3) * 2, 6, 1, "#b88f68");
    const top = 18 + Math.round(Math.sin(t * 3));
    person2(rect, px, 13, top, { hair: "#5e3624", clothes: "#ffffff", hat: "chef", mouth: Math.sin(t * 9) > 0, blink: t % 4 < 0.15 });
    px(12, top + 11, "#c9ced6"); // the buttons on the chef's jacket
    px(12, top + 13, "#c9ced6");
    rect(24, 33, 36, 2, "#3b3330");
    const spoon = 42 + Math.round(Math.cos(t * 5) * 6);
    rect(spoon, 10, 2, 9, "#b0763c");
    rect(28, 19, 28, 14, "#5c6b80");
    rect(31, 21, 2, 10, "#7d8ca3");
    rect(28, 31, 28, 2, "#4a5668");
    rect(24, 18, 36, 2, "#7d8ca3");
    rect(22, 21, 4, 2, "#3b3330");
    rect(58, 21, 4, 2, "#3b3330");
    for (let k = 0; k < 3; k++) {
      const y = 16 - ((t * 12 + k * 6) % 16);
      rect(32 + k * 8 + Math.round(Math.sin(t * 3 + k + y * 0.3) * 2), y, 2, 3, "#ffffff");
    }
  } else if (channel === "news") {
    // The evening news: two presenters at the desk, the globe in the corner, the headlines along the bottom.
    rect(0, 0, w, h, "#1d3f7a");
    for (let x = 0; x < w; x += 12) rect(x, 0, 6, 30, "#22488a");
    disc(rect, 10, 9, 5, "#3a7bd5");
    rect(5, 9, 10, 1, "#8fd3ff");
    rect(9, 4, 2, 10, "#8fd3ff");
    px(7, 6, "#8fd3ff");
    px(7, 12, "#8fd3ff");
    px(12, 6, "#8fd3ff");
    px(12, 12, "#8fd3ff");
    const talker = Math.floor(e / 3) % 2;
    person2(rect, px, 27, 12, {
      hair: "#221e21",
      clothes: "#2b2c33",
      collar: "#ffffff",
      tie: "#c8323c",
      mouth: talker === 0 && Math.sin(t * 11) > 0,
      blink: t % 5 < 0.12,
    });
    person2(rect, px, 57, 12, {
      hair: "#5e3624",
      style: "bob",
      clothes: "#e3e1dc",
      collar: "#c8323c",
      mouth: talker === 1 && Math.sin(t * 11) > 0,
      blink: (t + 2) % 5 < 0.12,
    });
    rect(0, 28, w, 12, "#c9d4e6");
    rect(0, 28, w, 1, "#ffffff");
    rect(0, 31, w, 2, "#2a5cab");
    rect(20, 27, 8, 1, "#ffffff"); // their papers
    rect(51, 27, 8, 1, "#ffffff");
    rect(0, 40, w, 8, "#c8323c");
    rect(0, 40, w, 1, "#e0505a");
    for (let k = 0; k < 8; k++) rect(wrap(k * 18 - t * 20, w + 18) - 6, 43, 4 + (k % 3) * 4, 2, "#ffffff");
    rect(0, 40, 12, 8, "#f6cf4a");
    rect(2, 43, 8, 2, "#c8323c");
  } else if (channel === "weather") {
    // The weather forecast: home in the middle of the map under the biggest symbol, showing the sky outside, with
    // the presenter's pointer on it; two other places around it (different each time it comes on), each place's
    // temperature along the bottom under it, and today's sky again in the corner above her.
    rect(0, 0, w, h, "#6fb3e0");
    for (let k = 0; k < 6; k++) rect(4 + ((k * 23) % 60), 3 + ((k * 11) % 30), 3, 1, "#86c2e8");
    for (let y = 4; y < 36; y++) {
      const a = 6 + Math.round(4 * Math.sin(y * 0.3) + 2 * Math.sin(y * 0.85));
      const b = 62 - Math.round(4 * Math.sin(y * 0.25 + 1));
      rect(a, y, b - a, 1, Math.floor(y / 2) % 5 ? "#7fbf5a" : "#71b04f");
      px(a, y, "#a8d98a");
      px(b - 1, y, "#a8d98a");
    }
    const icon = (x, y, kind) => {
      if (kind === "sunny") {
        disc(rect, x + 4, y + 4, 4, "#ffd75a");
        rect(x + 2, y + 2, 2, 2, "#fff4c2");
        if (Math.sin(t * 4) > 0)
          [
            [-3, 3],
            [9, 3],
            [3, -3],
            [3, 9],
          ].forEach(([dx, dy]) => rect(x + dx, y + dy, 2, 2, "#ffd75a"));
      } else {
        const c = kind === "rain" ? "#d6dde8" : "#ffffff";
        rect(x, y + 2, 12, 4, c);
        rect(x + 2, y, 6, 2, c);
        rect(x + 7, y + 1, 3, 1, c);
        rect(x + 1, y + 6, 10, 1, shade(c, -0.15));
        if (kind === "rain") for (let k = 0; k < 3; k++) rect(x + 2 + k * 4, y + 8 + Math.floor((t * 6 + k) % 2) * 2, 1, 2, "#2f6fd6");
      }
    };
    const big = (x, y, kind) => {
      if (kind === "sunny") {
        disc(rect, x + 10, y + 8, 6, "#ffd75a");
        rect(x + 7, y + 4, 3, 2, "#fff4c2");
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4 + t * 0.8;
          rect(x + 9.5 + Math.cos(a) * 10, y + 7.5 + Math.sin(a) * 10, 2, 2, "#ffd75a");
        }
        return;
      }
      const top = kind === "rain" ? "#c9d2de" : "#ffffff";
      const x0 = x + Math.round(Math.sin(t * 1.2) * 2);
      rect(x0, y + 6, 22, 6, top);
      rect(x0 + 4, y + 2, 8, 4, top);
      rect(x0 + 10, y + 4, 8, 2, top);
      rect(x0 + 1, y + 5, 3, 1, top);
      rect(x0 + 2, y + 12, 18, 2, kind === "rain" ? "#a9b4c4" : "#d6dde8");
      if (kind === "rain") for (let k = 0; k < 5; k++) rect(x0 + 2 + k * 4, y + 16 + Math.floor((t * 8 + k * 1.7) % 4) * 2, 1, 3, "#2f6fd6");
    };
    const KINDS = ["sunny", "cloudy", "rain"];
    const TEMP = { sunny: 24, cloudy: 18, rain: 13 };
    const on = Math.floor(t - e); // when this forecast came on
    const west = KINDS[Math.floor(hash(on, 1, 7) * 3)];
    const east = KINDS[Math.floor(hash(on, 2, 7) * 3)];
    icon(10, 6, west);
    icon(48, 8, east);
    big(22, 12, sky);
    rect(18, 28, 6, 4, "#fff8ef"); // home, a little house under it
    rect(17, 27, 8, 1, "#d9334a");
    rect(18, 26, 6, 1, "#d9334a");
    rect(20, 30, 2, 2, "#8a5a34");
    rect(0, 36, w, h - 36, "#1d3f7a");
    rect(0, 36, w, 1, "#2f5fa8");
    [
      [TEMP[west] + Math.floor(hash(on, 3, 7) * 4), 6, "#ffffff"],
      [TEMP[sky], 28, "#ffd75a"],
      [TEMP[east] + Math.floor(hash(on, 4, 7) * 4), 50, "#ffffff"],
    ].forEach(([n, x, c]) => {
      number2(rect, n, x, 39, c);
      px(x + 12, 39, c); // the degree sign
    });
    rect(66, 0, 18, 14, "#1d3f7a");
    icon(sky === "sunny" ? 71 : 69, sky === "sunny" ? 3 : 2, sky);
    rect(70, 30, 10, 6, "#a8263a"); // her skirt, her pointing arm, and the pointer on home
    person2(rect, px, 75, 14, { hair: "#47281b", style: "bob", clothes: "#d9334a", arms: false, mouth: Math.sin(t * 9) > 0, blink: t % 4 < 0.12 });
    rect(65, 23, 4, 2, "#d9334a");
    rect(63, 23, 2, 2, "#f9d6bd");
    const tip = 44 + Math.round(Math.sin(t * 1.5) * 2);
    rect(tip, 23, 63 - tip, 1, "#3b3330");
    px(tip, 23, "#ffffff");
  } else if (channel === "advert") {
    // Adverts: a juice bottle bouncing in a burst of colour, a little red car on the open road, and an ice cream
    // getting scoop after scoop, one after another (which comes first depends on when the break started).
    const ad = (Math.floor(e / 4) + Math.floor(t - e)) % 3;
    if (ad === 2) {
      rect(0, 0, w, h, "#bfe8e0");
      for (let k = 0; k < 10; k++)
        if (Math.sin(t * 3 + k * 1.9) > 0) {
          const [x, y] = [(k * 18) % w, 4 + ((k * 10) % 32)];
          rect(x, y + 1, 4, 2, "#e4f7f2");
          rect(x + 1, y, 2, 4, "#e4f7f2");
        }
      for (let y = 0; y < 16; y++) {
        const x0 = 36 + Math.round(y * 0.45);
        const wide = 14 - Math.round(y * 0.9);
        rect(x0, 28 + y, wide, 1, y % 4 < 2 ? "#d9a35b" : "#c98f45");
        for (let x = 0; x < wide; x++) if ((x0 + x + y) % 4 === 0) px(x0 + x, 28 + y, "#b07a35");
      }
      const scoops = 1 + Math.floor(e % 4); // a new scoop dropping on every second, then the cherry
      const SCOOP = ["#f7c6d6", "#fff1c9", "#8a5a34"];
      for (let k = 0; k < Math.min(3, scoops); k++) {
        const y = 22 - k * 6 - (k === scoops - 1 ? Math.max(0, 1 - (e % 1) * 4) * 12 : 0);
        rect(36, y, 14, 6, SCOOP[k]);
        rect(38, y - 2, 10, 2, SCOOP[k]);
        rect(39, y - 1, 2, 1, shade(SCOOP[k], 0.5));
        [37, 42, 47].forEach((x) => rect(x, y + 6, 2, 1, shade(SCOOP[k], -0.15)));
      }
      if (scoops > 3) {
        rect(42, 3, 3, 3, "#d9334a");
        px(42, 3, "#ff7f8a");
        rect(44, 1, 1, 2, "#4f9a3a");
        px(45, 0, "#4f9a3a");
      }
      rect(0, 42, w, h - 42, "#f28aa8");
      for (let k = 0; k < 5; k++) rect(16 + k * 12, 44, 2, 2, "#ffffff");
    } else if (ad === 0) {
      rect(0, 0, w, h, "#ff8fb4");
      for (let k = 1; k < 12; k += 2) {
        const a = (k / 12) * Math.PI * 2 + t * 0.8;
        for (let r = 6; r < 52; r++) rect(42 + Math.cos(a) * r, 22 + Math.sin(a) * r * 0.6, 2, 1, "#ffb3cb");
      }
      const y = 12 - Math.abs(Math.sin(t * 4)) * 6;
      rect(36, 39, 14, 1, "#e67799"); // its shadow
      rect(39, y - 2, 8, 3, "#ffffff");
      rect(39, y - 1, 8, 1, "#e3e1dc");
      rect(40, y + 1, 6, 3, "#7cc46a");
      rect(38, y + 4, 10, 2, "#7cc46a");
      rect(36, y + 6, 14, 20, "#7cc46a");
      rect(38, y + 7, 2, 18, "#a6dd82");
      rect(36, y + 13, 14, 7, "#f6cf4a");
      disc(rect, 43, y + 16.5, 3, "#f39a33");
      px(44, y + 13, "#4f9a3a");
      for (let k = 0; k < 4; k++)
        if (Math.sin(t * 7 + k * 2) > 0.3) {
          const [x, sy] = [24 + k * 12, 6 + (k % 2) * 28];
          px(x, sy, "#ffffff");
          px(x - 1, sy, "#ffe3ee");
          px(x + 1, sy, "#ffe3ee");
          px(x, sy - 1, "#ffe3ee");
          px(x, sy + 1, "#ffe3ee");
        }
      rect(0, 40, w, h - 40, "#f6cf4a");
      rect(20, 42, 44, 4, "#d9334a");
      for (let k = 0; k < 5; k++) rect(23 + k * 8, 43, 5, 2, "#ffffff");
    } else {
      rect(0, 0, w, 24, "#9fd8f5");
      rect(0, 0, w, 6, "#8fd0f0");
      for (let k = 0; k < 5; k++) {
        const x = wrap(k * 24 - t * 20, w + 24) - 12; // trees going by
        rect(x + 3, 18, 2, 6, "#7a5236");
        rect(x, 10, 8, 9, "#4f9a3a");
        rect(x + 1, 9, 6, 1, "#4f9a3a");
        rect(x + 1, 11, 3, 2, "#6fb64f");
      }
      rect(0, 24, w, h - 24, "#7fbf5a");
      rect(0, 30, w, 10, "#5c6066");
      rect(0, 30, w, 1, "#7a7f87");
      rect(0, 39, w, 1, "#4a4e54");
      for (let x = (-t * 60) % 16; x < w; x += 16) rect(x, 34, 8, 2, "#ffffff");
      const bob = Math.round(Math.sin(t * 20) * 0.5);
      if (Math.sin(t * 9) > 0) [25, 28].forEach((y, k) => rect(16 - k * 3, y + bob, 8, 1, "#ffffff")); // whoosh
      rect(32, 19 + bob, 12, 5, "#e0402e");
      rect(34, 20 + bob, 8, 3, "#cfeefc");
      rect(38, 20 + bob, 1, 3, "#e0402e");
      rect(28, 24 + bob, 22, 5, "#e0402e");
      rect(29, 23 + bob, 3, 1, "#e0402e");
      rect(29, 25 + bob, 20, 1, "#f06a5a");
      rect(28, 28 + bob, 22, 1, "#b52e22");
      rect(49, 25 + bob, 1, 2, "#fff4c2");
      for (const x of [31, 45]) {
        rect(x, 28, 5, 5, "#2b2522");
        px(x + 2, 30, "#9a9ca3");
      }
      rect(60, 4, 18, 6, "#ffffff");
      rect(62, 6, 14, 2, "#e0402e");
    }
  } else if (channel === "football") {
    // A football match: the pitch in stripes, two teams running after the ball, the score in the bar along
    // the top, and a goal now and then.
    for (let x = 0; x < w; x++) rect(x, 12, 1, h - 12, Math.floor(x / 12) % 2 ? "#4f9f3c" : "#5bb046");
    const line = "#e9f4e0";
    rect(0, 14, w, 1, line);
    rect(0, h - 3, w, 1, line);
    rect(w / 2, 14, 1, h - 17, line);
    for (let a = 0; a < 32; a++) px(w / 2 + Math.round(8 * Math.cos((a * Math.PI) / 16)), 30 + Math.round(8 * Math.sin((a * Math.PI) / 16)), line);
    for (const side of [0, 1]) {
      const x = side ? w - 9 : 0; // the penalty boxes, and the goals
      rect(x, 22, 9, 1, line);
      rect(x, 38, 9, 1, line);
      rect(side ? x : x + 8, 22, 1, 17, line);
      rect(side ? w - 1 : 0, 26, 1, 9, "#ffffff");
    }
    const ball = [w / 2 + 28 * Math.sin(t * 0.7) * Math.cos(t * 0.31), 30 + 10 * Math.sin(t * 1.1)];
    const player = (x, y, shirt, k) => {
      rect(x, y, 2, 2, "#f9d6bd");
      rect(x - 1, y + 2, 4, 2, shirt);
      rect(x, y + 4, 2, 1, "#ffffff");
      px(x + (Math.sin(t * 12 + k) > 0 ? 0 : 1), y + 5, "#2b2522");
    };
    for (let k = 0; k < 4; k++) {
      const chase = (side) => [
        ball[0] + side * (8 + k * 6) * Math.cos(t + k),
        Math.min(h - 9, Math.max(14, ball[1] + (k - 1.5) * 6 + 2 * Math.sin(t * 2 + k))),
      ];
      player(...chase(1), "#e0402e", k);
      player(...chase(-1), "#3e6fd6", k + 2);
    }
    px(ball[0], ball[1] + 2, "#3f7f30");
    rect(ball[0], ball[1], 2, 2, "#ffffff");
    px(ball[0] + 1, ball[1] + 1, "#2b2522");
    rect(0, 0, w, 12, "#1f2a1c");
    rect(23, 3, 3, 7, "#e0402e");
    number2(rect, Math.floor(t / 40) % 4, 29, 3, "#ffffff");
    rect(39, 6, 6, 1, "#ffffff");
    number2(rect, Math.floor(t / 57) % 3, 49, 3, "#ffffff");
    rect(58, 3, 3, 7, "#3e6fd6");
    if (t % 23 < 1.5) {
      rect(18, 20, 48, 15, "#f6cf4a");
      rect(20, 22, 44, 11, "#d9334a");
      let x = 28;
      for (const ch of "GOAL!") {
        GOAL[ch].forEach((row, j) => [...row].forEach((on, i) => on === "1" && px(x + i, 24 + j, "#ffffff")));
        x += GOAL[ch][0].length + 2;
      }
    }
  } else if (channel === "concert") {
    // A concert: spotlights sweeping a dark stage, the singer at the microphone, notes in the air and the
    // crowd bobbing, glow sticks waving.
    rect(0, 0, w, h, "#1b1430");
    for (let k = 0; k < 3; k++) {
      const top = 12 + k * 30 + 12 * Math.sin(t * 1.3 + k * 2);
      for (let y = 0; y < 32; y++) rect(top - y * 0.4, y, 2 + y * 0.6, 1, ["#3d2f6b", "#5a3a6e", "#2f4f7a"][k]);
      rect(top - 1, 0, 4, 2, ["#b8a8ff", "#ff9fd0", "#8fd3ff"][k]);
    }
    for (const x of [2, w - 12]) {
      rect(x, 16, 10, 16, "#0d0a18"); // the speakers
      rect(x + 3, 19, 4, 4, "#2a2440");
      rect(x + 3, 25, 4, 4, "#2a2440");
    }
    rect(0, 32, w, 4, "#3a2f58");
    rect(0, 32, w, 1, "#5a4f80");
    person2(rect, px, 41, 15 + Math.round(Math.sin(t * 4)), {
      hair: "#f2c14e",
      style: "long",
      clothes: "#e05aa0",
      mouth: Math.sin(t * 7) > -0.3,
      blink: t % 3 < 0.12,
    });
    rect(48, 20, 1, 12, "#9a9ca3");
    rect(47, 19, 2, 2, "#cfd2d8");
    for (let k = 0; k < 3; k++) {
      const y = 24 - ((t * 8 + k * 8) % 24);
      const x = 20 + k * 20 + Math.round(Math.sin(t * 2 + k) * 4);
      rect(x, y + 3, 2, 2, "#fff4c2");
      rect(x + 1, y, 1, 4, "#fff4c2");
      px(x + 2, y, "#fff4c2");
    }
    for (let x = 0; x < w; x += 6) {
      const y = 38 + (Math.sin(t * 6 + x) > 0 ? 0 : 2);
      if (hash(x, 0, 5) < 0.3) {
        rect(x + 5, y - 6, 1, 6, "#0d0a18");
        rect(x + 5, y - 8, 1, 2, ["#7fffd4", "#ff9fd0", "#fff4c2"][x % 3]);
      }
      rect(x + 1, y, 4, 4, "#0d0a18");
      rect(x, y + 4, 6, h - y - 4, "#0d0a18");
    }
  } else if (channel === "crafts") {
    // A children's craft show: the presenter at the table snipping a paper chain that grows link by link, a pot
    // of pens, and glitter twinkling in the air.
    rect(0, 0, w, h, "#fff1b8");
    for (let x = 0; x < w; x += 16) rect(x, 0, 8, 32, "#ffe89a");
    rect(0, 32, w, h - 32, "#e8a36a");
    rect(0, 32, w, 2, "#f2bb86");
    person2(rect, px, 13, 16 + Math.round(Math.sin(t * 3)), {
      hair: "#e0402e",
      style: "pigtails",
      clothes: "#3fb8c8",
      mouth: Math.sin(t * 9) > 0,
      blink: t % 4 < 0.12,
      blush: true,
    });
    const LINK = ["#e0402e", "#f6cf4a", "#3fd47a", "#3e6fd6", "#b46be0"];
    const links = 1 + (Math.floor(e / 2) % 6);
    for (let k = 0; k < links; k++) {
      const [x, y] = [22 + k * 8, 34 + (k % 2) * 2];
      rect(x, y, 8, 6, LINK[k % 5]);
      rect(x, y + 5, 8, 1, shade(LINK[k % 5], -0.25));
      rect(x + 2, y + 2, 4, 2, "#e8a36a");
    }
    const sx = 22 + links * 8;
    rect(sx + 2, Math.sin(t * 12) > 0 ? 32 : 34, 6, 1, "#c9ced6");
    rect(sx + 2, 36, 6, 1, "#c9ced6");
    px(sx + 2, 35, "#7d8ca3");
    rect(sx - 2, 34, 4, 4, "#e0402e");
    px(sx - 1, 35, "#e8a36a");
    rect(77, 20, 1, 4, "#e0402e"); // the pot of pens
    rect(79, 18, 1, 6, "#3fd47a");
    rect(81, 20, 1, 4, "#f6cf4a");
    rect(76, 24, 7, 8, "#3e6fd6");
    rect(76, 24, 7, 1, "#6f9ef0");
    for (let k = 0; k < 6; k++) {
      const s = Math.sin(t * 5 + k * 2.3);
      if (s < 0.5) continue;
      const [x, y] = [24 + ((k * 26) % 48), 4 + ((k * 14) % 22)];
      px(x, y, "#ffffff");
      if (s > 0.8) [-1, 1].forEach((d) => (px(x + d, y, "#fff8d8"), px(x, y + d, "#fff8d8")));
    }
  } else if (channel === "baking") {
    // A baking contest in a tent: bunting along the top, two bakers at their benches, and a cake in the middle
    // rising layer by layer until the icing and a cherry go on top.
    rect(0, 0, w, h, "#f3f6ee");
    for (let x = 0; x < w; x += 12) rect(x, 0, 6, 30, "#e6eef0");
    rect(0, 0, w, 2, "#c9b79c");
    const FLAG = ["#e0402e", "#f6cf4a", "#3e6fd6", "#3fd47a"];
    for (let x = 2; x < w; x += 8) {
      const c = FLAG[(x >> 3) % 4];
      rect(x, 2, 5, 1, c);
      rect(x + 1, 3, 3, 1, c);
      px(x + 2, 4, c);
    }
    person2(rect, px, 11, 14, { hair: "#5e3624", style: "bun", clothes: "#f28aa8", mouth: Math.sin(t * 7) > 0.4, blink: t % 4 < 0.12 });
    person2(rect, px, 73, 14, { hair: "#f2c14e", clothes: "#8fd3ff", blink: (t + 1.5) % 4 < 0.12 });
    rect(8, 25, 6, 5, "#ffffff"); // their aprons
    rect(70, 25, 6, 5, "#ffffff");
    rect(0, 30, w, 4, "#d9d3c7");
    rect(0, 30, w, 1, "#ebe6dc");
    rect(0, 34, w, h - 34, "#8fc9d9");
    for (let x = 10; x < w; x += 18) {
      rect(x, 38, 8, 2, "#bfe3ec");
      rect(x - 5, 34, 1, h - 34, "#7fb8c8");
    }
    rect(18, 26, 8, 3, "#ffffff"); // her bowl, and the whisk going round in it
    rect(19, 29, 6, 1, "#d6dde8");
    rect(22 + Math.round(Math.cos(t * 10) * 2), 21, 1, 5, "#9a9ca3");
    rect(60, 29, 12, 1, "#9a9ca3"); // his tray of biscuits
    for (const x of [61, 66]) {
      rect(x, 26, 4, 3, "#c98f45");
      px(x + 1, 27, "#5e3624");
    }
    rect(32, 28, 20, 1, "#ffffff");
    rect(38, 29, 8, 1, "#d6dde8");
    const layers = 1 + (Math.floor(e / 2.5) % 5);
    for (let k = 0; k < Math.min(3, layers); k++) {
      const y = 22 - k * 6 - (k === layers - 1 ? Math.max(0, 1 - ((e / 2.5) % 1) * 4) * 10 : 0);
      rect(34, y, 16, 6, "#e8b46a");
      rect(34, y, 16, 1, "#fff8ef");
      rect(34, y + 1, 16, 1, "#e0607a");
      rect(34, y + 5, 16, 1, "#d49a50");
    }
    if (layers > 3) {
      rect(34, 10, 16, 2, "#f28aa8");
      [36, 41, 46].forEach((x, k) => rect(x, 12, 2, 2 + (k % 2) * 2, "#f28aa8"));
    }
    if (layers > 4) {
      rect(41, 7, 3, 3, "#d9334a");
      px(41, 7, "#ff7f8a");
      rect(43, 5, 1, 2, "#4f9a3a");
      px(44, 4, "#4f9a3a");
      for (let k = 0; k < 4; k++) if (Math.sin(t * 8 + k * 1.6) > 0.3) px(30 + k * 8, 6 + (k % 2) * 8, "#f6cf4a");
    }
  } else if (channel === "travel") {
    // A travel show: the presenter with her backpack waving from somewhere new every few seconds, the pyramids, a
    // tall iron tower, a windmill among the tulips, a lake under snowy mountains, with the place's name below.
    const place = (Math.floor(e / 3) + Math.floor(t - e)) % 4;
    if (place === 0) {
      rect(0, 0, w, h, "#ffd8a0");
      rect(0, 0, w, 8, "#ffc890");
      disc(rect, 68, 10, 4, "#fff1b8");
      rect(0, 32, w, h - 32, "#e8c27a");
      for (let k = 0; k < 4; k++) rect((k * 29) % w, 35 + k * 2, 10, 1, "#d9ae66");
      const pyramid = (cx, top, n) => {
        for (let r = 0; r < n; r++) {
          rect(cx - r, top + r, r + 1, 1, "#e0b46a");
          rect(cx + 1, top + r, r, 1, "#b8833f");
          if (r % 3 === 2) for (let x = cx - r + 1; x <= cx; x += 4) px(x, top + r, "#c99a52");
        }
      };
      pyramid(34, 12, 20);
      pyramid(60, 20, 12);
    } else if (place === 1) {
      rect(0, 0, w, h, "#9fd8f5");
      cloud(rect, ((t * 6) % (w + 20)) - 20, 4, "#ffffff");
      rect(0, 34, w, h - 34, "#7fbf5a");
      for (let y = 4; y < 34; y++) {
        const half = Math.floor(((y - 4) / 28) ** 2 * 12);
        rect(48 - half, y, half * 2 + 2, 1, "#8a6f5a");
        for (let i = 1; i < half * 2; i++) if ((i + y) % 4 === 0) px(48 - half + i, y, "#6b5444");
        if (y > 26) rect(49 - (y - 26), y, (y - 26) * 2, 1, "#9fd8f5");
      }
      rect(44, 15, 10, 2, "#6b5444");
      rect(40, 24, 18, 2, "#6b5444");
      rect(48, 1, 2, 3, "#6b5444");
      rect(50, 1, 3, 2, "#d9334a");
      for (const x of [22, 68]) {
        rect(x + 2, 30, 2, 4, "#7a5236");
        disc(rect, x + 3, 27, 4, "#4f9a3a");
      }
    } else if (place === 2) {
      rect(0, 0, w, h, "#bfe6fb");
      const TULIP = ["#e0402e", "#7fbf5a", "#f6cf4a", "#7fbf5a", "#f28aa8", "#7fbf5a"];
      for (let y = 30; y < h; y++) {
        const c = TULIP[Math.floor((y - 30) / 2) % 6];
        rect(0, y, w, 1, c);
        if (c !== "#7fbf5a" && y % 2 === 0) for (let x = y % 4; x < w; x += 4) px(x, y, shade(c, 0.3));
      }
      for (let y = 16; y < 32; y++) {
        const inset = Math.floor((32 - y) / 8);
        rect(50 + inset, y, 10 - 2 * inset, 1, "#8a5a34");
      }
      rect(52, 12, 6, 4, "#5c3a26");
      rect(54, 26, 2, 6, "#3b3330");
      px(53, 20, "#fff1b8");
      for (let k = 0; k < 4; k++) {
        const a = t * 1.5 + (k * Math.PI) / 2;
        for (let r = 2; r < 15; r++) {
          px(55 + Math.cos(a) * r, 14 + Math.sin(a) * r, "#fff8ef");
          if (r > 4) px(55 + Math.cos(a) * r - Math.sin(a) * 2, 14 + Math.sin(a) * r + Math.cos(a) * 2, "#d9c9a8");
        }
      }
      rect(54, 13, 2, 2, "#5c3a26");
    } else {
      rect(0, 0, w, h, "#a8d4f0");
      rect(0, 30, w, h - 30, "#4f9fd0");
      for (let x = 0; x < w; x++) {
        const top = Math.round(Math.min(6 + Math.abs(x - 30) * 0.9, 12 + Math.abs(x - 62) * 0.8));
        if (top < 30) {
          rect(x, top, 1, 30 - top, x % 10 ? "#7b8aa3" : "#6f7e98");
          if (top < 14) rect(x, top, 1, 14 - top + (x % 3), "#ffffff");
          rect(x, 30, 1, Math.min(6, Math.round((30 - top) * 0.25)), "#5f8fbf"); // its reflection
        }
      }
      rect(0, 30, w, 1, "#8fc6e6");
      for (let k = 0; k < 7; k++) rect(((k * 22 + t * 4) % (w + 8)) - 8, 33 + (k % 3) * 3, 6, 1, "#8fc6e6");
    }
    const top = 27 - Math.round(Math.abs(Math.sin(t * 3)));
    person2(rect, px, 13, top, { hair: "#47281b", style: "pony", clothes: "#f39a33", arms: false, mouth: Math.sin(t * 9) > 0, blink: t % 4 < 0.12 });
    rect(19, top + 9, 4, 9, "#3e6fd6"); // the backpack
    rect(19, top + 12, 4, 1, "#2f5ab0");
    rect(5, top + 9, 3, 2, "#f39a33"); // her arm up, waving
    rect(5, top + (Math.sin(t * 8) > 0 ? 3 : 5), 2, 6, "#f9d6bd");
    rect(0, 42, w, h - 42, "#ffffff");
    rect(30, 44, 2, 2, "#d9334a");
    rect(34, 44, 12 + place * 4, 2, "#5c6066");
    if (e % 3 < 0.25) rect(w * (e % 3) * 4, 0, w, h, "#fff8ef"); // a white wipe to the next place
  } else if (channel === "ocean") {
    // An ocean documentary: sunbeams slanting down through the blue, seaweed swaying on the sand, a shoal of fish
    // turning together, a turtle paddling past and bubbles rising.
    const BLUE = ["#3fa4d8", "#3497cc", "#2b88bf", "#237ab1", "#1c6ca3"];
    BLUE.forEach((c, k) => {
      rect(0, k * 8, w, 8, c);
      if (k) for (let x = 0; x < w; x += 2) px(x + (k % 2), k * 8 - 1, c); // dithered into the band above
    });
    for (let k = 0; k < 3; k++) {
      const x0 = 8 + k * 26 + Math.round(Math.sin(t * 0.7 + k) * 4);
      for (let y = 0; y < 36; y++) rect(x0 + Math.round(y * 0.5), y, 4, 1, "rgba(150, 215, 245, 0.3)");
    }
    rect(0, 40, w, h - 40, "#e8d29a");
    rect(0, 40, w, 1, "#f2e0b0");
    for (let x = 4; x < w; x += 14) px(x, 44 + (x % 3), "#cdb27a");
    rect(20, 44, 3, 2, "#f7c6d6"); // a shell and a starfish
    rect(64, 44, 3, 1, "#f39a33");
    rect(65, 43, 1, 3, "#f39a33");
    for (let k = 0; k < 5; k++)
      for (let y = 0; y < 10 + (k % 3) * 4; y++)
        rect(6 + k * 18 + Math.round(Math.sin(t * 2 + y * 0.25 + k) * (y / 10) * 2), 39 - y, 2, 1, k % 2 ? "#3fae6a" : "#2f8f55");
    const cx = ((t * 10) % (w + 40)) - 20;
    const cy = 16 + 6 * Math.sin(t * 0.9);
    for (let k = 0; k < 7; k++) {
      const fx = cx + (k % 3) * 6 - Math.floor(k / 3) * 6;
      const fy = cy + ((k % 3) - 1) * 4 + Math.sin(t * 4 + k);
      rect(fx, fy, 4, 2, "#f6cf4a");
      px(fx + 1, fy, "#f39a33");
      px(fx + 3, fy, "#2b2522");
      rect(fx - 1, fy, 1, 2, "#f39a33");
      px(fx - 2, fy + (Math.sin(t * 10 + k) > 0 ? -1 : 2), "#f39a33");
    }
    const tx = w + 8 - ((t * 5 + 40) % (w + 32));
    const ty = 26 + Math.round(Math.sin(t) * 2);
    const flap = Math.sin(t * 4) > 0;
    rect(tx + 2, ty + (flap ? -2 : 6), 4, 2, "#9ccf6a");
    rect(tx + 8, ty + (flap ? 6 : -2), 3, 2, "#9ccf6a");
    rect(tx + 1, ty, 10, 6, "#5a8f3c");
    rect(tx, ty + 1, 12, 4, "#5a8f3c");
    rect(tx + 1, ty + 5, 10, 1, "#9ccf6a");
    [
      [3, 2],
      [6, 1],
      [8, 3],
      [5, 3],
    ].forEach(([dx, dy]) => px(tx + dx, ty + dy, "#7fb35a"));
    rect(tx - 4, ty + 2, 4, 3, "#9ccf6a");
    px(tx - 3, ty + 2, "#2b2522");
    px(tx + 12, ty + 3, "#9ccf6a");
    for (let k = 0; k < 5; k++) {
      const x = 10 + k * 16 + Math.round(Math.sin(t * 3 + k) * 2);
      const y = 38 - ((t * 10 + k * 14) % 40);
      rect(x, y, 2, 2, "#cfeefc");
      px(x, y, "#ffffff");
    }
  } else if (channel === "dance") {
    // A pop music video: three dancers moving in step on a floor of flashing tiles under a glitter ball, the
    // backdrop changing colour on every beat and hearts floating up.
    const beat = Math.floor(t * 2.5);
    rect(0, 0, w, h, ["#ff8fb4", "#b48cff", "#7fd6ff", "#ffd36e"][beat % 4]);
    for (let x = beat % 2 ? 0 : 6; x < w; x += 12) rect(x, 0, 6, 34, "#ffffff40");
    rect(42, 0, 1, 3, "#3b3330");
    disc(rect, 42.5, 6, 3, "#c9ced6");
    px(41 + (beat % 3), 5 + (beat % 2), "#ffffff");
    for (let x = 0; x < w; x += 12)
      for (let r = 0; r < 2; r++) {
        const lit = (x / 12 + r + beat) % 2;
        rect(x, 34 + r * 7, 12, 7, lit ? "#3a2f58" : "#e05aa0");
        if (!lit) rect(x + 1, 35 + r * 7, 3, 1, "#f08cc4");
      }
    const move = beat % 4;
    const HAIR = ["#221e21", "#f2c14e", "#b46be0"];
    const STYLE = ["spiky", "pigtails", "bob"];
    const CLOTHES = ["#ffffff", "#3e6fd6", "#2b2c33"];
    for (let k = 0; k < 3; k++) {
      const x = 19 + k * 23 + (move === 2 ? -2 : 0);
      const top = move === 3 ? 10 : 14;
      const skin = "#f9d6bd";
      rect(x - 3, top + 16, 2, 6, "#2b2c33");
      rect(x + 1, top + 16, 2, 6, "#2b2c33");
      person2(rect, px, x, top, { hair: HAIR[k], style: STYLE[k], clothes: CLOTHES[k], arms: false, mouth: k === 1 && Math.sin(t * 9) > 0 });
      if (move === 0 || move === 2) rect(x - 8, top + 3, 2, 8, skin);
      else rect(x - 10, top + 10, 4, 2, skin);
      if (move === 0) rect(x + 6, top + 3, 2, 8, skin);
      else rect(x + 6, top + 10, 4, 2, skin);
    }
    for (let k = 0; k < 3; k++) heart(rect, 8 + k * 30 + Math.round(Math.sin(t * 2 + k) * 2), 30 - ((t * 8 + k * 12) % 32), "#ffffff");
  } else if (channel === "quiz") {
    // A quiz show: the host at her stand with the question up on the board, two contestants at their buzzers,
    // whoever is faster lighting up, and the scores going up by ten.
    rect(0, 0, w, h, "#2a1f5c");
    for (let x = 2; x < w; x += 8) rect(x, 0, 4, 2, (Math.floor(t * 4) + (x >> 3)) % 4 ? "#6b5bb0" : "#f6cf4a");
    rect(26, 4, 32, 14, "#1d3f7a");
    rect(26, 4, 32, 2, "#8fd3ff");
    rect(26, 17, 32, 1, "#14305e");
    ["111", "001", "010", "000", "010"].forEach((row, y) => [...row].forEach((on, x) => on === "1" && rect(39 + x * 2, 7 + y * 2, 2, 2, "#ffffff")));
    const on = Math.floor(t - e);
    const round = Math.floor(e / 3);
    const buzzed = e % 3 > 1;
    const who = (r) => (hash(r, on, 9) < 0.5 ? 0 : 1);
    const score = [0, 0];
    for (let r = 0; r < round + (buzzed ? 1 : 0); r++) score[who(r)] += 10;
    person2(rect, px, 41, 20, { hair: "#f2c14e", style: "bob", clothes: "#e05aa0", mouth: !buzzed && Math.sin(t * 9) > 0, blink: t % 4 < 0.12 });
    rect(34, 32, 16, 16, "#6b5bb0");
    rect(34, 32, 16, 2, "#8c7dd0");
    rect(41, 38, 2, 4, "#f6cf4a");
    rect(39, 39, 6, 2, "#f6cf4a");
    [13, 73].forEach((x, k) => {
      const lit = buzzed && who(round) === k;
      person2(rect, px, x, 16, {
        hair: k ? "#221e21" : "#5e3624",
        style: k ? "spiky" : "pony",
        clothes: k ? "#3fd47a" : "#f39a33",
        mouth: lit,
        blush: lit,
      });
      rect(x - 9, 32, 18, 16, k ? "#e0402e" : "#3e6fd6");
      rect(x - 9, 32, 18, 2, lit && t % 0.3 < 0.15 ? "#ffffff" : k ? "#f0706a" : "#6f9ef0");
      rect(x - 2, 29, 4, 3, lit ? "#ffe58a" : "#8a7a3a");
      number2(rect, score[k], x - (score[k] < 10 ? 2 : 5), 37, "#ffffff");
    });
  } else if (channel === "garden") {
    // A gardening show: the presenter in her sun hat watering a bed of flowers that come up and open while you
    // watch, a bee going from flower to flower, and a robin on the fence.
    rect(0, 0, w, h, "#bfe6fb");
    disc(rect, 66, 8, 4, "#ffe58a");
    rect(0, 18, w, 2, "#c9a477");
    for (let x = 2; x < w; x += 8) {
      rect(x, 14, 4, 12, "#d9b98a");
      rect(x + 1, 13, 2, 1, "#d9b98a");
      rect(x + 3, 14, 1, 12, "#c9a477");
    }
    rect(0, 26, w, h - 26, "#7fbf5a");
    for (let x = 3; x < w; x += 9) rect(x, 28 + (x % 4) * 4, 1, 2, "#6aae4f");
    rect(28, 34, 52, 8, "#8a5a34");
    rect(28, 34, 52, 1, "#6e4528");
    for (let x = 30; x < 80; x += 5) px(x, 37 + (x % 3), "#a06a40");
    const BLOOM = ["#e0402e", "#f28aa8", "#b46be0", "#f6cf4a", "#ffffff", "#f39a33"];
    for (let k = 0; k < 6; k++) {
      const x = 33 + k * 8;
      const grow = Math.min(1, Math.max(0, (e - k * 0.8) / 3));
      const tall = 2 + Math.round(grow * 10);
      const top = 34 - tall;
      rect(x, top, 1, tall, "#4f9a3a");
      if (tall > 5) {
        px(x + 1, top + Math.floor(tall / 2), "#5bb046");
        px(x - 1, top + Math.floor(tall / 2) + 2, "#5bb046");
      }
      if (grow < 1) rect(x, top - 1, 1, 2, grow > 0.6 ? BLOOM[k] : "#7cc463");
      else {
        const c = BLOOM[k];
        rect(x - 1, top - 4, 3, 1, c);
        rect(x - 2, top - 3, 5, 3, c);
        rect(x - 1, top, 3, 1, c);
        px(x, top - 2, k === 3 ? "#f39a33" : "#f6cf4a");
      }
    }
    person2(rect, px, 13, 18, { hair: "#5e3624", clothes: "#5bb046", mouth: Math.sin(t * 9) > 0, blink: t % 4 < 0.12 });
    rect(7, 18, 12, 1, "#e8c27a");
    rect(10, 15, 6, 3, "#e8c27a");
    rect(10, 17, 6, 1, "#d9334a");
    rect(21, 24, 4, 1, "#2f5ab0"); // the watering can and the water out of it
    rect(20, 26, 6, 4, "#3e6fd6");
    rect(26, 26, 2, 1, "#3e6fd6");
    px(28, 25, "#3e6fd6");
    for (let k = 0; k < 3; k++) px(29 + k, 26 + Math.floor((t * 8 + k * 2) % 8), "#8fd3ff");
    const bx = 56 + 18 * Math.sin(t * 0.9);
    const by = 16 + 6 * Math.sin(t * 2.3);
    rect(bx + 1, by - 2, 2, 2, Math.sin(t * 20) > 0 ? "#ffffff" : "#cfeefc");
    rect(bx, by, 4, 3, "#f6cf4a");
    rect(bx + 1, by, 1, 3, "#2b2522");
    px(bx + 4, by + 1, "#2b2522");
    const hop = Math.sin(t * 3) > 0.8 ? 2 : 0;
    rect(72, 9 - hop, 2, 2, "#5e3d28");
    rect(74, 9 - hop, 5, 4, "#7a5236");
    rect(77, 7 - hop, 3, 3, "#7a5236");
    rect(77, 10 - hop, 2, 2, "#e0602e");
    px(78, 8 - hop, "#2b2522");
    px(80, 8 - hop, "#3b3330");
    px(76, 13 - hop, "#3b3330");
  } else if (channel === "tennis") {
    // A tennis match seen from above: the blue court and its white lines, the net across the middle, the two
    // players running to meet the ball as it goes back and forth, and the games won along the top.
    rect(0, 0, w, h, "#5bb046");
    for (let y = 14; y < h; y += 6) rect(0, y, w, 3, "#53a63f");
    rect(10, 12, 64, 34, "#3f7fc0");
    const line = "#ffffff";
    rect(10, 12, 64, 1, line);
    rect(10, 45, 64, 1, line);
    rect(10, 12, 1, 34, line);
    rect(73, 12, 1, 34, line);
    rect(10, 16, 64, 1, line);
    rect(10, 41, 64, 1, line);
    rect(24, 16, 1, 26, line);
    rect(59, 16, 1, 26, line);
    rect(24, 28, 36, 1, line);
    rect(43, 10, 1, 38, "#2f6aa6");
    rect(41, 10, 2, 38, "#e9f4e0");
    rect(41, 10, 2, 2, "#3b3330");
    rect(41, 46, 2, 2, "#3b3330");
    const shot = Math.floor(t * 0.8);
    const f = (t * 0.8) % 1;
    const aim = (n) => 28 + Math.round(10 * Math.sin(n * 2.1));
    const right = shot % 2 === 0;
    const x = right ? 14 + 54 * f : 68 - 54 * f;
    const y = aim(shot) + (aim(shot + 1) - aim(shot)) * f;
    const lead = (side) => (right === side ? aim(shot + 1) : aim(shot)); // each one runs to where the ball will come
    for (const [px0, side, shirt] of [
      [3, false, "#e0402e"],
      [77, true, "#f6cf4a"],
    ]) {
      const py = lead(side);
      rect(px0, py - 2, 4, 5, shirt);
      rect(px0 + 1, py - 5, 2, 3, "#f9d6bd");
      rect(side ? px0 - 2 : px0 + 4, py - 3, 2, 3, "#3b3330"); // the racket
    }
    rect(x, y + 1, 2, 1, "#2f6aa6");
    rect(x, y - Math.sin(f * Math.PI) * 6, 2, 2, "#e8f25a");
    rect(0, 0, w, 10, "#1f2a1c");
    rect(22, 2, 3, 6, "#e0402e");
    number2(rect, Math.floor(t / 20) % 7, 28, 2, "#ffffff");
    number2(rect, Math.floor(t / 27) % 7, 50, 2, "#ffffff");
    rect(59, 2, 3, 6, "#f6cf4a");
  } else if (channel === "anime") {
    // An anime drama: cherry petals drifting down as it cuts between her close-up (big shining eyes), his, and
    // the two of them under the blossom tree.
    const shot = Math.floor(e / 3) % 3;
    if (shot === 2) {
      rect(0, 0, w, h, "#ffe6ee");
      rect(0, 38, w, h - 38, "#9ccf6a");
      rect(0, 38, w, 1, "#b4dd8a");
      rect(56, 14, 6, 25, "#7a5236");
      rect(56, 14, 2, 25, "#664330");
      rect(50, 18, 6, 2, "#7a5236");
      rect(40, 3, 40, 12, "#f7b8cc");
      rect(44, 0, 30, 18, "#f7b8cc");
      rect(38, 6, 6, 6, "#f7b8cc");
      for (let k = 0; k < 24; k++) px(39 + Math.floor(hash(k, 1, 23) * 40), Math.floor(hash(k, 2, 23) * 17), k % 3 ? "#ff9fbf" : "#ffd6e2");
      person2(rect, px, 19, 22, { hair: "#b46be0", style: "long", clothes: "#ffffff", collar: "#d9334a", blush: true, blink: t % 4 < 0.12 });
      person2(rect, px, 33, 22, { hair: "#2b2c33", style: "spiky", clothes: "#3e6fd6", mouth: Math.sin(t * 7) > 0 });
      if (t % 2 < 1) heart(rect, 24, 16 - (t % 1) * 6, "#ff6f9a");
    } else {
      const her = shot === 0;
      const hair = her ? "#b46be0" : "#2b2c33";
      const skin = "#f9d6bd";
      rect(0, 0, w, h, her ? "#ffd1e0" : "#cfe3ff");
      for (let k = 0; k < 6; k++)
        if (Math.sin(t * 4 + k * 1.3) > 0.2) {
          const [x, y] = [4 + ((k * 7) % 9) * 2 + (k % 2) * 60, 6 + ((k * 5) % 17) * 2];
          px(x, y, "#ffffff");
          px(x - 1, y, "#ffffffa0");
          px(x + 1, y, "#ffffffa0");
          px(x, y - 1, "#ffffffa0");
          px(x, y + 1, "#ffffffa0");
        }
      if (her) rect(22, 6, 40, 38, hair); // her long hair behind
      rect(26, 8, 32, 30, skin);
      rect(28, 38, 28, 2, skin);
      rect(31, 40, 22, 2, skin);
      rect(26, 12, 1, 26, shade(skin, -0.08));
      rect(22, 2, 40, 10, hair);
      for (let x = 26; x < 58; x += 5) {
        rect(x, 12, 3, 2, hair);
        px(x + 1, 14, hair);
      }
      for (let x = 30; x < 54; x += 6) rect(x, 5, 3, 1, shade(hair, 0.35));
      if (her) {
        rect(22, 8, 5, 34, hair);
        rect(57, 8, 5, 34, hair);
      } else {
        for (let x = 22; x < 62; x += 8) rect(x + 2, 0, 3, 2, hair);
        rect(23, 10, 3, 10, hair);
        rect(58, 10, 3, 10, hair);
        rect(24, 20, 2, 6, skin);
        rect(58, 20, 2, 6, skin);
      }
      const eye = her ? "#e05aa0" : "#3e6fd6";
      const lid = "#3b2a4a";
      const blink = t % 4 < 0.15;
      for (const ex of [30, 46]) {
        rect(ex + 1, 15, 6, 1, shade(hair, -0.25)); // the brows
        if (blink) {
          rect(ex, 24, 8, 1, lid);
          continue;
        }
        rect(ex, 18, 8, 10, lid);
        rect(ex + 1, 21, 6, 6, eye);
        rect(ex + 2, 24, 4, 2, shade(eye, 0.35));
        rect(ex + 3, 22, 2, 2, lid);
        rect(ex + 1, 20, 2, 2, "#ffffff");
        px(ex + 5, 25, "#ffffff");
        if (her) {
          rect(ex - 1, 17, 10, 1, lid);
          px(ex === 30 ? ex - 2 : ex + 9, 18, lid);
        }
      }
      px(42, 31, shade(skin, -0.2));
      if (her) {
        rect(28, 30, 6, 2, "#f7a1b5");
        rect(50, 30, 6, 2, "#f7a1b5");
      }
      const open = Math.sin(t * 8) > 0.3;
      rect(40, 35, 4, open ? 3 : 1, open ? "#8a2e2e" : "#c4503f");
      if (open) rect(41, 37, 2, 1, "#c4503f");
      rect(18, 42, 48, 6, her ? "#ffffff" : "#2b2c33");
      rect(36, 42, 12, 2, skin);
      if (her) {
        rect(36, 44, 12, 3, "#d9334a"); // her ribbon
        rect(41, 44, 2, 4, "#b52238");
      } else rect(38, 42, 8, 2, "#ffffff");
    }
    for (let k = 0; k < 12; k++) {
      const x = ((k * 7 + t * (6 + (k % 3) * 2)) % (w + 4)) - 2 + Math.sin(t * 2 + k) * 3;
      const y = (k * 11 + t * 8) % h;
      rect(x, y, 2, 1, k % 3 ? "#ff9fbf" : "#ffffff");
      if (k % 2) px(x + 1, y + 1, k % 3 ? "#ff9fbf" : "#ffffff");
    }
  } else if (channel === "film") {
    // A late-night film between black bars, the subtitles changing in the bottom one: a rainy city at night with
    // its windows lit, then two people talking under a street lamp, the old film flickering with specks of dust.
    rect(0, 0, w, h, "#000000");
    if (Math.floor(e / 4) % 2 === 0) {
      rect(0, 6, w, 34, "#1b2340");
      rect(0, 6, w, 10, "#161d38");
      disc(rect, 69, 13, 3, "#f3ecc8");
      px(68, 12, "#d8d0a8");
      for (let b = 0; b * 12 < w; b++) {
        const tall = 10 + Math.floor(hash(b, 0, 11) * 16);
        const x = b * 12;
        rect(x, 40 - tall, 10, tall, "#2b2f45");
        rect(x, 40 - tall, 10, 1, "#3a3f5a");
        if (hash(b, 1, 11) < 0.4) rect(x + 4, 37 - tall, 1, 3, "#2b2f45");
        for (let y = 42 - tall; y < 38; y += 4)
          for (let wx = 2; wx < 9; wx += 3) if (hash(x + wx, y, 12) < 0.4 + 0.2 * Math.sin(t * 0.5 + b)) rect(x + wx, y, 2, 2, "#f6d77a");
      }
      for (let k = 0; k < 20; k++) rect((k * 9 + t * 12) % w, 6 + ((k * 13 + t * 40) % 31), 1, 3, "#6f7fa8");
    } else {
      rect(0, 6, w, 34, "#141a2e");
      for (let y = 14; y < 36; y++) rect(40 - (y - 14) * 0.6, y, Math.round((y - 14) * 1.2) + 2, 1, "#2a2e48");
      rect(0, 36, w, 4, "#22263a");
      rect(28, 36, 28, 1, "#34385a");
      rect(40, 12, 2, 24, "#3b3a5c");
      rect(37, 9, 8, 2, "#3b3a5c");
      rect(38, 11, 6, 3, "#ffe58a");
      for (const [x, hat] of [
        [22, true],
        [56, false],
      ]) {
        rect(x, 20, 6, 6, "#0b0d16");
        rect(x - 2, 26, 10, 11, "#0b0d16");
        rect(x - 1, 37, 8, 1, "#0b0d16");
        if (hat) {
          rect(x - 2, 19, 10, 1, "#0b0d16");
          rect(x, 16, 6, 3, "#0b0d16");
        } else rect(x - 1, 19, 8, 9, "#0b0d16");
      }
    }
    if (e % 2 < 1.6) {
      const line = Math.floor(e / 2) + Math.floor(t - e);
      const words = [0, 1, 2, 3].map((k) => 4 + Math.floor(hash(line, k, 13) * 10));
      let x = Math.round((w - words.reduce((n, word) => n + word + 3, -3)) / 2);
      for (const word of words) {
        rect(x, 42, word, 2, "#e8e8e8");
        for (let i = 2; i < word - 1; i += 3) px(x + i, 42 + (i % 2), "#000000");
        x += word + 3;
      }
    }
    const frame = Math.floor(t * 12);
    for (let k = 0; k < 3; k++) if (hash(frame, k, 14) < 0.4) px(hash(frame, k, 15) * w, 6 + hash(frame, k, 16) * 34, "#d8d0b8");
    if (hash(frame >> 2, 0, 17) < 0.2) rect(Math.floor(hash(frame >> 2, 1, 17) * w), 6, 1, 34, "#3a3a44");
  }
}

// The two of them playing on the TV: two paddles and a ball, the points marked at the top.
export function drawTvGame(g, w, h, t) {
  const { rect } = pen(g);
  rect(0, 0, w, h, "#141a2e");
  for (let y = 2; y < h; y += 6) rect(w / 2, y, 1, 3, "#56607e");
  const at = (s) => [w / 2 + 34 * Math.sin(s * 1.9), h / 2 + 18 * Math.sin(s * 3.1)];
  const ball = at(t);
  const left = ball[1] - 6 + 4 * Math.sin(t * 2.3);
  const right = ball[1] - 6 + 4 * Math.sin(t * 2.7 + 1);
  rect(4, left, 2, 12, "#f28aa8");
  rect(4, left, 1, 12, "#f8b8cc");
  rect(w - 6, right, 2, 12, "#8fd3ff");
  rect(w - 6, right, 1, 12, "#c4e8ff");
  [0.06, 0.03].forEach((dt, k) => rect(...at(t - dt), 3, 3, ["#3a4466", "#6a7494"][k])); // its trail
  rect(ball[0], ball[1], 3, 3, "#ffffff");
  rect(w / 2 - 12, 2, 4, 6, "#f28aa8");
  rect(w / 2 + 8, 2, 4, 6, "#8fd3ff");
}
