/*******************************************************************************
 * The games he plays on his computer (a platformer, a farm, a world of blocks,
 * a race, falling blocks, a space shooter, a rhythm game, fishing, tower
 * defence, karts, pinball, a memory card game, snake, a monster battle) with
 * their win and loss screens and the launcher he picks them from, what his side
 * screen shows while he plays; her cosy farm game is drawn by stardew.js.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number } from "./pen.js";
import { drawStardew } from "./stardew.js";

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

// Each game's two colours, for its tile in the launcher and its picture in a guide.
const ICON = {
  platformer: ["#8fd0f5", "#3fae6a"],
  farm: ["#6fb24f", "#f2c14e"],
  blocks: ["#5fb03a", "#8a5a34"],
  race: ["#5c6066", "#e0402e"],
  puzzle: ["#2a2a4a", "#f6cf4a"],
  space: ["#0b0d26", "#ffffff"],
  rhythm: ["#3a1f5c", "#f28aa8"],
  fishing: ["#3e8fd6", "#f6cf4a"],
  defence: ["#7cc463", "#8a8f97"],
  kart: ["#f39a33", "#3e6fd6"],
  pinball: ["#1f2a5a", "#e0e0e0"],
  cards: ["#2e7d4f", "#ffffff"],
  snake: ["#1f1f24", "#7fe07a"],
  battle: ["#f6e7c1", "#e0402e"],
};

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

// His computer: `mode` "off", "menu" (the launcher, `game` about to be played), "game", "win" or "lose",
// `game` (GAMES, or hers from GIRL_GAMES) while one is on, `e` how long since the mode changed.
export function drawPcGame(g, w, h, mode, game, t, e, seed) {
  const { rect, px } = pen(g);
  if (mode === "off") return rect(0, 0, w, h, "#060608");
  if (mode === "menu") {
    // His library, a row of tiles with the one he picks in the middle: the cursor steps along to it, its
    // banner shows below, and PLAY flashes once it is chosen.
    rect(0, 0, w, h, "#141623");
    rect(0, 0, w, 2, "#22263a");
    rect(w - 3, 0, 2, 2, "#f28aa8"); // his picture
    const i = GAMES.indexOf(game);
    const slot = Math.min(2, Math.floor(e / 0.35));
    for (let k = 0; k < 5; k++) {
      const [a, b] = ICON[GAMES[(i + k - 2 + GAMES.length) % GAMES.length]];
      const x = 1 + k * 5;
      rect(x - 1, 3, 6, 6, k === slot ? "#ffffff" : "#3a3f58");
      rect(x, 4, 4, 4, a);
      rect(x, 6, 4, 2, b);
    }
    const [a, b] = ICON[game];
    rect(1, 10, w - 2, 4, "#2c3048");
    rect(2, 11, 3, 2, a);
    px(3, 12, b);
    rect(6, 11, 9, 1, "#ffffff");
    rect(6, 12, 6, 1, "#9aa3c0");
    if (slot === 2) rect(w - 8, 11, 6, 2, e % 0.5 < 0.3 ? "#3fd47a" : "#2a9a58");
    return;
  }
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
    drawStardew(g, w, h, t, e, seed);
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

// What his side screen (on end, `w` by `h`) shows while he plays, a different thing now and then (`side`):
// "chat", his team's voice channel (his own name lit up green while he is `talking`) and the chat scrolling
// up below; "music", the song playing, its progress and the equaliser; "stats", the frame rate and the
// processor's and graphics card's load scrolling by; "guide", a guide to `game`, a picture and its text
// scrolling slowly. A win or a loss shows as a line in gold or red.
export const SIDES = ["chat", "music", "stats", "guide"];
const TEAM = ["#f28aa8", "#8fd3ff", "#f6cf4a", "#9fe0a8"]; // his, then his three teammates'
const ART = ["#f28aa8", "#8fd3ff", "#f6cf4a", "#9fe0a8", "#c79bf2", "#f39a33"];

export function drawGameSide(g, w, h, side, mode, game, t, talking) {
  const { rect, px } = pen(g);
  if (side === "music") {
    const song = Math.floor(t / 40);
    rect(0, 0, w, h, "#121218");
    rect(2, 2, 7, 7, ART[song % 6]); // the cover
    rect(4, 4, 3, 3, ART[(song + 3) % 6]);
    rect(1, 11, 3 + Math.floor(hash(song, 0, 30) * 6), 1, "#e8e8f0");
    rect(1, 13, 2 + Math.floor(hash(song, 1, 30) * 5), 1, "#8a8fa8");
    rect(1, 15, w - 2, 1, "#33333f");
    rect(1, 15, Math.max(1, Math.round(((t % 40) / 40) * (w - 2))), 1, "#3fd47a");
    for (let k = 0; k < w - 2; k++) {
      const tall = 1 + Math.floor(5 * Math.abs(Math.sin(t * (2.6 + k * 0.7) + k)));
      rect(1 + k, 24 - tall, 1, tall, "#3fd47a");
    }
  } else if (side === "stats") {
    rect(0, 0, w, h, "#0f1117");
    number(px, 140 + Math.floor(hash(Math.floor(t * 2), 0, 31) * 5), 0, 1, "#7fe07a");
    ["#8fd3ff", "#f39a33", "#c79bf2"].forEach((c, row) => {
      const y = 8 + row * 6;
      rect(0, y + 5, w, 1, "#262a3a");
      for (let x = 0; x < w; x++) {
        const tall = 1 + Math.floor(hash(Math.floor(t * 4) + x, row, 32) * (2 + row));
        rect(x, y + 5 - tall, 1, tall, c);
      }
    });
  } else if (side === "guide") {
    const [a, b] = ICON[game] || ICON.platformer;
    rect(0, 0, w, h, "#f4f1ea");
    rect(0, 0, w, 2, "#5b6ee1");
    rect(1, 3, w - 2, 6, a);
    rect(3, 6, 3, 2, b);
    const line = Math.floor(t * 0.8);
    for (let k = 0; k < 6; k++) rect(1, 11 + k * 2, 3 + Math.floor(hash(line + k, 4, 33) * 7), 1, "#8a8fa8");
  } else {
    rect(0, 0, w, h, "#262a3a");
    rect(0, 0, w, 2, "#5b6ee1");
    TEAM.forEach((c, i) => {
      const y = 3 + i * 3;
      const on = i === 0 ? talking : Math.sin(t * (1.3 + i) + i * 2) > 0.7;
      rect(1, y, 3, 2, on ? "#3fd47a" : "#262a3a");
      rect(2, y, 1, 2, c);
      rect(5, y + 1, 3 + ((i * 2) % 4), 1, "#9aa3c0");
    });
    // The chat, scrolling up a line every second.
    const first = Math.floor(t);
    for (let k = 0; k < 6; k++) {
      const line = first + k;
      rect(1, 16 + k * 1.5, 1, 1, TEAM[line % 4]);
      rect(3, 16 + k * 1.5, 2 + Math.floor(hash(line, 1, 2) * 7), 1, "#c9cfe3");
    }
  }
  if (mode === "win" || mode === "lose") rect(1, side === "chat" ? 15 : 10, w - 2, 1, mode === "win" ? "#f6cf4a" : "#e0605a");
}
