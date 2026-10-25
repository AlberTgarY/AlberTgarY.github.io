/*******************************************************************************
 * The garden's sprinkler (water.js flies its drops): an impact sprinkler on a
 * spike in the grass between the beds, fed by a green hose from a little pump
 * on the grass by the low wall, which draws its water from the house. Switched
 * on at the pump, it hums, the water comes up to pressure (the gauge's needle
 * climbing) and the head ticks round and round over the beds (the arm knocking
 * the jet into a spray at each tick); switched off, the jet sinks and stops.
 *
 * It stands in the middle of the four beds, and its range cam carries the jet
 * just to the far edge of the beds whichever way it faces, so the water comes
 * down over the vegetables: the jet itself at the far end, and the spray that
 * breaks off it all along the way.
 *
 * Now and then it has been left facing the wrong way: on comes the jet straight
 * at whoever is at the pump, until they run over and turn it round (acts.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, ellipsoid, pivotGroup } from "../models/voxels.js";
import { GRAVITY } from "./water.js";

const AT = [186, 38]; // the sprinkler, on the beds' middle line, between the near pair and the far pair
const PUMP = [154, 70]; // the pump, on the grass against the garden side of the wall
const NOZZLE_Y = 6.5;
const ELEVATION = 0.47; // the jet's angle up from the level, as the real ones (about 27°)
const REACH = 66; // how far the jet carries at full pressure
const BEDS = { x: [169, 203], z: [-21, 103] }; // what it waters: the four beds (house.js)
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
  motor: "#4c9a6a",
  motorDark: "#3a7a53",
  housing: "#2f3338",
  pumpBase: "#4a4d52",
  switchBox: "#e8e4da",
  rocker: "#d9433f",
  gaugeFace: "#fbfbf6",
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

  // The pump on the grass by the wall, lying along it: a green motor with cooling fins on a grey base, a
  // fan cover at its back and the round black pump housing at its front, the pipe from the house coming
  // through the wall into it and the hose going out of its side; on top, a pressure gauge facing the room
  // and a white switch box with a red rocker and a little light, green while it runs.
  const pump = new THREE.Group();
  pump.position.set(PUMP[0], 0, PUMP[1]);
  group.add(pump);
  const pumpPart = part();
  box(pumpPart, [-2, 2], [0, 0], [-5, 4], "pumpBase");
  for (let z = -4; z <= 1; z++) {
    const r = z % 2 ? 2.1 : 2.5; // the fins
    ellipsoid(pumpPart, [0, 3, z], [r, r, 0.5], z % 2 ? "motor" : "motorDark");
  }
  ellipsoid(pumpPart, [0, 3, -5], [1.6, 1.6, 0.5], "pumpBase");
  ellipsoid(pumpPart, [0, 3, 3], [2.6, 2.6, 1.3], "housing");
  box(pumpPart, [-5, -3], [2, 2], [3, 3], "steel"); // in from the house, through the wall
  box(pumpPart, [3, 4], [3, 3], [3, 3], "brass"); // out to the hose
  box(pumpPart, [0, 0], [6, 6], [3, 3], "steel"); // the gauge on its stem
  box(pumpPart, [-1, 1], [7, 9], [4, 4], (x, y) => (x || y !== 8 ? "steel" : "gaugeFace"));
  box(pumpPart, [-1, 1], [6, 6], [-3, -1], "switchBox");
  pump.add(pumpPart.mesh(COLORS));
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 0.2), new THREE.MeshBasicMaterial({ color: 0xd9433f }));
  needle.geometry.translate(0, 0.45, 0); // turning about its foot
  needle.position.set(0, 7.6, 4.6);
  pump.add(needle);
  const rocker = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1.6), new THREE.MeshLambertMaterial({ color: COLORS.rocker }));
  rocker.position.set(0, 6.8, -2);
  pump.add(rocker);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0x4a4d52 }));
  light.position.set(1.3, 6.2, -3);
  pump.add(light);
  const [lightOn, lightOff] = [new THREE.Color(0x5cff7a), new THREE.Color(0x4a4d52)];

  // The hose, lying in loose curves on the grass from the pump to the sprinkler, clear of the beds.
  const hose = part();
  const from = [PUMP[0] + 5, PUMP[1] + 3];
  const ctrl = [
    [PUMP[0] + 11, PUMP[1] - 4],
    [AT[0] - 26, AT[1] + 16],
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
  for (let y = 0; y <= 3; y++) hose.add(from[0], y, from[1], "hose"); // up to the pump's outlet
  group.add(hose.mesh(COLORS));

  const tapAt = [PUMP[0] + 6, PUMP[1] - 2]; // where to kneel to the pump's switch, facing the wall
  const fixAt = [AT[0] - 12, AT[1] + 3]; // where to crouch to turn the head round
  const s = {
    spots: {
      tap: { at: tapAt, yaw: -Math.PI / 2 },
      fix: { at: fixAt, yaw: Math.atan2(AT[0] - fixAt[0], AT[1] - fixAt[1]) },
      head: [AT[0], 6, AT[1]],
      tap3: [PUMP[0], 7, PUMP[1] - 2], // the switch
    },
    at: AT,
    footprint: [AT[0] - 3, AT[0] + 3, AT[1] - 3, AT[1] + 3],
    on: false, // the pump running
    wrong: false, // facing the tap, until turned round
    since: 0, // when the pump was last switched
    offAt: Infinity, // when someone should come and turn it off
    pressure: 0,
    heading: 0,
    nextTick: 0,
    lastTick: -1,
    // Switch the pump on at time t, the head left facing the pump or not.
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
      // The pump: the rocker over, the light on, a hum (a shiver), and the needle up with the pressure.
      rocker.rotation.x += ((s.on ? 0.35 : -0.35) - rocker.rotation.x) * (1 - Math.exp(-14 * dt));
      light.material.color.copy(s.on ? lightOn : lightOff);
      pump.position.x = PUMP[0] + (s.on ? 0.07 * Math.sin(t * 95) : 0);
      needle.rotation.z = 1.2 - 2.4 * s.pressure;
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
  }
  function burst() {
    for (let k = 0; k < 12; k++) drop(0.32, 0.3, false);
  }
  return s;
}
