/* Closed convex construction pieces shared by route decks, supports and details.
   Picking uses clipped half spaces; surface samples and SDFs share the same shell. */
type P07ConvexSolidsVec2 = [number, number];
type P07ConvexSolidsVec3 = [number, number, number];
type P07ConvexSolidsMatrix = [number, number, number, number, number, number, number, number, number];
type P07ConvexSolidsTriangleVec2 = [P07ConvexSolidsVec2, P07ConvexSolidsVec2, P07ConvexSolidsVec2];

interface P07ConvexSolidsBounds {
  min: P07ConvexSolidsVec3;
  max: P07ConvexSolidsVec3;
}

interface P07ConvexSolidsMeta {
  owner?: string;
  surface?: string;
  material?: string;
  [key: string]: unknown;
}

interface P07ConvexSolidsInfo {
  owner: string;
  key: string;
  material: string;
  [key: string]: unknown;
}

interface P07ConvexSolidsPlane {
  normal: P07ConvexSolidsVec3;
  offset: number;
}

interface P07ConvexSolidsHit {
  distance: number;
  n: P07ConvexSolidsVec3;
  p: P07ConvexSolidsVec3;
  part: string;
  material: string;
}

type P07ConvexSolidsIntersection = [number, P07ConvexSolidsVec3 | null];

interface P07ConvexSolidsGroup {
  owner: string;
  surface: string;
  material: string;
  start: number;
  count: number;
}

interface P07ConvexSolidsMesh {
  positions: Float32Array;
  normals: Float32Array;
  uv: Float32Array;
  groups: readonly P07ConvexSolidsGroup[];
  bounds: P07ConvexSolidsBounds | null;
}

interface P07ConvexSolidsPiece extends P07ConvexSolidsInfo {
  mesh: P07ConvexSolidsMesh;
  bounds: P07ConvexSolidsBounds;
  planes: P07ConvexSolidsPlane[];
  distance(point: P07ConvexSolidsVec3): number;
  intersections(origin: P07ConvexSolidsVec3, dir: P07ConvexSolidsVec3, max?: number): P07ConvexSolidsHit[];
  sample(spacing: number, emit: (point: P07ConvexSolidsVec3) => void): void;
}

interface P07ConvexSolidsUnion {
  bounds: P07ConvexSolidsBounds;
  hidden(exclude: string | null, point: P07ConvexSolidsVec3, tolerance?: number): boolean;
  contains(point: P07ConvexSolidsVec3, tolerance?: number): boolean;
  distance(point: P07ConvexSolidsVec3): number;
  raycast(origin: P07ConvexSolidsVec3, direction: P07ConvexSolidsVec3, max?: number): P07ConvexSolidsHit | null;
  mesh(): P07ConvexSolidsMesh;
}

interface P07ConvexSolidsBuilder {
  triangle(
    a: P07ConvexSolidsVec3,
    b: P07ConvexSolidsVec3,
    c: P07ConvexSolidsVec3,
    meta?: P07ConvexSolidsMeta,
    coords?: P07ConvexSolidsTriangleVec2
  ): void;
  append(mesh: P07ConvexSolidsMesh): void;
  finish(): P07ConvexSolidsMesh;
}

interface P07ConvexSolidsGeometryApi {
  builder(): P07ConvexSolidsBuilder;
}

interface P07ConvexSolidsSpatialApi {
  boxOf(points: readonly P07ConvexSolidsVec3[]): P07ConvexSolidsBounds;
  contains(bounds: P07ConvexSolidsBounds, point: readonly number[]): boolean;
  rayBox(
    bounds: P07ConvexSolidsBounds,
    origin: P07ConvexSolidsVec3,
    dir: P07ConvexSolidsVec3,
    max: number
  ): number | null;
}

interface P07ConvexSolidsPiecesApi {
  convex(
    vertices: P07ConvexSolidsVec3[],
    polygons: readonly number[][],
    meta?: P07ConvexSolidsMeta
  ): P07ConvexSolidsPiece;
  box(
    center: P07ConvexSolidsVec3,
    half: P07ConvexSolidsVec3,
    frame: P07ConvexSolidsMatrix,
    meta?: P07ConvexSolidsMeta
  ): P07ConvexSolidsPiece;
  beam(
    a: P07ConvexSolidsVec3,
    b: P07ConvexSolidsVec3,
    width: number,
    depth: number,
    meta?: P07ConvexSolidsMeta
  ): P07ConvexSolidsPiece;
  union(pieces: P07ConvexSolidsPiece[]): P07ConvexSolidsUnion;
  tube(
    a: P07ConvexSolidsVec3,
    b: P07ConvexSolidsVec3,
    radius: number,
    meta?: P07ConvexSolidsMeta,
    sides?: number
  ): P07ConvexSolidsPiece;
  boxFaces: readonly number[][];
}

