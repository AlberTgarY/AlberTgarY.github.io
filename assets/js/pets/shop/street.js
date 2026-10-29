/*******************************************************************************
 * Who comes by the flower shop while it is shut (shop.js; besides the people
 * passing: customers.js, and the possum: night.js):
 * - a stray tabby (models/cat.js), on her rounds at night and on into the
 *   early morning. She comes up the street, prowls along the shutter and the
 *   stands sniffing, sits to groom, naps curled up under the awning, sits
 *   under the lamp watching the moths and leaps at them, sits staring up at
 *   the possum in the tree or on the hoarding, and goes off again a while.
 *   The possum rearing up at her, she jumps back and makes off (and grooms, as
 *   if nothing happened); someone passing may stop to stroke her.
 * - the council's street sweeper at first light, in his hi-vis, pushing his
 *   bin on wheels: he leaves it at the kerb, sweeps up the petals and leaves
 *   where they lie thickest, tips the dustpan into the bin and goes on along
 *   the street.
 * Both are actors (room/actor.js) going by this file, not life.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd, pick } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { makeActor } from "../room/actor.js";
import { buildCat } from "../models/cat.js";
import { buildTownsfolk, rollLook } from "../models/townsfolk.js";
import { box } from "../models/voxels.js";
import { voxels } from "./kit.js";
import { shopProps } from "./props.js";
import { WORK } from "./acts.js";
import { setFade, comeIn, goOff } from "./fade.js";
import { STREET, GROUND, KIOSK, HOURS } from "./layout.js";

const EDGE = GROUND.z1 - 8; // the pavement's front edge (as customers.js)
// Where she goes: open pavement to prowl over (in front of the shutter, before the house plants, along the
// front), where she naps (under the awning, before the shutter), where she sits under the lamp (night.js).
const PROWL = [
  [-90, -4, -24, -16],
  [24, 170, -46, -40],
  [-100, 170, 58, 68],
  [-20, 170, 16, 20],
];
const NAP = [
  [-62, -21],
  [-20, -20],
];
const UNDER_LAMP = [22, -47];
const LEAP = 13; // how high she leaps at a moth
const ROUND = [22.2, 9.3]; // her hours (from, to): out late, gone before they open up
const DAWN_ROUND = 6.1; // the sweeper's
const SWEEP_SPOTS = 4;

// What he pushes: a green council bin on two wheels, a handle across its back, a white stripe.
function binModel() {
  return voxels((p) => {
    box(p, [-6, 6], [3, 21], [-5, 5], (x, y, z) => (y >= 15 && y <= 16 && z === 5 ? "#e9ece6" : (x + y) % 9 === 0 ? "#2a523a" : "#2f5c40"));
    box(p, [-7, 7], [22, 23], [-6, 6], "#24482f"); // the lid
    box(p, [-6, 6], [21, 22], [-8, -7], "#1f2022"); // the handle
    for (const x of [-7, 7]) box(p, [x, x], [0, 5], [-5, 0], (xx, y, z) => (y === 2 && z === -2 ? "#9aa1a4" : "#1e1e20")); // the wheels
    box(p, [-5, 5], [0, 2], [2, 4], "#24482f"); // the foot at the front
  }, 0.8);
}

export function* buildingStreet(home) {
  const cat = makeActor("stray", buildCat({ tabby: true }), "pet", home, 0.72);
  Object.assign(cat, { street: true, stray: true, away: true, x: 0, z: STREET.z, y: 0 });
  setFade(cat, 0);
  home.actors.push(cat);
  yield 0.5;

  const look = rollLook(Math.random, "adult");
  Object.assign(look, { top: "hivis", hat: "cap", legs: "trousers", shoes: "boots", bag: null, scarf: false, glasses: null });
  Object.assign(look.colors, { top: "#f47a22", top2: "#2b3550", leg: "#2b3550", hat: "#2b3550", shoe: "#2a2a2f" });
  const sweeper = makeActor("sweeper", buildTownsfolk(look), "human", home, look.size);
  Object.assign(sweeper, { street: true, away: true, x: 0, z: STREET.z, y: 0 });
  sweeper.shop = shopProps(sweeper.rig);
  setFade(sweeper, 0);
  home.actors.push(sweeper);
  const bin = binModel();
  bin.material = Object.assign(bin.material.clone(), { transparent: true }); // (faded in and out with him)
  bin.visible = false;
  home.scene.add(bin);
  yield 1;
  return makeStreet(home, cat, sweeper, bin);
}

function makeStreet(home, cat, sweeper, bin) {
  const { clock } = home;
  const t = () => clock.t;
  const { walk, turn, wait, until } = makeSteps(home);
  const hours = home.life.hours;
  const night = home.nighttime;
  const possum = night.possum.where();
  const shut = () => hours.state === "closed";
  const inHours = ([from, to]) => {
    const h = home.hour();
    return from < to ? h >= from && h < to : h >= from || h < to;
  };

  /* ----- the cat ----- */
  let catRun = null;
  let catBack = t() + rnd(10, 30); // when she next comes by
  let patter = null; // someone stopped to stroke her
  const spot = (rects) => {
    for (let k = 0; k < 20; k++) {
      const [x0, x1, z0, z1] = pick(rects);
      const [x, z] = [rnd(x0, x1), rnd(z0, z1)];
      if (home.nav.free(x, z)) return [x, z];
    }
    return null;
  };
  const near = (a, [x, z], r) => Math.hypot(a.x - x, a.z - z) < r;
  function* pause(secs) {
    const t0 = t();
    while (t() - t0 < secs) yield;
  }
  function* groom(secs = rnd(4, 6)) {
    cat.sit = true;
    cat.setState("trick", secs, "groom");
    yield* pause(secs);
    cat.setState("idle");
    cat.sit = false;
  }
  // A leap straight up at a moth, a paw out at the top (the moths scatter), and down.
  function* leap() {
    cat.sit = false;
    cat.setState("trick", 0.7, "swat");
    const t0 = t();
    let swatted = false;
    for (let k = 0; k < 1; ) {
      k = Math.min(1, (t() - t0) / 0.6);
      cat.y = LEAP * Math.sin(Math.PI * k);
      if (k > 0.45 && !swatted) {
        swatted = true;
        night.scatter();
      }
      yield;
    }
    cat.y = 0;
    cat.setState("idle");
  }
  // A visit: up the street, a round of things, and off again.
  function* visit() {
    yield* comeIn(cat, [rnd(-60, 150), STREET.z, EDGE], clock);
    cat.away = false;
    const leave = t() + rnd(120, 240);
    let napped = false;
    while (t() < leave && shut() && inHours(ROUND)) {
      const r = Math.random();
      if ((possum.out && possum.on !== "ground") || (possum.on === "ground" && possum.out && r < 0.3)) yield* watchPossum();
      else if (r < 0.35) yield* prowl();
      else if (r < 0.55 && night.lamp.on) yield* moths();
      else if (r < 0.7 && !napped) {
        napped = true;
        yield* nap();
      } else yield* groom();
    }
    yield* walk(cat, [cat.x, EDGE], 0.9);
    yield* goOff(cat, STREET.z, clock);
  }
  function* prowl() {
    for (let k = Math.floor(rnd(2, 4)); k > 0; k--) {
      const to = spot(PROWL);
      if (!to) return;
      yield* walk(cat, to, 0.75);
      cat.look = [cat.x + Math.sin(cat.yaw) * 8, 0, cat.z + Math.cos(cat.yaw) * 8]; // (a sniff at the ground)
      yield* pause(rnd(1, 2.5));
      cat.look = null;
    }
  }
  // Under the lamp, watching the moths go round; a leap at them now and then, and a groom after.
  function* moths() {
    yield* walk(cat, UNDER_LAMP, 0.8);
    yield* turn(cat, Math.PI);
    cat.sit = true;
    cat.look = [UNDER_LAMP[0], 44, -58];
    for (let k = Math.floor(rnd(1, 4)); k > 0 && night.lamp.on; k--) {
      yield* pause(rnd(2.5, 5));
      yield* leap();
      cat.sit = true;
    }
    cat.look = null;
    yield* groom(rnd(3, 4));
  }
  // Curled up asleep before the shutter, till she has slept or someone comes near; a stretch on waking.
  function* nap() {
    const at = pick(NAP);
    yield* walk(cat, at, 0.8);
    yield* turn(cat, rnd(-0.6, 0.6));
    cat.lie = true;
    yield* pause(1.2);
    cat.asleep = true;
    const t0 = t();
    yield* until(() => home.actors.some((o) => o.human && !o.away && near(o, at, 30)), rnd(40, 75));
    cat.asleep = false;
    yield* pause(t() - t0 > 30 ? 1.2 : 0.4);
    cat.lie = false;
    cat.bow = true; // (a stretch)
    yield* pause(1.3);
    cat.bow = false;
  }
  // Sat staring up at the possum (in the tree, or on the hoarding over her), or across at her on the ground.
  function* watchPossum() {
    const to = possum.on === "rail" ? [possum.x, -44] : possum.on === "tree" ? [170, -46] : null;
    if (to && home.nav.free(...to)) yield* walk(cat, to, 0.8);
    cat.sit = true;
    const t0 = t();
    while (t() - t0 < rnd(8, 16) && possum.out) {
      cat.look = [possum.x, possum.y + 4, possum.z];
      cat.faceTowards(possum.x, possum.z);
      yield;
    }
    cat.look = null;
    cat.sit = false;
  }
  // The possum rearing at her: a jump back, off at a run, and a groom when well away.
  function* fright() {
    Object.assign(cat, { sit: false, lie: false, asleep: false, bow: false });
    cat.faceTowards(possum.x, possum.z);
    const [dx, dz] = [cat.x - possum.x, cat.z - possum.z];
    const d = Math.hypot(dx, dz) || 1;
    const t0 = t();
    const [x0, z0] = [cat.x, cat.z];
    const back = home.nav.free(x0 + (dx / d) * 10, z0 + (dz / d) * 10) ? 10 : 0;
    for (let k = 0; k < 1; ) {
      k = Math.min(1, (t() - t0) / 0.4);
      cat.x = x0 + (dx / d) * back * k;
      cat.z = z0 + (dz / d) * back * k;
      cat.y = 6 * Math.sin(Math.PI * k);
      yield;
    }
    cat.y = 0;
    const away = spot(PROWL.filter(([x0, x1, z0, z1]) => Math.hypot((x0 + x1) / 2 - possum.x, (z0 + z1) / 2 - possum.z) > 90)) ?? spot(PROWL);
    if (away) yield* walk(cat, away, 2.2);
    yield* groom(rnd(3, 5));
  }
  // Stroked by someone passing who stopped (`patter`, kneeling to her): she comes to them, sits, purrs.
  function* stroked(by) {
    Object.assign(cat, { lie: false, asleep: false, bow: false, sit: false });
    if (Math.hypot(by.x - cat.x, by.z - cat.z) > 14) yield* walk(cat, [by.x + Math.sin(by.yaw) * 10, by.z + Math.cos(by.yaw) * 10], 1);
    cat.faceTowards(by.x, by.z);
    cat.look = by;
    cat.setState("petted", 4);
    cat.happy = true;
    yield* until(() => patter !== by, 6);
    cat.happy = false;
    cat.setState("idle");
    cat.look = null;
  }
  // (Something that comes up, and then on with the visit.)
  function* thenOn(first) {
    yield* first;
    yield* visit2();
  }
  function* visit2() {
    const leave = t() + rnd(40, 100);
    while (t() < leave && shut() && inHours(ROUND)) yield* Math.random() < 0.5 ? prowl() : groom();
    yield* walk(cat, [cat.x, EDGE], 0.9);
    yield* goOff(cat, STREET.z, clock);
  }

  /* ----- the sweeper ----- */
  let swept = -Infinity; // when he last came (once a morning)
  let sweepRun = null;
  const SWEEP_POSE = WORK.sweep;
  const PUSH = [
    [-1.0, -0.35, 0.12, 0, 0],
    [-1.0, -0.35, -0.12, 0, 0],
  ];
  const TIP = [
    [-1.5, -0.4, 0.2, 0, 0],
    [-0.9, -0.2, -0.2, 0, 0],
  ];
  // The bin before him as he pushes it, its handle to his hands (faded as he is).
  function pushBin() {
    const yaw = sweeper.yaw;
    bin.material.opacity = sweeper.fade;
    bin.visible = sweeper.fade > 0;
    bin.position.set(sweeper.x + Math.sin(yaw) * 13, 0, sweeper.z + Math.cos(yaw) * 13);
    bin.rotation.y = yaw;
  }
  function* pushTo(to, pace = 0.8) {
    sweeper.hold = PUSH;
    const going = walk(sweeper, to, pace);
    while (!going.next().done) {
      pushBin();
      yield;
    }
  }
  const reachable = (x, z) => !(x < KIOSK.x1 && z < KIOSK.z1 + 2) && home.nav.free(x, z + 8);
  function* round() {
    const from = Math.random() < 0.5 ? -120 : 168;
    sweeper.shop.only();
    const coming = comeIn(sweeper, [from, STREET.z, EDGE], clock);
    while (!coming.next().done) {
      pushBin();
      yield;
    }
    sweeper.away = false;
    sweeper.hold = PUSH;
    // To the kerb short of the worst of it (on the way he came, out of his way as he sweeps), the bin left there.
    const first = home.grounds.petals.thickest(14, reachable);
    const x = (first ? first[0] : 40) - 28 * Math.sign(-from);
    yield* pushTo([Math.max(-110, Math.min(160, x)), EDGE]);
    sweeper.hold = null;
    yield* pause(0.5);
    sweeper.shop.only("broom", "dustpan");
    for (let k = 0; k < SWEEP_SPOTS; k++) {
      const at = home.grounds.petals.thickest(14, reachable);
      if (!at) break;
      yield* walk(sweeper, [at[0], at[1] + 8]);
      yield* turn(sweeper, Math.PI + rnd(-0.4, 0.4));
      sweeper.hold = SWEEP_POSE;
      sweeper.since = t();
      const t0 = t();
      while (t() - t0 < rnd(3, 4.5)) {
        if (Math.random() < 0.06) home.grounds.petals.sweep(sweeper.x + rnd(-6, 6), sweeper.z - rnd(2, 10), 8);
        yield;
      }
      home.grounds.petals.sweep(at[0], at[1], 18);
      sweeper.hold = null;
    }
    // Into the bin, and on along the street with it.
    yield* walk(sweeper, [bin.position.x - Math.sin(bin.rotation.y) * 13, bin.position.z - Math.cos(bin.rotation.y) * 13]);
    yield* turn(sweeper, bin.rotation.y);
    sweeper.hold = TIP;
    yield* pause(1.2);
    sweeper.shop.only();
    yield* pushTo([from < 0 ? 168 : -120, EDGE], 0.9);
    const going = goOff(sweeper, STREET.z, clock);
    while (!going.next().done) {
      pushBin();
      yield;
    }
  }
  function sweeperAway() {
    Object.assign(sweeper, { away: true, hold: null, walking: false });
    sweeper.shop.only();
    setFade(sweeper, 0);
    bin.visible = false;
  }

  function catAway() {
    Object.assign(cat, { away: true, sit: false, lie: false, asleep: false, bow: false, happy: false, look: null, walking: false, y: 0 });
    cat.setState("idle");
    setFade(cat, 0);
    patter = null;
  }

  return {
    cat,
    sweeper,
    // Whether the cat would come to be stroked by `a` (passing, customers.js): awake, not busy at something,
    // and near; then she comes over (`stop()` lets her go on).
    stroke(a) {
      if (cat.away || patter || cat.asleep || cat.y > 0 || Math.hypot(a.x - cat.x, a.z - cat.z) > 70) return null;
      patter = a;
      catRun = thenOn(stroked(a));
      return { cat, stop: () => patter === a && (patter = null) };
    },
    step() {
      // The cat: by now and then while it is shut, at night and into the morning.
      if (!catRun && cat.away && shut() && inHours(ROUND) && t() >= catBack) catRun = visit();
      if (catRun && !cat.away && possum.hiss && Math.hypot(possum.x - cat.x, possum.z - cat.z) < 55 && !cat.fleeing) {
        cat.fleeing = true;
        catRun = thenOn(fright());
      }
      if (catRun) {
        let done = true;
        try {
          done = catRun.next().done;
        } catch (e) {
          console.error("flower shop: the cat", e);
        }
        if (done) {
          catRun = null;
          cat.fleeing = false;
          catAway();
          catBack = t() + rnd(50, 140);
        }
      }
      // The sweeper: once each morning, at first light, while it is shut.
      const h = home.hour();
      if (!sweepRun && shut() && h >= DAWN_ROUND && h < HOURS.arrive - 1 && t() - swept > 600) {
        swept = t();
        sweepRun = round();
      }
      if (sweepRun) {
        let done = true;
        try {
          done = sweepRun.next().done;
        } catch (e) {
          console.error("flower shop: the sweeper", e);
        }
        if (done) {
          sweepRun = null;
          sweeperAway();
        }
      }
    },
    // The time jumped: both off the street at once.
    clear() {
      catRun = sweepRun = null;
      catAway();
      sweeperAway();
      catBack = t() + rnd(5, 20);
      swept = -Infinity;
    },
  };
}
