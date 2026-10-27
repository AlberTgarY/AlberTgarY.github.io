/*******************************************************************************
 * The time of day in the playground's home: a day of 40 minutes, 20 of them
 * daylight (06:00 to 18:00) and 20 night, so that an hour goes by in 100
 * seconds and the clocks' minute hands can be seen to move. The light follows
 * it: the sun coming up warm and low in the east, white and high at noon,
 * golden late in the afternoon and setting red in the west, a rosy dusk, then
 * the night's blue (room.js); the sky in the windows with it (house/windows.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export const DAY_SECS = 2400; // a whole day, in seconds
export const DAWN = 6; // when the day starts (and the night ends), in hours
export const NIGHTFALL = 18; // when the night starts
export const BEDTIME = 21; // not to bed before this (nor after the night ends)

// The light at given hours, in between mixed: the sky's and the ground's light (a hemisphere light) and how
// strong; the sun's colour and strength, how high it is (radians) and its bearing (round from the front,
// east to west by day; the moon's by night); the sky in the windows, top and bottom, and the haze out there.
const NIGHT = {
  sky: "#ffd2a8",
  ground: "#3a3048",
  skyK: 0.95,
  sun: "#b4c4ff",
  sunK: 0.25,
  up: 1.0,
  bearing: 0.8,
  top: "#18234a",
  bottom: "#33447a",
  haze: "#1d2546",
};
const NOON = {
  sky: "#ffffff",
  ground: "#9a948a",
  skyK: 2.2,
  sun: "#ffffff",
  sunK: 1.1,
  up: 1.26,
  bearing: 0.8,
  top: "#7fc0ec",
  bottom: "#d4ecfb",
  haze: "#cfe6f2",
};
const KEYS = [
  [0, NIGHT],
  [5, NIGHT],
  [
    6,
    {
      sky: "#ffd9c0",
      ground: "#5a4a5a",
      skyK: 1.45,
      sun: "#ffa060",
      sunK: 0.55,
      up: 0.12,
      bearing: -0.5,
      top: "#6f7fb8",
      bottom: "#ffb98a",
      haze: "#e8b9a0",
    },
  ], // sunrise
  [
    7.5,
    {
      sky: "#fff4e6",
      ground: "#8a8478",
      skyK: 2.0,
      sun: "#ffe2bf",
      sunK: 0.95,
      up: 0.6,
      bearing: 0.1,
      top: "#7fb8e6",
      bottom: "#f2e2cc",
      haze: "#d9e6ee",
    },
  ],
  [12, NOON],
  [16, { ...NOON, up: 0.75, bearing: 1.4 }],
  [
    17.5,
    {
      sky: "#ffe6c4",
      ground: "#8c7a68",
      skyK: 1.85,
      sun: "#ffb15e",
      sunK: 0.95,
      up: 0.22,
      bearing: 1.8,
      top: "#8fb4dc",
      bottom: "#ffd29a",
      haze: "#f2d2a8",
    },
  ], // golden
  [
    18.5,
    {
      sky: "#f6b8a8",
      ground: "#4a3a58",
      skyK: 1.2,
      sun: "#ff7f5a",
      sunK: 0.4,
      up: 0.05,
      bearing: 2.0,
      top: "#3f4a8a",
      bottom: "#f29a7a",
      haze: "#b07a8a",
    },
  ], // dusk
  [19.5, NIGHT],
  [24, NIGHT],
];
const COLOURS = ["sky", "ground", "sun", "top", "bottom", "haze"];
const NUMBERS = ["skyK", "sunK", "up", "bearing"];
const a = new THREE.Color();
const b = new THREE.Color();

// The light at `hour` (0 to 24): colours as THREE.Colors (fresh each call), numbers mixed.
export function lightAt(hour) {
  let k = 1;
  while (KEYS[k][0] < hour) k++;
  const [[h0, p], [h1, q]] = [KEYS[k - 1], KEYS[k]];
  const u = h1 > h0 ? (hour - h0) / (h1 - h0) : 0;
  const e = u * u * (3 - 2 * u);
  const out = {};
  for (const c of COLOURS) out[c] = new THREE.Color().copy(a.set(p[c]).lerp(b.set(q[c]), e));
  for (const n of NUMBERS) out[n] = p[n] + (q[n] - p[n]) * e;
  return out;
}

export const isNightAt = (hour) => hour >= NIGHTFALL || hour < DAWN;
// "07:42" for an hour.
export const hhmm = (hour) => {
  const m = Math.floor(hour * 60) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
