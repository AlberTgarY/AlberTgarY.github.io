/*******************************************************************************
 * The playground page: a cosy home seen from above like a dolls' house, where
 * the girl, the boy, the collie and the cat from the profile photo live their
 * own little lives in voxels with real depth (assets/js/pets/room/room.js).
 * Clicking someone says hi (or wakes them); they look round at the pointer.
 * Clicking the girl's dressing corner, up in the loft, asks what she should
 * wear, and she goes to change into it. Clicking the curtains draws them,
 * clicking the fridge opens it, and clicking a lamp switches it on or off.
 * Styles are in _sass/_playground.scss.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { makeRoom } from "./pets/room/room.js";
import { isDark } from "./pets/stage.js";
import { buildGirl } from "./pets/models/girl.js";
import { LOOKS, dressGirl } from "./pets/models/girl-outfits.js";

const host = document.querySelector(".playground");
if (host) start();

function start() {
  const stage = host.querySelector(".playground-stage");
  let room;
  try {
    room = makeRoom(stage);
  } catch {
    host.classList.add("playground-off"); // no WebGL: the note below the room says so
    return;
  }
  const { view, pointer } = room;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The canvas spans the whole width of the window, out past the page's margins, and the house is fitted
  // into it and into the height of the window.
  function layout() {
    const width = document.documentElement.clientWidth;
    room.layout(width, window.innerHeight * 0.92);
    stage.style.left = `${-host.getBoundingClientRect().left}px`;
    stage.style.width = `${width}px`;
    host.style.height = `${view.H}px`;
    if (reducedMotion) room.step(0);
  }

  const toCanvas = (e) => {
    const r = view.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  let overThing = false; // the mouse over the dressing corner or something to switch
  window.addEventListener("pointermove", (e) => {
    [pointer.x, pointer.y] = toCanvas(e);
    pointer.seen = true;
    pointer.mouse = e.pointerType === "mouse";
    pointer.movedAt = room.home.clock.t;
    overThing = pointer.mouse && e.target === view.canvas && (room.onCloset(pointer.x, pointer.y) || !!room.thingAt(pointer.x, pointer.y));
  });
  // Clicking the dressing corner opens the picker, or closes it again if it is open; clicking someone in
  // front of it says hi instead.
  const closetAt = (x, y) => !room.hit(x, y) && room.onCloset(x, y);
  const picker = outfitPicker(stage, room, (e) => e.target === view.canvas && closetAt(...toCanvas(e)));
  // Clicking someone says hi; the dressing corner asks what she should wear; the curtains, the fridge and
  // the lamps open, shut or switch.
  view.canvas.addEventListener("click", (e) => {
    const [x, y] = toCanvas(e);
    const who = room.hit(x, y);
    if (who) who.cheer();
    else if (room.onCloset(x, y)) picker.toggle(x, y);
    else room.thingAt(x, y)?.toggle();
  });

  let onScreen = true;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting)).observe(host);
  new MutationObserver(() => {
    room.dress(isDark());
    if (reducedMotion) room.step(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", layout);

  room.dress(isDark());
  layout();
  stage.classList.add("ready");
  if (reducedMotion) return room.step(0);

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !onScreen) return;
    const hovered = room.step(dt);
    document.documentElement.classList.toggle("pet-hover", !!hovered || overThing);
  }
  requestAnimationFrame(frame);
}

// The little panel that asks what she should wear: a button for each of her looks, with a picture of her
// in it, the one she has on (or is about to put on) marked. Three show at a time on a strip that the
// arrows either side turn one look along, round and round. It opens out from where it was clicked, with
// her current look in the middle, and fades away again. At night she changes in the morning.
// `toggles(e)` says whether a press outside it is on what toggles it, which then closes it with its click
// rather than the press closing it first.
const PIC = [64, 84]; // CSS px of a look's picture

function outfitPicker(stage, room, toggles) {
  const SHOWN = 3; // looks in view at once (the picker runs before module constants down here are set)
  const panel = document.createElement("div");
  panel.className = "outfit-picker";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Choose what she wears");
  panel.inert = true;
  const title = document.createElement("p");
  title.className = "outfit-picker-title";
  title.textContent = "What should she wear?";
  const row = document.createElement("div");
  row.className = "outfit-picker-looks";
  const buttons = LOOKS.map((look, k) => {
    const b = document.createElement("button");
    b.type = "button";
    const pic = Object.assign(document.createElement("span"), { className: "outfit-picker-pic" });
    b.append(pic, Object.assign(document.createElement("span"), { textContent: look.name }));
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      room.chooseOutfit(k);
      mark();
      closing = setTimeout(close, 140); // a moment to see it picked
    });
    // Tabbing or arrowing onto a look out of view turns the strip to it.
    b.addEventListener("focus", () => reveal(k));
    b.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      const to = (k + step + LOOKS.length) % LOOKS.length;
      buttons[to].focus({ preventScroll: true });
      reveal(to);
    });
    row.append(b);
    return b;
  });
  const strip = Object.assign(document.createElement("div"), { className: "outfit-picker-strip" });
  strip.append(row);
  const arrow = (step, label, text) => {
    const a = Object.assign(document.createElement("button"), { type: "button", className: "outfit-picker-arrow", textContent: text });
    a.setAttribute("aria-label", label);
    a.addEventListener("click", (e) => {
      e.stopPropagation();
      turn(start + step);
    });
    return a;
  };
  const wheel = Object.assign(document.createElement("div"), { className: "outfit-picker-wheel" });
  wheel.append(arrow(-1, "Previous looks", "‹"), strip, arrow(1, "More looks", "›"));
  wheel.classList.toggle("all-shown", LOOKS.length <= SHOWN);
  const note = document.createElement("p");
  note.className = "outfit-picker-note";
  note.textContent = "It's night: she'll change in the morning.";
  panel.append(title, wheel, note);
  stage.append(panel);

  // The first look in view; turning past either end comes round to the other.
  let start = 0;
  const stops = Math.max(1, LOOKS.length - SHOWN + 1);
  function turn(to) {
    start = (to + stops) % stops;
    row.style.setProperty("--start", start);
  }
  const reveal = (k) => (k < start || k >= start + SHOWN) && turn(k < start ? k : k - SHOWN + 1);

  let pictured = false;
  let closing = 0;
  function picture() {
    if (pictured) return;
    pictured = true;
    lookPictures(...PIC)?.forEach((src, k) => {
      const img = Object.assign(new Image(), { src, alt: "", width: PIC[0], height: PIC[1] });
      buttons[k].firstChild.append(img);
    });
  }
  function mark() {
    const { current, into, want } = room.home.outfit;
    buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === (want ?? into ?? current))));
  }
  function close() {
    panel.classList.remove("open");
    panel.inert = true;
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", onKey);
  }
  const outside = (e) => !panel.contains(e.target) && !toggles(e) && close();
  const onKey = (e) => e.key === "Escape" && close();
  return {
    // Open by canvas px (x, y), kept inside the stage, growing out of that point; or close if open.
    toggle(x, y) {
      if (panel.classList.contains("open")) return close();
      clearTimeout(closing);
      picture();
      mark();
      note.hidden = !room.home.night;
      // Her current look in the middle, already in place as it opens; the looks in view come in one after
      // another.
      const on = buttons.findIndex((b) => b.getAttribute("aria-pressed") === "true");
      row.style.transition = "none";
      turn(Math.max(0, Math.min(on - 1, stops - 1)));
      buttons.forEach((b, k) => b.style.setProperty("--k", Math.max(0, k - start)));
      const w = panel.offsetWidth;
      row.style.transition = "";
      const h = panel.offsetHeight;
      const left = Math.max(8, Math.min(x - w / 2, room.view.W - w - 8));
      const top = Math.max(8, Math.min(y + 16, room.view.H - h - 8));
      Object.assign(panel.style, { left: `${left}px`, top: `${top}px`, transformOrigin: `${x - left}px ${y - top}px` });
      panel.inert = false;
      panel.classList.add("open");
      buttons[on].focus({ preventScroll: true });
      setTimeout(() => {
        document.addEventListener("pointerdown", outside, true);
        document.addEventListener("keydown", onKey);
      });
    },
  };
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
