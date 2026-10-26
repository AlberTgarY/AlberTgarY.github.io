/*******************************************************************************
 * The garden: the harvest into the basket and straight to the fridge (fruit
 * washed and eaten together), sowing a bed picked clean, watering, the
 * sprinkler and its tap, and running in from the rain.
 ******************************************************************************/

import { rnd, pick, clamp, wrap } from "../../stage.js";
import { X1 } from "../house.js";
import { HOLDS, MOVES } from "../props.js";
import { VEG } from "../veg.js";
import { V } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function gardenActs(c) {
  const {
    home,
    house,
    nav,
    byName,
    spots,
    walk,
    stepTo,
    turn,
    wait,
    until,
    glide,
    claim,
    holder,
    release,
    onEnd,
    t,
    ground,
    sprinkler,
    gardenWet,
    halfTowards,
  } = c;
  const askToBeg = (...args) => c.askToBeg(...args); // kitchen.js
  const meal = (...args) => c.meal(...args); // kitchen.js
  const claimSink = (...args) => c.claimSink(...args); // kitchen.js

  // The garden: the basket first if it was left out, with whatever is in it; then whatever is ripe,
  // picked into the basket and taken straight to the fridge; else a bed picked clean sown again; else the
  // dry beds watered.
  function* garden(a) {
    const g = house.garden;
    if (!claim(a, "garden")) return;
    const beds = (test) => [0, 1, 2, 3].filter(test);
    const ripe = beds(g.ripe);
    if (!holder("basket") && (ripe.length || g.basket.out())) return yield* harvest(a, ripe.length ? pick(ripe) : null);
    const spent = beds(g.spent);
    if (spent.length) return yield* sow(a, pick(spent));
    const dry = beds(g.thirsty);
    if (dry.length) yield* waterBeds(a, dry.slice(0, 2));
  }

  // Harvest: the basket from by the garden door (or wherever it was left), set down at each plant of bed `i`
  // in turn while they pick it clean, the dog maybe sitting on the path to watch; then in through the door
  // with it, straight to the fridge, the empty basket back out by the door, and the bed sown again. Fruit is
  // washed and eaten together instead, the basket left by the sink. Cut short, the basket is left where it
  // is, or put down where they stand, for whoever comes for it next.
  function* harvest(a, i) {
    const { basket } = house.garden;
    if (!claim(a, "basket")) return;
    onEnd(a, () => basket.carrier === a && basket.setDown(atHand(a, 6), a.yaw, [a.x, a.z]));
    yield* takeBasket(a);
    if (i !== null) yield* pickBed(a, i);
    release(a, "garden");
    // The fruit (of one kind) to wash and eat together; the rest, vegetables and all, into the fridge (the
    // fruit too, if asked to wrap up).
    const fruit = a.interrupt ? null : basket.bunches.find((b) => VEG[b.kind].fruit)?.kind ?? null;
    if (basket.bunches.some((b) => b.kind !== fruit)) yield* toFridge(a, fruit);
    if (fruit) return yield* fruitTime(a, fruit); // and that is enough for now: the basket waits by the sink
    if (a.interrupt) return; // asked to wrap up: the empty basket waits where it is, for next time
    if (basket.carrier !== a) yield* takeBasket(a);
    yield* walk(a, basket.homeStand);
    yield* bend(a, basket.homeAt, () => {
      basket.goHome();
      a.props.only();
    });
    a.hold = null;
    release(a, "basket");
    // Back out in the garden with the basket: on to sow a bed picked clean (the one just picked, if it was).
    const g = house.garden;
    const next = i !== null && g.spent(i) ? i : [0, 1, 2, 3].find(g.spent);
    if (next !== undefined && !gardenWet() && !a.interrupt && claim(a, "garden")) yield* sow(a, next); // asked to wrap up: next time
  }

  // A point `d` to the right of `a` (the hand things are set down with), or at its feet if that is no place.
  const atHand = (a, d) => {
    const at = [a.x - d * Math.cos(a.yaw), a.z + d * Math.sin(a.yaw)];
    return home.house.obstacles.some(([x0, x1, z0, z1]) => at[0] > x0 && at[0] < x1 && at[1] > z0 && at[1] < z1) ? [a.x, a.z] : at;
  };

  // Bend down (facing `to`, a point on the floor, if given) for something done there (`then()`), and up.
  function* bend(a, to, then) {
    if (to) yield* turn(a, Math.atan2(to[0] - a.x, to[1] - a.z));
    a.lie = true;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.45);
    then();
    yield* wait(a, 0.25);
    a.lie = false;
  }

  function* takeBasket(a) {
    const { basket } = house.garden;
    yield* walk(a, basket.stand);
    yield* bend(a, basket.at, () => {
      basket.pickUp(a);
      a.props.only("basket");
      a.props.fill(basket.pieces());
    });
    a.hold = HOLDS.basket;
  }

  // The basket set down at their right hand (by `stand`, where they are), or taken up again.
  function* basketDown(a, at) {
    const { basket } = house.garden;
    yield* bend(a, null, () => {
      basket.setDown(at, a.yaw, [a.x, a.z]);
      a.props.only();
    });
    a.hold = null;
  }

  function* basketUp(a) {
    const { basket } = house.garden;
    yield* bend(a, null, () => {
      basket.pickUp(a);
      a.props.only("basket");
      a.props.fill(basket.pieces());
    });
    a.hold = HOLDS.basket;
  }

  // Between the path and a spot by a bed (behind a plant, at the marker): straight out to the path, along it,
  // and straight in, so never across a bed (as the way from the nearest free floor might go).
  function* toBed(a, sp, at) {
    const path = sp.at[0];
    if (Math.abs(a.z - at[1]) > 2.5 || a.x < path) {
      if (a.x > path) yield* stepTo(a, [path, a.z]);
      yield* walk(a, [path, at[1]]);
    }
    yield* stepTo(a, at);
  }

  const offBed = (a, sp) => stepTo(a, [sp.at[0], a.z]);

  // Pick bed `i` clean, plant by plant: from behind each (facing it, and the viewer), the basket set down at
  // the right hand, kneeling to the low ones, every piece in turn from the top down into a bunch of its own
  // in the basket. Now and then a moment: a strawberry tasted, a fine one held up to admire, a stubborn
  // carrot that comes up all at once, a heavy pumpkin and a wipe of the brow. The dog, if she came to watch,
  // gets a carrot. Asked to wrap up, they stop after the plant they are at (before the first, they never go in).
  function* pickBed(a, i) {
    const g = house.garden;
    const { basket } = g;
    const veg = VEG[g.beds[i].kind];
    const sp = spots.beds[i];
    const ev = askToBeg(a, sp.watch, 0.5);
    const moments = { taste: !!veg.taste && Math.random() < 0.8, admire: Math.random() < 0.6, stuck: Math.random() < 0.6, wipe: !!veg.heavy };
    let entered = false;
    for (const k of [0, 1, 2]) {
      const fruits = g.left(i, k);
      if (a.interrupt) break;
      if (!fruits.length) continue;
      const spot = sp.plants[k];
      entered = true;
      yield* toBed(a, sp, spot.at);
      yield* turn(a, 0);
      yield* basketDown(a, spot.basket);
      const bunch = { kind: g.beds[i].kind, pieces: [] }; // into the basket with its first piece
      a.lie = veg.low;
      yield* wait(a, 0.4);
      for (const f of fruits.sort((p, q) => q.at[1] - p.at[1])) yield* pickOne(a, i, k, f, bunch, moments);
      Object.assign(a, { lie: false, look: null, hold: null, lean: 0 });
      yield* wait(a, 0.3);
      yield* basketUp(a);
    }
    if (!entered) {
      if (ev) ev.over = true;
      return;
    }
    const dog = byName.collie;
    if (ev && veg === VEG.carrot && dog.state === "beg") {
      // A carrot for the dog, held out low; she takes it and hops.
      yield* stepTo(a, [sp.watch[0] + 10, sp.watch[1]]);
      halfTowards(a, dog.x, dog.z, 0.3);
      yield* wait(a, 0.4);
      const bunch = basket.bunches.at(-1);
      if (bunch) {
        a.props.holdPiece(bunch.pieces.pop());
        if (!bunch.pieces.length) basket.bunches.pop();
        a.props.fill(basket.pieces());
        a.props.only("basket", "piece");
        a.hold = [HOLDS.treat[0], HOLDS.basket[1]];
        yield* wait(a, 1);
        ev.treat = true;
        a.props.only("basket");
        a.hold = HOLDS.basket;
        yield* wait(a, 0.6);
      }
    }
    if (ev) ev.over = true;
    a.beHappy(1.5);
    yield* wait(a, 0.4);
    yield* offBed(a, sp);
  }

  // One piece off plant `k` of bed `i`, by the kind's way of harvesting it, into `bunch` in the basket.
  function* pickOne(a, i, k, f, bunch, moments) {
    const g = house.garden;
    const { basket } = g;
    const veg = VEG[g.beds[i].kind];
    const into = [basket.at[0], 2, basket.at[1]];
    a.look = f.at;
    let piece;
    if (veg.how === "pull") {
      // Both hands on the tops, a tug or two, and up it comes; a stubborn one takes more, and comes up all at
      // once, sending them back a step.
      const stuck = moments.stuck && Math.random() < 0.5;
      if (stuck) moments.stuck = false;
      a.hold = HOLDS.grip;
      yield* wait(a, 0.3);
      a.hold = MOVES.tug;
      a.since = t();
      for (let n = 0; n < (stuck ? 4 : 2); n++) {
        a.lean = stuck ? -0.22 : -0.14;
        yield* wait(a, 0.2);
        a.lean = 0.04;
        yield* wait(a, 0.18);
      }
      piece = g.take(i, k, f);
      a.props.holdPiece(piece);
      a.props.only("piece");
      a.hold = HOLDS.pick;
      if (stuck) {
        a.lean = -0.45;
        a.hop();
        yield* glide(a, [a.x, a.z - 1.5], 0.25);
        a.pop("room-pop room-pop-star");
        yield* wait(a, 0.5);
        a.lean = 0;
        a.beHappy(1.2);
        yield* wait(a, 0.4);
      } else {
        a.lean = -0.12;
        yield* wait(a, 0.3);
        a.lean = 0;
      }
    } else if (veg.how === "lift") {
      // Both hands round it, a little twist this way and that to free it, and lifted out in both arms.
      a.hold = HOLDS.grip;
      yield* wait(a, 0.35);
      for (const side of [1, -1, 1]) {
        a.lean = 0.05 * side;
        yield* wait(a, 0.16);
      }
      piece = g.take(i, k, f);
      a.props.holdPiece(piece, true);
      a.props.only("armful");
      a.hold = HOLDS.tray;
      a.lean = veg.heavy ? -0.18 : -0.08;
      a.nod = veg.heavy ? -0.1 : 0;
      yield* wait(a, veg.heavy ? 0.8 : 0.5);
      a.lean = 0;
      a.nod = 0;
      a.beHappy(1);
      yield* wait(a, 0.3);
      a.look = into;
      a.hold = HOLDS.grip;
      yield* wait(a, 0.35);
      yield* intoBasket(a, piece, bunch);
      if (moments.wipe && !g.left(i, k).length && k === 2) {
        moments.wipe = false;
        a.hold = MOVES.wipe;
        a.since = t();
        yield* wait(a, 1);
      }
      return;
    } else {
      a.hold = f.at[1] - a.y > 10 ? HOLDS.reachUp : HOLDS.pick;
      yield* wait(a, rnd(0.35, 0.55));
      piece = g.take(i, k, f);
      a.props.holdPiece(piece);
      a.props.only("piece");
      if (moments.taste && Math.random() < 0.35) {
        // Into the mouth instead: mmm.
        moments.taste = false;
        a.look = null;
        a.hold = HOLDS.taste;
        yield* wait(a, 0.45);
        a.props.only();
        a.nod = 0.15;
        a.happy = true;
        a.pop();
        yield* wait(a, 1.1);
        a.nod = 0;
        a.happy = false;
        return;
      }
    }
    if (moments.admire && Math.random() < 0.2) {
      // A fine one: held up to admire.
      moments.admire = false;
      a.look = null;
      a.hold = HOLDS.admire;
      a.happy = true;
      yield* wait(a, 0.45);
      a.pop("room-pop room-pop-star");
      yield* wait(a, 0.9);
      a.happy = false;
    }
    a.look = into;
    a.hold = HOLDS.drop;
    yield* wait(a, 0.35);
    yield* intoBasket(a, piece, bunch);
  }

  function* intoBasket(a, piece, bunch) {
    const { basket } = house.garden;
    if (!bunch.pieces.length) basket.bunches.push(bunch);
    bunch.pieces.push(piece);
    basket.refill();
    a.props.only();
    yield* wait(a, 0.15);
  }

  // The basket in to the fridge: set down at their feet, the door opened, and kneeling, each bunch from it
  // into the crisper (but any of `keep`, fruit for the table); then the door shut, and the basket taken up
  // again.
  function* toFridge(a, keep = null) {
    const g = house.garden;
    const { basket } = g;
    const { fridge } = spots;
    if (!claim(a, "fridge")) {
      // Someone is at it: wait a little way off till they are done.
      yield* walk(a, [fridge.at[0] + 14, fridge.at[1] + 18]);
      yield* turn(a, fridge.yaw);
      if (!(yield* until(() => claim(a, "fridge"), 40))) return;
    }
    yield* walk(a, fridge.at);
    yield* turn(a, fridge.yaw);
    yield* basketDown(a, atHand(a, 6));
    a.atFridge = true;
    yield* wait(a, 0.5);
    a.lie = true;
    yield* wait(a, 0.3);
    for (let bunch; (bunch = basket.bunches.find((b) => b.kind !== keep)); ) {
      a.look = [basket.at[0], 2, basket.at[1]];
      a.hold = HOLDS.drop;
      yield* wait(a, 0.35);
      basket.bunches.splice(basket.bunches.indexOf(bunch), 1);
      basket.refill();
      a.props.holdPiece(bunch.pieces[0]);
      a.props.only("piece");
      a.look = fridge.crisper;
      a.hold = HOLDS.pick;
      yield* wait(a, 0.45);
      g.put(bunch.kind);
      a.props.only();
      yield* wait(a, 0.2);
    }
    Object.assign(a, { lie: false, look: null, hold: null });
    yield* wait(a, 0.3);
    a.atFridge = false;
    release(a, "fridge");
    a.beHappy(1);
    yield* basketUp(a);
  }

  // Fruit from the garden (`kind`, its bunches in the basket), for the two of them: at the sink, the basket
  // set down, the fruit out of it into the sink and rinsed under the tap, a watermelon cut into slices, all
  // on a plate (strawberries in a bowl) and to the table, the other called over to eat it together. The
  // basket waits by the sink till after.
  const ON_PLATE = { strawberry: [3, 8], watermelon: [6, 6] }; // pieces on the plate, at least and at most

  function* fruitTime(a, kind) {
    const { basket } = house.garden;
    const { sink } = spots;
    if (!(yield* claimSink(a, 45))) return;
    onEnd(a, () => Object.assign(house.sink, { running: false, fruit: null }));
    yield* walk(a, sink.at);
    yield* turn(a, sink.yaw);
    yield* basketDown(a, atHand(a, 6));
    a.look = [basket.at[0], 2, basket.at[1]];
    a.hold = HOLDS.drop;
    yield* wait(a, 0.4);
    const bunches = basket.bunches.filter((b) => b.kind === kind);
    basket.bunches = basket.bunches.filter((b) => b.kind !== kind);
    basket.refill();
    const picked = bunches.reduce((n, b) => n + b.pieces.length, 0);
    const big = VEG[kind].heavy;
    a.props.holdPiece(bunches[0].pieces[0], big);
    a.props.only(big ? "armful" : "piece");
    a.hold = big ? HOLDS.tray : HOLDS.carry;
    yield* wait(a, 0.4);
    a.look = sink.basin;
    a.hold = HOLDS.pick;
    yield* wait(a, 0.4);
    a.props.only();
    house.sink.fruit = kind;
    // Under the running tap, turned over in the hands, till it shines.
    house.sink.running = true;
    a.hold = MOVES.rinse;
    yield* wait(a, rnd(2.6, 3.4));
    home.popAt(sink.basin, "room-pop room-pop-sparkle");
    house.sink.running = false;
    a.hold = MOVES.shake;
    yield* wait(a, 0.6);
    if (kind === "watermelon") {
      a.props.only("knife");
      a.hold = MOVES.chop;
      yield* wait(a, 2.4);
      a.props.only();
    }
    a.hold = HOLDS.pick;
    yield* wait(a, 0.5);
    house.sink.fruit = null;
    const [lo, hi] = ON_PLATE[kind];
    const left = clamp(picked, lo, hi);
    a.props.plate(kind, left);
    a.props.only(kind);
    a.serving = true; // not to be called away now (life.js)
    a.hold = HOLDS.tray;
    a.beHappy(1);
    release(a, "sink");
    yield* wait(a, 0.4);
    yield* meal(a, kind, left);
  }

  // Sowing bed `i`, picked clean: a packet of seeds of something none of the beds has, its marker painted for
  // it; then at each plant what is left of the old one pulled up and tossed aside, a hole dug, the seeds
  // sprinkled in and patted down, and up comes a sprout; then the new bed watered. Cut short, the rest of the
  // bed is sown next time.
  function* sow(a, i) {
    const g = house.garden;
    const sp = spots.beds[i];
    a.props.packet(g.plan(i));
    a.props.only("seeds");
    a.hold = HOLDS.packet;
    yield* toBed(a, sp, sp.marker.at);
    yield* turn(a, Math.PI / 2);
    a.lie = true;
    a.look = sp.marker.look;
    a.hold = [HOLDS.pick[0], HOLDS.packet[1]];
    yield* wait(a, 0.9);
    g.relabel(i);
    home.popAt(sp.marker.look, "room-pop room-pop-sparkle");
    yield* wait(a, 0.4);
    a.lie = false;
    for (const k of [0, 1, 2]) {
      if (g.sown(i, k)) continue;
      const spot = sp.plants[k];
      yield* toBed(a, sp, spot.at);
      yield* turn(a, 0);
      a.lie = true;
      a.look = spot.plant;
      a.hold = HOLDS.packet;
      yield* wait(a, 0.4);
      if (g.leftover(i, k)) {
        // Pulled up with a tug, and tossed aside.
        a.hold = MOVES.tug;
        a.since = t();
        for (let n = 0; n < 2; n++) {
          a.lean = -0.15;
          yield* wait(a, 0.2);
          a.lean = 0.04;
          yield* wait(a, 0.18);
        }
        a.props.holdPiece(g.clear(i, k));
        a.props.only("piece");
        a.lean = -0.1;
        a.hold = HOLDS.throwOut;
        yield* wait(a, 0.35);
        a.props.only("seeds");
        a.lean = 0;
        a.hold = HOLDS.packet;
        yield* wait(a, 0.2);
      }
      a.hold = MOVES.dig;
      yield* wait(a, 0.9);
      a.hold = MOVES.sprinkle;
      yield* wait(a, 0.8);
      g.sowOne(i, k);
      a.hold = MOVES.pat;
      yield* wait(a, 0.7);
      a.hold = HOLDS.packet;
      a.lie = false;
      yield* wait(a, 0.25);
    }
    g.done(i);
    yield* offBed(a, sp);
    a.props.only();
    a.look = null;
    a.hold = MOVES.shake; // the soil off the hands
    yield* wait(a, 0.6);
    a.hold = null;
    a.beHappy(1.5);
    home.popAt(sp.mid, "room-pop room-pop-sparkle");
    yield* wait(a, 0.5);
    if (!gardenWet() && !a.interrupt) yield* waterBeds(a, [i]);
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
      a.look = bed.mid;
      yield* wait(a, 0.5);
      home.drops.pour(a.props.spout, 3);
      onEnd(a, () => home.drops.pour(null));
      yield* wait(a, 3);
      home.drops.pour(null);
      g.water(i);
      home.popAt(bed.mid, "room-pop room-pop-sparkle");
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

  /* ----- the sprinkler ----- */

  // The sprinkler (by day, out of the rain): kneeling at the tap on the garden wall, its handle turned,
  // and a happy look at the jet going round over the beds. Now and then its head was left
  // facing the tap, and the jet comes straight at them: up, hands over the head, they run over through it
  // to turn the head round, then stand shaking the water off their hands, dripping (and leave wet footprints
  // indoors).
  function* sprinkle(a) {
    if (sprinkler.on || !claim(a, "sprinkler")) return;
    onEnd(a, () => sprinkler.wrong && sprinkler.fix()); // never left soaking the tap
    const { tap, fix, head, tap3 } = sprinkler.spots;
    yield* walk(a, tap.at);
    yield* pressSwitch(a, tap, tap3, () => sprinkler.start(t(), Math.random() < 0.3));
    a.look = head;
    if (sprinkler.wrong) {
      a.lie = false;
      yield* until(() => a.wet > 0.12, 2.5);
      a.pop("room-pop room-pop-drop");
      a.hold = MOVES.flail;
      a.hop();
      yield* wait(a, 0.8);
      yield* walk(a, fix.at, 1.8);
      yield* turn(a, fix.yaw);
      a.lie = true; // crouched by it
      a.hold = MOVES.twist;
      yield* wait(a, 0.8);
      sprinkler.fix();
      a.hold = null;
      a.lie = false;
      yield* wait(a, 0.5);
      a.look = null;
      yield* turn(a, V);
      a.hold = MOVES.shake;
      yield* wait(a, 1.3);
      a.hold = null;
      a.pop("room-pop room-pop-drop");
      a.beHappy(1.5); // and laughs it off
      yield* wait(a, 1);
    } else {
      yield* wait(a, 1.6);
      a.lie = false;
      a.pop();
      a.beHappy(1.5);
      yield* wait(a, 1.2);
    }
    a.look = null;
    release(a, "sprinkler");
    yield* walk(a, spots.gardenDoor.inside); // in, out of the way of the spray
  }

  // Kneeling to the tap (`tap`, looking at its handle at `at`), a turn of it, and `then()` as the water comes.
  function* pressSwitch(a, tap, at, then) {
    yield* turn(a, tap.yaw);
    a.lie = true;
    a.look = at;
    yield* wait(a, 0.35);
    a.hold = MOVES.press;
    a.since = t();
    yield* wait(a, 0.45);
    then();
    yield* wait(a, 0.35);
    a.hold = null;
  }

  // Off again at the tap, once it has run a while (life.js sends someone).
  function* sprinklerOff(a) {
    if (!sprinkler.on || !claim(a, "sprinkler")) return;
    const { tap, tap3 } = sprinkler.spots;
    const rain = () => home.weather.raining;
    if (rain()) a.hold = MOVES.flail; // out into it, hands over the head
    yield* walk(a, tap.at, rain() ? 1.8 : 1);
    yield* pressSwitch(a, tap, tap3, () => sprinkler.stop(t()));
    a.lie = false;
    a.look = null;
    release(a, "sprinkler");
    if (rain()) return yield* shelter(a);
    yield* wait(a, 0.6);
    yield* walk(a, spots.gardenDoor.inside);
  }

  // Caught in the garden by the rain (life.js sends them in, whatever they were doing): in through the
  // garden door at a run, a person with hands over the head; inside, wet through, the rain shaken off the
  // hands, or the dog shaking herself nose to tail, dripping, and wet footprints after.
  function* shelter(a) {
    if (a.human) a.hold = MOVES.flail;
    const path = spots.beds[0].at[0];
    if (a.x > path + 2 && !a.out) yield* stepTo(a, [path, a.z], 1.8); // out from among the beds first, not across one
    yield* walk(a, spots.gardenDoor.inside, 1.8);
    a.hold = null;
    a.wet = Math.max(a.wet, 0.4);
    yield* turn(a, V);
    if (a.human) {
      a.hold = MOVES.shake;
      yield* wait(a, 1.2);
      a.hold = null;
    } else if (a.name === "collie") {
      a.shakeUntil = t() + 1.3;
      yield* wait(a, 1.4);
    }
  }

  // The dog in the sprinkler: bounding over to where the jet is about to come round to, waiting for it
  // with her eyes on it, and leaping and snapping at the drops as it comes down on her; again and again;
  // then out of the garden to shake herself off, and in with wet paws.
  function* splash(a) {
    if (!claim(a, "splash")) return;
    const [sx, sz] = sprinkler.at;
    const lawn = (x, z) => x > X1 + 6 && ground(x, z) && Math.hypot(x - sx, z - sz) > 14;
    const heading = (x, z) => Math.atan2(x - sx, z - sz);
    for (let k = 0; k < 5 && sprinkler.on && !sprinkler.wrong; k++) {
      const ahead = sprinkler.heading + 1; // where the jet comes round to in about 3 s
      const r = rnd(16, 36);
      const [x, z] = [sx + Math.sin(ahead) * r, sz + Math.cos(ahead) * r];
      const spot = nav.randomSpot([x - 12, x + 12], [z - 12, z + 12], lawn);
      if (!spot) continue;
      yield* walk(a, spot, 1.6);
      a.look = sprinkler.spots.head;
      a.bow = true; // ready for it
      yield* until(() => Math.abs(wrap(sprinkler.heading - heading(a.x, a.z))) < 0.12 || !sprinkler.on, 6);
      a.bow = false;
      a.happy = true;
      for (let j = 0; j < 3; j++) {
        a.hop();
        yield* wait(a, 0.45);
      }
      yield* wait(a, rnd(0.3, 0.8));
    }
    a.bow = false;
    a.happy = false;
    a.look = null;
    release(a, "splash");
    sprinkler.splashedAt = t();
    yield* walk(a, spots.gardenDoor.outside);
    if (a.wet > 0.05) {
      a.shakeUntil = t() + 1.3;
      yield* wait(a, 1.4);
    }
  }

  /* ----- the walk: out of the front door, and back in ----- */

  return { garden, sprinkle, sprinklerOff, shelter, splash };
}
