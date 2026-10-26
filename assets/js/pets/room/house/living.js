/*******************************************************************************
 * Downstairs: the living room (the sofa, the coffee table on its rug, the
 * armchair, the TV and the fire), the dining table, and the pets' corner (the
 * cat tree and the collie's bed).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash, cells } from "../../models/voxels.js";
import { sofaCorner } from "../../models/girl-props.js";
import { pick } from "../../stage.js";
import { CHANNELS, HI_RES, drawChannel, drawTvGame } from "../screens.js";
import { DISHES, FRUIT_DISHES, COOKED, buildDish, buildPad, buildRemote, tableware } from "../props.js";
import { X0 } from "./layout.js";
import { COLORS, pixelTexture, solid, place, turned } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildLiving(shared) {
  const { house, mesh, updates, clickables, footprint, turnedFootprint, shadeDay, shadeLit, bedLight, lamps } = shared;
  let now = 0; // the time, for what a visitor clicks
  updates.push((t) => (now = t));

  // The sofa corner (the girl's): the sofa, a floor lamp at one end and a plant at the other.
  const SOFA = [-45, 30];
  const sofaHolder = place(house, new THREE.Group(), [SOFA[0], 0, SOFA[1]]);
  const corner = sofaCorner(sofaHolder, COLORS, 1); // (the lamp at the right end)
  corner.update(1);
  const lamp = corner.lamp;
  const shadeGlow = lamp.shade.material; // unlit: it glows
  const shadeDull = new THREE.MeshLambertMaterial({ vertexColors: true }); // off, it is lit by the room like the rest
  lamp.light.intensity = 0; // (the sofa corner's own flat light: this room has its own, below)
  // The floor lamp's light, from the bulb in its shade: most of it down out of the open bottom, a warm pool on
  // the floor round the end of the sofa, falling off with distance, with the shadows of the sofa, the plant
  // and the coffee table (drawn once as it comes on: room.js); and through the shade a soft warm light all
  // round, over most of the room, fading out towards its edge.
  const BULB = [SOFA[0] + 38, 26, SOFA[1] - 6];
  const floorSpot = new THREE.SpotLight(0xffc27a, 0, 160, 1.3, 0.7, 1);
  floorSpot.position.set(...BULB);
  floorSpot.target.position.set(BULB[0] - 4, 0, BULB[2] + 6);
  floorSpot.castShadow = true;
  floorSpot.shadow.mapSize.set(1024, 1024);
  floorSpot.shadow.camera.near = 2;
  floorSpot.shadow.bias = -0.0005;
  floorSpot.shadow.normalBias = 0.3;
  const floorGlow = new THREE.PointLight(0xffc98a, 0, 130, 0);
  floorGlow.position.set(...BULB);
  house.add(floorSpot, floorSpot.target, floorGlow);
  const floorLight = {
    on: false,
    dirty: false, // its shadows to be drawn again (room.js)
    set(on) {
      if (on && !this.on) this.dirty = true;
      floorSpot.intensity = on ? 40 : 0;
      floorGlow.intensity = on ? 1.1 : 0;
      this.on = on;
    },
  };
  // The lamps, each { set(on) }, clicked on and off.
  lamps.push(
    {
      set(on) {
        floorLight.set(on);
        lamp.shade.material = on ? shadeGlow : shadeDull;
        this.on = on;
      },
    },
    {
      set(on) {
        shadeLit.visible = on;
        shadeDay.visible = !on;
        bedLight.set(on);
        this.on = on;
      },
    }
  );
  lamps.forEach((l) => l.set(false));
  clickables.push({ parts: [lamp.shade], toggle: () => lamps[0].set(!lamps[0].on) });
  clickables.push({ parts: [shadeDay, shadeLit], toggle: () => lamps[1].set(!lamps[1].on) });
  footprint(SOFA[0] - 31, SOFA[0] + 31, SOFA[1] - 9, SOFA[1] + 10);
  footprint(SOFA[0] + 35, SOFA[0] + 41, SOFA[1] - 9, SOFA[1] - 3, false); // the lamp
  footprint(SOFA[0] - 43, SOFA[0] - 35, SOFA[1] - 9, SOFA[1] - 1, false); // the plant

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
  // A mug on top.
  for (let y = 12; y <= 15; y++) ellipsoid(table, [-14, y, -3], [1.7, 0.5, 1.7], y === 15 ? "coffee" : y === 13 ? "mugBlue" : "mug");
  table.add(-12, 14, -3, "mug");
  const tableMesh = place(house, mesh(table), [TABLE[0], 0, TABLE[1]]);
  // In the floor lamp's light: the sofa corner (but its shade, the light is in it) and the table cast shadows,
  // and take them with the rug (the floor too: shell.js).
  sofaHolder.traverse((m) => m.isMesh && m !== lamp.shade && (m.castShadow = m.receiveShadow = true));
  tableMesh.castShadow = tableMesh.receiveShadow = true;
  rugMesh.receiveShadow = true;
  footprint(TABLE[0] - 22, TABLE[0] + 22, TABLE[1] - 10, TABLE[1] + 10);
  // The TV's remote, at the right end of the table: taken up to switch the TV, and put back.
  const remote = place(house, new THREE.Group(), [TABLE[0] + 18, 11.75, TABLE[1] - 2], 1.35);
  remote.add(buildRemote());
  // An unseen box round it, so that it is not too small to click.
  remote.add(new THREE.Mesh(new THREE.BoxGeometry(5, 3, 9), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
  // The laptop's charger: a socket in the floor in front of the rug, its lid flipped up, with the MacBook's
  // white power adapter plugged into it, and the white lead from the top of the adapter across the rug, up
  // over the front of the table to the laptop's MagSafe plug (its light amber while it charges, then green);
  // or, while the laptop is away, to the plug lying on the table where it was.
  const SOCKET = [TABLE[0] + 34, 103];
  const socket = part(); // in half voxels
  box(socket, [-5, 4], [0, 0], [-5, 4], (x, y, z) => (Math.abs(x + 0.5) > 3 || Math.abs(z + 0.5) > 3 ? "steel" : "steelDark"));
  box(socket, [-5, 4], [1, 6], [-6, -6], (x, y) => (y === 6 || Math.abs(x + 0.5) > 4 ? "steelDark" : "steel")); // the lid
  box(socket, [-3, 2], [1, 6], [-1, 1], (x, y, z) => (y === 6 && z === 0 && Math.abs(x + 0.5) < 1 ? "steelDark" : "white")); // the adapter
  box(socket, [-2, 1], [7, 7], [-1, 1], "white"); // its rounded top
  const socketMesh = solid(socket);
  socketMesh.scale.setScalar(0.5);
  place(house, socketMesh, [SOCKET[0], -0.35, SOCKET[1]]);
  footprint(SOCKET[0] - 4, SOCKET[0] + 4, SOCKET[1] - 4, SOCKET[1] + 4, false);
  const [tx, tz] = TABLE;
  const leadMat = new THREE.MeshLambertMaterial({ color: "#f3f3f0" });
  // A lead from the plug at `from`, along the points `via`, to the adapter.
  const lead = (from, via) => {
    const points = [from, ...via].map(([x, y, z]) => new THREE.Vector3(tx + x, y, tz + z));
    points.push(
      ...[
        [SOCKET[0] - 1.5, -0.2, SOCKET[1] - 4],
        [SOCKET[0] - 0.7, 1.6, SOCKET[1] - 2],
        [SOCKET[0] - 0.3, 4.4, SOCKET[1] - 0.8],
        [SOCKET[0] - 0.25, 3.5, SOCKET[1]],
      ].map((v) => new THREE.Vector3(...v))
    );
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    return place(house, new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.26, 6), leadMat), [0, 0, 0]);
  };
  const PORT = [8 + 5.5, 11.75, -1 + 0.9]; // the laptop's left side, near the back (it lies at TABLE + [8, 12, -1], turned 0.2)
  const across = [
    [16.5, 11.75, 4],
    [20.5, 11.75, 8.5],
    [21.6, 11.6, 10.4],
    [22.2, 8, 11.6],
    [22.6, 2, 13],
    [23.6, -0.2, 16],
    [22.8, -0.2, 19.5],
    [25.5, -0.2, 23.5],
    [30.5, -0.2, 26.3],
  ];
  const pluggedLead = lead(PORT, across);
  const looseLead = lead([11, 11.75, 2.5], across);
  // The MagSafe plug: in the laptop's side, its light on; or lying on the table.
  const plugMat = new THREE.MeshLambertMaterial({ color: "#d6d9de" });
  const plug = place(house, new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.7), plugMat), [tx + PORT[0] + 0.5, 11.75, tz + PORT[2]], 0.2);
  const plugLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.3), new THREE.MeshBasicMaterial());
  plugLight.position.set(0.2, 0.28, 0);
  plug.add(plugLight);
  const loosePlug = place(house, new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.7), plugMat), [tx + 10.4, 11.7, tz + 2.2], -0.9);
  let pluggedAt = -Infinity; // charged already
  const charger = {
    // Whether the laptop is home on the table, plugged in.
    set plugged(on) {
      if (on && !pluggedLead.visible) pluggedAt = now;
      pluggedLead.visible = plug.visible = on;
      looseLead.visible = loosePlug.visible = !on;
    },
  };
  pluggedLead.visible = plug.visible = true;
  looseLead.visible = loosePlug.visible = false;
  updates.push((t) => plugLight.material.color.set(t - pluggedAt < 150 ? "#ffab2e" : "#5fdc6a")); // amber while it charges, then green

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
  // On the mantel: a photo of the two of them, the PlayStation 5 lying down and the controllers' charging
  // stand (below), and two candles.
  box(hearth, [-23, -17], [38, 44], [3, 3], (x, y) =>
    x === -23 || x === -17 || y === 38 || y === 44 ? "canvasFrame" : y < 41 ? "melon" : "photoSky"
  );
  const CANDLES = [16, 20];
  for (const x of CANDLES) box(hearth, [x, x + 1], [38, 41 + (x % 3)], [4, 5], "cream");
  const hearthMesh = tvGroup.add(mesh(hearth)).children.at(-1);
  // The PlayStation 5, lying down (in half voxels): the white top and bottom panels, wide at the ends and
  // swept back in the middle to show the black body between them, with two USB ports in front; and its
  // light along the edge of the top panel, blue while it is on.
  const ps5 = part();
  const light = part();
  const edge = (x) => 6 - Math.round(4 * (1 - ((x + 0.5) / 11) ** 2)); // the panels' front edge
  for (let x = -11; x <= 10; x++)
    for (let z = -6; z <= 6; z++) {
      const end = Math.abs(x + 0.5) > 9.5;
      if (z <= edge(x)) ps5.add(x, 0, z, "dsWhite");
      if (z <= 5 && !end)
        for (let y = 1; y <= 3; y++) {
          if (y === 3 && z === edge(x) + 1) light.add(x, y, z, "light");
          else if (y < 3 || z <= edge(x) || z > edge(x) + 1) ps5.add(x, y, z, "dsBlack");
        }
      if (z <= edge(x)) for (let y = 4; y <= 5; y++) ps5.add(x, y, z, y === 5 && z === edge(x) ? "dsShade" : "dsWhite");
    }
  for (const x of [-4, -2]) ps5.add(x, 1, 6, "steelDark");
  const ps5Mesh = solid(ps5);
  const ps5Glow = new THREE.MeshBasicMaterial({ vertexColors: true, color: "#2a2b30" });
  const ps5Light = light.mesh({ light: "#ffffff" });
  ps5Light.material = ps5Glow;
  for (const m of [ps5Mesh, ps5Light]) {
    m.scale.setScalar(0.5);
    place(tvGroup, m, [-9, 37.75, 3]);
  }
  // The charging stand for the two controllers: a white base with a little display, each controller standing
  // in its slot facing the room (`pads`, hidden while in someone's hands), with a light in front of each,
  // amber while it charges after a game and then white.
  const stand = part();
  for (let x = -14; x <= 13; x++)
    for (let z = -3; z <= 3; z++) {
      const r = Math.abs(x + 0.5) - 11.5;
      if (r > 0 && r * r + z * z > 9) continue; // the round ends
      for (let y = 0; y <= 2; y++) stand.add(x, y, z, y === 2 && Math.abs(z) <= 1 && Math.abs(Math.abs(x + 0.5) - 7) < 6 ? "dsBlack" : "dsWhite");
    }
  box(stand, [-2, 1], [1, 2], [4, 4], (x, y) => (y === 2 && x !== -2 ? "dsLight" : "dsBlack")); // the display
  const standMesh = solid(stand);
  standMesh.scale.setScalar(0.5);
  place(tvGroup, standMesh, [5, 37.75, 3]);
  const pads = [-1, 1].map((side) => {
    const holder = place(tvGroup, new THREE.Group(), [5 + side * 3.6, 40.7, 3.1]);
    holder.add(buildPad());
    holder.rotation.set(-Math.PI / 2 + 0.2, Math.PI, 0, "YXZ");
    return holder;
  });
  const padLights = [-1, 1].map((side) =>
    place(tvGroup, new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), new THREE.MeshBasicMaterial()), [5 + side * 3.6, 38.4, 4.85])
  );
  let dockedAt = -Infinity;
  // The candle flames and the fire: lit (unlit material) and flickering.
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const candles = cells(
    CANDLES.map((x) => [x + 0.5, 42 + (x % 3), 4.5, "tin"]),
    COLORS
  );
  candles.material = new THREE.MeshBasicMaterial({ vertexColors: true });
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

  // The TV on the wall over the mantel, its little red light on while it is off.
  const tvBody = part();
  box(tvBody, [-23, 22], [44, 70], [0, 1], (x, y) => (Math.abs(x + 0.5) > 21.5 || y === 44 || y === 70 ? "tvEdge" : "tvBody"));
  const tvMesh = tvGroup.add(mesh(tvBody)).children.at(-1);
  const SCREEN = [42, 24];
  // Texels on the screen per voxel: two, or for the shows drawn finer (HI_RES) four, on a canvas of their own.
  const [screen, screenHi] = [2, 4].map((res) =>
    Object.assign(
      pixelTexture(SCREEN[0] * res, SCREEN[1] * res, () => {}),
      { res }
    )
  );
  const glass = place(tvGroup, new THREE.Mesh(new THREE.PlaneGeometry(...SCREEN), new THREE.MeshBasicMaterial({ map: screen.tex })), [-0.5, 57, 1.6]);
  const standby = place(
    tvGroup,
    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.2), new THREE.MeshBasicMaterial({ color: "#ff3b30" })),
    [17, 44, 1.6]
  );
  const tvLight = new THREE.PointLight(0x9fc8ff, 0, 110, 0);
  tvLight.position.set(0, 57, 18);
  tvGroup.add(tvLight);
  const tvFace = (lx, ly, lz) => {
    const [x, z] = turned(TV.at, TV.turn, [lx, lz]);
    return [x, ly, z];
  };

  // What is on (screens.js): a channel, or the game the two of them play; or it is off, with a gleam on the
  // glass. The two of them put on what they want (`want`, life.js: a show while someone watches, the game
  // while they play); a visitor clicking the TV switches it on or off, and clicking the remote on the table
  // turns to another channel. What a visitor puts on (`user`) stands until the two of them want something
  // else, or one of them puts it right; `poke` is the last thing a visitor did ("on", "off" or "channel"),
  // counted, for them to notice, and `offs` how often it was switched off on them since they put it on.
  const tv = {
    mode: "off",
    want: "off",
    user: null,
    channel: pick(CHANNELS),
    since: 0,
    sky: "sunny",
    poke: { n: 0, what: null, t: -Infinity },
    offs: 0,
  };
  function drawScreen(t) {
    const on = tv.mode === "show" && HI_RES.includes(tv.channel) ? screenHi : screen;
    glass.material.map = on.tex;
    const { g } = on;
    const [w, h] = SCREEN.map((n) => n * on.res);
    if (tv.mode === "off") {
      g.fillStyle = "#20232a";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#3b3f4a";
      for (let k = 0; k < 14; k++) g.fillRect(52 + k, 6 + k, 2, 1);
      for (let k = 0; k < 8; k++) g.fillRect(62 + k, 6 + k, 2, 1);
    } else if (tv.mode === "game") drawTvGame(g, w, h, t);
    else drawChannel(g, w, h, tv.channel, t, t - tv.since, tv.sky);
    on.tex.needsUpdate = true;
  }
  function show(t) {
    const mode = tv.user ?? tv.want;
    if (mode === tv.mode) return;
    tv.mode = mode;
    tv.since = t;
    tvLight.intensity = mode === "off" ? 0 : 0.35;
    tvLight.color.set(mode === "game" ? 0xd8b0ff : 0x9fc8ff);
    standby.visible = mode === "off";
    drawScreen(t);
  }
  const poked = (what, t) => (tv.poke = { n: tv.poke.n + 1, what, t });
  const tvControls = {
    get mode() {
      return tv.mode;
    },
    // Whether what is on is a visitor's doing.
    get meddled() {
      return tv.user !== null;
    },
    get poke() {
      return tv.poke;
    },
    get offs() {
      return tv.offs;
    },
    set sky(sky) {
      tv.sky = sky;
    },
    // What the two of them want on: "off", "show" or "game"; whatever a visitor did is over once that changes.
    want(mode, t) {
      if (mode !== tv.want) {
        tv.want = mode;
        tv.user = null;
        tv.offs = 0;
      }
      show(t);
    },
    // Someone puts right what a visitor did (with the remote, or the controller's PS button).
    restore(t) {
      tv.user = null;
      show(t);
    },
    // Over to the next channel (with the remote), in order, round and round.
    zap(t) {
      tv.channel = CHANNELS[(CHANNELS.indexOf(tv.channel) + 1) % CHANNELS.length];
      tv.since = t;
      drawScreen(t);
    },
    // A visitor clicks the TV: on (to what the two of them were watching or playing, if anything), or off.
    power(t) {
      if (tv.mode === "off") tv.user = tv.want === "off" ? "show" : null;
      else tv.user = tv.want === "off" ? null : "off";
      show(t);
      if (tv.mode === "off" && tv.want !== "off") tv.offs++;
      poked(tv.mode === "off" ? "off" : "on", t);
    },
    // A visitor clicks the remote: on if it is off, else the next channel (in the middle of a game, over from
    // the game to the TV).
    flick(t) {
      if (tv.mode === "off") return tvControls.power(t);
      if (tv.mode === "game") tv.user = "show";
      tvControls.zap(t);
      show(t);
      poked("channel", t);
    },
    // The controllers on their stand (or in someone's hands), and the remote on the table (or in a hand).
    get docked() {
      return pads[0].visible;
    },
    dock(on, t) {
      if (on && !pads[0].visible) dockedAt = t;
      pads.forEach((p) => (p.visible = on));
    },
    get remoteHome() {
      return remote.visible;
    },
    set remoteHome(on) {
      remote.visible = on;
    },
  };
  // Clicked: the TV (its frame or its screen), and the remote while it lies on the table.
  clickables.push({ parts: [tvMesh, glass], toggle: () => tvControls.power(now) });
  clickables.push({ parts: [remote], toggle: () => remote.visible && tvControls.flick(now) });
  // The fireplace (or the fire in it): lit, it burns as long as one they light (acts/living.js lightFire);
  // burning, it goes out, and the pets lying by it get up.
  clickables.push({
    parts: [hearthMesh, ...flames, embers],
    toggle: () => {
      fire.lit = !fire.lit;
      fire.until = now + 200 + Math.random() * 120;
    },
  });
  let screenAt = -1;
  updates.push((t) => {
    // Redraw at about 12 frames a second: plenty for pixel art on a small screen.
    if (tv.mode !== "off" && t - screenAt > 0.08) {
      drawScreen(t);
      screenAt = t;
      tvLight.intensity = 0.35 + 0.1 * Math.sin(t * 5) * Math.sin(t * 1.7);
    }
    ps5Glow.color.set(tv.want === "game" ? "#8fd6ff" : "#2a2b30"); // the console is on while they play
    padLights.forEach((m) => {
      m.visible = pads[0].visible;
      m.material.color.set(t - dockedAt < 120 ? "#ffab2e" : "#f4f6ff");
    });
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
  // Three little pillar candles on a round wooden tray at the other end of the table, clear of the places and
  // the dishes: lit at night, each flame flickering in its own time, a warm glow on the table round them.
  const candleSet = part(); // (half voxels, shown at half size)
  ellipsoid(candleSet, [0, 0, 0], [6.5, 0.5, 6.5], "woodMid");
  const WICKS = [
    [-2.5, 12, -1.5],
    [2.5, 9, -1],
    [0, 6, 2.5],
  ];
  for (const [x, h, z] of WICKS) {
    for (let y = 1; y <= h; y++) ellipsoid(candleSet, [x, y, z], [1.7, 0.5, 1.7], y === h ? "white" : "cream");
    candleSet.add(Math.round(x), h + 1, Math.round(z), "frameShade"); // the wick
  }
  const CANDLE_AT = [DINING[0] + 19, 14, DINING[1] + 3];
  place(house, mesh(candleSet), CANDLE_AT).scale.setScalar(0.5);
  const tableFlames = WICKS.map(([x, h, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), new THREE.MeshBasicMaterial({ color: 0xffc35a }));
    m.geometry.translate(0, 0.7, 0); // (flickering up from its foot)
    m.position.set(CANDLE_AT[0] + x / 2, CANDLE_AT[1] + (h + 1.5) / 2, CANDLE_AT[2] + z / 2);
    house.add(m);
    return m;
  });
  const candleLight = new THREE.PointLight(0xffb060, 0, 45, 2);
  candleLight.position.set(CANDLE_AT[0], CANDLE_AT[1] + 9, CANDLE_AT[2]);
  house.add(candleLight);
  updates.push((t) => {
    tableFlames.forEach((m, i) => {
      m.visible = shared.night;
      m.scale.set(1, 0.85 + 0.25 * Math.sin(t * (9 + i * 2.3) + i) * Math.sin(t * (5.1 + i)), 1);
    });
    candleLight.intensity = shared.night ? 26 * (0.9 + 0.1 * Math.sin(t * 11) * Math.sin(t * 6.7)) : 0;
  });
  const tableDish = place(house, new THREE.Group(), [DINING[0], 14.5, DINING[1] + 1]);
  const tableDishes = Object.fromEntries([...DISHES, ...FRUIT_DISHES].map((kind) => [kind, place(tableDish, buildDish(kind), [0, 0, 0])]));
  // What is on the table (props.js's DISHES or FRUIT_DISHES), or nothing; of the fruit, `left` pieces; and
  // whether it is hot from the oven (it steams).
  // And the bowls and chopsticks laid at each place (`laid`: the seats', "dine0" and "dine1"), and what was
  // cooked on the hob to go with the rice (`cooked`: props.js's COOKED, steaming), side by side.
  const dinner = { dish: null, left: 0, hot: false, laid: new Set(), cooked: [] };
  const cookedDishes = Object.fromEntries(COOKED.map((kind) => [kind, place(tableDish, buildDish(kind), [0, 0, 0])]));
  const settings = ["dine0", "dine1"].map((key, i) => {
    const m = mesh(tableware(part(), [0, 0, 0]));
    place(house, m, [DINING[0] + (i ? PLACE : -PLACE), 14.3, DINING[1] + NEAR + 5]);
    return [key, m];
  });
  updates.push((t) => {
    Object.entries(tableDishes).forEach(([kind, m]) => {
      m.visible = dinner.dish === kind;
      m.userData.pieces?.forEach((piece, k) => (piece.visible = k < dinner.left));
      m.userData.steam?.(t, m.visible && dinner.hot);
    });
    settings.forEach(([key, m]) => (m.visible = dinner.laid.has(key)));
    Object.entries(cookedDishes).forEach(([kind, m]) => {
      const i = dinner.cooked.indexOf(kind);
      m.visible = i >= 0;
      m.position.x = dinner.cooked.length > 1 ? (i ? 6 : -6) : 0;
      m.userData.steam(t, m.visible);
    });
  });
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

  return { SOFA, ARMCHAIR, TABLE, floorLight, charger, TV, fire, tvFace, tvControls, drawScreen, DINING, PLACE, dinner, DINE_Z, TREE, DOGBED };
}
