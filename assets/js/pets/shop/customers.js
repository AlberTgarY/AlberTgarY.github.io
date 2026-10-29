/*******************************************************************************
 * The flower shop's customers: people of the town (models/townsfolk.js) who
 * come up the street while the shop is open, now and then one or two parties
 * at a time, fewer late in the evening: someone on their own, two friends or
 * a couple, or a grown-up with a child. Coming in, they wave to her if she is
 * about. The first of a party looks round a few buckets (at each, a sniff,
 * a look at the price, a photo on their phone, or pointing it out to the
 * other), and then:
 * - picks a bunch out of a bucket themselves (as the A-frame says) and takes
 *   it into the kiosk to the till, where one of them wraps it in kraft paper,
 *   ties a ribbon round it, rings it up and hands it back;
 * - or asks her at the door for a bouquet of something they liked, and waits
 *   about outside (on their phone now and then) while she makes it up, till
 *   she brings it out;
 * - or takes one of the bouquets made up from the bucket by the door and pays
 *   for it at the till;
 * - or just has a look and goes.
 * The others go along (tagAlong()): beside them, looking where they look and
 * talking, outside the door while they pay; a child runs off to a bucket to
 * point at it and back, or to pat the dog. Paid, they hold the flowers up to
 * look at them; on the way out the dog may come up to be patted. Then off up
 * the street. Meanwhile people pass along the pavement, some glancing at the
 * flowers, now and then one stopping at a bucket on the way. While it is
 * shut fewer pass: late at night someone walking home (on their phone,
 * maybe), a couple side by side talking, someone stopping to read the hours
 * on the shutter; of a morning joggers, someone with a coffee. Any of them may
 * stop to stroke the stray cat (street.js), or to point out the possum
 * (night.js). Each time someone goes off they are dressed anew (townsfolk.js
 * redress()).
 * A customer is an actor like the others (room/actor.js) but goes by this
 * file, not life.js; the staff's side of it (serving at the till, the bouquet
 * made to order, the dog's hello) is in acts.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd, pick } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { makeActor } from "../room/actor.js";
import { HOLDS, MOVES } from "../room/props.js";
import { buildTownsfolk, rollLook } from "../models/townsfolk.js";
import { makeBouquet } from "./props.js";
import { voxels } from "./kit.js";
import { bouquet } from "./flowers.js";
import { setFade, comeIn, goOff } from "./fade.js";
import { box } from "../models/voxels.js";
import { HOURS, STREET, GROUND, KIOSK, SHUTTER } from "./layout.js";

const CROWD = 12; // the people of the town who come by (two of them children; each looks anew at every page)
const KIDS = 2;
const AT_ONCE = 2; // parties about at once, at most (now and then one more)
const LAST_IN = HOURS.close - 0.3; // no one new comes after this
const EDGE = GROUND.z1 - 8; // the pavement's front edge, where people step on and off it
// Where they stand at the till, across from whoever serves, and where the next waits their turn: both back
// from the way in from the door to the till (whoever comes to serve walks it).
const COUNTER = [-102, -57];
const QUEUE = [-86, -64];
const AWAY_FROM_TILL = [-66, -40]; // on the way out, inside the door
// Where they wait outside for a bouquet being made up, looking at the house plants (`at`: out on the open
// pavement past the kiosk, off the ways people go and the buckets' stands), and where she comes up to hand
// it to them (`from`, on her side, from the door).
const WAIT_SPOTS = [
  { at: [44, -34], from: [32, -34] },
  { at: [104, -36], from: [92, -36] },
];
// Where the others of a party wait outside the door while one of them is at the till.
const BY_DOOR = [
  [-60, -12],
  [-48, -10],
];
// Arm poses of their own (as props.js HOLDS: [shoulder x, elbow x, shoulder y, shoulder z, elbow z] for the
// right arm, then the left), all with the left (nearer the viewer; the right holds what they buy): pointing
// at something ahead, the phone held up to take a photo, the phone looked at in front of them.
const POINT = [null, [-1.45, -0.1, -0.2, 0, 0]];
const PHOTO = [null, [-1.55, -1.3, -0.35, 0, 0]];
const SCROLL = [null, [-0.6, -1.5, -0.35, 0, 0]];

// The people, built a person at a time (a yield after each, as the builders do); returns the customers.
export function* buildingCustomers(home) {
  const people = [];
  for (let i = 0; i < CROWD; i++) {
    let look = rollLook(Math.random, i < KIDS ? "kid" : null);
    while (i >= KIDS && look.age === "kid") look = rollLook(Math.random);
    const a = makeActor(`customer-${i}`, buildTownsfolk(look), "human", home, look.size);
    Object.assign(a, { customer: true, kid: look.age === "kid", away: true, x: 0, z: STREET.z, y: 0, visit: null, deal: null, cleanups: [] });
    // What they hold: in the right hand, upright.
    const grip = new THREE.Group();
    grip.position.set(0, -1.5, 1.2);
    grip.rotation.set(Math.PI / 2, 0, 0);
    a.rig.hands[0].add(grip);
    a.grip = grip;
    setFade(a, 0);
    home.actors.push(a);
    people.push(a);
    yield (i + 1) / CROWD;
  }
  return makeCustomers(home, people);
}

function makeCustomers(home, people) {
  const { clock } = home;
  const t = () => clock.t;
  const steps = makeSteps(home);
  const { walk, turn, wait, until } = steps;
  const D = home.display;
  const life = home.life;
  const hours = life.hours;
  const girl = home.byName.girl;
  const dog = home.byName.collie;
  let nextAt = t() + rnd(4, 10);
  let passAt = t() + rnd(8, 20);
  let atCounter = null; // who stands at the till

  // What `a` holds: a bouquet (makeBouquet()), or nothing; its meshes thrown away once let go of for good.
  function hold(a, bq) {
    a.grip.clear();
    a.holding = bq;
    if (bq) {
      bq.group.position.set(0, 0, 0);
      bq.group.rotation.set(0, 0, 0);
      a.grip.add(bq.group);
    }
  }
  function letGo(a) {
    const bq = a.holding;
    hold(a, null);
    bq?.group.traverse((o) => o.geometry?.dispose());
  }
  // A pose held for `secs` (their phone out with it, if `phone`), then the hands back to what they hold.
  function* posed(a, arms, secs, phone = false) {
    a.hold = arms;
    a.since = t();
    a.rig.phone.visible = phone;
    try {
      yield* wait(a, secs);
    } finally {
      a.rig.phone.visible = false;
      a.hold = a.holding ? HOLDS.carry : null;
    }
  }
  const inside = ([x, z]) => x < KIOSK.x1 && z < KIOSK.z1;

  // At a bucket, one of: a sniff (leaning in), a look at the price on its tag, a photo of it, or pointing
  // it out to the others of the party (who look too); then pleased (a heart) or not sure (a "?"), maybe.
  function* atBucket(a, b, party) {
    yield* turn(a, b.yaw);
    a.look = b.top;
    const r = Math.random();
    if (r < 0.35) {
      a.lean = 0.15;
      const t0 = t();
      const secs = rnd(2, 3.5);
      while (t() - t0 < secs) {
        a.nod = 0.2 + 0.1 * Math.sin(t() * 9) * (t() - t0 > secs / 2 ? 1 : 0); // (a sniff, after a look)
        yield;
      }
      a.nod = 0;
      a.lean = 0;
    } else if (r < 0.55) {
      a.look = b.tag.at;
      a.lean = 0.25;
      yield* wait(a, rnd(1.5, 2.5));
      a.lean = 0;
    } else if (r < 0.75) {
      yield* wait(a, 0.6);
      yield* posed(a, PHOTO, 1.4, true);
      a.pop("room-pop room-pop-sparkle"); // (the shutter)
    } else {
      a.show("say", "room-say room-say-flower");
      a.talk = true;
      for (const o of party) if (o !== a) o.look = b.top;
      yield* posed(a, POINT, 1.6);
      a.talk = false;
      a.show("say", null);
    }
    if (Math.random() < 0.4) a.pop(Math.random() < 0.7 ? "pet-heart" : "room-pop room-pop-question");
    a.look = null;
  }

  // A few buckets looked at, near one another.
  function* browse(a, party) {
    const open = D.buckets.filter((b) => !b.away && !life.holder(life.standOf(b))); // (no one at it: a customer, or them at work)
    let b = pick(open);
    const seen = [];
    for (let k = Math.floor(rnd(1, 4)); k > 0 && b; k--) {
      life.release(a); // (the one before; the last they stay by, held, till they go from it)
      life.claim(a, life.standOf(b));
      seen.push(b);
      yield* walk(a, b.stand);
      yield* atBucket(a, b, party);
      // On to another nearby.
      const near = open.filter((o) => o !== b && !life.holder(life.standOf(o)) && Math.hypot(o.x - b.x, o.z - b.z) < 50);
      b = near.length ? pick(near) : null;
    }
    return seen;
  }

  // At the till: the bunch handed over, wrapped (if it is not yet), rung up and handed back; paid for.
  function* atTill(a, bq, wrap) {
    if (atCounter && atCounter !== a) {
      yield* walk(a, QUEUE);
      yield* turn(a, -Math.PI / 2);
      a.look = atCounter;
      yield* until(() => !atCounter, 60);
      a.look = null;
    }
    atCounter = a;
    a.cleanups.push(() => atCounter === a && (atCounter = null));
    yield* walk(a, COUNTER);
    yield* turn(a, -Math.PI / 2);
    const deal = (a.deal = { customer: a, bq, wrap, stage: "waiting" });
    a.cleanups.push(() => (deal.stage = "gone"));
    a.hold = HOLDS.carry;
    yield* until(() => life.serve(a, deal), 30); // (someone free to serve)
    yield* until(() => deal.stage === "taken" || deal.stage === "done", 30);
    hold(a, null);
    a.hold = null;
    a.look = deal.by ?? null;
    yield* until(() => deal.stage === "handing" || deal.stage === "done", 40);
    hold(a, bq);
    a.hold = HOLDS.carry;
    yield* pay(a, deal);
    a.deal = null;
    yield* walk(a, AWAY_FROM_TILL); // (out of the way of whoever is next, before they come up)
    atCounter = null;
  }
  // Paying: a card held out to the reader, a beep (a sparkle); pleased, the flowers held up to look at.
  function* pay(a, deal) {
    a.hold = HOLDS.treat;
    a.since = t();
    a.talk = true;
    yield* wait(a, 0.9);
    a.pop("room-pop room-pop-sparkle");
    deal.stage = "paid";
    a.talk = false;
    a.happy = true;
    yield* wait(a, 0.6);
    a.happy = false;
    yield* posed(a, HOLDS.admire, 1.2);
    a.pop("pet-heart");
  }

  // A bouquet asked for at the door: she says yes (a heart), they wait about outside, she brings it out.
  function* order(a, kind) {
    const inUse = (at) => people.some((o) => o !== a && (o.deal?.at === at || (o.goal && Math.hypot(o.goal[0] - at[0], o.goal[1] - at[1]) < 4)));
    const spot = WAIT_SPOTS.find(({ at }) => !inUse(at));
    if (!spot) return; // (both taken: no asking now)
    yield* walk(a, spot.at);
    yield* turn(a, Math.PI);
    a.show("say", "room-say room-say-flower");
    a.talk = true;
    const deal = (a.deal = { customer: a, kind, stage: "waiting", at: spot.at, from: spot.from, since: t() });
    a.cleanups.push(() => (deal.stage = "gone"));
    const taken = yield* until(() => life.order(a, deal), 20);
    yield* wait(a, 1.2);
    a.talk = false;
    a.show("say", null);
    if (!taken) return;
    // Waiting: looking about, at the flowers out front and up the street, or at their phone, till she comes
    // with it.
    const handed = () => deal.stage === "handing" || deal.stage === "gone";
    while (!handed() && t() - deal.since < 120) {
      if (Math.random() < 0.35) {
        a.look = [a.x + Math.sin(a.yaw) * 4, a.y + 14, a.z + Math.cos(a.yaw) * 4]; // (down at it)
        a.hold = SCROLL;
        a.since = t();
        a.rig.phone.visible = true;
        yield* until(handed, rnd(3, 6));
        a.rig.phone.visible = false;
        a.hold = null;
      } else {
        a.look = [a.x + rnd(-60, 60), rnd(5, 30), a.z + rnd(10, 60)];
        yield* until(handed, rnd(1.5, 3.5));
      }
      if (deal.by) a.look = deal.by;
      yield* until(handed, rnd(1, 2));
    }
    a.look = deal.by ?? null;
    if (deal.stage !== "handing") return;
    yield* until(() => deal.bq, 3);
    a.faceTowards(deal.by.x, deal.by.z);
    hold(a, deal.bq);
    a.hold = HOLDS.carry;
    yield* pay(a, deal);
    a.deal = null;
  }

  // Coming in: a wave to her if she is about (and she looks round).
  function* hello(a) {
    if (girl.away || Math.hypot(girl.x - a.x, girl.z - a.z) > 150) return;
    a.look = girl;
    a.faceTowards(girl.x, girl.z);
    a.happy = true;
    yield* wait(a, 1.1);
    a.happy = false;
    a.look = null;
  }

  // A visit by a party (its first leads), from coming up the street to going off along it.
  function* visit(a, party) {
    const from = rnd(-30, 160);
    a.comeAt = from;
    yield* comeIn(a, [from, STREET.z, EDGE], clock);
    a.away = false;
    yield* hello(a);
    const seen = yield* browse(a, party);
    const last = seen.at(-1);
    const r = Math.random();
    const madeOne = D.made.count > 0 && !D.made.away;
    if (last && r < 0.4 && life.claim(a, life.standOf(last))) {
      // A bunch out of the bucket, to the till to be wrapped.
      yield* walk(a, last.stand);
      yield* turn(a, last.yaw);
      a.lean = 0.25;
      a.hold = last.top[1] > 26 ? HOLDS.reachUp : HOLDS.pick;
      a.since = t();
      yield* wait(a, 0.7);
      last.pick?.();
      const bq = makeBouquet([last.kind], Math.floor(Math.random() * 1e6));
      bq.stems(4);
      hold(a, bq);
      life.release(a);
      a.lean = 0;
      a.hold = HOLDS.carry;
      yield* wait(a, 0.4);
      yield* atTill(a, bq, true);
    } else if (last && r < 0.65 && life.canOrder()) {
      life.release(a);
      yield* order(a, last.kind);
    } else if (madeOne && r < 0.85) {
      // A bouquet made up, out of the bucket by the door, to the till.
      life.release(a);
      yield* walk(a, D.made.at);
      yield* turn(a, D.made.yaw);
      a.hold = HOLDS.pick;
      a.since = t();
      yield* wait(a, 0.6);
      const g = D.made.take();
      if (g) {
        const bq = { group: g };
        hold(a, bq);
        a.hold = HOLDS.carry;
        yield* atTill(a, bq, false);
      }
    }
    // The dog, now and then, comes up to say hello: a pat.
    if (Math.random() < 0.35 && !party.some((o) => o.greeted)) yield* patDog(a);
    a.hold = a.holding ? HOLDS.carry : null;
    yield* leave(a);
  }
  // The dog asked over (if it will come), and patted, kneeling.
  function* patDog(a) {
    if (!life.invite(dog, "greet", a)) return;
    const met = yield* until(() => dog.jobName === "greet" && dog.sit && Math.hypot(dog.x - a.x, dog.z - a.z) < 26, 10);
    if (met) {
      a.faceTowards(dog.x, dog.z);
      a.lie = true; // (kneeling)
      a.hold = MOVES.pat;
      a.since = t();
      a.happy = true;
      yield* wait(a, 2);
      dog.beHappy(2);
      dog.pop();
      a.lie = false;
      a.happy = false;
      yield* wait(a, 0.4);
    }
    a.greeted = true;
    a.hold = a.holding ? HOLDS.carry : null;
  }
  function* leave(a) {
    life.release(a);
    a.leaving = [rnd(-30, 160), EDGE]; // (the others of the party go off with them)
    yield* walk(a, a.leaving);
    yield* goOff(a, STREET.z, clock);
    away(a);
  }

  // One of a party going along with `lead`: in with them, beside them, looking where they look, now and then
  // a word; outside the door while they are inside the kiosk. A child now and then runs off to a bucket near
  // by to point at it, or to pat the dog, and back. Off with them.
  // (Not where someone is, nor where the staff come to serve or to hand a bouquet over.)
  const KEEP_CLEAR = [COUNTER, QUEUE, AWAY_FROM_TILL, ...WAIT_SPOTS.map((w) => w.from)];
  const clear = (b, [x, z]) =>
    home.nav.free(x, z) &&
    KEEP_CLEAR.every(([cx, cz]) => Math.hypot(cx - x, cz - z) >= 9) &&
    !home.actors.some((o) => o !== b && !o.away && Math.hypot(o.x - x, o.z - z) < 9);
  const besideOf = (b, [x, z]) => {
    for (const [dx, dz] of [
      [b.side * 12, 0],
      [-b.side * 12, 0],
      [0, 12],
      [b.side * 9, 9],
      [-b.side * 9, 9],
      [0, -12],
    ])
      if (clear(b, [x + dx, z + dz])) return [x + dx, z + dz];
    return null;
  };
  function* tagAlong(b, lead) {
    b.side = Math.random() < 0.5 ? -1 : 1;
    yield* until(() => lead.comeAt !== undefined, 5);
    yield* comeIn(b, [lead.comeAt + b.side * 11, STREET.z + 4, EDGE], clock);
    b.away = false;
    const pace = b.kid ? 1.25 : 1; // (a child trotting to keep up)
    while (!lead.leaving && lead.visit) {
      const at = lead.walking && lead.goal ? lead.goal : [lead.x, lead.z];
      if (inside(at)) {
        // Outside the door while they pay (the one of the spots by it not taken).
        const spot = BY_DOOR.find(([x, z]) => !people.some((o) => o !== b && o.visit && Math.hypot(o.x - x, o.z - z) < 8)) ?? BY_DOOR[0];
        if (Math.hypot(b.x - spot[0], b.z - spot[1]) > 3) yield* walk(b, spot, pace);
        b.look = [lead.x, lead.y + 20, lead.z];
        if (!b.kid && Math.random() < 0.02) yield* posed(b, SCROLL, rnd(2, 4), true);
        yield;
        continue;
      }
      const to = besideOf(b, at);
      if (to && Math.hypot(b.x - to[0], b.z - to[1]) > (lead.walking ? 10 : 5)) {
        yield* walk(b, to, pace * (lead.walking ? 1.1 : 1));
        continue;
      }
      // Standing by them: looking where they look, or at them; a word now and then.
      b.look = lead.look ?? lead;
      if (!lead.walking && Math.random() < 0.01) {
        b.talk = true;
        yield* wait(b, rnd(0.8, 1.6));
        b.talk = false;
      } else if (b.kid && !lead.walking && Math.random() < 0.004) yield* runOff(b);
      yield;
    }
    b.look = null;
    // Off with them.
    const [x, z] = lead.leaving ?? [b.x, EDGE];
    yield* walk(b, [x + b.side * 11, z], pace);
    yield* goOff(b, STREET.z, clock);
    away(b);
  }
  // A child's dash: to a bucket near by to point at it (a heart), or to the dog to pat it; then back.
  function* runOff(b) {
    if (Math.random() < 0.3 && !b.greeted) return yield* patDog(b);
    const near = D.buckets.filter((o) => !o.away && Math.hypot(o.stand[0] - b.x, o.stand[1] - b.z) < 45 && !life.holder(life.standOf(o)));
    const o = near.length ? pick(near) : null;
    if (!o) return;
    yield* walk(b, o.stand, 1.5);
    yield* turn(b, o.yaw);
    b.look = o.top;
    b.happy = true;
    yield* posed(b, POINT, 1.2);
    b.happy = false;
    b.pop("pet-heart");
  }

  // Someone passing along the pavement, from one end to the other, as `kind`: "stroll" (glancing at the
  // flowers on the way, now and then stopping at a bucket in the front row to sniff it), "phone" (on it as they
  // go), "jog", "coffee" (a takeaway cup in hand), "hours" (stopping at the shutter to read when it opens) or
  // "couple" (with `other` beside them: beside()). While it is shut, a stop to stroke the cat or to point out
  // the possum, maybe.
  function* passBy(a, kind = "stroll", other = null) {
    const right = Math.random() < 0.5;
    const [x0, x1] = right ? [STREET.x0, STREET.x1] : [STREET.x1, STREET.x0];
    a.comeAt = x0;
    if (other) other.visit = beside(other, a, right ? 1 : -1);
    yield* comeIn(a, [x0, STREET.z, EDGE], clock);
    a.away = false;
    const pace = { jog: 2.6, couple: 0.8 }[kind] ?? 1;
    // (how they hold themselves as they go)
    const as = () => {
      a.rig.phone.visible = kind === "phone";
      a.hold = kind === "phone" ? SCROLL : a.holding ? HOLDS.carry : null;
      a.talk = false;
    };
    if (kind === "coffee") hold(a, { group: coffee() });
    as();
    const front = D.buckets.filter((b) => !b.away && b.z > 30 && (b.x - x0) * (x1 - x0) > 0);
    const stop = kind === "stroll" && Math.random() < 0.3 ? pick(front) : null;
    if (stop && !life.holder(life.standOf(stop)) && life.claim(a, life.standOf(stop))) {
      yield* walk(a, stop.stand);
      yield* atBucket(a, stop, [a]);
      life.release(a);
    }
    if (kind === "hours") {
      // Up to the shutter, a look up at the hours over it, a nod, and on.
      yield* walk(a, [rnd(-75, -45), SHUTTER.z + 18]);
      yield* turn(a, Math.PI);
      a.look = [a.x, SHUTTER.top + 6, SHUTTER.z];
      yield* wait(a, rnd(2, 3));
      a.nod = 0.25;
      yield* wait(a, 0.5);
      a.nod = 0;
      a.look = null;
    }
    let stopped = hours.state !== "closed" || kind === "jog" || kind === "couple";
    a.leaving = [x1, EDGE];
    let along = walk(a, a.leaving, pace);
    for (let n = 0; !along.next().done; n++) {
      if (kind === "phone") a.look = [a.x + Math.sin(a.yaw) * 4, a.y + 14, a.z + Math.cos(a.yaw) * 4]; // (down at it)
      if (n % 30 === 0 && kind === "stroll") {
        // (a glance at the nearest bucket as they go by)
        const b = D.buckets.filter((o) => !o.away).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0];
        a.look = b && Math.hypot(b.x - a.x, b.z - a.z) < 30 && Math.random() < 0.5 ? b.top : null;
      }
      if (!stopped && n % 15 === 0 && (stopped = yield* aside(a))) {
        as();
        along = walk(a, a.leaving, pace);
      }
      yield;
    }
    a.look = null;
    yield* goOff(a, STREET.z, clock);
    away(a);
  }
  // On the way, while it is shut: stopped to point out the possum, if she is out near by; or to stroke the cat,
  // if she is near and will come. Whether they stopped.
  function* aside(a) {
    const P = home.nighttime.possum.where();
    if (P.out && P.on !== "tree" && Math.hypot(P.x - a.x, P.z - a.z) < 110 && Math.random() < 0.6) {
      a.faceTowards(P.x, P.z);
      a.look = [P.x, P.y + 5, P.z];
      a.happy = true;
      a.rig.phone.visible = false;
      yield* posed(a, POINT, 1.8);
      a.happy = false;
      a.look = null;
      return true;
    }
    if (Math.random() > 0.45) return false;
    const pat = home.street.stroke(a);
    if (!pat) return false;
    const { cat } = pat;
    a.rig.phone.visible = false;
    a.hold = null;
    yield* walk(a, [cat.x, Math.min(EDGE, cat.z + 12)]);
    yield* until(() => Math.hypot(cat.x - a.x, cat.z - a.z) < 16 && !cat.walking, 5);
    a.faceTowards(cat.x, cat.z);
    a.lie = true; // (kneeling)
    a.look = cat;
    a.hold = MOVES.pat;
    a.since = t();
    a.happy = true;
    yield* wait(a, rnd(2.5, 4));
    pat.stop();
    cat.pop("pet-heart");
    a.lie = a.happy = false;
    a.look = null;
    yield* wait(a, 0.4);
    yield* walk(a, [a.x, EDGE]);
    return true;
  }
  // The other of a couple passing (`lead`): in with them, on the inside of the pavement, alongside; talking
  // now and then, each in turn, a look at each other; off with them.
  function* beside(b, lead, way) {
    b.lead = lead;
    const spot = () => [lead.x - way * 3, lead.z - 10];
    yield* comeIn(b, [lead.comeAt - way * 3, STREET.z - 10, EDGE - 10], clock);
    b.away = false;
    let turnAt = t() + rnd(1, 3);
    while (lead.visit && lead.z < EDGE + 1) {
      const [x, z] = spot();
      const d = Math.hypot(x - b.x, z - b.z);
      b.walking = lead.walking || d > 1.5;
      b.pace = lead.pace;
      if (d > 0.3) {
        const step = Math.min(d, b.speed * 1.4 * clock.dt);
        b.x += ((x - b.x) / d) * step;
        b.z += ((z - b.z) / d) * step;
      }
      if (lead.walking) b.face(lead.yaw);
      else if (d > 1.5) b.faceTowards(x, z);
      if (t() > turnAt) {
        turnAt = t() + rnd(1.5, 3.5);
        const k = Math.random();
        [lead.talk, b.talk] = [k < 0.4, k > 0.6];
        lead.look = k < 0.2 ? b : null;
        b.look = k > 0.7 ? lead : null;
      }
      yield;
    }
    Object.assign(b, { talk: false, look: null, walking: false, pace: 1 });
    yield* goOff(b, STREET.z, clock);
  }
  // A takeaway coffee: a white cup, a kraft sleeve, a brown lid.
  const coffee = () =>
    voxels((p) => {
      box(p, [-2, 2], [0, 7], [-2, 2], (x, y) => (y >= 2 && y <= 4 ? "#b98a5e" : "#f4f1ea"));
      box(p, [-2, 2], [8, 8], [-2, 2], "#4a3424");
    }, 0.5);

  function away(a) {
    a.away = true;
    a.left = t();
    life.release(a);
    letGo(a);
    setFade(a, 0);
    Object.assign(a, {
      visit: null,
      deal: null,
      hold: null,
      look: null,
      lean: 0,
      lie: false,
      nod: 0,
      talk: false,
      happy: false,
      greeted: false,
      leaving: null,
      comeAt: undefined,
      passing: false,
    });
    a.cleanups.splice(0).forEach((fn) => fn());
    a.show("say", null);
    a.rig.phone.visible = false;
    a.walking = false;
    a.rig.redress(Math.random); // (someone else, next time)
  }

  // Whoever has been away longest first (no one straight back the moment they have gone); `ok` says who.
  const free = (ok) =>
    people
      .filter((a) => !a.visit && ok(a))
      .sort((a, b) => (a.left ?? -1e9) - (b.left ?? -1e9))
      .slice(0, 3);

  return {
    people,
    // Each frame: a party up the street now and then while it is open, someone passing by; each visit moved
    // on a step.
    step() {
      if (hours.state !== "open") this.leaveAll(); // (closing time)
      const h = home.hour();
      if (t() >= nextAt) {
        nextAt = t() + rnd(14, 34) * (h > 19 ? 1.6 : 1);
        const parties = people.filter((a) => a.visit && a.lead === a).length;
        if (hours.open() && h < LAST_IN && parties < AT_ONCE + (Math.random() < 0.15 ? 1 : 0)) {
          const lead = pick(free((a) => !a.kid));
          if (lead) {
            const r = Math.random();
            const other = r < 0.22 ? pick(free((a) => !a.kid && a !== lead)) : r < 0.4 ? pick(free((a) => a.kid)) : null;
            const party = other ? [lead, other] : [lead];
            for (const a of party) a.lead = lead;
            lead.visit = visit(lead, party);
            if (other) other.visit = tagAlong(other, lead);
          }
        }
      }
      // Someone passing: fewer while it is shut, fewest late at night; what they are about with the time of day.
      if (t() >= passAt) {
        const shut = hours.state === "closed";
        const late = shut && (h >= 22 || h < 5);
        passAt = t() + (late ? rnd(35, 75) : shut ? rnd(14, 30) : rnd(18, 40));
        const a = pick(free((o) => !o.kid));
        if (a) {
          const r = Math.random();
          let kind = !shut
            ? "stroll"
            : late
              ? r < 0.35
                ? "phone"
                : r < 0.6
                  ? "couple"
                  : r < 0.75
                    ? "hours"
                    : "stroll"
              : r < 0.3
                ? "jog"
                : r < 0.6
                  ? "coffee"
                  : r < 0.75
                    ? "phone"
                    : "stroll";
          const other = kind === "couple" ? pick(free((o) => !o.kid && o !== a)) : null;
          if (kind === "couple" && !other) kind = "stroll";
          a.lead = null;
          a.passing = true;
          a.visit = passBy(a, kind, other);
          if (other) other.passing = true;
        }
      }
      for (const a of people.filter((o) => o.visit)) {
        try {
          if (a.visit.next().done) away(a);
        } catch (e) {
          console.error(`flower shop: ${a.name}`, e);
          away(a);
        }
      }
    },
    // Closing up (or the time jumped): anyone still about goes, at once (off the street, out of sight).
    clear() {
      people.forEach((a) => a.visit && away(a));
      atCounter = null;
      nextAt = t() + rnd(4, 10);
      passAt = t() + rnd(8, 20);
    },
    // Closing time: anyone still about walks off (without anything half done).
    leaveAll() {
      for (const a of people)
        if (a.visit && !a.goingHome && !a.passing) {
          a.goingHome = true;
          a.cleanups.splice(0).forEach((fn) => fn());
          life.release(a);
          a.show("say", null);
          a.rig.phone.visible = false;
          a.visit = (function* () {
            yield* leave(a);
            a.goingHome = false;
          })();
        }
    },
    // For the shaders made ready before the first draw (shop.js warm()): a bouquet in a hand.
    sample(on) {
      const a = people[0];
      if (on) hold(a, { group: bouquet(["rose"], 1) });
      else letGo(a);
    },
  };
}
