/*******************************************************************************
 * The garden's sprinkler (water.js flies its drops): an impact sprinkler on a
 * spike in the grass between the beds, fed by a green hose wound on a red reel
 * under the outside tap on the low wall. Turned on at the tap (its red handle
 * round a quarter turn), the water comes up to pressure and the head ticks
 * round and round over the beds (the arm knocking the jet into a spray at each
 * tick); turned off, the jet sinks and stops.
 *
 * It stands in the middle of the four beds, and its range cam carries the jet
 * just to the far edge of the beds whichever way it faces, so the water comes
 * down over the vegetables: the jet itself at the far end, and the spray that
 * breaks off it all along the way.
 *
 * Now and then it has been left facing the wrong way: on comes the jet straight
 * at whoever is at the tap, until they run over and turn it round (acts.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, ellipsoid, pivotGroup } from "../models/voxels.js";
import { GRAVITY } from "./water.js";

// Out in the vegetable garden (house/garden.js).
const AT = [182, -172]; // the sprinkler, on the beds' middle line, between the near pair and the far pair
// The outside tap is on the house wall just along from the garden's fence, the hose reel beside it: built
// as if on a wall along z, the tap at [0, 0] and out along +x, then turned (WALL_TURN) onto the house wall.
const WALL_AT = [137, -114.5];
const WALL_TURN = Math.PI / 2; // (out from the wall is -z out here)
const TAP = [0, 0];
const REEL = [2, -7]; // the hose reel, against the wall just along from the tap, its axle out from the wall
// A point on the wall's own [x, z] (or [x, y, z]), out in the world.
const onWall = ([x, z]) => [
  WALL_AT[0] + x * Math.cos(WALL_TURN) + z * Math.sin(WALL_TURN),
  WALL_AT[1] - x * Math.sin(WALL_TURN) + z * Math.cos(WALL_TURN),
];
const NOZZLE_Y = 6.5;
const ELEVATION = 0.47; // the jet's angle up from the level, as the real ones (about 27°)
const REACH = 66; // how far the jet carries at full pressure
const BEDS = { x: [165, 199], z: [-222, -122] }; // what it waters: the four beds
const TICK = 0.2; // s between the arm's knocks
const STEP = 0.07; // how far round each knock turns it (round once in about 18 s)

const COLORS = {
  hose: "#3f9a4f",
  hoseDark: "#2f7a3d",
  body: "#3f8f4a",
  bodyDark: "#2b6a35",
  brass: "#d9a441",
  brassDark: "#b5832c",
  steel: "#c3c9cf",
  reel: "#d24a3c",
  reelDark: "#a83528",
};

// Speed for a drop leaving the nozzle at `angle` up to come down `range` away on the ground (NOZZLE_Y + 0.5
// below): the exact speed without air, made up a little for the air slowing it (water.js's drag for a jet;
// fitted against stepping the flight finely, it lands within a voxel out to 65).
function speedFor(range, angle) {
  const drop = NOZZLE_Y + 0.5;
  const still = Math.sqrt((GRAVITY * range * range) / (2 * Math.cos(angle) ** 2 * (range * Math.tan(angle) + drop)));
  return still * (1.03 + 0.0007 * range);
}

export function buildSprinkler(scene, water) {
  const group = new THREE.Group();
  scene.add(group);

  // The sprinkler: a spike and a squat body, and the head on top that turns, with its nozzle and its arm.
  const base = part();
  box(base, [-1, 1], [0, 0], [-1, 1], "bodyDark");
  box(base, [0, 0], [1, 3], [0, 0], "body");
  ellipsoid(base, [0, 3.5, 0], [1.6, 1, 1.6], "brass");
  const baseMesh = base.mesh(COLORS);
  baseMesh.position.set(AT[0], 0, AT[1]);
  group.add(baseMesh);
  const head = new THREE.Group();
  head.position.set(AT[0], 4.5, AT[1]);
  group.add(head);
  const nozzle = part();
  box(nozzle, [0, 0], [0, 1], [0, 0], "brassDark");
  for (let k = 0; k <= 3; k++) nozzle.add(0, 1 + Math.round(k * 0.5), k, k === 3 ? "steel" : "brass");
  head.add(nozzle.mesh(COLORS));
  const arm = pivotGroup(head, [0, 2, 0]);
  const armPart = part();
  box(armPart, [0, 0], [0, 0], [-2, 3], "steel");
  armPart.add(0, 0, 4, "brassDark");
  armPart.add(0, -1, -2, "brassDark"); // the counterweight
  arm.inner.add(armPart.mesh(COLORS));

  // The outside tap: a pipe out of the wall, a brass body with its spout turned down, and a red cross handle
  // on top that turns a quarter round to open it.
  const tapPart = part();
  box(tapPart, [0, 1], [8, 8], [0, 0], "steel");
  box(tapPart, [2, 3], [7, 9], [-1, 1], (x, y) => (y === 9 ? "brassDark" : "brass"));
  box(tapPart, [3, 3], [5, 6], [0, 0], "brass");
  const wall = new THREE.Group();
  wall.position.set(WALL_AT[0], 0, WALL_AT[1]);
  wall.rotation.y = WALL_TURN;
  group.add(wall);
  const tapMesh = tapPart.mesh(COLORS);
  tapMesh.position.set(TAP[0], 0, TAP[1]);
  wall.add(tapMesh);
  const handle = new THREE.Group();
  handle.position.set(TAP[0] + 2.5, 10.4, TAP[1]);
  wall.add(handle);
  const handleMat = new THREE.MeshLambertMaterial({ color: COLORS.reel });
  handle.add(new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 0.8), handleMat), new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 4), handleMat));

  // The hose reel: a drum between two red discs on a red stand against the wall, its axle out from the wall
  // (so that it keeps out of the way along the beds), the hose wound round it, a crank on the outer disc,
  // and a short length of hose from the tap's spout to its hub.
  const reel = part();
  const [RX, RZ] = REEL;
  for (const dx of [-2, 2])
    for (let z = -5; z <= 5; z++)
      for (let y = -5; y <= 5; y++) {
        const r = Math.hypot(z, y);
        if (r <= 4.6) reel.add(RX + dx, 6 + y, RZ + z, r < 1.2 ? "reelDark" : (z + y) % 3 ? "reel" : "reelDark"); // the discs
      }
  for (let dx = -1; dx <= 1; dx++)
    for (let z = -4; z <= 4; z++)
      for (let y = -4; y <= 4; y++) if (Math.abs(Math.hypot(z, y) - 3.3) < 0.7) reel.add(RX + dx, 6 + y, RZ + z, (y + dx) % 2 ? "hose" : "hoseDark"); // the hose round the drum
  for (const dx of [-2, 2])
    for (const z of [-3, 3]) for (let y = 0; y <= 2; y++) reel.add(RX + dx, y, RZ + z + Math.sign(z) * (2 - y) * 0.5, "reelDark"); // the stand's legs
  for (let y = 7; y <= 9; y++) reel.add(RX + 2, y, RZ + 3, "reelDark"); // the crank's arm, on the outer disc
  reel.add(RX + 2, 10, RZ + 3, "steel"); // and its knob
  for (let k = 0; k <= 10; k++) {
    const u = k / 10; // from the tap's spout down to the hub
    reel.add(
      Math.round(TAP[0] + 3 + (RX + 2 - TAP[0] - 3) * u),
      Math.round(5 + 1 * u - 3 * Math.sin(Math.PI * u)),
      Math.round(TAP[1] + (RZ - TAP[1]) * u),
      "hose"
    );
  }
  wall.add(reel.mesh(COLORS));

  // The hose, lying in loose curves on the grass from the reel, in under the garden's fence and along the
  // path, to the sprinkler, clear of the beds.
  const hose = part();
  const from = onWall([REEL[0] + 3, REEL[1] - 4]).map(Math.round);
  const ctrl = [
    [from[0] + 22, from[1] - 6],
    [AT[0] - 30, AT[1] + 14],
  ];
  let last = null;
  for (let k = 0; k <= 160; k++) {
    const u = k / 160;
    const w = [(1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3];
    const x = Math.round(w[0] * from[0] + w[1] * ctrl[0][0] + w[2] * ctrl[1][0] + w[3] * (AT[0] - 1));
    const z = Math.round(w[0] * from[1] + w[1] * ctrl[0][1] + w[2] * ctrl[1][1] + w[3] * AT[1]);
    if (last && last[0] === x && last[1] === z) continue;
    hose.add(x, 0, z, (x + z) % 5 ? "hose" : "hoseDark");
    last = [x, z];
  }
  for (let y = 0; y <= 2; y++) hose.add(from[0] - 1, y, from[1], "hose"); // up off the bottom of the drum
  group.add(hose.mesh(COLORS));

  const tapAt = onWall([TAP[0] + 9, TAP[1] - 1]); // where to kneel to the tap, facing the wall
  const fixAt = [AT[0] - 12, AT[1] + 3]; // where to crouch to turn the head round
  const s = {
    spots: {
      tap: { at: tapAt, yaw: -Math.PI / 2 + WALL_TURN },
      fix: { at: fixAt, yaw: Math.atan2(AT[0] - fixAt[0], AT[1] - fixAt[1]) },
      head: [AT[0], 6, AT[1]],
      tap3: [onWall([TAP[0] + 2.5, TAP[1]])[0], 10, onWall([TAP[0] + 2.5, TAP[1]])[1]], // the handle
    },
    at: AT,
    footprint: [AT[0] - 3, AT[0] + 3, AT[1] - 3, AT[1] + 3],
    reelFootprint: (() => {
      const [a, b] = [onWall([REEL[0] - 3, REEL[1] - 5]), onWall([REEL[0] + 2, REEL[1] + 5])];
      return [Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])];
    })(),
    on: false, // the tap on
    wrong: false, // facing the tap, until turned round
    since: 0, // when the tap was last turned
    offAt: Infinity, // when someone should come and turn it off
    pressure: 0,
    heading: 0,
    bearing: () => s.heading, // which way the head faces
    nextTick: 0,
    lastTick: -1,
    // Turn the tap on at time t, the head left facing the tap or not.
    start(t, wrong) {
      Object.assign(s, { on: true, wrong, since: t, offAt: t + 18 + Math.random() * 14, nextTick: t + 0.6 });
      if (wrong) s.heading = Math.atan2(tapAt[0] - AT[0], tapAt[1] - AT[1]);
    },
    stop(t) {
      Object.assign(s, { on: false, since: t });
    },
    // Turned round to face the beds again.
    fix() {
      Object.assign(s, { wrong: false, heading: s.heading + Math.PI });
    },
    // Whether drops may be falling anywhere about the garden (the jet on or still coming down).
    spraying: () => s.on || s.pressure > 0.02,
    update(t, dt) {
      s.pressure += ((s.on ? 1 : 0) - s.pressure) * (1 - Math.exp(-(s.on ? 2.5 : 4) * dt));
      // The tap's handle a quarter turn round while it is on.
      handle.rotation.y += ((s.on ? Math.PI / 2 : 0) - handle.rotation.y) * (1 - Math.exp(-10 * dt));
      // The head: knocked round a little at each tick of the arm. Facing the tap, it rocks to and fro about
      // it a little.
      if (s.pressure > 0.2 && t > s.nextTick) {
        s.lastTick = t;
        s.nextTick = t + TICK;
        if (s.wrong) s.heading = Math.atan2(tapAt[0] - AT[0], tapAt[1] - AT[1]) + 0.12 * Math.sin(t * 2.2);
        else s.heading = (s.heading + STEP) % (Math.PI * 2);
        // The knock breaks the jet into a burst of spray, thrown short and wide.
        burst();
      }
      head.rotation.y = s.heading;
      const knock = s.lastTick < 0 ? 1 : (t - s.lastTick) / TICK;
      arm.outer.rotation.y = knock < 1 ? 0.9 * Math.sin(knock * Math.PI) * Math.exp(-knock * 1.5) : 0;
      // The jet: drops leaving the nozzle all the time, at the speed the pressure gives, half of them the
      // jet carrying to its end and half the spray coming down short of it.
      if (s.pressure > 0.02) {
        jetDebt += 240 * s.pressure * dt;
        for (; jetDebt >= 1; jetDebt--) drop(0.03, 0.045, Math.random() < 0.5);
      }
    },
  };
  let jetDebt = 0;
  // How far it is from the sprinkler to the far edge of the beds along `heading`.
  function room(heading) {
    const [dx, dz] = [Math.sin(heading), Math.cos(heading)];
    const along = (d, from, [lo, hi]) => (d > 1e-6 ? (hi - from) / d : d < -1e-6 ? (lo - from) / d : Infinity);
    return Math.min(along(dx, AT[0], BEDS.x), along(dz, AT[1], BEDS.z));
  }
  // One drop, `spread` and `lift` (rad) off the way the head faces, coming down at the end of the jet
  // (`far`) or anywhere along it, evenly over the ground it covers. Facing the tap, the jet reaches just past
  // whoever stands there; otherwise to the far edge of the beds that way.
  function drop(spread, lift, far) {
    const heading = s.heading + (Math.random() - 0.5) * 2 * spread;
    const reach = s.wrong ? Math.hypot(tapAt[0] - AT[0], tapAt[1] - AT[1]) + 6 : Math.min(REACH, room(heading) - 3.5); // from the nozzle, 2.5 out
    const range = far ? reach : reach * Math.sqrt(0.04 + 0.96 * Math.random());
    const angle = s.wrong ? 0.38 : ELEVATION;
    const elev = angle + (Math.random() - 0.5) * 2 * lift;
    const speed = speedFor(range, angle) * Math.sqrt(s.pressure);
    const [dx, dz] = [Math.sin(heading), Math.cos(heading)];
    const [h, v] = [Math.cos(elev) * speed, Math.sin(elev) * speed];
    water.emit("jet", AT[0] + dx * 2.5, NOZZLE_Y, AT[1] + dz * 2.5, dx * h, v, dz * h, 3);
    // Now and then a puff of mist off it, drifting and settling.
    if (Math.random() < 0.25)
      water.emit("mist", AT[0] + dx * 3, NOZZLE_Y + 0.5, AT[1] + dz * 3, dx * h * 0.3, v * 0.3, dz * h * 0.3, 0.6 + Math.random() * 0.5);
  }
  function burst() {
    for (let k = 0; k < 12; k++) drop(0.32, 0.3, false);
  }
  return s;
}
