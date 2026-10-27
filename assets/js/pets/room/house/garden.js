/*******************************************************************************
 * The vegetable garden, out in the front garden in the strip along the hedge on
 * its right (layout.js's GARDEN), just as it was beside the living room: four
 * raised beds of vegetables one after another, a path of stepping stones down
 * the side of them, a white picket fence along that side (with a little gate
 * half way along, flowers outside it), the basket, the watering can and the
 * sprinkler, and the tap on a fence post with the hose reel outside it.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box, hash, cells } from "../../models/voxels.js";
import { pick, clamp } from "../../stage.js";
import { VEG, KINDS, seeded, extent, basketPart, fillBasket, canPart } from "../veg.js";
import { buildSprinkler } from "../sprinkler.js";
import { GARDEN } from "./layout.js";
import { COLORS, pixelTexture, solidMaterial, solid, place, turned } from "./kit.js";
import { SUN_LAYER } from "./yard.js";

const PATH = 157; // the stepping stones down the side of the beds
const FENCE = GARDEN.x0 + 2; // the picket fence along that side
const GATE = { z: -172, half: 9 }; // the gate in it, between the second bed and the third
const GATE_OUT = [FENCE - 10, GATE.z]; // on the lawn outside the gate

// `shared`: what the house so far has to share (house.js), with `night` and `overcast` as they are now, and
// the front garden (yard.js) to put it in.
export function buildGarden(shared) {
  const { water, house, mesh, updates, store, restockCrisper, yard } = shared;
  const G = yard.group;
  const footprint = (x0, x1, z0, z1) => yard.obstacles.push([x0, x1, z0, z1]);
  // What stands still casts a shadow in the sun (yard.js), the rest only takes them.
  const still = (m, cast = true) => {
    m.receiveShadow = true;
    if (cast) {
      m.castShadow = true;
      m.layers.enable(SUN_LAYER);
    }
    return m;
  };

  // The picket fence down the lawn side, as it was along the garden's front and side: pickets on two rails,
  // the gate standing open into the garden, and its posts; stepping stones down the path inside it, and
  // two out through the gate.
  const fence = part();
  for (let z = GARDEN.z0 + 1; z < GARDEN.z1 - 1; z++) {
    const k = z - GARDEN.z0;
    if (Math.abs(z - GATE.z) < GATE.half) continue;
    for (let y = 0; y <= 10; y++) {
      if (k % 3 === 0 && y <= 9 + ((k / 3) % 2)) fence.add(FENCE, y, z, y >= 9 ? "frameShade" : "frame");
      else if (y === 3 || y === 7) fence.add(FENCE, y, z, "frame");
    }
  }
  for (const z of [GATE.z - GATE.half, GATE.z + GATE.half])
    box(fence, [FENCE - 1, FENCE + 1], [0, 12], [z - 1, z + 1], (x, y) => (y === 12 ? "frameShade" : "frame"));
  // The gate, open in towards the garden, against the fence: a little picket gate on its hinges.
  for (let k = 0; k < 2 * GATE.half - 3; k++)
    for (let y = 1; y <= 10; y++) {
      const [x, z] = [FENCE + 1 + Math.round(k * 0.94), GATE.z + GATE.half - 2 - Math.round(k * 0.34)];
      if (k % 3 === 0 && y <= 9 + ((k / 3) % 2)) fence.add(x, y, z, y >= 9 ? "frameShade" : "frame");
      else if (y === 3 || y === 7 || (y === 5 && k % 2)) fence.add(x, y, z, "frame");
    }
  G.add(still(mesh(fence)));
  footprint(FENCE - 2, FENCE + 1, GARDEN.z0, GATE.z - GATE.half);
  footprint(FENCE - 2, FENCE + 1, GATE.z + GATE.half, GARDEN.z1);
  const stones = part();
  const stone = (cx, cz) => {
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 1; z++) if (x * x + z * z < 6) stones.add(cx + x, -0.2, cz + z, (x + z) % 3 ? "stone" : "stoneDark");
  };
  for (const x of [FENCE - 6, FENCE + 6]) stone(x, GATE.z);
  for (let z = GARDEN.z0 + 6; z <= GARDEN.z1 - 4; z += 8) if (Math.abs(z - GATE.z) > 4) stone(PATH, z);
  G.add(still(mesh(stones), false));

  // The beds, each with three plants of one vegetable (veg.js), every plant its own, and no two beds growing
  // the same one. What is ripe is picked off a plant piece by piece (the vine, the bush or the outer leaves
  // staying); a bed picked clean is cleared and sown again, plant by plant, with a vegetable none of the
  // beds has (and so not the one it just had). The soil is crumbly, darker where wet; a little painted
  // marker at the path end says what grows there.
  const BED_Z = [
    [-221, -206],
    [-196, -181],
    [-163, -148],
    [-138, -123],
  ];
  const PLANT_X = [172, 182, 192];
  const soilTexture = (len) =>
    pixelTexture(33, len, (g, w, h) => {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const r = hash(x, y + len, 21);
          g.fillStyle = r < 0.12 ? "#56391f" : r < 0.3 ? "#7a5639" : r > 0.985 ? "#a39280" : "#6b4a32";
          g.fillRect(x, y, 1, 1);
        }
    }).tex;
  // Plant `k` of `bed`, of `kind`: drawn at its three stages, the ripe one apart from what is picked off it
  // (`fruits`, each with where it is in the room), only one stage showing at a time.
  function grow(bed, k, kind) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const at = [PLANT_X[k], 3, bed.zc];
    const yaw = hash(seed % 997, k, 3) * 0.8 - 0.4;
    const plant = { fresh: false, meshes: [], body: null, fruits: [] };
    for (const s of [0, 1, 2]) {
      const p = part();
      const fruits = [];
      VEG[kind].draw(p, s, seeded(seed), () => (s < 2 ? p : fruits[fruits.push(part()) - 1]));
      plant.meshes.push(still(place(G, new THREE.Mesh(new THREE.BufferGeometry(), solidMaterial), at, yaw), false));
      if (s < 2) plant.meshes[s].geometry = solid(p).geometry;
      else {
        plant.body = p;
        plant.fruits = fruits.map((q) => {
          const [lx, ly, lz] = extent(q).mid;
          const [x, z] = turned([at[0], at[2]], yaw, [lx, lz]);
          return { part: q, at: [x, at[1] + ly, z], taken: false };
        });
      }
    }
    plant.meshes.push(still(place(G, new THREE.Mesh(new THREE.BufferGeometry(), solidMaterial), at, yaw), false));
    redraw(plant);
    return plant;
  }
  // The ripe plant as it is now: what is left of the fruit on it, and the rest of it (where fruit and leaf
  // meet, the fruit shows).
  function redraw(plant) {
    const [body, fruit] = [part(), part()];
    for (const f of plant.fruits) if (!f.taken) for (const v of f.part.list()) fruit.add(...v);
    for (const v of plant.body.list()) if (!fruit.has(v[0], v[1], v[2])) body.add(...v);
    [body, fruit].forEach((p, i) => {
      plant.meshes[2 + i].geometry.dispose();
      plant.meshes[2 + i].geometry = solid(p).geometry;
    });
  }
  function uproot(bed, k) {
    bed.plants[k]?.meshes.forEach((m) => (G.remove(m), m.geometry.dispose()));
    bed.plants[k] = null;
  }
  // The marker: a stake with a little board painted with the vegetable.
  function paintMarker(bed, kind) {
    const p = part();
    const [z0] = bed.z;
    const [c1, c2] = VEG[kind].sign;
    box(p, [167, 167], [3, 9], [z0 + 2, z0 + 2], "woodLight");
    box(p, [166, 168], [8, 10], [z0 + 3, z0 + 3], (x, y) => (x === 167 && y === 9 ? c1 : x === 167 && y === 10 ? c2 : "frame"));
    bed.marker.geometry.dispose();
    bed.marker.geometry = solid(p).geometry;
  }
  const STORE = 4; // bunches of the garden's vegetables the crisper holds; the oldest is eaten first
  const startKinds = [...KINDS].sort(() => Math.random() - 0.5);
  const garden = {
    beds: BED_Z.map(([z0, z1], i) => {
      const zc = (z0 + z1) / 2;
      const frame = part();
      box(frame, [165, 199], [0, 3], [z0, z1], (x, y, z) => (y === 3 ? "woodDeep" : (x + z) % 9 === 0 ? "woodDeep" : "woodMid"), [
        { has: (x, y, z) => x > 165 && x < 199 && z > z0 && z < z1 },
      ]);
      G.add(still(mesh(frame)));
      footprint(165, 200, z0, z1 + 1);
      const soil = still(
        place(G, new THREE.Mesh(new THREE.BoxGeometry(33, 1, z1 - z0 - 1), new THREE.MeshLambertMaterial({ map: soilTexture(z1 - z0 - 1) })), [
          182,
          2.5,
          zc,
        ]),
        false
      );
      const bed = {
        kind: startKinds[i],
        next: null, // what it is being sown with
        z: [z0, z1],
        zc,
        stage: [2, 1, 0, 2][i], // 0 just sown, 1 growing, 2 ripe, 3 picked clean
        growth: Math.random() * 0.6,
        wet: 0,
        soil,
        marker: place(G, new THREE.Mesh(new THREE.BufferGeometry(), solidMaterial), [0, 0, 0]),
        plants: [],
      };
      bed.plants = PLANT_X.map((x, k) => grow(bed, k, bed.kind));
      paintMarker(bed, bed.kind);
      return bed;
    }),
    // The garden's vegetables in the fridge, a bunch from each plant picked, the oldest first.
    store,
    // Water bed `i`: the soil darkens, and it grows faster while it is wet.
    water(i) {
      garden.beds[i].wet = 1;
    },
    ripe: (i) => garden.beds[i].stage === 2,
    spent: (i) => garden.beds[i].stage === 3,
    thirsty: (i) => garden.beds[i].stage < 2 && garden.beds[i].wet < 0.3,
    // What is still on plant `k` of bed `i` to be picked.
    left: (i, k) => (garden.beds[i].stage === 2 ? garden.beds[i].plants[k].fruits.filter((f) => !f.taken) : []),
    // Pick `fruit` off plant `k` of bed `i`; the piece picked. The bed is picked clean once nothing is left.
    take(i, k, fruit) {
      const bed = garden.beds[i];
      fruit.taken = true;
      redraw(bed.plants[k]);
      if (bed.plants.every((pl) => pl.fruits.every((f) => f.taken))) bed.stage = 3;
      return fruit.part;
    },
    // What bed `i` is to be sown with: a vegetable no bed has or is being sown with.
    plan(i) {
      const { beds } = garden;
      beds[i].next ??= pick(KINDS.filter((kind) => beds.every((b) => b.kind !== kind && b.next !== kind)));
      return beds[i].next;
    },
    // Its marker painted with that.
    relabel: (i) => paintMarker(garden.beds[i], garden.beds[i].next),
    // Whether there is something of plant `k` of bed `i` to pull up before sowing: the plant as it was left
    // after picking (nothing, after carrots), not one just sown.
    leftover(i, k) {
      const pl = garden.beds[i].plants[k];
      return !!pl && !pl.fresh && pl.body.list().length > 0;
    },
    // Pull up what is left of plant `k` of bed `i`; what came up.
    clear(i, k) {
      const { body } = garden.beds[i].plants[k];
      uproot(garden.beds[i], k);
      return body;
    },
    // Sow plant `k` of bed `i` (once planned): a sprout comes up.
    sowOne(i, k) {
      const bed = garden.beds[i];
      uproot(bed, k);
      bed.plants[k] = grow(bed, k, bed.next);
      bed.plants[k].fresh = true;
    },
    sown: (i, k) => !!garden.beds[i].plants[k]?.fresh,
    // Bed `i` sown all along: it starts to grow.
    done(i) {
      const bed = garden.beds[i];
      if (!bed.next) return;
      garden.relabel(i);
      bed.plants.forEach((pl, k) => pl?.fresh || garden.sowOne(i, k));
      bed.plants.forEach((pl) => (pl.fresh = false));
      Object.assign(bed, { kind: bed.next, next: null, stage: 0, growth: 0 });
    },
    // A bunch of `kind` into the crisper, or the oldest out of it (for the pot).
    put(kind) {
      store.push(kind);
      if (store.length > STORE) store.shift();
      restockCrisper();
    },
    takeOut() {
      const kind = store.shift();
      restockCrisper();
      return kind;
    },
  };
  // Flowers along the outside of the picket fence (but at the gate and the hose reel), in clumps of a few
  // colours.
  const flowers = part();
  const BLOOMS = ["pink", "yellow", "white", "lilac", "red"];
  // A clump: a few stems of one colour, each with a leaf and a flower of four petals round a yellow eye (a
  // white one round a yellow eye too, a yellow one round an orange one).
  const clump = (x, z, k) => {
    const color = BLOOMS[Math.floor(hash(k, 0, 8) * BLOOMS.length)];
    for (let n = 0; n < 2 + Math.floor(hash(x, z, 4) * 3); n++) {
      const [fx, fz] = [x + Math.round(hash(k, n, 5) * 4) - 2, z + Math.round(hash(n, k, 6) * 2) - 1];
      const h = 3 + Math.floor(hash(fx, fz, 7) * 3);
      box(flowers, [fx, fx], [0, h - 1], [fz, fz], "stem");
      flowers.add(fx + (n % 2 ? 1 : -1), 1 + (n % 2), fz, "leaf");
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        flowers.add(fx + dx, h, fz + dz, color);
      flowers.add(fx, h, fz, color === "yellow" ? "orange" : "yellow");
    }
  };
  for (let z = GARDEN.z0 + 5, k = 50; z <= GARDEN.z1 - 5; z += 6, k++)
    if (Math.abs(z - GATE.z) > GATE.half + 3 && hash(z, 2, 9) < 0.8) clump(FENCE - 3, z, k);
  G.add(still(mesh(flowers), false));
  const dry = new THREE.Color("#ffffff");
  const wet = new THREE.Color("#8f8278");
  updates.push((t, dt) => {
    for (const bed of garden.beds) {
      bed.wet = Math.max(0, bed.wet - dt / 150);
      if (bed.stage < 2) {
        bed.growth += dt / (bed.wet > 0 ? 70 : 260);
        if (bed.growth >= 1) Object.assign(bed, { stage: bed.stage + 1, growth: 0 });
      }
      // Each plant at the bed's stage (a sprout, once just sown); picked clean, what is left of it.
      for (const pl of bed.plants) {
        if (!pl) continue;
        const s = pl.fresh ? 0 : Math.min(bed.stage, 2);
        pl.meshes.forEach((m, j) => (m.visible = j === s || (s === 2 && j === 3)));
      }
      bed.soil.material.color.lerpColors(dry, wet, Math.min(1, bed.wet * 1.5));
    }
  });
  // The sprinkler between the beds, on its hose from the reel under the tap on the wall (sprinkler.js).
  const sprinkler = buildSprinkler(G, water);
  footprint(...sprinkler.footprint);
  footprint(...sprinkler.reelFootprint);
  garden.sprinkler = sprinkler;
  updates.push((t, dt) => sprinkler.update(t, dt));

  // The garden's watering can, inside the gate beside the basket when nobody has it.
  garden.can = place(G, still(mesh(canPart(part()))), [FENCE + 6, 0, GATE.z + GATE.half + 9], Math.PI / 2);

  // The garden basket, inside the gate across from the can when nobody has it out: set down beside them at a
  // bed while they pick, carried in full to the fridge (in at the front door) and back out empty, and so it
  // is the house's, not the garden's, to be seen indoors too. What is in it is in bunches, one from each
  // plant picked. Left wherever someone had to leave it (run in from the rain), till it is fetched.
  const BASKET_HOME = { at: [FENCE + 5, GATE.z - GATE.half - 7], yaw: Math.PI / 2, stand: [PATH, GATE.z - GATE.half - 7] };
  const basketMesh = new THREE.Group();
  basketMesh.add(mesh(basketPart(part())));
  const basketFill = new THREE.Group();
  basketMesh.add(basketFill);
  house.add(basketMesh);
  const basket = {
    bunches: [], // [{ kind, pieces }]
    carrier: null,
    at: BASKET_HOME.at,
    stand: BASKET_HOME.stand, // where to stand to pick it up
    home: true,
    homeAt: BASKET_HOME.at,
    homeStand: BASKET_HOME.stand,
    // Whether it is anywhere but by the door, empty.
    out: () => !basket.home || basket.bunches.length > 0,
    pieces: () => basket.bunches.flatMap((b) => b.pieces),
    // Set down at [x, z], turned by `yaw`, by someone standing at `stand`.
    setDown(at, yaw, stand, home = false) {
      Object.assign(basket, { carrier: null, at, stand, home });
      basketMesh.position.set(at[0], 0, at[1]);
      basketMesh.rotation.y = yaw;
      basketMesh.visible = true;
      basket.refill();
    },
    goHome: () => basket.setDown(BASKET_HOME.at, BASKET_HOME.yaw, BASKET_HOME.stand, true),
    pickUp(a) {
      Object.assign(basket, { carrier: a, home: false });
      basketMesh.visible = false;
    },
    refill: () => fillBasket(basketFill, basket.pieces(), solid),
  };
  basket.goHome();
  garden.basket = basket;

  // A white butterfly over the beds by day, and fireflies over the garden at night, each glowing and fading
  // in turn (and all of them coming out slowly as night falls, and going as it lifts).
  const wingPart = part();
  [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, -1],
  ].forEach(([x, z]) => wingPart.add(x, 0, z, "white"));
  const butterfly = new THREE.Group();
  const wings = [1, -1].map((side) => {
    const w = mesh(wingPart);
    w.scale.set(side * 0.7, 0.7, 0.7);
    butterfly.add(w);
    return w;
  });
  butterfly.add(
    cells(
      [
        [0, 0, 0, "hand"],
        [0, 0, 1, "hand"],
      ],
      COLORS
    )
  );
  G.add(butterfly);
  const fireflies = [0, 1, 2, 3, 4].map(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: "#e9ff8a", transparent: true, depthWrite: false }));
    G.add(m);
    return m;
  });
  let dark = 0; // 0 by day, 1 at night
  const MID = (BED_Z[0][0] + BED_Z[3][1]) / 2; // half way along the beds
  updates.push((t, dt) => {
    butterfly.visible = !shared.night;
    if (!shared.night) {
      butterfly.position.set(182 + 14 * Math.sin(t * 0.31) + 4 * Math.sin(t * 1.7), 13 + 4 * Math.sin(t * 1.1), MID + 48 * Math.sin(t * 0.19 + 1));
      butterfly.rotation.y = Math.atan2(Math.cos(t * 0.31), Math.cos(t * 0.19 + 1));
      const flap = 0.9 * Math.abs(Math.sin(t * 16));
      wings.forEach((w, i) => (w.rotation.z = (i ? 1 : -1) * flap));
    }
    dark = clamp(dark + (shared.night ? dt : -dt) / 3, 0, 1);
    fireflies.forEach((m, i) => {
      m.material.opacity = dark * clamp((Math.sin(t * (1.1 + i * 0.3) + i * 2) - 0.2) / 0.6, 0, 1);
      m.visible = m.material.opacity > 0;
      m.position.set(176 + 22 * Math.sin(t * 0.21 + i * 1.3), 8 + 6 * Math.sin(t * 0.5 + i), MID + 50 * Math.sin(t * 0.13 + i * 2.1));
    });
  });
  garden.butterfly = butterfly;
  garden.fireflies = fireflies;

  // Now and then by day a couple of bees come to the beds: chubby and striped, a while at each plant,
  // then off to another, and away over the wall when the spell is over.
  const BEE = { beeYellow: "#f6c445", beeBlack: "#3a2f28", beeWing: "#f4fbff" };
  const beeBody = part();
  box(beeBody, [0, 1], [0, 1], [-2, 1], (x, y, z) => (z === 1 || z === -1 ? "beeBlack" : "beeYellow")); // head at +z
  const beeWing = part();
  [
    [1, 0],
    [2, 0],
    [1, -1],
  ].forEach(([x, z]) => beeWing.add(x, 0, z, "beeWing"));
  const bees = new THREE.Group();
  G.add(bees);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const away = () => new THREE.Vector3(214, 26, rnd(GARDEN.z0 + 10, GARDEN.z1 - 10)); // (off over the hedge)
  const flower = () => {
    const growing = garden.beds.filter((b) => b.stage === 1 || b.stage === 2);
    const bed = pick(growing.length ? growing : garden.beds);
    return new THREE.Vector3(pick(PLANT_X) + rnd(-2, 2), rnd(7, 11), bed.zc + rnd(-3, 3));
  };
  const swarm = [0, 1].map(() => {
    const g = new THREE.Group();
    const body = beeBody.mesh(BEE);
    body.position.set(-0.5, -0.5, 0.5);
    g.add(body);
    const flaps = [1, -1].map((side) => {
      const w = beeWing.mesh(BEE);
      w.scale.x = side;
      w.position.y = 1;
      g.add(w);
      return w;
    });
    g.scale.setScalar(0.65);
    g.visible = false;
    bees.add(g);
    return { g, flaps, home: true, from: new THREE.Vector3(), to: new THREE.Vector3(), t0: 0, dur: 1, stay: 0 };
  });
  // Fly from where the bee is to `to`, starting at `t0`, and stay `stay` s there.
  const fly = (b, t0, to, stay) => {
    Object.assign(b, { from: b.g.position.clone(), to, t0, stay });
    b.dur = Math.max(0.6, b.from.distanceTo(to) / 14);
  };
  const spell = { on: false, flip: rnd(20, 60) };
  updates.push((t) => {
    bees.visible = !shared.night;
    if (shared.night) spell.on = false;
    else if (t > spell.flip) {
      spell.on = !spell.on;
      spell.flip = t + (spell.on ? rnd(40, 90) : rnd(60, 150));
    }
    swarm.forEach((b, i) => {
      if (b.home) {
        if (!spell.on) return;
        b.home = false;
        b.g.position.copy(away());
        fly(b, t + i * rnd(1, 5), flower(), rnd(2, 5));
      }
      const s = (t - b.t0) / b.dur;
      b.g.visible = s >= 0;
      if (s < 0) return;
      if (s < 1) {
        const e = s * s * (3 - 2 * s);
        b.g.position.lerpVectors(b.from, b.to, e).y += 2 * Math.sin(Math.PI * s) + 0.3 * Math.sin(t * 9 + i);
        b.g.rotation.y = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
      } else if (t < b.t0 + b.dur + b.stay) {
        // Hovering at the plant: small loops, turning about.
        const k = t * 3 + i * 2;
        b.g.position.set(b.to.x + 0.6 * Math.cos(k), b.to.y + 0.4 * Math.sin(t * 5 + i), b.to.z + 0.6 * Math.sin(k));
        b.g.rotation.y = k + Math.PI / 2;
      } else if (b.stay === 0) {
        b.home = true; // gone over the wall
        b.g.visible = false;
      } else if (spell.on) fly(b, t, flower(), rnd(2, 5));
      else fly(b, t, away(), 0);
      b.flaps.forEach((w, j) => (w.rotation.z = (j ? -1 : 1) * (0.2 + 0.7 * Math.abs(Math.sin(t * 40 + i)))));
    });
  });
  garden.bees = bees;
  garden.beeSpell = spell; // (when the next one starts or ends: `flip`)

  // Where things are: for each bed, on the path facing it (to water it), the middle of it, where to kneel to
  // its marker, before each plant on the near side of the bed (facing it, and the viewer with the view turned
  // round) with the basket set down at the right hand, and where the dog sits on the path to watch; the can's
  // place; a patch of grass by the sprinkler (out of the way of the beds' work) for a pet to lie in the sun;
  // and on the lawn outside the gate.
  garden.spots = {
    beds: garden.beds.map(({ z: [z0, z1], zc }) => ({
      at: [PATH, zc],
      yaw: Math.PI / 2,
      mid: [182, 8, zc],
      marker: { at: [PATH + 3, z0 + 3], yaw: Math.PI / 2, look: [167, 9, z0 + 3] },
      plants: PLANT_X.map((x) => ({ at: [x, z1 + 3], yaw: Math.PI, basket: [x + 7, z1 + 3], plant: [x, 5, zc] })),
      watch: [PATH - 3, z1 + 2],
    })),
    can: { at: [PATH + 1, GATE.z + GATE.half + 9], yaw: -Math.PI / 2 },
    sunny: [170, GATE.z + 1],
    gate: GATE_OUT,
  };
  // From the path to a spot by a bed and back: [x, z] on the path level with `at`.
  garden.onPath = ([, z]) => [PATH, z];
  garden.offPath = ([x]) => x > PATH + 2; // in among the beds, off the path
  // The bed (if any) whose soil is at [x, z], for the water landing on it (room.js).
  garden.bedAt = (x, z) => (x > 165.5 && x < 198.5 ? garden.beds.find((b) => z > b.z[0] + 0.5 && z < b.z[1] - 0.5) : null);
  // Whether [x, z] is in the garden, inside its fence, and where the butterfly is.
  garden.contains = (x, z) => x > FENCE && x < GARDEN.x1 && z > GARDEN.z0 && z < GARDEN.z1;
  garden.butterflyAt = () => butterfly.getWorldPosition(new THREE.Vector3());
  return { PLANT_X, garden };
}
