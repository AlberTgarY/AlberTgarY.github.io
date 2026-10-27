/*******************************************************************************
 * Water in the playground: drops that fly under gravity, a little slowed by
 * the air, and splash where they land. The sprinkler's jet, the rain, and
 * drips off someone soaked or off an umbrella are all drops; each is drawn as
 * a small cube stretched along the way it is going (a fast one is a streak),
 * all of them one instanced mesh. Drops come in all sizes, a few catching the
 * light white; the jet holds together in a stream for a moment out of the
 * nozzle before it breaks up, with a fine mist drifting off it; splashes
 * shrink away as they settle.
 *
 * Units are voxels and seconds. With the two of them about 30 voxels tall, a
 * voxel is a few centimetres, so gravity is about 200 voxels/s².
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export const GRAVITY = 200;
const MAX = 2600;
const KINDS = {
  // drag (1/s), cube width, stretch per unit of speed, colours (the last, white, only now and then), how long
  // it holds together as a stream (s), how much the sizes vary
  jet: { drag: 0.35, w: 0.7, stretch: 0.016, colors: ["#8fd0f5", "#b9e3fa", "#d6f1fd", "#ffffff"], stream: 0.12, vary: 0.5 },
  mist: { drag: 5, w: 0.3, stretch: 0.01, colors: ["#e6f7ff", "#ffffff"], stream: 0, vary: 0.4 },
  splash: { drag: 1.5, w: 0.45, stretch: 0.012, colors: ["#b9e3fa", "#e6f7ff", "#ffffff"], stream: 0, vary: 0.5 },
  rain: { drag: 0, w: 0.35, stretch: 0.02, colors: ["#a9c6dc", "#c3d9ea"], stream: 0, vary: 0.3 },
  drip: { drag: 0.2, w: 0.55, stretch: 0.014, colors: ["#9fd8f7", "#d3efff"], stream: 0, vary: 0.3 },
  shower: { drag: 0.3, w: 0.32, stretch: 0.03, colors: ["#9fd8f7", "#c6ebfc", "#ffffff"], stream: 0.06, vary: 0.4 },
};
const KIND_NAMES = Object.keys(KINDS);
const RAIN = KIND_NAMES.indexOf("rain");

// `groundAt(x, z, y)` is how high the ground is under (x, z) for a drop at height y (the house's floors are
// one over the other), or -Infinity off the edge of the floor (the drop
// falls away). `water.hit(x, y, z, kind)` may be set to catch drops before they land (someone in the way);
// it returns true for a drop it caught. `water.landed(x, z, kind)` is told where each drop lands.
export function makeWater(scene, groundAt) {
  const pos = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3);
  const kind = new Uint8Array(MAX);
  const shade = new Uint8Array(MAX);
  const life = new Float32Array(MAX);
  const age = new Float32Array(MAX);
  const size = new Float32Array(MAX);
  let n = 0;

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ emissive: "#16303d", transparent: true, opacity: 0.85 }),
    MAX
  );
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const palette = KIND_NAMES.map((k) => KINDS[k].colors.map((c) => new THREE.Color(c)));

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const at = new THREE.Vector3();
  const scale = new THREE.Vector3();

  const water = {
    hit: null,
    landed: null,
    // A drop of `kind` at (x, y, z) going at (vx, vy, vz), for at most `secs`.
    emit(name, x, y, z, vx, vy, vz, secs = 4) {
      if (n >= MAX) return;
      const k = KIND_NAMES.indexOf(name);
      pos.set([x, y, z], n * 3);
      vel.set([vx, vy, vz], n * 3);
      kind[n] = k;
      const shades = palette[k].length;
      shade[n] = Math.random() < 0.1 ? shades - 1 : Math.floor(Math.random() * (shades - 1)); // (white seldom)
      life[n] = secs;
      age[n] = 0;
      size[n] = 1 + KINDS[name].vary * (Math.random() * 2 - 1);
      n++;
    },
    // A few drops thrown up and out from (x, y, z) where a drop has landed, `strength` 0 to 1.
    splash(x, y, z, strength = 1) {
      const count = Math.random() < strength ? 1 + Math.floor(Math.random() * 2.2 * strength) : 0;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (8 + Math.random() * 14) * strength;
        water.emit("splash", x, y + 0.3, z, Math.cos(a) * s, (22 + Math.random() * 22) * strength, Math.sin(a) * s, 0.5);
      }
    },
    count: () => n,
    update(dt) {
      let i = 0;
      while (i < n) {
        const k = KINDS[KIND_NAMES[kind[i]]];
        const o = i * 3;
        // Exact under gravity for the step, the air slowing it a little.
        const slow = Math.exp(-k.drag * dt);
        pos[o] += vel[o] * dt;
        pos[o + 1] += vel[o + 1] * dt - 0.5 * GRAVITY * dt * dt;
        pos[o + 2] += vel[o + 2] * dt;
        vel[o] *= slow;
        vel[o + 1] = (vel[o + 1] - GRAVITY * dt) * slow;
        vel[o + 2] *= slow;
        life[i] -= dt;
        age[i] += dt;
        const [x, y, z] = [pos[o], pos[o + 1], pos[o + 2]];
        const name = KIND_NAMES[kind[i]];
        let gone = life[i] <= 0 || y < -80;
        const settles = name === "splash" || name === "mist";
        if (!gone && !settles && water.hit?.(x, y, z, name)) gone = true;
        if (!gone) {
          const ground = groundAt(x, z, y);
          if (y <= ground) {
            gone = true;
            if (!settles) {
              water.landed?.(x, z, name);
              water.splash(x, ground, z, name === "rain" ? 0.45 : name === "drip" ? 0.4 : 0.8);
            }
          }
        }
        if (gone) {
          // Swap the last one in.
          n--;
          pos.copyWithin(o, n * 3, n * 3 + 3);
          vel.copyWithin(o, n * 3, n * 3 + 3);
          kind[i] = kind[n];
          shade[i] = shade[n];
          life[i] = life[n];
          age[i] = age[n];
          size[i] = size[n];
          continue;
        }
        i++;
      }
      // Draw: each a cube stretched along its velocity, a young jet drawn out long into a stream, what settles
      // (a splash, the mist) shrinking away over its last moments.
      for (let j = 0; j < n; j++) {
        const k = KINDS[KIND_NAMES[kind[j]]];
        const o = j * 3;
        dir.set(vel[o], vel[o + 1], vel[o + 2]);
        const speed = dir.length();
        if (speed > 1e-3) q.setFromUnitVectors(up, dir.multiplyScalar(1 / speed));
        else q.identity();
        const w = k.w * size[j] * (k.stream || kind[j] === RAIN ? 1 : Math.min(1, life[j] / 0.2));
        const long = age[j] < k.stream ? 3 : 1;
        scale.set(w, Math.max(w, Math.min(5 * long, speed * k.stretch * long)), w);
        m4.compose(at.set(pos[o], pos[o + 1], pos[o + 2]), q, scale);
        mesh.setMatrixAt(j, m4);
        mesh.setColorAt(j, palette[kind[j]][shade[j]]);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
  return water;
}
