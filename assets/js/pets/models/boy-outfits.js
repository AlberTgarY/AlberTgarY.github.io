/*******************************************************************************
 * The boy's other day clothes, for the playground: besides his blue T-shirt
 * and white-grey trousers (boy.js), a cream puffer jacket quilted in
 * horizontal baffles, its padded hood folded down round the back of the neck,
 * its stand-up collar zipped to the chin over a black top, a little black patch
 * with a white mountain on his right chest and black tabs at the cuffs; loose
 * off-white trousers and black shoes. His neckband earphones' pods hang out of
 * the collar.
 *
 * The profile page never loads this file, so he is unchanged there.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box } from "./voxels.js";

const COLORS = {
  puffer: "#ece3d0",
  pufferLight: "#f5efe3",
  pufferSeam: "#d6c8ae",
  pufferZip: "#3a3530",
  innerBlack: "#1e1e22",
  patch: "#17171a",
  patchMark: "#f4f4f2",
  pant: "#e9e8e3",
  pantFold: "#d3d2cc",
};

const SEAMS = [9, 11, 14, 17]; // the jacket's stitched lines (9 the hem), the baffles puffing out between them
const legX = (side) => (side > 0 ? [1, 3] : [-3, -1]); // as boy.js
const looseX = (side) => (side > 0 ? [1, 4] : [-4, -1]); // a voxel wider on the outside
const skinX = (side, x0) => (side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2]); // the inner two columns of an arm

// The jacket from the hem to the collar, with his neckband earphones as in boy.js.
function jacket() {
  const p = part();
  for (let y = 9; y <= 19; y++) {
    const seam = SEAMS.includes(y);
    const rx = y <= 17 ? 5 : y === 18 ? 4.5 : 4; // round shoulders
    ellipsoid(p, [0, y, -0.5], [rx + (seam ? 0 : 0.5), 0.5, seam ? 3.6 : 4.6], seam ? "pufferSeam" : "puffer", [], 3);
  }
  for (let y = 9; y <= 18; y++) p.front(0, y)[3] = "pufferZip";
  // His right chest: a black patch with a little white mountain on it.
  for (const [x, y, c] of [
    [-4, 15, "patch"],
    [-3, 15, "patchMark"],
    [-2, 15, "patch"],
    [-4, 14, "patchMark"],
    [-3, 14, "patch"],
    [-2, 14, "patchMark"],
  ])
    p.front(x, y)[3] = c;
  // A stand-up collar zipped up to his chin, beige outside and black inside, a little of his black top showing
  // at the throat above the zip.
  for (let y = 20; y <= 21; y++)
    for (let x = -4; x <= 4; x++)
      for (let z = -4; z <= 3; z++) {
        const n = (x / 3.7) ** 2 + ((z + 0.5) / 3.3) ** 2;
        if (n <= 1) p.add(x, y, z, n <= 0.5 ? "innerBlack" : "puffer");
      }
  p.front(0, 20)[3] = "pufferZip";
  p.front(0, 21)[3] = "innerBlack";
  // The hood, folded down: a soft padded roll lying round the back of the neck and over the tops of the
  // shoulders, outside the collar, lit on top and shaded underneath and at its folds, a thin black band
  // along its opening's edge. `phi` goes round the neck from the back (0) to either side (+-pi/2) and
  // a little further, where the roll tapers off; `d` is how far out from the roll's middle line. A and B are
  // the middle line's half-widths across and back, R and H half the roll's thickness and height, Y its height.
  const [A, B, R, H, Y] = [5.6, 5, 1.9, 1.6, 21];
  for (let x = -8; x <= 8; x++)
    for (let z = -9; z <= 2; z++)
      for (let y = 20; y <= 22; y++) {
        const phi = Math.atan2(x / A, -(z + 0.5) / B);
        const taper = Math.sqrt(Math.max(0, 1 - ((Math.abs(phi) - 1.45) / 0.45) ** 2));
        const k = Math.abs(phi) <= 1.45 ? 1 : taper;
        const d = (Math.hypot(x / A, (z + 0.5) / B) - 1) * Math.hypot(A * Math.sin(phi), B * Math.cos(phi));
        if ((d / R) ** 2 + ((y - Y) / H) ** 2 > k * k || p.has(x, y, z)) continue;
        const fold = [0, 0.9, -0.9].some((f) => Math.abs(phi - f) < 0.12);
        p.add(x, y, z, d < -0.5 && y >= Y ? "innerBlack" : y < Y || fold ? "pufferSeam" : y > Y ? "pufferLight" : "puffer");
      }
  // His neckband earphones: the band round his neck inside the collar, its ends coming out over the collar's
  // front to a pod each side resting on the chest.
  const podZ = p.front(3, 18)[2] + 1;
  for (const side of [-1, 1]) {
    p.add(side * 3, 21, 2, "band");
    p.add(side * 3, 20, 3, "band");
    for (let y = 17; y <= 19; y++)
      for (const x of [side * 3, side * 4]) p.add(x, y, podZ, y === 17 ? "podTip" : x === side * 4 && y === 19 ? "podShine" : "pod");
  }
  p.add(4, 18, podZ + 1, "logo");
  return { p, podZ };
}

// A sleeve's rows: puffed out between the seams, which pull it in.
const sleeve = (p, side, x0, y0, y1) => {
  for (let y = y0; y <= y1; y++) {
    const seam = SEAMS.includes(y);
    const xs = seam ? [x0, x0 + 2] : [x0 - (side < 0 ? 1 : 0), x0 + 2 + (side > 0 ? 1 : 0)];
    box(p, xs, [y, y], seam ? [-2, 1] : [-3, 1], seam ? "pufferSeam" : "puffer");
  }
};

// Puts his other clothes on his rig (boy.js), hidden: `wear(k)` puts on his blue T-shirt (0) or the puffer
// jacket (1) by day; his pyjamas still come out at night.
export function dressBoy(rig) {
  const palette = { ...rig.palette, ...COLORS };
  const { limbs, pose, outfits } = rig;
  const meshes = [];
  const add = (parent, p) => {
    const m = p instanceof THREE.Object3D ? p : p.mesh(palette);
    m.visible = false;
    parent.add(m);
    meshes.push(m);
    return m;
  };

  const { p: body, podZ } = jacket();
  add(pose, body);
  const cableMat = new THREE.MeshLambertMaterial({ color: palette.cable });
  for (const side of [-1, 1]) {
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6, 0.35), cableMat);
    cable.position.set(side * 3.6, 15.3, podZ + 0.3);
    cable.rotation.z = side * 0.12;
    add(pose, cable);
  }
  limbs.legs.forEach(({ hip, knee }, i) => {
    const side = i ? 1 : -1;
    const fold = (x, y, z) => (z === 1 && x === side * 2 ? "pantFold" : "pant");
    const thigh = part();
    box(thigh, looseX(side), [5, 8], [-2, 1], fold);
    add(hip.inner, thigh);
    const shin = part();
    box(shin, looseX(side), [2, 4], [-2, 1], fold);
    box(shin, legX(side), [0, 1], [-2, 2], (x, y) => (y === 0 ? "sole" : "shoe"));
    add(knee.inner, shin);
  });
  limbs.arms.forEach(({ shoulder, elbow }, i) => {
    const side = i ? 1 : -1;
    const x0 = side > 0 ? 5 : -7;
    const upper = part();
    sleeve(upper, side, x0, 14, 19);
    add(shoulder.inner, upper);
    const fore = part();
    sleeve(fore, side, x0, 11, 13);
    box(fore, [x0, x0 + 2], [10, 10], [-2, 1], "pufferSeam"); // the cuff
    const out = side > 0 ? x0 + 3 : x0 - 1;
    box(fore, [out, out], [10, 10], [0, 1], "innerBlack"); // its tab
    box(fore, skinX(side, x0), [8, 9], [-1, 0], "skin");
    add(elbow.inner, fore);
  });

  let current = 0;
  let night = false;
  const show = () => {
    outfits[0].forEach((m) => (m.visible = !night && current === 0));
    meshes.forEach((m) => (m.visible = !night && current === 1));
  };
  rig.nightwear = (on) => {
    night = on;
    outfits[1].forEach((m) => (m.visible = on));
    show();
  };
  return {
    count: 2,
    get current() {
      return current;
    },
    wear(k) {
      current = k;
      show();
    },
  };
}
