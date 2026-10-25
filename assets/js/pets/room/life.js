/*******************************************************************************
 * The life of the playground's home: what each of them does next, and what
 * they do together. Each actor (actor.js) runs one activity at a time (acts.js),
 * a generator stepped once a frame; when it ends, they pick another by their
 * own tastes (MENUS), their mood of the moment (LEANINGS) and, for the two of
 * them, how long it is since they last did each thing (BALANCE), seldom the
 * same twice (choose.js).
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
 * The director, run every frame, looks after what belongs to no one: the TV
 * (and anyone looking round when a visitor switches it on, or going to switch
 * it off), the fridge's doors and the quilt, who sits beside whom on the sofa,
 * the pets getting hungry and being fed, the cat's mischief while they are all out, the
 * girl going to change into what a visitor picked for her, someone going to
 * turn the garden's sprinkler off once it has run a while, and the day's
 * rhythm (ROUTINE): the dog walked, a meal made and the garden seen to every
 * so often, by whoever is free when it is due.
 ******************************************************************************/

import { rnd, pick, clamp } from "../stage.js";
import { freshPicker } from "../choose.js";
import { X1, LOFT } from "./house.js";

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
    pcGirl: 14,
    nap: 6,
    stroll: 8,
    stretch: 4,
    laptop: 4,
    dress: 5,
    garden: 5,
    sprinkle: 5,
    fire: 5,
    sleep: 16,
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
    sprinkle: 5,
    fire: 6,
    sleep: 12,
  },
  collie: { bed: 15, rug: 14, stroll: 14, zoomies: 7, visit: 14, sniff: 6, sunbathe: 8, splash: 20, fireside: 14, rest: 30 },
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
// A rainy spell (weather.js) makes for a cosy afternoon in: the fire, a book, a nap, and the cat at the window.
// The dog still needs her walk, rain or not.
const RAIN = { fire: 2.5, fireside: 1.6, read: 1.5, nap: 1.6, tv: 1.3, perch: 2.5, bed: 1.3 };
// Moods: every few minutes each of them leans a little towards one kind of thing, or none in particular: a
// spell when she is all for the garden, then one for the screens, or the kitchen. What they lean towards is
// LEAN times as likely, in what they pick and in who is given the day's rhythm (ROUTINE).
const LEANINGS = {
  girl: {
    garden: ["garden", "water", "sprinkle"],
    screens: ["tv", "pcGirl", "watchPc", "laptop", "game"],
    kitchen: ["cook", "bake", "snack"],
    cosy: ["read", "nap", "fire", "stretch"],
    pets: ["walk", "fetch", "pet"],
  },
  boy: {
    garden: ["garden", "water", "sprinkle"],
    screens: ["pc", "tv", "laptop", "game"],
    kitchen: ["bake", "snack"],
    cosy: ["read", "nap", "fire", "stretch"],
    pets: ["walk", "fetch", "pet"],
  },
  collie: { play: ["zoomies", "splash", "stroll", "sniff"], lazy: ["bed", "rug", "rest", "sunbathe", "fireside"], company: ["visit"] },
  cat: { play: ["chase", "climb", "perch", "tower"], lazy: ["nap", "rest", "fireside", "groom"], company: ["visit", "cuddle"] },
};
const LEAN = 2;
const MOOD_LASTS = [240, 420]; // s
// Balance (the two of them): what they have not done for a while grows on them, and what they have just done
// has lost its pull for now, so that nothing is left undone for long and nothing is done over and over:
// each thing's weight times the square of the time since they last did it over BALANCE s (hardly again
// within a few minutes, as keen as ever after BALANCE), kept within NEED.
const BALANCE = 600;
const NEED = [0.05, 3];
const LONGEST = 300; // s any one activity may run
// What is never dropped for a hungry pet: changing clothes, feeding, running in from the rain, the cat's mess,
// going to the table when called, a walk (even still on the path outside the door); nor is anyone with food
// in hand or at the table with what they made (`a.serving`).
const NO_DROP = ["dress", "feed", "shelter", "scold", "sprinklerOff", "dine", "walk"];
// Nor is anyone called to the table out of these (summon()): those, or cooking or baking (food of their own
// on the way).
const NO_CALL = [...NO_DROP, "cook", "bake"];
// The day's rhythm: what comes round every so often (s, at random between the two) whatever anyone's tastes,
// each due that long after it was last done (by anyone, asked or not); and for `rest` s after it was done,
// no one does it again of their own accord (the dog has just been out, they have just eaten, the garden has
// just been seen to). A meal is either of them cooking, or one of them baking.
const ROUTINE = [
  { names: ["walk"], every: [300, 480], rest: 240 },
  { names: ["cook", "bake"], every: [420, 660], rest: 360 },
  { names: ["garden"], every: [270, 450], rest: 180 },
];

