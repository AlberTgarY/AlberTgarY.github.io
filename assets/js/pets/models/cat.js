/*******************************************************************************
 * The tortoiseshell cat (assets/js/pets/models/voxels.js has the building blocks).
 * She stays at home when the girl goes out alone or with the dog, and makes
 * a mess: a toilet roll unrolled across the floor, or a ball of yarn in tangles.
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
  hash,
  foodBowl,
  chowPose,
  nightcap,
  CAP_COLORS,
  harness,
} from "./voxels.js";

export function buildCat() {
  const palette = {
    dark: "#2b2522",
    brown: "#4d372b",
    ginger: "#c7843f",
    gingerLight: "#e2a964",
    cream: "#eccfa1",
    iris: "#d6ad48",
    eye: "#050506",
    glint: "#ffffff",
    nose: "#e39a9c",
    mouth: "#3a2420",
    earPink: "#d6948f",
    whisker: "#f4f1ea",
    bowl: "#e27a9c",
    bowlRim: "#f2a6be",
    food: "#d98a42", // little fish-shaped biscuits
    foodDark: "#b0652c",
    paper: "#fbfbf6",
    paperShade: "#e4e1d8",
    core: "#c9b79a",
    yarn: "#f39ab9",
    yarnDark: "#d9739a",
    cap: "#2f4a8a",
    capRow: "#283f78",
    ...CAP_COLORS,
  };

  // Tortoiseshell: soft-edged ginger patches over dark fur, brindled with brown. A sum of slow
  // sines gives the patches; a hash adds the fine speckle.
  // Mostly dark, like the real cat: ginger only in the strongest patches, with mottled brown edges.
  const tortie = (x, y, z) => {
    const n = Math.sin(x * 0.55 + 1.3) * Math.sin(y * 0.47 + 0.4) + 0.8 * Math.sin(z * 0.6 + y * 0.3) + 0.6 * Math.sin((x + z) * 0.35 + 2);
    const h = hash(x, y, z);
    if (n > 1.2) return h < 0.25 ? "gingerLight" : "ginger";
    if (n > 0.8) return h < 0.4 ? "ginger" : "brown";
    return h < 0.2 ? "brown" : "dark";
  };

  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Body: slim, with a ginger patch on the chest.
  const bodyPart = part();
  const chestPatch = (x, y, z) => z >= 7 && y >= 12 && y <= 17 && Math.abs(x + 1) <= 3 - (17 - y) * 0.4;
  ellipsoid(bodyPart, [0, 13, 0], [7, 6.5, 11], (x, y, z) => (chestPatch(x, y, z) ? "ginger" : tortie(x, y, z)));
  pose.add(bodyPart.mesh(palette));

  // Slender legs from hips at y = 8.
  const legs = [
    [-3.5, 7],
    [3.5, 7],
    [-3.5, -7],
    [3.5, -7],
  ].map(([cx, cz]) => {
    const p = part();
    const x0 = Math.round(cx - 1);
    const z0 = Math.round(cz - 1);
    box(p, [x0, x0 + 2], [0, 7], [z0, z0 + 2], (x, y, z) => tortie(x, y, z));
    box(p, [x0, x0 + 2], [0, 0], [z0 + 3, z0 + 3], "dark"); // toes
    const g = pivotGroup(pose, [cx, 8, cz]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  // Tail: a chain of four segments, so it can sway in a wave and curl at the tip.
  const SEG = 4.5;
  const tailBase = [0, 15, -10];
  const tailSegs = [];
  let parent = pose;
  for (let i = 0; i < 4; i++) {
    const py = tailBase[1] + i * SEG;
    const g = pivotGroup(parent, [0, py, tailBase[2]]);
    const p = part();
    ellipsoid(p, [0, py + SEG / 2, tailBase[2]], [1.7 - i * 0.12, SEG / 2 + 0.9, 1.7 - i * 0.12], (x, y, z) => (i === 3 ? "dark" : tortie(x, y, z)));
    g.inner.add(p.mesh(palette));
    tailSegs.push(g);
    parent = g.inner;
  }
  tailSegs[0].outer.rotation.order = "YXZ"; // the base turns about the world's up after lowering the tail
  const TAIL_REST = [-1.1, 0.45, 0.45, 0.6]; // each relative to the last: back from the rump, rising, curling at the tip
  // Asleep, each segment turns further towards the near side: the base leaves the rump on a slant, and
  // the rest bends forward along her side.
  const TAIL_WRAP = [0.9, 1.2, 0.6, 0.2];

  // Head: mostly dark, with a thin ginger blaze just left of centre, ginger mottling round the left
  // eye and cheek, and the right side of the face dark.
  const headPart = part();
  const face = (x, y, z) => {
    if (z < 6) return tortie(x, y, z);
    if (y >= 27 && x >= -1 && x <= 0) return "ginger"; // the blaze
    if (x <= -2 && y >= 20 && y <= 26) return hash(x, y, z) < 0.3 ? "brown" : "ginger"; // left cheek
    if (x >= 2) return hash(x, y, z) < 0.15 ? "brown" : "dark"; // right side
    return tortie(x, y, z);
  };
  ellipsoid(headPart, [0, 25, 9], [9, 8, 7.5], face, [bodyPart]);
  // Muzzle: ginger on the left, dark on the right, with a little cream at the chin.
  ellipsoid(headPart, [0, 21.5, 14], [4, 3, 3], (x, y) => (y <= 19 && Math.abs(x) <= 2 ? "cream" : x <= 0 ? "gingerLight" : "dark"), [bodyPart]);
  const headPivotY = 17;
  const head = pivotGroup(pose, [0, headPivotY, 7]);
  const surface = surfaceOf(headPart);

  // Pink nose and an ω mouth on the muzzle.
  [
    [-1, 23],
    [0, 23],
    [1, 23],
    [0, 22],
  ].forEach(([x, y]) => (headPart.front(x, y)[3] = "nose"));
  head.inner.add(headPart.mesh(palette));
  const facePart = part();
  [
    [0, 21],
    [-1, 20],
    [1, 20],
    [-2, 21],
    [2, 21],
  ].forEach(([x, y]) => facePart.add(...surface(x, y, 0.4), "mouth"));

  // Whiskers: two fine white lines per side, sweeping out and back from the muzzle.
  for (const side of [-1, 1])
    for (const [dy, rise] of [
      [1, 0.25],
      [-1, -0.25],
    ])
      for (let k = 0; k <= 6; k++) facePart.add(side * (4 + k), Math.round(21.5 + dy + rise * k), Math.round(15 - k * 0.45), "whisker");
  head.inner.add(facePart.mesh(palette));

  // Eyes: big round amber eyes with wide black pupils and a sparkle at the upper left and lower right.
  const eyePart = part();
  const eyeCells = paintEyes(eyePart, surface, [-7, 3], 28, (i, j) => {
    if (i === 0 || i === 4 || j === 0 || j === 4) return "iris";
    return (i === 1 && j === 1) || (i === 3 && j === 3) ? "glint" : "eye";
  });
  head.inner.add(eyePart.mesh(palette));

  // Lids: full ones to blink or sleep, and upper ones for a contented half-closed look when petted.
  const lidPart = part();
  const halfLidPart = part();
  eyeCells.forEach(({ p: [x, y, z], row }) => {
    lidPart.add(x, y, z + 0.1, "dark");
    if (row <= 1) halfLidPart.add(x, y, z + 0.1, "dark");
  });
  const eyelids = lidPart.mesh(palette);
  const halfLids = halfLidPart.mesh(palette);
  eyelids.visible = false;
  halfLids.visible = false;
  head.inner.add(eyelids, halfLids);

  // Ears: tall, pointed and upright, pink inside.
  const ears = [-1, 1].map((side) => {
    const base = side * 5.5;
    const p = part();
    for (let k = 0; k <= 7; k++) {
      const half = 3.2 - k * 0.42;
      const cx = base + side * k * 0.3;
      const x0 = Math.round(cx - half);
      const x1 = Math.round(cx + half);
      for (let x = x0; x <= x1; x++)
        for (let z = 6; z <= 8; z++) {
          if (headPart.has(x, 30 + k, z)) continue;
          const inner = z === 8 && k <= 5 && x > x0 && x < x1;
          p.add(x, 30 + k, z, inner ? "earPink" : hash(x, k, z) < 0.2 ? "brown" : "dark");
        }
    }
    const g = pivotGroup(head.inner, [base, 30, 7]);
    g.inner.add(p.mesh(palette));
    return g;
  });

  const hat = nightcap(headPart, { y0: 32, z0: 8, radius: 5, height: 10 }).mesh(palette);
  head.inner.add(hat);

  // A pink harness just behind the head, clear of it.
  const { mesh: harnessMesh, clip } = harness(pose, bodyPart, { harness: "#ec6f9c" }, { cy: 13, z0: -1 });

  // A smaller bowl of cat biscuits at her front paws when she is fed.
  const serve = foodBowl(group, palette, 19, 4);
  const showMess = mess(group, palette);
  const CHOW = { drop: 8, reach: 4, nod: 0.8 };

  // Tail: a slow travelling sway; carried high with a curled tip when walking or happy; wrapped
  // round to the side and low when asleep.
  let swayPhase = 0;
  let knead = 0;
  let lift = 0;
  let chow = 0;
  const lieDrop = 6;
  return {
    label: "Voxel tortoiseshell cat, click to pet",
    hint: "pet me",
    group,
    pose,
    head,
    headPivotY,
    ears,
    eyelids,
    hat,
    harness: harnessMesh,
    clip,
    lieDrop,
    headDrop: 3,
    headAt: [25, 9],
    hit: [19, 16, 21],
    shadow: [9, 14],
    speed: 34,
    gaitHz: 2.1,
    eats: true,
    homebody: true, // never goes round the photo on her own, nor tags along after the girl
    // Weights for the choice (pets/pet.js), set so that with repeats held back she strolls about a quarter
    // of the time, naps about 30% and rests the rest.
    actions: { stroll: 0.13, nap: 0.42, rest: 0.45 },
    mischief: { paper: 5, yarn: 5 },
    feedGap: 58,
    purrs: true,
    animate(dt, s) {
      const { happy, walking, lying, sleeping } = s;
      walkLegs(legs, s, lieDrop / 8.5); // the hips are 8.5 voxels above the ground
      // Petted standing, she kneads with her front paws in turn and her raised tail quivers.
      const petted = s.state === "petted";
      knead += Math.PI * 2 * 1.6 * dt;
      if (petted && lying < 0.5) [0, 1].forEach((i) => (legs[i].outer.rotation.x = -0.35 * Math.max(0, Math.sin(knead + i * Math.PI))));
      // Making mischief, she bats at the roll or the yarn with each front paw in turn, watching it go.
      const toy = showMess(s);
      if (s.state === "mischief") {
        [0, 1].forEach((i) => (legs[i].outer.rotation.x = -0.9 * Math.max(0, Math.sin(s.elapsed * 6 + i * Math.PI))));
        head.outer.rotation.y += 0.8 * Math.max(-1, Math.min(1, toy / 20));
      }
      halfLids.visible = happy && !sleeping;
      serve(s);
      lift += ((happy || walking ? 1 : 0) - lift) * (1 - Math.exp(-3 * dt));
      swayPhase += Math.PI * 2 * (happy ? 1.2 : sleeping ? 0.15 : 0.45) * dt;
      tailSegs.forEach((seg, i) => {
        const sway = (sleeping ? 0.05 : 0.22) * Math.sin(swayPhase - i * 0.7);
        // Lying, the base lowers the tail to lie flat behind; once it does, each later segment's local z is
        // the world's up, so turning about z curls the tail round the body's near side.
        const up = TAIL_REST[i] + lift * (i === 0 ? 0.45 : i === 3 ? 0.3 : 0);
        const down = i === 0 ? -1.85 : 0; // just past flat, so the wrapped tail settles on the ground
        seg.outer.rotation.x = up + (down - up) * lying;
        if (i === 0) seg.outer.rotation.y = -lying * TAIL_WRAP[0];
        seg.outer.rotation.z = sway - (i === 0 ? 0 : lying * TAIL_WRAP[i]) + (petted && i === 3 ? 0.12 * Math.sin(knead * 9) : 0);
      });

      // Asleep she sits as a loaf rather than lying flat like the collie: legs tucked away, head held up
      // and only nodding a little, and the tail wrapped round her side.
      const r = head.outer.rotation;
      r.x = r.x * (1 - 0.8 * lying) + 0.05 * lying;
      chow = chowPose(head, 7, chow, CHOW, dt, s);
    },
  };
}

// The mess, beside the cat as she faces the viewer: a toilet roll that unrolls along the floor to her left,
// leaving a wavy trail of paper, or a ball of yarn batted about in front of her, leaving loops of yarn all
// over. It is made while she plays ("mischief") and stays while she waits to be found out ("messy").
// Returns the update, which gives back the x of the roll or ball, for her to watch.
function mess(group, palette) {
  const column = (cells) => {
    const p = part();
    cells.forEach(([x, y, z, color]) => p.add(x, y, z, color));
    const mesh = p.mesh(palette);
    group.add(mesh);
    return mesh;
  };
  // The paper: a strip three voxels wide, one column per x, so it can be shown as far as it has unrolled.
  const trailZ = (x) => 9 + Math.round(1.5 * Math.sin(x * 0.45));
  const paper = [];
  for (let x = 3; x <= 28; x++) paper.push(column([-1, 0, 1].map((dz) => [x, 0, trailZ(x) + dz, (x + dz) % 5 ? "paper" : "paperShade"])));
  const rollPart = part();
  for (let x = -2; x <= 2; x++)
    for (let y = -2; y <= 2; y++)
      for (let z = -2; z <= 2; z++) if (x * x + y * y <= 5) rollPart.add(x, y, z, x * x + y * y <= 1 && Math.abs(z) === 2 ? "core" : "paper");
  const roll = rollPart.mesh(palette);
  group.add(roll);
  // The yarn: a looping path in front of her, cut into pieces shown in order, and the ball at its end.
  const path = [];
  for (let k = 0; k <= 240; k++) {
    const u = k / 240;
    const loop = Math.max(0, Math.round(3 * Math.sin(Math.PI * 9 * u))); // arching up off the floor in loops
    const at = [Math.round(18 * Math.sin(Math.PI * 3 * u) * (0.4 + 0.6 * u)), loop, Math.round(8 + 4 * Math.sin(Math.PI * 4.4 * u + 1))];
    if (!path.length || path[path.length - 1].join() !== at.join()) path.push(at);
  }
  const PIECES = 30;
  const yarn = [...Array(PIECES)].map((_, i) =>
    column(path.slice(Math.floor((i * path.length) / PIECES), Math.ceil(((i + 1) * path.length) / PIECES)).map((c) => [...c, "yarn"]))
  );
  const ballPart = part();
  for (let x = -2; x <= 2; x++)
    for (let y = -2; y <= 2; y++)
      for (let z = -2; z <= 2; z++) if (x * x + y * y + z * z <= 5.5) ballPart.add(x, y, z, (x + y + z) % 3 ? "yarn" : "yarnDark");
  const ball = ballPart.mesh(palette);
  group.add(ball);
  const all = [...paper, roll, ...yarn, ball];
  all.forEach((m) => (m.visible = false));
  return ({ state, trick, progress }) => {
    const shown = state === "mischief" || state === "messy" ? trick : null;
    const done = state === "mischief" ? Math.min(1, progress / 0.9) : 1;
    all.forEach((m) => (m.visible = false));
    if (shown === "paper") {
      const end = 3 + done * 25;
      paper.forEach((m, i) => (m.visible = 3 + i <= end));
      roll.visible = true;
      roll.position.set(end, 2, trailZ(Math.round(end)));
      roll.rotation.z = -end / 2.2; // rolling along
      return end;
    }
    if (shown === "yarn") {
      const n = Math.max(1, Math.round(done * PIECES));
      yarn.forEach((m, i) => (m.visible = i < n));
      const [x, , z] = path[Math.min(path.length - 1, Math.floor((n * path.length) / PIECES) - 1)];
      ball.visible = true;
      ball.position.set(x, 2, z);
      ball.rotation.set(x * 0.5, 0, z * 0.5); // tumbling
      return x;
    }
    return 0;
  };
}
