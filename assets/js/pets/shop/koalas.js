/*******************************************************************************
 * Two koala plushes on the wrapping bench (kiosk.js), towards its back end by
 * the shelving, between the pot of pens and the scissors (further back is
 * where she lays a bouquet out, and her head comes over it). As in the
 * photos: a big round head of soft grey fur, big round ears full of white
 * fluff, a big glossy black nose, bead eyes, pink cheeks, a small body.
 * One graduates, in a black gown piped with gold, a mortarboard with a gold
 * tassel, a diploma tied with navy ribbon in its paws. The other wears white
 * pyjamas printed with coffee cups, doughnuts, croissants, bubble tea and
 * little hearts; a click on it puts on the pyjamas' matching hood (a snug
 * bonnet, its ears folded down inside), or takes it off.
 *
 * Shapes are given in design units (D voxels; a koala's own x to its right,
 * y up from the bench top, z out of its front) and filled with voxels finer
 * still (RES of them a design unit), so that they come out round.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, meshOf, paletteOf } from "./kit.js";
import { hash, easeOutBack } from "../models/voxels.js";
import { BENCH, FLOOR } from "./layout.js";

const D = 0.25; // voxels a design unit
const RES = 1.4; // voxels of the mesh a design unit
const U = D / RES; // (so voxels a voxel of the mesh)
const TOP = FLOOR + BENCH.h; // the bench's worktop
// Where they sit (world x, z) and the way they face (VIEW_YAW 0.6 faces the camera), the graduate nearer
// the wall, each turned a little to the other.
const GRADUATE = { x: -140.5, z: -83.5, yaw: 0.7 };
const SLEEPER = { x: -133.5, z: -86, yaw: 0.45 };
const HOOD_SECS = 0.9; // putting the hood on, or taking it off

const PALETTE = paletteOf({
  fur: "#9b9fa5",
  furLight: "#aeb2b7",
  furDark: "#8a8e94",
  earWhite: "#f3f1ec",
  earShade: "#dedbd4",
  chin: "#b7babe",
  nose: "#17171a",
  noseShine: "#6a6d73",
  eye: "#111113",
  glint: "#ffffff",
  blush: "#f0aab4",
  pj: "#fbf8f2",
  pjShade: "#efe9de",
  lid: "#5a3826",
  kraft: "#d9b07c",
  sleeve: "#8a5536",
  icing: "#f39bb6",
  sprinkle: "#6fb0dd",
  dough: "#d39a5c",
  croissant: "#e6a64c",
  crumb: "#b8742e",
  cream: "#efe3cc",
  tea: "#c99d74",
  pearl: "#3b2a22",
  heart: "#e2475a",
  gown: "#1f2026",
  gownShade: "#2b2c33",
  board: "#34353d",
  gold: "#dcb44f",
  goldDark: "#b58d33",
  scroll: "#f6f2e7",
  scrollEnd: "#d8cdb4",
  ribbon: "#2a3f8f",
});

// How far (x, y, z) is into the ellipsoid round c with radii r: under 1 inside.
const into = (x, y, z, [cx, cy, cz], [rx, ry, rz]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
const inside = (x, y, z, c, r) => into(x, y, z, c, r) <= 1;
// The same ellipsoid grown by `d` all round.
const grown = ([c, r], d) => [c, r.map((v) => v + d)];

// The voxels within `n` design units across (either way, in x and z) and `h` up that `paint` colours (given
// each one's middle in design units and its whole coordinates; nothing: no voxel), as a mesh standing on its
// local origin.
function sculpt(n, h, paint) {
  const p = part();
  const [N, H] = [Math.ceil(n * RES), Math.ceil(h * RES)];
  for (let i = -N; i < N; i++)
    for (let j = 0; j < H; j++)
      for (let k = -N; k < N; k++) {
        const c = paint((i + 0.5) / RES, (j + 0.5) / RES, (k + 0.5) / RES, i, j, k);
        if (c) p.add(i, j, k, c);
      }
  const m = meshOf(p, U, PALETTE);
  m.position.setScalar(U / 2);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Soft grey fur, a little lighter here and there.
const fur = (i, j, k) => {
  const h = hash(i, j, k);
  return h < 0.14 ? "furLight" : h > 0.95 ? "furDark" : "fur";
};

// The pyjamas' print, as in the photo: coffees to go, pink iced doughnuts, croissants, bubble teas, and between
// them little red hearts and coffee beans; pixel pictures (a voxel of the mesh a pixel, the top row first)
// coloured by INK.
const INK = {
  D: "lid",
  C: "kraft",
  S: "sleeve",
  P: "icing",
  R: "heart",
  B: "sprinkle",
  T: "dough",
  O: "croissant",
  o: "crumb",
  k: "pearl",
  W: "cream",
  t: "tea",
};
const PICTURES = [
  ["DDD", "CCC", "SSS", "CCC"], // a coffee to go
  ["PBP", "P.P", "TTT"], // a doughnut, iced, sprinkled
  ["oOOo", "O..O"], // a croissant
  ["..k", "WWW", "ttt", "kkk"], // a bubble tea, its straw, the pearls
];
const SMALL = [
  ["R.R", "RRR", ".R."], // a heart
  ["k"], // a coffee bean
];
const CELL = 5; // (in voxels of the mesh: a picture in each, now and then a small one)
// The print over a garment round `c` (x, y, z), in voxels of the mesh, laid out over each side (front, back,
// left, right or top: whichever the voxel faces most).
function printed(x, y, z, i, j, k, [cx, cy, cz]) {
  const [ax, ay, az] = [Math.abs(x - cx), y - cy, Math.abs(z - cz)];
  const top = ay > Math.max(ax, az); // (facing up more than any way round)
  const across = !top && ax > az * 1.1; // (facing left or right more than front or back)
  const side = top ? 5 : across ? (x > cx ? 1 : 2) : z > cz ? 3 : 4;
  const [a, b] = top ? [i, k] : [across ? k : i, j];
  const cj = Math.floor(b / CELL);
  const shift = cj & 1 ? 2 : 0; // (rows staggered)
  const ci = Math.floor((a - shift) / CELL);
  const h = hash(ci, cj, side);
  const pics = hash(ci, cj, side + 3) < 0.25 ? SMALL : PICTURES;
  const pic = pics[Math.floor(h * pics.length)];
  const [u, r] = [a - shift - ci * CELL - 1, cj * CELL + CELL - 1 - b];
  const ink = INK[pic[r]?.[u]];
  return ink ?? (hash(i, j, k) < 0.06 ? "pjShade" : "pj");
}

// The gown: black, gold piping down the front in a V to the chest.
function gowned(x, y, z, i, j, k, [, cz]) {
  if (z > cz + 2 && y > 7 && y < 13.5 && Math.abs(Math.abs(x) - (y - 7) * 0.6) < 0.5) return "gold";
  return hash(i, j, k) < 0.1 ? "gownShade" : "gown";
}

// The shapes both are made of: [middle, radii] in design units.
const HEAD = [
  [0, 21.5, 0.5],
  [10.5, 9, 8],
];
const BODY = [
  [0, 6.8, 0],
  [7, 7.2, 6],
];
const SIDES = [-1, 1];
const EARS = SIDES.map((s) => [
  [s * 10.8, 27.5, -0.5],
  [5.8, 5.6, 2.8],
]);
const FLUFF = SIDES.map((s) => [
  [s * 10.4, 27, 1.4],
  [4, 4.1, 1.8],
]);
const FEET = SIDES.map((s) => [
  [s * 3.6, 1.8, 5],
  [2.6, 2, 2.9],
]);

// Ears: grey round the rim, full of white fluff (its edge ragged).
function ear(x, y, z, i, j, k) {
  for (const [n, e] of EARS.entries()) {
    if (into(x, y, z, ...FLUFF[n]) < 1 + 0.5 * (hash(i, j, k) - 0.5)) return hash(k, i, j) < 0.2 ? "earShade" : "earWhite";
    if (inside(x, y, z, ...e)) return fur(i, j, k);
  }
  return null;
}

// The head: fur, the face on its front: bead eyes with a glint each, a big glossy nose (an egg, wider at the
// top), pink cheeks, a paler chin.
function head(x, y, z, i, j, k) {
  const [nc, nr] = [
    [0, 19.2, 8.1],
    [2.9, 3.3, 2.2],
  ];
  const taper = 0.82 + 0.18 * Math.min(1, Math.max(-1, (y - nc[1]) / nr[1])); // (narrower below)
  if (inside(x, y, z, nc, [nr[0] * taper, nr[1], nr[2]])) return (x + 1.1) ** 2 + (y - 21) ** 2 < 0.5 ? "noseShine" : "nose";
  if (!inside(x, y, z, ...HEAD)) return null;
  if (z > 3) {
    const ex = x - Math.sign(x) * 4.7; // (from the eye's middle; the glints both up to the left)
    if ((ex / 1.3) ** 2 + ((y - 22.4) / 1.45) ** 2 <= 1) return (ex + 0.5) ** 2 + (y - 23) ** 2 < 0.35 ? "glint" : "eye";
    if (((Math.abs(x) - 7) / 1.9) ** 2 + ((y - 19.2) / 1.1) ** 2 <= 1) return "blush";
    if ((x / 3.8) ** 2 + ((y - 15) / 1.8) ** 2 < 1) return "chin";
  }
  return fur(i, j, k);
}

// One koala: `dress` "gown" (with the mortarboard and diploma) or "pyjamas". Returns its parts (each
// standing on the koala's origin): `body`, and for the pyjamas the `ears` and the `hood` apart (the hood on,
// the ears are folded down inside it).
function buildKoala(dress) {
  const graduate = dress === "gown";
  const cloth = graduate ? gowned : printed;
  // The arms: at the sides, or (the graduate's) forward, hugging the diploma stood up before it.
  const ARMS = SIDES.map((s) =>
    graduate
      ? [
          [s * 5.4, 8.4, 4],
          [2.6, 3.8, 3.4],
        ]
      : [
          [s * 6.6, 8, 2.6],
          [2.6, 4.4, 2.6],
        ]
  );
  const PAWS = SIDES.map((s) =>
    graduate
      ? [
          [s * 3, 7, 7.6],
          [1.8, 1.8, 1.8],
        ]
      : [
          [s * 6.4, 4.4, 4.4],
          [2.3, 2.1, 2.3],
        ]
  );

  // The mortarboard: a cap on the head between the ears, the board on it (its top a shade lighter), a button
  // in the middle, a cord from it over the left edge (away from the other koala), the tassel hanging there.
  const B = 11.5; // (half the board's width)
  const TASSEL = 9.6; // (how far forward of the middle it hangs: further back, the board hides it from above)
  const mortarboard = (x, y, z, i, j, k) => {
    const [dx, dz] = [x, z - 0.5];
    if (y > 31.5 && y < 33 && Math.abs(dx) < B && Math.abs(dz) < B)
      return y > 32.4 && Math.max(Math.abs(dx), Math.abs(dz)) < B - 0.8 ? "board" : "gown";
    if (y > 27.5 && y < 31.5 && (dx / 6.2) ** 2 + (dz / 6.2) ** 2 <= 1) return "gown";
    if (y > 33 && y < 34 && Math.abs(dx) < 1.1 && Math.abs(dz) < 1.1) return "gold"; // (the button)
    // The cord: across the top from the button to the left edge, over it and down to the knot.
    const [ex, ez] = [-B, TASSEL]; // (where it goes over the edge)
    const along = Math.min(1, Math.max(0, (dx * ex + dz * ez) / (ex * ex + ez * ez)));
    if (y > 33 && y < 33.7 && Math.hypot(dx - along * ex, dz - along * ez) < 0.45) return "gold";
    if (dx > ex - 0.7 && dx <= ex && Math.abs(dz - ez) < 0.4 && y > 30.5 && y < 33.7) return "gold";
    // The tassel: a knot, then a bundle of threads flaring a little, their ends ragged, a fringe at the bottom.
    const [tx, tz] = [ex - 0.35, ez];
    if (inside(x, y, dz, [tx, 30.1, tz], [0.85, 0.75, 0.85])) return "gold";
    const r = Math.hypot(dx - tx, dz - tz);
    if (y < 29.6 && r < 0.75 + 0.2 * (29.6 - y) && y > 29.6 - 3.6 - 1.4 * hash(i, 3, k) && (y > 27.4 || (i + k) % 2 === 0))
      return y > 28.9 ? "goldDark" : hash(i, 5, k) < 0.4 ? "goldDark" : "gold";
    return null;
  };
  // The diploma: a white roll stood up before its chest, hugged by both paws, a navy ribbon round it tied
  // in a bow at the front; the paper's curl seen at the top.
  const diploma = (x, y, z) => {
    if (SIDES.some((s) => inside(x, y, z, [s * 1.9, 10.9, 10.3], [1.5, 1.05, 0.7]))) return "ribbon";
    if (inside(x, y, z, [0, 10.6, 10.6], [0.65, 0.65, 0.55])) return "ribbon";
    if (SIDES.some((s) => inside(x, y, z, [s * 0.7, 8.9, 10.5], [0.45, 1.5, 0.45]))) return "ribbon";
    const r = Math.hypot(x, z - 8.6);
    if (r > 1.9 || y < 2.4 || y > 13.8) return null;
    if (y > 10.2 && y < 11.1) return "ribbon";
    return y > 13.2 && r > 0.5 && r < 1.2 ? "scrollEnd" : "scroll";
  };

  const body = sculpt(17, 35, (x, y, z, i, j, k) => {
    const h = head(x, y, z, i, j, k);
    if (h) return h;
    if (graduate) {
      const c = mortarboard(x, y, z, i, j, k) ?? ear(x, y, z, i, j, k);
      if (c) return c;
    }
    if (PAWS.some((p) => inside(x, y, z, ...p)) || FEET.some((f) => inside(x, y, z, ...f))) return fur(i, j, k);
    if (graduate) {
      const d = diploma(x, y, z);
      if (d) return d;
    }
    const arm = ARMS.find((a) => inside(x, y, z, ...a));
    if (arm) return graduate && z > 5.2 && z < 6 ? "gold" : cloth(x, y, z, i, j, k, arm[0]);
    if (inside(x, y, z, ...BODY)) return cloth(x, y, z, i, j, k, BODY[0]);
    return null;
  });
  if (graduate) return { body };

  // (the ears and the hood each in a group turning and growing about where it is fixed: the ears' roots,
  // the middle of the head)
  const ears = pivoted(
    sculpt(17, 35, (x, y, z, i, j, k) => (inside(x, y, z, ...HEAD) ? null : ear(x, y, z, i, j, k))),
    [0, 23, -0.5]
  );
  // The hood: a thin bonnet close round the head, two soft bumps on top where the ears are folded down in
  // it, open round the face; it comes down to the nape.
  const BUMPS = SIDES.map((s) => [
    [s * 7.6, 27.4, -1],
    [4.2, 3.6, 3.4],
  ]);
  const within = (x, y, z, d) => inside(x, y, z, ...grown(HEAD, d)) || BUMPS.some((b) => inside(x, y, z, ...grown(b, d - 1.6)));
  const hood = pivoted(
    sculpt(17, 35, (x, y, z, i, j, k) => {
      if (y < 13.5 || !within(x, y, z, 1.6) || within(x, y, z, 0.15)) return null;
      if (z > 1 && (x / 8.6) ** 2 + ((y - 20.2) / 7.4) ** 2 <= 1) return null; // (round the face)
      if (inside(x, y, z, ...BODY)) return null;
      return printed(x, y, z, i, j, k, HEAD[0]);
    }),
    HEAD[0]
  );
  return { body, ears, hood };
}

// `mesh` in a group at `pivot` (design units, the koala's own), to turn and scale about it.
function pivoted(mesh, pivot) {
  const g = new THREE.Group();
  g.position.set(...pivot.map((v) => v * D));
  mesh.position.sub(g.position);
  g.add(mesh);
  return g;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Their builder (as the shop's others: shop.js): the two of them on the bench, the sleeper's hood to click.
// `kiosk` for whether the shop is open (nothing in it to click with the shutter down).
export function* buildingKoalas(kiosk) {
  const group = new THREE.Group();
  const seat = (parts, { x, z, yaw }) => {
    const g = new THREE.Group();
    g.position.set(x, TOP, z);
    g.rotation.y = yaw;
    g.add(...parts);
    group.add(g);
    return g;
  };
  const graduate = buildKoala("gown");
  seat([graduate.body], GRADUATE);
  yield;
  const sleeper = buildKoala("pyjamas");
  seat([sleeper.body, sleeper.ears, sleeper.hood], SLEEPER);

  // The hood: `k` how far on (0 off, 1 on), going to `on`. Put on, the ears fold down first, then the hood
  // comes down over the head, growing to its size; taken off, the other way round: it lifts off, shrinking
  // away, and the ears spring up.
  const hood = { k: 0, on: false, moved: false };
  const hoodAt = sleeper.hood.position.clone();
  function pose() {
    const { hood: h, ears } = sleeper;
    const up = clamp01(1 - hood.k / 0.35); // (the ears)
    const on = clamp01((hood.k - 0.3) / 0.7); // (the hood)
    h.visible = h.children[0].visible = on > 0.01; // (the mesh too: a click goes by it)
    h.scale.setScalar(Math.max(0.01, on ** 0.6));
    h.position.copy(hoodAt).y += 2.2 * (1 - on);
    h.rotation.x = -0.3 * (1 - on);
    ears.visible = ears.children[0].visible = up > 0.01;
    ears.scale.set(1, Math.max(0.01, easeOutBack(up)), 1);
  }
  pose();

  function update(t, dt) {
    const goal = hood.on ? 1 : 0;
    if (hood.k === goal) return;
    hood.k = goal ? Math.min(1, hood.k + dt / HOOD_SECS) : Math.max(0, hood.k - dt / HOOD_SECS);
    hood.moved = true;
    pose();
  }

  const clickables = [
    {
      key: "koala",
      parts: [sleeper.body, sleeper.ears, sleeper.hood],
      toggle: () => (hood.on = !hood.on),
      can: () => kiosk.shutter.k < 0.5,
    },
  ];
  return {
    group,
    obstacles: [],
    clickables,
    hood,
    update,
    // (their shadows drawn again once the hood has come to rest)
    shadowsDirty() {
      const settled = hood.moved && (hood.k === 0 || hood.k === 1);
      if (settled) hood.moved = false;
      return settled;
    },
  };
}
