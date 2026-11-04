/*******************************************************************************
 * What cooks at the wonton stall (stall.js builds the stall round it,
 * stall-life.js works it): the big pot of water on the boil, and the bubble
 * wontons (泡泡馄饨, as made in Wenzhou: a dab of pork smeared on a corner of
 * a wrapper thin as paper and the wrapper squeezed shut round it in the fist,
 * so that it cooks into a little puffed bubble with a frilled skirt), and
 * their bowls.
 *
 * The water is drawn by a shader of its own: a rolling boil (bubbles domed up
 * and bursting into rings, all over, faster stirred), rings spreading where
 * something drops in, the light of the sky and the lamp mirrored off it more
 * the flatter one looks across it, cloudy with starch beneath, a froth round
 * the rim. The wontons are one instanced mesh: on the tray as he makes them,
 * a handful in his hand, dropped in (a splash), sinking, and as they cook
 * rising and puffing up to float, carried round on the boil and kept apart;
 * scooped out in the strainer, and in a bowl: on its broth with the dried
 * shrimp, the laver and the spring onion, eaten one at a time off a spoon.
 * Steam goes up off the pot, and off a bowl while it is hot.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { pixelTexture } from "../room/house/kit.js";
import { rnd } from "../stage.js";

export const WATER_R = 6.4; // the water's radius, inside the pot
const MAX = 140; // wontons at once, wherever they are
const STEAM = 90; // puffs of steam at once
const COOK = [6, 9]; // s before a wonton dropped in comes up cooked, from .. to
const FLOAT_Y = 0.25; // how far a floating wonton's middle sits above the water
const BOWL_R = 3.4; // a bowl's radius, at its rim
const BOWL_H = 2.6;

/* ---------------------------------------------------------------------------------------------------------- */
/* A wonton: a puff in the middle (the pork, pink through the wrapper) on a frilled skirt, one unit across. */

function wontonGeometry() {
  const [rings, around] = [6, 18];
  const position = [];
  const color = [];
  const index = [];
  const pink = new THREE.Color("#e6b8a2");
  const wrapper = new THREE.Color("#f4efe4");
  const edge = new THREE.Color("#e2ddd2");
  const c = new THREE.Color();
  // (the top, from the middle out, then the same underneath, a little lower)
  for (const under of [0, 1]) {
    for (let i = 0; i <= rings; i++) {
      const r = i / rings;
      for (let j = 0; j < around; j++) {
        const a = (j / around) * Math.PI * 2;
        const reach = 0.5 * r * (1 + 0.16 * Math.sin(3 * a + 1) + 0.08 * Math.sin(7 * a));
        const puff = 0.34 * (1 - smooth(0, 0.5, r)); // the filling's bump
        const frill = 0.07 * Math.sin(5 * a + 2) * r ** 3 + 0.05 * (1 - r);
        const y = under ? -0.05 - 0.12 * (1 - smooth(0, 0.6, r)) + frill * 0.5 : puff + frill;
        position.push(Math.cos(a) * reach, y, Math.sin(a) * reach);
        c.copy(r < 0.42 ? pink.clone().lerp(wrapper, r / 0.42) : wrapper.clone().lerp(edge, (r - 0.42) / 0.58));
        color.push(c.r, c.g, c.b);
      }
    }
    const o = under * (rings + 1) * around;
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < around; j++) {
        const [a, b] = [o + i * around + j, o + i * around + ((j + 1) % around)];
        const [d, e] = [a + around, b + around];
        if (under) index.push(a, d, b, b, d, e);
        else index.push(a, b, d, b, e, d);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// The wrapper's look: a little sheen, a little glow (light through it).
const wontonMaterial = () => new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x2a2a2a, emissive: 0x3a3430 });

/* ---------------------------------------------------------------------------------------------------------- */
/* The water. */

