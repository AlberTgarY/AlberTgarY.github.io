/*******************************************************************************
 * One pet on the profile photo: where it is, what it is doing, and how it moves.
 * It draws its voxel model into its own small canvas, turns its head to the
 * pointer (or to the others), blinks, wags, is happy when hovered, hops with a
 * heart when clicked, naps when left alone, strolls and takes laps round the
 * photo, and joins in with the others (together.js).
 *
 * A model (assets/js/pets/models/) returns the rig this drives. Units are
 * voxels: y up, the model faces +z and its feet rest on y = -0.5.
 *   group, pose              turned to face the walking direction / bobbed and lowered to lie
 *   head, headPivotY         pivot at the neck
 *   ears[]                   pivots at the ear bases, left then right
 *   eyelids, hat             meshes shown to blink or sleep / in dark mode
 *   nightwear(on)            changes into nightclothes in dark mode, if the model has any
 *   lieDrop, headDrop        how far the body and the head sink to lie down (or sit)
 *   headAt, hit, shadow      [height, forward] of the face; hit ellipse [height, rx, ry]; shadow radii
 *   sleepAt                  [x, y, z] of the face asleep, if it moves elsewhere (into a bed)
 *   speed, gaitHz            walking speed in px/s and steps per second
 *   lane                     px further back than the front path, for models that walk past the pets
 *   actions                  how likely each next action is: lap, stroll, nap, trick, rest (do nothing)
 *   tricks                   the model's own idle tricks, if it has any, as { name: seconds }
 *   feeds                    whether it feeds the pets that get hungry
 *   eats, feedGap            whether it gets hungry and eats from a bowl, and px from it to its feeder
 *   leads, hands             whether it walks the pets on leads, and the objects in its hands
 *   harness, clip            for a pet walked on a lead: the harness mesh, shown on walks, and the
 *                            object where the lead clips on
 *   homebody                 a pet that only goes out on a lead, and never tags along
 *   mischief                 the mischief it makes while the girl is out, as { name: seconds }
 *   liesWhenPetted, purrs    whether it lies down to be petted, and purrs (shows notes) when it is
 *   seats                    [x, y, z] where pets sit beside it on its sofa (its trick "sofa")
 *   label, hint              accessible name and tooltip
 *   heft                     [height of the centre of mass, radius of gyration] in voxels, for how it
 *                            swings when picked up
 *   drop                     how it comes down when let go: { open: s before its wings or parachute
 *                            catch the air, terminal: px/s it then floats down at, beat: wingbeats per
 *                            s, sway: [rad, Hz] it sways by on the way down, hangFrom: voxel height it
 *                            hangs from as it sways (a parachute's), settle: s it takes to land, give: how
 *                            quickly its legs take the landing (rad/s), spin: whether it turns right round
 *                            on the way down, glide: px it steps on as it lands, then: { trick: s } after }
 *   animate(dt, { happy, walking, lying, sleeping, stride, gait, state, trick, elapsed, progress,
 *                 leash, stroke, company, aloft })
 *                            poses the limbs, tail and face; `elapsed` is the seconds spent in
 *                            `state`, `progress` the fraction done of a timed one, `trick` the trick,
 *                            mischief or mood, `leash` and `stroke` the index of the hand holding leads
 *                            or petting (-1 for none), `company` whether each seat is taken and `aloft`,
 *                            while it is picked up, coming down or landing, how (makePet's `air`)
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import {
  W,
  H,
  VOX,
  FOOT_PX,
  CAM_YAW,
  camera,
  toPx,
  world,
  now,
  clamp,
  approach,
  rnd,
  wrap,
  isDark,
  spring,
  stepSpring,
  GAP,
  LAP_GAP,
  CROSS,
  EAT_TIME,
  STROKE_GAP,
  STROKE_TIME,
  SCOLD_GAP,
  SCOLD_TIME,
  HOP_TIME,
} from "./stage.js";
import { freshPicker, evenly } from "./choose.js";

// Picked up and let go (see makePet). A point of the scene in px within the canvas, as the camera draws it
// now that it is cropped to W x H (stage.js's toPx is for the whole W x W view); from it, px per voxel up the
// model's axis, and the contact shadow's centre on the ground (y = -0.45) and px across and down the canvas for
// a voxel along the scene's x and z there, for drawing the shadow on the page exactly as the canvas would.
const canvasPx = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
};
const PX_UP = canvasPx(0, 0, 0)[1] - canvasPx(0, 1, 0)[1];
const SHADOW_AT = canvasPx(0, -0.45, 0);
const SHADOW_X = canvasPx(1, -0.45, 0).map((v, i) => v - SHADOW_AT[i]);
const SHADOW_Z = canvasPx(0, -0.45, 1).map((v, i) => v - SHADOW_AT[i]);
// The axis through the screen towards the viewer, which a pet swings about, and the depth of the model's
// middle in normalised device coordinates, for finding the point under the pointer.
const VIEW = camera.getWorldDirection(new THREE.Vector3()).negate();
const MIDDLE_Z = new THREE.Vector3().project(camera).z;
const GRAVITY = 980; // px/s²: a pet some 50 px tall is about half a metre tall
const MAX_SWING = 1; // rad either way, so it stays inside its canvas
const STEP = 1 / 240; // s: the longest step the swing is worked out in, so it stays steady at any frame rate
const POP = 6; // px a pet is lifted by as it is picked up, before the pointer even moves
const LOW = 16; // px: let go below this, it just drops back down
const smooth = (a, b, v) => {
  const p = clamp((v - a) / (b - a), 0, 1);
  return p * p * (3 - 2 * p);
};
// A damped spring `s` ({ x, v }) one step `h` towards `target`, at angular frequency `omega` and damping
// ratio `zeta` (below 1 it overshoots and swings back).
function wobble(s, target, omega, zeta, h) {
  s.v += (omega * omega * (target - s.x) - 2 * zeta * omega * s.v) * h;
  s.x += s.v * h;
}

// States: idle | walk | lap | sleep | trick | feed | serve | eat | ready (lined up for a walk) | wait (to be
// petted) | stroke | petted | mischief | messy (waiting to be found out) | react (to the mess) | held
// (picked up by the pointer) | fall (let go) | land. `canCarry`: whether it can be picked up at all (not
// with reduced motion).
export function makePet(el, rig, spread, { pets, pointer, together, canCarry }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  } catch {
    return null; // no WebGL: leave the (hidden) placeholder alone
  }
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  const scene = new THREE.Scene();
  scene.add(rig.group);
  // Soft key light from the front left: faces read as distinct planes without banding on the curves.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-6, 5, 10);
  scene.add(key);

  // Contact shadow on the ground.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.45;
  rig.group.add(shadow);
  const dress = (night) => {
    rig.hat.visible = night;
    rig.nightwear?.(night);
  };
  dress(isDark());

  const canvas = renderer.domElement;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  el.style.height = `${H}px`;
  el.style.transformOrigin = `${W / 2}px ${FOOT_PX}px`; // scale about the paws
  el.setAttribute("aria-label", rig.label);
  el.title = rig.hint;
  el.replaceChildren(canvas);
  const render = () => renderer.render(scene, camera);
  // The outline it is picked up by (pets.js), over the canvas, which is click-through: the hit ellipse
  // (over()), where a finger never scrolls the page.
  const handle = canCarry ? document.createElement("span") : null;
  if (handle) {
    const [hy, rx, ry] = rig.hit.map((v) => v * VOX);
    handle.className = "pet-handle";
    Object.assign(handle.style, { left: `${W / 2 - rx}px`, top: `${FOOT_PX - hy - ry}px`, width: `${2 * rx}px`, height: `${2 * ry}px` });
    el.append(handle);
  }

  // Placement within .profile, in px.
  const lane = rig.lane || 0; // px further back than the front path
  let x = null; // centre; placed along the path by `spread` (0 the right end, 1 the left) on the first layout
  let y = 0; // how far the paws are raised above the lane (further back is higher)
  let depthScale = 1; // smaller further back
  let behind = false; // drawn behind the photo
  let lift = 0; // how far it is lifted off the ground, picked up or coming down
  let swayX = 0; // px it swings out to the side by under its parachute, on the way down

  function place() {
    el.style.transform = `translate(${(x - W / 2 + swayX).toFixed(2)}px, ${(y - lift).toFixed(2)}px) scale(${depthScale.toFixed(4)})`;
    if (handle && handle.hidden !== behind) handle.hidden = behind; // (no picking it up behind the photo)
  }

  // Screen position of a point on the model, and of the face, as px within the canvas, for looking,
  // hearts and the sleepy "z".
  const modelPx = ([mx, my, mz]) => toPx(mx * Math.cos(yaw) + mz * Math.sin(yaw), my, mz * Math.cos(yaw) - mx * Math.sin(yaw));
  const facePx = () => modelPx([0, ...rig.headAt]);

  // The canvas is click-through (on a lap it passes over text), so hits are tested against the outline.
  function over(px, py) {
    if (behind) return false;
    const r = canvas.getBoundingClientRect();
    const k = (r.width / W) * VOX;
    const dx = (px - (r.left + r.width / 2)) / (rig.hit[1] * k);
    const dy = (py - (r.top + (r.height / H) * FOOT_PX - rig.hit[0] * k)) / (rig.hit[2] * k);
    return dx * dx + dy * dy < 1;
  }

  /* ----- state ----- */

  let state = "idle";
  let stateStart = 0;
  let stateUntil = 0;
  let walkTo = 0;
  let afterWalk = null; // "lap", "feed", "ready", "home" (the end of a walk), "stroke", "perch" or "scold" on arrival
  let trip = null; // { party, ahead }: the walking party this pet is in, and px it walks ahead of the girl
  let pace = null; // px/s the party walks at, the same for all of it
  let leash = -1; // the hand holding the leads, for the girl
  let perch = null; // { host, seat, at, up, down, from }: on the girl's sofa, hopping up at `at` (or down, from `from` if she is picked up)
  const toPet = []; // pets the girl will pet next
  let trick = null; // the trick being done, or the mischief being made, or the girl's mood at it
  let hungry = false;
  let bubble = null; // the food bubble shown while hungry
  let mood = null; // the girl's mood over her head, at the mess
  let mischiefAt = Infinity; // when the cat gets up to mischief, while the girl is out
  let partner = null; // the pet being fed, petted or scolded, or the one feeding, petting or scolding this pet
  let heartAt = 0;
  let hurried = false; // already stepping aside from a pet in another lane
  let lapAngle = 0; // position on the lap: π/2 is the middle of the front path
  let lapEnd = 0;
  let lapDir = 1;
  let nextActionAt = now() + rnd(5, 9);
  let happyUntil = -1;
  let hopStart = -1;
  let yaw = 0; // the body's facing; CAM_YAW faces the viewer, CAM_YAW ± π/2 walks along the screen
  let yawTarget = 0;
  const nearestTurn = (target) => yaw + wrap(target - yaw); // angles stay continuous, so turns take the short way
  // What it does next seldom repeats: a lap, stroll or nap seldom straight after the same again, and the
  // tricks, and the mischief, mostly take turns.
  const actions = freshPicker(1);
  const tricks = freshPicker(Math.max(0, Object.keys(rig.tricks || {}).length - 1));
  const messes = freshPicker(1);

  function setState(next, duration = 0) {
    state = next;
    stateStart = now();
    stateUntil = stateStart + duration;
    hurried = false;
    el.classList.toggle("sleeping", next === "sleep");
    el.classList.toggle("purring", next === "petted" && !!rig.purrs);
    if (next === "sleep" || next === "petted") {
      const [fx, fy] = next === "sleep" && rig.sleepAt ? modelPx(rig.sleepAt) : facePx();
      el.style.setProperty("--z-x", `${fx + 12}px`);
      el.style.setProperty("--z-y", `${fy - 30}px`);
    }
  }

  function wake() {
    setState("idle");
    yawTarget = nearestTurn(0);
    nextActionAt = now() + rnd(5, 9);
  }

  function walk(to, then = null) {
    walkTo = to;
    afterWalk = then;
    yawTarget = nearestTurn(CAM_YAW + (to > x ? Math.PI / 2 : -Math.PI / 2)); // along the screen's x axis
    setState("walk");
  }

  // A full lap starting and ending in the middle of the front path, in a random direction unless the party
  // sets it (1 sets off to the left). The girl setting off leaves the cat home alone.
  function startLap(dir = Math.random() < 0.5 ? 1 : -1) {
    lapDir = dir;
    lapAngle = Math.PI / 2;
    lapEnd = lapAngle + lapDir * Math.PI * 2;
    setState("lap");
    if (rig.leads) together.setOff();
  }

  // Back in the middle of the path. A pet ahead of the rest of its party walks on, so they all stop
  // together, spaced out as they set off.
  function endLap() {
    x = world.cx;
    y = 0;
    depthScale = 1;
    behind = false;
    place();
    const tail = trip ? trip.ahead - trip.party.back : 0;
    if (tail > 1) walk(world.cx - lapDir * tail, "home");
    else leave();
  }

  /* ----- walks with the others ----- */

  // Line up at `slot` on the front path, facing the way the party will go.
  function join(party, ahead, slot) {
    trip = { party, ahead };
    pace = party.pace;
    if (state === "sleep") setState("idle");
    if (Math.abs(slot - x) > 1) walk(slot, "ready");
    else ready();
  }

  function ready() {
    setState("ready");
    yawTarget = nearestTurn(CAM_YAW - (trip.party.dir * Math.PI) / 2);
  }

  // Off: the one in front starts its lap, and the rest follow it into the lap, keeping their distance.
  function go() {
    if (trip.ahead === trip.party.front) startLap(trip.party.dir);
    else walk(world.cx, "lap");
  }

  function leave() {
    trip = null;
    pace = null;
    wake();
  }

  // Viewport px of a point on the model, as last rendered.
  const v = new THREE.Vector3();
  function screenAt(obj) {
    obj.getWorldPosition(v).project(camera);
    const r = canvas.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }

  // The hand on the side turned towards the viewer, judged by the body's facing rather than by where the
  // hands are, since holding the leads (or not) moves them. It only changes when the other side is clearly
  // turned this way, so the leads don't flick from hand to hand while she walks straight away or towards
  // the viewer.
  let hand = 1;
  function nearerHand() {
    const towards = Math.sin(CAM_YAW - yaw); // above 0: her left side (hands[1]) faces the viewer
    if (Math.abs(towards) > 0.3) hand = towards > 0 ? 1 : 0;
    return hand;
  }

  /* ----- petting ----- */

  // The girl goes to stand beside a pet, on the nearer side if there is room, and strokes it while it
  // waits for her.
  function goPet(p) {
    let side = Math.sign(x - p.x) || 1;
    if (p.x + side * STROKE_GAP > world.maxX || p.x + side * STROKE_GAP < world.minX) side = -side;
    partner = p;
    p.waitFor(self);
    walk(p.x + side * STROKE_GAP, "stroke");
  }

  function stroke() {
    if (partner.state !== "wait") return wake();
    yawTarget = nearestTurn(CAM_YAW + Math.sign(partner.x - x) * (Math.PI / 2 - 0.6)); // towards it, still showing the face
    setState("stroke", STROKE_TIME);
    partner.getPetted(self, STROKE_TIME);
  }

  // Petted: turned to the one petting it, eyes shut in bliss, hearts popping up.
  function getPetted(by, secs) {
    partner = by;
    setState("petted", secs);
    heartAt = stateStart + 0.6;
    yawTarget = nearestTurn(CAM_YAW + Math.sign(by.x - x) * (Math.PI / 2 - 0.7));
  }

  /* ----- the sofa ----- */

  // Profile px of a seat on this model's sofa, which stands at yaw 0.
  function seatAt(i) {
    v.set(...rig.seats[i]).project(camera);
    return [x - W / 2 + ((v.x + 1) / 2) * W, world.nearY - lane - FOOT_PX + y + ((1 - v.y) / 2) * H];
  }

  // To the girl's sofa: walk to below the seat, wait for the sofa to be up, hop on and be petted.
  function perchOn(host, seat) {
    perch = { host, seat, at: Infinity, up: false, down: false };
    partner = host;
    if (state === "sleep") setState("idle");
    walk(host.seatAt(seat)[0], "perch");
  }

  function hopUp() {
    perch.at = Math.max(now(), perch.host.sofaReadyAt);
    setState("petted", Infinity);
    heartAt = perch.at + HOP_TIME + 0.6;
    yawTarget = nearestTurn(CAM_YAW + (perch.seat ? 0.3 : -0.3)); // facing out, a little away from her, so neither hides her
  }

  function leaveSofa() {
    if (now() < perch.at + HOP_TIME) {
      perch = null; // not up yet: never mind
      y = 0;
      place();
      wake();
    } else Object.assign(perch, { at: now(), up: false, down: true });
  }

  // Hopping up onto the seat, or down, in an arc; once down, back to normal.
  function updatePerch(t) {
    const [sx, sy] = perch.from || perch.host.seatAt(perch.seat);
    const k = clamp((t - perch.at) / HOP_TIME, 0, 1);
    const seated = sy - (world.nearY - lane);
    x = sx;
    y = (perch.down ? 1 - k : k) * seated - 10 * Math.sin(k * Math.PI);
    perch.up = !perch.down && k >= 1;
    if (perch.down && k >= 1) {
      perch = null;
      y = 0;
      wake();
    }
    place();
  }

  /* ----- mischief, and being found out ----- */

  // The girl has gone out: in a moment, while she is still out, make a mess (or not, if she is back first).
  function planMischief() {
    if (mischiefAt === Infinity && rig.mischief) mischiefAt = now() + rnd(1, 4);
  }

  function makeMischief() {
    trick = messes.take(evenly(rig.mischief));
    yawTarget = nearestTurn(CAM_YAW); // facing out, to show it off
    setState("mischief", rig.mischief[trick]);
  }

  // The girl, back, goes to the mess and takes it in, cross or dizzy (even odds); then it is tidied away.
  function goScold(cat) {
    let side = Math.sign(x - cat.x) || 1;
    if (cat.x + side * SCOLD_GAP > world.maxX || cat.x + side * SCOLD_GAP < world.minX) side = -side;
    partner = cat;
    cat.foundBy(self);
    walk(cat.x + side * SCOLD_GAP, "scold");
  }

  function scold() {
    trick = Math.random() < 0.5 ? "angry" : "dizzy";
    yawTarget = nearestTurn(CAM_YAW + Math.sign(partner.x - x) * (Math.PI / 2 - 0.6));
    setState("react", SCOLD_TIME);
    mood = document.createElement("span");
    mood.className = `pet-mood pet-mood-${trick}`;
    el.appendChild(mood);
  }

  function doneScolding() {
    mood.remove();
    mood = null;
    partner.tidy();
    wake();
  }

  /* ----- sharing the photo with the other pets ----- */

  const others = () => pets.filter((p) => p !== self);
  const sameLane = () => others().filter((p) => p.lane === lane); // the pets this one keeps clear of
  const lapping = (p) => p.trip || p.state === "lap" || (p.state === "walk" && p.afterWalk === "lap");
  // The stretch of the path another pet is on, or heading for.
  const occupied = (p) => (p.state === "walk" ? [Math.min(p.x, p.walkTo), Math.max(p.x, p.walkTo)] : [p.x, p.x]);
  const clear = (lo, hi, gap = GAP) => sameLane().every((p) => (([a, b]) => b < lo - gap || a > hi + gap)(occupied(p)));
  // Too close to where a pet in another lane is standing (or will stop), so one would hide the other.
  const nearOtherLane = (at) => others().some((p) => p.lane !== lane && Math.abs(p.restX - at) < CROSS);

  // A stroll target on this pet's side of the others in its lane, at least 30 px away, or null if there is no room.
  function strollTarget() {
    let lo = world.minX;
    let hi = world.maxX;
    for (const p of sameLane()) {
      const [a, b] = occupied(p);
      if (a >= x) hi = Math.min(hi, a - GAP);
      else if (b <= x) lo = Math.max(lo, b + GAP);
      else return null;
    }
    const choices = [];
    if (x - 30 >= lo) choices.push([lo, x - 30]);
    if (x + 30 <= hi) choices.push([x + 30, hi]);
    if (!choices.length) return null;
    for (let i = 0; i < 12; i++) {
      const [a, b] = choices[Math.floor(Math.random() * choices.length)];
      const to = rnd(a, b);
      if (!nearOtherLane(to)) return to;
    }
    return null;
  }

  // The next action, by the model's odds (rig.actions): first whether to rest, at its own odds, then which
  // action, mostly not the one it did last. A lap may become a walk with the others; one that is not
  // possible becomes a stroll. No laps or strolls while a pet is being fed, naps only once the pointer has
  // been still for a while, and no tricks while someone is out.
  function chooseAction(t) {
    const someoneLapping = others().some(lapping);
    const settled = !someoneLapping && !mealTime();
    if (nearOtherLane(x)) {
      const to = strollTarget();
      if (to !== null) return walk(to);
    }
    const { rest = 0, ...active } = rig.actions;
    let action = Math.random() < rest ? "rest" : actions.choose(active);
    if (action === "lap") {
      if (world.lapOk && settled && (together.formParty(self) || lapAlone())) return actions.did("lap");
      action = "stroll";
    }
    if (action === "stroll" && settled) {
      const to = strollTarget();
      if (to !== null) {
        actions.did("stroll");
        return walk(to);
      }
    } else if (action === "nap" && t - pointer.movedAt > 6) {
      actions.did("nap");
      return setState("sleep", rnd(10, 20));
    } else if (action === "trick" && !someoneLapping) {
      trick = tricks.take(evenly(rig.tricks));
      yawTarget = nearestTurn(trick === "sofa" ? 0 : CAM_YAW); // face the viewer to show it off (the sofa at an angle)
      setState("trick", rig.tricks[trick]);
      if (trick === "sofa") together.inviteToSofa(self);
      return;
    }
    nextActionAt = t + rnd(5, 9);
  }

  function lapAlone() {
    if (!clear(Math.min(x, world.cx), Math.max(x, world.cx), LAP_GAP)) return false;
    if (Math.abs(x - world.cx) < 2) startLap();
    else walk(world.cx, "lap");
    return true;
  }

  /* ----- hunger and feeding ----- */

  const mealTime = () => pets.some((p) => p.hungry || p.state === "eat");
  const feeder = () => pets.find((p) => p.feeds);

  // Hungry: wait here with a food bubble over the head until the feeder comes, while the others in the lane
  // step away to make room.
  function getHungry() {
    hungry = true;
    bubble = document.createElement("span");
    bubble.className = `pet-want pet-want-${el.dataset.pet}`;
    el.appendChild(bubble);
    sameLane().forEach((p) => p.makeRoom(x));
  }

  // Out of the way of a hungry pet at `from`: off to the end of the path on this side of it.
  function makeRoom(from) {
    if (state === "sleep") wake();
    if (state !== "idle") return;
    const end = x < from ? world.minX : world.maxX;
    if (Math.abs(end - x) > 8) walk(end);
  }

  // The feeder goes to kneel beside the hungry pet, on the side away from the other pets in its lane when
  // there is room there.
  function goFeed(eater) {
    const rival = pets.find((p) => p !== eater && p !== self && p.lane === eater.lane);
    let side = rival ? Math.sign(eater.x - rival.restX) || 1 : Math.random() < 0.5 ? 1 : -1;
    if (eater.x + side * eater.feedGap > world.maxX || eater.x + side * eater.feedGap < world.minX) side = -side;
    partner = eater;
    if (state === "sleep") wake();
    walk(clamp(eater.x + side * eater.feedGap, world.minX, world.maxX), "feed");
  }

  // Served by `server`: eat from the bowl, facing it and turned a little to the viewer.
  function eat(server) {
    hungry = false;
    bubble.remove();
    bubble = null;
    partner = server;
    setState("eat", EAT_TIME);
    yawTarget = nearestTurn(CAM_YAW + Math.sign(server.x - x) * (Math.PI / 2 - 0.5));
    heartAt = stateStart + 2;
    server.serve();
  }

  // A heart pops up over the face.
  function heart() {
    const [fx, fy] = facePx();
    const h = document.createElement("span");
    h.className = "pet-heart";
    h.style.left = `${fx - 10}px`;
    h.style.top = `${fy - 40}px`;
    el.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }

  function pet() {
    const t = now();
    if (state === "sleep") wake(); // a stroll or lap carries on, with a hop
    hopStart = t;
    happyUntil = t + 1.8;
    happyTilt = rnd(0, 1) < 0.5 ? -0.16 : 0.16;
    heart();
    nextActionAt = Math.max(nextActionAt, t + 10);
  }

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pet();
    }
  });

  /* ----- picked up, carried about and let go ----- */

  // Picked up ("held"), it hangs from the point it was picked up by and swings from there as it is carried
  // about, like a pendulum: it lags behind the hand, overshoots and swings back, and its legs, ears and tail
  // trail a little behind the body. Let go ("fall"), it comes down the way its model says (rig.drop): the
  // girl on little wings, the collie under a parachute, the cat just dropping. Once down ("land") it finds its
  // feet and goes back to its own life. In px within .profile, y down; it swings in the screen's plane.
  // What its model is told (animate's `aloft`): the phase (the state) and the seconds `t` into it; `w` how far
  // into its aloft pose it is (easing in as it is picked up, and out as it lands); `swing` the body's turn
  // from upright (towards the viewer, so above 0 its feet swing to the right); `lag` and `flop` how far its
  // legs, and its ears and tail, trail behind that (rad, relative to the body); `shake` how hard it is being
  // shaken (rad/s); `open` how far its wings or parachute are out; `beat` the wingbeat's phase; `crouch` how
  // far its legs give as it lands (0 to 1); `speed` px/s it is coming down at; `lift` px it is up; `height`
  // px it was let go at; and `across` [x, z] the screen's axis in the model, for turning a part about it.
  const air = {
    phase: "",
    t: 0,
    w: 0,
    swing: 0,
    lag: 0,
    flop: 0,
    shake: 0,
    open: 0,
    beat: 0,
    crouch: 0,
    speed: 0,
    lift: 0,
    height: 0,
    across: [0, 0],
  };
  const grip = { x: 0, y: 0, dx: 0, dl: 0 }; // the pointer (client px), and the pet's offset from it
  const bob = { x: 0, y: 0, vx: 0, vy: 0, length: 1, rest: 0 }; // its centre of mass, swinging from the grip
  const pivot = new THREE.Vector3(); // the point it hangs from, in the scene
  const swing = { x: 0, v: 0 }; // the body's turn about the pivot, rad
  const lag = { x: 0, v: 0 }; // the legs' turn, following the body's a little behind
  const flop = { x: 0, v: 0 }; // the ears' and tail's, further behind
  const stretch = { x: 0, v: 0 }; // stretched by a quick lift, squashed by a quick drop
  let vx = 0; // the grip's velocity, px/s
  let vl = 0; // and how fast it is lifting
  let speed = 0; // px/s it is coming down at
  let drift = 0; // px/s sideways, thrown
  let opensAt = Infinity; // s after it is let go that its wings or parachute catch the air
  let impact = 0; // px/s it touched down at
  let landX = 0;
  let glideDir = 0;
  let hang = null; // on the first pick-up, the model hangs in this, turned about `pivot`
  let offset = null; // (and this, inside it)
  let ground = null; // its shadow on the ground below it while it is up
  const airborne = () => state === "held" || state === "fall" || state === "land";

  // Picked up at the pointer (client px): whatever it was doing stops, and anyone doing something with it
  // stops too. A walk round the photo that has not set off yet breaks up; one that has goes on without it
  // (so off the lead). On a lap or a seat, its height there is what it is lifted by.
  function grab(cx, cy) {
    if (behind || x === null) return false;
    if (trip) {
      if (trip.party.going) trip = pace = null;
      else trip.party.members.forEach((p) => p.trip && p.leave());
    }
    others().forEach((p) => p.standDown(self));
    mood?.remove();
    mood = null;
    perch = null;
    partner = null;
    if (!airborne()) air.w = air.shake = 0;
    lift -= y;
    y = 0;
    if (!hang) {
      hang = new THREE.Group();
      offset = new THREE.Group();
      hang.add(offset);
      offset.add(rig.group);
      scene.add(hang);
      ground = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      ground.setAttribute("class", "pet-ground");
      ground.innerHTML = '<ellipse rx="1" ry="1" shape-rendering="crispEdges" />';
      el.parentElement.insertBefore(ground, el.parentElement.querySelector(".pet")); // under all the pets
    }
    // It hangs from the point under the pointer, on the plane through its middle facing the viewer, but never
    // from below its centre of mass (it would turn upside down) nor too far out to one side of it.
    const r = canvas.getBoundingClientRect();
    const k = W / r.width;
    const com = canvasPx(0, rig.heft[0], 0)[1];
    const py = Math.min((cy - r.top) * k, com - 3 * PX_UP);
    const px = W / 2 + clamp((cx - r.left) * k - W / 2, -0.45 * (com - py), 0.45 * (com - py));
    pivot.set((px / W) * 2 - 1, 1 - (py / H) * 2, MIDDLE_Z).unproject(camera);
    // Its centre of mass swings from there like a pendulum as long as a body that size swinging, starting
    // where it is (caught on the way down, still swinging as it was), and carried on by its walk.
    const [dx, dy] = [W / 2 - px, com - py];
    const d = Math.hypot(dx, dy) / VOX;
    bob.length = (d + rig.heft[1] ** 2 / d) * VOX;
    bob.rest = Math.atan2(dx, dy);
    const a = bob.rest + swing.x;
    bob.x = x + bob.length * Math.sin(a);
    bob.y = -lift + bob.length * Math.cos(a);
    bob.vx = swing.v * bob.length * Math.cos(a) + (state === "walk" ? Math.sign(walkTo - x) * (pace ?? rig.speed) : 0);
    bob.vy = -swing.v * bob.length * Math.sin(a);
    const o = el.offsetParent.getBoundingClientRect();
    grip.x = cx;
    grip.y = cy;
    grip.dx = x - (cx - o.left);
    grip.dl = lift + POP + (cy - o.top);
    vx = vl = 0;
    stretch.v = 1.2; // a little boing as it comes up
    setState("held");
    return true;
  }

  // Let go: it falls, at first as it was thrown (flung up, it rises first), until its wings or parachute
  // catch the air, unless it is only just off the ground. The cat turns right round on the way down, the others
  // to face the viewer.
  function letGo() {
    if (state !== "held") return;
    air.height = lift;
    speed = clamp(-vl, -600, 600);
    drift = clamp(vx, -600, 600);
    opensAt = lift > LOW ? rig.drop.open : Infinity;
    air.open = air.beat = 0;
    if (rig.drop.spin && lift > 40) yawTarget = nearestTurn(0) + Math.PI * 2 * (Math.sign(drift || swing.v) || 1);
    else if (opensAt < Infinity) yawTarget = nearestTurn(CAM_YAW); // facing the viewer, its wings or parachute in full view
    setState("fall");
  }

  // Down: its legs take it, as it steps on in the way it faces (the cat).
  function touchDown() {
    impact = speed;
    lift = speed = drift = 0;
    landX = x;
    glideDir = Math.sign(Math.sin(yawTarget - CAM_YAW));
    setState("land", rig.drop.settle);
  }

  // Steady on its feet: hung straight in the scene again, and back to its own life (stepping off a pet it
  // came down on, or doing what it does once down), as pleased as anything.
  function landed() {
    lift = swayX = 0;
    for (const s of [swing, lag, flop, stretch]) s.x = s.v = 0;
    air.w = air.shake = air.open = air.crouch = 0;
    hang.position.set(0, 0, 0);
    hang.quaternion.identity();
    hang.scale.set(1, 1, 1);
    offset.position.set(0, 0, 0);
    ground.style.display = "none";
    wake();
    const [then] = Object.entries(rig.drop.then || {});
    const on = sameLane().find((p) => !p.aloft && Math.abs(p.x - x) < GAP / 2);
    if (on) {
      const side = x < on.x ? -1 : 1;
      const to = on.x + side * GAP;
      walk(to >= world.minX && to <= world.maxX ? to : clamp(on.x - side * GAP, world.minX, world.maxX));
    } else if (then) {
      trick = then[0];
      yawTarget = nearestTurn(CAM_YAW);
      setState("trick", then[1]);
    } else happyUntil = now() + 1.5;
    place();
  }

  // `p` has been picked up: stop feeding it, petting it or taking in its mess, or waiting to be petted by it
  // (either may come back to it later); off its sofa, hopping down from where the seat was.
  function standDown(p) {
    if (perch?.host === p) perch.from = p.seatAt(perch.seat);
    if (partner !== p) return;
    const busy =
      ["feed", "stroke", "react", "wait"].includes(state) ||
      (state === "petted" && !perch) ||
      (state === "walk" && ["feed", "stroke", "scold"].includes(afterWalk));
    if (!busy) return;
    mood?.remove();
    mood = null;
    wake();
  }

  // Picked up, coming down or landing: where it is, and how it swings, this frame.
  function fly(dt, t) {
    if (!dt) return;
    const drop = rig.drop;
    const e = t - stateStart;
    const top = Math.max(0, world.nearY - lane - world.skyY - (rig.hit[0] + rig.hit[2]) * VOX); // the most it can be lifted
    const x0 = x;
    const lift0 = lift;
    depthScale = approach(depthScale, 1, 10, dt);
    if (state === "held") {
      // Following the pointer closely, smoothing its jitter, within reach of the path.
      const o = el.offsetParent.getBoundingClientRect();
      x = approach(x, clamp(grip.x - o.left + grip.dx, world.minX, world.maxX), 30, dt);
      lift = approach(lift, clamp(grip.dl - (grip.y - o.top), 0, top), 30, dt);
      air.w = approach(air.w, 1, 10, dt);
    } else if (state === "fall") {
      // Falling, then floating down, a little slower on each downstroke of the wings.
      const float = drop.terminal * (drop.beat ? 1 + 0.4 * Math.cos(air.beat) : 1);
      speed = e < opensAt ? speed + GRAVITY * dt : approach(speed, float, 5, dt);
      lift -= speed * dt;
      if (lift > top) {
        lift = top;
        speed = Math.max(speed, 0);
      }
      drift *= Math.exp(-(e < opensAt ? 0.5 : 4) * dt);
      x += drift * dt;
      if (x < world.minX || x > world.maxX) {
        x = clamp(x, world.minX, world.maxX);
        drift = 0;
      }
      air.open = opensAt < Infinity ? smooth(opensAt, opensAt + 0.35, e) : 0;
      air.beat += Math.PI * 2 * (drop.beat || 0) * dt;
      if (lift <= 0) touchDown();
    } else {
      // Landing: the legs give, the harder it came down the more, and spring back.
      const g = drop.give * e;
      air.crouch = clamp(impact / 250, 0.3, 1) * g * Math.exp(1 - g);
      air.w = 1 - smooth(0.5 * drop.settle, drop.settle, e);
      x = clamp(landX + (drop.glide || 0) * glideDir * smooth(0, 0.6, e), world.minX, world.maxX);
    }

    // The swing, in short steps. Held, the centre of mass swings from the grip, slowed a little by the air;
    // coming down, the body sways (once its wings or parachute are out) and rights itself.
    const n = Math.ceil(dt / STEP);
    const h = dt / n;
    const damp = Math.exp(-1.8 * h);
    const sway = state === "fall" && drop.sway ? drop.sway[0] * air.open * Math.sin(Math.PI * 2 * drop.sway[1] * e) : 0;
    for (let i = 1; i <= n; i++) {
      if (state === "held") {
        const ax = x0 + ((x - x0) * i) / n;
        const ay = -(lift0 + ((lift - lift0) * i) / n);
        bob.vx *= damp;
        bob.vy = bob.vy * damp + GRAVITY * h;
        const a = clamp(Math.atan2(bob.x + bob.vx * h - ax, bob.y + bob.vy * h - ay), bob.rest - MAX_SWING, bob.rest + MAX_SWING);
        const bx = ax + bob.length * Math.sin(a);
        const by = ay + bob.length * Math.cos(a);
        bob.vx = (bx - bob.x) / h;
        bob.vy = (by - bob.y) / h;
        bob.x = bx;
        bob.y = by;
        swing.x = a - bob.rest;
      } else wobble(swing, sway, state === "fall" ? 4.5 : 6, 0.45, h);
      wobble(lag, swing.x, 9, 0.2, h);
      wobble(flop, swing.x, 6, 0.12, h);
      wobble(stretch, 0, 15, 0.3, h);
    }
    const gx = (x - x0) / dt;
    const gl = (lift - lift0) / dt;
    if (state === "held") {
      const a = swing.x + bob.rest;
      swing.v = ((bob.vx - gx) * Math.cos(a) - (bob.vy + gl) * Math.sin(a)) / bob.length;
      stretch.v += (approach(vl, gl, 20, dt) - vl) * 0.006; // lifted quickly, it stretches; brought down quickly, it squashes
      stretch.x = clamp(stretch.x, -0.12, 0.16);
    }
    vx = approach(vx, gx, 20, dt);
    vl = approach(vl, gl, 20, dt);
    // Under its parachute it swings from the canopy, not from its back: the same turn, moved out to the side.
    const hangFrom = state !== "held" && drop.hangFrom ? (drop.hangFrom - pivot.y) * PX_UP * Math.sin(swing.x) * air.open : 0;
    swayX = approach(swayX, hangFrom, 12, dt);

    air.phase = state;
    air.t = t - stateStart;
    air.swing = swing.x;
    air.lag = lag.x - swing.x;
    air.flop = flop.x - swing.x;
    air.shake = approach(air.shake, Math.abs(swing.v), 3, dt);
    air.speed = state === "fall" ? speed : 0;
    air.lift = lift;
    air.across[0] = VIEW.x * Math.cos(yaw) - VIEW.z * Math.sin(yaw);
    air.across[1] = VIEW.x * Math.sin(yaw) + VIEW.z * Math.cos(yaw);
    if (state === "land" && t > stateUntil) landed();
    else place();
  }

  // The model turned and stretched about the pivot. Its contact shadow stays on the ground, right under it:
  // drawn on the page instead of in its canvas, which goes up with it, exactly where and as the canvas draws it
  // (the same ellipse, its size and darkness as this frame set them), then smaller and fainter the higher it is.
  function poseHang() {
    hang.position.copy(pivot);
    offset.position.copy(pivot).negate();
    hang.quaternion.setFromAxisAngle(VIEW, swing.x);
    hang.scale.set(1 - stretch.x / 2, 1 + stretch.x, 1 - stretch.x / 2);
    const k = depthScale / (1 + lift / 120);
    const [a, b] = [shadow.scale.x * k, shadow.scale.y * k]; // its radii along the model's x and z
    const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
    // The ellipse is the unit circle taken by the model's x axis (scene (c, 0, -s)) and z axis (scene (s, 0, c)).
    const m = [
      a * (c * SHADOW_X[0] - s * SHADOW_Z[0]),
      a * (c * SHADOW_X[1] - s * SHADOW_Z[1]),
      b * (s * SHADOW_X[0] + c * SHADOW_Z[0]),
      b * (s * SHADOW_X[1] + c * SHADOW_Z[1]),
    ].map((v) => v.toFixed(2));
    ground.firstChild.setAttribute("transform", `matrix(${m.join(" ")} 0 0)`);
    ground.style.display = "";
    const gx = x + swayX + (SHADOW_AT[0] - W / 2) * depthScale;
    const gy = world.nearY - lane + (SHADOW_AT[1] - FOOT_PX) * depthScale;
    ground.style.transform = `translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px)`;
    ground.style.opacity = (shadow.material.opacity * (0.3 + 0.7 / (1 + lift / 60))).toFixed(3);
    shadow.material.opacity = 0; // (not in the canvas, which goes up with it)
  }

  /* ----- what to do now ----- */

  // Hands the timers, the walks and the others' calls on to whatever comes next.
  function decide(t) {
    const sleeping = state === "sleep";
    // Stopped right in front of, or behind, a pet in another lane: step aside soon.
    if (state === "idle" && !hungry && !hurried && nearOtherLane(x)) {
      hurried = true;
      nextActionAt = Math.min(nextActionAt, t + rnd(1, 2.5));
    }
    // A feeder goes to a hungry pet as soon as it is free (waking if asleep); then to any mess the cat has
    // made, then it pets anyone waiting for it (one that is picked up once it is down again).
    const hungryPet = rig.feeds && (state === "idle" || sleeping) ? pets.find((p) => p.hungry && !p.aloft) : null;
    if (hungryPet) goFeed(hungryPet);
    const mess = rig.leads && state === "idle" ? pets.find((p) => p.state === "messy" && !p.found) : null;
    if (mess) goScold(mess);
    if (state === "idle" && toPet.length) {
      const p = toPet.shift();
      if (p.state === "idle") goPet(p);
    }
    // The cat, home alone, gets up to mischief once she is free, unless the girl is back by then.
    if (t > mischiefAt) {
      if (!together.girlOut()) mischiefAt = Infinity;
      else if (state === "idle" || sleeping) {
        mischiefAt = Infinity;
        makeMischief();
      }
    }
    if (state === "idle" && !hungry && t > nextActionAt && !document.hidden) chooseAction(t);
    const timed = ["sleep", "trick", "eat", "wait", "stroke"].includes(state) || (state === "petted" && !perch);
    if (timed && t > stateUntil) wake();
    if (state === "mischief" && t > stateUntil) setState("messy"); // and wait to be found out
    if (state === "react" && t > stateUntil) doneScolding();
    // Off the sofa once she is getting up, however her sit ends: a stretch skipped off screen or in a
    // background tab can end it in one frame.
    if (perch && !perch.down && !perch.host.sofaOpen) leaveSofa();
    if (perch && t >= perch.at) updatePerch(t);
    // A feeder holds the food out for a moment, then serves it and watches the pet eat.
    if (state === "feed" && t > stateUntil) partner.eat(self);
    // Once the pet has eaten, the feeder gets up, and half the time pets it.
    if (state === "serve" && partner.state !== "eat") {
      if (Math.random() < 0.5) toPet.push(partner);
      wake();
    }
    if ((state === "eat" || (state === "petted" && (!perch || perch.up))) && t > heartAt) {
      heart();
      heartAt = t + 1.4;
    }
  }

  // Walking or lapping: along the path, and on arrival on to what it was walking for.
  function move(dt) {
    if (state === "walk") {
      const step = Math.sign(walkTo - x);
      x += step * (pace ?? rig.speed) * dt;
      if ((step > 0 && x >= walkTo) || (step <= 0 && x <= walkTo)) {
        x = walkTo;
        if (afterWalk === "lap") startLap(trip?.party.dir);
        else if (afterWalk === "ready") ready();
        else if (afterWalk === "home") leave();
        else if (afterWalk === "stroke") stroke();
        else if (afterWalk === "perch") hopUp();
        else if (afterWalk === "scold") scold();
        else if (afterWalk === "feed") {
          yawTarget = nearestTurn(CAM_YAW + Math.sign(partner.x - x) * 0.75); // towards it, still showing the face
          setState("feed", 0.8);
        } else wake();
      }
      place();
    } else if (state === "lap") {
      // Constant speed along the ellipse: advance the angle by distance over the local radius.
      const ds = Math.hypot(world.rx * Math.sin(lapAngle), world.ry * Math.cos(lapAngle));
      lapAngle += (lapDir * (pace ?? rig.speed + 6) * dt) / Math.max(ds, 1);
      if (lapDir * (lapAngle - lapEnd) >= 0 || !world.lapOk) endLap();
      else {
        const s = Math.sin(lapAngle);
        const c = Math.cos(lapAngle);
        x = world.cx + world.rx * c;
        y = (world.ry - lane / 2) * (s - 1); // the far side is the same for every lane
        depthScale = 1 - 0.09 * (1 - s);
        behind = s < 0;
        // Face along the path: screen x, and depth towards the viewer (lower on screen is nearer).
        yawTarget = nearestTurn(CAM_YAW + Math.atan2(-world.rx * s * lapDir, world.ry * c * lapDir));
        place();
      }
    }
  }

  /* ----- animation ----- */

  // Where the pet looks, in [-1, 1] on each axis (screen space), and the glances it takes on its own.
  const look = { x: 0, y: 0 };
  const glance = { x: 0, y: 0, at: 0, pet: null };
  let headYaw = 0;
  let headPitch = 0;
  let tilt = 0;
  let glanceTilt = 0; // the occasional curious head tilt
  let happyTilt = 0; // the tilt while hovered or just petted
  const droop = spring(0, 3.5); // 0 standing, 1 lying asleep
  const turn = spring(0, 6); // the body's facing
  let stride = 0; // 0 standing still, 1 walking
  let gait = 0; // walk-cycle phase
  let breathPhase = 0; // integrated, so changing the breathing rate never jumps the phase
  let lid = 1; // 1 open, 0 shut
  let blinkAt = now() + rnd(1, 3);
  let blinkStart = -1;
  const earTwitch = [0, 0];
  let twitchAt = now() + rnd(3, 6);

  // Look target in [-1, 1] towards a screen point, from the face.
  function aimAt(r, px, py, reach) {
    const [fx, fy] = facePx();
    const k = r.width / W;
    return [clamp((px - (r.left + fx * k)) / reach, -1, 1), clamp((py - (r.top + fy * k)) / reach, -1, 1)];
  }

  function update(dt, hovering) {
    const t = now();
    decide(t);
    move(dt);
    if (airborne()) fly(dt, t);
    const aloft = airborne();
    const sleeping = state === "sleep";
    const walking = state === "walk" || state === "lap";
    const r = el.getBoundingClientRect();
    // Found out and scolded, the cat lays her ears back; till then she is rather pleased with herself.
    const scolded = state === "messy" && partner?.state === "react";
    const happy = hovering || t < happyUntil || ["eat", "wait", "petted"].includes(state) || (state === "messy" && !scolded) || aloft;
    if (!happy) happyTilt = 0;
    else if (happyTilt === 0) happyTilt = look.x >= 0 ? 0.14 : -0.14;
    yaw = stepSpring(turn, yawTarget, dt);
    rig.group.rotation.y = yaw;

    // Look target: the pointer when it is active; otherwise a pet taking a lap, the occasional glance at
    // another pet, or a random glance; ahead while walking.
    let tx;
    let ty;
    const pointerActive = pointer.seen && t - pointer.movedAt < 3;
    const lapper = others().find((p) => p.state === "lap");
    const diner = others().find((p) => p.hungry || p.state === "eat");
    if (pointerActive) {
      [tx, ty] = aimAt(r, pointer.x, pointer.y, window.innerWidth * 0.4);
      glance.at = t + 2;
    } else if (walking) {
      tx = 0;
      ty = 0.1;
    } else {
      if (t > glance.at) {
        const candidates = others();
        glance.pet = candidates.length && Math.random() < 0.3 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
        glance.x = rnd(-0.8, 0.8);
        glance.y = rnd(-0.4, 0.5);
        glance.at = t + rnd(1.5, 4);
        glanceTilt = rnd(0, 1) < 0.25 ? rnd(-0.2, 0.2) : 0;
      }
      const watch = lapper || diner || glance.pet;
      if (watch) [tx, ty] = aimAt(r, ...watch.center(), 160);
      else [tx, ty] = [glance.x, glance.y];
    }
    if (sleeping) [tx, ty] = [0, 1];
    if (state === "trick" || state === "eat" || state === "mischief") [tx, ty] = [0, 0]; // straight out at the viewer, or into the bowl
    if (["feed", "serve", "stroke", "wait", "petted", "react"].includes(state) || (state === "messy" && partner))
      [tx, ty] = aimAt(r, ...partner.center(), 160);
    if (hungry && feeder()) [tx, ty] = aimAt(r, ...feeder().center(), 160); // waiting for the feeder
    look.x = approach(look.x, tx, 7, dt);
    look.y = approach(look.y, ty, 7, dt);

    const bliss = state === "petted" && (!perch || perch.up); // being stroked
    tilt = approach(tilt, sleeping ? 0.18 : bliss ? 0.22 * Math.sin(t * 4) : happy ? happyTilt : glanceTilt, 5, dt); // rubbing against the hand
    const liesDown = state === "petted" && (perch ? perch.up : rig.liesWhenPetted);
    const lying = clamp(stepSpring(droop, sleeping || state === "feed" || state === "serve" || liesDown ? 1 : 0, dt), 0, 1); // feeders kneel
    stride = approach(stride, walking ? 1 : 0, 6, dt);
    if (stride > 0.01) gait += Math.PI * 2 * rig.gaitHz * stride * dt;

    // Breathing (slower when asleep), the walk bounce, the hop, and sinking down to lie.
    breathPhase += ((Math.PI * 2) / (3 + lying)) * dt;
    const breath = Math.sin(breathPhase);
    let hop = 0;
    if (hopStart >= 0) {
      const p = (t - hopStart) / 0.5;
      if (p < 1) hop = 7 * Math.sin(p * Math.PI);
      else hopStart = -1;
    }
    const bounce = 0.7 * stride * Math.abs(Math.sin(gait));
    rig.pose.position.y = hop + bounce + 0.25 * breath - rig.lieDrop * lying; // the belly rests on the ground
    rig.pose.scale.y = 1 + 0.012 * breath;
    shadow.scale.set(rig.shadow[0] * (1 - hop / 24), rig.shadow[1] * (1 - hop / 24), 1);
    shadow.material.opacity = 0.28 * (1 - hop / 16);

    // Head: looking straight out of the screen means facing the camera; take the body's own turn off it.
    // While walking it looks where it is going, glancing at the pointer only a little.
    const ahead = (walking && !pointerActive) || state === "eat";
    const wantYaw = ahead ? 0 : clamp(wrap(CAM_YAW + look.x * 0.9 - yaw), -1.2, 1.2) * (walking ? 0.6 : 1);
    headYaw = approach(headYaw, wantYaw, 8, dt);
    headPitch = approach(headPitch, look.y * 0.4 + 0.45 * lying, 8, dt);
    rig.head.outer.rotation.set(headPitch, headYaw, tilt, "YXZ");
    rig.head.outer.position.y = rig.headPivotY - rig.headDrop * lying;

    // Blinking: a quick shut while awake, eyes held shut while asleep, or in bliss when petted.
    if (t > blinkAt) {
      blinkStart = t;
      blinkAt = t + rnd(2, 5);
    }
    let shut = 0;
    if (blinkStart >= 0) {
      const p = (t - blinkStart) / 0.16;
      if (p < 1) shut = Math.sin(p * Math.PI);
      else blinkStart = -1;
    }
    lid = approach(lid, sleeping || bliss ? 0 : 1, 6, dt);
    rig.eyelids.visible = lid * (1 - shut) < 0.5;

    // Ears: perk when happy, droop when asleep or scolded, bounce a little while walking, and the odd twitch.
    if (t > twitchAt) {
      earTwitch[Math.random() < 0.5 ? 0 : 1] = 0.25;
      twitchAt = t + rnd(3, 7);
    }
    rig.ears.forEach((ear, i) => {
      earTwitch[i] *= Math.exp(-10 * dt);
      const outward = 0.45 * lying - (happy ? 0.1 : 0) + (scolded ? 0.6 : 0) + earTwitch[i] + 0.05 * stride * Math.sin(2 * gait);
      ear.outer.rotation.z = (i === 0 ? 1 : -1) * outward;
    });

    const elapsed = t - stateStart;
    const progress = stateUntil > stateStart && stateUntil < Infinity ? clamp(elapsed / (stateUntil - stateStart), 0, 1) : 0;
    if (rig.harness) rig.harness.visible = !!trip?.party.leashed;
    leash = rig.leads && trip?.party.leashed && trip.party.goAt < Infinity ? nearerHand() : -1;
    const stroking = state === "stroke" ? nearerHand() : -1;
    const company = rig.seats?.map((_, i) => pets.some((p) => p.seatedOn(self, i)));
    rig.animate(dt, {
      happy,
      walking,
      lying,
      sleeping,
      stride,
      gait,
      state,
      trick,
      elapsed,
      progress,
      leash,
      stroke: stroking,
      company,
      aloft: aloft ? air : undefined,
    });
    if (aloft) poseHang();
    // The food bubble and the mood ride over the head.
    const [fx, fy] = facePx();
    for (const [over, dx, dy] of [
      [bubble, 13, 58],
      [mood, 15, 62],
    ])
      if (over) {
        over.style.left = `${fx - dx}px`;
        over.style.top = `${fy - dy}px`;
      }
    render();
  }

  const self = {
    el,
    over,
    pet,
    update,
    render,
    place,
    dress,
    // Picked up and let go (pets.js).
    handle,
    grab,
    carry(cx, cy) {
      grip.x = cx;
      grip.y = cy;
    },
    letGo,
    standDown,
    get aloft() {
      return airborne();
    },
    // The face on screen, for other pets to look at.
    center() {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + (r.height / H) * (FOOT_PX - rig.headAt[0] * VOX)];
    },
    // A pointer moving close by wakes a sleeping pet.
    nudge(px, py) {
      if (state !== "sleep") return;
      const r = el.getBoundingClientRect();
      if ((px - (r.left + W / 2)) ** 2 + (py - (r.top + H / 2)) ** 2 < 150 * 150) wake();
    },
    layout() {
      if (state === "lap" && !world.lapOk) endLap();
      if (x === null) x = world.maxX + (world.minX - world.maxX) * spread;
      if (state !== "lap" && !perch) x = clamp(x, world.minX, world.maxX);
      el.style.top = `${world.nearY - lane - FOOT_PX}px`;
      place();
    },
    lane,
    speed: rig.speed,
    leads: !!rig.leads,
    walkable: !!rig.clip,
    homebody: !!rig.homebody,
    mischief: !!rig.mischief,
    feeds: !!rig.feeds,
    eats: !!rig.eats,
    feedGap: rig.feedGap,
    // Walks.
    join,
    go,
    leave,
    handAt: () => screenAt(rig.hands[leash < 0 ? 0 : leash]),
    clipAt: () => screenAt(rig.clip),
    get trip() {
      return trip;
    },
    // Petting.
    petLater: (list) => toPet.push(...list),
    waitFor(by) {
      partner = by;
      setState("wait", 8);
    },
    getPetted,
    // The sofa.
    seats: rig.seats ? rig.seats.length : 0,
    seatAt,
    get sofaReadyAt() {
      return stateStart + 1.3; // the sofa is up and she is sitting
    },
    get sofaOpen() {
      return state === "trick" && trick === "sofa" && now() < stateStart + 0.86 * rig.tricks.sofa; // then the pets hop down
    },
    perchOn,
    seatedOn: (host, i) => !!perch && perch.host === host && perch.seat === i && perch.up,
    // Mischief.
    planMischief,
    foundBy(by) {
      partner = by;
    },
    get found() {
      return !!partner && partner.state !== "idle";
    },
    tidy() {
      if (state === "messy" || state === "mischief") wake();
      partner = null;
    },
    // Meals.
    getHungry,
    makeRoom,
    eat,
    get hungry() {
      return hungry;
    },
    // The pet is eating: pour, then watch.
    serve() {
      if (state === "feed") setState("serve");
    },
    // Where the pet is standing, or will stop.
    get restX() {
      return state === "walk" ? walkTo : state === "lap" ? world.cx : x;
    },
    // How far up the screen the feet are, for drawing nearer pets (lower down) in front.
    get depth() {
      if (state === "held" || state === "fall") return 1e6; // up in front of everything
      if (perch && now() >= perch.at) return perch.host.depth + 0.5 + 0.1 * perch.seat; // on the sofa, in front of it
      return behind ? -Infinity : y - lane;
    },
    get state() {
      return state;
    },
    get x() {
      return x;
    },
    get walkTo() {
      return walkTo;
    },
    get afterWalk() {
      return afterWalk;
    },
  };
  return self;
}
