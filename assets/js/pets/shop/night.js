/*******************************************************************************
 * The flower shop by night (shop.js): the lamp over the lock-up's door, on
 * from dusk to dawn, a pool of its warm light on the pavement and moths
 * fluttering round it (they scatter at a click, or a cat's leap: street.js);
 * and a brushtail possum who lives up in the plane tree. Once the shop is shut
 * and the street quiet, she comes out along the top of the hoarding now and
 * then, sits and grooms up there, goes back; or she comes down the trunk head
 * first and forages over the pavement, nibbling the petals that have fallen
 * (sitting up to eat, the petal in her paws), till she climbs back up. Anyone
 * coming near, she freezes and stares (her eyes catching the light), and if
 * they come on, she is off up the tree and clings to the trunk out of reach,
 * watching, till they have gone. The stray cat she rears up and hisses at. A
 * click on her (or on the tree) sends her up into the crown.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { ellipsoid, hash, pivotGroup } from "../models/voxels.js";
import { rnd, pick, clamp, wrap } from "../stage.js";
import { part, box, meshOf, voxels, paletteOf } from "./kit.js";
import { LOCKUP, MURAL, TREE } from "./layout.js";

// The lamp: a bulkhead on the lock-up's front over its door, and where its light falls.
const LAMP = [(LOCKUP.door[0] + LOCKUP.door[1]) / 2, 43, LOCKUP.z1 + 0.5];
const MOTHS = 5;

// The possum's ways: up the trunk (its front, `trunkAt(y)`), into the crown at the top; along the top rail of
// the hoarding (RAIL: out from under the crown at x0, as far as x1 at most); on the pavement, round the pots
// by the tree (FOOT, CORNER) and down the right-hand edge (LANE) to the open ground (GROUND: before the
// house plants, along the right-hand edge, along the front), clear of the flowers' stands.
const TOP = 86; // up in the crown, out of sight
const trunkAt = (y) => [TREE.x - y * 0.06, TREE.z + (y < 4 ? 5.2 : 4.2 - y * 0.012) + 0.6];
const RAIL = { y: MURAL.h + 1.5, z: MURAL.z + 2, x0: 150, x1: 30 };
const FOOT = [TREE.x + 4, TREE.z + 8];
const CORNER = [176, -78];
const LANE = 175;
const GROUND = [
  { x: [36, 160], z: [-46, -40] },
  { x: [158, 172], z: [-30, 50] },
  { x: [90, 172], z: [62, 68] },
];
const NEAR = 60; // anyone this near: she freezes and stares
const CLOSE = 36; // this near and she is off up the tree
const CAT = 38; // the cat this near: she rears up at it

const COLORS = paletteOf({
  fur: "#8f8b87",
  furLight: "#9f9b96",
  furDark: "#76726e",
  belly: "#ece3d2",
  face: "#b7b2ac",
  mask: "#57524f",
  ear: "#4f4a47",
  earPink: "#d9a39c",
  nose: "#e6a0a6",
  eye: "#0f0d0e",
  glint: "#ffffff",
  paw: "#b0948c",
  tail: "#2c2825",
  tailLight: "#46413d",
  lampBody: "#2b2d30",
  lampRim: "#3d4044",
});

// A soft round glow (white at the middle to nothing at the edge), for the lamp's halo and the pool of its light.
function glowTexture() {
  const c = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// The night's things, a part at a time (a yield after each, as the other builders).
export function* buildingNight(shared) {
  const group = new THREE.Group();

  /* ----- the lamp, its halo on the wall and its pool of light on the pavement ----- */
  const lampBody = voxels(
    (p) => {
      // A cast back plate, the glass in its rim, a hood over the top.
      box(p, [-5, 5], [-4, 3], [0, 1], (x, y) => (Math.abs(x) === 5 || y === -4 ? "lampRim" : "lampBody"));
      box(p, [-6, 6], [3, 4], [0, 4], (x, y) => (y === 4 ? "lampRim" : "lampBody"));
    },
    0.5,
    COLORS
  );
  lampBody.position.set(...LAMP);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xd9d4c8 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 1.2), glassMat);
  glass.position.set(LAMP[0], LAMP[1] - 0.3, LAMP[2] + 1.1);
  const glow = glowTexture();
  const glowMat = (opacity) =>
    new THREE.MeshBasicMaterial({ map: glow, color: 0xffcf8a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), glowMat(0.6));
  halo.position.set(LAMP[0], LAMP[1], LAMP[2] + 0.4);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), glowMat(0.3));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(LAMP[0] + 6, 0.12, LOCKUP.z1 + 24);
  group.add(lampBody, glass, halo, pool);
  const lamp = { on: false };
  function light(on) {
    lamp.on = on;
    glassMat.color.set(on ? 0xfff0c8 : 0xd9d4c8);
    halo.visible = pool.visible = on;
  }
  light(shared.night);
  yield;

  /* ----- the moths: flecks fluttering in loops before the lamp, darting at the glass now and then ----- */
  const mothMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.4, 1.8), new THREE.MeshBasicMaterial({ color: "#a88e66" }), MOTHS);
  mothMesh.frustumCulled = false;
  group.add(mothMesh);
  const moths = Array.from({ length: MOTHS }, () => ({
    a: rnd(0, 6.3),
    r: rnd(4, 9),
    way: Math.random() < 0.5 ? -1 : 1,
    speed: rnd(1.6, 2.6),
    ph: rnd(0, 6.3),
    dart: -Infinity, // when it last darted at the glass
    wide: 0, // scattered out (1) and drifting back in
  }));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const at = new THREE.Vector3();
  const flap = new THREE.Vector3();
  function updateMoths(t, dt) {
    mothMesh.visible = lamp.on;
    if (!lamp.on) return;
    moths.forEach((m, i) => {
      if (Math.random() < 0.2 * dt) m.way = -m.way;
      if (Math.random() < 0.12 * dt) m.dart = t;
      m.wide = Math.max(0, m.wide - dt * 0.35);
      m.a += m.way * (m.speed + 0.8 * Math.sin(t * 1.3 + m.ph)) * dt;
      const d = t - m.dart; // (in to the glass and out again, in a second)
      const r = (m.r * (0.8 + 0.2 * Math.sin(t * 0.9 + m.ph)) + 22 * m.wide) * (d < 1 ? 1 - 0.8 * Math.sin(Math.PI * d) : 1);
      at.set(
        LAMP[0] + Math.cos(m.a) * r,
        LAMP[1] + Math.sin(m.a) * r * 0.7 + Math.sin(t * 2.3 + m.ph),
        LAMP[2] + 2.5 + 2 * Math.abs(Math.sin(t * 1.7 + m.ph)) + 6 * m.wide
      );
      e.set(0.3 * Math.sin(t * 5 + m.ph), -m.a, 0.3 * Math.sin(t * 3 + m.ph));
      flap.set(0.3 + 0.7 * Math.abs(Math.sin(t * 22 + m.ph)), 1, 1); // the wings beating
      mothMesh.setMatrixAt(i, m4.compose(at, q.setFromEuler(e), flap));
    });
    mothMesh.instanceMatrix.needsUpdate = true;
  }
  yield;

  /* ----- the possum ----- */
  const possum = makePossum(group, shared);
  yield;

  return {
    group,
    obstacles: [],
    lamp,
    possum,
    // Moths sent off by a click on the lamp (or a leap at them); the possum by a click on her.
    clickables: [
      { key: "lamp", parts: [lampBody, glass], can: () => lamp.on, toggle: () => scatter() },
      { key: "possum", parts: possum.parts, can: () => possum.seen(), toggle: () => possum.startle() },
    ],
    scatter,
    dress: (night) => light(night),
    settle: () => possum.settle(),
    update(t, dt, home) {
      updateMoths(t, dt);
      possum.update(t, dt, home);
    },
  };
  function scatter() {
    moths.forEach((m) => (m.wide = 1));
  }
}

