/*******************************************************************************
 * The long mirror in the girl's dressing corner, showing the room in it. Each
 * frame the scene is drawn again as seen from the camera's mirror image behind
 * the glass, cropped to just the glass, into a small texture (about as many
 * texels as the glass has pixels on screen); the glass shows it a little soft
 * (a small gaussian blur) and silvered, with a faint gleam across it. Whatever
 * is behind the glass is cut away while drawing it. Of the floor's big meshes
 * that never move, only the triangles the glass can show are drawn.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { UNCUT } from "./view.js";

const MAX_SIZE = 256; // texels across the texture at most
const BLUR = 1.5 / 8; // how far past its edges the glass shows, of its size: the blur's reach, 1.5 texels, at 8 across (the fewest)

// `glass` is a plane facing out of the mirror (house.js's closet.glass); `still`, meshes that never move
// (one indexed geometry each), drawn in it cut down to what shows from the camera's way `ends`. Returns the drawing of the reflection, to run each frame just before the view
// is drawn.
export function makeMirror(glass, view, scene, still = [], ends = [new THREE.Vector3(), new THREE.Vector3()]) {
  const { renderer, camera } = view;
  const target = new THREE.WebGLRenderTarget(1, 1);
  const mirrored = new THREE.PerspectiveCamera();
  mirrored.layers.enable(UNCUT); // (anyone indoors: room.js)
  const textureMatrix = new THREE.Matrix4();
  const texel = new THREE.Vector2();
  glass.material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: target.texture },
      matrix: { value: textureMatrix },
      texel: { value: texel },
      tint: { value: new THREE.Color(glass.material.color) },
      opacity: { value: 1 }, // (less while the back wall fades: peek.js)
    },
    clipping: true, // (cut away with the rest by view.js's planes: the dressing corner's, seen from the basement)
    vertexShader: /* glsl */ `
      uniform mat4 matrix;
      varying vec4 vAt;
      varying vec2 vUv;
      #include <clipping_planes_pars_vertex>
      void main() {
        vAt = matrix * vec4(position, 1.0);
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec2 texel;
      uniform vec3 tint;
      uniform float opacity;
      varying vec4 vAt;
      varying vec2 vUv;
      #include <clipping_planes_pars_fragment>
      void main() {
        #include <clipping_planes_fragment>
        vec2 at = vAt.xy / vAt.w;
        vec4 sum = vec4(0.0); // 1 2 1 / 2 4 2 / 1 2 1, over 16
        for (int i = -1; i <= 1; i++)
          for (int j = -1; j <= 1; j++) sum += texture2D(map, at + vec2(i, j) * texel) * float((2 - abs(i)) * (2 - abs(j)));
        sum /= 16.0;
        vec3 seen = sum.rgb + tint * (1.0 - sum.a); // the bare glass where nothing is drawn
        float gleam = step(fract((vUv.x * 17.0 + vUv.y * 43.0) / 11.0), 0.15);
        gl_FragColor = vec4(mix(seen, tint, 0.1) + 0.05 * gleam, opacity);
        #include <colorspace_fragment>
      }`,
  });

  const { width, height } = glass.geometry.parameters;
  const CORNERS = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3((sx * width) / 2, (sy * height) / 2, 0)));
  const at = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const v = new THREE.Vector3();
  const plane = new THREE.Plane();
  const clip = new THREE.Plane();
  const [q, c] = [new THREE.Vector4(), new THREE.Vector4()];
  const crop = new THREE.Matrix4();
  const mirror = (p) => p.addScaledVector(normal, -2 * plane.distanceToPoint(p));
  // The glass's extent in normalized device coordinates, as `cam` sees it.
  const extent = (cam) => {
    const ndc = CORNERS.map((c) => v.copy(c).applyMatrix4(glass.matrixWorld).project(cam).toArray());
    return [0, 1].map((k) => [Math.min(...ndc.map((p) => p[k])), Math.max(...ndc.map((p) => p[k]))]);
  };

  // Of the meshes that never move (`still`), only the triangles the glass can show from anywhere on the
  // camera's `way` ([from, to], a straight line: down to the basement and back; the camera moves only as the
  // view turns or goes up or down a floor, never as it is laid out or zoomed). From one place, those in the
  // pyramid from its mirror image through the glass (wider all round by the blur's reach, BLUR); from anywhere
  // on the way, in the wedge round the glass holding the pyramids from both ends (each side, the flatter of
  // theirs through that edge). Drawn in the mirror by a stand-in each: its own vertices, and the first
  // `drawRange.count` of its index those triangles. Worked out once.
  const way = new THREE.Line3(...ends);
  const nowhere = new THREE.PerspectiveCamera(1, 1, 1, 2);
  nowhere.position.set(0, 1e7, 0); // (nothing in view)
  nowhere.updateMatrixWorld();
  const standIns = still.map((m) => {
    const g = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(m.geometry.attributes)) g.setAttribute(name, a);
    g.setIndex(new THREE.BufferAttribute(new m.geometry.index.array.constructor(m.geometry.index.count), 1));
    const s = new THREE.Mesh(g, m.material);
    s.position.copy(m.position);
    s.quaternion.copy(m.quaternion);
    s.scale.copy(m.scale);
    s.receiveShadow = m.receiveShadow;
    s.visible = false;
    m.parent.add(s);
    return s;
  });
  if (still.length) {
    glass.updateWorldMatrix(true, false);
    at.setFromMatrixPosition(glass.matrixWorld);
    normal.set(0, 0, 1).transformDirection(glass.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal, at);
    const edge = [-1, 1, 1, -1].map((sx, i) =>
      new THREE.Vector3(sx * width, (i < 2 ? -1 : 1) * height, 0).multiplyScalar(0.5 + BLUR).applyMatrix4(glass.matrixWorld)
    );
    const apexes = ends.map((p) => mirror(p.clone()));
    const beyond = (p, e) => p.clone().multiplyScalar(2).sub(e); // on past p from e, as far again
    const sides = edge.map((a, i) => {
      const b = edge[(i + 1) % 4];
      const middle = a.clone().add(b).multiplyScalar(0.5);
      const through = apexes.map((e) => {
        const side = new THREE.Plane().setFromCoplanarPoints(a, b, e);
        return side.distanceToPoint(beyond(at, e)) < 0 ? side.negate() : side;
      });
      return through.find((side) => apexes.every((e) => side.distanceToPoint(beyond(middle, e)) > -1e-3));
    });
    const bounds = [plane, ...sides].map((b) => [b.normal.x, b.normal.y, b.normal.z, b.constant]);
    still.forEach((m, k) => {
      m.updateWorldMatrix(true, false);
      const e = m.matrixWorld.elements;
      const p = m.geometry.attributes.position.array;
      const outside = new Uint8Array(p.length / 3); // which bounds each vertex is beyond
      for (let i = 0, j = 0; j < p.length; i++, j += 3) {
        const [x, y, z] = [p[j], p[j + 1], p[j + 2]];
        const [wx, wy, wz] = [
          e[0] * x + e[4] * y + e[8] * z + e[12],
          e[1] * x + e[5] * y + e[9] * z + e[13],
          e[2] * x + e[6] * y + e[10] * z + e[14],
        ];
        bounds.forEach(([a, b, c, d], n) => a * wx + b * wy + c * wz + d < 0 && (outside[i] |= 1 << n));
      }
      const from = m.geometry.index.array;
      const index = standIns[k].geometry.index.array;
      let n = 0;
      for (let t = 0; t < from.length; t += 3)
        if (!(outside[from[t]] & outside[from[t + 1]] & outside[from[t + 2]])) {
          index[n++] = from[t];
          index[n++] = from[t + 1];
          index[n++] = from[t + 2];
        }
      standIns[k].geometry.setDrawRange(0, n);
    });
  }

  return function drawReflection() {
    glass.updateWorldMatrix(true, false);
    at.setFromMatrixPosition(glass.matrixWorld);
    normal.set(0, 0, 1).transformDirection(glass.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal, at);
    eye.setFromMatrixPosition(camera.matrixWorld);
    if (plane.distanceToPoint(eye) <= 0) return; // the glass seen from behind

    // The camera mirrored in the glass, looking the mirrored way.
    const [[u0, u1], [w0, w1]] = extent(camera);
    if (u1 < -1 || u0 > 1 || w1 < -1 || w0 > 1) return; // the glass out of the view

    v.set(0, 0, -1).transformDirection(camera.matrixWorld).add(eye); // a point straight ahead of the camera
    mirrored.position.copy(mirror(eye));
    mirrored.up.set(0, 1, 0).transformDirection(camera.matrixWorld).reflect(normal);
    mirrored.lookAt(mirror(v));
    mirrored.updateMatrixWorld();
    mirrored.projectionMatrix.copy(camera.projectionMatrix);

    // Only the glass drawn, at about the glass's size on screen.
    const [[x0, x1], [y0, y1]] = extent(mirrored);
    crop.set(2 / (x1 - x0), 0, 0, -(x1 + x0) / (x1 - x0), 0, 2 / (y1 - y0), 0, -(y1 + y0) / (y1 - y0), 0, 0, 1, 0, 0, 0, 0, 1);
    mirrored.projectionMatrix.premultiply(crop);
    const px = renderer.getPixelRatio();
    const size = [((u1 - u0) / 2) * view.W * px, ((w1 - w0) / 2) * view.H * px].map((s) => Math.round(Math.max(8, Math.min(MAX_SIZE, s))));
    if (size[0] !== target.width || size[1] !== target.height) target.setSize(...size);
    texel.set(1 / size[0], 1 / size[1]);
    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    textureMatrix.multiply(mirrored.projectionMatrix).multiply(mirrored.matrixWorldInverse).multiply(glass.matrixWorld);

    // Whatever is behind the glass cut away: the near plane tilted onto the glass (an oblique projection,
    // as three.js's Reflector does), which leaves x and y, and so the texture matrix, as they are.
    clip.copy(plane).applyMatrix4(mirrored.matrixWorldInverse);
    const e = mirrored.projectionMatrix.elements;
    q.set((Math.sign(clip.normal.x) + e[8]) / e[0], (Math.sign(clip.normal.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    c.set(clip.normal.x, clip.normal.y, clip.normal.z, clip.constant);
    c.multiplyScalar(2 / c.dot(q));
    [e[2], e[6], e[10], e[14]] = [c.x, c.y, c.z + 1, c.w];

    // The stand-ins drawn instead while the camera is on its way. Any shadows to be drawn this frame are drawn
    // first, from the meshes whole (three.js draws them in the first render after they are asked for: here
    // one that sees nothing, but by the same layers, so with the same things casting them).
    const standing = still.length && way.closestPointToPoint(camera.position, true, v).distanceTo(camera.position) < 1e-3;
    const swap = (on) => still.forEach((m, k) => ((m.visible = !on), (standIns[k].visible = on)));
    glass.visible = false;
    renderer.setRenderTarget(target);
    if (standing && renderer.shadowMap.needsUpdate) {
      nowhere.layers.mask = mirrored.layers.mask;
      renderer.render(scene, nowhere);
    }
    if (standing) swap(true);
    renderer.render(scene, mirrored);
    renderer.setRenderTarget(null);
    glass.visible = true;
    if (standing) swap(false);
  };
}
