/*******************************************************************************
 * The girl's and the collie's day in the flower shop: each does one thing at a
 * time (an activity from acts.js, a generator moved on a frame at a time),
 * picked by weight, what was done lately less likely again; a visitor's pick (a
 * bucket clicked: a bouquet of those) is done at once, what she was doing
 * left where it is, its things put back (picks made while she is making one
 * up for a visitor wait their turn). One may ask the other along (the dog
 * to come and sit by her); places are claimed while in use.
 ******************************************************************************/

import { rnd } from "../stage.js";
import { makeShopActs } from "./acts.js";

const LONGEST = 240; // s that anything may take at most
const FRESH = 200; // s after doing something before it is as likely as anything else again
const ASKED_MOST = 3; // visitors' picks waiting their turn, at most

export function makeShopLife(home) {
  const { clock } = home;
  const t = () => clock.t;
  const claims = new Map(); // key -> who holds it
  const asked = []; // kinds visitors picked, waiting for the bouquet she is making up for one to be done
  for (const a of home.actors) Object.assign(a, { cleanups: [], last: {}, pending: null, queue: [] });

  const life = {
    // Hold `key` (a place, the radio...) till the activity ends; whether it was free.
    claim(a, key) {
      const holder = claims.get(key);
      if (holder && holder !== a) return false;
      claims.set(key, a);
      return true;
    },
    holder: (key) => claims.get(key) || null,
    // Whether `a` is free to be asked: idle, or doing something calm, and not asked already.
    available: (a) => !a.pending && (!a.job || a.calm),
    // Ask `a` to do `name` next (`args` passed on), dropping something calm.
    invite(a, name, ...args) {
      if (!life.available(a)) return false;
      a.pending = { name, run: (b) => acts[name].run(b, ...args) };
      if (a.job) a.interrupt = true;
      return true;
    },
    // A visitor's pick: { bouquet: kind } — she drops what she is doing (put back as it was) and makes it;
    // while she is making one up for a visitor already, it waits its turn (a kind once).
    want({ bouquet }) {
      const girl = home.byName.girl;
      const making = girl.pending?.asked ?? (girl.jobName === "bouquet" ? girl.asked : null);
      if (making) {
        if (making !== bouquet && !asked.includes(bouquet) && asked.length < ASKED_MOST) asked.push(bouquet);
        girl.pop(); // (a heart: noted)
        return;
      }
      girl.pending = bouquetFor(bouquet);
      if (girl.job) finish(girl, true, true);
    },
    // `a` to do `name` next, whatever it is doing (tests).
    ask(a, name, ...args) {
      a.pending = { name, run: (b) => acts[name].run(b, ...args) };
      if (a.job) finish(a, true, true);
    },
    step,
  };
  const acts = makeShopActs(home, life);
  const bouquetFor = (kind) => ({ name: "bouquet", asked: kind, run: (a) => acts.bouquet.run(a, kind) });

  // Start `todo` ({ name, run }).
  function start(a, todo) {
    a.pending = null;
    a.interrupt = false;
    a.jobName = todo.name;
    a.asked = todo.asked ?? null;
    a.jobStart = t();
    a.last[todo.name] = t();
    a.job = todo.run(a);
  }

  // The activity is over (or cut short, `broken`): its things put back, its places given up, standing as
  // usual. With `rise`, someone seated stays so, to get up from it as the next activity sets off (steps.js).
  function finish(a, broken, rise = false) {
    a.job?.return?.();
    a.job = null;
    a.cleanups.splice(0).forEach((fn) => fn());
    for (const [key, holder] of claims) if (holder === a) claims.delete(key);
    a.props?.only();
    a.shop?.only();
    const seated = rise && a.seated;
    Object.assign(a, {
      jobName: "",
      calm: false,
      interrupt: false,
      walking: false,
      pace: 1,
      happy: false,
      look: null,
      hold: null,
      talk: false,
      nod: 0,
      sit: false,
      lie: false,
      lean: 0,
      asleep: false,
      partner: null,
    });
    a.seated = seated;
    if (!seated) a.ground = null;
    a.setState("idle");
    ["want", "mood", "say"].forEach((c) => a.show(c, null));
    a.nextAt = t() + (broken ? 0.3 : rnd(0.8, 2.5));
  }

  // The next thing for `a`: by weight, less likely the sooner after it was last done.
  function choose(a) {
    const options = Object.entries(acts)
      .filter(([, act]) => act.who === (a.human ? "human" : "pet"))
      .map(([name, act]) => {
        const since = t() - (a.last[name] ?? -Infinity);
        return [name, act.weight(a) * Math.min(1, Math.max(0.04, (since / FRESH) ** 2))];
      })
      .filter(([, w]) => w > 0);
    const total = options.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    const [name] = options.find(([, w]) => (r -= w) < 0) ?? options.at(-1) ?? [];
    if (!name) return (a.nextAt = t() + 1);
    start(a, { name, run: acts[name].run });
  }

  function step() {
    acts.tick?.(clock.dt);
    for (const a of home.actors) {
      if (!a.job) {
        if (!a.pending && a.human && asked.length) a.pending = bouquetFor(asked.shift());
        if (a.pending) start(a, a.pending);
        else if (t() >= a.nextAt) choose(a);
      }
      if (!a.job) continue;
      let broken = false;
      try {
        if (t() - a.jobStart > LONGEST) broken = true;
        else if (!a.job.next().done) continue;
      } catch (e) {
        console.error(`flower shop: ${a.name} stopped ${a.jobName}`, e);
        broken = true;
      }
      finish(a, broken);
    }
  }

  return life;
}
