/*******************************************************************************
 * The life of the playground's home: what each of them does next, and what
 * they do together. Each actor (actor.js) runs one activity at a time (acts.js),
 * a generator stepped once a frame; when it ends, they pick another by their
 * own tastes (MENUS), seldom the same twice (choose.js).
 *
 * Keeping it sound:
 * - Places (a seat, a side of the bed, the fridge, the book) are claimed while
 *   in use and all handed back when the activity ends, however it ends.
 * - Joining in is by invitation: only someone free, or doing something calm
 *   (resting, watching TV), and awake, is asked; they wrap up, then come. Every
 *   wait for someone else has a time limit, and an outing or a game whose host
 *   stops is over for everyone.
 * - An activity that throws, or runs far too long, is stopped, and its actor
 *   put back on the floor with its things put away.
 * The director, run every frame, looks after what belongs to no one: the TV,
 * the fridge's doors and the quilt, who sits beside whom on the sofa, the pets
 * getting hungry and being fed, the cat's mischief while they are all out, and
 * the girl going to change into what a visitor picked for her.
 ******************************************************************************/

import { rnd, pick } from "../stage.js";
import { freshPicker } from "../choose.js";

// How much each of them likes to do what (acts.js has what each one is). Night (dark mode) changes some;
// going to bed is only for the night.
const MENUS = {
  girl: {
    tv: 13,
    snack: 11,
    cook: 10,
    bake: 6,
    read: 9,
    water: 8,
    walk: 10,
    fetch: 6,
    pet: 10,
    chat: 7,
    game: 5,
    watchPc: 6,
    nap: 6,
    stroll: 8,
    stretch: 4,
    laptop: 4,
    dress: 5,
    garden: 9,
    fire: 5,
    sleep: 40,
  },
  boy: {
    pc: 18,
    tv: 9,
    snack: 10,
    bake: 6,
    read: 5,
    laptop: 4,
    walk: 10,
    fetch: 7,
    pet: 8,
    chat: 6,
    game: 6,
    nap: 4,
    stroll: 7,
    stretch: 4,
    water: 3,
    garden: 7,
    fire: 6,
    sleep: 30,
  },
  collie: { bed: 15, rug: 14, stroll: 14, zoomies: 7, visit: 14, sniff: 6, sunbathe: 8, fireside: 14, rest: 30 },
  cat: { nap: 22, perch: 10, climb: 12, groom: 12, stroll: 10, visit: 10, cuddle: 6, tower: 8, chase: 8, fireside: 12, rest: 18 },
};
const NIGHT = {
  nap: 2,
  bed: 1.6,
  tv: 1.3,
  read: 1.3,
  walk: 0.4,
  fetch: 0.4,
  zoomies: 0.5,
  cook: 0.6,
  bake: 0.6,
  water: 0.5,
  game: 0.8,
  fire: 3,
  fireside: 1.5,
};
const LONGEST = 300; // s any one activity may run