const WATER_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vLocal;
  void main() {
    vLocal = position.xz;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const WATER_FRAG = /* glsl */ `
  uniform float uTime, uBoil, uSpin, uR, uFroth;
  uniform vec3 uSky, uGround, uSun, uSunDir, uLamp, uLampPos, uBroth;
  uniform vec4 uDrops[8];
  varying vec3 vWorld;
  varying vec2 vLocal;

  vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash2(i).x, b = hash2(i + vec2(1, 0)).x, c = hash2(i + vec2(0, 1)).x, d = hash2(i + vec2(1, 1)).x;
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  // The boil: in each cell a bubble comes up, swells into a dome and bursts into a ring that spreads and dies.
  float bubbles(vec2 p, float t) {
    vec2 g = floor(p), f = fract(p);
    float h = 0.0;
    for (int j = -1; j <= 1; j++)
      for (int i = -1; i <= 1; i++) {
        vec2 c = vec2(float(i), float(j));
        vec2 o = hash2(g + c);
        float per = 0.55 + 0.8 * o.x;
        float ph = fract(t / per + o.y);
        vec2 d = c + 0.5 + 0.3 * sin(6.2831 * o + t * 0.9) - f;
        float r = length(d);
        float size = 0.16 + 0.22 * o.y;
        float grow = smoothstep(0.0, 0.7, ph);
        h += ph < 0.72 ? (1.0 - smoothstep(0.0, size * (0.3 + grow), r)) * grow * 0.7 : 0.0;
        float age = ph - 0.72;
        h += ph >= 0.72 ? exp(-pow((r - age * 1.5) / 0.07, 2.0)) * (0.28 - age) * 2.2 : 0.0;
      }
    return h;
  }
  float height(vec2 q) {
    float t = uTime;
    float a = uSpin;
    vec2 p = mat2(cos(a), -sin(a), sin(a), cos(a)) * q;
    float r = length(q) / uR;
    // the boil, strongest over the flame in the middle; a slow swell under it
    float h = uBoil * (0.9 - 0.4 * r * r) * (bubbles(p * 0.95, t) * 0.55 + bubbles(p * 1.9 + 7.0, t * 1.3) * 0.25);
    h += 0.08 * sin(q.x * 0.9 + t * 1.7) * sin(q.y * 0.8 - t * 1.3);
    // rings where things dropped in
    for (int k = 0; k < 8; k++) {
      vec4 d = uDrops[k];
      float age = t - d.z;
      if (age < 0.0 || age > 2.5) continue;
      float s = length(q - d.xy);
      float front = age * 9.0;
      h += d.w * sin((s - front) * 3.2) * exp(-pow((s - front) / 2.2, 2.0)) * exp(-age * 1.6);
    }
    return h * (1.0 - smoothstep(0.9, 1.0, r) * 0.6); // (flatter where it meets the wall)
  }

  void main() {
    vec2 q = vLocal;
    float e = 0.12;
    float h = height(q);
    vec3 n = normalize(vec3(-(height(q + vec2(e, 0)) - h) / e * 0.55, 1.0, -(height(q + vec2(0, e)) - h) / e * 0.55));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    vec3 rf = reflect(-v, n);
    // mirrored: the sky above, the stall's canopy and the dusk round it lower down; the sun and the lamp
    vec3 env = mix(uGround, uSky, smoothstep(-0.1, 0.8, rf.y));
    vec3 toLamp = normalize(uLampPos - vWorld);
    vec3 spec = uSun * pow(max(dot(rf, uSunDir), 0.0), 220.0) * 3.0 + uLamp * pow(max(dot(rf, toLamp), 0.0), 60.0) * 1.6;
    // (and the bright open sky out in front of the canopy, glinting off the bubbles' sides)
    spec += uSky * pow(max(dot(rf, normalize(vec3(0.35, 0.75, 0.55))), 0.0), 24.0) * 0.9;
    // beneath: the broth cloudy with starch, lit by the sky and the lamp, darker in towards the pot's wall
    float r = length(q) / uR;
    float diffuse = 0.55 + 0.45 * max(dot(n, uSunDir), 0.0);
    vec3 body = uBroth * (uSky * 0.55 * diffuse + uLamp * 0.35 * max(dot(n, toLamp), 0.0) + uGround * 0.15);
    body *= mix(0.85, 0.55, smoothstep(0.35, 1.0, r));
    vec3 col = mix(body, env, fres) + spec;
    // the froth round the rim (starchy water on the boil), and where the bubbles burst
    float froth = uFroth * smoothstep(0.8, 0.97, r + 0.07 * noise(q * 2.6 + uTime * 0.6)) * (0.55 + 0.45 * noise(q * 5.0 - uTime));
    froth += uBoil * 0.25 * smoothstep(0.55, 0.9, h) ;
    col = mix(col, (uSky * 0.8 + uLamp * 0.5 + uGround * 0.2) * 0.95, clamp(froth, 0.0, 0.85));
    col *= 1.0 - 0.3 * smoothstep(0.94, 1.0, r); // (the meniscus, in the wall's shadow)
    gl_FragColor = vec4(col, 0.9);
    #include <colorspace_fragment>
  }
`;

/* ---------------------------------------------------------------------------------------------------------- */
/* Steam: soft puffs drawn as points, each growing and thinning as it goes up. */

const STEAM_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uHalfH;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * projectionMatrix[1][1] * uHalfH / -mv.z;
    vAlpha = aAlpha;
  }
