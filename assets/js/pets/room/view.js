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
 *
 * It can also go down a floor (`floor`), like a map of a building, to the
 * basement under the house (house/basement.js), seen as the house is, open at
 * the front and on the right, with the house above it cut away. Changing floor,
 * the view sinks smoothly down a floor (or rises), the floor left fading out
 * as the other fades in on the way. Nothing under a floor slab is ever drawn
 * below its cut edge (what shows down the stairwell stays).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { smoothstep } from "../models/voxels.js";
import { X0, SIDE, BACK, FRONT, WALL_H, YARD, BASE_Y } from "./house.js";

export const VIEW_YAW = 0.6; // the camera's heading round from the front: someone facing it has rotation.y = VIEW_YAW
export const TURNED_YAW = VIEW_YAW + Math.PI / 2; // turned to the front garden
const PITCH = (40 * Math.PI) / 180; // looking down
const DISTANCE = 1400; // from the camera to the middle of the house: far enough for a gentle perspective
const MAX_SCALE = 2.6; // px per voxel at most
const PAD = 12; // px kept clear round the house
const TURN_SECS = 1.4;
const FLOOR_SECS = 1.3; // from one floor to the other
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
// Down in the basement: its slab and the tops of its two walls (just under the house's floor).
const DOWN_CORNERS = [
  ...[X0 - 4, SIDE].flatMap((x) => [BACK - 4, FRONT].flatMap((z) => [BASE_Y - 9, BASE_Y].map((y) => [x, y, z]))),
  [X0 - 4, -9, BACK - 4],
  [SIDE, -9, BACK - 4],
  [X0 - 4, -9, FRONT],
];
export const UNCUT = 3; // the layer of what is drawn whole from the basement (the stairs down, and anyone on them)
const CUT = -9.5; // where the house is sliced off, seen down in the basement (just under its floor slab)
const SLAB = -8.6; // the underside of the house's floor slab (shell.js)

