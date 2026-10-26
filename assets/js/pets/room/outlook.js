/*******************************************************************************
 * What is seen through the windows. Each window's glass shows its view
 * (views.js, and beyond the bed the real front garden too: house/yard.js) as
 * if from someone in the room a little way back from it and a little above
 * its middle: drawn each frame into a small texture, about as many texels as
 * the glass has pixels on screen, through a frustum cut to the glass's edges
 * (what is in the room, on this side of the glass, is never in it). That eye
 * moves a little to the side the view is seen from, and with the pointer, so
 * that near things slide across far ones as they would through a real window.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const MAX_SIZE = 320; // texels across a texture at most
const BACKWARD = 40; // how far back in the room the eye is
const ABOVE = 0.2; // and how far above the glass's middle (radians, looking down to it)
const SWAY = 0.6; // how far it goes with the side the view is seen from (of BACKWARD)
const POINTER = [10, 5]; // and with the pointer, at most (across, up)

// `outlooks`: house/windows.js's ({ glass, at, out, size, scene, yard }); `view`: view.js's; `scene`: the
// room's own (the front garden is in it); `outside`: the front garden's groups (yard.js's, wildlife.js's),
// drawn through the back window even while the view does not show them otherwise (room.js).
export function makeOutlooks(outlooks, view, scene, outside) {
  const { renderer, camera } = view;
  const NEVER = [0, 1].map(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6)); // (view.js's two clip planes, off)
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const panes = outlooks.map(({ glass, at, out, size, scene: there, yard }) => {
    const target = new THREE.WebGLRenderTarget(1, 1, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
    glass.material.map = target.texture;
    glass.material.needsUpdate = true;
    const middle = new THREE.Vector3(...at);
    const outward = new THREE.Vector3(...out);
    const across = new THREE.Vector3().crossVectors(outward, up); // to the right, looking out
    const [w, h] = size;
    const corners = [-1, 1].flatMap((sx) =>
      [-1, 1].map((sy) =>
        middle
          .clone()
          .addScaledVector(across, (sx * w) / 2)
          .addScaledVector(up, (sy * h) / 2)
      )
    );
    const eye = new THREE.PerspectiveCamera();
    return { glass, target, middle, outward, across, corners, eye, there, yard, sway: [0, 0], drawnAt: -1, at: new THREE.Vector3() };
  });
  let frame = 0;

  return function drawOutlooks(pointer) {
    frame++;
    const px = renderer.getPixelRatio();
    const camAt = v.setFromMatrixPosition(camera.matrixWorld).clone();
    for (const p of panes) {
      // Not from outside, nor with the glass out of the view.
      if (camAt.clone().sub(p.middle).dot(p.outward) >= 0) continue;
      const ndc = p.corners.map((c) => c.clone().project(camera));
      const [x0, x1, y0, y1] = [
        Math.min(...ndc.map((q) => q.x)),
        Math.max(...ndc.map((q) => q.x)),
        Math.min(...ndc.map((q) => q.y)),
        Math.max(...ndc.map((q) => q.y)),
      ];
      if (x1 < -1 || x0 > 1 || y1 < -1 || y0 > 1) continue;

      // Where the eye is: back from the glass and a little above, gone a little to the side the view is seen
      // from, and with the pointer (eased).
      const side = camAt.clone().sub(p.middle).normalize().dot(p.across) * SWAY;
      const [mx, my] = pointer.seen && pointer.mouse ? [(pointer.x / view.W) * 2 - 1, 1 - (pointer.y / view.H) * 2] : [0, 0];
      p.sway[0] += (mx - p.sway[0]) * 0.08;
      p.sway[1] += (my - p.sway[1]) * 0.08;
      const at = p.middle
        .clone()
        .addScaledVector(p.outward, -BACKWARD * Math.cos(ABOVE))
        .addScaledVector(up, BACKWARD * Math.sin(ABOVE) + POINTER[1] * p.sway[1])
        .addScaledVector(p.across, BACKWARD * side + POINTER[0] * p.sway[0]);
      // Beyond the bed, the front garden is a lot to draw: only every other frame, unless the eye has moved.
      const moved = at.distanceTo(p.at) > 0.05;
      if (p.yard && !moved && frame - p.drawnAt < 2) continue;
      p.at.copy(at);
      p.drawnAt = frame;

      // Looking straight out, the frustum cut to the glass (its near plane the glass itself).
      const { eye } = p;
      eye.position.copy(at);
      eye.up.copy(up);
      eye.lookAt(v.copy(at).add(p.outward));
      eye.updateMatrixWorld();
      const local = p.corners.map((c) => c.clone().applyMatrix4(eye.matrixWorldInverse));
      const near = -local[0].z;
      const xs = local.map((c) => c.x);
      const ys = local.map((c) => c.y);
      eye.projectionMatrix.makePerspective(Math.min(...xs), Math.max(...xs), Math.max(...ys), Math.min(...ys), near, 6000);
      eye.projectionMatrixInverse.copy(eye.projectionMatrix).invert();

      const size = [((x1 - x0) / 2) * view.W * px, ((y1 - y0) / 2) * view.H * px].map((s) => Math.round(Math.max(16, Math.min(MAX_SIZE, s))));
      if (size[0] !== p.target.width || size[1] !== p.target.height) p.target.setSize(...size);

      const clips = renderer.clippingPlanes;
      renderer.clippingPlanes = NEVER;
      renderer.setRenderTarget(p.target);
      renderer.render(p.there, eye);
      if (p.yard) {
        // The front garden in front of what is painted beyond it.
        const shown = outside.map((g) => g.visible);
        outside.forEach((g) => (g.visible = true));
        p.glass.visible = false;
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(scene, eye);
        renderer.autoClear = true;
        p.glass.visible = true;
        outside.forEach((g, k) => (g.visible = shown[k]));
      }
      renderer.setRenderTarget(null);
      renderer.clippingPlanes = clips;
    }
  };
}
