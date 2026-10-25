/*******************************************************************************
 * Time at home for the two of them: watching TV (and putting up with a visitor
 * clicking the TV and its remote), a nap, bed at night, a book, watering the
 * plant, the laptop, a video game together on the PlayStation, a chat, a
 * stretch, a stroll, a rest, and the fire.
 ******************************************************************************/

import { rnd, pick, clamp } from "../../stage.js";
import { HOLDS, MOVES } from "../props.js";
import { V, F, SAY, DOWNSTAIRS } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function livingActs(c) {
  const {
    home,
    house,
    nav,
    byName,
    spots,
    walk,
    turn,
    wait,
    until,
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
    onEnd,
    t,
    other,
    humans,
    LIVING,
    SOFA,
    freeSeat,
    ground,
    toward,
    takeSeat,
    offPlaces,
    freeSpot,
    linger,
    dozeChance,
    faceSide,
  } = c;
  const snuggle = (...args) => c.snuggle(...args); // pets.js

  // The remote, taken from the coffee table: theirs till they put it back (or what they are doing ends, when
  // it is back on the table).
  const hasRemote = (a) => holder("remote") === a && !house.tv.remoteHome;
  function* fetchRemote(a) {
    if (!house.tv.remoteHome || !claim(a, "remote")) return false;
    yield* walk(a, spots.remote.at);
    yield* turn(a, spots.remote.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    house.tv.remoteHome = false;
    onEnd(a, () => holder("remote") === a && (house.tv.remoteHome = true));
    a.props.only("remote");
    a.hold = HOLDS.carry;
    yield* wait(a, 0.2);
    return true;
  }
  function* putRemote(a) {
    yield* walk(a, spots.remote.at);
    yield* turn(a, spots.remote.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.4);
    house.tv.remoteHome = true;
    release(a, "remote");
    a.props.only();
    a.hold = null;
    yield* wait(a, 0.2);
  }
  // The remote pointed at the TV, out to the side (standing, turned to the room first), and `then` when the
  // button is pressed.
  function* press(a, then) {
    const held = a.hold;
    if (!a.seated) yield* turn(a, V);
    a.hold = HOLDS.point;
    yield* wait(a, 0.45);
    then();
    yield* wait(a, 0.35);
    a.hold = held;
  }
  // Back on the seat after getting up for the remote, eyes on the TV again.
  function* sitBack(a, seat) {
    yield* sitOn(a, seat);
    if (hasRemote(a)) a.hold = HOLDS.lap;
    a.look = spots.tv;
  }
  // A cross face for `secs`.
  function* cross(a, secs) {
    a.setState("react", secs, "angry");
    yield* wait(a, secs);
    a.setState("idle");
  }

  // Watch TV on the sofa, switched on with the remote from the coffee table on the way (put back there) unless
  // it is on already; the other may come and watch too, and the pets snuggle up. Some doze off. Whoever is
  // last to stop switches it off. A visitor clicking about is noticed (asleep, not): another channel is
  // funny, or puzzling; flicking on and on, one of them gets up and keeps the remote; switched off, they
  // switch it back on (with the remote, getting up for it if need be), the second time crossly, and the
  // third time they give up.
  function* tv(a) {
    const seat = takeSeat(a, a.name === "girl" ? ["sofa1", "sofa0", "sofa2"] : ["sofa2", "sofa0", "sofa1"]);
    if (!seat) return;
    if (house.tv.mode === "off" && (yield* fetchRemote(a))) {
      yield* press(a, () => (a.watching = true));
      yield* putRemote(a);
    }
    yield* sitOn(a, seat);
    a.watching = true;
    a.look = spots.tv;
    const b = other(a);
    if (b && !b.watching && Math.random() < 0.4 && freeSeat(SOFA)) invite(b, act("tv", tv));
    for (const p of home.pets) if (Math.random() < 0.4) invite(p, act("snuggle", snuggle, a));
    const end = t() + rnd(20, 35);
    let dozeAt = dozeChance(0.15, 0.5);
    let laughAt = t() + rnd(4, 8);
    let zapAt = t() + rnd(10, 18);
    let seen = house.tv.poke.n;
    const flicks = []; // when a visitor turned over lately
    // What there is to see to, if anything: something a visitor did, or a turn over to another channel.
    const noticed = () => {
      const { n, what } = house.tv.poke;
      if (n !== seen) {
        seen = n;
        if (a.asleep) return null;
        if (what === "channel") flicks.push(t());
        return what;
      }
      return !a.asleep && hasRemote(a) && t() > zapAt ? "zap" : null;
    };
    for (;;) {
      let what = null;
      yield* linger(a, end - t(), {
        dozeAt,
        stop: () => (what = noticed()),
        each() {
          a.look = a.asleep ? null : spots.tv;
          if (!a.asleep && t() > laughAt) {
            if (Math.random() < 0.5) a.beHappy(1.4); // something funny
            laughAt = t() + rnd(4, 9);
          }
        },
      });
      if (!what) break;
      dozeAt = Infinity;
      if (!(yield* seeTo(a, seat, what, flicks))) break;
      if (what === "zap") zapAt = t() + rnd(10, 18);
    }
    // The last one watching switches it off; the remote goes back on the table.
    if (house.tv.mode !== "off" && !humans.some((h) => h !== a && h.watching)) {
      if (!hasRemote(a)) {
        yield* getUp(a);
        yield* fetchRemote(a);
      }
      if (hasRemote(a) && house.tv.mode !== "off") yield* press(a, () => (a.watching = false));
    }
    a.watching = false;
    a.look = null;
    if (a.seated) yield* getUp(a);
    if (hasRemote(a)) yield* putRemote(a);
  }

  // Seeing to `what` happened to the TV while watching (tv() above); false once they give up.
  function* seeTo(a, seat, what, flicks) {
    const set = house.tv;
    if (what === "zap") {
      yield* press(a, () => set.zap(t()));
      return true;
    }
    if (what === "on") {
      a.beHappy(1.2); // back on
      return true;
    }
    if (what === "channel") {
      if (flicks.filter((f) => t() - f < 8).length >= 3 && set.remoteHome && claim(a, "remote")) {
        yield* cross(a, 1);
        yield* getUp(a);
        yield* fetchRemote(a);
        yield* sitBack(a, seat);
      } else if (Math.random() < 0.45) a.beHappy(1.4);
      else if (Math.random() < 0.55) a.pop("room-pop room-pop-question");
      return true;
    }
    if (set.mode !== "off") return true;
    if (set.offs >= 3) {
      yield* cross(a, 1.6);
      return false;
    }
    a.pop("room-pop room-pop-question");
    yield* wait(a, 0.8);
    if (set.mode !== "off") return true; // back on already
    if (set.offs === 2) yield* cross(a, 1);
    if (hasRemote(a)) yield* press(a, () => set.restore(t()));
    else if (set.remoteHome && claim(a, "remote")) {
      yield* getUp(a);
      if (yield* fetchRemote(a)) yield* press(a, () => set.restore(t()));
      yield* sitBack(a, seat);
    }
    return true;
  }

  // Switch off the TV a visitor left on (life.js asks), with the remote, and put it back.
  function* tvOff(a) {
    if (!(yield* fetchRemote(a))) return;
    if (house.tv.mode !== "off" && house.tv.meddled) yield* press(a, () => house.tv.restore(t()));
    yield* putRemote(a);
  }

  // A doze on the sofa or the armchair, maybe with a pet curled up beside.
  function* nap(a) {
    const seat = takeSeat(
      a,
      [...LIVING].sort(() => Math.random() - 0.5)
    );
    if (!seat) return;
    yield* sitOn(a, seat);
    yield* wait(a, 1.2);
    for (const p of home.pets) if (Math.random() < 0.3) invite(p, act("snuggle", snuggle, a));
    a.asleep = true;
    yield* linger(a, rnd(15, 28), { stop: () => !a.asleep }); // until the time is up, or woken
    a.hold = MOVES.stretch; // a stretch on waking
    a.since = t();
    yield* wait(a, 2.4);
    a.hold = null;
    yield* getUp(a);
  }

  // To bed at night, in the loft: lie back, the quilt comes up, and sleep till morning (light mode), or a
  // good while, or till clicked awake; the cat may come and sleep at their feet. Up again with a stretch.
  function* sleep(a) {
    const seat = takeSeat(a, a.name === "girl" ? ["bed0", "bed1"] : ["bed1", "bed0"]);
    if (!seat) return;
    yield* intoBed(a, seat);
    const cat = byName.cat;
    if (cat && Math.random() < 0.5) invite(cat, act("snuggle", snuggle, a));
    a.asleep = true;
    yield* linger(a, rnd(70, 120), { stop: () => !a.asleep || !home.night });
    yield* wait(a, 1.2); // awake, a look about
    yield* outOfBed(a, seat);
  }

  // A book from the low shelf, one not read lately (house.js), read sitting down (sometimes dozing off over
  // it), and put back.
  function* read(a) {
    if (!claim(a, "book")) return;
    const book = house.books.next();
    onEnd(a, () => house.books.show(book, true));
    yield* walk(a, spots.shelf.at);
    yield* turn(a, spots.shelf.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.7);
    house.books.show(book, false);
    a.props.book(book);
    a.props.only("bookShut");
    a.hold = HOLDS.carry;
    yield* wait(a, 0.3);
    const seat = takeSeat(a, ["armchair", "sofa0", "sofa2", "sofa1"]);
    if (seat) yield* sitOn(a, seat);
    else {
      const spot = freeSpot(a, DOWNSTAIRS, 26, ground);
      if (spot) yield* walk(a, spot);
      yield* turn(a, V);
    }
    a.props.only("open");
    a.hold = HOLDS.read;
    a.nod = 0.12; // eyes on the page
    let flip = t() + 3;
    yield* linger(a, rnd(18, 30), {
      dozeAt: dozeChance(0.2, 0.5),
      each() {
        // A page turns every few seconds while awake.
        const k = clamp((t() - flip) / 0.5, 0, 1);
        a.props.leaf.outer.rotation.y = -Math.PI * k;
        if (k >= 1) {
          a.props.leaf.outer.rotation.y = 0;
          flip = t() + rnd(3, 5);
        }
        if (a.asleep) flip = t() + 1;
      },
    });
    a.nod = 0;
    a.props.only("bookShut");
    a.hold = HOLDS.carry;
    if (a.seated) yield* getUp(a);
    yield* walk(a, spots.shelf.at);
    yield* turn(a, spots.shelf.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    house.books.show(book, true);
    a.props.only();
    a.hold = null;
  }

  // Water the plant by the sofa; it sparkles.
  function* water(a) {
    if (!claim(a, "plant")) return;
    yield* walk(a, spots.plant.at);
    yield* turn(a, spots.plant.yaw);
    a.props.only("can");
    a.hold = HOLDS.water;
    a.look = spots.plant.pot;
    yield* wait(a, 0.8);
    home.drops.pour(a.props.spout, spots.plant.pot[1]);
    onEnd(a, () => home.drops.pour(null));
    yield* wait(a, 3.5);
    home.drops.pour(null);
    home.popAt([spots.plant.pot[0], 26, spots.plant.pot[2]], "room-pop room-pop-sparkle");
    a.beHappy(1.5);
    yield* wait(a, 0.6);
  }

  // Work on the laptop from the coffee table, sitting down; now and then a good idea, or a puzzle.
  function* laptop(a) {
    if (!claim(a, "laptop")) return;
    onEnd(a, () => (home.laptopHome.visible = true));
    yield* walk(a, spots.laptop.at);
    yield* turn(a, spots.laptop.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    home.laptopHome.visible = false;
    a.props.only("laptopShut");
    a.hold = HOLDS.carry;
    const seat = takeSeat(a, ["armchair", "sofa2", "sofa0", "sofa1"]);
    if (seat) {
      yield* sitOn(a, seat);
      a.props.only("laptop");
      a.hold = MOVES.type;
      a.nod = 0.25;
      let ideaAt = t() + rnd(6, 10);
      let mood = null;
      let moodEnd = 0;
      yield* linger(a, rnd(25, 40), {
        each() {
          const k = clamp((t() - a.since) / 0.6, 0, 1);
          a.props.lid.outer.rotation.x = 1.9 * k; // opening it
          if (mood && t() > moodEnd) {
            mood = null;
            a.hold = MOVES.type;
            a.happy = false;
          }
          if (!mood && t() > ideaAt) {
            ideaAt = t() + rnd(6, 10);
            const r = Math.random();
            if (r < 0.3) {
              mood = "idea";
              a.hold = MOVES.cheer;
              a.happy = true;
              a.pop("room-pop room-pop-star");
            } else if (r < 0.55) {
              mood = "hmm";
              a.hold = HOLDS.chin;
              a.pop("room-pop room-pop-question");
            }
            moodEnd = t() + (mood === "idea" ? 1.4 : 2.2);
          }
        },
      });
      a.happy = false;
      a.nod = 0;
      a.props.lid.outer.rotation.x = 0;
      a.props.only("laptopShut");
      a.hold = HOLDS.carry;
      yield* getUp(a);
    }
    yield* walk(a, spots.laptop.at);
    yield* turn(a, spots.laptop.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    home.laptopHome.visible = true;
    a.props.only();
    a.hold = null;
  }

  // A video game together on the sofa: the host fetches the two controllers from their stand on the mantel
  // and puts them back after; one wins and cheers, the other pouts, then they laugh.
  function* game(a) {
    const b = other(a);
    const pair = [
      ["sofa0", "sofa1"],
      ["sofa1", "sofa2"],
    ].find((keys) => keys.every((k) => !holder(k)));
    if (!b || !pair || !available(b)) return;
    const [mine, theirs] = a.name === "girl" ? pair : [pair[1], pair[0]];
    const ev = event(a, "game", { ready: new Set(), result: null });
    if (!invite(b, act("game", gamePartner, ev, theirs))) return;
    const seat = takeSeat(a, [mine]);
    if (!seat) return;
    yield* pads(a, false);
    yield* sitOn(a, seat);
    yield* play(a, ev);
    yield* getUp(a);
    yield* pads(a, true);
  }

  // The controllers taken off their stand (`back` false: theirs till put back, or what they are doing ends,
  // when they are back on it), or put back on it.
  function* pads(a, back) {
    if (back ? holder("pads") !== a : !house.tv.docked || !claim(a, "pads")) return;
    if (back) {
      a.props.only("pads");
      a.hold = HOLDS.carry;
    }
    yield* walk(a, spots.dock.at);
    yield* turn(a, spots.dock.yaw);
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    house.tv.dock(back, t());
    if (back) {
      release(a, "pads");
      a.props.only();
      a.hold = null;
      yield* wait(a, 0.3);
    } else {
      onEnd(a, () => holder("pads") === a && house.tv.dock(true, t()));
      a.props.only("pads");
      a.hold = HOLDS.carry;
    }
  }

  function* gamePartner(a, ev, key) {
    const seat = takeSeat(a, [key]);
    if (!seat || ev.over) return;
    yield* sitOn(a, seat);
    yield* play(a, ev);
    yield* getUp(a);
  }

  // Playing, till the host calls it. A visitor switching the TV off (or over to a channel) makes them both
  // cross, and the host switches it back with the controller's PS button.
  function* play(a, ev) {
    ev.ready.add(a);
    if (!(yield* until(() => ev.ready.size === 2 || ev.over, 45)) || ev.over) return;
    a.props.only("pad");
    a.hold = MOVES.pad;
    a.gaming = true;
    a.look = spots.tv;
    const end = t() + rnd(18, 24);
    const giveUp = t() + 60; // the guest's, should the host never call it
    let seen = house.tv.poke.n;
    while (!ev.over && (a === ev.host ? t() < end : !ev.result && t() < giveUp)) {
      if (house.tv.poke.n !== seen) {
        seen = house.tv.poke.n;
        if (house.tv.mode !== "game") {
          a.nod = 0;
          yield* cross(a, 1.2);
          if (a === ev.host && house.tv.mode !== "game") {
            a.nod = 0.25; // a look down at the controller
            yield* wait(a, 0.4);
            house.tv.restore(t());
            a.nod = 0;
          }
          continue;
        }
      }
      if (a === ev.host) a.nod = 0.08 * Math.sin(t() * 3);
      yield;
    }
    if (a === ev.host && !ev.over) ev.result = { winner: Math.random() < 0.5 ? a : other(a) };
    a.nod = 0;
    if (ev.result) {
      if (ev.result.winner === a) {
        a.hold = MOVES.cheer;
        a.happy = true;
        a.pop("room-pop room-pop-star");
      } else {
        a.props.only();
        a.hold = null;
        a.setState("react", 1.8, "angry");
      }
      yield* wait(a, 1.8);
      a.setState("idle");
      a.hold = null;
      a.props.only();
      a.happy = true; // and both laugh
      yield* wait(a, 1.2);
      a.happy = false;
    }
    a.gaming = false;
    a.props.only();
    a.hold = null;
    a.look = null;
    if (a !== ev.host) yield* wait(a, rnd(0.6, 1.8)); // up a little after the other
  }

  // A chat somewhere open downstairs, facing each other, taking turns, with what they say in bubbles.
  function* chat(a) {
    const b = other(a);
    if (!b || !available(b)) return;
    const ends = (x, z) => [-1, 1].map((s) => toward([x, z], 13 * s, 0));
    const spot = nav.randomSpot(
      ...DOWNSTAIRS,
      (x, z) =>
        ends(x, z).every((p) => nav.free(...p) && ground(...p) && offPlaces(...p)) &&
        home.actors.every((o) => o === a || o === b || Math.hypot(o.x - x, o.z - z) > 40)
    );
    if (!spot) return;
    const ev = event(a, "chat", { spot, here: new Set(), speaker: null, say: null, done: false });
    if (!invite(b, act("chat", chatPartner, ev))) return;
    yield* converse(a, ev, -1);
  }

  function* chatPartner(a, ev) {
    yield* converse(a, ev, 1);
  }

  function* converse(a, ev, side) {
    yield* walk(a, toward(ev.spot, 13 * side, 0));
    faceSide(a, -side, 0.85); // turned to each other, but open to the room
    ev.here.add(a);
    if (!(yield* until(() => ev.here.size === 2 || ev.over, 15))) return;
    const partner = [...ev.here].find((o) => o !== a);
    a.look = { facePoint: () => partner.facePoint().map((v, i) => (i === 0 ? v + 30 * F[0] : i === 2 ? v + 30 * F[1] : v)) }; // at them, still showing the face
    const speak = () => {
      a.talk = ev.speaker === a;
      a.show("say", a.talk ? `room-say room-say-${ev.say}` : null);
      a.nod = ev.speaker && !a.talk ? 0.08 * Math.sin(t() * 6) : 0; // nodding along
    };
    if (a === ev.host) {
      // The host runs the conversation: turns of a couple of seconds each.
      const turns = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < turns && !ev.over; k++) {
        ev.speaker = k % 2 ? partner : a;
        ev.say = pick(SAY);
        const end = t() + rnd(1.6, 2.4);
        while (t() < end && !ev.over) {
          speak();
          yield;
        }
      }
      ev.done = true;
    }
    while (!ev.done && !ev.over) {
      speak();
      yield;
    }
    a.talk = false;
    a.nod = 0;
    a.show("say", null);
    a.happy = true;
    if (Math.random() < 0.4) a.pop();
    yield* wait(a, 1.2);
  }

  // A stretch, arms up.
  function* stretch(a) {
    a.hold = MOVES.stretch;
    a.since = t();
    a.happy = true;
    yield* wait(a, 2.4);
  }

  // A wander somewhere, upstairs or down, and a look round.
  function* stroll(a) {
    const spot = freeSpot(a);
    if (spot) yield* walk(a, spot);
    if (!a.human && Math.random() < 0.4) a.sit = true;
    yield* linger(a, rnd(2, 5));
  }

  // Doing nothing much for a moment; first off any spot someone may be sent to (where it just was, say),
  // so as not to be in their way when they come.
  function* rest(a) {
    if (a.above() < 0.5 && !offPlaces(a.x, a.z)) {
      const spot = freeSpot(a, [
        [a.x - 30, a.x + 30],
        [a.z - 30, a.z + 30],
      ]);
      if (spot) yield* walk(a, spot);
    }
    if (a.name === "cat" && Math.random() < 0.5) a.sit = true;
    yield* linger(a, rnd(3, 7));
  }

  /* ----- the dressing corner, the fire and the garden ----- */

  // Walk to `to`, but stop as soon as `stop()`; whether it got there.
  function* walkUnless(a, to, stop) {
    for (const _ of walk(a, to)) {
      if (stop()) return false;
      yield;
    }
    return true;
  }

  // Light the fire: a log from the basket, kneel at the hearth, set it going, and warm the hands; the pets
  // come and lie by it. It burns for a few minutes.
  function* lightFire(a) {
    if (house.fire.lit || !claim(a, "fire")) return;
    yield* walk(a, spots.logs.at);
    yield* turn(a, spots.logs.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    a.props.only("log");
    a.hold = HOLDS.carry;
    yield* walk(a, spots.hearth.at);
    yield* turn(a, spots.hearth.yaw);
    a.look = spots.hearth.fire;
    a.lie = true; // kneeling
    yield* wait(a, 0.5);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.8);
    a.props.only();
    house.fire.lit = true;
    house.fire.until = t() + rnd(200, 320);
    home.popAt(spots.hearth.fire, "room-pop room-pop-sparkle");
    yield* wait(a, 1);
    a.hold = HOLDS.warm;
    a.happy = true;
    for (const p of home.pets) if (Math.random() < 0.6) invite(p, act("fireside", fireside));
    yield* wait(a, 2.5);
  }

  // A pet curled up by the fire while it burns, dozing off in the warmth.
  function* fireside(a) {
    const k = [0, 1].find((i) => !holder(`fireside${i}`));
    if (!house.fire.lit || k === undefined || !claim(a, `fireside${k}`)) return;
    yield* walk(a, spots.fireside[k]);
    a.face(V - 0.5);
    a.lie = true;
    yield* linger(a, rnd(40, 80), { dozeAt: t() + rnd(3, 8), stop: () => !house.fire.lit });
    a.lie = false;
  }

  return { tv, tvOff, nap, sleep, read, water, laptop, game, chat, stretch, stroll, rest, walkUnless, lightFire, fireside };
}
