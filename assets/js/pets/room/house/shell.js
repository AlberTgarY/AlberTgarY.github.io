/*******************************************************************************
 * The shell of the playground's home: the floor, the walls, and the loft with
 * its stairs.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, hash } from "../../models/voxels.js";
import { X0, SIDE, BACK, FRONT, WALL_H, WALL_T, LOFT, STAIRS, DOOR, DOWN } from "./layout.js";
import { pixelTexture, wallpaper, oakBoards } from "./kit.js";

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now.
export function buildShell(shared) {
  const { house, mesh, footprint } = shared;

  const planks = oakBoards();
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
    m.receiveShadow = true; // (of the floor lamp: living.js)
    house.add(m);
  }
  // To the opening over the stairs down (stairs.js), and on along the landing at their head.
  const OPEN = DOWN.x0 - 2;
  boards(X0, OPEN, BACK, FRONT, -0.5);
  boards(OPEN, SIDE, DOWN.well, DOWN.head, -0.5);
  // The cut edge of the floor all round, like a dolls' house, the stairs' included; open over the stairwell.
  const slabMat = new THREE.MeshLambertMaterial({ color: "#8a5a34" });
  const slab = (x0, x1, z0, z1) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 8, z1 - z0), slabMat);
    m.position.set((x0 + x1) / 2, -4.6, (z0 + z1) / 2);
    house.add(m);
  };
  slab(X0 - WALL_T, OPEN, BACK - WALL_T, FRONT);
  slab(OPEN, SIDE, BACK - WALL_T, DOWN.head);

  const paper = wallpaper(WALL_H);
  const paperMat = new THREE.MeshLambertMaterial({ map: paper.tex });
  // Outside, the back wall (facing the front garden: yard.js) is clad in duck-egg blue weatherboards, each
  // lit along its top and shadowed under its lip, a little grain in them, over a plinth of old red brick, and
  // a white fascia under the top.
  const render = pixelTexture(64, WALL_H, (g, w, h) => {
    const at = (y) => h - 1 - y;
    const put = (x, y, c) => {
      g.fillStyle = c;
      g.fillRect(x, at(y), 1, 1);
    };
    for (let y = 11; y < h; y++) {
      const row = (y - 11) % 4; // 0 the shadowed lip at the bottom of a board, 3 its lit top
      for (let x = 0; x < w; x++) {
        const grain = hash(Math.floor(x / 5), y, 63) < 0.12;
        put(x, y, row === 0 ? "#b7cccb" : row === 3 ? "#e3efee" : grain ? "#cbdcdb" : "#d4e4e3");
      }
    }
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < w; x++) {
        const course = Math.floor(y / 2);
        const joint = y % 2 === 1 || (x + (course % 2) * 4) % 8 === 0;
        put(
          x,
          y,
          joint ? "#d8c8b0" : ["#b8654c", "#c46a52", "#a9563f", "#c97556"][Math.floor(hash(Math.floor((x + (course % 2) * 4) / 8), course, 62) * 4)]
        );
      }
    for (let x = 0; x < w; x++) {
      put(x, 10, "#e9e2d4"); // the top of the plinth
      for (const [y, c] of [
        [h - 3, "#fbf8f1"],
        [h - 2, "#fbf8f1"],
        [h - 1, "#e6e9e4"],
      ])
        put(x, y, c); // the fascia
    }
  });
  render.tex.wrapS = THREE.RepeatWrapping;
  const renderMat = new THREE.MeshLambertMaterial({ map: render.tex });
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
      face.receiveShadow = true; // (of the bedside lamp: loft.js)
      const block = new THREE.Mesh(alongX ? new THREE.BoxGeometry(w, h, WALL_T) : new THREE.BoxGeometry(WALL_T, h, w), wallMat);
      if (alongX) {
        face.position.set(cu, cv, BACK);
        block.position.set(cu, cv, BACK - WALL_T / 2 - 0.05);
        const outer = new THREE.Mesh(g.clone(), renderMat); // the same, from outside
        const ouv = outer.geometry.attributes.uv;
        for (let i = 0; i < ouv.count; i++) ouv.setX(i, (cu - position.getX(i)) / 64);
        outer.rotation.y = Math.PI;
        outer.position.set(cu, cv, BACK - WALL_T - 0.15);
        house.add(outer);
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
  const WIN_LEFT = { z: [-4, 33], y: [43, 87] }; // the kitchen window, between the stove and the fireplace
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
    carpet.castShadow = carpet.receiveShadow = true; // (the bedside lamp's light stays up in the loft)
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
