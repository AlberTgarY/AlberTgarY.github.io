/*******************************************************************************
 * What the girl streams at his computer (a palace drama, a romance in the rain,
 * a hospital drama, a detective mystery, a school romance, a sword fight in the
 * bamboo, a family sitcom, a café romance), and what the side screen shows
 * while she watches or plays.
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, number, person } from "./pen.js";
import { farmDay } from "./pc.js";

// What the girl watches and plays on his computer (her game is not among his picks in GAMES).
export const DRAMAS = ["palace", "rain", "hospital", "detective", "campus", "wuxia", "sitcom", "cafe"];

export const GIRL_GAMES = ["stardew"];

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
