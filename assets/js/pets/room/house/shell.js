/*******************************************************************************
 * The shell of the playground's home: the floor, the walls, and the loft with
 * its stairs.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, hash } from "../../models/voxels.js";
import { X0, X1, SIDE, BACK, FRONT, WALL_H, WALL_T, LOFT, STAIRS, DOOR } from "./layout.js";
import { pixelTexture } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildShell(shared) {
  const { house, mesh, footprint } = shared;

  // Honey oak boards, 6 voxels deep, of random lengths with darker seams.
  const planks = pixelTexture(256, 48, (g) => {
    const tones = ["#cf9d6b", "#c69161", "#d6a677", "#c08a5a"];
    for (let row = 0; row < 8; row++) {
      let x = -Math.floor(hash(row, 1, 7) * 40);
      while (x < 256) {
        const len = 34 + Math.floor(hash(row, x, 3) * 50);
        g.fillStyle = tones[Math.floor(hash(x, row, 5) * tones.length)];
        g.fillRect(x, row * 6, len, 6);
        for (let k = 0; k < 6; k++) {
          // a few grain streaks
          const gx = x + Math.floor(hash(x, row, k) * len);
          g.fillStyle = "rgba(120,72,36,0.16)";
          g.fillRect(gx, row * 6 + 1 + (k % 4), 5, 1);
        }
        g.fillStyle = "#a8743f";
        g.fillRect(x, row * 6, 1, 6);
        x += len;
      }
      g.fillStyle = "#b07c4a";
      g.fillRect(0, row * 6 + 5, 256, 1);
    }
  });
  planks.tex.wrapS = planks.tex.wrapT = THREE.RepeatWrapping;
  const floorMat = new THREE.MeshLambertMaterial({ map: planks.tex });
  // Boards over [x0, x1] x [z0, z1] at height y, lined up with all the others.
  function boards(x0, x1, z0, z1, y) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) uv.setXY(i, (cx + position.getX(i)) / 256, (position.getY(i) - cz) / 48);
    const m = new THREE.Mesh(g, floorMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, y, cz);
    house.add(m);
  }
  boards(X0, X1, BACK, FRONT, -0.5);
  // The cut edge of the floor all round, like a dolls' house, the garden's included.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(SIDE - X0 + WALL_T, 8, FRONT - BACK + WALL_T),
    new THREE.MeshLambertMaterial({ color: "#8a5a34" })
  );
  slab.position.set((X0 - WALL_T + SIDE) / 2, -4.6, (BACK - WALL_T + FRONT) / 2);
  house.add(slab);

  // Warm cream wallpaper with fine stripes and little flowers over white panelling, a wooden rail between
  // them and a skirting board below.
  const paper = pixelTexture(64, WALL_H, (g, w, h) => {
    const at = (y) => h - 1 - y; // canvas rows run down, wall heights up
    g.fillStyle = "#f6e8cf";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = "#f1e0c4";
      g.fillRect(x, 0, 1, h);
    }
    for (let y = 38; y < h - 6; y += 12)
      for (let x = (y / 12) % 2 ? 4 : 0; x < w; x += 8) {
        g.fillStyle = "#e8a99a";
        g.fillRect(x + 4, at(y), 1, 1);
        g.fillStyle = "#c9d9a8";
        g.fillRect(x + 4, at(y - 1), 1, 1);
      }
    g.fillStyle = "#f3eee4"; // panelling
    g.fillRect(0, at(30), w, 27);
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = "#e2d9c8";
      g.fillRect(x, at(28), 1, 22);
      g.fillRect(x, at(28), 12, 1);
      g.fillStyle = "#fbf8f2";
      g.fillRect(x + 1, at(7), 12, 1);
    }
    g.fillStyle = "#b58457"; // the rail
    g.fillRect(0, at(32), w, 2);
    g.fillStyle = "#9a6a40"; // the skirting
    g.fillRect(0, at(4), w, 5);
    g.fillStyle = "#e9d6b6"; // the cornice
    g.fillRect(0, 0, w, 3);
  });
  paper.tex.wrapS = THREE.RepeatWrapping;
  const paperMat = new THREE.MeshLambertMaterial({ map: paper.tex });
  const wallMat = new THREE.MeshLambertMaterial({ color: "#e9dcc4" });
  const capMat = new THREE.MeshLambertMaterial({ color: "#c9ae8a" });
  // A wall from u0 to u1 along it, papered on the inside, WALL_T thick, cut round its `holes` ([u0, u1,
  // v0, v1]: along it and up it), and capped on top. `alongX`: the back wall (u is x) or the left (u is z).
  function wall([u0, u1], holes, alongX) {
    const [floor, top] = [-0.5, WALL_H - 0.5];
    const rects = [];
    let u = u0;
    for (const [a, b, lo, hi] of holes) {
      if (a > u) rects.push([u, a, floor, top]);
      if (lo > floor) rects.push([a, b, floor, lo]);
      if (hi < top) rects.push([a, b, hi, top]);
      u = b;
    }
    if (u < u1) rects.push([u, u1, floor, top]);
    for (const [a, b, lo, hi] of rects) {
      const [w, h, cu, cv] = [b - a, hi - lo, (a + b) / 2, (lo + hi) / 2];
      const g = new THREE.PlaneGeometry(w, h);
      const { position, uv } = g.attributes;
      for (let i = 0; i < position.count; i++) uv.setXY(i, (cu + (alongX ? 1 : -1) * position.getX(i)) / 64, (cv + 0.5 + position.getY(i)) / WALL_H);
      const face = new THREE.Mesh(g, paperMat);
      const block = new THREE.Mesh(alongX ? new THREE.BoxGeometry(w, h, WALL_T) : new THREE.BoxGeometry(WALL_T, h, w), wallMat);
      if (alongX) {
        face.position.set(cu, cv, BACK);
        block.position.set(cu, cv, BACK - WALL_T / 2 - 0.05);
      } else {
        face.rotation.y = Math.PI / 2;
        face.position.set(X0, cv, cu);
        block.position.set(X0 - WALL_T / 2 - 0.05, cv, cu);
      }
      house.add(face, block);
    }
    const cap = new THREE.Mesh(alongX ? new THREE.BoxGeometry(u1 - u0, 2, WALL_T + 1) : new THREE.BoxGeometry(WALL_T + 1, 2, u1 - u0), capMat);
    if (alongX) cap.position.set((u0 + u1) / 2, top + 1, BACK - WALL_T / 2 + 0.5);
    else cap.position.set(X0 - WALL_T / 2 + 0.5, top + 1, (u0 + u1) / 2);
    house.add(cap);
  }
  // Holes are given in voxel cells, the walls cut along their edges.
  const hole = ([a, b], [lo, hi]) => [a - 0.5, b + 0.5, lo - 0.5, hi + 0.5];
  const WIN_BACK = { x: [111, 151], y: [54, 91] }; // over the bed
  const WIN_LEFT = { z: [-4, 33], y: [40, 84] }; // the kitchen window, between the stove and the fireplace
  const DOOR_X = [DOOR.x - DOOR.half, DOOR.x + DOOR.half - 1];
  wall([X0 - WALL_T, SIDE], [hole(DOOR_X, [0, DOOR.height - 1]), hole(WIN_BACK.x, WIN_BACK.y)], true);
  wall([BACK, FRONT], [hole(WIN_LEFT.z, WIN_LEFT.y)], false);

  // The loft: boards on top, its front and both sides panelled, a railing along the front and the open
  // right side, and the stairs up to it along the back wall with a banister.
  // Up in the loft, a soft oatmeal carpet from wall to wall, its pile flecked a little lighter and darker.
  const pile = pixelTexture(64, 64, (g, w, h) => {
    g.fillStyle = "#e7d5c4";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++) {
        const r = hash(x, y, 77);
        if (r < 0.16) {
          g.fillStyle = r < 0.08 ? "#dcc8b5" : "#efe1d2";
          g.fillRect(x, y, 1, 1);
        }
      }
  });
  pile.tex.wrapS = pile.tex.wrapT = THREE.RepeatWrapping;
  {
    const [x0, x1, z0, z1] = [LOFT.x0, SIDE, BACK, LOFT.z1];
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / 64, position.getY(i) / 64);
    const carpet = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: pile.tex }));
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set((x0 + x1) / 2, LOFT.y - 0.5, (z0 + z1) / 2);
    house.add(carpet);
  }
  const loft = part();
  const panel = (u, y) => (y === LOFT.y - 1 ? "woodMid" : y <= 1 ? "woodDeep" : u % 8 === 0 ? "panelLine" : "panel");
  for (let x = LOFT.x0; x < SIDE; x++) for (let y = 0; y < LOFT.y; y++) loft.add(x, y, LOFT.z1 - 1, panel(x, y));
  for (let z = STAIRS.z1; z < LOFT.z1; z++) for (let y = 0; y < LOFT.y; y++) loft.add(LOFT.x0, y, z, panel(z, y));
  for (let z = BACK; z < LOFT.z1; z++) for (let y = 0; y < LOFT.y; y++) loft.add(SIDE - 1, y, z, panel(z, y));
  const RAIL = 13; // the railing's height
  const railZ = LOFT.z1 - 2;
  const railX = SIDE - 2;
  for (let x = LOFT.x0 + 1; x <= railX; x++) {
    loft.add(x, LOFT.y + RAIL, railZ, "woodMid");
    if (x % 4 === 1 || x === railX)
      for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(x, y, railZ, x % 24 === 1 || x === railX ? "woodDeep" : "frame");
  }
  for (let z = BACK + 1; z < railZ; z++) {
    loft.add(railX, LOFT.y + RAIL, z, "woodMid");
    if (z % 4 === 0) for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(railX, y, z, "frame");
  }
  for (let z = STAIRS.z1; z <= railZ; z++) {
    loft.add(LOFT.x0 + 1, LOFT.y + RAIL, z, "woodMid");
    if (z % 4 === 0 || z === railZ) for (let y = LOFT.y; y < LOFT.y + RAIL; y++) loft.add(LOFT.x0 + 1, y, z, z === railZ ? "woodDeep" : "frame");
  }
  for (let k = 0; k < 6; k++) {
    const x0 = STAIRS.x0 + STAIRS.run * k;
    const top = STAIRS.rise * (k + 1) - 1;
    box(loft, [x0, x0 + STAIRS.run - 1], [0, top], [BACK, STAIRS.z1 - 1], (x, y, z) =>
      y === top ? "woodLight" : x === x0 ? "woodMid" : z === STAIRS.z1 - 1 ? "panel" : "woodMid"
    );
    for (let y = top + 1; y <= top + RAIL; y++) loft.add(x0 + 2, y, STAIRS.z1 - 1, "frame"); // a baluster on each step
  }
  for (let x = STAIRS.x0 - 1; x <= LOFT.x0; x++)
    loft.add(x, Math.round(RAIL + 1 + ((LOFT.y - 1) * (x - STAIRS.x0 + 1)) / (LOFT.x0 - STAIRS.x0 + 1)), STAIRS.z1 - 1, "woodMid"); // the handrail
  box(loft, [STAIRS.x0 - 2, STAIRS.x0 - 1], [0, RAIL + 2], [STAIRS.z1 - 1, STAIRS.z1 - 1], "woodDeep"); // the newel post
  house.add(mesh(loft));
  footprint(LOFT.x0, SIDE, LOFT.z1 - 3, LOFT.z1, false); // the railing, and the edge
  footprint(LOFT.x0 - 1, LOFT.x0 + 2, STAIRS.z1, LOFT.z1, false);
  footprint(railX - 1, SIDE, BACK, LOFT.z1, false);
  footprint(STAIRS.x0 - 2, LOFT.x0, STAIRS.z1 - 2, STAIRS.z1, false); // the banister

  return { WIN_BACK, WIN_LEFT, DOOR_X };
}
