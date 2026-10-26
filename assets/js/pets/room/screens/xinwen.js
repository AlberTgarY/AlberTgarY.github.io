/*******************************************************************************
 * The evening news at seven on the TV (tv.js): the opening titles (the globe
 * turning in a teal starry sky and the golden title coming up in front of it,
 * a gleam running across it), then the studio, the two presenters at the desk
 * in front of the wall of screens taking turns to read the news, the channel's
 * logo and the clock above them and the caption bar along the bottom.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number } from "./pen.js";

const TITLES = 5; // the opening titles, then the studio, every LOOP seconds
const LOOP = 40;
const CJK = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans SC', SimHei, sans-serif";

// Capital letters five texels high, a row at a time (as wide as they need: N and W are wider), for the
// pinyin and the logo; a space is two texels.
const LETTERS = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  E: ["111", "100", "110", "100", "111"],
  I: ["111", "010", "010", "010", "111"],
  L: ["100", "100", "100", "100", "111"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  T: ["111", "010", "010", "010", "010"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10001", "10001", "10101", "10101", "01010"],
  X: ["101", "101", "010", "101", "101"],
  " ": ["0", "0", "0", "0", "0"],
};
const wordWidth = (text) => [...text].reduce((n, ch) => n + LETTERS[ch][0].length + 1, -1);
function word(px, text, x, y, c) {
  for (const ch of text) {
    LETTERS[ch].forEach((row, j) => [...row].forEach((on, i) => on === "1" && px(x + i, y + j, c)));
    x += LETTERS[ch][0].length + 1;
  }
}

// `t` the clock, `e` how long the TV has been on this channel; w x h texels (84 x 48).
export function drawXinwen(g, w, h, t, e) {
  const k = e % LOOP;
  if (k < TITLES) titles(g, w, h, t, k);
  else studio(g, w, h, t, k - TITLES);
  // A flash of white as the titles cut to the studio.
  const cut = k - TITLES;
  if (cut >= 0 && cut < 0.3) {
    g.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - cut / 0.3)})`;
    g.fillRect(0, 0, w, h);
  }
}

/* ---------- the opening titles ---------- */

