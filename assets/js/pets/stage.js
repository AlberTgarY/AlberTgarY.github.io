/*******************************************************************************
 * The stage the pets share: the canvas size and camera every model is drawn
 * with, the paths around the profile photo they walk, the distances and timings
 * they keep, and small helpers.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export const W = 164; // canvas width in CSS px (the full view is W x W, cropped below the paws)
const HALF = 45; // half the view height in voxels (room for the nightcap's pompom and the hop)
export const VOX = W / (2 * HALF); // px per voxel

// Distances on the page, in px, and timings, in s.
const GROUND_INSET = 48; // between the photo's bottom edge and the paws (clears the caption bar)
const LAP_MARGIN = 24; // a lap swings out past the photo's sides, so a pet is clear of it when it passes behind
const FAR_INSET = 16; // below the photo's top edge for the paws on the far side, so the head and shoulders show above it
export const GAP = 72; // pets keep between them on the front path
export const LAP_GAP = 40; // other pets in the lane may be from the way to the start of a lap (or to a meal)
export const CROSS = 44; // a pet stops to one side of a pet in another lane, so neither hides the other
export const EAT_TIME = 7; // a meal takes, the first 1.5 s of it pouring
export const LEAD_GAP = 36; // a pet on a lead walks ahead of the girl
export const PET_GAP = 58; // between two pets on leads
export const TAG_GAP = 46; // a pet tagging along walks behind the girl
export const STROKE_GAP = 26; // the girl stands to one side of a pet she pets
export const STROKE_TIME = 4; // she pets it for
export const SCOLD_GAP = 34; // she stands to one side of the cat's mess while she takes it in
export const SCOLD_TIME = 3.5; // she is cross or dizzy for
export const HOP_TIME = 0.45; // a pet takes to hop up onto the sofa, or down

/* ---------- shared camera: a three-quarter view from the front right, slightly above ---------- */

export const CAM_YAW = Math.atan2(60, 100); // the camera's azimuth; facing it means rotation.y = CAM_YAW
export const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 400);
camera.position.set(60, 57, 100);
camera.lookAt(0, 31, 0);
camera.updateMatrixWorld();

// Canvas px of a world point in the full W x W view.
export const toPx = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * W];
};
export const FOOT_PX = toPx(0, -0.5, 0)[1];
// Crop the empty space below the paws, keeping the whole footprint in any facing.
let lowest = 0;
for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) lowest = Math.max(lowest, toPx(Math.cos(a) * 21, -0.5, Math.sin(a) * 21)[1]);
export const H = Math.min(W, Math.ceil(lowest + 2));
camera.setViewOffset(W, W, 0, 0, W, H);

/* ---------- helpers ---------- */

export const now = () => performance.now() / 1000;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));
export const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

// Critically damped spring (implicit Euler, stable for any dt): eases in and out with no overshoot, for
// the big whole-body moves where a sudden start would look like a jolt.
export const spring = (value, omega) => ({ x: value, v: 0, omega });
export function stepSpring(s, target, dt) {
  const k = s.omega * s.omega;
  const det = 1 + 2 * s.omega * dt + k * dt * dt;
  const x = ((1 + 2 * s.omega * dt) * s.x + dt * s.v + k * dt * dt * target) / det;
  s.v = (s.v + k * dt * (target - s.x)) / det;
  s.x = x;
  return x;
}

/* ---------- the photo: the front path and the lap around it ---------- */

// A lap is an ellipse on the ground seen from slightly above: its near side runs along the bottom of the
// photo and its far side behind the photo's top edge. All in px within .profile.
export const world = { nearY: 0, minX: 0, maxX: 0, cx: 0, rx: 0, ry: 0, lapOk: false };

export function measure(profile, photo) {
  const p = profile.getBoundingClientRect();
  const r = photo.getBoundingClientRect();
  world.nearY = r.bottom - p.top - GROUND_INSET;
  world.minX = r.left - p.left + W / 2 - 14;
  world.maxX = r.right - p.left - W / 2 + 14;
  world.cx = (r.left + r.right) / 2 - p.left;
  world.rx = r.width / 2 + LAP_MARGIN;
  world.ry = (world.nearY - (r.top - p.top + FAR_INSET)) / 2;
  // Laps need room beside the photo, which phones do not have.
  const room = LAP_MARGIN + 30;
  world.lapOk = window.innerWidth >= 576 && r.left - room > 0 && r.right + room < document.documentElement.clientWidth && world.ry > 40;
}
