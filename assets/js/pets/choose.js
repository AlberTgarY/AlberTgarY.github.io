/*******************************************************************************
 * Choosing what to do next so it seldom repeats: an option done within the
 * last `memory` choices keeps only a little of its weight, so options mostly
 * come round in turn, yet the odd repeat still happens and nothing feels
 * scripted. With `memory` one less than the number of options, each comes up
 * about once a round.
 ******************************************************************************/

const REPEAT = 0.04; // what is left of a recent option's weight

export function freshPicker(memory) {
  const recent = [];
  const picker = {
    // One of the options with weight above 0, by weight, recent ones held back; null if there are none.
    choose(weights) {
      const options = Object.entries(weights)
        .filter(([, w]) => w > 0)
        .map(([name, w]) => [name, recent.includes(name) ? w * REPEAT : w]);
      let r = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
      const chosen = options.find(([, w]) => (r -= w) < 0) || options[options.length - 1];
      return chosen ? chosen[0] : null;
    },
    // Remember an option as done (only what was really done, not what was chosen and then not possible).
    did(name) {
      recent.unshift(name);
      recent.length = Math.min(recent.length, memory);
    },
    take(weights) {
      const name = picker.choose(weights);
      if (name !== null) picker.did(name);
      return name;
    },
  };
  return picker;
}

// Equal weights for a list of names, or for the keys of an object.
export const evenly = (names) => Object.fromEntries((Array.isArray(names) ? names : Object.keys(names)).map((name) => [name, 1]));
