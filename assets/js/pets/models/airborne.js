/*******************************************************************************
 * What the girl and the collie come down with when they are picked up and let
 * go (pets/pet.js): little white angel wings, and a parachute in the collie's
 * red. Each model builds its own the first time it is dropped, so a pet that
 * never is (and the playground's) never has them.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, easeOutBack, smoothstep } from "./voxels.js";

const COLORS = {
  wing: "#ffffff",
  wingShade: "#e3e9f3", // the feathers' soft blue-grey edges
  canopy: "#d9434f", // the collie's harness red
  canopyLight: "#f6f1e7",
  canopyRim: "#b8323d",
  cord: "#6d625a",
  pack: "#b8323d",
};

// A wing as seen from behind, its root at the bottom left (row ROOT, column 0) and its tip up and out at
// the top right: W white, S the shaded edge of a feather, the flight feathers hanging in a scalloped fan
// below. Its root sits behind her hair, so the outer half shows either side of her.
const WING = [
  "..........WWW..",
  "........WWWWWW.",
  "......WWWWWWWWW",
  "....WWWWWWWWWWW",
  "..WWWWWWWWWWWWS",
  ".WWWWWWWWWWWWS.",
  "WWWWWWWWWWSWS..",
  "WWWWWWWWSWWS...",
  "WWWWWSWWWSS....",
  "WWWSWWWSWS.....",
  ".WSWWSWWS......",
  "..WWSWWS.......",
  "...SS.SS.......",
];
const ROOT = 8;

// Two little wings on `parent` (the girl's pose), their roots `at` [x, y, z] either side of the middle of her
// back (x for the left one; the right one mirrors it). update(out, beat): `out` from 0 (folded away, hidden)
// to 1 (spread), `beat` the phase of the wingbeat (up as its sine rises).
export function angelWings(parent, [x0, y0, z0]) {
  const wings = [-1, 1].map((side) => {
    const p = part();
    WING.forEach((row, j) =>
      [...row].forEach((cell, i) => {
        if (cell === ".") return;
        const color = cell === "S" ? "wingShade" : "wing";
        p.add(side * i, ROOT - j, 0, color);
        if (j <= ROOT && i < 10) p.add(side * i, ROOT - j, -1, color); // thicker towards the root
      })
    );
    const wing = new THREE.Group();
    wing.position.set(side * x0, y0, z0);
    wing.add(p.mesh(COLORS));
    wing.visible = false;
    parent.add(wing);
    return wing;
  });
  return {
    update(out, beat) {
      const size = easeOutBack(Math.min(1, out)); // popping out with a little overshoot
      wings.forEach((wing, i) => {
        const side = i ? 1 : -1;
        wing.visible = out > 0.01;
        wing.scale.setScalar(Math.max(0.001, size));
        // Swept back, beating up and down; folding away, they close back flat against her as they shrink.
        const fold = 1 - Math.min(1, out);
        wing.rotation.set(0.15, side * (0.3 + 1.3 * fold), side * (0.25 + 0.35 * Math.sin(beat)) * (1 - fold));
      });
    },
  };
}

// A parachute on `parent` (the collie's pose) whose cords meet `at` [x, y, z], the ring of her harness: a
// dome of red and cream panels with a darker rim and a vent at the top, eight cords, and the pack it comes
// out of. update(out, droop, breath, lean): `out` from 0 (packed away) to 1 (open overhead), `droop` from 0 to
// 1 as it collapses to one side and is gone once she is down, `breath` the phase of the canopy filling and
// easing, and `lean` [x, z] how far it leans, as rotations of the model.
export function parachute(parent, at) {
  const R = 17; // the dome's radius
  const TOP = 40; // its top, above the harness ring
  const cy = TOP - R; // its centre
  const rimY = Math.ceil(cy + 0.45 * R); // the lowest ring of panels
  const dome = part();
  for (let x = -R; x <= R; x++)
    for (let z = -R; z <= R; z++)
      for (let y = rimY; y <= TOP; y++) {
        const d = Math.hypot(x, y - cy, z);
        if (d > R || d < R - 1.6) continue;
        const r = Math.hypot(x, z);
        const panel = Math.floor(((Math.atan2(z, x) + Math.PI) / Math.PI) * 4) % 2;
        dome.add(x, y, z, y === rimY || r < 2.5 ? "canopyRim" : panel ? "canopy" : "canopyLight");
      }
  // The cords, from the rim between every other pair of panels down to the ring.
  const cords = part();
  const rimR = Math.sqrt(R * R - (rimY - cy) ** 2) - 0.8;
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2;
    const [ex, ey, ez] = [rimR * Math.cos(a), rimY - 0.5, rimR * Math.sin(a)];
    const n = Math.ceil(Math.hypot(ex, ey, ez) * 1.5);
    for (let s = 3; s <= n; s++) cords.add(Math.round((ex * s) / n), Math.round((ey * s) / n), Math.round((ez * s) / n), "cord");
  }
  const canopy = new THREE.Group();
  canopy.add(dome.mesh(COLORS), cords.mesh(COLORS));
  // The pack on her back, between the harness ring and the canopy.
  const packPart = part();
  for (let x = -3; x <= 3; x++) for (let y = 0; y <= 2; y++) for (let z = -3; z <= 2; z++) packPart.add(x, y, z, "pack");
  const pack = packPart.mesh(COLORS);
  const group = new THREE.Group();
  group.position.set(...at);
  group.add(pack, canopy);
  group.visible = false;
  parent.add(group);
  return {
    update(out, droop, breath, [leanX, leanZ]) {
      group.visible = out > 0.01;
      pack.visible = droop < 0.95;
      // Opening, the cords shoot up out of the pack and the canopy blooms open with a little overshoot, then
      // keeps filling and easing in the air; collapsing, it tips over to one side, sags and is gone.
      const up = smoothstep(0, 0.35, out) * (1 - 0.55 * smoothstep(0, 0.6, droop));
      const wide = easeOutBack(smoothstep(0.15, 1, out)) * (1 + 0.035 * Math.sin(breath));
      const gone = 1 - smoothstep(0.55, 1, droop);
      canopy.visible = up > 0.01 && gone > 0.01;
      const across = Math.max(0.001, (0.2 + 0.8 * wide) * gone);
      canopy.scale.set(across, Math.max(0.001, up * (1 - 0.025 * Math.sin(breath)) * gone), across);
      canopy.rotation.set(leanX, 0, leanZ + 1.25 * smoothstep(0, 0.7, droop));
    },
  };
}
