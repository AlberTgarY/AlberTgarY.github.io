/*******************************************************************************
 * The playground page: a cosy home seen from above like a dolls' house, where
 * the girl, the boy, the collie and the cat from the profile photo live their
 * own little lives in voxels with real depth (assets/js/pets/room/room.js).
 * Clicking someone says hi (or wakes them); they look round at the pointer.
 * Clicking the girl's dressing corner, up in the loft, asks what she should
 * wear, and she goes to change into it; clicking his computer asks what she
 * should watch (a drama, and which episode) or play, and she goes to put it
 * on. Clicking the curtains draws them,
 * clicking the fridge opens it, clicking a lamp switches it on or off, clicking
 * the TV switches it on or off, and clicking the remote on the coffee table
 * turns to another channel (whoever is watching notices).
 * The button in the corner turns the view a quarter round to the front garden
 * out of the front door, where they go for their walks, and back; without
 * turning, the pointer on the front door (or a tap on it) fades the back wall
 * to see out.
 * The clock in the top left corner has beside it the times of day to skip to
 * (six in the morning, ten, two, six, ten at night).
 * The two buttons under the clock go between the home and her flower shop
 * (assets/js/pets/shop/shop.js, built with the home behind the loading bar),
 * the one fading into the other; the one out of view goes on meanwhile, at
 * the same time of day, its people at whatever they are doing, only not drawn
 * (a fraction of a millisecond a frame). In the shop, clicking a
 * bucket of flowers asks her for a bouquet of them, and the radio, the till,
 * the lights, the sign, the chime, the cool room, the tap and the tree do what
 * they do.
 * Styles are in _sass/_playground.scss.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { buildingRoom } from "./pets/room/room.js";
import { buildingShop } from "./pets/shop/shop.js";
import { isDark } from "./pets/stage.js";
import { buildGirl } from "./pets/models/girl.js";
import { LOOKS, dressGirl } from "./pets/models/girl-outfits.js";
import { CLIP_SHOWS, DRAMAS, drawClipThumb, drawPoster, POSTER } from "./pets/room/screens.js";
import { hhmm } from "./pets/room/daytime.js";

// A quarter turn to the left, round an arrow (the button turning the view). (Above start(): it runs before
// the constants below it are set.)
const TURN_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 6.5A5 5 0 1 1 4 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M1.5 3.5 3.6 7 7 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// A sun and a moon (the clock's button: by day and by night).
const SUN_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const MOON_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10.8 2.2a6 6 0 1 0 3 8.6A5 5 0 0 1 10.8 2.2Z" fill="currentColor"/></svg>';
// The sun coming up over the horizon, and going down; the sun behind a cloud (the afternoon): with the sun
// and the moon, the times of day to skip to.
const SUNRISE_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1.5 13h13M4.5 13a3.5 3.5 0 0 1 7 0M2.9 9.6l1.2.7M13.1 9.6l-1.2.7M8 6.6V2.4M6.3 4.1 8 2.4l1.7 1.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SUNSET_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1.5 13h13M4.5 13a3.5 3.5 0 0 1 7 0M2.9 9.6l1.2.7M13.1 9.6l-1.2.7M8 2.4v4.2M6.3 4.9 8 6.6l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const AFTERNOON_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="6" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 1.2v1M1.2 6h1M2.6 2.6l.7.7M9.4 2.6l-.7.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M5.6 14h6.2a2.6 2.6 0 0 0 .2-5.2 3.4 3.4 0 0 0-6.4.5 2.4 2.4 0 0 0 0 4.7Z" fill="currentColor"/></svg>';
const TIMES = [
  [6, "6 am", SUNRISE_ICON, "early morning"],
  [10, "10 am", SUN_ICON, "ten in the morning"],
  [14, "2 pm", AFTERNOON_ICON, "the afternoon"],
  [18, "6 pm", SUNSET_ICON, "the evening"],
  [22, "10 pm", MOON_ICON, "ten at night"],
];
// A house, and a tulip (the buttons between the home and the flower shop).
const HOME_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2.5 7.5 8 3l5.5 4.5M4 6.5v6.5h3v-3.5h2V13h3V6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SHOP_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 9.5c-2.3 0-3.6-1.6-3.6-4V2.8L6 4.2 8 2.3l2 1.9 1.6-1.4v2.7c0 2.4-1.3 4-3.6 4Z" fill="currentColor"/><path d="M8 9.5V14M8 12.5c-1.8 0-3-1-3.4-2.4M8 12c1.6 0 2.7-.8 3.1-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const SWITCH_SECS = 0.9; // from the one world to the other
const SLICE_MS = 30; // of building between the loading bar's updates, about

const host = document.querySelector(".playground");
if (host) start();

// Until the next frame has been painted. (A declaration: start() runs before any constant down here is set.)
function painted() {
  return new Promise((done) => requestAnimationFrame(() => setTimeout(done)));
}

async function start() {
  const stage = host.querySelector(".playground-stage");
  // The home and then the flower shop are built a part at a time, the loading bar (playground.md) moving on
  // and naming what is being built, and only shown once both are all there, their shaders ready and their
  // first frames drawn (going over to the shop never waits).
  const loading = host.querySelector(".playground-loading");
  let room;
  try {
    const steps = buildingRoom(stage);
    for (;;) {
      const { done, value } = steps.next();
      if (done) {
        room = value;
        break;
      }
      loading.show(0.25 + 0.3 * value[0], value[1], value[2]);
      await painted();
    }
  } catch (err) {
    host.classList.add("playground-off"); // no WebGL: the note below the room says so
    console.error(err);
    return;
  }
  const { view } = room;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The world in view: the home, or her flower shop (built the first time it is asked for, into a layer
  // over the home's). Going from one to the other, `fade` runs from 0 (the home) to 1 (the shop): the one
  // fades out, a little smaller, as the other fades in, settling from a little larger; both move on
  // meanwhile, and only the one in view after.
  let world = room;
  let shop = null;
  const shopLayer = Object.assign(document.createElement("div"), { className: "playground-shop" });
  stage.append(shopLayer);
  const homeLayer = [view.canvas, stage.querySelector(".playground-overlay")];
  const fade = { k: 0, goal: 0 };
  const inShop = () => world === shop;
  function showFade() {
    const e = fade.k * fade.k * (3 - 2 * fade.k);
    const set = (el, shown, scale) => {
      el.style.opacity = shown < 1 ? shown.toFixed(3) : "";
      el.style.transform = scale !== 1 ? `scale(${scale.toFixed(4)})` : "";
      el.style.visibility = shown > 0 ? (el === shopLayer ? "visible" : "") : "hidden"; // (the home's as the stage is)
    };
    homeLayer.forEach((el) => set(el, 1 - e, 1 - 0.03 * e));
    set(shopLayer, e, 1 + 0.04 * (1 - e));
  }
  showFade();

  // Turning round to the front garden, and back.
  const turner = Object.assign(document.createElement("button"), { type: "button", className: "playground-turn" });
  let out = false;
  function label() {
    turner.setAttribute("aria-pressed", String(out));
    turner.setAttribute("aria-label", out ? "Turn back to the house" : "Turn round to the front garden");
    turner.innerHTML = `${TURN_ICON}<span>${out ? "Back inside" : "Out the front"}</span>`;
  }
  label();
  turner.addEventListener("click", () => {
    out = !out;
    room.turn(out, reducedMotion);
    label();
    if (out) markFloor(false); // (turning round, up to the house's floor first)
    if (reducedMotion) room.step(0);
  });
  host.append(turner);

  // Up and down between the floors, as on a map of a building: the house's (1F) and the basement under it
  // (B1), the one in view marked, and on each a dot for everyone on that floor just now.
  const floors = Object.assign(document.createElement("div"), { className: "playground-floors", role: "group" });
  floors.setAttribute("aria-label", "Floors");
  const floorButtons = [
    ["1F", "The house", false],
    ["B1", "The basement", true],
  ].map(([text, name, below]) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "playground-floor" });
    b.innerHTML = `<span>${text}</span><span class="playground-floor-who" aria-hidden="true"></span>`;
    b.setAttribute("aria-label", name);
    b.addEventListener("click", () => {
      if (out) {
        out = false; // (only the house's floor turns round: back to it first)
        label();
      }
      room.floor(below, reducedMotion);
      markFloor(below);
      if (reducedMotion) room.step(0);
    });
    floors.append(b);
    return b;
  });
  function markFloor(below) {
    floorButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === (below ? 1 : 0))));
  }
  markFloor(false);
  host.append(floors);
  // Who is on which floor (a dot each, in their colours), looked at now and then.
  const DOTS = { girl: "#f2a3b8", boy: "#6f95d6", collie: "#3a3a40", cat: "#d9893a" };
  let whoWas = "";
  function showWho() {
    const { below, up } = room.whoIsWhere();
    const now = `${up}|${below}`;
    if (now === whoWas) return;
    whoWas = now;
    [up, below].forEach((names, i) => {
      floorButtons[i].querySelector(".playground-floor-who").innerHTML = names.map((n) => `<i style="background:${DOTS[n]}"></i>`).join("");
    });
  }
  showWho();

  // The time of day, top left, in a pill: the clock (the time in the world in view), and the times to skip to,
  // the part of the day it is in filled in: early morning, ten (the shop opening up), the afternoon, the
  // evening, ten at night (the shop closing up).
  const times = Object.assign(document.createElement("div"), { className: "playground-times", role: "group" });
  times.setAttribute("aria-label", "Time of day");
  const clock = Object.assign(document.createElement("span"), { className: "playground-clock" });
  const timeButtons = TIMES.map(([hour, text, icon, said]) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "playground-time" });
    b.innerHTML = `${icon}<span>${text}</span>`;
    b.setAttribute("aria-label", `Skip to ${said}`);
    b.addEventListener("click", () => {
      room.timeTo(hour); // (both: the one out of view goes on at the same time)
      shop?.timeTo(hour);
      showTime();
      if (reducedMotion) world.step(0);
    });
    return b;
  });
  times.append(clock, ...timeButtons);
  let clockWas = "";
  function showTime() {
    const h = world.hour();
    const now = hhmm(h);
    if (now === clockWas) return;
    clockWas = now;
    clock.textContent = now;
    const part = TIMES.findLastIndex(([from]) => h >= from); // (before six: the night before still)
    timeButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === (part < 0 ? TIMES.length - 1 : part))));
  }
  host.append(times);

  // Between the home and the flower shop, under the clock: the one in view pressed.
  const worlds = Object.assign(document.createElement("div"), { className: "playground-worlds", role: "group" });
  worlds.setAttribute("aria-label", "Where to look");
  const worldButtons = [
    [HOME_ICON, "Home", false],
    [SHOP_ICON, "Flower shop", true],
  ].map(([icon, text, toShop]) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "playground-world" });
    b.innerHTML = `${icon}<span>${text}</span>`;
    b.addEventListener("click", () => go(toShop));
    worlds.append(b);
    return b;
  });
  function markWorld() {
    worldButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === (fade.goal ? 1 : 0))));
    host.classList.toggle("in-shop", !!fade.goal);
  }
  markWorld();
  host.append(worlds);
  // To the shop (`toShop`) or back home: the one fades into the other (at the same time of day already: its
  // light and shadows brought up to date for it).
  function go(toShop) {
    if (!shop || (toShop ? 1 : 0) === fade.goal) return;
    const [from, to] = toShop ? [room, shop] : [shop, room];
    to.timeTo(from.hour());
    from.pointer.mouse = false; // (nobody hovered there while it is out of view)
    fade.goal = toShop ? 1 : 0;
    world = to;
    clockWas = "";
    showTime();
    markWorld();
    choices.close();
    if (reducedMotion) {
      fade.k = fade.goal;
      showFade();
      world.step(0);
    }
  }
  // The shop built (behind the loading bar, a slice of parts between its updates), its shaders and shadows
  // made ready and a first frame drawn, out of sight.
  async function buildShop() {
    const steps = buildingShop(shopLayer);
    for (let step; ; await painted()) {
      const t0 = performance.now();
      do step = steps.next();
      while (!step.done && performance.now() - t0 < SLICE_MS);
      if (step.done) {
        shop = step.value;
        break;
      }
      const [k, what, part] = step.value;
      loading.show(0.62 + 0.28 * k, what, part);
    }
    shop.layout(view.W, view.H);
    wire(shop);
    await shop.warm((part) => loading.show(0.9 + 0.1 * part, "Flower shop · shaders", part));
    shop.timeTo(room.hour());
    shop.step(0);
  }

  // The canvas spans the whole width of the window, out past the page's margins, and the house is fitted
  // into it and into the height of the window.
  function layout() {
    const width = document.documentElement.clientWidth;
    room.layout(width, window.innerHeight * 0.92);
    shop?.layout(view.W, view.H); // (the shop in a canvas the size of the home's)
    stage.style.left = `${-host.getBoundingClientRect().left}px`;
    stage.style.width = `${width}px`;
    host.style.height = `${view.H}px`;
    if (reducedMotion) world.step(0);
  }

  const toCanvas = (e) => {
    const r = world.view.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  let overThing = false; // the mouse over the dressing corner, his computer or something to switch
  let onCanvas = false;
  let moved = false; // since what is under the mouse was last looked at (once a frame: frame() below)
  window.addEventListener("pointermove", (e) => {
    const { pointer } = world;
    [pointer.x, pointer.y] = toCanvas(e);
    pointer.seen = true;
    pointer.mouse = e.pointerType === "mouse";
    pointer.movedAt = world.home.clock.t;
    onCanvas = pointer.mouse && e.target === world.view.canvas;
    moved = true;
  });
  function underMouse() {
    moved = false;
    const { pointer } = world;
    if (inShop()) {
      overThing = onCanvas && !!shop.thingAt(pointer.x, pointer.y);
      return;
    }
    overThing = onCanvas && (room.onCloset(pointer.x, pointer.y) || room.onPc(pointer.x, pointer.y) || !!room.thingAt(pointer.x, pointer.y));
    pointer.onDoor = onCanvas && room.onDoor(pointer.x, pointer.y); // (fading the back wall while it is there)
  }
  document.documentElement.addEventListener("pointerleave", () => {
    onCanvas = false;
    moved = true;
  });
  let touched = false; // the last press a finger or a pen's
  // Clicking the dressing corner or his computer opens the picker for it, or closes it again if it is open;
  // clicking someone in front of them says hi instead.
  const pickerAt = (x, y) => !room.hit(x, y) && (room.onCloset(x, y) || room.onPc(x, y));
  const choices = picker(stage, view, (e) => e.target === view.canvas && pickerAt(...toCanvas(e)));
  // Clicking someone says hi (him, he changes his clothes too; her in the hammock, she gets up); the dressing corner asks what she should
  // wear, his computer what she should watch; the curtains, the fridge, the lamps, the TV and its remote
  // open, shut or switch.
  // A tap on the front door (with no pointer to rest on it) fades the back wall for a few seconds.
  function clickHome(x, y) {
    const who = room.hit(x, y);
    const thing = !who && room.thingAt(x, y);
    if (who && who.name === "boy") room.changeBoy();
    else if (who) room.greet(who);
    else if (room.onCloset(x, y)) choices.toggle(x, y, outfitPage(room));
    else if (room.onPc(x, y)) choices.toggle(x, y, watchPage(room));
    else if (thing) thing.toggle();
    else if (touched && !reducedMotion && room.onDoor(x, y)) room.peekFor(5); // (it fades, frame by frame)
  }
  // In the shop: someone says hi; a thing does what it does (a bucket: she makes up a bouquet of it).
  function clickShop(x, y) {
    const who = shop.hit(x, y);
    const thing = !who && shop.thingAt(x, y);
    if (who) shop.greet(who);
    else if (thing) shop.click(thing);
  }

  // Zooming in to see it close up, drawn afresh at the screen's own resolution (view.js): two fingers pinch
  // it bigger or smaller and move it about; once zoomed in, one finger (or the mouse) drags it about, where
  // otherwise a finger scrolls the page as anywhere; a trackpad's pinch (a wheel with ctrl held) zooms too.
  // Pinched right out, it is the whole view again. A press that drags or pinches is no click.
  const presses = new Map(); // pointer id -> where it is, canvas px
  let travel = 0; // how far the press has moved
  let dragged = false;
  const zoomedNow = (w) => {
    w.view.canvas.style.touchAction = w.view.zoomed() ? "none" : "pan-y";
    moved = true; // (what is under the mouse may have changed)
    if (reducedMotion) w.step(0);
  };
  // The clicks and the pinching on world `w`'s canvas (the home's, and the shop's once it is built).
  function wire(w) {
    const { canvas } = w.view;
    const live = () => w === world && fade.k === fade.goal; // (not while fading from one to the other)
    canvas.addEventListener("pointerdown", (e) => (touched = e.pointerType !== "mouse"));
    canvas.addEventListener("click", (e) => {
      if (live()) (w === room ? clickHome : clickShop)(...toCanvas(e));
    });
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId); // (let go off the canvas, it still ends here)
      presses.set(e.pointerId, toCanvas(e));
      if (presses.size === 1) [travel, dragged] = [0, false];
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!presses.has(e.pointerId) || !live()) return;
      const before = [...presses.values()];
      presses.set(e.pointerId, toCanvas(e));
      const now = [...presses.values()];
      const mid = ([p, q]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const apart = ([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (now.length >= 2) {
        const [m0, m1] = [mid(before), mid(now)];
        w.view.panBy(m1[0] - m0[0], m1[1] - m0[1]);
        if (apart(before) > 0) w.view.zoomAt(apart(now) / apart(before), ...m1);
        dragged = true;
      } else if (w.view.zoomed()) {
        const [[x0, y0], [x1, y1]] = [before[0], now[0]];
        w.view.panBy(x1 - x0, y1 - y0);
        travel += Math.hypot(x1 - x0, y1 - y0);
        dragged ||= travel > 8;
      } else return;
      zoomedNow(w);
    });
    for (const type of ["pointerup", "pointercancel"]) canvas.addEventListener(type, (e) => presses.delete(e.pointerId));
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!e.ctrlKey || !live()) return; // (a wheel scrolls the page)
        e.preventDefault();
        w.view.zoomAt(Math.exp(-e.deltaY * 0.01), ...toCanvas(e));
        zoomedNow(w);
      },
      { passive: false }
    );
  }
  wire(room);
  window.addEventListener(
    "click",
    (e) => {
      if (dragged && e.target === world.view.canvas) e.stopPropagation();
      dragged = false;
    },
    true
  );

  let onScreen = true;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting)).observe(host);
  new MutationObserver(() => {
    [room, shop].forEach((w) => w?.dress(isDark()));
    if (reducedMotion) world.step(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", layout);

  room.dress(isDark());
  showTime();
  layout();
  loading.show(0.55, "Home · shaders", 0); // built; the shaders next
  await painted();
  await room.warm();
  room.step(0);
  loading.show(0.62, "Home · shaders", 1);
  lookPics = lookPictures(...PIC) || []; // (her looks' pictures for the picker now: drawn at its first opening, they held it up)
  await painted();
  await buildShop();
  await painted();
  stage.classList.add("ready");
  host.classList.add("loaded");
  if (reducedMotion) return;

  // About 60 frames a second at most: on a faster screen (120 Hz, say), every other one. A device that
  // cannot keep up (under about 45 a second over 3 s, while the page's own work takes well under the time
  // between frames: the drawing holds it up, a phone's GPU say) draws fewer pixels (view.js lower()).
  let last = performance.now();
  const pace = { frames: 0, between: 0, busy: 0 };
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 11) return;
    const between = now - last;
    const dt = Math.min(0.1, between / 1000);
    last = now;
    if (document.hidden || !onScreen) return;
    if (moved) underMouse();
    // From the one world to the other: the one going stays as it was last drawn, fading, while the one
    // coming moves on; only ever the one drawn a frame. The other goes on unseen, at the time in view.
    if (fade.k !== fade.goal) {
      fade.k = fade.goal ? Math.min(1, fade.k + dt / SWITCH_SECS) : Math.max(0, fade.k - dt / SWITCH_SECS);
      showFade();
    }
    const hovered = world.step(dt);
    if (shop) (inShop() ? room : shop).step(dt, false, world.hour());
    document.documentElement.classList.toggle("pet-hover", !!hovered || overThing);
    if (Math.floor(now / 500) !== Math.floor((now - between) / 500)) {
      showWho(); // (twice a second)
      showTime();
    }
    if (between > 100) return; // (back from a hidden tab, or a hitch)
    pace.frames++;
    pace.between += between;
    pace.busy += performance.now() - now;
    if (pace.frames < 180) return;
    if (pace.between / pace.frames > 22 && pace.busy < 0.6 * pace.between) world.view.lower();
    Object.assign(pace, { frames: 0, between: 0, busy: 0 });
  }
  requestAnimationFrame(frame);
}

// A little panel of choices, opened by clicking something in the room: a button for each choice, with a
// picture in it, the one in force marked. Three show at a time on a strip that the arrows either side turn one
// along, round and round. It opens out from where it was clicked, with the marked choice in the middle, the
// choices in view coming in one after another, and fades away again. A choice can lead on to a page of
// further choices (a drama's episodes), with a way back. `toggles(e)` says whether a press outside it is on
// what toggles it, which then closes it with its click rather than the press closing it first.
function picker(stage, view, toggles) {
  const SHOWN = 3; // choices in view at once (the picker runs before module constants down here are set)
  const panel = document.createElement("div");
  panel.className = "room-picker";
  panel.setAttribute("role", "dialog");
  panel.inert = true;
  const back = Object.assign(document.createElement("button"), { type: "button", className: "room-picker-back", textContent: "‹" });
  back.setAttribute("aria-label", "Back");
  back.addEventListener("click", (e) => {
    e.stopPropagation();
    buttons[show(page.back)].focus({ preventScroll: true });
  });
  const title = Object.assign(document.createElement("p"), { className: "room-picker-title" });
  const head = Object.assign(document.createElement("div"), { className: "room-picker-head" });
  head.append(back, title);
  const row = Object.assign(document.createElement("div"), { className: "room-picker-choices" });
  const strip = Object.assign(document.createElement("div"), { className: "room-picker-strip" });
  strip.append(row);
  const arrow = (step, label, text) => {
    const a = Object.assign(document.createElement("button"), { type: "button", className: "room-picker-arrow", textContent: text });
    a.setAttribute("aria-label", label);
    a.addEventListener("click", (e) => {
      e.stopPropagation();
      turn(start + step);
    });
    return a;
  };
  const wheel = Object.assign(document.createElement("div"), { className: "room-picker-wheel" });
  wheel.append(arrow(-1, "Previous", "‹"), strip, arrow(1, "More", "›"));
  const note = Object.assign(document.createElement("p"), { className: "room-picker-note" });
  panel.append(head, wheel, note);
  stage.append(panel);

  // The first choice in view; turning past either end comes round to the other.
  let page = null;
  let buttons = [];
  let start = 0;
  let stops = 1;
  function turn(to) {
    start = (to + stops) % stops;
    row.style.setProperty("--start", start);
  }
  const reveal = (k) => (k < start || k >= start + SHOWN) && turn(k < start ? k : k - SHOWN + 1);
  const mark = () => buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === page.marked())));

  // Shows page `p`: { key, label, title, note (or null), pic ([w, h] CSS px), choices ([{ name, sub, pic }],
  // pic() making the picture), marked() (the choice in force, or -1), pick(k) (a page to go on to, or nothing
  // once chosen), back (the page before, if any) }. The marked choice is in the middle, already in place, and
  // the choices in view come in one after another. Returns the marked choice (or 0).
  function show(p) {
    page = p;
    panel.setAttribute("aria-label", p.label);
    title.textContent = p.title;
    back.hidden = !p.back;
    note.textContent = p.note || "";
    note.hidden = !p.note;
    panel.style.setProperty("--pic-w", `${p.pic[0]}px`);
    panel.style.setProperty("--pic-h", `${p.pic[1]}px`);
    buttons = p.choices.map((c, k) => {
      const b = Object.assign(document.createElement("button"), { type: "button" });
      const pic = Object.assign(document.createElement("span"), { className: "room-picker-pic" });
      pic.append(c.pic());
      b.append(pic, Object.assign(document.createElement("span"), { textContent: c.name }));
      if (c.sub) b.append(Object.assign(document.createElement("span"), { className: "room-picker-sub", textContent: c.sub }));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const next = page.pick(k);
        if (next) return buttons[show(next)].focus({ preventScroll: true });
        mark();
        closing = setTimeout(close, 140); // a moment to see it picked
      });
      // Tabbing or arrowing onto a choice out of view turns the strip to it.
      b.addEventListener("focus", () => reveal(k));
      b.addEventListener("keydown", (e) => {
        const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
        if (!step) return;
        const to = (k + step + buttons.length) % buttons.length;
        buttons[to].focus({ preventScroll: true });
        reveal(to);
      });
      return b;
    });
    row.replaceChildren(...buttons);
    stops = Math.max(1, buttons.length - SHOWN + 1);
    wheel.classList.toggle("all-shown", buttons.length <= SHOWN);
    mark();
    const on = Math.max(0, p.marked());
    panel.classList.add("refill");
    row.style.transition = "none";
    turn(Math.max(0, Math.min(on - 1, stops - 1)));
    buttons.forEach((b, k) => b.style.setProperty("--k", Math.max(0, k - start)));
    void panel.offsetWidth; // in place, and hidden, before they come in
    row.style.transition = "";
    panel.classList.remove("refill");
    return on;
  }

  let closing = 0;
  function close() {
    panel.classList.remove("open");
    panel.inert = true;
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", onKey);
  }
  const outside = (e) => !panel.contains(e.target) && !toggles(e) && close();
  const onKey = (e) => e.key === "Escape" && close();
  return {
    // Closed, if open (going over to the flower shop).
    close: () => panel.classList.contains("open") && close(),
    // Open on page `p` by canvas px (x, y), kept inside the stage, growing out of that point; or close if it is
    // open on that already (open on the other thing, it moves over to this one).
    toggle(x, y, p) {
      const open = panel.classList.contains("open");
      if (open && p.key === page.key) return close();
      clearTimeout(closing);
      const on = show(p);
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const left = Math.max(8, Math.min(x - w / 2, view.W - w - 8));
      const top = Math.max(8, Math.min(y + 16, view.H - h - 8));
      Object.assign(panel.style, { left: `${left}px`, top: `${top}px`, transformOrigin: `${x - left}px ${y - top}px` });
      panel.inert = false;
      panel.classList.add("open");
      buttons[on].focus({ preventScroll: true });
      if (open) return;
      setTimeout(() => {
        document.addEventListener("pointerdown", outside, true);
        document.addEventListener("keydown", onKey);
      });
    },
  };
}

// What she should wear: each of her looks, with a picture of her in it, the one she has on (or is about to
// put on) marked. At night she changes in the morning.
const PIC = [64, 84]; // CSS px of a look's picture
let lookPics = null; // drawn as the page loads (start())

function outfitPage(room) {
  return {
    key: "outfit",
    label: "Choose what she wears",
    title: "What should she wear?",
    note: room.home.night ? "It's night: she'll change in the morning." : null,
    pic: PIC,
    choices: LOOKS.map((look, k) => ({
      name: look.name,
      pic: () => {
        lookPics ??= lookPictures(...PIC) || [];
        return lookPics[k]
          ? Object.assign(new Image(), { src: lookPics[k], alt: "", width: PIC[0], height: PIC[1] })
          : document.createElement("span");
      },
    })),
    marked: () => {
      const { current, into, want } = room.home.outfit;
      return want ?? into ?? current;
    },
    pick: (k) => void room.chooseOutfit(k),
  };
}

// What she should watch on his computer: one of her dramas (a frame of it for its picture) and then which
// episode, if it has more than one, or a day of her farm game (its poster: screens.js), what she has on (or is
// about to put on) marked. The note says when she will not go at once: at night (she watches it in the
// morning), or while he is on his computer.
const POSTER_PIC = POSTER.map((px) => px * 2); // CSS px, 2 a pixel
const SERIES = Object.keys(DRAMAS);

function thumb(show) {
  const canvas = Object.assign(document.createElement("canvas"), { width: 168, height: 96 });
  drawClipThumb(canvas, show);
  return canvas;
}

function farmPoster() {
  const canvas = Object.assign(document.createElement("canvas"), { width: POSTER[0], height: POSTER[1] });
  drawPoster(canvas.getContext("2d"));
  return canvas;
}

function watchPage(room) {
  const { watch } = room.home;
  const marked = () => watch.want ?? watch.on;
  const note = room.watchNote();
  const episodes = (drama) => {
    const { title, episodes } = DRAMAS[drama];
    return {
      key: "watch",
      label: `Choose an episode of ${title}`,
      title,
      note,
      pic: POSTER_PIC,
      back: shows,
      choices: episodes.map((show) => ({ name: CLIP_SHOWS[show].ep, pic: () => thumb(show) })),
      marked: () => (marked()?.show === drama ? marked().ep : -1),
      pick: (k) => void room.chooseShow({ show: drama, ep: k }),
    };
  };
  const shows = {
    key: "watch",
    label: "Choose what she watches",
    title: "What should she watch?",
    note,
    pic: POSTER_PIC,
    choices: [
      ...SERIES.map((drama) => ({ name: DRAMAS[drama].title, pic: () => thumb(DRAMAS[drama].episodes[0]) })),
      { name: "Stardew Valley", pic: farmPoster },
    ],
    marked: () => {
      const m = marked();
      return !m ? -1 : m.show === "stardew" ? SERIES.length : SERIES.indexOf(m.show);
    },
    pick: (k) =>
      k === SERIES.length
        ? void room.chooseShow({ show: "stardew", ep: null })
        : DRAMAS[SERIES[k]].episodes.length > 1
          ? episodes(SERIES[k])
          : void room.chooseShow({ show: SERIES[k], ep: 0 }),
  };
  return shows;
}

// Pictures of her in each of her looks, standing three-quarters on and lit as in the room, drawn once
// (crisp, a few device px a voxel) to `w` x `h` CSS px images; null without WebGL.
function lookPictures(w, h) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: true });
  } catch {
    return null;
  }
  renderer.setSize(Math.round(w * ratio), Math.round(h * ratio), false);
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-60, 120, 160);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948a, 2.2), sun);
  const rig = buildGirl();
  const wardrobe = dressGirl(rig);
  rig.hat.visible = false; // no nightcap by day
  rig.group.rotation.y = 0.45;
  rig.animate(0, {
    happy: false,
    walking: false,
    lying: 0,
    sleeping: false,
    stride: 0,
    gait: 0,
    state: "idle",
    elapsed: 0,
    progress: 0,
    leash: -1,
    stroke: -1,
    seated: false,
    hold: null,
    talk: false,
  });
  scene.add(rig.group);
  // From a little above, framing her from her feet to the top of the straw hat.
  const [bottom, top] = [-1.5, 48];
  const half = ((top - bottom) * w) / h / 2;
  const camera = new THREE.OrthographicCamera(-half, half, (top - bottom) / 2, -(top - bottom) / 2, 1, 400);
  const mid = new THREE.Vector3(0, (top + bottom) / 2, 0);
  camera.position.copy(mid).add(new THREE.Vector3(0, Math.sin(0.2), Math.cos(0.2)).multiplyScalar(200));
  camera.lookAt(mid);
  const pictures = LOOKS.map((_, k) => {
    wardrobe.wear(k);
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL();
  });
  renderer.dispose();
  renderer.forceContextLoss();
  return pictures;
}
