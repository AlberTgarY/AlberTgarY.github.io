/*******************************************************************************
 * The computer in the loft: his games, with the headphones on and his team to
 * talk to; her shows and her farm game; and her watching him play.
 ******************************************************************************/

import { rnd, pick } from "../../stage.js";
import { HOLDS, MOVES } from "../props.js";
import { GAMES, SIDES, DRAMAS, GIRL_GAMES, dramaMoment, stardewMoment } from "../screens.js";
import { V, TEAM_SAY } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function pcActs(c) {
  const {
    house,
    byName,
    spots,
    walk,
    turn,
    wait,
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
    takeSeat,
    halfTowards,
  } = c;

  // The boy at his computer in the loft: his headphones off their stand and on, a few rounds, mostly of a
  // different game each time (picked in his launcher; the side screen changes now and then too), talking to
  // his team through the mic; a win and he spins his chair round to cheer, a loss and he slumps. Asked to
  // wrap up, he finishes the round. The girl may come up to watch, and he gives the cat a look if she comes
  // to lie on his computer. The headphones go back on their stand after.
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
    const ev = event(a, "pc", { playing: true, round: 0, result: null });
    const girl = byName.girl;
    if (girl && Math.random() < 0.3 && !holder("watchPc")) invite(girl, act("watchPc", watchPc, ev));
    const cat = byName.cat;
    const rounds = 3 + Math.floor(Math.random() * 3);
    let game = null;
    let side = null;
    for (let r = 0; r < rounds && !a.interrupt; r++) {
      if (!game || Math.random() < 0.7) {
        game = pick(GAMES.filter((g) => g !== game));
        if (!side || Math.random() < 0.5) side = pick(SIDES.filter((s) => s !== side));
        house.pc.side = side;
        house.pc.set("menu", t(), game);
        yield* wait(a, rnd(1.6, 2.4));
      }
      house.pc.set("game", t(), game);
      const end = t() + rnd(10, 16);
      let talkUntil = 0;
      let talkAt = t() + rnd(3, 6);
      let catAt = t() + rnd(2, 4);
      let lookUntil = 0;
      while (t() < end && !a.interrupt) {
        if (t() > talkAt) {
          talkUntil = t() + 1.6;
          talkAt = t() + rnd(5, 9);
          a.show("say", `room-say room-say-${pick(TEAM_SAY)}`);
        }
        a.talk = t() < talkUntil;
        house.pc.talking = a.talk;
        if (!a.talk) a.show("say", null);
        if (holder("tower") === cat && cat.above() > 5 && t() > catAt) {
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

  // The girl at his computer (his headphones stay on their stand), for a good while: an episode of one of her
  // dramas, or a day of her farm game. She goes with what happens on the screen (screens.js): a laugh at the
  // funny bits, a gasp at a twist, a sigh over the couple, a tear at the sad parts, leaning in when it gets
  // tense; on the farm, pleased with each harvest, catch, find and gift. He may come up and watch with her.
  // Called away with a good part still to go (to eat, to feed a pet), she comes back to it after, if it is not
  // long after and the computer is free, and watches on from where she was.
  const RESUME = 300; // s she would still come back to it
  const backTo = (a) => a.resume && t() < a.resume.by;
  // Back to it after what called her away, unless that took too long (a night's sleep).
  function* watchOn(a) {
    if (backTo(a)) yield* pcGirl(a);
  }
  function* pcGirl(a) {
    if (!claim(a, "pc")) return;
    const seat = takeSeat(a, ["chair"]);
    if (!seat) return;
    let left = 0; // s of it for her
    let on = null; // what she is watching or playing, from when
    onEnd(a, () => {
      house.pc.set("off", t());
      house.pc.sitter = null;
      const rest = on && left - (t() - on.at);
      if (rest > 10) a.resume = { ...on.what, from: on.from + t() - on.at, left: rest, by: t() + RESUME };
      if (rest > 10 || (!on && backTo(a))) later(a, act("pcGirl", watchOn)); // (or called away on her way back to it)
    });
    yield* sitOn(a, seat);
    const back = backTo(a) ? a.resume : null; // where she was, if called away from it
    a.resume = null;
    left = back ? back.left : rnd(90, 150);
    house.pc.sitter = a;
    a.look = spots.monitor;
    const farm = back ? back.farm : Math.random() < 0.35;
    const show = back ? back.show : farm ? pick(GIRL_GAMES) : pick(DRAMAS);
    const seed = back ? back.seed : Math.floor(t());
    const from = back ? back.from : 0;
    house.pc.set(farm ? "game" : "show", t(), show, seed, from);
    on = { at: t(), from, what: { farm, show, seed } };
    const into = () => from + t() - on.at;
    const moment = () => (farm ? stardewMoment(into(), seed) : dramaMoment(show, into(), seed));
    const boy = byName.boy;
    const ev =
      !back && boy && Math.random() < 0.3 && !holder("watchPc") && available(boy) ? event(a, "pc", { playing: true, round: 0, result: null }) : null;
    if (ev) invite(boy, act("watchPc", watchPc, ev));
    const end = t() + left;
    let seen = moment().beat; // whatever was already on when she sat down
    a.hold = farm ? MOVES.mouse : null;
    const watched = () => ev && (boy.event === ev || boy.pending?.ev === ev); // he is with her (or on his way)
    while (t() < end && !(a.interrupt && !watched())) {
      const { beat, mood } = moment();
      if (mood && beat !== seen) {
        seen = beat;
        yield* react(a, mood);
        Object.assign(a, { happy: false, nod: 0, hold: farm ? MOVES.mouse : null });
      }
      a.nod = 0.08 + 0.03 * Math.sin(t() * 0.8);
      yield;
    }
    if (t() >= end) on = null; // all watched: nothing to come back to
    if (ev) ev.playing = false;
    house.pc.set("off", t());
    Object.assign(a, { look: null, nod: 0, hold: null });
    yield* getUp(a);
    house.pc.sitter = null;
  }

  // How she takes a moment on the screen (`mood`, from screens.js).
  function* react(a, mood) {
    if (mood === "laugh") {
      a.hold = MOVES.clap;
      a.happy = true;
      a.pop("room-pop room-pop-note");
      yield* wait(a, 1.5);
    } else if (mood === "twist") {
      a.hold = HOLDS.chin;
      a.pop("room-pop room-pop-question");
      yield* wait(a, 1.8);
    } else if (mood === "love" || mood === "heart") {
      a.happy = true;
      a.pop();
      yield* wait(a, 1.4);
    } else if (mood === "sad") {
      a.nod = -0.1; // a tear
      a.pop("room-pop room-pop-drop");
      yield* wait(a, 1.8);
    } else if (mood === "tense") {
      a.nod = 0.18; // leaning in
      yield* wait(a, 1.6);
    } else {
      a.pop(`room-pop room-pop-${mood}`); // the farm's sparkle, star or note
      a.beHappy(1);
      yield* wait(a, 0.8);
    }
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

  return { pc, pcGirl, watchPc };
}
