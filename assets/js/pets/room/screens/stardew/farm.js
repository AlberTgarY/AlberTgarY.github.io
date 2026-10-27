/*******************************************************************************
 * Her farm game's scenes at home: up in the morning, the TV, the mail, the
 * crops watered and picked (and checked in the rain), the animals and the
 * coop, cooking, the crops into the shipping bin, the evening, bed and the
 * day's takings; and the game loading over the valley.
 *
 * Each scene draws itself `p` (0-1) into it on `b` (kit.js's Bitmap) and says
 * which tool is out on the hotbar (-1: the hotbar hidden).
 ******************************************************************************/

import { W, H, backdrop, noise, digits, sprite, text, lines, letters } from "./kit.js";
import {
  INK,
  farmer,
  hen,
  cow,
  frog,
  fish,
  gem,
  egg,
  heart,
  sparkle,
  crop,
  produce,
  lawn,
  earth,
  tilled,
  boards,
  wallpaper,
  fence,
  tree,
  pine,
  bush,
  flowers,
  sky,
  farmhouse,
  houseWindow,
  shippingBin,
  mailbox,
  rain,
  mixHex,
} from "./art.js";

// Walking along: the side pose, mid-step every other moment.
export const walking = (t) => (Math.floor(t * 6) % 2 ? "step" : "side");

/* ---------- inside the farmhouse ---------- */

// The room: papered wall, the window (its sky drawn after, `window`), the calendar, the bed, the TV on its
// cabinet, the armchair, a rug, a plant; the doorway at the bottom right.
function home(b) {
  wallpaper(b, 0, 0, W, 31);
  boards(b, 0, 31, W, H - 31);
  // Window frame (the panes are filled in each frame).
  b.rect(63, 5, 27, 19, INK);
  b.rect(64, 6, 25, 17, "#e8e0d0");
  b.rect(62, 23, 29, 2, "#a8683a");
  // The calendar.
  b.rect(39, 6, 15, 17, INK);
  b.rect(40, 7, 13, 15, "#fbf6ec");
  b.rect(40, 7, 13, 3, "#c0392b");
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b.px(42 + c * 3, 12 + r * 3, "#9aa0b8");
  // The bed, against the wall: headboard, pillow, quilt with a turned-down sheet.
  b.rect(6, 22, 30, 41, INK);
  b.rect(7, 23, 28, 7, "#a8662f");
  b.rect(7, 23, 28, 1, "#c8823f");
  b.rect(8, 30, 26, 32, "#fbf6ec");
  b.rect(11, 32, 20, 6, "#ffffff");
  b.rect(11, 37, 20, 1, "#d8d0c8");
  b.rect(8, 41, 26, 21, "#c0392b");
  for (let j = 41; j < 62; j += 4) for (let i = 8; i < 34; i += 4) b.rect(i + ((j / 4) % 2 ? 2 : 0), j, 2, 2, "#d8584a");
  b.rect(8, 41, 26, 2, "#fbf6ec");
  b.rect(8, 62, 26, 1, "#7e2a1c");
  // The TV on its cabinet (the screen is drawn each frame).
  b.rect(107, 23, 34, 14, INK);
  b.rect(108, 24, 32, 12, "#a8662f");
  b.rect(108, 24, 32, 1, "#c8823f");
  b.rect(123, 27, 2, 6, "#8a5228");
  b.rect(111, 8, 26, 17, INK);
  b.rect(112, 9, 24, 15, "#4a4a55");
  // The armchair in front of it, from behind.
  b.rect(114, 46, 20, 14, INK);
  b.rect(115, 47, 18, 12, "#5a7ab0");
  b.rect(115, 47, 18, 3, "#7a9ad0");
  b.rect(113, 50, 3, 10, "#3e5a90");
  b.rect(132, 50, 3, 10, "#3e5a90");
  // A rug, a plant by the window, the doorway.
  b.rect(54, 52, 44, 26, "#3f7a4a");
  b.rect(56, 54, 40, 22, "#5a9a5a");
  for (let i = 58; i < 96; i += 4) b.rect(i, 64, 2, 2, "#f6cf4a");
  b.rect(93, 16, 8, 8, INK);
  b.rect(94, 17, 6, 7, "#c06a3a");
  bush(b, 97, 16, 1);
  b.rect(118, 88, 22, 8, "#2a1a10");
  b.rect(118, 88, 22, 1, INK);
}
// The window's sky, `colour`; stars and the moon at night.
function homeWindow(b, colour, night = false) {
  for (const [x, y] of [
    [64, 6],
    [77, 6],
    [64, 15],
    [77, 15],
  ]) {
    b.rect(x, y, 12, 8, colour);
    if (night) b.px(x + 4, y + 2, "#fff6c9");
  }
  b.rect(76, 6, 1, 17, "#e8e0d0");
  b.rect(64, 14, 25, 1, "#e8e0d0");
  if (night) b.rect(83, 8, 3, 3, "#fff1a8");
}

