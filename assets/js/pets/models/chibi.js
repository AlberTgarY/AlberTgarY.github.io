/*******************************************************************************
 * The body the girl and the boy share (girl.js, boy.js): one skeleton, so every
 * pose fits both. Legs swing from the hips and fold at the knee; arms pivot at
 * the shoulder and the elbow. Each of them dresses it in their own clothes,
 * built for the day and for the night, and poseLimbs blends the poses they are in.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { pivotGroup } from "./voxels.js";

// Legs and arms on `pose`. `wear(parent, build)` hangs a piece of clothing built by `build(night)` on a
// joint; `thigh`, `shin`, `upper` and `fore` build each piece as (side, x0, night), where side is -1 for
// the right (the -x side) and x0 the piece's inner edge.
export function limbs(pose, wear, { thigh, shin, upper, fore }) {
  const legs = [-1, 1].map((side) => {
    const x0 = side > 0 ? 1 : -2;
    const hip = pivotGroup(pose, [x0 + 0.5, 8.5, -0.5]);
    wear(hip.inner, (night) => thigh(side, x0, night));
    const knee = pivotGroup(hip.inner, [x0 + 0.5, 4.5, -1.5]); // the knee hinges at the back of the leg
    wear(knee.inner, (night) => shin(side, x0, night));
    return { hip, knee };
  });
  const arms = [-1, 1].map((side) => {
    const x0 = side > 0 ? 5 : -7;
    const shoulder = pivotGroup(pose, [side * 6, 18.5, -0.5]);
    shoulder.outer.rotation.order = "YXZ"; // turning about y swings a raised arm in towards the middle
    wear(shoulder.inner, (night) => upper(side, x0, night));
    const elbow = pivotGroup(shoulder.inner, [side * 6, 13.5, -0.5]);
    wear(elbow.inner, (night) => fore(side, x0, night));
    const hand = new THREE.Object3D(); // where the hand holds things
    hand.position.set(side * 5.5, 8, -0.5);
    elbow.inner.add(hand);
    return { shoulder, elbow, hand };
  });
  return { legs, arms };
}

// Arm poses: [shoulder, elbow] turns about x (forward is negative). Kneeling or sitting, the hands rest on
// the thighs; feeding, both hold the bag out towards the bowl, then clap. Nibbling, both hold the cucumber
// up under the lips.
const SIT = [-0.35, -0.45];
const OFFER = [-1.2, -0.2];
const CLAP = [-1.1, -0.5];
const EAT = [-1.47, -0.68];
// Pork rice: the left hand holds the bowl; the right one dips the chopsticks into it and brings them up
// to the mouth (each solved as a two-link reach for the chopstick tips), swung in a little so both hands
// meet the bowl.
const HOLD_BOWL = [-0.45, -0.6];
const DIP = [-0.27, -1.58];
const BITE = [-1.43, -1.14];
// Grape tea: both hands round the cup (solved like the chopsticks).
const HOLD_CUP = [-0.62, -1.06, 0.26];
const HOLD_LEADS = [-0.45, -0.5]; // one hand held out in front, the leads in it
const HOLD_CAN = [-0.66, -0.9, 0.44]; // the left hand out to the side at the can's handle (solved like the cup)
// Petting: on the floor, one hand reaches out in front to stroke; on the sofa each hand reaches out to the
// side and up onto the back of the pet sitting there (turning about z, solved like the cup).
const STROKE = [-1.3, -0.15];
const PAT = [1.25, 1.9];
// Cross: hands on hips (each arm out to the side, the forearm bent back in), stamping a foot.
const HIPS = [0.75, -1.9];

// Pose the legs and arms from how far into each pose they are (0 to 1; a pair per arm for the ones done
// with one hand), the walk (`stride`, `gait`) and the running phases in `phase` (wave, clap, pat). Any
// pose not given is not in use. `hold`, if given, then takes the arms over by `hold.w`: its `arms` are
// [shoulder x, elbow x, shoulder y, shoulder z, elbow z] for the right arm and then the left, each arm
// weighted again by `hold.mix`, if given.
export function poseLimbs({ legs, arms }, p) {
  const { kneel = 0, sit = 0, stride = 0, gait = 0, stamp = 0, dizzy = 0, elapsed = 0, phase, wave = 0, hold } = p;
  const [eat, offer, clap, water, rice, cupHeld, cross, bite, munch, shake] = [
    p.eat,
    p.offer,
    p.clap,
    p.water,
    p.rice,
    p.cupHeld,
    p.cross,
    p.bite,
    p.munch,
    p.shake,
  ].map((v) => v || 0);
  const [holding, strokes, pats] = [p.holding, p.strokes, p.pats].map((v) => v || [0, 0]);

  // Legs swing in opposite phase, the knee bending as each one swings back; to sit, the legs kneel, or on
  // a seat they dangle over its edge, swinging a little.
  const upright = 1 - kneel - sit;
  legs.forEach(({ hip, knee }, i) => {
    const swing = Math.sin(gait + (i ? Math.PI : 0));
    hip.outer.rotation.x = upright * 0.42 * stride * swing - (Math.PI / 2) * (kneel + sit) - (i ? 0 : 0.5 * stamp);
    knee.outer.rotation.x =
      upright * 0.5 * stride * Math.max(0, swing) +
      Math.PI * kneel +
      sit * (Math.PI / 2 + 0.15 * Math.sin(phase.pat * 0.5 + i * Math.PI)) +
      (i ? 0 : 0.6 * stamp);
  });

  // Arms swing against the legs; both hold the cucumber, the cup or the bag, or clap; with the rice the
  // left holds the bowl and the right eats; one holds the leads out on a walk; the left one holds the
  // watering can out to the side; one strokes a pet in front, or on a seat each strokes the pet beside it;
  // cross, both go on the hips; otherwise the left one (nearer the camera) lets go to wave.
  arms.forEach(({ shoulder, elbow }, i) => {
    const keep = i ? 1 - wave : 1;
    const [e, o, c, l, st] = [eat, offer, clap, holding[i], strokes[i]].map((v) => v * keep);
    const [w, pat] = [i ? water : 0, pats[i]];
    const side = i ? 1 : -1;
    const posed = Math.min(1, e + o + c + l + w + st + pat + rice + cupHeld + cross + (i ? wave : 0));
    const free = upright * (1 - posed);
    const swing = 0.42 * stride * Math.sin(gait + (i ? 0 : Math.PI)) + dizzy * 0.3 * Math.sin(elapsed * 5 + i); // flopping about when dizzy
    const [riceShoulder, riceElbow] = i ? HOLD_BOWL : [DIP[0] + bite * (BITE[0] - DIP[0]), DIP[1] + bite * (BITE[1] - DIP[1])];
    shoulder.outer.rotation.x =
      free * swing +
      (kneel + sit) * (1 - posed) * SIT[0] +
      st * (STROKE[0] + 0.12 * Math.sin(phase.pat)) +
      e * EAT[0] +
      o * OFFER[0] +
      c * CLAP[0] +
      rice * riceShoulder +
      cupHeld * HOLD_CUP[0] +
      l * (HOLD_LEADS[0] + 0.05 * Math.sin(gait)) +
      w * HOLD_CAN[0];
    elbow.outer.rotation.x =
      -0.25 * stride * free +
      (kneel + sit) * (1 - posed) * SIT[1] +
      st * STROKE[1] +
      e * EAT[1] +
      o * (OFFER[1] + 0.15 * shake) +
      c * CLAP[1] +
      rice * riceElbow +
      cupHeld * HOLD_CUP[1] +
      l * HOLD_LEADS[1] +
      w * HOLD_CAN[1];
    shoulder.outer.rotation.z =
      0.08 * munch * e + // nibbling along it
      (i ? 1.2 * wave : 0) +
      side * pat * (PAT[0] + 0.12 * Math.sin(phase.pat + i * Math.PI)) +
      side * cross * HIPS[0];
    shoulder.outer.rotation.y =
      (i ? -1 : 1) * (c * (0.42 + 0.14 * Math.sin(phase.clap)) + cupHeld * HOLD_CUP[2]) + rice * (i ? -0.3 : 0.4) + w * HOLD_CAN[2]; // the hands meet
    elbow.outer.rotation.z = (i ? wave * (1.1 + 0.45 * Math.sin(phase.wave)) : 0) + side * pat * PAT[1] + side * cross * HIPS[1];

    const held = hold ? hold.w * (hold.mix ? hold.mix[i] : 1) : 0;
    if (held > 0) {
      const [sx, ex, sy, sz, ez] = hold.arms[i];
      const mix = (r, axis, v) => (r[axis] += (v - r[axis]) * held);
      mix(shoulder.outer.rotation, "x", sx);
      mix(elbow.outer.rotation, "x", ex);
      mix(shoulder.outer.rotation, "y", sy);
      mix(shoulder.outer.rotation, "z", sz);
      mix(elbow.outer.rotation, "z", ez);
    }
  });
}
