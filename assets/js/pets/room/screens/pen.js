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
