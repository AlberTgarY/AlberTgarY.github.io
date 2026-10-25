/*******************************************************************************
 * What is on the playground's screens (house.js draws them a few times a
 * second, a texel a pixel): the TV's channels (a nature programme, a cartoon,
 * a cooking show, the evening news, the weather forecast with today's real
 * sky, adverts, a football match, a concert, a craft show, a baking contest,
 * a travel show, an ocean documentary, a pop video, a quiz, a gardening show,
 * tennis, an anime drama, a late-night film), the game the two of them play
 * on it, and the games he plays on his computer (a platformer, a farm, a world
 * of blocks, a race, a falling-blocks puzzle, a space shooter, a rhythm game,
 * fishing, tower defence, karts, pinball, a memory card game, snake, a
 * monster battle) with their win and loss screens; and, when the girl sits at
 * his computer, the TV dramas she streams (a palace drama, a romance in the
 * rain, a hospital drama, a detective mystery, a school romance, a sword
 * fight in the bamboo, a family sitcom, a café romance) or her cosy farm game,
 * and what the side screen shows meanwhile.
 ******************************************************************************/

import { hash } from "../models/voxels.js";

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
export const GAMES = [
  "platformer",
  "farm",
  "blocks",
  "race",
  "puzzle",
  "space",
  "rhythm",
  "fishing",
  "defence",
  "kart",
  "pinball",
  "cards",
  "snake",
  "battle",
];
// What the girl watches and plays on his computer (her game is not among his picks in GAMES).
export const DRAMAS = ["palace", "rain", "hospital", "detective", "campus", "wuxia", "sitcom", "cafe"];
export const GIRL_GAMES = ["stardew"];

// Drawing helpers on a 2D context: a rectangle and a pixel, rounded to whole texels.
function pen(g) {
  const rect = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  return { rect, px: (x, y, c) => rect(x, y, 1, 1, c) };
}

// Digits three texels wide and five high, for scores and temperatures.
const DIGITS = [
  "111101101101111",
  "010110010010111",
  "111001111100111",
  "111001111001111",
  "101101111001001",
  "111100111001111",
  "111100111101111",
  "111001010010010",
  "111101111101111",
  "111101111001111",
];
function number(px, n, x, y, c) {
  [...String(n)].forEach((d, k) => [...DIGITS[+d]].forEach((on, i) => on === "1" && px(x + k * 4 + (i % 3), y + Math.floor(i / 3), c)));
}

// A little person seen from the front, `top` the top of the head: hair, face, and clothes below.
function person(rect, px, x, top, { hair, skin = "#f9d6bd", clothes, mouth = false }) {
  rect(x - 1, top, 4, 1, hair);
  rect(x - 1, top + 1, 4, 3, skin);
  rect(x - 1, top + 1, 1, 2, hair);
  rect(x + 2, top + 1, 1, 2, hair);
  px(x, top + 2, "#2b2522");
  px(x + 1, top + 2, "#2b2522");
  if (mouth) px(x, top + 3, "#c4503f");
  rect(x - 2, top + 4, 6, 4, clothes);
}

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

// The snake's round on the computer screen, cell by cell: right along the top, back and forth down the middle,
// along the bottom and up the left side home.
const SNAKE = [];
[
  [2, 2],
  [23, 2],
  [23, 5],
  [4, 5],
  [4, 8],
  [23, 8],
  [23, 11],
  [2, 11],
  [2, 2],
].reduce(([x, y], [tx, ty]) => {
  while (x !== tx || y !== ty) {
    SNAKE.push([x, y]);
    x += Math.sign(tx - x);
    y += Math.sign(ty - y);
  }
  return [tx, ty];
});

// Her farm game's calendar: days of DAY seconds, starting on a different day each time she sits down (`t - e`
// is when she did), and the three rows' crops when ripe: pumpkins, tomatoes and cauliflowers.
const DAY = 16;
const farmDay = (t, e) => e / DAY + Math.floor(hash(Math.floor(t - e), 7, 23) * 12);
const CROPS = ["#f39a33", "#e0402e", "#fff1c9"];

