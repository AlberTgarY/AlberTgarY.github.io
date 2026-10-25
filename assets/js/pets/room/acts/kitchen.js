/*******************************************************************************
 * The kitchen: a snack from the fridge or the freezer (a treat for the dog, the
 * empty box in the bin), cooking at the stove, baking in the oven, and a meal
 * together at the table.
 ******************************************************************************/

import { rnd, pick } from "../../stage.js";
import { HOLDS, MOVES, DISHES, FRUIT_DISHES } from "../props.js";
import { VEG } from "../veg.js";
import { part } from "../../models/voxels.js";
import { V, SNACKS } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function kitchenActs(c) {
  const {
    home,
    house,
    byName,
    spots,
    walk,
    turn,
    wait,
    until,
    sitOn,
    getUp,
    claim,
    release,
    act,
    event,
    available,
    invite,
    summon,
    onEnd,
    t,
    other,
    takeSeat,
    halfTowards,
  } = c;
  const beg = (...args) => c.beg(...args); // pets.js

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
    yield* wait(a, 0.4); // the fridge stays theirs till they are done: they eat it standing in front of it
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
    if (garden.store.length && claim(a, "fridge")) {
      // A bunch of the garden's vegetables out of the crisper first, for the pot (the oldest).
      yield* walk(a, spots.fridge.at);
      yield* turn(a, spots.fridge.yaw);
      a.atFridge = true;
      yield* wait(a, 0.5);
      a.look = spots.fridge.crisper;
      a.hold = HOLDS.pick;
      yield* wait(a, 0.8);
      const bunch = part();
      VEG[garden.takeOut()].stored(bunch, 0, 0);
      a.props.holdPiece(bunch);
      a.props.only("piece");
      a.look = null;
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

  // Baking (either of them): a roast chicken or a lasagna out of the fridge (pale, uncooked) and into the
  // oven, kneeling to let its door down; it bakes (browning) while they wait by it, crouching to peek
  // through the glass, the smell drifting up, till it is done; out of the oven, onto the table (steaming),
  // the other called over to eat it with them, and the dish to the sink after.
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
    a.props[dish].userData.bake(0); // uncooked
    a.props.only(dish);
    a.hold = HOLDS.tray;
    a.atFridge = false;
    yield* wait(a, 0.4);
    release(a, "fridge");
    yield* claimSink(a, 40); // the sink is right beside the oven door: no one at it while they bake
    yield* atOven(a, () => {
      a.props.only();
      oven.dish = dish;
      oven.baked = 0;
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
    oven.baked = 1; // golden brown
    home.popAt(smell, "room-pop room-pop-star"); // ding!
    a.pop();
    yield* wait(a, 0.6);
    yield* atOven(a, () => {
      oven.dish = null;
      a.props[dish].userData.bake(1);
      a.serving = true; // not to be called away now (life.js)
      a.props.only(dish);
    });
    a.hold = HOLDS.tray;
    a.look = null;
    release(a, "stove");
    release(a, "sink");
    yield* meal(a, dish);
  }

  // The sink for `a`: theirs, or once whoever is at it is done (waiting a little way off), for at most `secs`;
  // whether they got it.
  function* claimSink(a, secs) {
    if (claim(a, "sink")) return true;
    yield* walk(a, [spots.sink.at[0] + 4, spots.sink.at[1] + 16]);
    yield* turn(a, spots.sink.yaw);
    return yield* until(() => claim(a, "sink"), secs);
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

  // At the table with what was made: sit down (a dish from the oven goes in the middle), and wait for the
  // other, called over out of whatever they are doing ("dinner's ready!" now and then till they come), unless
  // they are out of the house; then eat, the dog hoping for a bite. Someone who comes home in the middle is
  // called too. A dish goes to the sink after. For fruit from the garden (`left` pieces on its plate), they
  // eat from the plate together till it is empty, waiting for someone on their way while there is enough.
  function* meal(a, dish = null, left = 0) {
    const fruit = FRUIT_DISHES.includes(dish) ? dish : null;
    const seat = takeSeat(a, ["dine0", "dine1"]);
    if (!seat) {
      a.props.only();
      return yield* eatRice(a);
    }
    a.serving = true; // at the table with what they made: not to be called away (life.js)
    const b = other(a);
    const ev = event(a, "meal", { ready: false, guest: null });
    const away = () => !b || b.out || b.jobName === "walk";
    const there = () => !!b && b.seated && !!b.seatKey?.startsWith("dine");
    // Whether the other is (now) on their way: called, once, unless they are out or already at the table.
    const calling = () => !ev.guest && !away() && !there() && (b.pending?.ev === ev || b.event === ev || summon(b, act("dine", dine, ev)));
    const waitFor = function* (secs) {
      const end = t() + secs;
      let shoutAt = t() + 0.8;
      while (t() < end && !there() && !away()) {
        calling();
        a.look = b;
        if (t() > shoutAt) {
          a.show("say", "room-say room-say-bowl");
          yield* wait(a, 1.4);
          a.show("say", null);
          shoutAt = t() + rnd(5, 8);
        }
        yield;
      }
      a.look = null;
    };
    const late = function* () {
      if (house.dinner.left >= 2 && calling() && !there()) yield* waitFor(20);
    };
    ev.eat = (who, friend) => (fruit ? eatFruit(who, friend, fruit, who === a ? late : null) : eatRice(who, friend, who === a ? calling : null));
    calling();
    yield* sitOn(a, seat);
    if (dish) {
      onEnd(a, () => (house.dinner.dish = null));
      a.look = spots.dining.dish;
      a.hold = HOLDS.pick;
      yield* wait(a, 0.5);
      a.props.only();
      Object.assign(house.dinner, { dish, left, hot: DISHES.includes(dish) }); // out of the oven, steaming
      yield* wait(a, 0.3);
      a.hold = null;
      a.look = null;
    }
    yield* waitFor(90);
    ev.ready = true;
    const begging = askToBeg(a, spots.dining.beg, 0.5);
    a.event = ev; // still the meal's host; the dog's begging is over with it
    if (begging) onEnd(a, () => (begging.over = true));
    yield* ev.eat(a, b);
    yield* treat(a, begging);
    ev.over = true; // too late to come now
    yield* getUp(a);
    if (!dish) return;
    // Clear the dish away to the sink, and rinse it.
    a.look = spots.dining.dish;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    if (fruit) a.props.plate(dish, house.dinner.left); // what is left of it
    house.dinner.dish = null;
    a.props.only(dish);
    a.hold = HOLDS.tray;
    a.look = null;
    yield* claimSink(a, 45);
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
    release(a, "sink");
  }

  // Called to the table: sit beside them, wait for them (looking over), eat together, and stay a moment
  // after they get up.
  function* dine(a, ev) {
    const seat = takeSeat(a, ["dine1", "dine0"]);
    if (!seat || ev.over) return;
    yield* sitOn(a, seat);
    ev.guest = a;
    const host = ev.host;
    a.look = host;
    yield* until(() => ev.ready || ev.over, 30);
    if (ev.ready) yield* ev.eat(a, host);
    a.look = host;
    yield* wait(a, rnd(0.8, 2));
    a.look = null;
    yield* getUp(a);
  }

  // Fruit off the plate on the table, a piece at a time, a happy munch with each, till the plate is empty
  // (shared with whoever eats with them, house.dinner.left counting down); a glance at them now and then.
  // `between` (the host's) runs before each piece.
  function* eatFruit(a, friend, kind, between = null) {
    const { dinner } = house;
    while (dinner.dish === kind && dinner.left > 0) {
      if (between) yield* between();
      a.look = spots.dining.dish;
      a.hold = HOLDS.pick;
      yield* wait(a, rnd(0.4, 0.6));
      if (dinner.dish !== kind || dinner.left <= 0) break;
      dinner.left--;
      a.props.bite(kind);
      a.props.only("bite");
      a.hold = HOLDS.taste;
      a.look = friend?.seatKey?.startsWith("dine") && Math.random() < 0.4 ? friend : null;
      yield* wait(a, 0.5);
      a.props.only();
      a.nod = 0.12;
      a.happy = true;
      if (Math.random() < 0.35) a.pop();
      yield* wait(a, rnd(0.9, 1.4));
      Object.assign(a, { nod: 0, happy: false, hold: null });
      yield* wait(a, rnd(0.6, 1.8));
    }
    a.look = null;
    a.hold = null;
    a.beHappy(1.2);
    yield* wait(a, 1.2);
  }

  // A bowl of pork rice, a glance at whoever eats with them now and then, and a happy sigh at the end.
  // `each` (the host's) runs every frame.
  function* eatRice(a, friend = null, each = null) {
    a.setState("trick", SNACKS.porkRice, "porkRice");
    while (t() < a.until) {
      each?.();
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

  return { snack, toBin, askToBeg, cook, bake, meal, claimSink };
}
