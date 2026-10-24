/*******************************************************************************
 * The girl: a chibi after a Stardew-style portrait, with long wavy brown hair
 * parted in the middle, an oversized grey sweater, pink gingham shorts and white
 * slides, or lavender pyjamas in dark mode. She smiles and waves when hovered,
 * dozes in a bed that pops up under her, now and then nibbles a cucumber, eats a
 * bowl of pork trotter rice, sips a grape tea, waters a flower or sits on a cosy
 * sofa with the pets, feeds them when they get hungry, walks them, pets them,
 * and is cross or dizzy at the mess the cat makes while she is out. What she
 * holds and what pops up around her is in girl-props.js.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, surfaceOf, paintEyes, approach, smoothstep, nightcap, CAP_COLORS } from "./voxels.js";
import { limbs, poseLimbs } from "./chibi.js";
import { PROP_COLORS, cucumber, foodBag, riceBowl, teaCup, garden, sofaCorner, bed, FLOWERS } from "./girl-props.js";
import { freshPicker, evenly } from "../choose.js";

export function buildGirl() {
  const palette = {
    skin: "#ffdcc2",
    hair: "#5e3624",
    hairShine: "#8f5e40",
    hairDark: "#47281b",
    eye: "#3b2219",
    eyeLight: "#80503a",
    lash: "#24140e",
    glint: "#ffffff",
    blush: "#ffa0a6",
    cross: "#ff7b85",
    mouth: "#d0606c",
    mouthDark: "#7e2c38",
    sweater: "#bdb6ac",
    rib: "#a69f95",
    check: "#e0738f",
    checkMid: "#f2b0c0",
    checkLight: "#fdf0f2",
    strap: "#ffffff",
    sole: "#b07a52",
    cap: "#b9a2e8",
    capRow: "#a68cd9",
    ...CAP_COLORS,
    pj: "#b9a2e8",
    pjDot: "#fbf8f1",
    pjTrim: "#f7f2fb",
    pjButton: "#f58fb0",
    ...PROP_COLORS,
  };
  // Pink gingham: stripes two voxels wide each way, deepest where they cross.
  const gingham = (x, y, z) => {
    const a = Math.floor((x + z) / 2) & 1;
    const b = Math.floor(y / 2) & 1;
    return a && b ? "check" : a || b ? "checkMid" : "checkLight";
  };
  // Hair: soft brown with a few darker waves, and a broken band of shine round the crown.
  const hairColor = (x, y, z) => {
    if (y >= 39 && y <= 40 && z > -3 && (x + y) % 3 !== 0) return "hairShine";
    return Math.sin(x * 1.2 + 1.5 * Math.sin(y * 0.5)) > 0.85 ? "hairDark" : "hair";
  };
  // Lavender pyjamas to match the nightcap, dotted with white and piped in white.
  const pyjama = (x, y, z) => (y % 3 === 0 && (((x + z + (y % 6 ? 0 : 2)) % 4) + 4) % 4 === 0 ? "pjDot" : "pj");

  const group = new THREE.Group();
  const pose = new THREE.Group();
  group.add(pose);

  // Each piece of clothing is built twice, for the day and for the night (pyjamas), and dark mode swaps
  // them over.
  const outfits = [[], []];
  const wear = (parent, build) =>
    [false, true].forEach((night) => {
      const mesh = build(night).mesh(palette);
      mesh.visible = !night;
      parent.add(mesh);
      outfits[+night].push(mesh);
    });

  // Body: a short, soft sweater with a ribbed hem and collar; the head is about half her height. At
  // night, a pyjama top with a round white collar and two pink buttons.
  const torso = (night) => {
    const p = part();
    for (let y = 9; y <= 19; y++) {
      const rx = y <= 17 ? 5 : y === 18 ? 4.5 : 4; // round shoulders
      ellipsoid(p, [0, y, -0.5], [rx, 0.5, 3.5], night ? (y === 9 ? "pjTrim" : pyjama) : y <= 10 ? "rib" : "sweater", [], 3);
    }
    ellipsoid(p, [0, 20, -0.5], [3, 0.5, 2.5], night ? "pjTrim" : "rib");
    if (night) {
      for (let x = -3; x <= 3; x++) p.front(x, 19)[3] = "pjTrim";
      for (const x of [-3, -2, -1, 1, 2, 3]) p.front(x, 18)[3] = "pjTrim";
      for (const y of [12, 15]) p.front(0, y)[3] = "pjButton";
    }
    return p;
  };
  const bodyPart = torso(false);
  wear(pose, torso);

  // Legs: short and bare, in loose shorts and white slides (long pyjama trousers at night); arms in baggy
  // sleeves that half cover the hands (chibi.js has the joints).
  const body = limbs(pose, wear, {
    thigh(side, x0, night) {
      const p = part();
      box(p, [x0, x0 + 1], [5, 8], [-1, 0], "skin");
      box(p, side > 0 ? [1, 4] : [-4, -1], [night ? 5 : 6, 8], [-2, 1], night ? pyjama : gingham);
      return p;
    },
    shin(side, x0, night) {
      const p = part();
      box(p, [x0, x0 + 1], [1, 4], [-1, 0], "skin");
      if (night) box(p, side > 0 ? [1, 3] : [-3, -1], [2, 4], [-2, 1], (x, y, z) => (y === 2 ? "pjTrim" : pyjama(x, y, z)));
      box(p, [x0, x0 + 1], [0, 0], [-1, 2], "sole");
      box(p, [x0, x0 + 1], [1, 1], [0, 1], "strap");
      box(p, [x0, x0 + 1], [1, 1], [2, 2], "skin"); // toes
      return p;
    },
    upper(side, x0, night) {
      const p = part();
      box(p, [x0, x0 + 2], [14, 19], [-2, 1], night ? pyjama : "sweater");
      return p;
    },
    fore(side, x0, night) {
      const p = part();
      box(p, [x0, x0 + 2], [10, 13], [-2, 1], (x, y, z) => (y > 10 ? (night ? pyjama(x, y, z) : "sweater") : night ? "pjTrim" : "rib"));
      box(p, side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2], [8, 9], [-1, 0], "skin");
      return p;
    },
  });

  // Head: big and round with chubby cheeks, framed by hair parted in the middle that sweeps away from the
  // forehead and falls past the cheeks.
  const headPart = part();
  const inFace = (x, y, z) => z >= 1 && Math.abs(x) <= 7 && y <= 38 - 0.11 * x * x;
  const inHair = (x, y, z) => (x / 10.5) ** 2 + ((y - 33) / 10.5) ** 2 + ((z + 0.5) / 9.5) ** 2 <= 1;
  ellipsoid(headPart, [0, 33, -0.5], [10.5, 10.5, 9.5], hairColor, [bodyPart, { has: inFace }]);
  // The face is squarer than the hair, so keep it from poking out through the hair.
  const outside = { has: (x, y, z) => !inFace(x, y, z) && !inHair(x, y, z) };
  ellipsoid(headPart, [0, 32, 0.5], [9.5, 9.5, 8.5], "skin", [bodyPart, headPart, outside], 3);
  ellipsoid(headPart, [0, 27.5, 1.5], [9, 4.5, 7.5], "skin", [bodyPart, headPart, outside]); // cheeks
  for (let y = 39; y <= 43; y++) headPart.front(0, y)[3] = "hairDark"; // the parting
  for (const side of [-1, 1])
    for (let y = 19; y <= 36; y++) {
      const out = 10 + Math.round(Math.sin(y * 0.8)); // wavy
      for (let x = 8; x <= out; x++)
        for (let z = -3; z <= 5; z++) {
          if (y < 19 + ((x + z) & 1)) continue; // ragged ends
          if (!inFace(side * x, y, z)) headPart.add(side * x, y, z, hairColor(side * x, y, z)); // over the sides of the cheeks
        }
    }
  const headPivotY = 21;
  const head = pivotGroup(pose, [0, headPivotY, 0]);
  head.inner.add(headPart.mesh(palette));

  // The long hair down her back hangs from the back of the head, so it can stay hanging when she nods or
  // turns her head, and sway as she walks.
  const backPart = part();
  for (let y = 12; y <= 30; y++) {
    const half = Math.round(10.5 + 0.8 * Math.sin(y * 0.7) + (30 - y) * 0.05);
    for (let x = -half; x <= half; x++) {
      if (y < 13 + 1.5 * (1 + Math.sin(x * 1.1))) continue; // wavy ends
      const front = y >= 21 ? -4 : -5; // behind the head, then behind the sweater
      for (let z = -10 + Math.round(Math.abs(x) * 0.25); z <= front; z++) if (!headPart.has(x, y, z)) backPart.add(x, y, z, hairColor(x, y, z));
    }
  }
  const backHair = pivotGroup(head.inner, [0, 32, -6]);
  backHair.inner.add(backPart.mesh(palette));

  // Face: wide-set dark eyes with a sparkle and a flick of lashes, rosy cheeks and a tiny smile.
  const surface = surfaceOf(headPart);
  const facePart = part();
  const GLINTS = new Set(["1,1", "2,1", "1,2", "2,3"]);
  const eyeColor = (i, j) => (GLINTS.has(`${i},${j}`) ? "glint" : j === 4 ? "eyeLight" : "eye");
  const eyeCells = paintEyes(facePart, surface, [-7, 4], 32, eyeColor, [".XX.", "XXXX", "XXXX", "XXXX", ".XX."]);
  const lashCells = [surface(-7, 32, 0.4), surface(7, 32, 0.4)]; // the outer corners
  lashCells.forEach((p) => facePart.add(...p, "lash"));
  for (const x of [-7, -6, 6, 7]) facePart.add(...surface(x, 27, 0.4), "blush");
  head.inner.add(facePart.mesh(palette));
  const painted = (list, lift = 0.4) => {
    const p = part();
    list.forEach(([x, y, color]) => p.add(...surface(x, y, lift), color));
    const mesh = p.mesh(palette);
    mesh.visible = false;
    head.inner.add(mesh);
    return mesh;
  };

  // Mouth: a tiny closed smile, open to laugh and munch, or turned down when she is cross.
  const smile = painted(
    [
      [-2, 26],
      [-1, 25],
      [0, 25],
      [1, 25],
      [2, 26],
    ].map(([x, y]) => [x, y, "mouth"])
  );
  smile.visible = true;
  const open = painted(
    [-1, 0, 1].flatMap((x) => [
      [x, 26, "mouthDark"],
      [x, 25, "mouth"],
    ])
  );
  const frown = painted(
    [
      [-2, 25],
      [-1, 26],
      [0, 26],
      [1, 26],
      [2, 25],
    ].map(([x, y]) => [x, y, "mouth"])
  );

  // Lids cover the eyes and lashes with skin and draw over them: shut and curved down to blink or sleep
  // (︶), up in a happy smile (^), swirls when she is dizzy (@), or glaring under frowning brows.
  const lids = (paint, lift) => {
    const p = part();
    eyeCells.forEach(({ p: [x, y, z], row, col }) => p.add(x, y, z + lift, paint(col, row, x) || "skin"));
    lashCells.forEach(([x, y, z]) => p.add(x, y, z + lift, "skin"));
    const mesh = p.mesh(palette);
    mesh.visible = false;
    head.inner.add(mesh);
    return mesh;
  };
  const arc = (cells) => (col, row) => (cells.has(`${col},${row}`) ? "lash" : null);
  const eyelids = lids(arc(new Set(["0,2", "1,3", "2,3", "3,2"])), 0.1);
  const happyEyes = lids(arc(new Set(["0,3", "1,2", "2,2", "3,3"])), 0.15);
  const SWIRL = ["XXXX", "...X", "XX.X", "X..X", "XXXX"];
  const dizzyEyes = lids((col, row, x) => (SWIRL[row][x < 0 ? col : 3 - col] === "X" ? "lash" : null), 0.15); // mirrored on the right
  const GLARE = ["....", "XXXX", null, null, null]; // the top half shut, the rest still looking
  const angryEyes = lids((col, row) => (GLARE[row] ? (GLARE[row][col] === "X" ? "lash" : "skin") : eyeColor(col, row)), 0.15);
  // Frowning brows over the glare, low at the middle, and a flush across the cheeks.
  const brows = painted([
    ...[-1, 1].flatMap((side) => [
      [side * 3, 33, "lash"],
      [side * 4, 33, "lash"],
      [side * 5, 34, "lash"],
      [side * 6, 34, "lash"],
    ]),
    ...[-8, -7, -6, -5, 5, 6, 7, 8].map((x) => [x, 28, "cross"]),
  ]);

  // The nightcap, put away while she is in bed.
  const hat = nightcap(headPart, { y0: 41, z0: -0.5, radius: 9.5, height: 11 }).mesh(palette);
  const capHook = new THREE.Group();
  capHook.add(hat);
  head.inner.add(capHook);

  const hand = body.arms[0].elbow.inner; // her right hand, which carries most things
  const cucumberMesh = cucumber(hand, palette);
  const bag = foodBag(hand, palette);
  const showRice = riceBowl(pose, hand, palette);
  const showTea = teaCup(pose, palette);
  const flower = garden(pose, palette);
  const sofa = sofaCorner(group, palette);
  const bedding = bed(group, palette);
  const flowers = freshPicker(FLOWERS.length - 1); // the colours come round in turn
  let watering = false;

  // Nibbling, she nods a little onto the cucumber, and onto the straw for each sip of tea (chibi.js has the
  // arm poses).
  const EAT_NOD = 0.25;
  const SIP_NOD = 0.08;
  const POUR_TIME = 1.6; // s shaking the food out
  const SIT_LIFT = 2.5; // her seat on the cushion
  const lieDrop = 4; // kneeling
  const amount = {}; // how far into each pose or prop, eased from 0 to 1
  const ease = (name, on, rate, dt) => (amount[name] = approach(amount[name] || 0, on ? 1 : 0, rate, dt));
  const phase = { wave: 0, munch: 0, clap: 0, pat: 0 };
  return {
    label: "Voxel girl in a grey sweater, click to say hi",
    hint: "say hi",
    group,
    pose,
    head,
    headPivotY,
    ears: [],
    eyelids,
    hat,
    lieDrop,
    headDrop: 0,
    headAt: [32, 9],
    hit: [22, 12, 23],
    shadow: [8, 5],
    speed: 28,
    gaitHz: 2.2,
    lane: 14,
    sleepAt: [bedding.feet[0] - 33, bedding.feet[1], 9], // her face, tucked up in bed
    // Weights for the choice (pets/pet.js), set so that with repeats held back she laps 1/6 of the time,
    // strolls 15%, naps about 18% and does a trick half the time.
    actions: { lap: 0.196, stroll: 0.163, nap: 0.24, trick: 0.401 },
    tricks: { cucumber: 5, porkRice: 7, grapeTea: 6, flower: 7, sofa: 14 },
    seats: sofa.seats,
    feeds: true,
    leads: true,
    hands: body.arms.map(({ hand: h }) => h),
    // For dressing her in other clothes (girl-outfits.js, the playground's): her joints, her head's shape,
    // her colours, and her own day and night clothes.
    limbs: body,
    headPart,
    palette,
    outfits,
    nightwear(on) {
      outfits[0].forEach((m) => (m.visible = !on));
      outfits[1].forEach((m) => (m.visible = on));
    },
    // `seated` sits her on a seat that is already there (the playground's), `hold` takes her arms over
    // (chibi.js) and `talk` moves her mouth, for what she does there.
    animate(dt, { happy, walking, lying, sleeping, stride, gait, state, trick, elapsed, progress, leash, stroke, company, seated, hold, talk }) {
      const doing = (name) => state === "trick" && trick === name;
      const snacking = state === "trick" && progress < 0.88;
      const pouring = state === "serve" && elapsed < POUR_TIME;
      const cheering = state === "serve" && !pouring;
      const holding = [0, 1].map((i) => ease(`lead${i}`, leash === i, 6, dt));
      const strokes = [0, 1].map((i) => ease(`stroke${i}`, stroke === i, 6, dt));
      // The sofa pops up, then she hops up onto it, and pets whoever sits beside her.
      const onSofa = ease("sofa", doing("sofa") && progress < 0.94, 4, dt);
      const sit = Math.max(smoothstep(0.4, 1, onSofa), smoothstep(0, 1, ease("seat", seated, 4, dt)));
      sofa.update(onSofa);
      const pats = [0, 1].map((i) => ease(`pat${i}`, sit > 0.9 && company?.[i], 4, dt));
      const eat = ease("eat", snacking && trick === "cucumber", 6, dt);
      const rice = ease("rice", snacking && trick === "porkRice", 6, dt);
      const cupHeld = ease("cup", snacking && trick === "grapeTea", 6, dt);
      const sip = ease("sip", cupHeld > 0.9 && Math.sin(elapsed * Math.PI) > 0.2, 10, dt); // a sip every 2 s
      const offer = ease("offer", state === "feed" || pouring, 6, dt);
      const clap = ease("clap", cheering && elapsed < POUR_TIME + 2, 6, dt);
      const wateringNow = snacking && trick === "flower";
      if (wateringNow && !watering) flower.plant(flowers.take(evenly(FLOWERS))); // a new one each time
      watering = wateringNow;
      const water = ease("water", wateringNow, 6, dt);
      const pour = ease("pour", water > 0.9 && progress < 0.6, 5, dt);
      const cross = ease("cross", state === "react" && trick === "angry", 6, dt);
      const dizzy = ease("dizzy", state === "react" && trick === "dizzy", 6, dt);
      const busyHands = rice + cupHeld + water + onSofa + strokes[0] + strokes[1] + cross + (hold?.w || 0);
      const wave = ease("wave", happy && !sleeping && busyHands < 0.05, 8, dt); // she won't put things down to wave
      phase.wave += Math.PI * 2 * 2.2 * dt;
      phase.munch += Math.PI * 2 * 3 * dt;
      phase.clap += Math.PI * 2 * 2.5 * dt;
      phase.pat += Math.PI * 2 * 1.2 * dt;

      // Into bed: the bed pops up, she rolls onto her side into it, and the quilt slides up over her.
      const inBed = ease("bed", sleeping, sleeping ? 2.5 : 5, dt);
      const roll = smoothstep(0.25, 0.85, inBed);
      bedding.update(inBed);
      capHook.visible = roll < 0.05; // the cap comes off in bed
      const sway = dizzy * 0.07 * Math.sin(elapsed * 5); // dizzy, she sways on her feet
      pose.rotation.z = (roll * Math.PI) / 2 + sway;
      pose.position.x = roll * bedding.feet[0];
      pose.position.y += roll * (bedding.feet[1] + lieDrop * lying) + sit * SIT_LIFT; // instead of kneeling
      pose.position.z = -1.5 * sit; // back in the seat
      const kneel = lying * (1 - roll);
      const bite = 0.5 - 0.5 * Math.cos(elapsed * Math.PI * 2 * 0.7); // 0 chopsticks in the bowl, 1 at the mouth
      const lifting = rice > 0.9 && Math.sin(elapsed * Math.PI * 2 * 0.7) > 0;
      const munch = eat > 0.9 ? Math.sin(phase.munch) : 0;
      const shake = pouring ? Math.sin(elapsed * 16) : 0;
      const stamp = cross * Math.max(0, Math.sin(elapsed * 9)); // stamping her right foot

      poseLimbs(body, {
        kneel,
        sit,
        stride,
        gait,
        stamp,
        dizzy,
        elapsed,
        phase,
        wave,
        eat,
        offer,
        clap,
        water,
        rice,
        cupHeld,
        cross,
        bite,
        munch,
        shake,
        holding,
        strokes,
        pats,
        hold,
      });
      cucumberMesh.visible = eat > 0.05;
      bag.visible = offer > 0.05;
      showRice(rice, lifting, doing("porkRice") ? progress : 0);
      showTea(cupHeld, doing("grapeTea") ? progress : 0, sip >= 0.5);
      flower.update(water, pour, progress, elapsed);

      // The face: happy eyes while eating, petting or cheering; dizzy swirls, or a glare under frowning brows.
      const chewing = (rice > 0.9 && bite > 0.85) || munch > 0.3;
      const delighted = water > 0.9 && progress > 0.55; // the flower is out
      const petting = pats[0] + pats[1] + strokes[0] + strokes[1] > 0.9;
      const moody = cross + dizzy > 0.5;
      dizzyEyes.visible = dizzy > 0.5;
      angryEyes.visible = brows.visible = frown.visible = cross > 0.5;
      happyEyes.visible = !moody && ((happy && !sleeping) || eat > 0.9 || rice > 0.9 || sip > 0.5 || delighted || petting || cheering);
      const laughing = !moody && ((happy && !sleeping) || chewing || cheering || (talk && Math.sin(elapsed * 30) > 0));
      open.visible = laughing || dizzy > 0.5;
      smile.visible = !laughing && !moody;

      // Asleep, her head only droops a little, unlike a pet's, which rests its chin on the ground, and in
      // bed it lies straight on the pillow; eating, she looks down at her food, and watering, at the flower.
      // Dizzy, it rolls round; cross, it gives a little shake.
      const r = head.outer.rotation;
      r.x = r.x * (1 - 0.6 * lying) + EAT_NOD * (eat + 0.6 * rice) + SIP_NOD * sip + 0.25 * water + dizzy * 0.12 * Math.cos(elapsed * 5);
      r.y += 0.35 * water + cross * 0.12 * Math.sin(elapsed * 14);
      r.z += dizzy * 0.2 * Math.sin(elapsed * 5);
      r.x += roll * (0.1 - r.x);
      r.y *= 1 - roll;
      r.z *= 1 - roll;

      // The long hair keeps hanging when the head nods, half follows it when it turns, and swings back as
      // she walks.
      backHair.outer.rotation.set(-r.x + 0.12 * stride, -0.5 * r.y, -0.6 * r.z + 0.05 * stride * Math.sin(gait), "YXZ");
    },
  };
}