const tvScreen = (b, colour) => b.rect(113, 10, 22, 13, colour);

// A little "z" (3 x 3) at (x, y).
function zed(b, x, y) {
  b.rect(x, y, 3, 1, "#ffffff");
  b.px(x + 1, y + 1, "#ffffff");
  b.rect(x, y + 2, 3, 1, "#ffffff");
}

// Her head on the pillow (eyes shut, pink cheeks), the quilt pulled up over her, a rise where she lies.
const SLEEPER = ["...oooooo...", "..orrrrrro..", ".orrRrrRrro.", ".orssssssro.", "orseesseesro", "orcsssssscro", ".orssssssro.", "..oooooooo.."];
function asleep(b) {
  b.draw(sprite(SLEEPER, { o: INK, r: "#8a4a24", R: "#5e3018", s: "#f9d6bd", e: "#5e3018", c: "#f4a8a0" }), 15, 31);
  b.rect(8, 40, 26, 3, "#fbf6ec");
  b.rect(8, 42, 26, 1, "#d8d0c8");
  b.tint(11, 44, 20, 14, "#ffffff", 0.12);
}

/* ---------- out on the farm ---------- */

// The crops' three rows (ROWS: their tops), TILES tiles of TILE each from FIELD_X, a path between the rows;
// the season's crops (art.js's CROP), a row each, none in winter.
const ROWS = [24, 44, 64];
const FIELD_X = 14;
const TILE = 12;
const TILES = 8;
export const CROPS = [["tulip", "cauliflower", "strawberry"], ["tomato", "corn", "blueberry"], ["pumpkin", "eggplant", "cranberry"], null];

// The field: grass above the fence, the bare earth (snow in winter), the tilled rows, the bee houses and the
// scarecrow off to the right, a bush and a tree at the side.
function field(b, season) {
  lawn(b, 0, 0, W, 14, season, 3);
  if (season === 3) lawn(b, 0, 14, W, H - 14, 3, 4);
  else earth(b, 0, 14, W, H - 14);
  fence(b, 0, W, 16);
  for (const y of ROWS) tilled(b, FIELD_X, y, TILES, 1, undefined, TILE);
  for (const x of [126, 140, 154]) {
    b.rect(x - 5, 22, 11, 12, INK);
    b.rect(x - 4, 23, 9, 3, "#c8823f");
    b.rect(x - 4, 26, 9, 7, "#e0a35a");
    b.rect(x - 4, 28, 9, 1, "#a8662f");
    b.rect(x - 1, 30, 3, 2, "#3a2414");
  }
  // The scarecrow: a pole, a straw hat, a sack face, its arms out.
  b.rect(139, 46, 2, 24, "#6b3f22");
  b.rect(131, 54, 18, 2, "#6b3f22");
  b.rect(135, 42, 10, 9, INK);
  b.rect(136, 43, 8, 7, "#e8d0a0");
  b.px(138, 46, INK);
  b.px(141, 46, INK);
  b.rect(133, 40, 14, 3, "#f2d27a");
  b.rect(136, 37, 8, 3, "#f2d27a");
  b.rect(135, 56, 10, 10, "#c0392b");
  bush(b, 6, 46, season);
  tree(b, 156, 92, season, 2, 0.8);
}

const tileX = (c) => FIELD_X + c * TILE + TILE / 2;
const footOf = (y) => y + TILE - 2; // a plant's foot on its row
const pathOf = (y) => y + TILE + 7; // where she walks, below the row

// The rows, each after the one behind it, and her on the path below the row she is on (so the row in front
// of her hides her feet): `wet(r, c)` the watered tiles, `stage(r, c)` how far each plant has grown (-1
// none), `her(feet)` drawing her.
function plot(b, crops, wet, stage, row, her) {
  ROWS.forEach((y, r) => {
    tilled(b, FIELD_X, y, TILES, 1, (c) => wet(r, c), TILE);
    if (crops) for (let c = 0; c < TILES; c++) if (stage(r, c) >= 0) crop(b, tileX(c), footOf(y), crops[r], stage(r, c));
    if (r === row) her(pathOf(y));
  });
}