function titles(g, w, h, t, k) {
  const { px } = pen(g);
  // The sky: teal in the middle going to deep blue at the edges, beams of light across it, and stars.
  const sky = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.62);
  sky.addColorStop(0, "#5fe3dc");
  sky.addColorStop(0.45, "#1f8fb0");
  sky.addColorStop(1, "#08244f");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(190, 255, 250, 0.16)";
  for (let b = 0; b < 4; b++) {
    const x0 = ((b * 29 + k * 6) % (w + 30)) - 20;
    for (let y = 0; y < h; y++) g.fillRect(x0 + y * 0.6, y, 2, 1);
  }
  for (let s = 0; s < 22; s++) {
    if (Math.sin(t * 3 + s * 2.1) < -0.3) continue;
    px(Math.floor(hash(s, 1, 41) * w), Math.floor(hash(s, 2, 41) * h), hash(s, 3, 41) < 0.5 ? "#ffffff" : "#bff6ff");
  }
  // The globe, coming up from far away, turning.
  const grow = Math.min(1, k / 0.8);
  globe(g, w / 2, h / 2 - 1, 4 + 13 * (1 - (1 - grow) ** 3), t);
  // The title, coming up from big and faint, then a gleam running across it; the pinyin under it.
  const come = Math.min(1, Math.max(0, (k - 0.5) / 0.7));
  if (come <= 0) return;
  g.save();
  g.globalAlpha = come;
  g.translate(w / 2, 21);
  g.scale(1 + 0.8 * (1 - come), 1 + 0.8 * (1 - come));
  g.font = `900 13px ${CJK}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#6b3a00";
  g.fillText("新闻联播", 0.6, 1);
  const shine = ((k - 1.4) / 1.6) * 80 - 40;
  const gold = g.createLinearGradient(-30, -7, 30, 7);
  const stop = (u) => Math.min(1, Math.max(0, (u + 40) / 80));
  gold.addColorStop(0, "#fff3a6");
  gold.addColorStop(stop(shine - 8), "#f4c430");
  gold.addColorStop(stop(shine), "#ffffff");
  gold.addColorStop(stop(shine + 8), "#f4c430");
  gold.addColorStop(1, "#d9961a");
  g.fillStyle = gold;
  g.fillText("新闻联播", 0, 0);
  g.restore();
  if (k > 1.2) {
    const text = "XINWEN LIANBO";
    const x = Math.round((w - wordWidth(text)) / 2);
    word(px, text, x + 1, 31, "#0b3a74");
    word(px, text, x, 30, "#d8f6ff");
  }
}

// The earth at (cx, cy), radius r, turning with the clock `t`: oceans, the land and the ice, clouds, lit from
// the upper left, and the thin bright air round its edge.
function globe(g, cx, cy, r, t) {
  const x0 = Math.max(0, Math.floor(cx - r - 2));
  const y0 = Math.max(0, Math.floor(cy - r - 2));
  const size = Math.ceil(2 * r + 4);
  const img = g.getImageData(x0, y0, size, size);
  const d = img.data;
  const light = [-0.5, -0.55, 0.67];
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const nx = (x0 + i + 0.5 - cx) / r;
      const ny = (y0 + j + 0.5 - cy) / r;
      const rr = nx * nx + ny * ny;
      const o = (j * size + i) * 4;
      if (rr > 1) {
        const glow = Math.max(0, 1 - (Math.sqrt(rr) - 1) / 0.14);
        if (glow > 0) mix(d, o, [150, 250, 255], 0.7 * glow);
        continue;
      }
      const z = Math.sqrt(1 - rr);
      const lat = Math.asin(-ny);
      const lon = Math.atan2(nx, z) + t * 0.35;
      const n = Math.sin(lon * 2 + 1.3) * Math.cos(lat * 2.6) + 0.6 * Math.sin(lon * 5 + lat * 4) + 0.35 * Math.sin(lon * 9 - lat * 7);
      let c;
      if (Math.abs(lat) > 1.2) c = [235, 245, 250];
      else if (n > 0.55) c = n > 1.05 ? [176, 150, 96] : [70, 150, 78];
      else c = n > 0.35 ? [52, 128, 196] : [24, 84, 170];
      const cloud = Math.sin(lon * 6 + lat * 3 + t * 0.15) * Math.sin(lat * 8 - lon * 2);
      if (cloud > 0.62) c = c.map((v) => v + (250 - v) * 0.75);
      const lit = Math.max(0.28, nx * light[0] + ny * light[1] + z * light[2]);
      const rim = (1 - z) ** 2;
      d[o] = Math.min(255, c[0] * lit + 90 * rim);
      d[o + 1] = Math.min(255, c[1] * lit + 200 * rim);
      d[o + 2] = Math.min(255, c[2] * lit + 230 * rim);
    }
  g.putImageData(img, x0, y0);
}
function mix(d, o, c, a) {
  for (let i = 0; i < 3; i++) d[o + i] += (c[i] - d[o + i]) * a;
}

/* ---------- the studio ---------- */

function studio(g, w, h, t, k) {
  const { rect, px } = pen(g);
  // The set: a blue wall, the wall of screens behind them (each flickering now and then), beams of light.
  const wall = g.createLinearGradient(0, 0, 0, 38);
  wall.addColorStop(0, "#0d2f6b");
  wall.addColorStop(1, "#2a63b4");
  g.fillStyle = wall;
  g.fillRect(0, 0, w, h);
  rect(4, 5, 76, 25, "#0a2552");
  const frame = Math.floor(t * 2);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 12; c++) {
      const on = hash(c, r, frame + c) < 0.85;
      const tint = ["#3f8fd8", "#5fb0e8", "#2f6fc0", "#7fc8f0"][Math.floor(hash(c, r, 7) * 4)];
      rect(6 + c * 6, 7 + r * 6, 5, 4, on ? tint : "#1b4a8c");
      if (on && hash(c, r, 9) < 0.5) rect(7 + c * 6, 9 + r * 6, 2, 1, "#d8f0ff");
    }
  g.fillStyle = "rgba(170, 220, 255, 0.12)";
  g.fillRect(30, 0, 24, 38);
  // The logo, top left; the clock, top right, counting the seconds from seven.
  word(px, "CCTV", 3, 2, "#ffffff");
  rect(20, 1, 6, 7, "#c8323c");
  number(px, 1, 21, 2, "#ffffff");
  rect(54, 1, 29, 7, "#e9eef5");
  rect(55, 0, 27, 9, "#e9eef5");
  const two = (n) => String(n).padStart(2, "0");
  [19, two(Math.floor(k / 60)), two(Math.floor(k) % 60)].forEach((n, i) => {
    number(px, n, 56 + i * 9, 2, "#3a4a66");
    if (i < 2) {
      px(64 + i * 9, 3, "#3a4a66");
      px(64 + i * 9, 5, "#3a4a66");
    }
  });
  // The two of them, taking turns to read the news, now and then blinking.
  const reader = Math.floor(k / 5) % 2;
  presenter(rect, px, 21, t, reader === 0, {
    hair: "#17130f",
    jacket: "#c4252d",
    jacketDark: "#93171f",
    top: (x, y) => ((x + y) % 3 === 0 ? "#f2f2f2" : "#151515"),
    bob: true,
  });
  presenter(rect, px, 63, t + 1.7, reader === 1, {
    hair: "#121212",
    jacket: "#1e2433",
    jacketDark: "#12161f",
    top: (x) => (x === 63 ? "#b3202a" : "#f4f4f4"),
    bob: false,
  });
  // The desk, its top catching the light, their papers on it.
  rect(0, 36, w, 4, "#dce8f6");
  rect(0, 36, w, 1, "#ffffff");
  rect(0, 39, w, 1, "#9fb8d8");
  rect(13, 35, 9, 2, "#ffffff");
  rect(57, 35, 9, 2, "#ffffff");
  // The caption bar: the station's little globe, the programme's name on a blue tab, and the date.
  const bar = g.createLinearGradient(0, 40, 0, 48);
  bar.addColorStop(0, "#f5f9ff");
  bar.addColorStop(1, "#b9cfee");
  g.fillStyle = bar;
  g.fillRect(0, 40, w, 8);
  rect(0, 40, w, 1, "#3a6fc4");
  rect(5, 41, 5, 6, "#2f6fc0");
  rect(4, 42, 7, 4, "#2f6fc0");
  rect(6, 42, 2, 2, "#5fb86a");
  rect(8, 44, 2, 1, "#5fb86a");
  rect(15, 40, 32, 8, "#1f56b0");
  rect(15, 40, 32, 1, "#4f86d6");
  g.font = `bold 7px ${CJK}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#ffffff";
  g.fillText("新闻联播", 31, 44.5);
  const day = new Date();
  const date = [day.getFullYear(), day.getMonth() + 1, day.getDate()];
  let x = 50;
  date.forEach((n, i) => {
    number(px, n, x, 42, "#123a7a");
    x += String(n).length * 4;
    if (i < 2) {
      px(x - 1, 46, "#123a7a");
      x += 1;
    }
  });
}

