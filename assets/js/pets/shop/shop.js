/*******************************************************************************
 * The playground's flower shop, put together: a market florist's kiosk of
 * dark green steel and glass under a flat glass awning, buckets of flowers
 * banked out over the pavement, house plants on a concrete plinth, a mural of
 * painted flowers behind (layout.js; built by kiosk.js, display.js and
 * grounds.js), and the girl who keeps it, the boy who helps her and her collie
 * (life.js, acts.js, hours.js), the same three as at home (room/actor.js,
 * room/steps.js), in their day clothes here, on a floor plan of their own
 * (room/nav.js). It keeps its hours (hours.js): open ten till ten, all
 * brought in and the shutter down for the night. Its customers come by while
 * it is open (customers.js); shut, the street has a life of its own: the lamp
 * and its moths and the possum in the tree (night.js), a stray cat and the
 * street sweeper at first light (street.js), people passing (customers.js).
 * The page (playground.js) swaps it for the house and
 * back: it has the house's ways (`step`, `hit`, `thingAt`, `greet`, `dress`,
 * `hour`, `layout`), its own view (view.js) sized as the house's.
 ******************************************************************************/

import "../room/house.js"; // (first, as in room.js: the house's modules import one another round in a ring)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd } from "../stage.js";
import { makeNav } from "../room/nav.js";
import { makeActor } from "../room/actor.js";
import { propsFor } from "../room/props.js";
import { DAY_SECS, DAWN, lightAt, isNightAt } from "../room/daytime.js";
import { buildGirl } from "../models/girl.js";
import { dressGirl } from "../models/girl-outfits.js";
import { buildCollie } from "../models/collie.js";
import { buildBoy } from "../models/boy.js";
import { makeShopView } from "./view.js";
import { GROUND, KIOSK, FLOOR, HOURS } from "./layout.js";
import { setFade } from "./fade.js";
import { buildingKiosk } from "./kiosk.js";
import { buildingDisplay } from "./display.js";
import { buildingGrounds } from "./grounds.js";
import { buildingNight } from "./night.js";
import { shopProps } from "./props.js";
import { makeShopLife } from "./life.js";
import { buildingCustomers } from "./customers.js";
import { buildingStreet } from "./street.js";

// The three of them, where each starts the day, and how big (the collie as in the house).
const CAST = [
  ["girl", buildGirl, "human", [-110, -80], 1],
  ["boy", buildBoy, "human", [-60, -12], 1],
  ["collie", buildCollie, "pet", [-20, -50], 0.8],
];

// Whether (x, z) is on the kiosk's floor, a step up from the pavement.
const inKiosk = (x, z) => x > KIOSK.x0 && x < KIOSK.x1 && z > KIOSK.z0 && z < KIOSK.z1;
export const floorY = (x, z) => (inKiosk(x, z) ? FLOOR : 0);
const WORK_CLOCK = 0.3; // how fast the clock goes while they close up or set out, of its usual speed

export const makeShop = (stage) => {
  const steps = buildingShop(stage);
  for (;;) {
    const { done, value } = steps.next();
    if (done) return value;
  }
};

