/*******************************************************************************
 * The kitchen: a snack from the fridge or the freezer (a treat for the dog, the
 * empty box in the bin), cooking at the hob (a soup in the pot, a stir-fry in
 * the frying pan, or both) and dishing it up, baking in the oven, and a meal
 * together at the table: the bowls and chopsticks out of the cupboard first,
 * and after, each clearing their own to the sink and into the dishwasher.
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
    anew,
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

  // Cooking (her): a soup in the pot, a stir-fry in the frying pan, or both at once. At the hob, a burner
  // turned on under each and the vegetables in; then stirring the pot as it steams, or tossing the pan as it
  // sizzles (with both, turning from the one to the other every few seconds); dished up and carried to the
  // table (a trip for each), and pork rice there with it, him called over to eat with her, and the dog
  // hoping for a bite.
  function* cook(a) {
    if (!claim(a, "stove")) return;
    const { garden, stove } = house;
    const recipe = pick(["soup", "stirfry", "both"]);
    const uses = recipe === "both" ? ["pot", "pan"] : [recipe === "soup" ? "pot" : "pan"];
    onEnd(a, () => Object.assign(stove, { potOn: false, panOn: false, frying: false, tossing: false }));
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
    yield* walk(a, spots.stove[uses.length > 1 ? "both" : uses[0]]);
    yield* turn(a, spots.stove.yaw[uses[0]]);
    for (const key of uses) {
      a.look = spots.stove.look[key];
      a.hold = HOLDS.pick; // the knob, and in with the vegetables
      yield* wait(a, 0.6);
      a.props.only();
      stove[key + "On"] = true;
      if (key === "pan") stove.frying = true;
      yield* wait(a, 0.2);
    }
    let sniffAt = t() + rnd(3, 5);
    let at = null;
    const start = t();
    const end = start + rnd(12, 16);
    while (t() < end) {
      const key = uses[Math.floor((t() - start) / 4) % uses.length];
      if (key !== at) {
        at = key;
        if (uses.length > 1) yield* turn(a, spots.stove.yaw[key]);
        a.look = spots.stove.look[key];
        a.hold = key === "pan" ? MOVES.toss : MOVES.stir;
        stove.tossing = key === "pan";
      }
      if (t() > sniffAt) {
        home.popAt(
          spots.stove.look[at].map((v, i) => (i === 1 ? v + 6 : v)),
          "room-pop room-pop-sparkle"
        ); // smells good
        a.beHappy(1);
        sniffAt = t() + rnd(3, 5);
      }
      yield;
    }
    Object.assign(stove, { potOn: false, panOn: false, tossing: false });
    a.hold = null;
    a.serving = true; // not to be called away now (life.js)
    yield* serve(a, uses);
    yield* meal(a);
  }

  // Dish up what is on the hob (`uses`: "pot" or "pan", one after the other) and carry each to the table,
  // set down in the middle to steam there till it is cleared away with the bowls.
  function* serve(a, uses) {
    const { stove, dinner } = house;
    onEnd(a, () => (dinner.cooked = [])); // (cut short, it goes with them)
    for (const [i, key] of uses.entries()) {
      if (i) {
        yield* walk(a, spots.stove[key]);
        yield* turn(a, spots.stove.yaw[key]);
      }
      a.look = spots.stove.look[key];
      a.hold = HOLDS.pick;
      yield* wait(a, 0.7);
      const kind = key === "pan" ? "stirfry" : "soup";
      if (key === "pan") stove.frying = false;
      a.props.only(kind);
      a.hold = HOLDS.tray;
      a.look = null;
      yield* wait(a, 0.3);
      yield* walk(a, spots.dining.serve.at);
      yield* turn(a, spots.dining.serve.yaw);
      a.look = spots.dining.dish;
      a.hold = HOLDS.pick;
      yield* wait(a, 0.5);
      a.props.only();
      dinner.cooked.push(kind);
      yield* wait(a, 0.3);
      a.hold = null;
      a.look = null;
    }
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
  // called too. The clearing up after is his if he ate too (clearTable), hers if she ate alone. For fruit from the garden (`left` pieces on its plate), they
  // eat from the plate together till it is empty, waiting for someone on their way while there is enough.
  function* meal(a, dish = null, left = 0) {
    anew(a); // (after the cooking, or the harvest)
    const fruit = FRUIT_DISHES.includes(dish) ? dish : null;
    const seat = takeSeat(a, ["dine0", "dine1"]);
    if (!seat) {
      a.props.only();
      return yield* eatRice(a);
    }
    a.serving = true; // at the table with what they made: not to be called away (life.js)
    const b = other(a);
    const ev = event(a, "meal", { ready: false, guest: null });
    const away = () => !b || b.out || ["walk", "wander"].includes(b.jobName);
    const there = () => !!b && b.seated && !!b.seatKey?.startsWith("dine");
    // Whether the other is (now) on their way: called, once, unless they are out or already at the table. They
    // are waited for (a while, or for as long as they are on their way to the table).
    const calling = () => !ev.guest && !away() && !there() && (b.pending?.ev === ev || b.event === ev || summon(b, act("dine", dine, ev)));
    const waitFor = function* (secs) {
      const end = t() + secs;
      let shoutAt = t() + 0.8;
      while ((t() < end || b.event === ev) && !there() && !away()) {
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
    const handedOn = () => ev.guest?.name === "boy" && ev.guest !== a && ev.guest.event === ev; // (he clears up)
    const late = function* () {
      if (house.dinner.left >= 2 && calling() && !there()) yield* waitFor(20);
    };
    ev.eat = (who, friend) => (fruit ? eatFruit(who, friend, fruit, who === a ? late : null) : eatRice(who, friend, who === a ? calling : null));
    calling();
    const laying = !dish && (yield* fetchBowls(a)); // rice: bowls and chopsticks for the two of them first
    yield* sitOn(a, seat);
    if (laying) {
      a.hold = HOLDS.pick;
      yield* wait(a, 0.5);
      a.props.only();
      house.dinner.laid.add("dine0").add("dine1");
      onEnd(a, () => !handedOn() && house.dinner.laid.delete(seat.key)); // (cut short, theirs is gone with them)
      yield* wait(a, 0.3);
      a.hold = null;
    }
    if (dish) {
      onEnd(a, () => !handedOn() && (house.dinner.dish = null));
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
    if (a.name === "boy" || ev.guest?.name !== "boy") yield* clearTable(a, ev);
  }

  // The bowls and chopsticks for two out of the cupboard under the counter: the drawer out for the
  // chopsticks, the door open, up to the shelf for the bowls, and both shut again with a nudge. False if
  // someone else is at the cupboard or the fridge (opened from the same place).
  function* fetchBowls(a) {
    if (!claim(a, "cupboard")) return false;
    if (!claim(a, "fridge")) {
      release(a, "cupboard");
      return false;
    }
    const { cupboard } = house;
    cupboard.using = a; // (a visitor's clicks do nothing till they are done)
    onEnd(a, () => Object.assign(cupboard, { door: false, drawer: false, using: null }));
    yield* walk(a, spots.cupboard.at);
    yield* turn(a, spots.cupboard.yaw);
    a.look = spots.cupboard.inside;
    a.hold = HOLDS.pick;
    cupboard.clicked.door = cupboard.clicked.drawer = false; // (if a visitor left them open, theirs now)
    cupboard.drawer = true;
    yield* wait(a, 0.8);
    cupboard.door = true;
    yield* wait(a, 0.4);
    a.hold = HOLDS.reach;
    yield* wait(a, 0.8);
    a.props.only("bowls");
    a.hold = HOLDS.tray;
    yield* wait(a, 0.3);
    cupboard.door = false;
    yield* wait(a, 0.5);
    cupboard.drawer = false;
    yield* wait(a, 0.3);
    a.look = null;
    cupboard.using = null;
    release(a, "cupboard");
    release(a, "fridge");
    return true;
  }

  // Everything off the table once whoever ate with them has finished (the bowls and chopsticks, what was
  // cooked, or the dish or the plate of fruit with what is left on it), all to the sink in one go and washed up.
  // Cut short, whatever is left there goes with them.
  function* clearTable(a, ev) {
    const { dinner } = house;
    onEnd(a, () => {
      dinner.laid.clear();
      dinner.cooked = [];
      dinner.dish = null;
    });
    const guest = ev.guest !== a ? ev.guest : ev.host;
    if (guest && guest !== a) yield* until(() => guest.event !== ev || ev.eaten?.has(guest), 20);
    const { dish } = dinner;
    const n = dinner.laid.size + dinner.cooked.length;
    if (!dish && !n) return;
    a.look = spots.dining.dish;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    if (FRUIT_DISHES.includes(dish)) a.props.plate(dish, dinner.left); // what is left of it
    a.props.only(dish || (n > 1 ? "bowls" : "bowl"));
    dinner.laid.clear();
    dinner.cooked = [];
    dinner.dish = null;
    a.hold = HOLDS.tray;
    a.look = null;
    yield* washUp(a, dish ? 1 : n);
  }

  // What is in their hands (`n` things), to the sink to rinse under the tap, and into the dishwasher (on
  // with it once there are two or more in it); while it is washing, or full, left by the sink. With someone
  // at the sink, they wait their turn.
  function* washUp(a, n = 1) {
    if (!(yield* claimSink(a, 45))) return a.props.only();
    const { sink, dishwasher: dw } = house;
    onEnd(a, () => (sink.running = dw.open = false));
    yield* walk(a, spots.sink.at);
    yield* turn(a, spots.sink.yaw);
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    sink.soap = true; // a squeeze of washing-up liquid
    onEnd(a, () => (sink.soap = false));
    yield* wait(a, 0.6);
    sink.soap = false;
    yield* wait(a, 0.2);
    sink.running = true;
    a.hold = MOVES.stir; // a scrub
    yield* wait(a, 1.6);
    sink.running = false;
    home.popAt(spots.sink.basin, "room-pop room-pop-sparkle");
    a.hold = HOLDS.tray;
    if (dw.running || dw.load + n > dw.slots) {
      a.hold = HOLDS.pick;
      yield* wait(a, 0.4);
      a.props.only(); // on the drainer
    } else {
      // The door down, the rack out, a stoop to stand it in the rack, and the rack in and the door up.
      yield* walk(a, spots.dishwasher.at);
      yield* turn(a, spots.dishwasher.yaw);
      a.look = spots.dishwasher.rack;
      a.hold = HOLDS.pick;
      dw.open = true;
      yield* until(() => dw.out > 0.85, 3);
      a.lie = true; // stooping
      yield* wait(a, 0.5);
      a.props.only();
      dw.load += n;
      yield* wait(a, 0.4);
      a.lie = false;
      dw.open = false;
      yield* until(() => dw.k < 0.08, 3);
      if (dw.load >= 2) {
        yield* wait(a, 0.3); // the button
        dw.start(t());
        a.beHappy(0.8);
      }
    }
    a.hold = null;
    a.look = null;
    yield* wait(a, 0.3);
    release(a, "sink");
  }

  // Called to the table: sit beside them, wait for them (looking over), eat together, and stay a moment
  // after; he clears the table after (clearTable).
  function* dine(a, ev) {
    const seat = takeSeat(a, ["dine1", "dine0"]);
    if (!seat || ev.over) return;
    yield* sitOn(a, seat);
    ev.guest = a;
    const host = ev.host;
    a.look = host;
    yield* until(() => ev.ready || ev.over, 30);
    if (ev.ready) yield* ev.eat(a, host);
    (ev.eaten ||= new Set()).add(a);
    a.look = host;
    yield* wait(a, rnd(0.8, 2));
    a.look = null;
    yield* getUp(a);
    if (a.name === "boy") yield* clearTable(a, ev); // (she leaves it to him)
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
    const { laid } = house.dinner;
    const mine = laid.has(a.seatKey) ? a.seatKey : null; // (picked up off the table, filled, and eaten from)
    if (mine) laid.delete(mine);
    a.setState("trick", SNACKS.porkRice, "porkRice");
    while (t() < a.until) {
      each?.();
      a.look = friend && friend.seatKey?.startsWith("dine") && Math.sin(t() * 0.9) > 0.6 ? friend : null;
      yield;
    }
    a.setState("idle");
    if (mine) laid.add(mine);
    a.look = null;
    a.happy = true;
    if (Math.random() < 0.6) a.pop();
    yield* wait(a, 1.4);
    a.happy = false;
  }

  return { snack, toBin, askToBeg, cook, bake, meal, claimSink };
}
