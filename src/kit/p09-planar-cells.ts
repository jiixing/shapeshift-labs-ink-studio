/* Deterministic shared-vertex cells, inset/chamfered and clipped to a planar
   signed mask. Independent of paint, water, architecture and renderer. Clipped
   fragments retain holes; their boundary supports closed prisms and picking. */
type P09PlanarCellsVec2 = [number, number];
type P09PlanarCellsVec3 = [number, number, number];
type P09PlanarCellsIndex = [number, number];
type P09PlanarCellsPolygon = P09PlanarCellsVec2[];
type P09PlanarCellsTriangle = [P09PlanarCellsVec2, P09PlanarCellsVec2, P09PlanarCellsVec2];
type P09PlanarCellsEdge = [P09PlanarCellsVec2, P09PlanarCellsVec2];
type P09PlanarCellsSide2 = (point: P09PlanarCellsVec2) => number;
type P09PlanarCellsMask = (x: number, z: number) => number;

interface P09PlanarCellsBounds {
  min: P09PlanarCellsVec3;
  max: P09PlanarCellsVec3;
}

interface P09PlanarCellsParameters {
  size: number;
  gap: number;
  jitter: number;
  chamfer: number;
  resolution: number;
  seed: number;
  maxCells: number;
  maxSamples: number;
  regions?: readonly P09PlanarCellsBounds[];
  [key: string]: unknown;
}

interface P09PlanarCellsCell {
  key: string;
  index: P09PlanarCellsIndex;
  polygon: P09PlanarCellsPolygon;
}

interface P09PlanarCellsRequest extends P09PlanarCellsCell {
  bounds: P09PlanarCellsBounds;
}

interface P09PlanarCellsLayoutCell extends P09PlanarCellsRequest {
  fragments: P09PlanarCellsPolygon[];
  boundary: P09PlanarCellsEdge[];
  centroid: P09PlanarCellsVec2;
  area: number;
  distance(x: number, z: number): number;
}

interface P09PlanarCellsCache {
  get(request: P09PlanarCellsRequest): P09PlanarCellsLayoutCell | null | undefined;
  set(request: P09PlanarCellsRequest, value: P09PlanarCellsLayoutCell | null): unknown;
}

interface P09PlanarCellsInput {
  size?: number;
  gap?: number;
  jitter?: number;
  chamfer?: number;
  resolution?: number;
  seed?: number;
  maxCells?: number;
  maxSamples?: number;
  regions?: readonly P09PlanarCellsBounds[];
  cache?: P09PlanarCellsCache;
  [key: string]: unknown;
}

interface P09PlanarCellsLayout {
  parameters: Readonly<P09PlanarCellsParameters>;
  cells: readonly P09PlanarCellsLayoutCell[];
  sampling: {
    readonly candidates: number;
    readonly samples: number;
  };
}

interface P09PlanarCellsGroup {
  owner: string;
  surface: string;
  material: string;
  start: number;
  count: number;
}

interface P09PlanarCellsSurface {
  positions: Float32Array;
  normals: Float32Array;
  uv: Float32Array;
  groups: readonly P09PlanarCellsGroup[];
  bounds: P09PlanarCellsBounds | null;
}

interface P09PlanarCellsMeta {
  owner?: string;
  material?: string;
  surface?: string;
}

interface P09PlanarCellsBuilder {
  triangle(a: P09PlanarCellsVec3, b: P09PlanarCellsVec3, c: P09PlanarCellsVec3, meta?: P09PlanarCellsMeta): void;
  finish(): P09PlanarCellsSurface;
}

interface P09PlanarCellsPrismCell {
  fragments: readonly P09PlanarCellsPolygon[];
  boundary: readonly P09PlanarCellsEdge[];
  bounds: P09PlanarCellsBounds;
  distance(x: number, z: number): number;
}

interface P09PlanarCellsPrismOptions {
  bottom?: number;
  top?: number;
  owner?: string;
  material?: string;
  [key: string]: unknown;
}

interface P09PlanarCellsPrismSettings {
  bottom: number;
  top: number;
  owner: string;
  material: string;
  [key: string]: unknown;
}

interface P09PlanarCellsHit {
  p: P09PlanarCellsVec3;
  n: P09PlanarCellsVec3;
  distance: number;
  surface: 'cell';
  uv: P09PlanarCellsVec2;
}

