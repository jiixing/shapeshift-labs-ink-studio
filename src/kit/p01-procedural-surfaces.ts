/* Spatial bounds, parametric carrier surfaces and affine transforms. */
type P01ProceduralSurfacesVec2 = [number, number];
type P01ProceduralSurfacesVec3 = [number, number, number];
type P01ProceduralSurfacesMatrix = [number, number, number, number, number, number, number, number, number];

interface P01ProceduralSurfacesBounds {
  min: number[];
  max: number[];
}

interface P01ProceduralSurfacesPlaneData {
  id: string;
  origin: P01ProceduralSurfacesVec3;
  u: P01ProceduralSurfacesVec3;
  v: P01ProceduralSurfacesVec3;
  [key: string]: unknown;
}

interface P01ProceduralSurfacesCylinderData {
  id: string;
  origin: P01ProceduralSurfacesVec3;
  height: number;
  radius?: number;
  radii?: P01ProceduralSurfacesVec2;
  axis?: P01ProceduralSurfacesVec3;
  reference?: P01ProceduralSurfacesVec3;
  startAngle?: number;
  sweep?: number;
  [key: string]: unknown;
}

interface P01ProceduralSurfacesTransformInput {
  position?: P01ProceduralSurfacesVec3;
  rotation?: P01ProceduralSurfacesVec3 | number;
  scale?: P01ProceduralSurfacesVec3 | number;
}

interface P01ProceduralSurfacesPose {
  R: P01ProceduralSurfacesMatrix;
  t: P01ProceduralSurfacesVec3;
}

interface P01ProceduralSurfacesPointNormal {
  p: P01ProceduralSurfacesVec3;
  n: P01ProceduralSurfacesVec3;
}

interface P01ProceduralSurfacesSample extends P01ProceduralSurfacesPointNormal {
  tangent: P01ProceduralSurfacesVec3;
  bitangent: P01ProceduralSurfacesVec3;
  uv: P01ProceduralSurfacesVec2;
}

interface P01ProceduralSurfacesHit extends P01ProceduralSurfacesSample {
  distance: number;
}

interface P01ProceduralSurfacesSurfaceData {
  origin?: P01ProceduralSurfacesVec3;
  u?: P01ProceduralSurfacesVec3;
  v?: P01ProceduralSurfacesVec3;
  sweep?: number;
  base?: P01ProceduralSurfacesPlaneData;
  domain?: P01ProceduralSurfacesVec2[];
  [key: string]: unknown;
}

