/*******************************************************************************
 * The front garden, out of the front door behind the back wall (layout.js's
 * YARD), seen when the view turns round to it or through the back wall when
 * it fades (view.js, peek.js). From the door a brick path runs down the middle
 * to a white gate in the picket fence, and past it the lane. On the left, a
 * cherry tree in blossom with a rope swing and a bird box; on the right, a
 * pond with lily pads and reeds and a bench by it, and further on a picnic
 * blanket on the lawn by the bird bath, a hammock (with a parasol that opens over it in the rain) and a wheelbarrow of flowers. Flowers grow along the
 * wall and the fence, soft hedges close it in at the sides, tufts of grass
 * where the mower does not reach, and his bike leans by the door. Garden
 * lanterns stand on the gateposts and along the path, and a street lamp with
 * a basket of flowers on the lane. The house is clad in duck-egg weatherboards (shell.js);
 * on it, a little porch roof over the door, the porch lantern, a wreath on
 * the door, the letterbox, a rose on a trellis, a window box trailing flowers at
 * the bedroom window, a garland of little bulbs, the downpipe and the
 * outside tap. The lamps and bulbs come on at night, and the gate swings
 * open for anyone going through it. Who lives in it (ducks, birds, a
 * frog...) is in wildlife.js.
 *
 * It has its own floor plan (`obstacles` within `bounds`, for its own nav.js):
 * the wall between it and the house is only crossed at the front door
 * (acts/outings.js). `spots` are where they go out here.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, hash, pivotGroup } from "../../models/voxels.js";
import { YARD, BACK, DOOR, WALL_T, WALL_H } from "./layout.js";
import { pixelTexture, solid, solidMaterial, turned } from "./kit.js";
import { TURNED_YAW } from "../view.js";

// The garden's own colours.
const C = {
  cushion: "#efe6d2",
  cushionDark: "#ddd1b8",
  pillowSage: "#9fb89a",
  pillowMustard: "#e0b44e",
  canvas: "#f3ead6",
  canvasTeal: "#5fa8a0",
  canvasCoral: "#e48a6e",
  throwRose: "#d98c94",
  throwRoseDark: "#c37780",
  hedge: "#4f8f3e",
  hedgeLight: "#62a24b",
  hedgeDark: "#3f7a32",
  leaf: "#6aa84f",
  leafDark: "#4e8a3c",
  stem: "#5c8f3e",
  bark: "#7a5236",
  barkDark: "#5e3d27",
  barkLight: "#94673f",
  blossom: "#f2a7c3",
  blossomMid: "#f6bcd3",
  blossomLight: "#fad0e0",
  blossomDeep: "#e48db3",
  blossomShade: "#cf739d",
  blossomWhite: "#fde6ee",
  picket: "#f7f3ea",
  picketShade: "#e3dccd",
  stone: "#c9c1b3",
  stoneDark: "#aaa192",
  stoneLight: "#ddd6ca",
  lily: "#6fb35a",
  lilyDark: "#4f9a46",
  lotus: "#f7a8c4",
  lotusHeart: "#ffe07a",
  reed: "#7aa851",
  cattail: "#7a4f2e",
  bench: "#c98f5a",
  benchDark: "#a8733f",
  iron: "#3d4a3f",
  rope: "#d8c49a",
  plank: "#b07c4a",
  red: "#e5504f",
  redDark: "#b83a3a",
  yellow: "#f6cf4a",
  pink: "#f4a3b8",
  white: "#fbf8f1",
  lavender: "#a58fd6",
  lavenderDark: "#7f6bbd",
  sage: "#a9b8a0",
  blue: "#7fa6e0",
  blueLight: "#a9c4f0",
  orange: "#f2a541",
  peach: "#f7c4a0",
  navy: "#3f5a8a",
  navyDark: "#2f4670",
  tyre: "#2f2f33",
  spoke: "#c3c9cf",
  saddle: "#6b4a32",
  wicker: "#c9a36a",
  wickerDark: "#a8834a",
  lamp: "#3a5446",
  lampDark: "#2c4236",
  moss: "#5e8a45",
  flagstone: "#d3cab8",
  flagstoneDark: "#bfb4a0",
  flagstoneLight: "#e2dbcd",
  flagstoneEdge: "#a39a88",
  lampLit: "#ffe7a3",
  brass: "#d8a945",
  pillar: "#d23a32",
  pillarDark: "#2a2522",
  pot: "#c97a52",
  potDark: "#a8603f",
  gnomeRed: "#e5504f",
  gnomeBlue: "#5a7fc4",
  skin: "#f6d2b8",
  beard: "#fbf8f1",
  barrow: "#5aa0a0",
  barrowDark: "#3f7f80",
  pipe: "#8b939b",
  steel: "#c3c9cf",
  hose: "#4f9a4a",
  frame: "#f7f3ea",
  shutter: "#6f8aa8",
  shutterDark: "#5a7493",
  soil: "#6b4a32",
  soilDark: "#56391f",
  mat: "#b4875a",
  matDark: "#8f6a44",
  wreath: "#4f8f3e",
  berry: "#d9334a",
  birdhouse: "#e9d6b6",
  roof: "#c46a52",
  roofDark: "#a8553f",
  frameShade: "#e9e4d8",
  sunflower: "#f6c83a",
  seeds: "#6b4a2a",
};

// Where things are, in the garden's own floor plan (x along the house, z out from the back wall).
const GATE = { x0: DOOR.x - 9, x1: DOOR.x + 9 }; // in line with the front door
const PATH = { x0: DOOR.x - 8, x1: DOOR.x + 8 };
const PORCH = { x0: DOOR.x - 22, x1: DOOR.x + 22, z0: YARD.z1 - 20 };
const TREE = [-114, -176];
const SWING = { x: -82, z: -198, top: 56, seat: 8.5 }; // hung from a branch at `top`, the seat at `seat`
const POND = { x: 60, z: -192, rx: 30, rz: 15 };
const BENCH = { x: -8, z: -148, half: 17, turn: TURNED_YAW - Math.PI }; // on the lawn by the path, facing the turned view and the pond
const BATH = [50, -145]; // (out on the lawn between the bench and the hammock, left of the vegetable garden: house/garden.js)
// On the lawn by the wall, the head to the west, its foot end clear of the garden's fence (the way along
// the fence to the tap: sprinkler.js).
const HAMMOCK = { x: 100, z: -140, yaw: Math.PI / 2 };
const PICNIC = { x: 118, z: -202 }; // the blanket out on the open lawn past the pond, by the bird bath
// The lamps: a lantern on top of each gatepost, low lanterns on posts either side of the path, the street
// lamp at the kerb out on the lane (a basket of flowers hanging off it) and the porch lantern by the door.
const GATE_LAMPS = [GATE.x0 - 2, GATE.x1 + 2].map((x) => [x, 22, YARD.fence]);
const PATH_LAMPS = [-158, -205].flatMap((z) => [PATH.x0 - 8, PATH.x1 + 8].map((x) => [x, z]));
const STREET_LAMP = [80, YARD.z0 + 2];
const STREET_Y = 32; // how high its lantern hangs
const PORCH_LAMP = [DOOR.x - 17, 44, YARD.z1 - 2.5];
const LANE = { z0: YARD.z0, z1: YARD.fence - 2 };
export const SUN_LAYER = 2; // what casts a shadow in the sun (room.js): only what is out here

// How wet everything out here looks after rain (`soak`): darker, and on what lies flat a faint sheen of the
// sky; much less so under the cherry tree and the porch roof. Each material out here gets it (`wetten`).
const WET = {
  uWet: { value: 0 },
  uSheen: { value: new THREE.Color("#cfdde6") },
  uTree: { value: new THREE.Vector2() },
  uPorch: { value: new THREE.Vector3() },
};
function wetten(material) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, WET);
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying vec3 vWetAt;\nvarying float vWetUp;\nvoid main() {")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvWetAt = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWetUp = normalize(mat3(modelMatrix) * objectNormal).y;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform float uWet;\nuniform vec3 uSheen;\nuniform vec2 uTree;\nuniform vec3 uPorch;\nvarying vec3 vWetAt;\nvarying float vWetUp;\nvoid main() {"
      )
      .replace(
        "#include <dithering_fragment>",
        [
          "float underTree = 1.0 - smoothstep(20.0, 36.0, distance(vWetAt.xz, uTree));",
          "float underPorch = step(abs(vWetAt.x - uPorch.x), uPorch.y) * step(uPorch.z, vWetAt.z);",
          "float wet = uWet * (1.0 - 0.8 * max(underTree, underPorch));",
          "gl_FragColor.rgb *= 1.0 - 0.3 * wet;",
          "gl_FragColor.rgb = mix(gl_FragColor.rgb, uSheen, 0.14 * wet * smoothstep(0.75, 0.98, vWetUp));",
          "#include <dithering_fragment>",
        ].join("\n")
      );
  };
  return material;
}

export function buildYard(shared) {
  const { scene, updates, water: drops, clickables } = shared;
  const group = new THREE.Group();
  scene.add(group);
  const yardMaterial = wetten(solidMaterial.clone());
  const mesh = (p) => solid(p, C, yardMaterial);
  const obstacles = []; // [x0, x1, z0, z1] footprints, for finding the way round out here
  let night = false;
  const block = (x0, x1, z0, z1) => obstacles.push([x0, x1, z0, z1]);
  const flat = new Set(); // the ground, and what is on the house's wall: they take shadows but cast none

  /* ---------- the ground: lawn, path, porch, lane ---------- */

  // A flat textured piece of ground over [x0, x1] x [z0, z1] at height y, its texture `tex` one texel per
  // voxel (repeating every `w` x `h`), lined up with the world.
  function ground(tex, [w, h], x0, x1, z0, z1, y) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) uv.setXY(i, (x0 + (x1 - x0) / 2 + position.getX(i)) / w, -(z0 + (z1 - z0) / 2 - position.getY(i)) / h);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const m = new THREE.Mesh(g, wetten(new THREE.MeshLambertMaterial({ map: tex })));
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    group.add(m);
    flat.add(m);
    return m;
  }
  // The lawn, freshly mown in broad stripes of two close greens: in each, blades a shade lighter or darker
  // here and there, a little lusher or drier in soft patches, and scattered through it daisies, buttercups
  // and clover (with now and then a flower on it). One texel a voxel, a tile big enough not to show repeats.
  const LAWN = 128;
  const lawn = pixelTexture(LAWN, LAWN, (g, w, h) => {
    const GREENS = [
      ["#86bf62", "#8ec56b", "#95ca72", "#9dd07a"],
      ["#8fc76c", "#97cc73", "#9fd27b", "#a8d783"],
    ]; // darker to lighter, in the one stripe and the other
    // A soft patch value from a coarse grid of hashes, smoothly blended (repeating with the tile).
    const patch = (x, y) => {
      const [u, v] = [x / 16, y / 16];
      const [i, j] = [Math.floor(u), Math.floor(v)];
      const [fu, fv] = [u - i, v - j].map((f) => f * f * (3 - 2 * f));
      const at = (a, b) => hash(((a % 8) + 8) % 8, ((b % 8) + 8) % 8, 49);
      const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fu;
      const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fu;
      return top + (bottom - top) * fv;
    };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const stripe = Math.floor(x / 16) % 2;
        const k = Math.floor(Math.min(3.99, Math.max(0, 1.4 + (patch(x, y) - 0.5) * 2.2 + (hash(x, y, 41) - 0.5) * 2.4)));
        g.fillStyle = GREENS[stripe][k];
        g.fillRect(x, y, 1, 1);
      }
    const dot = (x, y, c) => {
      g.fillStyle = c;
      g.fillRect((x + w) % w, (y + h) % h, 1, 1);
    };
    for (let n = 0; n < 46; n++) {
      const [x, y] = [Math.floor(hash(n, 1, 42) * w), Math.floor(hash(n, 2, 42) * h)];
      const kind = hash(n, 3, 42);
      if (kind < 0.4) {
        // A daisy: white petals round a yellow eye, a second one close by.
        dot(x, y, "#fff6c9");
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          dot(x + dx, y + dy, "#ffffff");
        if (hash(n, 4, 42) < 0.5) dot(x + 3, y + 2, "#ffffff");
      } else if (kind < 0.6) {
        // Buttercups, two or three.
        dot(x, y, "#f7d64a");
        dot(x + 2, y + 1, "#f7d64a");
        if (hash(n, 4, 42) < 0.5) dot(x - 1, y + 2, "#f2c93a");
      } else {
        // A clover patch: pale trefoils, sometimes a pink or white head.
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [2, 2],
          [3, 2],
          [2, 3],
          [-1, 3],
        ])
          dot(x + dx, y + dy, "#b5dc86");
        if (hash(n, 4, 42) < 0.45) dot(x + 1, y + 1, hash(n, 5, 42) < 0.5 ? "#f2b8cf" : "#fbf8f1");
      }
    }
  });
  ground(lawn.tex, [LAWN, LAWN], YARD.x0, YARD.x1, LANE.z1, YARD.z1, -0.5);
  // Old red bricks in a herringbone, a darker edging brick down either side.
  const bricks = pixelTexture(16, 16, (g, w, h) => {
    const tones = ["#c46a52", "#b65f48", "#cf7a5f", "#bb6a50"];
    g.fillStyle = "#d9cbb0"; // the mortar
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 8; k++)
      for (let j = 0; j < 2; j++) {
        const [ox, oy] = [(k * 2 + j * 8) % 16, (k * 2) % 16];
        g.fillStyle = tones[(k + j) % 4];
        if (j) g.fillRect(ox, oy, 1, 3);
        else g.fillRect(ox, oy, 3, 1);
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (hash(x, y, 43) < 0.5 && g.getImageData(x, y, 1, 1).data[0] < 210) {
          g.fillStyle = tones[Math.floor(hash(x, y, 44) * 4)];
          g.fillRect(x, y, 1, 1);
        }
  });
  ground(bricks.tex, [16, 16], PATH.x0, PATH.x1, LANE.z1, PORCH.z0, -0.42);
  const edging = part();
  for (let z = LANE.z1; z < PORCH.z0; z++)
    for (const x of [PATH.x0 - 1, PATH.x1]) edging.add(x, -0.3, z, hash(x, z, 45) < 0.5 ? "stoneDark" : "stone");
  // The porch: big worn flagstones.
  const flags = pixelTexture(24, 24, (g, w, h) => {
    g.fillStyle = "#b5ab9b";
    g.fillRect(0, 0, w, h);
    [
      [0, 0, 11, 9],
      [12, 0, 12, 13],
      [0, 10, 11, 14],
      [12, 14, 12, 10],
    ].forEach(([x, y, fw, fh], i) => {
      for (let v = 0; v < fh - 1; v++)
        for (let u = 0; u < fw - 1; u++) {
          const r = hash(x + u, y + v, 46 + i);
          g.fillStyle = r < 0.15 ? "#c2b9aa" : r > 0.9 ? "#d8d1c4" : "#cdc5b6";
          g.fillRect(x + u, y + v, 1, 1);
        }
    });
  });
  ground(flags.tex, [24, 24], PORCH.x0, PORCH.x1, PORCH.z0, YARD.z1, -0.4);
  // The lane: pavement slabs, and a granite kerb along its edge.
  const pavement = pixelTexture(16, 16, (g, w, h) => {
    g.fillStyle = "#a7a197";
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (x % 8 && y % 8) {
          const r = hash(x, y, 47);
          g.fillStyle = r < 0.12 ? "#bdb7ad" : r > 0.93 ? "#d2cdc4" : "#c8c2b8";
          g.fillRect(x, y, 1, 1);
        }
  });
  ground(pavement.tex, [16, 16], YARD.x0, YARD.x1, LANE.z0 + 3, LANE.z1, -0.5);
  const kerb = part();
  for (let x = YARD.x0; x < YARD.x1; x++)
    for (let z = LANE.z0; z < LANE.z0 + 3; z++) kerb.add(x, -0.2, z, (Math.floor(x / 6) + z) % 3 ? "stone" : "stoneDark");

  // The cut edge of the ground, like the house's: a band of turf on soil.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(YARD.x1 - YARD.x0, 8, YARD.z1 - YARD.z0),
    wetten(new THREE.MeshLambertMaterial({ color: "#8a5a34" }))
  );
  slab.position.set((YARD.x0 + YARD.x1) / 2, -4.6, (YARD.z0 + YARD.z1) / 2);
  const turf = new THREE.Mesh(
    new THREE.BoxGeometry(YARD.x1 - YARD.x0 + 0.1, 1.6, YARD.z1 - YARD.z0 + 0.1),
    wetten(new THREE.MeshLambertMaterial({ color: "#6fae52" }))
  );
  turf.position.set((YARD.x0 + YARD.x1) / 2, -1.4, (YARD.z0 + YARD.z1) / 2);
  group.add(slab, turf);
  flat.add(slab).add(turf);

  /* ---------- hedges, the fence and the gate ---------- */

  const green = part();
  // A soft clipped hedge over [x0, x1] x [z0, z1], about `h` high: billowing gently along its top, rounded
  // over at its sides, darker low down and lighter where the sun is on it, a few small white flowers.
  function hedge(x0, x1, z0, z1, h) {
    const [mx, mz] = [(x0 + x1) / 2, (z0 + z1) / 2];
    const [hx, hz] = [(x1 - x0) / 2 + 0.5, (z1 - z0) / 2 + 0.5];
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        const along = x1 - x0 > z1 - z0 ? x : z;
        const across = x1 - x0 > z1 - z0 ? Math.abs(z - mz) / hz : Math.abs(x - mx) / hx; // 0 in the middle, 1 at the side
        const top = Math.round(h + 1.2 * Math.sin(along / 7) + 0.8 * Math.sin(along / 3.1) - 3 * across ** 3);
        for (let y = 0; y <= top; y++) {
          const r = hash(x, y, z);
          const lit = y / top + (r - 0.5) * 0.3;
          const c = y === top && r < 0.04 ? "white" : lit > 0.85 ? "hedgeLight" : lit > 0.35 ? "hedge" : "hedgeDark";
          green.add(x, y, z, c);
        }
      }
    block(x0, x1 + 1, z0, z1 + 1);
  }
  // A round shrub at [x, z], `r` across, top-lit like the hedges.
  function shrub(x, z, r) {
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++)
        for (let y = 0; y <= r * 1.6; y++) {
          const d = (dx / r) ** 2 + (dz / r) ** 2 + ((y - r * 0.8) / (r * 0.8)) ** 2;
          if (d > 1 || d < 0.55) continue;
          const lit = (y - r * 0.8) / (r * 0.8) + (hash(dx, y, dz) - 0.5) * 0.5;
          green.add(x + dx, y, z + dz, lit > 0.45 ? "hedgeLight" : lit > -0.35 ? "hedge" : "hedgeDark");
        }
    block(x - r, x + r + 1, z - r, z + r + 1);
  }
  // Tufts of longer grass, two to four blades, where the mower does not reach.
  function tuft(x, z, seed) {
    for (let k = 0; k < 2 + Math.floor(hash(seed, 1, 67) * 3); k++) {
      const [dx, dz] = [Math.round((hash(seed, k, 68) - 0.5) * 3), Math.round((hash(seed, k, 69) - 0.5) * 3)];
      for (let y = 0; y <= 1 + Math.floor(hash(seed, k, 70) * 3); y++) green.add(x + dx, y, z + dz, y > 1 ? "leaf" : "stem");
    }
  }
  hedge(YARD.x0, YARD.x0 + 6, YARD.fence + 1, YARD.z1 - 1, 15);
  hedge(YARD.x1 - 7, YARD.x1 - 1, YARD.fence + 1, YARD.z1 - 1, 15);
  // Tufts round the foot of the tree, the pond's stones, the bench and the bird bath, and along the hedges.
  const tufts = [
    ...Array.from({ length: 10 }, (_, k) => [TREE[0] + Math.cos(k * 0.63) * 12, TREE[1] + Math.sin(k * 0.63) * 12]),
    ...Array.from({ length: 12 }, (_, k) => [POND.x + Math.cos(k * 0.52 + 0.2) * (POND.rx + 6), POND.z + Math.sin(k * 0.52 + 0.2) * (POND.rz + 6)]),
    ...Array.from({ length: 6 }, (_, k) => [BATH[0] + Math.cos(k * 1.05) * 9, BATH[1] + Math.sin(k * 1.05) * 9]),
    ...Array.from({ length: 9 }, (_, k) => [YARD.x0 + 10, YARD.fence + 18 + k * 12]),
  ];
  tufts.forEach(([x, z], k) => tuft(Math.round(x), Math.round(z), k));

  // White pickets with pointed tops on two rails, along the far side, the gate in it.
  const fence = part();
  const fz = YARD.fence;
  for (let x = YARD.x0 + 7; x < YARD.x1 - 7; x++) {
    if (x >= GATE.x0 && x <= GATE.x1) continue;
    const k = x - YARD.x0;
    if (k % 4 < 2) for (let y = 0; y <= 13 + (k % 4); y++) fence.add(x, y, fz, y >= 13 ? "picketShade" : "picket");
    for (const y of [4, 10]) fence.add(x, y, fz + 1, "picket");
  }
  for (const x of [GATE.x0 - 2, GATE.x0 - 1, GATE.x1 + 1, GATE.x1 + 2])
    for (let y = 0; y <= 17; y++) fence.add(x, y, fz, y >= 16 ? "picketShade" : "picket"); // the gateposts
  block(YARD.x0, GATE.x0 - 1, fz - 1, fz + 2);
  block(GATE.x1 + 1, YARD.x1, fz - 1, fz + 2);
  // The gate, hinged at its left post, swinging in towards the garden.
  const gatePivot = pivotGroup(group, [GATE.x0 - 0.5, 0, fz]);
  const gateLeaf = part();
  for (let x = GATE.x0; x <= GATE.x1; x++) {
    const u = x - GATE.x0;
    if (u % 3 === 0 || u === GATE.x1 - GATE.x0)
      for (let y = 1; y <= 12 + Math.round(2 * Math.sin((Math.PI * u) / (GATE.x1 - GATE.x0))); y++) gateLeaf.add(x, y, fz, "picket");
    for (const y of [4, 10]) gateLeaf.add(x, y, fz + 1, "picket");
  }
  for (let k = 0; k <= 6; k++) gateLeaf.add(GATE.x0 + Math.round(k * 2.6), 4 + k, fz + 1, "picketShade"); // the brace
  gateLeaf.add(GATE.x1 - 2, 8, fz - 1, "iron"); // the latch
  gatePivot.inner.add(mesh(gateLeaf));
  const gate = { k: 0, at: [DOOR.x, fz], near: null }; // near(): someone close to it (room.js)

  /* ---------- flowers ---------- */

  const flowers = part();
  // A flower bed over [x0, x1] x [z0, z1]: clumps of `kinds` on a jittered grid `step` apart, on dark soil.
  const KINDS = {
    tulip: (x, z, r) => {
      const head = ["red", "pink", "yellow", "white", "orange"][Math.floor(r * 5)];
      leaves(x, z, 1);
      for (let y = 1; y <= 5; y++) flowers.add(x, y, z, "stem");
      box(flowers, [x, x + 1], [6, 7], [z, z], head);
      flowers.add(x, 8, z, head);
    },
    daisy: (x, z, r) => {
      leaves(x, z, 0);
      for (let y = 1; y <= 3; y++) flowers.add(x, y, z, "stem");
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        flowers.add(x + dx, 4, z + dz, r < 0.5 ? "white" : "pink");
      flowers.add(x, 4, z, "yellow");
    },
    lavender: (x, z, r) => {
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 0; y <= 2; y++) flowers.add(x + dx, y, z + dz, "sage");
      for (const [dx, dz] of [
        [-1, 0],
        [1, 1],
        [0, -1],
        [1, -1],
      ])
        for (let y = 3; y <= 6 + Math.floor(r * 3); y++) flowers.add(x + dx, y, z + dz, y > 4 ? (y % 2 ? "lavender" : "lavenderDark") : "sage");
    },
    hydrangea: (x, z, r) => {
      const [c1, c2] = r < 0.5 ? ["blue", "blueLight"] : ["pink", "lotus"];
      for (let dx = -3; dx <= 3; dx++)
        for (let dz = -3; dz <= 3; dz++)
          for (let y = 0; y <= 7; y++) {
            const d = (dx / 3.4) ** 2 + (dz / 3.4) ** 2 + ((y - 3.5) / 4) ** 2;
            if (d > 1) continue;
            const q = hash(x + dx, y, z + dz);
            flowers.add(x + dx, y, z + dz, y >= 4 && q < 0.7 ? (q < 0.35 ? c1 : c2) : q < 0.5 ? "leaf" : "leafDark");
          }
    },
    hollyhock: (x, z, r) => {
      const head = ["pink", "red", "white", "lotus"][Math.floor(r * 4)];
      leaves(x, z, 1);
      const top = 12 + Math.floor(r * 6);
      for (let y = 1; y <= top; y++) {
        flowers.add(x, y, z, "stem");
        if (y > 5 && y % 2 === 0) for (const dx of [-1, 1]) flowers.add(x + dx, y, z, head);
        if (y > 5 && y % 2 === 1) flowers.add(x, y, z - 1, head);
      }
    },
    sunflower: (x, z) => {
      leaves(x, z, 1);
      for (let y = 1; y <= 17; y++) flowers.add(x, y, z, "stem");
      flowers.add(x + 1, 9, z, "leaf");
      flowers.add(x - 1, 12, z, "leaf");
      for (let dx = -2; dx <= 2; dx++)
        for (let dy = -2; dy <= 2; dy++) {
          const d = dx * dx + dy * dy;
          if (d <= 5) flowers.add(x + dx, 19 + dy, z - 1, d <= 1 ? "seeds" : "sunflower");
        }
    },
  };
  function leaves(x, z, y) {
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
    ])
      flowers.add(x + dx, y, z + dz, "leaf");
  }
  function bed(x0, x1, z0, z1, kinds, step, seed) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) flowers.add(x, -0.3, z, hash(x, z, seed) < 0.3 ? "soilDark" : "soil");
    for (let x = x0 + 2; x <= x1 - 2; x += step)
      for (let z = z0 + 2; z <= z1 - 2; z += step) {
        const r = hash(x, z, seed + 1);
        const [jx, jz] = [Math.round(hash(x, z, seed + 2) * 2 - 1), Math.round(hash(x, z, seed + 3) * 2 - 1)];
        const kind = kinds[Math.floor(r * kinds.length)];
        KINDS[kind](Math.min(x1 - 1, x + jx), Math.min(z1 - 1, z + jz), hash(x, z, seed + 4));
      }
    block(x0, x1 + 1, z0, z1 + 1);
  }
  const wallBed = (x0, x1, kinds, seed) => bed(x0, x1, YARD.z1 - 11, YARD.z1 - 1, kinds, 4, seed);
  wallBed(YARD.x0 + 8, PORCH.x0 - 4, ["hydrangea", "tulip", "daisy", "tulip"], 50);
  wallBed(PORCH.x1 + 4, 2, ["lavender", "tulip", "daisy"], 60);
  wallBed(48, 104, ["tulip", "daisy", "lavender", "tulip"], 70);
  const fenceBed = (x0, x1, kinds, seed) => bed(x0, x1, YARD.fence + 3, YARD.fence + 10, kinds, 5, seed);
  fenceBed(YARD.x0 + 8, GATE.x0 - 12, ["hollyhock", "daisy", "sunflower", "hollyhock", "tulip"], 90);
  fenceBed(GATE.x1 + 12, 26, ["daisy", "tulip", "lavender"], 100);
  fenceBed(100, 110, ["hollyhock", "lavender", "daisy", "sunflower", "tulip"], 110);

  /* ---------- the cherry tree, its swing and the bird box ---------- */

  const tree = part();
  const [tx, tz] = TREE;
  const barkAt = (x, y, z) => {
    const q = hash(x, y, z);
    return q < 0.2 ? "barkDark" : q > 0.86 ? "barkLight" : "bark";
  };
  // The trunk, flaring into its roots, a little crooked.
  for (let y = 0; y <= 44; y++) {
    const r = y < 6 ? 7 - y * 0.4 : 4.6 - (y - 6) * 0.015;
    const lean = Math.sin(y / 14) * 1.2;
    for (let x = -8; x <= 8; x++)
      for (let z = -8; z <= 8; z++) if ((x - lean) ** 2 + z * z <= r * r) tree.add(tx + x, y, tz + z, barkAt(tx + x, y, tz + z));
  }
  for (const [dx, dz] of [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ])
    for (let k = 5; k <= 10; k++)
      for (let y = 0; y <= Math.max(0, 3 - (k - 5) * 0.6); y++) tree.add(tx + dx * k, y, tz + dz * Math.round(k * 0.8), barkAt(k, y, dz));
  block(tx - 8, tx + 8, tz - 8, tz + 8);
  // Limbs out from the top of the trunk; one reaching out to hang the swing from.
  function branch([x0, y0, z0], [x1, y1, z1], thick) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0));
    for (let k = 0; k <= n; k++) {
      const [x, y, z] = [x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, z0 + ((z1 - z0) * k) / n];
      const r = thick * (1 - (0.45 * k) / n);
      for (let dx = -3; dx <= 3; dx++)
        for (let dy = -3; dy <= 3; dy++)
          for (let dz = -3; dz <= 3; dz++)
            if (dx * dx + dy * dy + dz * dz <= r * r) tree.add(Math.round(x + dx), Math.round(y + dy), Math.round(z + dz), barkAt(k, dx, dy + dz));
    }
  }
  branch([tx, 38, tz], [tx - 20, 60, tz + 10], 3);
  branch([tx, 40, tz], [tx + 16, 62, tz - 12], 3);
  branch([tx, 42, tz], [tx - 4, 66, tz - 16], 2.6);
  branch([tx + 2, 36, tz - 2], [SWING.x - 8, SWING.top, SWING.z], 2.6);
  for (let x = SWING.x - 9; x <= SWING.x + 9; x++)
    for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) tree.add(x, SWING.top + dy, SWING.z + dz, barkAt(x, dy, dz)); // the bough the ropes hang from
  // The blossom, like a cherry tree's in Minecraft: leaf blocks (BLOCK voxels a side, on a grid of their own)
  // in broad flat tiers, each narrower than the one under it, a block missing here and there round their
  // edges and hanging down a block or two under the lowest, and a smaller heap out over the swing's bough;
  // each block mottled in pinks a voxel at a time, like the pixels of its texture.
  const BLOCK = 6;
  const TIERS = [
    [tx - 2, tz - 2, 54, 2, 33], // [x, z] of its middle, the height of its underside, how many blocks thick, how far it reaches
    [tx - 2, tz - 2, 66, 2, 27],
    [tx, tz - 3, 78, 1, 19],
    [tx + 1, tz - 4, 84, 1, 11],
    [SWING.x - 4, SWING.z + 2, 54, 2, 15], // over the swing's bough
  ];
  const PINKS = [
    ["blossom", 10],
    ["blossomMid", 5],
    ["blossomDeep", 3],
    ["blossomLight", 2],
  ].flatMap(([c, n]) => Array(n).fill(c)); // (as many of each as it is common)
  const leafAt = (x, y, z) => {
    const q = hash(x, y, z);
    return q < 0.025 ? "blossomShade" : q > 0.985 ? "blossomWhite" : PINKS[Math.floor(hash(z, x, y) * PINKS.length)];
  };
  const blocks = new Set();
  const key = (i, j, k) => `${i},${j},${k}`;
  for (const [cx, cz, y0, thick, r] of TIERS) {
    const j0 = Math.round(y0 / BLOCK);
    for (let i = Math.floor((cx - r) / BLOCK); i <= Math.ceil((cx + r) / BLOCK); i++)
      for (let k = Math.floor((cz - r) / BLOCK); k <= Math.ceil((cz + r) / BLOCK); k++) {
        const d = Math.hypot((i + 0.5) * BLOCK - cx, (k + 0.5) * BLOCK - cz) / r;
        if (d > 1 || (d > 0.8 && hash(i, j0, k) < 0.35)) continue;
        for (let j = j0; j < j0 + thick; j++) blocks.add(key(i, j, k));
        if (y0 > 60 || d < 0.7) continue;
        if (hash(k, j0, i) < 0.45) blocks.add(key(i, j0 - 1, k)); // hanging down round the edge
        if (d > 0.85 && hash(k, i, j0) < 0.25) blocks.add(key(i, j0 - 2, k));
      }
  }
  for (const b of blocks) {
    const [i, j, k] = b.split(",").map((n) => +n * BLOCK);
    for (let x = i; x < i + BLOCK; x++) for (let y = j; y < j + BLOCK; y++) for (let z = k; z < k + BLOCK; z++) tree.add(x, y, z, leafAt(x, y, z));
  }
  // The bird box, on the trunk facing out to the lane.
  box(tree, [tx - 2, tx + 2], [28, 33], [tz - 8, tz - 5], "birdhouse");
  for (let x = tx - 3; x <= tx + 3; x++) {
    tree.add(x, 34, tz - 7, "roof");
    tree.add(x, 34, tz - 6, "roof");
    tree.add(x, 33.5, tz - 8, "roof");
    tree.add(x, 33.5, tz - 5, "roof");
  }
  tree.add(tx, 31, tz - 8.5, "barkDark"); // the hole
  tree.add(tx, 29, tz - 8.8, "plank"); // the perch
  // Petals fallen on the grass under it.
  for (let k = 0; k < 90; k++) {
    const [a, r] = [hash(k, 1, 51) * Math.PI * 2, 6 + hash(k, 2, 51) * 28];
    tree.add(Math.round(tx + Math.cos(a) * r), -0.4, Math.round(tz + Math.sin(a) * r * 0.9), k % 3 ? "blossom" : "blossomLight");
  }

  // The swing: a plank on two ropes, hung from the bough; `swing.angle` swings it (towards the lane is
  // positive).
  const swingPivot = pivotGroup(group, [SWING.x, SWING.top - 1, SWING.z]);
  const swingPart = part();
  const sTop = SWING.top - 2;
  for (let y = SWING.seat + 1; y <= sTop; y++) for (const x of [SWING.x - 5, SWING.x + 5]) swingPart.add(x, y, SWING.z, "rope");
  box(swingPart, [SWING.x - 6, SWING.x + 6], [SWING.seat - 1, SWING.seat], [SWING.z - 3, SWING.z + 2], (x, y) =>
    y === SWING.seat ? "plank" : "benchDark"
  );
  swingPivot.inner.add(mesh(swingPart));
  const swing = {
    angle: 0,
    rider: null, // who is on it
    pivot: [SWING.x, SWING.top - 1, SWING.z],
    seat: [SWING.x, SWING.z],
    front: [SWING.x, SWING.z - 12], // where to stand to sit down on it, facing the lane
    push: [SWING.x, SWING.z + 28], // where to stand to push (behind the rider)
  };
  block(SWING.x - 8, SWING.x + 8, SWING.z - 4, SWING.z + 4);

  /* ---------- the pond ---------- */

  const pond = part();
  for (let x = Math.floor(POND.x - POND.rx - 4); x <= POND.x + POND.rx + 4; x++)
    for (let z = Math.floor(POND.z - POND.rz - 4); z <= POND.z + POND.rz + 4; z++) {
      const d = Math.hypot((x - POND.x) / (POND.rx + 0.5), (z - POND.z) / (POND.rz + 0.5));
      if (d < 1 || d > 1 + 3.6 / POND.rz) continue;
      const q = hash(Math.floor(x / 3), Math.floor(z / 3), 52);
      const h = q < 0.3 ? 2 : 1;
      for (let y = 0; y <= h; y++) pond.add(x, y, z, q < 0.25 ? "stoneDark" : q > 0.8 ? "stoneLight" : "stone");
    }
  // Lily pads (round, a notch out of each), a pink flower on two of them, and reeds at the far end.
  const PADS = [
    [POND.x - 14, POND.z + 4, 3.2],
    [POND.x - 6, POND.z - 6, 2.6],
    [POND.x + 9, POND.z + 6, 3],
    [POND.x + 18, POND.z - 3, 2.4],
    [POND.x - 20, POND.z - 4, 2.2],
  ];
  PADS.forEach(([px, pz, r], i) => {
    for (let x = -4; x <= 4; x++)
      for (let z = -4; z <= 4; z++)
        if (x * x + z * z <= r * r && !(x > 0 && Math.abs(z) <= x * 0.5)) pond.add(px + x, 1.1, pz + z, (x + z) % 3 ? "lily" : "lilyDark");
    if (i % 2 === 0) {
      for (const [x, z] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
        pond.add(px + x - 1, 2.1, pz + z, "lotus");
      pond.add(px - 1, 2.6, pz, "lotusHeart");
    }
  });
  for (let k = 0; k < 14; k++) {
    const [x, z] = [POND.x + POND.rx - 7 + Math.round(hash(k, 3, 53) * 6), POND.z - 6 + Math.round(hash(k, 4, 53) * 12)];
    const top = 9 + Math.floor(hash(k, 5, 53) * 8);
    for (let y = 1; y <= top; y++) pond.add(x, y, z, "reed");
    if (k % 3 === 0) for (let y = top - 3; y <= top - 1; y++) pond.add(x, y, z, "cattail");
  }
  block(POND.x - POND.rx - 4, POND.x + POND.rx + 4, POND.z - POND.rz - 4, POND.z + POND.rz + 4);
  // The water, one texel a voxel: clear and pale over the pebbles by the edge, deepening to blue-green in the
  // middle (dithered from one shade to the next), a pale streak of sky across it; and over it, a few glints of
  // sun drifting slowly and twinkling. It is never still: soft swells roll slowly across it, lighter along
  // their crests, the sky's streak wavering with them, and rings spread wherever something touches it (the
  // ducks paddling, a fish rising, the rain: `ripple`). Redrawn a dozen times a second while it can be seen.
  const [pw, ph] = [2 * (POND.rx + 1), 2 * (POND.rz + 1)];
  const WATER = ["#4a94b0", "#5aa6bd", "#6fb8c6", "#8ccbcb", "#a9dccf"]; // deep to shallow
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [CREST, SKY, RING] = [rgb("#9fd6d6"), rgb("#d6f0f0"), rgb("#c4e8e4")];
  const still = []; // per texel: the colour of the still water there, how far out it is (0 to 1), whether it is pebbles
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const [u, v] = [((x + 0.5) / pw) * 2 - 1, ((y + 0.5) / ph) * 2 - 1];
      const d = Math.hypot(u, v); // 0 in the middle, 1 at the edge
      const q = hash(x, y, 54);
      const shade = Math.min(WATER.length - 1, Math.floor((d ** 1.6 + (q - 0.5) * 0.12) * WATER.length));
      const pebble = d > 0.8 && hash(Math.floor(x / 2), Math.floor(y / 2), 55) < 0.3;
      still.push({ c: rgb(pebble ? (q < 0.5 ? "#93bfae" : "#b9ddcf") : WATER[Math.max(0, shade)]), u, v, d, q, pebble });
    }
  const pool = pixelTexture(pw, ph, () => {});
  const image = pool.g.createImageData(pw, ph);
  const rings = []; // [x, y] on the texture, when, how big
  function ripple(x, z, size = 1) {
    if (rings.length < 40) rings.push([x - POND.x + POND.rx + 1, z - POND.z + POND.rz + 1, now, size]);
  }
  let now = 0;
  let drawnAt = -1;
  function drawWater(t) {
    now = t;
    if (t - drawnAt < 0.08 || !group.visible) return;
    drawnAt = t;
    for (let i = rings.length - 1; i >= 0; i--) if (t - rings[i][2] > 1.6 * rings[i][3]) rings.splice(i, 1);
    still.forEach(({ c, u, v, d, q, pebble }, i) => {
      let col = c;
      if (!pebble && d < 0.9) {
        // The swells, two sets crossing, and the streak of sky bent by them.
        const swell = Math.sin(u * 9 + v * 4 - t * 1.3) + 0.6 * Math.sin(-u * 5 + v * 11 - t * 0.9);
        if (swell > 1.25 && q > 0.2) col = CREST;
        if (Math.abs(u * 0.55 + v - 0.35 + 0.05 * Math.sin(u * 7 - t * 1.6)) < 0.06 && d < 0.85 && q > 0.25) col = SKY;
        const [x, y] = [i % pw, Math.floor(i / pw)];
        for (const [rx, ry, t0, size] of rings) {
          const r = (t - t0) * 7; // spreading
          const off = Math.abs(Math.hypot(x + 0.5 - rx, y + 0.5 - ry) - r);
          if (off < 0.6 && r < 9 * size && q > (r / (9 * size)) * 0.8) col = RING; // fading as it spreads
        }
      }
      image.data[i * 4] = col[0];
      image.data[i * 4 + 1] = col[1];
      image.data[i * 4 + 2] = col[2];
      image.data[i * 4 + 3] = 255;
    });
    pool.g.putImageData(image, 0, 0);
    pool.tex.needsUpdate = true;
  }
  drawWater(0);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshLambertMaterial({ map: pool.tex }));
  water.rotation.x = -Math.PI / 2;
  water.scale.set(POND.rx + 1, POND.rz + 1, 1);
  water.position.set(POND.x, 0.5, POND.z);
  const glints = pixelTexture(pw, ph, (g, w, h) => {
    g.fillStyle = "#ffffff";
    for (let k = 0; k < 16; k++) {
      const [x, y] = [Math.floor(hash(k, 1, 56) * w), Math.floor(hash(k, 2, 56) * h)];
      g.fillRect(x, y, k % 3 ? 2 : 3, 1);
    }
  });
  glints.tex.wrapS = THREE.RepeatWrapping;
  const glintMat = new THREE.MeshBasicMaterial({ map: glints.tex, transparent: true, depthWrite: false, opacity: 0.6 });
  const glint = new THREE.Mesh(water.geometry, glintMat);
  glint.rotation.x = -Math.PI / 2;
  glint.scale.copy(water.scale).multiplyScalar(0.9);
  glint.position.set(POND.x, 0.6, POND.z);
  group.add(water, glint);

  /* ---------- the bench, the bird bath, the wheelbarrow and the gnome ---------- */

  const things = part();
  // The bench, looking out across the lawn to the pond: wooden slats on cast-iron ends (built facing -z about
  // its middle, then turned).
  {
    const bench = part();
    const [x0, x1, z] = [-BENCH.half, BENCH.half, 0];
    for (let x = x0; x <= x1; x++) {
      for (const dz of [-3, -1, 1, 3]) bench.add(x, 8, z + dz, dz === 3 ? "benchDark" : "bench"); // the seat
      for (const y of [11, 13, 15, 17]) bench.add(x, y, z + 4 + (y - 11) / 6, y === 17 ? "benchDark" : "bench"); // the back
    }
    for (const x of [x0, x1]) {
      for (let y = 0; y <= 8; y++) {
        bench.add(x, y, z - 4 + Math.round(y / 4), "iron");
        bench.add(x, y, z + 4 - Math.round(y / 8), "iron");
      }
      for (let y = 9; y <= 18; y++) bench.add(x, y, z + 4 + Math.round((y - 9) / 6), "iron");
      for (let dz = -4; dz <= 4; dz++) bench.add(x, 12, z + dz, dz === -4 ? "benchDark" : "bench"); // the arms
      bench.add(x, 11, z - 4, "iron");
    }
    const m = mesh(bench);
    m.position.set(BENCH.x, 0, BENCH.z);
    m.rotation.y = BENCH.turn;
    group.add(m);
    // Its footprint (seat to back, -3..6 across it), as small boxes along it.
    const [c, s] = [Math.abs(Math.cos(BENCH.turn)), Math.abs(Math.sin(BENCH.turn))];
    for (let lx = -BENCH.half + 2; lx <= BENCH.half - 2; lx += 4) {
      const [cx, cz] = turned([BENCH.x, BENCH.z], BENCH.turn, [lx, 1.5]);
      const [hx, hz] = [2 * c + 4.5 * s, 2 * s + 4.5 * c];
      block(cx - hx, cx + hx, cz - hz, cz + hz);
    }
  }
  // A hammock on the lawn by the house wall: a wooden stand (a beam along the ground, its ends curving up to
  // the hooks), ropes fanning out to a spreader bar at each end, and striped canvas sagging between them, its
  // sides cupped up, a pillow at the head. Built along z (the head at -z), turned to HAMMOCK.yaw. Beside it, on
  // the wall side, a cantilever parasol, furled, that opens out over the hammock in the rain.
  const parasol = { k: 0, hub: turned([HAMMOCK.x, HAMMOCK.z], HAMMOCK.yaw, [-1, 0]), r: 18 };
  // A visitor clicking it asks her to come out and lie in it a while (life.js; acts/outdoors.js), and rocks it
  // a little (not with her in it); clicking her in it (`who`) gets her up (`up`).
  const nap = { want: false, who: null, up: false, rocked: Infinity };
  // What hangs rocks about the line through the hooks: `rock.rotation.z`, along the hammock.
  const rock = new THREE.Group();
  rock.position.set(HAMMOCK.x, 21, HAMMOCK.z);
  rock.rotation.y = HAMMOCK.yaw;
  group.add(rock);
  {
    const ham = part(); // the stand
    const hung = part(); // what hangs from its hooks: the ropes, the spreader bars, the canvas and the pillow
    const [END, FOOT] = [21, 17]; // the canvas, -END..FOOT along it (the foot end a little shorter)
    const reach = (z) => (z < 0 ? END : FOOT);
    const sag = (x, z) => Math.round(6 + 7 * Math.abs(z / reach(z)) ** 3 + 1.5 * (x / 8) ** 2);
    box(ham, [-1, 1], [0, 1], [-END + 1, FOOT - 1], "benchDark"); // the beam
    for (const s of [-1, 1]) {
      const e = s < 0 ? END : FOOT;
      box(ham, [-9, 9], [0, 1], [s * (e - 1), s * (e - 1)], "benchDark"); // the feet
      for (let y = 1; y <= 22; y++) {
        const z = s * Math.round(e - 2 + 9 * (y / 22) ** 2); // curving up and out to the hook
        box(ham, [-1, 1], [y, y], [Math.min(z, z - s), Math.max(z, z - s)], y === 22 ? "benchDark" : "bench");
      }
      box(hung, [-8, 8], [13, 13], [s * e, s * e], "bench"); // the spreader bar
      for (const x of [-7, -3, 1, 5]) {
        // a rope from the hook down to the bar
        for (let k = 0; k <= 8; k++) hung.add(Math.round(x * (k / 8)), 21 - k, s * Math.round(e + 7 - (7 * k) / 8), "rope");
      }
    }
    const stripe = (x) => ["canvas", "canvasTeal", "canvas", "canvasCoral"][Math.floor((x + 8) / 2) % 4];
    for (let z = -END + 1; z <= FOOT - 1; z++)
      for (let x = -8; x <= 8; x++) {
        const y = sag(x, z);
        const below = Math.min(sag(x, z - Math.sign(z) || 0), y); // (no gaps where it climbs steeply)
        for (let yy = below; yy <= y; yy++) hung.add(x, yy, z, stripe(x));
      }
    for (let z = -16; z <= -13; z++) for (let x = -5; x <= 5; x++) hung.add(x, sag(x, z) + 1, z, z === -13 ? "cushionDark" : "pillowSage"); // the pillow
    const [m, h] = [mesh(ham), mesh(hung)];
    m.position.set(HAMMOCK.x, 0, HAMMOCK.z);
    m.rotation.y = HAMMOCK.yaw;
    group.add(m);
    h.position.y = -21;
    rock.add(h);
    clickables.push({
      parts: [m, h],
      toggle: () => {
        nap.want = true;
        if (!nap.who) nap.rocked = 0;
      },
    });
    const corners = [-9, 9].flatMap((lx) => [-END - 8, FOOT + 8].map((lz) => turned([HAMMOCK.x, HAMMOCK.z], HAMMOCK.yaw, [lx, lz])));
    const [xs, zs] = [corners.map((p) => p[0]), corners.map((p) => p[1])];
    block(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs));

    // The parasol: a pole on a square stone base, an arm out over the hammock and the canopy hung from its
    // end, cream and teal panels with a coral scalloped edge. Furled, the canopy hangs down narrow under the
    // arm; `parasol.k` opens it.
    const TOP = 40;
    const stand = part();
    box(stand, [-2, 2], [0, 1], [-2, 2], "stoneDark");
    box(stand, [0, 0], [2, TOP], [0, 0], "iron");
    box(stand, [0, 11], [TOP, TOP], [0, 0], "iron");
    const pole = turned([HAMMOCK.x, HAMMOCK.z], HAMMOCK.yaw, [-12, 0]);
    const sm = mesh(stand);
    sm.position.set(pole[0], 0, pole[1]);
    sm.rotation.y = HAMMOCK.yaw; // (the arm along x, out over the hammock)
    group.add(sm);
    block(pole[0] - 3, pole[0] + 3, pole[1] - 3, pole[1] + 3);
    const canopy = part();
    for (let x = -parasol.r; x <= parasol.r; x++)
      for (let z = -parasol.r; z <= parasol.r; z++) {
        const r = Math.hypot(x, z);
        if (r > parasol.r) continue;
        const panel = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 8) % 2 ? "canvasTeal" : "canvas";
        const y = -Math.round(6 * (r / parasol.r) ** 1.3);
        canopy.add(x, y, z, r > parasol.r - 1.2 ? "canvasCoral" : panel);
        if (r > parasol.r - 1.2 && Math.round(Math.atan2(z, x) * 9) % 2 === 0) canopy.add(x, y - 1, z, "canvasCoral"); // the scallops
      }
    canopy.add(0, 1, 0, "iron"); // the finial
    parasol.mesh = mesh(canopy);
    parasol.mesh.position.set(parasol.hub[0], TOP - 1, parasol.hub[1]);
    group.add(parasol.mesh);
  }
  // The bird bath: a stone bowl on a pillar.
  {
    const [x, z] = BATH;
    for (let y = 0; y <= 13; y++) {
      const r = y < 2 ? 3.5 : y < 11 ? 1.8 : 2.4;
      for (let dx = -4; dx <= 4; dx++)
        for (let dz = -4; dz <= 4; dz++) if (dx * dx + dz * dz <= r * r) things.add(x + dx, y, z + dz, y % 4 ? "stone" : "stoneDark");
    }
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) {
        const d = dx * dx + dz * dz;
        if (d <= 36) things.add(x + dx, 14, z + dz, d > 26 ? "stoneLight" : "stone");
        if (d > 25 && d <= 36) things.add(x + dx, 15, z + dz, "stoneLight");
      }
  }
  block(BATH[0] - 6, BATH[0] + 6, BATH[1] - 6, BATH[1] + 6);
  const bathWater = new THREE.Mesh(new THREE.CircleGeometry(4.8, 20), new THREE.MeshLambertMaterial({ color: "#8ccbcb" }));
  bathWater.rotation.x = -Math.PI / 2;
  bathWater.position.set(BATH[0], 15.2, BATH[1]);
  group.add(bathWater);
  // A wheelbarrow spilling over with flowers.
  {
    const [x, z] = [126, -224]; // (by the fence, out of the way of the vegetable garden)
    for (let y = 2; y <= 7; y++)
      for (let dx = -6; dx <= 5; dx++)
        for (let dz = -4; dz <= 4; dz++) {
          const inner = Math.abs(dz) < 4 - (7 - y) * 0.4 && dx > -6 + (7 - y) * 0.5 && dx < 5;
          if (!inner && Math.abs(dz) <= 4 - (7 - y) * 0.4 && dx >= -6 + (7 - y) * 0.6)
            things.add(x + dx, y, z + dz, y === 7 ? "barrowDark" : "barrow");
        }
    for (let dx = -5; dx <= 4; dx++) for (let dz = -3; dz <= 3; dz++) things.add(x + dx, 7, z + dz, hash(dx, dz, 55) < 0.5 ? "leaf" : "leafDark");
    for (let k = 0; k < 12; k++)
      things.add(x - 5 + Math.floor(hash(k, 1, 56) * 10), 8, z - 3 + Math.floor(hash(k, 2, 56) * 7), ["pink", "yellow", "white", "lotus"][k % 4]);
    for (let dy = -2; dy <= 2; dy++)
      for (let dz = -2; dz <= 2; dz++) if (dy * dy + dz * dz <= 5) things.add(x - 9, 2.5 + dy, z + dz, dy * dy + dz * dz <= 1 ? "steel" : "tyre"); // the wheel
    for (const dz of [-3, 3]) {
      for (let k = 0; k <= 12; k++) things.add(x - 6 + k, 3 + Math.round(k / 4), z + dz, "iron");
      for (let y = 0; y <= 3; y++) things.add(x + 3, y, z + dz, "iron");
    }
  }
  block(115, 133, -230, -218);
  // A garden gnome by the pond, fishing rod and all.
  {
    const [x, z] = [POND.x + POND.rx + 8, POND.z - 12];
    box(things, [x - 1, x + 1], [0, 3], [z - 1, z + 1], "gnomeBlue");
    box(things, [x - 1, x + 1], [4, 6], [z - 1, z + 1], "gnomeRed");
    box(things, [x - 1, x + 1], [7, 8], [z - 1, z + 1], "skin");
    box(things, [x - 1, x + 1], [6, 7], [z - 2, z - 2], "beard");
    things.add(x, 6, z - 2, "beard");
    for (let y = 9; y <= 13; y++) things.add(x, y, z + (y > 11 ? 1 : 0), "gnomeRed");
    for (let k = 0; k < 8; k++) things.add(x - 1 - k, 5 + Math.round(k * 0.6), z - 2 - Math.round(k * 0.5), "barkDark");
  }
  block(POND.x + POND.rx + 5, POND.x + POND.rx + 11, POND.z - 15, POND.z - 9);

  // Stepping stones across the lawn, from the path past the front of the bench and along the pond to the
  // bird bath and the picnic: sandstone flags a stride apart along a gentle curve, each its own size and
  // turned its own way, a little left or right of the line as feet fall, set just proud of the grass with a
  // worn, darker edge, moss here and there in it and tufts of grass about it.
  const WAY = [
    [-36, -168],
    [-8, -173],
    [18, -168],
    [44, -165],
    [70, -167],
    [94, -172],
    [114, -178],
    [128, -184],
  ];
  const stones = part();
  const along = WAY.slice(1).map((p, k) => [WAY[k], p, Math.hypot(p[0] - WAY[k][0], p[1] - WAY[k][1])]);
  const total = along.reduce((sum, [, , len]) => sum + len, 0);
  const STRIDE = 10.5;
  for (let n = 0, s = 0; s <= total; n++, s += STRIDE + (hash(n, 1, 61) - 0.5) * 2) {
    let rest = s;
    const seg = along.find(([, , len]) => (rest -= len) <= 0) || along.at(-1);
    const u = Math.min(1, (seg[2] + rest) / seg[2]);
    const [[x0, z0], [x1, z1]] = seg;
    const [dx, dz] = [(x1 - x0) / seg[2], (z1 - z0) / seg[2]];
    const side = (n % 2 ? 1 : -1) * 1.4; // left foot, right foot
    const [cx, cz] = [x0 + (x1 - x0) * u - dz * side, z0 + (z1 - z0) * u + dx * side];
    const [rx, rz] = [3.2 + hash(n, 2, 61) * 1.5, 2.5 + hash(n, 3, 61) * 1];
    const turn = Math.atan2(dz, dx) + (hash(n, 4, 61) - 0.5) * 1.2;
    const [c, sn] = [Math.cos(turn), Math.sin(turn)];
    for (let x = Math.floor(cx - 5); x <= cx + 5; x++)
      for (let z = Math.floor(cz - 5); z <= cz + 5; z++) {
        const [lx, lz] = [(x - cx) * c + (z - cz) * sn, -(x - cx) * sn + (z - cz) * c];
        const d = (lx / rx) ** 2 + (lz / rz) ** 2;
        const q = hash(x, z, 62);
        if (d > 1 - 0.22 * hash(Math.floor(x / 2), Math.floor(z / 2), 63)) continue;
        const edge = d > 0.68;
        stones.add(x, -0.2, z, edge ? (q < 0.18 ? "moss" : "flagstoneEdge") : q < 0.28 ? "flagstoneDark" : q > 0.86 ? "flagstoneLight" : "flagstone");
      }
    if (hash(n, 5, 61) < 0.5) tuft(Math.round(cx + rx + 1.5), Math.round(cz + (hash(n, 6, 61) - 0.5) * 4), 200 + n);
  }
  group.add(mesh(stones));
  // A picnic on the lawn: a gingham blanket, the basket, a plate of strawberries and two cups.
  {
    const [x0, x1, z0, z1] = [PICNIC.x - 15, PICNIC.x + 15, PICNIC.z - 12, PICNIC.z + 12];
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        const [u, w] = [Math.floor((x - x0) / 3) % 2, Math.floor((z - z0) / 3) % 2];
        things.add(x, -0.3, z, u && w ? "red" : u || w ? "pink" : "white");
      }
    const [bx, bz] = [PICNIC.x + 8, PICNIC.z - 4];
    box(things, [bx - 4, bx + 4], [0, 4], [bz - 3, bz + 3], (x, y) => (y === 4 ? "wickerDark" : (x + y) % 2 ? "wicker" : "wickerDark"));
    for (let x = bx - 3; x <= bx + 3; x++) things.add(x, x === bx - 3 || x === bx + 3 ? 6 : 8, bz, "wickerDark");
    for (const x of [bx - 3, bx + 3]) things.add(x, 5, bz, "wickerDark");
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++) if (x * x + z * z <= 5) things.add(PICNIC.x - 4 + x, 0.2, PICNIC.z + 2 + z, x * x + z * z <= 2 ? "red" : "white");
    for (const [cx, cz] of [
      [PICNIC.x + 2, PICNIC.z + 4],
      [PICNIC.x - 9, PICNIC.z - 3],
    ]) {
      box(things, [cx, cx + 1], [0, 1], [cz, cz + 1], "white");
      things.add(cx + 2, 1, cz, "blue");
    }
    block(bx - 5, bx + 5, bz - 4, bz + 4);
  }

  /* ---------- by the house: the porch and his bike ---------- */

  // A pot either side of the door with a clipped box ball in it, and the mat.
  for (const dx of [-16, 16]) {
    const [x, z] = [DOOR.x + dx, YARD.z1 - 6];
    for (let y = 0; y <= 6; y++)
      for (let ix = -3; ix <= 3; ix++)
        for (let iz = -3; iz <= 3; iz++) if (ix * ix + iz * iz <= (y === 6 ? 12 : 8)) things.add(x + ix, y, z + iz, y === 6 ? "potDark" : "pot");
    for (let ix = -4; ix <= 4; ix++)
      for (let iy = -4; iy <= 4; iy++)
        for (let iz = -4; iz <= 4; iz++)
          if (ix * ix + iy * iy + iz * iz <= 17) things.add(x + ix, 11 + iy, z + iz, hash(ix, iy, iz) < 0.3 ? "hedgeDark" : "hedge");
    block(x - 4, x + 4, z - 4, z + 4);
  }
  box(things, [DOOR.x - 9, DOOR.x + 9], [-0.3, -0.3], [YARD.z1 - 9, YARD.z1 - 2], (x, y, z) =>
    Math.abs(x - DOOR.x) === 9 || z === YARD.z1 - 9 ? "matDark" : "mat"
  );
  // His bike, leaning on the wall: navy, a wicker basket on the front with flowers in it.
  {
    const bike = part();
    const wheel = (cx) => {
      for (let y = -8; y <= 8; y++)
        for (let x = -8; x <= 8; x++) {
          const d = Math.hypot(x, y);
          if (d >= 6.6 && d <= 8.2) bike.add(cx + x, 8 + y, 0, "tyre");
          else if (d < 6.6 && (x === 0 || y === 0 || Math.abs(x) === Math.abs(y))) bike.add(cx + x, 8 + y, 0, d < 1.5 ? "steel" : "spoke");
        }
    };
    wheel(0);
    wheel(26);
    const tube = ([x0, y0], [x1, y1], c = "navy") => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let k = 0; k <= n; k++) bike.add(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), 0, c);
    };
    tube([0, 8], [11, 8]); // chainstay
    tube([11, 8], [8, 20]); // seat tube
    tube([0, 8], [8, 18]); // seat stay
    tube([11, 8], [22, 18], "navyDark"); // down tube
    tube([8, 18], [22, 19]); // top tube
    tube([22, 19], [26, 8]); // fork
    tube([22, 19], [21, 24], "steel"); // stem
    box(bike, [17, 23], [24, 24], [0, 0], "steel");
    box(bike, [6, 10], [21, 21], [0, 0], "saddle");
    for (let y = 21; y <= 27; y++)
      for (let x = 23; x <= 30; x++) if (y === 21 || x === 23 || x === 30 || y % 2 === 0) bike.add(x, y, 0, y === 27 ? "wickerDark" : "wicker");
    for (const [x, y, c] of [
      [25, 28, "red"],
      [27, 29, "yellow"],
      [28, 28, "white"],
      [26, 29, "leaf"],
    ])
      bike.add(x, y, 0, c);
    const m = mesh(bike);
    m.scale.z = 3; // a frame three voxels across
    m.position.set(8, 0, YARD.z1 - 5);
    m.rotation.x = 0.12; // leaning back on the wall
    group.add(m);
  }
  block(6, 40, YARD.z1 - 9, YARD.z1);

  /* ---------- on the wall ---------- */

  const wall = part();
  const wz = YARD.z1 - 1; // just out from the wall
  // A rose on a trellis beside the door, climbing nearly to the top of it.
  for (let x = DOOR.x + 18; x <= DOOR.x + 26; x++)
    for (let y = 4; y <= 52; y++) if ((x + y) % 4 === 0 || (x - y) % 4 === 0) wall.add(x, y, wz, "plank");
  for (let k = 0; k < 140; k++) {
    const [x, y] = [DOOR.x + 17 + Math.floor(hash(k, 1, 57) * 11), 4 + Math.floor(hash(k, 2, 57) ** 0.7 * 50)];
    wall.add(x, y, wz - 1, hash(k, 3, 57) < 0.3 ? "red" : hash(k, 3, 57) < 0.42 ? "pink" : "leafDark");
  }
  // A white surround to the door, and over it a little gabled porch roof of terracotta tiles on two white
  // brackets, a pink heart in its gable.
  for (let y = 0; y <= DOOR.height + 1; y++)
    for (const x of [DOOR.x - DOOR.half - 2, DOOR.x - DOOR.half - 1, DOOR.x + DOOR.half, DOOR.x + DOOR.half + 1]) wall.add(x, y, wz, "frame");
  for (let x = DOOR.x - DOOR.half - 2; x <= DOOR.x + DOOR.half + 1; x++) for (const y of [DOOR.height, DOOR.height + 1]) wall.add(x, y, wz, "frame");
  {
    const [cx, half, eave, depth] = [DOOR.x - 0.5, 18, DOOR.height + 3, 11];
    const ridge = (x) => eave + (half - Math.abs(x - cx)) * 0.55; // the roof's height across it
    for (let x = Math.ceil(cx - half); x <= cx + half; x++) {
      const top = Math.round(ridge(x));
      for (let z = wz - depth; z <= wz; z++) wall.add(x, top, z, Math.abs(x - cx) < 1 ? "roofDark" : (z + top) % 3 === 0 ? "roofDark" : "roof");
      for (let y = eave; y < top; y++) wall.add(x, y, wz - depth + 1, y === top - 1 ? "frame" : "frameShade"); // the gable
    }
    for (const [x, y] of [
      [cx - 1.5, eave + 5],
      [cx + 0.5, eave + 5],
      [cx - 2.5, eave + 6],
      [cx - 0.5, eave + 6],
      [cx + 1.5, eave + 6],
      [cx - 0.5, eave + 4],
    ])
      wall.add(Math.round(x), y, wz - depth, "pink");
    for (const x of [cx - half + 2, cx + half - 2])
      for (let k = 0; k <= 9; k++) wall.add(Math.round(x), eave - 10 + k, wz - Math.round(k * 0.9), "frame"); // the brackets
  }
  // On the outside of the door (swinging with it: windows.js's `doorLeaf`), a wreath and the letterbox.
  const onDoor = part();
  const dz = BACK - 3; // just out from the door's outer face
  box(onDoor, [DOOR.x - 5, DOOR.x + 5], [24, 26], [dz, dz], (x, y) => (y === 25 && Math.abs(x - DOOR.x) < 4 ? "lamp" : "brass"));
  for (let x = -7; x <= 7; x++)
    for (let y = -7; y <= 7; y++) {
      const d = Math.hypot(x, y);
      if (d < 4.5 || d > 7.2) continue;
      onDoor.add(DOOR.x + x, 44 + y, dz, hash(x, y, 58) < 0.15 ? "berry" : (x + y) % 3 ? "wreath" : "leaf");
    }
  box(onDoor, [DOOR.x - 1, DOOR.x + 1], [36, 38], [dz - 0.5, dz - 0.5], "red"); // its bow
  shared.doorLeaf.add(mesh(onDoor));
  // The bedroom window from outside: a white frame, slate-blue shutters, and a window box of flowers.
  const [w0, w1, wy0, wy1] = [111, 151, 54, 91];
  for (let x = w0 - 2; x <= w1 + 2; x++)
    for (let y = wy0 - 2; y <= wy1 + 2; y++) if (x < w0 || x > w1 || y < wy0 || y > wy1) wall.add(x, y, wz, "frame");
  for (const [x0, x1] of [
    [w0 - 12, w0 - 3],
    [w1 + 3, w1 + 12],
  ])
    for (let x = x0; x <= x1; x++)
      for (let y = wy0; y <= wy1; y++) wall.add(x, y, wz, (y - wy0) % 4 === 0 ? "shutterDark" : x === x0 || x === x1 ? "shutterDark" : "shutter");
  for (let x = w0 - 1; x <= w1 + 1; x++)
    for (let z = wz - 6; z <= wz; z++)
      for (let y = wy0 - 7; y <= wy0 - 3; y++)
        wall.add(x, y, z, y === wy0 - 3 ? "soil" : z === wz - 6 || x === w0 - 1 || x === w1 + 1 ? "plank" : "bench");
  for (let x = w0 + 1; x <= w1 - 1; x += 3) {
    const r = hash(x, 0, 59);
    wall.add(x, wy0 - 2, wz - 3, "leaf");
    wall.add(x + 1, wy0 - 2, wz - 2, "leafDark");
    wall.add(x, wy0 - 1, wz - 3, ["red", "pink", "white", "lavender"][Math.floor(r * 4)]);
  }
  // Trailing over its front, strands of purple flowers on green, long and short in loose clumps.
  for (let x = w0 - 1; x <= w1 + 1; x++) {
    if (hash(x, 1, 67) < 0.35) continue;
    const len = Math.round(2 + (5 + 6 * hash(x, 2, 67)) * Math.abs(Math.sin(x / 4.7 + 1.3)));
    const z = wz - 7 + (hash(x, 3, 67) < 0.3 ? 1 : 0);
    for (let k = 1; k <= len; k++) {
      const q = hash(x, k, 68);
      const c = k === len ? "lavenderDark" : q < 0.3 ? "leafDark" : q < 0.38 ? "white" : (x + k) % 2 ? "lavender" : "lavenderDark";
      wall.add(x, wy0 - 3 - k, z, k < 2 ? "leaf" : c);
    }
  }
  // The downpipe at the far corner, and the porch lantern's bracket.
  for (let y = 0; y <= WALL_H; y++) for (const dx of [0, 1]) wall.add(YARD.x1 - 3 + dx, y, wz - 1, y % 16 === 0 ? "lamp" : "pipe");
  box(wall, [PORCH_LAMP[0], PORCH_LAMP[0]], [PORCH_LAMP[1] + 5, PORCH_LAMP[1] + 6], [wz - 3, wz], "lamp");

  /* ---------- the lamps ---------- */

  // Garden lanterns, dark green with warm panes and a little peaked roof, lit at night (where:
  // GATE_LAMPS and the rest, above). Each throws a soft pool of light on the ground and a glow round its panes.
  const lampPart = part();
  const panes = part();
  const porchPanes = part();
  const lights = []; // [x, y, z] of each one's panes, how big its glow, and how wide its pool
  function lantern([x, y, z], body, glass) {
    box(body, [x - 2, x + 2], [y - 4, y - 4], [z - 2, z + 2], "lampDark"); // its foot
    for (let yy = y - 3; yy <= y + 2; yy++)
      for (const [dx, dz] of [
        [-2, -2],
        [2, -2],
        [-2, 2],
        [2, 2],
      ])
        body.add(x + dx, yy, z + dz, "lamp");
    box(glass, [x - 1, x + 1], [y - 3, y + 2], [z - 1, z + 1], "lampLit");
    // The roof: wider than the lantern, stepping up to a brass knob.
    box(body, [x - 3, x + 3], [y + 3, y + 3], [z - 3, z + 3], "lampDark");
    box(body, [x - 2, x + 2], [y + 4, y + 4], [z - 2, z + 2], "lamp");
    box(body, [x - 1, x + 1], [y + 5, y + 5], [z - 1, z + 1], "lamp");
    body.add(x, y + 6, z, "brass");
  }
  // A basket of flowers hanging at [x, y, z]: a mossy bowl, pink and white flowers on top, trailing ivy.
  function basket([x, y, z]) {
    for (let dx = -3; dx <= 3; dx++)
      for (let dz = -3; dz <= 3; dz++)
        for (let dy = -3; dy <= 0; dy++)
          if (dx * dx + dz * dz + dy * dy * 1.6 <= 10) lampPart.add(x + dx, y + dy, z + dz, dy === 0 ? "soil" : "moss");
    for (let k = 0; k < 14; k++) {
      const [dx, dz] = [Math.round((hash(k, 1, 64) - 0.5) * 6), Math.round((hash(k, 2, 64) - 0.5) * 6)];
      if (dx * dx + dz * dz <= 10) lampPart.add(x + dx, y + 1, z + dz, ["pink", "white", "pink", "lotus", "leaf"][k % 5]);
    }
    for (const [dx, dz, n] of [
      [-3, 0, 4],
      [2, 2, 3],
      [1, -3, 5],
    ])
      for (let k = 1; k <= n; k++) lampPart.add(x + dx, y - 1 - k, z + dz, k % 2 ? "leaf" : "leafDark");
    // Its chains, from the rim up to the hook.
    for (let dy = 1; dy <= 4; dy++)
      for (const [dx, dz] of [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
      ])
        lampPart.add(Math.round(x + dx * (1 - dy / 5)), y + dy, Math.round(z + dz * (1 - dy / 5)), "lampDark");
  }
  // The gate's: on the posts, the pool of light across the gateway.
  for (const at of GATE_LAMPS) {
    lantern(at, lampPart, panes);
    lights.push([at, 11, 22]);
  }
  // Along the path: a short square post, a band of panes round its top under a little cap.
  for (const [x, z] of PATH_LAMPS) {
    box(lampPart, [x - 1, x + 1], [0, 5], [z - 1, z + 1], (px, y) => (y === 0 || y === 4 ? "lampDark" : "lamp"));
    for (let y = 6; y <= 8; y++)
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) (dx && dz ? lampPart : panes).add(x + dx, y, z + dz, dx && dz ? "lamp" : "lampLit");
    box(lampPart, [x - 2, x + 2], [9, 9], [z - 2, z + 2], "lampDark");
    box(lampPart, [x - 1, x + 1], [10, 10], [z - 1, z + 1], "lamp");
    block(x - 2, x + 3, z - 2, z + 3);
    lights.push([[x, 7, z], 6, 13]);
  }
  // The street lamp: a slim post on a stepped foot, with collars, and a bracket out for the basket.
  {
    const [x, z] = STREET_LAMP;
    for (let y = 0; y <= STREET_Y - 5; y++) {
      const r = y < 2 ? 2 : y < 4 ? 1 : 0;
      for (let dx = -r; dx <= r + 1; dx++)
        for (let dz = -r; dz <= r + 1; dz++) lampPart.add(x + dx, y, z + dz, y === STREET_Y - 8 || y === 3 ? "lampDark" : "lamp");
    }
    const bx = x + 10; // where the basket hangs
    for (let k = 1; k <= 9; k++) lampPart.add(x + 1 + k, STREET_Y - 7, z, "lampDark");
    lampPart.add(bx, STREET_Y - 8, z, "lampDark");
    lantern([x, STREET_Y, z], lampPart, panes);
    basket([bx, STREET_Y - 13, z]);
    block(x - 3, bx + 3, z - 3, z + 4);
    lights.push([[x, STREET_Y, z], 13, 30]);
  }
  lantern(PORCH_LAMP, wall, porchPanes); // (with what else is on the wall, to fade with it: peek.js)
  lights.push([PORCH_LAMP, 11, 24]);
  // A leafy garland along under the fascia, looping between hooks, little coloured bulbs in it, glowing
  // softly brighter and dimmer at night, each in its own time (none over the bedroom window and its shutters).
  const bulbAt = [];
  for (let x = YARD.x0 + 6; x <= YARD.x1 - 6; x++) {
    if (x > 96 && x < 166) continue;
    const sag = Math.sin(((x - YARD.x0 - 6) / 26) * Math.PI) ** 2; // 0 at each hook, 1 halfway between
    const y = WALL_H - 4 - Math.round(sag * 4);
    wall.add(x, y, wz - 1, hash(x, 3, 65) < 0.5 ? "leaf" : "leafDark");
    if (hash(x, 4, 65) < 0.5) wall.add(x, y + 1, wz - 1, "leafDark");
    if (x % 6 === 0) bulbAt.push([x, y - 1.2, wz - 2]);
  }
  const BULB_COLORS = ["#ffd27a", "#ff9e8a", "#a8e6a0", "#9fd3ff"].map((c) => new THREE.Color(c));
  const bulbs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 2, 1.4), new THREE.MeshBasicMaterial(), bulbAt.length);
  const bulbColor = new THREE.Color();
  bulbAt.forEach((p, i) => bulbs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(...p)));
  updates.push((t) => {
    bulbAt.forEach((_, i) =>
      bulbs.setColorAt(i, bulbColor.copy(BULB_COLORS[i % 4]).multiplyScalar(night ? 0.75 + 0.25 * Math.sin(t * 2 + i * 1.7) : 0.45))
    );
    bulbs.instanceColor.needsUpdate = true;
  });
  const paneMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xb9ad94 });
  const onWall = [mesh(wall), solid(porchPanes, C, paneMat), bulbs];
  flat.add(onWall[0]); // (the house's wall casts no shadow out here, so neither does what hangs on it)
  group.add(mesh(lampPart), solid(panes, C, paneMat), ...onWall);
  // At night: under each lamp a pool of warm light, brightest beneath it and fading out smoothly, added over
  // what is there; and round its panes a soft glow. (Each one texture, drawn once, smooth rather than
  // pixelated.)
  const radial = (stops) => {
    const t = pixelTexture(64, 64, (g, w) => {
      const grad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      for (const [at, a] of stops) grad.addColorStop(at, `rgba(255, 255, 255, ${a})`);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, w);
    }).tex;
    t.magFilter = t.minFilter = THREE.LinearFilter;
    return t;
  };
  const glowAt = (tex, color) => ({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const poolMat = new THREE.MeshBasicMaterial(
    glowAt(
      radial([
        [0, 0.5],
        [0.25, 0.36],
        [0.55, 0.14],
        [0.8, 0.04],
        [1, 0],
      ]),
      0xffc98a
    )
  );
  const haloMat = new THREE.SpriteMaterial(
    glowAt(
      radial([
        [0, 0.95],
        [0.2, 0.55],
        [0.5, 0.15],
        [1, 0],
      ]),
      0xffd9a0
    )
  );
  const poolShape = new THREE.PlaneGeometry(2, 2);
  // The porch lamp's, by the wall: only the outer half, from the foot of the wall out (a whole one reaches in
  // under the floor indoors, and shows through it where the depth is too coarse to tell them apart).
  const halfPool = new THREE.PlaneGeometry(2, 1).translate(0, 0.5, 0);
  const uv = halfPool.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 0.5 + 0.5 * uv.getY(i));
  const nightGlows = lights.flatMap(([[x, y, z], halo, r]) => {
    const porch = z === PORCH_LAMP[2];
    const m = new THREE.Mesh(porch ? halfPool : poolShape, poolMat);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(r, r, 1);
    m.position.set(x, -0.1, porch ? YARD.z1 : z);
    const h = new THREE.Sprite(haloMat);
    h.scale.setScalar(halo * 2);
    h.position.set(x, y, z);
    return [m, h];
  });
  nightGlows.forEach((m) => (m.visible = false));
  group.add(...nightGlows);

  group.add(mesh(edging), mesh(kerb), mesh(green), mesh(fence), mesh(flowers), mesh(tree), mesh(pond), mesh(things));

  /* ---------- what moves ---------- */

  const v = new THREE.Vector3();
  updates.push((t, dt) => {
    // The gate swings open for anyone close to it, and shut behind them.
    const near = gate.near?.() ?? false;
    gate.k += ((near ? 1 : 0) - gate.k) * (1 - Math.exp(-5 * dt));
    gatePivot.outer.rotation.y = -1.35 * gate.k;
    const k = Math.min(1, Math.max(0, parasol.k + (raining ? dt : -dt) / 1.5));
    if (k !== parasol.k) sun.dirty = true;
    parasol.k = k;
    const open = parasol.k * parasol.k * (3 - 2 * parasol.k);
    parasol.mesh.scale.set(0.08 + 0.92 * open, 2.6 - 1.6 * open, 0.08 + 0.92 * open);
    swingPivot.outer.rotation.x = swing.angle;
    // The hammock, clicked: a little rock to and fro, dying away.
    nap.rocked += dt;
    rock.rotation.z = nap.rocked < 3 ? 0.12 * Math.exp(-1.6 * nap.rocked) * Math.sin(5.5 * nap.rocked) : 0;
    // Now and then a fish rising, by day; drops all over it in the rain.
    glints.tex.offset.x = (t * 0.01) % 1;
    if (!night && Math.random() < dt / 6) ripple(POND.x + (Math.random() - 0.5) * POND.rx, POND.z + (Math.random() - 0.5) * POND.rz, 1.3);
    if (raining)
      for (let k = 0; k < 2; k++)
        if (Math.random() < dt * 12) ripple(POND.x + (Math.random() - 0.5) * 1.7 * POND.rx, POND.z + (Math.random() - 0.5) * 1.7 * POND.rz, 0.35);
    drawWater(t);
    glintMat.opacity = (night ? 0.15 : 0.45) + (night ? 0.05 : 0.25) * Math.sin(t * 1.7); // twinkling
  });

  // Where the swing's seat is just now, a little above where a rider's feet would be on the ground: the
  // pivot of the ropes, turned by `angle`.
  swing.riderAt = (angle = swing.angle) => {
    const [px, py, pz] = swing.pivot;
    v.set(0, -py, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
    return [px, py + v.y, pz + v.z];
  };

  /* ---------- where they go out here ---------- */

  const seat = (key, [x, z], yaw, front) => ({ key, x, z, yaw, front: turned([x, z], yaw, [0, front]) });
  const byHammock = (l) => turned([HAMMOCK.x, HAMMOCK.z], HAMMOCK.yaw, l); // a point by the hammock: [across, along]
  const spots = {
    // Out of the front door onto the porch, and back.
    step: [DOOR.x, YARD.z1 - 14],
    // Through the gate: just inside it, and out on the lane.
    gate: { inside: [DOOR.x, YARD.fence + 16], outside: [DOOR.x, LANE.z0 + 13] },
    // Along the lane, to either end and back; the lamp post by the gate for the dog to sniff.
    lane: [
      [YARD.x0 + 22, LANE.z0 + 12],
      [YARD.x1 - 28, LANE.z0 + 12],
    ],
    laneLamp: { at: [STREET_LAMP[0], STREET_LAMP[1] + 12], post: [STREET_LAMP[0], 5, STREET_LAMP[1]] },
    stars: [-30, -182], // out on the lawn
    // The pond: one on its house side, one at its end, the dog between (apart on screen, seen turned round).
    pond: [
      [POND.x - 8, POND.z + POND.rz + 13],
      [POND.x - POND.rx - 12, POND.z + 4],
      [POND.x - 30, POND.z + POND.rz + 13],
    ],
    pondMid: [POND.x, 1, POND.z],
    bench: [10, -10].map((lx, i) => seat(`bench${i}`, turned([BENCH.x, BENCH.z], BENCH.turn, [lx, 0]), BENCH.turn + Math.PI, 17)), // (left, right on screen)
    benchDog: turned([BENCH.x, BENCH.z], BENCH.turn, [0, -18]), // lying at their feet
    // The hammock: lying in it (the hips, 1.5 below the canvas there as on the bed indoors, its top 6.5 at
    // the bottom of the sag; the back raised by `tilt` along the canvas, up to the pillow's top, 9.5 some 16
    // further on), sitting on its edge to get in (facing out, the viewer's side), and standing beside it;
    // where someone keeping her company kneels (at her head end), and where the dog lies.
    hammock: {
      key: "hammock",
      x: byHammock([0, 2])[0],
      z: byHammock([0, 2])[1],
      y: 5,
      tilt: Math.atan2(9.5 - 6.5, 16.5),
      yaw: HAMMOCK.yaw,
      sitYaw: HAMMOCK.yaw + Math.PI / 2,
      end: byHammock([7, 2]),
      front: byHammock([19, 2]),
      side: byHammock([7, -38]), // (past the head end of the stand, not in front of her)
      dog: byHammock([24, 10]), // where the dog lies, off its lead; on it, by whoever holds it:
      dogBySide: byHammock([16, -34]), // beside him at the head end
      dogByHer: byHammock([16, 12]), // on the grass in front of her
    },
    swing,
    swingWatch: [SWING.x + 26, SWING.z + 4],
    bath: { at: [BATH[0] + 14, BATH[1] - 6], bowl: [BATH[0], 16, BATH[1]] }, // (clear of the hammock)
    tree: { at: [TREE[0] + 18, TREE[1] + 16], trunk: [TREE[0], 20, TREE[1]] },
    // The middle of the blanket, by the plate (they kneel either side of it, apart on screen), and where the
    // dog lies, off to one side.
    picnic: { mid: [PICNIC.x - 3, PICNIC.z], dog: [PICNIC.x + 12, PICNIC.z + 22] },
    // The beds along the wall and the fence: where to stand to smell the flowers, and the flowers.
    flowers: [
      { at: [-128, YARD.z1 - 22], bloom: [-128, 6, YARD.z1 - 7] },
      { at: [-96, YARD.z1 - 22], bloom: [-96, 6, YARD.z1 - 7] },
      { at: [-22, YARD.z1 - 20], bloom: [-16, 5, YARD.z1 - 7] },
      { at: [-100, YARD.fence + 20], bloom: [-100, 10, YARD.fence + 6] },
      { at: [0, YARD.fence + 20], bloom: [0, 6, YARD.fence + 6] },
    ],
    // Open lawn, for throwing a ball.
    lawn: [
      [
        [-30, 30],
        [-212, -150],
      ],
      [
        [96, 132],
        [-186, -158],
      ], // (clear of the picnic blanket)
    ],
  };

  // How wet it is out here (0 to 1, weather.js), and whether it is still raining: everything wet to look
  // at, the cherry tree dripping a while after the rain.
  WET.uTree.value.set(TREE[0] - 2, TREE[1] - 2);
  WET.uPorch.value.set(DOOR.x, 18, YARD.z1 - 12);
  let soaked = 0;
  let raining = false;
  let dripDebt = 0;
  updates.push((t, dt) => {
    WET.uWet.value = soaked;
    if (raining || soaked < 0.15) return;
    for (dripDebt += 5 * soaked * dt; dripDebt >= 1; dripDebt--) {
      const [a, r] = [Math.random() * Math.PI * 2, Math.sqrt(Math.random()) * 30];
      drops.emit("drip", TREE[0] - 2 + Math.cos(a) * r, 52, TREE[1] - 2 + Math.sin(a) * r, 0, -4, 0, 3);
    }
  });
  const soak = (wet, rain) => {
    soaked = wet;
    raining = rain;
  };
  // Under the tree's crown, the porch roof or the open parasol, where the rain mostly does not reach.
  const sheltered = (x, z) =>
    Math.hypot(x - TREE[0] + 2, z - TREE[1] + 2) < 30 ||
    (Math.abs(x - DOOR.x) < 18 && z > YARD.z1 - 12) ||
    (parasol.k > 0.6 && Math.hypot(x - parasol.hub[0], z - parasol.hub[1]) < parasol.r);

  // In the sun, all that stands still out here casts a shadow (on SUN_LAYER, so that nothing indoors does)
  // and takes them, drawn once and again only as the sun moves or the parasol opens (room.js): not what moves
  // (the gate, the swing), nor what glows, nor the ground and the water (they only take them).
  const sun = { on: true, dirty: true };
  const moving = new Set([gatePivot.outer, swingPivot.outer]);
  (function inTheSun(o) {
    if (moving.has(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.material.isMeshBasicMaterial) {
      o.receiveShadow = true;
      if (!flat.has(o) && !(o.geometry instanceof THREE.PlaneGeometry)) {
        o.castShadow = true;
        o.layers.enable(SUN_LAYER);
      }
    }
    o.children.forEach(inTheSun);
  })(group);

  function dress(isNight) {
    night = isNight;
    WET.uSheen.value.set(isNight ? "#3a4866" : "#cfdde6");
    paneMat.color.set(night ? 0xffffff : 0xb9ad94);
    nightGlows.forEach((m) => (m.visible = night));
  }

  return {
    yard: {
      group,
      nap,
      // Paths keep to the garden and the lane, off the back wall.
      bounds: [YARD.x0 + 6, YARD.x1 - 6, YARD.z0 + 4, YARD.z1 - 6],
      obstacles,
      spots,
      gate,
      swing,
      parasol,
      sun, // its shadows to be drawn again (`dirty`)
      pond: POND,
      ripple, // rings on the pond from [x, z], `size` 1 for a duck paddling
      pads: PADS.map(([x, z]) => [x, z]), // the lily pads
      flowerBeds: [
        [YARD.x0 + 10, PORCH.x0 - 6, YARD.z1 - 10, YARD.z1 - 2],
        [48, 104, YARD.z1 - 10, YARD.z1 - 2],
        [YARD.x0 + 10, GATE.x0 - 14, YARD.fence + 4, YARD.fence + 9],
        [100, 108, YARD.fence + 4, YARD.fence + 9],
      ], // where butterflies go (wildlife.js)
      tree: TREE,
      bath: BATH,
      lamps: lights.map(([at, halo]) => [at, halo]), // where each lamp's panes are, and how big it glows (moths: wildlife.js)
      onWall, // what is on the wall outside (it fades with the wall: peek.js)
      lane: LANE,
      dress,
      soak,
      sheltered,
    },
  };
}
