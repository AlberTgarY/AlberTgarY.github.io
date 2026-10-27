/*******************************************************************************
 * The playground's home (assets/js/playground.js): one room of a dolls' house,
 * open at the front and on the right, built from voxels like the pets, with a
 * little vegetable garden beside it. Along the back wall: the kitchen (the
 * fridge, the counter and the bin), the front door, and the stairs up to a loft
 * with the boy's computer desk, the bed under the window and, past a low shoe
 * cabinet, the girl's dressing corner. Along the left wall: the stove, a low
 * bookshelf under the window, and the fireplace with the TV over it. In the
 * middle, the girl's sofa (girl-props.js), the coffee table on a rug and an
 * armchair; at the front right, the dining table for two, the collie's bed and
 * the cat's tree, and the garden door out to the vegetable beds. Out of the
 * front door, behind the back wall, is the front garden (house/yard.js), with
 * its own floor plan (`yard`).
 *
 * Some things move: the fridge's two doors, the bin's lid and the front door,
 * the TV (switched with its remote) and the two computer screens (screens.js
 * draws what is on them), the PlayStation's light and the controllers on their
 * stand, the laptop's charging plug, the
 * computer's power light, the gaming chair, the little Kirby on the desk
 * (rocking while the sun is up), steam off the stove, the oven's door and its
 * glow while it bakes, a dish on the dining table, the fire, the quilt when
 * someone gets into bed, the vegetables as they grow, a butterfly over the
 * garden, the clock, the clouds and a bird going by; the
 * lamps and the lights come on at night.
 *
 * World units are voxels: x to the right, y up, z towards the front. The floor
 * is at y = 0 (feet rest on y = -0.5, as on the models), the loft at LOFT.y,
 * and floorY(x, z) says how high the floor is anywhere.
 *
 * It is built in house/, a part at a time in this order: shell.js, windows.js,
 * kitchen.js, loft.js, living.js, garden.js, decor.js and yard.js, made with
 * kit.js and laid out by layout.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { solid, turned } from "./house/kit.js";
import { X0, SIDE, BACK, FRONT, DOOR, floorY } from "./house/layout.js";
import { buildShell } from "./house/shell.js";
import { buildWindows } from "./house/windows.js";
import { buildKitchen } from "./house/kitchen.js";
import { buildLoft } from "./house/loft.js";
import { buildLiving } from "./house/living.js";
import { buildGarden } from "./house/garden.js";
import { buildDecor } from "./house/decor.js";
import { buildYard } from "./house/yard.js";
import { buildStairs } from "./house/stairs.js";
import { buildBasement } from "./house/basement.js";

export { X0, X1, SIDE, BACK, FRONT, WALL_H, LOFT, DOOR, YARD, BASE_Y, DOWN, floorY } from "./house/layout.js";

// Runs a building generator (buildingHouse, room.js's buildingRoom) through all at once; what it returns.
export function built(steps) {
  for (;;) {
    const { done, value } = steps.next();
    if (done) return value;
  }
}

// `water` (water.js) flies the sprinkler's drops.
export const buildHouse = (scene, water) => built(buildingHouse(scene, water));

// The same, a part at a time: after each it yields how far it has got (0 to 1), for the page to show.
export function* buildingHouse(scene, water) {
  const house = new THREE.Group();
  scene.add(house);
  const mesh = (p) => solid(p);
  const obstacles = []; // [x0, x1, z0, z1] footprints on the floor, for finding the way round
  const updates = []; // (t, dt) each frame
  // What a visitor can click to switch or open (playground.js): the curtains, the fridge and freezer doors,
  // the cupboard door and drawer under the counter, the two lamps, the TV and its remote. Each is { parts, toggle() }; the people notice only what is done to
  // the TV.
  const clickables = [];

  // A soft shadow on the floor (or the loft) under a piece of furniture (the mesh, to move with it).
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3a2412, transparent: true, opacity: 0.16, depthWrite: false });
  function floorShadow(x0, x1, z0, z1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 4, z1 - z0 + 4), shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, floorY((x0 + x1) / 2, (z0 + z1) / 2) - 0.44, (z0 + z1) / 2);
    house.add(m);
    return m;
  }
  function footprint(x0, x1, z0, z1, shade = true) {
    obstacles.push([x0, x1, z0, z1]);
    if (shade) floorShadow(x0, x1, z0, z1);
  }
  // The footprint of a box [lx0, lx1] x [lz0, lz1] of something at `at` turned by `yaw`.
  function turnedFootprint(at, yaw, [lx0, lx1, lz0, lz1], shade = true) {
    const corners = [
      [lx0, lz0],
      [lx1, lz0],
      [lx0, lz1],
      [lx1, lz1],
    ].map((c) => turned(at, yaw, c));
    const xs = corners.map((c) => c[0]);
    const zs = corners.map((c) => c[1]);
    footprint(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), shade);
  }

  // What the parts share as they are built (each adds what the later ones need); `night`, `hour` (daytime.js)
  // and `overcast` change with the time of day and the weather (dress(), daylight() and rain() below); `sky`
  // is the windows' sky just now (its top and bottom, how high the sun is and its colour).
  const shared = {
    scene,
    water,
    house,
    mesh,
    updates,
    clickables,
    footprint,
    turnedFootprint,
    floorShadow,
    night: false,
    hour: 12,
    sky: null,
    overcast: false,
  };
  const parts = [buildShell, buildWindows, buildKitchen, buildLoft, buildLiving, buildStairs, buildDecor, buildYard, buildGarden, buildBasement];
  for (const [k, build] of parts.entries()) {
    Object.assign(shared, build(shared));
    yield (k + 1) / parts.length;
  }
  const {
    WIN_BACK,
    cloudMat,
    rainVeil,
    rainMat,
    views,
    outlooks,
    drawSky,
    drawClouds,
    bird,
    frontDoor,
    FRIDGE,
    fridge,
    COUNTER,
    front,
    keys,
    BROLLY_RACK,
    standUmbrellas,
    BIN,
    bin,
    STOVE,
    STOVE_YAW,
    sink,
    dishwasher,
    cupboard,
    oven,
    OVEN,
    potTop,
    panTop,
    stove,
    BOWLS,
    bowls,
    Y,
    DESK,
    phonesOnStand,
    CHAIR,
    LOUNGE,
    pc,
    pcParts,
    drawMonitor,
    drawSideMonitor,
    SHELF,
    shelfBooks,
    BED,
    MATTRESS,
    ON_BED,
    beds,
    lamps,
    underShelf,
    underCupboards,
    bedLight,
    floorLight,
    moth,
    RAIL_Y,
    closet,
    SOFA,
    ARMCHAIR,
    TABLE,
    charger,
    TV,
    fire,
    tvFace,
    tvControls,
    drawScreen,
    DINING,
    PLACE,
    dinner,
    DINE_Z,
    TREE,
    DOGBED,
    garden,
    yard,
    stairs,
    basement,
    doorLeaf,
    doorFrame,
  } = shared;

  /* ---------- where things are, for the people and the pets ---------- */

  const facing = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const MOTH_AT = [98, -86];
  const ovenSide = turned(STOVE, STOVE_YAW, [OVEN.x[1] + 8, 20]);
  const ovenMid = turned(STOVE, STOVE_YAW, [(OVEN.x[0] + OVEN.x[1]) / 2, 9]);
  const sinkMid = turned(STOVE, STOVE_YAW, [10.5, -0.5]);
  const washerSide = turned(STOVE, STOVE_YAW, [27, 16]);
  const cupboardSide = [COUNTER[0] - 13, -80]; // (where the fridge is opened from too: acts claim both)
  const washerMid = turned(STOVE, STOVE_YAW, [10.5, 14]);
  // Seats: where to sit (x, z) facing `yaw`, the spot in front to sit down from, and for a pet where to
  // lie on it and which way.
  const seat = (key, [x, z], yaw, front, pet, petYaw = yaw) => ({ key, x, z, yaw, front: turned([x, z], yaw, [0, front]), pet, petYaw });
  const seats = {
    ...Object.fromEntries(
      [-17, 0, 19].map((dx, i) => [
        `sofa${i}`,
        seat(`sofa${i}`, [SOFA[0] + dx, SOFA[1]], 0, 19, [SOFA[0] + dx, 9.5, SOFA[1] + 2], Math.sign(dx) * 0.45),
      ])
    ),
    armchair: seat("armchair", ARMCHAIR, 0, 19, [ARMCHAIR[0], 9.5, ARMCHAIR[1] + 2]),
    chair: seat("chair", CHAIR, Math.PI, -16, null), // sat down into from behind, rolled in to the desk
    lounge: seat("chair", LOUNGE, Math.atan2(DESK[0] + 1.5 - LOUNGE[0], DESK[1] - 4.4 - LOUNGE[1]), -16, null), // the same, rolled back to watch a show, turned to the screen
    dine0: seat("dine0", [DINING[0] - PLACE, DINE_Z], 0, -16, null), // the same, at the table
    dine1: seat("dine1", [DINING[0] + PLACE, DINE_Z], 0, -16, null),
    // In bed, lying back with the head on the pillow (turned about the hips, actor.js); where to sit on the
    // end of the bed to get in, facing out, and the spot at the foot of the bed in front of it.
    ...Object.fromEntries(
      [-1, 1].map((side, i) => [
        `bed${i}`,
        {
          key: `bed${i}`,
          x: BED[0] + side * 13,
          z: -71,
          y: MATTRESS - 1.5,
          yaw: 0,
          end: [BED[0] + side * 13, -62],
          front: [BED[0] + side * 13, -48],
          slot: i,
        },
      ])
    ),
  };
  const spots = {
    seats,
    // Beside the fridge, at its handle, so as not to stand between it and the viewer.
    fridge: { at: [-106, -79], yaw: facing([-106, -79], [FRIDGE[0] + 4, FRIDGE[1] + 12]), crisper: [FRIDGE[0], 6, FRIDGE[1] + 5] },
    // The pets' food in the cupboard under the counter, and the keys on it.
    foodBag: { at: [COUNTER[0] + 14, -78], yaw: Math.PI },
    keys: { at: [COUNTER[0] + 14, -78], yaw: Math.PI, on: [COUNTER[0] + 15, 36, COUNTER[1] + 4] },
    // At the hob: to the right of the pot, of the frying pan (the left hand on its handle), or between the
    // two, turned to it; not in front of it, so the viewer sees into the pan.
    stove: {
      pot: [-125, potTop[1] - 7],
      pan: [-125, panTop[1] - 6],
      both: [-125, potTop[1] - 7],
      yaw: { pot: facing([-125, potTop[1] - 7], potTop), pan: facing([-125, panTop[1] - 6], panTop) },
      look: { pot: stove.pot, pan: stove.pan },
    },
    // The oven: beside its door (which comes down in front of it), and the middle of it.
    oven: { at: ovenSide, yaw: facing(ovenSide, ovenMid), door: [ovenMid[0], 14, ovenMid[1]] },
    sink: { at: turned(STOVE, STOVE_YAW, [10.5, 17]), yaw: -Math.PI / 2, basin: [sinkMid[0], 34, sinkMid[1]] },
    // The dishwasher under it: beside its door (which comes down in front of it, out of the way of anyone
    // waiting for the sink), and its rack; and the cupboard under the counter with the bowls in it, the
    // chopsticks in the drawer over it (from its left, so as not to stand between it and the viewer).
    dishwasher: { at: washerSide, yaw: facing(washerSide, washerMid), rack: [washerMid[0], 8, washerMid[1]] },
    cupboard: { at: cupboardSide, yaw: facing(cupboardSide, [COUNTER[0] - 0.5, COUNTER[1] + 4]), inside: [COUNTER[0] - 0.5, 18, COUNTER[1] + 4] },
    bowls: Object.fromEntries(Object.entries(BOWLS).map(([name, bowl]) => [name, { bowl }])),
    shelf: { at: [SHELF[0] + 20, SHELF[1]], yaw: -Math.PI / 2 },
    // In front of the nightstand, beside the bed: where the plush moth is moved from and to, turned to
    // where it sits.
    moth: { at: MOTH_AT, yaw: Object.fromEntries(Object.entries(moth.spots).map(([k, { at }]) => [k, facing(MOTH_AT, [at[0], at[2]])])) },
    laptop: { at: [TABLE[0] + 8, TABLE[1] + 22], yaw: Math.PI },
    laptopHome: [TABLE[0] + 8, 12, TABLE[1] - 1],
    // The remote, from the right end of the coffee table; the controllers, from their stand on the mantel.
    remote: { at: [TABLE[0] + 29, TABLE[1] - 2], yaw: -Math.PI / 2 },
    dock: { at: [-131, 65], yaw: -Math.PI / 2 },
    plant: { at: [SOFA[0] - 53, SOFA[1] - 8], yaw: Math.PI / 2, pot: [SOFA[0] - 39, 6, SOFA[1] - 5] },
    tree: {
      at: [TREE[0] + 5, TREE[1] + 23],
      hops: [
        [TREE[0] + 5, 15.5, TREE[1] + 5],
        [TREE[0] - 6, 30.5, TREE[1] + 1],
        [TREE[0], 45.5, TREE[1] - 4],
      ],
    },
    dogBed: { at: [DOGBED[0], DOGBED[1] + 22], bed: [DOGBED[0], 2.5, DOGBED[1] + 1] },
    // On the bed (between the two of them, at their feet) and up on the window sill over it.
    bedFoot: { at: [BED[0], -48], on: [BED[0], ON_BED, -68] },
    sill: { at: [BED[0], -48], bed: [BED[0], ON_BED, -72], on: [BED[0] + 4, WIN_BACK.y[0] - 2, BACK + 3], yaw: Math.PI / 2 },
    // The cat's place on top of his computer, lying facing out.
    tower: { at: [DESK[0] + 33, -78], on: [DESK[0] + 33, Y + 24, DESK[1] + 2], yaw: 0 },
    phones: [DESK[0] - 21, Y + 26, DESK[1] + 4], // the headphones on their stand
    phonesAt: { at: [DESK[0] - 16, -80], yaw: Math.PI }, // where to reach them from
    bin: { at: [BIN[0], -86], yaw: Math.PI, lid: [BIN[0], 17, BIN[1]] },
    // The fireplace: the log basket, where to kneel to light the fire, and where the pets lie by it.
    logs: { at: [-124, 100], yaw: -Math.PI / 2 },
    hearth: { at: [-122, TV.at[1]], yaw: -Math.PI / 2, fire: tvFace(0, 12, 6) },
    fireside: [
      [-106, 54],
      [-108, 84],
    ],
    // The dressing corner: the rail, the mirror, and behind the screen.
    closet: { at: [184, -88], yaw: Math.PI, rail: [184, RAIL_Y - 12, -104] },
    mirror: { at: [176, -86], yaw: -Math.PI / 2, glass: [161, Y + 30, -88] },
    change: { at: [191, -61] },
    // The vegetable garden out the front (house/garden.js): each bed, the can, a patch of sun, the way in.
    ...garden.spots,
    watchPc: { at: [CHAIR[0] - 30, CHAIR[1] + 16] }, // beside his chair, not in front of him or the headphones
    // Where the dog sits hoping for a bite, the dish, and where to stand to set a dish down (at the left end
    // of the table, out of the way of the chairs).
    dining: {
      beg: [DINING[0] - 40, DINE_Z + 2],
      dish: [DINING[0], 16, DINING[1] + 1],
      serve: { at: [DINING[0] - 33, DINING[1] - 2], yaw: Math.PI / 2 },
    },
    rug: [
      [TABLE[0] - 50, TABLE[1] - 14],
      [TABLE[0] + 50, TABLE[1] - 14],
      [TABLE[0] - 40, TABLE[1] + 24],
      [TABLE[0] + 40, TABLE[1] + 24],
    ],
    ballHome: [DOGBED[0] - 26, DOGBED[1] + 2],
    tv: tvFace(0, 57, 0),
    monitor: [DESK[0] + 1.5, Y + 30, DESK[1] - 4],
    window: [BED[0], (WIN_BACK.y[0] + WIN_BACK.y[1]) / 2, BACK],
    // Where to take an umbrella off the rack, or hang it back.
    umbrellas: { at: [BROLLY_RACK[0], BACK + 13], yaw: Math.PI },
    // The front door: where to wait inside it, and out on the porch (the front garden: yard.spots).
    door: { x: DOOR.x, inside: BACK + 14, outside: yard.spots.step[1] },
  };

  // Paths keep to the house and the garden.
  const bounds = [X0 + 4, SIDE - 4, BACK + 4, FRONT - 4];
  // A point in the basement, marked as being down there (steps.js walks there down the stairs); its spots all are.
  const below = (p) => Object.assign([...p], { below: true });
  (function mark(o) {
    for (const [k, v] of Object.entries(o)) {
      if (Array.isArray(v) && v.length >= 2 && v.length <= 3 && v.every((n) => typeof n === "number")) o[k] = below(v);
      else if (v && typeof v === "object" && !v.isObject3D) mark(v);
    }
  })(basement.spots);

  function dress(isNight) {
    shared.night = isNight;
    drawSky();
    drawClouds();
    views.dress(shared.night);
    yard.dress(shared.night);
    lamps.forEach((l) => l.set(shared.night)); // whatever was switched, as it was, now it is day or night
    underShelf.set(shared.night);
    underCupboards.set(shared.night);
  }
  // The time of day (daytime.js's hour, its light): the clocks keep it; the sky in the windows and the haze
  // out there change with it (the sky drawn again every few minutes of it).
  let skyAt = -Infinity;
  function daylight(light, hour) {
    views.haze(light.haze);
    if (Math.abs(hour - skyAt) < 0.1) return;
    skyAt = hour;
    shared.sky = {
      top: `#${light.top.getHexString()}`,
      bottom: `#${light.bottom.getHexString()}`,
      up: light.up,
      sun: `#${light.sun.getHexString()}`,
    };
    drawSky();
  }
  drawScreen(0);
  drawMonitor(0);
  drawSideMonitor(0);

  // How hard it is raining (0 to 1, weather.js): the veil over the windows, streaks running down it, and the
  // clouds gone grey.
  const grey = new THREE.Color("#8d97a3");
  // How cloudy it is (0 to 1) and what the forecast says (weather.js's sky), too.
  function rain(k, t, cloud, sky) {
    if (cloud > 0.6 !== shared.overcast) {
      shared.overcast = cloud > 0.6;
      drawSky();
      drawClouds();
    }
    tvControls.sky = sky;
    views.rain(k);
    rainMat.opacity = k;
    rainVeil.tex.offset.set(0.02 * t, (t * 1.6) % 1);
    cloudMat.color.setRGB(1, 1, 1).lerp(grey, Math.max(k, 0.45 * cloud));
  }

  return {
    group: house,
    obstacles,
    bounds,
    spots,
    floorY,
    dress,
    daylight,
    setHour: (hour) => (shared.hour = hour),
    rain,
    // The umbrellas on the rack by the door: `take(who)` and `put(who)` (who: "girl" or "boy").
    umbrellas: {
      take: (who) => (standUmbrellas[who].visible = false),
      put: (who) => (standUmbrellas[who].visible = true),
      in: (who) => standUmbrellas[who].visible,
    },
    update: (t, dt) => updates.forEach((u) => u(t, dt)),
    // The TV (house/living.js): what is on, who switched it, the remote and the controllers.
    tv: tvControls,
    pc: {
      // `mode`: "off", "menu" (his launcher), "game", "win", "lose" or "show" (a drama she watches); `game` the
      // one played or shown (screens.js's GAMES, her farm game "stardew", or DRAMAS); `side` what his side screen shows
      // (screens.js's SIDES). `sitter`: who the chair turns with. Her shows: `ep` the episode (her farm game:
      // the day), `from` how many seconds into it (watching on after being called away). `parts`: what a click
      // on his computer can land on.
      set(mode, t, game = pc.game, ep = 0, from = 0) {
        if (mode === pc.mode && game === pc.game && ep === pc.ep) return;
        pc.mode = mode;
        pc.game = game;
        pc.since = t - from;
        pc.ep = ep;
        drawMonitor(t);
        drawSideMonitor(t);
      },
      get mode() {
        return pc.mode;
      },
      get sitter() {
        return pc.sitter;
      },
      set sitter(a) {
        pc.sitter = a;
      },
      // Where the chair is rolled to ([x, z], or null for the desk).
      set rolled(at) {
        pc.rolled = at;
      },
      set side(s) {
        pc.side = s;
      },
      set talking(on) {
        pc.talking = on;
      },
      phones: phonesOnStand, // shown while he is not wearing them
      parts: pcParts,
    },
    fridge,
    oven,
    dinner,
    door: frontDoor,
    bin,
    stove,
    fire,
    beds,
    moth, // her plush moth, on the bed or the nightstand (loft.js)
    bedLight, // the bedside lamp's light, which casts shadows (loft.js)
    shadowLights: [bedLight, floorLight, ...shared.basement.shadowLights], // the lamps whose shadows are drawn once, when they need it (room.js)
    bird,
    outlooks, // the windows' glass and what is out there (outlook.js)
    books: shelfBooks,
    bowls,
    closet,
    sink,
    dishwasher, // under the sink (kitchen.js)
    cupboard, // the bowls and chopsticks, under the counter
    keys,
    charger,
    clickables,
    doorParts: [doorLeaf, doorFrame], // the front door and its frame (the pointer on them fades the back wall: peek.js)
    garden,
    yard,
    stairs, // the way down (house/stairs.js)
    below,
    basement, // and what is down there, with its own floor plan (house/basement.js)
  };
}
