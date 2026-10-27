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
// Out of the front door, behind the back wall: the front garden as wide as the house, a picket fence along
// its far side (with a gate in line with the door) and the lane beyond it (house/yard.js).
export const YARD = { x0: X0 - WALL_T, x1: SIDE, z0: BACK - WALL_T - 144, z1: BACK - WALL_T, fence: BACK - WALL_T - 117 };

// The vegetable garden, out in the front garden in the strip along the hedge on its right, from the house wall
// down to the fence on the lane (house/garden.js): x0..x1 by z0..z1.
export const GARDEN = { x0: 142, x1: 203, z0: -229, z1: -114 };
// Under the house, the basement (house/basement.js): its floor at BASE_Y, its ceiling the underside of the
// house's floor slab (y -9).
export const BASE_Y = -61;

// Where the garden beside the living room was, the way down to the basement (house/stairs.js): off the living
// room under the loft's edge, a landing (z well..head); from it, along the house's right side, a straight
// flight (x x0..x1) down towards the front to its foot (z >= foot, at BASE_Y). The floor is open over the
// flight only (x > x0 - 2), a railing along its edge.
export const DOWN = { x0: 178, x1: 208, well: -26, head: -2, steps: 18, run: 5 };
DOWN.rise = -BASE_Y / DOWN.steps;
DOWN.foot = DOWN.head + (DOWN.steps - 0.6) * DOWN.run; // (each tread's edge 0.4 of a step on from where the last one's begins)
const onFlight = (x, z) => x > DOWN.x0 - 2 && x < DOWN.x1 + 2 && z > DOWN.head && z < FRONT;
const inWell = (x, z) => x > DOWN.x0 - 2 && x < SIDE && z > DOWN.head;

// How high the floor is at (x, z): the loft, a step of the stairs, or the ground; or, for someone `below`, in
// the basement (whose floor is the same everywhere, but on the flight down).
export function floorY(x, z, below = false) {
  if (onFlight(x, z)) {
    const u = (z - DOWN.head) / DOWN.run;
    const k = Math.floor(u);
    return Math.max(BASE_Y, -DOWN.rise * (k + smoothstep(0, 0.4, u - k))); // down onto each step near its edge
  }
  if (below || inWell(x, z)) return BASE_Y;
  if (z > LOFT.z1 || z < BACK) return 0; // (out of the front door, the garden is level with the ground floor)
  if (x >= LOFT.x0) return LOFT.y;
  if (x <= STAIRS.x0 || z >= STAIRS.z1) return 0;
  const u = (x - STAIRS.x0) / STAIRS.run;
  const k = Math.floor(u);
  return STAIRS.rise * (k + smoothstep(0, 0.4, u - k)); // up onto each step near its edge
}
