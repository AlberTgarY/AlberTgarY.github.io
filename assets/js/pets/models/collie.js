/*******************************************************************************
 * The border collie (assets/js/pets/models/voxels.js has the building blocks).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import {
  part,
  ellipsoid,
  box,
  pivotGroup,
  surfaceOf,
  paintEyes,
  walkLegs,
  sitUp,
  foodBowl,
  chowPose,
  nightcap,
  CAP_COLORS,
  harness,
} from "./voxels.js";

export function buildCollie() {
  const palette = {
    black: "#32323a", // charcoal rather than pure black, so the glossy eyes stand out
    fold: "#4b4b56",
    white: "#f3efe6",
    eye: "#050506",
    glint: "#ffffff",
    nose: "#15151a",
    mouth: "#4a1f26",
    tongue: "#f08a9c",
    bowl: "#4f86d6",
    bowlRim: "#7ba7ea",
    food: "#a8662f", // kibble
    foodDark: "#7d4520",
    cap: "#cc3a41",
    capRow: "#b4323a",
    ...CAP_COLORS,
  };
  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Body: black back and sides, white chest and belly.
  const bodyPart = part();
  ellipsoid(bodyPart, [0, 17, 0], [10, 9, 15], (x, y, z) => (y <= 10 || (z >= 9 && y <= 23) ? "white" : "black"));
  pose.add(bodyPart.mesh(palette));

  // Legs hang from hips at y = 10; the hind legs have black thighs.
  const legs = [
    [-5, 8, false],
    [5, 8, false],
    [-5, -9, true],
    [5, -9, true],
  ].map(([cx, cz, hind]) => {
    const p = part();
    box(p, [cx - 2, cx + 1], [0, 9], [cz - 2, cz + 1], "white");
    box(p, [cx - 2, cx + 1], [0, 0], [cz + 2, cz + 2], "white"); // toes
    if (hind) box(p, [cx - 3, cx + 2], [5, 9], [cz - 3, cz + 2], "black");
    const g = pivotGroup(pose, [cx, 10, cz]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  // Tail: bushy, carried low and back with an upward sweep at the white tip.
  const tailPart = part();
  const TAIL_PATH = [
    [21, -14],
    [19, -17],
    [17, -19.5],
    [16, -22],
    [16, -24.5],
    [17.5, -26.5],
    [19.5, -27.5],
    [21.5, -28],
  ];
  TAIL_PATH.forEach(([cy, cz], i) => ellipsoid(tailPart, [0, cy, cz], [2, 2.2, 2.2], i >= 6 ? "white" : "black"));
  const tailPivot = pivotGroup(pose, [0, 21, -14]);
  tailPivot.inner.add(tailPart.mesh(palette));

  // Head: black with a narrow blaze that widens into the white muzzle and chin.
  const headPart = part();
  const blazeHalf = (y) => (y >= 40 ? 1 : y >= 35 ? 1.5 : 1.5 + (35 - y) * 0.45);
  ellipsoid(headPart, [0, 32, 8], [12, 11, 10], (x, y, z) => (z >= 0 && Math.abs(x) <= blazeHalf(y) ? "white" : "black"), [bodyPart]);
  // Muzzle: a broad base tapering into a slimmer snout, with the lower jaw set back under it.
  ellipsoid(headPart, [0, 28, 16], [6.5, 5, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 28, 22], [4.3, 3.8, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 24.5, 16], [4.3, 3.5, 8], "white", [bodyPart]);
  for (let x = -2; x <= 2; x++) for (let y = 28; y <= 30; y++) headPart.front(x, y)[3] = "nose";
  const headPivotY = 26; // the neck
  const head = pivotGroup(pose, [0, headPivotY, 6]);
  head.inner.add(headPart.mesh(palette));
  const surface = surfaceOf(headPart);

  // Eyes: big, round, glossy black, with a large sparkle at the upper left and a small one at the
  // lower right, on the same side for both eyes as if lit by one light.
  const GLINTS = new Set(["1,1", "2,1", "1,2", "3,3"]);
  const eyePart = part();
  const eyeCells = paintEyes(eyePart, surface, [-9, 5], 36, (i, j) => (GLINTS.has(`${i},${j}`) ? "glint" : "eye"));
  head.inner.add(eyePart.mesh(palette));

  // A small ω mouth under the nose.
  const mouthPart = part();
  [
    [-2, 27],
    [-1, 26],
    [0, 27],
    [1, 26],
    [2, 27],
  ].forEach(([x, y]) => mouthPart.add(...surface(x, y, 0.4), "mouth"));
  head.inner.add(mouthPart.mesh(palette));

  // Eyelids sit a hair in front of the eyes and are shown to blink or sleep.
  const lidPart = part();
  eyeCells.forEach(({ p: [x, y, z] }) => lidPart.add(x, y, z + 0.1, "black"));
  const eyelids = lidPart.mesh(palette);
  eyelids.visible = false;
  head.inner.add(eyelids);

  // Open mouth with the tongue out, shown while panting.
  const tonguePart = part();
  for (let x = -1; x <= 1; x++) {
    const z = headPart.front(x, 26)[2] + 0.45;
    tonguePart.add(x, 26, z, "mouth");
    tonguePart.add(x, 25, z, "tongue");
    tonguePart.add(x, 24, z - 0.5, "tongue");
    if (x === 0) tonguePart.add(x, 23, z - 1, "tongue");
  }
  const tongue = tonguePart.mesh(palette);
  tongue.visible = false;
  head.inner.add(tongue);

  // Ears: tapered and upright, splaying outwards, with the tip folded over and down.
  const ears = [-1, 1].map((side) => {
    const base = side * 7;
    const p = part();
    let top = [base, 38];
    for (let k = 0; k <= 8; k++) {
      const half = 4 - k * 0.38;
      const cx = base + side * k * 0.5;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++)
        for (let z = 2; z <= 5; z++) if (!headPart.has(x, 37 + k, z)) p.add(x, 37 + k, z, "black");
      top = [Math.round(cx), 37 + k];
    }
    // The folded tip: a small flap hanging forward and outward from the top of the ear.
    for (let k = 0; k <= 3; k++)
      for (let w = -1; w <= 1; w++) p.add(top[0] + side * (1 + k) + w, top[1] - k, 6, k === 0 && w !== 0 ? "black" : "fold");
    const g = pivotGroup(head.inner, [base, 38, 3.5]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  // Where she carries a ball, in the front of her mouth.
  const mouth = new THREE.Object3D();
  mouth.position.set(0, 24.5, 24);
  head.inner.add(mouth);

  const hat = nightcap(headPart, { y0: 42, z0: 7, radius: 8.5, height: 13 }).mesh(palette);
  head.inner.add(hat);

  // A red harness just behind the head, clear of it.
  const { mesh: harnessMesh, clip } = harness(pose, bodyPart, { harness: "#d9434f" }, { cy: 17, z0: -2 });

  // A bowl of kibble at her front paws when she is fed, under her mouth once her head is down in it.
  const serve = foodBowl(group, palette, 24, 5);
  const CHOW = { drop: 9, reach: 5, nod: 0.7 };
  const SIT = { tip: 0.5, reach: 0.26, fold: 0.45 };

  // Tail: slow idle wag, brisk when walking or happy, resting low when asleep.
  let wagPhase = 0;
  let wagAmp = 0.25;
  let chow = 0; // 0 head up, 1 head in the bowl
  const lieDrop = 8;
  return {
    label: "Voxel border collie, click to pet",
    hint: "pet me",
    group,
    pose,
    head,
    legs, // front pair first
    bowlZ: 24, // how far in front of her the bowl stands while she eats
    headPivotY,
    ears,
    eyelids,
    hat,
    harness: harnessMesh,
    clip,
    mouth,
    lieDrop,
    headDrop: 3,
    headAt: [32, 10],
    hit: [24, 22, 27],
    shadow: [13, 19],
    speed: 40,
    gaitHz: 2.4,
    eats: true,
    // Weights for the choice (pets/pet.js), set so that with repeats held back she laps 25% of the time,
    // strolls 15%, naps 15% and rests the rest.
    actions: { lap: 0.349, stroll: 0.1, nap: 0.101, rest: 0.45 },
    feedGap: 66,
    liesWhenPetted: true,
    animate(dt, s) {
      const { happy, walking, lying, sleeping } = s;
      walkLegs(legs, s, lieDrop / 10.5); // the hips are 10.5 voxels above the ground
      sitUp(pose, head, legs, s.sit || 0, SIT);
      pose.rotation.z = s.state === "petted" ? 0.05 * Math.sin(wagPhase * 0.5) : 0; // wiggling with joy
      tongue.visible = happy && !sleeping; // panting
      serve(s);
      chow = chowPose(head, 6, chow, CHOW, dt, s);
      wagAmp += ((sleeping ? 0.04 : happy ? 0.55 : walking ? 0.4 : 0.25) - wagAmp) * (1 - Math.exp(-4 * dt));
      wagPhase += Math.PI * 2 * (sleeping ? 0.4 : happy ? 3 : walking ? 2 : 1.1) * dt;
      tailPivot.outer.rotation.y = wagAmp * Math.sin(wagPhase);
      tailPivot.outer.rotation.x = -0.7 * lying + 0.9 * (s.sit || 0); // sitting, it lies along the ground
    },
  };
}
