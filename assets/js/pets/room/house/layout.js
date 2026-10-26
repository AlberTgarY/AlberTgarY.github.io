/*******************************************************************************
 * Where the walls, the loft and the doors of the playground's home are, where
 * the front garden is out of the front door, and how high the floor is anywhere
 * (house.js passes these on to the rest).
 ******************************************************************************/

import { smoothstep } from "../../models/voxels.js";

export const X0 = -150; // the left wall
export const X1 = 150; // the open right side downstairs, where the garden begins
export const SIDE = 210; // the open right side of the loft, and the garden's fence
export const BACK = -110; // the back wall
export const FRONT = 110; // the open front
export const WALL_H = 96;
export const WALL_T = 4;
export const LOFT = { x0: 0, z1: -28, y: 18 }; // the raised floor: x >= x0, z <= z1, at height y
export const STAIRS = { x0: -30, z1: -84, run: 5, rise: 3 }; // six steps up along the back wall, from x0 to the loft
export const DOOR = { x: -50, half: 12, height: 58 };
export const GARDEN_DOOR = { z: 40, half: 15 }; // the gap in the low wall between the living room and the garden
// Out of the front door, behind the back wall: the front garden as wide as the house, a picket fence along
// its far side (with a gate in line with the door) and the lane beyond it (house/yard.js).
export const YARD = { x0: X0 - WALL_T, x1: SIDE, z0: BACK - WALL_T - 144, z1: BACK - WALL_T, fence: BACK - WALL_T - 117 };

// How high the floor is at (x, z): the loft, a step of the stairs, or the ground.
export function floorY(x, z) {
  if (z > LOFT.z1 || z < BACK) return 0; // (out of the front door, the garden is level with the ground floor)
  if (x >= LOFT.x0) return LOFT.y;
  if (x <= STAIRS.x0 || z >= STAIRS.z1) return 0;
  const u = (x - STAIRS.x0) / STAIRS.run;
  const k = Math.floor(u);
  return STAIRS.rise * (k + smoothstep(0, 0.4, u - k)); // up onto each step near its edge
}
