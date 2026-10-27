/*******************************************************************************
 * The loft: his computer desk, the bed, the nightstand, the bookshelf and the
 * dressing corner.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash } from "../../models/voxels.js";
import { LOOKS } from "../../models/girl-outfits.js";
import {
  GAMES,
  drawPcGame,
  drawGameSide,
  drawClipShow,
  drawClipSide,
  drawStardew,
  drawFarmSide,
  STARDEW_SIZE,
  STARDEW_SIDE,
  episodeOf,
} from "../screens.js";
import { BACK, LOFT } from "./layout.js";
import { COLORS, pixelTexture, solid, solidMaterial, glowing, place } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildLoft(shared) {
  const { house, mesh, updates, footprint, turnedFootprint, floorShadow } = shared;

  const Y = LOFT.y;
  // The boy's desk: a white top on a drawer unit and legs; his monitor on its stand with a second one on
  // its left stood on end, his keyboard and mouse on a desk mat and a bottle of water (deskTop below); in front of
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
  box(desk, [-23, -19], [16, 16], [2, 6], "pcCase"); // the headphone stand: a foot, a post and a hook
  box(desk, [-21, -21], [17, 30], [4, 4], "pcCase");
  const tower = [
    [29, 37],
    [0, 23],
    [-8, 4],
  ];
  box(desk, ...tower, (x, y, z) => (z === 4 && (x === 29 || x === 37 || y === 0 || y === 23) ? "pcEdge" : "pcCase"));
  const pcParts = [place(house, mesh(desk), [DESK[0], Y, DESK[1]])]; // what a click on his computer can land on, with the screens
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
  const deskTop = deskGear();
  place(house, deskTop.group, [DESK[0], Y, DESK[1]]);
  // A lead from the back of each monitor, curving down beside its stand onto the desk, over its back edge,
  // sagging along behind it and into the back of the computer: half hidden, showing here and there.
  const leadMat = new THREE.MeshLambertMaterial({ color: "#26272b" });
  for (const [x0, y0, plug, sag] of [
    [DESK[0] + 1.5, Y + 28, [DESK[0] + 31, Y + 16], 3.5],
    [DESK[0] - 19, Y + 25, [DESK[0] + 31, Y + 19], 5],
  ]) {
    const back = DESK[1] - 9.75; // (between the desk and the wall)
    const points = [
      [x0, y0, DESK[1] - 5.7],
      [x0 + 0.3, Y + 17, DESK[1] - 6.6],
      [x0 + 0.5, Y + 15.8, DESK[1] - 8],
      [x0 + 0.7, Y + 15.8, back],
      [x0 + 1, Y + 11, back],
      [(x0 + plug[0]) / 2, Y + 2 + sag, back],
      [plug[0] - 2, plug[1] - 1, back],
      [plug[0], plug[1], DESK[1] - 8.6],
    ].map((v) => new THREE.Vector3(...v));
    house.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, "centripetal"), 80, 0.24, 6), leadMat));
  }

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
  // The two screens, and their glow on him at night. The one on end shows his team's voice chat, his music,
  // the computer's stats or a guide to the game while he plays (`pc.side`).
  // Her dramas and her farm game are drawn finer, on canvases of their own: the clips' own 168 x 96 (the
  // game's the same), the side screen's four times as fine.
  const MON = [26, 15];
  const monitor = pixelTexture(...MON, () => {});
  const monitorHi = pixelTexture(...STARDEW_SIZE, () => {});
  const screen = new THREE.MeshBasicMaterial({ map: monitor.tex });
  pcParts[1] = place(house, new THREE.Mesh(new THREE.PlaneGeometry(...MON), screen), [DESK[0] + 1.5, Y + 30, DESK[1] - 4.4]);
  const SIDE_MON = [11, 25];
  const sideMonitor = pixelTexture(...SIDE_MON, () => {});
  const sideMonitorHi = pixelTexture(...STARDEW_SIDE, () => {});
  const sideScreen = new THREE.MeshBasicMaterial({ map: sideMonitor.tex });
  pcParts[2] = place(house, new THREE.Mesh(new THREE.PlaneGeometry(...SIDE_MON), sideScreen), [DESK[0] - 21, Y + 33, DESK[1] - 4.4]);
  const monLight = new THREE.PointLight(0xa8c8ff, 0, 70, 2);
  monLight.position.set(DESK[0], Y + 30, DESK[1] + 2);
  // The fans' glow, at night, on the floor in front of the computer and the side of the nightstand.
  const rgbLight = new THREE.PointLight(0xffffff, 0, 40, 2);
  rgbLight.position.set(DESK[0] + 33, Y + 12, DESK[1] + 8);
  house.add(monLight, rgbLight);

  // The gaming chair: black with a lime green back, on a five-star base. Its seat and back turn with whoever
  // sits in it. To watch her shows she rolls it back from the desk and to the left (LOUNGE), so as not to sit
  // between the screen and the room; it is rolled back in after.
  const CHAIR = [DESK[0], -84];
  const LOUNGE = [CHAIR[0] - 9, CHAIR[1] + 8];
  const chairBase = part();
  box(chairBase, [-1, 0], [1, 5], [-1, 0], "steelDark");
  for (let a = 0; a < 5; a++) {
    const [dx, dz] = [Math.cos((a * 2 * Math.PI) / 5 + 0.3), Math.sin((a * 2 * Math.PI) / 5 + 0.3)];
    for (let r = 1; r <= 6; r++) chairBase.add(Math.round(dx * r - 0.5), 1, Math.round(dz * r - 0.5), "chairBlack");
    chairBase.add(Math.round(dx * 6 - 0.5), 0, Math.round(dz * 6 - 0.5), "steelDark");
  }
  const base = place(house, mesh(chairBase), [CHAIR[0], Y, CHAIR[1]]);
  const chairTop = part();
  box(chairTop, [-6, 6], [6, 8], [-5, 5], (x, y) => (y === 8 && Math.abs(x) <= 2 ? "chairWhite" : "chairBlack"));
  box(chairTop, [-6, 6], [9, 21], [6, 7], (x, y) => (Math.abs(x) === 4 && y < 20 ? "chairGreenDark" : "chairGreen"));
  for (const side of [-1, 1]) {
    box(chairTop, [side * 7, side * 7], [9, 10], [0, 0], "steelDark");
    box(chairTop, [side * 7, side * 7], [11, 11], [-4, 3], "chairBlack");
  }
  const chair = place(house, new THREE.Group(), [CHAIR[0], Y, CHAIR[1]]);
  chair.add(mesh(chairTop));
  footprint(CHAIR[0] - 7, CHAIR[0] + 7, CHAIR[1] - 6, CHAIR[1] + 8, false);
  footprint(LOUNGE[0] - 5, LOUNGE[0] + 7, LOUNGE[1] - 6, LOUNGE[1] + 8, false); // (clear of where he reaches his headphones from)
  const chairShadow = floorShadow(CHAIR[0] - 7, CHAIR[0] + 7, CHAIR[1] - 6, CHAIR[1] + 8); // rolls with it
  const pc = { mode: "off", game: GAMES[0], side: "chat", since: 0, ep: 0, sitter: null, talking: false, rolled: null };
  const rectOn = (g) => (x, y, rw, rh, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), rw, rh);
  };
  // `mode` "show" is a drama she watches (screens.js's DRAMAS), `pc.game` which and `pc.ep` the episode;
  // "game" with `pc.game` "stardew" her farm game, `pc.ep` the day.
  function drawMonitor(t) {
    const farm = pc.mode === "game" && pc.game === "stardew";
    const on = pc.mode === "show" || farm ? monitorHi : monitor;
    screen.map = on.tex;
    if (pc.mode === "show") drawClipShow(on.g, on.canvas.width, on.canvas.height, episodeOf(pc.game, pc.ep), t - pc.since, t - pc.since);
    else if (farm) drawStardew(on.g, t, t - pc.since, pc.ep);
    else drawPcGame(on.g, ...MON, pc.mode, pc.game, t, t - pc.since);
    on.tex.needsUpdate = true;
  }
  function drawSideMonitor(t) {
    const [w, h] = SIDE_MON;
    const farm = pc.mode === "game" && pc.game === "stardew";
    const on = farm ? sideMonitorHi : sideMonitor;
    sideScreen.map = on.tex;
    if (pc.mode === "show") drawClipSide(on.g, w, h, pc.game, pc.ep, t - pc.since);
    else if (farm) drawFarmSide(on.g, t - pc.since, pc.ep);
    else if (pc.mode === "off") rectOn(on.g)(0, 0, w, h, "#060608");
    else drawGameSide(on.g, w, h, pc.side, pc.mode, pc.game, t, pc.talking);
    on.tex.needsUpdate = true;
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
    monLight.intensity = pc.mode === "off" ? 0 : shared.night ? 150 : 50;
    rgb.material.color.copy(hue.setHSL((t * 0.08) % 1, 0.8, 0.6));
    rgbLight.color.copy(hue);
    rgbLight.intensity = shared.night ? 30 : 0;
    power.material.color.set(pc.mode === "off" ? "#3b3d47" : "#ffffff");
    deskTop.glow.color.setScalar(pc.mode === "off" ? 0.12 : 1);
    if (pc.mode !== "off") deskTop.flow(t);
    // The chair turns with whoever sits in it, and back to the desk after; it rolls to where it is wanted
    // (`pc.rolled`, or the desk), and back in once whoever sat in it is up (called away while sitting).
    if (pc.sitter && !pc.sitter.seated) pc.sitter = pc.rolled = null;
    const target = pc.sitter && pc.sitter.seated ? pc.sitter.yaw - Math.PI : 0;
    chair.rotation.y += Math.atan2(Math.sin(target - chair.rotation.y), Math.cos(target - chair.rotation.y)) * (1 - Math.exp(-8 * dt));
    const [cx, cz] = pc.rolled || CHAIR;
    for (const o of [chair, base]) {
      o.position.x += (cx - o.position.x) * (1 - Math.exp(-5 * dt));
      o.position.z += (cz - o.position.z) * (1 - Math.exp(-5 * dt));
    }
    chairShadow.position.x = base.position.x;
    chairShadow.position.z = base.position.z + 1;
    // The Kirby rocks in the sunlight, and comes to rest in the dark.
    kirbySway += ((shared.night ? 0 : 1) - kirbySway) * (1 - Math.exp(-2 * dt));
    rocker.outer.rotation.z = 0.28 * kirbySway * Math.sin(t * 2.6);
  });

  // A low bookshelf under the side window: books of every kind on three shelves, a plant and a printer on top.
  // The books are drawn in half voxels, each its own: cloth-bound hardbacks with gold bands and a title, bright
  // paperbacks with a white band and a little logo, thin ones, a boxed set of three, a few lying in a pile;
  // their pages showing cream along the top. Six of them are the ones the girl and the boy take
  // down to read (props.js's BOOKS).
  const SHELF = [-144, 27];
  const SHELF_YAW = Math.PI / 2;
  const shelf = part();
  box(shelf, [-14, 13], [0, 33], [-5, 5], "woodMid", [{ has: (x, y, z) => x >= -12 && x <= 11 && y >= 2 && y <= 31 && z >= -4 }]);
  box(shelf, [-12, 11], [2, 31], [-5, -5], "woodDeep");
  for (const y of [11, 22]) box(shelf, [-12, 11], [y, y], [-4, 5], "woodMid");
  // The reading books' places: [shelf, x, height] (in voxels).
  const READ_SLOTS = [
    [12, -1, 7],
    [2, -9, 6],
    [12, 7, 6],
    [23, -6, 7],
    [23, 4, 6],
    [2, 3, 7],
  ];
  // Half voxel u covers u / 2 - 1/2 to u / 2 (fine()), so voxel v is half voxels 2v and 2v + 1.
  const palette = { ...COLORS };
  const color = (hex) => ((palette[hex] = hex), hex);
  const hsl = (h, s, l) => color(`#${new THREE.Color().setHSL(h, s, l).getHexString()}`);
  const lighter = (hex, k) => color(`#${new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), k).getHexString()}`);
  const [GOLD, PAGE, INK] = [color("#d9b45a"), color("#f1e8d2"), color("#3a3330")];
  // One book standing, its spine to the front at half voxel `front`: [x0, x0 + w) across, from `y0` up `h`,
  // `d` deep; `body` a colour of `palette`.
  function book(p, x0, y0, w, h, d, front, kind, body) {
    const title = lighter(body, kind === "paper" ? 0.75 : 0.45);
    for (let y = y0; y < y0 + h; y++) {
      const dy = y - y0;
      for (let x = x0; x < x0 + w; x++)
        for (let z = front - d + 1; z <= front; z++) {
          const edge = x === x0 || x === x0 + w - 1 || z === front - d + 1;
          let c = body;
          if (dy === h - 1 && !edge && z < front) c = PAGE; // the pages, along the top
          else if (z === front && x > x0 && x < x0 + w - 1) {
            // The spine.
            if (kind === "cloth" && (dy === 2 || dy === h - 3)) c = GOLD;
            else if (kind === "cloth" && (dy === h - 6 || dy === h - 7)) c = title;
            else if (kind === "paper" && (dy === h - 3 || dy === h - 4)) c = title;
            else if (kind === "paper" && dy === 1) c = INK;
            else if (kind === "thin" && dy === h - 4) c = title;
            else if (kind === "set" && (dy === h - 3 || dy === 3)) c = GOLD;
          }
          p.add(x, y, z, c);
        }
    }
  }
  const fine = (p) => {
    const m = solid(p, palette);
    m.scale.setScalar(0.5);
    m.position.set(-0.25, -0.25, -0.25);
    return m;
  };
  const shelfBookPart = part();
  for (const [base, seed] of [
    [2, 1],
    [12, 2],
    [23, 3],
  ]) {
    const [y0, room] = [2 * base, base === 12 ? 19 : 17]; // the floor of the shelf, and how tall a book can be
    const slots = READ_SLOTS.filter(([b]) => b === base).map(([, x0]) => [2 * x0 - 1, 2 * x0 + 6]);
    let x = -24;
    for (let n = 0; x < 22; n++) {
      const r = (k) => hash(n, seed, k); // this book's own dice
      const slot = slots.find(([s0, s1]) => x + 14 > s0 && x < s1);
      if (slot && x + 3 > slot[0]) {
        x = slot[1]; // a reading book's place
        continue;
      }
      const end = Math.min(22, slot ? slot[0] : 22); // room to the next reading book, or the end of the shelf
      const front = 7 - (r(1) < 0.3 ? 1 : 0);
      const roll = r(2);
      if (roll < 0.14 && end - x >= 13) {
        // A pile lying flat, the biggest at the bottom.
        let y = y0;
        for (let k = 0; k < 2 + Math.floor(r(3) * 2); k++) {
          const [len, th] = [12 - k * 2 - Math.floor(r(4 + k) * 2), 2 + Math.floor(r(6 + k) * 2)];
          const body = hsl(r(8 + k), 0.45, 0.42);
          for (let bx = x; bx < x + len; bx++)
            for (let by = y; by < y + th; by++)
              for (let z = front - 13; z <= front; z++) {
                const end1 = bx === x || bx === x + len - 1;
                shelfBookPart.add(
                  bx,
                  by,
                  z,
                  end1 && z < front && by > y && by < y + th - 1
                    ? PAGE
                    : z === front && by === y + th - 1 && bx > x + 1 && bx < x + len - 2
                      ? lighter(body, 0.4)
                      : body
                );
              }
          y += th;
        }
        x += 14;
      } else if (roll < 0.24 && end - x >= 14) {
        // A boxed set of three.
        const body = hsl(r(3), 0.4, 0.33);
        const h = room - 2 - Math.floor(r(4) * 2);
        for (let k = 0; k < 3; k++) book(shelfBookPart, x + k * 4, y0, 4, h, 13, front, "set", body);
        x += 13;
      } else {
        const kind = roll < 0.6 ? "cloth" : roll < 0.88 ? "paper" : "thin";
        const w = kind === "thin" ? 2 : kind === "paper" ? 3 + Math.floor(r(3) * 2) : 4 + Math.floor(r(3) * 3);
        if (x + w > end) {
          x = end;
          continue;
        }
        const h = kind === "paper" ? 11 + Math.floor(r(4) * 4) : room - 6 + Math.floor(r(4) * 6);
        const body =
          kind === "paper"
            ? r(5) < 0.2
              ? color("#efe9dd")
              : hsl(r(6), 0.6, 0.6)
            : kind === "thin"
              ? hsl(r(6), 0.3, 0.55)
              : hsl(r(6), 0.42, 0.28 + r(7) * 0.12);
        book(shelfBookPart, x, y0, w, Math.min(h, room), kind === "paper" ? 11 : 13 + Math.floor(r(8) * 3), front, kind, body);
        x += w + (r(9) < 0.08 ? 2 : 0);
      }
    }
  }
  ellipsoid(shelf, [6, 36, 0], [2.4, 2.4, 2.4], "pot");
  ellipsoid(shelf, [6, 39, 0], [3.2, 2.4, 2.8], (x, y, z) => (hash(x, y, z) < 0.3 ? "plantLight" : "plant"));
  const shelfGroup = place(house, new THREE.Group(), [SHELF[0], 0, SHELF[1]], SHELF_YAW);
  shelfGroup.add(mesh(shelf), fine(shelfBookPart));
  // On top, beside the plant, a little white printer (in half voxels, the front to the room):
  // the document feeder on top with the logo, the control strip along the front at the right, a grey side,
  // and a page just printed lying on the tray out of the slot in front.
  const printer = part();
  const [WHITE, SHADE, GREY, DARK] = ["#f3f3f1", "#dcddda", "#85888d", "#36383d"].map(color);
  const SLOT = { has: (x, y, z) => x >= -6 && x <= 3 && y >= 69 && y <= 70 && z >= 1 };
  box(printer, [-10, 7], [68, 73], [-8, 2], (x, y) => (y === 68 ? SHADE : WHITE), [SLOT]); // the body
  box(printer, [-6, 3], [69, 70], [0, 0], DARK); // the slot
  box(printer, [-6, 3], [69, 69], [1, 7], color("#cfd1d4")); // the tray
  const ink = { "-3,4": "#f2899b", "0,4": "#a48ad8", "-3,6": "#f5a25a", "0,6": "#71c46b" }; // the page's pictures
  box(printer, [-5, 2], [70, 70], [3, 7], (x, y, z) => color(ink[`${x},${z}`] ?? "#fbfbf7"));
  box(printer, [7, 7], [70, 72], [-3, 2], GREY); // the side
  box(printer, [1, 7], [73, 73], [1, 2], (x, y, z) => (z === 2 && (x === 3 || x === 4) ? DARK : z === 2 && x === 6 ? color("#7fd0ff") : GREY)); // the control strip
  box(printer, [-10, 1], [74, 75], [-7, 1], (x, y) => (y === 74 ? SHADE : WHITE)); // the document feeder
  box(printer, [-9, 0], [76, 76], [-7, -3], SHADE); // its paper rest
  box(printer, [-8, -7], [75, 75], [-1, 0], GREY); // the logo
  box(printer, [2, 7], [74, 74], [-7, 0], SHADE); // the scanner lid
  const printerMesh = fine(printer);
  printerMesh.position.x -= 2; // (off the plant, towards the TV)
  shelfGroup.add(printerMesh);
  // Its lead, from the back off the end of the shelf towards the TV: sagging down between the shelf and the
  // chimney, up onto the mantel, along the back of it behind the candles, and in behind the TV.
  const printerLead = new THREE.CatmullRomCurve3(
    [
      [-148.6, 35.2, 33.7],
      [-149.2, 33.7, 35.1],
      [-149.3, 33.7, 36],
      [-149.3, 33.7, 40],
      [-149.4, 33.3, 41.9],
      [-149.5, 31.6, 43.4],
      [-149.6, 30.9, 44.5],
      [-149.6, 33.6, 45.8],
      [-149.6, 37.8, 46.9],
      [-149.6, 37.8, 48.6],
      [-149.6, 38.6, 50.4],
      [-149.6, 41.5, 51],
      [-149.6, 46, 51.2],
    ].map((v) => new THREE.Vector3(...v)),
    false,
    "centripetal"
  );
  house.add(new THREE.Mesh(new THREE.TubeGeometry(printerLead, 120, 0.26, 6), new THREE.MeshLambertMaterial({ color: "#4a4c52" })));
  // The books they take down to read, each in its place on a shelf; they take one they have not read lately
  // each time, till all have been read, and put it back after.
  const books = READ_SLOTS.map(([base, x0, height], i) => {
    const p = part();
    book(p, 2 * x0, 2 * base, 5, 2 * height + 1, 13, 7, "cloth", color(COLORS[`read${i}`]));
    return shelfGroup.add(fine(p)).children.at(-1);
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
  const bedMesh = place(house, mesh(bed), [BED[0], Y, BED[1]]);
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
  // The lamp stands towards the back on the bed's side, her plush moth beside it on the other (it is taller
  // than the lamp: in front of it, it would shade all the light below).
  const STAND = [98, -103];
  const [LAMP_X, LAMP_Z] = [2, -2];
  const stand = part();
  box(stand, [-4, 4], [0, 12], [-5, 5], (x, y, z) => (z === 5 && (y === 6 || y === 12 || Math.abs(x) === 4) ? "woodDark" : "wood"));
  stand.add(0, 9, 6, "brass"); // the drawer's knob
  box(stand, [LAMP_X - 2, LAMP_X + 2], [13, 13], [LAMP_Z - 2, LAMP_Z + 2], "woodDark");
  box(stand, [LAMP_X, LAMP_X], [14, 17], [LAMP_Z, LAMP_Z], "brass");
  const standMesh = place(house, mesh(stand), [STAND[0], Y, STAND[1]]);
  const lampShade = part();
  for (let y = 18; y <= 23; y++)
    ellipsoid(lampShade, [LAMP_X, y, LAMP_Z], [4.6 - (y - 18) * 0.4, 0.5, 4.6 - (y - 18) * 0.4], y === 18 || y === 23 ? "shadeTrim" : "shade");
  const shadeDay = place(house, mesh(lampShade), [STAND[0], Y, STAND[1]]);
  const shadeLit = place(house, solid(lampShade, COLORS, glowing), [STAND[0], Y, STAND[1]]);
  // Its light, from the bulb in the shade: most of it down out of the open bottom, onto the nightstand and in
  // a ring round it on the floor, casting the only shadows in the house (of his desk and computer); a little
  // through the shade all round, enough that what is in a shadow is not black. Both fall off with distance: a
  // warm pool by the bed, darker past his computer.
  const BULB = [STAND[0] + LAMP_X, Y + 20, STAND[1] + LAMP_Z];
  const bedSpot = new THREE.SpotLight(0xffd29a, 0, 150, 1.45, 0.6, 1);
  bedSpot.position.set(...BULB);
  bedSpot.target.position.set(BULB[0], Y, BULB[2] + 4);
  bedSpot.castShadow = true;
  bedSpot.shadow.mapSize.set(1024, 1024);
  bedSpot.shadow.camera.near = 2;
  bedSpot.shadow.bias = -0.0005;
  bedSpot.shadow.normalBias = 0.3;
  const bedGlow = new THREE.PointLight(0xffc98a, 0, 100, 1);
  bedGlow.position.set(...BULB);
  house.add(bedSpot, bedSpot.target, bedGlow);
  const bedLight = {
    on: false,
    dirty: false, // its shadows to be drawn again (room.js)
    set(on) {
      if (on && !this.on) this.dirty = true;
      bedSpot.intensity = on ? 36 : 0;
      bedGlow.intensity = on ? 13 : 0;
      this.on = on;
    },
  };
  const lamps = [];
  footprint(STAND[0] - 5, STAND[0] + 5, BACK, STAND[1] + 6);
  // Her plush moth: a big ball of pale grey fur for a head, two small dark eyes set wide in it and a darker
  // parting down its brow, two tall black corduroy antennae like a rabbit's ears, a shaggy black ruff under
  // it, a round black body as big as the head, thin grey felt arms held out and stubby legs, and big grey
  // wings with black seams spread behind. Built in half voxels (half voxel u covers u / 2 - 1/2 to u / 2
  // above what it sits on), its middle at x = z = 0. It sits on the bed against her pillow, turned a little
  // to the room; whoever goes to bed first moves it to the nightstand beside the lamp, and the last one
  // up puts it back (acts/living.js). `by`: whoever has it in hand. Set down, on the bed or in front of the
  // lamp, it casts a shadow in the lamp's light (drawn again as it is put down or picked up); in hand, none.
  const mothPart = part();
  // Each wing a big rounded lobe over a smaller one; a seam just in from the edge, and one from the root
  // between the two lobes.
  const inWing = (x, y) => {
    const dx = Math.abs(x);
    return y >= 0 && (((dx - 6.5) / 4.3) ** 2 + ((y - 11.5) / 5) ** 2 <= 1 || ((dx - 6.5) / 4) ** 2 + ((y - 5.2) / 3.4) ** 2 <= 1);
  };
  const nearEdge = (x, y, r) => {
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (!inWing(x + a, y + b)) return true;
    return false;
  };
  const seam = (x, y) => {
    if (nearEdge(x, y, 1)) return "plushWing";
    const [u, v] = [Math.abs(x) - 2, y - 8];
    const a = Math.atan2(v, u);
    if (u < 3) return "plushWing"; // (the inner edge, behind the head and the body)
    return nearEdge(x, y, 2) || (Math.hypot(u, v) > 4 && Math.abs(a + 0.15) < 0.06) ? "plushVein" : "plushWing";
  };
  for (let x = -11; x <= 11; x++)
    for (let y = 0; y <= 17; y++) if (inWing(x, y)) for (const z of [-3, -2]) mothPart.add(x, y, z, z === -2 ? seam(x, y) : "plushWing");
  ellipsoid(mothPart, [0, 4.8, 0.5], [5, 4.8, 4.2], "plushBlack");
  // The ruff, with tufts sticking out of it; the head on it, its fur flecked and fluffed out a little.
  const shag = (x, y, z) => (hash(x, y, z) < 0.4 ? "plushShag" : "plushBlack");
  ellipsoid(mothPart, [0, 10, 0.8], [5.6, 1.8, 4.6], shag);
  ellipsoid(mothPart, [0, 10, 0.8], [6.6, 2.4, 5.4], shag, [mothPart, { has: (x, y, z) => hash(z, x, y) >= 0.3 }]);
  const fur = (x, y, z) => (hash(x, y, z) < 0.15 ? "plushSpeck" : y >= 17 ? "plushFurLight" : "plushFur");
  ellipsoid(mothPart, [0, 14.3, 1], [5, 5, 4.5], fur);
  ellipsoid(mothPart, [0, 14.3, 1], [5.6, 5.6, 5], fur, [mothPart, { has: (x, y, z) => y <= 12 || hash(y, z, x) >= 0.2 }]);
  for (let y = 15; y <= 18; y++) mothPart.front(0, y)[3] = "plushSpeck"; // the parting
  const across = (side, a, b) => (side > 0 ? [a, b] : [-b, -a]); // x from a to b out from the middle, on that side
  for (const side of [-1, 1]) {
    // An eye, two by two, wide apart and a little below the middle of the head.
    for (const x of [2, 3]) for (const y of [13, 14]) mothPart.front(side * x, y)[3] = "plushEye";
    // An arm, held out from under the ruff and drooping a little, with a round paw; a stubby leg in front.
    for (let d = 5; d <= 8; d++) box(mothPart, [side * d, side * d], [d > 6 ? 7 : 8, d > 6 ? 7 : 8], [1, 2], "plushFelt");
    box(mothPart, across(side, 9, 10), [6, 7], [1, 2], "plushFelt");
    box(mothPart, across(side, 1, 3), [0, 1], [3, 6], "plushFelt");
    // An antenna, a little longer than the head is high: leaf-shaped, widest low down, pointed, leaning out,
    // its corduroy ribs in rows down the front, plain black behind.
    for (let y = 18; y <= 29; y++) {
      const t = (y - 18) / 11;
      const [mid, half] = [side * (3 + 3.6 * t), 0.4 + 2.6 * Math.sin(Math.PI * t ** 0.7)];
      for (let x = Math.ceil(mid - half); x <= mid + half; x++)
        for (const z of [0, 1]) mothPart.add(x, y, z, z === 1 && y % 2 ? "plushRib" : "plushBlack");
    }
  }
  const mothToy = place(house, new THREE.Group(), [0, 0, 0]);
  place(mothToy, mesh(mothPart), [0, 0.25, 0]).scale.setScalar(0.5);
  const handPoint = new THREE.Vector3();
  const moth = {
    // Where it sits: [x, y, z] of the middle of its seat, and which way it faces.
    spots: {
      bed: { at: [BED[0] - 18, Y + 8.5, BED[1] - 6.5], yaw: 0.4 },
      stand: { at: [STAND[0] - 2.5, Y + 12.5, STAND[1] + 1.5], yaw: 0.35 },
    },
    toy: mothToy,
    at: "bed",
    by: null,
    put(where) {
      const { at, yaw } = moth.spots[where];
      Object.assign(moth, { at: where, by: null });
      mothToy.position.set(...at);
      mothToy.rotation.y = yaw;
      casting(true);
    },
    // In `a`'s right hand, held by its middle, facing the way they do.
    take(a) {
      Object.assign(moth, { at: null, by: a });
      casting(false);
    },
  };
  function casting(on) {
    mothToy.traverse((m) => (m.castShadow = on));
    bedLight.dirty = true;
  }
  moth.put("bed");
  updates.push(() => {
    const a = moth.by;
    if (!a) return;
    a.rig.hands[0].updateWorldMatrix(true, false);
    a.rig.hands[0].localToWorld(handPoint.set(0, -2, 1.5));
    mothToy.position.set(handPoint.x, handPoint.y - 3, handPoint.z);
    mothToy.rotation.y = a.yaw;
  });

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
  // The folding screen: three panels zigzagging across in front of her, and a fourth folded back along the
  // open side of the loft, so that she is behind it seen from the side too (the view turned: view.js), a cloth
  // with little flowers in a wooden frame.
  const screenPart = part();
  const cloth = (u, y, edge) => (edge || y <= 1 || y === 47 ? "woodDark" : hash(u, y, 5) < 0.06 ? "heart" : "screenCloth");
  [
    [178, 186, -46],
    [187, 195, -48],
    [196, 204, -46],
  ].forEach(([xa, xb, z]) => box(screenPart, [xa, xb], [0, 47], [z, z], (x, y) => cloth(x, y, x === xa || x === xb)));
  [
    [-58, -48, 205],
    [-70, -59, 206],
    [-84, -71, 205],
  ].forEach(([za, zb, x]) => box(screenPart, [x, x], [0, 47], [za, zb], (x, y, z) => cloth(z, y, z === za || z === zb)));
  closetParts.push(place(house, mesh(screenPart), [0, Y, 0]));
  footprint(177, 205, -49, -45);
  footprint(204, 207, -85, -46);
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

  // The bedside lamp's shadows: cast only by what never moves (his desk and computer, the nightstand; the floor
  // too: shell.js), so that they are drawn once (room.js); taken by those and by the rest up here.
  pcParts.push(deskTop.group); // (after the screens: they are pcParts 1 and 2)
  for (const o of [...pcParts, rgb, standMesh]) o.castShadow = true;
  for (const o of [...pcParts, rgb, kirby, phonesOnStand, base, chair, standMesh, mothToy, bedMesh, ...quilts])
    o.traverse((m) => (m.receiveShadow = true));

  return {
    Y,
    DESK,
    phonesOnStand,
    CHAIR,
    LOUNGE,
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
    bedLight,
    lamps,
    moth,
    RAIL_Y,
    closet,
    pcParts,
  };
}

// A part in cells finer than voxels, `n` to the voxel (cell u covering u / n - 1 / n to u / n), each coloured
// by the hex colour it is given: its mesh, put in `parent` (and returned).
const HEX = new Proxy({}, { get: (_, hex) => hex });
function finer(p, n, parent, material = solidMaterial) {
  const m = solid(p, HEX, material);
  m.scale.setScalar(1 / n);
  m.position.setScalar(-1 / (2 * n));
  parent.add(m);
  return m;
}

// What is on his desk top, in finer cells (the desk top, y 15.5, is the bottom of cell 15.5 n + 1): a low
// tenkeyless keyboard in dark gunmetal, black keycaps each lit by its legend, a blue light and round buttons
// along the top and the volume roller at the right; a rounded gaming mouse, its buttons split by the wheel,
// rubber grips and a lit logo; both on a dark desk mat with a stitched edge (in quarter voxels). On the left a
// bottle of Fiji water (in eighths): square clear plastic with rounded corners, the blue cap, the label
// shading from pale to deep blue with FIJI in white and a red hibiscus. `glow`: the lights' material, dimmed
// while the computer is off; `flow(t)`: the rainbow across the legends and the mouse's logo, moving left to
// right.
function deskGear() {
  const group = new THREE.Group();
  const hsl = (h, s, l) => `#${new THREE.Color().setHSL(h, s, l).getHexString()}`;
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true });
  const quarters = part();
  const lights = part(); // (quarters too)
  const rainbow = part(); // (the same; coloured by flow())

  // The desk mat, x -8 to 17 and z 2 to 9.25, a dashed stitch just in from its edge.
  const [MAT, MAT_EDGE, STITCH] = ["#1b1c20", "#131417", "#34363d"];
  for (let x = -31; x <= 68; x++)
    for (let z = 9; z <= 37; z++) {
      const [ex, ez] = [Math.min(x + 31, 68 - x), Math.min(z - 9, 37 - z)];
      if (ex + ez === 0) continue; // the corners rounded off
      const stitch = Math.min(ex, ez) === 1 && (ex === 1 ? z : x) % 2 === 0;
      quarters.add(x, 63, z, Math.min(ex, ez) === 0 ? MAT_EDGE : stitch ? STITCH : MAT);
    }

  // The keyboard: 58 cells across from x -6 and 23 deep from z 3, two cells thick, the caps one more.
  const [X0, Z0] = [-23, 13];
  const [SIDE, PLATE, EDGE, CAP, GLYPH] = ["#1e2025", "#2b2e34", "#5a5f69", "#131418", "#8a909a"];
  for (let x = X0; x < X0 + 58; x++)
    for (let z = Z0; z < Z0 + 23; z++) {
      if ((x === X0 || x === X0 + 57) && (z === Z0 || z === Z0 + 22)) continue;
      quarters.add(x, 64, z, SIDE);
      quarters.add(x, 65, z, z === Z0 + 22 ? EDGE : PLATE);
    }
  // A key `kx` key widths from the left (3 cells to a key width), `kw` wide, in the row `rz` cells from the
  // back: a cap two cells deep, its legend lit in its back left corner (none on the space bar).
  const key = (rz, kx, kw, legend = true) => {
    const x0 = X0 + 1 + Math.round(kx * 3);
    const w = Math.round(kw * 3) - 1;
    for (let x = x0; x < x0 + w; x++)
      for (let z = Z0 + rz; z < Z0 + rz + 2; z++)
        if (legend && x === x0 && z === Z0 + rz) rainbow.add(x, 66, z, "#ffffff");
        else quarters.add(x, 66, z, CAP);
  };
  // Each row: how far from the back, and its keys' widths left to right (a negative one: a gap that wide).
  const ones = (n, w = 1) => Array(n).fill(w);
  const NAV = [-0.5, ...ones(3)]; // the block over the arrows
  const ROWS = [
    [4, [1, -1, ...ones(4), -0.5, ...ones(4), -0.5, ...ones(4), ...NAV]],
    [8, [...ones(13), 2, ...NAV]],
    [11, [1.5, ...ones(12), 1.5, ...NAV]],
    [14, [1.75, ...ones(11), 2.25]],
    [17, [2.25, ...ones(10), 2.75, -1.5, 1]],
    [20, [...ones(3, 1.25), 6.25, ...ones(4, 1.25), ...NAV]],
  ];
  for (const [rz, widths] of ROWS) {
    let kx = 0;
    for (const kw of widths) {
      if (kw > 0) key(rz, kx, kw, kw < 6);
      kx += Math.abs(kw);
    }
  }
  // Along the top: the blue light, four round buttons, the little dark window, the media keys and the roller.
  for (let x = X0 + 2; x <= X0 + 3; x++) for (let z = Z0 + 1; z <= Z0 + 2; z++) lights.add(x, 66, z, hsl(0.6, 1, 0.6));
  for (const kx of [1.5, 2.5, 3.5, 4.5, 12.5, 13.5]) {
    key(1, kx, 0.7, false);
    quarters.add(X0 + 2 + Math.round(kx * 3), 66, Z0 + 1, GLYPH);
  }
  for (let x = X0 + 22; x < X0 + 30; x++) for (let z = Z0 + 1; z <= Z0 + 2; z++) quarters.add(x, 66, z, "#0b0c0e");
  lights.add(X0 + 26, 66, Z0 + 2, "#dfe8ff");
  for (let x = X0 + 47; x <= X0 + 55; x++)
    for (const [y, z] of [
      [66, Z0 + 1],
      [66, Z0 + 2],
      [67, Z0 + 1],
      [67, Z0 + 2],
    ])
      quarters.add(x, y, z, x === X0 + 47 || x === X0 + 55 ? SIDE : x % 2 ? "#5c616b" : "#2a2c31");

  // The mouse, its middle at x 13.25, z 6, its buttons to the back: a rounded shell up to six cells high,
  // widest at the palm, highest just behind the middle.
  const [MX, MZ] = [53, 24];
  const [SHELL, BUTTON, GROOVE, GRIP] = ["#1d1e23", "#25272d", "#08090b", "#3a3d45"];
  for (let x = MX - 6; x <= MX + 6; x++)
    for (let z = MZ - 10; z <= MZ + 10; z++) {
      const u = (z - MZ) / 9.5; // -1 the front, 1 the palm
      const v = (x - MX) / (5.5 * (0.9 + 0.1 * u));
      if (v * v + Math.abs(u) ** 3 > 1) continue;
      const top = Math.max(1, Math.round(6 * Math.sqrt(Math.max(0, 1 - ((u - 0.25) / 1.2) ** 2)) * Math.sqrt(Math.max(0, 1 - 0.75 * v * v))));
      const grip = Math.abs(v) > 0.75;
      for (let y = 64; y < 63 + top; y++) quarters.add(x, y, z, grip ? GRIP : SHELL);
      const y = 63 + top;
      if (x === MX && u > 0.3 && u < 0.55) rainbow.add(x, y, z, "#ffffff"); // the logo
      else quarters.add(x, y, z, grip ? GRIP : u >= -0.12 ? SHELL : x === MX ? GROOVE : BUTTON);
      if (x === MX && u >= -0.62 && u <= -0.32) quarters.add(x, y + 1, z, z % 2 ? "#5c616b" : "#2a2c31"); // the wheel
    }
  finer(quarters, 4, group);
  finer(lights, 4, group, glow);
  // The rainbow: each corner of a legend's faces coloured by how far across it is, the hues sliding to the
  // right with the clock (redone every 0.05 s).
  const { geometry } = finer(rainbow, 4, group, glow);
  const [where, colour] = [geometry.getAttribute("position"), geometry.getAttribute("color")];
  const hue = new THREE.Color();
  let flowedAt = -1;
  const flow = (t) => {
    if (Math.abs(t - flowedAt) < 0.05) return;
    flowedAt = t;
    for (let i = 0; i < where.count; i++) {
      const across = (where.getX(i) - X0) / 58; // 0 at the keyboard's left, the mouse past 1
      hue.setHSL((((across * 0.8 - t * 0.2) % 1) + 1) % 1, 0.95, 0.6);
      colour.setXYZ(i, hue.r, hue.g, hue.b);
    }
    colour.needsUpdate = true;
  };

  // The bottle: 20 cells square (x and z -10 to 9) with rounded corners, the bottom two rows clear, the label
  // to row 41, clear above it, the shoulders rounding in to the neck from row 52, a white ring on the neck,
  // and the cap from row 63 to 70. Turned a little to the room.
  const bottle = new THREE.Group();
  bottle.position.set(-10.5, 0, 5);
  bottle.rotation.y = 0.35;
  group.add(bottle);
  const label = part();
  const clear = part();
  const within = (x, z, half, r) => Math.max(0, Math.abs(x + 0.5) - (half - r)) ** 2 + Math.max(0, Math.abs(z + 0.5) - (half - r)) ** 2 <= r * r;
  const BLUES = ["#0a3a94", "#0f4fae", "#1564c4", "#1f7fd6", "#3a9de6", "#5fb9ef", "#95d5f6", "#c4ebfb"];
  const WHITE = "#ffffff";
  // FIJI in bold capitals seven rows high, from x -8, rows 26 to 32.
  const FIJI = [
    "1111101100011011",
    "1100001100011011",
    "1100001100011011",
    "1111001100011011",
    "1100001100011011",
    "1100001101011011",
    "1100001100110011",
  ];
  const PETALS = ["#8c0c2a", "#c8163f", "#ee3d64", "#ff86a2"];
  const STAMEN = { "-1,1": "#f5c02a", "-2,2": "#f5c02a", "-2,3": "#f5c02a", "-3,4": "#ffe066" }; // from the middle of the flower
  const labelAt = (x, dy, z) => {
    if (z === 9) {
      const row = 32 - dy;
      if (row >= 0 && row < 7 && FIJI[row][x + 8] === "1") return WHITE;
      if (dy === 35 && x >= -6 && x <= 5 && hash(x, dy, 4) < 0.7) return WHITE; // "from the islands of"
      if (dy === 23 && x >= -6 && x <= 5 && (x + 6) % 3 !== 2) return "#dff3ff"; // "natural artesian water"
      const [fx, fy] = [x - 3, dy - 15]; // the hibiscus
      const r = Math.hypot(fx, fy);
      const edge = 4.3 + 1.9 * Math.cos(5 * (Math.atan2(fy, fx) - 0.3));
      if (STAMEN[`${fx},${fy}`]) return STAMEN[`${fx},${fy}`];
      if (r <= edge) return PETALS[r < 1.1 ? 0 : r < 2.4 ? 1 : r > edge - 1.1 ? 3 : 2];
    }
    const k = Math.round(((dy - 2) / 39 + (hash(x, dy, z) - 0.5) * 0.12) * (BLUES.length - 1));
    return BLUES[Math.max(0, Math.min(BLUES.length - 1, k))];
  };
  const [WATER, SHINE, DEEP] = ["#a6d8f2", "#eef9ff", "#82c0e8"];
  const clearAt = (x, dy, z) => (z >= 8 && (x === -7 || x === -6) ? SHINE : x >= 8 || dy < 2 ? DEEP : WATER);
  for (let dy = 0; dy <= 70; dy++) {
    const s = Math.min(1, Math.max(0, (dy - 52) / 8));
    const shoulder = [4 + 6 * Math.cos((s * Math.PI) / 2), 3 + s];
    const [half, r] = dy < 2 ? [9.5, 3] : dy < 52 ? [10, 3] : dy <= 60 ? shoulder : dy < 63 ? [3.5, 3.5] : [4.5, 4.5];
    for (let x = -10; x <= 9; x++)
      for (let z = -10; z <= 9; z++) {
        if (!within(x, z, half, r)) continue;
        const y = 125 + dy;
        if (dy >= 63) {
          const rib = Math.floor(((Math.atan2(z + 0.5, x + 0.5) + Math.PI) * 24) / (2 * Math.PI)) % 2;
          label.add(x, y, z, dy === 70 ? "#3a78e6" : rib ? "#1d58cc" : "#1648a8");
        } else if (dy === 61) label.add(x, y, z, "#dce8f2");
        else if (dy >= 2 && dy <= 41) label.add(x, y, z, labelAt(x, dy, z));
        else clear.add(x, y, z, clearAt(x, dy, z));
      }
  }
  finer(label, 8, bottle);
  finer(clear, 8, bottle, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.7 }));
  return { group, glow, flow };
}
