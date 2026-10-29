/*******************************************************************************
 * The playground's flower shop, put together: a market florist's kiosk of
 * dark green steel and glass under a curved glass awning, buckets of flowers
 * banked out over the pavement, house plants on a concrete plinth, a mural of
 * painted flowers behind (layout.js; built by kiosk.js, display.js and
 * grounds.js), and the girl who keeps it and her collie (life.js, acts.js),
 * the same two as at home (room/actor.js, room/steps.js) on a floor plan of
 * their own (room/nav.js). The page (playground.js) swaps it for the house and
 * back: it has the house's ways (`step`, `hit`, `thingAt`, `greet`, `dress`,
 * `hour`, `layout`), its own view (view.js) sized as the house's.
 ******************************************************************************/

import "../room/house.js"; // (first, as in room.js: the house's modules import one another round in a ring)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { rnd } from "../stage.js";
import { makeNav } from "../room/nav.js";
import { makeActor } from "../room/actor.js";
import { propsFor } from "../room/props.js";
import { DAY_SECS, DAWN, NIGHTFALL, lightAt, isNightAt } from "../room/daytime.js";
import { buildGirl } from "../models/girl.js";
import { dressGirl } from "../models/girl-outfits.js";
import { buildCollie } from "../models/collie.js";
import { makeShopView } from "./view.js";
import { GROUND, KIOSK, FLOOR } from "./layout.js";
import { buildingKiosk } from "./kiosk.js";
import { buildingDisplay } from "./display.js";
import { buildingGrounds } from "./grounds.js";
import { shopProps } from "./props.js";
import { makeShopLife } from "./life.js";

// The two of them, where each starts, and how big (the collie as in the house).
const CAST = [
  ["girl", buildGirl, "human", [-110, -80], 1],
  ["collie", buildCollie, "pet", [-20, -50], 0.8],
];

// Whether (x, z) is on the kiosk's floor, a step up from the pavement.
const inKiosk = (x, z) => x > KIOSK.x0 && x < KIOSK.x1 && z > KIOSK.z0 && z < KIOSK.z1;
export const floorY = (x, z) => (inKiosk(x, z) ? FLOOR : 0);

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
  const grounds = yield* built(buildingGrounds(shared), 0.65, 0.8, 13, "Flower shop · pavement and plants");
  const builders = [kiosk, display, grounds];
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
  };
  const CASTING = "Flower shop · girl and collie";
  yield [0.8, CASTING, 0];
  for (const [k, [name, build, kind, [x, z], size]] of CAST.entries()) {
    const a = makeActor(name, build(), kind, home, size);
    Object.assign(a, { x, z, y: floorY(x, z), nextAt: rnd(1, 3) });
    if (a.human) {
      yield [0.85, CASTING, 0.4];
      a.props = propsFor(a.rig, name);
      a.shop = shopProps(a.rig);
      dressGirl(a.rig); // (her day clothes, as at home)
    }
    home.actors.push(a);
    (a.human ? home.humans : home.pets).push(a);
    home.byName[name] = a;
    yield [0.85 + (0.15 * (k + 1)) / CAST.length, CASTING, (k + 1) / CAST.length];
  }
  const life = makeShopLife(home);
  home.life = life;

  // The time of day: night, the lights on (each builder's dress()).
  function nightfall(night) {
    home.night = shared.night = night;
    builders.forEach((b) => b.dress?.(night));
    home.actors.forEach((a) => a.dress(night));
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
  let shadowsDirty = true;

  // The one nearest the viewer under canvas px (x, y), if anyone.
  const hit = (x, y) =>
    home.actors
      .filter((a) => a.over(x, y))
      .sort((p, q) => view.depth(p.x, p.y, p.z) - view.depth(q.x, q.y, q.z))
      .at(0) || null;
  // The thing to click under canvas px (x, y), if it is the first thing seen there: one of the builders'
  // `clickables` ({ parts, toggle, can }), not behind any of their `hides` (the kiosk's walls, say).
  const clickables = builders.flatMap((b) => b.clickables);
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
    // Day or night, as the visitor switches it: on to the start of the day or of the night.
    dress(night) {
      day.hour = night ? NIGHTFALL : DAWN;
      nightfall(night);
      daylight(true);
    },
    hour: () => day.hour,
    timeTo(hour) {
      day.hour = hour % 24;
      if (isNightAt(day.hour) !== home.night) nightfall(!home.night);
      daylight(true);
    },
    // Ready to be drawn without a hitch, a frame's work at a time: the shaders compiled a builder's things a
    // frame, in the background where the browser can (three.js's compileAsync waits for ever without that,
    // and it is given a few seconds at most anyway); drawn (out of sight) a builder more a frame, so that the
    // buffers and textures go up to the graphics card a part at a time; then the sun's shadows, in a frame of
    // their own.
    async warm(progress = () => {}) {
      const { renderer, camera } = view;
      const frame = () => new Promise((done) => requestAnimationFrame(() => setTimeout(done)));
      const parallel = renderer.extensions.has("KHR_parallel_shader_compile");
      const parts = [...builders.map((b) => b.group), ...home.actors.map((a) => a.rig.group)];
      const steps = 2 * parts.length + 1;
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
      sun.shadow.needsUpdate = renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
      view.render(scene);
      progress(1);
    },
    // Move on by dt seconds and draw (`draw` false: without drawing, for tests). Returns who is hovered.
    step(dt, draw = true) {
      clock.dt = dt;
      clock.t += dt;
      day.hour = (day.hour + (dt * 24) / DAY_SECS) % 24;
      if (isNightAt(day.hour) !== home.night) nightfall(!home.night);
      daylight();
      life.step();
      builders.forEach((b) => b.update?.(clock.t, dt, home));
      const hovered = pointer.mouse ? hit(pointer.x, pointer.y) : null;
      home.actors.forEach((a) => a.update(dt, a === hovered));
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
