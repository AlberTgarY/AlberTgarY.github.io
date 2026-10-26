/*******************************************************************************
 * Seeing out through the back wall, the one with the front door, from the
 * front: with the pointer on the front door (or after a tap on it) the wall
 * and what stands against it fade, so that the front garden shows through it
 * (house/yard.js), and come back once the pointer is off it (room.js says
 * where the pointer is).
 *
 * What fades is every mesh of the house standing close to the back wall and
 * not reaching far into the room (the fridge, the door, the desk, the bed, the
 * clothes rail...), worked out once from where they are, and what is on the
 * wall outside (the front garden's `onWall`). While fading, each is
 * drawn with a see-through copy of its own material, kept up to date with it
 * (a lamp switched on changes its shade's material). The copies still hide
 * what is behind them in the same thing (its far side shows through only as
 * it shows through glass), so that nothing flickers as they come back; faded
 * back in, each has its own material again, so the house looks just as it did.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { BACK } from "./house.js";

const FADED = 0.22; // how much of a faded thing still shows
const NEAR = 30; // how close to the wall something must come to fade
const DEPTH = 52; // and how far into the room it may reach
const RATE = 7; // how quickly it fades (1/s)

export function makePeek(house) {
  const box = new THREE.Box3();
  const faders = house.yard.onWall.map((mesh) => ({ mesh, own: mesh.material }));
  house.group.updateMatrixWorld(true);
  house.group.traverse((o) => {
    if (!o.isMesh) return;
    box.setFromObject(o);
    const flat = box.max.y - box.min.y < 1.5; // a shadow, a mat or a rug on the floor stays
    if (box.min.z < BACK + NEAR && box.max.z < BACK + DEPTH && !flat) faders.push({ mesh: o, own: o.material });
  });

  // The see-through copy of each material (one copy for all the meshes sharing it). One drawn by a shader of
  // its own fades itself, if it can (the mirror's glass: an `opacity` uniform), or else as a plain pale pane.
  const copies = new Map();
  const isCopy = new Set();
  const copyOf = (m) => {
    if (!copies.has(m)) {
      const c = m.isMeshLambertMaterial || m.isMeshBasicMaterial ? m.clone() : new THREE.MeshBasicMaterial({ color: "#d9e3e6" });
      c.transparent = true;
      copies.set(m, c);
      isCopy.add(c);
    }
    return copies.get(m);
  };
  const fadesItself = (m) => m.isShaderMaterial && m.uniforms.opacity;

  const peek = {
    k: 0, // how far faded, 0 to 1
    want: false, // the pointer on the front door
    until: -Infinity, // a tap on it keeps it faded till then
    update(t, dt) {
      if (peek.k === 0 && !(peek.want || t < peek.until)) return;
      const goal = peek.want || t < peek.until ? 1 : 0;
      peek.k += (goal - peek.k) * (1 - Math.exp(-RATE * dt));
      if (Math.abs(goal - peek.k) < 0.01) peek.k = goal;
      const show = 1 - (1 - FADED) * peek.k;
      for (const f of faders) {
        if (!isCopy.has(f.mesh.material)) f.own = f.mesh.material; // changed since (a lamp switched on)
        if (fadesItself(f.own)) {
          f.own.uniforms.opacity.value = show;
          f.own.transparent = show < 1;
          continue;
        }
        if (peek.k === 0) {
          f.mesh.material = f.own;
          continue;
        }
        const c = copyOf(f.own);
        if (c.color && f.own.color) c.color.copy(f.own.color);
        if (f.own.map !== undefined) c.map = f.own.map;
        c.opacity = (f.own.isShaderMaterial ? 1 : f.own.opacity) * show;
        c.visible = f.own.visible;
        f.mesh.material = c;
      }
    },
  };

  // Whether `mesh` is faded just now.
  peek.faded = (mesh) => isCopy.has(mesh.material);
  return peek;
}
