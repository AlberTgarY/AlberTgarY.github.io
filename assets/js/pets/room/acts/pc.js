/*******************************************************************************
 * The computer in the loft: his games, with the headphones on and his team to
 * talk to; her shows and her farm game; and her watching him play.
 ******************************************************************************/

import { rnd, pick } from "../../stage.js";
import { HOLDS, MOVES } from "../props.js";
import { GAMES, SIDES, DRAMAS, GIRL_GAMES } from "../screens.js";
import { V, TEAM_SAY } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function pcActs(c) {
  const { house, byName, spots, walk, turn, wait, sitOn, getUp, claim, holder, act, event, available, invite, onEnd, t, takeSeat, halfTowards } = c;

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

  // The girl at his computer (his headphones stay on their stand): a drama to stream, or her farm game to
  // tend. Watching, she laughs, gasps, sighs over the couple or sheds a tear; farming, she is pleased with
  // each harvest. He may come up and watch with her.
  function* pcGirl(a) {
    if (!claim(a, "pc")) return;
    const seat = takeSeat(a, ["chair"]);
    if (!seat) return;
    onEnd(a, () => {
      house.pc.set("off", t());
      house.pc.sitter = null;
    });
    yield* sitOn(a, seat);
    house.pc.sitter = a;
    a.look = spots.monitor;
    const farm = Math.random() < 0.35;
    house.pc.set(farm ? "game" : "show", t(), farm ? pick(GIRL_GAMES) : pick(DRAMAS));
    const boy = byName.boy;
    const ev = boy && Math.random() < 0.3 && !holder("watchPc") && available(boy) ? event(a, "pc", { playing: true, round: 0, result: null }) : null;
    if (ev) invite(boy, act("watchPc", watchPc, ev));
    const end = t() + rnd(50, 90);
    let momentAt = t() + rnd(4, 8);
    a.hold = farm ? MOVES.mouse : null;
    while (t() < end && !(a.interrupt && !ev)) {
      if (t() > momentAt) {
        momentAt = t() + rnd(6, 11);
        const r = Math.random();
        if (farm) {
          a.pop(r < 0.5 ? "room-pop room-pop-sparkle" : "room-pop room-pop-star");
          a.beHappy(1);
        } else if (r < 0.35) {
          a.hold = MOVES.clap; // a laugh
          a.happy = true;
          a.pop("room-pop room-pop-note");
          yield* wait(a, 1.5);
        } else if (r < 0.6) {
          a.hold = HOLDS.chin; // a twist!
          a.pop("room-pop room-pop-question");
          yield* wait(a, 1.8);
        } else if (r < 0.85) {
          a.happy = true; // the couple at last
          a.pop();
          yield* wait(a, 1.4);
        } else {
          a.nod = -0.1; // a tear
          a.pop("room-pop room-pop-drop");
          yield* wait(a, 1.8);
        }
        Object.assign(a, { happy: false, hold: farm ? MOVES.mouse : null });
      }
      a.nod = 0.08 + 0.03 * Math.sin(t() * 0.8);
      yield;
    }
    if (ev) ev.playing = false;
    house.pc.set("off", t());
    Object.assign(a, { look: null, nod: 0, hold: null });
    yield* getUp(a);
    house.pc.sitter = null;
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
