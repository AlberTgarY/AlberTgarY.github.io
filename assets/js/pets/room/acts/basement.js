/*******************************************************************************
 * Down in the basement (house/basement.js), down the stairs from beside the
 * living room (walk() takes them down and back up: steps.js).
 *
 * The bathroom: teeth brushed at their own basin (hers the pink cup, his the
 * blue), the tap run and the mouth wiped on the hand towel; the loo behind its
 * curtain (seen only through a mosaic), the flush and the hands washed after;
 * a long soak in the round bath, the water tried with a hand and a bubble bath
 * poured in, in over the deck and the curtain drawn (and the mosaic), the
 * rubber duck bobbing by and a song, then out and dried with the big towel; the
 * fish fed, and the cat on
 * her pouf by the tank, watching them.
 *
 * The gym: a run on the treadmill (warming up at a walk, then running, sweat
 * and a slow-down), the rowing machine stroke by stroke (the legs driving),
 * curls and presses with the dumbbells from the rack, the spin bike (the feet
 * round with the pedals), the lat pulldown rep by rep, the punching bag,
 * stretches on the mat; after a session a drink of water and the brow wiped. Now and then the
 * other comes down to train beside them, and the dog to watch.
 ******************************************************************************/

import { rnd, pick } from "../../stage.js";
import { HOLDS, MOVES } from "../props.js";
import { V } from "./common.js";

const CHAIR = 10; // how far over the floor a person's seat is, sitting (as on the dining chairs)
const [DOG_COMES, DOG_JOINS] = [0.6, 20]; // how often the dog goes down with her to the gym; how long she may take to come (s)
const MUG_LOW = [-0.25, -1.15, 0.15, 0, 0]; // (the right hand, holding the brush low in front)

// Arms for what they do down here: [right, left], as props.js's MOVES (each in time `t`, `e` since it began).
const ARMS = {
  // A toothbrush in the right hand, scrubbing to and fro at the mouth.
  brush: (t) => [[-1.55, -1.5, 0.34 + 0.08 * Math.sin(t * 19), 0, 0.2 * Math.sin(t * 19)], null],
  // The brush held under the tap, turned to and fro in the water; shaken off over the basin.
  wet: (t) => [[-1.0 + 0.08 * Math.sin(t * 9), -0.5, 0.25, 0, 0.35 * Math.sin(t * 9)], null],
  flick: (t) => [[-0.95, -0.8 + 0.4 * Math.sin(t * 22), 0.25, 0, 0], null],
  // The tooth mug in the left hand (the brush held low in the right): reached down for (or put back), held
  // under the tap, up at the mouth, swirled under the tap (rinsed), tipped out.
  mugDown: () => [MUG_LOW, [-0.95, -0.25, -0.15, 0, 0]],
  mugFill: () => [MUG_LOW, [-1.0, -0.5, -0.25, 0, 0]],
  mugSip: (t, e) => [MUG_LOW, [-1.35 - 0.3 * Math.min(1, e), -1.9, -0.5, 0, 0]],
  mugSwirl: (t) => [MUG_LOW, [-1.0 + 0.1 * Math.sin(t * 8), -0.5, -0.25 - 0.08 * Math.cos(t * 8), 0, 0.4 * Math.sin(t * 8)]],
  mugTip: (t, e) => [MUG_LOW, [-1.0, -0.5, -0.25, 0, -1.3 * Math.min(1, e * 3)]],
  // Water splashed up onto the face with both hands.
  splash: (t) => [
    [-1.25 - 0.25 * Math.max(0, Math.sin(t * 5)), -1.75, 0.42, 0, 0],
    [-1.25 - 0.25 * Math.max(0, Math.sin(t * 5)), -1.75, -0.42, 0, 0],
  ],
  // Rubbing the head dry with a big towel, both hands.
  towel: (t) => [
    [-2.65, -1.55 + 0.3 * Math.sin(t * 9), 0.55, 0, 0],
    [-2.65, -1.55 + 0.3 * Math.sin(t * 9 + 1.6), -0.55, 0, 0],
  ],
  // Flakes pinched over the water.
  flakes: (t) => [[-1.7, -0.5, 0.2, 0, 0.35 * Math.sin(t * 14)], null],
  // Running: elbows bent, swinging, one forward as the other goes back.
  run: (t) => [
    [-0.25 - 0.65 * Math.sin(t * 9.5), -1.45, 0.12, 0, 0],
    [-0.25 + 0.65 * Math.sin(t * 9.5), -1.45, -0.12, 0, 0],
  ],
  // Curls, one arm then the other, and overhead presses with both.
  curl: (t) => [
    [-0.25, -0.25 - 1.75 * Math.max(0, Math.sin(t * 2.6)), 0.18, 0, 0],
    [-0.25, -0.25 - 1.75 * Math.max(0, -Math.sin(t * 2.6)), -0.18, 0, 0],
  ],
  press: (t) => {
    const up = 0.5 - 0.5 * Math.cos(t * 2.4);
    return [
      [-1.6 - 1.2 * up, -1.6 + 1.4 * up, 0.75 - 0.5 * up, 0, 0],
      [-1.6 - 1.2 * up, -1.6 + 1.4 * up, -0.75 + 0.5 * up, 0, 0],
    ];
  },
  // Jabs at the bag, left and right.
  jab: (t) => {
    const r = Math.max(0, Math.sin(t * 6.5));
    const l = Math.max(0, -Math.sin(t * 6.5));
    return [
      [-1.5, -1.6 + 1.45 * r, 0.3 - 0.15 * r, 0, 0],
      [-1.5, -1.6 + 1.45 * l, -0.3 + 0.15 * l, 0, 0],
    ];
  },
  // On the handlebars, a little bounce with the pedalling.
  bars: (t) => [
    [-1.25, -0.35 + 0.05 * Math.sin(t * 9), 0.22, 0, 0],
    [-1.25, -0.35 + 0.05 * Math.sin(t * 9 + Math.PI), -0.22, 0, 0],
  ],
  // The hand shower held out low over a pet, played to and fro along it.
  spray: (t) => [[-1.25, -0.5, 0.3 + 0.12 * Math.sin(t * 4), 0, 0.25 * Math.sin(t * 6)], null],
  // Both hands working suds (or a towel) into a pet's coat, low down.
  scrub: (t) => [
    [-1.05, -1.25 + 0.35 * Math.sin(t * 11), 0.5, 0, 0],
    [-1.05, -1.25 + 0.35 * Math.sin(t * 11 + 1.7), -0.5, 0, 0],
  ],
  // A drink from a bottle.
  drink: (t, e) => [[-1.35 - 0.35 * Math.min(1, e), -1.9, 0.5, 0, 0], null],
};

