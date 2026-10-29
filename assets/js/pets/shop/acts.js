/*******************************************************************************
 * What the girl and the collie do in the flower shop (life.js picks one at a
 * time). Hers: make up a bouquet (stems gathered from three buckets, trimmed
 * and wrapped on the bench, a ribbon tied, stood in the bucket of bouquets made
 * up), top up the buckets with the watering can filled at the tap, mist the
 * house plants, sweep up fallen petals, chalk a new price on a tag, fetch fresh
 * stock from the cool room for a bucket picked thin, count the till, put the
 * radio on (and dance a little), sit with a cup of tea (the dog comes to be
 * stroked), give the dog a treat and look out of the door; and for customers
 * (customers.js), serve them at the till (wrap what they picked, ring it up,
 * hand it back) and bring out a bouquet one asked for. The dog's: keep near
 * her, nap in his bed, sniff the flowers (and sneeze), drink, lie in the
 * doorway watching the street, chase the pigeons off, and say hello to a
 * customer.
 *
 * Each activity is a generator using the house's steps (room/steps.js); what
 * it holds or changes is put back by a cleanup, so that cutting it short
 * (life.js) leaves nothing half done in sight.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd, pick, clamp } from "../stage.js";
import { makeSteps } from "../room/steps.js";
import { HOLDS, MOVES } from "../room/props.js";
import { makeBouquet } from "./props.js";
import { FLOWERS } from "./flowers.js";
import { GROUND, KIOSK, DOOR } from "./layout.js";

// Her arms at work (as room/props.js's HOLDS: [right, left]): sweeping with the broom, the dustpan held low;
// misting, the trigger squeezed now and then; snipping the stems on the bench, the other hand holding them;
// folding the paper round with both hands; chalking; tying the ribbon.
export const WORK = {
  sweep: (t) => [
    [-0.75 + 0.3 * Math.sin(t * 4.2), -0.45, 0.2 + 0.12 * Math.sin(t * 4.2), 0, 0],
    [-0.55, -0.35, -0.2, 0, 0],
  ],
  mist: (t) => [[-1.35, -0.25 + 0.12 * Math.max(0, Math.sin(t * 6)), 0.15, 0, 0], null],
  snip: (t) => [
    [-0.95 + 0.06 * Math.sin(t * 13), -0.6, 0.3, 0, 0],
    [-0.85, -0.65, -0.25, 0, 0],
  ],
  fold: (t) => [
    [-0.9 + 0.15 * Math.sin(t * 5), -0.65, 0.3 + 0.1 * Math.cos(t * 5), 0, 0],
    [-0.9 + 0.15 * Math.sin(t * 5 + Math.PI), -0.65, -0.3 - 0.1 * Math.cos(t * 5), 0, 0],
  ],
  chalk: (t) => [[-1.0 + 0.07 * Math.sin(t * 11), -0.45 + 0.06 * Math.cos(t * 13), 0.15, 0, 0], null],
  tie: (t) => [
    [-0.95, -0.7, 0.2, 0, 0.35 * Math.sin(t * 9)],
    [-0.95, -0.7, -0.2, 0, -0.35 * Math.sin(t * 9)],
  ],
  dance: (t) => [
    [-0.4 + 0.5 * Math.sin(t * 5), -0.6, 0.2, -0.4, 0],
    [-0.4 - 0.5 * Math.sin(t * 5), -0.6, -0.2, 0.4, 0],
  ],
};
const PRICES = [12, 15, 18, 20, 25, 30, 35, 45];

export function makeShopActs(home, life) {
  const { clock, scene } = home;
  const t = () => clock.t;
  const steps = makeSteps(home);
  const { walk, turn, wait, until, sitOn, getUp } = steps;
  const D = home.display;
  const K = home.kiosk;
  const G = home.grounds;
  const girl = home.byName.girl;
  const dog = home.byName.collie;
  const near = (a, [x, z], r) => Math.hypot(a.x - x, a.z - z) < r;

  /* ----- a little water and mist, seen while she pours, fills the can and mists ----- */

  // The water falling from the can's rose (or the tap) into a bucket: a thin bright column from one point to
  // another, shown while pouring.
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.7, depthWrite: false })
  );
  stream.visible = false;
  scene.add(stream);
  const [p, q] = [new THREE.Vector3(), new THREE.Vector3()];
  function pour(from, to) {
    if (!from) return (stream.visible = false);
    p.copy(from);
    q.set(...to);
    stream.position.copy(p).add(q).multiplyScalar(0.5);
    stream.scale.set(1, p.distanceTo(q), 1);
    stream.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.sub(p).normalize());
    stream.visible = true;
  }
  // Puffs of mist from the mister: a few soft dots drifting out and fading.
  const MISTS = 10;
  const mists = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.8, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xeaf6fb, transparent: true, opacity: 0.55, depthWrite: false }),
    MISTS
  );
  mists.count = 0;
  mists.frustumCulled = false;
  scene.add(mists);
  const puffs = [];
  const m4 = new THREE.Matrix4();
  function puff(at, dir) {
    if (puffs.length >= MISTS) puffs.shift();
    puffs.push({ at: at.clone(), dir: dir.clone(), born: t() });
  }
  function drawMist() {
    while (puffs.length && t() - puffs[0].born > 1.2) puffs.shift();
    puffs.forEach((m, i) => {
      const age = t() - m.born;
      const s = 0.6 + 2.2 * age;
      m4.makeScale(s, s, s).setPosition(m.at.x + m.dir.x * 8 * age, m.at.y + m.dir.y * 8 * age - 1.5 * age, m.at.z + m.dir.z * 8 * age);
      mists.setMatrixAt(i, m4);
    });
    mists.count = puffs.length;
    mists.instanceMatrix.needsUpdate = true;
  }

  /* ----- the steps activities are made of ----- */

  // Walk to `at` and face `yaw`.
  function* go(a, at, yaw, pace = 1) {
    yield* walk(a, at, pace);
    if (yaw !== undefined) yield* turn(a, yaw);
  }
  // Up to bucket `b`, once a customer at its stand has moved on (or after a while anyway); the stand held
  // while there (customers.js leaves it be), let go of on to the next one.
  function* toBucket(a, b, pace = 1) {
    if (a.stand) life.release(a, a.stand);
    a.stand = life.standOf(b);
    yield* until(() => life.claim(a, a.stand), 12);
    yield* go(a, b.stand, b.yaw, pace);
  }
  // Arms held `hold` (a pose or a move: MOVES-like functions get (t, elapsed)) for `secs`; calm if asked.
  function* work(a, hold, secs, calm = false) {
    a.hold = hold;
    a.since = t();
    yield* wait(a, secs, calm);
  }
  // A spot on the open pavement in front, free of everyone.
  const OPEN = [
    [-60, 150],
    [56, GROUND.z1 - 8],
  ];
  function freeSpot(a, [xs, zs] = OPEN, room = 22) {
    return home.nav.randomSpot(xs, zs, (x, z) =>
      home.actors.every((o) => o === a || (Math.hypot(o.x - x, o.z - z) > room && (!o.goal || Math.hypot(o.goal[0] - x, o.goal[1] - z) > room)))
    );
  }

  // The buckets as they are: picked from (`taken` stems since restocked) and drunk from (`water`).
  const buckets = D.buckets ?? [];
  buckets.forEach((b) => (b.taken = 0));
  const stocked = (b) => b.taken < 3;
  // Petals now and then off the flowers, onto the pavement in front of them.
  let petalAt = rnd(6, 14);

  /* ----- hers ----- */

  // A bouquet: `asked` (a kind a visitor picked) and two more from buckets near it, or any three; for a
  // customer who asked for it (`deal`: customers.js), taken out to them where they wait.
  function* bouquet(a, asked = null, deal = null) {
    const bench = K.spots?.bench;
    if (!bench || !buckets.length || !life.claim(a, "bench")) return;
    const ok = buckets.filter(stocked);
    const first = (asked && (ok.find((b) => b.kind === asked) || buckets.find((b) => b.kind === asked))) || pick(ok.length ? ok : buckets);
    const others = (ok.length ? ok : buckets)
      .filter((b) => b.kind !== first.kind)
      .sort((p, q) => Math.hypot(p.x - first.x, p.z - first.z) - Math.hypot(q.x - first.x, q.z - first.z))
      .slice(0, 6);
    const picks = [first];
    while (picks.length < 3 && others.length)
      picks.push(...others.splice(Math.floor(Math.random() * others.length), 1).filter((b) => !picks.some((p) => p.kind === b.kind)));
    const seed = Math.floor(Math.random() * 1e6);
    const bq = makeBouquet(
      picks.map((b) => b.kind),
      seed
    );
    let placed = false;
    a.cleanups.push(() => {
      if (!placed) bq.group.parent?.remove(bq.group);
      a.shop.hold(null);
    });
    if (asked) a.show("say", "room-say room-say-heart");
    // The stems, a few from each bucket.
    let stems = 0;
    for (const b of picks) {
      yield* toBucket(a, b);
      a.show("say", null);
      a.look = b.top;
      yield* work(a, b.top[1] > 26 ? HOLDS.reachUp : HOLDS.pick, 0.7);
      b.pick?.();
      b.taken++;
      stems += 2 + (Math.random() < 0.5 ? 1 : 0);
      bq.stems(stems);
      a.shop.hold(bq);
      a.shop.only("bunch");
      yield* work(a, HOLDS.carry, 0.45);
      a.look = null;
    }
    // To the bench: laid down on it, the stems trimmed, the paper folded round, the ribbon tied.
    yield* go(a, bench.at, bench.yaw);
    yield* work(a, HOLDS.pick, 0.45);
    a.shop.hold(null);
    a.shop.only();
    scene.add(bq.group);
    bq.group.position.set(...bench.top);
    bq.group.rotation.set(0, bench.yaw, Math.PI / 2); // lying, the blooms away from her
    a.look = bench.top;
    a.shop.only("snips");
    yield* work(a, WORK.snip, rnd(2, 3));
    a.shop.only();
    a.hold = WORK.fold;
    a.since = t();
    const t0 = t();
    while (t() - t0 < 2.4) {
      bq.wrapped(clamp((t() - t0) / 2.2, 0, 1), false);
      yield;
    }
    yield* work(a, WORK.tie, 1.1);
    bq.wrapped(1, true);
    a.pop("room-pop room-pop-sparkle");
    // Picked up and admired, and stood with the others made up.
    a.shop.hold(bq);
    a.shop.only("bunch");
    a.happy = true;
    a.look = null;
    yield* work(a, HOLDS.admire, 1.3);
    a.happy = false;
    if (deal && deal.stage === "waiting") {
      const c = deal.customer;
      yield* go(a, deal.from);
      a.faceTowards(c.x, c.z);
      a.look = c;
      a.talk = true;
      yield* work(a, HOLDS.admire, 0.6);
      a.talk = false;
      // Held out to them: they take it from her hand (customers.js).
      deal.bq = bq;
      deal.stage = "handing";
      placed = true;
      a.hold = HOLDS.pick;
      yield* until(() => deal.stage === "paid" || deal.stage === "gone", 6);
      a.shop.only();
      a.hold = null;
      a.happy = true;
      a.pop();
      yield* wait(a, 0.8);
    } else if (D.made) {
      yield* go(a, D.made.at, D.made.yaw);
      yield* work(a, HOLDS.pick, 0.5);
      a.shop.hold(null);
      a.shop.only();
      D.made.add(bq.group);
      placed = true;
    }
  }

  // A customer served at the till (`deal`: customers.js): what they picked taken from them, wrapped (if it
  // is not yet) and tied, rung up, handed back; paid, a smile.
  function* serve(a, deal) {
    const spot = K.spots?.register;
    const c = deal.customer;
    if (!spot || deal.stage === "gone") return;
    life.claim(a, "register");
    a.cleanups.push(() => {
      if (deal.stage === "taken") deal.stage = "done"; // (cut short: given back as it is)
    });
    yield* go(a, spot.at, Math.PI / 2);
    a.look = c;
    a.talk = true;
    yield* wait(a, 0.7);
    a.talk = false;
    if (deal.stage === "gone") return;
    yield* work(a, HOLDS.pick, 0.45);
    deal.stage = "taken";
    a.shop.hold(deal.bq);
    a.shop.only("bunch");
    a.look = null;
    if (deal.wrap && deal.bq.wrapped) {
      a.hold = WORK.fold;
      a.since = t();
      const t0 = t();
      while (t() - t0 < 2.2) {
        deal.bq.wrapped(clamp((t() - t0) / 2, 0, 1), false);
        yield;
      }
      yield* work(a, WORK.tie, 1);
      deal.bq.wrapped(1, true);
      a.pop("room-pop room-pop-sparkle");
    }
    yield* turn(a, spot.yaw);
    K.register?.ring(t());
    yield* work(a, MOVES.type, 1.2);
    yield* turn(a, Math.PI / 2);
    a.look = c;
    a.hold = HOLDS.pick; // (held out: they take it from her hand)
    a.since = t();
    yield* wait(a, 0.35);
    deal.stage = "handing";
    yield* until(() => deal.stage === "paid" || deal.stage === "gone", 6);
    a.shop.only();
    a.hold = null;
    a.happy = true;
    a.talk = true;
    yield* wait(a, 0.9);
    a.talk = false;
  }

  // The buckets topped up: the can from beside the tap, filled, poured into the driest few, put back.
  function* water(a) {
    const tap = G.spots?.tap;
    if (!tap || !G.can || !life.claim(a, "can")) return;
    const dry = [...buckets].sort((p, q) => p.water - q.water).slice(0, Math.floor(rnd(3, 5)));
    yield* go(a, tap.at, tap.yaw);
    yield* work(a, HOLDS.pick, 0.5);
    G.can.park(false);
    a.props.only("can");
    a.cleanups.push(() => {
      G.can.park(true);
      G.tap.set(false);
      pour(null);
    });
    a.hold = HOLDS.water;
    G.tap.set(true);
    yield* wait(a, 2.6);
    G.tap.set(false);
    const can = a.props.can;
    const rose = new THREE.Vector3();
    for (const b of dry) {
      yield* toBucket(a, b);
      a.look = b.top;
      const t0 = t();
      while (t() - t0 < 1.6) {
        can.rotation.x = -0.6 * clamp((t() - t0) / 0.3, 0, 1);
        a.props.spout.getWorldPosition(rose);
        if (t() - t0 > 0.3) pour(rose, [b.x, b.rim + 1, b.z]);
        yield;
      }
      pour(null);
      can.rotation.x = 0;
      b.water = 1;
      a.look = null;
    }
    yield* go(a, tap.at, tap.yaw);
    yield* work(a, HOLDS.pick, 0.5);
  }

  // The house plants misted, a few places along the trays.
  function* mist(a) {
    const places = G.spots?.plants ?? [];
    if (!places.length) return;
    a.shop.only("mister");
    const nozzle = new THREE.Vector3();
    const out = new THREE.Vector3();
    for (const place of [...places].sort(() => Math.random() - 0.5).slice(0, 3)) {
      yield* go(a, place.at, place.yaw);
      a.look = place.top;
      a.hold = WORK.mist;
      a.since = t();
      const t0 = t();
      let next = 0;
      while (t() - t0 < rnd(2.2, 3.2)) {
        if (t() - t0 > next) {
          next += 0.5;
          a.shop.mister.getWorldPosition(nozzle);
          out
            .set(...place.top)
            .sub(nozzle)
            .normalize();
          puff(nozzle.add(out.clone().multiplyScalar(2)), out);
        }
        yield;
      }
      a.look = null;
    }
  }

  // The petals swept up: along the front of the flowers, a few places, into the dustpan.
  function* sweep(a) {
    a.shop.only("broom", "dustpan");
    const places = [0, 1, 2]
      .map(() =>
        freeSpot(
          a,
          [
            [-90, 140],
            [54, GROUND.z1 - 8],
          ],
          14
        )
      )
      .filter(Boolean);
    for (const at of places) {
      yield* go(a, at, rnd(-0.4, 0.4));
      a.hold = WORK.sweep;
      a.since = t();
      const t0 = t();
      while (t() - t0 < rnd(2.5, 3.5)) {
        if (Math.random() < 0.05) G.petals?.sweep?.(a.x + rnd(-6, 6), a.z + rnd(2, 10), 8);
        yield;
      }
      G.petals?.sweep?.(a.x, a.z + 6, 18);
    }
  }

  // A price chalked afresh on one of the tags, kneeling to it.
  function* chalk(a) {
    const b = pick(buckets.filter((b) => b.tag));
    if (!b) return;
    yield* toBucket(a, b);
    a.lie = true; // (a person kneels)
    a.shop.only("chalk");
    a.look = b.top;
    yield* work(a, WORK.chalk, rnd(2.5, 3.5));
    const name = (FLOWERS[b.kind]?.name ?? b.kind).toUpperCase();
    b.tag.set(`${name} $${pick(PRICES)}`);
    a.shop.only();
    a.hold = null;
    yield* wait(a, 0.3);
    a.lie = false;
    yield* wait(a, 0.4);
  }

  // A bucket picked thin restocked from the cool room.
  function* restock(a) {
    const b = buckets.filter((b) => !stocked(b)).sort((p, q) => q.taken - p.taken)[0];
    const cool = K.spots?.cool;
    if (!b || !cool || !life.claim(a, "cool")) return;
    yield* go(a, cool.at, cool.yaw);
    K.cool?.set(true);
    a.cleanups.push(() => K.cool?.set(false));
    yield* wait(a, 0.7);
    yield* work(a, HOLDS.reach, 0.8);
    a.shop.fill([b.kind], Math.floor(Math.random() * 1e6));
    a.shop.only("bucket");
    a.hold = HOLDS.tray;
    yield* wait(a, 0.4);
    K.cool?.set(false);
    yield* toBucket(a, b, 0.85);
    yield* work(a, HOLDS.pick, 0.6);
    a.shop.only();
    b.restock?.();
    b.taken = 0;
    a.pop("room-pop room-pop-sparkle");
    yield* work(a, null, 0.5);
  }

  // The till counted at the register.
  function* till(a) {
    const spot = K.spots?.register;
    if (!spot || !life.claim(a, "register")) return;
    yield* go(a, spot.at, spot.yaw);
    K.register?.ring(t());
    yield* work(a, MOVES.type, rnd(4, 6), true);
  }

  // The radio on (a little dance to it), or off.
  function* radio(a) {
    const spot = K.spots?.radio;
    if (!spot || !K.radio || !life.claim(a, "radio")) return;
    yield* go(a, spot.at, spot.yaw);
    yield* work(a, MOVES.press, 0.5);
    K.radio.set(!K.radio.on);
    if (!K.radio.on) return yield* wait(a, 0.5);
    a.pop("room-pop room-pop-note");
    a.happy = true;
    yield* turn(a, Math.PI / 4);
    yield* work(a, WORK.dance, rnd(3, 5));
  }

  // A cup of tea on the stool; the dog comes over to be stroked.
  function* tea(a) {
    const stool = K.spots?.stool;
    if (!stool || !life.claim(a, "stool")) return;
    const seat = { x: stool.seat[0], z: stool.seat[2], yaw: stool.yaw, front: stool.at };
    yield* sitOn(a, seat);
    a.shop.only("cup");
    a.hold = HOLDS.lap;
    life.invite(dog, "beside", a);
    const end = t() + rnd(25, 45);
    while (t() < end && !a.interrupt) {
      if (near(dog, [a.x, a.z], 20) && dog.jobName === "beside" && Math.random() < 0.01) {
        a.shop.only();
        yield* work(a, MOVES.pat, 1.6);
        dog.beHappy(2);
        a.shop.only("cup");
      }
      yield* work(a, HOLDS.taste, 1.1, true);
      yield* work(a, HOLDS.lap, rnd(3, 6), true);
    }
    a.shop.only();
    a.hold = null;
    yield* getUp(a);
  }

  // The dog called out front for a treat: he sits, gets it, a pat.
  function* treat(a) {
    const at = freeSpot(a);
    if (!at || !life.available(dog)) return;
    yield* go(a, at, 0);
    if (!life.invite(dog, "come", a)) return;
    a.show("say", "room-say room-say-paw");
    yield* until(() => dog.jobName === "come" && dog.sit, 12);
    a.show("say", null);
    if (!dog.sit) return;
    a.faceTowards(dog.x, dog.z);
    a.lie = true;
    a.props.only("treat");
    yield* work(a, HOLDS.treat, 1.2);
    a.props.only();
    dog.beHappy(3);
    dog.pop();
    yield* work(a, MOVES.pat, 1.8);
    a.lie = false;
    yield* wait(a, 0.5);
  }

  // A look out of the door at the street, a while.
  function* lookout(a) {
    const door = K.spots?.door;
    if (!door || !life.claim(a, "door")) return;
    yield* go(a, door.at, 0);
    a.look = [door.at[0] + rnd(-40, 40), 20, 140];
    yield* wait(a, rnd(6, 12), true);
  }

  /* ----- his ----- */

  // Near her, sitting and watching what she does, till she goes off somewhere else.
  function* follow(a) {
    for (let k = 0; k < 4 && !a.interrupt; k++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const spot = freeNear(a, [girl.x + side * 16, girl.z + 10]);
      if (!spot) return;
      yield* walk(a, spot, 1.2);
      a.look = girl;
      a.sit = true;
      const end = t() + rnd(8, 20);
      while (t() < end && !a.interrupt && near(girl, spot, 34)) yield* wait(a, 0.2, true);
      a.sit = false;
      a.look = null;
    }
  }
  // A free spot as near [x, z] as there is.
  function freeNear(a, [x, z]) {
    const spot = home.nav.randomSpot([x - 10, x + 10], [z - 10, z + 10], (sx, sz) =>
      home.actors.every((o) => o === a || Math.hypot(o.x - sx, o.z - sz) > 12)
    );
    return spot || home.nav.nearest?.(x, z);
  }

  // A nap in his bed.
  function* nap(a) {
    const bed = K.spots?.dogBed;
    if (!bed || !life.claim(a, "dogBed")) return;
    yield* walk(a, bed.at);
    a.lie = true;
    yield* wait(a, rnd(2, 4), true);
    a.asleep = true;
    yield* wait(a, home.night ? rnd(90, 200) : rnd(30, 70), true);
    a.asleep = false;
    yield* wait(a, 0.6);
    a.lie = false;
  }

  // A sniff at the flowers; a sneeze now and then.
  function* sniff(a) {
    const b = pick(buckets);
    if (!b) return;
    yield* toBucket(a, b);
    a.faceTowards(b.x, b.z);
    a.look = b.top;
    const t0 = t();
    while (t() - t0 < rnd(2, 3.5)) {
      a.nod = 0.25 + 0.15 * Math.sin(t() * 14);
      yield;
    }
    a.nod = 0;
    if (Math.random() < 0.4) {
      a.pop("room-pop room-pop-star"); // achoo
      a.hop();
      yield* wait(a, 0.8);
    }
  }

  // A drink from his bowl.
  function* drink(a) {
    const bowl = G.spots?.bowl;
    if (!bowl) return;
    yield* walk(a, bowl.at);
    yield* turn(a, bowl.yaw);
    const t0 = t();
    while (t() - t0 < rnd(3, 5)) {
      a.nod = 0.6 + 0.1 * Math.sin(t() * 12);
      G.bowl?.drink?.(clock.dt);
      yield;
    }
    a.nod = 0;
  }

  // Lying across the doorway, watching the street.
  function* doorway(a) {
    const at = [rnd(DOOR.x0 + 14, DOOR.x1 - 14), KIOSK.z1 + 8];
    if (!home.nav.free(...at)) return;
    yield* walk(a, at);
    yield* turn(a, rnd(-0.3, 0.5));
    a.lie = true;
    yield* wait(a, rnd(15, 40), true);
    a.lie = false;
  }

  // The pigeons on the pavement chased off.
  function* chase(a) {
    const bird = G.birds?.landed?.();
    if (!bird) return;
    a.show("mood", null);
    yield* walk(a, [bird.x, bird.z], 2.2);
    a.bow = true;
    yield* wait(a, 0.8);
    a.bow = false;
    a.pop();
  }

  // Over to a customer to say hello (customers.js): sit by them, wagging, to be patted; till they go on.
  function* greet(a, who) {
    const at = freeNear(a, [who.x + 12, who.z + 6]);
    if (!at) return;
    yield* walk(a, at, 1.3);
    a.faceTowards(who.x, who.z);
    a.sit = true;
    a.look = who;
    a.happy = true;
    yield* until(() => !who.visit || who.greeted, 12);
    a.sit = false;
  }

  // Asked over: come and sit by `host` (her on the stool, say), till she is done.
  function* beside(a, host) {
    const at = freeNear(a, [host.x + 14, host.z + 8]);
    if (!at) return;
    yield* walk(a, at, 1.2);
    a.faceTowards(host.x, host.z);
    a.sit = true;
    a.look = host;
    while (host.job && !a.interrupt && t() - a.jobStart < 60) yield* wait(a, 0.2, true);
    a.sit = false;
  }
  // Called for a treat: come and sit in front of her.
  function* come(a, host) {
    const at = freeNear(a, [host.x, host.z + 12]);
    if (!at) return;
    yield* walk(a, at, 1.5);
    a.faceTowards(host.x, host.z);
    a.sit = true;
    a.look = host;
    yield* until(() => host.jobName !== "treat" || !host.lie, 15);
    yield* until(() => host.jobName !== "treat", 4);
    a.sit = false;
  }

  const night = () => home.night;
  const acts = {
    bouquet: { who: "human", only: "girl", weight: () => (night() ? 6 : 10), run: (a, asked, deal) => bouquet(a, asked, deal) },
    water: { who: "human", weight: () => (buckets.some((b) => b.water < 0.6) ? 8 : 1), run: water },
    mist: { who: "human", weight: () => (night() ? 1 : 4), run: mist },
    sweep: { who: "human", weight: () => ((G.petals?.count?.() ?? 0) >= 6 ? 7 : 0.5), run: sweep },
    chalk: { who: "human", weight: () => 3, run: chalk },
    restock: { who: "human", weight: () => (buckets.some((b) => !stocked(b)) ? 9 : 0), run: restock },
    till: { who: "human", weight: () => (night() ? 5 : 3), run: till },
    radio: { who: "human", weight: () => 2, run: radio },
    tea: { who: "human", weight: () => (night() ? 6 : 4), run: tea },
    treat: { who: "human", weight: () => 3, run: treat },
    lookout: { who: "human", weight: () => 2, run: lookout },
    follow: { who: "pet", weight: () => 8, run: follow },
    nap: { who: "pet", weight: () => (night() ? 20 : 6), run: nap },
    sniff: { who: "pet", weight: () => 4, run: sniff },
    drink: { who: "pet", weight: () => 3, run: drink },
    doorway: { who: "pet", weight: () => (night() ? 2 : 5), run: doorway },
    chase: { who: "pet", weight: () => (G.birds?.landed?.() ? 3 : 0), run: chase },
    beside: { who: "invited", weight: () => 0, run: beside },
    come: { who: "invited", weight: () => 0, run: come },
    greet: { who: "invited", weight: () => 0, run: greet },
    serve: { who: "invited", weight: () => 0, run: serve },
  };
  // Each frame: the buckets drink, petals fall, the mist drifts.
  acts.tick = (dt) => {
    buckets.forEach((b) => (b.water = Math.max(0, (b.water ?? 1) - dt / 700)));
    if (t() > petalAt && G.petals?.drop) {
      petalAt = t() + rnd(8, 20);
      const b = pick(buckets.filter((b) => !b.away));
      if (b) G.petals.drop(b.x + rnd(-10, 10), b.z + rnd(8, 16), pick(FLOWERS[b.kind]?.colors ?? ["#f2a3b8"]));
    }
    drawMist();
  };
  Object.defineProperty(acts, "tick", { enumerable: false });
  return acts;
}