interface P07ConvexSolidsProceduralApi {
  geometry: P07ConvexSolidsGeometryApi;
  spatial: P07ConvexSolidsSpatialApi;
  pieces: P07ConvexSolidsPiecesApi;
}

interface P07ConvexSolidsVectorApi {
  add(a: readonly number[], b: readonly number[]): P07ConvexSolidsVec3;
  sub(a: readonly number[], b: readonly number[]): P07ConvexSolidsVec3;
  mul(v: readonly number[], scale: number): P07ConvexSolidsVec3;
  cross(a: readonly number[], b: readonly number[]): P07ConvexSolidsVec3;
  dot(a: readonly number[], b: readonly number[]): number;
  len(v: readonly number[]): number;
  norm(v: readonly number[]): P07ConvexSolidsVec3;
  dist(a: readonly number[], b: readonly number[]): number;
  mad(a: readonly number[], b: readonly number[], scale: number): P07ConvexSolidsVec3;
}

interface P07ConvexSolidsMatrixApi {
  det(frame: P07ConvexSolidsMatrix): number;
  app(frame: P07ConvexSolidsMatrix, point: readonly number[]): P07ConvexSolidsVec3;
  cols(x: readonly number[], y: readonly number[], z: readonly number[]): P07ConvexSolidsMatrix;
}

interface P07ConvexSolidsKitHost {
  procedural: P07ConvexSolidsProceduralApi;
  V: P07ConvexSolidsVectorApi;
  M: P07ConvexSolidsMatrixApi;
}

declare const KIT: P07ConvexSolidsKitHost;