/* ---------------------------------------------------------------------------------------------------------- */
/* The possum: a voxel model (facing +z, her feet at y = 0, in voxels, scaled down) and her nights. */

function possumModel() {
  const group = new THREE.Group();
  const parts = [];
  const mesh = (p) => {
    const m = meshOf(p, 1, COLORS);
    parts.push(m);
    return m;
  };
  const rearing = pivotGroup(group, [0, 0, -6]); // (she rears up about her hind feet)
  const pose = rearing.inner;
  const furAt = (x, y, z) => (hash(x, y, z) < 0.18 ? "furLight" : hash(x + 7, y, z) < 0.05 ? "furDark" : "fur");
  // The body: grey, a darker line down the back, a cream belly.
  const body = part();
  ellipsoid(body, [0, 10, -1], [6, 5.5, 10], (x, y, z) =>
    y < 7 && Math.abs(x) < 4 ? "belly" : Math.abs(x) <= 1 && y >= 14 ? "furDark" : furAt(x, y, z)
  );
  ellipsoid(body, [0, 12, 6], [4.8, 4.6, 4], (x, y, z) => (y < 10 && z > 6 ? "belly" : furAt(x, y, z)));
  pose.add(mesh(body));
  // The head on its neck: a rounded face narrowing to a pink nose, a darker band from each big dark eye down
  // the muzzle, tall oval ears.
  const head = pivotGroup(pose, [0, 13, 8]);
  const h = part();
  ellipsoid(h, [0, 14.5, 11.5], [4.4, 4, 4.2], (x, y, z) => (z > 13 && y < 14 ? "face" : furAt(x, y, z)));
  ellipsoid(h, [0, 13.2, 15.3], [2.4, 2, 2.6], (x, y) => (Math.abs(x) === 1 && y >= 14 ? "mask" : "face"));
  for (const x of [-1, 0, 1]) h.add(x, 13 + (x === 0 ? 1 : 0), 18, "nose");
  for (const s of [-1, 1]) {
    for (const [x, y] of [
      [2, 15],
      [3, 15],
      [2, 16],
      [3, 16],
    ])
      h.add(s * x, y, 15, x === 2 && y === 16 ? "glint" : "eye");
    h.add(s * 2, 14, 15, "mask");
    box(h, s > 0 ? [2, 4] : [-4, -2], [18, 21], [10, 11], (x, y, z) => (z === 11 && Math.abs(x) === 3 && y > 18 && y < 21 ? "earPink" : "ear"));
  }
  head.inner.add(mesh(h));
  // Her eyes catching the light (shown while she stares).
  const shine = new THREE.Group();
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd98a }));
    m.position.set(s * 2.5, 15.5, 15.7);
    shine.add(m);
  }
  shine.visible = false;
  head.inner.add(shine);
  // Four short legs, pinkish-grey paws.
  const legs = [
    [-3, 6],
    [3, 6],
    [-3.5, -6],
    [3.5, -6],
  ].map(([cx, cz]) => {
    const g = pivotGroup(pose, [cx, 7, cz]);
    const p = part();
    const x0 = Math.round(cx - 1);
    box(p, [x0, x0 + 1], [1, 7], [cz - 1, cz + 1], furAt);
    box(p, [x0, x0 + 1], [0, 0], [cz - 1, cz + 2], "paw");
    g.inner.add(mesh(p));
    return g;
  });
  // The tail: bushy and black, grey at its root, in segments, so it can hang, sway and curl.
  const SEG = 4.5;
  const tail = [];
  let parent = pose;
  for (let i = 0; i < 5; i++) {
    const z = -9 - i * SEG;
    const g = pivotGroup(parent, [0, 10, z]);
    const p = part();
    const r = 2.8 - i * 0.25;
    ellipsoid(p, [0, 10, z - SEG / 2], [r, r, SEG / 2 + 0.8], (x, y, zz) =>
      i === 0 ? furAt(x, y, zz) : hash(x, y, zz) < 0.2 ? "tailLight" : "tail"
    );
    g.inner.add(mesh(p));
    tail.push(g);
    parent = g.inner;
  }
  group.scale.setScalar(0.62);
  return { group, parts, rearing, pose, head, legs, tail, shine };
}

