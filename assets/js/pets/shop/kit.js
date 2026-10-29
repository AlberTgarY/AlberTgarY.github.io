/*******************************************************************************
 * What the flower shop's builders share: its colours, and voxels made into
 * meshes as the house's are (room/house/kit.js solid(): only the faces that
 * show, merged), whole or finer (half and quarter voxels).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box } from "../models/voxels.js";
import { solid, solidMaterial, glowing } from "../room/house/kit.js";

// The shop's own colours by name; a voxel may also be coloured with a "#rrggbb" of its own.
export const COLORS = {
  steel: "#2e4a3d", // the kiosk's dark green steel
  steelDark: "#22392f",
  steelLight: "#3d5d4d",
  frosted: "#cfdcd8", // the panels below the glass
  frostedShade: "#b9c9c5",
  damask: "#c9c4bd", // the wallpaper inside
  damaskLine: "#b7b1a9",
  terrazzo: "#d8d2c6", // the kiosk's floor
  terrazzoChip: "#bdb5a6",
  paving: "#5f6265", // the pavement's bluestone
  pavingDark: "#55585b",
  pavingLight: "#696c6f",
  pavingJoint: "#4a4c4f",
  binBlue: "#9fb6bf", // the tall grey-blue bins
  binBlueShade: "#87a0aa",
  binBlueRim: "#b3c7ce",
  bucketBlack: "#26282b",
  bucketBlackRim: "#34373b",
  stemGreen: "#5f8a3c",
  stemDark: "#46692c",
  leafGreen: "#6e9d45",
  cellophane: "#e9f2f4",
  kraft: "#c79a63",
  kraftDark: "#ad8150",
  chalkboard: "#2a2d2b",
  chalkFrame: "#8f6440",
  chalk: "#f2f0e8",
  concrete: "#8d8a85",
  concreteDark: "#7b7873",
  concreteLight: "#a19e98",
  wood: "#b98a5e",
  woodDark: "#8f6440",
  woodLight: "#d9b083",
  chrome: "#d7dde0",
  chromeDark: "#a9b1b5",
  potBlack: "#2b2b2d",
  potPink: "#efc6c2",
  potSage: "#b9c8a8",
  potCream: "#efe6d6",
  soil: "#4a3a2c",
  white: "#f7f5f0",
  bark: "#9a8f7c",
  barkLight: "#c9c0ab",
  barkDark: "#6f6656",
  leaf: "#6f9a3f",
  leafLight: "#8db552",
  leafDark: "#557a2f",
};

// The palette a mesh is coloured from: a name in COLORS (or in `more`), or a "#rrggbb" as it is.
export const paletteOf = (more = {}) => new Proxy({ ...COLORS, ...more }, { get: (o, k) => o[k] ?? k });
export const PALETTE = paletteOf();

// The voxels of `p` (voxels.js part()) as one mesh, `scale` voxels a voxel (0.5: half voxels), lit; or `lit`
// false: glowing (lit from within).
export function meshOf(p, scale = 1, palette = PALETTE, lit = true) {
  const m = solid(p, palette, lit ? solidMaterial : glowing);
  m.scale.setScalar(scale);
  return m;
}

// Of a geometry of voxel faces, only those that can face the shop's camera: it never turns (from the front
// right and above: view.js), so a face turned to -x, -y or -z is never seen. (Set unturned in the shop.)
export function seenFaces(g) {
  const [n, index] = [g.attributes.normal, g.index.array];
  const kept = [];
  for (let i = 0; i < index.length; i += 3) {
    const v = index[i];
    if (n.getX(v) > -0.5 && n.getY(v) > -0.5 && n.getZ(v) > -0.5) kept.push(index[i], index[i + 1], index[i + 2]);
  }
  g.setIndex(kept);
  return g;
}
// For those: drawn into the sun's shadow map by their front faces (the back ones are gone).
export const seenMaterial = solidMaterial.clone();
seenMaterial.shadowSide = THREE.FrontSide;

// A part filled by `fill(p)`, as a mesh (meshOf).
export function voxels(fill, scale = 1, palette = PALETTE, lit = true) {
  const p = part();
  fill(p);
  return meshOf(p, scale, palette, lit);
}

export { part, box, solidMaterial, glowing };

// Something that swings when knocked (a chime, a bunch of flowers, a tree's crown): how far it is turned about
// x and about z, each springing back to rest `hz` times a second and dying away at `damp` a second. A knock
// adds to how fast it is turning (kick()), so that knocked again mid-swing it swings on from where it is; never
// further than `max` ([about x, about z]) either way, however often it is knocked (a chime's tubes, say, kept
// off each other).
export function swinging(hz, damp, [maxX, maxZ] = [Infinity, Infinity]) {
  const w2 = (2 * Math.PI * hz) ** 2;
  const s = {
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    w: 2 * Math.PI * hz, // (a kick of `a` times this swings it about `a` either way)
    kick(vx, vz) {
      // (how far it will swing, from where it is at the speed it turns: past the most, only slower, never moved)
      const most = (a, v, m) => (Math.hypot(a, v / s.w) <= m ? v : Math.sign(v) * s.w * Math.sqrt(Math.max(0, m * m - a * a)));
      s.vx = most(s.x, s.vx + vx, maxX);
      s.vz = most(s.z, s.vz + vz, maxZ);
    },
    still: () => Math.abs(s.x) + Math.abs(s.z) + (Math.abs(s.vx) + Math.abs(s.vz)) / s.w < 1e-4,
    step(dt) {
      if (s.still()) return Object.assign(s, { x: 0, z: 0, vx: 0, vz: 0 });
      const n = Math.ceil(dt * 240); // (in short steps, steady however fast it swings)
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        s.vx += (-w2 * s.x - 2 * damp * s.vx) * h;
        s.vz += (-w2 * s.z - 2 * damp * s.vz) * h;
        s.x += s.vx * h;
        s.z += s.vz * h;
      }
    },
  };
  return s;
}
// A knock of about `a` (radians), either way at random.
export const knock = (s, ax, az) => s.kick((Math.random() < 0.5 ? -1 : 1) * ax * s.w, (Math.random() < 0.5 ? -1 : 1) * az * s.w);
