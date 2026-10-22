/*******************************************************************************
 * Voxel pets that live on the profile photo: they stroll along its bottom edge
 * and take laps around it, passing behind the photo with only their heads
 * showing above its top edge.
 *
 * Each pet is a three.js model (assets/js/pet-models.js) rendered with no
 * anti-aliasing at 1 CSS px per device pixel, so it reads as crisp, lit pixel
 * art with real depth. Pets turn their heads to the pointer (or to each other),
 * blink, wag, show they are happy when hovered, hop with a heart when clicked,
 * nap when left alone, and wear knitted nightcaps in dark mode. They keep out of
 * each other's way, and only one takes a lap at a time while the others watch.
 * A model may walk a lane a little further back, so the pets pass in front of
 * it (it keeps a little to one side of them when it stops), may have idle
 * tricks of its own, and may feed the pets: now and then one pet gets hungry
 * (never two at once) and waits with a food bubble over its head, the others
 * step out of the way, and the feeder comes over and kneels to serve it a bowl.
 * Styles are in _sass/_pets.scss.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { buildCat, buildCollie, buildGirl } from "./pet-models.js";

const MODELS = { collie: buildCollie, cat: buildCat, girl: buildGirl };
const elements = [...document.querySelectorAll(".pet[data-pet]")].filter((el) => MODELS[el.dataset.pet]);
const profile = elements.length ? elements[0].closest(".profile") : null;
const photo = profile && profile.querySelector("#profile-photo");

if (photo) start();

function start() {
  const W = 164; // canvas width in CSS px (the full view is W x W, cropped below the paws)
  const HALF = 45; // half the view height in voxels (room for the nightcap's pompom and the hop)
  const VOX = W / (2 * HALF); // px per voxel
  const GROUND_INSET = 48; // px between the photo's bottom edge and the paws (clears the caption bar)
  const LAP_MARGIN = 24; // px a lap swings out past the photo's sides, so a pet is clear of it when it passes behind
  const FAR_INSET = 16; // px below the photo's top edge for the paws on the far side, so the head and shoulders show above it
  const GAP = 72; // px pets keep between them on the front path
  const LAP_GAP = 40; // px other pets in the lane may be from the way to the start of a lap (or to a meal)
  const CROSS = 44; // px a pet stops to one side of a pet in another lane, so neither hides the other
  const EAT_TIME = 7; // s a meal takes, the first 1.5 s of it pouring
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  /* ---------- shared camera: a three-quarter view from the front right, slightly above ---------- */

  const CAM_YAW = Math.atan2(60, 100); // the camera's azimuth; facing it means rotation.y = CAM_YAW
  const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 400);
  camera.position.set(60, 57, 100);
  camera.lookAt(0, 31, 0);
  camera.updateMatrixWorld();

  // Canvas px of a world point in the full W x W view.
  const toPx = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).project(camera);
    return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * W];
  };
  const FOOT_PX = toPx(0, -0.5, 0)[1];
  // Crop the empty space below the paws, keeping the whole footprint in any facing.
  let lowest = 0;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) lowest = Math.max(lowest, toPx(Math.cos(a) * 21, -0.5, Math.sin(a) * 21)[1]);
  const H = Math.min(W, Math.ceil(lowest + 2));
  camera.setViewOffset(W, W, 0, 0, W, H);

  /* ---------- helpers ---------- */

  const now = () => performance.now() / 1000;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // Critically damped spring (implicit Euler, stable for any dt): eases in and out with no overshoot,
  // for the big whole-body moves where a sudden start would look like a jolt.
  const spring = (value, omega) => ({ x: value, v: 0, omega });
  function stepSpring(s, target, dt) {
    const k = s.omega * s.omega;
    const det = 1 + 2 * s.omega * dt + k * dt * dt;
    const x = ((1 + 2 * s.omega * dt) * s.x + dt * s.v + k * dt * dt * target) / det;
    s.v = (s.v + k * dt * (target - s.x)) / det;
    s.x = x;
    return x;
  }

  /* ---------- the photo: the front path and the lap around it ---------- */

  // A lap is an ellipse on the ground seen from slightly above: its near side runs along the bottom
  // of the photo and its far side behind the photo's top edge.
  const world = { nearY: 0, minX: 0, maxX: 0, cx: 0, rx: 0, ry: 0, lapOk: false };

  function layout() {
    const p = profile.getBoundingClientRect();
    const r = photo.getBoundingClientRect();
    world.nearY = r.bottom - p.top - GROUND_INSET;
    world.minX = r.left - p.left + W / 2 - 14;
    world.maxX = r.right - p.left - W / 2 + 14;
    world.cx = (r.left + r.right) / 2 - p.left;
    world.rx = r.width / 2 + LAP_MARGIN;
    world.ry = (world.nearY - (r.top - p.top + FAR_INSET)) / 2;
    // Laps need room beside the photo, which phones do not have.
    const room = LAP_MARGIN + 30;
    world.lapOk = window.innerWidth >= 576 && r.left - room > 0 && r.right + room < document.documentElement.clientWidth && world.ry > 40;
    pets.forEach((pet) => pet.layout());
  }

  /* ---------- the pointer ---------- */

  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };

  /* ---------- one pet ---------- */

  function makePet(el, rig, spread) {
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
    rig.hat.visible = isDark();

    const canvas = renderer.domElement;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    el.style.height = `${H}px`;
    el.style.transformOrigin = `${W / 2}px ${FOOT_PX}px`; // scale about the paws
    el.setAttribute("aria-label", rig.label);
    el.title = rig.hint;
    el.replaceChildren(canvas);
    const render = () => renderer.render(scene, camera);

    // Placement within .profile, in px.
    const lane = rig.lane || 0; // px further back than the front path
    let x = null; // centre; placed along the path by `spread` (0 the right end, 1 the left) on the first layout
    let y = 0; // how far the paws are raised above the lane (further back is higher)
    let depthScale = 1; // smaller further back
    let behind = false; // drawn behind the photo

    function place() {
      el.style.transform = `translate(${(x - W / 2).toFixed(2)}px, ${y.toFixed(2)}px) scale(${depthScale.toFixed(4)})`;
    }

    // Screen position of the face, as px within the canvas, for looking, hearts and the sleepy "z".
    const facePx = () => toPx(Math.sin(yaw) * rig.headAt[1], rig.headAt[0], Math.cos(yaw) * rig.headAt[1]);

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

    let state = "idle"; // idle | walk | lap | sleep | trick | feed | serve | eat
    let stateStart = 0;
    let stateUntil = 0;
    let walkTo = 0;
    let afterWalk = null; // "lap" or "feed" to start on arrival
    let trick = null; // the name of the trick being done
    let hungry = false;
    let bubble = null; // the food bubble shown while hungry
    let partner = null; // the pet being fed, or the one feeding this pet
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

    function setState(next, duration = 0) {
      state = next;
      stateStart = now();
      stateUntil = stateStart + duration;
      hurried = false;
      el.classList.toggle("sleeping", next === "sleep");
      if (next === "sleep") {
        const [fx, fy] = facePx();
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

    // A full lap starting and ending in the middle of the front path, in a random direction.
    function startLap() {
      lapDir = Math.random() < 0.5 ? 1 : -1;
      lapAngle = Math.PI / 2;
      lapEnd = lapAngle + lapDir * Math.PI * 2;
      setState("lap");
    }

    function endLap() {
      x = world.cx;
      y = 0;
      depthScale = 1;
      behind = false;
      place();
      wake();
    }

    /* ----- sharing the photo with the other pets ----- */

    const others = () => pets.filter((p) => p !== self);
    const sameLane = () => others().filter((p) => p.lane === lane); // the pets this one keeps clear of
    const lapping = (p) => p.state === "lap" || (p.state === "walk" && p.afterWalk === "lap");
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

    // Rolls: a lap 25% of the time, a stroll 15%, a nap 15% (10% for a model with tricks, which does one
    // of its tricks the rest of the time, each as likely); no laps or strolls while a pet is being fed.
    function chooseAction(t) {
      const roll = Math.random();
      const someoneLapping = others().some(lapping);
      const settled = !someoneLapping && !mealTime();
      if (nearOtherLane(x)) {
        const to = strollTarget();
        if (to !== null) return walk(to);
      }
      if (roll < 0.25 && world.lapOk && settled && clear(Math.min(x, world.cx), Math.max(x, world.cx), LAP_GAP)) {
        if (Math.abs(x - world.cx) < 2) startLap();
        else walk(world.cx, "lap");
        return;
      }
      const napsUntil = rig.tricks ? 0.5 : 0.55;
      if (roll < 0.4 && settled) {
        const to = strollTarget();
        if (to !== null) return walk(to);
      } else if (roll < napsUntil && t - pointer.movedAt > 6) {
        return setState("sleep", rnd(10, 20));
      } else if (roll >= napsUntil && rig.tricks && !someoneLapping) {
        const names = Object.keys(rig.tricks);
        trick = names[Math.floor(Math.random() * names.length)];
        yawTarget = nearestTurn(CAM_YAW); // face the viewer to show it off
        return setState("trick", rig.tricks[trick]);
      }
      nextActionAt = t + rnd(5, 9);
    }

    /* ----- hunger and feeding ----- */

    const mealTime = () => pets.some((p) => p.hungry || p.state === "eat");
    const feeder = () => pets.find((p) => p.feeds);

    // Hungry: wait here with a food bubble over the head until the feeder comes, while the others in the
    // lane step away to make room.
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

    // The feeder goes to kneel beside the hungry pet, on the side away from the other pets in its lane
    // when there is room there.
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
      const sleeping = state === "sleep";
      const r = el.getBoundingClientRect();
      const happy = hovering || t < happyUntil || state === "eat";
      if (!happy) happyTilt = 0;
      else if (happyTilt === 0) happyTilt = look.x >= 0 ? 0.14 : -0.14;

      // Stopped right in front of, or behind, a pet in another lane: step aside soon.
      if (state === "idle" && !hungry && !hurried && nearOtherLane(x)) {
        hurried = true;
        nextActionAt = Math.min(nextActionAt, t + rnd(1, 2.5));
      }
      // A feeder goes to a hungry pet as soon as it is free (waking if asleep).
      const hungryPet = rig.feeds && (state === "idle" || sleeping) ? pets.find((p) => p.hungry) : null;
      if (hungryPet) goFeed(hungryPet);
      if (state === "idle" && !hungry && t > nextActionAt && !document.hidden) chooseAction(t);
      if ((state === "sleep" || state === "trick" || state === "eat") && t > stateUntil) wake();
      // A feeder holds the food out for a moment, then serves it and watches the pet eat.
      if (state === "feed" && t > stateUntil) partner.eat(self);
      if (state === "serve" && partner.state !== "eat") wake();
      if (state === "eat" && t > heartAt) {
        heart();
        heartAt = t + 1.4;
      }

      if (state === "walk") {
        const step = Math.sign(walkTo - x);
        x += step * rig.speed * dt;
        if ((step > 0 && x >= walkTo) || (step <= 0 && x <= walkTo)) {
          x = walkTo;
          if (afterWalk === "lap") startLap();
          else if (afterWalk === "feed") {
            yawTarget = nearestTurn(CAM_YAW + Math.sign(partner.x - x) * 0.75); // towards it, still showing the face
            setState("feed", 0.8);
          } else wake();
        }
        place();
      } else if (state === "lap") {
        // Constant speed along the ellipse: advance the angle by distance over the local radius.
        const ds = Math.hypot(world.rx * Math.sin(lapAngle), world.ry * Math.cos(lapAngle));
        lapAngle += (lapDir * (rig.speed + 6) * dt) / Math.max(ds, 1);
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
      const walking = state === "walk" || state === "lap";
      yaw = stepSpring(turn, yawTarget, dt);
      rig.group.rotation.y = yaw;

      // Look target: the pointer when it is active; otherwise a pet taking a lap, the occasional glance
      // at another pet, or a random glance; ahead while walking.
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
      if (state === "trick" || state === "eat") [tx, ty] = [0, 0]; // straight out at the viewer, or into the bowl
      if (state === "feed" || state === "serve") [tx, ty] = aimAt(r, ...partner.center(), 160);
      if (hungry && feeder()) [tx, ty] = aimAt(r, ...feeder().center(), 160); // waiting for the feeder
      look.x = approach(look.x, tx, 7, dt);
      look.y = approach(look.y, ty, 7, dt);

      tilt = approach(tilt, sleeping ? 0.18 : happy ? happyTilt : glanceTilt, 5, dt);
      const lying = clamp(stepSpring(droop, sleeping || state === "feed" || state === "serve" ? 1 : 0, dt), 0, 1); // feeders kneel
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

      // Blinking: a quick shut while awake, eyes held shut while asleep.
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
      lid = approach(lid, sleeping ? 0 : 1, 6, dt);
      rig.eyelids.visible = lid * (1 - shut) < 0.5;

      // Ears: perk when happy, droop when asleep, bounce a little while walking, and the odd twitch.
      if (t > twitchAt) {
        earTwitch[Math.random() < 0.5 ? 0 : 1] = 0.25;
        twitchAt = t + rnd(3, 7);
      }
      rig.ears.forEach((ear, i) => {
        earTwitch[i] *= Math.exp(-10 * dt);
        const outward = 0.45 * lying - (happy ? 0.1 : 0) + earTwitch[i] + 0.05 * stride * Math.sin(2 * gait);
        ear.outer.rotation.z = (i === 0 ? 1 : -1) * outward;
      });

      const elapsed = t - stateStart;
      const progress = stateUntil > stateStart ? clamp(elapsed / (stateUntil - stateStart), 0, 1) : 0;
      rig.animate(dt, { happy, walking, lying, sleeping, stride, gait, state, trick, elapsed, progress });
      if (bubble) {
        const [fx, fy] = facePx();
        bubble.style.left = `${fx - 13}px`;
        bubble.style.top = `${fy - 58}px`;
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
      setHat: (on) => (rig.hat.visible = on),
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
        if (state !== "lap") x = clamp(x, world.minX, world.maxX);
        el.style.top = `${world.nearY - lane - FOOT_PX}px`;
        place();
      },
      lane,
      feeds: !!rig.feeds,
      eats: !!rig.eats,
      feedGap: rig.feedGap,
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

  /* ---------- all pets ---------- */

  // Spread out along the path from the right: the first pet at the right end, the last at the left.
  const pets = elements.map((el, i) => makePet(el, MODELS[el.dataset.pet](), elements.length > 1 ? i / (elements.length - 1) : 0.5)).filter(Boolean);
  if (!pets.length) return;

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
    pointer.mouse = e.pointerType === "mouse";
    pointer.movedAt = now();
    pets.forEach((p) => p.nudge(e.clientX, e.clientY));
  });
  window.addEventListener("click", (e) => {
    const hit = pets.find((p) => p.over(e.clientX, e.clientY));
    if (hit) hit.pet();
  });

  const onScreen = new Map(pets.map((p) => [p.el, true]));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => onScreen.set(e.target, e.isIntersecting)));
  pets.forEach((p) => io.observe(p.el));

  function updateAll(dt) {
    // Only the frontmost pet under a resting mouse is hovered; re-tested every frame, as pets move under it.
    const hovered = pointer.mouse ? pets.find((p) => p.over(pointer.x, pointer.y)) : null;
    document.documentElement.classList.toggle("pet-hover", !!hovered);
    updateHunger(now());
    pets.forEach((p) => onScreen.get(p.el) && p.update(dt, p === hovered));
    // Pets behind the photo go under it (z-index 0, below the photo's 1); the rest stack from back to front.
    [...pets].sort((a, b) => a.depth - b.depth).forEach((p, i) => (p.el.style.zIndex = p.depth === -Infinity ? 0 : 2 + i));
  }

  // Now and then one of the pets that eat gets hungry, if there is someone to feed it; never two at once.
  let hungerAt = now() + rnd(15, 25);
  function updateHunger(t) {
    if (t < hungerAt || !pets.some((p) => p.feeds) || pets.some((p) => p.hungry || p.state === "eat")) return;
    const ready = pets.filter((p) => p.eats && p.state === "idle");
    if (!ready.length) {
      hungerAt = t + 5;
      return;
    }
    ready[Math.floor(Math.random() * ready.length)].getHungry();
    hungerAt = t + rnd(30, 45);
  }

  let last = now();
  function frame() {
    requestAnimationFrame(frame);
    const t = now();
    const dt = Math.min(0.1, t - last);
    last = t;
    if (!document.hidden) updateAll(dt);
  }

  new MutationObserver(() =>
    pets.forEach((p) => {
      p.setHat(isDark());
      p.render();
    })
  ).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  new ResizeObserver(layout).observe(profile);
  photo.addEventListener("load", layout); // the photo switcher swaps images of different heights

  function begin() {
    layout();
    pets.forEach((p) => p.el.classList.add("ready"));
    updateAll(0);
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  if (photo.complete) begin();
  else photo.addEventListener("load", begin, { once: true });
}
