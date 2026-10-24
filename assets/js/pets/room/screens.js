/*******************************************************************************
 * What is on the playground's screens (house.js draws them a few times a
 * second, a texel a pixel): the TV's channels (a nature programme, a cartoon,
 * a cooking show, the evening news, the weather forecast, adverts, a football
 * match, a concert), the game the two of them play on it, and the games he
 * plays on his computer (a platformer, a farm, a world of blocks, a race, a
 * falling-blocks puzzle, a space shooter) with their win and loss screens.
 ******************************************************************************/

import { hash } from "../models/voxels.js";

export const CHANNELS = ["nature", "cartoon", "cooking", "news", "weather", "advert", "football", "concert"];
export const GAMES = ["platformer", "farm", "blocks", "race", "puzzle", "space"];

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

// The TV: `channel` (CHANNELS), `t` the clock, `e` how long it has been on this channel.
export function drawChannel(g, w, h, channel, t, e) {
  const { rect, px } = pen(g);
  if (channel === "nature") {
    // Hills under a sky, a cloud going by and a sheep hopping along.
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
  } else if (channel === "cartoon") {
    // A cartoon cat waving on a pink stage.
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
    // The weather forecast: sun, cloud and rain over the map, each place's temperature along the bottom
    // under it, and the presenter pointing at the map.
    rect(0, 0, w, h, "#6fb3e0");
    for (let y = 2; y < 18; y++) {
      const a = 3 + Math.round(2 * Math.sin(y * 0.6) + Math.sin(y * 1.7));
      const b = 31 - Math.round(2 * Math.sin(y * 0.5 + 1));
      rect(a, y, b - a, 1, y % 5 ? "#7fbf5a" : "#71b04f");
    }
    const icon = (x, y, kind) => {
      if (kind === "sun") {
        rect(x, y, 4, 4, "#ffd75a");
        if (Math.sin(t * 4) > 0)
          [
            [-1, 1],
            [4, 2],
            [1, -1],
            [2, 4],
          ].forEach(([dx, dy]) => px(x + dx, y + dy, "#ffd75a"));
      } else {
        rect(x, y + 1, 6, 3, "#ffffff");
        rect(x + 1, y, 3, 1, "#ffffff");
        if (kind === "rain") for (let k = 0; k < 3; k++) px(x + 1 + k * 2, y + 5 + Math.floor((t * 6 + k) % 3), "#2f6fd6");
      }
    };
    icon(5, 6, "sun");
    icon(15, 10, "cloud");
    icon(26, 4, "rain");
    rect(0, 18, w, 6, "#1d3f7a");
    number(px, 25, 4, 19, "#ffd75a");
    number(px, 18, 15, 19, "#ffffff");
    number(px, 21, 26, 19, "#8fd3ff");
    person(rect, px, 37, 7, { hair: "#47281b", clothes: "#d9334a", mouth: Math.sin(t * 9) > 0 });
    rect(32 + Math.round(Math.sin(t * 1.5)), 11, 2, 1, "#f9d6bd"); // her arm, pointing
  } else if (channel === "advert") {
    // Adverts: a juice bottle bouncing in a burst of colour, then a little red car on the open road.
    if (e % 9 < 4.5) {
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

// His computer: `mode` "off", "game", "win" or "lose", `game` (GAMES) while one is on, `e` how long since
// the mode changed.
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
    // A space shooter: stars streaming past, his ship weaving at the bottom, shots going up at the invaders.
    rect(0, 0, w, h, "#0c0f24");
    for (let k = 0; k < 14; k++) px((k * 7) % w, (k * 5 + t * (6 + (k % 3) * 4)) % h, k % 3 ? "#8c93c4" : "#ffffff");
    const sx = w / 2 + 8 * Math.sin(t * 1.4);
    rect(sx - 1, h - 2, 3, 1, "#8fd3ff");
    px(sx, h - 3, "#ffffff");
    for (let k = 0; k < 3; k++) px(sx, h - 4 - ((t * 20 + k * 4) % 10), "#f6cf4a");
    for (let k = 0; k < 5; k++) {
      const ex = 3 + k * 5 + Math.round(2 * Math.sin(t * 2));
      rect(ex, 2 + (k % 2), 2, 1, "#e05aa0");
      if (Math.sin(t * 3 + k) > 0) px(ex, 3 + (k % 2), "#e05aa0");
    }
  } else {
    // Running and jumping over the hills at dusk, coins to catch, a slime coming the other way.
    rect(0, 0, w, h, "#3b2d6b");
    rect(0, 8, w, 2, "#5b3f86");
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