// Along each row in turn, `p` into the work: watering (the soil dark behind her; the plants a stage up from
// yesterday), or picking every ripe one, held up as she goes.
function rows(b, p, t, day, season, water) {
  const row = Math.min(2, Math.floor(p * 3));
  const along = FIELD_X + ((p * 3) % 1) * (TILES * TILE);
  const done = (r, c) => r < row || (r === row && tileX(c) < along);
  b.copy(backdrop(`field${season}`, (bb) => field(bb, season)));
  const crops = CROPS[season];
  const x = Math.round(along);
  if (water) {
    const grown = [1, 2, 2][day % 3];
    plot(
      b,
      crops,
      done,
      () => grown,
      row,
      (feet) => {
        farmer(b, x, feet, walking(t));
        // The can held out, water pouring onto the tile ahead.
        b.rect(x + 4, feet - 9, 6, 4, INK);
        b.rect(x + 5, feet - 8, 4, 2, "#3e8fd6");
        b.rect(x + 9, feet - 10, 2, 1, INK);
        for (let k = 0; k < 4; k++) if (Math.sin(t * 12 + k) > -0.2) b.px(x + 10 + (k % 2), feet - 10 - k * 2 + ((t * 20) % 2), "#9fd8ff");
      }
    );
    return 0;
  }
  const showing = crops && (p * 3 * TILES) % 1 < 0.35;
  plot(
    b,
    crops,
    () => false,
    (r, c) => (done(r, c) ? -1 : 3),
    row,
    (feet) => {
      if (!showing) return farmer(b, x, feet, walking(t));
      farmer(b, x, feet, "lift");
      produce(b, x, feet - 18, crops[row]);
      sparkle(b, x + 7, feet - 25, t);
    }
  );
  return 3;
}

/* ---------- the scenes ---------- */

const yard = (season) =>
  backdrop(`yard${season}`, (b) => {
    lawn(b, 0, 0, W, H, season, 5);
    if (season !== 3) earth(b, 30, 50, 110, H - 50, 6);
    tree(b, 14, 50, season, 1, 1);
    pine(b, 156, 46, season);
    farmhouse(b, 70, 52);
    flowers(b, 104, 50, 5, 1);
    bush(b, 150, 80, season, season === 1 ? "#5a7ae0" : null);
  });

