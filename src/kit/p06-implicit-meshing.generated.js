// Generated from src/kit/p06-implicit-meshing.ts by npm run build:src. Do not edit.
(function(K) {
  const A = K.procedural, V = K.V;
  const corners = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1]
  ], tets = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6]
  ], partitions = new Array(256);
  function split(d) {
    let mask = 0;
    for (let i = 0; i < 8; i++) if (d[i] < 0) mask |= 1 << i;
    return partitions[mask] || (partitions[mask] = tets.map((tet) => [tet.filter((i) => d[i] < 0), tet.filter((i) => d[i] >= 0)]).filter(([low, high]) => low.length && high.length));
  }
  A.geometry.implicitSurface = (field, bounds, options) => {
    const o = Object.assign({ resolution: 0.12, maxCells: 3e4, edgeRefinements: 0, meta: {} }, options);
    if (typeof field !== "function" || !bounds || !["min", "max"].every(
      (k) => Array.isArray(bounds[k]) && bounds[k].length === 3 && bounds[k].every(Number.isFinite)
    ) || bounds.min.some((v, i) => v >= bounds.max[i]) || !Number.isFinite(o.resolution) || o.resolution <= 0 || !Number.isSafeInteger(o.maxCells) || o.maxCells < 8)
      throw new Error("Implicit meshes need a finite box, field and sampling budget");
    if (o.prepareColumn !== void 0 && typeof o.prepareColumn !== "function")
      throw new Error("Implicit mesh column preparation needs a callback");
    const size = bounds.max.map((v, i) => v - bounds.min[i]);
    if (!size.every(Number.isFinite) || o.maxCells > 2e6 || !Number.isInteger(o.edgeRefinements) || o.edgeRefinements < 0 || o.edgeRefinements > 12)
      throw new Error("Implicit mesh extent and sampling budget exceed supported limits");
    let step = Math.max(o.resolution, Math.max(...size) / o.maxCells), counts = size.map((v) => Math.max(1, Math.ceil(v / step)));
    while (counts.reduce((n, v) => n * v, 1) > o.maxCells) {
      step *= 1.15;
      counts = size.map((v) => Math.max(1, Math.ceil(v / step)));
    }
    const dimensions = counts.map((n) => n + 1), stride = dimensions[0] * dimensions[1], values = new Float64Array(stride * dimensions[2]), at = (x, y, z) => [
      bounds.min[0] + size[0] * x / counts[0],
      bounds.min[1] + size[1] * y / counts[1],
      bounds.min[2] + size[2] * z / counts[2]
    ], slot = (x, y, z) => x + dimensions[0] * y + stride * z;
    function write(x, y, z, distance) {
      if (!Number.isFinite(distance)) throw new Error("Implicit mesh field must return finite values");
      values[slot(x, y, z)] = distance;
    }
    if (o.prepareColumn) {
      for (let z = 0; z < dimensions[2]; z++)
        for (let x = 0; x < dimensions[0]; x++) {
          const [px, , pz] = at(x, 0, z), evaluate = o.prepareColumn(px, pz);
          if (typeof evaluate !== "function") throw new Error("An implicit mesh column must return a field of y");
          for (let y = 0; y < dimensions[1]; y++) write(x, y, z, evaluate(bounds.min[1] + size[1] * y / counts[1]));
        }
    } else {
      for (let z = 0; z < dimensions[2]; z++)
        for (let y = 0; y < dimensions[1]; y++)
          for (let x = 0; x < dimensions[0]; x++) write(x, y, z, field(at(x, y, z)));
    }
    const builder = A.geometry.builder(), edges = new Array(64);
    const offsets = corners.map(([x, y, z]) => slot(x, y, z));
    const triangle = (a, b, c, inside) => {
      const n = V.cross(V.sub(b, a), V.sub(c, a)), mid = V.mul(V.add(V.add(a, b), c), 1 / 3);
      if (V.dot(n, V.sub(mid, inside)) < 0) builder.triangle(a, c, b, o.meta);
      else builder.triangle(a, b, c, o.meta);
    };
    for (let z = 0; z < counts[2]; z++)
      for (let y = 0; y < counts[1]; y++)
        for (let x = 0; x < counts[0]; x++) {
          const base = slot(x, y, z), inside = values[base] < 0;
          let i = 1;
          while (i < offsets.length && values[base + offsets[i]] < 0 === inside) i++;
          if (i === offsets.length) continue;
          const p = corners.map((c) => at(x + c[0], y + c[1], z + c[2])), d = offsets.map((offset) => values[base + offset]);
          if (!o.edgeRefinements) edges.fill(void 0);
          const edge = (a, b) => {
            var _a;
            if (!o.edgeRefinements)
              return edges[_a = (a << 3) + b] || (edges[_a] = V.mad(p[a], V.sub(p[b], p[a]), d[a] / (d[a] - d[b])));
            if (d[a] >= 0) [a, b] = [b, a];
            const delta = V.sub(p[b], p[a]);
            let low = 0, high = 1;
            for (let i2 = 0; i2 < o.edgeRefinements; i2++) {
              const mid = (low + high) / 2;
              const value = field(V.mad(p[a], delta, mid));
              if (!Number.isFinite(value)) throw new Error("Implicit mesh field must return finite values");
              if (value < 0) low = mid;
              else high = mid;
            }
            return V.mad(p[a], delta, (low + high) / 2);
          };
          for (const [low, high] of split(d)) {
            const inside2 = V.mul(
              low.reduce((n, i2) => V.add(n, p[i2]), [0, 0, 0]),
              1 / low.length
            );
            if (low.length === 1) {
              const a = low[0], q = high.map((b) => edge(a, b));
              triangle(...q, inside2);
            } else if (high.length === 1) {
              const a = high[0], q = low.map((b) => edge(a, b));
              triangle(...q, inside2);
            } else {
              const [a, b] = low, [c, e] = high, q = [edge(a, c), edge(a, e), edge(b, e), edge(b, c)];
              triangle(q[0], q[1], q[2], inside2);
              triangle(q[0], q[2], q[3], inside2);
            }
          }
        }
    return Object.assign(builder.finish(), {
      sampling: A.data.freeze({ cells: counts.reduce((n, v) => n * v, 1), counts, resolution: step })
    });
  };
})(KIT);
