/*******************************************************************************
 * What the two windows look out on: a scene of its own for each, of flat
 * painted layers standing at their own depths (outlook.js draws each through
 * its window, from in the room, so that nearer layers slide across farther
 * ones as the view turns or the pointer moves). Beyond the bed, past the real
 * front garden (yard.js) and the lane: a hedgerow, a meadow, a near hill with
 * a path along its top where now and then someone goes by (out for a walk,
 * with a dog, on a bike, flying a kite, or at night with a lantern), a far
 * hill with a cottage, and the sky. Past the kitchen: a street running along
 * the house, its far pavement with street lamps and people walking by (with a
 * dog, a shopping bag, a balloon, an umbrella in the rain), the road with cars,
 * a black cab, a van, a police car, a red double-decker bus and, by day, a
 * yellow school bus driving past both ways, a row of houses, the sky, and a
 * branch of their tree close outside. By night the views go dark blue,
 * windows light up and go out at random, cars come by with their lights on,
 * lighting up the road ahead, and a police car's flashing lights wash red and
 * blue over the street and into the kitchen (`glow`, a light by the window).
 *
 * The scenery is painted a few texels to a dot; whatever moves, a texel at a
 * time, for finer detail.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { hash } from "../models/voxels.js";
import { pick, rnd } from "../stage.js";

const F = 2; // texels to a voxel
const FPS = 15; // how often a view with something moving in it is redrawn

// Colours dimmed for the night (the scenery's own night colours are picked by hand).
const DUSK = new THREE.Color("#1d2440");
const tmp = new THREE.Color();
const dimmed = new Map();
const dim = (c) => {
  if (!dimmed.has(c)) dimmed.set(c, `#${tmp.set(c).lerp(DUSK, 0.55).getHexString()}`);
  return dimmed.get(c);
};

// A painter for something `len` texels long standing on row `bottom` with its back end at column `x0`,
// facing `dir` (1 right, -1 left): `rect(i0, i1, j0, j1, c)` fills columns i0..i1 (0 at the back) and rows
// j0..j1 (0 on the ground).
function painter(g, x0, bottom, len, dir) {
  return (i0, i1, j0, j1, c) => {
    if (!c) return;
    g.fillStyle = c;
    g.fillRect(dir > 0 ? x0 + i0 : x0 + len - 1 - i1, bottom - j1, i1 - i0 + 1, j1 - j0 + 1);
  };
}
// A tyre centred between columns c and c + 1, 4 texels tall (6 for a bus), with its hubcap.
function wheel(rect, c, big, col) {
  const r = big ? 3 : 2;
  rect(c - r + 1, c + r, 1, 2 * r - 2, col.tyre);
  rect(c - r + 2, c + r - 1, 0, 2 * r - 1, col.tyre);
  rect(c, c + 1, r - 1, r, col.hub);
}

// The vehicles, each drawn facing right by `draw(rect, col, t)`. `col` has the body colour and its shade
// below, glass, the trim, the lamps and tyres, ready for day or night.
const VEHICLES = {
  car: {
    len: 22,
    speed: 26,
    lamp: 5, // the headlights' row
    draw(rect, col) {
      rect(3, 18, 0, 1, "rgba(0, 0, 0, 0.28)"); // its shadow on the road
      rect(1, 20, 2, 6, col.body);
      rect(1, 20, 2, 3, col.shade);
      rect(0, 0, 2, 3, col.trim);
      rect(21, 21, 2, 3, col.trim);
      rect(11, 11, 3, 6, col.shade); // the doors
      rect(1, 1, 5, 5, col.tail);
      rect(20, 20, 5, 5, col.lamp);
      rect(4, 17, 7, 7, col.body);
      rect(5, 16, 8, 8, col.body);
      rect(6, 15, 9, 9, col.body);
      rect(7, 13, 10, 10, col.body);
      rect(6, 10, 8, 8, col.glass);
      rect(12, 15, 8, 8, col.glass);
      rect(7, 10, 9, 9, col.glass);
      rect(12, 14, 9, 9, col.glass);
      wheel(rect, 5, false, col);
      wheel(rect, 16, false, col);
    },
  },
  cab: {
    len: 22,
    speed: 23,
    lamp: 5,
    draw(rect, col) {
      VEHICLES.car.draw(rect, col);
      rect(8, 12, 11, 11, col.body); // a taller roof, and the TAXI light on it
      rect(9, 11, 12, 12, col.sign);
    },
  },
  van: {
    len: 25,
    speed: 22,
    lamp: 5,
    draw(rect, col) {
      rect(3, 21, 0, 1, "rgba(0, 0, 0, 0.28)");
      rect(1, 18, 2, 13, col.body);
      rect(19, 23, 2, 7, col.body);
      rect(19, 21, 8, 11, col.body);
      rect(19, 20, 12, 12, col.body);
      rect(20, 21, 8, 10, col.glass); // the windscreen
      rect(22, 22, 8, 8, col.body);
      rect(1, 23, 2, 3, col.shade);
      rect(2, 17, 7, 8, col.stripe); // a stripe along the side
      rect(18, 18, 3, 11, col.shade); // the cab door
      rect(0, 0, 2, 3, col.trim);
      rect(24, 24, 2, 3, col.trim);
      rect(1, 1, 5, 6, col.tail);
      rect(23, 23, 5, 5, col.lamp);
      wheel(rect, 5, false, col);
      wheel(rect, 19, false, col);
    },
  },
  police: {
    len: 22,
    speed: 34,
    lamp: 5,
    draw(rect, col, t) {
      VEHICLES.car.draw(rect, col);
      for (let i = 1; i <= 19; i += 2) rect(i, i + 1, 4, 5, (i >> 1) % 2 ? col.check : col.stripe); // blue and yellow checks
      const flash = Math.floor(t * 5) % 2;
      rect(8, 12, 11, 11, "#d9dde3");
      rect(8, 9, 11, 11, flash ? "#ff2f3f" : "#5a1a22");
      rect(11, 12, 11, 11, flash ? "#2a4f8a" : "#3f8bff");
    },
  },
  bus: {
    len: 36,
    speed: 15,
    lamp: 4,
    draw(rect, col) {
      rect(4, 31, 0, 1, "rgba(0, 0, 0, 0.3)");
      rect(1, 34, 2, 24, col.body);
      rect(2, 33, 25, 25, col.body);
      rect(1, 34, 2, 4, col.shade);
      rect(1, 34, 15, 16, col.band); // the cream band between the decks
      for (const s of [3, 9, 15, 21]) rect(s, s + 4, 9, 13, col.glass);
      rect(27, 30, 3, 13, col.door);
      rect(32, 34, 8, 14, col.glass);
      for (const s of [3, 9, 15, 21, 27]) rect(s, s + 4, 18, 22, col.glass);
      rect(32, 34, 18, 22, col.glass);
      rect(30, 34, 23, 24, "#1d1d22"); // where it is going, in amber
      rect(31, 33, 24, 24, "#ffb030");
      rect(1, 1, 4, 6, col.tail);
      rect(34, 34, 4, 4, col.lamp);
      wheel(rect, 7, true, col);
      wheel(rect, 28, true, col);
    },
  },
  school: {
    len: 34,
    speed: 14,
    lamp: 5,
    draw(rect, col) {
      rect(4, 29, 0, 1, "rgba(0, 0, 0, 0.3)");
      rect(1, 27, 2, 18, col.body);
      rect(28, 33, 2, 10, col.body); // the bonnet
      rect(1, 33, 2, 3, col.shade);
      rect(1, 33, 7, 7, col.trim);
      rect(1, 27, 10, 10, col.trim);
      for (const s of [3, 8, 13, 18]) rect(s, s + 3, 12, 16, col.glass);
      rect(23, 26, 3, 16, col.door);
      rect(27, 27, 11, 16, col.glass); // the windscreen
      rect(1, 1, 5, 6, col.tail);
      rect(33, 33, 5, 5, col.lamp);
      wheel(rect, 6, true, col);
      wheel(rect, 27, true, col);
    },
  },
};
const CAR_COLORS = ["#d9534f", "#3f7fbf", "#f2c14e", "#5aa469", "#f4f1ea", "#2d2f36", "#9b6bb3", "#e98a3a", "#7fc4c9", "#c7c9cc"];
const VAN_COLORS = [
  ["#f4f4f2", "#3f7fbf"],
  ["#f6d35b", "#d9534f"],
  ["#5aa469", "#f4f1ea"],
];
const PAINT = { police: "#f4f6f8", cab: "#1f2126", bus: "#c8312c", school: "#f2b632" };

// People in the street, facing right: legs, body and head, hair, walking (`step` 0 or 1); with an
// umbrella in the rain, and maybe a dog on a lead, a shopping bag or a balloon (children).
const HAIR = ["#2b1d16", "#4a2f22", "#7a5434", "#d9b26a", "#9a9a9a", "#1b1b20"];
const SKIN = ["#f6d2b8", "#e8b896", "#c68a62", "#8d5a3c"];
const TOPS = ["#d9534f", "#3f7fbf", "#5aa469", "#f2c14e", "#9b6bb3", "#e98a3a", "#e4dfd6", "#2d2f36", "#f19fb5"];
const BOTTOMS = ["#2d3550", "#4b4f58", "#6b4f3a", "#1f2126", "#8a8f98"];
const UMBRELLAS = ["#d9534f", "#3f7fbf", "#f2c14e", "#2d2f36", "#5aa469"];

function drawPerson(rect, p, step, col) {
  const kid = p.with === "balloon";
  const [leg, body, head] = kid ? [3, 3, 4] : [4, 5, 5];
  const top = leg + body;
  if (step) rect(2, 3, 0, leg - 1, col(p.bottom));
  else {
    rect(0, 1, 0, leg - 1, col(p.bottom));
    rect(4, 5, 0, leg - 1, col(p.bottom));
  }
  rect(step ? 2 : 0, step ? 3 : 1, 0, 0, col("#2a2522")); // shoes
  if (!step) rect(4, 5, 0, 0, col("#2a2522"));
  rect(1, 4, leg, top - 1, col(p.top));
  rect(step ? 5 : 0, step ? 5 : 0, leg + 1, top - 2, col(p.top)); // an arm swinging
  rect(1, 4, top, top + head - 1, col(p.skin));
  rect(1, 4, top + head - 1, top + head - 1, col(p.hair));
  rect(1, 1, top + 1, top + head - 1, col(p.hair));
  if (p.long) rect(0, 1, top - 1, top + head - 2, col(p.hair));
  rect(4, 4, top + head - 3, top + head - 3, col("#2a2522")); // an eye
  const hand = [5, leg + 1];
  if (p.umbrella) {
    rect(5, 5, top, top + head + 2, col("#3a3a40"));
    rect(-2, 10, top + head + 3, top + head + 3, col(p.umbrella));
    rect(0, 8, top + head + 4, top + head + 4, col(p.umbrella));
    rect(2, 6, top + head + 5, top + head + 5, col(p.umbrella));
  }
  if (p.with === "dog") {
    // A little dog trotting ahead on its lead.
    const d = 10;
    rect(d, d + 4, 2, 4, col(p.dog));
    rect(d + 4, d + 6, 4, 6, col(p.dog));
    rect(d + 6, d + 6, 5, 5, col("#2a2522"));
    rect(d - 1, d - 1, 4, 5, col(p.dog));
    rect(d, d, 0, 1, col(p.dog));
    rect(d + (step ? 4 : 3), d + (step ? 4 : 3), 0, 1, col(p.dog));
    for (let i = 0; i < 4; i++) rect(hand[0] + 1 + i, hand[0] + 1 + i, hand[1] + 1 - (i >> 1), hand[1] + 1 - (i >> 1), col("#c9473f")); // the lead
  } else if (p.with === "bag") rect(-1, 0, leg - 1, leg + 2, col(p.bag));
  else if (kid && !p.umbrella) {
    for (let j = top; j < top + 9; j++) rect(5 + (j % 3 === 0 ? 1 : 0), 5 + (j % 3 === 0 ? 1 : 0), j, j, col("#e9e4da")); // the string
    rect(5, 7, top + 9, top + 12, col(p.balloon));
    rect(6, 6, top + 13, top + 13, col(p.balloon));
    rect(5, 5, top + 12, top + 12, "rgba(255, 255, 255, 0.6)");
  }
}
function newPerson(dir, x, rain, night) {
  const kid = !night && Math.random() < 0.18;
  return {
    dir,
    x,
    speed: kid ? rnd(9, 12) : rnd(6.5, 10),
    hair: pick(HAIR),
    skin: pick(SKIN),
    top: pick(TOPS),
    bottom: pick(BOTTOMS),
    long: Math.random() < 0.45,
    umbrella: rain ? pick(UMBRELLAS) : null,
    with: kid ? "balloon" : pick(["", "", "dog", "bag"]),
    dog: pick(["#c08a4a", "#f1ece3", "#3a2c22", "#8a6a4a"]),
    bag: pick(["#f19fb5", "#d7c3a0", "#f4f1ea"]),
    balloon: pick(["#ff5a5f", "#ffcc33", "#59c3ff", "#b07cff"]),
  };
}

// Far off on the hill path, smaller and simpler: walking, with a dog, on a bike, flying a kite, or with a
// lantern at night.
function drawWalker(rect, p, step, col, t) {
  if (p.kind === "bike") {
    for (const c of [0, 6]) {
      rect(c, c + 2, 1, 1, col("#2a2a30"));
      rect(c + 1, c + 1, 0, 2, col("#2a2a30"));
    }
    rect(1, 7, 2, 2, col(p.top));
    rect(3, 4, 3, 6, col(p.top));
    rect(4, 5, 7, 8, col(p.skin));
    rect(4, 5, 9, 9, col(p.hair));
    return;
  }
  if (step) rect(1, 1, 0, 2, col(p.bottom));
  else {
    rect(0, 0, 0, 2, col(p.bottom));
    rect(2, 2, 0, 2, col(p.bottom));
  }
  rect(0, 2, 3, 5, col(p.top));
  rect(0, 2, 6, 7, col(p.skin));
  rect(0, 2, 8, 8, col(p.hair));
  if (p.kind === "dog") {
    rect(5, 7, 1, 2, col(p.dog));
    rect(7, 8, 2, 3, col(p.dog));
    rect(5 + step, 5 + step, 0, 0, col(p.dog));
    rect(3, 4, 4, 4, col("#c9473f"));
  } else if (p.kind === "kite") {
    // The kite dancing up on its string.
    const up = Math.round(Math.sin(t * 1.7) * 1.5);
    for (let k = 1; k <= 7; k++) rect(2 + k, 2 + k, 5 + k + (k > 4 ? up : 0), 5 + k + (k > 4 ? up : 0), col("#e9e4da"));
    rect(10, 10, 12 + up, 15 + up, col(p.kite));
    rect(9, 11, 13 + up, 14 + up, col(p.kite));
    rect(8, 8, 11 + up, 11 + up, col("#ffd36b"));
  } else if (p.kind === "lantern") {
    rect(3, 3, 3, 4, "#ffe08a");
    rect(1, 5, 1, 6, "rgba(255, 214, 120, 0.25)"); // its glow
  }
}

// A canvas to paint a layer of a view on, a texel to each `unit` of the world, and a flat piece of the world
// showing it: standing up (facing `facing`, "+z" or "+x"), or lying flat on the ground ("up").
function layer(w, h, { transparent = true, repeat = null } = {}) {
  const make = () => Object.assign(document.createElement("canvas"), { width: w, height: h });
  const canvas = make();
  const base = make();
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent, depthWrite: !transparent, fog: true });
  return { w, h, canvas, g: canvas.getContext("2d"), base, bg: base.getContext("2d"), tex, mat, drawnAt: -Infinity, moving: false };
}
function plane(scene, mat, [w, h], [x, y, z], facing) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  if (facing === "+x") m.rotation.y = Math.PI / 2;
  if (facing === "up") m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// What the two windows look out on, each a scene of its own of flat painted layers at their own depths
// (outlook.js draws them through the glass, from in the room, so that the nearer layers move across the
// farther ones as the view turns or the pointer moves). `skies`: the two windows' sky textures (the back
// window's, the left one's); `cloudMat`: the clouds drifting over both; `glow`: a light inside by the left
// window.
//
// Beyond the bed, past the real front garden (yard.js) and the lane: a meadow, a hedgerow along it, a near
// hill with its path and two trees, a far hill with the cottage, the sky. Past the kitchen, a street running
// along the house: the pavement, the road with its two lanes of traffic, the far pavement with its people
// and street lamps, a row of houses, the sky; and a branch of their tree close outside.
export function makeViews(skies, cloudMat, glow) {
  let night = false;
  let rain = 0;
  const hills = new THREE.Scene();
  const street = new THREE.Scene();
  for (const s of [hills, street]) s.fog = new THREE.Fog(0xcfe6f2, 260, 3200); // far things hazier

  // The sky behind each, and the clouds in front of it (neither hazed).
  const skyMat = skies.map((tex) => new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  cloudMat.fog = false;
  plane(hills, skyMat[0], [5200, 2800], [131, 1100, -2700]);
  plane(hills, cloudMat, [5200, 2800], [131, 1100, -2650]);
  plane(street, skyMat[1], [5200, 2800], [-2600, 1100, 14], "+x");
  plane(street, cloudMat, [5200, 2800], [-2550, 1100, 14], "+x");

  /* ---------- beyond the bed ---------- */

  const FAR = layer(250, 40); // 12 units a texel
  const NEAR = layer(220, 34); // 8 units a texel
  const HEDGE = layer(512, 12); // 2 units a texel
  const MEADOW = layer(32, 32, { transparent: false, repeat: [21, 6] }); // 3 units a texel
  plane(hills, FAR.mat, [3000, 480], [131, 93, -1500]);
  plane(hills, NEAR.mat, [1760, 272], [131, 46, -820]);
  plane(hills, HEDGE.mat, [1024, 24], [131, 11, -272]);
  plane(hills, MEADOW.mat, [2000, 576], [131, -0.7, -262 - 288], "up");
  const farTop = (x) => Math.round(14 + 3 * Math.sin(x / 13 + 1) + 1.5 * Math.sin(x / 5.3));
  const nearTop = (x) => Math.round(10 + 2.2 * Math.sin(x / 11 + 4) + 0.8 * Math.sin(x / 4.1));
  function paintHills() {
    const [far, near, tree, trunk, path] = night
      ? ["#2c3760", "#212a48", "#19203a", "#19203a", "#283153"]
      : ["#b9d8cf", "#7db56f", "#4f9447", "#7a5a3a", "#d8c99f"];
    const put = (L, x, y, c) => {
      L.bg.fillStyle = c;
      L.bg.fillRect(x, y, 1, 1);
    };
    for (const L of [FAR, NEAR, HEDGE]) L.bg.clearRect(0, 0, L.w, L.h);
    for (let x = 0; x < FAR.w; x++) for (let y = farTop(x); y < FAR.h; y++) put(FAR, x, y, far);
    // The cottage on the far hill, a red roof and a chimney, its window lit at night.
    const cx = 128;
    const base = Math.min(...[0, 1, 2, 3, 4].map((k) => farTop(cx + k))) + 1;
    for (let x = cx; x <= cx + 4; x++)
      for (let y = base - 3; y <= base; y++)
        put(FAR, x, y, x === cx + 2 && y === base - 1 ? (night ? (lit[6] ? "#ffd36b" : "#273052") : "#6d8fb3") : night ? "#3b4670" : "#f2e8d5");
    for (let k = 0; k <= 3; k++) for (let x = cx - 1 + k; x <= cx + 5 - k; x++) put(FAR, x, base - 4 - k, night ? "#323c63" : "#c4553f");
    for (let y = base - 8; y <= base - 6; y++) put(FAR, cx + 3, y, night ? "#323c63" : "#8f4b3a");
    // The near hill, the path along its top, two round trees on it.
    for (let x = 0; x < NEAR.w; x++) {
      for (let y = nearTop(x) + 1; y < NEAR.h; y++) put(NEAR, x, y, hash(x, y, 71) < 0.08 ? tree : near);
      put(NEAR, x, nearTop(x), path);
    }
    for (const tx of [96, 104, 140]) {
      const top = nearTop(tx);
      for (let y = top - 2; y < top; y++) put(NEAR, tx, y, trunk);
      for (let x = -2; x <= 2; x++) for (let y = -2; y <= 1; y++) if (x * x + (y + 0.5) ** 2 <= 5) put(NEAR, tx + x, top - 4 + y, tree);
    }
    // The hedgerow along the far side of the lane: bushy, a tree standing up out of it here and there.
    const [hedge, hedgeDark, hedgeLight] = night ? ["#1d2a3e", "#172234", "#24324a"] : ["#5a9a45", "#447e36", "#6fae55"];
    for (let x = 0; x < HEDGE.w; x++) {
      const top = Math.round(4 + 1.2 * Math.sin(x / 6) + 0.8 * Math.sin(x / 2.3) - (hash(Math.floor(x / 40), 1, 72) < 0.4 && x % 40 < 9 ? 3 : 0));
      for (let y = Math.max(0, top); y < HEDGE.h; y++) {
        const q = hash(x, y, 73);
        put(HEDGE, x, y, y === top ? hedgeLight : q < 0.3 ? hedgeDark : hedge);
      }
    }
    // The meadow: grass, a few flowers.
    const g = MEADOW.bg;
    for (let y = 0; y < MEADOW.h; y++)
      for (let x = 0; x < MEADOW.w; x++) {
        const q = hash(x, y, 74);
        g.fillStyle = night ? (q < 0.3 ? "#1c2a3c" : "#203046") : q < 0.25 ? "#a3cc6e" : q > 0.97 ? "#f6f1df" : q > 0.95 ? "#f2d24a" : "#b0d47c";
        g.fillRect(x, y, 1, 1);
      }
    for (const L of [FAR, NEAR, HEDGE, MEADOW]) L.drawnAt = -Infinity;
  }

  /* ---------- past the kitchen ---------- */

  // Seen from the left window (at x = X0), the street runs along z: 2.5 units a texel, the scenery painted
  // two texels to a dot (F), whoever moves a texel at a time.
  const UNIT = 2.5;
  const LONG = 240; // texels along the street
  const FACADE = layer(LONG, 44);
  const WALK = layer(LONG, 40);
  const LANES = [layer(LONG, 26), layer(LONG, 26)]; // the far lane (going left as seen), the near one
  const PAVE = layer(16, 16, { transparent: false, repeat: [1, 15] }); // 2.5 units a texel
  const ROAD = layer(34, 32, { transparent: false, repeat: [1, 7.5] });
  const BRANCH = layer(36, 24);
  const along = 14; // the middle of the window, along z
  const stand = (L, x, bottom = 0) => plane(street, L.mat, [L.w * UNIT, L.h * UNIT], [x, bottom + (L.h * UNIT) / 2, along], "+x");
  stand(FACADE, -300);
  stand(WALK, -276);
  stand(LANES[0], -238);
  stand(LANES[1], -202);
  plane(street, PAVE.mat, [40, LONG * UNIT], [-282, 0, along], "up"); // the far pavement
  plane(street, ROAD.mat, [84, LONG * UNIT], [-220, -0.1, along], "up");
  plane(street, PAVE.mat, [24, LONG * UNIT], [-166, 0, along], "up"); // the near one
  stand(BRANCH, -170, 30).position.z = along + 30;
  const wash = plane(
    street,
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false }),
    [400, 400],
    [-160, 60, along],
    "+x"
  ); // a police car's lights washing over it all
  wash.renderOrder = 1;

  const HOUSES = [
    { w: 13, wall: ["#ecdcc3", "#3a4468"], roof: ["#b9573f", "#2e3758"] },
    { w: 13, wall: ["#d8b79c", "#36405f"], roof: ["#6e7789", "#283150"] },
    { w: 14, wall: ["#e3e6ea", "#3a4468"], roof: ["#a45d42", "#2e3758"] },
  ];
  const LAMPS = [30, 90, 150, 210]; // texels along the far pavement
  function paintStreet() {
    const n = night ? 1 : 0;
    const dot = (L, x, y, c) => {
      L.bg.fillStyle = c;
      L.bg.fillRect(x * F, y * F, F, F);
    };
    for (const L of [FACADE, WALK, BRANCH]) L.bg.clearRect(0, 0, L.w, L.h);
    // The row of houses, wall to wall, with chimneys and windows (lit or not at night) and front doors.
    const H = FACADE.h / F;
    let x0 = 0;
    for (let k = 0; x0 < FACADE.w / F; k++) {
      const { w, wall, roof } = HOUSES[k % 3];
      const x1 = x0 + w - 1;
      const mid = (x0 + x1) / 2;
      const eave = H - 12 + (k % 2);
      for (let x = x0; x <= x1; x++) {
        for (let y = eave; y < H; y++) dot(FACADE, x, y, wall[n]);
        for (let y = eave - 1 - Math.floor(w / 2 - Math.abs(x - mid)); y < eave; y++) dot(FACADE, x, y, roof[n]);
      }
      for (let y = eave - 9; y <= eave - 4; y++) dot(FACADE, x0 + 3, y, night ? "#262e4c" : "#9c5a45");
      for (const [wx, row] of [
        [x0 + 2, eave + 2],
        [x1 - 3, eave + 2],
        [x0 + 2, eave + 7],
      ]) {
        const on = night && lit[(k * 3 + row) % 6];
        for (let y = row; y <= row + 2; y++) for (const x of [wx, wx + 1]) dot(FACADE, x, y, on ? "#ffcf66" : night ? "#273052" : "#7fa2c6");
      }
      for (let y = H - 5; y < H; y++)
        for (const x of [x1 - 3, x1 - 2]) dot(FACADE, x, y, night ? "#2a2238" : ["#7a4b3a", "#3f6fa0", "#5a8a52"][k % 3]);
      x0 = x1 + 1;
    }
    // The street lamps on the far pavement, glowing at night.
    const pole = night ? "#1d2238" : "#3d4148";
    const Hw = WALK.h / F;
    for (const lx of LAMPS.map((t) => t / F)) {
      for (let y = Hw - 16; y < Hw; y++) dot(WALK, lx, y, pole);
      dot(WALK, lx + 1, Hw - 16, pole);
      for (const x of [lx + 1, lx + 2]) dot(WALK, x, Hw - 15, night ? "#ffe39a" : "#d9dde2");
      if (night)
        for (const [x, y] of [
          [lx + 1, Hw - 14],
          [lx + 2, Hw - 14],
          [lx, Hw - 14],
          [lx + 3, Hw - 14],
          [lx + 1, Hw - 13],
          [lx + 2, Hw - 13],
        ])
          dot(WALK, x, y, "rgba(255, 220, 140, 0.35)");
    }
    // Paving slabs, and the road: tarmac, a white line down the middle in dashes, a kerb on either side.
    const p = PAVE.bg;
    for (let y = 0; y < PAVE.h; y++)
      for (let x = 0; x < PAVE.w; x++) {
        const q = hash(x, y, 75);
        p.fillStyle =
          x % 8 === 0 || y % 8 === 0 ? (night ? "#3b4058" : "#b9b3a8") : night ? (q < 0.2 ? "#40465f" : "#454b66") : q < 0.2 ? "#cdc7bc" : "#d4cec3";
        p.fillRect(x, y, 1, 1);
      }
    const r = ROAD.bg;
    for (let y = 0; y < ROAD.h; y++)
      for (let x = 0; x < ROAD.w; x++) {
        const q = hash(x, y, 76);
        const kerb = x === 0 || x === ROAD.w - 1;
        const line = Math.abs(x - ROAD.w / 2 + 0.5) < 1 && y % 16 < 8;
        r.fillStyle = kerb
          ? night
            ? "#3b4058"
            : "#b9b3a8"
          : line
            ? night
              ? "#6a6f85"
              : "#e8e4da"
            : night
              ? q < 0.3
                ? "#272b3c"
                : "#2a2e40"
              : q < 0.3
                ? "#686b71"
                : "#6e7177";
        r.fillRect(x, y, 1, 1);
      }
    // A branch of their tree reaching across close outside the window.
    const [leaf, leafDark, branch] = night ? ["#202a45", "#1a2239", "#1a2239"] : ["#6aa84f", "#4f8d3e", "#7a5a3a"];
    const B = BRANCH.bg;
    const leafAt = (x, y, c) => {
      B.fillStyle = c;
      B.fillRect(x, y, 1, 1);
    };
    for (let x = 0; x < 30; x++) leafAt(x, Math.round(4 + x * 0.3), branch);
    for (const [cx, cy, rr] of [
      [4, 4, 4.5],
      [12, 7, 3.8],
      [20, 9, 3.2],
      [27, 11, 2.6],
      [8, 1, 3.6],
    ])
      for (let x = Math.floor(cx - rr); x <= cx + rr; x++)
        for (let y = Math.floor(cy - rr); y <= cy + rr; y++)
          if (x >= 0 && y >= 0 && (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) leafAt(x, y, hash(x, y, 41) < 0.35 ? leafDark : leaf);
    for (const L of [FACADE, WALK, BRANCH, PAVE, ROAD]) L.drawnAt = -Infinity;
  }

  // By night some windows out there are lit and some dark, and now and then someone switches a light on or
  // off: the houses' six patterns, then the cottage's.
  const lit = [0, 1, 2, 3, 4, 5, 6].map(() => Math.random() < 0.5);
  let blinkAt = 8;

  /* ---------- what moves ---------- */

  const traffic = [null, null]; // a vehicle in each lane: 0 the far one (going left), 1 the near one (going right)
  const nextIn = [rnd(2, 8), rnd(6, 14)];
  const people = [];
  let personAt = rnd(3, 10);
  const walkers = [];
  let walkerAt = rnd(6, 16);

  // Its colours, ready for day or night.
  function colours(v) {
    const lamps = night;
    const body = v.color;
    const c = {
      body,
      shade: `#${tmp.set(body).multiplyScalar(0.78).getHexString()}`,
      glass: night ? (v.kind === "bus" || v.kind === "school" ? "#ffe3a0" : "#1c2238") : "#a9cbe6",
      trim: "#2d2f36",
      tail: lamps ? "#ff4040" : "#c23434",
      lamp: lamps ? "#fff6c8" : "#f2efe4",
      tyre: "#1d1e22",
      hub: "#b9bcc2",
      band: "#f3ead6",
      door: night ? "#e9c98a" : "#5d6f86",
      stripe: v.stripe ?? "#2f5fb3",
      check: "#f4d03f",
      sign: night ? "#ffd75e" : "#e8b84a",
    };
    if (night) for (const k of ["body", "shade", "trim", "band", "stripe", "check", "hub"]) c[k] = dim(c[k]);
    return c;
  }
  function newVehicle(lane) {
    const kind = night
      ? pick(["car", "car", "car", "cab", "cab", "van", "police", "police", "bus"])
      : pick(["car", "car", "car", "car", "cab", "van", "van", "police", "bus", "bus", "school"]);
    const { len, speed } = VEHICLES[kind];
    const dir = lane ? 1 : -1;
    const [color, stripe] = kind === "van" ? pick(VAN_COLORS) : [PAINT[kind] ?? pick(CAR_COLORS), undefined];
    const v = { kind, lane, dir, len, color, stripe, t: 0, speed: speed * rnd(0.85, 1.15), x: dir > 0 ? -len : LONG };
    v.col = colours(v);
    return v;
  }

  // The people on the far pavement, and the vehicles in their lanes (with, by night, their lights).
  let flash = null; // which of a police car's lights is on, if one is going by
  function drawWalk() {
    const col = (c) => (night ? dim(c) : c);
    for (const p of people) drawPerson(painter(WALK.g, Math.round(p.x), WALK.h - 1, 6, p.dir), p, Math.floor(p.walked / 3) % 2, col);
  }
  function drawLane(lane) {
    const L = LANES[lane];
    const v = traffic[lane];
    if (!v) return;
    const rect = painter(L.g, Math.round(v.x), L.h - 1, v.len, v.dir);
    VEHICLES[v.kind].draw(rect, v.col, v.t);
    if (night) {
      // The headlights' beams reaching out ahead, and a red glow about the tail lights.
      const lamp = VEHICLES[v.kind].lamp;
      for (let k = 1; k <= 20; k++) {
        const a = 1 - k / 21;
        const i = v.len + k - 1;
        rect(i, i, lamp - (k >> 2), lamp + (k >> 3), `rgba(255, 240, 180, ${(0.3 * a).toFixed(3)})`);
        rect(i, i, 0, 1, `rgba(255, 236, 170, ${(0.22 * a).toFixed(3)})`);
      }
      rect(-1, -1, lamp - 1, lamp + 1, "rgba(255, 60, 60, 0.35)");
      rect(-2, -2, lamp, lamp, "rgba(255, 60, 60, 0.2)");
    }
    if (v.kind === "police" && night) {
      const glowAt = flash ? 8.5 : 11.5;
      const rgb = flash ? "255, 40, 60" : "60, 120, 255";
      for (const [r, a] of [
        [5, 0.12],
        [3, 0.2],
        [1.5, 0.3],
      ])
        rect(Math.round(glowAt - r), Math.round(glowAt + r), Math.round(11 - r * 0.6), Math.round(11 + r * 0.6), `rgba(${rgb}, ${a})`);
    }
  }
  function drawNear() {
    const col = (c) => (night ? dim(c) : c);
    for (const p of walkers)
      drawWalker(painter(NEAR.g, Math.round(p.x), nearTop(Math.round(p.x)) - 1, 3, p.dir), p, Math.floor(p.walked / 2) % 2, col, now.t);
  }
  const now = { t: 0 };

  // The light from the street inside by the window: red and blue from a police car by night, and warm as
  // a car's headlights sweep past; nothing by day.
  function lightIn() {
    let k = 0;
    let color = 0xffe0a8;
    if (night)
      for (const v of traffic) {
        if (!v) continue;
        const near = Math.max(0, 1 - Math.abs(v.x + v.len / 2 - LONG / 2) / (LONG / 3)); // most as it passes the window
        if (v.kind === "police") {
          k = Math.max(k, 0.6 + 0.6 * near);
          color = Math.floor(v.t * 5) % 2 ? 0xff3040 : 0x3a70ff;
          break;
        }
        k = Math.max(k, 0.35 * near * near);
      }
    glow.intensity = k;
    glow.color.setHex(color);
  }

  // Each layer with anything moving on it put together again a few times a second (and once more after it
  // has gone), the rest only when repainted.
  function refresh(L, t, moving, draw) {
    if (!moving && !L.moving && L.drawnAt > -Infinity) return;
    if (moving && t - L.drawnAt < 1 / FPS) return;
    L.moving = moving;
    L.drawnAt = t;
    L.g.clearRect(0, 0, L.w, L.h);
    L.g.drawImage(L.base, 0, 0);
    draw?.();
    L.tex.needsUpdate = true;
  }

  function update(t, dt) {
    now.t = t;
    if (t > blinkAt) {
      blinkAt = t + rnd(8, 30);
      if (night) {
        const k = Math.floor(Math.random() * lit.length);
        lit[k] = !lit[k];
        (k < 6 ? paintStreet : paintHills)();
      }
    }
    // Traffic: each lane has one at a time, the next along a little while after.
    traffic.forEach((v, lane) => {
      if (!v) {
        if ((nextIn[lane] -= dt) <= 0) traffic[lane] = newVehicle(lane);
        return;
      }
      v.t += dt;
      v.x += v.dir * v.speed * dt;
      if (v.x > LONG || v.x < -v.len) {
        traffic[lane] = null;
        nextIn[lane] = night ? rnd(4, 12) : rnd(5, 14);
      }
    });
    // People on the far pavement and up on the hill path.
    if ((personAt -= dt) <= 0) {
      personAt = night ? rnd(10, 24) : rnd(4, 11);
      if (people.length < 4) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        people.push({ ...newPerson(dir, dir > 0 ? -16 : LONG + 10, rain > 0.3, night), walked: 0 });
      }
    }
    if ((walkerAt -= dt) <= 0) {
      walkerAt = night ? rnd(25, 50) : rnd(10, 26);
      if (walkers.length < 2) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const kind = night ? "lantern" : rain > 0.3 ? "walk" : pick(["walk", "walk", "dog", "bike", "kite"]);
        const p = { dir, kind, speed: kind === "bike" ? rnd(10, 14) : kind === "kite" ? rnd(2.5, 3.5) : rnd(3.5, 5), walked: 0 };
        Object.assign(p, {
          top: pick(TOPS),
          bottom: pick(BOTTOMS),
          hair: pick(HAIR),
          skin: pick(SKIN),
          dog: pick(["#c08a4a", "#f1ece3", "#3a2c22"]),
        });
        p.kite = pick(["#ff5a5f", "#59c3ff", "#ffcc33"]);
        p.x = dir > 0 ? 80 : 160; // (over the stretch of the path seen from the window)
        p.end = dir > 0 ? 170 : 70;
        walkers.push(p);
      }
    }
    for (let k = people.length - 1; k >= 0; k--) {
      const p = people[k];
      p.x += p.dir * p.speed * dt;
      p.walked += p.speed * dt;
      if (p.x > LONG + 12 || p.x < -24) people.splice(k, 1);
    }
    for (let k = walkers.length - 1; k >= 0; k--) {
      const p = walkers[k];
      p.x += (p.dir * p.speed * dt) / 4; // (far off: a texel here is a big step)
      p.walked += p.speed * dt;
      if ((p.end - p.x) * p.dir < 0) walkers.splice(k, 1);
    }
    flash = traffic.some((v) => v?.kind === "police") ? Math.floor(traffic.find((v) => v?.kind === "police").t * 5) % 2 : null;
    lightIn();
    wash.material.opacity = flash !== null && night ? 0.1 : 0;
    if (flash !== null) wash.material.color.setHex(flash ? 0xff3246 : 0x3c6eff);

    refresh(WALK, t, people.length > 0, drawWalk);
    LANES.forEach((L, lane) => refresh(L, t, !!traffic[lane], () => drawLane(lane)));
    refresh(NEAR, t, walkers.length > 0, drawNear);
    for (const L of [FAR, HEDGE, MEADOW, FACADE, PAVE, ROAD, BRANCH]) refresh(L, t, false);
  }

  return {
    scenes: [hills, street], // the back window's, the left one's
    // Dark blue by night, with the windows lit at random, the haze darker.
    dress(isNight) {
      if (isNight !== night) lit.forEach((_, k) => (lit[k] = Math.random() < 0.5)); // a new evening, other lights on
      night = isNight;
      for (const v of traffic) if (v) v.col = colours(v);
      for (const s of [hills, street]) s.fog.color.set(night ? 0x1d2546 : 0xcfe6f2);
      paintHills();
      paintStreet();
    },
    // How hard it is raining (0 to 1): people out walking take umbrellas, and the distance greys over.
    rain(k) {
      rain = k;
      for (const s of [hills, street]) {
        s.fog.near = 260 - 200 * k;
        s.fog.far = 3200 - 2200 * k;
      }
    },
    update,
  };
}