export const FARM = {
  // Up at sunrise: in bed, then out of it and off to the door.
  wake({ b, p, t, season }) {
    b.copy(backdrop("home", home));
    homeWindow(b, p < 0.5 ? mixHex("#f6b26b", "#8fd0f5", p * 2) : ["#8fd0f5", "#7cc8f5", "#a8c8e0", "#c8d8e8"][season]);
    tvScreen(b, "#1b1b22");
    if (p < 0.35) {
      asleep(b);
      if (p > 0.2) sparkle(b, 30, 30, t);
    } else {
      const q = (p - 0.35) / 0.65;
      if (q < 0.5) farmer(b, Math.round(40 + q * 2 * 88), 74, walking(t));
      else farmer(b, 128, Math.round(74 + (q - 0.5) * 2 * 22), "front");
    }
    return -1;
  },
  // In bed at night, Zzz; then the day's takings, row by row.
  sleep({ b, p, t, day }) {
    b.copy(backdrop("home", home));
    homeWindow(b, "#1f2a4a", true);
    tvScreen(b, "#1b1b22");
    asleep(b);
    b.tint(0, 0, W, H, "#141a40", 0.55);
    // Moonlight in at the window and across the floor.
    for (let j = 31; j < 80; j++) b.tint(60 + (j - 31) * 0.4, j, 30, 1, "#b8c8ff", 0.18);
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.6 + k / 3) % 1;
      zed(b, 32 + u * 8 + k, 32 - u * 22);
    }
    if (p > 0.6) takings(b, Math.min(1, (p - 0.6) / 0.3), day);
    return -1;
  },
  // The game loading: the title over the valley (clouds drifting, hens about), then the load bar, then black.
  title({ b, p, t, season }) {
    sky(b, 46, "#5ab0f0", "#bfe6fb", t, 3);
    hills(b);
    lawn(b, 0, 60, W, H - 60, Math.min(season, 1), 7);
    fence(b, 0, 64, 62);
    tree(b, 16, 74, Math.min(season, 1), 3, 1.1);
    pine(b, 150, 70, Math.min(season, 1));
    earth(b, 64, 76, 104, 20, 8);
    farmer(b, Math.round(40 + Math.sin(t * 0.5) * 6), 86, walking(t), { flip: Math.cos(t * 0.5) < 0 });
    hen(b, 96 + Math.round(Math.sin(t * 0.7) * 3), 84, Math.sin(t * 0.7) > 0);
    hen(b, 112, 88, true, true);
    logo(b, 40, 6);
    if (p > 0.45) {
      const fill = Math.min(1, (p - 0.45) / 0.45);
      b.rect(43, 66, 82, 7, INK);
      b.rect(44, 67, 80, 5, "#fbe3b0");
      b.rect(45, 68, Math.round(fill * 78), 3, "#5fb03a");
    }
    if (p > 0.92) b.rect(0, 0, W, H, "#000000");
    return -1;
  },
  // Out to the mailbox, its flag up; the letter opened and read (from a friend, or the festival's invitation).
  mail({ b, p, t, day, season, festival }) {
    b.copy(yard(season));
    mailbox(b, 122, 70, p < 0.35);
    const x = Math.round(Math.min(116, 70 + (p / 0.3) * 46));
    farmer(b, x, 70, p < 0.3 ? walking(t) : "side");
    if (p > 0.35) letter(b, Math.min(1, (p - 0.4) / 0.45), p > 0.85, t, day, festival);
    return -1;
  },
  // The morning TV from the armchair, and the screen close up: the weather for tomorrow (sun, rain or snow)
  // or the fortune teller.
  tv({ b, p, t, day }) {
    b.copy(backdrop("home", home));
    homeWindow(b, "#8fd0f5");
    tvScreen(b, "#8fd0f5");
    farmer(b, 124, 52, "back");
    if (p > 0.15) {
      b.rect(30, 4, 108, 66, INK);
      b.rect(31, 5, 106, 64, "#4a4a55");
      b.rect(35, 13, 98, 54, "#1b1b22");
      b.rect(37, 7, 6, 3, "#c0392b"); // the set's light
      if (day % 2) fortune(b, t);
      else weather(b, t, day);
      // What is said, along the bottom.
      const said = day % 2 ? ["THE SPIRITS ARE IN GOOD", "HUMOUR TODAY. GOOD LUCK!"] : FORECAST[weatherOf(day)];
      b.rect(6, 73, W - 12, 22, INK);
      b.rect(7, 74, W - 14, 20, "#d8843a");
      b.rect(9, 76, W - 18, 16, "#fbe3b0");
      lines(b, said, Math.min(1, (p - 0.2) / 0.4) * letters(said), 14, 78, "#5c3a26", "#e8c890");
    }
    return -1;
  },
  water({ b, p, t, day, season }) {
    return rows(b, p, t, day, season, true);
  },
  harvest({ b, p, t, day, season }) {
    return rows(b, p, t, day, season, false);
  },
  // The rain does the watering: in her raincoat along the rows checking the crops, the first ripe one picked;
  // a frog in a puddle.
  rainfarm({ b, p, t, season }) {
    b.copy(backdrop(`field${season}`, (bb) => field(bb, season)));
    const crops = CROPS[season] || CROPS[0];
    b.rect(118, 78, 16, 5, "#6a8ab0");
    b.rect(120, 79, 12, 3, "#8aa8d0");
    frog(b, 126, 80 - (Math.sin(t * 3) > 0.7 ? 2 : 0));
    const x = Math.round(FIELD_X + p * TILES * TILE);
    const picked = p > 0.6;
    // Along the path behind the last row, the first ripe one there picked.
    plot(
      b,
      crops,
      () => true,
      (r, c) => (r === 2 && c === 4 ? (picked ? -1 : 3) : 2),
      1,
      (feet) => {
        if (p > 0.6 && p < 0.85) {
          farmer(b, x, feet, "lift", { coat: true });
          produce(b, x, feet - 18, crops[2]);
          sparkle(b, x + 7, feet - 25, t);
        } else farmer(b, x, feet, walking(t), { coat: true });
      }
    );
    b.tint(0, 0, W, H, "#3a4a6a", 0.3);
    rain(b, t);
    return 3;
  },
  // The barn, the hens pecking about; over to the cow for a pat, and a heart.
  animals({ b, p, t, season }) {
    b.copy(backdrop(`barnyard${season}`, (bb) => barnyard(bb, season)));
    for (let k = 0; k < 4; k++) {
      const x = 20 + k * 18 + Math.round(4 * Math.sin(t * 0.6 + k * 2));
      const peck = Math.sin(t * 5 + k) > 0.6 ? 1 : 0;
      hen(b, x, 84 + (k % 2) * 4 + peck, Math.cos(t * 0.6 + k * 2) < 0, k === 2);
    }
    cow(b, 82, 62, true);
    farmer(b, Math.round(Math.min(64, 10 + (p / 0.5) * 54)), 64, p < 0.5 ? walking(t) : "side");
    if (p > 0.55) heart(b, 80, Math.round(42 - (p - 0.55) * 20));
    return 4;
  },
  // In the coop: the hens on their nests, an egg from under each as she goes along; the count.
  coop({ b, p, t }) {
    b.copy(backdrop("coop", coop));
    const along = 20 + p * 126;
    [28, 62, 96, 130].forEach((x, k) => {
      if (x + 6 > along) egg(b, x + 2, 42, k % 2 === 1);
      hen(b, x + 1, 36 + (Math.sin(t * 3 + k) > 0.85 ? 1 : 0), k % 2 === 0, k % 2 === 1);
    });
    const showing = (p * 4) % 1 < 0.3 && p > 0.1;
    if (showing) {
      farmer(b, Math.round(along), 80, "lift");
      egg(b, Math.round(along), 62);
    } else farmer(b, Math.round(along), 80, walking(t));
    b.rect(136, 4, 28, 13, INK);
    b.rect(137, 5, 26, 11, "#fbe3b0");
    egg(b, 143, 14);
    digits(b, Math.min(4, Math.floor(p * 4.5)), 150, 8, "#5c3a26");
    if (p > 0.5) heart(b, 80, Math.round(28 - (p - 0.5) * 12));
    return -1;
  },
  // In the kitchen: what she grew or caught into the pot, the steam, and the dish come out.
  cook({ b, p, t, day }) {
    b.copy(backdrop("kitchen", kitchen));
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.8 + k / 3) % 1;
      b.px(60 + k * 3 + Math.round(Math.sin(u * 6 + k) * 2), 22 - u * 16, u < 0.6 ? "#ffffff" : "#e0e8f0");
    }
    const FOOD = ["#e0402e", "#f6cf4a", "#5fb03a"];
    const n = Math.floor(Math.min(1, p / 0.6) * 3);
    for (let k = n; k < 3; k++) {
      b.rect(96 + k * 9, 28, 6, 5, INK);
      b.rect(97 + k * 9, 29, 4, 3, FOOD[(k + day) % 3]);
    }
    if (p < 0.6) {
      const q = (p / 0.2) % 1;
      const [fx, fy] = [96 + n * 9 - q * 34, 28 - Math.sin(q * Math.PI) * 14];
      b.rect(fx, fy, 4, 3, FOOD[(n + day) % 3]);
    }
    farmer(b, 76, 62, "back");
    if (p > 0.7) {
      b.rect(122, 26, 14, 6, INK);
      b.rect(123, 27, 12, 4, "#ffffff");
      b.rect(125, 25, 8, 3, ["#f39a33", "#e0402e", "#c79bf2"][day % 3]);
      sparkle(b, 129, 20, t);
    }
    return 5;
  },
  // The day's crops tossed into the shipping bin by the house, and the gold counting up.
  ship({ b, p, t, day, season }) {
    b.copy(yard(season));
    const open = (p * 4) % 1 < 0.6;
    shippingBin(b, 104, 72, open);
    farmer(b, 96, 74, "side");
    const toss = (p * 4) % 1;
    const crops = CROPS[season] || CROPS[1];
    if (toss < 0.6) produce(b, Math.round(100 + toss * 18), Math.round(62 - Math.sin((toss / 0.6) * Math.PI) * 10), crops[Math.floor(p * 4) % 3]);
    gold(b, 100 + ((day * 37) % 800) + Math.floor(p * 90));
    return 7;
  },
  // Sunset over the farm; after a festival lanterns rise and fireworks go up, else the fireflies come out.
  evening({ b, p, t, day, festival, season }) {
    sky(b, 60, "#4a3a7a", "#f6a06a", 0, 0);
    const sun = Math.round(16 + p * 26);
    b.rect(118, sun, 12, 12, "#fff1a8");
    b.rect(116, sun + 2, 16, 8, "#fff1a8");
    hills(b, "#5a4a7a", "#4a3a6a");
    b.draw(dusk(season), 0, 0);
    farmer(b, 112, 84, "side", { flip: true });
    if (festival) {
      for (let k = 0; k < 6; k++) {
        const ly = Math.round(90 - ((t * 6 + k * 15) % 90));
        b.rect((k * 27 + 9) % W, ly, 3, 4, "#f39a33");
        b.px((k * 27 + 10) % W, ly + 1, "#fff1a8");
      }
      const burst = Math.floor(t * 1.2);
      const [bx, by] = [30 + Math.floor(noise(burst, 1, 8) * 100), 10 + Math.floor(noise(burst, 2, 8) * 16)];
      const r = 2 + ((t * 1.2) % 1) * 10;
      for (let a = 0; a < 12; a++)
        b.px(bx + Math.cos((a * Math.PI) / 6) * r, by + Math.sin((a * Math.PI) / 6) * r, ["#ff6f9a", "#f6cf4a", "#8fd3ff"][burst % 3]);
    } else
      for (let k = 0; k < 8; k++)
        if (Math.sin(t * 3 + k * 2) > 0.2) b.px((k * 23 + Math.round(Math.sin(t + k) * 4) + 5) % W, 70 + ((k * 7) % 20), "#e8f07a");
    return -1;
  },
};

