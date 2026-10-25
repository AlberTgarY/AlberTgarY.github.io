/*******************************************************************************
 * What the girl streams at his computer: twelve dramas (a palace drama, a
 * romance in the rain, a hospital drama, a detective mystery, a school romance,
 * a sword fight in the bamboo, a family sitcom, a café romance, an office
 * romance, an idol story, immortals in the clouds, a summer by the sea), each
 * episode told shot by shot (PLOTS), with what she makes of each shot; and what
 * the side screen shows while she watches or plays (her farm game is in
 * stardew.js).
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, person } from "./pen.js";
import { drawFarmSide } from "./stardew.js";

export const DRAMAS = ["palace", "rain", "hospital", "detective", "campus", "wuxia", "sitcom", "cafe", "office", "idol", "immortal", "seaside"];

export const GIRL_GAMES = ["stardew"];

// Each drama's look: its setting (the wall or sky, the floor), its two leads ([hair, clothes] each), and the
// third person in the story (a rival, a suspect, the boss...).
const DRAMA_LOOK = {
  palace: { back: "#e9b8b0", floor: "#e8cf8a", leads: ["#2b2522", "#f7b8cc", "#2b2522", "#b8a0e0"], third: ["#2b2522", "#d0a020"] },
  rain: { back: "#8a9cc0", floor: "#6f7f9f", leads: ["#2b2522", "#3e4f7a", "#47281b", "#f2e3c4"], third: ["#8a5a34", "#2a2a2a"] },
  hospital: { back: "#dcefe8", floor: "#bfd4cc", leads: ["#2b2522", "#ffffff", "#5e3624", "#8fc0e8"], third: ["#c0c0c0", "#8fc0e8"] },
  detective: { back: "#3a4060", floor: "#565a70", leads: ["#3b3330", "#c9a878", "#47281b", "#8a6f9a"], third: ["#1a1416", "#6a1a1a"] },
  campus: { back: "#cdeafa", floor: "#e6d8b8", leads: ["#2b2522", "#3a4f8a", "#8a4a2a", "#3a4f8a"], third: ["#f2c14e", "#3a4f8a"] },
  wuxia: { back: "#d8ecd0", floor: "#a8d090", leads: ["#1a1416", "#f2f2f2", "#1a1416", "#4a4f5a"], third: ["#8a8f97", "#6a1a1a"] },
  sitcom: { back: "#f6e3a0", floor: "#d9b48a", leads: ["#5e3624", "#3e6fd6", "#f2c14e", "#e05aa0"], third: ["#c0c0c0", "#9b59d0"] },
  cafe: { back: "#d9b896", floor: "#a8805f", leads: ["#2b2522", "#3f7a5a", "#47281b", "#f28aa8"], third: ["#5e3624", "#2a2a2a"] },
  office: { back: "#dfe6ee", floor: "#9aa3b0", leads: ["#2b2522", "#2f3b55", "#5e3624", "#f2f2f2"], third: ["#8a8f97", "#4a4f5a"] },
  idol: { back: "#2a1f4a", floor: "#4a3a7a", leads: ["#f2c14e", "#e05aa0", "#2b2522", "#f2f2f2"], third: ["#2b2522", "#1a1a1a"] },
  immortal: { back: "#cfe0f6", floor: "#f4f4f8", leads: ["#1a1416", "#f2f2f2", "#1a1416", "#c03a3a"], third: ["#f2f2f2", "#3a1f4a"] },
  seaside: { back: "#9fdcf5", floor: "#f2dca0", leads: ["#5e3624", "#f6cf4a", "#2b2522", "#3e8fd6"], third: ["#f2c14e", "#e05aa0"] },
};

// Each drama's episode, shot by shot: "shot seconds words...". The shots: "title" (the opening card), "scene"
// (people in the setting), "close" (one face filling the picture) and "end" (to be continued). The words:
// who (a and b the leads, c the third; a scene with none has the two leads, or all three with "three");
// where they stand ("near", "far", "hug"; "come", the first walking in, "leave", the last walking off); the
// weather and the rest ("night", "rain", "storm", "petals", "spark", "fireworks", "alarm", "clash",
// "spot" the stage lights, "umbrella", "heart"); and a face ("smile", "blush", "laugh", "tears", "sad",
// "shock", "angry", "kiss"), which also says how a scene feels.
const PLOTS = {
  palace: [
    "title 6",
    "scene 12 petals",
    "close 6 b smile",
    "scene 10 three",
    "close 6 c angry",
    "scene 11 three far night",
    "close 6 b shock",
    "scene 11 b storm sad",
    "close 7 b tears",
    "scene 11 come rain umbrella",
    "close 6 a smile",
    "scene 10 hug heart petals",
    "end 6",
  ],
  rain: [
    "title 6",
    "scene 12 b rain sad",
    "scene 10 come rain umbrella",
    "close 6 a smile",
    "close 6 b blush",
    "scene 11 near rain umbrella heart",
    "scene 10 three night rain",
    "close 6 c smile",
    "close 7 b tears",
    "scene 10 leave rain",
    "close 6 a shock",
    "scene 9 a rain sad",
    "end 6",
  ],
  hospital: [
    "title 6",
    "scene 11",
    "close 6 a smile",
    "scene 10 alarm",
    "close 6 b shock",
    "scene 12 far alarm",
    "close 7 a angry",
    "scene 10 spark",
    "close 6 b tears",
    "scene 10 near night",
    "close 6 b blush",
    "scene 10 hug night heart",
    "end 6",
  ],
  detective: [
    "title 6",
    "scene 11 night rain",
    "close 6 a",
    "scene 10 three night",
    "close 6 c smile",
    "scene 9 three storm",
    "close 6 b shock",
    "scene 10 far night",
    "close 7 a angry",
    "scene 10 three leave night",
    "close 6 a shock",
    "scene 9 a night rain",
    "end 6",
  ],
  campus: [
    "title 6",
    "scene 11 petals",
    "close 6 b blush",
    "scene 10 three",
    "close 6 c laugh",
    "scene 10 far petals",
    "close 6 a sad",
    "scene 11 night fireworks",
    "close 6 b smile",
    "scene 11 near night fireworks heart",
    "close 6 a blush",
    "scene 9 hug night fireworks",
    "end 6",
  ],
  wuxia: [
    "title 6",
    "scene 9 b petals sad",
    "scene 10 a c far",
    "close 6 a angry",
    "close 6 c angry",
    "scene 12 a c clash",
    "close 6 b shock",
    "scene 11 a c clash storm",
    "close 7 a sad",
    "scene 10 come",
    "close 6 b tears",
    "scene 10 hug",
    "end 6",
  ],
  sitcom: [
    "title 5",
    "scene 10 laugh",
    "close 6 a laugh",
    "scene 9 three",
    "close 6 c shock",
    "scene 10 three laugh",
    "close 6 b angry",
    "scene 9 far",
    "close 6 a shock",
    "scene 10 laugh",
    "close 6 b laugh",
    "scene 9 three laugh spark",
    "end 5",
  ],
  cafe: [
    "title 6",
    "scene 11",
    "close 6 b smile",
    "scene 10 near",
    "close 6 a blush",
    "scene 9 three",
    "close 6 b shock",
    "scene 10 leave rain",
    "close 6 a sad",
    "scene 11 b rain sad",
    "scene 10 come rain umbrella",
    "close 6 b tears",
    "scene 10 hug rain umbrella heart",
    "end 6",
  ],
  office: [
    "title 6",
    "scene 11",
    "close 6 c angry",
    "scene 10 three",
    "close 6 b sad",
    "scene 11 night",
    "close 6 a smile",
    "scene 10 near night",
    "close 6 b blush",
    "scene 9 near night heart",
    "scene 9 three night",
    "close 6 c shock",
    "close 6 b shock",
    "end 6",
  ],
  idol: [
    "title 6",
    "scene 12 spot",
    "close 6 b smile",
    "scene 10 far",
    "close 6 a sad",
    "scene 10 three",
    "close 6 c angry",
    "scene 10 a rain sad",
    "close 7 a tears",
    "scene 12 spot come",
    "close 6 a laugh",
    "scene 10 hug spot heart",
    "end 6",
  ],
  immortal: [
    "title 6",
    "scene 12 petals",
    "close 6 b smile",
    "scene 10 three storm",
    "close 6 c angry",
    "scene 10 a c clash storm",
    "close 6 a shock",
    "scene 10 b night sad",
    "close 7 b tears",
    "scene 12 come spark",
    "close 6 a smile",
    "scene 10 hug spark heart",
    "end 6",
  ],
  seaside: [
    "title 6",
    "scene 12",
    "close 6 a laugh",
    "scene 10 near",
    "close 6 b blush",
    "scene 10 three",
    "close 6 b sad",
    "scene 10 leave night",
    "close 6 a sad",
    "scene 12 night fireworks come",
    "close 6 b smile",
    "scene 10 hug night fireworks heart",
    "end 6",
  ],
};

const FACES = ["smile", "blush", "laugh", "tears", "sad", "shock", "angry", "kiss"];

// What a shot makes her feel (acts/pc.js): "love", "sad", "twist", "laugh", "tense", or nothing much.
function moodOf({ shot, face, has }) {
  if (shot === "title") return null;
  if (shot === "end") return "twist";
  if (face === "tears" || face === "sad") return "sad";
  if (face === "shock" || has.has("storm")) return "twist";
  if (face === "laugh") return "laugh";
  if (face === "blush" || face === "kiss" || has.has("hug") || has.has("heart")) return "love";
  if (face === "angry" || has.has("clash") || has.has("alarm")) return "tense";
  return null;
}

const EPISODES = Object.fromEntries(
  Object.entries(PLOTS).map(([drama, lines]) => {
    const beats = lines.map((line) => {
      const [shot, secs, ...words] = line.split(" ");
      const beat = {
        shot,
        secs: +secs,
        who: words.filter((w) => w.length === 1),
        face: words.find((w) => FACES.includes(w)) || null,
        has: new Set(words),
      };
      return { ...beat, mood: moodOf(beat) };
    });
    return [drama, { beats, secs: beats.reduce((sum, b) => sum + b.secs, 0) }];
  })
);

// How far into the series she is, `e` seconds into watching: episodes one after another, picking up somewhere
// in one picked by `seed` (the same when she comes back to it after being called away, so she watches on from
// where she was). The whole part is the episode, the rest how far into it.
function watched(drama, e, seed) {
  return 2 + Math.floor(hash(seed, 5, 21) * 10) + hash(seed, 6, 21) * 0.6 + e / EPISODES[drama].secs;
}

// The shot she is at, and how far into it (0-1).
function shotAt(drama, e, seed) {
  const { beats, secs } = EPISODES[drama];
  const w = watched(drama, e, seed);
  let s = (w % 1) * secs;
  for (const [i, b] of beats.entries()) {
    if (s < b.secs) return { w, i, b, p: s / b.secs };
    s -= b.secs;
  }
  return { w, i: beats.length - 1, b: beats[beats.length - 1], p: 1 };
}

// What the drama is making her feel just now: `beat` counts the shots on, `mood` comes a moment into the shot
// (null before, or if the shot is nothing much).
export function dramaMoment(drama, e, seed) {
  const { w, i, b, p } = shotAt(EPISODES[drama] ? drama : "cafe", e, seed);
  return { beat: Math.floor(w) * 100 + i, mood: p > 0.25 ? b.mood : null };
}

// A colour darker by `k` (night).
function dim(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[16, 8, 0].map((s) => Math.round(((n >> s) & 255) * k))})`;
}

const lookOf = (look, who) => (who === "c" ? look.third : who === "b" ? look.leads.slice(2) : look.leads.slice(0, 2)); // [hair, clothes]

// Who stands where in a scene: x for each, the first walking in or the last walking off as the shot goes on.
function cast(b, p) {
  const who = b.who.length ? b.who : b.has.has("three") ? ["a", "b", "c"] : ["a", "b"];
  const xs =
    who.length === 1
      ? [12]
      : who.length === 3
        ? [5, 12, 19]
        : b.has.has("far")
          ? [4, 20]
          : b.has.has("hug")
            ? [11, 13]
            : b.has.has("near") || b.has.has("umbrella")
              ? [10, 14]
              : [8, 16];
  if (b.has.has("come")) xs[0] -= Math.round((1 - Math.min(1, p * 1.5)) * 14);
  if (b.has.has("leave")) xs[xs.length - 1] += Math.round(p * 16);
  return who.map((w, k) => ({ who: w, x: xs[k] }));
}

// The setting behind them: each drama's one or two things.
function setting(rect, px, drama, b, t, tint) {
  if (drama === "palace") {
    for (const x of [3, 22]) {
      rect(x, 0, 1, 2, "#8a5a34");
      rect(x - 1, 2, 3, 3, "#e0605a");
      px(x, 3, "#ffe58a");
    }
  } else if (drama === "rain" || drama === "detective") {
    px(4, 2, "#f3ecc8");
    rect(22, 1, 1, 9, "#2a2e40");
    rect(21, 1, 3, 1, "#ffe58a");
  } else if (drama === "hospital") {
    rect(3, 3, 3, 1, "#e0605a");
    rect(4, 2, 1, 3, "#e0605a");
    rect(20, 2, 5, 4, "#2b3a3a");
    px(20 + Math.floor((t * 5) % 5), 4 - (Math.floor(t * 5) % 5 === 2 ? 1 : 0), b.has.has("alarm") ? "#e0402e" : "#7fe0a0");
  } else if (drama === "campus") {
    rect(2, 4, 2, 6, "#9a6a4a");
    rect(0, 0, 6, 5, tint("#f7c6d6"));
  } else if (drama === "wuxia") {
    for (const x of [2, 5, 21, 24]) rect(x, 0, 1, 10, tint("#7cb86a"));
  } else if (drama === "sitcom") {
    rect(1, 1, 5, 4, tint("#cdeafa"));
  } else if (drama === "cafe") {
    rect(20, 1, 5, 5, tint(b.has.has("rain") ? "#8a9cc0" : "#cdeafa"));
  } else if (drama === "office") {
    rect(1, 1, 9, 6, tint("#a8c8e0"));
    for (let x = 1; x < 10; x += 3) rect(x, 1, 1, 6, tint("#7a8a9a"));
    if (b.has.has("night")) for (let k = 0; k < 4; k++) px(2 + k * 2, 2 + (k % 3), "#ffe58a");
  } else if (drama === "idol") {
    rect(0, 0, 2, 10, "#a02040");
    rect(24, 0, 2, 10, "#a02040");
    if (b.has.has("spot"))
      for (const [x, c] of [
        [6, "#f6cf4a"],
        [13, "#f28aa8"],
        [20, "#8fd3ff"],
      ])
        for (let y = 0; y < 10; y++) if ((y + Math.floor(t * 4)) % 3) px(x + Math.round((y - 5) * 0.3 * Math.sin(t + x)), y, c);
  } else if (drama === "immortal") {
    for (const [x, top] of [
      [2, 4],
      [6, 2],
      [19, 3],
      [23, 5],
    ])
      rect(x, top, 3, 10 - top, tint("#a8b8d0"));
    for (let k = 0; k < 3; k++) rect(Math.round((k * 9 + t * 1.5) % 30) - 3, 1 + k * 2, 4, 1, tint("#ffffff"));
  } else if (drama === "seaside") {
    rect(0, 6, 26, 4, tint("#3e8fd6"));
    for (let k = 0; k < 5; k++) rect((k * 6 + Math.round(t * 2)) % 26, 7 + (k % 2) * 2, 2, 1, tint("#cfeaff"));
    px(21, 2, b.has.has("night") ? "#f3ecc8" : "#fff1a8");
    if (!b.has.has("night")) px(Math.round((t * 3) % 26), 3 + Math.round(Math.sin(t * 2)), "#ffffff");
  }
}

// What goes in front of them: the sofa, the café table, the desk, the lightsticks, the detective's hat.
function inFront(rect, px, drama, b, cast, t) {
  if (drama === "sitcom") rect(5, 9, 17, 3, "#e08a6a");
  else if (drama === "cafe") {
    rect(10, 9, 7, 1, "#8a5a3a");
    px(11, 8, "#ffffff");
    px(15, 8, "#ffffff");
  } else if (drama === "office") {
    rect(3, 9, 20, 1, "#c8ccd4");
    rect(18, 7, 3, 2, "#2b2b33");
  } else if (drama === "idol" && b.has.has("spot")) {
    for (let x = 1; x < 26; x += 3) px(x, 12 - (Math.sin(t * 6 + x) > 0 ? 1 : 0), ["#f6cf4a", "#f28aa8", "#8fd3ff"][x % 3]);
  } else if (drama === "detective") {
    const a = cast.find((c) => c.who === "a");
    if (a) {
      rect(a.x - 2, 2, 6, 1, "#3b3330");
      rect(a.x - 1, 1, 4, 1, "#3b3330");
    }
  }
}

// A face filling the picture: whose (`who`), with a look (`face`), blinking now and then and talking.
function closeUp(rect, px, look, b, t) {
  const [hair] = lookOf(look, b.who[0] || "a");
  const x = 8;
  rect(x, 2, 10, 11, "#f9d6bd");
  rect(x - 1, 0, 12, 3, hair);
  rect(x - 1, 3, 1, 10, hair);
  rect(x + 10, 3, 1, 10, hair);
  const blink = t % 4 < 0.15;
  const { face } = b;
  for (const [k, ex] of [x + 1, x + 6].entries()) {
    const inner = k ? ex : ex + 2; // the eye's end nearer the nose
    const outer = k ? ex + 2 : ex;
    if (face === "laugh") {
      px(ex, 6, "#2b2522");
      px(ex + 1, 5, "#2b2522");
      px(ex + 2, 6, "#2b2522");
    } else if (face === "kiss" || blink) rect(ex, 6, 3, 1, "#2b2522");
    else if (face === "shock") {
      rect(ex, 4, 3, 3, "#ffffff");
      px(ex + 1, 5, "#2b2522");
    } else if (face === "angry") {
      rect(ex, 6, 3, 2, "#2b2522");
      px(outer, 4, "#2b2522");
      px(ex + 1, 4, "#2b2522");
      px(inner, 5, "#2b2522");
    } else {
      rect(ex, 5, 3, 3, "#2b2522");
      px(ex, 5, "#ffffff");
      if (face === "tears" || face === "sad") {
        px(inner, 3, "#2b2522");
        px(ex + 1, 4, "#2b2522");
      }
    }
    if (face === "tears") px(ex + 1, 8 + (Math.floor(t * 4 + k) % 4), "#8fd3ff");
  }
  const flushed = face === "blush" || face === "kiss";
  rect(x + 1, flushed ? 8 : 9, 2, flushed ? 2 : 1, flushed ? "#f58aa6" : "#f7a1b5");
  rect(x + 7, flushed ? 8 : 9, 2, flushed ? 2 : 1, flushed ? "#f58aa6" : "#f7a1b5");
  if (face === "smile" || face === "blush") {
    rect(x + 4, 10, 2, 1, "#c4503f");
    px(x + 3, 9, "#c4503f");
    px(x + 6, 9, "#c4503f");
  } else if (face === "laugh") {
    rect(x + 3, 9, 4, 2, "#7a2a2a");
    rect(x + 4, 10, 2, 1, "#e0605a");
  } else if (face === "sad" || face === "tears") {
    rect(x + 4, 10, 2, 1, "#c4503f");
    px(x + 3, 11, "#c4503f");
    px(x + 6, 11, "#c4503f");
  } else if (face === "shock") rect(x + 4, 9, 2, 2, "#5a1a1a");
  else if (face === "angry") rect(x + 3, 10, 4, 1, "#7a2a2a");
  else if (face === "kiss") px(x + 5, 10, "#e0607a");
  else rect(x + 4, 10, 2, Math.sin(t * 9) > 0 ? 2 : 1, "#c4503f"); // talking
}

// The weather and the rest, over the picture.
function effects(rect, px, b, cast, t, w) {
  const { has } = b;
  if (has.has("rain") || has.has("storm")) for (let k = 0; k < 12; k++) px((k * 7 + 3) % w, Math.floor((k * 4 + t * 16) % 13), "#cdd8f0");
  if (has.has("storm") && t % 3.3 < 0.15) rect(0, 0, w, 13, "#f4f4ff");
  if (has.has("petals")) for (let k = 0; k < 6; k++) px(Math.floor((k * 7 + t * 2) % w), Math.floor((k * 3 + t * 2.5) % 11), "#f7a1b5");
  if (has.has("spark")) for (let k = 0; k < 5; k++) if (Math.sin(t * 7 + k * 2.1) > 0.4) px((k * 5 + 3) % w, 1 + ((k * 3) % 8), "#fff6c9");
  if (has.has("alarm") && t % 0.8 < 0.4) rect(0, 0, w, 1, "#e0402e");
  if (has.has("fireworks")) {
    const burst = Math.floor(t * 1.1);
    const [bx, by] = [3 + Math.floor(hash(burst, 1, 9) * 20), 2 + Math.floor(hash(burst, 2, 9) * 2)];
    const r = 1 + ((t * 1.1) % 1) * 2;
    for (let a = 0; a < 6; a++) px(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), ["#ff6f9a", "#f6cf4a", "#8fd3ff"][burst % 3]);
  }
  if (b.shot !== "scene") return;
  if (has.has("umbrella") && cast.length > 1) {
    const [l, r] = [cast[0].x - 2, cast[1].x + 4];
    rect(l, 1, r - l, 1, "#f28aa8");
    rect(l + 2, 0, r - l - 4, 1, "#f28aa8");
    rect(Math.round((l + r) / 2), 2, 1, 6, "#5c4a4a");
  }
  if (has.has("clash") && cast.length > 1) {
    const mx = Math.round((cast[0].x + cast[1].x) / 2) + 1;
    rect(mx - 2, 7, 4, 1, "#c9d6e6");
    if (Math.sin(t * 12) > 0)
      for (const [dx, dy] of [
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
      ])
        px(mx + dx, 7 + dy, "#fff6c9");
  }
  if (has.has("heart") && t % 5 > 3) {
    const x = Math.round((cast[0].x + cast[cast.length - 1].x) / 2);
    const y = Math.round(7 - (t % 5));
    px(x, y, "#ff6f9a");
    px(x + 2, y, "#ff6f9a");
    rect(x, y + 1, 3, 1, "#ff6f9a");
    px(x + 1, y + 2, "#ff6f9a");
  }
}

// The opening card: the two leads' faces either side, the title writing itself in between, and a sparkle.
function titleCard(rect, px, look, p, t, w) {
  rect(0, 0, w, 13, look.back);
  rect(0, 9, w, 4, look.floor);
  for (const [k, x] of [
    [0, 2],
    [1, 19],
  ]) {
    const hair = look.leads[k * 2];
    rect(x, 3, 5, 5, "#f9d6bd");
    rect(x - 1, 2, 7, 2, hair);
    rect(x - 1, 4, 1, 4, hair);
    rect(x + 5, 4, 1, 4, hair);
    px(x + 1, 5, "#2b2522");
    px(x + 3, 5, "#2b2522");
  }
  for (let k = 0; k < Math.min(3, Math.floor(p * 6)); k++) rect(10 + (k % 2), 4 + k * 2, 6 - (k % 2) * 2, 1, "#ffffff");
  if (Math.sin(t * 6) > 0.3) px(9 + Math.floor((t * 4) % 8), 3, "#fff6c9");
}

// To be continued: the two leads' colours either side, frozen, and the words with their three dots.
function endCard(rect, px, look, t, w) {
  rect(0, 0, 13, 13, dim(look.leads[1], 0.45));
  rect(13, 0, 13, 13, dim(look.leads[3], 0.45));
  rect(4, 9, 15, 1, "#f2f2f2");
  for (let k = 0; k < 3; k++) if (t % 1.5 > k * 0.4) px(20 + k * 2, 9, "#f2f2f2");
}

// Her drama on his computer: `drama` (DRAMAS), `e` how long she has been watching (watched()). The shot she
// is at, the subtitles under the picture while they talk, and a thin red bar for how far into the episode
// she is.
export function drawPcDrama(g, w, h, drama, t, e, seed) {
  const { rect, px } = pen(g);
  if (!EPISODES[drama]) drama = "cafe";
  const look = DRAMA_LOOK[drama];
  const { w: through, b, p } = shotAt(drama, e, seed);
  const tint = (c) => (b.has.has("night") ? dim(c, 0.55) : c);
  const people = b.shot === "scene" ? cast(b, p) : [];
  if (b.shot === "title") titleCard(rect, px, look, p, t, w);
  else if (b.shot === "end") endCard(rect, px, look, t, w);
  else {
    rect(0, 0, w, 13, tint(look.back));
    if (b.shot === "close") closeUp(rect, px, look, b, t);
    else {
      rect(0, 10, w, 3, tint(look.floor));
      setting(rect, px, drama, b, t, tint);
      const talker = Math.floor(e / 2) % people.length;
      const bob = b.has.has("clash") || (drama === "sitcom" && b.face === "laugh") ? Math.round(Math.abs(Math.sin(t * 6))) : 0;
      people.forEach(({ who, x }, k) => {
        const [hair, clothes] = lookOf(look, who);
        person(rect, px, x, 3 - bob, { hair, clothes, mouth: k === talker && Math.sin(t * 9) > 0 });
      });
      inFront(rect, px, drama, b, people, t);
    }
    effects(rect, px, b, people, t, w);
  }
  rect(0, 13, w, 2, "#1b1b22");
  if ((b.shot === "scene" || b.shot === "close") && e % 2.5 < 2) {
    const said = Math.floor(e / 2.5) + seed;
    rect(5 + Math.floor(hash(said, 0, 22) * 4), 13, 10 + Math.floor(hash(said, 1, 22) * 6), 1, "#f2f2f2");
  }
  rect(0, 14, Math.max(1, Math.round((through % 1) * w)), 1, "#e0605a");
}

// The side screen while she uses his computer, `w` by `h` on end (11 by 25). Watching a drama (`mode` "show",
// `game` its DRAMAS id): a strip in the drama's colours, its episodes with this one picked out, and how far
// in she is. Playing her farm game ("game"): stardew.js.
export function drawSideShow(g, w, h, mode, game, e, seed) {
  const { rect, px } = pen(g);
  if (mode === "off") return rect(0, 0, w, h, "#060608");
  if (mode !== "show") return drawFarmSide(g, w, h, e, seed);
  const drama = EPISODES[game] ? game : "cafe";
  const look = DRAMA_LOOK[drama];
  rect(0, 0, w, h, "#1f1f28");
  rect(0, 0, w, 4, look.back);
  rect(2, 1, 2, 3, look.leads[1]);
  rect(7, 1, 2, 3, look.leads[3]);
  const p = watched(drama, e, seed);
  for (let k = 0; k < 5; k++) {
    const y = 6 + k * 3;
    const now = k === 1; // the one before, this one, and the three after
    if (now) rect(0, y - 1, w, 3, "#3a3a4c");
    px(1, y, now ? "#e0605a" : k < 1 ? "#7fe0a0" : "#6a6f86");
    rect(3, y, 4 + ((Math.floor(p) + k) % 3), 1, now ? "#ffffff" : "#9aa0b8");
  }
  rect(1, 22, w - 2, 1, "#3a3a4c");
  rect(1, 22, Math.max(1, Math.round((p % 1) * (w - 2))), 1, "#e0605a");
}
