/*******************************************************************************
 * How the flower shop is seen: as the house is (room/view.js), from the front
 * right and well above with a gentle perspective, fitted into a canvas the
 * size of the house's (the page swaps the one for the other), and zoomed and
 * panned the same way (pinched, or a trackpad's pinch).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { VIEW_YAW } from "../room/view.js";
import { GROUND, MURAL, KIOSK, TREE } from "./layout.js";

const PITCH = (40 * Math.PI) / 180;
const DISTANCE = 1400;
const PAD = 12; // px kept clear round the shop
const MAX_ZOOMED = 12; // px per voxel, zoomed in as far as it goes
const TARGET = new THREE.Vector3(10, 30, 0);
// What has to be in view: the pavement, the mural's top along the back, the kiosk's roof and the tree's crown.
const CORNERS = [
  ...[GROUND.x0, GROUND.x1].flatMap((x) => [GROUND.z0, GROUND.z1].flatMap((z) => [-6, 0].map((y) => [x, y, z]))),
  [GROUND.x0, MURAL.h, MURAL.z],
  [GROUND.x1, MURAL.h, MURAL.z],
  [KIOSK.x0, KIOSK.h + KIOSK.roof, KIOSK.z1],
  [TREE.x, 118, TREE.z],
];

export function makeShopView() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // (drawn again only when shop.js asks)
  const camera = new THREE.PerspectiveCamera(20, 1, 600, 2400);
  const v = new THREE.Vector3();
  const view = { renderer, camera, canvas: renderer.domElement, W: 1, H: 1, scale: 1, yaw: VIEW_YAW };

  camera.position
    .set(Math.sin(VIEW_YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(VIEW_YAW) * Math.cos(PITCH))
    .multiplyScalar(DISTANCE)
    .add(TARGET);
  camera.lookAt(TARGET);
  camera.updateMatrixWorld();

  // Where CORNERS fall in the view, in px at a scale of 1 from its middle: [left, right, bottom, top].
  const at = CORNERS.map(([x, y, z]) => {
    v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    return [(DISTANCE * v.x) / -v.z, (DISTANCE * v.y) / -v.z];
  });
  const [left, right, bottom, top] = [
    Math.min(...at.map((p) => p[0])),
    Math.max(...at.map((p) => p[0])),
    Math.min(...at.map((p) => p[1])),
    Math.max(...at.map((p) => p[1])),
  ];

  // Show the canvas's W x H px round [cx, cy] (px off its middle, up positive) at `scale` px per voxel.
  function crop({ scale, cx, cy }) {
    const fullW = 2 * (Math.abs(cx) + view.W / 2);
    const fullH = 2 * (Math.abs(cy) + view.H / 2);
    camera.fov = (2 * Math.atan(fullH / 2 / (scale * DISTANCE)) * 180) / Math.PI;
    camera.aspect = fullW / fullH;
    camera.setViewOffset(fullW, fullH, fullW / 2 + cx - view.W / 2, fullH / 2 - cy - view.H / 2, view.W, view.H);
    camera.updateProjectionMatrix();
    view.scale = scale;
  }

  // Zoomed in (as room/view.js): `zoom.k` times as big, looking at [du, dv] off the middle.
  const zoom = { k: 1, du: 0, dv: 0 };
  let fitted = null;
  const most = () => Math.max(1, MAX_ZOOMED / fitted.scale);
  function zoomed() {
    const { scale, cx, cy } = fitted;
    zoom.k = Math.min(Math.max(1, zoom.k), most());
    const room = (size) => (size / 2 / scale) * (1 - 1 / zoom.k);
    zoom.du = Math.min(Math.max(zoom.du, -room(view.W)), room(view.W));
    zoom.dv = Math.min(Math.max(zoom.dv, -room(view.H)), room(view.H));
    const s = scale * zoom.k;
    crop({ scale: s, cx: (cx / scale + zoom.du) * s, cy: (cy / scale + zoom.dv) * s });
  }
  view.zoomAt = (f, x, y) => {
    const s = fitted.scale * zoom.k;
    const [u, w] = [zoom.du + (x - view.W / 2) / s, zoom.dv - (y - view.H / 2) / s];
    zoom.k = Math.min(Math.max(1, zoom.k * f), most());
    zoom.du = u - (x - view.W / 2) / (fitted.scale * zoom.k);
    zoom.dv = w + (y - view.H / 2) / (fitted.scale * zoom.k);
    zoomed();
  };
  view.panBy = (dx, dy) => {
    const s = fitted.scale * zoom.k;
    zoom.du -= dx / s;
    zoom.dv += dy / s;
    zoomed();
  };
  view.zoomed = () => zoom.k > 1.001;
  view.unzoom = () => {
    Object.assign(zoom, { k: 1, du: 0, dv: 0 });
    if (fitted) zoomed();
  };

  let ratio = 3; // device px per CSS px at most (lower() steps it down, as the house's)
  view.lower = () => {
    const now = Math.min(ratio, window.devicePixelRatio || 1);
    if (now <= 1.5) return false;
    ratio = now > 2 ? 2 : 1.5;
    renderer.setPixelRatio(Math.min(ratio, window.devicePixelRatio || 1));
    return true;
  };

  // Fitted into a W x H CSS px canvas (the house's, so that the one takes the other's place).
  view.layout = (W, H) => {
    Object.assign(view, { W, H });
    const scale = Math.max(0.2, Math.min((W - 2 * PAD) / (right - left), (H - 2 * PAD) / (top - bottom)));
    fitted = { scale, cx: (scale * (left + right)) / 2, cy: (scale * (top + bottom)) / 2 };
    renderer.setPixelRatio(Math.min(ratio, window.devicePixelRatio || 1));
    renderer.setSize(W, H, false);
    view.canvas.style.width = `${W}px`;
    view.canvas.style.height = `${H}px`;
    zoomed();
  };

  view.project = (x, y, z) => {
    v.set(x, y, z).project(camera);
    return [((v.x + 1) / 2) * view.W, ((1 - v.y) / 2) * view.H];
  };
  view.pxPerUnit = (x, y, z) => {
    v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    return (view.scale * DISTANCE) / -v.z;
  };
  view.depth = (x, y, z) => -v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse).z;
  view.render = (scene) => renderer.render(scene, camera);
  return view;
}
