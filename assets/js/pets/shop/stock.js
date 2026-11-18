/*******************************************************************************
 * The flower shop's stock (shop.js): what is out on its display, day by day.
 * Each day (numbered: on by one at each midnight the clock passes going on,
 * back by one going back past one; a jump by the time buttons keeps to the
 * day: shop.js) has its own, the same every time from its number (planOf()):
 * which of the places for house plants (plants.js planted(), trolleyPlanted())
 * have a pot in them, each group of them put out more or less full that day;
 * when each of those pots is sold, if it is; and when each bucket of flowers
 * (display.js) is bought down from full to two thirds and on to a third, if it
 * is (never further). What the display shows at an hour of a day follows from
 * that and from whether that part of it has been restocked yet that day:
 * - before it is, what was left of the day before at closing (overnight, and
 *   in the morning till the two of them restock it as they set out: hours.js);
 * - after, the day's stock, less what is sold by then.
 * A jump to an hour (settle()) finds it restocked from half past ten (the
 * shop set out: hours.js setOutAt()), not before; run back to before ten (the
 * day's bar dragged back), it is the day before's again, to be restocked
 * afresh when they set out again.
 * Running on, a sale's hour come, someone comes to buy it if they can
 * (customers.js buy(): up to it, it picked up, paid for at the till, off with
 * it), and it is gone from the display as they pick it up (take()); if no one
 * can come within a while, it just goes. Run back past its hour, it is back at
 * once (and whoever was buying it goes off without it). Stems taken from a
 * bucket for a bouquet (pick(): one she makes up, one asked for) are a sale at
 * that hour, the day's from then on as the others are.
 ******************************************************************************/

import { hash } from "../models/voxels.js";
import { rng } from "./flowers.js";
import { HOURS } from "./layout.js";

const SALES = [11, 21.5]; // the hours a sale may come at (the shop open, set out a while since)
const FULL = [0.6, 1]; // how full a group of pots may be put out, of all its places (each day its own)
const POT_SOLD = 0.2; // the chance that a pot put out is sold in the day
const BOUGHT = [0.3, 0.3]; // the chances that a bucket is bought down to two thirds in the day, and then on to a third
const WAIT = 0.3; // h after a sale's hour that someone may yet come for it (after that it just goes)
const LONGEST = 0.6; // h after its hour that someone may still be on the way to it (then it goes anyway)

// Day `day`'s stock for `pots` (grounds.js: each with its `region`) and `buckets` of flowers (how many):
// which pots are out (`out`, 1 or 0 each), and the day's sales by the hour, each { pot, bucket, hour } (the
// index of the pot, or of the bucket bought down a third; the other -1). The same every time for a day.
export function planOf(day, pots, buckets) {
  const rand = rng(Math.floor(hash(day, 31, 7) * 4294967296));
  const when = () => SALES[0] + rand() * (SALES[1] - SALES[0]);
  const full = {};
  for (const { region } of pots) full[region] ??= FULL[0] + rand() * (FULL[1] - FULL[0]);
  const out = new Uint8Array(pots.length);
  const sales = [];
  const sale = (pot, bucket, hour) => sales.push({ pot, bucket, hour, event: false, applied: false, by: null });
  pots.forEach(({ region }, j) => {
    const [put, sold, hour] = [rand(), rand(), when()];
    out[j] = put < full[region] ? 1 : 0;
    if (out[j] && sold < POT_SOLD) sale(j, -1, hour);
  });
  for (let i = 0; i < buckets; i++) {
    const [first, then, a, b] = [rand(), rand(), when(), when()];
    if (first < BOUGHT[0]) sale(-1, i, Math.min(a, b));
    if (first < BOUGHT[0] && then < BOUGHT[1]) sale(-1, i, Math.max(a, b));
  }
  return { out, sales: sales.sort((p, q) => p.hour - q.hour) };
}

