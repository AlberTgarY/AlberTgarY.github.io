/*******************************************************************************
 * The way down to the basement, where the garden beside the living room was
 * (layout.js's DOWN): off the living room under the loft's edge, a landing,
 * and from it a straight flight down along the house's right side, towards the
 * front, to the basement's floor. Finished like the rest of the house: honey
 * oak treads over cream risers, the flight boxed in with cream panelling (a
 * cupboard under it, down in the basement), cream spindles and an oak handrail
 * like the loft's; round the opening in the living room's floor, a railing
 * like the loft's too.
 *
 * The flight (`flight`) is drawn whole from the basement too, rising out of it
 * to the landing, where the house over the basement is cut away (view.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box } from "../../models/voxels.js";
import { SIDE, FRONT, DOWN, BASE_Y } from "./layout.js";
import { COLORS, solidMaterial } from "./kit.js";

const RAIL = 13; // the railings' height (the loft's: shell.js)
const SLAB = -8.6; // the underside of the house's floor (shell.js)
const C = Object.fromEntries(
  ["woodLight", "woodMid", "woodDeep", "panel", "panelLine", "frame", "curtainTie"].map((k) => [k, new THREE.Color(COLORS[k])])
);

// One geometry of many boxes, each [x0, x1, y0, y1, z0, z1] with its colours (top, sides and underside), in
// vertex colours for kit.js's solidMaterial: one draw call for the whole flight.
function boxes(list) {
  const pos = [];
  const nor = [];
  const col = [];
  const quad = (a, b, c, d, n, color) => {
    for (const p of [a, b, c, a, c, d]) pos.push(...p);
    for (let k = 0; k < 6; k++) {
      nor.push(...n);
      col.push(color.r, color.g, color.b);
    }
  };
  for (const [[x0, x1, y0, y1, z0, z1], top, side = top, under = side] of list) {
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], top);
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], under);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], side);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], side);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], side);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], side);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// A bar `w` square from (x, ya, za) to (x, yb, zb): a handrail, or the string along the flight's side.
function bar(material, x, [za, ya], [zb, yb], w, h = w) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, Math.hypot(zb - za, yb - ya)), material);
  m.position.set(x, (ya + yb) / 2, (za + zb) / 2);
  m.rotation.x = -Math.atan2(yb - ya, zb - za);
  return m;
}

// `shared`: what the house so far has to share (house.js).
export function buildStairs(shared) {
  const { house, mesh, footprint } = shared;
  const { x0, x1, head, run: step, rise, steps } = DOWN;
  const floor = BASE_Y - 0.5; // the basement floor's top
  const treadY = (n) => -rise * n - 0.5; // the top of tread n (the floor under the feet, as everywhere)
  const treadZ = (n) => [head + (n - 0.6) * step, head + (n + 0.4) * step]; // from the next one up to its nosing
  const footZ = treadZ(steps - 1)[1];

  // The flight: each step a cream block down to the basement's floor (the risers, and the panelled sides)
  // under an oak tread; a skirting along the bottom and panel lines up the side towards the viewer (the
  // house's open side), and a cupboard door in it, under the stairs.
  const flight = new THREE.Group();
  house.add(flight);
  const solids = [];
  for (let n = 1; n < steps; n++) {
    const y = treadY(n);
    const [za, zb] = treadZ(n);
    solids.push([[x0, x1, floor, y - 1.4, za, zb], C.panel]);
    solids.push([[x0 - 0.3, x1, y - 1.4, y, za, zb + 0.6], C.woodLight, C.woodMid, C.woodDeep]);
    for (let z = Math.ceil(za / 8) * 8; z < zb; z += 8) solids.push([[x1, x1 + 0.15, floor + 4, y - 3, z, z + 0.6], C.panelLine]);
  }
  solids.push([[x0 - 0.4, x1 + 0.4, floor, floor + 4, treadZ(1)[0], treadZ(steps - 2)[1]], C.woodDeep]); // the skirting (under all but the last step)
  const DOOR = { z0: 18, z1: 34, h: 26 }; // the cupboard under the stairs
  solids.push(
    [[x1, x1 + 0.5, floor + 4, floor + DOOR.h + 1, DOOR.z0 - 1, DOOR.z1 + 1], C.woodMid],
    [[x1 + 0.5, x1 + 0.7, floor + 4, floor + DOOR.h, DOOR.z0, DOOR.z1], C.frame],
    [[x1 + 0.7, x1 + 0.9, floor + 6, floor + 14, DOOR.z0 + 2, DOOR.z1 - 2], C.panelLine],
    [[x1 + 0.7, x1 + 0.9, floor + 16, floor + DOOR.h - 2, DOOR.z0 + 2, DOOR.z1 - 2], C.panelLine],
    [[x1 + 0.7, x1 + 1.6, floor + 14.5, floor + 15.5, DOOR.z1 - 3, DOOR.z1 - 2], C.curtainTie] // the knob
  );
  // The spindles, one on each tread on the open side, from where the living room's railing leaves off
  // (shell.js: up there, the opening has its own) down to the foot, and a newel post at either end.
  const SPINDLE = x0 + 0.6;
  const first = Math.ceil((-0.5 + RAIL - SLAB) / rise); // the first step whose handrail is under the house's floor
  for (let n = first; n < steps; n++) {
    const [za, zb] = treadZ(n);
    const z = (za + zb) / 2;
    solids.push([[SPINDLE - 0.5, SPINDLE + 0.5, treadY(n), treadY(n) + RAIL, z - 0.5, z + 0.5], C.frame]);
  }
  const post = (n, z) =>
    solids.push([
      [SPINDLE - 1, SPINDLE + 1, n === steps ? floor : treadY(n), (n === steps ? floor : treadY(n)) + RAIL + 3, z - 1, z + 1],
      C.woodMid,
      C.woodDeep,
    ]);
  post(first - 1, treadZ(first - 1)[1] - 1);
  post(steps, footZ + 1);
  flight.add(new THREE.Mesh(boxes(solids), solidMaterial));
  const oak = new THREE.MeshLambertMaterial({ color: COLORS.woodMid });
  const pitch = (z) => -rise * ((z - head) / step + 0.1) - 0.5; // the line of the treads' middles
  const [ra, rb] = [treadZ(first - 1)[1] - 1, footZ + 1];
  const stringEnd = head + ((-0.5 - 4 - (floor + 5)) / rise - 0.1) * step; // where the string meets the skirting
  flight.add(
    bar(oak, SPINDLE, [ra, pitch(ra) + RAIL + 0.6], [rb, pitch(rb) + RAIL + 0.6], 1.4, 1.2), // the handrail
    bar(oak, x1 + 0.5, [head, pitch(head) - 4], [stringEnd, pitch(stringEnd) - 4], 1, 3) // the string, under the treads
  );

  // Round the opening in the living room's floor, on its left (the right is the house's cut side, the front
  // its open front): a railing like the loft's, cream spindles under an oak rail, posts at either end.
  const rail = part();
  const rx = x0 - 1;
  for (let z = head; z < FRONT; z++) {
    rail.add(rx, RAIL, z, "woodMid");
    if (z % 4 === 0) for (let y = 0; y < RAIL; y++) rail.add(rx, y, z, "frame");
  }
  for (const z of [head, FRONT - 1]) box(rail, [rx, rx], [0, RAIL + 1], [z, z], "woodDeep");
  house.add(mesh(rail));

  // On the floor plan of the house: the railing and the cut side (the landing, the flight and its foot are
  // walked on); on the basement's, the flight over it, down to where it is too low to walk under.
  footprint(rx - 2, x0, head, FRONT + 2, false);
  footprint(x1, SIDE + 2, head, FRONT + 2, false);
  return {
    stairs: {
      flight, // (drawn whole from the basement: view.js)
      under: [[x0 - 2, SIDE, head, footZ - 4]], // what the flight takes up on the basement's floor plan
      foot: [(x0 + x1) / 2, (footZ + FRONT) / 2], // at the foot of the flight, on the basement's floor
      head: [(x0 + x1) / 2, (DOWN.well + head) / 2], // on the landing at its head
      // Whether [x, z] is on the flight (or at its foot).
      on: (x, z) => x > x0 - 2 && x < x1 + 2 && z > head - 4 && z < FRONT,
    },
  };
}