// His computer: `mode` "off", "game", "win" or "lose", `game` (GAMES, or hers from GIRL_GAMES) while one is
// on, `e` how long since the mode changed.
export function drawPcGame(g, w, h, mode, game, t, e) {
  const { rect, px } = pen(g);
  if (mode === "off") return rect(0, 0, w, h, "#060608");
  if (mode === "win") {
    rect(0, 0, w, h, e % 0.4 < 0.2 ? "#f6cf4a" : "#f39a33");
    rect(10, 4, 6, 4, "#fff8ef"); // a trophy
    rect(12, 8, 2, 2, "#fff8ef");
    rect(10, 10, 6, 1, "#fff8ef");
    for (let k = 0; k < 6; k++) rect((k * 5 + e * 20) % w, 1 + (k % 3) * 5, 1, 1, "#ffffff");
    return;
  }
  if (mode === "lose") {
    rect(0, 0, w, h, "#2a2230");
    rect(9, 5, 8, 1, "#e0605a"); // a sad face
    rect(10, 3, 1, 1, "#e0605a");
    rect(15, 3, 1, 1, "#e0605a");
    rect(8, 6, 1, 1, "#e0605a");
    rect(17, 6, 1, 1, "#e0605a");
    return;
  }
  if (game === "farm") {
    // A little farm: tilled rows of crops coming up, the farmer walking along them with a watering can, a
    // chicken pecking about, a fence along the top.
    rect(0, 0, w, h, "#6fb24f");
    for (let x = 0; x < w; x += 2) px(x, 1 + (x % 4 ? 0 : 1), "#c9a477");
    rect(0, 2, w, 1, "#9e6f40");
    for (let row = 0; row < 3; row++) {
      rect(3, 5 + row * 3, 16, 2, "#8a5a34");
      for (let x = 4; x < 19; x += 3) {
        const grown = (t * 0.2 + hash(x, row, 1) * 3) % 3;
        px(x, 5 + row * 3, grown > 2 ? "#f2c14e" : grown > 1 ? "#4f9a3a" : "#7cc463");
      }
    }
    const fx = 3 + ((t * 3) % 16);
    const fy = 4 + 3 * (Math.floor(t / 5.3) % 3);
    rect(fx, fy - 2, 1, 2, "#3e6fd6");
    px(fx, fy - 3, "#f6cf4a");
    if (Math.sin(t * 6) > 0) px(fx + 1, fy, "#8fd3ff");
    const cx = 22 + Math.round(2 * Math.sin(t * 0.9));
    px(cx, 11 + (Math.sin(t * 5) > 0.6 ? 1 : 0), "#ffffff");
    px(cx + 1, 11, "#ffffff");
    px(cx + 1, 10, "#e0402e");
  } else if (game === "blocks") {
    // A world of blocks: grass on dirt on stone with ore in it, him digging (the block cracking), and a
    // creeper wandering in now and then.
    rect(0, 0, w, h, "#8fd0f5");
    rect(20, 1, 3, 3, "#fff6c9");
    const shift = Math.floor(t * 0.5);
    for (let x = 0; x < w; x++) {
      const top = 8 + Math.round(1.5 * Math.sin((x + shift) * 0.5) + hash(x + shift, 0, 4));
      rect(x, top, 1, 1, "#5fb03a");
      rect(x, top + 1, 1, 2, "#8a5a34");
      rect(x, top + 3, 1, h - top - 3, "#8a8f97");
      if (hash(x + shift, 2, 5) < 0.15) px(x, top + 4 + Math.floor(hash(x, 3, 3) * 2), "#5fe0e0");
    }
    rect(8, 4, 2, 2, "#f9d6bd");
    rect(8, 6, 2, 2, "#3fb8c8");
    rect(8, 8, 2, 1, "#3e4fa8");
    const crack = Math.floor((t * 2) % 4);
    for (let k = 0; k < crack; k++) px(11 + (k % 2), 9 + Math.floor(k / 2), "#2b2522");
    if (t % 17 < 6) {
      const cx = w - (t % 17) * 2;
      rect(cx, 5, 2, 4, "#4fae4f");
      px(cx, 6, "#1f1f24");
      px(cx + 1, 6, "#1f1f24");
    }
  } else if (game === "race") {
    // A race: the road rushing up to his red car, white lines flying past, another car to overtake.
    rect(0, 0, w, 5, "#9fd8f5");
    rect(0, 5, w, h - 5, "#5bb046");
    for (let y = 5; y < h; y++) {
      const half = 2 + (y - 5) * 1.1;
      rect(w / 2 - half, y, half * 2, 1, "#5c6066");
      if (Math.floor(y - t * 12) % 4 === 0) px(w / 2, y, "#ffffff");
      if (Math.floor(y - t * 12) % 2 === 0) {
        px(w / 2 - half - 1, y, "#e0402e");
        px(w / 2 + half, y, "#ffffff");
      }
    }
    const k = (t * 0.4) % 1;
    rect(w / 2 - 1 + 3 * k, 5 + 9 * k, 2, 1, "#3e6fd6");
    const steer = Math.round(2 * Math.sin(t * 1.3));
    rect(w / 2 - 2 + steer, h - 3, 4, 2, "#e0402e");
    rect(w / 2 - 1 + steer, h - 4, 2, 1, "#cfeefc");
  } else if (game === "puzzle") {
    // Falling blocks: the well, the pile at the bottom, a piece coming down, and a row flashing as it clears.
    rect(0, 0, w, h, "#1d1b2e");
    rect(7, 0, 12, h, "#2b2a45");
    const COLORS = ["#e0402e", "#f6cf4a", "#3fd47a", "#3e6fd6", "#b46be0"];
    for (let x = 8; x < 18; x++) {
      const pile = 2 + Math.floor(hash(x, 1, 1) * 4);
      for (let y = h - pile; y < h; y++) px(x, y, COLORS[Math.floor(hash(x, y, 2) * 5)]);
    }
    const fall = Math.floor((t * 3) % (h - 4));
    const col = 9 + (Math.floor(t / 4) % 6);
    rect(col, fall, 3, 1, "#3fd4d4");
    px(col + 1, fall + 1, "#3fd4d4");
    if (t % 4 < 0.4) rect(8, h - 2, 10, 1, "#ffffff");
    rect(20, 2, 5, 3, "#3b3a5c");
    number(px, Math.floor(t * 7) % 100, 20, 7, "#f6cf4a");
  } else if (game === "space") {
    // A space shooter: stars streaming past, his ship weaving at the bottom, shots going up at the invaders, and
    // every so often the big mothership in their place, its lights blinking.
    rect(0, 0, w, h, "#0c0f24");
    for (let k = 0; k < 14; k++) px((k * 7) % w, (k * 5 + t * (6 + (k % 3) * 4)) % h, k % 3 ? "#8c93c4" : "#ffffff");
    const sx = w / 2 + 8 * Math.sin(t * 1.4);
    rect(sx - 1, h - 2, 3, 1, "#8fd3ff");
    px(sx, h - 3, "#ffffff");
    for (let k = 0; k < 3; k++) px(sx, h - 4 - ((t * 20 + k * 4) % 10), "#f6cf4a");
    if (t % 15 > 10) {
      const mx = 8 + Math.round(3 * Math.sin(t));
      rect(mx, 2, 10, 3, "#b46be0");
      rect(mx + 3, 1, 4, 1, "#d9a0f0");
      for (let k = 0; k < 4; k++) px(mx + 1 + k * 3, 3, (Math.floor(t * 6) + k) % 2 ? "#ffe58a" : "#5c2f7a");
    } else
      for (let k = 0; k < 5; k++) {
        const ex = 3 + k * 5 + Math.round(2 * Math.sin(t * 2));
        rect(ex, 2 + (k % 2), 2, 1, "#e05aa0");
        if (Math.sin(t * 3 + k) > 0) px(ex, 3 + (k % 2), "#e05aa0");
      }
  } else if (game === "rhythm") {
    // A rhythm game: notes in four colours sliding down their lanes to the line, a flash as he hits each one, his
    // combo counting up, and his little dancer bopping beside it.
    rect(0, 0, w, h, "#1b1430");
    const LANE = ["#f28aa8", "#8fd3ff", "#ffe58a", "#3fd47a"];
    for (let k = 0; k < 4; k++) rect(2 + k * 4, 0, 3, h, "#2a2147");
    rect(2, 12, 15, 1, "#56607e");
    for (let k = 0; k < 6; k++) {
      const s = t * 6 + k * 2.5;
      const y = (s % 15) - 2;
      const lane = (k + Math.floor(s / 15)) % 4;
      if (y < 12) rect(2 + lane * 4, y, 3, 1, LANE[lane]);
      else rect(2 + lane * 4, 11, 3, 3, "#ffffff");
    }
    number(px, Math.floor(t * 2) % 100, 18, 1, "#f6cf4a");
    const bop = Math.sin(t * 8) > 0 ? 1 : 0;
    rect(20, 9 + bop, 2, 3, "#e05aa0");
    rect(20, 8 + bop, 2, 1, "#f9d6bd");
    px(19, Math.sin(t * 8) > 0 ? 9 : 11, "#f9d6bd");
    px(22, Math.sin(t * 8) > 0 ? 11 : 9, "#f9d6bd");
  } else if (game === "fishing") {
    // Fishing from a little boat: the float bobbing on the water, fish swimming below, and every few seconds a
    // bite, the float dipping and a fish swung up out of the water; his catch counted in the corner.
    rect(0, 0, w, 6, "#ffcf9e");
    rect(19, 1, 3, 3, "#fff1c9");
    rect(0, 6, w, h - 6, "#3a86c8");
    for (let x = 0; x < w; x += 4) px((x + t * 3) % w, 6, "#8fd3ff");
    for (let k = 0; k < 3; k++) {
      const x = ((t * (2 + k) + k * 9) % (w + 4)) - 2;
      rect(x, 9 + k * 2, 2, 1, ["#f39a33", "#e05aa0", "#3fd47a"][k]);
      px(x - 1, 9 + k * 2, "#2b5f99");
    }
    rect(2, 4, 8, 2, "#8a5a34");
    rect(3, 6, 6, 1, "#6b4429");
    rect(5, 2, 2, 2, "#3e6fd6");
    rect(5, 1, 2, 1, "#f9d6bd");
    rect(4, 0, 4, 1, "#f6cf4a");
    for (let k = 0; k < 6; k++) px(7 + k, 2 - k * 0.4, "#5c3a26");
    const c = t % 7;
    let end = [16, 6 + (Math.sin(t * 3) > 0.5 ? 1 : 0)];
    if (c > 5.6) {
      const f = (c - 5.6) / 1.4;
      end = [16 - f * 8, 7 - f * 5 - Math.sin(f * Math.PI) * 4];
    } else if (c > 5) end = [16, 8];
    for (let k = 0; k < 6; k++) px(12 + ((end[0] - 12) * k) / 6, (end[1] * k) / 6, "#e8e8e8");
    if (c > 5.6) {
      rect(end[0], end[1], 3, 1, "#f6cf4a");
      px(end[0] + 3, end[1], "#f39a33");
    } else {
      px(16, end[1] - 1, "#e0402e");
      px(16, end[1], "#ffffff");
      if (c > 5) [15, 17].forEach((x) => px(x, 6, "#ffffff"));
    }
    number(px, Math.floor(t / 7) % 10, 23, 0, "#5c3a26");
  } else if (game === "defence") {
    // Tower defence: slimes walking the winding path towards his castle, his two towers firing at them, and
    // the wave number in the corner.
    rect(0, 0, w, h, "#6fb24f");
    for (let k = 0; k < 6; k++) px((k * 11) % w, 7 + ((k * 3) % 3), "#4f9a3a");
    rect(0, 3, 22, 2, "#d9b98a");
    rect(20, 3, 2, 10, "#d9b98a");
    rect(0, 11, 22, 2, "#d9b98a");
    const along = (s) => (s < 20 ? [s, 3] : s < 28 ? [20, s - 17] : [48 - s, 11]);
    const foes = [0, 1, 2, 3, 4].map((k) => along((t * 4 + k * 9) % 48));
    for (const [x, y] of foes) {
      rect(x, y, 2, 2, "#e0605a");
      px(x, y, "#ffffff");
    }
    [
      [10, 7],
      [23, 7],
    ].forEach(([tx, ty], k) => {
      rect(tx, ty, 3, 3, "#8a8f97");
      px(tx, ty - 1, "#8a8f97");
      px(tx + 2, ty - 1, "#8a8f97");
      px(tx + 1, ty + 1, "#3b3a5c");
      const f = (t * 2) % 1;
      const [fx, fy] = foes[(Math.floor(t * 2) + k * 2) % 5];
      px(tx + 1 + (fx - tx - 1) * f, ty + (fy - ty) * f, "#f6cf4a");
      if (f > 0.85) px(fx + 1, fy - 1, "#ffffff");
    });
    rect(0, 9, 3, 5, "#b9b4c9");
    px(0, 8, "#b9b4c9");
    px(2, 8, "#b9b4c9");
    px(1, 12, "#5c3a26");
    number(px, 1 + (Math.floor(t / 12) % 9), 23, 0, "#ffffff");
  } else if (game === "kart") {
    // Karts round an oval track seen from above: his red one and two rivals on the grey, the chequered line at
    // the top, an item box flashing on the bend, and his lap in the middle.
    rect(0, 0, w, h, "#5bb046");
    for (let y = 0; y < h; y++) {
      const dy = y + 0.5 - 7.5;
      const outer = 12.5 * Math.sqrt(Math.max(0, 1 - (dy / 7.5) ** 2));
      const inner = 7 * Math.sqrt(Math.max(0, 1 - (dy / 3) ** 2));
      rect(13 - outer, y, Math.round(outer * 2), 1, "#5c6066");
      if (inner > 0) rect(13 - inner, y, Math.round(inner * 2), 1, "#4f9f3c");
    }
    for (let y = 0; y < 5; y++) {
      px(13, y, y % 2 ? "#ffffff" : "#1f1f24");
      px(14, y, y % 2 ? "#1f1f24" : "#ffffff");
    }
    rect(2, 7, 2, 2, ["#e0402e", "#f6cf4a", "#3fd47a", "#3e6fd6"][Math.floor(t * 6) % 4]);
    [
      [1.2, 0, "#e0402e"],
      [1.15, 0.5, "#3e6fd6"],
      [1.25, -0.6, "#f6cf4a"],
    ].forEach(([speed, lead, c]) => {
      const a = t * speed + lead - Math.PI / 2;
      rect(13 + 9.75 * Math.cos(a) - 1, 7 + 5.25 * Math.sin(a), 2, 2, c);
    });
    number(px, 1 + (Math.floor((t * 1.2) / (2 * Math.PI)) % 3), 12, 5, "#ffffff");
  } else if (game === "pinball") {
    // Pinball: the ball bouncing round the table, the bumpers lighting up as it hits them, the flippers flicking
    // at the bottom, the lights blinking down the sides and the score climbing at the top.
    rect(0, 0, w, h, "#14102e");
    rect(3, 0, 20, h, "#2a1f5c");
    for (let k = 0; k < 5; k++) {
      const on = (Math.floor(t * 6) + k) % 5 === 0;
      px(1, 1 + k * 3, on ? "#ffe58a" : "#56607e");
      px(24, 13 - k * 3, on ? "#ffe58a" : "#56607e");
    }
    number(px, `${Math.floor(t * 7) % 100}0`, 7, 0, "#f6cf4a");
    const bx = 12.5 + 7 * Math.sin(t * 2.3) * Math.cos(t * 0.7);
    const by = 7 + 5 * Math.sin(t * 3.1);
    [
      [8, 7],
      [17, 7],
      [12, 10],
    ].forEach(([x, y]) => {
      const lit = Math.abs(bx - x) + Math.abs(by - y) < 3.5;
      rect(x - 1, y, 3, 1, lit ? "#ffe58a" : "#e05aa0");
      rect(x, y - 1, 1, 3, lit ? "#ffe58a" : "#e05aa0");
    });
    const flip = (x0, dir, up) => {
      for (let k = 0; k < 4; k++) px(x0 + dir * k, 12 + (up ? -k * 0.4 : k * 0.4), "#f6cf4a");
    };
    flip(6, 1, Math.sin(t * 5) > 0.6);
    flip(19, -1, Math.sin(t * 5 + 2) > 0.6);
    px(bx, by, "#ffffff");
  } else if (game === "cards") {
    // A memory card game on green felt: two cards turned over on each go and, as they match, staying face up
    // with their colour showing, his cursor on the card he is turning, all of them up at the end and a new deal.
    rect(0, 0, w, h, "#2f7a4a");
    const SUIT = ["#e0402e", "#2b2522", "#f6cf4a", "#3e6fd6", "#b46be0", "#3fd47a", "#f39a33", "#f28aa8", "#8fd3ff"];
    const go = Math.floor(t / 1.5) % 11;
    const into = (t / 1.5) % 1;
    for (let i = 0; i < 18; i++) {
      const v = (i * 7) % 18; // shuffled: card i belongs to pair v / 2
      const pair = v >> 1;
      const x = 1 + (i % 6) * 4;
      const y = 1 + Math.floor(i / 6) * 5;
      if (pair === go && (v & 1) === (into > 0.4 ? 1 : 0)) rect(x - 1, y - 1, 5, 6, "#f6cf4a");
      if (pair < go || (pair === go && into > (v & 1 ? 0.6 : 0.2))) {
        rect(x, y, 3, 4, "#fff8ef");
        rect(x + 1, y + 1, 1, 2, SUIT[pair]);
      } else {
        rect(x, y, 3, 4, "#3e6fd6");
        rect(x + 1, y + 1, 1, 2, "#8fd3ff");
      }
    }
  } else if (game === "snake") {
    // Snake: the snake going round its winding way, growing a square each time it eats the apple waiting ahead.
    rect(0, 0, w, h, "#2f5a2f");
    rect(1, 1, w - 2, h - 2, "#1c3a24");
    const n = SNAKE.length;
    const head = Math.floor(t * 8);
    const meal = Math.floor(head / 24);
    const [ax, ay] = SNAKE[((meal + 1) * 24) % n];
    rect(ax, ay, 1, 1, "#e0402e");
    const long = 4 + (meal % 8);
    for (let k = long - 1; k >= 0; k--) {
      const [x, y] = SNAKE[(((head - k) % n) + n) % n];
      px(x, y, k === 0 ? "#3fd47a" : k % 2 ? "#5fb03a" : "#7cc463");
    }
  } else if (game === "battle") {
    // A monster battle: his knight facing a dragon across the field, the two of them taking turns to strike, the
    // health bars going down with every hit, and the menu at the bottom with its cursor blinking.
    rect(0, 0, w, 7, "#9fd8f5");
    rect(0, 7, w, 3, "#7fbf5a");
    const round = Math.floor(t / 1.6) % 10;
    const phase = (t / 1.6) % 1;
    const mine = round % 2 === 0;
    const hits = Math.floor((round + 1) / 2) + (mine && phase > 0.5 ? 1 : 0);
    const bites = Math.floor(round / 2) + (!mine && phase > 0.5 ? 1 : 0);
    rect(1, 1, 8, 1, "#3b3330");
    rect(1, 1, 8 - bites, 1, "#3fd47a");
    rect(17, 1, 8, 1, "#3b3330");
    rect(17, 1, Math.max(0, 8 - Math.round(hits * 1.6)), 1, "#e0605a");
    const dx = mine ? Math.round(Math.sin(phase * Math.PI) * 8) : 0;
    rect(4 + dx, 4, 2, 3, "#8a8f97");
    rect(4 + dx, 3, 2, 1, "#f9d6bd");
    rect(6 + dx, 2, 1, 3, "#e8e8e8");
    px(3 + dx, 5, "#3e6fd6");
    const hurt = mine && phase > 0.45 && phase < 0.65;
    const flap = Math.sin(t * 6) > 0 ? 0 : 1;
    rect(19, 2 + flap, 4, 1, "#3f8a3a");
    rect(17, 4, 6, 3, hurt ? "#ffffff" : "#5aa34f");
    rect(15, 3, 3, 2, hurt ? "#ffffff" : "#5aa34f");
    px(15, 3, "#2b2522");
    rect(22, 6, 3, 1, "#5aa34f");
    if (hurt) [16, 19, 22].forEach((x, k) => px(x, 3 + k, "#f6cf4a"));
    if (!mine && phase > 0.3 && phase < 0.7) for (let k = 0; k < 4; k++) px(14 - k * 2, 4 + (k % 2), k % 2 ? "#f39a33" : "#f6cf4a");
    rect(0, 10, w, h - 10, "#1d3f7a");
    rect(0, 10, w, 1, "#fff8ef");
    rect(4, 12, 6, 1, "#fff8ef");
    rect(15, 12, 6, 1, "#fff8ef");
    rect(4, 14, 4, 1, "#fff8ef");
    rect(15, 14, 5, 1, "#fff8ef");
    if (t % 0.6 < 0.4) px(2, 12, "#f6cf4a");
  } else if (game === "stardew") {
    // Her cosy farm: a fence along the top and three tilled rows, the crops coming up a stage each day from
    // seeds to ripe, and her farmer (straw hat, pink shirt) watering a row a third of the day, the soil dark behind her.
    const clock = farmDay(t, e);
    const stage = Math.floor(clock) % 4; // seeds, sprouts, leaves, ripe
    const row = Math.floor((clock % 1) * 3);
    const along = 2 + (((clock % 1) * 3) % 1) * 22;
    rect(0, 0, w, h, "#7ec85a");
    rect(0, 1, w, 1, "#c48a4a");
    for (let x = 1; x < w; x += 4) rect(x, 0, 1, 3, "#9a6a3a");
    for (let r = 0; r < 3; r++) {
      const y = 5 + r * 3;
      rect(2, y, 22, 2, "#8a5a34");
      rect(2, y, r < row ? 22 : r === row ? along - 2 : 0, 2, "#6b4429");
      for (let x = 3; x < 24; x += 3) {
        if (stage === 0) px(x, y + 1, "#d9b98a");
        else if (stage === 1) px(x, y, "#9fe07a");
        else {
          px(x, y - 1, "#5bb046");
          px(x, y, stage === 3 ? CROPS[r] : "#5bb046");
        }
      }
    }
    const fx = Math.round(along);
    const fy = 6 + row * 3;
    rect(fx - 1, fy - 3, 4, 1, "#f2d27a");
    rect(fx, fy - 2, 2, 1, "#f9d6bd");
    rect(fx, fy - 1, 2, 1, "#f28aa8");
    rect(fx, fy, 2, 1, "#3e6fd6");
    rect(fx + 2, fy - 1, 2, 1, "#9aa3b0");
    px(fx + 4, fy - 1 + Math.floor((t * 6) % 2), "#8fd3ff");
  } else {
    // Running and jumping over the hills, by day and then at dusk, coins to catch, a slime coming the other way.
    const dusk = Math.floor(t / 20) % 2;
    rect(0, 0, w, h, dusk ? "#3b2d6b" : "#8fd0f5");
    rect(0, 8, w, 2, dusk ? "#5b3f86" : "#bfe6fb");
    for (let x = 0; x < w; x++) {
      const top = 10 + Math.round(1.5 * Math.sin((x + t * 9) * 0.35));
      rect(x, top, 1, h - top, (x + Math.floor(t * 9)) % 4 ? "#3fae6a" : "#2f8f55");
    }
    const jump = Math.max(0, Math.sin(t * 4)) * 4;
    rect(6, 7 - jump, 2, 3, "#f6cf4a");
    rect(6, 6 - jump, 2, 1, "#f9d6bd");
    const coin = w - ((t * 9) % (w + 4));
    if (Math.sin(t * 6) > -0.5) rect(coin, 4, 1, 1, "#ffe58a");
    rect(w - ((t * 13 + 9) % (w + 6)), 9, 3, 2, "#e0605a");
    rect(1, 1, 6, 1, "#8fd3ff");
  }
}

