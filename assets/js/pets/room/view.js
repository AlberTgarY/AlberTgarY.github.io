/*******************************************************************************
 * How the playground's home is seen: like a dolls' house on a table, from the
 * front right and well above, so the whole of it shows at once (the kitchen,
 * the living room, the stairs, the loft and the garden). A gentle perspective keeps nearer
 * things a little bigger. The house is fitted into the width of the page and
 * the height of the window, and on wide screens a voxel is drawn a little
 * larger than the pets on the profile page.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { X0, SIDE, BACK, FRONT, WALL_H } from "./house.js";

export const VIEW_YAW = 0.6; // the camera's heading round from the front: someone facing it has rotation.y = VIEW_YAW
const PITCH = (40 * Math.PI) / 180; // looking down
const DISTANCE = 1400; // from the camera to the middle of the house: far enough for a gentle perspective
const MAX_SCALE = 2.6; // px per voxel at most
const PAD = 12; // px kept clear round the house
const TARGET = new THREE.Vector3(0, 30, 0);
// The corners of what is drawn: the floor slab (the garden's too), and the tops of the two walls.
const CORNERS = [
  ...[X0 - 4, SIDE].flatMap((x) => [BACK - 4, FRONT].flatMap((z) => [-9, 0].map((y) => [x, y, z]))),
  [X0 - 4, WALL_H + 2, BACK - 4],
  [SIDE, WALL_H + 2, BACK - 4],
  [X0 - 4, WALL_H + 2, FRONT],
];

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(1); // one canvas px per CSS px, drawn crisp, like the pets
  const camera = new THREE.PerspectiveCamera(20, 1, 600, 2400);
  const toCamera = new THREE.Vector3(Math.sin(VIEW_YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(VIEW_YAW) * Math.cos(PITCH));
  camera.position.copy(TARGET).addScaledVector(toCamera, DISTANCE);
  camera.lookAt(TARGET);
  camera.updateMatrixWorld();
  const v = new THREE.Vector3();
  const view = { renderer, camera, canvas: renderer.domElement, W: 1, H: 1, scale: 1 };

  // Fit the house into `width` x `maxHeight` CSS px: the scale, then a canvas the full width and as tall as
  // the house, cropping the frustum to just that.
  view.layout = (width, maxHeight = Infinity) => {
    const at = CORNERS.map(([x, y, z]) => {
      v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      return [(DISTANCE * v.x) / -v.z, (DISTANCE * v.y) / -v.z]; // px at a scale of 1, from the middle of the view
    });
    const [left, right] = [Math.min(...at.map((p) => p[0])), Math.max(...at.map((p) => p[0]))];
    const [bottom, top] = [Math.min(...at.map((p) => p[1])), Math.max(...at.map((p) => p[1]))];
    const scale = Math.max(0.2, Math.min(MAX_SCALE, (width - 2 * PAD) / (right - left), (maxHeight - 2 * PAD) / (top - bottom)));
    const cx = (scale * (left + right)) / 2;
    const up = Math.ceil(scale * top) + PAD;
    const down = Math.floor(scale * bottom) - PAD;
    const H = up - down;
    const fullW = 2 * (Math.abs(cx) + width / 2);
    const fullH = 2 * Math.max(up, -down);
    camera.fov = (2 * Math.atan(fullH / 2 / (scale * DISTANCE)) * 180) / Math.PI;
    camera.aspect = fullW / fullH;
    camera.setViewOffset(fullW, fullH, fullW / 2 + cx - width / 2, fullH / 2 - up, width, H);
    renderer.setSize(width, H, false);
    view.canvas.style.width = `${width}px`;
    view.canvas.style.height = `${H}px`;
    Object.assign(view, { W: width, H, scale });
  };

  // Canvas px of a world point.
  view.project = (x, y, z) => {
    v.set(x, y, z).project(camera);
    return [((v.x + 1) / 2) * view.W, ((1 - v.y) / 2) * view.H];
  };
  // Canvas px per world unit at a point (smaller further back).
  view.pxPerUnit = (x, y, z) => {
    v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    return (view.scale * DISTANCE) / -v.z;
  };
  // How far a point is in front of the camera: the nearer, the smaller.
  view.depth = (x, y, z) => -v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse).z;
  view.render = (scene) => renderer.render(scene, camera);
  return view;
}
