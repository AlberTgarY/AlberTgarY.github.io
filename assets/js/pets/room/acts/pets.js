/*******************************************************************************
 * The pets: being petted, getting hungry and being fed, and the cat's mess
 * found; and their own days, the collie's and the cat's.
 ******************************************************************************/

import { rnd, pick } from "../../stage.js";
import { HOLDS } from "../props.js";
import { V, PET_AGAIN, DOWNSTAIRS } from "./common.js";

const NAP_BELOW = 0.25; // how often the dog's lie-down on the rug, or the cat's nap, is down in the basement
const LOUNGE_BELOW = [
  [20, 140],
  [30, 104],
]; // the basement's lounge, x and z (house/basement.js): the daybed, the tea table, the rugs

// `c` is everything they share (common.js), and the activities of the other files.
export function petsActs(c) {
  const {
    home,
    house,
    nav,
    byName,
    humans,
    spots,
    floorY,
    walk,
    turn,
    wait,
    until,
    hop,
    glide,
    sitOn,
    getUp,
    claim,
    holder,
    act,
    event,
    available,
    invite,
    later,
    onEnd,
    t,
    LIVING,
    level,
    ground,
    toward,
    takeSeat,
    bowlSide,
    offPlaces,
    freeSpot,
    freeSpotBelow,
    linger,
    dozeChance,
    beside,
    halfTowards,
    faceSide,
  } = c;
  const toBin = (...args) => c.toBin(...args); // kitchen.js

  // Stroke a pet standing beside it; it waits for the hand, then melts.
  function* petPet(a, p) {
    if (!p || !available(p) || p.above() > 0.5) return;
    const ev = event(a, "pet", { stroking: false, done: false });
    if (!invite(p, act("petted", bePetted, ev))) return;
    const [spot, side] = beside(a, p.walking && p.goal ? p.goal : [p.x, p.z], 15); // where it is going to be
    if (!spot) return;
    yield* walk(a, spot);
    if (!(yield* until(() => p.state === "wait" || ev.over, 6)) || ev.over) return;
    faceSide(a, -side); // towards it, still showing the face
    a.setState("stroke", 4);
    ev.stroking = true;
    yield* wait(a, 4);
    a.setState("idle");
    ev.done = true;
    a.beHappy(1);
  }

  function* bePetted(a, ev) {
    a.setState("wait");
    a.look = ev.host;
    if (!(yield* until(() => ev.stroking || ev.over, 12))) return;
    halfTowards(a, ev.host.x, ev.host.z, 0.3);
    a.setState("petted", 4);
    let heartAt = t() + 0.6;
    while (!ev.done && !ev.over && t() < a.until + 2) {
      if (t() > heartAt) {
        a.pop();
        heartAt = t() + 1.4;
      }
      yield;
    }
  }

  // A pet comes to wait behind its bowl with a bubble over its head (the director sends someone); once
  // served, it eats.
  function* hungry(a) {
    yield* walk(a, bowlSide(a));
    yield* turn(a, V);
    a.hungry = true;
    a.show("want", `pet-want pet-want-${a.name}`);
    const fed = yield* until(() => {
      a.look = a.feeder || null;
      return a.served;
    }, 120);
    a.hungry = false;
    a.show("want", null);
    a.look = null;
    if (!fed) return;
    const bowlMesh = house.bowls[a.name];
    bowlMesh.visible = false; // its own bowl, filled, stands there instead
    onEnd(a, () => (bowlMesh.visible = true));
    a.setState("eat", 7);
    let heartAt = t() + 2;
    while (t() < a.until) {
      if (t() > heartAt) {
        a.pop();
        heartAt = t() + 1.4;
      }
      yield;
    }
  }

  // Feed a hungry pet: the bag from the cupboard under the counter, then kneel by the bowl and pour; maybe a
  // stroke after.
  function* feed(a, p) {
    if (p.feeder !== a) return;
    a.petAgainAt = t() + rnd(...PET_AGAIN);
    onEnd(a, () => p.feeder === a && (p.feeder = null));
    if (a.seated) yield* getUp(a); // dropped what they were doing on a seat
    yield* walk(a, spots.foodBag.at);
    yield* turn(a, spots.foodBag.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    a.props.only("bag");
    a.hold = HOLDS.carry;
    if (!p.hungry) return;
    // Kneel close beside the pet, on its side away from the other pet's bowl (so no bowl is between them),
    // or on the other side if that is blocked.
    const otherBowl = Object.entries(spots.bowls).find(([name]) => name !== p.name)[1].bowl;
    const at = (s) => toward([p.x, p.z], s * (p.name === "collie" ? 18 : 15), 2);
    const away = (s) => Math.hypot(at(s)[0] - otherBowl[0], at(s)[1] - otherBowl[1]);
    const sides = [-1, 1].sort((s1, s2) => away(s2) - away(s1));
    const side = sides.find((s) => nav.free(...at(s))) ?? sides[0];
    yield* walk(a, at(side));
    if (!p.hungry) return;
    a.props.only();
    a.hold = null;
    faceSide(a, -side, 0.75);
    a.setState("feed", 0.8);
    yield* wait(a, 0.8);
    p.served = true;
    a.setState("serve");
    yield* until(() => p.state === "eat", 2);
    yield* until(() => p.state !== "eat", 10);
    a.setState("idle");
    if (Math.random() < 0.5) later(a, act("pet", petPet, p));
  }

  // Found the cat's mess: cross or dizzy at it, then it is tidied away.
  function* scold(a, cat) {
    if (cat.foundBy !== a || !cat.messy) return;
    const [spot, side] = beside(a, [cat.x, cat.z], 22, 6);
    if (spot) yield* walk(a, spot);
    if (!cat.messy) return;
    faceSide(a, -side);
    const mood = Math.random() < 0.5 ? "angry" : "dizzy";
    cat.partner = a;
    a.setState("react", 3.5, mood);
    a.show("mood", `pet-mood pet-mood-${mood}`);
    yield* wait(a, 3.5);
    a.show("mood", null);
    a.setState("idle");
    // Picked up, and into the bin.
    a.look = cat;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    cat.tidied = true;
    a.look = null;
    yield* toBin(a, "mess");
  }

  // Snuggle up near someone: at their feet if they are in bed; on the sofa seat beside them, or else on the
  // rug in front.
  function* snuggle(a, host) {
    if (host.abed) {
      const { at, on } = spots.bedFoot;
      if (!claim(a, "bedFoot")) return;
      yield* walk(a, at);
      if (!host.abed) return;
      a.ground = at;
      yield* hop(a, on);
      a.face(V);
      a.lie = true;
      yield* linger(a, rnd(40, 80), { dozeAt: t() + 2, stop: () => !host.abed });
      return yield* getUp(a);
    }
    const i = host.seatKey && host.seatKey.startsWith("sofa") ? +host.seatKey.slice(4) : -1;
    const near = (a.name === "collie" ? [i + 1, i - 1] : [i - 1, i + 1]) // the collie likes the roomier right
      .filter((j) => i >= 0 && j >= 0 && j <= 2)
      .map((j) => `sofa${j}`);
    const stillThere = () => host.seated && host.job !== null;
    const seat = takeSeat(a, near);
    if (seat) yield* sitOn(a, seat);
    else if (!(yield* toRug(a))) return;
    a.look = host;
    yield* linger(a, rnd(25, 45), { dozeAt: dozeChance(0.4, 0.7), stop: () => !stillThere(), each: () => (a.look = a.asleep ? null : host) });
    a.look = null;
    if (a.seatKey) yield* getUp(a);
    a.lie = false;
  }

  function* toRug(a) {
    const clear = ([x, z]) => home.actors.every((o) => o === a || o.out || Math.hypot(o.x - x, o.z - z) > 10);
    const free = [0, 1, 2, 3].filter((k) => !holder(`rug${k}`) && clear(spots.rug[k])); // nobody standing there
    if (!free.length) return false;
    const k = pick(free);
    claim(a, `rug${k}`);
    yield* walk(a, spots.rug[k]);
    a.face(V + rnd(-0.6, 0.6));
    a.lie = true;
    return true;
  }

  // Lie on the rug for a while, maybe nodding off; now and then down in the basement instead.
  function* rug(a) {
    if (Math.random() < NAP_BELOW) return yield* napBelow(a);
    if (!(yield* toRug(a))) return;
    yield* linger(a, rnd(8, 16), { dozeAt: dozeChance(0.3, 0.6) });
    a.lie = false;
  }

  // The collie naps in her bed.
  function* bed(a) {
    if (!claim(a, "dogBed")) return;
    yield* curlUpInBed(a);
  }

  function* curlUpInBed(a) {
    yield* walk(a, spots.dogBed.at);
    a.ground = spots.dogBed.at;
    yield* hop(a, spots.dogBed.bed);
    a.face(V - 0.25);
    a.lie = true;
    yield* wait(a, 1.5, true);
    a.asleep = !a.interrupt;
    yield* linger(a, rnd(16, 32), { stop: () => !a.asleep });
    yield* wait(a, 0.5);
    yield* getUp(a);
  }

  // A burst of the zoomies: dashing about the living room, then flopping down, panting.
  function* zoomies(a) {
    a.happy = true;
    for (let k = 0; k < 4; k++) {
      const spot = freeSpot(a, DOWNSTAIRS, 20, ground);
      if (spot) yield* walk(a, spot, 2.4);
    }
    a.lie = true;
    yield* wait(a, 4);
    a.lie = false;
  }

  // Visit one of them (not someone busy with a pet): snuggle up if they are on the sofa or in bed, else sit
  // by them looking up, hoping for a stroke.
  const visitable = (h) => !h.out && !h.walking && !["feed", "scold", "fetch"].includes(h.jobName);

  function* visit(a) {
    const h = pick(humans.filter(visitable));
    if (!h) return;
    if (h.abed || (h.seated && h.seatKey?.startsWith("sofa"))) return yield* snuggle(a, h);
    if (h.seated || h.above() > 0.5) return;
    const [fx, fz] = toward([h.x, h.z], 0, 16);
    const spot = freeSpot(
      a,
      [
        [fx - 22, fx + 22],
        [fz - 10, fz + 10],
      ],
      14,
      level(floorY(h.x, h.z))
    );
    if (!spot) return;
    const [hx, hz] = [h.x, h.z];
    yield* walk(a, spot);
    if (Math.hypot(h.x - hx, h.z - hz) > 12) return; // they have gone off somewhere
    halfTowards(a, h.x, h.z, 0.5);
    a.sit = true;
    a.look = h;
    a.happy = a.name === "collie";
    yield* wait(a, 1.5);
    if (Math.random() < 0.5 && available(h)) invite(h, act("pet", petPet, a));
    yield* linger(a, rnd(5, 9));
  }

  // The collie sniffs the cat, who purrs, or bats her on the nose.
  function* sniff(a) {
    const cat = byName.cat;
    if (!cat || !available(cat) || cat.above() > 0.5) return;
    const ev = event(a, "sniff", { reaction: null });
    if (!invite(cat, act("sniffed", sniffed, ev))) return;
    const [spot, side] = beside(a, [cat.x, cat.z], 26, 2);
    if (!spot) return;
    yield* walk(a, spot);
    if (ev.over) return;
    a.faceTowards(cat.x, cat.z);
    a.look = cat;
    a.nod = 0.5;
    yield* wait(a, 1.6);
    a.nod = 0;
    ev.reaction = Math.random() < 0.5 ? "purr" : "swat";
    if (ev.reaction === "swat") {
      yield* wait(a, 0.3);
      a.cowed = true;
      a.hop();
      const back = toward([a.x, a.z], 8 * side, 0);
      if (nav.free(...back) && level(a.y)(...back)) yield* glide(a, back, 0.3); // jumping back
      yield* wait(a, 1.3);
    } else {
      a.happy = true;
      yield* wait(a, 2);
    }
  }

  function* sniffed(a, ev) {
    a.look = ev.host;
    if (!(yield* until(() => ev.reaction || ev.over, 12))) return;
    halfTowards(a, ev.host.x, ev.host.z, 0.3);
    if (ev.reaction === "swat") a.setState("trick", 0.9, "swat");
    else a.setState("petted", 2);
    yield* wait(a, ev.reaction === "swat" ? 0.9 : 2);
  }

  // A nap down in the basement, on the floor of its lounge (the warm oak boards by the daybed and the tea
  // table): lain down there, dozing off soon.
  function* napBelow(a) {
    const spot = freeSpotBelow(a, LOUNGE_BELOW, 18);
    if (!spot) return;
    yield* walk(a, spot);
    a.face(V + rnd(-0.6, 0.6));
    a.lie = true;
    yield* linger(a, rnd(20, 40), { dozeAt: t() + rnd(2, 5) });
    a.lie = false;
  }

  // The cat naps: on her tree, a free seat, the dog's bed, or the rug; now and then down in the basement.
  function* catNap(a) {
    if (Math.random() < NAP_BELOW) return yield* napBelow(a);
    const r = Math.random();
    if (r < 0.35 && !holder("tree")) return yield* climb(a, true);
    if (r < 0.6) {
      const seat = takeSeat(
        a,
        [...LIVING].sort(() => Math.random() - 0.5)
      );
      if (seat) {
        yield* sitOn(a, seat);
        yield* linger(a, rnd(20, 40), { dozeAt: t() + 1 });
        return yield* getUp(a);
      }
    }
    if (r < 0.75 && claim(a, "dogBed")) return yield* curlUpInBed(a);
    if (!(yield* toRug(a))) return;
    yield* linger(a, rnd(20, 40), { dozeAt: t() + 1 });
    a.lie = false;
  }

  // Up her tree, platform by platform, for a look round or a nap at the top, and down again.
  function* climb(a, sleepy = Math.random() < 0.4) {
    if (!claim(a, "tree")) return;
    const { at, hops } = spots.tree;
    yield* walk(a, at);
    a.ground = at;
    for (const p of hops) {
      yield* hop(a, p);
      yield* wait(a, 0.25);
    }
    a.face(V - 0.3);
    if (sleepy) a.lie = true;
    else a.sit = true;
    yield* linger(a, rnd(15, 28), { dozeAt: sleepy ? t() + 1.5 : Infinity });
    a.lie = a.sit = false;
    for (const p of [hops[1], hops[0], [at[0], 0, at[1]]]) {
      yield* hop(a, p);
      yield* wait(a, 0.2);
    }
    a.ground = null;
  }

  // The wiggle before a pounce: crouched low, eyes on the spot, the rump swaying side to side.
  function* wiggle(a, target, secs) {
    a.look = target;
    a.bow = true;
    const yaw = Math.atan2(target[0] - a.x, target[2] - a.z);
    const t0 = t();
    while (t() - t0 < secs) {
      a.face(yaw + 0.14 * Math.sin((t() - t0) * 22));
      yield;
    }
    a.face(yaw);
    a.bow = false;
  }

  // Up on the window sill over the bed (by way of the bed), watching the sky and any bird going by. Either
  // a hop up and a hop on; or, with nobody in the bed, as a game: the wiggle and a pounce onto the end of
  // it, a bounce or two on the quilt for the fun of it, a bound on up it, the wiggle again with her eyes
  // on the sill, and the leap, landing pleased with herself.
  function* perch(a) {
    if (!claim(a, "sill") || !claim(a, "bedFoot")) return;
    const { at, bed: onBed, on, yaw } = spots.sill;
    yield* walk(a, at);
    a.ground = at;
    const bedFree = humans.every((h) => !h.seatKey?.startsWith("bed"));
    if (bedFree && Math.random() < 0.5) {
      const end = [onBed[0], onBed[1], onBed[2] + 6];
      yield* wiggle(a, end, rnd(0.8, 1.3));
      yield* hop(a, end);
      a.happy = true;
      for (let k = 0; k < 2; k++) {
        a.hop();
        yield* wait(a, 0.55);
      }
      yield* hop(a, onBed);
      yield* wiggle(a, on, rnd(0.9, 1.4));
      yield* hop(a, on);
      a.face(yaw);
      a.sit = true;
      yield* wait(a, 1.2);
      a.happy = false;
    } else {
      yield* hop(a, onBed);
      yield* wait(a, 0.2);
      yield* hop(a, on);
      a.face(yaw);
      a.sit = true;
    }
    yield* linger(a, rnd(15, 30), {
      dozeAt: dozeChance(0.2, 0.5),
      each() {
        const bird = house.bird.visible;
        a.look = a.asleep ? null : bird ? house.bird.position.toArray() : spots.window;
        a.happy = bird && !a.asleep;
        a.lie = a.asleep;
        a.sit = !a.asleep;
      },
    });
    a.happy = a.lie = a.sit = false;
    a.look = null;
    yield* hop(a, onBed);
    yield* wait(a, 0.2);
    yield* getUp(a);
  }

  // Up onto his computer, warm beside the desk, while he plays, lying there to watch (and maybe doze off).
  function* tower(a) {
    const ev = byName.boy?.event;
    if (!ev || ev.kind !== "pc" || ev.over || !claim(a, "tower")) return;
    const { at, on, yaw } = spots.tower;
    yield* walk(a, at);
    if (ev.over) return;
    a.ground = at;
    yield* hop(a, on);
    a.face(yaw);
    a.lie = true;
    yield* linger(a, rnd(15, 30), {
      dozeAt: dozeChance(0.3, 0.5),
      stop: () => ev.over,
      each: () => (a.look = a.asleep ? null : spots.monitor),
    });
    a.look = null;
    yield* getUp(a);
  }

  // Sitting up to lick a paw.
  function* groom(a) {
    a.sit = true;
    a.setState("trick", rnd(4, 6), "groom");
    yield* wait(a, a.until - t());
    a.setState("idle");
    yield* linger(a, rnd(1, 2));
  }

  // Curl up beside the collie while she sleeps on the floor.
  function* cuddle(a) {
    const dog = byName.collie;
    if (!dog || !dog.asleep || dog.above() > 0.5) return;
    const side = Math.random() < 0.5 ? 1 : -1;
    const same = level(dog.y);
    const spot = [side, -side].map((s) => toward([dog.x, dog.z], 22 * s, 3)).find((p) => nav.free(...p) && same(...p));
    if (!spot) return;
    yield* walk(a, spot);
    halfTowards(a, dog.x, dog.z, 0.5);
    a.lie = true;
    yield* linger(a, rnd(20, 40), { dozeAt: t() + 1.5, stop: () => !dog.asleep });
    a.lie = false;
  }

  // The collie stretches out on the grass between the beds in the sun, and dozes.
  function* sunbathe(a) {
    if (!claim(a, "sunny")) return;
    yield* walk(a, spots.sunny);
    a.face(V + rnd(-0.5, 0.5));
    a.lie = true;
    yield* linger(a, rnd(20, 40), { dozeAt: t() + rnd(4, 10), stop: () => home.night });
    a.lie = false;
  }

  // The cat goes after the butterfly over the garden: creeping up under it, a wiggle, a pounce, and again;
  // then she sits and watches it go.
  function* chase(a) {
    if (!claim(a, "butterfly")) return;
    const g = house.garden;
    const yardNav = home.yardNav;
    // On the grass by the beds (not among them), clear of everyone (not on top of the dog sunbathing).
    const clear = (x, z) =>
      g.contains(x, z) && !g.offPath([x, z]) && offPlaces(x, z) && home.actors.every((o) => o === a || Math.hypot(o.x - x, o.z - z) > 18);
    const lawn = (x, z) =>
      g.contains(x, z) && !g.bedAt(x, z) && offPlaces(x, z) && home.actors.every((o) => o === a || Math.hypot(o.x - x, o.z - z) > 18);
    a.look = { facePoint: () => g.butterflyAt().toArray() };
    for (let k = 0; k < 3 && !home.night; k++) {
      const { x, z } = g.butterflyAt();
      const spot = yardNav.randomSpot([x - 12, x + 12], [z - 12, z + 12], lawn) || yardNav.randomSpot([x - 30, x + 30], [z - 30, z + 30], clear);
      if (!spot) break;
      yield* walk(a, spot, 1.4);
      a.sit = true;
      yield* wait(a, rnd(0.8, 1.6)); // eyes on it, the tail going
      a.sit = false;
      a.hop(); // pounce!
      yield* wait(a, 0.6);
    }
    a.sit = true;
    a.happy = true;
    yield* linger(a, rnd(2, 4));
  }

  // Nobody about: a toilet roll unrolled or a ball of yarn tangled, somewhere open; then she waits, pleased
  // with herself, to be found out (scold).
  function* mischief(a) {
    const spot = freeSpot(a, DOWNSTAIRS, 30, ground);
    if (spot) yield* walk(a, spot);
    yield* turn(a, V);
    const mess = pick(["paper", "yarn"]);
    a.setState("mischief", 5, mess);
    yield* wait(a, 5);
    a.setState("messy", 0, mess);
    a.messy = true;
    yield* until(() => a.tidied, 150);
    a.foundBy = null;
  }

  // The dog sits by whoever is getting food, looking up, and gets a treat if she is lucky.
  function* beg(a, ev) {
    yield* walk(a, ev.spot);
    if (ev.over) return;
    halfTowards(a, ev.host.x, ev.host.z, 0.2);
    a.sit = true;
    a.look = ev.host;
    a.happy = true;
    a.setState("beg");
    yield* until(() => ev.treat || ev.over, 30);
    if (ev.treat) {
      a.hop();
      a.pop();
      yield* wait(a, 0.8);
    }
  }

  return {
    petPet,
    hungry,
    feed,
    scold,
    snuggle,
    rug,
    bed,
    zoomies,
    visitable,
    visit,
    sniff,
    catNap,
    climb,
    perch,
    tower,
    groom,
    cuddle,
    sunbathe,
    chase,
    mischief,
    beg,
  };
}
