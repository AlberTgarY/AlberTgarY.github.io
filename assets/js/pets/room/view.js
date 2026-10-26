/*******************************************************************************
 * How the playground's home is seen: like a dolls' house on a table, from the
 * front right and well above, so the whole of it shows at once (the kitchen,
 * the living room, the stairs, the loft and the garden). A gentle perspective keeps nearer
 * things a little bigger. The house is fitted into the width of the page and
 * the height of the window, and on wide screens a voxel is drawn a little
 * larger than the pets on the profile page.
 *
 * The view can turn a quarter round to the left (`turn`), to look at the house
 * from behind on its right: the front garden out of the front door in front,
 * the back of the house beyond (house/yard.js). It turns smoothly, keeping the
 * canvas the size it is, the garden and the house fitted into it. Seen from
 * the front, whatever is out there is only drawn where the back wall hides it,
 * so that it shows only through the open door or the wall faded (peek.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { smoothstep } from "../models/voxels.js";
import { X0, SIDE, BACK, FRONT, WALL_H, YARD } from "./house.js";

export const VIEW_YAW = 0.6; // the camera's heading round from the front: someone facing it has rotation.y = VIEW_YAW
export const TURNED_YAW = VIEW_YAW + Math.PI / 2; // turned to the front garden
const PITCH = (40 * Math.PI) / 180; // looking down
const DISTANCE = 1400; // from the camera to the middle of the house: far enough for a gentle perspective
const MAX_SCALE = 2.6; // px per voxel at most
const PAD = 12; // px kept clear round the house
const TURN_SECS = 1.4;
const TARGETS = [new THREE.Vector3(0, 30, 0), new THREE.Vector3(28, 30, -70)];
// The corners of what is drawn: the floor slab (the garden's too), and the tops of the two walls; turned, the
// front garden's slab, and the tree's crown, too.
const WALL_TOP = WALL_H + 2;
const CORNERS = [
  ...[X0 - 4, SIDE].flatMap((x) => [BACK - 4, FRONT].flatMap((z) => [-9, 0].map((y) => [x, y, z]))),
  [X0 - 4, WALL_TOP, BACK - 4],
  [SIDE, WALL_TOP, BACK - 4],
  [X0 - 4, WALL_TOP, FRONT],
];
const OUT_CORNERS = [...CORNERS, ...[YARD.x0, YARD.x1].flatMap((x) => [-9, 0].map((y) => [x, y, YARD.z0])), [-114, 92, -176]];

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  const camera = new THREE.PerspectiveCamera(20, 1, 600, 2400);
  const v = new THREE.Vector3();
  const view = { renderer, camera, canvas: renderer.domElement, W: 1, H: 1, scale: 1, yaw: VIEW_YAW, turn: 0 };
  let goal = 0; // where the turn is going: 0 the house, 1 the front garden

  // The camera looking at `target` from heading `yaw`.
  function aim(yaw, target) {
    v.set(Math.sin(yaw) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(yaw) * Math.cos(PITCH));
    camera.position.copy(target).addScaledVector(v, DISTANCE);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }
  // Where `corners` fall in the view, in px at a scale of 1 from its middle: [left, right, bottom, top].
  function extent(corners) {
    const at = corners.map(([x, y, z]) => {
      v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      return [(DISTANCE * v.x) / -v.z, (DISTANCE * v.y) / -v.z];
    });
    return [Math.min(...at.map((p) => p[0])), Math.max(...at.map((p) => p[0])), Math.min(...at.map((p) => p[1])), Math.max(...at.map((p) => p[1]))];
  }
  // The scale and middle ([cx, cy] in px, up positive) fitting `corners` into the canvas as it is.
  function fit(corners) {
    const [left, right, bottom, top] = extent(corners);
    const scale = Math.max(0.2, Math.min(MAX_SCALE, (view.W - 2 * PAD) / (right - left), (view.H - 2 * PAD) / (top - bottom)));
    return { scale, cx: (scale * (left + right)) / 2, cy: (scale * (top + bottom)) / 2 };
  }
  // Show the canvas's W x H px around [cx, cy] at `scale` px per voxel (at the distance of the middle).
  function crop({ scale, cx, cy }) {
    const fullW = 2 * (Math.abs(cx) + view.W / 2);
    const fullH = 2 * (Math.abs(cy) + view.H / 2);
    camera.fov = (2 * Math.atan(fullH / 2 / (scale * DISTANCE)) * 180) / Math.PI;
    camera.aspect = fullW / fullH;
    camera.setViewOffset(fullW, fullH, fullW / 2 + cx - view.W / 2, fullH / 2 - cy - view.H / 2, view.W, view.H);
    view.scale = scale;
  }

  // Seen from the front, nothing out the back is drawn above the line of the back wall's top, nor beside the
  // house past its far right corner: what is clipped away is what the wall does not hide. Turning, the line
  // rises and moves out (`open` 0 to 1), so that the garden comes into view bit by bit; turned, nothing is.
  const OUTSIDE = BACK - 4; // the back wall's outer face
  const CAP = WALL_H + 1.35; // (a hair under the top of its cap: nothing out there peeps over its edge)
  const OPENING = 0.45; // how far into the turn the garden is all in view (before the camera is round the wall)
  const clips = [new THREE.Plane(), new THREE.Plane()];
  const never = (plane) => plane.set(new THREE.Vector3(0, 1, 0), 1e6);
  function clipTo(eye, open = 0) {
    const [cap, side] = [CAP + open * 300, SIDE + open * 400];
    const keep = new THREE.Vector3(0, 0, 0); // the middle of the house is never clipped
    const orient = (plane) => plane.distanceToPoint(keep) < 0 && plane.negate();
    clips[0].setFromCoplanarPoints(eye, new THREE.Vector3(X0 - 4, cap, OUTSIDE), new THREE.Vector3(side, cap, OUTSIDE));
    clips[1].setFromCoplanarPoints(eye, new THREE.Vector3(side, -20, OUTSIDE), new THREE.Vector3(side, cap, OUTSIDE));
    clips.forEach(orient);
  }
  renderer.clippingPlanes = clips; // (always the two of them, so the shaders never change)
  // Shadows, from the bedside lamp only (loft.js), drawn again only on the frames room.js asks.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  // The view as far round as `k` (0 the house from the front, 1 the front garden), easing in and out, the
  // scale and the middle going steadily from the one to the other.
  let home = null; // the house's own fit, as laid out
  let out = null; // the garden's and the house's, turned
  function frame(k) {
    const e = smoothstep(0, 1, k);
    view.turn = k;
    view.yaw = VIEW_YAW + e * (TURNED_YAW - VIEW_YAW);
    aim(view.yaw, v.clone().lerpVectors(TARGETS[0], TARGETS[1], e));
    if (k < OPENING) clipTo(camera.position, smoothstep(0, OPENING, k));
    else clips.forEach(never);
    const mix = (key) => home[key] + (out[key] - home[key]) * e;
    crop({ scale: mix("scale"), cx: mix("cx"), cy: mix("cy") });
  }

  // Device px drawn per CSS px at most: 2 (at 3, a phone's, over twice the pixels and hardly any sharper),
  // or 1.5 once lower() finds the device cannot keep up; whether it went lower.
  let ratio = 2;
  view.lower = () => {
    if (Math.min(ratio, window.devicePixelRatio || 1) <= 1.5) return false;
    ratio = 1.5;
    renderer.setPixelRatio(Math.min(ratio, window.devicePixelRatio || 1)); // (resizing the canvas)
    return true;
  };

  // Fit the house into `width` x `maxHeight` CSS px: the scale, then a canvas the full width and as tall as
  // the house, cropping the frustum to just that. Turned, the garden and the house are fitted into the same.
  view.layout = (width, maxHeight = Infinity) => {
    aim(VIEW_YAW, TARGETS[0]);
    const [left, right, bottom, top] = extent(CORNERS);
    const scale = Math.max(0.2, Math.min(MAX_SCALE, (width - 2 * PAD) / (right - left), (maxHeight - 2 * PAD) / (top - bottom)));
    const up = Math.ceil(scale * top) + PAD;
    const down = Math.floor(scale * bottom) - PAD;
    Object.assign(view, { W: width, H: up - down });
    home = { scale, cx: (scale * (left + right)) / 2, cy: (up + down) / 2 };
    aim(TURNED_YAW, TARGETS[1]);
    out = fit(OUT_CORNERS);
    // Drawn at the screen's own resolution (a phone has 2 or 3 device px per CSS px), not stretched up from CSS
    // px; but at most `ratio` (lower() below).
    renderer.setPixelRatio(Math.min(ratio, window.devicePixelRatio || 1));
    renderer.setSize(width, view.H, false);
    view.canvas.style.width = `${width}px`;
    view.canvas.style.height = `${view.H}px`;
    frame(view.turn);
  };

  // Turn round to the front garden (true) or back to the house, or there at once (`now`); `update(dt)` turns it
  // on, and says whether it turned.
  let jump = false;
  view.turnTo = (out, now = false) => {
    goal = out ? 1 : 0;
    jump = now;
  };
  view.update = (dt) => {
    if (view.turn === goal) return false;
    if (jump) {
      frame(goal);
      return true;
    }
    const step = dt / TURN_SECS;
    frame(goal > view.turn ? Math.min(goal, view.turn + step) : Math.max(goal, view.turn - step));
    return true;
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
