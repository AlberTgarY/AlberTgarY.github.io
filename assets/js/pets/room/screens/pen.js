/*******************************************************************************
 * Drawing on the playground's screens a pixel at a time: the pen, the digits
 * and the little people the shows and games are made of.
 ******************************************************************************/

// Drawing helpers on a 2D context: a rectangle and a pixel, rounded to whole texels.
export function pen(g) {
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

export function number(px, n, x, y, c) {
  [...String(n)].forEach((d, k) => [...DIGITS[+d]].forEach((on, i) => on === "1" && px(x + k * 4 + (i % 3), y + Math.floor(i / 3), c)));
}

// A little person seen from the front, `top` the top of the head: hair, face, and clothes below.
export function person(rect, px, x, top, { hair, skin = "#f9d6bd", clothes, mouth = false }) {
  rect(x - 1, top, 4, 1, hair);
  rect(x - 1, top + 1, 4, 3, skin);
  rect(x - 1, top + 1, 1, 2, hair);
  rect(x + 2, top + 1, 1, 2, hair);
  px(x, top + 2, "#2b2522");
  px(x + 1, top + 2, "#2b2522");
  if (mouth) px(x, top + 3, "#c4503f");
  rect(x - 2, top + 4, 6, 4, clothes);
}

// The same for the TV's finer screen (twice the texels): digits five texels wide and seven high, each row
// kept as the runs of texels that are on, so a digit is a few rectangles.
const DIGITS2 = [
  ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
].map((rows) => rows.flatMap((row, y) => [...row.matchAll(/1+/g)].map((m) => [m.index, y, m[0].length])));

export function number2(rect, n, x, y, c) {
  [...String(n)].forEach((d, k) => DIGITS2[+d].forEach(([i, j, run]) => rect(x + k * 6 + i, y + j, run, 1, c)));
}

// A colour made darker (k < 0, towards black) or lighter (k > 0, towards white), for shading.
export function shade(c, k) {
  const n = parseInt(c.slice(1, 7), 16);
  const to = k < 0 ? 0 : 255;
  const mix = (v) => Math.round(v + (to - v) * Math.abs(k));
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

// A person on the TV's finer screen, seen from the front, 12 texels wide and 16 high: `x` the middle of the
// face (it spans x - 4 to x + 3), `top` the top of the head. The hair is cut `style` short, spiky, long, bob,
// bun, pony or pigtails; `mouth` open while talking, `blink`, `blush`; `collar` and `tie` on the shirt front;
// `arms` false leaves the arms for the show to draw (the sleeves are then the body's edges); `hat` "chef".
export function person2(rect, px, x, top, opts) {
  const { hair, style = "short", skin = "#f9d6bd", clothes, mouth = false, blink = false, blush = false, collar, tie, arms = true, hat } = opts;
  const X = x;
  if (style === "bun") rect(X - 2, top - 3, 4, 3, hair);
  if (style === "pigtails") {
    rect(X - 7, top + 2, 3, 6, hair);
    rect(X + 4, top + 2, 3, 6, hair);
  }
  if (style === "pony") rect(X + 4, top + 2, 2, 8, hair);
  // The body: round shoulders, the arms down the sides with the hands showing.
  rect(X - 1, top + 8, 2, 1, shade(skin, -0.15));
  rect(X - 5, top + 9, 10, 1, clothes);
  rect(X - 6, top + 10, 12, 6, clothes);
  if (collar) {
    rect(X - 2, top + 9, 4, 1, collar);
    rect(X - 1, top + 10, 2, 1, collar);
  }
  if (tie) rect(X - 1, top + 10, 2, 4, tie);
  if (arms) {
    const fold = shade(clothes, -0.22);
    rect(X - 5, top + 11, 1, 4, fold);
    rect(X + 4, top + 11, 1, 4, fold);
    px(X - 6, top + 15, skin);
    px(X + 5, top + 15, skin);
  }
  // The head: the face, the hair over the top with the fringe, ears where the hair is short.
  rect(X - 4, top + 2, 8, 5, skin);
  rect(X - 3, top + 7, 6, 1, skin);
  if (style === "short" || style === "spiky" || style === "bun" || style === "pony") {
    px(X - 5, top + 4, skin);
    px(X + 4, top + 4, skin);
  }
  rect(X - 3, top, 6, 1, hair);
  rect(X - 4, top + 1, 8, 1, hair);
  rect(X - 4, top + 2, 3, 1, hair);
  rect(X + 1, top + 2, 3, 1, hair);
  px(X - 4, top + 3, hair);
  px(X + 3, top + 3, hair);
  px(X - 2, top + 1, shade(hair, 0.3));
  if (style === "spiky") [-4, -1, 2].forEach((d) => rect(X + d, top - 1, 2, 1, hair));
  if (style === "long" || style === "bob") {
    const long = style === "long" ? 12 : 6;
    rect(X - 5, top + 1, 2, long, hair);
    rect(X + 3, top + 1, 2, long, hair);
  }
  if (hat === "chef") {
    rect(X - 5, top - 6, 10, 3, "#ffffff");
    rect(X - 4, top - 3, 8, 3, "#ffffff");
    rect(X - 4, top - 1, 8, 1, "#e3e1dc");
  }
  // The face: eyes (shut while blinking), rosy cheeks, the mouth.
  const eye = "#2b2522";
  if (blink) {
    px(X - 2, top + 5, eye);
    px(X + 1, top + 5, eye);
  } else {
    rect(X - 2, top + 4, 1, 2, eye);
    rect(X + 1, top + 4, 1, 2, eye);
  }
  if (blush) {
    px(X - 3, top + 6, "#f4a6a6");
    px(X + 2, top + 6, "#f4a6a6");
  }
  if (mouth) {
    rect(X - 1, top + 6, 2, 2, "#8a2e2e");
    rect(X - 1, top + 7, 2, 1, "#c4503f");
  } else rect(X - 1, top + 6, 2, 1, shade(skin, -0.3));
}
