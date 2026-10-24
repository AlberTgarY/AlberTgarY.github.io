/*******************************************************************************
 * What the girl and the boy pick up in the playground, and how they hold it:
 * the red book, the laptop, the game controllers, an ice cream or a juice box
 * from the fridge, a watering can, the bag of pet food, a treat for the dog,
 * the garden basket, what was just picked (in a hand, or in both arms), a
 * packet of seeds, a log for the fire, the cat's mess on
 * its way to the bin, an umbrella (rolled up, or open over the head), a roast
 * chicken or a lasagna for the oven (the oven and
 * the table show the same dishes), and the dog's ball, which flies, rolls and
 * is carried in her mouth; and how they hold their arms for the computer, the
 * stove, the fire and the headphones.
 *
 * Holds are arm poses for the shared skeleton (models/chibi.js): for the right
 * arm and then the left, [shoulder x, elbow x, shoulder y, shoulder z, elbow z],
 * or null to leave an arm be. Forward is negative x; positive shoulder y swings
 * the right arm in (negative the left); outward is negative z for the right arm
 * and positive for the left.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, cells, hash } from "../models/voxels.js";
import { PROP_COLORS, foodBag } from "../models/girl-props.js";
import { VEG, KINDS, VEG_COLORS, basketPart, fillBasket, extent, empty } from "./veg.js";

const COLORS = {
  ...PROP_COLORS,
  ...VEG_COLORS,
  page: "#fbf6ea",
  pageLine: "#d9d0bd",
  cover: "#c94f4f",
  coverDark: "#a63c3c",
  laptop: "#b9bec8",
  laptopDark: "#8e94a0",
  screen: "#2b3a55",
  sticker: "#f28aa8",
  pad: "#4a4f5c",
  padRed: "#e0605a",
  padBlue: "#5aa8e0",
  cone: "#e3b06b",
  coneDark: "#c48d4a",
  scoop: "#f7a8c4",
  scoopTop: "#fbd1e0",
  juiceBox: "#7cc46a",
  juiceLabel: "#f6cf4a",
  canBody: "#9cc9ec",
  canDark: "#6fa6d6",
  ball: "#d6e04a",
  ballSeam: "#f7f7ea",
  log: "#8a5a34",
  logEnd: "#e0bd8f",
  platter: "#f7f3ea",
  platterRim: "#c9d6e8",
  roast: "#c98a3d",
  roastDark: "#a5682a",
  herb: "#5f9e45",
  bakeDish: "#d9643f",
  bakeDishRim: "#ef8a5e",
  cheese: "#f2c14e",
  cheeseBrown: "#d08a33",
  sauce: "#c8412f",
  umbrellaPink: "#f28aa8",
  umbrellaNavy: "#3f5a8a",
  umbrellaNavyDark: "#2f4670",
  shaft: "#8f6440",
};
// Each one's umbrella: the two colours of its panels.
const UMBRELLAS = { girl: ["umbrellaPink", "white"], boy: ["umbrellaNavy", "umbrellaNavyDark"] };

export const HOLDS = {
  carry: [[-0.25, -1.15, 0.15, 0, 0], null], // the right hand holding something in front, the left swinging
  reach: [[-2.6, -0.3, 0.1, 0, 0], null], // up to a shelf
  pick: [[-0.95, -0.25, 0.15, 0, 0], null], // down to a table or the floor
  treat: [[-1.05, -0.15, 0.25, 0, 0], null], // a treat held out low to the dog
  read: [
    [-0.72, -1.0, 0.2, 0, 0],
    [-0.72, -1.0, -0.2, 0, 0],
  ],
  water: [null, [-1.15, -0.15, -0.15, 0, 0]],
  throwBack: [[2.5, -0.5, 0, -0.25, 0], null],
  throwOut: [[-1.75, -0.15, 0.1, 0, 0], null],
  chin: [[-1.4, -2.05, 0.55, 0, 0], null], // hmm...
  phones: [
    [-2.55, -1.75, 0, -0.55, 0],
    [-2.55, -1.75, 0, 0.55, 0],
  ], // both hands up at the ears, putting the headphones on or taking them off
  slump: [
    [0.15, -0.1, 0, -0.12, 0],
    [0.15, -0.1, 0, 0.12, 0],
  ], // arms hanging, after a lost game
  warm: [
    [-1.35, -0.35, 0.3, 0, 0],
    [-1.35, -0.35, -0.3, 0, 0],
  ], // both hands held out to the fire
  twirl: [
    [-0.2, -0.2, 0, -1.15, 0],
    [-0.2, -0.2, 0, 1.15, 0],
  ], // arms out, spinning round in new clothes
  tray: [
    [-0.75, -0.95, 0.3, 0, 0],
    [-0.75, -0.95, -0.3, 0, 0],
  ], // a dish carried in both hands
  push: [
    [-0.6, -0.35, 0.25, 0, 0],
    [-0.6, -0.35, -0.25, 0, 0],
  ], // hands on the knees, to push up off a seat
  umbrella: [[-0.95, -1.35, 0, -0.5, 0], null], // an open umbrella held up beside the head
  // In the garden: the basket hanging from the left hand; reaching up to a tomato; a piece dropped into
  // the basket set down at the right hand; both hands on carrot tops or round a head; held up to admire; a
  // strawberry to the mouth; the seed packet in the left hand.
  basket: [null, [-0.15, -0.35, -0.05, 0.1, 0]],
  reachUp: [[-1.75, -0.35, 0.15, 0, 0], null],
  drop: [[-0.45, -0.3, -0.05, -0.45, 0], null],
  grip: [
    [-1.0, -0.3, 0.3, 0, 0],
    [-1.0, -0.3, -0.3, 0, 0],
  ],
  admire: [[-2.2, -0.9, 0.35, 0, 0], null],
  taste: [[-1.3, -1.9, 0.5, 0, 0], null],
  packet: [null, [-0.7, -0.9, -0.2, 0, 0]],
};
const PACKET = HOLDS.packet[1];

// Holds that move: typing, the mouse and the keys, mashing buttons, stirring, clapping, cheering, licking
// an ice cream.
export const MOVES = {
  type: (t) => [
    [-0.5, -0.8 + 0.08 * Math.sin(t * 17), 0.22, 0, 0],
    [-0.5, -0.8 + 0.08 * Math.sin(t * 17 + 2), -0.22, 0, 0],
  ],
  mouse: (t) => [
    [-0.62 + 0.05 * Math.sin(t * 2.3), -0.72, 0.02 + 0.1 * Math.sin(t * 3.1) * Math.sin(t * 0.9), 0, 0],
    [-0.6, -0.78 + 0.07 * Math.max(0, Math.sin(t * 13)), -0.28, 0, 0],
  ],
  stir: (t) => [
    [-0.95 + 0.12 * Math.sin(t * 5), -0.55, 0.25 + 0.15 * Math.cos(t * 5), 0, 0],
    [-0.75, -0.55, -0.2, 0, 0],
  ],
  pad: (t) => [
    [-0.55, -1.12 + 0.06 * Math.sin(t * 13), 0.38, 0, 0],
    [-0.55, -1.12 + 0.06 * Math.sin(t * 11 + 1), -0.38, 0, 0],
  ],
  clap: (t) => [
    [-1.1, -0.5, 0.42 + 0.14 * Math.sin(t * 16), 0, 0],
    [-1.1, -0.5, -0.42 - 0.14 * Math.sin(t * 16), 0, 0],
  ],
  cheer: (t) => [
    [-2.85, -0.2, 0, -0.35 - 0.12 * Math.sin(t * 12), 0],
    [-2.85, -0.2, 0, 0.35 + 0.12 * Math.sin(t * 12), 0],
  ],
  stretch: (t, e) => {
    const up = Math.min(1, e / 0.8) * Math.min(1, Math.max(0, (2.6 - e) / 0.6));
    return [
      [-2.9 * up, -0.15, 0, -0.3 * up, 0],
      [-2.9 * up, -0.15, 0, 0.3 * up, 0],
    ];
  },
  lick: (t) => [[-1.25 - 0.3 * Math.max(0, Math.sin(t * 2.4)), -1.35, 0.5, 0, 0], null],
  // Turning a tap or a sprinkler's head: the hand out in front, the wrist working.
  twist: (t) => [[-1.2, -0.35, 0.2, 0, 0.35 * Math.sin(t * 6)], null],
  // Caught by the sprinkler: both hands up over the head, flapping.
  flail: (t) => [
    [-2.5 + 0.35 * Math.sin(t * 15), -1.1, 0, -0.35, 0],
    [-2.5 + 0.35 * Math.sin(t * 15 + 1.7), -1.1, 0, 0.35, 0],
  ],
  // Tugging at carrot tops, both hands pulling back.
  tug: (t, e) => {
    const k = 0.25 * Math.max(0, Math.sin(e * 11));
    return [
      [-0.95 + k, -0.25, 0.3, 0, 0],
      [-0.95 + k, -0.25, -0.3, 0, 0],
    ];
  },
  // Sowing: digging a hole, sprinkling seeds from the fingers and patting the soil down, the packet in the
  // left hand; and wiping the brow.
  dig: (t) => [[-0.95 + 0.18 * Math.sin(t * 10), -0.2 - 0.1 * Math.sin(t * 10), 0.15, 0, 0], PACKET],
  sprinkle: (t) => [[-1.05, -0.4, 0.15, 0, 0.35 * Math.sin(t * 16)], PACKET],
  pat: (t) => [
    [-0.95 + 0.15 * Math.abs(Math.sin(t * 9)), -0.15, 0.25, 0, 0],
    [-0.95 + 0.15 * Math.abs(Math.sin(t * 9 + 1.5)), -0.15, -0.25, 0, 0],
  ],
  wipe: (t) => [[-2.5, -1.8, 0.55 + 0.25 * Math.sin(t * 9), 0, 0], null],
  // Shaking the water off the hands, or a rolled-up umbrella.
  shake: (t) => [
    [-0.85, -1.25 + 0.45 * Math.sin(t * 24), 0.25, 0, 0],
    [-0.85, -1.25 + 0.45 * Math.sin(t * 24 + 0.8), -0.25, 0, 0],
  ],
};

const hidden = (o) => {
  o.visible = false;
  return o;
};

// Props for one person (`who`: "girl" or "boy"): built on their rig and shown or hidden by their
// activities. Those carried in a hand ride on its forearm; the ones used sitting down sit in front of the body.
export function propsFor(rig, who) {
  const right = rig.hands[0];
  const body = rig.pose;
  const at = (parent, object, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => {
    object.position.set(x, y, z);
    object.rotation.set(rx, ry, rz);
    parent.add(hidden(object));
    return object;
  };

  // The red book: shut in the hand, or open in both hands, its pages turning.
  const shut = part();
  box(shut, [-2, 2], [0, 5], [0, 1], (x, y, z) => (x === 2 ? "page" : z === 0 ? "coverDark" : "cover"));
  const bookShut = at(right, shut.mesh(COLORS), [0, -4, 1.5], [0, Math.PI / 2, 0]);
  const open = new THREE.Group();
  [-1, 1].forEach((side) => {
    const p = part();
    box(p, side < 0 ? [-5, -1] : [0, 4], [0, 6], [0, 0], (x, y) => (y % 2 === 0 && Math.abs(x) > 1 && Math.abs(x) < 4 ? "pageLine" : "page"));
    box(p, side < 0 ? [-5, -1] : [0, 4], [0, 6], [-1, -1], "cover");
    const m = p.mesh(COLORS);
    m.rotation.y = side * 0.25; // open in a shallow V
    open.add(m);
  });
  const leaf = pivotGroup(open, [0, 0, 0.5]); // a page turning
  const leafPart = part();
  box(leafPart, [0, 4], [0, 6], [1, 1], "page");
  leaf.inner.add(leafPart.mesh(COLORS));
  at(body, open, [-0.5, 12, 7], [-0.65, 0, 0]);

  // The laptop: carried shut, or open on the lap with the screen towards them and a heart on its lid.
  const laptop = at(body, buildLaptop(), [0, 11.2, 5.5]);
  const laptopShut = at(right, buildLaptop(), [0, -3, 3], [Math.PI / 2, 0, 0]);

  // A game controller between the hands.
  const pad = at(
    body,
    cells(
      [
        ...[-3, -2, -1, 0, 1, 2, 3].map((x) => [x, 0, 0, "pad"]),
        [-3, 0, 1, "pad"],
        [3, 0, 1, "pad"],
        [-2, 1, 0, "pad"],
        [2, 1, 0, "padRed"],
        [1, 1, 0, "padBlue"],
      ],
      COLORS
    ),
    [0, 10.5, 7.5],
    [-0.5, 0, 0]
  );

  // Treats from the fridge: an ice cream cone, or a juice box with a straw.
  const coneP = part();
  for (let y = 0; y <= 4; y++) ellipsoid(coneP, [0, y, 0], [0.4 + y * 0.28, 0.5, 0.4 + y * 0.28], (x, yy) => ((x + y) % 2 ? "cone" : "coneDark"));
  ellipsoid(coneP, [0, 6, 0], [2, 1.8, 2], (x, y) => (y >= 7 ? "scoopTop" : "scoop"));
  const iceCream = at(right, coneP.mesh(COLORS), [0, -1, 1.5], [-0.3, 0, 0]);
  const juiceP = part();
  box(juiceP, [-1, 1], [0, 3], [-1, 0], (x, y) => (y === 2 ? "juiceLabel" : "juiceBox"));
  juiceP.add(1, 4, 0, "straw");
  juiceP.add(1, 5, 0, "straw");
  const juice = at(right, juiceP.mesh(COLORS), [0, -1, 1.5]);

  // A small watering can in the left hand, and the drops falling from its rose (placed by the activity).
  const canP = part();
  box(canP, [-2, 2], [-3, 0], [-1, 1], (x, y) => (y === -3 ? "canDark" : "canBody"));
  [
    [0, 1],
    [1, 1],
    [-1, 1],
  ].forEach(([x, y]) => canP.add(x, y, 0, "canBody"));
  [
    [0, -1, 2],
    [0, -1, 3],
    [0, 0, 4],
    [0, 0, 5],
  ].forEach(([x, y, z]) => canP.add(x, y, z, "canDark"));
  const can = at(rig.hands[1], canP.mesh(COLORS), [0, -1, 0]);
  const spout = new THREE.Object3D();
  spout.position.set(0, 0, 5.5);
  can.add(spout);

  // The bag of pet food carried from the counter (the one held out to pour is the model's own), and a
  // treat for the dog.
  const bagHolder = new THREE.Group();
  at(right, bagHolder, [0, -8, 0]);
  foodBag(bagHolder, COLORS).visible = true;
  const treat = at(
    right,
    cells(
      [
        [-1, 0, 0, "bone"],
        [0, 0, 0, "bone"],
        [1, 0, 0, "bone"],
        [-1, 1, 0, "bone"],
        [1, 1, 0, "bone"],
      ],
      COLORS
    ),
    [0, -1, 1.5]
  );

  // The garden basket hanging by its handle from the left hand (HOLDS.basket), level, with what is in it
  // (`fill`); what was just picked, in the right hand or in both arms (`holdPiece`); a packet of seeds with
  // the vegetable on it in the left hand (`packet`).
  const basket = at(rig.hands[1], basketPart(part()).mesh(COLORS), [0, -9.2, 0.5], [0.5, Math.PI / 2, 0]);
  const basketFill = new THREE.Group();
  basket.add(basketFill);
  const piece = at(right, new THREE.Group(), [0, -1.5, 1.5]);
  const armful = at(body, new THREE.Group(), [0, 11, 8]);
  const seeds = at(rig.hands[1], new THREE.Group(), [0, -1.5, 1.5], [0, Math.PI / 2, 0]);
  const packets = Object.fromEntries(
    KINDS.map((kind) => {
      const p = part();
      const [c1, c2] = VEG[kind].sign;
      box(p, [-1, 1], [-2, 2], [0, 0], (x, y) => (x === 0 && y === 0 ? c1 : x === 0 && y === 1 ? c2 : "packet"));
      const m = p.mesh(COLORS);
      seeds.add(m);
      return [kind, m];
    })
  );
  // A log for the fire, and the cat's mess balled up for the bin.
  const logP = part();
  for (let x = -3; x <= 3; x++) ellipsoid(logP, [x, 0, 0], [0.5, 1.2, 1.2], Math.abs(x) === 3 ? "logEnd" : "log");
  const log = at(right, logP.mesh(COLORS), [0, -4, 1.5], [0, Math.PI / 2, 0]);
  const mess = at(
    right,
    cells(
      [
        [0, 0, 0, "page"],
        [1, 0, 0, "page"],
        [0, 1, 0, "pageLine"],
        [0, 0, 1, "page"],
        [1, 1, 1, "ball"],
      ],
      COLORS
    ),
    [-0.5, -1, 1]
  );
  // A dish from the fridge for the oven, and out of it for the table, carried in both hands.
  const dishes = Object.fromEntries(DISHES.map((kind) => [kind, at(body, buildDish(kind), [0, 11, 8])]));

  // Their umbrella: rolled up, hanging from the hand by its hooked handle; or open, held up beside the head
  // (HOLDS.umbrella), the shaft leaning in so the canopy is over it: eight panels, a scalloped edge and a tip.
  const [c1, c2] = UMBRELLAS[who];
  const rolled = part();
  box(rolled, [0, 0], [-17, 0], [0, 0], "shaft");
  for (let y = -14; y <= -4; y++) {
    const r = y < -12 || y > -6 ? 0 : 1;
    box(rolled, [-r, r], [y, y], [-r, r], (x, yy, z) => ((x + yy + z) % 4 === 0 ? c2 : c1));
  }
  [
    [1, 1],
    [2, 1],
    [2, 0],
  ].forEach(([x, y]) => rolled.add(x, y, 0, "shaft"));
  const umbrella = at(right, rolled.mesh(COLORS), [0, -1, 1]);
  const openP = part();
  const R = 13;
  box(openP, [0, 0], [0, 30], [0, 0], "shaft");
  for (let x = -R; x <= R; x++)
    for (let z = -R; z <= R; z++) {
      const r = Math.hypot(x, z);
      if (r > R) continue;
      const panel = Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * 8);
      const scallop = r > R - 1.2 && Math.abs(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * 8 - panel - 0.5) < 0.25;
      const y = 31 - Math.round(5 * (r / R) ** 2) - (scallop ? 1 : 0);
      for (let dy = 0; dy <= (r > 7 ? 1 : 0); dy++) openP.add(x, y + dy, z, panel % 2 ? c2 : c1);
    }
  openP.add(0, 32, 0, "shaft");
  openP.add(0, 33, 0, "shaft");
  const umbrellaOpen = at(body, openP.mesh(COLORS), [-10, 19, 4], [0, 0, -0.22]);

  const all = {
    bookShut,
    open,
    laptop,
    laptopShut,
    pad,
    iceCream,
    juice,
    can,
    bag: bagHolder,
    treat,
    basket,
    piece,
    armful,
    seeds,
    log,
    mess,
    umbrella,
    umbrellaOpen,
    ...dishes,
  };
  return {
    ...all,
    leaf,
    lid: laptop.lid,
    spout,
    // Show just these (by name), or none.
    only(...names) {
      Object.entries(all).forEach(([name, o]) => (o.visible = names.includes(name)));
    },
    // The basket holding `pieces` (parts, veg.js).
    fill: (pieces) => fillBasket(basketFill, pieces, (p) => p.mesh(COLORS)),
    // `part` in the right hand (or in both arms), its middle where it is held; shown with only().
    holdPiece(part, inArms = false) {
      const holder = inArms ? armful : piece;
      empty(holder);
      const m = part.mesh(COLORS);
      const { mid } = extent(part);
      m.position.set(-mid[0], -mid[1], -mid[2]);
      holder.add(m);
    },
    // The seed packet for `kind`; shown with only().
    packet(kind) {
      Object.entries(packets).forEach(([k, m]) => (m.visible = k === kind));
    },
  };
}

// What goes in the oven: a roast chicken on a platter with herbs round it, or a lasagna in its baking dish,
// the cheese browned on top and the sauce bubbling at the edges. About 10 voxels across, standing on y = 0.
export const DISHES = ["roast", "lasagna"];
export function buildDish(kind) {
  const p = part();
  if (kind === "roast") {
    ellipsoid(p, [0, 0, 0], [5, 0.5, 4], (x, y, z) => ((x / 5) ** 2 + (z / 4) ** 2 > 0.6 ? "platterRim" : "platter"));
    ellipsoid(p, [0, 2.5, -0.5], [3.2, 2, 2.6], (x, y, z) => (hash(x, y, z) < 0.25 ? "roastDark" : "roast"));
    for (const side of [-1, 1]) {
      ellipsoid(p, [side * 2.2, 1.5, 2.2], [1.1, 1.1, 1.4], "roast"); // the drumsticks
      p.add(side * 2, 2, 3, "platter");
    }
    for (const [x, z] of [
      [-4, -1],
      [4, 0],
      [-1, 3],
      [2, -3],
    ])
      p.add(x, 1, z, "herb");
  } else {
    box(p, [-5, 5], [0, 2], [-4, 4], (x, y, z) => (y === 2 && (Math.abs(x) === 5 || Math.abs(z) === 4) ? "bakeDishRim" : "bakeDish"));
    box(p, [-4, 4], [3, 3], [-3, 3], (x, y, z) =>
      Math.abs(x) === 4 || Math.abs(z) === 3 ? (hash(x, 3, z) < 0.5 ? "sauce" : "cheeseBrown") : hash(x, 1, z) < 0.2 ? "cheeseBrown" : "cheese"
    );
    for (const side of [-1, 1]) box(p, [side * 6, side * 6], [2, 2], [-1, 1], "bakeDish"); // the handles
  }
  return p.mesh(COLORS);
}

// A laptop lying shut, its keyboard side up and the far edge at +z; `lid.outer.rotation.x` opens it
// (about 1.9), the screen turning to face the -z side.
export function buildLaptop() {
  const laptop = new THREE.Group();
  const base = part();
  box(base, [-5, 5], [0, 0], [-4, 3], "laptop");
  box(base, [-4, 4], [0.4, 0.4], [-3, 1], "laptopDark");
  laptop.add(base.mesh(COLORS));
  const lid = pivotGroup(laptop, [0, 0.5, 3.5]);
  const shell = part();
  box(shell, [-5, 5], [1, 1], [-4, 3], (x, y, z) => (Math.abs(x) <= 1 && Math.abs(z + 0.5) <= 1 ? "sticker" : "laptop"));
  const glass = part();
  box(glass, [-4, 4], [0.4, 0.4], [-3, 2], (x, y, z) => ((z + 9) % 2 && Math.abs(x) < 3 ? "page" : "screen"));
  const screen = glass.mesh(COLORS);
  screen.material = new THREE.MeshBasicMaterial(); // it glows
  lid.inner.add(shell.mesh(COLORS), screen);
  laptop.lid = lid;
  return laptop;
}

// The dog's tennis ball, out in the room: lying still, held (in a hand or a mouth), or flying in an arc
// to where it lands, then rolling a little. Returns its controls.
export function buildBall(scene, rest) {
  const p = part();
  for (let x = -2; x <= 2; x++)
    for (let y = -2; y <= 2; y++)
      for (let z = -2; z <= 2; z++) if (x * x + y * y + z * z <= 5.2) p.add(x, y, z, Math.abs(x + z) === 1 && y === 0 ? "ballSeam" : "ball");
  const mesh = p.mesh(COLORS);
  mesh.scale.setScalar(0.6);
  scene.add(mesh);
  const v = new THREE.Vector3();
  const ball = {
    mesh,
    held: null, // the Object3D holding it
    flight: null, // { from, to, t0, secs, height }
    at: [...rest],
    rest: [...rest],
    hold(anchor) {
      ball.held = anchor;
      ball.flight = null;
    },
    // Thrown from where it is to [x, z] on the floor.
    throwTo([x, z], t) {
      const from = ball.position();
      const secs = 0.7 + Math.hypot(x - from[0], z - from[2]) / 160;
      ball.held = null;
      ball.flight = { from, to: [x, 1.2, z], t0: t, secs, height: 26 };
    },
    drop() {
      const [x, , z] = ball.position();
      ball.held = null;
      ball.flight = null;
      ball.at = [x, z];
    },
    // Dropped, and rolling away to [x, z] along the floor.
    rollTo([x, z], t) {
      const from = ball.position();
      ball.held = null;
      ball.flight = { from, to: [x, 1.2, z], t0: t, secs: 0.4 + Math.hypot(x - from[0], z - from[2]) / 60, height: 2 };
    },
    landed: () => !ball.held && !ball.flight,
    position() {
      if (ball.held) {
        ball.held.getWorldPosition(v);
        return [v.x, v.y, v.z];
      }
      return [ball.at[0], 1.2, ball.at[1]];
    },
    update(t) {
      if (ball.flight) {
        const { from, to, t0, secs, height } = ball.flight;
        const k = Math.min(1, (t - t0) / secs);
        mesh.position.set(
          from[0] + (to[0] - from[0]) * k,
          from[1] + (to[1] - from[1]) * k + height * Math.sin(Math.PI * k),
          from[2] + (to[2] - from[2]) * k
        );
        mesh.rotation.z -= 0.3;
        if (k >= 1) {
          ball.flight = null;
          ball.at = [to[0], to[2]];
        }
      } else mesh.position.set(...ball.position());
    },
  };
  return ball;
}
