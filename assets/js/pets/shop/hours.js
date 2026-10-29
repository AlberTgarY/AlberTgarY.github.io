/*******************************************************************************
 * The flower shop's hours (layout.js HOURS): open from ten in the morning till
 * ten at night. At ten at night she turns the sign to CLOSED and the two of
 * them bring everything in: he takes the flowers out along to the right into
 * the lock-up cool room by the kiosk, she packs the rest onto the kiosk's
 * floor, row by row from the back (the made-up bouquets, the bins and pails
 * from before the window and the doorway, the stacks of empty buckets, the
 * A-frame, the watering can; what does not fit, and the dog's bowl, in the
 * lock-up too). Then they
 * pull the tarp over the house plants, he locks the lock-up, she puts the
 * lights out, he hooks the roller shutter down with the pole and pulls it to
 * the pavement, she padlocks it, and the three of them go home up the street.
 * In the morning they come back and do it all the other way round, in time to
 * turn the sign to OPEN at ten.
 *
 * What each of them is to do just now is their duty (`duty(a)`, run by life.js
 * before anything else); the shop between times is `state`: "open" (all set out,
 * them at work; the sign OPEN in the hours), "closing", "closed" (all in, no one
 * there) or "opening". The time jumped (the clock clicked, or the shop seen again
 * after a while: shop.js), everything is put straight where it would be then
 * (`settle()`).
 ******************************************************************************/

import { rnd } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { HOLDS, MOVES } from "../room/props.js";
import { setFade, comeIn, goOff } from "./fade.js";
import { HOURS, KIOSK, FLOOR, DOG_BED, STREET, GROUND } from "./layout.js";

// Hurrying, setting out or closing up (an hour's work done in a few minutes): a brisk walk with things in the
// hands, a jog without (actor.js JOG).
const PACE = 2.8;
const PACE_FREE = 3.5;
const CARRY_Y = 3; // how high a thing is carried, at the lowest (its foot over theirs)
const HANDS_Y = 15; // how high the hands are, holding a thing out in front in both arms (HOLDS.tray)
const KNEEL_HANDS_Y = 5; // how high they are, down on a knee reaching to the ground
const KNEEL = 0.3; // s to go down on a knee, or get up
const BESIDE = 7.5; // from the middle of them to a bucket carried at their side, past its own radius
const LIFT = 0.35; // s to lift a thing or set it down
const CATCH = 0.5; // h after setting out or closing up begins, a jump to which sees it begin
const TARP_SECS = 3.2; // to roll the tarp up off the plants, or unroll it over them
const ROW = 13; // between the rows of things packed on the kiosk's floor (and in front of each, where to stand)
const COL = 12; // between the places along a row

// Their arms: both up over the head (the shutter, high), both up on the pole, both down at the shutter's bottom
// bar; pulling the tarp, hand over hand.
const ARMS = {
  haul: (t) => [
    [-1.45 + 0.3 * Math.sin(t * 7), -0.3, 0.25, 0, 0],
    [-1.45 - 0.3 * Math.sin(t * 7), -0.3, -0.25, 0, 0],
  ],
  up: [
    [-2.7, -0.25, 0.15, 0, 0],
    [-2.7, -0.25, -0.15, 0, 0],
  ],
  pole: [
    [-2.45, -0.15, 0.2, 0, 0],
    [-2.25, -0.35, -0.1, 0, 0],
  ],
  bar: [
    [-1.35, -0.25, 0.25, 0, 0],
    [-1.35, -0.25, -0.25, 0, 0],
  ],
};

// Whether the shop is open for the day (set out, them there) at `hour`.
export const dayAt = (hour) => hour >= HOURS.arrive && hour < HOURS.close;

