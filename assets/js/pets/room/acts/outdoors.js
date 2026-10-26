/*******************************************************************************
 * Out in the front garden (house/yard.js), on a walk with the dog or a stroll
 * (acts/outings.js takes them out of the front door and back in): a few of its
 * places one after another, the party going from one to the next together, the
 * dog trotting ahead on her lead and the other person beside or a step behind.
 *
 * - The pond: a crouch at the edge, crumbs for the ducks, who paddle over;
 *   the dog sits and watches them.
 * - The bench: a sit looking out over the pond (side by side, chatting), the
 *   dog lying at their feet; at night, looking up at the stars.
 * - The hammock: she climbs in for a doze (at night, looking up at the
 *   stars), he kneels by it keeping her company, the dog lying beside; rain
 *   opens the parasol over it.
 * - The swing under the cherry tree: one swings, the other pushes; the dog
 *   watches it go to and fro.
 * - A picnic on the blanket, the two of them, strawberries and a bite for the
 *   dog.
 * - The flowers along the wall and the fence: a sniff, and the dog's nose in
 *   them too.
 * - The bird bath (the birds fly off as they come).
 * - Out of the gate and along the lane to one end and back, the dog sniffing
 *   the lamp post.
 * - Fetch on the lawn, off the lead, with the ball from a pocket.
 * - In the rain, the dog in her raincoat splashing in a puddle; at night, the
 *   stars.
 * Each place is seldom gone to twice in a row; a visitor's pick or a call from
 * home (someone's pending activity), or rain with no umbrella, sends them
 * home early.
 *
 * Everyone but the host runs what the host hands them (`together`), one thing
 * after another, till the outing is over (`member`); nothing can wait forever,
 * and whatever is cut short leaves them standing on the ground.
 ******************************************************************************/

import { rnd, pick, clamp, wrap } from "../../stage.js";
import { HOLDS } from "../props.js";
import { TURNED_YAW } from "../view.js";

const V = TURNED_YAW; // facing the viewer, with the view turned to the front garden
const RIGHT = [Math.cos(V), -Math.sin(V)]; // on the ground, to the right on screen
const SKY = [0, 260, -420]; // where to look, gazing up at the stars