// Her dramas on his computer. Each has its own setting, in soft colours (the wall or sky, the floor), and its
// two leads (hair and clothes); the romances float a heart between them now and then.
const DRAMA_LOOK = {
  palace: { back: "#e9b8b0", floor: "#e8cf8a", leads: ["#2b2522", "#f7b8cc", "#2b2522", "#b8a0e0"] },
  rain: { back: "#8a9cc0", floor: "#6f7f9f", leads: ["#2b2522", "#3e4f7a", "#47281b", "#f2e3c4"], heart: true },
  hospital: { back: "#dcefe8", floor: "#bfd4cc", leads: ["#2b2522", "#ffffff", "#5e3624", "#8fc0e8"] },
  detective: { back: "#3a4060", floor: "#565a70", leads: ["#3b3330", "#c9a878", "#47281b", "#8a6f9a"] },
  campus: { back: "#cdeafa", floor: "#e6d8b8", leads: ["#2b2522", "#3a4f8a", "#8a4a2a", "#3a4f8a"], heart: true },
  wuxia: { back: "#d8ecd0", floor: "#a8d090", leads: ["#1a1416", "#f2f2f2", "#1a1416", "#4a4f5a"] },
  sitcom: { back: "#f6e3a0", floor: "#d9b48a", leads: ["#5e3624", "#3e6fd6", "#f2c14e", "#e05aa0"] },
  cafe: { back: "#d9b896", floor: "#a8805f", leads: ["#2b2522", "#3f7a5a", "#47281b", "#f28aa8"], heart: true },
};