export function makeView() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  const camera = new THREE.PerspectiveCamera(20, 1, 600, 2400);
  const v = new THREE.Vector3();
  const view = { renderer, camera, canvas: renderer.domElement, W: 1, H: 1, scale: 1, yaw: VIEW_YAW, turn: 0, floor: 0 };
  let goal = 0; // where the turn is going: 0 the house, 1 the front garden
  let floorGoal = 0; // and the floor: 0 the house's, 1 down in the basement

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
  // Two more keep what is under a floor slab from showing below its cut edge, at the front (or, turned, the
  // far edge of the front garden) and on the right: the basement under the house. Going down, they go down
  // with the view to under the basement's own slab, and a fifth slices the house off from the roof down to
  // just under its floor.
  const clips = [0, 1, 2, 3, 4].map(() => new THREE.Plane());
  const never = (plane) => plane.set(new THREE.Vector3(0, 1, 0), 1e6);
  const keep = new THREE.Vector3();
  const orient = (plane) => plane.distanceToPoint(keep) < 0 && plane.negate();
  function clipTo(eye, open = 0) {
    const [cap, side] = [CAP + open * 300, SIDE + open * 400];
    keep.set(0, 0, 0); // the middle of the house is never clipped
    clips[0].setFromCoplanarPoints(eye, new THREE.Vector3(X0 - 4, cap, OUTSIDE), new THREE.Vector3(side, cap, OUTSIDE));
    clips[1].setFromCoplanarPoints(eye, new THREE.Vector3(side, -20, OUTSIDE), new THREE.Vector3(side, cap, OUTSIDE));
    clips.slice(0, 2).forEach(orient);
  }
  function under(eye, yaw, y) {
    keep.set(0, y + 20, 0);
    const z = yaw < Math.PI / 2 ? FRONT : YARD.z0; // the near edge (turned past side on, the front garden's)
    clips[2].setFromCoplanarPoints(eye, new THREE.Vector3(X0 - 4, y, z), new THREE.Vector3(SIDE, y, z));
    clips[3].setFromCoplanarPoints(eye, new THREE.Vector3(SIDE, y, YARD.z0), new THREE.Vector3(SIDE, y, FRONT));
    clips.slice(2, 4).forEach(orient);
  }
  // The floor's clipping: from the house, nothing under its floor slab below the slab's edges; down in the
  // basement, nothing under the basement's below its edges, and the house over it cut away just under its
  // floor.
  function floorClips(below) {
    under(camera.position, view.yaw, below ? BASE_Y - 9 : SLAB);
    if (below) clips[4].set(new THREE.Vector3(0, -1, 0), CUT);
    else never(clips[4]);
  }
  view.clipFloor = floorClips; // (room.js: the mirrors and windows drawn for their own floor while between floors)
  renderer.clippingPlanes = clips; // (always the five of them, so the shaders never change)
  // Shadows, from the bedside lamp only (loft.js), drawn again only on the frames room.js asks.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  // The view as far round as `k` (0 the house from the front, 1 the front garden), easing in and out, the
  // scale and the middle going steadily from the one to the other.
  let home = null; // the house's own fit, as laid out
  let out = null; // the garden's and the house's, turned
  let basement = null; // the basement's
  const DROP = new THREE.Vector3(0, BASE_Y, 0); // the view's way down a floor
  function frame(k, f = view.floor) {
    const e = smoothstep(0, 1, k);
    const d = f * f * f * (f * (6 * f - 15) + 10); // (smoother still: it sinks a long way)
    view.turn = k;
    view.floor = f;
    view.yaw = VIEW_YAW + e * (TURNED_YAW - VIEW_YAW);
    aim(view.yaw, v.clone().lerpVectors(TARGETS[0], TARGETS[1], e).addScaledVector(DROP, d));
    if (k < OPENING) clipTo(camera.position, smoothstep(0, OPENING, k));
    else clips.slice(0, 2).forEach(never);
    floorClips(f > 0);
    const mix = (key) => home[key] + (out[key] - home[key]) * e + (basement[key] - home[key]) * d;
    fitted = { scale: mix("scale"), cx: mix("cx"), cy: mix("cy") };
    zoomed();
  }

  // Zoomed in on it (playground.js: pinched, or a trackpad's pinch): `zoom.k` times as big, looking at a
  // point [du, dv] off the middle (in px at a scale of 1, up positive). Drawn afresh at the screen's own
  // resolution, so whatever is zoomed in on is as sharp as anything else. Never further out than the whole
  // view, nor past its edges, nor more than MAX_ZOOMED px per voxel.
  const MAX_ZOOMED = 12;
  const zoom = { k: 1, du: 0, dv: 0 };
  let fitted = null; // the view as fitted, unzoomed
  const most = () => Math.max(1, MAX_ZOOMED / fitted.scale);
  function zoomed() {
    const { scale, cx, cy } = fitted;
    zoom.k = Math.min(Math.max(1, zoom.k), most());
    const room = (size) => (size / 2 / scale) * (1 - 1 / zoom.k); // how far off the middle it may look
    zoom.du = Math.min(Math.max(zoom.du, -room(view.W)), room(view.W));
    zoom.dv = Math.min(Math.max(zoom.dv, -room(view.H)), room(view.H));
    const s = scale * zoom.k;
    crop({ scale: s, cx: (cx / scale + zoom.du) * s, cy: (cy / scale + zoom.dv) * s });
  }
  // `f` times as big about canvas px (x, y), that point staying put.
  view.zoomAt = (f, x, y) => {
    const s = fitted.scale * zoom.k;
    const [u, v] = [zoom.du + (x - view.W / 2) / s, zoom.dv - (y - view.H / 2) / s]; // the point, off the middle
    zoom.k = Math.min(Math.max(1, zoom.k * f), most());
    zoom.du = u - (x - view.W / 2) / (fitted.scale * zoom.k);
    zoom.dv = v + (y - view.H / 2) / (fitted.scale * zoom.k);
    zoomed();
  };
  // Moved by (dx, dy) canvas px, as dragged.
  view.panBy = (dx, dy) => {
    const s = fitted.scale * zoom.k;
    zoom.du -= dx / s;
    zoom.dv += dy / s;
    zoomed();
  };
  view.zoomed = () => zoom.k > 1.001;
  view.unzoom = () => {
    Object.assign(zoom, { k: 1, du: 0, dv: 0 });
    if (fitted) zoomed(); // (laid out)
  };

  // Device px drawn per CSS px at most: the screen's own (up to 3, a phone's), stepped down to 2, then 1.5,
  // each time lower() finds the device cannot keep up; whether it went lower.
  let ratio = 3;
  view.lower = () => {
    const now = Math.min(ratio, window.devicePixelRatio || 1);
    if (now <= 1.5) return false;
    ratio = now > 2 ? 2 : 1.5;
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
    aim(VIEW_YAW, TARGETS[0].clone().add(DROP));
    basement = fit(DOWN_CORNERS);
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
    if (out) floorGoal = 0; // (only the house's floor turns round)
    jump = now;
    view.unzoom(); // (turning, it is seen whole)
  };
  // Down to the basement (true) or back up, or there at once (`now`). On the way the view sinks (or rises) a
  // floor, turning back round from the front garden if need be, the floor left fading out as the other fades
  // in (render()).
  view.floorTo = (below, now = false) => {
    floorGoal = below ? 1 : 0;
    if (view.floor === floorGoal) return;
    view.unzoom();
    goal = 0;
    if (now) frame(0, floorGoal);
  };
  view.fading = () => view.floor !== floorGoal;
  // On by dt: turning, going down or up; whether the view moved.
  const toward = (v, to, by) => (to > v ? Math.min(to, v + by) : Math.max(to, v - by));
  view.update = (dt) => {
    if (view.turn === goal && view.floor === floorGoal) return false;
    frame(jump ? goal : toward(view.turn, goal, dt / TURN_SECS), toward(view.floor, floorGoal, dt / FLOOR_SECS));
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
  // Drawn. Between floors, the house as seen from up there over the basement as seen from down there, each
  // faded in or out.
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { map: { value: null }, opacity: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(map, vUv);
          gl_FragColor = vec4(c.rgb, c.a * opacity); // (in sRGB already: target())
        }`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  );
  quad.frustumCulled = false;
  const flat = new THREE.Scene();
  flat.add(quad);
  const flatCamera = new THREE.Camera();
  const size = new THREE.Vector2();
  // The basement and the house as seen between floors, the size of the canvas (made again as that changes).
  // Each drawn into just as the canvas is, in sRGB and blended so: three.js draws into a render target in
  // linear colour, and there glass, water and glows blended milky and dark shading banded into patches, only
  // while the view went between floors. Marked as an XR target, three.js draws into it in its texture's colour
  // space (and nothing else changes); its texture made first as plain RGBA8, or the GPU would encode it again.
  const targets = [null, null];
  function target(i) {
    renderer.getDrawingBufferSize(size);
    const r = targets[i];
    if (r && r.width === size.x && r.height === size.y) return r;
    r?.dispose();
    const made = new THREE.WebGLRenderTarget(size.x, size.y);
    const was = renderer.getRenderTarget();
    renderer.setRenderTarget(made); // (made now, as RGBA8)
    renderer.setRenderTarget(was);
    made.isXRRenderTarget = true;
    made.texture.colorSpace = THREE.SRGBColorSpace;
    return (targets[i] = made);
  }
  // A target drawn over what is on the canvas, `opacity` of it.
  function over(r, opacity) {
    quad.material.uniforms.map.value = r.texture;
    quad.material.uniforms.opacity.value = opacity;
    renderer.render(flat, flatCamera);
  }
  // The scene, then what is on the UNCUT layer over it, cut by `planes`: down in the basement none (the flight
  // of stairs, rising whole to the landing at its head, and anyone on it); up in the house all but the two
  // out the back (`INDOORS`: anyone indoors, a nightcap up in the loft by the back wall poking over its top).
  const NEVER = clips.map(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6));
  const INDOORS = [...NEVER.slice(0, 2), ...clips.slice(2)];
  function drawn(scene, planes) {
    renderer.render(scene, camera);
    renderer.clippingPlanes = planes;
    renderer.autoClear = false;
    camera.layers.set(UNCUT);
    renderer.render(scene, camera);
    camera.layers.set(0);
    renderer.autoClear = true;
    renderer.clippingPlanes = clips;
  }
  const full = (scene) => drawn(scene, view.floor === 0 ? INDOORS : NEVER);
  // Ready before the first time between floors (room.js warm()): both targets made, the shader drawing them
  // over compiled.
  view.warm = () => {
    quad.material.uniforms.map.value = target(0).texture;
    target(1);
    renderer.setRenderTarget(null);
    renderer.compile(flat, flatCamera);
  };
  // `lightFloor(below)` lights the scene as the basement (or the house) before that floor is drawn (left as
  // it is without it).
  view.render = (scene, lightFloor = () => {}) => {
    const f = view.floor;
    if (f === 0 || f === 1) {
      lightFloor(f === 1);
      return full(scene);
    }
    // Between floors: the basement, fading in as the view starts down (out as it comes back up), and over it
    // the whole house as from up there (the flight with it), fading out as the view sinks past its floor (in
    // as it rises).
    const d = f * f * f * (f * (6 * f - 15) + 10); // how far the view has sunk (as frame())
    const below = smoothstep(0, 0.3, d);
    const shown = 1 - smoothstep(0.2, 0.75, d);
    lightFloor(true);
    renderer.setRenderTarget(target(0));
    full(scene);
    if (shown > 0) {
      lightFloor(false);
      floorClips(false);
      renderer.setRenderTarget(target(1));
      drawn(scene, INDOORS);
      floorClips(true);
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.autoClear = false;
    over(targets[0], below);
    if (shown > 0) over(targets[1], shown);
    renderer.autoClear = true;
  };
  return view;
}