interface P01ProceduralSurfacesSurface {
  id: string;
  kind: string;
  periodicU?: boolean;
  data: Readonly<P01ProceduralSurfacesSurfaceData>;
  bounds: Readonly<P01ProceduralSurfacesBounds>;
  sample(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesSample;
  samplePointNormal(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesPointNormal;
  planePoint?(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesVec3;
  project(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec2;
  closest(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesSample | null;
  contains?(at: P01ProceduralSurfacesVec2): boolean;
  raycast(
    origin: P01ProceduralSurfacesVec3,
    dir: P01ProceduralSurfacesVec3,
    max: number
  ): P01ProceduralSurfacesHit | null;
}

interface P01ProceduralSurfacesData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P01ProceduralSurfacesVectorApi {
  dot(a: P01ProceduralSurfacesVec3, b: P01ProceduralSurfacesVec3): number;
  norm(v: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  cross(a: P01ProceduralSurfacesVec3, b: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  add(a: P01ProceduralSurfacesVec3, b: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  mul(v: P01ProceduralSurfacesVec3, scale: number): P01ProceduralSurfacesVec3;
  sub(a: P01ProceduralSurfacesVec3, b: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  mad(origin: P01ProceduralSurfacesVec3, dir: P01ProceduralSurfacesVec3, distance: number): P01ProceduralSurfacesVec3;
  dist(a: P01ProceduralSurfacesVec3, b: P01ProceduralSurfacesVec3): number;
  len(v: P01ProceduralSurfacesVec3): number;
}

interface P01ProceduralSurfacesMatrixApi {
  mul(a: P01ProceduralSurfacesMatrix, b: P01ProceduralSurfacesMatrix): P01ProceduralSurfacesMatrix;
  rot(axis: P01ProceduralSurfacesVec3, angle: number): P01ProceduralSurfacesMatrix;
  app(m: P01ProceduralSurfacesMatrix, p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  tr(m: P01ProceduralSurfacesMatrix): P01ProceduralSurfacesMatrix;
  inv(m: P01ProceduralSurfacesMatrix): P01ProceduralSurfacesMatrix;
  det(m: P01ProceduralSurfacesMatrix): number;
}

interface P01ProceduralSurfacesSpatialApi {
  bounds(raw: P01ProceduralSurfacesBounds): P01ProceduralSurfacesBounds;
  overlap(a: P01ProceduralSurfacesBounds, b: P01ProceduralSurfacesBounds): boolean;
  contains(bounds: P01ProceduralSurfacesBounds, p: readonly number[]): boolean;
  expand(bounds: P01ProceduralSurfacesBounds, radius: number): P01ProceduralSurfacesBounds;
  boxOf(points: readonly P01ProceduralSurfacesVec3[]): P01ProceduralSurfacesBounds;
  rayBox(
    bounds: P01ProceduralSurfacesBounds,
    origin: P01ProceduralSurfacesVec3,
    dir: P01ProceduralSurfacesVec3,
    max: number
  ): number | null;
}

interface P01ProceduralSurfacesTransforms {
  local(raw?: P01ProceduralSurfacesTransformInput): P01ProceduralSurfacesPose;
  point(pose: P01ProceduralSurfacesPose, p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  normal(pose: P01ProceduralSurfacesPose, n: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  inversePoint(pose: P01ProceduralSurfacesPose, p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec3;
  combine(a: P01ProceduralSurfacesPose, b: P01ProceduralSurfacesPose): P01ProceduralSurfacesPose;
  distanceScale(pose: P01ProceduralSurfacesPose | null | undefined): number;
  bounds(pose: P01ProceduralSurfacesPose, bounds: P01ProceduralSurfacesBounds): P01ProceduralSurfacesBounds;
}

interface P01ProceduralSurfacesApi {
  data: P01ProceduralSurfacesData;
  spatial: P01ProceduralSurfacesSpatialApi;
  transforms: P01ProceduralSurfacesTransforms;
  surface: {
    plane(raw: P01ProceduralSurfacesPlaneData): P01ProceduralSurfacesSurface;
    cylinder(raw: P01ProceduralSurfacesCylinderData): P01ProceduralSurfacesSurface;
    transform?(surface: P01ProceduralSurfacesSurface, pose: P01ProceduralSurfacesPose): P01ProceduralSurfacesSurface;
  };
}

interface P01ProceduralSurfacesKitHost {
  procedural: P01ProceduralSurfacesApi;
  V: P01ProceduralSurfacesVectorApi;
  M: P01ProceduralSurfacesMatrixApi;
}

declare const KIT: P01ProceduralSurfacesKitHost;

(function (K: P01ProceduralSurfacesKitHost) {
  const A = K.procedural,
    { clone, freeze } = A.data,
    V = K.V,
    M = K.M;
  const EPS = 1e-8,
    TAU = Math.PI * 2;
  const vector = (v: unknown): v is P01ProceduralSurfacesVec3 =>
    Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
  const name = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
  function bounds(raw: P01ProceduralSurfacesBounds): P01ProceduralSurfacesBounds {
    if (!raw || !vector(raw.min) || !vector(raw.max) || raw.min.some((x, i) => x > raw.max[i]))
      throw new Error('Expected finite ordered spatial bounds');
    return { min: raw.min.slice(), max: raw.max.slice() };
  }
  const overlap = (a: P01ProceduralSurfacesBounds, b: P01ProceduralSurfacesBounds) =>
    a.min.every((x, i) => x <= b.max[i] && a.max[i] >= b.min[i]);
  const contains = ({ min, max }: P01ProceduralSurfacesBounds, p: readonly number[]) =>
    p.length === 3
      ? p[0] >= min[0] && p[0] <= max[0] && p[1] >= min[1] && p[1] <= max[1] && p[2] >= min[2] && p[2] <= max[2]
      : p.every((v, i) => v >= min[i] && v <= max[i]);
  const expand = (b: P01ProceduralSurfacesBounds, r: number) => ({
    min: b.min.map(x => x - r),
    max: b.max.map(x => x + r)
  });
  function boxOf(points: readonly P01ProceduralSurfacesVec3[]): P01ProceduralSurfacesBounds {
    const min: number[] = [Infinity, Infinity, Infinity],
      max: number[] = [-Infinity, -Infinity, -Infinity];
    for (const point of points) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
    return { min, max };
  }
  function rayBox(
    b: P01ProceduralSurfacesBounds,
    origin: P01ProceduralSurfacesVec3,
    dir: P01ProceduralSurfacesVec3,
    max: number
  ): number | null {
    let near = 0,
      far = max;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(dir[i]) < EPS) {
        if (origin[i] < b.min[i] || origin[i] > b.max[i]) return null;
      } else {
        const a = (b.min[i] - origin[i]) / dir[i],
          c = (b.max[i] - origin[i]) / dir[i];
        near = Math.max(near, Math.min(a, c));
        far = Math.min(far, Math.max(a, c));
        if (far < near) return null;
      }
    }
    return near;
  }
  A.spatial = { bounds, overlap, contains, expand, boxOf, rayBox };
  function plane(raw: P01ProceduralSurfacesPlaneData): P01ProceduralSurfacesSurface {
    const d = clone(raw);
    if (!d || !name(d.id) || !vector(d.origin) || !vector(d.u) || !vector(d.v))
      throw new Error('A plane needs id, origin and two extent vectors');
    const uu = V.dot(d.u, d.u),
      vv = V.dot(d.v, d.v),
      uv = V.dot(d.u, d.v),
      det = uu * vv - uv * uv;
    if (det < EPS * EPS) throw new Error('Plane extent vectors must be independent');
    const normal = V.norm(V.cross(d.u, d.v)),
      tangent = V.norm(d.u),
      bitangent = V.norm(d.v);
    function planePoint(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesVec3 {
      if (!Array.isArray(at) || at.length !== 2 || !at.every(Number.isFinite))
        throw new Error('Surface coordinates must be two finite numbers');
      return V.add(d.origin, V.add(V.mul(d.u, at[0]), V.mul(d.v, at[1])));
    }
    const samplePointNormal = (at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesPointNormal => ({
      p: planePoint(at),
      n: normal.slice() as P01ProceduralSurfacesVec3
    });
    function sample(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesSample {
      return {
        p: planePoint(at),
        n: normal.slice() as P01ProceduralSurfacesVec3,
        tangent: tangent.slice() as P01ProceduralSurfacesVec3,
        bitangent: bitangent.slice() as P01ProceduralSurfacesVec3,
        uv: at.slice() as P01ProceduralSurfacesVec2
      };
    }
    function project(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec2 {
      const v = V.sub(p, d.origin),
        a = V.dot(v, d.u),
        b = V.dot(v, d.v);
      return [(a * vv - b * uv) / det, (b * uu - a * uv) / det];
    }
    function closest(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesSample | null {
      const at = project(p);
      if (at.every(v => v >= 0 && v <= 1)) return sample(at);
      let best: P01ProceduralSurfacesSample | null = null,
        distance = Infinity;
      for (const [a, b] of [
        [
          [0, 0],
          [1, 0]
        ],
        [
          [1, 0],
          [1, 1]
        ],
        [
          [1, 1],
          [0, 1]
        ],
        [
          [0, 1],
          [0, 0]
        ]
      ] as [P01ProceduralSurfacesVec2, P01ProceduralSurfacesVec2][]) {
        const start = sample(a).p,
          end = sample(b).p,
          delta = V.sub(end, start);
        const t = Math.max(0, Math.min(1, V.dot(V.sub(p, start), delta) / V.dot(delta, delta)));
        const hit = sample([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]),
          d2 = V.dist(p, hit.p);
        if (d2 < distance) {
          distance = d2;
          best = hit;
        }
      }
      return best;
    }
    function raycast(
      origin: P01ProceduralSurfacesVec3,
      dir: P01ProceduralSurfacesVec3,
      max: number
    ): P01ProceduralSurfacesHit | null {
      const den = V.dot(normal, dir);
      if (Math.abs(den) < EPS) return null;
      const distance = V.dot(normal, V.sub(d.origin, origin)) / den;
      if (distance < 0 || distance > max) return null;
      const p = V.mad(origin, dir, distance),
        at = project(p);
      if (at.some(v => v < -EPS || v > 1 + EPS)) return null;
      return Object.assign(sample(at), { distance });
    }
    const b = boxOf(
      (
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1]
        ] as P01ProceduralSurfacesVec2[]
      ).map(v => sample(v).p)
    );
    return Object.freeze({
      id: d.id,
      kind: 'plane',
      data: freeze(d),
      bounds: freeze(b),
      sample,
      samplePointNormal,
      planePoint,
      project,
      closest,
      raycast
    });
  }
  function cylinder(raw: P01ProceduralSurfacesCylinderData): P01ProceduralSurfacesSurface {
    const d = clone(raw);
    if (!d || !name(d.id) || !vector(d.origin) || !Number.isFinite(d.height) || d.height <= 0)
      throw new Error('A cylinder needs id, origin and positive height');
    const r: P01ProceduralSurfacesVec2 = d.radii || [d.radius!, d.radius!],
      axis: P01ProceduralSurfacesVec3 = d.axis || [0, 1, 0],
      ref: P01ProceduralSurfacesVec3 = d.reference || [1, 0, 0];
    if (
      !Array.isArray(r) ||
      r.length !== 2 ||
      !r.every(x => Number.isFinite(x) && x > 0) ||
      !vector(axis) ||
      !vector(ref) ||
      V.len(axis) < EPS
    )
      throw new Error('Invalid cylinder axes or radii');
    const Y = V.norm(axis),
      X0 = V.sub(ref, V.mul(Y, V.dot(ref, Y)));
    if (V.len(X0) < EPS) throw new Error('Cylinder reference must differ from its axis');
    const X = V.norm(X0),
      Z = V.norm(V.cross(X, Y)),
      start = d.startAngle ?? 0,
      sweep = d.sweep === undefined ? TAU : d.sweep;
    if (!Number.isFinite(start) || !Number.isFinite(sweep) || sweep <= 0 || sweep > TAU + EPS)
      throw new Error('Invalid cylinder angular range');
    const closed = Math.abs(sweep - TAU) < EPS;
    function readSurface(at: P01ProceduralSurfacesVec2, frame: true): P01ProceduralSurfacesSample;
    function readSurface(at: P01ProceduralSurfacesVec2, frame: false): P01ProceduralSurfacesPointNormal;
    function readSurface(
      at: P01ProceduralSurfacesVec2,
      frame: boolean
    ): P01ProceduralSurfacesSample | P01ProceduralSurfacesPointNormal {
      if (!Array.isArray(at) || at.length !== 2 || !at.every(Number.isFinite))
        throw new Error('Surface coordinates must be two finite numbers');
      const angle = start + at[0] * sweep,
        c = Math.cos(angle),
        s = Math.sin(angle);
      const p = V.add(d.origin, V.add(V.mul(Y, d.height * at[1]), V.add(V.mul(X, r[0] * c), V.mul(Z, r[1] * s))));
      const n = V.norm(V.add(V.mul(X, c / r[0]), V.mul(Z, s / r[1])));
      if (!frame) return { p, n };
      const tangent = V.norm(V.add(V.mul(X, -r[0] * s), V.mul(Z, r[1] * c)));
      return {
        p,
        n,
        tangent,
        bitangent: Y.slice() as P01ProceduralSurfacesVec3,
        uv: at.slice() as P01ProceduralSurfacesVec2
      };
    }
    const sample = (at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesSample => readSurface(at, true);
    const samplePointNormal = (at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesPointNormal =>
      readSurface(at, false);
    function project(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec2 {
      const q = V.sub(p, d.origin),
        angle = Math.atan2(V.dot(q, Z) / r[1], V.dot(q, X) / r[0]);
      const offset = (((angle - start) % TAU) + TAU) % TAU;
      return [offset / sweep, V.dot(q, Y) / d.height];
    }
    function closest(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesSample {
      const at = project(p),
        y = Math.max(0, Math.min(1, at[1]));
      if (closed && Math.abs(r[0] - r[1]) < EPS) return sample([at[0], y]);
      const score = (u: number) => V.dist(p, sample([u, y]).p);
      let best = 0,
        distance = Infinity;
      for (let i = 0; i <= 32; i++) {
        const u = i / 32,
          value = score(u);
        if (value < distance) {
          distance = value;
          best = u;
        }
      }
      let lo = best - 1 / 32,
        hi = best + 1 / 32;
      if (!closed) {
        lo = Math.max(0, lo);
        hi = Math.min(1, hi);
      }
      for (let i = 0; i < 32; i++) {
        const a = lo + (hi - lo) / 3,
          b = hi - (hi - lo) / 3;
        if (score(a) < score(b)) hi = b;
        else lo = a;
      }
      for (const u of [lo, (lo + hi) / 2, hi, 0, 1])
        if (score(u) < distance) {
          distance = score(u);
          best = u;
        }
      return sample([closed ? ((best % 1) + 1) % 1 : best, y]);
    }
    function raycast(
      origin: P01ProceduralSurfacesVec3,
      dir: P01ProceduralSurfacesVec3,
      max: number
    ): P01ProceduralSurfacesHit | null {
      const p = V.sub(origin, d.origin),
        x = V.dot(p, X) / r[0],
        z = V.dot(p, Z) / r[1],
        dx = V.dot(dir, X) / r[0],
        dz = V.dot(dir, Z) / r[1];
      const a = dx * dx + dz * dz,
        b = 2 * (x * dx + z * dz),
        c = x * x + z * z - 1,
        disc = b * b - 4 * a * c;
      if (a < EPS * EPS || disc < 0) return null;
      const roots = [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)];
      for (const distance of roots)
        if (distance >= 0 && distance <= max) {
          const at = project(V.mad(origin, dir, distance));
          if (at[1] >= -EPS && at[1] <= 1 + EPS && (closed || at[0] <= 1 + EPS))
            return Object.assign(sample(at), { distance });
        }
      return null;
    }
    const lo: number[] = [],
      hi: number[] = [];
    for (let i = 0; i < 3; i++) {
      const extent = Math.hypot(X[i] * r[0], Z[i] * r[1]);
      lo[i] = d.origin[i] - extent + Math.min(0, Y[i] * d.height);
      hi[i] = d.origin[i] + extent + Math.max(0, Y[i] * d.height);
    }
    return Object.freeze({
      id: d.id,
      kind: 'cylinder',
      periodicU: closed,
      data: freeze(d),
      bounds: freeze({ min: lo, max: hi }),
      sample,
      samplePointNormal,
      project,
      closest,
      raycast
    });
  }
  A.surface = { plane, cylinder };
  function local(raw?: P01ProceduralSurfacesTransformInput): P01ProceduralSurfacesPose {
    const p = raw || {},
      t: P01ProceduralSurfacesVec3 = p.position || [0, 0, 0],
      r: P01ProceduralSurfacesVec3 =
        p.rotation === undefined ? [0, 0, 0] : typeof p.rotation === 'number' ? [0, p.rotation, 0] : p.rotation;
    const s: P01ProceduralSurfacesVec3 =
      p.scale === undefined ? [1, 1, 1] : typeof p.scale === 'number' ? [p.scale, p.scale, p.scale] : p.scale;
    if (!vector(t) || !vector(r) || !vector(s) || s.some(v => Math.abs(v) < EPS))
      throw new Error('Transforms need finite position/rotation and nonzero scale');
    const R = M.mul(M.rot([0, 0, 1], r[2]), M.mul(M.rot([0, 1, 0], r[1]), M.rot([1, 0, 0], r[0])));
    return {
      R: M.mul(R, [s[0], 0, 0, 0, s[1], 0, 0, 0, s[2]] as P01ProceduralSurfacesMatrix),
      t: t.slice() as P01ProceduralSurfacesVec3
    };
  }
  const point = (pose: P01ProceduralSurfacesPose, p: P01ProceduralSurfacesVec3) => V.add(M.app(pose.R, p), pose.t);
  const normal = (pose: P01ProceduralSurfacesPose, n: P01ProceduralSurfacesVec3) =>
    V.norm(M.app(M.tr(M.inv(pose.R)), n));
  const inversePoint = (pose: P01ProceduralSurfacesPose, p: P01ProceduralSurfacesVec3) =>
    M.app(M.inv(pose.R), V.sub(p, pose.t));
  const combine = (a: P01ProceduralSurfacesPose, b: P01ProceduralSurfacesPose) => ({
    R: M.mul(a.R, b.R),
    t: point(a, b.t)
  });
  function transformBounds(pose: P01ProceduralSurfacesPose, b: P01ProceduralSurfacesBounds) {
    const points: P01ProceduralSurfacesVec3[] = [];
    for (const x of [b.min[0], b.max[0]])
      for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) points.push(point(pose, [x, y, z]));
    return A.spatial.boxOf(points);
  }
  function distanceScale(pose: P01ProceduralSurfacesPose | null | undefined): number {
    if (!pose?.R || pose.R.length !== 9 || !Array.from(pose.R).every(Number.isFinite))
      throw new Error('Distance scaling needs a finite affine matrix');
    const determinant = M.det(pose.R);
    if (!Number.isFinite(determinant) || determinant === 0)
      throw new Error('Distance scaling needs an invertible matrix');
    const a = M.inv(pose.R);
    if (!a.every(Number.isFinite)) throw new Error('Distance scaling needs an invertible matrix');
    const g00 = a[0] ** 2 + a[1] ** 2 + a[2] ** 2,
      g11 = a[3] ** 2 + a[4] ** 2 + a[5] ** 2,
      g22 = a[6] ** 2 + a[7] ** 2 + a[8] ** 2,
      g01 = Math.abs(a[0] * a[3] + a[1] * a[4] + a[2] * a[5]),
      g02 = Math.abs(a[0] * a[6] + a[1] * a[7] + a[2] * a[8]),
      g12 = Math.abs(a[3] * a[6] + a[4] * a[7] + a[5] * a[8]),
      bound = Math.max(g00 + g01 + g02, g11 + g01 + g12, g22 + g02 + g12);
    if (!Number.isFinite(bound) || bound <= 0) throw new Error('Distance scaling needs a finite nonzero bound');
    return 1 / Math.sqrt(bound * (1 + Number.EPSILON * 16));
  }
  A.transforms = { local, point, normal, inversePoint, combine, distanceScale, bounds: transformBounds };
  A.surface.transform = (
    surface: P01ProceduralSurfacesSurface,
    pose: P01ProceduralSurfacesPose
  ): P01ProceduralSurfacesSurface => {
    const inverse = M.inv(pose.R),
      normalMatrix = M.tr(inverse);
    const worldNormal = (n: P01ProceduralSurfacesVec3) => V.norm(M.app(normalMatrix, n));
    const unpoint = (p: P01ProceduralSurfacesVec3) => M.app(inverse, V.sub(p, pose.t));
    const planePoint = surface.planePoint && ((at: P01ProceduralSurfacesVec2) => point(pose, surface.planePoint!(at)));
    const planeNormal = planePoint && worldNormal(surface.sample([0, 0]).n);
    function sample(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesSample {
      const s = surface.sample(at);
      return {
        p: point(pose, s.p),
        n: worldNormal(s.n),
        tangent: V.norm(M.app(pose.R, s.tangent)),
        bitangent: V.norm(M.app(pose.R, s.bitangent)),
        uv: s.uv.slice() as P01ProceduralSurfacesVec2
      };
    }
    function samplePointNormal(at: P01ProceduralSurfacesVec2): P01ProceduralSurfacesPointNormal {
      if (planePoint) return { p: planePoint(at), n: planeNormal!.slice() as P01ProceduralSurfacesVec3 };
      const s = surface.samplePointNormal ? surface.samplePointNormal(at) : surface.sample(at);
      return { p: point(pose, s.p), n: worldNormal(s.n) };
    }
    function project(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesVec2 {
      return surface.project(unpoint(p));
    }
    const planeData =
      surface.kind === 'plane' ? surface.data : surface.kind === 'trimmed-plane' ? surface.data.base : null;
    const plane = planeData
      ? A.surface.plane({
          id: surface.id,
          origin: point(pose, planeData.origin!),
          u: M.app(pose.R, planeData.u!),
          v: M.app(pose.R, planeData.v!)
        })
      : null;
    function closest(p: P01ProceduralSurfacesVec3): P01ProceduralSurfacesSample | null {
      if (plane) {
        const candidate = plane.closest(p)!;
        if (!surface.contains || surface.contains(candidate.uv)) return sample(candidate.uv);
        const domain = surface.data.domain!;
        let best: P01ProceduralSurfacesSample | null = null,
          distance = Infinity;
        for (let i = 0; i < domain.length; i++) {
          const a = domain[i],
            b = domain[(i + 1) % domain.length],
            pa = sample(a).p,
            pb = sample(b).p,
            delta = V.sub(pb, pa);
          const t = Math.max(0, Math.min(1, V.dot(V.sub(p, pa), delta) / V.dot(delta, delta)));
          const s = sample([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]),
            d = V.dist(p, s.p);
          if (d < distance) {
            distance = d;
            best = s;
          }
        }
        return best;
      }
      if (surface.kind === 'cylinder') {
        function at(u: number) {
          const a = sample([u, 0]),
            b = sample([u, 1]),
            d = V.sub(b.p, a.p);
          return sample([u, Math.max(0, Math.min(1, V.dot(V.sub(p, a.p), d) / V.dot(d, d)))]);
        }
        const closed = surface.data.sweep === undefined || Math.abs(surface.data.sweep - Math.PI * 2) < EPS;
        let best = at(0),
          distance = V.dist(best.p, p),
          u0 = 0;
        for (let i = 1; i <= 32; i++) {
          const s = at(i / 32),
            d = V.dist(s.p, p);
          if (d < distance) {
            best = s;
            distance = d;
            u0 = i / 32;
          }
        }
        let lo = u0 - 1 / 32,
          hi = u0 + 1 / 32;
        if (!closed) {
          lo = Math.max(0, lo);
          hi = Math.min(1, hi);
        }
        for (let i = 0; i < 30; i++) {
          const a = lo + (hi - lo) / 3,
            b = hi - (hi - lo) / 3;
          if (V.dist(at(a).p, p) < V.dist(at(b).p, p)) hi = b;
          else lo = a;
        }
        const s = at((lo + hi) / 2);
        if (V.dist(s.p, p) < distance) best = s;
        if (closed) best.uv[0] = ((best.uv[0] % 1) + 1) % 1;
        return best;
      }
      return sample(surface.closest(unpoint(p))!.uv);
    }
    function raycast(
      origin: P01ProceduralSurfacesVec3,
      dir: P01ProceduralSurfacesVec3,
      max: number
    ): P01ProceduralSurfacesHit | null {
      const hit = surface.raycast(unpoint(origin), M.app(inverse, dir), max);
      return hit ? Object.assign(sample(hit.uv), { distance: hit.distance }) : null;
    }
    return Object.freeze({
      id: surface.id,
      kind: 'transformed',
      periodicU: surface.periodicU,
      data: freeze({ local: clone(surface.data || {}), transform: clone(pose) }),
      bounds: freeze(transformBounds(pose, surface.bounds)),
      sample,
      samplePointNormal,
      ...(planePoint ? { planePoint } : {}),
      project,
      closest,
      raycast
    });
  };
})(KIT);
