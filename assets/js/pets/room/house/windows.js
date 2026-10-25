/*******************************************************************************
 * The windows (each with its own view: views.js), their curtains, the sky
 * outside them, and the front door.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, hash } from "../../models/voxels.js";
import { makeViews } from "../views.js";
import { X0, BACK, DOOR } from "./layout.js";
import { COLORS, pixelTexture, place } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildWindows(shared) {
  const { house, mesh, updates, clickables, WIN_BACK, WIN_LEFT, DOOR_X } = shared;

  // The sky outside: blue with drifting clouds and the odd bird by day, deep blue with stars and the moon
  // by night. Each window shows its own patch of it, the sun or the moon only in the one over the bed, and
  // its own view in front of the clouds (views.js): rolling hills with a cottage beyond the bed, the street
  // past the kitchen. On a cloudy day more clouds come over, greyer, hiding the sun.
  const SKY = [44, 46];
  const skies = [0, 1].map(() => pixelTexture(...SKY, () => {})); // the back window's, the left one's
  const clouds = pixelTexture(SKY[0] * 2, SKY[1], () => {});
  clouds.tex.wrapS = THREE.RepeatWrapping;
  clouds.tex.repeat.set(0.5, 1);
  const cloudMat = new THREE.MeshBasicMaterial({ map: clouds.tex, transparent: true, depthWrite: false });
  // In the rain, a grey veil over it with streaks of rain running down (scrolled as it falls).
  const RAIN_COLORS = ["rgba(205, 220, 232, 0.85)", "rgba(170, 190, 208, 0.7)"];
  const drawRain = (g, w, h) => {
    g.fillStyle = "rgba(120, 132, 146, 0.42)";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 26; i++) {
      const [x, y] = [Math.floor(hash(i, w, 31) * w), Math.floor(hash(i, h, 32) * h)];
      g.fillStyle = RAIN_COLORS[i % 2];
      g.fillRect(x, y, 1, 2 + (i % 3));
    }
  };
  const rainVeil = pixelTexture(...SKY, drawRain);
  rainVeil.tex.wrapS = rainVeil.tex.wrapT = THREE.RepeatWrapping;
  const rainMat = new THREE.MeshBasicMaterial({ map: rainVeil.tex, transparent: true, opacity: 0, depthWrite: false });
  // What each window looks out on (views.js), and the light from the street coming in at the left one.
  const streetGlow = new THREE.PointLight(0xffffff, 0, 80, 0);
  streetGlow.position.set(X0 + 8, (WIN_LEFT.y[0] + WIN_LEFT.y[1]) / 2, (WIN_LEFT.z[0] + WIN_LEFT.z[1]) / 2);
  house.add(streetGlow);
  const views = makeViews(
    [
      [WIN_BACK.x[1] - WIN_BACK.x[0] + 1, WIN_BACK.y[1] - WIN_BACK.y[0] + 1],
      [WIN_LEFT.z[1] - WIN_LEFT.z[0] + 1, WIN_LEFT.y[1] - WIN_LEFT.y[0] + 1],
    ],
    SKY,
    streetGlow
  );
  updates.push((t, dt) => views.update(t, dt));
  // A pane of sky `w` x `h` voxels, showing that much of it, and of `view` in front of it.
  function skyPane(sky, view, w, h, at, rotY) {
    for (const [mat, lift] of [
      [new THREE.MeshBasicMaterial({ map: sky.tex }), 0],
      [cloudMat, 0.1],
      [new THREE.MeshBasicMaterial({ map: view, transparent: true, depthWrite: false }), 0.15],
      [rainMat, 0.2],
    ]) {
      const g = new THREE.PlaneGeometry(w, h);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / SKY[0], 1 - ((1 - uv.getY(i)) * h) / SKY[1]);
      const m = place(house, new THREE.Mesh(g, mat), at, rotY);
      m.translateZ(lift);
    }
  }
  skyPane(skies[0], views.textures[0], WIN_BACK.x[1] - WIN_BACK.x[0] + 1, WIN_BACK.y[1] - WIN_BACK.y[0] + 1, [
    (WIN_BACK.x[0] + WIN_BACK.x[1]) / 2,
    (WIN_BACK.y[0] + WIN_BACK.y[1]) / 2,
    BACK - 2,
  ]);
  skyPane(
    skies[1],
    views.textures[1],
    WIN_LEFT.z[1] - WIN_LEFT.z[0] + 1,
    WIN_LEFT.y[1] - WIN_LEFT.y[0] + 1,
    [X0 - 2, (WIN_LEFT.y[0] + WIN_LEFT.y[1]) / 2, (WIN_LEFT.z[0] + WIN_LEFT.z[1]) / 2],
    Math.PI / 2
  );
  const drawSky = () => skies.forEach(drawSkyOf);
  function drawSkyOf(sky, i) {
    const { g } = sky;
    const grad = g.createLinearGradient(0, 0, 0, SKY[1]);
    grad.addColorStop(0, shared.night ? "#18234a" : "#7fc0ec");
    grad.addColorStop(1, shared.night ? "#33447a" : "#d4ecfb");
    g.fillStyle = grad;
    g.fillRect(0, 0, ...SKY);
    if (shared.overcast) {
      // Nothing but cloud.
    } else if (shared.night) {
      for (let k = 0; k < 22; k++) {
        g.fillStyle = k % 5 ? "#e9ecff" : "#ffe9a8";
        g.fillRect(Math.floor(hash(k, 3, 1 + i) * SKY[0]), Math.floor(hash(k, 5, 2 + i) * SKY[1] * 0.8), 1, 1);
      }
      g.fillStyle = "#fff4c2"; // a crescent moon
      if (!i)
        for (let y = -5; y <= 5; y++)
          for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25 && (x + 3) ** 2 + (y - 1) ** 2 > 18) g.fillRect(30 + x, 9 + y, 1, 1);
    } else if (!i) {
      g.fillStyle = "#fff6c9"; // the sun peeking in at the corner
      for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) g.fillRect(34 + x, 6 + y, 1, 1);
    }
    sky.tex.needsUpdate = true;
  }
  function drawClouds() {
    const { g, canvas } = clouds;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = shared.night ? "rgba(150,165,210,0.35)" : "#ffffff";
    [
      [10, 22, 8],
      [40, 13, 6],
      [62, 28, 9],
      [78, 10, 5],
      ...(shared.overcast
        ? [
            [26, 8, 7],
            [52, 20, 8],
            [70, 34, 7],
            [86, 24, 6],
            [4, 36, 6],
          ]
        : []),
    ].forEach(([cx, cy, r]) => {
      for (let y = -r; y <= r; y++)
        for (let x = -2 * r; x <= 2 * r; x++) {
          const puff = (x / (2 * r)) ** 2 + (y / r) ** 2 <= 1 && y <= r / 2;
          const bump = (x - r / 2) ** 2 + (y + r / 3) ** 2 <= (r * 0.7) ** 2;
          if (puff || bump) g.fillRect((cx + x + canvas.width) % canvas.width, cy + y, 1, 1);
        }
    });
    clouds.tex.needsUpdate = true;
  }
  // A bird now and then, flapping across the window over the bed by day.
  const birdPart = part();
  [
    [-2, 1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [2, 1],
  ].forEach(([x, y]) => birdPart.add(x, y, 0, "tvBody"));
  const bird = place(house, mesh(birdPart), [0, 0, BACK - 1.5]);
  bird.visible = false;
  const winMid = (WIN_BACK.x[0] + WIN_BACK.x[1]) / 2;
  const winHalf = (WIN_BACK.x[1] - WIN_BACK.x[0]) / 2 - 2;
  const flight = { at: 6, x: 0, y: 0, dir: 1 };
  updates.push((t, dt) => {
    cloudMat.map.offset.x = (t * 0.004) % 1;
    if (!shared.night && t > flight.at && !bird.visible) {
      Object.assign(flight, { dir: Math.random() < 0.5 ? 1 : -1, y: WIN_BACK.y[0] + 18 + Math.random() * 14 });
      flight.x = -flight.dir * winHalf;
      bird.visible = true;
    }
    if (bird.visible) {
      flight.x += flight.dir * 12 * dt;
      bird.position.set(winMid + flight.x, flight.y + Math.sin(t * 3) * 1.5, BACK - 1.5);
      bird.scale.y = Math.sin(t * 14) > 0 ? 1 : -1; // flapping
      if (Math.abs(flight.x) > winHalf || shared.night) {
        bird.visible = false;
        flight.at = t + 12 + Math.random() * 20;
      }
    }
  });

  // The window frames: white, with glazing bars and a sill; sage curtains tied back either side of the one
  // over the bed, and a succulent on its sill (where the cat likes to sit).
  const win = part();
  const frameAround = ([a, b], [lo, hi], at) => {
    for (let u = a - 2; u <= b + 2; u++)
      for (let y = lo - 2; y <= hi + 2; y++) if (u < a || u > b || y < lo || y > hi) win.add(...at(u, y, 0), "frame");
    for (let y = lo; y <= hi; y++) win.add(...at(Math.round((a + b) / 2), y, -1), "frame");
    for (let u = a; u <= b; u++) win.add(...at(u, Math.round((lo + hi) / 2), -1), "frame");
    for (let u = a - 3; u <= b + 3; u++) for (let d = 0; d <= 4; d++) win.add(...at(u, lo - 3, d), d === 4 ? "frameShade" : "frame");
  };
  frameAround(WIN_BACK.x, WIN_BACK.y, (u, y, d) => [u, y, BACK + d]);
  frameAround(WIN_LEFT.z, WIN_LEFT.y, (u, y, d) => [X0 + d, y, u]);
  // Curtains on both windows, sage linen in soft pleats with a deeper hem, on a brass rod a little out from
  // the wall (clear of the cat on the sill): gathered at the sides, or drawn across (clicked, `curtains`).
  // Each panel is drawn across, and gathered in by squeezing its pleats towards the side it hangs from.
  const curtains = [];
  function curtainsOn(span, [lo, hi], margins, at, turnY) {
    const half = Math.ceil((span[1] - span[0] + 1) / 2) + 1;
    const panels = [-1, 1].map((side, i) => {
      const width = half + margins[i];
      const p = part();
      for (let u = 0; u < width; u++)
        for (let y = lo; y <= hi; y++) p.add(u, y, 0, y <= lo + 1 ? "curtainFold" : u % 3 === 1 ? "curtainFold" : "curtain");
      const g = place(house, new THREE.Group(), at(side < 0 ? span[0] - margins[0] : span[1] + margins[1]), turnY + (side < 0 ? 0 : Math.PI));
      const m = mesh(p);
      m.position.x = 0.5;
      g.add(m);
      return { g, m, width };
    });
    const rod = part();
    for (let u = span[0] - margins[0] - 2; u <= span[1] + margins[1] + 2; u++) rod.add(...at(u).map((v, k) => (k === 1 ? hi + 2 : v)), "brass");
    house.add(mesh(rod));
    const c = { closed: false, k: 0, panels };
    clickables.push({ parts: panels.map((p) => p.m), toggle: () => (c.closed = !c.closed) });
    curtains.push(c);
  }
  curtainsOn(WIN_BACK.x, [WIN_BACK.y[0] - 2, WIN_BACK.y[1] + 4], [8, 8], (u) => [u - 0.5, 0, BACK + 8.5], 0);
  curtainsOn(WIN_LEFT.z, [WIN_LEFT.y[0] + 2, WIN_LEFT.y[1] + 4], [3, 8], (u) => [X0 + 6, 0, u - 0.5], -Math.PI / 2);
  const GATHERED = 6; // how wide a panel is, drawn back
  updates.push((t, dt) => {
    for (const c of curtains) {
      c.k += ((c.closed ? 1 : 0) - c.k) * (1 - Math.exp(-4 * dt));
      for (const { g, width } of c.panels) g.scale.x = (GATHERED + (width - GATHERED) * c.k) / width;
    }
  });
  ellipsoid(win, [WIN_BACK.x[1] - 3, WIN_BACK.y[0] - 1.5, BACK + 2], [1.8, 1.4, 1.4], "pot");
  ellipsoid(win, [WIN_BACK.x[1] - 3, WIN_BACK.y[0] + 0.5, BACK + 2], [1.6, 1.4, 1.3], "succulent");
  house.add(mesh(win));

  // The front door: white, with two panes of glass, opening into the room. Through it, a path and a hedge
  // under the sky; on the floor inside, a doormat.
  const door = pivotGroup(house, [DOOR_X[0] - 0.5, 0, BACK - 2]);
  const doorPart = part();
  box(doorPart, DOOR_X, [0, DOOR.height - 1], [BACK - 2, BACK - 2], (x, y) => {
    const u = x - DOOR_X[0];
    if (u === 0 || u === 2 * DOOR.half - 1 || y === DOOR.height - 1 || y === 0) return "doorShade";
    if (y >= 32 && y <= 52 && ((u >= 3 && u <= 10) || (u >= 13 && u <= 20))) return "glass";
    if (y >= 6 && y <= 26 && (u === 3 || u === 20 || u === 10 || u === 13 || y === 6 || y === 26)) return "doorShade";
    return "door";
  });
  doorPart.add(DOOR.x + 8, 28, BACK - 1, "brass"); // the knob
  door.inner.add(mesh(doorPart));
  const doorFrame = part();
  box(doorFrame, [DOOR_X[0] - 2, DOOR_X[1] + 2], [0, DOOR.height + 1], [BACK, BACK], "frame", [
    { has: (x, y) => x >= DOOR_X[0] && x <= DOOR_X[1] && y < DOOR.height },
  ]);
  house.add(mesh(doorFrame));
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), new THREE.MeshLambertMaterial({ color: COLORS.mat }));
  mat.rotation.x = -Math.PI / 2;
  place(house, mat, [DOOR.x, -0.45, BACK + 8]);
  const outside = pixelTexture(60, 70, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#8ccbf0");
    grad.addColorStop(1, "#dff1fb");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const top = 34 + Math.round(2 * Math.sin(x * 0.7) + hash(x, 1, 1) * 2); // a hedge
      g.fillStyle = x % 5 ? "#5e9e4a" : "#4f8a3e";
      g.fillRect(x, top, 1, h - top);
      if (hash(x, 2, 3) < 0.15) {
        g.fillStyle = hash(x, 4, 4) < 0.5 ? "#f6a5c0" : "#fbe28a";
        g.fillRect(x, top + 3 + Math.floor(hash(x, 5, 5) * 8), 1, 1);
      }
    }
  });
  // The hedge is close behind the door, so whoever goes out walks off behind it.
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(60, 70), new THREE.MeshBasicMaterial({ map: outside.tex })), [DOOR.x, 34.5, BACK - 18]);
  const doorRain = pixelTexture(60, 70, drawRain);
  doorRain.tex.wrapS = doorRain.tex.wrapT = THREE.RepeatWrapping;
  const doorRainMat = new THREE.MeshBasicMaterial({ map: doorRain.tex, transparent: true, opacity: 0, depthWrite: false });
  place(house, new THREE.Mesh(new THREE.PlaneGeometry(60, 70), doorRainMat), [DOOR.x, 34.5, BACK - 17.8]);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2 * DOOR.half + 6, 16), new THREE.MeshLambertMaterial({ color: "#d9cbb0" }));
  path.rotation.x = -Math.PI / 2;
  place(house, path, [DOOR.x, -0.5, BACK - 10]);
  const frontDoor = { open: false, k: 0 };
  updates.push((t, dt) => {
    frontDoor.k += ((frontDoor.open ? 1 : 0) - frontDoor.k) * (1 - Math.exp(-4 * dt));
    door.outer.rotation.y = -1.45 * frontDoor.k;
  });

  return { cloudMat, rainVeil, rainMat, views, drawSky, drawClouds, bird, doorRain, doorRainMat, frontDoor };
}
