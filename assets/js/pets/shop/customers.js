/*******************************************************************************
 * The flower shop's customers: people of the town (models/townsfolk.js) who
 * come up the street while the shop is open, now and then one or two at a time,
 * fewer late in the evening. Each looks round a few buckets (a look, a sniff,
 * a lean in), and then:
 * - picks a bunch out of a bucket themselves (as the A-frame says) and takes
 *   it into the kiosk to the till, where one of them wraps it in kraft paper,
 *   ties a ribbon round it, rings it up and hands it back;
 * - or asks her at the door for a bouquet of something they liked, and waits
 *   about outside while she makes it up, till she brings it out;
 * - or takes one of the bouquets made up from the bucket by the door and pays
 *   for it at the till;
 * - or just has a look and goes.
 * Paid, they are pleased; on the way out the dog may come up to them to be
 * patted. Then off up the street. A customer is an actor like the others
 * (room/actor.js) but goes by this file, not life.js; the staff's side of it
 * (serving at the till, the bouquet made to order, the dog's hello) is in
 * acts.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd, pick } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { makeActor } from "../room/actor.js";
import { HOLDS, MOVES } from "../room/props.js";
import { buildTownsfolk, TOWNSFOLK } from "../models/townsfolk.js";
import { makeBouquet } from "./props.js";
import { bouquet } from "./flowers.js";
import { setFade, comeIn, goOff } from "./fade.js";
import { HOURS, STREET, GROUND } from "./layout.js";

const AT_ONCE = 2; // customers about at once, at most (now and then one more)
const LAST_IN = HOURS.close - 0.3; // no one new comes after this
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

// The people, built a person at a time (a yield after each, as the builders do); returns the customers.
export function* buildingCustomers(home) {
  const people = [];
  for (const [i, look] of TOWNSFOLK.entries()) {
    const a = makeActor(`customer-${look.name}`, buildTownsfolk(look), "human", home, 1);
    Object.assign(a, { customer: true, away: true, x: 0, z: STREET.z, y: 0, visit: null, deal: null, cleanups: [] });
    // What they hold: in the right hand, upright.
    const grip = new THREE.Group();
    grip.position.set(0, -1.5, 1.2);
    grip.rotation.set(Math.PI / 2, 0, 0);
    a.rig.hands[0].add(grip);
    a.grip = grip;
    setFade(a, 0);
    home.actors.push(a);
    people.push(a);
    yield (i + 1) / TOWNSFOLK.length;
  }
  return makeCustomers(home, people);
}

function makeCustomers(home, people) {
  const { clock } = home;
  const t = () => clock.t;
  const steps = makeSteps(home);
  const { walk, turn, wait, until } = steps;
  const D = home.display;
  const K = home.kiosk;
  const life = home.life;
  const hours = life.hours;
  const girl = home.byName.girl;
  const dog = home.byName.collie;
  let nextAt = t() + rnd(4, 10);
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

  // A few buckets looked at, near one another: at each, a lean in, a look, a sniff (a happy pop, or a "?").
  function* browse(a) {
    const open = D.buckets.filter((b) => !b.away && !life.holder(life.standOf(b))); // (no one at it: a customer, or them at work)
    let b = pick(open);
    const seen = [];
    for (let k = Math.floor(rnd(1, 4)); k > 0 && b; k--) {
      life.release(a); // (the one before; the last they stay by, held, till they go from it)
      life.claim(a, life.standOf(b));
      seen.push(b);
      yield* walk(a, b.stand);
      yield* turn(a, b.yaw);
      a.look = b.top;
      a.lean = 0.15;
      const t0 = t();
      const secs = rnd(2, 4);
      while (t() - t0 < secs) {
        a.nod = 0.2 + 0.1 * Math.sin(t() * 9) * (t() - t0 > secs / 2 ? 1 : 0); // (a sniff, after a look)
        yield;
      }
      a.nod = 0;
      a.lean = 0;
      if (Math.random() < 0.4) a.pop(Math.random() < 0.7 ? "pet-heart" : "room-pop room-pop-question");
      a.look = null;
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
  // Paying: a card held out to the reader, a beep (a sparkle); pleased.
  function* pay(a, deal) {
    a.hold = HOLDS.treat;
    a.since = t();
    a.talk = true;
    yield* wait(a, 0.9);
    a.pop("room-pop room-pop-sparkle");
    deal.stage = "paid";
    a.talk = false;
    a.hold = HOLDS.carry;
    a.happy = true;
    yield* wait(a, 0.8);
    a.happy = false;
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
    // Waiting: looking about, at the flowers out front and up the street, till she comes with it.
    const handed = () => deal.stage === "handing" || deal.stage === "gone";
    while (!handed() && t() - deal.since < 120) {
      a.look = [a.x + rnd(-60, 60), rnd(5, 30), a.z + rnd(10, 60)];
      yield* until(handed, rnd(1.5, 3.5));
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

  // A visit, from coming up the street to going off along it.
  function* visit(a) {
    const from = rnd(-30, 160);
    yield* comeIn(a, [from, STREET.z, GROUND.z1 - 8], clock);
    a.away = false;
    const seen = yield* browse(a);
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
    if (Math.random() < 0.35 && life.invite(dog, "greet", a)) {
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
    }
    a.hold = a.holding ? HOLDS.carry : null;
    yield* leave(a);
  }
  function* leave(a) {
    life.release(a);
    yield* walk(a, [rnd(-30, 160), GROUND.z1 - 8]);
    yield* goOff(a, STREET.z, clock);
    away(a);
  }
  function away(a) {
    a.away = true;
    a.left = t();
    life.release(a);
    letGo(a);
    setFade(a, 0);
    Object.assign(a, { visit: null, deal: null, hold: null, look: null, lean: 0, lie: false, nod: 0, talk: false, happy: false, greeted: false });
    a.cleanups.splice(0).forEach((fn) => fn());
    a.show("say", null);
    a.walking = false;
  }

  return {
    people,
    // Each frame: someone new up the street now and then while it is open; each visit moved on a step.
    step() {
      if (hours.state !== "open") this.leaveAll(); // (closing time)
      const about = people.filter((a) => a.visit);
      const h = home.hour();
      if (t() >= nextAt) {
        nextAt = t() + rnd(14, 34) * (h > 19 ? 1.6 : 1);
        // (one of those away longest: no one straight back the moment they have gone)
        const free = people.filter((a) => !a.visit).sort((a, b) => (a.left ?? -1e9) - (b.left ?? -1e9));
        if (hours.open() && h < LAST_IN && free.length && about.length < AT_ONCE + (Math.random() < 0.15 ? 1 : 0)) {
          const a = pick(free.slice(0, 3));
          a.visit = visit(a);
        }
      }
      for (const a of about) {
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
    },
    // Closing time: anyone still about walks off (without anything half done).
    leaveAll() {
      for (const a of people)
        if (a.visit && !a.leaving) {
          a.leaving = true;
          a.cleanups.splice(0).forEach((fn) => fn());
          life.release(a);
          a.show("say", null);
          a.visit = (function* () {
            yield* leave(a);
            a.leaving = false;
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
