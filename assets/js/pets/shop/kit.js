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

// A part filled by `fill(p)`, as a mesh (meshOf).
export function voxels(fill, scale = 1, palette = PALETTE, lit = true) {
  const p = part();
  fill(p);
  return meshOf(p, scale, palette, lit);
}

export { part, box, solidMaterial, glowing };
