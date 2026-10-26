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
 * Styles are in _sass/_playground.scss.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { buildingRoom } from "./pets/room/room.js";
import { isDark } from "./pets/stage.js";
import { buildGirl } from "./pets/models/girl.js";
import { LOOKS, dressGirl } from "./pets/models/girl-outfits.js";
import { CLIP_SHOWS, DRAMAS, drawClipThumb, drawPoster, POSTER } from "./pets/room/screens.js";

// A quarter turn to the left, round an arrow (the button turning the view). (Above start(): it runs before
// the constants below it are set.)
const TURN_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 6.5A5 5 0 1 1 4 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M1.5 3.5 3.6 7 7 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const host = document.querySelector(".playground");
if (host) start();

// Until the next frame has been painted. (A declaration: start() runs before any constant down here is set.)
function painted() {
  return new Promise((done) => requestAnimationFrame(() => setTimeout(done)));
}

async function start() {
  const stage = host.querySelector(".playground-stage");
  // The home is built a part at a time, the loading bar (playground.md) moving on after each, and only shown
  // once it is all there, its shaders ready and its first frame drawn.
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
      loading.show(0.45 + 0.4 * value);
      await painted();
    }
  } catch (err) {
    host.classList.add("playground-off"); // no WebGL: the note below the room says so
    console.error(err);
    return;
  }
  const { view, pointer } = room;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    if (reducedMotion) room.step(0);
  });
  host.append(turner);

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
  let overThing = false; // the mouse over the dressing corner, his computer or something to switch
  let onCanvas = false;
  let moved = false; // since what is under the mouse was last looked at (once a frame: frame() below)
  window.addEventListener("pointermove", (e) => {
    [pointer.x, pointer.y] = toCanvas(e);
    pointer.seen = true;
    pointer.mouse = e.pointerType === "mouse";
    pointer.movedAt = room.home.clock.t;
    onCanvas = pointer.mouse && e.target === view.canvas;
    moved = true;
  });
  function underMouse() {
    moved = false;
    overThing = onCanvas && (room.onCloset(pointer.x, pointer.y) || room.onPc(pointer.x, pointer.y) || !!room.thingAt(pointer.x, pointer.y));
    pointer.onDoor = onCanvas && room.onDoor(pointer.x, pointer.y); // (fading the back wall while it is there)
  }
  document.documentElement.addEventListener("pointerleave", () => {
    onCanvas = false;
    moved = true;
  });
  let touched = false; // the last press a finger or a pen's
  view.canvas.addEventListener("pointerdown", (e) => (touched = e.pointerType !== "mouse"));
  // Clicking the dressing corner or his computer opens the picker for it, or closes it again if it is open;
  // clicking someone in front of them says hi instead.
  const pickerAt = (x, y) => !room.hit(x, y) && (room.onCloset(x, y) || room.onPc(x, y));
  const choices = picker(stage, view, (e) => e.target === view.canvas && pickerAt(...toCanvas(e)));
  // Clicking someone says hi (him, he changes his clothes too; her in the hammock, she gets up); the dressing corner asks what she should
  // wear, his computer what she should watch; the curtains, the fridge, the lamps, the TV and its remote
  // open, shut or switch.
  // A tap on the front door (with no pointer to rest on it) fades the back wall for a few seconds.
  view.canvas.addEventListener("click", (e) => {
    const [x, y] = toCanvas(e);
    const who = room.hit(x, y);
    const thing = !who && room.thingAt(x, y);
    if (who && who.name === "boy") room.changeBoy();
    else if (who) room.greet(who);
    else if (room.onCloset(x, y)) choices.toggle(x, y, outfitPage(room));
    else if (room.onPc(x, y)) choices.toggle(x, y, watchPage(room));
    else if (thing) thing.toggle();
    else if (touched && !reducedMotion && room.onDoor(x, y)) room.peekFor(5); // (it fades, frame by frame)
  });

  // Zooming in to see it close up, drawn afresh at the screen's own resolution (view.js): two fingers pinch
  // it bigger or smaller and move it about; once zoomed in, one finger (or the mouse) drags it about, where
  // otherwise a finger scrolls the page as anywhere; a trackpad's pinch (a wheel with ctrl held) zooms too.
  // Pinched right out, it is the whole view again. A press that drags or pinches is no click.
  const presses = new Map(); // pointer id -> where it is, canvas px
  let travel = 0; // how far the press has moved
  let dragged = false;
  const zoomedNow = () => {
    view.canvas.style.touchAction = view.zoomed() ? "none" : "pan-y";
    moved = true; // (what is under the mouse may have changed)
    if (reducedMotion) room.step(0);
  };
  view.canvas.style.touchAction = "pan-y";
  view.canvas.addEventListener("pointerdown", (e) => {
    view.canvas.setPointerCapture(e.pointerId); // (let go off the canvas, it still ends here)
    presses.set(e.pointerId, toCanvas(e));
    if (presses.size === 1) [travel, dragged] = [0, false];
  });
  view.canvas.addEventListener("pointermove", (e) => {
    if (!presses.has(e.pointerId)) return;
    const before = [...presses.values()];
    presses.set(e.pointerId, toCanvas(e));
    const now = [...presses.values()];
    const mid = ([p, q]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const apart = ([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (now.length >= 2) {
      const [m0, m1] = [mid(before), mid(now)];
      view.panBy(m1[0] - m0[0], m1[1] - m0[1]);
      if (apart(before) > 0) view.zoomAt(apart(now) / apart(before), ...m1);
      dragged = true;
    } else if (view.zoomed()) {
      const [[x0, y0], [x1, y1]] = [before[0], now[0]];
      view.panBy(x1 - x0, y1 - y0);
      travel += Math.hypot(x1 - x0, y1 - y0);
      dragged ||= travel > 8;
    } else return;
    zoomedNow();
  });
  for (const type of ["pointerup", "pointercancel"]) view.canvas.addEventListener(type, (e) => presses.delete(e.pointerId));
  window.addEventListener(
    "click",
    (e) => {
      if (dragged && e.target === view.canvas) e.stopPropagation();
      dragged = false;
    },
    true
  );
  view.canvas.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return; // (a wheel scrolls the page)
      e.preventDefault();
      view.zoomAt(Math.exp(-e.deltaY * 0.01), ...toCanvas(e));
      zoomedNow();
    },
    { passive: false }
  );

  let onScreen = true;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting)).observe(host);
  new MutationObserver(() => {
    room.dress(isDark());
    if (reducedMotion) room.step(0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", layout);

  room.dress(isDark());
  layout();
  loading.show(0.9); // built; the shaders next
  await painted();
  await room.warm();
  room.step(0);
  loading.show(1);
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
    const hovered = room.step(dt);
    document.documentElement.classList.toggle("pet-hover", !!hovered || overThing);
    if (between > 100) return; // (back from a hidden tab, or a hitch)
    pace.frames++;
    pace.between += between;
    pace.busy += performance.now() - now;
    if (pace.frames < 180) return;
    if (pace.between / pace.frames > 22 && pace.busy < 0.6 * pace.between) view.lower();
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
let lookPics = null; // drawn the first time they are wanted

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
