/*******************************************************************************
 * The boy: a chibi on the girl's skeleton (chibi.js), after the profile photos:
 * short black hair with a side-swept fringe, black rectangular glasses, a blue
 * T-shirt with his black neckband earphones round his neck, white-grey trousers
 * and black shoes; his white over-ear gaming headphones (with a boom mic) go on
 * his head when he plays on his computer. At night, pale grey pyjamas with
 * white pinstripes, a matching nightcap and felt slippers. He waves and grins
 * when hovered, feeds the pets, walks them, pets them, eats a bowl of her pork
 * rice with her, and is cross or dizzy at the cat's mess. What he does in the
 * playground he does with props it hands him (assets/js/pets/room/props.js).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, ellipsoid, box, pivotGroup, surfaceOf, paintEyes, approach, smoothstep, hash, nightcap, CAP_COLORS } from "./voxels.js";
import { limbs, poseLimbs } from "./chibi.js";
import { PROP_COLORS, foodBag, riceBowl } from "./girl-props.js";

export function buildBoy() {
  const palette = {
    skin: "#f9d6bd",
    earShade: "#ecbfa2",
    hair: "#221e21",
    hairShine: "#433d47",
    hairDark: "#131113",
    eye: "#4a2e1f",
    glint: "#ffffff",
    frame: "#141418",
    hinge: "#c9ccd4",
    lens: "#e6f2ff",
    nose: "#f0c3a6",
    brow: "#2a2326",
    blush: "#f7b6ab",
    cross: "#ff7b85",
    mouth: "#c65d5c",
    mouthDark: "#6b2a2e",
    teeth: "#ffffff",
    tee: "#4e74a3",
    teeHeather: "#5b82b1",
    teeRib: "#41648f",
    band: "#2a2a31",
    bandTrim: "#b5455a",
    pod: "#141418",
    podShine: "#3b3b45",
    podTip: "#26262d",
    logo: "#c9ccd4",
    cable: "#1c1c21",
    phoneCup: "#f6f6f3",
    phoneShade: "#dedfdb",
    phoneCushion: "#1f1f24",
    phonePad: "#2c2c33",
    micTip: "#9a9ca3",
    trousers: "#dddcd6",
    crease: "#c6c5be",
    shoe: "#26262b",
    sole: "#56565e",
    cap: "#e6e6e2",
    capRow: "#d4d5d2",
    ...CAP_COLORS,
    star: "#b3c0cf", // pale blue stars, to show on the pale cap
    pj: "#e4e4e0",
    pjStripe: "#fbfbf9",
    pjTrim: "#f7f6f2",
    pjButton: "#9fb1c6",
    slipper: "#9a9ea6",
    slipperTrim: "#eceae4",
    ...PROP_COLORS,
  };
  const tee = (x, y, z) => (hash(x, y, z) < 0.2 ? "teeHeather" : "tee"); // heathered cotton
  const pyjama = (x, y, z) => ((((x + z) % 4) + 4) % 4 === 0 ? "pjStripe" : "pj"); // white pinstripes
  // Hair: near black with a cool sheen round the crown and darker strands swept down across the fringe.
  const hairColor = (x, y, z) => {
    if (y >= 40 && y <= 41 && z > -3 && (x + 2 * y) % 4 !== 0) return "hairShine";
    if (z > 3 && y >= 33 && (((x - y) % 4) + 4) % 4 === 0) return "hairDark";
    return "hair";
  };

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

  // Body: a fitted T-shirt with a ribbed hem and crew neck, and his neckband earphones: a fabric band round
  // the back of the neck, open at the front, its two ends short earphone pods resting on the collarbones (a
  // silver logo on the left one), each with an earbud cable hanging from its tip. At night, a striped
  // pyjama top with a white collar and buttons, and no earphones.
  const torso = (night) => {
    const p = part();
    for (let y = 9; y <= 19; y++) {
      const rx = y <= 17 ? 5 : y === 18 ? 4.5 : 4; // round shoulders
      ellipsoid(p, [0, y, -0.5], [rx, 0.5, 3.5], night ? (y === 9 ? "pjTrim" : pyjama) : y === 9 ? "teeRib" : tee, [], 3);
    }
    ellipsoid(p, [0, 20, -0.5], [3, 0.5, 2.5], night ? "pjTrim" : "teeRib");
    if (night) {
      for (let x = -3; x <= 3; x++) p.front(x, 19)[3] = "pjTrim";
      for (const y of [12, 15]) p.front(0, y)[3] = "pjButton";
    } else {
      for (let x = -5; x <= 5; x++)
        for (let z = -5; z <= 2; z++) {
          const r = (x / 4.4) ** 2 + ((z + 0.5) / 3.4) ** 2;
          if (r > 0.8 && r < 1.25 && !p.has(x, 20, z)) p.add(x, 20, z, z <= -3 && x % 2 === 0 ? "bandTrim" : "band");
        }
      for (const side of [-1, 1]) {
        p.add(side * 3, 20, 3, "band"); // where the band meets the pod
        for (let y = 17; y <= 19; y++)
          for (const x of [side * 3, side * 4]) p.add(x, y, 3, y === 17 ? "podTip" : x === side * 4 && y === 19 ? "podShine" : "pod");
      }
      p.add(4, 18, 4, "logo");
    }
    return p;
  };
  const bodyPart = torso(false);
  wear(pose, torso);
  // The earbud cables, finer than a voxel, hanging a little way from the pods' tips (with the day clothes).
  const cableMat = new THREE.MeshLambertMaterial({ color: palette.cable });
  for (const side of [-1, 1]) {
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6, 0.35), cableMat);
    cable.position.set(side * 3.6, 15.3, 3.3);
    cable.rotation.z = side * 0.12; // swinging out a little
    pose.add(cable);
    outfits[0].push(cable);
  }

  // Legs in straight white-grey trousers with a crease down the front, and black shoes (striped pyjama
  // trousers and felt slippers at night); arms in short sleeves (long ones at night).
  const legX = (side) => (side > 0 ? [1, 3] : [-3, -1]);
  const skinX = (side, x0) => (side > 0 ? [x0, x0 + 1] : [x0 + 1, x0 + 2]); // the inner two columns of an arm
  const body = limbs(pose, wear, {
    thigh(side, x0, night) {
      const p = part();
      box(p, legX(side), [5, 8], [-2, 1], night ? pyjama : (x, y, z) => (z === 1 && x === side * 2 ? "crease" : "trousers"));
      return p;
    },
    shin(side, x0, night) {
      const p = part();
      box(p, legX(side), [2, 4], [-2, 1], (x, y, z) =>
        night ? (y === 2 ? "pjTrim" : pyjama(x, y, z)) : z === 1 && x === side * 2 ? "crease" : "trousers"
      );
      box(p, legX(side), [0, 1], [-2, 2], (x, y, z) => (night ? (y === 1 && z === 2 ? "slipperTrim" : "slipper") : y === 0 ? "sole" : "shoe"));
      return p;
    },
    upper(side, x0, night) {
      const p = part();
      if (night) box(p, [x0, x0 + 2], [14, 19], [-2, 1], pyjama);
      else {
        box(p, [x0, x0 + 2], [15, 19], [-2, 1], (x, y, z) => (y === 15 ? "teeRib" : tee(x, y, z)));
        box(p, skinX(side, x0), [14, 14], [-1, 0], "skin");
      }
      return p;
    },
    fore(side, x0, night) {
      const p = part();
      if (night) box(p, [x0, x0 + 2], [10, 13], [-2, 1], (x, y, z) => (y === 10 ? "pjTrim" : pyjama(x, y, z)));
      else box(p, skinX(side, x0), [10, 13], [-1, 0], "skin");
      box(p, skinX(side, x0), [8, 9], [-1, 0], "skin");
      return p;
    },
  });

  // Head: the girl's round face under short thick hair, parted on his left (the viewer's right) and swept
  // across the forehead in a fringe that falls lower towards his right, where it hangs over the temple and
  // the ear; on the parting side it is cut short above the ear. A band of forehead shows under it.
  const headPart = part();
  const fringe = (x) => 37 + 0.2 * x - ((x + 9) % 3 === 0 ? 1 : 0); // ragged tips
  const inFace = (x, y, z) => z >= 1 && Math.abs(x) <= 7 && y <= 40 - 0.06 * x * x && y <= fringe(x);
  const inHair = (x, y, z) => (x / 10.6) ** 2 + ((y - 33.5) / 10.8) ** 2 + ((z + 0.5) / 9.8) ** 2 <= 1;
  const hairLow = (x, z) => (z < -2 ? 24 : x <= -7 ? 26 : x >= 7 ? 31 : 34); // nape, over the ear, above the ear
  ellipsoid(headPart, [0, 33.5, -0.5], [10.6, 10.8, 9.8], hairColor, [bodyPart, { has: (x, y, z) => inFace(x, y, z) || y < hairLow(x, z) }]);
  ellipsoid(headPart, [-1, 39, 2.5], [9, 3.5, 7.5], hairColor, [headPart, { has: (x, y, z) => y < fringe(x) }]); // the fringe's volume
  const outside = { has: (x, y, z) => !inFace(x, y, z) && !inHair(x, y, z) };
  ellipsoid(headPart, [0, 32, 0.5], [9.5, 9.5, 8.5], "skin", [bodyPart, headPart, outside], 3);
  ellipsoid(headPart, [0, 27.5, 1.5], [9.2, 4.8, 7.5], "skin", [bodyPart, headPart, outside]); // full cheeks
  for (let y = 39; y <= 43; y++) headPart.front(4, y)[3] = "hairDark"; // the parting
  for (let y = 28; y <= 30; y++)
    for (let z = -1; z <= 0; z++) {
      headPart.add(10, y, z, y === 29 && z === 0 ? "earShade" : "skin"); // the ear on the short side
      if (y === 29) headPart.add(11, y, z, "skin");
    }
  const headPivotY = 21;
  const head = pivotGroup(pose, [0, headPivotY, 0]);
  head.inner.add(headPart.mesh(palette));

  // Face: narrow dark eyes with a glint, each with a ring of skin clear inside thin, wide, rectangular black
  // glasses with silver hinges; straight brows above, a hint of a nose, rosy cheeks and a toothy grin.
  const surface = surfaceOf(headPart);
  const facePart = part();
  const EYE = ["XXX", "XXX"];
  const eyeColor = (i, j) => (i === 1 && j === 0 ? "glint" : "eye");
  const eyeCells = paintEyes(facePart, surface, [-5, 3], 30, eyeColor, EYE);
  for (const side of [-1, 1]) {
    const [x0, x1] = side < 0 ? [-8, -1] : [1, 8]; // the frame round each lens
    for (let x = x0; x <= x1; x++) for (const y of [32, 27]) facePart.add(...surface(x, y, 0.5), "frame");
    for (let y = 28; y <= 31; y++) for (const x of [x0, x1]) facePart.add(...surface(x, y, 0.5), "frame");
    facePart.add(...surface(side * 8, 32, 0.6), "hinge");
    facePart.add(...surface(side * 9, 32, 0.5), "frame"); // the arm, on its way to the ear
    facePart.add(...surface(side < 0 ? -2 : 7, 31, 0.45), "lens"); // a glint on the lens
  }
  facePart.add(...surface(0, 31, 0.5), "frame"); // the bridge
  facePart.add(...surface(0, 27, 0.4), "nose");
  for (const x of [-8, -7, 7, 8]) if (headPart.front(x, 25)) facePart.add(...surface(x, 25, 0.4), "blush");
  head.inner.add(facePart.mesh(palette));
  const painted = (list, lift = 0.4) => {
    const p = part();
    list.forEach(([x, y, color]) => p.add(...surface(x, y, lift), color));
    const mesh = p.mesh(palette);
    mesh.visible = false;
    head.inner.add(mesh);
    return mesh;
  };
  const brows = painted([-6, -5, -4, -3, 3, 4, 5, 6].map((x) => [x, 34, "brow"]));
  brows.visible = true;
  // Cross: brows drawn down to the middle, and a flush across the cheeks.
  const crossBrows = painted([
    ...[-1, 1].flatMap((side) => [
      [side * 2, 33, "brow"],
      [side * 3, 33, "brow"],
      [side * 4, 34, "brow"],
      [side * 5, 34, "brow"],
      [side * 6, 35, "brow"],
    ]),
    ...[-7, -6, -5, 5, 6, 7].map((x) => [x, 26, "cross"]),
  ]);

  // Mouth: a wide grin showing his top teeth, as in the photo; open wider to laugh or talk, or a small
  // frown when he is cross.
  const smile = painted([
    [-3, 25, "mouth"],
    [3, 25, "mouth"],
    ...[-2, -1, 0, 1, 2].map((x) => [x, 25, "teeth"]),
    ...[-2, -1, 0, 1, 2].map((x) => [x, 24, "mouth"]),
  ]);
  smile.visible = true;
  const open = painted([
    [-3, 25, "mouth"],
    [3, 25, "mouth"],
    ...[-2, -1, 0, 1, 2].flatMap((x) => [
      [x, 25, "teeth"],
      [x, 24, "mouthDark"],
    ]),
    ...[-1, 0, 1].map((x) => [x, 23, "mouth"]),
  ]);
  const frown = painted(
    [
      [-2, 24],
      [-1, 25],
      [0, 25],
      [1, 25],
      [2, 24],
    ].map(([x, y]) => [x, y, "mouth"])
  );

  // Lids cover the eyes with skin and draw over them: shut and curved down to blink or sleep (︶), up in a
  // happy smile (^), swirls when he is dizzy (@), or a glare when he is cross.
  const lids = (paint, lift) => {
    const p = part();
    eyeCells.forEach(({ p: [x, y, z], row, col }) => p.add(x, y, z + lift, paint(col, row, x) || "skin"));
    const mesh = p.mesh(palette);
    mesh.visible = false;
    head.inner.add(mesh);
    return mesh;
  };
  const arc = (cells) => (col, row) => (cells.has(`${col},${row}`) ? "eye" : null);
  const eyelids = lids(arc(new Set(["0,1", "1,1", "2,1"])), 0.1);
  const happyEyes = lids(arc(new Set(["0,1", "1,0", "2,1"])), 0.15);
  const SWIRL = ["XX.", ".XX"];
  const dizzyEyes = lids((col, row, x) => (SWIRL[row][x < 0 ? col : 2 - col] === "X" ? "eye" : null), 0.15); // mirrored on the left
  const GLARE = ["XXX", null];
  const angryEyes = lids((col, row) => (GLARE[row] ? (GLARE[row][col] === "X" ? "eye" : "skin") : eyeColor(col, row)), 0.15);

  const hat = nightcap(headPart, { y0: 41, z0: -0.5, radius: 9.5, height: 11 }).mesh(palette);
  head.inner.add(hat);

  // His white gaming headphones, after a Sony INZONE pair, on his head while he plays: a thick black
  // cushion ring against each side of his head under a round white cup, a white band with a black pad
  // over the top, and a boom mic from the left cup to the corner of his mouth. (The rest of the time they
  // hang on their stand by his computer, room/house.js.)
  const onHead = part();
  for (const side of [-1, 1]) {
    ellipsoid(onHead, [side * 11, 30, -0.5], [1.2, 4.7, 4.1], "phoneCushion", [headPart]);
    ellipsoid(onHead, [side * 13.2, 30, -0.5], [1.3, 4.3, 3.7], (x, y) => (y <= 27 ? "phoneShade" : "phoneCup"));
  }
  for (let a = 0.15; a <= Math.PI - 0.15; a += 0.02)
    for (const r of [12.4, 13.1]) {
      const [x, y] = [Math.round(r * Math.cos(a)), Math.round(33.5 + r * Math.sin(a))];
      for (const z of [-1, 0])
        if (!headPart.has(x, y, z) && !onHead.has(x, y, z)) onHead.add(x, y, z, Math.abs(x) <= 5 && r < 12.8 ? "phonePad" : "phoneCup");
    }
  for (let k = 0; k <= 7; k++) {
    const [x, y, z] = [Math.round(13 - k * 1.1), Math.round(27 - k * 0.3), Math.round(2 + k * 0.8)];
    if (!headPart.has(x, y, z)) onHead.add(x, y, z, k === 7 ? "micTip" : "phoneCup");
  }
  const phonesOn = onHead.mesh(palette);
  phonesOn.visible = false;
  head.inner.add(phonesOn);

  const bag = foodBag(body.arms[0].elbow.inner, palette); // held out to feed the pets, like the girl's
  const showRice = riceBowl(pose, body.arms[0].elbow.inner, palette); // her pork rice, eaten as she does (girl.js)

  const POUR_TIME = 1.6; // s shaking the food out
  const EAT_NOD = 0.15; // looking down at the rice
  const SIT_LIFT = 2.5; // his seat on the cushion
  const lieDrop = 4; // kneeling
  const amount = {}; // how far into each pose, eased from 0 to 1
  const ease = (name, on, rate, dt) => (amount[name] = approach(amount[name] || 0, on ? 1 : 0, rate, dt));
  const phase = { wave: 0, clap: 0, pat: 0 };
  return {
    label: "Voxel boy in a blue T-shirt and glasses, click to say hi",
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
    headAt: [30, 9],
    hit: [22, 12, 23],
    shadow: [8, 5],
    speed: 30,
    gaitHz: 2.1,
    hands: body.arms.map(({ hand }) => hand),
    nightwear(on) {
      outfits[0].forEach((m) => (m.visible = !on));
      outfits[1].forEach((m) => (m.visible = on));
    },
    // As the girl's (girl.js): `seated` sits him on a seat, `hold` takes his arms over, `talk` moves his
    // mouth; `phones` puts his headphones on his head.
    animate(dt, { happy, lying, sleeping, stride, gait, state, trick, elapsed, progress, leash, stroke, company, seated, hold, talk, phones }) {
      phonesOn.visible = !!phones;
      const pouring = state === "serve" && elapsed < POUR_TIME;
      const cheering = state === "serve" && !pouring;
      const holding = [0, 1].map((i) => ease(`lead${i}`, leash === i, 6, dt));
      const strokes = [0, 1].map((i) => ease(`stroke${i}`, stroke === i, 6, dt));
      const sit = smoothstep(0, 1, ease("seat", seated, 4, dt));
      const pats = [0, 1].map((i) => ease(`pat${i}`, sit > 0.9 && company?.[i], 4, dt));
      const offer = ease("offer", state === "feed" || pouring, 6, dt);
      const clap = ease("clap", cheering && elapsed < POUR_TIME + 2, 6, dt);
      const cross = ease("cross", state === "react" && trick === "angry", 6, dt);
      const dizzy = ease("dizzy", state === "react" && trick === "dizzy", 6, dt);
      const eating = state === "trick" && trick === "porkRice";
      const rice = ease("rice", eating && progress < 0.88, 6, dt);
      const bite = 0.5 - 0.5 * Math.cos(elapsed * Math.PI * 2 * 0.7); // 0 chopsticks in the bowl, 1 at the mouth
      const busyHands = strokes[0] + strokes[1] + pats[0] + pats[1] + cross + rice + (hold?.w || 0);
      const wave = ease("wave", happy && !sleeping && busyHands < 0.05, 8, dt);
      phase.wave += Math.PI * 2 * 2.2 * dt;
      phase.clap += Math.PI * 2 * 2.5 * dt;
      phase.pat += Math.PI * 2 * 1.2 * dt;

      pose.rotation.z = dizzy * 0.07 * Math.sin(elapsed * 5); // dizzy, he sways on his feet
      pose.position.y += sit * SIT_LIFT;
      pose.position.z = -1.5 * sit; // back in the seat
      const shake = pouring ? Math.sin(elapsed * 16) : 0;
      const stamp = cross * Math.max(0, Math.sin(elapsed * 9)); // stamping his right foot
      poseLimbs(body, {
        kneel: lying,
        sit,
        stride,
        gait,
        stamp,
        dizzy,
        elapsed,
        phase,
        wave,
        offer,
        clap,
        cross,
        rice,
        bite,
        shake,
        holding,
        strokes,
        pats,
        hold,
      });
      bag.visible = offer > 0.05;
      showRice(rice, rice > 0.9 && Math.sin(elapsed * Math.PI * 2 * 0.7) > 0, eating ? progress : 0);

      // The face: a grin and happy eyes when he is pleased, petting or cheering; swirls when dizzy, a glare
      // under drawn brows when cross.
      const moody = cross + dizzy > 0.5;
      dizzyEyes.visible = dizzy > 0.5;
      angryEyes.visible = crossBrows.visible = frown.visible = cross > 0.5;
      brows.visible = !crossBrows.visible;
      const petting = pats[0] + pats[1] + strokes[0] + strokes[1] > 0.9;
      const chewing = rice > 0.9 && bite > 0.85;
      happyEyes.visible = !moody && ((happy && !sleeping) || petting || cheering || rice > 0.9);
      const laughing = !moody && ((happy && !sleeping) || cheering || chewing || (talk && Math.sin(elapsed * 30) > 0));
      open.visible = laughing || dizzy > 0.5;
      smile.visible = !laughing && !moody;

      // Asleep, his head droops a little; dizzy, it rolls round; cross, it gives a little shake.
      const r = head.outer.rotation;
      r.x = r.x * (1 - 0.6 * lying) + EAT_NOD * rice + dizzy * 0.12 * Math.cos(elapsed * 5);
      r.y += cross * 0.12 * Math.sin(elapsed * 14);
      r.z += dizzy * 0.2 * Math.sin(elapsed * 5);
    },
  };
}
