/*******************************************************************************
 * Someone coming into the flower shop's street or leaving it, off the front
 * edge of the pavement (comeIn, goOff): they fade in or out as they walk (the
 * staff coming in of a morning and off home at night, the customers). While
 * they fade, each of their meshes is drawn with a see-through copy of its
 * material (their own copies, made once), and their contact shadow fades with
 * them (actor.js `fade`); all the way in, their own materials go back.
 ******************************************************************************/

// `a` faded in `k` of the way (0 gone, 1 all there).
export function setFade(a, k) {
  k = Math.min(1, Math.max(0, k));
  if (k === a.fade && (k < 1 || !a.faded)) return;
  a.fade = k;
  a.faded = k < 1;
  const copies = (a.fadeCopies ??= new Map());
  const seeThrough = (m) => {
    let c = copies.get(m);
    if (!c) copies.set(m, (c = Object.assign(m.clone(), { transparent: true })));
    c.opacity = m.opacity * k;
    return c;
  };
  a.rig.group.traverse((o) => {
    if (!o.isMesh || o.userData.contact) return;
    const own = (o.userData.ownMaterial ??= o.material);
    o.material = k >= 1 ? own : Array.isArray(own) ? own.map(seeThrough) : seeThrough(own);
  });
  a.rig.group.visible = k > 0;
}

// In from the street at x: walking up from beyond the pavement's front edge (z `from`) to `to`, fading in.
export function* comeIn(a, [x, from, to], clock) {
  Object.assign(a, { x, z: from, y: 0 });
  a.snap(Math.PI);
  setFade(a, 0);
  a.walking = true;
  while (a.z > to) {
    a.z = Math.max(to, a.z - a.speed * clock.dt);
    setFade(a, (from - a.z) / (from - to));
    yield;
  }
  a.walking = false;
  setFade(a, 1);
}

// Off along the street: on from where they are (at the pavement's front edge) to z `to`, fading out.
export function* goOff(a, to, clock) {
  a.face(0);
  a.walking = true;
  const z0 = a.z;
  while (a.z < to) {
    a.z = Math.min(to, a.z + a.speed * clock.dt);
    setFade(a, 1 - (a.z - z0) / (to - z0));
    yield;
  }
  a.walking = false;
  setFade(a, 0);
}