export function makeLife(home) {
  const { clock, actors, humans, pets, house } = home;
  const claims = new Map(); // place -> the actor using it
  const t = () => clock.t;

  /* ---------- places ---------- */

  function claim(a, key) {
    const holder = claims.get(key);
    if (holder && holder !== a) return false;
    claims.set(key, a);
    return true;
  }
  const holder = (key) => claims.get(key) || null;
  function release(a, key) {
    if (claims.get(key) === a) claims.delete(key);
  }

  /* ---------- activities ---------- */

  // An activity: its name, and the generator that does it, with what it needs.
  const act = (name, gen, ...args) => ({ name, run: (a) => gen(a, ...args), ev: args.find((x) => x && x.kind) || null });
  // Something done together, hosted by `host`; over when the host's activity ends.
  function event(host, kind, extra = {}) {
    const ev = { kind, host, over: false, ...extra };
    host.event = ev;
    return ev;
  }

  // Free to be asked: home, awake, not hungry or busy with someone, and idle or doing something calm.
  const available = (a) => !!a && !a.out && !a.asleep && !a.hungry && !a.event && !a.pending && !a.queue.length && (!a.job || a.calm);

  // Ask `a` to do `todo` (an act): now if it is idle, else once it has wrapped up what it is doing.
  function invite(a, todo) {
    if (!available(a)) return false;
    if (!a.job) start(a, todo);
    else {
      a.pending = todo;
      a.interrupt = true;
    }
    return true;
  }
  const later = (a, todo) => a.queue.push(todo);
  const onEnd = (a, fn) => a.cleanups.push(fn);

  function start(a, todo) {
    a.pending = null;
    a.interrupt = false;
    a.woken = false;
    a.jobName = todo.name;
    a.jobStart = t();
    if (todo.ev) a.event = todo.ev;
    a.job = todo.run(a);
  }

  // The activity is over: put things away, give places back, end what it hosted, and stand normally.
  function finish(a, broken) {
    a.job = null;
    a.cleanups.splice(0).forEach((fn) => fn());
    for (const [key, holder] of claims) if (holder === a) claims.delete(key);
    if (a.event && a.event.host === a) a.event.over = true;
    a.event = null;
    a.props?.only();
    Object.assign(a, {
      jobName: "",
      calm: false,
      interrupt: false,
      woken: false,
      walking: false,
      pace: 1,
      happy: false,
      look: null,
      hold: null,
      talk: false,
      nod: 0,
      leads: false,
      harnessed: false,
      sit: false,
      lie: false,
      asleep: false,
      phones: false,
      cowed: false,
      partner: null,
      watching: false,
      gaming: false,
      atFridge: false,
      atFreezer: false,
      hungry: false,
      served: false,
      messy: false,
      tidied: false,
    });
    a.setState("idle");
    ["want", "mood", "say"].forEach((c) => a.show(c, null));
    // Only a broken activity can leave someone up on the furniture, in bed or out of the house: put them
    // back on the floor, inside.
    if (broken || a.above() > 0.01 || a.seated || a.abed || a.out) {
      a.seated = false;
      a.abed = false;
      if (a.ground) [a.x, a.z] = a.ground;
      if (a.out || !home.nav.free(a.x, a.z)) [a.x, a.z] = [house.spots.door.x, house.spots.door.inside];
      a.y = house.floorY(a.x, a.z);
      a.out = false;
    }
    a.ground = null;
    a.seatKey = null;
    a.rig.group.visible = true;
    // Soon on to something else if it could not be done at all, or to get out of the way.
    const failed = t() === a.jobStart;
    a.nextAt = t() + (failed ? 0.3 : crowded(a) ? 0.5 : a.human ? rnd(1.5, 5) : rnd(2.5, 7));
  }

  // The next thing to do, by its tastes, from what can be done just now; but first, out of the way of
  // anyone standing too close.
  function crowded(a) {
    return actors.some((o) => o !== a && !o.out && Math.abs(o.y - a.y) < 3 && Math.hypot(o.x - a.x, o.z - a.z) < 14);
  }
  function choose(a) {
    if (a.above() < 0.5 && crowded(a)) return start(a, act("stroll", home.acts.stroll.run));
    const weights = {};
    for (const [name, w] of Object.entries(MENUS[a.name])) {
      const todo = home.acts[name];
      if (todo && todo.can(a)) weights[name] = w * (home.night ? NIGHT[name] || 1 : 1);
    }
    const name = a.picker.choose(weights);
    if (!name) return (a.nextAt = t() + 2);
    a.picker.did(name);
    start(a, act(name, home.acts[name].run));
  }

  function step(a) {
    if (!a.job) {
      if (a.pending) start(a, a.pending);
      else if (a.queue.length) start(a, a.queue.shift());
      else if (t() >= a.nextAt) choose(a);
    }
    if (!a.job) return;
    let broken = false;
    try {
      if (t() - a.jobStart > LONGEST) {
        a.job.return();
        broken = true;
      } else if (!a.job.next().done) return;
    } catch (e) {
      console.error(`playground: ${a.name} stopped ${a.jobName}`, e);
      broken = true;
    }
    finish(a, broken);
  }

  /* ---------- the director ---------- */

  let hungerAt = t() + rnd(60, 120);
  let mischiefAt = null;
  let messAt = -Infinity; // the last mess: one at a time, and not too often
  const seatIndex = (key) => (key && key.startsWith("sofa") ? +key.slice(4) : -1);

  function direct() {
    // The girl goes to change into what a visitor picked for her (by day) as the next thing she does,
    // before anything she was only asked to do: at once if she is free or doing something that can be cut
    // short, else as soon as she is done. Never in the middle of something done with someone else.
    const girl = home.byName.girl;
    if (home.outfit.want !== null && !home.night && girl.jobName !== "dress" && !girl.out) {
      if (girl.pending?.name !== "dress" && !girl.pending?.ev) {
        const todo = act("dress", home.acts.dress.run);
        if (!girl.job) start(girl, todo);
        else girl.pending = todo;
      }
      if (girl.pending?.name === "dress" && girl.calm && !girl.event) girl.interrupt = true; // wrap up as soon as she can
    }

    // The TV is on while someone sits watching (or playing), the controllers in their hands; the fridge
    // is open while someone stands at it with the door open; the quilt is up over whoever is in bed.
    const gaming = actors.some((a) => a.gaming && a.seated);
    house.tv.set(gaming ? "game" : actors.some((a) => a.watching && a.seated) ? "show" : "off", t());
    house.tv.pads.forEach((p) => (p.visible = !gaming));
    house.fridge.openers = actors.filter((a) => a.atFridge).length;
    house.fridge.freezers = actors.filter((a) => a.atFreezer).length;
    house.beds.slots = [0, 1].map((i) => humans.some((h) => h.abed && h.seatKey === `bed${i}`));

    // A person on the sofa pets the pets lying on the seats either side.
    for (const h of humans) {
      const i = h.seated ? seatIndex(h.seatKey) : -1;
      h.company =
        i < 0
          ? null
          : [i - 1, i + 1].map((j) => {
              const p = holder(`sofa${j}`);
              return !!p && !p.human && p.above() > 5 && p.seatKey === `sofa${j}`;
            });
    }

    // Now and then a pet gets hungry, if someone is home and awake to feed it, and goes to wait by its
    // bowl; the first person free goes and feeds it.
    const awake = humans.filter((h) => !h.out && !h.asleep);
    if (t() > hungerAt) {
      const ready = pets.filter((p) => p.rig.eats && available(p));
      if (!awake.length || pets.some((p) => p.jobName === "hungry") || !ready.length) hungerAt = t() + 10;
      else {
        invite(pick(ready), act("hungry", home.acts.hungry.run));
        hungerAt = t() + rnd(150, 260);
      }
    }
    for (const p of pets) {
      if (p.feeder && p.feeder.jobName !== "feed" && p.feeder.pending?.name !== "feed") p.feeder = null;
      if (p.hungry && !p.feeder) {
        const h = awake.find(available);
        if (h && invite(h, act("feed", home.acts.feed.run, p))) p.feeder = h;
      }
    }

    // With the two of them out (as on the profile page: she never goes on walks), the cat gets up to
    // mischief soon after, if she has not for a while; the first one back finds the mess.
    const cat = home.byName.cat;
    if (cat) {
      if (humans.some((h) => !h.out)) mischiefAt = null;
      else if (mischiefAt === null) mischiefAt = t() + rnd(1, 4);
      if (mischiefAt !== null && t() > mischiefAt && t() - messAt > 180 && !cat.messy && available(cat)) {
        invite(cat, act("mischief", home.acts.mischief.run));
        mischiefAt = Infinity;
        messAt = t();
      }
      if (cat.foundBy && cat.foundBy.jobName !== "scold" && cat.foundBy.pending?.name !== "scold") cat.foundBy = null;
      if (cat.messy && !cat.foundBy) {
        const h = awake.find(available);
        if (h && invite(h, act("scold", home.acts.scold.run, cat))) cat.foundBy = h;
      }
    }
  }

  actors.forEach((a) => {
    a.queue = [];
    a.cleanups = [];
    a.picker = freshPicker(2);
  });

  return {
    claim,
    holder,
    release,
    act,
    event,
    available,
    invite,
    later,
    onEnd,
    // A frame: the director, then everyone's activity.
    step() {
      direct();
      actors.forEach(step);
    },
  };
}
