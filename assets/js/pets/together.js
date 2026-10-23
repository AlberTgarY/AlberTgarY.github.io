/*******************************************************************************
 * What the pets do together: walks round the photo (and the leads), visits to
 * the girl's sofa, getting hungry, and the cat's mischief while the girl is out.
 * `pets` is the shared list of all of them (assets/js/pets/pet.js).
 ******************************************************************************/

import { world, now, rnd, pick, clamp, LEAD_GAP, PET_GAP, TAG_GAP } from "./stage.js";

export function together(pets, profile) {
  // Free to join in: idle or dozing, and not hungry.
  const free = (p) => (p.state === "idle" || p.state === "sleep") && !p.hungry;

  /* ---------- walks: laps taken together ---------- */

  // A pet's lap is usually (70%) a walk: the girl takes it round the photo on a lead, ahead of her, and half
  // the time the other pet too, further ahead. When she takes a lap herself, half the time a pet tags along
  // behind her, off the lead, but never a homebody (the cat), who only ever goes out on a lead. The party
  // lines up on the front path, sets off together at the slowest one's pace, and stops together where it
  // started.
  let party = null;

  function formParty(starter) {
    const walker = pets.find((p) => p.leads);
    const pals = pets.filter((p) => p.walkable && p !== starter && free(p));
    let line; // [pet, px ahead of the walker]
    if (starter === walker) {
      const taggers = pals.filter((p) => !p.homebody);
      if (!taggers.length || Math.random() >= 0.5) return false;
      line = [
        [walker, 0],
        [pick(taggers), -TAG_GAP],
      ];
    } else {
      if (!walker || !starter.walkable || !free(walker) || Math.random() >= 0.7) return false;
      line = [
        [walker, 0],
        [starter, LEAD_GAP],
      ];
      if (pals.length && Math.random() < 0.5) line.push([pick(pals), LEAD_GAP + PET_GAP]);
    }
    const aheads = line.map(([, ahead]) => ahead);
    party = {
      members: line.map(([p]) => p),
      dir: Math.random() < 0.5 ? 1 : -1,
      leashed: starter !== walker,
      pace: Math.min(...line.map(([p]) => p.speed)) + 6,
      front: Math.max(...aheads),
      back: Math.min(...aheads),
      formedAt: now(),
      goAt: Infinity,
    };
    // The one in front lines up in the middle of the path, the rest behind it; anyone else steps aside.
    line.forEach(([p, ahead]) => p.join(party, ahead, world.cx + party.dir * (party.front - ahead)));
    pets.filter((p) => !party.members.includes(p)).forEach((p) => p.makeRoom(world.cx));
    return true;
  }

  // Once all are lined up, a moment to clip on the leads, then off they go; a party that never lines up
  // (someone was held up) breaks up. Back home, the girl pets the pets that went with her.
  function updateParty(t) {
    if (!party) return;
    const { members } = party;
    if (party.goAt === Infinity) {
      if (members.every((p) => p.state === "ready")) party.goAt = t + 0.8;
      else if (t - party.formedAt > 25) members.forEach((p) => p.trip && p.leave());
    } else if (t > party.goAt && !party.going) {
      party.going = true;
      members.forEach((p) => p.go());
    }
    if (members.every((p) => !p.trip)) {
      const walker = members.find((p) => p.leads);
      if (walker) walker.petLater(members.filter((p) => p !== walker)); // well done
      party = null;
    }
  }

  // Leads from the girl's hand to each pet she walks, sagging when slack, drawn just above the further of
  // the two (so behind the photo with it).
  const leads = new Map();
  function lead(p) {
    if (!leads.has(p)) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", `pet-lead pet-lead-${p.el.dataset.pet}`);
      svg.append(document.createElementNS("http://www.w3.org/2000/svg", "path"));
      profile.append(svg);
      leads.set(p, svg);
    }
    return leads.get(p);
  }

  function drawLeads() {
    const walker = party && party.leashed && party.goAt < Infinity && party.members.find((p) => p.leads);
    const walked = walker && walker.trip ? party.members.filter((p) => p !== walker && p.trip) : [];
    leads.forEach((svg, p) => (svg.style.display = walked.includes(p) ? "" : "none"));
    if (!walked.length) return;
    const o = profile.getBoundingClientRect();
    const [hx, hy] = walker.handAt();
    walked.forEach((p) => {
      const [cx, cy] = p.clipAt();
      const length = p.trip.ahead + 18;
      const sag = clamp(0.6 * Math.sqrt(Math.max(0, length * length - (cx - hx) ** 2 - (cy - hy) ** 2)), 3, 24);
      const svg = lead(p);
      svg.style.display = "";
      svg.style.zIndex = Math.min(Number(walker.el.style.zIndex), Number(p.el.style.zIndex));
      const at = (x, y) => `${(x - o.left).toFixed(1)} ${(y - o.top).toFixed(1)}`;
      svg.firstChild.setAttribute("d", `M${at(hx, hy)} Q${at((hx + cx) / 2, (hy + cy) / 2 + sag)} ${at(cx, cy)}`);
    });
  }

  /* ---------- the girl out, and the cat at home ---------- */

  // The girl is off round the photo, alone or walking the dog.
  const girlOut = () => pets.some((p) => p.leads && (p.state === "lap" || p.trip?.party.going));

  // As she sets off, a cat left at home plans some mischief.
  function setOff() {
    pets.filter((p) => p.mischief && !p.trip).forEach((p) => p.planMischief());
  }

  /* ---------- the sofa ---------- */

  // The pets join the girl on her sofa: each free one goes to its seat beside her, the first (the collie)
  // on the roomier right.
  function inviteToSofa(host) {
    const walkable = pets.filter((p) => p.walkable);
    walkable.filter(free).forEach((p) => p.perchOn(host, walkable.indexOf(p) === 0 ? host.seats - 1 : 0));
  }

  /* ---------- hunger ---------- */

  // Now and then one of the pets that eat gets hungry, if there is someone to feed it; never two at once.
  let hungerAt = now() + rnd(80, 150);
  function updateHunger(t) {
    if (t < hungerAt || !pets.some((p) => p.feeds) || pets.some((p) => p.hungry || p.state === "eat")) return;
    const ready = pets.filter((p) => p.eats && p.state === "idle");
    if (!ready.length) {
      hungerAt = t + 5;
      return;
    }
    pick(ready).getHungry();
    hungerAt = t + rnd(180, 240);
  }

  return { free, formParty, updateParty, drawLeads, girlOut, setOff, inviteToSofa, updateHunger };
}
