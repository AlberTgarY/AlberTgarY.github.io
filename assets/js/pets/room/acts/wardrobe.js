/*******************************************************************************
 * Changing clothes in the dressing corner, into her own choice or the
 * visitor's.
 ******************************************************************************/

import { pick } from "../../stage.js";
import { LOOKS } from "../../models/girl-outfits.js";
import { HOLDS, MOVES } from "../props.js";
import { V } from "./common.js";

// `c` is everything they share (common.js), and the activities of the other files.
export function wardrobeActs(c) {
  const { home, house, spots, walk, turn, wait, getUp, claim, onEnd, t } = c;
  const walkUnless = (...args) => c.walkUnless(...args); // living.js

  // She changes her clothes (by day): a look along the rail at the dressing corner, the one she wants off
  // its hanger (the visitor's choice, home.outfit.want, or else one she fancies), behind the screen to
  // change, her old clothes back on the rail, and then a twirl in front of the mirror. Should the visitor
  // pick again before she is behind the screen, she takes that one instead (going back to the rail to swap
  // if she has to); picking what she has on calls it off. A pick once she is changing is for next time.
  function* dressUp(a) {
    const wardrobe = home.outfit;
    if (a.seated) yield* getUp(a); // (asked to come straight away)
    if (!claim(a, "closet")) return;
    wardrobe.choosing = true; // until she is behind the screen, a pick changes her mind
    onEnd(a, () => {
      wardrobe.choosing = false;
      wardrobe.into = null;
      house.closet.hang([wardrobe.current]); // however it ends, only what she has on is off the rail
    });
    yield* walk(a, spots.closet.at);
    yield* turn(a, spots.closet.yaw);
    a.look = spots.closet.rail;
    if (wardrobe.want === null) {
      a.hold = HOLDS.chin; // which one?
      a.pop("room-pop room-pop-question");
      yield* wait(a, 1.6);
    }
    let want = wardrobe.want ?? pick(LOOKS.map((_, k) => k).filter((k) => k !== wardrobe.current));
    const changed = () => wardrobe.want !== null && wardrobe.want !== want;
    for (;;) {
      if (want === wardrobe.current) {
        // Called off: what she has on will do.
        wardrobe.want = null;
        wardrobe.choosing = false;
        house.closet.hang([wardrobe.current]);
        a.hold = null;
        a.look = null;
        yield* turn(a, V);
        a.pop();
        a.beHappy(1.2);
        return yield* wait(a, 1.2);
      }
      a.hold = HOLDS.reach;
      yield* wait(a, 0.7);
      if (changed()) {
        want = wardrobe.want; // still at the rail: that one instead
        continue;
      }
      house.closet.hang([wardrobe.current, want]); // off the hanger
      a.hold = HOLDS.carry;
      a.look = null;
      if (yield* walkUnless(a, spots.change.at, changed)) break;
      // A different pick on the way: back to the rail to swap it.
      yield* walk(a, spots.closet.at);
      yield* turn(a, spots.closet.yaw);
      a.look = spots.closet.rail;
      house.closet.hang([wardrobe.current]); // back on its hanger
      want = wardrobe.want;
    }
    wardrobe.choosing = false;
    wardrobe.into = want;
    yield* turn(a, V);
    a.hold = MOVES.stretch; // over the head and off, and the new ones on
    a.since = t();
    yield* wait(a, 1.4);
    wardrobe.wear(want);
    wardrobe.into = null;
    house.closet.hang([want]);
    if (wardrobe.want === want) wardrobe.want = null;
    yield* wait(a, 1);
    a.hold = null;
    home.popAt(
      a.facePoint().map((v, i) => (i === 1 ? v + 12 : v)),
      "room-pop room-pop-sparkle"
    );
    yield* walk(a, spots.mirror.at);
    yield* turn(a, spots.mirror.yaw);
    a.look = spots.mirror.glass;
    yield* wait(a, 1.2);
    a.look = null;
    a.hold = HOLDS.twirl;
    a.happy = true;
    for (let k = 1; k <= 3; k++) yield* turn(a, spots.mirror.yaw + (k * 2 * Math.PI) / 3);
    a.hold = null;
    yield* turn(a, V);
    a.pop();
    yield* wait(a, 1.4);
  }

  return { dressUp };
}
