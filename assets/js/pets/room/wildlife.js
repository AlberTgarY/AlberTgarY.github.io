/*******************************************************************************
 * Who lives in the front garden (house/yard.js): a mother duck and her three
 * ducklings paddling round the pond in a line behind her (they hurry over to
 * crumbs thrown in, and doze by the reeds at night), a frog on a lily pad who
 * now and then hops to another, two little birds coming down to the bird bath
 * to drink and splash (off they fly when anyone comes near, or the rain comes),
 * butterflies over the flowers by day, a moth now and then at a lamp at
 * night, and cherry petals drifting down from the tree.
 *
 * `crumbs([x, z])` brings the ducks over; `duckNear`, `birdNear` say where to
 * look; `flutter(at)` sends a butterfly up off the flowers there.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, hash, smoothstep } from "../models/voxels.js";
import { rnd, pick, clamp, wrap } from "../stage.js";
import { solid } from "./house/kit.js";

const C = {
  duck: "#8a6a4a",
  duckDark: "#6b4f36",
  duckLight: "#b69a78",
  duckling: "#f6d84a",
  ducklingLight: "#fbe88a",
  beak: "#f2a541",
  eye: "#2a2522",
  speculum: "#4f6fc0",
  frog: "#6cbf5a",
  frogDark: "#4f9a46",
  frogBelly: "#d8eaa0",
  robin: "#8a6a4a",
  robinDark: "#6b4f36",
  breast: "#e8743c",
  tit: "#5a8ad6",
  titBelly: "#f6d84a",
  titCheek: "#fbf8f1",
  wingA: "#f6a5c0",
  wingB: "#fbd35a",
  wingC: "#a9c4f0",
  body: "#3a2f2a",
};

// A little voxel creature as a mesh, facing +z, its feet on y = 0.
const model = (p, scale = 1) => {
  const m = solid(p, C);
  m.scale.setScalar(scale);
  return m;
};

function duckPart(baby) {
  const p = part();
  const [body, light, dark] = baby ? ["duckling", "ducklingLight", "duckling"] : ["duck", "duckLight", "duckDark"];
  ellipsoid(p, [0, 3, 0], [3.4, 2.6, 5], (x, y, z) => (y >= 4 ? light : z < -3 ? dark : hash(x, y, z) < 0.25 ? dark : body));
  for (let z = -6; z <= -4; z++) p.add(0, 4 + (z + 6) * 0.5, z, dark); // the tail, tipped up
  if (!baby) for (const x of [-3, 3]) for (let z = -2; z <= 0; z++) p.add(x, 3, z, "speculum"); // a flash of blue on each wing
  ellipsoid(p, [0, 7.5, 3.6], [2, 2, 2], (x, y) => (y > 7 ? (baby ? "ducklingLight" : "duckDark") : body));
  box(p, [-1, 1], [6.5, 7], [5.5, 7], "beak");
  for (const x of [-2, 2]) p.add(x, 8, 4.5, "eye");
  return p;
}

function frogPart() {
  const p = part();
  ellipsoid(p, [0, 1.6, 0], [2.6, 1.6, 2.8], (x, y) => (y < 1 ? "frogBelly" : hash(x, y, 7) < 0.2 ? "frogDark" : "frog"));
  for (const x of [-1.5, 1.5]) {
    p.add(x, 3.2, 1.5, "frog");
    p.add(x, 3.6, 1.8, "eye");
  }
  for (const x of [-3, 3]) {
    p.add(x, 0, -1, "frogDark");
    p.add(x, 0, 1.5, "frogDark");
  }
  return p;
}

// A little bird: the body and head (`wings` apart, to flap), robin or blue tit.
function birdParts(robin) {
  const p = part();
  const [back, front] = robin ? ["robin", "breast"] : ["tit", "titBelly"];
  ellipsoid(p, [0, 2, 0], [1.4, 1.4, 2], (x, y, z) => (z > 0 && y < 2.5 ? front : back));
  ellipsoid(p, [0, 3.6, 1.4], [1.1, 1.1, 1.1], (x, y) => (!robin && y < 3.8 ? "titCheek" : robin && y < 3.6 ? "breast" : back));
  p.add(0, 3.5, 2.6, "beak");
  for (const x of [-1, 1]) p.add(x, 3.9, 2.1, "eye");
  for (let z = -3; z <= -2; z++) p.add(0, 2.3, z, robin ? "robinDark" : "tit");
  p.add(0, 0.5, 0.4, "body"); // legs
  const wings = [-1, 1].map((side) => {
    const w = part();
    for (let z = -1; z <= 1; z++) for (let u = 0; u <= 1; u++) w.add(side * u, 0, z, robin ? "robinDark" : "tit");
    return w;
  });
  return [p, wings];
}

function butterflyParts(color) {
  const body = part();
  for (let z = -1; z <= 1; z++) body.add(0, 0, z, "body");
  const wings = [-1, 1].map((side) => {
    const w = part();
    for (let u = 1; u <= 3; u++) for (let z = -1; z <= 2; z++) if (!(u === 3 && (z === -1 || z === 2))) w.add(side * u, 0, z, color);
    return w;
  });
  return [body, wings];
}

// `yard`: house/yard.js's front garden; `home`: the room's (for the time, the weather, the night, everyone).
export function makeWildlife(scene, yard, home) {
  const group = new THREE.Group();
  scene.add(group);
  const { pond } = yard;
  const intoPond = ([x, z], k = 0.75) => {
    const [dx, dz] = [(x - pond.x) / pond.rx, (z - pond.z) / pond.rz];
    const d = Math.hypot(dx, dz);
    return d < k ? [x, z] : [pond.x + (dx / d) * k * pond.rx, pond.z + (dz / d) * k * pond.rz];
  };
  const someoneNear = ([x, z], r) => home.actors.some((a) => a.out && Math.hypot(a.x - x, a.z - z) < r);
  const raining = () => home.weather.k > 0.3;

  /* ---------- the ducks ---------- */

  const ducks = [false, true, true, true].map((baby, i) => {
    const m = model(duckPart(baby), baby ? 0.45 : 0.8);
    group.add(m);
    const at = intoPond([pond.x - 12 - i * 6, pond.z + 2], 0.6);
    return { m, baby, x: at[0], z: at[1], yaw: Math.PI / 2, bob: Math.random() * 6, dip: 0, rippleAt: 0, v: 0 };
  });
  const mother = ducks[0];
  let goal = null; // where she is paddling to
  let crumbAt = null; // crumbs on the water, and until when they are worth it
  let restAt = 0;
  const NIGHT_SPOT = [pond.x + pond.rx - 10, pond.z + 2]; // by the reeds
  function updateDucks(t, dt) {
    // At night they doze huddled by the reeds, drifting a little this way and that, now and then one of
    // them waking to preen.
    const asleep = home.night && !crumbAt;
    if (crumbAt && t > crumbAt.until) crumbAt = null;
    if (crumbAt) goal = crumbAt.at;
    else if (!goal || (Math.hypot(goal[0] - mother.x, goal[1] - mother.z) < 3 && t > restAt)) {
      const [cx, cz, rx, rz] = asleep ? [...NIGHT_SPOT, 6, 5] : [pond.x, pond.z, pond.rx, pond.rz];
      goal = intoPond([cx + rnd(-1, 1) * rx, cz + rnd(-1, 1) * rz], asleep ? 0.8 : rnd(0.3, 0.72));
      restAt = t + (asleep ? rnd(15, 40) : rnd(1, 5));
    } else if (asleep && Math.hypot(goal[0] - NIGHT_SPOT[0], goal[1] - NIGHT_SPOT[1]) > 9) goal = NIGHT_SPOT; // (night falling)
    const speed = crumbAt ? 6 : asleep ? 1.2 : 4;
    const turnRate = crumbAt ? 2.5 : asleep ? 0.6 : 1.6; // (radians a second)
    ducks.forEach((d, i) => {
      // Each duckling follows the one ahead of it, a little way behind (close up while they doze).
      const lead = i ? ducks[i - 1] : null;
      const gap = asleep ? 4 : i === 1 ? 7 : 5;
      const [tx, tz] = lead ? [lead.x - Math.sin(lead.yaw) * gap, lead.z - Math.cos(lead.yaw) * gap] : goal;
      const dist = Math.hypot(tx - d.x, tz - d.z);
      // Paddling forwards only: turning towards where it is going (slowing while it turns round), easing
      // off as it gets there.
      const turn = dist > 0.5 ? wrap(Math.atan2(tx - d.x, tz - d.z) - d.yaw) : 0;
      d.yaw += clamp(turn, -turnRate * dt, turnRate * dt);
      const want = dist > 0.5 ? (lead ? speed * 1.3 : speed) * Math.max(0, Math.cos(turn)) * Math.min(1, dist / 4) : 0;
      d.v += (want - d.v) * Math.min(1, 2 * dt);
      const moving = d.v > 0.3;
      [d.x, d.z] = intoPond([d.x + Math.sin(d.yaw) * d.v * dt, d.z + Math.cos(d.yaw) * d.v * dt], 0.8);
      if (asleep) d.yaw += Math.sin(t * 0.21 + i * 1.7) * 0.08 * dt; // turning slowly on the water
      // At the crumbs, heads down for them now and then; at night, a preen now and then.
      if (crumbAt && dist < 4 && Math.random() < dt * 1.5) d.dip = 1;
      if (asleep && Math.random() < dt / 25) d.dip = 0.5;
      d.dip = Math.max(0, d.dip - dt * 1.6);
      d.bob += dt * (asleep ? 1.2 : 2.4);
      d.m.position.set(d.x, 0.2 + Math.sin(d.bob) * 0.18, d.z);
      d.m.rotation.set(Math.sin(d.dip * Math.PI) * 0.7 + (asleep ? 0.12 : 0), d.yaw, Math.sin(d.bob * 0.5) * (asleep ? 0.05 : 0.03), "YXZ");
      // Rings on the water: behind them as they paddle, and now and then as they shift about asleep.
      if (t > d.rippleAt) {
        yard.ripple(d.x - Math.sin(d.yaw) * 2, d.z - Math.cos(d.yaw) * 2, d.baby ? 0.4 : 0.7);
        d.rippleAt = t + (moving && !asleep ? 0.5 : rnd(3, 7));
      }
    });
  }

  /* ---------- the frog ---------- */

  const frog = { m: model(frogPart(), 0.8), pad: 0, hop: null, nextAt: rnd(6, 14), puff: 0 };
  group.add(frog.m);
  function updateFrog(t, dt) {
    const pads = yard.pads;
    const [px, pz] = pads[frog.pad];
    if (!frog.hop && t > frog.nextAt && !home.night) {
      const to = pick(pads.filter((_, i) => i !== frog.pad));
      frog.hop = { from: [px, pz], to, t0: t };
      frog.pad = pads.indexOf(to);
    }
    let [x, y, z] = [px, 1.5, pz];
    if (frog.hop) {
      const k = (t - frog.hop.t0) / 0.6;
      const { from, to } = frog.hop;
      x = from[0] + (to[0] - from[0]) * Math.min(1, k);
      z = from[1] + (to[1] - from[1]) * Math.min(1, k);
      y = 1.5 + 6 * Math.sin(Math.PI * Math.min(1, k));
      frog.m.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]);
      if (k >= 1) {
        frog.hop = null;
        frog.nextAt = t + rnd(8, 20);
      }
    }
    frog.puff = (frog.puff + dt) % 2.2;
    const croak = frog.puff < 0.5 ? Math.sin((frog.puff / 0.5) * Math.PI) : 0; // the throat swelling
    frog.m.position.set(x, y, z);
    frog.m.scale.set(0.8, 0.8 * (1 + 0.12 * croak), 0.8);
  }

  /* ---------- birds at the bird bath ---------- */

  const BATH = [yard.bath[0], 15.6, yard.bath[1]];
  const birds = [true, false].map((robin, i) => {
    const [body, wings] = birdParts(robin);
    const g = new THREE.Group();
    g.add(model(body));
    const w = wings.map((wp, k) => {
      const m = model(wp);
      m.position.set(k ? 1.4 : -1.4, 2.6, 0);
      g.add(m);
      return m;
    });
    g.scale.setScalar(0.9);
    g.visible = false;
    group.add(g);
    // Its own material, to fade it in as it comes and out as it flies off.
    const mat = g.children[0].material.clone();
    mat.transparent = true;
    g.children.forEach((m) => (m.material = mat));
    return { g, w, mat, state: "away", t0: 0, until: rnd(4, 12) + i * 6, from: null, to: null, perch: null, hopAt: 0 };
  });
  const rim = (a) => [BATH[0] + Math.cos(a) * 5.4, BATH[1], BATH[2] + Math.sin(a) * 5.4];
  const skyFrom = () => {
    const a = rnd(0, Math.PI * 2);
    return [BATH[0] + Math.cos(a) * 120, 90, BATH[2] + Math.sin(a) * 70];
  };
  function updateBirds(t, dt) {
    const scared =
      someoneNear(
        BATH.filter((_, k) => k !== 1),
        34
      ) ||
      raining() ||
      home.night;
    birds.forEach((b) => {
      if (b.state === "away" && t > b.until && !scared) {
        const a = rnd(0, Math.PI * 2);
        Object.assign(b, { state: "in", t0: t, from: skyFrom(), to: rim(a), perch: a });
        b.g.visible = true;
      }
      if (b.state === "perched" && (t > b.until || scared)) Object.assign(b, { state: "out", t0: t, from: rim(b.perch), to: skyFrom() });
      let flap = 0;
      if (b.state === "in" || b.state === "out") {
        const k = clamp((t - b.t0) / 1.6, 0, 1);
        const e = b.state === "in" ? 1 - (1 - k) ** 2 : k * k;
        const p = b.from.map((v, i) => v + (b.to[i] - v) * e);
        b.g.position.set(...p);
        b.g.rotation.y = Math.atan2(b.to[0] - b.from[0], b.to[2] - b.from[2]);
        b.mat.opacity = clamp(b.state === "in" ? k / 0.4 : (1 - k) / 0.6, 0, 1);
        flap = Math.sin(t * 40);
        if (k >= 1) {
          if (b.state === "in") Object.assign(b, { state: "perched", until: t + rnd(8, 20), hopAt: t + rnd(0.5, 2) });
          else {
            Object.assign(b, { state: "away", until: t + rnd(10, 30) });
            b.g.visible = false;
          }
        }
      } else if (b.state === "perched") {
        // Hopping round the rim, now and then a dip of the beak in the water, or a splash.
        if (t > b.hopAt) {
          b.perch += rnd(-0.8, 0.8);
          b.hopAt = t + rnd(0.8, 2.5);
          b.dip = Math.random() < 0.5 ? t : -1;
        }
        const [x, y, z] = rim(b.perch);
        const hop = Math.max(0, Math.sin((b.hopAt - t) * 8)) * 0.6;
        b.g.position.set(x, y + hop, z);
        b.g.rotation.y = Math.atan2(BATH[0] - x, BATH[2] - z); // facing the water
        const dipping = b.dip > 0 && t - b.dip < 0.6;
        b.g.rotation.x = dipping ? 0.6 * Math.sin(((t - b.dip) / 0.6) * Math.PI) : 0;
        flap = dipping ? 0 : Math.sin(t * 3) > 0.97 ? 1 : 0;
      }
      b.w.forEach((m, k) => (m.rotation.z = (k ? -1 : 1) * flap * 0.9));
    });
  }

  /* ---------- butterflies and moths ---------- */

  const beds = yard.flowerBeds;
  const inBed = () => {
    const [x0, x1, z0, z1] = pick(beds);
    return [rnd(x0, x1), rnd(6, 10), rnd(z0, z1)];
  };
  const flies = ["wingA", "wingB", "wingC"].map((c) => {
    const [body, wings] = butterflyParts(c);
    const g = new THREE.Group();
    g.add(model(body, 0.6));
    const w = wings.map((wp) => {
      const m = model(wp, 0.6);
      g.add(m);
      return m;
    });
    group.add(g);
    const at = inBed();
    return { g, w, at, to: inBed(), restUntil: 0, phase: Math.random() * 6 };
  });
  function updateFlies(t, dt) {
    const out = !home.night && !raining();
    flies.forEach((f) => {
      f.g.visible = out;
      if (!out) return;
      const d = Math.hypot(f.to[0] - f.at[0], f.to[2] - f.at[2]);
      const resting = t < f.restUntil;
      if (!resting) {
        if (d < 1.5) {
          f.restUntil = t + rnd(1.5, 5); // on a flower a while, wings slow
          f.to = Math.random() < 0.6 ? inBed() : [rnd(-100, 180), rnd(10, 30), rnd(-215, -135)];
        } else {
          const step = Math.min(d, 14 * dt);
          f.at[0] += ((f.to[0] - f.at[0]) / d) * step;
          f.at[2] += ((f.to[2] - f.at[2]) / d) * step;
          f.at[1] += (f.to[1] - f.at[1]) * Math.min(1, dt * 1.5);
          f.g.rotation.y = Math.atan2(f.to[0] - f.at[0], f.to[2] - f.at[2]);
        }
      }
      f.phase += dt * (resting ? 3 : 22);
      const bob = resting ? 0 : Math.sin(t * 5 + f.phase * 0.1) * 1.5;
      f.g.position.set(f.at[0], f.at[1] + bob, f.at[2]);
      f.w.forEach((m, k) => (m.rotation.z = (k ? -1 : 1) * (0.2 + 0.9 * Math.abs(Math.sin(f.phase)))));
    });
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  const at = new THREE.Vector3();

  // A moth now and then at a lamp at night: one to each, mostly away, that every so often flutters in out of
  // the dark, loops lazily round the light for a while (turning back the other way now and then) and drifts
  // off again.
  const MOTH = new THREE.BoxGeometry(1.8, 0.35, 1.1);
  const moths = yard.lamps.map(([[x, y, z], size]) => ({
    x,
    y,
    z,
    r: rnd(3.5, size * 0.5 + 2),
    a: rnd(0, 6.3),
    way: Math.random() < 0.5 ? -1 : 1,
    speed: rnd(1.2, 2),
    ph: rnd(0, 6.3),
    from: rnd(1, 10), // its next visit, from when until when
    until: 0,
    off: [0, 0], // where it comes from and goes back to, along x and z
  }));
  moths.forEach((m) => (m.until = m.from + rnd(8, 16)));
  const mothMesh = new THREE.InstancedMesh(MOTH, new THREE.MeshBasicMaterial({ color: "#f1e6c8" }), moths.length);
  mothMesh.frustumCulled = false;
  group.add(mothMesh);
  const flap = new THREE.Vector3();
  const VISIT = 2; // seconds to fly in, or away
  function updateMoths(t, dt) {
    mothMesh.visible = home.night && !raining();
    if (!mothMesh.visible) return;
    moths.forEach((m, i) => {
      if (t > m.until) {
        m.from = t + rnd(4, 12);
        m.until = m.from + rnd(8, 16);
        const away = rnd(0, 6.3);
        m.off = [Math.cos(away) * 26, Math.sin(away) * 26];
      }
      const k = smoothstep(0, VISIT, Math.min(t - m.from, m.until - t)); // 0 away, 1 at the lamp
      if (k <= 0) {
        mothMesh.setMatrixAt(i, m4.makeScale(0, 0, 0));
        return;
      }
      if (Math.random() < 0.15 * dt) m.way = -m.way;
      m.a += m.way * (m.speed + 0.6 * Math.sin(t * 1.3 + m.ph)) * dt;
      const r = m.r * (0.85 + 0.15 * Math.sin(t * 0.9 + m.ph));
      at.set(
        m.x + Math.cos(m.a) * r + (1 - k) * m.off[0],
        m.y + 1 + 1.5 * Math.sin(t * 1.6 + m.ph) + (1 - k) * 14,
        m.z + Math.sin(m.a) * r + (1 - k) * m.off[1]
      );
      e.set(0, -m.a - (m.way * Math.PI) / 2, 0.25 * Math.sin(t * 3 + m.ph));
      flap.set(0.35 + 0.65 * Math.abs(Math.sin(t * 18 + m.ph)), 1, 1); // the wings beating
      m4.compose(at, q.setFromEuler(e), flap);
      mothMesh.setMatrixAt(i, m4);
    });
    mothMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- petals off the cherry tree ---------- */

  const PETALS = 26;
  const petals = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.25, 0.8), new THREE.MeshLambertMaterial({ color: "#f9c6d6" }), PETALS);
  petals.frustumCulled = false;
  group.add(petals);
  const [tx, tz] = yard.tree;
  const fall = () => ({ x: tx + rnd(-30, 30), y: rnd(50, 70), z: tz + rnd(-26, 26), ph: rnd(0, 6), lie: 0, spin: rnd(1, 3) });
  const drops = Array.from({ length: PETALS }, () => Object.assign(fall(), { y: rnd(0, 70) }));
  function updatePetals(t, dt) {
    drops.forEach((p, i) => {
      if (p.y > 0) {
        p.y -= 6 * dt;
        p.x += (Math.sin(t * 1.3 + p.ph) * 5 + 3) * dt; // swaying down, drifting with the breeze
        p.z += Math.cos(t * 1.1 + p.ph) * 3 * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.lie = rnd(4, 9); // a while on the grass, then gone
        }
      } else if ((p.lie -= dt) <= 0) Object.assign(p, fall());
      e.set(p.y > 0 ? Math.sin(t * p.spin + p.ph) : 0, p.ph, p.y > 0 ? Math.cos(t * p.spin) * 0.6 : 0);
      m4.compose(at.set(p.x, Math.max(p.y, -0.3), p.z), q.setFromEuler(e), one);
      petals.setMatrixAt(i, m4);
    });
    petals.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    update(t, dt) {
      updateDucks(t, dt);
      updateFrog(t, dt);
      updateBirds(t, dt);
      updateFlies(t, dt);
      updateMoths(t, dt);
      updatePetals(t, dt);
    },
    // Crumbs thrown onto the pond at [x, z]: the ducks paddle over for them.
    crumbs(p) {
      crumbAt = { at: intoPond(p, 0.7), until: home.clock.t + 9 };
    },
    // Where the duck nearest [x, z] is, to look at it.
    duckNear([x, z]) {
      const d = ducks.reduce((best, k) => (Math.hypot(k.x - x, k.z - z) < Math.hypot(best.x - x, best.z - z) ? k : best));
      return [d.x, 3, d.z];
    },
    // A bird at the bath, if one is there or on its way, to look at.
    birdNear() {
      const b = birds.find((k) => k.state !== "away");
      return b ? b.g.position.toArray() : null;
    },
    // A butterfly up off the flowers at [x, y, z] (the nearest one, wherever it was), fluttering off.
    flutter([x, y, z]) {
      if (home.night || raining()) return;
      const f = flies.reduce((best, k) => (Math.hypot(k.at[0] - x, k.at[2] - z) < Math.hypot(best.at[0] - x, best.at[2] - z) ? k : best));
      f.at = [x + rnd(-3, 3), y, z + rnd(-3, 3)];
      f.restUntil = 0;
      f.to = [x + rnd(-40, 40), y + rnd(14, 24), z + rnd(-30, -10)];
    },
  };
}
