/*******************************************************************************
 * On the walls: a clock and a picture.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box } from "../../models/voxels.js";
import { BACK, DOOR } from "./layout.js";
import { glowing, place } from "./kit.js";

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

  return {};
}
