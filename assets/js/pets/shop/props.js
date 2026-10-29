/*******************************************************************************
 * What the girl handles in the flower shop, besides what she has at home
 * (room/props.js: the watering can): the bunch she gathers stem by stem and
 * wraps (flowers.js), a mister for the house plants, the broom and dustpan, the
 * secateurs, a stick of chalk, a cup of tea, and a bucket of fresh stock from
 * the cool room. Each hidden until shown with only(); the activities
 * (acts.js) pose her arms (room/props.js HOLDS).
 ******************************************************************************/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
import { part, box } from "../models/voxels.js";
import { meshOf } from "./kit.js";
import { bunchMesh, wrapMesh } from "./flowers.js";

// A part filled by `fill`, in half voxels.
const fine = (fill) => {
  const p = part();
  fill(p);
  return meshOf(p, 0.5);
};

// A bouquet being made: `kinds` (flowers.js) gathered `stems(n)` at a time, the kraft paper wrapped round
// it `k` of the way and the ribbon `tied` (wrapped()); its `group` is held (shopProps hold()), laid on the
// bench or stood in the bucket of bouquets made up.
export function makeBouquet(kinds, seed) {
  const group = new THREE.Group();
  let shown = -1;
  let wrap = null;
  return {
    group,
    kinds,
    stems(n) {
      if (n === shown) return;
      shown = n;
      group.children.filter((c) => c !== wrap?.group).forEach((c) => group.remove(c));
      if (n > 0) group.add(bunchMesh(kinds, seed, n));
    },
    wrapped(k, tied) {
      if (!wrap) {
        wrap = wrapMesh(seed);
        group.add(wrap.group);
      }
      wrap.paper.scale.set(1, Math.max(0.01, k), 1);
      wrap.paper.visible = k > 0.01;
      wrap.ribbon.visible = tied;
    },
  };
}

export function shopProps(rig) {
  const [right, left] = rig.hands;
  const at = (parent, object, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => {
    object.position.set(x, y, z);
    object.rotation.set(rx, ry, rz);
    object.visible = false;
    parent.add(object);
    return object;
  };

  // Where a bouquet is held: upright in the right hand, its grip at the hand (hold()).
  const bunch = at(right, new THREE.Group(), [0, -1.5, 1.2], [Math.PI / 2, 0, 0]);

  // A mister: a white bottle, a green trigger head.
  const mister = at(
    right,
    fine((p) => {
      box(p, [-2, 2], [0, 8], [-2, 2], (x, y, z) => (y === 8 ? "#e8ecef" : "#f7f8f8"));
      box(p, [-1, 1], [9, 11], [-1, 1], "#5f9a6a");
      box(p, [-1, 1], [11, 11], [2, 4], "#5f9a6a"); // the nozzle
      box(p, [0, 0], [6, 9], [3, 3], "#4f8a5a"); // the trigger
      box(p, [-1, 1], [2, 5], [-2, -2], "#cfe6f0"); // the water in it, seen through
    }),
    [0, -3.5, 1],
    [0, 0, 0]
  );

  // The broom: a long oak handle gripped near its top, running on down the line of the arm to a stiff black
  // head on the ground. The dustpan, in the left hand.
  const broom = at(
    right,
    fine((p) => {
      box(p, [0, 0], [-24, 6], [0, 0], "wood");
      box(p, [-6, 6], [-28, -25], [-1, 1], "#3a3a3a");
      box(p, [-7, 7], [-31, -29], [-1, 1], "#2a2a2a");
    }),
    [0, -1, 1],
    [-0.5, 0, 0]
  );
  const dustpan = at(
    left,
    fine((p) => {
      box(p, [-5, 5], [0, 0], [0, 8], "#3f6e5a");
      box(p, [-5, 5], [1, 3], [0, 0], "#3f6e5a");
      box(p, [0, 0], [1, 6], [-2, -1], "#3f6e5a");
    }),
    [0, -3, 1],
    [0.4, 0, 0]
  );

  // The secateurs: red handles, steel blades.
  const snips = at(
    right,
    fine((p) => {
      box(p, [-1, -1], [0, 4], [0, 0], "#c83f3f");
      box(p, [1, 1], [0, 4], [0, 0], "#c83f3f");
      box(p, [-1, 1], [5, 7], [0, 0], "chrome");
    }),
    [0, -2, 1],
    [Math.PI / 2, 0, 0]
  );

  // A stick of chalk.
  const chalk = at(
    right,
    fine((p) => box(p, [0, 0], [0, 3], [0, 0], "chalk")),
    [0, -2.5, 1],
    [Math.PI / 2, 0, 0]
  );

  // A cup of tea: cream with a sage band, tea in it.
  const cup = at(
    right,
    fine((p) => {
      box(p, [-2, 2], [0, 4], [-2, 2], (x, y, z) => (y === 2 ? "#a9bf98" : "#f3ede1"));
      box(p, [-1, 1], [4, 4], [-1, 1], "#a8693a");
      box(p, [3, 3], [1, 3], [0, 0], "#f3ede1");
    }),
    [0, -2.5, 1.2]
  );

  // A bucket of fresh stems from the cool room, carried in both arms in front.
  const bucket = at(rig.pose, new THREE.Group(), [0, 9.5, 7.5]);
  bucket.add(
    fine((p) => {
      for (let y = 0; y <= 14; y++)
        for (let x = -6; x <= 6; x++)
          for (let z = -6; z <= 6; z++) {
            const r = Math.hypot(x, z);
            if (r <= 5.5 + y * 0.05 && (r > 4.5 + y * 0.05 || y === 0)) p.add(x, y, z, y === 14 ? "bucketBlackRim" : "bucketBlack");
          }
    })
  );
  const stock = new THREE.Group();
  stock.position.y = 4;
  bucket.add(stock);

  const all = { bunch, mister, broom, dustpan, snips, chalk, cup, bucket };
  return {
    ...all,
    // Show just these (by name), or none.
    only(...names) {
      Object.entries(all).forEach(([name, o]) => (o.visible = names.includes(name)));
    },
    // `bq` (makeBouquet()) in the right hand, or nothing; shown with only("bunch").
    hold(bq) {
      bunch.clear();
      if (!bq) return;
      bq.group.position.set(0, 0, 0);
      bq.group.rotation.set(0, 0, 0);
      bunch.add(bq.group);
    },
    // The bucket of stock for `kinds`.
    fill(kinds, seed) {
      stock.clear();
      stock.add(bunchMesh(kinds, seed, 9));
    },
  };
}
