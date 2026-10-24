/*******************************************************************************
 * The steps the playground's activities (acts.js) are made of: walking
 * somewhere (up and down the stairs too, or a few steps along a garden bed),
 * turning, waiting, hopping up or down, sitting down and getting up, and
 * getting into bed and out again. Each is a generator that yields once a frame until it is done, and none can take
 * forever: a walk that gets stuck arrives anyway, and a wait has an end.
 ******************************************************************************/

import { clamp, pick, rnd } from "../stage.js";
import { smoothstep } from "../models/voxels.js";
import { HOLDS, MOVES } from "./props.js";

const HOP_TIME = 0.45; // s for a hop up onto something, or down
const BED_TIME = 1.1; // s to lie back into bed from sitting on the end of it, or to sit up again
// The ways a person gets up off a seat: straight up, leaning forward with the hands on the knees and
// pushing up, or with a stretch first. Never the same way twice running, so two getting up together don't
// move as one.
const GET_UP = ["plain", "push", "stretch"];

export function makeSteps(home) {
  const { clock, nav } = home;
  const { floorY } = home.house;
  let lastGetUp = null;

  // Walk to [x, z] round the furniture (as found by nav.js), at `pace` times the usual speed, on whatever
  // floor is underfoot; never off the floor. Close behind someone going the same way, it falls in behind
  // them rather than walking through them; stepped so far aside to pass someone that the way on would cut
  // through the furniture, it finds the way again from there.
  function* walk(a, [x, z], pace = 1) {
    const [x0, x1, z0, z1] = home.house.bounds;
    [x, z] = [clamp(x, x0, x1), clamp(z, z0, z1)];
    let end = -Infinity;
    const route = () => {
      const points = nav.path(a.x, a.z, x, z);
      let length = 0;
      points.reduce(([px, pz], [qx, qz]) => ((length += Math.hypot(qx - px, qz - pz)), [qx, qz]), [a.x, a.z]);
      end = Math.max(end, clock.t + length / (a.speed * pace) + 3);
      return points;
    };
    let points = route();
    a.goal = [x, z];
    a.pace = pace;
    a.walking = true;
    try {
      for (let k = 0; k < points.length; ) {
        const [px, pz] = points[k];
        const d = Math.hypot(px - a.x, pz - a.z);
        const [ux, uz] = [(px - a.x) / (d || 1), (pz - a.z) / (d || 1)];
        const behind = following(a, ux, uz);
        if (behind) end += 0.6 * clock.dt; // the time lost holding back
        const stride = a.speed * a.pace * clock.dt * (behind ? 0.4 : 1);
        if (d <= stride || clock.t > end) {
          a.x = clock.t > end ? x : px;
          a.z = clock.t > end ? z : pz;
          a.y = floorY(a.x, a.z);
          if (clock.t > end) return;
          k++;
          continue;
        }
        const [dx, dz] = aside(a, ux, uz);
        if (d > 0.5) a.faceTowards(a.x + dx, a.z + dz);
        a.x += dx * stride;
        a.z += dz * stride;
        a.y = floorY(a.x, a.z);
        const swerved = Math.abs(dx * uz - dz * ux) > 0.05;
        if (swerved && nav.free(a.x, a.z) && nav.free(px, pz) && !nav.clearLine(a.x, a.z, px, pz)) {
          points = route();
          k = 0;
        }
        yield;
      }
    } finally {
      a.walking = false;
      a.pace = 1;
    }
  }

  // A few steps straight to [x, z] close by, as along a garden bed from one plant to the next, where the way
  // round (out onto the free floor and back) would be silly.
  function* stepTo(a, [x, z], pace = 0.7) {
    a.goal = [x, z];
    a.pace = pace;
    a.walking = true;
    try {
      for (;;) {
        const d = Math.hypot(x - a.x, z - a.z);
        const stride = a.speed * pace * clock.dt;
        if (d <= stride) break;
        a.faceTowards(x, z);
        a.x += ((x - a.x) / d) * stride;
        a.z += ((z - a.z) / d) * stride;
        yield;
      }
      [a.x, a.z] = [x, z];
    } finally {
      a.walking = false;
      a.pace = 1;
    }
  }

  // Whether `a`, stepping along (dx, dz), is close behind (or level with, and second to) someone walking the
  // same way, and so should hold back to let them go first.
  function following(a, dx, dz) {
    const i = home.actors.indexOf(a);
    return home.actors.some((o, j) => {
      if (o === a || o.out || !o.walking || Math.abs(o.y - a.y) > 5) return false;
      const [ox, oz] = [o.x - a.x, o.z - a.z];
      const dist = Math.hypot(ox, oz);
      if (dist > 10 || !o.goal) return false;
      const [gx, gz] = [o.goal[0] - o.x, o.goal[1] - o.z];
      const same = (gx * dx + gz * dz) / (Math.hypot(gx, gz) || 1) > 0.5; // going much the same way
      const ahead = dist > 0.01 ? (ox * dx + oz * dz) / dist : 0;
      return same && (ahead > 0.15 || (ahead > -0.15 && j < i));
    });
  }

  // The way to step along (dx, dz), bending round anyone close ahead so they pass each other rather than
  // through; straight on where that would mean stepping into the furniture or off the edge of a floor.
  function aside(a, dx, dz) {
    let [sx, sz] = [dx, dz];
    for (const o of home.actors) {
      if (o === a || o.out || Math.abs(o.y - a.y) > 5) continue;
      const [ox, oz] = [o.x - a.x, o.z - a.z];
      const dist = Math.hypot(ox, oz);
      const ahead = dist > 0.01 ? (ox * dx + oz * dz) / dist : 0;
      if (dist > 22 || ahead < 0.2) continue;
      const away = -(Math.sign(dx * oz - dz * ox) || 1) * 0.9 * (1 - dist / 22) * ahead;
      sx += -dz * away;
      sz += dx * away;
    }
    const n = Math.hypot(sx, sz);
    [sx, sz] = [sx / n, sz / n];
    // Already in the margin round the furniture (as a path round a corner may be), the step aside need only
    // keep out of the furniture itself and off a floor's edge.
    const [x, z] = [a.x + sx * 4, a.z + sz * 4];
    const solid =
      home.house.obstacles.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1) || Math.abs(floorY(x, z) - floorY(a.x, a.z)) > 2;
    return nav.free(x, z) || (!nav.free(a.x, a.z) && !solid) ? [sx, sz] : [dx, dz];
  }

  // Turn to face `yaw` (0 faces the front of the room).
  function* turn(a, yaw) {
    a.face(yaw);
    const end = clock.t + 1;
    while (!a.turned() && clock.t < end) yield;
  }

  // Wait `secs`; a calm wait ends early when the actor is asked to wrap up (to wake, or to join someone).
  function* wait(a, secs, calm = false) {
    const end = clock.t + secs;
    if (calm) a.calm = true;
    try {
      while (clock.t < end && !(calm && a.interrupt)) yield;
    } finally {
      if (calm) a.calm = false;
    }
  }

  // Wait until `done()`, for at most `secs`; whether it happened.
  function* until(done, secs) {
    const end = clock.t + secs;
    while (!done() && clock.t < end) yield;
    return done();
  }

  // Move from where it is to [x, y, z] in `secs`, along an arc `rise` high (a hop) or straight (a glide).
  function* arc(a, [x, y, z], secs, rise) {
    const from = [a.x, a.y, a.z];
    const t0 = clock.t;
    for (;;) {
      const k = clamp((clock.t - t0) / secs, 0, 1);
      a.x = from[0] + (x - from[0]) * k;
      a.z = from[2] + (z - from[2]) * k;
      a.y = from[1] + (y - from[1]) * smoothstep(0, 1, k) + rise * Math.sin(Math.PI * k);
      if (k >= 1) return;
      yield;
    }
  }

  // Hop to [x, y, z]: up onto a seat, a bed, the desk or the cat tree, or back down.
  function* hop(a, [x, y, z]) {
    a.faceTowards(x, z);
    yield* arc(a, [x, y, z], HOP_TIME, 5 + 0.3 * Math.abs(y - a.y));
  }

  // Slide from where it is to [x, z] in `secs` without walking: settling back into a seat, or out of it.
  function* glide(a, [x, z], secs) {
    yield* arc(a, [x, a.y, z], secs, 0);
  }

  // Sit on a seat (house.js spots): walk to its front, turn the way it faces, and sit back into it; a pet
  // hops up onto it and lies down. Remembers where to get down to.
  function* sitOn(a, seat) {
    yield* walk(a, seat.front);
    a.ground = seat.front;
    if (a.human) {
      yield* turn(a, seat.yaw);
      a.seated = true;
      yield* glide(a, [seat.x, seat.z], 0.55);
    } else {
      yield* hop(a, seat.pet);
      a.face(seat.petYaw); // facing out, a little away from the middle of the sofa
      a.lie = true;
    }
  }

  // Get up off a seat (or any perch) and back down to the floor in front of it.
  function* getUp(a) {
    const [x, z] = a.ground || [a.x, a.z + 20];
    if (a.human) {
      const how = pick(GET_UP.filter((w) => w !== lastGetUp && (w !== "stretch" || !a.hold))); // no stretching with something in hand
      lastGetUp = how;
      const [held, nod] = [a.hold, a.nod];
      if (how === "push") {
        a.nod = 0.3;
        a.hold = held || HOLDS.push;
        yield* wait(a, 0.4);
      } else if (how === "stretch") {
        a.hold = MOVES.stretch;
        a.since = clock.t;
        yield* wait(a, 1.5);
      }
      a.seated = false;
      yield* glide(a, [x, z], how === "push" ? 0.35 : 0.5);
      [a.hold, a.nod] = [held, nod];
    } else {
      a.lie = false;
      a.sit = false;
      yield* hop(a, [x, floorY(x, z), z]);
    }
    a.ground = null;
  }

  // Into bed (a person): at the foot of the bed, sit back on the end of it, as on a seat; a moment, then
  // lie back, the legs swinging up onto it, and wriggle up till the head is on the pillow. The pose follows
  // `abed` (actor.js).
  function* intoBed(a, bed) {
    yield* walk(a, bed.front);
    a.ground = bed.front;
    yield* turn(a, bed.yaw);
    a.seated = true;
    yield* glide(a, bed.end, 0.55);
    yield* wait(a, rnd(0.4, 0.9));
    a.seated = false;
    a.abed = true;
    yield* arc(a, [bed.x, bed.y, bed.z], BED_TIME, 0);
  }
  // Out of bed: sit up on the end of it, a stretch, and up onto the feet.
  function* outOfBed(a, bed) {
    const [x, z] = bed.end;
    a.abed = false;
    a.seated = true;
    yield* arc(a, [x, floorY(x, z), z], BED_TIME, 0);
    a.hold = MOVES.stretch;
    a.since = clock.t;
    yield* wait(a, 2.4);
    a.hold = null;
    a.seated = false;
    yield* glide(a, a.ground, 0.5);
    a.ground = null;
  }

  return { walk, stepTo, turn, wait, until, hop, glide, sitOn, getUp, intoBed, outOfBed };
}