interface P09PlanarCellsPrism<T extends P09PlanarCellsPrismCell = P09PlanarCellsPrismCell> {
  cell: T;
  parameters: Readonly<P09PlanarCellsPrismSettings>;
  bounds: P09PlanarCellsBounds;
  mesh(): P09PlanarCellsSurface;
  distance(point: P09PlanarCellsVec3): number;
  sample(spacing: number, emit: (point: P09PlanarCellsVec3, normal: P09PlanarCellsVec3) => void): number;
  raycast(origin: P09PlanarCellsVec3, direction: P09PlanarCellsVec3, max?: number): P09PlanarCellsHit | null;
}

interface P09PlanarCellsApi {
  parameters(raw?: P09PlanarCellsInput): P09PlanarCellsParameters;
  cell(i: number, j: number, raw?: P09PlanarCellsInput): P09PlanarCellsCell;
  layout(work: P09PlanarCellsBounds, mask: P09PlanarCellsMask, raw?: P09PlanarCellsInput): P09PlanarCellsLayout;
  prism<T extends P09PlanarCellsPrismCell>(cell: T, raw?: P09PlanarCellsPrismOptions): P09PlanarCellsPrism<T>;
}

interface P09PlanarCellsData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P09PlanarCellsProceduralApi {
  data: P09PlanarCellsData;
  geometry: {
    builder(): P09PlanarCellsBuilder;
  };
  spatial: {
    rayBox(
      bounds: P09PlanarCellsBounds,
      origin: P09PlanarCellsVec3,
      direction: P09PlanarCellsVec3,
      max: number
    ): number | null;
  };
  planarCells?: P09PlanarCellsApi;
}

interface P09PlanarCellsVectorApi {
  norm(vector: readonly number[]): P09PlanarCellsVec3;
  len(vector: readonly number[]): number;
  mad(origin: P09PlanarCellsVec3, direction: P09PlanarCellsVec3, distance: number): P09PlanarCellsVec3;
}

interface P09PlanarCellsKitHost {
  procedural: P09PlanarCellsProceduralApi;
  V: P09PlanarCellsVectorApi;
  hash(x: number, z: number, seed: number): number;
}

declare const KIT: P09PlanarCellsKitHost;

