/*******************************************************************************
 * Voxel pets that live on the profile photo: they stroll along its bottom edge
 * and take laps around it, passing behind the photo with only their heads
 * showing above its top edge; a girl feeds them, walks them, pets them and
 * sits with them on her sofa, and the cat makes a mess while she is out.
 *
 * Each pet is a three.js model rendered with no anti-aliasing at 1 CSS px per
 * device pixel, so it reads as crisp, lit pixel art with real depth.
 *   pets/stage.js        the shared camera, the paths round the photo, distances and timings
 *   pets/pet.js          one pet: what it does and how it moves
 *   pets/together.js     what they do together: walks, the sofa, hunger, mischief
 *   pets/choose.js       choosing what to do next so it seldom repeats
 *   pets/models/         the voxel models
 * Styles are in _sass/_pets.scss.
 ******************************************************************************/

import { measure, now, isDark } from "./pets/stage.js";
import { makePet } from "./pets/pet.js";
import { together as makeTogether } from "./pets/together.js";
import { buildCollie } from "./pets/models/collie.js";
import { buildCat } from "./pets/models/cat.js";
import { buildGirl } from "./pets/models/girl.js";

const MODELS = { collie: buildCollie, cat: buildCat, girl: buildGirl };
const elements = [...document.querySelectorAll(".pet[data-pet]")].filter((el) => MODELS[el.dataset.pet]);
const profile = elements.length ? elements[0].closest(".profile") : null;
const photo = profile && profile.querySelector("#profile-photo");

if (photo) start();

function start() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, seen: false, mouse: false, movedAt: -Infinity };
  const pets = [];
  const together = makeTogether(pets, profile);
  // Spread out along the path from the right: the first pet at the right end, the last at the left.
  elements.forEach((el, i) => {
    const pet = makePet(el, MODELS[el.dataset.pet](), elements.length > 1 ? i / (elements.length - 1) : 0.5, { pets, pointer, together });
    if (pet) pets.push(pet);
  });
  if (!pets.length) return;

  function layout() {
    measure(profile, photo);
    pets.forEach((pet) => pet.layout());
  }

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
    together.updateHunger(now());
    together.updateParty(now());
    pets.forEach((p) => onScreen.get(p.el) && p.update(dt, p === hovered));
    // Pets behind the photo go under it (z-index 0, below the photo's 1); the rest stack from back to front.
    [...pets].sort((a, b) => a.depth - b.depth).forEach((p, i) => (p.el.style.zIndex = p.depth === -Infinity ? 0 : 2 + i));
    together.drawLeads();
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
      p.dress(isDark());
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
