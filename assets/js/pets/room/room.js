/*******************************************************************************
 * The playground's home, put together: the house (house.js), the view
 * (view.js), the four of them (actor.js) and what they pick up (props.js), the
 * girl's other clothes (girl-outfits.js), the ball, the water (water.js: the
 * sprinkler, the rain, the watering can, drips off anyone soaked), the weather
 * (weather.js), wet footprints (prints.js), the dog's lead and her raincoat, and
 * their lives (life.js, acts.js). `step(dt)` moves it all on by dt seconds and
 * draws it.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { clamp, rnd } from "../stage.js";
import { buildHouse, floorY, X0, X1, SIDE, BACK, FRONT } from "./house.js";
import { makeWater, GRAVITY } from "./water.js";
import { makeWeather } from "./weather.js";
import { makePrints } from "./prints.js";
import { part, ellipsoid } from "../models/voxels.js";
import { makeView } from "./view.js";
import { makeNav } from "./nav.js";
import { makeActor } from "./actor.js";
import { propsFor, buildBall, buildLaptop } from "./props.js";
import { makeLife } from "./life.js";
import { makeActs } from "./acts.js";
import { buildGirl } from "../models/girl.js";
import { dressGirl } from "../models/girl-outfits.js";
import { buildBoy } from "../models/boy.js";
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
export function makeRoom(stage) {
  const view = makeView(); // throws without WebGL
  const overlay = document.createElement("div");
  overlay.className = "playground-overlay";
  stage.replaceChildren(view.canvas, overlay);

  const scene = new THREE.Scene();
  const sky = new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-60, 120, 160);
  scene.add(sky, sun);
  const light = { sky: 2.2, sun: 1.1 }; // as bright as it is by day or by night, before any rain

  // The water, its drops landing on the floor (or the soil in a bed), or falling off the edge of it.
  let house = null;
  const bedAt = (x, z) => (x > 169.5 && x < 202.5 ? house.garden.beds.find((b) => z > b.z[0] + 0.5 && z < b.z[1] - 0.5) : null);
  const water = makeWater(scene, (x, z) => {
    if (bedAt(x, z)) return 3;
    if (x < X0 || x > SIDE || z < BACK || z > FRONT) return -Infinity;
    return floorY(x, z) - 0.5;
  });
  house = buildHouse(scene, water);

  const clock = { t: 0, dt: 0 };
  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };
  const home = {
    scene,
    view,
    overlay,
    clock,
    pointer,
    house,
    nav: makeNav(house.bounds, house.obstacles),
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

  // The things they share: the ball, and the laptop on the coffee table.
  home.ball = buildBall(scene, house.spots.ballHome);
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
      if (a.out || !a.rig.group.visible) continue;
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
      if (a.out || !a.rig.group.visible) continue;
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

  // The one nearest the viewer under canvas px (x, y), if anyone.
  const hit = (x, y) =>
    home.actors
      .filter((a) => a.over(x, y))
      .sort((p, q) => view.depth(p.x, p.y, p.z) - view.depth(q.x, q.y, q.z))
      .at(0) || null;
  // Whether canvas px (x, y) is on the dressing corner: its rail and clothes, the mirror or the screen.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const onCloset = (x, y) => {
    ndc.set((x / view.W) * 2 - 1, 1 - (y / view.H) * 2);
    raycaster.setFromCamera(ndc, view.camera);
    return raycaster.intersectObjects(house.closet.parts, true).length > 0;
  };

  return {
    home,
    view,
    pointer,
    hit,
    onCloset,
    // A visitor's pick of what she should wear (girl-outfits.js's LOOKS): changing into it is the next thing
    // she does, by day (at night, in the morning); a new pick while she is on her way to change, she follows,
    // and one while she is changing is for next time. Picking what she has on (or is changing into) calls off
    // a change she is on her way to, or one still to come; otherwise it just makes her happy. She is pleased
    // to be asked (unless asleep).
    chooseOutfit(k) {
      const { outfit } = home;
      const girl = home.byName.girl;
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
    layout: (width, maxHeight) => view.layout(width, maxHeight),
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
      life.step();
      home.ball.update(clock.t);
      house.update(clock.t, dt);
      const { weather } = home;
      weather.update(clock.t, dt);
      home.drops.update(dt);
      dripping(dt);
      water.update(dt);
      prints.update();
      // Rain greys the light and the view out, and sends the butterfly and the fireflies to shelter.
      house.rain(weather.k, clock.t);
      sky.intensity = light.sky * (1 - 0.3 * weather.k);
      sun.intensity = light.sun * (1 - 0.7 * weather.k);
      if (weather.k > 0.3) [house.garden.butterfly, ...house.garden.fireflies].forEach((m) => (m.visible = false));
      const hovered = pointer.mouse ? hit(pointer.x, pointer.y) : null;
      home.actors.forEach((a) => a.update(dt, a === hovered));
      if (draw) {
        drawLeads();
        view.render(scene);
      }
      return hovered;
    },
  };
}
