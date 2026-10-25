/*******************************************************************************
 * Going out: the walk with the dog through the front door (the keys, the
 * umbrellas, the lead), and fetch.
 ******************************************************************************/

import { rnd } from "../../stage.js";
import { HOLDS, MOVES } from "../props.js";
import { V, R, DOWNSTAIRS } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function outingsActs(c) {
  const {
    home,
    clock,
    house,
    nav,
    byName,
    spots,
    walk,
    turn,
    wait,
    until,
    claim,
    release,
    act,
    event,
    available,
    invite,
    later,
    onEnd,
    t,
    other,
    ground,
    toward,
    freeSpot,
    beside,
    halfTowards,
    faceSide,
  } = c;
  const petPet = (...args) => c.petPet(...args); // pets.js

  // The dog on her lead, often the other person too; the cat stays home (and, with them all out, gets up to
  // mischief). They line up in single file inside the door, the dog first, clip on her lead, and
  // go out; out of sight they are out for a while, then come back in the same way, and the dog is petted.
  // In the rain each of them takes their umbrella off the rack first and puts it up on the step, and the
  // dog has her raincoat on; back in, umbrellas down and shaken and back on the rack, the dog shakes
  // herself, and they all leave wet footprints for a few steps.
  function* outing(a) {
    const { door } = spots;
    const dog = byName.collie;
    const b = other(a);
    const party = [];
    if (dog && available(dog)) party.push({ who: dog, lead: true });
    party.push({ who: a });
    if (b && available(b) && Math.random() < 0.45) party.push({ who: b });
    let gap = 0;
    for (const m of party) {
      m.behind = gap; // how far behind the first in the line
      gap += m.who.human ? 18 : 22;
    }
    const ev = event(a, "walk", { party: [], ready: new Set() });
    for (const m of party) if (m.who === a || invite(m.who, act("walk", walkAlong, ev, m))) ev.party.push(m);
    yield* takeKeys(a);
    yield* lineUp(
      a,
      ev,
      party.find((m) => m.who === a)
    );
    if (!(yield* until(() => ev.ready.size === ev.party.length || ev.over, 25))) return;
    // Clip on the leads, and open the door.
    const walked = ev.party.filter((m) => m.lead).map((m) => m.who);
    a.leads = walked.length > 0;
    walked.forEach((p) => (p.harnessed = true));
    yield* wait(a, 0.8);
    house.door.open = true;
    onEnd(a, () => (house.door.open = false));
    yield* wait(a, 0.6);
    // Out in single file at the pace of the slowest, down the path and out of sight; and back in, the last
    // one stopping just inside the door.
    const pace = Math.min(...ev.party.map((m) => m.who.speed));
    const last = Math.max(...ev.party.map((m) => m.behind));
    function* file(from, to, dir) {
      ev.party.forEach((m) => {
        m.who.out = true;
        m.who.walking = true;
        m.who.face(dir > 0 ? 0 : Math.PI);
      });
      for (let s = 0; s <= Math.abs(to - from) + last; s += pace * clock.dt) {
        ev.party.forEach((m) => {
          const z = from - dir * m.behind + dir * s; // in line, each from its place in it
          [m.who.x, m.who.z, m.who.y] = [door.x, z, 0];
          m.who.rig.group.visible = z > door.outside; // out of sight behind the hedge
        });
        yield;
      }
      ev.party.forEach((m) => (m.who.walking = false));
    }
    // Umbrellas up on the step.
    const umbrellas = ev.party.map((m) => m.who).filter((w) => w.umbrella);
    umbrellas.forEach((w) => {
      w.props.only("umbrellaOpen");
      w.hold = HOLDS.umbrella;
      w.umbrella = "open";
    });
    yield* file(door.inside, door.outside, -1);
    house.door.open = false;
    yield* wait(a, rnd(14, 24));
    house.door.open = true;
    yield* wait(a, 0.6);
    // In from a wet street, with wet feet (and a dog in her raincoat wet on her legs and head); caught in
    // the rain without an umbrella or a raincoat (it came on while they were out), soaked through.
    if (home.weather.raining || home.weather.wet > 0.3)
      ev.party.forEach(({ who }) => {
        const covered = who.umbrella || who.raincoat || !home.weather.raining;
        who.wetFeet = who.human ? 7 : 10;
        who.wet = Math.max(who.wet, covered ? (who.human ? 0.1 : 0.5) : 0.7);
      });
    yield* file(door.outside, door.inside, 1);
    house.door.open = false;
    ev.party.forEach((m) => {
      m.who.out = false;
      m.who.harnessed = false;
      m.who.face(V);
    });
    a.leads = false;
    // Umbrellas down and the rain shaken off them; caught without one, the rain shaken off the hands.
    umbrellas.forEach((w) => {
      w.props.only("umbrella");
      w.umbrella = "rolled";
    });
    const shakers = ev.party.map((m) => m.who).filter((w) => w.human && (w.umbrella || w.wet > 0.3));
    shakers.forEach((w) => {
      w.hold = MOVES.shake;
      w.since = t();
    });
    if (shakers.length) yield* wait(a, 0.9);
    shakers.forEach((w) => (w.hold = null));
    ev.over = true;
    if (a.umbrella) yield* stowUmbrella(a);
    yield* putKeys(a);
    walked.forEach((p) => later(a, act("pet", petPet, p))); // well done
  }

  // The house keys off the counter and into a pocket, for whoever leads the walk; back on the counter after
  // (and back there, however the walk ends).
  function* takeKeys(a) {
    if (!house.keys.home) return;
    const { at, yaw, on } = spots.keys;
    yield* walk(a, at);
    yield* turn(a, yaw);
    a.look = on;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    house.keys.home = false;
    onEnd(a, () => (house.keys.home = true));
    a.props.only("keys");
    a.hold = HOLDS.carry;
    a.look = null;
    yield* wait(a, 0.5);
    a.props.only(); // in the pocket
    a.hold = null;
  }

  function* putKeys(a) {
    if (house.keys.home) return;
    const { at, yaw, on } = spots.keys;
    yield* walk(a, at);
    yield* turn(a, yaw);
    a.props.only("keys");
    a.hold = HOLDS.carry;
    yield* wait(a, 0.4);
    a.look = on;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.4);
    house.keys.home = true;
    a.props.only();
    a.hold = null;
    a.look = null;
  }

  // Their umbrella off the rack by the door (if it is there); put back however the walk ends.
  function* takeUmbrella(a) {
    if (!house.umbrellas.in(a.name) || !(yield* until(() => claim(a, "rack"), 8))) return;
    const { at, yaw } = spots.umbrellas;
    yield* walk(a, at);
    yield* turn(a, yaw);
    a.hold = HOLDS.reach; // up to the hook
    yield* wait(a, 0.5);
    house.umbrellas.take(a.name);
    a.props.only("umbrella");
    a.umbrella = "rolled";
    a.hold = null;
    release(a, "rack");
    onEnd(a, () => {
      if (!a.umbrella) return;
      house.umbrellas.put(a.name);
      a.umbrella = null;
      a.props.only();
    });
  }

  function* stowUmbrella(a) {
    yield* until(() => claim(a, "rack"), 8); // one at a time
    const { at, yaw } = spots.umbrellas;
    yield* walk(a, at);
    yield* turn(a, yaw);
    a.hold = HOLDS.reach; // up to the hook
    yield* wait(a, 0.5);
    house.umbrellas.put(a.name);
    a.props.only();
    a.umbrella = null;
    a.hold = null;
    yield* wait(a, 0.3);
    release(a, "rack");
  }

  function* walkAlong(a, ev, m) {
    yield* lineUp(a, ev, m);
    yield* until(() => ev.over, LONG_WAIT); // the host walks everyone
    a.walking = false;
    if (a.umbrella) yield* stowUmbrella(a);
    if (a.raincoat || (a.name === "collie" && a.wet > 0.3)) {
      a.shakeUntil = t() + 1.3; // nose to tail
      yield* wait(a, 1.4);
      a.raincoat = false;
    }
  }

  function* lineUp(a, ev, m) {
    const { door } = spots;
    if (home.weather.raining) {
      if (a.human) yield* takeUmbrella(a);
      else {
        a.raincoat = true;
        onEnd(a, () => (a.raincoat = false));
      }
    }
    yield* walk(a, [door.x, door.inside + m.behind]);
    a.face(Math.PI);
    if (!ev.over) ev.ready.add(a);
  }

  const LONG_WAIT = 240;

  /* ----- with the pets ----- */

  // Fetch, downstairs. She sees them go for the ball and perks up, bouncing; they pick it up and she comes
  // bounding over and bows, ready to play, eyes on the ball as they hold it up; now and then a pretend throw sends her dashing off, to stop and look back puzzled
  // while they laugh. She races after each throw, pounces on it, trots back proudly to drop it at their
  // feet and sits; they crouch for it, often with a pat for her. At the end the ball is hers to keep, and
  // off she goes to her bed with it.
  function* fetch(a) {
    const dog = byName.collie;
    const ball = home.ball;
    if (!dog || !ball.landed() || !claim(a, "ball")) return;
    const [near] = beside(a, ball.at, 9, 3);
    if (!near) return;
    const ev = event(a, "fetch", {
      thrown: 0,
      back: 0,
      ready: false,
      spot: null,
      side: 1,
      target: null,
      fake: null,
      dropped: false,
      patted: false,
      keep: false,
      kept: false,
    });
    if (!invite(dog, act("fetch", fetchDog, ev))) return;
    yield* walk(a, near);
    if (!ball.landed()) return;
    const hand = a.rig.hands[0];
    yield* pickUpBall(a, hand);
    onEnd(a, () => ball.held === hand && ball.drop());
    // Somewhere open nearby to play, with room beside it for her to wait.
    const [[x0, x1], [z0, z1]] = DOWNSTAIRS;
    const nearby = [
      [Math.max(x0, a.x - 60), Math.min(x1, a.x + 60)],
      [Math.max(z0, a.z - 40), Math.min(z1, a.z + 40)],
    ];
    const open = (p) => nav.free(...p) && ground(...p);
    const sides = (x, z) => [1, -1].filter((s) => open(toward([x, z], 28 * s, 2)));
    const roomy = (x, z) => ground(x, z) && sides(x, z).length > 0;
    const spot = freeSpot(a, nearby, 26, roomy) || freeSpot(a, DOWNSTAIRS, 26, roomy);
    if (!spot) return ball.drop();
    yield* walk(a, spot);
    ev.side = sides(...spot)[0]; // where she waits, beside them
    ev.spot = spot;
    a.face(V);
    a.look = dog;
    if (!(yield* until(() => ev.ready || ev.over, 15))) {
      ball.drop();
      return;
    }
    const throws = 2 + Math.floor(Math.random() * 2);
    let faked = false;
    for (let i = 0; i < throws && !ev.over; i++) {
      // "Ready?" The ball held up, her eyes on it.
      a.look = dog;
      a.hold = HOLDS.reach;
      a.happy = true;
      yield* wait(a, rnd(0.7, 1.1));
      a.happy = false;
      // Somewhere open on the floor, far enough to run for, nothing in the way.
      const target = nav.randomSpot(
        [a.x - 130, a.x + 130],
        [a.z - 70, a.z + 70],
        (x, z) => ground(x, z) && Math.hypot(x - a.x, z - a.z) > 50 && nav.clearLine(a.x, a.z, x, z)
      );
      if (!target) break;
      halfTowards(a, ...target, 0.3);
      a.look = null;
      if (!faked && Math.random() < 0.35) {
        // A pretend throw: the arm comes over, but the ball stays in the hand.
        faked = true;
        a.hold = HOLDS.throwBack;
        yield* wait(a, 0.45);
        a.hold = HOLDS.throwOut;
        ev.fake = target;
        yield* wait(a, 0.5);
        a.hold = HOLDS.reach; // still got it!
        a.face(V);
        a.look = dog;
        yield* until(() => !ev.fake || ev.over, 6);
        a.happy = true;
        a.pop();
        yield* wait(a, 1);
        a.happy = false;
        halfTowards(a, ...target, 0.3);
      }
      a.hold = HOLDS.throwBack;
      yield* wait(a, 0.45);
      a.hold = HOLDS.throwOut;
      ball.throwTo(target, t());
      ev.target = target;
      ev.thrown++;
      a.look = { facePoint: () => ball.position() }; // watching it fly, and her run for it
      yield* wait(a, 0.4);
      a.hold = null;
      if (!(yield* until(() => ev.dropped || ev.over, 15)) || ev.over) break;
      // Down at their feet: crouch for it, and maybe a pat for her.
      a.look = dog;
      if (Math.random() < 0.6) {
        a.lie = true;
        faceSide(a, Math.sign((dog.x - a.x) * R[0] + (dog.z - a.z) * R[1]) || 1, 0.5); // towards her
        yield* wait(a, 0.3);
        a.setState("stroke", 1.4);
        ev.patted = true;
        yield* wait(a, 1.4);
        a.setState("idle");
      }
      yield* pickUpBall(a, hand);
      ev.dropped = false;
      a.face(V);
      a.beHappy(1);
      ev.back = ev.thrown;
      yield* wait(a, 0.5);
    }
    if (ball.held === hand && !ev.over) {
      // Hand it over to keep.
      a.look = dog;
      a.hold = HOLDS.treat;
      ev.keep = true;
      yield* until(() => ev.kept || ev.over, 3);
    }
    if (ball.held === hand) ball.drop();
    a.hold = null;
    a.look = null;
  }

  // Crouch for the ball where it lies, and up with it in the hand.
  function* pickUpBall(a, hand) {
    const ball = home.ball;
    a.faceTowards(ball.at[0], ball.at[1]);
    a.lie = true;
    a.hold = HOLDS.pick;
    a.look = { facePoint: () => ball.position() };
    yield* wait(a, 0.5);
    ball.hold(hand);
    a.lie = false;
    a.hold = HOLDS.carry;
    a.look = null;
    yield* wait(a, 0.3);
  }

  function* fetchDog(a, ev) {
    const ball = home.ball;
    const human = ev.host;
    // Ears up, tail going: over towards the ball (off wherever she was lying, which is free for others now),
    // and a bounce or two while they get it.
    Object.assign(a, { happy: true, look: human });
    const [near] = beside(a, ball.at, 24, 10);
    if (near) yield* walk(a, near, 1.4);
    let bounceAt = t() + rnd(0.3, 0.8);
    const end = t() + 25;
    while (!ev.spot && !ev.over && t() < end) {
      if (t() > bounceAt) {
        a.hop();
        bounceAt = t() + rnd(0.8, 1.6);
      }
      yield;
    }
    if (!ev.spot) return;
    const open = (p) => nav.free(...p) && ground(...p);
    const waitAt = () => toward(ev.spot, 28 * ev.side, 2); // clear (fetch makes sure)
    const byThem = () =>
      [toward([human.x, human.z], 25 * ev.side, 2), toward([human.x, human.z], -25 * ev.side, 2), toward([human.x, human.z], 0, 22)].find(open) || [
        a.x,
        a.z,
      ];
    const watchBall = { facePoint: () => ball.position() };
    yield* walk(a, waitAt(), 1.8); // bounding over
    if (ev.over) return;
    // Ready: a play bow, eyes on the ball, a bounce now and then.
    const ready = () => {
      halfTowards(a, human.x, human.z, 0.65);
      Object.assign(a, { sit: false, bow: true, happy: true, look: watchBall });
    };
    ready();
    ev.ready = true;
    bounceAt = t() + rnd(0.6, 1.4);
    while (!ev.over) {
      if (ev.keep) {
        // Take the ball from them, and off to her bed with it.
        a.bow = false;
        yield* walk(a, byThem());
        a.faceTowards(human.x, human.z);
        yield* wait(a, 0.3);
        ball.hold(a.rig.mouth);
        ev.kept = true;
        onEnd(a, () => ball.held === a.rig.mouth && ball.drop());
        a.hop();
        yield* walk(a, [spots.ballHome[0] - 18, spots.ballHome[1] + 8], 1.3);
        a.faceTowards(...spots.ballHome);
        a.nod = 0.6;
        yield* wait(a, 0.3);
        ball.rollTo(spots.ballHome, t());
        a.nod = 0;
        return;
      }
      if (ev.fake) {
        // Off she goes, then stops: no ball? A look back at them, head on one side.
        a.bow = false;
        const [tx, tz] = ev.fake;
        const d = Math.hypot(tx - a.x, tz - a.z) || 1;
        const dash = [a.x + ((tx - a.x) / d) * 20, a.z + ((tz - a.z) / d) * 20];
        if (nav.clearLine(a.x, a.z, ...dash) && ground(...dash)) yield* walk(a, dash, 2.4);
        a.faceTowards(human.x, human.z);
        a.look = human;
        a.pop("room-pop room-pop-question");
        yield* wait(a, 1);
        ev.fake = null;
        yield* walk(a, waitAt(), 1.6);
        ready();
      }
      if (ev.thrown > ev.back && !ev.dropped) {
        // After it, flat out, to just short of where it lands (on the open line it was thrown along); a pounce,
        // and it is in her mouth.
        a.bow = false;
        a.look = watchBall;
        const [tx, tz] = ev.target;
        const d = Math.hypot(tx - ev.spot[0], tz - ev.spot[1]) || 1;
        yield* walk(a, [tx + ((ev.spot[0] - tx) / d) * 16, tz + ((ev.spot[1] - tz) / d) * 16], 2.4);
        yield* until(() => ball.landed() || ev.over, 3);
        a.faceTowards(ball.at[0], ball.at[1]);
        a.hop();
        a.nod = 0.7;
        yield* wait(a, 0.4);
        ball.hold(a.rig.mouth);
        onEnd(a, () => ball.held === a.rig.mouth && ball.drop());
        a.nod = 0;
        // Back with it, head up and tail going, to drop it at their feet, and sit, looking up.
        a.look = human;
        yield* walk(a, byThem(), 1.4);
        a.faceTowards(human.x, human.z);
        a.nod = 0.5;
        yield* wait(a, 0.3);
        ball.rollTo(toward([human.x, human.z], 9 * ev.side, 5), t());
        a.nod = 0;
        ev.dropped = true;
        halfTowards(a, human.x, human.z, 0.6);
        a.sit = true;
        let thanked = false;
        while (ev.back < ev.thrown && !ev.over) {
          if (ev.patted && !thanked) {
            thanked = true;
            a.pop();
            a.hop();
          }
          yield;
        }
        ev.patted = false;
        a.sit = false;
        yield* walk(a, waitAt());
        ready();
      }
      if (t() > bounceAt) {
        a.hop();
        bounceAt = t() + rnd(1, 2.4);
      }
      yield;
    }
  }

  return { outing, fetch };
}
