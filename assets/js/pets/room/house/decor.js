/*******************************************************************************
 * On the walls: a clock, a picture and the string lights.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box } from "../../models/voxels.js";
import { X0, BACK, FRONT, WALL_H, DOOR } from "./layout.js";
import { COLORS, glowing, place } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildDecor(shared) {
  const { house, mesh, updates } = shared;

  // A round clock over the front door that keeps the real time.
  const clockGroup = place(house, new THREE.Group(), [DOOR.x, 72, BACK + 0.6]);
  const clockPart = part();
  for (let x = -7; x <= 7; x++)
    for (let y = -7; y <= 7; y++) {
      const r = Math.hypot(x, y);
      if (r <= 7.4) clockPart.add(x, y, 0, r > 6 ? "woodMid" : "clockFace");
    }
  [
    [0, 5],
    [5, 0],
    [0, -5],
    [-5, 0],
  ].forEach(([x, y]) => clockPart.add(x, y, 0.3, "hand"));
  clockGroup.add(mesh(clockPart));
  const clockHands = [3.2, 4.8].map((len) => {
    const p = part();
    for (let y = 0; y <= Math.round(len); y++) p.add(0, y, 0, "hand");
    const m = place(clockGroup, mesh(p), [0, 0, 0.6]);
    m.scale.set(0.8, 1, 0.5);
    return m;
  });
  updates.push(() => {
    const d = new Date();
    const minutes = d.getMinutes() + d.getSeconds() / 60;
    clockHands[0].rotation.z = -((d.getHours() % 12) + minutes / 60) * (Math.PI / 6);
    clockHands[1].rotation.z = -minutes * (Math.PI / 30);
  });

  // A picture over the stairs: hills, a sun, and a little house.
  const picture = part();
  for (let x = -12; x <= 12; x++)
    for (let y = -9; y <= 9; y++) {
      let c;
      if (Math.abs(x) === 12 || Math.abs(y) === 9) c = "canvasFrame";
      else if (y < -3 + Math.round(2 * Math.sin(x * 0.4))) c = (x + y) % 4 ? "melon" : "plant";
      else if ((x - 6) ** 2 + (y - 4) ** 2 <= 5) c = "tin";
      else c = "photoSky";
      picture.add(x, y, 0, c);
    }
  box(picture, [-6, -2], [-4, -1], [0.4, 0.4], "photo");
  box(picture, [-7, -1], [0, 0], [0.4, 0.4], "kettle");
  place(house, mesh(picture), [-15, 66, BACK + 0.6]);

  // Fairy lights on a fine wire, hung in loose swags from tacks near the tops of both walls (clear of the
  // windows and the clock), glowing at night. Each wall's are their own (the back wall's fade with it: peek.js).
  const BULB_COLORS = ["#ffd27a", "#ff9e8a", "#a8e6a0", "#9fd3ff"].map((c) => new THREE.Color(c));
  const tmp = new THREE.Matrix4();
  const lit = new THREE.Color();
  let counted = 0; // bulbs so far, for the colours to run on from one wall to the next
  function swags(tacks, at) {
    const wireSpots = [];
    const bulbList = [];
    for (let s = 0; s + 1 < tacks.length; s++) {
      const [a, b] = [tacks[s], tacks[s + 1]];
      const y = (u) => WALL_H - 4 - 8 * Math.sin((Math.PI * (u - a)) / (b - a));
      for (let u = a; u <= b; u += 0.5) wireSpots.push(at(u, y(u)));
      for (let u = a + 4; u < b - 2; u += 8) bulbList.push(at(u, y(u) - 1));
    }
    const wire = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: COLORS.bulbWire }),
      wireSpots.length
    );
    wireSpots.forEach((p, i) => wire.setMatrixAt(i, tmp.makeTranslation(...p)));
    const bulbs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 2, 1.4), new THREE.MeshBasicMaterial(), bulbList.length);
    bulbList.forEach((p, i) => bulbs.setMatrixAt(i, tmp.makeTranslation(...p)));
    house.add(wire, bulbs);
    const first = counted;
    counted += bulbList.length;
    updates.push((t) => {
      bulbList.forEach((_, i) => {
        const k = first + i;
        const glowing = shared.night ? 0.75 + 0.25 * Math.sin(t * 2 + k * 1.7) : 0.45;
        bulbs.setColorAt(i, lit.copy(BULB_COLORS[k % 4]).multiplyScalar(glowing));
      });
      bulbs.instanceColor.needsUpdate = true;
    });
  }
  swags([X0 + 4, -50, 30, 106], (u, y) => [u, y, BACK + 0.8]);
  swags([BACK + 6, -45, 15, 75, FRONT - 4], (u, y) => [X0 + 0.8, y, u]);

  return {};
}