(function (K: P07ConvexSolidsKitHost) {
  const A = K.procedural,
    V = K.V,
    M = K.M,
    EPS = 1e-7,
    vector = (p: unknown): p is P07ConvexSolidsVec3 => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite),
    faces: number[][] = [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7]
    ];
  function convex(
    vertices: P07ConvexSolidsVec3[],
    polygons: readonly number[][],
    meta: P07ConvexSolidsMeta = {}
  ): P07ConvexSolidsPiece {
    if (
      !Array.isArray(vertices) ||
      vertices.length < 4 ||
      vertices.length > 256 ||
      !vertices.every(vector) ||
      !Array.isArray(polygons) ||
      polygons.length < 4
    )
      throw new Error('Construction pieces need finite convex vertices and faces');
    const center = V.mul(
        vertices.reduce<P07ConvexSolidsVec3>((p, q) => V.add(p, q), [0, 0, 0]),
        1 / vertices.length
      ),
      planes: P07ConvexSolidsPlane[] = [],
      builder = A.geometry.builder(),
      info = Object.assign({ owner: '', key: 'body', material: 'default' }, meta);
    for (const indices of polygons) {
      if (
        !Array.isArray(indices) ||
        indices.length < 3 ||
        indices.some(i => !Number.isInteger(i) || i < 0 || i >= vertices.length)
      )
        throw new Error('Invalid construction face');
      let points = indices.map(i => vertices[i]),
        cross = V.cross(V.sub(points[1], points[0]), V.sub(points[2], points[0]));
      if (V.len(cross) < EPS) throw new Error('Degenerate construction face');
      let n = V.norm(cross);
      if (V.dot(n, V.sub(points[0], center)) < 0) {
        points = points.slice().reverse();
        n = V.mul(n, -1);
      }
      const offset = V.dot(n, points[0]);
      if (
        vertices.some(p => V.dot(n, p) > offset + EPS * 10) ||
        points.some(p => Math.abs(V.dot(n, p) - offset) > EPS * 10)
      )
        throw new Error('Construction faces must enclose a convex volume');
      if (!planes.some(p => V.dist(p.normal, n) < EPS && Math.abs(p.offset - offset) < EPS))
        planes.push({ normal: n, offset });
      const X = V.norm(V.sub(points[1], points[0])),
        Y = V.cross(n, X),
        uv = (p: P07ConvexSolidsVec3): P07ConvexSolidsVec2 => [
          V.dot(V.sub(p, points[0]), X),
          V.dot(V.sub(p, points[0]), Y)
        ];
      for (let j = 1; j < points.length - 1; j++)
        builder.triangle(
          points[0],
          points[j],
          points[j + 1],
          { owner: info.owner, surface: info.key, material: info.material },
          [uv(points[0]), uv(points[j]), uv(points[j + 1])] as P07ConvexSolidsTriangleVec2
        );
    }
    if (planes.length < 4 || planes.some(p => V.dot(p.normal, center) >= p.offset - EPS))
      throw new Error('Construction pieces need nonzero enclosed volume');
    const mesh = builder.finish(),
      bounds = mesh.bounds!;
    const distance = (p: P07ConvexSolidsVec3) => {
      let d = -Infinity;
      const x = p[0],
        y = p[1],
        z = p[2];
      for (const q of planes) d = Math.max(d, q.normal[0] * x + q.normal[1] * y + q.normal[2] * z - q.offset);
      return d;
    };
    function intersections(origin: P07ConvexSolidsVec3, dir: P07ConvexSolidsVec3, max = 10000): P07ConvexSolidsHit[] {
      let low = 0,
        high = max,
        entry: P07ConvexSolidsVec3 | null = null,
        exit: P07ConvexSolidsVec3 | null = null;
      for (const p of planes) {
        const den = V.dot(p.normal, dir),
          d = p.offset - V.dot(p.normal, origin);
        if (Math.abs(den) < EPS) {
          if (d < 0) return [];
          continue;
        }
        const t = d / den;
        if (den < 0) {
          if (t > low) {
            low = t;
            entry = p.normal;
          }
        } else if (t < high) {
          high = t;
          exit = p.normal;
        }
        if (low > high) return [];
      }
      return (
        [
          [low, entry],
          [high, exit]
        ] as P07ConvexSolidsIntersection[]
      )
        .filter(([t, n]) => n && t >= 0 && t <= max)
        .map(([distance, n]) => ({
          distance,
          n: n!,
          p: V.mad(origin, dir, distance),
          part: info.key,
          material: info.material
        }));
    }
    function sample(spacing: number, emit: (point: P07ConvexSolidsVec3) => void) {
      if (!Number.isFinite(spacing) || spacing <= 0 || typeof emit !== 'function')
        throw new Error('Construction sampling needs positive spacing and a callback');
      for (let i = 0; i < mesh.positions.length; i += 9) {
        const points = [0, 1, 2].map(
            j => Array.from(mesh.positions.slice(i + j * 3, i + j * 3 + 3)) as P07ConvexSolidsVec3
          ),
          order = [
            [0, 1, 2],
            [1, 2, 0],
            [2, 0, 1]
          ].sort((a, b) => V.dist(points[b[0]], points[b[1]]) - V.dist(points[a[0]], points[a[1]]))[0],
          p = order.map(j => points[j]),
          edge = V.sub(p[1], p[0]),
          rise = V.sub(p[2], p[0]),
          length = V.len(edge),
          axis = V.norm(edge),
          height = V.len(V.sub(rise, V.mul(axis, V.dot(rise, axis)))),
          rows = Math.max(1, Math.ceil(height / spacing));
        for (let row = 0; row <= rows; row++) {
          const t = row / rows,
            columns = Math.max(1, Math.ceil(((1 - t) * length) / spacing));
          for (let col = 0; col <= (row === rows ? 0 : columns); col++)
            emit(V.add(p[0], V.add(V.mul(edge, ((1 - t) * col) / columns), V.mul(rise, t))));
        }
      }
    }
    return Object.freeze(Object.assign({}, info, { mesh, bounds, planes, distance, intersections, sample }));
  }
  function box(
    center: P07ConvexSolidsVec3,
    half: P07ConvexSolidsVec3,
    frame: P07ConvexSolidsMatrix,
    meta?: P07ConvexSolidsMeta
  ) {
    if (
      !vector(center) ||
      !vector(half) ||
      half.some(v => v <= 0) ||
      !Array.isArray(frame) ||
      frame.length !== 9 ||
      !frame.every(Number.isFinite) ||
      Math.abs(M.det(frame)) < EPS
    )
      throw new Error('Boxes need positive dimensions and a nonsingular frame');
    const vertices: P07ConvexSolidsVec3[] = [];
    for (const z of [-1, 1])
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1]
      ])
        vertices.push(V.add(center, M.app(frame, [x * half[0], y * half[1], z * half[2]])));
    return convex(vertices, faces, meta);
  }
  function beam(
    a: P07ConvexSolidsVec3,
    b: P07ConvexSolidsVec3,
    width: number,
    depth: number,
    meta?: P07ConvexSolidsMeta
  ) {
    if (
      !vector(a) ||
      !vector(b) ||
      V.dist(a, b) < EPS ||
      !Number.isFinite(width) ||
      !Number.isFinite(depth) ||
      width <= 0 ||
      depth <= 0
    )
      throw new Error('Beams need distinct finite ends and positive dimensions');
    const X = V.norm(V.sub(b, a)),
      Y = V.norm(V.cross(Math.abs(X[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], X)),
      Z = V.cross(X, Y);
    return box(V.mul(V.add(a, b), 0.5), [V.dist(a, b) / 2, width / 2, depth / 2], M.cols(X, Y, Z), meta);
  }
  function union(pieces: P07ConvexSolidsPiece[]): P07ConvexSolidsUnion {
    if (!Array.isArray(pieces) || !pieces.length) throw new Error('A construction union needs pieces');
    const bounds = A.spatial.boxOf(pieces.flatMap(p => [p.bounds.min, p.bounds.max]));
    if (new Set(pieces.map(p => p.key)).size !== pieces.length)
      throw new Error('Construction unions need unique piece keys');
    const cell = Math.max(0.25, Math.min(2, V.dist(bounds.min, bounds.max) / 12)),
      grid = new Map<string, P07ConvexSolidsPiece[]>(),
      large: P07ConvexSolidsPiece[] = [];
    let assignments = 0;
    const key = (x: number, y: number, z: number) => x + '/' + y + '/' + z;
    for (const part of pieces) {
      const lo = part.bounds.min.map(v => Math.floor((v - EPS) / cell)),
        hi = part.bounds.max.map(v => Math.floor((v + EPS) / cell)),
        count = (hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1);
      if (count > 4096 || assignments + count > 100000) {
        large.push(part);
        continue;
      }
      assignments += count;
      for (let x = lo[0]; x <= hi[0]; x++)
        for (let y = lo[1]; y <= hi[1]; y++)
          for (let z = lo[2]; z <= hi[2]; z++) {
            const k = key(x, y, z);
            if (!grid.has(k)) grid.set(k, []);
            grid.get(k)!.push(part);
          }
    }
    function hidden(exclude: string | null, point: P07ConvexSolidsVec3, tolerance = 0.002) {
      const [x, y, z] = point;
      const candidates = grid.get(key(Math.floor(x / cell), Math.floor(y / cell), Math.floor(z / cell)));
      if (candidates)
        for (const p of candidates)
          if (p.key !== exclude && A.spatial.contains(p.bounds, point) && p.distance(point) < -tolerance) return true;
      for (const p of large)
        if (p.key !== exclude && A.spatial.contains(p.bounds, point) && p.distance(point) < -tolerance) return true;
      return false;
    }
    return {
      bounds,
      hidden,
      contains(point, tolerance = 0.002) {
        if (!vector(point) || !Number.isFinite(tolerance) || tolerance < 0)
          throw new Error('Containment needs a finite point and nonnegative depth');
        return hidden(null, point, tolerance);
      },
      distance(point) {
        let d = Infinity;
        for (const part of pieces) {
          if (d < 0 && !A.spatial.contains(part.bounds, point)) continue;
          d = Math.min(d, part.distance(point));
        }
        return d;
      },
      raycast(origin, direction, max = 10000) {
        if (!vector(origin) || !vector(direction) || V.len(direction) < EPS || !Number.isFinite(max) || max <= 0)
          throw new Error('Construction rays need finite vectors and positive reach');
        const dir = V.norm(direction),
          hits: P07ConvexSolidsHit[] = [];
        for (const part of pieces)
          if (A.spatial.rayBox(part.bounds, origin, dir, max) !== null)
            hits.push(...part.intersections(origin, dir, max));
        hits.sort((a, b) => a.distance - b.distance);
        return hits.find(hit => !hidden(hit.part, hit.p, EPS * 10)) || null;
      },
      mesh() {
        const out = A.geometry.builder();
        for (const p of pieces) out.append(p.mesh);
        return out.finish();
      }
    };
  }
  function tube(
    a: P07ConvexSolidsVec3,
    b: P07ConvexSolidsVec3,
    radius: number,
    meta: P07ConvexSolidsMeta = {},
    sides = 8
  ) {
    if (
      !vector(a) ||
      !vector(b) ||
      V.dist(a, b) < EPS ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      !Number.isInteger(sides) ||
      sides < 3 ||
      sides > 32
    )
      throw new Error('Tubes need distinct finite ends, a positive radius and 3..32 sides');
    const axis = V.norm(V.sub(b, a)),
      x = V.norm(V.cross(Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], axis)),
      y = V.cross(axis, x),
      vertices: P07ConvexSolidsVec3[] = [],
      polygons: number[][] = [];
    for (const p of [a, b])
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        vertices.push(V.add(p, V.add(V.mul(x, radius * Math.cos(angle)), V.mul(y, radius * Math.sin(angle)))));
      }
    polygons.push(
      Array.from({ length: sides }, (_, i) => i),
      Array.from({ length: sides }, (_, i) => i + sides)
    );
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      polygons.push([i, j, j + sides, i + sides]);
    }
    return convex(vertices, polygons, meta);
  }
  A.pieces = { convex, box, beam, tube, union, boxFaces: faces };
})(KIT);

export {};
