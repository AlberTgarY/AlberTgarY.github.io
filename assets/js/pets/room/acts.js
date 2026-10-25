/*******************************************************************************
 * What they do in the playground's home, each activity a generator over the
 * steps in steps.js (life.js runs them). `can(a)` says whether an activity can
 * be chosen just now; the ones without it are only done when asked (the
 * director's, or another's invitation).
 *
 * The two of them watch TV, have a snack from the fridge or the freezer (the
 * dog begs for a treat, and the empty box goes in the bin), cook (her, with
 * vegetables from the garden when there are some) or bake a roast chicken or a
 * lasagna in the oven, and eat it together at the table, read, water the plant,
 * work on the laptop, play a video game together on the sofa, chat, nap,
 * stretch, stroll, light the fire, look after the garden (picking what is ripe
 * into the basket and taking it straight to the fridge, sowing a bed picked
 * clean with something new, and watering), take the dog out for a walk through
 * the front door, play fetch with her, pet and feed the pets, tidy up the cat's
 * mess, and go to bed at night. He plays on his computer in the loft, his white
 * headphones off their stand and on his head, talking to his team, cheering
 * when he wins; she may come up and watch, and the cat lies on his computer.
 * She changes her clothes in the dressing corner (her own idea, or the
 * visitor's choice) and twirls in front of the mirror. The collie naps in her
 * bed, lies on the rug or out in the sun, has the zoomies, visits them and
 * sniffs the cat; the cat stays home from walks, naps all over, watches birds
 * from the window sill, climbs her tree, chases the butterfly in the garden,
 * grooms, cuddles up to the sleeping dog, sleeps at their feet, and makes a
 * mess while they are all out. Both curl up by the fire while it burns.
 *
 * Each kind lives in acts/: living, kitchen, pc, wardrobe, garden, outings and
 * pets, with what they share in acts/common.js; here they are put together,
 * with the menu of what can be done when.
 ******************************************************************************/

import { rnd, pick } from "../stage.js";
import { X1 } from "./house.js";
import { PET_AGAIN, makeContext } from "./acts/common.js";
import { livingActs } from "./acts/living.js";
import { kitchenActs } from "./acts/kitchen.js";
import { pcActs } from "./acts/pc.js";
import { wardrobeActs } from "./acts/wardrobe.js";
import { gardenActs } from "./acts/garden.js";
import { outingsActs } from "./acts/outings.js";
import { petsActs } from "./acts/pets.js";

