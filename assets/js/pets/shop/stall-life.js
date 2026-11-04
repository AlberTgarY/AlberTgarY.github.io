/*******************************************************************************
 * The man who keeps the wonton stall (stall.js), and his day: at two in the
 * afternoon, once the two of them have cleared the corner for him (hours.js),
 * he rides his tricycle up the side of the pavement from the street,
 * ringing his bell if anyone is in the way, and steers it in under the tree;
 * gets down, goes round behind it, takes the lid off the pot, lights the
 * burner under it and sets out the folding table and the stools. Then, till
 * eleven at night:
 * - he makes wontons, one after another, the Wenzhou way: a wrapper on the
 *   flat of his left hand, a dab of pork smeared on its corner with the
 *   bamboo blade, his fist closed round it and it is done, onto the tray;
 * - a customer orders (stood at the cabinet, scanning the code to pay) and
 *   he cooks for them: a handful from the tray dropped into the pot, a stir
 *   with the ladle, a bowl from the stack and a pinch from each tub (laver,
 *   dried shrimp, a little lard), the wontons scooped out with the strainer
 *   once they float, shaken, tipped in, broth ladled over, spring onion
 *   sprinkled on; he brings it to their place at the table ("enjoy");
 * - once they have gone he clears their bowl and wipes the table;
 * - between times he stirs the pot, wipes down the counter, wipes his brow
 *   with the towel round his neck, calls out to people passing, has a word
 *   with the girl or the boy, and keeps a biscuit for the dog.
 * At eleven he puts the burner out, the lid on, the table and the stools
 * away, and walks the tricycle back out of the corner and off down the
 * street. The customers' side of it (ordering, sitting, eating) is
 * customers.js `dine`, and the girl's (acts.js `wonton`): both go by the
 * deals here (order()).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd, pick } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { makeActor } from "../room/actor.js";
import { HOLDS, MOVES } from "../room/props.js";
import { buildTownsfolk } from "../models/townsfolk.js";
import { setFade } from "./fade.js";
import { STALL, PARKED, LANE, STREET, GROUND } from "./layout.js";
import { PARK_YAW, COUNTER, STALL_POT, CRATE } from "./stall.js";

// Him: a man in his fifties, his greying hair cut short, stubble, a black T-shirt under a white apron, the towel
// round his neck, dark trousers, cloth shoes.
const LOOK = {
  age: "adult",
  fem: false,
  size: 1.03,
  speed: 24,
  hair: "crop",
  eyes: "narrow",
  lashes: false,
  blush: true,
  beard: "stubble",
  glasses: null,
  top: "apron",
  heart: false,
  legs: "trousers",
  shoes: "flats",
  hat: null,
  scarf: true,
  bag: null,
  colors: {
    skin: "#e2ad86",
    hair: "#34302d",
    eye: "#3d2a1e",
    top: "#2b2b30",
    top2: "#f2efe6",
    leg: "#3a3d44",
    socks: "#2a2a2f",
    shoe: "#1c1c20",
    hat: "#c94f4f",
    scarf: "#f4f4ef",
    bag: "#2a2a2f",
    frame: "#1d1d22",
    tie: "#c94f4f",
  },
};

export const stallOpenAt = (h) => h >= STALL.open && h < STALL.close;
const CATCH = 0.5; // h after two (or eleven), a jump to which sees him come (or go)
const PER_BOWL = 10; // wontons in a bowl
const HANDFUL = 5; // he takes from the tray at a time
const RIDE = 14; // voxels a second, riding up the pavement
const PUSH = 7; // walking it back out
const ROUTE_TOP = [LANE, -40]; // where the lane ends and he steers round into his place
const ROUTE_BEND = [160, -60];

// The cabinet's places (about its middle), in the world, parked; and where he stands at each, behind it.
const toWorld = ([x, y, z]) => {
  const [c, s] = [Math.cos(PARK_YAW), Math.sin(PARK_YAW)];
  return [PARKED.x + x * c + z * s, y, PARKED.z - x * s + z * c];
};
const behind = (x) => [Math.min(STALL.boss.x1, Math.max(STALL.boss.x0, x)), STALL.boss.z];

// His arms where they are not at work on something (as room/props.js's HOLDS: [shoulder x, elbow x, shoulder y,
// shoulder z, elbow z], right then left); at work his hands go to points in the world (makeStallLife's
// handsAt).
const ARMS = {
  handlebars: [
    [-1.25, -0.35, 0.2, 0, 0],
    [-1.25, -0.35, -0.2, 0, 0],
  ],
  // A bowl carried in both hands by its near rim, held up clear of the counter and the pot.
  bowl: [
    [-0.8, -1.6, 0.35, 0, 0],
    [-0.8, -1.6, -0.35, 0, 0],
  ],
  // Waving: to a friend, or calling out to people passing; the arm up out to his side (a hand at his mouth, or
  // up before him, would be in his big face).
  wave: (t) => [[0, -0.35, 0, -2.2, 0.45 * Math.sin(t * 9)], null],
};
const WRAP = 1.8; // s a wonton
const LEAN = 0.1; // the most he leans over the counter (his head is big: further, and it is in the things on it)
const HAND_UP = 1.7; // his hand's point above what it rests on (his hand and forearm are that thick below it)
const TABLE_LEAN = 0.3; // over the low table (nothing on it comes up to his head)
const RIM = 3; // from a hand at a bowl's near rim to its middle
const GRIP = 2.2; // and up from its foot (at the rim)
const CRATE_RIM = 3.6; // from his hands at the crate's near side to its middle
// Along a path of [k, point] keys (k from 0 to 1), eased between them.
function pathAt(keys, k) {
  let i = 1;
  while (i < keys.length - 1 && k > keys[i][0]) i++;
  const [[k0, a], [k1, b]] = [keys[i - 1], keys[i]];
  const u = Math.min(1, Math.max(0, (k - k0) / (k1 - k0 || 1)));
  const s = u * u * (3 - 2 * u);
  return [0, 1, 2].map((j) => a[j] + (b[j] - a[j]) * s);
}

// A customer eating: a spoonful every BITE s (down to the bowl, up to the mouth, blown on, eaten).
const BITE = 3.4;
const spoonful = (k) => (k < 0.3 ? 0 : k < 0.5 ? (k - 0.3) / 0.2 : k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15);
const TABLE_TOP = STALL.table.h + 0.5;
// Where a customer comes up to the stall from (free floor), to order at the code, and to each stool (a step
// in from there, past the table's end or from in front of it).
const PAY_FROM = [151, -46];
const SEAT_FROM = [
  [
    [94, -40],
    [95, -47],
  ],
  [
    [139, -40],
    [137, -47],
  ],
  [
    [124, -36],
    [122, -41],
  ],
];

// His legs riding: pedalling, the knees going round.
const pedalling = (phase) => [
  [-1.35 + 0.45 * Math.sin(phase), 1.4 - 0.55 * Math.sin(phase)],
  [-1.35 - 0.45 * Math.sin(phase), 1.4 + 0.55 * Math.sin(phase)],
];

export function makeStallLife(home) {
  const { clock } = home;
  const t = () => clock.t;
  const S = home.stall;
  const C = S.cooking;
  const steps = makeSteps(home);
  const { wait, until, stepTo } = steps;
  const turn = (a, yaw) => steps.turn(a, yaw, 0.3);

  const boss = makeActor("boss", buildTownsfolk(LOOK), "human", home, LOOK.size);
  Object.assign(boss, { boss: true, away: true, cleanups: [], x: LANE, z: STREET.z, y: 0 });
  setFade(boss, 0);
  home.actors.push(boss);
  home.byName.boss = boss;
  boss.rig.label = "The man at the wonton stall, click to say hi";

  /* ----- what he holds: drawn where his hands are (follow()), after he is posed each frame ----- */
  const props = new THREE.Group();
  S.group.add(props);
  const mat = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
  const stick = (len, r, color) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6).translate(0, len / 2, 0), mat(color));
  // The ladle and the strainer: a handle from his (left) hand to the head (wherever its head is to be).
  function tool(head) {
    const g = new THREE.Group();
    const handle = stick(1, 0.22, "#8a6a44");
    g.add(handle, head);
    g.visible = false;
    props.add(g);
    return { g, handle, head };
  }
  const ladleHead = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    mat("#c9ced1", { side: THREE.DoubleSide })
  );
  const ladle = tool(ladleHead);
  const strainerHead = new THREE.Group();
  strainerHead.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(2.3, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.6),
      mat("#b8892f", { side: THREE.DoubleSide, wireframe: true })
    ),
    new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.12, 4, 16).rotateX(Math.PI / 2), mat("#9c7a30"))
  );
  const strainer = tool(strainerHead);
  // What is in the strainer, or in his hand: a few wontons, drawn with the pot's.
  const heldIn = (n) => {
    const m = new THREE.InstancedMesh(C.geometry, C.material, n);
    m.count = 0;
    m.frustumCulled = false;
    props.add(m);
    return m;
  };
  const inStrainer = heldIn(PER_BOWL * 2);
  const inHand = heldIn(HANDFUL + 1);
  const blade = stick(3.2, 0.25, "#d8c27a");
  const wrapper = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4).rotateX(-Math.PI / 2), mat("#f3e3b4", { side: THREE.DoubleSide }));
  const rag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.6), mat("#9ec3e0"));
  for (const m of [blade, wrapper, rag]) {
    m.visible = false;
    props.add(m);
  }
  const NOTHING = { ladle: null, strainer: null, blade: false, wrapper: false, ball: null, rag: false, handful: 0, handfulIn: 0, bowl: null, bowlIn: null, pinch: false };
  const shown = { ...NOTHING };
  const resetShown = () => Object.assign(shown, NOTHING);
  // Each diner's spoon (white porcelain: a bowl on a short handle; a wonton on it on its way up), and the
  // phone they pay with.
  const diners = new Map(); // a -> { spoon, bite, phone, eating, scanning, drinking, bowl }
  function dinerProps() {
    const spoon = new THREE.Group();
    const cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      mat("#f7f5ef", { side: THREE.DoubleSide })
    );
    cup.scale.set(1, 0.6, 1.3);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 2.2).translate(0, 0.2, -1.4), mat("#f7f5ef"));
    spoon.add(cup, handle);
    const bite = new THREE.Mesh(C.geometry, C.material);
    bite.scale.setScalar(C.SIZE * 0.75);
    bite.position.y = 0.15;
    spoon.add(bite);
    const phone = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.25), mat("#1d1d22"));
    for (const m of [spoon, phone]) {
      m.visible = false;
      props.add(m);
    }
    return { spoon, bite, phone, eating: false, scanning: false, drinking: false, bowl: null, carrying: null };
  }
  const dh = [new THREE.Vector3(), new THREE.Vector3()];
  // The front of `a`'s chin, where a spoonful goes (their head is big: their hand cannot come up to their mouth,
  // only to under it), from their head's own shape (`p` keeps it).
  const chinAt = new THREE.Vector3();
  function chinOf(a, p) {
    if (!p.chin) {
      const head = a.rig.head.outer;
      let m = null;
      head.traverse((o) => (m ??= o.isMesh ? o : null));
      m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox;
      p.chin = { mesh: m, at: new THREE.Vector3(0, b.min.y + 1.5, b.max.z - 1.5) };
    }
    return p.chin.mesh.localToWorld(chinAt.copy(p.chin.at)).toArray();
  }
  const mouth = new THREE.Vector3();
  function followDiners() {
    for (const [a, p] of diners) {
      const on = !a.away && a.rig.group.visible;
      p.spoon.visible = on && p.eating;
      p.phone.visible = on && p.scanning;
      if (!on) continue;
      a.rig.group.updateMatrixWorld(true);
      a.rig.hands.forEach((h, i) => h.getWorldPosition(dh[i]));
      if (p.eating) {
        // (the spoon from the hand towards the mouth or the bowl, a wonton on it from the dip till it is eaten)
        const k = ((t() - a.since) % BITE) / BITE;
        p.spoon.position.copy(dh[0]);
        p.spoon.lookAt(k < 0.3 ? mouth.set(...p.bowl.surface()) : mouth.set(...chinOf(a, p)));
        p.bite.visible = k > 0.27 && k < 0.78 && p.bowl.wontons > 0;
      }
      if (p.scanning) {
        p.phone.position.copy(dh[1]);
        p.phone.position.y += 0.8;
        p.phone.rotation.set(0, a.yaw, 0);
      }
      if (p.drinking && p.bowl) p.bowl.place(...inHands(a, dh, RIM, GRIP));
      if (p.carrying) p.carrying.place(...inHands(a, dh, RIM, GRIP));
    }
  }
  // (each frame: the tools from his hands to where their heads are to be, `shown`)
  const hand = [new THREE.Vector3(), new THREE.Vector3()];
  const up = new THREE.Vector3(0, 1, 0);
  const d3 = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s3 = new THREE.Vector3();
  function placeTool(tl, to) {
    tl.g.visible = !!to && !boss.away;
    if (!tl.g.visible) return;
    const [hx, hy, hz] = [hand[1].x, hand[1].y, hand[1].z]; // (in his left hand)
    d3.set(to[0] - hx, to[1] - hy, to[2] - hz);
    const len = d3.length();
    tl.handle.position.set(hx, hy, hz);
    tl.handle.quaternion.setFromUnitVectors(up, d3.normalize());
    tl.handle.scale.set(1, len, 1);
    tl.head.position.set(...to);
  }
  function follow() {
    if (boss.away) {
      props.visible = false;
      return;
    }
    props.visible = true;
    boss.rig.group.updateMatrixWorld(true);
    boss.rig.hands.forEach((h, i) => h.getWorldPosition(hand[i]));
    placeTool(ladle, shown.ladle?.());
    placeTool(strainer, shown.strainer?.());
    // (what the strainer has scooped, in its basket)
    if (strainer.g.visible) {
      const n = inStrainer.count;
      for (let i = 0; i < n; i++) {
        const a = (i / Math.max(1, n)) * Math.PI * 2 * 1.7;
        const r = 0.5 + 1.3 * ((i * 0.37) % 1);
        m4.compose(
          s3.set(
            strainerHead.position.x + Math.cos(a) * r,
            strainerHead.position.y - 0.9 + 0.35 * (i % 3),
            strainerHead.position.z + Math.sin(a) * r
          ),
          q.identity(),
          d3.setScalar(C.SIZE * 0.95)
        );
        inStrainer.setMatrixAt(i, m4);
      }
      inStrainer.instanceMatrix.needsUpdate = true;
    }
    inStrainer.visible = strainer.g.visible;
    blade.visible = shown.blade;
    if (shown.blade) {
      blade.position.copy(hand[0]);
      blade.rotation.set(0.5, 0, 0.4);
    }
    rag.visible = shown.rag;
    if (shown.rag) rag.position.set(hand[0].x, hand[0].y - HAND_UP + 0.4, hand[0].z); // (under his palm)
    wrapper.visible = shown.wrapper;
    if (shown.wrapper) wrapper.position.set(hand[1].x, hand[1].y + 0.3, hand[1].z);
    // A wonton just closed in his fist (`ball`: which hand), or a handful carried to the pot (`handfulIn`), or a
    // pinch of laver and shrimp in his fingers.
    const ball = shown.ball !== null;
    const n = ball ? 1 : shown.handful;
    const at = hand[ball ? shown.ball : shown.handfulIn];
    for (let i = 0; i < n; i++)
      inHand.setMatrixAt(
        i,
        m4.compose(
          s3.set(at.x + (i % 3) * 0.6 - 0.6, at.y + 0.2 + Math.floor(i / 3) * 0.4, at.z + (i % 2) * 0.5),
          q.identity(),
          d3.setScalar(C.SIZE * (ball ? 0.7 : 0.8))
        )
      );
    inHand.count = n;
    inHand.instanceMatrix.needsUpdate = true;
    // A bowl carried in both hands, or in one by its rim (`bowlIn`).
    const h = hand[shown.bowlIn ?? 0];
    if (shown.bowl && shown.bowlIn !== null) shown.bowl.place(h.x + RIM * Math.sin(boss.yaw), h.y - GRIP, h.z + RIM * Math.cos(boss.yaw));
    else if (shown.bowl) shown.bowl.place(...inHands(boss, hand, RIM, GRIP));
    if (carried.crate) S.crate(inHands(boss, hand, CRATE_RIM, CRATE.h + 0.4), boss.yaw);
    // The riders: whoever is riding the tricycle, sat on its saddle, the cart where it has got to.
    if (riding) seatOn(boss);
  }
  // Where a thing held in both of `a`'s hands (at `h`) by its near side is: `rim` on before them, `down` below.
  const inHands = (a, h, rim, down) => [
    (h[0].x + h[1].x) / 2 + rim * Math.sin(a.yaw),
    Math.min(h[0].y, h[1].y) - down,
    (h[0].z + h[1].z) / 2 + rim * Math.cos(a.yaw),
  ];
  const carried = { crate: false }; // (the crate of bowls, in his hands)
  function followAll() {
    follow();
    followDiners();
  }

  /* ----- his hands at points: each arm a two-link reach ----- */
  // (the rig's own lengths: shoulder to elbow, elbow to where the hand holds things, which is half a voxel in
  // from the line of the arm)
  const UPPER = 5;
  const FORE = 5.5;
  const toArm = new THREE.Vector3();
  // The arm (as HOLDS: [shoulder x, elbow x, shoulder y, 0, 0]) that puts `a`'s hand `i` (0 the right) at world
  // point `p` (a person: him, or a customer): the shoulder turned towards it, the elbow bent to make up the distance (straight, reaching for it, if
  // it is further). (From where he was last drawn: a frame behind, which the arms' easing hides.)
  const reach = (i, p) => reachOf(boss, i, p);
  function reachOf(a, i, p) {
    const shoulder = a.rig.hands[i].parent.parent.parent.parent; // (the hand, the elbow's two pivots, the shoulder's)
    shoulder.parent.worldToLocal(toArm.set(p[0], p[1], p[2])).sub(shoulder.position);
    toArm.x += i ? 0.5 : -0.5;
    const f = Math.hypot(toArm.x, toArm.z);
    const d = Math.min(Math.hypot(f, toArm.y), UPPER + FORE - 0.05);
    const bend = Math.acos(Math.max(-1, Math.min(1, (d * d - UPPER * UPPER - FORE * FORE) / (2 * UPPER * FORE))));
    const swing = Math.atan2(f, -toArm.y) - Math.atan2(FORE * Math.sin(bend), UPPER + FORE * Math.cos(bend));
    return [-swing, -bend, Math.atan2(toArm.x, toArm.z), 0, 0];
  }
  // A hold (boss.hold) with his hands at points: `right` and `left` each a point, or a function of (t, elapsed)
  // giving one, or null (that arm left at his side); `twist` turns the right wrist (t, elapsed). His hands go
  // there from where they are, straight, over EASE s (not swung round by the joints, through what is between).
  // (Behind the counter an arm not at work rests on its edge: let fall, it would swing through the cabinet.)
  const EASE = 0.25;
  const handsAt = (right, left, twist = null) => {
    const at = (p, t, e) => (typeof p === "function" ? p(t, e) : p);
    const [t0, from] = [clock.t, hand.map(now)];
    const eased = (i, p) => {
      const k = (clock.t - t0) / EASE;
      return k >= 1 || boss.away ? p : pathAt([[0, from[i]], [1, p]], k);
    };
    return (t, e) => {
      const [r, l] = [right ?? (isBehind() ? onEdge : null), left ?? (isBehind() ? onEdgeLeft : null)];
      const arms = [r ? reach(0, eased(0, at(r, t, e))) : null, l ? reach(1, eased(1, at(l, t, e))) : null];
      if (twist && arms[0]) arms[0][4] = twist(t, e);
      return arms;
    };
  };

  /* ----- the tricycle: along its way, and him on it ----- */
  // The way in: up the lane from the street, then round into its place (a curve through ROUTE_BEND, turning
  // as it goes). As points [x, z, yaw] every voxel or so along it.
  const way = (() => {
    const pts = [];
    for (let z = STREET.z + 8; z > ROUTE_TOP[1]; z -= 1) pts.push([LANE, z, Math.PI]);
    const [A, B, E] = [ROUTE_TOP, ROUTE_BEND, [PARKED.x, PARKED.z]];
    for (let k = 0; k <= 60; k++) {
      const u = k / 60;
      const p = [0, 1].map((i) => (1 - u) ** 2 * A[i] + 2 * u * (1 - u) * B[i] + u * u * E[i]);
      pts.push([p[0], p[1], Math.PI + (PARK_YAW + 2 * Math.PI - Math.PI) * u]);
    }
    return pts;
  })();
  const wayLength = way.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - way[i - 1][0], p[1] - way[i - 1][1]) : 0), 0);
  // Where along it (0 the street, 1 parked) is `s` voxels.
  function wayAt(s) {
    let left = Math.max(0, s);
    for (let i = 1; i < way.length; i++) {
      const d = Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]);
      if (left <= d) {
        const k = left / d;
        return way[i - 1].map((v, j) => v + (way[i][j] - v) * k);
      }
      left -= d;
    }
    return way.at(-1);
  }
  let riding = false; // (him on the saddle)
  const cartFade = { rig: { group: S.cart }, fade: 1 }; // (the tricycle faded in or out with him, as fade.js does people)
  let along = wayLength; // where the cart is along its way
  const pedal = { phase: 0 };
  function cartTo(s) {
    const before = along;
    along = Math.min(wayLength, Math.max(0, s));
    const [x, z, yaw] = wayAt(along);
    S.place(x, z, yaw);
    S.roll(along - before);
  }
  // Sat on the saddle: where it is now, facing the way it faces, his feet on the pedals.
  function seatOn(a) {
    const { x, z, yaw } = S.at;
    const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
    const [lx, lz] = [0, 20];
    Object.assign(a, { x: x + lx * c + lz * s, z: z - lx * s + lz * c, y: 7.2 });
    a.snap(yaw);
  }
  // Anyone (but him) in the way of the cart, from `behind` voxels back along its way to `ahead` voxels on
  // (past its front): on its way or near it.
  // (The stray cat in the way is startled off by his bell: home.street.)
  function inTheWay(behindBy, ahead, ring = false) {
    const pts = [];
    for (let s = along - behindBy; s <= along + ahead + 34; s += 6) pts.push(wayAt(Math.min(wayLength, Math.max(0, s))));
    const there = home.actors.filter((o) => o !== boss && !o.away && pts.some(([x, z]) => Math.hypot(o.x - x, o.z - z) < 15));
    if (ring && there.some((o) => o.stray)) home.street?.shoo({ x: S.at.x, z: S.at.z });
    return there.length > 0;
  }

  /* ----- his day ----- */
  let phase = "away"; // "away", "coming", "setting", "open", "packing", "going"
  let job = null; // what he is doing (a generator moved on a frame at a time)
  let jobName = "";
  let since = 0; // (the time that job started)
  const deals = []; // { customer, seat, stage: "ordered" | "cooking" | "served" | "eating" | "done", bowl }
  const seats = [null, null, null]; // who has each stool
  let tray = 0; // wontons made, on the tray
  let fed = -Infinity; // (the dog, a biscuit)
  let lastCall = t();
  const ahead = [0, 12, 0]; // (where he looks while at work)
  // What was clicked on the stall: the tray, for him to see to between jobs (another wonton); the bell or the
  // code to pay by, a look over at it, pleased (and a thank-you for the beep).
  let poke = null;
  let glancing = null; // [where, till when]
  const glance = (at, secs) => (glancing = [at, t() + secs]);
  S.poked = (what) => {
    if (boss.away || phase === "coming" || phase === "going") return;
    if (what === "tray") poke = what;
    else {
      glance(what === "bell" ? S.spot.bell() : S.spot.qr(), 1.4);
      if (what === "qr") say("heart", 1.2);
    }
  };
  S.taken = (k) => !!seats[k];

  const say = (what, secs = 1.6) => {
    boss.show("say", `room-say room-say-${what}`);
    boss.talkUntil = t() + secs;
  };

  // Up the lane from the street and round into his place, riding (the canopy wound down over the counter, the
  // crate of bowls on it); a hop down off the saddle, back from the cart, along behind it and up to the
  // counter.
  function* come() {
    phase = "coming";
    S.shown(true);
    S.set({ lid: true, flame: false, canopy: 0 });
    S.crate();
    S.used(0);
    along = 0;
    cartTo(0);
    boss.away = false;
    setFade(boss, 1);
    riding = true;
    boss.seated = true;
    boss.hold = ARMS.handlebars;
    setFade(cartFade, 0);
    let rang = -Infinity;
    let held = 0; // (how long he has waited: on after a while anyway)
    while (along < wayLength) {
      // (slowing for the turn and coming to a stop in his place; waiting, the bell rung, for anyone in the way)
      if (inTheWay(20, 10) && held < 30) {
        held += clock.dt;
        if (t() - rang > 2.5) {
          rang = t();
          boss.pop("room-pop room-pop-note");
          inTheWay(20, 10, true);
        }
        boss.legs = pedalling(pedal.phase);
        yield;
        continue;
      }
      const left = wayLength - along;
      const v = RIDE * Math.min(1, 0.25 + left / 40);
      cartTo(along + v * clock.dt);
      pedal.phase += (v / 3) * clock.dt;
      boss.legs = pedalling(pedal.phase);
      setFade(cartFade, Math.min(1, along / 14));
      setFade(boss, Math.min(1, along / 14));
      yield;
    }
    setFade(cartFade, 1);
    yield* wait(boss, 0.4);
    yield* hop(false);
    for (const p of WAY_ROUND) yield* stepTo(boss, p, 0.9);
    boss.hold = handsBefore();
    yield* stepTo(boss, behind(STALL.boss.x0), 0.9);
  }
  // Off the saddle (a hop down beside it, on his side), or on.
  const OFF = (() => {
    const p = toWorld([-14.5, 0, 20]);
    return [p[0], p[2]];
  })();
  const BACK_Z = STALL.boss.z - 2.6; // (behind the cart, clear of its corner)
  const WAY_ROUND = [
    [OFF[0], BACK_Z],
    [STALL.boss.x0, BACK_Z],
  ];
  function* hop(on) {
    const seat = () => {
      seatOn(boss);
      return [boss.x, boss.z];
    };
    const [from, to] = on ? [[boss.x, boss.z], seat()] : [seat(), OFF];
    const [y0, y1] = on ? [0, 7.2] : [7.2, 0];
    riding = false;
    Object.assign(boss, { legs: null, seated: false, hold: null });
    boss.face(Math.atan2(to[0] - from[0], to[1] - from[1]) + (on ? Math.PI : 0));
    for (const t0 = t(); t() - t0 < 0.45; ) {
      const k = Math.min(1, (t() - t0) / 0.45);
      const e = k * k * (3 - 2 * k);
      Object.assign(boss, { x: from[0] + (to[0] - from[0]) * e, z: from[1] + (to[1] - from[1]) * e, y: y0 + (y1 - y0) * e + 6 * Math.sin(Math.PI * k) });
      yield;
    }
    boss.y = y1;
    if (on) {
      riding = boss.seated = true;
      boss.hold = ARMS.handlebars;
    }
  }

  // Set out: the canopy wound up, the crate of bowls down off the counter to the ground behind him, the lid off,
  // the burner lit. (The table and the stools are the flower shop's: the boy puts them out, hours.js.)
  function* setUp() {
    phase = "setting";
    yield* crank(true);
    yield* crateTo(true);
    yield* lid(true);
    yield* wait(boss, 0.3);
    yield* knob(() => S.set({ flame: true }));
    yield* wait(boss, 0.4);
    phase = "open";
  }

  // Packing up: the last bowls back and put by, the burner out, the lid on, the crate up onto the counter (the
  // used bowls in it), the canopy wound down; along behind the cart to the saddle, a hop up onto it, and
  // backwards down the way it came, his feet going, and off down the street.
  function* pack() {
    phase = "packing";
    yield* until(() => seats.every((s) => !s) && !deals.some((d) => d.stage === "returning"), 40); // (the last of them off)
    while (deals.some((d) => d.stage === "returned")) yield* clearReturned();
    yield* knob(() => S.set({ flame: false }));
    yield* lid(false);
    C.clear();
    tray = 0;
    yield* crateTo(false);
    yield* crank(false);
    yield* go();
  }
  function* go() {
    phase = "going";
    boss.hold = handsBefore();
    yield* to([STALL.boss.x0]);
    yield* stepTo(boss, [boss.x, BACK_Z], 0.9);
    boss.hold = null;
    for (const p of [...WAY_ROUND].reverse()) yield* stepTo(boss, p, 0.9);
    yield* stepTo(boss, OFF, 0.7);
    yield* hop(true);
    let [held, rang] = [0, -Infinity];
    while (along > 0) {
      // (waiting for anyone in the way, the bell rung now and then)
      if (inTheWay(30, 2) && held < 60) {
        held += clock.dt;
        if (t() - rang > 2.5) {
          rang = t();
          boss.pop("room-pop room-pop-note");
          inTheWay(30, 2, true);
        }
        yield;
        continue;
      }
      cartTo(along - PUSH * clock.dt);
      pedal.phase -= (PUSH / 3) * clock.dt;
      boss.legs = pedalling(pedal.phase);
      const k = Math.min(1, along / 14);
      setFade(cartFade, k);
      setFade(boss, k);
      yield;
    }
    setFade(cartFade, 1); // (its own materials back: then out of the scene)
    S.shown(false);
    gone();
  }
  function gone() {
    phase = "away";
    boss.away = true;
    riding = false;
    Object.assign(boss, { legs: null, seated: false, hold: null, lie: false, lean: 0, walking: false, y: 0 });
    setFade(boss, 0);
    resetShown();
  }

  // The canopy wound up (or down) by its crank under the counter's edge, his hand going round, a look up at it.
  function* crank(up) {
    yield* to([STALL.boss.x0 + 2]);
    const c = () => [boss.x - 3.5, 11.6, -82.8];
    yield* work(handsAt(glide(now(hand[0]), overEdge, 0.25), null), 0.25);
    yield* work(handsAt(glide(overEdge, c, 0.3), null), 0.3, 0.06);
    boss.hold = handsAt((t) => {
      const [x, y, z] = c();
      return [x, y + 0.8 * Math.sin(t * 7), z - 0.8 * Math.cos(t * 7)];
    }, null);
    boss.look = S.spot.roof();
    for (const t0 = t(); t() - t0 < 2.4; ) {
      const k = Math.min(1, (t() - t0) / 2.4);
      S.set({ canopy: up ? k : 1 - k });
      yield;
    }
    S.set({ canopy: up ? 1 : 0 });
    boss.look = null;
    yield* work(handsAt(glide(now(hand[0]), overEdge, 0.3), null), 0.3);
    boss.hold = null;
  }
  // The crate of bowls from the counter (where it rides) round to the ground behind him (`down`), or back: in
  // both hands by its near side, down on a knee to the ground.
  function* crateTo(down) {
    const onCounter = [...fillAt()];
    const ground = S.spot.crate();
    const grips = (p) => sides(p, CRATE.h + 0.4, CRATE_RIM);
    if (down) {
      yield* to(onCounter);
      yield* work(handsAt(...grips(onCounter)), 0.4, LEAN);
      carried.crate = true;
      yield* work(handsAt(...grips(above(onCounter, 1.5))), 0.3);
      boss.hold = handsAt(before(-2.4, 19, 5), before(2.4, 19, 5));
      yield* roundTo(TURN_AT, true);
      boss.lie = true;
      yield* work(handsAt(...grips(ground)), 0.6);
      carried.crate = false;
      S.crate(ground, Math.PI);
      boss.hold = null;
      yield* wait(boss, 0.2);
      boss.lie = false;
      yield* wait(boss, 0.3);
      yield* backTo();
    } else {
      yield* roundTo(TURN_AT);
      boss.lie = true;
      yield* work(handsAt(...grips(ground)), 0.5);
      carried.crate = true;
      S.used(0); // (the used ones into it)
      boss.hold = handsAt(before(-2.4, 19, 5), before(2.4, 19, 5));
      yield* wait(boss, 0.2);
      boss.lie = false;
      yield* wait(boss, 0.3);
      yield* backTo(true);
      yield* to(onCounter);
      yield* work(handsAt(...grips(above(onCounter, 1.5))), 0.35);
      yield* work(handsAt(...grips(onCounter)), 0.3, LEAN);
      carried.crate = false;
      S.crate();
      boss.hold = null;
    }
  }
  // Back to the counter from behind it (anywhere back there), his hands held before him.
  function* backBehind() {
    if (isBehind()) return;
    boss.hold = handsBefore();
    yield* stepTo(boss, behind(boss.x), 0.9);
  }
  const isBehind = () => Math.abs(boss.z - STALL.boss.z) < 1 && boss.x >= STALL.boss.x0 - 1 && boss.x <= STALL.boss.x1 + 1;

  // Along behind the counter to where his `hand` (0 the right, 1 the left, null both) best reaches `at`
  // (world), facing the counter (the street): a side-step or two, as a cook does; whatever is in his hand
  // carried before him meanwhile.
  function* to(at, hand = null) {
    if (!isBehind()) yield* backBehind();
    yield* turn(boss, 0);
    const [x] = behind(at[0] + (hand === 0 ? 4.5 : hand === 1 ? -4.5 : 0));
    if (Math.abs(boss.x - x) > 0.5) {
      boss.hold = resting = shown.handful || shown.pinch ? carry() : ready();
      boss.lean = 0;
      yield* sidestep(x);
    }
  }
  // Along x to `x`, facing as he is.
  function* sidestep(x) {
    Object.assign(boss, { walking: true, pace: 0.55 });
    try {
      for (;;) {
        const stride = boss.speed * boss.pace * clock.dt;
        if (Math.abs(x - boss.x) <= stride) break;
        boss.x += Math.sign(x - boss.x) * stride;
        yield;
      }
      boss.x = x;
    } finally {
      Object.assign(boss, { walking: false, pace: 1 });
    }
  }
  function* work(arms, secs, lean = 0) {
    boss.hold = arms;
    boss.since = t();
    boss.lean = lean;
    yield* wait(boss, secs);
    boss.lean = 0;
  }
  const potAt = () => S.spot.pot();
  const fillAt = () => S.spot.fill();
  const trayAt = (k) => S.spot.tray(k);
  const above = ([x, y, z], dy = HAND_UP) => [x, y + dy, z];
  const now = (v) => [v.x, v.y, v.z];
  // A point going from `a` to `b` (each a point or a function giving one) over `secs` from now, eased.
  const glide = (a, b, secs = 0.35) => {
    const t0 = t();
    const at = (p) => (typeof p === "function" ? p() : p);
    return () => pathAt([[0, at(a)], [1, at(b)]], (t() - t0) / secs);
  };
  // Over the pot, for his left hand: just over the rim on its near side (under his chin), his forearm outside
  // it; `dx` along the rim, `dz` back from it.
  const overPot = (dx = 0, dz = 0) => {
    const [x, , z] = potAt();
    return [x - 2 + dx, STALL_POT.rim + 0.6 + HAND_UP, z - STALL_POT.r - 0.2 - Math.abs(dz)];
  };
  // His hands resting on the counter's edge (where they are between jobs, behind it: from there they go to
  // what he works at over it, not up through the cabinet from his sides); the right raised a little over it,
  // carrying something. They are just over the edge before him as he faces it, and held so before him as he
  // turns or goes along it (lifted a little: his hands come after him a moment late).
  const EDGE = STALL.boss.z + 6.2; // (the counter's edge, a little over it, from where he stands)
  // (drawn in as he turns, so that neither comes any nearer the counter than its edge)
  const before = (side, up, ahead = EDGE - STALL.boss.z) => () => {
    const [c, s] = [Math.cos(boss.yaw), Math.sin(boss.yaw)];
    const lift = boss.walking ? 2 : 0;
    const out = ahead - Math.abs(side * s);
    return [boss.x + side * c + out * s, up + lift, boss.z - side * s + out * c];
  };
  const onEdge = before(-4.2, 15.5 + HAND_UP);
  const onEdgeLeft = before(4.2, 15.5 + HAND_UP);
  const ready = () => handsAt(onEdge, onEdgeLeft);
  const handsBefore = ready; // (the same, but his own: not let go of as he leaves the counter)
  const carry = () => handsAt(before(-4, 18.4, 5.6), onEdgeLeft);
  // (his hands back on the counter's edge as soon as he lets go of a thing, behind it: not let fall)
  let resting = null;
  function rest() {
    if (!boss.away && !riding && isBehind() && !boss.hold) boss.hold = resting = ready();
    else if (boss.hold && boss.hold === resting && !isBehind()) boss.hold = resting = null;
  }
  // His two hands at the near rim of a bowl at `p` (as he faces it), `dy` over it (or of the crate: `rim`).
  const sides = (p, dy, rim = RIM) => {
    const [fx, fz] = [Math.sin(boss.yaw), Math.cos(boss.yaw)];
    const [cx, cz] = [p[0] - fx * rim, p[2] - fz * rim];
    return [-1, 1].map((s) => [cx + s * 1.8 * fz, p[1] + dy, cz - s * 1.8 * fx]);
  };
  // Back from the counter and round to the crate (or the basin) behind him; and back. (He turns where his big
  // head, going round, clears the poles and the tree: TURN_AT.)
  const TURN_AT = [145, STALL.boss.z - 5];
  function* roundTo(at, keep = false) {
    yield* to(TURN_AT);
    if (!keep && !shown.bowl) boss.hold = handsBefore();
    yield* stepTo(boss, TURN_AT, 0.9);
    yield* turn(boss, Math.PI);
    if (Math.abs(at[0] - boss.x) > 0.5) yield* sidestep(at[0]);
  }
  function* backTo(keep = false) {
    if (!keep && !shown.bowl) boss.hold = handsBefore();
    if (Math.abs(boss.x - TURN_AT[0]) > 0.5) yield* sidestep(TURN_AT[0]);
    yield* turn(boss, 0);
    yield* stepTo(boss, behind(boss.x), 0.9);
  }
  // Under the counter (the burner's knob), and up behind its edge.
  const under = () => [boss.x - 4, 11.6, -83];
  const overEdge = () => [boss.x - 4, 16.4, -83];

  // The lid off the pot (lifted at its near edge, and put away under the counter), or back on.
  function* lid(off) {
    yield* to(potAt(), 1);
    if (!off) S.set({ lid: true });
    const t0 = t();
    const k = () => Math.min(1, (t() - t0) / 0.8);
    const raised = () => {
      const u = Math.max(0, Math.min(1, (k() - 0.3) / 0.5));
      return off ? u : 1 - u;
    };
    boss.hold = handsAt(onEdge, () => above(overPot(), 0.1 + 0.8 * raised()));
    while (k() < 1) {
      S.lift(raised());
      yield;
    }
    S.lift(0);
    if (off) S.set({ lid: false });
    boss.hold = null;
  }
  // The burner's knob, under the counter's edge below the pot, turned; `then`, half way.
  function* knob(then) {
    yield* to(potAt(), 1);
    yield* work(handsAt(glide(now(hand[0]), overEdge, 0.25), null), 0.25);
    yield* work(handsAt(glide(overEdge, under, 0.3), null, (t) => 0.35 * Math.sin(t * 6)), 0.5, 0.06);
    then();
    yield* work(handsAt(under, null, (t) => 0.35 * Math.sin(t * 6)), 0.4, 0.06);
    yield* work(handsAt(glide(under, overEdge, 0.3), null), 0.3);
    boss.hold = null;
  }

  // A wonton made (WRAP s), and onto the tray: a wrapper flat on his left hand over the board, a dab of pork
  // from its bowl smeared on with the blade in his right (一抹), the left closing round it (一捏), the right
  // taking it to the tray.
  function* wrapOne() {
    yield* to(S.spot.board());
    const f = S.spot.filling();
    const w = S.spot.wrappers();
    const p = trayAt(tray);
    const palm = [w[0] - 0.2, 17.1, w[2] - 0.2];
    const shut = [palm[0] + 0.2, palm[1] + 0.5, palm[2]];
    const over = [f[0] + 0.3, 19.6, f[2] - 0.8];
    const dip = [f[0] + 0.3, 18.9, f[2] - 0.4];
    const smear = (dx) => [palm[0] - 0.6 + dx, palm[1] + 0.6, palm[2]];
    const cup = [palm[0] - 0.3, palm[1] + 1.1, palm[2]];
    const RIGHT = [
      [0, over],
      [0.12, dip],
      [0.2, over],
      [0.3, smear(-0.3)],
      [0.36, smear(0.3)],
      [0.42, smear(-0.3)],
      [0.5, cup],
      [0.62, cup],
      [0.74, above(p, HAND_UP + 1.2)],
      [0.8, above(p)],
      [0.88, above(p, HAND_UP + 1.2)],
      [1, over],
    ];
    const LEFT = [
      [0, palm],
      [0.45, palm],
      [0.55, shut],
      [0.64, shut],
      [0.8, palm],
    ];
    boss.hold = handsAt(
      (t, e) => pathAt(RIGHT, e / WRAP),
      (t, e) => pathAt(LEFT, e / WRAP)
    );
    boss.since = t();
    boss.lean = LEAN;
    shown.blade = true;
    for (let k = 0; k < 0.8; k = (t() - boss.since) / WRAP) {
      shown.wrapper = k < 0.5;
      shown.ball = k >= 0.5 && k < 0.62 ? 1 : k >= 0.62 ? 0 : null;
      yield;
    }
    shown.wrapper = false;
    shown.ball = null;
    C.add("tray", p);
    tray++;
    yield* wait(boss, 0.2 * WRAP);
  }
  function* wrapSome(n) {
    for (let i = 0; i < n && tray < S.spot.trayFull; i++) yield* wrapOne();
    shown.blade = false;
    boss.hold = null;
    boss.lean = 0;
  }
  // A handful off the tray (the last made first) in his right hand, passed to his left before the pot and
  // dropped in from it, a few at a time.
  function* handfulIn(n) {
    const take = Math.min(n, tray);
    if (!take) return;
    const last = trayAt(tray - 1);
    yield* to(last, 0);
    yield* work(handsAt(glide(now(hand[0]), above(last)), null), 0.45, LEAN);
    C.all
      .filter((w) => w.at === "tray")
      .slice(-take)
      .forEach((w) => C.remove(w));
    tray -= take;
    Object.assign(shown, { handful: take, handfulIn: 0 });
    yield* to(potAt(), 1);
    const meet = (dx) => () => [boss.x + dx, 18.4, -81.6];
    yield* work(handsAt(meet(-0.7), meet(0.7)), 0.4);
    shown.handfulIn = 1;
    yield* work(handsAt(glide(now(hand[0]), onEdge), glide(now(hand[1]), overPot(0.5, 0.5))), 0.45);
    const [px, , pz] = potAt();
    for (let i = 0; i < take; i++) {
      const h = hand[1];
      const w = C.add("pot", [h.x, h.y, h.z]);
      if (w) C.drop(w, [h.x + (px - h.x) * 0.3 + rnd(-0.8, 0.8), h.y - 0.5, h.z + (pz - h.z) * 0.3 + rnd(-0.8, 0.8)]);
      shown.handful = take - i - 1;
      yield* wait(boss, 0.12);
    }
    boss.hold = null;
  }
  // A stir round the pot with the ladle, his left hand going round over the rim, the ladle's bowl in the water.
  function* stir(secs = 2.4) {
    yield* to(potAt(), 1);
    const [px, py, pz] = potAt();
    const t0 = t();
    const a = () => (t() - t0) * 4;
    const head = () => [px + Math.cos(a()) * 3.2, py - 0.4, pz + Math.sin(a()) * 2.8];
    const grip = () => overPot(0.9 * Math.cos(a()), 0.6 * Math.sin(a()));
    shown.ladle = glide(above(head(), 2.5), head, 0.3);
    boss.hold = handsAt(onEdge, grip);
    boss.since = t();
    C.stir(1.2);
    yield* wait(boss, secs);
    shown.ladle = null;
    boss.hold = null;
  }
  // A clean bowl from the crate behind him (round to it, down on a knee to it, both hands at its rim) to the
  // place it is filled; a pinch from the laver's tub and the shrimp's, into it.
  let atFill = null; // (the bowl at the place it is filled, his)
  function* bowlReady() {
    const bowl = C.bowls.find((b) => b.free());
    if (!bowl) return null;
    const top = above(S.spot.crate(), CRATE.top);
    yield* roundTo(TURN_AT);
    boss.lie = true;
    yield* work(handsAt(...sides(top, GRIP)), 0.5);
    bowl.set({ bits: false, level: 0, onion: false });
    bowl.fill(0);
    bowl.by = null;
    Object.assign(shown, { bowl, bowlIn: null });
    yield* work(handsAt(...sides(above(top, 2), GRIP)), 0.25);
    boss.lie = false;
    boss.hold = ARMS.bowl;
    yield* wait(boss, 0.3);
    yield* backTo(true);
    const f = fillAt();
    yield* to(f);
    yield* work(handsAt(...sides(above(f, 1.2), GRIP)), 0.35);
    yield* work(handsAt(...sides(f, GRIP)), 0.25);
    Object.assign(shown, { bowl: null });
    bowl.place(...f);
    atFill = bowl;
    for (const name of ["laver", "shrimp"]) yield* pinch(name);
    yield* sprinkle();
    bowl.set({ bits: true });
    return bowl;
  }
  // A pinch from tub `name`, in his fingers; sprinkled into the bowl at the place it is filled.
  function* pinch(name) {
    const tub = S.spot.tub(name);
    yield* to(tub, 0);
    yield* work(handsAt((t, e) => [tub[0], 17.25 + HAND_UP + 0.5 * Math.abs(Math.cos(e * 5)), tub[2]], null), 0.6, LEAN);
    shown.pinch = true;
  }
  function* sprinkle() {
    const f = fillAt();
    yield* to(f, 0);
    yield* work(handsAt((t, e) => [f[0] - 0.4 + 0.3 * Math.sin(e * 14), f[1] + 3.6, f[2]], null), 0.5, LEAN / 2);
    shown.pinch = false;
    boss.hold = null;
  }
  // The cooked ones (up to `n`) scooped out with the strainer and shaken off, and tipped into the bowl; broth
  // ladled over; spring onion on top. (His left hand over the pot, or over the counter between it and the
  // bowl: the tools reach the rest.)
  function* fillBowl(bowl, n) {
    yield* to(potAt(), 1);
    const [px, py, pz] = potAt();
    const b = bowl.surface();
    const between = [b[0] + 4.2, 19.4, -81.2];
    // (a sweep round under the floating ones, the strainer's basket gathering them)
    const t0 = t();
    const a = () => Math.min(1, (t() - t0) / 1.4) * Math.PI * 1.6;
    const sweep = () => [px + Math.cos(a()) * 2.8, py - 0.6, pz + Math.sin(a()) * 2.4];
    const grip = () => overPot(0.8 * Math.cos(a()), 0.5 * Math.sin(a()));
    shown.strainer = glide(above(sweep(), 2.5), sweep, 0.3);
    boss.hold = handsAt(onEdge, grip);
    boss.since = t();
    yield* wait(boss, 1.4);
    const caught = C.all.filter((w) => w.at === "pot" && w.cooked >= 1).slice(0, n);
    caught.forEach((w) => C.remove(w));
    inStrainer.count = caught.length;
    C.splash(px, pz, 0.4);
    // Up out of the water, shaken off over the pot.
    const shake = (t) => 0.25 * Math.sin(t * 26);
    const lifted = [px - 1, py + 3.6, pz - 1.5];
    shown.strainer = glide(sweep(), lifted, 0.3);
    boss.hold = handsAt(onEdge, glide(grip(), above(overPot(), 0.6), 0.3));
    yield* wait(boss, 0.3);
    shown.strainer = () => [lifted[0], lifted[1] + shake(t()), lifted[2]];
    boss.hold = handsAt(onEdge, (t) => above(overPot(), 0.6 + shake(t)));
    yield* wait(boss, 0.6);
    // Over to the bowl and tipped in.
    const tip = [b[0] + 0.4, b[1] + 3.2, b[2]];
    shown.strainer = glide(lifted, tip, 0.45);
    boss.hold = handsAt(onEdge, glide(now(hand[1]), between, 0.45));
    yield* wait(boss, 0.6);
    bowl.fill(caught.length);
    inStrainer.count = 0;
    yield* wait(boss, 0.2);
    shown.strainer = null;
    // The broth: a ladle of it from the pot, poured in.
    const dip = [px - 1.5, py - 0.5, pz - 1];
    const pour = [b[0] + 0.6, b[1] + 2.6, b[2]];
    shown.ladle = glide(tip, dip, 0.4);
    boss.hold = handsAt(onEdge, glide(between, overPot(0.4, 0), 0.4));
    yield* wait(boss, 0.5);
    C.splash(dip[0], dip[2], 0.25);
    shown.ladle = glide(dip, pour, 0.45);
    boss.hold = handsAt(onEdge, glide(overPot(0.4, 0), between, 0.45));
    yield* wait(boss, 0.45);
    for (const t0 = t(); t() - t0 < 0.7; ) {
      bowl.set({ level: Math.min(1, (t() - t0) / 0.7) });
      yield;
    }
    shown.ladle = null;
    boss.hold = null;
    // The spring onion.
    yield* pinch("onion");
    yield* sprinkle();
    bowl.set({ onion: true });
    bowl.hot = 1;
  }

  // An order cooked: or all those waiting together (three stools: three at most), the wontons for them all in
  // the pot at once, then a bowl at a time made up and pushed across to the front for them to fetch.
  function* cook() {
    const batch = deals.filter((d) => d.stage === "ordered").slice(0, 3);
    if (!batch.length) return;
    batch.forEach((d) => (d.stage = "cooking"));
    say("bowl");
    boss.nod = 0.25;
    yield* wait(boss, 0.5);
    boss.nod = 0;
    try {
      const need = PER_BOWL * batch.length;
      if (tray < need) {
        // (made quickly while the first lot cooks)
        yield* wrapSome(Math.min(need - tray, 4));
      }
      for (let dropped = 0; dropped < need && (tray > 0 || C.inPot().length < need); ) {
        if (tray === 0) yield* wrapSome(HANDFUL);
        const n = Math.min(HANDFUL, need - dropped, tray);
        if (n <= 0) break;
        yield* handfulIn(n);
        dropped += n;
      }
      yield* stir(2);
      for (const d of batch) {
        // (the place a bowl is filled, and the counter's front, free: anyone's empty bowl taken back first)
        while (deals.some((o) => o.stage === "returned")) yield* clearReturned();
        yield* until(() => laneFree(), 40);
        d.bowl = yield* bowlReady();
        if (!d.bowl) continue;
        yield* until(() => C.cookedCount() >= Math.min(PER_BOWL, C.inPot().length), 25);
        yield* stir(1.2);
        yield* fillBowl(d.bowl, PER_BOWL);
        if (d.stage === "gone") yield* putBy(d.bowl); // (they have gone: put by)
        else yield* pushAcross(d);
      }
    } finally {
      for (const d of batch) {
        if (d.stage === "cooking") d.stage = "gone";
        if (d.stage === "gone" && deals.includes(d)) deals.splice(deals.indexOf(d), 1);
      }
    }
  }
  // The bowl pushed across the counter from where it was filled: his hands at its near rim going with it a
  // little way, then off it goes on its own, slowing, to the front, where they fetch it; a call to them.
  const PICKUP = () => S.spot.pickup();
  const SLIDE_SECS = 1.2;
  function* pushAcross(d) {
    const f = fillAt();
    yield* to(f);
    yield* work(handsAt(...sides(f, GRIP)), 0.35);
    atFill = null;
    const at = slide(d.bowl, f, PICKUP(), SLIDE_SECS, () => (d.stage = "ready"));
    yield* work(handsAt(...[0, 1].map((i) => () => sides(at(), GRIP)[i])), 0.3, LEAN);
    boss.hold = null;
    yield* until(() => d.stage === "ready" || d.stage === "gone", 3);
    say("bowl", 1.4);
    glance(d.customer.facePoint(), 1.4);
    yield* wait(boss, 0.6);
  }
  // A bowl pushed back across from the front, stopped where they are filled: picked up, round to the used ones
  // behind him and put down with them (or a bowl they never came for).
  function* clearReturned() {
    const d = deals.find((o) => o.stage === "returned");
    if (!d) return;
    const f = fillAt();
    yield* to(f);
    yield* work(handsAt(...sides(f, GRIP)), 0.35, LEAN);
    Object.assign(shown, { bowl: d.bowl, bowlIn: null });
    d.stage = "cleared";
    deals.splice(deals.indexOf(d), 1);
    yield* putBy(d.bowl);
  }
  function* putBy(bowl) {
    if (atFill === bowl) atFill = null;
    Object.assign(shown, { bowl, bowlIn: null });
    boss.hold = ARMS.bowl;
    yield* wait(boss, 0.3);
    const spot = S.spot.used();
    yield* roundTo(spot, true);
    boss.lie = true;
    yield* work(handsAt(...sides(above(spot, 1), GRIP)), 0.5);
    bowl.place(0, 0, 0, false);
    bowl.by = null;
    Object.assign(shown, { bowl: null, bowlIn: null });
    S.used(Math.min(3, ++usedBowls));
    boss.hold = null;
    yield* wait(boss, 0.2);
    boss.lie = false;
    yield* wait(boss, 0.3);
    yield* backTo();
  }
  let usedBowls = 0;
  // Bowls sliding across the counter (pushed over by him, or back by them): each eased to a stop.
  const slides = [];
  function slide(bowl, from, to, secs, then) {
    const s = { bowl, from, to, t0: t(), secs, then, at: [...from] };
    slides.push(s);
    return () => s.at;
  }
  function slideOn() {
    for (const s of [...slides]) {
      const k = Math.min(1, (t() - s.t0) / s.secs);
      const e = 1 - (1 - k) * (1 - k);
      s.at = [0, 1, 2].map((j) => s.from[j] + (s.to[j] - s.from[j]) * e);
      s.bowl.place(...s.at);
      if (k >= 1) {
        slides.splice(slides.indexOf(s), 1);
        s.then();
      }
    }
  }
  // Whether the place a bowl is filled and the counter's front are free: nothing on them, nothing sliding.
  const laneFree = () => !slides.length && !deals.some((d) => d.stage === "ready" || d.stage === "returned");
  const PICKUP_STAND = [144.5, -58.9]; // (where they stand to fetch it, facing the counter: their elbows clear of it)

  // Between times: making wontons (most of all, while the tray is not full), a stir, the counter wiped, a
  // look round, a call to people passing, a word with the girl or the boy, a biscuit for the dog; first, what
  // was clicked on the stall (the tray: another wonton).
  function* idle() {
    if (poke) {
      const p = poke;
      poke = null;
      if (tray < S.spot.trayFull) return yield* wrapSome(1);
      glance(trayAt(tray - 1), 1.2);
      return yield* wait(boss, 1.2);
    }
    const passing = home.actors.filter((o) => o.customer && !o.away && o.passing && Math.hypot(o.x - boss.x, o.z - boss.z) < 120);
    const friend = ["girl", "boy"].map((n) => home.byName[n]).find((o) => !o.away && Math.hypot(o.x - boss.x, o.z - boss.z) < 70);
    const dog = home.byName.collie;
    const r = Math.random();
    const late = !stallOpenAt(home.hour()); // (past closing: only seeing the last of them off)
    if (late) return yield* r < 0.5 ? stir(1.5) : wait(boss, 1);
    if (tray < S.spot.trayFull && r < 0.6) return yield* wrapSome(Math.floor(rnd(3, 7)));
    if (passing.length && t() - lastCall > 25 && r < 0.75) {
      lastCall = t();
      const o = pick(passing);
      boss.look = o;
      say("bowl", 2);
      yield* work(ARMS.wave, 1.6);
      boss.look = null;
      return;
    }
    if (friend && r < 0.8) {
      boss.look = friend;
      boss.talk = true;
      yield* work(ARMS.wave, 1.2);
      boss.hold = null;
      yield* wait(boss, rnd(0.8, 1.6));
      boss.talk = false;
      boss.look = null;
      return;
    }
    if (!dog.away && Math.hypot(dog.x - boss.x, dog.z - boss.z) < 60 && t() - fed > 90 && r < 0.88) {
      fed = t();
      boss.look = dog;
      yield* work(HOLDS.throwOut, 0.7);
      dog.beHappy(2);
      dog.pop();
      boss.look = null;
      boss.hold = null;
      return;
    }
    if (r < 0.92) return yield* stir(rnd(1.5, 2.5));
    if (r < 0.96) {
      // (the counter wiped, the rag going round under his right hand, between the bowl's place and the board)
      const c = above(S.spot.fill(), HAND_UP - 0.1);
      c[0] -= 2.5;
      c[2] -= 1.5;
      yield* to(c, 0);
      shown.rag = true;
      yield* work(handsAt((t) => [c[0] + 1.4 * Math.cos(t * 6), c[1], c[2] + 0.8 * Math.sin(t * 6)], null), rnd(1.5, 2.5), LEAN / 2);
      shown.rag = false;
      boss.hold = null;
      return;
    }
    boss.look = pick(home.actors.filter((o) => !o.away && o !== boss)) ?? null; // (a look round)
    yield* wait(boss, rnd(1, 2));
    boss.look = null;
  }

  // At work: whatever is to be done next; past eleven, once the last bowls are eaten (or after a while
  // anyway), on to packing up.
  const LAST_ORDERS = 45; // s past closing time, at most, before he packs up whoever is still eating
  let winding = false; // (past closing time, seeing the last of them off)
  function* open() {
    let closed = null;
    for (;;) {
      if (!stallOpenAt(home.hour())) closed ??= t();
      winding = closed !== null;
      if (deals.some((d) => d.stage === "ordered")) yield* doing("cook", cook());
      else if (deals.some((d) => d.stage === "returned")) yield* doing("clear", clearReturned());
      else if (closed !== null && (!deals.length || t() - closed > LAST_ORDERS)) return;
      else yield* doing("idle", idle());
      yield;
    }
  }
  function* day() {
    yield* come();
    yield* setUp();
    yield* open();
    yield* pack();
  }

  // (what he is at, for anyone looking: boss.jobName)
  function* doing(name, gen) {
    boss.jobName = name;
    yield* gen;
    boss.jobName = "";
  }
  function start(gen, name) {
    job = gen;
    jobName = name;
    since = t();
  }

  /* ----- a customer's side: ordering, paying, a stool, the bowl fetched, eaten, taken back ----- */

  // `a` comes up to the stall (from where they are), orders and pays, takes a stool; fetches the bowl from the
  // counter's front when he calls, eats, and takes the empty bowl back, pushing it across to him; whether they
  // ate (no stool free, say, or he is not open: not).
  function* visit(a) {
    const p = diners.get(a) ?? dinerProps();
    diners.set(a, p);
    Object.assign(a, { hold: null, lean: 0 }); // (nothing left over from what they were at)
    // (a look at the menu, a step or two back from the counter, and up to it)
    yield* steps.walk(a, PAY_FROM);
    yield* turn(a, Math.PI);
    a.look = S.spot.menu();
    yield* wait(a, rnd(1, 2.2));
    // (at the counter, their eyes on him, or on what they are at: their big heads not turned about, near the
    // poles)
    a.look = boss;
    yield* stepTo(a, STALL.pay, 0.8);
    yield* turn(a, Math.PI);
    const d = life.order(a);
    if (!d) {
      a.pop("room-pop room-pop-question");
      yield* stepTo(a, PAY_FROM, 0.8);
      a.look = null;
      return false;
    }
    const end = () => {
      p.eating = p.scanning = p.drinking = false;
      // (whatever is in their hands put by: interrupted)
      if (p.carrying) {
        p.carrying.place(0, 0, 0, false);
        p.carrying.by = null;
      }
      p.carrying = p.bowl = null;
      a.seated = false;
      a.hold = null;
      a.lean = 0;
      a.show("say", null);
      life.done(d);
    };
    a.cleanups.push(end);
    // "One, please": a word with him; he looks up, and says yes.
    a.show("say", "room-say room-say-bowl");
    a.talk = true;
    boss.look = a;
    yield* wait(a, 1.2);
    a.talk = false;
    a.show("say", null);
    boss.look = null;
    // The phone up to the code on its stand: a beep.
    const qr = S.spot.qr();
    a.look = qr;
    p.scanning = true;
    a.hold = smoothly(a, () => [null, [qr[0], qr[1], qr[2] + 3]]);
    a.since = t();
    yield* wait(a, 1.1);
    a.pop("room-pop room-pop-sparkle");
    yield* wait(a, 0.4);
    p.scanning = false;
    yield* letGo(a);
    a.look = null;
    // To their stool, and sat down on it, waiting (hands on the table, a look over at him now and then).
    const seat = S.spot.seat(d.seat);
    const place = S.spot.place(d.seat);
    const ways = SEAT_FROM[d.seat];
    // (their arms at the table, as they face their place: the spoon hand down into the bowl and up to under their
    // chin, the other in their lap (sat low, their elbows below the table's edge: resting on it, an arm would
    // come up through it); the bowl up in both hands, under their chin, for the last of the broth)
    const [fx, fz] = [Math.sin(seat.yaw), Math.cos(seat.yaw)];
    // (resting in their lap: drawn in, under the table's edge)
    const lap = (s) => [a.x + fx * 3 - s * 3.4 * fz, 9.6, a.z + fz * 3 + s * 3.4 * fx];
    const LAP = () => smoothly(a, () => [lap(-1), lap(1)]);
    const toMouth = () => {
      const [x, y, z] = chinOf(a, p);
      return [x - fx * 2, y - 2.2, z - fz * 2];
    };
    const EAT = () =>
      smoothly(a, (t, e) => {
        const u = spoonful((e % BITE) / BITE);
        const dip = p.bowl.surface();
        const near = [dip[0] - fx * 1.8, dip[1] + 1.2, dip[2] - fz * 1.8]; // (the near side of the bowl)
        return [pathAt([[0, near], [1, toMouth()]], u), lap(1)];
      });
    const DRINK = () =>
      smoothly(a, (t, e) => {
        const lift = Math.min(1, e / 0.5) * 4.5;
        const [cx, cz] = [place[0] - fx * RIM, place[2] - fz * RIM];
        return [-1, 1].map((s) => [cx + s * 1.8 * fz, place[1] + GRIP + lift, cz - s * 1.8 * fx]);
      });
    function* toStool() {
      yield* steps.walk(a, ways[0]);
      for (const w of ways.slice(1)) yield* stepTo(a, w, 0.7);
      yield* stepTo(a, [seat.x, seat.z], 0.6);
      yield* turn(a, seat.yaw);
    }
    function* offStool() {
      a.seated = false;
      yield* wait(a, 0.3);
      for (const w of [...ways].reverse()) yield* stepTo(a, w, 0.8);
    }
    yield* stepTo(a, PAY_FROM, 0.8);
    yield* toStool();
    a.seated = true;
    a.hold = LAP();
    a.since = t();
    const t0 = t();
    while (d.stage !== "ready" && t() - t0 < 150 && phase === "open") {
      if (Math.random() < 0.01) a.look = a.look ? null : boss;
      yield;
    }
    a.look = null;
    a.hold = null;
    if (d.stage === "ready") {
      // Up, to the counter's front for it (both hands at its near rim), and back with it to the stool.
      yield* offStool();
      yield* steps.walk(a, PICKUP_STAND);
      yield* turn(a, Math.PI);
      const pick = PICKUP();
      a.look = pick;
      yield* reachFor(a, p, pick, 0.5, 0.05, 1.2);
      p.carrying = d.bowl;
      d.bowl.by = a;
      d.stage = "eating";
      a.hold = carrying(a);
      yield* wait(a, 0.3);
      yield* stepTo(a, [PICKUP_STAND[0], PICKUP_STAND[1] + 4], 0.7);
      a.look = null;
      yield* toStool();
      yield* reachFor(a, p, place, 0.4, 0.05);
      p.carrying = null;
      d.bowl.place(...place);
      a.seated = true;
      // Eating, a spoonful at a time; the last of the broth from the bowl.
      p.bowl = d.bowl;
      p.eating = true;
      a.hold = EAT();
      a.since = t();
      a.look = p.bowl.surface();
      for (let n = p.bowl.wontons; n > 0 && phase === "open"; n--) {
        const b0 = t();
        let ate = false;
        while (t() - b0 < BITE) {
          const k = (t() - b0) / BITE;
          a.lean = k < 0.3 ? 0.07 : 0.02; // (a little over the bowl: further, their lap's hand would be up into the table)
          a.look = k < 0.3 ? p.bowl.surface() : null;
          if (k > 0.6 && k < 0.72 && Math.random() < 0.15) C.vent(`bite-${a.name}`, [...p.spoon.position.toArray()], 0.4, 6); // (blown on)
          else C.vent(`bite-${a.name}`, null);
          a.talk = k > 0.74 && k < 0.86;
          if (k > 0.78 && !ate) {
            ate = true;
            p.bowl.fill(p.bowl.wontons - 1);
          }
          yield;
        }
        a.nod = 0.1 * Math.random();
      }
      C.vent(`bite-${a.name}`, null);
      a.talk = false;
      p.eating = false;
      a.lean = 0;
      a.hold = DRINK();
      a.since = t();
      p.drinking = true;
      yield* wait(a, 1.6);
      p.bowl.set({ level: 0.15, onion: false });
      p.drinking = false;
      p.bowl.place(...place);
      a.hold = null;
      a.happy = true;
      a.pop("pet-heart");
      yield* wait(a, 1.2);
      a.happy = false;
      // The empty bowl taken up, back to the counter's front, and pushed across to him once nothing is on its
      // way.
      yield* reachFor(a, p, place, 0.35, 0.05);
      p.bowl = null;
      p.carrying = d.bowl;
      d.stage = "returning";
      a.hold = carrying(a);
      yield* offStool();
      yield* steps.walk(a, PICKUP_STAND);
      yield* turn(a, Math.PI);
      a.look = boss;
      a.hold = carrying(a);
      yield* until(() => laneFree() && !atFill, 30);
      a.look = pick;
      yield* reachFor(a, p, pick, 0.4, 0.05, 1.2);
      p.carrying = null;
      slide(d.bowl, pick, fillAt(), SLIDE_SECS, () => (d.stage = "returned"));
      a.lean = 0;
      yield* letGo(a);
      a.look = boss;
      yield* wait(a, 0.4);
      boss.look = a;
      yield* wait(a, 0.6);
      boss.look = null;
      a.look = null;
    } else yield* offStool();
    a.cleanups.splice(a.cleanups.indexOf(end), 1);
    p.eating = p.scanning = p.drinking = false;
    p.carrying = p.bowl = null;
    a.seated = false;
    a.hold = null;
    life.done(d);
    return d.stage === "returning" || d.stage === "returned" || d.stage === "cleared";
  }
  // A customer's hold with their hands at points (`at(t, elapsed)` gives [right, left], either null: let be),
  // got to from where their hands are, up first and then over (not swung up from their sides, through whatever
  // is in front of them: the table's edge, the counter's), over `secs`.
  function smoothly(a, at, secs = 0.4) {
    a.rig.group.updateMatrixWorld(true);
    const from = a.rig.hands.map((h) => h.getWorldPosition(new THREE.Vector3()).toArray());
    const t0 = t();
    return (tt, e) =>
      at(tt, e).map((p, i) => {
        if (!p) return null;
        const k = (t() - t0) / secs;
        if (k >= 1) return reachOf(a, i, p);
        const lifted = [from[i][0], Math.max(from[i][1], p[1] + 1), from[i][2]];
        return reachOf(a, i, pathAt([[0, from[i]], [0.45, lifted], [1, p]], k));
      });
  }
  // A bowl carried before them in both hands, their forearms level (clear of the counter's edge as they turn
  // from it), wherever they go.
  function carrying(a) {
    const close = (s) => {
      const [bx, bz] = [Math.sin(a.yaw), Math.cos(a.yaw)];
      return [a.x + bx * 6 - s * 1.8 * bz, 19, a.z + bz * 6 + s * 1.8 * bx];
    };
    return smoothly(a, () => [close(-1), close(1)], 0.3);
  }
  // Their hands drawn back to before them (off the counter or the table), and let go of.
  function* letGo(a) {
    const [fx, fz] = [Math.sin(a.yaw), Math.cos(a.yaw)];
    const back = (s) => [a.x + fx * 4 - s * 3 * fz, 15, a.z + fz * 4 + s * 3 * fx];
    a.hold = smoothly(a, () => [back(-1), back(1)], 0.3);
    yield* wait(a, 0.3);
    a.hold = null;
  }
  // Their hands to the near rim of a bowl at `at` (as they face it), leaning a little; held `secs`. (`up`: a
  // little over it, at the counter, their forearms clear of its edge: the bowl lifted, or let down that much.)
  function* reachFor(a, p, at, secs, lean, up = 0) {
    const [fx, fz] = [Math.sin(a.yaw), Math.cos(a.yaw)];
    const [cx, cz] = [at[0] - fx * RIM, at[2] - fz * RIM];
    const grip = [-1, 1].map((s) => [cx + s * 1.8 * fz, at[1] + GRIP + up, cz - s * 1.8 * fx]);
    a.hold = smoothly(a, () => grip, Math.max(0.2, secs * 0.8));
    a.since = t();
    a.lean = lean;
    yield* wait(a, secs);
    a.lean = 0;
  }

  // Whether the corner is cleared for him (hours.js), and no one where the cart goes.
  const cornerReady = () => home.grounds.trolley.pose === "afternoon" && !home.life?.hours?.clearing?.();

  const life = {
    boss,
    get phase() {
      return phase;
    },
    deals,
    // How the corner stands, for the floor plans (shop.js): the cart on its way, parked, or not there.
    onLane: () => phase === "coming" || phase === "going",
    parked: () => phase === "setting" || phase === "open" || phase === "packing",
    // Whether he has gone for the night (or not come yet).
    gone: () => phase === "away",
    // Whether he is closing up, past eleven: the clock goes slower meanwhile (shop.js), as it does while the
    // shop is closing up (it is a half hour's work, done at a walk).
    busy: () => (phase === "open" && winding) || phase === "packing" || phase === "going",
    // Whether a customer may order now: he is open and there is a stool free, and not too many waiting.
    canOrder: () =>
      phase === "open" &&
      S.state.furniture &&
      stallOpenAt(home.hour()) &&
      home.hour() < STALL.close - 0.75 &&
      seats.some((s) => !s) &&
      deals.filter((d) => d.stage === "ordered" || d.stage === "cooking").length < 3,
    // `customer` orders a bowl: a stool theirs (the deal says which), and he will cook it.
    order(customer) {
      if (!life.canOrder()) return null;
      const free = seats.map((s, k) => (s ? -1 : k)).filter((k) => k >= 0);
      const seat = customer.name === "girl" && free.includes(0) ? 0 : pick(free);
      seats[seat] = customer;
      const d = { customer, seat, stage: "ordered", bowl: null, at: t() };
      deals.push(d);
      return d;
    },
    // `d`'s customer is off: their stool free again; a bowl never made dropped, one being made put by when it is,
    // one on its way back (or back) left for him; one they had, or that waits at the front, put away.
    done(d) {
      if (seats[d.seat] === d.customer) seats[d.seat] = null;
      if (d.stage === "returning" || d.stage === "returned" || d.stage === "cleared") return;
      if (d.stage === "ready" || d.stage === "eating") {
        d.bowl?.place(0, 0, 0, false);
        if (d.bowl) d.bowl.by = null;
      }
      if (d.stage !== "cooking") {
        d.stage = "gone";
        if (deals.includes(d)) deals.splice(deals.indexOf(d), 1);
      } else d.stage = "gone";
    },
    // Whether the table is done with for the night (the boy may fold it away): no one at it, and no more orders.
    tableFree: () => seats.every((s) => !s) && !(stallOpenAt(home.hour()) && home.hour() < STALL.close - 0.75 && phase === "open"),
    // How far he is from serving (for whoever waits: a look at him now and then).
    step() {
      const h = home.hour();
      // (at work behind the counter, his eyes on the counter ahead of him rather than down at his hands: his
      // face to the street)
      if (!boss.look || boss.look === ahead) {
        boss.look = isBehind() && !boss.away ? ahead : null;
        [ahead[0], ahead[2]] = [boss.x, boss.z + 30];
      }
      if (glancing && t() < glancing[1]) {
        boss.look = glancing[0];
        boss.happy = true;
      } else if (glancing) {
        glancing = null;
        boss.look = null;
        boss.happy = false;
      }
      if (boss.talkUntil && t() > boss.talkUntil) {
        boss.show("say", null);
        boss.talkUntil = 0;
      }
      if (!job && phase === "away" && stallOpenAt(h) && h < STALL.close - 0.5 && cornerReady()) start(day(), "day");
      slideOn();
      if (!job) return rest();
      try {
        if (job.next().done) job = null;
      } catch (e) {
        console.error(`wonton stall: ${jobName}`, e, e.stack);
        job = null;
        life.settle(h); // (put straight)
      }
      rest();
    },
    follow: followAll,
    visit,
    // Diners eating or waiting just now (customers.js: not too many at once).
    diners: () => deals.filter((d) => d.stage !== "returned" && d.stage !== "cleared" && d.stage !== "gone").length,
    // Everything as it would be at hour `h`: open (set out, him at work, the tray half full), or not there.
    settle(h) {
      job = null;
      poke = glancing = null;
      riding = false;
      setFade(cartFade, 1); // (if it was half faded in or out)
      boss.look = null;
      boss.show("say", null);
      deals.length = 0;
      seats.fill(null);
      slides.length = 0;
      atFill = null;
      usedBowls = 0;
      carried.crate = false;
      C.clear();
      resetShown();
      inStrainer.count = 0;
      if (!(stallOpenAt(h) && h - STALL.open >= CATCH)) {
        S.shown(false);
        gone();
        along = 0;
        return;
      }
      S.shown(true);
      along = wayLength;
      cartTo(wayLength);
      S.set({ lid: false, flame: true, canopy: 1, furniture: h < STALL.close - 0.25 });
      S.crate(S.spot.crate(), Math.PI);
      S.used(0);
      boss.away = false;
      setFade(boss, 1);
      Object.assign(boss, { legs: null, seated: false, hold: null, lie: false, lean: 0, y: 0 });
      [boss.x, boss.z] = behind((STALL.boss.x0 + STALL.boss.x1) / 2);
      boss.snap(0);
      tray = Math.floor(S.spot.trayFull * rnd(0.4, 0.8));
      for (let k = 0; k < tray; k++) C.add("tray", trayAt(k));
      phase = "open";
      start(
        (function* () {
          yield* open();
          yield* pack();
        })(),
        "open"
      );
    },
    // Shaken out of what he is doing (clicked: he looks up, pleased).
    sample(on) {
      inHand.count = on ? 1 : 0;
    },
  };
  return life;
}
