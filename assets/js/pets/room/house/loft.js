/*******************************************************************************
 * The loft: his computer desk, the bed, the nightstand, the bookshelf and the
 * dressing corner.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash } from "../../models/voxels.js";
import { LOOKS } from "../../models/girl-outfits.js";
import { GAMES, drawPcGame, drawPcDrama, drawSideShow } from "../screens.js";
import { BACK, LOFT } from "./layout.js";
import { COLORS, pixelTexture, solid, glowing, place } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildLoft(shared) {
  const { house, mesh, updates, footprint, turnedFootprint } = shared;

  const Y = LOFT.y;
  // The boy's desk: a white top on a drawer unit and legs; his monitor on its stand with a second one on
  // its left stood on end, a keyboard with a glow under its keys, a mouse on its pad and a mug; in front of
  // the screen on end, his white headphones on their stand while he is not wearing them, and at the right
  // end a little Kirby on a Warp Star. His computer stands on the floor beside the desk (the cat lies on top
  // to watch him play), its fans glowing in colours that slowly change, and the white power light on its top
  // lit only while it is on.
  const DESK = [54, -100]; // clear of the top of the stairs, to walk past
  const desk = part();
  box(desk, [-27, 26], [14, 15], [-9, 9], (x, y, z) => (y === 14 || z === 9 ? "deskShade" : "desk"));
  box(desk, [-26, -15], [0, 13], [-8, 8], (x, y, z) => (z === 8 && (y === 4 || y === 9) ? "deskShade" : "desk"));
  for (const z of [-8, 7]) box(desk, [24, 25], [0, 13], [z, z + 1], "deskShade");
  for (const y of [6, 11]) box(desk, [-22, -19], [y, y], [9, 9], "steelDark");
  box(desk, [-25, -17], [16, 16], [-7, -3], "tvEdge"); // the monitor on end, on its stand
  box(desk, [-21, -21], [17, 19], [-6, -6], "tvEdge");
  box(desk, [-26, -16], [20, 46], [-5, -5], "tvBody");
  box(desk, [-2, 5], [16, 16], [-7, -3], "tvEdge"); // the main monitor's stand, and the monitor
  box(desk, [1, 2], [17, 21], [-6, -6], "tvEdge");
  box(desk, [-12, 15], [22, 38], [-5, -5], "tvBody");
  box(desk, [-5, 8], [16, 16], [5, 8], (x, y, z) => (z === 8 || (x + z) % 3 ? "keyboard" : "keyLight"));
  box(desk, [9, 14], [16, 16], [5, 9], "keyboard"); // the mouse pad
  box(desk, [11, 12], [17, 17], [7, 8], "chairWhite"); // the mouse
  for (let y = 16; y <= 19; y++) ellipsoid(desk, [-11, y, 5], [1.7, 0.5, 1.7], y === 19 ? "coffee" : "mugBlue");
  box(desk, [-23, -19], [16, 16], [2, 6], "pcCase"); // the headphone stand: a foot, a post and a hook
  box(desk, [-21, -21], [17, 30], [4, 4], "pcCase");
  const tower = [
    [29, 37],
    [0, 23],
    [-8, 4],
  ];
  box(desk, ...tower, (x, y, z) => (z === 4 && (x === 29 || x === 37 || y === 0 || y === 23) ? "pcEdge" : "pcCase"));
  place(house, mesh(desk), [DESK[0], Y, DESK[1]]);
  const rgbPart = part();
  for (const fy of [6, 13, 20])
    for (let a = 0; a < 12; a++)
      rgbPart.add(33 + Math.round(2.4 * Math.cos((a * Math.PI) / 6)), fy + Math.round(2.4 * Math.sin((a * Math.PI) / 6)), 5, "white");
  const rgb = place(house, solid(rgbPart, COLORS, new THREE.MeshBasicMaterial({ vertexColors: true })), [DESK[0], Y, DESK[1]]);
  // The power light, small, in the front right corner of the top.
  const power = place(house, new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1), new THREE.MeshBasicMaterial()), [
    DESK[0] + 36.2,
    Y + 23.7,
    DESK[1] + 3.2,
  ]);
  footprint(DESK[0] - 27, DESK[0] + 38, BACK, DESK[1] + 10);

  // His white headphones on their stand, the band over the hook and a cup hanging either side, their
  // black cushions turned in.
  const phonesPart = part();
  for (let a = 0.2; a <= Math.PI - 0.2; a += 0.05) {
    const [x, y] = [Math.round(-21 + 5.5 * Math.cos(a)), Math.round(26 + 5.5 * Math.sin(a))];
    phonesPart.add(x, y, 4, Math.abs(x + 21) <= 2 ? "phonePad" : "phoneCup");
  }
  for (const side of [-1, 1]) {
    box(phonesPart, [-21 + side * 6, -21 + side * 6], [20, 26], [3, 5], "phoneCup");
    box(phonesPart, [-21 + side * 5, -21 + side * 5], [20, 26], [3, 5], "phoneCushion");
  }
  const phonesOnStand = place(house, mesh(phonesPart), [DESK[0], Y, DESK[1]]);

  // The little Kirby: on a yellow Warp Star over a cloud with a solar panel, on a lilac base. Built at half
  // a voxel to the voxel; while the sun is up the star and Kirby rock from side to side.
  const kirby = place(house, new THREE.Group(), [DESK[0] + 20, Y + 15.5, DESK[1] - 5], 0.35);
  kirby.scale.setScalar(0.5);
  const kirbyBase = part();
  for (let y = 0; y <= 3; y++) ellipsoid(kirbyBase, [0, y, 0], [6.5, 0.5, 5], y === 3 ? "kirbyBaseTop" : "kirbyBase");
  box(kirbyBase, [-3, 3], [1, 2], [5, 5], "brass"); // the name plate
  ellipsoid(kirbyBase, [0, 7, 0], [7.5, 3.5, 5], (x, y, z) =>
    hash(x, y, z) < 0.06 ? ["tin", "pink", "skyStar", "melon"][Math.floor(hash(z, x, y) * 4)] : "cloud"
  );
  for (let x = -3; x <= 3; x++) for (let y = 6; y <= 8; y++) kirbyBase.front(x, y)[3] = y === 7 && x % 2 === 0 ? "solarLine" : "solar"; // the solar panel
  kirby.add(mesh(kirbyBase));
  const rocker = pivotGroup(kirby, [0, 10, 0]);
  const kirbyTop = part();
  // The star: five points, its radius going from 7.5 at a point to 3 between two.
  for (let x = -8; x <= 8; x++)
    for (let y = 6; y <= 22; y++) {
      const u = ((Math.atan2(x, y - 14) + Math.PI * 2) % ((Math.PI * 2) / 5)) / (Math.PI / 5) - 1; // -1 to 1, 0 between points
      if (Math.hypot(x, y - 14) <= 3 + 4.5 * Math.abs(u)) box(kirbyTop, [x, x], [y, y], [-2, 2], "starYellow");
    }
  ellipsoid(kirbyTop, [0, 23, 1], [5, 4.6, 4.6], "kirbyPink");
  for (const side of [-1, 1]) {
    ellipsoid(kirbyTop, [side * 3, 18.5, 2.5], [2.4, 1.3, 2.4], "kirbyFeet");
    ellipsoid(kirbyTop, [side * 5, 23, 1.5], [1.5, 1.5, 1.5], "kirbyPink"); // its stubby arms
  }
  // Its face, on the front of the ball: tall eyes, dark with a glint at the top and blue at the bottom,
  // pink cheeks and a little open mouth.
  const paint = (x, y, color) => (kirbyTop.front(x, y)[3] = color);
  for (const x0 of [-2, 1])
    for (let y = 23; y <= 25; y++) for (const x of [x0, x0 + 1]) paint(x, y, y === 23 ? "kirbyEyeBlue" : y === 25 && x === x0 ? "white" : "kirbyEye");
  for (const x of [-4, -3, 3, 4]) paint(x, 22, "kirbyBlush");
  paint(0, 21, "kirbyMouth");
  rocker.inner.add(mesh(kirbyTop));
  // The two screens, and their glow on him at night. The one on end shows his team's voice chat while he
  // plays, his own name lit up green while he talks, and the chat scrolling up below.
  const MON = [26, 15];
  const monitor = pixelTexture(...MON, () => {});
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(...MON), new THREE.MeshBasicMaterial({ map: monitor.tex })), [
    DESK[0] + 1.5,
    Y + 30,
    DESK[1] - 4.4,
  ]);
  const SIDE_MON = [11, 25];
  const sideMonitor = pixelTexture(...SIDE_MON, () => {});
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(...SIDE_MON), new THREE.MeshBasicMaterial({ map: sideMonitor.tex })), [
    DESK[0] - 21,
    Y + 33,
    DESK[1] - 4.4,
  ]);
  const monLight = new THREE.PointLight(0xa8c8ff, 0, 60, 0);
  monLight.position.set(DESK[0], Y + 30, DESK[1] + 14);
  house.add(monLight);

  // The gaming chair: black with white panels, on a five-star base. Its seat and back turn with whoever
  // sits in it.
  const CHAIR = [DESK[0], -84];
  const chairBase = part();
  box(chairBase, [-1, 0], [1, 5], [-1, 0], "steelDark");
  for (let a = 0; a < 5; a++) {
    const [dx, dz] = [Math.cos((a * 2 * Math.PI) / 5 + 0.3), Math.sin((a * 2 * Math.PI) / 5 + 0.3)];
    for (let r = 1; r <= 6; r++) chairBase.add(Math.round(dx * r - 0.5), 1, Math.round(dz * r - 0.5), "chairBlack");
    chairBase.add(Math.round(dx * 6 - 0.5), 0, Math.round(dz * 6 - 0.5), "steelDark");
  }
  place(house, mesh(chairBase), [CHAIR[0], Y, CHAIR[1]]);
  const chairTop = part();
  box(chairTop, [-6, 6], [6, 8], [-5, 5], (x, y) => (y === 8 && Math.abs(x) <= 2 ? "chairWhite" : "chairBlack"));
  box(chairTop, [-6, 6], [9, 21], [6, 7], (x, y) => (Math.abs(x) === 4 && y < 20 ? "chairWhite" : "chairBlack"));
  for (const side of [-1, 1]) {
    box(chairTop, [side * 7, side * 7], [9, 10], [0, 0], "steelDark");
    box(chairTop, [side * 7, side * 7], [11, 11], [-4, 3], "chairBlack");
  }
  const chair = place(house, new THREE.Group(), [CHAIR[0], Y, CHAIR[1]]);
  chair.add(mesh(chairTop));
  footprint(CHAIR[0] - 7, CHAIR[0] + 7, CHAIR[1] - 6, CHAIR[1] + 8);
  const pc = { mode: "off", game: GAMES[0], since: 0, sitter: null, talking: false };
  const rectOn = (g) => (x, y, rw, rh, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), rw, rh);
  };
  // `mode` "show" is a drama she streams (screens.js's DRAMAS), `pc.game` which.
  function drawMonitor(t) {
    if (pc.mode === "show") drawPcDrama(monitor.g, ...MON, pc.game, t, t - pc.since);
    else drawPcGame(monitor.g, ...MON, pc.mode, pc.game, t, t - pc.since);
    monitor.tex.needsUpdate = true;
  }
  const TEAM = ["#f28aa8", "#8fd3ff", "#f6cf4a", "#9fe0a8"]; // his, then his three teammates'
  function drawSideMonitor(t) {
    const rect = rectOn(sideMonitor.g);
    const [w, h] = SIDE_MON;
    if (pc.mode !== "off" && pc.sitter?.name === "girl") drawSideShow(sideMonitor.g, w, h, pc.mode, pc.game, t, t - pc.since);
    else if (pc.mode === "off") rect(0, 0, w, h, "#060608");
    else {
      rect(0, 0, w, h, "#262a3a");
      rect(0, 0, w, 2, "#5b6ee1");
      // The voice channel: a little face for each of them, ringed in green while they talk.
      TEAM.forEach((c, i) => {
        const y = 3 + i * 3;
        const talking = i === 0 ? pc.talking : Math.sin(t * (1.3 + i) + i * 2) > 0.7;
        rect(1, y, 3, 2, talking ? "#3fd47a" : "#262a3a");
        rect(2, y, 1, 2, c);
        rect(5, y + 1, 3 + ((i * 2) % 4), 1, "#9aa3c0");
      });
      // The chat, scrolling up a line every second.
      const first = Math.floor(t);
      for (let k = 0; k < 6; k++) {
        const line = first + k;
        rect(1, 16 + k * 1.5, 1, 1, TEAM[line % 4]);
        rect(3, 16 + k * 1.5, 2 + Math.floor(hash(line, 1, 2) * 7), 1, "#c9cfe3");
      }
      if (pc.mode !== "game") rect(1, 15, w - 2, 1, pc.mode === "win" ? "#f6cf4a" : "#e0605a");
    }
    sideMonitor.tex.needsUpdate = true;
  }
  let monitorAt = -1;
  let kirbySway = 0;
  const hue = new THREE.Color();
  updates.push((t, dt) => {
    if (pc.mode !== "off" && t - monitorAt > 0.08) {
      drawMonitor(t);
      drawSideMonitor(t);
      monitorAt = t;
    }
    monLight.intensity = pc.mode === "off" ? 0 : shared.night ? 0.6 : 0.25;
    rgb.material.color.copy(hue.setHSL((t * 0.08) % 1, 0.8, 0.6));
    power.material.color.set(pc.mode === "off" ? "#3b3d47" : "#ffffff");
    // The chair turns with whoever sits in it, and back to the desk after.
    const target = pc.sitter && pc.sitter.seated ? pc.sitter.yaw - Math.PI : 0;
    chair.rotation.y += Math.atan2(Math.sin(target - chair.rotation.y), Math.cos(target - chair.rotation.y)) * (1 - Math.exp(-8 * dt));
    // The Kirby rocks in the sunlight, and comes to rest in the dark.
    kirbySway += ((shared.night ? 0 : 1) - kirbySway) * (1 - Math.exp(-2 * dt));
    rocker.outer.rotation.z = 0.28 * kirbySway * Math.sin(t * 2.6);
  });

  // A low bookshelf under the side window: books of all colours and heights on three shelves, a plant and
  // a photo on top. One red book is the one the girl and the boy take down to read.
  const SHELF = [-144, 15];
  const SHELF_YAW = Math.PI / 2;
  const shelf = part();
  box(shelf, [-14, 13], [0, 33], [-5, 5], "woodMid", [{ has: (x, y, z) => x >= -12 && x <= 11 && y >= 2 && y <= 31 && z >= -4 }]);
  box(shelf, [-12, 11], [2, 31], [-5, -5], "woodDeep");
  for (const y of [11, 22]) box(shelf, [-12, 11], [y, y], [-4, 5], "woodMid");
  const BOOK_COLORS = ["bookA", "bookB", "bookC", "bookD", "bookE", "bookF", "bookG"];
  // The reading books' places: [shelf, x, height].
  const READ_SLOTS = [
    [12, -1, 7],
    [2, -9, 6],
    [12, 7, 6],
    [23, -6, 7],
    [23, 4, 6],
    [2, 3, 7],
  ];
  for (const [base, seed] of [
    [2, 1],
    [12, 2],
    [23, 3],
  ]) {
    let x = -12;
    let n = 0;
    while (x <= 9) {
      const width = 2 + Math.floor(hash(x, seed, 9) * 2);
      const height = 5 + Math.floor(hash(seed, x, 4) * 3);
      const color = BOOK_COLORS[Math.floor(hash(x, seed, 2) * BOOK_COLORS.length)];
      const gap = hash(seed, x, n) < 0.12;
      const slot = READ_SLOTS.find(([b, x0]) => b === base && x + width > x0 - 1 && x < x0 + 3);
      if (slot) {
        x = slot[1] + 3; // a reading book's place
        continue;
      }
      if (!gap)
        box(shelf, [x, Math.min(x + width - 1, 11)], [base, base + height], [-3, 3], (bx, by) => (by === base + height - 2 ? "frame" : color));
      x += width + (gap ? 2 : 0);
      n++;
    }
  }
  ellipsoid(shelf, [8, 36, 0], [2.4, 2.4, 2.4], "pot");
  ellipsoid(shelf, [8, 39, 0], [3.2, 2.4, 2.8], (x, y, z) => (hash(x, y, z) < 0.3 ? "plantLight" : "plant"));
  box(shelf, [-10, -5], [34, 39], [-1, -1], (x, y) =>
    x === -10 || x === -5 || y === 34 || y === 39 ? "canvasFrame" : y < 37 ? "melon" : "photoSky"
  );
  const shelfGroup = place(house, new THREE.Group(), [SHELF[0], 0, SHELF[1]], SHELF_YAW);
  shelfGroup.add(mesh(shelf));
  // The books they take down to read (props.js's BOOKS), each in its place on a shelf; they take one they
  // have not read lately each time, till all have been read, and put it back after.
  const books = READ_SLOTS.map(([base, x0, height], i) => {
    const p = part();
    box(p, [x0, x0 + 2], [base, base + height], [-3, 3], (x, y) => (y === base + height - 2 ? "frame" : y === base + 1 ? "bookBand" : `read${i}`));
    return shelfGroup.add(mesh(p)).children.at(-1);
  });
  let unread = [];
  let lastBook = -1;
  const shelfBooks = {
    // Which to take: one not read since they were all read, never the one just put back.
    next() {
      if (!unread.length) unread = books.map((_, i) => i).filter((i) => i !== lastBook);
      const i = unread.splice(Math.floor(Math.random() * unread.length), 1)[0];
      lastBook = i;
      return i;
    },
    show: (i, on) => (books[i].visible = on),
  };
  turnedFootprint(SHELF, SHELF_YAW, [-15, 14, -6, 6]);

  // The bed under the window, for two: a honey-wood frame with a heart on the headboard, two pillows, and
  // the quilt from the girl's bed on the profile page (girl-props.js): white and pale pink squares with a
  // little bear on each white one, the sheet turned down over its top. It rises over whoever is tucked in
  // on each side.
  const BED = [129, -85];
  const bed = part();
  box(bed, [-25, 25], [0, 4], [-24, 25], (x, y) => (y === 4 ? "woodDark" : "wood"));
  box(bed, [-24, 24], [5, 8], [-21, 24], "sheet");
  for (let z = -25; z <= -22; z++)
    for (let x = -25; x <= 25; x++) {
      const top = 26 - Math.round((x * x) / 120); // a rounded top
      for (let y = 0; y <= top; y++) bed.add(x, y, z, y === top || Math.abs(x) === 25 ? "woodDark" : "wood");
    }
  const HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
  HEART.forEach((row, j) => [...row].forEach((c, i) => c === "X" && bed.add(i - 3, 22 - j, -21, "heart")));
  for (const side of [-1, 1])
    ellipsoid(bed, [side * 12.5, 10, -15], [10, 2.5, 5.5], (x) => (Math.abs(x - side * 12.5) > 8.5 ? "pillowTrim" : "sheet"), [], 3);
  const BEAR = ["X...X", "XXXXX", "XEXEX", "XMNMX", ".XXX."];
  const BEAR_COLORS = { X: "bear", E: "bearDark", N: "bearDark", M: "bearMuzzle" };
  const quiltColor = (x, z) => {
    if (z <= 3) return "sheet"; // turned down over the top
    const [tx, tz] = [Math.floor((x + 24) / 7), Math.floor((z - 4) / 7)];
    if ((tx + tz) & 1) return "quiltPink";
    const [i, j] = [x + 24 - 7 * tx, z - 4 - 7 * tz];
    const cell = i >= 1 && i <= 5 && j >= 1 && j <= 5 ? BEAR[j - 1][i - 1] : "."; // its ears towards the pillows
    return cell === "." ? "quiltWhite" : BEAR_COLORS[cell];
  };
  box(bed, [-24, 24], [9, 9], [1, 24], (x, y, z) => quiltColor(x, z));
  box(bed, [-24, 24], [5, 9], [25, 25], (x, y) => (y === 9 ? quiltColor(x, 25) : "quiltPink")); // hanging over the foot
  place(house, mesh(bed), [BED[0], Y, BED[1]]);
  footprint(BED[0] - 25, BED[0] + 25, BACK, BED[1] + 25);
  const MATTRESS = Y + 9.5; // the top of the quilt, made
  const ON_BED = MATTRESS + 0.5; // where a pet on it stands
  const QUILT_H = 12;
  const quilts = [-1, 1].map((side) => {
    const p = part();
    for (let x = 1; x <= 24; x++)
      for (let z = 1; z <= 24; z++) {
        const top = Math.round(QUILT_H * Math.min(1, Math.sin((Math.PI * x) / 25) * 1.6) * Math.min(1, (25 - z) / 3, z / 2));
        for (let y = 0; y <= top; y++) p.add(side * x, y, z, quiltColor(side * x, z));
      }
    const m = place(house, mesh(p), [BED[0], MATTRESS - 0.5, BED[1]]);
    m.scale.y = 0.01;
    m.visible = false;
    return m;
  });
  const beds = { slots: [false, false], k: [0, 0] };
  updates.push((t, dt) => {
    quilts.forEach((m, i) => {
      beds.k[i] += ((beds.slots[i] ? 1 : 0) - beds.k[i]) * (1 - Math.exp(-4 * dt));
      m.visible = beds.k[i] > 0.02;
      m.scale.y = Math.max(0.01, beds.k[i]);
    });
  });

  // A nightstand by the bed with a little lamp on it, lit at night: a second warm light to the floor lamp's.
  const STAND = [98, -103];
  const stand = part();
  box(stand, [-4, 4], [0, 12], [-5, 5], (x, y, z) => (z === 5 && (y === 6 || y === 12 || Math.abs(x) === 4) ? "woodDark" : "wood"));
  stand.add(0, 9, 6, "brass"); // the drawer's knob
  box(stand, [-2, 2], [13, 13], [-2, 2], "woodDark");
  box(stand, [0, 0], [14, 17], [0, 0], "brass");
  place(house, mesh(stand), [STAND[0], Y, STAND[1]]);
  const lampShade = part();
  for (let y = 18; y <= 23; y++)
    ellipsoid(lampShade, [0, y, 0], [4.6 - (y - 18) * 0.4, 0.5, 4.6 - (y - 18) * 0.4], y === 18 || y === 23 ? "shadeTrim" : "shade");
  const shadeDay = place(house, mesh(lampShade), [STAND[0], Y, STAND[1]]);
  const shadeLit = place(house, solid(lampShade, COLORS, glowing), [STAND[0], Y, STAND[1]]);
  const bedLamp = new THREE.PointLight(0xffd29a, 0, 95, 0);
  bedLamp.position.set(STAND[0] + 4, Y + 21, STAND[1] + 8);
  house.add(bedLamp);
  const lamps = [];
  footprint(STAND[0] - 5, STAND[0] + 5, BACK, STAND[1] + 6);

  // The girl's dressing corner, past a low shoe cabinet: her outfits on a rail along the wall (the one she
  // has on missing from its hanger), a shelf over it with her straw hat and boxes, a long mirror leaning on
  // the cabinet, a round rug, and a folding screen to change behind. Clicking it lets you choose what she
  // wears (playground.js).
  const closetParts = []; // what a click on the dressing corner can land on
  const CABINET = [157, 160, BACK, -72];
  const cabinet = part();
  box(cabinet, CABINET.slice(0, 2), [0, 15], CABINET.slice(2), (x, y, z) =>
    y === 15 ? "woodDark" : x === 160 && (z % 9 === 0 || y === 0) ? "woodDark" : "wood"
  );
  for (const [z, c] of [
    [-104, "chairWhite"],
    [-100, "chairWhite"],
    [-90, "shoe"],
    [-86, "shoe"],
  ])
    box(cabinet, [158, 159], [16, 16], [z, z + 2], c); // her slides, his shoes
  place(house, mesh(cabinet), [0, Y, 0]);
  footprint(CABINET[0], CABINET[1] + 2, CABINET[2], CABINET[3]);
  const mirror = part();
  box(mirror, [161, 162], [0, 44], [-97, -79], (x, y, z) =>
    x === 161 || y === 0 || y === 44 || z === -97 || z === -79 ? "woodDark" : (y + z) % 11 === 0 || (y + z) % 11 === 1 ? "mirrorGleam" : "mirror"
  );
  closetParts.push(place(house, mesh(mirror), [0, Y, 0]));
  // Its glass, just in front of the frame, facing into the corner: room.js shows the room in it (mirror.js).
  const glass = place(
    house,
    new THREE.Mesh(new THREE.PlaneGeometry(17, 43), new THREE.MeshBasicMaterial({ color: COLORS.mirror })),
    [162.55, Y + 22, -88],
    Math.PI / 2
  );
  closetParts.push(glass);

  const RAIL_Y = Y + 50;
  const rail = part();
  for (const x of [164, 204]) box(rail, [x, x], [0, 50], [-104, -104], "brass");
  box(rail, [164, 204], [50, 50], [-104, -104], "brass");
  const LOW_RAIL = 28; // the second rail, for the long things
  box(rail, [164, 204], [LOW_RAIL, LOW_RAIL], [-104, -104], "brass");
  box(rail, [162, 206], [56, 57], [BACK, -101], "woodMid"); // the shelf
  for (const x of [166, 202]) box(rail, [x, x], [52, 55], [BACK, -108], "woodDeep");
  box(rail, [182, 191], [58, 61], [BACK + 1, -103], (x, y) => (y === 61 ? "boxLid" : "boxPink"));
  box(rail, [194, 201], [58, 60], [BACK + 1, -103], (x, y) => (y === 60 ? "boxLid" : "boxBlue"));
  closetParts.push(place(house, mesh(rail), [0, Y, 0]));
  const strawHat = part();
  for (let x = -7; x <= 7; x++)
    for (let z = -6; z <= 6; z++) if (x * x + z * z <= 42) strawHat.add(x, 0, z, (x + z) % 3 ? "hatStraw" : "hatStrawDark");
  ellipsoid(strawHat, [0, 2, 0], [4.2, 2, 4.2], (x, y) => (y === 1 ? "hatBand" : (x + y) % 3 ? "hatStraw" : "hatStrawDark"), [
    { has: (x, y) => y < 1 },
  ]);
  const hatOnShelf = place(house, mesh(strawHat), [173, RAIL_Y + 8, -105]);
  closetParts.push(hatOnShelf);
  // The outfits on their hangers, each the clothes of one of her looks (girl-outfits.js), seen from the front:
  // the short ones (tops and sets) on the top rail, the long dresses and the coat on a second rail below it,
  // spread out along each, every other one a little in front.
  const garments = LOOKS.map((look) => {
    const garment = part();
    look.hang(garment, 0);
    return garment;
  });
  const long = garments.map((g) => Math.min(...g.list().map(([, y]) => y)) < -17);
  const tiers = [false, true].map((low) => LOOKS.map((_, k) => k).filter((k) => long[k] === low));
  const hanging = LOOKS.map((look, k) => {
    const tier = tiers[long[k] ? 1 : 0];
    const i = tier.indexOf(k);
    const x0 = Math.round(184 + Math.min(10, 32 / Math.max(1, tier.length - 1)) * (i - (tier.length - 1) / 2));
    const p = part();
    p.add(x0, -1, 0, "woodDark");
    box(p, [x0 - 3, x0 + 3], [-2, -2], [0, 0], "woodDark");
    const garment = part();
    look.hang(garment, x0);
    const g = new THREE.Group();
    g.add(mesh(p));
    const clothes = mesh(garment);
    g.add(clothes);
    g.position.set(0, long[k] ? Y + LOW_RAIL : RAIL_Y, -104 + (i % 2) * 1.2);
    house.add(g);
    closetParts.push(g);
    return clothes;
  });
  const rug2 = new THREE.Mesh(new THREE.CircleGeometry(15, 24), new THREE.MeshLambertMaterial({ color: COLORS.boxPink }));
  rug2.rotation.x = -Math.PI / 2;
  place(house, rug2, [184, Y - 0.47, -78]);
  footprint(162, 206, BACK, -100);
  // The folding screen: three panels zigzagging, a cloth with little flowers in a wooden frame.
  const screenPart = part();
  [
    [178, 186, -46],
    [187, 195, -48],
    [196, 204, -46],
  ].forEach(([xa, xb, z]) =>
    box(screenPart, [xa, xb], [0, 47], [z, z], (x, y) =>
      x === xa || x === xb || y <= 1 || y === 47 ? "woodDark" : hash(x, y, 5) < 0.06 ? "heart" : "screenCloth"
    )
  );
  closetParts.push(place(house, mesh(screenPart), [0, Y, 0]));
  footprint(177, 205, -49, -45);
  const closet = {
    parts: closetParts,
    glass,
    // The looks whose clothes are off their hangers (and the hat off the shelf): the one she has on, and
    // while she changes, the one she is changing into.
    hang(missing) {
      hanging.forEach((m, i) => (m.visible = !missing.includes(i)));
      hatOnShelf.visible = !missing.some((k) => LOOKS[k].hat);
    },
  };
  closet.hang([0]);

  return {
    Y,
    DESK,
    phonesOnStand,
    CHAIR,
    pc,
    drawMonitor,
    drawSideMonitor,
    SHELF,
    shelfBooks,
    BED,
    MATTRESS,
    ON_BED,
    beds,
    shadeDay,
    shadeLit,
    bedLamp,
    lamps,
    RAIL_Y,
    closet,
  };
}
