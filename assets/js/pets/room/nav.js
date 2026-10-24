/*******************************************************************************
 * Finding the way round the furniture in the playground's room: the floor is a
 * grid of cells, the ones under (or too near) a piece of furniture blocked; a
 * path is the shortest run of free cells (A*), straightened into the fewest
 * straight lines that keep clear. Paths may start and end at a spot by the
 * furniture (a seat, the fridge door); they leave and reach it in a straight line.
 ******************************************************************************/

const CELL = 4; // voxels
const CLEARANCE = 7; // kept between the middle of someone walking and the furniture

export function makeNav([x0, x1, z0, z1], obstacles) {
  const cols = Math.ceil((x1 - x0) / CELL);
  const rows = Math.ceil((z1 - z0) / CELL);
  const blocked = new Uint8Array(cols * rows);
  const cx = (i) => x0 + (i + 0.5) * CELL;
  const cz = (j) => z0 + (j + 0.5) * CELL;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      blocked[j * cols + i] = obstacles.some(
        ([ox0, ox1, oz0, oz1]) => cx(i) > ox0 - CLEARANCE && cx(i) < ox1 + CLEARANCE && cz(j) > oz0 - CLEARANCE && cz(j) < oz1 + CLEARANCE
      )
        ? 1
        : 0;
  // Free cells shut off from the rest (a gap between two chairs, say) count as blocked too, so that no one is
  // sent somewhere they cannot walk to: only the largest stretch of free floor, all of it joined up, is free.
  const region = new Int32Array(cols * rows).fill(-1);
  const sizes = [];
  for (let k = 0; k < cols * rows; k++) {
    if (blocked[k] || region[k] >= 0) continue;
    const id = sizes.length;
    const stack = [k];
    region[k] = id;
    let size = 0;
    while (stack.length) {
      const c = stack.pop();
      size++;
      const [i, j] = [c % cols, Math.floor(c / cols)];
      for (const [ni, nj] of [
        [i + 1, j],
        [i - 1, j],
        [i, j + 1],
        [i, j - 1],
      ]) {
        const n = nj * cols + ni;
        if (ni >= 0 && nj >= 0 && ni < cols && nj < rows && !blocked[n] && region[n] < 0) {
          region[n] = id;
          stack.push(n);
        }
      }
    }
    sizes.push(size);
  }
  const main = sizes.indexOf(Math.max(...sizes));
  for (let k = 0; k < cols * rows; k++) if (region[k] !== main) blocked[k] = 1;

  const cellOf = (x, z) => [Math.floor((x - x0) / CELL), Math.floor((z - z0) / CELL)];
  const inside = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows;
  const isFree = (i, j) => inside(i, j) && !blocked[j * cols + i];
  const free = (x, z) => isFree(...cellOf(x, z));

  // The free cell nearest (x, z), searching outwards ring by ring.
  function nearestFree(x, z) {
    const [i0, j0] = cellOf(x, z).map((c, k) => Math.min(Math.max(c, 0), (k ? rows : cols) - 1));
    for (let r = 0; r < Math.max(cols, rows); r++) {
      let best = null;
      for (let j = j0 - r; j <= j0 + r; j++)
        for (let i = i0 - r; i <= i0 + r; i++) {
          if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || !isFree(i, j)) continue;
          const d = (cx(i) - x) ** 2 + (cz(j) - z) ** 2;
          if (!best || d < best[2]) best = [i, j, d];
        }
      if (best) return best;
    }
    return null;
  }

  // Whether a straight line stays on free cells.
  function clearLine(ax, az, bx, bz) {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL / 2));
    for (let k = 0; k <= n; k++) if (!free(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n)) return false;
    return true;
  }

  // Waypoints [x, z] from (ax, az) to (bx, bz), ending exactly there; a straight line when nothing is in
  // the way or no way round is found.
  function path(ax, az, bx, bz) {
    if (clearLine(ax, az, bx, bz)) return [[bx, bz]];
    const start = nearestFree(ax, az);
    const goal = nearestFree(bx, bz);
    if (!start || !goal) return [[bx, bz]];
    const n = cols * rows;
    const g = new Float32Array(n).fill(Infinity);
    const from = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const s = start[1] * cols + start[0];
    const e = goal[1] * cols + goal[0];
    const h = (k) => {
      const dx = Math.abs((k % cols) - goal[0]);
      const dz = Math.abs(Math.floor(k / cols) - goal[1]);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); // octile distance
    };
    // A binary heap of [f, cell].
    const heap = [[h(s), s]];
    const push = (item) => {
      heap.push(item);
      for (let k = heap.length - 1; k > 0; ) {
        const p = (k - 1) >> 1;
        if (heap[p][0] <= heap[k][0]) break;
        [heap[p], heap[k]] = [heap[k], heap[p]];
        k = p;
      }
    };
    const popMin = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let k = 0; ; ) {
          const l = 2 * k + 1;
          const r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    g[s] = 0;
    while (heap.length) {
      const [, k] = popMin();
      if (closed[k]) continue;
      closed[k] = 1;
      if (k === e) break;
      const i = k % cols;
      const j = Math.floor(k / cols);
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if ((!di && !dj) || !isFree(i + di, j + dj)) continue;
          if (di && dj && (!isFree(i + di, j) || !isFree(i, j + dj))) continue; // no cutting corners
          const nk = (j + dj) * cols + i + di;
          const cost = g[k] + (di && dj ? 1.414 : 1);
          if (cost < g[nk]) {
            g[nk] = cost;
            from[nk] = k;
            push([cost + h(nk), nk]);
          }
        }
    }
    if (!closed[e]) return [[bx, bz]];
    const cellsOnPath = [];
    for (let k = e; k !== -1; k = from[k]) cellsOnPath.unshift([cx(k % cols), cz(Math.floor(k / cols))]);
    // Straighten: from each point, on to the furthest one still in plain sight.
    const points = [[ax, az], ...cellsOnPath, [bx, bz]];
    const out = [];
    let at = 0;
    while (at < points.length - 1) {
      let next = at + 1;
      for (let k = points.length - 1; k > at + 1; k--)
        if (clearLine(...points[at], ...points[k])) {
          next = k;
          break;
        }
      out.push(points[next]);
      at = next;
    }
    return out;
  }

  // A free spot at random within [xa, xb] x [za, zb] that `ok` accepts, or null.
  function randomSpot([xa, xb], [za, zb], ok = () => true) {
    for (let k = 0; k < 40; k++) {
      const x = xa + Math.random() * (xb - xa);
      const z = za + Math.random() * (zb - za);
      if (free(x, z) && ok(x, z)) return [x, z];
    }
    return null;
  }

  return { path, free, clearLine, randomSpot };
}
