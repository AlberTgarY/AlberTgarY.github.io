/*******************************************************************************
 * What the activities (acts.js and acts/) share: where things are on screen and
 * on the floor, and the helpers they all use (finding a seat or a free spot,
 * waiting, turning to one side).
 ******************************************************************************/

import { rnd, wrap } from "../../stage.js";
import { LOFT, X1 } from "../house.js";
import { makeSteps } from "../steps.js";
import { VIEW_YAW } from "../view.js";

export const V = VIEW_YAW; // facing the viewer
export const F = [Math.sin(V), Math.cos(V)]; // on the floor, towards the viewer
export const R = [Math.cos(V), -Math.sin(V)]; // on the floor, to the right on screen
export const SNACKS = { cucumber: 5, grapeTea: 6, porkRice: 7 }; // the girl's, and how long each takes (girl.js)
export const SAY = ["heart", "note", "star", "question", "bowl", "paw"]; // what comes up in a chat
export const TEAM_SAY = ["star", "question", "note"]; // what he says to his team
export const PET_AGAIN = [300, 480]; // s before someone who has petted or fed a pet goes to pet one again
export const ROOM = [
  [-140, 200],
  [-100, 100],
]; // where to wander, x and z (the loft and the garden too)
export const DOWNSTAIRS = [
  [-130, 130],
  [-20, 100],
]; // the open floor of the living room

// The helpers, for `home` and its `life` (life.js).
export function makeContext(home, life) {
  const { clock, house, nav, byName, humans } = home;
  const { spots, floorY } = house;
  const { walk, stepTo, turn, wait, until, hop, glide, sitOn, getUp, intoBed, outOfBed } = makeSteps(home);
  const { claim, holder, release, act, event, available, invite, summon, later, anew, onEnd } = life;
  const t = () => clock.t;
  const other = (a) => humans.find((h) => h !== a);
  const seatOf = (key) => spots.seats[key];
  const LIVING = ["sofa0", "sofa1", "sofa2", "armchair"];
  const SOFA = ["sofa0", "sofa1", "sofa2"];
  const freeSeat = (keys = LIVING) => keys.some((k) => !holder(k));
  const level = (y) => (x, z) => Math.abs(floorY(x, z) - y) < 0.01; // the top stair is only half a voxel lower
  const ground = level(0);
  const flat = (x, z) => ground(x, z) || level(LOFT.y)(x, z); // not on the stairs
  const toward = ([x, z], right, front) => [x + right * R[0] + front * F[0], z + right * R[1] + front * F[1]];

  // The first seat of `keys` that is free, now theirs.
  function takeSeat(a, keys) {
    const key = keys.find((k) => claim(a, k));
    if (!key) return null;
    a.seatKey = key;
    return seatOf(key);
  }

  // Where a pet waits behind its bowl, so that the bowl it eats from (the model's own) stands just where the
  // empty one does.
  const bowlSide = (p) => toward(spots.bowls[p.name].bowl, 0, -p.rig.bowlZ * p.rig.group.scale.x);

  // The spots activities go to (the fridge, the bowls, the foot of the bed...), kept clear by the rest.
  const PLACES = [
    ...Object.values(spots).flatMap((s) => (Array.isArray(s?.at) ? [s.at] : [])),
    ...Object.values(spots.seats).map((s) => s.front),
    ...spots.rug,
    ...spots.fireside,
    spots.sunny,
    ...spots.beds.flatMap((b) => [b.at, b.marker.at, b.watch, ...b.plants.map((p) => p.at)]),
    house.garden.basket.homeStand,
    ...Object.keys(spots.bowls).map((name) => bowlSide(byName[name])),
  ];
  // A free spot on a floor (not the stairs) in `area` that `ok` accepts, clear of everyone else, of where
  // they are going, and of the spots activities go to.
  const offPlaces = (x, z) => PLACES.every(([px, pz]) => Math.hypot(px - x, pz - z) > 12);
  // The garden is no place to be while it rains, or while the sprinkler is going.
  const sprinkler = house.garden.sprinkler;
  const gardenWet = () => home.weather.raining || home.weather.k > 0.05 || sprinkler.spraying();
  function freeSpot(a, [xs, zs] = ROOM, room = 26, ok = flat) {
    return nav.randomSpot(
      xs,
      zs,
      (x, z) =>
        ok(x, z) &&
        !(x > X1 - 4 && gardenWet()) &&
        offPlaces(x, z) &&
        home.actors.every(
          (o) => o === a || o.out || (Math.hypot(o.x - x, o.z - z) > room && (!o.goal || Math.hypot(o.goal[0] - x, o.goal[1] - z) > room))
        )
    );
  }

  // Wait calmly up to `secs`, dozing off at `dozeAt`, until asked to stop or `stop()`; clicking a sleeper
  // wakes it, and it carries on awake. Calls `each()` every frame.
  function* linger(a, secs, { dozeAt = Infinity, stop = () => false, each = () => {} } = {}) {
    const end = t() + secs;
    while (t() < end && !a.interrupt && !stop()) {
      if (a.woken) {
        a.woken = false;
        a.asleep = false;
        dozeAt = Infinity;
      }
      if (t() > dozeAt && !a.asleep) a.asleep = true;
      each();
      yield* wait(a, 0.1, true);
    }
    a.asleep = false;
  }
  const dozeChance = (day, night) => (Math.random() < (home.night ? night : day) ? t() + rnd(8, 15) : Infinity);
  // A free spot `gap` to one side of [x, z] on screen (the clearer side) and `dz` towards the viewer, on the
  // same floor and not on top of anyone else; or failing that one nearby. With the side it is on (1 right, -1
  // left).
  function beside(a, [x, z], gap, dz = 4) {
    const same = level(floorY(x, z));
    const mine = Math.sign((a.x - x) * R[0] + (a.z - z) * R[1]) || 1;
    const at = (s) => toward([x, z], s * gap, dz);
    const clear = ([sx, sz]) => home.actors.every((o) => o === a || o.out || Math.hypot(o.x - sx, o.z - sz) > 10);
    const side = [mine, -mine].find((s) => nav.free(...at(s)) && same(...at(s)) && clear(at(s)));
    if (side) return [at(side), side];
    const spot = freeSpot(
      a,
      [
        [x - gap - 10, x + gap + 10],
        [z - 10, z + 24],
      ],
      10,
      same
    );
    return spot ? [spot, Math.sign((spot[0] - x) * R[0] + (spot[1] - z) * R[1]) || 1] : [null, 1];
  }

  // Turned towards someone (or something), keeping `keep` of the way to facing the viewer.
  const halfTowards = (a, x, z, keep = 0.5) => a.face(V + wrap(Math.atan2(x - a.x, z - a.z) - V) * (1 - keep));
  // Facing what is beside it on `side` (1 to its right on screen, -1 to its left), still showing the face.
  const faceSide = (a, side, open = 0.6) => a.face(V + side * (Math.PI / 2 - open));

  return {
    home,
    clock,
    house,
    nav,
    byName,
    humans,
    spots,
    floorY,
    walk,
    stepTo,
    turn,
    wait,
    until,
    hop,
    glide,
    sitOn,
    getUp,
    intoBed,
    outOfBed,
    claim,
    holder,
    release,
    act,
    event,
    available,
    invite,
    summon,
    later,
    anew,
    onEnd,
    t,
    other,
    LIVING,
    SOFA,
    freeSeat,
    level,
    ground,
    toward,
    takeSeat,
    bowlSide,
    offPlaces,
    sprinkler,
    gardenWet,
    freeSpot,
    linger,
    dozeChance,
    beside,
    halfTowards,
    faceSide,
  };
}