function makePossum(parent, shared) {
  const { clock } = shared;
  const t = () => clock.t;
  const m = possumModel();
  m.group.visible = false;
  parent.add(m.group);

  // Where she is (her feet) and which way: `ahead` her head's way, `up` her back's (on the ground or the
  // hoarding the world's up; on the trunk, out from it towards the viewer).
  const p = {
    x: 0,
    y: TOP,
    z: 0,
    ahead: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, 1),
    on: "tree", // "tree" (in the crown, or on the trunk), "rail" (the hoarding's top) or "ground"
    out: false, // out of the crown
    speed: 0, // how fast she is going just now (her legs keep up)
    gait: 0,
    sit: 0, // reared up (1)
    eat: false,
    groom: false,
    look: null, // a point to look at, or null
    stare: false, // frozen, staring (her eyes shine)
    hiss: false,
  };
  const inCrown = () => {
    [p.x, p.z] = trunkAt(TOP);
    Object.assign(p, { y: TOP, on: "tree", out: false, speed: 0, sit: 0, stare: false, hiss: false, eat: false, groom: false, look: null });
    p.ahead.set(0, 1, 0);
    p.up.set(0, 0, 1);
    m.group.visible = false;
  };
  inCrown();
  const quiet = (home) => {
    const h = home.hour();
    return home.life.hours.state === "closed" && (h >= 22.3 || h < 5.4);
  };
  // Whom she should mind just now: the nearest person (or the cat) about, and how near.
  function threat(home) {
    let best = null;
    let d = Infinity;
    for (const a of home.actors) {
      if (a.away || !a.rig.group.visible || (!a.human && !a.stray)) continue;
      const k = Math.hypot(a.x - p.x, a.z - p.z);
      if (k < d) [best, d] = [a, k];
    }
    return best && { who: best, d };
  }

  /* ----- moving ----- */
  // Straight on to `to` at `speed` (on the ground or the hoarding, heading that way; on the trunk, as she is).
  function* along(to, speed) {
    for (;;) {
      const [dx, dy, dz] = [to[0] - p.x, to[1] - p.y, to[2] - p.z];
      const d = Math.hypot(dx, dy, dz);
      const step = speed * clock.dt;
      if (d <= step) break;
      if (p.on !== "tree") p.ahead.set(dx, 0, dz).normalize();
      p.speed = speed;
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      p.z += (dz / d) * step;
      yield;
    }
    [p.x, p.y, p.z] = to;
    p.speed = 0;
  }
  const flat = (x, z) => [x, 0, z];
  function* pause(secs) {
    const t0 = t();
    while (t() - t0 < secs) yield;
  }
  // Up or down the trunk (to `y`), her belly to the bark; down head first.
  function* climb(y, speed) {
    p.on = "tree";
    p.up.set(0, 0, 1);
    p.ahead.set(0, y > p.y ? 1 : -1, 0);
    const [x, z] = trunkAt(y);
    yield* along([x, y, z], speed);
  }
  function* downTree() {
    m.group.visible = p.out = true;
    yield* climb(1.5, 13);
    p.on = "ground";
    p.up.set(0, 1, 0);
    yield* along(flat(...FOOT), 10);
    yield* along(flat(...CORNER), 12);
  }
  // Back up the tree (from the ground: up the right-hand edge and round the pots), to `y` on the trunk, or
  // into the crown.
  function* upTree(speed = 13, y = TOP) {
    if (p.on === "rail") {
      yield* along([RAIL.x0, RAIL.y, RAIL.z], speed);
      return inCrown();
    }
    if (p.on === "ground") {
      yield* along(flat(LANE, p.z), speed * 1.4);
      yield* along(flat(...CORNER), speed * 1.4);
      yield* along(flat(...FOOT), speed * 1.4);
      yield* along(flat(...trunkAt(0)), speed);
    }
    yield* climb(y, speed);
    if (y >= TOP) inCrown();
  }
  // To a spot in `area` (GROUND), by way of the right-hand edge if she is not in it.
  function* toArea(area) {
    const [x, z] = [rnd(...area.x), rnd(...area.z)];
    const inIt = p.x >= area.x[0] - 4 && p.x <= area.x[1] + 4 && p.z >= area.z[0] - 4 && p.z <= area.z[1] + 4;
    if (!inIt) {
      yield* along(flat(LANE, p.z), 12);
      yield* along(flat(LANE, z), 12);
    }
    yield* along(flat(x, z), 12);
  }

  /* ----- her nights ----- */
  function* nights(home) {
    for (;;) {
      yield* pause(rnd(15, 40));
      while (!quiet(home)) yield;
      if (Math.random() < 0.4) yield* railWalk();
      else yield* forage(home, rnd(60, 110));
    }
  }
  // Along the top of the hoarding: a sit, a look round and a groom, and back.
  function* railWalk() {
    Object.assign(p, { on: "rail", out: true, x: RAIL.x0, y: RAIL.y, z: RAIL.z });
    p.up.set(0, 1, 0);
    p.ahead.set(-1, 0, 0);
    m.group.visible = true;
    const far = rnd(RAIL.x1, RAIL.x0 - 50);
    yield* along([far, RAIL.y, RAIL.z], 11);
    p.look = [far - 40, 30, 60];
    yield* pause(rnd(2, 4));
    p.look = null;
    p.groom = true;
    yield* pause(rnd(3, 5));
    p.groom = false;
    yield* upTree(11);
  }
  // Down, from spot to spot over the pavement for `secs`, a sniff at each: a petal found, sat up and eaten
  // (the petal in her paws); else now and then sat up to look about. Then back up.
  function* forage(home, secs) {
    if (p.on !== "ground") yield* downTree();
    const until = t() + secs;
    while (t() < until && quiet(home)) {
      yield* toArea(pick(GROUND));
      p.look = [p.x + p.ahead.x * 6, 0, p.z + p.ahead.z * 6];
      yield* pause(rnd(1.2, 2.5));
      p.look = null;
      if (home.grounds.petals.sweep(p.x + p.ahead.x * 4, p.z + p.ahead.z * 4, 6)) {
        p.sit = 1;
        p.eat = true;
        yield* pause(rnd(3.5, 6));
        p.eat = false;
        p.sit = 0;
        yield* pause(0.5);
      } else if (Math.random() < 0.3) {
        p.sit = 1;
        p.look = [p.x + rnd(-60, 60), 20, p.z + rnd(-20, 60)];
        yield* pause(rnd(1.5, 3));
        p.sit = 0;
        p.look = null;
      }
    }
    yield* upTree();
  }
  // Frozen, staring at `who`; then, if they come on (or `now`: a click), off up the tree, to cling to the
  // trunk out of reach, looking down, till all is quiet a while, and on up into the crown (from the
  // hoarding: back along it into the crown).
  function* startled(home, who, now) {
    const at = () => (who ? [who.x, 20, who.z] : [p.x + 60, 60, p.z + 100]); // (a click: at the viewer)
    Object.assign(p, { speed: 0, eat: false, groom: false, stare: true, look: at() });
    const t0 = t();
    while (!now && t() - t0 < 6) {
      p.look = at();
      const k = threat(home);
      if (!k || k.d > NEAR + 10) break;
      if (k.d < CLOSE) now = true;
      yield;
    }
    if (now) yield* pause(0.6);
    Object.assign(p, { stare: false, look: null, sit: 0 });
    if (!now) return;
    if (p.on === "rail") return yield* upTree(24);
    yield* upTree(26, rnd(34, 46));
    p.stare = true;
    for (let clear = 0; clear < 4; ) {
      const k = threat(home);
      p.look = k ? [k.who.x, 10, k.who.z] : null;
      clear = k && k.d < NEAR + 20 ? 0 : clear + clock.dt;
      yield;
    }
    Object.assign(p, { stare: false, look: null });
    yield* upTree();
  }
  // Reared up at the cat, hissing, till it has backed off.
  function* rear(cat) {
    Object.assign(p, { speed: 0, eat: false, groom: false, sit: 1, hiss: true });
    p.ahead.set(cat.x - p.x, 0, cat.z - p.z).normalize();
    const t0 = t();
    while (t() - t0 < 6 && Math.hypot(cat.x - p.x, cat.z - p.z) < CAT + 12) {
      p.look = [cat.x, 8, cat.z];
      yield;
    }
    Object.assign(p, { hiss: false, sit: 0, look: null });
  }
  // A fright, and then on with the night: foraging on a while if she is still down, else back to waiting.
  function* thenOn(home, fright) {
    yield* fright;
    if (p.on === "ground") yield* forage(home, rnd(20, 50));
    yield* nights(home);
  }

  /* ----- her pose, each frame ----- */
  const basis = new THREE.Matrix4();
  const side = new THREE.Vector3();
  const want = new THREE.Quaternion();
  const look = new THREE.Vector3();
  let sitK = 0;
  function pose(dt) {
    const { group, rearing, head, legs, tail, shine } = m;
    group.position.set(p.x, p.y, p.z);
    side.crossVectors(p.up, p.ahead).normalize();
    want.setFromRotationMatrix(basis.makeBasis(side, p.up, p.ahead));
    group.quaternion.slerp(want, 1 - Math.exp(-10 * dt));
    sitK += (p.sit - sitK) * (1 - Math.exp(-7 * dt));
    rearing.outer.rotation.x = -1.05 * sitK;
    // The legs: a diagonal walk (her two diagonals in turn); reared up, the hind ones upright under her and
    // the front ones up, to her mouth as she eats.
    p.gait += dt * p.speed * 0.55;
    legs.forEach((leg, i) => {
      const s = Math.sin(p.gait + (i === 0 || i === 3 ? 0 : Math.PI));
      leg.outer.rotation.x = (p.speed > 0 ? 0.6 * s : 0) + (i < 2 ? -sitK * (p.eat ? 1.5 + 0.1 * Math.sin(t() * 9 + i) : 0.6) : sitK * 1.05);
    });
    // The head: towards what she looks at (as far as it turns), down at the ground as she sniffs; nibbling;
    // round to her flank to groom it; up, hissing.
    let [yaw, pitch] = [0, 0.1 * sitK];
    if (p.look) {
      group.updateMatrixWorld();
      head.outer.parent.worldToLocal(look.set(...p.look)).sub(head.outer.position);
      yaw = clamp(Math.atan2(look.x, look.z), -1.1, 1.1);
      pitch = clamp(-Math.atan2(look.y, Math.hypot(look.x, look.z)), -0.7, 0.8);
    }
    if (p.groom) [yaw, pitch] = [1.4, 0.6 + 0.35 * Math.sin(t() * 7)];
    const nod = p.eat ? 0.15 * Math.sin(t() * 11) : p.hiss ? -0.3 : 0;
    head.outer.rotation.y += (yaw - head.outer.rotation.y) * (1 - Math.exp(-8 * dt));
    head.outer.rotation.x += (pitch + nod - head.outer.rotation.x) * (1 - Math.exp(-10 * dt));
    shine.visible = p.stare || p.hiss;
    // The tail: low behind her, swaying as she goes, curled at its tip; level again behind her as she rears,
    // and round to her side.
    const sway = Math.sin(t() * (p.speed > 0 ? 4 : 1.2)) * (p.speed > 0 ? 0.25 : 0.1);
    tail.forEach((seg, i) => {
      seg.outer.rotation.x = [-0.35, -0.15, -0.1, -0.25, -0.6][i] + (i === 0 ? sitK : 0);
      seg.outer.rotation.y = sway * (i + 1) * 0.4 + sitK * (i ? 0.35 : 0.6);
    });
  }

  let run = null;
  let home = null;
  return {
    parts: m.parts,
    // Whether she is out, to be seen.
    seen: () => p.out,
    where: () => p,
    // A click on her: frozen a moment, then off up the tree.
    startle() {
      if (p.out && home) run = thenOn(home, startled(home, null, true));
    },
    // Back up in the crown at once (the time jumped).
    settle() {
      run = null;
      inCrown();
    },
    update(_, dt, h) {
      home = h;
      run ??= nights(home);
      // Out on the ground (or the hoarding), someone near: frozen, staring; the cat near, reared up at it.
      if (p.out && p.on !== "tree" && !p.stare && !p.hiss) {
        const k = threat(home);
        if (k?.who.stray && k.d < CAT && p.on === "ground") run = thenOn(home, rear(k.who));
        else if (k?.who.human && k.d < NEAR) run = thenOn(home, startled(home, k.who, false));
      }
      if (run.next().done) run = nights(home);
      if (m.group.visible) pose(dt);
    },
  };
}
