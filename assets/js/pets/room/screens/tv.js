/*******************************************************************************
 * The TV's channels (a nature programme, a cartoon, a cooking show, the news,
 * the weather forecast with today's real sky, adverts, football, a concert,
 * crafts, baking, travel, the ocean, a pop video, a quiz, gardening, tennis, an
 * anime drama, a late-night film) and the game the two of them play on it.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number, person } from "./pen.js";

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
];

// The TV: `channel` (CHANNELS), `t` the clock, `e` how long it has been on this channel, `sky` the weather
// outside ("sunny", "cloudy" or "rain"), which the forecast shows for home.
export function drawChannel(g, w, h, channel, t, e, sky = "sunny") {
  const { rect, px } = pen(g);
  if (channel === "nature" && Math.floor(e / 6) % 2) {
    // ...then a pond: a duck and her ducklings paddling across, and a frog hopping from lily pad to lily pad.
    rect(0, 0, w, h, "#a8dcf2");
    rect(0, 9, w, 2, "#6aae4f");
    rect(0, 11, w, h - 11, "#4f9fd0");
    for (let k = 0; k < 6; k++) rect(((k * 9 + t * 2) % (w + 4)) - 4, 13 + (k % 3) * 3, 3, 1, "#7fc0e6");
    rect(3, 19, 6, 2, "#5bb046");
    rect(27, 15, 6, 2, "#5bb046");
    const dx = ((t * 3) % (w + 20)) - 6;
    rect(dx, 13, 5, 2, "#ffffff");
    rect(dx + 4, 11, 2, 2, "#ffffff");
    px(dx + 5, 11, "#2b2522");
    px(dx + 6, 12, "#f39a33");
    for (let k = 1; k < 4; k++) {
      const bob = Math.sin(t * 6 + k) > 0 ? 1 : 0;
      rect(dx - 4 * k, 14 + bob, 2, 1, "#f6cf4a");
      px(dx - 4 * k + 1, 13 + bob, "#f6cf4a");
    }
    const hop = (t * 0.5) % 2;
    const [from, to] =
      hop < 1
        ? [
            [4, 18],
            [28, 14],
          ]
        : [
            [28, 14],
            [4, 18],
          ];
    const j = Math.max(0, ((hop % 1) - 0.7) / 0.3); // 0 sitting, then 0 to 1 through the jump
    const fx = from[0] + (to[0] - from[0]) * j;
    const fy = from[1] + (to[1] - from[1]) * j - Math.sin(j * Math.PI) * 6;
    rect(fx, fy, 4, 2, "#3fae4f");
    px(fx, fy - 1, "#3fae4f");
    px(fx + 3, fy - 1, "#3fae4f");
  } else if (channel === "nature") {
    // Hills under a sky, a cloud going by and a sheep hopping along...
    rect(0, 0, w, h, "#8fd0f5");
    rect(30, 3, 5, 5, "#ffe58a");
    const cx = ((t * 4) % (w + 12)) - 8;
    rect(cx, 5, 8, 2, "#ffffff");
    rect(cx + 2, 4, 4, 1, "#ffffff");
    for (let x = 0; x < w; x++) {
      const top = Math.round(14 + 3 * Math.sin(x * 0.25 + 1));
      rect(x, top, 1, h - top, x % 7 ? "#79c25c" : "#6aae4f");
    }
    const sx = ((t * 6) % (w + 8)) - 4;
    const sy = 13 - Math.abs(Math.sin(t * 5)) * 2;
    rect(sx, sy, 4, 3, "#ffffff");
    rect(sx + 3, sy, 2, 2, "#3b3330");
  } else if (channel === "cartoon" && Math.floor(e / 6) % 2) {
    // ...then a bunny bouncing across the meadow, the carrots vanishing as she gets to them.
    rect(0, 0, w, h, "#cdeefd");
    rect(4, 3, 7, 2, "#ffffff");
    rect(6, 2, 3, 1, "#ffffff");
    rect(0, 17, w, 7, "#8fd16a");
    const bx = ((t * 6) % (w + 8)) - 4;
    for (let x = 8; x < w; x += 10)
      if (x > bx + 3) {
        rect(x, 15, 2, 2, "#f39a33");
        px(x, 14, "#5bb046");
        px(x + 1, 13, "#5bb046");
      }
    const y = 12 - Math.abs(Math.sin(t * 6)) * 4;
    rect(bx, y + 2, 5, 3, "#ffffff");
    rect(bx + 4, y, 3, 3, "#ffffff");
    rect(bx + 4, y - 3, 1, 3, "#ffffff");
    rect(bx + 6, y - 3, 1, 3, "#ffffff");
    px(bx + 6, y - 2, "#f7a1b5");
    px(bx + 6, y + 1, "#2b2522");
    px(bx - 1, y + 2, "#ffffff");
  } else if (channel === "cartoon") {
    // A cartoon cat waving on a pink stage...
    rect(0, 0, w, h, "#f7c6d6");
    rect(0, 18, w, 6, "#e88fae");
    const bob = Math.round(Math.sin(t * 4));
    rect(15, 7 + bob, 12, 10, "#f6a33c");
    rect(15, 4 + bob, 3, 3, "#f6a33c");
    rect(24, 4 + bob, 3, 3, "#f6a33c");
    px(18, 10 + bob, "#2b2522");
    px(23, 10 + bob, "#2b2522");
    rect(20, 13 + bob, 2, 1, "#c4503f");
    rect(28, 8 + bob + Math.round(Math.sin(t * 8)), 2, 4, "#f6a33c");
  } else if (channel === "cooking") {
    // A cooking show: the chef at a pot on the hob, steam rising.
    rect(0, 0, w, h, "#fbe7c4");
    rect(0, 17, w, 7, "#c9a07a");
    person(rect, px, 6, 6 + Math.round(Math.sin(t * 3) * 0.6), { hair: "#ffffff", clothes: "#ffffff", mouth: Math.sin(t * 9) > 0 });
    rect(13, 10, 16, 8, "#5c6b80");
    rect(11, 10, 20, 1, "#7d8ca3");
    for (let k = 0; k < 3; k++) {
      const y = 8 - ((t * 6 + k * 3) % 8);
      rect(16 + k * 4 + Math.round(Math.sin(t * 3 + k)), y, 1, 2, "#ffffff");
    }
    rect(32, 2, 8, 2, "#e8695a");
  } else if (channel === "news") {
    // The evening news: two presenters at the desk, the globe in the corner, the headlines along the bottom.
    rect(0, 0, w, h, "#1d3f7a");
    for (let x = 0; x < w; x += 6) rect(x, 0, 3, 15, "#22488a");
    rect(2, 2, 5, 5, "#3a7bd5");
    rect(3, 4, 3, 1, "#8fd3ff");
    rect(4, 2, 1, 5, "#8fd3ff");
    const talker = Math.floor(e / 3) % 2;
    person(rect, px, 13, 6, { hair: "#221e21", clothes: "#2b2c33", mouth: talker === 0 && Math.sin(t * 11) > 0 });
    px(13, 11, "#c8323c");
    person(rect, px, 27, 6, { hair: "#5e3624", clothes: "#e3e1dc", mouth: talker === 1 && Math.sin(t * 11) > 0 });
    rect(0, 14, w, 6, "#c9d4e6");
    rect(0, 15, w, 1, "#2a5cab");
    rect(0, 20, w, 4, "#c8323c");
    rect(0, 20, 6, 4, "#f6cf4a");
    for (let k = 0; k < 8; k++) rect(((((k * 9 - t * 10) % (w + 9)) + w + 9) % (w + 9)) - 3, 21 + (k % 2), 2 + (k % 3) * 2, 1, "#ffffff");
  } else if (channel === "weather") {
    // The weather forecast: home in the middle of the map under the biggest symbol, showing the sky outside, with
    // the presenter's pointer on it; two other places around it (different each time it comes on), each place's
    // temperature along the bottom under it, and today's sky again in the corner above her.
    rect(0, 0, w, h, "#6fb3e0");
    for (let y = 2; y < 18; y++) {
      const a = 3 + Math.round(2 * Math.sin(y * 0.6) + Math.sin(y * 1.7));
      const b = 31 - Math.round(2 * Math.sin(y * 0.5 + 1));
      rect(a, y, b - a, 1, y % 5 ? "#7fbf5a" : "#71b04f");
    }
    const icon = (x, y, kind) => {
      if (kind === "sunny") {
        rect(x, y, 4, 4, "#ffd75a");
        if (Math.sin(t * 4) > 0)
          [
            [-1, 1],
            [4, 2],
            [1, -1],
            [2, 4],
          ].forEach(([dx, dy]) => px(x + dx, y + dy, "#ffd75a"));
      } else {
        rect(x, y + 1, 6, 3, kind === "rain" ? "#d6dde8" : "#ffffff");
        rect(x + 1, y, 3, 1, kind === "rain" ? "#d6dde8" : "#ffffff");
        if (kind === "rain") for (let k = 0; k < 3; k++) px(x + 1 + k * 2, y + 4 + Math.floor((t * 6 + k) % 2), "#2f6fd6");
      }
    };
    const big = (x, y, kind) => {
      if (kind === "sunny") {
        rect(x + 2, y + 2, 6, 4, "#ffd75a");
        rect(x + 3, y + 1, 4, 6, "#ffd75a");
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4 + t * 0.8;
          px(x + 4.5 + Math.cos(a) * 5, y + 3.5 + Math.sin(a) * 5, "#ffd75a");
        }
        return;
      }
      const top = kind === "rain" ? "#c9d2de" : "#ffffff";
      const x0 = x + Math.round(Math.sin(t * 1.2));
      rect(x0, y + 3, 11, 3, top);
      rect(x0 + 2, y + 1, 4, 2, top);
      rect(x0 + 5, y + 2, 4, 1, top);
      rect(x0 + 1, y + 6, 9, 1, kind === "rain" ? "#a9b4c4" : "#d6dde8");
      if (kind === "rain") for (let k = 0; k < 5; k++) rect(x0 + 1 + k * 2, y + 8 + Math.floor((t * 8 + k * 1.7) % 4), 1, 2, "#2f6fd6");
    };
    const KINDS = ["sunny", "cloudy", "rain"];
    const TEMP = { sunny: 24, cloudy: 18, rain: 13 };
    const on = Math.floor(t - e); // when this forecast came on
    const west = KINDS[Math.floor(hash(on, 1, 7) * 3)];
    const east = KINDS[Math.floor(hash(on, 2, 7) * 3)];
    icon(5, 3, west);
    icon(24, 4, east);
    big(11, 6, sky);
    rect(9, 14, 3, 2, "#fff8ef"); // home, a little house under it
    rect(9, 13, 3, 1, "#d9334a");
    px(10, 15, "#8a5a34");
    rect(0, 18, w, 6, "#1d3f7a");
    number(px, TEMP[west] + Math.floor(hash(on, 3, 7) * 4), 3, 19, "#ffffff");
    number(px, TEMP[sky], 14, 19, "#ffd75a");
    number(px, TEMP[east] + Math.floor(hash(on, 4, 7) * 4), 25, 19, "#ffffff");
    rect(33, 0, 9, 7, "#1d3f7a");
    icon(sky === "sunny" ? 35 : 34, sky === "sunny" ? 2 : 1, sky);
    person(rect, px, 37, 7, { hair: "#47281b", clothes: "#d9334a", mouth: Math.sin(t * 9) > 0 });
    rect(32, 11, 2, 1, "#f9d6bd"); // her arm, and the pointer on home
    const tip = 22 + Math.round(Math.sin(t * 1.5));
    rect(tip, 10, 32 - tip, 1, "#3b3330");
    px(tip, 10, "#ffffff");
  } else if (channel === "advert") {
    // Adverts: a juice bottle bouncing in a burst of colour, a little red car on the open road, and an ice cream
    // getting scoop after scoop, one after another (which comes first depends on when the break started).
    const ad = (Math.floor(e / 4) + Math.floor(t - e)) % 3;
    if (ad === 2) {
      rect(0, 0, w, h, "#bfe8e0");
      for (let k = 0; k < 10; k++) if (Math.sin(t * 3 + k * 1.9) > 0) rect((k * 9) % w, 2 + ((k * 5) % 16), 2, 2, "#e4f7f2");
      for (let y = 0; y < 8; y++) rect(18 + Math.round(y * 0.45), 14 + y, 7 - Math.round(y * 0.9), 1, y % 2 ? "#c98f45" : "#d9a35b");
      const scoops = 1 + Math.floor(e % 4); // a new scoop dropping on every second, then the cherry
      const SCOOP = ["#f7c6d6", "#fff1c9", "#8a5a34"];
      for (let k = 0; k < Math.min(3, scoops); k++) {
        const fall = k === scoops - 1 ? Math.max(0, 1 - (e % 1) * 4) * 6 : 0;
        rect(18, 11 - k * 3 - fall, 7, 3, SCOOP[k]);
        rect(19, 10 - k * 3 - fall, 5, 1, SCOOP[k]);
      }
      if (scoops > 3) {
        px(21, 3, "#d9334a");
        px(22, 2, "#4f9a3a");
      }
      rect(0, 21, w, 3, "#f28aa8");
      for (let k = 0; k < 5; k++) px(8 + k * 6, 22, "#ffffff");
    } else if (ad === 0) {
      rect(0, 0, w, h, "#ff8fb4");
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + t * 0.8;
        for (let r = 3; r < 26; r += 1) if (k % 2) px(21 + Math.cos(a) * r, 11 + Math.sin(a) * r * 0.6, "#ffb3cb");
      }
      const y = 6 - Math.abs(Math.sin(t * 4)) * 3;
      rect(18, y + 3, 7, 10, "#7cc46a");
      rect(20, y, 3, 3, "#ffffff");
      rect(18, y + 7, 7, 3, "#f6cf4a");
      for (let k = 0; k < 4; k++) if (Math.sin(t * 7 + k * 2) > 0.3) px(12 + k * 6, 3 + (k % 2) * 14, "#ffffff");
      rect(0, 20, w, 4, "#f6cf4a");
      rect(10, 21, 22, 2, "#d9334a");
    } else {
      rect(0, 0, w, 12, "#9fd8f5");
      rect(0, 12, w, h - 12, "#7fbf5a");
      rect(0, 15, w, 5, "#5c6066");
      for (let x = (-t * 30) % 8; x < w; x += 8) rect(x, 17, 4, 1, "#ffffff");
      const bob = Math.round(Math.sin(t * 20) * 0.5);
      rect(15, 12 + bob, 10, 3, "#e0402e");
      rect(17, 10 + bob, 5, 2, "#e0402e");
      rect(18, 10 + bob, 3, 1, "#cfeefc");
      px(16, 15, "#2b2522");
      px(23, 15, "#2b2522");
      rect(30, 2, 9, 3, "#ffffff");
    }
  } else if (channel === "football") {
    // A football match: the pitch in stripes, two teams running after the ball, the score in the bar along
    // the top, and a goal now and then.
    for (let x = 0; x < w; x++) rect(x, 6, 1, h - 6, Math.floor(x / 6) % 2 ? "#4f9f3c" : "#5bb046");
    rect(0, 7, w, 1, "#e9f4e0");
    rect(0, h - 2, w, 1, "#e9f4e0");
    rect(w / 2, 7, 1, h - 9, "#e9f4e0");
    for (let a = 0; a < 16; a++) px(w / 2 + Math.round(4 * Math.cos((a * Math.PI) / 8)), 15 + Math.round(4 * Math.sin((a * Math.PI) / 8)), "#e9f4e0");
    const ball = [w / 2 + 14 * Math.sin(t * 0.7) * Math.cos(t * 0.31), 15 + 5 * Math.sin(t * 1.1)];
    for (let k = 0; k < 4; k++) {
      const chase = (side) => [
        ball[0] + side * (4 + k * 3) * Math.cos(t + k),
        Math.min(h - 4, Math.max(8, ball[1] + (k - 1.5) * 3 + Math.sin(t * 2 + k))),
      ];
      const [rx, ry] = chase(1);
      const [bx, by] = chase(-1);
      rect(rx, ry, 1, 2, "#e0402e");
      rect(bx, by, 1, 2, "#3e6fd6");
    }
    px(ball[0], ball[1], "#ffffff");
    rect(0, 0, w, 6, "#1f2a1c");
    rect(11, 1, 2, 4, "#e0402e");
    number(px, Math.floor(t / 40) % 4, 14, 0, "#ffffff");
    rect(19, 2, 2, 1, "#ffffff");
    number(px, Math.floor(t / 57) % 3, 22, 0, "#ffffff");
    rect(26, 1, 2, 4, "#3e6fd6");
    if (t % 23 < 1.5) {
      rect(9, 11, 24, 7, "#f6cf4a");
      rect(11, 13, 20, 3, "#d9334a"); // GOAL!
    }
  } else if (channel === "concert") {
    // A concert: spotlights sweeping a dark stage, the singer at the microphone, notes in the air and the
    // crowd bobbing.
    rect(0, 0, w, h, "#1b1430");
    for (let k = 0; k < 3; k++) {
      const top = 6 + k * 15 + 6 * Math.sin(t * 1.3 + k * 2);
      for (let y = 0; y < 16; y++) rect(top - y * 0.4, y, 1 + y * 0.6, 1, ["#3d2f6b", "#5a3a6e", "#2f4f7a"][k]);
    }
    rect(0, 16, w, 2, "#3a2f58");
    person(rect, px, 20, 7 + Math.round(Math.sin(t * 4) * 0.5), { hair: "#f2c14e", clothes: "#e05aa0", mouth: Math.sin(t * 7) > -0.3 });
    rect(23, 9, 1, 6, "#9a9ca3");
    for (let k = 0; k < 3; k++) {
      const y = 12 - ((t * 4 + k * 4) % 12);
      px(10 + k * 10 + Math.round(Math.sin(t * 2 + k) * 2), y, "#fff4c2");
    }
    for (let x = 0; x < w; x += 3) rect(x, 19 + (Math.sin(t * 6 + x) > 0 ? 0 : 1), 2, 5, "#0d0a18");
  } else if (channel === "crafts") {
    // A children's craft show: the presenter at the table snipping a paper chain that grows link by link, a pot
    // of pens, and glitter twinkling in the air.
    rect(0, 0, w, h, "#fff1b8");
    for (let x = 0; x < w; x += 8) rect(x, 0, 4, 16, "#ffe89a");
    rect(0, 16, w, 8, "#e8a36a");
    rect(0, 16, w, 1, "#f2bb86");
    person(rect, px, 6, 6 + Math.round(Math.sin(t * 3) * 0.6), { hair: "#e0402e", clothes: "#3fb8c8", mouth: Math.sin(t * 9) > 0 });
    const LINK = ["#e0402e", "#f6cf4a", "#3fd47a", "#3e6fd6", "#b46be0"];
    const links = 1 + (Math.floor(e / 2) % 6);
    for (let k = 0; k < links; k++) {
      rect(11 + k * 4, 17 + (k % 2), 4, 3, LINK[k % 5]);
      rect(12 + k * 4, 18 + (k % 2), 2, 1, "#e8a36a");
    }
    const sx = 11 + links * 4;
    const open = Math.sin(t * 12) > 0;
    rect(sx + 1, open ? 16 : 17, 3, 1, "#c9ced6");
    rect(sx + 1, 18, 3, 1, "#c9ced6");
    rect(sx - 1, 17, 2, 2, "#e0402e");
    rect(37, 12, 4, 4, "#3e6fd6");
    rect(37, 10, 1, 2, "#e0402e");
    rect(39, 9, 1, 3, "#3fd47a");
    rect(40, 10, 1, 2, "#f6cf4a");
    for (let k = 0; k < 6; k++) if (Math.sin(t * 5 + k * 2.3) > 0.5) px(12 + ((k * 13) % 24), 2 + ((k * 7) % 11), "#ffffff");
  } else if (channel === "baking") {
    // A baking contest in a tent: bunting along the top, two bakers at their benches, and a cake in the middle
    // rising layer by layer until the icing and a cherry go on top.
    rect(0, 0, w, h, "#f3f6ee");
    for (let x = 0; x < w; x += 6) rect(x, 0, 3, 15, "#e6eef0");
    rect(0, 0, w, 1, "#c9b79c");
    const FLAG = ["#e0402e", "#f6cf4a", "#3e6fd6", "#3fd47a"];
    for (let x = 1; x < w; x += 4) {
      rect(x, 1, 3, 1, FLAG[(x >> 2) % 4]);
      px(x + 1, 2, FLAG[(x >> 2) % 4]);
    }
    person(rect, px, 5, 7, { hair: "#5e3624", clothes: "#f28aa8", mouth: Math.sin(t * 7) > 0.4 });
    person(rect, px, 36, 7, { hair: "#f2c14e", clothes: "#8fd3ff" });
    rect(0, 15, w, 2, "#d9d3c7");
    rect(0, 17, w, 7, "#8fc9d9");
    for (let x = 5; x < w; x += 9) rect(x, 19, 4, 1, "#bfe3ec");
    rect(9, 13, 3, 2, "#ffffff"); // her bowl, and the whisk going round in it
    px(10 + Math.round(Math.cos(t * 10)), 12, "#9a9ca3");
    rect(31, 13, 2, 2, "#c98f45"); // his tray of biscuits
    rect(34, 13, 2, 2, "#c98f45");
    rect(16, 14, 10, 1, "#ffffff");
    const layers = 1 + (Math.floor(e / 2.5) % 5);
    for (let k = 0; k < Math.min(3, layers); k++) {
      const fall = k === layers - 1 ? Math.max(0, 1 - ((e / 2.5) % 1) * 4) * 5 : 0;
      rect(17, 11 - k * 3 - fall, 8, 3, "#e8b46a");
      rect(17, 11 - k * 3 - fall, 8, 1, "#fff8ef");
    }
    if (layers > 3) {
      rect(17, 5, 8, 1, "#f28aa8");
      [18, 21, 23].forEach((x, k) => rect(x, 6, 1, 1 + (k % 2), "#f28aa8"));
    }
    if (layers > 4) {
      px(21, 4, "#d9334a");
      px(22, 3, "#4f9a3a");
      for (let k = 0; k < 4; k++) if (Math.sin(t * 8 + k * 1.6) > 0.3) px(15 + k * 4, 3 + (k % 2) * 4, "#f6cf4a");
    }
  } else if (channel === "travel") {
    // A travel show: the presenter with her backpack waving from somewhere new every few seconds, the pyramids, a
    // tall iron tower, a windmill among the tulips, a lake under snowy mountains, with the place's name below.
    const place = (Math.floor(e / 3) + Math.floor(t - e)) % 4;
    if (place === 0) {
      rect(0, 0, w, h, "#ffd8a0");
      rect(32, 3, 4, 4, "#fff1b8");
      rect(0, 16, w, 8, "#e8c27a");
      const pyramid = (cx, top, n) => {
        for (let r = 0; r < n; r++) {
          rect(cx - r, top + r, r + 1, 1, "#e0b46a");
          rect(cx + 1, top + r, r, 1, "#b8833f");
        }
      };
      pyramid(17, 6, 10);
      pyramid(30, 10, 6);
    } else if (place === 1) {
      rect(0, 0, w, h, "#9fd8f5");
      rect(((t * 3) % (w + 10)) - 10, 3, 8, 2, "#ffffff");
      rect(0, 17, w, 7, "#7fbf5a");
      for (let y = 2; y < 17; y++) {
        const half = Math.floor(((y - 2) / 14) ** 2 * 6);
        rect(24 - half, y, half * 2 + 1, 1, "#8a6f5a");
        if (y > 12) rect(24 - (y - 13), y, (y - 13) * 2 + 1, 1, "#9fd8f5");
      }
      rect(22, 8, 5, 1, "#6b5444");
      rect(20, 12, 9, 1, "#6b5444");
      px(24, 1, "#d9334a");
    } else if (place === 2) {
      rect(0, 0, w, h, "#bfe6fb");
      const TULIP = ["#e0402e", "#7fbf5a", "#f6cf4a", "#7fbf5a", "#f28aa8", "#7fbf5a"];
      for (let y = 15; y < h; y++) rect(0, y, w, 1, TULIP[(y - 15) % 6]);
      rect(25, 8, 5, 8, "#8a5a34");
      rect(26, 6, 3, 2, "#5c3a26");
      rect(27, 13, 1, 3, "#3b3330");
      for (let k = 0; k < 4; k++) {
        const a = t * 1.5 + (k * Math.PI) / 2;
        for (let r = 1; r < 8; r++) px(27 + Math.cos(a) * r, 7 + Math.sin(a) * r, "#fff8ef");
      }
    } else {
      rect(0, 0, w, h, "#a8d4f0");
      for (let x = 0; x < w; x++) {
        const top = Math.round(Math.min(3 + Math.abs(x - 15) * 0.9, 6 + Math.abs(x - 31) * 0.8));
        if (top < 15) {
          rect(x, top, 1, 15 - top, x % 5 ? "#7b8aa3" : "#6f7e98");
          if (top < 7) rect(x, top, 1, 7 - top, "#ffffff");
        }
      }
      rect(0, 15, w, 9, "#4f9fd0");
      for (let k = 0; k < 5; k++) rect(((k * 11 + t * 2) % (w + 4)) - 4, 17 + (k % 3) * 2, 3, 1, "#8fc6e6");
    }
    rect(0, 21, w, 3, "#ffffff");
    px(15, 22, "#d9334a");
    rect(17, 22, 6 + place * 2, 1, "#5c6066");
    person(rect, px, 6, 13 + Math.round(Math.sin(t * 3) * 0.5), { hair: "#47281b", clothes: "#f39a33", mouth: Math.sin(t * 9) > 0 });
    rect(10, 17, 2, 4, "#3e6fd6");
    rect(3, Math.sin(t * 8) > 0 ? 14 : 15, 1, 3, "#f9d6bd");
    if (e % 3 < 0.25) rect(w * (e % 3) * 4, 0, w, h, "#fff8ef"); // a white wipe to the next place
  } else if (channel === "ocean") {
    // An ocean documentary: sunbeams slanting down through the blue, seaweed swaying on the sand, a shoal of fish
    // turning together, a turtle paddling past and bubbles rising.
    ["#3fa4d8", "#3497cc", "#2b88bf", "#237ab1", "#1c6ca3"].forEach((c, k) => rect(0, k * 4, w, 4, c));
    for (let k = 0; k < 3; k++) {
      const x0 = 4 + k * 13 + Math.round(Math.sin(t * 0.7 + k) * 2);
      for (let y = 0; y < 18; y++) rect(x0 + Math.round(y * 0.5), y, 2, 1, "#4fb0e0");
    }
    rect(0, 20, w, 4, "#e8d29a");
    for (let x = 2; x < w; x += 7) px(x, 22, "#cdb27a");
    for (let k = 0; k < 5; k++)
      for (let y = 0; y < 5 + (k % 3) * 2; y++)
        px(3 + k * 9 + Math.round(Math.sin(t * 2 + y * 0.5 + k) * (y / 5)), 19 - y, k % 2 ? "#3fae6a" : "#2f8f55");
    const cx = ((t * 5) % (w + 20)) - 10;
    const cy = 8 + 3 * Math.sin(t * 0.9);
    for (let k = 0; k < 7; k++) {
      const fx = cx + (k % 3) * 3 - Math.floor(k / 3) * 3;
      const fy = cy + ((k % 3) - 1) * 2 + Math.sin(t * 4 + k) * 0.5;
      rect(fx, fy, 2, 1, "#f6cf4a");
      px(fx - 1, fy, "#f39a33");
    }
    const tx = w + 4 - ((t * 2.5 + 20) % (w + 16));
    const ty = 13 + Math.round(Math.sin(t));
    const flap = Math.sin(t * 4) > 0;
    rect(tx + 1, ty + (flap ? -1 : 3), 2, 1, "#9ccf6a");
    rect(tx + 4, ty + (flap ? 3 : -1), 2, 1, "#9ccf6a");
    rect(tx, ty, 6, 3, "#5a8f3c");
    px(tx + 2, ty + 1, "#7fb35a");
    px(tx + 4, ty + 1, "#7fb35a");
    rect(tx - 2, ty + 1, 2, 1, "#9ccf6a");
    for (let k = 0; k < 5; k++) px(5 + k * 8 + Math.round(Math.sin(t * 3 + k)), 19 - ((t * 5 + k * 7) % 20), "#cfeefc");
  } else if (channel === "dance") {
    // A pop music video: three dancers moving in step on a floor of flashing tiles, the backdrop changing colour
    // on every beat and hearts floating up.
    const beat = Math.floor(t * 2.5);
    rect(0, 0, w, h, ["#ff8fb4", "#b48cff", "#7fd6ff", "#ffd36e"][beat % 4]);
    for (let x = beat % 2 ? 0 : 3; x < w; x += 6) rect(x, 0, 3, 17, "#ffffff40");
    for (let x = 0; x < w; x += 6) for (let r = 0; r < 2; r++) rect(x, 17 + r * 4, 6, 4, (x / 6 + r + beat) % 2 ? "#3a2f58" : "#e05aa0");
    const move = beat % 4;
    const HAIR = ["#221e21", "#f2c14e", "#b46be0"];
    const CLOTHES = ["#ffffff", "#3e6fd6", "#2b2c33"];
    for (let k = 0; k < 3; k++) {
      const x = 9 + k * 11 + (move === 2 ? -1 : 0);
      const top = move === 3 ? 5 : 7;
      person(rect, px, x, top, { hair: HAIR[k], clothes: CLOTHES[k], mouth: k === 1 && Math.sin(t * 9) > 0 });
      rect(x - 1, top + 8, 1, 3, "#2b2c33");
      rect(x + 2, top + 8, 1, 3, "#2b2c33");
      if (move === 0 || move === 2) rect(x - 3, top + 1, 1, 3, "#f9d6bd");
      else rect(x - 4, top + 4, 2, 1, "#f9d6bd");
      if (move === 0) rect(x + 4, top + 1, 1, 3, "#f9d6bd");
      else rect(x + 4, top + 4, 2, 1, "#f9d6bd");
    }
    for (let k = 0; k < 3; k++) {
      const x = 4 + k * 15 + Math.round(Math.sin(t * 2 + k));
      const y = 15 - ((t * 4 + k * 6) % 16);
      px(x, y, "#ffffff");
      px(x + 2, y, "#ffffff");
      rect(x, y + 1, 3, 1, "#ffffff");
      px(x + 1, y + 2, "#ffffff");
    }
  } else if (channel === "quiz") {
    // A quiz show: the host at her stand with the question up on the board, two contestants at their buzzers,
    // whoever is faster lighting up, and the scores going up by ten.
    rect(0, 0, w, h, "#2a1f5c");
    for (let x = 1; x < w; x += 4) rect(x, 0, 2, 1, (Math.floor(t * 4) + (x >> 2)) % 4 ? "#6b5bb0" : "#f6cf4a");
    rect(13, 2, 16, 7, "#1d3f7a");
    rect(13, 2, 16, 1, "#8fd3ff");
    ["111", "001", "010", "000", "010"].forEach((row, y) => [...row].forEach((on, x) => on === "1" && px(20 + x, 3 + y, "#ffffff")));
    const on = Math.floor(t - e);
    const round = Math.floor(e / 3);
    const buzzed = e % 3 > 1;
    const who = (r) => (hash(r, on, 9) < 0.5 ? 0 : 1);
    const score = [0, 0];
    for (let r = 0; r < round + (buzzed ? 1 : 0); r++) score[who(r)] += 10;
    person(rect, px, 20, 10, { hair: "#f2c14e", clothes: "#e05aa0", mouth: !buzzed && Math.sin(t * 9) > 0 });
    rect(17, 16, 8, 8, "#6b5bb0");
    rect(17, 16, 8, 1, "#8c7dd0");
    [6, 36].forEach((x, k) => {
      const lit = buzzed && who(round) === k;
      person(rect, px, x, 8, { hair: k ? "#221e21" : "#5e3624", clothes: k ? "#3fd47a" : "#f39a33", mouth: lit });
      rect(x - 4, 16, 9, 8, k ? "#e0402e" : "#3e6fd6");
      rect(x - 4, 16, 9, 1, lit && t % 0.3 < 0.15 ? "#ffffff" : k ? "#f0706a" : "#6f9ef0");
      rect(x, 15, 2, 1, lit ? "#ffe58a" : "#8a7a3a");
      number(px, score[k], x - 2, 18, "#ffffff");
    });
  } else if (channel === "garden") {
    // A gardening show: the presenter watering a bed of flowers that come up and open while you watch, a bee
    // going from flower to flower, and a robin on the fence.
    rect(0, 0, w, h, "#bfe6fb");
    rect(31, 2, 4, 4, "#ffe58a");
    rect(0, 9, w, 1, "#c9a477");
    for (let x = 1; x < w; x += 4) rect(x, 7, 2, 6, "#d9b98a");
    rect(0, 13, w, 11, "#7fbf5a");
    rect(14, 17, 26, 4, "#8a5a34");
    const BLOOM = ["#e0402e", "#f28aa8", "#b46be0", "#f6cf4a", "#ffffff", "#f39a33"];
    for (let k = 0; k < 6; k++) {
      const x = 16 + k * 4;
      const grow = Math.min(1, Math.max(0, (e - k * 0.8) / 3));
      const tall = 1 + Math.round(grow * 5);
      const top = 17 - tall;
      rect(x, top, 1, tall, "#4f9a3a");
      if (grow < 1) px(x, top, "#7cc463");
      else {
        rect(x - 1, top, 3, 1, BLOOM[k]);
        px(x, top - 1, BLOOM[k]);
        px(x, top + 1, BLOOM[k]);
        px(x, top, "#f6cf4a");
      }
    }
    person(rect, px, 6, 9, { hair: "#5e3624", clothes: "#5bb046", mouth: Math.sin(t * 9) > 0 });
    rect(10, 13, 3, 2, "#3e6fd6");
    px(13, 12, "#3e6fd6");
    for (let k = 0; k < 3; k++) px(14 + k, 13 + Math.floor((t * 8 + k * 2) % 4), "#8fd3ff");
    const bx = 28 + 9 * Math.sin(t * 0.9);
    const by = 8 + 3 * Math.sin(t * 2.3);
    rect(bx, by, 2, 1, "#f6cf4a");
    px(bx + 1, by, "#2b2522");
    px(bx, by - 1, Math.sin(t * 20) > 0 ? "#ffffff" : "#cfeefc");
    const hop = Math.sin(t * 3) > 0.8 ? 1 : 0;
    rect(37, 5 - hop, 3, 2, "#7a5236");
    px(38, 6 - hop, "#e0602e");
    px(39, 5 - hop, "#2b2522");
  } else if (channel === "tennis") {
    // A tennis match seen from above: the blue court and its white lines, the net across the middle, the two
    // players running to meet the ball as it goes back and forth, and the games won along the top.
    rect(0, 0, w, h, "#5bb046");
    rect(5, 6, 32, 17, "#3f7fc0");
    rect(5, 6, 32, 1, "#ffffff");
    rect(5, 22, 32, 1, "#ffffff");
    rect(5, 6, 1, 17, "#ffffff");
    rect(36, 6, 1, 17, "#ffffff");
    rect(5, 8, 32, 1, "#ffffff");
    rect(5, 20, 32, 1, "#ffffff");
    rect(12, 8, 1, 13, "#ffffff");
    rect(29, 8, 1, 13, "#ffffff");
    rect(12, 14, 18, 1, "#ffffff");
    rect(21, 5, 1, 19, "#2f6aa6");
    rect(20, 5, 1, 19, "#e9f4e0");
    const shot = Math.floor(t * 0.8);
    const f = (t * 0.8) % 1;
    const aim = (n) => 14 + Math.round(5 * Math.sin(n * 2.1));
    const right = shot % 2 === 0;
    const x = right ? 7 + 27 * f : 34 - 27 * f;
    const y = aim(shot) + (aim(shot + 1) - aim(shot)) * f;
    const lead = (side) => (right === side ? aim(shot + 1) : aim(shot)); // each one runs to where the ball will come
    rect(2, lead(false) - 1, 2, 3, "#e0402e");
    px(2, lead(false) - 2, "#f9d6bd");
    rect(38, lead(true) - 1, 2, 3, "#f6cf4a");
    px(39, lead(true) - 2, "#f9d6bd");
    px(x, y, "#2f6aa6");
    px(x, y - Math.sin(f * Math.PI) * 3, "#e8f25a");
    rect(0, 0, w, 5, "#1f2a1c");
    rect(11, 1, 2, 3, "#e0402e");
    number(px, Math.floor(t / 20) % 7, 14, 0, "#ffffff");
    number(px, Math.floor(t / 27) % 7, 22, 0, "#ffffff");
    rect(26, 1, 2, 3, "#f6cf4a");
  } else if (channel === "anime") {
    // An anime drama: cherry petals drifting down as it cuts between her close-up (big shining eyes), his, and
    // the two of them under the blossom tree.
    const shot = Math.floor(e / 3) % 3;
    if (shot === 2) {
      rect(0, 0, w, h, "#ffe6ee");
      rect(0, 19, w, 5, "#9ccf6a");
      rect(28, 7, 3, 13, "#7a5236");
      rect(20, 1, 19, 7, "#f7b8cc");
      rect(22, 0, 14, 9, "#f7b8cc");
      for (let k = 0; k < 8; k++) px(21 + ((k * 7) % 17), 1 + ((k * 3) % 7), "#ff9fbf");
      person(rect, px, 9, 11, { hair: "#b46be0", clothes: "#ffffff" });
      person(rect, px, 16, 11, { hair: "#2b2c33", clothes: "#3e6fd6", mouth: Math.sin(t * 7) > 0 });
      if (t % 2 < 1) {
        const y = 8 - (t % 1) * 3;
        px(12, y, "#ff6f9a");
        px(14, y, "#ff6f9a");
        rect(12, y + 1, 3, 1, "#ff6f9a");
        px(13, y + 2, "#ff6f9a");
      }
    } else {
      const her = shot === 0;
      const hair = her ? "#b46be0" : "#2b2c33";
      rect(0, 0, w, h, her ? "#ffd1e0" : "#cfe3ff");
      for (let k = 0; k < 6; k++) if (Math.sin(t * 4 + k * 1.3) > 0.2) px(2 + ((k * 7) % 9) + (k % 2) * 30, 3 + ((k * 5) % 17), "#ffffff");
      rect(13, 4, 16, 20, "#f9d6bd");
      rect(11, 1, 20, 5, hair);
      for (let x = 13; x < 29; x += 3) rect(x, 6, 2, 1 + (x % 2), hair);
      if (her) {
        rect(11, 4, 3, 17, hair);
        rect(28, 4, 3, 17, hair);
      } else for (let x = 11; x < 31; x += 4) px(x + 1, 0, hair);
      const eye = her ? "#e05aa0" : "#3e6fd6";
      const blink = t % 4 < 0.15;
      for (const ex of [15, 23]) {
        if (blink) rect(ex, 12, 4, 1, "#3b2a4a");
        else {
          rect(ex, 9, 4, 5, "#3b2a4a");
          rect(ex, 11, 4, 3, eye);
          px(ex + 1, 10, "#ffffff");
          px(ex + 2, 12, "#ffffff");
        }
      }
      if (her) {
        rect(14, 15, 3, 1, "#f7a1b5");
        rect(25, 15, 3, 1, "#f7a1b5");
      }
      rect(20, 17, 2, Math.sin(t * 8) > 0.3 ? 2 : 1, "#c4503f");
      rect(9, 21, 24, 3, her ? "#ffffff" : "#2b2c33");
      rect(19, 21, 4, 1, her ? "#d9334a" : "#ffffff");
    }
    for (let k = 0; k < 8; k++) {
      const x = ((k * 11 + t * (3 + (k % 3))) % (w + 4)) - 2;
      px(x + Math.sin(t * 2 + k) * 1.5, (k * 7 + t * 4) % h, k % 3 ? "#ff9fbf" : "#ffffff");
    }
  } else if (channel === "film") {
    // A late-night film between black bars, the subtitles changing in the bottom one: a rainy city at night with
    // its windows lit, then two people talking under a street lamp, the old film flickering with specks of dust.
    rect(0, 0, w, h, "#000000");
    if (Math.floor(e / 4) % 2 === 0) {
      rect(0, 3, w, 17, "#1b2340");
      rect(33, 5, 3, 3, "#f3ecc8");
      for (let b = 0; b < 7; b++) {
        const tall = 5 + Math.floor(hash(b, 0, 11) * 8);
        rect(b * 6, 20 - tall, 5, tall, "#2b2f45");
        for (let y = 21 - tall; y < 19; y += 2)
          for (let x = 1; x < 4; x += 2) if (hash(b * 6 + x, y, 12) < 0.4 + 0.2 * Math.sin(t * 0.5 + b)) px(b * 6 + x, y, "#f6d77a");
      }
      for (let k = 0; k < 10; k++) rect((k * 5 + t * 6) % w, 3 + ((k * 7 + t * 20) % 16), 1, 2, "#6f7fa8");
    } else {
      rect(0, 3, w, 17, "#141a2e");
      for (let y = 7; y < 18; y++) rect(20 - (y - 7) * 0.6, y, Math.round((y - 7) * 1.2) + 1, 1, "#2a2e48");
      rect(0, 18, w, 2, "#22263a");
      rect(20, 6, 1, 12, "#3b3a5c");
      rect(19, 5, 3, 2, "#ffe58a");
      for (const [x, hat] of [
        [11, true],
        [28, false],
      ]) {
        rect(x, 10, 3, 3, "#0b0d16");
        rect(x - 1, 13, 5, 6, "#0b0d16");
        if (hat) rect(x - 1, 9, 5, 1, "#0b0d16");
      }
    }
    if (e % 2 < 1.6) {
      const line = Math.floor(e / 2) + Math.floor(t - e);
      let total = -2;
      for (let k = 0; k < 4; k++) total += 4 + Math.floor(hash(line, k, 13) * 5);
      let x = Math.round((w - total) / 2);
      for (let k = 0; k < 4; k++) {
        const word = 2 + Math.floor(hash(line, k, 13) * 5);
        rect(x, 21, word, 1, "#e8e8e8");
        x += word + 2;
      }
    }
    const frame = Math.floor(t * 12);
    for (let k = 0; k < 3; k++) if (hash(frame, k, 14) < 0.4) px(hash(frame, k, 15) * w, 3 + hash(frame, k, 16) * 17, "#d8d0b8");
    if (hash(frame >> 2, 0, 17) < 0.2) rect(Math.floor(hash(frame >> 2, 1, 17) * w), 3, 1, 17, "#3a3a44");
  }
}

// The two of them playing on the TV: two paddles and a ball.
export function drawTvGame(g, w, h, t) {
  const { rect, px } = pen(g);
  rect(0, 0, w, h, "#141a2e");
  for (let y = 1; y < h; y += 3) px(w / 2, y, "#56607e");
  const ball = [w / 2 + 17 * Math.sin(t * 1.9), h / 2 + 9 * Math.sin(t * 3.1)];
  rect(2, ball[1] - 3 + 2 * Math.sin(t * 2.3), 1, 6, "#f28aa8");
  rect(w - 3, ball[1] - 3 + 2 * Math.sin(t * 2.7 + 1), 1, 6, "#8fd3ff");
  rect(ball[0], ball[1], 2, 2, "#ffffff");
  rect(w / 2 - 6, 1, 2, 3, "#f28aa8");
  rect(w / 2 + 4, 1, 2, 3, "#8fd3ff");
}