// How far into the series she is: episodes of EPISODE seconds, picking up somewhere new each time she starts
// watching (`t - e` is when she did). The whole part is the episode, the rest how far into it.
const EPISODE = 150;
const watched = (t, e) => 2 + Math.floor(hash(Math.floor(t - e), 5, 21) * 10) + hash(Math.floor(t - e), 6, 21) * 0.8 + e / EPISODE;

// Her dramas on his computer: `drama` (DRAMAS), `e` how long she has been watching. The two leads talking in
// the drama's setting, cutting every five seconds to a close-up of one of them; under the picture the subtitles
// and a thin red progress bar.
export function drawPcDrama(g, w, h, drama, t, e) {
  const { rect, px } = pen(g);
  const look = DRAMA_LOOK[drama] || DRAMA_LOOK.cafe;
  const [hair0, clothes0, hair1, clothes1] = look.leads;
  const talker = Math.floor(e / 2) % 2;
  rect(0, 0, w, 13, look.back);
  if (Math.floor(e / 5) % 2) {
    // The close-up: a face filling the picture, blinking now and then and talking.
    const x = 8;
    const hair = talker ? hair1 : hair0;
    rect(x, 2, 10, 11, "#f9d6bd");
    rect(x - 1, 0, 12, 3, hair);
    rect(x - 1, 3, 1, 10, hair);
    rect(x + 10, 3, 1, 10, hair);
    for (const ex of [x + 1, x + 6]) {
      rect(ex, t % 4 < 0.15 ? 7 : 5, 3, t % 4 < 0.15 ? 1 : 3, "#2b2522");
      px(ex, 5, t % 4 < 0.15 ? "#f9d6bd" : "#ffffff");
    }
    rect(x + 1, 9, 2, 1, "#f7a1b5");
    rect(x + 7, 9, 2, 1, "#f7a1b5");
    rect(x + 4, 10, 2, Math.sin(t * 9) > 0 ? 2 : 1, "#c4503f");
  } else {
    rect(0, 10, w, 3, look.floor);
    // The setting's one or two things, behind the leads.
    if (drama === "palace") {
      for (const x of [3, 22]) {
        rect(x, 0, 1, 2, "#8a5a34");
        rect(x - 1, 2, 3, 3, "#e0605a");
        px(x, 3, "#ffe58a");
      }
    } else if (drama === "rain") {
      for (let k = 0; k < 10; k++) px((k * 7 + 3) % w, (k * 4 + t * 14) % 13, "#cdd8f0");
    } else if (drama === "hospital") {
      rect(3, 3, 3, 1, "#e0605a");
      rect(4, 2, 1, 3, "#e0605a");
      rect(20, 2, 5, 4, "#2b3a3a");
      px(20 + Math.floor((t * 5) % 5), 4 - (Math.floor(t * 5) % 5 === 2 ? 1 : 0), "#7fe0a0");
    } else if (drama === "detective") {
      px(4, 2, "#f3ecc8");
      rect(22, 1, 1, 9, "#2a2e40");
      rect(21, 1, 3, 1, "#ffe58a");
    } else if (drama === "campus") {
      rect(2, 4, 2, 6, "#9a6a4a");
      rect(0, 0, 6, 5, "#f7c6d6");
      for (let k = 0; k < 4; k++) px((k * 7 + t * 2) % w, (k * 3 + t * 2) % 10, "#f7a1b5");
    } else if (drama === "wuxia") {
      for (const x of [2, 5, 21, 24]) rect(x, 0, 1, 10, "#7cb86a");
    } else if (drama === "sitcom") {
      rect(1, 1, 5, 4, "#cdeafa");
    } else {
      rect(20, 1, 5, 5, "#cdeafa");
    }
    const bob = drama === "wuxia" || (drama === "sitcom" && e % 3 > 2) ? Math.round(Math.abs(Math.sin(t * 6))) : 0;
    person(rect, px, 9, 3 - bob, { hair: hair0, clothes: clothes0, mouth: talker === 0 && Math.sin(t * 9) > 0 });
    person(rect, px, 16, 3 - bob, { hair: hair1, clothes: clothes1, mouth: talker === 1 && Math.sin(t * 9) > 0 });
    // What goes in front of them: the umbrella, the detective's hat, the swords, the sofa, the café table.
    if (drama === "rain") {
      rect(7, 1, 13, 1, "#f28aa8");
      rect(9, 0, 9, 1, "#f28aa8");
      rect(13, 2, 1, 6, "#5c4a4a");
    } else if (drama === "detective") {
      rect(7, 2, 6, 1, "#3b3330");
      rect(8, 1, 4, 1, "#3b3330");
    } else if (drama === "wuxia") {
      rect(13, 8 - bob, 2, 1, "#c9d6e6");
      rect(12, 8 - bob, 1, 1, "#ffffff");
    } else if (drama === "sitcom") {
      rect(5, 9, 17, 3, "#e08a6a");
    } else if (drama === "cafe") {
      rect(10, 9, 7, 1, "#8a5a3a");
      px(11, 8, "#ffffff");
      px(15, 8, "#ffffff");
    }
    if (look.heart && e % 5 > 3) {
      const y = Math.round(4 - (e % 5) + 3);
      px(12, y, "#ff6f9a");
      px(14, y, "#ff6f9a");
      rect(12, y + 1, 3, 1, "#ff6f9a");
      px(13, y + 2, "#ff6f9a");
    }
  }
  rect(0, 13, w, 2, "#1b1b22");
  if (e % 2.5 < 2) {
    const said = Math.floor(e / 2.5) + Math.floor(t - e);
    rect(5 + Math.floor(hash(said, 0, 22) * 4), 13, 10 + Math.floor(hash(said, 1, 22) * 6), 1, "#f2f2f2");
  }
  rect(0, 14, Math.max(1, Math.round((watched(t, e) % 1) * w)), 1, "#e0605a");
}

