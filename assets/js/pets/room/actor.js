/*******************************************************************************
 * Someone in the playground's room: one of the voxel models (pets/models/) at a
 * place on the floor, or up on the furniture, and how it is brought to life
 * every frame: it turns, looks about (at the pointer, at the others, at what it
 * is doing), blinks, breathes, walks with a gait, sits, lies down or sleeps
 * (a person lies back in bed), bows to play (a pet), hops with a heart when
 * clicked, and shows what it wants or feels over its head.
 *
 * What it is doing comes from its activity (life.js), which sets the fields
 * below; this file only turns them into a pose. As on the profile page (pet.js),
 * a model faces +z with its feet on y = -0.5, in voxels.
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { VOX, clamp, approach, rnd, pick, wrap, spring, stepSpring } from "../stage.js";
import { smoothstep } from "../models/voxels.js";
import { VIEW_YAW } from "./view.js";

const FACE_AWAY = 0.8; // how far a person's face turns from the viewer at most, while turned towards the room
const BOW = 0.3; // how far a pet tips forward in a play bow

// A play bow: the body tipped forward about the paws by `angle`, chest down and rump up; each leg turned
// back to upright and stretched or shortened to keep its paw on the floor, and the head raised again.
function playBow(rig, angle) {
  rig.pose.rotation.x += angle;
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  rig.legs.forEach((leg) => {
    const { y, z } = leg.outer.position; // the hip
    leg.outer.rotation.x -= angle;
    leg.outer.scale.y *= (y * c - z * s) / y;
  });
  rig.head.outer.rotation.x -= 0.8 * angle;
}

// `kind` is "human" or "pet"; `home` holds the room's shared things (room.js): the view, the overlay for
// what shows over heads, the clock, the pointer and everyone else. `size` scales the model.
export function makeActor(name, rig, kind, home, size = 1) {
  const { view, overlay, clock, pointer } = home;
  const group = rig.group;
  group.scale.setScalar(size);
  home.scene.add(group);

  // Contact shadow, on whatever it stands on.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.4;
  group.add(shadow);

  const a = {
    name,
    rig,
    human: kind === "human",
    speed: rig.speed / VOX, // the model's walking speed, in voxels a second
    x: 0,
    z: 0,
    y: 0, // how high it stands (on a seat, a bed or the cat tree)
    // What it is doing, set by its activity: the state and trick passed to the model (with `since` and
    // `until` for how far in it is), and how it holds itself.
    state: "idle",
    trick: null,
    since: 0,
    until: 0,
    walking: false,
    pace: 1, // walking speed as a multiple of its own
    seated: false, // a person sitting on a seat
    lie: false, // a pet lying down, or a person kneeling
    abed: false, // a person lying in bed
    phones: false, // the boy's headphones on his head
    sit: false, // a pet sitting up
    bow: false, // a pet in a play bow, ready to play
    asleep: false,
    happy: false,
    look: null, // someone (an actor) or a point [x, y, z] to look at
    hold: null, // a person's arms taken over: [right, left] arrays (chibi.js), or a function of (t, elapsed) giving them
    talk: false,
    nod: 0, // extra head nod, e.g. sniffing
    leads: false, // a person holding the leads
    harnessed: false, // a pet on a lead
    company: null, // for a person on the sofa, whether each neighbouring seat has a pet on it
    partner: null,
    // Its activity (life.js).
    job: null,
    jobName: "",
    calm: false, // in a part of its activity that may be cut short
    interrupt: false, // asked to wrap up
    pending: null, // the next activity, when invited
    event: null, // what it is doing with others
    nextAt: 0,
    out: false, // out on a walk
    hungry: false,
  };

  a.setState = (state, secs = 0, trick = null) => {
    a.state = state;
    a.trick = trick;
    a.since = clock.t;
    a.until = clock.t + secs;
  };

  /* ----- turning ----- */

  const turn = spring(0, 6);
  let yawTarget = 0;
  a.face = (target) => (yawTarget = turn.x + wrap(target - turn.x)); // the short way round
  a.faceTowards = (x, z) => a.face(Math.atan2(x - a.x, z - a.z));
  a.turned = () => Math.abs(yawTarget - turn.x) < 0.12;
  a.snap = (yaw) => {
    turn.x = yawTarget = yaw;
    turn.v = 0;
  };
  Object.defineProperty(a, "yaw", { get: () => turn.x });
  // How high it is above the floor beneath it (on a seat, a bed or the cat tree).
  a.above = () => a.y - home.house.floorY(a.x, a.z);

  /* ----- where it is on screen ----- */

  const v = new THREE.Vector3();
  // The world point of its face, as last drawn.
  a.facePoint = () => {
    rig.head.outer.getWorldPosition(v);
    return [v.x, v.y + (rig.headAt[0] - rig.headPivotY) * size, v.z];
  };
  // Canvas px over its head, for what it says or feels.
  a.overHead = () => {
    const [x, y, z] = a.facePoint();
    return view.project(x, y + 14, z);
  };
  // Whether canvas px (px, py) is over it: an ellipse round its body, as on the profile page.
  a.over = (px, py) => {
    if (!group.visible) return false;
    const k = view.pxPerUnit(a.x, a.y, a.z) * size;
    const [cx, cy] = view.project(...(a.abed ? a.facePoint() : [a.x, a.y + rig.hit[0] * size, a.z]));
    const dx = (px - cx) / (rig.hit[1] * k);
    const dy = (py - cy) / (rig.hit[2] * k);
    return dx * dx + dy * dy < 1;
  };

  /* ----- what shows over its head ----- */

  // Channels, each showing one thing at a time: "want" (a bubble with the food it wants), "mood" (cross or
  // dizzy), "z" (asleep, or purring) and "say" (a speech bubble).
  const badges = {};
  const OFFSETS = { want: [13, 22], mood: [15, 26], z: [-14, 20], say: [-30, 26] };
  a.show = (channel, className) => {
    const el = badges[channel];
    if (el && el.className === className) return;
    el?.remove();
    delete badges[channel];
    if (!className) return;
    const span = document.createElement("span");
    span.className = className;
    overlay.appendChild(span);
    badges[channel] = span;
  };
  function placeBadges() {
    const channels = Object.keys(badges);
    if (!channels.length) return;
    const [hx, hy] = a.overHead();
    channels.forEach((c) => {
      badges[c].style.left = `${(hx - OFFSETS[c][0]).toFixed(1)}px`;
      badges[c].style.top = `${(hy - OFFSETS[c][1]).toFixed(1)}px`;
    });
  }
  // A heart pops up over its head, or a little icon when something comes to mind.
  a.pop = (className = "pet-heart") => {
    const [hx, hy] = a.overHead();
    const el = document.createElement("span");
    el.className = className;
    el.style.left = `${(hx - 10).toFixed(1)}px`;
    el.style.top = `${(hy - 22).toFixed(1)}px`;
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  };

  /* ----- being clicked ----- */

  let happyUntil = -1;
  let hopStart = -1;
  let happyTilt = 0;
  // Clicked: a hop and a heart, and happy for a moment; a sleeper wakes up instead.
  a.cheer = () => {
    if (a.asleep) {
      a.interrupt = true;
      return;
    }
    hopStart = clock.t;
    happyUntil = clock.t + 1.8;
    happyTilt = Math.random() < 0.5 ? -0.16 : 0.16;
    a.pop();
  };
  a.beHappy = (secs) => (happyUntil = Math.max(happyUntil, clock.t + secs));
  a.hop = () => (hopStart = clock.t);

  /* ----- bringing it to life, every frame ----- */

  const gaze = { yaw: 0, y: 0 }; // where it looks: a world heading, and up (-1) or down (1)
  const glance = { yaw: 0, y: 0, at: 0, who: null, tilt: 0 };
  let headYaw = 0;
  let headPitch = 0;
  let tilt = 0;
  const droop = spring(0, 3.5); // 0 standing, 1 lying (or kneeling)
  let inBed = 0; // 0 up, 1 lying back in bed
  let night = false;
  let sitting = 0;
  let bowing = 0;
  let stride = 0;
  let gait = 0;
  let breathPhase = Math.random() * 6;
  let lid = 1;
  let blinkAt = rnd(1, 3);
  let blinkStart = -1;
  const earTwitch = [0, 0];
  let twitchAt = rnd(3, 6);
  let holdW = 0;
  const armW = [0, 0]; // each arm's share in the hold (an arm left free has none)
  const holdArms = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  let hand = 1;
  // The hand on the side turned towards the viewer (it only changes once the other side clearly is).
  function nearerHand() {
    const towards = Math.sin(VIEW_YAW - turn.x);
    if (Math.abs(towards) > 0.3) hand = towards > 0 ? 1 : 0;
    return hand;
  }

  a.leadHand = () => rig.hands[hand]; // where the leads are held

  // A heading and a tilt to look at a world point from the face.
  function aimAt([tx, ty, tz]) {
    const [fx, fy, fz] = a.facePoint();
    const dist = Math.hypot(tx - fx, tz - fz);
    return [Math.atan2(tx - fx, tz - fz), clamp((fy - ty) / Math.max(30, dist), -1, 1)];
  }

  a.update = (dt, hovered) => {
    const t = clock.t;
    group.position.set(a.x, a.y, a.z);
    const yaw = stepSpring(turn, yawTarget, dt);
    group.rotation.y = yaw;
    const walking = a.walking;
    const sleeping = a.asleep;
    const scolded = a.state === "messy" && a.partner?.state === "react";
    const happy = hovered || t < happyUntil || a.happy || ["eat", "wait", "petted"].includes(a.state) || (a.state === "messy" && !scolded);
    if (!happy) happyTilt = 0;
    else if (happyTilt === 0) happyTilt = Math.random() < 0.5 ? 0.14 : -0.14;

    // Where to look: what it is doing, or else the pointer when it moves, or a glance at someone or about.
    let target = null; // [heading, up/down]
    if (a.look) target = aimAt(Array.isArray(a.look) ? a.look : a.look.facePoint());
    else if (pointer.seen && t - pointer.movedAt < 3) {
      const [fx, fy] = view.project(...a.facePoint());
      const reach = view.W * 0.3;
      target = [VIEW_YAW + 0.9 * clamp((pointer.x - fx) / reach, -1, 1), clamp((pointer.y - fy) / reach, -1, 1)];
      glance.at = t + 2;
    } else if (!walking) {
      if (t > glance.at) {
        const others = home.actors.filter((o) => o !== a && !o.out);
        glance.who = others.length && Math.random() < 0.35 ? pick(others) : null;
        glance.yaw = VIEW_YAW + rnd(-0.7, 0.7);
        glance.y = rnd(-0.4, 0.4);
        glance.at = t + rnd(1.5, 4);
        glance.tilt = Math.random() < 0.25 ? rnd(-0.2, 0.2) : 0;
      }
      target = glance.who ? aimAt(glance.who.facePoint()) : [glance.yaw, glance.y];
    }
    if (sleeping) target = [yaw, a.seated ? 0.2 : a.abed ? 0 : 1]; // dozing sitting up, the head only nods a little
    // A person turned towards the room keeps the face turned towards the viewer, looking aside with it only
    // so far (the TV over to one side, say).
    if (target && a.human && Math.abs(wrap(yaw - VIEW_YAW)) < Math.PI / 2)
      target[0] = VIEW_YAW + clamp(wrap(target[0] - VIEW_YAW), -FACE_AWAY, FACE_AWAY);
    const ahead = walking && !a.look;
    if (target) {
      gaze.yaw += wrap(target[0] - gaze.yaw) * (1 - Math.exp(-7 * dt));
      gaze.y = approach(gaze.y, target[1], 7, dt);
    }

    const bliss = a.state === "petted" && !walking; // being stroked
    tilt = approach(tilt, sleeping ? 0.18 : bliss ? 0.22 * Math.sin(t * 4) : happy ? happyTilt : glance.tilt, 5, dt);
    const lieDown =
      (sleeping && !a.seated && !a.abed) || a.lie || a.state === "feed" || a.state === "serve" || (a.state === "petted" && !!rig.liesWhenPetted);
    const lying = clamp(stepSpring(droop, lieDown ? 1 : 0, dt), 0, 1);
    sitting = approach(sitting, a.sit && !lieDown ? 1 : 0, 5, dt);
    bowing = approach(bowing, a.bow && !lieDown && !a.sit && !walking ? 1 : 0, 7, dt);
    stride = approach(stride, walking ? 1 : 0, 6, dt);
    if (stride > 0.01) gait += Math.PI * 2 * rig.gaitHz * stride * dt * Math.max(1, a.pace * 0.8);

    // Breathing (slower when asleep), the walk bounce, a hop, and sinking down to lie.
    breathPhase += ((Math.PI * 2) / (3 + lying + (sleeping ? 1 : 0))) * dt;
    const breath = Math.sin(breathPhase);
    let hop = 0;
    if (hopStart >= 0) {
      const p = (t - hopStart) / 0.5;
      if (p < 1) hop = 7 * Math.sin(p * Math.PI);
      else hopStart = -1;
    }
    const bounce = 0.7 * stride * Math.abs(Math.sin(gait));
    rig.pose.position.y = hop + bounce + 0.25 * breath - rig.lieDrop * lying;
    rig.pose.scale.y = 1 + 0.012 * breath;
    inBed = approach(inBed, a.abed ? 1 : 0, 5, dt);
    shadow.visible = inBed < 0.05;
    shadow.scale.set(rig.shadow[0] * (1 - hop / 24), rig.shadow[1] * (1 - hop / 24), 1);
    shadow.material.opacity = 0.26 * (1 - hop / 16);

    // The head turns towards where it looks (as far as a neck goes; sitting, not so far as to hide the
    // face), only a little while walking, and droops when it dozes off sitting up.
    const neck = a.seated ? 0.7 : 1.2;
    const wantYaw = ahead ? 0 : clamp(wrap(gaze.yaw - yaw), -neck, neck) * (walking ? 0.6 : 1);
    headYaw = approach(headYaw, wantYaw, 8, dt);
    headPitch = approach(headPitch, gaze.y * 0.4 + 0.45 * lying + (sleeping && a.seated ? 0.2 : 0) + a.nod, 8, dt);
    rig.head.outer.rotation.set(headPitch, headYaw, tilt, "YXZ");
    rig.head.outer.position.y = rig.headPivotY - rig.headDrop * lying;

    // Blinking, and eyes shut asleep or in bliss.
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

    // Ears perk when happy, droop asleep or told off, bounce a little walking, and twitch now and then.
    if (t > twitchAt) {
      earTwitch[Math.random() < 0.5 ? 0 : 1] = 0.25;
      twitchAt = t + rnd(3, 7);
    }
    rig.ears.forEach((ear, i) => {
      earTwitch[i] *= Math.exp(-10 * dt);
      const outward = 0.45 * lying - (happy ? 0.1 : 0) + (scolded || a.cowed ? 0.6 : 0) + earTwitch[i] + 0.05 * stride * Math.sin(2 * gait);
      ear.outer.rotation.z = (i === 0 ? 1 : -1) * outward;
    });

    // A person's arms taken over for what they are doing, easing in and out.
    holdW = approach(holdW, a.hold ? 1 : 0, 6, dt);
    const arms = a.hold ? (typeof a.hold === "function" ? a.hold(t, t - a.since) : a.hold) : [null, null];
    holdArms.forEach((arm, i) => {
      const target = arms[i];
      armW[i] = approach(armW[i], target ? 1 : 0, 6, dt);
      if (target) arm.forEach((_, j) => (arm[j] = armW[i] < 0.02 ? target[j] : approach(arm[j], target[j], 12, dt)));
    });

    const elapsed = t - a.since;
    const progress = a.until > a.since ? clamp(elapsed / (a.until - a.since), 0, 1) : 0;
    if (rig.harness) rig.harness.visible = a.harnessed;
    rig.animate(dt, {
      happy,
      walking,
      lying,
      sleeping: a.human ? false : sleeping, // a person's sleep is a doze on a seat, not the pop-up bed
      stride,
      gait,
      state: a.state,
      trick: a.trick,
      elapsed,
      progress,
      leash: a.leads ? nearerHand() : -1,
      stroke: a.state === "stroke" ? nearerHand() : -1,
      company: a.company,
      seated: a.seated,
      sit: sitting,
      hold: holdW > 0.01 ? { w: holdW, mix: armW, arms: holdArms } : null,
      talk: a.talk,
      phones: a.phones,
    });
    if (rig.legs && bowing > 0.01) playBow(rig, BOW * bowing);
    // In bed, a person lies back from the feet, the head towards the pillow; the nightcap comes off.
    if (a.human) rig.pose.rotation.x = (-Math.PI / 2) * smoothstep(0, 1, inBed);
    rig.hat.visible = night && inBed < 0.05 && !a.phones;
    a.show("z", sleeping ? "room-z" : a.state === "petted" && rig.purrs ? "room-z room-note" : null);
    placeBadges();
  };

  a.dress = (isNight) => {
    night = isNight;
    rig.hat.visible = night;
    rig.nightwear?.(night);
  };
  return a;
}
