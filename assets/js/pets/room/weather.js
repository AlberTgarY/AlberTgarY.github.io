/*******************************************************************************
 * The weather in the playground: now and then it clouds over for a while,
 * and now and then, by day or by night, it rains for a minute or two (the TV
 * forecast says which, screens.js). The windows and the open door show it (house.js), the
 * light goes grey (room.js), and over the garden the rain comes down in
 * streaks (water.js), splashing on the grass and the beds, watering them, and
 * filling little puddles on the stepping stones, rings spreading on them, that
 * dry up again after. Anyone going out takes an umbrella, the dog wears her
 * raincoat (acts.js), and they come back in with wet feet (prints.js).
 *
 * It rains when it will, whoever is out: anyone caught in the garden runs in,
 * anyone caught out on a walk comes home soaked, and while it rains no one
 * goes out into the garden (acts.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd } from "../stage.js";

const GARDEN = { x: [151, 209], z: [-27, 109] }; // where the rain falls (the rest is under the roof)
const PUDDLES = [
  [161, -12, 3.2],
  [161, 20, 2.6],
  [159, 41, 3.6],
  [161, 84, 3],
  [182, 48, 4.2],
  [192, 79, 3],
  [180, 112 - 8, 2.6],
]; // x, z and size (on the stepping stones and in dips in the lawn)

export function makeWeather(scene, water) {
  const w = {
    raining: false,
    k: 0, // how hard it is raining, easing in and out
    wet: 0, // how wet the ground is
    cloud: 0, // how cloudy it is, easing in and out: a cloudy spell now and then, and always when it rains
    cloudy: false,
    cloudUntil: 0,
    cloudAt: rnd(60, 200),
    // What the forecast should say: "sunny", "cloudy" or "rain".
    get sky() {
      return w.raining || w.k > 0.3 ? "rain" : w.cloud > 0.5 ? "cloudy" : "sunny";
    },
    until: 0,
    nextAt: rnd(150, 300),
    // Rain now for `secs` (or stop with 0); for trying it out.
    rain(t, secs) {
      w.raining = secs > 0;
      w.until = t + secs;
      if (!w.raining) w.nextAt = t + rnd(180, 360);
    },
  };

  // The puddles: flat pools that fill while it rains and dry after, with rings spreading where drops land.
  const puddles = PUDDLES.map(([x, z, r]) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshLambertMaterial({ color: "#a9c4d6", transparent: true, opacity: 0, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, -0.35, z);
    m.scale.set(r * 1.4, r, 1);
    m.visible = false;
    scene.add(m);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 18),
      new THREE.MeshLambertMaterial({ color: "#e8f4fb", transparent: true, opacity: 0, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    return { m, ring, x, z, r, ringAt: 0 };
  });

  let rainDebt = 0;
  w.update = (t, dt) => {
    if (!w.raining && t > w.nextAt) {
      if (Math.random() < 0.4) w.rain(t, rnd(90, 200));
      else w.nextAt = t + rnd(150, 300);
    }
    if (w.raining && t > w.until) w.rain(t, 0);
    w.k += ((w.raining ? 1 : 0) - w.k) * (1 - Math.exp(-0.35 * dt));
    if (!w.cloudy && t > w.cloudAt) {
      w.cloudy = true;
      w.cloudUntil = t + rnd(60, 150);
    }
    if (w.cloudy && t > w.cloudUntil) {
      w.cloudy = false;
      w.cloudAt = t + rnd(120, 300);
    }
    w.cloud += ((w.raining || w.cloudy ? 1 : 0) - w.cloud) * (1 - Math.exp(-0.25 * dt));
    w.wet = Math.min(1, Math.max(0, w.wet + (w.k > 0.3 ? dt / 25 : -dt / 140)));

    // The rain over the garden: streaks falling fast, a little slanted by the wind, already at full speed
    // (picked up from the height of the house, so as not to be seen falling over the rooms behind).
    rainDebt += 330 * w.k * dt;
    for (; rainDebt >= 1; rainDebt--) {
      const x = rnd(...GARDEN.x) - 4;
      const z = rnd(...GARDEN.z);
      water.emit("rain", x, rnd(30, 48), z, 14, -240, 0, 1.2);
    }

    // The puddles fill as the ground soaks, and a ring spreads on one now and then while it rains.
    for (const p of puddles) {
      const fill = Math.min(1, w.wet * 1.4);
      p.m.visible = fill > 0.02;
      p.m.material.opacity = 0.5 * fill;
      p.m.scale.set(p.r * 1.4 * (0.4 + 0.6 * fill), p.r * (0.4 + 0.6 * fill), 1);
      if (w.k > 0.3 && fill > 0.3 && t > p.ringAt) {
        p.ringAt = t + rnd(0.3, 1.2) / w.k;
        p.ringBorn = t;
        p.ring.position.set(p.x + rnd(-0.6, 0.6) * p.r, -0.3, p.z + rnd(-0.5, 0.5) * p.r);
      }
      const age = p.ringBorn === undefined ? 1 : (t - p.ringBorn) / 0.7;
      p.ring.visible = age < 1;
      if (age < 1) {
        p.ring.scale.setScalar(0.4 + 1.8 * age);
        p.ring.material.opacity = 0.7 * (1 - age);
      }
    }
  };
  return w;
}
