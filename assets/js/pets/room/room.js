/*******************************************************************************
 * The playground's home, put together: the house (house.js), the view
 * (view.js), the four of them (actor.js) and what they pick up (props.js), the
 * girl's and the boy's other clothes (girl-outfits.js, boy-outfits.js), the
 * ball, the water (water.js: the sprinkler, the rain, the watering can, drips
 * off anyone soaked), the weather (weather.js), wet footprints (prints.js), the
 * dog's lead and her raincoat, the reflection in her mirror (mirror.js), the
 * front garden out of the front door (house/yard.js) and who lives in it
 * (wildlife.js), the view turning round to it (view.js) or the back wall
 * fading to show it (peek.js), and their lives (life.js, acts.js). `step(dt)`
 * moves it all on by dt seconds and draws it.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { clamp, rnd, wrap } from "../stage.js";
import { buildingHouse, built, floorY, X0, X1, SIDE, BACK, FRONT, YARD } from "./house.js";
import { makeWater, GRAVITY } from "./water.js";
import { makeWeather } from "./weather.js";
import { makePrints } from "./prints.js";
import { part, ellipsoid } from "../models/voxels.js";
import { makeView, VIEW_YAW, TURNED_YAW } from "./view.js";
import { makeMirror } from "./mirror.js";
import { makeOutlooks } from "./outlook.js";
import { makePeek } from "./peek.js";
import { makeWildlife } from "./wildlife.js";
import { makeNav } from "./nav.js";
import { makeActor } from "./actor.js";
import { propsFor, buildBall, buildLaptop } from "./props.js";
import { makeLife } from "./life.js";
import { makeActs } from "./acts.js";
import { buildGirl } from "../models/girl.js";
import { dressGirl } from "../models/girl-outfits.js";
import { buildBoy } from "../models/boy.js";
import { dressBoy } from "../models/boy-outfits.js";
import { buildCollie } from "../models/collie.js";
import { buildCat } from "../models/cat.js";

// Who lives here, where each starts, and how big (the collie a little smaller than on the profile page, about
// as tall as the two of them).
const CAST = [
  ["girl", buildGirl, "human", [-20, -6], 1],
  ["boy", buildBoy, "human", [30, -10], 1],
  ["collie", buildCollie, "pet", [70, 30], 0.8],
  ["cat", buildCat, "pet", [-10, 96], 1],
];

// `stage` is the element to draw into; it gets the canvas and, over it, the layer for hearts and bubbles.
export const makeRoom = (stage) => built(buildingRoom(stage));

// The same, a part at a time: it yields how far it has got (0 to 1) as it goes (the page shows it), and
// returns the room.
export function* buildingRoom(stage) {
  const view = makeView(); // throws without WebGL
  const overlay = document.createElement("div");
  overlay.className = "playground-overlay";
  stage.replaceChildren(view.canvas, overlay);

  const scene = new THREE.Scene();
  const sky = new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  // Where the sun shines from: in front of the house and a little to the left, lighting the sides that face
  // the front; turned to the front garden, round behind the house the same way, lighting the back wall.
  const SUN = { r: Math.hypot(60, 160), y: 120, at: [Math.atan2(-60, 160), Math.atan2(-60, -160)] };
  const sunAt = (e) => {
    const a = SUN.at[0] + e * wrap(SUN.at[1] - SUN.at[0]);
    sun.position.set(SUN.r * Math.sin(a), SUN.y, SUN.r * Math.cos(a));
  };
  sunAt(0);
  scene.add(sky, sun);
  const light = { sky: 2.2, sun: 1.1 }; // as bright as it is by day or by night, before any rain

  // The water, its drops landing on the floor (or the soil in a bed, or the pond out the front), or falling off
  // the edge of it.
  let house = null;
  const bedAt = (x, z) => (x > 169.5 && x < 202.5 ? house.garden.beds.find((b) => z > b.z[0] + 0.5 && z < b.z[1] - 0.5) : null);
  const inPond = (x, z) => {
    const p = house.yard.pond;
    return ((x - p.x) / p.rx) ** 2 + ((z - p.z) / p.rz) ** 2 < 1;
  };
  const water = makeWater(scene, (x, z) => {
    if (bedAt(x, z)) return 3;
    if (x < YARD.x0 || x > SIDE || z < YARD.z0 || z > FRONT || (x < X0 && z > BACK)) return -Infinity;
    if (z < BACK) return inPond(x, z) ? 0.5 : -0.5;
    return floorY(x, z) - 0.5;
  });
  house = yield* within(buildingHouse(scene, water), 0, 0.8);
  const drawReflection = makeMirror(house.closet.glass, view, scene);
  const peek = makePeek(house);

  const clock = { t: 0, dt: 0 };
  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };
  const home = {
    scene,
    view,
    overlay,
    clock,
    pointer,
    house,
    nav: makeNav(house.bounds, house.obstacles, floorY),
    yardNav: makeNav(house.yard.bounds, house.yard.obstacles, floorY), // out in the front garden
    // Whether what is out the front can be seen just now: the view turned to it, or the back wall faded.
    outSeen: () => view.turn > 0.5 || peek.k > 0.5,
    actors: [],
    humans: [],
    pets: [],
    byName: {},
    night: false,
  };
  for (const [name, build, kind, [x, z], size] of CAST) {
    const a = makeActor(name, build(), kind, home, size);
    Object.assign(a, { x, z, nextAt: rnd(1, 4) });
    if (a.human) a.props = propsFor(a.rig, name);
    home.actors.push(a);
    (a.human ? home.humans : home.pets).push(a);
    home.byName[name] = a;
    yield 0.8 + 0.03 * home.actors.length;
  }

  // Her clothes: the look she has on, and the one a visitor picked for her to change into (life.js sends
  // her to the dressing corner once it is day).
  const wardrobe = dressGirl(home.byName.girl.rig);
  home.outfit = {
    want: null,
    choosing: false, // on her way to change, the pick still open (acts.js dressUp)
    into: null, // behind the screen, what she is changing into
    get current() {
      return wardrobe.current;
    },
    wear: (k) => wardrobe.wear(k),
  };
  // His day clothes: the blue T-shirt, or the puffer (changeBoy() below).
  home.boyOutfit = dressBoy(home.byName.boy.rig);
  // What she has on at his computer ({ show, ep }: screens.js's DRAMAS and an episode, or "stardew" and the
  // day), and what a visitor picked for her to put on next (life.js sends her to it; ep null for the farm:
  // its next day).
  home.watch = { want: null, on: null };

  // The things they share: the ball, the laptop on the coffee table, and the ball that goes out in a pocket
  // for fetch in the front garden (out of sight but in a hand or on the lawn).
  home.ball = buildBall(scene, house.spots.ballHome);
  home.yardBall = buildBall(scene, house.yard.spots.step);
  home.yardBall.mesh.visible = false;
  home.laptopHome = buildLaptop();
  home.laptopHome.position.set(...house.spots.laptopHome);
  home.laptopHome.rotation.y = 0.2;
  scene.add(home.laptopHome);

  // Drops from the watering can's rose while it pours (`from`, the spout, or null to stop), gone into the
  // soil at height `toY` (a plant pot's, say).
  const rose = new THREE.Vector3();
  let pouring = null;
  home.drops = {
    pour: (from, toY = 0) => (pouring = from ? { from, toY } : null),
    update(dt) {
      if (!pouring) return;
      pouring.from.getWorldPosition(rose);
      const fall = Math.max(0, rose.y - pouring.toY);
      const secs = (-12 + Math.sqrt(144 + 2 * GRAVITY * fall)) / GRAVITY; // down to the soil from 12 voxels/s
      for (let k = Math.random() * 60 * dt; k > 0; k--) water.emit("drip", rose.x + rnd(-0.7, 0.7), rose.y, rose.z + rnd(-0.7, 0.7), 0, -12, 0, secs);
    },
  };

  // Who a drop falling through (x, y, z) hits, if anyone: a cylinder round each of them, `REACH` [radius,
  // height]. It soaks them a little (the sprinkler's jet much more than the rain); someone under an open
  // umbrella keeps dry. Drops landing in a bed water it.
  const REACH = { girl: [5.5, 44], boy: [5.5, 46], collie: [9, 30], cat: [5, 18] };
  water.hit = (x, y, z, kind) => {
    if (kind === "drip") return false;
    for (const a of home.actors) {
      if (!a.rig.group.visible) continue;
      const [r, h] = REACH[a.name];
      if (y < a.y - 0.5 || y > a.y + h || Math.hypot(x - a.x, z - a.z) > r) continue;
      if (!(a.umbrella === "open" && kind === "rain")) a.wet = Math.min(1, a.wet + (kind === "jet" ? 0.04 : 0.008));
      return true;
    }
    return false;
  };
  water.landed = (x, z, kind) => {
    const bed = bedAt(x, z);
    if (bed) bed.wet = Math.min(1, bed.wet + (kind === "rain" ? 0.003 : 0.01));
  };
  home.water = water;

  // Someone soaked drips as it dries off, and leaves wet footprints for its first steps indoors after; a
  // pet shaking itself throws the water off all round.
  const soaked = new Set();
  function dripping(dt) {
    for (const a of home.actors) {
      a.wet = Math.max(0, a.wet - dt / 25);
      if (a.wet > 0.25 && !soaked.has(a)) {
        soaked.add(a);
        a.wetFeet = Math.max(a.wetFeet, 8);
      }
      if (a.wet < 0.1) soaked.delete(a);
      if (!a.rig.group.visible) continue;
      const [r, h] = REACH[a.name];
      if (Math.random() < a.wet * 8 * dt) {
        const angle = Math.random() * Math.PI * 2;
        water.emit("drip", a.x + Math.cos(angle) * r * 0.6, a.y + h * rnd(0.3, 0.8), a.z + Math.sin(angle) * r * 0.6, 0, -5, 0, 2);
      }
      if (clock.t < a.shakeUntil) {
        a.wet = Math.max(0, a.wet - dt * 0.4);
        for (let k = 0; k < 2; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = rnd(30, 55);
          water.emit("drip", a.x, a.y + h * 0.55, a.z, Math.cos(angle) * speed, rnd(10, 30), Math.sin(angle) * speed, 2);
        }
      }
    }
  }

  // Wet footprints, on the ground floor indoors; actor.js says when a foot comes down.
  const prints = makePrints(scene, clock, (x, z) => x < X1 - 4 && z > BACK + 2 && floorY(x, z) === 0);
  home.stepped = (a, side) => prints.step(a, side);

  // The weather: rain comes when it will (life.js sends in whoever it catches in the garden).
  home.weather = makeWeather(scene, water);
  home.weather.sheltered = house.yard.sheltered;

  // The collie's yellow raincoat, over her back (her body is an ellipsoid at [0, 17, 0], radii [10, 9, 15],
  // models/collie.js): a shell round it from the shoulders back, with a reflective band.
  const coat = part();
  ellipsoid(coat, [0, 17, 0], [11.3, 10.3, 16.3], (x, y, z) => (y === 15 || z <= -12 ? "trim" : Math.abs(z + 2) <= 1 ? "band" : "coat"), [
    { has: (x, y, z) => (x / 10) ** 2 + ((y - 17) / 9) ** 2 + (z / 15) ** 2 <= 1 || y < 15 || z > 8 },
  ]);
  const dog = home.byName.collie;
  dog.rig.raincoat = coat.mesh({ coat: "#f6c63c", trim: "#e0a92a", band: "#f4f4ee" });
  dog.rig.raincoat.visible = false;
  dog.rig.pose.add(dog.rig.raincoat);
  // Something popping up over a point in the room, like the sparkle over the watered plant.
  home.popAt = ([x, y, z], className) => {
    const [px, py] = view.project(x, y, z);
    const el = document.createElement("span");
    el.className = className;
    el.style.left = `${(px - 10).toFixed(1)}px`;
    el.style.top = `${(py - 10).toFixed(1)}px`;
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  };

  // Who lives in the front garden: the ducks, the frog, the birds, butterflies, fireflies.
  home.wildlife = makeWildlife(scene, house.yard, home);
  // What is seen through the windows, the real front garden through the one by the bed.
  const drawOutlooks = makeOutlooks(house.outlooks, view, scene, [house.yard.group, home.wildlife.group]);
  // The front gate swings open for anyone out there coming up to it.
  house.yard.gate.near = () => home.actors.some((a) => a.out && Math.hypot(a.x - house.yard.gate.at[0], a.z - house.yard.gate.at[1]) < 17);

  // The bedside lamp's shadows (house.bedLight) are of things that never move, so they are drawn once, as it
  // comes on.
  let shadowsDrawn = false;
  function shadows() {
    const { on } = house.bedLight;
    view.renderer.shadowMap.needsUpdate = on && !shadowsDrawn;
    shadowsDrawn = on;
  }

  const life = makeLife(home);
  home.acts = makeActs(home, life);

  /* ----- the dog's lead, from the walker's hand to her harness, sagging a little ----- */

  const LINKS = 36;
  const leadColors = { collie: new THREE.Color("#d9434f") };
  const leads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial(), LINKS);
  leads.frustumCulled = false;
  scene.add(leads);
  const m4 = new THREE.Matrix4();
  const [h, c] = [new THREE.Vector3(), new THREE.Vector3()];
  function drawLeads() {
    let n = 0;
    const walker = home.humans.find((a) => a.leads && a.rig.group.visible);
    if (walker)
      home.pets
        .filter((p) => p.harnessed && p.rig.clip && p.rig.group.visible) // not once out of sight
        .forEach((p) => {
          walker.leadHand().getWorldPosition(h);
          p.rig.clip.getWorldPosition(c);
          const d = h.distanceTo(c);
          if (d > 90) return;
          const sag = clamp(0.5 * Math.sqrt(Math.max(0, 60 * 60 - d * d)), 2, 12);
          for (let k = 0; k <= LINKS - 1; k++) {
            const u = k / (LINKS - 1);
            m4.makeTranslation(h.x + (c.x - h.x) * u, h.y + (c.y - h.y) * u - sag * 4 * u * (1 - u), h.z + (c.z - h.z) * u);
            leads.setMatrixAt(n, m4);
            leads.setColorAt(n, leadColors[p.name]);
            n++;
          }
        });
    leads.count = n;
    leads.instanceMatrix.needsUpdate = true;
    if (leads.instanceColor) leads.instanceColor.needsUpdate = true;
  }

  // The one nearest the viewer under canvas px (x, y), if anyone (a.over() leaves out anyone out the front
  // while that cannot be seen).
  const hit = (x, y) =>
    home.actors
      .filter((a) => a.over(x, y))
      .sort((p, q) => view.depth(p.x, p.y, p.z) - view.depth(q.x, q.y, q.z))
      .at(0) || null;
  // The first of `parts` under canvas px (x, y), if it is the first thing seen there: not behind the bed or
  // the sofa, or the outside of a wall (glass and the like do not hide it; anything faded by peek.js does, as
  // it would unfaded). `own(object)`: what does not hide it (its own parts, say).
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shown = (object) => {
    for (let o = object; o; o = o.parent) if (!o.visible) return false;
    return true;
  };
  function firstSeen(x, y, parts, own) {
    ndc.set((x / view.W) * 2 - 1, 1 - (y / view.H) * 2);
    raycaster.setFromCamera(ndc, view.camera);
    const first = raycaster.intersectObjects(parts, true).find(({ object }) => shown(object)); // not the remote while in a hand
    if (!first) return null;
    raycaster.far = first.distance - 0.5;
    const hidden = raycaster
      .intersectObject(scene, true)
      .some(({ object }) => object.isMesh && (!object.material.transparent || peek.faded(object)) && shown(object) && !own(object));
    raycaster.far = Infinity;
    return hidden ? null : first;
  }
  const among = (parts) => (object) => {
    for (let o = object; o; o = o.parent) if (parts.includes(o)) return true;
    return false;
  };
  // Whether canvas px (x, y) is on the dressing corner (its rail and clothes, the mirror or the screen), or on
  // his computer (the desk and what is on it, or the screens).
  const onCloset = (x, y) => !!firstSeen(x, y, house.closet.parts, among(house.closet.parts));
  const onPc = (x, y) => !!firstSeen(x, y, house.pc.parts, among(house.pc.parts));
  // What at canvas px (x, y) can be clicked to switch or open (house.js's clickables), if anything.
  const owners = new Map(house.clickables.flatMap((c) => c.parts.map((p) => [p, c])));
  const ownerOf = (object) => {
    for (let o = object; o; o = o.parent) if (owners.has(o)) return owners.get(o);
    return null;
  };
  const thingAt = (x, y) => {
    const first = firstSeen(x, y, [...owners.keys()], ownerOf);
    return first ? ownerOf(first.object) : null;
  };

  // A visitor's pick of the other kind given up (`kind` "outfit" or "watch", acted on by `act`): no longer
  // wanted, and no longer next for her.
  function dropPick(kind, act) {
    const girl = home.byName.girl;
    home[kind].want = null;
    if (girl.pending?.name === act) {
      girl.pending = null;
      girl.interrupt = false;
    }
  }

  return {
    home,
    view,
    pointer,
    hit,
    onCloset,
    onPc,
    thingAt,
    // A click on him: a hop, and into his other day clothes (the blue T-shirt and the puffer in turn) with a
    // sparkle; at night, in his pyjamas, a heart, and they are what he puts on in the morning.
    changeBoy() {
      const { boyOutfit } = home;
      boyOutfit.wear((boyOutfit.current + 1) % boyOutfit.count);
      home.byName.boy.cheer(home.night ? undefined : "room-pop room-pop-sparkle");
    },
    // A visitor's pick of what she should wear (girl-outfits.js's LOOKS): she drops what she is doing and goes
    // to change into it (life.js), by day (at night, in the morning); a new pick while she is on her way to change, she follows,
    // and one while she is changing is for next time. Picking what she has on (or is changing into) calls off
    // a change she is on her way to, or one still to come; otherwise it just makes her happy. She is pleased
    // to be asked (unless asleep).
    chooseOutfit(k) {
      const { outfit } = home;
      const girl = home.byName.girl;
      dropPick("watch", "pcGirl"); // the last pick counts
      if (k !== (outfit.into ?? outfit.current) || outfit.choosing) outfit.want = k;
      else {
        outfit.want = null;
        if (girl.pending?.name === "dress") {
          girl.pending = null;
          girl.interrupt = false; // no need to cut short what she is doing after all
        }
      }
      if (!girl.asleep) girl.cheer();
    },
    // A visitor's pick of what she should watch on his computer ({ show, ep }, as home.watch.want): she drops
    // what she is doing and puts it on (life.js), once he has finished his round if he is on it; at it already,
    // she switches over. Picking what she has on calls off a pick still to come. She is pleased to be asked.
    chooseShow(want) {
      const { watch } = home;
      const girl = home.byName.girl;
      dropPick("outfit", "dress"); // the last pick counts
      const { on } = watch;
      if (!on || on.show !== want.show || (want.show !== "stardew" && on.ep !== want.ep)) watch.want = want;
      else {
        watch.want = null;
        if (girl.pending?.name === "pcGirl") {
          girl.pending = null;
          girl.interrupt = false;
        }
      }
      if (!girl.asleep) girl.cheer();
    },
    // Why she will not put on a pick at once, if so: he is on his computer.
    watchNote() {
      const at = house.pc.sitter;
      return at && at !== home.byName.girl ? "He'll finish his round and let her on." : null;
    },
    layout: (width, maxHeight) => view.layout(width, maxHeight),
    // Gets the shaders ready to draw it all before the first frame: without holding up the page where the
    // browser can compile them in the background (three.js's compileAsync waits for ever without that, and
    // it is given a few seconds at most anyway), or else all at once.
    warm() {
      const { renderer, camera } = view;
      if (!renderer.extensions.has("KHR_parallel_shader_compile")) return Promise.resolve(renderer.compile(scene, camera));
      return Promise.race([renderer.compileAsync(scene, camera), new Promise((done) => setTimeout(done, 4000))]);
    },
    // Turn the view round to the front garden (true), or back to the house; `now`, all at once.
    turn: (out, now = false) => view.turnTo(out, now),
    // Whether canvas px (x, y) is on the front door, shut, from the front, with nothing in front of it (to fade
    // the back wall while the pointer is there; an open door shows the way out already), and a tap on it,
    // fading it for a few seconds.
    onDoor: (x, y) =>
      view.turn === 0 &&
      house.door.k < 0.02 &&
      !home.actors.some((a) => !a.out && a.over(x, y)) && // (not anyone out behind it, seen only while it is faded)
      !!firstSeen(x, y, house.doorParts, among(house.doorParts)),
    peekFor: (secs) => (peek.until = clock.t + secs),
    dress(night) {
      home.night = night;
      house.dress(night);
      home.actors.forEach((a) => a.dress(night));
      sky.color.set(night ? 0xffd2a8 : 0xffffff);
      sky.groundColor.set(night ? 0x3a3048 : 0x9a948a);
      light.sky = night ? 0.95 : 2.2;
      light.sun = night ? 0.25 : 1.1;
      sun.color.set(night ? 0xb4c4ff : 0xffffff);
    },
    // Move on by dt seconds; `draw` false runs it without drawing (for tests). Returns who is hovered.
    step(dt, draw = true) {
      clock.dt = dt;
      clock.t += dt;
      // The view turning, and the sun turning with it (so that the side seen is the side lit); the back wall
      // fading while the pointer is on it.
      if (view.update(dt)) sunAt((view.yaw - VIEW_YAW) / (TURNED_YAW - VIEW_YAW));
      peek.want = pointer.mouse && pointer.onDoor && view.turn === 0 && !house.door.open;
      if (house.door.open) peek.until = -Infinity;
      peek.update(clock.t, dt);
      life.step();
      home.ball.update(clock.t);
      home.yardBall.update(clock.t);
      home.wildlife.update(clock.t, dt);
      house.update(clock.t, dt);
      const { weather } = home;
      weather.update(clock.t, dt);
      house.yard.soak(weather.wet, weather.k > 0.3);
      home.drops.update(dt);
      dripping(dt);
      water.update(dt);
      prints.update();
      // Rain greys the light and the view out, and sends the butterfly and the fireflies to shelter.
      house.rain(weather.k, clock.t, weather.cloud, weather.sky);
      sky.intensity = light.sky * (1 - 0.3 * weather.k);
      sun.intensity = light.sun * (1 - Math.max(0.7 * weather.k, 0.35 * weather.cloud));
      if (weather.k > 0.3) [house.garden.butterfly, ...house.garden.fireflies].forEach((m) => (m.visible = false));
      const hovered = pointer.mouse ? hit(pointer.x, pointer.y) : null;
      home.actors.forEach((a) => a.update(dt, a === hovered));
      house.charger.plugged = home.laptopHome.visible;
      if (draw) {
        // The front garden, and who lives in it, only drawn while it can be seen at all: the view turned to it,
        // the back wall faded or the front door open (from the front, the back wall hides all the rest).
        house.yard.group.visible = home.wildlife.group.visible = view.turn > 0 || peek.k > 0 || house.door.k > 0.002;
        drawLeads();
        shadows(); // (drawn by the first view drawn this frame)
        drawOutlooks(pointer);
        drawReflection();
        view.render(scene);
      }
      return hovered;
    },
  };
}

// Runs a building generator `steps`, yielding how far it has got scaled to between `from` and `to`; what it
// returns.
function* within(steps, from, to) {
  for (;;) {
    const { done, value } = steps.next();
    if (done) return value;
    yield from + (to - from) * value;
  }
}
