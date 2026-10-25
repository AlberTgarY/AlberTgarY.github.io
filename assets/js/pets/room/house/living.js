/*******************************************************************************
 * Downstairs: the living room (the sofa, the coffee table on its rug, the
 * armchair, the TV and the fire), the dining table, and the pets' corner (the
 * cat tree and the collie's bed).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, cells } from "../../models/voxels.js";
import { sofaCorner } from "../../models/girl-props.js";
import { pick } from "../../stage.js";
import { CHANNELS, drawChannel, drawTvGame } from "../screens.js";
import { DISHES, FRUIT_DISHES, buildDish } from "../props.js";
import { X0 } from "./layout.js";
import { COLORS, pixelTexture, solid, place, turned } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildLiving(shared) {
  const { house, mesh, updates, clickables, footprint, turnedFootprint, shadeDay, shadeLit, bedLamp, lamps } = shared;

  // The sofa corner (the girl's): the sofa, a floor lamp at one end and a plant at the other.
  const SOFA = [-45, 30];
  const sofaHolder = place(house, new THREE.Group(), [SOFA[0], 0, SOFA[1]]);
  const corner = sofaCorner(sofaHolder, COLORS);
  corner.update(1);
  const lamp = corner.lamp;
  const shadeColor = lamp.shade.material.color.clone();
  lamp.light.distance = 130;
  // The lamps, each { set(on) }, clicked on and off.
  lamps.push(
    {
      set(on) {
        lamp.light.intensity = on ? 1.3 : 0; // dimmed, not hidden, so that the lights in the room stay the same
        lamp.shade.material.color.copy(shadeColor).multiplyScalar(on ? 1 : 0.85);
        this.on = on;
      },
    },
    {
      set(on) {
        shadeLit.visible = on;
        shadeDay.visible = !on;
        bedLamp.intensity = on ? 1 : 0;
        this.on = on;
      },
    }
  );
  lamps.forEach((l) => l.set(false));
  clickables.push({ parts: [lamp.shade], toggle: () => lamps[0].set(!lamps[0].on) });
  clickables.push({ parts: [shadeDay, shadeLit], toggle: () => lamps[1].set(!lamps[1].on) });
  footprint(SOFA[0] - 31, SOFA[0] + 31, SOFA[1] - 9, SOFA[1] + 10);
  footprint(SOFA[0] - 41, SOFA[0] - 35, SOFA[1] - 9, SOFA[1] - 3, false);
  footprint(SOFA[0] + 35, SOFA[0] + 43, SOFA[1] - 9, SOFA[1] - 1, false);

  const ARMCHAIR = [40, 50];
  const armchair = part();
  for (const x of [-11, 10]) for (const z of [-8, 8]) box(armchair, [x, x + 1], [0, 1], [z, z], "sofaLeg");
  box(armchair, [-12, 12], [2, 5], [-9, 9], (x, y) => (y === 2 ? "sofaShade" : "sofa"));
  ellipsoid(armchair, [0, 14, -7.5], [12.5, 9, 1.8], "sofa", [], 6);
  for (const side of [-1, 1]) ellipsoid(armchair, [side * 12, 10, 0], [2.8, 5, 9.2], "sofa", [], 4);
  box(armchair, [-9, 9], [6, 9], [-5, 9], (x, y, z) => (z === 9 || y === 6 ? "sofaShade" : "cushion"));
  ellipsoid(armchair, [0, 15, -4.5], [8.5, 5, 1.6], "cushion", [], 4);
  ellipsoid(armchair, [6, 13, -2], [3.5, 3.5, 1.4], (x, y) => ((x + y) % 2 ? "throw" : "throwRow"), [], 3); // a knitted cushion
  place(house, mesh(armchair), [ARMCHAIR[0], 0, ARMCHAIR[1]]);
  footprint(ARMCHAIR[0] - 14, ARMCHAIR[0] + 14, ARMCHAIR[1] - 10, ARMCHAIR[1] + 10);

  const TABLE = [-45, 72];
  const rug = pixelTexture(124, 54, (g, w, h) => {
    g.fillStyle = "#f2e4c9";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#c9765a";
    g.fillRect(2, 2, w - 4, h - 4);
    g.fillStyle = "#f2e4c9";
    g.fillRect(5, 5, w - 10, h - 10);
    g.fillStyle = "#e0b04f";
    g.fillRect(7, 7, w - 14, 1);
    g.fillRect(7, h - 8, w - 14, 1);
    g.fillRect(7, 7, 1, h - 14);
    g.fillRect(w - 8, 7, 1, h - 14);
    for (let cx = 18; cx < w - 10; cx += 22)
      for (let y = -6; y <= 6; y++)
        for (let x = -6; x <= 6; x++) {
          const d = Math.abs(x) + Math.abs(y);
          if (d === 6 || d === 3) {
            g.fillStyle = d === 6 ? "#d99a7a" : "#c9765a";
            g.fillRect(cx + x, h / 2 + y, 1, 1);
          }
        }
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = "#e6d3b0"; // the fringe
      g.fillRect(x, 0, 1, 1);
      g.fillRect(x, h - 1, 1, 1);
    }
  });
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(124, 54), new THREE.MeshLambertMaterial({ map: rug.tex }));
  rugMesh.rotation.x = -Math.PI / 2;
  place(house, rugMesh, [TABLE[0], -0.47, TABLE[1] - 2]);

  const table = part();
  box(table, [-22, 21], [10, 11], [-10, 9], (x, y, z) => (y === 10 || z === 9 || Math.abs(x + 0.5) > 21 ? "woodMid" : "woodLight"));
  for (const x of [-21, 19]) for (const z of [-9, 7]) box(table, [x, x + 1], [0, 9], [z, z + 1], "woodMid");
  box(table, [-20, 19], [3, 3], [-8, 7], "woodMid"); // the shelf underneath, with magazines
  box(table, [-16, -6], [4, 4], [-5, 3], "magazine");
  box(table, [-13, -3], [5, 5], [-4, 4], "magazine2");
  // A mug and the remote on top.
  for (let y = 12; y <= 15; y++) ellipsoid(table, [-14, y, -3], [1.7, 0.5, 1.7], y === 15 ? "coffee" : y === 13 ? "mugBlue" : "mug");
  table.add(-12, 14, -3, "mug");
  box(table, [-6, -2], [12, 12], [3, 4], "remote");
  place(house, mesh(table), [TABLE[0], 0, TABLE[1]]);
  footprint(TABLE[0] - 22, TABLE[0] + 22, TABLE[1] - 10, TABLE[1] + 10);
  // The laptop's charger: a white power strip on the rug by the table, its light on, and the lead from it up
  // over the table's edge to the laptop; or, while the laptop is away, to its plug lying on the table.
  const strip = part();
  box(strip, [28, 33], [0, 0], [-5, -4], (x, y, z) => (x === 33 && z === -4 ? "padRed" : x === 29 && z === -4 ? "remote" : "white"));
  place(house, mesh(strip), [TABLE[0], 0, TABLE[1]]);
  const lead = (from) => {
    const cells = [];
    const along = (a, b, n) => {
      for (let k = 0; k <= n; k++) cells.push(a.map((v, i) => v + ((b[i] - v) * k) / n));
    };
    along([from, 11.8, -1], [21.8, 11.8, -1], Math.round((21.8 - from) * 2));
    for (let k = 1; k <= 24; k++) {
      const s = k / 24; // over the edge and down, curving out a little
      cells.push([21.8 + 2.2 * Math.sin(s * Math.PI * 0.5), 11.8 * (1 - s) + 0.3 * s, -1 - s * 0.5]);
    }
    along([24, 0.3, -1.5], [29, 0.3, -4], 12);
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: "#2d2f36" }), cells.length);
    cells.forEach((c, i) => m.setMatrixAt(i, new THREE.Matrix4().makeTranslation(...c)));
    return place(house, m, [TABLE[0], 0, TABLE[1]]);
  };
  const plugged = lead(13.5);
  const loose = lead(16);
  const plugHead = place(house, new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1), new THREE.MeshLambertMaterial({ color: "#2d2f36" })), [
    TABLE[0] + 15.3,
    11.9,
    TABLE[1] - 1,
  ]);
  const charger = {
    // Whether the laptop is home on the table, plugged in.
    set plugged(on) {
      plugged.visible = on;
      loose.visible = plugHead.visible = !on;
    },
  };
  charger.plugged = true;

  // The fireplace on the left wall, built facing +z and turned to face the room: a red brick surround round
  // a sooty firebox with logs on a grate, a wooden mantel with the games console, the two controllers, a
  // photo and two candles on it, and a stone hearth in front; a basket of logs beside it. The TV hangs on
  // the wall over the mantel.
  const TV = { at: [-150, 70], turn: Math.PI / 2 };
  const tvGroup = place(house, new THREE.Group(), [TV.at[0], 0, TV.at[1]], TV.turn);
  const hearth = part();
  const brick = (x, y) => {
    const row = Math.floor(y / 3);
    const u = x + 22 + (row % 2) * 3;
    if (y % 3 === 2 || u % 6 === 0) return "mortar";
    return hash(Math.floor(u / 6), row, 3) < 0.35 ? "brickDark" : "brick";
  };
  const FIREBOX = { has: (x, y, z) => x >= -11 && x <= 10 && y >= 2 && y <= 21 && z >= 2 };
  box(hearth, [-22, 21], [0, 35], [0, 7], (x, y) => (x >= -11 && x <= 10 && y >= 2 && y <= 21 ? "soot" : brick(x, y)), [FIREBOX]);
  for (let x = -12; x <= 11; x++) hearth.add(x, 22, 7, "brickDark"); // the lintel's edge
  box(hearth, [-24, 23], [36, 37], [-1, 9], (x, y) => (y === 36 ? "woodDeep" : "woodMid")); // the mantel
  box(hearth, [-24, 23], [0, 1], [8, 17], (x, y, z) => ((x + z) % 7 === 0 ? "stoneDark" : "stone")); // the hearth stone
  for (const x of [-8, 7]) box(hearth, [x, x], [2, 3], [3, 6], "steelDark"); // the grate
  box(hearth, [-9, 8], [3, 3], [3, 6], "steelDark");
  // The logs, charred underneath, and the ash below them; here and there along the bottom of a log and in
  // the ash, an ember (drawn glowing, below).
  const logs = part();
  for (const [z, y] of [
    [4, 5],
    [5.5, 7],
  ])
    for (let x = -7; x <= 6; x++)
      ellipsoid(logs, [x, y, z], [0.5, 1.4, 1.4], (xx, yy) => (x === -7 || x === 6 ? "logEnd" : yy < y ? "logChar" : "log"));
  for (let x = -10; x <= 9; x++) for (let z = 2; z <= 6; z++) if (!hearth.has(x, 2, z)) logs.add(x, 2, z, "ash");
  const emberList = logs.list().filter(([x, y, z, c]) => (c === "logChar" || c === "ash") && hash(x, y + 40, z) < (c === "ash" ? 0.3 : 0.4));
  emberList.forEach((v) => (v[3] = hash(v[0], v[2], 9) < 0.5 ? "ember" : "emberDeep"));
  logs.list().forEach(([x, y, z, c]) => !emberList.some((e) => e[0] === x && e[1] === y && e[2] === z) && hearth.add(x, y, z, c));
  // On the mantel: the games console, a photo of the two of them, and two candles.
  box(hearth, [-5, 4], [38, 39], [1, 6], "console");
  box(hearth, [-4, 3], [39, 39], [7, 7], "steelDark");
  box(hearth, [-20, -13], [38, 45], [2, 2], (x, y) =>
    x === -20 || x === -13 || y === 38 || y === 45 ? "canvasFrame" : y < 41 ? "melon" : "photoSky"
  );
  for (const x of [14, 18]) box(hearth, [x, x + 1], [38, 41 + (x % 3)], [4, 5], "cream");
  tvGroup.add(mesh(hearth));
  // The candle flames and the fire: lit (unlit material) and flickering.
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const candles = cells(
    [
      [14.5, 44, 4.5, "tin"],
      [18.5, 42, 4.5, "tin"],
    ],
    COLORS
  );
  candles.material = new THREE.MeshBasicMaterial();
  tvGroup.add(candles);
  // The fire, in frames shown in random turn: tongues of flame of different heights rising from between and
  // behind the logs, leaning one way or the other as they go up, white-hot at the root and yellow, orange
  // and then red towards the tips, thicker where hottest; now and then a loose flicker over a tip.
  const FLAME_FRAMES = 8;
  const flames = Array.from({ length: FLAME_FRAMES }, (_, f) => {
    const p = part();
    const tongues = [-6, -2, 2, 6].map((x, k) => ({
      x: x + 2 * (hash(k, f, 11) - 0.5),
      h: (k === 0 || k === 3 ? 6 : 8) + 5 * hash(k, f, 12),
      w: 2.4 + 1.2 * hash(k, f, 13),
      lean: 4 * (hash(k, f, 14) - 0.5),
    }));
    for (let x = -10; x <= 9; x++)
      for (let y = 0; y < 14; y++) {
        let heat = 0;
        let tip = 0; // how far up its tongue, for the hottest
        for (const t of tongues) {
          const u = y / t.h;
          const d = u < 1 ? 1 - Math.abs(x - t.x - t.lean * u * u) / (t.w * (1 - u) ** 0.5) : 0;
          if (d * (1 - 0.75 * u) > heat) [heat, tip] = [d * (1 - 0.75 * u), u];
        }
        if (heat <= 0) continue;
        const color = heat > 0.6 ? "fireCore" : heat > 0.38 ? "fireYellow" : tip > 0.6 && heat < 0.15 ? "fireRed" : "fireOrange";
        const depth = heat > 0.42 ? 2 : 1;
        for (let z = 5 - depth; z <= 4 + depth; z++) if (!logs.has(x, 4 + y, z)) p.add(x, 4 + y, z, color);
      }
    tongues.forEach((t, k) => {
      if (hash(k, f, 15) < 0.4) p.add(Math.round(t.x + t.lean), 4 + Math.round(t.h) + 1, 4, "fireRed");
    });
    const m = solid(p, COLORS, flameMat);
    m.visible = false;
    tvGroup.add(m);
    return m;
  });
  // The embers, glowing with the fire and going dark once it is out; and the glow of the fire on the back
  // of the firebox, brightest low in the middle.
  const emberMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const embers = solid(
    (() => {
      const p = part();
      emberList.forEach((v) => p.add(...v));
      return p;
    })(),
    COLORS,
    emberMat
  );
  tvGroup.add(embers);
  const backGlow = pixelTexture(22, 20, (g, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const r = Math.hypot((x + 0.5 - w / 2) / (w / 2), (h - y - 0.5) / h);
        g.fillStyle = `rgba(255, 120, 40, ${Math.max(0, 0.75 * (1 - r)).toFixed(2)})`;
        g.fillRect(x, y, 1, 1);
      }
  });
  const glowMat = new THREE.MeshBasicMaterial({ map: backGlow.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const fireGlow = new THREE.Mesh(new THREE.PlaneGeometry(22, 20), glowMat);
  fireGlow.position.set(-0.5, 11.5, 1.55);
  tvGroup.add(fireGlow);
  const fireLight = new THREE.PointLight(0xff9a4a, 0, 120, 0);
  fireLight.position.set(0, 14, 22);
  tvGroup.add(fireLight);
  turnedFootprint(TV.at, TV.turn, [-24, 23, 0, 17]);
  const logBasket = part();
  for (let y = 0; y <= 7; y++)
    ellipsoid(logBasket, [0, y, 0], [5.5, 0.5, 4.5], (x, yy, z) => ((x + y + z) % 2 ? "wicker" : "wickerDark"), [
      { has: (x, yy, z) => y >= 2 && (x / 4.2) ** 2 + (z / 3.2) ** 2 < 1 },
    ]);
  for (const [z, y] of [
    [-1.5, 4],
    [1.5, 4],
    [0, 6],
  ])
    for (let x = -5; x <= 5; x++) ellipsoid(logBasket, [x, y, z], [0.5, 1.3, 1.3], Math.abs(x) === 5 ? "logEnd" : "log");
  place(house, mesh(logBasket), [X0 + 8, 0, 103], Math.PI / 2);
  footprint(X0, X0 + 15, 96, 110);
  // The fire, once lit, burns for a while, then dies down.
  const fire = { lit: false, until: 0, k: 0 };
  let flameAt = 0;
  let frame = 0;
  updates.push((t, dt) => {
    if (fire.lit && t > fire.until) fire.lit = false;
    fire.k += ((fire.lit ? 1 : 0) - fire.k) * (1 - Math.exp(-1.5 * dt));
    if (t > flameAt) {
      frame = (frame + 1 + Math.floor(Math.random() * (FLAME_FRAMES - 1))) % FLAME_FRAMES;
      flameAt = t + 0.08 + Math.random() * 0.08;
    }
    flames.forEach((m, i) => {
      m.visible = fire.k > 0.05 && i === frame;
      m.scale.y = Math.max(0.2, fire.k);
    });
    const flicker = 0.9 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
    fireLight.intensity = fire.k * flicker;
    emberMat.color.setScalar(0.12 + 0.88 * Math.min(1, 1.5 * fire.k) * (0.85 + 0.15 * Math.sin(t * 5.1 + Math.sin(t * 1.7))));
    fireGlow.visible = fire.k > 0.02;
    glowMat.opacity = fire.k * flicker;
    candles.visible = shared.night;
  });

  // The TV on the wall over the mantel.
  const tvBody = part();
  box(tvBody, [-23, 22], [44, 70], [0, 1], (x, y) => (Math.abs(x + 0.5) > 21.5 || y === 44 || y === 70 ? "tvEdge" : "tvBody"));
  tvGroup.add(mesh(tvBody));
  const SCREEN = [42, 24];
  const screen = pixelTexture(...SCREEN, () => {});
  place(tvGroup, new THREE.Mesh(new THREE.PlaneGeometry(...SCREEN), new THREE.MeshBasicMaterial({ map: screen.tex })), [-0.5, 57, 1.6]);
  const tvLight = new THREE.PointLight(0x9fc8ff, 0, 110, 0);
  tvLight.position.set(0, 57, 18);
  tvGroup.add(tvLight);
  // The controllers rest on the mantel until someone picks them up.
  const padsOnStand = [-1, 1].map((side) => {
    const p = cells(
      [
        [-2, 0, 0, "pad"],
        [-1, 0, 0, "pad"],
        [0, 0, 0, "pad"],
        [1, 0, 0, "pad"],
        [2, 0, 0, "pad"],
        [-2, 0, 1, "pad"],
        [2, 0, 1, "pad"],
        [1, 1, 0, "padRed"],
      ],
      COLORS
    );
    return place(tvGroup, p, [side * 9, 38, 6]);
  });
  const tvFace = (lx, ly, lz) => {
    const [x, z] = turned(TV.at, TV.turn, [lx, lz]);
    return [x, ly, z];
  };

  // What is on (screens.js): the channels, one after another as they flick through, or the game the two of
  // them play; or it is off, with a gleam on the glass.
  const tv = { mode: "off", channel: "nature", since: 0, sky: "sunny" };
  function drawScreen(t) {
    const { g } = screen;
    const [w, h] = SCREEN;
    if (tv.mode === "off") {
      g.fillStyle = "#20232a";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#3b3f4a";
      for (let k = 0; k < 7; k++) g.fillRect(26 + k, 3 + k, 1, 1);
      for (let k = 0; k < 4; k++) g.fillRect(31 + k, 3 + k, 1, 1);
    } else if (tv.mode === "game") drawTvGame(g, w, h, t);
    else drawChannel(g, w, h, tv.channel, t, t - tv.since, tv.sky);
    screen.tex.needsUpdate = true;
  }
  let screenAt = -1;
  updates.push((t) => {
    // Redraw at about 12 frames a second: plenty for pixel art on a small screen.
    if (tv.mode !== "off" && t - screenAt > 0.08) {
      if (tv.mode === "show" && t - tv.since > 12) {
        tv.channel = pick(CHANNELS.filter((c) => c !== tv.channel));
        tv.since = t;
      }
      drawScreen(t);
      screenAt = t;
      tvLight.intensity = 0.35 + 0.1 * Math.sin(t * 5) * Math.sin(t * 1.7);
    }
  });

  /* ---------- the dining table ---------- */
  // A table for two with a cloth runner, a jug of flowers at one end and two places laid, and two chairs on
  // the far side, so the two of them sit facing the room. A dish from the oven goes in the middle.
  const DINING = [62, 92];
  const HALF = 25; // half its length
  const [NEAR, FAR] = [-11, 12]; // its depth: the edge by the chairs, and the front edge
  const PLACE = 13; // each place, and its chair, either side of the middle
  const dining = part();
  box(dining, [-HALF, HALF - 1], [12, 13], [NEAR, FAR], (x, y, z) =>
    y === 13 && Math.abs(z - 0.5) <= 5.5 ? (x % 4 === 0 ? "frameShade" : "frame") : y === 12 || z === FAR ? "woodMid" : "woodLight"
  );
  for (const x of [1 - HALF, HALF - 3]) for (const z of [NEAR + 1, FAR - 2]) box(dining, [x, x + 1], [0, 11], [z, z + 1], "woodMid");
  for (const x of [-PLACE, PLACE])
    ellipsoid(dining, [x, 14, NEAR + 5], [3, 0.5, 2.5], (vx, vy, vz) => ((vx - x) ** 2 + (vz - NEAR - 5) ** 2 > 3 ? "chinaBlue" : "china"));
  const JUG = 5 - HALF;
  for (let y = 14; y <= 18; y++) ellipsoid(dining, [JUG, y, 5], [1.6, 0.5, 1.6], y === 18 ? "glass" : "mugBlue");
  [
    [JUG - 1, 20, 5, "red"],
    [JUG + 1, 21, 5, "yellow"],
    [JUG, 22, 6, "pink"],
    [JUG, 20, 4, "leaf"],
  ].forEach(([x, y, z, c]) => ellipsoid(dining, [x, y, z], [1.2, 1.2, 1.2], c));
  place(house, mesh(dining), [DINING[0], 0, DINING[1]]);
  footprint(DINING[0] - HALF, DINING[0] + HALF, DINING[1] + NEAR, DINING[1] + FAR);
  const tableDish = place(house, new THREE.Group(), [DINING[0], 14.5, DINING[1] + 1]);
  const tableDishes = Object.fromEntries([...DISHES, ...FRUIT_DISHES].map((kind) => [kind, place(tableDish, buildDish(kind), [0, 0, 0])]));
  // What is on the table (props.js's DISHES or FRUIT_DISHES), or nothing; of the fruit, `left` pieces.
  const dinner = { dish: null, left: 0 };
  updates.push(() =>
    Object.entries(tableDishes).forEach(([kind, m]) => {
      m.visible = dinner.dish === kind;
      m.userData.pieces?.forEach((piece, k) => (piece.visible = k < dinner.left));
    })
  );
  const DINE_Z = DINING[1] - 17;
  const diningChair = part();
  box(diningChair, [-5, 5], [7, 8], [-4, 4], (x, y) => (y === 8 ? "woodLight" : "woodMid"));
  for (const x of [-5, 4]) for (const z of [-4, 3]) box(diningChair, [x, x + 1], [0, 6], [z, z + 1], "woodMid");
  box(diningChair, [-5, 5], [9, 19], [-5, -5], (x, y) => (y === 19 || Math.abs(x) === 5 || y === 14 ? "woodMid" : "woodLight"));
  for (const x of [-PLACE, PLACE]) {
    place(house, mesh(diningChair), [DINING[0] + x, 0, DINE_Z]);
    footprint(DINING[0] + x - 6, DINING[0] + x + 6, DINE_Z - 6, DINE_Z + 5);
  }

  /* ---------- the pets' corner: the cat tree and the collie's bed ---------- */
  // A cat tree: a base, a sisal post, two carpeted platforms and a round bed on top, and a toy mouse
  // swinging on a string.
  const TREE = [122, 82];
  const tree = part();
  box(tree, [-14, 13], [0, 1], [-13, 12], "carpetDark");
  const sisal = (x, y) => (y % 2 ? "sisal" : "sisalDark");
  for (let y = 2; y <= 43; y++) ellipsoid(tree, [-1, y, -3], [2.2, 0.5, 2.2], sisal);
  for (let y = 2; y <= 13; y++) ellipsoid(tree, [6, y, 5], [1.6, 0.5, 1.6], sisal);
  ellipsoid(tree, [5, 14.5, 5], [8, 1, 7], "carpet");
  ellipsoid(tree, [-6, 29.5, 1], [7, 1, 6], "carpet");
  ellipsoid(tree, [0, 44.5, -4], [8.5, 1, 7.5], "carpet");
  for (let y = 46; y <= 47; y++)
    for (let x = -9; x <= 9; x++)
      for (let z = -12; z <= 4; z++) {
        const r = (x / 8.5) ** 2 + ((z + 4) / 7.5) ** 2;
        if (r <= 1 && r > 0.55) tree.add(x, y, z, "carpetDark");
      }
  ellipsoid(tree, [0, 45.5, -4], [5.5, 0.5, 4.5], "treeCushion");
  const treeGroup = place(house, new THREE.Group(), [TREE[0], 0, TREE[1]]);
  treeGroup.add(mesh(tree));
  const toy = pivotGroup(treeGroup, [-12, 29, 1]);
  const toyPart = part();
  for (let y = 21; y <= 28; y++) toyPart.add(-12, y, 1, "bulbWire");
  ellipsoid(toyPart, [-12, 19, 1], [1.5, 1.4, 2.2], "mouse");
  toyPart.add(-12, 20, 3, "earPink");
  toy.inner.add(mesh(toyPart));
  updates.push((t) => (toy.outer.rotation.z = 0.25 * Math.sin(t * 1.6) * Math.sin(t * 0.37)));
  footprint(TREE[0] - 14, TREE[0] + 14, TREE[1] - 13, TREE[1] + 13);

  // The collie's bed: a round blue cushion with a raised rim, and her bone beside it.
  const DOGBED = [100, 4];
  const dogBed = part();
  for (let y = 0; y <= 5; y++)
    for (let x = -17; x <= 17; x++)
      for (let z = -12; z <= 12; z++) {
        const out = (x / 17) ** 2 + (z / 12) ** 2;
        const rim = out <= 1 && (x / 12.5) ** 2 + (z / 8) ** 2 > 1;
        if (rim && y <= 5 - Math.max(0, z / 4)) dogBed.add(x, y, z, y >= 4 ? "bedBlueLight" : "bedBlue"); // lower at the front
        else if (out <= 1 && y <= 2) dogBed.add(x, y, z, "bedCream");
      }
  [
    [19, 9],
    [20, 9],
    [21, 9],
    [18, 8],
    [18, 10],
    [22, 8],
    [22, 10],
  ].forEach(([x, z]) => dogBed.add(x, 0, z, "bone"));
  place(house, mesh(dogBed), [DOGBED[0], 0, DOGBED[1]]);
  footprint(DOGBED[0] - 17, DOGBED[0] + 17, DOGBED[1] - 12, DOGBED[1] + 12);

  return { SOFA, ARMCHAIR, TABLE, charger, TV, fire, tvLight, padsOnStand, tvFace, tv, drawScreen, DINING, PLACE, dinner, DINE_Z, TREE, DOGBED };
}
