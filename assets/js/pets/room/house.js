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
 * the cat's tree, and the garden door out to the vegetable beds.
 *
 * Some things move: the fridge's two doors, the bin's lid and the front door,
 * the TV (switched with its remote) and the two computer screens (screens.js
 * draws what is on them), the PlayStation's light and the controllers on their
 * stand, the laptop's charging plug, the
 * computer's power light, the gaming chair, the little Kirby on the desk
 * (rocking while the sun is up), steam off the stove, the oven's door and its
 * glow while it bakes, a dish on the dining table, the fire, the quilt when
 * someone gets into bed, the vegetables as they grow, a butterfly over the
 * garden, the clock, the clouds, a bird going by and the string lights; the
 * lamps and the lights come on at night.
 *
 * World units are voxels: x to the right, y up, z towards the front. The floor
 * is at y = 0 (feet rest on y = -0.5, as on the models), the loft at LOFT.y,
 * and floorY(x, z) says how high the floor is anywhere.
 *
 * It is built in house/, a part at a time in this order: shell.js, windows.js,
 * kitchen.js, loft.js, living.js, garden.js and decor.js, made with kit.js and
 * laid out by layout.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { solid, turned } from "./house/kit.js";
import { X0, SIDE, BACK, FRONT, DOOR, GARDEN_DOOR, floorY } from "./house/layout.js";
import { buildShell } from "./house/shell.js";
import { buildWindows } from "./house/windows.js";
import { buildKitchen } from "./house/kitchen.js";
import { buildLoft } from "./house/loft.js";
import { buildLiving } from "./house/living.js";
import { buildGarden } from "./house/garden.js";
import { buildDecor } from "./house/decor.js";

export { X0, X1, SIDE, BACK, FRONT, WALL_H, LOFT, DOOR, floorY } from "./house/layout.js";