// The side screen while she uses his computer, `w` by `h` on end (11 by 25). Watching a drama (`mode` "show",
// `game` its DRAMAS id): a strip in the drama's colours, its episodes with this one picked out, and how far
// in she is. Playing her farm game ("game"): the date and the day's clock, and her energy running down.
export function drawSideShow(g, w, h, mode, game, t, e) {
  const { rect, px } = pen(g);
  if (mode === "off") return rect(0, 0, w, h, "#060608");
  if (mode === "show") {
    const look = DRAMA_LOOK[game] || DRAMA_LOOK.cafe;
    rect(0, 0, w, h, "#1f1f28");
    rect(0, 0, w, 4, look.back);
    rect(2, 1, 2, 3, look.leads[1]);
    rect(7, 1, 2, 3, look.leads[3]);
    const p = watched(t, e);
    for (let k = 0; k < 5; k++) {
      const y = 6 + k * 3;
      const now = k === 1; // the one before, this one, and the three after
      if (now) rect(0, y - 1, w, 3, "#3a3a4c");
      px(1, y, now ? "#e0605a" : k < 1 ? "#7fe0a0" : "#6a6f86");
      rect(3, y, 4 + ((Math.floor(p) + k) % 3), 1, now ? "#ffffff" : "#9aa0b8");
    }
    rect(1, 22, w - 2, 1, "#3a3a4c");
    rect(1, 22, Math.max(1, Math.round((p % 1) * (w - 2))), 1, "#e0605a");
    return;
  }
  const clock = farmDay(t, e);
  const hour = clock % 1;
  rect(0, 0, w, h, "#7ec85a");
  rect(0, 0, w, 10, "#8a5a34");
  rect(1, 1, w - 2, 8, "#f6d79a");
  const date = (Math.floor(clock) % 28) + 1;
  number(px, date, date < 10 ? 4 : 2, 2, "#5c3a26");
  rect(2, 8, 7, 1, "#e8c27a");
  rect(2, 8, Math.round(hour * 7), 1, "#e0905a");
  const full = Math.round((1 - hour * 0.8) * 9);
  rect(3, 13, 5, 11, "#8a5a34");
  rect(4, 14, 3, 9, "#3b3330");
  rect(4, 23 - full, 3, full, full > 4 ? "#7fe07a" : "#f6cf4a");
}