export function makeLife(home) {
  const { clock, actors, humans, pets, house } = home;
  const claims = new Map(); // place -> the actor using it
  const t = () => clock.t;
  const due = new Map(ROUTINE.map((r) => [r, t() + rnd(...r.every) / 2])); // when each part of the rhythm comes round
  const done = new Map(ROUTINE.map((r) => [r, -Infinity])); // and when it was last started
  const resting = (name) => ROUTINE.some((r) => r.names.includes(name) && t() - done.get(r) < r.rest);

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

  // Doing something with the other person (or they are about to join in); a pet watching does not count.
  const together = (a) => !!a.event && humans.some((h) => h !== a && (h.event === a.event || h.pending?.ev === a.event));
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
  // Call `a` for something that will not wait, a meal on the table: asked as by invite() if free; else, if
  // home and not already asked to do something, told to wrap up what they are doing (woken, if asleep) and
  // come next. Whether they will come.
  function summon(a, todo) {
    if (invite(a, todo)) return true;
    if (!a || a.out || a.pending || a.serving || NO_CALL.includes(a.jobName)) return false;
    if (!a.job) start(a, todo);
    else {
      a.pending = todo;
      a.interrupt = true;
    }
    return true;
  }
  const later = (a, todo) => a.queue.push(todo);
  // A new stage of a long activity (the meal after a harvest): LONGEST counts from here.
  const anew = (a) => (a.jobStart = t());
  const onEnd = (a, fn) => a.cleanups.push(fn);

  function start(a, todo) {
    for (const r of ROUTINE)
      if (r.names.includes(todo.name)) {
        due.set(r, t() + rnd(...r.every));
        done.set(r, t());
      }
    a.pending = null;
    a.interrupt = false;
    a.woken = false;
    a.jobName = todo.name;
    a.jobStart = t();
    a.last[todo.name] = t();
    if (todo.ev) a.event = todo.ev;
    a.job = todo.run(a);
  }

  // The activity is over: put things away, give places back, end what it hosted, and stand normally. With
  // `rise`, someone seated (or half way up off the seat) stays, to get up from it themselves (drop()).
  function finish(a, broken, rise = false) {
    a.job = null;
    a.cleanups.splice(0).forEach((fn) => fn());
    for (const [key, holder] of claims) if (holder === a) claims.delete(key);
    if (a.event && (a.event.host === a || a.event.pair)) a.event.over = true; // (a chat or a game: either leaving ends it)
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
      lean: 0,
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
      serving: false,
    });
    a.setState("idle");
    ["want", "mood", "say"].forEach((c) => a.show(c, null));
    // Only a broken activity can leave someone up on the furniture, in bed or out of the house, or half way
    // up off a seat (`ground` still set): put them back on the floor, inside.
    const stay = rise && (a.seated || a.ground) && !a.abed && !a.out;
    if (stay) a.seated = true; // half way up off it: they get up from where they are (feed() does)
    if (!stay && (broken || a.above() > 0.01 || a.seated || a.abed || a.out || a.ground)) {
      a.seated = false;
      a.abed = false;
      if (a.ground) [a.x, a.z] = a.ground;
      const door = [house.spots.door.x, house.spots.door.inside];
      if (a.out) [a.x, a.z] = door;
      else if (!home.nav.free(a.x, a.z)) [a.x, a.z] = home.nav.nearest(a.x, a.z) || door;
      a.y = house.floorY(a.x, a.z);
      a.out = false;
    }
    if (!stay) a.ground = null;
    a.seatKey = null;
    a.rig.group.visible = true;
    // Soon on to something else if it could not be done at all, or stopped half way up or down the stairs, or
    // to get out of the way.
    const failed = t() === a.jobStart;
    const fy = house.floorY(a.x, a.z);
    const stairs = !a.seated && fy > 0.01 && fy < LOFT.y - 0.01 && Math.abs(a.y - fy) < 0.5;
    a.nextAt = t() + (failed || stairs ? 0.3 : crowded(a) ? 0.5 : a.human ? rnd(1.5, 5) : rnd(2.5, 7));
  }

  // What `a` leans towards just now (LEANINGS): a new mood once the last has run its course, never the same
  // twice running.
  function leaning(a) {
    if (t() >= a.mood.until) {
      const kinds = Object.keys(LEANINGS[a.name] || {}).filter((k) => k !== a.mood.kind);
      a.mood = { kind: pick([null, ...kinds]), until: t() + rnd(...MOOD_LASTS) };
    }
    return LEANINGS[a.name]?.[a.mood.kind] || [];
  }

  // How much `a` feels like `name` for not having done it for a while (BALANCE); the pets go by taste alone.
  const need = (a, name) => (a.human ? clamp(((t() - (a.last[name] ?? -Infinity)) / BALANCE) ** 2, ...NEED) : 1);

  // The next thing to do, by its tastes, mood and balance, from what can be done just now; but first, out of
  // the way of anyone standing too close.
  function crowded(a) {
    return actors.some((o) => o !== a && !o.out && Math.abs(o.y - a.y) < 3 && Math.hypot(o.x - a.x, o.z - a.z) < 14);
  }
  function choose(a) {
    if (a.above() < 0.5 && crowded(a)) return start(a, act("stroll", home.acts.stroll.run));
    const weights = {};
    const leans = leaning(a);
    for (const [name, w] of Object.entries(MENUS[a.name])) {
      const todo = home.acts[name];
      if (todo && todo.can(a) && !resting(name))
        weights[name] =
          w * (home.night ? NIGHT[name] || 1 : 1) * (home.weather.raining ? RAIN[name] || 1 : 1) * (leans.includes(name) ? LEAN : 1) * need(a, name);
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
      else if (crowded(a)) a.nextAt = Math.min(a.nextAt, t() + 0.5); // someone come to where they stand: soon off
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

  // Someone to drop what they are doing for `todo`, which cannot wait: of those home, awake and out of bed,
  // one busy on their own rather than with the other, if there is one. What they were doing ends where it is
  // (its things put back, as when anything is cut short); what they were next asked to do still waits.
  function drop(todo) {
    const busy = humans.filter((h) => !h.out && !h.asleep && !h.abed && !h.serving && !NO_DROP.includes(h.jobName) && h.pending?.name !== "feed");
    const a = busy.find((h) => !together(h)) || busy[0];
    if (!a) return null;
    const { pending } = a;
    if (a.job) {
      a.job.return();
      finish(a, false, true);
    }
    start(a, todo);
    a.pending = pending;
    return a;
  }

  /* ---------- the director ---------- */

  let hungerAt = t() + rnd(60, 120);
  let mischiefAt = null;
  let messAt = -Infinity; // the last mess: one at a time, and not too often
  let tvSeen = 0; // the last thing a visitor did to the TV that was noticed
  let tvOffAt = Infinity; // when someone goes to switch off a TV a visitor left on
  const seatIndex = (key) => (key && key.startsWith("sofa") ? +key.slice(4) : -1);

  // What a visitor asks of the girl comes before anything else: whatever she is doing is cut short there and
  // then (as for a hungry pet, drop(); seated, she gets up as it starts), and not gone back to; asleep in bed
  // or on the sofa, she wakes and gets up (dozing over something else, it is cut short like the rest). Only what
  // cannot stop just now (out, at a meal, feeding a pet) goes on, or what she has been asked or called to
  // already (to wrap up for: a meal, a pet, something with him), and this is the next thing she does
  // (direct() asks again each frame). The visitor's last word counts: a show picked while she changes
  // (room.js has given up the change) cuts the change short.
  function ask(name) {
    const girl = home.byName.girl;
    if (girl.jobName === name || girl.pending) return;
    const todo = act(name, home.acts[name].run);
    const changing = girl.jobName === "dress" && name !== "dress";
    if (girl.out || girl.serving || (NO_DROP.includes(girl.jobName) && !changing)) girl.pending = todo;
    else if (!girl.job) start(girl, todo);
    else if (girl.abed || (girl.asleep && girl.jobName === "nap")) {
      girl.pending = todo;
      girl.interrupt = true;
    } else {
      girl.job.return();
      finish(girl, false, true);
      // Not back to the show she was watching (acts/pc.js), nor its way back queued as it ended.
      girl.resume = null;
      girl.queue = girl.queue.filter((q) => q.name !== "pcGirl");
      start(girl, todo);
    }
  }

  function direct() {
    // A change of clothes a visitor picked for her (by day: at night, in pyjamas, in the morning), or what they
    // picked for her to watch on his computer (one or the other: the last pick, room.js), which he leaves to
    // her once he has finished his round (at it already, she switches over herself, acts/pc.js).
    const girl = home.byName.girl;
    if (home.outfit.want !== null && !home.night && girl.jobName !== "dress") ask("dress");
    const pc = holder("pc");
    if (home.watch.want && girl.jobName !== "pcGirl") {
      if (pc && pc !== girl) pc.interrupt = true;
      else ask("pcGirl");
    }

    // The TV is on while someone watches (once they have switched it on) or plays; the fridge is open while
    // someone stands at it with the door open; the quilt is up over whoever is in bed.
    const { tv } = house;
    tv.want(actors.some((a) => a.gaming) ? "game" : actors.some((a) => a.watching) ? "show" : "off", t());
    // A visitor switching the TV on with no one watching: whoever is free and awake looks round at it, and
    // may come and watch; left on and not watched, it is switched off by whoever is free after a while.
    if (tv.poke.n !== tvSeen) {
      tvSeen = tv.poke.n;
      if (tv.poke.what === "on" && tv.meddled) {
        const free = humans.filter(available);
        free.forEach((h) => h.pop("room-pop room-pop-question"));
        if (free.length && Math.random() < 0.5) invite(pick(free), act("tv", home.acts.tv.run));
        tvOffAt = t() + rnd(30, 50);
      }
    }
    if (tv.mode === "off" || !tv.meddled) tvOffAt = Infinity;
    if (t() > tvOffAt && !holder("remote")) {
      const h = humans.find(available); // (looked for every frame: someone between two things is free only for one)
      if (h) {
        invite(h, act("tvOff", home.acts.tvOff.run));
        tvOffAt = t() + 10;
      }
    }
    house.fridge.openers = actors.filter((a) => a.atFridge).length;
    house.fridge.freezers = actors.filter((a) => a.atFreezer).length;
    house.beds.slots = [0, 1].map((i) => humans.some((h) => h.lainDown && h.seatKey === `bed${i}`));

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
    // bowl; the first person free goes and feeds it, or if neither is, one of them drops what they are doing.
    const awake = humans.filter((h) => !h.out && !h.asleep);
    if (t() > hungerAt) {
      const ready = pets.filter((p) => p.rig.eats && available(p));
      if (!awake.length || pets.some((p) => p.jobName === "hungry") || !ready.length) hungerAt = t() + 10;
      else {
        invite(pick(ready), act("hungry", home.acts.hungry.run));
        hungerAt = t() + rnd(330, 510);
      }
    }
    for (const p of pets) {
      if (p.feeder && p.feeder.jobName !== "feed" && p.feeder.pending?.name !== "feed") p.feeder = null;
      if (p.hungry && !p.feeder) {
        const todo = act("feed", home.acts.feed.run, p);
        const h = awake.find(available);
        p.feeder = h ? (invite(h, todo) ? h : null) : drop(todo);
      }
    }

    // The sprinkler, once it has run a while, is turned off by whoever is free; its timer turns it off in the
    // end if nobody comes (asleep, say).
    const sprinkler = house.garden.sprinkler;
    if (sprinkler.on && t() > sprinkler.offAt && !holder("sprinkler")) {
      const h = awake.find(available);
      if (h && invite(h, act("sprinklerOff", home.acts.sprinklerOff.run))) sprinkler.offAt = t() + 30;
    }
    if (sprinkler.on && t() - sprinkler.since > 100) sprinkler.stop(t());

    // The day's rhythm: whatever is due goes to one of those free who can do it, by their tastes, mood and
    // balance (so mostly whoever likes it more, or has not done it for longer, but not always); if no one can
    // just now, it is looked at again a little later.
    for (const r of ROUTINE) {
      if (t() < due.get(r)) continue;
      const options = awake
        .filter(available)
        .flatMap((h) =>
          r.names
            .filter((name) => home.acts[name].can(h))
            .map((name) => [h, name, MENUS[h.name][name] * (leaning(h).includes(name) ? LEAN : 1) * need(h, name)])
        );
      let roll = Math.random() * options.reduce((sum, o) => sum + o[2], 0);
      const pair = options.find((o) => (roll -= o[2]) < 0) || options.at(-1);
      const asked = pair && invite(pair[0], act(pair[1], home.acts[pair[1]].run));
      due.set(r, t() + (asked ? rnd(...r.every) : 10));
    }

    // Rain comes when it will: whoever it catches out in the garden drops what they are doing and runs in
    // (what they were next asked to do still waits for them).
    if (home.weather.raining)
      for (const a of actors) {
        if (a.out || a.x < X1 || a.z < LOFT.z1 || a.y > 1 || ["shelter", "sprinklerOff"].includes(a.jobName)) continue;
        if (a.job) {
          a.job.return();
          finish(a, false);
        }
        const { pending } = a;
        start(a, act("shelter", home.acts.shelter.run));
        a.pending = pending;
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
    a.mood = { kind: null, until: -1 };
    a.last = {}; // when they last started each thing
  });

  return {
    claim,
    holder,
    release,
    act,
    event,
    available,
    invite,
    summon,
    later,
    anew,
    onEnd,
    // A frame: the director, then everyone's activity.
    step() {
      direct();
      actors.forEach(step);
    },
  };
}