/* ---------- pieces of the scenes ---------- */

// The farm at dusk, to lay over the sunset: the grass and the house, dimmed, the window lit.
const dusk = (season) =>
  backdrop(`dusk${season}`, (b) => {
    lawn(b, 0, 64, W, H - 64, season, 9);
    farmhouse(b, 60, 66);
    b.tint(0, 0, W, H, "#2a2050", 0.45);
    const [x, y] = houseWindow(60, 66);
    b.rect(x, y, 8, 9, "#f6d77a");
    b.rect(x + 3, y, 1, 9, "#c8a050");
    b.rect(x, y + 4, 8, 1, "#c8a050");
  });

// Mountains far off and green hills before them, down to row 64 (where the grass starts).
function hills(b, far = "#6a9ac8", near = "#4f8a6a") {
  for (let x = 0; x < W; x++) {
    const top = 34 + Math.round(8 * Math.sin(x * 0.045 + 1) + 4 * Math.sin(x * 0.13));
    b.rect(x, top, 1, 64 - top, far);
    if (Math.sin(x * 0.045 + 1) > 0.6 && x % 3 === 0) b.px(x, top + 1, "#e8f0f6");
    const top2 = 48 + Math.round(4 * Math.sin(x * 0.07 + 3) + 2 * Math.sin(x * 0.21));
    b.rect(x, top2, 1, 64 - top2, near);
    b.px(x, top2, mixHex(near, "#ffffff", 0.25));
  }
}