// `water` (water.js) flies the sprinkler's drops.
export function buildHouse(scene, water) {
  const house = new THREE.Group();
  scene.add(house);
  const mesh = (p) => solid(p);
  const obstacles = []; // [x0, x1, z0, z1] footprints on the floor, for finding the way round
  const updates = []; // (t, dt) each frame
  // What a visitor can click to switch or open (playground.js): the curtains, the fridge and freezer doors,
  // the two lamps, the TV and its remote. Each is { parts, toggle() }; the people notice only what is done to
  // the TV.
  const clickables = [];

  // A soft shadow on the floor (or the loft) under a piece of furniture.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3a2412, transparent: true, opacity: 0.16, depthWrite: false });
  function floorShadow(x0, x1, z0, z1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 4, z1 - z0 + 4), shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, floorY((x0 + x1) / 2, (z0 + z1) / 2) - 0.44, (z0 + z1) / 2);
    house.add(m);
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

  // What the parts share as they are built (each adds what the later ones need); `night` and `overcast`
  // change with the time of day and the weather (dress() and rain() below).
  const shared = { water, house, mesh, updates, clickables, footprint, turnedFootprint, night: false, overcast: false };
  for (const build of [buildShell, buildWindows, buildKitchen, buildLoft, buildLiving, buildGarden, buildDecor]) Object.assign(shared, build(shared));
  const {
    WIN_BACK,
    cloudMat,
    rainVeil,
    rainMat,
    views,
    drawSky,
    drawClouds,
    bird,
    doorRain,
    doorRainMat,
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
    oven,
    potTop,
    stove,
    BOWLS,
    bowls,
    Y,
    DESK,
    phonesOnStand,
    CHAIR,
    pc,
    drawMonitor,
    drawSideMonitor,
    SHELF,
    shelfBooks,
    BED,
    MATTRESS,
    ON_BED,
    beds,
    lamps,
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
    PLANT_X,
    garden,
  } = shared;

  /* ---------- where things are, for the people and the pets ---------- */

  const facing = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const ovenSide = turned(STOVE, STOVE_YAW, [5, 20]);
  const ovenMid = turned(STOVE, STOVE_YAW, [-10.5, 9]);
  const sinkMid = turned(STOVE, STOVE_YAW, [10.5, -0.5]);
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
    stove: { at: [-126, potTop[1]], yaw: -Math.PI / 2, pot: stove.pot },
    // The oven: beside its door (which comes down in front of it), and the middle of it.
    oven: { at: ovenSide, yaw: facing(ovenSide, ovenMid), door: [ovenMid[0], 14, ovenMid[1]] },
    sink: { at: turned(STOVE, STOVE_YAW, [10.5, 17]), yaw: -Math.PI / 2, basin: [sinkMid[0], 34, sinkMid[1]] },
    bowls: Object.fromEntries(Object.entries(BOWLS).map(([name, bowl]) => [name, { bowl }])),
    shelf: { at: [SHELF[0] + 20, SHELF[1]], yaw: -Math.PI / 2 },
    laptop: { at: [TABLE[0] + 8, TABLE[1] + 22], yaw: Math.PI },
    laptopHome: [TABLE[0] + 8, 12, TABLE[1] - 1],
    // The remote, from the right end of the coffee table; the controllers, from their stand on the mantel.
    remote: { at: [TABLE[0] + 29, TABLE[1] - 2], yaw: -Math.PI / 2 },
    dock: { at: [-131, 65], yaw: -Math.PI / 2 },
    plant: { at: [SOFA[0] + 53, SOFA[1] - 8], yaw: -Math.PI / 2, pot: [SOFA[0] + 39, 6, SOFA[1] - 5] },
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
    change: { at: [191, -60] },
    // The garden: through the door, the can by it, and each bed (from the path, facing it).
    gardenDoor: { inside: [134, GARDEN_DOOR.z], outside: [158, GARDEN_DOOR.z] },
    can: { at: [158, 50], yaw: 0 },
    // For each bed: on the path facing it (to water it), the middle of it, where to kneel to its marker,
    // behind each plant (facing it and the viewer) with the basket set down at the right hand, and where the
    // dog sits on the path to watch.
    beds: garden.beds.map(({ z: [z0], zc }) => ({
      at: [161, zc],
      yaw: Math.PI / 2,
      mid: [186, 8, zc],
      marker: { at: [164, z0 + 3], look: [171, 9, z0 + 3] },
      plants: PLANT_X.map((x) => ({ at: [x, z0 - 3], basket: [x - 7, z0 - 3], plant: [x, 5, zc] })),
      watch: [157, z0 - 2],
    })),
    sunny: [177, 31], // a patch of grass between the beds, by the sprinkler, out of the way of the beds' work
    watchPc: { at: [CHAIR[0] - 30, CHAIR[1] + 16] }, // beside his chair, not in front of him or the headphones
    dining: { beg: [DINING[0] - 40, DINE_Z + 2], dish: [DINING[0], 16, DINING[1] + 1] }, // where the dog sits hoping for a bite, and the dish
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
    // The front door: where to wait inside it, and out on the path.
    door: { x: DOOR.x, inside: BACK + 14, outside: BACK - 30 },
  };

  // Paths keep to the house and the garden.
  const bounds = [X0 + 4, SIDE - 4, BACK + 4, FRONT - 4];

  function dress(isNight) {
    shared.night = isNight;
    drawSky();
    drawClouds();
    views.dress(shared.night);
    lamps.forEach((l) => l.set(shared.night)); // whatever was switched, as it was, now it is day or night
    if (shared.night) bird.visible = false;
  }
  drawScreen(0);
  drawMonitor(0);
  drawSideMonitor(0);

  // How hard it is raining (0 to 1, weather.js): the veil over the windows and the open door, streaks
  // running down it, and the clouds gone grey.
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
    rainMat.opacity = doorRainMat.opacity = k;
    rainVeil.tex.offset.set(0.02 * t, (t * 1.6) % 1);
    doorRain.tex.offset.set(0.02 * t, (t * 1.2) % 1);
    cloudMat.color.setRGB(1, 1, 1).lerp(grey, Math.max(k, 0.45 * cloud));
  }

  return {
    group: house,
    obstacles,
    bounds,
    spots,
    floorY,
    dress,
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
      // `mode`: "off", "menu" (his launcher), "game", "win", "lose" or "show" (a drama she streams); `game` the
      // one played or shown (screens.js's GAMES, GIRL_GAMES or DRAMAS); `side` what his side screen shows
      // (screens.js's SIDES). `sitter`: who the chair turns with.
      set(mode, t, game = pc.game) {
        if (mode === pc.mode && game === pc.game) return;
        pc.mode = mode;
        pc.game = game;
        pc.since = t;
        drawMonitor(t);
        drawSideMonitor(t);
      },
      get mode() {
        return pc.mode;
      },
      set sitter(a) {
        pc.sitter = a;
      },
      set side(s) {
        pc.side = s;
      },
      set talking(on) {
        pc.talking = on;
      },
      phones: phonesOnStand, // shown while he is not wearing them
    },
    fridge,
    oven,
    dinner,
    door: frontDoor,
    bin,
    stove,
    fire,
    beds,
    bird,
    books: shelfBooks,
    bowls,
    closet,
    sink,
    keys,
    charger,
    clickables,
    garden,
  };
}
