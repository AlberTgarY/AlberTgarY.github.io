/*******************************************************************************
 * What they do in the playground's home, each activity a generator over the
 * steps in steps.js (life.js runs them). `can(a)` says whether an activity can
 * be chosen just now; the ones without it are only done when asked (the
 * director's, or another's invitation).
 *
 * The two of them watch TV, have a snack from the fridge or the freezer (the
 * dog begs for a treat, and the empty box goes in the bin), cook (her, with
 * vegetables from the garden when there are some) or bake a roast chicken or a
 * lasagna in the oven, and eat it together at the table, read, water the plant,
 * work on the laptop, play a video game together on the sofa, chat, nap,
 * stretch, stroll, light the fire, look after the garden (watering the beds, and
 * picking what is ripe for the fridge), take the dog out for a walk through the
 * front door, play fetch with her, pet and feed the pets, tidy up the cat's
 * mess, and go to bed at night. He plays on his computer in the loft, his white
 * headphones off their stand and on his head, talking to his team, cheering
 * when he wins; she may come up and watch, and the cat sits on the desk. She
 * changes her clothes in the dressing corner (her own idea, or the visitor's
 * choice) and twirls in front of the mirror. The collie naps in her bed, lies on
 * the rug or out in the sun, has the zoomies, visits them and sniffs the cat;
 * the cat stays home from walks, naps all over, watches birds from the window
 * sill, climbs her tree, chases the butterfly in the garden, grooms, cuddles up
 * to the sleeping dog, sleeps at their feet, and makes a mess while they are
 * all out. Both curl up by the fire while it burns.
 ******************************************************************************/

import { rnd, pick, clamp, wrap } from "../stage.js";
import { LOFT, X1 } from "./house.js";
import { LOOKS } from "../models/girl-outfits.js";
import { HOLDS, MOVES, DISHES } from "./props.js";
import { GAMES } from "./screens.js";
import { makeSteps } from "./steps.js";
import { VIEW_YAW } from "./view.js";

const V = VIEW_YAW; // facing the viewer
const F = [Math.sin(V), Math.cos(V)]; // on the floor, towards the viewer
const R = [Math.cos(V), -Math.sin(V)]; // on the floor, to the right on screen
const SNACKS = { cucumber: 5, grapeTea: 6, porkRice: 7 }; // the girl's, and how long each takes (girl.js)
const SAY = ["heart", "note", "star", "question", "bowl", "paw"]; // what comes up in a chat
const TEAM_SAY = ["star", "question", "note"]; // what he says to his team
const ROOM = [
  [-140, 200],
  [-100, 100],
]; // where to wander, x and z (the loft and the garden too)
const DOWNSTAIRS = [
  [-130, 130],
  [-20, 100],
]; // the open floor of the living room