export function makeShopHours(home, life) {
  const { clock } = home;
  const steps = makeSteps(home);
  const t = () => clock.t;
  const { walk, wait, until, stepTo } = steps;
  const turn = (a, yaw) => steps.turn(a, yaw, 0.5); // (on with it before quite round: the rest as they reach)
  const K = home.kiosk;
  const D = home.display;
  const G = home.grounds;
  const { shutter, lockup, openSign } = K;
  const girl = home.byName.girl;
  const boy = home.byName.boy;
  const dog = home.byName.collie;
  const staff = [girl, boy];
  const crew = [girl, boy, dog]; // (the customers come and go by themselves: customers.js)
  const hour = () => home.hour();

  /* ----- where everything goes for the night ----- */

  // Places on the kiosk's floor, filled a row at a time from the back: clear of its furniture (and of the
  // dog's bed), each with its place to stand in front (on the floor still empty then).
  const furniture = K.obstacles.slice(0, 9);
  const clearOf = (x, z, r) =>
    x - r > KIOSK.x0 + 2 &&
    x + r < KIOSK.x1 - 2 &&
    z - r > KIOSK.z0 + 2 &&
    Math.hypot(x - DOG_BED.x, z - DOG_BED.z) > DOG_BED.r + r &&
    furniture.every(([x0, x1, z0, z1]) => x + r <= x0 || x - r >= x1 || z + r <= z0 || z - r >= z1);
  const slots = [];
  for (let z = KIOSK.z0 + 14; z + ROW < KIOSK.z1 - 7; z += ROW)
    for (let x = KIOSK.x0 + 31; x < KIOSK.x1 - 6; x += COL)
      if (clearOf(x, z, 6) && clearOf(x, z + ROW, 4)) slots.push({ x, z, stand: [x, z + ROW], row: z });

  // Everything carried, with where it goes: onto the kiosk's floor (in the order they are packed, a place
  // each while there are places) or into the lock-up (out of sight). The flowers out along to the right go
  // to the lock-up, which is nearer.
  const right = D.buckets.filter((b) => b.home[0] > KIOSK.x1 - 20);
  const near = D.buckets.filter((b) => !right.includes(b)).sort((p, q) => Math.hypot(p.x + 65, p.z + 30) - Math.hypot(q.x + 65, q.z + 30));
  const things = G.things;
  const entries = [];
  let free = 0;
  for (const item of [D.made, ...near, ...things.stacks, things.sign, things.can]) {
    const slot = slots[free++];
    entries.push({ item, slot, store: slot ? "kiosk" : "lockup" });
  }
  right.sort((p, q) => p.home[2] - q.home[2] || q.home[0] - p.home[0]); // the bench row first, from the far end
  for (const item of [...right, things.bowl]) entries.push({ item, store: "lockup" });
  entries.forEach((e) => Object.assign(e, { state: "home", lifted: false }));

  // Where each one is put for the night.
  function stow(e) {
    if (e.store === "kiosk") e.item.place(e.slot.x, FLOOR, e.slot.z);
    else e.item.place(...e.item.home, false);
    e.state = "stowed";
  }
  function setOut(e) {
    e.item.place(...e.item.home);
    e.state = "home";
  }

  // Where to stand to pick a thing up, or put it down, where it is by day: before a bucket as when she picks
  // from it, else the free floor nearest in front of it.
  function dayStand(item) {
    if (item.stand) return { at: item.stand, yaw: item.yaw };
    if (item === D.made) return { at: D.made.at, yaw: D.made.yaw };
    const [x, , z] = item.home;
    const at = home.nav.nearest(x, z + item.radius + 8) ?? [x, z + item.radius + 8];
    return { at, yaw: Math.atan2(x - at[0], z - at[1]) };
  }

  /* ----- carrying ----- */

  // What each is carrying: one thing held out in front in both arms, or two buckets, one in each hand (`side`
  // -1 the right, 1 the left); each between where it was and the hands (`k`), or the hands and where it goes.
  // They follow the hands every frame (follow()).
  const carrying = new Map(); // a -> [{ item, side, k, from, to, down, crouch }]
  const PAIR = [
    [-0.15, -0.15, 0, -0.42, 0],
    [-0.15, -0.15, 0, 0.42, 0],
  ]; // a bucket in each hand, hanging at their sides, the arms out round them
  // Where a thing is held: in front in both arms, at the height of the hands (a tall bucket low, its rim at
  // them; a bowl up in them), or down at a knee (`crouch` 1); a bucket in one hand beside them, clear of them.
  const carryAt = (a, item, side = 0, crouch = 0) => {
    const [fx, fz] = [Math.sin(a.yaw), Math.cos(a.yaw)];
    const d = side ? 1.5 : item.radius + 5;
    const w = side * (BESIDE + item.radius); // (to their left)
    const up = side ? 0.8 : Math.max(CARRY_Y, HANDS_Y - item.height / 2);
    return [a.x + fx * d + fz * w, a.y + up + (KNEEL_HANDS_Y - item.height / 2 - up) * crouch, a.z + fz * d - fx * w];
  };
  function follow() {
    for (const a of staff) a.hurry = state === "opening" || state === "closing"; // (actor.js: turning smartly)
    for (const [a, load] of carrying)
      for (const c of load) {
        const hands = carryAt(a, c.item, c.side, c.crouch);
        const e = c.k * c.k * (3 - 2 * c.k);
        const [p, q] = c.down ? [hands, c.to] : [c.from, hands];
        c.item.place(p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e, p[2] + (q[2] - p[2]) * e);
      }
  }
  const pace = (a) => (carrying.has(a) ? PACE : PACE_FREE);
  const armsFor = (load) => (load.some((c) => c.side) ? PAIR : HOLDS.tray);
  // Bending to it, `k` of each of `cs` going from 0 to 1. To something small on the ground (the dog's bowl),
  // down on a knee instead: the hands down to it, and up again with it.
  function* bend(a, cs) {
    const low = cs.every((c) => !c.side && c.item.height < 8 && (c.down ? c.to : c.from)[1] < a.y + 2);
    a.hold = HOLDS.pick;
    a.since = t();
    if (low) yield* crouch(a, cs, 1);
    else a.lean = 0.3;
    const t0 = t();
    for (let k = 0; k < 1; ) {
      k = Math.min(1, (t() - t0) / LIFT);
      cs.forEach((c) => (c.k = k));
      yield;
    }
    if (low) yield* crouch(a, cs, 0);
    a.lean = 0;
  }
  // Down on a knee (`to` 1) or up off it, what is in the hands going with them.
  function* crouch(a, cs, to) {
    a.lie = to === 1; // (a person kneels)
    const t0 = t();
    for (let k = 0; k < 1; ) {
      k = Math.min(1, (t() - t0) / KNEEL);
      cs.forEach((c) => (c.crouch = to ? k : 1 - k));
      yield;
    }
  }

  // Up into the hands from where they are: `items` [thing, side] pairs, together.
  function* lift(a, items) {
    const load = carrying.get(a) ?? [];
    carrying.set(a, load);
    const cs = items.map(([item, side]) => ({ item, side, k: 0, from: [...item.where], down: false }));
    load.push(...cs);
    yield* bend(a, cs);
    a.hold = armsFor(load);
  }
  // Down from the hands to where each goes (`items` [thing, to] pairs): shown there, or not (put away in a
  // cool room).
  function* setDown(a, items, shown = true) {
    const load = carrying.get(a);
    const cs = items.map(([item, to]) =>
      Object.assign(
        load.find((c) => c.item === item),
        { down: true, k: 0, to }
      )
    );
    yield* bend(a, cs);
    for (const c of cs) {
      load.splice(load.indexOf(c), 1);
      c.item.place(...c.to, shown);
    }
    if (!load.length) carrying.delete(a);
    a.hold = load.length ? armsFor(load) : null;
  }

  // Into the lock-up (its door opened, if shut; one at a time through it), or out of it: a few steps in
  // through the door and back out.
  let doorUser = null;
  // In there, in front of them (a pair side by side).
  const shelf = (item, side = 0) => [lockup.inside[0] + side * (item.radius + 1.5), 0, lockup.inside[1] - item.radius - 5];
  function* intoLockup(a, what) {
    if (doorUser) {
      yield* outOfDoorway(a, true); // (the other in there, or on the way: out of their way)
      yield* until(() => !doorUser, 30);
    }
    doorUser = a; // (from here: two arriving together would meet in the doorway)
    a.cleanups.push(() => doorUser === a && (doorUser = null));
    yield* walk(a, lockup.at, pace(a));
    yield* turn(a, Math.PI);
    if (!lockup.open) {
      a.hold = MOVES.press;
      a.since = t();
      yield* wait(a, 0.4);
      lockup.set(true);
      yield* wait(a, 0.6);
      a.hold = carrying.has(a) ? armsFor(carrying.get(a)) : null;
    }
    yield* stepTo(a, lockup.inside, pace(a));
    yield* what();
    yield* stepTo(a, lockup.at, pace(a));
    doorUser = null;
  }

  // To `at`, to stand there a while: once the other is not standing on it, nor on the way to it (or after a few
  // seconds anyway).
  const within8 = (p, x, z) => p && Math.hypot(p[0] - x, p[1] - z) < 8;
  const taken = (a, [x, z]) => staff.some((o) => o !== a && !o.away && (o.walking ? within8(o.goal, x, z) : within8([o.x, o.z], x, z)));
  function* goTo(a, at) {
    yield* until(() => !taken(a, at), 8);
    yield* walk(a, at, pace(a));
  }
  // Off to the side of the lock-up's door, if in it (or `anyway`), to stand a while: there, or a little further
  // along if the other is standing there.
  const BY_DOOR = [
    [lockup.at[0] + 14, lockup.at[1] + 6],
    [lockup.at[0] + 28, lockup.at[1] + 8],
  ];
  function* outOfDoorway(a, anyway = false) {
    if (anyway || Math.hypot(a.x - lockup.at[0], a.z - lockup.at[1]) < 12) yield* walk(a, BY_DOOR.find((at) => !taken(a, at)) ?? BY_DOOR[1], pace(a));
  }

  // Where to stand before the places of `load` on the kiosk's floor (side by side in a row).
  const standBefore = (load) => [load.reduce((s, e) => s + e.slot.stand[0], 0) / load.length, load[0].slot.stand[1]];
  const sidesOf = (load) => (load.length > 1 ? [-1, 1] : [0]);
  // Where to stop along the row for `load`'s places there (with its sides): once, before the two if side by
  // side, else before each, the nearer first.
  function stopsFor(a, load) {
    const parts = load.map((e, i) => [[e, sidesOf(load)[i]]]);
    if (parts.length < 2) return parts;
    if (Math.abs(load[0].slot.x - load[1].slot.x) <= COL) return [parts.flat()];
    const far = ([[e]]) => Math.hypot(e.slot.stand[0] - a.x, e.slot.stand[1] - a.z);
    return parts.sort((p, q) => far(p) - far(q));
  }

  // A load in for the night (one thing, or two buckets), or out for the day; if it is cut short, each is put
  // where it was going.
  function* carryIn(a, load) {
    const sides = sidesOf(load);
    load.forEach((e) => Object.assign(e, { state: "carried", took: [a.name, t()] }));
    a.cleanups.push(() => {
      carrying.delete(a);
      load.forEach((e) => e.state === "carried" && stow(e));
    });
    for (const [i, e] of load.entries()) {
      const from = dayStand(e.item);
      yield* goTo(a, from.at);
      yield* turn(a, from.yaw);
      yield* lift(a, [[e.item, sides[i]]]);
    }
    if (load[0].store === "lockup")
      yield* intoLockup(a, () =>
        setDown(
          a,
          load.map((e, i) => [e.item, shelf(e.item, sides[i])]),
          false
        )
      );
    else
      for (const part of stopsFor(a, load)) {
        yield* goTo(a, standBefore(part.map(([e]) => e)));
        yield* turn(a, Math.PI);
        yield* setDown(
          a,
          part.map(([e]) => [e.item, [e.slot.x, FLOOR, e.slot.z]])
        );
      }
    load.forEach((e) => {
      e.state = "stowed";
      e.took.push(t());
    });
  }
  function* carryOut(a, load) {
    const sides = sidesOf(load);
    load.forEach((e) => Object.assign(e, { state: "carried", lifted: false, took: [a.name, t()] }));
    a.cleanups.push(() => {
      carrying.delete(a);
      load.forEach((e) => e.state === "carried" && setOut(e));
    });
    if (load[0].store === "lockup")
      yield* intoLockup(a, function* () {
        load.forEach((e, i) => e.item.place(...shelf(e.item, sides[i])));
        yield* lift(
          a,
          load.map((e, i) => [e.item, sides[i]])
        );
      });
    else
      for (const part of stopsFor(a, load)) {
        yield* goTo(a, standBefore(part.map(([e]) => e)));
        yield* turn(a, Math.PI);
        yield* lift(
          a,
          part.map(([e, side]) => [e.item, side])
        );
      }
    load.forEach((e) => (e.lifted = true));
    for (const e of load) {
      const to = dayStand(e.item);
      yield* goTo(a, to.at);
      yield* turn(a, to.yaw);
      yield* setDown(a, [[e.item, e.item.home]]);
      if (e.item === things.bowl) G.bowl.fill();
      e.state = "home";
      e.took.push(t());
    }
  }

  // The next load for `a` to take in (or, `out`, out): from the store they look after (him the lock-up, her
  // the rest), else from the other's; on the kiosk's floor only once the rows behind it (going in) or in
  // front of it (going out) are done with, so that no one stands where something is already put. A bucket
  // goes with another from near it, going to the same store (on the kiosk's floor, to a place in the same
  // row), one in each hand.
  // (any two buckets, one in each hand; two stacks of empty ones likewise)
  const pairs = (item) => (!!item.bucketKind && item.bucketKind !== "made") || item.name?.startsWith("stack");
  function next(a, out) {
    const mine = (e) => (e.store === "lockup") === (a === plan.lockupBy);
    const inFront = (o, e) => o.slot.row > e.slot.row;
    const ready = (e) => {
      if (e.state !== (out ? "stowed" : "home")) return false;
      if (e.store !== "kiosk") return true;
      return !entries.some(
        (o) =>
          o.store === "kiosk" &&
          (out ? inFront(o, e) && (o.state === "stowed" || (o.state === "carried" && !o.lifted)) : inFront(e, o) && o.state !== "stowed")
      );
    };
    const order = out ? [...entries].reverse() : entries;
    // (one of the two nearest that can go, at random, theirs by a little before the other's: no going back and
    // forth, nor the same order every day)
    const far = (o) => Math.hypot(o.item.where[0] - a.x, o.item.where[2] - a.z) * (mine(o) ? 1 : 1.3);
    const can = order.filter(ready).sort((p, q) => far(p) - far(q));
    const e = can[Math.floor(Math.random() * Math.min(2, can.length))];
    if (!e) return null;
    if (!pairs(e.item)) return [e];
    const mate = order.find(
      (o) =>
        o !== e &&
        o.store === e.store &&
        ready(o) &&
        pairs(o.item) &&
        Math.hypot(o.item.home[0] - e.item.home[0], o.item.home[2] - e.item.home[2]) < 40 &&
        (e.store !== "kiosk" || o.slot.row === e.slot.row)
    );
    return mate ? [e, mate] : [e];
  }
  const allIn = () => entries.every((e) => e.state === "stowed");
  const allOut = () => entries.every((e) => e.state === "home");

  /* ----- the sign, the tarp, the lock-up, the lights and the shutter ----- */

  // The OPEN / CLOSED sign in the window turned round, from inside.
  const SIGN_AT = [-14, KIOSK.z1 - 14];
  function* turnSign(a, open) {
    yield* walk(a, SIGN_AT, pace(a));
    yield* turn(a, 0.35);
    a.hold = MOVES.press;
    a.since = t();
    yield* wait(a, 0.5);
    openSign.set(open);
    D.selling.on = open;
    yield* wait(a, 0.6);
    a.hold = null;
  }

  // A meeting point: each says it is there; on when the other is.
  const there = new Set();
  function* meet(a, name) {
    there.add(`${name}:${a.name}`);
    a.cleanups.push(() => there.delete(`${name}:${a.name}`));
    yield* until(() => staff.every((o) => there.has(`${name}:${o.name}`) || o.away), 300);
  }
  const spent = (name) => staff.forEach((o) => there.delete(`${name}:${o.name}`));

  // The tarp pulled over (`on`) or off, one at each end, arms up; the folded bundle with him, carried from
  // the lock-up or into it.
  function* tarpOver(a, on) {
    const bundle = things.bundle;
    a.cleanups.push(() => {
      if (carrying.get(a)?.some((c) => c.item === bundle)) bundle.place(...bundle.home, false);
      carrying.delete(a);
    });
    if (a === boy && on) {
      yield* intoLockup(a, function* () {
        bundle.place(...shelf(bundle));
        yield* lift(a, [[bundle, 0]]);
      });
    }
    const end = G.tarp.ends[a === boy ? 0 : 1];
    yield* walk(a, end, pace(a));
    yield* turn(a, Math.PI);
    yield* meet(a, on ? "tarpOn" : "tarpOff");
    if (a === boy && on) {
      carrying.delete(a);
      bundle.place(...bundle.home, false);
    }
    a.hold = ARMS.haul;
    a.since = t();
    const t0 = t();
    while (t() - t0 < TARP_SECS) {
      const k = (t() - t0) / TARP_SECS;
      if (a === girl) G.tarp.set(on ? k : 1 - k);
      yield;
    }
    if (a === girl) G.tarp.set(on ? 1 : 0);
    a.hold = null;
    spent(on ? "tarpOn" : "tarpOff");
    if (a === boy && !on) {
      bundle.place(...carryAt(a, bundle));
      yield* lift(a, [[bundle, 0]]);
      yield* intoLockup(a, () => setDown(a, [[bundle, shelf(bundle)]], false));
    }
  }

  // The lock-up shut and locked (or unlocked), by him.
  function* lockLockup(a, locked) {
    yield* walk(a, lockup.at, pace(a));
    yield* turn(a, Math.PI);
    a.hold = MOVES.twist;
    a.since = t();
    if (locked) {
      lockup.set(false);
      yield* wait(a, 0.9);
    }
    yield* wait(a, 0.8);
    lockup.lock(locked);
    a.hold = null;
  }

  // The shutter down (`down`) or up: he hooks the pole on its bottom bar and pulls it down to where he can
  // reach it, then pulls it down to the pavement with both hands (bending down with it), and she padlocks it;
  // up, she unlocks it, he pushes it up as far as he reaches and the rest of the way with the pole.
  const SH = shutter.handle;
  const HASP = [SH[0] + 1, SH[1] - 1]; // where she kneels to the padlock
  function* shutterRun(a, down) {
    const at = a === boy ? [SH[0] - 15, SH[1]] : down ? [SH[0] + 16, SH[1] + 4] : HASP;
    yield* walk(a, at, pace(a));
    yield* turn(a, Math.PI);
    yield* meet(a, down ? "shutDown" : "shutUp");
    if (a === girl) {
      if (!down) {
        a.lie = true;
        a.hold = MOVES.twist;
        a.since = t();
        yield* wait(a, 1.2);
        shutter.lock(false);
        a.hold = null;
        a.lie = false;
        yield* wait(a, 0.4);
        there.add("unlocked");
        yield* stepTo(a, [SH[0] + 16, SH[1] + 4], 0.8);
        yield* turn(a, Math.PI);
      }
      yield* until(() => (down ? shutter.k >= 1 : shutter.k <= 0), 15);
      if (down) {
        yield* stepTo(a, HASP, 0.8);
        yield* turn(a, Math.PI);
        a.lie = true;
        a.hold = MOVES.twist;
        a.since = t();
        yield* wait(a, 1.2);
        shutter.lock(true);
        a.pop("room-pop room-pop-sparkle");
        a.hold = null;
        a.lie = false;
        yield* wait(a, 0.5);
      }
      spent(down ? "shutDown" : "shutUp");
      return;
    }
    if (!down) yield* until(() => there.has("unlocked"), 10);
    there.delete("unlocked");
    const run = function* (from, to, secs, hold, lean = 0) {
      a.hold = hold;
      a.since = t();
      a.lean = lean;
      const t0 = t();
      for (let k = 0; k < 1; ) {
        k = Math.min(1, (t() - t0) / secs);
        shutter.set(from + (to - from) * (k * k * (3 - 2 * k)));
        yield;
      }
    };
    const REACH = 0.5; // how far down the shutter comes before he can take it in his hands
    if (down) {
      a.shop.only("hook");
      yield* run(0, REACH, 2.2, ARMS.pole);
      a.shop.only();
      yield* run(REACH, 0.85, 1.0, ARMS.up);
      yield* run(0.85, 1, 0.7, ARMS.bar, 0.35);
    } else {
      yield* run(1, 0.85, 0.7, ARMS.bar, 0.35);
      yield* run(0.85, REACH, 1.0, ARMS.up);
      a.shop.only("hook");
      yield* run(REACH, 0, 2.0, ARMS.pole);
      a.shop.only();
    }
    a.lean = 0;
    a.hold = null;
  }

  // The lights put out, from just inside the door.
  function* lightsOut(a) {
    yield* walk(a, [SH[0], KIOSK.z1 + 3], pace(a)); // (in the doorway: the floor inside is packed)
    yield* turn(a, Math.PI);
    a.hold = MOVES.press;
    a.since = t();
    yield* wait(a, 0.5);
    K.lights.set(false);
    yield* wait(a, 0.5);
    a.hold = null;
  }

  // Off up the street, fading away off the pavement's front edge; or back from it in the morning, to `to`.
  const EXITS = { girl: -48, boy: -34, collie: -62 };
  const EDGE = GROUND.z1 - 8;
  function* leave(a) {
    yield* walk(a, [EXITS[a.name], EDGE]);
    yield* goOff(a, STREET.z, clock);
    away(a, true);
  }
  function* arrive(a) {
    a.away = false;
    yield* comeIn(a, [EXITS[a.name], STREET.z, EDGE], clock);
  }
  function away(a, gone) {
    a.away = gone;
    setFade(a, gone ? 0 : 1);
  }

  /* ----- what each has to do ----- */

  let state = "open";
  let leaving = false;
  const DOG_WAIT = [-70, GROUND.z1 - 12]; // where the dog lies out of the way meanwhile

  // How they go about it today (rolled afresh as they start setting out, or closing up): who comes in first and
  // how long after the other; which of them sees to the lock-up's things (the other the kiosk's); how many
  // loads each carries before the two of them see to the tarp in the morning; how often one stops a moment
  // between loads.
  let plan = rollPlan();
  function rollPlan() {
    const first = Math.random() < 0.5 ? girl : boy;
    const then = rnd(0.5, 5);
    return {
      comes: new Map([
        [first, 0],
        [first === girl ? boy : girl, then],
        [dog, Math.random() < 0.5 ? rnd(0.3, 1.2) : then + rnd(0.3, 1.2)], // (with the one or the other)
      ]),
      lockupBy: Math.random() < 0.7 ? boy : girl,
      tarpAfter: Math.floor(rnd(0, 4)),
      pause: rnd(0.04, 0.1),
    };
  }
  // A moment's stop between loads, now and then: a stretch, the brow wiped, a word with the other, or the dog
  // patted where it lies.
  function* moment(a) {
    yield* outOfDoorway(a);
    const other = a === girl ? boy : girl;
    const r = Math.random();
    if (r < 0.3 && !dog.away && Math.hypot(dog.x - a.x, dog.z - a.z) < 60) {
      yield* walk(a, [dog.x + 9, dog.z], pace(a));
      a.faceTowards(dog.x, dog.z);
      a.lie = true; // (kneeling)
      a.hold = MOVES.pat;
      a.since = t();
      yield* wait(a, 1.2);
      dog.beHappy(1.5);
      a.lie = false;
    } else if (r < 0.55 && !other.away && Math.hypot(other.x - a.x, other.z - a.z) < 45) {
      a.faceTowards(other.x, other.z);
      a.look = other;
      a.talk = true;
      yield* wait(a, rnd(0.9, 1.6));
      a.talk = false;
      a.look = null;
    } else {
      a.hold = r < 0.8 ? MOVES.stretch : MOVES.wipe;
      a.since = t();
      yield* wait(a, 1);
    }
    a.hold = null;
  }

  function* closeUp(a) {
    if (a === dog) {
      yield* walk(a, DOG_WAIT);
      a.lie = true;
      yield* until(() => leaving, 600);
      a.lie = false;
      yield* wait(a, 0.4);
      return yield* leave(a);
    }
    if (a === girl && openSign.open) yield* turnSign(a, false);
    for (let load; (load = next(a, false)) || !allIn(); ) {
      if (load) yield* carryIn(a, load);
      else if (G.tarp.k < 1 && entries.every((e) => e.state !== "home"))
        yield* tarpOver(a, true); // (the last of it on its way in, by the other: on with the tarp meanwhile)
      else {
        yield* outOfDoorway(a);
        yield* wait(a, 0.3);
      }
      if (load && Math.random() < plan.pause) yield* moment(a);
    }
    if (G.tarp.k < 1) yield* tarpOver(a, true);
    if (a === boy && !lockup.locked) yield* lockLockup(a, true);
    if (a === girl && K.lights.on) yield* lightsOut(a);
    if (shutter.k < 1 || !shutter.locked) yield* shutterRun(a, true);
    yield* meet(a, "home");
    leaving = true;
    yield* wait(a, a === girl ? 0.2 : 0.7);
    yield* leave(a);
  }

  function* setUp(a) {
    if (a.away) {
      yield* wait(a, plan.comes.get(a));
      yield* arrive(a);
    }
    if (a === dog) {
      yield* walk(a, DOG_WAIT);
      a.lie = true;
      yield* until(() => staff.every((o) => o.setUp), 600);
      a.lie = false;
      a.setUp = true;
      return;
    }
    if (shutter.k > 0) yield* shutterRun(a, false);
    if (a === boy && lockup.locked) yield* lockLockup(a, false);
    for (let n = 0; ; ) {
      if (G.tarp.k > 0 && n === plan.tarpAfter) yield* tarpOver(a, false);
      const load = next(a, true);
      if (!load && allOut()) break;
      if (load) {
        yield* carryOut(a, load);
        n++;
      } else {
        yield* outOfDoorway(a);
        yield* wait(a, 0.3);
      }
      if (load && Math.random() < plan.pause) yield* moment(a);
    }
    if (G.tarp.k > 0) yield* tarpOver(a, false);
    if (a === boy && lockup.open) {
      yield* walk(a, lockup.at, pace(a));
      yield* turn(a, Math.PI);
      lockup.set(false);
      yield* wait(a, 0.8);
    }
    a.setUp = true;
  }

  // Turned to OPEN by her, once all is set out.
  const signDue = () => state === "open" && !openSign.open && hour() < HOURS.close;

  const hours = {
    get state() {
      return state;
    },
    // Whether customers may come: the sign OPEN, and not yet closing.
    open: () => state === "open" && openSign.open,
    // Whether they are closing up or setting out.
    busy: () => state === "closing" || state === "opening",
    // What `a` has to do just now, if anything (a todo for life.js: { name, run, long }).
    duty(a) {
      if (a.away && state !== "opening") return null;
      if (state === "closing") return { name: "closeUp", long: true, run: closeUp };
      if (state === "opening" && !a.setUp) return { name: "setUp", long: true, run: setUp };
      if (a === girl && signDue()) return { name: "openSign", run: (b) => turnSign(b, true) };
      return null;
    },
    // Each frame, before anyone moves: the hour to close up or to come in reached.
    step() {
      const h = hour();
      if (state === "open" && !dayAt(h)) begin("closing");
      else if (state === "closed" && dayAt(h)) begin("opening");
      else if (state === "closing" && crew.every((o) => o.away)) state = "closed";
      else if (state === "opening" && crew.every((o) => o.setUp)) state = "open";
      else if (signDue() && girl.job && girl.jobName !== "openSign") life.drop(girl); // (ten o'clock: whatever she is at)
    },
    // Each frame, after everyone has moved: what is carried kept in their arms.
    follow,
    entries, // (what is carried in and out, each with where it goes and where it is: for tests)
    // Whether a jump to `h` finds all set out (or all in): as it is then, but within the half hour after ten
    // in the morning or at night, as it was just before, setting out or closing up to start as the time is
    // come to (it takes about an hour).
    setOutAt(h) {
      const since = (hour) => (h - hour + 24) % 24;
      return since(HOURS.arrive) < CATCH ? false : since(HOURS.close) < CATCH ? true : dayAt(h);
    },
    // Everything as it is at `h` (setOutAt): all set out and them at work, or all in and no one there.
    settle(h) {
      carrying.clear();
      doorUser = null;
      there.clear();
      leaving = false;
      for (const a of crew) life.drop(a);
      const day = hours.setOutAt(h);
      entries.forEach(day ? setOut : stow);
      G.tarp.set(day ? 0 : 1);
      things.bundle.place(...things.bundle.home, false);
      lockup.set(false);
      lockup.k = 0;
      lockup.lock(!day);
      shutter.lock(false);
      shutter.set(day ? 0 : 1);
      shutter.lock(!day);
      const open = day && h >= HOURS.open;
      openSign.set(open);
      openSign.k = open ? 0 : 1;
      D.selling.on = open;
      K.lights.set(home.night && day);
      G.bowl.fill();
      crew.forEach((a, i) => {
        away(a, !day);
        a.setUp = day;
        if (day) {
          const at = home.nav.nearest(...a.start) ?? a.start;
          Object.assign(a, { x: at[0], z: at[1], y: home.house.floorY(at[0], at[1]), nextAt: t() + rnd(0.5, 2) + i });
        }
      });
      state = day ? "open" : "closed";
    },
  };

  // The day's end, or its start: whatever anyone is doing dropped (put back), and to it.
  function begin(s) {
    state = s;
    plan = rollPlan();
    leaving = false;
    there.clear();
    for (const a of crew) {
      a.setUp = false;
      if (!a.away) life.drop(a);
    }
  }

  return hours;
}