// The shop, a small part at a time (the page shows how far it has got on its loading bar): yields
// [how far it has got (0 to 1), what it is building just now, how far along that is (0 to 1)]; returns
// the shop.
export function* buildingShop(stage) {
  const view = makeShopView();
  const overlay = document.createElement("div");
  overlay.className = "playground-overlay";
  stage.replaceChildren(view.canvas, overlay);

  const scene = new THREE.Scene();
  const sky = new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  // The sun high overhead (as the house's, at noon), from a little to the front and the east; its shadows
  // drawn once, and again only when something that casts one moves for good (`shadowsDirty`).
  sun.position.set(120, 380, 160);
  sun.target.position.set(10, 0, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 200, bottom: -200, near: 1, far: 1000 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.5;
  sun.shadow.autoUpdate = false;
  scene.add(sky, sun, sun.target);
  yield [0.05, "Flower shop · kiosk", 0];

  const clock = { t: 0, dt: 0 };
  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };
  const day = { hour: DAWN + 3, litAt: -Infinity, L: lightAt(DAWN + 3) };
  const shared = { scene, clock, night: false, hour: () => day.hour, view };

  // A builder's parts (`count` of them), a yield after each, as `what`.
  function* built(steps, from, to, count, what) {
    for (let n = 0; ; ) {
      const { done, value } = steps.next();
      if (done) {
        scene.add(value.group);
        return value;
      }
      const part = Math.min(1, ++n / count);
      yield [from + (to - from) * part, what, part];
    }
  }
  const kiosk = yield* built(buildingKiosk(shared), 0.05, 0.35, 14, "Flower shop · kiosk");
  const display = yield* built(buildingDisplay(shared), 0.35, 0.65, 54, "Flower shop · flowers");
  const grounds = yield* built(buildingGrounds(shared), 0.65, 0.78, 19, "Flower shop · pavement and plants");
  const night = yield* built(buildingNight(shared), 0.78, 0.8, 3, "Flower shop · the night");
  const builders = [kiosk, display, grounds, night];
  const obstacles = builders.flatMap((b) => b.obstacles);
  const bounds = [GROUND.x0 + 4, GROUND.x1 - 4, GROUND.z0 + 4, GROUND.z1 - 4];

  // The floor plan the house's walking (room/steps.js) goes by: here only one, the shop's.
  const nav = makeNav(bounds, obstacles, floorY);
  const plan = { floorY: (x, z) => floorY(x, z), bounds, obstacles };
  const home = {
    scene,
    view,
    overlay,
    clock,
    pointer,
    hour: () => day.hour,
    house: { ...plan, yard: plan, basement: plan },
    nav,
    yardNav: nav,
    belowNav: nav,
    belowObstacles: obstacles,
    outSeen: () => true,
    floorSeen: () => true,
    actors: [],
    humans: [],
    pets: [],
    byName: {},
    night: false,
    kiosk,
    display,
    grounds,
    nighttime: night, // (the lamp and the possum: night.js)
  };
  const CASTING = "Flower shop · people and the dog";
  yield [0.8, CASTING, 0];
  for (const [k, [name, build, kind, [x, z], size]] of CAST.entries()) {
    const a = makeActor(name, build(), kind, home, size);
    Object.assign(a, { x, z, y: floorY(x, z), start: [x, z], nextAt: rnd(1, 3) });
    if (a.human) {
      yield [0.85, CASTING, 0.4];
      a.props = propsFor(a.rig, name);
      a.shop = shopProps(a.rig);
      if (name === "girl") dressGirl(a.rig); // (her day clothes, as at home)
    }
    home.actors.push(a);
    (a.human ? home.humans : home.pets).push(a);
    home.byName[name] = a;
    yield [0.85 + (0.1 * (k + 1)) / CAST.length, CASTING, (k + 1) / CAST.length];
  }
  const life = makeShopLife(home);
  home.life = life;
  const PEOPLE = "Flower shop · customers";
  yield [0.95, PEOPLE, 0];
  const customers = (home.customers = yield* (function* () {
    const steps = buildingCustomers(home);
    for (;;) {
      const { done, value } = steps.next();
      if (done) return value;
      yield [0.95 + 0.04 * value, PEOPLE, value];
    }
  })());
  const street = (home.street = yield* (function* () {
    const steps = buildingStreet(home);
    for (;;) {
      const { done, value } = steps.next();
      if (done) return value;
      yield [0.99 + 0.01 * value, "Flower shop · the street", value];
    }
  })());

  // The time of day: night, the lights on (each builder's dress()); they keep to their day clothes at work.
  function nightfall(night) {
    home.night = shared.night = night;
    builders.forEach((b) => b.dress?.(night));
    home.actors.forEach((a) => a.dress(false));
  }
  function daylight(now = false) {
    if (!now && Math.abs(day.hour - day.litAt) < 0.005) return;
    day.litAt = day.hour;
    const L = (day.L = lightAt(day.hour));
    sky.color.copy(L.sky);
    sky.groundColor.copy(L.ground);
    sun.color.copy(L.sun);
    sky.intensity = L.skyK;
    sun.intensity = L.sunK;
    builders.forEach((b) => b.daylight?.(L, day.hour));
  }
  nightfall(isNightAt(day.hour));
  daylight(true);
  life.hours.settle(day.hour);
  let shadowsDirty = true;

  // The time put on to `hour` at a jump (the clock clicked, the shop seen again): everything put where it
  // would be by then, unless the shop is as it should be already (open by day, shut by night), or the jump
  // is only a moment.
  function jumpTo(hour) {
    const was = day.hour;
    day.hour = ((hour % 24) + 24) % 24;
    if (isNightAt(day.hour) !== home.night) nightfall(!home.night);
    daylight(true);
    const s = life.hours.state;
    const signed = life.hours.open() === day.hour >= HOURS.open; // (the sign as it should be then)
    const out = life.hours.setOutAt(day.hour);
    const settled = (s === "open" && out && signed) || (s === "closed" && !out);
    const moment = Math.abs(((day.hour - was + 36) % 24) - 12) < 0.05; // (within 3 minutes, either way)
    if (!settled && !moment) {
      life.hours.settle(day.hour);
      customers.clear();
      street.clear();
      night.settle();
    }
    shadowsDirty = true;
  }

  // Out of each other's way: people (the two of them, customers) walking close by someone step aside, a
  // little a frame and onto free ground only, and walk on round them (each step of a walk heads for where it
  // is going from wherever they are); someone standing at something is left be (and anyone walking up to
  // them steps round them).
  const SPACE = 9; // between two people, at the closest
  function giveWay(dt) {
    const all = home.actors;
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (!a.human || !b.human || a.away || b.away || !(a.walking || b.walking)) continue;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d >= SPACE || d < 1e-6 || Math.abs(a.y - b.y) > 6) continue;
        const push = Math.min(SPACE - d, 30 * dt * Math.max(a.pace, b.pace)) / (a.walking && b.walking ? 2 : 1) / d;
        aside(a, dx * push, dz * push);
        aside(b, -dx * push, -dz * push);
      }
  }
  // (Never back the way they are going: that only holds two coming face to face where they are, each walking
  // into the push. That part of it turns into a step to the side, to their right, or else their left: two
  // face to face so slip past each other.)
  function aside(a, dx, dz) {
    if (!a.walking) return;
    const [hx, hz] = a.heading ?? [0, 0];
    const back = dx * hx + dz * hz;
    if (back < 0) {
      [dx, dz] = [dx - back * hx, dz - back * hz];
      const right = [dx + back * hz, dz - back * hx];
      [dx, dz] = home.nav.free(a.x + right[0], a.z + right[1]) ? right : [dx - back * hz, dz + back * hx];
    }
    if (home.nav.free(a.x + dx, a.z + dz)) {
      a.x += dx;
      a.z += dz;
    }
  }

  // The one nearest the viewer under canvas px (x, y), if anyone.
  const hit = (x, y) =>
    home.actors
      .filter((a) => a.over(x, y))
      .sort((p, q) => view.depth(p.x, p.y, p.z) - view.depth(q.x, q.y, q.z))
      .at(0) || null;
  // The thing to click under canvas px (x, y), if it is the first thing seen there: one of the builders'
  // `clickables` ({ parts, toggle, can }), not behind any of their `hides` (the kiosk's walls, say).
  const clickables = builders.flatMap((b) => b.clickables);
  // (The tree shaken, the possum on it is off up into the crown.)
  const tree = clickables.find((c) => c.key === "tree");
  const shake = tree.toggle;
  tree.toggle = () => {
    shake();
    night.possum.startle();
  };
  const hiders = builders.flatMap((b) => b.hides ?? []);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function thingAt(x, y) {
    ndc.set((x / view.W) * 2 - 1, 1 - (y / view.H) * 2);
    raycaster.setFromCamera(ndc, view.camera);
    let best = null;
    for (const c of clickables) {
      if (c.can && !c.can()) continue;
      const hits = raycaster.intersectObjects(c.parts, true).filter((h) => h.object.visible);
      if (hits.length && (!best || hits[0].distance < best.distance)) best = { thing: c, distance: hits[0].distance };
    }
    if (!best) return null;
    raycaster.far = best.distance - 0.5;
    const hidden = raycaster.intersectObjects(hiders, true).some((h) => h.object.visible);
    raycaster.far = Infinity;
    return hidden ? null : best.thing;
  }

  return {
    home,
    view,
    pointer,
    hit,
    thingAt,
    // A click on someone: a hop and a heart (a sleeper wakes).
    greet: (who) => who.cheer(),
    // A click on a thing: what it does (a bucket of flowers: she makes up a bouquet of them).
    click: (thing) => thing.toggle(home),
    layout: (W, H) => view.layout(W, H),
    // Day or night, as the visitor switches it: the shop's morning (just before they come to open up) or
    // its evening (the last of it before closing time).
    dress(night) {
      jumpTo(night ? HOURS.close - 0.25 : HOURS.arrive - 0.05);
    },
    hour: () => day.hour,
    timeTo: jumpTo,
    // Ready to be drawn without a hitch, a frame's work at a time: the shaders compiled a builder's things a
    // frame, in the background where the browser can (three.js's compileAsync waits for ever without that,
    // and it is given a few seconds at most anyway); drawn (out of sight) a builder more a frame, so that the
    // buffers and textures go up to the graphics card a part at a time; then everyone half faded (coming or
    // going: fade.js), for the shaders of that; then the sun's shadows, in a frame of their own.
    async warm(progress = () => {}) {
      const { renderer, camera } = view;
      const frame = () => new Promise((done) => requestAnimationFrame(() => setTimeout(done)));
      const parallel = renderer.extensions.has("KHR_parallel_shader_compile");
      const parts = [...builders.map((b) => b.group), ...home.actors.map((a) => a.rig.group)];
      const steps = 2 * parts.length + 2;
      let done = 0;
      for (const g of parts) {
        await frame();
        if (parallel) await Promise.race([renderer.compileAsync(g, camera, scene), new Promise((ok) => setTimeout(ok, 4000))]);
        else renderer.compile(g, camera, scene);
        progress(++done / steps);
      }
      parts.forEach((g) => (g.visible = false));
      for (const g of parts) {
        await frame();
        g.visible = true;
        view.render(scene);
        progress(++done / steps);
      }
      await frame();
      customers.sample(true);
      home.actors.forEach((a) => setFade(a, 0.5));
      view.render(scene);
      home.actors.forEach((a) => setFade(a, a.away ? 0 : 1));
      customers.sample(false);
      progress(++done / steps);
      await frame();
      sun.shadow.needsUpdate = renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
      view.render(scene);
      progress(1);
    },
    // Move on by dt seconds and draw (`draw` false: without drawing, out of view or for tests); `hour`, the
    // time of day to be at (the house's, while it is in view), else the clock goes on. Returns who is hovered.
    step(dt, draw = true, hour = null) {
      clock.dt = dt;
      clock.t += dt;
      // (The clock goes slower while they close up or set out: it is an hour's work, done at a walk.)
      day.hour = hour ?? (day.hour + ((dt * 24) / DAY_SECS) * (life.hours.busy() ? WORK_CLOCK : 1)) % 24;
      if (isNightAt(day.hour) !== home.night) nightfall(!home.night);
      daylight();
      life.step();
      customers.step();
      street.step();
      giveWay(dt);
      builders.forEach((b) => b.update?.(clock.t, dt, home));
      const hovered = pointer.mouse ? hit(pointer.x, pointer.y) : null;
      // (anyone out of the scene, gone off up the street or home, is not posed: fade.js hides them)
      home.actors.forEach((a) => a.rig.group.visible && a.update(dt, a === hovered));
      life.hours.follow();
      if (draw) {
        if (shadowsDirty || builders.some((b) => b.shadowsDirty?.())) {
          sun.shadow.needsUpdate = view.renderer.shadowMap.needsUpdate = true;
          shadowsDirty = false;
        }
        view.render(scene);
      }
      return hovered;
    },
  };
}