`;
const STEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float f = smoothstep(0.5, 0.0, length(d));
    gl_FragColor = vec4(uColor, vAlpha * f * f);
    #include <colorspace_fragment>
  }
`;

/* ---------------------------------------------------------------------------------------------------------- */

// The pot's water and the wontons, in `parent` (the scene: they are placed in the world); the water's middle
// at `at` (its surface), the tray's corner and its places (`tray`: [x, y, z] each).
export function makeCooking(parent, clock) {
  const t = () => clock.t;

  /* ----- the water ----- */
  const uniforms = {
    uTime: { value: 0 },
    uBoil: { value: 1 },
    uSpin: { value: 0 },
    uR: { value: WATER_R },
    uFroth: { value: 0.6 },
    uSky: { value: new THREE.Color(1, 1, 1) },
    uGround: { value: new THREE.Color(0.4, 0.4, 0.4) },
    uSun: { value: new THREE.Color(1, 1, 1) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.9, 0.4).normalize() },
    uLamp: { value: new THREE.Color(0, 0, 0) },
    uLampPos: { value: new THREE.Vector3() },
    uBroth: { value: new THREE.Color("#e9e1cc") },
    uDrops: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -99, 0)) },
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(WATER_R, 48).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ uniforms, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true })
  );
  water.renderOrder = 1; // (after what is under it in the pot)
  parent.add(water);
  let dropAt = 0;
  // Rings spreading from (x, z) on the water (world), `size` high.
  function splash(x, z, size = 0.35) {
    uniforms.uDrops.value[dropAt].set(x - water.position.x, z - water.position.z, t(), size);
    dropAt = (dropAt + 1) % 8;
  }

  /* ----- the wontons ----- */
  const mesh = new THREE.InstancedMesh(wontonGeometry(), wontonMaterial(), MAX);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  parent.add(mesh);
  // Each one: where it is (`at`: "tray", "pot", "strainer", "bowl"; or `held` in a hand's group, drawn there),
  // its place [x, y, z], heading, tilt, how puffed up (0 raw, 1 cooked), and in the pot how long it has
  // cooked and its drift.
  const all = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s3 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const SIZE = 1.9; // a wonton's width, in voxels

  /* ----- the steam ----- */
  const steamGeometry = new THREE.BufferGeometry();
  const steamAt = new Float32Array(STEAM * 3);
  const steamSize = new Float32Array(STEAM);
  const steamAlpha = new Float32Array(STEAM);
  steamGeometry.setAttribute("position", new THREE.BufferAttribute(steamAt, 3));
  steamGeometry.setAttribute("aSize", new THREE.BufferAttribute(steamSize, 1));
  steamGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(steamAlpha, 1));
  const steamUniforms = { uHalfH: { value: 450 }, uColor: { value: new THREE.Color(1, 1, 1) } };
  const steam = new THREE.Points(
    steamGeometry,
    new THREE.ShaderMaterial({ uniforms: steamUniforms, vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false })
  );
  steam.frustumCulled = false;
  steam.renderOrder = 3;
  parent.add(steam);
  const puffs = []; // { x, y, z, vx, vy, vz, born, life, size }
  // Puffs coming off a surface of radius `r` at (x, y, z), `rate` a second.
  const vents = new Map(); // key -> { at: [x, y, z], r, rate, carry }
  function vent(key, at, r, rate) {
    if (!at || rate <= 0) return vents.delete(key);
    const v = vents.get(key) ?? { carry: Math.random() };
    Object.assign(v, { at, r, rate });
    vents.set(key, v);
  }

  /* ----- the bowls ----- */
  // A porcelain bowl, white with a blue band under the rim; in it what goes in first (the laver, the dried
  // shrimp, a little lard and salt), the broth over it, spring onion over that.
  const bowlTex = {
    bits: pixelTexture(64, 64, (g) => {
      g.fillStyle = "#f6f3ec";
      g.fillRect(0, 0, 64, 64);
      bitsOn(g, [
        ["#2f3a2c", 26, 5],
        ["#43523c", 14, 4],
        ["#f2a08a", 18, 2],
        ["#f7f1df", 6, 3],
      ]);
    }).tex,
    top: pixelTexture(64, 64, (g) => {
      g.clearRect(0, 0, 64, 64);
      bitsOn(g, [
        ["#6fae3e", 22, 2],
        ["#9fd060", 10, 2],
        ["#f2c94c", 8, 3],
        ["#2f3a2c", 10, 3],
        ["rgba(255,236,170,0.8)", 14, 1],
      ]);
    }).tex,
  };
  for (const k of ["bits", "top"]) bowlTex[k].magFilter = bowlTex[k].minFilter = THREE.LinearFilter;
  const bowlMat = new THREE.MeshPhongMaterial({ color: 0xf7f5ef, shininess: 60, specular: 0x444444 });
  const bandMat = new THREE.MeshPhongMaterial({ color: 0x3f63b8, shininess: 60, specular: 0x333333 });
  const bowlGeometry = new THREE.LatheGeometry(
    [
      [0, 0],
      [1.5, 0],
      [1.55, 0.3],
      [2.4, 0.7],
      [3.0, 1.4],
      [BOWL_R, BOWL_H],
      [BOWL_R - 0.25, BOWL_H],
      [2.75, 1.4],
      [2.1, 0.75],
      [1.3, 0.45],
      [0, 0.42],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    20
  );
  const bandGeometry = new THREE.CylinderGeometry(BOWL_R + 0.03, BOWL_R - 0.12, 0.45, 20, 1, true).translate(0, BOWL_H - 0.45, 0);
  const brothGeometry = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  const brothMat = new THREE.MeshPhongMaterial({ color: 0xd9b46a, transparent: true, opacity: 0.72, shininess: 90, specular: 0x888888 });
  const bitsMat = new THREE.MeshLambertMaterial({ map: bowlTex.bits });
  const topMat = new THREE.MeshLambertMaterial({ map: bowlTex.top, transparent: true, depthWrite: false });
  const bowls = [];
  function makeBowl() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(bowlGeometry, bowlMat);
    const band = new THREE.Mesh(bandGeometry, bandMat);
    const bits = new THREE.Mesh(brothGeometry, bitsMat);
    bits.position.y = 0.46;
    bits.scale.setScalar(1.45);
    const broth = new THREE.Mesh(brothGeometry, brothMat);
    const top = new THREE.Mesh(brothGeometry, topMat);
    body.castShadow = true;
    // (its wontons, on the broth)
    const inside = new THREE.InstancedMesh(mesh.geometry, mesh.material, 14);
    inside.count = 0;
    inside.frustumCulled = false;
    group.add(body, band, bits, broth, top, inside);
    group.visible = false;
    parent.add(group);
    const bowl = {
      group,
      // How full: `bits` in it, the broth's level (0 to 1), the spring onion on top; whose it is.
      bits: false,
      level: 0,
      onion: false,
      hot: 0, // (steaming, dying away as it cools)
      wontons: 0,
      by: null,
      // `n` wontons in it, floating on the broth (or sat in the bottom, before the broth is in).
      fill(n) {
        bowl.wontons = Math.max(0, Math.min(14, n));
        const y = 0.75 + bowl.level * (BOWL_H - 0.9);
        for (let i = 0; i < bowl.wontons; i++) {
          const a = i * 2.4;
          const r = i === 0 ? 0 : 0.8 + 1.2 * Math.sqrt(i / 14);
          e.set(0.15 * Math.sin(i * 1.7), a, 0.12 * Math.cos(i * 2.3));
          m4.compose(p3.set(Math.cos(a) * r, y + 0.15 * (i % 3), Math.sin(a) * r), q.setFromEuler(e), s3.set(SIZE * 1.05, SIZE, SIZE * 1.05));
          inside.setMatrixAt(i, m4);
        }
        inside.count = bowl.wontons;
        inside.instanceMatrix.needsUpdate = true;
      },
      set({ bits: b = bowl.bits, level = bowl.level, onion = bowl.onion }) {
        Object.assign(bowl, { bits: b, level, onion });
        bits.visible = b;
        const y = 0.5 + level * (BOWL_H - 0.9);
        const r = 1.45 + (BOWL_R - 0.35 - 1.45) * smooth(0, 1, level);
        broth.visible = level > 0.02;
        broth.position.y = top.position.y = y;
        broth.scale.setScalar(r);
        top.scale.setScalar(r * 0.92);
        top.visible = onion && level > 0.1;
        bowl.fill(bowl.wontons);
      },
      // Where the broth's surface is (world), and how far across.
      surface: () => [group.position.x, group.position.y + 0.5 + bowl.level * (BOWL_H - 0.9), group.position.z],
      place(x, y, z, shown = true) {
        group.position.set(x, y, z);
        group.visible = shown;
      },
      free: () => !group.visible,
    };
    bowl.set({ bits: false, level: 0, onion: false });
    return bowl;
  }
  for (let k = 0; k < 5; k++) bowls.push(makeBowl());

  /* ----- what each does ----- */

  // A new one, raw, at `at` ("tray", place) or held (a hand's group: the boss's).
  function add(where, [x, y, z]) {
    if (all.length >= MAX) return null;
    const w = { at: where, x, y, z, vx: 0, vz: 0, vy: 0, yaw: Math.random() * 6.28, tilt: 0, puff: 0, cooked: 0, cookAt: 0, bob: Math.random() * 6 };
    all.push(w);
    return w;
  }
  const remove = (w) => {
    const i = all.indexOf(w);
    if (i >= 0) all.splice(i, 1);
  };
  const inPot = () => all.filter((w) => w.at === "pot" || w.at === "falling");
  const cookedCount = () => all.filter((w) => w.at === "pot" && w.cooked >= 1).length;

  // Dropped from (x, y, z): falling into the pot, a little splash where it lands.
  function drop(w, [x, y, z]) {
    Object.assign(w, {
      at: "falling",
      x,
      y,
      z,
      vy: -2,
      vx: (Math.random() - 0.5) * 6,
      vz: (Math.random() - 0.5) * 6,
      cooked: 0,
      cookAt: t() + rnd(...COOK),
    });
  }

  let spinV = 0; // how fast the water goes round (stirred), radians a second
  const flow = { boil: 1 };

  // Each frame: the pot's wontons sink, cook, come up, float and drift; the steam goes up.
  function update(dt, light) {
    uniforms.uTime.value = t();
    spinV *= Math.exp(-0.5 * dt);
    uniforms.uSpin.value += spinV * dt;
    uniforms.uBoil.value = flow.boil * (1 + 0.6 * Math.min(1, Math.abs(spinV)));
    const level = water.position.y;
    const [cx, cz] = [water.position.x, water.position.z];
    const pot = all.filter((w) => w.at === "pot");
    for (const w of all) {
      if (w.at === "falling") {
        w.vy -= 60 * dt;
        w.x += w.vx * dt;
        w.z += w.vz * dt;
        w.y += w.vy * dt;
        keepIn(w, cx, cz, 1);
        if (w.y <= level) {
          splash(w.x, w.z, 0.3);
          Object.assign(w, { at: "pot", y: level - 0.4, vy: -3 });
        }
        continue;
      }
      if (w.at !== "pot") continue;
      // Raw, it goes down and rolls about near the bottom; cooked, it comes up, and puffs out.
      const done = t() >= w.cookAt;
      w.cooked = Math.min(1, w.cooked + (done ? dt / 1.2 : 0));
      w.puff = w.cooked;
      const want = done ? level + FLOAT_Y + 0.12 * Math.sin(t() * 3 + w.bob) : level - 3.2 + 0.4 * Math.sin(t() * 2 + w.bob);
      w.vy += ((want - w.y) * (done ? 6 : 2) - w.vy * 2.5) * dt;
      w.y += w.vy * dt;
      // The boil carries it out from the middle on top (and round, when stirred); a jostle now and then.
      const [dx, dz] = [w.x - cx, w.z - cz];
      const r = Math.hypot(dx, dz) || 1e-3;
      const out = (done ? 1.6 : -0.6) * flow.boil * (1 - r / WATER_R);
      const spin = spinV * r;
      w.vx += ((dx / r) * out - (dz / r) * spin + (Math.random() - 0.5) * 18 * flow.boil - w.vx * 2) * dt;
      w.vz += ((dz / r) * out + (dx / r) * spin + (Math.random() - 0.5) * 18 * flow.boil - w.vz * 2) * dt;
      w.yaw += (spinV * 0.6 + (Math.random() - 0.5) * 0.8) * dt;
      w.tilt = 0.12 * Math.sin(t() * 4 + w.bob) * flow.boil;
    }
    // Kept apart from one another, and in the pot.
    for (let i = 0; i < pot.length; i++) {
      const a = pot[i];
      for (let j = i + 1; j < pot.length; j++) {
        const b = pot[j];
        if (Math.abs(a.y - b.y) > 1.2) continue;
        const [dx, dz] = [b.x - a.x, b.z - a.z];
        const d = Math.hypot(dx, dz);
        const gap = SIZE * 0.85;
        if (d >= gap || d < 1e-4) continue;
        const push = ((gap - d) / d) * 0.5;
        a.x -= dx * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.z += dz * push;
      }
    }
    for (const w of pot) {
      w.x += w.vx * dt;
      w.z += w.vz * dt;
      keepIn(w, cx, cz, SIZE * 0.55);
    }

    // The steam: off the pot while it boils, off the bowls while hot.
    for (const v of vents.values()) {
      v.carry += v.rate * dt;
      for (; v.carry >= 1; v.carry--) {
        if (puffs.length >= STEAM) puffs.shift();
        const [a, rr] = [Math.random() * 6.28, Math.sqrt(Math.random()) * v.r];
        puffs.push({
          x: v.at[0] + Math.cos(a) * rr,
          y: v.at[1] + 0.3,
          z: v.at[2] + Math.sin(a) * rr,
          vx: (Math.random() - 0.5) * 1.5,
          vy: rnd(5, 8),
          vz: (Math.random() - 0.5) * 1.5,
          born: t(),
          life: rnd(1.8, 3),
          size: rnd(2.2, 3.4) * (v.r > 3 ? 1 : 0.6),
          seed: Math.random() * 6.28,
        });
      }
    }
    while (puffs.length && t() - puffs[0].born > puffs[0].life) puffs.shift();
    puffs.forEach((p, i) => {
      const age = (t() - p.born) / p.life;
      p.vy *= Math.exp(-0.5 * dt);
      p.x += (p.vx + 1.4 * Math.sin(t() * 1.3 + p.seed) + light.wind) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + 1.1 * Math.cos(t() * 1.1 + p.seed)) * dt;
      steamAt.set([p.x, p.y, p.z], i * 3);
      steamSize[i] = p.size * (1 + 2.6 * age);
      steamAlpha[i] = light.steam * 0.3 * smooth(0, 0.12, age) * (1 - smooth(0.35, 1, age));
    });
    steamGeometry.setDrawRange(0, puffs.length);
    for (const k of ["position", "aSize", "aAlpha"]) steamGeometry.attributes[k].needsUpdate = true;

    draw();
  }
  function keepIn(w, cx, cz, margin) {
    const [dx, dz] = [w.x - cx, w.z - cz];
    const r = Math.hypot(dx, dz);
    const most = WATER_R - margin;
    if (r > most) {
      w.x = cx + (dx / r) * most;
      w.z = cz + (dz / r) * most;
      w.vx *= -0.3;
      w.vz *= -0.3;
    }
  }
  // Every wonton drawn where it is (those held in a hand are drawn by their hand's group: not here).
  function draw() {
    let n = 0;
    for (const w of all) {
      if (w.at === "held") continue;
      const squash = 0.55 + 0.45 * w.puff; // (raw: flat; cooked: puffed up)
      const spread = 0.85 + 0.25 * w.puff;
      e.set(w.tilt, w.yaw, w.tilt * 0.6);
      q.setFromEuler(e);
      s3.set(SIZE * spread, SIZE * squash, SIZE * spread);
      m4.compose(p3.set(w.x, w.y, w.z), q, s3);
      mesh.setMatrixAt(n++, m4);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    water,
    mesh,
    bowls,
    all,
    add,
    remove,
    drop,
    splash,
    vent,
    inPot,
    cookedCount,
    SIZE,
    geometry: mesh.geometry,
    material: mesh.material,
    // Stirred: the water set going round (more each time), the wontons with it.
    stir(k = 1) {
      spinV = Math.min(2.2, spinV + 0.9 * k);
    },
    // Poked (clicked): the water swirled, rings across it, every wonton in it bobbed up and jostled.
    poke() {
      spinV = Math.min(2.2, spinV + 1.1);
      for (let k = 0; k < 3; k++) {
        const [a, r] = [Math.random() * Math.PI * 2, Math.random() * WATER_R * 0.6];
        splash(water.position.x + Math.cos(a) * r, water.position.z + Math.sin(a) * r, 0.45);
      }
      for (const w of all)
        if (w.at === "pot") {
          w.vy += rnd(4, 8);
          w.vx += rnd(-6, 6);
          w.vz += rnd(-6, 6);
        }
    },
    // How hard it boils (0: off the flame), and the froth with it.
    boil(k) {
      flow.boil = k;
      uniforms.uFroth.value = 0.6 * k;
    },
    // The sky's light (and the sun's) on it, and the stall's lamp.
    light({ sky, ground, sun, sunDir, lamp, lampAt }) {
      uniforms.uSky.value.copy(sky);
      uniforms.uGround.value.copy(ground);
      uniforms.uSun.value.copy(sun);
      uniforms.uSunDir.value.copy(sunDir);
      uniforms.uLamp.value.copy(lamp);
      uniforms.uLampPos.value.set(...lampAt);
      steamUniforms.uColor.value.copy(sky).multiplyScalar(0.55).add(lamp.clone().multiplyScalar(0.6)).addScalar(0.18);
    },
    // The steam's points sized for the canvas `h` px high.
    size: (h) => (steamUniforms.uHalfH.value = h / 2),
    update,
    // All of them gone (packed up, or the time jumped), the bowls put away, the water still.
    clear() {
      all.length = 0;
      puffs.length = 0;
      bowls.forEach((b) => {
        b.place(0, 0, 0, false);
        b.set({ bits: false, level: 0, onion: false });
        b.fill(0);
        b.by = null;
        b.hot = 0;
      });
      spinV = 0;
      draw();
    },
  };
}

// Bits scattered over a picture of a bowl's inside: [colour, how many, how big] each, inside its round.
function bitsOn(g, kinds) {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [color, n, size] of kinds) {
    g.fillStyle = color;
    for (let k = 0; k < n; k++) {
      const [a, r] = [rand() * 6.28, Math.sqrt(rand()) * 27];
      const [x, y] = [32 + Math.cos(a) * r, 32 + Math.sin(a) * r];
      g.save();
      g.translate(x, y);
      g.rotate(rand() * 3);
      g.fillRect(-size, -size / 2, size * 2 * (0.6 + rand() * 0.8), size);
      g.restore();
    }
  }
}