(function (K: P09PlanarCellsKitHost) {
  const A = K.procedural,
    V = K.V,
    EPS = 1e-9,
    compiled = new WeakSet<object>(),
    cross = (a: P09PlanarCellsVec2, b: P09PlanarCellsVec2) => a[0] * b[1] - a[1] * b[0],
    sub = (a: P09PlanarCellsVec2, b: P09PlanarCellsVec2): P09PlanarCellsVec2 => [a[0] - b[0], a[1] - b[1]],
    mix = (a: P09PlanarCellsVec2, b: P09PlanarCellsVec2, t: number): P09PlanarCellsVec2 => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t
    ],
    key = (p: P09PlanarCellsVec2) => p.map(v => v.toFixed(7)).join('/');
  const area = (p: P09PlanarCellsPolygon) => p.reduce((n, a, i) => n + cross(a, p[(i + 1) % p.length]), 0) / 2;
  function parameters(raw: P09PlanarCellsInput = {}): P09PlanarCellsParameters {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Planar cells need configuration');
    if (compiled.has(raw)) return raw as P09PlanarCellsParameters;
    const input = Object.assign({}, raw);
    delete input.cache;
    const p: P09PlanarCellsParameters = Object.assign(
      {
        size: 0.62,
        gap: 0.085,
        jitter: 0.17,
        chamfer: 0.14,
        resolution: 0.05,
        seed: 0,
        maxCells: 4096,
        maxSamples: 250000
      },
      A.data.clone(input)
    );
    if (
      !(['size', 'gap', 'jitter', 'chamfer', 'resolution'] as const).every(k => Number.isFinite(p[k])) ||
      p.size < 0.1 ||
      p.size > 8 ||
      p.gap < 0 ||
      p.gap > p.size * 0.4 ||
      p.jitter < 0 ||
      p.jitter > 0.24 ||
      p.chamfer < 0 ||
      p.chamfer > 0.3 ||
      p.resolution < 0.01 ||
      p.resolution > 0.25 ||
      !Number.isSafeInteger(p.seed) ||
      Math.abs(p.seed) > 4294967295 ||
      !Number.isSafeInteger(p.maxCells) ||
      p.maxCells < 1 ||
      p.maxCells > 16384 ||
      !Number.isSafeInteger(p.maxSamples) ||
      p.maxSamples < 1 ||
      p.maxSamples > 1000000
    )
      throw new Error('Invalid planar cell dimensions, seed or budgets');
    delete p.regions;
    A.data.freeze(p);
    compiled.add(p);
    return p;
  }
  function bounds(b: P09PlanarCellsBounds): P09PlanarCellsBounds {
    if (
      !b ||
      ![b.min, b.max].every(p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite)) ||
      b.min.some((v, i) => v > b.max[i]) ||
      [b.min[0], b.min[2], b.max[0], b.max[2]].some(v => Math.abs(v) > 1e6)
    )
      throw new Error('Planar cells need finite ordered bounds within the coordinate budget');
    return b;
  }
  function clip(poly: P09PlanarCellsPolygon, distance: P09PlanarCellsSide2, root = false): P09PlanarCellsPolygon {
    const out: P09PlanarCellsPolygon = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        da = distance(a),
        db = distance(b);
      if (da <= 0) out.push(a);
      if (da < 0 !== db < 0 && da !== 0 && db !== 0) {
        let t = da / (da - db);
        if (root) {
          let lo = 0,
            hi = 1;
          for (let j = 0; j < 20; j++) {
            const m = (lo + hi) / 2;
            if (distance(mix(a, b, m)) < 0 === da < 0) lo = m;
            else hi = m;
          }
          t = da < 0 ? lo : hi;
        }
        out.push(mix(a, b, t));
      }
    }
    return out.filter((p, i) => !i || Math.hypot(...sub(p, out[i - 1])) > EPS);
  }
  function cell(i: number, j: number, raw: P09PlanarCellsInput = {}): P09PlanarCellsCell {
    const p = parameters(raw);
    if (![i, j].every(Number.isSafeInteger) || Math.max(Math.abs(i), Math.abs(j)) * p.size > 1e6)
      throw new Error('Cell indices exceed the coordinate budget');
    const vertex = (x: number, z: number): P09PlanarCellsVec2 => [
        (x + (K.hash(x, z, p.seed + 47) - 0.5) * p.jitter * 2) * p.size,
        (z + (K.hash(x, z, p.seed + 83) - 0.5) * p.jitter * 2) * p.size
      ],
      original: P09PlanarCellsPolygon = [vertex(i, j), vertex(i + 1, j), vertex(i + 1, j + 1), vertex(i, j + 1)];
    let polygon: P09PlanarCellsPolygon = original.map(q => q.slice() as P09PlanarCellsVec2);
    for (let k = 0; k < original.length; k++) {
      const a = original[k],
        edge = sub(original[(k + 1) % original.length], a),
        len = Math.hypot(...edge);
      polygon = clip(polygon, q => p.gap / 2 - cross(edge, sub(q, a)) / len);
    }
    if (p.chamfer) {
      const cut: P09PlanarCellsPolygon = [];
      for (let k = 0; k < polygon.length; k++) {
        const q = polygon[k],
          t = p.chamfer * (0.75 + 0.5 * K.hash(i, j, p.seed + k + 13));
        cut.push(
          mix(q, polygon[(k - 1 + polygon.length) % polygon.length], t),
          mix(q, polygon[(k + 1) % polygon.length], t)
        );
      }
      polygon = cut;
    }
    return { key: i + ':' + j, index: [i, j], polygon };
  }
  function layout(
    work: P09PlanarCellsBounds,
    mask: P09PlanarCellsMask,
    raw: P09PlanarCellsInput = {}
  ): P09PlanarCellsLayout {
    bounds(work);
    if (typeof mask !== 'function') throw new Error('Planar cells need a signed mask');
    const p = parameters(raw),
      regions: readonly P09PlanarCellsBounds[] = raw.regions || [work],
      memo = raw.cache;
    if (memo && !(['get', 'set'] as const).every(k => typeof memo[k] === 'function'))
      throw new Error('Planar cell caching needs get/set callbacks');
    if (!Array.isArray(regions) || regions.length > 4096)
      throw new Error('Planar cell work regions exceed their budget');
    const candidates = new Map<string, P09PlanarCellsIndex>(),
      sampled = new Map<string, number>();
    let samples = 0;
    const at = (q: P09PlanarCellsVec2): number => {
      const k = key(q);
      if (!sampled.has(k)) {
        if (++samples > p.maxSamples) throw new Error('Planar mask exceeds its sample budget');
        const d = mask(q[0], q[1]);
        if (!Number.isFinite(d) && d !== Infinity)
          throw new Error('Planar masks need finite distances or empty Infinity');
        sampled.set(k, d);
      }
      return sampled.get(k)!;
    };
    for (const region of regions) {
      bounds(region);
      const x0 = Math.max(work.min[0], region.min[0]),
        x1 = Math.min(work.max[0], region.max[0]),
        z0 = Math.max(work.min[2], region.min[2]),
        z1 = Math.min(work.max[2], region.max[2]);
      if (x0 >= x1 || z0 >= z1) continue;
      const a = Math.floor(x0 / p.size) - 1,
        b = Math.floor(x1 / p.size) + 1,
        c = Math.floor(z0 / p.size) - 1,
        d = Math.floor(z1 / p.size) + 1;
      if ((b - a + 1) * (d - c + 1) > p.maxCells * 2) throw new Error('Planar cell region exceeds its cell budget');
      for (let j = c; j <= d; j++)
        for (let i = a; i <= b; i++) {
          candidates.set(i + ':' + j, [i, j]);
          if (candidates.size > p.maxCells) throw new Error('Planar layout exceeds its cell budget');
        }
    }
    const cells: P09PlanarCellsLayoutCell[] = [];
    for (const [i, j] of [...candidates.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0])) {
      const base = cell(i, j, p);
      let polygon = base.polygon;
      for (const d of [
        (q: P09PlanarCellsVec2) => work.min[0] - q[0],
        (q: P09PlanarCellsVec2) => q[0] - work.max[0],
        (q: P09PlanarCellsVec2) => work.min[2] - q[1],
        (q: P09PlanarCellsVec2) => q[1] - work.max[2]
      ])
        polygon = clip(polygon, d);
      if (polygon.length < 3 || area(polygon) < EPS) continue;
      const min: P09PlanarCellsVec2 = [Math.min(...polygon.map(q => q[0])), Math.min(...polygon.map(q => q[1]))],
        max: P09PlanarCellsVec2 = [Math.max(...polygon.map(q => q[0])), Math.max(...polygon.map(q => q[1]))];
      if (!regions.some(r => r.min[0] <= max[0] && r.max[0] >= min[0] && r.min[2] <= max[1] && r.max[2] >= min[1]))
        continue;
      const request = A.data.freeze({
          key: base.key,
          index: base.index.slice() as P09PlanarCellsIndex,
          polygon: polygon.map(q => q.slice() as P09PlanarCellsVec2),
          bounds: { min: [min[0], 0, min[1]], max: [max[0], 0, max[1]] }
        } satisfies P09PlanarCellsRequest),
        saved = memo?.get(request);
      if (saved !== undefined) {
        if (saved !== null) cells.push(saved);
        continue;
      }
      const nx = Math.max(1, Math.ceil((max[0] - min[0]) / p.resolution)),
        nz = Math.max(1, Math.ceil((max[1] - min[1]) / p.resolution)),
        planes: P09PlanarCellsSide2[] = polygon.map((a, k) => {
          const e = sub(polygon[(k + 1) % polygon.length], a);
          return q => -cross(e, sub(q, a));
        }),
        fragments: P09PlanarCellsPolygon[] = [];
      function triangle(tri: P09PlanarCellsTriangle) {
        let poly: P09PlanarCellsPolygon = tri;
        for (const plane of planes) {
          poly = clip(poly, plane);
          if (poly.length < 3) return;
        }
        const center = poly.reduce<P09PlanarCellsVec2>(
          (a, q) => [a[0] + q[0] / poly.length, a[1] + q[1] / poly.length],
          [0, 0]
        );
        for (let k = 0; k < poly.length; k++) {
          const part = clip([center, poly[k], poly[(k + 1) % poly.length]], at, true);
          if (part.length >= 3 && area(part) > EPS) fragments.push(part);
        }
      }
      for (let z = 0; z < nz; z++)
        for (let x = 0; x < nx; x++) {
          const a: P09PlanarCellsVec2 = [min[0] + ((max[0] - min[0]) * x) / nx, min[1] + ((max[1] - min[1]) * z) / nz],
            b: P09PlanarCellsVec2 = [min[0] + ((max[0] - min[0]) * (x + 1)) / nx, a[1]],
            c: P09PlanarCellsVec2 = [b[0], min[1] + ((max[1] - min[1]) * (z + 1)) / nz],
            d: P09PlanarCellsVec2 = [a[0], c[1]];
          triangle([a, b, c]);
          triangle([a, c, d]);
        }
      let total = fragments.reduce((n, f) => n + area(f), 0);
      if (total < EPS) {
        memo?.set(request, null);
        continue;
      }
      if (Math.abs(total - area(polygon)) < 1e-7) {
        fragments.splice(0, fragments.length, polygon);
        total = area(polygon);
      }
      const edges = new Map<string, P09PlanarCellsEdge>();
      for (const poly of fragments)
        for (let k = 0; k < poly.length; k++) {
          const a = poly[k],
            b = poly[(k + 1) % poly.length],
            ka = key(a),
            kb = key(b);
          if (ka === kb) continue;
          const id = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          if (edges.has(id)) edges.delete(id);
          else edges.set(id, [a, b]);
        }
      const boundary: P09PlanarCellsEdge[] = [...edges.values()],
        centroid = fragments.reduce<P09PlanarCellsVec2>(
          (sum, f) => {
            const weight = area(f) / total,
              center = f.reduce<P09PlanarCellsVec2>((n, q) => [n[0] + q[0] / f.length, n[1] + q[1] / f.length], [0, 0]);
            return [sum[0] + center[0] * weight, sum[1] + center[1] * weight];
          },
          [0, 0]
        );
      function distance(x: number, z: number) {
        if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error('Cell queries need finite coordinates');
        let d = Infinity,
          inside = false;
        for (const [a, b] of boundary) {
          const e = sub(b, a),
            t = Math.max(0, Math.min(1, ((x - a[0]) * e[0] + (z - a[1]) * e[1]) / (e[0] * e[0] + e[1] * e[1])));
          d = Math.min(d, Math.hypot(x - a[0] - e[0] * t, z - a[1] - e[1] * t));
          if (a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
        }
        return inside ? -d : d;
      }
      const result = A.data.freeze({
        key: base.key,
        index: base.index,
        polygon,
        fragments,
        boundary,
        centroid,
        area: total,
        bounds: { min: [min[0], 0, min[1]], max: [max[0], 0, max[1]] },
        distance
      } satisfies P09PlanarCellsLayoutCell);
      cells.push(result);
      memo?.set(request, result);
    }
    return A.data.freeze({ parameters: p, cells, sampling: { candidates: candidates.size, samples } });
  }
  function prism<T extends P09PlanarCellsPrismCell>(
    cell: T,
    raw: P09PlanarCellsPrismOptions = {}
  ): P09PlanarCellsPrism<T> {
    const p: P09PlanarCellsPrismSettings = Object.assign({ bottom: 0, top: 0.2, owner: '', material: 'default' }, raw);
    if (
      !Number.isFinite(p.bottom) ||
      !Number.isFinite(p.top) ||
      p.bottom >= p.top ||
      !cell?.fragments?.length ||
      typeof cell.distance !== 'function'
    )
      throw new Error('Cell prisms need a clipped cell and ordered finite heights');
    const bounds: P09PlanarCellsBounds = {
        min: [cell.bounds.min[0], p.bottom, cell.bounds.min[2]],
        max: [cell.bounds.max[0], p.top, cell.bounds.max[2]]
      },
      meta: P09PlanarCellsMeta = { owner: p.owner, material: p.material, surface: 'cell' };
    let mesh: P09PlanarCellsSurface | null = null;
    const point = (q: P09PlanarCellsVec2, y: number): P09PlanarCellsVec3 => [q[0], y, q[1]];
    function geometry() {
      if (mesh) return mesh;
      const builder = A.geometry.builder();
      for (const poly of cell.fragments)
        for (let i = 1; i < poly.length - 1; i++) {
          builder.triangle(point(poly[0], p.top), point(poly[i + 1], p.top), point(poly[i], p.top), meta);
          builder.triangle(point(poly[0], p.bottom), point(poly[i], p.bottom), point(poly[i + 1], p.bottom), meta);
        }
      for (const [a, b] of cell.boundary) {
        builder.triangle(point(a, p.top), point(b, p.top), point(b, p.bottom), meta);
        builder.triangle(point(a, p.top), point(b, p.bottom), point(a, p.bottom), meta);
      }
      return (mesh = builder.finish());
    }
    function sample(spacing: number, emit: (point: P09PlanarCellsVec3, normal: P09PlanarCellsVec3) => void): number {
      if (!Number.isFinite(spacing) || spacing <= 0 || typeof emit !== 'function')
        throw new Error('Cell sampling needs positive spacing and an emitter');
      const nx = Math.max(1, Math.ceil((bounds.max[0] - bounds.min[0]) / spacing)),
        nz = Math.max(1, Math.ceil((bounds.max[2] - bounds.min[2]) / spacing));
      if (nx * nz > 250000) throw new Error('Cell surface exceeds its sample budget');
      let count = 0;
      const seen = new Set<string>(),
        put = (q: P09PlanarCellsVec3, n: P09PlanarCellsVec3) => {
          const k = q.map(v => v.toFixed(7)).join('/') + '/' + n.map(v => v.toFixed(5)).join('/');
          if (seen.has(k)) return;
          seen.add(k);
          if (++count > 250000) throw new Error('Cell surface exceeds its sample budget');
          emit(q, n);
        };
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          const x = bounds.min[0] + ((bounds.max[0] - bounds.min[0]) * (i + 0.5)) / nx,
            z = bounds.min[2] + ((bounds.max[2] - bounds.min[2]) * (j + 0.5)) / nz;
          if (cell.distance(x, z) <= 0) {
            put([x, p.top, z], [0, 1, 0]);
            put([x, p.bottom, z], [0, -1, 0]);
          }
        }
      const rows = Math.max(1, Math.ceil((p.top - p.bottom) / spacing));
      for (const [a, b] of cell.boundary) {
        const e = sub(b, a),
          cols = Math.max(1, Math.ceil(Math.hypot(...e) / spacing)),
          n = V.norm([e[1], 0, -e[0]]);
        for (let col = 0; col <= cols; col++) {
          const q = mix(a, b, col / cols);
          put(point(q, p.top), [0, 1, 0]);
          put(point(q, p.bottom), [0, -1, 0]);
          for (let row = 0; row <= rows; row++) put(point(q, p.bottom + ((p.top - p.bottom) * row) / rows), n);
        }
      }
      return count;
    }
    function raycast(origin: P09PlanarCellsVec3, direction: P09PlanarCellsVec3, max = 10000): P09PlanarCellsHit | null {
      if (
        ![origin, direction].every(q => Array.isArray(q) && q.length === 3 && q.every(Number.isFinite)) ||
        V.len(direction) < EPS ||
        !Number.isFinite(max) ||
        max <= 0
      )
        throw new Error('Cell rays need finite vectors and positive reach');
      const d = V.norm(direction),
        hits: P09PlanarCellsHit[] = [];
      if (A.spatial.rayBox(bounds, origin, d, max) === null) return null;
      const put = (t: number, n: P09PlanarCellsVec3) => {
        if (t >= 0 && t <= max)
          hits.push({
            p: V.mad(origin, d, t),
            n,
            distance: t,
            surface: 'cell',
            uv: [origin[0] + d[0] * t, origin[2] + d[2] * t]
          });
      };
      if (Math.abs(d[1]) > EPS)
        for (const [y, n] of [
          [p.top, [0, 1, 0]],
          [p.bottom, [0, -1, 0]]
        ] as [number, P09PlanarCellsVec3][]) {
          const t = (y - origin[1]) / d[1],
            q = V.mad(origin, d, t);
          if (cell.distance(q[0], q[2]) <= 1e-7) put(t, n);
        }
      for (const [a, b] of cell.boundary) {
        const e = sub(b, a),
          dir: P09PlanarCellsVec2 = [d[0], d[2]],
          den = cross(dir, e);
        if (Math.abs(den) < EPS) continue;
        const q: P09PlanarCellsVec2 = [a[0] - origin[0], a[1] - origin[2]],
          t = cross(q, e) / den,
          u = cross(q, dir) / den,
          y = origin[1] + d[1] * t;
        if (u >= -EPS && u <= 1 + EPS && y >= p.bottom - EPS && y <= p.top + EPS) put(t, V.norm([e[1], 0, -e[0]]));
      }
      hits.sort((a, b) => a.distance - b.distance);
      return hits[0] || null;
    }
    return {
      cell,
      parameters: A.data.freeze(A.data.clone(p)),
      bounds,
      mesh: geometry,
      distance: q => Math.max(cell.distance(q[0], q[2]), p.bottom - q[1], q[1] - p.top),
      sample,
      raycast
    };
  }
  A.planarCells = { parameters, cell, layout, prism };
})(KIT);
