/*******************************************************************************
 * What the girl and the boy pick up in the playground, and how they hold it:
 * a book off the shelf, the laptop, the game controllers, an ice cream or a juice box
 * from the fridge, a watering can, the bag of pet food, a treat for the dog,
 * the garden basket, what was just picked (in a hand, or in both arms), a
 * packet of seeds, the garden's fruit washed and on its plate, a bite of it, a
 * knife to cut a watermelon, the house keys, a log for the fire, the cat's mess on
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
import { VEG, KINDS, VEG_COLORS, basketPart, fillBasket, extent, empty, canPart, CAN_ROSE } from "./veg.js";

const COLORS = {
  ...PROP_COLORS,
  ...VEG_COLORS,
  page: "#fbf6ea",
  pageLine: "#d9d0bd",
  cover: "#c94f4f",
  coverDark: "#a63c3c",
  mac: "#d6d9de",
  macEdge: "#bfc3ca",
  macLogo: "#b2b7bf",
  macKey: "#2a2c31",
  macKeyGap: "#4a4d55",
  macPad: "#c9ccd2",
  macBezel: "#16171b",
  macBar: "#e9e6ef",
  macDock: "#c7cbe0",
  wallTop: "#3d3f8f",
  wallMid: "#7b5fc4",
  wallLow: "#d77fb6",
  wallGlow: "#f3b18f",
  dsWhite: "#f4f5f7",
  dsShade: "#dcdfe5",
  dsBlack: "#25262b",
  dsStick: "#3c3e45",
  dsButton: "#b9bdc6",
  dsLight: "#5bb4ff",
  remote: "#33363d",
  remoteKey: "#6b7079",
  remoteRed: "#e0504a",
  cone: "#e3b06b",
  coneDark: "#c48d4a",
  scoop: "#f7a8c4",
  scoopTop: "#fbd1e0",
  juiceBox: "#7cc46a",
  juiceLabel: "#f6cf4a",
  ball: "#d6e04a",
  ballSeam: "#f7f7ea",
  log: "#8a5a34",
  logEnd: "#e0bd8f",
  platter: "#f7f3ea",
  platterRim: "#c9d6e8",
  roast: "#c98a3d",
  roastDark: "#a5682a",
  herb: "#5f9e45",
  fryGreen: "#5fae4a",
  fryRed: "#e0533a",
  fryYellow: "#f0c24a",
  fryMeat: "#a8653a",
  soupBroth: "#d98b3a",
  soupBowl: "#f4f1ea",
  soupRim: "#5a7fc0",
  bakeDish: "#d9643f",
  bakeDishRim: "#ef8a5e",
  cheese: "#f2c14e",
  cheeseBrown: "#d08a33",
  sauce: "#c8412f",
  umbrellaPink: "#f28aa8",
  umbrellaNavy: "#3f5a8a",
  umbrellaNavyDark: "#2f4670",
  shaft: "#8f6440",
  steel: "#c3c9cf",
  steelEdge: "#eef2f4",
  keyFob: "#f4a3b8",
};
// Each one's umbrella: the two colours of its panels.
const UMBRELLAS = { girl: ["umbrellaPink", "white"], boy: ["umbrellaNavy", "umbrellaNavyDark"] };

export const HOLDS = {
  carry: [[-0.25, -1.15, 0.15, 0, 0], null], // the right hand holding something in front, the left swinging
  reach: [[-2.6, -0.3, 0.1, 0, 0], null], // up to a shelf
  pick: [[-0.95, -0.25, 0.15, 0, 0], null], // down to a table or the floor
  treat: [[-1.05, -0.15, 0.25, 0, 0], null], // a treat held out low to the dog
  lap: [
    [-0.3, -1.2, 0.2, 0, 0],
    [-0.3, -1.2, -0.2, 0, 0],
  ], // an open book sunk to the lap
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
  // The remote pointed at the TV, the arm out to the right (facing the room, the TV is over that side); or
  // resting in the lap.
  point: [[-0.35, -0.05, 0, -1.35, 0], null],
  lap: [[-0.45, -0.75, 0.25, 0, 0], null],
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
  // Pressing a switch down low (the garden pump's rocker), the hand dipping once and again.
  press: (t, e) => [[-1.15 + 0.22 * Math.max(0, Math.sin(e * 7)), -0.35, 0.15, 0, 0], null],
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
  // Tossing the frying pan (tossAt below, in time with the pan): the left hand on its handle, drawn back
  // and flicked forward and up; the right hand resting on the edge of the worktop.
  toss: (t) => {
    const { slide, lift } = tossAt(t);
    return [
      [-0.75, -0.5, 0.2, 0, 0],
      [-1.0 - 0.3 * lift, -0.4, -0.15 - 0.06 * slide, 0, 0],
    ];
  },
  // Cutting on a board: the knife hand rising and coming down, the other hand holding it steady.
  chop: (t) => [
    [-1.0 + 0.3 * Math.max(0, Math.sin(t * 9)), -0.5, 0.2, 0, 0],
    [-0.9, -0.45, -0.15, 0, 0],
  ],
  // Rinsing something under the tap, the hands turning it over.
  rinse: (t) => [
    [-1.0 + 0.1 * Math.sin(t * 7), -0.5, 0.25 + 0.1 * Math.cos(t * 7), 0, 0],
    [-1.0 + 0.1 * Math.sin(t * 7 + 2), -0.5, -0.25 - 0.1 * Math.cos(t * 7 + 2), 0, 0],
  ],
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
// A rice bowl (white china, a blue rim) with a pair of chopsticks across it, into `p` at [x, y, z]; `stack`
// of them, one on another.
export function tableware(p, [x, y, z] = [0, 0, 0], stack = 1) {
  for (let k = 0; k < stack; k++) {
    const y0 = y + k * 2;
    for (let vy = y0; vy <= y0 + 2; vy++) {
      const r = vy === y0 ? 1.4 : 2.4;
      ellipsoid(p, [x, vy, z], [r, 0.5, r], (vx, yy, vz) => ((vx - x) ** 2 + (vz - z) ** 2 > 3.5 && vy === y0 + 2 ? "chinaBlue" : "china"));
    }
  }
  const top = y + stack * 2 + 1;
  for (let dz = -3; dz <= 3; dz++) for (const dx of [-0.5, 0.5]) p.add(Math.round(x + dx), top, z + dz, "woodDark");
  return p;
}

export function propsFor(rig, who) {
  const right = rig.hands[0];
  const body = rig.pose;
  const at = (parent, object, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => {
    object.position.set(x, y, z);
    object.rotation.set(rx, ry, rz);
    parent.add(hidden(object));
    return object;
  };

  // The book off the shelf (one of BOOKS, `book(i)`): shut in the hand, or open in both hands, its pages
  // turning.
  const covers = BOOKS.map((c) => ({ ...COLORS, cover: c, coverDark: `#${new THREE.Color(c).multiplyScalar(0.8).getHexString()}` }));
  const shut = part();
  box(shut, [-2, 2], [0, 5], [0, 1], (x, y, z) => (x === 2 ? "page" : z === 0 ? "coverDark" : "cover"));
  const bookShut = at(right, new THREE.Group(), [0, -4, 1.5], [0, Math.PI / 2, 0]);
  const shutCovers = covers.map((palette) => bookShut.add(shut.mesh(palette)).children.at(-1));
  const open = new THREE.Group();
  const openCovers = [];
  [-1, 1].forEach((side) => {
    const p = part();
    box(p, side < 0 ? [-5, -1] : [0, 4], [0, 6], [0, 0], (x, y) => (y % 2 === 0 && Math.abs(x) > 1 && Math.abs(x) < 4 ? "pageLine" : "page"));
    const m = p.mesh(COLORS);
    const back = part();
    box(back, side < 0 ? [-5, -1] : [0, 4], [0, 6], [-1, -1], "cover");
    covers.forEach((palette, i) => {
      const c = back.mesh(palette);
      m.add(c);
      (openCovers[i] ??= []).push(c);
    });
    m.rotation.y = side * 0.25; // open in a shallow V
    open.add(m);
  });
  // Book `i` of BOOKS, shut or open; shown with only().
  const book = (i) => {
    shutCovers.forEach((m, k) => (m.visible = k === i));
    openCovers.forEach((ms, k) => ms.forEach((m) => (m.visible = k === i)));
  };
  book(0);
  const leaf = pivotGroup(open, [0, 0, 0.5]); // a page turning
  const leafPart = part();
  box(leafPart, [0, 4], [0, 6], [1, 1], "page");
  leaf.inner.add(leafPart.mesh(COLORS));
  at(body, open, [-0.5, 12, 7], [-0.65, 0, 0]);

  // The laptop: carried shut, or open on the lap with the screen towards them.
  const laptop = at(body, buildLaptop(), [0, 11.2, 5.5]);
  const laptopShut = at(right, buildLaptop(), [0, -3, 3], [Math.PI / 2, 0, 0]);

  // A game controller between the hands; both of them carried in one hand, to the sofa or back to their
  // stand; and the TV's remote.
  const pad = at(body, buildPad(), [0, 10.8, 7.5], [0.15, 0, 0]);
  const pads = at(right, new THREE.Group(), [0, -2.5, 1.5], [Math.PI / 2, 0, 0]);
  [-1.2, 1.2].forEach((y) => (pads.add(buildPad()).children.at(-1).position.y = y));
  const remote = at(right, buildRemote(), [0, -2.2, 1.2], [Math.PI / 2, 0, 0]);

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

  // The watering can (veg.js), smaller, in the left hand by its handle, and the drops falling from its rose
  // (placed by the activity).
  const can = at(rig.hands[1], canPart(part()).mesh(COLORS), [0, -5, 0]);
  can.scale.setScalar(0.6);
  const spout = new THREE.Object3D();
  spout.position.set(...CAN_ROSE);
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
  // A dish from the fridge for the oven, and out of it for the table, carried in both hands; or the fruit
  // from the garden, washed, on its plate.
  const dishes = Object.fromEntries([...DISHES, ...FRUIT_DISHES, ...COOKED].map((kind) => [kind, at(body, buildDish(kind), [0, 11, 8])]));
  // The bowls and chopsticks for the table, two of them, out of the cupboard; or one, their own, cleared
  // away after.
  const bowls = at(body, tableware(part(), [0, 0, 0], 2).mesh(COLORS), [0, 11, 8]);
  const bowl = at(body, tableware(part()).mesh(COLORS), [0, 11, 8]);
  // A bite of fruit off the plate in the right hand (`bite(kind)`), and the knife for the watermelon.
  const bite = at(right, new THREE.Group(), [0, -1.5, 1.5]);
  const bites = Object.fromEntries(
    FRUIT_DISHES.map((kind) => {
      const m = fruitPiece(kind).mesh(COLORS);
      m.scale.setScalar(0.8);
      bite.add(m);
      return [kind, m];
    })
  );
  const knifeP = part();
  box(knifeP, [0, 0], [-1, 1], [0, 0], "shaft");
  box(knifeP, [0, 0], [2, 7], [0, 1], (x, y, z) => (z === 1 && y > 2 ? "steelEdge" : "steel"));
  const knife = at(right, knifeP.mesh(COLORS), [0, -1.5, 1.5], [Math.PI / 2, 0, 0]);
  // The house keys, hanging from the fingers by their ring.
  const keys = at(
    right,
    cells(
      [
        [0, 0, 0, "brass"],
        [0, -1, 0, "steel"],
        [0, -2, 0, "steel"],
        [1, -1, 0, "steel"],
        [-1, 0, 0, "keyFob"],
        [-1, -1, 0, "keyFob"],
      ],
      COLORS
    ),
    [0, -1.5, 1.5]
  );

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
    pads,
    remote,
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
    bite,
    knife,
    keys,
    bowls,
    bowl,
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
    // The plate of fruit `kind` carried with `left` pieces on it; shown with only(kind).
    plate(kind, left) {
      dishes[kind].userData.pieces.forEach((m, k) => (m.visible = k < left));
    },
    // The bite of fruit for `kind` (FRUIT_DISHES); shown with only("bite").
    bite(kind) {
      Object.entries(bites).forEach(([k, m]) => (m.visible = k === kind));
    },
    book,
  };
}

// The books on the low shelf that they take down to read, each its own colour (house.js shelves them).
export const BOOKS = ["#c94f4f", "#4f7fc9", "#e8b84a", "#5e9e6e", "#9c6fc2", "#e07a9a"];

// The fruit from the garden, washed and plated for the two of them: a bowl of strawberries, or a watermelon
// cut into six slices on a plate. Each piece is a mesh of its own (the group's `pieces`), so the plate
// empties as they eat.
export const FRUIT_DISHES = ["strawberry", "watermelon"];
function fruitPiece(kind) {
  const p = part();
  if (kind === "strawberry") {
    box(p, [0, 1], [0, 1], [0, 1], (x, y, z) => ((x + y + z) % 3 === 0 ? "strawSeed" : "strawberry"));
    p.add(0, -1, 0, "strawberry");
    p.add(0, 2, 0, "strawLeaf");
  } else {
    // A slice lying flat: the rind round its outer edge, the red flesh in a wedge to its point, and seeds.
    for (let x = 0; x <= 5; x++)
      for (let z = -Math.floor((5 - x) / 2); z <= Math.floor((5 - x) / 2); z++)
        p.add(x, 0, z, x === 0 ? "melonDark" : x === 1 ? "melonRind" : (x + z) % 3 === 0 && x > 2 ? "melonSeed" : "melonRed");
  }
  return p;
}
function buildFruitDish(kind) {
  const g = new THREE.Group();
  const plate = part();
  if (kind === "strawberry")
    for (let y = 0; y <= 2; y++)
      ellipsoid(plate, [0, y, 0], [3 + y * 0.6, 0.5, 3 + y * 0.6], y === 2 ? "platterRim" : "platter", [
        { has: (x, yy, z) => y > 0 && x * x + z * z < (2.2 + y * 0.6) ** 2 },
      ]);
  else ellipsoid(plate, [0, 0, 0], [6, 0.5, 6], (x, y, z) => (x * x + z * z > 25 ? "platterRim" : "platter"));
  g.add(plate.mesh(COLORS));
  const pieces = [];
  const add = (m, [x, y, z], yaw = 0) => {
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    g.add(m);
    pieces.push(m);
  };
  if (kind === "strawberry")
    [
      [-2, 2, -1],
      [1, 2, -2],
      [0, 2, 1],
      [-1.5, 3, 1.5],
      [2, 3, 1],
      [-0.5, 4, -0.5],
      [1, 4, 0],
      [-2.5, 3, -2],
    ].forEach((at) => add(fruitPiece(kind).mesh(COLORS), at));
  else
    for (let k = 0; k < 6; k++)
      add(fruitPiece(kind).mesh(COLORS), [Math.cos((k * Math.PI) / 3) * 5, 1, -Math.sin((k * Math.PI) / 3) * 5], (k * Math.PI) / 3 + Math.PI);
  g.userData.pieces = pieces;
  return g;
}

// What goes in the oven: a roast chicken on a platter with herbs round it, or a lasagna in its baking dish,
// the cheese browned on top and the sauce bubbling at the edges. About 10 voxels across, standing on y = 0.
export const DISHES = ["roast", "lasagna"];
// What is cooked on the hob, for the table with the rice: a plate of stir-fry out of the frying pan (greens,
// red and yellow peppers and pork), or a bowl of soup out of the pot.
export const COOKED = ["stirfry", "soup"];
export function buildDish(kind) {
  if (FRUIT_DISHES.includes(kind)) return buildFruitDish(kind);
  const p = part();
  if (kind === "stirfry") {
    ellipsoid(p, [0, 0, 0], [4.5, 0.5, 4.5], (x, y, z) => (x * x + z * z > 14 ? "platterRim" : "platter"));
    const FOOD = ["fryGreen", "fryGreen", "fryRed", "fryMeat", "fryYellow", "fryMeat"];
    ellipsoid(p, [0, 1, 0], [3, 1, 3], (x, y, z) => FOOD[Math.floor(hash(x, y, z) * FOOD.length)]);
  } else if (kind === "soup") {
    for (let y = 0; y <= 3; y++) ellipsoid(p, [0, y, 0], [2.4 + y * 0.5, 0.5, 2.4 + y * 0.5], y === 3 ? "soupRim" : "soupBowl", [], 2);
    ellipsoid(p, [0, 3, 0], [3.2, 0.5, 3.2], (x, y, z) => (hash(x, y, z) < 0.15 ? "fryGreen" : "soupBroth"));
  } else if (kind === "roast") {
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
  // Done, as built; `userData.bake(k)` makes it uncooked (0: the chicken pale, the cheese not yet browned)
  // or on the way (0 to 1). `userData.steam(t, on)` lets faint wisps of steam rise off it while it is hot.
  const m = p.mesh(COLORS);
  const raw = p.mesh({ ...COLORS, ...UNCOOKED });
  const [done, pale] = [m, raw].map((x) => x.instanceColor.array.slice());
  raw.dispose();
  m.userData.bake = (k) => {
    const c = m.instanceColor.array;
    for (let i = 0; i < c.length; i++) c[i] = pale[i] + (done[i] - pale[i]) * k;
    m.instanceColor.needsUpdate = true;
  };
  const wisps = [0, 1, 2].map(() => {
    const w = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshBasicMaterial({ color: "#f4f6f8", transparent: true, depthWrite: false })
    );
    w.visible = false;
    m.add(w);
    return w;
  });
  m.userData.steam = (t, on) =>
    wisps.forEach((w, i) => {
      const k = (t * 0.35 + i / 3) % 1; // each rising, drifting and fading, one after another
      w.visible = on;
      w.position.set(2.5 * Math.sin(t * 1.3 + i * 2.1) * k, 4 + 11 * k, 1.5 * Math.cos(t * 1.1 + i) * k);
      w.material.opacity = 0.3 * Math.sin(Math.PI * k);
      w.scale.setScalar(0.7 + 1.1 * k);
    });
  return m;
}
// How the dishes look before they go in the oven.
const UNCOOKED = { roast: "#f1c8aa", roastDark: "#e6b394", cheese: "#f8ecc4", cheeseBrown: "#f3e2ad", sauce: "#d9573f" };

// Tossing a frying pan, every 1.3 s: drawn back and flicked forward (`slide`), its front lifting (`lift`),
// and what is in it flying up out of it and falling back in (`hop(i)` for the i-th piece, 0 to 1 and back),
// one just after another. The pan (house/kitchen.js) and the cook's arm (MOVES.toss) both follow it.
export function tossAt(t) {
  const p = (t / 1.3) % 1;
  const flick = p < 0.3 ? Math.sin((Math.PI * p) / 0.3) : 0;
  return {
    slide: p < 0.3 ? -Math.sin((2 * Math.PI * p) / 0.3) : 0,
    lift: flick,
    hop: (i) => {
      const k = (p - 0.12 - 0.03 * i) / 0.45;
      return k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
    },
  };
}

// Small things built in half voxels, for the detail: the part's mesh at half the size.
const fine = (p) => {
  const m = p.mesh(COLORS);
  m.scale.setScalar(0.5);
  return m;
};

// The apple on the lid, a row at a time from the leaf down (the bite on the right, seen from behind).
const APPLE = ["....X..", "...X...", ".XX.XX.", "XXXXX..", "XXXXX..", "XXXXXX.", ".XX.XX."];

// The MacBook, lying shut, its keyboard side up and the hinge at +z; `lid.outer.rotation.x` opens it
// (about 1.9), the screen turning to face the -z side. Silver, a black keyboard and a wide trackpad; the
// screen in a thin black bezel with the notch, the desktop and the dock on it (glowing); the apple on the
// back of the lid. Built in half voxels, each layer a quarter of a voxel thick: about 10 x 8 voxels and 1
// thick shut, sitting on y = -0.5.
export function buildLaptop() {
  const laptop = new THREE.Group();
  const thin = (p, material) => {
    const m = p.mesh(COLORS);
    if (material) m.material = material;
    m.scale.set(0.5, 0.25, 0.5);
    m.position.y = -0.375;
    return m;
  };
  const rim = (x, z) => Math.abs(x) === 10 || z === -8 || z === 7;
  const base = part();
  box(base, [-10, 10], [0, 0], [-8, 7], (x, y, z) => (rim(x, z) ? "macEdge" : "mac"));
  box(base, [-10, 10], [1, 1], [-8, 7], (x, y, z) => {
    if (Math.abs(x) <= 8 && z >= 1 && z <= 6) return z === 6 || (x + 8) % 3 === 2 ? "macKeyGap" : "macKey"; // the keys
    if (Math.abs(x) <= 4 && z >= -7 && z <= -2) return "macPad";
    return rim(x, z) ? "macEdge" : "mac";
  });
  laptop.add(thin(base));
  const lid = pivotGroup(laptop, [0, 0, 3.75]);
  const shell = part();
  box(shell, [-10, 10], [3, 3], [-8, 7], (x, y, z) => (APPLE[z + 3]?.[x + 3] === "X" ? "macLogo" : rim(x, z) ? "macEdge" : "mac"));
  box(shell, [-10, 10], [2, 2], [-8, 7], "macEdge", [{ has: (x, y, z) => !rim(x, z) }]);
  // The screen: a menu bar along the top (the free edge, -z), a dusky purple desktop, and the dock.
  const DOCK = ["wallGlow", "dsLight", "melonRed", "lkkGold"];
  const glass = part();
  box(glass, [-9, 9], [2, 2], [-7, 6], (x, y, z) => {
    if (Math.abs(x) === 9 || z === -7 || z === 6 || (z === -6 && Math.abs(x) <= 1)) return "macBezel";
    if (z === -6) return "macBar";
    if (z === 4 && Math.abs(x) <= 5) return Math.abs(x) % 2 ? "macDock" : DOCK[(x + 6) % 4];
    return z < -2 ? "wallTop" : z < 1 ? "wallMid" : z < 3 ? "wallLow" : "wallGlow";
  });
  lid.inner.add(thin(shell), thin(glass, new THREE.MeshBasicMaterial())); // the screen glows
  laptop.lid = lid;
  return laptop;
}

// A DualSense controller, lying face up with its grips towards -z: white wings with the D-pad and the face
// buttons, the black middle with the two sticks and the PS button, the touchpad at the top with the blue
// light either side of it, and the shoulder buttons behind. About 7 x 4.5 voxels, its middle at the origin.
export function buildPad() {
  const p = part();
  for (let x = -7; x <= 6; x++)
    for (let z = -4; z <= 4; z++) {
      const ax = Math.abs(x + 0.5); // from the middle
      if (z === 4) {
        if (ax >= 3.5 && ax <= 5.5) p.add(x, 0, z, "dsBlack"); // the shoulder buttons
        continue;
      }
      const body = z >= -1 && ax <= (z === 3 ? 5.5 : 6.5);
      const grip = z < -1 && ax >= (z === -4 ? 4.5 : 3.5) && ax <= (z === -4 ? 6 : 6.5);
      const belly = z === -2 && ax <= 2.5;
      if (!body && !grip && !belly) continue;
      let c = "dsWhite";
      if (ax <= 2.5) c = z <= 0 ? "dsBlack" : "dsShade"; // the black middle, and the touchpad
      else if (ax <= 3.5 && z >= 1) c = "dsLight";
      p.add(x, 0, z, c);
    }
  [
    [-6, 1],
    [-4, 1],
    [-5, 0],
    [-5, 2],
  ].forEach(([x, z]) => p.add(x, 1, z, "dsButton")); // the D-pad
  [
    [4, 2],
    [3, 1],
    [5, 1],
    [4, 0],
  ].forEach(([x, z]) => p.add(x, 1, z, "dsButton")); // triangle, square, circle and cross
  for (const x of [-2, 1]) p.add(x, 1, -1, "dsStick");
  p.add(0, 1, -2, "dsButton"); // PS
  const m = fine(p);
  m.position.x = 0.25;
  return m;
}

// The TV's remote, lying face up, its top end (the red power button) towards +z: about 2 x 6.5 voxels.
export function buildRemote() {
  const p = part();
  box(p, [-2, 1], [0, 0], [-6, 6], "remote");
  p.add(-1, 1, 5, "remoteRed");
  p.add(0, 1, 5, "remoteRed");
  box(p, [-1, 0], [1, 1], [1, 2], "remoteKey"); // the arrows
  for (let z = -5; z <= -1; z += 2) for (const x of [-2, 0]) p.add(x, 1, z, "remoteKey"); // the numbers
  const m = fine(p);
  m.position.x = 0.25;
  return m;
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