export function makeActs(home, life) {
  const { clock, house, nav, byName, humans } = home;
  const { spots, floorY } = house;
  const { walk, turn, wait, until, hop, glide, sitOn, getUp, intoBed, outOfBed } = makeSteps(home);
  const { claim, holder, release, act, event, available, invite, later, onEnd } = life;
  const t = () => clock.t;
  const other = (a) => humans.find((h) => h !== a);
  const seatOf = (key) => spots.seats[key];
  const LIVING = ["sofa0", "sofa1", "sofa2", "armchair"];
  const SOFA = ["sofa0", "sofa1", "sofa2"];
  const freeSeat = (keys = LIVING) => keys.some((k) => !holder(k));
  const level = (y) => (x, z) => Math.abs(floorY(x, z) - y) < 0.5;
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
    ...Object.keys(spots.bowls).map((name) => bowlSide(byName[name])),
  ];
  // A free spot on a floor (not the stairs) in `area` that `ok` accepts, clear of everyone else, of where
  // they are going, and of the spots activities go to.
  const offPlaces = (x, z) => PLACES.every(([px, pz]) => Math.hypot(px - x, pz - z) > 12);
  function freeSpot(a, [xs, zs] = ROOM, room = 26, ok = flat) {
    return nav.randomSpot(
      xs,
      zs,
      (x, z) =>
        ok(x, z) &&
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
  // same floor; or failing that one nearby. With the side it is on (1 right, -1 left).
  function beside(a, [x, z], gap, dz = 4) {
    const same = level(floorY(x, z));
    const mine = Math.sign((a.x - x) * R[0] + (a.z - z) * R[1]) || 1;
    const at = (s) => toward([x, z], s * gap, dz);
    const side = [mine, -mine].find((s) => nav.free(...at(s)) && same(...at(s)));
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

  /* =================== the girl and the boy =================== */

  // Watch TV on the sofa; the other may come and watch too, and the pets snuggle up. Some doze off.
  function* tv(a) {
    const seat = takeSeat(a, a.name === "girl" ? ["sofa1", "sofa0", "sofa2"] : ["sofa2", "sofa0", "sofa1"]);
    if (!seat) return;
    yield* sitOn(a, seat);
    a.watching = true;
    a.look = spots.tv;
    const b = other(a);
    if (b && !b.watching && Math.random() < 0.4 && freeSeat(SOFA)) invite(b, act("tv", tv));
    for (const p of home.pets) if (Math.random() < 0.4) invite(p, act("snuggle", snuggle, a));
    let laughAt = t() + rnd(4, 8);
    yield* linger(a, rnd(20, 35), {
      dozeAt: dozeChance(0.15, 0.5),
      each() {
        a.look = a.asleep ? null : spots.tv;
        if (!a.asleep && t() > laughAt) {
          if (Math.random() < 0.5) a.beHappy(1.4); // something funny
          laughAt = t() + rnd(4, 9);
        }
      },
    });
    a.watching = false;
    a.look = null;
    yield* getUp(a);
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
    yield* outOfBed(a);
    a.hold = MOVES.stretch;
    a.since = t();
    yield* wait(a, 2.4);
    a.hold = null;
  }

  // A snack from the fridge (an ice cream from the freezer, up top), eaten there and then; the dog may come
  // and beg, and get a treat. His empty juice box goes in the bin.
  function* snack(a) {
    if (!claim(a, "fridge")) return;
    const item = a.name === "girl" ? pick(Object.keys(SNACKS)) : pick(["iceCream", "juice"]);
    const freezer = item === "iceCream";
    const ev = askToBeg(a, [spots.fridge.at[0] + 22, spots.fridge.at[1] + 8], 0.55);
    yield* walk(a, spots.fridge.at);
    yield* turn(a, spots.fridge.yaw);
    if (freezer) a.atFreezer = true;
    else a.atFridge = true;
    yield* wait(a, 0.6);
    a.hold = freezer ? HOLDS.reach : HOLDS.pick;
    yield* wait(a, 1);
    a.hold = null;
    a.atFridge = a.atFreezer = false;
    yield* wait(a, 0.4);
    release(a, "fridge");
    yield* turn(a, V);
    a.beHappy(0.8);
    yield* treat(a, ev);
    yield* turn(a, V);
    if (a.name === "girl") {
      a.setState("trick", SNACKS[item], item);
      yield* wait(a, SNACKS[item]);
      a.setState("idle");
    } else {
      a.props.only(item);
      a.hold = MOVES.lick;
      a.happy = true;
      yield* wait(a, 6);
      a.happy = false;
      if (item === "juice") yield* toBin(a, "juice");
    }
  }
  // Carry `item` to the bin and drop it in, the lid lifting; just put away if someone is at the bin.
  function* toBin(a, item) {
    if (!claim(a, "bin")) return a.props.only();
    onEnd(a, () => (house.bin.open = false));
    a.props.only(item);
    a.hold = HOLDS.carry;
    yield* walk(a, spots.bin.at);
    yield* turn(a, spots.bin.yaw);
    house.bin.open = true;
    yield* wait(a, 0.35);
    a.hold = HOLDS.pick;
    a.look = spots.bin.lid;
    yield* wait(a, 0.5);
    a.props.only();
    yield* wait(a, 0.3);
    house.bin.open = false;
    a.hold = null;
    a.look = null;
    release(a, "bin");
  }
  // The dog may come to sit at `spot` and beg while `a` gets food; the event, if she comes.
  function askToBeg(a, spot, chance) {
    const dog = byName.collie;
    if (!dog || Math.random() > chance || !available(dog)) return null;
    const ev = event(a, "beg", { treat: false, spot });
    return invite(dog, act("beg", beg, ev)) ? ev : null;
  }
  // A treat for the dog, if she is there begging.
  function* treat(a, ev) {
    const dog = byName.collie;
    if (ev && dog.state === "beg") {
      halfTowards(a, dog.x, dog.z, 0.3);
      yield* wait(a, 0.4);
      a.props.only("treat");
      a.hold = HOLDS.treat;
      yield* wait(a, 1);
      ev.treat = true;
      a.props.only();
      a.hold = null;
      yield* wait(a, 0.6);
    }
    if (ev) ev.over = true;
  }

  // Cooking (her): at the stove, the burner on, stirring the pot as it steams; then pork rice at the
  // table, him called over to eat with her, and the dog hoping for a bite.
  function* cook(a) {
    if (!claim(a, "stove")) return;
    onEnd(a, () => (house.stove.on = false));
    const { garden } = house;
    if (garden.picked > 0 && claim(a, "fridge")) {
      // The vegetables from the garden out of the fridge first, for the pot.
      yield* walk(a, spots.fridge.at);
      yield* turn(a, spots.fridge.yaw);
      a.atFridge = true;
      yield* wait(a, 0.5);
      a.hold = HOLDS.pick;
      yield* wait(a, 0.8);
      garden.picked--;
      a.props.only("basket");
      a.props.pick(pick(garden.beds).kind);
      a.atFridge = false;
      a.hold = HOLDS.carry;
      release(a, "fridge");
    }
    yield* walk(a, spots.stove.at);
    yield* turn(a, spots.stove.yaw);
    a.look = spots.stove.pot;
    a.hold = HOLDS.pick; // turning the knob, and in with the vegetables
    yield* wait(a, 0.6);
    a.props.only();
    house.stove.on = true;
    a.hold = MOVES.stir;
    let sniffAt = t() + rnd(3, 5);
    const end = t() + rnd(10, 14);
    while (t() < end) {
      if (t() > sniffAt) {
        home.popAt(
          spots.stove.pot.map((v, i) => (i === 1 ? v + 6 : v)),
          "room-pop room-pop-sparkle"
        ); // smells good
        a.beHappy(1);
        sniffAt = t() + rnd(3, 5);
      }
      yield;
    }
    house.stove.on = false;
    a.hold = null;
    a.look = null;
    yield* turn(a, V);
    yield* meal(a);
  }

  // Baking (either of them): a roast chicken or a lasagna out of the fridge and into the oven, kneeling to
  // let its door down; it bakes while they wait by it, crouching to peek through the glass, the smell
  // drifting up, till it is done; out of the oven, onto the table, the other called over to eat it with
  // them, and the dish to the sink after.
  function* bake(a) {
    if (!claim(a, "stove") || !claim(a, "fridge")) return;
    const { oven } = house;
    const dish = pick(DISHES);
    onEnd(a, () => Object.assign(oven, { on: false, open: false, dish: null }));
    yield* walk(a, spots.fridge.at);
    yield* turn(a, spots.fridge.yaw);
    a.atFridge = true;
    yield* wait(a, 0.5);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.8);
    a.props.only(dish);
    a.hold = HOLDS.tray;
    a.atFridge = false;
    yield* wait(a, 0.4);
    release(a, "fridge");
    yield* atOven(a, () => {
      a.props.only();
      oven.dish = dish;
    });
    oven.on = true;
    a.hold = null;
    yield* turn(a, spots.oven.yaw);
    a.look = spots.oven.door;
    const smell = [spots.oven.door[0], 30, spots.oven.door[2]];
    let smellAt = t() + rnd(3, 5);
    let peekAt = t() + rnd(4, 7);
    const end = t() + rnd(14, 20);
    while (t() < end) {
      if (t() > smellAt) {
        home.popAt(smell, "room-pop room-pop-sparkle"); // smells good
        a.beHappy(1);
        smellAt = t() + rnd(3, 5);
      }
      if (t() > peekAt) {
        a.lie = true; // a peek through the glass
        yield* wait(a, 1.6);
        a.lie = false;
        peekAt = t() + rnd(5, 8);
      }
      yield;
    }
    oven.on = false;
    home.popAt(smell, "room-pop room-pop-star"); // ding!
    a.pop();
    yield* wait(a, 0.6);
    yield* atOven(a, () => {
      oven.dish = null;
      a.props.only(dish);
    });
    a.hold = HOLDS.tray;
    a.look = null;
    release(a, "stove");
    yield* meal(a, dish);
  }
  // Kneel by the oven, let the door down and reach in (`swap()` puts the dish in or takes it out), then
  // close it and stand up again.
  function* atOven(a, swap) {
    yield* walk(a, spots.oven.at);
    yield* turn(a, spots.oven.yaw);
    a.look = spots.oven.door;
    a.lie = true; // kneeling
    yield* wait(a, 0.4);
    house.oven.open = true;
    onEnd(a, () => (house.oven.open = false));
    yield* wait(a, 0.5);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    swap();
    yield* wait(a, 0.5);
    house.oven.open = false;
    yield* wait(a, 0.5);
    a.lie = false;
  }

  // At the table with what was cooked: sit down (a dish from the oven goes in the middle), call the other
  // over to eat too (again, if they were busy) and wait a little for them, and eat; the dog hopes for a
  // bite. A dish goes to the sink after.
  function* meal(a, dish = null) {
    const seat = takeSeat(a, ["dine0", "dine1"]);
    if (!seat) return yield* eatRice(a);
    const b = other(a);
    const ev = event(a, "meal", { ready: false });
    const calling = !!b && Math.random() < 0.85;
    let coming = false;
    const call = () => (coming ||= calling && available(b) && invite(b, act("dine", dine, ev)));
    call();
    yield* sitOn(a, seat);
    if (dish) {
      onEnd(a, () => (house.dinner.dish = null));
      a.look = spots.dining.dish;
      a.hold = HOLDS.pick;
      yield* wait(a, 0.5);
      a.props.only();
      house.dinner.dish = dish;
      yield* wait(a, 0.3);
      a.hold = null;
      a.look = null;
    }
    if (calling) {
      a.look = b;
      yield* until(() => call() && b.seated && b.seatKey?.startsWith("dine"), 12);
      a.look = null;
    }
    ev.ready = true;
    const begging = askToBeg(a, spots.dining.beg, 0.5);
    yield* eatRice(a, b);
    yield* treat(a, begging);
    ev.over = true; // too late to come now
    yield* getUp(a);
    if (!dish) return;
    // Clear the dish away to the sink, and rinse it.
    a.look = spots.dining.dish;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    house.dinner.dish = null;
    a.props.only(dish);
    a.hold = HOLDS.tray;
    a.look = null;
    yield* walk(a, spots.sink.at);
    yield* turn(a, spots.sink.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.6);
    a.props.only();
    a.hold = MOVES.stir; // a scrub
    yield* wait(a, 1.6);
    home.popAt(spots.sink.basin, "room-pop room-pop-sparkle");
    a.hold = null;
    yield* wait(a, 0.4);
  }
  // Called to the table: sit beside them, wait for them (looking over), eat together, and stay a moment
  // after they get up.
  function* dine(a, ev) {
    const seat = takeSeat(a, ["dine1", "dine0"]);
    if (!seat || ev.over) return;
    yield* sitOn(a, seat);
    const host = ev.host;
    a.look = host;
    yield* until(() => ev.ready || ev.over, 30);
    if (ev.ready) yield* eatRice(a, host);
    a.look = host;
    yield* wait(a, rnd(0.8, 2));
    a.look = null;
    yield* getUp(a);
  }
  // A bowl of pork rice, a glance at whoever eats with them now and then, and a happy sigh at the end.
  function* eatRice(a, friend = null) {
    a.setState("trick", SNACKS.porkRice, "porkRice");
    while (t() < a.until) {
      a.look = friend && friend.seatKey?.startsWith("dine") && Math.sin(t() * 0.9) > 0.6 ? friend : null;
      yield;
    }
    a.setState("idle");
    a.look = null;
    a.happy = true;
    if (Math.random() < 0.6) a.pop();
    yield* wait(a, 1.4);
    a.happy = false;
  }

  // The red book from the low shelf, read sitting down (sometimes dozing off over it), and put back.
  function* read(a) {
    if (!claim(a, "book")) return;
    onEnd(a, () => (house.book.visible = true));
    yield* walk(a, spots.shelf.at);
    yield* turn(a, spots.shelf.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.7);
    house.book.visible = false;
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
    house.book.visible = true;
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

  // The boy at his computer in the loft: his headphones off their stand and on, a few games, talking to his
  // team through the mic; a win and he spins his chair round to cheer, a loss and he slumps. The girl may
  // come up to watch, and he gives the cat a look if she comes to sit on the desk. The headphones go back on
  // their stand after.
  function* pc(a) {
    if (!claim(a, "pc")) return;
    const seat = takeSeat(a, ["chair"]);
    if (!seat) return;
    onEnd(a, () => {
      house.pc.set("off", t());
      house.pc.sitter = null;
      house.pc.talking = false;
      house.pc.phones.visible = true;
    });
    yield* walk(a, spots.phonesAt.at);
    yield* turn(a, spots.phonesAt.yaw);
    a.look = spots.phones;
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    house.pc.phones.visible = false;
    a.hold = HOLDS.phones;
    yield* wait(a, 0.5);
    a.phones = true;
    a.look = null;
    yield* wait(a, 0.3);
    a.hold = null;
    yield* sitOn(a, seat);
    house.pc.sitter = a;
    a.hold = MOVES.mouse;
    a.look = spots.monitor;
    house.pc.set("game", t(), pick(GAMES)); // what he feels like playing today
    const ev = event(a, "pc", { playing: true, round: 0, result: null });
    const girl = byName.girl;
    if (girl && Math.random() < 0.3 && !holder("watchPc")) invite(girl, act("watchPc", watchPc, ev));
    const cat = byName.cat;
    const rounds = 2 + Math.floor(Math.random() * 2);
    for (let r = 0; r < rounds; r++) {
      const end = t() + rnd(14, 22);
      let talkUntil = 0;
      let talkAt = t() + rnd(3, 6);
      let catAt = t() + rnd(2, 4);
      let lookUntil = 0;
      while (t() < end) {
        if (t() > talkAt) {
          talkUntil = t() + 1.6;
          talkAt = t() + rnd(5, 9);
          a.show("say", `room-say room-say-${pick(TEAM_SAY)}`);
        }
        a.talk = t() < talkUntil;
        house.pc.talking = a.talk;
        if (!a.talk) a.show("say", null);
        if (holder("desk") === cat && cat.above() > 5 && t() > catAt) {
          lookUntil = t() + 1.4;
          catAt = t() + rnd(6, 10);
          a.pop();
        }
        a.look = t() < lookUntil ? cat : spots.monitor;
        a.nod = 0.1 + 0.05 * Math.sin(t() * 1.3);
        yield;
      }
      a.talk = false;
      house.pc.talking = false;
      a.show("say", null);
      const won = Math.random() < 0.6;
      ev.result = won ? "win" : "lose";
      ev.round++;
      house.pc.set(ev.result, t());
      if (won) {
        a.look = null;
        a.nod = 0;
        yield* turn(a, V);
        a.hold = MOVES.cheer;
        a.happy = true;
        a.pop("room-pop room-pop-star");
        yield* wait(a, 2);
        a.happy = false;
        a.hold = MOVES.mouse;
        yield* turn(a, seat.yaw);
      } else {
        a.hold = HOLDS.slump;
        a.nod = -0.35; // head back
        a.pop("room-pop room-pop-drop");
        yield* wait(a, 2);
        a.hold = MOVES.mouse;
      }
      a.look = spots.monitor;
      house.pc.set("game", t());
    }
    ev.playing = false;
    house.pc.set("off", t());
    house.pc.talking = false;
    a.look = null;
    a.nod = 0;
    yield* getUp(a);
    house.pc.sitter = null;
    yield* walk(a, spots.phonesAt.at);
    yield* turn(a, spots.phonesAt.yaw);
    a.hold = HOLDS.phones;
    yield* wait(a, 0.4);
    a.phones = false;
    a.look = spots.phones;
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    house.pc.phones.visible = true;
    a.hold = null;
    a.look = null;
  }

  // Up to the loft to watch him play: beside his chair, eyes on the screen, clapping when he wins.
  function* watchPc(a, ev = byName.boy?.event) {
    if (!ev || ev.kind !== "pc" || ev.over || !claim(a, "watchPc")) return;
    yield* walk(a, spots.watchPc.at);
    const [mx, , mz] = spots.monitor;
    halfTowards(a, mx, mz, 0.35);
    a.look = spots.monitor;
    let seen = ev.round;
    let glanceAt = t() + rnd(3, 6);
    const end = t() + 70;
    while (!ev.over && ev.playing && t() < end) {
      if (ev.round > seen) {
        seen = ev.round;
        if (ev.result === "win") {
          a.hold = MOVES.clap;
          a.happy = true;
          a.pop();
        } else {
          a.hold = HOLDS.chin;
          a.pop("room-pop room-pop-question");
        }
        yield* wait(a, 1.8);
        a.hold = null;
        a.happy = false;
      }
      if (t() > glanceAt) {
        a.look = ev.host;
        a.beHappy(1);
        yield* wait(a, 1.2);
        a.look = spots.monitor;
        glanceAt = t() + rnd(4, 8);
      }
      yield;
    }
    a.look = null;
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

  // A video game together on the sofa: one wins and cheers, the other pouts, then they laugh.
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
    yield* sitOn(a, seat);
    yield* play(a, ev);
    yield* getUp(a);
  }
  function* gamePartner(a, ev, key) {
    const seat = takeSeat(a, [key]);
    if (!seat || ev.over) return;
    yield* sitOn(a, seat);
    yield* play(a, ev);
    yield* getUp(a);
  }
  function* play(a, ev) {
    ev.ready.add(a);
    if (!(yield* until(() => ev.ready.size === 2 || ev.over, 20)) || ev.over) return;
    a.props.only("pad");
    a.hold = MOVES.pad;
    a.gaming = true;
    a.look = spots.tv;
    if (a === ev.host) {
      const end = t() + rnd(18, 24);
      while (t() < end && !ev.over) {
        a.nod = 0.08 * Math.sin(t() * 3);
        yield;
      }
      ev.result = { winner: Math.random() < 0.5 ? a : other(a) };
    } else yield* until(() => ev.result || ev.over, 40);
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

  // Doing nothing much for a moment.
  function* rest(a) {
    if (a.name === "cat" && Math.random() < 0.5) a.sit = true;
    yield* linger(a, rnd(3, 7));
  }

  /* ----- the dressing corner, the fire and the garden ----- */

  // She changes her clothes (by day): a look along the rail at the dressing corner, the one she wants off
  // its hanger (the visitor's choice, home.outfit.want, or else one she fancies), behind the screen to
  // change, her old clothes back on the rail, and then a twirl in front of the mirror. Should the visitor
  // pick again before she is behind the screen, she takes that one instead (going back to the rail to swap
  // if she has to); picking what she has on calls it off. A pick once she is changing is for next time.
  function* dressUp(a) {
    const wardrobe = home.outfit;
    if (!claim(a, "closet")) return;
    onEnd(a, () => house.closet.hang([wardrobe.current])); // however it ends, only what she has on is off the rail
    yield* walk(a, spots.closet.at);
    yield* turn(a, spots.closet.yaw);
    a.look = spots.closet.rail;
    if (wardrobe.want === null) {
      a.hold = HOLDS.chin; // which one?
      a.pop("room-pop room-pop-question");
      yield* wait(a, 1.6);
    }
    let want = wardrobe.want ?? pick(LOOKS.map((_, k) => k).filter((k) => k !== wardrobe.current));
    const changed = () => wardrobe.want !== null && wardrobe.want !== want;
    for (;;) {
      if (want === wardrobe.current) {
        // Called off: what she has on will do.
        wardrobe.want = null;
        house.closet.hang([wardrobe.current]);
        a.hold = null;
        a.look = null;
        yield* turn(a, V);
        a.pop();
        a.beHappy(1.2);
        return yield* wait(a, 1.2);
      }
      a.hold = HOLDS.reach;
      yield* wait(a, 0.7);
      if (changed()) {
        want = wardrobe.want; // still at the rail: that one instead
        continue;
      }
      house.closet.hang([wardrobe.current, want]); // off the hanger
      a.hold = HOLDS.carry;
      a.look = null;
      if (yield* walkUnless(a, spots.change.at, changed)) break;
      // A different pick on the way: back to the rail to swap it.
      yield* walk(a, spots.closet.at);
      yield* turn(a, spots.closet.yaw);
      a.look = spots.closet.rail;
      house.closet.hang([wardrobe.current]); // back on its hanger
      want = wardrobe.want;
    }
    yield* turn(a, V);
    a.hold = MOVES.stretch; // over the head and off, and the new ones on
    a.since = t();
    yield* wait(a, 1.4);
    wardrobe.wear(want);
    house.closet.hang([want]);
    if (wardrobe.want === want) wardrobe.want = null;
    yield* wait(a, 1);
    a.hold = null;
    home.popAt(
      a.facePoint().map((v, i) => (i === 1 ? v + 12 : v)),
      "room-pop room-pop-sparkle"
    );
    yield* walk(a, spots.mirror.at);
    yield* turn(a, spots.mirror.yaw);
    a.look = spots.mirror.glass;
    yield* wait(a, 1.2);
    a.look = null;
    a.hold = HOLDS.twirl;
    a.happy = true;
    for (let k = 1; k <= 3; k++) yield* turn(a, spots.mirror.yaw + (k * 2 * Math.PI) / 3);
    a.hold = null;
    yield* turn(a, V);
    a.pop();
    yield* wait(a, 1.4);
  }

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

  // The garden (by day): pick whatever is ripe and put it in the fridge, or else water the beds that are dry.
  function* garden(a) {
    const g = house.garden;
    if (!claim(a, "garden")) return;
    const ripe = [0, 1, 2, 3].filter(g.ripe);
    if (ripe.length) return yield* harvest(a, pick(ripe));
    const dry = [0, 1, 2, 3].filter(g.thirsty);
    if (dry.length) yield* waterBeds(a, dry.slice(0, 2));
  }
  function* harvest(a, i) {
    const bed = spots.beds[i];
    yield* walk(a, bed.at);
    yield* turn(a, bed.yaw);
    a.look = bed.plants[1];
    a.lie = true; // kneeling
    yield* wait(a, 0.6);
    a.hold = HOLDS.pick;
    yield* wait(a, 1.2);
    const kind = house.garden.harvest(i);
    a.props.only("basket");
    a.props.pick(kind);
    home.popAt(bed.plants[1], "room-pop room-pop-sparkle");
    a.hold = HOLDS.carry;
    a.lie = false;
    a.look = null;
    a.beHappy(1.5);
    yield* wait(a, 0.8);
    release(a, "garden");
    // In through the garden door and into the fridge with it.
    if (claim(a, "fridge")) {
      yield* walk(a, spots.fridge.at);
      yield* turn(a, spots.fridge.yaw);
      a.atFridge = true;
      yield* wait(a, 0.5);
      a.hold = HOLDS.pick;
      yield* wait(a, 0.8);
      a.atFridge = false;
    }
    house.garden.picked++;
    a.props.only();
    a.hold = null;
  }
  function* waterBeds(a, beds) {
    const { garden: g } = house;
    yield* walk(a, spots.can.at);
    yield* turn(a, spots.can.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    g.can.visible = false;
    onEnd(a, () => (g.can.visible = true));
    a.props.only("can");
    a.hold = HOLDS.water;
    for (const i of beds) {
      const bed = spots.beds[i];
      yield* walk(a, bed.at);
      yield* turn(a, bed.yaw);
      a.look = bed.plants[1];
      yield* wait(a, 0.5);
      home.drops.pour(a.props.spout, 3);
      onEnd(a, () => home.drops.pour(null));
      yield* wait(a, 3);
      home.drops.pour(null);
      g.water(i);
      home.popAt(bed.plants[1], "room-pop room-pop-sparkle");
      a.beHappy(1);
      a.look = null;
      yield* wait(a, 0.4);
    }
    yield* walk(a, spots.can.at);
    yield* turn(a, spots.can.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    a.props.only();
    g.can.visible = true;
    a.hold = null;
  }

  /* ----- the walk: out of the front door, and back in ----- */

  // The dog on her lead, often the other person too; the cat stays home (and, with them all out, gets up to
  // mischief). They line up in single file inside the door, the dog first, clip on her lead, and
  // go out; out of sight they are out for a while, then come back in the same way, and the dog is petted.
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
    yield* file(door.inside, door.outside, -1);
    house.door.open = false;
    yield* wait(a, rnd(14, 24));
    house.door.open = true;
    yield* wait(a, 0.6);
    yield* file(door.outside, door.inside, 1);
    house.door.open = false;
    ev.party.forEach((m) => {
      m.who.out = false;
      m.who.harnessed = false;
      m.who.face(V);
    });
    a.leads = false;
    ev.over = true;
    walked.forEach((p) => later(a, act("pet", petPet, p))); // well done
  }
  function* walkAlong(a, ev, m) {
    yield* lineUp(a, ev, m);
    yield* until(() => ev.over, LONG_WAIT); // the host walks everyone
    a.walking = false;
  }
  function* lineUp(a, ev, m) {
    const { door } = spots;
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
    // Ears up, tail going, a bounce or two while they get the ball.
    Object.assign(a, { happy: true, look: human });
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

  // Stroke a pet standing beside it; it waits for the hand, then melts.
  function* petPet(a, p) {
    if (!p || !available(p) || p.above() > 0.5) return;
    const ev = event(a, "pet", { stroking: false, done: false });
    if (!invite(p, act("petted", bePetted, ev))) return;
    const [spot, side] = beside(a, [p.x, p.z], 15);
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

  // Feed a hungry pet: the bag from the counter, then kneel by the bowl and pour; maybe a stroke after.
  function* feed(a, p) {
    if (p.feeder !== a) return;
    onEnd(a, () => p.feeder === a && (p.feeder = null));
    yield* walk(a, spots.tin.at);
    yield* turn(a, spots.tin.yaw);
    a.hold = HOLDS.reach;
    yield* wait(a, 0.6);
    a.props.only("bag");
    a.hold = HOLDS.carry;
    if (!p.hungry) return;
    // Kneel on whichever side of the pet is clear.
    const gap = p.name === "collie" ? 34 : 30;
    const at = (s) => toward([p.x, p.z], s * gap, 4);
    const clearOf = ([x, z]) => home.actors.reduce((d, o) => (o === a || o === p ? d : Math.min(d, Math.hypot(o.x - x, o.z - z))), Infinity);
    const side = [-1, 1].filter((s) => nav.free(...at(s))).sort((s1, s2) => clearOf(at(s2)) - clearOf(at(s1)))[0] || 1;
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

  /* =================== the pets =================== */

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
    const free = [0, 1, 2, 3].filter((k) => !holder(`rug${k}`));
    if (!free.length) return false;
    const k = pick(free);
    claim(a, `rug${k}`);
    yield* walk(a, spots.rug[k]);
    a.face(V + rnd(-0.6, 0.6));
    a.lie = true;
    return true;
  }

  // Lie on the rug for a while, maybe nodding off.
  function* rug(a) {
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

  // The cat naps: on her tree, a free seat, the dog's bed, or the rug.
  function* catNap(a) {
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

  // Up on the window sill over the bed (by way of the bed), watching the sky and any bird going by.
  function* perch(a) {
    if (!claim(a, "sill") || !claim(a, "bedFoot")) return;
    const { at, bed: onBed, on, yaw } = spots.sill;
    yield* walk(a, at);
    a.ground = at;
    yield* hop(a, onBed);
    yield* wait(a, 0.2);
    yield* hop(a, on);
    a.face(yaw);
    a.sit = true;
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

  // Onto the desk beside his screen while he plays, lying there to watch (and maybe doze off).
  function* desk(a) {
    const ev = byName.boy?.event;
    if (!ev || ev.kind !== "pc" || ev.over || !claim(a, "desk")) return;
    const { at, on, yaw } = spots.desk;
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
    const b = house.garden.butterfly;
    const inGarden = (x, z) => x > X1 + 6 && z > LOFT.z1 + 6 && ground(x, z);
    const clear = (x, z) => inGarden(x, z) && home.actors.every((o) => o === a || o.out || Math.hypot(o.x - x, o.z - z) > 18); // not on top of the dog sunbathing
    a.look = { facePoint: () => b.position.toArray() };
    for (let k = 0; k < 3 && !home.night; k++) {
      const { x, z } = b.position;
      const spot =
        nav.randomSpot([x - 12, x + 12], [z - 12, z + 12], clear) ||
        freeSpot(
          a,
          [
            [X1 + 8, 200],
            [LOFT.z1 + 8, 100],
          ],
          18,
          inGarden
        );
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

  /* =================== the menu =================== */

  const pets = home.pets;
  const playing = () => {
    const ev = byName.boy?.event;
    return !!ev && ev.kind === "pc" && ev.playing && !ev.over;
  };
  const can = {
    tv: () => freeSeat(SOFA),
    nap: (a) => !a.human || freeSeat(),
    sleep: () => home.night && freeSeat(["bed0", "bed1"]),
    snack: () => !holder("fridge"),
    cook: (a) => a.name === "girl" && !holder("stove"),
    bake: (a) => a.human && !holder("stove") && !holder("fridge") && !holder("dine0") && !holder("dine1"),
    read: () => !holder("book"),
    water: () => !holder("plant"),
    pc: (a) => a.name === "boy" && !holder("pc") && !holder("chair"),
    watchPc: (a) => a.name === "girl" && playing() && !holder("watchPc"),
    laptop: () => !holder("laptop") && freeSeat(),
    game: (a) => available(other(a)) && !holder("sofa1") && (!holder("sofa0") || !holder("sofa2")),
    chat: (a) => available(other(a)),
    walk: () => available(byName.collie) && !home.actors.some((o) => o.out || o.event?.kind === "walk"),
    fetch: () => byName.collie && available(byName.collie) && home.ball.landed() && !holder("ball"),
    pet: () => pets.some((p) => available(p) && p.above() < 0.5),
    stretch: () => true,
    stroll: () => true,
    rest: () => true,
    bed: () => !holder("dogBed"),
    rug: () => [0, 1, 2, 3].some((k) => !holder(`rug${k}`)),
    zoomies: () => !home.night || Math.random() < 0.3,
    visit: () => humans.some(visitable),
    sniff: () => byName.cat && available(byName.cat) && byName.cat.above() < 0.5,
    perch: () => !holder("sill") && !holder("bedFoot"),
    climb: () => !holder("tree"),
    desk: () => playing() && !holder("desk"),
    groom: (a) => a.above() < 0.5,
    cuddle: () => byName.collie?.asleep && byName.collie.above() < 0.5,
    dress: (a) => a.name === "girl" && !home.night && !holder("closet"),
    fire: () => !house.fire.lit && !holder("fire"),
    fireside: () => house.fire.lit && [0, 1].some((k) => !holder(`fireside${k}`)),
    garden: () => !home.night && !holder("garden") && [0, 1, 2, 3].some((i) => house.garden.ripe(i) || house.garden.thirsty(i)),
    sunbathe: (a) =>
      !home.night && !holder("sunny") && home.actors.every((o) => o === a || o.out || Math.hypot(o.x - spots.sunny[0], o.z - spots.sunny[1]) > 20),
    chase: () => !home.night && !holder("butterfly"),
  };
  const petAPet = function* (a) {
    yield* petPet(a, pick(pets.filter((p) => available(p) && p.above() < 0.5)));
  };
  const runs = {
    tv,
    nap: (a) => (a.human ? nap(a) : catNap(a)),
    sleep,
    snack,
    cook,
    bake,
    read,
    water,
    pc,
    watchPc: (a) => watchPc(a),
    laptop,
    game,
    chat,
    walk: outing,
    fetch,
    pet: petAPet,
    stretch,
    stroll,
    rest,
    bed,
    rug,
    zoomies,
    visit,
    sniff,
    perch,
    climb: (a) => climb(a),
    desk,
    groom,
    cuddle,
    dress: dressUp,
    fire: lightFire,
    fireside,
    garden,
    sunbathe,
    chase,
    // Only when asked.
    hungry,
    feed,
    scold,
    mischief,
  };
  return Object.fromEntries(Object.entries(runs).map(([name, run]) => [name, { run, can: can[name] || (() => false) }]));
}