export function makeActs(home, life) {
  const c = makeContext(home, life);
  for (const make of [livingActs, kitchenActs, pcActs, wardrobeActs, gardenActs, outingsActs, petsActs]) Object.assign(c, make(c));
  const {
    house,
    byName,
    humans,
    spots,
    holder,
    available,
    t,
    other,
    SOFA,
    freeSeat,
    sprinkler,
    gardenWet,
    tv,
    nap,
    sleep,
    snack,
    cook,
    bake,
    read,
    water,
    pc,
    pcGirl,
    watchPc,
    laptop,
    game,
    chat,
    stretch,
    stroll,
    rest,
    dressUp,
    lightFire,
    fireside,
    garden,
    sprinkle,
    sprinklerOff,
    shelter,
    splash,
    outing,
    fetch,
    petPet,
    hungry,
    feed,
    scold,
    rug,
    bed,
    zoomies,
    visitable,
    visit,
    sniff,
    catNap,
    climb,
    perch,
    tower,
    groom,
    cuddle,
    sunbathe,
    chase,
    mischief,
  } = c;

  const pets = home.pets;
  const playing = () => {
    const ev = byName.boy?.event;
    return !!ev && ev.kind === "pc" && ev.playing && !ev.over;
  };
  const can = {
    tv: () => freeSeat(SOFA),
    nap: (a) => !a.human || freeSeat(),
    sleep: () => home.night && freeSeat(["bed0", "bed1"]),
    snack: () => !holder("fridge"),
    cook: (a) => a.name === "girl" && !holder("stove"),
    bake: (a) => a.human && !holder("stove") && !holder("fridge") && !holder("dine0") && !holder("dine1"),
    read: () => !holder("book"),
    water: () => !holder("plant"),
    pc: (a) => a.name === "boy" && !holder("pc") && !holder("chair"),
    pcGirl: (a) => a.name === "girl" && !holder("pc") && !holder("chair"),
    watchPc: (a) => a.name === "girl" && playing() && !holder("watchPc"),
    laptop: () => !holder("laptop") && freeSeat(),
    game: (a) => available(other(a)) && !holder("sofa1") && (!holder("sofa0") || !holder("sofa2")),
    chat: (a) => available(other(a)),
    walk: () => available(byName.collie) && !home.actors.some((o) => o.out || o.event?.kind === "walk"),
    fetch: () => byName.collie && available(byName.collie) && home.ball.landed() && !holder("ball"),
    pet: (a) => t() > (a.petAgainAt ?? 0) && pets.some((p) => available(p) && p.above() < 0.5),
    stretch: () => true,
    stroll: () => true,
    rest: () => true,
    bed: () => !holder("dogBed"),
    rug: () => [0, 1, 2, 3].some((k) => !holder(`rug${k}`)),
    zoomies: () => !home.night || Math.random() < 0.3,
    visit: () => humans.some(visitable),
    sniff: () => byName.cat && available(byName.cat) && byName.cat.above() < 0.5,
    perch: () => !holder("sill") && !holder("bedFoot"),
    climb: () => !holder("tree"),
    tower: () => playing() && !holder("tower"),
    groom: (a) => a.above() < 0.5,
    cuddle: () => byName.collie?.asleep && byName.collie.above() < 0.5,
    dress: (a) => a.name === "girl" && !home.night && !holder("closet"),
    fire: () => !house.fire.lit && !holder("fire"),
    fireside: () => house.fire.lit && [0, 1].some((k) => !holder(`fireside${k}`)),
    garden: () => {
      const g = house.garden;
      const beds = [0, 1, 2, 3];
      return (
        !gardenWet() &&
        !holder("garden") &&
        ((!holder("basket") && (g.basket.out() || beds.some(g.ripe))) || beds.some((i) => g.spent(i) || g.thirsty(i)))
      );
    },
    sunbathe: (a) =>
      !home.night &&
      !gardenWet() &&
      !holder("sunny") &&
      home.actors.every((o) => o === a || o.out || Math.hypot(o.x - spots.sunny[0], o.z - spots.sunny[1]) > 20),
    chase: () => !home.night && !gardenWet() && !holder("butterfly"),
    sprinkle: (a) =>
      !home.night &&
      t() - sprinkler.since > 120 && // not just turned off
      !gardenWet() &&
      !home.weather.raining &&
      ["sprinkler", "garden", "sunny", "butterfly", "splash"].every((k) => !holder(k)) &&
      home.actors.every((o) => o === a || o.out || o.x < X1 - 4),
    splash: () =>
      sprinkler.on &&
      !sprinkler.wrong &&
      sprinkler.pressure > 0.7 &&
      t() - (sprinkler.splashedAt ?? -Infinity) > 60 &&
      !home.weather.raining &&
      !holder("splash"),
  };
  const petAPet = function* (a) {
    a.petAgainAt = t() + rnd(...PET_AGAIN);
    yield* petPet(a, pick(pets.filter((p) => available(p) && p.above() < 0.5)));
  };
  const runs = {
    tv,
    nap: (a) => (a.human ? nap(a) : catNap(a)),
    sleep,
    snack,
    cook,
    bake,
    read,
    water,
    pc,
    pcGirl,
    watchPc: (a) => watchPc(a),
    laptop,
    game,
    chat,
    walk: outing,
    fetch,
    pet: petAPet,
    stretch,
    stroll,
    rest,
    bed,
    rug,
    zoomies,
    visit,
    sniff,
    perch,
    climb: (a) => climb(a),
    tower,
    groom,
    cuddle,
    dress: dressUp,
    fire: lightFire,
    fireside,
    garden,
    sunbathe,
    chase,
    sprinkle,
    splash,
    // Only when asked.
    sprinklerOff,
    shelter,
    hungry,
    feed,
    scold,
    mischief,
  };
  return Object.fromEntries(Object.entries(runs).map(([name, run]) => [name, { run, can: can[name] || (() => false) }]));
}
