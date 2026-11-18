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
  approach,
  smoothstep,
} from "./voxels.js";
import { parachute } from "./airborne.js";

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

  // Picked up (pets/pet.js has how), she paddles the air with her front paws, her hind legs hanging and her
  // tail wagging, legs, ears and tail flopping behind each swing. Let go, she drops for a moment with her legs
  // splayed, until a parachute bursts out of a pack on her harness and blooms open over her; she drifts down
  // under it, paddling slowly, her ears lifted by the air, swinging from it. Down, her legs give, the canopy
  // flops over to one side and is gone, and she shakes herself off.
  let chute = null; // built the first time she comes down under it
  let chuteOut = 0; // how far it is out, 0 to 1
  let aired = false; // her legs and tail have been turned to the side, to set straight once she is down
  let paddle = 0;
  let breath = 0;
  const lean = [0, 0];
  function flyPose(a, dt) {
    const kind = a ? a.phase : "";
    chuteOut = approach(chuteOut, kind === "fall" ? a.open : kind === "land" ? 1 : 0, kind === "fall" ? 30 : 12, dt);
    if (chuteOut > 0.001 && !chute) chute = parachute(pose, [clip.position.x, clip.position.y - 1, clip.position.z]);
    breath += Math.PI * 2 * 1.1 * dt;
    lean[0] = a ? -0.6 * a.swing * a.across[0] : 0; // the canopy stays more upright than she does
    lean[1] = a ? -0.6 * a.swing * a.across[1] : 0;
    chute?.update(chuteOut, kind === "land" ? smoothstep(0.15, 1, a.t) : a ? 0 : 1, breath, lean);
    if (chuteOut > 0.01) harnessMesh.visible = true;
    if (!a) {
      if (aired) {
        legs.forEach((leg) => (leg.outer.rotation.z = 0));
        tailPivot.outer.rotation.z = 0;
      }
      aired = false;
      return;
    }
    aired = true;
    const { t, w, swing, lag, flop, crouch, across } = a;
    const float = kind === "fall" ? a.open : kind === "land" ? 1 - smoothstep(0, 0.3, t) : 0;
    const startled = kind === "fall" && a.height > 16 ? 1 - a.open : 0; // in free fall, before it opens
    const lively = (1 - float) * (1 - startled) * (kind === "land" ? 1 - smoothstep(0, 0.2, t) : 1);
    paddle += Math.PI * 2 * (1.2 + 1.4 * lively) * dt;
    const loose = -0.5 * swing + 1.1 * lag; // a leg's turn as it trails behind the body
    legs.forEach((leg, i) => {
      const front = i < 2;
      const step = paddle + i * Math.PI;
      const r = leg.outer.rotation;
      const target =
        lively * (front ? -0.35 + 0.55 * Math.sin(step) : 0.2 + 0.12 * Math.sin(step + 1)) +
        float * (front ? -0.25 + 0.2 * Math.sin(step * 0.5) : 0.3 + 0.1 * Math.sin(step * 0.5 + 1)) +
        startled * (front ? -0.9 : 0.9);
      r.x += (target - r.x) * w + across[0] * loose * w;
      r.z = w * (startled * (i % 2 ? 0.35 : -0.35) + across[1] * loose);
      leg.outer.scale.y *= 1 - 0.3 * crouch;
    });
    pose.position.y -= 3 * crouch;
    // Ears flared in the fall and fluttering in the air under the canopy, trailing behind each swing.
    ears.forEach((ear, i) => {
      const out = 0.55 * startled + float * (0.25 + 0.12 * Math.sin(t * 17 + i * 2));
      ear.outer.rotation.z += w * ((i ? -1 : 1) * out - 0.9 * (flop - lag) * across[1]);
    });
    tailPivot.outer.rotation.x += w * (-0.5 * lively + 0.6 * startled + 0.3 * float - 0.8 * (flop - lag) * across[0]);
    tailPivot.outer.rotation.y += w * -1.2 * (flop - lag) * across[1];
    head.outer.rotation.z += w * -0.3 * swing;
    // Down, a good shake from nose to tail.
    if (kind === "land") {
      const k = smoothstep(0.7, 0.85, t) * (1 - smoothstep(1.3, 1.55, t));
      pose.rotation.z += 0.3 * k * Math.sin(t * 44);
      head.outer.rotation.z += 0.25 * k * Math.sin(t * 44 - 0.8);
      ears.forEach((ear, i) => (ear.outer.rotation.z += (i ? -1 : 1) * 0.5 * k * Math.sin(t * 44 - 1.6)));
    }
  }
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
    // Picked up and let go (pets/pet.js): she drifts down under a parachute, swinging from it.
    heft: [17, 9],
    drop: { open: 0.3, terminal: 58, sway: [0.13, 0.4], hangFrom: 64, settle: 1.7, give: 9 },
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
      if (s.aloft || aired || chute) flyPose(s.aloft, dt);
    },
  };
}