export function makeStock(home) {
  const D = home.display;
  const G = home.grounds;
  const hours = home.life.hours;
  const pots = G.pots;
  const buckets = D.buckets;
  const bucketIndex = new Map(buckets.map((b, i) => [b, i]));
  // Each day's plan (planOf(), with the sales of the bouquets made that day added as they are made), a few
  // days either side of today kept.
  const plans = new Map();
  function plan(day) {
    if (!plans.has(day)) {
      plans.set(day, planOf(day, pots, buckets.length));
      for (const d of plans.keys()) if (Math.abs(d - day) > 3) plans.delete(d);
    }
    return plans.get(day);
  }
  // Today, its sales (each `applied`: gone from the display; `by`: who is on the way to buy it, or has it),
  // and what the day before left: the pots still out (1 or 0 each) and each bucket's level.
  let today = null;
  let sales = [];
  let left = null;
  const sold = new Uint8Array(pots.length); // (the pots of today's sold so far)
  const dropped = new Uint8Array(buckets.length); // (the thirds bought from each bucket today so far)
  // What has been restocked today: the groups of pots (by their `region`), the buckets (each itself).
  const restocked = new Set();
  const regionOf = (s) => (s.pot >= 0 ? pots[s.pot].region : buckets[s.bucket]);

  function apply(s, on = true) {
    if (s.applied === on) return;
    s.applied = on;
    if (s.pot >= 0) sold[s.pot] = on ? 1 : 0;
    else dropped[s.bucket] += on ? 1 : -1;
  }
  // Whoever is buying `s` goes off without it (or with it, picked up: they keep it, it is sold).
  function cancel(s) {
    const a = s.by;
    s.by = null;
    home.customers?.cancel(a);
  }
  // A day begun (the clock on past midnight, or back past it, or the shop's first): what the one before left,
  // the day's sales as they are at hour `h`; nothing restocked before half past ten, all of it from then.
  function begin(day, h) {
    for (const s of sales) if (s.by) cancel(s);
    today = day;
    const before = plan(day - 1);
    left = { pots: Uint8Array.from(before.out), levels: new Uint8Array(buckets.length).fill(3) };
    for (const s of before.sales)
      if (s.pot >= 0) left.pots[s.pot] = 0;
      else left.levels[s.bucket] = Math.max(1, left.levels[s.bucket] - 1);
    sales = plan(day).sales;
    sold.fill(0);
    dropped.fill(0);
    for (const s of sales) {
      Object.assign(s, { applied: false, by: null });
      if (s.hour <= h) apply(s);
    }
    all(setOut(h));
  }
  const setOut = (h) => hours.setOutAt(h) || h >= HOURS.close;
  function all(on) {
    restocked.clear();
    if (!on) return;
    for (const p of pots) restocked.add(p.region);
    for (const b of buckets) restocked.add(b);
  }

  // Each step of the shop's life, at hour `h` of day `day` (or, `settling`, put straight at once): the day's
  // sales come (someone sent for each, or it just goes) or gone back past, and the display as it should be.
  function step(day, h, settling = false) {
    if (day !== today) begin(day, h);
    if (h < HOURS.arrive && restocked.size) restocked.clear(); // (back before they set out: yesterday's again)
    const open = hours.open();
    for (const s of sales) {
      if (!restocked.has(regionOf(s))) continue;
      if (s.hour > h) {
        if (s.by) cancel(s);
        apply(s, false);
      } else if (s.applied) continue;
      else if (s.by) {
        if (settling || h - s.hour > LONGEST) {
          cancel(s);
          apply(s);
        }
      } else if (settling || s.event || !open || h - s.hour > WAIT) apply(s);
      else s.by = home.customers?.buy(s) ?? null; // (no one free: perhaps the next step)
    }
    const p = plans.get(today);
    pots.forEach((pot, j) => pot.show(restocked.has(pot.region) ? p.out[j] === 1 && !sold[j] : left.pots[j] === 1));
    buckets.forEach((b, i) => {
      const n = restocked.has(b) ? Math.max(1, 3 - dropped[i]) : left.levels[i];
      if (b.level !== n) b.fill(n);
    });
  }

  // A few stems taken from bucket `b` for a bouquet: a sale of a third of it, now (if it is restocked today and
  // not down to its last third already).
  function pick(b) {
    if (!restocked.has(b) || b.level <= 1) return;
    const s = { pot: -1, bucket: bucketIndex.get(b), hour: home.hour(), event: true, applied: false, by: null };
    sales.push(s);
    apply(s);
    b.fill(Math.max(1, 3 - dropped[s.bucket]));
  }
  for (const b of buckets) b.pick = () => pick(b);

  return {
    planOf: (day) => plan(day), // (for tests)
    get day() {
      return today;
    },
    step,
    // The time jumped to hour `h` (of the same day): all of it as it is then, at once.
    settle(day, h) {
      if (day !== today) begin(day, h);
      all(setOut(h));
      step(day, h, true);
    },
    // The groups of pots, the buckets: whether each has been restocked today; restocked (hours.js, as they set
    // out of a morning).
    restocked: (key) => restocked.has(key),
    restock: (key) => restocked.add(key),
    regions: [...new Set(pots.map((p) => p.region))],
    // Sale `s` picked up by `a`, who came to buy it (customers.js): gone from the display; whether it was still
    // theirs to take.
    take(s, a) {
      if (s.by !== a || s.applied) return false;
      apply(s);
      return true;
    },
    // `a` gone off, with sale `s` or without it: no longer on the way to buy it.
    release(s, a) {
      if (s.by === a) s.by = null;
    },
  };
}