// `c` is everything they share (common.js), and the activities of the other files.
export function outdoorsActs(c) {
  const { home, clock, house, walk, turn, wait, until, sitOn, getUp, intoBed, outOfBed, claim, release, onEnd, t } = c;
  const nav = home.yardNav;
  const yard = house.yard;
  const Y = yard.spots;
  const wild = () => home.wildlife;
  const recent = []; // the last places gone to, to go somewhere else next time

  const people = (ev) => ev.party.filter((m) => m.who.human).map((m) => m.who);
  const dogOf = (ev) => ev.party.find((m) => m.lead)?.who || null;
  const handsFree = (a) => !a.umbrella;
  const beside = ([x, z], gap) => [x + RIGHT[0] * gap, z + RIGHT[1] * gap];
  const free = (p) => nav.free(...p);
  // Places for the party round `at`, the host there (unless `fixed` says otherwise: [who, [x, z]] pairs), the
  // rest on free ground beside it on screen if they can be, or a little further off, none on top of another;
  // anyone with no room left has no place (and stays where they came to, a step behind the host).
  function around(ev, at, fixed = []) {
    const places = new Map(fixed);
    if (!places.has(ev.host)) places.set(ev.host, at);
    const ok = (q) => free(q) && nav.clearLine(...at, ...q) && [...places.values()].every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > 15);
    for (const { who } of ev.party) {
      if (places.has(who)) continue;
      const near =
        [18, -18, 28, -28].map((r) => beside(at, r)).find(ok) ||
        nav.randomSpot([at[0] - 40, at[0] + 40], [at[1] - 40, at[1] + 40], (x, z) => ok([x, z]));
      if (near) places.set(who, near);
    }
    return places;
  }
  // Turned towards [x, z], keeping `keep` of the way to facing the viewer.
  const halfYaw = (a, [x, z], keep = 0.4) => V + wrap(Math.atan2(x - a.x, z - a.z) - V) * (1 - keep);
  const halfTowards = (a, p, keep) => a.face(halfYaw(a, p, keep));

  /* ---------- the party together ---------- */

  // Run `gen` a frame at a time until it is done or `stop()`; whether it finished.
  function* run(gen, stop) {
    try {
      for (;;) {
        if (stop()) return false;
        if (gen.next().done) return true;
        yield;
      }
    } finally {
      gen.return();
    }
  }
  // Back on its feet on the ground, after something cut short (on the bench, the swing or kneeling).
  function settle(a) {
    if (a.ground) [a.x, a.z] = a.ground;
    Object.assign(a, {
      seated: false,
      abed: false,
      asleep: false,
      ground: null,
      lie: false,
      sit: false,
      bow: false,
      lean: 0,
      nod: 0,
      pitch: 0,
      look: null,
      happy: false,
      walking: false,
    });
    a.hold = a.umbrella === "open" ? HOLDS.umbrella : null;
    a.y = 0;
  }
  // Each member of the party but the host does what the host hands it, one thing after another, till the
  // outing is over (outings.js's walkAlong).
  function* member(a, ev) {
    while (!ev.over) {
      const job = ev.jobs.get(a);
      if (job && !job.done) {
        if (!(yield* run(job.gen, () => ev.over || job.cancelled))) settle(a);
        job.done = true;
      }
      if (!ev.over) yield;
    }
  }
  // Everyone at once: `part(m)` is what each member of the party does (a generator, or null for nothing), the
  // host's done here; over when all are, or after `secs` at most.
  function* together(a, ev, part, secs = 30) {
    const end = t() + secs;
    const jobs = [];
    let own = null;
    for (const m of ev.party) {
      const gen = part(m);
      if (!gen) continue;
      if (m.who === a) own = gen;
      else {
        const job = { gen, done: false, cancelled: false };
        ev.jobs.set(m.who, job);
        jobs.push(job);
      }
    }
    if (own && !(yield* run(own, () => t() > end))) settle(a);
    yield* until(() => jobs.every((j) => j.done), Math.max(0, end - t()));
    jobs.forEach((j) => (j.cancelled = true));
  }

  // The host off to `to`, the party with them: the dog trotting ahead along the way on her lead, then to her
  // own place (`place(m)`, or null to stay by the host); the other person straight to theirs, or with none, a
  // step behind and beside the host when there is room.
  function* go(a, ev, to, place = () => null) {
    const pts = [[a.x, a.z], ...nav.path(a.x, a.z, ...to)];
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    ev.route = { pts, cum, len: cum.at(-1) };
    ev.at = 0;
    const pace = (Math.min(...ev.party.map((m) => m.who.speed)) / a.speed) * (ev.hurry ? 1.6 : 1);
    const places = (ev.places = new Map(ev.party.map((m) => [m.who, m.who === a ? null : place(m)])));
    const straight = (m) => m.who.human && places.get(m.who); // (the dog keeps by the host, on her lead)
    const there = (m) => walk(m.who, places.get(m.who), ev.hurry ? 1.5 : 1);
    yield* together(
      a,
      ev,
      (m) => (m.who === a ? along(a, ev, pace) : straight(m) ? there(m) : follow(m.who, ev, m)),
      ev.route.len / (a.speed * pace) + 15
    );
    yield* together(a, ev, (m) => (!straight(m) && places.get(m.who) ? there(m) : null), 15);
  }
  // The host along the way, telling the rest how far along it they are (`ev.at`).
  function* along(a, ev, pace) {
    const { pts } = ev.route;
    a.walking = true;
    a.pace = pace;
    try {
      for (let k = 1; k < pts.length; ) {
        const [px, pz] = pts[k];
        const d = Math.hypot(px - a.x, pz - a.z);
        const stride = a.speed * pace * clock.dt;
        if (d <= stride) {
          [a.x, a.z] = [px, pz];
          ev.at = ev.route.cum[k];
          k++;
          continue;
        }
        a.heading = [(px - a.x) / d, (pz - a.z) / d];
        a.faceTowards(px, pz);
        a.x += a.heading[0] * stride;
        a.z += a.heading[1] * stride;
        ev.at += stride;
        yield;
      }
      ev.at = ev.route.len;
    } finally {
      a.walking = false;
      a.heading = null;
      a.pace = 1;
    }
  }
  // Where on the way [x, z] `s` along it is, and which way it goes there.
  function pointAt({ pts, cum, len }, s) {
    s = clamp(s, 0, len);
    let k = 1;
    while (k < pts.length - 1 && cum[k] < s) k++;
    const [p, q] = [pts[k - 1], pts[Math.min(k, pts.length - 1)]];
    const seg = cum[k] - cum[k - 1] || 1;
    const u = clamp((s - cum[k - 1]) / seg, 0, 1);
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [
      [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u],
      [(q[0] - p[0]) / d, (q[1] - p[1]) / d],
    ];
  }
  // How far along the way the point on it nearest [x, z] is, and how far [x, z] is from it.
  function nearestOn({ pts, cum }, [x, z]) {
    let best = [0, Infinity];
    for (let k = 1; k < pts.length; k++) {
      const [p, q] = [pts[k - 1], pts[k]];
      const seg = cum[k] - cum[k - 1];
      const u = seg ? clamp(((x - p[0]) * (q[0] - p[0]) + (z - p[1]) * (q[1] - p[1])) / (seg * seg), 0, 1) : 0;
      const d = Math.hypot(p[0] + (q[0] - p[0]) * u - x, p[1] + (q[1] - p[1]) * u - z);
      if (d < best[1]) best = [cum[k - 1] + seg * u, d];
    }
    return best;
  }
  // Keeping up with the host along the way: the dog ahead and a little to one side of the way, the side that
  // keeps her further from them across the screen (not in front of them or behind them, on screen), stopping
  // short of where they are going, then at their side; anyone else behind and beside, or just behind, waiting where they are till the host is a
  // few steps past them (setting off, or coming back along the way); the straight way there always on the
  // way, or just off it where that is clear, or round whatever is in the way.
  const ahead = (a, ev) => {
    const [s, off] = nearestOn(ev.route, [a.x, a.z]);
    return ev.at - 15 < Math.max(0, off < 20 ? s : 0);
  };
  function* follow(a, ev, m) {
    const host = ev.host;
    let [side, pick, rethink] = [1, -1, 0]; // which place by the way they keep to, till when
    try {
      for (;;) {
        const there = ev.at >= ev.route.len - 0.01;
        let target;
        if (m.lead) {
          const [p, dir] = pointAt(ev.route, Math.min(ev.at + 18, ev.route.len - 12));
          const across = (q) => Math.abs((q[0] - host.x) * RIGHT[0] + (q[1] - host.z) * RIGHT[1]);
          const widest = (qs) => qs.sort((q1, q2) => across(q2) - across(q1))[0];
          target = widest([
            p,
            ...[-1, 1].map((k) => [p[0] - dir[1] * 8 * k, p[1] + dir[0] * 8 * k]).filter((q) => free(q) && nav.clearLine(...p, ...q)),
          ]);
          if (there) {
            // At their side, either side, or a step on ahead of them, whichever is furthest from them across
            // the screen; or else where she stopped.
            const by = widest(
              [
                [host.x - dir[1] * 12, host.z + dir[0] * 12],
                [host.x + dir[1] * 12, host.z - dir[0] * 12],
                [host.x + dir[0] * 12, host.z + dir[1] * 12],
              ].filter(
                (q) =>
                  free(q) && nav.clearLine(a.x, a.z, ...q) && [...ev.places.values()].every((o) => !o || Math.hypot(o[0] - q[0], o[1] - q[1]) > 12)
              )
            );
            if (by) target = by;
          }
        } else if (!there && ahead(a, ev)) {
          target = [a.x, a.z];
          a.faceTowards(host.x, host.z);
        } else {
          // Beside the way (either side), clear of the others following; where it is too narrow for that,
          // on it, further back if need be. Which, thought over now and then, not every step (no weaving).
          const [p, dir] = pointAt(ev.route, ev.at - 15);
          const apart = (q) => ev.party.every((o) => o.who === a || o.who === host || Math.hypot(o.who.x - q[0], o.who.z - q[1]) > 10);
          const ok = (q) => free(q) && nav.clearLine(...p, ...q) && apart(q);
          const places = (s) => [[p[0] + dir[1] * 10 * s, p[1] - dir[0] * 10 * s], p, pointAt(ev.route, ev.at - 27)[0]];
          if (pick < 0 || t() > rethink || (pick < 2 && !apart(places(side)[pick]))) {
            if (!ok(places(side)[0]) && ok(places(-side)[0])) side = -side;
            const q = places(side);
            pick = ok(q[0]) ? 0 : apart(q[1]) ? 1 : 2;
            rethink = t() + 1.5;
          }
          target = places(side)[pick];
          // Never back the way they came: a place behind them now (the one beside the way taken), they wait.
          const [mine, off] = nearestOn(ev.route, [a.x, a.z]);
          if (off < 20 && nearestOn(ev.route, target)[0] < mine - 2) {
            target = [a.x, a.z];
            a.faceTowards(host.x, host.z);
          }
        }
        if (free(target) && !nav.clearLine(a.x, a.z, ...target)) {
          // Round what is in the way.
          const way = nav.path(a.x, a.z, ...target);
          target = way.find((q) => Math.hypot(q[0] - a.x, q[1] - a.z) > 2) || target;
        }
        const d = Math.hypot(target[0] - a.x, target[1] - a.z);
        const step = Math.min(d, a.speed * (ev.hurry ? 2 : 1.4) * clock.dt);
        a.walking = step > clock.dt; // (moving at all: keeping pace just behind where they are going too)
        a.pace = clamp(step / (a.speed * clock.dt || 1), 0.6, 2);
        if (d > 0.01) {
          if (a.walking) a.faceTowards(...target);
          a.x += ((target[0] - a.x) / d) * step;
          a.z += ((target[1] - a.z) / d) * step;
        }
        if (there && d < 1) return;
        yield;
      }
    } finally {
      a.walking = false;
      a.pace = 1;
    }
  }

  /* ---------- the places ---------- */

  // The pond: the host on its house side, the other at its end and the dog between, looking out over it.
  function* pond(a, ev) {
    const [side, end, between] = Y.pond;
    const places = new Map([[a, side]]);
    people(ev).forEach((h) => h !== a && places.set(h, end));
    if (dogOf(ev)) places.set(dogOf(ev), between);
    yield* go(a, ev, side, (m) => (m.who === a ? null : places.get(m.who)));
    yield* together(a, ev, (m) => (m.who.human ? feedDucks(m.who) : watchDucks(m.who)), 24);
  }
  function* feedDucks(a) {
    a.faceTowards(yard.pond.x, yard.pond.z);
    a.look = Y.pondMid;
    yield* wait(a, rnd(0.6, 1.4));
    if (handsFree(a)) {
      a.lie = true; // crouching at the edge
      yield* wait(a, 0.6);
      for (let k = 0; k < 2; k++) {
        a.hold = HOLDS.throwOut;
        wild()?.crumbs([a.x + rnd(-4, 4), yard.pond.z + rnd(-2, 6)]);
        yield* wait(a, 0.5);
        a.hold = HOLDS.pick;
        yield* wait(a, rnd(1.2, 2));
      }
      a.hold = null;
    }
    a.look = { facePoint: () => wild()?.duckNear([a.x, a.z]) || Y.pondMid };
    a.happy = true;
    yield* wait(a, rnd(4, 6));
    a.pop();
    yield* wait(a, rnd(1.5, 2.5));
    a.lie = false;
    a.happy = false;
    a.look = null;
  }
  function* watchDucks(a) {
    a.faceTowards(yard.pond.x, yard.pond.z);
    a.sit = true;
    a.look = { facePoint: () => wild()?.duckNear([a.x, a.z]) || Y.pondMid };
    yield* wait(a, rnd(3, 4));
    a.hop();
    a.pop("room-pop room-pop-question");
    yield* wait(a, rnd(4, 6));
    a.sit = false;
    a.look = null;
  }

  // The bench: side by side (the host on the left), the dog lying at their feet; they chat, or sit quiet, or
  // at night look up at the stars. Then up, one a moment after the other.
  function* bench(a, ev) {
    const [s0, s1] = Y.bench;
    const humans = people(ev);
    const seatOf = new Map(humans.map((h, i) => [h, [s0, s1][i]]));
    const dog = dogOf(ev);
    yield* go(a, ev, s0.front, (m) => (m.who === a ? null : m.who.human ? seatOf.get(m.who).front : Y.benchDog));
    const secs = rnd(10, 16);
    yield* together(
      a,
      ev,
      (m) => (m.who.human ? sitBench(m.who, seatOf.get(m.who), humans, secs) : m.who === dog ? lieDown(m.who, secs) : null),
      secs + 10
    );
  }
  function* sitBench(a, seat, humans, secs) {
    if (!claim(a, seat.key)) return;
    try {
      yield* sitOn(a, seat);
      const mate = humans.find((h) => h !== a);
      const end = t() + secs;
      const first = humans[0] === a;
      let next = t() + rnd(1, 2.5) + (first ? 0 : 1.2);
      while (t() < end) {
        if (t() > next) {
          if (home.night) {
            a.look = SKY;
            a.pop("room-pop room-pop-star");
          } else if (mate) {
            a.look = mate;
            a.talk = true;
            a.show("say", `room-say room-say-${pick(["heart", "note", "star", "question"])}`);
          } else a.look = Y.pondMid;
          next = t() + rnd(2.5, 4.5);
        }
        if (a.talk && t() > next - rnd(0.8, 1.2)) {
          a.talk = false;
          a.show("say", null);
        }
        yield;
      }
      a.talk = false;
      a.show("say", null);
      a.look = null;
      if (!first) yield* wait(a, 0.7); // not up together
      yield* getUp(a);
    } finally {
      release(a, seat.key);
    }
  }
  function* lieDown(a, secs, stop = () => false) {
    a.face(V);
    a.lie = true;
    yield* until(stop, secs);
    a.lie = false;
  }

  // The hammock on the lawn by the wall: she climbs in for a doze (at night, to look up at the stars), he
  // kneeling on the grass by her a while, keeping her company, the dog lying beside it. Only with her
  // there, and not in the rain (rain coming on while she is in it opens the parasol over her).
  function* hammock(a, ev) {
    const bed = Y.hammock;
    const girl = people(ev).find((h) => h.name === "girl");
    const dog = dogOf(ev);
    const holder = people(ev).find((h) => h.leads); // (the dog lies within reach of its lead)
    const dogAt = !holder ? bed.dog : holder === girl ? bed.dogByHer : bed.dogBySide;
    yield* go(a, ev, girl === a ? bed.front : bed.side, (m) => (m.who === girl ? bed.front : m.who === dog ? dogAt : bed.side));
    const secs = rnd(25, 40);
    yard.nap.up = false;
    const up = () => yard.nap.up; // (clicked out of it early: all get up with her)
    yield* together(
      a,
      ev,
      (m) => (m.who === girl ? lieOn(girl, bed, secs) : m.who === dog ? lieDown(dog, secs, up) : keepCompany(m.who, girl, secs)),
      secs + 15
    );
  }
  function* lieOn(a, bed, secs) {
    if (!claim(a, bed.key)) return;
    try {
      yield* intoBed(a, bed);
      a.lean = bed.tilt; // (the back up along the canvas, the head on the pillow)
      yard.nap.who = a; // (a visitor clicking her gets her up, room.js)
      const end = t() + secs;
      let starAt = t() + rnd(2, 4);
      a.asleep = !home.night;
      while (t() < end && !yard.nap.up) {
        if (home.night && t() > starAt) {
          a.look = SKY;
          a.pop("room-pop room-pop-star");
          starAt = t() + rnd(4, 7);
        }
        yield;
      }
      a.asleep = false;
      a.look = null;
      yield* wait(a, 1.2); // awake, a look about
      a.lean = 0;
      yield* outOfBed(a, bed);
    } finally {
      a.lean = 0;
      yard.nap.who = null;
      release(a, bed.key);
    }
  }
  function* keepCompany(a, girl, secs) {
    yield* until(() => girl.abed, 8);
    a.faceTowards(girl.x, girl.z);
    a.lie = true; // kneeling
    a.look = girl;
    yield* wait(a, 2);
    a.pop();
    yield* until(() => !girl.abed, Math.max(2, secs - 6)); // (up with her, if she gets up early)
    a.lie = false;
    a.look = null;
  }

  // The swing: she has it if she is there (he, if he is out on his own); the other pushes, the dog watches.
  function* swingStop(a, ev) {
    const humans = people(ev);
    const rider = humans.find((h) => h.name === "girl") || a;
    const pusher = humans.find((h) => h !== rider) || null;
    const dog = dogOf(ev);
    const S = yard.swing;
    if (S.rider) return;
    const seat = { key: "swing", x: S.seat[0], z: S.seat[1], yaw: Math.PI, front: S.front };
    yield* go(a, ev, a === rider ? seat.front : S.push, (m) =>
      m.who === a ? null : m.who === rider ? seat.front : m.who === pusher ? S.push : Y.swingWatch
    );
    yield* together(
      a,
      ev,
      (m) => (m.who === rider ? ride(rider, seat, !!pusher) : m.who === pusher ? push(pusher) : m.who === dog ? watchSwing(dog) : null),
      40
    );
  }
  function* ride(a, seat, pushed) {
    const S = yard.swing;
    if (!claim(a, "swing")) return;
    S.rider = a;
    try {
      yield* sitOn(a, seat);
      a.hold = HOLDS.grip; // hands on the ropes
      const secs = rnd(11, 15);
      const t0 = t();
      let phase = 0;
      let noteAt = t0 + rnd(2, 4);
      for (;;) {
        const k = t() - t0;
        if (k > secs + 3.5) break;
        // Higher and higher (pushed, sooner), then slowing to a stop.
        const amp = (pushed ? 0.46 : 0.36) * Math.min(1, k / (pushed ? 3 : 5)) * (k > secs ? Math.max(0, 1 - (k - secs) / 3.5) : 1);
        phase += (clock.dt * 2 * Math.PI) / 3;
        S.angle = amp * Math.sin(phase);
        S.back = Math.sin(phase) < -0.85; // at the top of the backswing, where the pusher's hands meet the seat
        [a.x, a.y, a.z] = S.riderAt(S.angle);
        a.pitch = -S.angle;
        a.happy = amp > 0.2;
        if (t() > noteAt) {
          a.pop(pick(["room-pop room-pop-note", "pet-heart"]));
          noteAt = t() + rnd(2.5, 4);
        }
        yield;
      }
    } finally {
      S.angle = 0;
      S.back = false;
      S.rider = null;
      a.pitch = 0;
      [a.x, a.y, a.z] = [seat.x, 0, seat.z];
      a.happy = false;
      release(a, "swing");
    }
    a.hold = null;
    yield* getUp(a);
  }
  function* push(a) {
    const S = yard.swing;
    a.face(Math.PI);
    yield* until(() => S.rider, 6);
    while (S.rider) {
      a.look = S.rider;
      a.hold = S.back ? HOLDS.tray : null; // both hands out to the seat as it comes back
      a.happy = true;
      yield;
    }
    a.hold = null;
    a.happy = false;
    a.look = null;
  }
  function* watchSwing(a) {
    const S = yard.swing;
    yield* until(() => S.rider, 6);
    a.sit = true;
    a.happy = true;
    while (S.rider) {
      a.look = S.rider;
      halfTowards(a, [S.rider.x, S.rider.z], 0.3);
      yield;
    }
    Object.assign(a, { sit: false, happy: false, look: null });
  }

  // A picnic: the two of them kneeling side by side on the blanket (on screen), the plate between them, half
  // turned to each other; a strawberry each in turn, and one for the dog lying beside it.
  function* picnic(a, ev) {
    const humans = people(ev);
    const dog = dogOf(ev);
    const { mid } = Y.picnic;
    const [l, r] = [beside(mid, -13), beside(mid, 13)];
    yield* go(a, ev, l, (m) => (m.who === a ? null : m.who.human ? r : Y.picnic.dog));
    const secs = rnd(12, 16);
    yield* together(a, ev, (m) => (m.who.human ? eat(m.who, humans, secs, dog) : lieDown(m.who, secs)), secs + 8);
  }
  function* eat(a, humans, secs, dog) {
    const mate = humans.find((h) => h !== a);
    if (mate) yield* turn(a, halfYaw(a, [mate.x, mate.z], 0.5));
    a.lie = true;
    const first = humans[0] === a;
    yield* wait(a, first ? 0.6 : 2.2);
    const end = t() + secs;
    let fed = false;
    while (t() < end - 2) {
      a.look = mate;
      a.hold = HOLDS.pick; // a strawberry off the plate
      yield* wait(a, 0.6);
      a.hold = HOLDS.taste;
      yield* wait(a, 1);
      a.hold = null;
      a.happy = true;
      if (Math.random() < 0.5) a.pop();
      yield* wait(a, rnd(1.5, 2.5));
      a.happy = false;
      if (dog && first && !fed) {
        // One for the dog, held out low.
        fed = true;
        a.look = dog;
        a.hold = HOLDS.treat;
        yield* wait(a, 1.2);
        dog.hop();
        dog.pop();
        a.hold = null;
      }
      yield* wait(a, rnd(1, 2));
    }
    a.look = null;
    a.lie = false;
    yield* wait(a, 0.5);
  }

  // The flowers: a bed near by, a sniff of them, the other a step to the side, the dog's nose in them too; a
  // butterfly may lift off.
  function* flowers(a, ev) {
    const near = [...Y.flowers].sort((p, q) => Math.hypot(p.at[0] - a.x, p.at[1] - a.z) - Math.hypot(q.at[0] - a.x, q.at[1] - a.z));
    const bed = pick(near.slice(0, 3));
    const humans = people(ev);
    const places = around(ev, bed.at);
    yield* go(a, ev, bed.at, (m) => (m.who === a ? null : places.get(m.who)));
    wild()?.flutter(bed.bloom);
    yield* together(a, ev, (m) => sniff(m.who, bed.bloom, humans.length), 12);
  }
  function* sniff(a, bloom) {
    a.faceTowards(bloom[0], bloom[2]);
    a.look = bloom;
    yield* wait(a, rnd(0.3, 0.9));
    if (a.human) a.lean = 0.35;
    a.nod = a.human ? 0.2 : 0.7;
    yield* wait(a, rnd(1.6, 2.4));
    a.lean = 0;
    a.nod = 0;
    a.happy = true;
    a.pop(a.human ? "room-pop room-pop-sparkle" : "pet-heart");
    yield* wait(a, rnd(1.5, 2.5));
    a.happy = false;
    a.look = null;
  }

  // The bird bath: up to it to see the birds (they fly off as they come: wildlife.js).
  function* birds(a, ev) {
    const { at, bowl } = Y.bath;
    const places = around(ev, at);
    yield* go(a, ev, at, (m) => (m.who === a ? null : places.get(m.who)));
    yield* together(
      a,
      ev,
      (m) =>
        (function* () {
          const w = m.who;
          w.faceTowards(bowl[0], bowl[2]);
          w.look = { facePoint: () => wild()?.birdNear(bowl) || bowl };
          yield* wait(w, rnd(1.5, 2.5));
          w.happy = true;
          if (!w.human) w.hop();
          w.pop(w.human ? "pet-heart" : "room-pop room-pop-question");
          yield* wait(w, rnd(2, 3));
          w.happy = false;
          w.look = null;
        })(),
      10
    );
  }

  // Out of the gate and along the lane to one end, a look up and down it (the dog at the lamp post, if it is
  // on the way), and back in through the gate.
  function* lane(a, ev) {
    const { inside, outside } = Y.gate;
    const end = pick(Y.lane);
    yield* go(a, ev, inside);
    yield* go(a, ev, outside);
    if (cut(ev)) return yield* go(a, ev, inside);
    const lamp = Y.laneLamp;
    const way = Math.sign(end[0] - outside[0]);
    const byLamp = Math.sign(lamp.at[0] - outside[0]) === way;
    if (byLamp && dogOf(ev)) {
      const dog = dogOf(ev);
      const on = (k) => [lamp.at[0] + k * way, lamp.at[1]]; // a step on along the lane
      const places = around(ev, on(16), [
        [dog, lamp.at],
        ...people(ev)
          .filter((h) => h !== a)
          .map((h) => [h, on(34)]),
      ]);
      yield* go(a, ev, places.get(a), (m) => (m.who === a ? null : places.get(m.who)));
      yield* together(
        a,
        ev,
        (m) =>
          m.who === dog
            ? (function* () {
                dog.faceTowards(lamp.post[0], lamp.post[2]);
                dog.look = lamp.post;
                dog.nod = 0.7;
                yield* wait(dog, rnd(2.5, 3.5));
                dog.nod = 0;
                dog.look = null;
              })()
            : m.who.human
              ? (function* () {
                  halfTowards(m.who, [dog.x, dog.z]);
                  yield* wait(m.who, 3);
                })()
              : null,
        8
      );
    }
    yield* go(a, ev, end);
    yield* together(a, ev, (m) => lookAbout(m.who), 6);
    yield* go(a, ev, outside);
    yield* go(a, ev, inside);
  }
  function* lookAbout(a) {
    for (const yaw of [V - 0.9, V + 0.9]) {
      a.face(yaw);
      yield* wait(a, rnd(0.8, 1.4));
    }
    a.face(V);
    yield* wait(a, 0.5);
  }

  // Fetch on the lawn: the lead off, the ball out of a pocket; a few throws, the dog flat out after each, back
  // with it to drop it at their feet; then the ball away and the lead back on.
  function* fetch(a, ev) {
    const dog = dogOf(ev);
    const ball = home.yardBall;
    const area = pick(Y.lawn);
    const spot = nav.randomSpot(...area, (x, z) => free(beside([x, z], 14)));
    if (!dog || !spot) return;
    const places = around(ev, spot);
    yield* go(a, ev, spot, (m) => (m.who === a ? null : places.get(m.who)));
    onEnd(a, () => {
      ball.drop(); // (cut short, it goes back in the pocket)
      ball.mesh.visible = false;
    });
    // Off the lead, and the ball out.
    a.face(V);
    a.look = dog;
    yield* wait(a, 0.5);
    a.leads = false;
    dog.harnessed = false;
    const hand = a.rig.hands[0];
    ball.mesh.visible = true;
    ball.hold(hand);
    a.hold = HOLDS.carry;
    const fev = { target: null, back: false, done: false };
    const others = people(ev).filter((h) => h !== a);
    const play = (m) =>
      m.who === a
        ? throwing(a, dog, ball, area, fev)
        : m.who === dog
          ? chasing(dog, a, ball, fev)
          : others.includes(m.who)
            ? cheer(m.who, dog, fev)
            : null;
    yield* together(a, ev, play, 50);
    // The ball away, the lead back on.
    if (ball.held !== hand) {
      ball.drop();
      yield* until(() => ball.landed(), 2);
    }
    ball.held = null;
    ball.mesh.visible = false;
    a.hold = null;
    a.look = dog;
    yield* walk(dog, beside([a.x, a.z], 12));
    dog.faceTowards(a.x, a.z);
    yield* wait(a, 0.6);
    a.leads = true;
    dog.harnessed = true;
    a.look = null;
  }
  function* throwing(a, dog, ball, [xs, zs], fev) {
    const hand = a.rig.hands[0];
    try {
      for (let i = 0, n = 2 + Math.floor(Math.random() * 2); i < n; i++) {
        a.look = dog;
        a.hold = HOLDS.reach; // "Ready?"
        yield* wait(a, rnd(0.6, 1));
        const target = nav.randomSpot(
          [xs[0] - 20, xs[1] + 20],
          [zs[0] - 20, zs[1] + 20],
          (x, z) => Math.hypot(x - a.x, z - a.z) > 40 && Math.hypot(x - a.x, z - a.z) < 110 && nav.clearLine(a.x, a.z, x, z)
        );
        if (!target) break;
        a.faceTowards(...target);
        a.hold = HOLDS.throwBack;
        yield* wait(a, 0.45);
        a.hold = HOLDS.throwOut;
        ball.throwTo(target, t());
        fev.target = target;
        fev.back = false;
        a.look = { facePoint: () => ball.position() };
        yield* wait(a, 0.4);
        a.hold = null;
        if (!(yield* until(() => fev.back, 14))) break;
        // At their feet: crouch for it.
        a.look = dog;
        a.faceTowards(ball.at[0], ball.at[1]);
        a.lie = true;
        a.hold = HOLDS.pick;
        yield* wait(a, 0.5);
        ball.hold(hand);
        a.lie = false;
        a.hold = HOLDS.carry;
        a.beHappy(1);
        yield* wait(a, 0.4);
      }
    } finally {
      fev.done = true;
      a.lie = false;
    }
  }
  function* chasing(a, human, ball, fev) {
    a.happy = true;
    a.bow = true;
    a.look = { facePoint: () => ball.position() };
    let seen = null;
    while (!fev.done) {
      if (fev.target && fev.target !== seen) {
        seen = fev.target;
        a.bow = false;
        const [tx, tz] = fev.target;
        yield* walk(a, [tx + (human.x - tx) * 0.12, tz + (human.z - tz) * 0.12], 2.3);
        yield* until(() => ball.landed() || fev.done, 3);
        if (fev.done) break;
        a.faceTowards(ball.at[0], ball.at[1]);
        a.hop();
        a.nod = 0.7;
        yield* wait(a, 0.4);
        ball.hold(a.rig.mouth);
        a.nod = 0;
        a.look = human;
        const at = beside([human.x, human.z], 12);
        yield* walk(a, free(at) ? at : beside([human.x, human.z], -12), 1.4);
        a.faceTowards(human.x, human.z);
        a.nod = 0.5;
        yield* wait(a, 0.3);
        ball.rollTo([human.x + (a.x - human.x) * 0.45, human.z + (a.z - human.z) * 0.45], t());
        a.nod = 0;
        a.sit = true;
        fev.back = true;
        yield* until(() => fev.target !== seen || fev.done, 6);
        a.sit = false;
        a.look = { facePoint: () => ball.position() };
        a.bow = true;
      }
      yield;
    }
    Object.assign(a, { happy: false, bow: false, sit: false, look: null, nod: 0 });
    if (ball.held === a.rig.mouth) ball.drop();
  }
  function* cheer(a, dog, fev) {
    a.face(V);
    while (!fev.done) {
      a.look = dog;
      if (fev.back && Math.random() < 0.01) {
        a.happy = true;
        a.pop();
      }
      yield;
    }
    a.happy = false;
    a.look = null;
  }

  // In the rain, a puddle on the path: the dog in her raincoat bounces in it, splashing, while they laugh
  // under their umbrellas.
  function* puddles(a, ev) {
    const dog = dogOf(ev);
    const puddle = pick(home.weather.puddles.filter((p) => p[1] < yard.bounds[3] && free(p)));
    if (!dog || !puddle) return;
    // Where to watch her from: beside the puddle, whichever side is clear (never in it, where she jumps).
    const watch = [
      [16, 6],
      [-16, 6],
      [16, -6],
      [-16, -6],
      [0, 16],
    ]
      .map(([dx, dz]) => [puddle[0] + dx, puddle[1] + dz])
      .find((q) => free(q) && nav.clearLine(...puddle, ...q));
    if (!watch) return;
    const places = around(ev, watch, [[dog, puddle]]);
    yield* go(a, ev, places.get(a), (m) => (m.who === a ? null : places.get(m.who)));
    yield* together(
      a,
      ev,
      (m) =>
        m.who === dog
          ? (function* () {
              dog.happy = true;
              for (let k = 0; k < 4; k++) {
                dog.hop();
                yield* wait(dog, 0.35);
                for (let i = 0; i < 10; i++) {
                  const ang = Math.random() * Math.PI * 2;
                  home.water.emit(
                    "splash",
                    dog.x + Math.cos(ang) * 3,
                    0.5,
                    dog.z + Math.sin(ang) * 3,
                    Math.cos(ang) * rnd(12, 26),
                    rnd(20, 40),
                    Math.sin(ang) * rnd(12, 26),
                    0.6
                  );
                }
                dog.wet = Math.min(1, dog.wet + 0.12);
                yield* wait(dog, rnd(0.4, 0.8));
              }
              dog.happy = false;
            })()
          : (function* () {
              halfTowards(m.who, [dog.x, dog.z]);
              m.who.look = dog;
              m.who.happy = true;
              yield* wait(m.who, 2);
              m.who.pop();
              yield* wait(m.who, 2);
              m.who.happy = false;
              m.who.look = null;
            })(),
      10
    );
  }

  // At night, out on the lawn under the stars: a long look up, a star or two, the dog sitting by them.
  function* stars(a, ev) {
    const spot = Y.stars;
    const places = around(ev, spot);
    yield* go(a, ev, spot, (m) => (m.who === a ? null : places.get(m.who)));
    yield* together(
      a,
      ev,
      (m) =>
        (function* () {
          const w = m.who;
          w.face(V);
          w.look = SKY;
          if (!w.human) w.sit = true;
          yield* wait(w, rnd(2, 3));
          if (w.human) w.pop("room-pop room-pop-star");
          yield* wait(w, rnd(3, 4));
          if (w.human && people(ev).length > 1) w.pop();
          yield* wait(w, rnd(1.5, 2.5));
          w.sit = false;
          w.look = null;
        })(),
      12
    );
  }

  /* ---------- the outing ---------- */

  // Where they may go, how keen they are on each, and when it will do.
  const raining = () => home.weather.raining || home.weather.k > 0.2;
  const PLACES = [
    { name: "pond", run: pond, w: 3, ok: () => true },
    { name: "bench", run: bench, w: 3, ok: () => !raining() },
    { name: "swing", run: swingStop, w: 3, ok: () => !raining() },
    { name: "hammock", run: hammock, w: 3, ok: (ev) => people(ev).some((h) => h.name === "girl") && !raining() },
    { name: "picnic", run: picnic, w: 2.5, ok: (ev) => people(ev).length === 2 && !home.night && !raining() },
    { name: "flowers", run: flowers, w: 2.5, ok: () => true },
    { name: "birds", run: birds, w: 1.5, ok: () => !home.night && !raining() },
    { name: "lane", run: lane, w: 2.5, ok: () => true },
    { name: "fetch", run: fetch, w: 3.5, ok: (ev) => !!dogOf(ev) && !home.night && !raining() },
    { name: "puddles", run: puddles, w: 4, ok: (ev) => !!dogOf(ev) && raining() },
    { name: "stars", run: stars, w: 3, ok: () => home.night && !raining() },
  ];
  function choose(ev, done) {
    // The hammock, if a visitor clicked it (life.js), before anywhere else.
    const asked = yard.nap.want && PLACES.find((p) => p.name === "hammock" && p.ok(ev));
    if (asked) {
      yard.nap.want = false;
      return asked;
    }
    const options = PLACES.filter((p) => p.ok(ev) && !done.includes(p.name));
    const weight = (p) => p.w * (recent.includes(p.name) ? 0.25 : 1);
    let roll = Math.random() * options.reduce((sum, p) => sum + weight(p), 0);
    return options.find((p) => (roll -= weight(p)) < 0) || options.at(-1) || null;
  }
  // Called home: someone in the party asked to do something next (a visitor's pick, a meal on the table), or
  // caught in the rain without an umbrella (who hurries).
  function cut(ev) {
    if (people(ev).some((h) => h.pending || h.interrupt)) return true;
    if (raining() && people(ev).some((h) => !h.umbrella)) ev.hurry = true;
    return ev.hurry;
  }

  // The time out in the front garden, from the porch back to the porch: two to four places, a minute or two.
  function* outdoors(a, ev) {
    const start = t();
    const budget = rnd(55, 100);
    const done = (ev.done = []); // (the places gone to, for a look at what they did)
    while (!ev.over && !cut(ev) && done.length < 4 && !(done.length >= 2 && t() - start > budget) && t() - start < 130) {
      const place = choose(ev, done);
      if (!place) break;
      done.push(place.name);
      recent.push(place.name);
      if (recent.length > 3) recent.shift();
      yield* place.run(a, ev);
    }
    // Up the path to the porch, each to their place in the line to go in (outings.js), the dog first.
    const { door } = house.spots;
    const inLine = (m) => [door.x, door.outside - m.behind];
    yield* go(a, ev, inLine(ev.party.find((m) => m.who === a)), (m) => (m.who === a ? null : inLine(m)));
  }

  return { outdoors, member, together };
}