// A presenter at the desk, the middle of them at x, seen from the chest up: hair (a bob, or short with a
// side parting), the face with eyes and brows that blink and a mouth that moves while `talking`, the jacket
// over `top` (a blouse, or a shirt and tie).
function presenter(rect, px, x, t, talking, { hair, jacket, jacketDark, top, bob }) {
  const nod = talking && Math.sin(t * 2.3) > 0.6 ? 1 : 0;
  const y = 12 + nod;
  // Shoulders and the jacket, the top in the V of it.
  rect(x - 10, 28, 21, 8, jacket);
  rect(x - 11, 30, 23, 6, jacket);
  rect(x - 10, 28, 2, 8, jacketDark);
  rect(x + 9, 28, 2, 8, jacketDark);
  for (let r = 0; r < 7; r++) for (let c = -3 + Math.floor(r / 2); c <= 3 - Math.floor(r / 2); c++) px(x + c, 28 + r, top(x + c, 28 + r));
  rect(x - 2, 26, 5, 2, "#e8b898"); // the neck
  // The head: hair behind, the face, hair over it.
  if (bob) rect(x - 6, y + 1, 13, 13, hair);
  rect(x - 5, y + 2, 11, 12, "#f3cba8");
  rect(x - 5, y + 2, 1, 10, "#e3b08c");
  rect(x - 5, y, 11, 3, hair);
  rect(x - 6, y + 1, 2, bob ? 10 : 4, hair);
  rect(x + 5, y + 1, 2, bob ? 10 : 4, hair);
  if (bob) rect(x - 2, y + 2, 5, 1, hair);
  else rect(x - 4, y + 2, 4, 1, hair); // the side parting
  // Brows, eyes (blinking), nose, mouth.
  rect(x - 3, y + 5, 2, 1, "#4a3426");
  rect(x + 2, y + 5, 2, 1, "#4a3426");
  const blink = Math.sin(t * 1.3) > 0.97;
  rect(x - 3, y + 7, 2, blink ? 1 : 2, blink ? "#a0785e" : "#1c1410");
  rect(x + 2, y + 7, 2, blink ? 1 : 2, blink ? "#a0785e" : "#1c1410");
  px(x, y + 9, "#d99c7a");
  const open = talking && Math.sin(t * 11) > 0;
  rect(x - 1, y + 11, 3, open ? 2 : 1, open ? "#8a2c2c" : "#c46a5a");
  if (bob) {
    px(x - 4, y + 9, "#f0a8a0");
    px(x + 4, y + 9, "#f0a8a0");
  }
}
