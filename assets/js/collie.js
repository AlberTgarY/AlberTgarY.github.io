/*******************************************************************************
 * A voxel border collie that wanders along the bottom of the profile photo.
 *
 * Built from instanced cubes in three.js and rendered with no anti-aliasing at
 * 1 CSS px per device pixel, so it reads as crisp, lit pixel art with real depth.
 * It turns its head towards the pointer, blinks, wags, pants when hovered, hops
 * with a heart when petted, strolls left and right (turning in 3D), lies down
 * for a nap, and wears a knitted nightcap in dark mode (see _sass/_collie.scss).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const root = document.querySelector(".collie");
const profile = root && root.closest(".profile");
const photo = profile && profile.querySelector("#profile-photo");

if (root && photo) start();

function start() {
  const W = 164; // canvas width in CSS px (the full view is W x W, cropped below the paws)
  const GROUND_INSET = 48; // px between the photo's bottom edge and the paws (clears the caption bar)
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  const COLORS = {
    black: "#32323a", // charcoal rather than pure black, so the glossy eyes stand out
    fold: "#4b4b56",
    white: "#f3efe6",
    eye: "#050506",
    glint: "#ffffff",
    star: "#fbf8f1",
    nose: "#15151a",
    mouth: "#4a1f26",
    tongue: "#f08a9c",
    red: "#cc3a41",
    redRow: "#b4323a",
    cream: "#f2eadb",
    creamRib: "#e0d6c3",
  };

  /* ---------- voxel helpers ---------- */

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial();

  // A rigid part: a set of voxels keyed by position, so overlapping shapes merge (later wins).
  function part() {
    const voxels = new Map();
    const key = (x, y, z) => `${x},${y},${z}`;
    const self = {
      add(x, y, z, color) {
        voxels.set(key(x, y, z), [x, y, z, color]);
      },
      has: (x, y, z) => voxels.has(key(x, y, z)),
      // Frontmost voxel (largest z) in the column (x, y); used to paint the face onto the head.
      front(x, y) {
        let best = null;
        for (const v of voxels.values()) if (v[0] === x && v[1] === y && (!best || v[2] > best[2])) best = v;
        return best;
      },
      mesh() {
        // Skip voxels buried inside the part: a rigid part never exposes them, and they are most of the volume.
        const exposed = ([x, y, z]) =>
          !voxels.has(key(x + 1, y, z)) ||
          !voxels.has(key(x - 1, y, z)) ||
          !voxels.has(key(x, y + 1, z)) ||
          !voxels.has(key(x, y - 1, z)) ||
          !voxels.has(key(x, y, z + 1)) ||
          !voxels.has(key(x, y, z - 1));
        const list = [...voxels.values()].filter(exposed);
        const mesh = new THREE.InstancedMesh(cube, material, list.length);
        const m = new THREE.Matrix4();
        const c = new THREE.Color();
        list.forEach(([x, y, z, color], i) => {
          mesh.setMatrixAt(i, m.makeTranslation(x, y, z));
          mesh.setColorAt(i, c.set(COLORS[color]));
        });
        return mesh;
      },
    };
    return self;
  }

  // Fill an ellipsoid; `color` may be a function of (x, y, z); `skip` parts are left untouched.
  function ellipsoid(p, [cx, cy, cz], [rx, ry, rz], color, skip = []) {
    for (let x = Math.ceil(cx - rx); x <= cx + rx; x++)
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++)
        for (let z = Math.ceil(cz - rz); z <= cz + rz; z++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 > 1) continue;
          if (skip.some((s) => s.has(x, y, z))) continue;
          p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
        }
  }

  function box(p, [x0, x1], [y0, y1], [z0, z1], color, skip = []) {
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++)
        for (let z = z0; z <= z1; z++) {
          if (skip.some((s) => s.has(x, y, z))) continue;
          p.add(x, y, z, typeof color === "function" ? color(x, y, z) : color);
        }
  }

  // A group whose children rotate about `pivot` in the parent's space.
  function pivotGroup(parent, pivot) {
    const outer = new THREE.Group();
    outer.position.set(...pivot);
    const inner = new THREE.Group();
    inner.position.set(-pivot[0], -pivot[1], -pivot[2]);
    outer.add(inner);
    parent.add(outer);
    return { outer, inner };
  }

  /* ---------- the dog (units: voxels; y up; faces +z, towards the viewer) ---------- */

  const dog = new THREE.Group(); // turns to face the walking direction
  const pose = new THREE.Group(); // bobs, hops and lies down
  dog.add(pose);

  // Body: black back and sides, white chest and belly.
  const bodyPart = part();
  ellipsoid(bodyPart, [0, 17, 0], [10, 9, 15], (x, y, z) => (y <= 10 || (z >= 9 && y <= 23) ? "white" : "black"));
  pose.add(bodyPart.mesh());

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
    g.inner.add(p.mesh());
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
  const tail = pivotGroup(pose, [0, 21, -14]);
  tail.inner.add(tailPart.mesh());

  // Head: black with a narrow blaze that widens into the white muzzle and chin.
  const headPart = part();
  const blazeHalf = (y) => (y >= 40 ? 1 : y >= 35 ? 1.5 : 1.5 + (35 - y) * 0.45);
  ellipsoid(headPart, [0, 32, 8], [12, 11, 10], (x, y, z) => (z >= 0 && Math.abs(x) <= blazeHalf(y) ? "white" : "black"), [bodyPart]);
  ellipsoid(headPart, [0, 28, 16], [6.5, 5, 6], "white", [bodyPart]);
  ellipsoid(headPart, [0, 24, 11], [5, 4, 6], "white", [bodyPart]);
  // Paint the nose onto the frontmost voxels so it follows the head's curve.
  for (let x = -2; x <= 2; x++) for (let y = 29; y <= 31; y++) headPart.front(x, y)[3] = "nose";
  const HEAD_PIVOT = [0, 26, 6]; // the neck
  const head = pivotGroup(pose, HEAD_PIVOT);
  head.inner.add(headPart.mesh());

  // Painted details sit a little proud of the frontmost fur voxel, so they follow the head's curve.
  const surface = (x, y, lift) => {
    const v = headPart.front(x, y);
    return [v[0], v[1], v[2] + lift];
  };

  // Eyes: big, round, glossy black, each with a large sparkle at the upper left and a small one at
  // the lower right, on the same side for both eyes as if lit by one light.
  const EYE_ROWS = [".XXX.", "XXXXX", "XXXXX", "XXXXX", ".XXX."];
  const EYE_LIGHT = { "1,1": "glint", "2,1": "glint", "1,2": "glint", "3,3": "glint" }; // "col,row" from the top left
  const eyePart = part();
  const eyeCells = [];
  for (const x0 of [-9, 5])
    EYE_ROWS.forEach((row, j) =>
      [...row].forEach((cell, i) => {
        if (cell !== "X") return;
        const p = surface(x0 + i, 36 - j, 0.4);
        eyePart.add(...p, EYE_LIGHT[`${i},${j}`] || "eye");
        eyeCells.push(p);
      })
    );
  head.inner.add(eyePart.mesh());

  // A small ω mouth under the nose.
  const mouthPart = part();
  [
    [-2, 28],
    [-1, 27],
    [0, 28],
    [1, 27],
    [2, 28],
  ].forEach(([x, y]) => mouthPart.add(...surface(x, y, 0.4), "mouth"));
  head.inner.add(mouthPart.mesh());

  // Eyelids sit a hair in front of the eyes and are shown to blink or sleep.
  const lidPart = part();
  eyeCells.forEach(([x, y, z]) => lidPart.add(x, y, z + 0.1, "black"));
  const eyelids = lidPart.mesh();
  eyelids.visible = false;
  head.inner.add(eyelids);

  // Open mouth with the tongue out, shown while panting.
  const tonguePart = part();
  for (let x = -1; x <= 1; x++) {
    const front = headPart.front(x, 27);
    const z = front ? front[2] + 0.45 : 21;
    tonguePart.add(x, 27, z, "mouth");
    tonguePart.add(x, 26, z, "tongue");
    tonguePart.add(x, 25, z - 0.5, "tongue");
    if (x === 0) tonguePart.add(x, 24, z - 1, "tongue");
  }
  const tongue = tonguePart.mesh();
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
    g.inner.add(p.mesh());
    return g;
  });

  // Knitted nightcap: ribbed cuff, alternating knit rows, gold twinkle stars and a pompom.
  // Stars are pixel bitmaps wrapped onto the cone: rows by height, columns by arc length around its axis.
  const BIG_STAR = ["..X..", "..X..", "XXXXX", ".XXX.", ".X.X."];
  const SMALL_STAR = [".X.", "XXX", "X.X"];
  const STARS = [
    ...[0, 1, 2, 3, 4].map((i) => [49, (i / 5) * Math.PI * 2, BIG_STAR]),
    ...[0, 1, 2, 3].map((i) => [53, ((i + 0.5) / 4) * Math.PI * 2, SMALL_STAR]),
  ]; // [top row height, angle, bitmap]
  const knit = (x, y, z, cx, cz, r) => {
    const a = Math.atan2(z - cz, x - cx);
    const onStar = STARS.some(([top, sa, rows]) => {
      const row = rows[top - y];
      if (!row) return false;
      const col = Math.round(Math.atan2(Math.sin(a - sa), Math.cos(a - sa)) * r) + (row.length >> 1);
      return row[col] === "X";
    });
    return onStar ? "star" : y % 2 ? "red" : "redRow";
  };
  const hatPart = part();
  for (let y = 42; y <= 43; y++) ellipsoid(hatPart, [0, y, 7], [9.5, 0.5, 9.5], (x) => (((x % 2) + 2) % 2 ? "creamRib" : "cream"), [headPart]);
  let tip = [0, 44, 7];
  for (let y = 44; y <= 57; y++) {
    const k = (y - 44) / 13;
    const r = 8.5 * (1 - k) ** 0.9 + 0.6;
    const cx = (y - 44) * 0.45;
    const cz = 7 - (y - 44) * 0.25;
    ellipsoid(hatPart, [cx, y, cz], [r, 0.5, r], (x, _, z) => knit(x, y, z, cx, cz, r), [headPart]);
    tip = [cx, y, cz];
  }
  ellipsoid(hatPart, [tip[0] + 1.5, tip[1] + 1.5, tip[2]], [2.6, 2.6, 2.6], "cream");
  const hat = hatPart.mesh();
  hat.visible = isDark();
  head.inner.add(hat);

  // Contact shadow on the ground.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.45;
  shadow.scale.set(13, 19, 1);
  dog.add(shadow);

  /* ---------- scene and renderer ---------- */

  const scene = new THREE.Scene();
  scene.add(dog);
  // Soft key light from the front left: faces read as distinct planes without banding on the curves.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-6, 5, 10);
  scene.add(key);

  // A three-quarter view from the front right, slightly above.
  const HALF = 45; // half the view height in voxels (room for the nightcap's pompom and the hop)
  const CAM_YAW = Math.atan2(60, 100); // the camera's azimuth; facing it means dog.rotation.y = CAM_YAW
  const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 400);
  camera.position.set(60, 57, 100);
  camera.lookAt(0, 31, 0);
  camera.updateMatrixWorld();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  } catch {
    return; // no WebGL: leave the (hidden) placeholder alone
  }
  renderer.setPixelRatio(1);

  // Canvas px of a world point in the full W x W view.
  const toPx = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).project(camera);
    return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * W];
  };
  const FOOT_PX = toPx(0, -0.5, 0)[1];
  // Crop the empty space below the paws, keeping the whole footprint in any facing.
  let lowest = 0;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) lowest = Math.max(lowest, toPx(Math.cos(a) * 21, -0.5, Math.sin(a) * 21)[1]);
  const H = Math.min(W, Math.ceil(lowest + 2));
  renderer.setSize(W, H, false);
  camera.setViewOffset(W, W, 0, 0, W, H);
  const canvas = renderer.domElement;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  root.style.height = `${H}px`;
  root.replaceChildren(canvas);
  const render = () => renderer.render(scene, camera);

  /* ---------- placement: along the photo's bottom edge, or on a lap around it ---------- */

  // The lap is an ellipse on the ground seen from slightly above: its near side runs along the
  // bottom of the photo and its far side behind the photo's top edge, where only the head shows.
  const LAP_MARGIN = 24; // px the lap swings out past the photo's sides, so the dog is clear of it when it passes behind
  const FAR_INSET = 16; // px below the photo's top edge for the paws on the far side, so the head and shoulders show above it
  const VOX = W / (2 * HALF); // px per voxel
  let x = Infinity; // the dog's centre within .profile, in px
  let y = 0; // px the paws are raised above the front path (further back is higher)
  let depthScale = 1; // smaller further back
  let behind = false; // drawn behind the photo
  let minX = 0;
  let maxX = 0;
  const lap = { cx: 0, rx: 0, ry: 0, ok: false };

  function layout() {
    const p = profile.getBoundingClientRect();
    const r = photo.getBoundingClientRect();
    const nearY = r.bottom - p.top - GROUND_INSET;
    minX = r.left - p.left + W / 2 - 14;
    maxX = r.right - p.left - W / 2 + 14;
    lap.cx = (r.left + r.right) / 2 - p.left;
    lap.rx = r.width / 2 + LAP_MARGIN;
    lap.ry = (nearY - (r.top - p.top + FAR_INSET)) / 2;
    // Laps need room beside the photo, which phones do not have.
    const room = LAP_MARGIN + 30;
    lap.ok = window.innerWidth >= 576 && r.left - room > 0 && r.right + room < document.documentElement.clientWidth && lap.ry > 40;
    if (state === "lap" && !lap.ok) endLap();
    if (state !== "lap") x = clamp(x, minX, maxX);
    root.style.top = `${nearY - FOOT_PX}px`;
    place();
  }

  function place() {
    root.style.transform = `translate(${(x - W / 2).toFixed(2)}px, ${y.toFixed(2)}px) scale(${depthScale.toFixed(4)})`;
    root.classList.toggle("behind", behind);
  }
  root.style.transformOrigin = `${W / 2}px ${FOOT_PX}px`; // scale about the paws

  // The canvas is click-through (on a lap it passes over text), so hits are tested against the dog's outline.
  function overDog(px, py) {
    if (behind) return false;
    const r = canvas.getBoundingClientRect();
    const k = (r.width / W) * VOX;
    const dx = (px - (r.left + r.width / 2)) / (22 * k);
    const dy = (py - (r.top + (r.height / H) * FOOT_PX - 24 * k)) / (27 * k);
    return dx * dx + dy * dy < 1;
  }

  /* ---------- behaviour ---------- */

  const now = () => performance.now() / 1000;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

  // Critically damped spring (implicit Euler, stable for any dt): eases in and out with no overshoot,
  // for the big whole-body moves where a sudden start would look like a jolt.
  const spring = (value, omega) => ({ x: value, v: 0, omega });
  function stepSpring(s, target, dt) {
    const k = s.omega * s.omega;
    const det = 1 + 2 * s.omega * dt + k * dt * dt;
    const x = ((1 + 2 * s.omega * dt) * s.x + dt * s.v + k * dt * dt * target) / det;
    s.v = (s.v + k * dt * (target - s.x)) / det;
    s.x = x;
    return x;
  }

  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };
  let hovering = false;

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
    pointer.mouse = e.pointerType === "mouse";
    pointer.movedAt = now();
    if (state === "sleep") {
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + W / 2);
      const dy = e.clientY - (r.top + H / 2);
      if (dx * dx + dy * dy < 150 * 150) wake();
    }
  });
  window.addEventListener("click", (e) => {
    if (overDog(e.clientX, e.clientY)) pet();
  });

  let state = "idle"; // idle | walk | lap | sleep
  let stateUntil = 0;
  let walkTo = 0;
  let lapAfterWalk = false;
  let lapAngle = 0; // position on the lap: π/2 is the middle of the front path
  let lapEnd = 0;
  let lapDir = 1;
  let nextActionAt = now() + rnd(6, 12);
  let happyUntil = -1;
  let hopStart = -1;
  let yaw = 0; // the body's facing; CAM_YAW faces the viewer, CAM_YAW ± π/2 walks along the screen
  let yawTarget = 0;

  // Angles are kept continuous so a turn always takes the short way, even after full laps.
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const nearestTurn = (target) => yaw + wrap(target - yaw);

  function setState(next, duration = 0) {
    state = next;
    stateUntil = now() + duration;
    root.classList.toggle("sleeping", next === "sleep");
  }

  function wake() {
    setState("idle");
    yawTarget = nearestTurn(0);
    nextActionAt = now() + rnd(8, 16);
  }

  function walk(to, thenLap = false) {
    walkTo = to;
    lapAfterWalk = thenLap;
    yawTarget = nearestTurn(CAM_YAW + (to > x ? Math.PI / 2 : -Math.PI / 2)); // along the screen's x axis
    setState("walk");
  }

  // A full lap starting and ending in the middle of the front path, in a random direction.
  function startLap() {
    lapDir = Math.random() < 0.5 ? 1 : -1;
    lapAngle = Math.PI / 2;
    lapEnd = lapAngle + lapDir * Math.PI * 2;
    setState("lap");
  }

  function endLap() {
    x = lap.cx;
    y = 0;
    depthScale = 1;
    behind = false;
    place();
    wake();
  }

  function chooseAction(t) {
    const roll = Math.random();
    if (roll < 0.4 && lap.ok) {
      if (Math.abs(x - lap.cx) < 2) startLap();
      else walk(lap.cx, true);
    } else if (roll < 0.65) {
      let to = rnd(minX, maxX);
      if (Math.abs(to - x) < 40) to = x > (minX + maxX) / 2 ? minX : maxX;
      walk(to);
    } else if (roll < 0.85 && t - pointer.movedAt > 6) {
      setState("sleep", rnd(10, 20));
    } else {
      nextActionAt = t + rnd(6, 12);
    }
  }

  function pet() {
    const t = now();
    if (state === "sleep") wake(); // a stroll or lap carries on, with a hop
    hopStart = t;
    happyUntil = t + 1.8;
    happyTilt = rnd(0, 1) < 0.5 ? -0.16 : 0.16;
    const heart = document.createElement("span");
    heart.className = "collie-heart";
    heart.style.left = `${toPx(Math.sin(yaw) * 10, 32, Math.cos(yaw) * 10)[0] - 10}px`;
    root.appendChild(heart);
    setTimeout(() => heart.remove(), 1200);
    nextActionAt = Math.max(nextActionAt, t + 10);
  }

  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pet();
    }
  });

  // Where the dog looks, in [-1, 1] on each axis (screen space), and the glances it takes on its own.
  const look = { x: 0, y: 0 };
  const glance = { x: 0, y: 0, at: 0 };
  let headYaw = 0;
  let headPitch = 0;
  let tilt = 0;
  let glanceTilt = 0; // the occasional curious head tilt
  let happyTilt = 0; // the tilt while hovered or just petted
  const droop = spring(0, 3.5); // 0 standing, 1 lying asleep
  const turn = spring(0, 6); // the body's facing
  let stride = 0; // 0 standing still, 1 walking
  let gait = 0; // walk-cycle phase
  let breathPhase = 0; // integrated, so changing the breathing rate never jumps the phase
  let lid = 1; // 1 open, 0 shut
  let blinkAt = now() + 2;
  let blinkStart = -1;
  const earTwitch = [0, 0];
  let twitchAt = now() + rnd(3, 6);
  let wagPhase = 0;
  let wagAmp = 0.25;

  function update(dt) {
    const t = now();
    const sleeping = state === "sleep";
    const r = root.getBoundingClientRect();
    // Re-test every frame: the dog moves under a resting pointer too.
    hovering = pointer.mouse && overDog(pointer.x, pointer.y);
    document.documentElement.classList.toggle("collie-hover", hovering);
    const happy = hovering || t < happyUntil;
    if (!happy) happyTilt = 0;
    else if (happyTilt === 0) happyTilt = look.x >= 0 ? 0.14 : -0.14;

    if (state === "idle" && t > nextActionAt && !document.hidden) chooseAction(t);
    if (sleeping && t > stateUntil) wake();

    if (state === "walk") {
      const step = Math.sign(walkTo - x);
      x += step * 40 * dt;
      if ((step > 0 && x >= walkTo) || (step <= 0 && x <= walkTo)) {
        x = walkTo;
        if (lapAfterWalk) startLap();
        else wake();
      }
      place();
    } else if (state === "lap") {
      // Constant speed along the ellipse: advance the angle by distance over the local radius.
      const ds = Math.hypot(lap.rx * Math.sin(lapAngle), lap.ry * Math.cos(lapAngle));
      lapAngle += (lapDir * 46 * dt) / Math.max(ds, 1);
      if (lapDir * (lapAngle - lapEnd) >= 0) endLap();
      else {
        const s = Math.sin(lapAngle);
        const c = Math.cos(lapAngle);
        x = lap.cx + lap.rx * c;
        y = lap.ry * (s - 1);
        depthScale = 1 - 0.09 * (1 - s);
        behind = s < 0;
        // Face along the path: screen x, and depth towards the viewer (lower on screen is nearer).
        yawTarget = nearestTurn(CAM_YAW + Math.atan2(-lap.rx * s * lapDir, lap.ry * c * lapDir));
        place();
      }
    }
    const walking = state === "walk" || state === "lap";
    yaw = stepSpring(turn, yawTarget, dt);
    dog.rotation.y = yaw;
    const facingLeft = Math.sin(yaw - CAM_YAW) < -0.72; // its nose points to the screen's left
    root.classList.toggle("facing-left", facingLeft);

    // Look target: the pointer when it is active, otherwise occasional glances (or ahead while walking).
    let tx;
    let ty;
    const pointerActive = pointer.seen && t - pointer.movedAt < 3;
    if (pointerActive) {
      const [hx, hy] = toPx(Math.sin(yaw) * 10, 32, Math.cos(yaw) * 10);
      tx = clamp((pointer.x - (r.left + hx)) / (window.innerWidth * 0.4), -1, 1);
      ty = clamp((pointer.y - (r.top + hy)) / (window.innerHeight * 0.4), -1, 1);
      glance.at = t + 2;
    } else if (walking) {
      tx = 0;
      ty = 0.1;
    } else {
      if (t > glance.at) {
        glance.x = rnd(-0.8, 0.8);
        glance.y = rnd(-0.4, 0.5);
        glance.at = t + rnd(1.5, 4);
        glanceTilt = rnd(0, 1) < 0.25 ? rnd(-0.2, 0.2) : 0;
      }
      tx = glance.x;
      ty = glance.y;
    }
    if (sleeping) {
      tx = 0;
      ty = 1;
    }
    look.x = approach(look.x, tx, 7, dt);
    look.y = approach(look.y, ty, 7, dt);

    tilt = approach(tilt, sleeping ? 0.18 : happy ? happyTilt : glanceTilt, 5, dt);
    const lying = clamp(stepSpring(droop, sleeping ? 1 : 0, dt), 0, 1);
    stride = approach(stride, walking ? 1 : 0, 6, dt);
    if (stride > 0.01) gait += Math.PI * 2 * 2.4 * stride * dt;

    // Breathing (slower when asleep), the walk bounce, the hop, and sinking down to lie.
    breathPhase += ((Math.PI * 2) / (3 + lying)) * dt;
    const breath = Math.sin(breathPhase);
    let hop = 0;
    if (hopStart >= 0) {
      const p = (t - hopStart) / 0.5;
      if (p < 1) hop = 7 * Math.sin(p * Math.PI);
      else hopStart = -1;
    }
    const bounce = 0.7 * stride * Math.abs(Math.sin(gait));
    pose.position.y = hop + bounce + 0.25 * breath - 8 * lying; // belly rests on the ground
    pose.scale.y = 1 + 0.012 * breath;
    shadow.scale.set(13 * (1 - hop / 24), 19 * (1 - hop / 24), 1);
    shadow.material.opacity = 0.28 * (1 - hop / 16);

    // Legs: diagonal pairs swing in opposite phase; they fold away when lying down.
    legs.forEach((leg, i) => {
      leg.outer.rotation.x = 0.42 * stride * Math.sin(gait + (i % 3 === 0 ? 0 : Math.PI));
      leg.outer.scale.y = 1 - 0.75 * lying; // paws stay on the ground as the body sinks
    });

    // Head: looking straight out of the screen means facing the camera; take the body's own turn off it.
    // While walking it looks where it is going, glancing at the pointer only a little.
    const wantYaw = walking && !pointerActive ? 0 : clamp(wrap(CAM_YAW + look.x * 0.9 - yaw), -1.2, 1.2) * (walking ? 0.6 : 1);
    headYaw = approach(headYaw, wantYaw, 8, dt);
    headPitch = approach(headPitch, look.y * 0.4 + 0.45 * lying, 8, dt);
    head.outer.rotation.set(headPitch, headYaw, tilt, "YXZ");
    head.outer.position.y = HEAD_PIVOT[1] - 3 * lying;

    // Blinking: a quick shut while awake, eyes held shut while asleep.
    if (t > blinkAt) {
      blinkStart = t;
      blinkAt = t + rnd(2, 5);
    }
    let shut = 0;
    if (blinkStart >= 0) {
      const p = (t - blinkStart) / 0.16;
      if (p < 1) shut = Math.sin(p * Math.PI);
      else blinkStart = -1;
    }
    lid = approach(lid, sleeping ? 0 : 1, 6, dt);
    eyelids.visible = lid * (1 - shut) < 0.5;

    // Ears: perk when happy, droop when asleep, bounce a little while walking, and the odd twitch.
    if (t > twitchAt) {
      earTwitch[Math.random() < 0.5 ? 0 : 1] = 0.25;
      twitchAt = t + rnd(3, 7);
    }
    ears.forEach((ear, i) => {
      earTwitch[i] *= Math.exp(-10 * dt);
      const outward = 0.45 * lying - (happy ? 0.1 : 0) + earTwitch[i] + 0.05 * stride * Math.sin(2 * gait);
      ear.outer.rotation.z = (i === 0 ? 1 : -1) * outward;
    });

    // Tail: slow idle wag, brisk when walking or happy, resting low when asleep.
    wagAmp = approach(wagAmp, sleeping ? 0.04 : happy ? 0.55 : walking ? 0.4 : 0.25, 4, dt);
    wagPhase += Math.PI * 2 * (sleeping ? 0.4 : happy ? 3 : walking ? 2 : 1.1) * dt;
    tail.outer.rotation.y = wagAmp * Math.sin(wagPhase);
    tail.outer.rotation.x = -0.7 * lying;

    tongue.visible = happy && !sleeping;
    render();
  }

  /* ---------- loop ---------- */

  let onScreen = true;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting)).observe(root);

  let last = now();
  function frame() {
    requestAnimationFrame(frame);
    const t = now();
    const dt = Math.min(0.1, t - last);
    last = t;
    if (!onScreen || document.hidden) return;
    update(dt);
  }

  new MutationObserver(() => {
    hat.visible = isDark();
    render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  new ResizeObserver(layout).observe(profile);
  photo.addEventListener("load", layout); // the photo switcher swaps images of different heights

  function begin() {
    layout();
    root.classList.add("ready");
    update(0);
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  if (photo.complete) begin();
  else photo.addEventListener("load", begin, { once: true });
}