// `c` is everything they share (common.js), and the activities of the other files.
export function basementActs(c) {
  const {
    home,
    clock,
    house,
    byName,
    walk,
    stepTo,
    turn,
    wait,
    until,
    hop,
    claim,
    holder,
    release,
    onEnd,
    t,
    other,
    invite,
    act,
    event,
    later,
    available,
    linger,
  } = c;
  const B = house.basement;
  const S = B.spots;
  const below = house.below;
  const floor = () => house.floorY(0, 0, true);
  const mine = (a) => (a.name === "girl" ? 0 : 1); // her basin and towel, or his
  const go = (a, p, pace) => walk(a, below(p), pace);

  // A move of ARMS from now.
  const move = (a, arms) => {
    a.hold = arms;
    a.since = t();
  };
  // Moved smoothly to [x, z] at height y over `secs`, easing in and out, lifted `lift` on the way: settling
  // onto a seat or getting up off it, over the rim of the bath, up onto a machine.
  function* settle(a, [x, z], y, secs, lift = 0) {
    const [x0, y0, z0, t0] = [a.x, a.y, a.z, t()];
    for (let k = 0; k < 1; ) {
      k = Math.min(1, (t() - t0) / secs);
      const e = k * k * (3 - 2 * k);
      a.x = x0 + (x - x0) * e;
      a.z = z0 + (z - z0) * e;
      a.y = y0 + (y - y0) * e + lift * Math.sin(Math.PI * k);
      yield;
    }
  }
  // Sat down on a seat {x, z, yaw, y} from `front`, facing its way; up and back off it.
  function* sitDown(a, front, seat) {
    yield* go(a, front);
    a.ground = below(front);
    yield* turn(a, seat.yaw);
    a.seated = true;
    yield* settle(a, [seat.x, seat.z], Math.max(floor(), seat.y - CHAIR), 0.6);
  }
  function* standUp(a) {
    a.seated = false;
    yield* settle(a, a.ground, floor(), 0.5);
    a.ground = null;
  }
  const happyPop = (a, kind = "room-pop room-pop-note") => {
    a.pop(kind);
    a.beHappy(1.5);
  };

  /* ----- the bathroom ----- */

  // Teeth: at their own basin, the brush taken out of their mug and wetted under the tap, a good long scrub
  // (turned half round to the room, so it is seen); back to the basin, the brush rinsed and shaken off, the
  // mug filled, a mouthful swished (half round again) and spat out over the basin, the mug
  // rinsed and tipped out, the brush back in it and the mug back in its place; the tap off, the mouth patted
  // dry on the hand towel, and a smile in the mirror.
  function* teeth(a) {
    const i = mine(a);
    const sp = S.vanity[i];
    const { mug, stick } = B.cups[i];
    if (!claim(a, `vanity${i}`)) return;
    const tap = (on) => (B.sinks.running[i] = on);
    onEnd(a, () => {
      tap(false);
      mug.visible = stick.visible = true;
      a.props.only();
      Object.assign(a, { lean: 0, nod: 0 });
    });
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = sp.cup;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    stick.visible = false;
    a.props.only("toothbrush");
    tap(true);
    a.look = sp.basin;
    move(a, ARMS.wet);
    yield* wait(a, 0.9);
    tap(false);
    a.look = null;
    move(a, ARMS.brush);
    yield* turn(a, V);
    yield* wait(a, rnd(5, 8));
    yield* turn(a, sp.yaw);
    tap(true);
    a.look = sp.basin;
    move(a, ARMS.wet);
    yield* wait(a, 1.2);
    move(a, ARMS.flick);
    yield* wait(a, 0.5);
    a.look = sp.cup;
    move(a, ARMS.mugDown);
    yield* wait(a, 0.5);
    mug.visible = false;
    a.props.only("toothbrush", "toothMug");
    a.look = sp.basin;
    move(a, ARMS.mugFill);
    yield* wait(a, 0.8);
    tap(false);
    a.look = null;
    move(a, ARMS.mugSip);
    yield* turn(a, V);
    yield* wait(a, 0.4);
    a.nod = 0.15; // (swished round)
    yield* wait(a, 0.9);
    a.nod = 0;
    yield* turn(a, sp.yaw);
    // Bent over the basin to spit; the mug rinsed under the tap and tipped out.
    a.lean = 0.25;
    a.nod = 0.3;
    move(a, ARMS.mugFill);
    yield* wait(a, 0.7);
    tap(true);
    move(a, ARMS.mugSwirl);
    yield* wait(a, 1.1);
    move(a, ARMS.mugTip);
    yield* wait(a, 0.6);
    tap(false);
    a.lean = 0;
    a.nod = 0;
    a.look = sp.cup;
    move(a, ARMS.mugDown);
    yield* wait(a, 0.6);
    a.props.only();
    mug.visible = stick.visible = true;
    a.look = sp.towel;
    move(a, MOVES.wipe);
    yield* wait(a, 0.9);
    a.hold = null;
    a.look = null;
    yield* turn(a, V);
    happyPop(a, "room-pop room-pop-sparkle");
    yield* wait(a, 0.8);
  }

  // The loo: in through its door, shut behind, a sit (seen only as a mosaic), the flush, the door opened, out,
  // and the hands washed at the basin after.
  function* loo(a) {
    if (!claim(a, "loo") || !claim(a, "privacy")) return;
    onEnd(a, () => {
      B.toilet.door.goal = 0;
      B.mosaic.hide();
    });
    const { front, inside, seat } = S.toilet;
    const door = (goal) => {
      a.hold = HOLDS.reach;
      B.toilet.door.goal = goal;
    };
    // In through the open door, round to face out, and the door pulled shut.
    yield* go(a, front);
    yield* turn(a, Math.PI);
    yield* stepTo(a, below(inside), 0.6);
    yield* turn(a, seat.yaw);
    door(1);
    yield* wait(a, 1);
    a.hold = null;
    // Sat back down onto it; a while; up again.
    a.ground = below(inside);
    a.seated = true;
    yield* settle(a, [seat.x, seat.z], seat.y - CHAIR, 0.7);
    B.mosaic.show(a.x, a.y + 15, a.z, 18, 22);
    yield* linger(a, rnd(6, 11));
    B.mosaic.hide();
    yield* standUp(a);
    // Round to the flush on the wall behind, pressed; round again, the door opened, and out.
    yield* turn(a, Math.PI);
    a.hold = MOVES.press;
    a.since = t();
    yield* wait(a, 0.5);
    B.toilet.flush(t());
    a.hold = null;
    yield* wait(a, 0.5);
    yield* turn(a, seat.yaw);
    door(0);
    yield* wait(a, 0.9);
    a.hold = null;
    yield* stepTo(a, below(front), 0.6);
    release(a, "privacy");
    release(a, "loo");
    yield* washHands(a);
  }

  function* washHands(a) {
    const i = mine(a);
    const sp = S.vanity[i];
    if (!claim(a, `vanity${i}`)) return;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = sp.basin;
    B.sinks.running[i] = true;
    onEnd(a, () => (B.sinks.running[i] = false));
    move(a, MOVES.rinse);
    yield* wait(a, rnd(1.8, 2.6));
    B.sinks.running[i] = false;
    move(a, MOVES.shake);
    yield* wait(a, 0.6);
    a.look = sp.towel;
    move(a, MOVES.wipe);
    yield* wait(a, 0.7);
    a.hold = null;
    a.look = null;
    release(a, `vanity${i}`);
  }

  // A bath: crouched at the deck, a hand in the water to try it, a bubble bath poured in; up over the deck and
  // down into the water, lying back, and the curtain drawn round from in there (a mosaic over what shows),
  // the duck bobbing by and a song now and then; then the curtain back, out, and dried with the big towel.
  function* soak(a) {
    const { bath } = B;
    if (!claim(a, "bath") || !claim(a, "privacy")) return;
    a.bareHead = true; // (no nightcap in the bath)
    onEnd(a, () => {
      a.bareHead = false;
      bath.curtain.goal = 0;
      Object.assign(bath, { hot: false, foam: false });
      B.mosaic.hide();
    });
    const sp = S.bath;
    yield* go(a, sp.front);
    yield* turn(a, sp.yaw);
    a.lie = true; // crouched at the deck
    yield* runIt(a); // (let out by a visitor: run again first)
    move(a, MOVES.rinse);
    yield* wait(a, 1.6);
    Object.assign(bath, { hot: true, foam: true });
    a.hold = HOLDS.pick;
    yield* wait(a, 1);
    a.lie = false;
    a.hold = null;
    a.beHappy(1);
    yield* wait(a, 0.4);
    // In: a step up onto the deck, sat down on the bath's edge, a toe in (a shiver: hot!), then slid down into
    // the water with a splash and rings spreading, round to lie back with the head to the wall, a sigh.
    a.ground = below(sp.front); // (cut short anywhere in it, back out on the mat)
    yield* settle(a, sp.deck, sp.deckY, 0.55, 3);
    a.seated = true;
    yield* settle(a, [sp.rim.x, sp.rim.z], sp.rim.y - CHAIR, 0.6);
    yield* wait(a, 0.5);
    a.pop("room-pop room-pop-drop");
    a.hop();
    yield* wait(a, 0.9);
    const lying = sp.in.y - CHAIR + 3;
    yield* settle(a, [sp.in.x, sp.in.z], lying, 1.3, -2);
    bath.splash(sp.in.x, sp.in.z);
    for (let k = 0; k < 3; k++) home.water.splash(a.x + rnd(-4, 4), bath.level(), a.z + rnd(-4, 4), 1.2);
    yield* turn(a, sp.in.yaw);
    a.lean = -0.55;
    yield* wait(a, 0.5);
    happyPop(a, "pet-heart");
    a.hold = HOLDS.reach;
    bath.curtain.goal = 1;
    yield* wait(a, 1.1);
    a.hold = null;
    B.mosaic.show(a.x, bath.level() + 3, a.z, 22, 9);
    // A long soak: now and then a splash with both hands, a nudge to the duck (it spins off), a song, a happy
    // sigh.
    const outAt = t() + rnd(18, 28);
    while (t() < outAt && !a.interrupt) {
      const what = pick(["splash", "duck", "song", "rest", "rest"]);
      if (what === "splash") {
        move(a, ARMS.splash);
        for (let k = 0; k < 2; k++) {
          yield* wait(a, 0.6);
          home.water.splash(a.x + rnd(-3, 3), bath.level(), a.z + rnd(2, 6), 0.8);
        }
        a.hold = null;
      } else if (what === "duck") {
        a.hold = HOLDS.reach;
        yield* wait(a, 0.6);
        bath.nudge();
        a.pop("room-pop room-pop-note");
        a.hold = null;
      } else if (what === "song") {
        for (let k = 0; k < 3; k++) {
          a.pop("room-pop room-pop-note");
          yield* wait(a, 0.9);
        }
      } else if (Math.random() < 0.4) a.pop(pick(["pet-heart", "room-pop room-pop-sparkle"]));
      yield* wait(a, rnd(2.5, 5));
    }
    // Out: the curtain back, sat up and a stretch; stood up in the water, dripping, a step up onto the deck,
    // a shiver, and down onto the mat.
    B.mosaic.hide();
    a.lean = 0;
    a.hold = HOLDS.reach;
    bath.curtain.goal = 0;
    yield* wait(a, 1.1);
    move(a, MOVES.stretch);
    yield* wait(a, 1.4);
    a.hold = null;
    a.wet = 1;
    yield* settle(a, sp.stand, sp.standY, 0.9); // (up from sitting, then stood)
    a.seated = false;
    bath.splash(sp.stand[0], sp.stand[1]);
    yield* wait(a, 0.7);
    yield* settle(a, sp.deck, sp.deckY, 0.6, 3.5);
    a.pop("room-pop room-pop-drop");
    yield* wait(a, 0.5);
    yield* settle(a, below(sp.front), floor(), 0.55, 2);
    a.ground = null;
    Object.assign(bath, { hot: false, foam: false });
    release(a, "privacy");
    yield* dryOff(a);
  }
  // The bath run, crouched at its deck (from wherever it was let down to): the tap reached for and turned on,
  // the water tried now and then as it rises, the tap off once it is full (the tap stops by itself).
  function* runIt(a) {
    const { bath } = B;
    if (bath.full() && bath.flow >= 0) return;
    a.hold = HOLDS.reach;
    yield* wait(a, 0.7);
    bath.flow = 1;
    a.hold = null;
    while (!bath.full() && !a.interrupt) {
      move(a, MOVES.rinse);
      yield* wait(a, rnd(1.2, 2));
      a.hold = null;
      yield* wait(a, rnd(1, 2.5));
    }
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    a.hold = null;
  }
  // Seen empty (let out by a visitor): run again, so it is ready for the next bath.
  function* refill(a) {
    if (!claim(a, "bath")) return;
    yield* go(a, S.bath.front);
    yield* turn(a, S.bath.yaw);
    a.lie = true;
    a.look = B.bath.spout;
    yield* runIt(a);
    a.look = null;
    a.lie = false;
    a.beHappy(1);
    yield* wait(a, 0.5);
  }
  // Dried with the big towel off the rail: the head rubbed, a shake, all fresh.
  function* dryOff(a) {
    const sp = S.towels;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = a.name === "girl" ? sp.pink : sp.blue;
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    a.look = null;
    yield* turn(a, V);
    move(a, ARMS.towel);
    yield* wait(a, rnd(2.5, 3.5));
    a.wet = 0;
    a.hold = null;
    happyPop(a, "room-pop room-pop-sparkle");
    yield* wait(a, 0.6);
  }

  // A shower in the cabin: its doors slid open, a step up onto the tray, the doors shut behind them and the
  // rain on (a mosaic over them while it falls); then off, the doors open, down and out, the doors shut, and
  // dried.
  function* shower(a) {
    if (!claim(a, "shower") || !claim(a, "privacy")) return;
    const { cabin } = B.shower;
    a.bareHead = true;
    onEnd(a, () => {
      a.bareHead = false;
      B.shower.running = false;
      cabin.goal = 0;
      B.mosaic.hide();
    });
    const sp = S.shower;
    const doors = function* (goal) {
      a.hold = HOLDS.reach;
      cabin.goal = goal;
      yield* wait(a, 0.75);
      a.hold = null;
    };
    yield* go(a, sp.door);
    yield* turn(a, sp.yaw + Math.PI);
    yield* doors(1);
    yield* settle(a, below(sp.in), floor() + sp.tray, 0.9, 1.5);
    yield* turn(a, sp.yaw);
    yield* doors(0);
    B.shower.running = true;
    B.mosaic.show(a.x, a.y + 14, a.z, 18, 24);
    move(a, ARMS.splash);
    yield* linger(a, rnd(8, 13));
    a.hold = null;
    B.shower.running = false;
    yield* wait(a, 0.6);
    B.mosaic.hide();
    a.wet = 0.7;
    yield* doors(1);
    yield* settle(a, below(sp.door), floor(), 0.9, 1.5);
    yield* doors(0);
    release(a, "privacy");
    yield* dryOff(a);
  }

  // A pet bathed in the shower cabin: the doors open, kneeling outside by them, the pet called in (the dog
  // bounds in, wagging; the cat comes slowly, cross about it); wetted with the hand shower, lathered
  // (the suds growing over its coat), rinsed (the suds going); it shakes itself off, spraying whoever bathes
  // it (a flinch, a laugh); towelled; out it hops (the dog off on a mad dash round, the cat to groom herself
  // in a huff); the doors shut again.
  const BATHED_AGAIN = 900; // s before a pet is bathed again
  const bathable = (p) => !!p && available(p) && !p.out && t() - (p.bathedAt ?? -Infinity) > BATHED_AGAIN;
  function* washPet(a, which = null) {
    const p = pick((which ? [which] : ["collie", "cat"]).map((n) => byName[n]).filter(bathable)); // (`which`: for trying one out)
    if (!p || !claim(a, "shower")) return;
    const ev = event(a, "bathe", { phase: "come", inside: false, outside: false });
    if (!invite(p, act("bathed", bathed, ev))) return;
    p.bathedAt = t();
    const { cabin } = B.shower;
    const sp = S.petBath;
    onEnd(a, () => {
      cabin.goal = 0;
      B.suds(p, 0);
    });
    yield* go(a, sp.side);
    yield* turn(a, S.shower.yaw + Math.PI);
    a.hold = HOLDS.reach;
    cabin.goal = 1;
    yield* wait(a, 0.8);
    a.hold = null;
    yield* stepTo(a, below(sp.kneel), 0.6);
    yield* turn(a, Math.atan2(sp.pet[0] - a.x, sp.pet[1] - a.z));
    a.lie = true; // kneeling
    ev.phase = "in";
    if (!(yield* until(() => ev.inside || ev.over, 40)) || ev.over) return;
    // Wetted, the spray played along it.
    const sprayFor = function* (secs) {
      move(a, ARMS.spray);
      const end = t() + secs;
      while (t() < end && !ev.over) {
        spray(a, p);
        yield;
      }
      a.hold = null;
    };
    ev.phase = "wet";
    yield* sprayFor(3.5);
    p.wet = 1;
    // Lathered.
    ev.phase = "lather";
    move(a, ARMS.scrub);
    const lathered = t();
    while (t() - lathered < 4.5 && !ev.over) {
      B.suds(p, (t() - lathered) / 4);
      if (Math.random() < clock.dt / 1.2) home.popAt([p.x, p.y + 20, p.z], "room-pop room-pop-sparkle");
      yield;
    }
    // Rinsed.
    ev.phase = "rinse";
    const rinsed = t();
    move(a, ARMS.spray);
    while (t() - rinsed < 3.5 && !ev.over) {
      spray(a, p);
      B.suds(p, Math.max(0, 1 - (t() - rinsed) / 3));
      yield;
    }
    B.suds(p, 0);
    a.hold = null;
    p.wet = 1;
    // Shaken off, all over them.
    ev.phase = "shake";
    yield* wait(a, 0.4);
    p.shakeUntil = t() + 1.4;
    yield* wait(a, 0.3);
    a.lie = false;
    a.hold = HOLDS.reach; // (hands up against it)
    a.wet = Math.max(a.wet, 0.4);
    yield* wait(a, 1);
    a.hold = null;
    happyPop(a, "room-pop room-pop-drop");
    a.beHappy(1.5);
    yield* wait(a, 0.6);
    // Towelled.
    ev.phase = "towel";
    a.lie = true;
    move(a, ARMS.scrub);
    yield* wait(a, 2.8);
    p.wet = 0.15;
    a.hold = null;
    a.lie = false;
    ev.phase = "out";
    yield* until(() => ev.outside || ev.over, 8);
    yield* stepTo(a, below(sp.side), 0.6);
    yield* turn(a, S.shower.yaw + Math.PI);
    a.hold = HOLDS.reach;
    cabin.goal = 0;
    yield* wait(a, 0.7);
    a.hold = null;
    a.beHappy(1);
  }
  // Water from the hand shower in `a`'s hand onto `p`: a few drops thrown each frame on a curve to its back.
  function spray(a, p) {
    const [hx, hy, hz] = [a.x + (p.x - a.x) * 0.35, a.y + 12, a.z + (p.z - a.z) * 0.35];
    const [dx, dy, dz] = [p.x - hx + rnd(-4, 4), p.y + 14 - hy, p.z - hz + rnd(-4, 4)];
    const secs = 0.18;
    for (let k = 0; k < 2; k++) home.water.emit("shower", hx, hy, hz, dx / secs, dy / secs + 100 * secs, dz / secs, 1);
  }
  // The pet's side of it: to the doors, in when called (the cat after a hesitation), stood on the tray
  // through it all (the dog wagging, the cat cross), the shake, and out; then off to run it off, or to groom.
  function* bathed(p, ev) {
    const sp = S.petBath;
    yield* go(p, sp.wait);
    p.look = ev.host;
    if (!(yield* until(() => ev.phase !== "come" || ev.over, 40)) || ev.over) return;
    const cat = p.name === "cat";
    if (cat) {
      p.show("mood", "pet-mood pet-mood-dizzy");
      p.sit = true;
      yield* wait(p, rnd(1.5, 2.5)); // (not keen)
      p.sit = false;
    }
    yield* go(p, sp.door);
    onEnd(p, () => (p.sit = false));
    p.ground = below(sp.door);
    yield* settle(p, below(sp.pet), floor() + sp.tray, 0.6, 5);
    yield* turn(p, sp.petYaw);
    p.look = ev.host;
    ev.inside = true;
    while (ev.phase !== "out" && !ev.over) {
      if (cat) p.show("mood", ev.phase === "wet" || ev.phase === "rinse" ? "pet-mood pet-mood-angry" : "pet-mood pet-mood-dizzy");
      else {
        p.beHappy(0.5);
        p.sit = ev.phase === "lather";
      }
      yield;
    }
    p.sit = false;
    if (cat) p.show("mood", null);
    if (ev.over) return;
    yield* settle(p, below(sp.door), floor(), 0.5, 4);
    p.ground = null;
    ev.outside = true;
    p.look = null;
    if (cat) later(p, act("groom", home.acts.groom.run));
    else later(p, act("zoomies", home.acts.zoomies.run));
  }

  // The fish fed: a pinch of flakes over the water, and a moment watching them come up for it.
  function* fish(a) {
    if (!claim(a, "fish")) return;
    const sp = S.fish;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = sp.food;
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    a.look = sp.tank;
    move(a, ARMS.flakes);
    yield* wait(a, 1.2);
    B.tank.feed(t());
    B.tank.fedAt = t(); // (not again for a while)
    a.hold = null;
    yield* wait(a, 2.5);
    happyPop(a, "pet-heart");
    yield* linger(a, rnd(3, 5));
  }

  // The cat up on her pouf by the tank, nose to the glass, watching them swim; a paw at the glass now and then.
  function* fishWatch(a) {
    if (!claim(a, "pouf")) return;
    const sp = S.catFish;
    yield* go(a, sp.at);
    yield* hop(a, sp.on);
    a.face(sp.yaw);
    a.sit = true;
    a.look = S.fish.tank;
    onEnd(a, () => (a.y = floor()));
    for (const end = t() + rnd(15, 30); t() < end; ) {
      yield* wait(a, rnd(2, 5));
      if (Math.random() < 0.4) a.hop(); // a pat at a fish going by
    }
    a.sit = false;
    a.look = null;
    yield* hop(a, [sp.at[0], floor(), sp.at[1]]);
  }

  /* ----- the gym ----- */

  // A session in the gym: two or three of the treadmill, the rower, the dumbbells, the bike, the bag or the mat
  // (whichever are free), one after the other; maybe the other one down too on others, and the dog to watch;
  // then a drink and the brow wiped.
  const STATIONS = ["treadmill", "rower", "weights", "bike", "lat", "bag", "mat"];
  const RUN = { treadmill: onTreadmill, rower: onRower, weights: onWeights, bike: onBike, lat: onLat, bag: onBag, mat: onMat };
  const freeFor = (a, done = []) => STATIONS.filter((s) => !holder(s) && !done.includes(s) && !(a.name === "girl" && s === "bag")); // (she leaves the bag to him)

  function* gym(a, station = null) {
    let s = station && !holder(station) ? station : pick(freeFor(a));
    if (!s || !claim(a, s)) return;
    const b = other(a);
    if (!station && b && available(b) && Math.random() < 0.4) {
      const rest = freeFor(b, [s]);
      if (rest.length)
        invite(
          b,
          act("gym", (o) => gym(o, pick(rest)))
        );
    }
    // Now and then the dog trots down after her (only her: he goes on his own), as soon as she is free in the
    // first DOG_JOINS s.
    const dog = byName.collie;
    let dogUntil = !station && a.name === "girl" && dog && Math.random() < DOG_COMES ? t() + DOG_JOINS : -Infinity;
    const callDog = () => {
      if (
        t() < dogUntil &&
        available(dog) &&
        invite(
          dog,
          act("gymWatch", (d) => gymWatch(d, a))
        )
      )
        dogUntil = -Infinity;
    };
    const done = [];
    const rounds = Math.random() < 0.3 ? 3 : 2;
    for (;;) {
      for (const _ of RUN[s](a)) {
        callDog();
        yield;
      }
      release(a, s);
      done.push(s);
      if (a.interrupt || done.length >= rounds) break;
      s = pick(freeFor(a, done));
      if (!s || !claim(a, s)) break;
    }
    if (!a.interrupt) yield* cooldown(a);
  }

  // A drink from the bottle by the water, the brow wiped, a happy sigh.
  function* cooldown(a) {
    const sp = S.water;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = sp.bottle;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    a.look = null;
    yield* turn(a, V);
    move(a, ARMS.drink);
    a.nod = -0.25;
    yield* wait(a, 1.6);
    a.nod = 0;
    move(a, MOVES.wipe);
    yield* wait(a, 1);
    a.hold = null;
    happyPop(a, "room-pop room-pop-drop");
    yield* wait(a, 0.6);
  }

  // The treadmill: on, a brisk walk to warm up, then a run (sweat flying now and then), slowing to a walk,
  // and off.
  function* onTreadmill(a) {
    const { treadmill } = B;
    const sp = S.treadmill;
    onEnd(a, () => {
      treadmill.speed = 0;
      treadmill.on = false;
      a.y = floor();
    });
    yield* go(a, sp.front);
    a.ground = below(sp.front);
    yield* turn(a, sp.on.yaw);
    yield* settle(a, [sp.on.x, sp.on.z], sp.on.y + 0.5, 0.6, 1.5);
    treadmill.on = true;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.8); // the buttons
    a.hold = null;
    // Speed (as the belt goes) and the stride with it.
    const run = function* (from, to, secs) {
      const t0 = t();
      a.walking = true;
      while (t() < t0 + secs && !a.interrupt) {
        const k = Math.min(1, (t() - t0) / Math.min(secs, 3));
        const v = from + (to - from) * k;
        treadmill.speed = v;
        a.pace = v;
        a.hold = v > 1.3 ? ARMS.run : null;
        a.since = t0;
        if (v > 1.5 && Math.random() < clock.dt / 4) a.pop("room-pop room-pop-drop");
        yield;
      }
    };
    try {
      yield* run(0.2, 0.9, 6);
      yield* run(0.9, 2.1, rnd(18, 30));
      yield* run(2.1, 0.8, 5);
      yield* run(0.8, 0, 2);
    } finally {
      a.walking = false;
      a.pace = 1;
      a.hold = null;
    }
    treadmill.speed = 0;
    treadmill.on = false;
    yield* settle(a, a.ground, floor(), 0.6, 1.5);
    a.ground = null;
    a.beHappy(1.2);
  }

  // The rower: sat on the slide, stroke after stroke (legs, back, arms; and back the other way), the seat and
  // the handle with them.
  function* onRower(a) {
    const { rower } = B;
    const sp = S.rower;
    onEnd(a, () => {
      rower.set(0);
      a.legs = null;
    });
    yield* sitDown(a, sp.front, sp.seat);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    const y = a.y;
    const strokes = Math.floor(rnd(10, 16));
    for (let n = 0; n < strokes && !a.interrupt; n++) {
      // The drive (1 s) and the recovery (1.6 s).
      for (const [from, to, secs] of [
        [0, 1, 1],
        [1, 0, 1.6],
      ]) {
        const t0 = t();
        while (t() < t0 + secs) {
          const u = (t() - t0) / secs;
          const k = from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * u));
          rower.set(k);
          const [sx, , sz] = rower.seatAt(k);
          [a.x, a.z, a.y] = [sx, sz, y];
          a.lean = -0.35 * k + 0.25 * (1 - k); // forward at the catch, back at the finish
          const leg = [-2.15 + 0.65 * Math.min(1, k * 1.4), 2.1 - 2 * Math.min(1, k * 1.4)]; // knees up at the catch, straight by the drive's end
          a.legs = [leg, leg];
          const pull = Math.max(0, (k - 0.5) * 2); // the arms come in at the end of the drive
          a.hold = [
            [-1.35 + 0.5 * pull, -0.15 - 1.5 * pull, 0.25, 0, 0],
            [-1.35 + 0.5 * pull, -0.15 - 1.5 * pull, -0.25, 0, 0],
          ];
          yield;
        }
      }
      if (n % 5 === 4) a.pop("room-pop room-pop-drop");
    }
    rower.set(0);
    a.lean = 0;
    a.hold = null;
    a.legs = null;
    yield* standUp(a);
  }

  // The dumbbells: a pair off the rack, curls one arm then the other, a few presses overhead, and back on the rack.
  function* onWeights(a) {
    const { dumbbells } = B;
    const sp = S.weights;
    onEnd(a, () => {
      dumbbells.put();
      a.props.only();
    });
    yield* go(a, sp.at);
    yield* turn(a, sp.rackYaw);
    a.lie = true;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    dumbbells.take();
    a.props.only("dumbbellRight", "dumbbellLeft");
    a.lie = false;
    yield* turn(a, sp.yaw);
    move(a, ARMS.curl);
    yield* wait(a, rnd(8, 12));
    move(a, ARMS.press);
    yield* wait(a, rnd(5, 8));
    a.pop("room-pop room-pop-star");
    yield* turn(a, sp.rackYaw);
    a.lie = true;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    dumbbells.put();
    a.props.only();
    a.lie = false;
    a.hold = null;
    yield* wait(a, 0.3);
  }

  // The lat pulldown: sat facing the tower, knees under the rollers, the bar reached down from overhead,
  // pulled to the chest and let slowly back up, rep after rep, the weights rising and falling with it.
  function* onLat(a) {
    const { lat } = B;
    const sp = S.lat;
    onEnd(a, () => lat.set(0));
    yield* sitDown(a, sp.front, sp.seat);
    const arms = (k) => {
      const [sx, ex, sz] = [-2.85 + 1.25 * k, -0.2 - 1.6 * k, 0.6 + 0.4 * k]; // overhead, to the elbows down by the sides
      return [
        [sx, ex, sz, 0, 0],
        [sx, ex, -sz, 0, 0],
      ];
    };
    a.hold = arms(0);
    yield* wait(a, 0.7);
    const reps = Math.floor(rnd(8, 13));
    for (let n = 0; n < reps && !a.interrupt; n++) {
      // Down in 1 s, a moment at the chest, back up in 1.6 s.
      for (const [from, to, secs] of [
        [0, 1, 1],
        [1, 1, 0.25],
        [1, 0, 1.6],
      ]) {
        const t0 = t();
        while (t() < t0 + secs) {
          const u = Math.min(1, (t() - t0) / secs);
          const k = from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * u));
          lat.set(k);
          a.hold = arms(k);
          a.lean = -0.15 * k; // leaning back a little into the pull
          yield;
        }
      }
      if (n % 4 === 3) a.pop("room-pop room-pop-drop");
    }
    lat.set(0);
    a.lean = 0;
    a.hold = null;
    yield* standUp(a);
  }

  // The spin bike: up on the saddle, hands on the bars, pedalling hard, then easing off.
  function* onBike(a) {
    const { bike } = B;
    const sp = S.bike;
    onEnd(a, () => {
      bike.speed = 0;
      a.legs = null;
    });
    yield* sitDown(a, sp.front, sp.seat);
    a.since = t();
    a.hold = ARMS.bars;
    const end = t() + rnd(15, 25);
    while (t() < end && !a.interrupt) {
      const k = Math.min(1, (t() - a.since) / 3, (end - t()) / 3);
      bike.speed = 0.4 + 1.6 * k;
      a.lean = 0.2 * k;
      // Each foot round with its pedal (half a turn apart): the knee up as the pedal comes over the top.
      const angle = -bike.crank.rotation.x;
      a.legs = [0, Math.PI].map((off) => [-1.3 - 0.35 * Math.cos(angle + off), 1.35 + 0.45 * Math.cos(angle + off + 0.5)]);
      if (Math.random() < clock.dt / 5) a.pop("room-pop room-pop-drop");
      yield;
    }
    bike.speed = 0;
    a.lean = 0;
    a.hold = null;
    a.legs = null;
    yield* standUp(a);
  }

  // The punching bag: squared up to it, jab after jab, the bag swinging back with each.
  function* onBag(a) {
    const { punch } = B;
    const sp = S.bag;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    a.look = sp.bag;
    move(a, ARMS.jab);
    let last = 0;
    const end = t() + rnd(10, 16);
    while (t() < end && !a.interrupt) {
      const phase = Math.floor(((t() - a.since) * 6.5) / Math.PI); // a punch landing each half turn
      if (phase !== last) {
        last = phase;
        punch.hit(t(), sp.yaw + (phase % 2 ? 0.2 : -0.2));
      }
      yield;
    }
    a.hold = null;
    a.look = null;
    a.pop("room-pop room-pop-star");
    yield* wait(a, 0.5);
  }

  // Stretches on the mat: arms up and over, down to the toes, and up again.
  function* onMat(a) {
    const sp = S.mat;
    yield* go(a, sp.at);
    yield* turn(a, sp.yaw);
    for (let n = 0; n < 3 && !a.interrupt; n++) {
      move(a, MOVES.stretch);
      yield* wait(a, 2.4);
      a.hold = HOLDS.pick;
      a.lean = 0.45; // down to the toes
      a.nod = 0.3;
      yield* wait(a, 1.6);
      a.lean = 0;
      a.nod = 0;
      a.hold = null;
      yield* wait(a, 0.6);
    }
    a.beHappy(1.5);
  }

  // The dog follows `her` down (falling in behind on the stairs) to watch, sitting by the mat, her eyes on
  // her; after a while she lies down, and stays as long as `her` workout lasts (a few minutes at most).
  function* gymWatch(a, her = byName.girl) {
    const training = () => her.jobName === "gym";
    yield* until(() => her.below || her.y < -4 || !training(), 30); // (off after her once she is on the stairs)
    yield* go(a, S.dogWatch);
    a.sit = true;
    a.look = { facePoint: () => [her.x, her.y + 20, her.z] };
    for (const [end, lieAt] = [t() + 240, t() + rnd(12, 20)]; t() < end && training() && !a.interrupt; ) {
      if (t() > lieAt && !a.lie) [a.sit, a.lie] = [false, true];
      yield* wait(a, 0.5);
    }
    a.beHappy(1);
    [a.sit, a.lie, a.look] = [false, false, null];
  }

  return { teeth, loo, soak, refill, shower, washPet, fish, fishWatch, gym, gymWatch, bathable };
}
