/*******************************************************************************
 * The playground's home, put together: the house (house.js), the view
 * (view.js), the four of them (actor.js) and what they pick up (props.js), the
 * girl's other clothes (girl-outfits.js), the ball, the drops from the
 * watering can and the dog's lead, and their lives (life.js, acts.js). `step(dt)`
 * moves it all on by dt seconds and draws it.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { clamp, rnd } from "../stage.js";
import { buildHouse } from "./house.js";
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
  const house = buildHouse(scene);

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
    if (a.human) a.props = propsFor(a.rig);
    home.actors.push(a);
    (a.human ? home.humans : home.pets).push(a);
    home.byName[name] = a;
  }

  // Her clothes: the look she has on, and the one a visitor picked for her to change into (life.js sends
  // her to the dressing corner once it is day).
  const wardrobe = dressGirl(home.byName.girl.rig);
  home.outfit = {
    want: null,
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

  // Drops falling from the watering can's rose down to the soil, while it pours.
  const drops = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), new THREE.MeshBasicMaterial({ color: "#8ecdf5" }));
    m.visible = false;
    scene.add(m);
    return m;
  });
  const rose = new THREE.Vector3();
  let pouring = null;
  home.drops = {
    pour: (from, toY) => (pouring = from ? { from, toY } : null),
    update() {
      drops.forEach((d, i) => {
        d.visible = !!pouring;
        if (!pouring) return;
        pouring.from.getWorldPosition(rose);
        const fall = (clock.t * 2.2 + i / 3) % 1;
        d.position.set(rose.x, rose.y - fall * Math.max(0, rose.y - pouring.toY), rose.z);
      });
    },
  };
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
    // she does, by day (at night, in the morning); a new pick while she is at it, she follows. Picking what
    // she has on just makes her happy, or calls the change off. She is pleased to be asked (unless asleep).
    chooseOutfit(k) {
      const girl = home.byName.girl;
      const changing = girl.jobName === "dress" || girl.pending?.name === "dress";
      home.outfit.want = k === home.outfit.current && !changing ? null : k;
      if (!girl.asleep) girl.cheer();
    },
    layout: (width, maxHeight) => view.layout(width, maxHeight),
    dress(night) {
      home.night = night;
      house.dress(night);
      home.actors.forEach((a) => a.dress(night));
      sky.color.set(night ? 0xffd2a8 : 0xffffff);
      sky.groundColor.set(night ? 0x3a3048 : 0x9a948a);
      sky.intensity = night ? 0.95 : 2.2;
      sun.intensity = night ? 0.25 : 1.1;
      sun.color.set(night ? 0xb4c4ff : 0xffffff);
    },
    // Move on by dt seconds; `draw` false runs it without drawing (for tests). Returns who is hovered.
    step(dt, draw = true) {
      clock.dt = dt;
      clock.t += dt;
      life.step();
      home.ball.update(clock.t);
      house.update(clock.t, dt);
      home.drops.update();
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