// The game's title in fat letters on two lines, gold with a dark edge, a leaf on top.
const LETTERS = {
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  V: ["#...#", "#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
};
function logo(b, x, y) {
  const word = (text, wx, wy) => {
    // Each letter's texels doubled, the edge first so the letters share one outline.
    const cells = [];
    [...text].forEach((ch, k) =>
      LETTERS[ch].forEach((row, j) => [...row].forEach((on, i) => on === "#" && cells.push([wx + k * 12 + i * 2, wy + j * 2, j])))
    );
    for (const [cx, cy] of cells) b.rect(cx - 1, cy - 1, 4, 4, "#5c3218");
    for (const [cx, cy] of cells) b.rect(cx, cy + 2, 2, 1, "#5c3218");
    for (const [cx, cy, j] of cells) b.rect(cx, cy, 2, 2, j < 3 ? "#ffe066" : j < 5 ? "#f6c030" : "#e0902a");
  };
  word("STARDEW", x + 2, y);
  word("VALLEY", x + 8, y + 18);
  b.rect(x + 84, y - 3, 5, 3, "#5fb03a");
  b.rect(x + 86, y - 5, 4, 2, "#8ad85a");
  b.px(x + 84, y - 3, INK);
}

// The letter, unfolded: its words written out so far (`written` 0-1) in ink, a heart drawn at the end if
// `signed`; from a friend (`from`), or the mayor's invitation to the festival.
const FRIENDS = ["EMMA", "LEO", "MAY", "IVY", "SAM"];
function letter(b, written, signed, t, day, festival) {
  b.rect(28, 8, 112, 76, INK);
  b.rect(29, 9, 110, 74, "#fbf0d6");
  b.rect(29, 9, 110, 2, "#e8d0a0");
  for (let j = 14; j < 80; j += 8) b.rect(33, j + 6, 102, 1, "#efe0c0");
  const words = festival
    ? ["DEAR FARMER,", "", "THE FESTIVAL IS TODAY IN", "THE TOWN SQUARE. COME", "ALONG AT NINE!", "", "  - THE MAYOR"]
    : ["DEAR FARMER,", "", "THANK YOU FOR THE LOVELY", "GIFT! IT MADE MY WHOLE", "WEEK. COME AND VISIT!", "", `  - ${FRIENDS[day % FRIENDS.length]}`];
  lines(b, words, written * letters(words), 36, 15, "#5a4a7a", null, 8);
  if (signed) {
    heart(b, 116, 66);
    sparkle(b, 126, 64, t);
  }
}

// Tomorrow's weather (snow all winter), and what the forecast says of it.
const weatherOf = (day) => (Math.floor(day / 28) % 4 === 3 ? "snow" : (day >> 1) % 3 === 0 ? "rain" : "sun");
const FORECAST = {
  sun: ["TOMORROW: SUNNY ALL DAY.", "A LOVELY DAY FOR FARMING!"],
  rain: ["TOMORROW: RAIN.", "NO NEED TO WATER THE CROPS!"],
  snow: ["TOMORROW: SNOW.", "WRAP UP WARM OUT THERE!"],
};
// The weather forecast: the presenter beside tomorrow's sky (sun, rain, or snow in winter).
function weather(b, t, day) {
  b.rect(35, 13, 98, 54, "#5ab0f0");
  b.rect(35, 52, 98, 15, "#3e6fd6");
  for (let i = 35; i < 133; i += 6) b.rect(i, 54, 4, 1, "#8fd0f5");
  const kind = weatherOf(day);
  if (kind === "sun") {
    b.rect(98, 22, 14, 14, "#f6cf4a");
    b.rect(96, 25, 18, 8, "#f6cf4a");
    for (let a = 0; a < 8; a++) b.px(105 + Math.cos(a + t) * 13, 29 + Math.sin(a + t) * 13, "#fff1a8");
  } else {
    b.rect(90, 20, 30, 10, "#e8eef4");
    b.rect(94, 16, 16, 6, "#e8eef4");
    for (let k = 0; k < 6; k++) b.px(92 + k * 5, 32 + ((t * 12 + k * 3) % 14), kind === "snow" ? "#ffffff" : "#3e6fd6");
  }
  // The presenter: a woman in a red jacket.
  b.rect(46, 26, 18, 8, "#2b1a14");
  b.rect(48, 28, 14, 12, "#f9d6bd");
  b.rect(48, 28, 14, 3, "#2b1a14");
  b.rect(51, 33, 2, 2, "#2b2522");
  b.rect(57, 33, 2, 2, "#2b2522");
  b.rect(53, 37, 4, 1, Math.sin(t * 9) > 0 ? "#8a2c2c" : "#c46a5a");
  b.rect(44, 40, 22, 27, "#c0392b");
  b.rect(53, 40, 4, 6, "#fbf6ec");
}
// The fortune teller: a purple room, her veiled head, the crystal ball glowing.
function fortune(b, t) {
  b.rect(35, 13, 98, 54, "#3a1f5a");
  for (let k = 0; k < 10; k++) if (Math.sin(t * 2 + k) > 0) b.px(38 + ((k * 37) % 92), 16 + ((k * 13) % 30), "#c79bf2");
  b.rect(70, 20, 28, 30, "#7a3aa0");
  b.rect(74, 26, 20, 14, "#f0c8a8");
  b.rect(78, 31, 3, 2, "#2b2522");
  b.rect(87, 31, 3, 2, "#2b2522");
  b.rect(66, 46, 36, 21, "#7a3aa0");
  const glow = Math.sin(t * 3) > 0 ? "#c8f0ff" : "#9fd8f0";
  b.rect(76, 48, 16, 12, INK);
  b.rect(77, 49, 14, 10, glow);
  b.rect(79, 50, 3, 3, "#ffffff");
  b.rect(72, 60, 24, 4, "#c8a050");
}

// The end of the day: what was shipped, row by row (crops, forage, fish, minerals, other) and the total.
function takings(b, shown, day) {
  b.rect(0, 0, W, H, "#1a1420");
  b.rect(22, 6, 124, 84, INK);
  b.rect(23, 7, 122, 82, "#d8843a");
  b.rect(25, 9, 118, 78, "#fbe3b0");
  // Each row's sign: a crop, a leaf, a fish, a gem, a chest.
  const ICON = [
    (y) => produce(b, 34, y + 10, "tomato"),
    (y) => {
      for (let k = 0; k < 6; k++) b.rect(31 + k, y + 6 - k, 2, Math.min(k + 1, 6 - k), "#5fb03a");
      b.rect(31, y + 7, 1, 1, "#3a7a2a");
    },
    (y) => fish(b, 35, y + 7, "#3e8fd6"),
    (y) => gem(b, 34, y + 7, "#c79bf2"),
    (y) => {
      b.rect(30, y + 1, 9, 7, INK);
      b.rect(31, y + 2, 7, 5, "#a8662f");
      b.rect(31, y + 4, 7, 1, "#f6cf4a");
    },
  ];
  let total = 0;
  for (let k = 0; k < 5; k++) {
    const amount = ((day * 37 + k * 53) % 300) + 20;
    total += amount;
    if (k >= Math.floor(shown * 6)) continue;
    const y = 13 + k * 12;
    ICON[k](y);
    const what = ["CROPS", "FORAGE", "FISH", "MINERALS", "OTHER"][k];
    text(b, what, 44, y + 2, "#5c3a26");
    for (let i = 46 + what.length * 4; i < 112; i += 3) b.px(i, y + 6, "#c8a070");
    rightDigits(b, amount, 136, y + 2, "#5c3a26");
    b.rect(124 - String(amount).length * 4, y + 2, 1, 1, "#f6cf4a");
  }
  if (shown >= 1) {
    b.rect(30, 74, 108, 1, "#c8a070");
    b.rect(30, 78, 5, 5, "#f6cf4a");
    rightDigits(b, total, 136, 78, "#c0392b");
  }
}
export function rightDigits(b, n, right, y, c, shadow = null) {
  digits(b, n, right - String(n).length * 4 + 1, y, c, shadow);
}

// Her gold, top right: the wooden box with the coins' count in it.
export function gold(b, n) {
  b.rect(118, 3, 47, 13, INK);
  b.rect(119, 4, 45, 11, "#d8843a");
  b.rect(121, 6, 41, 7, "#5c3a26");
  rightDigits(b, n, 159, 7, "#f6cf4a");
  b.rect(123, 8, 3, 3, "#f6cf4a");
}

// The barnyard: grass, the red barn on the right with its white trim and big doors, the fence, a tree.
function barnyard(b, season) {
  lawn(b, 0, 0, W, H, season, 11);
  tree(b, 18, 40, season, 4, 0.9);
  fence(b, 0, 100, 30);
  const [x, y] = [104, 6];
  for (let j = 0; j < 12; j++) {
    const inset = Math.max(0, 8 - j);
    b.rect(x - 2 + inset, y + j, 64 - 2 * inset, 1, j % 3 === 2 ? "#4a4a55" : "#6a6a78");
  }
  b.rect(x - 2, y + 12, 64, 1, INK);
  b.rect(x, y + 13, 60, 44, "#b03a2a");
  for (let i = x + 3; i < x + 60; i += 5) b.rect(i, y + 13, 1, 44, "#8a2a1f");
  b.rect(x, y + 13, 60, 2, "#fbf6ec");
  b.rect(x - 1, y + 13, 1, 44, INK);
  b.rect(x + 60, y + 13, 1, 44, INK);
  // The doors: white frame, a cross on each.
  b.rect(x + 14, y + 26, 32, 31, "#fbf6ec");
  b.rect(x + 16, y + 28, 13, 29, "#9a2a1f");
  b.rect(x + 31, y + 28, 13, 29, "#9a2a1f");
  for (let k = 0; k < 13; k++) {
    b.px(x + 16 + k, y + 28 + Math.round(k * 2.2), "#fbf6ec");
    b.px(x + 28 - k, y + 28 + Math.round(k * 2.2), "#fbf6ec");
    b.px(x + 31 + k, y + 28 + Math.round(k * 2.2), "#fbf6ec");
    b.px(x + 43 - k, y + 28 + Math.round(k * 2.2), "#fbf6ec");
  }
  b.rect(x + 26, y + 16, 8, 7, INK);
  b.rect(x + 27, y + 17, 6, 5, "#f6d77a");
  b.rect(x - 2, y + 57, 64, 1, INK);
  if (season !== 3) earth(b, x + 12, y + 58, 36, H - y - 58, 12);
}

// Inside the coop: plank walls, the four nesting boxes along the back, straw on the floor, the heater.
function coop(b) {
  b.rect(0, 0, W, 50, "#c89a6a");
  for (let i = 0; i < W; i += 7) b.rect(i, 0, 1, 50, "#a87a4a");
  b.rect(0, 0, W, 3, "#6b3f22");
  boards(b, 0, 50, W, H - 50, { plank: "#c8a050", light: "#e0c070", dark: "#a8843a" });
  for (let j = 52; j < H; j++) for (let i = 0; i < W; i++) if (noise(i, j, 13) < 0.08) b.px(i, j, noise(i, j, 14) < 0.5 ? "#f0d888" : "#a8843a");
  for (const x of [28, 62, 96, 130]) {
    b.rect(x - 9, 34, 20, 13, INK);
    b.rect(x - 8, 35, 18, 11, "#a8662f");
    b.rect(x - 7, 37, 16, 6, "#e8c870");
    b.rect(x - 8, 35, 18, 1, "#c8823f");
  }
  b.rect(150, 56, 12, 16, INK);
  b.rect(151, 57, 10, 14, "#8a8f97");
  b.rect(153, 63, 6, 4, "#f39a33");
}

// The kitchen: tiled wall, the counter along it with the stove and its pot, the fridge, shelves.
function kitchen(b) {
  b.rect(0, 0, W, 40, "#e8e0c8");
  for (let j = 0; j < 40; j += 6) b.rect(0, j, W, 1, "#d0c8b0");
  for (let j = 0; j < 40; j += 6) for (let i = (j / 6) % 2 ? 3 : 0; i < W; i += 6) b.rect(i, j, 1, 6, "#d0c8b0");
  boards(b, 0, 40, W, H - 40);
  // Counter.
  b.rect(0, 24, W - 30, 18, INK);
  b.rect(0, 25, W - 30, 4, "#e0c8a0");
  b.rect(0, 29, W - 30, 12, "#a8662f");
  for (let i = 10; i < W - 30; i += 20) b.rect(i, 31, 16, 8, "#8a5228");
  // Stove and pot.
  b.rect(44, 24, 34, 18, INK);
  b.rect(45, 25, 32, 16, "#3a3a44");
  b.rect(48, 34, 26, 6, "#2a2a30");
  b.rect(50, 18, 22, 10, INK);
  b.rect(51, 19, 20, 8, "#5a5a6a");
  b.rect(51, 19, 20, 2, "#7a7a8a");
  b.rect(49, 29, 6, 2, "#e0402e");
  b.rect(67, 29, 6, 2, "#e0402e");
  // Fridge.
  b.rect(W - 30, 4, 28, 40, INK);
  b.rect(W - 29, 5, 26, 38, "#e8eef4");
  b.rect(W - 29, 18, 26, 1, "#a8b8c8");
  b.rect(W - 6, 8, 1, 8, "#a8b8c8");
  b.rect(W - 6, 22, 1, 14, "#a8b8c8");
  // Shelf with jars.
  b.rect(8, 8, 28, 2, "#8a5228");
  for (let k = 0; k < 4; k++) {
    b.rect(10 + k * 7, 3, 5, 5, INK);
    b.rect(11 + k * 7, 4, 3, 4, ["#e0402e", "#f6cf4a", "#5fb03a", "#c79bf2"][k]);
  }
}
