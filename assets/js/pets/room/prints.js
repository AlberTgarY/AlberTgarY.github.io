/*******************************************************************************
 * Wet footprints on the playground's floor: someone coming in from the rain,
 * or soaked by the sprinkler, leaves a print at each of their first few steps
 * indoors (`a.wetFeet` of them), a shoe or a paw, that dries away over half a
 * minute. actor.js says when a foot comes down.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const POOL = 48;
const DRY = 30; // s for a print to dry

// A print drawn texel by texel: a shoe sole (heel and toe), or a paw (pad and four toes).
function printTexture(rows) {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const g = canvas.getContext("2d");
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && ((g.fillStyle = "#fff"), g.fillRect(x, y, 1, 1))));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}
const SHOE = [".##.", "####", "####", "####", ".##.", "....", ".##.", "####", ".##."];
const PAW = ["#.#.#", ".....", "#...#", ".###.", "#####", ".###."];

// `indoors(x, z)` says whether (x, z) is on a floor that shows prints.
export function makePrints(scene, clock, indoors) {
  const kinds = {
    shoe: { tex: printTexture(SHOE), size: [2, 4.5], side: 1.7 },
    paw: { tex: printTexture(PAW), size: [2.6, 3.1], side: 2.6 },
  };
  const pool = Array.from({ length: POOL }, () => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: "#4a3626", transparent: true, opacity: 0, depthWrite: false })
    );
    m.rotation.order = "YXZ";
    m.visible = false;
    scene.add(m);
    return { m, born: -Infinity, strength: 0 };
  });
  let next = 0;
  return {
    // A foot (`side` 0 or 1) of `a` coming down where it walks.
    step(a, side) {
      if (!(a.wetFeet > 0) || !a.rig.group.visible || a.above() > 0.5 || !indoors(a.x, a.z)) return;
      const kind = a.human ? kinds.shoe : kinds.paw;
      const [sx, sz] = [Math.cos(a.yaw), -Math.sin(a.yaw)]; // to its right
      const off = (side ? 1 : -1) * kind.side * a.rig.group.scale.x;
      const p = pool[next];
      next = (next + 1) % POOL;
      p.m.material.map = kind.tex;
      p.m.material.needsUpdate = true;
      p.m.scale.set(...kind.size, 1);
      p.m.position.set(a.x + sx * off, -0.43, a.z + sz * off);
      p.m.rotation.set(-Math.PI / 2, a.yaw + Math.PI, 0);
      p.m.visible = true;
      p.born = clock.t;
      p.strength = Math.min(1, a.wetFeet / 4); // the last few fainter
      a.wetFeet--;
    },
    update() {
      for (const p of pool) {
        if (!p.m.visible) continue;
        const age = (clock.t - p.born) / DRY;
        if (age >= 1) p.m.visible = false;
        else p.m.material.opacity = 0.42 * p.strength * (1 - age * age);
      }
    },
  };
}
